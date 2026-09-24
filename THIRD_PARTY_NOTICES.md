# Composants tiers

Le code orion aic est sous AGPL-3.0-only. Les dépendances conservent leurs licences respectives ; les fichiers exacts se trouvent dans les paquets installés, et leurs versions/intégrités dans `package-lock.json`.

## Code

- React et React DOM — MIT.
- Lucide React (icônes) — ISC.
- Zod — MIT.
- fflate (compression, archives ZIP des documents bureautiques) — MIT.
- jsPDF et jsPDF-AutoTable (PDF) — MIT.
- qrcode-generator (QR codes) — MIT.
- Leaflet (carte) — BSD-2-Clause.
- d3-force (réseau des liens) — ISC.
- Motion — MIT.
- selfsigned, @peculiar/x509 (MIT) et PKI.js (BSD-3-Clause) — certificat du mode réseau local (`npm run lan`), jamais servis au navigateur.
- Vite, TypeScript, Prettier et leurs dépendances — licences propres aux paquets, outils de développement uniquement.

Le design (« atelier éditorial » : papier crème, encre, un seul point braise) suit la référence `docs/DESIGN.md` ; il est écrit pour ce projet.

## Polices

- IBM Plex Sans / Mono — SIL Open Font License 1.1 ; texte dans `docs/licenses/`.
- Inter (titres) — SIL Open Font License 1.1 ; texte dans `docs/licenses/Inter.txt`.

Toutes les polices sont hébergées avec l’application.

## Données

- **Signes conventionnels civils OFPP** (`public/symbols/`) : jeu SVG français publié par l’Office fédéral de la protection de la population ; provenance et empreintes dans `docs/symbols-provenance.json`. Les signes restent la propriété de l’OFPP ; leur présence n’implique aucune approbation du produit.
- **Fonds de carte swisstopo** (cartes nationales couleur et grises, SWISSIMAGE) : chargés depuis `wmts.geo.admin.ch` et affichés avec la mention « © swisstopo », conformément aux conditions des géodonnées gratuites de la Confédération.
- **OpenStreetMap** : tuiles `tile.openstreetmap.org`, « © contributeurs OpenStreetMap », données ODbL ; usage modéré conforme à la politique d’utilisation des tuiles.
- **Recherche de lieux** : API de recherche geo.admin.ch.
- **Prévisions météo** : Open-Meteo (CC BY 4.0), modèles de MétéoSuisse (ICON-CH) lorsque disponibles.

Les références métier citées (OFPP, CSSP, MétéoSuisse) ne sont pas une approbation du produit.
