import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Clock3,
  Download,
  FileCheck2,
  GitCompareArrows,
  History,
  MonitorPlay,
  Printer,
  Search,
  Snowflake,
  Trash2,
  Users,
} from "lucide-react";
import { dateTime, day, time, type Journal } from "../../../shared/journal";
import { removeRecords } from "../../../shared/ops";
import { toZurichInput, zurichHour, zurichInputMs } from "../../../shared/time";
import {
  auditTrail,
  compareVersions,
  journalAt,
  refOf,
  scopeInfo,
  type AuditItem,
  type Difference,
} from "../../../shared/history";
import { findRecord } from "../../../shared/ops";
import type { Module, Ref } from "../../../shared/links";
import { useApp } from "../../app/context";
import { moduleInfo } from "../../app/modules";
import { ModuleHead, EmptyState } from "../../ui/ModuleHead";
import { Segmented } from "../../ui/fields";
import { AuditRow } from "../../timeline/AuditRow";
import { VerifyPanel } from "../../export/Verify";
import { SnapshotDialog } from "../../timeline/SnapshotDialog";
import {
  ago,
  fieldLabel,
  formatValue,
  initials,
  personHue,
} from "../../timeline/format";
import { Figures } from "../../ui/Figures";
import { useLang } from "../../i18n";
import { modeLabel, t, tn } from "./i18n.ts";
import "./trace.css";

type Tab = "audit" | "compare" | "snapshots" | "exports" | "presentations";
type Period = "hour" | "today" | "all";
type ActionFilter = "" | AuditItem["action"];
const PAGE = 120;
const HOUR = 3_600_000;

/** Journal of every change, comparisons, frozen points and registers. */
export function Trace() {
  const { live, viewAt } = useApp();
  const [tab, setTab] = useState<Tab>(viewAt !== null ? "compare" : "audit");
  const trail = useMemo(() => auditTrail(live), [live]);
  const [freeze, setFreeze] = useState(false);
  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const { exportCenter, setViewAt } = useApp();
  return (
    <>
      <ModuleHead
        actions={
          <>
            <button onClick={() => setViewAt(viewAt ?? Date.now())}>
              <History size={14} />
              {t("Remonter le temps")}
            </button>
            <button onClick={() => setFreeze(true)}>
              <Snowflake size={14} />
              {t("Figer un point")}
            </button>
            <button
              onClick={() =>
                exportCenter({ sections: ["trace"], viewAt: null })
              }
            >
              <Download size={14} />
              {t("Exporter")}
            </button>
          </>
        }
      />
      <div className="trace-tabs">
        <Segmented
          label={t("Vue")}
          value={tab}
          onChange={setTab}
          options={[
            { value: "audit", label: t("Qui a fait quoi") },
            { value: "compare", label: t("Comparer") },
            {
              value: "snapshots",
              label: t("Points figés · {n}", {
                n: live.ops.snapshots.length,
              }),
            },
            {
              value: "exports",
              label: t("Exports · {n}", { n: live.ops.exports.length }),
            },
            {
              value: "presentations",
              label: t("Présentations · {n}", {
                n: live.ops.presentations.length,
              }),
            },
          ]}
        />
      </div>
      <div className="reveal" key={tab}>
        {tab === "audit" ? (
          <Audit trail={trail} />
        ) : tab === "compare" ? (
          <Compare initialFrom={compareFrom} />
        ) : tab === "snapshots" ? (
          <Snapshots
            onFreeze={() => setFreeze(true)}
            onCompare={(at) => {
              setCompareFrom(at);
              setTab("compare");
            }}
          />
        ) : tab === "exports" ? (
          <Exports />
        ) : (
          <Presentations />
        )}
      </div>
      {freeze && (
        <SnapshotDialog
          at={viewAt ?? undefined}
          onClose={() => setFreeze(false)}
        />
      )}
    </>
  );
}

