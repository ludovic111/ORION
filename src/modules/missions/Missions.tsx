import { useMemo, useRef, useState, type DragEvent } from "react";
import {
  AlarmClockPlus,
  ArrowRightLeft,
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock,
  ExternalLink,
  KanbanSquare,
  Link2,
  NotebookPen,
  PlayCircle,
  Plus,
  Reply,
  Search,
  Send,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  current,
  needsFollowUp,
  numberLabel,
  overdue,
  reviseEntry,
  searchEntries,
  time,
  type Entry,
  type Fields,
} from "../../../shared/journal";
import { ref } from "../../../shared/links";
import { snooze } from "../../../shared/workflow";
import { useApp } from "../../app/context";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { Popover } from "../../ui/Popover";
import { Segmented, Toggle } from "../../ui/fields";
import { HoverCard } from "../../ui/links";
import { Figures } from "../../ui/Figures";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { compareText } from "../../../shared/i18n/core.ts";
import { useLang } from "../../i18n";
import { t } from "./i18n.ts";
import "./missions.css";

type Status = Fields["status"];
type TypeFilter = "all" | "Mission" | "Demande" | "Décision" | "other";

// Hints are getters: read in the language of the post when shown.
const LANES: {
  status: Status;
  tone: string;
  icon: LucideIcon;
  hint: string;
}[] = [
  {
    status: "Consigné",
    tone: "muted",
    icon: NotebookPen,
    get hint() {
      return t("Inscrit, sans suivi");
    },
  },
  {
    status: "À traiter",
    tone: "warn",
    icon: CircleDashed,
    get hint() {
      return t("Pas encore commencé");
    },
  },
  {
    status: "En cours",
    tone: "accent",
    icon: PlayCircle,
    get hint() {
      return t("Quelqu’un s’en occupe");
    },
  },
  {
    status: "Terminé",
    tone: "ok",
    icon: CheckCircle2,
    get hint() {
      return t("Fait et quittancé");
    },
  },
  {
    status: "Annulé",
    tone: "muted",
    icon: Ban,
    get hint() {
      return t("Abandonné ou sans objet");
    },
  },
];
const typeOptions = (): { value: TypeFilter; label: string }[] => [
  { value: "all", label: t("Tout") },
  { value: "Mission", label: t("Missions") },
  { value: "Demande", label: t("Demandes") },
  { value: "Décision", label: t("Décisions") },
  { value: "other", label: t("Autres") },
];
const PAGE = 40;
const NO_ASSIGNEE = "__none__";

