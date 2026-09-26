import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  journalSchema,
  packJournal,
  type Journal,
  type Workspace,
} from "../../shared/journal";
import {
  conflicts as conflictsOf,
  digest,
  mergeWorkspace,
  type Conflict,
} from "../../shared/sync";
import { versionVector, type VersionVector } from "../../shared/stamps";
import { stampSchema } from "../../shared/hlc";
import {
  answerHello,
  localChanges,
  newMemory,
  noteReceived,
  partialIds,
  summarise,
  usable,
  type PeerMemory,
  type Summary,
} from "../../shared/protocol";
import { parseTolerant } from "../../shared/tolerant";
import {
  ephemeralWire,
  isEphemeral,
  readEphemeral,
  type EphemeralWire,
} from "../../shared/ephemeral";
import {
  PEER_ID,
  PROTOCOL,
  Reassembler,
  roomKeys,
  sealFrames,
  type RoomKeys,
} from "../../shared/room";

// Live synchronisation of a session between posts, through the relay of the
// site (or of a post serving the local network). Messages are end-to-end
// encrypted with the session code; the relay forwards them and stores nothing.
//
// Protocol (version PROTOCOL, in every message):
// - hello: who I am, and for each journal its digest and version vector
//   (latest stamp seen of each post). Sent to everyone on connection and
//   every 40 s; answered, to the sender only, when something differs.
// - state: journals, whole or only what the recipient lacks (sliceJournal
//   against its version vector), and the removed journals. A peer whose
//   digest did not move after a partial state gets the whole journal.
// - presence, bye.
// - eph: ephemeral messages (shared/ephemeral.ts), handed to the listeners
//   of their kind and nothing else: never merged, stored or in the digests.
// Large messages are split into parts (shared/room.ts), so no frame ever
// reaches the limit of the relay.

export type SyncStatus =
  "off" | "connecting" | "live" | "retrying" | "outdated";
export type Presence = {
  peer: string;
  name: string;
  module: string;
  journal: string;
  at: number;
};
/** A journal received from another post and refused, with the reason. */
export type Rejected = {
  at: number;
  from: string;
  journal: string;
  reason: string;
};
type Wire =
  | {
      type: "hello";
      v: number;
      peer: string;
      name: string;
      module: string;
      journal: string;
      journals: Summary;
      gone?: Record<string, string>;
      reply?: boolean;
    }
  | {
      type: "state";
      v: number;
      peer: string;
      name: string;
      journals: unknown[];
      gone?: Record<string, string>;
      digests?: Record<string, string>;
      /** Journals sent as parts (what the recipient lacks). */
      partial?: string[];
    }
  | {
      type: "presence";
      v: number;
      peer: string;
      name: string;
      module: string;
      journal: string;
    }
  | { type: "bye"; v: number; peer: string }
  | EphemeralWire;

const HEARTBEAT = 40_000;
/** A connection that lasted this long resets the reconnection delay. */
const STABLE = 30_000;
const MAX_DELAY = 30_000;
/** Answers to one post: at most one hello per interval. */
const REPLY_INTERVAL = 3_000;
const BUFFERED = 1_000_000;

const NEWER =
  "Un poste utilise une version plus récente d’orion aic — rechargez la page.";
const OLDER_PAGE =
  "Cette page utilise une version plus ancienne d’orion aic — rechargez la page.";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Removed journals received: valid ids and stamps only. */
function goneOf(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const stamp = stampSchema.safeParse(v);
    if (stamp.success && /^[0-9a-f-]{36}$/.test(k)) out[k] = stamp.data;
  }
  return out;
}
const reasonOf = (issues: { path: PropertyKey[]; message: string }[]) =>
  issues
    .slice(0, 2)
    .map((i) => `${i.path.map(String).join(".") || "journal"} : ${i.message}`)
    .join(" ; ");

const seenKey = "orion-sync-conflicts-seen";
const loadSeen = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey) ?? "[]"));
  } catch {
    return new Set();
  }
};
/** Stable id of a conflict, to mark it as seen on this post. */
export const conflictId = (c: Conflict) =>
  c.kind === "collision"
    ? `${c.journalId}:${c.scope}:${c.number}:${c.items.length}`
    : `${c.journalId}:${c.target}:${c.kept.id}:${c.overwritten.map((o) => o.id).join(",")}`;

