# ORION — proposition de pilote institutionnel

## Produit proposé

Un poste de travail web pour les aides à la conduite : transformer les renseignements reçus en une situation partagée, documenter les décisions, localiser les événements et les moyens, suivre les transmissions et préparer les rapports. L’institution exploite le logiciel dans sa propre infrastructure et conserve la maîtrise de ses données.

Le produit reprend le design ORION fourni. Les fonctions documentées dans le README sont implémentées ; les raccordements à l’annuaire et aux systèmes cantonaux sont des prestations d’intégration à cadrer. ORION est un projet indépendant, sans partenariat commercial ni approbation cantonale revendiqués.

## Démonstration commerciale proposée

1. Ouvrir l’exercice fictif « Crue de l’Arve ».
2. Saisir un renseignement reçu, en indiquant sa source, sa priorité et son degré de confirmation.
3. Le positionner sur la carte swisstopo avec un signe officiel OFPP. Comparer les fonds couleur, gris et aérien.
4. Attribuer la suite à donner, engager un moyen, consigner un ordre et une transmission.
5. Créer les liens explicites entre renseignement, ordre et moyen.
6. Préparer et valider un rapport de situation, l’imprimer et exporter le dossier.
7. Montrer un compte en lecture seule, le cloisonnement des dossiers et la vérification du journal d’audit.

## Modèle commercial compatible avec le libre

Le code est sous AGPL-3.0. Des prestations payantes peuvent couvrir le pilote, le déploiement autonome, l’intégration au SI, la reprise de données, la formation, la maintenance et le support. Les montants et niveaux de service restent à établir après qualification du besoin ; aucun tarif ou engagement contractuel n’est inventé.

L’ouverture du code facilite la revue et la réversibilité, mais ne constitue pas une certification. La vente future ne retire pas les droits accordés sur les versions déjà distribuées. Une éventuelle autre licence pour des versions futures exige une maîtrise des droits de tous les contributeurs et une vérification juridique ; elle n’est pas présumée ici. Références : [licence AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html), [vente de logiciel libre](https://www.gnu.org/philosophy/selling.en.html).

## Lot de pilote à proposer

| Étape               | Livrable                                                   | Critère de réception                                       |
| ------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| Atelier métier      | Périmètre, terminologie, matrice de rôles                  | Accord des responsables de l’aide à la conduite            |
| Installation isolée | Instance institutionnelle et PostgreSQL                    | Aucun service cloud imposé, MFA et habilitations vérifiées |
| Intégration         | Contrats d’interface et reprise d’un jeu de données validé | Traçabilité des champs et gestion des erreurs              |
| Exercice dirigé     | Scénario, rapport et retours des opérateurs                | Parcours complet sans perte de données                     |
| Revue indépendante  | Rapport sécurité et décisions sur les données              | Correction des points bloquants                            |
| Exploitation        | Sauvegarde/restauration, support, continuité               | Objectifs convenus et testés                               |

## Points à faire valider par l’État

- Organisation réelle des ORPC, chaîne de conduite, termes, flux d’information et validité des signes selon les pratiques cantonales.
- Données nécessaires, bases légales, responsables, droits, conservation, archivage et éventuelle AIPD dans le cadre de la LIPAD.
- Authentification institutionnelle, gestion du cycle de vie des comptes et exigences de second facteur.
- Hébergement, certificats, coffre de secrets, sauvegardes, SIEM, disponibilité, conduite en mode dégradé et exigences d’accessibilité.
- Processus d’acquisition et contrat de services appropriés, sans présumer d’une attribution de marché.
- Autorisations de diffusion des ressources tierces et absence d’usage des marques ou emblèmes comme signe d’approbation.

## Ce qui reste avant une exploitation réelle

Audit de sécurité externe, recette PCi, essais de charge, preuve de sauvegarde/restauration, validation des politiques de données et intégrations effectives. La première version est destinée à la démonstration et au pilote supervisé ; aucun écran ne revendique une conformité LIPAD déjà acquise, une disponibilité garantie ou un audit WORM.
