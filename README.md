# ORION

**Journal d’intervention et plan du réseau radio Polycom pour la protection civile.**
Application web locale : sans compte, sans base de données serveur, chiffrée sur le poste, utilisable hors ligne.

- Production : <https://orion-web-production-1466.up.railway.app>
- Licence : AGPL-3.0-only (le code source complet est téléchargeable depuis l’application)
- Version : 1.2

> Logiciel indépendant. Aucune affiliation, homologation ni approbation de l’OFPP, de l’OCPPAM ou de l’État de Genève. L’emploi de données réelles exige un poste, une installation et une autorisation de l’organisation.

---

## Sommaire

1. [Principe](#principe)
2. [Démarrage rapide](#démarrage-rapide)
3. [Session et stockage](#session-et-stockage)
4. [Journal d’intervention](#journal-dintervention)
5. [Saisie rapide et suivi](#saisie-rapide-et-suivi)
6. [Modifier et supprimer une entrée](#modifier-et-supprimer-une-entrée)
7. [Fiches message A4](#fiches-message-a4)
8. [Plan du réseau radio](#plan-du-réseau-radio)
9. [Rapport de situation](#rapport-de-situation)
10. [Relève](#relève)
11. [Téléphone, tablette et QR codes](#téléphone-tablette-et-qr-codes)
12. [Import, export et fusion](#import-export-et-fusion)
13. [Sécurité](#sécurité)
14. [Limites](#limites)
15. [Installation et hébergement](#installation-et-hébergement)
16. [Développement](#développement)
17. [Structure du code](#structure-du-code)
18. [Modèle de données](#modèle-de-données)
19. [Sources métier](#sources-métier)

---

## Principe

| Aspect           | Fonctionnement                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| Unité de travail | Une **session** par événement. Elle contient un ou plusieurs **journaux** (intervention, exercice). |
| Données          | Restent dans le navigateur. Elles ne quittent le poste que par un fichier exporté par l’opérateur.  |
| Serveur          | Sert uniquement les fichiers statiques. Il refuse toute écriture (`POST`, `PUT`… → 405).            |
| Identité         | L’opérateur déclare son nom ou sa fonction. Aucun compte, aucune authentification.                  |
| Transfert        | Archive `.orion` chiffrée, réimportée sur un autre poste, avec fusion contrôlée.                    |
| Hors ligne       | Après un premier chargement, un service worker met l’application en cache (exports et PDF compris). |

## Démarrage rapide

1. Ouvrir l’application.
2. **Nouvelle session** : nom de l’événement, opérateur, mode (Exercice / Intervention).
3. Laisser **Sauvegarde chiffrée sur ce poste** cochée et choisir une phrase de récupération (12 caractères minimum). Elle ne peut pas être récupérée.
4. Consigner les messages dans le panneau **Nouvelle entrée** (`⌘↵` / `Ctrl+↵` pour valider).
5. Onglet **Réseau radio** : créer les groupes, les noms d’appel, les terminaux, puis remettre les radios.
6. **Exporter** régulièrement une archive `.orion`.
7. En fin d’engagement : clôturer le journal, exporter, puis **Session → Effacer la session**.

Le bouton **Ouvrir l’exercice de démonstration** charge un scénario fictif complet (« Crue de l’Arve ») sans toucher aux données locales.

## Session et stockage

| Mode                | Stockage                                            | Survit à la fermeture de l’onglet | Remarque                                         |
| ------------------- | --------------------------------------------------- | --------------------------------- | ------------------------------------------------ |
| Sauvegarde chiffrée | IndexedDB `orion-journal-v1`, enveloppe AES-256-GCM | Oui                               | Déverrouillage par la phrase de récupération     |
| Temporaire          | Mémoire de l’onglet                                 | Non                               | Avertissement avant fermeture. Exporter souvent. |

- Chaque modification est sauvegardée 250 ms après la dernière frappe, brouillon de nouvelle entrée compris.
- Un verrou Web Locks empêche d’ouvrir la même session sauvegardée dans deux onglets.
- **Verrouiller** (icône cadenas) retire la session de la mémoire ; elle reste chiffrée sur le poste.
- **Session → Effacer la session** efface la sauvegarde locale. Cette action exige au préalable une archive ORION ou JSON récente de chaque journal, puis la saisie de `TERMINER`.
- Phrase perdue : l’écran d’accueil propose d’effacer l’espace local (saisie de `EFFACER`). Les données ne sont alors récupérables que depuis une archive.

La barre supérieure indique en permanence : l’état de sauvegarde (`CHIFFRÉ LOCAL`, `TEMPORAIRE`, `ÉCHEC SAUVEGARDE`), la disponibilité hors ligne et l’heure suisse.

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
- Recherche plein texte insensible aux accents sur tous les champs (`⌘K` / `Ctrl+K`).
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
- Le titre de l’onglet affiche le nombre d’échéances dépassées : `(3) ORION`, visible même quand l’onglet est en arrière-plan.
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

Onglet **Réseau radio**. Le plan fait partie du journal : il est sauvegardé, archivé, fusionné et clôturé avec lui.

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

**Plan A4** (en-tête de l’onglet) ou Exporter → **Plan du réseau radio** : A4 paysage avec plan du réseau (nom d’appel, fonction, section, titulaire, terminal et RFSI, principal, alternative, sur le réseau, dernier contrôle), groupes, terminaux, registre des remises et contrôles.

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

Bouton **Relève** : suites à donner, échéances dépassées, informations à confirmer, terminaux remis (détenteur, nom d’appel, heure). **Consigner la relève** prépare une entrée de nature Relève avec ces chiffres. Pour un autre poste : archive `.orion` et phrase transmise par un canal séparé.

## Téléphone, tablette et QR codes

### Installer l’app

Rail de gauche → **Installer l’app**. Sur Chrome, Edge, Brave et Android, le navigateur propose l’installation directement ; sinon une aide s’affiche :

- iPhone / iPad : Safari → Partager → « Sur l’écran d’accueil » ;
- Android : Chrome → ⋮ → « Installer l’application » ;
- ordinateur : icône d’installation dans la barre d’adresse.

L’app installée s’ouvre en plein écran, fonctionne hors ligne et a son icône. **Ses données sont propres à ce contexte** : une session ouverte dans Safari n’apparaît pas dans l’app installée (et inversement). Transférer par archive `.orion` si nécessaire.

### Écran tactile

Sur écran tactile, boutons et champs sont agrandis (cibles de 40 px au moins, texte à 16 px pour éviter le zoom automatique d’iOS), les icônes Modifier / Supprimer restent visibles, et un **bouton rond +** en bas à droite ouvre une nouvelle entrée. Sous 1 200 px de large, la saisie se fait dans une fenêtre dédiée.

### Étiquettes et scan des radios

1. Onglet Réseau radio → Terminaux → **Étiquettes** : planche A4 de 21 étiquettes (3 × 7, 60 × 36 mm, traits de coupe) avec QR code, numéro, modèle et RFSI.
2. Coller une étiquette sur chaque radio.
3. **Scanner** :
   - dans ORION (Chrome / Edge sur Android, navigateurs compatibles avec la lecture de QR) : la caméra arrière s’ouvre et reconnaît l’étiquette ;
   - avec l’appareil photo du téléphone : le QR contient un lien `…/#scan=R-04` qui ouvre ORION sur ce terminal ;
   - sinon : saisir le numéro (`R-04`, insensible à la casse).
4. ORION ouvre directement la bonne action : **retour** si le terminal est en service, **remise** s’il est disponible ou à recharger, sa fiche s’il est défectueux ou manquant.

La caméra n’est utilisée que dans la fenêtre Scanner, localement ; aucune image n’est enregistrée ni transmise. L’étiquette ne contient que l’adresse du site et le numéro du terminal.

## Import, export et fusion

Les exports portent sur **tout le journal**, quels que soient les filtres.

| Format                  | Extension            | Contenu                                                | Réimportable                |
| ----------------------- | -------------------- | ------------------------------------------------------ | --------------------------- |
| Archive ORION           | `.orion`             | Chiffrée : entrées, versions, suppressions, plan radio | Oui, sans perte             |
| Archive JSON            | `.json`              | En clair : idem                                        | Oui, sans perte             |
| Fiches messages A4      | `.pdf`               | Une fiche par entrée                                   | Non                         |
| Journal PDF             | `.pdf`               | Tableau chronologique A4                               | Non                         |
| Plan du réseau radio    | `.pdf`               | Plan, groupes, terminaux, remises, contrôles           | Non                         |
| Excel                   | `.xlsx`              | Filtres, en-tête figé                                  | Non                         |
| Word                    | `.docx`              | Document modifiable                                    | Non                         |
| OpenDocument            | `.ods`               | Tableur LibreOffice                                    | Non                         |
| CSV / TSV               | `.csv` `.tsv`        | UTF-8, point-virgule / tabulation                      | Oui, état actuel uniquement |
| HTML / Texte / Markdown | `.html` `.txt` `.md` | Lecture                                                | Non                         |

Tous les formats sauf `.orion` sont **en clair** ; l’interface demande de le reconnaître avant téléchargement.

**Import** (`.orion`, `.json`, `.csv`, `.tsv`, 32 Mo maximum) : fichier lu localement, aperçu avant toute modification, puis au choix :

- **Journal séparé** : le journal actuel reste intact.
- **Fusionner** : ajoute les nouvelles entrées (renumérotées à la suite), ignore les doublons exacts, applique les suppressions et complète les remises radio clôturées ailleurs. Toute autre divergence (même entrée modifiée différemment, terminal remis à deux personnes) **bloque** la fusion : importer alors en journal séparé pour comparer.

Les anciens exports `orion-export-v1` (ORION 0.3) sont reconnus : seules les entrées de journal sont converties.

## Sécurité

- Chiffrement : AES-256-GCM, IV aléatoire de 96 bits par écriture, clé dérivée par PBKDF2-SHA-256 (600 000 itérations, sel de 128 bits), Web Crypto, clé non extractible. La phrase n’est jamais stockée.
- Aucune requête réseau n’envoie de contenu : ni compte, ni télémétrie, ni IA, ni police ou script externe. CSP stricte (`default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`).
- Imports validés par schéma strict (Zod), avec limites de taille ; formules neutralisées dans les exports tableurs ; HTML exporté sans script.
- Détails et limites : [SECURITY.md](SECURITY.md).

## Limites

- Les noms d’opérateur sont déclaratifs ; l’historique n’est pas une signature électronique.
- Pas de synchronisation temps réel entre postes : transfert par fichier.
- Le plan radio documente le réseau ; il ne pilote pas les terminaux. Les numéros de groupes et RFSI réels viennent du plan de flotte cantonal. Ceux de la démonstration sont fictifs.
- Effacer les données du navigateur efface la sauvegarde locale. Une sauvegarde locale n’est pas une archive.
- Pas de pièces jointes binaires : noter leur référence.
- Limites techniques : 10 000 entrées par journal, 500 versions par entrée, message de 12 000 caractères, 1 000 terminaux, import de 32 Mo.

## Installation et hébergement

Prérequis : Node.js 24 (minimum 22.18).

```sh
npm ci
npm run build
npm start
```

Ouvrir <http://127.0.0.1:4311>. `dist/` est un site statique autonome, à servir en **HTTPS** ou sur `localhost` (Web Crypto et service worker l’exigent).

### Docker

```sh
docker build -t orion .
docker run -p 4311:4311 orion
```

### Railway (hébergement de production)

- Service `orion-web` du projet Railway `orion`, construit depuis le `Dockerfile` de la branche **`main`**.
- **Chaque push sur `main` redéploie automatiquement.**
- Variables : `PORT=4311`, `HOST=0.0.0.0`.
- Aucun volume ni base de données : le serveur ne stocke rien.

Pour un autre hébergeur : servir `dist/` avec les en-têtes de [`public/_headers`](public/_headers).

## Développement

```sh
npm run dev           # serveur Vite sur http://127.0.0.1:4311
npm run check         # TypeScript
npm test              # tests Node (node:test)
npm run format:check  # Prettier
npm run build         # build de production + service worker
```

La CI GitHub (`.github/workflows`) exécute format, typecheck, tests, build, `npm audit` et le build Docker à chaque push.

Tests couverts : modèle et révisions, suppression et numérotation, entrées liées et fil, clôture par quittance, relance d’échéance, modèles, batteries, QR et scan, rapport de situation, quittance de remise, fusion (doublons, conflits, suppressions, idempotence), plan radio (remises, retours, fusion de retours, contraintes), chiffrement, CSV/TSV, formats bureautiques, génération de chaque export, serveur statique.

## Structure du code

```
shared/            Modèle validé, sans dépendance au navigateur
  journal.ts       Journal, entrées, versions, suppressions, fusion, recherche
  radio.ts         Groupes, noms d’appel, terminaux, remises, contrôles, batteries, QR, fusion radio
  workflow.ts      Entrées liées et fil, clôture par quittance, relance d’échéance, modèles
  interchange.ts   CSV/TSV, import JSON et ancien format, HTML, texte
  crypto.ts        Enveloppe chiffrée AES-GCM / PBKDF2
src/
  App.tsx          Coque, navigation Journal / Réseau radio, état de session
  journal/         Saisie, détail, alertes, rapport, relève, import/export, stockage, démo
  radio/           Vue réseau radio, formulaires, contrôle général, scanner QR
  print/           Fiches, quittance, rapport, étiquettes QR : aperçu A4, impression, PDF (jsPDF)
  ui/              Horloge, logo, animations, installation
  styles.css       Thème
  motion.css       Transitions et fond
server/index.mjs   Serveur statique en lecture seule
scripts/           Archive du code source, service worker
tests/             Tests node:test
docs/              Architecture, choix métier et sources, licences des polices
```

## Modèle de données

```
Workspace
├─ author, activeId, drafts
└─ journals[]
   ├─ id, title, organization, location, reference, mode, classification, createdAt, closedAt
   ├─ entries[]    id, number, createdAt, createdBy, origin
   │  └─ revisions[]  id, at, author, reason, fields{…}
   ├─ deleted[]    id, number, at, by, reason
   └─ radio
      ├─ talkgroups[]  id, number, name, mode, usage, notes
      ├─ stations[]    id, callsign, role, unit, primary, fallback, notes
      ├─ terminals[]   id, label, kind, model, serial, rfsi, condition, notes
      │  └─ assignments[]  holder, callsign, role, unit, accessories, battery,
      │                    issuedAt, issuedBy, returnedAt, returnedBy, returnCondition, notes
      └─ checks[]      id, at, by, callsign, talkgroupId, result, notes
```

Archive : `{ format: "orion-journal", version: 1, exportedAt, journal }`. Les journaux créés avant la version 1.1 se chargent avec un plan radio et une liste de suppressions vides.

## Sources métier

- OFPP — [Documents de formation](https://www.babs.admin.ch/fr/documents-de-formation), manuel Aide à la conduite (suivi de la situation, télématique) et annexes (modèle « Plan du réseau radio »).
- OFPP — [Aide-mémoire Règles de communication radio](https://www.babs.admin.ch/dam/fr/sd-web/iMa3qxK30t2j/Behelf-Sprechregeln-fr.pdf) : nom d’appel, contrôle de liaison THREE / TWO / ONE.
- OFPP — mode d’emploi TPH900, matériel radio Polycom (RFSI), manuel Logistique Matériel (quittances).
- CSSP — formulaire 8.7 Journal d’intervention, règlement Conduite d’intervention.

Détail et correspondance avec le produit : [docs/JOURNAL.md](docs/JOURNAL.md). Architecture : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Composants tiers : [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
