# ORION — Journal d’intervention

ORION 1.0 est un journal d’intervention en français, utilisable dans un navigateur, **sans compte, sans API métier et sans base de données serveur**. Une session correspond à un événement. Les données ne quittent le poste que lorsque l’opérateur exporte un fichier.

Logiciel indépendant, sans affiliation, homologation ni approbation de l’OFPP ou de l’État de Genève. L’emploi de données réelles exige un poste, une installation et une organisation autorisés. Le code reste sous **AGPL-3.0-only**, téléchargeable depuis l’application.

## Utilisation

1. Nommer le journal et indiquer son nom ou indicatif.
2. Garder la **reprise après crash** activée et choisir une phrase de récupération (12 caractères minimum). Le navigateur conserve uniquement une session chiffrée, y compris le brouillon de nouvelle entrée. Aucun compte n’est créé.
3. Consigner les événements. Date de l’événement, réception et enregistrement sont distincts. Source, destinataire, canal, confirmation, lieu, coordonnées, mesure/décision, responsable, échéance, statut, moyens, références, notes et mots-clés complètent la saisie.
4. Retrouver les informations avec la recherche et les filtres. Corriger en conservant les anciennes versions et le motif. Préparer la relève depuis les suites à donner et échéances.
5. Exporter une **archive ORION chiffrée** pour conserver et transmettre le journal avec toutes ses versions. Importer après aperçu, séparément ou en fusionnant les nouvelles entrées. Les conflits ne sont jamais écrasés silencieusement.
6. Après vérification des archives téléchargées, **Terminer et effacer la session** depuis les réglages. Les fichiers exportés ne sont pas supprimés.

Le mode temporaire, volontairement choisi, ne survit pas à la fermeture ou au crash de l’onglet. Ne pas l’utiliser sans exports fréquents. La sauvegarde locale n’est pas une archive : nettoyage du navigateur, navigation privée, panne de disque ou perte de la phrase peuvent la rendre inaccessible.

## Formats

| Format                | Usage                                         | Réimportation              |
| --------------------- | --------------------------------------------- | -------------------------- |
| ORION `.orion`        | Archive chiffrée, journal complet et versions | Oui, sans perte            |
| JSON `.json`          | Archive ouverte, complète, en clair           | Oui, sans perte            |
| PDF `.pdf`            | Document paginé pour lecture/impression       | Non                        |
| Excel `.xlsx`         | Tableur, filtre et première ligne figée       | Non                        |
| OpenDocument `.ods`   | Tableur LibreOffice                           | Non                        |
| Word `.docx`          | Document modifiable                           | Non                        |
| CSV / TSV             | Texte tabulaire UTF-8                         | Oui, état actuel seulement |
| HTML / TXT / Markdown | Lecture et documentation                      | Non                        |

Les exports concernent tout le journal, indépendamment des filtres. Seuls ORION et JSON conservent l’historique et les identifiants pour les fusions. Les dates tabulaires ISO conservent le fuseau ; l’écran et les documents de lecture affichent Europe/Zurich. Les champs de saisie horaire suivent le fuseau du poste et l’interface le précise.

Les anciens exports `orion-export-v1` sont reconnus : seules leurs entrées de journal sont converties, avec un avertissement avant import. Les anciennes bases de données ne sont ni lues ni supprimées par cette version.

## Installer / auto-héberger

Node.js 24 recommandé (minimum 22.18).

```sh
npm ci
npm run build
npm start
```

Ouvrir `http://127.0.0.1:4311`. Pour développer : `npm run dev`.

`dist/` est un site statique autonome, à servir sur **HTTPS** ou `localhost` (requis pour Web Crypto et le mode hors ligne). Aucun service propriétaire n’est nécessaire. Le serveur Node fourni ne sert que des fichiers et refuse les écritures ; il n’utilise aucune dépendance de serveur applicatif. Un Dockerfile sans base de données est fourni. Pour un réseau institutionnel, configurer HTTPS et les en-têtes de `public/_headers` sur le serveur retenu.

Après un premier chargement réussi de la version construite, un service worker met les fichiers de l’application en cache, y compris les modules d’export. L’indicateur « Prêt hors ligne » confirme l’activation. Le code source n’est pas précaché. Une première ouverture sur un poste neuf nécessite l’accès au site ou à une copie locale servie par `npm start`. Les navigateurs peuvent évincer leurs caches ; ne pas déduire d’une installation une garantie de disponibilité absolue.

## Développement

```sh
npm run check
npm test
npm run build
npm run format:check
```

- `shared/` : modèles validés, chronologie, corrections, fusion, CSV, chiffrement.
- `src/journal/` : saisie, historique, imports, exports, reprise locale.
- `server/index.mjs` : serveur statique facultatif.
- `scripts/` : archive du code source et cache hors ligne déterministe.
- `tests/` : contrats des données, échanges, chiffrement et protections.

Voir [les choix métier et sources](docs/JOURNAL.md), [l’architecture](docs/ARCHITECTURE.md) et [les limites de sécurité](SECURITY.md).
