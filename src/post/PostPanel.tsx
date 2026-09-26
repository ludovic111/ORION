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
import { t } from "./i18n.ts";

/** Réglages → Ce poste: the function of this post and where it lands. */
export function PostRoleSettings() {
  const { lists, live, author } = useApp();
  const [post, setPost] = usePost();
  const profile = roleProfile(post.role);
  const landing = landingOf(post);
  return (
    <section className="settings-section">
      <h3 className="section-label">{t("Fonction de ce poste")}</h3>
      <div className="form-grid">
        <ComboField
          label={t("Fonction")}
          value={post.role}
          onChange={(role) => setPost({ role })}
          options={lists("postRoles")}
          quick={7}
          hint={
            profile?.hint ??
            t(
              "Ce qui est attribué à cette fonction apparaît dans « Mes tâches » et déclenche vos alertes. Liste modifiable dans les référentiels (Fonctions des postes).",
            )
          }
        />
        <ComboField
          label={t("Cellule ou poste (facultatif)")}
          value={post.cell}
          onChange={(cell) => setPost({ cell })}
          options={live.ops.cells.map((c) => c.name)}
          hint={t(
            "Une diffusion adressée à cette cellule, à la fonction ou à « {author} » s’affiche sur ce poste.",
            { author },
          )}
        />
        <ChoiceField
          label={t("Module à l’ouverture")}
          value={post.landing}
          onChange={(value) => setPost({ landing: value as Module | "" })}
          options={[
            {
              value: "",
              label: t("Selon la fonction ({module})", {
                module: landing
                  ? (MODULES.find((m) => m.id === landing)?.short ?? landing)
                  : t("Situation"),
              }),
            },
            ...MODULES.map((m) => ({ value: m.id, label: m.label })),
          ]}
        />
      </div>
    </section>
  );
}

// A function, not a constant: read in the language of the post.
const permissionText = (state: string): string =>
  state === "granted"
    ? t("Autorisées par le navigateur.")
    : state === "denied"
      ? t(
          "Refusées par le navigateur. Pour les autoriser : cliquez sur le cadenas à gauche de l’adresse, puis Notifications → Autoriser.",
        )
      : state === "default"
        ? t("Pas encore autorisées.")
        : t("Ce navigateur n’affiche pas de notifications.");

/** Réglages → Ce poste: how alerts reach this post. */
export function AlertSettings() {
  const { toast } = useApp();
  const [post, setPost] = usePost();
  const [state, setState] = useState(permission());
  return (
    <section className="settings-section">
      <h3 className="section-label">{t("Alertes")}</h3>
      <p className="muted" style={{ marginBottom: 10 }}>
        {t(
          "Ce poste peut vous prévenir même quand orion aic est dans un autre onglet ou derrière une autre fenêtre : message urgent, échéance dépassée, rapport qui approche, tâche pour votre fonction, diffusion à quittancer. Rien ne part sur internet : c’est le navigateur de ce poste qui affiche et sonne. L’onglet doit rester ouvert.",
        )}
      </p>
      <div className="stack">
        <Toggle
          label={t("Notifications du système")}
          hint={permissionText(state)}
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
                t("Les alertes de ce poste s’afficheront ainsi."),
                "orion-aic-test",
              );
            else toast(permissionText(answer));
          }}
        />
        <Toggle
          label={t("Son")}
          hint={t(
            "Deux notes courtes, trois si c’est urgent. Plus bas et plus doux avec le thème Nuit tactique.",
          )}
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
                  t("Essai d’alerte"),
                  t("Voici comment ce poste vous prévient."),
                  "orion-aic-test",
                );
              toast(t("Essai d’alerte."));
            }}
            disabled={!notificationsSupported() && !post.sound}
          >
            {post.sound ? <Volume2 size={14} /> : <BellRing size={14} />}
            {t("Essayer")}
          </button>
        </div>
      </div>
      <div className="form-grid" style={{ marginTop: 14 }}>
        <NumberField
          label={t("Prévenir avant un rapport ou rendez-vous (min)")}
          value={post.agendaLead}
          min={0}
          max={120}
          onChange={(agendaLead) => setPost({ agendaLead })}
        />
      </div>
      <fieldset style={{ marginTop: 14 }}>
        <legend>{t("Me prévenir pour")}</legend>
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
          label={t("Heures calmes")}
          hint={t(
            "Pendant ces heures (heure de Zurich), aucun son ; seules les alertes urgentes s’affichent.",
          )}
          checked={post.quiet}
          onChange={(quiet) => setPost({ quiet })}
        />
        {post.quiet && (
          <div className="form-grid">
            <TextField
              label={t("De")}
              type="time"
              value={post.quietFrom}
              onChange={(quietFrom) => setPost({ quietFrom })}
            />
            <TextField
              label={t("À")}
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
