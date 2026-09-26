import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLayer } from "./overlay";

/** Menu anchored to a button; closes on outside click or Escape. */
export function Popover({
  anchor,
  onClose,
  children,
  align = "start",
  className = "menu",
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const m = ref.current.getBoundingClientRect();
    let left = align === "end" ? a.right - m.width : a.left;
    left = Math.max(8, Math.min(left, window.innerWidth - m.width - 8));
    let top = a.bottom + 6;
    if (top + m.height > window.innerHeight - 8)
      top = Math.max(8, a.top - m.height - 6);
    setPos({ top, left });
  }, [anchor, align]);
  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor?.contains(t)) onClose();
    };
    window.addEventListener("pointerdown", down, true);
    return () => window.removeEventListener("pointerdown", down, true);
  }, [anchor, onClose]);
  // Échap closes the menu only, not the panel it was opened from.
  useLayer(ref, { kind: "menu", onEscape: onClose, trap: false });
  return createPortal(
    <div
      ref={ref}
      className={className}
      role="menu"
      style={
        pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }
      }
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-close]")) onClose();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
