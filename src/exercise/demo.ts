import type { Journal } from "../../shared/journal.ts";
import { upsert, type Ops } from "../../shared/ops.ts";
import { dueAt } from "../../shared/exercise.ts";
import { ARVE_PAST, ARVE_SCENARIO } from "../../shared/scenario-arve.ts";
import type { HistoryEvent } from "../../shared/events.ts";

// The demonstration exercise keeps evolving while the visitor watches: the
// scenario "Crue de l’Arve" started with the demonstration (2 h 30 ago);
// its first injects are the messages already there, the next ones arrive
// every few minutes from now on (delivered by src/exercise/Runner.tsx,
// on every post since the scenario is marked `autoplay`).

const DIRECTION = "Direction d’exercice · fictive";
const MINUTE = 60_000;

/**
 * Scenario and injects of the demonstration. `base` is its start (T0),
 * `now` the moment it is opened: the live injects are moved so that the
 * first arrives about two minutes later, then one every three to eight
 * minutes.
 */
export function withDemoExercise(
  journal: Journal,
  base: number,
  now = Date.now(),
): Journal {
  const at = (ms: number) => new Date(ms).toISOString();
  const created = at(base - 30 * MINUTE);
  const elapsed = Math.ceil((now - base) / MINUTE);
  let ops: Ops = journal.ops;
  const scenarioId = crypto.randomUUID();
  ops = upsert(
    ops,
    "scenarios",
    {
      id: scenarioId,
      createdAt: created,
      title: ARVE_SCENARIO.title,
      description: ARVE_SCENARIO.description,
      startAt: at(base),
      endedAt: "",
      autoplay: true,
    },
    DIRECTION,
  );
  const live = ARVE_SCENARIO.injects.filter((i) => i.offset >= ARVE_PAST);
  const firstLive = live[0]?.offset ?? 0;
  const events: HistoryEvent[] = [];
  ARVE_SCENARIO.injects.forEach((source, order) => {
    const past = source.offset < ARVE_PAST;
    // Live injects: same spacing as in the scenario, starting at now + 2 min.
    const offset = past
      ? source.offset
      : elapsed + 2 + (source.offset - firstLive);
    const inject = { ...source, offset };
    const due = dueAt(inject, base)!;
    const message = past
      ? ops.messages.find((m) => m.subject === source.title)
      : undefined;
    // The call of the riverain (read out by the direction): answered and
    // written to the journal eleven minutes later.
    const read = past && source.delivery === "read";
    const id = crypto.randomUUID();
    ops = upsert(
      ops,
      "injects",
      {
        ...inject,
        id,
        createdAt: created,
        scenarioId,
        order,
        deliveredAt: past ? at(due) : "",
        messageId: message?.id ?? "",
        reactedAt: read ? at(due + 11 * MINUTE) : "",
        reactionRef: "",
        reactionNote: read
          ? "Adresse notée, transmise à la cellule situation"
          : "",
        skipped: false,
      },
      DIRECTION,
    );
    const state = ops.injects.find((i) => i.id === id)!;
    events.push({
      id: crypto.randomUUID(),
      at: created,
      by: DIRECTION,
      action: "create",
      scope: "ops.injects",
      target: id,
      state: { ...state, deliveredAt: "", reactedAt: "", reactionNote: "" },
      rev: 0,
      note: "",
    });
    if (past)
      events.push({
        id: crypto.randomUUID(),
        at: at(due),
        by: DIRECTION,
        action: "update",
        scope: "ops.injects",
        target: id,
        state: { ...state, reactedAt: "", reactionNote: "" },
        rev: 0,
        note: "Inject joué",
      });
    if (read)
      events.push({
        id: crypto.randomUUID(),
        at: state.reactedAt,
        by: DIRECTION,
        action: "update",
        scope: "ops.injects",
        target: id,
        state,
        rev: 0,
        note: "Réaction marquée",
      });
  });
  // Two notes of the debriefing, taken at the report of T+02:00.
  const noted = at(base + 125 * MINUTE);
  ops = upsert(
    ops,
    "retex",
    {
      createdAt: noted,
      kind: "positif",
      text: "Les quittances radio ont été consignées au journal dans les minutes qui suivaient.",
      topic: "Transmissions",
      owner: "",
      order: 0,
    },
    "Fictive Bernasconi",
  );
  ops = upsert(
    ops,
    "retex",
    {
      createdAt: noted,
      kind: "amélioration",
      text: "L’alerte « Eau sur la chaussée » n’a été reliée à une mesure qu’après 34 minutes : désigner qui suit les messages urgents.",
      topic: "Messages",
      owner: "Chef AIC",
      order: 1,
    },
    "Fictive Bernasconi",
  );
  ops = {
    ...ops,
    retex: ops.retex.map((n) => ({ ...n, updatedAt: noted })),
  };
  const scenario = ops.scenarios.find((s) => s.id === scenarioId)!;
  events.push({
    id: crypto.randomUUID(),
    at: created,
    by: DIRECTION,
    action: "create",
    scope: "ops.scenarios",
    target: scenarioId,
    state: { ...scenario, startAt: "" },
    rev: 0,
    note: "",
  });
  events.push({
    id: crypto.randomUUID(),
    at: at(base),
    by: DIRECTION,
    action: "update",
    scope: "ops.scenarios",
    target: scenarioId,
    state: scenario,
    rev: 0,
    note: "Début de l’exercice",
  });
  // Times of the story, not of the build (upsert stamps "now").
  ops = {
    ...ops,
    scenarios: ops.scenarios.map((s) =>
      s.id === scenarioId ? { ...s, updatedAt: at(base) } : s,
    ),
    injects: ops.injects.map((i) =>
      i.scenarioId === scenarioId
        ? { ...i, updatedAt: i.reactedAt || i.deliveredAt || created }
        : i,
    ),
  };
  const history = [...journal.history, ...events].sort(
    (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
  );
  return { ...journal, ops, history };
}
