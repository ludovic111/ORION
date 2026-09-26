import type { Journal } from "./journal.ts";
import type { Item } from "./links.ts";
import { orderLabels } from "./orders.ts";
import { recipientStates } from "./diffusion.ts";
import { formatTime } from "./i18n/core.ts";
import { enumLabel } from "./i18n/enums.ts";
import { t } from "./i18n/conduct-items.ts";

// Orders and diffusions as items of the link graph (search ⌘K, previews,
// links), see shared/links.ts.

const clip = (s: string, n = 90) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
const hhmm = (iso: string) => (iso ? formatTime(iso) : "");

export function conductItems(journal: Journal): Omit<Item, "ref">[] {
  const o = journal.ops;
  const out: Omit<Item, "ref">[] = [];
  if (!o.orders.length && !o.broadcasts.length) return out;
  const labels = orderLabels(journal);
  for (const x of o.orders)
    out.push({
      kind: "order",
      id: x.id,
      title: t("Ordre {number} · {title}", {
        number: labels.get(x.id) ?? x.number,
        title: clip(x.title, 70),
      }),
      subtitle: [
        x.kind,
        enumLabel(x.status),
        x.issuedAt && hhmm(x.issuedAt),
        x.source && t("de {source}", { source: x.source }),
      ]
        .filter(Boolean)
        .join(" · "),
      tone:
        x.status === "Annulé"
          ? "muted"
          : x.status === "Brouillon"
            ? "warn"
            : "",
      at: x.issuedAt || x.updatedAt,
      text: [
        x.title,
        x.kind,
        x.status,
        x.situation,
        x.danger,
        x.intention,
        ...x.missions.map((m) => `${m.unit} ${m.task} ${m.role}`),
        x.logistics,
        x.medical,
        x.safety,
        x.pc,
        x.radio,
        x.reports,
        x.distribution.join(" "),
        x.notes,
        x.source,
      ].join(" "),
    });
  const now = Date.now();
  for (const b of o.broadcasts) {
    const states = recipientStates(b, o.acks, now);
    const waiting = states.filter((s) => !s.ack).length;
    out.push({
      kind: "broadcast",
      id: b.id,
      title: clip(b.title, 80),
      subtitle: [
        b.kind,
        hhmm(b.sentAt),
        b.ack === "Aucun"
          ? t("sans accusé")
          : waiting
            ? t("{n} sans accusé", { n: waiting })
            : t("tous ont répondu"),
      ]
        .filter(Boolean)
        .join(" · "),
      tone: states.some((s) => s.late)
        ? "crit"
        : b.priority === "Urgent"
          ? "crit"
          : waiting && b.ack !== "Aucun"
            ? "warn"
            : "",
      at: b.sentAt,
      text: [
        b.title,
        b.body,
        b.kind,
        b.sender,
        b.recipients.join(" "),
        b.source,
      ].join(" "),
    });
  }
  return out;
}

/** Implicit links: order ↔ its journal entry, mission ↔ what it uses, diffusion → item. */
export function conductEdges(journal: Journal): [string, string, string][] {
  const out: [string, string, string][] = [];
  for (const x of journal.ops.orders) {
    const self = `order:${x.id}`;
    if (x.entryId)
      out.push([self, `entry:${x.entryId}`, t("inscrit au journal")]);
    if (x.baseId) out.push([self, `order:${x.baseId}`, t("complète")]);
    if (x.broadcastId)
      out.push([self, `broadcast:${x.broadcastId}`, t("diffusé")]);
    for (const m of x.missions)
      for (const r of m.refs) out.push([self, r, m.unit || t("mission")]);
  }
  for (const b of journal.ops.broadcasts)
    if (b.target) out.push([`broadcast:${b.id}`, b.target, t("diffuse")]);
  return out;
}
