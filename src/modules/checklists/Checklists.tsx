import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  CopyPlus,
  Eye,
  EyeOff,
  ListChecks,
  NotebookPen,
  Pencil,
  Play,
  Plus,
  Printer,
  RotateCcw,
  Timer,
  Trash2,
} from "lucide-react";
import {
  current,
  dateTime,
  numberLabel,
  overdue,
  time,
} from "../../../shared/journal";
import { parseRef, ref } from "../../../shared/links";
import { removeRecords, upsert } from "../../../shared/ops";
import type { Checklist } from "../../../shared/conduct-schemas";
import {
  duplicateTemplate,
  progress,
  saveTemplate,
  setChecklistClosed,
  startChecklist,
  templates,
  tickEntry,
  tickStep,
  ticksOf,
  untickStep,
  type TemplateView,
} from "../../../shared/checklists";
import { useApp } from "../../app/context";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { Figures } from "../../ui/Figures";
import { Modal } from "../../journal/Modal";
import { ComboField, TextField } from "../../ui/fields";
import { StepsSheet, type TemplateDraft } from "./TemplateSheet";
import "./checklists.css";

type Editing =
  | { kind: "template"; view: TemplateView | null }
  | { kind: "list"; list: Checklist }
  | null;

export function Checklists() {
  const {
    journal,
    live,
    readOnly,
    canWrite,
    author,
    now,
    updateOps,
    changeJournal,
    toast,
    focus,
    setFocus,
    print,
  } = useApp();
  const ops = journal.ops;
  const all = useMemo(() => templates(ops), [ops]);
  const running = useMemo(
    () =>
      [...ops.checklists]
        .filter((c) => !c.closedAt)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [ops.checklists],
  );
  const closed = useMemo(
    () =>
      [...ops.checklists]
        .filter((c) => c.closedAt)
        .sort((a, b) => b.closedAt.localeCompare(a.closedAt)),
    [ops.checklists],
  );
  const [starting, setStarting] = useState<TemplateView | "pick" | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [highlight, setHighlight] = useState("");
  const cards = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!focus?.startsWith("checklist:")) return;
    const { id } = parseRef(focus);
    setFocus(null);
    if (id === "new") {
      if (!readOnly) setStarting("pick");
      return;
    }
    const found = ops.checklists.find((c) => c.id === id);
    if (!found) {
      toast("Cette liste n’existe plus.");
      return;
    }
    if (found.closedAt) setShowClosed(true);
    setHighlight(id);
    requestAnimationFrame(() =>
      cards.current
        .get(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [focus, ops.checklists, readOnly, setFocus, toast]);

  const totals = useMemo(() => {
    let done = 0;
    let total = 0;
    let late = 0;
    for (const c of running) {
      const p = progress(journal, c, now);
      done += p.done;
      total += p.total;
      late += p.late;
    }
    return { done, total, late };
  }, [running, journal, now]);

  function run(label: string, change: () => boolean) {
    try {
      if (change()) toast(label);
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function write(change: (o: typeof ops) => typeof ops, label: string) {
    if (!canWrite()) return;
    try {
      updateOps(change);
      toast(label);
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function printList(c: Checklist) {
    const ticks = ticksOf(ops, c);
    print({
      kind: "tables",
      journal,
      title: `Liste de contrôle · ${c.title}`,
      extra: `Démarrée le ${dateTime(c.startedAt)}${c.location ? ` · ${c.location}` : ""}`,
      landscape: false,
      name: "liste-de-controle",
      tables: [
        {
          id: c.id,
          title: c.title,
          caption: `${progress(journal, c, now).done}/${c.steps.length} étapes`,
          head: ["", "Étape", "Fonction", "Fait", "Par"],
          body: c.steps.map((s) => {
            const t = ticks.get(s.id);
            return [
              t?.done ? "☑" : "☐",
              `${s.text}${s.minutes ? ` (contrôle ${s.minutes} min)` : ""}`,
              s.role,
              t?.done ? time(t.at) : "",
              t?.done ? t.who : "",
            ];
          }),
          widths: [8, 102, 34, 14, 24],
        },
      ],
    });
  }

  const visibleTemplates = all.filter((t) => showHidden || !t.hidden);
  const hiddenCount = all.filter((t) => t.hidden).length;

  return (
    <>
      <ModuleHead
        actions={
          !readOnly && (
            <>
              <button
                onClick={() => setEditing({ kind: "template", view: null })}
              >
                <Plus size={14} />
                Nouveau modèle
              </button>
              <button className="primary" onClick={() => setStarting("pick")}>
                <Play size={14} />
                Démarrer une liste
              </button>
            </>
          )
        }
      />
      {running.length > 0 && (
        <Figures
          label="Listes en cours"
          items={[
            { label: "Listes en cours", value: running.length },
            {
              label: "Étapes faites",
              value: totals.done,
              unit: `/${totals.total}`,
            },
            {
              label: "Contrôles en retard",
              value: totals.late,
              tone: totals.late ? "crit" : "",
            },
            { label: "Listes closes", value: closed.length },
          ]}
        />
      )}
      {running.length === 0 && (
        <div className="card">
          <EmptyState
            icon={<ListChecks size={28} />}
            title="Aucune liste en cours"
            actions={
              !readOnly && (
                <button className="primary" onClick={() => setStarting("pick")}>
                  <Play size={14} />
                  Démarrer une liste
                </button>
              )
            }
          >
            Une liste de contrôle rappelle ce qu’il ne faut pas oublier pour un
            type d’événement (crue, black-out, canicule…). Cochez les étapes au
            fur et à mesure : le journal note qui l’a fait et quand.
          </EmptyState>
        </div>
      )}
      <div className="ck-lists">
        {running.map((c) => (
          <ListCard
            key={c.id}
            list={c}
            highlight={highlight === c.id}
            register={(el) => {
              if (el) cards.current.set(c.id, el);
              else cards.current.delete(c.id);
            }}
            onTick={(stepId, log) =>
              run("Étape cochée.", () =>
                changeJournal((j) =>
                  tickStep(j, c.id, stepId, { author, log }),
                ),
              )
            }
            onUntick={(stepId) =>
              write(
                (o) => untickStep(o, c.id, stepId, author),
                "Étape décochée.",
              )
            }
            onEdit={() => setEditing({ kind: "list", list: c })}
            onPrint={() => printList(c)}
            onClose={() =>
              write(
                (o) =>
                  setChecklistClosed(o, c.id, new Date().toISOString(), author),
                "Liste close.",
              )
            }
          />
        ))}
      </div>

      {closed.length > 0 && (
        <section className="ck-closed">
          <button
            className="ck-toggle"
            aria-expanded={showClosed}
            onClick={() => setShowClosed(!showClosed)}
          >
            <ChevronDown size={15} />
            Listes closes
            <span className="pill plain">{closed.length}</span>
          </button>
          {showClosed && (
            <div className="ck-lists">
              {closed.map((c) => (
                <ListCard
                  key={c.id}
                  list={c}
                  highlight={highlight === c.id}
                  register={(el) => {
                    if (el) cards.current.set(c.id, el);
                    else cards.current.delete(c.id);
                  }}
                  onPrint={() => printList(c)}
                  onReopen={() =>
                    write(
                      (o) => setChecklistClosed(o, c.id, "", author),
                      "Liste rouverte.",
                    )
                  }
                  onRemove={() => {
                    if (
                      !window.confirm(
                        `Supprimer la liste « ${c.title} » ? Les entrées du journal restent.`,
                      )
                    )
                      return;
                    write(
                      (o) =>
                        removeRecords(o, [
                          c.id,
                          ...o.checklistTicks
                            .filter((t) => t.checklistId === c.id)
                            .map((t) => t.id),
                        ]),
                      "Liste supprimée.",
                    );
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="card ck-templates" aria-label="Modèles">
        <div className="card-head">
          <ListChecks size={15} />
          <h2>Modèles par type d’événement</h2>
          {hiddenCount > 0 && (
            <button
              className="small"
              onClick={() => setShowHidden(!showHidden)}
            >
              {showHidden ? <EyeOff size={13} /> : <Eye size={13} />}
              {showHidden ? "Cacher les masqués" : `Masqués (${hiddenCount})`}
            </button>
          )}
        </div>
        <div className="rows">
          {visibleTemplates.map((t) => (
            <div
              key={t.id}
              className={`row-item ck-template ${t.hidden ? "muted" : ""}`}
            >
              <span className="row-main">
                <strong>{t.name}</strong>
                <small>
                  {[
                    `${t.steps.length} étapes`,
                    t.builtIn
                      ? t.changed
                        ? "standard modifié"
                        : "standard"
                      : "du journal",
                    t.hidden && "masqué",
                    t.description,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
              {!readOnly && (
                <span className="ck-template-actions">
                  <button className="small" onClick={() => setStarting(t)}>
                    <Play size={13} />
                    Démarrer
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Modifier « ${t.name} »`}
                    title="Modifier"
                    onClick={() => setEditing({ kind: "template", view: t })}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Dupliquer « ${t.name} »`}
                    title="Dupliquer"
                    onClick={() =>
                      write(
                        (o) => duplicateTemplate(o, t, author).ops,
                        "Modèle dupliqué.",
                      )
                    }
                  >
                    <CopyPlus size={14} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t.hidden ? "Afficher" : "Masquer"}
                    title={t.hidden ? "Afficher" : "Masquer"}
                    onClick={() =>
                      write(
                        (o) =>
                          saveTemplate(o, { ...t, hidden: !t.hidden }, author)
                            .ops,
                        t.hidden ? "Modèle affiché." : "Modèle masqué.",
                      )
                    }
                  >
                    {t.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  {t.recordId && (
                    <button
                      className="icon-button"
                      aria-label={
                        t.builtIn
                          ? "Rétablir le modèle standard"
                          : "Supprimer le modèle"
                      }
                      title={t.builtIn ? "Rétablir le standard" : "Supprimer"}
                      onClick={() => {
                        if (
                          !window.confirm(
                            t.builtIn
                              ? `Rétablir « ${t.name} » tel que livré ? Vos changements du modèle sont retirés (les listes démarrées ne changent pas).`
                              : `Supprimer le modèle « ${t.name} » ? Les listes démarrées restent.`,
                          )
                        )
                          return;
                        write(
                          (o) => removeRecords(o, [t.recordId]),
                          t.builtIn ? "Modèle rétabli." : "Modèle supprimé.",
                        );
                      }}
                    >
                      {t.builtIn ? (
                        <RotateCcw size={14} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {starting && (
        <StartDialog
          templates={all.filter((t) => !t.hidden)}
          initial={starting === "pick" ? null : starting}
          onClose={() => setStarting(null)}
          onStart={(t, extra) => {
            if (!canWrite()) return;
            try {
              let id = "";
              updateOps((o) => {
                const r = startChecklist(
                  o,
                  t,
                  author,
                  new Date().toISOString(),
                  extra,
                );
                id = r.id;
                return r.ops;
              });
              toast(`Liste « ${extra.title || t.name} » démarrée.`);
              setStarting(null);
              setHighlight(id);
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        />
      )}
      {editing?.kind === "template" && (
        <StepsSheet
          title={
            editing.view ? `Modèle « ${editing.view.name} »` : "Nouveau modèle"
          }
          eyebrow={
            editing.view?.builtIn
              ? "Modèle standard : vos changements valent pour ce journal"
              : "Modèle du journal"
          }
          initial={
            editing.view
              ? {
                  name: editing.view.name,
                  event: editing.view.event,
                  description: editing.view.description,
                  steps: editing.view.steps,
                }
              : { name: "", event: "", description: "", steps: [] }
          }
          onClose={() => setEditing(null)}
          onSave={(v: TemplateDraft) => {
            if (!canWrite()) return "";
            try {
              const base = editing.view;
              updateOps(
                (o) =>
                  saveTemplate(
                    o,
                    {
                      id: base?.recordId || base?.id || "",
                      builtIn: base?.builtIn ?? "",
                      hidden: base?.hidden ?? false,
                      order: base?.order,
                      ...v,
                    },
                    author,
                  ).ops,
              );
              toast("Modèle enregistré.");
              setEditing(null);
            } catch (err) {
              return (err as Error).message;
            }
          }}
        />
      )}
      {editing?.kind === "list" && (
        <StepsSheet
          title={editing.list.title}
          eyebrow="Liste en cours : les étapes cochées restent"
          describe={false}
          initial={{
            name: editing.list.title,
            event: editing.list.event,
            description: "",
            steps: editing.list.steps,
          }}
          onClose={() => setEditing(null)}
          footer={
            <button
              className="danger"
              onClick={() => {
                const c = editing.list;
                if (
                  !window.confirm(
                    `Supprimer la liste « ${c.title} » ? Les entrées du journal restent.`,
                  )
                )
                  return;
                write(
                  (o) =>
                    removeRecords(o, [
                      c.id,
                      ...o.checklistTicks
                        .filter((t) => t.checklistId === c.id)
                        .map((t) => t.id),
                    ]),
                  "Liste supprimée.",
                );
                setEditing(null);
              }}
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          }
          onSave={(v) => {
            if (!canWrite()) return "";
            try {
              const latest = live.ops.checklists.find(
                (c) => c.id === editing.list.id,
              );
              if (!latest) return "Cette liste n’existe plus.";
              updateOps((o) =>
                upsert(
                  o,
                  "checklists",
                  { ...latest, title: v.name.trim(), steps: v.steps },
                  author,
                ),
              );
              toast("Liste enregistrée.");
              setEditing(null);
            } catch (err) {
              return (err as Error).message;
            }
          }}
        />
      )}
    </>
  );
}
export default Checklists;

function ListCard({
  list,
  highlight,
  register,
  onTick,
  onUntick,
  onEdit,
  onPrint,
  onClose,
  onReopen,
  onRemove,
}: {
  list: Checklist;
  highlight: boolean;
  register: (el: HTMLElement | null) => void;
  onTick?: (stepId: string, log: boolean) => void;
  onUntick?: (stepId: string) => void;
  onEdit?: () => void;
  onPrint: () => void;
  onClose?: () => void;
  onReopen?: () => void;
  onRemove?: () => void;
}) {
  const { journal, now, readOnly, openEntry } = useApp();
  const ticks = ticksOf(journal.ops, list);
  const p = progress(journal, list, now);
  // Per step, whether ticking writes to the journal (the step decides by
  // default; the operator may change it before ticking).
  const [logs, setLogs] = useState<Record<string, boolean>>({});
  const closed = !!list.closedAt;
  return (
    <section
      ref={register}
      className={`card ck-card ${highlight ? "ck-highlight" : ""} ${closed ? "ck-closed-card" : ""}`}
      aria-label={list.title}
    >
      <div className="card-head ck-head">
        <div className="ck-title">
          <h2>{list.title}</h2>
          <small>
            {[
              list.event !== list.title && list.event,
              `démarrée ${dateTime(list.startedAt)}`,
              list.location,
              closed && `close ${dateTime(list.closedAt)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </small>
        </div>
        <span className="ck-count mono">
          {p.done}/{p.total}
        </span>
      </div>
      <div
        className="ck-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={p.total}
        aria-valuenow={p.done}
        aria-label="Étapes faites"
      >
        <span style={{ width: `${Math.round(p.ratio * 100)}%` }} />
      </div>
      {list.notes && <p className="muted ck-notes">{list.notes}</p>}
      <ol className="ck-steps">
        {list.steps.map((s, i) => {
          const t = ticks.get(s.id);
          const done = !!t?.done;
          const entry = done ? tickEntry(journal, t) : undefined;
          const late = entry ? overdue(entry, now) : false;
          const log = logs[s.id] ?? s.log;
          return (
            <li
              key={s.id}
              className={`ck-step ${done ? "done" : ""} ${late ? "late" : ""}`}
            >
              <label className="ck-check">
                <input
                  type="checkbox"
                  checked={done}
                  disabled={readOnly || closed}
                  onChange={() =>
                    done ? onUntick?.(s.id) : onTick?.(s.id, log)
                  }
                />
                <span className="mono ck-num">{i + 1}</span>
                <span className="ck-text">
                  <span>{s.text}</span>
                  <small>
                    {[
                      s.role,
                      s.minutes > 0 && `contrôle ${s.minutes} min après`,
                      done && `fait à ${time(t!.at)} par ${t!.who}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
              </label>
              <span className="ck-step-side">
                {late && <span className="pill crit">Contrôle en retard</span>}
                {entry && (
                  <button
                    className="small link mono"
                    onClick={() => openEntry(entry.id)}
                    title={current(entry).message}
                  >
                    {numberLabel(entry)}
                  </button>
                )}
                {!done && s.minutes > 0 && (
                  <span className="ck-timer" title="Contrôle après l’étape">
                    <Timer size={13} />
                    {s.minutes}
                  </span>
                )}
                {!done && !readOnly && !closed && (
                  <button
                    className="icon-button ck-log"
                    aria-pressed={log || s.minutes > 0}
                    disabled={s.minutes > 0}
                    title={
                      s.minutes > 0
                        ? "Consignée (contrôle à suivre)"
                        : log
                          ? "Sera consignée au journal"
                          : "Ne sera pas consignée"
                    }
                    aria-label={
                      log
                        ? "Ne pas consigner cette étape"
                        : "Consigner cette étape"
                    }
                    onClick={() => setLogs((l) => ({ ...l, [s.id]: !log }))}
                  >
                    <NotebookPen size={14} />
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="ck-actions">
        <button className="small" onClick={onPrint}>
          <Printer size={13} />
          Imprimer
        </button>
        {!readOnly && onEdit && (
          <button className="small" onClick={onEdit}>
            <Pencil size={13} />
            Modifier
          </button>
        )}
        {!readOnly && onClose && (
          <button className="small" onClick={onClose}>
            Clore la liste
          </button>
        )}
        {!readOnly && onReopen && (
          <button className="small" onClick={onReopen}>
            <RotateCcw size={13} />
            Rouvrir
          </button>
        )}
        {!readOnly && onRemove && (
          <button className="small danger" onClick={onRemove}>
            <Trash2 size={13} />
            Supprimer
          </button>
        )}
      </div>
    </section>
  );
}

function StartDialog({
  templates: list,
  initial,
  onClose,
  onStart,
}: {
  templates: TemplateView[];
  initial: TemplateView | null;
  onClose: () => void;
  onStart: (
    t: TemplateView,
    extra: { title: string; location: string; notes: string },
  ) => void;
}) {
  const { lists } = useApp();
  const [picked, setPicked] = useState<TemplateView | null>(initial);
  const [title, setTitle] = useState(initial?.name ?? "");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Modal title="Démarrer une liste de contrôle" onClose={onClose}>
      <div className="ck-pick" role="list">
        {list.map((t) => (
          <button
            key={t.id}
            role="listitem"
            className="row-item"
            aria-pressed={picked?.id === t.id}
            onClick={() => {
              setPicked(t);
              setTitle(t.name);
            }}
          >
            <span className="row-main">
              <strong>{t.name}</strong>
              <small>
                {t.steps.length} étapes · {t.description || t.event}
              </small>
            </span>
          </button>
        ))}
      </div>
      {picked && (
        <div className="form-grid ck-start-fields">
          <ComboField
            className="span-2"
            label="Titre de la liste"
            value={title}
            options={lists("eventKinds")}
            maxLength={200}
            onChange={setTitle}
          />
          <TextField
            className="span-2"
            label="Lieu ou secteur"
            value={location}
            maxLength={300}
            onChange={setLocation}
          />
          <TextField
            className="span-2"
            label="Remarques"
            rows={2}
            value={notes}
            maxLength={2000}
            onChange={setNotes}
          />
        </div>
      )}
      <div className="modal-actions">
        <button onClick={onClose}>Annuler</button>
        <button
          className="primary"
          disabled={!picked || !picked.steps.length}
          onClick={() =>
            picked &&
            onStart(picked, {
              title: title.trim() || picked.name,
              location,
              notes,
            })
          }
        >
          <Play size={14} />
          Démarrer
        </button>
      </div>
    </Modal>
  );
}
