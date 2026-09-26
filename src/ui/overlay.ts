import { useEffect, useRef, type RefObject } from "react";

/**
 * Stack of the overlays open on screen (dialogs, side sheets, ⌘K palette,
 * menus, presentation, print preview). Only the topmost one reacts to
 * Échap; Tab stays inside it; closing it gives the focus back to what had it
 * before. One keyboard listener serves the whole application.
 */
export type LayerKind =
  "modal" | "sheet" | "palette" | "menu" | "present" | "preview";

type Layer = {
  id: number;
  kind: LayerKind;
  element: () => HTMLElement | null;
  escape: () => void;
  trap: boolean;
  restore: HTMLElement | null;
};

const stack: Layer[] = [];
let nextId = 1;
let installed = false;
let lastEscape = 0;
/** Overlay just closed: an overlay it opened gives the focus back further. */
let lastClosed: {
  root: HTMLElement | null;
  restore: HTMLElement | null;
} | null = null;
const listeners = new Set<() => void>();

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function focusables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) =>
      !el.closest("[inert], [hidden]") &&
      (el.offsetWidth > 0 ||
        el.offsetHeight > 0 ||
        el === document.activeElement),
  );
}

function onKey(e: KeyboardEvent) {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (e.key === "Escape") {
    // A field inside (a list of suggestions…) may have used it already.
    if (e.defaultPrevented) return;
    e.preventDefault();
    e.stopPropagation();
    lastEscape = Date.now();
    top.escape();
    return;
  }
  if (e.key !== "Tab" || !top.trap) return;
  const root = top.element();
  if (!root) return;
  const list = focusables(root);
  if (!list.length) {
    e.preventDefault();
    root.focus();
    return;
  }
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const inside = !!active && root.contains(active);
  if (!inside) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  } else if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

function install() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  // Bubbling phase: a field that handles Échap itself (and stops it) wins.
  window.addEventListener("keydown", onKey);
}

const notify = () => listeners.forEach((l) => l());

/** Kind of the topmost overlay, or null. */
export const topLayer = (): LayerKind | null =>
  stack[stack.length - 1]?.kind ?? null;

/** True when an overlay of one of these kinds is open. */
export const hasLayer = (...kinds: LayerKind[]) =>
  stack.some((l) => !kinds.length || kinds.includes(l.kind));

/** Échap was just handled by the stack (a native dialog then ignores its own cancel). */
export const escapedJustNow = () => Date.now() - lastEscape < 200;

/** Called whenever the stack changes. */
export function subscribeLayers(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/**
 * Registers an overlay while mounted. `onEscape` runs when Échap is pressed
 * and this overlay is the topmost one.
 */
export function useLayer(
  ref: RefObject<HTMLElement | null>,
  {
    kind,
    onEscape,
    trap = true,
    autoFocus = true,
  }: {
    kind: LayerKind;
    onEscape: () => void;
    trap?: boolean;
    autoFocus?: boolean | string;
  },
) {
  const escape = useRef(onEscape);
  escape.current = onEscape;
  const id = useRef(0);
  // What had the focus when the overlay opened, read at the first render:
  // by the time effects run, an autoFocus field inside may already have it.
  const before = useRef<Element | null | undefined>(undefined);
  if (before.current === undefined)
    before.current =
      typeof document === "undefined" ? null : document.activeElement;
  useEffect(() => {
    install();
    let previous = before.current;
    // Opened from a menu or the palette that has just closed: the focus
    // goes back to what opened that menu.
    if (
      previous &&
      lastClosed &&
      (!previous.isConnected || lastClosed.root?.contains(previous))
    )
      previous = lastClosed.restore;
    const layer: Layer = {
      id: nextId++,
      kind,
      element: () => ref.current,
      escape: () => escape.current(),
      trap,
      restore:
        previous instanceof HTMLElement &&
        previous !== document.body &&
        !ref.current?.contains(previous)
          ? previous
          : null,
    };
    id.current = layer.id;
    const mounted = ref.current;
    stack.push(layer);
    notify();
    let frame = 0;
    if (autoFocus)
      frame = requestAnimationFrame(() => {
        const root = ref.current;
        const active = document.activeElement;
        // Keep a focus already placed inside, except on the × button that a
        // native dialog focuses first: the first field is more useful.
        if (
          !root ||
          (root.contains(active) &&
            !active?.matches('.icon-button[aria-label="Fermer"]'))
        )
          return;
        const wanted =
          typeof autoFocus === "string"
            ? root.querySelector<HTMLElement>(autoFocus)
            : null;
        const target =
          wanted ??
          root.querySelector<HTMLElement>("[autofocus], [data-autofocus]") ??
          focusables(root).find((el) =>
            el.matches("input:not([type=checkbox]), textarea, select"),
          ) ??
          focusables(root)[0] ??
          root;
        if (target === root && !root.hasAttribute("tabindex"))
          root.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    return () => {
      cancelAnimationFrame(frame);
      lastClosed = { root: ref.current ?? mounted, restore: layer.restore };
      const index = stack.findIndex((l) => l.id === layer.id);
      const wasTop = index === stack.length - 1;
      if (index >= 0) stack.splice(index, 1);
      notify();
      // Give the focus back if it was in the closed overlay (or lost).
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      const root = ref.current ?? mounted;
      if (
        wasTop &&
        layer.restore?.isConnected &&
        (lost || (root && root.contains(active)))
      )
        layer.restore.focus({ preventScroll: true });
      else if (wasTop && layer.restore?.isConnected)
        requestAnimationFrame(() => {
          const now = document.activeElement;
          if (!now || now === document.body)
            layer.restore?.focus({ preventScroll: true });
        });
    };
    // Registered once per mount; the latest onEscape is read from the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { isTop: () => stack[stack.length - 1]?.id === id.current };
}

/** Message shown before closing a form whose changes are not saved. */
export const DISCARD_CHANGES =
  "Des modifications ne sont pas enregistrées. Fermer sans enregistrer ?";

/** Asks before discarding unsaved changes; true when closing is fine. */
export const confirmDiscard = (dirty: boolean | undefined) =>
  !dirty || window.confirm(DISCARD_CHANGES);
