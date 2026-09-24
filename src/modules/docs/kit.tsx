import { isValidElement, type ReactNode } from "react";
import {
  BookOpen,
  ChevronRight,
  Inbox,
  Info,
  Lightbulb,
  Lock,
  MapPin,
  Monitor,
  Server,
  Sparkles,
  Tablet,
  TriangleAlert,
  Truck,
  Waves,
  type LucideIcon,
} from "lucide-react";

// Building blocks of the documentation: typography helpers, callouts and the
// small diagrams. Colours only come from CSS variables (docs.css).

/** Keyboard key. */
export const K = ({ children }: { children: ReactNode }) => (
  <kbd className="docs-kbd">{children}</kbd>
);

/** Name of a button or a field, as written on screen. */
export const Ui = ({ children }: { children: ReactNode }) => (
  <b className="docs-ui">{children}</b>
);

/** Menu path: Réglages › Synchronisation. */
export function Path({ steps }: { steps: string[] }) {
  return (
    <span className="docs-path">
      {steps.map((s, i) => (
        <span key={i}>
          {i > 0 && <ChevronRight size={13} aria-hidden />}
          <b className="docs-ui">{s}</b>
        </span>
      ))}
    </span>
  );
}

export const H = ({ children }: { children: ReactNode }) => (
  <h3 className="docs-h">{children}</h3>
);

const NOTE: Record<
  "tip" | "warn" | "info",
  { label: string; icon: LucideIcon }
> = {
  tip: { label: "Astuce", icon: Lightbulb },
  warn: { label: "Attention", icon: TriangleAlert },
  info: { label: "Bon à savoir", icon: Info },
};

/** Callout: Astuce, Attention, Bon à savoir. */
export function Note({
  kind = "info",
  children,
}: {
  kind?: "tip" | "warn" | "info";
  children: ReactNode;
}) {
  const { label, icon: Icon } = NOTE[kind];
  return (
    <aside className={`docs-note docs-note-${kind}`}>
      <span className="docs-note-icon" aria-hidden>
        <Icon size={17} />
      </span>
      <div>
        <strong className="docs-note-label">{label}</strong>
        <div className="docs-note-body">{children}</div>
      </div>
    </aside>
  );
}

/** Concrete example drawn from the flood exercise. */
export function Example({
  title = "Crue de l’Arve",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="docs-example">
      <div className="docs-example-head">
        <Waves size={15} aria-hidden />
        Exemple · {title}
      </div>
      <div className="docs-example-body">{children}</div>
    </div>
  );
}

/** Numbered how-to. Children are <li>. */
export const Steps = ({ children }: { children: ReactNode }) => (
  <ol className="docs-steps">{children}</ol>
);

export function Table({
  head,
  rows,
}: {
  head?: ReactNode[];
  rows: ReactNode[][];
}) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        {head && (
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Chain of states: Nouveau → En traitement → … */
export function States({
  steps,
  extra,
}: {
  steps: string[];
  extra?: string[];
}) {
  return (
    <div className="docs-states" role="list">
      {steps.map((s, i) => (
        <span
          key={s}
          role="listitem"
          className="docs-state"
          style={{ ["--i" as string]: i }}
        >
          {s}
        </span>
      ))}
      {extra?.map((s) => (
        <span key={s} role="listitem" className="docs-state docs-state-side">
          {s}
        </span>
      ))}
    </div>
  );
}

export function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="docs-faq">
      <summary>{q}</summary>
      <div className="docs-faq-body">{children}</div>
    </details>
  );
}

