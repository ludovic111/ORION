import { useEffect, useRef } from "react";
import type { Journal } from "../../shared/journal";
import { applyThresholds, latestForecast } from "../../shared/thresholds";
import type { JournalActions } from "./useJournalActions";
import { t } from "./i18n.ts";

/**
 * Background checks of the live journal, in the page only (no server):
 * weather thresholds are evaluated on each new forecast received (here or
 * from another post). The alerts and entries created have ids derived from
 * the threshold and the day, so posts doing the same work merge into one.
 */
export function useConductWatch({
  live,
  viewAt,
  author,
  actions,
  notify,
}: {
  live: Journal | null;
  viewAt: number | null;
  author: string;
  actions: JournalActions;
  notify: (message: string) => void;
}) {
  const forecast = live ? latestForecast(live.ops) : undefined;
  const key = live
    ? `${live.id}|${forecast?.id ?? ""}|${live.ops.thresholds
        .map((t) => `${t.id}:${t.updatedAt}`)
        .join(",")}`
    : "";
  const done = useRef("");
  const latest = useRef({ live, actions, notify, author });
  latest.current = { live, actions, notify, author };
  useEffect(() => {
    const { live: j, actions: a, notify: say, author: by } = latest.current;
    if (!j || !forecast || viewAt !== null || !key || done.current === key)
      return;
    if (!j.ops.thresholds.some((t) => t.active)) return;
    // Silent when writing is not allowed (closed journal).
    if (a.refusal()) return;
    done.current = key;
    const at = Date.now();
    const { created } = applyThresholds(j, forecast, by, at);
    if (!created.length) return;
    try {
      a.changeJournal((x) => applyThresholds(x, forecast, by, at).journal);
      say(
        created.length === 1
          ? t("Seuil météo franchi : {label} ({day}).", {
              label: created[0].threshold.label || t("alerte créée"),
              day: created[0].crossing.day.split("-").reverse().join("."),
            })
          : t("{n} seuils météo franchis : alertes créées dans Météo.", {
              n: created.length,
            }),
      );
    } catch {
      // A later forecast tries again.
      done.current = "";
    }
  }, [key, forecast, viewAt]);
}
