import { useMemo, useState } from "react";
import { Link2, Megaphone, Plus, Send, UserCheck, X } from "lucide-react";
import { useApp } from "../app/context";
import { Modal } from "../journal/Modal";
import {
  ChoiceField,
  ComboField,
  DateTimeField,
  NumberField,
  Segmented,
  TextField,
} from "../ui/fields";
import { ItemSearch, LinkChip } from "../ui/links";
import type { Ref } from "../../shared/links";
import { upsert } from "../../shared/ops";
import { EVERYONE, norm } from "../../shared/diffusion";
import {
  BROADCAST_ACKS,
  BROADCAST_PRIORITIES,
  type Broadcast,
} from "../../shared/conduct";
import { messageEnvelope, openLiaisons, outgoing } from "../../shared/liaison";
import { addBroadcast } from "./actions";
import {
  closeRequest,
  useRequest,
  type AssignPreset,
  type DiffusionPreset,
} from "./bus";
import { useIdentity } from "./roles";

/** Functions, cells, command posts in liaison and "Tous", plus free text. */
export function RecipientsField({
  value,
  onChange,
  label = "Destinataires",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
}) {
  const { journal, lists } = useApp();
  const [typed, setTyped] = useState("");
  const options = useMemo(() => {
    const seen = new Map<string, string>();
    for (const v of [
      EVERYONE,
      ...openLiaisons(journal.ops).map((l) => l.name),
      ...lists("postRoles"),
      ...journal.ops.cells.map((c) => c.name),
      ...value,
    ])
      if (v.trim() && !seen.has(norm(v))) seen.set(norm(v), v.trim());
    return [...seen.values()];
  }, [journal.ops, lists, value]);
  const has = (v: string) => value.some((x) => norm(x) === norm(v));
  const toggle = (v: string) =>
    onChange(has(v) ? value.filter((x) => norm(x) !== norm(v)) : [...value, v]);
  const add = () => {
    const v = typed.trim();
    if (v && !has(v)) onChange([...value, v]);
    setTyped("");
  };
  return (
    <fieldset className="span-2">
      <legend className="label">{label}</legend>
      <div className="chips-field" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            type="button"
            key={o}
            className="chip"
            aria-pressed={has(o)}
            onClick={() => toggle(o)}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="conduct-add">
        <input
          value={typed}
          placeholder="Autre destinataire (fonction, poste, nom)…"
          aria-label="Autre destinataire"
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} disabled={!typed.trim()}>
          <Plus size={14} />
          Ajouter
        </button>
      </div>
    </fieldset>
  );
}

/** Pick one item of the journal to link (or none). */
function TargetField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="span-2 stack" style={{ gap: 6 }}>
      <span className="label">{label}</span>
      {value ? (
        <span className="conduct-target">
          <LinkChip target={value as Ref} onRemove={() => onChange("")} />
        </span>
      ) : picking ? (
        <div className="conduct-picker">
          <ItemSearch
            onPick={(item) => {
              onChange(item.ref);
              setPicking(false);
            }}
          />
          <button
            type="button"
            className="small"
            onClick={() => setPicking(false)}
          >
            <X size={14} />
            Annuler
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="small"
          onClick={() => setPicking(true)}
        >
          <Link2 size={14} />
          Choisir un élément (ordre, entrée, message…)
        </button>
      )}
    </div>
  );
}

