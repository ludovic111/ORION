import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MoreHorizontal } from "lucide-react";
import type { Module } from "../../shared/links";
import { MODULES, type ModuleInfo } from "../app/modules";
import { Mark } from "./Mark";
import { Sheet } from "./Sheet";
import { t } from "./i18n.ts";

const PHONE = "(max-width: 900px)";
/** Modules kept in the bottom bar of a phone; the others are under « Plus ». */
const PHONE_BAR: Module[] = [
  "situation",
  "journal",
  "messages",
  "missions",
  "map",
];

function usePhone() {
  return useSyncExternalStore(
    (change) => {
      const query = matchMedia(PHONE);
      query.addEventListener("change", change);
      return () => query.removeEventListener("change", change);
    },
    () => matchMedia(PHONE).matches,
    () => false,
  );
}

type Tip = { m: ModuleInfo; top: number; left: number };

/**
 * Vertical dock; icons grow near the pointer. On phones: a bottom bar with
 * the main modules and « Plus » for the others, no tooltips.
 */
export function Dock({
  current,
  hidden,
  badges,
  onGo,
  onLogo,
}: {
  current: Module;
  hidden: string[];
  badges: Partial<Record<Module, { value: number; tone?: "accent" }>>;
  onGo: (m: Module) => void;
  onLogo: () => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const phone = usePhone();
  const [tip, setTip] = useState<Tip | null>(null);
  const [more, setMore] = useState(false);
  const visible = MODULES.filter((m) => m.core || !hidden.includes(m.id));
  const bar = phone ? visible.filter((m) => PHONE_BAR.includes(m.id)) : visible;
  const rest = phone ? visible.filter((m) => !PHONE_BAR.includes(m.id)) : [];
  const restCurrent = rest.some((m) => m.id === current);
  const restBadge = rest.reduce((n, m) => n + (badges[m.id]?.value ?? 0), 0);

  // The tooltip never outlives what it describes.
  useEffect(() => setTip(null), [current, phone]);
  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    window.addEventListener("resize", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      window.removeEventListener("resize", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, [tip]);
  // Kept inside the viewport.
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!tip || !el) return;
    const box = el.getBoundingClientRect();
    const top = Math.max(
      8,
      Math.min(tip.top, window.innerHeight - box.height - 8),
    );
    const left = Math.max(
      8,
      Math.min(tip.left, window.innerWidth - box.width - 8),
    );
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }, [tip]);

  function show(m: ModuleInfo, el: HTMLElement) {
    if (matchMedia(PHONE).matches) return;
    const box = el.getBoundingClientRect();
    setTip({ m, top: box.top + box.height / 2 - 18, left: box.right + 16 });
  }
  function magnify(y: number | null) {
    const items = rail.current?.querySelectorAll<HTMLElement>(".dock-item");
    if (!items || matchMedia(PHONE).matches) return;
    items.forEach((el) => {
      if (y === null) return el.style.setProperty("--s", "1");
      const box = el.getBoundingClientRect();
      const d = Math.abs(y - (box.top + box.height / 2));
      const s = 1 + Math.max(0, 1 - d / 110) * 0.32;
      el.style.setProperty("--s", s.toFixed(3));
    });
  }
  let group = -1;
  return (
    <nav className="dock" aria-label={t("Modules")}>
      <button
        className="dock-logo"
        onClick={onLogo}
        aria-label={t("Situation")}
        title="orion aic"
      >
        <Mark size={34} />
      </button>
      <div
        className="dock-rail"
        ref={rail}
        onMouseMove={(e) => magnify(e.clientY)}
        onMouseLeave={() => {
          magnify(null);
          setTip(null);
        }}
      >
        {bar.map((m) => {
          const sep = !phone && group !== -1 && m.group !== group;
          group = m.group;
          const badge = badges[m.id];
          const Icon = m.icon;
          return (
            <Fragment key={m.id}>
              {sep && <span className="dock-sep" aria-hidden="true" />}
              <button
                className="dock-item"
                aria-current={current === m.id ? "page" : undefined}
                aria-label={m.label}
                onClick={() => {
                  setTip(null);
                  onGo(m.id);
                }}
                onMouseEnter={(e) => show(m, e.currentTarget)}
                onMouseLeave={() => setTip(null)}
                onFocus={(e) => {
                  // Keyboard focus only: after a click, focus stays on the
                  // button and the tooltip would hide the page title.
                  if (e.currentTarget.matches(":focus-visible"))
                    show(m, e.currentTarget);
                }}
                onBlur={() => setTip(null)}
              >
                <Icon size={20} strokeWidth={1.8} />
                {badge && badge.value > 0 && (
                  <span className={`badge ${badge.tone ?? ""}`}>
                    {badge.value > 99 ? "99+" : badge.value}
                  </span>
                )}
              </button>
            </Fragment>
          );
        })}
        {rest.length > 0 && (
          <button
            className="dock-item dock-more"
            aria-current={restCurrent ? "page" : undefined}
            aria-label={t("Plus de modules")}
            aria-haspopup="dialog"
            aria-expanded={more}
            onClick={() => setMore(true)}
          >
            <MoreHorizontal size={20} strokeWidth={1.8} />
            {restBadge > 0 && <span className="badge dot" />}
          </button>
        )}
      </div>
      {tip && !phone && (
        <div
          ref={tipRef}
          className="dock-tip"
          role="tooltip"
          style={{ top: tip.top, left: tip.left }}
        >
          {tip.m.label}
          <small>{tip.m.description}</small>
        </div>
      )}
      {more && (
        <Sheet title={t("Modules")} onClose={() => setMore(false)}>
          <div className="dock-more-grid">
            {rest.map((m) => {
              const Icon = m.icon;
              const badge = badges[m.id];
              return (
                <button
                  key={m.id}
                  className="dock-more-item"
                  aria-current={current === m.id ? "page" : undefined}
                  onClick={() => {
                    setMore(false);
                    onGo(m.id);
                  }}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  <span>{m.short}</span>
                  {badge && badge.value > 0 && (
                    <span className={`badge ${badge.tone ?? ""}`}>
                      {badge.value > 99 ? "99+" : badge.value}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </nav>
  );
}
