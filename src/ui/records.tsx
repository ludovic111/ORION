import { useState, type FormEvent, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import {
  removeRecords,
  upsert,
  type Collection,
  type RefKind,
} from "../../shared/ops";
import { KIND_INFO, ref as makeRef } from "../../shared/links";
import { useApp } from "../app/context";
import { Sheet } from "./Sheet";
import { TraceLine } from "../timeline/TraceLine";
import { LinksPanel, KIND_ICON } from "./links";
import {
  ChoiceField,
  ComboField,
  DateTimeField,
  NumberField,
  TagsField,
  TextField,
  Toggle,
} from "./fields";

// Generic editor for every kind of record: a list of fields, a side sheet
// with save / delete and the links of the record.

type Value = Record<string, unknown>;
export type FieldSpec =
  | {
      key: string;
      label: string;
      kind: "text" | "area";
      placeholder?: string;
      hint?: string;
      required?: boolean;
      wide?: boolean;
      max?: number;
      rows?: number;
    }
  | {
      key: string;
      label: string;
      kind: "combo";
      /** Référentiel name (see DEFAULT_LISTS) or explicit values. */
      list?: string;
      options?: string[];
      quick?: number;
      placeholder?: string;
      hint?: string;
      required?: boolean;
      wide?: boolean;
    }
  | {
      key: string;
      label: string;
      kind: "choice";
      options: readonly string[];
      hint?: string;
      wide?: boolean;
    }
  | {
      key: string;
      label: string;
      kind: "datetime" | "number" | "toggle" | "tags";
      hint?: string;
      required?: boolean;
      wide?: boolean;
    }
  | { kind: "group"; label: string }
  | {
      kind: "custom";
      key: string;
      wide?: boolean;
      render: (value: Value, set: (patch: Value) => void) => ReactNode;
    };

export function RecordFields({
  spec,
  value,
  onChange,
  extraOptions,
}: {
  spec: FieldSpec[];
  value: Value;
  onChange: (patch: Value) => void;
  /** Values proposed in combo fields besides the référentiel, by key. */
  extraOptions?: Record<string, string[]>;
}) {
  const { lists } = useApp();
  return (
    <div className="form-grid">
      {spec.map((f, i) => {
        if (f.kind === "group")
          return (
            <div className="field-group label" key={`g${i}`}>
              {f.label}
            </div>
          );
        if (f.kind === "custom")
          return (
            <div key={f.key} className={f.wide ? "span-2" : ""}>
              {f.render(value, onChange)}
            </div>
          );
        const cls =
          f.wide || f.kind === "area" || f.kind === "tags" ? "span-2" : "";
        const set = (v: unknown) => onChange({ [f.key]: v });
        const v = value[f.key];
        switch (f.kind) {
          case "text":
          case "area":
            return (
              <TextField
                key={f.key}
                className={cls}
                label={f.label}
                hint={f.hint}
                required={f.required}
                value={String(v ?? "")}
                onChange={set}
                placeholder={f.placeholder}
                rows={f.kind === "area" ? (f.rows ?? 3) : undefined}
                maxLength={f.max ?? (f.kind === "area" ? 4000 : 200)}
              />
            );
          case "combo":
            return (
              <ComboField
                key={f.key}
                className={cls}
                label={f.label}
                hint={f.hint}
                required={f.required}
                value={String(v ?? "")}
                onChange={set}
                placeholder={f.placeholder}
                quick={f.quick}
                options={[
                  ...(f.options ?? []),
                  ...(f.list ? lists(f.list) : []),
                  ...(extraOptions?.[f.key] ?? []),
                ]}
              />
            );
          case "choice":
            return (
              <ChoiceField
                key={f.key}
                className={cls}
                label={f.label}
                hint={f.hint}
                value={String(v ?? f.options[0])}
                onChange={set}
                options={f.options}
              />
            );
          case "datetime":
            return (
              <DateTimeField
                key={f.key}
                className={cls}
                label={f.label}
                hint={f.hint}
                required={f.required}
                value={String(v ?? "")}
                onChange={set}
              />
            );
          case "number":
            return (
              <NumberField
                key={f.key}
                className={cls}
                label={f.label}
                hint={f.hint}
                value={Number(v ?? 0)}
                onChange={set}
              />
            );
          case "toggle":
            return (
              <div
                key={f.key}
                className={cls}
                style={{ alignSelf: "end", paddingBottom: 6 }}
              >
                <Toggle
                  label={f.label}
                  hint={f.hint}
                  checked={!!v}
                  onChange={set}
                />
              </div>
            );
          case "tags":
            return (
              <TagsField
                key={f.key}
                className={cls}
                label={f.label}
                value={(v as string[]) ?? []}
                onChange={set}
              />
            );
        }
      })}
    </div>
  );
}

/**
 * Side sheet to create or edit a record. `initial` without id creates one.
 * Every field is optional except those marked required.
 */
export function RecordSheet<T extends Value>({
  collection,
  kind,
  noun,
  spec,
  initial,
  onClose,
  titleOf,
  validate,
  children,
  afterSave,
  extraOptions,
  footer,
}: {
  collection: Collection;
  kind: RefKind;
  /** "un moyen", "une personne"… for the title. */
  noun: string;
  spec: FieldSpec[];
  initial: T;
  onClose: () => void;
  titleOf?: (value: T) => string;
  validate?: (value: T) => string;
  children?: (saved: T & { id: string }) => ReactNode;
  afterSave?: (value: T & { id: string }) => void;
  extraOptions?: Record<string, string[]>;
  footer?: ReactNode;
}) {
  const { updateOps, author, readOnly, toast, viewAt } = useApp();
  const [value, setValue] = useState<T>(initial);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const existing = typeof initial.id === "string" ? (initial.id as string) : "";
  const Icon = KIND_ICON[kind];
  function save(e?: FormEvent) {
    e?.preventDefault();
    const problem = validate?.(value);
    if (problem) {
      setError(problem);
      return;
    }
    const id = existing || crypto.randomUUID();
    try {
      updateOps((ops) =>
        upsert(ops, collection, { ...(value as object), id } as never, author),
      );
      afterSave?.({ ...value, id });
      toast(existing ? "Modifications enregistrées." : "Ajouté.");
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const title = titleOf?.(value) || (existing ? "Modifier" : `Ajouter ${noun}`);
  return (
    <Sheet
      onClose={onClose}
      eyebrow={
        <>
          <Icon size={12} />
          {KIND_INFO[kind].label}
        </>
      }
      title={title}
      footer={
        readOnly ? (
          <span className="muted">
            {viewAt !== null
              ? "Version passée : lecture seule."
              : "Journal clôturé : lecture seule."}
          </span>
        ) : confirming ? (
          <>
            <span className="crit-text">Supprimer définitivement ?</span>
            <button className="push" onClick={() => setConfirming(false)}>
              Annuler
            </button>
            <button
              className="danger solid"
              onClick={() => {
                updateOps((ops) => removeRecords(ops, [existing]));
                toast("Supprimé.");
                onClose();
              }}
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </>
        ) : (
          <>
            {existing && (
              <button className="danger" onClick={() => setConfirming(true)}>
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
            {footer}
            <button className="push" onClick={onClose}>
              Annuler
            </button>
            <button className="primary" onClick={() => save()}>
              {existing ? "Enregistrer" : "Ajouter"}
              <kbd>⌘↵</kbd>
            </button>
          </>
        )
      }
    >
      <form
        onSubmit={save}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save(e);
        }}
      >
        <fieldset
          disabled={readOnly}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <RecordFields
            spec={spec}
            value={value}
            onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
            extraOptions={extraOptions}
          />
        </fieldset>
        {error && (
          <p className="error" role="alert" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
        <button type="submit" hidden />
      </form>
      {existing && children?.({ ...value, id: existing })}
      {existing && (
        <div style={{ marginTop: 22 }}>
          <LinksPanel target={makeRef(kind, existing)} />
        </div>
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