export function DiffusionDialog({ preset }: { preset: DiffusionPreset }) {
  const { journal, live, author, updateOps, canWrite, toast, lists } = useApp();
  const me = useIdentity(live, author);
  const [draft, setDraft] = useState({
    title: preset.title ?? "",
    body: preset.body ?? "",
    kind: preset.kind ?? "Information",
    priority: preset.priority ?? ("Normal" as Broadcast["priority"]),
    target: preset.target ?? "",
    recipients: preset.recipients ?? [],
    ack: preset.ack ?? ("Lu" as Broadcast["ack"]),
    deadline: 10,
  });
  const set = (patch: Partial<typeof draft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const ready = draft.title.trim() && draft.recipients.length > 0;
  const liaisons = openLiaisons(journal.ops).filter((l) =>
    draft.recipients.some((r) => norm(r) === norm(l.name)),
  );
  function send() {
    if (!ready || !canWrite()) return;
    const id = crypto.randomUUID();
    try {
      updateOps((ops) =>
        addBroadcast(
          ops,
          { ...draft, title: draft.title.trim(), body: draft.body.trim() },
          me,
          id,
        ),
      );
    } catch (err) {
      toast((err as Error).message);
      return;
    }
    toast(
      `Diffusé à ${draft.recipients.length} destinataire${draft.recipients.length > 1 ? "s" : ""}.${
        draft.ack !== "Aucun" ? ` Accusé « ${draft.ack} » attendu.` : ""
      }`,
    );
    preset.onSent?.(id);
    closeRequest();
  }
  return (
    <Modal
      title="Diffuser avec accusé de lecture"
      onClose={closeRequest}
      dirty={!!draft.title || !!draft.body}
      wide
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <TextField
          className="span-2"
          label="Objet"
          value={draft.title}
          onChange={(title) => set({ title })}
          required
          autoFocus
          maxLength={300}
        />
        <TextField
          className="span-2"
          label="Texte"
          value={draft.body}
          onChange={(body) => set({ body })}
          rows={4}
          maxLength={8000}
        />
        <ComboField
          label="Type"
          value={draft.kind}
          onChange={(kind) => set({ kind })}
          options={lists("broadcastKinds")}
        />
        <ChoiceField
          label="Priorité"
          value={draft.priority}
          onChange={(priority) => set({ priority })}
          options={BROADCAST_PRIORITIES}
        />
        <RecipientsField
          value={draft.recipients}
          onChange={(recipients) => set({ recipients })}
        />
        <div className="stack" style={{ gap: 6 }}>
          <span className="label">Accusé demandé</span>
          <Segmented
            label="Accusé demandé"
            value={draft.ack}
            onChange={(ack) => set({ ack })}
            options={BROADCAST_ACKS.map((a) => ({
              value: a,
              label: a === "Aucun" ? "Aucun" : `« ${a} »`,
            }))}
          />
        </div>
        <NumberField
          label="Signaler sans réponse après (min)"
          value={draft.deadline}
          min={0}
          max={1440}
          onChange={(deadline) => set({ deadline })}
          hint="0 : jamais."
        />
        <TargetField
          label="Élément diffusé"
          value={draft.target}
          onChange={(target) => set({ target })}
        />
        {liaisons.length > 0 && (
          <p className="hint span-2">
            Part aussi par la liaison vers{" "}
            {liaisons.map((l) => l.name).join(", ")} : l’autre PC la reçoit dans
            ses messages et répond par son propre accusé.
          </p>
        )}
        <div className="action-row span-2">
          <button type="button" onClick={closeRequest}>
            Annuler
          </button>
          <button className="primary" disabled={!ready}>
            <Megaphone size={15} />
            Diffuser
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AssignDialog({ preset }: { preset: AssignPreset }) {
  const { author, updateOps, canWrite, toast, lists, live } = useApp();
  const [draft, setDraft] = useState({
    target: preset.target ?? "",
    role: preset.role ?? "",
    person: "",
    dueAt: "",
    note: preset.note ?? "",
  });
  const set = (patch: Partial<typeof draft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const people = useMemo(
    () => live.ops.members.map((m) => m.name),
    [live.ops.members],
  );
  const ready = draft.target && (draft.role.trim() || draft.person.trim());
  function save() {
    if (!ready || !canWrite()) return;
    try {
      updateOps((ops) =>
        upsert(ops, "assignments", { ...draft, done: false }, author),
      );
      toast(
        `Attribué à ${[draft.role, draft.person].filter(Boolean).join(" · ")}.`,
      );
      closeRequest();
    } catch (err) {
      toast((err as Error).message);
    }
  }
  return (
    <Modal
      title="Attribuer à une fonction ou une personne"
      onClose={closeRequest}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TargetField
          label="Élément"
          value={draft.target}
          onChange={(target) => set({ target })}
        />
        <ComboField
          label="Fonction"
          value={draft.role}
          onChange={(role) => set({ role })}
          options={lists("postRoles")}
          quick={7}
          className="span-2"
        />
        <ComboField
          label="Personne"
          value={draft.person}
          onChange={(person) => set({ person })}
          options={people}
        />
        <DateTimeField
          label="Échéance"
          value={draft.dueAt}
          onChange={(dueAt) => set({ dueAt })}
        />
        <TextField
          className="span-2"
          label="Consigne"
          value={draft.note}
          onChange={(note) => set({ note })}
          rows={3}
          maxLength={2000}
        />
        <div className="action-row span-2">
          <button type="button" onClick={closeRequest}>
            Annuler
          </button>
          <button className="primary" disabled={!ready}>
            <UserCheck size={15} />
            Attribuer
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function LiaisonMessageDialog({ liaisonId }: { liaisonId?: string }) {
  const { live, author, updateOps, canWrite, toast, lists } = useApp();
  const open = openLiaisons(live.ops);
  const [id, setId] = useState(liaisonId ?? open[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Broadcast["priority"]>("Normal");
  const [category, setCategory] = useState("Information");
  const liaison = open.find((l) => l.id === id);
  function send() {
    if (!liaison || !(subject.trim() || body.trim()) || !canWrite()) return;
    const now = new Date().toISOString();
    try {
      const env = messageEnvelope(
        liaison,
        { subject: subject.trim(), body: body.trim(), priority, category },
        author,
        now,
      );
      updateOps((ops) => ({
        ...ops,
        exchanges: [
          ...ops.exchanges,
          outgoing(
            liaison,
            env,
            subject.trim() || body.trim(),
            "",
            author,
            now,
          ),
        ],
      }));
      toast(
        `Message envoyé à ${liaison.name} : il part dès que la liaison répond.`,
      );
      closeRequest();
    } catch (err) {
      toast((err as Error).message);
    }
  }
  return (
    <Modal
      title="Message à l’autre PC"
      onClose={closeRequest}
      dirty={!!subject || !!body}
    >
      {!open.length ? (
        <p className="muted">
          Aucune liaison ouverte. Réglages → Synchronisation → Liaison entre PC.
        </p>
      ) : (
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          {open.length > 1 && (
            <ChoiceField
              className="span-2"
              label="Vers"
              value={id}
              onChange={setId}
              options={open.map((l) => ({ value: l.id, label: l.name }))}
            />
          )}
          <TextField
            className="span-2"
            label="Objet"
            value={subject}
            onChange={setSubject}
            autoFocus
            maxLength={300}
          />
          <TextField
            className="span-2"
            label="Texte"
            value={body}
            onChange={setBody}
            rows={5}
            maxLength={12000}
          />
          <ChoiceField
            label="Priorité"
            value={priority}
            onChange={setPriority}
            options={BROADCAST_PRIORITIES}
          />
          <ComboField
            label="Catégorie"
            value={category}
            onChange={setCategory}
            options={lists("categories")}
          />
          <p className="hint span-2">
            {liaison
              ? `Arrive dans les messages de ${liaison.name}, avec « ${liaison.self} » comme émetteur.`
              : ""}
          </p>
          <div className="action-row span-2">
            <button type="button" onClick={closeRequest}>
              Annuler
            </button>
            <button
              className="primary"
              disabled={!liaison || !(subject.trim() || body.trim())}
            >
              <Send size={15} />
              Envoyer
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** The dialog asked through src/post/bus.ts, if any. */
export function ConductDialogs() {
  const request = useRequest();
  if (!request) return null;
  if (request.kind === "diffusion")
    return <DiffusionDialog preset={request.preset} />;
  if (request.kind === "assign")
    return <AssignDialog preset={request.preset} />;
  return <LiaisonMessageDialog liaisonId={request.liaisonId} />;
}
