import {
  current,
  numberLabel,
  time,
  type Entry,
  type Journal,
} from "./journal.ts";
import { activeAssignment, callsignKey } from "./radio.ts";
import { referencedEntries } from "./workflow.ts";
import { nowIso, type Link, type Ops, type RefKind } from "./ops.ts";
import { conductEdges, conductItems } from "./conduct-items.ts";
import {
  conductEdges as followUpEdges,
  conductItems as followUpItems,
} from "./conduct-links.ts";
import { enumLabel } from "./i18n/enums.ts";
import { t } from "./i18n/links.ts";

// Every item of a journal can be referred to as "kind:id". Links are either
// explicit (ops.links, created by the operator or by an action such as
// "inscrire au journal") or implicit (same call sign, entry references,
// message transcribed into an entry, member of a cell…).

export type Ref = `${RefKind}:${string}`;
export const ref = (kind: RefKind, id: string) => `${kind}:${id}` as Ref;
export function parseRef(value: string): { kind: RefKind; id: string } {
  const at = value.indexOf(":");
  return { kind: value.slice(0, at) as RefKind, id: value.slice(at + 1) };
}

export type Module =
  | "situation"
  | "journal"
  | "messages"
  | "map"
  | "resources"
  | "missions"
  | "team"
  | "contacts"
  | "radio"
  | "weather"
  | "agenda"
  | "network"
  | "trace"
  | "docs"
  | "orders"
  | "tasks"
  | "checklists"
  | "debrief";

type Kind = { label: string; plural: string; module: Module; hue: number };
type Label = Parameters<typeof t>[0];
// Labels are getters: read in the language of the post at each use.
const kind = (
  label: Label,
  plural: Label,
  module: Module,
  hue: number,
): Kind => ({
  get label() {
    return t(label);
  },
  get plural() {
    return t(plural);
  },
  module,
  hue,
});

export const KIND_INFO: Record<RefKind, Kind> = {
  entry: kind("Entrée", "Entrées", "journal", 212),
  message: kind("Message", "Messages", "messages", 265),
  place: kind("Carte", "Objets carte", "map", 160),
  resource: kind("Moyen", "Moyens", "resources", 28),
  member: kind("Personne", "Équipe", "team", 330),
  cell: kind("Poste (cellule)", "Postes / cellules", "team", 300),
  contact: kind("Contact", "Contacts", "contacts", 190),
  agenda: kind("Rendez-vous", "Agenda", "agenda", 48),
  fact: kind("Renseignement", "Renseignements clés", "situation", 0),
  board: kind("Situation", "Tableaux de situation", "situation", 10),
  alert: kind("Alerte météo", "Alertes météo", "weather", 38),
  observation: kind("Observation météo", "Observations météo", "weather", 200),
  terminal: kind("Terminal radio", "Terminaux", "radio", 140),
  station: kind("Nom d’appel", "Noms d’appel", "radio", 120),
  talkgroup: kind("Groupe radio", "Groupes radio", "radio", 100),
  order: kind("Ordre", "Ordres", "orders", 18),
  broadcast: kind("Diffusion", "Diffusions", "orders", 238),
  checklist: kind("Liste de contrôle", "Listes de contrôle", "checklists", 96),
  request: kind("Demande de moyens", "Demandes de moyens", "resources", 48),
  shift: kind("Relève", "Plan de relève", "team", 316),
};

export type Item = {
  ref: Ref;
  kind: RefKind;
  id: string;
  title: string;
  subtitle: string;
  /** Status or priority to colour the item. */
  tone: "" | "ok" | "warn" | "crit" | "accent" | "muted";
  at?: string;
  text: string;
};

const clip = (s: string, n = 90) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
const firstLine = (s: string) => s.split("\n").find((l) => l.trim()) ?? "";

