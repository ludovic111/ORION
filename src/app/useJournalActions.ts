import { useCallback, useMemo, useRef } from "react";
import {
  addEntry,
  current,
  deleteEntry,
  emptyFields,
  fieldsSchema,
  journalSchema,
  numberLabel,
  reviseEntry,
  updateRadio,
  type Entry,
  type Fields,
  type Journal,
  type Workspace,
} from "../../shared/journal";
import { opsSchema, thinForecasts, upsert, type Ops } from "../../shared/ops";
import { addLink, ref, type Ref } from "../../shared/links";
import type { Radio } from "../../shared/radio";
import { closableBy, snooze } from "../../shared/workflow";
import { ReadOnlyError, writeRefusal } from "./gate";
import { t } from "./i18n.ts";
import type { AppContext, LogCollection } from "./context";

type SetWorkspace = (
  update: (previous: Workspace | null) => Workspace | null,
) => void;

/** Replaces one journal of the workspace, keeping the others as they are. */
const replace = (
  previous: Workspace | null,
  id: string,
  change: (j: Journal) => Journal,
): Workspace | null =>
  previous
    ? {
        ...previous,
        journals: previous.journals.map((j) => (j.id === id ? change(j) : j)),
      }
    : previous;

/**
 * Every write to the journals goes through here, behind one gate: the
 * time machine and a closed journal refuse with a visible message (toast),
 * never silently. Registers (`record`) are written even then.
 */
