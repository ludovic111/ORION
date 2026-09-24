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
import { journalSchema, type Journal, type Workspace } from "../../shared/journal";
import { DEFAULT_LISTS } from "../../shared/ops";
import { joinUrl, newRoomCode, normalizeCode, validCode } from "../../shared/room";
import { qrMatrix, qrPath } from "../print/qr";
import { Modal } from "../journal/Modal";
import { SessionPanel } from "../journal/SessionSettings";
import { ChoiceField, Segmented, TextField, Toggle } from "../ui/fields";
import { useApp } from "./context";
import { MODULES, moduleInfo } from "./modules";
import type { useSync } from "../sync/useSync";

export type SettingsTab = "post" | "lists" | "sync" | "session";

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
    <Modal title="Réglages" onClose={onClose} wide>
      <div style={{ marginBottom: 18 }}>
        <Segmented
          label="Rubrique"
          value={tab}
          onChange={onTab}
          options={[
            { value: "post", label: "Ce poste" },
            { value: "lists", label: "Référentiels" },
            { value: "sync", label: "Synchronisation" },
            { value: "session", label: "Session et journal" },
          ]}
        />
      </div>
      {tab === "post" && <PostSettings />}
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

function PostSettings() {
  const { prefs, setPrefs } = useApp();
  return (
    <div className="stack" style={{ gap: 22 }}>
      <section className="settings-section">
        <h3 className="section-label">Apparence</h3>
        <div className="form-grid">
          <ChoiceField
            label="Thème"
            value={prefs.theme}
            onChange={(theme) => setPrefs({ theme })}
            options={[
              { value: "dark", label: "Sombre · espace" },
              { value: "light", label: "Clair · jour" },
              { value: "auto", label: "Comme le système" },
            ]}
          />
          <ChoiceField
            label="Animations"
            value={prefs.motion}
            onChange={(motion) => setPrefs({ motion })}
            options={[
              { value: "full", label: "Toutes" },
              { value: "reduced", label: "Réduites (poste lent, sensibilité)" },
            ]}
          />
        </div>
      </section>
      <section className="settings-section">
        <h3 className="section-label">Impression automatique</h3>
        <div className="stack">
          <Toggle
            label="Imprimer chaque nouvelle entrée du journal"
            hint="Dès qu’une entrée est consignée sur ce poste, sa fiche A4 part à l’impression."
            checked={prefs.autoPrint}
            onChange={(autoPrint) => setPrefs({ autoPrint })}
          />
          <Toggle
            label="Imprimer aussi les entrées des autres postes"
            hint="Pour un poste d’impression central : chaque entrée reçue par synchronisation est imprimée ici."
            checked={prefs.autoPrintRemote}
            onChange={(autoPrintRemote) => setPrefs({ autoPrintRemote })}
          />
          <Toggle
            label="Imprimer chaque nouveau message reçu"
            hint="Formule de message A4 pour chaque message saisi dans Messages."
            checked={prefs.autoPrintMessages}
            onChange={(autoPrintMessages) => setPrefs({ autoPrintMessages })}
          />
          <p className="hint">
            Le navigateur affiche sa fenêtre d’impression à chaque fiche. Pour
            imprimer sans aucune fenêtre, lancer Chrome ou Edge avec l’option{" "}
            <code>--kiosk-printing</code> (voir l’aide).
          </p>
        </div>
      </section>
      <section className="settings-section">
        <h3 className="section-label">Modules affichés</h3>
        <p className="muted" style={{ marginBottom: 10 }}>
          Masquez ce que vous n’utilisez pas. Les données restent intactes et
          les autres postes gardent leur propre choix.
        </p>
        <div className="tile-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
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
                    <small>toujours</small>
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
      settings: { ...ops.settings, lists: { ...ops.settings.lists, [name]: next } },
    }));
  return (
    <div className="stack">
      <p className="muted">
        Valeurs proposées en un clic dans les formulaires. On peut toujours
        taper autre chose. Les référentiels font partie du journal : ils sont
        partagés avec les postes synchronisés et exportés dans l’archive.
      </p>
      <div className="form-grid">
        <ChoiceField
          label="Référentiel"
          value={name}
          onChange={setName}
          options={Object.entries(DEFAULT_LISTS).map(([k, v]) => ({
            value: k,
            label: v.label,
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
            aria-label="Nouvelle valeur"
            placeholder="Ajouter une valeur"
            value={value}
            maxLength={120}
            disabled={readOnly}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="icon-button" aria-label="Ajouter" disabled={readOnly}>
            <Plus size={16} />
          </button>
        </form>
      </div>
      <div className="tag-list" style={{ gap: 6 }}>
        {values.map((v, i) => (
          <span key={v} className="pill plain" style={{ height: 30, paddingRight: 4 }}>
            <input
              aria-label={`Modifier ${v}`}
              defaultValue={v}
              disabled={readOnly}
              style={{ height: 24, border: 0, background: "none", width: `${Math.max(4, v.length + 1)}ch`, padding: 0 }}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== v) save(values.map((x, j) => (j === i ? next : x)));
              }}
            />
            {!readOnly && (
              <button
                className="icon-button"
                style={{ width: 22, height: 22 }}
                aria-label={`Retirer ${v}`}
                onClick={() => save(values.filter((x) => x !== v))}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {!values.length && <span className="muted">Liste vide.</span>}
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
              toast("Valeurs standards rétablies.");
            }}
          >
            <RotateCcw size={14} />
            Rétablir les valeurs standards
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
    toast("Synchronisation activée.");
  };
  return (
    <div className="stack" style={{ gap: 18 }}>
      <p className="muted">
        Plusieurs ordinateurs, tablettes ou téléphones travaillent sur la même
        session, en direct, sans compte ni base de données : chaque poste garde
        toute la session et les postes s’échangent les changements, chiffrés de
        bout en bout avec le code de session. Le serveur ne fait que relayer
        des messages illisibles et ne garde rien.
      </p>
      {!secure && (
        <p className="hint warn">
          Cette page n’est pas en HTTPS : le chiffrement est indisponible.
          Ouvrez orion aic en https:// (ou via <code>npm run lan</code> sur le
          réseau local).
        </p>
      )}
      {room ? (
        <div className="card" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 20 }}>
          <div className="stack">
            <span className="label">Code de session</span>
            <strong
              className="display"
              style={{ fontSize: 30, letterSpacing: "0.08em", fontFamily: "var(--mono)" }}
            >
              {room}
            </strong>
            <p className="muted">
              Sur l’autre poste : ouvrir orion aic → <b>Rejoindre</b> → saisir
              ce code, ou scanner le QR code. Transmettez le code comme un mot
              de passe : il donne accès à toute la session.
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
                Copier le lien
              </button>
              <button
                className="danger"
                onClick={() => {
                  const next = { ...workspace };
                  delete next.room;
                  onUpdateWorkspace(next);
                  toast("Synchronisation arrêtée sur ce poste.");
                }}
              >
                <WifiOff size={14} />
                Arrêter sur ce poste
              </button>
            </div>
            <div className="spec compact" style={{ marginTop: 6 }}>
              <div>
                <dt>État</dt>
                <dd>
                  {sync.status === "live"
                    ? "Connecté"
                    : sync.status === "retrying"
                      ? "Reconnexion…"
                      : sync.status === "connecting"
                        ? "Connexion…"
                        : "Arrêté"}
                </dd>
              </div>
              <div>
                <dt>Autres postes</dt>
                <dd>
                  {sync.relayCount}
                  {sync.peers.length > 0 &&
                    ` · ${sync.peers.map((p) => `${p.name} (${moduleInfo(p.module).short})`).join(", ")}`}
                </dd>
              </div>
              <div>
                <dt>Dernier échange</dt>
                <dd>
                  {sync.lastSync
                    ? new Date(sync.lastSync).toLocaleTimeString("fr-CH")
                    : "—"}
                </dd>
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
              aria-label="QR code pour rejoindre la session"
            >
              <path d={qrPath(matrix)} fill="#0f1127" />
            </svg>
          )}
        </div>
      ) : (
        <div className="form-grid">
          <div className="card stack">
            <Wifi size={20} className="gradient-text" />
            <strong>Partager cette session</strong>
            <p className="muted">
              Crée un code unique. Les postes qui le saisissent reçoivent toute
              la session et restent synchronisés.
            </p>
            <button className="primary" disabled={!secure} onClick={() => start(newRoomCode())}>
              Créer un code de session
            </button>
          </div>
          <form
            className="card stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (validCode(typed)) start(typed);
            }}
          >
            <strong>Rejoindre avec un code</strong>
            <p className="muted">
              Fusionne cette session avec celle des postes qui utilisent ce
              code.
            </p>
            <TextField
              label="Code de session"
              value={typed}
              onChange={(v) => setTyped(normalizeCode(v))}
              placeholder="ABCD-EFGH-JKMN-PQRS"
            />
            <button disabled={!validCode(typed) || !secure}>Rejoindre</button>
          </form>
        </div>
      )}
      <details>
        <summary>Sans internet : réseau local (Wi-Fi ou câble)</summary>
        <div className="details-fields">
          <p className="muted">
            Sur un ordinateur du poste de conduite (le « poste serveur »),
            lancer <code>npm run lan</code> depuis le code source. Il affiche
            une adresse du type <code>https://192.168.1.20:4443</code>. Les
            autres postes du même Wi-Fi ou réseau ouvrent cette adresse,
            acceptent le certificat local une fois, puis utilisent le code de
            session comme ci-dessus. Tout reste dans le bâtiment.
          </p>
        </div>
      </details>
    </div>
  );
}

