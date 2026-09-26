import {
  current,
  needsFollowUp,
  numberLabel,
  type Journal,
} from "./journal.ts";
import {
  assignedTo,
  inbox,
  lateBroadcasts,
  myTasks,
  type Identity,
} from "./diffusion.ts";
import { zurichWall } from "./time.ts";
import { enumLabel } from "./i18n/enums.ts";
import { t as tr } from "./i18n/alarms.ts";

// Alerts that reach people: what should ring or notify this post, and when.
// Pure functions (tested): src/post/AlertService.tsx schedules them with
// setTimeout and shows them (notification, sound, in-app message).
//
// Two sorts of alarm:
// - scheduled: an entry or a task becomes late, a rendez-vous is 5 min
//   away, a diffusion stays without receipt. It rings once when its time
//   passes (between the last check and now).
// - event: an urgent message arrives, something is assigned to this post,
//   a diffusion asks for its receipt. It rings once when it appears (its
//   key was not known), whenever its time.

export type AlarmKind =
  "message" | "overdue" | "agenda" | "assigned" | "broadcast" | "unacked";

export type Alarm = {
  key: string;
  kind: AlarmKind;
  /** When it rings (ms). */
  at: number;
  event: boolean;
  title: string;
  body: string;
  urgent: boolean;
  /** Item to open ("entry:…"). */
  ref: string;
};

export type AlertSettings = {
  /** Kinds this post wants (all by default). */
  kinds: Record<AlarmKind, boolean>;
  /** Minutes before a rendez-vous. */
  agendaLead: number;
};

const kind = (
  kind: AlarmKind,
  label: Parameters<typeof tr>[0],
): { kind: AlarmKind; label: string } => ({
  kind,
  get label() {
    return tr(label);
  },
});
export const ALARM_KINDS: { kind: AlarmKind; label: string }[] = [
  kind("message", "Message urgent reçu"),
  kind("overdue", "Échéance dépassée (journal, mes tâches)"),
  kind("agenda", "Rapport ou rendez-vous qui approche"),
  kind("assigned", "Nouvelle tâche pour ma fonction"),
  kind("broadcast", "Diffusion à quittancer"),
  kind("unacked", "Mes diffusions sans accusé de lecture"),
];

export const allKinds = (): Record<AlarmKind, boolean> => ({
  message: true,
  overdue: true,
  agenda: true,
  assigned: true,
  broadcast: true,
  unacked: true,
});

const first = (s: string) =>
  s
    .split("\n")
    .find((l) => l.trim())
    ?.trim() ?? "";
const clip = (s: string, n = 140) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;

/** Every alarm of the journal for this post. */
export function computeAlarms(
  journal: Pick<Journal, "entries" | "ops" | "history">,
  me: Identity,
  settings: AlertSettings,
  now = Date.now(),
): Alarm[] {
  const out: Alarm[] = [];
  const on = settings.kinds;
  if (on.message)
    for (const m of journal.ops.messages)
      if (m.priority === "Urgent" && m.status === "Nouveau")
        out.push({
          key: `message:${m.id}`,
          kind: "message",
          at: Date.parse(m.createdAt),
          event: true,
          title: tr("Message urgent"),
          body: clip(
            [
              m.from && tr("De {from}", { from: m.from }),
              m.subject || first(m.body),
            ]
              .filter(Boolean)
              .join(" : "),
          ),
          urgent: true,
          ref: `message:${m.id}`,
        });
  if (on.overdue)
    for (const e of journal.entries) {
      if (!needsFollowUp(e)) continue;
      const f = current(e);
      if (!f.dueAt) continue;
      out.push({
        key: `due:${e.id}:${f.dueAt}`,
        kind: "overdue",
        at: Date.parse(f.dueAt),
        event: false,
        title: tr("Échéance dépassée : {label}", { label: numberLabel(e) }),
        body: clip(
          [f.assignee, first(f.action) || first(f.message)]
            .filter(Boolean)
            .join(" · "),
        ),
        urgent: f.priority === "Urgent",
        ref: `entry:${e.id}`,
      });
    }
  const tasks = myTasks(journal, me, now);
  if (on.overdue)
    for (const t of tasks)
      if (t.kind !== "entry" && t.kind !== "broadcast" && t.due !== null)
        out.push({
          key: `due:${t.key}:${t.due}`,
          kind: "overdue",
          at: t.due,
          event: false,
          title: tr("Échéance dépassée"),
          body: clip(`${t.title} · ${t.detail}`),
          urgent: false,
          ref: t.ref,
        });
  if (on.agenda) {
    const lead = Math.max(0, settings.agendaLead) * 60_000;
    for (const a of journal.ops.agenda)
      if (!a.done)
        out.push({
          key: `agenda:${a.id}:${a.at}:${settings.agendaLead}`,
          kind: "agenda",
          at: Date.parse(a.at) - lead,
          event: false,
          title:
            settings.agendaLead > 0
              ? tr("Dans {n} min : {title}", {
                  n: settings.agendaLead,
                  title: a.title,
                })
              : tr("Maintenant : {title}", { title: a.title }),
          body: [a.kind, a.location].filter(Boolean).join(" · "),
          urgent: false,
          ref: `agenda:${a.id}`,
        });
  }
  if (on.assigned) {
    for (const e of journal.entries) {
      if (!needsFollowUp(e)) continue;
      const f = current(e);
      if (!assignedTo(f.assignee, me)) continue;
      const set = [...e.revisions]
        .reverse()
        .find(
          (r, i, all) =>
            i === all.length - 1 ||
            all[i + 1].fields.assignee !== r.fields.assignee,
        );
      out.push({
        key: `assigned:entry:${e.id}:${f.assignee}`,
        kind: "assigned",
        at: Date.parse(set?.at ?? e.createdAt),
        event: true,
        title: tr("Pour vous ({assignee}) : {label}", {
          assignee: f.assignee,
          label: numberLabel(e),
        }),
        body: clip(first(f.action) || first(f.message)),
        urgent: f.priority === "Urgent",
        ref: `entry:${e.id}`,
      });
    }
    for (const t of tasks)
      if (t.kind === "assignment" || t.kind === "mission")
        out.push({
          key: `assigned:${t.key}`,
          kind: "assigned",
          at: now,
          event: true,
          title: tr("Nouvelle tâche pour vous"),
          body: clip(`${t.title} · ${t.detail}`),
          urgent: false,
          ref: t.ref,
        });
  }
  if (on.broadcast)
    for (const { broadcast: b, recipients } of inbox(journal, me))
      out.push({
        key: `broadcast:${b.id}`,
        kind: "broadcast",
        at: Date.parse(b.sentAt),
        event: true,
        title: tr("{kind} : {title}", {
          kind: b.kind || tr("Diffusion"),
          title: b.title,
        }),
        body: clip(
          [
            tr("Pour {recipients}", { recipients: recipients.join(", ") }),
            b.sender && tr("de {sender}", { sender: b.sender }),
          ]
            .filter(Boolean)
            .join(" · ") +
            (b.ack !== "Aucun"
              ? tr(" · répondre « {ack} »", { ack: enumLabel(b.ack) })
              : ""),
        ),
        urgent: b.priority === "Urgent",
        ref: `broadcast:${b.id}`,
      });
  if (on.unacked)
    for (const b of lateBroadcasts(journal, now, me.name))
      out.push({
        key: `unacked:${b.id}`,
        kind: "unacked",
        at: Date.parse(b.sentAt) + b.deadline * 60_000,
        event: false,
        title: tr("Sans accusé de lecture : {title}", { title: b.title }),
        body: tr("Après {n} min, un destinataire n’a pas répondu.", {
          n: b.deadline,
        }),
        urgent: b.priority === "Urgent",
        ref: `broadcast:${b.id}`,
      });
  return out.filter((a) => Number.isFinite(a.at));
}

