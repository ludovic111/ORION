import { useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  Contact,
  Gauge,
  Inbox,
  LayoutList,
  Link2,
  Megaphone,
  MapPin,
  Plus,
  Radio,
  RadioTower,
  ScrollText,
  Search,
  Smartphone,
  Thermometer,
  Truck,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { RefKind } from "../../shared/ops";
import {
  KIND_INFO,
  addLink,
  neighbours,
  parseRef,
  removeLink,
  searchItems,
  type Item,
  type Ref,
} from "../../shared/links";
import { useApp } from "../app/context";
import { Modal } from "../journal/Modal";

export const KIND_ICON: Record<RefKind, LucideIcon> = {
  entry: BookOpen,
  message: Inbox,
  place: MapPin,
  resource: Truck,
  member: User,
  cell: Users,
  contact: Contact,
  agenda: CalendarClock,
  fact: Gauge,
  board: LayoutList,
  alert: AlertTriangle,
  observation: Thermometer,
  terminal: Smartphone,
  station: RadioTower,
  talkgroup: Radio,
  order: ScrollText,
  broadcast: Megaphone,
};

export const hueStyle = (kind: RefKind) =>
  ({ "--h": KIND_INFO[kind].hue }) as CSSProperties;

export function KindDot({ kind }: { kind: RefKind }) {
  return (
    <span className="kind-dot" style={hueStyle(kind)} aria-hidden="true" />
  );
}

/** Item summary and everything it is linked to. */
export function ItemPreview({
  target,
  limit = 8,
}: {
  target: Ref;
  limit?: number;
}) {
  const { journal, graph } = useApp();
  const item = graph.byRef.get(target);
  const around = useMemo(
    () => neighbours(journal, target, graph.edges),
    [journal, target, graph.edges],
  );
  if (!item) return null;
  const Icon = KIND_ICON[item.kind];
  return (
    <>
      <header>
        <Icon size={12} />
        {KIND_INFO[item.kind].label}
      </header>
      <h4>{item.title}</h4>
      {item.subtitle && <p>{item.subtitle}</p>}
      {around.length > 0 && (
        <ul>
          {around.slice(0, limit).map((n) => {
            const other = graph.byRef.get(n.ref);
            if (!other) return null;
            return (
              <li key={n.ref}>
                <KindDot kind={other.kind} />
                <span>{other.title}</span>
                <em>{n.label || KIND_INFO[other.kind].label}</em>
              </li>
            );
          })}
          {around.length > limit && (
            <li>
              <span className="muted">
                + {around.length - limit} autre(s) lien(s)
              </span>
            </li>
          )}
        </ul>
      )}
    </>
  );
}

export function HoverCard({
  target,
  x,
  y,
}: {
  target: Ref;
  x: number;
  y: number;
}) {
  const left = Math.max(8, Math.min(x, window.innerWidth - 336));
  const top = y + 280 > window.innerHeight ? Math.max(8, y - 290) : y;
  return createPortal(
    <div className="hovercard" style={{ left, top }} role="tooltip">
      <ItemPreview target={target} />
    </div>,
    document.body,
  );
}

/** Clickable reference to any item, with a preview on hover. */
export function LinkChip({
  target,
  label,
  onRemove,
}: {
  target: Ref;
  label?: string;
  onRemove?: () => void;
}) {
  const { graph, open } = useApp();
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const item = graph.byRef.get(target);
  if (!item) return null;
  const Icon = KIND_ICON[item.kind];
  return (
    <span className="link-item">
      <button
        type="button"
        className="link-chip"
        style={hueStyle(item.kind)}
        onClick={() => open(target)}
        onMouseEnter={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          clearTimeout(timer.current);
          timer.current = setTimeout(
            () => setHover({ x: box.left, y: box.bottom + 6 }),
            350,
          );
        }}
        onMouseLeave={() => {
          clearTimeout(timer.current);
          setHover(null);
        }}
        onFocus={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          setHover({ x: box.left, y: box.bottom + 6 });
        }}
        onBlur={() => setHover(null)}
      >
        <Icon
          size={13}
          style={{
            color: `hsl(${KIND_INFO[item.kind].hue} 85% 68%)`,
            flex: "none",
          }}
        />
        <span className="title">{item.title}</span>
        {label && <small>{label}</small>}
      </button>
      {onRemove && (
        <button
          type="button"
          className="icon-button"
          aria-label={`Retirer le lien vers ${item.title}`}
          title="Retirer ce lien"
          onClick={onRemove}
        >
          <X size={13} />
        </button>
      )}
      {hover && <HoverCard target={target} x={hover.x} y={hover.y} />}
    </span>
  );
}

