# Journal d’intervention : choix métier et sources

Recherche du 22 septembre 2026. Ces références guident la conception ; ORION n’est pas présenté comme un formulaire officiel ni comme un produit homologué.

## Sources primaires

- [OFPP — Documents de formation](https://www.babs.admin.ch/fr/documents-de-formation) : manuel Aide à la conduite, suivi de la situation, annexes et formulaires. Le suivi collecte, apprécie et restitue les informations utiles à la conduite.
- [OFPP — Manuel Aide à la conduite, suivi de la situation](https://www.babs.admin.ch/dam/fr/sd-web/osRuzgRIRWaD/HB-Fhrunterstuetzung202201-fr.pdf) : documentation chronologique des événements et produits de suivi. Le portail officiel ci-dessus constitue le point d’accès actualisé aux versions téléchargeables.
- [CSSP — Manuel Conduite des événements majeurs, formulaire 8.7 Journal d’intervention](https://www.feukos.ch/wp-content/uploads/2022/04/Handbuch_Grossereignisse_FR.pdf) : numéro, quand, quoi, où, qui, intervention et date.
- [CSSP — Règlement Conduite d’intervention, 2022, p. 43](https://www.feukos.ch/wp-content/uploads/2023/01/Reglement_Einsatzfhrung_FR.pdf) : consigner missions et retours d’information/quittances.
- [OFPP — MCP, Demande d’aide](https://www.babs.admin.ch/dam/fr/sd-web/47oYWkYhFCef/FiBS-K6-ZMZ-HB-Hilfebegehren-fr.pdf) : date/heure, interlocuteur, réception, classification, canal, lieu, description, dangers, moyens et besoins.
- [Préposé genevois — Sécurité des données](https://www.ge.ch/document/18567/telecharger) et [portail du PPDT](https://www.ge.ch/organisation/protection-donnees-transparence) : mesures techniques et organisationnelles selon le risque et le contexte institutionnel. Les exigences juridiques précises doivent être qualifiées par l’organisation.

## Réseau radio Polycom (recherche du 23 septembre 2026)

- [OFPP — Systèmes de communication](https://www.babs.admin.ch/fr/systemes-de-communication-pour-la-conduite-et-lintervention) : Polycom, réseau radio de sécurité TETRAPOL chiffré, sous-réseaux cantonaux.
- [OFPP — Aide-mémoire Règles de communication radio (2022)](https://www.babs.admin.ch/dam/fr/sd-web/iMa3qxK30t2j/Behelf-Sprechregeln-fr.pdf) : le nom d’appel désigne la fonction, pas la personne ; contrôle de liaison noté THREE (bon), TWO (faible mais compréhensible), ONE (insuffisant) ; alphabet international.
- [Manuel Aide à la conduite, partie Télématique](https://www.babs.admin.ch/dam/fr/sd-web/osRuzgRIRWaD/HB-Fhrunterstuetzung202201-fr.pdf) et ses [annexes](https://www.babs.admin.ch/dam/fr/sd-web/5XsdZqvuaRIB/AnhaengeHB-Fhrunterstuetzung-fr.zip) : le plan du réseau radio est l’annuaire de l’utilisateur (nom d’appel, n° de terminal, fonction, nom, sur le réseau, remarques ; groupe, direct, relais et alternative).
- [Mode d’emploi TPH900 (OFPP, 2025)](https://www.babs.admin.ch/dam/fr/sd-web/lVRb4KHxIQ6X/Bedienungsanleitung%20TPH900%202025-03-fr.pdf) : talkgroups (G…), mode direct (D…), relais IDR (R…).
- [OFPP — Matériel radio Polycom](https://www.protection-civile.ch/documents/telechargement/polycom-materiel-radio-ofpp-1503-00-1-01-f.pdf) : identifiant RFSI, mise en service et contrôle de liaison.
- [Manuel Logistique Matériel](https://www.babs.admin.ch/dam/fr/sd-web/Ievf5dmDDrjl/04-HB-Logistik-Material-fr.pdf) : quittance à la remise, contrôle de complétude au retour.

Les numéros de groupes et RFSI réels viennent du plan de flotte cantonal (OCPPAM / police). La démonstration utilise des valeurs fictives. Un terminal perdu doit être annoncé pour blocage selon la procédure cantonale.

## Traduction dans le produit

| Besoin du journal                  | Mise en œuvre                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| Quoi, quand, où, qui               | Message et événement à la saisie ; émetteur, destinataire, auteur et lieu disponibles |
| Ne pas confondre fait et réception | Trois temps distincts : événement, réception, enregistrement automatique              |
| Apprécier une information          | Confirmation déclarée, canal et source ; aucune fiabilité calculée par IA             |
| Documenter la conduite             | Nature décision/mission/demande/quittance, mesure, responsable, échéance, état        |
| Retrouver une entrée               | Numéro stable, recherche insensible aux accents, filtres et chronologie               |
| Corriger sans effacer              | Nouvelle version avec auteur, motif et date, historique consultable                   |
| Passer la relève                   | Points ouverts et échéances calculés ; relève rédigée et consignée par l’opérateur    |
| Travailler sur un autre PC         | Archive chiffrée réimportable, aperçu, doublons et conflits explicités                |
| Reprendre après crash              | Reprise chiffrée locale de la session ; phrase de récupération sans compte            |
| Archiver un message sur papier     | Fiche A4 par entrée : transmission, texte, lieu, conduite, traçabilité, visa          |
| Savoir qui détient quelle radio    | Registre des remises par terminal, retour, état, accessoires, journalisation          |
| Plan du réseau radio               | Noms d’appel, groupe principal et alternative, sur le réseau, dernier contrôle        |

Le formulaire est volontairement progressif : message, heure, type et émetteur visibles ; source/localisation, suites et observations se déplient. Les références et notes permettent de consigner les détails d’intervention non couverts par des champs normalisés. Les pièces jointes binaires ne sont pas incluses : leur référence peut être notée et les fichiers conservés dans le système autorisé de l’organisation.

## Limites et migration

Depuis la version 2.0 (orion aic), la carte, l’équipe, les messages et les autres produits de l’aide à la conduite existent comme modules reliés au journal ; le journal reste le registre de référence. Aucune transmission radio réelle : le plan radio documente le réseau, il ne pilote pas les terminaux, et le module Messages consigne des messages reçus par les moyens usuels. La synchronisation entre postes est explicite (code de session) ; l’identité reste déclarative. Les imports CSV sont volontairement limités au modèle du journal ; aucun mapping arbitraire Excel n’est promis.

Les sauvegardes serveur ORION 0.3 restent en place sur leur stockage antérieur. L’application 1.0 ne les contacte pas. Avant de retirer l’ancien service, conserver ses exports et sauvegardes conformément à la politique de l’exploitant. Les exports JSON ORION 0.3 sont convertibles en journal par l’importeur ; les autres objets métier sont laissés hors de cette application.
