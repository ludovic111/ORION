import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AlignLeft,
  Braces,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Contact,
  Download,
  FileCheck2,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType,
  Globe,
  Image,
  Layers,
  LockKeyhole,
  Map as MapIcon,
  MapPinned,
  MonitorPlay,
  Newspaper,
  Package,
  Presentation,
  Printer,
  QrCode,
  Radio,
  Route,
  Search,
  Sheet,
  ShieldCheck,
  Stamp,
  Table,
  Table2,
  X,
  type LucideIcon,
} from "lucide-react";
import { dateTime } from "../../shared/journal";
import { firstMoment, journalAt, moments } from "../../shared/history";
import { useApp, type ExportPreset } from "../app/context";
import { MODULES } from "../app/modules";
import { Segmented, Toggle, fromInput, localInput } from "../ui/fields";
import { download } from "../journal/exports";
import { rich, useLang } from "../i18n";
import { sectionCount, sectionItems } from "./dossier";
import {
  FORMATS,
  FORMAT_GROUPS,
  formatFromPreset,
  formatInfo,
  groupLabel,
  type FormatId,
} from "./formats";
import {
  SECTIONS,
  SECTION_IDS,
  describeScope,
  type ExportScope,
  type SectionId,
} from "./scope";
import { autoWatermark, shortId } from "./stamp";
import { VerifyPanel } from "./Verify";
import { t, tn } from "./i18n.ts";
import "./export.css";

// Export centre: what (parts, items), when (now, a frozen point, any time)
// and how (every format), with watermark, integrity stamp and register.

const FORMAT_ICONS: Record<FormatId, LucideIcon> = {
  pptx: Presentation,
  odp: Presentation,
  "pdf-slides": MonitorPlay,
  "html-slides": MonitorPlay,
  pdf: FileText,
  docx: FileType,
  odt: FileType,
  html: Globe,
  md: FileCode,
  txt: AlignLeft,
  sheets: Newspaper,
  "journal-pdf": Table2,
  "radio-pdf": Radio,
  "labels-pdf": QrCode,
  xlsx: FileSpreadsheet,
  ods: Sheet,
  csv: Table,
  tsv: Table,
  json: Braces,
  png: Image,
  geojson: MapPinned,
  kml: MapIcon,
  gpx: Route,
  ics: CalendarDays,
  vcf: Contact,
  orion: LockKeyhole,
  "archive-json": FileJson,
  pack: Package,
};
const moduleOf = (id: SectionId) =>
  MODULES.find((m) => m.id === (id === "links" ? "network" : id));

type When = "now" | "snapshot" | "time";
type Done = {
  name: string;
  id: string;
  sha: string;
  printed: boolean;
  notes: string[];
};

