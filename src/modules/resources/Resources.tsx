import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Box,
  ChevronDown,
  CopyPlus,
  House,
  Kanban,
  LayoutGrid,
  Link2,
  List,
  MapPin,
  Megaphone,
  Package,
  Plane,
  Plus,
  Printer,
  Radio,
  Search,
  Ship,
  Timer,
  Tractor,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { time } from "../../../shared/journal";
import { RESOURCE_STATUSES, upsert, type Resource } from "../../../shared/ops";
import { parseRef, ref, type Ref } from "../../../shared/links";
import { useApp } from "../../app/context";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import { Segmented, Toggle } from "../../ui/fields";
import { HoverCard, LinkChip } from "../../ui/links";
import { Popover } from "../../ui/Popover";
import { CountUp } from "../../ui/effects";
import type { SheetTable } from "../../print/radio-sheet";
import { Requests } from "./Requests";
import { WAITING, requestLate } from "../../../shared/requests";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { t, tn } from "./i18n.ts";
import "./resources.css";

type Status = (typeof RESOURCE_STATUSES)[number];
type Draft = Omit<Resource, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<Resource, "id" | "createdAt" | "updatedAt" | "by">>;
type View = "board" | "list" | "tiles";
type SortKey =
  | "name"
  | "kind"
  | "count"
  | "organization"
  | "callsign"
  | "status"
  | "location"
  | "eta"
  | "links";

const LOG_KEY = "orion-aic-resources-log";
const TAB_KEY = "orion-aic-resources-tab";
const VIEW_KEY = "orion-aic-resources-view";

const STATUS_TONE: Record<Status, string> = {
  Disponible: "ok",
  Alerté: "warn",
  "En route": "accent",
  Engagé: "res-engaged",
  "De retour": "muted",
  "Hors service": "crit",
};
const STATUS_COLOR: Record<Status, string> = {
  Disponible: "var(--ok)",
  Alerté: "var(--warn)",
  "En route": "var(--accent)",
  Engagé: "var(--cyan)",
  "De retour": "var(--text-3)",
  "Hors service": "var(--crit)",
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .trim();

// Types are free texts (référentiel of the journal, in its language):
// French words first, then German and Italian ones.
function kindIcon(kind: string): LucideIcon {
  const k = norm(kind);
  if (
    /personn|equipe|troupe|detachement|personal|mannschaft|trupp|squadra|distaccament/.test(
      k,
    )
  )
    return Users;
  if (/aerien|helico|avion|drone|luft|flugzeug|aere|elicott/.test(k))
    return Plane;
  if (/embarcation|bateau|navire|boot|schiff|imbarcazion|barca/.test(k))
    return Ship;
  if (
    /engin|tracteur|pelle|grue|spezialfahrzeug|traktor|bagger|kran|mezzo speciale|trattore|escavat/.test(
      k,
    )
  )
    return Tractor;
  if (/hebergement|abri|logement|unterkunft|schutzraum|alloggi|rifugi/.test(k))
    return House;
  if (
    /materiel|lot|groupe electrogene|pompe|material|stromaggregat|pumpe|generatore|pompa/.test(
      k,
    )
  )
    return Package;
  if (
    /vehicule|camion|voiture|bus|ambulance|fahrzeug|lastwagen|ambulanz|veicol|autocarro/.test(
      k,
    )
  )
    return Truck;
  return Box;
}

const blank = (status: Status = "Disponible"): Draft => ({
  name: "",
  kind: "",
  organization: "",
  callsign: "",
  count: 1,
  status,
  location: "",
  mission: "",
  eta: "",
  contact: "",
  notes: "",
});

const fieldsOf = (r: Draft): Draft => ({
  name: r.name,
  kind: r.kind,
  organization: r.organization,
  callsign: r.callsign,
  count: r.count,
  status: r.status,
  location: r.location,
  mission: r.mission,
  eta: r.eta,
  contact: r.contact,
  notes: r.notes,
});

function readLocal(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: keep the setting for this session only */
  }
}

