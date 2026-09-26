import { useEffect, useLayoutEffect, useRef } from "react";
import { Check, Info } from "lucide-react";

export type ToastMessage = { text: string; id: number; tone?: "info" };

/**
 * Short confirmation or refusal at the bottom of the screen. Shown in the
 * top layer (popover), so it stays readable above an open dialog.
 */
export function Toast({
  message,
  onDone,
}: {
  message: ToastMessage | null;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => done.current(), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  // Re-shown for each message: the last one shown is above the dialogs.
  useLayoutEffect(() => {
    const el = ref.current as
      | (HTMLDivElement & {
          showPopover?: () => void;
          hidePopover?: () => void;
        })
      | null;
    if (!el?.showPopover) return;
    try {
      el.hidePopover?.();
    } catch {
      /* not shown yet */
    }
    try {
      el.showPopover();
    } catch {
      /* popover not supported: shown as a fixed element */
    }
  }, [message?.id]);
  if (!message) return null;
  return (
    <div
      ref={ref}
      className="toast"
      role="status"
      aria-live="polite"
      {...{ popover: "manual" }}
    >
      {message.tone === "info" ? <Info size={14} /> : <Check size={14} />}
      {message.text}
    </div>
  );
}
