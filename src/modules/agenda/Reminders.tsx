import { useState } from "react";
import { BellRing, Plus } from "lucide-react";
import { dateTime } from "../../../shared/journal";
import { journalLang, upsert } from "../../../shared/ops";
import {
  REMINDER_ACTIONS,
  type Reminder,
  type ReminderAction,
} from "../../../shared/conduct-schemas";
import { STANDARD_REMINDERS, nextDue } from "../../../shared/reminders";
import { useApp } from "../../app/context";
import { useLang } from "../../i18n";
import { t, tIn, dict } from "./i18n.ts";
import { type FieldSpec } from "../../ui/records";
import { SettingSheet } from "../../ui/SettingSheet";
import { ChoiceField, Toggle } from "../../ui/fields";
import "../../ui/conduct.css";

type Draft = Omit<Reminder, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<Reminder, "id" | "createdAt" | "updatedAt" | "by">>;

const blank = (): Draft => ({
  title: "",
  action: "export",
  every: 120,
  before: 0,
  active: true,
  doneAt: "",
  notes: "",
});

/** One-click action of a reminder, in the language of the post. */
const actionLabel = (a: ReminderAction) =>
  ({
    export: () => t("Exporter l’archive"),
    print: () => t("Imprimer la situation"),
    point: () => t("Préparer le point de situation"),
    other: () => t("Autre"),
  })[a]();

/** A standard text in a language (unknown texts unchanged). */
const seedText = (lang: Parameters<typeof tIn>[0], text: string) =>
  Object.hasOwn(dict, text) ? tIn(lang, text as keyof typeof dict) : text;

const spec = (): FieldSpec[] => [
  {
    key: "title",
    label: t("Rappel"),
    kind: "text",
    required: true,
    wide: true,
    max: 200,
    placeholder: t("ex. Exporter l’archive chiffrée"),
  },
  {
    kind: "custom",
    key: "action",
    wide: true,
    render: (value, set) => (
      <ChoiceField<ReminderAction>
        label={t("Action en un clic")}
        value={(value.action as ReminderAction) ?? "export"}
        onChange={(action) => set({ action })}
        options={REMINDER_ACTIONS.map((a) => ({
          value: a,
          label: actionLabel(a),
        }))}
      />
    ),
  },
  {
    key: "every",
    label: t("Toutes les (minutes, 0 = jamais)"),
    kind: "number",
    hint: t("120 = toutes les 2 heures, à partir de la création du rappel."),
  },
  {
    key: "before",
    label: t("Avant chaque rapport (minutes, 0 = non)"),
    kind: "number",
    hint: t("Rendez-vous dont le type ou le titre contient « rapport »."),
  },
  { key: "active", label: t("Actif"), kind: "toggle" },
  { key: "notes", label: t("Remarques"), kind: "area", rows: 2, max: 1000 },
];

const rule = (r: Pick<Reminder, "every" | "before">) => {
  const every =
    r.every > 0
      ? r.every % 60 === 0
        ? t("toutes les {n} h", { n: r.every / 60 })
        : t("toutes les {n} min", { n: r.every })
      : "";
  const before =
    r.before > 0 ? t("{n} min avant chaque rapport", { n: r.before }) : "";
  if (every && before) return t("{a} et {b}", { a: every, b: before });
  return every || before || t("jamais (à régler)");
};

/** Settings of the reminders, in the Agenda module. */
export function RemindersCard() {
  const { journal, readOnly, canWrite, updateOps, author, toast, now } =
    useApp();
  useLang();
  const [editing, setEditing] = useState<Draft | null>(null);
  const list = journal.ops.reminders;
  return (
    <section className="card rm-card" aria-label={t("Rappels")}>
      <div className="card-head">
        <BellRing size={15} />
        <h2>{t("Rappels d’export et d’impression")}</h2>
        {!readOnly && (
          <button className="small" onClick={() => setEditing(blank())}>
            <Plus size={13} />
            {t("Rappel")}
          </button>
        )}
      </div>
      <p className="muted">
        {t(
          "Sans serveur : le rappel s’affiche sur les postes ouverts à l’heure prévue, avec l’action en un clic. Un export ou une impression depuis le centre d’export le marque fait (registre des exports).",
        )}
      </p>
      {list.map((r) => {
        const next = nextDue(r, journal.ops.agenda, now);
        return (
          <div key={r.id} className={`th-row ${r.active ? "" : "off"}`}>
            <button
              className="row-main link"
              style={{ textAlign: "left", border: 0, background: "none" }}
              onClick={() => setEditing(r)}
            >
              <strong>{r.title}</strong>
              <small>
                {[
                  actionLabel(r.action),
                  rule(r),
                  r.active &&
                    next &&
                    t("prochain {date}", {
                      date: dateTime(new Date(next).toISOString()),
                    }),
                  r.doneAt && t("fait {date}", { date: dateTime(r.doneAt) }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </button>
            {!readOnly && (
              <Toggle
                label={<span className="sr-only">{t("Actif")}</span>}
                checked={r.active}
                onChange={(active) => {
                  if (!canWrite()) return;
                  updateOps((o) =>
                    upsert(o, "reminders", { ...r, active }, author),
                  );
                }}
              />
            )}
          </div>
        );
      })}
      {!list.length && !readOnly && (
        <button
          onClick={() => {
            if (!canWrite()) return;
            try {
              // Standard texts in the language of the journal.
              updateOps((o) => {
                const lang = journalLang(o);
                return STANDARD_REMINDERS.reduce(
                  (acc, r) =>
                    upsert(
                      acc,
                      "reminders",
                      {
                        ...r,
                        title: seedText(lang, r.title),
                        notes: seedText(lang, r.notes),
                        active: true,
                        doneAt: "",
                      },
                      author,
                    ),
                  o,
                );
              });
              toast(t("Rappels standards ajoutés."));
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
          <BellRing size={14} />
          {t("Ajouter les rappels standards")}
        </button>
      )}
      {editing && (
        <SettingSheet
          collection="reminders"
          eyebrow={
            <>
              <BellRing size={12} />
              {t("Rappel")}
            </>
          }
          title={editing.id ? editing.title : t("Nouveau rappel")}
          spec={spec()}
          initial={editing as Record<string, unknown>}
          onClose={() => setEditing(null)}
          validate={(v) =>
            !String(v.title ?? "").trim()
              ? t("Indiquez le rappel.")
              : Number(v.every) > 1440 || Number(v.before) > 600
                ? t(
                    "Au plus toutes les 24 h (1440 min) et 600 min avant un rapport.",
                  )
                : ""
          }
        />
      )}
    </section>
  );
}
