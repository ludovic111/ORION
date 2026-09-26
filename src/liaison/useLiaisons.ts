import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Journal } from "../../shared/journal";
import type { Ops } from "../../shared/ops";
import type { Liaison } from "../../shared/conduct";
import {
  LIAISON_VERSION,
  applyEnvelope,
  liaisonKeys,
  markDelivered,
  openLiaisons,
  pendingOut,
  received,
  type LiaisonWire,
} from "../../shared/liaison";
import { norm } from "../../shared/diffusion";
import { localNode } from "../../shared/hlc";
import { messageHighWater } from "../../shared/journal";
import { PEER_ID, PROTOCOL, Reassembler, sealFrames } from "../../shared/room";
import { t } from "./i18n.ts";

// Live liaison rooms, one per open liaison of the active journal. The
// relay is the one of the session (same /sync endpoint, unchanged): it
// forwards opaque frames of another room. Every post of both command posts
// may connect; items are sent by the posts that hold them and imported by
// every post of the other command post (the same ids: kept once).

export type LiaisonStatus =
  "off" | "connecting" | "waiting" | "live" | "retrying" | "outdated";
export type LiaisonState = {
  status: LiaisonStatus;
  /** Posts of the other command post seen recently (name, time). */
  peers: { peer: string; pc: string; journal: string; at: number }[];
  /** Last message from the other command post (ms). */
  lastContact: number | null;
  error: string;
};

const HEARTBEAT = 40_000;
const MAX_DELAY = 30_000;
const empty: LiaisonState = {
  status: "off",
  peers: [],
  lastContact: null,
  error: "",
};

// ---------- State shown by the settings and the Ordres module ----------

let states: Record<string, LiaisonState> = {};
const listeners = new Set<() => void>();
function patch(id: string, change: Partial<LiaisonState>) {
  states = { ...states, [id]: { ...(states[id] ?? empty), ...change } };
  listeners.forEach((l) => l());
}
export function useLiaisonStates(): Record<string, LiaisonState> {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => states,
    () => states,
  );
}
export const liaisonState = (all: Record<string, LiaisonState>, id: string) =>
  all[id] ?? empty;

// ---------- Connections ----------

type Deps = {
  journal: () => Journal | null;
  author: () => string;
  /** Write to the live journal when allowed (false: refused, retry later). */
  write: (change: (ops: Ops) => Ops) => boolean;
};

