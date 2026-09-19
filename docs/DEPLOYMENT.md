# Déploiement dans l’infrastructure de l’institution

## Prérequis

Node 24 ou Docker, PostgreSQL 17+ dédié, certificat serveur PostgreSQL valide, CA de l’institution, reverse proxy HTTPS, stockage et sauvegardes chiffrés. Les noms de domaine et secrets ci-dessous sont des exemples à remplacer ; aucun déploiement externe n’est déjà configuré.

1. Créer une base `orion`, un propriétaire de schéma réservé aux migrations et un compte `orion_app` sans propriété, sans superuser ni création de schéma.
2. Injecter une clé de 32 octets aléatoires en hexadécimal dans `APP_KEY`, via le coffre institutionnel. Conserver cette clé séparément et la sauvegarder : les secrets MFA ne sont pas déchiffrables sans elle.
3. Définir `NODE_ENV=production`, `APP_MODE=institution`, `APP_ORIGIN=https://orion.exemple-institution.ch`, `DATABASE_URL` avec le compte applicatif, `DATABASE_CA_FILE` vers la CA. Ne pas ajouter `sslmode`, `ssl` ou chemins de certificats à l’URL : l’application configure explicitement la vérification TLS.
4. Exécuter `npm run migrate` en injectant `MIGRATION_DATABASE_URL` avec le compte propriétaire. Ce secret ne doit pas être disponible dans le processus web. Le script utilise la même CA. Appliquer ensuite `docs/postgres-grants.sql` comme propriétaire en adaptant les noms.
5. Exécuter `npm run bootstrap` avec `BOOTSTRAP_EMAIL`, `BOOTSTRAP_NAME`, `BOOTSTRAP_PASSWORD` injectés par un mécanisme sécurisé. Ne pas stocker les secrets dans le dépôt ou l’historique shell. Le bootstrap refuse de créer un second administrateur.
6. Construire (`npm ci`, `npm run check`, `npm test`, `npm run build`) et démarrer. Docker : `docker compose up --build -d` après configuration de l’environnement. L’exemple utilise votre base externe et ne crée aucun serveur SQL exposé.
7. Placer le service `127.0.0.1:4311` derrière le reverse proxy de l’institution. Transférer l’origine HTTPS sans réécriture des cookies. Définir `TRUSTED_PROXIES` uniquement avec les adresses ou réseaux exacts des reverse proxies maîtrisés, séparés par des virgules ; ils doivent écraser `X-Forwarded-For`. Ne jamais faire confiance à un proxy fourni par le client. Ne pas exposer directement le port Node. La limitation d’accès au réseau interne ou au VPN se fait sur le proxy.
8. Ouvrir l’URL HTTPS, activer le TOTP du premier administrateur, créer les dossiers et attribuer les accès. Vérifier les quatre fonds, les écritures et l’audit.

Le service ne fait aucune migration DDL au démarrage en production. La séparation des comptes protège notamment l’ajout seul de l’audit contre le compte applicatif. Le dossier `dist` contient uniquement l’application et ses ressources publiques.

## Sauvegarde et restauration

- Établir les objectifs RPO/RTO avec le commandement et l’exploitant.
- Sauvegarder PostgreSQL avec les outils institutionnels (`pg_dump` ou sauvegarde physique/PITR selon l’architecture), ainsi que la clé MFA conservée dans le coffre.
- Chiffrer les sauvegardes, limiter leurs lecteurs et les conserver dans une zone distincte. Les exports JSON métier ne remplacent pas une sauvegarde complète des comptes et de l’audit.
- Restaurer périodiquement dans un environnement isolé, sans comptes de production actifs ni accès extérieur. Contrôler les volumes de données, les affectations, la connexion MFA et l’intégrité de l’audit.
- Comparer la tête de chaîne à une empreinte conservée indépendamment. Une vérification interne seule ne prouve pas qu’un DBA n’a pas réécrit la chaîne.
- Documenter la durée et le résultat du test. Aucun test de restauration institutionnel n’est supposé déjà réalisé.

## Cache cartographique

`npm run assets` récupère les SVG OFPP et les fonds swisstopo via leurs adresses officielles. Le script dispose d’un périmètre géographique borné et d’une concurrence de six requêtes. La production sert ces fichiers en local. Les préférences de couleur ne changent pas les signes officiels.

Les tuiles existantes sont conservées par le script. Pour une actualisation, générer le cache dans un répertoire de préparation vide, vérifier la date de mise à jour officielle via le service `cacheUpdate`, comparer, puis remplacer le lot de tuiles lors d’une livraison contrôlée. Mettre à jour la provenance et la date affichée. Éviter le téléchargement exhaustif non borné et respecter les conditions d’usage swisstopo.

## Maintenance

La commande `/api/health` vérifie l’accessibilité de la base sans révéler ses paramètres. Superviser HTTPS, processus, disque, base, latence, erreurs et échecs de connexion avec les outils institutionnels. L’API applique des limites de débit en mémoire et un verrouillage de compte persistant ; adapter la protection au niveau du reverse proxy, notamment lorsque plusieurs utilisateurs partagent son adresse IP.

Les secrets peuvent être renouvelés par l’exploitant. Une rotation de `APP_KEY` nécessite de déchiffrer/réchiffrer les secrets MFA ou un réenrôlement contrôlé ; changer la clé à l’aveugle verrouille les comptes. Prévoir une procédure de récupération d’accès à deux personnes. Le SSO et la récupération automatisée ne sont pas implémentés dans cette version.

## Cartographie et accès sortant

`MAP_ONLINE` active le relais haute définition swisstopo : vrai par défaut en démonstration, faux par défaut en mode institutionnel. Une institution peut l’activer explicitement avec `MAP_ONLINE=true` après validation de sa politique réseau. Le seul hôte autorisé est `wmts.geo.admin.ch`, en HTTPS ; les couches, coordonnées de tuiles et niveaux de zoom sont bornés à la région genevoise. Les redirections sont refusées. ORION ne copie aucun en-tête entrant, cookie, référent, annotation ou objet métier dans la requête sortante. Le fournisseur reçoit les indices des tuiles demandées : cela révèle le secteur cartographique consulté. Cloudflare peut ajouter ses propres en-têtes réseau, dont l’adresse du visiteur pour une destination hors Cloudflare ; ce relais de démonstration ne garantit donc pas l’anonymat réseau. Voir la [documentation des sous-requêtes Cloudflare](https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip-in-worker-subrequests). En mode institutionnel, utiliser le cache sans accès sortant ou valider explicitement la politique du relais avec l’exploitant.

Cloudflare met en cache ces réponses publiques pendant une heure. Les images sont validées et limitées à 1 Mio ; timeout de huit secondes, erreurs non mises en cache. Le navigateur communique uniquement avec ORION, sans assouplissement de la CSP. En cas d’échec HD, le fond local reste disponible au zoom natif 14 ; les objets opérationnels et les outils restent accessibles.
