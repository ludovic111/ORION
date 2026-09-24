import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CornerDownLeft } from "lucide-react";
import {
  CHANNELS,
  PRIORITIES,
  TYPES,
  dateTime,
  type Fields,
} from "../../../shared/journal";
import type { Message } from "../../../shared/ops";
import { useApp } from "../../app/context";
import { Modal } from "../../journal/Modal";
import {
  ChoiceField,
  ComboField,
  DateTimeField,
  Segmented,
  TextField,
} from "../../ui/fields";
import type { MessageActions } from "./actions";
import { FOLLOW_STATUSES, entryFrom, partyOptions } from "./model";

/** "Inscrire au journal": the message becomes a journal entry, reviewed first. */
export function Synthesis({
  message,
  actions,
  onClose,
}: {
  message: Message;
  actions: MessageActions;
  onClose: () => void;
}) {
  const { journal, lists } = useApp();
  const [fields, setFields] = useState<Fields>(() =>
    entryFrom(message, actions.numbers.get(message.id)),
  );
  const [error, setError] = useState("");
  const set = (patch: Partial<Fields>) => {
    setError("");
    setFields((f) => ({ ...f, ...patch }));
  };
  const recipients = lists("recipients");
  const parties = useMemo(
    () => partyOptions(journal, recipients, "to"),
    [journal, recipients],
  );
  const people = useMemo(
    () => [
      ...journal.ops.members.map((m) => m.name),
      ...journal.ops.cells.map((c) => c.name),
      ...recipients,
    ],
    [journal.ops.members, journal.ops.cells, recipients],
  );
  const follow = fields.status !== "Consigné";

  function confirm() {
    if (!fields.message.trim()) {
      setError("Le texte de l’entrée est obligatoire.");
      return;
    }
    if (
      actions.transcribe(message, {
        ...fields,
        message: fields.message.trim(),
        dueAt: follow ? fields.dueAt : "",
      })
    )
      onClose();
  }

  return (
    <Modal
      title={`Inscrire au journal · ${actions.label(message)}`}
      onClose={onClose}
      wide
    >
      <div
        className="msg-synth"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            confirm();
          }
        }}
      >
        <aside className="msg-synth-source" aria-label="Message reçu">
          <span className="label">Message reçu</span>
          <div className="msg-synth-route">
            <strong>{message.from || "—"}</strong>
            <ArrowRight size={13} />
            <strong>{message.to || "—"}</strong>
          </div>
          <small className="muted">
            {dateTime(message.receivedAt)} · {message.via || "canal inconnu"}
            {message.category && ` · ${message.category}`}
          </small>
          {message.subject && <h4>{message.subject}</h4>}
          {message.body && <p>{message.body}</p>}
          {message.location && <small>Lieu : {message.location}</small>}
          {message.notes && <small>Remarques : {message.notes}</small>}
        </aside>
        <div className="msg-synth-form">
          <div className="form-grid">
            <ChoiceField
              label="Nature"
              value={fields.type}
              onChange={(type) => set({ type })}
              options={TYPES}
            />
            <div className="msg-priority">
              <span className="label">Priorité</span>
              <Segmented
                label="Priorité"
                value={fields.priority}
                onChange={(priority) => set({ priority })}
                options={PRIORITIES.map((p) => ({
                  value: p,
                  label: <span className={`msg-prio-label ${p}`}>{p}</span>,
                }))}
              />
            </div>
            <TextField
              className="span-2"
              label="Texte de l’entrée"
              required
              rows={5}
              value={fields.message}
              onChange={(message) => set({ message })}
              maxLength={12000}
            />
            <ComboField
              label="Émetteur"
              value={fields.source}
              onChange={(source) => set({ source })}
              options={parties}
            />
            <ComboField
              label="Destinataire"
              value={fields.recipient}
              onChange={(recipient) => set({ recipient })}
              options={parties}
            />
            <ChoiceField
              label="Canal"
              value={fields.channel}
              onChange={(channel) => set({ channel })}
              options={CHANNELS}
            />
            <TextField
              label="Lieu"
              value={fields.location}
              onChange={(location) => set({ location })}
            />
            <DateTimeField
              label="Heure de l’événement"
              required
              value={fields.happenedAt}
              onChange={(happenedAt) => set({ happenedAt })}
            />
            <DateTimeField
              label="Heure de réception"
              required
              value={fields.receivedAt}
              onChange={(receivedAt) => set({ receivedAt })}
            />
            <TextField
              className="span-2"
              label="Mesure / décision"
              rows={2}
              value={fields.action}
              onChange={(action) => set({ action })}
              maxLength={12000}
              placeholder="Ce qui est décidé ou entrepris (facultatif)"
            />
            <ChoiceField
              label="Suivi"
              value={fields.status as (typeof FOLLOW_STATUSES)[number]}
              onChange={(status) => set({ status })}
              options={FOLLOW_STATUSES}
            />
            <ComboField
              label="Responsable"
              value={fields.assignee}
              onChange={(assignee) => set({ assignee })}
              options={people}
            />
            {follow && (
              <DateTimeField
                className="span-2"
                label="Échéance"
                value={fields.dueAt}
                onChange={(dueAt) => set({ dueAt })}
              />
            )}
            <TextField
              className="span-2"
              label="Coordonnées"
              value={fields.coordinates}
              onChange={(coordinates) => set({ coordinates })}
              maxLength={150}
            />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="msg-synth-foot">
            <button onClick={onClose}>Annuler</button>
            <button className="primary" onClick={confirm}>
              <BookOpen size={14} />
              Inscrire au journal
              <kbd>
                ⌘<CornerDownLeft size={11} />
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
