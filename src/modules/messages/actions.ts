import { useMemo } from "react";
import { lastNumber, type Fields } from "../../../shared/journal";
import { upsert, type Message } from "../../../shared/ops";
import { ref } from "../../../shared/links";
import { useApp } from "../../app/context";
import { intakeSheet } from "../../print/sheet";
import {
  entryFrom,
  mLabel,
  messageLabelsOf,
  numbering,
  type Status,
} from "./model";
import { lowerLabel, t } from "./i18n.ts";

/** Every operation on a message, with its toast. */
export function useMessageActions() {
  const { journal, author, updateOps, addEntry, toast, print } = useApp();
  const numbers = useMemo(
    () => numbering(journal.ops.messages),
    [journal.ops.messages],
  );

  function patch(id: string, change: Partial<Message>) {
    try {
      updateOps((ops) => {
        const current = ops.messages.find((m) => m.id === id);
        return current
          ? upsert(ops, "messages", { ...current, ...change }, author)
          : ops;
      });
      return true;
    } catch (err) {
      toast((err as Error).message);
      return false;
    }
  }

  const labels = useMemo(() => messageLabelsOf(journal), [journal]);
  const label = (m: Message) => mLabel(labels.get(m.id) ?? numbers.get(m.id));

  return {
    numbers,
    label,
    patch,
    setStatus(m: Message, status: Status) {
      const change: Partial<Message> = { status };
      if (status === "En traitement" && !m.handledBy) change.handledBy = author;
      if (patch(m.id, change))
        toast(
          t("{label} : {status}.", {
            label: label(m),
            status: lowerLabel(status),
          }),
        );
    },
    take(m: Message) {
      if (patch(m.id, { status: "En traitement", handledBy: author }))
        toast(t("{label} pris en charge.", { label: label(m) }));
    },
    classify(m: Message) {
      if (patch(m.id, { status: "Classé" }))
        toast(t("{label} classé.", { label: label(m) }));
    },
    reopen(m: Message) {
      if (patch(m.id, { status: m.handledBy ? "En traitement" : "Nouveau" }))
        toast(t("{label} rouvert.", { label: label(m) }));
    },
    /** Create the journal entry and mark the message as transmitted. */
    transcribe(m: Message, fields?: Fields) {
      const number = lastNumber(journal) + 1;
      try {
        const id = addEntry(fields ?? entryFrom(m, numbers.get(m.id)), [
          ref("message", m.id),
        ]);
        if (!id) return false;
        patch(m.id, {
          entryId: id,
          status: "Transmis",
          handledBy: m.handledBy || author,
        });
        toast(
          t("Inscrit au journal : #{n}", {
            n: String(number).padStart(3, "0"),
          }),
        );
        return true;
      } catch (err) {
        toast((err as Error).message);
        return false;
      }
    },
    printSheet(list: Message[]) {
      if (!list.length) return;
      print({
        kind: "forms",
        journal,
        sheets: list.map((m) =>
          intakeSheet(m, labels.get(m.id) ?? numbers.get(m.id) ?? 0),
        ),
        title:
          list.length > 1 ? t("Formules de message") : t("Formule de message"),
        name:
          list.length > 1
            ? t("messages (fichier)")
            : t("message-{label}", { label: label(list[0]) }),
      });
    },
  };
}
export type MessageActions = ReturnType<typeof useMessageActions>;
