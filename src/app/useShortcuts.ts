import { useEffect, useRef } from "react";
import { hasLayer } from "../ui/overlay";

/**
 * Keyboard shortcuts of the shell. ⌘K / Ctrl+K toggles the palette, except
 * above a dialog, the print preview or a presentation: the palette would
 * open behind the dialog, or take the arrow keys of the slides.
 */
export function useShortcuts({
  palette,
  onPalette,
}: {
  palette: boolean;
  onPalette: (open: boolean) => void;
}) {
  const state = useRef({ palette, onPalette });
  state.current = { palette, onPalette };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "k") return;
      if (e.altKey || e.shiftKey) return;
      const { palette: open, onPalette: toggle } = state.current;
      if (open) {
        e.preventDefault();
        toggle(false);
        return;
      }
      if (hasLayer("modal", "present", "preview")) return;
      e.preventDefault();
      toggle(true);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
}
