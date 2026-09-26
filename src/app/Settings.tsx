import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  journalSchema,
  type Journal,
  type Workspace,
} from "../../shared/journal";
import { DEFAULT_LISTS } from "../../shared/ops";
import {
  joinUrl,
  codeProblem,
  newRoomCode,
  normalizeCode,
  validCode,
} from "../../shared/room";
import { qrMatrix, qrPath } from "../print/qr";
import { Modal } from "../journal/Modal";
import { SessionPanel } from "../journal/SessionSettings";
import { ChoiceField, Segmented, TextField, Toggle } from "../ui/fields";
import { useApp } from "./context";
import { speechSupported } from "../ui/dictation";
import { ContactCard } from "./contact";
import { MODULES, moduleInfo } from "./modules";
import { DARK_PALETTES, LIGHT_PALETTES, type Palette } from "./palettes";
import type { useSync } from "../sync/useSync";
import { ConflictPanel } from "../sync/ConflictPanel";
import { AlertSettings, PostRoleSettings } from "../post/PostPanel";
import { LiaisonPanel } from "../liaison/LiaisonPanel";
import { LANGS, LANG_NAMES, formatTime, rich, type Lang } from "../i18n";
import { listLabel } from "../../shared/i18n/lists.ts";
import { t } from "./i18n.ts";

export type SettingsTab = "post" | "lists" | "sync" | "session" | "contact";

export function SettingsDialog({
  tab,
  onTab,
  onClose,
  persistent,
  stored,
  onProtect,
  onUpdateWorkspace,
  onJournal,
  onEnd,
  onFinish,
  onExport,
  sync,
}: {
  tab: SettingsTab;
  onTab: (tab: SettingsTab) => void;
  onClose: () => void;
  persistent: boolean;
  stored: boolean;
  onProtect: (password: string) => Promise<void>;
  onUpdateWorkspace: (value: Workspace) => void;
  onJournal: (value: Journal) => void;
  onEnd: () => void;
  onFinish: () => Promise<void>;
  onExport: () => void;
  sync: ReturnType<typeof useSync>;
}) {
  const { workspace, journal } = useApp();
  return (
    <Modal title={t("Réglages")} onClose={onClose} wide>
      <div style={{ marginBottom: 18 }}>
        <Segmented
          label={t("Rubrique")}
          value={tab}
          onChange={onTab}
          options={[
            { value: "post", label: t("Ce poste") },
            { value: "lists", label: t("Référentiels") },
            { value: "sync", label: t("Synchronisation") },
            { value: "session", label: t("Session et journal") },
            { value: "contact", label: t("Une idée ?") },
          ]}
        />
      </div>
      {tab === "post" && <PostSettings />}
      {tab === "contact" && <ContactCard topic={t("Réglages")} />}
      {tab === "lists" && <ListsSettings />}
      {tab === "sync" && (
        <SyncSettings sync={sync} onUpdateWorkspace={onUpdateWorkspace} />
      )}
      {tab === "session" && (
        <>
          <JournalProperties />
          <SessionPanel
            workspace={workspace}
            journal={journal}
            persistent={persistent}
            stored={stored}
            onClose={onClose}
            onProtect={onProtect}
            onUpdate={onUpdateWorkspace}
            onJournal={onJournal}
            onEnd={onEnd}
            onFinish={onFinish}
            onExport={onExport}
          />
        </>
      )}
    </Modal>
  );
}

