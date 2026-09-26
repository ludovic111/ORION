import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CircleHelp,
  Crosshair,
  ExternalLink,
  Maximize2,
  Minus,
  Network,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { RefKind } from "../../../shared/ops";
import { KIND_INFO, searchItems, type Ref } from "../../../shared/links";
import { useApp } from "../../app/context";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { Toggle } from "../../ui/fields";
import {
  HoverCard,
  KIND_ICON,
  LinkChip,
  LinksPanel,
  hueStyle,
} from "../../ui/links";
import { NetworkEngine, type LinkSpec, type NodeSpec } from "./engine";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { rich } from "../../i18n";
import { t, tn } from "./i18n.ts";
import "./network.css";

const KINDS = Object.keys(KIND_INFO) as RefKind[];
const STORE = "orion.network.filters";

type Filters = { hidden: RefKind[]; linkedOnly: boolean };

function loadFilters(): Filters {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) ?? "null");
    if (raw && Array.isArray(raw.hidden))
      return {
        hidden: raw.hidden.filter((k: string) => k in KIND_INFO),
        linkedOnly: !!raw.linkedOnly,
      };
  } catch {
    // Storage unavailable: defaults.
  }
  return { hidden: [], linkedOnly: false };
}

export function NetworkModule() {
  const { graph, open, go, help } = useApp();
  const [filters, setFilters] = useState<Filters>(loadFilters);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Ref | null>(null);
  const [hover, setHover] = useState<{ ref: Ref; x: number; y: number } | null>(
    null,
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<NetworkEngine | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(filters));
    } catch {
      // Private mode: the filters are simply not remembered.
    }
  }, [filters]);

  const hidden = useMemo(() => new Set(filters.hidden), [filters.hidden]);
  const counts = useMemo(() => {
    const map = new Map<RefKind, number>();
    for (const i of graph.items) map.set(i.kind, (map.get(i.kind) ?? 0) + 1);
    return map;
  }, [graph.items]);
  const kinds = useMemo(() => KINDS.filter((k) => counts.get(k)), [counts]);

  const visible = useMemo(
    () =>
      graph.items.filter(
        (i) =>
          !hidden.has(i.kind) &&
          (!filters.linkedOnly || (graph.degree.get(i.ref) ?? 0) > 0),
      ),
    [graph.items, graph.degree, hidden, filters.linkedOnly],
  );

  const data = useMemo(() => {
    const cluster = new Map(kinds.map((k, i) => [k, i]));
    const nodes: NodeSpec[] = visible.map((i) => ({
      ref: i.ref,
      hue: KIND_INFO[i.kind].hue,
      title: i.title,
      tone: i.tone,
      degree: graph.degree.get(i.ref) ?? 0,
      cluster: cluster.get(i.kind) ?? 0,
    }));
    const shown = new Set(nodes.map((n) => n.ref));
    const links: LinkSpec[] = graph.edges
      .filter((e) => shown.has(e.a) && shown.has(e.b))
      .map((e) => ({ a: e.a, b: e.b, explicit: !!e.linkId, label: e.label }));
    return { nodes, links };
  }, [visible, graph.edges, graph.degree, kinds]);

  const matches = useMemo(
    () => (query.trim() ? searchItems(visible, query).slice(0, 200) : []),
    [visible, query],
  );

  const top = useMemo(
    () =>
      [...graph.degree.entries()]
        .filter(([ref]) => graph.byRef.has(ref))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [graph.degree, graph.byRef],
  );
  const manual = graph.edges.filter((e) => e.linkId).length;
  const hasLinks = graph.edges.length > 0;

  // Engine lifetime: created once the canvas exists.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new NetworkEngine(canvas, {
      hover: (ref, x, y) =>
        setHover(ref ? { ref: ref as Ref, x: x + 16, y: y + 16 } : null),
      select: (ref) => setSelected(ref as Ref | null),
      open: (ref) => openRef.current(ref as Ref),
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [hasLinks]);

  useEffect(() => {
    engineRef.current?.setData(data.nodes, data.links);
  }, [data, hasLinks]);

  useEffect(() => {
    if (selected && !data.nodes.some((n) => n.ref === selected))
      setSelected(null);
  }, [data, selected]);

  useEffect(() => {
    engineRef.current?.setSelected(selected);
  }, [selected, hasLinks]);

  useEffect(() => {
    const refs = matches.map((m) => m.ref);
    engineRef.current?.setMatches(refs);
    if (!refs.length) return;
    const timer = setTimeout(() => engineRef.current?.fit(refs), 450);
    return () => clearTimeout(timer);
  }, [matches]);

  const panelShift = () => (window.innerWidth > 900 ? 360 : 0);
  const selectFirst = () => {
    const first = matches[0];
    if (!first) return;
    setSelected(first.ref);
    engineRef.current?.centerOn(first.ref, panelShift());
  };
  const toggleKind = (kind: RefKind) =>
    setFilters((f) => ({
      ...f,
      hidden: f.hidden.includes(kind)
        ? f.hidden.filter((k) => k !== kind)
        : [...f.hidden, kind],
    }));

  if (!hasLinks)
    return (
      <>
        <ModuleHead />
        <EmptyState
          icon={<Network size={28} />}
          title={t("Aucun lien pour l’instant")}
          actions={
            <>
              <button className="primary" onClick={() => go("journal")}>
                <BookOpen size={15} />
                {t("Ouvrir le journal")}
              </button>
              <button onClick={() => help("network")}>
                <CircleHelp size={15} />
                {t("Comment ça marche")}
              </button>
            </>
          }
        >
          {graph.items.length
            ? `${t("{n} élément(s) attendent d’être reliés.", { n: graph.items.length })} `
            : ""}
          {t(
            "Les liens apparaissent tout seuls : mêmes noms d’appel, émetteurs et destinataires, références comme « Suite de #012 », message inscrit au journal, membres d’un poste. Vous pouvez aussi relier deux éléments à la main avec le bouton « Lier » de chaque fiche.",
          )}
        </EmptyState>
      </>
    );

  const item = selected ? graph.byRef.get(selected) : undefined;
  const Icon = item ? KIND_ICON[item.kind] : null;

  return (
    <>
      <ModuleHead />
      <section className="net-shell">
        <div className="net-toolbar">
          <div className="search net-search">
            <Search size={14} />
            <input
              value={query}
              placeholder={t("Chercher dans le réseau…")}
              aria-label={t("Chercher dans le réseau")}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") selectFirst();
                if (e.key === "Escape") setQuery("");
              }}
            />
            {query && (
              <>
                <span className="net-found mono">{matches.length}</span>
                <button
                  className="icon-button"
                  aria-label={t("Effacer la recherche")}
                  onClick={() => setQuery("")}
                >
                  <X size={13} />
                </button>
              </>
            )}
          </div>
          <Toggle
            className="net-toggle"
            label={t("Masquer les éléments sans lien")}
            checked={filters.linkedOnly}
            onChange={(linkedOnly) => setFilters((f) => ({ ...f, linkedOnly }))}
          />
          <p className="net-stats">
            {rich(
              t("<0>{nodes}</0> éléments · <1>{links}</1> liens affichés", {
                nodes: data.nodes.length,
                links: data.links.length,
              }),
              [<strong />, <strong />],
            )}
            <span className="muted">
              {" "}
              {t("({total} au total, dont {manual} créés à la main)", {
                total: graph.edges.length,
                manual,
              })}
            </span>
          </p>
        </div>
        <div
          className="net-kinds"
          role="group"
          aria-label={t("Types d’éléments affichés")}
        >
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              className="net-kind"
              style={hueStyle(kind)}
              aria-pressed={!hidden.has(kind)}
              onClick={() => toggleKind(kind)}
              title={
                hidden.has(kind) ? t("Afficher ce type") : t("Masquer ce type")
              }
            >
              <i />
              {KIND_INFO[kind].plural}
              <small>{counts.get(kind)}</small>
            </button>
          ))}
          {filters.hidden.length > 0 && (
            <button
              type="button"
              className="small"
              onClick={() => setFilters((f) => ({ ...f, hidden: [] }))}
            >
              {t("Tout afficher")}
            </button>
          )}
        </div>
        <div className="net-stage">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            role="img"
            aria-label={t(
              "Réseau de {nodes} éléments et {links} liens. Glisser pour déplacer, molette ou + et − pour zoomer.",
              { nodes: data.nodes.length, links: data.links.length },
            )}
          />
          {!data.nodes.length && (
            <div className="net-note">
              {t(
                "Aucun élément affiché. Réactivez un type ci-dessus ou désactivez « Masquer les éléments sans lien ».",
              )}
            </div>
          )}
          <div className="net-controls">
            <button
              className="icon-button"
              aria-label={t("Zoomer")}
              title={t("Zoomer")}
              onClick={() => engineRef.current?.zoomBy(1.35)}
            >
              <Plus size={16} />
            </button>
            <button
              className="icon-button"
              aria-label={t("Dézoomer")}
              title={t("Dézoomer")}
              onClick={() => engineRef.current?.zoomBy(1 / 1.35)}
            >
              <Minus size={16} />
            </button>
            <button
              className="net-fit"
              onClick={() => engineRef.current?.fit()}
              title={t("Afficher tout le réseau")}
            >
              <Maximize2 size={14} />
              {t("Recentrer")}
            </button>
          </div>
          <dl className="net-legend" aria-label={t("Légende")}>
            <div>
              <dt>
                <i className="net-line strong" />
              </dt>
              <dd>{t("lien créé à la main")}</dd>
            </div>
            <div>
              <dt>
                <i className="net-line" />
              </dt>
              <dd>{t("lien automatique")}</dd>
            </div>
            <div>
              <dt>
                <i className="net-ring" />
              </dt>
              <dd>{t("urgent")}</dd>
            </div>
            <div>
              <dt>
                <i className="net-size" />
              </dt>
              <dd>{t("taille = nombre de liens")}</dd>
            </div>
          </dl>
          {item && Icon && (
            <aside
              className="net-panel"
              aria-label={t("Élément sélectionné")}
              key={item.ref}
            >
              <div className="net-panel-head" style={hueStyle(item.kind)}>
                <Icon size={14} />
                <span className="label">{KIND_INFO[item.kind].label}</span>
                {item.tone === "crit" && (
                  <span className="pill crit">{enumLabel("Urgent")}</span>
                )}
                <button
                  className="icon-button"
                  aria-label={t("Fermer")}
                  onClick={() => setSelected(null)}
                >
                  <X size={15} />
                </button>
              </div>
              <h3>{item.title}</h3>
              {item.subtitle && <p className="muted">{item.subtitle}</p>}
              <div className="net-panel-actions">
                <button
                  className="primary small"
                  onClick={() => open(item.ref)}
                >
                  <ExternalLink size={13} />
                  {t("Ouvrir")}
                </button>
                <button
                  className="small"
                  onClick={() =>
                    engineRef.current?.centerOn(item.ref, panelShift())
                  }
                >
                  <Crosshair size={13} />
                  {t("Centrer")}
                </button>
              </div>
              <LinksPanel target={item.ref} />
            </aside>
          )}
        </div>
        <footer className="net-foot">
          <span className="label">{t("Les plus reliés")}</span>
          <div className="net-top">
            {top.map(([ref, n]) => (
              <LinkChip
                key={ref}
                target={ref as Ref}
                label={tn(n, "{n} lien", "{n} liens")}
              />
            ))}
          </div>
          <span className="muted net-hint">
            {t(
              "Survoler : voir les liens · Clic : détails · Double-clic : ouvrir",
            )}
          </span>
        </footer>
      </section>
      {hover && hover.ref !== selected && (
        <HoverCard target={hover.ref} x={hover.x} y={hover.y} />
      )}
    </>
  );
}
export default NetworkModule;
