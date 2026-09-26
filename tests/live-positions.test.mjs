import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { handle } from "../server/app.mjs";
import { attachRelay } from "../server/relay.mjs";
import {
  END,
  GONE_AFTER,
  LINE_POINTS,
  LIVE_KIND,
  MIN_INTERVAL,
  MOVE_METRES,
  SEND_EVERY,
  STALE_AFTER,
  TRAIL_MS,
  addToTrack,
  ageText,
  decodePosition,
  distance,
  encodePosition,
  freshness,
  positionEntry,
  pruneUnits,
  receivePosition,
  shouldSend,
  trackLength,
  trackLine,
} from "../shared/live.ts";
import {
  MAX_EPHEMERAL,
  ephemeralWire,
  isEphemeral,
  readEphemeral,
} from "../shared/ephemeral.ts";
import {
  PROTOCOL,
  Reassembler,
  newRoomCode,
  roomKeys,
  sealFrames,
} from "../shared/room.ts";
import {
  addEntry,
  emptyFields,
  fieldsSchema,
  newJournal,
} from "../shared/journal.ts";
import { digest, mergeWorkspace } from "../shared/sync.ts";
import { answerHello, newMemory, summarise } from "../shared/protocol.ts";

// Live positions of the teams: ephemeral, throttled, never stored.

const BERN = { lat: 46.948, lng: 7.4474 };
/** A point `m` metres north of `p`. */
const north = (p, m) => ({ ...p, lat: p.lat + m / 111_195 });
const fix = (p, t, extra = {}) => ({
  lat: p.lat,
  lng: p.lng,
  acc: 8,
  hdg: null,
  spd: null,
  t,
  ...extra,
});

test("the sender sends at most every 5 s, on a move of 25 m, else every 15 s", () => {
  const t0 = 1_000_000;
  assert.equal(shouldSend(null, BERN, t0), true, "the first fix leaves");
  const last = { ...BERN, at: t0 };
  // Standing still: nothing before 15 s, then a heartbeat.
  assert.equal(shouldSend(last, BERN, t0 + 1_000), false);
  assert.equal(shouldSend(last, BERN, t0 + SEND_EVERY - 1), false);
  assert.equal(shouldSend(last, BERN, t0 + SEND_EVERY), true);
  // Moving: a big move waits for the minimum interval.
  const far = north(BERN, 200);
  assert.equal(shouldSend(last, far, t0 + MIN_INTERVAL - 1), false);
  assert.equal(shouldSend(last, far, t0 + MIN_INTERVAL), true);
  // Under the threshold of movement: the regular interval.
  const near = north(BERN, MOVE_METRES - 3);
  assert.equal(shouldSend(last, near, t0 + 8_000), false);
  assert.equal(
    shouldSend(last, north(BERN, MOVE_METRES + 1), t0 + 8_000),
    true,
  );
  assert.ok(Math.abs(distance(BERN, north(BERN, 100)) - 100) < 0.5);

  // A walk of 10 minutes, one fix a second at 1.5 m/s: about one message
  // every 15 s (moving 25 m takes 16.7 s), never more than one every 5 s.
  let sent = null;
  const times = [];
  for (let s = 0; s <= 600; s++) {
    const at = t0 + s * 1000;
    const p = north(BERN, s * 1.5);
    if (shouldSend(sent, p, at)) {
      sent = { ...p, at };
      times.push(at);
    }
  }
  for (let i = 1; i < times.length; i++)
    assert.ok(times[i] - times[i - 1] >= MIN_INTERVAL);
  assert.ok(times.length <= 600 / 15 + 2, `${times.length} messages`);
  // Driving at 20 m/s: every 5 s, not every second.
  sent = null;
  let count = 0;
  for (let s = 0; s <= 60; s++) {
    const at = t0 + s * 1000;
    const p = north(BERN, s * 20);
    if (shouldSend(sent, p, at)) {
      sent = { ...p, at };
      count++;
    }
  }
  assert.equal(count, 13);
});

