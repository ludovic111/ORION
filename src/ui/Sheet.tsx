import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { confirmDiscard, useLayer } from "./overlay";
import { t } from "./i18n.ts";

/**
 * Panel sliding from the right (from the bottom on phones). Échap closes only
 * the topmost overlay; with `dirty`, closing asks before losing the changes.
 */
export function Sheet({
  title,
  eyebrow,
  children,
  footer,
  onClose,
  dirty = false,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  /** Unsaved changes: Échap, the backdrop and × ask first. */
  dirty?: boolean;
}) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const state = useRef({ onClose, dirty });
  state.current = { onClose, dirty };
  const requestClose = () => {
    if (confirmDiscard(state.current.dirty)) state.current.onClose();
  };
  useLayer(panel, { kind: "sheet", onEscape: requestClose });
  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={requestClose} />
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
            onClick={requestClose}
            aria-label={t("Fermer")}
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