/** Open a record wherever it lives, or its history when it is gone. */
function useOpenItem() {
  const { live, open, trace } = useApp();
  return (scope: string, target: string) => {
    const ref = refOf(scope, target);
    const exists =
      scope === "entries"
        ? live.entries.some((e) => e.id === target)
        : scope.startsWith("radio.")
          ? true
          : !!findRecord(live.ops, target);
    if (ref && exists) open(ref as Ref);
    else trace(target);
  };
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");

// ---------- Who did what ----------

function Audit({ trail }: { trail: AuditItem[] }) {
  const { now, setViewAt } = useApp();
  const lang = useLang();
  const [query, setQuery] = useState("");
  const [person, setPerson] = useState("");
  const [module, setModule] = useState<Module | "">("");
  const [action, setAction] = useState<ActionFilter>("");
  const [period, setPeriod] = useState<Period>("all");
  const [limit, setLimit] = useState(PAGE);
  const search = useDeferredValue(query);
  const openItem = useOpenItem();
  useEffect(() => setLimit(PAGE), [search, person, module, action, period]);
  const people = useMemo(() => {
    const counts = new Map<string, number>();
    const unknown = t("Inconnu");
    for (const i of trail)
      counts.set(i.by || unknown, (counts.get(i.by || unknown) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]);
    // lang: "Inconnu" is in the language of the post.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trail, lang]);
  const modules = useMemo(
    () => [...new Set(trail.map((i) => scopeInfo(i.scope).module))],
    [trail],
  );
  const since =
    period === "hour"
      ? now - HOUR
      : period === "today"
        ? new Date(new Date().toDateString()).getTime()
        : 0;
  // Searchable text of each change, built once per trail (images left out).
  const haystacks = useMemo(
    () =>
      new Map(
        trail.map((i) => [
          i,
          fold(
            `${i.by} ${i.title} ${i.note} ${scopeInfo(i.scope).label} ${JSON.stringify(
              i.state ?? "",
              (k, v) => (k === "image" || k === "data" ? undefined : v),
            )}`,
          ),
        ]),
      ),
    [trail],
  );
  const filtered = useMemo(() => {
    const terms = fold(search).split(/\s+/).filter(Boolean);
    return trail.filter((i) => {
      if (person && (i.by || t("Inconnu")) !== person) return false;
      if (module && scopeInfo(i.scope).module !== module) return false;
      if (action && i.action !== action) return false;
      if (since && Date.parse(i.at) < since) return false;
      if (!terms.length) return true;
      const hay = haystacks.get(i) ?? "";
      return terms.every((term) => hay.includes(term));
    });
  }, [trail, haystacks, person, module, action, since, search]);
  const lastHour = trail.filter((i) => Date.parse(i.at) > now - HOUR).length;
  const top = people[0]?.[1] ?? 1;
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: AuditItem[] }[] = [];
    for (const item of filtered.slice(0, limit)) {
      const key = `${day(item.at)} ${zurichHour(Date.parse(item.at))}`;
      const last = out[out.length - 1];
      if (last?.key === key) last.items.push(item);
      else
        out.push({
          key,
          label: t("{day} · {hour} h", {
            day: day(item.at),
            hour: time(item.at).slice(0, 2),
          }),
          items: [item],
        });
    }
    return out;
    // lang: the labels of the hours are in the language of the post.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, limit, lang]);
  if (!trail.length)
    return (
      <EmptyState
        icon={<History size={22} />}
        title={t("Aucun changement encore")}
      >
        {t(
          "Dès qu’un élément est créé, modifié ou supprimé, son auteur, l’heure et le détail apparaissent ici. Rien ne s’efface.",
        )}
      </EmptyState>
    );
  return (
    <div className="trace-layout">
      <aside className="trace-side">
        <div className="card trace-stats">
          <div className="stat">
            <strong>{trail.length}</strong>
            <span>{t("changements")}</span>
          </div>
          <div className="stat">
            <strong>{people.length}</strong>
            <span>{t("personnes")}</span>
          </div>
          <div className="stat">
            <strong>{lastHour}</strong>
            <span>{t("dernière heure")}</span>
          </div>
          <p className="muted">
            {t("Dernier : {by} · {ago}", {
              by: trail[0].by || "—",
              ago: ago(trail[0].at, now),
            })}
          </p>
        </div>
        <div className="card">
          <div className="card-head">
            <Users size={15} />
            <h3>{t("Par personne")}</h3>
          </div>
          <ul className="trace-people">
            {people.map(([name, count]) => (
              <li key={name}>
                <button
                  aria-pressed={person === name}
                  onClick={() => setPerson(person === name ? "" : name)}
                  style={{ "--h": personHue(name) } as CSSProperties}
                >
                  <span className="audit-avatar">{initials(name)}</span>
                  <span className="trace-person">
                    <span>{name}</span>
                    <i style={{ width: `${(count / top) * 100}%` }} />
                  </span>
                  <small className="mono">{count}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="muted trace-hint">
          {t(
            "Les journaux d’avant cette version ne gardent que la création et la dernière modification de chaque élément ; tout changement depuis est tracé.",
          )}
        </p>
      </aside>
      <section className="trace-feed">
        <div className="trace-filters">
          <div className="search">
            <Search size={15} />
            <input
              value={query}
              enterKeyHint="search"
              placeholder={t("Personne, élément, valeur…")}
              aria-label={t("Rechercher dans l’historique")}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value as Module | "")}
            aria-label={t("Module")}
          >
            <option value="">{t("Tous les modules")}</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {moduleInfo(m).short}
              </option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ActionFilter)}
            aria-label={t("Action")}
          >
            <option value="">{t("Toutes les actions")}</option>
            <option value="create">{t("Créations")}</option>
            <option value="update">{t("Modifications")}</option>
            <option value="remove">{t("Suppressions")}</option>
          </select>
          <Segmented
            label={t("Période")}
            value={period}
            onChange={setPeriod}
            options={[
              { value: "hour", label: t("1 h") },
              { value: "today", label: t("Aujourd’hui") },
              { value: "all", label: t("Tout") },
            ]}
          />
        </div>
        <p className="muted trace-count">
          {person
            ? tn(
                filtered.length,
                "{n} changement de {person}",
                "{n} changements de {person}",
                { person },
              )
            : tn(filtered.length, "{n} changement", "{n} changements")}
          {(person || module || action || query || period !== "all") && (
            <button
              className="link"
              onClick={() => {
                setPerson("");
                setModule("");
                setAction("");
                setQuery("");
                setPeriod("all");
              }}
            >
              {t("Tout afficher")}
            </button>
          )}
        </p>
        {groups.map((g) => (
          <div key={g.key} className="trace-group">
            <h3 className="section-label">{g.label}</h3>
            <ol className="audit-list">
              {g.items.map((item) => (
                <AuditRow
                  key={item.id}
                  item={item}
                  onOpen={() => openItem(item.scope, item.target)}
                  onTime={() => setViewAt(Date.parse(item.at))}
                />
              ))}
            </ol>
          </div>
        ))}
        {filtered.length > limit && (
          <button
            className="trace-more"
            onClick={() => setLimit((n) => n + PAGE * 2)}
          >
            {t("Afficher plus ({n} restants)", { n: filtered.length - limit })}
          </button>
        )}
        {!filtered.length && (
          <p className="muted">
            {t("Aucun changement ne correspond aux filtres.")}
          </p>
        )}
      </section>
    </div>
  );
}

// ---------- Compare two moments ----------

type Bound = { kind: "now" } | { kind: "at"; at: number };

function Compare({ initialFrom }: { initialFrom: number | null }) {
  const { live, viewAt, now, print, workspace } = useApp();
  const openItem = useOpenItem();
  const snapshots = useMemo(
    () => [...live.ops.snapshots].sort((a, b) => b.at.localeCompare(a.at)),
    [live.ops.snapshots],
  );
  const defaultFrom =
    initialFrom ??
    viewAt ??
    (snapshots[0] ? Date.parse(snapshots[0].at) : Date.now() - HOUR);
  const [from, setFrom] = useState<number>(defaultFrom);
  const [to, setTo] = useState<Bound>({ kind: "now" });
  const [maps, setMaps] = useState(false);
  const toAt = to.kind === "now" ? Number.MAX_SAFE_INTEGER : to.at;
  const before = useMemo(() => journalAt(live, from), [live, from]);
  const after = useMemo(
    () => (to.kind === "now" ? live : journalAt(live, to.at)),
    [live, to],
  );
  const diffs = useMemo(() => compareVersions(before, after), [before, after]);
  const byModule = useMemo(() => {
    const groups = new Map<Module, Difference[]>();
    for (const d of diffs) {
      const m = scopeInfo(d.scope).module;
      groups.set(m, [...(groups.get(m) ?? []), d]);
    }
    return [...groups];
  }, [diffs]);
  const trail = useMemo(() => auditTrail(live), [live]);
  const authors = useMemo(() => {
    const set = new Set<string>();
    for (const i of trail)
      if (Date.parse(i.at) > from && Date.parse(i.at) <= toAt) set.add(i.by);
    return [...set].filter(Boolean);
  }, [trail, from, toAt]);
  const counts = {
    added: diffs.filter((d) => d.kind === "added").length,
    modified: diffs.filter((d) => d.kind === "modified").length,
    removed: diffs.filter((d) => d.kind === "removed").length,
  };
  const pickTime = (value: string, set: (ms: number) => void) => {
    const ms = zurichInputMs(value);
    if (!Number.isNaN(ms)) set(ms);
  };
  const presets: { label: string; run: () => void }[] = [
    {
      label: t("Dernière heure"),
      run: () => {
        setFrom(Date.now() - HOUR);
        setTo({ kind: "now" });
      },
    },
    {
      label: t("4 dernières heures"),
      run: () => {
        setFrom(Date.now() - 4 * HOUR);
        setTo({ kind: "now" });
      },
    },
    {
      label: t("Depuis le début"),
      run: () => {
        setFrom(Date.parse(live.createdAt) - 1);
        setTo({ kind: "now" });
      },
    },
  ];
  if (snapshots[0])
    presets.unshift({
      label: t("Depuis « {title} »", { title: snapshots[0].title }),
      run: () => {
        setFrom(Date.parse(snapshots[0].at));
        setTo({ kind: "now" });
      },
    });
  function printComparison() {
    print({
      kind: "tables",
      journal: live,
      title: t("Comparaison de deux moments"),
      extra:
        to.kind === "now"
          ? t("Du {from} au état actuel · {n} différence(s) · par {author}", {
              from: dateTime(new Date(from).toISOString()),
              n: diffs.length,
              author: workspace.author,
            })
          : t("Du {from} au {to} · {n} différence(s) · par {author}", {
              from: dateTime(new Date(from).toISOString()),
              to: dateTime(new Date(to.at).toISOString()),
              n: diffs.length,
              author: workspace.author,
            }),
      landscape: true,
      name: t("comparaison"),
      tables: byModule.map(([m, list]) => ({
        id: m,
        title: moduleInfo(m).label,
        caption: t("{n} différence(s)", { n: list.length }),
        head: [t("Changement"), t("Élément"), t("Détail")],
        widths: [30, 80, 159],
        body: list.map((d) => [
          d.kind === "added"
            ? t("Ajouté")
            : d.kind === "removed"
              ? t("Supprimé")
              : t("Modifié"),
          `${scopeInfo(d.scope).label} · ${d.title}`,
          d.fields
            .map(
              (f) =>
                `${fieldLabel(f.key)} : ${formatValue(f.key, f.before, 60)} → ${formatValue(f.key, f.after, 60)}`,
            )
            .join("\n"),
        ]),
      })),
    });
  }
  return (
    <div className="compare">
      <div className="card compare-bounds">
        <div className="compare-bound">
          <span className="label">{t("Avant")}</span>
          <input
            type="datetime-local"
            value={localValue(from)}
            max={localValue(Date.now())}
            onChange={(e) => pickTime(e.target.value, setFrom)}
          />
          {snapshots.length > 0 && (
            <select
              value=""
              onChange={(e) =>
                e.target.value && setFrom(Number(e.target.value))
              }
              aria-label={t("Point figé de départ")}
            >
              <option value="">{t("Point figé…")}</option>
              {snapshots.map((s) => (
                <option key={s.id} value={Date.parse(s.at)}>
                  {s.title} · {dateTime(s.at)}
                </option>
              ))}
            </select>
          )}
        </div>
        <GitCompareArrows size={22} className="compare-arrow" />
        <div className="compare-bound">
          <span className="label">{t("Après")}</span>
          <Segmented
            label={t("Fin de la comparaison")}
            value={to.kind}
            onChange={(k) =>
              setTo(k === "now" ? { kind: "now" } : { kind: "at", at: now })
            }
            options={[
              { value: "now", label: t("Maintenant") },
              { value: "at", label: t("Autre moment") },
            ]}
          />
          {to.kind === "at" && (
            <input
              type="datetime-local"
              value={localValue(to.at)}
              max={localValue(Date.now())}
              onChange={(e) =>
                pickTime(e.target.value, (ms) => setTo({ kind: "at", at: ms }))
              }
            />
          )}
        </div>
        <div className="compare-presets">
          {presets.map((p) => (
            <button key={p.label} className="small" onClick={p.run}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <Figures
        className="compare-summary"
        label={t("Résumé de la comparaison")}
        items={[
          {
            label: tn(counts.added, "ajouté", "ajoutés"),
            value: counts.added,
          },
          {
            label: tn(counts.modified, "modifié", "modifiés"),
            value: counts.modified,
          },
          {
            label: tn(counts.removed, "supprimé", "supprimés"),
            value: counts.removed,
          },
          {
            label: tn(
              authors.length,
              "personne : {names}",
              "personnes : {names}",
              {
                names: `${authors.slice(0, 3).join(", ") || "—"}${authors.length > 3 ? "…" : ""}`,
              },
            ),
            value: authors.length,
            hint: authors.join(", "),
          },
        ]}
      />
      <div className="compare-actions">
        <button onClick={() => setMaps((v) => !v)} aria-pressed={maps}>
          {t("Cartes côte à côte")}
        </button>
        <button onClick={printComparison} disabled={!diffs.length}>
          <Printer size={14} />
          {t("Imprimer la comparaison")}
        </button>
      </div>
      {maps && <MapsSideBySide before={before} after={after} />}
      {!diffs.length ? (
        <EmptyState
          icon={<GitCompareArrows size={22} />}
          title={t("Aucune différence")}
        >
          {t("Rien n’a changé entre ces deux moments.")}
        </EmptyState>
      ) : (
        <div className="compare-groups stagger">
          {byModule.map(([m, list]) => {
            const Icon = moduleInfo(m).icon;
            return (
              <section key={m} className="card compare-group">
                <div className="card-head">
                  <Icon size={15} />
                  <h3>{moduleInfo(m).label}</h3>
                  <span className="pill plain">{list.length}</span>
                </div>
                <ul>
                  {list.map((d) => (
                    <li key={`${d.scope}:${d.target}`} className={d.kind}>
                      <span className={`compare-tag ${d.kind}`}>
                        {d.kind === "added"
                          ? t("Ajouté")
                          : d.kind === "removed"
                            ? t("Supprimé")
                            : t("Modifié")}
                      </span>
                      <div>
                        <button
                          className="link audit-title"
                          onClick={() => openItem(d.scope, d.target)}
                        >
                          {d.title}
                        </button>
                        <small className="muted">
                          {" "}
                          · {scopeInfo(d.scope).label}
                        </small>
                        {d.fields.length > 0 && (
                          <ul className="audit-diff">
                            {d.fields.slice(0, 6).map((f) => (
                              <li key={f.key}>
                                <span className="audit-field">
                                  {fieldLabel(f.key)}
                                </span>
                                <del>{formatValue(f.key, f.before, 80)}</del>→
                                <ins>{formatValue(f.key, f.after, 120)}</ins>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

const localValue = (ms: number) => toZurichInput(ms);

function MapsSideBySide({
  before,
  after,
}: {
  before: Journal;
  after: Journal;
}) {
  const [images, setImages] = useState<[string, string] | null>(null);
  const [error, setError] = useState("");
  const mapId = after.ops.maps[0]?.id ?? "";
  useEffect(() => {
    let alive = true;
    setImages(null);
    import("../map/render")
      .then(async ({ renderMap }) => {
        const options = {
          mapId,
          width: 640,
          height: 420,
          fit: "objects" as const,
        };
        const [a, b] = await Promise.all([
          renderMap(before, options),
          renderMap(after, options),
        ]);
        if (alive) setImages([a.dataUrl, b.dataUrl]);
      })
      .catch((err) => alive && setError((err as Error).message));
    return () => {
      alive = false;
    };
  }, [before, after, mapId]);
  return (
    <div className="compare-maps">
      {error ? (
        <p className="error">{error}</p>
      ) : !images ? (
        <p className="muted">{t("Préparation des cartes…")}</p>
      ) : (
        <>
          <figure>
            <img src={images[0]} alt={t("Carte avant")} />
            <figcaption>{t("Avant")}</figcaption>
          </figure>
          <figure>
            <img src={images[1]} alt={t("Carte après")} />
            <figcaption>{t("Après")}</figcaption>
          </figure>
        </>
      )}
    </div>
  );
}

// ---------- Frozen points ----------

function Snapshots({
  onFreeze,
  onCompare,
}: {
  onFreeze: () => void;
  onCompare: (at: number) => void;
}) {
  const { live, setViewAt, present, exportCenter, updateOps, toast } = useApp();
  const list = useMemo(
    () => [...live.ops.snapshots].sort((a, b) => b.at.localeCompare(a.at)),
    [live.ops.snapshots],
  );
  if (!list.length)
    return (
      <EmptyState
        icon={<Snowflake size={22} />}
        title={t("Aucun point de situation figé")}
        actions={
          <button className="primary" onClick={onFreeze}>
            <Snowflake size={14} />
            {t("Figer maintenant")}
          </button>
        }
      >
        {t(
          "Figez un moment (par exemple juste avant un rapport de conduite) pour le retrouver en un clic : revoir, comparer, présenter, exporter.",
        )}
      </EmptyState>
    );
  return (
    <div className="tile-grid stagger">
      {list.map((s) => (
        <article key={s.id} className="card tile snapshot-card">
          <div className="tile-top">
            <Snowflake size={16} />
            <h3>{s.title}</h3>
          </div>
          <p className="mono">{dateTime(s.at)}</p>
          {s.notes && <p className="muted">{s.notes}</p>}
          <p className="meta-line muted">
            {t("Figé par {by}", { by: s.by || "—" })}
          </p>
          <div className="snapshot-actions">
            <button
              className="small"
              onClick={() => setViewAt(Date.parse(s.at))}
            >
              <Clock3 size={12} />
              {t("Revoir")}
            </button>
            <button
              className="small"
              onClick={() => onCompare(Date.parse(s.at))}
              title={t("Voir ce qui a changé depuis")}
            >
              <GitCompareArrows size={12} />
              {t("Comparer")}
            </button>
            <button
              className="small"
              onClick={() =>
                present("present", {
                  viewAt: Date.parse(s.at),
                  snapshot: s.title,
                })
              }
            >
              <MonitorPlay size={12} />
              {t("Présenter")}
            </button>
            <button
              className="small"
              onClick={() =>
                exportCenter({ viewAt: Date.parse(s.at), snapshot: s.title })
              }
            >
              <Download size={12} />
              {t("Exporter")}
            </button>
            <button
              className="icon-button"
              aria-label={t("Supprimer {title}", { title: s.title })}
              onClick={() => {
                if (
                  !window.confirm(
                    t("Supprimer le point « {title} » ?", { title: s.title }),
                  )
                )
                  return;
                try {
                  updateOps((ops) => removeRecords(ops, [s.id]));
                } catch (err) {
                  toast((err as Error).message);
                }
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

// ---------- Registers ----------

const size = (bytes: number) =>
  bytes > 1_048_576
    ? t("{n} Mo", { n: (bytes / 1_048_576).toFixed(1) })
    : t("{n} ko", { n: Math.max(1, Math.round(bytes / 1024)) });

function Exports() {
  const { live, exportCenter } = useApp();
  const list = useMemo(
    () => [...live.ops.exports].sort((a, b) => b.at.localeCompare(a.at)),
    [live.ops.exports],
  );
  return (
    <div className="trace-registers">
      <section className="card">
        <div className="card-head">
          <FileCheck2 size={15} />
          <h3>{t("Registre des exports")}</h3>
          <button className="small" onClick={() => exportCenter()}>
            <Download size={12} />
            {t("Nouvel export")}
          </button>
        </div>
        {list.length ? (
          <div className="table-scroll">
            <table className="grid dense">
              <thead>
                <tr>
                  <th>{t("Date")}</th>
                  <th>{t("Par")}</th>
                  <th>{t("Format")}</th>
                  <th>{t("Contenu")}</th>
                  <th>{t("Fichier")}</th>
                  <th>{t("Empreinte")}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{dateTime(e.at)}</td>
                    <td>{e.by || "—"}</td>
                    <td>{e.format}</td>
                    <td>{e.scope}</td>
                    <td>
                      {e.name}
                      <small className="muted"> · {size(e.bytes)}</small>
                    </td>
                    <td className="mono" title={e.sha256}>
                      {e.sha256.slice(0, 12)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            {t(
              "Chaque fichier exporté est inscrit ici avec son empreinte : on peut ensuite vérifier qu’un document reçu est authentique et intact.",
            )}
          </p>
        )}
      </section>
      <section className="card">
        <div className="card-head">
          <FileCheck2 size={15} />
          <h3>{t("Vérifier un document")}</h3>
        </div>
        <VerifyPanel />
      </section>
    </div>
  );
}

function Presentations() {
  const { live, present } = useApp();
  const list = useMemo(
    () =>
      [...live.ops.presentations].sort((a, b) =>
        b.startedAt.localeCompare(a.startedAt),
      ),
    [live.ops.presentations],
  );
  return (
    <section className="card">
      <div className="card-head">
        <MonitorPlay size={15} />
        <h3>{t("Présentations données")}</h3>
        <button className="small" onClick={() => present("present")}>
          <MonitorPlay size={12} />
          {t("Présenter")}
        </button>
      </div>
      {list.length ? (
        <div className="table-scroll">
          <table className="grid dense">
            <thead>
              <tr>
                <th>{t("Début")}</th>
                <th>{t("Fin")}</th>
                <th>{t("Présenté par")}</th>
                <th>{t("Public")}</th>
                <th>{t("Version")}</th>
                <th>{t("Diapositives")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{dateTime(p.startedAt)}</td>
                  <td className="mono">{p.endedAt ? time(p.endedAt) : "—"}</td>
                  <td>{p.presenter || p.by || "—"}</td>
                  <td>{p.audience || "—"}</td>
                  <td>{p.viewAt ? dateTime(p.viewAt) : t("État du moment")}</td>
                  <td>
                    {p.slides} · {modeLabel(p.mode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted">
          {t(
            "Chaque présentation (mode présentation ou affichage mural) est inscrite ici : qui a présenté, à qui, quand et quelle version.",
          )}
        </p>
      )}
    </section>
  );
}
