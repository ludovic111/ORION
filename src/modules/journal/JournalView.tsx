import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Link2,
  ListFilter,
  LockKeyhole,
  Plus,
  Printer,
  Search,
  Square,
  SquareCheck,
  SquareMinus,
  UsersRound,
  X,
} from "lucide-react";
import {
  chronological,
  current,
  day,
  needsFollowUp,
  numberLabel,
  overdue,
  searchEntries,
  type Fields,
} from "../../../shared/journal";
import { radioSummary } from "../../../shared/radio";
import { useApp } from "../../app/context";
import { EntryForm } from "../../journal/EntryForm";
import { JournalRow } from "../../journal/JournalRow";
import { Alerts } from "../../journal/Alerts";
import { ModuleHead } from "../../ui/ModuleHead";
import { Toggle } from "../../ui/fields";
import { CountUp } from "../../ui/effects";
import { useSlider } from "../../ui/motion";

type Filter = "all" | "follow" | "urgent" | "decisions";

export function JournalView({
  formGeneration,
  draft,
  draftLabel,
  suggestions,
  onDraft,
  onAdd,
  onDialog,
  dirty,
  closeOffer,
  onCloseOffer,
  onCloseEntries,
  onSnooze,
  searchRef,
}: {
  formGeneration: number;
  draft?: Fields;
  draftLabel: string;
  suggestions: string[];
  onDraft: (fields: Fields) => void;
  onAdd: (fields: Fields) => void;
  onDialog: (dialog: "report" | "handover" | "export" | "deleted" | "settings") => void;
  dirty: boolean;
  closeOffer: { receipt: string; ids: string[] } | null;
  onCloseOffer: (accept: boolean) => void;
  onCloseEntries: (ids: string[], reason: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { journal, author, now, readOnly, compose, openEntry, print, prefs, setPrefs, toast } =
    useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [newest, setNewest] = useState(true);
  const [date, setDate] = useState("");
  const [limit, setLimit] = useState(100);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const filterSlider = useSlider<HTMLDivElement>(`${filter}-${journal.id}`);
  const seen = useRef<Set<string>>(new Set(journal.entries.map((e) => e.id)));
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    const added = journal.entries.filter((e) => !seen.current.has(e.id)).map((e) => e.id);
    journal.entries.forEach((e) => seen.current.add(e.id));
    if (added.length) setFresh(new Set(added));
  }, [journal.entries]);
  const visible = useMemo(() => {
    let entries = searchEntries(journal.entries, query);
    if (filter === "follow") entries = entries.filter(needsFollowUp);
    if (filter === "urgent") entries = entries.filter((e) => current(e).priority === "Urgent");
    if (filter === "decisions") entries = entries.filter((e) => current(e).type === "Décision");
    if (date)
      entries = entries.filter(
        (e) =>
          new Date(current(e).happenedAt).toLocaleDateString("sv-SE", {
            timeZone: "Europe/Zurich",
          }) === date,
      );
    const sorted = chronological(entries);
    return newest ? sorted.reverse() : sorted;
  }, [journal, query, filter, date, newest]);
  useEffect(() => {
    setLimit(100);
  }, [query, filter, date, journal.id]);
  useEffect(() => {
    setPicked(new Set());
  }, [journal.id]);
  const follow = journal.entries.filter(needsFollowUp);
  const late = follow.filter((e) => overdue(e, now));
  const urgent = journal.entries.filter((e) => current(e).priority === "Urgent").length;
  const decisions = journal.entries.filter((e) => current(e).type === "Décision").length;
  const radio = radioSummary(journal.radio);
  const pickedEntries = chronological(journal.entries.filter((e) => picked.has(e.id)));
  const shownIds = visible.slice(0, limit).map((e) => e.id);
  const allShownPicked = shownIds.length > 0 && shownIds.every((id) => picked.has(id));
  const togglePick = (id: string) =>
    setPicked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <>
      <ModuleHead
        eyebrow={
          <>
            <span className={journal.closedAt ? "crit-text" : ""}>
              {journal.closedAt ? "Clôturé" : "Ouvert"}
            </span>
            · {journal.mode} · {journal.classification}
            {journal.reference && ` · ${journal.reference}`}
          </>
        }
        title={journal.title}
        description={[journal.organization, journal.location, day(journal.createdAt)]
          .filter(Boolean)
          .join(" · ")}
        topic="journal"
        actions={
          <>
            <button onClick={() => onDialog("report")}>
              <FileText size={14} />
              Rapport
            </button>
            <button onClick={() => onDialog("handover")}>
              <UsersRound size={14} />
              Relève
            </button>
            <button onClick={() => onDialog("export")}>
              <Download size={14} />
              Exporter
            </button>
            <button className="primary" disabled={readOnly} onClick={() => compose()}>
              <Plus size={15} />
              Nouvelle entrée
            </button>
          </>
        }
      />
      {closeOffer && !readOnly && (
        <div className="banner info" role="status">
          <Link2 size={15} />
          <span>
            Quittance {closeOffer.receipt} : clore{" "}
            {closeOffer.ids
              .map((id) => journal.entries.find((e) => e.id === id))
              .filter((e) => !!e)
              .map(
                (e) =>
                  `${numberLabel(e)} « ${current(e).message.length > 60 ? `${current(e).message.slice(0, 59)}…` : current(e).message} »`,
              )
              .join(", ")}{" "}
            ?
          </span>
          <button className="link" onClick={() => onCloseOffer(true)}>
            Marquer terminé
          </button>
          <button className="link muted" onClick={() => onCloseOffer(false)}>
            Ignorer
          </button>
        </div>
      )}
      <Alerts
        journal={journal}
        at={now}
        readOnly={readOnly}
        onOpen={(id) => openEntry(id)}
        onSnooze={(e, minutes) => onSnooze(e.id, minutes)}
        onDone={(e) => {
          onCloseEntries([e.id], "Suivi marqué terminé par l’opérateur");
          toast(`${numberLabel(e)} terminé.`);
        }}
      />
      <dl className="metrics">
        <div>
          <dt>Entrées</dt>
          <dd>
            <CountUp value={journal.entries.length} />
          </dd>
        </div>
        <div className={follow.length ? "warn" : ""}>
          <dt>À suivre</dt>
          <dd>
            <CountUp value={follow.length} />
          </dd>
        </div>
        <div className={late.length ? "crit" : ""}>
          <dt>Échéances dépassées</dt>
          <dd>
            <CountUp value={late.length} />
          </dd>
        </div>
        <div className={urgent ? "crit" : ""}>
          <dt>Urgent</dt>
          <dd>
            <CountUp value={urgent} />
          </dd>
        </div>
        <div>
          <dt>Radios en service</dt>
          <dd>
            <CountUp value={radio.issued} />
            <small>/{radio.terminals}</small>
          </dd>
        </div>
        <div className={dirty ? "warn" : ""}>
          <dt>Archive</dt>
          <dd className="text">
            <button className="link" onClick={() => onDialog("export")}>
              {dirty ? "À exporter" : "À jour"}
            </button>
          </dd>
        </div>
      </dl>
      <div className="journal-layout">
        <section className="panel journal-panel" aria-label="Entrées">
          <div className="toolbar">
            <div
              className="segmented slider"
              role="group"
              aria-label="Filtrer"
              ref={filterSlider.ref}
            >
              <span className="slider-pill" ref={filterSlider.pill} />
              {(
                [
                  ["all", "Tout", journal.entries.length],
                  ["follow", "À suivre", follow.length],
                  ["urgent", "Urgent", urgent],
                  ["decisions", "Décisions", decisions],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  aria-pressed={filter === value}
                  key={value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                  <span>{count}</span>
                </button>
              ))}
            </div>
            <div className="search">
              <Search size={14} />
              <input
                ref={searchRef}
                aria-label="Rechercher dans le journal"
                placeholder="Rechercher dans le journal"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label="Effacer la recherche"
                  onClick={() => setQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <label className="date-filter">
              <ListFilter size={14} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Filtrer par jour (heure suisse)"
              />
            </label>
            <button
              className="icon-button"
              title={newest ? "Plus récentes d’abord" : "Ordre chronologique"}
              aria-label={
                newest
                  ? "Afficher en ordre chronologique"
                  : "Afficher les plus récentes d’abord"
              }
              onClick={() => setNewest(!newest)}
            >
              {newest ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
            </button>
          </div>
          {picked.size > 0 && (
            <div className="selection-bar" role="region" aria-label="Sélection">
              <span className="mono">
                {picked.size} sélectionnée{picked.size > 1 ? "s" : ""}
              </span>
              <button
                className="primary"
                onClick={() => print({ kind: "messages", journal, entries: pickedEntries })}
              >
                <FileText size={14} />
                Fiches A4
              </button>
              <button onClick={() => setPicked(new Set())}>Désélectionner</button>
            </div>
          )}
          <div className="table-scroll">
            <table className="grid journal-grid">
              <thead>
                <tr>
                  <th className="pick">
                    <button
                      className="check"
                      aria-label={
                        allShownPicked
                          ? "Désélectionner les entrées affichées"
                          : "Sélectionner les entrées affichées"
                      }
                      onClick={() =>
                        setPicked((previous) => {
                          const next = new Set(previous);
                          shownIds.forEach((id) =>
                            allShownPicked ? next.delete(id) : next.add(id),
                          );
                          return next;
                        })
                      }
                    >
                      {allShownPicked ? (
                        <SquareCheck size={15} />
                      ) : picked.size ? (
                        <SquareMinus size={15} />
                      ) : (
                        <Square size={15} />
                      )}
                    </button>
                  </th>
                  <th>Heure · N°</th>
                  <th>Message</th>
                  <th>Émetteur</th>
                  <th>Suivi</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, limit).map((entry, index) => {
                  const f = current(entry);
                  const newDay =
                    index === 0 ||
                    day(current(visible[index - 1]).happenedAt) !== day(f.happenedAt);
                  return (
                    <JournalRow
                      key={entry.id}
                      entry={entry}
                      newDay={newDay}
                      fresh={fresh.has(entry.id)}
                      picked={picked.has(entry.id)}
                      onPick={() => togglePick(entry.id)}
                      onOpen={() => openEntry(entry.id)}
                      onEdit={() => openEntry(entry.id, "edit")}
                      onDelete={() => openEntry(entry.id, "delete")}
                      readOnly={readOnly}
                      at={now}
                    />
                  );
                })}
              </tbody>
            </table>
            {!visible.length && (
              <div className="empty">
                <p>{journal.entries.length ? "Aucune entrée ne correspond." : "Journal vide."}</p>
                {journal.entries.length ? (
                  <button
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                      setDate("");
                    }}
                  >
                    Retirer les filtres
                  </button>
                ) : (
                  !readOnly && (
                    <button className="primary" onClick={() => compose()}>
                      <Plus size={14} />
                      Première entrée
                    </button>
                  )
                )}
              </div>
            )}
          </div>
          <footer className="panel-foot">
            <span>
              {visible.length}
              {visible.length !== journal.entries.length && ` / ${journal.entries.length}`}{" "}
              entrée{visible.length !== 1 ? "s" : ""}
            </span>
            {journal.deleted.length > 0 && (
              <button className="link" onClick={() => onDialog("deleted")}>
                {journal.deleted.length} supprimée
                {journal.deleted.length > 1 ? "s" : ""}
              </button>
            )}
            <span>Europe/Zurich</span>
          </footer>
          {visible.length > limit && (
            <button className="load-more" onClick={() => setLimit(limit + 100)}>
              Afficher 100 de plus
            </button>
          )}
        </section>
        <aside className="panel composer">
          {readOnly ? (
            <div className="closed">
              <LockKeyhole size={18} />
              <strong>Journal clôturé</strong>
              <p>Lecture et export uniquement.</p>
              <button onClick={() => onDialog("settings")}>Rouvrir</button>
            </div>
          ) : (
            <>
              <EntryForm
                key={`${journal.id}-${formGeneration}`}
                author={author}
                preset={draft}
                onDraft={onDraft}
                onSave={(fields) => onAdd(fields)}
                suggestions={suggestions}
                compact
                draftLabel={draftLabel}
              />
              <div className="auto-print">
                <Toggle
                  label={
                    <>
                      <Printer size={13} /> Impression automatique
                    </>
                  }
                  hint="Chaque entrée consignée part à l’imprimante."
                  checked={prefs.autoPrint}
                  onChange={(value) => {
                    setPrefs({ autoPrint: value });
                    toast(
                      value
                        ? "Impression automatique activée sur ce poste."
                        : "Impression automatique désactivée.",
                    );
                  }}
                />
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