function span(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return t("{n} min", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `${hours} h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, "0")}` : ""}`;
  const days = Math.round(hours / 24);
  return t("{n} j", { n: days });
}

function dueInfo(entry: Entry, now: number) {
  const f = current(entry);
  if (!f.dueAt) return null;
  const diff = Date.parse(f.dueAt) - now;
  const late = overdue(entry, now);
  const open = needsFollowUp(entry);
  return {
    late,
    soon: open && !late && diff < 15 * 60_000,
    text: !open
      ? t("échéance {time}", { time: time(f.dueAt) })
      : late
        ? t("dépassée de {span}", { span: span(-diff) })
        : t("dans {span} · {time}", { span: span(diff), time: time(f.dueAt) }),
  };
}

const PRIORITY_RANK = { Urgent: 0, Important: 1, Normal: 2 } as const;

function sortLane(list: Entry[], status: Status, now: number) {
  if (status === "Terminé" || status === "Annulé")
    return [...list].sort(
      (a, b) =>
        Date.parse(b.revisions[b.revisions.length - 1].at) -
        Date.parse(a.revisions[a.revisions.length - 1].at),
    );
  return [...list].sort((a, b) => {
    const fa = current(a);
    const fb = current(b);
    return (
      Number(overdue(b, now)) - Number(overdue(a, now)) ||
      (fa.dueAt ? Date.parse(fa.dueAt) : Infinity) -
        (fb.dueAt ? Date.parse(fb.dueAt) : Infinity) ||
      PRIORITY_RANK[fa.priority] - PRIORITY_RANK[fb.priority] ||
      a.number - b.number
    );
  });
}

export function Missions() {
  const {
    journal,
    live,
    author,
    now,
    readOnly,
    graph,
    updateJournal,
    compose,
    openEntry,
    toast,
  } = useApp();
  const [type, setType] = useState<TypeFilter>("all");
  const [assignee, setAssignee] = useState("");
  const [query, setQuery] = useState("");
  const [lateOnly, setLateOnly] = useState(false);
  const [withLogged, setWithLogged] = useState(false);
  const [bySwimlane, setBySwimlane] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [moved, setMoved] = useState<{ id: string; done: boolean } | null>(
    null,
  );
  const movedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lang = useLang();

  const lanes = LANES.filter((l) => withLogged || l.status !== "Consigné");
  const pool = useMemo(
    () =>
      journal.entries.filter(
        (e) => withLogged || current(e).status !== "Consigné",
      ),
    [journal.entries, withLogged],
  );
  const assignees = useMemo(
    () =>
      [
        ...new Set(pool.map((e) => current(e).assignee.trim()).filter(Boolean)),
      ].sort(compareText),
    [pool, lang],
  );
  const shown = useMemo(() => {
    let list = pool.filter((e) => {
      const f = current(e);
      if (type === "other")
        return !["Mission", "Demande", "Décision"].includes(f.type);
      return type === "all" || f.type === type;
    });
    if (assignee === NO_ASSIGNEE)
      list = list.filter((e) => !current(e).assignee.trim());
    else if (assignee)
      list = list.filter((e) => current(e).assignee.trim() === assignee);
    if (lateOnly) list = list.filter((e) => overdue(e, now));
    if (query.trim()) list = searchEntries(list, query);
    return list;
  }, [pool, type, assignee, lateOnly, query, now]);

  // Overall picture, independent of the filters.
  const summary = useMemo(() => {
    const count = new Map<Status, number>();
    for (const e of journal.entries) {
      const s = current(e).status;
      count.set(s, (count.get(s) ?? 0) + 1);
    }
    const late = journal.entries.filter((e) => overdue(e, now)).length;
    const next = journal.entries
      .filter(
        (e) =>
          needsFollowUp(e) &&
          current(e).dueAt &&
          Date.parse(current(e).dueAt) >= now,
      )
      .sort(
        (a, b) => Date.parse(current(a).dueAt) - Date.parse(current(b).dueAt),
      )[0];
    return { count, late, next };
  }, [journal.entries, now]);

  const groups = useMemo(() => {
    if (!bySwimlane) return [{ key: "all", label: "", list: shown }];
    const map = new Map<string, Entry[]>();
    for (const e of shown) {
      const key = current(e).assignee.trim() || NO_ASSIGNEE;
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()]
      .sort(([a], [b]) =>
        a === NO_ASSIGNEE ? 1 : b === NO_ASSIGNEE ? -1 : compareText(a, b),
      )
      .map(([key, list]) => ({
        key,
        label: key === NO_ASSIGNEE ? t("Sans responsable") : key,
        list,
      }));
  }, [bySwimlane, shown, lang]);

  function move(id: string, status: Status) {
    // Written to the live journal; the gate refuses (with a message) in the
    // time machine or on a closed journal.
    const entry = live.entries.find((e) => e.id === id);
    if (!entry) return;
    const f = current(entry);
    if (f.status === status) return;
    try {
      if (
        !updateJournal(
          reviseEntry(
            live,
            id,
            { ...f, status },
            author,
            t("Suivi : {status}", { status: enumLabel(status) }),
          ),
        )
      )
        return;
      clearTimeout(movedTimer.current);
      setMoved({ id, done: status === "Terminé" });
      movedTimer.current = setTimeout(() => setMoved(null), 1600);
      toast(
        t("{entry} : {status}.", {
          entry: numberLabel(entry),
          status: enumLabel(status),
        }),
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error));
    }
  }

  function postpone(shown: Entry) {
    const entry = live.entries.find((e) => e.id === shown.id) ?? shown;
    const f = current(entry);
    try {
      if (
        !updateJournal(
          reviseEntry(
            live,
            entry.id,
            { ...f, dueAt: snooze(f.dueAt, 15) },
            author,
            t("Échéance reportée de {n} min", { n: 15 }),
          ),
        )
      )
        return;
      toast(
        t("{entry} : échéance reportée de {n} min.", {
          entry: numberLabel(entry),
          n: 15,
        }),
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : String(error));
    }
  }

  const follow = (entry: Entry) =>
    compose({
      type: "Quittance",
      reference: t("Suite de {entry}", { entry: numberLabel(entry) }),
      recipient: current(entry).source,
    });

  const drop = (status: Status) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setDragId(null);
    setOver(null);
    if (id) move(id, status);
  };

  const actions = !readOnly && (
    <>
      <button
        onClick={() =>
          compose({
            type: "Demande",
            status: "À traiter",
            priority: "Important",
          })
        }
      >
        <Send size={15} />
        {t("Nouvelle demande")}
      </button>
      <button
        className="primary"
        onClick={() => compose({ type: "Mission", status: "À traiter" })}
      >
        <Plus size={15} />
        {t("Nouvelle mission")}
      </button>
    </>
  );

  const anything = journal.entries.some(
    (e) => current(e).status !== "Consigné",
  );

  return (
    <>
      <ModuleHead actions={actions} />

      <Figures
        className="missions-summary"
        label={t("Suivi en chiffres")}
        items={[
          ...LANES.filter((l) => l.status !== "Consigné").map((l) => {
            const n = summary.count.get(l.status) ?? 0;
            return {
              label: enumLabel(l.status),
              value: n,
              tone: (l.status === "À traiter" && n ? "warn" : "") as
                "warn" | "",
            };
          }),
          {
            label: t("En retard"),
            value: summary.late,
            tone: summary.late ? "crit" : "",
            onClick: summary.late ? () => setLateOnly(true) : undefined,
          },
          summary.next
            ? {
                id: "next",
                label: t("Prochaine échéance {when}", {
                  when: dueInfo(summary.next, now)?.text ?? "",
                }),
                value: numberLabel(summary.next),
                onClick: () => summary.next && openEntry(summary.next.id),
              }
            : { id: "next", label: t("Aucune échéance à venir"), value: "—" },
        ]}
      />

      {!anything && !withLogged ? (
        <EmptyState
          icon={<KanbanSquare size={28} />}
          title={t("Aucun point à suivre")}
          actions={
            <>
              {actions}
              <button onClick={() => setWithLogged(true)}>
                <NotebookPen size={15} />
                {t("Voir les entrées sans suivi")}
              </button>
            </>
          }
        >
          {t(
            "Chaque entrée du journal dont l’état est « À traiter », « En cours », « Terminé » ou « Annulé » apparaît ici comme une carte. Glissez une carte d’une colonne à l’autre pour changer son état : le journal garde la trace de chaque changement.",
          )}
        </EmptyState>
      ) : (
        <>
          <div className="missions-filters">
            <Segmented
              label={t("Type")}
              value={type}
              onChange={setType}
              options={typeOptions()}
            />
            <label className="missions-select">
              <User size={14} />
              <span className="sr-only">{t("Responsable")}</span>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">{t("Tous les responsables")}</option>
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
                <option value={NO_ASSIGNEE}>{t("Sans responsable")}</option>
              </select>
            </label>
            <div className="search missions-search">
              <Search size={14} />
              <input
                value={query}
                placeholder={t("Chercher…")}
                aria-label={t("Chercher une mission")}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Toggle
              label={t("Seulement en retard")}
              checked={lateOnly}
              onChange={setLateOnly}
            />
            <Toggle
              label={t("Par responsable")}
              checked={bySwimlane}
              onChange={setBySwimlane}
            />
            <Toggle
              label={t("Inclure les entrées sans suivi")}
              checked={withLogged}
              onChange={setWithLogged}
            />
          </div>

          {groups.map((group) => (
            <section key={group.key} className="missions-group">
              {group.label && (
                <h2 className="missions-swimlane">
                  <User size={15} />
                  {group.label}
                  <span className="pill plain">{group.list.length}</span>
                </h2>
              )}
              <div className="kanban missions-board">
                {lanes.map((lane) => {
                  const laneKey = `${group.key}|${lane.status}`;
                  const list = sortLane(
                    group.list.filter((e) => current(e).status === lane.status),
                    lane.status,
                    now,
                  );
                  const limit = expanded.has(laneKey) ? Infinity : PAGE;
                  const Icon = lane.icon;
                  return (
                    <div
                      key={lane.status}
                      className={`lane missions-lane missions-tone-${lane.tone}${over === laneKey ? " drop" : ""}`}
                      role="group"
                      aria-label={enumLabel(lane.status)}
                      onDragOver={(e) => {
                        if (!dragId) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (over !== laneKey) setOver(laneKey);
                      }}
                      onDragLeave={(e) => {
                        if (
                          !e.currentTarget.contains(
                            e.relatedTarget as Node | null,
                          )
                        )
                          setOver((o) => (o === laneKey ? null : o));
                      }}
                      onDrop={drop(lane.status)}
                    >
                      <div className="lane-head">
                        <Icon size={15} />
                        <strong>{enumLabel(lane.status)}</strong>
                        <span className="count">{list.length}</span>
                      </div>
                      {list.slice(0, limit).map((entry) => (
                        <MissionCard
                          key={entry.id}
                          entry={entry}
                          now={now}
                          links={graph.degree.get(ref("entry", entry.id)) ?? 0}
                          readOnly={readOnly}
                          dragging={dragId === entry.id}
                          flash={
                            moved?.id === entry.id
                              ? moved.done
                                ? "done"
                                : "moved"
                              : null
                          }
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", entry.id);
                            e.dataTransfer.effectAllowed = "move";
                            // Deferred: changing the DOM during dragstart can cancel the drag.
                            setTimeout(() => setDragId(entry.id));
                          }}
                          onDragEnd={() => {
                            setDragId(null);
                            setOver(null);
                          }}
                          onOpen={() => openEntry(entry.id)}
                          onMove={(status) => move(entry.id, status)}
                          onSnooze={() => postpone(entry)}
                          onFollow={() => follow(entry)}
                          lanes={lanes.map((l) => l.status)}
                        />
                      ))}
                      {list.length > limit && (
                        <button
                          className="small missions-more"
                          onClick={() =>
                            setExpanded((s) => new Set(s).add(laneKey))
                          }
                        >
                          {t("Afficher {n} de plus", {
                            n: list.length - PAGE,
                          })}
                        </button>
                      )}
                      {!list.length && (
                        <p className="missions-empty">
                          {dragId ? t("Déposez la carte ici") : lane.hint}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
          {!shown.length && (
            <p className="muted missions-none">
              {t("Aucune carte ne correspond aux filtres choisis.")}
            </p>
          )}
        </>
      )}
    </>
  );
}

function MissionCard({
  entry,
  now,
  links,
  readOnly,
  dragging,
  flash,
  lanes,
  onDragStart,
  onDragEnd,
  onOpen,
  onMove,
  onSnooze,
  onFollow,
}: {
  entry: Entry;
  now: number;
  links: number;
  readOnly: boolean;
  dragging: boolean;
  flash: "done" | "moved" | null;
  lanes: Status[];
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onMove: (status: Status) => void;
  onSnooze: () => void;
  onFollow: () => void;
}) {
  const f = current(entry);
  const due = dueInfo(entry, now);
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stopHover = () => {
    clearTimeout(timer.current);
    setHover(null);
  };
  const open = needsFollowUp(entry);
  return (
    <article
      className={[
        "tile missions-card",
        f.priority === "Urgent" && "urgent",
        due?.late && "late",
        dragging && "dragging",
        flash && `flash-${flash}`,
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={!readOnly}
      onDragStart={(e) => {
        stopHover();
        onDragStart(e);
      }}
      onDragEnd={onDragEnd}
      onMouseEnter={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        clearTimeout(timer.current);
        timer.current = setTimeout(
          () =>
            setHover(
              box.right + 340 < window.innerWidth
                ? { x: box.right + 8, y: box.top }
                : { x: box.left, y: box.bottom + 6 },
            ),
          550,
        );
      }}
      onMouseLeave={stopHover}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, select, a, input"))
          return;
        stopHover();
        onOpen();
      }}
    >
      <div className="tile-top">
        <span className="mono missions-number">{numberLabel(entry)}</span>
        <span className="pill plain">{enumLabel(f.type)}</span>
        {f.priority !== "Normal" && (
          <span className={`pill ${f.priority === "Urgent" ? "crit" : "warn"}`}>
            {enumLabel(f.priority)}
          </span>
        )}
        {links > 0 && (
          <span
            className="missions-links"
            title={t("{n} lien(s)", { n: links })}
          >
            <Link2 size={12} />
            {links}
          </span>
        )}
        {!readOnly && (
          <button
            className="icon-button missions-menu"
            aria-label={t("Changer l’état de {entry}", {
              entry: numberLabel(entry),
            })}
            title={t("Changer l’état")}
            aria-haspopup="menu"
            onClick={(e) => {
              stopHover();
              setMenu(menu ? null : e.currentTarget);
            }}
          >
            <ArrowRightLeft size={14} />
          </button>
        )}
      </div>
      <button className="missions-open" onClick={onOpen} onFocus={stopHover}>
        <span className="missions-message">{f.message}</span>
        {f.action.trim() && (
          <span className="missions-action">
            <em>{t("Mesure")}</em> {f.action}
          </span>
        )}
      </button>
      {(f.assignee || due || f.location) && (
        <div className="meta-line">
          {f.assignee && (
            <span className="missions-meta">
              <User size={12} />
              {f.assignee}
            </span>
          )}
          {due && (
            <span
              className={`missions-meta missions-due${due.late ? " late" : due.soon ? " soon" : ""}`}
            >
              <Clock size={12} />
              {due.text}
            </span>
          )}
        </div>
      )}
      {!readOnly && open && (
        <div className="missions-actions">
          <button
            className="small"
            onClick={onSnooze}
            title={t("Reporter l’échéance de 15 minutes")}
          >
            <AlarmClockPlus size={13} />
            {t("+{n} min", { n: 15 })}
          </button>
          <button
            className="small"
            onClick={onFollow}
            title={t("Consigner une suite au journal")}
          >
            <Reply size={13} />
            {t("Consigner une suite")}
          </button>
        </div>
      )}
      {flash === "done" && (
        <span className="missions-burst" aria-hidden="true">
          <CheckCircle2 size={22} />
        </span>
      )}
      {menu && (
        <Popover anchor={menu} onClose={() => setMenu(null)} align="end">
          <span className="menu-label">{t("Déplacer vers")}</span>
          {lanes
            .filter((s) => s !== f.status)
            .map((s) => {
              const Icon = LANES.find((l) => l.status === s)!.icon;
              return (
                <button
                  key={s}
                  role="menuitem"
                  data-close
                  onClick={() => onMove(s)}
                >
                  <Icon size={14} />
                  {enumLabel(s)}
                </button>
              );
            })}
          <hr />
          <button role="menuitem" data-close onClick={onOpen}>
            <ExternalLink size={14} />
            {t("Ouvrir la fiche")}
          </button>
        </Popover>
      )}
      {hover && !menu && !dragging && (
        <HoverCard target={ref("entry", entry.id)} x={hover.x} y={hover.y} />
      )}
    </article>
  );
}

export default Missions;
