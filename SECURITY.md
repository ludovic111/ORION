# Sécurité et confidentialité — orion aic 2.0

## Flux réels

orion aic n’a ni compte, ni base de données serveur, ni télémétrie, ni IA. Les saisies et imports sont traités dans le navigateur. Polices, icônes, code, signes cartographiques et modules d’export sont servis par la même origine. L’hébergeur reçoit les requêtes de chargement du site et peut journaliser l’adresse IP et les métadonnées HTTP : « local » ne signifie pas navigation anonyme.

Quatre services réseau sont **facultatifs** et n’existent que si l’opérateur les utilise :

| Service                        | Destination                                   | Ce qui part                                                                                     |
| ------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Synchronisation entre postes   | Relais du site (`/sync`, WebSocket)           | Messages chiffrés de bout en bout ; un identifiant de salle dérivé. Jamais le code ni le texte. |
| Fonds de carte                 | `wmts.geo.admin.ch`, `tile.openstreetmap.org` | Requêtes de tuiles (zone et zoom affichés).                                                     |
| Recherche de lieu              | `api3.geo.admin.ch`                           | Le texte recherché (adresse, lieu).                                                             |
| Prévisions météo (sur demande) | `api.open-meteo.com`                          | Les coordonnées du lieu météo choisi.                                                           |

La politique CSP n’autorise aucune autre connexion (`connect-src 'self'` + ces deux API + les deux serveurs de tuiles, `img-src` + ces deux serveurs de tuiles). Les serveurs de tuiles figurent aussi dans `connect-src` parce que le service worker les télécharge lui-même pour les garder hors ligne : sans eux, toutes les tuiles échouent et la carte affiche à tort « hors ligne ». Aucun script, style ou police externe.

Le choix d’une installation institutionnelle, d’un poste autorisé et du droit de traiter les données appartient à l’organisation. Ce logiciel n’est pas certifié ni homologué. Le chiffrement ne constitue pas à lui seul une conformité à la LIPAD/LPD, un plan d’archivage ou une analyse d’impact.

## Synchronisation sans base de données

- Une session partagée est identifiée par un **code de session** de 16 caractères (≈ 79 bits d’entropie) généré dans le navigateur, dans un alphabet sans 0, 1, I, L ni O. Un code saisi qui ne peut pas venir de l’application (caractère exclu, longueur, code trop régulier comme `AAAA-AAAA-…`) est refusé avec une explication.
- Le navigateur dérive du code, par PBKDF2-SHA-256 (200 000 itérations) puis HKDF-SHA-256 avec deux libellés distincts, l’identifiant de salle envoyé au relais et une clé AES-256-GCM qui ne quitte jamais le poste. L’identifiant de salle part dans le **premier message** WebSocket, jamais dans l’URL : il n’apparaît pas dans les journaux des proxys. Retrouver le code depuis l’identifiant coûte un PBKDF2 par essai, comme pour la clé (en protocole 1, un simple SHA-256 du code, envoyé dans l’URL, permettait une recherche hors ligne rapide).
- Chaque message (session, différences, présence) est compressé, chiffré avec un IV aléatoire de 96 bits et authentifié (AES-GCM, données associées `orion-aic-sync:2`), puis découpé en parts de 192 Ko. L’identifiant du message, le rang de la part et leur nombre sont dans la partie chiffrée. Le relais ne voit que des trames binaires opaques, leur taille et le poste destinataire.
- Le relais (`server/relay.mjs`) garde les salles **en mémoire uniquement**, transmet les trames aux autres postes de la même salle (ou à un seul) et n’écrit rien sur disque ni dans ses journaux. Une salle disparaît quand son dernier poste se déconnecte. Limites : trame de 1 Mio, 64 postes par salle, 2 000 salles ; par adresse IP : 96 connexions, 16 salles, 30 entrées en salle puis une toutes les 2 s ; entrée en salle sous 10 s ; un poste qui ne lit pas ses messages (plus de 8 Mio en attente) est déconnecté. Les connexions d’une autre origine (en-tête `Origin`) sont refusées. L’adresse IP est lue dans `X-Real-IP` ou `X-Forwarded-For` posés par l’hébergeur (Railway) ; sans proxy, ces en-têtes peuvent être falsifiés pour contourner les limites par adresse (pas pour lire une salle).
- Tout poste qui connaît le code lit et modifie toute la session : **le code est un mot de passe**, à transmettre par un canal sûr (oral, QR code affiché sur place) et à changer (Arrêter puis recréer) si un poste n’est plus autorisé. Un poste retiré garde la copie qu’il possède déjà.
- **Pas d’authentification de l’expéditeur.** Les postes d’une salle partagent la même clé : un message prouve seulement qu’il vient d’un détenteur du code. Le nom d’opérateur et l’identifiant de poste sont déclaratifs ; un détenteur du code peut se présenter sous n’importe quel nom et signer des changements au nom d’un autre. C’est accepté : le code est le périmètre de confiance. Rejouer un ancien message n’a pas d’effet (la fusion est idempotente et un horodatage ancien ne l’emporte pas sur un plus récent), mais un détenteur du code peut écrire des horodatages dans le futur pour faire gagner ses changements : c’est un risque d’intégrité interne à la session, visible dans l’historique.
- Les données reçues sont validées par le même schéma que les imports avant fusion ; les champs d’une version plus récente sont ignorés, les champs connus restent validés. Un journal refusé est listé (Réglages → Synchronisation) avec la raison ; un message illisible (autre code, altération) est ignoré et signalé. Chaque message porte la version du protocole : un poste d’une autre version l’affiche au lieu de « en direct ».
- Mode réseau local (`npm run lan`) : même relais servi en HTTPS par un ordinateur du poste de conduite, avec un certificat auto-signé généré localement (`.lan/`, jamais versionné). Vérifier l’empreinte affichée au premier accès.