function connect(liaison: Liaison, deps: Deps) {
  const peerId = crypto.randomUUID();
  let stopped = false;
  let socket: WebSocket | null = null;
  let key: CryptoKey | null = null;
  let retry = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const peers = new Map<string, LiaisonState["peers"][number]>();
  const self = norm(liaison.self);

  const send = async (wire: LiaisonWire, to = "") => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !key) return;
    for (const frame of await sealFrames(wire, key, to))
      if (socket.readyState === WebSocket.OPEN) socket.send(frame);
  };
  const hello = (to = "") =>
    send(
      {
        t: "hello",
        lv: LIAISON_VERSION,
        peer: peerId,
        pc: liaison.self,
        journal: deps.journal()?.title ?? "",
      },
      to,
    );
  const otherSide = () =>
    [...peers.values()].filter((p) => Date.now() - p.at < 2.2 * HEARTBEAT);
  const publish = () =>
    patch(liaison.id, {
      peers: otherSide(),
      status:
        socket?.readyState === WebSocket.OPEN
          ? otherSide().length
            ? "live"
            : "waiting"
          : (states[liaison.id]?.status ?? "connecting"),
    });

  /** Items still to deliver, to one post of the other side (or all). */
  async function flush(to = "") {
    const j = deps.journal();
    if (!j) return;
    const items = pendingOut(j.ops, liaison.id)
      .map((x) => {
        try {
          return JSON.parse(x.payload) as unknown;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    if (!items.length) return;
    // A few at a time: each message stays far under the relay limits.
    for (let i = 0; i < items.length; i += 20)
      await send(
        {
          t: "items",
          lv: LIAISON_VERSION,
          peer: peerId,
          pc: liaison.self,
          items: items.slice(i, i + 20),
        },
        to,
      );
  }

  async function receive(wire: LiaisonWire, from: string) {
    if (!wire || typeof wire !== "object" || wire.peer === peerId) return;
    if (typeof wire.lv === "number" && wire.lv > LIAISON_VERSION) {
      patch(liaison.id, {
        status: "outdated",
        error: t(
          "L’autre PC utilise une version plus récente d’orion aic — rechargez la page.",
        ),
      });
      return;
    }
    if (wire.t === "bye") {
      peers.delete(from);
      publish();
      return;
    }
    if (wire.t === "hello") {
      // Posts of this command post share the room: only the other side counts.
      if (norm(String(wire.pc ?? "")) === self) return;
      // A post of the other side just arrived: it learns about us at once.
      if (!peers.has(from)) void hello(from);
      peers.set(from, {
        peer: from,
        pc: String(wire.pc ?? "").slice(0, 120),
        journal: String(wire.journal ?? "").slice(0, 200),
        at: Date.now(),
      });
      patch(liaison.id, { lastContact: Date.now() });
      publish();
      await flush(from);
      return;
    }
    if (wire.t === "got") {
      if (!Array.isArray(wire.ids)) return;
      const ids = wire.ids.map(String).slice(0, 500);
      const at = new Date().toISOString();
      const j = deps.journal();
      if (j && pendingOut(j.ops, liaison.id).some((x) => ids.includes(x.id)))
        deps.write((ops) => markDelivered(ops, ids, at));
      patch(liaison.id, { lastContact: Date.now() });
      return;
    }
    if (wire.t === "items") {
      if (norm(String(wire.pc ?? "")) === self) return;
      if (!Array.isArray(wire.items)) return;
      patch(liaison.id, { lastContact: Date.now() });
      const handled: string[] = [];
      const fresh: unknown[] = [];
      const j = deps.journal();
      if (!j) return;
      for (const item of wire.items.slice(0, 200)) {
        const id =
          item && typeof item === "object" && "id" in item
            ? String((item as { id: unknown }).id)
            : "";
        const from =
          item && typeof item === "object" && "from" in item
            ? norm(String((item as { from: unknown }).from))
            : "";
        if (!id || from === self) continue;
        if (received(j.ops, id)) handled.push(id);
        else fresh.push(item);
      }
      if (fresh.length) {
        const author = deps.author();
        let number = messageHighWater(j) + 1;
        const ok = deps.write((ops) => {
          let next = ops;
          for (const item of fresh) {
            const result = applyEnvelope(next, item, liaison, {
              author,
              now: new Date().toISOString(),
              messageNumber: number,
              node: localNode(),
            });
            if (result.created.some((c) => c.startsWith("message:"))) number++;
            next = result.ops;
          }
          return next;
        });
        if (ok)
          for (const item of fresh)
            handled.push(String((item as { id: unknown }).id));
      }
      if (handled.length)
        await send(
          { t: "got", lv: LIAISON_VERSION, peer: peerId, ids: handled },
          from,
        );
    }
  }

  async function open() {
    if (stopped) return;
    patch(liaison.id, { status: retry ? "retrying" : "connecting" });
    let room: string;
    try {
      const keys = await liaisonKeys(liaison.code);
      key = keys.key;
      room = keys.room;
    } catch {
      patch(liaison.id, {
        status: "off",
        error: t("Chiffrement indisponible : ouvrez orion aic en HTTPS."),
      });
      return;
    }
    if (stopped) return;
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${scheme}://${location.host}/sync`);
    socket = ws;
    ws.binaryType = "arraybuffer";
    const parts = new Reassembler(key);
    let queue = Promise.resolve();
    ws.addEventListener("open", () => {
      if (stopped) return ws.close();
      ws.send(JSON.stringify({ t: "join", room, v: PROTOCOL }));
    });
    ws.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
        let data: { t?: string; code?: string };
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (data.t === "welcome") {
          retry = 0;
          patch(liaison.id, { status: "waiting", error: "" });
          void hello();
          clearInterval(heartbeat);
          heartbeat = setInterval(() => {
            void hello();
            publish();
          }, HEARTBEAT);
        } else if (data.t === "error" && data.code === "version")
          patch(liaison.id, {
            status: "outdated",
            error: t("Version différente sur le relais : rechargez la page."),
          });
        return;
      }
      const bytes = new Uint8Array(event.data as ArrayBuffer);
      queue = queue.then(async () => {
        try {
          const message = await parts.accept(bytes);
          if (!message || !PEER_ID.test(message.from)) return;
          await receive(message.value as LiaisonWire, message.from);
        } catch {
          patch(liaison.id, {
            error: t(
              "Message de liaison illisible : l’autre PC utilise-t-il le même code de liaison ?",
            ),
          });
        }
      });
    });
    ws.addEventListener("close", () => {
      clearInterval(heartbeat);
      if (socket === ws) socket = null;
      peers.clear();
      if (stopped) return;
      patch(liaison.id, { status: "retrying", peers: [] });
      retry++;
      const delay = Math.min(MAX_DELAY, 800 * 2 ** Math.min(retry, 6));
      retryTimer = setTimeout(open, delay / 2 + Math.random() * (delay / 2));
    });
  }
  void open();

  return {
    flush: () => (otherSide().length ? flush() : Promise.resolve()),
    stop() {
      stopped = true;
      clearTimeout(retryTimer);
      clearInterval(heartbeat);
      const ws = socket;
      if (ws?.readyState === WebSocket.OPEN)
        void send({ t: "bye", lv: LIAISON_VERSION, peer: peerId }).finally(() =>
          ws.close(),
        );
      else ws?.close();
      socket = null;
      patch(liaison.id, { status: "off", peers: [] });
    },
  };
}

/** Keeps a connection open for each open liaison of the journal. */
export function useLiaisons(options: {
  journal: Journal;
  author: string;
  write: (change: (ops: Ops) => Ops) => boolean;
}) {
  const latest = useRef(options);
  latest.current = options;
  const open = openLiaisons(options.journal.ops);
  const key = open.map((l) => `${l.id}:${l.code}:${l.self}`).join("|");
  const connections = useRef(new Map<string, ReturnType<typeof connect>>());
  useEffect(() => {
    if (!key) return;
    const list = openLiaisons(latest.current.journal.ops);
    const deps: Deps = {
      journal: () => latest.current.journal,
      author: () => latest.current.author,
      write: (change) => latest.current.write(change),
    };
    for (const l of list) connections.current.set(l.id, connect(l, deps));
    const current = connections.current;
    return () => {
      for (const c of current.values()) c.stop();
      current.clear();
    };
  }, [key]);
  // New items to send leave shortly after they are queued.
  const pending = options.journal.ops.exchanges.filter(
    (x) => x.direction === "out" && !x.deliveredAt,
  ).length;
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      for (const c of connections.current.values()) void c.flush();
    }, 300);
    return () => clearTimeout(timer);
  }, [pending, key]);
}
