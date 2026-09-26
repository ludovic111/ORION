import { BellRing, Cable } from "lucide-react";
import { moduleInfo } from "../../app/modules";
import type { Module } from "../../../shared/links";
import type { Topic } from "./content";
import { Example, Faq, H, Note, Path, States, Steps, Table, Ui } from "./kit";

// Help topics of the conduct features: Mes tâches and the functions of the
// posts, orders and diffusions, alerts, liaison between command posts.

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

export const CONDUCT_TOPICS: Topic[] = [
  {
    id: "tasks",
    group: "modules",
    ...mod("tasks", "Ouvrir Mes tâches"),
    short: (
      <p>
        Chaque poste dit quelle est sa fonction (logistique, télématique…). «
        Mes tâches » montre alors seulement ce qui est pour lui : ce qui est en
        retard en haut, avec un bouton pour dire que c’est fait.
      </p>
    ),
    guide: (
      <>
        <H>Choisir la fonction de ce poste</H>
        <Steps>
          <li>
            Ouvrez <Ui>Mes tâches</Ui> (ou{" "}
            <Path steps={["Réglages", "Ce poste"]} />
            ).
          </li>
          <li>
            Cliquez sur votre fonction : <Ui>Chef d’intervention</Ui>,{" "}
            <Ui>Chef situation</Ui>, <Ui>Aide à la conduite</Ui>,{" "}
            <Ui>Logistique</Ui>, <Ui>Télématique</Ui>,{" "}
            <Ui>Personnel / admin</Ui> ou <Ui>Liaison</Ui>. Vous pouvez aussi
            écrire une autre fonction.
          </li>
          <li>
            À la prochaine ouverture, orion aic s’ouvre directement sur le
            module de votre fonction (Moyens pour la logistique, Radio pour la
            télématique…). Vous pouvez choisir un autre module dans{" "}
            <Path steps={["Réglages", "Ce poste", "Module à l’ouverture"]} />.
          </li>
        </Steps>
        <H>Ce qui apparaît dans Mes tâches</H>
        <Table
          head={["Quoi", "Quand"]}
          rows={[
            [
              "Une entrée du journal à suivre",
              "Son « Responsable » est votre fonction, votre nom ou votre cellule (« Logistique / Sgt Rey » compte pour les deux)",
            ],
            [
              "Une mission d’un ordre émis",
              "Sa fonction responsable ou son unité vous désigne",
            ],
            [
              "Un élément attribué",
              "Quelqu’un a cliqué « Attribuer » et choisi votre fonction ou votre nom",
            ],
            [
              "Une diffusion",
              "Elle vous est destinée et attend votre « Lu » ou « Compris »",
            ],
          ]}
        />
        <H>Les boutons de chaque ligne</H>
        <ul>
          <li>
            <Ui>Terminé</Ui> : la tâche est faite (l’entrée passe à Terminé,
            avec son historique).
          </li>
          <li>
            <Ui>+15 min</Ui> : repousse l’échéance d’un quart d’heure.
          </li>
          <li>
            <Ui>Noter au journal</Ui> : ouvre une entrée préremplie (quittance)
            à compléter et consigner.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>Détails</H>
        <ul>
          <li>
            La fonction est gardée sur ce poste seulement (comme le thème). Deux
            postes de la même cellule peuvent avoir la même fonction : ils
            voient les mêmes tâches.
          </li>
          <li>
            La liste des fonctions se modifie dans{" "}
            <Path
              steps={["Réglages", "Référentiels", "Fonctions des postes"]}
            />
            .
          </li>
          <li>
            Majuscules et accents ne comptent pas : « logistique » désigne «
            Logistique ».
          </li>
          <li>
            Le chiffre sur l’icône Mes tâches compte ce qui est en retard et ce
            qui attend votre accusé. Le titre de l’onglet du navigateur « (3)
            orion aic » compte aussi les entrées en retard du journal.
          </li>
          <li>
            <Ui>Attribuer</Ui> : n’importe quel élément (entrée, message,
            rendez-vous, moyen…) peut être confié à une fonction et / ou une
            personne, avec une échéance et une consigne.
          </li>
          <li>
            <Ui>Pour votre fonction</Ui> : raccourcis vers les modules les plus
            utiles à votre fonction.
          </li>
        </ul>
        <Example>
          <p>
            Le poste de la cellule logistique choisit <Ui>Logistique</Ui>. Il
            voit tout de suite « #004 Demande de 200 sacs de sable », en retard,
            et la mission « Livrer 200 sacs » de l’ordre n° 1. Livraison faite :{" "}
            <Ui>Terminé</Ui>, puis <Ui>Noter au journal</Ui> pour la quittance.
          </p>
        </Example>
      </>
    ),
  },
  {
    id: "orders",
    group: "modules",
    ...mod("orders", "Ouvrir les ordres"),
    short: (
      <p>
        Écrire un ordre dans l’ordre habituel en cinq points, l’envoyer aux
        bonnes personnes et savoir qui l’a lu. Chacun doit répondre « Lu » ou «
        Compris » ; vous voyez qui l’a fait, et à quelle heure.
      </p>
    ),
    guide: (
      <>
        <H>Écrire et émettre un ordre</H>
        <Steps>
          <li>
            <Ui>Nouvel ordre</Ui>, puis un modèle : <Ui>Ordre d’engagement</Ui>,{" "}
            <Ui>Ordre complémentaire</Ui>, <Ui>Ordre préparatoire</Ui>,{" "}
            <Ui>Ordre de relève</Ui> ou vide. La situation, les dangers,
            l’intention, les PC, les groupes radio et les prochains rapports
            sont déjà remplis depuis ce que le journal sait.
          </li>
          <li>
            Complétez les cinq chapitres. Au point 3,{" "}
            <Ui>Ajouter une mission</Ui> par unité ou cellule : ce qu’elle fait,
            la fonction responsable, l’échéance, et <Ui>Lier</Ui> les moyens ou
            personnes concernés.
          </li>
          <li>
            Choisissez les destinataires (fonctions, cellules, autre PC, Tous),
            puis <Ui>Enregistrer</Ui> : c’est un projet.
          </li>
          <li>
            <Ui>Émettre</Ui> : l’ordre reçoit l’heure d’émission, s’inscrit au
            journal (« Ordre n° 1 émis ») et part aux destinataires, qui doivent
            répondre « Compris ».
          </li>
          <li>
            <Ui>A4</Ui> imprime la fiche d’ordre avec les accusés et une case de
            visa.
          </li>
        </Steps>
        <Table
          head={["Chapitre", "Ce qu’on y écrit"]}
          rows={[
            [
              "1 Orientation",
              "Situation, danger et évolution probable, moyens voisins",
            ],
            ["2 Intention", "Idée de manœuvre : ce que l’on veut obtenir"],
            ["3 Missions", "Qui fait quoi, jusqu’à quand, avec quoi"],
            ["4 Dispositions particulières", "Logistique, sanitaire, sécurité"],
            [
              "5 Emplacements et liaisons",
              "PC, canaux radio, heures des rapports",
            ],
          ]}
        />
        <H>Diffuser avec accusé de lecture</H>
        <Steps>
          <li>
            <Ui>Diffuser</Ui> (ici, dans Mes tâches ou avec ⌘K) : objet, texte,
            destinataires, accusé demandé (<Ui>Lu</Ui>, <Ui>Compris</Ui> ou
            aucun) et délai de réponse (10 min par défaut).
          </li>
          <li>
            Chaque poste concerné voit un bandeau en haut de l’écran, quel que
            soit le module, jusqu’à ce qu’il clique <Ui>Lu</Ui> ou{" "}
            <Ui>Compris</Ui>.
          </li>
          <li>
            Dans <Ui>Diffusions</Ui>, chaque destinataire montre sa réponse et
            son heure, ou « en attente · 12 min ». Passé le délai, la ligne
            devient rouge et votre poste est prévenu.{" "}
            <Ui>Relancer les absents</Ui> renvoie à ceux qui n’ont pas répondu.
          </li>
        </Steps>
        <States steps={["Brouillon", "Émis"]} extra={["Annulé"]} />
      </>
    ),
    full: (
      <>
        <H>Détails</H>
        <ul>
          <li>
            Le numéro d’un ordre est donné à sa création et ne change jamais ;
            un numéro supprimé n’est jamais redonné. Deux postes qui créent un
            ordre au même moment : « n° 4 » et « n° 4·K ». Un ordre reçu d’un
            autre PC s’appelle « PC front n° 2 ».
          </li>
          <li>
            <Ui>Ordre complémentaire</Ui> reprend les emplacements, liaisons,
            rapports et destinataires de l’ordre de base, et s’y relie.
          </li>
          <li>
            Chaque accusé est gardé : qui (fonction et nom), quand, et s’il est
            venu par la liaison. Il apparaît dans la traçabilité ; il ne se
            modifie pas.
          </li>
          <li>
            Un destinataire est satisfait par la première réponse d’un poste qui
            le représente : pour « Logistique », un seul poste logistique
            suffit. « Tous » attend une réponse de n’importe quel poste.
          </li>
          <li>
            <Ui>Arrêter le suivi</Ui> : plus de relance ni de retard pour cette
            diffusion.
          </li>
          <li>
            Les ordres, diffusions et accusés partent dans les exports avec la
            partie « Missions et suivi ».
          </li>
        </ul>
        <Faq q="Un ordre émis peut-il être corrigé ?">
          Oui (<Ui>Modifier</Ui>), chaque version est gardée dans l’historique.
          Pour un vrai changement de conduite, émettez plutôt un{" "}
          <Ui>Ordre complémentaire</Ui> : les destinataires le reçoivent et
          l’accusent.
        </Faq>
      </>
    ),
  },
  {
    id: "alerts",
    group: "together",
    title: "Alertes et notifications",
    icon: BellRing,
    hue: 20,
    module: "tasks",
    openLabel: "Ouvrir Mes tâches",
    short: (
      <p>
        orion aic peut vous prévenir quand quelque chose arrive, même si vous
        êtes dans un autre onglet : un message urgent, une échéance dépassée, un
        rapport dans 5 minutes, une tâche pour vous, une diffusion à lire.
      </p>
    ),
    guide: (
      <>
        <H>Activer les alertes sur ce poste</H>
        <Steps>
          <li>
            <Path steps={["Réglages", "Ce poste", "Alertes"]} />.
          </li>
          <li>
            <Ui>Notifications du système</Ui> : le navigateur demande la
            permission ; répondez <Ui>Autoriser</Ui>.
          </li>
          <li>
            <Ui>Son</Ui> si vous voulez aussi un petit signal sonore (deux
            notes, trois si c’est urgent). <Ui>Essayer</Ui> pour l’entendre.
          </li>
          <li>
            Choisissez ce qui vous intéresse et combien de minutes avant un
            rapport vous voulez être prévenu (5 par défaut).
          </li>
        </Steps>
        <Note kind="tip">
          La nuit, <Ui>Heures calmes</Ui> (par exemple 22:00 à 06:00) coupe le
          son et ne laisse passer que l’urgent. Avec le thème Nuit tactique, le
          son est plus bas et rien ne clignote.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Détails</H>
        <ul>
          <li>
            Chaque alerte sonne une seule fois sur ce poste. Une échéance
            repoussée (+15 min) sonnera à sa nouvelle heure.
          </li>
          <li>
            L’onglet orion aic doit rester ouvert (il peut être en
            arrière-plan). Le navigateur vérifie au moins une fois par minute.
          </li>
          <li>
            Aucune information ne part sur internet pour les alertes : c’est le
            navigateur de ce poste qui les affiche.
          </li>
          <li>
            Si le navigateur a refusé les notifications : cliquez sur le cadenas
            à gauche de l’adresse, puis Notifications → Autoriser.
          </li>
          <li>
            Le titre de l’onglet affiche le nombre de choses qui attendent : «
            (3) orion aic ».
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "liaison",
    group: "together",
    title: "Liaison entre PC",
    icon: Cable,
    hue: 18,
    module: "orders",
    openLabel: "Ouvrir la liaison",
    short: (
      <p>
        Le PC front et le PC arrière ont chacun leur propre session. La liaison
        leur permet de s’envoyer des messages, des ordres et des accusés de
        lecture, sans mélanger le reste.
      </p>
    ),
    guide: (
      <>
        <H>Ouvrir une liaison</H>
        <Steps>
          <li>
            Sur le premier PC :{" "}
            <Path steps={["Réglages", "Synchronisation", "Liaison entre PC"]} />{" "}
            (ou <Path steps={["Ordres", "Liaison entre PC"]} />
            ). Écrivez le nom de l’autre PC (« PC arrière ») et le vôtre (« PC
            front »), puis <Ui>Créer un code de liaison</Ui>.
          </li>
          <li>Transmettez le code à l’autre PC comme un mot de passe.</li>
          <li>
            Sur l’autre PC : mêmes noms, inversés, saisissez le code et{" "}
            <Ui>Rejoindre la liaison</Ui>. L’état passe à <Ui>En liaison</Ui>.
          </li>
        </Steps>
        <H>Envoyer</H>
        <ul>
          <li>
            <Ui>Message à PC arrière</Ui> : arrive dans ses Messages, avec « PC
            front » comme émetteur.
          </li>
          <li>
            Une diffusion ou un ordre dont un destinataire est « PC arrière »
            part aussi par la liaison. L’autre PC le voit en bandeau et dans ses
            Messages ; son « Compris » revient chez vous.
          </li>
        </ul>
        <Note kind="info">
          Si l’autre PC n’est pas connecté, ce que vous envoyez attend (« en
          attente ») et part dès qu’il revient. Rien n’est perdu, rien n’arrive
          deux fois.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Détails</H>
        <ul>
          <li>
            Le code de liaison ressemble à un code de session mais ouvre une
            autre salle, avec une autre clé : il ne donne jamais accès à la
            session de l’autre PC.
          </li>
          <li>
            Tous les postes d’un PC connectés voient l’état de la liaison ;
            n’importe lequel peut envoyer et recevoir.
          </li>
          <li>
            La carte de la liaison montre le dernier échange, ce qui attend et
            les derniers messages dans chaque sens.
          </li>
          <li>
            <Ui>Fermer la liaison</Ui> efface le code ; ce qui a été échangé
            reste au journal. Le code n’est jamais exporté.
          </li>
          <li>
            Le même relais que la synchronisation est utilisé ; il ne garde rien
            et ne peut rien lire.
          </li>
        </ul>
      </>
    ),
  },
];
