import { useMemo, useState } from "react";
import {
  Clapperboard,
  FileDown,
  FileText,
  History,
  Plus,
  ThumbsUp,
  Trash2,
  Wrench,
} from "lucide-react";
import { useApp } from "../../app/context";
import { ModuleHead } from "../../ui/ModuleHead";
import { Figures } from "../../ui/Figures";
import { Segmented } from "../../ui/fields";
import {
  current,
  dateTime,
  needsFollowUp,
  numberLabel,
  overdue,
} from "../../../shared/journal";
import { firstMoment } from "../../../shared/history";
import { debriefMetrics, minutesLabel } from "../../../shared/debrief";
import { isExercise, tPlus, scenarioOf } from "../../../shared/exercise";
import { RETEX_KINDS, type RetexNote } from "../../../shared/ops";
import { requestReplay, type ReplaySpeed } from "../../timeline/playback";
import { Direction } from "./Direction";
import { formatTime } from "../../../shared/i18n/core.ts";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { useLang } from "../../i18n";
import { t, tn } from "./i18n.ts";
import "./debrief.css";

// Débriefing (RETEX) of the journal: replay of the operation, figures of
// the conduct (reaction to the injects, deadlines, messages, entries per
// hour, who did what) and the notes « points positifs / à améliorer »,
// exported to PDF or Word by the export centre (part « Exercice et
// débriefing »). In an exercise journal, the tab « Direction d’exercice »
// holds the scenario (src/modules/debrief/Direction.tsx).

type Tab = "debrief" | "direction";

const hhmm = (ms: number) => formatTime(ms);

export function Debrief() {
  const { live, exportCenter } = useApp();
  useLang();
  const exercise = isExercise(live);
  const [tab, setTab] = useState<Tab>("debrief");
  const shown: Tab = exercise ? tab : "debrief";
  return (
    <>
      <ModuleHead
        description={
          exercise
            ? t(
                "Relecture, chiffres de la conduite et points à retenir. La direction d’exercice y prépare et joue le scénario.",
              )
            : t(
                "Relecture de l’intervention, chiffres de la conduite et points à retenir (RETEX).",
              )
        }
        actions={
          <>
            <button
              onClick={() =>
                exportCenter({ sections: ["exercise"], format: "pdf" })
              }
              title={t("Débriefing en PDF (centre d’export)")}
            >
              <FileDown size={14} />
              PDF
            </button>
            <button
              onClick={() =>
                exportCenter({ sections: ["exercise"], format: "docx" })
              }
              title={t("Débriefing en Word (centre d’export)")}
            >
              <FileText size={14} />
              Word
            </button>
          </>
        }
      />
      {exercise && (
        <div className="db-tabs">
          <Segmented<Tab>
            label={t("Vue")}
            value={shown}
            onChange={setTab}
            options={[
              { value: "debrief", label: t("Débriefing") },
              { value: "direction", label: t("Direction d’exercice") },
            ]}
          />
        </div>
      )}
      {shown === "direction" ? <Direction /> : <DebriefView />}
    </>
  );
}

