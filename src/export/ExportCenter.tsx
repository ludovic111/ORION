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
import { sectionCount, sectionItems } from "./dossier";
import {
  FORMATS,
  FORMAT_GROUPS,
  formatFromPreset,
  formatInfo,
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
  const [query, setQuery] = useState("");
  const all = useMemo(() => sectionItems(journal, section), [journal, section]);
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
            placeholder="Rechercher…"
            aria-label="Rechercher un élément"
          />
        </label>
        <button
          type="button"
          className="small"
          onClick={() =>
            onChange([...new Set([...chosen, ...shown.map((i) => i.id)])])
          }
        >
          Tout
        </button>
        <button
          type="button"
          className="small"
          onClick={() =>
            onChange(chosen.filter((id) => !shown.some((i) => i.id === id)))
          }
        >
          Aucun
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
        {!shown.length && <li className="muted">Aucun élément.</li>}
        {shown.length > 400 && (
          <li className="muted">
            {shown.length - 400} de plus : affinez la recherche.
          </li>
        )}
      </ul>
      <small className="muted">
        {chosen.length
          ? `${chosen.length} choisi${chosen.length > 1 ? "s" : ""} sur ${all.length}`
          : `Aucun choix : toute la partie (${all.length})`}
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
      ? `Ajoutez : ${needs.map((s) => SECTIONS.find((x) => x.id === s)!.label).join(" ou ")}`
      : "";
  };
  const uses = (o: string) => (info.options as readonly string[]).includes(o);
  const plain = live.classification === "Confidentiel" && format !== "orion";
  const problem = !chosenSections.length
    ? "Choisissez au moins une partie."
    : missing(format)
      ? `${info.name} : ${missing(format).toLowerCase()}.`
      : when === "snapshot" && !snapshot
        ? "Choisissez un point de situation."
        : format === "orion" && passphrase.length < 12
          ? "Phrase secrète : 12 caractères au minimum."
          : format === "orion" && passphrase !== repeat
            ? "Les deux phrases secrètes ne correspondent pas."
            : plain && !acknowledged
              ? "Confirmez la conservation du fichier en clair."
              : "";

  // ---------- Run ----------
  async function run(mode: "download" | "print") {
    if (busy) return;
    setError("");
    setDone(null);
    setStatus({ label: "Préparation", ratio: 0.02 });
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
        onProgress: (label, ratio) => setStatus({ label, ratio }),
      });
      setStatus({ label: "Empreinte du fichier", ratio: 0.97 });
      const lines = await registerLines(produced, scope);
      if (mode === "print") await printHtml(await produced.main.blob.text());
      else download(produced.main.blob, produced.main.name);
      lines.forEach((line, i) =>
        record("exports", {
          ...line,
          // The main file (last line) keeps the id printed in its QR code.
          ...(i === lines.length - 1 ? { id: produced.stamp.id } : {}),
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
          ? `Export impossible : ${message}`
          : "Export impossible. Réessayez avec moins de parties ou un autre format.",
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
              <small title="Maintenant">→ {liveCounts[s]}</small>
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
          <h2 id={titleId}>{verify ? "Vérifier un document" : "Exporter"}</h2>
          <p className="xc-journal">
            {live.title}
            {live.closedAt ? " · journal clôturé" : ""}
          </p>
        </div>
        <button className="icon-button" onClick={close} aria-label="Fermer">
          <X size={20} />
        </button>
      </header>

      {verify ? (
        <div className="xc-verify">
          <VerifyPanel />
          <div className="modal-actions">
            <button type="button" onClick={() => setVerify(false)}>
              Retour à l’export
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="xc-steps">
            {/* ---------- 1. QUOI ---------- */}
            <Step
              n={1}
              title="Quoi"
              hint="Les parties de l’opération à inclure"
            >
              <Segmented
                label="Contenu"
                value={all ? "all" : "some"}
                onChange={(v) => setAll(v === "all")}
                options={[
                  { value: "all", label: "Toute l’opération" },
                  { value: "some", label: "Choisir" },
                ]}
              />
              {all ? (
                <>
                  <p className="xc-note">
                    Toutes les parties, tous les éléments
                    {viewAt === null
                      ? ", état actuel."
                      : ", à l’heure choisie."}
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
                      Tout cocher
                    </button>
                    <button
                      type="button"
                      className="small"
                      onClick={() => setSections([])}
                    >
                      Tout décocher
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
                                  ? `Maintenant : ${liveCounts[s.id]}`
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
                                ? `${chosen.length} élément${chosen.length > 1 ? "s" : ""} choisi${chosen.length > 1 ? "s" : ""}`
                                : "Choisir des éléments"}
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
              title="Quand"
              hint="L’état actuel ou une version passée"
            >
              <Segmented
                label="Moment"
                value={when}
                onChange={setWhen}
                options={[
                  { value: "now", label: "Maintenant" },
                  { value: "snapshot", label: "Point figé" },
                  { value: "time", label: "Heure précise" },
                ]}
              />
              {when === "now" && (
                <p className="xc-note">
                  <Clock size={13} /> État actuel, en direct :{" "}
                  {dateTime(new Date(end).toISOString())}.
                </p>
              )}
              {when === "snapshot" &&
                (snapshots.length ? (
                  <ul
                    className="xc-snapshots"
                    role="radiogroup"
                    aria-label="Points de situation figés"
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
                    Aucun point de situation figé. Figez l’état depuis la barre
                    du temps ou la Situation, ou choisissez une heure précise.
                  </p>
                ))}
              {when === "time" && (
                <div className="xc-time">
                  <label>
                    Date et heure
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
                      aria-label="Moment de l’opération"
                      min={start}
                      max={end}
                      step={60_000}
                      value={Math.min(end, Math.max(start, at))}
                      onChange={(e) => setAt(Number(e.target.value))}
                    />
                    <div className="xc-marks" aria-hidden="true">
                      {snapshots.map((s) => {
                        const t = Date.parse(s.at);
                        if (t < start || t > end) return null;
                        return (
                          <button
                            type="button"
                            key={s.id}
                            tabIndex={-1}
                            title={`${s.title} · ${dateTime(s.at)}`}
                            style={{
                              left: `${((t - start) / (end - start)) * 100}%`,
                            }}
                            onClick={() => setAt(t)}
                          />
                        );
                      })}
                    </div>
                    <div className="xc-range-labels">
                      <span>{dateTime(new Date(start).toISOString())}</span>
                      <span>maintenant</span>
                    </div>
                  </div>
                  <p className="xc-note">
                    <b>{changes}</b> moment{changes > 1 ? "s" : ""} de
                    changement jusqu’à cette heure, sur {steps.length}.
                  </p>
                </div>
              )}
              {viewAt !== null && (
                <div className="xc-version">
                  <span className="section-label">Cette version contient</span>
                  {contents}
                  <small className="muted">
                    → nombre actuel, quand il diffère.
                  </small>
                </div>
              )}
            </Step>

            {/* ---------- 3. FORMAT ---------- */}
            <Step
              n={3}
              title="Format"
              hint="Présentation, document, tableur, carte, archive…"
              className="xc-format-step"
            >
              {FORMAT_GROUPS.map((group) => (
                <fieldset className="xc-group" key={group}>
                  <legend className="section-label">{group}</legend>
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
                  <Stamp size={12} /> Filigrane
                </label>
                <div className="inline-field">
                  <input
                    id={watermarkId}
                    value={watermark}
                    maxLength={40}
                    placeholder="Aucun filigrane"
                    onChange={(e) => setWatermark(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="small"
                    onClick={() => setWatermark(autoWatermark(live))}
                    title="Selon le mode et la classification du journal"
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    className="small"
                    onClick={() => setWatermark("")}
                  >
                    Aucun
                  </button>
                </div>
              </div>
            )}
            {uses("orientation") && (
              <div className="xc-option">
                <span className="section-label">Page</span>
                <Segmented
                  label="Orientation"
                  value={orientation}
                  onChange={setOrientation}
                  options={[
                    { value: "portrait", label: "Portrait" },
                    { value: "landscape", label: "Paysage" },
                  ]}
                />
              </div>
            )}
            {uses("versions") && chosenSections.includes("journal") && (
              <Toggle
                label="Versions des entrées"
                hint="Chaque modification, qui, quand, pourquoi"
                checked={versions}
                onChange={setVersions}
              />
            )}
            {uses("animations") && (
              <Toggle
                label="Animations"
                hint="Transitions et apparitions"
                checked={animations}
                onChange={setAnimations}
              />
            )}
            {uses("passphrase") && (
              <div className="xc-passphrase">
                <div className="form-pair">
                  <label>
                    Phrase secrète
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
                    Répéter la phrase
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
                  <LockKeyhole size={11} /> 12 caractères min. Transmise par un
                  autre canal que le fichier. Irrécupérable. Après import, la
                  machine à remonter le temps rejoue l’opération.
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
                  Journal confidentiel, fichier en clair : je choisis où il est
                  conservé.
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
                    ? "Envoyé à l’impression"
                    : `${done.name} · vérifiez le dossier de téléchargement`}
                  <small>
                    Inscrit au registre · document {shortId(done.id)} · SHA-256{" "}
                    {done.sha.slice(0, 16)}…
                    {done.notes.length
                      ? ` · non inclus : ${done.notes.join(" ; ")}`
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
              Vérifier un document
            </button>
            <button
              type="button"
              onClick={() => void run("print")}
              disabled={
                busy ||
                !chosenSections.length ||
                (when === "snapshot" && !snapshot)
              }
              title="Imprimer le dossier (même contenu que la page HTML)"
            >
              <Printer size={14} />
              Imprimer
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => void run("download")}
              disabled={busy || !!problem}
            >
              <Download size={14} />
              {busy ? "Préparation…" : "Télécharger"}
            </button>
          </div>
        </footer>
      )}
    </dialog>
  );
}
