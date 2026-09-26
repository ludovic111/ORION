import { useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  CalendarRange,
  LogIn,
  LogOut,
  Printer,
  QrCode,
  ScanLine,
  Trash2,
} from "lucide-react";
import { dateTime, time } from "../../../shared/journal";
import { parseRef, ref } from "../../../shared/links";
import { removeRecords, upsert, type Member } from "../../../shared/ops";
import type { Shift } from "../../../shared/conduct-schemas";
import {
  checkIn,
  checkOut,
  currentShifts,
  dutyBoard,
  formatDuration,
  planShifts,
  presenceRules,
  restedAt,
  shiftWarnings,
  type Duty,
} from "../../../shared/presence";
import { toZurichInput } from "../../../shared/time";
import { useApp } from "../../app/context";
import { Figures } from "../../ui/Figures";
import { Sheet } from "../../ui/Sheet";
import { Modal } from "../../journal/Modal";
import { DateTimeField, NumberField, TextField } from "../../ui/fields";
import { LinksPanel, KIND_ICON } from "../../ui/links";
import { TraceLine } from "../../timeline/TraceLine";
import { CodeScanner } from "../../radio/Scanner";
import { memberFromCode, presenceUrl } from "../../print/badges";
import { nextRoundHour } from "../agenda/rhythm";
import "../../ui/conduct.css";

type ShiftDraft = Omit<Shift, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<Shift, "id" | "createdAt" | "updatedAt" | "by">>;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .trim();

