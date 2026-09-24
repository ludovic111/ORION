import { useMemo } from "react";
import { BookOpen, Printer } from "lucide-react";
import { ref } from "../../../shared/links";
import {
  MESSAGE_PRIORITIES,
  MESSAGE_STATUSES,
  type Message,
} from "../../../shared/ops";
import { useApp } from "../../app/context";
import { LinkChip } from "../../ui/links";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import type { MessageActions } from "./actions";
import { partyOptions } from "./model";

const SPEC: FieldSpec[] = [
  { key: "receivedAt", label: "Reçu le", kind: "datetime", required: true },
  {
    key: "priority",
    label: "Priorité",
    kind: "choice",
    options: MESSAGE_PRIORITIES,
  },
  { key: "from", label: "De", kind: "combo", quick: 4 },
  { key: "to", label: "À", kind: "combo", quick: 4 },
  { key: "via", label: "Canal", kind: "combo", list: "channels" },
  { key: "category", label: "Catégorie", kind: "combo", list: "categories" },
  { key: "subject", label: "Objet", kind: "text", wide: true, max: 300 },
  { key: "body", label: "Message", kind: "area", rows: 6, max: 12000 },
  { key: "location", label: "Lieu", kind: "text", max: 300 },
  { key: "coordinates", label: "Coordonnées", kind: "text", max: 150 },
  { key: "replyNeeded", label: "Réponse attendue", kind: "toggle" },
  { key: "replyBy", label: "Échéance de la réponse", kind: "datetime" },
  { kind: "group", label: "Traitement" },
  { key: "status", label: "État", kind: "choice", options: MESSAGE_STATUSES },
  { key: "handledBy", label: "Traité par", kind: "combo" },
  { key: "notes", label: "Remarques", kind: "area", rows: 2 },
  { key: "tags", label: "Mots-clés", kind: "tags" },
];

export function MessageSheet({
  message,
  actions,
  onClose,
  onSynth,
}: {
  message: Message;
  actions: MessageActions;
  onClose: () => void;
  onSynth: (m: Message) => void;
}) {
  const { journal, lists, readOnly, author } = useApp();
  const recipients = lists("recipients");
  const extra = useMemo(
    () => ({
      from: partyOptions(journal, recipients, "from"),
      to: partyOptions(journal, recipients, "to"),
      handledBy: [author, ...journal.ops.members.map((m) => m.name)],
    }),
    [journal, recipients, author],
  );
  return (
    <RecordSheet
      collection="messages"
      kind="message"
      noun="un message"
      spec={SPEC}
      initial={message}
      onClose={onClose}
      titleOf={(v) => `${actions.label(message)} · ${v.subject || "Message"}`}
      validate={(v) =>
        !v.subject.trim() && !v.body.trim()
          ? "Écrivez au moins l’objet ou le texte."
          : ""
      }
      extraOptions={extra}
    >
      {() => (
        <div className="msg-sheet-actions">
          {message.entryId ? (
            <LinkChip
              target={ref("entry", message.entryId)}
              label="au journal"
            />
          ) : (
            !readOnly && (
              <button
                onClick={() => {
                  onClose();
                  onSynth(message);
                }}
              >
                <BookOpen size={14} />
                Inscrire au journal
              </button>
            )
          )}
          <button onClick={() => actions.printSheet([message])}>
            <Printer size={14} />
            Fiche A4
          </button>
        </div>
      )}
    </RecordSheet>
  );
}
