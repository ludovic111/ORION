import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import {
  removeRecords,
  upsert,
  type InputOf,
  type Ops,
  type OpsMap,
} from "../../../shared/ops";
import { useApp } from "../../app/context";
import { Modal } from "../../journal/Modal";
import { TextField, Toggle } from "../../ui/fields";
import { TraceLine } from "../../timeline/TraceLine";
import { MAIN_NAME, sortMaps } from "./maps";

type View = { lat: number; lng: number; zoom: number };
type Seed = { base: string; hidden: string[]; view: View };

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const framing = (v: View) => ({
  lat: round6(v.lat),
  lng: round6(v.lng),
  zoom: Math.min(22, Math.max(1, Math.round(v.zoom * 100) / 100)),
});

const PURPOSES = [
  "Vue d’ensemble de l’événement",
  "Secteur en détail",
  "Itinéraires et circulation",
  "Moyens et logistique",
  "Information à la population",
];

/**
 * Create a map, or rename / describe / reorder / delete one. The first new
 * map also turns the implicit main map into a record.
 */
export function MapDialog({
  map,
  main,
  current,
  onClose,
  onSelect,
}: {
  /** Map edited; null: a new map (or naming the implicit main map). */
  map: OpsMap | null;
  /** Naming the implicit main map instead of creating one. */
  main?: boolean;
  /** Background, hidden layers and view of the map shown. */
  current: Seed;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { journal, updateOps, author, toast } = useApp();
  const maps = useMemo(() => sortMaps(journal.ops.maps), [journal.ops.maps]);
  const [name, setName] = useState(map?.name ?? (main ? MAIN_NAME : ""));
  const [purpose, setPurpose] = useState(map?.purpose ?? "");
  const [notes, setNotes] = useState(map?.notes ?? "");
  const [keepOnMain, setKeepOnMain] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [withObjects, setWithObjects] = useState(false);
  const [error, setError] = useState("");
  const firstExtra = !map && !main && maps.length === 0;
  const unplaced = journal.ops.places.filter((p) => !p.maps.length).length;
  const own = map
    ? journal.ops.places.filter(
        (p) => p.maps.length === 1 && p.maps[0] === map.id,
      ).length
    : 0;
  const index = map ? maps.findIndex((m) => m.id === map.id) : -1;

  const record = (
    value: Omit<InputOf<"maps">, "createdAt" | "updatedAt" | "by">,
    ops: Ops,
  ) => upsert(ops, "maps", value, author);

  function save() {
    const n = name.trim();
    if (!n) return setError("Donnez un nom à la carte.");
    try {
      if (map) {
        updateOps((ops) =>
          record({ ...map, name: n, purpose: purpose.trim(), notes }, ops),
        );
        toast("Carte enregistrée.");
        onClose();
        return;
      }
      const id = crypto.randomUUID();
      const mainId = crypto.randomUUID();
      const settings = journal.ops.settings.mapCenter;
      updateOps((ops) => {
        let next = ops;
        const order = next.maps.reduce((o, m) => Math.max(o, m.order + 1), 0);
        if (main) {
          return record(
            {
              id,
              name: n,
              purpose: purpose.trim(),
              notes,
              base: current.base,
              hidden: current.hidden,
              ...framing(settings ?? current.view),
              order,
            },
            next,
          );
        }
        if (!next.maps.length) {
          // The main map becomes a record like the others.
          next = record(
            {
              id: mainId,
              name: MAIN_NAME,
              purpose: "",
              notes: "",
              base: current.base,
              hidden: current.hidden,
              ...framing(settings ?? current.view),
              order: 0,
            },
            next,
          );
          if (keepOnMain)
            next = {
              ...next,
              places: next.places.map((p) =>
                p.maps.length ? p : { ...p, maps: [mainId] },
              ),
            };
        }
        return record(
          {
            id,
            name: n,
            purpose: purpose.trim(),
            notes,
            base: current.base,
            hidden: [],
            ...framing(current.view),
            order: Math.max(order, 1),
          },
          next,
        );
      });
      toast(main ? "Carte nommée." : `Carte « ${n} » créée.`);
      onSelect(id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function move(delta: number) {
    if (!map) return;
    const list = [...maps];
    const i = list.findIndex((m) => m.id === map.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    try {
      updateOps((ops) =>
        list.reduce(
          (next, m, order) =>
            m.order === order ? next : record({ ...m, order }, next),
          ops,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function remove() {
    if (!map) return;
    const gone = map.id;
    updateOps((ops) => {
      const own = ops.places
        .filter((p) => p.maps.length === 1 && p.maps[0] === gone)
        .map((p) => p.id);
      let next: Ops = {
        ...ops,
        // Objects keep their other maps; alone, they go on every map.
        places: ops.places.map((p) =>
          p.maps.includes(gone)
            ? { ...p, maps: p.maps.filter((id) => id !== gone) }
            : p,
        ),
      };
      next = removeRecords(next, withObjects ? [gone, ...own] : [gone]);
      return next;
    });
    toast(
      withObjects && own
        ? `Carte supprimée avec ${own} objet${own > 1 ? "s" : ""}.`
        : "Carte supprimée.",
    );
    onSelect(maps.find((m) => m.id !== gone)?.id ?? "");
    onClose();
  }

  return (
    <Modal
      title={
        map ? "Modifier la carte" : main ? "Nommer la carte" : "Nouvelle carte"
      }
      onClose={onClose}
    >
      <form
        className="map-dialog"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TextField
          label="Nom"
          required
          autoFocus
          value={name}
          maxLength={120}
          onChange={setName}
          placeholder="ex. Secteur Nord (détail)"
        />
        <TextField
          label="But de la carte"
          value={purpose}
          maxLength={300}
          onChange={setPurpose}
          placeholder="ex. Suivi des évacuations du quartier nord"
        />
        <div className="map-chips" role="group" aria-label="Buts fréquents">
          {PURPOSES.map((p) => (
            <button
              key={p}
              type="button"
              className={`map-chip${purpose === p ? " on" : ""}`}
              onClick={() => setPurpose(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <TextField
          label="Remarques"
          value={notes}
          rows={2}
          maxLength={2000}
          onChange={setNotes}
        />
        {!map && !main && (
          <p className="muted map-dialog-note">
            La nouvelle carte part du cadrage et du fond affichés. Elle garde
            ensuite son propre fond, son cadrage et ses calques masqués,
            partagés avec tous les postes.
          </p>
        )}
        {firstExtra && unplaced > 0 && (
          <Toggle
            label={`Garder les ${unplaced} objets déjà posés sur « ${MAIN_NAME} » seulement`}
            hint="Sinon, ils restent visibles sur toutes les cartes."
            checked={keepOnMain}
            onChange={setKeepOnMain}
          />
        )}
        {map && maps.length > 1 && (
          <div className="map-dialog-row">
            <span className="map-field-label">Ordre</span>
            <button
              type="button"
              className="small"
              disabled={index <= 0}
              onClick={() => move(-1)}
            >
              <ArrowLeft size={13} />
              Avant
            </button>
            <button
              type="button"
              className="small"
              disabled={index >= maps.length - 1}
              onClick={() => move(1)}
            >
              Après
              <ArrowRight size={13} />
            </button>
          </div>
        )}
        {map && (
          <TraceLine
            target={map.id}
            createdAt={map.createdAt}
            createdBy={map.by}
            updatedAt={map.updatedAt}
          />
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <footer className="map-dialog-foot">
          {map &&
            (confirming ? (
              <div className="map-dialog-confirm">
                <span className="crit-text">Supprimer cette carte ?</span>
                {own > 0 && (
                  <Toggle
                    label={`Supprimer aussi ses ${own} objet${own > 1 ? "s" : ""} propres`}
                    hint="Sinon, ils passent sur toutes les cartes."
                    checked={withObjects}
                    onChange={setWithObjects}
                  />
                )}
                <div className="map-dialog-row">
                  <button type="button" onClick={() => setConfirming(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="danger solid"
                    onClick={remove}
                  >
                    <Trash2 size={14} />
                    Supprimer la carte
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="danger"
                onClick={() => setConfirming(true)}
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            ))}
          {!confirming && (
            <>
              <button type="button" className="push" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="primary">
                {map ? "Enregistrer" : main ? "Nommer" : "Créer la carte"}
              </button>
            </>
          )}
        </footer>
      </form>
    </Modal>
  );
}
