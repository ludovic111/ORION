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
import { t } from "./i18n.ts";

const spec = (): FieldSpec[] => [
  { key: "receivedAt", label: t("Reçu le"), kind: "datetime", required: true },
  {
    key: "priority",
    label: t("Priorité"),
    kind: "choice",
    options: MESSAGE_PRIORITIES,
  },
  { key: "from", label: t("De"), kind: "combo", quick: 4 },
  { key: "to", label: t("À"), kind: "combo", quick: 4 },
  { key: "via", label: t("Canal"), kind: "combo", list: "channels" },
  {
    key: "category",
    label: t("Catégorie"),
    kind: "combo",
    list: "categories",
  },
  { key: "subject", label: t("Objet"), kind: "text", wide: true, max: 300 },
  { key: "body", label: t("Message"), kind: "area", rows: 6, max: 12000 },
  { key: "location", label: t("Lieu"), kind: "text", max: 300 },
  { key: "coordinates", label: t("Coordonnées"), kind: "text", max: 150 },
  { key: "replyNeeded", label: t("Réponse attendue"), kind: "toggle" },
  { key: "replyBy", label: t("Échéance de la réponse"), kind: "datetime" },
  { kind: "group", label: t("Traitement") },
  {
    key: "status",
    label: t("État"),
    kind: "choice",
    options: MESSAGE_STATUSES,
  },
  { key: "handledBy", label: t("Traité par"), kind: "combo" },
  { key: "notes", label: t("Remarques"), kind: "area", rows: 2 },
  { key: "tags", label: t("Mots-clés"), kind: "tags" },
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
      noun={t("un message")}
      spec={spec()}
      initial={message}
      onClose={onClose}
      titleOf={(v) =>
        `${actions.label(message)} · ${v.subject || t("Message")}`
      }
      validate={(v) =>
        !v.subject.trim() && !v.body.trim()
          ? t("Écrivez au moins l’objet ou le texte.")
          : ""
      }
      extraOptions={extra}
    >
      {() => (
        <div className="msg-sheet-actions">
          {message.entryId ? (
            <LinkChip
              target={ref("entry", message.entryId)}
              label={t("au journal")}
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
                {t("Inscrire au journal")}
              </button>
            )
          )}
          <button onClick={() => actions.printSheet([message])}>
            <Printer size={14} />
            {t("Fiche A4")}
          </button>
        </div>
      )}
    </RecordSheet>
  );
}