export function Gloss({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="docs-gloss">
      <dt>{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ---------- Diagrams ----------

function Node({
  icon: Icon,
  hue,
  title,
  text,
}: {
  icon: LucideIcon;
  hue: number;
  title: string;
  text: ReactNode;
}) {
  return (
    <div className="docs-node" style={{ ["--h" as string]: hue }}>
      <span className="docs-node-icon" aria-hidden>
        <Icon size={20} />
      </span>
      <strong>{title}</strong>
      <small>{text}</small>
    </div>
  );
}

function Wire({ label, both }: { label: ReactNode; both?: boolean }) {
  return (
    <div className="docs-wire" aria-hidden>
      <span className="docs-wire-line">
        <i />
        {both && <i className="back" />}
      </span>
      <small>{label}</small>
    </div>
  );
}

/** Réception → Synthèse → Journal. */
export function MessageFlow() {
  return (
    <figure className="docs-fig">
      <div className="docs-flow">
        <Node
          icon={Inbox}
          hue={265}
          title="Réception"
          text="Le message arrive tel quel : « Ici Patrouille Alpha, l’eau passe par-dessus le quai… »"
        />
        <Wire label="on résume" />
        <Node
          icon={Sparkles}
          hue={195}
          title="Synthèse"
          text="On garde l’essentiel, en une ou deux phrases claires."
        />
        <Wire label="on inscrit" />
        <Node
          icon={BookOpen}
          hue={212}
          title="Journal"
          text="#012 : numéroté, à l’heure, relié au message d’origine."
        />
      </div>
      <figcaption>
        Le chemin d’un message : du texte brut à l’entrée officielle du journal.
      </figcaption>
    </figure>
  );
}

/** Poste A ⇄ relais ⇄ Poste B. */
export function SyncFlow() {
  return (
    <figure className="docs-fig">
      <div className="docs-flow">
        <Node
          icon={Monitor}
          hue={212}
          title="Poste A"
          text="PC front · copie complète de la session"
        />
        <Wire
          both
          label={
            <>
              <Lock size={11} /> chiffré
            </>
          }
        />
        <Node
          icon={Server}
          hue={285}
          title="Relais"
          text="Ne voit rien : il transmet des messages illisibles et ne garde rien."
        />
        <Wire
          both
          label={
            <>
              <Lock size={11} /> chiffré
            </>
          }
        />
        <Node
          icon={Tablet}
          hue={160}
          title="Poste B"
          text="PC arrière · copie complète de la session"
        />
      </div>
      <figcaption>
        Chaque poste garde tout. Le relais ne fait que passer des enveloppes
        scellées : seuls les postes qui connaissent le code peuvent les ouvrir.
      </figcaption>
    </figure>
  );
}

/** A map object linked to a message, an entry and a resource. */
export function LinksFigure() {
  const center = { x: 260, y: 150 };
  const around = [
    {
      x: 92,
      y: 58,
      hue: 265,
      icon: Inbox,
      title: "Message",
      sub: "Patrouille Alpha",
      link: "signale",
    },
    {
      x: 428,
      y: 58,
      hue: 212,
      icon: BookOpen,
      title: "Entrée #012",
      sub: "Renseignement",
      link: "consigné",
    },
    {
      x: 260,
      y: 262,
      hue: 28,
      icon: Truck,
      title: "Moyen",
      sub: "Motopompe 2",
      link: "engagé sur",
    },
  ];
  return (
    <figure className="docs-fig">
      <svg
        className="docs-links-svg"
        viewBox="0 0 520 310"
        role="img"
        aria-label="Un objet de la carte relié à un message, une entrée du journal et un moyen"
      >
        {around.map((a, i) => (
          <g key={i}>
            <line
              className="docs-svg-wire"
              x1={center.x}
              y1={center.y}
              x2={a.x}
              y2={a.y}
            />
            <line
              className="docs-svg-pulse"
              x1={center.x}
              y1={center.y}
              x2={a.x}
              y2={a.y}
              style={{ animationDelay: `${i * 0.7}s` }}
            />
            <text
              className="docs-svg-link"
              x={(center.x + a.x) / 2}
              y={(center.y + a.y) / 2 - 6}
              textAnchor="middle"
            >
              {a.link}
            </text>
          </g>
        ))}
        <g
          className="docs-svg-node docs-svg-center"
          style={{ ["--h" as string]: 160 }}
        >
          <circle cx={center.x} cy={center.y} r={34} />
          <MapPin x={center.x - 12} y={center.y - 12} width={24} height={24} />
          <text x={center.x + 44} y={center.y - 2}>
            Digue
          </text>
          <text className="sub" x={center.x + 44} y={center.y + 16}>
            objet de la carte
          </text>
        </g>
        {around.map((a, i) => {
          const Icon = a.icon;
          return (
            <g
              key={i}
              className="docs-svg-node"
              style={{ ["--h" as string]: a.hue }}
            >
              <circle cx={a.x} cy={a.y} r={24} />
              <Icon x={a.x - 10} y={a.y - 10} width={20} height={20} />
              <text x={a.x} y={a.y + 42} textAnchor="middle">
                {a.title}
              </text>
              <text className="sub" x={a.x} y={a.y + 58} textAnchor="middle">
                {a.sub}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        Survolez la digue sur la carte : le message qui l’a signalée, l’entrée
        du journal et la motopompe engagée apparaissent aussitôt.
      </figcaption>
    </figure>
  );
}

/** Simplified screen with numbered zones. */
export function ScreenMap() {
  const n = (v: number) => (
    <b className="docs-num" aria-hidden>
      {v}
    </b>
  );
  return (
    <figure className="docs-fig">
      <div className="docs-screen" aria-hidden>
        <div className="docs-screen-bar">
          <span className="docs-screen-logo">{n(1)}</span>
          <span className="docs-screen-pill wide">{n(2)} Crue de l’Arve ▾</span>
          <span className="docs-screen-pill grow">
            {n(3)} Rechercher ou agir… <kbd>⌘K</kbd>
          </span>
          <span className="docs-screen-pill">{n(4)} 3 postes</span>
          <span className="docs-screen-pill hide-small">{n(5)} Chiffré</span>
          <span className="docs-screen-pill hide-small">{n(6)} 14:05</span>
          <span className="docs-screen-pill">{n(7)} SM</span>
        </div>
        <div className="docs-screen-body">
          <div className="docs-screen-dock">
            {n(8)}
            <i />
            <i className="badge" />
            <i className="badge violet" />
            <i />
            <i />
          </div>
          <div className="docs-screen-main">
            <div className="docs-screen-title">
              <span />
              {n(9)}
            </div>
            <div className="docs-screen-cards">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
      <figcaption>
        L’écran d’orion aic, simplifié. Les numéros renvoient à la liste
        ci-dessous.
      </figcaption>
    </figure>
  );
}

// ---------- Search helpers ----------

// Props whose text is shown to the reader, hence searchable.
const TEXT_PROPS = [
  "children",
  "q",
  "term",
  "title",
  "steps",
  "extra",
  "rows",
  "head",
];

/** Visible text of a JSX tree (stops at components that draw their own text). */
export function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    return TEXT_PROPS.map((k) =>
      k in props ? textOf(props[k] as ReactNode) : "",
    ).join(" ");
  }
  return "";
}

/** Lower case, no accents, straight apostrophes; keeps one char per char. */
export function fold(value: string): string {
  return Array.from(value)
    .map((c) => {
      if (c === "’" || c === "‘") return "'";
      const base = c.normalize("NFD")[0] ?? c;
      return base.toLowerCase()[0] ?? base;
    })
    .join("");
}
