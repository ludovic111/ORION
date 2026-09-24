import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Clock3, Plus, X } from "lucide-react";

export function localInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export const fromInput = (value: string) =>
  value ? new Date(value).toISOString() : "";

type Base = {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
  required?: boolean;
};

const Label = ({ label, required }: { label: ReactNode; required?: boolean }) => (
  <span>
    {label}
    {required && <span className="required"> *</span>}
  </span>
);

export function TextField({
  label,
  hint,
  className,
  required,
  value,
  onChange,
  placeholder,
  rows,
  type = "text",
  maxLength = 500,
  autoFocus,
}: Base & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  type?: string;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  return (
    <label className={className}>
      <Label label={label} required={required} />
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function NumberField({
  label,
  hint,
  className,
  value,
  onChange,
  min = 0,
  max = 100000,
}: Base & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className={className}>
      <Label label={label} />
      <input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        onChange={(e) =>
          onChange(Math.max(min, Math.min(max, Math.round(Number(e.target.value) || 0))))
        }
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function ChoiceField<T extends string>({
  label,
  hint,
  className,
  value,
  onChange,
  options,
}: Base & {
  value: T;
  onChange: (value: T) => void;
  options: readonly T[] | readonly { value: T; label: string }[];
}) {
  return (
    <label className={className}>
      <Label label={label} />
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
      {hint && <small>{hint}</small>}
    </label>
  );
}

/**
 * Standard values in one click, free text always accepted: the dropdown
 * proposes the référentiel and earlier values; typing anything else is fine.
 */
export function ComboField({
  label,
  hint,
  className,
  required,
  value,
  onChange,
  options,
  placeholder,
  quick = 0,
  maxLength = 200,
}: Base & {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Number of standard values shown as one-click chips. */
  quick?: number;
  maxLength?: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const unique = useMemo(
    () => [...new Map(options.filter(Boolean).map((o) => [o.toLocaleLowerCase("fr"), o])).values()],
    [options],
  );
  const needle = value.trim().toLocaleLowerCase("fr");
  const matches = useMemo(
    () =>
      (needle
        ? unique.filter(
            (o) => o.toLocaleLowerCase("fr").includes(needle) && o.toLocaleLowerCase("fr") !== needle,
          )
        : unique
      ).slice(0, 40),
    [unique, needle],
  );
  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };
  const key = (e: KeyboardEvent) => {
    if (!open && e.key === "ArrowDown") {
      setOpen(true);
      return;
    }
    if (!open || !matches.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
    }
  };
  return (
    <label className={`combo-field ${className ?? ""}`}>
      <Label label={label} required={required} />
      <div className="combo">
        <input
          ref={input}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={key}
        />
        {open && matches.length > 0 && (
          <div className="combo-list" id={listId} role="listbox">
            {matches.map((o, i) => (
              <button
                type="button"
                key={o}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
              >
                {o}
              </button>
            ))}
            <small>Texte libre accepté</small>
          </div>
        )}
      </div>
      {quick > 0 && unique.length > 0 && (
        <div className="quick-values">
          {unique.slice(0, quick).map((o) => (
            <button
              type="button"
              key={o}
              aria-pressed={value === o}
              onClick={(e) => {
                e.preventDefault();
                onChange(value === o ? "" : o);
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function DateTimeField({
  label,
  hint,
  className,
  required,
  value,
  onChange,
}: Base & { value: string; onChange: (value: string) => void }) {
  return (
    <label className={className}>
      <Label label={label} required={required} />
      <div className="inline-field">
        <input
          type="datetime-local"
          value={localInput(value)}
          required={required}
          onChange={(e) => {
            if (e.target.value || !required) onChange(fromInput(e.target.value));
          }}
        />
        <button
          type="button"
          className="icon-button"
          title="Maintenant"
          aria-label="Maintenant"
          onClick={(e) => {
            e.preventDefault();
            onChange(new Date().toISOString());
          }}
        >
          <Clock3 size={15} />
        </button>
        {!required && value && (
          <button
            type="button"
            className="icon-button"
            title="Effacer"
            aria-label="Effacer"
            onClick={(e) => {
              e.preventDefault();
              onChange("");
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <label className={`switch ${className ?? ""}`}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

export function TagsField({
  label,
  value,
  onChange,
  className,
}: Base & { value: string[]; onChange: (value: string[]) => void }) {
  const [tag, setTag] = useState("");
  const add = () => {
    const t = tag.trim();
    if (t && value.length < 20) onChange([...new Set([...value, t])]);
    setTag("");
  };
  return (
    <label className={className}>
      <Label label={label} />
      <div className="inline-field">
        <input
          value={tag}
          maxLength={60}
          placeholder="Entrée pour ajouter"
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="icon-button" aria-label="Ajouter" onClick={add}>
          <Plus size={16} />
        </button>
      </div>
      {value.length > 0 && (
        <div className="tag-list">
          {value.map((t) => (
            <button
              type="button"
              className="tag"
              key={t}
              onClick={() => onChange(value.filter((v) => v !== t))}
            >
              {t}
              <X size={12} />
              <span className="sr-only">Retirer</span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: ReactNode }[];
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
