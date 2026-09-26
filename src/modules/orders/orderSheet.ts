import { dateTime } from "../../../shared/journal";
import type { Order } from "../../../shared/conduct";
import { recipientStates } from "../../../shared/diffusion";
import type { Ack, Broadcast } from "../../../shared/conduct";
import type { FormSheet, SheetField } from "../../print/sheet";

const or = (value: string) => value.trim() || "—";
const f = (
  label: string,
  value: string,
  extra: Partial<SheetField> = {},
): SheetField => ({ label, value: or(value), ...extra });

/** A4 form of an order, in the five chapters of the Swiss scheme. */
export function orderSheet(
  order: Order,
  label: string,
  broadcast?: Broadcast,
  acks: Ack[] = [],
  describe: (ref: string) => string = (r) => r,
): FormSheet {
  const receipts = broadcast
    ? recipientStates(broadcast, acks)
        .map((s) =>
          s.ack
            ? `${s.recipient} : ${s.ack.kind} ${dateTime(s.ack.at)}${s.ack.post ? ` (${s.ack.post})` : ""}`
            : `${s.recipient} : sans accusé`,
        )
        .join("\n")
    : "";
  return {
    kind: order.kind || "Ordre",
    idLabel: "Ordre",
    number: label,
    boxes: [
      { label: "État", value: order.status, alert: order.status === "Annulé" },
      {
        label: "Émis le",
        value: order.issuedAt ? dateTime(order.issuedAt) : "—",
      },
      { label: "Par", value: or(order.issuer) },
    ],
    note:
      order.status === "Annulé"
        ? { text: "ORDRE ANNULÉ · conservé pour la traçabilité", alert: true }
        : order.status === "Brouillon"
          ? { text: "PROJET · pas encore émis" }
          : order.source
            ? { text: `Reçu de ${order.source} par la liaison` }
            : undefined,
    sections: [
      {
        title: "Objet",
        rows: [
          [
            f("Titre", order.title, { strong: true, span: 2 }),
            f("Complète", order.baseId ? "un ordre précédent" : ""),
          ],
        ],
      },
      {
        title: "1 · Orientation",
        rows: [
          [f("Situation", order.situation, { tall: true })],
          [f("Danger / évolution probable", order.danger, { tall: true })],
          [f("Moyens voisins et partenaires", order.neighbours)],
        ],
      },
      {
        title: "2 · Intention",
        rows: [[f("Idée de manœuvre", order.intention, { tall: true })]],
      },
      {
        title: "3 · Missions",
        rows: order.missions.length
          ? order.missions.map((m) => [
              f("Unité / cellule", m.unit, { strong: true }),
              f(
                "Mission",
                [
                  m.task,
                  m.refs.length
                    ? `Avec : ${m.refs.map(describe).join(", ")}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n"),
                { span: 3 },
              ),
              f("Échéance", m.dueAt ? dateTime(m.dueAt) : "", { mono: true }),
            ])
          : [[f("Missions", "")]],
      },
      {
        title: "4 · Dispositions particulières",
        rows: [
          [f("Logistique", order.logistics), f("Sanitaire", order.medical)],
          [f("Sécurité", order.safety)],
        ],
      },
      {
        title: "5 · Emplacements et liaisons",
        rows: [
          [
            f("PC / emplacements", order.pc),
            f("Heures des rapports", order.reports),
          ],
          [f("Liaisons radio", order.radio)],
        ],
      },
      {
        title: "Distribution",
        rows: [
          [
            f("Destinataires", order.distribution.join(", ")),
            ...(receipts
              ? [f("Accusés de lecture", receipts, { span: 2 })]
              : []),
          ],
          ...(order.notes ? [[f("Remarques", order.notes)]] : []),
        ],
      },
    ],
    visa: [
      {
        title: "Visa",
        labels: ["Chef d’intervention", "Date / heure", "Signature"],
      },
    ],
    footer: `ordre ${label}`,
  };
}
