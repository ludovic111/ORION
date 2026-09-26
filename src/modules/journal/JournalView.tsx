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
import { Figures } from "../../ui/Figures";
import { useSlider } from "../../ui/motion";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { t, tn } from "./i18n.ts";

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
  onDialog: (
    dialog: "report" | "handover" | "export" | "deleted" | "settings",
  ) => void;
  dirty: boolean;
  closeOffer: { receipt: string; ids: string[] } | null;
  onCloseOffer: (accept: boolean) => void;
  onCloseEntries: (ids: string[], reason: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  const {
    journal,
    author,
    now,
    readOnly,
    compose,
    openEntry,
    print,
    prefs,
    setPrefs,
    toast,
  } = useApp();
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
    const added = journal.entries
      .filter((e) => !seen.current.has(e.id))
      .map((e) => e.id);
    journal.entries.forEach((e) => seen.current.add(e.id));
    if (added.length) setFresh(new Set(added));
  }, [journal.entries]);
  const visible = useMemo(() => {
    let entries = searchEntries(journal.entries, query);
    if (filter === "follow") entries = entries.filter(needsFollowUp);
    if (filter === "urgent")
      entries = entries.filter((e) => current(e).priority === "Urgent");
    if (filter === "decisions")
      entries = entries.filter((e) => current(e).type === "Décision");
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
  const urgent = journal.entries.filter(
    (e) => current(e).priority === "Urgent",
  ).length;
  const decisions = journal.entries.filter(
    (e) => current(e).type === "Décision",
  ).length;
  const radio = radioSummary(journal.radio);
  const pickedEntries = chronological(
    journal.entries.filter((e) => picked.has(e.id)),
  );
  const shownIds = visible.slice(0, limit).map((e) => e.id);
  const allShownPicked =
    shownIds.length > 0 && shownIds.every((id) => picked.has(id));
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
              {journal.closedAt ? t("Clôturé") : t("Ouvert")}
            </span>
            · {enumLabel(journal.mode)} · {enumLabel(journal.classification)}
            {journal.reference && ` · ${journal.reference}`}
          </>
        }
        title={journal.title}
        description={[
          journal.organization,
          journal.location,
          day(journal.createdAt),
        ]
          .filter(Boolean)
          .join(" · ")}
        topic="journal"
        actions={
          <>
            <button onClick={() => onDialog("report")}>
              <FileText size={14} />
              {t("Rapport")}
            </button>
            <button onClick={() => onDialog("handover")}>
              <UsersRound size={14} />
              {t("Relève")}
            </button>
            <button
              onClick={() => onDialog("export")}
              title={
                dirty
                  ? t(
                      "Des changements ne sont pas encore dans une archive exportée",
                    )
                  : t("Archive à jour")
              }
            >
              <Download size={14} />
              {t("Exporter")}
              {dirty && <span className="pill warn">{t("à faire")}</span>}
            </button>
            <button
              className="primary"
              aria-disabled={readOnly || undefined}
              title={
                readOnly
                  ? journal.closedAt
                    ? t("Journal clôturé — rouvrez-le pour écrire")
                    : t("Lecture seule : vous consultez le passé")
                  : undefined
              }
              onClick={() => compose()}
            >
              <Plus size={15} />
              {t("Nouvelle entrée")}
            </button>
          </>
        }
      />
      {closeOffer && !readOnly && (
        <div className="banner info" role="status">
          <Link2 size={15} />
          <span>
            {t("Quittance {receipt} : clore {entries} ?", {
              receipt: closeOffer.receipt,
              entries: closeOffer.ids
                .map((id) => journal.entries.find((e) => e.id === id))
                .filter((e) => !!e)
                .map(
                  (e) =>
                    `${numberLabel(e)} « ${current(e).message.length > 60 ? `${current(e).message.slice(0, 59)}…` : current(e).message} »`,
                )
                .join(", "),
            })}
          </span>
          <button className="link" onClick={() => onCloseOffer(true)}>
            {t("Marquer terminé")}
          </button>
          <button className="link muted" onClick={() => onCloseOffer(false)}>
            {t("Ignorer")}
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
          onCloseEntries([e.id], t("Suivi marqué terminé par l’opérateur"));
          toast(t("{n} terminé.", { n: numberLabel(e) }));
        }}
      />
      <Figures
        label={t("Le journal en chiffres")}
        items={[
          {
            label: t("Entrées"),
            value: journal.entries.length,
            onClick: () => setFilter("all"),
          },
          {
            label: t("À suivre"),
            value: follow.length,
            tone: follow.length ? "warn" : "",
            onClick: () => setFilter("follow"),
          },
          {
            label: t("Échéances dépassées"),
            value: late.length,
            tone: late.length ? "crit" : "",
            onClick: () => setFilter("follow"),
          },
          {
            label: enumLabel("Urgent"),
            value: urgent,
            tone: urgent ? "crit" : "",
            onClick: () => setFilter("urgent"),
          },
          {
            label: t("Radios en service"),
            value: radio.issued,
            unit: `/${radio.terminals}`,
          },
        ]}
      />
      <div className="journal-layout">
        <section className="panel journal-panel" aria-label={t("Entrées")}>
          <div className="toolbar">
            <div
              className="segmented slider"
              role="group"
              aria-label={t("Filtrer")}
              ref={filterSlider.ref}
            >
              <span className="slider-pill" ref={filterSlider.pill} />
              {(
                [
                  ["all", t("Tout"), journal.entries.length],
                  ["follow", t("À suivre"), follow.length],
                  ["urgent", enumLabel("Urgent"), urgent],
                  ["decisions", t("Décisions"), decisions],
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
                aria-label={t("Rechercher dans le journal")}
                placeholder={t("Rechercher dans le journal")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label={t("Effacer la recherche")}
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
                aria-label={t("Filtrer par jour (heure suisse)")}
              />
            </label>
            <button
              className="icon-button"
              title={
                newest ? t("Plus récentes d’abord") : t("Ordre chronologique")
              }
              aria-label={
                newest
                  ? t("Afficher en ordre chronologique")
                  : t("Afficher les plus récentes d’abord")
              }
              onClick={() => setNewest(!newest)}
            >
              {newest ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
            </button>
          </div>
          {picked.size > 0 && (
            <div
              className="selection-bar"
              role="region"
              aria-label={t("Sélection")}
            >
              <span className="mono">
                {tn(picked.size, "{n} sélectionnée", "{n} sélectionnées")}
              </span>
              <button
                className="primary"
                onClick={() =>
                  print({ kind: "messages", journal, entries: pickedEntries })
                }
              >
                <FileText size={14} />
                {t("Fiches A4")}
              </button>
              <button onClick={() => setPicked(new Set())}>
                {t("Désélectionner")}
              </button>
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
                          ? t("Désélectionner les entrées affichées")
                          : t("Sélectionner les entrées affichées")
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
                  <th>{t("Heure · N°")}</th>
                  <th>{t("Message")}</th>
                  <th>{t("Émetteur")}</th>
                  <th>{t("Suivi")}</th>
                  <th>
                    <span className="sr-only">{t("Actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.slice(0, limit).map((entry, index) => {
                  const f = current(entry);
                  const newDay =
                    index === 0 ||
                    day(current(visible[index - 1]).happenedAt) !==
                      day(f.happenedAt);
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
                <p>
                  {journal.entries.length
                    ? t("Aucune entrée ne correspond.")
                    : t("Journal vide.")}
                </p>
                {journal.entries.length ? (
                  <button
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                      setDate("");
                    }}
                  >
                    {t("Retirer les filtres")}
                  </button>
                ) : (
                  !readOnly && (
                    <button className="primary" onClick={() => compose()}>
                      <Plus size={14} />
                      {t("Première entrée")}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
          <footer className="panel-foot">
            <span>
              {/* "0 entrées" in French: singular only for exactly one. */}
              {t(visible.length === 1 ? "{n} entrée" : "{n} entrées", {
                n: `${visible.length}${visible.length !== journal.entries.length ? ` / ${journal.entries.length}` : ""}`,
              })}
            </span>
            {journal.deleted.length > 0 && (
              <button className="link" onClick={() => onDialog("deleted")}>
                {tn(journal.deleted.length, "{n} supprimée", "{n} supprimées")}
              </button>
            )}
            <span>Europe/Zurich</span>
          </footer>
          {visible.length > limit && (
            <button className="load-more" onClick={() => setLimit(limit + 100)}>
              {t("Afficher 100 de plus")}
            </button>
          )}
        </section>
        <aside className="panel composer">
          {readOnly ? (
            <div className="closed">
              <LockKeyhole size={18} />
              <strong>{t("Journal clôturé")}</strong>
              <p>{t("Lecture et export uniquement.")}</p>
              <button onClick={() => onDialog("settings")}>
                {t("Rouvrir")}
              </button>
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
                      <Printer size={13} /> {t("Impression automatique")}
                    </>
                  }
                  hint={t("Chaque entrée consignée part à l’imprimante.")}
                  checked={prefs.autoPrint}
                  onChange={(value) => {
                    setPrefs({ autoPrint: value });
                    toast(
                      value
                        ? t("Impression automatique activée sur ce poste.")
                        : t("Impression automatique désactivée."),
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
