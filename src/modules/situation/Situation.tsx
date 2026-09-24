import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  CloudSun,
  Gauge,
  Inbox,
  LayoutList,
  Minus,
  Network,
  NotebookPen,
  Pencil,
  Plus,
  Radio,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import {
  chronological,
  current,
  dateTime,
  needsFollowUp,
  numberLabel,
  overdue,
  time,
} from "../../../shared/journal";
import {
  RESOURCE_STATUSES,
  STANDARD_BOARDS,
  STANDARD_FACTS,
  upsert,
  type Board,
  type Fact,
  type Ops,
} from "../../../shared/ops";
import { parseRef, ref, type Module, type Ref } from "../../../shared/links";
import { radioSummary } from "../../../shared/radio";
import { useApp } from "../../app/context";
import { ModuleHead } from "../../ui/ModuleHead";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import { CountUp } from "../../ui/effects";
import { LinkChip } from "../../ui/links";
import { countdown, upcoming, useTicker } from "../agenda/rhythm";
import {
  activeAlerts,
  alertPeriod,
  compass,
  observationText,
  readCachedForecast,
  round,
  weatherIcon,
  weatherLabel,
  weatherTone,
} from "../weather/forecast";
import "../weather/weather.css";
import "./situation.css";

type FactDraft = Omit<Fact, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<Fact, "id" | "createdAt" | "updatedAt" | "by">>;
type BoardDraft = Omit<Board, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<Board, "id" | "createdAt" | "updatedAt" | "by">>;

const FACT_SPEC: FieldSpec[] = [
  {
    key: "label",
    label: "Libellé",
    kind: "text",
    required: true,
    wide: true,
    max: 120,
  },
  {
    key: "value",
    label: "Valeur",
    kind: "text",
    max: 120,
    placeholder: "ex. 12",
  },
  {
    key: "unit",
    label: "Unité",
    kind: "combo",
    options: ["pers.", "bât.", "véh.", "km", "ha", "m³", "h"],
  },
  {
    key: "category",
    label: "Catégorie",
    kind: "combo",
    list: "factCategories",
    quick: 5,
    wide: true,
  },
  { key: "note", label: "Remarque", kind: "area", rows: 2, max: 500 },
  { kind: "group", label: "Affichage" },
  { key: "order", label: "Position (plus petit = en premier)", kind: "number" },
];
const BOARD_SPEC: FieldSpec[] = [
  {
    key: "title",
    label: "Titre",
    kind: "combo",
    options: STANDARD_BOARDS,
    required: true,
    wide: true,
  },
  { key: "body", label: "Contenu", kind: "area", rows: 10, max: 12000 },
  { key: "order", label: "Position", kind: "number" },
];

const CATEGORY_HUE: Record<string, number> = {
  Personnes: 330,
  Bâtiments: 30,
  Infrastructures: 190,
  Engagement: 250,
};
const hueOf = (category: string) =>
  CATEGORY_HUE[category] ??
  [...category].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 160);
const integer = (value: string) =>
  /^\s*-?\d+\s*$/.test(value) ? Number(value) : null;
const nextOrder = (list: { order: number }[]) =>
  list.length ? Math.max(...list.map((x) => x.order)) + 1 : 0;

function elapsed(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d) return `${d} j ${h} h`;
  if (h) return `${h} h ${String(m % 60).padStart(2, "0")}`;
  return `${m} min`;
}

