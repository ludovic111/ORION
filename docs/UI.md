# Interface orion aic · guide du kit

Référence pour écrire un module. Tout est en français dans l’interface, en anglais dans le code et les commentaires.

## Principes

- **Tout est facultatif** sauf le strict minimum (un nom, un texte). Aucun champ obligatoire de plus.
- **Tout est modifiable et supprimable** : chaque élément ouvre une fiche (`RecordSheet`) avec « Enregistrer » et « Supprimer ».
- **Valeurs standards + texte libre** : `ComboField` (ou `kind: "combo"` dans un `FieldSpec`) propose les valeurs d’un référentiel en un clic et accepte toute saisie.
- **Tout est relié** : chaque fiche montre ses liens (`LinksPanel`), chaque référence s’affiche avec `LinkChip` (aperçu au survol, clic = ouvrir).
- **Journal clôturé = lecture seule** : `readOnly` du contexte ; toute écriture passe par une seule porte (`src/app/gate.ts`, `src/app/useJournalActions.ts`) qui refuse avec un message visible (« Lecture seule : vous consultez le passé », « Journal clôturé — rouvrez-le pour écrire »). `updateOps` lève alors une erreur, `updateJournal` renvoie `false`. Dans un gestionnaire de clic, écrire `if (!canWrite()) return;` plutôt qu’un `if (readOnly) return;` muet.
- **Heures de Zurich** : les champs date / heure lisent et écrivent l’heure de Zurich quel que soit le fuseau du navigateur (`localInput` / `fromInput` de `ui/fields.tsx`, qui s’appuient sur `shared/time.ts`, exact aux changements d’heure).
- **Superpositions** : fiches, dialogues, palette ⌘K, menus, aperçu et présentation s’inscrivent dans une pile (`src/ui/overlay.ts`, `useLayer`) : seule la plus haute répond à Échap, Tab reste à l’intérieur, le focus revient à sa place à la fermeture. `Sheet` et `Modal` acceptent `dirty` pour demander avant de perdre une saisie.
- **Machine à remonter le temps** : `journal` peut être une version passée (`viewAt !== null`) ; `readOnly` est alors vrai. Afficher depuis `journal`, écrire dans les registres avec `record`, lire l’état actuel avec `live`.
- **Tout est tracé** : ne rien faire de spécial, `updateOps` suffit ; la fiche générique montre déjà « Créé par… » et le bouton Historique. Pour une fiche maison : `<TraceLine target={id} />` (`src/timeline/TraceLine.tsx`) ou `trace(id)`.
- Lisible avant tout : les animations accompagnent, elles ne gênent pas (`data-motion="reduced"` les coupe).

## Contexte (`src/app/context.tsx`)

```ts
const {
  journal,
  author,
  readOnly,
  canWrite,
  now,
  graph,
  updateOps,
  updateJournal,
  lists,
  go,
  focus,
  setFocus,
  open,
  toast,
  print,
  prefs,
  setPrefs,
  help,
  addEntry,
  compose,
  openEntry,
} = useApp();
```

