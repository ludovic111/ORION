import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Expand, X } from "lucide-react";
import { useApp } from "../app/context";
import { useLayer } from "../ui/overlay";
import { burnShift, countdown, wallData } from "./select";
import { t } from "./i18n.ts";
import { useLang } from "../i18n";
import { formatLongDate, formatTime } from "../../shared/i18n/core.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import "./wall.css";

// Wall screen for the command post room: read only, full screen, big type,
// nothing to touch. Map, open points (late first), countdown to the next
// report, key facts, resources engaged and latest entries, always from the
// live journal. Opened from the palette, the operator menu or the address
// #mur (a second browser that joined the session). Keeps the screen awake
// (Wake Lock) and moves by a few pixels every two minutes (burn-in).

const clock = (ms: number, seconds = false) => formatTime(ms, seconds);

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms]);
  return now;
}

/** Keep the screen on while the wall is shown (asked again on return). */
function useWakeLock() {
  useEffect(() => {
    type Lock = { release: () => Promise<void> };
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<Lock> };
    };
    let alive = true;
    let lock: Lock | null = null;
    const release = () => {
      void lock?.release().catch(() => {});
      lock = null;
    };
    const request = () => {
      if (document.visibilityState !== "visible" || !nav.wakeLock) return;
      release();
      nav.wakeLock
        .request("screen")
        .then((l) => {
          if (alive) lock = l;
          else void l.release().catch(() => {});
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", request);
      release();
    };
  }, []);
}

