import { useState } from "react";
import { BellRing, Volume2 } from "lucide-react";
import { useApp } from "../app/context";
import { MODULES } from "../app/modules";
import {
  ChoiceField,
  ComboField,
  NumberField,
  TextField,
  Toggle,
} from "../ui/fields";
import { ALARM_KINDS } from "../../shared/alarms";
import type { Module } from "../../shared/links";
import {
  askPermission,
  notificationsSupported,
  permission,
  playTone,
  showNotification,
  unlockAudio,
} from "./notify";
import { landingOf, roleProfile } from "./roles";
import { usePost } from "./store";

/** Réglages → Ce poste: the function of this post and where it lands. */
export function PostRoleSettings() {
  const { lists, live, author } = useApp();
  const [post, setPost] = usePost();
  const profile = roleProfile(post.role);
  const landing = landingOf(post);
  return (
    <section className="settings-section">
      <h3 className="section-label">Fonction de ce poste</h3>
      <div className="form-grid">
        <ComboField
          label="Fonction"
          value={post.role}
          onChange={(role) => setPost({ role })}
          options={lists("postRoles")}
          quick={7}
          hint={
            profile?.hint ??
            "Ce qui est attribué à cette fonction apparaît dans « Mes tâches » et déclenche vos alertes. Liste modifiable dans les référentiels (Fonctions des postes)."
          }
        />
        <ComboField
          label="Cellule ou poste (facultatif)"
          value={post.cell}
          onChange={(cell) => setPost({ cell })}
          options={live.ops.cells.map((c) => c.name)}
          hint={`Une diffusion adressée à cette cellule, à la fonction ou à « ${author} » s’affiche sur ce poste.`}
        />
        <ChoiceField
          label="Module à l’ouverture"
          value={post.landing}
          onChange={(value) => setPost({ landing: value as Module | "" })}
          options={[
            {
              value: "",
              label: `Selon la fonction${landing ? ` (${MODULES.find((m) => m.id === landing)?.short ?? landing})` : " (Situation)"}`,
            },
            ...MODULES.map((m) => ({ value: m.id, label: m.label })),
          ]}
        />
      </div>
    </section>
  );
}

const PERMISSION_TEXT: Record<string, string> = {
  granted: "Autorisées par le navigateur.",
  denied:
    "Refusées par le navigateur. Pour les autoriser : cliquez sur le cadenas à gauche de l’adresse, puis Notifications → Autoriser.",
  default: "Pas encore autorisées.",
  unsupported: "Ce navigateur n’affiche pas de notifications.",
};

/** Réglages → Ce poste: how alerts reach this post. */
export function AlertSettings() {
  const { toast } = useApp();
  const [post, setPost] = usePost();
  const [state, setState] = useState(permission());
  return (
    <section className="settings-section">
      <h3 className="section-label">Alertes</h3>
      <p className="muted" style={{ marginBottom: 10 }}>
        Ce poste peut vous prévenir même quand orion aic est dans un autre
        onglet ou derrière une autre fenêtre : message urgent, échéance
        dépassée, rapport qui approche, tâche pour votre fonction, diffusion à
        quittancer. Rien ne part sur internet : c’est le navigateur de ce poste
        qui affiche et sonne. L’onglet doit rester ouvert.
      </p>
      <div className="stack">
        <Toggle
          label="Notifications du système"
          hint={PERMISSION_TEXT[state]}
          checked={post.notify && state === "granted"}
          onChange={async (on) => {
            if (!on) {
              setPost({ notify: false });
              return;
            }
            const answer = await askPermission();
            setState(answer);
            setPost({ notify: answer === "granted" });
            if (answer === "granted")
              void showNotification(
                "orion aic",
                "Les alertes de ce poste s’afficheront ainsi.",
                "orion-aic-test",
              );
            else toast(PERMISSION_TEXT[answer]);
          }}
        />
        <Toggle
          label="Son"
          hint="Deux notes courtes, trois si c’est urgent. Plus bas et plus doux avec le thème Nuit tactique."
          checked={post.sound}
          onChange={(sound) => {
            unlockAudio();
            setPost({ sound });
            if (sound) setTimeout(() => playTone(false), 60);
          }}
        />
        <div className="action-row">
          <button
            onClick={() => {
              unlockAudio();
              setTimeout(() => playTone(true), 60);
              if (post.notify)
                void showNotification(
                  "Essai d’alerte",
                  "Voici comment ce poste vous prévient.",
                  "orion-aic-test",
                );
              toast("Essai d’alerte.");
            }}
            disabled={!notificationsSupported() && !post.sound}
          >
            {post.sound ? <Volume2 size={14} /> : <BellRing size={14} />}
            Essayer
          </button>
        </div>
      </div>
      <div className="form-grid" style={{ marginTop: 14 }}>
        <NumberField
          label="Prévenir avant un rapport ou rendez-vous (min)"
          value={post.agendaLead}
          min={0}
          max={120}
          onChange={(agendaLead) => setPost({ agendaLead })}
        />
      </div>
      <fieldset style={{ marginTop: 14 }}>
        <legend>Me prévenir pour</legend>
        <div className="stack" style={{ gap: 6 }}>
          {ALARM_KINDS.map((k) => (
            <Toggle
              key={k.kind}
              label={k.label}
              checked={post.kinds[k.kind]}
              onChange={(on) =>
                setPost({ kinds: { ...post.kinds, [k.kind]: on } })
              }
            />
          ))}
        </div>
      </fieldset>
      <div className="stack" style={{ marginTop: 14 }}>
        <Toggle
          label="Heures calmes"
          hint="Pendant ces heures (heure de Zurich), aucun son ; seules les alertes urgentes s’affichent."
          checked={post.quiet}
          onChange={(quiet) => setPost({ quiet })}
        />
        {post.quiet && (
          <div className="form-grid">
            <TextField
              label="De"
              type="time"
              value={post.quietFrom}
              onChange={(quietFrom) => setPost({ quietFrom })}
            />
            <TextField
              label="À"
              type="time"
              value={post.quietTo}
              onChange={(quietTo) => setPost({ quietTo })}
            />
          </div>
        )}
      </div>
    </section>
  );
}