test("the envelope is small, rounded, clock independent and checked", () => {
  const now = 5_000_000;
  const pos = {
    ...fix({ lat: 46.94812345678, lng: 7.44744444444 }, now - 3_000, {
      acc: 12.4,
      hdg: 371,
      spd: 1.234,
    }),
    label: "  Patrouille   2 ",
    ref: "cell:6f1c2a4e-9b0d-4c5e-8f7a-1b2c3d4e5f60",
  };
  const env = encodePosition(pos, now);
  assert.deepEqual(env.p, [46.948123, 7.447444, 12, 11, 1.2, 3000]);
  assert.equal(env.l, "Patrouille 2");
  assert.ok(JSON.stringify(env).length < 120, JSON.stringify(env));
  // Received on a post whose clock is 2 minutes ahead: the age travels.
  const there = now + 120_000;
  const back = decodePosition(JSON.parse(JSON.stringify(env)), there);
  assert.equal(back.t, there - 3000);
  assert.equal(back.label, "Patrouille 2");
  assert.equal(back.ref, pos.ref);
  assert.equal(back.hdg, 11);
  assert.equal(decodePosition(END, now), "end");
  // Malformed or hostile values are refused.
  const bad = [
    null,
    "x",
    { p: [91, 7, 5, null, null, 0], l: "a" },
    { p: [46, 7, -1, null, null, 0], l: "a" },
    { p: [46, 7, 5, null, null, GONE_AFTER + 1], l: "a" },
    { p: [46, 7, 5, "N", null, 0], l: "a" },
    { p: [46, 7, 5], l: "a" },
  ];
  for (const raw of bad) assert.equal(decodePosition(raw, now), null);
  // A foreign reference is dropped, a long label cut.
  const odd = decodePosition(
    { p: [46, 7, 5, null, null, 0], l: "x".repeat(500), r: "entry:1" },
    now,
  );
  assert.equal(odd.ref, "");
  assert.equal(odd.label.length, 80);
});

test("ephemeral messages are checked and travel encrypted through the relay", async () => {
  const base = { v: PROTOCOL, peer: "page-a", name: "Patrouille" };
  const wire = ephemeralWire(
    base,
    LIVE_KIND,
    encodePosition({ ...fix(BERN, 1000), label: "P2", ref: "" }, 1000),
  );
  assert.equal(isEphemeral(wire), true);
  assert.equal(isEphemeral({ type: "state" }), false);
  assert.throws(() => ephemeralWire(base, "Bad Kind", 1));
  assert.throws(() => ephemeralWire(base, "pos", "x".repeat(MAX_EPHEMERAL)));
  assert.equal(readEphemeral({ ...wire, kind: "<script>" }), null);
  assert.equal(readEphemeral({ ...wire, peer: 3 }), null);
  assert.equal(
    readEphemeral({ ...wire, data: "x".repeat(MAX_EPHEMERAL) }),
    null,
  );

  const server = createServer(handle);
  const relay = attachRelay(server);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  try {
    const code = newRoomCode();
    const keys = await roomKeys(code);
    const join = async () => {
      const socket = new WebSocket(`ws://127.0.0.1:${port}/sync`);
      socket.binaryType = "arraybuffer";
      const frames = [];
      const welcome = new Promise((resolve) =>
        socket.addEventListener("message", (e) => {
          if (typeof e.data === "string") {
            if (JSON.parse(e.data).t === "welcome") resolve();
          } else frames.push(new Uint8Array(e.data));
        }),
      );
      await new Promise((r) =>
        socket.addEventListener("open", r, { once: true }),
      );
      socket.send(JSON.stringify({ t: "join", room: keys.room, v: PROTOCOL }));
      await welcome;
      return { socket, frames };
    };
    const a = await join();
    const b = await join();
    const frames = await sealFrames(wire, keys.key);
    assert.equal(frames.length, 1);
    // One small frame: header, iv, tag and about a hundred bytes.
    assert.ok(frames[0].length < 200, `${frames[0].length} bytes`);
    // The plain text does not appear in the frame.
    assert.ok(!Buffer.from(frames[0]).toString("latin1").includes("P2"));
    a.socket.send(frames[0]);
    for (let i = 0; i < 100 && !b.frames.length; i++)
      await new Promise((r) => setTimeout(r, 10));
    const message = await new Reassembler(keys.key).accept(b.frames[0]);
    const got = readEphemeral(message.value);
    assert.equal(got.kind, LIVE_KIND);
    assert.equal(got.name, "Patrouille");
    const pos = decodePosition(got.data, 2000);
    assert.equal(pos.label, "P2");
    assert.equal(pos.lat, BERN.lat);
    a.socket.close();
    b.socket.close();
  } finally {
    relay.close();
    server.close();
  }
});

