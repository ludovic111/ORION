import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Inbox,
  Kanban,
  List,
  PenLine,
  Plus,
  Printer,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { time } from "../../../shared/journal";
import { parseRef, ref } from "../../../shared/links";
import {
  MESSAGE_PRIORITIES,
  MESSAGE_STATUSES,
  type Message,
} from "../../../shared/ops";
import { useApp } from "../../app/context";
import { CountUp } from "../../ui/effects";
import { Segmented, Toggle } from "../../ui/fields";
import { LinkChip } from "../../ui/links";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { useMessageActions } from "./actions";
import { Capture } from "./Capture";
import { MessageButtons, MessageCard, ReplyBadge } from "./MessageCard";
import { MessageSheet } from "./MessageSheet";
import { Synthesis } from "./Synthesis";
import {
  PRIORITY_TONE,
  STATUS_HINT,
  STATUS_TONE,
  countdown,
  mLabel,
  type Status,
} from "./model";
import "./messages.css";

type View = "board" | "list";
const VIEW_KEY = "orion-aic-messages-view";
const PRIORITY_RANK = { Urgent: 0, Important: 1, Normal: 2 } as const;
const LANE_LIMIT = 40;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "board";
  } catch {
    return "board";
  }
}

export function Messages() {
  const { journal, readOnly, focus, setFocus, now } = useApp();
  const actions = useMessageActions();
  const numbers = actions.numbers;
  const messages = journal.ops.messages;
  const [view, setViewState] = useState<View>(readView);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("");
  const [recipient, setRecipient] = useState("");
  const [replyOnly, setReplyOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [synth, setSynth] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);
  const [expanded, setExpanded] = useState<Set<Status>>(new Set());
  const captureRef = useRef<HTMLDivElement>(null);

  // Highlight messages arriving (typed here or on another post).
  const seen = useRef<Set<string>>(new Set(messages.map((m) => m.id)));
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    const added = messages
      .filter((m) => !seen.current.has(m.id))
      .map((m) => m.id);
    messages.forEach((m) => seen.current.add(m.id));
    if (added.length) setFresh(new Set(added));
  }, [messages]);

  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* per-post convenience only */
    }
  };
  const focusCapture = () => {
    const box = captureRef.current;
    if (!box) return;
    box.scrollIntoView({ behavior: "smooth", block: "start" });
    box
      .querySelector<HTMLInputElement>("input:not([disabled])")
      ?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!focus) return;
    const { kind, id } = parseRef(focus);
    if (kind !== "message") return;
    if (id === "new") requestAnimationFrame(focusCapture);
    else if (messages.some((m) => m.id === id)) setEditing(id);
    setFocus(null);
  }, [focus, messages, setFocus]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t?.closest(
          "input, textarea, select, [contenteditable=true], dialog, .sheet-panel",
        )
      )
        return;
      e.preventDefault();
      focusCapture();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const recipients = useMemo(
    () =>
      [...new Set(messages.map((m) => m.to.trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "fr"),
      ),
    [messages],
  );
  const visible = useMemo(() => {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    return messages.filter((m) => {
      if (priority && m.priority !== priority) return false;
      if (recipient && m.to.trim() !== recipient) return false;
      const pending = m.status === "Nouveau" || m.status === "En traitement";
      if (replyOnly && !(m.replyNeeded && pending)) return false;
      if (openOnly && !pending) return false;
      if (!terms.length) return true;
      const hay = norm(
        [
          mLabel(numbers.get(m.id)),
          m.from,
          m.to,
          m.via,
          m.category,
          m.subject,
          m.body,
          m.location,
          m.handledBy,
          m.notes,
          ...m.tags,
        ].join(" "),
      );
      return terms.every((t) => hay.includes(t));
    });
  }, [messages, query, priority, recipient, replyOnly, openOnly, numbers]);
  const filtered = !!(query || priority || recipient || replyOnly || openOnly);

  const counts = useMemo(() => {
    const c = Object.fromEntries(MESSAGE_STATUSES.map((s) => [s, 0])) as Record<
      Status,
      number
    >;
    for (const m of messages) c[m.status]++;
    return c;
  }, [messages]);
  const late = messages.filter(
    (m) =>
      m.replyNeeded &&
      m.replyBy &&
      m.status !== "Classé" &&
      m.status !== "Transmis" &&
      countdown(m.replyBy, now).late,
  ).length;

  const lanes = useMemo(() => {
    const by = new Map<Status, Message[]>(MESSAGE_STATUSES.map((s) => [s, []]));
    for (const m of visible) by.get(m.status)!.push(m);
    for (const [status, list] of by)
      list.sort((a, b) =>
        status === "Nouveau" || status === "En traitement"
          ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
            Date.parse(a.receivedAt) - Date.parse(b.receivedAt)
          : Date.parse(b.receivedAt) - Date.parse(a.receivedAt),
      );
    return by;
  }, [visible]);
  const newestFirst = useMemo(
    () =>
      [...visible].sort(
        (a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt),
      ),
    [visible],
  );

  function drop(status: Status, id: string) {
    const m = messages.find((x) => x.id === id);
    if (!m || m.status === status) return;
    if (status === "Transmis" && !m.entryId) setSynth(m.id);
    else actions.setStatus(m, status);
  }

  const editingMessage = editing
    ? messages.find((m) => m.id === editing)
    : undefined;
  const synthMessage = synth ? messages.find((m) => m.id === synth) : undefined;
  const handlers = {
    onEdit: (m: Message) => setEditing(m.id),
    onSynth: (m: Message) => setSynth(m.id),
  };
  const printable = [...visible].sort(
    (a, b) => (numbers.get(a.id) ?? 0) - (numbers.get(b.id) ?? 0),
  );

  return (
    <>
      <ModuleHead
        actions={
          <>
            <button
              disabled={!printable.length}
              onClick={() => actions.printSheet(printable)}
              title="Une fiche A4 par message affiché"
            >
              <Printer size={14} />
              Fiches A4
            </button>
            {!readOnly && (
              <button className="primary" onClick={focusCapture}>
                <Plus size={15} />
                Nouveau message
                <kbd>N</kbd>
              </button>
            )}
          </>
        }
      />
      <div
        className="msg-stats stagger"
        role="list"
        aria-label="Messages par état"
      >
        {MESSAGE_STATUSES.map((s) => (
          <div
            key={s}
            className={`msg-stat tone-${STATUS_TONE[s]}`}
            role="listitem"
          >
            <strong>
              <CountUp value={counts[s]} />
            </strong>
            <span>{s}</span>
            <small>{STATUS_HINT[s]}</small>
          </div>
        ))}
        <div
          className={`msg-stat tone-${late ? "crit" : "plain"}`}
          role="listitem"
        >
          <strong>
            <CountUp value={late} />
          </strong>
          <span>Réponses en retard</span>
          <small>Échéance dépassée</small>
        </div>
      </div>
      <div className="msg-layout">
        <div className="msg-side">
          <Capture boxRef={captureRef} />
        </div>
        <section className="msg-main" aria-label="Messages reçus">
          {!messages.length ? (
            <div className="card msg-empty">
              <EmptyState
                icon={<Inbox size={28} />}
                title="Aucun message pour l’instant"
                actions={
                  !readOnly && (
                    <button className="primary" onClick={focusCapture}>
                      <PenLine size={14} />
                      Saisir le premier message
                    </button>
                  )
                }
              >
                Chaque message reçu (radio, téléphone, messager…) est d’abord
                saisi ici en quelques secondes. Une autre personne le relit et
                l’inscrit au journal.
              </EmptyState>
              <ol className="msg-flow" aria-label="Déroulement">
                <li>
                  <span className="msg-flow-icon">
                    <Inbox size={18} />
                  </span>
                  <strong>Réception</strong>
                  <small>Saisie rapide : de, à, canal, texte</small>
                </li>
                <li aria-hidden="true" className="msg-flow-arrow">
                  <ArrowRight size={18} />
                </li>
                <li>
                  <span className="msg-flow-icon">
                    <Sparkles size={18} />
                  </span>
                  <strong>Synthèse</strong>
                  <small>Relecture, mise en forme, priorité</small>
                </li>
                <li aria-hidden="true" className="msg-flow-arrow">
                  <ArrowRight size={18} />
                </li>
                <li>
                  <span className="msg-flow-icon">
                    <BookOpen size={18} />
                  </span>
                  <strong>Journal</strong>
                  <small>Entrée numérotée, reliée au message</small>
                </li>
              </ol>
            </div>
          ) : (
            <>
              <div className="card msg-toolbar">
                <div className="search">
                  <Search size={14} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher (M012, émetteur, texte…)"
                    aria-label="Rechercher un message"
                  />
                  {query && (
                    <button
                      className="icon-button small"
                      aria-label="Effacer la recherche"
                      onClick={() => setQuery("")}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  aria-label="Priorité"
                >
                  <option value="">Toutes priorités</option>
                  {MESSAGE_PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  aria-label="Destinataire"
                >
                  <option value="">Tous destinataires</option>
                  {recipients.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <Toggle
                  label="Réponse attendue"
                  checked={replyOnly}
                  onChange={setReplyOnly}
                />
                <Toggle
                  label="Non traités"
                  checked={openOnly}
                  onChange={setOpenOnly}
                />
                <div className="msg-view">
                  <Segmented
                    label="Affichage"
                    value={view}
                    onChange={setView}
                    options={[
                      {
                        value: "board",
                        label: (
                          <>
                            <Kanban size={13} /> Tableau
                          </>
                        ),
                      },
                      {
                        value: "list",
                        label: (
                          <>
                            <List size={13} /> Liste
                          </>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
              {filtered && (
                <p className="muted msg-filter-note">
                  {visible.length} message{visible.length > 1 ? "s" : ""} sur{" "}
                  {messages.length}{" "}
                  <button
                    className="link"
                    onClick={() => {
                      setQuery("");
                      setPriority("");
                      setRecipient("");
                      setReplyOnly(false);
                      setOpenOnly(false);
                    }}
                  >
                    Tout afficher
                  </button>
                </p>
              )}
              {view === "board" ? (
                <div className="kanban msg-board">
                  {MESSAGE_STATUSES.map((status) => {
                    const list = lanes.get(status)!;
                    const shown = expanded.has(status)
                      ? list
                      : list.slice(0, LANE_LIMIT);
                    return (
                      <div
                        key={status}
                        className={`lane msg-lane lane-${STATUS_TONE[status]}${over === status ? " drop" : ""}`}
                        onDragOver={(e) => {
                          if (
                            readOnly ||
                            !e.dataTransfer.types.includes("text/orion-message")
                          )
                            return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (over !== status) setOver(status);
                        }}
                        onDragLeave={(e) => {
                          if (
                            !e.currentTarget.contains(e.relatedTarget as Node)
                          )
                            setOver(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setOver(null);
                          drop(
                            status,
                            e.dataTransfer.getData("text/orion-message"),
                          );
                        }}
                      >
                        <div className="lane-head">
                          <span className={`pill ${STATUS_TONE[status]}`}>
                            {status}
                          </span>
                          <span className="count">{list.length}</span>
                        </div>
                        {shown.map((m) => (
                          <MessageCard
                            key={m.id}
                            m={m}
                            actions={actions}
                            fresh={fresh.has(m.id)}
                            {...handlers}
                          />
                        ))}
                        {list.length > shown.length && (
                          <button
                            className="small"
                            onClick={() =>
                              setExpanded((s) => new Set([...s, status]))
                            }
                          >
                            Afficher les {list.length - shown.length} autres
                          </button>
                        )}
                        {!list.length && (
                          <p className="msg-lane-empty">
                            {readOnly
                              ? "Aucun message"
                              : "Glisser un message ici"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card msg-list">
                  <div className="table-scroll">
                    <table className="grid dense">
                      <thead>
                        <tr>
                          <th>N°</th>
                          <th>Heure</th>
                          <th>De → À</th>
                          <th>Message</th>
                          <th>État</th>
                          <th>Suite</th>
                          <th>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {newestFirst.map((m) => (
                          <tr
                            key={m.id}
                            className={`${m.priority === "Urgent" ? "urgent" : ""}${m.status === "Classé" ? " dim-row" : ""}${fresh.has(m.id) ? " live-row" : ""}`}
                          >
                            <td className="mono">
                              <button
                                className="link msg-num"
                                onClick={() => setEditing(m.id)}
                              >
                                {actions.label(m)}
                              </button>
                            </td>
                            <td className="mono">{time(m.receivedAt)}</td>
                            <td>
                              <span className="msg-route">
                                <strong>{m.from || "—"}</strong>
                                <ArrowRight size={11} />
                                <strong>{m.to || "—"}</strong>
                              </span>
                              {m.via && <div className="muted">{m.via}</div>}
                            </td>
                            <td className="msg-list-text">
                              <div className="msg-list-pills">
                                {m.priority !== "Normal" && (
                                  <span
                                    className={`pill ${PRIORITY_TONE[m.priority]}`}
                                  >
                                    {m.priority}
                                  </span>
                                )}
                                {m.category && (
                                  <span className="pill plain">
                                    {m.category}
                                  </span>
                                )}
                              </div>
                              <button
                                className="link msg-list-open"
                                onClick={() => setEditing(m.id)}
                              >
                                {m.subject || m.body}
                              </button>
                              {m.subject && m.body && (
                                <div className="muted msg-clamp">{m.body}</div>
                              )}
                            </td>
                            <td>
                              <span className={`pill ${STATUS_TONE[m.status]}`}>
                                {m.status}
                              </span>
                              {m.handledBy && (
                                <div className="muted">{m.handledBy}</div>
                              )}
                            </td>
                            <td>
                              <ReplyBadge m={m} />
                              {m.entryId && (
                                <LinkChip target={ref("entry", m.entryId)} />
                              )}
                            </td>
                            <td className="row-actions">
                              <MessageButtons
                                m={m}
                                actions={actions}
                                compact
                                {...handlers}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!newestFirst.length && (
                    <p className="muted msg-none">
                      Aucun message ne correspond aux filtres.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {editingMessage && (
        <MessageSheet
          key={editingMessage.id}
          message={editingMessage}
          actions={actions}
          onClose={() => setEditing(null)}
          onSynth={(m) => setSynth(m.id)}
        />
      )}
      {synthMessage && (
        <Synthesis
          key={synthMessage.id}
          message={synthMessage}
          actions={actions}
          onClose={() => setSynth(null)}
        />
      )}
    </>
  );
}
export default Messages;
