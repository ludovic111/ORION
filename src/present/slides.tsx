import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  Gauge,
  Minus,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CircleDot,
  Clock3,
  Flag,
  LayoutGrid,
  ListChecks,
  Map as MapIcon,
  MessageCircleQuestion,
  Radio,
  Sun,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { weatherIcon } from "../modules/weather/forecast";
import { symbolUrl } from "../modules/map/symbols";
import type { Deck, Slide, SlideKind, Tone } from "./deck";

// A slide of the deck drawn with the app's look on a 1920 × 1080 stage:
// staggered entrances (CSS, --d = order), counters, slow zoom on the maps.
// `still` draws the final state at once (thumbnails, overview, presenter).

export const KIND_ICON: Record<SlideKind, LucideIcon> = {
  title: Flag,
  situation: LayoutGrid,
  facts: Gauge,
  map: MapIcon,
  changes: Clock3,
  highlights: CircleDot,
  missions: ListChecks,
  resources: Truck,
  team: Users,
  radio: Radio,
  weather: Sun,
  agenda: CalendarClock,
  closing: MessageCircleQuestion,
};

const d = (i: number): CSSProperties => ({ "--d": i }) as CSSProperties;
const tone = (t: Tone) => `t-${t}`;

function reduced() {
  return (
    document.documentElement.dataset.motion === "reduced" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Number written like the original value ("+ 45", "1’200", "12,5"). */
function formatLike(value: string, n: number) {
  const prefix = value.match(/^\s*[+−-]\s*/)?.[0] ?? "";
  const decimals = value.match(/[.,](\d+)\s*$/)?.[1].length ?? 0;
  return `${prefix}${Math.abs(n).toLocaleString("fr-CH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Value counting up from zero when the slide appears. */
export function Counter({
  value,
  number,
  delay = 0,
  still,
}: {
  value: string;
  number: number | null;
  delay?: number;
  still?: boolean;
}) {
  const animate = number !== null && !still && !reduced();
  const [n, setN] = useState(animate ? 0 : (number ?? 0));
  useEffect(() => {
    if (!animate || number === null) {
      setN(number ?? 0);
      return;
    }
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / 1300));
      setN(number * (1 - Math.pow(1 - p, 4)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, number, delay]);
  if (number === null) return <>{value}</>;
  return <>{formatLike(value, n)}</>;
}

function Head({ slide }: { slide: Slide }) {
  return (
    <header className="ps-head">
      <div className="ps-kicker pm-in" style={d(0)}>
        {slide.kicker}
      </div>
      <h1 className="ps-title pm-in" style={d(0)}>
        {slide.title}
      </h1>
    </header>
  );
}

function Card({
  i,
  className = "",
  children,
  style,
}: {
  i: number;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div className={`ps-card pm-in ${className}`} style={{ ...d(i), ...style }}>
      {children}
    </div>
  );
}

// ---------- Kinds ----------

function TitleView({ slide }: { slide: Extract<Slide, { kind: "title" }> }) {
  const context = [
    slide.organization,
    slide.location,
    slide.reference && `Réf. ${slide.reference}`,
  ].filter(Boolean);
  return (
    <div className="ps-cover">
      <div className="ps-cover-top pm-in" style={d(0)}>
        <span className="ps-brand">orion aic · point de situation</span>
        <span className="ps-badges">
          {slide.badges.map((b) => (
            <span key={b.label} className={`ps-badge ${tone(b.tone)}`}>
              {b.label}
            </span>
          ))}
        </span>
      </div>
      <h1
        className="ps-cover-title pm-in"
        style={d(1)}
        data-long={slide.operation.length > 40 || undefined}
      >
        {slide.operation}
      </h1>
      {context.length > 0 && (
        <p className="ps-cover-context pm-in" style={d(2)}>
          {context.join("  ·  ")}
        </p>
      )}
      <div className="ps-cover-rule pm-in pm-wipe" style={d(3)} />
      <p className="ps-cover-when pm-in" style={d(4)}>
        {slide.when}
      </p>
      {(slide.presenter || slide.audience) && (
        <p className="ps-cover-by pm-in" style={d(5)}>
          {slide.presenter && (
            <>
              Présenté par <b>{slide.presenter}</b>
            </>
          )}
          {slide.presenter && slide.audience && "  ·  "}
          {slide.audience && <>pour {slide.audience}</>}
        </p>
      )}
    </div>
  );
}

function SituationView({
  slide,
}: {
  slide: Extract<Slide, { kind: "situation" }>;
}) {
  const boards = slide.boards.slice(0, slide.intent ? 3 : 4);
  const long = (s: string) =>
    s.length > 420 ? "xs" : s.length > 240 ? "s" : "";
  return (
    <div
      className={`ps-situation ${slide.intent ? "with-intent" : `n${boards.length}`}`}
    >
      <div className="ps-boards">
        {boards.map((b, i) => (
          <Card key={b.id} i={i + 1} className="ps-board">
            <h2 className={`ps-label c${(i + 1) % 4}`}>{b.title}</h2>
            <p className="ps-body" data-size={long(b.body)}>
              {b.body}
            </p>
          </Card>
        ))}
      </div>
      {slide.intent && (
        <Card i={boards.length + 1} className="ps-intent pm-zoom">
          <h2 className="ps-label">Idée de manœuvre</h2>
          <small>{slide.intent.title}</small>
          <p className="ps-body" data-size={long(slide.intent.body)}>
            {slide.intent.body}
          </p>
        </Card>
      )}
    </div>
  );
}

function FactsView({
  slide,
  still,
}: {
  slide: Extract<Slide, { kind: "facts" }>;
  still?: boolean;
}) {
  const facts = slide.facts.slice(0, 12);
  const cols = facts.length <= 4 ? facts.length : facts.length <= 6 ? 3 : 4;
  const moved = facts.some((f) => f.trend && f.trend !== "same");
  return (
    <>
      {slide.since && (
        <p className="ps-sub pm-in" style={d(1)}>
          {moved ? "Évolution" : "Aucune évolution"} {slide.since}
        </p>
      )}
      <div
        className="ps-facts"
        style={
          {
            "--cols": cols,
            "--rows": Math.ceil(facts.length / cols),
          } as CSSProperties
        }
      >
        {facts.map((f, i) => (
          <Card key={f.id} i={i + 2} className={`ps-fact pm-zoom c${i % 4}`}>
            <div className="ps-fact-value">
              <span className="ps-num">
                <Counter
                  value={f.value}
                  number={f.number}
                  delay={300 + i * 110}
                  still={still}
                />
              </span>
              {f.unit && <span className="ps-unit">{f.unit}</span>}
            </div>
            <div className="ps-fact-label">{f.label}</div>
            {f.note && <div className="ps-fact-note">{f.note}</div>}
            {f.delta && f.trend !== "same" && (
              <span className={`ps-delta ${f.trend}`}>
                {f.trend === "up" ? (
                  <ArrowUpRight size={26} />
                ) : f.trend === "down" ? (
                  <ArrowDownRight size={26} />
                ) : (
                  <Minus size={22} />
                )}
                {f.delta}
              </span>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}

function MapView({
  slide,
  image,
  still,
}: {
  slide: Extract<Slide, { kind: "map" }>;
  image?: string;
  still?: boolean;
}) {
  let order = 2;
  return (
    <div className="ps-map">
      {image ? (
        <img
          className={`ps-map-img${still ? "" : " pm-drift"}`}
          src={image}
          alt={slide.title}
        />
      ) : (
        <div className="ps-map-wait">
          <MapIcon size={80} />
          Carte en préparation…
        </div>
      )}
      <div className="ps-map-top">
        <Head slide={slide} />
        {slide.purpose && (
          <p className="ps-map-purpose pm-in" style={d(1)}>
            {slide.purpose}
          </p>
        )}
      </div>
      {slide.legend.length > 0 && (
        <div className="ps-legend pm-in" style={d(1)}>
          {slide.legend.slice(0, 6).map((l) => (
            <div key={l.layer} className="ps-legend-layer">
              <h3 className="pm-in" style={d(order++)}>
                {l.layer}
              </h3>
              {l.items.slice(0, 4).map((it) => {
                const url = it.symbol ? symbolUrl(it.symbol) : "";
                return (
                  <div
                    key={`${it.symbol}${it.kind}${it.color}${it.name}`}
                    className="ps-legend-item pm-in"
                    style={d(order++)}
                  >
                    {url ? (
                      <img src={url} alt="" />
                    ) : (
                      <i
                        className={`ps-mark-${it.kind}`}
                        style={
                          {
                            "--c": it.color || "var(--p-cyan)",
                          } as CSSProperties
                        }
                      />
                    )}
                    <span>{it.name}</span>
                    {it.count > 1 && <b>×{it.count}</b>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangesView({
  slide,
}: {
  slide: Extract<Slide, { kind: "changes" }>;
}) {
  const groups = slide.groups.slice(0, 6);
  return (
    <>
      <p className="ps-sub pm-in" style={d(1)}>
        <b className="ps-accent">{slide.total}</b> changement
        {slide.total > 1 ? "s" : ""} {slide.since}
      </p>
      <div className={`ps-grid g${groups.length}`}>
        {groups.map((g, i) => {
          const total = g.created + g.updated + g.removed;
          return (
            <Card key={g.label} i={i + 2} className={`ps-change c${i % 4}`}>
              <div className="ps-change-head">
                <span className="ps-num">{total}</span>
                <h2>{g.label}</h2>
              </div>
              <div className="ps-change-split">
                {g.created > 0 && (
                  <span className="t-ok">
                    +{g.created} nouveau{g.created > 1 ? "x" : ""}
                  </span>
                )}
                {g.updated > 0 && (
                  <span className="t-info">
                    {g.updated} modifié{g.updated > 1 ? "s" : ""}
                  </span>
                )}
                {g.removed > 0 && (
                  <span className="t-crit">
                    −{g.removed} retiré{g.removed > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <ul>
                {g.highlights.slice(0, 3).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function HighlightsView({
  slide,
}: {
  slide: Extract<Slide, { kind: "highlights" }>;
}) {
  return (
    <div
      className="ps-timeline"
      style={{ "--n": slide.items.length } as CSSProperties}
    >
      <div className="ps-axis pm-in pm-grow" style={d(1)} />
      {slide.items.map((it, i) => (
        <div key={it.id} className={`ps-event ${tone(it.tone)}`}>
          <time className="pm-in" style={d(i + 1)}>
            {it.time}
          </time>
          <i className="ps-dot pm-in pm-pop" style={d(i + 1)} />
          <Card i={i + 1} className="ps-event-card">
            <div className="ps-event-meta">
              {[
                it.number,
                it.type,
                it.priority !== "Normal" && it.priority,
                it.status,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
            <p>{it.text}</p>
          </Card>
        </div>
      ))}
      {slide.more > 0 && (
        <p className="ps-more pm-in" style={d(slide.items.length + 1)}>
          … et {slide.more} autre{slide.more > 1 ? "s" : ""} au journal
        </p>
      )}
    </div>
  );
}

function MissionsView({
  slide,
}: {
  slide: Extract<Slide, { kind: "missions" }>;
}) {
  return (
    <>
      <div className="ps-pills pm-in" style={d(1)}>
        <span className="ps-badge t-accent">
          {slide.open} point{slide.open > 1 ? "s" : ""} ouvert
          {slide.open > 1 ? "s" : ""}
        </span>
        {slide.late > 0 && (
          <span className="ps-badge t-crit pm-pulse">
            <AlertTriangle size={22} /> {slide.late} en retard
          </span>
        )}
      </div>
      <div className="ps-rows">
        {slide.items.map((m, i) => (
          <div
            key={m.id}
            className={`ps-row pm-in${m.late ? " late" : ""}`}
            style={d(i + 2)}
          >
            <b className="ps-row-num">{m.number}</b>
            <p className="ps-row-text">{m.text}</p>
            <span className="ps-row-who">{m.assignee}</span>
            <span className="ps-row-due">{m.due}</span>
            <span
              className={`ps-badge ${m.late ? "t-crit" : m.status === "En cours" ? "t-info" : "t-warn"}`}
            >
              {m.status}
            </span>
          </div>
        ))}
        {slide.more > 0 && (
          <p className="ps-more pm-in" style={d(slide.items.length + 2)}>
            … et {slide.more} autre{slide.more > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </>
  );
}

function Kpis({
  items,
  still,
}: {
  items: { label: string; value: string; tone: Tone; number?: number | null }[];
  still?: boolean;
}) {
  return (
    <div className="ps-kpis" style={{ "--n": items.length } as CSSProperties}>
      {items.map((k, i) => (
        <Card
          key={k.label}
          i={i + 1}
          className={`ps-kpi pm-zoom ${tone(k.tone)}`}
        >
          <span className="ps-num">
            <Counter
              value={k.value}
              number={k.number === undefined ? null : k.number}
              delay={250 + i * 110}
              still={still}
            />
          </span>
          <span className="ps-kpi-label">{k.label}</span>
        </Card>
      ))}
    </div>
  );
}

function ResourcesView({
  slide,
  still,
}: {
  slide: Extract<Slide, { kind: "resources" }>;
  still?: boolean;
}) {
  const total = slide.totals.reduce((n, t) => n + t.value, 0) || 1;
  return (
    <>
      <Kpis
        still={still}
        items={slide.totals.map((t) => ({
          ...t,
          value: String(t.value),
          number: t.value,
        }))}
      />
      <div className="ps-bar pm-in" style={d(5)}>
        {slide.totals.map((t) => (
          <i
            key={t.label}
            className={`${tone(t.tone)} pm-grow-x`}
            style={{
              flexGrow: t.value,
              flexBasis: 0,
              width: `${(t.value / total) * 100}%`,
            }}
          />
        ))}
      </div>
      <table className="ps-table pm-in" style={d(6)}>
        <thead>
          <tr>
            {slide.head.map((h, i) => (
              <th key={h} className={i ? "c" : ""}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slide.rows.slice(0, 7).map((r) => (
            <tr key={r[0]} className={r[0] === "Total" ? "total" : ""}>
              {r.map((c, i) => (
                <td
                  key={i}
                  className={i ? `c v${i}${c === "0" ? " zero" : ""}` : ""}
                >
                  {i && c === "0" ? "—" : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {slide.engaged.length > 0 && slide.rows.length <= 4 && (
        <div className="ps-engaged">
          {slide.engaged.slice(0, 4).map((r, i) => (
            <Card key={r.name + i} i={7 + i} className="ps-engaged-item">
              <b>
                {r.name}
                {r.count > 1 && <span> ×{r.count}</span>}
              </b>
              <small>
                {[r.organization, r.location].filter(Boolean).join(" · ")}
              </small>
              {r.mission && <p>{r.mission}</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function TeamView({ slide }: { slide: Extract<Slide, { kind: "team" }> }) {
  const cells = slide.cells.slice(0, 6);
  return (
    <>
      <p className="ps-sub pm-in" style={d(1)}>
        <b className="ps-accent">{slide.present}</b> présent
        {slide.present > 1 ? "s" : ""} sur {slide.total} personne
        {slide.total > 1 ? "s" : ""}
      </p>
      <div className={`ps-grid g${cells.length}`}>
        {cells.map((c, i) => (
          <Card
            key={c.id}
            i={i + 2}
            className="ps-cell"
            style={{ "--c": c.color || undefined } as CSSProperties}
          >
            <h2>{c.name}</h2>
            <small>
              {[
                c.kind !== c.name && c.kind,
                c.location,
                c.radio && `radio ${c.radio}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </small>
            <ul>
              {c.members.slice(0, 5).map((m) => (
                <li
                  key={m.name + m.role}
                  data-away={m.status !== "Présent" || undefined}
                >
                  <b>{m.role || "—"}</b>
                  <span>{m.name}</span>
                </li>
              ))}
              {c.members.length > 5 && (
                <li className="more">+ {c.members.length - 5} autres</li>
              )}
              {!c.members.length && (
                <li className="more">Personne n’est affecté.</li>
              )}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}

function RadioView({
  slide,
  still,
}: {
  slide: Extract<Slide, { kind: "radio" }>;
  still?: boolean;
}) {
  return (
    <>
      <Kpis still={still} items={slide.stats} />
      <div className="ps-split">
        {slide.groups.length > 0 && (
          <table className="ps-table pm-in" style={d(6)}>
            <thead>
              <tr>
                <th>Groupe</th>
                <th>N°</th>
                <th>Usage</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {slide.groups.slice(0, 7).map((g) => (
                <tr key={g.name}>
                  <td>
                    <b>{g.name}</b>
                  </td>
                  <td className="mono">{g.number || "—"}</td>
                  <td>{g.usage}</td>
                  <td className="dim">{g.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Card
          i={7}
          className={`ps-links ${slide.weak.length ? "t-crit" : "t-ok"}`}
        >
          <h2 className="ps-label">
            {slide.weak.length ? "Liaisons faibles ou nulles" : "Liaisons"}
          </h2>
          {slide.weak.length ? (
            <ul>
              {slide.weak.slice(0, 6).map((w) => (
                <li key={w.callsign}>
                  <time>{w.time}</time> <b>{w.callsign}</b>{" "}
                  <span>{w.result}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Aucune liaison faible au dernier contrôle.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function WeatherView({
  slide,
}: {
  slide: Extract<Slide, { kind: "weather" }>;
}) {
  const Now = slide.now ? weatherIcon(slide.now.code) : null;
  const temps = slide.hours.map((h) =>
    parseFloat(h.temperature.replace(",", ".")),
  );
  const valid = temps.filter((t) => !Number.isNaN(t));
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const points = temps
    .map((t, i) => {
      const x = ((i + 0.5) / temps.length) * 1000;
      const y = Number.isNaN(t)
        ? 60
        : 100 - ((t - min) / (max - min || 1)) * 80;
      return `${x.toFixed(0)},${y.toFixed(0)}`;
    })
    .join(" ");
  let order = 3;
  return (
    <div className={`ps-weather${slide.now ? "" : " no-now"}`}>
      {slide.now && Now && (
        <Card i={1} className="ps-now pm-zoom">
          <h2 className="ps-label">Maintenant</h2>
          <Now className="ps-now-icon" size={120} strokeWidth={1.4} />
          <div className="ps-now-temp">{slide.now.temperature}</div>
          <div className="ps-now-label">{slide.now.label}</div>
          <dl>
            <dt>Vent</dt>
            <dd>{slide.now.wind}</dd>
            <dt>Précipitations</dt>
            <dd>{slide.now.precipitation}</dd>
            <dt>Humidité</dt>
            <dd>{slide.now.humidity}</dd>
          </dl>
          <small>{slide.source}</small>
        </Card>
      )}
      <div className="ps-weather-side">
        {slide.hours.length > 0 && (
          <div className="ps-hours pm-in" style={d(2)}>
            <svg
              viewBox="0 0 1000 110"
              preserveAspectRatio="none"
              className="ps-spark"
            >
              <polyline points={points} pathLength={1} className="pm-draw" />
            </svg>
            {slide.hours.map((h) => {
              const Icon = weatherIcon(h.code);
              return (
                <div key={h.time} className="ps-hour pm-in" style={d(order++)}>
                  <time>{h.time}</time>
                  <Icon size={44} strokeWidth={1.6} />
                  <b>{h.temperature}</b>
                  <small>{h.precipitation}</small>
                </div>
              );
            })}
          </div>
        )}
        {slide.alerts.map((a) => (
          <Card
            key={a.hazard + a.region}
            i={order++}
            className={`ps-alert ${tone(a.tone)}`}
          >
            <span className="ps-alert-level">{a.level}</span>
            <div>
              <b>
                {a.hazard}
                {a.region && ` · ${a.region}`}
              </b>
              <small>
                Degré {a.level} · {a.period}
              </small>
            </div>
          </Card>
        ))}
        {slide.observation && (
          <Card i={order++} className="ps-observation">
            <h2 className="ps-label">
              Observation {slide.observation.time} · {slide.observation.place}
            </h2>
            <p>{slide.observation.text}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function AgendaView({ slide }: { slide: Extract<Slide, { kind: "agenda" }> }) {
  return (
    <div
      className="ps-agenda"
      style={{ "--n": slide.items.length } as CSSProperties}
    >
      {slide.items.map((it, i) => (
        <div
          key={it.id}
          className={`ps-slot pm-in${it.next ? " next" : ""}${it.late ? " late" : ""}`}
          style={d(i + 1)}
        >
          <time>{it.time}</time>
          <div>
            <b>{it.title}</b>
            <small>{it.detail}</small>
          </div>
          <span className="ps-badge">
            {it.late
              ? "dépassé"
              : it.next
                ? `Prochain · ${it.relative}`
                : it.relative}
          </span>
        </div>
      ))}
    </div>
  );
}

function ClosingView({
  slide,
}: {
  slide: Extract<Slide, { kind: "closing" }>;
}) {
  return (
    <div className="ps-closing">
      <div className="ps-kicker pm-in" style={d(0)}>
        {slide.kicker}
      </div>
      <h1 className="ps-closing-title pm-in pm-zoom" style={d(1)}>
        {slide.title}
      </h1>
      <p className="ps-closing-who pm-in" style={d(2)}>
        {[slide.presenter, slide.organization].filter(Boolean).join("  ·  ")}
      </p>
      {slide.next && (
        <p className="ps-closing-next pm-in" style={d(3)}>
          {slide.next}
        </p>
      )}
      {slide.contacts.length > 0 && (
        <div className="ps-contacts">
          {slide.contacts.map((c, i) => (
            <Card key={c.name} i={i + 4} className="ps-contact">
              <b>{c.name}</b>
              <small>{c.role}</small>
              <span>{c.phone || "—"}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/** One slide on its 1920 × 1080 stage. */
export function SlideView({
  deck,
  slide,
  index,
  count,
  maps,
  footer,
  still,
}: {
  deck: Deck;
  slide: Slide;
  index: number;
  count: number;
  maps: Record<string, string>;
  footer: string;
  still?: boolean;
}) {
  let body: ReactNode;
  switch (slide.kind) {
    case "title":
      body = <TitleView slide={slide} />;
      break;
    case "situation":
      body = <SituationView slide={slide} />;
      break;
    case "facts":
      body = <FactsView slide={slide} still={still} />;
      break;
    case "map":
      body = <MapView slide={slide} image={maps[slide.id]} still={still} />;
      break;
    case "changes":
      body = <ChangesView slide={slide} />;
      break;
    case "highlights":
      body = <HighlightsView slide={slide} />;
      break;
    case "missions":
      body = <MissionsView slide={slide} />;
      break;
    case "resources":
      body = <ResourcesView slide={slide} still={still} />;
      break;
    case "team":
      body = <TeamView slide={slide} />;
      break;
    case "radio":
      body = <RadioView slide={slide} still={still} />;
      break;
    case "weather":
      body = <WeatherView slide={slide} />;
      break;
    case "agenda":
      body = <AgendaView slide={slide} />;
      break;
    case "closing":
      body = <ClosingView slide={slide} />;
      break;
  }
  const bare =
    slide.kind === "title" || slide.kind === "closing" || slide.kind === "map";
  return (
    <div className={`ps ps-${slide.kind}-slide${still ? " pm-still" : ""}`}>
      <div className="ps-glow" aria-hidden />
      {!bare && <Head slide={slide} />}
      <div className="ps-main">{body}</div>
      <footer className="ps-foot">
        <span>{footer}</span>
        <span>{deck.when}</span>
        <b>
          {index + 1} / {count}
        </b>
      </footer>
      {deck.watermark && (
        <div className="ps-watermark" aria-hidden>
          {deck.watermark}
        </div>
      )}
    </div>
  );
}
