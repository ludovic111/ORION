import { useRef, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ChevronDown,
  Clock3,
  Plus,
  Send,
  X,
} from "lucide-react";
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
}: {
  initial?: Fields;
  preset?: Fields;
  author: string;
  onSave: (fields: Fields, reason: string) => void;
  onDraft?: (fields: Fields) => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
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
    placeholder: string,
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
      onSave(result.data, reason);
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
      {!initial && (
        <div className="composer-heading">
          <span className="icon-square">
            <Plus size={18} />
          </span>
          <div>
            <h2>Consigner une entrée</h2>
            <p>Chaque information compte.</p>
          </div>
        </div>
      )}
      <div className="form-pair">
        {select("type", "Nature", TYPES)}
        {select("priority", "Priorité", PRIORITIES)}
      </div>
      <label>
        Message <span className="required">*</span>
        <textarea
          ref={message}
          id={compact ? "quick-message" : undefined}
          rows={compact ? 5 : 4}
          required
          maxLength={12000}
          value={fields.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Que s’est-il passé ? Décrivez les faits."
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
            placeholder="Indicatif, équipe…"
          />
        </label>
      </div>
      <details open={!!initial}>
        <summary>
          <ChevronDown size={15} />
          Source et localisation<span>Qui · où</span>
        </summary>
        <div className="details-fields">
          <div className="form-pair">
            {select("channel", "Canal", CHANNELS)}
            {select("reliability", "Confirmation", RELIABILITIES)}
          </div>
          {input("recipient", "Destinataire", "Personne ou service informé")}
          {input("location", "Lieu / secteur", "Adresse, bâtiment, zone…")}
          {input(
            "coordinates",
            "Coordonnées et système",
            "Ex. MN95 : E 2 499 000 / N 1 116 000",
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
          <small>
            La saisie est horodatée séparément. Les champs horaires utilisent le
            fuseau de ce poste.
          </small>
        </div>
      </details>
      <details open={!!initial || fields.status !== "Consigné"}>
        <summary>
          <ChevronDown size={15} />
          Décision et suite à donner<span>Action · délai</span>
        </summary>
        <div className="details-fields">
          {textarea(
            "action",
            "Mesure, décision ou mission",
            "Ce qui a été décidé, demandé ou effectué…",
          )}
          {select("status", "Suivi", STATUSES)}
          {input(
            "assignee",
            "Responsable du suivi",
            "Indicatif, fonction ou équipe",
          )}
          <label>
            Échéance
            <input
              type="datetime-local"
              value={localInput(fields.dueAt)}
              onChange={(e) => update("dueAt", fromInput(e.target.value))}
            />
          </label>
          {textarea(
            "resources",
            "Moyens engagés / besoins",
            "Effectifs, matériel, appui demandé…",
            4000,
          )}
        </div>
      </details>
      <details open={!!initial}>
        <summary>
          <ChevronDown size={15} />
          Informations complémentaires<span>Notes · références</span>
        </summary>
        <div className="details-fields">
          {input(
            "reference",
            "Référence / entrée liée",
            "N° de message, document ou entrée #…",
            1000,
          )}
          {textarea(
            "notes",
            "Observations complémentaires",
            "Dangers, conséquences, météo, contraintes, détails utiles…",
          )}
          <label>
            Mots-clés
            <div className="inline-field">
              <input
                value={tag}
                maxLength={60}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ex. évacuation"
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
          Motif de la modification <span className="required">*</span>
          <input
            required
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. confirmation reçue, erreur de lieu…"
          />
          <small>La version précédente reste dans l’historique.</small>
        </label>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="composer-footer">
        <div>
          <ArrowDownLeft size={13} />
          <span>
            Saisie par <strong>{author}</strong>
          </span>
        </div>
        <button className="primary" type="submit">
          <Send size={16} />
          {initial ? "Enregistrer la correction" : "Consigner l’entrée"}
          <kbd>⌘ ↵</kbd>
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Annuler
          </button>
        )}
        <small>
          <Clock3 size={12} /> Horodatage automatique de l’enregistrement
        </small>
      </div>
    </form>
  );
}
