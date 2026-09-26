import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, X } from "lucide-react";
import type { Entry, Journal } from "../../shared/journal";
import { terminalUrl, type Terminal } from "../../shared/radio";
import { download, fileName } from "../journal/exports";
import {
  handoutSheet,
  messageSheet,
  printedAt,
  sheetHeader,
  type FormSheet,
  type SheetField,
  type SheetHeader,
} from "./sheet";
import { radioTables, type SheetTable } from "./radio-sheet";
import { situationReport, type ReportRange } from "./report";
import { qrMatrix, qrPath } from "./qr";
import { BadgesView, type Badge } from "./badges";
import { useLayer } from "../ui/overlay";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { useLang } from "../i18n";
import { t, tn } from "./i18n.ts";
import "./print.css";

export type PrintJob =
  | { kind: "messages"; journal: Journal; entries: Entry[] }
  | { kind: "radio"; journal: Journal; author: string }
  | {
      kind: "handout";
      journal: Journal;
      terminalId: string;
      assignmentId: string;
    }
  | { kind: "report"; journal: Journal; author: string; range: ReportRange }
  | { kind: "labels"; journal: Journal }
  | { kind: "badges"; journal: Journal; badges: Badge[] }
  | {
      kind: "forms";
      journal: Journal;
      sheets: FormSheet[];
      title: string;
      name: string;
    }
  | {
      kind: "tables";
      journal: Journal;
      title: string;
      extra: string;
      tables: SheetTable[];
      landscape: boolean;
      name: string;
    };

