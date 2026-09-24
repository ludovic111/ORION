import { useEffect, useRef, useState } from "react";
import {
  journalSchema,
  type Journal,
  type Workspace,
} from "../../shared/journal";
import { digest, mergeWorkspace } from "../../shared/sync";
import { roomKeys, seal, unseal, type RoomKeys } from "../../shared/room";

// Live synchronisation of a session between posts, through the relay of the
// site (or of a post serving the local network). Messages are end-to-end
// encrypted with the session code; the relay forwards them and stores nothing.

export type SyncStatus = "off" | "connecting" | "live" | "retrying";
export type Presence = {
  peer: string;
  name: string;
  module: string;
  journal: string;
  at: number;
};
type Wire =
  | {
      type: "hello";
      peer: string;
      name: string;
      module: string;
      journal: string;
      digests: Record<string, string>;
      reply?: boolean;
    }
  | {
      type: "state";
      peer: string;
      name: string;
      journals: unknown[];
      gone?: Record<string, string>;
    }
  | {
      type: "presence";
      peer: string;
      name: string;
      module: string;
      journal: string;
    }
  | { type: "bye"; peer: string };

const digests = new WeakMap<Journal, Promise<string>>();
const fingerprint = (j: Journal) => {
  let value = digests.get(j);
  if (!value) {
    value = digest(j);
    digests.set(j, value);
  }
  return value;
};

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
  const latest = useRef(options);
  latest.current = options;
  const peerId = useRef(crypto.randomUUID());
  const channel = useRef<{
    socket: WebSocket;
    keys: RoomKeys;
    send: (wire: Wire) => Promise<void>;
  } | null>(null);
  const echo = useRef(new Set<string>());
  const echoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const joined = useRef(false);

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
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    joined.current = false;

    const localJournals = () => latest.current.workspace?.journals ?? [];
    const sendState = async (ids: string[] | "all", withGone = false) => {
      const ch = channel.current;
      const ws = latest.current.workspace;
      if (!ch || !ws) return;
      const journals =
        ids === "all"
          ? ws.journals
          : ws.journals.filter((j) => ids.includes(j.id));
      if (!journals.length && !withGone) return;
      await ch.send({
        type: "state",
        peer: peerId.current,
        name: latest.current.author,
        journals,
        gone: ws.gone,
      });
      setLastSync(Date.now());
    };
    const hello = async (reply = false) => {
      const ch = channel.current;
      if (!ch) return;
      const entries = await Promise.all(
        localJournals().map(async (j) => [j.id, await fingerprint(j)] as const),
      );
      await ch.send({
        type: "hello",
        peer: peerId.current,
        name: latest.current.author,
        module: latest.current.module,
        journal: latest.current.workspace?.activeId ?? "",
        digests: Object.fromEntries(entries),
        reply,
      });
    };
    const seen = (p: Omit<Presence, "at">) =>
      setPeers((list) => [
        ...list.filter((x) => x.peer !== p.peer),
        { ...p, at: Date.now() },
      ]);

    async function receive(wire: Wire) {
      if (!wire || typeof wire !== "object" || wire.peer === peerId.current)
        return;
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
        const theirs = wire.digests ?? {};
        const differ: string[] = [];
        for (const j of localJournals())
          if (theirs[j.id] !== (await fingerprint(j))) differ.push(j.id);
        if (differ.length) await sendState(differ);
        if (!wire.reply) await hello(true);
        return;
      }
      if (wire.type !== "state") return;
      const journals: Journal[] = [];
      for (const raw of wire.journals ?? []) {
        const parsed = journalSchema.safeParse(raw);
        if (parsed.success) journals.push(parsed.data);
      }
      const gone = wire.gone ?? {};
      const local = latest.current.workspace;
      if (!local) {
        if (!joined.current && journals.length && latest.current.onJoin) {
          joined.current = true;
          latest.current.onJoin({ journals, gone });
          setLastSync(Date.now());
        }
        return;
      }
      let merged: Workspace;
      try {
        merged = mergeWorkspace(local, { journals, gone });
      } catch (err) {
        setError(
          `Synchronisation : données reçues refusées (${(err as Error).message}).`,
        );
        return;
      }
      setError("");
      latest.current.applyRemote((previous) =>
        mergeWorkspace(previous, { journals, gone }),
      );
      setLastSync(Date.now());
      // Entries that just arrived from another post.
      for (const j of merged.journals) {
        const before = local.journals.find((x) => x.id === j.id);
        const known = new Set(before?.entries.map((e) => e.id));
        const fresh = j.entries
          .filter((e) => !known.has(e.id))
          .map((e) => e.id);
        if (fresh.length && before)
          latest.current.onRemoteEntries?.(j.id, fresh);
      }
      // Send back what the other post did not have yet.
      for (const j of journals) {
        const mine = merged.journals.find((x) => x.id === j.id);
        if (mine && (await fingerprint(mine)) !== (await fingerprint(j)))
          echo.current.add(j.id);
      }
      if (echo.current.size) {
        clearTimeout(echoTimer.current);
        echoTimer.current = setTimeout(() => {
          const ids = [...echo.current];
          echo.current.clear();
          void sendState(ids);
        }, 400);
      }
    }

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
      const socket = new WebSocket(
        `${scheme}://${location.host}/sync?room=${keys.room}`,
      );
      const send = async (wire: Wire) => {
        if (socket.readyState === WebSocket.OPEN)
          socket.send(await seal(wire, keys.key));
      };
      socket.addEventListener("open", () => {
        if (stopped) return socket.close();
        retry = 0;
        channel.current = { socket, keys, send };
        setStatus("live");
        setError("");
        void hello();
        clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          void hello();
          setPeers((list) => list.filter((p) => Date.now() - p.at < 90_000));
        }, 40_000);
      });
      socket.addEventListener("message", (event) => {
        let data: { t?: string; n?: number; iv?: string; d?: string };
        try {
          data = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (data.t === "peers") setRelayCount(Math.max(0, (data.n ?? 1) - 1));
        else if (data.t === "box" && data.iv && data.d)
          void unseal({ iv: data.iv, d: data.d }, keys.key)
            .then((wire) => receive(wire as Wire))
            .catch(() =>
              setError(
                "Message illisible reçu : un autre poste utilise-t-il un autre code ?",
              ),
            );
      });
      socket.addEventListener("close", () => {
        if (channel.current?.socket === socket) channel.current = null;
        clearInterval(heartbeat);
        setRelayCount(0);
        if (stopped) return;
        setStatus("retrying");
        retry++;
        retryTimer = setTimeout(connect, Math.min(15_000, 800 * 2 ** retry));
      });
    }
    void connect();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      clearInterval(heartbeat);
      const ch = channel.current;
      if (ch) {
        void ch
          .send({ type: "bye", peer: peerId.current })
          .finally(() => ch.socket.close());
      }
      channel.current = null;
      setStatus("off");
      setPeers([]);
    };
  }, [code]);

  // Local changes leave shortly after the last keystroke.
  const { localTick, takeDirty } = options;
  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => {
      const ids = takeDirty();
      const ch = channel.current;
      const ws = latest.current.workspace;
      if (!ids.length || !ch || !ws) return;
      void ch
        .send({
          type: "state",
          peer: peerId.current,
          name: latest.current.author,
          journals: ws.journals.filter((j) => ids.includes(j.id)),
          gone: ws.gone,
        })
        .then(() => setLastSync(Date.now()));
    }, 300);
    return () => clearTimeout(timer);
  }, [localTick, code, takeDirty]);

  // Where this post is working, for the other posts.
  const { module, workspace } = options;
  const activeId = workspace?.activeId ?? "";
  useEffect(() => {
    const ch = channel.current;
    if (!ch) return;
    void ch.send({
      type: "presence",
      peer: peerId.current,
      name: latest.current.author,
      module,
      journal: activeId,
    });
  }, [module, activeId, status]);

  return { status, relayCount, peers, lastSync, error, peerId: peerId.current };
}