/** Index of the first moment after `t` (moments are sorted). */
function countUpTo(list: number[], t: number) {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function Step({
  n,
  title,
  hint,
  children,
  className = "",
}: {
  n: number;
  title: string;
  hint: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section className={`xc-step ${className}`} aria-labelledby={id}>
      <header className="xc-step-head">
        <span className="xc-num">{n}</span>
        <div>
          <h3 id={id}>{title}</h3>
          <small>{hint}</small>
        </div>
      </header>
      <div className="xc-step-body">{children}</div>
    </section>
  );
}

function Picker({
  section,
  journal,
  chosen,
  onChange,
}: {
  section: SectionId;
  journal: ReturnType<typeof useApp>["live"];
  chosen: string[];
  onChange: (ids: string[]) => void;
}) {
  const lang = useLang();
  const [query, setQuery] = useState("");
  const all = useMemo(
    () => sectionItems(journal, section),
    // Details are written in the language of the post.
    [journal, section, lang],
  );
  const q = query
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const shown = q
    ? all.filter((i) =>
        `${i.title} ${i.detail}`
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .includes(q),
      )
    : all;
  const set = new Set(chosen);
  return (
    <div className="xc-picker">
      <div className="xc-picker-bar">
        <label className="xc-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Rechercher…")}
            aria-label={t("Rechercher un élément")}
          />
        </label>
        <button
          type="button"
          className="small"
          onClick={() =>
            onChange([...new Set([...chosen, ...shown.map((i) => i.id)])])
          }
        >
          {t("Tout")}
        </button>
        <button
          type="button"
          className="small"
          onClick={() =>
            onChange(chosen.filter((id) => !shown.some((i) => i.id === id)))
          }
        >
          {t("Aucun")}
        </button>
      </div>
      <ul className="xc-picker-list">
        {shown.slice(0, 400).map((i) => (
          <li key={i.id}>
            <label className="check-label">
              <input
                type="checkbox"
                checked={set.has(i.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...chosen, i.id]
                      : chosen.filter((x) => x !== i.id),
                  )
                }
              />
              <span>
                {i.title}
                <small>{i.detail}</small>
              </span>
            </label>
          </li>
        ))}
        {!shown.length && <li className="muted">{t("Aucun élément.")}</li>}
        {shown.length > 400 && (
          <li className="muted">
            {t("{n} de plus : affinez la recherche.", {
              n: shown.length - 400,
            })}
          </li>
        )}
      </ul>
      <small className="muted">
        {chosen.length
          ? tn(
              chosen.length,
              "{n} choisi sur {total}",
              "{n} choisis sur {total}",
              {
                total: all.length,
              },
            )
          : t("Aucun choix : toute la partie ({total})", { total: all.length })}
      </small>
    </div>
  );
}

