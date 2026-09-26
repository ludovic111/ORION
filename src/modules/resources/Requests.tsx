import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Megaphone, Plus, Trash2 } from "lucide-react";
import { dateTime, time } from "../../../shared/journal";
import { KIND_INFO, parseRef, ref } from "../../../shared/links";
import { removeRecords, upsert } from "../../../shared/ops";
import {
  type RequestStatus,
  type ResourceRequest,
} from "../../../shared/conduct-schemas";
import {
  MOVE_LABEL,
  TRANSITIONS,
  WAITING,
  blankRequest,
  createRequest,
  lateMinutes,
  moveRequest,
  requestLabel,
  requestLate,
  type RequestDraft,
} from "../../../shared/requests";
import { formatDuration } from "../../../shared/presence";
import { useApp } from "../../app/context";
import { Figures } from "../../ui/Figures";
import { EmptyState } from "../../ui/ModuleHead";
import { RecordFields, type FieldSpec } from "../../ui/records";
import { Sheet } from "../../ui/Sheet";
import { LinkChip, LinksPanel, KIND_ICON } from "../../ui/links";
import { DateTimeField, TextField, Toggle } from "../../ui/fields";
import { Modal } from "../../journal/Modal";
import { TraceLine } from "../../timeline/TraceLine";
import "../../ui/conduct.css";

const TONE: Record<RequestStatus, string> = {
  Demandé: "warn",
  Accordé: "accent",
  Refusé: "muted",
  "En route": "accent",
  Arrivé: "ok",
  Libéré: "muted",
  Annulé: "muted",
};

const SPEC: FieldSpec[] = [
  {
    key: "title",
    label: "Moyen demandé",
    kind: "text",
    required: true,
    wide: true,
    max: 200,
    placeholder: "ex. Groupe électrogène 20 kVA, section PCi, sacs de sable",
  },
  {
    key: "kind",
    label: "Type de moyen",
    kind: "combo",
    list: "resourceKinds",
    quick: 6,
  },
  { key: "quantity", label: "Quantité", kind: "number" },
  { key: "unit", label: "Unité", kind: "combo", list: "requestUnits" },
  {
    key: "priority",
    label: "Priorité",
    kind: "choice",
    options: ["Normal", "Important", "Urgent"],
  },
  { kind: "group", label: "Qui" },
  { key: "requester", label: "Demandeur", kind: "combo", list: "recipients" },
  {
    key: "provider",
    label: "Demandé à (organisation)",
    kind: "combo",
    list: "organizations",
  },
  {
    key: "contact",
    label: "Contact",
    kind: "combo",
    placeholder: "Nom, téléphone",
  },
  { key: "destination", label: "Lieu de livraison", kind: "text", max: 300 },
  { kind: "group", label: "Quand" },
  { key: "requestedAt", label: "Demandé le", kind: "datetime", required: true },
  {
    key: "eta",
    label: "Arrivée prévue",
    kind: "datetime",
    hint: "Un avertissement s’affiche quand l’heure est dépassée.",
  },
  { kind: "group", label: "Détails" },
  { key: "reason", label: "Motif", kind: "area", rows: 2, max: 2000 },
  { key: "notes", label: "Remarques", kind: "area", rows: 2, max: 2000 },
];

type Editing = { draft: RequestDraft; existing: ResourceRequest | null };