/** "Tonne-pompe 2" → "Tonne-pompe 3", unique among existing names. */
function nextName(name: string, taken: Set<string>) {
  const match = /^(.*?)(\s*)(\d+)$/.exec(name);
  const base = match ? match[1] : name;
  const space = match ? match[2] || " " : " ";
  let n = match ? Number(match[3]) + 1 : 2;
  while (taken.has(norm(`${base}${space}${n}`))) n++;
  return `${base}${space}${n}`.slice(0, 120);
}

function etaLabel(eta: string, now: number): { text: string; late: boolean } {
  const none = { text: "", late: false };
  if (!eta) return none;
  const minutes = Math.round((Date.parse(eta) - now) / 60000);
  if (Number.isNaN(minutes)) return none;
  if (minutes > 90)
    return { text: t("arrivée à {time}", { time: time(eta) }), late: false };
  if (minutes > 0)
    return { text: t("arrivée dans {n} min", { n: minutes }), late: false };
  if (minutes === 0) return { text: t("arrivée imminente"), late: false };
  const late = -minutes;
  return {
    late: true,
    text:
      late < 60
        ? t("retard de {n} min", { n: late })
        : t("retard de {h} h {mm}", {
            h: Math.floor(late / 60),
            mm: String(late % 60).padStart(2, "0"),
          }),
  };
}

