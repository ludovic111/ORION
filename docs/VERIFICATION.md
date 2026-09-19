# Validation de la version 0.1

Essais exécutés localement le 18 septembre 2026. Cette validation technique ne constitue pas une recette métier ni une homologation institutionnelle.

## Automatisation locale

- **26 tests réussis** : authentification, MFA, séparation des dossiers, lecture seule, privilèges de conduite, CSRF, validation, conflits d’édition, imports atomiques, signes et liaisons, audit, exports, clôture, suspension, expiration, persistance après redémarrage et primitives cryptographiques.
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

Docker est présent en ligne de commande mais aucun daemon n’est démarré : l’image n’a pas été construite localement. La CI est configurée pour rejouer les tests sur PostgreSQL 17 et construire l’image ; elle n’a pas été exécutée sur un hébergeur distant dans cette session.

Aucun certificat ni serveur PostgreSQL de l’État n’a été fourni. Le raccordement à cette infrastructure, la restauration, le SSO, l’audit externe, la montée en charge et la recette métier restent à valider avec l’exploitant. Les interactions testées ici ne couvrent pas tous les navigateurs ni toutes les technologies d’assistance.
