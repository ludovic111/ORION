# Ressources tierces

La licence AGPL-3.0 de ce projet s’applique au code ORION original. Elle ne remplace pas les conditions des ressources officielles, polices ou dépendances.

## Design fourni

Le fichier HTML initial fourni par l’utilisateur est conservé intact. Les codes couleur, organisation des écrans, marque ORION et polices en ont été repris. Le fichier initial et son extraction de référence ne sont pas inclus dans le téléchargement du code du serveur. Les droits sur les éléments du design fourni doivent être confirmés par son titulaire avant publication commerciale.

## OFPP

Source : Office fédéral de la protection de la population, « Signes conventionnels – liste SVG-fichiers », édition française 2026. Voir `docs/symbols-provenance.json` et le catalogue pour les empreintes et chemins originaux.

Les fichiers SVG sources restent identiques aux originaux ; les copies d’affichage ne modifient que le cadrage pour enlever les marges blanches. Certains fichiers officiels contiennent des images matricielles intégrées. Aucune certification, approbation ou affiliation OFPP n’en découle. Les conditions de réutilisation de cette publication doivent être confirmées pour une diffusion commerciale publique ; le code ne requalifie pas ces ressources sous AGPL.

## swisstopo

Source : Office fédéral de topographie swisstopo. © swisstopo.

Fonds carte nationale couleur, niveaux de gris et SWISSIMAGE, cache initial du 18 septembre 2026. Attribution présente sur chaque carte. Voir [conditions et FAQ OGD](https://www.swisstopo.admin.ch/fr/faq-geodonnees-gratuites) et [conditions IFDG](https://www.geo.admin.ch/fr/conditions-generales-utilisation-ifdg/). Les images aériennes peuvent aussi inclure des sources tierces aux frontières ; respecter les conditions du produit, sans les redistribuer sous la licence du code.

## Polices

IBM Plex Sans, IBM Plex Mono et Space Grotesk : SIL Open Font License 1.1. Textes conservés dans `docs/licenses`. Les polices sont servies localement, sans requête Google Fonts.

## Dépendances

Les licences des packages restent dans `node_modules` et les versions exactes dans `package-lock.json`. React/React DOM, Express, Zod, Lucide et les bibliothèques utilitaires sont sous leurs licences amont ; Leaflet est sous BSD-2-Clause, PostgreSQL sous PostgreSQL License et PGlite sous Apache-2.0. Vérifier le fichier de licence de chaque version lors des mises à jour. La nomenclature de dépendances se génère avec `npm sbom --sbom-format=cyclonedx`.
