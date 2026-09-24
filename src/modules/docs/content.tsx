import type { ReactNode } from "react";
import {
  CircleHelp,
  FileDown,
  History,
  Lightbulb,
  MonitorPlay,
  Keyboard,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Printer,
  Rocket,
  Settings2,
  ShieldCheck,
  Smartphone,
  BookA,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type { Module } from "../../../shared/links";
import { moduleInfo } from "../../app/modules";
import { CONTACT_EMAIL, ContactCard, feedbackLink } from "../../app/contact";
import {
  Example,
  Faq,
  Gloss,
  H,
  K,
  LinksFigure,
  MessageFlow,
  Note,
  Path,
  ScreenMap,
  States,
  Steps,
  SyncFlow,
  Table,
  Ui,
} from "./kit";

export type Level = "short" | "guide" | "full";
export type TopicGroup = "start" | "modules" | "together" | "reference";

export const GROUPS: { id: TopicGroup; label: string }[] = [
  { id: "start", label: "Bien démarrer" },
  { id: "modules", label: "Modules" },
  { id: "together", label: "Travailler ensemble" },
  { id: "reference", label: "Référence" },
];

export type Topic = {
  id: string;
  group: TopicGroup;
  title: string;
  icon: LucideIcon;
  hue: number;
  /** Module opened by the "Ouvrir …" button. */
  module?: Module;
  openLabel?: string;
  /** "En bref": what it is for, 1 to 3 sentences. */
  short: ReactNode;
  /** "Guide": numbered steps for the main tasks. */
  guide?: ReactNode;
  /** "Tout le détail": every field, option, tip and limit. */
  full?: ReactNode;
  /** Reference lists (FAQ, glossary): the guide layer shows at every level. */
  always?: boolean;
};

const mod = (id: Module, openLabel: string) => {
  const info = moduleInfo(id);
  return {
    module: id,
    icon: info.icon,
    hue: info.hue,
    title: info.label,
    openLabel,
  };
};

const SITE = "https://orionaic.xyz";

export const TOPICS: Topic[] = [
  // ---------------------------------------------------------------- start
  {
    id: "start",
    group: "start",
    title: "Premiers pas",
    icon: Rocket,
    hue: 250,
    short: (
      <p>
        orion aic aide une cellule d’aide à la conduite à{" "}
        <strong>tout noter, tout suivre et tout retrouver</strong> pendant un
        exercice ou une intervention. Il marche dans le navigateur, sans compte
        : ouvrez <a href={SITE}>orionaic.xyz</a> et commencez.
      </p>
    ),
    guide: (
      <>
        <H>Démarrer en 5 étapes</H>
        <Steps>
          <li>
            <strong>Ouvrir le site</strong> <a href={SITE}>{SITE}</a> sur un
            ordinateur, une tablette ou un téléphone. Pour découvrir sans rien
            risquer, cliquez sur <Ui>Ouvrir l’exercice de démonstration</Ui> :
            un exercice fictif complet, « Crue de l’Arve », se charge.
          </li>
          <li>
            <strong>Créer une session.</strong> Onglet <Ui>Nouvelle session</Ui>{" "}
            : le nom de l’événement (par exemple « Crue de l’Arve »), votre nom
            ou votre fonction, et le mode <Ui>Exercice</Ui> ou{" "}
            <Ui>Intervention</Ui>.
          </li>
          <li>
            <strong>Protéger vos données.</strong> Laissez cochée{" "}
            <Ui>Sauvegarde chiffrée sur ce poste</Ui> et choisissez une{" "}
            <em>phrase de récupération</em> d’au moins 12 caractères. Écrivez-la
            en lieu sûr : personne ne pourra la retrouver pour vous.
          </li>
          <li>
            <strong>Noter le premier événement.</strong> Dans le{" "}
            <Ui>Journal</Ui>, écrivez ce qui se passe, puis <Ui>Enregistrer</Ui>{" "}
            (ou <K>⌘↵</K> / <K>Ctrl+↵</K>). L’entrée reçoit un numéro : #001.
          </li>
          <li>
            <strong>Inviter les autres postes</strong> (si vous êtes plusieurs).{" "}
            <Path
              steps={[
                "Réglages",
                "Synchronisation",
                "Créer un code de session",
              ]}
            />
            . Sur l’autre poste : <Ui>Rejoindre</Ui>, puis le code. Voilà, vous
            travaillez ensemble.
          </li>
        </Steps>
        <Example>
          <p>
            14:05, la Patrouille Alpha annonce par radio : « L’Arve déborde au
            quai des Acacias, 30 cm d’eau sur la route. » Vous l’écrivez dans le
            journal, nature <Ui>Renseignement</Ui>, priorité <Ui>Urgent</Ui>,
            émetteur « Patrouille Alpha ». C’est enregistré, numéroté et visible
            sur tous les postes.
          </p>
        </Example>
        <Note kind="tip">
          Perdu ? Le bouton <Ui>?</Ui> en haut de chaque page ouvre l’aide de
          cette page. Et <K>⌘K</K> / <K>Ctrl+K</K> trouve n’importe quoi : une
          entrée, un moyen, une action.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Choisir la quantité d’aide</H>
        <p>
          En haut de cette page, trois boutons règlent le niveau de détail pour
          toute la documentation : <Ui>En bref</Ui> (à quoi ça sert, en deux
          phrases), <Ui>Guide</Ui> (les étapes pour les tâches principales) et{" "}
          <Ui>Tout le détail</Ui> (chaque champ, chaque option, chaque limite).
          Chaque sujet a aussi son propre bouton <Ui>Plus de détail</Ui> pour
          creuser un seul point. Votre choix est retenu sur ce poste.
        </p>
        <H>La page d’accueil</H>
        <Table
          head={["Bouton", "Quand l’utiliser"]}
          rows={[
            [
              <Ui>Reprendre</Ui>,
              "Une session chiffrée est déjà enregistrée sur ce poste : tapez la phrase de récupération, puis Déverrouiller.",
            ],
            [<Ui>Nouvelle session</Ui>, "Un nouvel événement commence."],
            [
              <Ui>Rejoindre</Ui>,
              "Un autre poste a déjà la session et vous a donné son code (ou son QR code).",
            ],
            [
              <Ui>Importer</Ui>,
              "Vous avez reçu un fichier .orionaic, .orion, .json ou .csv.",
            ],
            [
              <Ui>Ouvrir l’exercice de démonstration</Ui>,
              "Pour apprendre ou montrer l’outil, sans toucher à vos données.",
            ],
          ]}
        />
        <H>Ce qu’il faut</H>
        <ul>
          <li>
            Un navigateur récent : Chrome, Edge, Firefox ou Safari, sur
            ordinateur, tablette ou téléphone.
          </li>
          <li>
            Une adresse en <code>https://</code> (c’est le cas de{" "}
            <a href={SITE}>orionaic.xyz</a>) : le chiffrement du navigateur ne
            fonctionne qu’ainsi.
          </li>
          <li>
            Internet au premier chargement. Ensuite, l’application reste
            disponible hors ligne.
          </li>
        </ul>
        <H>En fin d’engagement</H>
        <Steps>
          <li>
            Clôturer le journal :{" "}
            <Path steps={["Réglages", "Session et journal"]} />. Il passe en
            lecture seule.
          </li>
          <li>
            Exporter une archive <code>.orionaic</code> (chiffrée) de chaque
            journal et la ranger selon les règles de votre organisation.
          </li>
          <li>
            Effacer la session du poste :{" "}
            <Path
              steps={["Réglages", "Session et journal", "Effacer la session"]}
            />
            . orion aic vérifie qu’une archive récente existe, puis demande de
            taper <code>TERMINER</code>.
          </li>
        </Steps>
      </>
    ),
  },
  {
    id: "interface",
    group: "start",
    title: "L’écran en un coup d’œil",
    icon: LayoutDashboard,
    hue: 212,
    short: (
      <p>
        En haut, la barre : le journal actif, la recherche et l’état du poste. À
        gauche (en bas sur téléphone), le <strong>dock</strong> avec tous les
        modules. Au milieu, la page du module choisi.
      </p>
    ),
    guide: (
      <>
        <ScreenMap />
        <ol className="docs-legend">
          <li>
            <strong>Logo</strong> : revient à la page Situation.
          </li>
          <li>
            <strong>Journal actif</strong> (titre et mode). Un clic ouvre le
            menu des journaux : changer de journal, <Ui>Nouveau journal</Ui>,{" "}
            <Ui>Importer un fichier</Ui>, <Ui>Exporter (tous formats)</Ui>,{" "}
            <Ui>Propriétés, clôture</Ui>,{" "}
            <Ui>Retirer ce journal de la session</Ui>.
          </li>
          <li>
            <strong>Rechercher ou agir</strong> (<K>⌘K</K> / <K>Ctrl+K</K>) :
            tapez quelques lettres pour trouver un élément, un module ou une
            action.
          </li>
          <li>
            <strong>Synchronisation</strong> : <Ui>Seul</Ui> quand vous
            travaillez seul, <Ui>3 postes</Ui> avec les initiales de chacun
            quand vous êtes plusieurs, <Ui>Reconnexion</Ui> si la liaison est
            coupée.
          </li>
          <li>
            <strong>Sauvegarde</strong> : <Ui>Chiffré</Ui> (vert, tout est gardé
            sur le poste) ou <Ui>Temporaire</Ui> (orange, perdu à la fermeture
            de l’onglet).
          </li>
          <li>
            <strong>Heure suisse</strong> et bouton{" "}
            <strong>thème clair / sombre</strong>.
          </li>
          <li>
            <strong>Menu opérateur</strong> (vos initiales) : réglages du poste,
            référentiels, synchronisation, session, sécurité, installation, code
            source, verrouiller.
          </li>
          <li>
            <strong>Dock</strong> : un clic = un module. Une pastille{" "}
            <span className="docs-dot crit" /> rouge signale des échéances
            dépassées ; une pastille <span className="docs-dot accent" />{" "}
            violette, de nouveaux messages.
          </li>
          <li>
            <strong>Bouton ?</strong> : l’aide sur la page où vous êtes.
          </li>
        </ol>
      </>
    ),
    full: (
      <>
        <H>Détails utiles</H>
        <ul>
          <li>
            Au survol, chaque icône du dock montre le nom du module et une
            phrase qui explique à quoi il sert.
          </li>
          <li>
            Les modules que vous n’utilisez pas peuvent être masqués :{" "}
            <Path steps={["Réglages", "Ce poste", "Modules affichés"]} />.
            Situation, Journal et Aide restent toujours visibles. Masquer un
            module ne supprime aucune donnée.
          </li>
          <li>
            Si la connexion internet tombe, une puce <Ui>Hors ligne</Ui>{" "}
            apparaît. Vous pouvez continuer à travailler.
          </li>
          <li>
            Quand une nouvelle version est disponible, un bandeau le signale. En
            session temporaire, exportez avant de recharger la page.
          </li>
          <li>
            Le titre de l’onglet du navigateur affiche le nombre d’échéances
            dépassées, par exemple <code>(3)</code> : visible même quand vous
            êtes dans une autre fenêtre.
          </li>
          <li>
            Au clavier, la première pression sur <K>Tab</K> propose{" "}
            <Ui>Aller au contenu</Ui> pour sauter directement à la page.
          </li>
          <li>
            En bas du menu opérateur : la version, l’état hors ligne et le
            nombre de radios remises.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "session",
    group: "start",
    title: "Session, journaux et sauvegarde",
    icon: LockKeyhole,
    hue: 200,
    short: (
      <p>
        Une <strong>session</strong> correspond à un événement ; elle contient
        un ou plusieurs <strong>journaux</strong>. Vos données restent dans ce
        navigateur : chiffrées si vous avez choisi une phrase de récupération,
        sinon temporaires.
      </p>
    ),
    guide: (
      <>
        <H>Deux façons de garder les données</H>
        <Table
          head={["", "Sauvegarde chiffrée", "Session temporaire"]}
          rows={[
            [
              "Où ?",
              "Dans le navigateur, sous clé",
              "Seulement dans l’onglet ouvert",
            ],
            ["Fermer l’onglet", "Rien n’est perdu", "Tout est perdu"],
            [
              "Pour revenir",
              "Phrase de récupération",
              "Importer un fichier exporté",
            ],
            [
              "Barre du haut",
              <span className="pill ok">Chiffré</span>,
              <span className="pill warn">Temporaire</span>,
            ],
          ]}
        />
        <Note kind="warn">
          La phrase de récupération n’est enregistrée nulle part. Si vous
          l’oubliez, personne, pas même les auteurs d’orion aic, ne peut rouvrir
          la session. Gardez aussi des exports.
        </Note>
        <H>Travailler avec plusieurs journaux</H>
        <Steps>
          <li>Cliquez sur le titre du journal, en haut de l’écran.</li>
          <li>
            Choisissez un journal dans la liste pour y passer, ou{" "}
            <Ui>Nouveau journal</Ui> pour en créer un (par exemple un journal
            séparé pour l’exercice du lendemain).
          </li>
          <li>
            Le journal actif est celui que vous voyez et complétez ; les autres
            restent intacts.
          </li>
        </Steps>
        <H>Faire une pause ou finir</H>
        <ul>
          <li>
            <Ui>Verrouiller</Ui> (menu opérateur) : la session quitte l’écran et
            reste chiffrée sur le poste. Pour revenir : <Ui>Reprendre</Ui> et la
            phrase.
          </li>
          <li>
            <strong>Clôturer un journal</strong> :{" "}
            <Path steps={["Réglages", "Session et journal"]} />. Un journal
            clôturé se lit, se cherche, s’imprime et s’exporte, mais ne se
            modifie plus. On peut le rouvrir.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>Propriétés d’un journal</H>
        <Table
          head={["Champ", "Explication"]}
          rows={[
            [
              "Événement",
              "Le nom, seul champ obligatoire. Ex. « Crue de l’Arve ».",
            ],
            ["Organisation", "Ex. « PCi Carouge »."],
            ["Lieu / secteur", "Où se passe l’événement."],
            [
              "Référence",
              "Numéro d’événement ou de dossier, si vous en avez un.",
            ],
            [
              "Mode",
              "Exercice ou Intervention. Visible en haut de l’écran et sur les fiches imprimées.",
            ],
            [
              "Diffusion",
              "Interne ou Confidentiel, rappelé sur les documents.",
            ],
          ]}
        />
        <p>
          Tout se modifie dans{" "}
          <Path steps={["Réglages", "Session et journal"]} />, où vous changez
          aussi le nom de l’opérateur, la sauvegarde chiffrée, la clôture et la
          réouverture.
        </p>
        <H>Ce qui se passe en coulisses</H>
        <ul>
          <li>
            Chaque modification est sauvegardée un quart de seconde après la
            dernière frappe, brouillon compris.
          </li>
          <li>
            La même session sauvegardée ne peut pas être ouverte dans deux
            onglets à la fois.
          </li>
          <li>
            Un navigateur garde <strong>une</strong> session chiffrée. Si vous
            rejoignez une autre session sur un poste qui en a déjà une, la
            nouvelle reste temporaire : exportez-la régulièrement.
          </li>
          <li>
            L’application installée (sur l’écran d’accueil) a ses propres
            données, séparées de celles de l’onglet du navigateur.
          </li>
          <li>
            Effacer les données du navigateur efface la sauvegarde. Une
            sauvegarde sur le poste n’est pas une archive : exportez.
          </li>
        </ul>
        <H>Phrase oubliée</H>
        <p>
          Sur la page d’accueil, <Ui>Phrase perdue</Ui> permet d’effacer
          l’espace chiffré de ce navigateur (il faut taper <code>EFFACER</code>
          ). Les données ne reviennent alors que depuis une archive exportée, ou
          depuis un autre poste synchronisé qui a la session.
        </p>
        <H>Effacer la session</H>
        <p>
          <Path
            steps={["Réglages", "Session et journal", "Effacer la session"]}
          />{" "}
          supprime tout du poste. orion aic exige d’abord une archive récente de
          chaque journal, puis la saisie de <code>TERMINER</code>.
        </p>
        <H>Limites</H>
        <p>
          10 000 entrées par journal, 500 versions par entrée, 12 000 caractères
          par message, fichiers importés de 32 Mo au plus. Pas de pièces jointes
          (photos, PDF) : notez leur référence.
        </p>
      </>
    ),
  },

  // ---------------------------------------------------------------- modules
  {
    id: "situation",
    group: "modules",
    ...mod("situation", "Ouvrir la situation"),
    short: (
      <p>
        La page d’accueil : l’essentiel de l’événement sur un seul écran, pour
        comprendre la situation en dix secondes.
      </p>
    ),
    guide: (
      <>
        <H>Ce que vous y voyez</H>
        <ul>
          <li>
            <strong>Renseignements clés</strong> : les chiffres qui comptent
            (personnes évacuées, bâtiments touchés, hauteur d’eau…).
          </li>
          <li>
            <strong>Tableaux de situation</strong> : quatre textes courts,
            situation générale, dangers, intention, points ouverts.
          </li>
          <li>
            Les <strong>points ouverts du journal</strong> et les{" "}
            <strong>derniers messages</strong>.
          </li>
          <li>
            Les <strong>moyens</strong> par état, les <strong>présences</strong>
            , les <strong>radios</strong> remises.
          </li>
          <li>
            Les <strong>prochains rendez-vous</strong> avec leur compte à
            rebours, la <strong>météo</strong> et un aperçu du{" "}
            <strong>réseau des liens</strong>.
          </li>
        </ul>
        <H>Mettre à jour un renseignement clé</H>
        <Steps>
          <li>
            Cliquez sur <Ui>+</Ui> ou <Ui>−</Ui> à côté du chiffre pour
            l’ajuster d’un coup.
          </li>
          <li>
            Ou cliquez sur le renseignement pour saisir une valeur, une unité,
            une remarque.
          </li>
          <li>
            Pour en ajouter : <Ui>Ajouter</Ui>, ou choisissez parmi les
            renseignements <Ui>standards</Ui> proposés.
          </li>
        </Steps>
        <Example>
          <p>
            Un nouveau bus d’évacuation part du quartier des Acacias avec 14
            personnes : un clic sur <Ui>+</Ui> quatorze fois, ou un clic sur le
            chiffre pour taper directement 42.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Bon usage</H>
        <ul>
          <li>
            Écrivez les tableaux de situation en phrases courtes. Ils servent de
            base aux rapports et à la relève.
          </li>
          <li>
            Chaque tuile est cliquable : elle ouvre l’élément ou le module
            correspondant (un moyen, un message, le journal filtré…).
          </li>
          <li>
            Les points ouverts du journal sont les entrées dont le suivi est{" "}
            <Ui>À traiter</Ui> ou <Ui>En cours</Ui>.
          </li>
          <li>
            Les catégories de renseignements viennent des référentiels :{" "}
            <Path steps={["Réglages", "Référentiels"]} />. Vous pouvez aussi
            taper n’importe quel libellé.
          </li>
          <li>
            Avec la synchronisation, la page se met à jour en direct sur tous
            les postes.
          </li>
        </ul>
        <Note kind="tip">
          Affichée sur un grand écran ou un projecteur, la page Situation sert
          de tableau de bord pour les rapports de conduite.
        </Note>
      </>
    ),
  },
  {
    id: "journal",
    group: "modules",
    ...mod("journal", "Ouvrir le journal"),
    short: (
      <p>
        Le registre officiel : chaque information, décision ou mission y est
        notée, <strong>numérotée</strong> (#001, #002…) et{" "}
        <strong>horodatée</strong>. Rien ne disparaît sans laisser de trace.
      </p>
    ),
    guide: (
      <>
        <H>Consigner une entrée</H>
        <Steps>
          <li>
            Ouvrez le journal. Le formulaire <Ui>Nouvelle entrée</Ui> est prêt
            (sur téléphone : le bouton rond <Ui>+</Ui>).
          </li>
          <li>
            Choisissez la <strong>nature</strong> (Renseignement, Décision,
            Mission…) et la <strong>priorité</strong> (Normal, Important,
            Urgent).
          </li>
          <li>
            Écrivez le <strong>message</strong>. C’est le seul champ
            obligatoire.
          </li>
          <li>
            Si vous le savez : l’<strong>émetteur</strong> (les noms d’appel
            sont proposés dès les premières lettres), l’heure de l’événement, le
            lieu.
          </li>
          <li>
            <Ui>Enregistrer</Ui>, ou <K>⌘↵</K> / <K>Ctrl+↵</K>. L’entrée reçoit
            son numéro.
          </li>
        </Steps>
        <Example>
          <p>
            <span className="mono">14:05 · #012 · Renseignement · Urgent</span>
            <br />
            Émetteur : Patrouille Alpha. « L’Arve déborde au quai des Acacias,
            30 cm d’eau sur la route. »
          </p>
        </Example>
        <H>Suivre une mission jusqu’au bout</H>
        <Steps>
          <li>
            Pour une mission ou une demande, mettez le <strong>suivi</strong>{" "}
            sur <Ui>À traiter</Ui>, indiquez un <strong>responsable</strong> et
            une <strong>échéance</strong>.
          </li>
          <li>
            Quand la réponse arrive, ouvrez l’entrée et cliquez{" "}
            <Ui>Consigner une suite</Ui> : une quittance est préparée, qui cite
            l’entrée d’origine.
          </li>
          <li>
            À l’enregistrement, un bandeau propose de clore la mission :{" "}
            <Ui>Marquer terminé</Ui>.
          </li>
        </Steps>
        <Note kind="tip">
          Les <strong>modèles</strong> au-dessus du formulaire (Point de
          situation, Demande de moyens, Mission, Décision, Quittance, Contrôle
          de liaison) remplissent la nature, la priorité et un canevas à
          compléter.
        </Note>
        <H>Impression automatique</H>
        <p>
          Sous le formulaire, l’interrupteur <Ui>Impression automatique</Ui>{" "}
          envoie chaque entrée enregistrée à l’imprimante, en fiche A4, dès
          qu’elle est consignée.
        </p>
      </>
    ),
    full: (
      <>
        <H>Les champs d’une entrée</H>
        <Table
          head={["Groupe", "Champs"]}
          rows={[
            [
              "Essentiel",
              "Nature, priorité, message (obligatoire), heure de l’événement, émetteur",
            ],
            [
              "Transmission et lieu",
              "Canal, confirmation, destinataire, lieu / secteur, coordonnées (MN95), heure de réception",
            ],
            [
              "Conduite et suivi",
              "Mesure / décision / mission, suivi, responsable, échéance, moyens engagés / besoins",
            ],
            [
              "Compléments",
              "Référence / entrée liée, observations, mots-clés (20 au plus)",
            ],
            [
              "Automatique",
              "Numéro, auteur, heure d’enregistrement, historique des versions",
            ],
          ]}
        />
        <Table
          head={["Liste", "Valeurs"]}
          rows={[
            [
              "Nature",
              "Renseignement, Décision, Mission, Demande, Quittance, Observation, Relève",
            ],
            ["Priorité", "Normal, Important, Urgent"],
            ["Suivi", "Consigné, À traiter, En cours, Terminé, Annulé"],
            ["Canal", "Radio, Téléphone, Sur place, E-mail, Message, Autre"],
            ["Confirmation", "Non confirmé, Confirmé, À vérifier"],
          ]}
        />
        <H>Trois heures différentes</H>
        <p>
          L’<strong>événement</strong> (quand c’est arrivé), la{" "}
          <strong>réception</strong> (quand l’information vous est parvenue) et
          l’<strong>enregistrement</strong> (automatique). Exemple : la digue
          cède à 13:50, la patrouille l’annonce à 14:05, vous l’écrivez à 14:07.
          Les heures sont affichées à l’heure suisse.
        </p>
        <H>Modèles</H>
        <Table
          head={["Modèle", "Ce qu’il prépare"]}
          rows={[
            [
              "Point de situation",
              "Renseignement : situation, mesures prises, moyens engagés, besoins, prochain point",
            ],
            [
              "Demande de moyens",
              "Demande, À traiter, Important : moyens, quantité, lieu de livraison, délai, motif",
            ],
            [
              "Mission",
              "Mission, À traiter, mesure « Quittancer l’exécution au PC »",
            ],
            ["Décision", "Décision, En cours, Confirmé"],
            [
              "Quittance",
              "Quittance, Confirmé, référence « Suite de # » à compléter",
            ],
            ["Contrôle de liaison", "Observation, canal Radio, mot-clé radio"],
          ]}
        />
        <p>
          Si un message est déjà en cours de saisie, orion aic demande avant de
          le remplacer.
        </p>
        <H>Entrées liées et fil</H>
        <p>
          Une entrée en cite une autre avec son numéro dans{" "}
          <Ui>Référence / entrée liée</Ui> : <code>Suite de #003</code>,{" "}
          <code>#012, #014</code>. La ligne affiche alors <code>↳ #003</code>,
          et le détail montre le <strong>fil</strong> complet : demande →
          mission → quittance, dans l’ordre, cliquable.
        </p>
        <H>Échéances et alarme</H>
        <ul>
          <li>
            Un bandeau liste les échéances <strong>dépassées</strong> (rouge) et
            celles des <strong>15 prochaines minutes</strong> (orange).
          </li>
          <li>
            Actions directes : <Ui>+15 min</Ui> (reporte, avec un motif noté),{" "}
            <Ui>Terminé</Ui>, ou clic pour ouvrir l’entrée.
          </li>
          <li>
            L’icône cloche active une alarme sonore (deux bips) à chaque
            nouvelle échéance dépassée.
          </li>
          <li>Les échéances sont vérifiées toutes les 30 secondes.</li>
        </ul>
        <H>Modifier, annuler, supprimer</H>
        <ul>
          <li>
            <strong>Modifier</strong> (crayon) : tout se modifie. La version
            précédente est gardée (bouton <Ui>Versions</Ui>, ligne marquée{" "}
            <code>v2</code>). Le motif est facultatif.
          </li>
          <li>
            <strong>Annuler</strong> une information sans l’effacer : mettez le
            suivi sur <Ui>Annulé</Ui>. Elle reste lisible, barrée.
          </li>
          <li>
            <strong>Supprimer</strong> (corbeille) exige un motif (« Saisie en
            double »). Il reste une trace (numéro, heure, auteur, motif)
            consultable en bas du tableau. Le numéro n’est jamais réutilisé.
          </li>
        </ul>
        <Note kind="warn">
          Une archive exportée avant la suppression contient toujours l’entrée.
          Détruisez-la si nécessaire.
        </Note>
        <H>Retrouver une information</H>
        <ul>
          <li>
            Filtres : Tout, À suivre, Urgent, Décisions. Filtre par jour, tri,
            regroupement par jour.
          </li>
          <li>
            Recherche dans tous les champs, sans tenir compte des accents.
          </li>
          <li>
            Indicateurs : entrées, points à suivre, échéances dépassées,
            urgences, radios en service, état de l’archive.
          </li>
        </ul>
        <H>Rapport, relève, fiches</H>
        <ul>
          <li>
            <Ui>Rapport</Ui> : rapport de situation A4 sur 1 h, 4 h, 12 h, 24 h,
            tout ou une période libre (synthèse, faits marquants, décisions et
            missions, demandes, points ouverts, moyens, état radio, chronologie
            en option).
          </li>
          <li>
            <Ui>Relève</Ui> : résume ce qu’il faut transmettre (suites à donner,
            échéances dépassées, informations à confirmer, radios remises) et
            prépare une entrée de nature Relève.
          </li>
          <li>
            <Ui>Fiche A4</Ui> : une fiche par entrée, avec cases de visa et
            signature. Cochez plusieurs lignes pour imprimer plusieurs fiches.
          </li>
        </ul>
        <H>Impression automatique, en détail</H>
        <p>
          L’interrupteur sous le formulaire imprime chaque entrée consignée sur{" "}
          <strong>ce</strong> poste. Pour un poste d’impression central, activez
          aussi{" "}
          <Path
            steps={[
              "Réglages",
              "Ce poste",
              "Imprimer aussi les entrées des autres postes",
            ]}
          />{" "}
          : chaque entrée reçue par synchronisation y est imprimée. Voir aussi
          le sujet « Impression ».
        </p>
      </>
    ),
  },
  {
    id: "messages",
    group: "modules",
    ...mod("messages", "Ouvrir les messages"),
    short: (
      <p>
        La boîte de réception du PC : on y saisit chaque message qui arrive, tel
        quel, puis on en fait une synthèse claire pour le journal.
      </p>
    ),
    guide: (
      <>
        <MessageFlow />
        <H>Recevoir un message</H>
        <Steps>
          <li>
            <Ui>Nouveau message</Ui> (ou <K>⌘K</K> → « Nouveau message reçu »).
          </li>
          <li>
            Remplissez ce que vous savez : <Ui>De</Ui>, <Ui>À</Ui>,{" "}
            <Ui>Canal</Ui>, <Ui>Priorité</Ui>, <Ui>Catégorie</Ui>. Les valeurs
            courantes sont proposées en un clic ; vous pouvez toujours écrire
            autre chose.
          </li>
          <li>
            Écrivez l’<Ui>Objet</Ui> et le <Ui>Message</Ui>, mot pour mot si
            possible.
          </li>
          <li>
            <Ui>Enregistrer</Ui> : le message arrive dans la colonne{" "}
            <Ui>Nouveau</Ui>, et une pastille violette apparaît sur le dock.
          </li>
        </Steps>
        <H>Traiter un message</H>
        <States steps={["Nouveau", "En traitement", "Transmis", "Classé"]} />
        <Steps>
          <li>
            <Ui>Prendre en charge</Ui> : le message passe en traitement, les
            autres postes voient que quelqu’un s’en occupe.
          </li>
          <li>
            <Ui>Inscrire au journal</Ui> : une fenêtre de synthèse s’ouvre, déjà
            remplie. Raccourcissez, clarifiez, validez. Une entrée du journal
            est créée, reliée au message, qui passe à <Ui>Transmis</Ui>.
          </li>
          <li>
            <Ui>Classer</Ui> quand il n’y a plus rien à faire.
          </li>
        </Steps>
        <Example>
          <p>
            Message reçu : « Ici Patrouille Alpha pour PC Carouge, alors on est
            au quai, l’eau passe par-dessus, il y a trois voitures garées, on a
            besoin d’une pompe. » Synthèse au journal : « Quai des Acacias
            inondé, 3 véhicules menacés. Demande 1 motopompe. »
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Les champs</H>
        <Table
          head={["Champ", "Explication"]}
          rows={[
            [
              "De / À",
              "Émetteur et destinataire. Valeurs standards : PC front, PC arrière, cellules, police…",
            ],
            ["Canal", "Radio, téléphone, e-mail, messager, sur place, SMS…"],
            ["Priorité", "Pour faire ressortir l’urgent."],
            [
              "Catégorie",
              "Renseignement, demande, ordre / mission, compte rendu, alerte, quittance… en un clic, ou texte libre.",
            ],
            [
              "Objet",
              "Quelques mots pour reconnaître le message dans la liste.",
            ],
            ["Message", "Le texte, tel que reçu."],
            ["Lieu", "Où cela se passe. Il pourra être placé sur la carte."],
            [
              "Réponse attendue",
              "À cocher si l’émetteur attend un retour, avec une échéance.",
            ],
          ]}
        />
        <H>Toutes les actions</H>
        <ul>
          <li>
            <strong>Modèles</strong> : compte rendu, demande de moyens, alerte,
            information, quittance… préparent le texte.
          </li>
          <li>
            <strong>Tableau ou liste</strong> : glissez-déposez un message d’une
            colonne à l’autre, ou utilisez la vue en liste.
          </li>
          <li>
            <Ui>Inscrire tel quel</Ui> : crée l’entrée du journal sans passer
            par la synthèse, pour un message déjà clair.
          </li>
          <li>
            <Ui>Rouvrir</Ui> un message classé, le <strong>modifier</strong> ou
            le <strong>supprimer</strong>.
          </li>
          <li>
            <Ui>Fiche A4</Ui> : la formule de message imprimée. Pour imprimer
            chaque message dès sa saisie :{" "}
            <Path
              steps={[
                "Réglages",
                "Ce poste",
                "Imprimer chaque nouveau message reçu",
              ]}
            />
            .
          </li>
        </ul>
        <Note kind="info">
          Pourquoi deux étapes ? Le message garde la trace brute de ce qui a été
          dit ; le journal garde la version claire et officielle. Les deux
          restent reliés : de l’un, on retrouve l’autre en un clic.
        </Note>
        <p>
          Les valeurs standards (destinataires et émetteurs, catégories, canaux)
          se modifient dans <Path steps={["Réglages", "Référentiels"]} />.
        </p>
      </>
    ),
  },
  {
    id: "missions",
    group: "modules",
    ...mod("missions", "Ouvrir les missions"),
    short: (
      <p>
        Un tableau qui montre d’un coup d’œil tout ce qui reste à faire :
        missions, demandes et points à suivre, rangés par état.
      </p>
    ),
    guide: (
      <>
        <States
          steps={["À traiter", "En cours", "Terminé"]}
          extra={["Annulé"]}
        />
        <H>Faire avancer une mission</H>
        <Steps>
          <li>
            <Ui>Nouvelle mission / demande</Ui> : écrivez-la, choisissez un
            responsable et une échéance. Elle apparaît dans <Ui>À traiter</Ui>.
          </li>
          <li>
            Quand quelqu’un s’en charge, glissez la carte dans <Ui>En cours</Ui>
            .
          </li>
          <li>
            Besoin de plus de temps ? <Ui>+15 min</Ui> repousse l’échéance.
          </li>
          <li>
            Quand le compte rendu arrive : <Ui>Consigner une suite</Ui>, puis
            glissez la carte dans <Ui>Terminé</Ui>.
          </li>
        </Steps>
        <Note kind="info">
          Chaque carte est une entrée du journal. La déplacer change son suivi
          dans le journal, avec son historique.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Détails</H>
        <ul>
          <li>
            Filtres : par <strong>type</strong> (mission, demande…), par{" "}
            <strong>responsable</strong>, et <strong>en retard</strong>{" "}
            seulement.
          </li>
          <li>Une carte dont l’échéance est dépassée ressort en rouge.</li>
          <li>
            Les entrées simplement « consignées » (sans suivi) n’apparaissent
            pas ici : elles restent dans le journal.
          </li>
          <li>
            Un clic sur une carte ouvre l’entrée complète : texte, fil des
            entrées liées, versions.
          </li>
        </ul>
        <Example>
          <p>
            #015 « Équipe Bravo : poser des sacs de sable rue des Acacias,
            échéance 15:00 ». À 14:55 l’équipe a besoin d’un quart d’heure :{" "}
            <Ui>+15 min</Ui>. À 15:10, quittance reçue :{" "}
            <Ui>Consigner une suite</Ui>, et la carte passe à Terminé.
          </p>
        </Example>
      </>
    ),
  },
  {
    id: "map",
    group: "modules",
    ...mod("map", "Ouvrir la carte"),
    short: (
      <p>
        Une carte suisse (swisstopo) pour dessiner la situation : lieux touchés,
        zones, itinéraires, moyens. Survolez un objet pour voir tout ce qui lui
        est lié.
      </p>
    ),
    guide: (
      <>
        <H>Poser un signe</H>
        <Steps>
          <li>
            Choisissez l’outil <Ui>Point</Ui>.
          </li>
          <li>
            Choisissez un signe conventionnel de la protection civile, ou un
            marqueur simple.
          </li>
          <li>Cliquez sur la carte, à l’endroit voulu.</li>
          <li>
            Dans la fiche qui s’ouvre, donnez un nom (« Digue »), un calque, une
            remarque, puis <Ui>Enregistrer</Ui>.
          </li>
        </Steps>
        <H>Dessiner une zone ou un trajet</H>
        <Steps>
          <li>
            Outil <Ui>Zone</Ui> (surface) ou <Ui>Ligne</Ui> (trajet, déviation).
          </li>
          <li>
            Cliquez les points les uns après les autres, puis terminez comme
            indiqué à l’écran.
          </li>
          <li>Donnez un nom et une couleur dans la fiche.</li>
        </Steps>
        <H>Plusieurs cartes</H>
        <Steps>
          <li>
            Les onglets en haut de la carte : par exemple « Suivi général » et «
            Secteur Acacias (détail) ». Le <Ui>+</Ui> en ajoute une.
          </li>
          <li>
            Chaque carte garde son fond, son cadrage et ses calques masqués (
            <Ui>⋯</Ui> → <Ui>Enregistrer ce cadrage pour cette carte</Ui>).
          </li>
          <li>
            Un objet posé sur une carte n’apparaît que sur elle. Dans sa fiche,
            <Ui>Cartes</Ui> permet de le montrer sur d’autres cartes, ou sur{" "}
            <Ui>Toutes les cartes</Ui>.
          </li>
        </Steps>
        <H>Taille, rotation, texte</H>
        <ul>
          <li>
            Les signes sont posés <strong>sur fond transparent</strong>. Pour
            l’ancienne pastille ronde : <Ui>Pastille</Ui> dans la fiche.
          </li>
          <li>
            Sélectionnez un objet : tirez le <strong>coin</strong> pour
            l’agrandir, la <strong>poignée ronde</strong> pour le tourner. Ou
            dans la fiche, rubrique <Ui>Apparence</Ui> : taille S, M, L, XL,
            rotation, couleur, épaisseur et style du trait.
          </li>
          <li>
            Outil <Ui>Texte</Ui> : écrivez directement sur la carte, avec ou
            sans fond d’étiquette, dans la taille et la couleur voulues.
          </li>
          <li>
            Outil <Ui>Dessin</Ui> (crayon) : tracez à main levée, à la souris ou
            au doigt.
          </li>
        </ul>
        <H>Trouver un endroit</H>
        <ul>
          <li>
            <strong>Recherche d’adresse</strong> : tapez « Quai des Acacias,
            Carouge ».
          </li>
          <li>
            <Ui>Aller à</Ui> : des coordonnées MN95 (
            <code>2 499 800 / 1 115 900</code>) ou GPS (<code>46.19, 6.14</code>
            ).
          </li>
          <li>
            <Ui>Ma position</Ui> : centre la carte là où vous êtes (si
            l’appareil le permet).
          </li>
        </ul>
        <Example>
          <p>
            Une zone bleue « Zone inondée Acacias », un point « Digue », une
            ligne rouge « Déviation route de Veyrier ». La motopompe 2 est
            placée sur la digue depuis le module Moyens.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Fonds de carte</H>
        <p>
          swisstopo en couleur, en gris, en photo aérienne, en version nuit, et
          OpenStreetMap. Choisissez le plus lisible pour l’usage : gris pour
          faire ressortir vos dessins, aérien pour voir le terrain.
        </p>
        <H>Outils</H>
        <Table
          head={["Outil", "Usage"]}
          rows={[
            [
              "Point",
              "Un lieu : signe conventionnel civil (OFPP) ou marqueur simple.",
            ],
            ["Ligne", "Un trajet, une déviation, une limite."],
            ["Zone", "Une surface : zone inondée, périmètre de sécurité."],
            ["Texte", "Une étiquette écrite directement sur la carte."],
            ["Dessin", "Un trait à main levée (souris, doigt, stylet)."],
            ["Mesurer", "Une distance sur la carte."],
          ]}
        />
        <H>Travailler avec les objets</H>
        <ul>
          <li>
            <strong>Déplacer</strong> : glissez l’objet.
          </li>
          <li>
            <strong>Clic</strong> : ouvre sa fiche (nom, calque, signe, couleur,
            remarques, liens, supprimer).
          </li>
          <li>
            <strong>Survol</strong> : une carte d’aperçu montre tout ce qui y
            est lié : messages, entrées, moyens…
          </li>
          <li>
            <strong>Calques</strong> : affichez ou masquez des familles
            d’objets. Les calques proposés viennent des référentiels.
          </li>
          <li>
            <strong>Liste des objets</strong> : tous les objets dessinés, pour
            les retrouver vite.
          </li>
          <li>
            Sous le curseur, les <strong>coordonnées MN95</strong> s’affichent
            en direct.
          </li>
          <li>
            <strong>Vue par défaut</strong> : enregistrez le cadrage de
            l’événement pour y revenir en un clic.
          </li>
        </ul>
        <H>Tous les signes</H>
        <ul>
          <li>
            Les 268 <strong>signes conventionnels civils OFPP</strong>, par
            groupe.
          </li>
          <li>
            Plus d’une centaine de <strong>marqueurs simples</strong> : PC
            front, PC arrière, poste collecteur, place sinistrés, héliport,
            ambulance, barrage, déviation, point d’eau, électricité, dangers
            chimiques… Tapez un mot (« collecteur », « hélico ») pour les
            trouver.
          </li>
          <li>
            <Ui>Ajouter un signe</Ui> : une image à vous (PNG, SVG, JPEG, WebP).{" "}
            <Ui>Rendre le fond transparent</Ui> efface le fond uni ; le signe
            est ensuite partagé avec tous les postes.
          </li>
        </ul>
        <H>Importer et exporter</H>
        <ul>
          <li>
            <Ui>⋯</Ui> → <Ui>Importer</Ui> : un fichier KML, KMZ (Google Earth),
            GeoJSON ou GPX reçu d’un partenaire (police, pompiers, géomètre). Un
            aperçu montre ce qui sera ajouté, sur quelle carte et quel calque.
          </li>
          <li>
            Exporter : image PNG de chaque carte, GeoJSON, KML, GPX, depuis le{" "}
            <Ui>centre d’export</Ui>.
          </li>
        </ul>
        <H>Placer depuis un autre module</H>
        <p>
          Dans un moyen ou un message, le bouton <Ui>Placer sur la carte</Ui>{" "}
          ouvre la carte : le point posé est automatiquement relié à cet
          élément. Les positions citées dans les entrées ou les messages sont
          aussi proposées sur la carte comme <strong>objets fantômes</strong>,
          transparents : il suffit de les confirmer.
        </p>
        <Note kind="info">
          Les fonds de carte et la recherche d’adresse viennent d’internet
          (swisstopo, OpenStreetMap, geo.admin.ch). Sans connexion, le fond peut
          manquer, mais vos objets restent là.
        </Note>
      </>
    ),
  },
  {
    id: "resources",
    group: "modules",
    ...mod("resources", "Ouvrir les moyens"),
    short: (
      <p>
        La liste de tous les moyens, véhicules, équipes, matériel, et de leur
        état : disponible, alerté, en route, engagé…
      </p>
    ),
    guide: (
      <>
        <States
          steps={["Disponible", "Alerté", "En route", "Engagé", "De retour"]}
          extra={["Hors service"]}
        />
        <H>Ajouter un moyen</H>
        <Steps>
          <li>Ajoutez un moyen.</li>
          <li>
            Donnez une désignation (« Motopompe 2 »). Le reste (type,
            organisation, effectif…) est facultatif.
          </li>
          <li>
            <Ui>Enregistrer</Ui>.
          </li>
        </Steps>
        <H>Changer l’état</H>
        <Steps>
          <li>
            Glissez la carte du moyen dans la colonne voulue, par exemple de «
            En route » à « Engagé ».
          </li>
          <li>
            Si l’option est active, le changement est noté automatiquement au
            journal (« Motopompe 2 : En route → Engagé »).
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Toutes les possibilités</H>
        <ul>
          <li>
            <strong>Tableau par état</strong> ou <strong>liste</strong>, avec
            des filtres.
          </li>
          <li>
            Le <strong>total du personnel</strong> engagé est calculé.
          </li>
          <li>
            <strong>Consigner les changements d’état au journal</strong> : une
            option à activer, pour garder la trace de chaque mouvement sans rien
            taper.
          </li>
          <li>
            <Ui>Placer sur la carte</Ui> : le moyen apparaît sur la carte, relié
            à sa fiche.
          </li>
          <li>
            <Ui>Demander des moyens</Ui> : prépare une demande de moyens.
          </li>
          <li>
            <strong>Impression A4</strong> du tableau des moyens.
          </li>
          <li>
            Types de moyens et organisations proposés viennent des référentiels
            ; tout texte libre est accepté.
          </li>
        </ul>
        <Note kind="tip">
          Utilisez <Ui>Hors service</Ui> pour un véhicule en panne plutôt que de
          le supprimer : il reste dans l’historique, et on sait pourquoi il
          manque.
        </Note>
      </>
    ),
  },
  {
    id: "team",
    group: "modules",
    ...mod("team", "Ouvrir l’équipe"),
    short: (
      <p>
        Qui fait quoi et qui est là : les postes (PC front, PC arrière,
        cellules) et les personnes, avec leur fonction et leur présence.
      </p>
    ),
    guide: (
      <>
        <H>Mettre en place l’équipe</H>
        <Steps>
          <li>
            Pas envie de tout créer ? La <strong>structure type</strong> crée en
            un clic les postes et cellules habituels (PC front, PC arrière,
            cellules).
          </li>
          <li>
            Ajoutez une personne : grade, nom, fonction, nom d’appel, téléphone.
            Seul le nom compte, le reste est facultatif.
          </li>
          <li>
            Dans l’organigramme, glissez la personne dans son poste ou sa
            cellule.
          </li>
          <li>
            Mettez à jour sa présence : <Ui>Présent</Ui>, <Ui>En pause</Ui>,{" "}
            <Ui>Absent</Ui>, <Ui>Relevé</Ui>.
          </li>
        </Steps>
        <Example>
          <p>
            Sgt Muller, opérateur journal, nom d’appel « PC Carouge », dans la
            cellule situation du PC arrière. À 18:00 il est relevé : un clic sur{" "}
            <Ui>Relevé</Ui>, son remplaçant passe <Ui>Présent</Ui>.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Détails</H>
        <ul>
          <li>
            Deux vues : l’<strong>organigramme</strong> (glisser-déposer) et la{" "}
            <strong>liste</strong>.
          </li>
          <li>
            Pour chaque personne, des <strong>horaires</strong> peuvent être
            notés (arrivée, départ, relève).
          </li>
          <li>
            Grades, fonctions et types de postes sont proposés depuis les
            référentiels, et le texte libre est toujours accepté.
          </li>
          <li>
            Une personne est reliée automatiquement à son poste, à son nom
            d’appel et donc à la radio qui lui est remise.
          </li>
          <li>
            <strong>Impression</strong> de la liste de l’équipe en A4.
          </li>
        </ul>
        <Note kind="info">
          Les présences alimentent la page Situation : on voit tout de suite
          combien de personnes sont disponibles.
        </Note>
      </>
    ),
  },
  {
    id: "radio",
    group: "modules",
    ...mod("radio", "Ouvrir le réseau radio"),
    short: (
      <p>
        Le plan du réseau radio Polycom : les groupes, les noms d’appel, les
        radios, qui a quelle radio, et les contrôles de liaison.
      </p>
    ),
    guide: (
      <>
        <H>Préparer le réseau</H>
        <Steps>
          <li>
            <strong>Groupes</strong> : créez les groupes de conversation, par
            exemple <code>G101</code> « PCi Conduite » et <code>G102</code> «
            PCi Engagement Arve ».
          </li>
          <li>
            <strong>Noms d’appel</strong> : « PC Carouge », « Patrouille Alpha
            », « Équipe Bravo »… avec leur groupe principal.
          </li>
          <li>
            <strong>Terminaux</strong> : les radios. <Ui>Série</Ui> crée d’un
            coup <code>R-01</code> à <code>R-20</code>.
          </li>
        </Steps>
        <H>Remettre et reprendre une radio</H>
        <Steps>
          <li>
            Sur un terminal : <Ui>Remettre</Ui>. Choisissez le nom d’appel,
            notez le détenteur (grade, nom) et les accessoires.
          </li>
          <li>Imprimez la quittance de remise et faites-la signer.</li>
          <li>
            Au retour : <Ui>Retour</Ui>, état de la radio, accessoires rendus ou
            non.
          </li>
        </Steps>
        <H>Contrôler les liaisons</H>
        <p>
          Pour chaque station, notez l’audibilité : <strong>THREE</strong>{" "}
          (bon), <strong>TWO</strong> (faible mais compréhensible),{" "}
          <strong>ONE</strong> (insuffisant) ou pas de liaison. Le{" "}
          <Ui>Contrôle général</Ui> appelle toutes les stations dans l’ordre, un
          clic par station.
        </p>
        <Note kind="info">
          Un nom d’appel désigne{" "}
          <strong>une fonction, jamais une personne</strong>. Quand quelqu’un
          est relevé, le nom d’appel reste.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Groupes et canaux</H>
        <Table
          head={["Champ", "Détail"]}
          rows={[
            ["N°", "Ex. G101 (groupe), D481 (mode direct), R395 (relais)"],
            ["Mode", "Groupe (TKG), Direct (DMO), Relais"],
            ["Désignation", "Ex. « PCi Conduite »"],
            [
              "Emploi",
              "Conduite, Engagement, Logistique, Coordination, Appel, Réserve",
            ],
          ]}
        />
        <p>
          Un groupe utilisé par un contrôle de liaison ne peut pas être
          supprimé.
        </p>
        <H>Noms d’appel</H>
        <p>
          Nom d’appel (unique), fonction, section, groupe principal, groupe de
          secours, remarques. Le <strong>schéma de liaisons</strong> affiche une
          colonne par groupe avec ses stations : témoin vert si une radio leur
          est remise, note du dernier contrôle, et en pointillé les stations qui
          l’ont en secours.
        </p>
        <H>Terminaux</H>
        <Table
          head={["Champ", "Détail"]}
          rows={[
            ["N° interne", "Ex. R-01, unique"],
            ["RFSI", "Identifiant Polycom du terminal"],
            ["Modèle", "TPH900, TPH700, TPM700, G2 Smart ou autre"],
            ["Type", "Portatif, Véhicule, Fixe"],
            ["N° de série", "Libre"],
            ["État", "Opérationnel, À recharger, Défectueux, Manquant"],
          ]}
        />
        <ul>
          <li>
            Un terminal déjà remis une fois ne peut pas être supprimé :
            passez-le en Défectueux ou Manquant.
          </li>
          <li>
            <Ui>Non rendues</Ui> n’affiche que les radios encore dehors :
            pratique en fin d’engagement.
          </li>
          <li>
            Une radio remise depuis <strong>8 heures ou plus</strong> porte le
            badge <code>&gt; 8 h</code> : pensez à la batterie.
          </li>
        </ul>
        <H>Remise et retour</H>
        <ul>
          <li>
            Remise : terminal, heure, nom d’appel (fonction et section se
            remplissent), détenteur, accessoires (batterie de rechange,
            microtel, adaptateur FUGA, chargeur, antenne, housse), état de la
            batterie, remarques.
          </li>
          <li>
            Une radio Défectueuse ou Manquante ne peut pas être remise ; une
            radio déjà remise doit d’abord être rendue.
          </li>
          <li>
            Retour : heure, état, retour complet ou non (sinon la liste des
            accessoires remis est notée). Une radio Manquante rappelle
            d’annoncer la perte pour la faire bloquer.
          </li>
          <li>
            Options : <Ui>Consigner au journal</Ui> (cochée par défaut) et{" "}
            <Ui>Imprimer la quittance</Ui>.
          </li>
          <li>
            L’onglet <Ui>Remises</Ui> garde tout l’historique.
          </li>
        </ul>
        <H>Quittance de remise A4</H>
        <p>
          Terminal, détenteur, remise, accessoires avec une case chacun, zone de
          retour et trois signatures (détenteur à la remise, remettant,
          détenteur au retour).
        </p>
        <H>Contrôle général</H>
        <p>
          Choisissez le groupe, puis pour chaque station cliquez <Ui>3</Ui>,{" "}
          <Ui>2</Ui>, <Ui>1</Ui> ou <Ui>✕</Ui> (un second clic annule). « Hors
          réseau » signale une station sans radio. <Ui>Enregistrer</Ui> crée un
          contrôle par station notée et, en option, une entrée de synthèse au
          journal (priorité Important si une liaison est mauvaise).
        </p>
        <H>Étiquettes QR et scanner</H>
        <Steps>
          <li>
            <Ui>Étiquettes</Ui> : planche A4 de 21 étiquettes avec QR code,
            numéro, modèle et RFSI. Collez-en une sur chaque radio.
          </li>
          <li>
            <Ui>Scanner</Ui> : la caméra lit l’étiquette. Ou scannez avec
            l’appareil photo du téléphone, ou tapez le numéro (<code>R-04</code>
            ).
          </li>
          <li>
            orion aic ouvre directement la bonne action : retour si la radio est
            dehors, remise si elle est disponible.
          </li>
        </Steps>
        <p>
          La caméra ne sert qu’à lire le code, sur l’appareil ; aucune image
          n’est gardée ni envoyée.
        </p>
        <H>Plan A4</H>
        <p>
          <Ui>Plan A4</Ui> imprime en paysage le plan du réseau, les groupes,
          les terminaux, les remises et les contrôles.
        </p>
        <Note kind="warn">
          Le plan documente le réseau ; il ne commande pas les radios. Les vrais
          numéros de groupes et RFSI viennent du plan de flotte cantonal. Ceux
          de la démonstration sont fictifs.
        </Note>
      </>
    ),
  },
  {
    id: "contacts",
    group: "modules",
    ...mod("contacts", "Ouvrir les contacts"),
    short: (
      <p>
        L’annuaire de l’événement : partenaires, autorités, fournisseurs… et les
        numéros d’urgence suisses en un clic.
      </p>
    ),
    guide: (
      <>
        <H>Commencer</H>
        <Steps>
          <li>
            Un clic ajoute les <strong>numéros d’urgence suisses</strong>.
          </li>
          <li>
            Ajoutez vos contacts : nom, organisation, catégorie, téléphone,
            e-mail… (seul le nom est requis).
          </li>
          <li>Marquez les plus utilisés en favoris : ils restent en haut.</li>
          <li>
            Sur un téléphone, touchez le numéro pour appeler. Sur ordinateur,
            copiez-le en un clic.
          </li>
        </Steps>
        <Table
          head={["Numéro", "Pour"]}
          rows={[
            [<strong>112</strong>, "Numéro d’urgence européen"],
            [<strong>117</strong>, "Police"],
            [<strong>118</strong>, "Pompiers"],
            [<strong>144</strong>, "Ambulance, urgences sanitaires"],
            [<strong>1414</strong>, "Rega, sauvetage par hélicoptère"],
            [<strong>145</strong>, "Tox Info Suisse, intoxications"],
            [<strong>143</strong>, "La Main Tendue, aide par téléphone"],
          ]}
        />
      </>
    ),
    full: (
      <>
        <H>Détails</H>
        <ul>
          <li>
            <strong>Importer</strong> des contacts depuis un fichier vCard (
            <code>.vcf</code>) ou CSV.
          </li>
          <li>
            <strong>Exporter</strong> l’annuaire en CSV, ou l’
            <strong>imprimer</strong> en A4.
          </li>
          <li>Les catégories proposées viennent des référentiels.</li>
          <li>
            Un contact dont le nom est aussi l’émetteur d’un message ou le
            responsable d’une mission leur est relié automatiquement.
          </li>
        </ul>
        <Note kind="warn">
          En cas d’urgence vitale, appelez directement le numéro depuis un
          téléphone. orion aic aide à le retrouver, il ne remplace pas l’appel.
        </Note>
      </>
    ),
  },
  {
    id: "weather",
    group: "modules",
    ...mod("weather", "Ouvrir la météo"),
    short: (
      <p>
        La météo du lieu de l’intervention : prévisions MétéoSuisse,
        observations faites sur place et niveaux d’alerte.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            <strong>Choisir le lieu</strong> : recherche, centre de la carte, ou
            votre position.
          </li>
          <li>
            <strong>Demander les prévisions</strong> : elles ne sont chargées
            que quand vous le voulez.
          </li>
          <li>
            Lire le <strong>graphique sur 48 heures</strong> (température,
            pluie, vent) et les <strong>3 prochains jours</strong>.
          </li>
          <li>
            Noter une <strong>observation sur place</strong> et, si utile, la
            consigner au journal.
          </li>
          <li>
            Noter une <strong>alerte</strong> avec son degré, de 1 à 5.
          </li>
        </Steps>
        <Example>
          <p>
            Observation à 16:20 : « Pluie forte continue, l’Arve a monté de 20
            cm en une heure au pont de Carouge. » Consignée au journal, elle
            sera dans le prochain rapport.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Degrés d’alerte</H>
        <Table
          head={["Degré", "Signification"]}
          rows={[
            ["1", "Pas de danger ou danger faible"],
            ["2", "Danger limité"],
            ["3", "Danger marqué"],
            ["4", "Fort danger"],
            ["5", "Très fort danger"],
          ]}
        />
        <H>D’où viennent les données</H>
        <ul>
          <li>
            Les prévisions viennent du modèle MétéoSuisse ICON, via le service
            Open-Meteo. Seules les coordonnées du lieu sont envoyées, rien
            d’autre.
          </li>
          <li>
            Sans internet, pas de prévisions ; les observations et alertes
            notées restent disponibles.
          </li>
          <li>
            Un lien ouvre le site de MétéoSuisse pour les alertes officielles.
          </li>
        </ul>
        <H>Prévisions reçues : la météo d’avant</H>
        <ul>
          <li>
            Chaque prévision chargée est <strong>gardée dans la session</strong>{" "}
            (au plus une toutes les 5 minutes) et partagée avec les postes
            synchronisés : la rubrique <Ui>Prévisions reçues</Ui> les liste, un
            clic affiche celle de l’heure choisie.
          </li>
          <li>
            Dans la <Ui>machine à remonter le temps</Ui>, la météo montre
            automatiquement la dernière prévision reçue avant l’heure affichée :
            « à 14 h, on annonçait 40 mm ».
          </li>
        </ul>
        <Note kind="warn">
          Les alertes officielles sont celles de MétéoSuisse et des autorités.
          orion aic aide à les noter et à les partager, il ne les remplace pas.
        </Note>
      </>
    ),
  },
  {
    id: "agenda",
    group: "modules",
    ...mod("agenda", "Ouvrir l’agenda"),
    short: (
      <p>
        Le rythme de conduite : les prochains rapports, orientations et relèves,
        avec un compte à rebours pour ne rien oublier.
      </p>
    ),
    guide: (
      <>
        <H>Planifier</H>
        <Steps>
          <li>
            Ajoutez un rendez-vous : un titre, un type (rapport, orientation,
            relève…), une heure. Le lieu et les remarques sont facultatifs.
          </li>
          <li>
            Pour un rendez-vous qui revient : <Ui>Planifier un rythme</Ui>, par
            exemple un rapport toutes les 2 heures dès 08:00.
          </li>
          <li>Le compte à rebours s’affiche ici et sur la page Situation.</li>
          <li>
            Une fois le rendez-vous fait : <Ui>Marquer tenu</Ui>, et le
            consigner au journal.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Détails</H>
        <ul>
          <li>Les types de rendez-vous proposés viennent des référentiels.</li>
          <li>
            <strong>Impression</strong> de l’agenda en A4, pour l’afficher au
            mur du PC.
          </li>
          <li>
            Chaque rendez-vous peut être relié à des personnes, des postes ou
            des entrées du journal.
          </li>
        </ul>
        <Example>
          <p>
            Rythme : rapport de conduite à 08:00, 10:00, 12:00… Relève à 18:00.
            À 11:50, la page Situation affiche « Rapport de conduite dans 10 min
            ».
          </p>
        </Example>
      </>
    ),
  },
  {
    id: "network",
    group: "modules",
    ...mod("network", "Ouvrir le réseau des liens"),
    short: (
      <p>
        Toutes les informations et leurs liens, dessinées comme un réseau de
        neurones : chaque point est un élément, chaque trait un lien.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            <strong>Survolez</strong> un point : ses voisins s’allument et un
            aperçu s’affiche.
          </li>
          <li>
            <strong>Cliquez</strong> : un panneau montre tous ses liens. Vous
            pouvez en ajouter ou en retirer.
          </li>
          <li>
            <strong>Filtrez</strong> par type (messages, entrées, moyens,
            personnes…) pour y voir plus clair.
          </li>
          <li>
            <strong>Cherchez</strong> un élément par son nom, puis{" "}
            <Ui>Recentrer</Ui> pour revenir à la vue d’ensemble.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>À quoi ça sert</H>
        <ul>
          <li>
            Chaque couleur correspond à un type d’élément, la même partout dans
            orion aic.
          </li>
          <li>
            Repérer ce qui est au centre de l’événement : un lieu relié à
            beaucoup de messages et de moyens.
          </li>
          <li>
            Repérer ce qui est isolé : un message que personne n’a encore relié
            à rien.
          </li>
          <li>
            Le graphe bouge doucement. Si l’animation gêne :{" "}
            <Path steps={["Réglages", "Ce poste", "Animations", "Réduites"]} />.
          </li>
        </ul>
      </>
    ),
  },

  {
    id: "trace",
    group: "modules",
    ...mod("trace", "Ouvrir la traçabilité"),
    short: (
      <p>
        Qui a fait quoi, et quand : chaque création, modification et suppression
        est notée avec son auteur, l’heure et le détail. Rien ne s’efface. On
        peut aussi comparer deux moments, retrouver les points de situation
        figés et les registres des exports et des présentations.
      </p>
    ),
    guide: (
      <>
        <H>Retrouver qui a fait quoi</H>
        <Steps>
          <li>
            Ouvrez <Ui>Traçabilité</Ui> dans la barre de gauche (ou <K>⌘K</K> →
            « Traçabilité »).
          </li>
          <li>
            L’onglet <Ui>Qui a fait quoi</Ui> liste tous les changements, du
            plus récent au plus ancien, groupés par heure.
          </li>
          <li>
            Filtrez : cliquez une <strong>personne</strong>, choisissez un{" "}
            <strong>module</strong>, un type d’action ou une période, ou tapez
            un mot (un nom, une valeur, un lieu).
          </li>
          <li>
            Cliquez le nom d’un élément pour l’ouvrir, ou{" "}
            <Ui>Voir l’opération à ce moment</Ui> pour tout revoir tel que
            c’était.
          </li>
        </Steps>
        <H>L’historique d’un seul élément</H>
        <p>
          Chaque fiche (moyen, message, objet de la carte, personne…) montre en
          bas : « Créé par … le … · modifié par … il y a 5 min ». Le bouton{" "}
          <Ui>Historique</Ui> ouvre toutes ses versions, avec ce qui a changé
          (ancienne valeur barrée, nouvelle valeur surlignée).
        </p>
        <Example>
          <p>
            Qui a déplacé le PC front ? Ouvrez l’objet sur la carte →{" "}
            <Ui>Historique</Ui> : « Cartographe a modifié Position / tracé à
            09:05 ».
          </p>
        </Example>
        <H>Restaurer une ancienne version</H>
        <p>
          Dans l’historique d’un élément, <Ui>Restaurer cette version</Ui> remet
          ses anciennes valeurs. Un élément supprimé peut revenir ainsi. La
          restauration est elle-même notée, avec votre nom : l’historique ne
          perd jamais rien.
        </p>
      </>
    ),
    full: (
      <>
        <H>Ce qui est tracé</H>
        <ul>
          <li>
            Tout ce qui se modifie dans orion aic : journal (ses versions et
            suppressions), messages, missions, carte (objets, cartes, signes
            personnalisés), moyens, équipe et postes, réseau radio, contacts,
            météo (observations, alertes, prévisions reçues), agenda,
            renseignements clés, tableaux de situation, liens, référentiels,
            propriétés du journal, points figés, exports et présentations.
          </li>
          <li>
            « Qui » est le nom d’opérateur déclaré sur le poste (menu en haut à
            droite). Il n’est pas signé : chaque poste doit utiliser son vrai
            nom ou sa fonction.
          </li>
          <li>
            Plusieurs petites retouches d’une même personne sur le même élément
            en moins de 20 secondes comptent comme une seule version.
          </li>
          <li>
            L’historique voyage avec la session : il est synchronisé entre les
            postes et inclus dans l’archive <code>.orionaic</code>.
          </li>
          <li>
            Les données créées avant cette version d’orion aic gardent leur date
            de création et leur dernière modification ; leur historique complet
            commence au premier changement suivant.
          </li>
        </ul>
        <H>Les onglets</H>
        <Table
          head={["Onglet", "Contenu"]}
          rows={[
            [
              "Qui a fait quoi",
              "Tous les changements, filtres par personne, module, action, période, recherche",
            ],
            [
              "Comparer",
              "Ce qui a été ajouté, modifié, supprimé entre deux moments, par module ; cartes côte à côte ; impression",
            ],
            [
              "Points figés",
              "Les moments nommés : revoir, comparer, présenter, exporter",
            ],
            [
              "Exports",
              "Registre des fichiers produits : qui, quand, quoi, empreinte ; vérifier un document",
            ],
            ["Présentations", "Qui a présenté, à qui, quand, quelle version"],
          ]}
        />
      </>
    ),
  },
  // ---------------------------------------------------------------- together
  {
    id: "links",
    group: "together",
    title: "Tout est relié",
    icon: Link2,
    hue: 285,
    short: (
      <p>
        Dans orion aic, tout est relié : un message, l’entrée du journal qui en
        résulte, le moyen engagé et le point sur la carte se retrouvent les uns
        depuis les autres.
      </p>
    ),
    guide: (
      <>
        <LinksFigure />
        <H>Voir les liens</H>
        <ul>
          <li>
            Chaque fiche a une rubrique <Ui>Liens</Ui>. Chaque lien y est une
            petite pastille.
          </li>
          <li>
            <strong>Survol</strong> d’une pastille : un aperçu de l’élément.{" "}
            <strong>Clic</strong> : il s’ouvre.
          </li>
        </ul>
        <H>Ajouter un lien à la main</H>
        <Steps>
          <li>
            Dans la fiche, cliquez <Ui>Lier</Ui>.
          </li>
          <li>Cherchez l’élément à relier en tapant quelques lettres.</li>
          <li>
            Si vous voulez, précisez la nature du lien (« engagé sur », «
            concerne »…), puis validez.
          </li>
          <li>
            Pour retirer un lien : le <Ui>×</Ui> de sa pastille.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Liens automatiques</H>
        <p>
          orion aic crée seul les liens évidents. Vous n’avez rien à faire :
        </p>
        <Table
          head={["Quand…", "… ces éléments sont reliés"]}
          rows={[
            [
              "Le même nom d’appel apparaît",
              "Personne, radio, entrées et messages qui l’utilisent",
            ],
            [
              "Un émetteur, destinataire ou responsable porte le nom d’une personne, d’un poste, d’un moyen ou d’un contact",
              "L’entrée ou le message et cet élément",
            ],
            ["Une entrée cite #012", "Les deux entrées"],
            [
              "Un message est inscrit au journal",
              "Le message et l’entrée créée",
            ],
            ["Une personne est membre d’un poste", "La personne et le poste"],
            ["Un nom d’appel a un groupe radio", "Le nom d’appel et le groupe"],
            ["Une radio est remise", "Le terminal et son détenteur"],
          ]}
        />
        <Note kind="info">
          Un lien automatique vient des données elles-mêmes : pour le faire
          disparaître, modifiez le champ qui le crée. Quand on supprime un
          élément, ses liens manuels disparaissent avec lui.
        </Note>
      </>
    ),
  },
  {
    id: "sync",
    group: "together",
    title: "Synchronisation entre postes",
    icon: Wifi,
    hue: 190,
    short: (
      <p>
        Plusieurs ordinateurs, tablettes ou téléphones travaillent sur la même
        session, en direct. Pas de compte : un <strong>code de session</strong>{" "}
        suffit, et tout est chiffré.
      </p>
    ),
    guide: (
      <>
        <SyncFlow />
        <H>Sur le premier poste : partager</H>
        <Steps>
          <li>
            <Path steps={["Menu opérateur", "Synchronisation"]} />, ou un clic
            sur la puce <Ui>Seul</Ui> en haut.
          </li>
          <li>
            <Ui>Créer un code de session</Ui>. Un code s’affiche, du type{" "}
            <code>ABCD-EFGH-JKMN-PQRS</code>, avec un QR code.
          </li>
          <li>
            Donnez le code aux autres postes, ou <Ui>Copier le lien</Ui>.
          </li>
        </Steps>
        <H>Sur les autres postes : rejoindre</H>
        <Steps>
          <li>
            Ouvrez <a href={SITE}>orionaic.xyz</a> → <Ui>Rejoindre</Ui>. (Ou
            scannez le QR code avec le téléphone : le code est déjà rempli.)
          </li>
          <li>Tapez le code et votre nom ou votre fonction.</li>
          <li>
            Si vous voulez garder la session sur ce poste, cochez{" "}
            <Ui>Sauvegarde chiffrée sur ce poste</Ui> et choisissez une phrase.
          </li>
          <li>
            <Ui>Rejoindre la session</Ui>. La session arrive dès qu’un poste qui
            l’a est en ligne.
          </li>
        </Steps>
        <p>
          En haut, la puce indique <Ui>Seul</Ui>, <Ui>3 postes</Ui> (avec les
          initiales de chacun ; au survol, qui est sur quel module) ou{" "}
          <Ui>Reconnexion</Ui>.
        </p>
        <Note kind="warn">
          Le code est un <strong>mot de passe</strong> : il ouvre toute la
          session. Transmettez-le de vive voix, sur papier ou par un canal sûr,
          jamais sur un canal ouvert.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Ce qui est synchronisé</H>
        <p>
          Tout le contenu : journaux et entrées, messages, carte, moyens,
          équipe, radio, contacts, météo, agenda, liens, référentiels. Ce qui
          reste propre à chaque poste : les <strong>réglages du poste</strong>{" "}
          (thème, modules affichés, impression automatique).
        </p>
        <H>Hors ligne</H>
        <p>
          Chaque poste garde une copie complète. Si la liaison tombe, on
          continue à travailler normalement ; au retour de la connexion, les
          postes s’échangent ce qui a changé.
        </p>
        <H>Si deux postes modifient la même chose</H>
        <ul>
          <li>
            Une <strong>entrée du journal</strong> modifiée des deux côtés garde
            les deux versions dans son historique : rien n’est perdu.
          </li>
          <li>Pour le reste, la modification la plus récente l’emporte.</li>
          <li>Une suppression l’emporte sur une modification plus ancienne.</li>
          <li>
            Si deux entrées reçoivent le même numéro en même temps (hors ligne
            par exemple), la plus ancienne garde son numéro ; l’autre est
            renumérotée.
          </li>
        </ul>
        <H>Sécurité</H>
        <ul>
          <li>
            Chiffrement de bout en bout AES-256-GCM, avec une clé tirée du code
            de session. Le code ne quitte jamais les postes.
          </li>
          <li>
            Le serveur relais ne voit qu’un identifiant de salle haché et des
            messages illisibles. Il ne stocke rien ; quand le dernier poste
            part, la salle disparaît.
          </li>
          <li>
            La page doit être en https : sinon le chiffrement est indisponible
            et orion aic le signale.
          </li>
          <li>
            Le code évite les caractères qui se confondent (0 et O, 1 et I ou L)
            : moins d’erreurs de lecture.
          </li>
        </ul>
        <H>Sans internet : le réseau local</H>
        <Steps>
          <li>
            Sur un ordinateur du PC (le « poste serveur »), avec le code source
            d’orion aic, lancez <code>npm run lan</code>.
          </li>
          <li>
            Il affiche une adresse du type{" "}
            <code>https://192.168.1.20:4443</code> et l’
            <strong>empreinte</strong> du certificat.
          </li>
          <li>
            Sur les autres postes du même Wi-Fi ou réseau câblé, ouvrez cette
            adresse. Le navigateur signale un certificat non reconnu : vérifiez
            que l’empreinte est la même, puis acceptez (une seule fois).
          </li>
          <li>
            Utilisez ensuite le code de session comme d’habitude. Tout reste
            dans le bâtiment.
          </li>
        </Steps>
        <Note kind="info">
          Le Bluetooth n’est pas utilisable : les navigateurs ne le permettent
          pas pour ce genre d’échange. Utilisez le réseau local.
        </Note>
        <H>Autres réglages</H>
        <ul>
          <li>
            <Path steps={["Réglages", "Synchronisation"]} /> montre l’état
            (Connecté, Reconnexion…), les autres postes et leur module, l’heure
            du dernier échange.
          </li>
          <li>
            <Ui>Rejoindre avec un code</Ui>, depuis une session déjà ouverte,
            fusionne cette session avec celle des autres postes.
          </li>
          <li>
            <Ui>Arrêter sur ce poste</Ui> coupe la synchronisation ici seulement
            ; les autres continuent.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "print",
    group: "together",
    title: "Impression",
    icon: Printer,
    hue: 30,
    short: (
      <p>
        Tout s’imprime en A4 : fiches de message, rapports, plans, tableaux.
        orion aic peut même imprimer chaque nouvelle entrée automatiquement.
      </p>
    ),
    guide: (
      <>
        <H>Imprimer un document</H>
        <Steps>
          <li>
            Cliquez le bouton imprimante ou <Ui>Fiche A4</Ui> de l’élément.
          </li>
          <li>Un aperçu montre les vraies pages.</li>
          <li>
            <Ui>Imprimer</Ui> (imprimante), ou <Ui>PDF</Ui> pour un fichier.
          </li>
        </Steps>
        <H>Impression automatique</H>
        <Steps>
          <li>
            Dans le journal, activez l’interrupteur{" "}
            <Ui>Impression automatique</Ui> sous le formulaire (ou <K>⌘K</K> → «
            Activer l’impression automatique »).
          </li>
          <li>
            Pour plus d’options :{" "}
            <Path steps={["Réglages", "Ce poste", "Impression automatique"]} />.
          </li>
        </Steps>
        <Table
          head={["Option", "Effet"]}
          rows={[
            [
              "Imprimer chaque nouvelle entrée du journal",
              "La fiche A4 part dès l’enregistrement, sur ce poste.",
            ],
            [
              "Imprimer aussi les entrées des autres postes",
              "Pour un poste d’impression central : les entrées reçues par synchronisation sont imprimées ici.",
            ],
            [
              "Imprimer chaque nouveau message reçu",
              "Une formule de message A4 pour chaque message saisi.",
            ],
          ]}
        />
      </>
    ),
    full: (
      <>
        <H>Ce qui s’imprime</H>
        <Table
          head={["Document", "Où le trouver"]}
          rows={[
            [
              "Fiche de message (une entrée)",
              "Journal : détail → Fiche A4, ou plusieurs lignes cochées",
            ],
            ["Formule de message", "Messages : Fiche A4"],
            ["Rapport de situation", "Journal : Rapport"],
            ["Plan du réseau radio", "Radio : Plan A4"],
            [
              "Quittance de remise radio",
              "Radio : icône imprimante d’un terminal ou d’une remise",
            ],
            ["Étiquettes QR", "Radio : Étiquettes"],
            ["Tableaux", "Moyens, Équipe, Contacts, Agenda : bouton imprimer"],
          ]}
        />
        <p>
          Les PDF sont vectoriels : nets à toutes les tailles, avec les polices
          intégrées. Un texte long continue sur la page suivante.
        </p>
        <H>Imprimer sans fenêtre d’impression</H>
        <p>
          Par sécurité, le navigateur montre sa fenêtre d’impression à chaque
          document. Pour un poste d’impression qui doit tout sortir sans clic,
          lancez Chrome ou Edge avec l’option <code>--kiosk-printing</code> :
        </p>
        <Table
          head={["Système", "Commande ou raccourci"]}
          rows={[
            [
              "Windows · Chrome",
              <code>
                "C:\Program Files\Google\Chrome\Application\chrome.exe"
                --kiosk-printing {SITE}
              </code>,
            ],
            ["Windows · Edge", <code>msedge.exe --kiosk-printing {SITE}</code>],
            [
              "macOS · Chrome",
              <code>open -a "Google Chrome" --args --kiosk-printing</code>,
            ],
          ]}
        />
        <Steps>
          <li>
            Fermez d’abord <strong>toutes</strong> les fenêtres du navigateur,
            sinon l’option est ignorée.
          </li>
          <li>
            Sous Windows, le plus simple : un raccourci sur le bureau dont la «
            Cible » contient la commande ci-dessus.
          </li>
          <li>
            Choisissez l’imprimante par défaut dans les réglages du système :
            c’est elle qui imprimera.
          </li>
          <li>Réglez les marges à zéro lors d’une première impression.</li>
        </Steps>
        <Note kind="warn">
          Dans ce mode, <strong>tout</strong> ce que le navigateur imprime part
          directement sur l’imprimante par défaut. Réservez-le au poste
          d’impression.
        </Note>
      </>
    ),
  },
  {
    id: "present",
    group: "together",
    title: "Présenter la situation",
    icon: MonitorPlay,
    hue: 300,
    short: (
      <p>
        Quand des autorités ou des invités arrivent au poste de conduite, le{" "}
        <strong>mode présentation</strong> montre la situation en plein écran,
        clairement, avec des animations, sans rien préparer : les diapositives
        se construisent seules à partir des données. L’
        <strong>affichage mural</strong> fait défiler la situation en direct sur
        un écran fixe.
      </p>
    ),
    guide: (
      <>
        <H>Présenter en 3 étapes</H>
        <Steps>
          <li>
            Bouton écran <Ui>Présenter la situation</Ui> en haut à droite (ou{" "}
            <K>⌘K</K> → « Présenter »).
          </li>
          <li>
            Préparez en quelques secondes : votre nom, le public (« Maire,
            préfet »), la version (<Ui>Maintenant</Ui>, un point figé ou une
            heure), et cochez ou glissez les diapositives dans l’ordre voulu.
          </li>
          <li>
            <Ui>Présenter</Ui> : plein écran. Flèche droite, espace ou un clic
            pour avancer ; flèche gauche pour revenir ; <K>Échap</K> pour finir.
          </li>
        </Steps>
        <H>Les diapositives</H>
        <p>
          Titre, situation générale et intention, chiffres clés (avec leur
          évolution depuis le dernier point), chaque carte en grand, ce qui a
          changé depuis le dernier point, faits marquants du journal, missions
          en cours ou en retard, moyens, organisation (PC front, PC arrière,
          cellules), réseau radio, météo, prochaines échéances, questions. Une
          diapositive sans données n’apparaît pas.
        </p>
        <H>Dessiner et montrer pendant la présentation</H>
        <ul>
          <li>
            <K>P</K> stylo (souris, doigt ou stylet), <K>H</K> surligneur,{" "}
            <K>E</K> gomme, <K>1</K>–<K>5</K> couleur, <K>⌘Z</K> annuler,{" "}
            <K>Maj</K>+<K>E</K> tout effacer.
          </li>
          <li>
            <K>L</K> pointeur laser, <K>B</K> écran noir, <K>O</K> vue
            d’ensemble des diapositives, <K>T</K> chronomètre, <K>N</K> notes,{" "}
            <K>F</K> plein écran.
          </li>
          <li>
            À la fin, <Ui>Enregistrer les annotations</Ui> produit un PDF des
            diapositives annotées.
          </li>
        </ul>
        <H>Vue orateur</H>
        <p>
          <Ui>Ouvrir la vue orateur</Ui> ouvre une seconde fenêtre (sur
          l’ordinateur, pendant que le projecteur montre les diapositives) :
          diapositive en cours et suivante, notes, temps écoulé, horloge. Si le
          navigateur bloque la fenêtre, autorisez-la ou utilisez <K>N</K>.
        </p>
        <H>Affichage mural</H>
        <p>
          <K>⌘K</K> → « Affichage mural » : la situation défile seule (toutes
          les 10, 20, 30 ou 60 secondes), se met à jour en direct, avec une
          grande horloge et les dernières entrées du journal. L’écran ne se met
          pas en veille. <K>Espace</K> pause, <K>Échap</K> quitter.
        </p>
      </>
    ),
    full: (
      <>
        <H>Exporter la présentation</H>
        <ul>
          <li>
            Depuis l’écran de préparation, ou dans le centre d’export (famille
            Présentation) : <strong>PowerPoint</strong> (.pptx) avec transitions
            et apparitions automatiques, <strong>OpenDocument</strong> (.odp),{" "}
            <strong>PDF</strong> (une diapositive par page) et{" "}
            <strong>HTML</strong> (un seul fichier qui se présente dans
            n’importe quel navigateur, touche <K>N</K> pour les notes).
          </li>
          <li>
            Le fichier porte les notes de l’orateur, le filigrane EXERCICE ou
            CONFIDENTIEL et, en pied de page, l’empreinte vérifiable.
          </li>
          <li>
            On peut exporter une seule partie (par exemple la carte et les
            moyens) ou toute l’opération, à l’heure de son choix.
          </li>
        </ul>
        <H>Registre des présentations</H>
        <p>
          Chaque présentation et chaque affichage mural sont inscrits dans{" "}
          <Path steps={["Traçabilité", "Présentations"]} /> : qui a présenté, à
          qui, quand, combien de temps, quelle version et quelles diapositives.
        </p>
        <Note kind="tip">
          Avant une visite, figez un point de situation (« Visite du préfet ») :
          la présentation, l’export et la comparaison avec la suite reprennent
          exactement la même version.
        </Note>
      </>
    ),
  },
  {
    id: "timemachine",
    group: "together",
    title: "Remonter le temps",
    icon: History,
    hue: 250,
    short: (
      <p>
        Revoir toute l’opération telle qu’elle était à n’importe quelle heure :
        la carte, les moyens, le journal, la météo… Et la{" "}
        <strong>rejouer</strong> comme un film, changement après changement.
      </p>
    ),
    guide: (
      <>
        <H>Revenir à une heure précise</H>
        <Steps>
          <li>
            Cliquez l’horloge <Ui>Remonter le temps</Ui> en haut à droite (ou{" "}
            <K>⌘K</K> → « Remonter le temps »). Une barre apparaît en bas.
          </li>
          <li>
            Glissez le curseur, ou tapez une date et une heure. Les petites
            barres montrent quand il s’est passé beaucoup de choses ; les
            flocons sont les points de situation figés.
          </li>
          <li>
            Parcourez les modules normalement : tout montre l’état de cette
            heure-là. On ne peut rien modifier dans le passé.
          </li>
          <li>
            <Ui>direct</Ui> (bouton violet) revient à l’état actuel.
          </li>
        </Steps>
        <H>Rejouer l’opération</H>
        <p>
          <Ui>▶</Ui> rejoue les changements un par un depuis le début : les
          objets apparaissent et bougent sur la carte, les moyens changent
          d’état, les chiffres évoluent. Vitesse <Ui>Lent</Ui>, <Ui>Normal</Ui>{" "}
          ou <Ui>Rapide</Ui> ; <Ui>«</Ui> et <Ui>»</Ui> avancent d’un
          changement.
        </p>
        <H>Figer un point de situation</H>
        <Steps>
          <li>
            <Ui>Figer</Ui> (dans la barre du temps, dans <Ui>Traçabilité</Ui>,
            ou <K>⌘K</K> → « Figer un point de situation »).
          </li>
          <li>
            Donnez un nom : « Rapport de conduite 14:00 ». L’heure proposée est
            celle affichée ; vous pouvez la changer.
          </li>
          <li>
            Ce moment se choisit ensuite en un clic pour le revoir, le comparer
            à maintenant, le présenter ou l’exporter.
          </li>
        </Steps>
        <Example>
          <p>
            Le préfet arrive à 15 h et demande ce qui a changé depuis le rapport
            de 14 h : <Ui>Traçabilité</Ui> → <Ui>Comparer</Ui> → « Depuis
            Rapport de conduite 14:00 ». La liste montre les moyens engagés, les
            objets posés sur la carte et les nouvelles entrées.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Ce qui est reconstitué</H>
        <ul>
          <li>
            Tous les éléments : ceux créés après l’heure choisie disparaissent,
            ceux modifiés reprennent leurs valeurs d’alors, ceux supprimés
            depuis réapparaissent.
          </li>
          <li>
            Le journal montre les entrées existantes à cette heure, dans leur
            version d’alors. Une entrée supprimée ne revient pas : son contenu
            est effacé par principe, seule la trace de sa suppression reste.
          </li>
          <li>
            La météo affiche la dernière prévision reçue avant cette heure.
          </li>
          <li>
            Depuis la barre du temps, <Ui>Exporter</Ui> et <Ui>Présenter</Ui>{" "}
            reprennent directement la version affichée.
          </li>
        </ul>
        <Note kind="info">
          La machine à remonter le temps ne change rien pour les autres postes :
          chacun peut regarder le passé pendant que les autres continuent de
          travailler en direct.
        </Note>
      </>
    ),
  },
  {
    id: "exports",
    group: "together",
    title: "Exporter, imprimer, importer",
    icon: FileDown,
    hue: 160,
    short: (
      <p>
        Le <strong>centre d’export</strong> produit en un clic tout ou partie de
        l’opération, à l’heure de votre choix, dans près de 30 formats :
        PowerPoint animé, PDF, Word, Excel, carte, archive orion aic… Tout est
        aussi imprimable. Chaque fichier est inscrit au registre avec son
        empreinte pour pouvoir le vérifier plus tard.
      </p>
    ),
    guide: (
      <>
        <H>Exporter en trois choix</H>
        <Steps>
          <li>
            Ouvrez le centre d’export : titre du journal en haut →{" "}
            <Ui>Exporter (tous formats)</Ui>, ou <K>⌘K</K> → « Exporter ».
          </li>
          <li>
            <strong>Quoi</strong> : <Ui>Toute l’opération</Ui>, ou cochez les
            parties voulues (journal, carte, moyens, météo…).{" "}
            <Ui>Choisir des éléments</Ui> permet de n’en garder que quelques-uns
            (trois objets de la carte, une entrée…).
          </li>
          <li>
            <strong>Quand</strong> : <Ui>Maintenant</Ui>, un{" "}
            <strong>point figé</strong> (« Rapport de conduite 14:00 ») ou une{" "}
            <strong>heure précise</strong>. Le fichier montre l’opération telle
            qu’elle était à ce moment.
          </li>
          <li>
            <strong>Format</strong> : choisissez une carte, puis{" "}
            <Ui>Télécharger</Ui> ou <Ui>Imprimer</Ui>.
          </li>
        </Steps>
        <Example>
          <p>
            Pour la visite du préfet : Quoi = Situation, Carte, Moyens ; Quand =
            « Rapport de conduite 14:00 » ; Format = PowerPoint animé. La
            présentation est prête, les animations se jouent seules.
          </p>
        </Example>
        <H>Revoir une opération sur un autre poste</H>
        <Steps>
          <li>
            Exportez l’<strong>archive orion aic</strong> (
            <code>.orionaic</code>, chiffrée par une phrase secrète) de toute
            l’opération.
          </li>
          <li>
            Sur l’autre poste : page d’accueil → <Ui>Importer</Ui>, ou titre du
            journal → <Ui>Importer un fichier</Ui>, puis <Ui>Journal séparé</Ui>
            .
          </li>
          <li>
            Tout est là, historique compris : la{" "}
            <Ui>machine à remonter le temps</Ui> rejoue l’opération du début à
            la fin.
          </li>
        </Steps>
        <H>Vérifier un document</H>
        <p>
          Chaque fichier porte en pied de page une ligne « export … · empreinte
          … » et, quand la place le permet, un QR code. Dans{" "}
          <Path steps={["Traçabilité", "Exports", "Vérifier un document"]} />,
          déposez le fichier reçu : orion aic dit s’il est authentique (qui l’a
          exporté, quand, quoi) ou s’il a été modifié depuis.
        </p>
      </>
    ),
    full: (
      <>
        <H>Les formats</H>
        <Table
          head={["Famille", "Formats", "Pour quoi faire"]}
          rows={[
            [
              "Présentation",
              "PowerPoint .pptx animé, OpenDocument .odp, PDF diaporama, HTML diaporama",
              "Présenter la situation, avec transitions et apparitions automatiques",
            ],
            [
              "Documents imprimables",
              "PDF dossier, Word .docx, OpenDocument .odt, page HTML, Markdown, texte",
              "Dossier complet : couverture, sommaire, chapitres, cartes, filigrane",
            ],
            [
              "Impressions A4",
              "Fiches messages, journal en tableau, plan radio, étiquettes",
              "Les impressions habituelles du poste",
            ],
            [
              "Tableurs et données",
              "Excel .xlsx, OpenDocument .ods, CSV, TSV, JSON",
              "Une feuille par partie, filtres, en-tête figé",
            ],
            [
              "Carte",
              "Image PNG de chaque carte, GeoJSON, KML (Google Earth), GPX (GPS)",
              "Transmettre la carte à un partenaire ou à un appareil",
            ],
            [
              "Agenda et contacts",
              "Agenda .ics, contacts vCard .vcf",
              "Importer dans un agenda ou un téléphone",
            ],
            [
              "Archive",
              "orion aic .orionaic (chiffrée), JSON réimportable",
              "Garder ou transmettre toute l’opération, historique compris",
            ],
            [
              "Pack complet",
              ".zip",
              "Les principaux formats d’un coup, avec la liste des empreintes",
            ],
          ]}
        />
        <H>Options</H>
        <ul>
          <li>
            <strong>Filigrane</strong> : « EXERCICE » et/ou « CONFIDENTIEL »
            selon le journal, sur chaque page et chaque diapositive ; on peut le
            retirer.
          </li>
          <li>
            <strong>Orientation</strong> du PDF (portrait ou paysage),{" "}
            <strong>versions des entrées</strong> (tout ce qui a été corrigé),{" "}
            <strong>animations</strong> des présentations.
          </li>
          <li>
            Une partie absente d’un format est grisée : par exemple l’agenda
            .ics demande la partie Rythme de conduite.
          </li>
        </ul>
        <H>Registre et empreintes</H>
        <ul>
          <li>
            Chaque export est inscrit dans{" "}
            <Path steps={["Traçabilité", "Exports"]} /> : qui, quand, quel
            contenu, quelle version, nom du fichier et empreinte SHA-256.
          </li>
          <li>
            Un fichier modifié, même d’un seul caractère, n’a plus la même
            empreinte : la vérification le signale.
          </li>
          <li>
            Le pack complet inscrit chaque fichier qu’il contient, pour pouvoir
            les vérifier séparément.
          </li>
        </ul>
        <H>Importer et fusionner</H>
        <ul>
          <li>
            Fichiers acceptés : <code>.orionaic</code>, <code>.orion</code>,{" "}
            <code>.json</code>, <code>.csv</code>, <code>.tsv</code>, 32 Mo au
            plus. Le fichier est lu sur le poste, il n’est envoyé nulle part.
          </li>
          <li>
            <Ui>Journal séparé</Ui> : rien n’est touché, l’opération importée
            s’ouvre à côté.
          </li>
          <li>
            <Ui>Fusionner</Ui> : les nouvelles entrées sont ajoutées et
            renumérotées ; les doublons exacts sont ignorés ; les suppressions
            faites ailleurs s’appliquent ; les historiques sont réunis.
          </li>
          <li>
            Pour la carte, les fichiers KML, KMZ, GeoJSON et GPX s’importent
            depuis la carte (<Ui>⋯</Ui> → <Ui>Importer</Ui>).
          </li>
        </ul>
        <Note kind="warn">
          Tous les formats sauf <code>.orionaic</code> sont{" "}
          <strong>en clair</strong>. Pour un journal confidentiel, orion aic
          demande de le confirmer. Transmettez la phrase secrète d’une archive
          par un <strong>autre</strong> moyen que le fichier.
        </Note>
      </>
    ),
  },

  // ---------------------------------------------------------------- reference
  {
    id: "settings",
    group: "reference",
    title: "Réglages",
    icon: Settings2,
    hue: 230,
    short: (
      <p>
        Les réglages sont dans le menu opérateur (vos initiales, en haut à
        droite). Cinq rubriques : Ce poste, Référentiels, Synchronisation,
        Session et journal, et « Une idée ? » pour contacter l’auteur.
      </p>
    ),
    guide: (
      <>
        <Table
          head={["Rubrique", "Pour…"]}
          rows={[
            [
              <Ui>Ce poste</Ui>,
              "Thème, animations, impression automatique, modules affichés. Propre à cet appareil.",
            ],
            [
              <Ui>Référentiels</Ui>,
              "Les listes de valeurs standards proposées en un clic. Partagées avec les postes synchronisés.",
            ],
            [
              <Ui>Synchronisation</Ui>,
              "Travailler à plusieurs postes. Voir le sujet « Synchronisation ».",
            ],
            [
              <Ui>Session et journal</Ui>,
              "Propriétés du journal, opérateur, sauvegarde, clôture, fin de session.",
            ],
          ]}
        />
        <H>Ajouter une valeur standard</H>
        <Steps>
          <li>
            <Path steps={["Réglages", "Référentiels"]} />.
          </li>
          <li>
            Choisissez la liste, par exemple « Destinataires et émetteurs
            standards ».
          </li>
          <li>
            Tapez la nouvelle valeur (« Cellule météo ») et <Ui>Ajouter</Ui>.
            Elle est proposée partout, sur tous les postes.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Ce poste</H>
        <ul>
          <li>
            <strong>Thème</strong> : Clair · papier (par défaut), Sombre ·
            graphite, ou Comme le système.
          </li>
          <li>
            <strong>Animations</strong> : Toutes, ou Réduites (poste lent,
            sensibilité au mouvement).
          </li>
          <li>
            <strong>Impression automatique</strong> : entrées de ce poste,
            entrées des autres postes, messages.
          </li>
          <li>
            <strong>Modules affichés</strong> : masquez ce que vous n’utilisez
            pas. Les données restent intactes.
          </li>
        </ul>
        <H>Référentiels</H>
        <p>
          Destinataires et émetteurs, catégories de message, canaux, types de
          poste, grades, fonctions, types de moyens, organisations, catégories
          de contact, types de rendez-vous, calques de la carte, catégories de
          renseignements.
        </p>
        <ul>
          <li>Chaque valeur peut être ajoutée, modifiée ou retirée.</li>
          <li>
            <Ui>Rétablir les valeurs standards</Ui> remet la liste d’origine.
          </li>
          <li>
            Ces listes sont des propositions : dans les formulaires, vous pouvez
            toujours écrire autre chose.
          </li>
          <li>
            Quand le journal est clôturé, les référentiels ne se modifient plus.
          </li>
        </ul>
        <H>Session et journal</H>
        <p>
          Propriétés du journal (événement, organisation, lieu, référence, mode,
          diffusion), nom de l’opérateur, sauvegarde chiffrée, clôture et
          réouverture, effacement de la session. Voir « Session, journaux et
          sauvegarde ».
        </p>
      </>
    ),
  },
  {
    id: "security",
    group: "reference",
    title: "Sécurité et données",
    icon: ShieldCheck,
    hue: 150,
    short: (
      <p>
        Pas de compte, pas de publicité, pas de mouchard. Vos données restent
        sur votre appareil ; ce qui voyage entre les postes est chiffré.
      </p>
    ),
    guide: (
      <>
        <H>Ce qui sort de l’appareil, et quand</H>
        <Table
          head={["Service", "Quand", "Ce qui est envoyé"]}
          rows={[
            [
              "Fonds de carte swisstopo / OpenStreetMap",
              "Quand la carte s’affiche",
              "La zone regardée (images de carte)",
            ],
            [
              "Recherche d’adresse geo.admin.ch",
              "Quand vous cherchez une adresse",
              "Le texte recherché",
            ],
            [
              "Prévisions Open-Meteo",
              "Quand vous les demandez",
              "Les coordonnées du lieu seulement",
            ],
            [
              "Relais de synchronisation",
              "Si la synchronisation est active",
              "Des messages chiffrés, illisibles",
            ],
            [
              "Fichiers exportés",
              "Quand vous exportez",
              "Ce que vous choisissez d’en faire",
            ],
          ]}
        />
        <H>Bonnes habitudes</H>
        <Steps>
          <li>
            Choisissez une phrase de récupération longue : une petite phrase
            vaut mieux qu’un mot compliqué.
          </li>
          <li>
            <Ui>Verrouiller</Ui> quand vous quittez le poste.
          </li>
          <li>
            Exportez en <code>.orionaic</code> chiffré ; évitez de laisser
            traîner des exports en clair.
          </li>
          <li>
            Transmettez le code de session et les phrases par un canal séparé et
            sûr.
          </li>
          <li>
            En fin d’engagement : archivez, puis effacez la session des postes.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Détails techniques</H>
        <ul>
          <li>
            Sauvegarde sur le poste : AES-256-GCM, clé tirée de la phrase
            (PBKDF2-SHA-256, 600 000 itérations). La phrase n’est jamais
            stockée.
          </li>
          <li>
            Synchronisation : chiffrement de bout en bout AES-256-GCM, clé tirée
            du code de session ; le relais ne connaît qu’un identifiant haché.
          </li>
          <li>
            Aucune télémétrie, aucune statistique, aucun service d’intelligence
            artificielle.
          </li>
          <li>
            Politique de sécurité stricte (CSP) : la page ne peut contacter que
            les services listés ci-dessus.
          </li>
          <li>
            Fichiers importés vérifiés strictement ; formules neutralisées dans
            les exports tableurs ; HTML exporté sans script.
          </li>
          <li>
            Les noms d’opérateur sont déclarés, pas vérifiés : l’historique
            n’est pas une signature électronique.
          </li>
          <li>
            Le code source complet (licence AGPL-3.0) se télécharge depuis le
            menu opérateur.
          </li>
        </ul>
        <Note kind="warn">
          orion aic est un logiciel indépendant, sans homologation ni
          approbation de l’OFPP. Utiliser des données réelles demande un poste
          adapté et l’autorisation de votre organisation.
        </Note>
      </>
    ),
  },
  {
    id: "mobile",
    group: "reference",
    title: "Téléphone et tablette",
    icon: Smartphone,
    hue: 175,
    short: (
      <p>
        orion aic marche aussi sur téléphone et tablette. Installez-le comme une
        app : il s’ouvre en plein écran et fonctionne hors ligne.
      </p>
    ),
    guide: (
      <>
        <H>Installer l’application</H>
        <Table
          head={["Appareil", "Comment"]}
          rows={[
            [
              "Tous",
              "Menu opérateur → Installer l’application (si le navigateur le propose)",
            ],
            ["iPhone / iPad", "Safari → Partager → « Sur l’écran d’accueil »"],
            ["Android", "Chrome → ⋮ → « Installer l’application »"],
            ["Ordinateur", "Icône d’installation dans la barre d’adresse"],
          ]}
        />
        <H>Ce qui change sur petit écran</H>
        <ul>
          <li>Le dock des modules passe en bas de l’écran.</li>
          <li>
            Un bouton rond <Ui>+</Ui> en bas à droite ouvre une nouvelle entrée.
          </li>
          <li>
            Les boutons sont plus grands, la saisie se fait dans une fenêtre
            dédiée.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>Pratique sur le terrain</H>
        <ul>
          <li>
            <strong>Rejoindre une session</strong> : scannez le QR code affiché
            sur le poste principal avec l’appareil photo ; le code est
            prérempli.
          </li>
          <li>
            <strong>Radios</strong> : scannez l’étiquette QR d’une radio pour la
            remettre ou la reprendre.
          </li>
          <li>
            <strong>Contacts</strong> : touchez un numéro pour appeler.
          </li>
          <li>
            Les champs utilisent une taille de texte qui évite le zoom
            automatique de l’iPhone.
          </li>
        </ul>
        <Note kind="info">
          L’application installée garde ses données séparément de l’onglet du
          navigateur : une session ouverte dans Safari n’apparaît pas dans l’app
          installée. Rejoignez la session avec son code, ou importez une
          archive.
        </Note>
      </>
    ),
  },
  {
    id: "shortcuts",
    group: "reference",
    title: "Raccourcis clavier",
    icon: Keyboard,
    hue: 260,
    short: (
      <p>
        Quelques touches font gagner beaucoup de temps. La plus utile :{" "}
        <K>⌘K</K> (Mac) ou <K>Ctrl+K</K> (Windows) pour tout trouver et tout
        faire.
      </p>
    ),
    guide: (
      <Table
        head={["Touches", "Effet"]}
        rows={[
          [
            <>
              <K>⌘K</K> / <K>Ctrl+K</K>
            </>,
            "Rechercher ou agir, depuis n’importe où",
          ],
          [
            <>
              <K>⌘↵</K> / <K>Ctrl+↵</K>
            </>,
            "Enregistrer le formulaire (entrée, message…)",
          ],
          [<K>Échap</K>, "Fermer une fenêtre, un menu, une fiche"],
          [
            <>
              <K>↑</K> <K>↓</K> puis <K>↵</K>
            </>,
            "Se déplacer dans une liste de propositions, puis choisir",
          ],
          [
            <>
              <K>Tab</K> / <K>Maj+Tab</K>
            </>,
            "Passer au champ suivant / précédent",
          ],
          [<K>Tab</K>, "Au tout début de la page : « Aller au contenu »"],
          [
            <>
              <K>→</K> <K>Espace</K> / <K>←</K>
            </>,
            "Présentation : diapositive suivante / précédente",
          ],
          [
            <>
              <K>P</K> <K>H</K> <K>E</K> <K>L</K>
            </>,
            "Présentation : stylo, surligneur, gomme, pointeur laser",
          ],
          [
            <>
              <K>O</K> <K>B</K> <K>N</K> <K>T</K> <K>F</K>
            </>,
            "Présentation : vue d’ensemble, écran noir, notes, chronomètre, plein écran",
          ],
        ]}
      />
    ),
    full: (
      <>
        <H>Ce que trouve « Rechercher ou agir »</H>
        <ul>
          <li>
            <strong>Les modules</strong> : « Aller à Carte de situation »…
          </li>
          <li>
            <strong>Les actions</strong> : nouvelle entrée au journal, nouveau
            message reçu, rapport de situation A4, exporter (tous formats),
            présenter la situation, affichage mural, remonter le temps, figer un
            point de situation, traçabilité, proposer une amélioration, importer
            un fichier, synchroniser avec d’autres postes, activer ou désactiver
            l’impression automatique, thème clair ou sombre, réglages et
            référentiels, nouveau journal dans la session.
          </li>
          <li>
            <strong>Les éléments</strong> : entrées, messages, moyens,
            personnes, contacts, objets de la carte… tapez quelques lettres, les
            accents ne comptent pas.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "contact",
    group: "reference",
    title: "Une idée, un besoin ?",
    icon: Lightbulb,
    hue: 45,
    short: (
      <p>
        orion aic évolue avec ceux qui l’utilisent. Pour demander une fonction,
        signaler un problème ou proposer ce qui vous faciliterait la vie,
        écrivez à <a href={feedbackLink("Aide")}>{CONTACT_EMAIL}</a>.
      </p>
    ),
    guide: (
      <>
        <ContactCard topic="Aide" />
        <H>Où trouver ce contact</H>
        <ul>
          <li>
            Menu opérateur (vos initiales, en haut à droite) →{" "}
            <Ui>Une idée, un besoin ?</Ui>
          </li>
          <li>
            <Path steps={["Réglages", "Une idée ?"]} />
          </li>
          <li>
            <K>⌘K</K> → « Proposer une amélioration »
          </li>
          <li>Le bas de la page d’accueil.</li>
        </ul>
        <Note kind="tip">
          Décrivez la situation (« pendant le rapport de conduite, il faudrait…
          ») plutôt que la solution : c’est le meilleur moyen d’obtenir ce qui
          vous aide vraiment. N’envoyez jamais le contenu d’un journal réel.
        </Note>
      </>
    ),
  },
  {
    id: "faq",
    group: "reference",
    title: "Questions fréquentes",
    icon: CircleHelp,
    hue: 320,
    always: true,
    short: (
      <p>
        Les réponses aux questions que tout le monde se pose. Cliquez sur une
        question pour l’ouvrir.
      </p>
    ),
    guide: (
      <div className="docs-faqs">
        <Faq q="Qui a modifié cet élément ?">
          Ouvrez sa fiche : en bas, « Créé par … · modifié par … », et le bouton{" "}
          <Ui>Historique</Ui> montre toutes ses versions. Pour toute l’opération
          : module <Ui>Traçabilité</Ui>.
        </Faq>
        <Faq q="Peut-on revoir la situation telle qu’elle était à 10 h ?">
          Oui : l’horloge <Ui>Remonter le temps</Ui> en haut à droite, puis
          choisissez 10:00. Tous les modules montrent l’état de ce moment, la
          météo comprise.
        </Faq>
        <Faq q="Comment proposer une amélioration ?">
          Écrivez à <a href={feedbackLink("FAQ")}>{CONTACT_EMAIL}</a> (menu
          opérateur → <Ui>Une idée, un besoin ?</Ui>).
        </Faq>
        <Faq q="Faut-il créer un compte ?">
          Non. Ouvrez le site, créez une session, c’est tout. Il n’y a ni
          compte, ni mot de passe de connexion.
        </Faq>
        <Faq q="Où sont mes données ?">
          Dans le navigateur de votre appareil. Rien n’est stocké sur un
          serveur. Pour les garder ailleurs, exportez une archive.
        </Faq>
        <Faq q="J’ai oublié ma phrase de récupération. Que faire ?">
          Personne ne peut la retrouver. Vous pouvez rejoindre la session depuis
          un autre poste synchronisé, ou importer une archive exportée. Sinon,{" "}
          <Ui>Phrase perdue</Ui> efface l’espace chiffré pour repartir de zéro.
        </Faq>
        <Faq q="J’ai fermé l’onglet d’une session temporaire. Tout est perdu ?">
          Sur ce poste, oui. Mais si d’autres postes étaient synchronisés,
          rejoignez-les avec le code : la session revient. Sinon, seule une
          archive exportée permet de récupérer le travail.
        </Faq>
        <Faq q="Comment travailler à plusieurs ?">
          <Path
            steps={["Réglages", "Synchronisation", "Créer un code de session"]}
          />
          , puis sur les autres postes : <Ui>Rejoindre</Ui> et le code. Voir «
          Synchronisation entre postes ».
        </Faq>
        <Faq q="Est-ce que ça marche sans internet ?">
          Oui, après un premier chargement. La synchronisation a besoin
          d’internet ou du réseau local (<code>npm run lan</code>). Les fonds de
          carte, la recherche d’adresse et les prévisions météo ont besoin
          d’internet.
        </Faq>
        <Faq q="Deux personnes modifient la même chose en même temps : qui gagne ?">
          Pour une entrée du journal, les deux versions sont gardées dans
          l’historique. Pour le reste, la modification la plus récente
          l’emporte.
        </Faq>
        <Faq q="Je me suis trompé dans une entrée du journal.">
          Ouvrez-la et cliquez sur le crayon : la correction est enregistrée et
          l’ancienne version reste consultable. Pour invalider l’entrée, mettez
          son suivi sur <Ui>Annulé</Ui>. Pour une saisie en double, supprimez-la
          avec un motif.
        </Faq>
        <Faq q="Pourquoi le numéro d’une entrée a-t-il changé ?">
          Deux postes hors ligne ont donné le même numéro à deux entrées : la
          plus ancienne garde le numéro, l’autre est renumérotée. Cela arrive
          aussi lors d’une fusion d’archive.
        </Faq>
        <Faq q="Je ne peux plus rien modifier.">
          Le journal est sans doute clôturé (lecture seule). Il se rouvre dans{" "}
          <Path steps={["Réglages", "Session et journal"]} />.
        </Faq>
        <Faq q="Comment imprimer sans cliquer à chaque fois ?">
          Activez l’impression automatique, et lancez Chrome ou Edge avec
          l’option <code>--kiosk-printing</code>. Voir « Impression ».
        </Faq>
        <Faq q="Comment transmettre un journal à un poste non synchronisé ?">
          Exportez une archive <code>.orionaic</code>, envoyez-la, et donnez la
          phrase par un autre moyen. L’autre poste l’importe.
        </Faq>
        <Faq q="Je ne trouve plus un module dans le dock.">
          Il est peut-être masqué :{" "}
          <Path steps={["Réglages", "Ce poste", "Modules affichés"]} />.
        </Faq>
        <Faq q="Les couleurs ou les animations me gênent.">
          Passez au thème clair (bouton soleil en haut), et choisissez des
          animations réduites dans <Path steps={["Réglages", "Ce poste"]} />.
        </Faq>
      </div>
    ),
    full: (
      <div className="docs-faqs">
        <Faq q="Que voit le serveur quand on synchronise ?">
          Rien de lisible : un identifiant de salle haché et des messages
          chiffrés. Il ne garde rien.
        </Faq>
        <Faq q="Le code de session a été divulgué. Que faire ?">
          Sur chaque poste, <Ui>Arrêter sur ce poste</Ui>. Puis un poste crée un
          nouveau code, et les autres le rejoignent.
        </Faq>
        <Faq q="Peut-on synchroniser par Bluetooth ?">
          Non, les navigateurs ne le permettent pas pour cet usage. Sans
          internet, utilisez le réseau local.
        </Faq>
        <Faq q="Que signifient les pastilles sur le dock ?">
          Rouge : des échéances sont dépassées. Violette : des messages nouveaux
          attendent d’être traités.
        </Faq>
        <Faq q="Quel navigateur utiliser ?">
          Un navigateur récent : Chrome, Edge, Firefox ou Safari. La page doit
          être en https.
        </Faq>
        <Faq q="orion aic est-il officiel ?">
          Non. C’est un logiciel indépendant, sans homologation de l’OFPP.
          Utilisez des données réelles seulement avec l’autorisation de votre
          organisation.
        </Faq>
        <Faq q="Puis-je joindre une photo à une entrée ?">
          Non, orion aic ne garde pas de fichiers joints. Notez la référence de
          la photo ou du document.
        </Faq>
      </div>
    ),
  },
  {
    id: "glossary",
    group: "reference",
    title: "Glossaire",
    icon: BookA,
    hue: 45,
    always: true,
    short: <p>Les mots du métier et de l’application, expliqués simplement.</p>,
    guide: (
      <dl className="docs-glossary">
        <Gloss term="AIC · aide à la conduite">
          L’équipe qui aide le chef d’intervention : elle suit la situation,
          tient le journal, gère les messages et les liaisons.
        </Gloss>
        <Gloss term="PC front">
          Le poste de conduite installé près de l’événement, sur le terrain.
        </Gloss>
        <Gloss term="PC arrière">
          Le poste de conduite en retrait (base, bâtiment), qui coordonne,
          soutient et fait le lien avec les autorités.
        </Gloss>
        <Gloss term="Cellule">
          Un petit groupe chargé d’un domaine : situation, logistique,
          télématique, communication…
        </Gloss>
        <Gloss term="Nom d’appel">
          Le nom utilisé à la radio. Il désigne une fonction (« PC Carouge »),
          jamais une personne.
        </Gloss>
        <Gloss term="Polycom">
          Le réseau radio suisse des organisations de sécurité.
        </Gloss>
        <Gloss term="TKG · groupe">
          Un groupe de conversation Polycom : toutes les radios du groupe
          s’entendent à travers le réseau.
        </Gloss>
        <Gloss term="Mode direct">
          Les radios se parlent directement, sans passer par le réseau. Portée
          courte, mais marche partout.
        </Gloss>
        <Gloss term="Relais">
          Un appareil qui répète les messages pour aller plus loin, là où le
          réseau ne passe pas.
        </Gloss>
        <Gloss term="RFSI">
          Le numéro d’identification unique d’une radio dans le réseau Polycom.
        </Gloss>
        <Gloss term="Terminal">
          Une radio : portative, dans un véhicule ou fixe.
        </Gloss>
        <Gloss term="Contrôle de liaison">
          Vérifier qu’on s’entend à la radio. Réponse THREE (bon), TWO (faible
          mais compréhensible) ou ONE (insuffisant).
        </Gloss>
        <Gloss term="Quittance">
          La confirmation qu’un message a été reçu ou qu’une mission est faite.
          Aussi : le papier signé à la remise d’un matériel.
        </Gloss>
        <Gloss term="Relève">
          Le changement d’équipe : ceux qui partent transmettent la situation à
          ceux qui arrivent.
        </Gloss>
        <Gloss term="Rythme de conduite">
          Le programme régulier des rapports, orientations et relèves (par
          exemple un rapport toutes les 2 heures).
        </Gloss>
        <Gloss term="Renseignements clés">
          Les quelques chiffres qui résument la situation : personnes évacuées,
          bâtiments touchés, moyens engagés…
        </Gloss>
        <Gloss term="Échéance">
          L’heure à laquelle une mission ou une réponse est attendue.
        </Gloss>
        <Gloss term="MN95">
          Le système de coordonnées suisse. Deux nombres en mètres, par exemple
          2 499 800 / 1 115 900.
        </Gloss>
        <Gloss term="WGS84">
          Le système de coordonnées du GPS, en degrés : latitude et longitude,
          par exemple 46.19, 6.14.
        </Gloss>
        <Gloss term="swisstopo">
          L’Office fédéral de topographie, qui fait les cartes nationales
          suisses.
        </Gloss>
        <Gloss term="OFPP">
          L’Office fédéral de la protection de la population, qui fixe les
          règles et la formation de la protection civile.
        </Gloss>
        <Gloss term="Module">
          Une partie d’orion aic : journal, carte, radio… Chacun a son icône
          dans le dock.
        </Gloss>
        <Gloss term="Référentiel">
          Une liste de valeurs standards proposées en un clic, modifiable dans
          les réglages.
        </Gloss>
        <Gloss term="Session">
          L’ensemble du travail pour un événement, sur un poste : un ou
          plusieurs journaux et tout ce qui va avec.
        </Gloss>
        <Gloss term="Synchronisation">
          Plusieurs postes qui partagent la même session en direct, grâce à un
          code de session.
        </Gloss>
        <Gloss term="Journal clôturé">
          Un journal terminé : on peut le lire, l’imprimer, l’exporter, mais
          plus le modifier (sauf à le rouvrir).
        </Gloss>
        <Gloss term="Phrase de récupération">
          La phrase secrète (12 caractères au moins) qui chiffre la session sur
          le poste. Personne ne peut la retrouver si elle est perdue.
        </Gloss>
        <Gloss term="Archive .orionaic">
          Le fichier chiffré qui contient tout un journal. Il sert à archiver et
          à transmettre. Les anciennes archives <code>.orion</code> restent
          lisibles.
        </Gloss>
        <Gloss term="Chiffré">
          Transformé en code illisible. Seul celui qui a la clé (phrase ou code
          de session) peut le relire.
        </Gloss>
      </dl>
    ),
  },
];

/** Resolve a help topic (module id, docs topic or unknown) to an existing topic. */
export function resolveTopic(topic: string): string {
  if (TOPICS.some((t) => t.id === topic)) return topic;
  return "start";
}
