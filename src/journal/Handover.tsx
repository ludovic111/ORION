import { useMemo, useState } from "react";
import { ClipboardCopy, Download, Printer } from "lucide-react";
import {
  defaultSince,
  handoverSummary,
  summaryHeadline,
  summaryParts,
  summaryTables,
  summaryText,
} from "../../shared/handover-summary";
import { useApp } from "../app/context";
import type { Ref } from "../../shared/links";
import { DateTimeField } from "../ui/fields";
import "../ui/conduct.css";
import {
  chronological,
  current,
  dateTime,
  needsFollowUp,
  numberLabel,
  overdue,
  type Journal,
} from "../../shared/journal";
import { activeAssignment, radioSummary } from "../../shared/radio";
import { formatTime } from "../../shared/i18n/core.ts";
import { useLang } from "../i18n";
import { Modal } from "./Modal";
import { t } from "./i18n.ts";

export function Handover({
  journal,
  at,
  onClose,
  onExport,
  onOpen,
  onTakeOver,
}: {
  journal: Journal;
  at: number;
  onClose: () => void;
  onExport: () => void;
  onOpen: (id: string) => void;
  /** Record the handover; `summary`: the text "depuis HH:MM" to add. */
  onTakeOver: (summary?: string) => void;
}) {
  const { print, author, toast, open } = useApp();
  const [since, setSince] = useState(() =>
    new Date(defaultSince(journal, at)).toISOString(),
  );
  const lang = useLang();
  // The summary holds texts: computed again when the language changes.
  const summary = useMemo(
    () => handoverSummary(journal, Date.parse(since) || at, at),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [journal, since, at, lang],
  );
  const text = summaryText(summary);
  const pending = chronological(journal.entries.filter(needsFollowUp));
  const unconfirmed = journal.entries.filter(
    (e) =>
      current(e).reliability !== "Confirmé" && current(e).status !== "Annulé",
  );
  const radio = radioSummary(journal.radio);
  const issued = journal.radio.terminals.filter(activeAssignment);
  return (
    <Modal title={t("Relève")} onClose={onClose} wide>
      <dl className="metrics compact">
        <div className={pending.length ? "warn" : ""}>
          <dt>{t("Suites à donner")}</dt>
          <dd>{pending.length}</dd>
        </div>
        <div className={pending.some((e) => overdue(e, at)) ? "crit" : ""}>
          <dt>{t("Échéances dépassées")}</dt>
          <dd>{pending.filter((e) => overdue(e, at)).length}</dd>
        </div>
        <div>
          <dt>{t("À confirmer")}</dt>
          <dd>{unconfirmed.length}</dd>
        </div>
        <div>
          <dt>{t("Radios en service")}</dt>
          <dd>
            {radio.issued}
            <small>/{radio.terminals}</small>
          </dd>
        </div>
      </dl>
      <h3 className="section-label">{t("Que s’est-il passé depuis…")}</h3>
      <div className="hs-since">
        <DateTimeField
          label={t("Depuis")}
          value={since}
          onChange={(v) => v && setSince(v)}
        />
      </div>
      <p className="hs-headline">{summaryHeadline(summary)}</p>
      <div className="hs-parts">
        {summaryParts(summary)
          // Open and overdue points are listed below, as a table.
          .filter(
            (p) => p.lines !== summary.open && p.lines !== summary.overdue,
          )
          .map((p) => (
            <div key={p.title} className="hs-part">
              <h4>{p.title}</h4>
              <ul>
                {p.lines.slice(0, 12).map((l, i) => (
                  <li key={i}>
                    <span className="mono">{formatTime(l.at)}</span>
                    {l.ref ? (
                      <button
                        className="link"
                        onClick={() =>
                          l.ref.startsWith("entry:")
                            ? onOpen(l.ref.slice(6))
                            : (onClose(), open(l.ref as Ref))
                        }
                      >
                        {l.text}
                      </button>
                    ) : (
                      <span>{l.text}</span>
                    )}
                  </li>
                ))}
                {p.lines.length > 12 && (
                  <li className="muted">
                    {t("… et {n} autre(s)", { n: p.lines.length - 12 })}
                  </li>
                )}
              </ul>
            </div>
          ))}
      </div>
      <div className="hs-actions">
        <button
          className="small"
          onClick={() =>
            print({
              kind: "tables",
              journal,
              title: t("Résumé de relève"),
              extra: t("Établi par {author}", { author }),
              landscape: false,
              name: t("resume-de-releve"),
              tables: summaryTables(summary),
            })
          }
        >
          <Printer size={13} />
          {t("Imprimer le résumé")}
        </button>
        <button
          className="small"
          onClick={() =>
            void navigator.clipboard
              ?.writeText(text)
              .then(() => toast(t("Résumé copié.")))
              .catch(() => toast(t("Copie impossible dans ce navigateur.")))
          }
        >
          <ClipboardCopy size={13} />
          {t("Copier")}
        </button>
      </div>
      <h3 className="section-label">{t("Points ouverts")}</h3>
      {pending.length ? (
        <table className="grid dense">
          <thead>
            <tr>
              <th>{t("N°")}</th>
              <th>{t("Message · mesure")}</th>
              <th>{t("Responsable")}</th>
              <th>{t("Échéance")}</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((e) => {
              const f = current(e);
              return (
                <tr key={e.id} className={overdue(e, at) ? "urgent" : ""}>
                  <td className="mono">
                    <button className="link" onClick={() => onOpen(e.id)}>
                      {numberLabel(e)}
                    </button>
                  </td>
                  <td>
                    <strong>{f.message}</strong>
                    {f.action && <div className="muted">{f.action}</div>}
                  </td>
                  <td>{f.assignee || "—"}</td>
                  <td className={`mono ${overdue(e, at) ? "crit-text" : ""}`}>
                    {f.dueAt ? dateTime(f.dueAt) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="muted">{t("Aucun.")}</p>
      )}
      {issued.length > 0 && (
        <>
          <h3 className="section-label">{t("Terminaux remis")}</h3>
          <table className="grid dense">
            <thead>
              <tr>
                <th>{t("Terminal")}</th>
                <th>{t("Détenteur")}</th>
                <th>{t("Nom d’appel")}</th>
                <th>{t("Remis")}</th>
              </tr>
            </thead>
            <tbody>
              {issued.map((terminal) => {
                const a = activeAssignment(terminal)!;
                return (
                  <tr key={terminal.id}>
                    <td className="mono">{terminal.label}</td>
                    <td>{a.holder}</td>
                    <td>{a.callsign || "—"}</td>
                    <td className="mono">{dateTime(a.issuedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      <p className="hint">
        {t(
          "Autre poste : archive .orionaic, phrase transmise par un canal séparé.",
        )}
      </p>
      <div className="modal-actions">
        <button onClick={() => onTakeOver()} disabled={!!journal.closedAt}>
          {t("Consigner la relève")}
        </button>
        <button onClick={() => onTakeOver(text)} disabled={!!journal.closedAt}>
          {t("Consigner avec le résumé")}
        </button>
        <button className="primary" onClick={onExport}>
          <Download size={14} />
          {t("Exporter")}
        </button>
      </div>
    </Modal>
  );
}
