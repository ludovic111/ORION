import { useState } from "react";
import { FileText, Search } from "lucide-react";
import { Badge, Empty, Panel, Status } from "./components";
import { dateTime, shortId } from "./types";
import type { ViewProps } from "./Views";
import {
  conduite,
  deadlineLabels,
  deadlineState,
  handoverDraft,
  isOpen,
} from "../shared/conduite";

export function Conduite(p: ViewProps & { now: Date }) {
  const [filter, setFilter] = useState("open"),
    [search, setSearch] = useState("");
  const board = conduite(p.records, p.operation.id, p.now);
  const open = board.missions.filter(isOpen);
  const late = open.filter((r) => deadlineState(r, p.now) === "late");
  const unassigned = open.filter((r) => !r.data.assignee?.trim());
  const missions = board.missions.filter((r) => {
    const state = deadlineState(r, p.now);
    return (
      (filter === "all" ||
        (filter === "open" && isOpen(r)) ||
        (filter === "late" && state === "late") ||
        (filter === "unassigned" && isOpen(r) && !r.data.assignee?.trim()) ||
        (filter === "completed" && !isOpen(r))) &&
      `${r.data.title} ${r.data.assignee ?? ""} ${r.data.oimde?.mission ?? ""}`
        .toLocaleLowerCase("fr")
        .includes(search.toLocaleLowerCase("fr"))
    );
  });
  return (
    <>
      <div className="page-toolbar">
        <p className="muted">
          Missions, points en suspens et préparation de la relève.
        </p>
        {p.canWrite && p.canLead && (
          <button
            className="primary"
            onClick={() =>
              p.onEdit(
                "report",
                undefined,
                handoverDraft(p.records, p.operation, p.now),
              )
            }
          >
            <FileText size={15} aria-hidden="true" />
            Préparer la relève
          </button>
        )}
      </div>
      <div className="stats">
        {[
          ["Missions ouvertes", open.length, "open"],
          ["Échéances dépassées", late.length, "late"],
          ["Sans responsable", unassigned.length, "unassigned"],
          [
            "Missions terminées",
            board.missions.length - open.length,
            "completed",
          ],
        ].map(([label, count, value]) => (
          <button
            key={value}
            className={`stat panel conduite-stat ${filter === value ? "selected" : ""}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(String(value))}
          >
            <span>{label}</span>
            <div>
              <strong
                className={value === "late" && Number(count) > 0 ? "red" : ""}
              >
                {count}
              </strong>
              <small>Afficher les missions</small>
            </div>
          </button>
        ))}
      </div>
      <Panel title="Contrôle des missions · OIMDE">
        <div className="filterbar">
          <Search size={14} aria-hidden="true" />
          <input
            aria-label="Rechercher une mission ou un responsable"
            name="mission-search"
            autoComplete="off"
            placeholder="Mission, responsable…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Afficher les missions"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="open">Ouvertes</option>
            <option value="late">Échéances dépassées</option>
            <option value="unassigned">Sans responsable</option>
            <option value="completed">Terminées</option>
            <option value="all">Toutes</option>
          </select>
          <span className="muted">{missions.length} résultat(s)</span>
        </div>
        <div className="conduite-table">
          <table>
            <thead>
              <tr>
                <th>Mission / priorité</th>
                <th>Responsable</th>
                <th>Échéance · heure de Genève</th>
                <th>Statut</th>
                <th>
                  <span className="sr-only">Consulter</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {missions.map((r) => {
                const state = deadlineState(r, p.now);
                return (
                  <tr key={r.id}>
                    <td>
                      <Status value={r.data.priority ?? ""} />{" "}
                      <strong>{r.data.title}</strong>
                      <small className="conduite-reference">{shortId(r)}</small>
                    </td>
                    <td>
                      {r.data.assignee?.trim() || (
                        <Badge tone="amber">À attribuer</Badge>
                      )}
                    </td>
                    <td>
                      {r.data.oimde?.deadline && (
                        <div>{dateTime(r.data.oimde.deadline)}</div>
                      )}
                      <Badge
                        tone={
                          state === "late"
                            ? "red"
                            : state === "soon"
                              ? "amber"
                              : "muted"
                        }
                      >
                        {deadlineLabels[state]}
                      </Badge>
                    </td>
                    <td>
                      <Status value={r.data.status ?? ""} />
                    </td>
                    <td>
                      <button
                        aria-label={`Ouvrir la mission ${r.data.title}`}
                        onClick={() => p.onEdit("journal", r)}
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!missions.length && (
          <Empty>Aucune mission ne correspond à ces critères.</Empty>
        )}
        <p className="conduite-note muted">
          Une échéance dépassée ne modifie pas la priorité attribuée par le
          commandement. Les statuts reposent sur les saisies du journal.
        </p>
      </Panel>
      <div className="conduite-pending">
        <Panel title={`Demandes ouvertes · ${board.requests.length}`}>
          {board.requests.map((r) => (
            <button
              className="conduite-item"
              key={r.id}
              onClick={() => p.onEdit("journal", r)}
            >
              <Status value={r.data.priority ?? ""} />
              <span>
                <strong>{r.data.title}</strong>
                <small>
                  {r.data.assignee || "Responsable à préciser"} ·{" "}
                  {r.data.status}
                </small>
              </span>
            </button>
          ))}
          {!board.requests.length && <Empty>Aucune demande ouverte.</Empty>}
        </Panel>
        <Panel title={`Transmissions à suivre · ${board.transmissions.length}`}>
          {board.transmissions.map((r) => (
            <button
              className="conduite-item"
              key={r.id}
              onClick={() => p.onEdit("transmission", r)}
            >
              <Status value={r.data.status ?? ""} />
              <span>
                <strong>{r.data.title}</strong>
                <small>
                  {r.data.recipient} · {r.data.channel}
                </small>
              </span>
            </button>
          ))}
          {!board.transmissions.length && (
            <Empty>Aucune transmission en attente.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
