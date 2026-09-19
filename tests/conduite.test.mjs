import { test } from "node:test";
import assert from "node:assert/strict";
import { conduite, deadlineState, handoverDraft } from "../shared/conduite.ts";
import { schemas } from "../server/validation.mjs";

const now = new Date("2026-09-19T12:00:00Z");
const operation = {
  id: "op",
  name: "Exercice",
  location: "Genève",
  phase: "Intervention",
};
const record = (id, data = {}, kind = "journal", operation_id = "op") => ({
  id,
  operation_id,
  kind,
  version: 2,
  data: { title: id, type: "Ordre", priority: "P3", status: "Ouvert", ...data },
});
const mission = (deadline, status = "Ouvert") =>
  record("mission", { oimde: { deadline }, status });

test("deadline boundaries distinguish urgency from assigned priority", () => {
  for (const [deadline, expected] of [
    ["2026-09-19T11:59:59Z", "late"],
    ["2026-09-19T12:00:00Z", "soon"],
    ["2026-09-19T13:00:00Z", "soon"],
    ["2026-09-19T13:00:01Z", "planned"],
    ["invalid", "missing"],
  ]) {
    const r = mission(deadline);
    assert.equal(deadlineState(r, now), expected);
    assert.equal(r.data.priority, "P3");
  }
  for (const status of ["Traité", "Clos"])
    assert.equal(
      deadlineState(mission("2020-01-01T00:00:00Z", status), now),
      "completed",
    );
});
test("board isolates dossier and separates requests and acknowledgement states", () => {
  const records = [
    record("foreign", {}, "journal", "other"),
    record("open", { type: "Demande" }),
    record("done", { type: "Demande", status: "Traité" }),
    record("send", { status: "À transmettre" }, "transmission"),
    record("sent", { status: "Transmis" }, "transmission"),
    record("ack", { status: "Accusé reçu" }, "transmission"),
  ];
  const board = conduite(records, "op", now);
  assert.equal(board.missions.length, 0);
  assert.deepEqual(
    board.requests.map((r) => r.id),
    ["open"],
  );
  assert.deepEqual(
    board.transmissions.map((r) => r.id),
    ["send", "sent"],
  );
});
test("handover stays a dated, traceable draft and does not turn uncertainty into fact", () => {
  const records = [
    record("unverified", {
      type: "Rapport",
      reliability: "Non confirmé",
      validated: false,
    }),
    record("completed", { status: "Clos" }),
    record("active", { assignee: "Cellule A" }),
    record("secret", {}, "journal", "other"),
  ];
  const draft = handoverDraft(records, operation, now);
  assert.equal(draft.validated, false);
  assert.match(draft.situation, /Non confirmé; non validé \[unverified · v2\]/);
  assert.match(draft.actions, /Cellule A/);
  assert.doesNotMatch(JSON.stringify(draft), /completed|secret/);
  assert.deepEqual(draft, handoverDraft(records, operation, now));
});
test("large handover reports retain whole entries, declare omissions and fit validation limits", () => {
  const records = Array.from({ length: 1000 }, (_, i) =>
    record(`item-${i}`, {
      title: "x".repeat(200),
      oimde: { mission: "y".repeat(3000), deadline: now.toISOString() },
    }),
  );
  const draft = handoverDraft(records, operation, now);
  for (const field of ["situation", "actions", "needs", "outlook"])
    assert.ok(draft[field].length <= 10000);
  assert.match(draft.actions, /entrée\(s\) supplémentaire\(s\)/);
  assert.ok(schemas.report.safeParse(draft).success);
});