export function Situation() {
  const { journal, now, readOnly, compose, open, focus, setFocus, toast } =
    useApp();
  const [fact, setFact] = useState<FactDraft | null>(null);
  const [board, setBoard] = useState<BoardDraft | null>(null);
  // Value of a fact before the last unrecorded changes, by id.
  const [changed, setChanged] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!focus) return;
    const { kind, id } = parseRef(focus);
    if (kind !== "fact" && kind !== "board") return;
    if (kind === "fact") {
      const found = journal.ops.facts.find((f) => f.id === id);
      if (found) setFact(found);
      else if (id === "new" && !readOnly) setFact(blankFact(journal.ops));
      else if (id !== "new") toast("Renseignement introuvable.");
    } else {
      const found = journal.ops.boards.find((b) => b.id === id);
      if (found) setBoard(found);
      else if (id === "new" && !readOnly) setBoard(blankBoard(journal.ops));
      else if (id !== "new") toast("Tableau introuvable.");
    }
    setFocus(null);
  }, [focus, journal.ops, readOnly, setFocus, toast]);

  const markChanged = (f: Fact, previous: string) =>
    setChanged((c) => (f.id in c ? c : { ...c, [f.id]: previous }));

  return (
    <>
      <ModuleHead
        title={journal.title}
        description={`Situation au ${dateTime(new Date(now).toISOString())}`}
        actions={
          !readOnly && (
            <>
              <button onClick={() => open("message:new" as Ref)}>
                <Inbox size={14} />
                Nouveau message
              </button>
              <button className="primary" onClick={() => compose()}>
                <Plus size={15} />
                Nouvelle entrée
              </button>
            </>
          )
        }
      />
      <div className="bento stagger situation">
        <Pulse />
        <Facts
          onEdit={setFact}
          changed={changed}
          onChanged={markChanged}
          onLogged={(id) =>
            setChanged((c) => {
              const next = { ...c };
              delete next[id];
              return next;
            })
          }
        />
        <OpenPoints />
        <Boards onEdit={setBoard} />
        <NextMeetings />
        <LatestMessages />
        <LatestEntries />
        <ResourcesCard />
        <TeamCard />
        <RadioCard />
        <WeatherCard />
        <NetworkCard />
      </div>
      {fact && (
        <RecordSheet
          collection="facts"
          kind="fact"
          noun="un renseignement"
          spec={FACT_SPEC}
          initial={fact as Record<string, unknown>}
          onClose={() => setFact(null)}
          extraOptions={{ unit: journal.ops.facts.map((f) => f.unit) }}
          validate={(v) =>
            !String(v.label ?? "").trim()
              ? "Indiquez un libellé."
              : String(v.unit ?? "").length > 40
                ? "Unité trop longue (40 caractères au plus)."
                : ""
          }
          afterSave={(v) => {
            const before = journal.ops.facts.find((f) => f.id === v.id);
            if (before && before.value !== v.value)
              markChanged(before, before.value);
          }}
        />
      )}
      {board && (
        <RecordSheet
          collection="boards"
          kind="board"
          noun="un tableau"
          spec={BOARD_SPEC}
          initial={board as Record<string, unknown>}
          onClose={() => setBoard(null)}
          validate={(v) =>
            !String(v.title ?? "").trim() ? "Indiquez un titre." : ""
          }
        />
      )}
    </>
  );
}
export default Situation;

const blankFact = (ops: Ops): FactDraft => ({
  label: "",
  value: "",
  unit: "",
  category: "",
  note: "",
  order: nextOrder(ops.facts),
});
const blankBoard = (ops: Ops): BoardDraft => ({
  title: "",
  body: "",
  order: nextOrder(ops.boards),
});

function GoButton({ to, label = "Ouvrir" }: { to: Module; label?: string }) {
  const { go } = useApp();
  return (
    <button className="small situation-go" onClick={() => go(to)}>
      {label}
      <ArrowRight size={13} />
    </button>
  );
}

function Empty({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="situation-empty">
      <p>{children}</p>
      {actions && <div className="situation-empty-actions">{actions}</div>}
    </div>
  );
}

