import { useDeferredValue, useMemo } from "react";
import type { Journal } from "../../shared/journal";
import { journalAt } from "../../shared/history";

/**
 * Every instant compared by journalAt: between two of them, the journal of
 * the time machine does not change.
 */
function breakpoints(journal: Journal): number[] {
  const set = new Set<number>();
  const add = (iso: string | undefined) => {
    const t = iso ? Date.parse(iso) : NaN;
    if (Number.isFinite(t)) set.add(t);
  };
  add(journal.createdAt);
  for (const e of journal.history) add(e.at);
  for (const e of journal.entries) {
    add(e.createdAt);
    for (const r of e.revisions) add(r.at);
  }
  for (const d of journal.deleted) add(d.at);
  for (const list of Object.values(journal.ops))
    if (Array.isArray(list))
      for (const item of list as {
        createdAt?: string;
        at?: string;
        fetchedAt?: string;
      }[]) {
        add(item.createdAt ?? item.at);
        add(item.fetchedAt);
      }
  for (const list of Object.values(journal.radio))
    if (Array.isArray(list))
      for (const item of list as { createdAt?: string; at?: string }[])
        add(item.createdAt ?? item.at);
  return [...set].sort((a, b) => a - b);
}

/** Latest breakpoint at or before `at` (or `at` itself before the first). */
function snap(points: number[], at: number) {
  let lo = 0;
  let hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid] <= at) lo = mid + 1;
    else hi = mid;
  }
  return lo ? points[lo - 1] : at;
}

/**
 * The journal shown by the time machine. The rebuild runs only when the
 * moment crosses a change (a replay or a drag between two changes reuses
 * it), and at low priority, so the time bar stays responsive during a fast
 * replay.
 */
export function usePastJournal(
  journal: Journal | undefined,
  viewAt: number | null,
): Journal | undefined {
  const points = useMemo(
    () => (journal && viewAt !== null ? breakpoints(journal) : []),
    // Recomputed when the live journal changes, not at each step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [journal, viewAt === null],
  );
  const deferred = useDeferredValue(viewAt);
  const at = deferred === null ? null : snap(points, deferred);
  return useMemo(
    () => (journal && at !== null ? journalAt(journal, at) : journal),
    [journal, at],
  );
}
