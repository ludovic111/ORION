import { useState, type FormEvent, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { now } from "../../shared/journal";
import {
  ACCESSORIES,
  BATTERY_LEVELS,
  CHECK_RESULTS,
  TALKGROUP_MODES,
  TALKGROUP_USAGES,
  TERMINAL_CONDITIONS,
  TERMINAL_KINDS,
  TERMINAL_MODELS,
  activeAssignment,
  callsignKey,
  stationStatus,
  type Assignment,
  type Radio,
  type RadioCheck,
  type Station,
  type Talkgroup,
  type Terminal,
} from "../../shared/radio";
import { fromInput, localInput } from "../ui/fields";
import { Modal } from "../journal/Modal";
import { talkgroupLabel } from "../print/radio-sheet";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { accessoriesLabel, checkLabel } from "../print/i18n.ts";
import { t } from "./i18n.ts";

function Shell({
  title,
  onClose,
  onSubmit,
  submit,
  onDelete,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submit: string;
  onDelete?: () => void;
  children: ReactNode;
}) {
  const [error, setError] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          setError("");
          try {
            onSubmit();
            onClose();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        {children}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          {onDelete && (
            <button
              type="button"
              className="danger push-left"
              onClick={() => {
                setError("");
                try {
                  onDelete();
                  onClose();
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <Trash2 size={14} />
              {t("Supprimer")}
            </button>
          )}
          <button type="button" onClick={onClose}>
            {t("Annuler")}
          </button>
          <button className="primary">{submit}</button>
        </div>
      </form>
    </Modal>
  );
}

function Select<T extends string>({
  label,
  value,
  values,
  onChange,
  labels,
}: {
  label: string;
  value: T;
  values: readonly T[];
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {values.map((v) => (
          <option key={v} value={v}>
            {labels?.[v] ?? enumLabel(v)}
          </option>
        ))}
      </select>
    </label>
  );
}

function GroupSelect({
  radio,
  label,
  value,
  onChange,
}: {
  radio: Radio;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {radio.talkgroups.map((g) => (
          <option key={g.id} value={g.id}>
            {talkgroupLabel(radio, g.id)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="check-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

export function TalkgroupForm({
  radio,
  group,
  onClose,
  onSave,
  onDelete,
}: {
  radio: Radio;
  group?: Talkgroup;
  onClose: () => void;
  onSave: (radio: Radio) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = useState<Talkgroup>(
    group ?? {
      id: crypto.randomUUID(),
      number: "",
      name: "",
      mode: "Groupe",
      usage: "Conduite",
      notes: "",
    },
  );
  const set = <K extends keyof Talkgroup>(key: K, v: Talkgroup[K]) =>
    setValue({ ...value, [key]: v });
  return (
    <Shell
      title={
        group
          ? t("Groupe {name}", { name: group.number || group.name })
          : t("Nouveau groupe ou canal")
      }
      submit={group ? t("Enregistrer") : t("Ajouter")}
      onClose={onClose}
      onDelete={group ? () => onDelete(group.id) : undefined}
      onSubmit={() => {
        if (!value.name.trim()) throw new Error(t("Désignation requise."));
        const clean = {
          ...value,
          name: value.name.trim(),
          number: value.number.trim().toUpperCase(),
        };
        onSave({
          ...radio,
          talkgroups: group
            ? radio.talkgroups.map((g) => (g.id === group.id ? clean : g))
            : [...radio.talkgroups, clean],
        });
      }}
    >
      <div className="form-pair">
        <label>
          {t("N°")}
          <input
            value={value.number}
            maxLength={40}
            onChange={(e) => set("number", e.target.value)}
            placeholder="G101 · D481 · R395"
            autoFocus
            data-autofocus
          />
        </label>
        <Select
          label={t("Mode")}
          value={value.mode}
          values={TALKGROUP_MODES}
          onChange={(v) => set("mode", v)}
          labels={{
            Groupe: t("Groupe (TKG)"),
            Direct: t("Direct (DMO)"),
            Relais: t("Relais (IDR)"),
          }}
        />
      </div>
      <label>
        <span>
          {t("Désignation")} <span className="required">*</span>
        </span>
        <input
          required
          maxLength={80}
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </label>
      <Select
        label={t("Emploi")}
        value={value.usage}
        values={TALKGROUP_USAGES}
        onChange={(v) => set("usage", v)}
      />
      <label>
        {t("Remarques")}
        <textarea
          rows={2}
          maxLength={1000}
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </label>
    </Shell>
  );
}

export function StationForm({
  radio,
  station,
  onClose,
  onSave,
}: {
  radio: Radio;
  station?: Station;
  onClose: () => void;
  onSave: (radio: Radio) => void;
}) {
  const [value, setValue] = useState<Station>(
    station ?? {
      id: crypto.randomUUID(),
      callsign: "",
      role: "",
      unit: "",
      primary: radio.talkgroups[0]?.id ?? "",
      fallback: "",
      notes: "",
    },
  );
  const set = <K extends keyof Station>(key: K, v: Station[K]) =>
    setValue({ ...value, [key]: v });
  return (
    <Shell
      title={station ? station.callsign : t("Nouveau nom d’appel")}
      submit={station ? t("Enregistrer") : t("Ajouter")}
      onClose={onClose}
      onDelete={
        station
          ? () =>
              onSave({
                ...radio,
                stations: radio.stations.filter((s) => s.id !== station.id),
              })
          : undefined
      }
      onSubmit={() => {
        const clean = {
          ...value,
          callsign: value.callsign.trim().replace(/\s+/g, " "),
        };
        if (
          radio.stations.some(
            (s) =>
              s.id !== clean.id &&
              callsignKey(s.callsign) === callsignKey(clean.callsign),
          )
        )
          throw new Error(t("Ce nom d’appel existe déjà."));
        if (clean.primary && clean.primary === clean.fallback)
          throw new Error(
            t("L’alternative doit différer du groupe principal."),
          );
        onSave({
          ...radio,
          stations: station
            ? radio.stations.map((s) => (s.id === station.id ? clean : s))
            : [...radio.stations, clean],
        });
      }}
    >
      <label>
        <span>
          {t("Nom d’appel")} <span className="required">*</span>
        </span>
        <input
          required
          maxLength={60}
          value={value.callsign}
          onChange={(e) => set("callsign", e.target.value)}
          placeholder={t("PC front, Chef sct appui")}
          autoFocus
          data-autofocus
        />
        <small>{t("Désigne la fonction, jamais la personne.")}</small>
      </label>
      <div className="form-pair">
        <label>
          {t("Fonction")}
          <input
            maxLength={200}
            value={value.role}
            onChange={(e) => set("role", e.target.value)}
          />
        </label>
        <label>
          {t("Section / élément")}
          <input
            maxLength={200}
            value={value.unit}
            onChange={(e) => set("unit", e.target.value)}
          />
        </label>
      </div>
      <div className="form-pair">
        <GroupSelect
          radio={radio}
          label={t("Groupe principal")}
          value={value.primary}
          onChange={(v) => set("primary", v)}
        />
        <GroupSelect
          radio={radio}
          label={t("Alternative")}
          value={value.fallback}
          onChange={(v) => set("fallback", v)}
        />
      </div>
      <label>
        {t("Remarques")}
        <input
          maxLength={1000}
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={t("Station de transit, horaires")}
        />
      </label>
    </Shell>
  );
}

export function TerminalForm({
  radio,
  terminal,
  onClose,
  onSave,
  onDelete,
}: {
  radio: Radio;
  terminal?: Terminal;
  onClose: () => void;
  onSave: (radio: Radio) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = useState<Terminal>(
    terminal ?? {
      id: crypto.randomUUID(),
      label: `R-${String(radio.terminals.length + 1).padStart(2, "0")}`,
      kind: "Portatif",
      model: "TPH900",
      serial: "",
      rfsi: "",
      condition: "Opérationnel",
      notes: "",
      assignments: [],
    },
  );
  const set = <K extends keyof Terminal>(key: K, v: Terminal[K]) =>
    setValue({ ...value, [key]: v });
  const issued = terminal && activeAssignment(terminal);
  return (
    <Shell
      title={
        terminal
          ? t("Terminal {label}", { label: terminal.label })
          : t("Nouveau terminal")
      }
      submit={terminal ? t("Enregistrer") : t("Ajouter")}
      onClose={onClose}
      onDelete={terminal ? () => onDelete(terminal.id) : undefined}
      onSubmit={() => {
        const clean = { ...value, label: value.label.trim() };
        if (
          radio.terminals.some(
            (term) =>
              term.id !== clean.id &&
              term.label.toLocaleUpperCase("fr") ===
                clean.label.toLocaleUpperCase("fr"),
          )
        )
          throw new Error(t("Ce numéro de terminal existe déjà."));
        onSave({
          ...radio,
          terminals: terminal
            ? radio.terminals.map((term) =>
                term.id === terminal.id ? clean : term,
              )
            : [...radio.terminals, clean],
        });
      }}
    >
      <div className="form-pair">
        <label>
          <span>
            {t("N° interne")} <span className="required">*</span>
          </span>
          <input
            required
            maxLength={40}
            value={value.label}
            onChange={(e) => set("label", e.target.value)}
            autoFocus
            data-autofocus
          />
        </label>
        <label>
          RFSI
          <input
            className="mono"
            maxLength={40}
            value={value.rfsi}
            onChange={(e) => set("rfsi", e.target.value)}
            placeholder="000 00 0000"
          />
        </label>
      </div>
      <div className="form-pair">
        <label>
          {t("Modèle")}
          <input
            list="terminal-models"
            maxLength={80}
            value={value.model}
            onChange={(e) => set("model", e.target.value)}
          />
          <datalist id="terminal-models">
            {TERMINAL_MODELS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
        <Select
          label={t("Type")}
          value={value.kind}
          values={TERMINAL_KINDS}
          onChange={(v) => set("kind", v)}
        />
      </div>
      <div className="form-pair">
        <label>
          {t("N° de série")}
          <input
            className="mono"
            maxLength={80}
            value={value.serial}
            onChange={(e) => set("serial", e.target.value)}
          />
        </label>
        <Select
          label={t("État")}
          value={value.condition}
          values={TERMINAL_CONDITIONS}
          onChange={(v) => set("condition", v)}
        />
      </div>
      {issued && value.condition !== "Opérationnel" && (
        <p className="hint warn">
          {t("Remis à {holder}. Enregistrez le retour pour clore la remise.", {
            holder: issued.holder,
          })}
        </p>
      )}
      {value.condition === "Manquant" && (
        <p className="hint crit">
          {t(
            "Terminal perdu : annoncez-le pour blocage selon la procédure cantonale.",
          )}
        </p>
      )}
      <label>
        {t("Remarques")}
        <textarea
          rows={2}
          maxLength={1000}
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </label>
    </Shell>
  );
}

export function SeriesForm({
  radio,
  onClose,
  onSave,
  series,
}: {
  radio: Radio;
  onClose: () => void;
  onSave: (radio: Radio) => void;
  series: (
    radio: Radio,
    prefix: string,
    from: number,
    count: number,
    template: Pick<Terminal, "kind" | "model">,
  ) => Radio;
}) {
  const [prefix, setPrefix] = useState("R-");
  const [from, setFrom] = useState(radio.terminals.length + 1);
  const [count, setCount] = useState(10);
  const [model, setModel] = useState("TPH900");
  const [kind, setKind] = useState<Terminal["kind"]>("Portatif");
  const width = Math.max(2, String(from + count - 1).length);
  return (
    <Shell
      title={t("Série de terminaux")}
      submit={t("Ajouter {n}", { n: count })}
      onClose={onClose}
      onSubmit={() =>
        onSave(series(radio, prefix, from, count, { kind, model }))
      }
    >
      <div className="form-trio">
        <label>
          {t("Préfixe")}
          <input
            maxLength={20}
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </label>
        <label>
          {t("Premier n°")}
          <input
            type="number"
            min={0}
            max={9999}
            value={from}
            onChange={(e) => setFrom(Number(e.target.value))}
          />
        </label>
        <label>
          {t("Nombre")}
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="form-pair">
        <label>
          {t("Modèle")}
          <input
            list="terminal-models"
            maxLength={80}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <datalist id="terminal-models">
            {TERMINAL_MODELS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
        <Select
          label={t("Type")}
          value={kind}
          values={TERMINAL_KINDS}
          onChange={setKind}
        />
      </div>
      <p className="hint mono">
        {prefix}
        {String(from).padStart(width, "0")} → {prefix}
        {String(from + count - 1).padStart(width, "0")} ·{" "}
        {t("numéros existants ignorés")}
      </p>
    </Shell>
  );
}

type IssueInput = Omit<
  Assignment,
  "id" | "returnedAt" | "returnedBy" | "returnCondition"
>;

export function IssueForm({
  radio,
  terminal,
  author,
  onClose,
  onIssue,
}: {
  radio: Radio;
  terminal?: Terminal;
  author: string;
  onClose: () => void;
  onIssue: (
    terminalId: string,
    value: IssueInput,
    log: boolean,
    print: boolean,
  ) => void;
}) {
  const available = radio.terminals.filter(
    (term) =>
      !activeAssignment(term) &&
      (term.condition === "Opérationnel" || term.condition === "À recharger"),
  );
  const [terminalId, setTerminalId] = useState(
    terminal?.id ?? available[0]?.id ?? "",
  );
  const [value, setValue] = useState<IssueInput>({
    holder: "",
    callsign: "",
    role: "",
    unit: "",
    accessories: "",
    battery: "Pleine",
    issuedAt: now(),
    issuedBy: author,
    notes: "",
  });
  const [log, setLog] = useState(true);
  const [print, setPrint] = useState(false);
  const set = <K extends keyof IssueInput>(key: K, v: IssueInput[K]) =>
    setValue({ ...value, [key]: v });
  const accessories = value.accessories
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const held = value.callsign.trim()
    ? stationStatus(radio, value.callsign)
    : undefined;
  const selected = radio.terminals.find((term) => term.id === terminalId);
  return (
    <Shell
      title={
        terminal
          ? t("Remettre {label}", { label: terminal.label })
          : t("Remettre un terminal")
      }
      submit={t("Remettre")}
      onClose={onClose}
      onSubmit={() => {
        if (!terminalId) throw new Error(t("Aucun terminal disponible."));
        if (!value.holder.trim()) throw new Error(t("Détenteur requis."));
        onIssue(
          terminalId,
          {
            ...value,
            holder: value.holder.trim(),
            callsign: value.callsign.trim(),
          },
          log,
          print,
        );
      }}
    >
      <div className="form-pair">
        <label>
          {t("Terminal")}
          <select
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            disabled={!!terminal}
          >
            {(terminal ? [terminal] : available).map((term) => (
              <option key={term.id} value={term.id}>
                {term.label} {term.model && `· ${term.model}`}{" "}
                {term.rfsi && `· ${term.rfsi}`}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Heure de remise")}
          <input
            type="datetime-local"
            required
            value={localInput(value.issuedAt)}
            onChange={(e) =>
              e.target.value && set("issuedAt", fromInput(e.target.value))
            }
          />
        </label>
      </div>
      {selected?.condition === "À recharger" && (
        <p className="hint warn">
          {t("{label} signalé à recharger.", { label: selected.label })}
        </p>
      )}
      <label>
        {t("Nom d’appel")}
        <input
          list="station-callsigns"
          maxLength={60}
          value={value.callsign}
          autoFocus
          data-autofocus
          onChange={(e) => {
            const station = radio.stations.find(
              (s) => callsignKey(s.callsign) === callsignKey(e.target.value),
            );
            setValue({
              ...value,
              callsign: e.target.value,
              role: station && !value.role ? station.role : value.role,
              unit: station && !value.unit ? station.unit : value.unit,
            });
          }}
        />
        <datalist id="station-callsigns">
          {radio.stations.map((s) => (
            <option key={s.id} value={s.callsign}>
              {s.role}
            </option>
          ))}
        </datalist>
      </label>
      {held?.terminal && (
        <p className="hint warn">
          {t("{callsign} détient déjà {terminal} ({holder}).", {
            callsign: value.callsign,
            terminal: held.terminal.label,
            holder: held.assignment?.holder,
          })}
        </p>
      )}
      {value.callsign.trim() &&
        !radio.stations.some(
          (s) => callsignKey(s.callsign) === callsignKey(value.callsign),
        ) && (
          <p className="hint">{t("Nom d’appel absent du plan du réseau.")}</p>
        )}
      <div className="form-trio">
        <label>
          <span>
            {t("Détenteur")} <span className="required">*</span>
          </span>
          <input
            required
            maxLength={200}
            value={value.holder}
            onChange={(e) => set("holder", e.target.value)}
            placeholder={t("Grade, nom")}
          />
        </label>
        <label>
          {t("Fonction")}
          <input
            maxLength={200}
            value={value.role}
            onChange={(e) => set("role", e.target.value)}
          />
        </label>
        <label>
          {t("Section")}
          <input
            maxLength={200}
            value={value.unit}
            onChange={(e) => set("unit", e.target.value)}
          />
        </label>
      </div>
      <fieldset className="chips-field">
        <legend>{t("Accessoires remis")}</legend>
        {ACCESSORIES.map((a) => (
          <button
            type="button"
            key={a}
            className="chip"
            aria-pressed={accessories.includes(a)}
            onClick={() =>
              set(
                "accessories",
                (accessories.includes(a)
                  ? accessories.filter((x) => x !== a)
                  : [...accessories, a]
                ).join(", "),
              )
            }
          >
            {enumLabel(a)}
          </button>
        ))}
      </fieldset>
      <div className="form-pair">
        <Select
          label={t("Batterie")}
          value={value.battery}
          values={BATTERY_LEVELS}
          onChange={(v) => set("battery", v)}
        />
        <label>
          {t("Remarques")}
          <input
            maxLength={1000}
            value={value.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </label>
      </div>
      <Toggle checked={log} onChange={setLog}>
        {t("Consigner la remise au journal")}
      </Toggle>
      <Toggle checked={print} onChange={setPrint}>
        {t("Imprimer la quittance de remise à signer")}
      </Toggle>
    </Shell>
  );
}

export function ReturnForm({
  terminal,
  onClose,
  onReturn,
}: {
  terminal: Terminal;
  onClose: () => void;
  onReturn: (
    at: string,
    condition: Terminal["condition"],
    notes: string,
    log: boolean,
  ) => void;
}) {
  const open = activeAssignment(terminal)!;
  const [at, setAt] = useState(now());
  const [condition, setCondition] =
    useState<Terminal["condition"]>("Opérationnel");
  const [complete, setComplete] = useState(true);
  const [notes, setNotes] = useState("");
  const [log, setLog] = useState(true);
  return (
    <Shell
      title={t("Retour {label}", { label: terminal.label })}
      submit={t("Enregistrer le retour")}
      onClose={onClose}
      onSubmit={() =>
        onReturn(
          at,
          condition,
          [
            complete
              ? ""
              : t("Retour incomplet. Remis : {list}.", {
                  list:
                    accessoriesLabel(open.accessories) || t("aucun accessoire"),
                }),
            notes,
          ]
            .filter(Boolean)
            .join(" "),
          log,
        )
      }
    >
      <dl className="spec compact">
        <div>
          <dt>{t("Détenteur")}</dt>
          <dd>{open.holder}</dd>
        </div>
        <div>
          <dt>{t("Nom d’appel")}</dt>
          <dd>{open.callsign || "—"}</dd>
        </div>
        <div>
          <dt>{t("Accessoires")}</dt>
          <dd>{accessoriesLabel(open.accessories) || "—"}</dd>
        </div>
      </dl>
      <div className="form-pair">
        <label>
          {t("Heure de retour")}
          <input
            type="datetime-local"
            required
            value={localInput(at)}
            onChange={(e) => e.target.value && setAt(fromInput(e.target.value))}
          />
        </label>
        <Select
          label={t("État au retour")}
          value={condition}
          values={TERMINAL_CONDITIONS}
          onChange={setCondition}
        />
      </div>
      <Toggle checked={complete} onChange={setComplete}>
        {t("Retour complet (terminal et accessoires)")}
      </Toggle>
      <label>
        {t("Remarques")}
        <input
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {condition === "Manquant" && (
        <p className="hint crit">
          {t(
            "Annoncez la perte pour blocage du terminal selon la procédure cantonale.",
          )}
        </p>
      )}
      <Toggle checked={log} onChange={setLog}>
        {t("Consigner le retour au journal")}
      </Toggle>
    </Shell>
  );
}

export function CheckForm({
  radio,
  author,
  callsign = "",
  onClose,
  onCheck,
}: {
  radio: Radio;
  author: string;
  callsign?: string;
  onClose: () => void;
  onCheck: (check: RadioCheck, log: boolean) => void;
}) {
  const station = radio.stations.find(
    (s) => callsignKey(s.callsign) === callsignKey(callsign),
  );
  const [value, setValue] = useState<RadioCheck>({
    id: crypto.randomUUID(),
    at: now(),
    by: author,
    callsign,
    talkgroupId: station?.primary ?? radio.talkgroups[0]?.id ?? "",
    result: "3",
    notes: "",
  });
  const [log, setLog] = useState(false);
  const set = <K extends keyof RadioCheck>(key: K, v: RadioCheck[K]) =>
    setValue({ ...value, [key]: v });
  return (
    <Shell
      title={t("Contrôle de liaison")}
      submit={t("Enregistrer")}
      onClose={onClose}
      onSubmit={() => {
        if (!value.callsign.trim()) throw new Error(t("Nom d’appel requis."));
        onCheck({ ...value, callsign: value.callsign.trim() }, log);
      }}
    >
      <div className="form-pair">
        <label>
          <span>
            {t("Nom d’appel")} <span className="required">*</span>
          </span>
          <input
            list="station-callsigns"
            required
            maxLength={60}
            value={value.callsign}
            autoFocus={!callsign}
            data-autofocus={!callsign || undefined}
            onChange={(e) => {
              const s = radio.stations.find(
                (x) => callsignKey(x.callsign) === callsignKey(e.target.value),
              );
              setValue({
                ...value,
                callsign: e.target.value,
                talkgroupId: s?.primary || value.talkgroupId,
              });
            }}
          />
          <datalist id="station-callsigns">
            {radio.stations.map((s) => (
              <option key={s.id} value={s.callsign} />
            ))}
          </datalist>
        </label>
        <GroupSelect
          radio={radio}
          label={t("Groupe / canal")}
          value={value.talkgroupId}
          onChange={(v) => set("talkgroupId", v)}
        />
      </div>
      <fieldset className="chips-field">
        <legend>{t("Audibilité")}</legend>
        {CHECK_RESULTS.map((r) => (
          <button
            type="button"
            key={r}
            className={`chip score-${r}`}
            aria-pressed={value.result === r}
            onClick={() => set("result", r)}
          >
            {checkLabel(r)}
          </button>
        ))}
      </fieldset>
      <div className="form-pair">
        <label>
          {t("Heure")}
          <input
            type="datetime-local"
            required
            value={localInput(value.at)}
            onChange={(e) =>
              e.target.value && set("at", fromInput(e.target.value))
            }
          />
        </label>
        <label>
          {t("Remarques")}
          <input
            maxLength={500}
            value={value.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={t("Emplacement, antenne")}
          />
        </label>
      </div>
      <Toggle checked={log} onChange={setLog}>
        {t("Consigner au journal")}
      </Toggle>
    </Shell>
  );
}
