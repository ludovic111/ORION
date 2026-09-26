import { KeyRound, Tv } from "lucide-react";
import type { Topic } from "./content";
import { moduleInfo } from "../../app/modules";
import { Faq, H, K, Note, Path, Steps, Table, Ui } from "./kit";

// Help topics of the exercises, the debriefing, the wall screen and the
// signature of the exports. Registered in TOPICS by content.tsx.

const debrief = moduleInfo("debrief");

export const EXERCISE_TOPICS: Topic[] = [
  {
    id: "debrief",
    group: "modules",
    module: "debrief",
    icon: debrief.icon,
    hue: debrief.hue,
    title: debrief.label,
    openLabel: "Ouvrir le débriefing",
    short: (
      <p>
        Après un exercice ou une intervention, on regarde ce qui s’est passé
        pour faire mieux la prochaine fois : c’est le débriefing, ou RETEX
        (retour d’expérience). orion aic rejoue l’opération, calcule les
        chiffres de la conduite et garde les points à retenir.
      </p>
    ),
    guide: (
      <>
        <H>Rejouer l’opération</H>
        <Steps>
          <li>
            Ouvrez <Ui>Débriefing et exercice</Ui> (icône presse-papiers, en bas
            du dock).
          </li>
          <li>
            Appuyez sur <Ui>Rejouer ×60</Ui> : une minute de l’opération passe
            en une seconde. <Ui>Rejouer ×10</Ui> va plus lentement.
          </li>
          <li>
            Pendant la relecture, ouvrez la carte, le journal ou les moyens :
            tout bouge ensemble, comme un film de l’opération.
          </li>
          <li>
            La barre du bas met en pause, change la vitesse ou revient au direct
            (<Ui>Retour au direct</Ui>).
          </li>
        </Steps>
        <H>Lire les chiffres</H>
        <Table
          head={["Chiffre", "Ce qu’il veut dire"]}
          rows={[
            [
              "Réaction médiane",
              "Temps habituel entre l’arrivée d’un inject et la première réaction (exercice).",
            ],
            [
              "Injects en retard",
              "Injects dont la réaction est arrivée après le délai prévu, ou pas encore arrivée.",
            ],
            [
              "Échéances dépassées",
              "Entrées du journal terminées après leur échéance, ou encore ouvertes après.",
            ],
            ["Retard cumulé", "Tous les retards additionnés."],
            [
              "Traitement d’un message",
              "Temps entre la réception d’un message et son traitement : pris en charge, inscrit au journal ou lié à une entrée.",
            ],
            ["Entrées par heure", "Le rythme du journal, heure par heure."],
            [
              "Qui a fait quoi",
              "Entrées, corrections, messages et autres changements de chaque personne.",
            ],
          ]}
        />
        <H>Noter les points à retenir</H>
        <Steps>
          <li>
            Dans <Ui>Points positifs</Ui>, écrivez ce qui a bien marché ; dans{" "}
            <Ui>À améliorer</Ui>, ce qu’il faudra faire autrement.
          </li>
          <li>
            Le domaine est facultatif (transmissions, logistique…). Appuyez sur{" "}
            <Ui>Ajouter</Ui>.
          </li>
          <li>
            Les points s’ajoutent même quand le journal est clôturé : le
            débriefing a souvent lieu après.
          </li>
        </Steps>
        <H>Exporter le débriefing</H>
        <p>
          Les boutons <Ui>PDF</Ui> et <Ui>Word</Ui> ouvrent le centre d’export
          avec la partie <Ui>Exercice et débriefing</Ui> : chiffres, tableaux et
          points à retenir, dans un document signé.
        </p>
      </>
    ),
    full: (
      <>
        <H>Comment la réaction est mesurée</H>
        <ul>
          <li>
            Un inject arrivé dans Messages compte comme traité dès que son
            message quitte l’état « Nouveau », est inscrit au journal ou est lié
            à une entrée ou à une mission. La plus précoce de ces heures compte.
          </li>
          <li>
            La direction peut aussi noter la réaction à la main (bouton{" "}
            <Ui>Réaction</Ui>) : utile pour un inject lu à voix haute ou une
            réaction par radio.
          </li>
          <li>
            Les joueurs ne voient dans le débriefing que les injects déjà joués
            : les suivants restent une surprise.
          </li>
        </ul>
        <H>Tous les calculs</H>
        <p>
          Les chiffres sont calculés sur le poste, à partir de l’historique du
          journal : ils sont les mêmes sur tous les postes et dans les archives.
          Rien n’est envoyé nulle part.
        </p>
        <Faq q="Le débriefing existe-t-il pour une vraie intervention ?">
          Oui. Seul l’onglet Direction d’exercice est réservé aux journaux en
          mode Exercice ; la relecture, les chiffres et les points à retenir
          servent aussi après une intervention.
        </Faq>
      </>
    ),
  },
  {
    id: "exercise",
    group: "together",
    module: "debrief",
    icon: debrief.icon,
    hue: 20,
    title: "Exercices : scénario et injects",
    openLabel: "Ouvrir la direction d’exercice",
    short: (
      <p>
        Pour un exercice, la direction prépare un scénario : des « injects »,
        c’est-à-dire des messages inventés qui arrivent à une heure prévue (« la
        police signale une route fermée »). orion aic les envoie tout seul au
        bon moment et mesure la réaction des joueurs.
      </p>
    ),
    guide: (
      <>
        <Note kind="warn">
          Uniquement dans un journal en mode <Ui>Exercice</Ui>. Dans un journal
          d’intervention, aucun inject ne part jamais.
        </Note>
        <H>Ouvrir la direction d’exercice</H>
        <Steps>
          <li>
            <Path steps={["Débriefing et exercice", "Direction d’exercice"]} />.
          </li>
          <li>
            La première fois, choisissez un code de 4 à 8 chiffres pour ce
            poste. Il sera demandé pour revenir. <Ui>Masquer (mode joueur)</Ui>{" "}
            referme la vue.
          </li>
        </Steps>
        <H>Préparer le scénario</H>
        <Steps>
          <li>
            <Ui>Exemple « Crue de l’Arve »</Ui> charge un scénario complet pour
            s’entraîner. <Ui>Importer</Ui> lit un scénario JSON,{" "}
            <Ui>Exporter</Ui> l’enregistre pour un autre exercice.
          </li>
          <li>
            <Ui>Inject</Ui> en ajoute un : titre, moment (minutes après le début
            « T+ », ou heure fixe), émetteur joué, cellule visée, canal
            (message, radio, téléphone), contenu, réaction attendue et délai.
          </li>
          <li>
            <Ui>Remise</Ui> : l’inject arrive dans Messages, ou il est lu à voix
            haute par la direction (au téléphone, à la radio).
          </li>
          <li>
            <Ui>Effets à l’arrivée</Ui> : changer l’état d’un moyen, ajouter une
            observation météo ou mettre à jour un renseignement clé.
          </li>
        </Steps>
        <H>Jouer</H>
        <Steps>
          <li>
            <Ui>Commencer maintenant (T0)</Ui> : l’exercice démarre, le compteur
            T+ tourne.
          </li>
          <li>
            À l’heure prévue, le poste de la direction envoie l’inject : il
            apparaît dans Messages sur tous les postes synchronisés.
          </li>
          <li>
            Un inject à lire s’affiche en grand : lisez-le, puis{" "}
            <Ui>Lu et transmis</Ui>.
          </li>
          <li>
            <Ui>Envoyer</Ui> fait partir un inject tout de suite ; l’œil barré
            le retire du programme.
          </li>
          <li>
            <Ui>Terminer l’exercice</Ui> arrête les envois. Le débriefing montre
            ensuite les réactions.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Bon à savoir</H>
        <ul>
          <li>
            Les injects partent depuis le poste de la direction : gardez-le
            ouvert pendant l’exercice. S’il était fermé, les injects en retard
            partent dès qu’il revient.
          </li>
          <li>
            Deux postes de direction ouverts en même temps ne créent pas de
            doublon : le message d’un inject est le même sur tous les postes.
          </li>
          <li>
            Une heure fixe est lue à l’heure de Zurich, même lors du changement
            d’heure. <Ui>Jour de l’exercice</Ui> 1 = le lendemain du début.
          </li>
          <li>
            Le code de la direction évite qu’un joueur ouvre le scénario par
            erreur. Ce n’est pas une protection : le scénario voyage avec le
            journal (synchronisation, archives, traçabilité).
          </li>
        </ul>
        <H>Format du fichier scénario</H>
        <p>
          Un fichier JSON lisible : <code>format</code> «{" "}
          <code>orion-aic-scenario</code> », <code>version</code> 1,{" "}
          <code>title</code>, <code>description</code> et la liste{" "}
          <code>injects</code> (titre, <code>timing</code> « offset » ou « clock
          », <code>offset</code> en minutes, <code>clock</code> « hh:mm »,{" "}
          <code>day</code>, émetteur, destinataire, canal, contenu, remise,
          réaction attendue, délai, effets). Exportez l’exemple pour voir un
          fichier complet.
        </p>
        <H>La démonstration vivante</H>
        <p>
          L’exercice de démonstration (
          <Ui>Ouvrir l’exercice de démonstration</Ui> sur la page d’accueil)
          joue ce même scénario : toutes les quelques minutes arrivent un
          message, un changement d’état d’un moyen, une mise à jour météo.
          Laissez-le ouvert pour voir un PC qui vit.
        </p>
      </>
    ),
  },
  {
    id: "wall",
    group: "together",
    icon: Tv,
    hue: 200,
    title: "Écran mural",
    short: (
      <p>
        Un grand écran dans la salle de conduite, que tout le monde lit de loin
        : carte, points ouverts et retards, compte à rebours du prochain
        rapport, renseignements clés, moyens engagés, dernières entrées et
        l’heure. Il ne se touche pas : il se met à jour tout seul.
      </p>
    ),
    guide: (
      <>
        <H>L’ouvrir</H>
        <Steps>
          <li>
            Sur n’importe quel poste : <K>⌘K</K> (ou <K>Ctrl K</K>) puis{" "}
            <Ui>Écran mural de la salle de conduite</Ui>, ou le menu de
            l’opérateur (votre nom, en haut à droite) puis <Ui>Écran mural</Ui>.
          </li>
          <li>
            Sur un ordinateur branché au grand écran : rejoignez la session
            (code de session), puis ajoutez <code>#mur</code> à l’adresse (par
            exemple <code>https://orionaic.xyz/#mur</code>).
          </li>
          <li>
            Bougez la souris : <Ui>Plein écran</Ui> et <Ui>Quitter</Ui>{" "}
            apparaissent. <K>F</K> passe en plein écran, <K>Échap</K> quitte.
          </li>
        </Steps>
      </>
    ),
    full: (
      <ul>
        <li>
          L’écran suit le thème de couleur du poste, y compris la nuit tactique
          (tout en rouge) pour une salle sombre.
        </li>
        <li>
          L’écran reste allumé tant que l’écran mural est affiché (si le
          navigateur le permet).
        </li>
        <li>
          Toutes les deux minutes, l’image se décale de quelques pixels : les
          écrans ne gardent pas la trace d’une image fixe.
        </li>
        <li>
          Il montre toujours l’état en direct, même si la machine à remonter le
          temps est ouverte sur un autre poste.
        </li>
      </ul>
    ),
  },
  {
    id: "signature",
    group: "reference",
    icon: KeyRound,
    hue: 160,
    title: "Signature des exports",
    short: (
      <p>
        Chaque poste a sa propre clé de signature. Les PDF, les archives et les
        codes QR imprimés sont signés : on peut vérifier plus tard que personne
        n’a changé une lettre depuis.
      </p>
    ),
    guide: (
      <>
        <H>Vérifier un document</H>
        <Steps>
          <li>
            <Path steps={["Traçabilité", "Vérifier un document"]} />.
          </li>
          <li>
            Déposez le fichier (PDF, archive .orionaic…) ou collez le texte du
            code QR imprimé.
          </li>
          <li>
            <Ui>Signature valide</Ui> : le fichier est intact.{" "}
            <Ui>Signature invalide</Ui> : il a été modifié après la signature.
          </li>
          <li>
            Comparez l’empreinte de la clé (par exemple{" "}
            <code>A1B2-C3D4-E5F6-0718</code>) avec celle imprimée en bas du
            document ou connue du poste qui l’a produit.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Ce que la signature prouve</H>
        <ul>
          <li>
            Le fichier (ou le contenu imprimé) est exactement celui signé par la
            clé indiquée.
          </li>
          <li>
            Le registre des exports de l’opération garde la signature de chaque
            fichier : même un fichier Word ou Excel peut être vérifié.
          </li>
        </ul>
        <H>Ce qu’elle ne prouve pas</H>
        <ul>
          <li>
            Qui tenait la clé : elle est créée par le poste lui-même, sans
            autorité de certification. Notez l’empreinte de chaque poste
            (affichée dans <Ui>Vérifier un document</Ui>).
          </li>
          <li>
            L’heure : elle vient de l’horloge du poste qui signe, pas d’un
            service d’horodatage.
          </li>
        </ul>
        <p>
          La clé est gardée dans la session chiffrée du poste. Elle n’est jamais
          synchronisée ni exportée. Une nouvelle session crée une nouvelle clé.
        </p>
      </>
    ),
  },
];