export function Requests({
  create,
  onCreated,
}: {
  /** Incremented to open a new request. */
  create: number;
  onCreated: () => void;
}) {
  const { journal, now, readOnly, canWrite, focus, setFocus, toast, print } =
    useApp();
  const requests = journal.ops.requests;
  const [editing, setEditing] = useState<Editing | null>(null);
  const [moving, setMoving] = useState<{
    request: ResourceRequest;
    to: RequestStatus;
  } | null>(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    if (!create || readOnly) return;
    setEditing({ draft: blankRequest(), existing: null });
    onCreated();
  }, [create, readOnly, onCreated]);
  useEffect(() => {
    if (!focus?.startsWith("request:")) return;
    const { id } = parseRef(focus);
    setFocus(null);
    if (id === "none") return;
    if (id === "new") {
      if (!readOnly) setEditing({ draft: blankRequest(), existing: null });
      return;
    }
    const found = requests.find((r) => r.id === id);
    if (found) setEditing({ draft: found, existing: found });
    else toast("Cette demande n’existe plus.");
  }, [focus, requests, readOnly, setFocus, toast]);

  const waiting = useMemo(
    () =>
      requests
        .filter((r) => WAITING.includes(r.status))
        .sort(
          (a, b) =>
            Number(requestLate(b, now)) - Number(requestLate(a, now)) ||
            (a.eta || "9").localeCompare(b.eta || "9") ||
            a.requestedAt.localeCompare(b.requestedAt),
        ),
    [requests, now],
  );
  const done = useMemo(
    () =>
      requests
        .filter((r) => !WAITING.includes(r.status))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [requests],
  );
  const late = waiting.filter((r) => requestLate(r, now)).length;

  function printRequests() {
    print({
      kind: "tables",
      journal,
      title: "Demandes de moyens",
      extra: `${waiting.length} en attente, ${late} en retard`,
      landscape: true,
      name: "demandes-de-moyens",
      tables: [
        {
          id: "requests",
          title: "Demandes de moyens",
          caption: `${requests.length} demande(s)`,
          head: [
            "Moyen",
            "Demandeur",
            "Demandé à",
            "Lieu",
            "Demandé",
            "Arrivée prévue",
            "État",
          ],
          body: [...waiting, ...done].map((r) => [
            requestLabel(r),
            r.requester,
            [r.provider, r.contact].filter(Boolean).join(" · "),
            r.destination,
            dateTime(r.requestedAt),
            r.eta
              ? `${dateTime(r.eta)}${requestLate(r, now) ? " (retard)" : ""}`
              : "",
            r.status,
          ]),
          widths: [60, 32, 44, 36, 30, 36, 31],
        },
      ],
    });
  }

  return (
    <>
      <Figures
        label="Demandes de moyens"
        items={[
          { label: "En attente", value: waiting.length },
          { label: "En retard", value: late, tone: late ? "crit" : "" },
          {
            label: "Arrivées",
            value: requests.filter(
              (r) => r.status === "Arrivé" || r.status === "Libéré",
            ).length,
          },
          {
            label: "Refusées ou annulées",
            value: requests.filter(
              (r) => r.status === "Refusé" || r.status === "Annulé",
            ).length,
          },
        ]}
      />
      <div className="cd-toolbar">
        {!readOnly && (
          <button
            className="primary"
            onClick={() =>
              setEditing({ draft: blankRequest(), existing: null })
            }
          >
            <Plus size={14} />
            Nouvelle demande
          </button>
        )}
        <button onClick={printRequests} disabled={!requests.length}>
          Imprimer
        </button>
      </div>
      {!requests.length && (
        <div className="card">
          <EmptyState
            icon={<Megaphone size={28} />}
            title="Aucune demande de moyens"
            actions={
              !readOnly && (
                <button
                  className="primary"
                  onClick={() =>
                    setEditing({ draft: blankRequest(), existing: null })
                  }
                >
                  <Plus size={14} />
                  Nouvelle demande
                </button>
              )
            }
          >
            Suivez chaque demande : demandée, accordée ou refusée, en route,
            arrivée. Chaque étape est notée au journal ; à l’arrivée, le moyen
            apparaît dans la liste des moyens.
          </EmptyState>
        </div>
      )}
      <div className="rq-list">
        {waiting.map((r) => (
          <RequestCard
            key={r.id}
            request={r}
            onOpen={() => setEditing({ draft: r, existing: r })}
            onMove={(to) => canWrite() && setMoving({ request: r, to })}
          />
        ))}
      </div>
      {done.length > 0 && (
        <>
          <button
            className="ck-toggle cd-section-title"
            aria-expanded={showDone}
            onClick={() => setShowDone(!showDone)}
          >
            <ChevronDown size={15} />
            Terminées
            <span className="pill plain">{done.length}</span>
          </button>
          {showDone && (
            <div className="rq-list">
              {done.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onOpen={() => setEditing({ draft: r, existing: r })}
                  onMove={(to) => canWrite() && setMoving({ request: r, to })}
                />
              ))}
            </div>
          )}
        </>
      )}
      {editing && (
        <RequestSheet
          key={editing.existing?.id ?? "new"}
          editing={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {moving && (
        <MoveDialog
          request={moving.request}
          to={moving.to}
          onClose={() => setMoving(null)}
        />
      )}
    </>
  );
}

function RequestCard({
  request: r,
  onOpen,
  onMove,
}: {
  request: ResourceRequest;
  onOpen: () => void;
  onMove: (to: RequestStatus) => void;
}) {
  const { now, readOnly, journal } = useApp();
  const late = lateMinutes(r, now);
  const resource = r.resourceId
    ? journal.ops.resources.find((x) => x.id === r.resourceId)
    : undefined;
  return (
    <article className={`card rq-card ${late ? "late" : ""}`}>
      <button className="rq-main" onClick={onOpen}>
        <strong>{requestLabel(r)}</strong>
        <small>
          {[
            r.kind,
            r.requester && `pour ${r.requester}`,
            r.provider && `demandé à ${r.provider}`,
            r.destination,
          ]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </button>
      <div className="rq-side">
        <span className={`pill ${late ? "crit" : TONE[r.status]}`}>
          {r.status}
        </span>
        {r.eta && WAITING.includes(r.status) && (
          <span className={`rq-eta ${late ? "cd-late" : ""}`}>
            arrivée {time(r.eta)}
            {late > 0 && ` · retard ${formatDuration(late * 60_000)}`}
          </span>
        )}
      </div>
      <div className="rq-steps">
        {r.steps.map((s, i) => (
          <span key={i}>
            <span className="mono">{time(s.at)}</span> {s.status.toLowerCase()}
          </span>
        ))}
      </div>
      <div className="rq-actions">
        {!readOnly &&
          TRANSITIONS[r.status].map((to) => (
            <button
              key={to}
              className={`small ${to === "Arrivé" || (to === "Accordé" && r.status === "Demandé") ? "primary" : ""}`}
              onClick={() => onMove(to)}
            >
              {MOVE_LABEL[to]}
            </button>
          ))}
        {resource && <LinkChip target={ref("resource", resource.id)} />}
        {r.entryId && journal.entries.some((e) => e.id === r.entryId) && (
          <LinkChip target={ref("entry", r.entryId)} />
        )}
      </div>
    </article>
  );
}

function RequestSheet({
  editing,
  onClose,
}: {
  editing: Editing;
  onClose: () => void;
}) {
  const {
    readOnly,
    canWrite,
    changeJournal,
    updateOps,
    author,
    toast,
    journal,
  } = useApp();
  const [value, setValue] = useState<Record<string, unknown>>(
    editing.draft as unknown as Record<string, unknown>,
  );
  const [log, setLog] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const existing = editing.existing;
  const Icon = KIND_ICON.request;
  const dirty = useMemo(
    () => !readOnly && JSON.stringify(value) !== JSON.stringify(editing.draft),
    [value, editing.draft, readOnly],
  );
  function save() {
    if (!canWrite()) return;
    const draft = value as unknown as RequestDraft;
    if (!String(draft.title ?? "").trim()) {
      setError("Indiquez le moyen demandé.");
      return;
    }
    try {
      if (existing) {
        updateOps((o) => {
          const latest =
            o.requests.find((r) => r.id === existing.id) ?? existing;
          return upsert(
            o,
            "requests",
            {
              ...latest,
              ...draft,
              id: existing.id,
              status: latest.status,
              steps: latest.steps,
              resourceId: latest.resourceId,
              entryId: latest.entryId,
            },
            author,
          );
        });
        toast("Demande enregistrée.");
      } else {
        if (
          !changeJournal(
            (j) => createRequest(j, draft, author, { log }).journal,
          )
        )
          return;
        toast(log ? "Demande notée au journal." : "Demande enregistrée.");
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <Sheet
      onClose={onClose}
      dirty={dirty}
      eyebrow={
        <>
          <Icon size={12} />
          {KIND_INFO.request.label}
        </>
      }
      title={existing ? requestLabel(existing) : "Nouvelle demande de moyens"}
      footer={
        readOnly ? (
          <span className="muted">Lecture seule.</span>
        ) : confirming ? (
          <>
            <span className="crit-text">Supprimer la demande ?</span>
            <button className="push" onClick={() => setConfirming(false)}>
              Annuler
            </button>
            <button
              className="danger solid"
              onClick={() => {
                if (!canWrite() || !existing) return;
                updateOps((o) => removeRecords(o, [existing.id]));
                toast("Demande supprimée. Les entrées du journal restent.");
                onClose();
              }}
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </>
        ) : (
          <>
            {existing && (
              <button className="danger" onClick={() => setConfirming(true)}>
                <Trash2 size={14} />
                Supprimer
              </button>
            )}
            <button className="push" onClick={onClose}>
              Annuler
            </button>
            <button className="primary" onClick={save}>
              {existing ? "Enregistrer" : "Demander"}
            </button>
          </>
        )
      }
    >
      <fieldset
        disabled={readOnly}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        {existing && (
          <p className="sp-meta">
            État : <strong>{existing.status}</strong> · les changements d’état
            se font avec les boutons de la demande.
          </p>
        )}
        <RecordFields
          spec={SPEC}
          value={value}
          onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
          extraOptions={{
            contact: journal.ops.contacts.map((c) =>
              [c.name, c.phone].filter(Boolean).join(" · "),
            ),
          }}
        />
        {!existing && (
          <div style={{ marginTop: 12 }}>
            <Toggle
              label="Consigner la demande au journal"
              hint="Une entrée « Demande » à traiter, close à l’arrivée ou au refus."
              checked={log}
              onChange={setLog}
            />
          </div>
        )}
      </fieldset>
      {error && (
        <p className="error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      {existing && (
        <div style={{ marginTop: 22 }}>
          <LinksPanel target={ref("request", existing.id)} />
        </div>
      )}
      {existing && (
        <TraceLine
          target={existing.id}
          createdAt={existing.createdAt}
          createdBy={existing.by}
          updatedAt={existing.updatedAt}
        />
      )}
    </Sheet>
  );
}

function MoveDialog({
  request: r,
  to,
  onClose,
}: {
  request: ResourceRequest;
  to: RequestStatus;
  onClose: () => void;
}) {
  const { changeJournal, author, toast, journal } = useApp();
  const [note, setNote] = useState("");
  const [eta, setEta] = useState(r.eta);
  const [log, setLog] = useState(true);
  const [attach, setAttach] = useState(r.resourceId);
  const [error, setError] = useState("");
  const asksEta = to === "Accordé" || to === "En route" || to === "Demandé";
  function confirm() {
    try {
      const ok = changeJournal((j) =>
        moveRequest(j, r.id, to, author, {
          note: note.trim(),
          eta: asksEta ? eta : undefined,
          log,
          resourceId: to === "Arrivé" ? attach : undefined,
        }),
      );
      if (!ok) return;
      toast(
        to === "Arrivé" && !attach
          ? `${requestLabel(r)} : arrivé, ajouté aux moyens.`
          : `${requestLabel(r)} : ${to.toLowerCase()}.`,
      );
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <Modal title={`${requestLabel(r)} : ${to.toLowerCase()}`} onClose={onClose}>
      <div className="form-grid">
        {asksEta && (
          <DateTimeField
            className="span-2"
            label="Arrivée prévue"
            value={eta}
            onChange={setEta}
          />
        )}
        {to === "Arrivé" && (
          <label className="span-2">
            <span>Moyen</span>
            <select value={attach} onChange={(e) => setAttach(e.target.value)}>
              <option value="">Créer le moyen « {r.title} »</option>
              {journal.ops.resources.map((x) => (
                <option key={x.id} value={x.id}>
                  Rattacher à : {x.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <TextField
          className="span-2"
          label="Remarque"
          rows={2}
          value={note}
          maxLength={500}
          onChange={setNote}
        />
        <div className="span-2">
          <Toggle
            label="Consigner au journal"
            checked={log}
            onChange={setLog}
          />
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button onClick={onClose}>Annuler</button>
        <button className="primary" onClick={confirm}>
          {MOVE_LABEL[to]}
        </button>
      </div>
    </Modal>
  );
}