test("positions turn old after 2 min and leave after 30; trails keep 30 min", () => {
  assert.equal(freshness(0, STALE_AFTER - 1), "live");
  assert.equal(freshness(0, STALE_AFTER), "stale");
  assert.equal(freshness(0, GONE_AFTER), "gone");
  assert.equal(ageText(4_000), "à l’instant");
  assert.equal(ageText(40_000), "il y a 40 s");
  assert.equal(ageText(3 * 60_000 + 5_000), "il y a 3 min");
  assert.equal(ageText(65 * 60_000), "il y a 1 h 05");

  const from = { peer: "p1", name: "Poste terrain" };
  let units = new Map();
  let t = 0;
  // 40 minutes of walking, a message every 15 s.
  for (; t <= 40 * 60_000; t += 15_000)
    units = receivePosition(
      units,
      from,
      { ...fix(north(BERN, t / 100), t), label: "P1", ref: "" },
      t,
    );
  const unit = units.get("p1");
  assert.equal(unit.label, "P1");
  assert.equal(unit.name, "Poste terrain");
  const oldest = unit.trail[0][2];
  assert.ok(t - oldest <= TRAIL_MS, "the trail keeps 30 minutes");
  assert.ok(unit.trail.length > 100);
  // A late message (older fix) does not move the team back.
  const late = receivePosition(
    units,
    from,
    { ...fix(BERN, 1000), label: "P1", ref: "" },
    t,
  );
  assert.equal(late.get("p1").lat, unit.lat);
  // Nothing new: grey after 2 min, gone after 30.
  const last = unit.t;
  assert.equal(
    pruneUnits(units, last + STALE_AFTER).get("p1") !== undefined,
    true,
  );
  assert.equal(pruneUnits(units, last + GONE_AFTER).size, 0);
  // The end of the sharing removes the team at once.
  assert.equal(receivePosition(units, from, "end", t).size, 0);
  // Pruning with nothing to prune keeps the same map (no re-render).
  assert.equal(pruneUnits(units, last), units);
});

test("ephemeral messages change no journal, digest or merge", async () => {
  let journal = newJournal("Crue");
  journal = addEntry(journal, { ...emptyFields(), message: "Départ" }, "A");
  const ws = {
    version: 1,
    author: "A",
    journals: [journal],
    activeId: journal.id,
  };
  const before = JSON.stringify(ws);
  const digestBefore = await digest(journal);
  const summary = await summarise(ws.journals);
  // What useSync does with a received message: an ephemeral one goes to
  // the listeners of its kind, and nowhere else.
  let units = new Map();
  const route = (wire) => {
    if (isEphemeral(wire)) {
      const m = readEphemeral(wire);
      if (m?.kind === LIVE_KIND) {
        const pos = decodePosition(m.data, 10_000);
        if (pos) units = receivePosition(units, m, pos, 10_000);
      }
      return "ephemeral";
    }
    return "sync";
  };
  for (let i = 0; i < 50; i++)
    assert.equal(
      route(
        ephemeralWire(
          { v: PROTOCOL, peer: `p${i % 5}`, name: "B" },
          LIVE_KIND,
          encodePosition(
            { ...fix(north(BERN, i), 9_000), label: "P", ref: "" },
            10_000,
          ),
        ),
      ),
      "ephemeral",
    );
  assert.equal(units.size, 5);
  assert.equal(JSON.stringify(ws), before);
  assert.equal(await digest(journal), digestBefore);
  assert.deepEqual(await summarise(ws.journals), summary);
  // Even handed to the merge by mistake, an ephemeral message has no
  // journals: the workspace stays the same.
  const wire = ephemeralWire(
    { v: PROTOCOL, peer: "x", name: "B" },
    LIVE_KIND,
    END,
  );
  const merged = mergeWorkspace(ws, {
    journals: wire.journals ?? [],
    gone: undefined,
  });
  assert.equal(await digest(merged.journals[0]), digestBefore);
  // A hello from a post in the same state asks for nothing.
  const answer = await answerHello(
    ws.journals,
    undefined,
    summary,
    newMemory(),
  );
  assert.equal(answer.differ, false);
});

test("a track is recorded only on purpose, then saved as a map line", () => {
  let track = [];
  for (let s = 0; s < 5000; s++) {
    // Jitter of 1 m every other second: skipped.
    const p = north(BERN, Math.floor(s / 2) * 6 + (s % 2));
    track = addToTrack(track, fix(p, s * 1000));
  }
  assert.equal(track.length, 2500);
  const length = trackLength(track);
  assert.ok(Math.abs(length - 2499 * 6) < 20, `${length} m`);
  const line = trackLine(track);
  assert.equal(line.length, LINE_POINTS);
  assert.deepEqual(
    line[0],
    [track[0][0], track[0][1]].map((n) => Math.round(n * 1e6) / 1e6),
  );
  assert.deepEqual(
    line[line.length - 1],
    [track[track.length - 1][0], track[track.length - 1][1]].map(
      (n) => Math.round(n * 1e6) / 1e6,
    ),
  );
  // « Consigner la position au journal »: an ordinary entry, in MN95.
  const fields = positionEntry({
    ...fix(BERN, Date.UTC(2026, 8, 26, 12, 5)),
    label: "Patrouille 2",
    ref: "",
  });
  const parsed = fieldsSchema.parse({ ...emptyFields(), ...fields });
  assert.match(parsed.coordinates, /^26\d{5} \/ 11\d{5}$/);
  assert.match(
    parsed.message,
    /Patrouille 2 à 14:05 : MN95 26\d{5} \/ 11\d{5}/,
  );
  assert.equal(parsed.source, "Patrouille 2");
  assert.deepEqual(parsed.tags, ["Position GPS"]);
});
