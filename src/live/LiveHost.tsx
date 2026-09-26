import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigation, Route, Square } from "lucide-react";
import {
  END,
  GONE_AFTER,
  LIVE_KIND,
  MIN_INTERVAL,
  SEND_EVERY,
  addToTrack,
  ageText,
  cleanLabel,
  decodePosition,
  encodePosition,
  pruneUnits,
  receivePosition,
  shouldSend,
  trackLength,
  trackLine,
  type Fix,
  type Sent,
  type TrailPoint,
  type Units,
} from "../../shared/live";
import { journalLang, upsert } from "../../shared/ops";
import { addLink, ref, type Ref } from "../../shared/links";
import { toZurichInput } from "../../shared/time";
import { useApp } from "../app/context";
import { Modal } from "../journal/Modal";
import { Toggle } from "../ui/fields";
import type { EphemeralHandler, SyncStatus } from "../sync/useSync";
import { liveActions, liveStore, type Sharing } from "./store";
import { formatNumber, rich } from "../i18n";
import { t, tIn } from "./i18n.ts";
import "./live.css";

// Live positions of the teams, on every post of an open session:
// - receives the positions of the other posts (ephemeral messages) and keeps
//   them in memory, with a trail of 30 minutes, until they are 30 min old;
// - on a post that chose to share (consent screen), follows the GPS and
//   sends its position, throttled (shared/live.ts), with an indicator always
//   visible and a one-tap stop;
// - a track recorded on purpose becomes a map line only when asked.

type LiveSync = {
  status: SyncStatus;
  peerId: string;
  sendEphemeral: (kind: string, data: unknown, to?: string) => Promise<boolean>;
  onEphemeral: (kind: string, handler: EphemeralHandler) => () => void;
};
type Kept = {
  track: TrailPoint[];
  label: string;
  ref: string;
};

const km = (m: number) =>
  m < 1000
    ? `${Math.round(m)} m`
    : `${formatNumber(m / 1000, { maximumFractionDigits: 1 })} km`;

function fixOf(p: GeolocationPosition): Fix {
  const now = Date.now();
  const c = p.coords;
  const finite = (v: number | null) =>
    v === null || !Number.isFinite(v) ? null : v;
  return {
    lat: c.latitude,
    lng: c.longitude,
    acc: Number.isFinite(c.accuracy) ? c.accuracy : 0,
    // A heading means nothing while standing still.
    hdg: c.speed && c.speed > 0.5 ? finite(c.heading) : null,
    spd: finite(c.speed),
    // Some devices stamp fixes with another clock: then, now.
    t:
      Number.isFinite(p.timestamp) && Math.abs(now - p.timestamp) < 60_000
        ? Math.min(now, p.timestamp)
        : now,
  };
}

