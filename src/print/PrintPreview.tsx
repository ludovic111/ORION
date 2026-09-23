import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, X } from "lucide-react";
import type { Entry, Journal } from "../../shared/journal";
import { download, fileName } from "../journal/exports";
import {
  messageSheet,
  printedAt,
  sheetHeader,
  type SheetField,
  type SheetHeader,
} from "./sheet";
import { radioTables } from "./radio-sheet";
import "./print.css";

export type PrintJob =
  | { kind: "messages"; journal: Journal; entries: Entry[] }
  | { kind: "radio"; journal: Journal; author: string };

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
        <span>ORION · {kind}</span>
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

function MessageSheetView({
  journal,
  entry,
  stamp,
}: {
  journal: Journal;
  entry: Entry;
  stamp: string;
}) {
  const sheet = messageSheet(entry);
  return (
    <article className="sheet portrait">
      <Band header={sheetHeader(journal)} kind="Fiche message" />
      <div className="sheet-id">
        <div>
          <span className="cell-label">Message</span>
          <strong>{sheet.number}</strong>
        </div>
        <dl>
          <div>
            <dt>Nature</dt>
            <dd>{sheet.type}</dd>
          </div>
          <div className={sheet.priority === "Urgent" ? "alert" : ""}>
            <dt>Priorité</dt>
            <dd>{sheet.priority}</dd>
          </div>
          <div>
            <dt>Suivi</dt>
            <dd>{sheet.status}</dd>
          </div>
        </dl>
      </div>
      {(sheet.revised || sheet.cancelled) && (
        <p className={`sheet-note ${sheet.cancelled ? "alert" : ""}`}>
          {sheet.cancelled
            ? "ENTRÉE ANNULÉE · conservée pour la traçabilité"
            : `VERSION ${entry.revisions.length} · état actuel ; versions antérieures dans l’archive ORION`}
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
      <section className="sheet-section">
        <h2>Visa</h2>
        <div className="sheet-row">
          {["Traité par", "Date / heure", "Signature"].map((label) => (
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
      <footer className="sheet-foot">
        <span>
          {journal.title} · message {sheet.number}
        </span>
        <span>Édité le {stamp} · Europe/Zurich</span>
      </footer>
    </article>
  );
}

function RadioSheetView({
  journal,
  author,
  stamp,
}: {
  journal: Journal;
  author: string;
  stamp: string;
}) {
  return (
    <article className="sheet landscape">
      <Band
        header={sheetHeader(journal)}
        kind="Plan du réseau radio"
        extra={`Établi par ${author}`}
      />
      {radioTables(journal.radio).map((table) => (
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
                {table.head.map((h) => (
                  <th key={h}>{h}</th>
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
        <span>{journal.title} · plan du réseau radio</span>
        <span>Édité le {stamp} · Europe/Zurich</span>
      </footer>
    </article>
  );
}

function Sheets({ job, stamp }: { job: PrintJob; stamp: string }) {
  return job.kind === "messages" ? (
    <>
      {job.entries.map((entry) => (
        <MessageSheetView
          key={entry.id}
          journal={job.journal}
          entry={entry}
          stamp={stamp}
        />
      ))}
    </>
  ) : (
    <RadioSheetView journal={job.journal} author={job.author} stamp={stamp} />
  );
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
  const count = job.kind === "messages" ? job.entries.length : 1;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.classList.add("previewing");
    window.addEventListener("keydown", key);
    return () => {
      document.body.classList.remove("previewing");
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  async function pdf() {
    setBusy(true);
    setError("");
    try {
      const { messagesPdf, radioPdf } = await import("./pdf");
      if (job.kind === "messages") {
        const blob = await messagesPdf(job.journal, job.entries);
        const suffix =
          job.entries.length === 1
            ? `message-${job.entries[0].number}`
            : "fiches";
        download(blob, fileName(job.journal, ".pdf", suffix));
      } else {
        download(
          await radioPdf(job.journal, job.author),
          fileName(job.journal, ".pdf", "radio"),
        );
      }
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
          <span className="label">
            {job.kind === "messages"
              ? `${count} fiche${count > 1 ? "s" : ""} message · A4 portrait`
              : "Plan du réseau radio · A4 paysage"}
          </span>
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
