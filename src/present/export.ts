import type { Journal } from "../../shared/journal";
import { scopedJournal, type ExportScope } from "../export/scope";
import { buildDeck, type Deck } from "./deck";
import {
  DARK,
  LIGHT,
  layoutDeck,
  type DeckImages,
  type InkStroke,
  type Palette,
} from "./layout";

// Slide decks written to files: PowerPoint with transitions and animations,
// OpenDocument presentation, PDF (one slide per page), standalone HTML.
// Owned by the presentation mode. The writers are loaded on demand.

export type DeckFormat = "pptx" | "odp" | "pdf-slides" | "html-slides";
export type DocumentStamp = {
  /** Id of the export in the register (ops.exports). */
  id: string;
  /** Fingerprint of the content exported (short hex). */
  fingerprint: string;
  /** Line printed in the footer: "orion aic · export … · empreinte …". */
  label: string;
  /** Text of the verification QR code. */
  qr: string;
};
export type DeckOptions = {
  scope: ExportScope;
  author: string;
  /** Title of the deck (default: journal title). */
  title?: string;
  /** Entrance animations and transitions (default true). */
  animations: boolean;
  /** Diagonal watermark: "", "EXERCICE", "CONFIDENTIEL"… */
  watermark: string;
  stamp: DocumentStamp;
};

export const DECK_TYPES: Record<
  DeckFormat,
  { mime: string; extension: string }
> = {
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: ".pptx",
  },
  odp: {
    mime: "application/vnd.oasis.opendocument.presentation",
    extension: ".odp",
  },
  "pdf-slides": { mime: "application/pdf", extension: ".pdf" },
  "html-slides": { mime: "text/html;charset=utf-8", extension: ".html" },
};

/** Write laid-out slides to a format (shared with the presentation mode). */
export async function writeDeck(
  deck: Deck,
  format: DeckFormat,
  images: DeckImages,
  options: {
    author: string;
    footer: string;
    animations: boolean;
    watermark?: string;
    palette?: Palette;
    ink?: Record<string, InkStroke[]>;
  },
): Promise<Blob> {
  // Paper stays light; screens get the deep-space look of the app.
  const palette = options.palette ?? (format === "pdf-slides" ? LIGHT : DARK);
  const slides = layoutDeck(deck, {
    palette,
    footer: options.footer,
    images: new Set(Object.keys(images)),
    animations: options.animations && format !== "pdf-slides",
    watermark: options.watermark,
  });
  const meta = { title: deck.title, author: options.author, palette };
  const type = DECK_TYPES[format].mime;
  const blob = (data: Uint8Array | string) =>
    new Blob([typeof data === "string" ? data : data.slice().buffer], { type });
  switch (format) {
    case "pptx": {
      const { writePptx } = await import("./pptx");
      return blob(writePptx(slides, images, meta, options.animations));
    }
    case "odp": {
      const { writeOdp } = await import("./odp");
      return blob(writeOdp(slides, images, meta, options.animations));
    }
    case "pdf-slides": {
      const { writePdfSlides } = await import("./pdfslides");
      return blob(await writePdfSlides(slides, images, meta, options.ink));
    }
    case "html-slides": {
      const { writeHtml } = await import("./html");
      return blob(writeHtml(slides, images, meta));
    }
  }
}

/** The journal given is the live journal; the scope sets the time shown. */
export async function exportDeck(
  journal: Journal,
  format: DeckFormat,
  options: DeckOptions,
): Promise<Blob> {
  const { deckImages, symbolNames } = await import("./images");
  const scoped = scopedJournal(journal, options.scope);
  const live = options.scope.viewAt === null;
  const deck = buildDeck(scoped, {
    at: options.scope.viewAt ?? Date.now(),
    live,
    presenter: options.author,
    title: options.title,
    snapshot: options.scope.snapshot,
    sections: options.scope.sections,
    full: journal,
    symbolName: await symbolNames(),
  });
  const images = await deckImages(scoped, deck, options.stamp.qr);
  return writeDeck(deck, format, images, {
    author: options.author,
    footer: options.stamp.label || `orion aic · ${deck.title}`,
    animations: options.animations,
    watermark: options.watermark,
  });
}