/** Search any item of the journal. */
export function ItemSearch({
  onPick,
  exclude = [],
  kinds,
  autoFocus = true,
}: {
  onPick: (item: Item) => void;
  exclude?: string[];
  kinds?: RefKind[];
  autoFocus?: boolean;
}) {
  const { graph } = useApp();
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const pool = graph.items.filter(
      (i) => !exclude.includes(i.ref) && (!kinds || kinds.includes(i.kind)),
    );
    return searchItems(pool, query).slice(0, 60);
  }, [graph.items, query, exclude, kinds]);
  return (
    <div>
      <div className="search" style={{ maxWidth: "none" }}>
        <Search size={14} />
        <input
          autoFocus={autoFocus}
          value={query}
          placeholder="Rechercher une entrée, un message, un moyen, une personne…"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher"
        />
      </div>
      <div className="picker-results">
        {results.map((item) => {
          const Icon = KIND_ICON[item.kind];
          return (
            <button
              key={item.ref}
              className="row-item"
              onClick={() => onPick(item)}
            >
              <Icon
                size={15}
                style={{
                  color: `hsl(${KIND_INFO[item.kind].hue} 85% 68%)`,
                  flex: "none",
                }}
              />
              <span className="row-main">
                <strong>{item.title}</strong>
                <small>
                  {KIND_INFO[item.kind].label}
                  {item.subtitle && ` · ${item.subtitle}`}
                </small>
              </span>
            </button>
          );
        })}
        {!results.length && (
          <p className="muted" style={{ padding: 14 }}>
            Aucun élément ne correspond.
          </p>
        )}
      </div>
    </div>
  );
}

/** Everything linked to an item, with adding and removing of links. */
export function LinksPanel({
  target,
  compact = false,
}: {
  target: Ref;
  compact?: boolean;
}) {
  const { journal, graph, updateOps, author, readOnly } = useApp();
  const [picking, setPicking] = useState(false);
  const [label, setLabel] = useState("");
  const around = useMemo(
    () => neighbours(journal, target, graph.edges),
    [journal, target, graph.edges],
  );
  const grouped = useMemo(() => {
    const map = new Map<RefKind, typeof around>();
    for (const n of around) {
      const kind = parseRef(n.ref).kind;
      map.set(kind, [...(map.get(kind) ?? []), n]);
    }
    return [...map.entries()];
  }, [around]);
  return (
    <section className="links-panel">
      <div className="card-head" style={{ marginBottom: 0 }}>
        <Link2 size={15} />
        <h3>Liens</h3>
        <span className="pill plain">{around.length}</span>
        {!readOnly && (
          <button className="small" onClick={() => setPicking(true)}>
            <Plus size={13} />
            Lier
          </button>
        )}
      </div>
      {!around.length && !compact && (
        <p className="muted" style={{ fontSize: 12 }}>
          Aucun lien. « Lier » relie cet élément à une entrée, un message, un
          moyen, une personne, un objet de la carte… Les noms d’appel, émetteurs
          et références (#012) sont reliés automatiquement.
        </p>
      )}
      {grouped.map(([kind, list]) => (
        <div className="links-group" key={kind}>
          <span className="label">{KIND_INFO[kind].plural}</span>
          <div>
            {list.map((n) => (
              <LinkChip
                key={n.ref}
                target={n.ref}
                label={n.label}
                onRemove={
                  n.linkId && !readOnly
                    ? () => updateOps((ops) => removeLink(ops, n.linkId!))
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
      {picking && (
        <Modal title="Lier à…" onClose={() => setPicking(false)}>
          <div className="stack">
            <label>
              Nature du lien (facultatif)
              <input
                value={label}
                maxLength={200}
                placeholder="ex. position, demandé par, concerne"
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <ItemSearch
              exclude={[target, ...around.map((n) => n.ref)]}
              onPick={(item) => {
                updateOps((ops) =>
                  addLink(ops, target, item.ref as Ref, label.trim(), author),
                );
                setPicking(false);
                setLabel("");
              }}
            />
          </div>
        </Modal>
      )}
    </section>
  );
}
