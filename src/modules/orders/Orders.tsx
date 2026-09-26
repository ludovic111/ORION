import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Copy,
  FilePlus2,
  Link2,
  Megaphone,
  Pencil,
  Plus,
  Printer,
  ScrollText,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "../../app/context";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { Sheet } from "../../ui/Sheet";
import { Figures } from "../../ui/Figures";
import {
  ComboField,
  DateTimeField,
  Segmented,
  TextField,
} from "../../ui/fields";
import { ItemSearch, LinkChip } from "../../ui/links";
import { TraceLine } from "../../timeline/TraceLine";
import { dateTime, time } from "../../../shared/journal";
import { parseRef, type Ref } from "../../../shared/links";
import { removeRecords, upsert } from "../../../shared/ops";
import { localNode } from "../../../shared/hlc";
import type { Broadcast, Order, OrderMission } from "../../../shared/conduct";
import {
  CHAPTERS,
  ORDER_TEMPLATES,
  emptyOrder,
  newMission,
  nextOrderNumber,
  orderLabels,
  orderPrefill,
  type OrderDraft,
} from "../../../shared/orders";
import { recipientStates } from "../../../shared/diffusion";
import { addBroadcast } from "../../post/actions";
import { RecipientsField } from "../../post/dialogs";
import { openDiffusion } from "../../post/bus";
import { useIdentity } from "../../post/roles";
import { LiaisonPanel } from "../../liaison/LiaisonPanel";
import { orderSheet } from "./orderSheet";
import "../../post/conduct.css";

type Tab = "orders" | "broadcasts" | "liaison";

