import { useMemo } from "react";
import { History } from "lucide-react";
import { dateTime } from "../../shared/journal";
import { trailOf } from "../../shared/history";
import { useApp } from "../app/context";
import { ago } from "./format";
import { t } from "./i18n.ts";

/**
 * "Créé par A le … · modifié par B il y a 5 min · 4 versions" and a button
 * to the full history. Falls back to the record's own dates.
 */
export function TraceLine({
  target,
  createdAt,
  createdBy,
  updatedAt,
}: {
  target: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
}) {
  const { live, trace, now } = useApp();
  const trail = useMemo(() => trailOf(live, target), [live, target]);
  const first = trail[trail.length - 1];
  const last = trail[0];
  const created = first
    ? t("Créé par {by} le {date}", {
        by: first.by || "—",
        date: dateTime(first.at),
      })
    : createdAt
      ? createdBy
        ? t("Créé le {date} par {by}", {
            date: dateTime(createdAt),
            by: createdBy,
          })
        : t("Créé le {date}", { date: dateTime(createdAt) })
      : "";
  const changed =
    last && last !== first
      ? t(
          last.action === "remove"
            ? "supprimé par {by} {ago}"
            : "modifié par {by} {ago}",
          { by: last.by || "—", ago: ago(last.at, now) },
        )
      : !first && updatedAt && updatedAt !== createdAt
        ? t("modifié le {date}", { date: dateTime(updatedAt) })
        : "";
  return (
    <div className="trace-line">
      <History size={13} />
      <span>
        {[created, changed].filter(Boolean).join(" · ")}
        {trail.length > 1 && ` · ${t("{n} versions", { n: trail.length })}`}
      </span>
      <button className="link" onClick={() => trace(target)}>
        {t("Historique")}
      </button>
    </div>
  );
}
