import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Fields, Workspace } from "../../shared/journal";

const PERSIST_AFTER = 1_200;

/**
 * Drafts of the entry form. Typing stays local to the form: the draft is
 * kept here and written into the session (encrypted save, not synchronised)
 * after a pause, instead of updating the whole session on every keystroke.
 */
export function useDrafts({
  workspace,
  setWorkspace,
}: {
  workspace: Workspace | null;
  setWorkspace: (
    update: (previous: Workspace | null) => Workspace | null,
  ) => void;
}) {
  const pending = useRef(new Map<string, Fields | null>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // An entry is being typed (before the first pause, too).
  const [typing, setTyping] = useState(false);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    if (!pending.current.size) return;
    const changes = [...pending.current];
    pending.current.clear();
    setWorkspace((previous) => {
      if (!previous) return previous;
      const drafts = { ...previous.drafts };
      for (const [id, fields] of changes)
        if (fields) drafts[id] = fields;
        else delete drafts[id];
      return { ...previous, drafts };
    });
  }, [setWorkspace]);

  /** Latest draft of a journal (not yet saved ones included). */
  const get = useCallback(
    (journalId: string): Fields | undefined => {
      if (pending.current.has(journalId))
        return pending.current.get(journalId) ?? undefined;
      return workspace?.drafts?.[journalId];
    },
    [workspace],
  );

  const save = useCallback(
    (journalId: string, fields: Fields) => {
      pending.current.set(journalId, fields);
      setTyping(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, PERSIST_AFTER);
    },
    [flush],
  );

  const clear = useCallback(
    (journalId: string) => {
      setTyping(false);
      if (!workspace?.drafts?.[journalId] && !pending.current.has(journalId))
        return;
      pending.current.set(journalId, null);
      flush();
    },
    [flush, workspace],
  );

  // Saved before leaving (lock, close, reload).
  useEffect(() => {
    const leave = () => flush();
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      flush();
    };
  }, [flush]);

  return useMemo(
    () => ({ get, save, clear, flush, typing, setTyping }),
    [get, save, clear, flush, typing],
  );
}
