// Undo / redo of the map operations of this post. A change is the state of
// each touched record before and after; undoing writes the "before" state
// back as a new change (so every post converges), unless another post
// modified the record meanwhile. Pure: tested in node.

import type { Ops } from "../../../shared/ops.ts";

export type Tracked = "places" | "links";
const TRACKED: Tracked[] = ["places", "links"];
type Row = { id: string; updatedAt?: string; createdAt?: string };
export type ChangeItem = {
  collection: Tracked;
  id: string;
  before: Row | null;
  after: Row | null;
};
export type Change = { at: number; items: ChangeItem[] };

const same = (a: unknown, b: unknown) =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

/** Records of the tracked collections that differ between two versions. */
export function diffOps(before: Ops, after: Ops): ChangeItem[] {
  const items: ChangeItem[] = [];
  for (const collection of TRACKED) {
    const a = before[collection] as Row[];
    const b = after[collection] as Row[];
    if (a === b) continue;
    const old = new Map(a.map((r) => [r.id, r]));
    const seen = new Set<string>();
    for (const r of b) {
      seen.add(r.id);
      const was = old.get(r.id) ?? null;
      if (!was || !same(was, r))
        items.push({ collection, id: r.id, before: was, after: r });
    }
    for (const r of a)
      if (!seen.has(r.id))
        items.push({ collection, id: r.id, before: r, after: null });
  }
  return items;
}

/**
 * Merge a change into the previous one when it touches the same records
 * shortly after (a slider dragged, a symbol turned several times).
 */
export function mergeChange(
  previous: Change | undefined,
  next: Change,
  window = 1500,
): Change | null {
  if (!previous || next.at - previous.at > window) return null;
  const key = (i: ChangeItem) => `${i.collection}:${i.id}`;
  const a = new Set(previous.items.map(key));
  if (a.size !== next.items.length || !next.items.every((i) => a.has(key(i))))
    return null;
  const after = new Map(next.items.map((i) => [key(i), i.after]));
  return {
    at: next.at,
    items: previous.items.map((i) => ({ ...i, after: after.get(key(i))! })),
  };
}

const stateOf = (ops: Ops, collection: Tracked, id: string) =>
  ((ops[collection] as Row[]).find((r) => r.id === id) ?? null) as Row | null;
/** Content of a record, whatever its time stamps and key order. */
const content = (r: Row) => {
  const { updatedAt: _u, createdAt: _c, ...rest } = r;
  return JSON.stringify(rest, Object.keys(rest).sort());
};
/**
 * The record is still in the state this post left it in (its content: the
 * time stamps written by the store may differ by a few milliseconds).
 */
const unchanged = (current: Row | null, expected: Row | null) =>
  current === null || expected === null
    ? current === expected
    : current === expected || content(current) === content(expected);

/**
 * Apply the "before" states (undo) or the "after" states (redo). Records
 * changed by someone else since are left alone and counted as conflicts.
 * Returns the new ops and the change with the states actually written (so
 * that the opposite operation recognises them).
 */
export function applyChange(
  ops: Ops,
  change: Change,
  direction: "undo" | "redo",
  now = new Date().toISOString(),
): { ops: Ops; change: Change; applied: number; conflicts: number } {
  let next = ops;
  let applied = 0;
  let conflicts = 0;
  const items = change.items.map((item) => {
    const target = direction === "undo" ? item.before : item.after;
    const expected = direction === "undo" ? item.after : item.before;
    const current = stateOf(next, item.collection, item.id);
    if (!unchanged(current, expected)) {
      conflicts++;
      return item;
    }
    applied++;
    const list = next[item.collection] as Row[];
    let written: Row | null = null;
    let rows: Row[];
    if (!target) rows = list.filter((r) => r.id !== item.id);
    else {
      written = { ...target, updatedAt: now };
      rows = current
        ? list.map((r) => (r.id === item.id ? written! : r))
        : [...list, written];
    }
    next = { ...next, [item.collection]: rows } as Ops;
    return direction === "undo"
      ? { ...item, before: written }
      : { ...item, after: written };
  });
  return { ops: next, change: { ...change, items }, applied, conflicts };
}
