import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenCheck,
  Clapperboard,
  Download,
  EyeOff,
  FileUp,
  LockKeyhole,
  Megaphone,
  Pencil,
  Play,
  Plus,
  Send,
  Square,
  Trash2,
  Undo2,
} from "lucide-react";
import { useApp } from "../../app/context";
import { Sheet } from "../../ui/Sheet";
import { Modal } from "../../journal/Modal";
import {
  ChoiceField,
  ComboField,
  DateTimeField,
  NumberField,
  Segmented,
  TextField,
  fromInput,
  localInput,
} from "../../ui/fields";
import { current, dateTime, numberLabel } from "../../../shared/journal";
import {
  blankInject,
  deliverInject,
  exportScenario,
  importScenario,
  isExercise,
  parseScenarioFile,
  reactionOf,
  scenarioOf,
  schedule,
  tPlus,
  type Reaction,
} from "../../../shared/exercise";
import { minutesLabel } from "../../../shared/debrief";
import { ARVE_SCENARIO } from "../../../shared/scenario-arve";
import {
  INJECT_CHANNELS,
  MESSAGE_PRIORITIES,
  RESOURCE_STATUSES,
  upsert,
  type Inject,
  type InjectEffect,
  type Ops,
} from "../../../shared/ops";
import { useDirector } from "../../exercise/director";
import { formatTime } from "../../../shared/i18n/core.ts";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { rich, useLang } from "../../i18n";
import { t, tn } from "./i18n.ts";

// The direction of the exercise: writes the scenario (timed injects), starts
// the exercise (T0), sees what is due, reads out the injects to be read and
// marks the reactions. Hidden from the players behind a short code kept on
// this post (src/exercise/director.ts), which is not a security measure.

const hhmm = (ms: number | null) => (ms === null ? "—" : formatTime(ms));

function useTicker(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms]);
  return now;
}

function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "scenario";

export function Direction() {
  const { live } = useApp();
  const director = useDirector(live.id);
  useLang();
  if (!isExercise(live)) return null;
  return director.on ? (
    <DirectorView onLeave={director.leave} />
  ) : (
    <Lock
      hasPin={director.hasPin}
      onEnter={director.enter}
      onForget={director.forget}
    />
  );
}

// ---------- Lock ----------

function Lock({
  hasPin,
  onEnter,
  onForget,
}: {
  hasPin: boolean;
  onEnter: (pin: string) => Promise<string | null>;
  onForget: (pin: string) => Promise<string | null>;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="card db-card db-lock" aria-labelledby="db-lock">
      <div className="card-head">
        <LockKeyhole size={18} />
        <h2 id="db-lock">{t("Réservé à la direction d’exercice")}</h2>
      </div>
      <p>
        {t(
          "Le scénario et les injects à venir ne sont montrés qu’aux postes de la direction.",
        )}{" "}
        {hasPin
          ? t("Saisissez le code choisi sur ce poste.")
          : t(
              "Choisissez un code de 4 à 8 chiffres pour ce poste : il sera demandé pour revenir ici.",
            )}
      </p>
      <form
        className="db-lock-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const why = await onEnter(pin);
          setError(why ?? "");
          if (!why) setPin("");
        }}
      >
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
          }
          aria-label={t("Code de la direction")}
          placeholder={t("Code")}
        />
        <button type="submit" className="primary" disabled={pin.length < 4}>
          {hasPin ? t("Ouvrir") : t("Choisir ce code et ouvrir")}
        </button>
        {hasPin && (
          <button
            type="button"
            className="link"
            onClick={async () => {
              const why = await onForget(pin);
              setError(why ?? t("Code oublié : choisissez-en un nouveau."));
            }}
          >
            {t("Oublier le code")}
          </button>
        )}
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p className="db-note">
        {t(
          "Ce code évite qu’un joueur ouvre le scénario par mégarde. Ce n’est pas une protection : le scénario voyage avec le journal (synchronisation, archives, traçabilité) comme tout le reste.",
        )}
      </p>
    </section>
  );
}

// ---------- Direction ----------

