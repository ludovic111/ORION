import type { ReactNode } from "react";

export type Figure = {
  /** Stable key (defaults to the label). */
  id?: string;
  label: ReactNode;
  value: number | string;
  /** Written after the value, smaller ("/8", "pers."). */
  unit?: ReactNode;
  /** State of the figure: the colour follows the state, never decoration. */
  tone?: "warn" | "crit" | "ok" | "accent" | "";
  /** Tooltip / secondary line. */
  hint?: string;
  /** Makes the figure a button (go to the module, filter…). */
  onClick?: () => void;
  disabled?: boolean;
};

/**
 * A ruled line of figures (DESIGN.md « Ligne de chiffres »): rules above and
 * below, the value in Plex Mono, the label under it, a zero greyed out, a
 * late count in --crit. Replaces the rows of identical statistic cards.
 */
export function Figures({
  items,
  label,
  compact = false,
  className = "",
}: {
  items: Figure[];
  label: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`figures${compact ? " compact" : ""} ${className}`}
      role="list"
      aria-label={label}
    >
      {items.map((f, i) => {
        const zero = f.value === 0 || f.value === "0" || f.value === "—";
        const cls = `figure${f.tone ? ` ${f.tone}` : ""}${zero ? " zero" : ""}`;
        const body = (
          <>
            <strong>
              {f.value}
              {f.unit && <small>{f.unit}</small>}
            </strong>
            <span>{f.label}</span>
          </>
        );
        const key = f.id ?? (typeof f.label === "string" ? f.label : i);
        return (
          <div key={key} role="listitem" className="figure-cell">
            {f.onClick ? (
              <button
                type="button"
                className={cls}
                onClick={f.onClick}
                disabled={f.disabled}
                title={f.hint}
              >
                {body}
              </button>
            ) : (
              <div className={cls} title={f.hint}>
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
