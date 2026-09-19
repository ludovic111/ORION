# Faire tester ORION dans un navigateur

Pour une démonstration accessible **Mac éteint**, suivre [le déploiement hébergé](HOSTED-DEMO.md). Le tunnel décrit plus bas dépend du Mac.

## Sur ce Mac

```sh
npm ci
npm run build
npm start
open -a "Brave Browser" http://127.0.0.1:4311
```

Choisir « Ouvrir la démonstration ». Ce mode local ne doit jamais être exposé par un tunnel ou un proxy public : il ne demande aucun mot de passe.

## Démonstration temporaire sur invitation

Prérequis : installer le programme officiel `cloudflared` (sur macOS : `brew install cloudflared`). Il n’est pas nécessaire de créer un compte Cloudflare ou de modifier le DNS.

```sh
npm run build
npm run preview
```

Laisser cette commande ouverte. Un serveur distinct, une base `.data/preview/database` et une adresse HTTPS temporaire sont créés. Le serveur local habituel et une éventuelle `DATABASE_URL` institutionnelle ne sont jamais repris. Le démarrage expose d’abord une réponse d’attente, puis uniquement l’application de démonstration protégée. La session expire après **48 heures** ; le tunnel est alors arrêté. Ce Mac doit rester éveillé, connecté et le processus doit continuer à tourner.

Dans un autre terminal :

```sh
npm run preview:invite -- "Évaluateur 01"
npm run preview:invite -- "Évaluateur 02" operator
npm run preview:invite -- "Observateur 03" viewer
```

Les liens personnels sont enregistrés dans **`.data/preview/INVITATIONS.md`**, fichier local privé exclu de Git et du paquet de sources. Envoyer un lien distinct à chaque personne. Le rôle par défaut `command` permet d’essayer les fonctions de conduite sans accéder à l’administration. Chaque invitation crée une copie indépendante du scénario fictif. Maximum 30 invitations par base de démonstration, 3 dossiers par compte et 1 000 fiches par dossier.

Le visiteur ouvre son lien dans Brave, Firefox, Safari ou un autre navigateur récent et confirme qu’il n’utilisera que des données fictives. Le lien est un secret donnant accès à son exercice : le conserver comme un mot de passe. Son code figure dans le fragment de l’URL, retiré de la barre d’adresse au chargement ; le serveur ne reçoit pas ce fragment comme chemin HTTP. La connexion envoie ensuite le code au serveur dans une requête HTTPS. Seule l’empreinte du code est stockée en base. Cette démonstration utilise une invitation plutôt que le MFA institutionnel.

### Révoquer et arrêter

Chaque entrée du fichier d’invitations contient la commande exacte :

```sh
npm run preview:revoke -- IDENTIFIANT_DE_L_INVITATION
```

La révocation ferme aussi ses sessions existantes. `Ctrl+C` dans le terminal de démonstration arrête le serveur et le tunnel. Un nouveau démarrage produit une nouvelle adresse et révoque toutes les anciennes invitations. Les exercices demeurent localement pour inspection ; aucune suppression automatique n’est effectuée. La limite de 30 invitations compte également les invitations historiques.

Si un arrêt brutal a laissé `.data/preview/running.lock`, lire le PID qu’il contient et vérifier que ce processus ORION est arrêté avant de retirer **ce seul verrou**. Ne jamais lancer deux processus sur la même base embarquée. Ne pas transmettre `control.json` : il contient le secret de gestion des invitations. Ne pas publier les journaux, invitations ou contenus de `.data`.

## Ce qui est partagé

Le navigateur charge l’interface, les cartes et les sources sous AGPL via le tunnel. Les dossiers exigent une invitation valide, les modifications exigent également un jeton anti-CSRF. Les cartes et signes sont servis par ORION ; aucune coordonnée n’est envoyée à swisstopo. En revanche, **le trafic de cette démonstration passe par Cloudflare** : ce n’est pas une preuve d’hébergement suisse ni une configuration autorisée pour des données cantonales. Ne saisir aucun nom réel, information sensible ou détail d’intervention.

Les [Quick Tunnels Cloudflare](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/) sont destinés aux essais, sans garantie de disponibilité, avec une limite de 200 requêtes simultanées. Une présentation durable à une institution doit utiliser son hébergement convenu, son domaine et ses contrôles d’exploitation.

## Parcours conseillé — dix minutes

1. Consulter la situation fictive et changer le fond swisstopo (couleur, gris, sombre, aérien).
2. Créer un renseignement en distinguant heure d’observation, source et fiabilité.
3. Créer un ordre avec le formulaire OIMDE, attribuer un responsable et une échéance ; vérifier le suivi dans le journal.
4. Placer un signe officiel sur la carte et examiner sa position MN95 approchée.
5. Mettre à jour un moyen, puis préparer et valider un rapport.
6. Ouvrir « Cadre du dossier » et examiner les informations nécessaires à un pilote institutionnel.
7. Exporter le dossier fictif en indiquant la finalité et le destinataire. Le téléchargement ne transmet rien à ce destinataire.

Recueillir les retours hors des dossiers opérationnels : terminologie, signes manquants, étapes de validation, lisibilité et exigences d’exploitation. ORION reste un projet indépendant à faire recetter avec la PCi genevoise.
