import {
  addEntry,
  current,
  emptyFields,
  journalSchema,
  needsFollowUp,
  numberLabel,
  reviseEntry,
  time,
  type Fields,
  type Journal,
} from "./journal.ts";
import { upsert, type Ops, type Resource } from "./ops.ts";
import type { RequestStatus, ResourceRequest } from "./conduct-schemas.ts";

export { REQUEST_STATUSES } from "./conduct-schemas.ts";

// Requests for resources: demandé → accordé / refusé → en route → arrivé
// (→ libéré). Each move is written to the journal; the first entry (the
// request itself) stays "À traiter" until the request ends. On arrival the
// request creates (or updates) its resource in the Moyens module.

export const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  Demandé: ["Accordé", "Refusé", "Annulé"],
  Accordé: ["En route", "Arrivé", "Annulé"],
  "En route": ["Arrivé", "Annulé"],
  Arrivé: ["Libéré"],
  Libéré: [],
  Refusé: ["Demandé"],
  Annulé: ["Demandé"],
};
/** Words of the buttons that move a request. */
export const MOVE_LABEL: Record<RequestStatus, string> = {
  Demandé: "Redemander",
  Accordé: "Accordée",
  Refusé: "Refusée",
  "En route": "En route",
  Arrivé: "Arrivée",
  Libéré: "Libérer",
  Annulé: "Annuler",
};
/** Still waited for. */
export const WAITING: RequestStatus[] = ["Demandé", "Accordé", "En route"];
const ENDED: RequestStatus[] = ["Arrivé", "Libéré", "Refusé", "Annulé"];

export const canMove = (from: RequestStatus, to: RequestStatus) =>
  TRANSITIONS[from].includes(to);

/** Expected arrival past while the request is still waited for. */
export const requestLate = (
  r: Pick<ResourceRequest, "status" | "eta">,
  at = Date.now(),
) => WAITING.includes(r.status) && !!r.eta && Date.parse(r.eta) < at;

/** Minutes of delay (0 when not late). */
export const lateMinutes = (
  r: Pick<ResourceRequest, "status" | "eta">,
  at = Date.now(),
) => (requestLate(r, at) ? Math.floor((at - Date.parse(r.eta)) / 60_000) : 0);

/** "2 × Groupe électrogène 20 kVA". */
export const requestLabel = (
  r: Pick<ResourceRequest, "quantity" | "unit" | "title">,
) =>
  `${r.quantity ? `${r.quantity}${r.unit ? ` ${r.unit}` : " ×"} ` : ""}${r.title}`;

export const openRequests = (ops: Pick<Ops, "requests">) =>
  ops.requests
    .filter((r) => WAITING.includes(r.status))
    .sort(
      (a, b) =>
        (a.eta || "9").localeCompare(b.eta || "9") ||
        a.requestedAt.localeCompare(b.requestedAt),
    );

export type RequestDraft = Omit<
  ResourceRequest,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "by"
  | "status"
  | "steps"
  | "resourceId"
  | "entryId"
> &
  Partial<Pick<ResourceRequest, "id" | "status">>;

export const blankRequest = (at = new Date().toISOString()): RequestDraft => ({
  title: "",
  kind: "",
  quantity: 1,
  unit: "",
  requester: "",
  provider: "",
  contact: "",
  destination: "",
  reason: "",
  priority: "Normal",
  requestedAt: at,
  eta: "",
  notes: "",
});

function lastEntry(j: Journal) {
  return j.entries[j.entries.length - 1];
}

/** Record a new request and its journal entry ("Demande", à traiter). */
export function createRequest(
  journal: Journal,
  draft: RequestDraft,
  author: string,
  { log = true }: { log?: boolean } = {},
): { journal: Journal; id: string } {
  const id = draft.id ?? crypto.randomUUID();
  const at = draft.requestedAt || new Date().toISOString();
  let next = journal;
  let entryId = "";
  if (log) {
    next = addEntry(
      next,
      {
        ...emptyFields(),
        happenedAt: at,
        receivedAt: at,
        type: "Demande",
        priority: draft.priority,
        status: "À traiter",
        channel: "Téléphone",
        message: [
          `Demande de moyens : ${requestLabel(draft)}`,
          draft.provider && `Demandé à : ${draft.provider}`,
          draft.destination && `Lieu : ${draft.destination}`,
          draft.reason && `Motif : ${draft.reason}`,
        ]
          .filter(Boolean)
          .join("\n"),
        source: draft.requester,
        recipient: draft.provider,
        location: draft.destination,
        resources: requestLabel(draft),
        dueAt: draft.eta,
        tags: ["demande de moyens"],
      },
      author,
    );
    entryId = lastEntry(next).id;
  }
  const value: Omit<ResourceRequest, "createdAt" | "updatedAt" | "by"> = {
    ...draft,
    id,
    requestedAt: at,
    status: "Demandé",
    resourceId: "",
    entryId,
    steps: [{ at, status: "Demandé", by: author, note: "", entryId }],
  };
  return {
    journal: journalSchema.parse({
      ...next,
      ops: upsert(next.ops, "requests", value, author),
    }),
    id,
  };
}

