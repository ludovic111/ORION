import { Mic } from "lucide-react";
import type { Topic } from "./content";
import { Example, Faq, H, K, Note, Path, Steps, Table, Ui } from "./kit";

// « Dictée vocale »: speak instead of typing the text of an entry or a
// message. Registered in TOPICS by content.tsx.
export const DICTATION_TOPIC: Topic = {
  id: "dictation",
  group: "reference",
  title: "Dictée vocale",
  icon: Mic,
  hue: 20,
  short: (
    <p>
      Parlez au lieu de taper : le texte d’une entrée du journal ou d’un message
      s’écrit tout seul. La dictée est coupée au départ ; on l’allume sur chaque
      poste qui en a besoin.
    </p>
  ),
  guide: (
    <>
      <H>L’allumer sur ce poste</H>
      <Steps>
        <li>
          Ouvrez <Path steps={["Réglages", "Ce poste"]} />.
        </li>
        <li>
          Dans <Ui>Dictée vocale</Ui>, activez{" "}
          <Ui>Dicter les messages au micro</Ui>.
        </li>
        <li>
          Un petit micro apparaît à droite du mot « Message » dans la nouvelle
          entrée du journal et dans la saisie des messages.
        </li>
      </Steps>
      <Note kind="info">
        Si la rubrique indique « Non disponible dans ce navigateur », le
        navigateur ne sait pas transcrire la voix (Firefox, par exemple).
        Chrome, Edge et Safari le savent.
      </Note>
      <H>Dicter</H>
      <Steps>
        <li>Cliquez dans le texte, là où les mots doivent arriver.</li>
        <li>
          Appuyez sur le micro. La première fois, le navigateur demande la
          permission d’utiliser le micro : acceptez.
        </li>
        <li>
          Le point orange et « Écoute… » montrent que le poste écoute. Parlez
          normalement ; les mots en cours de reconnaissance s’affichent en gris
          à côté du micro.
        </li>
        <li>
          Pour arrêter : appuyez de nouveau sur le micro, ou sur <K>Échap</K>.
          Changer d’onglet ou fermer le formulaire arrête aussi l’écoute.
        </li>
        <li>Relisez, corrigez au clavier si besoin, puis enregistrez.</li>
      </Steps>
      <H>Les commandes de ponctuation</H>
      <p>Dites le mot de la colonne de gauche, il est remplacé par le signe.</p>
      <Table
        head={["Vous dites", "Vous obtenez"]}
        rows={[
          ["« point »", "."],
          ["« virgule »", ","],
          ["« deux points »", ":"],
          ["« point-virgule »", ";"],
          ["« point d’interrogation »", "?"],
          ["« point d’exclamation »", "!"],
          ["« nouvelle ligne » ou « à la ligne »", "un retour à la ligne"],
          ["« nouveau paragraphe »", "une ligne vide"],
        ]}
      />
      <p>
        Après un point, un point d’interrogation ou un retour à la ligne, le mot
        suivant prend une majuscule. « Le point de situation » ou « au point de
        rassemblement » restent écrits en toutes lettres.
      </p>
      <Example>
        Vous dites : « niveau de l’Arve deux points 3 virgule 2 mètres point
        nouvelle ligne pont de Carouge fermé point ». Le texte devient : «
        Niveau de l’Arve : 3,2 mètres. » puis, à la ligne, « Pont de Carouge
        fermé. »
      </Example>
      <H>Où va le son</H>
      <Note kind="warn">
        Dans Chrome et Edge, le son est envoyé aux serveurs de Google /
        Microsoft pour être transcrit, et il faut une connexion internet. Safari
        peut transcrire sur l’appareil selon le système. Ne dictez pas
        d’informations confidentielles si ce n’est pas autorisé.
      </Note>
      <p>
        orion aic ne reçoit et n’enregistre aucun son : seul le texte écrit dans
        le champ fait partie du journal, comme si vous l’aviez tapé.
      </p>
    </>
  ),
  full: (
    <>
      <H>Quand ça ne marche pas</H>
      <Table
        head={["Message", "Que faire"]}
        rows={[
          [
            "Micro refusé",
            "Le navigateur a bloqué le micro pour ce site. Cliquez sur le cadenas à gauche de l’adresse et autorisez le micro.",
          ],
          [
            "Pas de connexion",
            "Chrome et Edge transcrivent par internet. Sans réseau, tapez au clavier.",
          ],
          [
            "Rien entendu",
            "Le poste n’a pas entendu de voix. Rapprochez-vous du micro et réessayez.",
          ],
          [
            "Aucun micro trouvé",
            "Branchez un micro ou un casque, puis réessayez.",
          ],
          [
            "Brave ne transcrit pas la voix",
            "Brave n’offre pas ce service : utilisez Chrome, Edge ou Safari pour dicter.",
          ],
        ]}
      />
      <H>Bon à savoir</H>
      <ul>
        <li>
          Le réglage est propre à chaque poste : un poste peut dicter, l’autre
          non. Il ne voyage pas avec la synchronisation.
        </li>
        <li>
          La langue est le français de Suisse (ou de France si le navigateur ne
          connaît que celui-ci).
        </li>
        <li>
          Sur téléphone Android, chaque appui sur le micro prend une phrase.
        </li>
        <li>
          Un bruit de fond fort (sirène, radio) gêne la reconnaissance : relisez
          toujours avant d’enregistrer.
        </li>
      </ul>
      <Faq q="La dictée enregistre-t-elle ma voix ?">
        Non. orion aic ne garde que le texte. Le son est traité par le
        navigateur, et dans Chrome ou Edge par les serveurs de Google ou de
        Microsoft.
      </Faq>
      <Faq q="Puis-je dicter hors ligne ?">
        Dans Chrome et Edge, non. Safari peut parfois transcrire sur l’appareil,
        selon la version du système.
      </Faq>
    </>
  ),
};
