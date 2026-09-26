import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { confirmDiscard, escapedJustNow, useLayer } from "../ui/overlay";

const outside = (el: HTMLElement, x: number, y: number) => {
  const r = el.getBoundingClientRect();
  return x < r.left || x > r.right || y < r.top || y > r.bottom;
};

/**
 * Modal dialog. Closes with Échap (when topmost), × or a click on the
 * backdrop — only when the press and the release both happen outside, so a
 * text selection dragged out of the dialog keeps it open. With `dirty`,
 * closing asks first.
 */
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  dirty = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  /** Unsaved changes: Échap, the backdrop and × ask first. */
  dirty?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const state = useRef({ onClose, dirty });
  state.current = { onClose, dirty };
  const pressedOutside = useRef(false);
  const requestClose = () => {
    if (confirmDiscard(state.current.dirty)) state.current.onClose();
  };
  // Registered before showModal() moves the focus: it is given back on close.
  useLayer(ref, { kind: "modal", onEscape: requestClose });
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      className={wide ? "modal wide" : "modal"}
      onCancel={(e) => {
        // Échap goes through the overlay stack; another close request (the
        // Android back button) closes like ×.
        e.preventDefault();
        if (!escapedJustNow()) requestClose();
      }}
      onMouseDown={(e) => {
        pressedOutside.current =
          e.target === e.currentTarget &&
          outside(e.currentTarget, e.clientX, e.clientY);
      }}
      onClick={(e) => {
        const both =
          pressedOutside.current &&
          e.target === e.currentTarget &&
          outside(e.currentTarget, e.clientX, e.clientY);
        pressedOutside.current = false;
        if (both) requestClose();
      }}
    >
      <header className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={requestClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