export function Resources() {
  const {
    journal,
    author,
    readOnly,
    canWrite,
    now,
    graph,
    updateOps,
    focus,
    setFocus,
    open,
    toast,
    print,
    addEntry,
  } = useApp();
  const resources = journal.ops.resources;
  const [view, setViewState] = useState<View>(() => {
    const saved = readLocal(VIEW_KEY);
    return saved === "list" || saved === "tiles" ? saved : "board";
  });
  const setView = (v: View) => {
    setViewState(v);
    writeLocal(VIEW_KEY, v);
  };
  // Resources or requests for resources (Requests.tsx).
  const [tab, setTabState] = useState<"resources" | "requests">(() =>
    readLocal(TAB_KEY) === "requests" ? "requests" : "resources",
  );
  const setTab = (v: "resources" | "requests") => {
    setTabState(v);
    writeLocal(TAB_KEY, v);
  };
  const [creating, setCreating] = useState(0);
  const clearCreating = useCallback(() => setCreating(0), []);
  useEffect(() => {
    if (focus?.startsWith("request:")) setTabState("requests");
  }, [focus]);
  const waitingRequests = journal.ops.requests.filter((r) =>
    WAITING.includes(r.status),
  );
  const lateRequests = waitingRequests.filter((r) =>
    requestLate(r, now),
  ).length;
  const [logChanges, setLogChanges] = useState(
    () => readLocal(LOG_KEY) === "1",
  );
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; up: boolean }>({
    key: "status",
    up: true,
  });

  useEffect(() => {
    if (!focus?.startsWith("resource:")) return;
    const { id } = parseRef(focus);
    setFocus(null);
    if (id === "new") {
      if (!readOnly) setEditing(blank());
      return;
    }
    const found = resources.find((r) => r.id === id);
    if (found) setEditing(found);
    else toast(t("Ce moyen n’existe plus."));
  }, [focus, resources, readOnly, setFocus, toast]);

  const kinds = useMemo(
    () =>
      [...new Set(resources.map((r) => r.kind).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "fr"),
      ),
    [resources],
  );
  const organizations = useMemo(
    () =>
      [...new Set(resources.map((r) => r.organization).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "fr"),
      ),
    [resources],
  );
  const callsigns = useMemo(
    () => journal.radio.stations.map((s) => s.callsign),
    [journal.radio.stations],
  );
  const contactNames = useMemo(
    () => journal.ops.contacts.map((c) => c.name),
    [journal.ops.contacts],
  );

  const visible = useMemo(() => {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    return resources.filter((r) => {
      if (kindFilter && r.kind !== kindFilter) return false;
      if (orgFilter && r.organization !== orgFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (!terms.length) return true;
      const hay = norm(
        [
          r.name,
          r.kind,
          r.organization,
          r.callsign,
          r.location,
          r.mission,
          r.contact,
          r.notes,
          r.status,
          enumLabel(r.status),
        ].join(" "),
      );
      return terms.every((t) => hay.includes(t));
    });
  }, [resources, query, kindFilter, orgFilter, statusFilter]);

  const totals = useMemo(() => {
    const byStatus = new Map<Status, number>();
    let people = 0;
    let vehicles = 0;
    for (const r of resources) {
      byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
      const k = norm(r.kind);
      if (k.includes("personnel")) people += r.count;
      else if (/vehicule|engin/.test(k)) vehicles += r.count;
    }
    return { byStatus, people, vehicles };
  }, [resources]);

  const placeOf = (id: string): Ref | undefined => {
    const self = ref("resource", id);
    for (const e of graph.edges) {
      if (e.a === self && e.b.startsWith("place:")) return e.b;
      if (e.b === self && e.a.startsWith("place:")) return e.a;
    }
    return undefined;
  };

  // Status changes waiting to be written to the journal. addEntry replaces
  // the whole journal from its latest rendered state, so it must run after
  // the resource update has been rendered, never in the same tick.
  const pendingLogs = useRef<{ id: string; message: string }[]>([]);
  useEffect(() => {
    const queue = pendingLogs.current.splice(0);
    for (const item of queue)
      try {
        addEntry(
          {
            type: "Observation",
            channel: "Sur place",
            message: item.message,
            tags: [t("moyens")],
          },
          [ref("resource", item.id)],
        );
      } catch (err) {
        toast((err as Error).message);
      }
  }, [journal, addEntry, toast]);

  function logChange(
    r: { id: string; name: string },
    from: string,
    to: string,
  ) {
    if (!logChanges || from === to) return;
    pendingLogs.current.push({
      id: r.id,
      message: t("{name} : {from} → {to}", {
        name: r.name,
        from: enumLabel(from),
        to: enumLabel(to),
      }),
    });
  }

  function setStatus(r: Resource, status: Status) {
    if (r.status === status || !canWrite()) return;
    try {
      updateOps((ops) => upsert(ops, "resources", { ...r, status }, author));
      logChange(r, r.status, status);
      toast(
        t("{name} : {status}", { name: r.name, status: enumLabel(status) }),
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function duplicate(r: Draft & { id: string }) {
    const taken = new Set(resources.map((x) => norm(x.name)));
    const copy: Draft = {
      ...blank(),
      ...fieldsOf(r),
      id: crypto.randomUUID(),
      name: nextName(r.name, taken),
    };
    try {
      updateOps((ops) => upsert(ops, "resources", copy, author));
      toast(t("« {name} » ajouté.", { name: copy.name }));
      setEditing(copy);
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function placeOnMap(id: string) {
    setEditing(null);
    open(`place:new:resource:${id}` as Ref);
  }

  function printBoard() {
    const tables: SheetTable[] = RESOURCE_STATUSES.map((status) => {
      const list = resources
        .filter((r) => r.status === status)
        .sort((a, b) => a.name.localeCompare(b.name, "fr"));
      const count = list.reduce((sum, r) => sum + r.count, 0);
      return {
        id: status,
        title: enumLabel(status),
        caption: `${tn(list.length, "{n} moyen", "{n} moyens")} · ${tn(count, "{n} unité", "{n} unités")}`,
        head: [
          t("Désignation"),
          t("Type"),
          t("Nb"),
          t("Organisation"),
          t("Nom d’appel"),
          t("Lieu"),
          t("Mission"),
          t("Arrivée"),
          t("Contact"),
          t("Remarques"),
        ],
        widths: [34, 24, 12, 30, 24, 32, 45, 20, 26, 22],
        body: list.map((r) => [
          r.name,
          r.kind || "—",
          String(r.count),
          r.organization || "—",
          r.callsign || "—",
          r.location || "—",
          r.mission || "—",
          r.eta ? time(r.eta) : "—",
          r.contact || "—",
          r.notes || "—",
        ]),
      };
    }).filter((t) => t.body.length);
    if (!tables.length) {
      toast(t("Aucun moyen à imprimer."));
      return;
    }
    print({
      kind: "tables",
      journal,
      title: t("Tableau des moyens"),
      extra: t("Établi par {author}", { author }),
      tables,
      landscape: true,
      name: t("moyens (fichier)"),
    });
  }

  // A request is followed in the "Demandes" tab (demandé → arrivé).
  const requestResources = () => {
    setTab("requests");
    setCreating((n) => n + 1);
  };

  const spec: FieldSpec[] = [
    { kind: "group", label: t("Identification") },
    {
      key: "name",
      label: t("Désignation"),
      kind: "text",
      required: true,
      max: 120,
      placeholder: t("ex. Tonne-pompe 1, Section PCi Nord"),
      wide: true,
    },
    {
      key: "kind",
      label: t("Type"),
      kind: "combo",
      list: "resourceKinds",
      quick: 8,
      wide: true,
    },
    {
      key: "count",
      label: t("Nombre"),
      kind: "number",
      hint: t("Véhicules, personnes, lots…"),
    },
    {
      key: "organization",
      label: t("Organisation"),
      kind: "combo",
      list: "organizations",
    },
    {
      key: "callsign",
      label: t("Nom d’appel"),
      kind: "combo",
      options: callsigns,
      hint: callsigns.length
        ? undefined
        : t("Les noms d’appel du réseau radio sont proposés ici."),
    },
    {
      key: "contact",
      label: t("Contact"),
      kind: "combo",
      options: contactNames,
      placeholder: t("Responsable, chef de groupe…"),
    },
    { kind: "group", label: t("Engagement") },
    {
      kind: "custom",
      key: "status",
      wide: true,
      render: (value, set) => (
        <div className="res-status-field">
          <span className="label" id="res-status-label">
            {t("État")}
          </span>
          <div role="radiogroup" aria-labelledby="res-status-label">
            {RESOURCE_STATUSES.map((s) => (
              <button
                type="button"
                key={s}
                role="radio"
                aria-checked={value.status === s}
                className={`res-chip ${STATUS_TONE[s]}`}
                style={{ "--tone": STATUS_COLOR[s] } as CSSProperties}
                onClick={() => set({ status: s })}
              >
                {enumLabel(s)}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    { key: "location", label: t("Lieu / position"), kind: "text", max: 300 },
    {
      key: "eta",
      label: t("Arrivée prévue"),
      kind: "datetime",
      hint: t("Compte à rebours affiché quand le moyen est en route."),
    },
    {
      key: "mission",
      label: t("Mission"),
      kind: "area",
      max: 2000,
      rows: 3,
    },
    { kind: "group", label: t("Détails") },
    { key: "notes", label: t("Remarques"), kind: "area", max: 2000 },
  ];

  const sorted = useMemo(() => {
    const order = (r: Resource): string | number => {
      switch (sort.key) {
        case "count":
          return r.count;
        case "status":
          return RESOURCE_STATUSES.indexOf(r.status);
        case "eta":
          return r.eta ? Date.parse(r.eta) : Number.MAX_SAFE_INTEGER;
        case "links":
          return graph.degree.get(ref("resource", r.id)) ?? 0;
        default:
          return norm(r[sort.key]);
      }
    };
    return [...visible].sort((a, b) => {
      const x = order(a);
      const y = order(b);
      const diff =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), "fr");
      return (sort.up ? diff : -diff) || a.name.localeCompare(b.name, "fr");
    });
  }, [visible, sort, graph.degree]);

  const filtered = query || kindFilter || orgFilter || statusFilter;
  const cardProps = {
    now,
    readOnly,
    degree: (id: string) => graph.degree.get(ref("resource", id)) ?? 0,
    onOpen: (r: Resource) => setEditing(r),
    onStatus: setStatus,
    onPlace: (r: Resource) => {
      const place = placeOf(r.id);
      if (place) open(place);
      else placeOnMap(r.id);
    },
    hasPlace: (id: string) => !!placeOf(id),
  };

  return (
    <>
      <ModuleHead
        actions={
          <>
            {tab === "resources" && (
              <button onClick={printBoard} disabled={!resources.length}>
                <Printer size={14} />
                {t("Imprimer")}
              </button>
            )}
            <button onClick={requestResources} disabled={readOnly}>
              <Megaphone size={14} />
              {t("Demander des moyens")}
            </button>
            <button
              className="primary"
              disabled={readOnly}
              onClick={() => setEditing(blank())}
            >
              <Plus size={15} />
              {t("Ajouter un moyen")}
            </button>
          </>
        }
      />
      <div className="res-tabs">
        <Segmented
          label={t("Moyens ou demandes")}
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "resources",
              label: (
                <>
                  <Truck size={13} />{" "}
                  {t("Moyens · {n}", { n: resources.length })}
                </>
              ),
            },
            {
              value: "requests",
              label: (
                <>
                  <Megaphone size={13} />{" "}
                  {t("Demandes · {n}", { n: waitingRequests.length })}
                  {lateRequests > 0 && (
                    <span className="pill crit">
                      {t("{n} en retard", { n: lateRequests })}
                    </span>
                  )}
                </>
              ),
            },
          ]}
        />
      </div>

      {tab === "requests" ? (
        <Requests create={creating} onCreated={clearCreating} />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<Truck size={28} />}
          title={t("Aucun moyen pour l’instant")}
          actions={
            !readOnly && (
              <>
                <button className="primary" onClick={() => setEditing(blank())}>
                  <Plus size={15} />
                  {t("Ajouter un moyen")}
                </button>
                <button onClick={requestResources}>
                  <Megaphone size={14} />
                  {t("Demander des moyens")}
                </button>
              </>
            )
          }
        >
          {t(
            "Notez ici les véhicules, le personnel et le matériel : leur état, leur lieu et leur mission. Glissez les cartes d’une colonne à l’autre pour changer leur état.",
          )}
        </EmptyState>
      ) : (
        <>
          <section
            className="res-summary reveal"
            aria-label={t("Résumé des moyens")}
          >
            <div className="res-stats">
              <div className="stat">
                <strong>
                  <CountUp value={resources.length} />
                </strong>
                <span>{t("moyens")}</span>
              </div>
              <div className="stat">
                <strong>
                  <CountUp value={totals.people} />
                </strong>
                <span>{t("personnes")}</span>
              </div>
              <div className="stat">
                <strong>
                  <CountUp value={totals.vehicles} />
                </strong>
                <span>{t("véhicules et engins")}</span>
              </div>
            </div>
            <div
              className="res-status-pills"
              role="group"
              aria-label={t("Filtrer par état")}
            >
              {RESOURCE_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`pill ${STATUS_TONE[s]}`}
                  aria-pressed={statusFilter === s}
                  onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                  title={
                    statusFilter === s
                      ? t("Afficher tous les états")
                      : t("Afficher seulement « {status} »", {
                          status: enumLabel(s),
                        })
                  }
                >
                  {enumLabel(s)}
                  <b>{totals.byStatus.get(s) ?? 0}</b>
                </button>
              ))}
            </div>
          </section>

          <div className="res-toolbar">
            <div className="search">
              <Search size={14} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Rechercher un moyen, un lieu, une mission…")}
                aria-label={t("Rechercher un moyen")}
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label={t("Effacer la recherche")}
                  onClick={() => setQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <select
              className="res-filter"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              aria-label={t("Filtrer par type")}
            >
              <option value="">{t("Tous les types")}</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select
              className="res-filter"
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              aria-label={t("Filtrer par organisation")}
            >
              <option value="">{t("Toutes les organisations")}</option>
              {organizations.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <Segmented
              label={t("Affichage")}
              value={view}
              onChange={setView}
              options={[
                {
                  value: "board",
                  label: (
                    <>
                      <Kanban size={13} /> {t("Tableau")}
                    </>
                  ),
                },
                {
                  value: "list",
                  label: (
                    <>
                      <List size={13} /> {t("Liste")}
                    </>
                  ),
                },
                {
                  value: "tiles",
                  label: (
                    <>
                      <LayoutGrid size={13} /> {t("Tuiles")}
                    </>
                  ),
                },
              ]}
            />
            <Toggle
              className="res-log-toggle"
              label={t("Consigner les changements d’état au journal")}
              checked={logChanges}
              onChange={(v) => {
                setLogChanges(v);
                writeLocal(LOG_KEY, v ? "1" : "0");
              }}
            />
          </div>

          {filtered && !visible.length && (
            <p className="muted res-none">
              {t("Aucun moyen ne correspond.")}{" "}
              <button
                className="link"
                onClick={() => {
                  setQuery("");
                  setKindFilter("");
                  setOrgFilter("");
                  setStatusFilter("");
                }}
              >
                {t("Tout afficher")}
              </button>
            </p>
          )}

          {view === "board" && (
            <Board
              resources={visible}
              statuses={statusFilter ? [statusFilter] : [...RESOURCE_STATUSES]}
              onAdd={(status) => setEditing(blank(status))}
              {...cardProps}
            />
          )}
          {view === "tiles" && visible.length > 0 && (
            <div className="tile-grid stagger">
              {[...visible]
                .sort(
                  (a, b) =>
                    RESOURCE_STATUSES.indexOf(a.status) -
                      RESOURCE_STATUSES.indexOf(b.status) ||
                    a.name.localeCompare(b.name, "fr"),
                )
                .map((r) => (
                  <ResourceCard key={r.id} resource={r} {...cardProps} />
                ))}
            </div>
          )}
          {view === "list" && visible.length > 0 && (
            <ResourceTable
              rows={sorted}
              sort={sort}
              onSort={(key) =>
                setSort((s) => ({ key, up: s.key === key ? !s.up : true }))
              }
              {...cardProps}
            />
          )}
        </>
      )}

      {editing && (
        <RecordSheet<Draft>
          key={editing.id ?? "new"}
          collection="resources"
          kind="resource"
          noun={t("un moyen")}
          spec={spec}
          initial={editing}
          onClose={() => setEditing(null)}
          validate={(v) =>
            v.name.trim() ? "" : t("La désignation est nécessaire.")
          }
          afterSave={(v) => {
            if (editing.id) logChange(v, editing.status, v.status);
          }}
        >
          {(saved) => {
            const place = placeOf(saved.id);
            const contact = journal.ops.contacts.find(
              (c) => saved.contact && norm(c.name) === norm(saved.contact),
            );
            return (
              <div className="res-sheet-actions">
                {place ? (
                  <button type="button" onClick={() => open(place)}>
                    <MapPin size={14} />
                    {t("Voir sur la carte")}
                  </button>
                ) : (
                  !readOnly && (
                    <button type="button" onClick={() => placeOnMap(saved.id)}>
                      <MapPin size={14} />
                      {t("Placer sur la carte")}
                    </button>
                  )
                )}
                {!readOnly && (
                  <button type="button" onClick={() => duplicate(saved)}>
                    <CopyPlus size={14} />
                    {t("Dupliquer")}
                  </button>
                )}
                {contact && (
                  <span className="res-sheet-contact">
                    <span className="label">{t("Contact")}</span>
                    <LinkChip target={ref("contact", contact.id)} />
                  </span>
                )}
              </div>
            );
          }}
        </RecordSheet>
      )}
    </>
  );
}

type CardProps = {
  now: number;
  readOnly: boolean;
  degree: (id: string) => number;
  onOpen: (r: Resource) => void;
  onStatus: (r: Resource, status: Status) => void;
  onPlace: (r: Resource) => void;
  hasPlace: (id: string) => boolean;
};

function Board({
  resources,
  statuses,
  onAdd,
  ...card
}: CardProps & {
  resources: Resource[];
  statuses: Status[];
  onAdd: (status: Status) => void;
}) {
  const [over, setOver] = useState<Status | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const drop = (e: DragEvent, status: Status) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/x-orion-resource") || dragging;
    const r = resources.find((x) => x.id === id);
    if (r) card.onStatus(r, status);
    setDragging(null);
  };
  return (
    <div className="kanban res-board">
      {statuses.map((status) => {
        const list = resources
          .filter((r) => r.status === status)
          .sort((a, b) => a.name.localeCompare(b.name, "fr"));
        const units = list.reduce((sum, r) => sum + r.count, 0);
        return (
          <section
            key={status}
            className={`lane res-lane ${over === status ? "drop" : ""}`}
            style={{ "--tone": STATUS_COLOR[status] } as CSSProperties}
            aria-label={t("{status} : {n} moyen(s)", {
              status: enumLabel(status),
              n: list.length,
            })}
            onDragOver={(e) => {
              if (card.readOnly || !dragging) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (over !== status) setOver(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setOver(null);
            }}
            onDrop={(e) => drop(e, status)}
          >
            <header className="lane-head">
              <span className="res-lane-dot" aria-hidden="true" />
              <strong>{enumLabel(status)}</strong>
              <span className="count" title={t("{n} unité(s)", { n: units })}>
                {list.length}
              </span>
              {!card.readOnly && (
                <button
                  className="icon-button"
                  aria-label={t("Ajouter un moyen « {status} »", {
                    status: enumLabel(status),
                  })}
                  title={t("Ajouter ici")}
                  onClick={() => onAdd(status)}
                >
                  <Plus size={14} />
                </button>
              )}
            </header>
            {list.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                draggable={!card.readOnly}
                dragging={dragging === r.id}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/x-orion-resource", r.id);
                  e.dataTransfer.setData("text/plain", r.name);
                  e.dataTransfer.effectAllowed = "move";
                  setDragging(r.id);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setOver(null);
                }}
                {...card}
              />
            ))}
            {!list.length && (
              <p className="res-lane-empty">
                {card.readOnly ? t("Aucun moyen") : t("Déposez un moyen ici")}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function useHoverPreview() {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    hover,
    enter: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType !== "mouse") return;
      const box = e.currentTarget.getBoundingClientRect();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const right = box.right + 10;
        setHover(
          right + 330 < window.innerWidth
            ? { x: right, y: box.top }
            : { x: box.left, y: box.bottom + 6 },
        );
      }, 600);
    },
    leave: () => {
      clearTimeout(timer.current);
      setHover(null);
    },
  };
}

function StatusMenu({
  resource,
  onStatus,
  compact = false,
}: {
  resource: Resource;
  onStatus: (r: Resource, status: Status) => void;
  compact?: boolean;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  // Portalled menu: keep its clicks from reaching the card or the row.
  return (
    <span className="res-status-wrap" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`pill ${STATUS_TONE[resource.status]} res-status-button`}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-label={t("État : {status}. Changer l’état", {
          status: enumLabel(resource.status),
        })}
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(anchor ? null : e.currentTarget);
        }}
      >
        {compact ? "" : enumLabel(resource.status)}
        <ChevronDown size={11} />
      </button>
      {anchor && (
        <Popover anchor={anchor} onClose={() => setAnchor(null)}>
          <div className="menu-label">{t("Changer l’état")}</div>
          {RESOURCE_STATUSES.map((s) => (
            <button
              key={s}
              role="menuitemradio"
              aria-checked={resource.status === s}
              aria-current={resource.status === s}
              data-close
              onClick={(e) => {
                e.stopPropagation();
                onStatus(resource, s);
              }}
            >
              <span
                className="res-menu-dot"
                style={{ background: STATUS_COLOR[s] }}
                aria-hidden="true"
              />
              {enumLabel(s)}
            </button>
          ))}
        </Popover>
      )}
    </span>
  );
}

