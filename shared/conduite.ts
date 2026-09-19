import type { Data, Operation, RecordItem } from "../src/types";

export type DeadlineState =
  "late" | "soon" | "planned" | "completed" | "missing";
export const deadlineLabels: Record<DeadlineState, string> = {
  late: "Échéance dépassée",
  soon: "Dans l’heure",
  planned: "À venir",
  completed: "Terminée",
  missing: "Sans échéance exploitable",
};
export const isOpen = (r: RecordItem) =>
  !["Traité", "Clos"].includes(r.data.status ?? "");
export function deadlineState(r: RecordItem, now: Date): DeadlineState {
  if (!isOpen(r)) return "completed";
  const due = Date.parse(r.data.oimde?.deadline ?? "");
  if (!Number.isFinite(due)) return "missing";
  const remaining = due - now.getTime();
  return remaining < 0 ? "late" : remaining <= 3_600_000 ? "soon" : "planned";
}
const deadlineTime = (r: RecordItem) => {
  const value = Date.parse(r.data.oimde?.deadline ?? "");
  return Number.isFinite(value) ? value : Infinity;
};
export function conduite(
  records: RecordItem[],
  operationId: string,
  now: Date,
) {
  const scoped = records.filter((r) => r.operation_id === operationId);
  const missions = scoped
    .filter((r) => r.kind === "journal" && r.data.type === "Ordre")
    .sort((a, b) => {
      const rank = { late: 0, soon: 1, missing: 2, planned: 3, completed: 4 };
      return (
        rank[deadlineState(a, now)] - rank[deadlineState(b, now)] ||
        deadlineTime(a) - deadlineTime(b) ||
        a.id.localeCompare(b.id)
      );
    });
  return {
    missions,
    requests: scoped.filter(
      (r) => r.kind === "journal" && r.data.type === "Demande" && isOpen(r),
    ),
    transmissions: scoped.filter(
      (r) => r.kind === "transmission" && r.data.status !== "Accusé reçu",
    ),
    resources: scoped.filter((r) => r.kind === "resource"),
    unconfirmed: scoped.filter(
      (r) =>
        r.kind === "journal" &&
        isOpen(r) &&
        (r.data.reliability !== "Confirmé" || !r.data.validated),
    ),
  };
}
const stamp = (date: string) =>
  new Date(date).toLocaleString("fr-CH", { timeZone: "Europe/Zurich" });
const reference = (r: RecordItem) => `[${r.id} · v${r.version}]`;
// Preserve whole entries and make omissions explicit within the existing report limits.
function section(heading: string, lines: string[]) {
  let text = heading;
  for (const [i, line] of lines.entries()) {
    const suffix = `\n… ${lines.length - i} entrée(s) supplémentaire(s) : consulter le suivi de conduite.`;
    if (text.length + line.length + suffix.length + 1 > 10000)
      return text + suffix;
    text += `\n${line}`;
  }
  return text + (lines.length ? "" : "\nAucune entrée.");
}
export function handoverDraft(
  records: RecordItem[],
  operation: Operation,
  now: Date,
): Data {
  const board = conduite(records, operation.id, now);
  const open = board.missions.filter(isOpen);
  return {
    title: `Relève · ${stamp(now.toISOString())}`,
    situation: section(
      `SYNTHÈSE DE RELÈVE — BROUILLON À VÉRIFIER\nÉtat des données au ${stamp(now.toISOString())} (Europe/Zurich).\nDossier : ${operation.name}\nLieu : ${operation.location} · Phase : ${operation.phase}\nInformations ouvertes à confirmer ou à valider : ${board.unconfirmed.length}.`,
      board.unconfirmed.map(
        (r) =>
          `• ${r.data.title} — ${r.data.reliability ?? "Fiabilité non précisée"}; ${r.data.validated ? "validé" : "non validé"} ${reference(r)}`,
      ),
    ),
    actions: section(
      `MISSIONS OUVERTES (${open.length})`,
      open.map(
        (r) =>
          `• ${r.data.priority ?? "Priorité non précisée"} · ${r.data.title} — ${r.data.status}\n  Responsable : ${r.data.assignee?.trim() || "À attribuer"}. Échéance : ${r.data.oimde?.deadline ? stamp(r.data.oimde.deadline) : "Non précisée"} (${deadlineLabels[deadlineState(r, now)]}).\n  Mission : ${r.data.oimde?.mission ?? "OIMDE à compléter"} ${reference(r)}`,
      ),
    ),
    needs: section(
      `DEMANDES OUVERTES (${board.requests.length})`,
      board.requests.map(
        (r) =>
          `• ${r.data.priority} · ${r.data.title} — ${r.data.status}; ${r.data.assignee || "À attribuer"} ${reference(r)}`,
      ),
    ),
    outlook: section(
      `POINTS À REPRENDRE\nTransmissions sans accusé enregistré : ${board.transmissions.length}. Moyens recensés : ${board.resources.length}.\nConfirmer les responsabilités, les délais et la suite à donner avant validation. Aucun message n’est envoyé automatiquement.`,
      [
        ...board.transmissions.map(
          (r) =>
            `• Transmission : ${r.data.title} — ${r.data.status}; ${r.data.sender} → ${r.data.recipient} (${r.data.channel}) ${reference(r)}`,
        ),
        ...board.resources.map(
          (r) =>
            `• Moyen : ${r.data.name} — ${r.data.status}; ${r.data.personnel ?? 0} personne(s); ${r.data.location || "lieu non précisé"} ${reference(r)}`,
        ),
      ],
    ),
    validated: false,
  };
}
