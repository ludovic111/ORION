# Démonstration Cloudflare, indépendante du Mac

ORION utilise le **projet Pages dédié `orion-conduite`** à l’adresse **https://orion-conduite.pages.dev**. Une liaison privée vers le Worker `orion-pci-demo` donne accès à sa base SQLite persistante dans un Durable Object. Le Worker ne possède aucune route publique `workers.dev` ni URL de prévisualisation. Les alias de déploiement Pages sont refusés avant tout accès au serveur. Le navigateur accède directement à Cloudflare ; le Mac du présentateur et le tunnel temporaire ne sont pas nécessaires. Aucun service Railway n’est utilisé.

Cette variante est exclusivement une démonstration sur invitation avec données fictives. Le déploiement institutionnel reste le serveur Node/PostgreSQL avec MFA décrit dans `DEPLOYMENT.md`. La version Cloudflare n’est pas une certification cantonale ni une garantie de résidence suisse.

## Déployer

```sh
npm ci
npx wrangler login
npm run build:pages
npx wrangler deploy --dry-run
npx wrangler secret bulk .data/hosted-preview/secrets.json
npx wrangler deploy
# Pour un nouveau compte : créer un projet Pages nommé orion-conduite
npx wrangler pages deploy --cwd pages --branch main
```

Créer le fichier de secrets local avec permissions `0600`, dans un répertoire `0700`. Il contient :

- `APP_KEY` et `PREVIEW_CONTROL_KEY` : deux valeurs distinctes de 32 octets aléatoires encodés en hexadécimal ;
- `APP_ORIGIN` : origine exacte `https://orion-conduite.pages.dev` ;
- `PREVIEW_EXPIRES_AT` : date ISO fixe située au plus 30 jours dans le futur.

La configuration versionnée impose `APP_MODE=hosted-preview` et `DEMO_DATA_ACK=synthetic-only`. Une `DATABASE_URL` fait échouer le démarrage : aucune connexion à une base institutionnelle. Aucun secret dans `wrangler.jsonc`, GitHub ou le code frontend. `.dev.vars` sert uniquement aux tests locaux et est exclu de Git, du conteneur et de l’archive source.

Le premier déploiement initialise un scénario fictif. Le stockage SQLite demeure attaché au même Durable Object lors des déploiements suivants. Ne pas changer le nom du Worker, de la classe ou de l’instance `demo-v1`, ni supprimer son stockage pour une simple mise à jour.

## Invitations et révocation

Créer `.data/hosted-preview/control.json`, avec permissions `0600`, contenant `local` et `origin` égaux à l’origine HTTPS du projet Pages, `controlKey` égal au secret de gestion et `hosted: true`.

```sh
ORION_PREVIEW_CONTROL_FILE=.data/hosted-preview/control.json npm run preview:invite -- "Évaluateur 01" command
ORION_PREVIEW_CONTROL_FILE=.data/hosted-preview/control.json npm run preview:invite -- "Observateur 01" viewer
ORION_PREVIEW_CONTROL_FILE=.data/hosted-preview/control.json npm run preview:revoke -- IDENTIFIANT
```

Les liens privés sont enregistrés dans `.data/hosted-preview/INVITATIONS.md`. Chaque invitation dure au maximum sept jours, sans dépasser l’expiration du service. Un redémarrage conserve les comptes, sessions valides et exercices ; il ne renouvelle aucune date d’expiration. L’accès arrivé à échéance renvoie 410, tandis que le contrôle de santé reste disponible. Le mot de passe des comptes de présentation est désactivé : seule leur invitation peut ouvrir une session. Le compte administrateur du scénario initial n’est pas accessible.

Chaque invité reçoit son propre exercice. Limites : 30 invitations, trois dossiers par invité, 1 000 objets par dossier. Les contrôles de rôle, d’origine, CSRF, de version et de révocation sont communs au serveur principal. Les limitations de requêtes sont persistantes et stockent une empreinte de l’adresse IP plutôt que l’adresse brute. Les requêtes concurrentes utilisent des transactions SQLite ; les audits ne peuvent être modifiés ou supprimés par une requête applicative.