/** Picture of the map, redrawn when the objects change (at most every 30 s). */
function useMapPicture(width: number, height: number) {
  const { live } = useApp();
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const signature = useMemo(
    () =>
      live.ops.places.map((p) => `${p.id}:${p.updatedAt}`).join("|") +
      `#${live.ops.maps.length}`,
    [live.ops.places, live.ops.maps],
  );
  const journal = useRef(live);
  journal.current = live;
  const last = useRef(0);
  useEffect(() => {
    if (!journal.current.ops.places.length || width < 80 || height < 80) {
      setUrl("");
      return;
    }
    let alive = true;
    const wait = Math.max(0, 30_000 - (Date.now() - last.current));
    const timer = setTimeout(async () => {
      try {
        const { renderMap } = await import("../modules/map/render");
        const dark =
          document.documentElement.dataset.theme === "dark"
            ? "night"
            : undefined;
        const image = await renderMap(journal.current, {
          width,
          height,
          scale: Math.min(2, window.devicePixelRatio || 1),
          fit: "objects",
          labels: true,
          ...(dark ? { base: dark } : {}),
        });
        last.current = Date.now();
        if (alive) {
          setUrl(image.dataUrl);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      }
    }, wait);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [signature, width, height]);
  return { url, failed };
}

export function WallScreen({ onClose }: { onClose: () => void }) {
  const { live } = useApp();
  const root = useRef<HTMLDivElement>(null);
  const mapBox = useRef<HTMLDivElement>(null);
  const now = useNow(1000);
  const [idle, setIdle] = useState(true);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useWakeLock();
  useLayer(root, {
    kind: "present",
    onEscape: onClose,
    trap: false,
    autoFocus: false,
  });
  // The data changes every second only for the clock: the rest follows the
  // journal and the minute.
  const minute = Math.floor(now / 30_000);
  const lang = useLang();
  const data = useMemo(
    () => wallData(live, Date.now()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, minute, lang],
  );
  const shift = burnShift(now);
  useEffect(() => {
    const el = mapBox.current;
    if (!el) return;
    const observer = new ResizeObserver(([e]) =>
      setBox({
        width: Math.round(e.contentRect.width),
        height: Math.round(e.contentRect.height),
      }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const map = useMapPicture(box.width, box.height);
  // Controls appear with the pointer, then hide again.
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), 3000);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 3000);
    };
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        fullscreen();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const fullscreen = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void root.current?.requestFullscreen?.().catch(() => {});
    } catch {
      // Not available (iPhone): the screen is already filled.
    }
  };
  const close = () => {
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
    onClose();
  };

  return createPortal(
    <div
      ref={root}
      className={`wall${idle ? " idle" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={t("Écran mural")}
    >
      <div
        className="wall-frame"
        style={{ transform: `translate(${shift.x}px, ${shift.y}px)` }}
      >
        <header className="wall-head">
          <div className="wall-title">
            <span className="wall-live">
              <i aria-hidden="true" />
              {t("En direct")}
            </span>
            <h1>{data.title}</h1>
            <p>
              {[data.exercise ? t("EXERCICE") : "", data.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="wall-clock">
            <strong className="mono">{clock(now, true)}</strong>
            <span>
              {formatLongDate(now, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
        </header>

        <div className="wall-grid">
          <section className="wall-map" aria-label={t("Carte")}>
            <div className="wall-map-box" ref={mapBox}>
              {map.url ? (
                <img src={map.url} alt={t("Carte de situation")} />
              ) : (
                <p className="wall-empty">
                  {live.ops.places.length
                    ? map.failed
                      ? t("Carte indisponible (hors ligne ?)")
                      : t("Carte en préparation…")
                    : t("Aucun objet sur la carte")}
                </p>
              )}
            </div>
          </section>

          <section className="wall-next" aria-label={t("Prochain rapport")}>
            <h2>{t("Prochain rapport")}</h2>
            {data.next ? (
              <>
                <strong className="mono">
                  {countdown(data.next.minutes, data.next.live)}
                </strong>
                <p>
                  {data.next.title} ·{" "}
                  <span className="mono">{clock(data.next.at)}</span>
                </p>
              </>
            ) : (
              <p className="wall-empty">{t("Aucun rendez-vous prévu")}</p>
            )}
            <dl className="wall-figures">
              <div>
                <dt>{t("points ouverts")}</dt>
                <dd className={`mono${data.openCount ? "" : " zero"}`}>
                  {data.openCount}
                </dd>
              </div>
              <div className={data.lateCount ? "crit" : ""}>
                <dt>{t("en retard")}</dt>
                <dd className={`mono${data.lateCount ? "" : " zero"}`}>
                  {data.lateCount}
                </dd>
              </div>
              <div>
                <dt>{t("moyens engagés")}</dt>
                <dd className={`mono${data.engagedCount ? "" : " zero"}`}>
                  {data.engagedCount}
                </dd>
              </div>
              <div>
                <dt>{t("messages non lus")}</dt>
                <dd className={`mono${data.newMessages ? "" : " zero"}`}>
                  {data.newMessages}
                </dd>
              </div>
            </dl>
          </section>

          <section className="wall-open" aria-label={t("Points ouverts")}>
            <h2>{t("Points ouverts")}</h2>
            {data.open.length ? (
              <ol>
                {data.open.map((p) => (
                  <li key={p.id} className={p.late ? "late" : ""}>
                    <span className="mono">{p.label}</span>
                    <span className="wall-text">{p.text}</span>
                    <span className="mono wall-due">
                      {p.due !== null ? clock(p.due) : ""}
                      {p.late ? t(" · retard") : ""}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="wall-empty">{t("Aucun point ouvert")}</p>
            )}
          </section>

          <section className="wall-facts" aria-label={t("Renseignements clés")}>
            <h2>{t("Renseignements clés")}</h2>
            {data.facts.length ? (
              <dl>
                {data.facts.map((f) => (
                  <div key={f.id}>
                    <dt>{f.label}</dt>
                    <dd className="mono">
                      {f.value}
                      {f.unit && <small> {f.unit}</small>}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="wall-empty">—</p>
            )}
            {data.alerts.length > 0 && (
              <ul className="wall-alerts">
                {data.alerts.map((a) => (
                  <li key={a.id}>
                    {t("Alerte {hazard} · degré {level}", {
                      hazard: a.hazard,
                      level: a.level,
                    })}
                    {a.region ? ` · ${a.region}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="wall-resources" aria-label={t("Moyens engagés")}>
            <h2>{t("Moyens engagés")}</h2>
            {data.engaged.length ? (
              <ul>
                {data.engaged.map((r) => (
                  <li key={r.id}>
                    <span className="wall-text">
                      {r.name}
                      {r.count > 1 && (
                        <small className="mono"> ×{r.count}</small>
                      )}
                    </span>
                    <span className="wall-status">{enumLabel(r.status)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="wall-empty">{t("Aucun moyen engagé")}</p>
            )}
          </section>

          <section className="wall-latest" aria-label={t("Dernières entrées")}>
            <h2>{t("Dernières entrées")}</h2>
            {data.latest.length ? (
              <ol>
                {data.latest.map((e) => (
                  <li
                    key={e.id}
                    className={e.priority === "Urgent" ? "urgent" : ""}
                  >
                    <span className="mono">{clock(e.at)}</span>
                    <span className="mono">{e.label}</span>
                    <span className="wall-text">{e.text}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="wall-empty">{t("Journal vide")}</p>
            )}
          </section>
        </div>
      </div>
      <div className="wall-controls">
        <button onClick={fullscreen} title={t("Plein écran (F)")}>
          <Expand size={16} />
          {t("Plein écran")}
        </button>
        <button onClick={close} title={t("Quitter (Échap)")}>
          <X size={16} />
          {t("Quitter")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
