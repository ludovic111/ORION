# orion aic · système de design

> Un outil de poste de conduite, pas une page de lancement. Papier, encre, un seul point orange pour ce qui est en direct. Les chiffres se lisent du premier coup d’œil, à 3 h du matin, sous néon ou à la lampe frontale.

Ce document est la référence de toute l’interface. Il est lu avant d’écrire un écran. Les jetons vivent dans `src/styles.css` (Papier et Graphite), `src/palettes.css` (les autres thèmes) et la couche globale `src/atelier.css`. Le kit de composants est décrit dans [UI.md](UI.md).

## Parti pris

1. **Auteur, pas moyenne.** Chaque choix (police, couleur, espacement) a une raison liée au métier. Ce qui ressemble à « l’interface générée par défaut » est retiré.
2. **Le papier.** L’écran reprend la logique des fiches A4 imprimées : même police, mêmes filets, même hiérarchie. Un rapport à l’écran et sur papier se reconnaissent.
3. **Le chiffre d’abord.** Un compteur affiche la vraie valeur immédiatement : pas de nombre qui défile depuis zéro, pas d’animation avant l’information.
4. **Une seule couleur d’emphase par écran.** Le point braise `--ember` marque ce qui est en direct (engagement en cours, synchronisation). Les états (`--ok`, `--warn`, `--crit`) servent aux états, jamais à la décoration.
5. **Le mot dit l’état.** Une étiquette n’a pas de pastille décorative devant ; un point n’apparaît que pour ce qui demande une action maintenant (`.pill.crit`).

## Ce qu’on ne fait pas

Ces motifs signalent une interface « vibe codée » (générée sans direction). Ils sont proscrits :

| Motif                                                      | À la place                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Inter partout, ou police système sans choix                | IBM Plex Sans / Plex Mono, la police des fiches imprimées                              |
| Dégradés violet-bleu, halos, lueurs colorées, verre dépoli | Aplats, une ombre douce unique, filets fins                                            |
| Rangée de 4 à 6 cartes « statistique » identiques          | Une ligne de chiffres réglée (filets, chiffres en mono, zéros grisés) — voir Situation |
| Grille de pilules à icône « fonctionnalités »              | Un sommaire : terme + une ligne factuelle (écran d’accueil)                            |
| Icône étincelles ✨ pour « magique », « standard », « IA » | L’icône du geste réel (ajouter une liste, document, lecture)                           |
| Pastille de couleur devant chaque étiquette                | Le mot seul ; un point seulement pour l’urgent                                         |
| Décors animés (électrocardiogramme, anneaux qui pulsent)   | Rien. Le mouvement accompagne un changement d’état, il ne décore pas                   |
| Nombres qui comptent depuis zéro                           | La valeur, tout de suite                                                               |
| Accroches vagues (« tout relié », « sans limites »)        | Ce que fait l’outil, avec les mots du métier (« Tenir la conduite. »)                  |
| Majuscules espacées sur tous les libellés                  | Libellés en casse normale, `--text-2`                                                  |
| Emoji en guise d’icônes                                    | Icônes Lucide au trait, monochromes                                                    |

