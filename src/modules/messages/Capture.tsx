import { useMemo, useRef, useState, type RefObject } from "react";
import {
  ChevronDown,
  Clock3,
  CornerDownLeft,
  FileText,
  Inbox,
  Printer,
} from "lucide-react";
import { time } from "../../../shared/journal";
import { localNode } from "../../../shared/hlc";
import {
  MESSAGE_PRIORITIES,
  emptyMessage,
  journalLang,
  nowIso,
  upsert,
  type Message,
} from "../../../shared/ops";
import { useApp } from "../../app/context";
import { intakeSheet } from "../../print/sheet";
import { DictationButton, insertDictation } from "../../ui/DictationButton";
import {
  ComboField,
  DateTimeField,
  Segmented,
  TagsField,
  TextField,
  Toggle,
} from "../../ui/fields";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";
import {
  mLabel,
  nextMessageNumber,
  numbering,
  partyOptions,
  skeletons,
  type Draft,
  type Skeleton,
} from "./model";

// receivedAt "" = automatic: stamped when the operator starts typing.
const blank = (keep?: Pick<Draft, "from" | "via">): Draft => ({
  ...emptyMessage(),
  receivedAt: "",
  ...keep,
});

const DELAYS = [
  { label: "+15 min", minutes: 15 },
  { label: "+30 min", minutes: 30 },
  { label: "+1 h", minutes: 60 },
  { label: "+2 h", minutes: 120 },
];

