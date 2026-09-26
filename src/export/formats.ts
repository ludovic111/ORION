import type { SectionId } from "./scope.ts";
import { t } from "./i18n.ts";

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
/** Name of a group in the language of the post (the group stays a key). */
export const groupLabel = (group: FormatGroup) => t(group);
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
    get name() {
      return t("PowerPoint animé");
    },
    extension: ".pptx",
    get detail() {
      return t("Diapositives animées, notes, code de vérification.");
    },
    options: SLIDES,
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  {
    id: "odp",
    group: "Présentation",
    get name() {
      return t("Présentation OpenDocument");
    },
    extension: ".odp",
    get detail() {
      return t("LibreOffice Impress, mêmes diapositives.");
    },
    options: SLIDES,
    mime: "application/vnd.oasis.opendocument.presentation",
  },
  {
    id: "pdf-slides",
    group: "Présentation",
    get name() {
      return t("PDF diaporama");
    },
    extension: ".pdf",
    get detail() {
      return t("Une diapositive par page, pour projeter partout.");
    },
    options: ["watermark"],
    mime: "application/pdf",
  },
  {
    id: "html-slides",
    group: "Présentation",
    get name() {
      return t("HTML diaporama");
    },
    extension: ".html",
    get detail() {
      return t("Diaporama autonome, s’ouvre dans tout navigateur.");
    },
    options: SLIDES,
    mime: "text/html;charset=utf-8",
  },
  {
    id: "pdf",
    group: "Documents imprimables",
    get name() {
      return t("PDF dossier");
    },
    extension: ".pdf",
    get detail() {
      return t("Couverture, sommaire paginé, chapitres, cartes.");
    },
    options: DOC,
    mime: "application/pdf",
  },
  {
    id: "docx",
    group: "Documents imprimables",
    name: "Word",
    extension: ".docx",
    get detail() {
      return t("Titres, sommaire, tableaux et cartes, modifiable.");
    },
    options: DOC,
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "odt",
    group: "Documents imprimables",
    get name() {
      return t("OpenDocument texte");
    },
    extension: ".odt",
    get detail() {
      return t("LibreOffice Writer, même contenu que Word.");
    },
    options: DOC,
    mime: "application/vnd.oasis.opendocument.text",
  },
  {
    id: "html",
    group: "Documents imprimables",
    get name() {
      return t("Page HTML");
    },
    extension: ".html",
    get detail() {
      return t("Un seul fichier, lisible sur téléphone, imprimable.");
    },
    options: DOC,
    mime: "text/html;charset=utf-8",
  },
  {
    id: "md",
    group: "Documents imprimables",
    name: "Markdown",
    extension: ".md",
    get detail() {
      return t("Texte structuré, titres et tableaux.");
    },
    options: ["watermark", "versions"],
    mime: "text/markdown;charset=utf-8",
  },
  {
    id: "txt",
    group: "Documents imprimables",
    get name() {
      return t("Texte brut");
    },
    extension: ".txt",
    get detail() {
      return t("Lisible partout, une fiche par ligne de tableau.");
    },
    options: ["watermark", "versions"],
    mime: "text/plain;charset=utf-8",
  },
  {
    id: "sheets",
    group: "Documents imprimables",
    get name() {
      return t("Fiches messages A4");
    },
    extension: ".pdf",
    get detail() {
      return t("Une fiche par entrée du journal.");
    },
    options: [],
    needs: ENTRIES,
    mime: "application/pdf",
  },
  {
    id: "journal-pdf",
    group: "Documents imprimables",
    get name() {
      return t("Journal PDF (tableau)");
    },
    extension: ".pdf",
    get detail() {
      return t("Tableau chronologique A4 paysage.");
    },
    options: [],
    needs: ENTRIES,
    mime: "application/pdf",
  },
  {
    id: "radio-pdf",
    group: "Documents imprimables",
    get name() {
      return t("Plan du réseau radio");
    },
    extension: ".pdf",
    get detail() {
      return t("Noms d’appel, groupes, terminaux, remises.");
    },
    options: [],
    needs: ["radio"],
    mime: "application/pdf",
  },
  {
    id: "labels-pdf",
    group: "Documents imprimables",
    get name() {
      return t("Étiquettes radio");
    },
    extension: ".pdf",
    get detail() {
      return t("Une étiquette QR par terminal, A4.");
    },
    options: [],
    needs: ["radio"],
    mime: "application/pdf",
  },
  {
    id: "xlsx",
    group: "Tableurs et données",
    name: "Excel",
    extension: ".xlsx",
    get detail() {
      return t("Une feuille par tableau, filtres, en-tête figé.");
    },
    options: ["watermark", "versions"],
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  {
    id: "ods",
    group: "Tableurs et données",
    get name() {
      return t("OpenDocument tableur");
    },
    extension: ".ods",
    get detail() {
      return t("LibreOffice Calc, mêmes feuilles.");
    },
    options: ["watermark", "versions"],
    mime: "application/vnd.oasis.opendocument.spreadsheet",
  },
  {
    id: "csv",
    group: "Tableurs et données",
    name: "CSV",
    extension: ".csv",
    get detail() {
      return t("Un fichier par tableau, point-virgule, UTF-8.");
    },
    options: ["versions"],
    mime: "text/csv;charset=utf-8",
  },
  {
    id: "tsv",
    group: "Tableurs et données",
    name: "TSV",
    extension: ".tsv",
    get detail() {
      return t("Un fichier par tableau, tabulation, UTF-8.");
    },
    options: ["versions"],
    mime: "text/tab-separated-values;charset=utf-8",
  },
  {
    id: "json",
    group: "Tableurs et données",
    get name() {
      return t("JSON données");
    },
    extension: ".json",
    get detail() {
      return t("Tableaux structurés, pour d’autres outils.");
    },
    options: ["versions"],
    mime: "application/json",
  },
  {
    id: "png",
    group: "Carte",
    get name() {
      return t("Image de la carte");
    },
    extension: ".png",
    get detail() {
      return t("Chaque carte avec ses objets, haute définition.");
    },
    options: [],
    needs: ["map"],
    mime: "image/png",
  },
  {
    id: "geojson",
    group: "Carte",
    name: "GeoJSON",
    extension: ".geojson",
    get detail() {
      return t("SIG (QGIS, ArcGIS), coordonnées WGS 84.");
    },
    options: [],
    needs: ["map"],
    mime: "application/geo+json",
  },
  {
    id: "kml",
    group: "Carte",
    name: "KML",
    extension: ".kml",
    get detail() {
      return t("Google Earth et cartes en ligne.");
    },
    options: [],
    needs: ["map"],
    mime: "application/vnd.google-earth.kml+xml",
  },
  {
    id: "gpx",
    group: "Carte",
    name: "GPX",
    extension: ".gpx",
    get detail() {
      return t("Appareils GPS : points et traces.");
    },
    options: [],
    needs: ["map"],
    mime: "application/gpx+xml",
  },
  {
    id: "ics",
    group: "Agenda et contacts",
    get name() {
      return t("Agenda");
    },
    extension: ".ics",
    get detail() {
      return t("Rendez-vous du rythme de conduite, tout agenda.");
    },
    options: [],
    needs: ["agenda"],
    mime: "text/calendar;charset=utf-8",
  },
  {
    id: "vcf",
    group: "Agenda et contacts",
    get name() {
      return t("Contacts");
    },
    extension: ".vcf",
    get detail() {
      return t("vCard 4.0 pour téléphone et messagerie.");
    },
    options: [],
    needs: ["contacts"],
    mime: "text/vcard;charset=utf-8",
  },
  {
    id: "orion",
    group: "Archive",
    get name() {
      return t("Archive orion aic chiffrée");
    },
    extension: ".orionaic",
    get detail() {
      return t("Tout l’historique : rejouable après import.");
    },
    options: ["passphrase"],
    mime: "application/json",
  },
  {
    id: "archive-json",
    group: "Archive",
    get name() {
      return t("Archive JSON réimportable");
    },
    extension: ".json",
    get detail() {
      return t("En clair, historique compris, réimportable.");
    },
    options: [],
    mime: "application/json",
  },
  {
    id: "pack",
    group: "Pack complet",
    get name() {
      return t("Pack complet");
    },
    extension: ".zip",
    get detail() {
      return t(
        "PDF, Word, Excel, HTML, archive, carte, agenda, contacts, PowerPoint et empreintes.",
      );
    },
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
