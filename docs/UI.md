# Interface orion aic · guide du kit

Référence pour écrire un module. L’interface est en français (langue source), en allemand et en italien (voir [Langues](#langues-français-allemand-italien)) ; le code et les commentaires sont en anglais.

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

| Clé                         | Usage                                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `journal.ops`               | Données des modules : `messages`, `cells`, `members`, `resources`, `contacts`, `places`, `agenda`, `facts`, `boards`, `observations`, `alerts`, `links`, `settings` (voir `shared/ops.ts`).             |
| `updateOps(ops => …)`       | Seule façon de modifier `ops`. Utiliser `upsert(ops, "resources", value, author)` et `removeRecords(ops, [id])`. Validé par Zod ; en cas d’erreur, exception avec message.                              |
| `canWrite()`                | Porte d’écriture : `true` si l’écriture est permise, sinon affiche pourquoi et renvoie `false`.                                                                                                         |
| `lists("recipients")`       | Valeurs d’un référentiel (`DEFAULT_LISTS` modifiables dans Réglages).                                                                                                                                   |
| `graph`                     | `items` (tous les éléments affichables), `byRef`, `edges` (liens explicites et implicites), `degree`.                                                                                                   |
| `focus` / `setFocus(null)`  | Élément à montrer quand on arrive depuis un lien (`"resource:<uuid>"`). Le module ouvre la fiche puis remet `setFocus(null)`. `"message:new"` demande un nouveau message.                               |
| `open(ref)`                 | Aller vers n’importe quel élément (entrée du journal, moyen, objet carte…). `open("place:new:resource:<uuid>")` ouvre la carte en mode placement : le point posé est relié à cet élément.               |
| `addEntry(fields, links)`   | Consigne une entrée au journal et la relie aux références données ; renvoie son id.                                                                                                                     |
| `compose(preset)`           | Ouvre le formulaire d’entrée prérempli (l’opérateur valide).                                                                                                                                            |
| `queuePrint(job)`           | Impression directe sans aperçu (impression automatique).                                                                                                                                                |
| `print(job)`                | Aperçu A4 : `{ kind: "forms", journal, sheets, title, name }` ou `{ kind: "tables", journal, title, extra, tables, landscape, name }`.                                                                  |
| `live` / `viewAt`           | Journal actuel / moment affiché par la machine à remonter le temps (ms, `null` = direct). `setViewAt(ms)` y envoie l’utilisateur.                                                                       |
| `trace(id)`                 | Ouvre l’historique d’un élément (versions, restauration).                                                                                                                                               |
| `record(collection, v, id)` | Ajoute à un registre (`snapshots`, `exports`, `presentations`, `forecasts`, `retex`), même journal clôturé ou dans le passé ; `id` vise le journal d’une requête lancée avant un changement de journal. |
| `exportCenter(preset)`      | Ouvre le centre d’export (`{ sections, viewAt, format }` facultatifs).                                                                                                                                  |
| `present(mode, preset)`     | Mode présentation (`"present"`) ou affichage mural (`"wall"`).                                                                                                                                          |
| `help(topic)`               | Ouvre l’aide sur un sujet (id de module ou sujet de `Docs`).                                                                                                                                            |
| `prefs`                     | Réglages du poste : mode (`theme`), thèmes de couleur (`lightPalette`, `darkPalette`), modules masqués, impression automatique (`autoPrint`, `autoPrintRemote`, `autoPrintMessages`).                   |

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

## Langues (français, allemand, italien)

L’interface existe en français (langue source), en allemand (de-CH) et en italien (it-CH). La langue est propre à chaque poste (Réglages → Ce poste, ou le sélecteur FR · DE · IT de la page d’accueil), gardée avec les autres préférences du poste (`prefs.lang`) ; par défaut, celle du navigateur (`de*` → allemand, `it*` → italien, sinon français). Changer de langue redessine tout sans recharger ; `<html lang>` suit.

### Écrire un texte

Chaque dossier a son dictionnaire `i18n.ts` (ou `i18n-<partie>.ts`). La clé est le **texte français tel qu’il s’affiche** ; TypeScript refuse une clé absente et une entrée sans `de` ou `it`.

```ts
// src/modules/exemple/i18n.ts
import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

export const { t, tn, dict } = translator({
  ...common, // Enregistrer, Annuler, Supprimer… (facultatif)
  "Nouveau moyen": { de: "Neues Mittel", it: "Nuovo mezzo" },
  "{n} en retard": { de: "{n} überfällig", it: "{n} in ritardo" },
  "{n} moyen engagé": {
    de: "{n} Mittel im Einsatz",
    it: "{n} mezzo impiegato",
  },
  "{n} moyens engagés": {
    de: "{n} Mittel im Einsatz",
    it: "{n} mezzi impiegati",
  },
  "Cliquez sur <0>Placer</0>.": {
    de: "Klicken Sie auf <0>Platzieren</0>.",
    it: "Fate clic su <0>Posiziona</0>.",
  },
} satisfies Dict);
```

```tsx
import { t, tn } from "./i18n.ts"; // toujours avec l’extension .ts (tests node)
import { rich } from "../../i18n";

<button aria-label={t("Nouveau moyen")}>{t("Nouveau moyen")}</button>;
{
  t("{n} en retard", { n: late });
}
{
  tn(count, "{n} moyen engagé", "{n} moyens engagés");
} // singulier : 0 et 1 en français, 1 en allemand et en italien
{
  rich(t("Cliquez sur <0>Placer</0>."), [<strong />]);
}
```

- **Jamais de `t()` au chargement d’un module** (constante de premier niveau) : le texte serait figé dans la langue du démarrage. Pour une liste de libellés partagée, utiliser des accesseurs (`get label() { return t("…"); }`, voir `src/app/modules.ts`) ou une fonction. Un `useMemo` qui produit du texte ajoute `useLang()` (`src/i18n`) à ses dépendances.
- **Même texte, deux sens** : clé libre et `fr` explicite, par exemple `"Poste (fonction)": { fr: "Poste", de: "Funktion", it: "Funzione" }`.
- **Valeurs fixes des schémas** (états, priorités, types, canaux : `z.enum`) : elles restent enregistrées en français et s’affichent avec `enumLabel(valeur)` (`shared/i18n/enums.ts`). Les comparaisons dans le code gardent la valeur française (`status === "Engagé"`).
- **Données** : tout ce qui est saisi ou enregistré dans un journal (entrées, messages, noms, valeurs des référentiels, modèles de listes de contrôle, textes des ordres) s’affiche tel quel, sans traduction : un poste allemand et un poste français voient le même texte. Les textes écrits automatiquement dans le journal (« Ordre n° 3 émis »…) le sont dans la langue du poste qui agit.
- **Données par défaut d’un nouveau journal** (référentiels, renseignements clés standards, tableaux, numéros d’urgence, listes de contrôle intégrées) : dans la langue du poste qui le crée, notée dans `ops.settings.lang` (`shared/i18n/seeds.ts`, `journalLang`, `listValues`). Un journal sans langue est français.
- **Dates et nombres** : `formatDate` (05.03.2026), `formatTime` (08:04, 24 h), `formatDateTime`, `formatLongDate`, `formatWith`, `formatNumber`, `locale()` de `shared/i18n/core.ts` — toujours à l’heure de Zurich, quelle que soit la langue. Ne plus écrire `"fr-CH"` en dur.
- **Documents produits** (PDF, DOCX, ODT, XLSX, PPTX, HTML, impressions) : libellés dans la langue du poste, attribut de langue `locale()`.
- **Palette ⌘K** : les mots-clés de recherche gardent le français et ajoutent la traduction, pour que la recherche marche dans les deux langues ; `inLang("fr", () => …)` (`shared/i18n/core.ts`) lit un libellé dans une autre langue sans changer celle du poste.
- `npm test` (`tests/i18n.test.mjs`) vérifie chaque dictionnaire : traductions non vides, mêmes paramètres `{n}` et mêmes balises `<0>…</0>` dans les trois langues, aucune phrase laissée en français dans les deux autres langues.

### Aide intégrée

`src/modules/docs/content*.tsx` (français) a ses équivalents dans `src/modules/docs/de/` et `src/modules/docs/it/`, même structure (mêmes sujets, mêmes identifiants, trois niveaux « En bref », « Guide », « Tout le détail »). Modifier une page de l’aide, c’est modifier les trois versions.

### Vocabulaire

Protection civile suisse ; allemand de Suisse (« ss », jamais « ß ») ; guillemets « » ; nom du produit toujours « orion aic » en minuscules.

| Français                     | Deutsch                     | Italiano                        |
| ---------------------------- | --------------------------- | ------------------------------- |
| protection civile            | Zivilschutz                 | protezione civile               |
| protection de la population  | Bevölkerungsschutz          | protezione della popolazione    |
| OFPP                         | BABS                        | UFPP                            |
| aide à la conduite (AIC)     | Führungsunterstützung (FU)  | aiuto alla condotta (AC)        |
| poste de commandement (PC)   | Kommandoposten (KP)         | posto di comando (PC)           |
| PC front / PC arrière        | KP Front / KP Rück          | PC avanzato / PC arretrato      |
| journal d’intervention       | Einsatzjournal (Journal)    | diario d’intervento (diario)    |
| entrée (du journal)          | Eintrag                     | voce                            |
| message                      | Meldung                     | messaggio                       |
| situation                    | Lage                        | situazione                      |
| point de situation           | Lagerapport                 | punto della situazione          |
| rapport de conduite          | Führungsrapport             | rapporto di condotta            |
| rythme de conduite           | Führungsrhythmus            | ritmo di condotta               |
| ordre / mission              | Befehl / Auftrag            | ordine / missione               |
| ordre en cinq points         | Befehl in fünf Punkten      | ordine in cinque punti          |
| orientation, intention       | Orientierung, Absicht       | orientamento, intenzione        |
| dispositions particulières   | besondere Anordnungen       | disposizioni particolari        |
| emplacements et liaisons     | Standorte und Verbindungen  | ubicazioni e collegamenti       |
| diffusion, accusé de lecture | Verteilung, Lesebestätigung | diffusione, conferma di lettura |
| moyens                       | Mittel                      | mezzi                           |
| demande de moyens            | Mittelanforderung           | richiesta di mezzi              |
| renseignements clés          | Schlüsselinformationen      | informazioni chiave             |
| cellule                      | Zelle                       | cellula                         |
| ce poste (ordinateur)        | dieser Arbeitsplatz         | questa postazione               |
| opérateur                    | Operateur                   | operatore                       |
| chef d’intervention          | Einsatzleiter               | capo intervento                 |
| relève                       | Ablösung                    | avvicendamento                  |
| quittance                    | Quittung                    | quittanza                       |
| nom d’appel                  | Rufname                     | nominativo                      |
| groupe (Polycom)             | Gesprächsgruppe             | gruppo di conversazione         |
| terminal (radio)             | Endgerät                    | terminale                       |
| contrôle de liaison          | Verbindungskontrolle        | controllo dei collegamenti      |
| liste de contrôle            | Checkliste                  | lista di controllo              |
| référentiels                 | Wertelisten                 | elenchi di riferimento          |
| session (code de session)    | Sitzung (Sitzungscode)      | sessione (codice di sessione)   |
| journal clôturé              | abgeschlossenes Journal     | diario chiuso                   |
| machine à remonter le temps  | Zeitreise                   | macchina del tempo              |
| traçabilité                  | Nachvollziehbarkeit         | tracciabilità                   |
| point figé                   | Momentaufnahme              | istantanea                      |
| exercice / intervention      | Übung / Einsatz             | esercizio / intervento          |
| direction d’exercice, inject | Übungsleitung, Einspielung  | direzione d’esercizio, inject   |
| débriefing (RETEX)           | Debriefing                  | debriefing                      |
| affichage mural              | Wandanzeige                 | schermo murale                  |
| carte de situation           | Lagekarte                   | carta della situazione          |
| signe (carte)                | Signatur                    | simbolo                         |
| calque                       | Ebene                       | livello                         |
| réglages                     | Einstellungen               | impostazioni                    |