| Clé                         | Usage                                                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `journal.ops`               | Données des modules : `messages`, `cells`, `members`, `resources`, `contacts`, `places`, `agenda`, `facts`, `boards`, `observations`, `alerts`, `links`, `settings` (voir `shared/ops.ts`).    |
| `updateOps(ops => …)`       | Seule façon de modifier `ops`. Utiliser `upsert(ops, "resources", value, author)` et `removeRecords(ops, [id])`. Validé par Zod ; en cas d’erreur, exception avec message.                     |
| `canWrite()`                | Porte d’écriture : `true` si l’écriture est permise, sinon affiche pourquoi et renvoie `false`.                                                                                                |
| `lists("recipients")`       | Valeurs d’un référentiel (`DEFAULT_LISTS` modifiables dans Réglages).                                                                                                                          |
| `graph`                     | `items` (tous les éléments affichables), `byRef`, `edges` (liens explicites et implicites), `degree`.                                                                                          |
| `focus` / `setFocus(null)`  | Élément à montrer quand on arrive depuis un lien (`"resource:<uuid>"`). Le module ouvre la fiche puis remet `setFocus(null)`. `"message:new"` demande un nouveau message.                      |
| `open(ref)`                 | Aller vers n’importe quel élément (entrée du journal, moyen, objet carte…). `open("place:new:resource:<uuid>")` ouvre la carte en mode placement : le point posé est relié à cet élément.      |
| `addEntry(fields, links)`   | Consigne une entrée au journal et la relie aux références données ; renvoie son id.                                                                                                            |
| `compose(preset)`           | Ouvre le formulaire d’entrée prérempli (l’opérateur valide).                                                                                                                                   |
| `queuePrint(job)`           | Impression directe sans aperçu (impression automatique).                                                                                                                                       |
| `print(job)`                | Aperçu A4 : `{ kind: "forms", journal, sheets, title, name }` ou `{ kind: "tables", journal, title, extra, tables, landscape, name }`.                                                         |
| `live` / `viewAt`           | Journal actuel / moment affiché par la machine à remonter le temps (ms, `null` = direct). `setViewAt(ms)` y envoie l’utilisateur.                                                              |
| `trace(id)`                 | Ouvre l’historique d’un élément (versions, restauration).                                                                                                                                      |
| `record(collection, v, id)` | Ajoute à un registre (`snapshots`, `exports`, `presentations`, `forecasts`), même journal clôturé ou dans le passé ; `id` vise le journal d’une requête lancée avant un changement de journal. |
| `exportCenter(preset)`      | Ouvre le centre d’export (`{ sections, viewAt, format }` facultatifs).                                                                                                                         |
| `present(mode, preset)`     | Mode présentation (`"present"`) ou affichage mural (`"wall"`).                                                                                                                                 |
| `help(topic)`               | Ouvre l’aide sur un sujet (id de module ou sujet de `Docs`).                                                                                                                                   |
| `prefs`                     | Réglages du poste : mode (`theme`), thèmes de couleur (`lightPalette`, `darkPalette`), modules masqués, impression automatique (`autoPrint`, `autoPrintRemote`, `autoPrintMessages`).          |

### Conduite (fonctions, diffusions, alertes)

- `usePost()` (`src/post/store.ts`) : fonction, cellule et alertes de ce poste ; `useIdentity(journal, author)` (`src/post/roles.ts`) pour savoir à qui s’adresse une diffusion ou une tâche.
- `openDiffusion({ title, target, recipients, ack })`, `openAssign({ target })`, `openLiaisonMessage()` (`src/post/bus.ts`) : n’importe quel écran ouvre le dialogue « Diffuser », « Attribuer » ou « Message à l’autre PC ». Le bouton « Diffuser » d’une fiche passe simplement `target: "entry:<id>"`.
- `RecipientsField` (`src/post/dialogs.tsx`) : fonctions, cellules, PC en liaison et « Tous » en un clic, plus texte libre.

## Composants

