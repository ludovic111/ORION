import { useMemo, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { removeRecords, upsert, type Collection } from "../../shared/ops";
import { useApp } from "../app/context";
import { Sheet } from "./Sheet";
import { RecordFields, type FieldSpec } from "./records";
import { TraceLine } from "../timeline/TraceLine";
import { t } from "./i18n.ts";

type Value = Record<string, unknown>;

/**
 * Side sheet for a setting-like record (weather threshold, reminder): the
 * same fields, save and delete as RecordSheet, without links (such records
 * are rules, not items of the situation).
 */
export function SettingSheet({
  collection,
  eyebrow,
  title,
  spec,
  initial,
  onClose,
  validate,
  children,
}: {
  collection: Collection;
  eyebrow: ReactNode;
  title: string;
  spec: FieldSpec[];
  initial: Value;
  onClose: () => void;
  validate?: (value: Value) => string;
  children?: ReactNode;
}) {
  const { updateOps, author, readOnly, canWrite, toast } = useApp();
  const [value, setValue] = useState<Value>(initial);
  const [error, setError] = useState("");
  const existing = typeof initial.id === "string" ? initial.id : "";
  const dirty = useMemo(
    () => !readOnly && JSON.stringify(value) !== JSON.stringify(initial),
    [value, initial, readOnly],
  );
  function save() {
    if (!canWrite()) return;
    const problem = validate?.(value);
    if (problem) return setError(problem);
    try {
      updateOps((ops) =>
        upsert(
          ops,
          collection,
          { ...value, id: existing || crypto.randomUUID() } as never,
          author,
        ),
      );
      toast(existing ? t("Modifications enregistrées.") : t("Ajouté."));
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <Sheet
      eyebrow={eyebrow}
      title={title}
      dirty={dirty}
      onClose={onClose}
      footer={
        readOnly ? (
          <span className="muted">{t("Lecture seule.")}</span>
        ) : (
          <>
            {existing && (
              <button
                className="danger"
                onClick={() => {
                  if (!canWrite() || !window.confirm(t("Supprimer ?"))) return;
                  updateOps((ops) => removeRecords(ops, [existing]));
                  toast(t("Supprimé."));
                  onClose();
                }}
              >
                <Trash2 size={14} />
                {t("Supprimer")}
              </button>
            )}
            <button className="push" onClick={onClose}>
              {t("Annuler")}
            </button>
            <button className="primary" onClick={save}>
              {existing ? t("Enregistrer") : t("Ajouter")}
            </button>
          </>
        )
      }
    >
      <fieldset
        disabled={readOnly}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <RecordFields
          spec={spec}
          value={value}
          onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
        />
      </fieldset>
      {children}
      {error && (
        <p className="error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      {existing && (
        <TraceLine
          target={existing}
          createdAt={initial.createdAt as string | undefined}
          createdBy={initial.by as string | undefined}
          updatedAt={initial.updatedAt as string | undefined}
        />
      )}
    </Sheet>
  );
}
