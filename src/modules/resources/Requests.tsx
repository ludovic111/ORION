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
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { rich } from "../../i18n";
import { lowerLabel, t } from "./i18n.ts";
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

/** Button moving a request to a state (shared/requests.ts MOVE_LABEL). */
function moveLabel(to: RequestStatus): string {
  switch (to) {
    case "Demandé":
      return t("Redemander");
    case "Accordé":
      return t("Accordée");
    case "Refusé":
      return t("Refusée");
    case "En route":
      return t("En route (bouton)");
    case "Arrivé":
      return t("Arrivée (bouton)");
    case "Libéré":
      return t("Libérer");
    case "Annulé":
      return t("Annuler (demande)");
  }
}

const spec = (): FieldSpec[] => [
  {
    key: "title",
    label: t("Moyen demandé"),
    kind: "text",
    required: true,
    wide: true,
    max: 200,
    placeholder: t("ex. Groupe électrogène 20 kVA, section PCi, sacs de sable"),
  },
  {
    key: "kind",
    label: t("Type de moyen"),
    kind: "combo",
    list: "resourceKinds",
    quick: 6,
  },
  { key: "quantity", label: t("Quantité"), kind: "number" },
  { key: "unit", label: t("Unité"), kind: "combo", list: "requestUnits" },
  {
    key: "priority",
    label: t("Priorité"),
    kind: "choice",
    options: ["Normal", "Important", "Urgent"],
  },
  { kind: "group", label: t("Qui") },
  {
    key: "requester",
    label: t("Demandeur"),
    kind: "combo",
    list: "recipients",
  },
  {
    key: "provider",
    label: t("Demandé à (organisation)"),
    kind: "combo",
    list: "organizations",
  },
  {
    key: "contact",
    label: t("Contact"),
    kind: "combo",
    placeholder: t("Nom, téléphone"),
  },
  {
    key: "destination",
    label: t("Lieu de livraison"),
    kind: "text",
    max: 300,
  },
  { kind: "group", label: t("Quand") },
  {
    key: "requestedAt",
    label: t("Demandé le"),
    kind: "datetime",
    required: true,
  },
  {
    key: "eta",
    label: t("Arrivée prévue"),
    kind: "datetime",
    hint: t("Un avertissement s’affiche quand l’heure est dépassée."),
  },
  { kind: "group", label: t("Détails") },
  { key: "reason", label: t("Motif"), kind: "area", rows: 2, max: 2000 },
  { key: "notes", label: t("Remarques"), kind: "area", rows: 2, max: 2000 },
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
    else toast(t("Cette demande n’existe plus."));
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
      title: t("Demandes de moyens"),
      extra: t("{waiting} en attente, {late} en retard", {
        waiting: waiting.length,
        late,
      }),
      landscape: true,
      name: t("demandes-de-moyens"),
      tables: [
        {
          id: "requests",
          title: t("Demandes de moyens"),
          caption: t("{n} demande(s)", { n: requests.length }),
          head: [
            t("Moyen"),
            t("Demandeur"),
            t("Demandé à"),
            t("Lieu"),
            t("Demandé (colonne)"),
            t("Arrivée prévue"),
            t("État"),
          ],
          body: [...waiting, ...done].map((r) => [
            requestLabel(r),
            r.requester,
            [r.provider, r.contact].filter(Boolean).join(" · "),
            r.destination,
            dateTime(r.requestedAt),
            r.eta
              ? `${dateTime(r.eta)}${requestLate(r, now) ? ` ${t("(retard)")}` : ""}`
              : "",
            enumLabel(r.status),
          ]),
          widths: [60, 32, 44, 36, 30, 36, 31],
        },
      ],
    });
  }

  return (
    <>
      <Figures
        label={t("Demandes de moyens")}
        items={[
          { label: t("En attente"), value: waiting.length },
          { label: t("En retard"), value: late, tone: late ? "crit" : "" },
          {
            label: t("Arrivées"),
            value: requests.filter(
              (r) => r.status === "Arrivé" || r.status === "Libéré",
            ).length,
          },
          {
            label: t("Refusées ou annulées"),
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
            {t("Nouvelle demande")}
          </button>
        )}
        <button onClick={printRequests} disabled={!requests.length}>
          {t("Imprimer")}
        </button>
      </div>
      {!requests.length && (
        <div className="card">
          <EmptyState
            icon={<Megaphone size={28} />}
            title={t("Aucune demande de moyens")}
            actions={
              !readOnly && (
                <button
                  className="primary"
                  onClick={() =>
                    setEditing({ draft: blankRequest(), existing: null })
                  }
                >
                  <Plus size={14} />
                  {t("Nouvelle demande")}
                </button>
              )
            }
          >
            {t(
              "Suivez chaque demande : demandée, accordée ou refusée, en route, arrivée. Chaque étape est notée au journal ; à l’arrivée, le moyen apparaît dans la liste des moyens.",
            )}
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
            {t("Terminées")}
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
            r.requester && t("pour {name}", { name: r.requester }),
            r.provider && t("demandé à {name}", { name: r.provider }),
            r.destination,
          ]
            .filter(Boolean)
            .join(" · ")}
        </small>
      </button>
      <div className="rq-side">
        <span className={`pill ${late ? "crit" : TONE[r.status]}`}>
          {enumLabel(r.status)}
        </span>
        {r.eta && WAITING.includes(r.status) && (
          <span className={`rq-eta ${late ? "cd-late" : ""}`}>
            {t("arrivée {time}", { time: time(r.eta) })}
            {late > 0 &&
              ` · ${t("retard {duration}", { duration: formatDuration(late * 60_000) })}`}
          </span>
        )}
      </div>
      <div className="rq-steps">
        {r.steps.map((s, i) => (
          <span key={i}>
            <span className="mono">{time(s.at)}</span> {lowerLabel(s.status)}
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
              {moveLabel(to)}
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
      setError(t("Indiquez le moyen demandé."));
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
        toast(t("Demande enregistrée."));
      } else {
        if (
          !changeJournal(
            (j) => createRequest(j, draft, author, { log }).journal,
          )
        )
          return;
        toast(log ? t("Demande notée au journal.") : t("Demande enregistrée."));
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
      title={
        existing ? requestLabel(existing) : t("Nouvelle demande de moyens")
      }
      footer={
        readOnly ? (
          <span className="muted">{t("Lecture seule.")}</span>
        ) : confirming ? (
          <>
            <span className="crit-text">{t("Supprimer la demande ?")}</span>
            <button className="push" onClick={() => setConfirming(false)}>
              {t("Annuler")}
            </button>
            <button
              className="danger solid"
              onClick={() => {
                if (!canWrite() || !existing) return;
                updateOps((o) => removeRecords(o, [existing.id]));
                toast(t("Demande supprimée. Les entrées du journal restent."));
                onClose();
              }}
            >
              <Trash2 size={14} />
              {t("Supprimer")}
            </button>
          </>
        ) : (
          <>
            {existing && (
              <button className="danger" onClick={() => setConfirming(true)}>
                <Trash2 size={14} />
                {t("Supprimer")}
              </button>
            )}
            <button className="push" onClick={onClose}>
              {t("Annuler")}
            </button>
            <button className="primary" onClick={save}>
              {existing ? t("Enregistrer") : t("Demander")}
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
            {rich(
              t(
                "État : <0>{status}</0> · les changements d’état se font avec les boutons de la demande.",
                { status: enumLabel(existing.status) },
              ),
              [<strong />],
            )}
          </p>
        )}
        <RecordFields
          spec={spec()}
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
              label={t("Consigner la demande au journal")}
              hint={t(
                "Une entrée « Demande » à traiter, close à l’arrivée ou au refus.",
              )}
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
          ? t("{label} : arrivé, ajouté aux moyens.", {
              label: requestLabel(r),
            })
          : t("{label} : {status}.", {
              label: requestLabel(r),
              status: lowerLabel(to),
            }),
      );
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <Modal
      title={t("{label} : {status}", {
        label: requestLabel(r),
        status: lowerLabel(to),
      })}
      onClose={onClose}
    >
      <div className="form-grid">
        {asksEta && (
          <DateTimeField
            className="span-2"
            label={t("Arrivée prévue")}
            value={eta}
            onChange={setEta}
          />
        )}
        {to === "Arrivé" && (
          <label className="span-2">
            <span>{t("Moyen")}</span>
            <select value={attach} onChange={(e) => setAttach(e.target.value)}>
              <option value="">
                {t("Créer le moyen « {title} »", { title: r.title })}
              </option>
              {journal.ops.resources.map((x) => (
                <option key={x.id} value={x.id}>
                  {t("Rattacher à : {name}", { name: x.name })}
                </option>
              ))}
            </select>
          </label>
        )}
        <TextField
          className="span-2"
          label={t("Remarque")}
          rows={2}
          value={note}
          maxLength={500}
          onChange={setNote}
        />
        <div className="span-2">
          <Toggle
            label={t("Consigner au journal")}
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
        <button onClick={onClose}>{t("Annuler")}</button>
        <button className="primary" onClick={confirm}>
          {moveLabel(to)}
        </button>
      </div>
    </Modal>
  );
}
