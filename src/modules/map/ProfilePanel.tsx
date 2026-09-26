import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mountain } from "lucide-react";
import { formatDistance } from "./geo";
import {
  cachedProfile,
  fetchProfile,
  profileStats,
  type Profile,
} from "./profile";

type LatLng = [number, number];
const W = 320;
const H = 120;
const PAD = { l: 34, r: 6, t: 8, b: 18 };

const m = (n: number) => `${Math.round(n).toLocaleString("fr-CH")} m`;
const pct = (n: number) =>
  `${n.toLocaleString("fr-CH", { maximumFractionDigits: 1 })} %`;

/**
 * Elevation profile of a line (swissALTI3D): chart, lowest and highest
 * points, cumulated climb and descent, slopes. Kept on this post: shown
 * again offline.
 */
export function ProfilePanel({ points }: { points: LatLng[] }) {
  const key = useMemo(() => JSON.stringify(points), [points]);
  const [profile, setProfile] = useState<Profile | null>(() =>
    cachedProfile(points),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    setProfile(cachedProfile(points));
    setError("");
    return () => abort.current?.abort();
  }, [key]);

  async function load() {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError("");
    try {
      setProfile(await fetchProfile(points, controller.signal));
    } catch (err) {
      if ((err as Error).name !== "AbortError")
        setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const stats = profile ? profileStats(profile.points) : null;
  const chart = useMemo(() => {
    if (!profile || !stats) return null;
    const span = Math.max(1, stats.max - stats.min);
    const length = Math.max(1, stats.length);
    const x = (d: number) => PAD.l + (d / length) * (W - PAD.l - PAD.r);
    const y = (a: number) =>
      PAD.t + (1 - (a - stats.min) / span) * (H - PAD.t - PAD.b);
    let line = "";
    profile.points.forEach((p, i) => {
      line += `${i ? "L" : "M"}${x(p.dist).toFixed(1)},${y(p.alt).toFixed(1)}`;
    });
    const area = `${line}L${x(length).toFixed(1)},${H - PAD.b}L${PAD.l},${H - PAD.b}Z`;
    return { line, area };
  }, [profile, stats]);

  return (
    <section className="map-profile" aria-label="Profil altimétrique">
      <header>
        <span className="label">Profil altimétrique</span>
        <button
          type="button"
          className="small"
          disabled={busy}
          onClick={() => void load()}
        >
          {busy ? (
            <Loader2 size={13} className="map-spin" />
          ) : (
            <Mountain size={13} />
          )}
          {profile ? "Recalculer" : "Calculer"}
        </button>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!profile && !error && (
        <p className="muted">
          Altitudes le long de la ligne (swissALTI3D, swisstopo) : dénivelé,
          pentes, point le plus haut.
        </p>
      )}
      {profile && stats && chart && (
        <>
          <svg
            className="map-profile-chart"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Profil : de ${m(stats.min)} à ${m(stats.max)} sur ${formatDistance(stats.length)}`}
          >
            <path className="area" d={chart.area} />
            <path className="line" d={chart.line} />
            <line
              className="axis"
              x1={PAD.l}
              y1={H - PAD.b}
              x2={W - PAD.r}
              y2={H - PAD.b}
            />
            <text x={PAD.l - 4} y={PAD.t + 4} textAnchor="end">
              {Math.round(stats.max)}
            </text>
            <text x={PAD.l - 4} y={H - PAD.b} textAnchor="end">
              {Math.round(stats.min)}
            </text>
            <text x={PAD.l} y={H - 4}>
              0
            </text>
            <text x={W - PAD.r} y={H - 4} textAnchor="end">
              {formatDistance(stats.length)}
            </text>
          </svg>
          <dl>
            <dt>Longueur</dt>
            <dd className="mono">{formatDistance(stats.length)}</dd>
            <dt>Altitude</dt>
            <dd className="mono">
              {m(stats.min)} – {m(stats.max)}
            </dd>
            <dt>Montée</dt>
            <dd className="mono">+{m(stats.climb)}</dd>
            <dt>Descente</dt>
            <dd className="mono">−{m(stats.descent)}</dd>
            <dt>Pente max.</dt>
            <dd className="mono">{pct(stats.maxSlope)}</dd>
            <dt>Pente moyenne</dt>
            <dd className="mono">{pct(stats.meanSlope)}</dd>
          </dl>
          <small className="muted">
            swissALTI3D © swisstopo · calculé le{" "}
            {new Date(profile.at).toLocaleString("fr-CH", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </>
      )}
    </section>
  );
}