/** Time since the journal was opened, with a heartbeat. */
function Pulse() {
  const { journal, now, go } = useApp();
  const end = journal.closedAt ? Date.parse(journal.closedAt) : now;
  const entries = journal.entries;
  // The engagement starts with the journal or its first recorded fact.
  const start = Math.min(
    Date.parse(journal.createdAt),
    ...entries.map((e) => Date.parse(current(e).happenedAt)),
  );
  const since = elapsed(end - start);
  const follow = entries.filter(needsFollowUp);
  const late = follow.filter((e) => overdue(e, now)).length;
  const inbox = journal.ops.messages.filter(
    (m) => m.status === "Nouveau" || m.status === "En traitement",
  ).length;
  const engaged = journal.ops.resources.filter(
    (r) => r.status === "Engagé" || r.status === "En route",
  ).length;
  const present = journal.ops.members.filter(
    (m) => m.status === "Présent",
  ).length;
  const last = entries.length
    ? Math.max(...entries.map((e) => Date.parse(current(e).happenedAt)))
    : null;
  const kpis: { label: string; value: number; to: Module; tone?: string }[] = [
    { label: "Entrées", value: entries.length, to: "journal" },
    {
      label: "À suivre",
      value: follow.length,
      to: "journal",
      tone: follow.length ? "warn" : "",
    },
    {
      label: "En retard",
      value: late,
      to: "journal",
      tone: late ? "crit" : "",
    },
    {
      label: "Messages à traiter",
      value: inbox,
      to: "messages",
      tone: inbox ? "accent" : "",
    },
    { label: "Moyens engagés", value: engaged, to: "resources" },
    { label: "Personnes présentes", value: present, to: "team" },
  ];
  return (
    <section
      className={`card w-12 situation-pulse ${journal.mode === "Intervention" ? "real" : ""} ${journal.closedAt ? "closed" : ""}`}
      aria-label="Engagement"
    >
      <svg
        className="situation-ecg"
        viewBox="0 0 600 80"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 40 H120 L135 40 L145 18 L155 62 L165 10 L178 70 L188 40 H320 L335 40 L345 22 L355 58 L365 14 L378 66 L388 40 H600" />
      </svg>
      <div className="situation-pulse-core" aria-hidden="true">
        <span />
        <span />
        <span />
        <i />
      </div>
      <div className="situation-pulse-text">
        <div className="situation-pulse-tags">
          <span
            className={`pill ${journal.mode === "Intervention" ? "crit" : "accent"}`}
          >
            {journal.mode}
          </span>
          <span className={`pill ${journal.closedAt ? "muted" : "ok"}`}>
            {journal.closedAt
              ? `Clôturé le ${dateTime(journal.closedAt)}`
              : "En cours"}
          </span>
          {journal.classification === "Confidentiel" && (
            <span className="pill warn">Confidentiel</span>
          )}
        </div>
        <span className="label">Engagement depuis</span>
        <strong className="situation-since">{since}</strong>
        <small>
          {[
            `Ouvert le ${dateTime(journal.createdAt)}`,
            journal.organization,
            journal.location,
            last !== null && `dernière entrée ${countdown(last, now, false)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </div>
      <div className="situation-kpis">
        {kpis.map((k) => (
          <button
            key={k.label}
            className={`situation-kpi ${k.tone ?? ""}`}
            onClick={() => go(k.to)}
          >
            <strong>
              <CountUp value={k.value} />
            </strong>
            <span>{k.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Facts({
  onEdit,
  changed,
  onChanged,
  onLogged,
}: {
  onEdit: (fact: FactDraft) => void;
  changed: Record<string, string>;
  onChanged: (fact: Fact, previous: string) => void;
  onLogged: (id: string) => void;
}) {
  const { journal, updateOps, author, readOnly, toast, addEntry } = useApp();
  const facts = useMemo(
    () =>
      [...journal.ops.facts].sort(
        (a, b) => a.order - b.order || a.label.localeCompare(b.label, "fr"),
      ),
    [journal.ops.facts],
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  function step(f: Fact, delta: number) {
    const value = integer(f.value) ?? 0;
    const next = value + delta;
    if (next < 0 && value >= 0) return;
    try {
      updateOps((ops) => {
        const latest = ops.facts.find((x) => x.id === f.id) ?? f;
        const base = integer(latest.value) ?? 0;
        return upsert(
          ops,
          "facts",
          { ...latest, value: String(base + delta) },
          author,
        );
      });
      onChanged(f, f.value);
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function log(f: Fact) {
    const before = changed[f.id] || "—";
    try {
      const id = addEntry(
        {
          type: "Renseignement",
          message: `Renseignements clés : ${f.label} ${before} → ${f.value || "—"}${f.unit ? ` ${f.unit}` : ""}`,
          tags: ["situation"],
        },
        [ref("fact", f.id)],
      );
      if (id) toast("Consigné au journal.");
      onLogged(f.id);
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function addStandard() {
    try {
      updateOps((ops) => {
        const known = new Set(
          ops.facts.map((f) => f.label.toLocaleLowerCase("fr")),
        );
        const start = nextOrder(ops.facts);
        return STANDARD_FACTS.filter(
          (s) => !known.has(s.label.toLocaleLowerCase("fr")),
        ).reduce(
          (next, s, i) =>
            upsert(
              next,
              "facts",
              { ...s, value: "", note: "", order: start + i },
              author,
            ),
          ops,
        );
      });
      toast("Renseignements standards ajoutés.");
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function move(id: string, target: string) {
    if (id === target) return;
    const ids = facts.map((f) => f.id);
    const from = ids.indexOf(id);
    const to = ids.indexOf(target);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    try {
      updateOps((ops) =>
        ids.reduce((next, fid, order) => {
          const f = next.facts.find((x) => x.id === fid);
          return f && f.order !== order
            ? upsert(next, "facts", { ...f, order }, author)
            : next;
        }, ops),
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }
  const missingStandard = STANDARD_FACTS.some(
    (s) =>
      !facts.some(
        (f) =>
          f.label.toLocaleLowerCase("fr") === s.label.toLocaleLowerCase("fr"),
      ),
  );

  return (
    <section
      className="card w-8 situation-facts"
      aria-label="Renseignements clés"
    >
      <div className="card-head">
        <Gauge size={15} />
        <h2>Renseignements clés</h2>
        {facts.length > 0 && <span className="pill plain">{facts.length}</span>}
        {!readOnly && facts.length > 0 && (
          <button
            className="small"
            onClick={() => onEdit(blankFact(journal.ops))}
          >
            <Plus size={13} />
            Ajouter
          </button>
        )}
      </div>
      {facts.length ? (
        <div className="situation-fact-grid">
          {facts.map((f) => {
            const n = integer(f.value);
            const stepable = n !== null || !f.value.trim();
            const previous = changed[f.id];
            const hue = hueOf(f.category || "Autre");
            return (
              <div
                key={f.id}
                className={`situation-fact ${dragging === f.id ? "dragging" : ""} ${over === f.id && dragging !== f.id ? "over" : ""}`}
                style={{ "--fh": hue } as CSSProperties}
                draggable={!readOnly}
                onDragStart={(e) => {
                  setDragging(f.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", f.label);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
                onDragOver={(e) => {
                  if (!dragging) return;
                  e.preventDefault();
                  setOver(f.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragging) move(dragging, f.id);
                  setDragging(null);
                  setOver(null);
                }}
              >
                <button
                  className="situation-fact-open"
                  onClick={() => onEdit(f)}
                >
                  <span className="situation-fact-cat">
                    {f.category || "Renseignement"}
                  </span>
                  <span className="situation-fact-value">
                    {n !== null ? <CountUp value={n} /> : f.value || "—"}
                    {f.unit && <small>{f.unit}</small>}
                  </span>
                  <span className="situation-fact-label">{f.label}</span>
                  {f.note && (
                    <small className="situation-fact-note">{f.note}</small>
                  )}
                </button>
                {stepable && !readOnly && (
                  <div className="situation-fact-steps">
                    <button
                      className="icon-button"
                      aria-label={`Diminuer « ${f.label} »`}
                      disabled={(n ?? 0) <= 0}
                      onClick={() => step(f, -1)}
                    >
                      <Minus size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Augmenter « ${f.label} »`}
                      onClick={() => step(f, 1)}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                )}
                {previous !== undefined &&
                  previous !== f.value &&
                  !readOnly && (
                    <div className="situation-fact-log">
                      <button
                        className="small"
                        onClick={() => log(f)}
                        title="Consigner ce changement au journal"
                      >
                        <NotebookPen size={12} />
                        Consigner {previous || "—"} → {f.value || "—"}
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Ne pas consigner"
                        onClick={() => onLogged(f.id)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          actions={
            !readOnly && (
              <>
                <button className="primary" onClick={addStandard}>
                  <Sparkles size={14} />
                  Ajouter les renseignements standards
                </button>
                <button onClick={() => onEdit(blankFact(journal.ops))}>
                  <Plus size={14} />
                  Un renseignement
                </button>
              </>
            )
          }
        >
          Les chiffres que tout le monde demande : blessés, évacués, bâtiments
          touchés, personnel engagé… Mis à jour d’un clic avec « + » et « − ».
        </Empty>
      )}
      {facts.length > 0 && missingStandard && !readOnly && (
        <button className="link situation-more" onClick={addStandard}>
          Compléter avec les renseignements standards
        </button>
      )}
    </section>
  );
}

