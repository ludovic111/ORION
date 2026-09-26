import { useState } from "react";
import {
  ClipboardCopy,
  LayoutList,
  NotebookPen,
  Printer,
  RefreshCw,
  Snowflake,
} from "lucide-react";
import { dateTime, time } from "../../../shared/journal";
import { ref, type Ref } from "../../../shared/links";
import { upsert } from "../../../shared/ops";
import {
  composeSituationPoint,
  lastReportTime,
  pointText,
  type PointSection,
} from "../../../shared/situation-point";
import { useApp } from "../../app/context";
import { t } from "./i18n.ts";
import { Modal } from "../../journal/Modal";
import { TextField, DateTimeField } from "../../ui/fields";
import "../../ui/conduct.css";

/**
 * "Préparer le point de situation": a draft built from the journal,
 * editable section by section, then printed, recorded as an entry, saved as
 * a board or frozen as a point in time.
 */
export function SituationPointDialog({
  agendaId = "",
  onClose,
}: {
  /** Report (agenda item) the point prepares. */
  agendaId?: string;
  onClose: () => void;
}) {
  const {
    journal,
    readOnly,
    canWrite,
    addEntry,
    updateOps,
    author,
    toast,
    print,
    record,
    viewAt,
  } = useApp();
  const report = journal.ops.agenda.find((a) => a.id === agendaId);
  const at = viewAt ?? Date.now();
  const title = report
    ? t("Point de situation · {report} de {time}", {
        report: report.title,
        time: time(report.at),
      })
    : t("Point de situation de {time}", {
        time: time(new Date(at).toISOString()),
      });
  const [since, setSince] = useState(() =>
    new Date(lastReportTime(journal, at, agendaId)).toISOString(),
  );
  const build = (from: string) =>
    composeSituationPoint(journal, {
      at: viewAt ?? Date.now(),
      since: Date.parse(from),
      title,
    }).sections;
  // Built once; later changes of the journal do not overwrite what the
  // operator is writing ("Refaire le brouillon" rebuilds it).
  const [base, setBase] = useState<PointSection[]>(() => build(since));
  const [sections, setSections] = useState<PointSection[]>(base);
  const rebuild = (from: string) => {
    const next = build(from);
    setBase(next);
    setSections(next);
  };
  const dirty = JSON.stringify(sections) !== JSON.stringify(base);
  const point = { title, sections };
  const text = pointText(point);
  const links: Ref[] = report ? [ref("agenda", report.id)] : [];

  function doPrint() {
    print({
      kind: "tables",
      journal,
      title,
      extra: t("Établi par {author} · état au {date} · depuis {since}", {
        author,
        date: dateTime(new Date(at).toISOString()),
        since: time(since),
      }),
      landscape: false,
      name: t("point-de-situation"),
      tables: sections.map((s) => ({
        id: s.id,
        title: s.title,
        caption: "",
        head: [s.title],
        body: [[s.text.trim() || "—"]],
        widths: [182],
      })),
    });
  }
  function consign() {
    try {
      const id = addEntry(
        {
          type: "Renseignement",
          reliability: "Confirmé",
          channel: "Sur place",
          message: text.slice(0, 12000),
          tags: ["point de situation"],
        },
        links,
      );
      if (id) toast(t("Point de situation consigné au journal."));
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function saveBoard() {
    if (!canWrite()) return;
    try {
      updateOps((o) =>
        upsert(
          o,
          "boards",
          {
            title: title.slice(0, 120),
            body: text.slice(0, 12000),
            order: o.boards.reduce((n, b) => Math.max(n, b.order), -1) + 1,
          },
          author,
        ),
      );
      toast(t("Enregistré comme tableau de situation."));
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function freeze() {
    record("snapshots", {
      title: title.slice(0, 200),
      at: new Date(at).toISOString(),
      notes: text.slice(0, 4000),
    });
    toast(t("Moment figé : retrouvez-le dans Traçabilité."));
  }
  return (
    <Modal title={title} onClose={onClose} wide dirty={dirty}>
      <p className="sp-meta">
        {t(
          "Brouillon préparé à partir du journal. Relisez, corrigez et complétez chaque rubrique avant le rapport.",
        )}
      </p>
      <div className="hs-since">
        <DateTimeField
          label={t("Depuis (dernier rapport)")}
          value={since}
          onChange={(v) => {
            if (
              !v ||
              (dirty &&
                !window.confirm(
                  t(
                    "Refaire le brouillon depuis cette heure ? Vos corrections seront perdues.",
                  ),
                ))
            )
              return;
            setSince(v);
            rebuild(v);
          }}
        />
        <button
          className="small"
          onClick={() => {
            if (
              dirty &&
              !window.confirm(
                t("Refaire le brouillon ? Vos corrections seront perdues."),
              )
            )
              return;
            rebuild(since);
          }}
        >
          <RefreshCw size={13} />
          {t("Refaire le brouillon")}
        </button>
      </div>
      <div className="sp-sections">
        {sections.map((s, i) => (
          <TextField
            key={s.id}
            label={s.title}
            rows={Math.min(12, Math.max(2, s.text.split("\n").length + 1))}
            maxLength={4000}
            value={s.text}
            onChange={(value) =>
              setSections((list) =>
                list.map((x, j) => (j === i ? { ...x, text: value } : x)),
              )
            }
          />
        ))}
      </div>
      <div className="modal-actions">
        <button
          onClick={() =>
            void navigator.clipboard
              ?.writeText(text)
              .then(() => toast(t("Copié.")))
              .catch(() => toast(t("Copie impossible dans ce navigateur.")))
          }
        >
          <ClipboardCopy size={14} />
          {t("Copier")}
        </button>
        <button onClick={freeze}>
          <Snowflake size={14} />
          {t("Figer ce moment")}
        </button>
        {!readOnly && (
          <>
            <button onClick={saveBoard}>
              <LayoutList size={14} />
              {t("Enregistrer comme tableau")}
            </button>
            <button onClick={consign}>
              <NotebookPen size={14} />
              {t("Consigner au journal")}
            </button>
          </>
        )}
        <button className="primary" onClick={doPrint}>
          <Printer size={14} />
          {t("Imprimer")}
        </button>
      </div>
    </Modal>
  );
}
