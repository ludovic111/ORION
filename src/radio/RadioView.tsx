import { useMemo, useState } from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import {
  dateTime,
  time,
  type Fields,
  type Journal,
} from "../../shared/journal";
import {
  CHECK_LABELS,
  activeAssignment,
  issueTerminal,
  radioSummary,
  removeTalkgroup,
  removeTerminal,
  returnTerminal,
  stationStatus,
  terminalSeries,
  terminalState,
  type Radio,
  type Station,
  type Talkgroup,
  type Terminal,
} from "../../shared/radio";
import { talkgroupLabel } from "../print/radio-sheet";
import { Num, useSlider } from "../ui/motion";
import {
  CheckForm,
  IssueForm,
  ReturnForm,
  SeriesForm,
  StationForm,
  TalkgroupForm,
  TerminalForm,
} from "./forms";

type Tab = "plan" | "terminals" | "custody" | "checks";
type Form =
  | { kind: "group"; group?: Talkgroup }
  | { kind: "station"; station?: Station }
  | { kind: "terminal"; terminal?: Terminal }
  | { kind: "series" }
  | { kind: "issue"; terminal?: Terminal }
  | { kind: "return"; terminal: Terminal }
  | { kind: "check"; callsign?: string };

const stateTone = (state: string) =>
  state === "En service"
    ? "accent"
    : state === "Disponible"
      ? "ok"
      : state === "À recharger"
        ? "warn"
        : "crit";

function Score({ result }: { result?: string }) {
  if (!result) return <span className="score none">—</span>;
  return (
    <span
      className={`score score-${result}`}
      title={CHECK_LABELS[result as "3"]}
    >
      {result === "0" ? "✕" : result}
    </span>
  );
}

