import { useState } from "react";
import { BellRing, Plus } from "lucide-react";
import { dateTime } from "../../../shared/journal";
import { upsert } from "../../../shared/ops";
import {
  REMINDER_ACTIONS,
  type Reminder,
  type ReminderAction,
} from "../../../shared/conduct-schemas";
import {
  ACTION_LABEL,
  STANDARD_REMINDERS,
  nextDue,
} from "../../../shared/reminders";
import { useApp } from "../../app/context";
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

const SPEC: FieldSpec[] = [
  {
    key: "title",
    label: "Rappel",
    kind: "text",
    required: true,
    wide: true,
    max: 200,
    placeholder: "ex. Exporter l’archive chiffrée",
  },
  {
    kind: "custom",
    key: "action",
    wide: true,
    render: (value, set) => (
      <ChoiceField<ReminderAction>
        label="Action en un clic"
        value={(value.action as ReminderAction) ?? "export"}
        onChange={(action) => set({ action })}
        options={REMINDER_ACTIONS.map((a) => ({
          value: a,
          label: ACTION_LABEL[a],
        }))}
      />
    ),
  },
  {
    key: "every",
    label: "Toutes les (minutes, 0 = jamais)",
    kind: "number",
    hint: "120 = toutes les 2 heures, à partir de la création du rappel.",
  },
  {
    key: "before",
    label: "Avant chaque rapport (minutes, 0 = non)",
    kind: "number",
    hint: "Rendez-vous dont le type ou le titre contient « rapport ».",
  },
  { key: "active", label: "Actif", kind: "toggle" },
  { key: "notes", label: "Remarques", kind: "area", rows: 2, max: 1000 },
];

const rule = (r: Pick<Reminder, "every" | "before">) =>
  [
    r.every &&
      `toutes les ${r.every % 60 === 0 ? `${r.every / 60} h` : `${r.every} min`}`,
    r.before && `${r.before} min avant chaque rapport`,
  ]
    .filter(Boolean)
    .join(" et ") || "jamais (à régler)";

/** Settings of the reminders, in the Agenda module. */
export function RemindersCard() {
  const { journal, readOnly, canWrite, updateOps, author, toast, now } =
    useApp();
  const [editing, setEditing] = useState<Draft | null>(null);
  const list = journal.ops.reminders;
  return (
    <section className="card rm-card" aria-label="Rappels">
      <div className="card-head">
        <BellRing size={15} />
        <h2>Rappels d’export et d’impression</h2>
        {!readOnly && (
          <button className="small" onClick={() => setEditing(blank())}>
            <Plus size={13} />
            Rappel
          </button>
        )}
      </div>
      <p className="muted">
        Sans serveur : le rappel s’affiche sur les postes ouverts à l’heure
        prévue, avec l’action en un clic. Un export ou une impression depuis le
        centre d’export le marque fait (registre des exports).
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
                  ACTION_LABEL[r.action],
                  rule(r),
                  r.active &&
                    next &&
                    `prochain ${dateTime(new Date(next).toISOString())}`,
                  r.doneAt && `fait ${dateTime(r.doneAt)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </button>
            {!readOnly && (
              <Toggle
                label={<span className="sr-only">Actif</span>}
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
              updateOps((o) =>
                STANDARD_REMINDERS.reduce(
                  (acc, r) =>
                    upsert(
                      acc,
                      "reminders",
                      { ...r, active: true, doneAt: "" },
                      author,
                    ),
                  o,
                ),
              );
              toast("Rappels standards ajoutés.");
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
          <BellRing size={14} />
          Ajouter les rappels standards
        </button>
      )}
      {editing && (
        <SettingSheet
          collection="reminders"
          eyebrow={
            <>
              <BellRing size={12} />
              Rappel
            </>
          }
          title={editing.id ? editing.title : "Nouveau rappel"}
          spec={SPEC}
          initial={editing as Record<string, unknown>}
          onClose={() => setEditing(null)}
          validate={(v) =>
            !String(v.title ?? "").trim()
              ? "Indiquez le rappel."
              : Number(v.every) > 1440 || Number(v.before) > 600
                ? "Au plus toutes les 24 h (1440 min) et 600 min avant un rapport."
                : ""
          }
        />
      )}
    </section>
  );
}