export function Orders() {
  const { journal, focus, setFocus, readOnly, now } = useApp();
  const [tab, setTab] = useState<Tab>("orders");
  const [viewing, setViewing] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrderDraft | null>(null);
  const [picking, setPicking] = useState(false);
  const [broadcast, setBroadcast] = useState<string | null>(null);
  const labels = useMemo(() => orderLabels(journal), [journal]);

  useEffect(() => {
    if (!focus) return;
    const { kind, id } = parseRef(focus);
    if (kind === "order") {
      setTab("orders");
      if (id === "new") setPicking(true);
      else setViewing(id);
      setFocus(null);
    } else if (kind === "broadcast") {
      setTab("broadcasts");
      if (id === "new") openDiffusion();
      else setBroadcast(id);
      setFocus(null);
    }
  }, [focus, setFocus]);

  const orders = [...journal.ops.orders].sort(
    (a, b) =>
      (b.issuedAt || b.createdAt).localeCompare(a.issuedAt || a.createdAt) ||
      b.number - a.number,
  );
  const broadcasts = [...journal.ops.broadcasts].sort((a, b) =>
    b.sentAt.localeCompare(a.sentAt),
  );
  const lateCount = broadcasts.filter((b) =>
    recipientStates(b, journal.ops.acks, now).some((s) => s.late),
  ).length;
  const waiting = broadcasts.reduce(
    (n, b) =>
      n +
      (b.ack === "Aucun" || b.closedAt
        ? 0
        : recipientStates(b, journal.ops.acks, now).filter((s) => !s.ack)
            .length),
    0,
  );
  const openLiaisons = journal.ops.liaisons.filter((l) => !l.closedAt).length;
  const shownOrder = journal.ops.orders.find((o) => o.id === viewing);
  const shownBroadcast = journal.ops.broadcasts.find((b) => b.id === broadcast);

  return (
    <>
      <ModuleHead
        actions={
          !readOnly && (
            <>
              <button onClick={() => openDiffusion()}>
                <Megaphone size={15} />
                Diffuser
              </button>
              <button className="primary" onClick={() => setPicking(true)}>
                <Plus size={15} />
                Nouvel ordre
              </button>
            </>
          )
        }
      />
      <Figures
        label="Ordres et diffusions en chiffres"
        items={[
          {
            label: "Ordres émis",
            value: orders.filter((o) => o.status === "Émis").length,
          },
          {
            label: "Projets",
            value: orders.filter((o) => o.status === "Brouillon").length,
            tone: "",
          },
          {
            label: "Accusés attendus",
            value: waiting,
            tone: waiting ? "warn" : "",
            onClick: waiting ? () => setTab("broadcasts") : undefined,
          },
          {
            label: "Sans accusé à temps",
            value: lateCount,
            tone: lateCount ? "crit" : "",
            onClick: lateCount ? () => setTab("broadcasts") : undefined,
          },
          {
            label: "Liaisons ouvertes",
            value: openLiaisons,
            onClick: () => setTab("liaison"),
          },
        ]}
      />
      <div style={{ margin: "4px 0 18px" }}>
        <Segmented
          label="Rubrique"
          value={tab}
          onChange={setTab}
          options={[
            { value: "orders", label: "Ordres" },
            { value: "broadcasts", label: "Diffusions" },
            { value: "liaison", label: "Liaison entre PC" },
          ]}
        />
      </div>

      {tab === "orders" &&
        (orders.length ? (
          <ul className="conduct-list" aria-label="Ordres">
            {orders.map((o) => (
              <OrderRow
                key={o.id}
                order={o}
                label={labels.get(o.id) ?? String(o.number)}
                onOpen={() => setViewing(o.id)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<ScrollText size={28} />}
            title="Aucun ordre"
            actions={
              !readOnly && (
                <button className="primary" onClick={() => setPicking(true)}>
                  <Plus size={15} />
                  Nouvel ordre
                </button>
              )
            }
          >
            Un ordre suit le schéma en cinq points : orientation, intention,
            missions, dispositions particulières, emplacements et liaisons. Il
            reçoit un numéro, part aux destinataires avec accusé de lecture et
            s’inscrit au journal quand il est émis.
          </EmptyState>
        ))}

      {tab === "broadcasts" &&
        (broadcasts.length ? (
          <ul className="conduct-list" aria-label="Diffusions">
            {broadcasts.map((b) => (
              <BroadcastRow
                key={b.id}
                broadcast={b}
                onOpen={() => setBroadcast(b.id)}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Megaphone size={28} />}
            title="Aucune diffusion"
            actions={
              !readOnly && (
                <button className="primary" onClick={() => openDiffusion()}>
                  <Megaphone size={15} />
                  Diffuser
                </button>
              )
            }
          >
            Une diffusion envoie une information, une consigne ou un ordre à
            plusieurs fonctions, cellules ou PC. Chacun la voit en haut de son
            écran jusqu’à ce qu’il réponde « Lu » ou « Compris » ; vous voyez
            qui a répondu et quand.
          </EmptyState>
        ))}

      {tab === "liaison" && <LiaisonPanel />}

      {picking && (
        <TemplatePicker
          onClose={() => setPicking(false)}
          onPick={(draft) => {
            setPicking(false);
            setEditing(draft);
          }}
        />
      )}
      {editing && (
        <OrderEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            setEditing(null);
            setViewing(id);
          }}
        />
      )}
      {shownOrder && !editing && (
        <OrderView
          order={shownOrder}
          label={labels.get(shownOrder.id) ?? String(shownOrder.number)}
          onClose={() => setViewing(null)}
          onEdit={(draft) => setEditing(draft)}
        />
      )}
      {shownBroadcast && (
        <BroadcastSheet
          broadcast={shownBroadcast}
          onClose={() => setBroadcast(null)}
        />
      )}
    </>
  );
}

function OrderRow({
  order: o,
  label,
  onOpen,
}: {
  order: Order;
  label: string;
  onOpen: () => void;
}) {
  const { journal, now } = useApp();
  const b = journal.ops.broadcasts.find((x) => x.id === o.broadcastId);
  const states = b ? recipientStates(b, journal.ops.acks, now) : [];
  const answered = states.filter((s) => s.ack).length;
  return (
    <li className={`conduct-row${states.some((s) => s.late) ? " late" : ""}`}>
      <span className="when">{o.issuedAt ? time(o.issuedAt) : "projet"}</span>
      <div className="what">
        <button onClick={onOpen}>
          <span className="conduct-kind">Ordre {label}</span>
          {o.title}
        </button>
        <small>
          {[
            o.kind,
            o.status,
            o.source && `reçu de ${o.source}`,
            o.missions.length &&
              `${o.missions.length} mission${o.missions.length > 1 ? "s" : ""}`,
            b && `accusés ${answered}/${states.length}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </div>
      <div className="row-actions">
        <button className="small" onClick={onOpen}>
          Ouvrir
        </button>
      </div>
    </li>
  );
}

function BroadcastRow({
  broadcast: b,
  onOpen,
}: {
  broadcast: Broadcast;
  onOpen: () => void;
}) {
  const { journal, now } = useApp();
  const states = recipientStates(b, journal.ops.acks, now);
  const answered = states.filter((s) => s.ack).length;
  const late = states.some((s) => s.late);
  return (
    <li className={`conduct-row${late ? " late" : ""}`}>
      <span className="when">{time(b.sentAt)}</span>
      <div className="what">
        <button onClick={onOpen}>
          <span className="conduct-kind">{b.kind}</span>
          {b.priority === "Urgent" && (
            <span className="pill crit">Urgent</span>
          )}{" "}
          {b.title}
        </button>
        <small>
          {[
            b.source ? `de ${b.sender || b.source}` : b.sender,
            `à ${b.recipients.join(", ")}`,
            b.ack === "Aucun"
              ? "sans accusé"
              : `« ${b.ack} » ${answered}/${states.length}`,
            late && "réponse en retard",
            b.closedAt && "suivi arrêté",
          ]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </div>
      <div className="row-actions">
        <button className="small" onClick={onOpen}>
          Accusés
        </button>
      </div>
    </li>
  );
}

function BroadcastSheet({
  broadcast: b,
  onClose,
}: {
  broadcast: Broadcast;
  onClose: () => void;
}) {
  const { journal, now, readOnly, canWrite, updateOps, author, toast } =
    useApp();
  const states = recipientStates(b, journal.ops.acks, now);
  return (
    <Sheet
      title={b.title}
      eyebrow={`${b.kind} · ${dateTime(b.sentAt)}`}
      onClose={onClose}
      footer={
        !readOnly && (
          <div className="conduct-foot">
            {!b.closedAt && !b.source && (
              <button
                onClick={() => {
                  if (!canWrite()) return;
                  updateOps((ops) =>
                    upsert(
                      ops,
                      "broadcasts",
                      { ...b, closedAt: new Date().toISOString() },
                      author,
                    ),
                  );
                  toast("Suivi des accusés arrêté.");
                }}
              >
                <Ban size={14} />
                Arrêter le suivi
              </button>
            )}
            <button
              onClick={() =>
                openDiffusion({
                  title: b.title,
                  body: b.body,
                  kind: b.kind,
                  priority: b.priority,
                  target: b.target,
                  ack: b.ack,
                  recipients: states
                    .filter((s) => !s.ack)
                    .map((s) => s.recipient),
                })
              }
            >
              <Send size={14} />
              Relancer les absents
            </button>
            <button
              className="danger"
              onClick={() => {
                if (!canWrite()) return;
                if (
                  !window.confirm("Supprimer cette diffusion et ses accusés ?")
                )
                  return;
                updateOps((ops) => {
                  const next = removeRecords(ops, [b.id]);
                  return {
                    ...next,
                    acks: next.acks.filter((a) => a.broadcastId !== b.id),
                  };
                });
                onClose();
              }}
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        )
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        {b.body && <p style={{ whiteSpace: "pre-wrap" }}>{b.body}</p>}
        {b.target && (
          <div className="conduct-target">
            <LinkChip target={b.target as Ref} />
          </div>
        )}
        <dl className="spec compact">
          <div>
            <dt>De</dt>
            <dd>{b.sender || b.by}</dd>
          </div>
          <div>
            <dt>Priorité</dt>
            <dd>{b.priority}</dd>
          </div>
          <div>
            <dt>Accusé demandé</dt>
            <dd>
              {b.ack}
              {b.ack !== "Aucun" && b.deadline
                ? ` · signalé après ${b.deadline} min`
                : ""}
            </dd>
          </div>
        </dl>
        <section>
          <span className="label">Destinataires</span>
          <ul className="receipts">
            {states.map((s) => (
              <li key={s.recipient}>
                <span>{s.recipient}</span>
                <span
                  className={`state ${s.ack ? "ok" : s.late ? "late" : ""}`}
                >
                  {s.ack
                    ? `${s.ack.kind} · ${time(s.ack.at)}`
                    : b.ack === "Aucun"
                      ? "sans accusé"
                      : `en attente · ${s.minutes} min`}
                </span>
                {s.acks.length > 0 && (
                  <small>
                    {s.acks
                      .map(
                        (a) =>
                          `${[a.role, a.post].filter(Boolean).join(" · ") || a.by} (${a.kind} à ${time(a.at)}${a.source ? `, par la liaison` : ""})`,
                      )
                      .join(" ; ")}
                  </small>
                )}
              </li>
            ))}
          </ul>
        </section>
        <TraceLine target={b.id} />
      </div>
    </Sheet>
  );
}

function TemplatePicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (draft: OrderDraft) => void;
}) {
  const { live } = useApp();
  const prefill = orderPrefill(live, Date.now(), time);
  return (
    <Sheet title="Nouvel ordre" eyebrow="Choisir un modèle" onClose={onClose}>
      <ul className="conduct-list">
        {ORDER_TEMPLATES.map((t) => (
          <li key={t.id} className="conduct-row">
            <span className="when">
              <FilePlus2 size={16} />
            </span>
            <div className="what">
              <button
                onClick={() => onPick(emptyOrder({ ...prefill, ...t.patch }))}
              >
                {t.label}
              </button>
              <small>{t.hint}</small>
            </div>
            <div />
          </li>
        ))}
        <li className="conduct-row">
          <span className="when">
            <FilePlus2 size={16} />
          </span>
          <div className="what">
            <button onClick={() => onPick(emptyOrder())}>Ordre vide</button>
            <small>Aucun champ prérempli.</small>
          </div>
          <div />
        </li>
      </ul>
      <p className="hint" style={{ marginTop: 14 }}>
        Les modèles reprennent les tableaux de situation (situation, dangers,
        intention), les postes, les groupes du plan radio et les prochains
        rapports. Tout reste modifiable.
      </p>
    </Sheet>
  );
}

function MissionEditor({
  mission,
  onChange,
  onRemove,
  index,
}: {
  mission: OrderMission;
  onChange: (m: OrderMission) => void;
  onRemove: () => void;
  index: number;
}) {
  const { journal, lists } = useApp();
  const [picking, setPicking] = useState(false);
  const units = useMemo(
    () => [
      ...journal.ops.cells.map((c) => c.name),
      ...journal.ops.resources.map((r) => r.name),
      ...lists("recipients"),
    ],
    [journal.ops.cells, journal.ops.resources, lists],
  );
  return (
    <div className="order-mission">
      <div className="order-mission-head">
        <span>Mission {index + 1}</span>
        <button
          type="button"
          className="icon-button"
          onClick={onRemove}
          aria-label={`Retirer la mission ${index + 1}`}
        >
          <X size={14} />
        </button>
      </div>
      <div className="form-grid">
        <ComboField
          label="Unité / cellule"
          value={mission.unit}
          onChange={(unit) => onChange({ ...mission, unit })}
          options={units}
        />
        <ComboField
          label="Fonction responsable"
          value={mission.role}
          onChange={(role) => onChange({ ...mission, role })}
          options={lists("postRoles")}
          hint="Apparaît dans « Mes tâches » des postes de cette fonction."
        />
        <TextField
          className="span-2"
          label="Mission"
          value={mission.task}
          onChange={(task) => onChange({ ...mission, task })}
          rows={2}
          maxLength={4000}
        />
        <DateTimeField
          label="Échéance"
          value={mission.dueAt}
          onChange={(dueAt) => onChange({ ...mission, dueAt })}
        />
        <div className="stack" style={{ gap: 6 }}>
          <span className="label">Moyens, personnes, entrées liés</span>
          <div className="conduct-target">
            {mission.refs.map((r) => (
              <LinkChip
                key={r}
                target={r as Ref}
                onRemove={() =>
                  onChange({
                    ...mission,
                    refs: mission.refs.filter((x) => x !== r),
                  })
                }
              />
            ))}
            {!picking && (
              <button
                type="button"
                className="small"
                onClick={() => setPicking(true)}
              >
                <Link2 size={14} />
                Lier
              </button>
            )}
          </div>
        </div>
        {picking && (
          <div className="conduct-picker span-2">
            <ItemSearch
              exclude={mission.refs}
              kinds={[
                "resource",
                "member",
                "cell",
                "entry",
                "place",
                "contact",
              ]}
              onPick={(item) => {
                onChange({ ...mission, refs: [...mission.refs, item.ref] });
                setPicking(false);
              }}
            />
            <button
              type="button"
              className="small"
              onClick={() => setPicking(false)}
            >
              <X size={14} />
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: OrderDraft;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { live, author, canWrite, updateOps, toast, lists } = useApp();
  const [draft, setDraft] = useState<OrderDraft>(initial);
  const [dirty, setDirty] = useState(false);
  const set = (patch: Partial<OrderDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const area = (key: keyof OrderDraft, label: string, rows = 3) => (
    <TextField
      className="span-2"
      label={label}
      value={String(draft[key] ?? "")}
      onChange={(v) => set({ [key]: v } as Partial<OrderDraft>)}
      rows={rows}
      maxLength={8000}
    />
  );
  function save() {
    if (!draft.title.trim() || !canWrite()) return;
    const id = draft.id ?? crypto.randomUUID();
    try {
      updateOps((ops) =>
        upsert(
          ops,
          "orders",
          {
            ...draft,
            id,
            title: draft.title.trim(),
            number: draft.number ?? nextOrderNumber({ ...live, ops }),
            ...(draft.id ? {} : { node: localNode() }),
          },
          author,
        ),
      );
      toast(draft.id ? "Ordre enregistré." : "Projet d’ordre créé.");
      onSaved(id);
    } catch (err) {
      toast((err as Error).message);
    }
  }
  return (
    <Sheet
      title={draft.id ? "Modifier l’ordre" : "Nouvel ordre"}
      eyebrow={draft.kind}
      onClose={onClose}
      dirty={dirty}
      footer={
        <>
          <button onClick={onClose}>Annuler</button>
          <button
            className="primary"
            disabled={!draft.title.trim()}
            onClick={save}
          >
            Enregistrer
          </button>
        </>
      }
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="form-grid">
          <TextField
            className="span-2"
            label="Titre"
            value={draft.title}
            onChange={(title) => set({ title })}
            required
            maxLength={200}
          />
          <ComboField
            label="Type"
            value={draft.kind}
            onChange={(kind) => set({ kind })}
            options={lists("orderKinds")}
          />
          <ComboField
            label="Donné par"
            value={draft.issuer}
            onChange={(issuer) => set({ issuer })}
            options={[
              ...lists("postRoles"),
              ...live.ops.members.map((m) => m.name),
            ]}
          />
        </div>
        <section className="order-chapter">
          <h3>
            <span>1</span> Orientation
          </h3>
          <div className="form-grid">
            {area("situation", "Situation", 4)}
            {area("danger", "Danger / évolution probable")}
            {area("neighbours", "Moyens voisins et partenaires", 2)}
          </div>
        </section>
        <section className="order-chapter">
          <h3>
            <span>2</span> Intention
          </h3>
          <div className="form-grid">
            {area("intention", "Idée de manœuvre", 4)}
          </div>
        </section>
        <section className="order-chapter">
          <h3>
            <span>3</span> Missions
          </h3>
          {draft.missions.map((m, i) => (
            <MissionEditor
              key={m.id}
              index={i}
              mission={m}
              onChange={(next) =>
                set({
                  missions: draft.missions.map((x) =>
                    x.id === m.id ? next : x,
                  ),
                })
              }
              onRemove={() =>
                set({ missions: draft.missions.filter((x) => x.id !== m.id) })
              }
            />
          ))}
          <button
            type="button"
            onClick={() => set({ missions: [...draft.missions, newMission()] })}
          >
            <Plus size={14} />
            Ajouter une mission
          </button>
        </section>
        <section className="order-chapter">
          <h3>
            <span>4</span> Dispositions particulières
          </h3>
          <div className="form-grid">
            {area("logistics", "Logistique", 2)}
            {area("medical", "Sanitaire", 2)}
            {area("safety", "Sécurité", 2)}
          </div>
        </section>
        <section className="order-chapter">
          <h3>
            <span>5</span> Emplacements et liaisons
          </h3>
          <div className="form-grid">
            {area("pc", "PC / emplacements", 2)}
            {area("radio", "Liaisons radio (plan radio)", 3)}
            {area("reports", "Heures des rapports", 2)}
          </div>
        </section>
        <section className="order-chapter">
          <h3>Distribution</h3>
          <div className="form-grid">
            <RecipientsField
              value={draft.distribution}
              onChange={(distribution) => set({ distribution })}
            />
            {area("notes", "Remarques", 2)}
          </div>
        </section>
      </form>
    </Sheet>
  );
}

function OrderView({
  order: o,
  label,
  onClose,
  onEdit,
}: {
  order: Order;
  label: string;
  onClose: () => void;
  onEdit: (draft: OrderDraft) => void;
}) {
  const {
    journal,
    live,
    author,
    readOnly,
    canWrite,
    updateOps,
    addEntry,
    toast,
    print,
    graph,
    now,
  } = useApp();
  const me = useIdentity(live, author);
  const b = journal.ops.broadcasts.find((x) => x.id === o.broadcastId);
  const states = b ? recipientStates(b, journal.ops.acks, now) : [];
  const base = journal.ops.orders.find((x) => x.id === o.baseId);
  const describe = (r: string) => graph.byRef.get(r as Ref)?.title ?? r;

  function issue() {
    if (!canWrite()) return;
    if (
      !o.distribution.length &&
      !window.confirm(
        "Aucun destinataire : l’ordre sera émis et inscrit au journal sans diffusion. Continuer ?",
      )
    )
      return;
    const at = new Date().toISOString();
    const entryId = addEntry(
      {
        type: "Décision",
        message: `Ordre ${label} émis : ${o.title}`,
        source: o.issuer || me.role || author,
        recipient: o.distribution.join(", "),
        channel: "Message",
        reliability: "Confirmé",
        action: o.intention,
        tags: ["ordre"],
      },
      [`order:${o.id}` as Ref],
    );
    if (!entryId) return;
    const broadcastId = o.distribution.length ? crypto.randomUUID() : "";
    try {
      updateOps((ops) => {
        let next = upsert(
          ops,
          "orders",
          { ...o, status: "Émis", issuedAt: at, entryId, broadcastId },
          author,
        );
        if (broadcastId)
          next = addBroadcast(
            next,
            {
              title: `Ordre ${label} : ${o.title}`,
              body: [
                o.intention && `Intention : ${o.intention}`,
                ...o.missions.map((m) => `${m.unit || "Mission"} : ${m.task}`),
              ]
                .filter(Boolean)
                .join("\n"),
              kind: "Ordre",
              priority: "Important",
              target: `order:${o.id}`,
              recipients: o.distribution,
              ack: "Compris",
              deadline: 15,
            },
            me,
            broadcastId,
          );
        return next;
      });
      toast(
        `Ordre ${label} émis, inscrit au journal${broadcastId ? " et diffusé" : ""}.`,
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function complement() {
    onEdit(
      emptyOrder({
        kind: "Ordre complémentaire",
        baseId: o.id,
        title: `Complément à l’ordre ${label}`,
        intention: "Inchangée.",
        pc: o.pc,
        radio: o.radio,
        reports: o.reports,
        distribution: o.distribution,
        issuer: o.issuer,
      }),
    );
  }

  const text = (title: string, value: string) =>
    value.trim() ? (
      <>
        <dt>{title}</dt>
        <dd>{value}</dd>
      </>
    ) : null;

  return (
    <Sheet
      title={`Ordre ${label} · ${o.title}`}
      eyebrow={[
        o.kind,
        o.status,
        o.issuedAt && dateTime(o.issuedAt),
        o.source && `reçu de ${o.source}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      onClose={onClose}
      footer={
        <div className="conduct-foot">
          <button
            onClick={() => {
              // The preview opens in place of the sheet.
              onClose();
              print({
                kind: "forms",
                journal,
                sheets: [orderSheet(o, label, b, journal.ops.acks, describe)],
                title: `Ordre ${label}`,
                name: `ordre-${o.number}`,
              });
            }}
          >
            <Printer size={14} />
            A4
          </button>
          {!readOnly && (
            <>
              <button onClick={() => onEdit({ ...o })}>
                <Pencil size={14} />
                Modifier
              </button>
              {o.status === "Émis" && (
                <button onClick={complement}>
                  <Copy size={14} />
                  Ordre complémentaire
                </button>
              )}
              {o.status === "Émis" && (
                <button
                  onClick={() =>
                    openDiffusion({
                      title: `Ordre ${label} : ${o.title}`,
                      kind: "Ordre",
                      target: `order:${o.id}`,
                      ack: "Compris",
                      priority: "Important",
                    })
                  }
                >
                  <Megaphone size={14} />
                  Diffuser
                </button>
              )}
              {o.status === "Brouillon" && (
                <button className="primary" onClick={issue}>
                  <Send size={14} />
                  Émettre
                </button>
              )}
              {o.status === "Émis" && (
                <button
                  className="danger"
                  onClick={() => {
                    if (!canWrite()) return;
                    if (!window.confirm(`Annuler l’ordre ${label} ?`)) return;
                    updateOps((ops) =>
                      upsert(ops, "orders", { ...o, status: "Annulé" }, author),
                    );
                    addEntry(
                      {
                        type: "Décision",
                        message: `Ordre ${label} annulé : ${o.title}`,
                        source: me.role || author,
                        tags: ["ordre"],
                      },
                      [`order:${o.id}` as Ref],
                    );
                  }}
                >
                  <Ban size={14} />
                  Annuler l’ordre
                </button>
              )}
              {o.status === "Brouillon" && (
                <button
                  className="danger"
                  onClick={() => {
                    if (!canWrite()) return;
                    if (!window.confirm("Supprimer ce projet d’ordre ?"))
                      return;
                    updateOps((ops) => removeRecords(ops, [o.id]));
                    onClose();
                  }}
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              )}
            </>
          )}
        </div>
      }
    >
      <div className="order-view stack" style={{ gap: 12 }}>
        {base && (
          <p className="muted">
            Complète <LinkChip target={`order:${base.id}` as Ref} />
          </p>
        )}
        {CHAPTERS.map((c) => (
          <section key={c.n} className="order-chapter">
            <h3>
              <span>{c.n}</span> {c.title}
            </h3>
            <dl>
              {c.n === 1 && (
                <>
                  {text("Situation", o.situation)}
                  {text("Danger / évolution probable", o.danger)}
                  {text("Moyens voisins et partenaires", o.neighbours)}
                </>
              )}
              {c.n === 2 && text("Idée de manœuvre", o.intention)}
              {c.n === 3 &&
                o.missions.map((m) => (
                  <div key={m.id}>
                    <dt>
                      {m.unit || "Mission"}
                      {m.role && ` · ${m.role}`}
                      {m.dueAt && ` · ${time(m.dueAt)}`}
                      {m.done && " · terminée"}
                    </dt>
                    <dd>{m.task || "—"}</dd>
                    {m.refs.length > 0 && (
                      <dd className="conduct-target">
                        {m.refs.map((r) => (
                          <LinkChip key={r} target={r as Ref} />
                        ))}
                      </dd>
                    )}
                  </div>
                ))}
              {c.n === 4 && (
                <>
                  {text("Logistique", o.logistics)}
                  {text("Sanitaire", o.medical)}
                  {text("Sécurité", o.safety)}
                </>
              )}
              {c.n === 5 && (
                <>
                  {text("PC / emplacements", o.pc)}
                  {text("Liaisons radio", o.radio)}
                  {text("Heures des rapports", o.reports)}
                </>
              )}
            </dl>
          </section>
        ))}
        <section className="order-chapter">
          <h3>Distribution</h3>
          {o.distribution.length ? (
            <ul className="receipts">
              {(states.length
                ? states
                : o.distribution.map((r) => ({
                    recipient: r,
                    ack: undefined,
                    late: false,
                    minutes: 0,
                  }))
              ).map((s) => (
                <li key={s.recipient}>
                  <span>{s.recipient}</span>
                  <span
                    className={`state ${s.ack ? "ok" : s.late ? "late" : ""}`}
                  >
                    {s.ack
                      ? `${s.ack.kind} · ${time(s.ack.at)}${s.ack.post ? ` · ${s.ack.post}` : ""}`
                      : b
                        ? `en attente · ${s.minutes} min`
                        : "à l’émission"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Aucun destinataire.</p>
          )}
          {o.notes && <p className="muted">{o.notes}</p>}
        </section>
        {o.entryId && (
          <p className="muted">
            Inscrit au journal :{" "}
            <LinkChip target={`entry:${o.entryId}` as Ref} />
          </p>
        )}
        <TraceLine target={o.id} />
      </div>
    </Sheet>
  );
}
