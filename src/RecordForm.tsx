import { toMN95, fromMN95, formatMN95 } from "../shared/coordinates";
import { useState, type FormEvent } from "react";
import type { Data, Kind, RecordItem, SymbolItem } from "./types";
import { recordTitle, resourceStatuses, journalStatuses } from "./types";
import { Field, Modal } from "./components";
export const kindNames: Record<Kind, string> = {
  journal: "Entrée du journal",
  resource: "Moyen ou partenaire",
  map: "Objet cartographique",
  link: "Liaison",
  transmission: "Transmission",
  report: "Rapport de situation",
  stock: "Matériel",
};
export function RecordForm({
  kind,
  item,
  preset = {},
  symbols,
  records,
  canValidate,
  onClose,
  onSave,
}: {
  kind: Kind;
  item?: RecordItem;
  preset?: Data;
  symbols: SymbolItem[];
  records: RecordItem[];
  canValidate: boolean;
  onClose: () => void;
  onSave: (data: Data) => Promise<void>;
}) {
  const defaults: Record<Kind, Data> = {
    journal: {
      title: "",
      observedAt: new Date().toISOString(),
      type: "Rapport",
      priority: "P3",
      source: "",
      status: "Ouvert",
      assignee: "",
      location: "",
      decision: "",
      reliability: "Non confirmé",
      validated: false,
    },
    resource: {
      name: "",
      organization: "PCi",
      specialty: "Aide à la conduite",
      personnel: 0,
      status: "Disponible",
      location: "",
      contact: "",
      eta: "",
    },
    map: {
      name: "",
      symbol:
        symbols.find((s) => s.name === "Inondation")?.id ??
        symbols[0]?.id ??
        "",
      lat: 46.185,
      lng: 6.14,
      organization: "PCi",
      category: "Effets",
      notes: "",
    },
    link: { source: "", target: "", label: "" },
    transmission: {
      title: "",
      channel: "",
      sender: "",
      recipient: "",
      status: "À transmettre",
      priority: "P3",
    },
    report: {
      title: "",
      situation: "",
      actions: "",
      needs: "",
      outlook: "",
      validated: false,
    },
    stock: { name: "", total: 0, available: 0, location: "" },
  };
  const [data, setData] = useState<Data>({
      ...defaults[kind],
      ...preset,
      ...item?.data,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState("");
  const [mnEast, setMnEast] = useState(() =>
    String(Math.round(toMN95(data.lat ?? 46.185, data.lng ?? 6.14).east)),
  );
  const [mnNorth, setMnNorth] = useState(() =>
    String(Math.round(toMN95(data.lat ?? 46.185, data.lng ?? 6.14).north)),
  );
  const localTime = (iso: string) => {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  const set = (key: keyof Data, value: unknown) =>
    setData((d) => ({ ...d, [key]: value }));
  const input = (
    key: keyof Data,
    label: string,
    required = false,
    wide = false,
    type = "text",
  ) => (
    <Field label={label} wide={wide}>
      <input
        type={type}
        required={required}
        maxLength={key === "title" ? 1000 : 300}
        value={String(data[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );
  const area = (key: keyof Data, label: string, required = false) => (
    <Field label={label} wide>
      <textarea
        rows={kind === "report" ? 4 : 3}
        required={required}
        maxLength={kind === "report" ? 10000 : 5000}
        value={String(data[key] ?? "")}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );
  const select = (key: keyof Data, label: string, values: string[]) => (
    <Field label={label}>
      <select
        value={String(data[key] ?? "")}
        onChange={(e) =>
          key === "type"
            ? setData((d) => ({
                ...d,
                type: e.target.value,
                oimde: e.target.value === "Ordre" ? d.oimde : undefined,
              }))
            : set(key, e.target.value)
        }
      >
        {values.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </Field>
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(data);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${item ? "Modifier :" : "Nouveau :"} ${kindNames[kind].toLowerCase()}`}
      subtitle={
        item
          ? "Les modifications sont historisées dans le journal d’audit."
          : "Cet objet sera rattaché au dossier d’engagement sélectionné."
      }
      onClose={onClose}
      wide={kind === "map" || kind === "report"}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {kind === "journal" && (
            <>
              {area("title", "Message reçu", true)}
              {select(
                "type",
                "Type",
                canValidate
                  ? ["Rapport", "Ordre", "Info", "Demande", "Alerte"]
                  : ["Rapport", "Info", "Demande", "Alerte"],
              )}
              {select("priority", "Priorité", ["P1", "P2", "P3", "P4"])}
              {input("source", "Émetteur", true)}
              <Field label="Heure de l’observation / du renseignement">
                <input
                  type="datetime-local"
                  value={data.observedAt ? localTime(data.observedAt) : ""}
                  onChange={(e) =>
                    set(
                      "observedAt",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : undefined,
                    )
                  }
                />
              </Field>
              {data.type === "Ordre" && (
                <fieldset className="mission-fields full">
                  <legend>Mission selon OIMDE · OFPP</legend>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={!!data.oimde}
                      onChange={(e) =>
                        set(
                          "oimde",
                          e.target.checked
                            ? {
                                orientation: "",
                                intention: "",
                                mission: "",
                                dispositions: "",
                                emplacement: "",
                                deadline: new Date(
                                  Date.now() + 3600000,
                                ).toISOString(),
                              }
                            : undefined,
                        )
                      }
                    />
                    Structurer cet ordre selon OIMDE
                  </label>
                  {data.oimde && (
                    <div className="form-grid">
                      {(
                        [
                          ["orientation", "1. Orientation"],
                          ["intention", "2. Intention"],
                          [
                            "mission",
                            "3. Mission · qui fait quoi, quand et où",
                          ],
                          ["dispositions", "4. Dispositions particulières"],
                          ["emplacement", "5. Emplacements du donneur d’ordre"],
                        ] as const
                      ).map(([key, label]) => (
                        <Field key={key} label={label} wide>
                          <textarea
                            required
                            maxLength={key === "emplacement" ? 2000 : 5000}
                            rows={2}
                            value={data.oimde![key]}
                            onChange={(e) =>
                              set("oimde", {
                                ...data.oimde!,
                                [key]: e.target.value,
                              })
                            }
                          />
                        </Field>
                      ))}
                      <Field label="Échéance / prochain contrôle">
                        <input
                          type="datetime-local"
                          required
                          value={localTime(data.oimde.deadline)}
                          onChange={(e) => {
                            if (e.target.value)
                              set("oimde", {
                                ...data.oimde!,
                                deadline: new Date(
                                  e.target.value,
                                ).toISOString(),
                              });
                          }}
                        />
                      </Field>
                      <p className="help full">
                        Le modèle suit les rubriques du formulaire OFPP. La
                        conduite reste responsable du contenu et de la
                        transmission de l’ordre.
                      </p>
                    </div>
                  )}
                </fieldset>
              )}

              {input("location", "Localisation")}
              {select("reliability", "Fiabilité", [
                "Non confirmé",
                "Probable",
                "Confirmé",
              ])}
              {select("status", "Statut", journalStatuses)}
              {input("assignee", "Attribué à")}
              {area("decision", "Décision / suite à donner")}
              {canValidate && (
                <label className="check full">
                  <input
                    type="checkbox"
                    checked={data.validated ?? false}
                    onChange={(e) => set("validated", e.target.checked)}
                  />
                  Valider cette entrée
                </label>
              )}
            </>
          )}
          {kind === "resource" && (
            <>
              {input("name", "Désignation", true)}
              {select("organization", "Organisation", [
                "PCi",
                "SIS",
                "POL",
                "SAN",
                "OCPPAM",
                "SAM",
                "COM",
                "SIG",
                "ARM",
              ])}
              {input("specialty", "Spécialité / mission", true)}
              <Field label="Personnel">
                <input
                  required
                  type="number"
                  min="0"
                  max="100000"
                  value={data.personnel}
                  onChange={(e) => set("personnel", Number(e.target.value))}
                />
              </Field>
              {select("status", "État", resourceStatuses)}
              {input("location", "Emplacement")}
              {input("contact", "Contact / indicatif")}
              {input("eta", "Arrivée prévue")}
            </>
          )}
          {kind === "stock" && (
            <>
              {input("name", "Matériel", true, true)}
              <Field label="Quantité totale">
                <input
                  required
                  type="number"
                  min="0"
                  max="10000000"
                  value={data.total}
                  onChange={(e) => set("total", Number(e.target.value))}
                />
              </Field>
              <Field label="Disponible">
                <input
                  required
                  type="number"
                  min="0"
                  max={data.total}
                  value={data.available}
                  onChange={(e) => set("available", Number(e.target.value))}
                />
              </Field>
              {input("location", "Lieu de stockage", true, true)}
            </>
          )}
          {kind === "map" && (
            <>
              {input("name", "Étiquette", true)}
              {select("organization", "Organisation", [
                "PCi",
                "SIS",
                "POL",
                "SAN",
                "OCPPAM",
                "SAM",
                "COM",
                "SIG",
                "ARM",
              ])}
              <Field label="Latitude WGS84">
                <input
                  required
                  type="number"
                  step="any"
                  min="45.8"
                  max="46.6"
                  value={data.lat}
                  onChange={(e) => set("lat", Number(e.target.value))}
                />
              </Field>
              <Field label="Longitude WGS84">
                <input
                  required
                  type="number"
                  step="any"
                  min="5.7"
                  max="6.7"
                  value={data.lng}
                  onChange={(e) => set("lng", Number(e.target.value))}
                />
              </Field>
              <div className="full">
                <p className="mono">
                  MN95 ≈{" "}
                  {data.lat &&
                  data.lat >= 45 &&
                  data.lat <= 48 &&
                  data.lng &&
                  data.lng >= 5 &&
                  data.lng <= 11
                    ? formatMN95(data.lat, data.lng)
                    : "Position à compléter"}
                </p>
                <details>
                  <summary>Saisir des coordonnées suisses MN95</summary>
                  <div className="form-grid">
                    <Field label="Est MN95">
                      <input
                        type="number"
                        value={mnEast}
                        onChange={(e) => setMnEast(e.target.value)}
                      />
                    </Field>
                    <Field label="Nord MN95">
                      <input
                        type="number"
                        value={mnNorth}
                        onChange={(e) => setMnNorth(e.target.value)}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const p = fromMN95(Number(mnEast), Number(mnNorth));
                          if (
                            p.lat < 45.8 ||
                            p.lat > 46.6 ||
                            p.lng < 5.7 ||
                            p.lng > 6.7
                          )
                            throw new Error(
                              "Position hors du périmètre genevois pris en charge.",
                            );
                          setData((d) => ({
                            ...d,
                            lat: Number(p.lat.toFixed(6)),
                            lng: Number(p.lng.toFixed(6)),
                          }));
                          setError("");
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Appliquer la position
                    </button>
                    <p className="help full">
                      Conversion approchée swisstopo pour la navigation, pas
                      pour la mensuration officielle.
                    </p>
                  </div>
                </details>
              </div>
              {select("category", "Calque opérationnel", [
                "Effets",
                "Moyens",
                "Mesures",
                "Dangers",
              ])}
              <Field label="Rechercher un signe OFPP">
                <input
                  value={search}
                  placeholder="Inondation, barrage, sanitaire…"
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
              <div className="symbol-picker full">
                {symbols
                  .filter((s) => !/exemple/i.test(s.name))
                  .filter((s) =>
                    `${s.name} ${s.group}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`symbol-choice ${data.symbol === s.id ? "selected" : ""}`}
                      aria-pressed={data.symbol === s.id}
                      onClick={() => set("symbol", s.id)}
                    >
                      <img src={`/symbols/display/${s.id}.svg`} alt="" />
                      <span>{s.name}</span>
                    </button>
                  ))}
              </div>
              {data.geometry && (
                <p className="full muted">
                  Zone dessinée · {data.geometry.length} sommets conservés.
                </p>
              )}
              {area("notes", "Observations")}
            </>
          )}
          {kind === "link" && (
            <>
              {(["source", "target"] as const).map((key, i) => (
                <Field label={i ? "Objet cible" : "Objet source"} key={key}>
                  <select
                    required
                    value={data[key]}
                    onChange={(e) => set(key, e.target.value)}
                  >
                    <option value="">Choisir un objet</option>
                    {records
                      .filter((r) => !["link", "report"].includes(r.kind))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {recordTitle(r).slice(0, 100)}
                        </option>
                      ))}
                  </select>
                </Field>
              ))}
              {input(
                "label",
                "Relation (ex. engage, localise, motive)",
                true,
                true,
              )}
            </>
          )}
          {kind === "transmission" && (
            <>
              {area("title", "Message", true)}
              {input("channel", "Canal / moyen de transmission", true)}
              {select("priority", "Priorité", ["P1", "P2", "P3", "P4"])}
              {input("sender", "Émetteur", true)}
              {input("recipient", "Destinataire", true)}
              {select("status", "État", [
                "À transmettre",
                "Transmis",
                "Accusé reçu",
              ])}
              <p className="full help">
                ORION consigne la transmission. Le message doit être envoyé par
                votre moyen radio ou téléphonique habituel.
              </p>
            </>
          )}
          {kind === "report" && (
            <>
              {input("title", "Titre du rapport", true, true)}
              {area("situation", "Situation actuelle", true)}
              {area("actions", "Actions et décisions")}
              {area("needs", "Besoins et points en suspens")}
              {area("outlook", "Évolution possible et prochaines échéances")}
              {canValidate && (
                <label className="check full">
                  <input
                    type="checkbox"
                    checked={data.validated ?? false}
                    onChange={(e) => set("validated", e.target.checked)}
                  />
                  Valider le rapport
                </label>
              )}
            </>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="primary" disabled={busy} type="submit">
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
