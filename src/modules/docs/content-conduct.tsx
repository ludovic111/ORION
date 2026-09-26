import {
  BellRing,
  FileText,
  Gauge,
  Megaphone,
  UserCheck,
  Waypoints,
} from "lucide-react";
import { moduleInfo } from "../../app/modules";
import type { Topic } from "./content";
import { Example, H, Note, States, Steps, Ui } from "./kit";

// Help pages of the conduct follow-up: checklists, requests for resources,
// presences and shifts, weather thresholds, point de situation, handover
// summary and reminders. Written for everyone (10 to 99 years old): what it
// is for, how to do it, then every detail.

const checklists = moduleInfo("checklists");

/** Module topics, shown with the modules (after Missions). */
export const CONDUCT_MODULE_TOPICS: Topic[] = [
  {
    id: "checklists",
    group: "modules",
    module: "checklists",
    icon: checklists.icon,
    hue: checklists.hue,
    title: checklists.label,
    openLabel: "Ouvrir les listes",
    short: (
      <p>
        Une liste de ce qu’il ne faut pas oublier pour un type d’événement :
        crue, panne d’électricité, canicule, accident chimique, tempête, séisme,
        recherche de personne, accueil d’évacués, ouverture du PC. On coche au
        fur et à mesure ; le journal note qui l’a fait et quand.
      </p>
    ),
    guide: (
      <>
        <H>Démarrer une liste</H>
        <Steps>
          <li>
            <Ui>Démarrer une liste</Ui>, puis choisissez le type d’événement
            (par exemple « Crue / inondation »).
          </li>
          <li>Changez le titre si vous voulez (« Crue de l’Arve »).</li>
          <li>
            <Ui>Démarrer</Ui> : la liste s’affiche avec toutes ses étapes.
          </li>
        </Steps>
        <H>Cocher une étape</H>
        <Steps>
          <li>Cochez la case quand l’étape est faite.</li>
          <li>
            Les étapes importantes s’écrivent aussi au journal. Le petit carnet
            à droite montre si ce sera le cas : un clic le change avant de
            cocher.
          </li>
          <li>
            Une étape avec une minuterie (« contrôle 60 min après ») crée une
            entrée <Ui>À traiter</Ui> avec une échéance : dans 60 minutes, il
            faudra vérifier. En retard, elle passe en rouge.
          </li>
        </Steps>
        <Example>
          <p>
            À 09:40, Sgt Muller coche « Relever niveaux et débits ». Le journal
            reçoit « Crue de l’Arve : Relever niveaux et débits. Contrôle à
            10:40 », avec la fonction « Suivi de la situation ». À 10:41, le
            point est en retard sur la page Situation.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Modèles</H>
        <ul>
          <li>
            Neuf modèles sont livrés. Chaque étape a une fonction responsable
            et, si utile, une minuterie de contrôle.
          </li>
          <li>
            <Ui>Modifier</Ui> un modèle standard : vos changements valent pour
            ce journal (et les postes synchronisés). <Ui>Rétablir</Ui> revient
            au modèle livré.
          </li>
          <li>
            <Ui>Dupliquer</Ui> pour partir d’un modèle ; <Ui>Nouveau modèle</Ui>{" "}
            pour une liste à vous ; <Ui>Masquer</Ui> pour retirer un modèle du
            choix.
          </li>
          <li>
            Une liste démarrée garde ses étapes : changer le modèle ensuite ne
            la modifie pas. On peut aussi modifier la liste elle-même (ajouter
            une étape oubliée).
          </li>
        </ul>
        <H>Suivi</H>
        <ul>
          <li>
            La page Situation montre les listes en cours, l’étape suivante et
            les contrôles en retard.
          </li>
          <li>
            Deux postes peuvent cocher en même temps : chaque étape est
            enregistrée à part, rien ne se perd à la synchronisation.
          </li>
          <li>
            <Ui>Imprimer</Ui> donne la liste sur papier avec les cases, l’heure
            et qui a coché. <Ui>Clore la liste</Ui> la range dans « Listes
            closes ».
          </li>
        </ul>
        <Note kind="tip">
          Décocher une étape ne supprime pas l’entrée déjà écrite au journal :
          le journal ne s’efface jamais.
        </Note>
      </>
    ),
  },
  {
    id: "requests",
    group: "modules",
    module: "resources",
    icon: Megaphone,
    hue: 18,
    title: "Demandes de moyens",
    openLabel: "Ouvrir les moyens",
    short: (
      <p>
        Suivre une demande de moyens du début à la fin : demandée, accordée ou
        refusée, en route, arrivée, puis libérée. Chaque étape est écrite au
        journal ; à l’arrivée, le moyen apparaît dans la liste des moyens.
      </p>
    ),
    guide: (
      <>
        <States
          steps={["Demandé", "Accordé", "En route", "Arrivé", "Libéré"]}
          extra={["Refusé", "Annulé"]}
        />
        <H>Faire une demande</H>
        <Steps>
          <li>
            Moyens → onglet <Ui>Demandes</Ui> → <Ui>Nouvelle demande</Ui> (ou le
            bouton <Ui>Demander des moyens</Ui>).
          </li>
          <li>
            Écrivez ce qui est demandé (« Groupe électrogène 20 kVA »), la
            quantité, à qui (organisation) et, si on la connaît, l’heure
            d’arrivée prévue.
          </li>
          <li>
            <Ui>Demander</Ui> : une entrée « Demande » à traiter est écrite au
            journal.
          </li>
        </Steps>
        <H>Suivre</H>
        <Steps>
          <li>
            Les boutons de la demande la font avancer : <Ui>Accordée</Ui>,{" "}
            <Ui>En route</Ui>, <Ui>Arrivée</Ui>… Chaque clic est noté au journal
            (« suite de #012 »).
          </li>
          <li>
            Si l’heure d’arrivée est dépassée, la demande passe en rouge avec le
            retard (« retard 25 min »), ici et sur la page Situation.
          </li>
          <li>
            <Ui>Arrivée</Ui> crée le moyen dans la liste (ou le rattache à un
            moyen existant) et termine l’entrée de la demande.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Types de moyens, organisations et unités viennent des référentiels ;
            le texte libre est accepté.
          </li>
          <li>
            Tout reste modifiable (fiche de la demande) ; l’état ne change que
            par les boutons, pour garder un historique juste.
          </li>
          <li>
            La demande est reliée à son entrée, à ses suites et au moyen livré
            (réseau des liens).
          </li>
          <li>
            <Ui>Imprimer</Ui> donne le tableau A4 de toutes les demandes.
          </li>
        </ul>
        <Note kind="info">
          « Consigner au journal » peut être décoché pour une étape sans
          importance ; la demande garde quand même l’heure et l’auteur de chaque
          étape.
        </Note>
      </>
    ),
  },
  {
    id: "presence",
    group: "modules",
    module: "team",
    icon: UserCheck,
    hue: 330,
    title: "Présences et relève",
    openLabel: "Ouvrir l’équipe",
    short: (
      <p>
        Qui est au PC, depuis quand, et qui prend la relève. On pointe l’arrivée
        et le départ par un bouton ou en scannant un badge QR ; l’application
        avertit quand quelqu’un travaille trop longtemps ou n’a pas assez dormi.
      </p>
    ),
    guide: (
      <>
        <H>Pointer</H>
        <Steps>
          <li>
            Équipe → vue <Ui>Présences</Ui>.
          </li>
          <li>
            <Ui>Arrivée</Ui> quand la personne arrive, <Ui>Départ</Ui> quand
            elle part. Le temps de service s’affiche à droite.
          </li>
          <li>
            Plus rapide : <Ui>Badges QR</Ui> imprime un badge par personne ; à
            l’entrée, <Ui>Scanner un badge</Ui> pointe l’arrivée (ou le départ
            si la personne est déjà là).
          </li>
        </Steps>
        <H>Plan de relève</H>
        <Steps>
          <li>
            <Ui>Planifier</Ui> : heure de début, durée, nombre de relèves (par
            exemple 3 relèves de 8 heures).
          </li>
          <li>Ouvrez chaque relève et choisissez les personnes.</li>
          <li>
            Une personne prévue trop longtemps d’affilée, ou avec trop peu de
            repos entre deux relèves, est signalée en rouge.
          </li>
        </Steps>
        <Example>
          <p>
            Sgtm Gilliéron est arrivé à 21:00 hier. À 09:30, la page affiche «
            En service 12 h 30 d’affilée (maximum 12 h) » : il faut le relever.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Service maximum (12 h par défaut) et repos minimum (8 h) se règlent
            en bas du plan de relève, pour tout le journal.
          </li>
          <li>
            Une pause plus courte que le repos minimum ne remet pas le compteur
            à zéro : les heures continuent de compter, et le repos trop court
            est signalé.
          </li>
          <li>
            Les durées sont de vraies heures, même la nuit du changement d’heure
            (une nuit d’automne 20:00–08:00 compte 13 heures).
          </li>
          <li>
            <Ui>Liste de présence</Ui> imprime les présents (avec une colonne
            signature), toutes les arrivées et départs, et le plan de relève.
          </li>
          <li>
            Un badge scanné avec l’appareil photo d’un téléphone ouvre orion aic
            sur l’appel de cette personne ; il suffit de confirmer.
          </li>
        </ul>
        <Note kind="info">
          Pointer une arrivée met la personne « Présent » dans l’organigramme ;
          pointer le départ la met « Relevé ».
        </Note>
      </>
    ),
  },
  {
    id: "thresholds",
    group: "modules",
    module: "weather",
    icon: Gauge,
    hue: 38,
    title: "Seuils météo",
    openLabel: "Ouvrir la météo",
    short: (
      <p>
        Des limites choisies pour votre région (rafales, pluie, chaleur, froid).
        Quand la prévision les dépasse, une alerte est créée toute seule, et si
        vous le voulez une entrée à traiter au journal.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            Météo → <Ui>Seuils météo</Ui> →{" "}
            <Ui>Ajouter des seuils standards</Ui> ou <Ui>Seuil</Ui>.
          </li>
          <li>
            Choisissez la grandeur (rafales en km/h, pluie en 1 h ou en 24 h,
            température maximale ou minimale), la valeur et le degré de l’alerte
            à créer.
          </li>
          <li>
            À chaque prévision reçue, les seuils sont vérifiés sur les 48
            prochaines heures. La ligne du seuil dit s’il est franchi et quand.
          </li>
        </Steps>
        <Example>
          <p>
            Seuil « Pluie en 1 h ≥ 6 mm ». La prévision de 14:00 annonce 7 mm à
            20:00 : l’alerte « Pluie intense sur l’Arve » apparaît dans Météo,
            et l’entrée « Seuil météo franchi… » est à traiter.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Une seule alerte par seuil et par jour, même si la prévision est
            rechargée plusieurs fois ou si plusieurs postes la reçoivent : ils
            créent la même alerte, qui n’apparaît qu’une fois.
          </li>
          <li>Une alerte supprimée n’est pas recréée pour ce jour-là.</li>
          <li>
            Le niveau des cours d’eau ne fait pas partie de la prévision (Open
            Meteo, gratuite) : saisissez les alertes de crue à la main.
          </li>
        </ul>
      </>
    ),
  },
];

/** Topics about working together (after the exports). */
export const CONDUCT_TOGETHER_TOPICS: Topic[] = [
  {
    id: "situation-point",
    group: "together",
    module: "situation",
    icon: FileText,
    hue: 250,
    title: "Point de situation préparé",
    openLabel: "Ouvrir la situation",
    short: (
      <p>
        Avant un rapport de conduite, orion aic prépare un brouillon du point de
        situation avec ce qu’il sait déjà. Vous le relisez, le corrigez, puis
        l’imprimez ou l’écrivez au journal.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Situation → <Ui>Point de situation</Ui>, ou dans l’agenda, l’icône de
          document à côté d’un rapport de conduite.
        </li>
        <li>
          Le brouillon contient : situation générale, renseignements clés, ce
          qui s’est passé depuis le dernier rapport, moyens engagés, missions
          ouvertes et en retard, listes de contrôle, demandes de moyens, météo,
          personnel, prochain point.
        </li>
        <li>Corrigez chaque rubrique ; complétez « Besoins et décisions ».</li>
        <li>
          <Ui>Imprimer</Ui>, <Ui>Consigner au journal</Ui>,{" "}
          <Ui>Enregistrer comme tableau</Ui> ou <Ui>Figer ce moment</Ui>.
        </li>
      </Steps>
    ),
    full: (
      <ul>
        <li>
          Rien n’est inventé : chaque ligne vient du journal (pas d’intelligence
          artificielle).
        </li>
        <li>
          « Depuis » part de l’heure du dernier rapport ; on peut la changer, le
          brouillon est alors refait.
        </li>
        <li>
          Le brouillon ne change plus pendant que vous l’écrivez ;{" "}
          <Ui>Refaire le brouillon</Ui> reprend l’état actuel.
        </li>
      </ul>
    ),
  },
  {
    id: "handover-summary",
    group: "together",
    icon: Waypoints,
    hue: 212,
    title: "Résumé de relève",
    short: (
      <p>
        « Que s’est-il passé depuis 14:00 ? » : la fenêtre Relève calcule la
        réponse à partir de l’historique : nouvelles entrées, décisions,
        messages, missions ouvertes et closes, moyens, demandes, étapes cochées,
        alertes, retards.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Journal → bouton <Ui>Relève</Ui> (ou ⌘K « Relève »).
        </li>
        <li>
          Choisissez l’heure « Depuis » (par défaut : la dernière relève
          consignée, sinon 8 heures).
        </li>
        <li>
          Un clic sur une ligne ouvre l’élément. <Ui>Imprimer le résumé</Ui> ou{" "}
          <Ui>Copier</Ui>.
        </li>
        <li>
          <Ui>Consigner avec le résumé</Ui> écrit la relève au journal avec ce
          résumé.
        </li>
      </Steps>
    ),
    full: (
      <p>
        Le calcul est toujours le même pour les mêmes données : deux postes
        obtiennent le même résumé. Il vient de l’historique de chaque élément
        (état avant, état après), donc même un moyen passé de « Alerté » à «
        Engagé » puis supprimé y figure.
      </p>
    ),
  },
  {
    id: "reminders",
    group: "together",
    module: "agenda",
    icon: BellRing,
    hue: 48,
    title: "Rappels d’export et d’impression",
    openLabel: "Ouvrir l’agenda",
    short: (
      <p>
        Des rappels à heure fixe : « toutes les 2 heures, exporter l’archive »,
        « 30 minutes avant chaque rapport, imprimer la situation ». Le rappel
        apparaît en bas de l’écran avec le bouton qui fait l’action.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Agenda → <Ui>Rappels d’export et d’impression</Ui> →{" "}
          <Ui>Ajouter les rappels standards</Ui> (ou <Ui>Rappel</Ui>).
        </li>
        <li>
          À l’heure, un encart s’affiche : <Ui>Exporter l’archive</Ui>,{" "}
          <Ui>Imprimer la situation</Ui> ou{" "}
          <Ui>Préparer le point de situation</Ui> en un clic.
        </li>
        <li>
          <Ui>Fait</Ui> le range ; l’horloge le repousse de 15 minutes.
        </li>
      </Steps>
    ),
    full: (
      <ul>
        <li>
          Pas de serveur : le rappel s’affiche sur les postes où orion aic est
          ouvert.
        </li>
        <li>
          Un export ou une impression depuis le centre d’export est écrit au
          registre des exports (Traçabilité) et compte comme fait.
        </li>
        <li>
          « Avant chaque rapport » vaut pour les rendez-vous dont le type ou le
          titre contient « rapport ».
        </li>
      </ul>
    ),
  },
];
