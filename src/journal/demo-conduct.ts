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
import { formatTime } from "../../shared/i18n/core.ts";
import { t } from "./i18n-demo2.ts";

// Orders, diffusions with their receipts and an assignment for the
// demonstration (appended to demoWorkspace, all fictitious): an issued order
// whose telematics receipt is late, a draft complementary order, a notice
// to everyone still waiting for its receipt. Texts are written in the
// language of the post that opens the demonstration.

export function withConductDemo(
  journal: Journal,
  at: (minutes: number) => string,
): Journal {
  const CHIEF = t("Chef d’intervention · fictif");
  const OPERATOR_A = t("Opérateur A · fictif");
  const OPERATOR_B = t("Opérateur B · fictif");
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
      message: t("Ordre n° 1 émis : Ordre d’engagement · crue de l’Arve"),
      source: t("Chef d’intervention"),
      recipient: t("Chef situation, Logistique, Télématique, PC front"),
      channel: "Message",
      reliability: "Confirmé",
      action: t(
        "Fermer les accès aux berges, protéger le quai Charles-Page, garder une réserve alertée.",
      ),
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

  const prefill = orderPrefill(j, Date.parse(at(30)), (iso) => formatTime(iso));
  const resources = j.ops.resources;
  const orderId = crypto.randomUUID();
  const broadcastId = crypto.randomUUID();
  const situation = t("Chef situation");
  const logistics = t("Logistique");
  const telematics = t("Télématique");
  const front = t("PC front");
  const distribution = [situation, logistics, telematics, front];
  put(
    "orders",
    {
      ...emptyOrder(prefill),
      id: orderId,
      number: 1,
      kind: t("Ordre d’engagement"),
      title: t("Ordre d’engagement · crue de l’Arve"),
      status: "Émis",
      issuedAt: at(35),
      issuer: t("Chef d’intervention"),
      neighbours: t(
        "SIS Carouge engagé au pont des Acacias. Police : bouclage route de Veyrier.",
      ),
      missions: [
        newMission({
          unit: t("Équipe Bravo"),
          task: t(
            "Fermer et baliser les accès aux berges du quai Charles-Page.",
          ),
          role: situation,
          dueAt: at(60),
          refs: resources[0] ? [ref("resource", resources[0].id)] : [],
          done: true,
        }),
        newMission({
          unit: t("Cellule logistique"),
          task: t(
            "Livrer 200 sacs de sable au point de rassemblement Acacias.",
          ),
          role: logistics,
          dueAt: at(170),
          refs: [ref("entry", j.entries[3].id)],
        }),
        newMission({
          unit: t("Cellule télématique"),
          task: t(
            "Contrôle de liaison sur G102 toutes les heures, noter au journal.",
          ),
          role: telematics,
          dueAt: at(180),
        }),
      ],
      logistics: t("Ravitaillement au PC Carouge dès 12:00."),
      medical: t("Sanitaire (144) en réserve, pas de poste sanitaire avancé."),
      safety: t("Gilet de sauvetage obligatoire à moins de 5 m de l’eau."),
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
      title: t("Ordre n° 1 : Ordre d’engagement · crue de l’Arve"),
      body: t(
        "Intention : fermer et baliser les accès aux berges, protéger les bâtiments du quai, garder une réserve alertée.",
      ),
      kind: t("Ordre"),
      priority: "Important",
      target: `order:${orderId}`,
      recipients: distribution,
      ack: "Compris",
      deadline: 15,
      sender: CHIEF,
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
  ack(situation, 38, OPERATOR_B, situation);
  ack(logistics, 41, "Fictif Rochat", logistics);
  ack(front, 47, "Fictive Dubois", front);
  // Télématique has not answered: flagged late after 15 min.

  put(
    "orders",
    {
      ...emptyOrder(),
      id: crypto.randomUUID(),
      number: 2,
      kind: t("Ordre complémentaire"),
      baseId: orderId,
      title: t("Complément à l’ordre n° 1 · relève de 18:00"),
      intention: t("Inchangée."),
      missions: [
        newMission({
          unit: t("Cellule personnel"),
          task: t("Préparer la relève de l’équipe Bravo (6 personnes)."),
          role: t("Personnel / admin"),
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
      title: t("Route de Veyrier fermée dans les deux sens"),
      body: t(
        "Déviation par la route de Troinex. Informer les équipes en déplacement.",
      ),
      kind: t("Consigne"),
      priority: "Urgent",
      target: "",
      recipients: ["Tous"],
      ack: "Lu",
      deadline: 10,
      sender: t("Chef situation · Opérateur B · fictif"),
      closedAt: "",
      source: "",
    },
    146,
    OPERATOR_B,
  );

  if (resources[1])
    put(
      "assignments",
      {
        id: crypto.randomUUID(),
        target: ref("resource", resources[1].id),
        role: logistics,
        person: "",
        dueAt: at(200),
        done: false,
        note: t("Faire le plein des véhicules avant la relève."),
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
