import { useEffect, useMemo, useState } from "react";
import {
  ListChecks,
  Pencil,
  Plus,
  Printer,
  QrCode,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import {
  dateTime,
  time,
  type Fields,
  type Journal,
} from "../../shared/journal";
import {
  BATTERY_HOURS,
  CHECK_RESULTS,
  activeAssignment,
  batteryDue,
  findTerminal,
  scannedLabel,
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
import { GeneralCheck } from "./GeneralCheck";
import { Scanner } from "./Scanner";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { useLang } from "../i18n";
import {
  accessoriesLabel,
  checkLabel,
  terminalStateLabel,
} from "../print/i18n.ts";
import { t, tn } from "./i18n.ts";

type Tab = "plan" | "terminals" | "custody" | "checks";
type Form =
  | { kind: "group"; group?: Talkgroup }
  | { kind: "station"; station?: Station }
  | { kind: "terminal"; terminal?: Terminal }
  | { kind: "series" }
  | { kind: "issue"; terminal?: Terminal }
  | { kind: "return"; terminal: Terminal }
  | { kind: "check"; callsign?: string }
  | { kind: "general" }
  | { kind: "scan" };

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
    <span className={`score score-${result}`} title={checkLabel(result)}>
      {result === "0" ? "✕" : result}
    </span>
  );
}

