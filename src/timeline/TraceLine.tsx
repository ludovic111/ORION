import { useMemo } from "react";
import { History } from "lucide-react";
import { dateTime } from "../../shared/journal";
import { trailOf } from "../../shared/history";
import { useApp } from "../app/context";
import { ago } from "./format";

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
    ? `Créé par ${first.by || "—"} le ${dateTime(first.at)}`
    : createdAt
      ? `Créé le ${dateTime(createdAt)}${createdBy ? ` par ${createdBy}` : ""}`
      : "";
  const changed =
    last && last !== first
      ? `${last.action === "remove" ? "supprimé" : "modifié"} par ${last.by || "—"} ${ago(last.at, now)}`
      : !first && updatedAt && updatedAt !== createdAt
        ? `modifié le ${dateTime(updatedAt)}`
        : "";
  return (
    <div className="trace-line">
      <History size={13} />
      <span>
        {[created, changed].filter(Boolean).join(" · ")}
        {trail.length > 1 && ` · ${trail.length} versions`}
      </span>
      <button className="link" onClick={() => trace(target)}>
        Historique
      </button>
    </div>
  );
}