/** Fast intake form: standard values in one click, free text everywhere. */
export function Capture({
  boxRef,
}: {
  boxRef: RefObject<HTMLDivElement | null>;
}) {
  const {
    journal,
    author,
    readOnly,
    canWrite,
    lists,
    updateOps,
    toast,
    prefs,
    setPrefs,
    queuePrint,
  } = useApp();
  const [draft, setDraft] = useState<Draft>(() => blank());
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const body = useRef<HTMLTextAreaElement>(null);
  const templates = skeletons(journalLang(journal.ops));
  const recipients = lists("recipients");
  const fromOptions = useMemo(
    () => partyOptions(journal, recipients, "from"),
    [journal, recipients],
  );
  const toOptions = useMemo(
    () => partyOptions(journal, recipients, "to"),
    [journal, recipients],
  );

  const update = (patch: Partial<Draft>) => {
    setError("");
    setDraft((d) => ({
      ...d,
      ...(d.receivedAt || "receivedAt" in patch
        ? {}
        : { receivedAt: nowIso() }),
      ...patch,
    }));
  };

  function applySkeleton(s: Skeleton) {
    const known = templates.some((k) => k.body === draft.body);
    const text =
      !draft.body.trim() || known
        ? s.body
        : `${draft.body.trimEnd()}\n\n${s.body}`;
    update({
      category: s.category,
      body: text,
      ...(s.priority ? { priority: s.priority } : {}),
      ...(s.replyNeeded ? { replyNeeded: true } : {}),
    });
    requestAnimationFrame(() => {
      const el = body.current;
      if (!el) return;
      const start = text.length - s.body.length;
      const caret = start + s.body.indexOf(": ") + 2;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function save() {
    if (!canWrite()) return;
    if (!draft.subject.trim() && !draft.body.trim()) {
      setError(t("Écrivez au moins l’objet ou le texte du message."));
      body.current?.focus();
      return;
    }
    const at = nowIso();
    const message: Message = {
      ...draft,
      subject: draft.subject.trim(),
      body: draft.body.trim(),
      receivedAt: draft.receivedAt || at,
      replyBy: draft.replyNeeded ? draft.replyBy : "",
      status: "Nouveau",
      id: crypto.randomUUID(),
      createdAt: at,
      updatedAt: at,
      by: author,
      // Given now, printed now, never changed.
      number: nextMessageNumber(journal),
      node: localNode(),
    };
    try {
      updateOps((ops) => upsert(ops, "messages", message, author));
    } catch (err) {
      setError((err as Error).message);
      return;
    }
    const number =
      numbering([...journal.ops.messages, message]).get(message.id) ?? 0;
    toast(
      prefs.autoPrintMessages
        ? t("Message {label} reçu · impression lancée.", {
            label: mLabel(number),
          })
        : t("Message {label} reçu.", { label: mLabel(number) }),
    );
    if (prefs.autoPrintMessages)
      queuePrint({
        kind: "forms",
        journal,
        sheets: [intakeSheet(message, number)],
        title: t("Formule de message"),
        name: t("message (fichier)"),
      });
    setDraft(blank({ from: draft.from, via: draft.via }));
    setMore(false);
    requestAnimationFrame(() =>
      boxRef.current?.querySelector<HTMLInputElement>("input")?.select(),
    );
  }

  const setDelay = (minutes: number) =>
    update({
      replyNeeded: true,
      replyBy: new Date(Date.now() + minutes * 60000).toISOString(),
    });

  return (
    <div className="card msg-capture" ref={boxRef}>
      <div className="card-head">
        <span className="msg-capture-icon" aria-hidden="true">
          <Inbox size={15} />
        </span>
        <h2>{t("Nouveau message")}</h2>
        <span
          className={`pill ${draft.receivedAt ? "accent" : "plain"}`}
          title={t(
            "Heure de réception : fixée au début de la saisie, modifiable dans « Plus de détails »",
          )}
        >
          <Clock3 size={11} />
          {draft.receivedAt
            ? t("Reçu {time}", { time: time(draft.receivedAt) })
            : t("Heure automatique")}
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
      >
        <fieldset disabled={readOnly} className="msg-fieldset">
          <div
            className="msg-skeletons"
            role="group"
            aria-label={t("Modèles de message")}
          >
            <span className="label">{t("Modèle")}</span>
            {templates.map((s) => (
              <button
                type="button"
                key={s.id}
                className="msg-skeleton"
                aria-pressed={
                  draft.category === s.category &&
                  draft.body.startsWith(s.body.split("\n")[0])
                }
                onClick={() => applySkeleton(s)}
              >
                <FileText size={12} />
                {s.label}
              </button>
            ))}
          </div>
          <div className="form-grid">
            <ComboField
              className="span-2"
              label={t("De")}
              value={draft.from}
              onChange={(from) => update({ from })}
              options={fromOptions}
              quick={5}
              placeholder={t("Émetteur, nom d’appel…")}
            />
            <ComboField
              className="span-2"
              label={t("À")}
              value={draft.to}
              onChange={(to) => update({ to })}
              options={toOptions}
              quick={5}
              placeholder={t("Destinataire")}
            />
            <ComboField
              className="span-2"
              label={t("Canal")}
              value={draft.via}
              onChange={(via) => update({ via })}
              options={lists("channels")}
              quick={7}
            />
            <div className="span-2 msg-priority">
              <span className="label">{t("Priorité")}</span>
              <Segmented
                label={t("Priorité")}
                value={draft.priority}
                onChange={(priority) => update({ priority })}
                options={MESSAGE_PRIORITIES.map((p) => ({
                  value: p,
                  label: (
                    <span className={`msg-prio-label ${p}`}>
                      {enumLabel(p)}
                    </span>
                  ),
                }))}
              />
            </div>
            <ComboField
              className="span-2"
              label={t("Catégorie")}
              value={draft.category}
              onChange={(category) => update({ category })}
              options={lists("categories")}
              quick={8}
            />
            <TextField
              className="span-2"
              label={t("Objet")}
              value={draft.subject}
              onChange={(subject) => update({ subject })}
              maxLength={300}
              placeholder={t("En quelques mots")}
            />
            <div className="span-2 dictation-field">
              <label>
                <span>{t("Message")}</span>
                <textarea
                  ref={body}
                  rows={5}
                  value={draft.body}
                  maxLength={12000}
                  placeholder={t("Texte tel que reçu")}
                  onChange={(e) => update({ body: e.target.value })}
                />
              </label>
              <DictationButton
                label={t("Dicter le message")}
                disabled={readOnly}
                onText={(text) =>
                  insertDictation(body.current, text, (value) =>
                    update({ body: value }),
                  )
                }
              />
            </div>
            <TextField
              className="span-2"
              label={t("Lieu")}
              value={draft.location}
              onChange={(location) => update({ location })}
              maxLength={300}
              placeholder={t("Adresse, secteur, lieu-dit")}
            />
            <div className="span-2 msg-reply">
              <Toggle
                label={t("Réponse attendue")}
                checked={draft.replyNeeded}
                onChange={(replyNeeded) => update({ replyNeeded })}
              />
              {draft.replyNeeded && (
                <div className="msg-reply-when reveal">
                  <div
                    className="quick-values"
                    role="group"
                    aria-label={t("Délai de réponse")}
                  >
                    {DELAYS.map((d) => (
                      <button
                        type="button"
                        key={d.minutes}
                        onClick={() => setDelay(d.minutes)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <DateTimeField
                    label={t("Échéance")}
                    value={draft.replyBy}
                    onChange={(replyBy) => update({ replyBy })}
                  />
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="msg-more"
            aria-expanded={more}
            onClick={() => setMore((v) => !v)}
          >
            <ChevronDown size={14} />
            {t("Plus de détails")}
          </button>
          {more && (
            <div className="form-grid reveal">
              <DateTimeField
                className="span-2"
                label={t("Reçu le")}
                hint={t("Vide : heure du début de la saisie.")}
                value={draft.receivedAt}
                onChange={(receivedAt) => update({ receivedAt })}
              />
              <TextField
                className="span-2"
                label={t("Coordonnées")}
                value={draft.coordinates}
                onChange={(coordinates) => update({ coordinates })}
                maxLength={150}
                placeholder={t("ex. 2 600 000 / 1 200 000")}
              />
              <TextField
                className="span-2"
                label={t("Remarques")}
                rows={2}
                value={draft.notes}
                onChange={(notes) => update({ notes })}
                maxLength={4000}
              />
              <TagsField
                className="span-2"
                label={t("Mots-clés")}
                value={draft.tags}
                onChange={(tags) => update({ tags })}
              />
            </div>
          )}
        </fieldset>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="msg-capture-foot">
          <Toggle
            label={
              <>
                <Printer size={13} /> {t("Impression automatique")}
              </>
            }
            checked={prefs.autoPrintMessages}
            onChange={(autoPrintMessages) => setPrefs({ autoPrintMessages })}
          />
          <button
            type="button"
            className="primary"
            disabled={readOnly}
            onClick={save}
          >
            {t("Enregistrer le message")}
            <kbd>
              ⌘<CornerDownLeft size={11} />
            </kbd>
          </button>
        </div>
        {readOnly && (
          <p className="muted msg-readonly">
            {t("Journal clôturé : lecture seule.")}
          </p>
        )}
      </form>
    </div>
  );
}
