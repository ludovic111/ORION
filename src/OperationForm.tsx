import { useState, type FormEvent } from "react";
import { Field, Modal } from "./components";
import { api } from "./api";
export function OperationForm({
  demo,
  onClose,
  onCreated,
}: {
  demo: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: "",
    mode: "exercise",
    nature: "Inondation / crue",
    level: 2,
    location: "",
    commander: "",
    phase: "Évaluation initiale",
  });
  const set = (key: string, value: unknown) =>
    setData((d) => ({ ...d, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ id: string }>("/operations", "POST", data);
      onCreated(r.id);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Nouveau dossier d’engagement"
      subtitle="Ouvrez un dossier d’engagement : journal, carte, moyens et rapports lui seront rattachés."
      onClose={onClose}
      wide
    >
      <div className="steps">
        {["Nature et niveau", "Localisation et conduite", "Vérification"].map(
          (v, i) => (
            <span className={i === step ? "current" : ""} key={v}>
              <b>{i + 1}</b>
              {v}
            </span>
          ),
        )}
      </div>
      <form onSubmit={submit}>
        <div className="form-grid">
          {step === 0 && (
            <>
              <Field label="Désignation" wide>
                <input
                  required
                  maxLength={200}
                  placeholder="EX ORION-26 · Crue de l’Arve"
                  value={data.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Nature de l’événement">
                <select
                  value={data.nature}
                  onChange={(e) => set("nature", e.target.value)}
                >
                  {[
                    "Inondation / crue",
                    "Incendie",
                    "Effondrement",
                    "NBC / pollution",
                    "Tempête / intempéries",
                    "Sanitaire",
                    "Accident majeur",
                    "Autre",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Mode">
                <select
                  value={data.mode}
                  onChange={(e) => set("mode", e.target.value)}
                >
                  <option value="exercise">Exercice</option>
                  {!demo && <option value="real">Réel</option>}
                </select>
              </Field>
              <Field label="Niveau d’engagement">
                <select
                  value={data.level}
                  onChange={(e) => set("level", Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((v) => (
                    <option key={v} value={v}>
                      Niveau {v}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Localisation initiale" wide>
                <input
                  required
                  maxLength={200}
                  placeholder="Commune, secteur, adresse"
                  value={data.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </Field>
              <Field label="Commandant de l’engagement">
                <input
                  required
                  maxLength={200}
                  value={data.commander}
                  onChange={(e) => set("commander", e.target.value)}
                />
              </Field>
              <Field label="Phase">
                <select
                  value={data.phase}
                  onChange={(e) => set("phase", e.target.value)}
                >
                  {[
                    "Évaluation initiale",
                    "Montée en puissance",
                    "Intervention",
                    "Stabilisation",
                    "Retour à la normale",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
          {step === 2 && (
            <div className="full review-box">
              <h3>{data.name}</h3>
              <p>
                {data.nature} · niveau {data.level} ·{" "}
                {data.mode === "exercise" ? "EXERCICE" : "RÉEL"}
              </p>
              <p>{data.location}</p>
              <p>Commandement : {data.commander}</p>
              <p>{data.phase}</p>
              <p className="help">
                {demo
                  ? "Un exercice vide sera ajouté à votre espace. Vous pourrez revenir au scénario initial avec le sélecteur de dossier."
                  : "Le dossier sera créé vide. Les accès se configurent dans Administration → Utilisateurs."}{" "}
                Aucune alerte externe n’est envoyée.
              </p>
            </div>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            onClick={step ? () => setStep(step - 1) : onClose}
          >
            {step ? "Précédent" : "Annuler"}
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy
              ? "Création…"
              : step === 2
                ? "Créer le dossier"
                : step === 0
                  ? "Suivant : localisation"
                  : "Suivant : vérification"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