export function Presence() {
  const {
    journal,
    live,
    now,
    readOnly,
    canWrite,
    updateOps,
    author,
    toast,
    print,
    focus,
    setFocus,
  } = useApp();
  const ops = journal.ops;
  const members = ops.members;
  const rules = presenceRules(ops);
  const board = useMemo(() => dutyBoard(ops, now), [ops, now]);
  const byMember = new Map(board.map((d) => [d.memberId, d]));
  const [scanning, setScanning] = useState(false);
  const [shift, setShift] = useState<ShiftDraft | null>(null);
  const [planning, setPlanning] = useState(false);
  const [asked, setAsked] = useState<Member | null>(null);
  const shifts = useMemo(
    () => [...ops.shifts].sort((a, b) => a.start.localeCompare(b.start)),
    [ops.shifts],
  );
  const warnings = useMemo(
    () => shiftWarnings(ops.shifts, members, rules),
    [ops.shifts, members, rules],
  );
  const running = currentShifts(ops.shifts, now);

  // A badge scanned with the phone camera opens #team/presence=<id>.
  useEffect(() => {
    const id = memberFromCode(location.hash);
    if (!id) return;
    history.replaceState(null, "", "#team");
    const m = live.ops.members.find((x) => x.id === id);
    if (m) setAsked(m);
    else toast("Badge inconnu dans ce journal.");
  }, [live.ops.members, toast]);
  useEffect(() => {
    if (!focus?.startsWith("shift:")) return;
    const { id } = parseRef(focus);
    setFocus(null);
    const found = ops.shifts.find((s) => s.id === id);
    if (found) setShift(found);
  }, [focus, ops.shifts, setFocus]);

  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        const x = byMember.get(a.id);
        const y = byMember.get(b.id);
        return (
          Number(!!y?.present) - Number(!!x?.present) ||
          Number(!!y?.warnings.length) - Number(!!x?.warnings.length) ||
          a.name.localeCompare(b.name, "fr")
        );
      }),
    [members, board],
  );
  const present = board.filter((d) => d.present).length;
  const alerts = board.filter((d) => d.warnings.length).length;

  /** Arrival or departure; returns the message shown. */
  function toggle(m: Member, via = "Bouton"): string {
    if (!canWrite()) return "";
    const d = byMember.get(m.id);
    const at = new Date().toISOString();
    try {
      if (d?.present) {
        updateOps((o) => checkOut(o, m.id, author, at));
        const message = `Départ de ${m.name} à ${time(at)}.`;
        toast(message);
        return message;
      }
      updateOps((o) => checkIn(o, m, author, at, via));
      const rest = d ? restedAt(d, rules) : null;
      const message =
        rest && rest > Date.parse(at)
          ? `Arrivée de ${m.name} à ${time(at)} — repos trop court (reprise prévue dès ${time(new Date(rest).toISOString())}).`
          : `Arrivée de ${m.name} à ${time(at)}.`;
      toast(message);
      return message;
    } catch (err) {
      toast((err as Error).message);
      return "";
    }
  }

  function setRules(patch: Partial<typeof rules>) {
    if (!canWrite()) return;
    try {
      updateOps((o) => ({
        ...o,
        settings: {
          ...o.settings,
          presence: { ...presenceRules(o), ...patch },
        },
      }));
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function printList() {
    const name = new Map(members.map((m) => [m.id, m]));
    const stays = [...ops.presences].sort((a, b) => a.in.localeCompare(b.in));
    print({
      kind: "tables",
      journal,
      title: "Liste de présence",
      extra: `${present} présent(s) · maximum ${rules.dutyHours} h de service, repos ${rules.restHours} h`,
      landscape: false,
      name: "liste-de-presence",
      tables: [
        {
          id: "now",
          title: "Présents maintenant",
          caption: `${present} personne(s)`,
          head: ["Nom", "Grade", "Fonction", "Depuis", "Service", "Signature"],
          body: board
            .filter((d) => d.present)
            .map((d) => {
              const m = name.get(d.memberId);
              return [
                d.name,
                m?.grade ?? "",
                m?.role ?? "",
                d.since ? dateTime(new Date(d.since).toISOString()) : "",
                `${formatDuration(d.span)}${d.over ? " (dépassé)" : ""}`,
                "",
              ];
            }),
          widths: [40, 16, 38, 30, 24, 34],
        },
        {
          id: "stays",
          title: "Arrivées et départs",
          caption: `${stays.length} passage(s)`,
          head: ["Nom", "Arrivée", "Départ", "Durée", "Par"],
          body: stays.map((p) => [
            name.get(p.memberId)?.name ?? p.name,
            dateTime(p.in),
            p.out ? dateTime(p.out) : "présent",
            formatDuration(
              (p.out ? Date.parse(p.out) : now) - Date.parse(p.in),
            ),
            p.via,
          ]),
          widths: [48, 38, 38, 26, 32],
        },
        ...(shifts.length
          ? [
              {
                id: "shifts",
                title: "Plan de relève",
                caption: `${shifts.length} relève(s)`,
                head: ["Relève", "Début", "Fin", "Personnes"],
                body: shifts.map((s) => [
                  s.title,
                  dateTime(s.start),
                  dateTime(s.end),
                  [
                    ...s.memberIds.map((id) => name.get(id)?.name ?? "?"),
                    s.people,
                  ]
                    .filter(Boolean)
                    .join(", "),
                ]),
                widths: [34, 34, 34, 80],
              },
            ]
          : []),
      ],
    });
  }

  function printBadges(list: Member[]) {
    const cells = new Map(ops.cells.map((c) => [c.id, c.name]));
    print({
      kind: "badges",
      journal,
      badges: list.map((m) => ({
        id: m.id,
        name: [m.grade, m.name].filter(Boolean).join(" "),
        line: m.role,
        sub: [cells.get(m.cellId), m.callsign].filter(Boolean).join(" · "),
        code: presenceUrl(location.origin, m.id),
      })),
    });
  }

  const find = (value: string): Member | undefined => {
    const id = memberFromCode(value);
    if (id) return live.ops.members.find((m) => m.id === id);
    const key = norm(value);
    return live.ops.members.find(
      (m) => norm(m.name) === key || (m.callsign && norm(m.callsign) === key),
    );
  };

  return (
    <>
      <Figures
        label="Présences au PC"
        items={[
          { label: "Au PC", value: present },
          { label: "Personnes", value: members.length },
          {
            label: "Temps ou repos à surveiller",
            value: alerts,
            tone: alerts ? "crit" : "",
          },
          {
            label: "Relève en cours",
            value: running.now.map((s) => s.title).join(", ") || "—",
          },
        ]}
      />
      <div className="cd-toolbar">
        {!readOnly && (
          <button className="primary" onClick={() => setScanning(true)}>
            <ScanLine size={14} />
            Scanner un badge
          </button>
        )}
        <button onClick={printList}>
          <Printer size={14} />
          Liste de présence
        </button>
        <button onClick={() => printBadges(members)} disabled={!members.length}>
          <QrCode size={14} />
          Badges QR
        </button>
      </div>
      <div className="pr-layout">
        <section className="card" aria-label="Appel">
          <div className="card-head">
            <LogIn size={15} />
            <h2>Appel</h2>
            <span className="pill plain">
              {present}/{members.length}
            </span>
          </div>
          {!members.length && (
            <p className="muted">
              Ajoutez d’abord les personnes dans l’organigramme : chacune pourra
              ensuite pointer son arrivée et son départ.
            </p>
          )}
          {sorted.map((m) => (
            <PersonRow
              key={m.id}
              member={m}
              duty={byMember.get(m.id)}
              onToggle={() => toggle(m)}
              onBadge={() => printBadges([m])}
            />
          ))}
          {board
            .filter((d) => !members.some((m) => m.id === d.memberId))
            .map((d, i) => (
              <div key={`x${i}`} className="pr-row">
                <span className="pr-who">
                  <strong>{d.name}</strong>
                  <small>
                    retiré de l’équipe · {d.present ? "présent" : "parti"}
                  </small>
                </span>
                <span className="pr-time">{formatDuration(d.span)}</span>
              </div>
            ))}
        </section>
        <section className="card" aria-label="Plan de relève">
          <div className="card-head">
            <CalendarRange size={15} />
            <h2>Plan de relève</h2>
            {!readOnly && (
              <span className="cd-toolbar" style={{ margin: 0 }}>
                <button className="small" onClick={() => setPlanning(true)}>
                  <CalendarPlus size={13} />
                  Planifier
                </button>
                <button
                  className="small"
                  onClick={() =>
                    setShift({
                      title: `Relève ${shifts.length + 1}`,
                      start: nextRoundHour(),
                      end: new Date(
                        Date.parse(nextRoundHour()) + 12 * 3_600_000,
                      ).toISOString(),
                      memberIds: [],
                      people: "",
                      notes: "",
                    })
                  }
                >
                  Ajouter
                </button>
              </span>
            )}
          </div>
          {warnings.length > 0 && (
            <ul className="cd-warnings">
              {warnings.map((w, i) => (
                <li key={i}>{w.text}</li>
              ))}
            </ul>
          )}
          {!shifts.length && (
            <p className="muted">
              Aucune relève prévue. « Planifier » crée par exemple trois relèves
              de 8 heures à partir de l’heure choisie.
            </p>
          )}
          {shifts.map((s) => {
            const isNow = running.now.some((x) => x.id === s.id);
            const names = s.memberIds
              .map((id) => members.find((m) => m.id === id)?.name)
              .filter(Boolean);
            return (
              <div key={s.id} className={`pr-shift ${isNow ? "now" : ""}`}>
                <div className="pr-shift-head">
                  <strong>{s.title}</strong>
                  <span className="mono">
                    {dateTime(s.start)} → {time(s.end)}
                  </span>
                  <button className="small" onClick={() => setShift(s)}>
                    Ouvrir
                  </button>
                </div>
                <div className="pr-people">
                  {names.map((n) => (
                    <span key={n} className="pill plain">
                      {n}
                    </span>
                  ))}
                  {s.people && <span className="muted">{s.people}</span>}
                  {!names.length && !s.people && (
                    <span className="muted">Personne encore</span>
                  )}
                </div>
              </div>
            );
          })}
          <div className="pr-rules" style={{ marginTop: 14 }}>
            <NumberField
              label="Service maximum (h)"
              value={rules.dutyHours}
              min={1}
              max={72}
              onChange={(dutyHours) => setRules({ dutyHours })}
            />
            <NumberField
              label="Repos minimum (h)"
              value={rules.restHours}
              min={0}
              max={48}
              onChange={(restHours) => setRules({ restHours })}
            />
          </div>
        </section>
      </div>
      {scanning && (
        <CodeScanner<Member>
          title="Scanner un badge de présence"
          placeholder="Nom ou nom d’appel"
          manualLabel="Nom de la personne"
          help="Lecture de QR indisponible dans ce navigateur. Tapez le nom, ou scannez le badge avec l’appareil photo du téléphone : le lien ouvre l’appel de cette personne."
          continuous
          find={find}
          unknown={(v) => `Personne inconnue : ${v}`}
          onFound={(m) => toggle(m, "QR")}
          onClose={() => setScanning(false)}
        />
      )}
      {asked && (
        <Modal title="Badge de présence" onClose={() => setAsked(null)}>
          <p>
            <strong>{asked.name}</strong>
            {asked.role && ` · ${asked.role}`}
          </p>
          <div className="modal-actions">
            <button onClick={() => setAsked(null)}>Annuler</button>
            <button
              className="primary"
              onClick={() => {
                toggle(asked, "QR");
                setAsked(null);
              }}
            >
              {byMember.get(asked.id)?.present
                ? "Pointer le départ"
                : "Pointer l’arrivée"}
            </button>
          </div>
        </Modal>
      )}
      {planning && <PlanDialog onClose={() => setPlanning(false)} />}
      {shift && (
        <ShiftSheet
          key={shift.id ?? "new"}
          initial={shift}
          members={members}
          onClose={() => setShift(null)}
        />
      )}
    </>
  );
}

function PersonRow({
  member: m,
  duty,
  onToggle,
  onBadge,
}: {
  member: Member;
  duty: Duty | undefined;
  onToggle: () => void;
  onBadge: () => void;
}) {
  const { readOnly, now, journal } = useApp();
  const rules = presenceRules(journal.ops);
  const d = duty;
  const rest = d ? restedAt(d, rules) : null;
  const hhmm = (ms: number) => time(new Date(ms).toISOString());
  const line = d?.present
    ? `au PC depuis ${hhmm(d.stay!)}${d.since !== d.stay ? `, service compté depuis ${hhmm(d.since!)}` : ""}`
    : d?.lastOut
      ? `parti à ${time(new Date(d.lastOut).toISOString())}, repos ${formatDuration(d.resting)}${rest && rest > now ? ` · reprise dès ${time(new Date(rest).toISOString())}` : ""}`
      : "pas encore pointé";
  return (
    <div className="pr-row">
      <span className="pr-who">
        <strong>{[m.grade, m.name].filter(Boolean).join(" ")}</strong>
        <small>{[m.role, line].filter(Boolean).join(" · ")}</small>
        {d?.warnings.map((w) => (
          <small key={w} className="cd-late">
            {w}
          </small>
        ))}
      </span>
      {d?.present && (
        <span
          className={`pr-time ${d.over ? "over" : ""}`}
          title="Temps de service"
        >
          {formatDuration(d.span)}
        </span>
      )}
      <button
        className="icon-button"
        aria-label={`Badge de ${m.name}`}
        title="Imprimer le badge"
        onClick={onBadge}
      >
        <QrCode size={14} />
      </button>
      {!readOnly && (
        <button
          className={`small ${d?.present ? "" : "primary"}`}
          onClick={onToggle}
        >
          {d?.present ? <LogOut size={13} /> : <LogIn size={13} />}
          {d?.present ? "Départ" : "Arrivée"}
        </button>
      )}
    </div>
  );
}

function PlanDialog({ onClose }: { onClose: () => void }) {
  const { updateOps, author, toast, canWrite } = useApp();
  const [start, setStart] = useState(nextRoundHour());
  const [hours, setHours] = useState(8);
  const [count, setCount] = useState(3);
  const [title, setTitle] = useState("Relève");
  const plan = start ? planShifts(Date.parse(start), hours, count, title) : [];
  return (
    <Modal title="Planifier des relèves" onClose={onClose}>
      <div className="form-grid">
        <DateTimeField
          className="span-2"
          label="Début de la première relève"
          value={start}
          onChange={setStart}
        />
        <NumberField
          label="Durée (heures)"
          value={hours}
          min={1}
          max={24}
          onChange={setHours}
        />
        <NumberField
          label="Nombre de relèves"
          value={count}
          min={1}
          max={21}
          onChange={setCount}
        />
        <TextField
          className="span-2"
          label="Nom"
          value={title}
          maxLength={100}
          onChange={setTitle}
        />
      </div>
      <p className="hint">
        {plan
          .map(
            (s) =>
              `${s.title} : ${toZurichInput(s.start).replace("T", " ")} → ${toZurichInput(s.end, "time")}`,
          )
          .join(" · ")}
      </p>
      <div className="modal-actions">
        <button onClick={onClose}>Annuler</button>
        <button
          className="primary"
          disabled={!plan.length}
          onClick={() => {
            if (!canWrite()) return;
            try {
              updateOps((o) =>
                plan.reduce(
                  (acc, s) =>
                    upsert(
                      acc,
                      "shifts",
                      { ...s, memberIds: [], people: "", notes: "" },
                      author,
                    ),
                  o,
                ),
              );
              toast(
                `${plan.length} relève(s) planifiée(s). Ajoutez les personnes.`,
              );
              onClose();
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
          Créer
        </button>
      </div>
    </Modal>
  );
}

function ShiftSheet({
  initial,
  members,
  onClose,
}: {
  initial: ShiftDraft;
  members: Member[];
  onClose: () => void;
}) {
  const { readOnly, canWrite, updateOps, author, toast } = useApp();
  const [value, setValue] = useState<ShiftDraft>(initial);
  const [error, setError] = useState("");
  const Icon = KIND_ICON.shift;
  const dirty = JSON.stringify(value) !== JSON.stringify(initial) && !readOnly;
  function save() {
    if (!canWrite()) return;
    if (!value.title.trim()) return setError("Donnez un nom à la relève.");
    if (!value.start || !value.end || value.end <= value.start)
      return setError("La fin doit suivre le début.");
    try {
      updateOps((o) => upsert(o, "shifts", value, author));
      toast("Relève enregistrée.");
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const toggle = (id: string) =>
    setValue((v) => ({
      ...v,
      memberIds: v.memberIds.includes(id)
        ? v.memberIds.filter((x) => x !== id)
        : [...v.memberIds, id],
    }));
  return (
    <Sheet
      title={initial.id ? value.title : "Nouvelle relève"}
      eyebrow={
        <>
          <Icon size={12} />
          Relève
        </>
      }
      dirty={dirty}
      onClose={onClose}
      footer={
        readOnly ? (
          <span className="muted">Lecture seule.</span>
        ) : (
          <>
            {initial.id && (
              <button
                className="danger"
                onClick={() => {
                  if (
                    !canWrite() ||
                    !window.confirm("Supprimer cette relève ?")
                  )
                    return;
                  updateOps((o) => removeRecords(o, [initial.id!]));
                  toast("Relève supprimée.");
                  onClose();
                }}
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
            <button className="push" onClick={onClose}>
              Annuler
            </button>
            <button className="primary" onClick={save}>
              Enregistrer
            </button>
          </>
        )
      }
    >
      <fieldset
        disabled={readOnly}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <div className="form-grid">
          <TextField
            className="span-2"
            label="Nom"
            required
            value={value.title}
            maxLength={120}
            onChange={(title) => setValue((v) => ({ ...v, title }))}
          />
          <DateTimeField
            label="Début"
            required
            value={value.start}
            onChange={(start) => setValue((v) => ({ ...v, start }))}
          />
          <DateTimeField
            label="Fin"
            required
            value={value.end}
            onChange={(end) => setValue((v) => ({ ...v, end }))}
          />
          <div className="span-2">
            <span className="label">Personnes</span>
            <div
              className="pr-members"
              role="group"
              aria-label="Personnes de la relève"
            >
              {members.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className="small"
                  aria-pressed={value.memberIds.includes(m.id)}
                  onClick={() => toggle(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <TextField
            className="span-2"
            label="Autres personnes (texte libre)"
            value={value.people}
            maxLength={1000}
            onChange={(people) => setValue((v) => ({ ...v, people }))}
          />
          <TextField
            className="span-2"
            label="Remarques"
            rows={2}
            value={value.notes}
            maxLength={1000}
            onChange={(notes) => setValue((v) => ({ ...v, notes }))}
          />
        </div>
      </fieldset>
      {error && (
        <p className="error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      {initial.id && (
        <>
          <div style={{ marginTop: 22 }}>
            <LinksPanel target={ref("shift", initial.id)} />
          </div>
          <TraceLine
            target={initial.id}
            createdAt={initial.createdAt}
            createdBy={initial.by}
            updatedAt={initial.updatedAt}
          />
        </>
      )}
    </Sheet>
  );
}
