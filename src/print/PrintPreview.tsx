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
  | { kind: "labels"; journal: Journal };

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
            {header.mode}
          </b>
          <b
            className={header.classification === "Confidentiel" ? "solid" : ""}
          >
            {header.classification}
          </b>
        </span>
      </div>
      <div className="sheet-band-title">
        <h1>{header.title}</h1>
        {header.reference && <span>Réf. {header.reference}</span>}
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
        <span>Édité le {stamp} · Europe/Zurich</span>
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
        <span>Édité le {stamp} · Europe/Zurich</span>
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
        <span className="cell-label">orion aic · radio</span>
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
            <span>{journal.title} · étiquettes radio</span>
            <span>Édité le {stamp}</span>
          </footer>
        </article>
      ))}
    </>
  );
}

function forms(job: PrintJob): FormSheet[] {
  if (job.kind === "messages") return job.entries.map(messageSheet);
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

function Sheets({ job, stamp }: { job: PrintJob; stamp: string }) {
  if (job.kind === "messages" || job.kind === "handout")
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
  return job.kind === "radio" ? (
    <TablesSheetView
      journal={job.journal}
      kind="Plan du réseau radio"
      extra={`Établi par ${job.author}`}
      tables={radioTables(job.journal.radio)}
      landscape
      footer="plan du réseau radio"
      stamp={stamp}
    />
  ) : (
    <TablesSheetView
      journal={job.journal}
      kind="Rapport de situation"
      extra={`Établi par ${job.author}`}
      tables={situationReport(job.journal, job.range)}
      landscape={false}
      footer="rapport de situation"
      stamp={stamp}
    />
  );
}

function title(job: PrintJob) {
  if (job.kind === "messages")
    return `${job.entries.length} fiche${job.entries.length > 1 ? "s" : ""} message · A4 portrait`;
  if (job.kind === "radio") return "Plan du réseau radio · A4 paysage";
  if (job.kind === "handout") return "Quittance de remise radio · A4 portrait";
  if (job.kind === "report") return "Rapport de situation · A4 portrait";
  return `${job.journal.radio.terminals.length} étiquettes QR · A4 portrait`;
}

export function PrintPreview({
  job,
  onClose,
}: {
  job: PrintJob;
  onClose: () => void;
}) {
  const [stamp] = useState(printedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    document.body.classList.add("previewing");
    window.addEventListener("keydown", key);
    return () => {
      document.body.classList.remove("previewing");
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
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
            ? `message-${job.entries[0].number}`
            : "fiches",
        );
      else if (job.kind === "handout")
        save(
          await pdfs.formsPdf(journal, forms(job), "quittance"),
          "quittance",
        );
      else if (job.kind === "radio")
        save(await pdfs.radioPdf(journal, job.author), "radio");
      else if (job.kind === "report")
        save(await pdfs.reportPdf(journal, job.author, job.range), "rapport");
      else save(await pdfs.labelsPdf(journal, location.origin), "etiquettes");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div
        className="preview"
        role="dialog"
        aria-modal="true"
        aria-label="Aperçu avant impression"
      >
        <header className="preview-bar">
          <span className="label">{title(job)}</span>
          {error && <span className="crit-text">{error}</span>}
          <div className="preview-actions">
            <button onClick={pdf} disabled={busy}>
              <Download size={14} />
              {busy ? "Génération…" : "PDF"}
            </button>
            <button
              className="primary"
              onClick={() => window.print()}
              autoFocus
            >
              <Printer size={14} />
              Imprimer
            </button>
            <button
              className="icon-button"
              onClick={onClose}
              aria-label="Fermer l’aperçu"
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