/** Every item of the journal, ready to display, search and link. */
export function items(journal: Journal): Item[] {
  const o = journal.ops;
  const r = journal.radio;
  const out: Item[] = [];
  const push = (item: Omit<Item, "ref">) =>
    out.push({ ...item, ref: ref(item.kind, item.id) });
  for (const e of journal.entries) {
    const f = current(e);
    push({
      kind: "entry",
      id: e.id,
      title: `${numberLabel(e)} ${clip(firstLine(f.message), 70)}`,
      subtitle: [enumLabel(f.type), time(f.happenedAt), f.source]
        .filter(Boolean)
        .join(" · "),
      tone:
        f.status === "Annulé"
          ? "muted"
          : f.priority === "Urgent"
            ? "crit"
            : ["À traiter", "En cours"].includes(f.status)
              ? "warn"
              : "",
      at: f.happenedAt,
      text: [
        f.message,
        f.type,
        f.source,
        f.recipient,
        f.location,
        f.action,
        f.assignee,
        f.resources,
        f.notes,
        ...f.tags,
      ].join(" "),
    });
  }
  for (const m of o.messages)
    push({
      kind: "message",
      id: m.id,
      title: clip(m.subject || firstLine(m.body) || t("Message"), 80),
      subtitle: [
        m.from && t("De {from}", { from: m.from }),
        m.to && t("à {to}", { to: m.to }),
        time(m.receivedAt),
      ]
        .filter(Boolean)
        .join(" · "),
      tone:
        m.priority === "Urgent"
          ? "crit"
          : m.status === "Nouveau"
            ? "accent"
            : m.status === "Classé"
              ? "muted"
              : "",
      at: m.receivedAt,
      text: [
        m.subject,
        m.body,
        m.from,
        m.to,
        m.location,
        m.category,
        m.notes,
        ...m.tags,
      ].join(" "),
    });
  for (const p of o.places)
    push({
      kind: "place",
      id: p.id,
      title: p.label || t("Objet sans nom"),
      subtitle: [
        p.layer,
        p.kind === "point"
          ? t("point")
          : p.kind === "line"
            ? t("tracé")
            : p.kind === "area"
              ? t("zone")
              : t("texte"),
      ]
        .filter(Boolean)
        .join(" · "),
      tone: p.layer === "Dangers" ? "warn" : "",
      at: p.updatedAt,
      text: [p.label, p.notes, p.layer, p.symbol].join(" "),
    });
  for (const x of o.resources)
    push({
      kind: "resource",
      id: x.id,
      title: x.name,
      subtitle: [enumLabel(x.status), x.kind, x.callsign, x.location]
        .filter(Boolean)
        .join(" · "),
      tone:
        x.status === "Engagé"
          ? "accent"
          : x.status === "Disponible"
            ? "ok"
            : x.status === "Hors service"
              ? "crit"
              : x.status === "En route" || x.status === "Alerté"
                ? "warn"
                : "",
      at: x.updatedAt,
      text: [
        x.name,
        x.status,
        x.kind,
        x.organization,
        x.callsign,
        x.location,
        x.mission,
        x.contact,
        x.notes,
      ].join(" "),
    });
  const cellName = new Map(o.cells.map((c) => [c.id, c.name]));
  for (const x of o.members)
    push({
      kind: "member",
      id: x.id,
      title: [x.grade, x.name].filter(Boolean).join(" "),
      subtitle: [x.role, cellName.get(x.cellId), x.callsign]
        .filter(Boolean)
        .join(" · "),
      tone:
        x.status === "Présent"
          ? "ok"
          : x.status === "En pause"
            ? "warn"
            : "muted",
      at: x.updatedAt,
      text: [
        x.name,
        x.grade,
        x.role,
        x.callsign,
        x.phone,
        x.email,
        x.notes,
        cellName.get(x.cellId),
      ].join(" "),
    });
  for (const x of o.cells)
    push({
      kind: "cell",
      id: x.id,
      title: x.name,
      subtitle: [x.kind, x.location, x.radio].filter(Boolean).join(" · "),
      tone: "",
      at: x.updatedAt,
      text: [x.name, x.kind, x.location, x.phone, x.radio, x.notes].join(" "),
    });
  for (const x of o.contacts)
    push({
      kind: "contact",
      id: x.id,
      title: x.name,
      subtitle: [x.role, x.organization, x.phone].filter(Boolean).join(" · "),
      tone: "",
      at: x.updatedAt,
      text: [
        x.name,
        x.organization,
        x.role,
        x.category,
        x.phone,
        x.phone2,
        x.email,
        x.radio,
        x.address,
        x.notes,
      ].join(" "),
    });
  for (const x of o.agenda)
    push({
      kind: "agenda",
      id: x.id,
      title: x.title,
      subtitle: [time(x.at), x.kind, x.location].filter(Boolean).join(" · "),
      tone: x.done
        ? "muted"
        : Date.parse(x.at) < Date.now()
          ? "warn"
          : "accent",
      at: x.at,
      text: [x.title, x.kind, x.location, x.participants, x.notes].join(" "),
    });
  for (const x of o.facts)
    push({
      kind: "fact",
      id: x.id,
      title: t("{label} : {value}", {
        label: x.label,
        value: `${x.value || "—"}${x.unit ? ` ${x.unit}` : ""}`,
      }),
      subtitle: x.category,
      tone: "",
      at: x.updatedAt,
      text: [x.label, x.value, x.category, x.note].join(" "),
    });
  for (const x of o.boards)
    push({
      kind: "board",
      id: x.id,
      title: x.title,
      subtitle: clip(firstLine(x.body), 80),
      tone: "",
      at: x.updatedAt,
      text: [x.title, x.body].join(" "),
    });
  for (const x of o.alerts)
    push({
      kind: "alert",
      id: x.id,
      title: t("{hazard} · degré {level}", {
        hazard: x.hazard,
        level: x.level,
      }),
      subtitle: [x.region, x.source].filter(Boolean).join(" · "),
      tone: Number(x.level) >= 4 ? "crit" : Number(x.level) >= 3 ? "warn" : "",
      at: x.updatedAt,
      text: [x.hazard, x.region, x.source, x.notes].join(" "),
    });
  for (const x of o.observations)
    push({
      kind: "observation",
      id: x.id,
      title: [x.conditions || t("Observation"), x.temperature]
        .filter(Boolean)
        .join(" · "),
      subtitle: [time(x.at), x.place, x.wind].filter(Boolean).join(" · "),
      tone: "",
      at: x.at,
      text: [
        x.place,
        x.conditions,
        x.temperature,
        x.wind,
        x.precipitation,
        x.visibility,
        x.notes,
      ].join(" "),
    });
  for (const item of conductItems(journal)) push(item);
  followUpItems(journal).forEach(push);
  for (const x of r.terminals) {
    const open = activeAssignment(x);
    push({
      kind: "terminal",
      id: x.id,
      title: t("Terminal {label}", { label: x.label }),
      subtitle: open
        ? t("{holder} · depuis {time}", {
            holder: open.callsign || open.holder,
            time: time(open.issuedAt),
          })
        : enumLabel(x.condition),
      tone: open ? "accent" : x.condition === "Opérationnel" ? "ok" : "crit",
      text: [
        x.label,
        x.condition,
        x.model,
        x.serial,
        x.rfsi,
        x.notes,
        open?.holder,
        open?.callsign,
      ].join(" "),
    });
  }
  for (const s of r.stations)
    push({
      kind: "station",
      id: s.id,
      title: s.callsign,
      subtitle: [s.role, s.unit].filter(Boolean).join(" · "),
      tone: "",
      text: [s.callsign, s.role, s.unit, s.notes].join(" "),
    });
  for (const g of r.talkgroups)
    push({
      kind: "talkgroup",
      id: g.id,
      title: `${g.number ? `${g.number} · ` : ""}${g.name}`,
      subtitle: [enumLabel(g.mode), enumLabel(g.usage)].join(" · "),
      tone: "",
      text: [g.name, g.number, g.mode, g.usage, g.notes].join(" "),
    });
  return out;
}

