import { useMemo } from "react";
import { History } from "lucide-react";
import { dateTime } from "../../shared/journal";
import {
  restoreState,
  scopeInfo,
  trailOf,
  type AuditItem,
} from "../../shared/history";
import { useApp } from "../app/context";
import { Sheet } from "../ui/Sheet";
import { AuditEmpty, AuditRow } from "./AuditRow";
import { t, tn } from "./i18n.ts";

/** Who changed a record, when, and every version, newest first. */
export function TraceSheet({
  target,
  onClose,
}: {
  target: string;
  onClose: () => void;
}) {
  const { live, author, updateJournal, setViewAt, toast } = useApp();
  const trail = useMemo(() => trailOf(live, target), [live, target]);
  const latest = trail[0];
  const first = trail[trail.length - 1];
  const people = [...new Set(trail.map((i) => i.by).filter(Boolean))];
  const closed = !!live.closedAt;
  function restore(item: AuditItem) {
    if (
      !window.confirm(
        t(
          "Restaurer la version du {date} ? L’état actuel reste dans l’historique.",
          { date: dateTime(item.at) },
        ),
      )
    )
      return;
    try {
      updateJournal(restoreState(live, item, author));
      toast(
        t("Version restaurée. L’historique garde la trace de la restauration."),
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }
  const restorable = (item: AuditItem, index: number) =>
    !closed &&
    item.scope !== "entries" &&
    item.scope !== "meta" &&
    item.action !== "remove" &&
    !!item.state &&
    // The latest state is the current one, unless the record was removed.
    (index > 0 || latest?.action === "remove");
  return (
    <Sheet
      onClose={onClose}
      eyebrow={
        <>
          <History size={12} />
          {t("Historique")} · {scopeInfo(latest?.scope ?? "").label}
        </>
      }
      title={latest?.title ?? t("Historique")}
    >
      {trail.length ? (
        <>
          <div className="trace-summary">
            <div>
              <span className="label">{t("Créé")}</span>
              <strong>{first.by || "—"}</strong>
              <small className="mono">{dateTime(first.at)}</small>
            </div>
            <div>
              <span className="label">{t("Dernier changement")}</span>
              <strong>{latest.by || "—"}</strong>
              <small className="mono">{dateTime(latest.at)}</small>
            </div>
            <div>
              <span className="label">{t("Versions")}</span>
              <strong>{trail.length}</strong>
              <small>
                {tn(people.length, "{n} personne", "{n} personnes")}
              </small>
            </div>
          </div>
          {latest.action === "remove" && (
            <p className="banner warn" role="status">
              {t(
                "Cet élément a été supprimé le {date} par {by}. Ses versions restent consultables et restaurables.",
                { date: dateTime(latest.at), by: latest.by || "—" },
              )}
            </p>
          )}
          <ol className="audit-list">
            {trail.map((item, i) => (
              <AuditRow
                key={item.id}
                item={item}
                showTitle={false}
                onTime={() => {
                  setViewAt(Date.parse(item.at));
                  onClose();
                }}
                onRestore={
                  restorable(item, i) ? () => restore(item) : undefined
                }
              />
            ))}
          </ol>
        </>
      ) : (
        <AuditEmpty
          text={t(
            "Aucun changement enregistré pour cet élément depuis la mise en place de l’historique. Sa création et sa dernière modification restent indiquées sur sa fiche.",
          )}
        />
      )}
    </Sheet>
  );
}
