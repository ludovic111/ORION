import { journalSchema, type Journal } from "../../shared/journal.ts";
import { upsert, type Collection, type Ops } from "../../shared/ops.ts";
import type { HistoryEvent } from "../../shared/events.ts";
import {
  findTemplate,
  setChecklistClosed,
  startChecklist,
  tickId,
  tickStep,
} from "../../shared/checklists.ts";
import {
  attachResource,
  createRequest,
  moveRequest,
} from "../../shared/requests.ts";
import { applyThresholds, latestForecast } from "../../shared/thresholds.ts";
import { t } from "./i18n-demo2.ts";

// Conduct follow-up of the demonstration (every name is fictitious): the
// opening checklist done, the flood checklist in progress with a control
// overdue, requests for resources (one late), presences with a long duty
// and a short rest, a plan de relève, weather thresholds and reminders.
// Added after the demonstration history: each step is dated in the story
// and gets its history event, so the time machine and the handover summary
// replay it. Texts are written in the language of the post that opens the
// demonstration; person names stay as they are (members are found by name).

const MINE: Collection[] = [
  "checklists",
  "checklistTicks",
  "requests",
  "presences",
  "shifts",
  "thresholds",
  "reminders",
  "alerts",
  "links",
];

export function demoConduct(
  journal: Journal,
  at: (minutes: number) => string,
): Journal {
  const A = t("Opérateur A · fictif");
  const B = t("Opérateur B · fictif");
  const lieutenant = t("Plt Fictive Bernasconi");
  let j = journal;
  const events: HistoryEvent[] = [];

  /** Run one step of the story at `minute` and date what it changed. */
  const run = (minute: number, by: string, change: (x: Journal) => Journal) => {
    const before = j;
    const next = change(j);
    const when = at(minute);
    const oldEntries = new Map(before.entries.map((e) => [e.id, e]));
    const entries = next.entries.map((e) => {
      const old = oldEntries.get(e.id);
      const known = new Set(old?.revisions.map((r) => r.id));
      return {
        ...e,
        createdAt: old ? e.createdAt : when,
        revisions: e.revisions.map((r) =>
          known.has(r.id)
            ? r
            : {
                ...r,
                at: when,
                fields: old
                  ? r.fields
                  : { ...r.fields, receivedAt: r.fields.happenedAt },
              },
        ),
      };
    });
    const ops = { ...next.ops } as Record<string, unknown>;
    for (const c of MINE) {
      const old = new Map(
        (before.ops[c] as { id: string }[]).map((r) => [
          r.id,
          JSON.stringify(r),
        ]),
      );
      ops[c] = (
        next.ops[c] as { id: string; createdAt: string; updatedAt: string }[]
      ).map((r) => {
        if (old.get(r.id) === JSON.stringify(r)) return r;
        const dated = {
          ...r,
          createdAt: old.has(r.id) ? r.createdAt : when,
          updatedAt: when,
        };
        events.push({
          id: crypto.randomUUID(),
          at: when,
          by,
          action: old.has(r.id) ? "update" : "create",
          scope: `ops.${c}`,
          target: r.id,
          state: dated,
          rev: 0,
          note: "",
        });
        return dated;
      });
    }
    j = { ...next, entries, ops: ops as Ops };
  };
  // Steps run in the order of the story, so that entry numbers follow time.
  const queue: {
    minute: number;
    by: string;
    change: (x: Journal) => Journal;
  }[] = [];
  const step = (minute: number, by: string, change: (x: Journal) => Journal) =>
    queue.push({ minute, by, change });
  const put = <C extends Collection>(
    minute: number,
    by: string,
    c: C,
    value: Parameters<typeof upsert<C>>[2],
  ) => step(minute, by, (x) => ({ ...x, ops: upsert(x.ops, c, value, by) }));

  // ---------- Checklists ----------
  let opening = "";
  step(-30, A, (x) => {
    const template = findTemplate(x.ops, "builtin:ouverture-pc")!;
    const r = startChecklist(x.ops, template, A, at(-30), {
      title: t("Ouverture du PC Carouge"),
      location: t("PC Carouge"),
    });
    opening = r.id;
    return { ...x, ops: r.ops };
  });
  // Done during the first half hour, without cluttering the journal.
  findTemplate(j.ops, "builtin:ouverture-pc")!.steps.forEach((s, i) =>
    step(-28 + i * 2, i % 3 ? A : lieutenant, (x) => ({
      ...x,
      ops: upsert(
        x.ops,
        "checklistTicks",
        {
          id: tickId(opening, s.id),
          checklistId: opening,
          stepId: s.id,
          done: true,
          at: at(-28 + i * 2),
          who: i % 3 ? A : lieutenant,
          entryId: "",
          note: "",
        },
        A,
      ),
    })),
  );
  step(0, A, (x) => ({
    ...x,
    ops: setChecklistClosed(x.ops, opening, at(0), A),
  }));

  let flood = "";
  step(3, A, (x) => {
    const template = findTemplate(x.ops, "builtin:crue")!;
    const r = startChecklist(x.ops, template, A, at(3), {
      title: t("Crue de l’Arve"),
      location: t("Arve · Carouge et Acacias"),
    });
    flood = r.id;
    return { ...x, ops: r.ops };
  });
  const floodStep = (n: number) =>
    j.ops.checklists.find((c) => c.id === flood)!.steps[n].id;
  // Levels read at 00:47: control due 60 min later, now overdue.
  step(47, B, (x) =>
    tickStep(x, flood, floodStep(0), { author: B, at: at(47) }),
  );
  step(42, B, (x) =>
    tickStep(x, flood, floodStep(1), { author: B, at: at(42), log: false }),
  );
  step(48, A, (x) =>
    tickStep(x, flood, floodStep(2), { author: A, at: at(48), log: false }),
  );
  step(52, A, (x) =>
    tickStep(x, flood, floodStep(3), { author: A, at: at(52), log: false }),
  );
  step(75, A, (x) =>
    tickStep(x, flood, floodStep(4), { author: A, at: at(75) }),
  );
  step(88, B, (x) =>
    tickStep(x, flood, floodStep(5), { author: B, at: at(88), log: false }),
  );

  // ---------- Requests for resources ----------
  const bags = j.ops.resources.find(
    (r) => r.name === t("Sacs de sable") || r.name === "Sacs de sable",
  );
  let sand = "";
  step(28, B, (x) => {
    const r = createRequest(
      x,
      {
        title: t("Sacs de sable"),
        kind: t("Matériel"),
        quantity: 200,
        unit: "",
        requester: t("Section appui"),
        provider: t("Arsenal cantonal (fictif)"),
        contact: t("Préposé au matériel"),
        destination: t("Point de rassemblement Acacias"),
        reason: t("Protéger les bâtiments du quai Charles-Page."),
        priority: "Important",
        requestedAt: at(28),
        eta: "",
        notes: "",
      },
      B,
      { log: false },
    );
    sand = r.id;
    return r.journal;
  });
  step(34, B, (x) =>
    moveRequest(x, sand, "Accordé", B, {
      at: at(34),
      eta: at(115),
      log: false,
    }),
  );
  step(70, B, (x) => {
    const moved = moveRequest(x, sand, "En route", B, {
      at: at(70),
      log: false,
    });
    return bags
      ? { ...moved, ops: attachResource(moved.ops, sand, bags.id, B) }
      : moved;
  });

  let power = "";
  step(50, A, (x) => {
    const r = createRequest(
      x,
      {
        title: t("Groupe électrogène 20 kVA"),
        kind: t("Engin spécial"),
        quantity: 1,
        unit: "",
        requester: t("Cellule télématique"),
        provider: t("Canton"),
        contact: t("Centrale cantonale d’engagement (fictif)"),
        destination: t("PC Carouge"),
        reason: t("Secours électrique du PC si le quai est coupé."),
        priority: "Important",
        requestedAt: at(50),
        eta: "",
        notes: "",
      },
      A,
    );
    power = r.id;
    return r.journal;
  });
  step(58, A, (x) =>
    moveRequest(x, power, "Accordé", A, { at: at(58), eta: at(120) }),
  );
  step(100, A, (x) =>
    moveRequest(x, power, "En route", A, {
      at: at(100),
      note: t("Départ de l’arsenal, trafic ralenti route de Saint-Julien."),
    }),
  );

  let tents = "";
  step(66, B, (x) => {
    const r = createRequest(
      x,
      {
        title: t("Tentes de 40 places"),
        kind: t("Hébergement"),
        quantity: 2,
        unit: "",
        requester: t("Chef d’intervention"),
        provider: t("Armée"),
        contact: "",
        destination: "Parc de la Mairie",
        reason: t(
          "Accueil des évacués du quai si la salle communale ne suffit pas.",
        ),
        priority: "Normal",
        requestedAt: at(66),
        eta: "",
        notes: "",
      },
      B,
      { log: false },
    );
    tents = r.id;
    return r.journal;
  });
  step(90, B, (x) =>
    moveRequest(x, tents, "Refusé", B, {
      at: at(90),
      note: t("Salle communale suffisante (40 places), demande retirée."),
      log: false,
    }),
  );
  step(
    112,
    B,
    (x) =>
      createRequest(
        x,
        {
          title: t("Pompes immergées"),
          kind: t("Matériel"),
          quantity: 4,
          unit: t("pce"),
          requester: t("Pompiers (SIS)"),
          provider: t("Protection civile"),
          contact: "",
          destination: "Quai Charles-Page",
          reason: t("Caves inondées : relayer la tonne-pompe."),
          priority: "Normal",
          requestedAt: at(112),
          eta: "",
          notes: "",
        },
        B,
      ).journal,
  );

  // ---------- Presences and shifts ----------
  const member = (name: string) => j.ops.members.find((m) => m.name === name);
  const stay = (name: string, inMin: number, outMin?: number, via = "QR") => {
    const m = member(name);
    if (!m) return;
    put(outMin ?? inMin, A, "presences", {
      memberId: m.id,
      name: m.name,
      in: at(inMin),
      out: outMin === undefined ? "" : at(outMin),
      via,
      note: "",
    });
  };
  // Night logistics still on duty: more than 12 hours by now.
  stay("Fictif Gilliéron", -660);
  // Back after a short rest.
  stay("Fictive Favre", -480, -240);
  stay("Fictive Favre", -60);
  stay("Fictif Arnaud", -45, undefined, "Bouton");
  stay("Fictive Bernasconi", -40);
  stay("Fictif A", -35);
  stay("Fictive Delacrétaz", -30);
  stay("Fictif Egger", -30);
  stay("Fictif B", -20, undefined, "Bouton");
  stay("Fictif D", -20, undefined, "Bouton");
  const ids = (...names: string[]) =>
    names.map((n) => member(n)?.id).filter((x): x is string => !!x);
  put(-20, A, "shifts", {
    title: t("Relève jour"),
    start: at(-60),
    end: at(660),
    memberIds: ids(
      "Fictif Arnaud",
      "Fictive Bernasconi",
      "Fictif A",
      "Fictive Delacrétaz",
      "Fictif Egger",
      "Fictive Favre",
      "Fictif B",
      "Fictif D",
    ),
    people: "",
    notes: "",
  });
  put(-18, A, "shifts", {
    title: t("Relève nuit"),
    start: at(660),
    end: at(1380),
    memberIds: ids("Fictive Huber", "Fictif A", "Fictif Gilliéron"),
    people: t("Section appui (réserve) : 2 chefs de groupe"),
    notes: t("Fictif A enchaîne deux relèves : à corriger."),
  });

  // ---------- Weather thresholds and reminders ----------
  put(-25, B, "thresholds", {
    metric: "gusts",
    value: 70,
    level: "2",
    label: "",
    region: t("Genève"),
    active: true,
    followUp: false,
  });
  put(-25, B, "thresholds", {
    metric: "rain1h",
    value: 6,
    level: "3",
    label: t("Pluie intense sur l’Arve"),
    region: "Arve",
    active: true,
    followUp: true,
  });
  put(-25, B, "thresholds", {
    metric: "tmax",
    value: 33,
    level: "3",
    label: "",
    region: "",
    active: false,
    followUp: false,
  });
  const forecast = latestForecast(j.ops);
  if (forecast)
    step(
      106,
      B,
      (x) =>
        applyThresholds(x, forecast, B, Date.parse(forecast.fetchedAt)).journal,
    );
  put(-25, A, "reminders", {
    title: t("Exporter l’archive chiffrée"),
    action: "export",
    every: 120,
    before: 0,
    active: true,
    doneAt: "",
    notes: t("Une archive .orionaic sur la clé du PC arrière."),
  });
  put(-24, A, "reminders", {
    title: t("Imprimer la situation pour le rapport"),
    action: "print",
    every: 0,
    before: 30,
    active: true,
    doneAt: "",
    notes: "",
  });
  put(-24, A, "reminders", {
    title: t("Préparer le point de situation"),
    action: "point",
    every: 0,
    before: 45,
    active: true,
    doneAt: "",
    notes: "",
  });

  queue
    .map((q, i) => ({ ...q, i }))
    .sort((a, b) => a.minute - b.minute || a.i - b.i)
    .forEach((q) => run(q.minute, q.by, q.change));
  return journalSchema.parse({
    ...j,
    history: [...j.history, ...events].sort(
      (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
    ),
  });
}