function DebriefView() {
  const { live, now, viewAt } = useApp();
  const exercise = isExercise(live);
  const metrics = useMemo(
    () => debriefMetrics(live, viewAt === null ? now : Date.now()),
    [live, now, viewAt],
  );
  // Players see only the injects already played (no spoiler).
  const played = metrics.injects.filter((r) => r.delivered !== null);
  const scenario = scenarioOf(live.ops);
  const start = scenario?.startAt ? Date.parse(scenario.startAt) : null;
  return (
    <div className="db">
      <Replay />
      <section className="card db-card" aria-labelledby="db-figures">
        <div className="card-head">
          <History size={18} />
          <h2 id="db-figures">{t("Chiffres de la conduite")}</h2>
        </div>
        <Figures
          label={t("Chiffres de la conduite")}
          items={[
            ...(exercise
              ? [
                  {
                    label: t("injects joués"),
                    value: metrics.delivered,
                  },
                  {
                    label: t("réaction médiane"),
                    value: minutesLabel(metrics.medianReaction),
                  },
                  {
                    label: t("injects en retard"),
                    value: metrics.lateInjects,
                    tone: metrics.lateInjects
                      ? ("crit" as const)
                      : ("" as const),
                  },
                ]
              : []),
            {
              label: t("échéances dépassées"),
              value: metrics.overdue,
              tone: metrics.overdue ? "warn" : "",
            },
            {
              label: t("retard cumulé"),
              value: minutesLabel(metrics.totalDelay),
            },
            {
              label: t("traitement médian d’un message"),
              value: minutesLabel(metrics.medianTreatment),
            },
            { label: t("entrées au journal"), value: live.entries.length },
          ]}
        />
      </section>

      {exercise && (
        <section className="card db-card" aria-labelledby="db-injects">
          <div className="card-head">
            <Clapperboard size={18} />
            <h2 id="db-injects">{t("Réactions aux injects")}</h2>
          </div>
          {played.length ? (
            <div className="db-scroll">
              <table className="grid dense db-table">
                <thead>
                  <tr>
                    <th>{t("Joué")}</th>
                    <th>{t("Inject")}</th>
                    <th>{t("Réaction")}</th>
                    <th>{t("Délai")}</th>
                    <th>{t("État")}</th>
                  </tr>
                </thead>
                <tbody>
                  {played.map((r) => (
                    <tr key={r.inject.id}>
                      <td className="mono">
                        {start !== null && r.delivered !== null
                          ? tPlus(r.delivered, start)
                          : ""}
                        <small>
                          {r.delivered !== null ? hhmm(r.delivered) : ""}
                        </small>
                      </td>
                      <td>
                        <strong>{r.inject.title}</strong>
                        <small>
                          {r.inject.from || "—"} → {r.inject.to || "—"} ·{" "}
                          {enumLabel(r.inject.via)}
                        </small>
                      </td>
                      <td>{r.reacted !== null ? r.how : "—"}</td>
                      <td className="mono">{minutesLabel(r.minutes)}</td>
                      <td>
                        {r.late ? (
                          <span className="pill crit">
                            {t("retard {delay}", {
                              delay: minutesLabel(r.delay),
                            })}
                          </span>
                        ) : r.reacted !== null ? (
                          <span className="pill ok">{t("à temps")}</span>
                        ) : (
                          <span className="pill muted">{t("en attente")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">
              {t(
                "Aucun inject joué pour l’instant. La réaction se mesure dès qu’un inject arrive : message traité, inscrit au journal, lié à une entrée, ou réaction marquée par la direction.",
              )}
            </p>
          )}
        </section>
      )}

      <div className="db-pair">
        <section className="card db-card" aria-labelledby="db-treatment">
          <div className="card-head">
            <h2 id="db-treatment">{t("Délai de traitement des messages")}</h2>
          </div>
          <Bars
            rows={metrics.treatment.map((b) => ({
              label: b.label,
              value: b.count,
              tone: b.min === Infinity ? "warn" : "",
            }))}
            empty={t("Aucun message reçu.")}
          />
          <p className="db-note">
            {t(
              "De la réception au premier traitement : message pris en charge, inscrit au journal ou lié à une entrée.",
            )}
          </p>
        </section>
        <section className="card db-card" aria-labelledby="db-hours">
          <div className="card-head">
            <h2 id="db-hours">{t("Entrées au journal par heure")}</h2>
          </div>
          <Columns rows={metrics.perHour} />
        </section>
      </div>

      <div className="db-pair">
        <section className="card db-card" aria-labelledby="db-deadlines">
          <div className="card-head">
            <h2 id="db-deadlines">{t("Échéances dépassées")}</h2>
          </div>
          {metrics.deadlines.some((d) => d.delay > 0) ? (
            <ul className="db-list">
              {metrics.deadlines
                .filter((d) => d.delay > 0)
                .sort((a, b) => b.delay - a.delay)
                .slice(0, 12)
                .map((d) => (
                  <li key={d.entryId}>
                    <span className="mono">
                      #{String(d.number).padStart(3, "0")}
                    </span>
                    <span className="db-list-text">{d.label}</span>
                    <span className="mono db-late">
                      {d.closed === null
                        ? t("ouverte, +{delay}", {
                            delay: minutesLabel(d.delay),
                          })
                        : `+${minutesLabel(d.delay)}`}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="muted">
              {metrics.deadlines.length
                ? t("Les {n} échéances ont été tenues.", {
                    n: metrics.deadlines.length,
                  })
                : t("Aucune entrée n’a d’échéance.")}
            </p>
          )}
        </section>
        <section className="card db-card" aria-labelledby="db-people">
          <div className="card-head">
            <h2 id="db-people">{t("Qui a fait quoi")}</h2>
          </div>
          {metrics.people.length ? (
            <div className="db-scroll">
              <table className="grid dense db-table">
                <thead>
                  <tr>
                    <th>{t("Personne")}</th>
                    <th>{t("Entrées")}</th>
                    <th>{t("Corrections")}</th>
                    <th>{t("Messages")}</th>
                    <th>{t("Autres")}</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.people.slice(0, 20).map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td className="mono">{p.entries}</td>
                      <td className="mono">{p.revisions}</td>
                      <td className="mono">{p.messages}</td>
                      <td className="mono">{p.changes - p.messages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">{t("Rien d’enregistré pour l’instant.")}</p>
          )}
        </section>
      </div>

      <Notes />
    </div>
  );
}

// ---------- Replay ----------

function Replay() {
  const { live, journal, viewAt, setViewAt, now } = useApp();
  const start = useMemo(() => Date.parse(firstMoment(live)), [live]);
  const play = (speed: ReplaySpeed) => {
    requestReplay(speed);
    setViewAt(start);
  };
  const open = journal.entries.filter(needsFollowUp);
  const late = open.filter((e) => overdue(e, viewAt ?? now));
  const engaged = journal.ops.resources.filter((r) =>
    ["Engagé", "En route", "Alerté"].includes(r.status),
  );
  const last = [...journal.entries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  return (
    <section className="card db-card" aria-labelledby="db-replay">
      <div className="card-head">
        <Clapperboard size={18} />
        <h2 id="db-replay">{t("Rejouer l’opération")}</h2>
      </div>
      <p className="db-note">
        {t(
          "Toute l’application revient au début et avance seule : carte, journal, messages et moyens bougent ensemble. Changez de module pendant la relecture ; la barre du bas met en pause ou revient au direct.",
        )}
      </p>
      <div className="db-actions">
        <button className="primary" onClick={() => play("x60")}>
          {t("Rejouer ×{speed}", { speed: 60 })}
        </button>
        <button onClick={() => play("x10")}>
          {t("Rejouer ×{speed}", { speed: 10 })}
        </button>
        <span className="muted mono">
          {t("depuis {date}", {
            date: dateTime(new Date(start).toISOString()),
          })}
        </span>
      </div>
      {viewAt !== null && (
        <div className="db-moment">
          <p className="mono">
            {t("Moment affiché : {date}", {
              date: dateTime(new Date(viewAt).toISOString()),
            })}
          </p>
          <Figures
            compact
            label={t("Situation au moment affiché")}
            items={[
              { label: t("entrées"), value: journal.entries.length },
              { label: t("points ouverts"), value: open.length },
              {
                label: t("en retard"),
                value: late.length,
                tone: late.length ? "crit" : "",
              },
              {
                label: t("messages non lus"),
                value: journal.ops.messages.filter(
                  (m) => m.status === "Nouveau",
                ).length,
              },
              { label: t("moyens engagés"), value: engaged.length },
            ]}
          />
          {last.length > 0 && (
            <ol className="db-last">
              {last.map((e) => (
                <li key={e.id}>
                  <span className="mono">{numberLabel(e)}</span>
                  <span>{current(e).message.split("\n")[0]}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

// ---------- Small charts (figures first, bars only to compare) ----------

function Bars({
  rows,
  empty,
}: {
  rows: { label: string; value: number; tone?: string }[];
  empty: string;
}) {
  const top = Math.max(0, ...rows.map((r) => r.value));
  if (!top) return <p className="muted">{empty}</p>;
  return (
    <ul className="db-bars">
      {rows.map((r) => (
        <li key={r.label} className={r.tone ? `tone-${r.tone}` : ""}>
          <span>{r.label}</span>
          <span className="db-bar" aria-hidden="true">
            <i style={{ width: `${(r.value / top) * 100}%` }} />
          </span>
          <strong className={`mono${r.value ? "" : " zero"}`}>{r.value}</strong>
        </li>
      ))}
    </ul>
  );
}

function Columns({ rows }: { rows: { hour: string; count: number }[] }) {
  const top = Math.max(0, ...rows.map((r) => r.count));
  if (!rows.length)
    return <p className="muted">{t("Aucune entrée au journal.")}</p>;
  const shown = rows.slice(-24);
  return (
    <div
      className="db-columns"
      role="list"
      aria-label={t("Entrées au journal par heure")}
    >
      {shown.map((r) => (
        <div
          role="listitem"
          key={r.hour}
          className="db-column"
          title={tn(
            r.count,
            "{hour} h : {n} entrée",
            "{hour} h : {n} entrées",
            {
              hour: r.hour,
            },
          )}
        >
          <strong className={`mono${r.count ? "" : " zero"}`}>{r.count}</strong>
          <span className="db-column-bar" aria-hidden="true">
            <i style={{ height: `${top ? (r.count / top) * 100 : 0}%` }} />
          </span>
          <small className="mono">{r.hour.slice(11)} h</small>
        </div>
      ))}
    </div>
  );
}

// ---------- Notes « points positifs / à améliorer » ----------

const kindLabel = (kind: RetexNote["kind"]) =>
  kind === "positif" ? t("Points positifs") : t("À améliorer");

function Notes() {
  const { live, record, canWrite, updateOps, toast } = useApp();
  const notes = [...live.ops.retex].sort((a, b) => a.order - b.order);
  const [draft, setDraft] = useState<Record<RetexNote["kind"], string>>({
    positif: "",
    amélioration: "",
  });
  const [topic, setTopic] = useState<Record<RetexNote["kind"], string>>({
    positif: "",
    amélioration: "",
  });
  // Notes are a register: written even on a closed journal (the debriefing
  // usually happens after the closure).
  const add = (kind: RetexNote["kind"]) => {
    const text = draft[kind].trim();
    if (!text) return;
    record("retex", {
      kind,
      text,
      topic: topic[kind].trim(),
      owner: "",
      order: notes.reduce((n, x) => Math.max(n, x.order + 1), 0),
    });
    setDraft((d) => ({ ...d, [kind]: "" }));
  };
  const remove = (note: RetexNote) => {
    if (!canWrite()) return;
    try {
      updateOps((ops) => ({
        ...ops,
        retex: ops.retex.filter((n) => n.id !== note.id),
      }));
    } catch (err) {
      toast((err as Error).message);
    }
  };
  return (
    <div className="db-pair">
      {RETEX_KINDS.map((kind) => {
        const list = notes.filter((n) => n.kind === kind);
        return (
          <section
            key={kind}
            className="card db-card"
            aria-labelledby={`db-notes-${kind}`}
          >
            <div className="card-head">
              {kind === "positif" ? (
                <ThumbsUp size={18} />
              ) : (
                <Wrench size={18} />
              )}
              <h2 id={`db-notes-${kind}`}>{kindLabel(kind)}</h2>
            </div>
            {list.length ? (
              <ul className="db-notes">
                {list.map((n) => (
                  <li key={n.id}>
                    <div>
                      {n.topic && <strong>{n.topic}</strong>}
                      <p>{n.text}</p>
                      <small>
                        {n.by} · {dateTime(n.createdAt)}
                      </small>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => remove(n)}
                      aria-label={t("Retirer ce point")}
                      title={t("Retirer ce point")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {kind === "positif"
                  ? t("Ce qui a bien marché et qu’il faut garder.")
                  : t("Ce qu’il faudra faire autrement la prochaine fois.")}
              </p>
            )}
            <form
              className="db-add"
              onSubmit={(e) => {
                e.preventDefault();
                add(kind);
              }}
            >
              <input
                value={topic[kind]}
                onChange={(e) =>
                  setTopic((x) => ({ ...x, [kind]: e.target.value }))
                }
                placeholder={t("Domaine (facultatif)")}
                aria-label={t("Domaine")}
                maxLength={120}
                className="db-topic"
              />
              <textarea
                value={draft[kind]}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [kind]: e.target.value }))
                }
                placeholder={
                  kind === "positif"
                    ? t(
                        "Ex. Les quittances radio ont été consignées tout de suite.",
                      )
                    : t(
                        "Ex. Désigner plus tôt un responsable pour l’hébergement.",
                      )
                }
                aria-label={kindLabel(kind)}
                rows={2}
                maxLength={4000}
              />
              <button type="submit" disabled={!draft[kind].trim()}>
                <Plus size={14} />
                {t("Ajouter")}
              </button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