function DirectorView({ onLeave }: { onLeave: () => void }) {
  const app = useApp();
  const { live, author, canWrite, updateOps, toast } = app;
  const now = useTicker(5000);
  const scenario = scenarioOf(live.ops);
  const start = scenario?.startAt ? Date.parse(scenario.startAt) : null;
  const rows = useMemo(
    () =>
      schedule(live.ops.injects, scenario).map(({ inject }) =>
        reactionOf(live, inject, scenario?.startAt ?? "", now),
      ),
    [live, scenario, now],
  );
  const [editing, setEditing] = useState<Inject | "new" | null>(null);
  const [reacting, setReacting] = useState<Reaction | null>(null);
  const [editScenario, setEditScenario] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const by = t("{author} · direction d’exercice", { author });

  const write = (change: (ops: Ops) => Ops, done?: string) => {
    if (!canWrite()) return false;
    try {
      updateOps(change);
      if (done) toast(done);
      return true;
    } catch (err) {
      toast((err as Error).message);
      return false;
    }
  };
  const setScenario = (patch: Partial<NonNullable<typeof scenario>>) =>
    write((ops) => {
      const s = scenarioOf(ops);
      return upsert(
        ops,
        "scenarios",
        s
          ? { ...s, ...patch }
          : {
              title: live.title,
              description: "",
              startAt: "",
              endedAt: "",
              autoplay: false,
              ...patch,
            },
        author,
      );
    });
  const deliver = (inject: Inject) =>
    write(
      (ops) => deliverInject({ ops, history: live.history }, inject.id, by),
      inject.delivery === "message"
        ? t("Inject envoyé : {title}", { title: inject.title })
        : t("Inject lu : {title}", { title: inject.title }),
    );
  const patchInject = (inject: Inject, patch: Partial<Inject>, done?: string) =>
    write((ops) => {
      const latest = ops.injects.find((i) => i.id === inject.id);
      return latest
        ? upsert(ops, "injects", { ...latest, ...patch }, author)
        : ops;
    }, done);
  const load = (text: unknown, name: string) => {
    try {
      const parsed = parseScenarioFile(text);
      const pending = live.ops.injects.filter((i) => !i.deliveredAt).length;
      if (
        pending &&
        !window.confirm(
          t(
            "Remplacer les {pending} injects pas encore joués par ceux de « {title} » ({count}) ?",
            {
              pending,
              title: parsed.title,
              count: parsed.injects.length,
            },
          ),
        )
      )
        return;
      write(
        (ops) => importScenario(ops, parsed, author),
        t("Scénario « {title} » chargé depuis {name} : {count} injects.", {
          title: parsed.title,
          name,
          count: parsed.injects.length,
        }),
      );
    } catch (err) {
      toast((err as Error).message);
    }
  };

  const toRead = rows.filter(
    (r) =>
      r.inject.delivery === "read" &&
      !r.inject.deliveredAt &&
      !r.inject.skipped &&
      r.due !== null &&
      r.due <= now &&
      !scenario?.endedAt,
  );
  const next = rows.find(
    (r) =>
      r.due !== null &&
      r.due > now &&
      !r.inject.deliveredAt &&
      !r.inject.skipped,
  );
  const played = rows.filter((r) => r.delivered !== null).length;

  return (
    <div className="db db-direction">
      <section className="card db-card" aria-labelledby="db-scenario">
        <div className="card-head">
          <Clapperboard size={18} />
          <h2 id="db-scenario">{scenario?.title || t("Scénario")}</h2>
          <button
            className="small"
            onClick={() => setEditScenario(true)}
            title={t("Titre et description du scénario")}
          >
            <Pencil size={13} />
            {t("Modifier")}
          </button>
        </div>
        {scenario?.description && (
          <p className="db-note">{scenario.description}</p>
        )}
        <div className="db-state">
          {start === null ? (
            <span className="pill plain">{t("Pas encore commencé")}</span>
          ) : scenario?.endedAt ? (
            <span className="pill muted">
              {t("Terminé à {time}", {
                time: hhmm(Date.parse(scenario.endedAt)),
              })}
            </span>
          ) : (
            <span className="pill ok">
              {rich(
                t("En cours · <0>{elapsed}</0>", {
                  elapsed: tPlus(now, start),
                }),
                [<span className="mono" />],
              )}
            </span>
          )}
          <span className="muted">
            {t("{played} / {total} injects joués", {
              played,
              total: rows.length,
            })}
            {next && next.due !== null && start !== null
              ? t(" · prochain {at} ({time}) : {title}", {
                  at: tPlus(next.due, start),
                  time: hhmm(next.due),
                  title: next.inject.title,
                })
              : ""}
          </span>
        </div>
        <div className="db-actions">
          {start === null || scenario?.endedAt ? (
            <button
              className="primary"
              disabled={!rows.length}
              onClick={() =>
                setScenario({
                  startAt:
                    scenario?.endedAt && scenario.startAt
                      ? scenario.startAt
                      : new Date().toISOString(),
                  endedAt: "",
                }) &&
                toast(
                  scenario?.endedAt
                    ? t("Exercice repris.")
                    : t("Exercice commencé : T0 maintenant."),
                )
              }
            >
              <Play size={14} />
              {scenario?.endedAt
                ? t("Reprendre")
                : t("Commencer maintenant (T0)")}
            </button>
          ) : (
            <button
              onClick={() =>
                window.confirm(
                  t("Terminer l’exercice ? Plus aucun inject ne partira."),
                ) && setScenario({ endedAt: new Date().toISOString() })
              }
            >
              <Square size={14} />
              {t("Terminer l’exercice")}
            </button>
          )}
          <button onClick={() => setEditing("new")}>
            <Plus size={14} />
            {t("Inject")}
          </button>
          <button onClick={() => file.current?.click()}>
            <FileUp size={14} />
            {t("Importer")}
          </button>
          <button
            disabled={!rows.length}
            onClick={() =>
              download(
                JSON.stringify(exportScenario(live.ops), null, 2),
                `orion-aic-scenario-${slug(scenario?.title ?? live.title)}.json`,
              )
            }
          >
            <Download size={14} />
            {t("Exporter")}
          </button>
          <button
            onClick={() => load(ARVE_SCENARIO, t("l’exemple"))}
            title={t("Scénario d’exemple « Crue de l’Arve » (fictif)")}
          >
            <BookOpenCheck size={14} />
            {t("Exemple « Crue de l’Arve »")}
          </button>
          <button className="link" onClick={onLeave}>
            <EyeOff size={14} />
            {t("Masquer (mode joueur)")}
          </button>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 4 * 1024 * 1024) {
                toast(t("Fichier trop grand pour un scénario (4 Mo au plus)."));
                return;
              }
              load(await f.text(), f.name);
            }}
          />
        </div>
        {start !== null && !scenario?.endedAt && (
          <DateTimeField
            required
            label={t("Début de l’exercice (T0)")}
            hint={t(
              "Les injects « T+ » partent à partir de cette heure (heure de Zurich).",
            )}
            value={scenario?.startAt ?? ""}
            onChange={(v) => v && setScenario({ startAt: v })}
          />
        )}
      </section>

      {toRead.map((r) => (
        <section
          key={r.inject.id}
          className="card db-card db-read"
          aria-label={t("Inject à lire : {title}", { title: r.inject.title })}
        >
          <div className="card-head">
            <Megaphone size={18} />
            <h2>
              {t("À lire maintenant : {title}", { title: r.inject.title })}
            </h2>
          </div>
          <p className="db-read-meta">
            {r.inject.from || "—"} → {r.inject.to || "—"} ·{" "}
            {enumLabel(r.inject.via)}
            {r.inject.priority !== "Normal"
              ? ` · ${enumLabel(r.inject.priority)}`
              : ""}
          </p>
          <blockquote>{r.inject.body || "—"}</blockquote>
          {r.inject.expected && (
            <p className="db-note">
              {t("Réaction attendue : {expected}", {
                expected: r.inject.expected,
              })}
            </p>
          )}
          <div className="db-actions">
            <button className="primary" onClick={() => deliver(r.inject)}>
              <Send size={14} />
              {t("Lu et transmis")}
            </button>
            <button
              onClick={() =>
                patchInject(r.inject, { skipped: true }, t("Inject non joué."))
              }
            >
              {t("Ne pas jouer")}
            </button>
          </div>
        </section>
      ))}

      <section className="card db-card" aria-labelledby="db-list">
        <div className="card-head">
          <h2 id="db-list">{t("Injects")}</h2>
        </div>
        {rows.length ? (
          <ol className="db-injects">
            {rows.map((r) => (
              <InjectRow
                key={r.inject.id}
                row={r}
                start={start}
                now={now}
                onEdit={() => setEditing(r.inject)}
                onSend={() => deliver(r.inject)}
                onReact={() => setReacting(r)}
                onSkip={() =>
                  patchInject(
                    r.inject,
                    { skipped: !r.inject.skipped },
                    r.inject.skipped
                      ? t("Inject remis au programme.")
                      : t("Inject non joué."),
                  )
                }
              />
            ))}
          </ol>
        ) : (
          <p className="muted">
            {t(
              "Aucun inject. Ajoutez-en un, importez un scénario JSON ou chargez l’exemple « Crue de l’Arve ».",
            )}
          </p>
        )}
      </section>

      {editing && (
        <InjectSheet
          initial={editing === "new" ? null : editing}
          order={live.ops.injects.reduce((n, i) => Math.max(n, i.order + 1), 0)}
          onClose={() => setEditing(null)}
          onSave={(value) =>
            write((ops) => {
              const s = scenarioOf(ops);
              let next = ops;
              if (!s)
                next = upsert(
                  next,
                  "scenarios",
                  {
                    title: live.title,
                    description: "",
                    startAt: "",
                    endedAt: "",
                    autoplay: false,
                  },
                  author,
                );
              return upsert(
                next,
                "injects",
                { ...value, scenarioId: scenarioOf(next)!.id },
                author,
              );
            }, t("Inject enregistré.")) && setEditing(null)
          }
          onDelete={
            editing === "new"
              ? undefined
              : () =>
                  window.confirm(
                    t("Supprimer l’inject « {title} » ?", {
                      title: editing.title,
                    }),
                  ) &&
                  write(
                    (ops) => ({
                      ...ops,
                      injects: ops.injects.filter((i) => i.id !== editing.id),
                    }),
                    t("Inject supprimé."),
                  ) &&
                  setEditing(null)
          }
        />
      )}
      {reacting && (
        <ReactionDialog
          row={reacting}
          onClose={() => setReacting(null)}
          onSave={(patch) =>
            patchInject(reacting.inject, patch, t("Réaction notée.")) &&
            setReacting(null)
          }
        />
      )}
      {editScenario && (
        <ScenarioDialog
          title={scenario?.title ?? live.title}
          description={scenario?.description ?? ""}
          onClose={() => setEditScenario(false)}
          onSave={(title, description) =>
            setScenario({ title, description }) && setEditScenario(false)
          }
        />
      )}
    </div>
  );
}

