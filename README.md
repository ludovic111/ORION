# orion aic

**L’aide à la conduite, tout relié.** Journal d’intervention, messages, carte de situation, moyens, équipe, réseau radio Polycom, contacts, météo et rythme de conduite pour la protection civile, dans une seule application web.
Locale et chiffrée, sans compte ni base de données, synchronisée en direct entre les postes d’un même poste de conduite, utilisable hors ligne.

- Production : <https://orionaic.xyz>
- Licence : AGPL-3.0-only (le code source complet est téléchargeable depuis l’application)
- Version : 2.0
- Documentation d’utilisation : dans l’application, module **Aide** (trois niveaux de détail).
- Une idée, un besoin, quelque chose à changer ? Écrire à <ludo47j@gmail.com> (aussi dans l’application : menu opérateur → « Une idée, un besoin ? »).

> Logiciel indépendant. Aucune affiliation, homologation ni approbation de l’OFPP, de l’OCPPAM ou de l’État de Genève. L’emploi de données réelles exige un poste, une installation et une autorisation de l’organisation.

---

## Sommaire

1. [Principe](#principe)
2. [Démarrage rapide](#démarrage-rapide)
3. [Les modules](#les-modules)
4. [Tout est relié](#tout-est-relié)
5. [Travailler à plusieurs postes](#travailler-à-plusieurs-postes)
6. [Impression automatique](#impression-automatique)
7. [Référentiels et réglages](#référentiels-et-réglages)
8. [Session et stockage](#session-et-stockage)
9. [Journal d’intervention](#journal-dintervention)
10. [Plan du réseau radio](#plan-du-réseau-radio)
11. [Téléphone, tablette et QR codes](#téléphone-tablette-et-qr-codes)
12. [Présenter, remonter le temps, exporter](#présenter-remonter-le-temps-exporter)
13. [Sécurité](#sécurité)
14. [Limites](#limites)
15. [Installation et hébergement](#installation-et-hébergement)
16. [Développement](#développement)
17. [Structure du code](#structure-du-code)
18. [Sources métier](#sources-métier)

---

## Principe

| Aspect           | Fonctionnement                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Unité de travail | Une **session** par événement. Elle contient un ou plusieurs **journaux** (intervention, exercice).                   |
| Données          | Dans le navigateur de chaque poste, chiffrées. Elles ne quittent le poste que par un export ou la synchronisation.    |
| Serveur          | Sert les fichiers et relaie des messages chiffrés entre postes. Aucune base de données, rien n’est stocké.            |
| Identité         | L’opérateur déclare son nom ou sa fonction. Aucun compte, aucune authentification.                                    |
| Plusieurs postes | Un **code de session** relie les postes : tout se synchronise en direct, chiffré de bout en bout.                     |
| Transfert        | Archive `.orionaic` chiffrée, réimportable, avec fusion contrôlée (les anciennes archives `.orion` restent lisibles). |
| Hors ligne       | Après un premier chargement, l’application, les signes et les tuiles de carte déjà vues restent disponibles.          |
| Tout facultatif  | Chaque module et chaque champ est facultatif, modifiable et supprimable. Les modules inutiles peuvent être masqués.   |

## Démarrage rapide

1. Ouvrir <https://orionaic.xyz>.
2. **Nouvelle session** : nom de l’événement, opérateur, mode (Exercice / Intervention). Laisser **Sauvegarde chiffrée sur ce poste** cochée et choisir une phrase de récupération (12 caractères minimum, irrécupérable).
3. La page **Situation** s’ouvre : renseignements clés, points ouverts, moyens, météo, prochains rapports. Le dock à gauche donne accès à tous les modules ; `⌘K` / `Ctrl+K` cherche partout et lance n’importe quelle action.
4. Consigner au **Journal**, recevoir et synthétiser dans **Messages**, dessiner la **Carte**, tenir les **Moyens** et l’**Équipe**.
5. Pour travailler à plusieurs : menu opérateur → **Synchronisation** → **Créer un code de session**, puis sur les autres postes **Rejoindre** avec ce code (ou le QR code).
6. **Exporter** régulièrement une archive `.orionaic`. En fin d’engagement : clôturer le journal, exporter, puis **Session → Effacer la session**.

Le bouton **Ouvrir l’exercice de démonstration** charge un scénario fictif complet (« Crue de l’Arve ») avec tous les modules remplis et reliés, sans toucher aux données locales.

## Les modules

| Module                 | À quoi il sert                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Situation**          | Accueil. Renseignements clés modifiables (+/−), tableaux de situation (situation générale, dangers, intention, points ouverts), échéances, derniers messages, moyens par état, présences, radios, rendez-vous, météo, réseau, listes de contrôle, demandes de moyens, temps de service.                                                                                                                                                                                                                                                                                    |
| **Journal**            | Registre chronologique numéroté : saisie rapide, modèles, suivi, échéances, versions, fiches A4, rapport de situation, relève (détail ci-dessous).                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Messages**           | Réception et synthèse des messages avant le journal : saisie standardisée (De, À, canal, priorité, catégorie en un clic, texte libre toujours possible), tableau Nouveau → En traitement → Transmis → Classé, **Inscrire au journal** (entrée préremplie et reliée), formule de message A4.                                                                                                                                                                                                                                                                                |
| **Missions**           | Tableau des entrées à suivre (À traiter, En cours, Terminé, Annulé) par glisser-déposer, filtres par type et responsable, retards, report d’échéance, suites.                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Listes de contrôle** | Listes par type d’événement (crue, black-out, canicule, accident ABC, tempête, séisme, recherche de personne, accueil d’évacués, ouverture du PC) : étapes avec fonction responsable et minuterie de contrôle, cocher = qui et quand, entrée au journal pour les étapes clés, contrôle « à traiter » à échéance. Modèles modifiables, duplicables, masquables, créés par le journal.                                                                                                                                                                                       |
| **Carte**              | Plusieurs cartes (suivi général, secteur détaillé…), fonds swisstopo (couleur, gris, aérien, nuit) et OpenStreetMap, 268 signes civils OFPP et plus de 100 marqueurs simples sur fond transparent, taille et rotation à la souris ou au doigt, signes personnalisés (fond effacé automatiquement), lignes, zones, **périmètres circulaires** (centre + rayon : 50 m à 1 km en un clic), textes, dessin libre, mesures, MN95, **cadenas** contre les déplacements accidentels, import KML/GeoJSON/GPX, calques. Au **survol**, chaque objet montre tout ce qui lui est lié. |
| **Moyens**             | Véhicules, personnel et matériel par état (Disponible, Alerté, En route, Engagé, De retour, Hors service), glisser-déposer, arrivée prévue, consignation des changements, placement sur la carte, tableau A4. Onglet **Demandes** : demandé → accordé / refusé → en route → arrivé → libéré, arrivée prévue avec retard signalé, chaque étape au journal, moyen créé ou rattaché à l’arrivée.                                                                                                                                                                              |
| **Équipe**             | Postes et cellules (PC front, PC arrière, cellules…) et personnes (grade, nom, fonction, nom d’appel, téléphone, présence, horaires) en organigramme ou en liste, impression A4. Vue **Présences** : arrivées et départs (bouton ou badge QR), temps de service, repos trop court, plan de relève, liste de présence et badges A4.                                                                                                                                                                                                                                         |
| **Réseau radio**       | Plan Polycom : groupes, noms d’appel, terminaux, remises et retours, quittances, contrôles de liaison, étiquettes QR (détail ci-dessous).                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Contacts**           | Annuaire par catégories, favoris, appel en un clic sur téléphone, numéros d’urgence suisses en un clic, import vCard / CSV, export CSV, impression.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Météo**              | Prévisions MétéoSuisse (ICON-CH via Open-Meteo, sur demande), graphique 48 h, trois jours, observations sur place, alertes de danger degré 1 à 5 ; chaque prévision reçue est gardée (« à 14 h, on annonçait… »). **Seuils** du journal (rafales, pluie 1 h / 24 h, températures) : alerte créée une fois par seuil et par jour, entrée à traiter facultative.                                                                                                                                                                                                             |
| **Rythme de conduite** | Rapports, orientations, relèves et rendez-vous avec compte à rebours ; génération d’un rythme (« toutes les 4 h »), consignation au journal, impression, **point de situation préparé** avant chaque rapport, **rappels** d’export et d’impression.                                                                                                                                                                                                                                                                                                                        |
| **Réseau des liens**   | Graphe animé de tous les éléments et de leurs liens, « comme un réseau de neurones » : survol, filtres, recherche, ajout de liens.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Traçabilité**        | Qui a fait quoi et quand, versions de tout, comparaison de deux moments, points figés, registres des exports et des présentations, vérification d’un document.                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Aide**               | Documentation intégrée pour tous, en trois niveaux : En bref, Guide, Tout le détail. Chaque module a son bouton « ? ».                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Tout est relié

Chaque élément (entrée, message, objet de la carte, moyen, personne, poste, contact, rendez-vous, renseignement, alerte, terminal, nom d’appel, groupe radio) peut être relié à n’importe quel autre.

- **Liens automatiques** : même nom d’appel ; émetteur, destinataire ou responsable qui correspond à une personne, un poste, un moyen ou un contact ; références `#012` entre entrées ; message inscrit au journal ; membre d’un poste ; groupe principal d’un nom d’appel ; terminal remis.
- **Liens manuels** : bouton **Lier** dans chaque fiche, avec une nature facultative (« position », « demandé par »…). Un lien manuel se retire d’un clic.
- **Actions reliées** : « Inscrire au journal » relie l’entrée au message ; « Placer sur la carte » relie l’objet au moyen ou au message.
- Partout, une puce de lien montre un **aperçu au survol** (l’élément et ses propres liens) et ouvre l’élément au clic. Sur la carte, survoler un véhicule montre le message, l’entrée et les moyens liés.
- Le module **Réseau des liens** montre l’ensemble.

## Travailler à plusieurs postes

Sans compte ni base de données : chaque poste garde une copie complète de la session, les postes s’échangent leurs modifications.

1. Poste A : menu opérateur → **Synchronisation** → **Créer un code de session** (format `ABCD-EFGH-JKMN-PQRS`). Un QR code et un lien s’affichent.
2. Poste B : page d’accueil → **Rejoindre** → saisir le code (ou scanner le QR) et son nom. La session arrive, puis tout reste synchronisé en direct : journal, messages, carte, moyens, équipe, radio, référentiels…
3. La puce en haut indique `Seul`, `3 postes` (avec qui travaille sur quel module), `Reconnexion` ou `Recharger` (un poste utilise une autre version d’orion aic). Un chiffre à côté signale des fusions à voir (Réglages → Synchronisation → Fusions entre postes).

| Question                              | Réponse                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Où passent les données ?              | Par le relais du site (`/sync`), **chiffrées de bout en bout** (AES-256-GCM, clé dérivée du code). Le relais ne voit que des messages illisibles et ne garde rien.                                                                                                                                      |
| Et sans internet ?                    | Mode réseau local : sur un ordinateur du poste de conduite, `npm run lan` sert l’application en HTTPS sur le Wi-Fi / réseau ; les autres postes ouvrent l’adresse affichée.                                                                                                                             |
| Un poste perd la connexion ?          | Il continue à travailler et garde ses changements ; à la reconnexion, il les envoie, puis les postes comparent leurs empreintes et s’échangent seulement ce qui manque à chacun.                                                                                                                        |
| Deux postes modifient la même chose ? | Journal : les deux versions sont gardées. Autres éléments : la modification faite en dernier l’emporte, dans l’ordre réel des événements et non selon l’horloge des postes ; une suppression l’emporte sur une modification antérieure. Les cas simultanés sont listés dans Réglages → Synchronisation. |
| Deux entrées avec le même numéro ?    | Deux postes ont saisi au même moment : aucune n’est renumérotée. La première garde `#007`, l’autre devient `#007·B` (lettre propre au poste). Un numéro affiché ou imprimé ne change jamais en silence. Idem pour les messages (`M013·B`).                                                              |
| Bluetooth ?                           | Les navigateurs ne permettent pas ce mode d’échange ; le Wi-Fi local (`npm run lan`) le remplace.                                                                                                                                                                                                       |
| Sécurité du code ?                    | Le code est un mot de passe : il donne accès à toute la session. Le transmettre sur place ou par un canal sûr.                                                                                                                                                                                          |

Les réglages du poste (thème, modules affichés, impression automatique) restent propres à chaque poste.

## Impression automatique

- Sous le formulaire du journal : **Impression automatique**. Chaque entrée consignée part aussitôt à l’impression (fiche message A4). Désactivable à tout moment.
- Réglages → Ce poste : imprimer aussi **les entrées des autres postes** (un poste d’impression central) et **chaque nouveau message** reçu (formule de message A4).
- Le navigateur affiche sa fenêtre d’impression à chaque fiche. Pour imprimer sans fenêtre, lancer Chrome ou Edge avec `--kiosk-printing` et choisir l’imprimante par défaut du système :
  - Windows : `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing https://orionaic.xyz`
  - macOS : `open -a "Google Chrome" --args --kiosk-printing https://orionaic.xyz`

## Référentiels et réglages

- **Référentiels** (menu opérateur) : les valeurs standards proposées en un clic — destinataires et émetteurs (PC front, PC arrière, chef d’intervention…), catégories de message, canaux, types de poste, grades, fonctions, types de moyens, organisations, catégories de contact, types de rendez-vous, calques de carte, catégories de renseignements. Chaque liste est modifiable ; « Rétablir les valeurs standards ». Tout champ accepte aussi du texte libre. Les référentiels font partie du journal (synchronisés, archivés).
- **Ce poste** : mode clair, sombre ou comme le système, avec un thème de couleur par mode (voir ci-dessous) ; animations réduites ; impression automatique ; modules affichés ou masqués.

### Thèmes de couleur

Chaque poste choisit un thème clair et un thème sombre ; le bouton soleil / lune passe de l’un à l’autre, la recherche (`⌘K`, « thème ») les essaie directement.

| Thème               | Mode   | Pour quoi                                                                                    |
| ------------------- | ------ | -------------------------------------------------------------------------------------------- |
| **Papier**          | clair  | Par défaut : crème chaude, encre graphite, un seul point orange pour ce qui est en direct.   |
| **Ardoise**         | clair  | Gris bleuté et encre marine, plus froid, reposant sous éclairage néon.                       |
| **Signal PC**       | clair  | Bleu et orange du signe international de la protection civile.                               |
| **Contraste élevé** | clair  | Noir pur sur blanc pur, bordures épaisses, focus jaune : plein soleil, vue fatiguée.         |
| **Graphite**        | sombre | Le papier après la tombée de la nuit.                                                        |
| **Minuit**          | sombre | Bleu nuit profond, encre claire, pour une salle de conduite sombre.                          |
| **Nuit tactique**   | sombre | Tout en rouge sur noir, carte et signes compris : préserve la vision de nuit sur le terrain. |

- **Session et journal** : propriétés du journal (toutes modifiables), opérateur, sauvegarde chiffrée, clôture et réouverture, effacement de la session.
- **Retirer un journal** de la session : menu du titre du journal.

## Session et stockage

| Mode                | Stockage                                            | Survit à la fermeture de l’onglet | Remarque                                         |
| ------------------- | --------------------------------------------------- | --------------------------------- | ------------------------------------------------ |
| Sauvegarde chiffrée | IndexedDB `orion-journal-v1`, enveloppe AES-256-GCM | Oui                               | Déverrouillage par la phrase de récupération     |
| Temporaire          | Mémoire de l’onglet                                 | Non                               | Avertissement avant fermeture. Exporter souvent. |

- Chaque modification est sauvegardée 250 ms après la dernière frappe, brouillon de nouvelle entrée compris.
- Un verrou Web Locks empêche d’ouvrir la même session sauvegardée dans deux onglets.
- **Verrouiller** (menu opérateur) retire la session de la mémoire ; elle reste chiffrée sur le poste.
- **Session → Effacer la session** efface la sauvegarde locale. Cette action exige au préalable une archive orion aic ou JSON récente de chaque journal, puis la saisie de `TERMINER`.
- Phrase perdue : l’écran d’accueil propose d’effacer l’espace local (saisie de `EFFACER`). Les données ne sont alors récupérables que depuis une archive.

La barre supérieure indique en permanence : la synchronisation (`Seul`, `N postes`, `Reconnexion`), l’état de sauvegarde (`Chiffré`, `Temporaire`, `Échec sauvegarde`), le mode hors ligne et l’heure suisse.

## Journal d’intervention

### Champs d’une entrée

| Groupe               | Champs                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Essentiel            | Nature, priorité, **message** (obligatoire), heure de l’événement, émetteur                   |
| Transmission et lieu | Canal, confirmation, destinataire, lieu / secteur, coordonnées (ex. MN95), heure de réception |
| Conduite et suivi    | Mesure / décision / mission, suivi, responsable, échéance, moyens engagés / besoins           |
| Compléments          | Référence / entrée liée, observations, mots-clés (20 max.)                                    |
| Automatique          | Numéro stable (`#001`…), auteur, heure d’enregistrement, historique des versions              |

Valeurs fixes :

- **Nature** : Renseignement, Décision, Mission, Demande, Quittance, Observation, Relève
- **Priorité** : Normal, Important, Urgent
- **Suivi** : Consigné, À traiter, En cours, Terminé, Annulé
- **Canal** : Radio, Téléphone, Sur place, E-mail, Message, Autre
- **Confirmation** : Non confirmé, Confirmé, À vérifier

Trois instants distincts sont conservés : **événement** (quand les faits se sont produits), **réception** (quand l’information est arrivée) et **enregistrement** (horodatage automatique). Les heures sont saisies dans le fuseau du poste et affichées en Europe/Zurich.

### Consultation

- Filtres : Tout, À suivre (À traiter / En cours), Urgent, Décisions.
- Recherche plein texte insensible aux accents sur tous les champs (champ du journal) ; `⌘K` / `Ctrl+K` cherche dans tous les modules.
- Filtre par jour, tri chronologique ou antéchronologique, regroupement par jour.
- Indicateurs : entrées, suites à donner, échéances dépassées, urgences, radios en service, état de l’archive.
- Détail d’une entrée : clic sur le message. Actions : Fiche A4, Modifier, Consigner une suite, Terminer le suivi, Versions, Supprimer.
- **Consigner une suite** prépare une Quittance adressée à l’émetteur, avec la référence de l’entrée d’origine.

## Saisie rapide et suivi

### Noms d’appel proposés

Les champs **Émetteur**, **Destinataire** et **Responsable** proposent, dès les premières lettres, les noms d’appel du plan radio puis les émetteurs, destinataires et responsables déjà saisis dans le journal (les plus récents d’abord). Un clic ou `↓` + `↵` complète le champ.

### Modèles de messages

Au-dessus du formulaire, six modèles préremplissent la nature, la priorité, le suivi et un canevas de message. Le curseur se place sur la première rubrique à compléter. Si un message est déjà en cours, une confirmation est demandée.

| Modèle              | Nature        | Suivi / priorité      | Canevas                                                                 |
| ------------------- | ------------- | --------------------- | ----------------------------------------------------------------------- |
| Point de situation  | Renseignement | —                     | Situation, mesures prises, moyens engagés, besoins, prochain point      |
| Demande de moyens   | Demande       | À traiter · Important | Moyens, quantité, lieu de livraison, délai, motif (demande d’aide OFPP) |
| Mission             | Mission       | À traiter             | Mission ; mesure « Quittancer l’exécution au PC »                       |
| Décision            | Décision      | En cours · Confirmé   | Décision                                                                |
| Quittance           | Quittance     | Confirmé              | Quittance ; référence « Suite de # » à compléter                        |
| Contrôle de liaison | Observation   | Canal Radio · `radio` | Contrôle de liaison                                                     |

### Entrées liées et fil

- Une entrée en cite une autre en indiquant son numéro dans **Référence / entrée liée** : `Suite de #003`, `#012, #014`. « Consigner une suite » le fait automatiquement.
- La ligne du journal affiche un badge `↳ #003`.
- Le détail d’une entrée montre le **fil** : toutes les entrées reliées, directement ou de proche en proche (demande → mission → quittance), dans l’ordre chronologique, cliquables.
- Les numéros étant propres à chaque journal, un lien vers une entrée renumérotée lors d’une fusion est à vérifier.

### Clore une mission par sa quittance

À l’enregistrement d’une **Quittance** qui cite des entrées encore à suivre (À traiter / En cours), un bandeau propose : « Quittance #007 : clore #003 … ? **Marquer terminé** ». Accepter passe ces entrées en Terminé, avec le motif « Clos par la quittance #007 » dans leur historique. « Ignorer » ne change rien.

### Échéances et alarme

- Au-dessus des indicateurs, un bandeau liste les échéances **dépassées** (rouge) et celles des **15 prochaines minutes** (orange) : numéro, message, heure, retard ou délai restant, responsable.
- Actions directes : **+15 min** (reporte l’échéance de 15 minutes après maintenant ou après l’échéance si elle est plus tardive, motif consigné), **Terminé**, ou clic pour ouvrir l’entrée. Le détail d’une entrée à suivre propose aussi « Échéance +15 min ».
- Le titre de l’onglet affiche le nombre d’échéances dépassées : `(3) orion aic`, visible même quand l’onglet est en arrière-plan.
- **Alarme sonore** (icône cloche) : deux bips quand une nouvelle échéance est dépassée. Désactivée par défaut ; le réglage est mémorisé sur ce navigateur. Le navigateur exige un clic pour autoriser le son, d’où l’activation manuelle.
- Les échéances sont vérifiées toutes les 30 secondes.

## Modifier et supprimer une entrée

Chaque ligne du journal porte deux icônes : **crayon** (modifier) et **corbeille** (supprimer). Les mêmes actions existent dans le détail de l’entrée. Elles sont masquées quand le journal est clôturé.

### Modifier

- Tous les champs sont modifiables.
- Le **motif** est facultatif ; sans motif, « Modification par l’opérateur » est enregistré.
- La version précédente est conservée : bouton **N versions** du détail, avec auteur, heure et motif de chaque version. La ligne affiche `v2`, `v3`…
- Pour invalider une information sans la retirer, passer le suivi à **Annulé** : l’entrée reste lisible, barrée.

### Supprimer

- Exige un **motif** (ex. « Saisie en double », « Mauvais journal »).
- Le contenu et tout l’historique de l’entrée sont effacés du journal.
- Il reste une **trace** : numéro, heure, auteur et motif, consultables via le lien « N supprimée(s) » en bas du tableau.
- Le numéro n’est **jamais réattribué** : l’entrée suivante continue la numérotation.
- En fusion, une entrée supprimée n’est pas réintroduite par une ancienne archive, et une suppression faite sur un autre poste s’applique ici.
- Les archives exportées **avant** la suppression contiennent toujours l’entrée : les détruire si nécessaire.

## Fiches message A4

Une fiche par entrée, format A4 portrait, pensée pour l’archivage papier et la signature.

| Section        | Contenu                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| En-tête        | Journal, organisation, lieu, référence, mode (Exercice / Intervention), diffusion |
| Identification | Numéro, nature, priorité (fond rouge si urgent), suivi                            |
| Transmission   | Événement, réception, enregistrement, canal, émetteur, destinataire               |
| Message        | Texte intégral                                                                    |
| Localisation   | Lieu, coordonnées, confirmation                                                   |
| Conduite       | Mesure / décision / mission, responsable, échéance, suivi, moyens                 |
| Compléments    | Référence, mots-clés, observations                                                |
| Traçabilité    | Saisi par, version, dernière modification et motif, origine, identifiant          |
| Visa           | Cases vierges : traité par, date / heure, signature                               |
| Pied de page   | Journal, numéro, date d’édition, pagination                                       |

Accès :

- **Une entrée** : détail → **Fiche A4**.
- **Plusieurs entrées** : cocher les lignes (ou la case d’en-tête pour tout ce qui est affiché) → **Fiches A4**.
- **Tout le journal** : Exporter → **Fiches messages A4**.

L’aperçu montre les pages réelles. **Imprimer** utilise l’impression du navigateur (marges à zéro, une fiche par page). **PDF** produit un fichier vectoriel (polices IBM Plex intégrées). Un texte long se poursuit sur la page suivante avec la mention « (suite) ». Une entrée modifiée ou annulée porte un bandeau le signalant.

## Plan du réseau radio

Module **Réseau radio**. Le plan fait partie du journal : il est sauvegardé, archivé, fusionné et clôturé avec lui.

### Groupes et canaux

| Champ       | Détail                                                         |
| ----------- | -------------------------------------------------------------- |
| N°          | Ex. `G101` (talkgroup), `D481` (mode direct), `R395` (relais)  |
| Mode        | Groupe (TKG), Direct (DMO), Relais (IDR)                       |
| Désignation | Ex. « PCi Conduite »                                           |
| Emploi      | Conduite, Engagement, Logistique, Coordination, Appel, Réserve |

Un groupe utilisé par un contrôle de liaison ne peut pas être supprimé.

### Noms d’appel

Le nom d’appel désigne **la fonction, jamais la personne** (règle OFPP). Champs : nom d’appel (unique), fonction, section, groupe principal, alternative, remarques (ex. station de transit).

Le **schéma de liaisons** affiche une colonne par groupe. Sous chaque groupe : les noms d’appel qui l’ont en principal (témoin vert si un terminal leur est remis, note du dernier contrôle) et, en pointillé, ceux qui l’ont en alternative.

### Terminaux

| Champ       | Détail                                          |
| ----------- | ----------------------------------------------- |
| N° interne  | Ex. `R-01`, unique                              |
| RFSI        | Identifiant Polycom du terminal                 |
| Modèle      | TPH900, TPH700, TPM700, G2 Smart ou libre       |
| Type        | Portatif, Véhicule, Fixe                        |
| N° de série | Libre                                           |
| État        | Opérationnel, À recharger, Défectueux, Manquant |

**Série** crée d’un coup `R-01` à `R-20` (préfixe, premier numéro, nombre, modèle), en ignorant les numéros existants. Un terminal ayant déjà été remis ne peut pas être supprimé : le passer en Défectueux ou Manquant.

Barre d’outils de l’onglet Terminaux :

- **Non rendues** : n’affiche que les terminaux en service (inventaire de fin d’engagement).
- **Scanner** : ouvre la remise ou le retour d’un terminal par son QR code ou son numéro (voir [Téléphone, tablette et QR codes](#téléphone-tablette-et-qr-codes)).
- **Étiquettes** : planche A4 d’étiquettes QR à coller sur les radios.
- **Batteries** : un terminal remis depuis **8 heures ou plus** porte le badge `> 8 h` ; l’indicateur « Batteries > 8 h » les compte.

### Remises et retours (« qui a quelle radio »)

- **Remettre** : terminal, heure, nom d’appel (proposé depuis le plan, fonction et section préremplies), détenteur (grade, nom), accessoires (batterie de rechange, microtel, adaptateur FUGA, chargeur, antenne, housse), état de la batterie, remarques.
- Un terminal Défectueux ou Manquant ne peut pas être remis. Un terminal déjà remis doit d’abord être rendu.
- **Retour** : heure, état au retour, retour complet ou non (sinon la liste des accessoires remis est notée), remarques. Un retour Manquant rappelle d’annoncer la perte pour blocage.
- Option **Consigner au journal** (cochée par défaut) : la remise ou le retour crée une entrée Observation, mot-clé `radio`.
- Option **Imprimer la quittance de remise à signer** : ouvre la quittance A4 dès l’enregistrement.
- L’onglet **Remises** liste tout l’historique, du plus récent au plus ancien ; les remises en cours sont marquées « En cours ».

### Quittance de remise A4

Icône imprimante sur chaque terminal (dernière remise) et sur chaque ligne de l’onglet Remises. La quittance porte : terminal (n° interne, type, n° de série, RFSI, modèle), détenteur (grade et nom, nom d’appel, fonction, section, groupe principal), remise (heure, remettant, batterie, état), **accessoires remis avec une case à cocher chacun**, remarques, zone de retour (heure, reçu par, état, complet oui / non, vierge tant que le terminal n’est pas rendu), et trois signatures : détenteur à la remise, remettant, détenteur au retour. Aperçu, impression ou PDF.

### Contrôles de liaison

Nom d’appel, groupe ou canal, heure, remarques et audibilité selon l’aide-mémoire OFPP : **THREE** (bon), **TWO** (faible mais compréhensible), **ONE** (insuffisant), ou pas de liaison. Option de consignation au journal.

**Contrôle général** (onglet Contrôles) : l’appel de tous les noms d’appel du plan, dans l’ordre, pour la mise en service du réseau.

- Choisir le groupe (par défaut le groupe principal de chaque station).
- Pour chaque station, un clic sur **3**, **2**, **1** ou **✕** (pas de liaison) ; un second clic annule. Le titulaire et le terminal de chaque station sont affichés ; « Hors réseau » signale une station sans terminal remis.
- **Enregistrer** crée un contrôle par station notée (heure commune, remarque « Contrôle général »). Les stations non notées sont ignorées.
- Option (cochée) : une entrée de synthèse au journal, par exemple « Contrôle de liaison général : 5 stations », avec en observations la liste par audibilité ; priorité Important si une liaison est insuffisante ou nulle.

### Impression

**Plan A4** (en-tête du module) ou Exporter → **Plan du réseau radio** : A4 paysage avec plan du réseau (nom d’appel, fonction, section, titulaire, terminal et RFSI, principal, alternative, sur le réseau, dernier contrôle), groupes, terminaux, registre des remises et contrôles.

## Rapport de situation

Bouton **Rapport** (journal). Choisir la période : 1 h, 4 h, 12 h, 24 h, Tout, ou début et fin libres. Option : chronologie complète. Aperçu A4 portrait, impression ou PDF.

| Section                   | Contenu                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Synthèse                  | Entrées, décisions et missions, demandes, urgences sur la période ; points ouverts, échéances dépassées, radios en service, liaisons faibles |
| Faits marquants           | Entrées de priorité Importante ou Urgente                                                                                                    |
| Décisions et missions     | Heure, numéro, texte et mesure, responsable, suivi                                                                                           |
| Demandes                  | Heure, numéro, demande, moyens / besoins, suivi                                                                                              |
| Points ouverts            | Toutes les entrées à suivre **à la fin de la période**, échéances dépassées signalées                                                        |
| Moyens engagés et besoins | Entrées renseignant des moyens, avec lieu                                                                                                    |
| État radio                | Terminaux remis (batterie à contrôler signalée), contrôles de liaison ONE ou nuls de la période                                              |
| Chronologie (option)      | Toutes les entrées de la période                                                                                                             |

La période porte sur l’**heure de l’événement**. Les textes longs sont abrégés à 280 caractères (400 dans la chronologie) ; les fiches A4 donnent le texte intégral.

## Relève

Bouton **Relève** : suites à donner, échéances dépassées, informations à confirmer, terminaux remis (détenteur, nom d’appel, heure), et **« Que s’est-il passé depuis HH:MM ? »** : nouvelles entrées par nature, décisions, messages reçus et traités, missions ouvertes et closes, changements de moyens, demandes de moyens, étapes cochées, alertes météo, retards et points ouverts. Le résumé est calculé à partir de l’historique (déterministe, sans IA), imprimable et copiable. **Consigner la relève** prépare une entrée de nature Relève avec ces chiffres ; **Consigner avec le résumé** y ajoute le résumé. Pour un autre poste : archive `.orionaic` et phrase transmise par un canal séparé.

## Suivi de la conduite

- **Listes de contrôle** (module Listes) : neuf modèles livrés pour un PC cantonal de protection civile, chaque étape avec une fonction responsable et, si utile, un « contrôle dans X min ». Cocher une étape note qui et quand ; les étapes clés s’écrivent au journal ; une minuterie crée une entrée à traiter à échéance. Chaque coche est un enregistrement à part : deux postes peuvent cocher en même temps. Avancement sur la page Situation.
- **Demandes de moyens** (Moyens → Demandes) : cycle demandé → accordé / refusé → en route → arrivé (→ libéré), demandeur, organisation sollicitée, quantité et type (référentiels), arrivée prévue avec retard signalé ; chaque étape est consignée (suite de l’entrée de la demande, close à la fin) ; à l’arrivée, le moyen est créé ou rattaché.
- **Présences et relève** (Équipe → Présences) : pointage par bouton ou badge QR (planche A4 de badges, lecteur de QR de l’application ou appareil photo du téléphone), temps de service, alerte au-delà du service maximum (12 h par défaut) ou d’un repos trop court (8 h), plan de relève en heure de Zurich (exact aux changements d’heure), liste de présence A4.
- **Point de situation préparé** (Situation, ou à côté de chaque rapport de conduite dans l’agenda) : brouillon composé des renseignements clés, moyens engagés, missions ouvertes et en retard, listes, demandes, météo et alertes depuis le dernier rapport ; modifiable, imprimable, à consigner, à enregistrer comme tableau ou à figer.
- **Seuils météo** (Météo) : évalués sur chaque prévision reçue (48 h) ; un seuil franchi crée une alerte et, si demandé, une entrée à traiter, une seule fois par seuil et par jour, avec des identifiants dérivés du seuil et du jour : deux postes créent la même alerte, fusionnée en une.
- **Rappels** (Agenda) : « toutes les 2 h, exporter l’archive », « 30 min avant chaque rapport, imprimer la situation » ; l’encart propose l’action en un clic ; un export ou une impression du centre d’export (registre des exports) le marque fait. Planifié dans la page, sans serveur.

## Téléphone, tablette et QR codes

### Installer l’app

Menu opérateur → **Installer l’application**. Sur Chrome, Edge, Brave et Android, le navigateur propose l’installation directement ; sinon une aide s’affiche :

- iPhone / iPad : Safari → Partager → « Sur l’écran d’accueil » ;
- Android : Chrome → ⋮ → « Installer l’application » ;
- ordinateur : icône d’installation dans la barre d’adresse.

L’app installée s’ouvre en plein écran, fonctionne hors ligne et a son icône. **Ses données sont propres à ce contexte** : une session ouverte dans Safari n’apparaît pas dans l’app installée (et inversement). Utiliser la synchronisation ou une archive `.orionaic`.

### Écran tactile

Sous 900 px de large, le dock passe en bas de l’écran. Boutons et champs sont agrandis (cibles de 40 px au moins, texte à 16 px pour éviter le zoom automatique d’iOS) et un **bouton rond +** ouvre une nouvelle entrée. Dans Contacts, les numéros s’appellent d’un toucher.

### Étiquettes et scan des radios

1. Réseau radio → Terminaux → **Étiquettes** : planche A4 de 21 étiquettes (3 × 7, 60 × 36 mm, traits de coupe) avec QR code, numéro, modèle et RFSI.
2. Coller une étiquette sur chaque radio.
3. **Scanner** :
   - dans orion aic (navigateurs compatibles avec la lecture de QR) : la caméra arrière s’ouvre et reconnaît l’étiquette ;
   - avec l’appareil photo du téléphone : le QR contient un lien `…/#scan=R-04` qui ouvre orion aic sur ce terminal ;
   - sinon : saisir le numéro (`R-04`, insensible à la casse).
4. orion aic ouvre directement la bonne action : **retour** si le terminal est en service, **remise** s’il est disponible ou à recharger, sa fiche s’il est défectueux ou manquant.

Pour rejoindre une session depuis un téléphone : scanner le QR code affiché dans Réglages → Synchronisation du poste qui partage.

## Présenter, remonter le temps, exporter

### Mode présentation et affichage mural

Bouton **Présenter la situation** (en haut à droite, ou `⌘K` → « Présenter ») : un écran de préparation (présentateur, public, version présentée, choix et ordre des diapositives), puis un diaporama plein écran construit à partir des données : titre, situation générale et intention, chiffres clés et leur évolution, chaque carte, ce qui a changé depuis le dernier point, faits marquants du journal, missions, moyens, organisation, radio, météo, échéances. Transitions et apparitions animées, stylo, surligneur et pointeur laser (souris, doigt, stylet), vue d’ensemble, écran noir, vue orateur dans une seconde fenêtre (notes, diapositive suivante, chronomètre), PDF des annotations. **Affichage mural** (`⌘K`) : rotation automatique, données en direct, horloge, fil du journal, écran maintenu allumé. Chaque présentation est inscrite au registre (qui, à qui, quand, quelle version).

### Traçabilité et versions

Chaque création, modification et suppression, dans tous les modules, est enregistrée avec son auteur, l’heure et l’état complet de l’élément ; l’historique est synchronisé et inclus dans les archives. Chaque fiche montre « Créé par … · modifié par … » et un bouton **Historique** (toutes les versions, champs modifiés, restauration d’une version antérieure, elle-même tracée). Le module **Traçabilité** liste qui a fait quoi (filtres par personne, module, action, période), compare deux moments (ajouts, modifications champ par champ, suppressions, cartes côte à côte, impression) et tient les registres des points figés, des exports et des présentations.

**Remonter le temps** (horloge en haut à droite) : toute l’application montre l’opération telle qu’elle était à l’heure choisie, en lecture seule (carte, moyens, journal dans ses versions d’alors, météo reçue à cette heure). **▶** rejoue l’opération changement par changement. **Figer un point de situation** donne un nom à un moment, repris ensuite par la comparaison, la présentation et l’export.

### Centre d’export

**Exporter (tous formats)** : trois choix — _quoi_ (toute l’opération, des parties, ou des éléments précis), _quand_ (maintenant, un point figé, une heure précise), _format_ — puis **Télécharger** ou **Imprimer**.

| Famille               | Formats                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Présentation          | PowerPoint `.pptx` animé (transitions, apparitions, notes), `.odp`, PDF diaporama, HTML diaporama  |
| Documents imprimables | PDF dossier (couverture, sommaire, chapitres, cartes), Word `.docx`, `.odt`, HTML, Markdown, texte |
| Impressions A4        | Fiches messages, journal en tableau, plan radio, étiquettes                                        |
| Tableurs et données   | Excel `.xlsx`, `.ods` (une feuille par partie), CSV, TSV, JSON                                     |
| Carte                 | PNG de chaque carte, GeoJSON, KML, GPX                                                             |
| Agenda et contacts    | `.ics`, vCard `.vcf`                                                                               |
| Archive               | `.orionaic` chiffrée et JSON, réimportables, historique compris                                    |
| Pack complet          | `.zip` des principaux formats avec la liste des empreintes                                         |

Filigrane automatique « EXERCICE » / « CONFIDENTIEL ». Chaque fichier porte une ligne d’identification et, quand la place le permet, un QR code ; il est inscrit au **registre des exports** avec son SHA-256. **Traçabilité → Exports → Vérifier un document** dit si un fichier reçu est authentique et intact.

**Import** (`.orionaic`, `.orion`, `.json`, `.csv`, `.tsv`, 32 Mo maximum) : fichier lu localement, aperçu avant toute modification, puis au choix :

- **Journal séparé** : le journal actuel reste intact ; l’opération importée se rejoue avec la machine à remonter le temps.
- **Fusionner** : ajoute les nouvelles entrées (renumérotées à la suite), ignore les doublons exacts, applique les suppressions, complète les remises radio clôturées ailleurs, combine les données des modules (la modification la plus récente l’emporte) et réunit les historiques. Deux versions divergentes d’une même entrée **bloquent** la fusion : importer alors en journal séparé pour comparer.

La carte importe aussi des fichiers **KML, KMZ, GeoJSON et GPX** reçus de partenaires (carte → `⋯` → Importer).

Sur la carte, un objet ne bouge que si on le glisse vraiment : un glissement de moins de 8 pixels, un deuxième doigt (pincer pour zoomer) ou un zoom pendant le glissement le remettent exactement à sa place ; sur écran tactile, il faut d’abord toucher l’objet pour le sélectionner. Le **cadenas** (sous le zoom) verrouille tous les objets de ce poste. Les tuiles déjà vues restent en cache ; si le fond manque, le bandeau distingue « hors ligne » (plus de réseau) de « le serveur du fond ne répond pas » (bouton Réessayer), et les tuiles se rechargent seules au retour du réseau.

Les anciens exports `orion-export-v1` (ORION 0.3) sont reconnus : seules les entrées de journal sont converties.

## Sécurité

- Chiffrement local : AES-256-GCM, IV aléatoire de 96 bits par écriture, clé dérivée par PBKDF2-SHA-256 (600 000 itérations, sel de 128 bits), clé non extractible. La phrase n’est jamais stockée.
- Synchronisation chiffrée de bout en bout avec une clé dérivée du code de session ; relais aveugle, en mémoire, sans stockage.
- Services externes facultatifs et à la demande : tuiles swisstopo / OpenStreetMap, recherche geo.admin.ch, prévisions Open-Meteo (coordonnées seulement). Ni compte, ni télémétrie, ni IA, ni police ou script externe. CSP stricte.
- Imports et données reçues validés par schéma strict (Zod), avec limites de taille ; formules neutralisées dans les exports tableurs ; HTML exporté sans script.
- Détails et limites : [SECURITY.md](SECURITY.md).

## Limites

- Les noms d’opérateur sont déclaratifs ; l’historique n’est pas une signature électronique.
- Le code de session donne accès à toute la session ; un poste retiré garde sa copie.
- Les conflits sont résolus dans l’ordre réel des événements (horloge logique hybride) : un poste en retard de quelques minutes ne perd plus ses modifications. Une heure très fausse (des heures d’écart) reste à corriger : elle s’affiche dans les heures des versions.
- Le plan radio documente le réseau ; il ne pilote pas les terminaux. Les numéros de groupes et RFSI réels viennent du plan de flotte cantonal. Ceux de la démonstration sont fictifs.
- Effacer les données du navigateur efface la sauvegarde locale. Une sauvegarde locale n’est pas une archive.
- Pas de pièces jointes binaires : noter leur référence.
- Limites techniques : 10 000 entrées par journal, 500 versions par entrée, message de 12 000 caractères, 1 000 terminaux, 20 000 messages, 5 000 objets de carte, import de 32 Mo. Les messages de synchronisation sont découpés en parts de 192 Ko (96 Mo compressés au plus par message).

## Installation et hébergement

Prérequis : Node.js 24 (minimum 22.18).

```sh
npm ci
npm run build
npm start
```

Ouvrir <http://127.0.0.1:4311>. Le serveur (`server/index.mjs`) sert `dist/` et le relais de synchronisation `/sync`. À servir en **HTTPS** ou sur `localhost` (Web Crypto et service worker l’exigent).

### Réseau local sans internet

```sh
npm ci
npm run lan
```

L’application est servie en HTTPS sur le port 4443 de toutes les interfaces, avec un certificat auto-signé créé dans `.lan/`. La console affiche les adresses (`https://192.168.x.x:4443`) et l’empreinte du certificat. Les autres postes du même réseau ouvrent l’adresse, acceptent le certificat une fois, puis rejoignent la session avec son code.

### Docker

```sh
docker build -t orion-aic .
docker run -p 4311:4311 orion-aic
```

### Railway (hébergement de production)

- Projet et service Railway `orion-aic`, construits depuis le `Dockerfile` de la branche **`main`** du dépôt `ludovic111/orion-aic` (réglages du service : constructeur Dockerfile, contrôle de santé, redémarrage en cas d’échec).
- Région **EU West (Amsterdam, `europe-west4-drams3a`)**, la plus proche de la Suisse parmi les régions Railway, réglée dans Settings → Scale. Une seule instance : le relais garde les salles en mémoire.
- Domaine : <https://orionaic.xyz> (et `www.orionaic.xyz`), DNS chez Porkbun : ALIAS `@` et CNAME `www` vers Railway, plus les enregistrements TXT `_railway-verify` de vérification. L’ancienne adresse `orion-web-production-1466.up.railway.app` reste active.
- **Chaque push sur `main` redéploie automatiquement.** Contrôle de santé : `/healthz`.
- Variables : `PORT=4311`, `HOST=0.0.0.0`. Aucun volume ni base de données.

Pour un autre hébergeur : servir `dist/` avec les en-têtes de [`public/_headers`](public/_headers) et relayer `/sync` vers `server/relay.mjs` (ou se passer de la synchronisation). La CSP doit autoriser les serveurs de tuiles dans `img-src` **et** dans `connect-src` : le service worker télécharge lui-même les tuiles pour les garder hors ligne, et sans `connect-src` toutes échouent (la carte affichait alors à tort « Fond indisponible hors ligne »).

## Développement

```sh
npm run dev           # serveur Vite sur http://127.0.0.1:4311
npm run check         # TypeScript
npm test              # tests Node (node:test)
npm run format:check  # Prettier
npm run build         # build de production + service worker
npm start             # serveur de production + relais
npm run lan           # réseau local en HTTPS
```

La CI GitHub (`.github/workflows`) exécute format, typecheck, tests, build, `npm audit` et le build Docker à chaque push. Guide du kit d’interface pour écrire un module : [docs/UI.md](docs/UI.md).

Tests couverts : modèle et révisions, suppression et numérotation, entrées liées et fil, clôture par quittance, relance d’échéance, modèles, batteries, QR et scan, rapport de situation, quittance de remise, fusion, plan radio, chiffrement, CSV/TSV, formats bureautiques, exports, serveur statique, **fusion de synchronisation** (propriétés commutative, associative et idempotente sur des postes aléatoires, horloges décalées de 5 minutes, numéros partagés et références, messages numérotés à la réception, journaux retirés puis réimportés, différences = tout, protocole avec pertes de messages), **coffre local** (compression, anciens coffres, taille), **images** gardées une fois et compaction de l’historique, **liens** explicites et implicites, **relais WebSocket** (salles, envoi à un seul poste, limites par adresse, trames trop grandes, poste qui ne lit pas, protocole 1 refusé), échange chiffré de bout en bout entre deux postes, **historique** (enregistrement, regroupement, fusion commutative, machine à remonter le temps, restauration), **formats géographiques** (aller-retour GeoJSON / KML / GPX), **exports** (dossier, formats bureautiques, agenda, contacts, empreintes), **présentations** (diapositives, PowerPoint et ODP bien formés).

## Structure du code

```
shared/            Modèle validé, sans dépendance au navigateur
  journal.ts       Journal, entrées, versions, suppressions, fusion, recherche
  ops.ts           Modules : messages, postes, personnes, moyens, contacts, carte, agenda,
                   renseignements, météo, liens, référentiels
  links.ts         Éléments, liens explicites et implicites, voisins, recherche
  sync.ts          Horodatage des changements, fusion de synchronisation, parts
                   manquantes (sliceJournal), empreintes, conflits
  hlc.ts stamps.ts Horloge logique hybride, horodatages et vecteurs de version
  protocol.ts      Décisions du protocole de synchronisation (hello, différences)
  blobs.ts hash.ts Images gardées une fois (SHA-256)
  tolerant.ts      Lecture des données d’une version plus récente
  events.ts        Schéma d’un changement (historique), compaction
  history.ts       Traçabilité : enregistrement, fusion, machine à remonter le temps,
                   comparaison de versions, restauration
  room.ts          Code de session, clé et salle (PBKDF2 + HKDF), trames chiffrées en parts
  radio.ts         Groupes, noms d’appel, terminaux, remises, contrôles, fusion radio
  workflow.ts      Entrées liées et fil, clôture par quittance, relance d’échéance, modèles
  interchange.ts   CSV/TSV, import JSON et ancien format, HTML, texte
  crypto.ts        Enveloppe chiffrée AES-GCM / PBKDF2, compressée (version 2)
  coordinates.ts   Conversion MN95 ↔ WGS84 (formules swisstopo)
src/
  App.tsx          Coque : dock, barre, palette ⌘K, dialogues, session, synchronisation
  app/             Contexte, modules, réglages du poste, thèmes de couleur (palettes.ts),
                   dialogue Réglages
  modules/         Un dossier par module (situation, journal, messages, missions, map,
                   resources, team, contacts, weather, agenda, network, trace, docs)
  timeline/        Barre du temps et relecture, fiche Historique, points figés
  export/          Centre d’export : périmètre, dossier, écrivains (PDF, Word, ODT, Excel,
                   ODS, HTML, texte, agenda, contacts), empreintes, vérification
  present/         Mode présentation, affichage mural, vue orateur, annotations,
                   PowerPoint / ODP / PDF / HTML animés
  ui/              Kit : champs standardisés, fiche générique, liens, fond papier
  sync/            Synchronisation en direct (useSync), fusions à signaler (ConflictPanel)
  journal/ radio/  Journal, réseau radio
  print/           Fiches, quittances, rapport, étiquettes, formules : aperçu A4, PDF
  styles.css theme.css motion.css atelier.css
                   Jetons et couches du design (docs/DESIGN.md)
  palettes.css     Les sept thèmes de couleur (jetons par data-palette)
server/
  app.mjs          Fichiers statiques en lecture seule, en-têtes, /healthz
  relay.mjs        Relais WebSocket en mémoire
  index.mjs        Serveur HTTP
  lan.mjs          Serveur HTTPS du réseau local
scripts/           Archive du code source, service worker
tests/             Tests node:test
docs/              Architecture, système de design, kit d’interface, choix métier, licences,
                   provenance des signes
```

Modèle de données et synchronisation : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Archive : `{ format: "orion-journal", version: 1, exportedAt, journal }` (identifiant technique conservé pour la compatibilité). Les journaux créés avec ORION 1.x se chargent avec des modules vides.

## Sources métier

- OFPP — [Documents de formation](https://www.babs.admin.ch/fr/documents-de-formation), manuel Aide à la conduite (suivi de la situation, télématique) et annexes (modèle « Plan du réseau radio »).
- OFPP — [Aide-mémoire Règles de communication radio](https://www.babs.admin.ch/dam/fr/sd-web/iMa3qxK30t2j/Behelf-Sprechregeln-fr.pdf) : nom d’appel, contrôle de liaison THREE / TWO / ONE.
- OFPP — signes conventionnels civils (jeu SVG), mode d’emploi TPH900, matériel radio Polycom (RFSI), manuel Logistique Matériel (quittances).
- CSSP — formulaire 8.7 Journal d’intervention, règlement Conduite d’intervention.
- swisstopo / geo.admin.ch — fonds de carte et recherche de lieux ; MétéoSuisse via Open-Meteo — prévisions.

Détail et correspondance avec le produit : [docs/JOURNAL.md](docs/JOURNAL.md). Architecture : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Composants tiers : [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