export function ExportCenter({
  preset = {},
  onClose,
  onBackup,
}: {
  preset?: ExportPreset;
  onClose: () => void;
  /** A complete archive was produced (for the end of session check). */
  onBackup: () => void;
}) {
  const app = useApp();
  useLang();
  const { live, author, record, now } = app;
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const watermarkId = useId();

  // ---------- State, from the preset ----------
  const snapshots = useMemo(
    () =>
      [...live.ops.snapshots].sort(
        (a, b) => Date.parse(b.at) - Date.parse(a.at),
      ),
    [live.ops.snapshots],
  );
  const initialAt = preset.viewAt !== undefined ? preset.viewAt : app.viewAt;
  const presetSnapshot = preset.snapshot
    ? snapshots.find(
        (s) =>
          s.title === preset.snapshot &&
          (initialAt === null || Date.parse(s.at) === initialAt),
      )
    : undefined;
  const presetSections = preset.sections?.length
    ? SECTION_IDS.filter((s) => preset.sections!.includes(s))
    : null;
  const hasItems = Object.values(preset.items ?? {}).some((l) => l?.length);
  const [all, setAll] = useState(
    !hasItems &&
      (!presetSections || presetSections.length === SECTION_IDS.length),
  );
  const [sections, setSections] = useState<SectionId[]>(
    presetSections ?? [...SECTION_IDS],
  );
  const [items, setItems] = useState<Partial<Record<SectionId, string[]>>>(
    preset.items ?? {},
  );
  const [picking, setPicking] = useState<SectionId | null>(null);
  const [when, setWhen] = useState<When>(
    presetSnapshot ? "snapshot" : initialAt !== null ? "time" : "now",
  );
  const [snapshotId, setSnapshotId] = useState(
    presetSnapshot?.id ?? snapshots[0]?.id ?? "",
  );
  const [at, setAt] = useState<number>(initialAt ?? Date.now());
  const [format, setFormat] = useState<FormatId>(
    formatFromPreset(preset.format) ?? "pdf",
  );
  const [watermark, setWatermark] = useState(() => autoWatermark(live));
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );
  const [animations, setAnimations] = useState(true);
  const [versions, setVersions] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [repeat, setRepeat] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState<{ label: string; ratio: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [verify, setVerify] = useState(false);
  const busy = status !== null;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);

  // ---------- Scope ----------
  const snapshot = snapshots.find((s) => s.id === snapshotId);
  const viewAt =
    when === "now"
      ? null
      : when === "snapshot"
        ? snapshot
          ? Date.parse(snapshot.at)
          : null
        : at;
  const chosenSections = all
    ? [...SECTION_IDS]
    : SECTION_IDS.filter((s) => sections.includes(s));
  const scope: ExportScope = useMemo(() => {
    const sectionsChosen = all
      ? [...SECTION_IDS]
      : SECTION_IDS.filter((s) => sections.includes(s));
    const picked = all
      ? undefined
      : Object.fromEntries(
          Object.entries(items).filter(
            ([s, list]) => list?.length && sections.includes(s as SectionId),
          ),
        );
    return {
      sections: sectionsChosen,
      ...(picked && Object.keys(picked).length ? { items: picked } : {}),
      viewAt,
      ...(when === "snapshot" && snapshot ? { snapshot: snapshot.title } : {}),
    };
  }, [all, sections, items, viewAt, when, snapshot]);

  // The version shown, rebuilt when the time settles (journalAt is costly).
  const shownAt = useDeferredValue(viewAt);
  const base = useMemo(
    () => (shownAt === null ? live : journalAt(live, shownAt)),
    [live, shownAt],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        SECTION_IDS.map((s) => [s, sectionCount(base, s)]),
      ) as Record<SectionId, number>,
    [base],
  );
  const liveCounts = useMemo(
    () =>
      Object.fromEntries(
        SECTION_IDS.map((s) => [s, sectionCount(live, s)]),
      ) as Record<SectionId, number>,
    [live],
  );
  const steps = useMemo(() => moments(live), [live]);
  const start = useMemo(() => Date.parse(firstMoment(live)), [live]);
  const end = Math.max(now, Date.now() - 1000, start + 60_000);
  const changes = countUpTo(steps, viewAt ?? end);

  // ---------- Format ----------
  const info = formatInfo(format);
  const missing = (id: FormatId) => {
    const needs = formatInfo(id).needs;
    return needs && !needs.some((s) => chosenSections.includes(s))
      ? t("Ajoutez : {parts}", {
          parts: needs
            .map((s) => SECTIONS.find((x) => x.id === s)!.label)
            .join(t(" ou ")),
        })
      : "";
  };
  const uses = (o: string) => (info.options as readonly string[]).includes(o);
  const plain = live.classification === "Confidentiel" && format !== "orion";
  const problem = !chosenSections.length
    ? t("Choisissez au moins une partie.")
    : missing(format)
      ? `${t("{label} : {value}", { label: info.name, value: missing(format).toLowerCase() })}.`
      : when === "snapshot" && !snapshot
        ? t("Choisissez un point de situation.")
        : format === "orion" && passphrase.length < 12
          ? t("Phrase secrète : 12 caractères au minimum.")
          : format === "orion" && passphrase !== repeat
            ? t("Les deux phrases secrètes ne correspondent pas.")
            : plain && !acknowledged
              ? t("Confirmez la conservation du fichier en clair.")
              : "";

  // ---------- Run ----------
  async function run(mode: "download" | "print") {
    if (busy) return;
    setError("");
    setDone(null);
    setStatus({ label: t("Préparation"), ratio: 0.02 });
    try {
      const { produce, registerLines, printHtml } = await import("./produce");
      const produced = await produce({
        live,
        scope,
        format: mode === "print" ? "html" : format,
        author,
        watermark,
        orientation,
        animations,
        versions,
        passphrase,
        origin: location.origin,
        signing: app.workspace.signing,
        onProgress: (label, ratio) => setStatus({ label, ratio }),
      });
      setStatus({ label: t("Empreinte du fichier"), ratio: 0.97 });
      const lines = await registerLines(produced, scope);
      if (mode === "print") await printHtml(await produced.main.blob.text());
      else download(produced.main.blob, produced.main.name);
      lines.forEach((line, i) =>
        record("exports", {
          ...line,
          // The main file (last line) keeps the id printed in its QR code.
          ...(i === lines.length - 1 ? { id: produced.stamp.id } : {}),
          // Kept in French: reminders read it (shared/reminders.ts).
          format: mode === "print" ? "Impression (HTML)" : line.format,
        }),
      );
      if (produced.backup && mode === "download") onBackup();
      setDone({
        name: produced.main.name,
        id: produced.stamp.id,
        sha: lines[lines.length - 1].sha256,
        printed: mode === "print",
        notes: produced.notes,
      });
      if (format === "orion") {
        setPassphrase("");
        setRepeat("");
      }
    } catch (err) {
      const message = (err as Error)?.message;
      setError(
        message
          ? t("Export impossible : {message}", { message })
          : t(
              "Export impossible. Réessayez avec moins de parties ou un autre format.",
            ),
      );
    } finally {
      setStatus(null);
    }
  }

  const close = () => {
    if (!busy) onClose();
  };
  const toggleSection = (s: SectionId) =>
    setSections((list) =>
      list.includes(s) ? list.filter((x) => x !== s) : [...list, s],
    );

  // ---------- Render ----------
  const contents = (
    <ul className="xc-contents">
      {chosenSections.map((s) => {
        const m = moduleOf(s);
        const Icon = m?.icon ?? Layers;
        const n = scope.items?.[s]?.length ?? counts[s];
        const diff = viewAt !== null && counts[s] !== liveCounts[s];
        return (
          <li key={s} style={{ "--h": m?.hue ?? 250 } as CSSProperties}>
            <Icon size={13} />
            <span>{SECTIONS.find((x) => x.id === s)!.label}</span>
            <b>{n}</b>
            {diff && !scope.items?.[s]?.length && (
              <small title={t("Maintenant")}>→ {liveCounts[s]}</small>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="modal xc"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <header className="modal-heading xc-heading">
        <div>
          <h2 id={titleId}>
            {verify ? t("Vérifier un document") : t("Exporter")}
          </h2>
          <p className="xc-journal">
            {live.title}
            {live.closedAt ? ` · ${t("journal clôturé")}` : ""}
          </p>
        </div>
        <button
          className="icon-button"
          onClick={close}
          aria-label={t("Fermer")}
        >
          <X size={20} />
        </button>
      </header>

      {verify ? (
        <div className="xc-verify">
          <VerifyPanel />
          <div className="modal-actions">
            <button type="button" onClick={() => setVerify(false)}>
              {t("Retour à l’export")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="xc-steps">
            {/* ---------- 1. QUOI ---------- */}
            <Step
              n={1}
              title={t("Quoi")}
              hint={t("Les parties de l’opération à inclure")}
            >
              <Segmented
                label={t("Contenu")}
                value={all ? "all" : "some"}
                onChange={(v) => setAll(v === "all")}
                options={[
                  { value: "all", label: t("Toute l’opération") },
                  { value: "some", label: t("Choisir") },
                ]}
              />
              {all ? (
                <>
                  <p className="xc-note">
                    {viewAt === null
                      ? t("Toutes les parties, tous les éléments, état actuel.")
                      : t(
                          "Toutes les parties, tous les éléments, à l’heure choisie.",
                        )}
                  </p>
                  {contents}
                </>
              ) : (
                <>
                  <div className="xc-quick">
                    <button
                      type="button"
                      className="small"
                      onClick={() => setSections([...SECTION_IDS])}
                    >
                      {t("Tout cocher")}
                    </button>
                    <button
                      type="button"
                      className="small"
                      onClick={() => setSections([])}
                    >
                      {t("Tout décocher")}
                    </button>
                  </div>
                  <ul className="xc-sections">
                    {SECTIONS.map((s) => {
                      const m = moduleOf(s.id);
                      const Icon = m?.icon ?? Layers;
                      const on = sections.includes(s.id);
                      const chosen = items[s.id] ?? [];
                      const pickable = s.id !== "radio" && counts[s.id] > 0;
                      return (
                        <li
                          key={s.id}
                          className={on ? "on" : ""}
                          style={{ "--h": m?.hue ?? 250 } as CSSProperties}
                        >
                          <div className="xc-section">
                            <label className="check-label">
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => toggleSection(s.id)}
                              />
                              <span className="xc-section-icon">
                                <Icon size={14} />
                              </span>
                              <span>
                                {s.label}
                                <small>{s.detail}</small>
                              </span>
                            </label>
                            <span
                              className="xc-count"
                              title={
                                viewAt !== null
                                  ? t("Maintenant : {n}", {
                                      n: liveCounts[s.id],
                                    })
                                  : undefined
                              }
                            >
                              {chosen.length ? `${chosen.length}/` : ""}
                              {counts[s.id]}
                            </span>
                          </div>
                          {on && pickable && (
                            <button
                              type="button"
                              className="link xc-pick"
                              aria-expanded={picking === s.id}
                              onClick={() =>
                                setPicking(picking === s.id ? null : s.id)
                              }
                            >
                              {chosen.length
                                ? tn(
                                    chosen.length,
                                    "{n} élément choisi",
                                    "{n} éléments choisis",
                                  )
                                : t("Choisir des éléments")}
                            </button>
                          )}
                          {on && picking === s.id && (
                            <Picker
                              section={s.id}
                              journal={base}
                              chosen={chosen}
                              onChange={(ids) =>
                                setItems((prev) => ({ ...prev, [s.id]: ids }))
                              }
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Step>

            {/* ---------- 2. QUAND ---------- */}
            <Step
              n={2}
              title={t("Quand")}
              hint={t("L’état actuel ou une version passée")}
            >
              <Segmented
                label={t("Moment")}
                value={when}
                onChange={setWhen}
                options={[
                  { value: "now", label: t("Maintenant") },
                  { value: "snapshot", label: t("Point figé") },
                  { value: "time", label: t("Heure précise") },
                ]}
              />
              {when === "now" && (
                <p className="xc-note">
                  <Clock size={13} />{" "}
                  {t("État actuel, en direct : {date}.", {
                    date: dateTime(new Date(end).toISOString()),
                  })}
                </p>
              )}
              {when === "snapshot" &&
                (snapshots.length ? (
                  <ul
                    className="xc-snapshots"
                    role="radiogroup"
                    aria-label={t("Points de situation figés")}
                  >
                    {snapshots.map((s) => (
                      <li key={s.id}>
                        <label
                          className={`xc-snapshot${s.id === snapshotId ? " on" : ""}`}
                        >
                          <input
                            type="radio"
                            name="xc-snapshot"
                            checked={s.id === snapshotId}
                            onChange={() => setSnapshotId(s.id)}
                          />
                          <Camera size={14} />
                          <span>
                            <strong>{s.title}</strong>
                            <small>
                              {dateTime(s.at)}
                              {s.notes ? ` · ${s.notes}` : ""}
                            </small>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="xc-note">
                    {t(
                      "Aucun point de situation figé. Figez l’état depuis la barre du temps ou la Situation, ou choisissez une heure précise.",
                    )}
                  </p>
                ))}
              {when === "time" && (
                <div className="xc-time">
                  <label>
                    {t("Date et heure")}
                    <input
                      type="datetime-local"
                      value={localInput(new Date(at).toISOString())}
                      min={localInput(new Date(start).toISOString())}
                      max={localInput(new Date(end).toISOString())}
                      onChange={(e) => {
                        const v = Date.parse(fromInput(e.target.value));
                        if (!Number.isNaN(v))
                          setAt(Math.min(end, Math.max(start, v)));
                      }}
                    />
                  </label>
                  <div className="xc-range">
                    <input
                      type="range"
                      aria-label={t("Moment de l’opération")}
                      min={start}
                      max={end}
                      step={60_000}
                      value={Math.min(end, Math.max(start, at))}
                      onChange={(e) => setAt(Number(e.target.value))}
                    />
                    <div className="xc-marks" aria-hidden="true">
                      {snapshots.map((s) => {
                        const time = Date.parse(s.at);
                        if (time < start || time > end) return null;
                        return (
                          <button
                            type="button"
                            key={s.id}
                            tabIndex={-1}
                            title={`${s.title} · ${dateTime(s.at)}`}
                            style={{
                              left: `${((time - start) / (end - start)) * 100}%`,
                            }}
                            onClick={() => setAt(time)}
                          />
                        );
                      })}
                    </div>
                    <div className="xc-range-labels">
                      <span>{dateTime(new Date(start).toISOString())}</span>
                      <span>{t("maintenant")}</span>
                    </div>
                  </div>
                  <p className="xc-note">
                    {rich(
                      tn(
                        changes,
                        "<0>{n}</0> moment de changement jusqu’à cette heure, sur {total}.",
                        "<0>{n}</0> moments de changement jusqu’à cette heure, sur {total}.",
                        { total: steps.length },
                      ),
                      [<b key="n" />],
                    )}
                  </p>
                </div>
              )}
              {viewAt !== null && (
                <div className="xc-version">
                  <span className="section-label">
                    {t("Cette version contient")}
                  </span>
                  {contents}
                  <small className="muted">
                    {t("→ nombre actuel, quand il diffère.")}
                  </small>
                </div>
              )}
            </Step>

            {/* ---------- 3. FORMAT ---------- */}
            <Step
              n={3}
              title={t("Format")}
              hint={t("Présentation, document, tableur, carte, archive…")}
              className="xc-format-step"
            >
              {FORMAT_GROUPS.map((group) => (
                <fieldset className="xc-group" key={group}>
                  <legend className="section-label">{groupLabel(group)}</legend>
                  <div className="xc-cards">
                    {FORMATS.filter((f) => f.group === group).map((f) => {
                      const Icon = FORMAT_ICONS[f.id];
                      const why = missing(f.id);
                      return (
                        <button
                          type="button"
                          key={f.id}
                          className={`xc-card${format === f.id ? " on" : ""}`}
                          aria-pressed={format === f.id}
                          disabled={!!why}
                          title={why || f.detail}
                          onClick={() => {
                            setFormat(f.id);
                            setDone(null);
                            setError("");
                          }}
                        >
                          <span className="xc-card-icon">
                            <Icon size={17} />
                          </span>
                          <span className="xc-card-text">
                            <strong>
                              {f.name} <code>{f.extension}</code>
                            </strong>
                            <small>{why || f.detail}</small>
                          </span>
                          {format === f.id && (
                            <Check size={14} className="xc-card-check" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </Step>
          </div>

          {/* ---------- Options ---------- */}
          <div className="xc-options">
            {uses("watermark") && (
              <div className="xc-watermark">
                <label htmlFor={watermarkId}>
                  <Stamp size={12} /> {t("Filigrane")}
                </label>
                <div className="inline-field">
                  <input
                    id={watermarkId}
                    value={watermark}
                    maxLength={40}
                    placeholder={t("Aucun filigrane")}
                    onChange={(e) => setWatermark(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="small"
                    onClick={() => setWatermark(autoWatermark(live))}
                    title={t("Selon le mode et la classification du journal")}
                  >
                    {t("Auto")}
                  </button>
                  <button
                    type="button"
                    className="small"
                    onClick={() => setWatermark("")}
                  >
                    {t("Aucun")}
                  </button>
                </div>
              </div>
            )}
            {uses("orientation") && (
              <div className="xc-option">
                <span className="section-label">{t("Page")}</span>
                <Segmented
                  label={t("Orientation")}
                  value={orientation}
                  onChange={setOrientation}
                  options={[
                    { value: "portrait", label: t("Portrait") },
                    { value: "landscape", label: t("Paysage") },
                  ]}
                />
              </div>
            )}
            {uses("versions") && chosenSections.includes("journal") && (
              <Toggle
                label={t("Versions des entrées")}
                hint={t("Chaque modification, qui, quand, pourquoi")}
                checked={versions}
                onChange={setVersions}
              />
            )}
            {uses("animations") && (
              <Toggle
                label={t("Animations")}
                hint={t("Transitions et apparitions")}
                checked={animations}
                onChange={setAnimations}
              />
            )}
            {uses("passphrase") && (
              <div className="xc-passphrase">
                <div className="form-pair">
                  <label>
                    {t("Phrase secrète")}
                    <input
                      type="password"
                      minLength={12}
                      maxLength={256}
                      autoComplete="new-password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                    />
                  </label>
                  <label>
                    {t("Répéter la phrase")}
                    <input
                      type="password"
                      minLength={12}
                      maxLength={256}
                      autoComplete="new-password"
                      value={repeat}
                      onChange={(e) => setRepeat(e.target.value)}
                    />
                  </label>
                </div>
                <small>
                  <LockKeyhole size={11} />{" "}
                  {t(
                    "12 caractères min. Transmise par un autre canal que le fichier. Irrécupérable. Après import, la machine à remonter le temps rejoue l’opération.",
                  )}
                </small>
              </div>
            )}
            {plain && (
              <label className="check-label xc-plain">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <span>
                  {t(
                    "Journal confidentiel, fichier en clair : je choisis où il est conservé.",
                  )}
                </span>
              </label>
            )}
          </div>
        </>
      )}

      {/* ---------- Summary and actions ---------- */}
      {!verify && (
        <footer className="xc-foot">
          <div className="xc-summary">
            <p>
              <b>{info.name}</b> <code>{info.extension}</code> ·{" "}
              {describeScope(scope)}
            </p>
            {status && (
              <div className="xc-progress" role="status">
                <span>{status.label}…</span>
                <div className="xc-bar">
                  <i style={{ width: `${Math.round(status.ratio * 100)}%` }} />
                </div>
              </div>
            )}
            {!status && error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {!status && done && (
              <p role="status" className="success">
                <FileCheck2 size={16} />
                <span>
                  {done.printed
                    ? t("Envoyé à l’impression")
                    : t("{name} · vérifiez le dossier de téléchargement", {
                        name: done.name,
                      })}
                  <small>
                    {t("Inscrit au registre · document {id} · SHA-256 {sha}…", {
                      id: shortId(done.id),
                      sha: done.sha.slice(0, 16),
                    })}
                    {done.notes.length
                      ? ` · ${t("non inclus : {list}", { list: done.notes.join(" ; ") })}`
                      : ""}
                  </small>
                </span>
              </p>
            )}
            {!status && !error && !done && problem && (
              <p className="hint">{problem}</p>
            )}
          </div>
          <div className="xc-actions">
            <button
              type="button"
              className="push-left"
              onClick={() => setVerify(true)}
              disabled={busy}
            >
              <ShieldCheck size={14} />
              {t("Vérifier un document")}
            </button>
            <button
              type="button"
              onClick={() => void run("print")}
              disabled={
                busy ||
                !chosenSections.length ||
                (when === "snapshot" && !snapshot)
              }
              title={t("Imprimer le dossier (même contenu que la page HTML)")}
            >
              <Printer size={14} />
              {t("Imprimer")}
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => void run("download")}
              disabled={busy || !!problem}
            >
              <Download size={14} />
              {busy ? t("Préparation…") : t("Télécharger")}
            </button>
          </div>
        </footer>
      )}
    </dialog>
  );
}