export function RadioView({
  journal,
  author,
  readOnly,
  at,
  onSave,
  onError,
  onPrint,
  onLabels,
  scan,
  onScanHandled,
}: {
  journal: Journal;
  author: string;
  readOnly: boolean;
  at: number;
  onSave: (radio: Radio, log?: Partial<Fields>) => void;
  onError: (message: string) => void;
  onPrint: (terminalId: string, assignmentId: string) => void;
  onLabels: () => void;
  scan: string;
  onScanHandled: () => void;
}) {
  useLang();
  const radio = journal.radio;
  const [tab, setTab] = useState<Tab>("plan");
  const [form, setForm] = useState<Form | null>(null);
  const [query, setQuery] = useState("");
  const [outstanding, setOutstanding] = useState(false);
  const batteries = radio.terminals.filter((term) => batteryDue(term, at));
  // A scanned label opens the right action: return if issued, else handout.
  function act(terminal: Terminal) {
    setTab("terminals");
    if (readOnly) {
      onError(
        t(
          "Lecture seule : rouvrez le journal ou revenez au direct pour remettre ou reprendre ce terminal.",
        ),
      );
      return;
    }
    const state = terminalState(terminal);
    if (state === "En service") setForm({ kind: "return", terminal });
    else if (state === "Disponible" || state === "À recharger")
      setForm({ kind: "issue", terminal });
    else setForm({ kind: "terminal", terminal });
  }
  useEffect(() => {
    if (!scan) return;
    const terminal = findTerminal(radio, scan);
    if (terminal) act(terminal);
    else
      onError(
        t("Terminal scanné introuvable dans ce journal : {label}.", {
          label: scannedLabel(scan),
        }),
      );
    onScanHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan]);
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
        .flatMap((term) => term.assignments.map((a) => ({ term, a })))
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
          <dt>{t("Terminaux")}</dt>
          <dd>
            <Num value={summary.terminals} />
          </dd>
        </div>
        <div className={summary.issued ? "accent" : ""}>
          <dt>{t("En service")}</dt>
          <dd>
            <Num value={summary.issued} />
          </dd>
        </div>
        <div>
          <dt>{t("Disponibles")}</dt>
          <dd>
            <Num value={summary.available} />
          </dd>
        </div>
        <div className={summary.unavailable ? "warn" : ""}>
          <dt>{t("Indisponibles")}</dt>
          <dd>
            <Num value={summary.unavailable} />
          </dd>
        </div>
        <div className={batteries.length ? "warn" : ""}>
          <dt>{t("Batteries > {h} h", { h: BATTERY_HOURS })}</dt>
          <dd>
            <Num value={batteries.length} />
          </dd>
        </div>
        <div>
          <dt>{t("Noms d’appel")}</dt>
          <dd>
            <Num value={summary.stations} />
          </dd>
        </div>
        <div>
          <dt>{t("Dernier contrôle")}</dt>
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
            aria-label={t("Vues radio")}
            ref={tabs.ref}
          >
            <span className="slider-pill" ref={tabs.pill} />
            {(
              [
                ["plan", t("Plan du réseau"), radio.stations.length],
                ["terminals", t("Terminaux"), radio.terminals.length],
                ["custody", t("Remises"), history.length],
                ["checks", t("Contrôles"), radio.checks.length],
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
              aria-label={t("Filtrer")}
              placeholder={t("Filtrer")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="icon-button"
                aria-label={t("Effacer")}
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
                    {t("Groupe")}
                  </button>
                  <button
                    className="primary"
                    onClick={() => edit({ kind: "station" })}
                  >
                    <Plus size={14} />
                    {t("Nom d’appel")}
                  </button>
                </>
              )}
              {tab === "terminals" && (
                <>
                  <button
                    aria-pressed={outstanding}
                    className={outstanding ? "toggled" : ""}
                    onClick={() => setOutstanding(!outstanding)}
                  >
                    {t("Non rendues")}
                    <span className="count">{summary.issued}</span>
                  </button>
                  <button onClick={() => edit({ kind: "scan" })}>
                    <ScanLine size={14} />
                    {t("Scanner")}
                  </button>
                  <button onClick={onLabels} disabled={!radio.terminals.length}>
                    <QrCode size={14} />
                    {t("Étiquettes")}
                  </button>
                  <button onClick={() => edit({ kind: "series" })}>
                    {t("Série")}
                  </button>
                  <button onClick={() => edit({ kind: "terminal" })}>
                    <Plus size={14} />
                    {t("Terminal")}
                  </button>
                  <button
                    className="primary"
                    disabled={!summary.available}
                    onClick={() => edit({ kind: "issue" })}
                  >
                    {t("Remettre")}
                  </button>
                </>
              )}
              {tab === "custody" && (
                <button
                  className="primary"
                  disabled={!summary.available}
                  onClick={() => edit({ kind: "issue" })}
                >
                  {t("Remettre")}
                </button>
              )}
              {tab === "checks" && (
                <>
                  <button
                    disabled={!radio.stations.length}
                    onClick={() => edit({ kind: "general" })}
                  >
                    <ListChecks size={14} />
                    {t("Contrôle général")}
                  </button>
                  <button
                    className="primary"
                    onClick={() => edit({ kind: "check" })}
                  >
                    <Plus size={14} />
                    {t("Contrôle")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {tab === "plan" && (
          <>
            {columns.length > 0 ? (
              <div className="topology" aria-label={t("Schéma de liaisons")}>
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
                        <strong>{group ? group.name : t("Sans groupe")}</strong>
                        <small>
                          {group
                            ? `${enumLabel(group.mode)} · ${enumLabel(group.usage)}`
                            : t("Non affecté")}
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
                                      : s.role || t("Sans terminal")}
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
                                <small>{t("alternative (nœud)")}</small>
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
                  {t(
                    "Plan vide. Créez les groupes (TKG, direct, relais), puis les noms d’appel.",
                  )}
                </p>
                {!readOnly && (
                  <button
                    className="primary"
                    onClick={() => edit({ kind: "group" })}
                  >
                    <Plus size={14} />
                    {t("Premier groupe")}
                  </button>
                )}
              </div>
            )}
            <div className="table-scroll">
              <table className="grid">
                <thead>
                  <tr>
                    <th>{t("Nom d’appel")}</th>
                    <th>{t("Fonction · section")}</th>
                    <th>{t("Titulaire")}</th>
                    <th>{t("Terminal · RFSI")}</th>
                    <th>{t("Principal")}</th>
                    <th>{t("Alternative")}</th>
                    <th>{t("Contrôle")}</th>
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
                              <span className="tag dim">
                                {t("Hors réseau")}
                              </span>
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
                                  {t("Contrôle")}
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={t("Modifier {name}", {
                                    name: s.callsign,
                                  })}
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
                      <th>{t("N°")}</th>
                      <th>{t("Groupe / canal")}</th>
                      <th>{t("Mode")}</th>
                      <th>{t("Emploi")}</th>
                      <th>{t("Remarques")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {radio.talkgroups.map((g) => (
                      <tr key={g.id}>
                        <td className="mono">{g.number || "—"}</td>
                        <td>{g.name}</td>
                        <td>
                          <span className={`tag mode-${g.mode}`}>
                            {enumLabel(g.mode)}
                          </span>
                        </td>
                        <td>{enumLabel(g.usage)}</td>
                        <td className="muted">{g.notes || "—"}</td>
                        <td className="row-actions">
                          {!readOnly && (
                            <button
                              className="icon-button"
                              aria-label={t("Modifier {name}", {
                                name: g.name,
                              })}
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
                  <th>{t("N°")}</th>
                  <th>{t("Modèle")}</th>
                  <th>{t("RFSI · série")}</th>
                  <th>{t("État")}</th>
                  <th>{t("Détenteur")}</th>
                  <th>{t("Nom d’appel")}</th>
                  <th>{t("Remis")}</th>
                  <th>{t("Batt.")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {radio.terminals
                  .filter((term) => !outstanding || !!activeAssignment(term))
                  .filter((term) => {
                    const a = activeAssignment(term);
                    return match(
                      term.label,
                      term.model,
                      term.rfsi,
                      term.serial,
                      a?.holder ?? "",
                      a?.callsign ?? "",
                    );
                  })
                  .map((term) => {
                    const a = activeAssignment(term);
                    const state = terminalState(term);
                    return (
                      <tr
                        key={term.id}
                        className={
                          state === "Manquant" || state === "Défectueux"
                            ? "dim-row"
                            : ""
                        }
                      >
                        <td className="mono">
                          <strong>{term.label}</strong>
                        </td>
                        <td>
                          {term.model || "—"}
                          <div className="muted">{enumLabel(term.kind)}</div>
                        </td>
                        <td className="mono">
                          {term.rfsi || "—"}
                          {term.serial && (
                            <div className="muted">{term.serial}</div>
                          )}
                        </td>
                        <td>
                          <span className={`state ${stateTone(state)}`}>
                            {terminalStateLabel(state)}
                          </span>
                          {a && term.condition !== "Opérationnel" && (
                            <div className="muted">
                              {enumLabel(term.condition)}
                            </div>
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
                          {a ? (
                            enumLabel(a.battery)
                          ) : (
                            <span className="muted">—</span>
                          )}
                          {batteryDue(term, at) && (
                            <div>
                              <span
                                className="tag warn"
                                title={t("Remis depuis plus de {h} h", {
                                  h: BATTERY_HOURS,
                                })}
                              >
                                &gt; {BATTERY_HOURS} h
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="row-actions">
                          {!readOnly && (
                            <>
                              {a ? (
                                <button
                                  className="small"
                                  onClick={() =>
                                    edit({ kind: "return", terminal: term })
                                  }
                                >
                                  {t("Retour (terminal)")}
                                </button>
                              ) : (
                                <button
                                  className="small"
                                  disabled={
                                    state === "Défectueux" ||
                                    state === "Manquant"
                                  }
                                  onClick={() =>
                                    edit({ kind: "issue", terminal: term })
                                  }
                                >
                                  {t("Remettre")}
                                </button>
                              )}
                              {term.assignments.length > 0 && (
                                <button
                                  className="icon-button"
                                  title={t("Quittance de remise")}
                                  aria-label={t("Quittance de remise {label}", {
                                    label: term.label,
                                  })}
                                  onClick={() =>
                                    onPrint(
                                      term.id,
                                      term.assignments.at(-1)!.id,
                                    )
                                  }
                                >
                                  <Printer size={13} />
                                </button>
                              )}
                              <button
                                className="icon-button"
                                aria-label={t("Modifier {name}", {
                                  name: term.label,
                                })}
                                onClick={() =>
                                  edit({ kind: "terminal", terminal: term })
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
                <p>{t("Aucun terminal.")}</p>
                {!readOnly && (
                  <button
                    className="primary"
                    onClick={() => edit({ kind: "series" })}
                  >
                    <Plus size={14} />
                    {t("Ajouter une série")}
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
                  <th>{t("Terminal")}</th>
                  <th>{t("Détenteur")}</th>
                  <th>{t("Nom d’appel")}</th>
                  <th>{t("Remise")}</th>
                  <th>{t("Accessoires")}</th>
                  <th>{t("Retour (terminal)")}</th>
                  <th>{t("État")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {history
                  .filter(({ term, a }) =>
                    match(term.label, a.holder, a.callsign, a.role, a.unit),
                  )
                  .map(({ term, a }) => (
                    <tr key={a.id} className={a.returnedAt ? "" : "live-row"}>
                      <td className="mono">
                        <strong>{term.label}</strong>
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
                          {a.issuedBy} ·{" "}
                          {t("batt. {level}", {
                            level: enumLabel(a.battery).toLowerCase(),
                          })}
                        </div>
                      </td>
                      <td className="muted">
                        {accessoriesLabel(a.accessories) || "—"}
                      </td>
                      <td className="mono">
                        {a.returnedAt ? (
                          <>
                            {dateTime(a.returnedAt)}
                            <div className="muted">{a.returnedBy}</div>
                          </>
                        ) : (
                          <span className="state accent">
                            {t("En cours (remise)")}
                          </span>
                        )}
                      </td>
                      <td>
                        {a.returnCondition ? (
                          <span
                            className={`state ${stateTone(a.returnCondition === "Opérationnel" ? "Disponible" : a.returnCondition)}`}
                          >
                            {enumLabel(a.returnCondition)}
                          </span>
                        ) : (
                          "—"
                        )}
                        {a.notes && <div className="muted">{a.notes}</div>}
                      </td>
                      <td className="row-actions">
                        <button
                          className="icon-button"
                          title={t("Quittance de remise")}
                          aria-label={t(
                            "Quittance de remise {label} · {holder}",
                            {
                              label: term.label,
                              holder: a.holder,
                            },
                          )}
                          onClick={() => onPrint(term.id, a.id)}
                        >
                          <Printer size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!history.length && (
              <div className="empty">
                <p>{t("Aucune remise.")}</p>
              </div>
            )}
          </div>
        )}

        {tab === "checks" && (
          <div className="table-scroll">
            <table className="grid">
              <thead>
                <tr>
                  <th>{t("Heure")}</th>
                  <th>{t("Nom d’appel")}</th>
                  <th>{t("Groupe / canal")}</th>
                  <th>{t("Audibilité")}</th>
                  <th>{t("Par")}</th>
                  <th>{t("Remarques")}</th>
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
                          {checkLabel(c.result)}
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
                <p>{t("Aucun contrôle de liaison.")}</p>
              </div>
            )}
          </div>
        )}
        <footer className="panel-foot">
          <span>
            {t(
              "Audibilité : 3 bon · 2 faible · 1 insuffisant · ✕ pas de liaison",
            )}
          </span>
          <span>{t("Nom d’appel = fonction")}</span>
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
          onIssue={(terminalId, value, log, print) => {
            const terminal = radio.terminals.find(
              (term) => term.id === terminalId,
            )!;
            const next = issueTerminal(radio, terminalId, value);
            save(
              next,
              log
                ? {
                    happenedAt: value.issuedAt,
                    receivedAt: value.issuedAt,
                    message: t(
                      "Remise du terminal {label}{rfsi} à {holder}{callsign}.",
                      {
                        label: terminal.label,
                        rfsi: terminal.rfsi ? ` (RFSI ${terminal.rfsi})` : "",
                        holder: value.holder,
                        callsign: value.callsign
                          ? t(", nom d’appel {callsign}", {
                              callsign: value.callsign,
                            })
                          : "",
                      },
                    ),
                    source: author,
                    recipient: value.holder,
                    notes: [
                      value.accessories &&
                        t("Accessoires : {list}.", {
                          list: accessoriesLabel(value.accessories),
                        }),
                      t("Batterie : {level}.", {
                        level: enumLabel(value.battery).toLowerCase(),
                      }),
                      value.notes,
                    ]
                      .filter(Boolean)
                      .join(" "),
                  }
                : undefined,
            );
            if (print)
              onPrint(
                terminalId,
                next.terminals
                  .find((term) => term.id === terminalId)!
                  .assignments.at(-1)!.id,
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
                    message: t(
                      "Retour du terminal {label} par {holder}. État : {condition}.",
                      {
                        label: form.terminal.label,
                        holder: open.holder,
                        condition: enumLabel(condition).toLowerCase(),
                      },
                    ),
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
                      message: t(
                        "Contrôle de liaison {callsign} : {result}{group}.",
                        {
                          callsign: check.callsign,
                          result: checkLabel(check.result),
                          group: check.talkgroupId
                            ? ` ${t("sur {group}", {
                                group: talkgroupLabel(radio, check.talkgroupId),
                              })}`
                            : "",
                        },
                      ),
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
      {form?.kind === "general" && (
        <GeneralCheck
          radio={radio}
          author={author}
          onClose={close}
          onSave={(checks, log) => {
            const count = (r: string) =>
              checks.filter((c) => c.result === r).map((c) => c.callsign);
            save(
              {
                ...radio,
                checks: [...radio.checks, ...checks].sort(
                  (a, b) => Date.parse(a.at) - Date.parse(b.at),
                ),
              },
              log
                ? {
                    happenedAt: checks[0].at,
                    receivedAt: checks[0].at,
                    channel: "Radio",
                    message: tn(
                      checks.length,
                      "Contrôle de liaison général : {n} station.",
                      "Contrôle de liaison général : {n} stations.",
                    ),
                    notes: CHECK_RESULTS.filter((r) => count(r).length)
                      .map((r) =>
                        t("{result} : {callsigns}", {
                          result: checkLabel(r),
                          callsigns: count(r).join(", "),
                        }),
                      )
                      .join("\n"),
                    priority: checks.some(
                      (c) => c.result === "0" || c.result === "1",
                    )
                      ? "Important"
                      : "Normal",
                  }
                : undefined,
            );
          }}
        />
      )}
      {form?.kind === "scan" && (
        <Scanner
          radio={radio}
          onClose={close}
          onFound={(terminal) => act(terminal)}
        />
      )}
    </>
  );
}
