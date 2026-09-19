# Sources métier et cartographiques

Consultation : 18 septembre 2026. Les exemples ORION sont fictifs ; les noms, effectifs, niveaux de crue, positions et organisations d’exercice ne doivent pas être interprétés comme des informations opérationnelles.

## Genève

- [État-major cantonal de conduite, État de Genève](https://www.ge.ch/organisation/etat-major-cantonal-conduite) : l’EMCC conduit le dispositif ORCA-GE lorsqu’il est activé par l’autorité politique et réunit les partenaires nécessaires. ORION utilise cette notion de situation partagée, sans prétendre remplacer les outils officiels.
- [Protection des données et transparence, PPDT](https://www.ge.ch/organisation/protection-donnees-transparence) : autorité compétente pour la LIPAD auprès des institutions publiques cantonales et communales.
- [Fiche PPDT sur l’AIPD](https://www.ge.ch/document/fiche-info-du-ppdt-analyse-impact-relative-protection-donnees-personnelles-aipd) : référence pour cadrer l’analyse des risques avec l’institution. Aucune conclusion de conformité n’est tirée du seul fait de l’hébergement local.

## Doctrine et signes

- [Documents de formation OFPP](https://www.babs.admin.ch/fr/documents-de-formation) : manuel d’aide à la conduite, suivi de la situation, formulaires de conduite, règles de communication et signes conventionnels civils.
- [Jeu SVG français OFPP 2026](https://www.babs.admin.ch/dam/fr/sd-web/89hcDN8xXWLQ/2026-Zivile%20Signaturen%20svg-fr.zip), référencé le 27 mars 2026 : 268 fichiers, comprenant aussi exemples et pictogrammes. Le catalogue conserve chemin d’origine et SHA-256 ; le fichier `symbols-provenance.json` conserve la provenance de l’archive.
- [Aide-mémoire des signes conventionnels civils, août 2026](https://www.babs.admin.ch/dam/fr/sd-web/M4azUFMorbhf/HK-ZivileSignaturen-120x168mm-2026-fr_web.pdf) : référence pour la recette métier et la sélection des signes. Un symbole « barrage » peut désigner un ouvrage hydraulique ; il ne faut pas l’employer indistinctement pour une route barrée.
- [Organe de conduite dans la protection de la population, OFPP](https://www.babs.admin.ch/fr/lorgane-de-conduite-dans-la-protection-de-la-population) : fonctions de l’aide à la conduite et complémentarité des partenaires.

L’application préserve la palette des SVG. Les catégories de calques ORION ne redéfinissent pas les conventions officielles. Un exemple composé ou une zone du catalogue reste un exemple : l’opérateur choisit le signe et sa portée géographique.

## Fonds officiels

- [XYZ, documentation geo.admin.ch](https://docs.geo.admin.ch/visualize-data/xyz.html) : schéma des tuiles EPSG:3857.
- [WMTS et mise à jour des caches](https://docs.geo.admin.ch/visualize-data/wmts.html) : origine des tuiles et contrôle de fraîcheur.
- [FAQ des géodonnées gratuites swisstopo](https://www.swisstopo.admin.ch/fr/faq-geodonnees-gratuites) : usages, y compris commerciaux, et attribution de source.
- [Conditions générales IFDG](https://www.geo.admin.ch/fr/conditions-generales-utilisation-ifdg/) : conditions des géoservices et modalités d’exploitation.

Fonds utilisés : `ch.swisstopo.pixelkarte-farbe`, `ch.swisstopo.pixelkarte-grau`, `ch.swisstopo.swissimage`. L’affichage sombre est un traitement visuel du fond gris, jamais des signes. Les capacités officielles EPSG:3857, vérifiées le 19 septembre 2026, publient les cartes jusqu’au niveau 19 et SWISSIMAGE jusqu’au niveau 20. ORION affiche au maximum le zoom 18 (cartes) ou 19 (aérien), en réservant un niveau supplémentaire aux écrans Retina. Le cache local reste limité au zoom natif 14, sans agrandissement artificiel.

## Compléments 0.2 — consultés le 19 septembre 2026

- [Formulaire OIMDE OFPP](https://www.babs.admin.ch/dam/fr/sd-web/a2VQyjrJLQbX/FiBS_HiForm_Auftrag_OAABS-fr.docx) : les cinq rubriques structurent les ordres ORION ; aucun automatisme de transmission.
- [Formules approchées swisstopo, décembre 2016](https://www.swisstopo.admin.ch/dam/fr/sd-web/KLRCX9XIdXDu/ch1903wgs84-FR.pdf) : conversion MN95/WGS84 pour navigation, avec exemples numériques indépendants dans les tests.
- [Matrice juridique et sources cantonales/fédérales](COMPLIANCE.md) : champ d’application, LIPAD/RIPAD, PFPDT, PPDT et OFCS ; décisions institutionnelles à documenter.

## Suivi des missions et relève (0.3)

- [OFPP — Documents de formation](https://www.babs.admin.ch/fr/documents-de-formation), rubriques MCP19.4 « Missions / points en suspens » et MCP71.3 « Contrôle de la mission », consultées le 19 septembre 2026.
- [Formulaire MCP71.3](https://www.babs.admin.ch/dam/fr/sd-web/NUjEjuiNvShh/FiBS_71_3_Auftragskontrolle-fr.docx) : mission attribuée, responsable, contrôle, écart et mesures correctives. ORION fournit un suivi numérique des missions existantes ; il ne prétend pas reproduire toutes les rubriques ni remplacer ce formulaire officiel.
- La fenêtre « Dans l’heure » et la synthèse de relève sont des aides propres à ORION, pas de nouvelles conventions OFPP. Les signes cartographiques officiels restent inchangés. La relève est un brouillon daté qui conserve les incertitudes et les références des objets, à vérifier et valider par le commandement.