function ResourceCard({
  resource: r,
  now,
  readOnly,
  degree,
  onOpen,
  onStatus,
  onPlace,
  hasPlace,
  draggable = false,
  dragging = false,
  onDragStart,
  onDragEnd,
}: CardProps & {
  resource: Resource;
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
}) {
  const { hover, enter, leave } = useHoverPreview();
  const Icon = kindIcon(r.kind);
  const links = degree(r.id);
  const { text: eta, late } =
    r.status === "En route" ? etaLabel(r.eta, now) : { text: "", late: false };
  const placed = hasPlace(r.id);
  return (
    <article
      className={`tile res-card ${dragging ? "dragging" : ""}`}
      style={{ "--tone": STATUS_COLOR[r.status] } as CSSProperties}
      draggable={draggable}
      onDragStart={(e) => {
        leave();
        onDragStart?.(e);
      }}
      onDragEnd={onDragEnd}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onClick={() => onOpen(r)}
    >
      <div className="tile-top">
        <span className="res-icon" aria-hidden="true">
          <Icon size={17} />
        </span>
        <button
          type="button"
          className="res-card-name"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(r);
          }}
        >
          {r.name}
          {r.count > 1 && <span className="res-count">× {r.count}</span>}
        </button>
        {readOnly ? (
          <span className={`pill ${STATUS_TONE[r.status]}`}>
            {enumLabel(r.status)}
          </span>
        ) : (
          <StatusMenu resource={r} onStatus={onStatus} compact />
        )}
      </div>
      {(r.kind || r.organization) && (
        <small className="res-sub">
          {[r.kind, r.organization].filter(Boolean).join(" · ")}
        </small>
      )}
      {r.mission && <p className="res-mission">{r.mission}</p>}
      {eta && (
        <span className={`res-eta ${late ? "late" : ""}`}>
          <Timer size={12} />
          {eta}
        </span>
      )}
      <div className="meta-line">
        {r.callsign && (
          <span className="res-meta">
            <Radio size={11} />
            {r.callsign}
          </span>
        )}
        {r.location && (
          <span className="res-meta">
            <MapPin size={11} />
            {r.location}
          </span>
        )}
        {links > 0 && (
          <span className="res-meta" title={t("{n} lien(s)", { n: links })}>
            <Link2 size={11} />
            {links}
          </span>
        )}
        {(placed || !readOnly) && (
          <button
            type="button"
            className="icon-button res-map-button"
            aria-label={
              placed
                ? t("Voir {name} sur la carte", { name: r.name })
                : t("Placer {name} sur la carte", { name: r.name })
            }
            title={placed ? t("Voir sur la carte") : t("Placer sur la carte")}
            data-placed={placed || undefined}
            onClick={(e) => {
              e.stopPropagation();
              onPlace(r);
            }}
          >
            <MapPin size={14} />
          </button>
        )}
      </div>
      {hover && (
        <HoverCard target={ref("resource", r.id)} x={hover.x} y={hover.y} />
      )}
    </article>
  );
}

