import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Panel sliding from the right (from the bottom on phones). */
export function Sheet({
  title,
  eyebrow,
  children,
  footer,
  onClose,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        close.current();
      }
    };
    window.addEventListener("keydown", key);
    requestAnimationFrame(() =>
      panel.current
        ?.querySelector<HTMLElement>(
          "input:not([type=checkbox]), textarea, select, button",
        )
        ?.focus({ preventScroll: true }),
    );
    return () => {
      window.removeEventListener("keydown", key);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={() => close.current()} />
      <div
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        ref={panel}
      >
        <header className="sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 id={id}>{title}</h2>
          </div>
          <button
            className="icon-button"
            onClick={() => close.current()}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <footer className="sheet-foot">{footer}</footer>}
      </div>
    </>,
    document.body,
  );
}
