import { Fragment, useRef, useState } from "react";
import type { Module } from "../../shared/links";
import { MODULES, type ModuleInfo } from "../app/modules";
import { Mark } from "./Mark";

/** Vertical dock; icons grow near the pointer (bottom bar on phones). */
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
  const [tip, setTip] = useState<{ m: ModuleInfo; top: number; left: number } | null>(null);
  const visible = MODULES.filter((m) => m.core || !hidden.includes(m.id));
  function magnify(y: number | null) {
    const items = rail.current?.querySelectorAll<HTMLElement>(".dock-item");
    if (!items || matchMedia("(max-width: 900px)").matches) return;
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
    <nav className="dock" aria-label="Modules">
      <button className="dock-logo" onClick={onLogo} aria-label="Situation" title="orion aic">
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
        {visible.map((m) => {
          const sep = group !== -1 && m.group !== group;
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
                onClick={() => onGo(m.id)}
                onMouseEnter={(e) => {
                  const box = e.currentTarget.getBoundingClientRect();
                  if (!matchMedia("(max-width: 900px)").matches)
                    setTip({ m, top: box.top + box.height / 2 - 18, left: box.right + 16 });
                }}
                onFocus={(e) => {
                  const box = e.currentTarget.getBoundingClientRect();
                  if (!matchMedia("(max-width: 900px)").matches)
                    setTip({ m, top: box.top + box.height / 2 - 18, left: box.right + 16 });
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
      </div>
      {tip && (
        <div className="dock-tip" style={{ top: tip.top, left: tip.left }}>
          {tip.m.label}
          <small>{tip.m.description}</small>
        </div>
      )}
    </nav>
  );
}
