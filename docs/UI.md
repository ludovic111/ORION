# Interface orion aic · guide du kit

Référence pour écrire un module. Tout est en français dans l’interface, en anglais dans le code et les commentaires.

## Principes

- **Tout est facultatif** sauf le strict minimum (un nom, un texte). Aucun champ obligatoire de plus.
- **Tout est modifiable et supprimable** : chaque élément ouvre une fiche (`RecordSheet`) avec « Enregistrer » et « Supprimer ».
- **Valeurs standards + texte libre** : `ComboField` (ou `kind: "combo"` dans un `FieldSpec`) propose les valeurs d’un référentiel en un clic et accepte toute saisie.
- **Tout est relié** : chaque fiche montre ses liens (`LinksPanel`), chaque référence s’affiche avec `LinkChip` (aperçu au survol, clic = ouvrir).
- **Journal clôturé = lecture seule** : `readOnly` du contexte ; `updateOps` lève une erreur.
- **Machine à remonter le temps** : `journal` peut être une version passée (`viewAt !== null`) ; `readOnly` est alors vrai. Afficher depuis `journal`, écrire dans les registres avec `record`, lire l’état actuel avec `live`.
- **Tout est tracé** : ne rien faire de spécial, `updateOps` suffit ; la fiche générique montre déjà « Créé par… » et le bouton Historique. Pour une fiche maison : `<TraceLine target={id} />` (`src/timeline/TraceLine.tsx`) ou `trace(id)`.
- Lisible avant tout : les animations accompagnent, elles ne gênent pas (`data-motion="reduced"` les coupe).

## Contexte (`src/app/context.tsx`)

```ts
const {
  journal,
  author,
  readOnly,
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

| Clé                        | Usage                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `journal.ops`              | Données des modules : `messages`, `cells`, `members`, `resources`, `contacts`, `places`, `agenda`, `facts`, `boards`, `observations`, `alerts`, `links`, `settings` (voir `shared/ops.ts`). |
| `updateOps(ops => …)`      | Seule façon de modifier `ops`. Utiliser `upsert(ops, "resources", value, author)` et `removeRecords(ops, [id])`. Validé par Zod ; en cas d’erreur, exception avec message.                  |
| `lists("recipients")`      | Valeurs d’un référentiel (`DEFAULT_LISTS` modifiables dans Réglages).                                                                                                                       |
| `graph`                    | `items` (tous les éléments affichables), `byRef`, `edges` (liens explicites et implicites), `degree`.                                                                                       |
| `focus` / `setFocus(null)` | Élément à montrer quand on arrive depuis un lien (`"resource:<uuid>"`). Le module ouvre la fiche puis remet `setFocus(null)`. `"message:new"` demande un nouveau message.                   |
| `open(ref)`                | Aller vers n’importe quel élément (entrée du journal, moyen, objet carte…). `open("place:new:resource:<uuid>")` ouvre la carte en mode placement : le point posé est relié à cet élément.   |
| `addEntry(fields, links)`  | Consigne une entrée au journal et la relie aux références données ; renvoie son id.                                                                                                         |
| `compose(preset)`          | Ouvre le formulaire d’entrée prérempli (l’opérateur valide).                                                                                                                                |
| `queuePrint(job)`          | Impression directe sans aperçu (impression automatique).                                                                                                                                    |
| `print(job)`               | Aperçu A4 : `{ kind: "forms", journal, sheets, title, name }` ou `{ kind: "tables", journal, title, extra, tables, landscape, name }`.                                                      |
| `live` / `viewAt`          | Journal actuel / moment affiché par la machine à remonter le temps (ms, `null` = direct). `setViewAt(ms)` y envoie l’utilisateur.                                                           |
| `trace(id)`                | Ouvre l’historique d’un élément (versions, restauration).                                                                                                                                   |
| `record(collection, v)`    | Ajoute à un registre (`snapshots`, `exports`, `presentations`, `forecasts`), même journal clôturé ou dans le passé.                                                                         |
| `exportCenter(preset)`     | Ouvre le centre d’export (`{ sections, viewAt, format }` facultatifs).                                                                                                                      |
| `present(mode, preset)`    | Mode présentation (`"present"`) ou affichage mural (`"wall"`).                                                                                                                              |
| `help(topic)`              | Ouvre l’aide sur un sujet (id de module ou sujet de `Docs`).                                                                                                                                |
| `prefs`                    | Réglages du poste : thème, modules masqués, impression automatique (`autoPrint`, `autoPrintRemote`, `autoPrintMessages`).                                                                   |

## Composants

| Fichier             | Composants                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ui/ModuleHead.tsx` | `ModuleHead` (titre animé, description, actions, bouton d’aide), `EmptyState`                                                           |
| `ui/records.tsx`    | `RecordSheet` (fiche latérale générique), `RecordFields`, type `FieldSpec`                                                              |
| `ui/fields.tsx`     | `TextField`, `ComboField`, `ChoiceField`, `DateTimeField`, `NumberField`, `Toggle`, `TagsField`, `Segmented`, `localInput`, `fromInput` |
| `ui/links.tsx`      | `LinkChip`, `LinksPanel`, `ItemPreview`, `HoverCard`, `ItemSearch`, `KindDot`, `KIND_ICON`, `hueStyle`                                  |
| `ui/Sheet.tsx`      | `Sheet` (panneau latéral)                                                                                                               |
| `ui/Popover.tsx`    | `Popover` (menu ancré, classe `.menu`)                                                                                                  |
| `ui/effects.tsx`    | `CountUp`, `DecryptText`, `useSpotlight` (classe `.spot`), `ClickSparks`                                                                |
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

Design : « atelier éditorial » de [DESIGN.md](DESIGN.md) — papier crème `--bg`, cartes blanches `--bg-1` / `--solid` (rayon `--radius-lg` 20 px, ombre `--shadow-xl`), encre `--text` / `--text-2` / `--text-3`, bordures `--line` / `--line-2`, boutons pleins graphite `--accent` avec `--on-accent` (rayon `--radius-button` 8 px), champs `--radius` 12 px, pastilles en pilule, titres `--display` (Inter 500, jamais gras), texte fonctionnel `--sans` (police système), `--mono` pour les heures et les codes. Un seul point orange `--ember` pour ce qui est en direct. États `--ok`, `--warn`, `--crit` (tons terre, sans néon). Teinte discrète d’un type d’élément : `hsl(var(--h) calc(80% * var(--kind-s)) calc(60% * var(--kind-l)))`. Couche globale : `src/atelier.css`. Thème sombre « graphite » : `:root[data-theme="dark"]` ; toutes les couleurs passent par les variables.

Un module peut avoir sa feuille `src/modules/<nom>/<nom>.css`, importée par le module, avec des classes préfixées (`.map-…`, `.net-…`).