export function useJournalActions({
  workspace,
  setWorkspace,
  viewAt,
  toast,
  refuse,
}: {
  workspace: Workspace | null;
  setWorkspace: SetWorkspace;
  viewAt: number | null;
  /** Confirmation shown to the operator. */
  toast: (message: string) => void;
  /** Refusal shown to the operator (read only, missing journal…). */
  refuse: (message: string) => void;
}) {
  const live =
    workspace?.journals.find((j) => j.id === workspace.activeId) ?? null;
  // Latest values, read by the stable callbacks below.
  const state = useRef({ workspace, live, viewAt, toast, refuse });
  state.current = { workspace, live, viewAt, toast, refuse };

  /** Why a write is refused now (null: allowed). */
  const refusal = useCallback((allowClosed = false): string | null => {
    const { live: j, viewAt: at } = state.current;
    if (!j) return t("Aucun journal ouvert.");
    return writeRefusal({ closedAt: j.closedAt, viewAt: at }, { allowClosed });
  }, []);
  /** True when writing is allowed; otherwise tells the operator why. */
  const gate = useCallback(
    (allowClosed = false) => {
      const reason = refusal(allowClosed);
      if (reason) state.current.refuse(reason);
      return !reason;
    },
    [refusal],
  );
  /** Like gate, but throws (for callers that show the error themselves). */
  const ensure = useCallback(() => {
    const reason = refusal();
    if (reason) {
      state.current.refuse(reason);
      throw new ReadOnlyError(reason);
    }
  }, [refusal]);

  /** Replace the live journal with a changed version (validated alone). */
  const updateJournal = useCallback(
    (value: Journal, { allowClosed = false } = {}) => {
      if (!gate(allowClosed)) return false;
      const { workspace: ws } = state.current;
      if (!ws?.journals.some((j) => j.id === value.id)) {
        state.current.refuse(t("Ce journal n’est plus dans la session."));
        return false;
      }
      const parsed = journalSchema.parse(value);
      setWorkspace((previous) => replace(previous, parsed.id, () => parsed));
      return true;
    },
    [gate, setWorkspace],
  );

  /**
   * Change the live journal from its latest state. The change is computed
   * once to validate it (an error is thrown before touching the state), and
   * again only if another change came in between.
   */
  const changeJournal = useCallback(
    (change: (j: Journal) => Journal, { allowClosed = false } = {}) => {
      if (!gate(allowClosed)) return null;
      const base = state.current.live!;
      const next = change(base);
      setWorkspace((previous) =>
        replace(previous, base.id, (j) => {
          if (j === base) return next;
          // Another change came in between: apply this one on top of it.
          try {
            return change(j);
          } catch {
            return j;
          }
        }),
      );
      return next;
    },
    [gate, setWorkspace],
  );

  const updateOps = useCallback(
    (change: (ops: Ops) => Ops) => {
      ensure();
      const base = state.current.live!;
      // Validated once: an invalid change is refused with its message.
      const next = opsSchema.parse(change(base.ops));
      setWorkspace((previous) =>
        replace(previous, base.id, (j) => ({
          ...j,
          ops: j.ops === base.ops ? next : opsSchema.parse(change(j.ops)),
        })),
      );
    },
    [ensure, setWorkspace],
  );

  // Registers (exports, presentations, frozen points, forecasts) are written
  // to the live journal, even closed or while the time machine shows the
  // past; `journalId` targets the journal a request was made for.
  const record = useCallback(
    <C extends LogCollection>(
      collection: C,
      value: Parameters<AppContext["record"]>[1],
      journalId?: string,
    ) => {
      const { workspace: ws, live: j } = state.current;
      const targetId = journalId ?? j?.id;
      const target = ws?.journals.find((x) => x.id === targetId);
      // An id given by the caller is kept (e.g. the id printed in a QR code).
      const id = (value as { id?: string }).id ?? crypto.randomUUID();
      if (!target || !ws) return id;
      const author = ws.author;
      const apply = (ops: Ops) => {
        let next = upsert(ops, collection, { ...value, id } as never, author);
        if (collection === "forecasts")
          next = { ...next, forecasts: thinForecasts(next.forecasts) };
        return opsSchema.parse(next);
      };
      // Validated first: an invalid value never reaches the state.
      const next = apply(target.ops);
      setWorkspace((previous) =>
        replace(previous, target.id, (x) => ({
          ...x,
          ops: x.ops === target.ops ? next : apply(x.ops),
        })),
      );
      return id;
    },
    [setWorkspace],
  ) as AppContext["record"];

  /** Record an entry now and link it; returns its id (null if refused). */
  const addEntryFrom = useCallback(
    (partial: Partial<Fields>, links: Ref[] = []) => {
      if (!gate()) return null;
      const { live: base, workspace: ws } = state.current;
      if (!base || !ws) return null;
      const fields = fieldsSchema.parse({ ...emptyFields(), ...partial });
      // Fail early (invalid fields…) before touching the state.
      addEntry(base, fields, ws.author);
      const id = crypto.randomUUID();
      const author = ws.author;
      // Built from the latest state: a change made just before is kept.
      setWorkspace((previous) =>
        replace(previous, base.id, (j) => {
          const updated = addEntry(j, fields, author);
          const entries = updated.entries.map((e, i, all) =>
            i === all.length - 1 ? { ...e, id } : e,
          );
          let ops = updated.ops;
          for (const l of links)
            ops = addLink(ops, ref("entry", id), l, "", author);
          return { ...updated, entries, ops };
        }),
      );
      return id;
    },
    [gate, setWorkspace],
  );

  /** Entry form submitted: returns the new entry and the entries it may close. */
  const consign = useCallback(
    (
      fields: Fields,
    ): { entry: Entry; closable: string[]; journal: Journal } | null => {
      const { live: base, workspace: ws } = state.current;
      if (!base || !ws || !gate()) return null;
      const closable = closableBy(base, fields).map((e) => e.id);
      const updated = changeJournal((j) => addEntry(j, fields, ws.author));
      if (!updated) return null;
      return { entry: updated.entries.at(-1)!, closable, journal: updated };
    },
    [gate, changeJournal],
  );

  const revise = useCallback(
    (id: string, change: Partial<Fields>, reason: string) => {
      const author = state.current.workspace?.author ?? "";
      return !!changeJournal((j) => {
        const entry = j.entries.find((e) => e.id === id);
        if (!entry) throw new Error(t("Entrée introuvable."));
        return reviseEntry(
          j,
          id,
          { ...current(entry), ...change },
          author,
          reason,
        );
      });
    },
    [changeJournal],
  );

  const snoozeEntry = useCallback(
    (id: string, minutes: number) => {
      const entry = state.current.live?.entries.find((e) => e.id === id);
      if (!entry) return;
      if (
        revise(
          id,
          { dueAt: snooze(current(entry).dueAt, minutes) },
          t("Échéance reportée de {n} min", { n: minutes }),
        )
      )
        state.current.toast(
          t("{entry} : échéance reportée de {n} min.", {
            entry: numberLabel(entry),
            n: minutes,
          }),
        );
    },
    [revise],
  );

  const closeEntries = useCallback(
    (ids: string[], reason: string) => {
      const author = state.current.workspace?.author ?? "";
      return !!changeJournal((j) => {
        let value = j;
        for (const id of ids) {
          const entry = value.entries.find((e) => e.id === id);
          if (entry)
            value = reviseEntry(
              value,
              id,
              { ...current(entry), status: "Terminé" },
              author,
              reason,
            );
        }
        return value;
      });
    },
    [changeJournal],
  );

  const removeEntry = useCallback(
    (id: string, reason: string) => {
      const author = state.current.workspace?.author ?? "";
      return !!changeJournal((j) => deleteEntry(j, id, author, reason));
    },
    [changeJournal],
  );

  const saveRadio = useCallback(
    (radio: Radio, log?: Partial<Fields>) => {
      const author = state.current.workspace?.author ?? "";
      const done = changeJournal((j) => {
        const value = updateRadio(j, radio);
        return log
          ? addEntry(
              value,
              {
                ...emptyFields(),
                type: "Observation",
                channel: "Sur place",
                reliability: "Confirmé",
                tags: ["radio"],
                ...log,
              },
              author,
            )
          : value;
      });
      if (done && log)
        state.current.toast(
          t("Consigné au journal : {message}", { message: log.message }),
        );
    },
    [changeJournal],
  );

  /** Close (closedAt set) or reopen ("") the live journal, with a note. */
  const setClosed = useCallback(
    (closedAt: string) => {
      const author = state.current.workspace?.author ?? "";
      return !!changeJournal(
        (j) => {
          const noted = addEntry(
            { ...j, closedAt: "" },
            {
              ...emptyFields(),
              type: "Observation",
              message: closedAt
                ? t("Clôture du journal.")
                : t("Réouverture du journal."),
              reliability: "Confirmé",
            },
            author,
          );
          return { ...noted, closedAt };
        },
        { allowClosed: true },
      );
    },
    [changeJournal],
  );

  return useMemo(
    () => ({
      gate,
      refusal,
      updateJournal,
      changeJournal,
      updateOps,
      record,
      addEntry: addEntryFrom,
      consign,
      revise,
      snoozeEntry,
      closeEntries,
      removeEntry,
      saveRadio,
      setClosed,
    }),
    [
      gate,
      refusal,
      updateJournal,
      changeJournal,
      updateOps,
      record,
      addEntryFrom,
      consign,
      revise,
      snoozeEntry,
      closeEntries,
      removeEntry,
      saveRadio,
      setClosed,
    ],
  );
}

export type JournalActions = ReturnType<typeof useJournalActions>;
