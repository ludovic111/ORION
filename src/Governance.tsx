import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import { Field, Panel, Badge } from "./components";
import type { Operation, Role } from "./types";
type Policy = {
  controller: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string;
  recipients: string;
  retentionRule: string;
  reviewDate: string;
  archiveDecision: string;
  privacyContact: string;
  impactAssessment: string;
  accessReview: string;
  approved: boolean;
};
type Envelope = {
  record: null | { data: Policy; version: number; reviewed_at: string | null };
  ready: boolean;
};
const empty: Policy = {
  controller: "",
  purpose: "",
  legalBasis: "",
  dataCategories: "",
  recipients: "",
  retentionRule: "",
  reviewDate: "",
  archiveDecision: "",
  privacyContact: "",
  impactAssessment: "",
  accessReview: "",
  approved: false,
};
const fields: [
  Exclude<keyof Policy, "approved" | "reviewDate">,
  string,
  string,
][] = [
  [
    "controller",
    "Responsable du traitement",
    "Institution, service et fonction responsable",
  ],
  ["purpose", "Finalité du dossier", "Tâche précise nécessitant ce traitement"],
  [
    "legalBasis",
    "Base légale / mandat",
    "Références à confirmer par l’institution",
  ],
  [
    "dataCategories",
    "Données nécessaires",
    "Catégories autorisées et données à ne pas collecter",
  ],
  [
    "recipients",
    "Destinataires autorisés",
    "Fonctions et organisations habilitées",
  ],
  [
    "retentionRule",
    "Règle de conservation",
    "Durée, point de départ et justification",
  ],
  [
    "archiveDecision",
    "Sort final / archives",
    "Autorité compétente, versement ou destruction à instruire",
  ],
  [
    "privacyContact",
    "Contact protection des données",
    "Fonction ou adresse institutionnelle",
  ],
  [
    "impactAssessment",
    "Évaluation des risques / AIPD",
    "Référence de l’analyse ou décision motivée sur sa nécessité",
  ],
  [
    "accessReview",
    "Revue des habilitations",
    "Date, responsable et référence du contrôle",
  ],
];
export function Governance({
  operation,
  role,
}: {
  operation: Operation;
  role: Role;
}) {
  const [policy, setPolicy] = useState<Policy>(empty),
    [version, setVersion] = useState(0),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const canEdit = ["admin", "command"].includes(role);
  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError("");
    setMessage("");
    api<Envelope>(`/operations/${operation.id}/governance`)
      .then((r) => {
        if (!disposed) {
          setPolicy(r.record?.data ?? empty);
          setVersion(r.record?.version ?? 0);
          setReady(r.ready);
        }
      })
      .catch((e) => {
        if (!disposed) setError(e.message);
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [operation.id]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(`/operations/${operation.id}/governance`, "PUT", {
        data: policy,
        version,
      });
      const r = await api<Envelope>(`/operations/${operation.id}/governance`);
      setVersion(r.record?.version ?? 0);
      setReady(r.ready);
      setMessage("Cadre enregistré et décision tracée.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="governance-page">
      <div className="page-toolbar">
        <div>
          <p className="muted">
            Finalité, accès, conservation et décision du responsable
          </p>
          <Badge tone={ready ? "green" : "amber"}>
            {ready
              ? "Cadre renseigné et revu"
              : "Cadre à compléter ou à réexaminer"}
          </Badge>
        </div>
      </div>
      <Panel title="Cadre de traitement du dossier">
        <div className="policy-intro">
          <p>
            Cette fiche prépare la revue de l’institution. Sa validation ne vaut
            ni homologation ni déclaration au catalogue du PPDT.
          </p>
          <p>
            En mode réel, un cadre revu et non échu est nécessaire aux écritures
            et aux exports. Une date de réexamen déclenche une revue humaine,
            jamais une destruction automatique.
          </p>
        </div>
        {loading ? (
          <p className="empty">Chargement du cadre…</p>
        ) : (
          <form onSubmit={submit} className="policy-form">
            <fieldset disabled={!canEdit || busy}>
              <div className="form-grid">
                {fields.map(([key, label, placeholder]) => (
                  <Field key={key} label={label} wide>
                    <textarea
                      required
                      minLength={3}
                      maxLength={2000}
                      rows={2}
                      value={policy[key]}
                      placeholder={placeholder}
                      onChange={(e) =>
                        setPolicy({ ...policy, [key]: e.target.value })
                      }
                    />
                  </Field>
                ))}
                <Field label="Prochain réexamen">
                  <input
                    required
                    type="date"
                    value={policy.reviewDate}
                    onChange={(e) =>
                      setPolicy({ ...policy, reviewDate: e.target.value })
                    }
                  />
                </Field>
                <label className="check full">
                  <input
                    type="checkbox"
                    checked={policy.approved}
                    onChange={(e) =>
                      setPolicy({ ...policy, approved: e.target.checked })
                    }
                  />
                  Je consigne la revue et la décision du responsable du dossier.
                </label>
              </div>
            </fieldset>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {message && <p role="status">{message}</p>}
            {canEdit && (
              <div className="modal-actions">
                <button className="primary" disabled={busy}>
                  {busy ? "Enregistrement…" : "Enregistrer le cadre"}
                </button>
              </div>
            )}
          </form>
        )}
      </Panel>
      <Panel title="Références et limites">
        <div className="policy-intro">
          <p>
            Genève : LIPAD et RIPAD. Cadre fédéral : LPD / OPDo selon le
            responsable concerné, LSI selon le périmètre de l’exploitant. Les
            exigences applicables et les directives internes restent à valider.
          </p>
          <div className="actions">
            <a
              href="https://silgeneve.ch/legis/program/books/rsg/htm/rsg_a2_08.htm"
              target="_blank"
              rel="noreferrer"
            >
              LIPAD officielle ↗
            </a>
            <a
              href="https://www.edoeb.admin.ch/fr/securite-de-linformation"
              target="_blank"
              rel="noreferrer"
            >
              Recommandations PFPDT ↗
            </a>
          </div>
        </div>
      </Panel>
    </div>
  );
}
