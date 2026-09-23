import { useRef, useState, type FormEvent } from "react";
import { ChevronRight, CornerDownLeft, Plus, X } from "lucide-react";
import {
  CHANNELS,
  PRIORITIES,
  RELIABILITIES,
  STATUSES,
  TYPES,
  emptyFields,
  fieldsSchema,
  type Fields,
} from "../../shared/journal";
import { TEMPLATES, applyTemplate } from "../../shared/workflow";
export function localInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
const fromInput = (value: string) =>
  value ? new Date(value).toISOString() : "";
export function EntryForm({
  initial,
  preset,
  author,
  onSave,
  onDraft,
  onCancel,
  compact = false,
  draftLabel = "",
  suggestions = [],
}: {
  initial?: Fields;
  preset?: Fields;
  author: string;
  onSave: (fields: Fields, reason: string) => void;
  onDraft?: (fields: Fields) => void;
  onCancel?: () => void;
  compact?: boolean;
  draftLabel?: string;
  suggestions?: string[];
}) {
  const listId = `callsigns-${compact ? "quick" : initial ? "edit" : "full"}`;
  const [fields, setFields] = useState<Fields>(
    () => initial ?? preset ?? emptyFields(),
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [tag, setTag] = useState("");
  const automaticTime = useRef(!initial && !preset);
  const message = useRef<HTMLTextAreaElement>(null);
  const update = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    const next = { ...fields, [key]: value };
    if (automaticTime.current && !["happenedAt", "receivedAt"].includes(key)) {
      const at = new Date().toISOString();
      next.happenedAt = at;
      next.receivedAt = at;
    }
    automaticTime.current = false;
    setFields(next);
    onDraft?.(next);
  };
  const input = (
    key: Exclude<keyof Fields, "tags">,
    label: string,
    placeholder = "",
    maxLength = 500,
  ) => (
    <label>
      {label}
      <input
        value={String(fields[key])}
        maxLength={maxLength}
        placeholder={placeholder}
        list={
          ["recipient", "assignee"].includes(key) && suggestions.length
            ? listId
            : undefined
        }
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );
  const select = (
    key: Exclude<keyof Fields, "tags">,
    label: string,
    values: readonly string[],
  ) => (
    <label>
      {label}
      <select
        value={String(fields[key])}
        onChange={(e) => update(key, e.target.value)}
      >
        {values.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
    </label>
  );
  const textarea = (
    key: Exclude<keyof Fields, "tags">,
    label: string,
    placeholder = "",
    maxLength = 12000,
  ) => (
    <label>
      {label}
      <textarea
        rows={3}
        value={String(fields[key])}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const result = fieldsSchema.safeParse({
      ...fields,
      message: fields.message.trim(),
    });
    if (!result.success) {
      setError("Vérifiez le message et les heures de l’entrée.");
      return;
    }
    try {
      onSave(result.data, reason.trim() || "Modification par l’opérateur");
      if (!initial) {
        const next = emptyFields();
        setFields({ ...next, source: fields.source, channel: fields.channel });
        setTag("");
        automaticTime.current = true;
        message.current?.focus();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <form
      className={`entry-form ${compact ? "compact" : ""}`}
      onSubmit={submit}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.requestSubmit();
        }
      }}
    >
      {compact && (
        <div className="form-head">
          <span className="label">Nouvelle entrée</span>
          {draftLabel && <span className="draft">{draftLabel}</span>}
        </div>
      )}
      {!initial && (
        <div className="templates" role="group" aria-label="Modèles">
          {TEMPLATES.map((template) => (
            <button
              type="button"
              className="chip"
              key={template.id}
              onClick={() => {
                if (
                  fields.message.trim() &&
                  !window.confirm("Remplacer le message en cours ?")
                )
                  return;
                const next = applyTemplate(fields, template);
                setFields(next);
                onDraft?.(next);
                requestAnimationFrame(() => {
                  const area = message.current;
                  if (!area) return;
                  area.focus();
                  const line = area.value.indexOf(": ");
                  const at = line < 0 ? area.value.length : line + 2;
                  area.setSelectionRange(at, at);
                });
              }}
            >
              {template.label}
            </button>
          ))}
        </div>
      )}
      <div className="form-pair">
        {select("type", "Nature", TYPES)}
        {select("priority", "Priorité", PRIORITIES)}
      </div>
      <label>
        <span>
          Message <span className="required">*</span>
        </span>
        <textarea
          ref={message}
          id={compact ? "quick-message" : undefined}
          rows={compact ? 5 : 4}
          required
          maxLength={12000}
          value={fields.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Texte du message"
          autoFocus={!compact}
        />
      </label>
      <div className="form-pair">
        <label>
          Heure de l’événement
          <input
            type="datetime-local"
            required
            value={localInput(fields.happenedAt)}
            onChange={(e) => {
              if (e.target.value)
                update("happenedAt", fromInput(e.target.value));
            }}
          />
        </label>
        <label>
          Émetteur
          <input
            value={fields.source}
            maxLength={500}
            onChange={(e) => update("source", e.target.value)}
            placeholder="Nom d’appel, équipe"
            list={suggestions.length ? listId : undefined}
          />
        </label>
      </div>
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      <details open={!!initial}>
        <summary>
          <ChevronRight size={13} />
          Transmission et lieu
        </summary>
        <div className="details-fields">
          <div className="form-pair">
            {select("channel", "Canal", CHANNELS)}
            {select("reliability", "Confirmation", RELIABILITIES)}
          </div>
          {input("recipient", "Destinataire")}
          {input("location", "Lieu / secteur")}
          {input(
            "coordinates",
            "Coordonnées",
            "MN95 2 499 000 / 1 116 000",
            150,
          )}
          <label>
            Heure de réception
            <input
              type="datetime-local"
              required
              value={localInput(fields.receivedAt)}
              onChange={(e) => {
                if (e.target.value)
                  update("receivedAt", fromInput(e.target.value));
              }}
            />
          </label>
          <small>Heures saisies dans le fuseau de ce poste.</small>
        </div>
      </details>
      <details open={!!initial || fields.status !== "Consigné"}>
        <summary>
          <ChevronRight size={13} />
          Conduite et suivi
        </summary>
        <div className="details-fields">
          {textarea("action", "Mesure / décision / mission")}
          <div className="form-pair">
            {select("status", "Suivi", STATUSES)}
            {input("assignee", "Responsable")}
          </div>
          <label>
            Échéance
            <input
              type="datetime-local"
              value={localInput(fields.dueAt)}
              onChange={(e) => update("dueAt", fromInput(e.target.value))}
            />
          </label>
          {textarea("resources", "Moyens engagés / besoins", "", 4000)}
        </div>
      </details>
      <details open={!!initial || !!fields.reference}>
        <summary>
          <ChevronRight size={13} />
          Compléments
        </summary>
        <div className="details-fields">
          {input(
            "reference",
            "Référence / entrée liée",
            "#012, n° de document",
            1000,
          )}
          {textarea("notes", "Observations")}
          <label>
            Mots-clés
            <div className="inline-field">
              <input
                value={tag}
                maxLength={60}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Entrée pour ajouter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (tag.trim() && fields.tags.length < 20)
                      update("tags", [
                        ...new Set([...fields.tags, tag.trim()]),
                      ]);
                    setTag("");
                  }
                }}
              />
              <button
                type="button"
                className="icon-button"
                aria-label="Ajouter le mot-clé"
                onClick={() => {
                  if (tag.trim() && fields.tags.length < 20)
                    update("tags", [...new Set([...fields.tags, tag.trim()])]);
                  setTag("");
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </label>
          <div className="tag-list">
            {fields.tags.map((t) => (
              <button
                type="button"
                className="tag"
                key={t}
                onClick={() =>
                  update(
                    "tags",
                    fields.tags.filter((v) => v !== t),
                  )
                }
              >
                {t}
                <X size={12} />
                <span className="sr-only">Retirer</span>
              </button>
            ))}
          </div>
        </div>
      </details>
      {initial && (
        <label>
          Motif de la modification
          <input
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Confirmation reçue, erreur de lieu"
          />
        </label>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-foot">
        <span className="by">
          Par <strong>{author}</strong>
        </span>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button className="primary" type="submit">
          {initial ? "Enregistrer la modification" : "Consigner"}
          <kbd>
            ⌘<CornerDownLeft size={11} />
          </kbd>
        </button>
      </div>
    </form>
  );
}
