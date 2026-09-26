import { useMemo } from "react";
import { Check } from "lucide-react";
import { MEMBER_STATUSES, type Cell, type Member } from "../../../shared/ops";
import { useApp } from "../../app/context";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import { t } from "./i18n.ts";

export type MemberDraft = Omit<
  Member,
  "id" | "createdAt" | "updatedAt" | "by"
> &
  Partial<Pick<Member, "id" | "createdAt" | "updatedAt" | "by">>;
export type CellDraft = Omit<Cell, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<Cell, "id" | "createdAt" | "updatedAt" | "by">>;

export const PALETTE = [
  "#8b7bff",
  "#3fdcff",
  "#ff72c8",
  "#34e0a1",
  "#ffb35c",
  "#ff5a7a",
  "#5ea8ff",
  "#c47dff",
];

export const cellColor = (cell: Cell, index: number) =>
  cell.color || PALETTE[index % PALETTE.length];

export const blankMember = (cellId = ""): MemberDraft => ({
  name: "",
  grade: "",
  role: "",
  cellId,
  callsign: "",
  phone: "",
  email: "",
  status: "Présent",
  from: "",
  to: "",
  notes: "",
});

export const blankCell = (order: number, color = ""): CellDraft => ({
  name: "",
  kind: "",
  color,
  location: "",
  phone: "",
  radio: "",
  notes: "",
  order,
});

export function MemberSheet({
  initial,
  cells,
  onClose,
}: {
  initial: MemberDraft;
  cells: Cell[];
  onClose: () => void;
}) {
  const { journal } = useApp();
  const callsigns = useMemo(
    () => journal.radio.stations.map((s) => s.callsign),
    [journal.radio.stations],
  );
  const spec: FieldSpec[] = [
    {
      key: "name",
      label: t("Nom et prénom"),
      kind: "text",
      required: true,
      wide: true,
      max: 120,
    },
    {
      key: "grade",
      label: t("Grade"),
      kind: "combo",
      list: "grades",
      quick: 8,
      wide: true,
    },
    {
      key: "role",
      label: t("Fonction"),
      kind: "combo",
      list: "roles",
      wide: true,
    },
    {
      kind: "custom",
      key: "cellId",
      render: (v, set) => (
        <label>
          <span>{t("Poste / cellule")}</span>
          <select
            value={String(v.cellId ?? "")}
            onChange={(e) => set({ cellId: e.target.value })}
          >
            <option value="">{t("Sans poste")}</option>
            {cells.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ),
    },
    {
      key: "status",
      label: t("Statut"),
      kind: "choice",
      options: MEMBER_STATUSES,
    },
    { key: "callsign", label: t("Nom d’appel radio"), kind: "combo" },
    { key: "phone", label: t("Téléphone"), kind: "text", max: 80 },
    { key: "email", label: t("E-mail"), kind: "text", wide: true },
    { kind: "group", label: t("Service") },
    { key: "from", label: t("Début"), kind: "datetime" },
    { key: "to", label: t("Fin"), kind: "datetime" },
    { key: "notes", label: t("Remarques"), kind: "area", rows: 2, max: 2000 },
  ];
  return (
    <RecordSheet
      collection="members"
      kind="member"
      noun={t("une personne")}
      spec={spec}
      initial={initial}
      onClose={onClose}
      titleOf={(v) =>
        initial.id ? [v.grade, v.name].filter(Boolean).join(" ") : ""
      }
      validate={(v) => (v.name.trim() ? "" : t("Indiquez au moins le nom."))}
      extraOptions={{ callsign: callsigns }}
    />
  );
}

export function CellSheet({
  initial,
  onClose,
}: {
  initial: CellDraft;
  onClose: () => void;
}) {
  const { journal } = useApp();
  const callsigns = useMemo(
    () => journal.radio.stations.map((s) => s.callsign),
    [journal.radio.stations],
  );
  const spec: FieldSpec[] = [
    {
      key: "name",
      label: t("Nom"),
      kind: "text",
      required: true,
      wide: true,
      max: 120,
    },
    {
      key: "kind",
      label: t("Type"),
      kind: "combo",
      list: "cellKinds",
      quick: 6,
      wide: true,
    },
    {
      kind: "custom",
      key: "color",
      wide: true,
      render: (v, set) => (
        <fieldset className="team-swatches">
          <legend>{t("Couleur")}</legend>
          {PALETTE.map((c) => (
            <button
              type="button"
              key={c}
              className="team-swatch"
              style={{ background: c }}
              aria-label={t("Couleur {color}", { color: c })}
              aria-pressed={v.color === c}
              onClick={() => set({ color: c })}
            >
              {v.color === c && <Check size={14} />}
            </button>
          ))}
          <label className="team-swatch-custom" title={t("Autre couleur")}>
            <span className="sr-only">{t("Autre couleur")}</span>
            <input
              type="color"
              value={
                /^#[0-9a-f]{6}$/i.test(String(v.color))
                  ? String(v.color)
                  : "#8b7bff"
              }
              onChange={(e) => set({ color: e.target.value })}
            />
          </label>
          {!!v.color && (
            <button
              type="button"
              className="small"
              onClick={() => set({ color: "" })}
            >
              {t("Automatique")}
            </button>
          )}
        </fieldset>
      ),
    },
    {
      key: "location",
      label: t("Emplacement"),
      kind: "text",
      wide: true,
      max: 300,
    },
    { key: "phone", label: t("Téléphone"), kind: "text", max: 80 },
    { key: "radio", label: t("Radio / nom d’appel"), kind: "combo" },
    { key: "notes", label: t("Remarques"), kind: "area", rows: 3, max: 2000 },
  ];
  return (
    <RecordSheet
      collection="cells"
      kind="cell"
      noun={t("un poste ou une cellule")}
      spec={spec}
      initial={initial}
      onClose={onClose}
      titleOf={(v) => (initial.id ? v.name : "")}
      validate={(v) =>
        v.name.trim() ? "" : t("Indiquez le nom du poste ou de la cellule.")
      }
      extraOptions={{ radio: callsigns }}
    >
      {() => (
        <p className="muted team-sheet-note">
          {t(
            "Supprimer ce poste ne supprime pas les personnes : elles passent « Sans poste ».",
          )}
        </p>
      )}
    </RecordSheet>
  );
}
