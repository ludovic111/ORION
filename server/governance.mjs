import { z } from "zod";
import { audit, digest } from "./security.mjs";
import { HttpError, requireRole } from "./validation.mjs";
const field = z.string().trim().min(3).max(2000);
export const governanceSchema = z
  .object({
    controller: field,
    purpose: field,
    legalBasis: field,
    dataCategories: field,
    recipients: field,
    retentionRule: field,
    reviewDate: z.iso.date(),
    archiveDecision: field,
    privacyContact: field,
    impactAssessment: field,
    accessReview: field,
    approved: z.boolean(),
  })
  .strict();
export function governanceReady(
  row,
  today = new Date().toISOString().slice(0, 10),
) {
  return !!(
    row?.reviewed_at &&
    row.data.approved &&
    row.data.reviewDate >= today
  );
}
export async function requireOperationalGovernance(tx, operation) {
  if (operation.mode !== "real") return;
  const row = (
    await tx.query("SELECT * FROM operation_governance WHERE operation_id=$1", [
      operation.id,
    ])
  ).rows[0];
  if (!governanceReady(row))
    throw new HttpError(
      409,
      "Complétez et validez le cadre du dossier avant toute écriture ou diffusion réelle.",
    );
}
export function changeEvidence(before, after) {
  return {
    fields: [
      ...new Set([...Object.keys(before ?? {}), ...Object.keys(after)]),
    ].filter((k) => JSON.stringify(before?.[k]) !== JSON.stringify(after[k])),
    beforeHash: before ? digest(JSON.stringify(before)) : null,
    afterHash: digest(JSON.stringify(after)),
  };
}
export function registerGovernance(app, db, operationAccess) {
  app.get(
    "/api/operations/:op/governance",
    operationAccess,
    async (req, res) => {
      const row =
        (
          await db.query(
            "SELECT * FROM operation_governance WHERE operation_id=$1",
            [req.operation.id],
          )
        ).rows[0] ?? null;
      res.json({ record: row, ready: governanceReady(row) });
    },
  );
  app.put(
    "/api/operations/:op/governance",
    operationAccess,
    async (req, res) => {
      requireRole(req.user, ["admin", "command"]);
      const input = z
        .object({ version: z.number().int().min(0), data: governanceSchema })
        .strict()
        .parse(req.body);
      if (
        input.data.approved &&
        input.data.reviewDate < new Date().toISOString().slice(0, 10)
      )
        throw new HttpError(400, "La date de réexamen doit être à venir.");
      await db.transaction(async (tx) => {
        await tx.query("SELECT id FROM operations WHERE id=$1 FOR UPDATE", [
          req.operation.id,
        ]);
        const before = (
          await tx.query(
            "SELECT * FROM operation_governance WHERE operation_id=$1",
            [req.operation.id],
          )
        ).rows[0];
        if ((before?.version ?? 0) !== input.version)
          throw new HttpError(
            409,
            "Le cadre a été modifié. Rechargez la fiche.",
          );
        const at = input.data.approved ? new Date().toISOString() : null;
        await tx.query(
          `INSERT INTO operation_governance(operation_id,data,reviewed_by,reviewed_at) VALUES($1,$2,$3,$4)
        ON CONFLICT(operation_id) DO UPDATE SET data=$2,reviewed_by=$3,reviewed_at=$4,version=operation_governance.version+1,updated_at=CURRENT_TIMESTAMP`,
          [
            req.operation.id,
            JSON.stringify(input.data),
            at ? req.user.id : null,
            at,
          ],
        );
        await audit(
          tx,
          req.user.id,
          "governance.updated",
          req.operation.id,
          req.operation.id,
          changeEvidence(before?.data, input.data),
        );
      });
      res.json({ ok: true });
    },
  );
}
