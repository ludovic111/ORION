import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ChecklistStep } from "../../../shared/conduct-schemas";
import { newStepId } from "../../../shared/checklists";
import { useApp } from "../../app/context";
import { Sheet } from "../../ui/Sheet";
import { ComboField, NumberField, TextField, Toggle } from "../../ui/fields";
import { t } from "./i18n.ts";

export type TemplateDraft = {
  name: string;
  event: string;
  description: string;
  steps: ChecklistStep[];
};

/**
 * Editor of the steps of a list: a template of the journal, a built-in
 * list (saved as its changed version) or a list already started.
 */
export function StepsSheet({
  title,
  eyebrow,
  initial,
  onSave,
  onClose,
  describe = true,
  footer,
}: {
  title: string;
  eyebrow: string;
  initial: TemplateDraft;
  onSave: (value: TemplateDraft) => string | void;
  onClose: () => void;
  /** Show the event and description fields (templates). */
  describe?: boolean;
  footer?: React.ReactNode;
}) {
  const { lists, readOnly } = useApp();
  const [value, setValue] = useState<TemplateDraft>(initial);
  const [error, setError] = useState("");
  const dirty = useMemo(
    () => !readOnly && JSON.stringify(value) !== JSON.stringify(initial),
    [value, initial, readOnly],
  );
  const setStep = (i: number, patch: Partial<ChecklistStep>) =>
    setValue((v) => ({
      ...v,
      steps: v.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    }));
  const move = (i: number, d: -1 | 1) =>
    setValue((v) => {
      const steps = [...v.steps];
      const j = i + d;
      if (j < 0 || j >= steps.length) return v;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...v, steps };
    });
  const roles = lists("roles");
  function save() {
    if (!value.name.trim()) {
      setError(t("Donnez un nom à la liste."));
      return;
    }
    const problem = onSave({
      ...value,
      steps: value.steps.filter((s) => s.text.trim()),
    });
    if (problem) setError(problem);
  }
  return (
    <Sheet
      title={title}
      eyebrow={eyebrow}
      onClose={onClose}
      dirty={dirty}
      footer={
        readOnly ? (
          <span className="muted">{t("Lecture seule.")}</span>
        ) : (
          <>
            {footer}
            <button className="push" onClick={onClose}>
              {t("Annuler")}
            </button>
            <button className="primary" onClick={save}>
              {t("Enregistrer")}
            </button>
          </>
        )
      }
    >
      <fieldset
        disabled={readOnly}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <div className="form-grid">
          <TextField
            className="span-2"
            label={t("Nom")}
            required
            value={value.name}
            maxLength={160}
            onChange={(name) => setValue((v) => ({ ...v, name }))}
          />
          {describe && (
            <>
              <ComboField
                className="span-2"
                label={t("Type d’événement")}
                value={value.event}
                options={lists("eventKinds")}
                quick={5}
                maxLength={120}
                onChange={(event) => setValue((v) => ({ ...v, event }))}
              />
              <TextField
                className="span-2"
                label={t("Description")}
                rows={2}
                maxLength={1000}
                value={value.description}
                onChange={(description) =>
                  setValue((v) => ({ ...v, description }))
                }
              />
            </>
          )}
        </div>
        <h3 className="section-label ck-steps-title">
          {t("Étapes")} <span className="pill plain">{value.steps.length}</span>
        </h3>
        <ol className="ck-edit-steps">
          {value.steps.map((s, i) => (
            <li key={s.id} className="ck-edit-step">
              <span className="mono ck-edit-num">{i + 1}</span>
              <div className="ck-edit-fields">
                <TextField
                  label={t("Étape")}
                  rows={2}
                  maxLength={500}
                  value={s.text}
                  onChange={(text) => setStep(i, { text })}
                />
                <div className="ck-edit-row">
                  <ComboField
                    label={t("Fonction responsable")}
                    value={s.role}
                    options={roles}
                    maxLength={120}
                    onChange={(role) => setStep(i, { role })}
                  />
                  <NumberField
                    label={t("Contrôle dans (min, 0 = aucun)")}
                    value={s.minutes}
                    max={1440}
                    onChange={(minutes) => setStep(i, { minutes })}
                  />
                </div>
                <Toggle
                  label={t("Consigner au journal quand elle est cochée")}
                  checked={s.log}
                  onChange={(log) => setStep(i, { log })}
                />
              </div>
              <div className="ck-edit-tools">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("Monter")}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("Descendre")}
                  disabled={i === value.steps.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("Retirer l’étape")}
                  onClick={() =>
                    setValue((v) => ({
                      ...v,
                      steps: v.steps.filter((_, j) => j !== i),
                    }))
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() =>
            setValue((v) => ({
              ...v,
              steps: [
                ...v.steps,
                { id: newStepId(), text: "", role: "", minutes: 0, log: true },
              ],
            }))
          }
          disabled={value.steps.length >= 80}
        >
          <Plus size={14} />
          {t("Ajouter une étape")}
        </button>
      </fieldset>
      {error && (
        <p className="error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
    </Sheet>
  );
}
