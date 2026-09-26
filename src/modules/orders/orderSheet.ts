import { dateTime } from "../../../shared/journal";
import type { Order } from "../../../shared/conduct";
import { recipientStates } from "../../../shared/diffusion";
import type { Ack, Broadcast } from "../../../shared/conduct";
import type { FormSheet, SheetField } from "../../print/sheet";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";

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
            ? t(
                s.ack.post
                  ? "{recipient} : {kind} {at} ({post})"
                  : "{recipient} : {kind} {at}",
                {
                  recipient: s.recipient,
                  kind: enumLabel(s.ack.kind),
                  at: dateTime(s.ack.at),
                  post: s.ack.post,
                },
              )
            : t("{recipient} : sans accusé", { recipient: s.recipient }),
        )
        .join("\n")
    : "";
  return {
    kind: order.kind || t("Ordre"),
    idLabel: t("Ordre"),
    number: label,
    boxes: [
      {
        label: t("État"),
        value: enumLabel(order.status),
        alert: order.status === "Annulé",
      },
      {
        label: t("Émis le"),
        value: order.issuedAt ? dateTime(order.issuedAt) : "—",
      },
      { label: t("Par"), value: or(order.issuer) },
    ],
    note:
      order.status === "Annulé"
        ? {
            text: t("ORDRE ANNULÉ · conservé pour la traçabilité"),
            alert: true,
          }
        : order.status === "Brouillon"
          ? { text: t("PROJET · pas encore émis") }
          : order.source
            ? {
                text: t("Reçu de {source} par la liaison", {
                  source: order.source,
                }),
              }
            : undefined,
    sections: [
      {
        title: t("Objet"),
        rows: [
          [
            f(t("Titre"), order.title, { strong: true, span: 2 }),
            f(t("Complète"), order.baseId ? t("un ordre précédent") : ""),
          ],
        ],
      },
      {
        title: `1 · ${t("Orientation")}`,
        rows: [
          [f(t("Situation"), order.situation, { tall: true })],
          [f(t("Danger / évolution probable"), order.danger, { tall: true })],
          [f(t("Moyens voisins et partenaires"), order.neighbours)],
        ],
      },
      {
        title: `2 · ${t("Intention")}`,
        rows: [[f(t("Idée de manœuvre"), order.intention, { tall: true })]],
      },
      {
        title: `3 · ${t("Missions")}`,
        rows: order.missions.length
          ? order.missions.map((m) => [
              f(t("Unité / cellule"), m.unit, { strong: true }),
              f(
                t("Mission"),
                [
                  m.task,
                  m.refs.length
                    ? t("Avec : {list}", {
                        list: m.refs.map(describe).join(", "),
                      })
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n"),
                { span: 3 },
              ),
              f(t("Échéance"), m.dueAt ? dateTime(m.dueAt) : "", {
                mono: true,
              }),
            ])
          : [[f(t("Missions"), "")]],
      },
      {
        title: `4 · ${t("Dispositions particulières")}`,
        rows: [
          [
            f(t("Logistique"), order.logistics),
            f(t("Sanitaire"), order.medical),
          ],
          [f(t("Sécurité"), order.safety)],
        ],
      },
      {
        title: `5 · ${t("Emplacements et liaisons")}`,
        rows: [
          [
            f(t("PC / emplacements"), order.pc),
            f(t("Heures des rapports"), order.reports),
          ],
          [f(t("Liaisons radio"), order.radio)],
        ],
      },
      {
        title: t("Distribution"),
        rows: [
          [
            f(t("Destinataires"), order.distribution.join(", ")),
            ...(receipts
              ? [f(t("Accusés de lecture"), receipts, { span: 2 })]
              : []),
          ],
          ...(order.notes ? [[f(t("Remarques"), order.notes)]] : []),
        ],
      },
    ],
    visa: [
      {
        title: t("Visa"),
        labels: [t("Chef d’intervention"), t("Date / heure"), t("Signature")],
      },
    ],
    footer: t("ordre {label}", { label }),
  };
}