function InjectRow({
  row,
  start,
  now,
  onEdit,
  onSend,
  onReact,
  onSkip,
}: {
  row: Reaction;
  start: number | null;
  now: number;
  onEdit: () => void;
  onSend: () => void;
  onReact: () => void;
  onSkip: () => void;
}) {
  const { inject: i, due, delivered } = row;
  const when =
    i.timing === "clock"
      ? i.day
        ? t("{clock} (J+{day})", { clock: i.clock, day: i.day })
        : i.clock
      : `T+${String(Math.floor(i.offset / 60)).padStart(2, "0")}:${String(i.offset % 60).padStart(2, "0")}`;
  const state = i.skipped ? (
    <span className="pill muted">{t("non joué")}</span>
  ) : delivered !== null ? (
    row.late ? (
      <span className="pill crit">
        {row.reacted !== null
          ? t("réaction en retard · +{delay}", {
              delay: minutesLabel(row.delay),
            })
          : t("sans réaction · +{delay}", { delay: minutesLabel(row.delay) })}
      </span>
    ) : row.reacted !== null ? (
      <span className="pill ok">
        {t("réaction {minutes}", { minutes: minutesLabel(row.minutes) })}
      </span>
    ) : (
      <span className="pill accent">
        {t("joué {time}", { time: hhmm(delivered) })}
      </span>
    )
  ) : due === null ? (
    <span className="pill plain">{t("après le T0")}</span>
  ) : due <= now ? (
    <span className="pill warn">
      {i.delivery === "read" ? t("à lire") : t("dû")}
    </span>
  ) : (
    <span className="pill plain">
      {t("dans {minutes}", {
        minutes: minutesLabel(Math.ceil((due - now) / 60_000)),
      })}
    </span>
  );
  return (
    <li
      className={`db-inject${delivered !== null ? " done" : ""}${i.skipped ? " skipped" : ""}`}
    >
      <div className="db-inject-time mono">
        <strong>{when}</strong>
        <small>{due !== null ? hhmm(due) : ""}</small>
        {start !== null && delivered !== null && (
          <small>{t("joué {time}", { time: tPlus(delivered, start) })}</small>
        )}
      </div>
      <button className="db-inject-body" onClick={onEdit}>
        <strong>{i.title}</strong>
        <span>
          {i.from || "—"} → {i.to || "—"} · {enumLabel(i.via)}
          {i.delivery === "read" ? ` · ${t("lu par la direction")}` : ""}
          {i.deadline ? ` · ${t("délai {n} min", { n: i.deadline })}` : ""}
          {i.effects.length
            ? ` · ${tn(i.effects.length, "{n} effet", "{n} effets")}`
            : ""}
        </span>
        {row.reacted !== null && (
          <small>{t("Réaction : {how}", { how: row.how })}</small>
        )}
      </button>
      <div className="db-inject-state">{state}</div>
      <div className="db-inject-actions">
        {delivered === null && !i.skipped && (
          <button
            className="small"
            onClick={onSend}
            title={t("Envoyer maintenant")}
          >
            <Send size={13} />
            {i.delivery === "read" ? t("Lu") : t("Envoyer")}
          </button>
        )}
        {delivered !== null && (
          <button
            className="small"
            onClick={onReact}
            title={t("Noter la réaction")}
          >
            {t("Réaction")}
          </button>
        )}
        {delivered === null && (
          <button
            className="icon-button"
            onClick={onSkip}
            aria-label={
              i.skipped ? t("Remettre au programme") : t("Ne pas jouer")
            }
            title={i.skipped ? t("Remettre au programme") : t("Ne pas jouer")}
          >
            {i.skipped ? <Undo2 size={15} /> : <EyeOff size={15} />}
          </button>
        )}
      </div>
    </li>
  );
}

