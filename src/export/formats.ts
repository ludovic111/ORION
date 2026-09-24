import type { SectionId } from "./scope.ts";

// Catalogue of the export centre: every format, grouped, with the options
// it uses and the parts it needs.

export const FORMAT_GROUPS = [
  "Présentation",
  "Documents imprimables",
  "Tableurs et données",
  "Carte",
  "Agenda et contacts",
  "Archive",
  "Pack complet",
] as const;
export type FormatGroup = (typeof FORMAT_GROUPS)[number];
export type FormatOption =
  "watermark" | "animations" | "orientation" | "versions" | "passphrase";

export type FormatInfo = {
  id: string;
  group: FormatGroup;
  name: string;
  extension: string;
  detail: string;
  options: FormatOption[];
  /** At least one of these parts must be chosen. */
  needs?: SectionId[];
  mime: string;
};

const DOC: FormatOption[] = ["watermark", "orientation", "versions"];
const SLIDES: FormatOption[] = ["watermark", "animations"];
const ENTRIES: SectionId[] = ["journal", "missions"];

export const FORMATS = [
  {
    id: "pptx",
    group: "Présentation",
    name: "PowerPoint animé",
    extension: ".pptx",
    detail: "Diapositives animées, notes, code de vérification.",
    options: SLIDES,
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  {
    id: "odp",
    group: "Présentation",
    name: "Présentation OpenDocument",
    extension: ".odp",
    detail: "LibreOffice Impress, mêmes diapositives.",
    options: SLIDES,
    mime: "application/vnd.oasis.opendocument.presentation",
  },
  {
    id: "pdf-slides",
    group: "Présentation",
    name: "PDF diaporama",
    extension: ".pdf",
    detail: "Une diapositive par page, pour projeter partout.",
    options: ["watermark"],
    mime: "application/pdf",
  },
  {
    id: "html-slides",
    group: "Présentation",
    name: "HTML diaporama",
    extension: ".html",
    detail: "Diaporama autonome, s’ouvre dans tout navigateur.",
    options: SLIDES,
    mime: "text/html;charset=utf-8",
  },
  {
    id: "pdf",
    group: "Documents imprimables",
    name: "PDF dossier",
    extension: ".pdf",
    detail: "Couverture, sommaire paginé, chapitres, cartes.",
    options: DOC,
    mime: "application/pdf",
  },
  {
    id: "docx",
    group: "Documents imprimables",
    name: "Word",
    extension: ".docx",
    detail: "Titres, sommaire, tableaux et cartes, modifiable.",
    options: DOC,
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "odt",
    group: "Documents imprimables",
    name: "OpenDocument texte",
    extension: ".odt",
    detail: "LibreOffice Writer, même contenu que Word.",
    options: DOC,
    mime: "application/vnd.oasis.opendocument.text",
  },
  {
    id: "html",
    group: "Documents imprimables",
    name: "Page HTML",
    extension: ".html",
    detail: "Un seul fichier, lisible sur téléphone, imprimable.",
    options: DOC,
    mime: "text/html;charset=utf-8",
  },
  {
    id: "md",
    group: "Documents imprimables",
    name: "Markdown",
    extension: ".md",
    detail: "Texte structuré, titres et tableaux.",
    options: ["watermark", "versions"],
    mime: "text/markdown;charset=utf-8",
  },
  {
    id: "txt",
    group: "Documents imprimables",
    name: "Texte brut",
    extension: ".txt",
    detail: "Lisible partout, une fiche par ligne de tableau.",
    options: ["watermark", "versions"],
    mime: "text/plain;charset=utf-8",
  },
  {
    id: "sheets",
    group: "Documents imprimables",
    name: "Fiches messages A4",
    extension: ".pdf",
    detail: "Une fiche par entrée du journal.",
    options: [],
    needs: ENTRIES,
    mime: "application/pdf",
  },
  {
    id: "journal-pdf",
    group: "Documents imprimables",
    name: "Journal PDF (tableau)",
    extension: ".pdf",
    detail: "Tableau chronologique A4 paysage.",
    options: [],
    needs: ENTRIES,
    mime: "application/pdf",
  },
  {
    id: "radio-pdf",
    group: "Documents imprimables",
    name: "Plan du réseau radio",
    extension: ".pdf",
    detail: "Noms d’appel, groupes, terminaux, remises.",
    options: [],
    needs: ["radio"],
    mime: "application/pdf",
  },
  {
    id: "labels-pdf",
    group: "Documents imprimables",
    name: "Étiquettes radio",
    extension: ".pdf",
    detail: "Une étiquette QR par terminal, A4.",
    options: [],
    needs: ["radio"],
    mime: "application/pdf",
  },
  {
    id: "xlsx",
    group: "Tableurs et données",
    name: "Excel",
    extension: ".xlsx",
    detail: "Une feuille par tableau, filtres, en-tête figé.",
    options: ["watermark", "versions"],
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  {
    id: "ods",
    group: "Tableurs et données",
    name: "OpenDocument tableur",
    extension: ".ods",
    detail: "LibreOffice Calc, mêmes feuilles.",
    options: ["watermark", "versions"],
    mime: "application/vnd.oasis.opendocument.spreadsheet",
  },
  {
    id: "csv",
    group: "Tableurs et données",
    name: "CSV",
    extension: ".csv",
    detail: "Un fichier par tableau, point-virgule, UTF-8.",
    options: ["versions"],
    mime: "text/csv;charset=utf-8",
  },
  {
    id: "tsv",
    group: "Tableurs et données",
    name: "TSV",
    extension: ".tsv",
    detail: "Un fichier par tableau, tabulation, UTF-8.",
    options: ["versions"],
    mime: "text/tab-separated-values;charset=utf-8",
  },
  {
    id: "json",
    group: "Tableurs et données",
    name: "JSON données",
    extension: ".json",
    detail: "Tableaux structurés, pour d’autres outils.",
    options: ["versions"],
    mime: "application/json",
  },
  {
    id: "png",
    group: "Carte",
    name: "Image de la carte",
    extension: ".png",
    detail: "Chaque carte avec ses objets, haute définition.",
    options: [],
    needs: ["map"],
    mime: "image/png",
  },
  {
    id: "geojson",
    group: "Carte",
    name: "GeoJSON",
    extension: ".geojson",
    detail: "SIG (QGIS, ArcGIS), coordonnées WGS 84.",
    options: [],
    needs: ["map"],
    mime: "application/geo+json",
  },
  {
    id: "kml",
    group: "Carte",
    name: "KML",
    extension: ".kml",
    detail: "Google Earth et cartes en ligne.",
    options: [],
    needs: ["map"],
    mime: "application/vnd.google-earth.kml+xml",
  },
  {
    id: "gpx",
    group: "Carte",
    name: "GPX",
    extension: ".gpx",
    detail: "Appareils GPS : points et traces.",
    options: [],
    needs: ["map"],
    mime: "application/gpx+xml",
  },
  {
    id: "ics",
    group: "Agenda et contacts",
    name: "Agenda",
    extension: ".ics",
    detail: "Rendez-vous du rythme de conduite, tout agenda.",
    options: [],
    needs: ["agenda"],
    mime: "text/calendar;charset=utf-8",
  },
  {
    id: "vcf",
    group: "Agenda et contacts",
    name: "Contacts",
    extension: ".vcf",
    detail: "vCard 4.0 pour téléphone et messagerie.",
    options: [],
    needs: ["contacts"],
    mime: "text/vcard;charset=utf-8",
  },
  {
    id: "orion",
    group: "Archive",
    name: "Archive orion aic chiffrée",
    extension: ".orionaic",
    detail: "Tout l’historique : rejouable après import.",
    options: ["passphrase"],
    mime: "application/json",
  },
  {
    id: "archive-json",
    group: "Archive",
    name: "Archive JSON réimportable",
    extension: ".json",
    detail: "En clair, historique compris, réimportable.",
    options: [],
    mime: "application/json",
  },
  {
    id: "pack",
    group: "Pack complet",
    name: "Pack complet",
    extension: ".zip",
    detail:
      "PDF, Word, Excel, HTML, archive, carte, agenda, contacts, PowerPoint et empreintes.",
    options: ["watermark", "orientation", "versions", "animations"],
    mime: "application/zip",
  },
] as const satisfies readonly FormatInfo[];

export type FormatId = (typeof FORMATS)[number]["id"];
export const formatInfo = (id: FormatId): FormatInfo =>
  FORMATS.find((f) => f.id === id)!;

/** Accepted names of a preset (older ids included). */
const ALIASES: Record<string, FormatId> = {
  orionaic: "orion",
  "json-archive": "archive-json",
  archive: "archive-json",
  slides: "pptx",
  powerpoint: "pptx",
  word: "docx",
  excel: "xlsx",
  journal: "journal-pdf",
  radio: "radio-pdf",
  labels: "labels-pdf",
  zip: "pack",
  map: "png",
  vcard: "vcf",
  calendar: "ics",
};
export function formatFromPreset(value?: string): FormatId | null {
  if (!value) return null;
  if (FORMATS.some((f) => f.id === value)) return value as FormatId;
  return ALIASES[value] ?? null;
}

/** Formats written from the dossier (they show its whole content). */
export const DOSSIER_FORMATS = new Set<FormatId>([
  "pdf",
  "docx",
  "odt",
  "html",
  "md",
  "txt",
  "xlsx",
  "ods",
  "csv",
  "tsv",
  "json",
  "pack",
]);