/** Listener of the ephemeral messages of one kind. */
export type EphemeralHandler = (
  data: unknown,
  from: { peer: string; name: string },
) => void;

export function useSync(options: {
  code: string | null;
  workspace: Workspace | null;
  author: string;
  module: string;
  localTick: number;
  takeDirty: () => string[];
  applyRemote: (update: (previous: Workspace) => Workspace) => void;
  onJoin?: (remote: Pick<Workspace, "journals" | "gone">) => void;
  onRemoteEntries?: (journalId: string, entryIds: string[]) => void;
}) {
  const [status, setStatus] = useState<SyncStatus>("off");
  const [relayCount, setRelayCount] = useState(0);
  const [peers, setPeers] = useState<Presence[]>([]);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [rejected, setRejected] = useState<Rejected[]>([]);
  const latest = useRef(options);
  latest.current = options;
  const peerId = useRef(crypto.randomUUID());
  const channel = useRef<{
    socket: WebSocket;
    keys: RoomKeys;
    send: (wire: Wire, to?: string) => Promise<void>;
  } | null>(null);
  const joined = useRef(false);
  // What every post has been sent (or sent us), by journal: a local change
  // leaves as the difference.
  const announced = useRef(new Map<string, VersionVector>());
  const flushRef = useRef<(() => Promise<void>) | null>(null);
  // Ephemeral messages: listeners by kind.
  const ephemeral = useRef(new Map<string, Set<EphemeralHandler>>());

  const reject = useCallback((item: Omit<Rejected, "at">) => {
    setRejected((list) => [{ ...item, at: Date.now() }, ...list].slice(0, 50));
  }, []);

  const { code } = options;
  useEffect(() => {
    if (!code) {
      setStatus("off");
      setPeers([]);
      setRelayCount(0);
      return;
    }
    let stopped = false;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stableTimer: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    joined.current = false;
    // Per peer (relay id): last hello answered, what was sent to it.
    const replied = new Map<string, number>();
    const memory = new Map<string, PeerMemory>();
    const names = new Map<string, string>();

    const workspace = () => latest.current.workspace;
    const journals = () => workspace()?.journals ?? [];
    const summary = () => summarise(journals());
    const base = () => ({
      v: PROTOCOL,
      peer: peerId.current,
      name: latest.current.author,
    });
    const hello = async (reply: boolean, to = "") => {
      const ch = channel.current;
      if (!ch) return;
      await ch.send(
        {
          ...base(),
          type: "hello",
          module: latest.current.module,
          journal: workspace()?.activeId ?? "",
          journals: await summary(),
          gone: workspace()?.gone,
          reply,
        },
        to,
      );
    };
    const sendState = async (list: Journal[], to = "") => {
      const ch = channel.current;
      const ws = workspace();
      if (!ch || !ws) return;
      const digests = Object.fromEntries(
        await Promise.all(list.map(async (j) => [j.id, await digest(j)])),
      );
      await ch.send(
        {
          ...base(),
          type: "state",
          journals: list.map(packJournal),
          gone: ws.gone,
          digests,
          partial: partialIds(list),
        },
        to,
      );
      setLastSync(Date.now());
    };
    const seen = (p: Omit<Presence, "at">) =>
      setPeers((list) => [
        ...list.filter((x) => x.peer !== p.peer),
        { ...p, at: Date.now() },
      ]);

    /** What peer `from` lacks, after its hello. */
    async function answer(
      wire: Extract<Wire, { type: "hello" }>,
      from: string,
    ) {
      const peer = memory.get(from) ?? newMemory();
      memory.set(from, peer);
      const { send, differ } = await answerHello(
        journals(),
        workspace()?.gone,
        wire.journals ?? {},
        peer,
      );
      if (send.length) await sendState(send, from);
      const last = replied.get(from) ?? 0;
      if (!wire.reply || (differ && Date.now() - last > REPLY_INTERVAL)) {
        replied.set(from, Date.now());
        await hello(true, from);
      }
    }

    function versionOf(wire: { v?: unknown }) {
      const v = typeof wire.v === "number" ? wire.v : 1;
      if (v > PROTOCOL) {
        setStatus("outdated");
        setError(NEWER);
        return false;
      }
      return true;
    }

    async function receive(wire: Wire, from: string) {
      if (!wire || typeof wire !== "object" || wire.peer === peerId.current)
        return;
      if (!versionOf(wire)) return;
      if (isEphemeral(wire)) {
        const message = readEphemeral(wire);
        if (!message) return;
        for (const handler of ephemeral.current.get(message.kind) ?? [])
          handler(message.data, { peer: message.peer, name: message.name });
        return;
      }
      if ("name" in wire && typeof wire.name === "string")
        names.set(from, wire.name);
      if (wire.type === "bye") {
        setPeers((list) => list.filter((x) => x.peer !== wire.peer));
        return;
      }
      if (wire.type === "presence") {
        seen(wire);
        return;
      }
      if (wire.type === "hello") {
        seen(wire);
        const gone = goneOf(wire.gone);
        if (Object.keys(gone).length && workspace())
          await apply([], gone, from, {});
        await answer(wire, from);
        return;
      }
      if (wire.type !== "state") return;
      const list: Journal[] = [];
      for (const raw of wire.journals ?? []) {
        const parsed = parseTolerant(journalSchema, raw);
        if (parsed.success) list.push(parsed.data as Journal);
        else {
          const title =
            raw && typeof raw === "object" && "title" in raw
              ? String((raw as { title: unknown }).title).slice(0, 80)
              : "journal";
          reject({
            from: wire.name || names.get(from) || "Poste inconnu",
            journal: title,
            reason: reasonOf(parsed.error.issues),
          });
        }
      }
      const local = workspace();
      const { journals: whole, missing } = usable(
        (local?.journals ?? []).map((j) => j.id),
        list,
        Array.isArray(wire.partial) ? wire.partial.map(String) : [],
      );
      await apply(whole, goneOf(wire.gone), from, wire.digests ?? {});
      // Parts of journals this post lacks: ask for the whole ones.
      if (missing.length) {
        replied.set(from, Date.now());
        await hello(true, from);
      }
    }

    async function apply(
      list: Journal[],
      gone: Record<string, string>,
      from: string,
      digests: Record<string, string>,
    ) {
      const local = workspace();
      if (!local) {
        if (!joined.current && list.length && latest.current.onJoin) {
          joined.current = true;
          latest.current.onJoin({ journals: list, gone });
          setLastSync(Date.now());
        }
        return;
      }
      let merged: Workspace;
      try {
        merged = mergeWorkspace(local, { journals: list, gone });
      } catch (err) {
        reject({
          from: names.get(from) || "Poste inconnu",
          journal: list.map((j) => j.title).join(", ") || "session",
          reason: (err as Error).message,
        });
        return;
      }
      if (!list.length && merged.journals.length === local.journals.length)
        if (JSON.stringify(merged.gone) === JSON.stringify(local.gone)) return;
      latest.current.applyRemote((previous) =>
        mergeWorkspace(previous, { journals: list, gone }),
      );
      setLastSync(Date.now());
      // What the others were told by this message.
      noteReceived(list, announced.current);
      // Entries that just arrived from another post.
      for (const j of merged.journals) {
        const before = local.journals.find((x) => x.id === j.id);
        if (!before) continue;
        const known = new Set(before.entries.map((e) => e.id));
        const fresh = j.entries
          .filter((e) => !known.has(e.id))
          .map((e) => e.id);
        if (fresh.length) latest.current.onRemoteEntries?.(j.id, fresh);
      }
      // Still different from the sender: tell it what we have.
      let differ = false;
      for (const [id, d] of Object.entries(digests)) {
        const mine = merged.journals.find((x) => x.id === id);
        if (mine && (await digest(mine)) !== d) differ = true;
      }
      const last = replied.get(from) ?? 0;
      if (differ && Date.now() - last > REPLY_INTERVAL) {
        replied.set(from, Date.now());
        await hello(true, from);
      }
    }

    /** Local changes: what the other posts were not sent yet. */
    async function flush() {
      const ch = channel.current;
      const ws = workspace();
      if (!ch || !ws) return;
      const ids = latest.current.takeDirty();
      if (!ids.length) return;
      const list = localChanges(ws.journals, ids, announced.current);
      if (list.length || ids.includes("*")) await sendState(list);
    }
    flushRef.current = flush;

    async function connect() {
      if (stopped) return;
      setStatus(retry ? "retrying" : "connecting");
      let keys: RoomKeys;
      try {
        keys = await roomKeys(code!);
      } catch {
        setError("Chiffrement indisponible : ouvrez orion aic en HTTPS.");
        setStatus("off");
        return;
      }
      if (stopped) return;
      const scheme = location.protocol === "https:" ? "wss" : "ws";
      // The room id goes in the first message, never in the URL (proxies
      // log URLs).
      const socket = new WebSocket(`${scheme}://${location.host}/sync`);
      socket.binaryType = "arraybuffer";
      const parts = new Reassembler(keys.key);
      let queue = Promise.resolve();
      let fatal = false;
      const send = async (wire: Wire, to = "") => {
        if (socket.readyState !== WebSocket.OPEN) return;
        const frames = await sealFrames(wire, keys.key, to);
        for (const frame of frames) {
          while (
            socket.readyState === WebSocket.OPEN &&
            socket.bufferedAmount > BUFFERED
          )
            await sleep(25);
          if (socket.readyState !== WebSocket.OPEN) return;
          socket.send(frame);
        }
      };
      socket.addEventListener("open", () => {
        if (stopped) return socket.close();
        socket.send(
          JSON.stringify({ t: "join", room: keys.room, v: PROTOCOL }),
        );
      });
      socket.addEventListener("message", (event) => {
        if (typeof event.data === "string") {
          let data: {
            t?: string;
            n?: number;
            id?: string;
            code?: string;
            v?: number;
          };
          try {
            data = JSON.parse(event.data);
          } catch {
            return;
          }
          if (data.t === "peers") setRelayCount(Math.max(0, (data.n ?? 1) - 1));
          else if (data.t === "welcome") {
            channel.current = { socket, keys, send };
            setStatus("live");
            setError("");
            // The delay goes back to its minimum once the link holds.
            clearTimeout(stableTimer);
            stableTimer = setTimeout(() => {
              retry = 0;
            }, STABLE);
            // Changes made offline first, then what the others lack (the
            // hellos compare everything else).
            void flush().then(() => {
              for (const j of journals())
                if (!announced.current.has(j.id))
                  announced.current.set(j.id, versionVector(j));
              return hello(false);
            });
            clearInterval(heartbeat);
            heartbeat = setInterval(() => {
              void hello(true);
              setPeers((list) =>
                list.filter((p) => Date.now() - p.at < 2.2 * HEARTBEAT),
              );
            }, HEARTBEAT);
          } else if (data.t === "error") {
            if (data.code === "version") {
              fatal = true;
              setStatus("outdated");
              setError((data.v ?? 0) > PROTOCOL ? OLDER_PAGE : NEWER);
            } else if (data.code === "rate" || data.code === "busy")
              setError(
                "Relais saturé : nouvelle tentative de connexion dans quelques secondes.",
              );
            else if (data.code === "full")
              setError("Session complète : 64 postes au plus sur le relais.");
          }
          return;
        }
        const bytes = new Uint8Array(event.data as ArrayBuffer);
        queue = queue.then(async () => {
          let message: { from: string; value: unknown } | undefined;
          try {
            message = await parts.accept(bytes);
          } catch {
            setError(
              "Message illisible reçu : un autre poste utilise-t-il un autre code ?",
            );
            return;
          }
          if (!message || !PEER_ID.test(message.from)) return;
          try {
            await receive(message.value as Wire, message.from);
          } catch (err) {
            reject({
              from: names.get(message.from) || "Poste inconnu",
              journal: "message",
              reason: (err as Error).message,
            });
          }
        });
      });
      socket.addEventListener("close", () => {
        if (channel.current?.socket === socket) channel.current = null;
        clearInterval(heartbeat);
        clearTimeout(stableTimer);
        setRelayCount(0);
        if (stopped) return;
        if (fatal) return;
        setStatus("retrying");
        retry++;
        // Exponential, with jitter so that posts do not come back together.
        const delay = Math.min(MAX_DELAY, 800 * 2 ** Math.min(retry, 6));
        retryTimer = setTimeout(
          connect,
          delay / 2 + Math.random() * (delay / 2),
        );
      });
    }
    void connect();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      clearTimeout(stableTimer);
      clearInterval(heartbeat);
      flushRef.current = null;
      const ch = channel.current;
      if (ch) {
        void ch
          .send({ type: "bye", v: PROTOCOL, peer: peerId.current })
          .finally(() => ch.socket.close());
      }
      channel.current = null;
      // Another code, other posts: nothing was sent to them yet.
      announced.current.clear();
      setStatus("off");
      setPeers([]);
    };
  }, [code, reject]);

  // Local changes leave shortly after the last keystroke. Offline, they
  // wait (nothing is taken) and leave on reconnection.
  const { localTick } = options;
  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => {
      if (channel.current) void flushRef.current?.();
    }, 300);
    return () => clearTimeout(timer);
  }, [localTick, code]);

  // Where this post is working, for the other posts.
  const { module, workspace } = options;
  const activeId = workspace?.activeId ?? "";
  useEffect(() => {
    const ch = channel.current;
    if (!ch) return;
    void ch.send({
      type: "presence",
      v: PROTOCOL,
      peer: peerId.current,
      name: latest.current.author,
      module,
      journal: activeId,
    });
  }, [module, activeId, status]);

  // What the merges did (numbers shared, concurrent changes), computed
  // once the session is quiet.
  const [found, setFound] = useState<Conflict[]>([]);
  const journalsNow = workspace?.journals;
  useEffect(() => {
    if (!journalsNow) {
      setFound([]);
      return;
    }
    const timer = setTimeout(
      () => setFound(journalsNow.flatMap((j) => conflictsOf(j))),
      1200,
    );
    return () => clearTimeout(timer);
  }, [journalsNow]);
  const [seenIds, setSeenIds] = useState(loadSeen);
  const markSeen = useCallback((ids: string[]) => {
    setSeenIds((previous) => {
      const next = new Set([...previous, ...ids]);
      try {
        localStorage.setItem(seenKey, JSON.stringify([...next].slice(-2000)));
      } catch {
        // Private window: the mark lasts until the page closes.
      }
      return next;
    });
  }, []);
  const conflictCount = useMemo(
    () =>
      found.filter((c) => !seenIds.has(conflictId(c))).length + rejected.length,
    [found, seenIds, rejected],
  );

  /**
   * Send an ephemeral message to the connected posts (or to the post of
   * relay id `to`); false when not connected (nothing is kept for later).
   */
  const sendEphemeral = useCallback(
    async (kind: string, data: unknown, to = "") => {
      const ch = channel.current;
      if (!ch) return false;
      await ch.send(
        ephemeralWire(
          { v: PROTOCOL, peer: peerId.current, name: latest.current.author },
          kind,
          data,
        ),
        to,
      );
      return true;
    },
    [],
  );
  /** Listen to the ephemeral messages of `kind`; returns the unsubscribe. */
  const onEphemeral = useCallback((kind: string, handler: EphemeralHandler) => {
    const map = ephemeral.current;
    const set = map.get(kind) ?? new Set<EphemeralHandler>();
    set.add(handler);
    map.set(kind, set);
    return () => {
      set.delete(handler);
      if (!set.size) map.delete(kind);
    };
  }, []);

  return {
    status,
    relayCount,
    peers,
    lastSync,
    error,
    peerId: peerId.current,
    conflicts: found,
    rejected,
    conflictCount,
    seen: seenIds,
    markSeen,
    clearRejected: () => setRejected([]),
    sendEphemeral,
    onEphemeral,
  };
}