Sources de cette liste : [Fountain Institute — 7 signs a UI has been vibe coded](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui), [Developers Digest — 16 AI design slop patterns](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it), [Spot the slop (Kosta C.)](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c), [MindStudio — design system approach](https://www.mindstudio.ai/blog/claude-design-avoid-ai-slop-design-system).

## Typographie

| Rôle                    | Famille       | Graisse | Taille                | Remarque                                  |
| ----------------------- | ------------- | ------- | --------------------- | ----------------------------------------- |
| Titre d’accueil         | IBM Plex Sans | 500     | 44–69 px (clamp)      | Interlettrage −0.02em, point braise final |
| Titre de module         | IBM Plex Sans | 500     | 28 px                 | `--display`                               |
| Titre de carte          | IBM Plex Sans | 500     | 17–19 px              |                                           |
| Texte                   | IBM Plex Sans | 400     | 14 px, interligne 1.5 | `--sans`                                  |
| Libellé                 | IBM Plex Sans | 500     | 12.5 px               | `--text-2`, jamais en capitales           |
| Heures, codes, chiffres | IBM Plex Mono | 400–500 | selon contexte        | `--mono`, chiffres tabulaires             |

Plex a été dessinée pour la documentation technique : elle se lit bien en petit, ses chiffres sont nets, et elle est déjà celle des fiches A4 (`src/print/print.css`). Toutes les polices sont servies par l’application (licence OFL, `docs/licenses/`).

## Jetons (thème Papier)

| Jeton                                          | Valeur                       | Rôle                             |
| ---------------------------------------------- | ---------------------------- | -------------------------------- |
| `--bg`                                         | `#e4dfd9`                    | Papier crème du fond             |
| `--bg-1` / `--solid`                           | `#ffffff`                    | Cartes, fiches, champs           |
| `--bg-2` / `--bg-3`                            | encre à 4,5 % / 8,5 %        | Survol, zones en retrait         |
| `--text`                                       | `#050505`                    | Encre                            |
| `--text-2` / `--text-3`                        | `#737373` / `#86827e`        | Texte secondaire, métadonnées    |
| `--line` / `--line-2`                          | encre à 10 % / `#c7c7c7`     | Filets                           |
| `--accent` / `--on-accent`                     | `#171717` / `#ffffff`        | Bouton principal                 |
| `--ember`                                      | `#ff6a1f`                    | Le point de ce qui est en direct |
| `--ok` `--warn` `--crit`                       | tons terre                   | États opérationnels              |
| `--shadow-xl`                                  | `0 6px 27px rgba(0,0,0,.07)` | L’unique ombre                   |
| `--radius-lg` / `--radius` / `--radius-button` | 20 / 12 / 8 px               | Cartes / champs / boutons        |

Les écrans n’utilisent que ces variables : un thème ne redéfinit que les jetons, jamais les composants.

## Thèmes de couleur

`data-theme` (`light` / `dark`) fixe le mode ; `data-palette` choisit le thème dans ce mode. Chaque poste garde un thème clair et un thème sombre (`prefs.lightPalette`, `prefs.darkPalette`, `src/app/prefs.ts`) ; le bouton soleil / lune et le mode « comme le système » passent de l’un à l’autre.

| Thème       | Mode   | Fond      | Encre     | Accent    | Point     | Usage                                                      |
| ----------- | ------ | --------- | --------- | --------- | --------- | ---------------------------------------------------------- |
| `papier`    | clair  | `#e4dfd9` | `#050505` | `#171717` | `#ff6a1f` | Par défaut                                                 |
| `ardoise`   | clair  | `#dde2e6` | `#101b26` | `#1f3b57` | `#d9531e` | Plus froid, reposant sous néon                             |
| `signal`    | clair  | `#eeece6` | `#0d1b2e` | `#0b4a8f` | `#f08a00` | Bleu et orange du signe international de protection civile |
| `contraste` | clair  | `#ffffff` | `#000000` | `#000000` | `#c4000c` | Plein soleil, basse vision : bordures 1,5 px, focus jaune  |
| `graphite`  | sombre | `#121110` | `#efebe6` | `#e4dfd9` | `#ff6a1f` | Par défaut la nuit                                         |
| `minuit`    | sombre | `#0d1318` | `#e3eaf0` | `#cddcea` | `#ff8a3d` | Salle de conduite sombre                                   |
| `nuit`      | sombre | `#0a0504` | `#f0624a` | `#d24a33` | `#ff3b24` | Terrain de nuit : que du rouge, carte inversée et filtrée  |

Règles :

- **Nuit tactique** n’émet que des grandes longueurs d’onde : pas de blanc, pas de bleu. Les états se distinguent par la luminosité et par leur mot, pas par la teinte. Les tuiles de carte sont inversées puis teintées (`.leaflet-tile-pane`), les tracés, signes et photos passent par le même filtre rouge.
- **Contraste élevé** vise au-delà de WCAG AA : texte noir pur, bordures noires sur les cartes, anneau de focus jaune.
- Un nouveau thème s’ajoute en deux endroits : une entrée dans `PALETTES` (`src/app/palettes.ts`, avec son nuancier) et un bloc `:root[data-palette="…"]` dans `src/palettes.css`.

## Composants

- **Carte** (`.card`) : blanc, rayon 20 px, ombre unique, marge interne 32 px (20 px sur téléphone).
- **Bouton principal** : aplat `--accent`, texte `--on-accent`, rayon 8 px. Un seul par zone.
- **Bouton secondaire** : fond `--bg-1`, filet `--line-2`.
- **Étiquette** (`.pill`) : pilule 24 px, filet fin, sans pastille ; `.crit` garde un point.
- **Ligne de chiffres** (`.situation-kpis`) : filets haut et bas, chiffre en Plex Mono 26 px, libellé dessous, zéro en `--text-3`, retard en `--crit`.
- **Sommaire** (`.hero-index`) : deux colonnes, filet au-dessus de chaque terme, une ligne factuelle.
- **Point en direct** : 8 px, `--ember`, à gauche du libellé.

## Mouvement

Durées de 150 à 280 ms, courbe `--ease`. Le mouvement confirme une action (un objet posé apparaît, un panneau s’ouvre) ou signale un changement venu d’un autre poste (un objet de carte glisse vers sa nouvelle place). Il ne boucle jamais pour décorer. `data-motion="reduced"` ou la préférence système coupent tout.

## Carte

- Les objets restent exactement là où on les pose : un glissement de moins de 8 px est ignoré, un pincement ou un zoom pendant le glissement annule le déplacement, et sur écran tactile un objet se déplace seulement une fois sélectionné. Le cadenas verrouille tous les objets.
- Les signes gardent leur taille à l’écran à tous les zooms ; leur centre est le point géographique.
- Les panneaux flottants sont des cartes pleines (pas de verre dépoli).