const columns = (): { key: SortKey; label: string }[] => [
  { key: "name", label: t("Désignation") },
  { key: "kind", label: t("Type") },
  { key: "count", label: t("Nb") },
  { key: "organization", label: t("Organisation") },
  { key: "callsign", label: t("Nom d’appel") },
  { key: "status", label: t("État") },
  { key: "location", label: t("Lieu") },
  { key: "eta", label: t("Arrivée") },
  { key: "links", label: t("Liens") },
];

function ResourceTable({
  rows,
  sort,
  onSort,
  now,
  readOnly,
  degree,
  onOpen,
  onStatus,
}: CardProps & {
  rows: Resource[];
  sort: { key: SortKey; up: boolean };
  onSort: (key: SortKey) => void;
}) {
  return (
    <div className="panel reveal">
      <div className="table-scroll">
        <table className="grid res-table">
          <thead>
            <tr>
              {columns().map((c) => (
                <th
                  key={c.key}
                  aria-sort={
                    sort.key === c.key
                      ? sort.up
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className="res-sort"
                    onClick={() => onSort(c.key)}
                  >
                    {c.label}
                    {sort.key === c.key &&
                      (sort.up ? (
                        <ArrowUp size={11} />
                      ) : (
                        <ArrowDown size={11} />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const Icon = kindIcon(r.kind);
              const { text: eta, late } =
                r.status === "En route"
                  ? etaLabel(r.eta, now)
                  : { text: r.eta ? time(r.eta) : "", late: false };
              return (
                <tr key={r.id} className="res-row" onClick={() => onOpen(r)}>
                  <td>
                    <button
                      type="button"
                      className="res-row-name"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(r);
                      }}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {r.name}
                    </button>
                    {r.mission && (
                      <div className="muted res-row-mission">{r.mission}</div>
                    )}
                  </td>
                  <td>{r.kind || <span className="muted">—</span>}</td>
                  <td className="mono">{r.count}</td>
                  <td>{r.organization || <span className="muted">—</span>}</td>
                  <td className="mono">
                    {r.callsign || <span className="muted">—</span>}
                  </td>
                  <td>
                    {readOnly ? (
                      <span className={`pill ${STATUS_TONE[r.status]}`}>
                        {enumLabel(r.status)}
                      </span>
                    ) : (
                      <StatusMenu resource={r} onStatus={onStatus} />
                    )}
                  </td>
                  <td>{r.location || <span className="muted">—</span>}</td>
                  <td className={late ? "crit-text" : ""}>
                    {eta || <span className="muted">—</span>}
                  </td>
                  <td className="mono">{degree(r.id) || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Resources;
