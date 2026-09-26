import {
  archive,
  chronological,
  dateTime,
  type Journal,
} from "../../shared/journal.ts";
import { MAX_IMPORT_BYTES } from "../../shared/interchange.ts";
import { zip } from "./bytes.ts";
import {
  archiveJournal,
  buildDossier,
  mapsOf,
  pause,
  resolveScope,
  tablesOf,
  type Dossier,
} from "./dossier.ts";
import type { DocumentOptions, MapPicture } from "./docx.ts";
import { formatInfo, type FormatId } from "./formats.ts";
import { SECTION_IDS, describeScope, type ExportScope } from "./scope.ts";
import type { SignatureBlock, SigningKey } from "../../shared/signature.ts";
import {
  contentHashOf,
  makeStamp,
  signStamp,
  registerScope,
  sha256Hex,
  shortId,
  type DocumentStamp,
} from "./stamp.ts";
import { t } from "./i18n.ts";

// Produces the file(s) of an export in the browser: builds the dossier,
// renders the maps, stamps and writes the chosen format. Heavy writers are
// loaded on demand so that the main bundle stays small.

export type ProduceOptions = {
  /** The live journal (the scope sets the time shown). */
  live: Journal;
  scope: ExportScope;
  format: FormatId;
  author: string;
  watermark: string;
  orientation: "portrait" | "landscape";
  animations: boolean;
  versions: boolean;
  passphrase: string;
  /** Origin of the app, printed on the radio labels. */
  origin: string;
  /** Key of this post: files, archives and printed codes are signed. */
  signing?: SigningKey;
  onProgress?: (label: string, ratio: number) => void;
};
export type Output = {
  name: string;
  blob: Blob;
  /** Format written to the register. */
  format: string;
};
export type Produced = {
  main: Output;
  /** Every file to write to the register (pack: the zip and its files). */
  files: Output[];
  stamp: DocumentStamp;
  /** Whole operation, now: counts as a backup. */
  backup: boolean;
  /** Parts that could not be produced (pack). */
  notes: string[];
  /** Key that signed the files (the register lines are signed too). */
  signing?: SigningKey;
};
/** One line of the register (without its id, time stamps and author). */
export type RegisterLine = {
  at: string;
  format: string;
  scope: string;
  viewAt: string;
  name: string;
  sha256: string;
  bytes: number;
  fingerprint: string;
  signature?: SignatureBlock;
};

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "journal";

const zurich = (ms: number) =>
  new Date(ms)
    .toLocaleString("sv-SE", { timeZone: "Europe/Zurich" })
    .replace(/[^0-9]/g, "")
    .slice(0, 12);

/** "orion-aic-dossier-Crue-de-l-Arve-2026-09-24[-version-202609241400].pdf" */
export function exportName(
  journal: Pick<Journal, "title">,
  scope: ExportScope,
  kind: string,
  extension: string,
  at = Date.now(),
) {
  const day = zurich(at);
  return `orion-aic-${kind}-${slug(journal.title)}-${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}${scope.viewAt === null ? "" : `-version-${zurich(scope.viewAt).slice(0, 8)}-${zurich(scope.viewAt).slice(8)}`}${extension}`;
}

/** Archives stay importable: the import refuses files over 32 Mo. */
function checkArchiveSize(text: string) {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES)
    throw new Error(
      t(
        "Cette archive dépasse la limite d’import de 32 Mo. Choisissez moins de parties, ou les formats de lecture.",
      ),
    );
}

const bytes = (data: Uint8Array) => data as Uint8Array<ArrayBuffer>;
const blobOf = (data: Uint8Array | string, type: string) =>
  new Blob([typeof data === "string" ? data : bytes(data)], { type });

export const isComplete = (scope: ExportScope) =>
  scope.viewAt === null &&
  SECTION_IDS.every((s) => scope.sections.includes(s)) &&
  !Object.values(scope.items ?? {}).some((l) => l?.length);