export function LiveHost({ sync }: { sync: LiveSync }) {
  const app = useApp();
  const { toast } = app;
  const [units, setUnits] = useState<Units>(() => new Map());
  const [now, setNow] = useState(() => Date.now());
  const [sharing, setSharingState] = useState<Sharing | null>(null);
  const [dialog, setDialog] = useState<"share" | "save" | null>(null);
  const [kept, setKept] = useState<Kept | null>(null);
  const connected = sync.status === "live";

  const syncRef = useRef(sync);
  syncRef.current = sync;
  const self = useRef({ peer: sync.peerId, name: app.author });
  self.current = { peer: sync.peerId, name: app.author };
  const sharingRef = useRef<Sharing | null>(null);
  const setSharing = useCallback(
    (update: (previous: Sharing | null) => Sharing | null) => {
      const next = update(sharingRef.current);
      sharingRef.current = next;
      setSharingState(next);
    },
    [],
  );
  const watchId = useRef<number | null>(null);
  const lastSent = useRef<Sent>(null);
  const lastFix = useRef<Fix | null>(null);
  const wake = useRef<WakeLockSentinel | null>(null);

  /* ---------- Receiving ---------- */
  const { onEphemeral } = sync;
  useEffect(
    () =>
      onEphemeral(LIVE_KIND, (data, from) => {
        const at = Date.now();
        const pos = decodePosition(data, at);
        if (!pos || from.peer === self.current.peer) return;
        setUnits((u) => receivePosition(u, from, pos, at));
      }),
    [onEphemeral],
  );
  // Ages move and old teams leave, only while something is shown.
  const active = units.size > 0 || !!sharing;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      const at = Date.now();
      setNow(at);
      setUnits((u) => pruneUnits(u, at));
    }, MIN_INTERVAL);
    return () => clearInterval(timer);
  }, [active]);

  /* ---------- Sharing ---------- */
  const send = useCallback(
    async (fix: Fix) => {
      const s = sharingRef.current;
      if (!s) return;
      const at = Date.now();
      lastSent.current = { lat: fix.lat, lng: fix.lng, at };
      let delivered = false;
      try {
        delivered = await syncRef.current.sendEphemeral(
          LIVE_KIND,
          encodePosition({ ...fix, label: s.label, ref: s.ref }, at),
        );
      } catch {
        delivered = false;
      }
      setSharing((p) => p && { ...p, sentAt: at, delivered });
    },
    [setSharing],
  );

  const requestWake = useCallback(async () => {
    try {
      if (!navigator.wakeLock || (wake.current && !wake.current.released))
        return;
      wake.current = await navigator.wakeLock.request("screen");
    } catch {
      // Refused (battery saver…): the screen may turn off.
    }
  }, []);
  const releaseWake = useCallback(() => {
    void wake.current?.release().catch(() => {});
    wake.current = null;
  }, []);

  /** Stop at once; returns what was shared. */
  const halt = useCallback(() => {
    if (watchId.current !== null)
      navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
    releaseWake();
    const was = sharingRef.current;
    lastSent.current = null;
    lastFix.current = null;
    if (was) {
      setSharing(() => null);
      void syncRef.current.sendEphemeral(LIVE_KIND, END).catch(() => {});
      setUnits((u) => receivePosition(u, self.current, "end", Date.now()));
    }
    return was;
  }, [releaseWake, setSharing]);

  const stop = useCallback(() => {
    const was = halt();
    if (!was) return;
    if (was.recording && was.track.length >= 2) {
      setKept({ track: was.track, label: was.label, ref: was.ref });
      setDialog("save");
    } else {
      setDialog(null);
      toast(t("Partage de position arrêté."));
    }
  }, [halt, toast]);

  const start = useCallback(
    (options: {
      label: string;
      ref: string;
      wake: boolean;
      record: boolean;
    }) => {
      if (!navigator.geolocation) {
        toast(t("Localisation indisponible sur cet appareil."));
        return;
      }
      halt();
      setSharing(() => ({
        label: cleanLabel(options.label) || self.current.name,
        ref: options.ref,
        since: Date.now(),
        wake: options.wake,
        recording: options.record,
        fix: null,
        sentAt: null,
        delivered: false,
        error: "",
        track: [],
      }));
      if (options.wake) void requestWake();
      watchId.current = navigator.geolocation.watchPosition(
        (p) => {
          const s = sharingRef.current;
          if (!s) return;
          const fix = fixOf(p);
          lastFix.current = fix;
          setSharing(
            (prev) =>
              prev && {
                ...prev,
                fix,
                error: "",
                track: prev.recording
                  ? addToTrack(prev.track, fix)
                  : prev.track,
              },
          );
          setUnits((u) =>
            receivePosition(
              u,
              { ...self.current, self: true },
              { ...fix, label: s.label, ref: s.ref },
              Date.now(),
            ),
          );
          if (shouldSend(lastSent.current, fix, Date.now())) void send(fix);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            halt();
            setDialog(null);
            toast(
              t(
                "Localisation refusée : autorisez-la pour ce site dans le navigateur, puis recommencez.",
              ),
            );
            return;
          }
          setSharing(
            (prev) =>
              prev && {
                ...prev,
                error:
                  err.code === err.TIMEOUT
                    ? t("Pas de signal GPS pour le moment.")
                    : t("Position indisponible pour le moment."),
              },
          );
        },
        { enableHighAccuracy: true, maximumAge: 5_000, timeout: 60_000 },
      );
      setDialog(null);
    },
    [halt, requestWake, send, setSharing, toast],
  );

  // Heartbeat: a team standing still stays on the map of the others.
  const sharingOn = !!sharing;
  useEffect(() => {
    if (!sharingOn) return;
    const timer = setInterval(() => {
      const fix = lastFix.current;
      const last = lastSent.current;
      const at = Date.now();
      if (
        fix &&
        at - fix.t < GONE_AFTER &&
        (!last || at - last.at >= SEND_EVERY)
      )
        void send(fix);
    }, MIN_INTERVAL);
    return () => clearInterval(timer);
  }, [sharingOn, send]);
  // Back online: the others see this team again at once.
  useEffect(() => {
    if (connected && lastFix.current && sharingRef.current)
      void send(lastFix.current);
  }, [connected, send]);
  // The screen lock is released when the page is hidden: take it again.
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === "visible" && sharingRef.current?.wake)
        void requestWake();
    };
    // Closing the tab stops the sharing: tell the others if there is time.
    const leave = () => {
      if (sharingRef.current)
        void syncRef.current.sendEphemeral(LIVE_KIND, END).catch(() => {});
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pagehide", leave);
    };
  }, [requestWake]);
  // Session closed: everything stops.
  useEffect(() => () => void halt(), [halt]);

  /* ---------- Shared with the map ---------- */
  const list = useMemo(
    () =>
      [...units.values()].sort(
        (a, b) =>
          Number(!!b.self) - Number(!!a.self) ||
          a.label.localeCompare(b.label, "fr"),
      ),
    [units],
  );
  useEffect(() => {
    liveStore.set({ units: list, now, sharing, connected });
  }, [list, now, sharing, connected]);
  useEffect(() => {
    liveActions.openShare = () => setDialog("share");
    liveActions.stop = stop;
    return () => {
      liveActions.openShare = () => {};
      liveActions.stop = () => {};
      liveStore.set({ units: [], sharing: null, connected: false });
    };
  }, [stop]);

  /* ---------- Saving the track (on purpose) ---------- */
  function saveTrack(k: Kept) {
    if (!app.canWrite()) return;
    const id = crypto.randomUUID();
    const from = toZurichInput(k.track[0][2], "time");
    const to = toZurichInput(k.track[k.track.length - 1][2], "time");
    // Layer of the resources, as named in the référentiel of the journal.
    const layer = tIn(journalLang(app.live.ops), "Moyens");
    try {
      app.updateOps((ops) => {
        let next = upsert(
          ops,
          "places",
          {
            id,
            label: t("Trace {label} {from}–{to}", {
              label: k.label,
              from,
              to,
            }).slice(0, 200),
            kind: "line",
            symbol: "",
            color: "",
            layer,
            points: trackLine(k.track),
            notes: t(
              "Trace GPS enregistrée par {author} : {distance}, de {from} à {to}.",
              {
                author: app.author,
                distance: km(trackLength(k.track)),
                from,
                to,
              },
            ),
            maps: [],
          },
          app.author,
        );
        if (k.ref)
          next = addLink(
            next,
            ref("place", id),
            k.ref as Ref,
            "trace",
            app.author,
          );
        return next;
      });
    } catch (err) {
      toast((err as Error).message);
      return;
    }
    setKept(null);
    setDialog(null);
    toast(t("Trace enregistrée sur la carte, calque {layer}.", { layer }));
  }

  return (
    <>
      {sharing && (
        <ShareIndicator
          sharing={sharing}
          now={now}
          connected={connected}
          onOpen={() => setDialog("share")}
          onStop={stop}
        />
      )}
      {dialog === "share" &&
        (sharing ? (
          <SharingDialog
            sharing={sharing}
            now={now}
            connected={connected}
            onRecord={(on) =>
              setSharing(
                (p) =>
                  p && {
                    ...p,
                    recording: on,
                    // Turned off: the path kept so far is dropped.
                    track: !on
                      ? []
                      : p.fix
                        ? addToTrack(p.track, p.fix)
                        : p.track,
                  },
              )
            }
            onStop={stop}
            onClose={() => setDialog(null)}
          />
        ) : (
          <ConsentDialog
            connected={connected}
            onStart={start}
            onClose={() => setDialog(null)}
          />
        ))}
      {dialog === "save" && kept && (
        <Modal
          title={t("Enregistrer la trace ?")}
          onClose={() => setDialog(null)}
        >
          <div className="stack">
            <p className="modal-intro">
              {t(
                "La trace de « {label} » est gardée en mémoire sur ce poste seulement : {n} points, {distance}, de {from} à {to}. Enregistrée, elle devient une ligne de la carte (calque {layer}), visible de tous les postes et gardée dans l’historique.",
                {
                  label: kept.label,
                  n: kept.track.length,
                  distance: km(trackLength(kept.track)),
                  from: toZurichInput(kept.track[0][2], "time"),
                  to: toZurichInput(
                    kept.track[kept.track.length - 1][2],
                    "time",
                  ),
                  layer: tIn(journalLang(app.live.ops), "Moyens"),
                },
              )}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="push-left"
                onClick={() => {
                  setKept(null);
                  setDialog(null);
                  toast(t("Trace abandonnée : rien n’a été enregistré."));
                }}
              >
                {t("Abandonner la trace")}
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => saveTrack(kept)}
              >
                <Route size={14} />
                {t("Enregistrer sur la carte")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function ShareIndicator({
  sharing,
  now,
  connected,
  onOpen,
  onStop,
}: {
  sharing: Sharing;
  now: number;
  connected: boolean;
  onOpen: () => void;
  onStop: () => void;
}) {
  const state = sharing.error
    ? sharing.error
    : !sharing.fix
      ? t("en attente du GPS")
      : !connected
        ? t("hors ligne : personne ne la reçoit")
        : sharing.sentAt
          ? t("envoyée {age}", { age: ageText(now - sharing.sentAt) })
          : t("envoi…");
  return (
    <div className="live-share" role="status" aria-live="polite">
      <button
        type="button"
        className="live-share-main"
        onClick={onOpen}
        title={t("Détails du partage de position")}
      >
        <span
          className={`radar${sharing.fix && connected && !sharing.error ? "" : " idle"}`}
          aria-hidden="true"
        />
        <span className="live-share-text">
          <strong>
            {t("Position partagée · {label}", { label: sharing.label })}
          </strong>
          <small>
            {state}
            {sharing.recording &&
              ` · ${t("trace {distance}", { distance: km(trackLength(sharing.track)) })}`}
          </small>
        </span>
      </button>
      <button
        type="button"
        className="small danger live-share-stop"
        onClick={onStop}
      >
        <Square size={12} />
        {t("Arrêter")}
      </button>
    </div>
  );
}

function ConsentDialog({
  connected,
  onStart,
  onClose,
}: {
  connected: boolean;
  onStart: (o: {
    label: string;
    ref: string;
    wake: boolean;
    record: boolean;
  }) => void;
  onClose: () => void;
}) {
  const { live, author } = useApp();
  const cells = live.ops.cells;
  const resources = live.ops.resources;
  const [link, setLink] = useState("");
  const [label, setLabel] = useState(author);
  const [touched, setTouched] = useState(false);
  const [wake, setWake] = useState(true);
  const [record, setRecord] = useState(false);
  const canWake = typeof navigator !== "undefined" && "wakeLock" in navigator;
  const nameOf = (r: string) =>
    r.startsWith("cell:")
      ? cells.find((c) => `cell:${c.id}` === r)?.name
      : resources.find((x) => `resource:${x.id}` === r)?.name;
  return (
    <Modal title={t("Partager ma position")} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          onStart({ label, ref: link, wake: wake && canWake, record });
        }}
      >
        <div className="live-consent">
          <p>
            {rich(
              t(
                "Ce poste envoie sa <0>position GPS</0> aux postes connectés à la même session, environ toutes les 15 secondes (plus souvent en mouvement).",
              ),
              [<strong />],
            )}
          </p>
          <ul>
            <li>
              {rich(
                t(
                  "<0>Qui la voit :</0> seulement les postes qui ont le code de la session, sur la carte (calque « Positions en direct »). Elle est chiffrée de bout en bout : le relais ne peut pas la lire et ne garde rien.",
                ),
                [<strong />],
              )}
            </li>
            <li>
              {rich(
                t(
                  "<0>Ce qui est gardé :</0> rien. Les autres postes gardent en mémoire la dernière position et le trajet des 30 dernières minutes, puis l’oublient. Rien n’entre dans le journal, l’historique ou les archives, sauf si un opérateur consigne une position exprès.",
                ),
                [<strong />],
              )}
            </li>
            <li>
              {rich(
                t(
                  "<0>Quand ça s’arrête :</0> quand vous touchez « Arrêter » (toujours visible en haut de l’écran), quand vous fermez l’onglet, ou quand l’appareil se verrouille (le navigateur coupe la localisation).",
                ),
                [<strong />],
              )}
            </li>
          </ul>
          {!connected && (
            <p className="hint warn">
              {t(
                "La synchronisation n’est pas en direct : tant qu’elle ne l’est pas, seule cette page voit la position.",
              )}
            </p>
          )}
        </div>
        <label>
          <span>{t("Équipe ou moyen représenté")}</span>
          <select
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              const name = nameOf(e.target.value);
              if (name && (!touched || !label.trim())) setLabel(name);
            }}
          >
            <option value="">{t("Aucun (libellé libre)")}</option>
            {cells.length > 0 && (
              <optgroup label={t("Postes et cellules (Équipe)")}>
                {cells.map((c) => (
                  <option key={c.id} value={`cell:${c.id}`}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
            {resources.length > 0 && (
              <optgroup label={t("Moyens")}>
                {resources.map((r) => (
                  <option key={r.id} value={`resource:${r.id}`}>
                    {r.name}
                    {r.callsign ? ` · ${r.callsign}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <small>
            {t("Relie la position à sa fiche : un clic sur la carte l’ouvre.")}
          </small>
        </label>
        <label>
          <span>{t("Libellé sur la carte")}</span>
          <input
            value={label}
            maxLength={80}
            required
            onChange={(e) => {
              setTouched(true);
              setLabel(e.target.value);
            }}
          />
          <small>
            {t("Nom d’appel ou nom de l’équipe, par exemple « Patrouille 2 ».")}
          </small>
        </label>
        {canWake && (
          <Toggle
            label={t("Garder l’écran allumé")}
            hint={t(
              "Évite que le téléphone se verrouille et coupe le partage. Consomme davantage de batterie.",
            )}
            checked={wake}
            onChange={setWake}
          />
        )}
        <Toggle
          label={t("Enregistrer la trace")}
          hint={t(
            "Le trajet est gardé en mémoire sur ce poste. À l’arrêt, vous choisissez de l’enregistrer comme ligne sur la carte ou de l’abandonner.",
          )}
          checked={record}
          onChange={setRecord}
        />
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            {t("Annuler")}
          </button>
          <button className="primary" disabled={!label.trim()}>
            <Navigation size={14} />
            {t("Partager ma position")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SharingDialog({
  sharing,
  now,
  connected,
  onRecord,
  onStop,
  onClose,
}: {
  sharing: Sharing;
  now: number;
  connected: boolean;
  onRecord: (on: boolean) => void;
  onStop: () => void;
  onClose: () => void;
}) {
  const fix = sharing.fix;
  return (
    <Modal title={t("Position partagée")} onClose={onClose}>
      <div className="stack">
        <dl className="live-facts">
          <div>
            <dt>{t("Libellé")}</dt>
            <dd>{sharing.label}</dd>
          </div>
          <div>
            <dt>{t("Depuis")}</dt>
            <dd className="mono">{toZurichInput(sharing.since, "time")}</dd>
          </div>
          <div>
            <dt>{t("Dernière position")}</dt>
            <dd>
              {fix
                ? t("{age}, précision ± {m} m", {
                    age: ageText(now - fix.t),
                    m: Math.round(fix.acc),
                  })
                : sharing.error || t("en attente du GPS")}
            </dd>
          </div>
          <div>
            <dt>{t("Envoi")}</dt>
            <dd>
              {!connected
                ? t("hors ligne : personne ne la reçoit")
                : sharing.sentAt
                  ? ageText(now - sharing.sentAt)
                  : t("pas encore")}
            </dd>
          </div>
        </dl>
        <Toggle
          label={t("Enregistrer la trace")}
          hint={
            sharing.recording
              ? t(
                  "{n} points, {distance}. À l’arrêt, vous choisissez de l’enregistrer ou de l’abandonner.",
                  {
                    n: sharing.track.length,
                    distance: km(trackLength(sharing.track)),
                  },
                )
              : t(
                  "Gardée en mémoire sur ce poste jusqu’à l’arrêt du partage. La désactiver abandonne le trajet gardé.",
                )
          }
          checked={sharing.recording}
          onChange={onRecord}
        />
        <div className="modal-actions">
          <button type="button" className="push-left" onClick={onClose}>
            {t("Fermer")}
          </button>
          <button type="button" className="danger solid" onClick={onStop}>
            <Square size={13} />
            {t("Arrêter le partage")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