export type AlarmMemory = {
  /** Last check (ms): scheduled alarms up to it have rung. */
  since: number;
  /** Keys of the event alarms already known. */
  known: string[];
};

/** Event alarms older than this are never rung (a journal just opened). */
export const EVENT_WINDOW = 6 * 3_600_000;

/**
 * What rings now: scheduled alarms whose time passed since the last check,
 * event alarms not known yet (and not older than EVENT_WINDOW). The first
 * check of a post (no memory) only learns what exists.
 */
export function dueAlarms(
  alarms: Alarm[],
  memory: AlarmMemory | null,
  now = Date.now(),
): { ring: Alarm[]; memory: AlarmMemory } {
  const events = alarms.filter((a) => a.event).map((a) => a.key);
  if (!memory) return { ring: [], memory: { since: now, known: events } };
  const known = new Set(memory.known);
  const ring = alarms.filter((a) =>
    a.event
      ? !known.has(a.key) && a.at > now - EVENT_WINDOW && a.at <= now + 60_000
      : a.at > memory.since && a.at <= now,
  );
  // Event keys still present are kept; the others are forgotten (bounded).
  const present = new Set(events);
  const keep = [...memory.known.filter((k) => present.has(k)), ...events];
  return {
    ring: ring.sort((a, b) => a.at - b.at || a.key.localeCompare(b.key)),
    memory: { since: now, known: [...new Set(keep)].slice(-4000) },
  };
}

/** Next time a scheduled alarm rings (ms), null when none is ahead. */
export function nextAlarmAt(alarms: Alarm[], now = Date.now()): number | null {
  let next: number | null = null;
  for (const a of alarms)
    if (!a.event && a.at > now && (next === null || a.at < next)) next = a.at;
  return next;
}

/** "22:00" → minutes after midnight (NaN when invalid). */
const minutesOf = (hhmm: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  return m && Number(m[1]) < 24 && Number(m[2]) < 60
    ? Number(m[1]) * 60 + Number(m[2])
    : Number.NaN;
};

/** Whether `now` is in the quiet hours (Zurich time), which may span midnight. */
export function inQuietHours(now: number, from: string, to: string): boolean {
  const a = minutesOf(from);
  const b = minutesOf(to);
  if (Number.isNaN(a) || Number.isNaN(b) || a === b) return false;
  const w = zurichWall(now);
  const t = w.hour * 60 + w.minute;
  return a < b ? t >= a && t < b : t >= a || t < b;
}

/**
 * How an alarm reaches the post: during quiet hours only urgent alarms
 * notify, and none rings.
 */
export function delivery(
  alarm: Pick<Alarm, "urgent">,
  quiet: boolean,
  options: { notify: boolean; sound: boolean },
): { notify: boolean; sound: boolean } {
  return {
    notify: options.notify && (!quiet || alarm.urgent),
    sound: options.sound && !quiet,
  };
}
