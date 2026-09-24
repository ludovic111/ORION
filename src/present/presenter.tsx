import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, MonitorOff, Square } from "lucide-react";
import type { Deck } from "./deck";
import { SlideView } from "./slides";

// Presenter view in a second window (same origin, written by a React
// portal): current and next slide, speaker notes, elapsed time, clock and
// controls. The same React tree drives both windows, so they never drift.

/** A slide drawn at a given width (thumbnails, overview, presenter). */
export function Mini({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const k = width / 1920;
  return (
    <div className="pm-mini" style={{ width, height: (width * 9) / 16 }}>
      <div className="pm-mini-stage" style={{ transform: `scale(${k})` }}>
        {children}
      </div>
    </div>
  );
}

export const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString("fr-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
  });
export const elapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
};

export type PresenterTarget = { win: Window; root: HTMLElement };

/** Opens (or reuses) the presenter window; null when popups are blocked. */
export function usePresenterWindow(onKey: (e: KeyboardEvent) => void) {
  const [target, setTarget] = useState<PresenterTarget | null>(null);
  const keyRef = useRef(onKey);
  keyRef.current = onKey;
  const current = useRef<PresenterTarget | null>(null);

  const open = useCallback(() => {
    if (current.current && !current.current.win.closed) {
      current.current.win.focus();
      return true;
    }
    const win = window.open(
      "",
      "orion-aic-orateur",
      "popup=yes,width=1280,height=800",
    );
    if (!win) return false;
    const doc = win.document;
    doc.head.innerHTML =
      '<meta charset="utf-8"><title>Vue orateur · orion aic</title>';
    doc.body.innerHTML = "";
    for (const node of document.querySelectorAll(
      'link[rel="stylesheet"], style',
    ))
      doc.head.appendChild(doc.importNode(node, true));
    doc.documentElement.lang = "fr-CH";
    doc.documentElement.dataset.theme =
      document.documentElement.dataset.theme ?? "dark";
    doc.documentElement.dataset.motion =
      document.documentElement.dataset.motion ?? "full";
    doc.body.className = "pm-presenter-body";
    const root = doc.createElement("div");
    root.className = "pm-presenter-root";
    doc.body.appendChild(root);
    win.addEventListener("keydown", (e) => keyRef.current(e));
    win.addEventListener("pagehide", () => {
      current.current = null;
      setTarget(null);
    });
    current.current = { win, root };
    setTarget(current.current);
    win.focus();
    return true;
  }, []);

  const close = useCallback(() => {
    current.current?.win.close();
    current.current = null;
    setTarget(null);
  }, []);

  // The main window leaves: the presenter window goes too.
  useEffect(() => () => current.current?.win.close(), []);
  // Closed by the user (pagehide is not always sent for about:blank).
  useEffect(() => {
    if (!target) return;
    const timer = setInterval(() => {
      if (target.win.closed) {
        current.current = null;
        setTarget(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  return { target, open, close };
}

function useWindowSize(win: Window) {
  const [size, setSize] = useState({ w: win.innerWidth, h: win.innerHeight });
  useEffect(() => {
    const resize = () => setSize({ w: win.innerWidth, h: win.innerHeight });
    win.addEventListener("resize", resize);
    return () => win.removeEventListener("resize", resize);
  }, [win]);
  return size;
}

function PresenterView({
  win,
  deck,
  index,
  maps,
  footer,
  look,
  startedAt,
  now,
  black,
  onGo,
  onBlack,
  onEnd,
}: {
  win: Window;
  deck: Deck;
  index: number;
  maps: Record<string, string>;
  footer: string;
  look: "dark" | "light";
  startedAt: number;
  now: number;
  black: boolean;
  onGo: (index: number) => void;
  onBlack: () => void;
  onEnd: () => void;
}) {
  const { w, h } = useWindowSize(win);
  const slide = deck.slides[index];
  const next = deck.slides[index + 1];
  const big = Math.max(320, Math.min(w * 0.6, ((h - 150) * 16) / 9));
  const small = Math.max(220, Math.min(w - big - 72, 560));
  const count = deck.slides.length;
  return (
    <div className="pm-presenter">
      <header>
        <b>{deck.title}</b>
        <span className="pm-presenter-time" title="Temps écoulé">
          {elapsed(now - startedAt)}
        </span>
        <span className="pm-presenter-clock">{clock(now)}</span>
      </header>
      <main>
        <section className="pm-presenter-now">
          <div className={`pm-look-${look}`}>
            <Mini width={big}>
              {slide && (
                <SlideView
                  deck={deck}
                  slide={slide}
                  index={index}
                  count={count}
                  maps={maps}
                  footer={footer}
                  still
                />
              )}
            </Mini>
          </div>
          <nav>
            <button onClick={() => onGo(index - 1)} disabled={index === 0}>
              <ChevronLeft size={18} /> Précédente
            </button>
            <span>
              {index + 1} / {count}
            </span>
            <button
              className="primary"
              onClick={() => onGo(index + 1)}
              disabled={index >= count - 1}
            >
              Suivante <ChevronRight size={18} />
            </button>
            <button onClick={onBlack} aria-pressed={black}>
              <MonitorOff size={16} /> {black ? "Rallumer" : "Écran noir"}
            </button>
            <button className="danger" onClick={onEnd}>
              <Square size={14} /> Terminer
            </button>
          </nav>
        </section>
        <aside>
          <h2>Ensuite</h2>
          {next ? (
            <div className={`pm-look-${look}`}>
              <Mini width={small}>
                <SlideView
                  deck={deck}
                  slide={next}
                  index={index + 1}
                  count={count}
                  maps={maps}
                  footer={footer}
                  still
                />
              </Mini>
            </div>
          ) : (
            <p className="pm-presenter-last">Dernière diapositive.</p>
          )}
          <h2>Notes</h2>
          <div className="pm-presenter-notes">
            {slide?.notes
              ? slide.notes.split("\n").map((line, i) => <p key={i}>{line}</p>)
              : "Pas de notes pour cette diapositive."}
          </div>
        </aside>
      </main>
    </div>
  );
}

export function PresenterPortal(
  props: Omit<Parameters<typeof PresenterView>[0], "win"> & {
    target: PresenterTarget;
  },
) {
  const { target, ...rest } = props;
  return createPortal(
    <PresenterView win={target.win} {...rest} />,
    target.root,
  );
}