## Reprise après crash

La reprise locale est proposée par défaut pour une nouvelle session. AES-256-GCM avec IV aléatoire de 96 bits par écriture ; clé dérivée par PBKDF2-SHA-256, 600 000 itérations, sel aléatoire de 128 bits, Web Crypto. La phrase secrète n’est jamais stockée et la clé est non extractible, en mémoire uniquement. IndexedDB (base `orion-journal-v1`) reçoit uniquement une enveloppe chiffrée : depuis 2.1, la session est compressée (gzip) avant chiffrement et stockée en octets bruts, les images une seule fois ; les enveloppes d’avant 2.1 s’ouvrent toujours. Aucune limite de taille à la lecture ; à l’écriture, une session de plus de 256 Mo compressés (ou trop grande pour le navigateur) est refusée avec un message clair plutôt qu’enregistrée sans pouvoir être rouverte. Le code de synchronisation est conservé dans cette enveloppe, jamais en clair.

Les écritures sont sérialisées, avec un délai de 250 ms pour regrouper les frappes. Le brouillon de nouvelle entrée est inclus dans la reprise chiffrée. Un verrou Web Locks refuse l’ouverture simultanée de la session sauvegardée dans deux onglets. Un statut « sauvegardé » signifie transaction IndexedDB terminée ; aucune application ne peut garantir les dernières frappes pendant une coupure électrique.

Le mode temporaire reste uniquement en mémoire et est perdu si l’onglet est fermé ou rechargé. La navigation privée, l’éviction du stockage et son effacement peuvent supprimer la reprise. Conserver des archives sur les supports autorisés. Pas de récupération de phrase secrète, de compte administrateur ou de porte dérobée.

Le service worker met en cache le code de l’application, les signes cartographiques et, au plus, 4 000 tuiles de carte déjà affichées (pour travailler hors ligne). Aucun contenu de session n’entre dans ces caches.

## Imports et exports

- Les archives `.orionaic` (et les anciennes `.orion`) et JSON ont un schéma strict et versionné, des limites (32 Mo, 10 000 entrées par journal, bornes par collection), des identifiants uniques. Les `.orionaic` écrites depuis 2.1 (enveloppe version 2) sont compressées avant chiffrement ; les versions 1 s’ouvrent toujours.
- Un import est prévisualisé avant mutation. Une fusion ignore les doublons exacts et refuse les entrées dont les versions divergent ; les données des modules (messages, carte, moyens…) suivent les règles de la synchronisation.
- CSV/TSV : syntaxe vérifiée, cellules et lignes bornées, formules neutralisées dans les exports. XLSX/ODS écrivent uniquement des cellules texte.
- Les textes importés ou reçus sont affichés par React, jamais injectés en HTML. Les libellés de la recherche de lieu geo.admin.ch sont réduits à du texte.
- Le fichier `.orionaic` est chiffré. Tous les autres formats sont en clair, avec reconnaissance explicite dans l’interface.

## Signature des exports

Chaque session (chaque poste) crée au premier démarrage une paire de clés **Ed25519** avec Web Crypto, ou **ECDSA P-256** si le navigateur ne connaît pas Ed25519 (`shared/signature.ts`). La clé privée est gardée dans la session : dans l’enveloppe chiffrée d’IndexedDB quand la session est protégée, en mémoire seulement en mode temporaire. Elle n’est jamais synchronisée, ni exportée, ni envoyée où que ce soit ; une nouvelle session crée une nouvelle clé.

