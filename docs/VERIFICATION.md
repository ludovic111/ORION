# Validation de la version 0.2

Essais exécutés localement les 18 et 19 septembre 2026. Cette validation technique ne constitue pas une recette métier ni une homologation institutionnelle.

## Automatisation locale

- **31 tests réussis** : authentification, MFA, séparation des dossiers, lecture seule, privilèges de conduite, CSRF, validation, conflits d’édition, imports atomiques, signes et liaisons, audit, exports, clôture, suspension, expiration, persistance après redémarrage et primitives cryptographiques. La version 0.2 couvre aussi les invitations, consentements, expiration/révocation, exercices isolés, cadre de traitement, minimisation de l’audit, OIMDE et formules MN95 (exemples officiels et balayage du domaine genevois).
- **17 scénarios API réussis sur PostgreSQL natif 18.4** en plus de PGlite. Base temporaire distincte, certificat d’essai, connexion TLS vérifiée. Rejet du certificat non reconnu et du rôle propriétaire. Le compte applicatif ne peut ni modifier l’audit, ni supprimer sa table, ni désactiver son déclencheur.
- Les **268 SVG originaux** correspondent à leurs empreintes enregistrées. Les copies d’affichage préservent tout le contenu graphique, seul l’élément racine est recadré.
- Vérification TypeScript et compilation de production réussies. Audit npm de production : **aucune vulnérabilité connue signalée** lors de la vérification ; ce résultat n’est pas un audit de sécurité du produit.

Commandes reproductibles : `npm run format:check`, `npm run check`, `npm test`, `npm run test:postgres`, `npm run build`, `npm audit --omit=dev`.

## Navigateur

Parcours exécutés dans le navigateur intégré :

- Connexion à la démonstration, création d’une entrée journal et persistance après rechargement.
- Fonds swisstopo couleur et aérien, images locales chargées et choix conservé.
- Changement d’état d’un moyen, retour à son état initial et traçabilité.
- Création et validation d’un rapport depuis le journal.
- Création d’un dossier vide, placement d’un poste d’assistance avec le SVG OFPP, séparation des objets et clôture du dossier d’essai.
- Consultation du graphe des liaisons et du registre de transmissions.
- Vérification de la chaîne d’audit depuis l’administration.
- Contrôle visuel du tableau de bord à 1280 px et à 390 × 844 px, sans débordement horizontal à 390 px.

Les objets de test portent le préfixe **QA** ; ils appartiennent uniquement à la démonstration fictive. Ils restent présents pour rendre les essais vérifiables.

## Limites d’environnement

Docker est présent en ligne de commande mais aucun daemon n’est démarré : l’image n’a pas été construite localement. La CI GitHub du dépôt privé a exécuté les tests PostgreSQL 17 et construit l’image de la version précédente avec succès (exécution 35428054378). Les résultats de chaque nouvelle version sont disponibles dans GitHub Actions ; ne pas attribuer à une révision une validation d’une autre révision.

Aucun certificat ni serveur PostgreSQL de l’État n’a été fourni. Le raccordement à cette infrastructure, la restauration, le SSO, l’audit externe, la montée en charge et la recette métier restent à valider avec l’exploitant. Les interactions testées ici ne couvrent pas tous les navigateurs ni toutes les technologies d’assistance.

## Essai partagé 0.2 — 19 septembre 2026

Dans Brave : connexion à l’exercice local, contrôle visuel du tableau de bord et de la carte, consultation du cadre du dossier. Puis accès par le lien HTTPS Cloudflare avec invitation, confirmation du caractère fictif, chargement du dossier personnel et passage du fond swisstopo sombre à couleur. Les deux onglets ont été laissés ouverts.

Par requêtes HTTPS sur le tunnel réellement lancé : accès anonyme aux dossiers rejeté (401), connexion par invitation, lecture du seul exercice affecté, fiches chargées, cookies Secure/HttpOnly/SameSite Strict, déconnexion puis rejet de l’ancienne session. Les chemins de secrets ne renvoient aucun fichier secret (le fallback SPA renvoie uniquement la page publique). Quatre invitations distinctes ont été préparées localement, sans envoi à des tiers.

Les tests du cadre et des invitations s’exécutent sur PGlite ; les 17 scénarios API existants sont également rejoués sur PostgreSQL natif. Le rôle SQL institutionnel a accès à la nouvelle table de gouvernance, mais ne peut pas lire la table d’invitations de démonstration. Les essais automatisés d’isolation et de révocation ne constituent pas un test de pénétration externe.
