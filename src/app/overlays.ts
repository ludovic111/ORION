import { useCallback, useMemo, useState } from "react";
import type { Fields } from "../../shared/journal";
import type { PrintJob } from "../print/PrintPreview";
import type { ExportScope } from "../export/scope";
import type { SettingsTab } from "./Settings";
import type { ExportPreset } from "./context";

export type DialogName =
  | "create"
  | "export"
  | "import"
  | "privacy"
  | "handover"
  | "compose"
  | "deleted"
  | "report"
  | "install"
  | "snapshot";

/** Everything the shell can show above the modules. */
export type Overlay =
  | { kind: "palette" }
  | { kind: "menu"; menu: "journal" | "operator"; anchor: HTMLElement }
  | { kind: "settings"; tab: SettingsTab }
  | { kind: "entry"; id: string; mode: "view" | "edit" | "delete" }
  | { kind: "trace"; target: string }
  | { kind: "print"; job: PrintJob }
  | {
      kind: "present";
      mode: "present" | "wall";
      preset?: Partial<ExportScope>;
    }
  | { kind: "dialog"; name: "export"; preset: ExportPreset }
  | { kind: "dialog"; name: "compose"; preset?: Fields }
  | {
      kind: "dialog";
      name: Exclude<DialogName, "export" | "compose">;
    };

export type OverlayKind = Overlay["kind"];
type Of<K extends OverlayKind> = Extract<Overlay, { kind: K }>;

/** Palette and menus give way to whatever they open. */
const TRANSIENT: OverlayKind[] = ["palette", "menu"];

/**
 * The shell's overlays as one ordered stack instead of a flag each: one
 * overlay per kind, the last opened on top. Opening from the palette or a
 * menu replaces it. Keyboard focus and Échap follow the same order
 * (src/ui/overlay.ts).
 */
export function useOverlays() {
  const [stack, setStack] = useState<Overlay[]>([]);
  const open = useCallback((overlay: Overlay) => {
    setStack((previous) => [
      ...previous.filter(
        (o) => o.kind !== overlay.kind && !TRANSIENT.includes(o.kind),
      ),
      overlay,
    ]);
  }, []);
  const close = useCallback((kind: OverlayKind) => {
    setStack((previous) => previous.filter((o) => o.kind !== kind));
  }, []);
  /** Replace an overlay of the same kind in place (e.g. the settings tab). */
  const update = useCallback((overlay: Overlay) => {
    setStack((previous) =>
      previous.some((o) => o.kind === overlay.kind)
        ? previous.map((o) => (o.kind === overlay.kind ? overlay : o))
        : [...previous, overlay],
    );
  }, []);
  const closeAll = useCallback(() => setStack([]), []);
  const get = useCallback(
    <K extends OverlayKind>(kind: K) =>
      stack.find((o) => o.kind === kind) as Of<K> | undefined,
    [stack],
  );
  return useMemo(
    () => ({
      stack,
      open,
      close,
      update,
      closeAll,
      get,
      top: stack[stack.length - 1] ?? null,
    }),
    [stack, open, close, update, closeAll, get],
  );
}

export type Overlays = ReturnType<typeof useOverlays>;
