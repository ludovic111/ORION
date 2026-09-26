import { time, type Journal } from "./journal.ts";
import type { RefKind } from "./ops.ts";
import type { Item } from "./links.ts";
import { progress } from "./checklists.ts";
import { requestLabel, requestLate } from "./requests.ts";

// Items and implicit links of the conduct follow-up records (checklists,
// requests, shifts), added to the graph by shared/links.ts.

type Pushed = Omit<Item, "ref">;
type RawEdge = { a: string; b: string; label: string };

export function conductItems(journal: Journal): Pushed[] {
  const o = journal.ops;
  const out: Pushed[] = [];
  const now = Date.now();
  for (const c of o.checklists) {
    const p = progress(journal, c, now);
    out.push({
      kind: "checklist" as RefKind,
      id: c.id,
      title: c.title,
      subtitle: [
        `${p.done}/${p.total} étapes`,
        c.closedAt ? "close" : p.late ? `${p.late} contrôle(s) en retard` : "",
        c.event !== c.title ? c.event : "",
      ]
        .filter(Boolean)
        .join(" · "),
      tone: c.closedAt || p.complete ? "muted" : p.late ? "crit" : "accent",
      at: c.startedAt,
      text: [
        c.title,
        c.event,
        c.location,
        c.notes,
        ...c.steps.map((s) => s.text),
      ].join(" "),
    });
  }
  for (const r of o.requests)
    out.push({
      kind: "request" as RefKind,
      id: r.id,
      title: requestLabel(r),
      subtitle: [r.status, r.provider, r.eta && `arrivée ${time(r.eta)}`]
        .filter(Boolean)
        .join(" · "),
      tone: requestLate(r, now)
        ? "crit"
        : r.status === "Arrivé"
          ? "ok"
          : r.status === "Refusé" ||
              r.status === "Annulé" ||
              r.status === "Libéré"
            ? "muted"
            : "warn",
      at: r.requestedAt,
      text: [
        r.title,
        r.kind,
        r.requester,
        r.provider,
        r.contact,
        r.destination,
        r.reason,
        r.notes,
      ].join(" "),
    });
  const names = new Map(o.members.map((m) => [m.id, m.name]));
  for (const s of o.shifts)
    out.push({
      kind: "shift" as RefKind,
      id: s.id,
      title: s.title,
      subtitle: `${time(s.start)}–${time(s.end)} · ${s.memberIds.length} pers.`,
      tone:
        Date.parse(s.start) <= now && now < Date.parse(s.end) ? "accent" : "",
      at: s.start,
      text: [
        s.title,
        s.people,
        s.notes,
        ...s.memberIds.map((id) => names.get(id) ?? ""),
      ].join(" "),
    });
  return out;
}

/** Links implied by the records: tick → entry, request → resource… */
export function conductEdges(journal: Journal, exists: Set<string>): RawEdge[] {
  const o = journal.ops;
  const out: RawEdge[] = [];
  const add = (a: string, b: string, label: string) => {
    if (exists.has(a) && exists.has(b)) out.push({ a, b, label });
  };
  for (const t of o.checklistTicks)
    if (t.entryId)
      add(
        `checklist:${t.checklistId}`,
        `entry:${t.entryId}`,
        "étape consignée",
      );
  for (const r of o.requests) {
    if (r.resourceId)
      add(`request:${r.id}`, `resource:${r.resourceId}`, "moyen livré");
    if (r.entryId) add(`request:${r.id}`, `entry:${r.entryId}`, "demande");
    for (const s of r.steps)
      if (s.entryId && s.entryId !== r.entryId)
        add(`request:${r.id}`, `entry:${s.entryId}`, s.status.toLowerCase());
  }
  for (const s of o.shifts)
    for (const id of s.memberIds)
      add(`shift:${s.id}`, `member:${id}`, "de relève");
  return out;
}