export function RadioView({
  journal,
  author,
  readOnly,
  onSave,
  onError,
}: {
  journal: Journal;
  author: string;
  readOnly: boolean;
  onSave: (radio: Radio, log?: Partial<Fields>) => void;
  onError: (message: string) => void;
}) {
  const radio = journal.radio;
  const [tab, setTab] = useState<Tab>("plan");
  const [form, setForm] = useState<Form | null>(null);
  const [query, setQuery] = useState("");
  const summary = radioSummary(radio);
  const tabs = useSlider<HTMLDivElement>(tab);
  const lastCheck = radio.checks.at(-1);
  const close = () => setForm(null);
  const save = (value: Radio, log?: Partial<Fields>) => onSave(value, log);
  const edit = (next: Form) => {
    if (!readOnly) setForm(next);
  };
  const needle = query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .trim();
  const match = (...values: string[]) =>
    !needle ||
    values
      .join(" ")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("fr")
      .includes(needle);
  const history = useMemo(
    () =>
      radio.terminals
        .flatMap((t) => t.assignments.map((a) => ({ t, a })))
        .sort((x, y) => Date.parse(y.a.issuedAt) - Date.parse(x.a.issuedAt)),
    [radio],
  );
  const columns = [
    ...radio.talkgroups.map((g) => ({
      group: g as Talkgroup | undefined,
      id: g.id,
    })),
    ...(radio.stations.some((s) => !s.primary)
      ? [{ group: undefined, id: "" }]
      : []),
  ];
  return (
    <>
      <dl className="metrics">
        <div>
          <dt>Terminaux</dt>
          <dd>
            <Num value={summary.terminals} />
          </dd>
        </div>
        <div className={summary.issued ? "accent" : ""}>
          <dt>En service</dt>
          <dd>
            <Num value={summary.issued} />
          </dd>
        </div>
        <div>
          <dt>Disponibles</dt>
          <dd>
            <Num value={summary.available} />
          </dd>
        </div>
        <div className={summary.unavailable ? "warn" : ""}>
          <dt>Indisponibles</dt>
          <dd>
            <Num value={summary.unavailable} />
          </dd>
        </div>
        <div>
          <dt>Noms d’appel</dt>
          <dd>
            <Num value={summary.stations} />
          </dd>
        </div>
        <div>
          <dt>Dernier contrôle</dt>
          <dd className="text">
            {lastCheck ? (
              <>
                <Score result={lastCheck.result} /> {lastCheck.callsign} ·{" "}
                {time(lastCheck.at)}
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
      <section className="panel">
        <div className="toolbar">
          <div
            className="segmented slider"
            role="tablist"
            aria-label="Vues radio"
            ref={tabs.ref}
          >
            <span className="slider-pill" ref={tabs.pill} />
            {(
              [
                ["plan", "Plan du réseau", radio.stations.length],
                ["terminals", "Terminaux", radio.terminals.length],
                ["custody", "Remises", history.length],
                ["checks", "Contrôles", radio.checks.length],
              ] as const
            ).map(([value, label, count]) => (
              <button
                role="tab"
                aria-selected={tab === value}
                aria-pressed={tab === value}
                key={value}
                onClick={() => setTab(value)}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <div className="search">
            <Search size={14} />
            <input
              aria-label="Filtrer"
              placeholder="Filtrer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="icon-button"
                aria-label="Effacer"
                onClick={() => setQuery("")}
              >
                <X size={13} />
              </button>
            )}
          </div>
          {!readOnly && (
            <div className="toolbar-actions">
              {tab === "plan" && (
                <>
                  <button onClick={() => edit({ kind: "group" })}>
                    <Plus size={14} />
                    Groupe
                  </button>
                  <button
                    className="primary"
                    onClick={() => edit({ kind: "station" })}
                  >
                    <Plus size={14} />
                    Nom d’appel
                  </button>
                </>
              )}
              {tab === "terminals" && (
                <>
                  <button onClick={() => edit({ kind: "series" })}>
                    Série
                  </button>
                  <button onClick={() => edit({ kind: "terminal" })}>
                    <Plus size={14} />
                    Terminal
                  </button>
                  <button
                    className="primary"
                    disabled={!summary.available}
                    onClick={() => edit({ kind: "issue" })}
                  >
                    Remettre
                  </button>
                </>
              )}
              {tab === "custody" && (
                <button
                  className="primary"
                  disabled={!summary.available}
                  onClick={() => edit({ kind: "issue" })}
                >
                  Remettre
                </button>
              )}
              {tab === "checks" && (
                <button
                  className="primary"
                  onClick={() => edit({ kind: "check" })}
                >
                  <Plus size={14} />
                  Contrôle
                </button>
              )}
            </div>
          )}
        </div>

        {tab === "plan" && (
          <>
            {columns.length > 0 ? (
              <div className="topology" aria-label="Schéma de liaisons">
                {columns.map(({ group, id }) => {
                  const primary = radio.stations.filter(
                    (s) =>
                      s.primary === id && match(s.callsign, s.role, s.unit),
                  );
                  const fallback = id
                    ? radio.stations.filter(
                        (s) =>
                          s.fallback === id &&
                          match(s.callsign, s.role, s.unit),
                      )
                    : [];
                  return (
                    <div className="net" key={id || "none"}>
                      <button
                        className={`net-head mode-${group?.mode ?? "none"}`}
                        disabled={!group || readOnly}
                        onClick={() => group && edit({ kind: "group", group })}
                      >
                        <span className="net-id">
                          {group ? group.number || "—" : "—"}
                        </span>
                        <strong>{group ? group.name : "Sans groupe"}</strong>
                        <small>
                          {group
                            ? `${group.mode} · ${group.usage}`
                            : "Non affecté"}
                        </small>
                      </button>
                      <ul className="net-nodes">
                        {primary.map((s) => {
                          const status = stationStatus(radio, s.callsign);
                          return (
                            <li key={s.id}>
                              <button
                                className={`node ${status.terminal ? "live" : ""}`}
                                onClick={() =>
                                  edit({ kind: "station", station: s })
                                }
                                disabled={readOnly}
                              >
                                <span className="led" />
                                <span className="node-body">
                                  <strong>{s.callsign}</strong>
                                  <small>
                                    {status.terminal
                                      ? `${status.terminal.label} · ${status.assignment?.holder}`
                                      : s.role || "Sans terminal"}
                                  </small>
                                </span>
                                <Score result={status.check?.result} />
                              </button>
                            </li>
                          );
                        })}
                        {fallback.map((s) => (
                          <li key={`alt-${s.id}`} className="alt">
                            <span className="node ghost">
                              <span className="led" />
                              <span className="node-body">
                                <strong>{s.callsign}</strong>
                                <small>alternative</small>
                              </span>
                            </span>
                          </li>
                        ))}
                        {!primary.length && !fallback.length && (
                          <li className="net-empty">—</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty">
                <p>
                  Plan vide. Créez les groupes (TKG, direct, relais), puis les
                  noms d’appel.
                </p>
                {!readOnly && (
                  <button
                    className="primary"
                    onClick={() => edit({ kind: "group" })}
                  >
                    <Plus size={14} />
                    Premier groupe
                  </button>
                )}
              </div>
            )}
            <div className="table-scroll">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Nom d’appel</th>
                    <th>Fonction · section</th>
                    <th>Titulaire</th>
                    <th>Terminal · RFSI</th>
                    <th>Principal</th>
                    <th>Alternative</th>
                    <th>Contrôle</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {radio.stations
                    .filter((s) => match(s.callsign, s.role, s.unit, s.notes))
                    .map((s) => {
                      const status = stationStatus(radio, s.callsign);
                      return (
                        <tr key={s.id}>
                          <td>
                            <strong>{s.callsign}</strong>
                            {s.notes && <div className="muted">{s.notes}</div>}
                          </td>
                          <td>
                            {s.role || "—"}
                            {s.unit && <div className="muted">{s.unit}</div>}
                          </td>
                          <td>
                            {status.assignment?.holder ?? (
                              <span className="muted">—</span>
                            )}
                          </td>
                          <td className="mono">
                            {status.terminal ? (
                              <>
                                {status.terminal.label}
                                {status.terminal.rfsi && (
                                  <div className="muted">
                                    {status.terminal.rfsi}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="tag dim">Hors réseau</span>
                            )}
                          </td>
                          <td className="mono">
                            {talkgroupLabel(radio, s.primary)}
                          </td>
                          <td className="mono muted">
                            {talkgroupLabel(radio, s.fallback)}
                          </td>
                          <td>
                            <span className="inline">
                              <Score result={status.check?.result} />
                              {status.check && (
                                <span className="mono muted">
                                  {time(status.check.at)}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="row-actions">
                            {!readOnly && (
                              <>
                                <button
                                  className="small"
                                  onClick={() =>
                                    edit({
                                      kind: "check",
                                      callsign: s.callsign,
                                    })
                                  }
                                >
                                  Contrôle
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Modifier ${s.callsign}`}
                                  onClick={() =>
                                    edit({ kind: "station", station: s })
                                  }
                                >
                                  <Pencil size={13} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {radio.talkgroups.length > 0 && (
              <div className="table-scroll">
                <table className="grid dense">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Groupe / canal</th>
                      <th>Mode</th>
                      <th>Emploi</th>
                      <th>Remarques</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {radio.talkgroups.map((g) => (
                      <tr key={g.id}>
                        <td className="mono">{g.number || "—"}</td>
                        <td>{g.name}</td>
                        <td>
                          <span className={`tag mode-${g.mode}`}>{g.mode}</span>
                        </td>
                        <td>{g.usage}</td>
                        <td className="muted">{g.notes || "—"}</td>
                        <td className="row-actions">
                          {!readOnly && (
                            <button
                              className="icon-button"
                              aria-label={`Modifier ${g.name}`}
                              onClick={() => edit({ kind: "group", group: g })}
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "terminals" && (
          <div className="table-scroll">
            <table className="grid">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Modèle</th>
                  <th>RFSI · série</th>
                  <th>État</th>
                  <th>Détenteur</th>
                  <th>Nom d’appel</th>
                  <th>Remis</th>
                  <th>Batt.</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {radio.terminals
                  .filter((t) => {
                    const a = activeAssignment(t);
                    return match(
                      t.label,
                      t.model,
                      t.rfsi,
                      t.serial,
                      a?.holder ?? "",
                      a?.callsign ?? "",
                    );
                  })
                  .map((t) => {
                    const a = activeAssignment(t);
                    const state = terminalState(t);
                    return (
                      <tr
                        key={t.id}
                        className={
                          state === "Manquant" || state === "Défectueux"
                            ? "dim-row"
                            : ""
                        }
                      >
                        <td className="mono">
                          <strong>{t.label}</strong>
                        </td>
                        <td>
                          {t.model || "—"}
                          <div className="muted">{t.kind}</div>
                        </td>
                        <td className="mono">
                          {t.rfsi || "—"}
                          {t.serial && <div className="muted">{t.serial}</div>}
                        </td>
                        <td>
                          <span className={`state ${stateTone(state)}`}>
                            {state}
                          </span>
                          {a && t.condition !== "Opérationnel" && (
                            <div className="muted">{t.condition}</div>
                          )}
                        </td>
                        <td>
                          {a ? (
                            <>
                              {a.holder}
                              {a.role && <div className="muted">{a.role}</div>}
                            </>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {a?.callsign || <span className="muted">—</span>}
                        </td>
                        <td className="mono">
                          {a ? (
                            dateTime(a.issuedAt)
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {a ? a.battery : <span className="muted">—</span>}
                        </td>
                        <td className="row-actions">
                          {!readOnly && (
                            <>
                              {a ? (
                                <button
                                  className="small"
                                  onClick={() =>
                                    edit({ kind: "return", terminal: t })
                                  }
                                >
                                  Retour
                                </button>
                              ) : (
                                <button
                                  className="small"
                                  disabled={
                                    state === "Défectueux" ||
                                    state === "Manquant"
                                  }
                                  onClick={() =>
                                    edit({ kind: "issue", terminal: t })
                                  }
                                >
                                  Remettre
                                </button>
                              )}
                              <button
                                className="icon-button"
                                aria-label={`Modifier ${t.label}`}
                                onClick={() =>
                                  edit({ kind: "terminal", terminal: t })
                                }
                              >
                                <Pencil size={13} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {!radio.terminals.length && (
              <div className="empty">
                <p>Aucun terminal.</p>
                {!readOnly && (
                  <button
                    className="primary"
                    onClick={() => edit({ kind: "series" })}
                  >
                    <Plus size={14} />
                    Ajouter une série
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "custody" && (
          <div className="table-scroll">
            <table className="grid">
              <thead>
                <tr>
                  <th>Terminal</th>
                  <th>Détenteur</th>
                  <th>Nom d’appel</th>
                  <th>Remise</th>
                  <th>Accessoires</th>
                  <th>Retour</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {history
                  .filter(({ t, a }) =>
                    match(t.label, a.holder, a.callsign, a.role, a.unit),
                  )
                  .map(({ t, a }) => (
                    <tr key={a.id} className={a.returnedAt ? "" : "live-row"}>
                      <td className="mono">
                        <strong>{t.label}</strong>
                      </td>
                      <td>
                        {a.holder}
                        {(a.role || a.unit) && (
                          <div className="muted">
                            {[a.role, a.unit].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </td>
                      <td>{a.callsign || "—"}</td>
                      <td className="mono">
                        {dateTime(a.issuedAt)}
                        <div className="muted">
                          {a.issuedBy} · batt. {a.battery.toLowerCase()}
                        </div>
                      </td>
                      <td className="muted">{a.accessories || "—"}</td>
                      <td className="mono">
                        {a.returnedAt ? (
                          <>
                            {dateTime(a.returnedAt)}
                            <div className="muted">{a.returnedBy}</div>
                          </>
                        ) : (
                          <span className="state accent">En cours</span>
                        )}
                      </td>
                      <td>
                        {a.returnCondition ? (
                          <span
                            className={`state ${stateTone(a.returnCondition === "Opérationnel" ? "Disponible" : a.returnCondition)}`}
                          >
                            {a.returnCondition}
                          </span>
                        ) : (
                          "—"
                        )}
                        {a.notes && <div className="muted">{a.notes}</div>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!history.length && (
              <div className="empty">
                <p>Aucune remise.</p>
              </div>
            )}
          </div>
        )}

        {tab === "checks" && (
          <div className="table-scroll">
            <table className="grid">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Nom d’appel</th>
                  <th>Groupe / canal</th>
                  <th>Audibilité</th>
                  <th>Par</th>
                  <th>Remarques</th>
                </tr>
              </thead>
              <tbody>
                {[...radio.checks]
                  .reverse()
                  .filter((c) => match(c.callsign, c.notes, c.by))
                  .map((c) => (
                    <tr
                      key={c.id}
                      className={
                        c.result === "0" || c.result === "1" ? "urgent" : ""
                      }
                    >
                      <td className="mono">{dateTime(c.at)}</td>
                      <td>
                        <strong>{c.callsign}</strong>
                      </td>
                      <td className="mono">
                        {talkgroupLabel(radio, c.talkgroupId)}
                      </td>
                      <td>
                        <span className="inline">
                          <Score result={c.result} />
                          {CHECK_LABELS[c.result]}
                        </span>
                      </td>
                      <td>{c.by}</td>
                      <td className="muted">{c.notes || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!radio.checks.length && (
              <div className="empty">
                <p>Aucun contrôle de liaison.</p>
              </div>
            )}
          </div>
        )}
        <footer className="panel-foot">
          <span>
            Audibilité : 3 bon · 2 faible · 1 insuffisant · ✕ pas de liaison
          </span>
          <span>Nom d’appel = fonction</span>
        </footer>
      </section>

      {form?.kind === "group" && (
        <TalkgroupForm
          radio={radio}
          group={form.group}
          onClose={close}
          onSave={(value) => save(value)}
          onDelete={(id) => save(removeTalkgroup(radio, id))}
        />
      )}
      {form?.kind === "station" && (
        <StationForm
          radio={radio}
          station={form.station}
          onClose={close}
          onSave={(value) => save(value)}
        />
      )}
      {form?.kind === "terminal" && (
        <TerminalForm
          radio={radio}
          terminal={form.terminal}
          onClose={close}
          onSave={(value) => save(value)}
          onDelete={(id) => save(removeTerminal(radio, id))}
        />
      )}
      {form?.kind === "series" && (
        <SeriesForm
          radio={radio}
          onClose={close}
          onSave={(value) => save(value)}
          series={terminalSeries}
        />
      )}
      {form?.kind === "issue" && (
        <IssueForm
          radio={radio}
          terminal={form.terminal}
          author={author}
          onClose={close}
          onIssue={(terminalId, value, log) => {
            const terminal = radio.terminals.find((t) => t.id === terminalId)!;
            save(
              issueTerminal(radio, terminalId, value),
              log
                ? {
                    happenedAt: value.issuedAt,
                    receivedAt: value.issuedAt,
                    message: `Remise du terminal ${terminal.label}${terminal.rfsi ? ` (RFSI ${terminal.rfsi})` : ""} à ${value.holder}${value.callsign ? `, nom d’appel ${value.callsign}` : ""}.`,
                    source: author,
                    recipient: value.holder,
                    notes: [
                      value.accessories &&
                        `Accessoires : ${value.accessories}.`,
                      `Batterie : ${value.battery.toLowerCase()}.`,
                      value.notes,
                    ]
                      .filter(Boolean)
                      .join(" "),
                  }
                : undefined,
            );
          }}
        />
      )}
      {form?.kind === "return" && (
        <ReturnForm
          terminal={form.terminal}
          onClose={close}
          onReturn={(at, condition, notes, log) => {
            const open = activeAssignment(form.terminal)!;
            save(
              returnTerminal(
                radio,
                form.terminal.id,
                at,
                author,
                condition,
                notes,
              ),
              log
                ? {
                    happenedAt: at,
                    receivedAt: at,
                    message: `Retour du terminal ${form.terminal.label} par ${open.holder}. État : ${condition.toLowerCase()}.`,
                    source: open.holder,
                    recipient: author,
                    notes,
                    priority: condition === "Manquant" ? "Urgent" : "Normal",
                    status:
                      condition === "Manquant" || condition === "Défectueux"
                        ? "À traiter"
                        : "Consigné",
                  }
                : undefined,
            );
          }}
        />
      )}
      {form?.kind === "check" && (
        <CheckForm
          radio={radio}
          author={author}
          callsign={form.callsign}
          onClose={close}
          onCheck={(check, log) => {
            try {
              save(
                {
                  ...radio,
                  checks: [...radio.checks, check].sort(
                    (a, b) => Date.parse(a.at) - Date.parse(b.at),
                  ),
                },
                log
                  ? {
                      happenedAt: check.at,
                      receivedAt: check.at,
                      channel: "Radio",
                      message: `Contrôle de liaison ${check.callsign} : ${CHECK_LABELS[check.result]}${check.talkgroupId ? ` sur ${talkgroupLabel(radio, check.talkgroupId)}` : ""}.`,
                      source: check.callsign,
                      notes: check.notes,
                    }
                  : undefined,
              );
            } catch (err) {
              onError((err as Error).message);
              throw err;
            }
          }}
        />
      )}
    </>
  );
}
