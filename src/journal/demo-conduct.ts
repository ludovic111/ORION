import {
  addEntry,
  emptyFields,
  journalSchema,
  type Journal,
} from "../../shared/journal.ts";
import { upsert, type Collection, type InputOf } from "../../shared/ops.ts";
import { ref } from "../../shared/links.ts";
import type { HistoryEvent } from "../../shared/events.ts";
import { emptyOrder, newMission, orderPrefill } from "../../shared/orders.ts";

// Orders, diffusions with their receipts and an assignment for the
// demonstration (appended to demoWorkspace, all fictitious): an issued order
// whose telematics receipt is late, a draft complementary order, a notice
// to everyone still waiting for its receipt.

const CHIEF = "Chef d’intervention · fictif";
const OPERATOR_A = "Opérateur A · fictif";

export function withConductDemo(
  journal: Journal,
  at: (minutes: number) => string,
): Journal {
  let ops = journal.ops;
  const events: HistoryEvent[] = [];
  const put = <C extends Collection>(
    collection: C,
    value: Omit<InputOf<C>, "createdAt" | "updatedAt" | "by"> & { id: string },
    minutes: number,
    by = OPERATOR_A,
  ) => {
    ops = upsert(
      ops,
      collection,
      { ...value, createdAt: at(minutes), by } as never,
      by,
    );
    const list = ops[collection] as { id: string; updatedAt: string }[];
    const saved = list.find((r) => r.id === value.id)!;
    saved.updatedAt = at(minutes);
    events.push({
      id: crypto.randomUUID(),
      at: at(minutes),
      by,
      action: "create",
      scope: `ops.${collection}`,
      target: value.id,
      state: { ...saved },
      rev: 0,
      note: "",
    });
    return value.id;
  };

  // Journal entry of the issued order.
  let j = addEntry(
    journal,
    {
      ...emptyFields(),
      happenedAt: at(35),
      receivedAt: at(35),
      type: "Décision",
      message: "Ordre n° 1 émis : Ordre d’engagement · crue de l’Arve",
      source: "Chef d’intervention",
      recipient: "Chef situation, Logistique, Télématique, PC front",
      channel: "Message",
      reliability: "Confirmé",
      action:
        "Fermer les accès aux berges, protéger le quai Charles-Page, garder une réserve alertée.",
      tags: ["ordre"],
    },
    CHIEF,
  );
  const entry = j.entries.at(-1)!;
  j = {
    ...j,
    entries: j.entries.map((e) =>
      e.id === entry.id
        ? {
            ...e,
            createdAt: at(35),
            revisions: e.revisions.map((r) => ({ ...r, at: at(35) })),
          }
        : e,
    ),
  };
  ops = j.ops;

  const prefill = orderPrefill(j, Date.parse(at(30)), (iso) =>
    new Date(iso).toLocaleTimeString("fr-CH", {
      timeZone: "Europe/Zurich",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const resources = j.ops.resources;
  const orderId = crypto.randomUUID();
  const broadcastId = crypto.randomUUID();
  const distribution = [
    "Chef situation",
    "Logistique",
    "Télématique",
    "PC front",
  ];
  put(
    "orders",
    {
      ...emptyOrder(prefill),
      id: orderId,
      number: 1,
      kind: "Ordre d’engagement",
      title: "Ordre d’engagement · crue de l’Arve",
      status: "Émis",
      issuedAt: at(35),
      issuer: "Chef d’intervention",
      neighbours:
        "SIS Carouge engagé au pont des Acacias. Police : bouclage route de Veyrier.",
      missions: [
        newMission({
          unit: "Équipe Bravo",
          task: "Fermer et baliser les accès aux berges du quai Charles-Page.",
          role: "Chef situation",
          dueAt: at(60),
          refs: resources[0] ? [ref("resource", resources[0].id)] : [],
          done: true,
        }),
        newMission({
          unit: "Cellule logistique",
          task: "Livrer 200 sacs de sable au point de rassemblement Acacias.",
          role: "Logistique",
          dueAt: at(170),
          refs: [ref("entry", j.entries[3].id)],
        }),
        newMission({
          unit: "Cellule télématique",
          task: "Contrôle de liaison sur G102 toutes les heures, noter au journal.",
          role: "Télématique",
          dueAt: at(180),
        }),
      ],
      logistics: "Ravitaillement au PC Carouge dès 12:00.",
      medical: "Sanitaire (144) en réserve, pas de poste sanitaire avancé.",
      safety: "Gilet de sauvetage obligatoire à moins de 5 m de l’eau.",
      distribution,
      broadcastId,
      entryId: entry.id,
    },
    34,
    CHIEF,
  );
  put(
    "broadcasts",
    {
      id: broadcastId,
      sentAt: at(35),
      title: "Ordre n° 1 : Ordre d’engagement · crue de l’Arve",
      body: "Intention : fermer et baliser les accès aux berges, protéger les bâtiments du quai, garder une réserve alertée.",
      kind: "Ordre",
      priority: "Important",
      target: `order:${orderId}`,
      recipients: distribution,
      ack: "Compris",
      deadline: 15,
      sender: "Chef d’intervention · fictif",
      closedAt: "",
      source: "",
    },
    35,
    CHIEF,
  );
  const ack = (
    recipient: string,
    minutes: number,
    post: string,
    role: string,
  ) =>
    put(
      "acks",
      {
        id: crypto.randomUUID(),
        broadcastId,
        recipient,
        kind: "Compris",
        at: at(minutes),
        post,
        role,
        note: "",
        source: "",
      },
      minutes,
      post,
    );
  ack("Chef situation", 38, "Opérateur B · fictif", "Chef situation");
  ack("Logistique", 41, "Fictif Rochat", "Logistique");
  ack("PC front", 47, "Fictive Dubois", "PC front");
  // Télématique has not answered: flagged late after 15 min.

  put(
    "orders",
    {
      ...emptyOrder(),
      id: crypto.randomUUID(),
      number: 2,
      kind: "Ordre complémentaire",
      baseId: orderId,
      title: "Complément à l’ordre n° 1 · relève de 18:00",
      intention: "Inchangée.",
      missions: [
        newMission({
          unit: "Cellule personnel",
          task: "Préparer la relève de l’équipe Bravo (6 personnes).",
          role: "Personnel / admin",
          dueAt: at(300),
        }),
      ],
      distribution,
    },
    140,
    OPERATOR_A,
  );

  put(
    "broadcasts",
    {
      id: crypto.randomUUID(),
      sentAt: at(146),
      title: "Route de Veyrier fermée dans les deux sens",
      body: "Déviation par la route de Troinex. Informer les équipes en déplacement.",
      kind: "Consigne",
      priority: "Urgent",
      target: "",
      recipients: ["Tous"],
      ack: "Lu",
      deadline: 10,
      sender: "Chef situation · Opérateur B · fictif",
      closedAt: "",
      source: "",
    },
    146,
    "Opérateur B · fictif",
  );

  if (resources[1])
    put(
      "assignments",
      {
        id: crypto.randomUUID(),
        target: ref("resource", resources[1].id),
        role: "Logistique",
        person: "",
        dueAt: at(200),
        done: false,
        note: "Faire le plein des véhicules avant la relève.",
      },
      130,
      CHIEF,
    );

  return journalSchema.parse({
    ...j,
    ops,
    history: [...j.history, ...events].sort(
      (a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id),
    ),
  });
}
