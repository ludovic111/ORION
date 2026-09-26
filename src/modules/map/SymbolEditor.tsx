import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { removeRecords, upsert, type CustomSymbol } from "../../../shared/ops";
import { useApp } from "../../app/context";
import { Modal } from "../../journal/Modal";
import { ComboField, TextField, Toggle } from "../../ui/fields";
import {
  ACCEPT_ATTR,
  canvasFromDataUrl,
  finish,
  readSymbolFile,
} from "./image";
import { TraceLine } from "../../timeline/TraceLine";
import { useLang } from "../../i18n";
import { t, tn } from "./i18n-2.ts";

/**
 * Add or edit a custom symbol: pick an image, make its background
 * transparent, name it. Stored in the journal (ops.symbols): every post
 * that shares the session sees it.
 */
export function SymbolEditor({
  symbol,
  onClose,
  onSaved,
}: {
  symbol: CustomSymbol | null;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const { journal, updateOps, author, toast, readOnly } = useApp();
  const lang = useLang();
  const [name, setName] = useState(symbol?.name ?? "");
  const [group, setGroup] = useState(symbol?.group ?? "");
  const [source, setSource] = useState<HTMLCanvasElement | null>(null);
  const [transparent, setTransparent] = useState(true);
  const [tolerance, setTolerance] = useState(20);
  const [preview, setPreview] = useState(symbol?.image ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const value = symbol ? `c:${symbol.id}` : "";
  const used = useMemo(
    () =>
      value ? journal.ops.places.filter((p) => p.symbol === value).length : 0,
    [journal.ops.places, value],
  );
  const groups = useMemo(
    () => [
      ...new Set(journal.ops.symbols.map((s) => s.group).filter(Boolean)),
      // Suggestions, in the language of the post (the family typed is data).
      t("Partenaires"),
      t("Logos"),
      t("Pictogrammes"),
    ],
    [journal.ops.symbols, lang],
  );

  // Reprocess the image when an option changes (a new file only).
  useEffect(() => {
    if (!source) return;
    const timer = setTimeout(() => {
      try {
        setPreview(finish(source, { transparent, tolerance }));
        setError("");
      } catch (err) {
        setError((err as Error).message);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [source, transparent, tolerance]);

  async function choose(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const canvas = await readSymbolFile(file);
      setSource(canvas);
      if (!name.trim())
        setName(
          file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[_-]+/g, " ")
            .slice(0, 120),
        );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reprocessExisting() {
    if (!symbol) return;
    setBusy(true);
    try {
      setSource(await canvasFromDataUrl(symbol.image));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!name.trim()) return setError(t("Donnez un nom au signe."));
    if (!preview) return setError(t("Choisissez une image."));
    const id = symbol?.id ?? crypto.randomUUID();
    try {
      updateOps((ops) =>
        upsert(
          ops,
          "symbols",
          {
            ...(symbol ?? {}),
            id,
            name: name.trim(),
            group: group.trim(),
            image: preview,
          },
          author,
        ),
      );
      toast(symbol ? t("Signe modifié.") : t("Signe ajouté à la palette."));
      onSaved?.(id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function remove() {
    if (!symbol) return;
    updateOps((ops) => removeRecords(ops, [symbol.id]));
    toast(t("Signe supprimé."));
    onClose();
  }

  return (
    <Modal
      title={symbol ? t("Modifier le signe") : t("Ajouter un signe")}
      onClose={onClose}
    >
      <div className="map-symbol-editor">
        <div
          className={`map-checker${preview ? "" : " empty"}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!readOnly) void choose(e.dataTransfer.files[0]);
          }}
        >
          {busy ? (
            <Loader2 size={26} className="map-spin" />
          ) : preview ? (
            <img src={preview} alt={t("Aperçu du signe")} />
          ) : (
            <button
              type="button"
              className="map-checker-pick"
              onClick={() => input.current?.click()}
              disabled={readOnly}
            >
              <ImagePlus size={28} />
              <span>{t("Choisir une image")}</span>
              <small>{t("PNG, SVG, JPEG ou WebP · 2 Mo au maximum")}</small>
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={ACCEPT_ATTR}
          hidden
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <fieldset disabled={readOnly} className="map-symbol-form">
          <div className="map-symbol-actions">
            <button type="button" onClick={() => input.current?.click()}>
              <Upload size={14} />
              {preview ? t("Remplacer l’image") : t("Choisir une image")}
            </button>
            {symbol && !source && (
              <button type="button" onClick={reprocessExisting}>
                {t("Retoucher le fond")}
              </button>
            )}
          </div>
          {source && (
            <div className="map-symbol-bg">
              <Toggle
                label={t("Rendre le fond transparent")}
                hint={t(
                  "Retire la couleur unie qui touche les bords de l’image.",
                )}
                checked={transparent}
                onChange={setTransparent}
              />
              {transparent && (
                <label className="map-range">
                  <span>
                    {t("Tolérance")} <output>{tolerance}</output>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                  />
                  <small>
                    {t("Plus haut : retire aussi les teintes proches du fond.")}
                  </small>
                </label>
              )}
            </div>
          )}
          <TextField
            label={t("Nom")}
            required
            value={name}
            maxLength={120}
            onChange={setName}
            placeholder={t("ex. Poste avancé Rega, logo SIS…")}
          />
          <ComboField
            label={t("Famille")}
            value={group}
            maxLength={80}
            onChange={setGroup}
            options={groups}
            quick={4}
            placeholder={t("ex. Partenaires")}
          />
          {symbol && (
            <p className="muted map-symbol-used">
              {used
                ? tn(
                    used,
                    "Utilisé par {n} objet de la carte.",
                    "Utilisé par {n} objets de la carte.",
                  )
                : t("Aucun objet ne l’utilise pour le moment.")}
            </p>
          )}
        </fieldset>
        {symbol && (
          <TraceLine
            target={symbol.id}
            createdAt={symbol.createdAt}
            createdBy={symbol.by}
            updatedAt={symbol.updatedAt}
          />
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!readOnly && (
          <footer className="map-dialog-foot">
            {symbol &&
              (confirming ? (
                <>
                  <span className="crit-text">
                    {used
                      ? tn(
                          used,
                          "Supprimer ? {n} objet perdra son signe.",
                          "Supprimer ? {n} objets perdront leur signe.",
                        )
                      : t("Supprimer ce signe ?")}
                  </span>
                  <button type="button" onClick={() => setConfirming(false)}>
                    {t("Annuler")}
                  </button>
                  <button
                    type="button"
                    className="danger solid"
                    onClick={remove}
                  >
                    <Trash2 size={14} />
                    {t("Supprimer")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="danger"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 size={14} />
                  {t("Supprimer")}
                </button>
              ))}
            {!confirming && (
              <>
                <button type="button" className="push" onClick={onClose}>
                  {t("Annuler")}
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={save}
                  disabled={busy}
                >
                  {symbol ? t("Enregistrer") : t("Ajouter à la palette")}
                </button>
              </>
            )}
          </footer>
        )}
      </div>
    </Modal>
  );
}