const RESOURCE_STATUS: Partial<Record<RequestStatus, Resource["status"]>> = {
  "En route": "En route",
  Arrivé: "Disponible",
  Libéré: "De retour",
};

/**
 * Move a request to its next state: the move is written to the journal
 * (suite of the request entry), the resource follows, and the request entry
 * is closed when the request ends.
 */
export function moveRequest(
  journal: Journal,
  id: string,
  to: RequestStatus,
  author: string,
  {
    at = new Date().toISOString(),
    note = "",
    eta,
    log = true,
    resourceId,
  }: {
    at?: string;
    note?: string;
    /** New expected arrival (accordé, en route). */
    eta?: string;
    log?: boolean;
    /** Attach this existing resource instead of creating one on arrival. */
    resourceId?: string;
  } = {},
): Journal {
  const r = journal.ops.requests.find((x) => x.id === id);
  if (!r) throw new Error("Demande introuvable.");
  if (!canMove(r.status, to))
    throw new Error(
      `Une demande « ${r.status} » ne peut pas passer à « ${to} ».`,
    );
  const nextEta = eta !== undefined ? eta : r.eta;
  let next = journal;
  const first = r.entryId
    ? next.entries.find((e) => e.id === r.entryId)
    : undefined;
  let entryId = "";
  if (log) {
    const label = requestLabel(r);
    next = addEntry(
      next,
      {
        ...emptyFields(),
        happenedAt: at,
        receivedAt: at,
        type:
          to === "Accordé" || to === "Refusé" || to === "Arrivé"
            ? "Quittance"
            : "Renseignement",
        reliability: "Confirmé",
        channel: "Téléphone",
        message: `Demande de moyens ${label} : ${to.toLowerCase()}${
          (to === "Accordé" || to === "En route") && nextEta
            ? `, arrivée prévue à ${time(nextEta)}`
            : ""
        }.${note ? `\n${note}` : ""}`,
        source: r.provider,
        recipient: r.requester,
        location: r.destination,
        resources: label,
        reference: first ? `Suite de ${numberLabel(first)}` : "",
        tags: ["demande de moyens"],
      },
      author,
    );
    entryId = lastEntry(next).id;
  }
  // The request entry: its due time follows the expected arrival, and it is
  // closed when the request ends.
  if (first && needsFollowUp(first)) {
    const f = current(first);
    const change: Partial<Fields> = {};
    if (ENDED.includes(to)) change.status = "Terminé";
    else if (nextEta !== f.dueAt) change.dueAt = nextEta;
    if (Object.keys(change).length)
      next = reviseEntry(
        next,
        first.id,
        { ...f, ...change },
        author,
        change.status
          ? `Demande de moyens : ${to.toLowerCase()}`
          : "Arrivée prévue modifiée",
      );
  }
  // The resource.
  let ops = next.ops;
  let linked = resourceId ?? r.resourceId;
  const known = linked ? ops.resources.find((x) => x.id === linked) : undefined;
  const status = RESOURCE_STATUS[to];
  if (known && status)
    ops = upsert(
      ops,
      "resources",
      {
        ...known,
        status,
        eta: to === "En route" ? nextEta : known.eta,
      },
      author,
    );
  else if (!known && to === "Arrivé") {
    linked = crypto.randomUUID();
    ops = upsert(
      ops,
      "resources",
      {
        id: linked,
        name: r.title.slice(0, 120),
        kind: r.kind,
        organization: r.provider,
        callsign: "",
        count: r.quantity,
        status: "Disponible",
        location: r.destination,
        mission: r.reason.slice(0, 2000),
        eta: "",
        contact: r.contact,
        notes: `Arrivé le ${new Date(at).toLocaleString("fr-CH", { timeZone: "Europe/Zurich", dateStyle: "short", timeStyle: "short" })} sur demande de moyens.`,
      },
      author,
    );
  } else if (!known) linked = "";
  ops = upsert(
    ops,
    "requests",
    {
      ...r,
      status: to,
      eta: nextEta,
      resourceId: linked ?? "",
      steps: [...r.steps, { at, status: to, by: author, note, entryId }].slice(
        -60,
      ),
    },
    author,
  );
  return journalSchema.parse({ ...next, ops });
}

/** Attach an existing resource to a request (no journal entry). */
export function attachResource(
  ops: Ops,
  id: string,
  resourceId: string,
  author: string,
): Ops {
  const r = ops.requests.find((x) => x.id === id);
  if (!r) throw new Error("Demande introuvable.");
  if (resourceId && !ops.resources.some((x) => x.id === resourceId))
    throw new Error("Moyen introuvable.");
  return upsert(ops, "requests", { ...r, resourceId }, author);
}