/** Names of the official map symbols, loaded once for the tables. */
async function symbolNames() {
  const { officialNames } = await import("../modules/map/builtins.ts");
  if (officialNames.size) return;
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}symbols/catalog.json`);
    if (!r.ok) return;
    const list = (await r.json()) as { id: string; name: string }[];
    for (const s of list) officialNames.set(s.id, s.name);
  } catch {
    // Names stay generic ("Signe officiel").
  }
}

/** PNG of every map of the dossier (maps that fail are left out). */
async function renderMaps(
  journal: Journal,
  mapIds: string[],
  progress: (label: string, ratio: number) => void,
  size = { width: 1200, height: 800 },
): Promise<Record<string, MapPicture>> {
  if (!mapIds.length) return {};
  const { renderMap } = await import("../modules/map/render.ts");
  const out: Record<string, MapPicture> = {};
  for (const [i, mapId] of mapIds.entries()) {
    progress(
      t("Carte {n} / {total}", { n: i + 1, total: mapIds.length }),
      i / mapIds.length,
    );
    try {
      const image = await renderMap(journal, {
        mapId,
        ...size,
        scale: 2,
        fit: "objects",
        labels: true,
      });
      out[mapId] = {
        png: new Uint8Array(await image.blob.arrayBuffer()),
        jpeg: await toJpeg(image.blob),
        width: image.width,
        height: image.height,
        attribution: image.attribution,
      };
    } catch {
      // A map without image keeps its caption and its table.
    }
    await pause();
  }
  return out;
}

/** JPEG copy of a map (a PNG is embedded uncompressed in a PDF). */
async function toJpeg(blob: Blob): Promise<Uint8Array | undefined> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const jpeg = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: 0.86,
    });
    return new Uint8Array(await jpeg.arrayBuffer());
  } catch {
    return undefined;
  }
}

const mapIdsOf = (dossier: Dossier) =>
  dossier.chapters.flatMap((c) =>
    c.blocks.flatMap((b) => (b.kind === "map" ? [b.mapId] : [])),
  );

type Written = { data: Uint8Array | string; extension: string; kind: string };

export async function produce(o: ProduceOptions): Promise<Produced> {
  const progress = o.onProgress ?? (() => {});
  const info = formatInfo(o.format);
  const exportedAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const notes: string[] = [];
  if (o.scope.sections.includes("map")) await symbolNames();

  // Content and stamp.
  const needsDossier = [
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
    "journal-pdf",
  ].includes(o.format);
  let dossier: Dossier | null = null;
  let journal: Journal;
  if (needsDossier) {
    dossier = await buildDossier(o.live, o.scope, {
      author: o.author,
      versions: o.versions,
      exportedAt,
      onProgress: (done, total, label) =>
        progress(label, 0.05 + (0.4 * done) / total),
    });
    journal = dossier.journal;
  } else {
    progress(t("Reconstitution de la version choisie"), 0.1);
    await pause();
    journal =
      o.format === "orion" || o.format === "archive-json"
        ? archiveJournal(o.live, o.scope)
        : resolveScope(o.live, o.scope).journal;
  }
  progress(t("Empreinte du contenu"), 0.46);
  await pause();
  const content = await contentHashOf(journal);
  const fingerprint = content.slice(0, 16);
  let stamp = makeStamp(id, fingerprint, o.author, exportedAt);
  if (o.signing) stamp = await signStamp(stamp, o.signing, content, exportedAt);
  /** Signed copy of a file this post wrote (PDF: signature after its end). */
  const seal = async (w: Written): Promise<Written> => {
    if (!o.signing || w.extension !== ".pdf") return w;
    const { signPdf } = await import("../../shared/signature.ts");
    const data =
      typeof w.data === "string" ? new TextEncoder().encode(w.data) : w.data;
    return { ...w, data: await signPdf(o.signing, data, exportedAt) };
  };

  // Maps.
  let maps: Record<string, MapPicture> = {};
  if (dossier && ["pdf", "docx", "odt", "html", "pack"].includes(o.format))
    maps = await renderMaps(journal, mapIdsOf(dossier), (l, r) =>
      progress(l, 0.48 + r * 0.17),
    );
  const doc = (): DocumentOptions => ({
    stamp,
    watermark: o.watermark.trim(),
    orientation: o.orientation,
    maps,
  });
  const name = (kind: string, extension: string) =>
    exportName(journal, o.scope, kind, extension);

  progress(t("Écriture du fichier"), 0.68);
  await pause();

  const one = async (format: FormatId): Promise<Written> => {
    switch (format) {
      case "pdf": {
        const { dossierPdf } = await import("./pdf.ts");
        return {
          data: new Uint8Array(
            await (await dossierPdf(dossier!, doc())).arrayBuffer(),
          ),
          extension: ".pdf",
          kind: t("fichier:dossier"),
        };
      }
      case "docx": {
        const { dossierDocx } = await import("./docx.ts");
        return {
          data: dossierDocx(dossier!, doc()),
          extension: ".docx",
          kind: t("fichier:dossier"),
        };
      }
      case "odt": {
        const { dossierOdt } = await import("./odt.ts");
        return {
          data: dossierOdt(dossier!, doc()),
          extension: ".odt",
          kind: t("fichier:dossier"),
        };
      }
      case "html": {
        const { dossierHtml } = await import("./html.ts");
        return {
          data: dossierHtml(dossier!, doc()),
          extension: ".html",
          kind: t("fichier:dossier"),
        };
      }
      case "md":
      case "txt": {
        const writers = await import("./text.ts");
        return format === "md"
          ? {
              data: writers.dossierMarkdown(dossier!, doc()),
              extension: ".md",
              kind: t("fichier:dossier"),
            }
          : {
              data: writers.dossierText(dossier!, doc()),
              extension: ".txt",
              kind: t("fichier:dossier"),
            };
      }
      case "json": {
        const { dossierJson } = await import("./text.ts");
        return {
          data: dossierJson(dossier!, doc()),
          extension: ".json",
          kind: t("fichier:donnees"),
        };
      }
      case "xlsx":
      case "ods": {
        const s = await import("./sheets.ts");
        return format === "xlsx"
          ? {
              data: s.dossierXlsx(dossier!, stamp, o.watermark.trim()),
              extension: ".xlsx",
              kind: t("fichier:tableaux"),
            }
          : {
              data: s.dossierOds(dossier!, stamp, o.watermark.trim()),
              extension: ".ods",
              kind: t("fichier:tableaux"),
            };
      }
      case "csv":
      case "tsv": {
        const { dossierDelimited } = await import("./text.ts");
        const r = dossierDelimited(
          dossier!,
          stamp,
          format === "csv" ? ";" : "\t",
        );
        if (!r.files.length)
          throw new Error(t("Aucun tableau dans ce contenu."));
        return r.zip
          ? {
              data: r.zip,
              extension: ".zip",
              kind: t("fichier:tableaux-{format}", { format }),
            }
          : {
              data: r.files[0].data,
              extension: `.${format}`,
              kind: t("fichier:tableau"),
            };
      }
      case "orion":
      case "archive-json": {
        const plain =
          format === "orion"
            ? await (async () => {
                const { deriveKey, encrypt } =
                  await import("../../shared/crypto.ts");
                progress(t("Chiffrement"), 0.8);
                return encrypt(archive(journal), await deriveKey(o.passphrase));
              })()
            : archive(journal);
        // Signed by this post: the whole envelope (or archive) but the
        // signature itself (shared/signature.ts).
        const value = o.signing
          ? await (
              await import("../../shared/signature.ts")
            ).signObject(o.signing, plain as object, exportedAt)
          : plain;
        const text = JSON.stringify(
          value,
          null,
          format === "orion" ? undefined : 2,
        );
        checkArchiveSize(text);
        return format === "orion"
          ? { data: text, extension: ".orionaic", kind: t("fichier:archive") }
          : { data: text, extension: ".json", kind: t("fichier:archive") };
      }
      case "sheets": {
        const { formsPdf } = await import("../print/pdf.ts");
        const { messageSheet } = await import("../print/sheet.ts");
        const entries = chronological(journal.entries);
        if (!entries.length)
          throw new Error(t("Aucune entrée du journal à cette heure."));
        const blob = await formsPdf(
          journal,
          entries.map(messageSheet),
          t("{n} messages · export {id} · {fingerprint}", {
            n: entries.length,
            id: shortId(id),
            fingerprint,
          }),
        );
        return {
          data: new Uint8Array(await blob.arrayBuffer()),
          extension: ".pdf",
          kind: t("fichier:fiches"),
        };
      }
      case "journal-pdf": {
        const { tablesPdf } = await import("../print/pdf.ts");
        const tbl = tablesOf(dossier!).find(
          (x) => x.table.id === "entries" || x.table.id === "missions",
        )?.table;
        if (!tbl)
          throw new Error(t("Aucune entrée du journal dans ce contenu."));
        const view = tbl.compact ?? tbl;
        const sum = view.columns.reduce((n, c) => n + (c.weight ?? 1), 0);
        const blob = await tablesPdf(journal, {
          kind: t("Journal d’intervention"),
          extra: dossier!.cover.shown,
          tables: [
            {
              id: tbl.id,
              title: tbl.title,
              caption: tbl.caption,
              head: view.columns.map((c) => c.label),
              body: view.rows,
              widths: view.columns.map((c) => ((c.weight ?? 1) / sum) * 269),
            },
          ],
          orientation: "landscape",
          footer: `export ${shortId(id)} · ${fingerprint}${stamp.key ? ` · ${t("clé {key}", { key: stamp.key.slice(0, 9) })}` : ""}`,
          verify: {
            qr: stamp.qr,
            text: stamp.key
              ? t(
                  "Export n° {id} · empreinte du contenu {content} · signé par la clé {key} ({alg}) le {date}. Vérifier : orion aic, Traçabilité → Vérifier un document (déposer ce PDF ou scanner ce code).",
                  {
                    id: stamp.id,
                    content: stamp.content,
                    key: stamp.key,
                    alg: stamp.alg,
                    date: dateTime(exportedAt),
                  },
                )
              : t(
                  "Export n° {id} · empreinte du contenu {fingerprint}. Vérifier : orion aic, Traçabilité → Vérifier un document.",
                  { id: stamp.id, fingerprint },
                ),
          },
        });
        return {
          data: new Uint8Array(await blob.arrayBuffer()),
          extension: ".pdf",
          kind: t("fichier:journal"),
        };
      }
      case "radio-pdf": {
        const { tablesPdf } = await import("../print/pdf.ts");
        const { radioTables } = await import("../print/radio-sheet.ts");
        const blob = await tablesPdf(journal, {
          kind: t("Plan du réseau radio"),
          extra: t("Établi par {name}", { name: o.author }),
          tables: radioTables(journal.radio),
          orientation: "landscape",
          footer: t("plan radio · export {id} · {fingerprint}", {
            id: shortId(id),
            fingerprint,
          }),
        });
        return {
          data: new Uint8Array(await blob.arrayBuffer()),
          extension: ".pdf",
          kind: t("fichier:radio"),
        };
      }
      case "labels-pdf": {
        const { labelsPdf } = await import("../print/pdf.ts");
        const blob = await labelsPdf(journal, o.origin);
        return {
          data: new Uint8Array(await blob.arrayBuffer()),
          extension: ".pdf",
          kind: t("fichier:etiquettes-radio"),
        };
      }
      case "png": {
        const list = mapsOf(journal);
        const images = await renderMaps(
          journal,
          list.map((m) => m.id),
          (l, r) => progress(l, 0.68 + r * 0.25),
          { width: 1600, height: 1100 },
        );
        const files = list.filter((m) => images[m.id]);
        if (!files.length)
          throw new Error(t("La carte n’a pas pu être dessinée."));
        if (files.length === 1)
          return {
            data: images[files[0].id].png,
            extension: ".png",
            kind: t("fichier:carte"),
          };
        return {
          data: zip(
            Object.fromEntries(
              files.map((m, i) => [
                `${String(i + 1).padStart(2, "0")}-${slug(m.name)}.png`,
                images[m.id].png,
              ]),
            ),
          ),
          extension: ".zip",
          kind: t("fichier:cartes-png"),
        };
      }
      case "geojson":
      case "kml":
      case "gpx": {
        const geo = await import("../modules/map/geoformats.ts");
        const write =
          format === "geojson"
            ? geo.toGeoJSON
            : format === "kml"
              ? geo.toKML
              : geo.toGPX;
        const list = mapsOf(journal);
        if (list.length === 1)
          return {
            data: write(journal, list[0].id),
            extension: `.${format}`,
            kind: t("fichier:carte"),
          };
        return {
          data: zip(
            Object.fromEntries(
              list.map((m, i) => [
                `${String(i + 1).padStart(2, "0")}-${slug(m.name)}.${format}`,
                write(journal, m.id),
              ]),
            ),
          ),
          extension: ".zip",
          kind: t("fichier:cartes-{format}", { format }),
        };
      }
      case "ics": {
        const { agendaIcs } = await import("./calendar.ts");
        if (!journal.ops.agenda.length)
          throw new Error(t("Aucun rendez-vous à cette heure."));
        return {
          data: agendaIcs(journal, journal.ops.agenda, stamp),
          extension: ".ics",
          kind: t("fichier:agenda"),
        };
      }
      case "vcf": {
        const { contactsVcf } = await import("./calendar.ts");
        if (!journal.ops.contacts.length)
          throw new Error(t("Aucun contact dans ce contenu."));
        return {
          data: contactsVcf(journal.ops.contacts, stamp),
          extension: ".vcf",
          kind: t("fichier:contacts"),
        };
      }
      case "pptx":
      case "odp":
      case "pdf-slides":
      case "html-slides": {
        const { exportDeck } = await import("../present/export.ts");
        const blob = await exportDeck(o.live, format, {
          scope: o.scope,
          author: o.author,
          animations: o.animations,
          watermark: o.watermark.trim(),
          stamp,
        });
        const extension = {
          pptx: ".pptx",
          odp: ".odp",
          "pdf-slides": ".pdf",
          "html-slides": ".html",
        }[format];
        return {
          data: new Uint8Array(await blob.arrayBuffer()),
          extension,
          kind: t("fichier:presentation"),
        };
      }
      case "pack":
        throw new Error("Pack imbriqué.");
    }
  };

  const outputs: Output[] = [];
  /** The archive of a pack could be written. */
  let archived = false;
  let main: Output;
  if (o.format === "pack") {
    const parts: FormatId[] = [
      "pdf",
      "docx",
      "xlsx",
      "html",
      "archive-json",
      "geojson",
      "ics",
      "vcf",
      "pptx",
    ];
    const chosen = parts.filter((f) => {
      const needs = formatInfo(f).needs;
      if (!needs) return true;
      if (!needs.some((s) => o.scope.sections.includes(s))) return false;
      if (f === "ics") return journal.ops.agenda.length > 0;
      if (f === "vcf") return journal.ops.contacts.length > 0;
      return true;
    });
    const files: Record<string, Uint8Array> = {};
    const lines: string[] = [];
    for (const [i, f] of chosen.entries()) {
      progress(
        t("Pack : {format}", { format: formatInfo(f).name }),
        0.68 + (0.25 * i) / chosen.length,
      );
      await pause();
      try {
        const w =
          f === "archive-json"
            ? await (async () => {
                // The archive of a pack keeps the history of the parts chosen.
                const value = archive(archiveJournal(o.live, o.scope));
                const text = JSON.stringify(value, null, 2);
                checkArchiveSize(text);
                return {
                  data: text,
                  extension: ".json",
                  kind: t("fichier:archive"),
                };
              })()
            : await seal(await one(f));
        const data =
          typeof w.data === "string"
            ? new TextEncoder().encode(w.data)
            : w.data;
        const file = name(w.kind, w.extension);
        files[file] = data;
        const sha = await sha256Hex(data);
        lines.push(
          `${file}\r\n  ${t("{format} · {n} octets", { format: formatInfo(f).name, n: data.length })}\r\n  SHA-256 ${sha}`,
        );
        outputs.push({
          name: file,
          blob: blobOf(data, formatInfo(f).mime),
          format: `Pack · ${formatInfo(f).name} (${formatInfo(f).extension})`,
        });
        if (f === "archive-json") archived = true;
      } catch (err) {
        notes.push(
          t("{label} : {value}", {
            label: formatInfo(f).name,
            value: (err as Error).message,
          }),
        );
      }
    }
    const readme = [
      `orion aic · ${t("pack complet")}`,
      "",
      t("{label} : {value}", { label: t("Opération"), value: journal.title }),
      t("{label} : {value}", {
        label: t("Contenu"),
        value: describeScope(o.scope),
      }),
      t("Exporté le {date} par {name} (heures Europe/Zurich)", {
        date: dateTime(exportedAt),
        name: o.author,
      }),
      t("Document n° {id} · empreinte du contenu {fingerprint}", {
        id: stamp.id,
        fingerprint: stamp.fingerprint,
      }),
      t("Vérification : {code}", { code: stamp.qr }),
      "",
      t(
        "Fichiers et empreintes SHA-256 (vérifiables dans orion aic, Traçabilité → Vérifier un document) :",
      ),
      "",
      ...lines,
      ...(notes.length
        ? ["", t("Non inclus :"), ...notes.map((n) => `  ${n}`)]
        : []),
      "",
      t(
        "L’archive JSON se réimporte dans orion aic (Importer → journal séparé) : la machine à remonter le temps rejoue alors toute l’opération.",
      ),
      "",
    ].join("\r\n");
    files[t("LISEZMOI.txt")] = new TextEncoder().encode(readme);
    const packed = zip(files);
    main = {
      name: name(t("fichier:pack"), ".zip"),
      blob: blobOf(packed, info.mime),
      format: `${info.name} (.zip)`,
    };
  } else {
    const w = await seal(await one(o.format));
    const mime = w.extension.endsWith(".zip") ? "application/zip" : info.mime;
    main = {
      name: name(w.kind, w.extension),
      blob: blobOf(w.data, mime),
      format: `${info.name} (${w.extension})`,
    };
  }
  progress(t("Empreinte du fichier"), 0.96);
  return {
    main,
    files: [...outputs, main],
    stamp,
    // A pack counts as a backup only when its archive could be written.
    backup:
      (o.format === "orion" ||
        o.format === "archive-json" ||
        (o.format === "pack" && archived)) &&
      isComplete(o.scope),
    notes,
    signing: o.signing,
  };
}

/** Register lines of the files produced (SHA-256 of each file). */
export async function registerLines(
  produced: Produced,
  scope: ExportScope,
): Promise<RegisterLine[]> {
  const at = new Date().toISOString();
  const lines: RegisterLine[] = [];
  const { signFile } = await import("../../shared/signature.ts");
  for (const f of produced.files) {
    const data = new Uint8Array(await f.blob.arrayBuffer());
    const sha256 = await sha256Hex(data);
    lines.push({
      at,
      format: f.format.slice(0, 60),
      scope: registerScope(describeScope(scope), produced.stamp.id),
      viewAt: scope.viewAt === null ? "" : new Date(scope.viewAt).toISOString(),
      name: f.name.slice(0, 300),
      sha256,
      bytes: data.length,
      fingerprint: produced.stamp.fingerprint,
      ...(produced.signing
        ? { signature: await signFile(produced.signing, sha256, at) }
        : {}),
    });
  }
  return lines;
}

/**
 * Print an HTML document through a hidden frame. Always settles: resolves
 * once the print dialog was opened, rejects if the frame cannot print.
 */
export function printHtml(html: string, timeout = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) {
        frame.remove();
        reject(error);
      } else {
        // Some browsers print asynchronously: keep the frame a while.
        setTimeout(() => frame.remove(), 60_000);
        resolve();
      }
    };
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            t(
              "L’impression n’a pas démarré. Téléchargez la page HTML et imprimez-la.",
            ),
          ),
        ),
      timeout,
    );
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    frame.onload = () => {
      // Images are data URLs: decoded by now; a short delay lets fonts settle.
      setTimeout(() => {
        try {
          const win = frame.contentWindow;
          if (!win) throw new Error("no window");
          win.focus();
          win.print();
          finish();
        } catch {
          finish(new Error(t("Impression impossible dans ce navigateur.")));
        }
      }, 250);
    };
    frame.onerror = () =>
      finish(new Error(t("Impression impossible dans ce navigateur.")));
    try {
      frame.srcdoc = html;
      document.body.append(frame);
    } catch {
      finish(new Error(t("Impression impossible dans ce navigateur.")));
    }
  });
}
