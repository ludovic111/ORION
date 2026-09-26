import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  Circle,
  CircleCheck,
  FileText,
  Link2,
  MapPin,
  NotebookPen,
  Plus,
  Printer,
  Repeat,
  Users,
  X,
} from "lucide-react";
import { dateTime, time } from "../../../shared/journal";
import { upsert, type AgendaItem } from "../../../shared/ops";
import { parseRef, ref } from "../../../shared/links";
import { recurrence } from "../../../shared/time";
import { useApp } from "../../app/context";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import {
  ComboField,
  DateTimeField,
  NumberField,
  TextField,
} from "../../ui/fields";
import { Modal } from "../../journal/Modal";
import type { SheetTable } from "../../print/radio-sheet";
import {
  countdown,
  dayLabel,
  duration,
  endOf,
  nextRoundHour,
  upcoming,
  useTicker,
  zurichDay,
} from "./rhythm";
import { isReport } from "../../../shared/reminders";
import { SituationPointDialog } from "../situation/SituationPoint";
import { RemindersCard } from "./Reminders";
import "./agenda.css";

type Draft = Omit<AgendaItem, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<AgendaItem, "id" | "createdAt" | "updatedAt" | "by">>;

const blank = (): Draft => ({
  at: nextRoundHour(),
  minutes: 30,
  title: "",
  kind: "",
  location: "",
  participants: "",
  notes: "",
  done: false,
});

const SPEC: FieldSpec[] = [
  {
    key: "title",
    label: "Titre",
    kind: "combo",
    list: "agendaKinds",
    quick: 4,
    required: true,
    wide: true,
    placeholder: "ex. Rapport de conduite",
  },
  { key: "at", label: "Date et heure", kind: "datetime", required: true },
  { key: "minutes", label: "Durée (minutes)", kind: "number" },
  { key: "kind", label: "Type", kind: "combo", list: "agendaKinds" },
  {
    key: "location",
    label: "Lieu",
    kind: "text",
    placeholder: "ex. salle de conduite",
  },
  {
    key: "participants",
    label: "Participants",
    kind: "area",
    rows: 2,
    max: 1000,
  },
  { kind: "group", label: "Détails" },
  { key: "notes", label: "Ordre du jour / remarques", kind: "area", rows: 4 },
  { key: "done", label: "Tenu", kind: "toggle" },
];

const HOUR = 3600000;