// ---------- Editors ----------

type Draft = Omit<Inject, "id" | "createdAt" | "updatedAt" | "by"> & {
  id?: string;
};

function InjectSheet({
  initial,
  order,
  onClose,
  onSave,
  onDelete,
}: {
  initial: Inject | null;
  order: number;
  onClose: () => void;
  onSave: (value: Draft) => void;
  onDelete?: () => void;
}) {
  const { lists } = useApp();
  const [v, setV] = useState<Draft>(() => initial ?? blankInject(order));
  const [touched, setTouched] = useState(false);
  const set = (patch: Partial<Draft>) => {
    setV((d) => ({ ...d, ...patch }));
    setTouched(true);
  };
  const setEffect = (k: number, effect: InjectEffect | null) =>
    set({
      effects: effect
        ? v.effects.map((e, i) => (i === k ? effect : e))
        : v.effects.filter((_, i) => i !== k),
    });
  return (
    <Sheet
      title={initial ? t("Modifier l’inject") : t("Nouvel inject")}
      eyebrow={t("Direction d’exercice")}
      onClose={onClose}
      dirty={touched}
      footer={
        <>
          {onDelete && (
            <button className="danger" onClick={onDelete}>
              <Trash2 size={14} />
              {t("Supprimer")}
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button onClick={onClose}>{t("Annuler")}</button>
          <button
            className="primary"
            disabled={!v.title.trim() || (v.timing === "clock" && !v.clock)}
            onClick={() => onSave({ ...v, title: v.title.trim() })}
          >
            {t("Enregistrer")}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <TextField
          className="span-2"
          label={t("Titre")}
          required
          value={v.title}
          onChange={(title) => set({ title })}
          maxLength={200}
          autoFocus={!initial}
        />
        <div className="span-2">
          <Segmented
            label={t("Moment")}
            value={v.timing}
            onChange={(timing) => set({ timing })}
            options={[
              { value: "offset", label: t("Minutes après le début (T+)") },
              { value: "clock", label: t("Heure fixe") },
            ]}
          />
        </div>
        {v.timing === "offset" ? (
          <NumberField
            label={t("T+ (minutes)")}
            hint={`T+${String(Math.floor(v.offset / 60)).padStart(2, "0")}:${String(v.offset % 60).padStart(2, "0")}`}
            value={v.offset}
            max={60 * 24 * 14}
            onChange={(offset) => set({ offset })}
          />
        ) : (
          <>
            <label>
              <span>{t("Heure (Zurich)")}</span>
              <input
                type="time"
                value={v.clock}
                onChange={(e) => set({ clock: e.target.value })}
              />
            </label>
            <NumberField
              label={t("Jour de l’exercice")}
              hint={t("0 : le jour du début")}
              value={v.day}
              max={14}
              onChange={(day) => set({ day })}
            />
          </>
        )}
        <ComboField
          label={t("Émetteur (joué)")}
          value={v.from}
          onChange={(from) => set({ from })}
          options={lists("recipients")}
        />
        <ComboField
          label={t("Destinataire (cellule visée)")}
          value={v.to}
          onChange={(to) => set({ to })}
          options={lists("recipients")}
        />
        <ChoiceField
          label={t("Canal")}
          value={v.via}
          onChange={(via) => set({ via })}
          options={INJECT_CHANNELS}
        />
        <ChoiceField
          label={t("Priorité")}
          value={v.priority}
          onChange={(priority) => set({ priority })}
          options={MESSAGE_PRIORITIES}
        />
        <ComboField
          className="span-2"
          label={t("Catégorie")}
          value={v.category}
          onChange={(category) => set({ category })}
          options={lists("categories")}
          quick={5}
        />
        <TextField
          className="span-2"
          label={t("Contenu")}
          rows={4}
          maxLength={12000}
          value={v.body}
          onChange={(body) => set({ body })}
        />
        <div className="span-2">
          <Segmented
            label={t("Remise")}
            value={v.delivery}
            onChange={(delivery) => set({ delivery })}
            options={[
              { value: "message", label: t("Arrive dans Messages") },
              { value: "read", label: t("Lu par la direction") },
            ]}
          />
        </div>
        <TextField
          className="span-2"
          label={t("Réaction attendue")}
          rows={2}
          maxLength={4000}
          value={v.expected}
          onChange={(expected) => set({ expected })}
        />
        <NumberField
          label={t("Délai de réaction (minutes)")}
          hint={t("0 : sans délai")}
          value={v.deadline}
          max={24 * 60}
          onChange={(deadline) => set({ deadline })}
        />
      </div>
      <h3 className="db-subtitle">{t("Effets à l’arrivée")}</h3>
      {v.effects.map((e, k) => (
        <EffectEditor
          key={k}
          effect={e}
          onChange={(x) => setEffect(k, x)}
          onRemove={() => setEffect(k, null)}
        />
      ))}
      <div className="db-actions">
        <button
          className="small"
          onClick={() =>
            set({
              effects: [
                ...v.effects,
                { kind: "resource", name: "", status: "Engagé", location: "" },
              ],
            })
          }
        >
          <Plus size={13} />
          {t("État d’un moyen")}
        </button>
        <button
          className="small"
          onClick={() =>
            set({
              effects: [
                ...v.effects,
                {
                  kind: "observation",
                  place: "",
                  conditions: "",
                  temperature: "",
                  wind: "",
                  precipitation: "",
                },
              ],
            })
          }
        >
          <Plus size={13} />
          {t("Observation météo")}
        </button>
        <button
          className="small"
          onClick={() =>
            set({
              effects: [
                ...v.effects,
                { kind: "fact", label: "", value: "", unit: "" },
              ],
            })
          }
        >
          <Plus size={13} />
          {t("Renseignement clé")}
        </button>
      </div>
    </Sheet>
  );
}

function EffectEditor({
  effect,
  onChange,
  onRemove,
}: {
  effect: InjectEffect;
  onChange: (e: InjectEffect) => void;
  onRemove: () => void;
}) {
  const { live } = useApp();
  return (
    <div className="db-effect">
      <div className="form-grid">
        {effect.kind === "resource" && (
          <>
            <ComboField
              label={t("Moyen")}
              value={effect.name}
              onChange={(name) => onChange({ ...effect, name })}
              options={live.ops.resources.map((r) => r.name)}
            />
            <ChoiceField
              label={t("Nouvel état")}
              value={effect.status}
              onChange={(status) => onChange({ ...effect, status })}
              options={RESOURCE_STATUSES}
            />
            <TextField
              className="span-2"
              label={t("Lieu (facultatif)")}
              value={effect.location}
              onChange={(location) => onChange({ ...effect, location })}
            />
          </>
        )}
        {effect.kind === "observation" && (
          <>
            <TextField
              label={t("Lieu")}
              value={effect.place}
              onChange={(place) => onChange({ ...effect, place })}
            />
            <TextField
              label={t("Conditions")}
              value={effect.conditions}
              onChange={(conditions) => onChange({ ...effect, conditions })}
            />
            <TextField
              label={t("Précipitations")}
              value={effect.precipitation}
              onChange={(precipitation) =>
                onChange({ ...effect, precipitation })
              }
            />
            <TextField
              label={t("Vent")}
              value={effect.wind}
              onChange={(wind) => onChange({ ...effect, wind })}
            />
          </>
        )}
        {effect.kind === "fact" && (
          <>
            <ComboField
              label={t("Renseignement clé")}
              value={effect.label}
              onChange={(label) => onChange({ ...effect, label })}
              options={live.ops.facts.map((f) => f.label)}
            />
            <TextField
              label={t("Valeur")}
              value={effect.value}
              onChange={(value) => onChange({ ...effect, value })}
            />
          </>
        )}
      </div>
      <button
        className="icon-button"
        onClick={onRemove}
        aria-label={t("Retirer cet effet")}
        title={t("Retirer cet effet")}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function ReactionDialog({
  row,
  onClose,
  onSave,
}: {
  row: Reaction;
  onClose: () => void;
  onSave: (patch: Partial<Inject>) => void;
}) {
  const { live } = useApp();
  const [at, setAt] = useState(
    row.inject.reactedAt || new Date().toISOString(),
  );
  const [ref, setRef] = useState(row.inject.reactionRef);
  const [note, setNote] = useState(row.inject.reactionNote);
  // Entries and messages recorded after the inject was played.
  const since = row.delivered ?? 0;
  const options = [
    { value: "", label: t("— aucun élément précis —") },
    ...live.entries
      .filter((e) => Date.parse(e.createdAt) >= since - 60_000)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((e) => ({
        value: `entry:${e.id}`,
        label: `${numberLabel(e)} ${current(e).message.split("\n")[0].slice(0, 70)}`,
      })),
  ];
  return (
    <Modal
      title={t("Réaction à « {title} »", { title: row.inject.title })}
      onClose={onClose}
    >
      <p className="db-note">
        {t(
          "Joué à {time}. La réaction automatique (message traité, inscrit au journal ou lié) est prise si elle est plus précoce.",
          { time: hhmm(row.delivered) },
        )}
      </p>
      <div className="form-grid">
        <label className="span-2">
          <span>{t("Heure de la réaction (Zurich)")}</span>
          <input
            type="datetime-local"
            value={localInput(at)}
            onChange={(e) => setAt(fromInput(e.target.value) || at)}
          />
        </label>
        <ChoiceField
          className="span-2"
          label={t("Entrée du journal liée")}
          value={ref}
          onChange={setRef}
          options={options}
        />
        <TextField
          className="span-2"
          label={t("Remarque")}
          value={note}
          onChange={setNote}
          maxLength={1000}
          placeholder={t("Ex. Chef d’intervention informé par radio")}
        />
      </div>
      <div className="modal-actions">
        {row.inject.reactedAt && (
          <button
            onClick={() =>
              onSave({ reactedAt: "", reactionRef: "", reactionNote: "" })
            }
          >
            {t("Effacer")}
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button onClick={onClose}>{t("Annuler")}</button>
        <button
          className="primary"
          onClick={() =>
            onSave({
              reactedAt: at,
              reactionRef: ref,
              reactionNote:
                note.trim() || (ref ? t("entrée liée par la direction") : ""),
            })
          }
        >
          {t("Enregistrer")}
        </button>
      </div>
      <p className="db-note mono">{dateTime(at)}</p>
    </Modal>
  );
}

function ScenarioDialog({
  title,
  description,
  onClose,
  onSave,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}) {
  const [name, setName] = useState(title);
  const [d, setD] = useState(description);
  return (
    <Modal
      title={t("Scénario")}
      onClose={onClose}
      dirty={name !== title || d !== description}
    >
      <div className="form-grid">
        <TextField
          className="span-2"
          label={t("Titre")}
          required
          value={name}
          onChange={setName}
          maxLength={200}
        />
        <TextField
          className="span-2"
          label={t("Description (pour la direction)")}
          rows={4}
          value={d}
          onChange={setD}
          maxLength={4000}
        />
      </div>
      <div className="modal-actions">
        <span style={{ flex: 1 }} />
        <button onClick={onClose}>{t("Annuler")}</button>
        <button
          className="primary"
          disabled={!name.trim()}
          onClick={() => onSave(name.trim(), d.trim())}
        >
          {t("Enregistrer")}
        </button>
      </div>
    </Modal>
  );
}
