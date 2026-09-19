import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Edit3,
  Filter,
  Plus,
  Printer,
  Link2,
  MapPin,
  FileDown,
  CheckCircle2,
} from "lucide-react";
import type { Data, Kind, Operation, RecordItem, SymbolItem } from "./types";
import {
  recordTitle,
  shortId,
  time,
  dateTime,
  resourceStatuses,
} from "./types";
import { Panel, Badge, Status, Empty, AddButton } from "./components";
import { MapView } from "./MapView";
export type ViewProps = {
  records: RecordItem[];
  operation: Operation;
  canWrite: boolean;
  canLead: boolean;
  onEdit: (kind: Kind, item?: RecordItem, preset?: Data) => void;
  onNavigate: (page: string) => void;
  onUpdate: (item: RecordItem, data: Data) => Promise<void>;
};
export function Dashboard(p: ViewProps) {
  const journals = p.records.filter((r) => r.kind === "journal"),
    resources = p.records.filter((r) => r.kind === "resource"),
    maps = p.records.filter((r) => r.kind === "map");
  const personnel = resources
      .filter((r) => r.data.status === "Engagé")
      .reduce((sum, r) => sum + (r.data.personnel ?? 0), 0),
    total = resources.reduce((sum, r) => sum + (r.data.personnel ?? 0), 0);
  return (
    <>
      <div className="stats">
        {[
          [
            "Renseignements ouverts",
            journals.filter((r) =>
              ["Ouvert", "En cours"].includes(r.data.status ?? ""),
            ).length,
            "entrées à suivre",
            "red",
          ],
          ["Personnel engagé", personnel, `sur ${total} recensés`, "green"],
          [
            "Moyens en route",
            resources.filter((r) => r.data.status === "En route").length,
            "formations et partenaires",
            "amber",
          ],
          [
            "Niveau d’engagement",
            `Niv. ${p.operation.level}`,
            p.operation.mode === "exercise"
              ? "scénario d’exercice"
              : p.operation.phase,
            "red",
          ],
        ].map(([label, value, detail, color]) => (
          <div className="stat panel" key={label}>
            <span>{label}</span>
            <div>
              <strong className={String(color)}>{value}</strong>
              <small>{detail}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="Carte de conduite"
          className="dashboard-map"
          action={
            <button className="text-button" onClick={() => p.onNavigate("map")}>
              Plein écran <ArrowUpRight size={13} />
            </button>
          }
        >
          <MapView
            records={maps}
            compact
            onSelect={() => p.onNavigate("map")}
          />
          <div className="map-legend">
            <span className="red">● Dommages</span>
            <span className="blue">● Moyens</span>
            <span>● Mesures</span>
            <span className="amber">● Dangers</span>
            <button
              className="text-button"
              onClick={() => p.onNavigate("symbols")}
            >
              Signes conventionnels
            </button>
          </div>
        </Panel>
        <div className="dashboard-right">
          <Panel
            title="Journal d’intervention"
            className="journal-feed"
            action={
              <button
                className="text-button"
                onClick={() => p.onNavigate("journal")}
              >
                Tout voir <ArrowUpRight size={13} />
              </button>
            }
          >
            {journals.slice(0, 7).map((r) => (
              <button
                className="feed-entry"
                key={r.id}
                onClick={() => p.onEdit("journal", r)}
              >
                <span className="mono muted">{time(r.created_at)}</span>
                <Status value={r.data.priority ?? "P3"} />
                <div>
                  <p>{r.data.title}</p>
                  <small>
                    {shortId(r)} · {r.data.type} · {r.data.source}
                  </small>
                </div>
                <span className="feed-status">
                  <Status value={r.data.status ?? ""} />
                </span>
              </button>
            ))}
            {!journals.length && (
              <Empty>
                Aucune entrée. Consignez le premier renseignement reçu.
              </Empty>
            )}
          </Panel>
          <Panel
            title="Formations engagées"
            action={
              <button
                className="text-button"
                onClick={() => p.onNavigate("resources")}
              >
                Tableau des moyens
              </button>
            }
          >
            <div className="mini-resources">
              {resources
                .filter((r) => r.data.organization === "PCi")
                .sort(
                  (a, b) =>
                    [
                      "Engagé",
                      "En route",
                      "Disponible",
                      "Repos / Indisponible",
                    ].indexOf(a.data.status ?? "") -
                    [
                      "Engagé",
                      "En route",
                      "Disponible",
                      "Repos / Indisponible",
                    ].indexOf(b.data.status ?? ""),
                )
                .slice(0, 6)
                .map((r) => (
                  <button key={r.id} onClick={() => p.onEdit("resource", r)}>
                    <strong>{r.data.name}</strong>
                    <span>{r.data.specialty}</span>
                    <span className="mono">{r.data.personnel}</span>
                    <Status value={r.data.status ?? ""} />
                  </button>
                ))}
              {!resources.length && <Empty>Aucun moyen recensé.</Empty>}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
export function Journal(p: ViewProps) {
  const [type, setType] = useState("Tous"),
    [priority, setPriority] = useState("Toutes"),
    [status, setStatus] = useState("Tous"),
    [selected, setSelected] = useState<string | null>(null),
    [search, setSearch] = useState("");
  const entries = p.records.filter((r) => r.kind === "journal"),
    filtered = entries.filter(
      (r) =>
        (type === "Tous" || r.data.type === type) &&
        (priority === "Toutes" || r.data.priority === priority) &&
        (status === "Tous" || r.data.status === status) &&
        `${r.data.title} ${r.data.source} ${shortId(r)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const missions = entries
    .filter(
      (r) => r.data.oimde && !["Traité", "Clos"].includes(r.data.status ?? ""),
    )
    .sort((a, b) =>
      a.data.oimde!.deadline.localeCompare(b.data.oimde!.deadline),
    );
  const current = entries.find((r) => r.id === selected) ?? filtered[0];
  return (
    <>
      <div className="page-toolbar">
        <div className="tabs">
          {[
            ["Tous", "Journal principal"],
            ["Rapport", "Rapports"],
            ["Ordre", "Ordres"],
            ["Demande", "Demandes"],
            ["Alerte", "Alertes"],
          ].map(([v, l]) => (
            <button
              className={type === v ? "active" : ""}
              key={v}
              onClick={() => setType(v)}
            >
              {l}
            </button>
          ))}
        </div>
        {p.canWrite && (
          <AddButton primary onClick={() => p.onEdit("journal")}>
            Nouvelle entrée
          </AddButton>
        )}
      </div>
      <div className="filterbar">
        <Filter size={14} />
        <label>
          Priorité{" "}
          <select
            aria-label="Filtrer par priorité"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {["Toutes", "P1", "P2", "P3", "P4"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Statut{" "}
          <select
            aria-label="Filtrer par statut"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["Tous", "Ouvert", "En cours", "Traité", "Clos"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <input
          aria-label="Rechercher dans le journal"
          placeholder="Rechercher dans le journal…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="muted">
          {filtered.length} / {entries.length} entrées
        </span>
        <button
          className="text-button"
          onClick={() => {
            setPriority("Toutes");
            setStatus("Tous");
            setType("Tous");
            setSearch("");
          }}
        >
          Réinitialiser
        </button>
      </div>
      {missions.length > 0 && (
        <Panel title="Suivi des missions · OIMDE">
          <div className="mission-followup">
            {missions.map((r) => (
              <button
                key={r.id}
                className="text-button"
                onClick={() => setSelected(r.id)}
              >
                <Status
                  value={
                    new Date(r.data.oimde!.deadline).getTime() < Date.now()
                      ? "P1"
                      : "P3"
                  }
                />
                <span>
                  {r.data.title} · {r.data.assignee || "Responsable à préciser"}
                </span>
                <span className="mono">
                  Échéance {dateTime(r.data.oimde!.deadline)}
                </span>
              </button>
            ))}
          </div>
        </Panel>
      )}
      <div className="split-view">
        <Panel className="table-panel">
          <table>
            <thead>
              <tr>
                {[
                  "Heure",
                  "N°",
                  "Prio",
                  "Type",
                  "Émetteur",
                  "Message",
                  "Statut",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={current?.id === r.id ? "selected" : ""}
                >
                  <td className="mono">{time(r.created_at)}</td>
                  <td>
                    <button
                      className="text-button mono"
                      onClick={() => setSelected(r.id)}
                    >
                      {shortId(r)}
                    </button>
                  </td>
                  <td>
                    <Status value={r.data.priority ?? ""} />
                  </td>
                  <td>{r.data.type}</td>
                  <td>{r.data.source}</td>
                  <td>
                    <button
                      className="row-message"
                      onClick={() => setSelected(r.id)}
                    >
                      {r.data.title}
                    </button>
                  </td>
                  <td>
                    <Status value={r.data.status ?? ""} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <Empty>Aucune entrée ne correspond aux filtres.</Empty>
          )}
        </Panel>
        {current && (
          <Panel className="detail-panel">
            <div className="detail-top">
              <span className="mono">{shortId(current)}</span>
              <Status value={current.data.priority ?? ""} />
              <Status value={current.data.status ?? ""} />
            </div>
            <h3>{current.data.title}</h3>
            <dl>
              <dt>Reçu</dt>
              <dd>{dateTime(current.created_at)}</dd>
              <dt>Émetteur</dt>
              <dd>{current.data.source}</dd>
              <dt>Localisation</dt>
              <dd>{current.data.location || "Non renseignée"}</dd>
              <dt>Attribué à</dt>
              <dd>{current.data.assignee || "Non attribué"}</dd>
              <dt>Fiabilité</dt>
              <dd>
                <Status value={current.data.reliability ?? ""} />
              </dd>
            </dl>
            {current.data.observedAt && (
              <p className="muted">
                Observation : {dateTime(current.data.observedAt)}
              </p>
            )}
            {current.data.oimde && (
              <section>
                <h4>Ordre OIMDE</h4>
                <dl>
                  {(
                    [
                      ["orientation", "Orientation"],
                      ["intention", "Intention"],
                      ["mission", "Mission"],
                      ["dispositions", "Dispositions particulières"],
                      ["emplacement", "Emplacements"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd className="pre-wrap">{current.data.oimde![key]}</dd>
                    </div>
                  ))}
                </dl>
                <p>Échéance : {dateTime(current.data.oimde.deadline)}</p>
              </section>
            )}
            <h4>Décision / suite à donner</h4>
            <p className="pre-wrap">
              {current.data.decision || "Aucune décision consignée."}
            </p>
            <div className="detail-validation">
              {current.data.validated ? (
                <Badge tone="green">
                  <CheckCircle2 size={12} />
                  Validée
                </Badge>
              ) : (
                <Badge>À valider</Badge>
              )}
              <span className="muted">Version {current.version}</span>
            </div>
            {p.canWrite && (
              <button
                className="primary"
                onClick={() => p.onEdit("journal", current)}
              >
                <Edit3 size={14} />
                Modifier / attribuer
              </button>
            )}
            <h4>Liaisons</h4>
            {p.records
              .filter(
                (r) =>
                  r.kind === "link" &&
                  [r.data.source, r.data.target].includes(current.id),
              )
              .map((r) => (
                <p key={r.id}>
                  <Link2 size={12} /> {r.data.label} ·{" "}
                  {recordTitle(
                    p.records.find(
                      (t) =>
                        t.id ===
                        (r.data.source === current.id
                          ? r.data.target
                          : r.data.source),
                    )!,
                  )}
                </p>
              ))}
            <small className="muted">
              Modifiée le {dateTime(current.updated_at)}
            </small>
          </Panel>
        )}
      </div>
    </>
  );
}
export function Resources(p: ViewProps) {
  const [filter, setFilter] = useState("Tous"),
    [error, setError] = useState(""),
    [moving, setMoving] = useState(false);
  const resources = p.records.filter((r) => r.kind === "resource"),
    formations = resources.filter((r) => r.data.organization === "PCi"),
    partners = resources.filter((r) => r.data.organization !== "PCi"),
    stocks = p.records.filter((r) => r.kind === "stock");
  async function move(id: string, status: string) {
    if (!p.canWrite || moving) return;
    const r = resources.find((r) => r.id === id);
    if (!r || r.data.status === status) return;
    setMoving(true);
    try {
      await p.onUpdate(r, { ...r.data, status });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMoving(false);
    }
  }
  return (
    <>
      <div className="page-toolbar">
        <span className="muted">
          {resources.length} moyens · {partners.length} partenaires · les
          changements d’état sont historisés
        </span>
        {p.canWrite && (
          <div className="actions">
            <AddButton onClick={() => p.onEdit("stock")}>Matériel</AddButton>
            <AddButton primary onClick={() => p.onEdit("resource")}>
              Ajouter un moyen
            </AddButton>
          </div>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      <Panel title="Formations PCi · glisser pour changer d’état">
        <div className="kanban">
          {resourceStatuses.map((status) => (
            <section
              className="kanban-column"
              key={status}
              onDragOver={(e) => {
                if (p.canWrite) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                void move(e.dataTransfer.getData("text/plain"), status);
              }}
            >
              <h3>
                <Status value={status} />
                <span>
                  {formations.filter((r) => r.data.status === status).length}
                </span>
              </h3>
              {formations
                .filter((r) => r.data.status === status)
                .map((r) => (
                  <div
                    className="resource-card"
                    key={r.id}
                    draggable={p.canWrite && !moving}
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", r.id)
                    }
                  >
                    <button
                      className="resource-title"
                      onClick={() => p.onEdit("resource", r)}
                    >
                      {r.data.name}
                      <Edit3 size={13} />
                    </button>
                    <div>
                      <span>{r.data.specialty}</span>
                      <strong>{r.data.personnel} pers.</strong>
                    </div>
                    <small>
                      <MapPin size={12} />
                      {r.data.location || "Emplacement non renseigné"}
                    </small>
                    {p.canWrite && (
                      <select
                        aria-label={`État de ${r.data.name}`}
                        disabled={moving}
                        value={r.data.status}
                        onChange={(e) => void move(r.id, e.target.value)}
                      >
                        {resourceStatuses.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              {!formations.some((r) => r.data.status === status) && (
                <p className="empty-column">Aucune formation</p>
              )}
            </section>
          ))}
        </div>
      </Panel>
      <div className="two-columns">
        <Panel
          title="Partenaires"
          action={
            <select
              aria-label="Filtrer les partenaires"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {[
                "Tous",
                ...new Set(partners.map((r) => r.data.organization ?? "")),
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          }
        >
          {partners
            .filter((r) => filter === "Tous" || r.data.organization === filter)
            .map((r) => (
              <button
                className="partner-row"
                key={r.id}
                onClick={() => p.onEdit("resource", r)}
              >
                <span className="org-code">{r.data.organization}</span>
                <div>
                  <strong>{r.data.name}</strong>
                  <small>
                    {r.data.specialty} · {r.data.location}
                  </small>
                </div>
                <Status value={r.data.status ?? ""} />
              </button>
            ))}
          {!partners.length && <Empty>Aucun partenaire recensé.</Empty>}
        </Panel>
        <Panel title="Matériel et stocks">
          <table>
            <thead>
              <tr>
                <th>Matériel</th>
                <th>Total</th>
                <th>Dispo.</th>
                <th>Lieu</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => p.onEdit("stock", r)}
                    >
                      {r.data.name}
                    </button>
                  </td>
                  <td className="mono">{r.data.total}</td>
                  <td className="mono green">{r.data.available}</td>
                  <td>{r.data.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stocks.length && <Empty>Aucun stock recensé.</Empty>}
        </Panel>
      </div>
    </>
  );
}
export function Links(p: ViewProps) {
  const links = p.records.filter((r) => r.kind === "link"),
    [selected, setSelected] = useState<string | null>(null);
  const nodes = useMemo(
    () =>
      p.records.filter((r) =>
        links.some((l) => l.data.source === r.id || l.data.target === r.id),
      ),
    [p.records],
  );
  const positions = new Map(
    nodes.map((r, i) => [
      r.id,
      {
        x: 470 + Math.cos((i / Math.max(nodes.length, 1)) * Math.PI * 2) * 340,
        y: 300 + Math.sin((i / Math.max(nodes.length, 1)) * Math.PI * 2) * 210,
      },
    ]),
  );
  const active = nodes.find((r) => r.id === selected);
  return (
    <>
      <div className="page-toolbar">
        <p className="muted">
          Relations renseignées par les opérateurs · {links.length} liaisons ·{" "}
          {nodes.length} objets
        </p>
        {p.canWrite && (
          <AddButton primary onClick={() => p.onEdit("link")}>
            Créer une liaison
          </AddButton>
        )}
      </div>
      <div className="split-view">
        <Panel className="graph-panel">
          {nodes.length ? (
            <svg
              viewBox="0 0 940 600"
              aria-label="Graphe des liaisons opérationnelles"
              role="group"
            >
              <defs>
                <marker
                  id="arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0 0L6 3L0 6" fill="#5AA9FF" />
                </marker>
              </defs>
              {links.map((l) => {
                const a = positions.get(l.data.source ?? ""),
                  b = positions.get(l.data.target ?? "");
                if (!a || !b) return null;
                return (
                  <g key={l.id}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#3B5975"
                      strokeWidth="1.5"
                      markerEnd="url(#arrow)"
                    />
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 - 7}
                      textAnchor="middle"
                      fill="#9AA5B6"
                      fontSize="11"
                    >
                      {l.data.label}
                    </text>
                  </g>
                );
              })}
              {nodes.map((r) => {
                const pos = positions.get(r.id)!;
                return (
                  <g
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    aria-label={recordTitle(r)}
                    onClick={() => setSelected(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(r.id);
                      }
                    }}
                    className="graph-node"
                  >
                    <rect
                      x={pos.x - 85}
                      y={pos.y - 25}
                      width="170"
                      height="52"
                      rx="6"
                      fill="#151B24"
                      stroke={
                        selected === r.id
                          ? "#5AA9FF"
                          : r.kind === "journal"
                            ? "#713E49"
                            : "#36566C"
                      }
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 4}
                      textAnchor="middle"
                      fill="#E8ECF2"
                      fontSize="12"
                    >
                      {recordTitle(r).slice(0, 23)}
                      {recordTitle(r).length > 23 ? "…" : ""}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 14}
                      textAnchor="middle"
                      fill="#9AA5B6"
                      fontSize="10"
                    >
                      {r.data.organization ?? r.data.type ?? r.kind} ·{" "}
                      {shortId(r)}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <Empty>
              Créez des objets puis reliez-les pour constituer le graphe de
              situation.
            </Empty>
          )}
        </Panel>
        <Panel title="Objet sélectionné" className="detail-panel">
          {active ? (
            <>
              <Badge tone="blue">{shortId(active)}</Badge>
              <h3>{recordTitle(active)}</h3>
              <p>{active.data.location ?? active.data.source}</p>
              <button onClick={() => p.onEdit(active.kind, active)}>
                <Edit3 size={14} />
                Ouvrir la fiche
              </button>
            </>
          ) : (
            <p className="muted">Sélectionnez un objet du graphe.</p>
          )}
          <h4>Relations du dossier</h4>
          {links.map((l) => (
            <button
              className="link-row"
              key={l.id}
              onClick={() => p.onEdit("link", l)}
            >
              <Link2 size={14} />
              <span>
                {recordTitle(
                  p.records.find((r) => r.id === l.data.source)!,
                ).slice(0, 35)}
                <strong>{l.data.label}</strong>
                {recordTitle(
                  p.records.find((r) => r.id === l.data.target)!,
                ).slice(0, 35)}
              </span>
            </button>
          ))}
        </Panel>
      </div>
    </>
  );
}
export function Transmissions(p: ViewProps) {
  const rows = p.records.filter((r) => r.kind === "transmission");
  return (
    <>
      <div className="page-toolbar">
        <p className="muted">
          Registre des messages radio et téléphoniques · envoi effectué par
          l’opérateur sur son réseau habituel
        </p>
        {p.canWrite && (
          <AddButton primary onClick={() => p.onEdit("transmission")}>
            Consigner un message
          </AddButton>
        )}
      </div>
      <Panel className="table-panel">
        <table>
          <thead>
            <tr>
              {[
                "Heure",
                "Priorité",
                "Canal",
                "Émetteur",
                "Destinataire",
                "Message",
                "État",
                "",
              ].map((v, i) => (
                <th key={i}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="mono">{time(r.created_at)}</td>
                <td>
                  <Status value={r.data.priority ?? ""} />
                </td>
                <td>{r.data.channel}</td>
                <td>{r.data.sender}</td>
                <td>{r.data.recipient}</td>
                <td>{r.data.title}</td>
                <td>
                  <Status value={r.data.status ?? ""} />
                </td>
                <td>
                  <button onClick={() => p.onEdit("transmission", r)}>
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>Aucune transmission consignée.</Empty>}
      </Panel>
    </>
  );
}
export function Reports(p: ViewProps & { onExport: () => void }) {
  const reports = p.records.filter((r) => r.kind === "report"),
    [selected, setSelected] = useState<string | null>(null);
  const current = reports.find((r) => r.id === selected) ?? reports[0];
  const template: Data = {
    title: `Rapport de situation · ${new Date().toLocaleDateString("fr-CH")}`,
    situation: `${p.operation.name}\nLieu : ${p.operation.location}\nPhase : ${p.operation.phase}\n\n${p.records
      .filter((r) => r.kind === "journal" && r.data.priority === "P1")
      .map((r) => `• ${r.data.title} (${r.data.reliability})`)
      .join("\n")}`,
    actions: p.records
      .filter((r) => r.kind === "journal" && r.data.type === "Ordre")
      .map((r) => `• ${r.data.title} — ${r.data.status}`)
      .join("\n"),
    needs: p.records
      .filter(
        (r) =>
          r.kind === "journal" &&
          r.data.type === "Demande" &&
          r.data.status !== "Clos",
      )
      .map((r) => `• ${r.data.title}`)
      .join("\n"),
    outlook: "",
    validated: false,
  };
  return (
    <>
      <div className="page-toolbar">
        <p className="muted">
          Synthèse de situation · rédaction et validation humaines
        </p>
        {p.canLead && (
          <div className="actions">
            <button onClick={p.onExport}>
              <FileDown size={15} />
              Exporter le dossier
            </button>
            {p.canWrite && (
              <AddButton
                primary
                onClick={() => p.onEdit("report", undefined, template)}
              >
                Préparer un rapport
              </AddButton>
            )}
          </div>
        )}
      </div>
      <div className="report-layout">
        <Panel title="Rapports enregistrés">
          {reports.map((r) => (
            <button
              className={`report-list-item ${r.id === current?.id ? "active" : ""}`}
              key={r.id}
              onClick={() => setSelected(r.id)}
            >
              <strong>{r.data.title}</strong>
              <small>{dateTime(r.created_at)}</small>
              <Badge tone={r.data.validated ? "green" : "amber"}>
                {r.data.validated ? "Validé" : "Brouillon"}
              </Badge>
            </button>
          ))}
          {!reports.length && (
            <Empty>
              Aucun rapport. Préparez une synthèse à partir du journal.
            </Empty>
          )}
        </Panel>
        {current ? (
          <article className="report-document">
            <div className="report-actions">
              <Badge tone={current.data.validated ? "green" : "amber"}>
                {current.data.validated ? "Validé" : "Brouillon · non validé"}
              </Badge>
              {p.canLead && (
                <>
                  {p.canWrite && (
                    <button onClick={() => p.onEdit("report", current)}>
                      <Edit3 size={14} />
                      Modifier / valider
                    </button>
                  )}
                  <button onClick={() => window.print()}>
                    <Printer size={14} />
                    Imprimer / PDF
                  </button>
                </>
              )}
            </div>
            <div className="report-heading">
              <img src="/orion.svg" alt="" />
              <div>
                <strong>ORION</strong>
                <p>
                  {p.operation.mode === "exercise" ? "EXERCICE · " : ""}Rapport
                  de situation
                </p>
              </div>
            </div>
            <h1>{current.data.title}</h1>
            <p className="muted">
              {p.operation.name} · {dateTime(current.updated_at)} · version{" "}
              {current.version}
            </p>
            {[
              ["Situation", current.data.situation],
              ["Actions et décisions", current.data.actions],
              ["Besoins et points en suspens", current.data.needs],
              ["Évolution possible", current.data.outlook],
            ].map(([h, t]) => (
              <section key={h}>
                <h2>{h}</h2>
                <p className="pre-wrap">{t || "Non renseigné."}</p>
              </section>
            ))}
            <footer>
              Document interne ·{" "}
              {current.data.validated
                ? "Validé dans ORION"
                : "Brouillon à faire valider"}{" "}
              · {shortId(current)}
            </footer>
          </article>
        ) : (
          <Panel>
            <Empty>Le rapport sélectionné apparaîtra ici.</Empty>
          </Panel>
        )}
      </div>
    </>
  );
}
export function Symbols({
  symbols,
  onUse,
  canWrite,
}: {
  symbols: SymbolItem[];
  onUse: (s: SymbolItem) => void;
  canWrite: boolean;
}) {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("Tous"),
    [examples, setExamples] = useState(false);
  const filtered = symbols.filter(
    (s) =>
      (examples || !/exemple/i.test(s.name)) &&
      (group === "Tous" || s.group === group) &&
      s.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="symbol-intro">
        <p>
          Fichiers originaux de l’Office fédéral de la protection de la
          population. Les couleurs et tracés des SVG sont conservés.
        </p>
        <a
          href="https://www.babs.admin.ch/fr/documents-de-formation"
          target="_blank"
          rel="noreferrer"
        >
          Source OFPP · édition 2026 <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="filterbar">
        <input
          aria-label="Rechercher un signe"
          placeholder="Rechercher un signe conventionnel…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Catégorie de signes"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          {["Tous", ...new Set(symbols.map((s) => s.group))].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <span className="muted">
          {filtered.length} fichiers / {symbols.length}
        </span>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={examples}
          onChange={(e) => setExamples(e.target.checked)}
        />
        Afficher aussi les exemples de référence (non plaçables)
      </label>
      <div className="symbol-grid">
        {filtered.map((s) => (
          <div className="symbol-card" key={s.id}>
            <div className="symbol-image">
              <img src={`/symbols/display/${s.id}.svg`} alt={s.name} />
            </div>
            <strong>{s.name}</strong>
            <small>{s.group}</small>
            {canWrite && !/exemple/i.test(s.name) && (
              <button className="text-button" onClick={() => onUse(s)}>
                <Plus size={13} />
                Placer sur la carte
              </button>
            )}
          </div>
        ))}
      </div>
      {!filtered.length && (
        <Empty>Aucun signe ne correspond à votre recherche.</Empty>
      )}
    </>
  );
}