## Offre gratuite et limites

Workers et les Durable Objects SQLite sont disponibles dans l’offre gratuite. Aucun abonnement payant, conteneur, domaine acheté ou serveur supplémentaire n’est nécessaire. Le nom `pages.dev` est fourni par Cloudflare. Les quotas sont partagés avec les autres applications du compte : leur dépassement peut rendre la démonstration temporairement indisponible. Si le compte utilise déjà une offre payante, sa tarification propre continue de s’appliquer ; ORION ne modifie pas l’abonnement.

Les fichiers de carte, signes, fontes et interface sont servis par Pages après vérification de l’adresse canonique ; chaque requête traverse la fonction de passerelle. Cela consomme le quota de requêtes de fonctions, y compris pour les tuiles. L’archive source AGPL dépasse la limite de 25 Mio par ressource : elle est découpée lors du build, puis reconstituée en flux sur son URL habituelle. Le téléchargement reste complet sans charger toute l’archive en mémoire.

Un seul objet coordonne cette petite instance de démonstration et sa chaîne d’audit, plafonnée à 30 invitations. Ce n’est pas l’architecture à reprendre pour un déploiement institutionnel ou à grande échelle. Les journaux de requêtes Cloudflare persistants sont désactivés dans la configuration ORION. L’audit applicatif demeure actif.

## Vérifications

```sh
npm test
npm run check
npm run build:cloudflare
npm run test:cloudflare
```

Le test Cloudflare utilise le moteur local officiel `workerd`, un stockage isolé et des clés jetables. Il vérifie authentification, consentement, rôles, isolation, CSRF/origine, concurrence, rollback d’import, export et révocation. Pour vérifier le serveur réellement déployé avec les secrets du présentateur :

```sh
ORION_TEST_URL=https://orion-conduite.pages.dev node scripts/test-cloudflare.mjs
# Après un redéploiement :
ORION_TEST_URL=https://orion-conduite.pages.dev node scripts/test-cloudflare.mjs --persistence
```

Ces vérifications distantes créent deux invitations techniques, comptabilisées dans la limite de 30. L’une est révoquée pendant le test ; révoquer aussi l’autre après la vérification de persistance. Les sessions techniques restent dans un fichier local privé ignoré par Git.

Les anciens liens `trycloudflare.com` ne migrent pas : utiliser les nouvelles invitations. Aucun dossier local existant n’est transféré automatiquement.

Références officielles : [Express dans Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/), [stockage et transactions SQLite](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [offres et quotas des Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/), [limites des ressources statiques](https://developers.cloudflare.com/workers/static-assets/platform/limits/).

## Gestion du nom et mises à jour

Le compte utilise le sous-domaine Workers `orion-conduite`. L’adresse de présentation demeure le domaine Pages ci-dessus. Les deux ressources de calcul et le stockage ne servent qu’à ORION ; la facturation et les quotas restent ceux du compte Cloudflare. Aucun achat ni changement d’abonnement n’est effectué par le déploiement.

Pour un autre nom Pages, modifier ensemble `pages/wrangler.jsonc` (nom et `PUBLIC_ORIGIN`), le secret serveur `APP_ORIGIN`, le fichier de contrôle privé et les URL des invitations. Ne pas changer les clés ni supprimer le stockage pour un simple changement d’adresse. Une suppression du Worker et de son stockage supprime les exercices et invalide les invitations : recréer alors les accès.

`npm run deploy:cloudflare` met à jour le serveur privé ; `npm run deploy:pages` met à jour la passerelle et les ressources publiques. Exécuter les deux après une modification complète. Les tests unitaires vérifient que les alias Pages sont refusés, que les requêtes authentifiées sont transmises sans altération et que les sources restent téléchargeables.
