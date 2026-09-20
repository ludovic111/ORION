# Présentation ORION — 21 septembre 2026

## Ouvrir l’essai

[Ouvrir ORION](https://orion-conduite.pages.dev). Saisir un prénom ou pseudonyme, puis **Ouvrir mon exercice**. Aucun code d’invitation ni mot de passe. Le scénario fictif « Crue de l’Arve » est copié dans un espace individuel, avec journal, carte, moyens, transmissions et rapports. Deux prénoms identiques correspondent à deux espaces distincts.

## Parcours de cinq minutes

1. Situation générale : montrer les renseignements, les moyens et la carte.
2. Journal : ajouter un renseignement fictif, préciser la source et le degré de confirmation.
3. Carte : consulter les fonds swisstopo et les signes OFPP ; ne pas présenter les données du scénario comme une alerte actuelle.
4. Moyens : modifier l’état d’une formation fictive.
5. Rapports : préparer une synthèse, la relire et la valider humainement.
6. **Nouveau dossier** : créer un exercice vide en trois étapes ; le sélecteur permet de revenir au scénario initial.

Le terme utilisé par ORION est **dossier d’engagement**, avec un mode **Exercice**. La terminologie et le circuit de conduite précis restent à faire valider par l’ORPC rencontrée.

## Repères pratiques

- Sur un poste partagé, se déconnecter entre deux personnes : le navigateur conserve sinon le même exercice.
- Recharger la page conserve la session et les saisies. Après déconnexion ou expiration, saisir le même nom ne récupère pas l’ancien exercice.
- Session : huit heures au maximum, expiration après 30 minutes sans activité. Les données ne sont pas automatiquement supprimées à l’expiration.
- Trois dossiers par espace ; création publique bloquée à 100 comptes de démonstration, historiques compris. Les accès partagent une limite de 20 tentatives par adresse IP sur 15 minutes.
- La version hébergée fonctionne sans laisser le Mac allumé. Une connexion Internet reste nécessaire ; aucune écriture hors ligne n’est disponible.
- Aucun envoi radio, e-mail ou appel n’est réalisé par l’application. Les transmissions sont consignées par l’opérateur.

## Cadre à expliquer

Démonstration indépendante sur Cloudflare, réservée aux données fictives. Un pseudonyme suffit. Le rôle « Commandement » permet de tester les fonctions et ne constitue pas une habilitation professionnelle vérifiée.

Les contrôles techniques ne valent pas homologation. Avant un usage réel : recette PCi, responsables désignés, cadre LIPAD, validation de l’hébergement et de la sous-traitance, conservation/archives, audit de sécurité et sauvegarde/restauration observée. Voir [la matrice de conformité](COMPLIANCE.md).

## Vérifications du 20 septembre 2026

- Suite automatisée : 54 tests réussis ; 17 scénarios supplémentaires sur PostgreSQL natif avec TLS et droits restreints.
- Cloudflare local : entrée sans invitation, homonymes isolés, écritures, conflits simultanés, rollback, export, rôles, CSRF, origine et révocation. Données et sessions retrouvées après arrêt puis redémarrage.
- Site public : mêmes contrôles API réussis ; parcours navigateur avec création d’espace par prénom, saisie du journal, création d’exercice vide, retour au scénario, modification d’un moyen, carte couleur, brouillon de rapport et validation explicite.
- Aucun avertissement ni erreur dans la console du navigateur sur ce parcours. Compilation, contrôle TypeScript et formatage réussis. Audit des dépendances de production : aucune vulnérabilité signalée.
- Ces vérifications portent sur le périmètre décrit. Elles ne constituent pas un test de charge, un audit juridique ou un audit de sécurité indépendant, et n’incluent pas une recette terrain PCi ni une imprimante physique.