| Fichier             | Composants                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/ModuleHead.tsx` | `ModuleHead` (titre animé, description, actions, bouton d’aide), `EmptyState`                                                           |
| `ui/records.tsx`    | `RecordSheet` (fiche latérale générique), `RecordFields`, type `FieldSpec`                                                              |
| `ui/fields.tsx`     | `TextField`, `ComboField`, `ChoiceField`, `DateTimeField`, `NumberField`, `Toggle`, `TagsField`, `Segmented`, `localInput`, `fromInput` |
| `ui/links.tsx`      | `LinkChip`, `LinksPanel`, `ItemPreview`, `HoverCard`, `ItemSearch`, `KindDot`, `KIND_ICON`, `hueStyle`                                  |
| `ui/Sheet.tsx`      | `Sheet` (panneau latéral, `dirty` : demander avant de fermer)                                                                           |
| `ui/Figures.tsx`    | `Figures` (ligne de chiffres réglée, à la place des cartes « statistique »)                                                             |
| `ui/overlay.ts`     | `useLayer` (pile des superpositions : Échap, focus, restitution), `confirmDiscard`                                                      |
| `ui/Popover.tsx`    | `Popover` (menu ancré, classe `.menu`)                                                                                                  |
| `ui/effects.tsx`    | `CountUp` (affiche la valeur telle quelle), `DecryptText`, `useSpotlight`, `ClickSparks` : signatures gardées, sans effet visuel        |
| `journal/Modal.tsx` | `Modal` (boîte de dialogue)                                                                                                             |

### Fiche générique

```tsx
<RecordSheet
  collection="resources" kind="resource" noun="un moyen"
  spec={[
    { key: "name", label: "Désignation", kind: "text", required: true },
    { key: "kind", label: "Type", kind: "combo", list: "resourceKinds", quick: 6 },
    { key: "status", label: "État", kind: "choice", options: RESOURCE_STATUSES },
    { kind: "group", label: "Détails" },
    { key: "notes", label: "Remarques", kind: "area" },
  ]}
  initial={existing ?? blankResource()}
  onClose={() => setEditing(null)}
>
  {(saved) => <button onClick={…}>Placer sur la carte</button>}
</RecordSheet>
```

## Classes CSS (`src/theme.css`)

| Classe                                                                 | Rendu                                                |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| `.card`                                                                | Carte blanche, rayon 20 px, ombre douce unique       |
| `.card-head`                                                           | En-tête de carte : icône, `h2`/`h3`, action à droite |
| `.bento` + `.w-3` … `.w-12`                                            | Grille de tableau de bord sur 12 colonnes            |
| `.tile-grid` / `.tile` / `.tile-top` / `.meta-line`                    | Grille de tuiles cliquables                          |
| `.rows` / `.row-item` / `.row-main`                                    | Liste de lignes                                      |
| `.kanban` / `.lane` / `.lane.drop` / `.lane-head`                      | Colonnes glisser-déposer                             |
| `.pill` + `.ok` `.warn` `.crit` `.accent` `.muted` `.plain`            | Pastille d’état                                      |
| `.stat`                                                                | Grand chiffre + libellé                              |
| `.form-grid` / `.span-2`                                               | Formulaire sur deux colonnes                         |
| `.seg`                                                                 | Contrôle segmenté                                    |
| `.stagger` / `.reveal`                                                 | Apparition échelonnée / fondu                        |
| `.panel`, `.panel-head`, `.panel-foot`, `.toolbar`, `.search`, `.grid` | Hérités du journal                                   |
| `.label`, `.muted`, `.mono`, `.gradient-text`, `.display`              | Texte                                                |

Design : voir [DESIGN.md](DESIGN.md), à lire avant d’écrire un écran (parti pris, motifs proscrits, jetons, thèmes). En bref : papier `--bg`, cartes `--bg-1` / `--solid` (rayon `--radius-lg` 20 px, ombre `--shadow-xl`), encre `--text` / `--text-2` / `--text-3`, filets `--line` / `--line-2`, bouton principal `--accent` / `--on-accent` (rayon `--radius-button` 8 px), champs `--radius` 12 px. Police unique IBM Plex Sans (`--sans`, `--display`, titres en 500) et IBM Plex Mono (`--mono`) pour les heures, codes et chiffres. Un seul point `--ember` pour ce qui est en direct. États `--ok`, `--warn`, `--crit`. Teinte discrète d’un type d’élément : `hsl(var(--h) calc(80% * var(--kind-s)) calc(60% * var(--kind-l)))`. Couche globale : `src/atelier.css`. Mode : `:root[data-theme="light" | "dark"]` ; thème de couleur : `:root[data-palette="papier" | "ardoise" | "signal" | "contraste" | "graphite" | "minuit" | "nuit"]` (`src/palettes.css`). Toutes les couleurs passent par les variables : un écran qui écrit une couleur en dur casse les thèmes.

Un module peut avoir sa feuille `src/modules/<nom>/<nom>.css`, importée par le module, avec des classes préfixées (`.map-…`, `.net-…`).