/** Colour themes of one mode, each shown as a strip of its own colours. */
function PalettePicker({
  title,
  palettes,
  value,
  onPick,
}: {
  title: string;
  palettes: Palette[];
  value: string;
  onPick: (palette: Palette) => void;
}) {
  return (
    <fieldset className="palette-picker">
      <legend>{title}</legend>
      <div className="palette-grid">
        {palettes.map((p) => {
          const [bg, card, ink, accent, dot] = p.swatch;
          return (
            <button
              key={p.id}
              type="button"
              className="palette-card"
              aria-pressed={value === p.id}
              onClick={() => onPick(p)}
            >
              <span
                className="palette-sample"
                style={{ background: bg }}
                aria-hidden="true"
              >
                <span style={{ background: card, color: ink }}>
                  Aa
                  <i style={{ background: dot }} />
                </span>
                <b style={{ background: accent }} />
              </span>
              <span className="palette-name">
                {p.label}
                {value === p.id && <Check size={14} />}
              </span>
              <small>{p.hint}</small>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Voice dictation: off by default, since the audio may leave the post. */
function DictationSettings() {
  const { prefs, setPrefs } = useApp();
  const [supported] = useState(() => speechSupported(window));
  return (
    <section className="settings-section">
      <h3 className="section-label">{t("Dictée vocale")}</h3>
      {supported ? (
        <div className="stack">
          <Toggle
            label={t("Dicter les messages au micro")}
            hint={t(
              "Un bouton micro apparaît à côté du texte des entrées du journal et des messages. Le micro n’est ouvert que pendant la dictée.",
            )}
            checked={prefs.dictation}
            onChange={(dictation) => setPrefs({ dictation })}
          />
          <p className="hint">
            {t(
              "Dans Chrome et Edge, le son est envoyé aux serveurs de Google / Microsoft pour être transcrit, et il faut une connexion internet. Safari peut transcrire sur l’appareil selon le système. Ne dictez pas d’informations confidentielles si ce n’est pas autorisé.",
            )}
          </p>
        </div>
      ) : (
        <p className="muted">
          {t(
            "Non disponible dans ce navigateur. Chrome, Edge et Safari proposent la dictée vocale.",
          )}
        </p>
      )}
    </section>
  );
}

function PostSettings() {
  const { prefs, setPrefs } = useApp();
  return (
    <div className="stack" style={{ gap: 22 }}>
      <section className="settings-section">
        <h3 className="section-label">{t("Langue")}</h3>
        <div className="form-grid">
          <ChoiceField
            label={t("Langue de l’interface")}
            value={prefs.lang}
            onChange={(lang: Lang) => setPrefs({ lang })}
            options={LANGS.map((l) => ({ value: l, label: LANG_NAMES[l] }))}
          />
        </div>
        <p className="muted small">
          {t(
            "Propre à ce poste. Les textes saisis (journal, messages, référentiels) restent tels qu’ils ont été écrits, quelle que soit la langue.",
          )}
        </p>
      </section>
      <PostRoleSettings />
      <AlertSettings />
      <section className="settings-section">
        <h3 className="section-label">{t("Apparence")}</h3>
        <div className="form-grid">
          <ChoiceField
            label={t("Mode")}
            value={prefs.theme}
            onChange={(theme) => setPrefs({ theme })}
            options={[
              { value: "light", label: t("Clair") },
              { value: "dark", label: t("Sombre") },
              { value: "auto", label: t("Comme le système (jour / nuit)") },
            ]}
          />
          <ChoiceField
            label={t("Animations")}
            value={prefs.motion}
            onChange={(motion) => setPrefs({ motion })}
            options={[
              { value: "full", label: t("Toutes") },
              {
                value: "reduced",
                label: t("Réduites (poste lent, sensibilité)"),
              },
            ]}
          />
        </div>
        <PalettePicker
          title={t("Thème clair")}
          palettes={LIGHT_PALETTES}
          value={prefs.lightPalette}
          onPick={(p) =>
            setPrefs({
              lightPalette: p.id,
              ...(prefs.theme === "auto" ? {} : { theme: "light" }),
            })
          }
        />
        <PalettePicker
          title={t("Thème sombre")}
          palettes={DARK_PALETTES}
          value={prefs.darkPalette}
          onPick={(p) =>
            setPrefs({
              darkPalette: p.id,
              ...(prefs.theme === "auto" ? {} : { theme: "dark" }),
            })
          }
        />
        <p className="hint">
          {t(
            "Le bouton soleil / lune de la barre du haut passe du thème clair au thème sombre choisis ici. Chaque poste garde son propre thème.",
          )}
        </p>
      </section>
      <section className="settings-section">
        <h3 className="section-label">{t("Impression automatique")}</h3>
        <div className="stack">
          <Toggle
            label={t("Imprimer chaque nouvelle entrée du journal")}
            hint={t(
              "Dès qu’une entrée est consignée sur ce poste, sa fiche A4 part à l’impression.",
            )}
            checked={prefs.autoPrint}
            onChange={(autoPrint) => setPrefs({ autoPrint })}
          />
          <Toggle
            label={t("Imprimer aussi les entrées des autres postes")}
            hint={t(
              "Pour un poste d’impression central : chaque entrée reçue par synchronisation est imprimée ici.",
            )}
            checked={prefs.autoPrintRemote}
            onChange={(autoPrintRemote) => setPrefs({ autoPrintRemote })}
          />
          <Toggle
            label={t("Imprimer chaque nouveau message reçu")}
            hint={t(
              "Formule de message A4 pour chaque message saisi dans Messages.",
            )}
            checked={prefs.autoPrintMessages}
            onChange={(autoPrintMessages) => setPrefs({ autoPrintMessages })}
          />
          <p className="hint">
            {rich(
              t(
                "Le navigateur affiche sa fenêtre d’impression à chaque fiche. Pour imprimer sans aucune fenêtre, lancer Chrome ou Edge avec l’option <0>--kiosk-printing</0> (voir l’aide).",
              ),
              [<code />],
            )}
          </p>
        </div>
      </section>
      <DictationSettings />
      <section className="settings-section">
        <h3 className="section-label">{t("Modules affichés")}</h3>
        <p className="muted" style={{ marginBottom: 10 }}>
          {t(
            "Masquez ce que vous n’utilisez pas. Les données restent intactes et les autres postes gardent leur propre choix.",
          )}
        </p>
        <div
          className="tile-grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          {MODULES.map((m) => {
            const Icon = m.icon;
            const shown = m.core || !prefs.hidden.includes(m.id);
            return (
              <button
                key={m.id}
                className="tile"
                disabled={m.core}
                onClick={() =>
                  setPrefs({
                    hidden: shown
                      ? [...prefs.hidden, m.id]
                      : prefs.hidden.filter((h) => h !== m.id),
                  })
                }
                style={{ opacity: shown ? 1 : 0.5, padding: "10px 12px" }}
              >
                <span className="tile-top" style={{ alignItems: "center" }}>
                  <Icon size={16} style={{ color: `hsl(${m.hue} 85% 68%)` }} />
                  <strong style={{ fontSize: 13 }}>{m.short}</strong>
                  {m.core ? (
                    <small>{t("toujours")}</small>
                  ) : shown ? (
                    <Eye size={14} />
                  ) : (
                    <EyeOff size={14} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ListsSettings() {
  const { journal, updateOps, lists, readOnly, toast } = useApp();
  const [name, setName] = useState(Object.keys(DEFAULT_LISTS)[0]);
  const [value, setValue] = useState("");
  const values = lists(name);
  const custom = !!journal.ops.settings.lists[name];
  const save = (next: string[]) =>
    updateOps((ops) => ({
      ...ops,
      settings: {
        ...ops.settings,
        lists: { ...ops.settings.lists, [name]: next },
      },
    }));
  return (
    <div className="stack">
      <p className="muted">
        {t(
          "Valeurs proposées en un clic dans les formulaires. On peut toujours taper autre chose. Les référentiels font partie du journal : ils sont partagés avec les postes synchronisés et exportés dans l’archive.",
        )}
      </p>
      <div className="form-grid">
        <ChoiceField
          label={t("Référentiel")}
          value={name}
          onChange={setName}
          options={Object.entries(DEFAULT_LISTS).map(([k, v]) => ({
            value: k,
            label: listLabel(v.label),
          }))}
        />
        <form
          className="inline-field"
          style={{ alignSelf: "end" }}
          onSubmit={(e) => {
            e.preventDefault();
            const v = value.trim();
            if (!v || values.includes(v)) return;
            save([...values, v]);
            setValue("");
          }}
        >
          <input
            aria-label={t("Nouvelle valeur")}
            placeholder={t("Ajouter une valeur")}
            value={value}
            maxLength={120}
            disabled={readOnly}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            className="icon-button"
            aria-label={t("Ajouter")}
            disabled={readOnly}
          >
            <Plus size={16} />
          </button>
        </form>
      </div>
      <div className="tag-list" style={{ gap: 6 }}>
        {values.map((v, i) => (
          <span
            key={v}
            className="pill plain"
            style={{ height: 30, paddingRight: 4 }}
          >
            <input
              aria-label={t("Modifier {value}", { value: v })}
              defaultValue={v}
              disabled={readOnly}
              style={{
                height: 24,
                border: 0,
                background: "none",
                width: `${Math.max(4, v.length + 1)}ch`,
                padding: 0,
              }}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== v)
                  save(values.map((x, j) => (j === i ? next : x)));
              }}
            />
            {!readOnly && (
              <button
                className="icon-button"
                style={{ width: 22, height: 22 }}
                aria-label={t("Retirer {value}", { value: v })}
                onClick={() => save(values.filter((x) => x !== v))}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {!values.length && <span className="muted">{t("Liste vide.")}</span>}
      </div>
      {custom && !readOnly && (
        <div>
          <button
            onClick={() => {
              updateOps((ops) => {
                const next = { ...ops.settings.lists };
                delete next[name];
                return { ...ops, settings: { ...ops.settings, lists: next } };
              });
              toast(t("Valeurs standards rétablies."));
            }}
          >
            <RotateCcw size={14} />
            {t("Rétablir les valeurs standards")}
          </button>
        </div>
      )}
    </div>
  );
}

function SyncSettings({
  sync,
  onUpdateWorkspace,
}: {
  sync: ReturnType<typeof useSync>;
  onUpdateWorkspace: (value: Workspace) => void;
}) {
  const { workspace, toast } = useApp();
  const [typed, setTyped] = useState("");
  const [copied, setCopied] = useState(false);
  const room = workspace.room;
  const url = room ? joinUrl(location.origin, room) : "";
  const matrix = useMemo(() => (url ? qrMatrix(url) : null), [url]);
  const secure = window.isSecureContext;
  const start = (code: string) => {
    onUpdateWorkspace({ ...workspace, room: normalizeCode(code) });
    toast(t("Synchronisation activée."));
  };
  return (
    <div className="stack" style={{ gap: 18 }}>
      <p className="muted">
        {t(
          "Plusieurs ordinateurs, tablettes ou téléphones travaillent sur la même session, en direct, sans compte ni base de données : chaque poste garde toute la session et les postes s’échangent les changements, chiffrés de bout en bout avec le code de session. Le serveur ne fait que relayer des messages illisibles et ne garde rien.",
        )}
      </p>
      {!secure && (
        <p className="hint warn">
          {rich(
            t(
              "Cette page n’est pas en HTTPS : le chiffrement est indisponible. Ouvrez orion aic en https:// (ou via <0>npm run lan</0> sur le réseau local).",
            ),
            [<code />],
          )}
        </p>
      )}
      {room ? (
        <div
          className="card"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) auto",
            gap: 20,
          }}
        >
          <div className="stack">
            <span className="label">{t("Code de session")}</span>
            <strong
              className="display"
              style={{
                fontSize: 30,
                letterSpacing: "0.08em",
                fontFamily: "var(--mono)",
              }}
            >
              {room}
            </strong>
            <p className="muted">
              {rich(
                t(
                  "Sur l’autre poste : ouvrir orion aic → <0>Rejoindre</0> → saisir ce code, ou scanner le QR code. Transmettez le code comme un mot de passe : il donne accès à toute la session.",
                ),
                [<b />],
              )}
            </p>
            <div className="action-row">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    toast(url);
                  }
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {t("Copier le lien")}
              </button>
              <button
                className="danger"
                onClick={() => {
                  const next = { ...workspace };
                  delete next.room;
                  onUpdateWorkspace(next);
                  toast(t("Synchronisation arrêtée sur ce poste."));
                }}
              >
                <WifiOff size={14} />
                {t("Arrêter sur ce poste")}
              </button>
            </div>
            <div className="spec compact" style={{ marginTop: 6 }}>
              <div>
                <dt>{t("État")}</dt>
                <dd>
                  {sync.status === "live"
                    ? t("Connecté")
                    : sync.status === "outdated"
                      ? t("Version différente : rechargez la page")
                      : sync.status === "retrying"
                        ? t("Reconnexion…")
                        : sync.status === "connecting"
                          ? t("Connexion…")
                          : t("Arrêté")}
                </dd>
              </div>
              <div>
                <dt>{t("Autres postes")}</dt>
                <dd>
                  {sync.relayCount}
                  {sync.peers.length > 0 &&
                    ` · ${sync.peers.map((p) => `${p.name} (${moduleInfo(p.module).short})`).join(", ")}`}
                </dd>
              </div>
              <div>
                <dt>{t("Dernier échange")}</dt>
                <dd>{sync.lastSync ? formatTime(sync.lastSync, true) : "—"}</dd>
              </div>
            </div>
          </div>
          {matrix && (
            <svg
              viewBox={`-2 -2 ${matrix.length + 4} ${matrix.length + 4}`}
              width={170}
              height={170}
              shapeRendering="crispEdges"
              style={{ background: "#fff", borderRadius: 14 }}
              role="img"
              aria-label={t("QR code pour rejoindre la session")}
            >
              <path d={qrPath(matrix)} fill="#0f1127" />
            </svg>
          )}
        </div>
      ) : (
        <div className="form-grid">
          <div className="card stack">
            <Wifi size={20} className="gradient-text" />
            <strong>{t("Partager cette session")}</strong>
            <p className="muted">
              {t(
                "Crée un code unique. Les postes qui le saisissent reçoivent toute la session et restent synchronisés.",
              )}
            </p>
            <button
              className="primary"
              disabled={!secure}
              onClick={() => start(newRoomCode())}
            >
              {t("Créer un code de session")}
            </button>
          </div>
          <form
            className="card stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (validCode(typed)) start(typed);
            }}
          >
            <strong>{t("Rejoindre avec un code")}</strong>
            <p className="muted">
              {t(
                "Fusionne cette session avec celle des postes qui utilisent ce code.",
              )}
            </p>
            <TextField
              label={t("Code de session")}
              value={typed}
              onChange={(v) => setTyped(normalizeCode(v))}
              placeholder="ABCD-EFGH-JKMN-PQRS"
            />
            {typed && codeProblem(typed) && (
              <p className="hint warn">{codeProblem(typed)}</p>
            )}
            <button disabled={!validCode(typed) || !secure}>
              {t("Rejoindre")}
            </button>
          </form>
        </div>
      )}
      {room && (
        <section className="stack" style={{ gap: 10 }}>
          <span className="label">
            {t("Fusions entre postes")}
            {sync.conflictCount > 0
              ? ` · ${t("{n} à voir", { n: sync.conflictCount })}`
              : ""}
          </span>
          <ConflictPanel sync={sync} />
        </section>
      )}
      <section className="stack" style={{ gap: 10 }}>
        <span className="label">{t("Liaison entre PC")}</span>
        <LiaisonPanel />
      </section>
      <details>
        <summary>{t("Sans internet : réseau local (Wi-Fi ou câble)")}</summary>
        <div className="details-fields">
          <p className="muted">
            {rich(
              t(
                "Sur un ordinateur du poste de conduite (le « poste serveur »), lancer <0>npm run lan</0> depuis le code source. Il affiche une adresse du type <1>https://192.168.1.20:4443</1>. Les autres postes du même Wi-Fi ou réseau ouvrent cette adresse, acceptent le certificat local une fois, puis utilisent le code de session comme ci-dessus. Tout reste dans le bâtiment.",
              ),
              [<code />, <code />],
            )}
          </p>
        </div>
      </details>
    </div>
  );
}

// Names of the properties, in the language of the post (read when shown).
const PROPERTY_LABELS: Record<string, () => string> = {
  title: () => t("Événement"),
  organization: () => t("Organisation"),
  location: () => t("Lieu / secteur"),
  reference: () => t("Référence"),
  mode: () => t("Mode"),
  classification: () => t("Diffusion"),
};

function JournalProperties() {
  const { live, updateJournal, readOnly, toast } = useApp();
  const [value, setValue] = useState({
    title: live.title,
    organization: live.organization,
    location: live.location,
    reference: live.reference,
    mode: live.mode,
    classification: live.classification,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<typeof value>) => {
    setValue({ ...value, ...patch });
    const keys = Object.keys(patch);
    if (keys.some((k) => errors[k]))
      setErrors((previous) => {
        const next = { ...previous };
        keys.forEach((k) => delete next[k]);
        return next;
      });
  };
  return (
    <form
      className="settings-section"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = {
          ...value,
          title: value.title.trim(),
          organization: value.organization.trim(),
          location: value.location.trim(),
          reference: value.reference.trim(),
        };
        const found: Record<string, string> = {};
        if (!trimmed.title) found.title = t("Indiquez le nom de l’événement.");
        const parsed = journalSchema.safeParse({ ...live, ...trimmed });
        if (!parsed.success)
          for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? "");
            if (key in PROPERTY_LABELS && !found[key])
              found[key] = t("{field} : valeur refusée (trop longue ?).", {
                field: PROPERTY_LABELS[key](),
              });
          }
        if (Object.keys(found).length || !parsed.success) {
          setErrors(
            Object.keys(found).length
              ? found
              : {
                  title: t("Ces propriétés ne peuvent pas être enregistrées."),
                },
          );
          return;
        }
        setErrors({});
        setValue(trimmed);
        if (updateJournal(parsed.data)) toast(t("Journal modifié."));
      }}
    >
      <h3 className="section-label">{t("Journal · propriétés")}</h3>
      {readOnly && (
        <p className="muted">
          {live.closedAt
            ? t(
                "Journal clôturé : rouvrez-le (ci-dessous) pour modifier ses propriétés.",
              )
            : t(
                "Lecture seule : vous consultez le passé. Revenez au direct pour modifier.",
              )}
        </p>
      )}
      <fieldset
        disabled={readOnly}
        style={{ border: 0, padding: 0, margin: 0 }}
      >
        <div className="form-grid">
          <TextField
            className="span-2"
            label={t("Événement")}
            required
            value={value.title}
            error={errors.title}
            onChange={(title) => set({ title })}
          />
          <TextField
            label={t("Organisation")}
            value={value.organization}
            error={errors.organization}
            onChange={(organization) => set({ organization })}
          />
          <TextField
            label={t("Lieu / secteur")}
            value={value.location}
            error={errors.location}
            onChange={(location) => set({ location })}
          />
          <TextField
            label={t("Référence")}
            value={value.reference}
            error={errors.reference}
            onChange={(reference) => set({ reference })}
          />
          <ChoiceField
            label={t("Mode")}
            value={value.mode}
            onChange={(mode) => set({ mode })}
            options={["Exercice", "Intervention"] as const}
          />
          <ChoiceField
            label={t("Diffusion")}
            value={value.classification}
            onChange={(classification) => set({ classification })}
            options={["Interne", "Confidentiel"] as const}
          />
        </div>
        <div className="action-row" style={{ marginTop: 10 }}>
          <button className="primary">{t("Enregistrer")}</button>
        </div>
      </fieldset>
    </form>
  );
}