export type Edge = {
  a: Ref;
  b: Ref;
  label: string;
  /** Explicit link id, when the operator can remove it. */
  linkId?: string;
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr");

/** All links between items, explicit and implicit, without duplicates. */
export function edges(journal: Journal): Edge[] {
  const o = journal.ops;
  const r = journal.radio;
  const out = new Map<string, Edge>();
  const add = (a: Ref, b: Ref, label: string, linkId?: string) => {
    if (a === b) return;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const known = out.get(key);
    if (!known || (linkId && !known.linkId))
      out.set(key, { a, b, label, linkId });
  };
  const exists = new Set(items(journal).map((i) => i.ref));
  for (const l of o.links)
    if (exists.has(l.a as Ref) && exists.has(l.b as Ref))
      add(l.a as Ref, l.b as Ref, l.label, l.id);

  // Entries citing other entries (#003).
  for (const e of journal.entries)
    for (const target of referencedEntries(journal.entries, e))
      add(ref("entry", e.id), ref("entry", target.id), t("suite de"));
  for (const m of o.messages)
    if (m.entryId && journal.entries.some((e) => e.id === m.entryId))
      add(
        ref("message", m.id),
        ref("entry", m.entryId),
        t("inscrit au journal"),
      );
  for (const [a, b, label] of conductEdges(journal))
    if (exists.has(a as Ref) && exists.has(b as Ref))
      add(a as Ref, b as Ref, label);
  for (const m of o.members)
    if (m.cellId && o.cells.some((c) => c.id === m.cellId))
      add(ref("member", m.id), ref("cell", m.cellId), t("membre de"));
  for (const s of r.stations)
    for (const [g, label] of [
      [s.primary, t("groupe principal")],
      [s.fallback, t("groupe de secours")],
    ] as const)
      if (g) add(ref("station", s.id), ref("talkgroup", g), label);

  // Names and call signs: a station, a person, a resource, a cell or a
  // contact named in another item.
  const names = new Map<string, Ref[]>();
  const name = (value: string, target: Ref) => {
    const key = norm(value);
    if (key.length < 2) return;
    names.set(key, [...(names.get(key) ?? []), target]);
  };
  for (const s of r.stations) name(s.callsign, ref("station", s.id));
  for (const m of o.members) {
    name(m.name, ref("member", m.id));
    if (m.callsign) name(m.callsign, ref("member", m.id));
  }
  for (const c of o.cells) name(c.name, ref("cell", c.id));
  for (const x of o.resources) {
    name(x.name, ref("resource", x.id));
    if (x.callsign) name(x.callsign, ref("resource", x.id));
  }
  for (const c of o.contacts) name(c.name, ref("contact", c.id));
  const mention = (from: Ref, value: string, label: string) => {
    if (!value) return;
    for (const part of value.split(/[,;/]| et /)) {
      const targets = names.get(norm(part));
      targets?.forEach((target) => add(from, target, label));
    }
  };
  for (const e of journal.entries) {
    const f = current(e);
    const from = ref("entry", e.id);
    mention(from, f.source, t("émetteur"));
    mention(from, f.recipient, t("destinataire"));
    mention(from, f.assignee, t("responsable"));
  }
  for (const m of o.messages) {
    const from = ref("message", m.id);
    mention(from, m.from, t("émetteur"));
    mention(from, m.to, t("destinataire"));
  }
  for (const x of r.terminals) {
    const open = activeAssignment(x);
    if (!open) continue;
    const station = r.stations.find(
      (s) =>
        open.callsign && callsignKey(s.callsign) === callsignKey(open.callsign),
    );
    if (station)
      add(ref("terminal", x.id), ref("station", station.id), t("remis à"));
    mention(ref("terminal", x.id), open.holder, t("détenteur"));
  }
  for (const x of o.resources) {
    const station = r.stations.find(
      (s) => x.callsign && callsignKey(s.callsign) === callsignKey(x.callsign),
    );
    if (station)
      add(ref("resource", x.id), ref("station", station.id), t("nom d’appel"));
  }
  for (const m of o.members) {
    const station = r.stations.find(
      (s) => m.callsign && callsignKey(s.callsign) === callsignKey(m.callsign),
    );
    if (station)
      add(ref("member", m.id), ref("station", station.id), t("nom d’appel"));
  }
  for (const e of followUpEdges(journal, exists))
    add(e.a as Ref, e.b as Ref, e.label);
  return [...out.values()];
}

/** Items linked to one item, with the relation label. */
export function neighbours(
  journal: Journal,
  target: Ref,
  all = edges(journal),
): { ref: Ref; label: string; linkId?: string }[] {
  return all
    .filter((e) => e.a === target || e.b === target)
    .map((e) => ({
      ref: e.a === target ? e.b : e.a,
      label: e.label,
      linkId: e.linkId,
    }));
}

export function addLink(
  ops: Ops,
  a: Ref,
  b: Ref,
  label: string,
  author: string,
): Ops {
  if (a === b) return ops;
  if (
    ops.links.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))
  )
    return ops;
  const at = nowIso();
  const link: Link = {
    id: crypto.randomUUID(),
    createdAt: at,
    updatedAt: at,
    by: author,
    a,
    b,
    label,
  };
  return { ...ops, links: [...ops.links, link] };
}

export const removeLink = (ops: Ops, id: string): Ops => ({
  ...ops,
  links: ops.links.filter((l) => l.id !== id),
});

export function searchItems(list: Item[], query: string) {
  const terms = norm(query).split(" ").filter(Boolean);
  if (!terms.length) return list;
  return list.filter((i) => {
    const hay = norm(`${i.title} ${i.subtitle} ${i.text}`);
    return terms.every((term) => hay.includes(term));
  });
}

export const entryRef = (e: Entry) => ref("entry", e.id);