function JournalProperties() {
  const { journal, updateJournal, readOnly, toast } = useApp();
  const [value, setValue] = useState({
    title: journal.title,
    organization: journal.organization,
    location: journal.location,
    reference: journal.reference,
    mode: journal.mode,
    classification: journal.classification,
  });
  return (
    <form
      className="settings-section"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = journalSchema.safeParse({ ...journal, ...value, title: value.title.trim() });
        if (!parsed.success) return;
        updateJournal(parsed.data);
        toast("Journal modifié.");
      }}
    >
      <h3 className="section-label">Journal · propriétés</h3>
      <fieldset disabled={readOnly} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="form-grid">
          <TextField
            className="span-2"
            label="Événement"
            required
            value={value.title}
            onChange={(title) => setValue({ ...value, title })}
          />
          <TextField
            label="Organisation"
            value={value.organization}
            onChange={(organization) => setValue({ ...value, organization })}
          />
          <TextField
            label="Lieu / secteur"
            value={value.location}
            onChange={(location) => setValue({ ...value, location })}
          />
          <TextField
            label="Référence"
            value={value.reference}
            onChange={(reference) => setValue({ ...value, reference })}
          />
          <ChoiceField
            label="Mode"
            value={value.mode}
            onChange={(mode) => setValue({ ...value, mode })}
            options={["Exercice", "Intervention"] as const}
          />
          <ChoiceField
            label="Diffusion"
            value={value.classification}
            onChange={(classification) => setValue({ ...value, classification })}
            options={["Interne", "Confidentiel"] as const}
          />
        </div>
        <div className="action-row" style={{ marginTop: 10 }}>
          <button className="primary">Enregistrer</button>
        </div>
      </fieldset>
    </form>
  );
}