function OpenPoints() {
  const { journal, now, openEntry } = useApp();
  const list = useMemo(() => {
    const follow = journal.entries.filter(needsFollowUp);
    const due = (e: (typeof follow)[number]) => {
      const d = current(e).dueAt;
      return d ? Date.parse(d) : Infinity;
    };
    return follow.sort(
      (a, b) =>
        Number(overdue(b, now)) - Number(overdue(a, now)) ||
        due(a) - due(b) ||
        Date.parse(current(b).happenedAt) - Date.parse(current(a).happenedAt),
    );
  }, [journal.entries, now]);
  const late = list.filter((e) => overdue(e, now)).length;
  return (
    <section className="card w-4 situation-list" aria-label="Points ouverts">
      <div className="card-head">
        <CircleAlert size={15} />
        <h2>Points ouverts</h2>
        {late > 0 && <span className="pill crit">{late} en retard</span>}
        <span className={`pill ${list.length ? "warn" : "ok"}`}>
          {list.length}
        </span>
      </div>
      {list.length ? (
        <div className="rows">
          {list.slice(0, 6).map((e) => {
            const f = current(e);
            const isLate = overdue(e, now);
            return (
              <button
                key={e.id}
                className={`row-item ${isLate ? "situation-late" : ""}`}
                onClick={() => openEntry(e.id)}
              >
                <span className="mono situation-num">{numberLabel(e)}</span>
                <span className="row-main">
                  <strong>{f.message.split("\n")[0]}</strong>
                  <small>
                    {[
                      f.status,
                      f.assignee,
                      f.dueAt && `échéance ${time(f.dueAt)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                {isLate && <span className="pill crit">En retard</span>}
              </button>
            );
          })}
          {list.length > 6 && (
            <GoButton to="journal" label={`Voir les ${list.length} points`} />
          )}
        </div>
      ) : (
        <Empty>
          <CheckCircle2 size={14} className="situation-ok-icon" /> Aucun point
          ouvert. Les entrées « À traiter » ou « En cours » apparaissent ici,
          les échéances dépassées en premier.
        </Empty>
      )}
    </section>
  );
}

function Boards({ onEdit }: { onEdit: (board: BoardDraft) => void }) {
  const { journal, updateOps, author, readOnly, toast } = useApp();
  const boards = useMemo(
    () => [...journal.ops.boards].sort((a, b) => a.order - b.order),
    [journal.ops.boards],
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const cancelled = useRef(false);

  function start(b: Board) {
    if (readOnly) return;
    cancelled.current = false;
    setText(b.body);
    setEditing(b.id);
  }
  function save(b: Board) {
    setEditing(null);
    if (cancelled.current) return;
    try {
      updateOps((ops) => {
        const latest = ops.boards.find((x) => x.id === b.id);
        return latest && latest.body !== text
          ? upsert(ops, "boards", { ...latest, body: text }, author)
          : ops;
      });
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function addStandard() {
    try {
      updateOps((ops) => {
        const known = new Set(
          ops.boards.map((b) => b.title.toLocaleLowerCase("fr")),
        );
        const start = nextOrder(ops.boards);
        return STANDARD_BOARDS.filter(
          (t) => !known.has(t.toLocaleLowerCase("fr")),
        ).reduce(
          (next, title, i) =>
            upsert(
              next,
              "boards",
              { title, body: "", order: start + i },
              author,
            ),
          ops,
        );
      });
      toast("Rubriques standards créées.");
    } catch (err) {
      toast((err as Error).message);
    }
  }
  return (
    <section
      className="card w-8 situation-boards"
      aria-label="Tableaux de situation"
    >
      <div className="card-head">
        <LayoutList size={15} />
        <h2>Tableaux de situation</h2>
        {!readOnly && boards.length > 0 && (
          <button
            className="small"
            onClick={() => onEdit(blankBoard(journal.ops))}
          >
            <Plus size={13} />
            Ajouter
          </button>
        )}
      </div>
      {boards.length ? (
        <div className="situation-board-grid">
          {boards.map((b) => (
            <article
              key={b.id}
              className={`situation-board ${editing === b.id ? "editing" : ""}`}
            >
              <header>
                <h3>{b.title}</h3>
                <button
                  className="icon-button"
                  aria-label={`Fiche « ${b.title} » (titre, liens, suppression)`}
                  title="Titre, liens, suppression"
                  onClick={() => onEdit(b)}
                >
                  <Pencil size={13} />
                </button>
              </header>
              {editing === b.id ? (
                <textarea
                  autoFocus
                  aria-label={`Contenu de « ${b.title} »`}
                  value={text}
                  maxLength={12000}
                  rows={Math.min(14, Math.max(4, text.split("\n").length + 1))}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={() => save(b)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
                      e.currentTarget.blur();
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      cancelled.current = true;
                      e.currentTarget.blur();
                    }
                  }}
                />
              ) : readOnly ? (
                <div className="situation-board-body">
                  {b.body || <span className="muted">Vide.</span>}
                </div>
              ) : (
                <button
                  className="situation-board-body"
                  onClick={() => start(b)}
                >
                  {b.body || (
                    <span className="muted">Cliquez pour écrire…</span>
                  )}
                </button>
              )}
              <footer>
                {editing === b.id
                  ? "⌘↵ ou clic ailleurs : enregistrer · Échap : annuler"
                  : `Mis à jour à ${time(b.updatedAt)}${b.by ? ` · ${b.by}` : ""}`}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          actions={
            !readOnly && (
              <>
                <button className="primary" onClick={addStandard}>
                  <Sparkles size={14} />
                  Créer les rubriques standards
                </button>
                <button onClick={() => onEdit(blankBoard(journal.ops))}>
                  <Plus size={14} />
                  Un tableau
                </button>
              </>
            )
          }
        >
          Des tableaux de texte libre pour la situation générale, les dangers,
          l’intention et les points à traiter au prochain rapport. Modifiables
          d’un clic, par tous les postes.
        </Empty>
      )}
    </section>
  );
}

function NextMeetings() {
  const { journal, open, readOnly } = useApp();
  const at = useTicker(1000);
  const list = upcoming(journal.ops.agenda, at).slice(0, 3);
  return (
    <section
      className="card w-4 situation-list"
      aria-label="Prochains rendez-vous"
    >
      <div className="card-head">
        <CalendarClock size={15} />
        <h2>Prochains rendez-vous</h2>
        <GoButton to="agenda" label="Agenda" />
      </div>
      {list.length ? (
        <div className="situation-meetings">
          {list.map((item, i) => {
            const start = Date.parse(item.at);
            const live = start <= at;
            const soon = !live && start - at <= 10 * 60000;
            return (
              <button
                key={item.id}
                className={`situation-meeting ${i === 0 ? "first" : ""} ${live ? "live" : soon ? "soon" : ""}`}
                onClick={() => open(ref("agenda", item.id))}
              >
                <span className="situation-meeting-time">{time(item.at)}</span>
                <span className="situation-meeting-main">
                  <strong>{item.title}</strong>
                  <small>
                    {[item.location, item.kind !== item.title && item.kind]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                <span className="situation-countdown">
                  {live ? "en cours" : countdown(start, at, i === 0)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <Empty
          actions={
            !readOnly && (
              <button onClick={() => open("agenda:new" as Ref)}>
                <Plus size={14} />
                Prévoir le prochain rapport
              </button>
            )
          }
        >
          Aucun rendez-vous à venir.
        </Empty>
      )}
    </section>
  );
}

function LatestMessages() {
  const { journal, open, readOnly } = useApp();
  const pending = journal.ops.messages
    .filter((m) => m.status === "Nouveau" || m.status === "En traitement")
    .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt));
  const fresh = pending.filter((m) => m.status === "Nouveau").length;
  return (
    <section
      className="card w-6 situation-list"
      aria-label="Messages à traiter"
    >
      <div className="card-head">
        <Inbox size={15} />
        <h2>Messages à traiter</h2>
        {fresh > 0 && (
          <span className="pill accent">
            {fresh} nouveau{fresh > 1 ? "x" : ""}
          </span>
        )}
        <GoButton to="messages" label="Messages" />
      </div>
      {pending.length ? (
        <div className="rows">
          {pending.slice(0, 5).map((m) => (
            <button
              key={m.id}
              className="row-item"
              onClick={() => open(ref("message", m.id))}
            >
              <span className="mono situation-num">{time(m.receivedAt)}</span>
              <span className="row-main">
                <strong>
                  {m.subject || m.body.split("\n")[0] || "Message"}
                </strong>
                <small>
                  {[m.from && `De ${m.from}`, m.to && `à ${m.to}`, m.via]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
              {m.priority !== "Normal" && (
                <span
                  className={`pill ${m.priority === "Urgent" ? "crit" : "warn"}`}
                >
                  {m.priority}
                </span>
              )}
              <span
                className={`pill ${m.status === "Nouveau" ? "accent" : "plain"}`}
              >
                {m.status}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          actions={
            !readOnly && (
              <button onClick={() => open("message:new" as Ref)}>
                <Plus size={14} />
                Saisir un message reçu
              </button>
            )
          }
        >
          Aucun message en attente de traitement.
        </Empty>
      )}
    </section>
  );
}

function LatestEntries() {
  const { journal, openEntry, compose, readOnly } = useApp();
  const latest = chronological(journal.entries).reverse().slice(0, 5);
  return (
    <section
      className="card w-6 situation-list"
      aria-label="Dernières entrées du journal"
    >
      <div className="card-head">
        <BookOpen size={15} />
        <h2>Dernières entrées</h2>
        <GoButton to="journal" label="Journal" />
      </div>
      {latest.length ? (
        <div className="rows">
          {latest.map((e) => {
            const f = current(e);
            return (
              <button
                key={e.id}
                className="row-item"
                onClick={() => openEntry(e.id)}
              >
                <span className="mono situation-num">{time(f.happenedAt)}</span>
                <span className="row-main">
                  <strong>
                    <span className="muted">{numberLabel(e)}</span>{" "}
                    {f.message.split("\n")[0]}
                  </strong>
                  <small>
                    {[f.type, f.source, f.recipient && `à ${f.recipient}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                {f.priority === "Urgent" && (
                  <span className="pill crit">Urgent</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <Empty
          actions={
            !readOnly && (
              <button className="primary" onClick={() => compose()}>
                <Plus size={14} />
                Première entrée
              </button>
            )
          }
        >
          Le journal est vide. Chaque événement, décision ou message y est
          consigné et numéroté.
        </Empty>
      )}
    </section>
  );
}

const STATUS_COLOR: Record<(typeof RESOURCE_STATUSES)[number], string> = {
  Disponible: "var(--ok)",
  Alerté: "var(--amber)",
  "En route": "var(--cyan)",
  Engagé: "var(--accent)",
  "De retour": "var(--rigel)",
  "Hors service": "var(--crit)",
};

/** Draws from zero once mounted so the chart animates in. */
function useMounted() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return ready;
}

function ResourcesCard() {
  const { journal, go } = useApp();
  const ready = useMounted();
  const resources = journal.ops.resources;
  const counts = RESOURCE_STATUSES.map((s) => ({
    status: s,
    count: resources.filter((r) => r.status === s).length,
  }));
  const personnel = resources
    .filter((r) => r.kind.toLocaleLowerCase("fr").includes("personnel"))
    .reduce((sum, r) => sum + r.count, 0);
  const total = resources.length;
  const C = 2 * Math.PI * 42;
  let offset = 0;
  return (
    <section className="card w-4 situation-resources" aria-label="Moyens">
      <div className="card-head">
        <Truck size={15} />
        <h2>Moyens</h2>
        <GoButton to="resources" label="Moyens" />
      </div>
      {total ? (
        <button
          className="situation-donut-wrap"
          onClick={() => go("resources")}
        >
          <svg
            viewBox="0 0 110 110"
            className="situation-donut"
            aria-hidden="true"
          >
            <circle cx="55" cy="55" r="42" className="track" />
            {counts.map(({ status, count }) => {
              const len = ready ? (count / total) * C : 0;
              const el = (
                <circle
                  key={status}
                  cx="55"
                  cy="55"
                  r="42"
                  stroke={STATUS_COLOR[status]}
                  strokeDasharray={`${Math.max(0, len - (count ? 1.5 : 0))} ${C}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += (count / total) * C;
              return el;
            })}
            <text x="55" y="54" textAnchor="middle" className="big">
              {total}
            </text>
            <text x="55" y="69" textAnchor="middle" className="small">
              moyen{total > 1 ? "s" : ""}
            </text>
          </svg>
          <ul className="situation-legend">
            {counts
              .filter((c) => c.count)
              .map((c) => (
                <li
                  key={c.status}
                  style={{ "--c": STATUS_COLOR[c.status] } as CSSProperties}
                >
                  <i />
                  <span>{c.status}</span>
                  <strong>{c.count}</strong>
                </li>
              ))}
            {personnel > 0 && (
              <li className="situation-personnel">
                <Users size={13} />
                <span>Personnel</span>
                <strong>{personnel}</strong>
              </li>
            )}
          </ul>
          <span className="sr-only">
            {counts.map((c) => `${c.status} : ${c.count}`).join(", ")}.
            Personnel : {personnel}.
          </span>
        </button>
      ) : (
        <Empty
          actions={
            <button onClick={() => go("resources")}>Saisir les moyens</button>
          }
        >
          Véhicules, personnel et matériel, avec leur état (disponible,
          engagé…).
        </Empty>
      )}
    </section>
  );
}

function TeamCard() {
  const { journal, go } = useApp();
  const members = journal.ops.members;
  const by = (s: string) => members.filter((m) => m.status === s).length;
  const cells = journal.ops.cells
    .map((c) => {
      const inCell = members.filter((m) => m.cellId === c.id);
      return {
        cell: c,
        present: inCell.filter((m) => m.status === "Présent").length,
        total: inCell.length,
      };
    })
    .filter((c) => c.total)
    .sort((a, b) => b.present - a.present || b.total - a.total)
    .slice(0, 3);
  const stats = [
    { label: "Présents", value: by("Présent"), tone: "ok" },
    { label: "En pause", value: by("En pause"), tone: "warn" },
    { label: "Absents", value: by("Absent") + by("Relevé"), tone: "muted" },
  ];
  return (
    <section className="card w-4 situation-team" aria-label="Équipe">
      <div className="card-head">
        <Users size={15} />
        <h2>Équipe</h2>
        <GoButton to="team" label="Équipe" />
      </div>
      {members.length ? (
        <>
          <button className="situation-stats" onClick={() => go("team")}>
            {stats.map((s) => (
              <span key={s.label} className={`situation-stat ${s.tone}`}>
                <strong>
                  <CountUp value={s.value} />
                </strong>
                <small>{s.label}</small>
              </span>
            ))}
          </button>
          {cells.length > 0 && (
            <div className="situation-cells">
              {cells.map((c) => (
                <LinkChip
                  key={c.cell.id}
                  target={ref("cell", c.cell.id)}
                  label={`${c.present}/${c.total} présents`}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <Empty
          actions={
            <button onClick={() => go("team")}>Composer l’équipe</button>
          }
        >
          Qui est là, à quelle fonction, dans quel poste ou cellule.
        </Empty>
      )}
    </section>
  );
}

function RadioCard() {
  const { journal, go } = useApp();
  const ready = useMounted();
  const r = radioSummary(journal.radio);
  const parts = [
    { label: "En service", value: r.issued, color: "var(--accent)" },
    { label: "Disponibles", value: r.available, color: "var(--ok)" },
    { label: "Indisponibles", value: r.unavailable, color: "var(--crit)" },
  ];
  return (
    <section className="card w-4 situation-radio" aria-label="Radio">
      <div className="card-head">
        <Radio size={15} />
        <h2>Radio</h2>
        <GoButton to="radio" label="Radio" />
      </div>
      {r.terminals ? (
        <button className="situation-radio-body" onClick={() => go("radio")}>
          <div className="situation-stats">
            {parts.map((p) => (
              <span
                key={p.label}
                className="situation-stat"
                style={{ "--c": p.color } as CSSProperties}
              >
                <strong>
                  <CountUp value={p.value} />
                </strong>
                <small>{p.label}</small>
              </span>
            ))}
          </div>
          <div className="situation-bar" aria-hidden="true">
            {parts.map((p) => (
              <span
                key={p.label}
                style={{
                  width: ready ? `${(p.value / r.terminals) * 100}%` : 0,
                  background: p.color,
                }}
              />
            ))}
          </div>
          <small className="muted">
            {r.terminals} terminaux · {r.stations} noms d’appel · {r.talkgroups}{" "}
            groupes
          </small>
        </button>
      ) : (
        <Empty
          actions={
            <button onClick={() => go("radio")}>
              Préparer le réseau radio
            </button>
          }
        >
          Terminaux Polycom, noms d’appel, remises et contrôles de liaison.
        </Empty>
      )}
    </section>
  );
}

function WeatherCard() {
  const { journal, now, go, open } = useApp();
  // Re-read the local cache with the 30-second clock.
  const cached = useMemo(
    () => readCachedForecast(journal.id),
    [journal.id, now],
  );
  const alerts = activeAlerts(journal.ops.alerts, now);
  const lastObs = [...journal.ops.observations].sort(
    (a, b) => Date.parse(b.at) - Date.parse(a.at),
  )[0];
  const c = cached?.forecast.current;
  const Icon = weatherIcon(c?.code ?? null);
  const today = cached?.forecast.days[0];
  return (
    <section className="card w-6 situation-weather" aria-label="Météo">
      <div className="card-head">
        <CloudSun size={15} />
        <h2>Météo</h2>
        {alerts.length > 0 && (
          <span className="pill crit">
            {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
          </span>
        )}
        <GoButton to="weather" label="Météo" />
      </div>
      {!cached && !alerts.length && !lastObs ? (
        <Empty
          actions={
            <button onClick={() => go("weather")}>Choisir le lieu</button>
          }
        >
          Prévision MétéoSuisse pour le lieu d’engagement, observations sur
          place et alertes de danger.
        </Empty>
      ) : (
        <div className="situation-weather-body">
          {c && cached && (
            <button
              className="situation-weather-now"
              onClick={() => go("weather")}
            >
              <span
                className="situation-weather-icon"
                style={{ color: weatherTone(c.code) }}
              >
                <Icon size={40} strokeWidth={1.5} />
              </span>
              <span className="situation-weather-temp">
                {round(c.temperature)}
                <small>°C</small>
              </span>
              <span className="situation-weather-text">
                <strong>{weatherLabel(c.code)}</strong>
                <small>
                  {[
                    c.wind !== null &&
                      `vent ${round(c.wind)} km/h${c.direction !== null ? ` du ${compass(c.direction)}` : ""}`,
                    c.gusts !== null && `rafales ${round(c.gusts)}`,
                    today && `${round(today.min)}° / ${round(today.max)}°`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                <small className="muted">
                  {cached.place.name} · données du{" "}
                  {dateTime(new Date(cached.fetchedAt).toISOString())}
                </small>
              </span>
            </button>
          )}
          {alerts.length > 0 && (
            <div className="situation-alerts">
              {alerts.slice(0, 3).map((a) => (
                <button
                  key={a.id}
                  className={`weather-alert active lvl-${a.level}`}
                  onClick={() => open(ref("alert", a.id))}
                >
                  <span className={`weather-level lvl-${a.level}`}>
                    <span className="sr-only">Degré </span>
                    {a.level}
                  </span>
                  <span className="weather-alert-main">
                    <strong>{a.hazard}</strong>
                    <small>
                      {[a.region, alertPeriod(a)].filter(Boolean).join(" · ")}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
          {lastObs && (
            <button
              className="situation-obs"
              onClick={() => open(ref("observation", lastObs.id))}
            >
              <span className="label">Observation {time(lastObs.at)}</span>
              <span>
                {observationText(lastObs) || lastObs.notes || "Observation"}
                {lastObs.place && (
                  <span className="muted"> · {lastObs.place}</span>
                )}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function NetworkCard() {
  const { graph, go } = useApp();
  const top = useMemo(
    () =>
      [...graph.degree.entries()]
        .filter(([r]) => graph.byRef.has(r))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
    [graph],
  );
  // A small constellation: one node per kind of item present.
  const kinds = useMemo(
    () => [...new Set(graph.items.map((i) => i.kind))].slice(0, 12),
    [graph.items],
  );
  const nodes = kinds.map((k, i) => {
    const a = (i / Math.max(1, kinds.length)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 30 : 40;
    return { k, x: 60 + Math.cos(a) * r, y: 50 + Math.sin(a) * r * 0.8 };
  });
  return (
    <section
      className="card w-6 situation-network"
      aria-label="Réseau des liens"
    >
      <div className="card-head">
        <Network size={15} />
        <h2>Réseau des liens</h2>
        <GoButton to="network" label="Réseau" />
      </div>
      <div className="situation-network-body">
        <button
          className="situation-constellation"
          onClick={() => go("network")}
          aria-label="Ouvrir le réseau des liens"
        >
          <svg viewBox="0 0 120 100" aria-hidden="true">
            {nodes.map((n, i) =>
              nodes
                .slice(i + 1, i + 4)
                .map((m) => (
                  <line
                    key={`${n.k}-${m.k}`}
                    x1={n.x}
                    y1={n.y}
                    x2={m.x}
                    y2={m.y}
                  />
                )),
            )}
            {nodes.map((n, i) => (
              <line
                key={`c-${n.k}`}
                x1={60}
                y1={50}
                x2={n.x}
                y2={n.y}
                className="spoke"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
            <circle cx={60} cy={50} r={5} className="hub" />
            {nodes.map((n, i) => (
              <circle
                key={n.k}
                cx={n.x}
                cy={n.y}
                r={3.2}
                style={{ animationDelay: `${i * 180}ms` }}
              />
            ))}
          </svg>
        </button>
        <div className="situation-network-text">
          <div className="situation-stats">
            <span className="situation-stat">
              <strong>
                <CountUp value={graph.items.length} />
              </strong>
              <small>éléments</small>
            </span>
            <span className="situation-stat">
              <strong>
                <CountUp value={graph.edges.length} />
              </strong>
              <small>liens</small>
            </span>
          </div>
          {top.length > 0 ? (
            <div className="situation-top">
              <span className="label">Les plus reliés</span>
              {top.map(([r, n]) => (
                <LinkChip
                  key={r}
                  target={r as Ref}
                  label={`${n} lien${n > 1 ? "s" : ""}`}
                />
              ))}
            </div>
          ) : (
            <p className="muted">
              Les éléments se relient automatiquement (noms d’appel, références
              #012…) ou avec « Lier » dans chaque fiche.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