export function Agenda() {
  const {
    journal,
    readOnly,
    focus,
    setFocus,
    updateOps,
    author,
    addEntry,
    toast,
    print,
    graph,
  } = useApp();
  const items = journal.ops.agenda;
  const at = useTicker(15000);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [planning, setPlanning] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [justDone, setJustDone] = useState<string[]>([]);
  // Report whose point de situation is being prepared.
  const [pointFor, setPointFor] = useState<string | null>(null);

  useEffect(() => {
    if (!focus) return;
    const { kind, id } = parseRef(focus);
    if (kind !== "agenda") return;
    if (id === "new") {
      if (!readOnly) setEditing(blank());
    } else {
      const item = items.find((i) => i.id === id);
      if (item) setEditing(item);
      else toast("Rendez-vous introuvable.");
    }
    setFocus(null);
  }, [focus, items, readOnly, setFocus, toast]);

  const sections = useMemo(() => {
    const today = zurichDay(at);
    const soon: AgendaItem[] = [];
    const later: AgendaItem[] = [];
    const next: AgendaItem[] = [];
    const past: AgendaItem[] = [];
    for (const i of items) {
      const start = Date.parse(i.at);
      if (i.done || (endOf(i) < at && start < at - 12 * HOUR)) past.push(i);
      else if (start <= at + 3 * HOUR) soon.push(i);
      else if (zurichDay(start) === today) later.push(i);
      else next.push(i);
    }
    const asc = (a: AgendaItem, b: AgendaItem) =>
      Date.parse(a.at) - Date.parse(b.at);
    return {
      soon: soon.sort(asc),
      later: later.sort(asc),
      next: next.sort(asc),
      past: past.sort((a, b) => -asc(a, b)),
    };
  }, [items, at]);
  const nextItem = upcoming(items, at)[0];

  function toggleDone(item: AgendaItem) {
    try {
      updateOps((ops) =>
        upsert(ops, "agenda", { ...item, done: !item.done }, author),
      );
      setJustDone((ids) =>
        item.done ? ids.filter((id) => id !== item.id) : [...ids, item.id],
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function log(item: AgendaItem) {
    try {
      const id = addEntry(
        {
          type: "Observation",
          message: `${item.title} tenu à ${time(item.at)}`,
          tags: ["rythme"],
        },
        [ref("agenda", item.id)],
      );
      if (id) toast("Consigné au journal.");
    } catch (err) {
      toast((err as Error).message);
    }
    setJustDone((ids) => ids.filter((x) => x !== item.id));
  }
  function printAgenda() {
    const sorted = [...items].sort(
      (a, b) => Date.parse(a.at) - Date.parse(b.at),
    );
    const days = new Map<string, AgendaItem[]>();
    for (const i of sorted) {
      const key = zurichDay(Date.parse(i.at));
      days.set(key, [...(days.get(key) ?? []), i]);
    }
    const tables: SheetTable[] = [...days.values()].map((list, index) => ({
      id: `day-${index}`,
      title: dayLabel(Date.parse(list[0].at)),
      caption: `${list.length} rendez-vous`,
      head: [
        "Heure",
        "Durée",
        "Rendez-vous",
        "Type",
        "Lieu",
        "Participants",
        "Tenu",
      ],
      widths: [16, 16, 46, 26, 28, 36, 14],
      body: list.map((i) => [
        time(i.at),
        duration(i.minutes),
        i.notes ? `${i.title}\n${i.notes}` : i.title,
        i.kind || "—",
        i.location || "—",
        i.participants || "—",
        i.done ? "Oui" : "",
      ]),
    }));
    print({
      kind: "tables",
      journal,
      title: "Rythme de conduite",
      extra: `${items.length} rendez-vous · état au ${dateTime(new Date().toISOString())}`,
      tables,
      landscape: false,
      name: "agenda",
    });
  }

  const renderItem = (item: AgendaItem) => {
    const start = Date.parse(item.at);
    const end = endOf(item);
    const state = item.done
      ? "done"
      : start <= at && end >= at
        ? "live"
        : end < at
          ? "late"
          : start - at <= 10 * 60000
            ? "soon"
            : "";
    const links = graph.degree.get(ref("agenda", item.id)) ?? 0;
    return (
      <li
        key={item.id}
        className={`agenda-item ${state} ${isReport(item) && !item.done ? "has-point" : ""}`}
      >
        <span className="agenda-dot" aria-hidden="true" />
        <div className="agenda-time">
          <strong>{time(item.at)}</strong>
          <small>{duration(item.minutes)}</small>
        </div>
        <button className="agenda-body" onClick={() => setEditing(item)}>
          <strong>{item.title}</strong>
          <span className="agenda-meta">
            {state === "live" && <span className="pill ok">En cours</span>}
            {state === "late" && (
              <span className="pill warn">Pas encore tenu</span>
            )}
            {state === "soon" && (
              <span className="pill accent">{countdown(start, at, false)}</span>
            )}
            {state === "done" && <span className="pill muted">Tenu</span>}
            {item.kind && item.kind !== item.title && <span>{item.kind}</span>}
            {item.location && (
              <span>
                <MapPin size={12} />
                {item.location}
              </span>
            )}
            {item.participants && (
              <span className="agenda-participants">
                <Users size={12} />
                {item.participants}
              </span>
            )}
            {links > 0 && (
              <span>
                <Link2 size={12} />
                {links}
              </span>
            )}
          </span>
        </button>
        {isReport(item) && !item.done && (
          <button
            className="icon-button agenda-point"
            title="Préparer le point de situation"
            aria-label={`Préparer le point de situation pour « ${item.title} »`}
            onClick={() => setPointFor(item.id)}
          >
            <FileText size={18} />
          </button>
        )}
        <button
          className="icon-button agenda-check"
          aria-pressed={item.done}
          disabled={readOnly}
          aria-label={
            item.done
              ? `Marquer « ${item.title} » comme non tenu`
              : `Marquer « ${item.title} » comme tenu`
          }
          title={item.done ? "Tenu" : "Marquer comme tenu"}
          onClick={() => toggleDone(item)}
        >
          {item.done ? <CircleCheck size={20} /> : <Circle size={20} />}
        </button>
        {justDone.includes(item.id) && item.done && !readOnly && (
          <div className="agenda-log reveal">
            <span>Consigner au journal ?</span>
            <button className="small primary" onClick={() => log(item)}>
              <NotebookPen size={13} />
              Consigner
            </button>
            <button
              className="icon-button"
              aria-label="Ne pas consigner"
              onClick={() =>
                setJustDone((ids) => ids.filter((x) => x !== item.id))
              }
            >
              <X size={14} />
            </button>
          </div>
        )}
      </li>
    );
  };

  const section = (title: string, list: AgendaItem[], byDay = false) => {
    if (!list.length) return null;
    let lastDay = "";
    return (
      <section className="agenda-section" key={title}>
        <h2 className="agenda-section-title">
          {title}
          <span className="pill plain">{list.length}</span>
        </h2>
        <ol className="agenda-timeline">
          {list.map((i) => {
            const key = zurichDay(Date.parse(i.at));
            const header = byDay && key !== lastDay;
            lastDay = key;
            return header ? (
              <FragmentWithDay key={i.id} label={dayLabel(Date.parse(i.at))}>
                {renderItem(i)}
              </FragmentWithDay>
            ) : (
              renderItem(i)
            );
          })}
        </ol>
      </section>
    );
  };

  return (
    <>
      <ModuleHead
        actions={
          <>
            <button onClick={printAgenda} disabled={!items.length}>
              <Printer size={14} />
              Imprimer
            </button>
            {!readOnly && (
              <>
                <button onClick={() => setPlanning(true)}>
                  <Repeat size={14} />
                  Planifier un rythme
                </button>
                <button className="primary" onClick={() => setEditing(blank())}>
                  <Plus size={15} />
                  Nouveau rendez-vous
                </button>
              </>
            )}
          </>
        }
      />
      {!items.length ? (
        <div className="card">
          <EmptyState
            icon={<CalendarClock size={28} />}
            title="Aucun rendez-vous"
            actions={
              !readOnly && (
                <>
                  <button className="primary" onClick={() => setPlanning(true)}>
                    <Repeat size={14} />
                    Planifier un rythme de rapports
                  </button>
                  <button onClick={() => setEditing(blank())}>
                    <CalendarPlus size={14} />
                    Ajouter un rendez-vous
                  </button>
                </>
              )
            }
          >
            Le rythme de conduite rassemble les rapports, orientations, relèves
            et points de situation, avec un compte à rebours. « Planifier un
            rythme » crée par exemple un rapport toutes les 2 heures en un clic.
          </EmptyState>
        </div>
      ) : (
        <div className="agenda-layout">
          {nextItem ? (
            <>
              <NextUp item={nextItem} onOpen={() => setEditing(nextItem)} />
              {isReport(nextItem) && (
                <div className="agenda-point-bar">
                  <button onClick={() => setPointFor(nextItem.id)}>
                    <FileText size={14} />
                    Préparer le point de situation
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card agenda-hero agenda-hero-empty">
              <CalendarClock size={22} />
              <p>
                Plus rien de prévu. Ajoutez le prochain rapport pour garder le
                rythme.
              </p>
              {!readOnly && (
                <button className="primary" onClick={() => setEditing(blank())}>
                  <Plus size={14} />
                  Prochain rendez-vous
                </button>
              )}
            </div>
          )}
          <div className="card agenda-card stagger">
            {section("Maintenant et à venir", sections.soon)}
            {section("Plus tard aujourd’hui", sections.later)}
            {section("Jours suivants", sections.next, true)}
            {!sections.soon.length &&
              !sections.later.length &&
              !sections.next.length && (
                <p className="muted agenda-nothing">Rien à venir.</p>
              )}
            {sections.past.length > 0 && (
              <section className="agenda-section">
                <button
                  className="agenda-past-toggle"
                  aria-expanded={showPast}
                  onClick={() => setShowPast(!showPast)}
                >
                  <ChevronDown size={15} />
                  Passés et tenus
                  <span className="pill plain">{sections.past.length}</span>
                </button>
                {showPast && (
                  <ol className="agenda-timeline past">
                    {sections.past.map(renderItem)}
                  </ol>
                )}
              </section>
            )}
          </div>
        </div>
      )}
      <RemindersCard />
      {editing && (
        <RecordSheet
          collection="agenda"
          kind="agenda"
          noun="un rendez-vous"
          spec={SPEC}
          initial={editing as Record<string, unknown>}
          onClose={() => setEditing(null)}
          titleOf={(v) => (v.id ? String(v.title || "Rendez-vous") : "")}
          validate={(v) =>
            !String(v.title ?? "").trim()
              ? "Indiquez un titre (un clic sur une valeur proposée suffit)."
              : !v.at
                ? "Indiquez la date et l’heure."
                : Number(v.minutes) > 24 * 60
                  ? "Durée maximale : 24 heures (1440 minutes)."
                  : ""
          }
          footer={
            editing.id && !editing.done ? (
              <>
                {isReport(editing) && (
                  <button
                    onClick={() => {
                      setPointFor(editing.id!);
                      setEditing(null);
                    }}
                  >
                    <FileText size={14} />
                    Point de situation
                  </button>
                )}
                {!readOnly && (
                  <button
                    onClick={() => {
                      const item = items.find((i) => i.id === editing.id);
                      if (item) toggleDone(item);
                      setEditing(null);
                    }}
                  >
                    <CircleCheck size={14} />
                    Tenu
                  </button>
                )}
              </>
            ) : undefined
          }
        />
      )}
      {planning && <PlanDialog onClose={() => setPlanning(false)} />}
      {pointFor && (
        <SituationPointDialog
          agendaId={pointFor}
          onClose={() => setPointFor(null)}
        />
      )}
    </>
  );
}
export default Agenda;

function FragmentWithDay({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <li className="agenda-day">{label}</li>
      {children}
    </>
  );
}

/** The next meeting with a large live countdown. */
function NextUp({ item, onOpen }: { item: AgendaItem; onOpen: () => void }) {
  const at = useTicker(1000);
  const start = Date.parse(item.at);
  const end = endOf(item);
  const live = start <= at;
  const remaining = live ? end - at : start - at;
  // The ring fills during the last hour before the meeting (or during it).
  const progress = live
    ? 1 - remaining / Math.max(60000, item.minutes * 60000)
    : 1 - Math.min(1, remaining / HOUR);
  const circumference = 2 * Math.PI * 52;
  return (
    <button
      className={`card spot agenda-hero ${live ? "live" : remaining < 10 * 60000 ? "soon" : ""}`}
      onClick={onOpen}
    >
      <svg className="agenda-ring" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="agenda-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="55%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--pink)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" className="agenda-ring-track" />
        <circle
          cx="60"
          cy="60"
          r="52"
          className="agenda-ring-value"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference * (1 - Math.max(0.02, Math.min(1, progress)))
          }
        />
        <text x="60" y="58" textAnchor="middle" className="agenda-ring-time">
          {time(item.at)}
        </text>
        <text x="60" y="76" textAnchor="middle" className="agenda-ring-sub">
          {duration(item.minutes)}
        </text>
      </svg>
      <div className="agenda-hero-text">
        <span className="label">
          {live ? "En cours" : "Prochain rendez-vous"}
        </span>
        <strong className="agenda-hero-title">{item.title}</strong>
        <span className="agenda-countdown" aria-live="off">
          {live ? `se termine ${countdown(end, at)}` : countdown(start, at)}
        </span>
        <span className="agenda-meta">
          {item.kind && item.kind !== item.title && <span>{item.kind}</span>}
          {item.location && (
            <span>
              <MapPin size={12} />
              {item.location}
            </span>
          )}
          {item.participants && (
            <span className="agenda-participants">
              <Users size={12} />
              {item.participants}
            </span>
          )}
        </span>
      </div>
    </button>
  );
}

const EVERY = [1, 2, 3, 4, 6, 8, 12];

/** Recurring meetings created in one go. */
function PlanDialog({ onClose }: { onClose: () => void }) {
  const { updateOps, author, toast, lists } = useApp();
  const [title, setTitle] = useState("Rapport de conduite");
  const [kind, setKind] = useState("Rapport de conduite");
  const [first, setFirst] = useState(nextRoundHour());
  const [every, setEvery] = useState<number | "custom">(2);
  const [custom, setCustom] = useState("5");
  const [count, setCount] = useState(6);
  const [minutes, setMinutes] = useState(30);
  const [location, setLocation] = useState("");
  const [participants, setParticipants] = useState("");
  const [error, setError] = useState("");
  const hours = every === "custom" ? Number(custom.replace(",", ".")) : every;
  const valid = Number.isFinite(hours) && hours >= 0.25 && hours <= 72;
  const times = useMemo(() => {
    const base = Date.parse(first);
    if (!valid || !Number.isFinite(base)) return [];
    // Wall-clock time in Zurich: an 08:00 meeting stays at 08:00 after a
    // change of hour.
    return recurrence(base, hours, count);
  }, [first, hours, count, valid]);
  function create() {
    if (!title.trim()) return setError("Indiquez un titre.");
    if (!times.length)
      return setError(
        "Vérifiez l’heure du premier rendez-vous et l’intervalle.",
      );
    try {
      updateOps((ops) =>
        times.reduce(
          (next, t) =>
            upsert(
              next,
              "agenda",
              {
                at: new Date(t).toISOString(),
                minutes: Math.min(24 * 60, minutes),
                title: title.trim(),
                kind: kind.trim(),
                location: location.trim(),
                participants: participants.trim(),
                notes: "",
                done: false,
              },
              author,
            ),
          ops,
        ),
      );
      toast(`${times.length} rendez-vous planifiés.`);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <Modal title="Planifier un rythme" onClose={onClose}>
      <div className="stack">
        <div className="form-grid">
          <ComboField
            className="span-2"
            label="Titre"
            required
            value={title}
            onChange={setTitle}
            options={lists("agendaKinds")}
            quick={4}
          />
          <DateTimeField
            label="Premier rendez-vous"
            required
            value={first}
            onChange={setFirst}
          />
          <NumberField
            label="Nombre de rendez-vous"
            value={count}
            min={1}
            max={48}
            onChange={setCount}
          />
          <div className="span-2 agenda-every">
            <span className="label">Toutes les</span>
            <div className="seg" role="group" aria-label="Intervalle">
              {EVERY.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={every === h}
                  onClick={() => setEvery(h)}
                >
                  {h} h
                </button>
              ))}
              <button
                type="button"
                aria-pressed={every === "custom"}
                onClick={() => setEvery("custom")}
              >
                Autre
              </button>
            </div>
            {every === "custom" && (
              <label className="agenda-custom">
                <span className="sr-only">Intervalle en heures</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0.25}
                  max={72}
                  step={0.25}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
                <span>heures</span>
              </label>
            )}
          </div>
          <NumberField
            label="Durée (minutes)"
            value={minutes}
            max={24 * 60}
            onChange={setMinutes}
          />
          <ComboField
            label="Type"
            value={kind}
            onChange={setKind}
            options={lists("agendaKinds")}
          />
          <TextField
            label="Lieu"
            value={location}
            onChange={setLocation}
            maxLength={300}
          />
          <TextField
            label="Participants"
            value={participants}
            onChange={setParticipants}
            maxLength={1000}
          />
        </div>
        {times.length > 0 && (
          <div className="agenda-preview" aria-label="Aperçu">
            {times.slice(0, 12).map((t) => (
              <span key={t} className="pill plain mono">
                {new Date(t).toLocaleString("fr-CH", {
                  timeZone: "Europe/Zurich",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ))}
            {times.length > 12 && (
              <span className="muted">+ {times.length - 12}</span>
            )}
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="agenda-dialog-actions">
          <button onClick={onClose}>Annuler</button>
          <button className="primary" disabled={!times.length} onClick={create}>
            <Repeat size={14} />
            Créer {times.length} rendez-vous
          </button>
        </div>
      </div>
    </Modal>
  );
}
