import { Briefcase } from "lucide-react";
import type { Topic } from "./content";
import { H, Note, Path, Steps, Table, Ui } from "./kit";

// "PC en valise": orion aic without internet, served by a small computer
// with its own Wi-Fi. Long version: docs/PC-EN-VALISE.md.

const ADDRESS = "https://10.42.0.1:4443";

export const VALISE_TOPIC: Topic = {
  id: "valise",
  group: "together",
  title: "PC en valise (sans internet)",
  icon: Briefcase,
  hue: 38,
  short: (
    <p>
      Un petit ordinateur dans une valise crée <strong>son propre Wi-Fi</strong>
      . Les tablettes, téléphones et ordinateurs du PC s’y connectent et
      travaillent ensemble sur la même session, <strong>sans internet</strong>.
      Seuls manquent la recherche de lieu, la météo et les zones de carte jamais
      affichées.
    </p>
  ),
  guide: (
    <>
      <H>À l’arrivée sur place</H>
      <Steps>
        <li>
          Allumez le <strong>serveur</strong> de la valise (Raspberry Pi ou
          vieil ordinateur portable). Attendez une minute.
        </li>
        <li>
          Sur chaque appareil, connectez-vous au Wi-Fi du PC, par exemple{" "}
          <code>PC-ORION</code>. S’il annonce « pas d’internet », choisissez «
          rester connecté ». Sur un téléphone, coupez les données mobiles.
        </li>
        <li>
          Ouvrez l’icône orion aic de l’écran d’accueil, ou l’adresse de la
          fiche de la valise, par exemple <code>{ADDRESS}</code>. Le serveur
          l’affiche aussi en QR code.
        </li>
        <li>
          Un poste crée la session (
          <Path
            steps={["Réglages", "Synchronisation", "Créer un code de session"]}
          />
          ). Les autres choisissent <Ui>Rejoindre</Ui> et tapent le code, comme
          d’habitude.
        </li>
      </Steps>
      <H>La toute première fois sur un appareil</H>
      <Steps>
        <li>
          Le navigateur prévient : <em>certificat non reconnu</em>. C’est normal
          : le serveur a fabriqué son propre certificat.
        </li>
        <li>
          Ouvrez le détail du certificat et comparez l’
          <strong>empreinte SHA-256</strong> avec celle notée sur la fiche de la
          valise.
        </li>
        <li>
          Si c’est la même, continuez. Sinon, arrêtez-vous et prévenez la
          personne responsable du matériel.
        </li>
      </Steps>
      <Note kind="warn">
        Utilisez <strong>toujours la même adresse</strong>. Pour le navigateur,
        une autre adresse est un autre site : la sauvegarde du poste, les cartes
        préparées et le certificat accepté n’y sont pas.
      </Note>
      <Note kind="info">
        Le serveur ne garde aucune donnée : chaque poste a sa copie complète et
        chiffrée. Si le serveur s’éteint, on continue à travailler ; les postes
        se remettent à jour quand il revient.
      </Note>
    </>
  ),
  full: (
    <>
      <H>Ce qui marche sans internet</H>
      <Table
        head={["Fonction", "Sans internet"]}
        rows={[
          ["Journal, messages, moyens, équipe, radio, contacts, agenda", "Oui"],
          ["Synchronisation entre les postes du Wi-Fi", "Oui"],
          ["Impression, PDF, exports, sauvegarde chiffrée", "Oui"],
          ["Objets de la carte, import KML / KMZ / GeoJSON / GPX", "Oui"],
          [
            "Fond de carte",
            "Seulement les zones déjà affichées sur ce poste, à cette adresse",
          ],
          ["Recherche de lieu (geo.admin.ch)", "Non : tapez des coordonnées"],
          ["Météo (Open-Meteo)", "Non"],
        ]}
      />
      <H>Le matériel</H>
      <p>
        Prix indicatifs en Suisse (2026), payés par l’organisation. Aucun modèle
        n’est imposé.
      </p>
      <Table
        head={["Élément", "Pour quoi", "CHF"]}
        rows={[
          ["Raspberry Pi 5, 8 Go", "Le serveur", "95"],
          ["Alimentation officielle USB-C 27 W", "Sur le secteur", "15"],
          ["Boîtier avec ventilateur", "Protection, refroidissement", "15"],
          ["Carte microSD 64 Go A2", "Système et application", "15–20"],
          ["ou SSD (NVMe ou USB)", "Plus solide que la microSD", "40–60"],
          ["Pile RTC du Pi 5 (option)", "Garde l’heure sans internet", "5"],
          [
            "Routeur Wi-Fi de voyage (option)",
            "Plus d’appareils, portée",
            "40–90",
          ],
          ["Batterie USB-C PD 20 000 mAh, 27 à 45 W", "Sans secteur", "50–80"],
          [
            "Imprimante laser Wi-Fi (ou celle du PC)",
            "Fiches et rapports",
            "120–200",
          ],
          ["Câbles Ethernet et USB-C", "Préparation, branchements", "10–20"],
          ["Valise étanche avec mousse", "Transport", "50–150"],
          ["Étiquettes, fiche plastifiée", "Wi-Fi, adresse, empreinte", "10"],
        ]}
      />
      <p>
        Total : environ <strong>CHF 250</strong> (kit minimal) à{" "}
        <strong>CHF 750</strong> (SSD, routeur, imprimante, valise renforcée).
        Un <strong>vieil ordinateur portable</strong> fait aussi l’affaire, pour
        CHF 0 : il a déjà écran, batterie et Wi-Fi. Désactivez sa mise en
        veille.
      </p>
      <H>Installer le serveur (une fois, avec internet)</H>
      <Steps>
        <li>
          Avec Raspberry Pi Imager :{" "}
          <strong>Raspberry Pi OS Lite 64-bit</strong>, pays du Wi-Fi{" "}
          <code>CH</code>, utilisateur <code>orion</code>.
        </li>
        <li>
          Installez Node.js 22.18 ou plus récent, puis copiez orion aic (archive{" "}
          <code>/source/orion-aic-source.tar.gz</code> du site, ou git).
        </li>
        <li>
          Dans le dossier : <code>npm ci</code> puis <code>npm run lan</code>.
          Le serveur affiche ses adresses, l’empreinte du certificat et un QR
          code.
        </li>
        <li>
          Pour qu’il démarre tout seul avec le Pi : le service fourni{" "}
          <code>docs/orion-aic-lan.service</code>.
        </li>
      </Steps>
      <p>
        Le détail, commande par commande, est dans le guide{" "}
        <code>docs/PC-EN-VALISE.md</code> du code source.
      </p>
      <H>Le Wi-Fi du PC</H>
      <Table
        head={["Solution", "Pour qui", "Adresse type"]}
        rows={[
          [
            "Point d’accès du Raspberry Pi (nmcli)",
            "Une salle, une dizaine d’appareils",
            "https://10.42.0.1:4443",
          ],
          [
            "Routeur de voyage + serveur branché par câble",
            "Plus d’appareils, plusieurs locaux",
            "https://192.168.8.10:4443",
          ],
          [
            "Point d’accès mobile de Windows",
            "Vieux portable Windows, 8 appareils au plus",
            "https://192.168.137.1:4443",
          ],
        ]}
      />
      <p>
        Le Wi-Fi a un mot de passe d’au moins 12 caractères. Il décide qui peut
        atteindre le serveur ; le <strong>code de session</strong> décide qui
        peut lire les données.
      </p>
      <H>Préparer les cartes</H>
      <p>
        Chaque poste garde les tuiles de carte qu’il a déjà affichées, jusqu’à{" "}
        <strong>4 000</strong>. Il n’y a pas de bouton « télécharger » : on
        prépare un secteur en le parcourant.
      </p>
      <Steps>
        <li>
          Branchez le serveur sur internet par câble : les postes du Wi-Fi du PC
          ont alors internet <em>et</em> l’adresse du serveur.
        </li>
        <li>
          Sur chaque poste, ouvrez la <Ui>Carte</Ui> par l’adresse du serveur
          (pas par orionaic.xyz : ce serait un autre cache).
        </li>
        <li>
          Parcourez le secteur à chaque zoom utile, avec chaque fond utile, en
          laissant les images se charger. <Ui>Nuit</Ui> utilise les tuiles de la{" "}
          <Ui>Carte grise</Ui>.
        </li>
        <li>Débranchez internet et vérifiez que tout s’affiche.</li>
      </Steps>
      <Note kind="tip">
        Un secteur de 3 × 3 km, du zoom de la région jusqu’à celui du bâtiment,
        prend environ 1 100 tuiles par fond. Ensuite, évitez de naviguer
        ailleurs sur ce poste : les nouvelles tuiles chasseraient les anciennes.
      </Note>
      <H>Imprimer</H>
      <p>
        On imprime depuis le navigateur de chaque poste, pas depuis le serveur.
        Le plus simple : une imprimante Wi-Fi connectée au Wi-Fi du PC
        (AirPrint, IPP Everywhere), trouvée sans pilote par les tablettes et
        ordinateurs. Ou une imprimante USB sur un portable qui sert de poste
        d’impression.
      </p>
      <H>Courant et heure</H>
      <ul>
        <li>
          Le Pi 5 consomme 4 à 8 W : une batterie de 20 000 mAh tient environ 7
          à 12 heures (5 à 8 heures avec un routeur de voyage).
        </li>
        <li>
          Pour l’éteindre : <code>sudo poweroff</code> ou une pression courte
          sur son bouton, puis attendre la fin du clignotement vert. Ne pas
          arracher le câble.
        </li>
        <li>
          Les heures du journal viennent de chaque poste : vérifiez l’heure des
          tablettes. Sans internet, le Pi perd l’heure : une pile RTC la garde.
        </li>
      </ul>
      <H>Avant de partir</H>
      <ul>
        <li>Tout est chargé : batterie, tablettes, téléphones, portables.</li>
        <li>
          Essai complet sans internet : le Wi-Fi apparaît, l’adresse s’ouvre,
          deux postes se synchronisent.
        </li>
        <li>
          Chaque poste a ouvert l’adresse une fois et accepté le certificat.
        </li>
        <li>Les secteurs de carte sont préparés et vérifiés hors ligne.</li>
        <li>
          L’empreinte du certificat, le nom du Wi-Fi et l’adresse sont sur la
          fiche de la valise.
        </li>
        <li>Une impression d’essai est sortie ; papier et toner sont là.</li>
        <li>On sait qui crée la session et transmet le code sur place.</li>
      </ul>
      <H>Si ça ne marche pas</H>
      <Table
        head={["Problème", "Que faire"]}
        rows={[
          [
            "Avertissement de certificat à chaque fois",
            "Même adresse, toujours. Si l’empreinte a changé (certificat renouvelé), comparez-la avec le serveur puis acceptez de nouveau.",
          ],
          [
            "Connecté au Wi-Fi, mais la page ne s’ouvre pas",
            "Coupez les données mobiles ; tapez bien https:// et :4443.",
          ],
          [
            "Le Wi-Fi n’apparaît pas",
            "Pays du Wi-Fi CH sur le Pi ; redémarrez-le.",
          ],
          [
            "Poste « Seul » alors que d’autres travaillent",
            "Vérifiez le code de session ; rechargez la page. Rien n’est perdu.",
          ],
          [
            "Fond de carte absent",
            "Zone non préparée sur ce poste : travaillez avec les objets et les coordonnées.",
          ],
        ]}
      />
    </>
  ),
};
