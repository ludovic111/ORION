# Sécurité et confidentialité — orion aic 2.0

## Flux réels

orion aic n’a ni compte, ni base de données serveur, ni télémétrie, ni IA. Les saisies et imports sont traités dans le navigateur. Polices, icônes, code, signes cartographiques et modules d’export sont servis par la même origine. L’hébergeur reçoit les requêtes de chargement du site et peut journaliser l’adresse IP et les métadonnées HTTP : « local » ne signifie pas navigation anonyme.

Quatre services réseau sont **facultatifs** et n’existent que si l’opérateur les utilise :

| Service                        | Destination                                   | Ce qui part                                                                                    |
| ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Synchronisation entre postes   | Relais du site (`/sync`, WebSocket)           | Messages chiffrés de bout en bout ; un identifiant de salle haché. Jamais le code ni le texte. |
| Fonds de carte                 | `wmts.geo.admin.ch`, `tile.openstreetmap.org` | Requêtes de tuiles (zone et zoom affichés).                                                    |
| Recherche de lieu              | `api3.geo.admin.ch`                           | Le texte recherché (adresse, lieu).                                                            |
| Prévisions météo (sur demande) | `api.open-meteo.com`                          | Les coordonnées du lieu météo choisi.                                                          |

La politique CSP n’autorise aucune autre connexion (`connect-src 'self'` + ces deux API, `img-src` + ces deux serveurs de tuiles). Aucun script, style ou police externe.

Le choix d’une installation institutionnelle, d’un poste autorisé et du droit de traiter les données appartient à l’organisation. Ce logiciel n’est pas certifié ni homologué. Le chiffrement ne constitue pas à lui seul une conformité à la LIPAD/LPD, un plan d’archivage ou une analyse d’impact.

## Synchronisation sans base de données

- Une session partagée est identifiée par un **code de session** de 16 caractères (≈ 79 bits d’entropie) généré dans le navigateur.
- Le navigateur dérive du code : l’identifiant de salle (`SHA-256("orion-aic/room/v1/" + code)`) envoyé au relais, et une clé AES-256-GCM (PBKDF2-SHA-256, 200 000 itérations) qui ne quitte jamais le poste.
- Chaque message (session complète ou modifications) est compressé, chiffré avec un IV aléatoire de 96 bits et authentifié (AES-GCM, données associées `orion-aic-sync:1`). Le relais ne voit que `{"t":"box", iv, d}`.
- Le relais (`server/relay.mjs`) garde les salles **en mémoire uniquement**, transmet les messages aux autres postes de la même salle et n’écrit rien sur disque ni dans ses journaux. Une salle disparaît quand son dernier poste se déconnecte. Limites : 24 Mo par message, 64 postes par salle, 2 000 salles ; les connexions d’une autre origine (en-tête `Origin`) sont refusées.
- Tout poste qui connaît le code lit et modifie toute la session : **le code est un mot de passe**, à transmettre par un canal sûr (oral, QR code affiché sur place) et à changer (Arrêter puis recréer) si un poste n’est plus autorisé. Un poste retiré garde la copie qu’il possède déjà.
- Les données reçues sont validées par le même schéma strict que les imports avant fusion ; un message illisible (autre code, altération) est ignoré.
- Mode réseau local (`npm run lan`) : même relais servi en HTTPS par un ordinateur du poste de conduite, avec un certificat auto-signé généré localement (`.lan/`, jamais versionné). Vérifier l’empreinte affichée au premier accès.

## Reprise après crash

La reprise locale est proposée par défaut pour une nouvelle session. AES-256-GCM avec IV aléatoire de 96 bits par écriture ; clé dérivée par PBKDF2-SHA-256, 600 000 itérations, sel aléatoire de 128 bits, Web Crypto. La phrase secrète n’est jamais stockée et la clé est non extractible, en mémoire uniquement. IndexedDB reçoit uniquement une enveloppe chiffrée. Le code de synchronisation est conservé dans cette enveloppe, jamais en clair.

Les écritures sont sérialisées, avec un délai de 250 ms pour regrouper les frappes. Le brouillon de nouvelle entrée est inclus dans la reprise chiffrée. Un verrou Web Locks refuse l’ouverture simultanée de la session sauvegardée dans deux onglets. Un statut « sauvegardé » signifie transaction IndexedDB terminée ; aucune application ne peut garantir les dernières frappes pendant une coupure électrique.

Le mode temporaire reste uniquement en mémoire et est perdu si l’onglet est fermé ou rechargé. La navigation privée, l’éviction du stockage et son effacement peuvent supprimer la reprise. Conserver des archives sur les supports autorisés. Pas de récupération de phrase secrète, de compte administrateur ou de porte dérobée.

Le service worker met en cache le code de l’application, les signes cartographiques et, au plus, 4 000 tuiles de carte déjà affichées (pour travailler hors ligne). Aucun contenu de session n’entre dans ces caches.

## Imports et exports

- Les archives `.orionaic` (et les anciennes `.orion`) et JSON ont un schéma strict et versionné, des limites (32 Mo, 10 000 entrées par journal, bornes par collection), des identifiants uniques.
- Un import est prévisualisé avant mutation. Une fusion ignore les doublons exacts et refuse les entrées dont les versions divergent ; les données des modules (messages, carte, moyens…) suivent les règles de la synchronisation.
- CSV/TSV : syntaxe vérifiée, cellules et lignes bornées, formules neutralisées dans les exports. XLSX/ODS écrivent uniquement des cellules texte.
- Les textes importés ou reçus sont affichés par React, jamais injectés en HTML. Les libellés de la recherche de lieu geo.admin.ch sont réduits à du texte.
- Le fichier `.orionaic` est chiffré. Tous les autres formats sont en clair, avec reconnaissance explicite dans l’interface.

## Caméra, position et QR codes

La caméra est demandée uniquement à l’ouverture du scanner et arrêtée à sa fermeture ; les images sont analysées dans le navigateur. La position (« Ma position » sur la carte ou la météo) n’est demandée que sur clic et n’est pas enregistrée sauf si l’opérateur place un objet ou choisit ce lieu. `Permissions-Policy` limite caméra et géolocalisation à l’origine du site. Les étiquettes QR des radios contiennent l’adresse du site et le numéro du terminal ; le QR de synchronisation contient le code de session (à ne montrer qu’aux postes autorisés).

## Suppression

La suppression d’une entrée retire son contenu et son historique ; seuls le numéro, l’auteur, l’heure et le motif restent. La suppression d’un élément des modules laisse une marque technique (identifiant et heure) pour que la synchronisation ne le fasse pas réapparaître. Aucune suppression n’atteint les archives, PDF ou copies exportés auparavant.

## Limites du modèle

Le nom de l’opérateur est déclaratif. L’historique préserve les corrections faites via l’application, mais ce n’est ni un registre inviolable ni une signature électronique. Une personne avec accès au poste déverrouillé, à la phrase de récupération ou au code de session peut lire et modifier les données. Le chiffrement ne protège pas d’un logiciel malveillant, d’une extension intrusive, d’une capture d’écran ou d’un script compromis sur l’origine. La synchronisation résout les conflits automatiquement (dernière modification, versions conservées pour les entrées) : les horloges des postes doivent être à l’heure.

L’exploitant doit maîtriser le code servi, HTTPS, les postes, les extensions, les sauvegardes, les droits d’accès aux fichiers et les délais de conservation.

## Signaler un problème

Transmettre un signalement privé au mainteneur du dépôt avec des données fictives et les étapes de reproduction. Ne pas joindre de journal réel, de phrase de récupération, de code de session ni de sauvegarde contenant des données personnelles à une issue publique.