function Band({
  header,
  kind,
  extra,
}: {
  header: SheetHeader;
  kind: string;
  extra?: string;
}) {
  return (
    <header className="sheet-band">
      <div className="sheet-band-top">
        <span>orion aic · {kind}</span>
        <span className="chips">
          <b className={header.mode === "Intervention" ? "solid" : ""}>
            {enumLabel(header.mode)}
          </b>
          <b
            className={header.classification === "Confidentiel" ? "solid" : ""}
          >
            {enumLabel(header.classification)}
          </b>
        </span>
      </div>
      <div className="sheet-band-title">
        <h1>{header.title}</h1>
        {header.reference && (
          <span>{t("Réf. {reference}", { reference: header.reference })}</span>
        )}
      </div>
      <p>
        {[header.organization, header.location, extra]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </header>
  );
}

function Cell({ field }: { field: SheetField }) {
  return (
    <div
      className={`cell ${field.tall ? "tall" : ""} ${field.strong ? "strong" : ""}`}
      style={{ flexGrow: field.span ?? 1, flexBasis: 0 }}
    >
      <span className="cell-label">{field.label}</span>
      <span
        className={`cell-value ${field.mono ? "mono" : ""} ${field.value === "—" ? "is-empty" : ""}`}
      >
        {field.value}
      </span>
    </div>
  );
}

function FormSheetView({
  journal,
  sheet,
  stamp,
}: {
  journal: Journal;
  sheet: FormSheet;
  stamp: string;
}) {
  return (
    <article className="sheet portrait">
      <Band header={sheetHeader(journal)} kind={sheet.kind} />
      <div className="sheet-id">
        <div>
          <span className="cell-label">{sheet.idLabel}</span>
          <strong>{sheet.number}</strong>
        </div>
        <dl>
          {sheet.boxes.map((box) => (
            <div key={box.label} className={box.alert ? "alert" : ""}>
              <dt>{box.label}</dt>
              <dd>{box.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {sheet.note && (
        <p className={`sheet-note ${sheet.note.alert ? "alert" : ""}`}>
          {sheet.note.text}
        </p>
      )}
      {sheet.sections.map((section) => (
        <section key={section.title} className="sheet-section">
          <h2>{section.title}</h2>
          {section.rows.map((row, i) => (
            <div className="sheet-row" key={i}>
              {row.map((field) => (
                <Cell key={field.label} field={field} />
              ))}
            </div>
          ))}
        </section>
      ))}
      {sheet.visa.map((visa) => (
        <section className="sheet-section" key={visa.title}>
          <h2>{visa.title}</h2>
          <div className="sheet-row">
            {visa.labels.map((label) => (
              <div
                className="cell visa"
                key={label}
                style={{ flexGrow: 1, flexBasis: 0 }}
              >
                <span className="cell-label">{label}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
      <footer className="sheet-foot">
        <span>
          {journal.title} · {sheet.footer}
        </span>
        <span>{t("Édité le {stamp} · Europe/Zurich", { stamp })}</span>
      </footer>
    </article>
  );
}

function TablesSheetView({
  journal,
  kind,
  extra,
  tables,
  landscape,
  footer,
  stamp,
}: {
  journal: Journal;
  kind: string;
  extra: string;
  tables: SheetTable[];
  landscape: boolean;
  footer: string;
  stamp: string;
}) {
  return (
    <article className={`sheet ${landscape ? "landscape" : "portrait"}`}>
      <Band header={sheetHeader(journal)} kind={kind} extra={extra} />
      {tables.map((table) => (
        <section key={table.id} className="sheet-section">
          <h2>
            {table.title}
            <span>{table.caption}</span>
          </h2>
          <table className="sheet-table">
            <colgroup>
              {table.widths?.map((w, i) => (
                <col key={i} style={{ width: `${w}mm` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {table.head.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.body.length ? (
                table.body.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={table.head.length} className="is-empty">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      ))}
      <footer className="sheet-foot">
        <span>
          {journal.title} · {footer}
        </span>
        <span>{t("Édité le {stamp} · Europe/Zurich", { stamp })}</span>
      </footer>
    </article>
  );
}

function Label({ terminal }: { terminal: Terminal }) {
  const matrix = useMemo(
    () => qrMatrix(terminalUrl(location.origin, terminal)),
    [terminal],
  );
  return (
    <div className="qr-label">
      <svg
        viewBox={`0 0 ${matrix.length} ${matrix.length}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <path d={qrPath(matrix)} fill="#101318" />
      </svg>
      <div>
        <span className="cell-label">{t("orion aic · radio")}</span>
        <strong>{terminal.label}</strong>
        <small>{terminal.model}</small>
        {terminal.rfsi && <small>RFSI {terminal.rfsi}</small>}
      </div>
    </div>
  );
}

function LabelsView({ journal, stamp }: { journal: Journal; stamp: string }) {
  const pages: Terminal[][] = [];
  journal.radio.terminals.forEach((t, i) => {
    if (i % 21 === 0) pages.push([]);
    pages[pages.length - 1].push(t);
  });
  return (
    <>
      {pages.map((page, i) => (
        <article className="sheet portrait labels" key={i}>
          <div className="qr-grid">
            {page.map((t) => (
              <Label key={t.id} terminal={t} />
            ))}
          </div>
          <footer className="sheet-foot">
            <span>
              {journal.title} · {t("étiquettes radio")}
            </span>
            <span>{t("Édité le {stamp}", { stamp })}</span>
          </footer>
        </article>
      ))}
    </>
  );
}

function forms(job: PrintJob): FormSheet[] {
  if (job.kind === "messages") return job.entries.map(messageSheet);
  if (job.kind === "forms") return job.sheets;
  if (job.kind === "handout") {
    const terminal = job.journal.radio.terminals.find(
      (t) => t.id === job.terminalId,
    );
    const assignment = terminal?.assignments.find(
      (a) => a.id === job.assignmentId,
    );
    return terminal && assignment
      ? [handoutSheet(terminal, assignment, job.journal.radio)]
      : [];
  }
  return [];
}

export function Sheets({ job, stamp }: { job: PrintJob; stamp: string }) {
  if (job.kind === "tables")
    return (
      <TablesSheetView
        journal={job.journal}
        kind={job.title}
        extra={job.extra}
        tables={job.tables}
        landscape={job.landscape}
        footer={job.name}
        stamp={stamp}
      />
    );
  if (job.kind === "messages" || job.kind === "handout" || job.kind === "forms")
    return (
      <>
        {forms(job).map((sheet, i) => (
          <FormSheetView
            key={i}
            journal={job.journal}
            sheet={sheet}
            stamp={stamp}
          />
        ))}
      </>
    );
  if (job.kind === "labels")
    return <LabelsView journal={job.journal} stamp={stamp} />;
  if (job.kind === "badges")
    return (
      <BadgesView journal={job.journal} badges={job.badges} stamp={stamp} />
    );
  return job.kind === "radio" ? (
    <TablesSheetView
      journal={job.journal}
      kind={t("Plan du réseau radio")}
      extra={t("Établi par {author}", { author: job.author })}
      tables={radioTables(job.journal.radio)}
      landscape
      footer={t("plan du réseau radio")}
      stamp={stamp}
    />
  ) : (
    <TablesSheetView
      journal={job.journal}
      kind={t("Rapport de situation")}
      extra={t("Établi par {author}", { author: job.author })}
      tables={situationReport(job.journal, job.range)}
      landscape={false}
      footer={t("rapport de situation")}
      stamp={stamp}
    />
  );
}

function title(job: PrintJob) {
  if (job.kind === "messages")
    return tn(
      job.entries.length,
      "{n} fiche message · A4 portrait",
      "{n} fiches message · A4 portrait",
    );
  if (job.kind === "radio") return t("Plan du réseau radio · A4 paysage");
  if (job.kind === "handout")
    return t("Quittance de remise radio · A4 portrait");
  if (job.kind === "report") return t("Rapport de situation · A4 portrait");
  if (job.kind === "forms")
    return t("{n} {title} · A4 portrait", {
      n: job.sheets.length,
      title: job.title,
    });
  if (job.kind === "tables")
    return job.landscape
      ? t("{title} · A4 paysage", { title: job.title })
      : t("{title} · A4 portrait", { title: job.title });
  if (job.kind === "badges")
    return t("{n} badge(s) de présence · A4 portrait", {
      n: job.badges.length,
    });
  return t("{n} étiquettes QR · A4 portrait", {
    n: job.journal.radio.terminals.length,
  });
}

export function PrintPreview({
  job,
  onClose,
}: {
  job: PrintJob;
  onClose: () => void;
}) {
  useLang();
  const [stamp] = useState(printedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);
  // Topmost overlay: Échap closes the preview only; the focus comes back.
  useLayer(box, { kind: "preview", onEscape: onClose });
  useEffect(() => {
    document.body.classList.add("previewing");
    return () => document.body.classList.remove("previewing");
  }, []);
  async function pdf() {
    setBusy(true);
    setError("");
    try {
      const pdfs = await import("./pdf");
      const { journal } = job;
      const save = (blob: Blob, suffix: string) =>
        download(blob, fileName(journal, ".pdf", suffix));
      if (job.kind === "messages")
        save(
          await pdfs.messagesPdf(journal, job.entries),
          job.entries.length === 1
            ? t("message-{n}", { n: job.entries[0].number })
            : t("Fichier : fiches"),
        );
      else if (job.kind === "handout")
        save(
          await pdfs.formsPdf(journal, forms(job), t("Fichier : quittance")),
          t("Fichier : quittance"),
        );
      else if (job.kind === "radio")
        save(await pdfs.radioPdf(journal, job.author), t("Fichier : radio"));
      else if (job.kind === "report")
        save(
          await pdfs.reportPdf(journal, job.author, job.range),
          t("Fichier : rapport"),
        );
      else if (job.kind === "forms")
        save(await pdfs.formsPdf(journal, job.sheets, job.title), job.name);
      else if (job.kind === "tables")
        save(
          await pdfs.tablesPdf(journal, {
            kind: job.title,
            extra: job.extra,
            tables: job.tables,
            orientation: job.landscape ? "landscape" : "portrait",
            footer: job.name,
          }),
          job.name,
        );
      else if (job.kind === "badges")
        save(await pdfs.badgesPdf(journal, job.badges), t("Fichier : badges"));
      else
        save(
          await pdfs.labelsPdf(journal, location.origin),
          t("Fichier : etiquettes"),
        );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div
        ref={box}
        className="preview"
        role="dialog"
        aria-modal="true"
        aria-label={t("Aperçu avant impression")}
      >
        <header className="preview-bar">
          <span className="label">{title(job)}</span>
          {error && <span className="crit-text">{error}</span>}
          <div className="preview-actions">
            <button onClick={pdf} disabled={busy}>
              <Download size={14} />
              {busy ? t("Génération…") : "PDF"}
            </button>
            <button
              className="primary"
              onClick={() => window.print()}
              autoFocus
            >
              <Printer size={14} />
              {t("Imprimer")}
            </button>
            <button
              className="icon-button"
              onClick={onClose}
              aria-label={t("Fermer l’aperçu")}
            >
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="preview-stage">
          <Sheets job={job} stamp={stamp} />
        </div>
      </div>
      {createPortal(
        <div className="print-root" aria-hidden="true">
          <Sheets job={job} stamp={stamp} />
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * Prints jobs one after the other without preview (impression automatique).
 * The browser shows its print dialog unless it runs in kiosk printing mode.
 */
export function AutoPrint({
  queue,
  onDone,
  paused,
}: {
  queue: PrintJob[];
  onDone: () => void;
  paused: boolean;
}) {
  const job = paused ? undefined : queue[0];
  const [stamp, setStamp] = useState(printedAt);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!job) return;
    setStamp(printedAt());
    let finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finish = () => {
      if (finished) return;
      finished = true;
      window.removeEventListener("afterprint", finish);
      timers.forEach(clearTimeout);
      done.current();
    };
    // The job ends on "afterprint". window.print() does not block everywhere
    // (Safari, iOS): removing the sheets right after it printed blank pages.
    // Without "afterprint", a long fallback ends the job; while the page is
    // hidden behind the print dialog, the fallback waits.
    window.addEventListener("afterprint", finish);
    const fallback = () => {
      if (
        document.visibilityState === "hidden" ||
        document.hasFocus?.() === false
      )
        timers.push(setTimeout(fallback, 2_000));
      else finish();
    };
    // Let the sheets render before opening the print dialog.
    timers.push(
      setTimeout(() => {
        window.print();
        timers.push(setTimeout(fallback, 60_000));
      }, 150),
    );
    return () => {
      finished = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("afterprint", finish);
    };
  }, [job]);
  if (!job) return null;
  return createPortal(
    <div className="print-root" aria-hidden="true">
      <Sheets job={job} stamp={stamp} />
    </div>,
    document.body,
  );
}