- **PDF** (dossier, journal, fiches, plan radio, diaporama PDF) : après la fin du fichier (`%%EOF`), une ligne de commentaire PDF porte le SHA-256 des octets qui précèdent, l’heure, la clé publique et la signature. Les lecteurs PDF l’ignorent. Le QR code imprimé porte en plus le SHA-256 du contenu exporté (JSON canonique du journal), l’heure, la clé publique et la signature ; le pied de page montre l’empreinte courte de la clé (`clé A1B2-C3D4`).
- **Archives** `.orionaic` et JSON : l’enveloppe (ou l’archive) porte un champ `signature` qui couvre tout le reste, sous forme canonique (clés triées).
- **Registre des exports** : chaque ligne (SHA-256 de chaque fichier produit, quel que soit son format) est signée ; un fichier Word, Excel ou ZIP se vérifie ainsi contre le registre.
- **Traçabilité → Vérifier un document** : recalcule le SHA-256, vérifie la signature du fichier, celle du registre et celle du code QR, et affiche l’empreinte de la clé (16 caractères hexadécimaux) avec le nom des postes qui l’ont déjà utilisée dans cette opération.

**Ce que cela prouve** : le fichier, ou le contenu imprimé, est exactement celui qui a été signé par la clé indiquée ; toute modification, même d’un octet, rend la signature invalide.

**Ce que cela ne prouve pas** : l’identité du signataire (la clé est auto-signée, sans autorité de certification ni annuaire ; il faut comparer l’empreinte avec celle notée pour chaque poste), ni l’heure de signature (elle vient de l’horloge du poste, sans horodatage de confiance), ni que le contenu était vrai. Une personne ayant accès à la session déverrouillée peut signer avec sa clé. Ce n’est pas une signature électronique qualifiée au sens de la SCSE.

## Exercices

Le scénario d’un exercice (injects, réactions attendues) est une collection du journal comme les autres : il est synchronisé, archivé et visible dans la traçabilité. Le code de la « direction d’exercice » (4 à 8 chiffres, haché et gardé dans le navigateur du poste) évite seulement qu’un joueur ouvre le scénario par mégarde ; ce n’est pas un contrôle d’accès. Aucun inject n’est jamais envoyé dans un journal en mode Intervention.

## Caméra, micro, position et QR codes

La caméra est demandée uniquement à l’ouverture du scanner et arrêtée à sa fermeture ; les images sont analysées dans le navigateur. La position (« Ma position » sur la carte ou la météo) n’est demandée que sur clic et n’est pas enregistrée sauf si l’opérateur place un objet ou choisit ce lieu. `Permissions-Policy` limite caméra, micro et géolocalisation à l’origine du site. Les étiquettes QR des radios contiennent l’adresse du site et le numéro du terminal ; le QR de synchronisation contient le code de session (à ne montrer qu’aux postes autorisés).

La dictée vocale (Web Speech API du navigateur) est **désactivée par défaut** et s’active par poste (Réglages → Ce poste). Le micro n’est demandé qu’à l’appui sur le bouton micro et relâché à l’arrêt de la dictée (second appui, Échap, onglet masqué, formulaire fermé). La transcription est faite par le navigateur, pas par orion aic : dans Chrome et Edge, le son part vers les serveurs de Google ou de Microsoft (connexion internet requise) ; Safari peut transcrire sur l’appareil selon le système. orion aic ne reçoit ni n’enregistre aucun son ; seul le texte inséré dans le champ fait partie de la session. L’organisation décide si des informations confidentielles peuvent être dictées.

## Suppression

La suppression d’une entrée retire son contenu et son historique ; seuls le numéro, l’auteur, l’heure et le motif restent. La suppression d’un élément des modules laisse une marque technique (identifiant et heure) pour que la synchronisation ne le fasse pas réapparaître. Aucune suppression n’atteint les archives, PDF ou copies exportés auparavant.

## Limites du modèle

Le nom de l’opérateur est déclaratif. L’historique préserve les corrections faites via l’application, mais ce n’est ni un registre inviolable ni une signature électronique (les exports sont signés par la clé du poste, voir plus haut, ce qui prouve leur intégrité, pas l’identité de leur auteur). Une personne avec accès au poste déverrouillé, à la phrase de récupération ou au code de session peut lire et modifier les données. Le chiffrement ne protège pas d’un logiciel malveillant, d’une extension intrusive, d’une capture d’écran ou d’un script compromis sur l’origine. La synchronisation résout les conflits automatiquement (dernière modification dans l’ordre causal, par horloge logique hybride ; versions conservées pour les entrées) et liste les modifications simultanées : un poste en retard de quelques minutes ne perd plus ses changements, mais une horloge fausse de plusieurs heures reste visible dans les heures affichées.

L’exploitant doit maîtriser le code servi, HTTPS, les postes, les extensions, les sauvegardes, les droits d’accès aux fichiers et les délais de conservation.

## Signaler un problème

Transmettre un signalement privé au mainteneur du dépôt avec des données fictives et les étapes de reproduction. Ne pas joindre de journal réel, de phrase de récupération, de code de session ni de sauvegarde contenant des données personnelles à une issue publique.
