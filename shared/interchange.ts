import { z } from "zod";
import {
  makeEntry,
  archive,
  chronological,
  current,
  dateTime,
  emptyFields,
  journalSchema,
  newJournal,
  parseArchive,
  type Archive,
  type Entry,
  type Fields,
  type Journal,
} from "./journal.ts";
import { LANGS, locale } from "./i18n/core.ts";
import { enumLabel } from "./i18n/enums.ts";
import { t, tIn, type Key } from "./i18n/interchange.ts";
export const MAX_IMPORT_BYTES = 32 * 1024 * 1024;
type Column = { key: Key; value: (entry: Entry) => string; fixed?: boolean };
// Columns of the exports. `key` is the French name (the CSV import accepts it
// in the three languages); `fixed` marks the schema values (z.enum), shown
// with enumLabel in the text and HTML exports but exported as stored in the
// spreadsheets (the import validates them).
const COLUMNS: Column[] = [
  { key: "N°", value: (e) => String(e.number) },
  { key: "Événement (ISO)", value: (e) => current(e).happenedAt },
  { key: "Réception (ISO)", value: (e) => current(e).receivedAt },
  { key: "Type", value: (e) => current(e).type, fixed: true },
  { key: "Message", value: (e) => current(e).message },
  { key: "Émetteur", value: (e) => current(e).source },
  { key: "Destinataire", value: (e) => current(e).recipient },
  { key: "Canal", value: (e) => current(e).channel, fixed: true },
  { key: "Priorité", value: (e) => current(e).priority, fixed: true },
  { key: "Confirmation", value: (e) => current(e).reliability, fixed: true },
  { key: "Lieu", value: (e) => current(e).location },
  { key: "Coordonnées", value: (e) => current(e).coordinates },
  { key: "Mesure / décision", value: (e) => current(e).action },
  { key: "Responsable", value: (e) => current(e).assignee },
  { key: "Échéance (ISO)", value: (e) => current(e).dueAt },
  { key: "Statut", value: (e) => current(e).status, fixed: true },
  { key: "Moyens / besoins", value: (e) => current(e).resources },
  { key: "Référence", value: (e) => current(e).reference },
  { key: "Notes", value: (e) => current(e).notes },
  { key: "Mots-clés", value: (e) => current(e).tags.join(", ") },
  { key: "Saisi par", value: (e) => e.createdBy },
  { key: "Enregistré (ISO)", value: (e) => e.createdAt },
  { key: "Origine", value: (e) => e.origin },
  { key: "Identifiant", value: (e) => e.id },
  { key: "Révisions", value: (e) => String(e.revisions.length) },
  { key: "Modifié par", value: (e) => e.revisions.at(-1)!.author },
  { key: "Modifié (ISO)", value: (e) => e.revisions.at(-1)!.at },
  { key: "Motif", value: (e) => e.revisions.at(-1)!.reason },
];
/**
 * [name, value, French name]: the name (index 0) is read in the language of
 * the post each time; the third element stays French for code that picks
 * columns by name.
 */
export const columns: [string, (entry: Entry) => string, Key][] = COLUMNS.map(
  ({ key, value }) => {
    const column: [string, (entry: Entry) => string, Key] = [key, value, key];
    Object.defineProperty(column, 0, {
      get: () => t(key),
      enumerable: true,
      configurable: true,
    });
    return column;
  },
);
/** French name of a CSV column written in any of the three languages. */
function headerKey(name: string): string {
  const text = name.trim();
  for (const { key } of COLUMNS)
    if (key === text || LANGS.some((lang) => tIn(lang, key) === text))
      return key;
  return name;
}
export const rows = (journal: Journal) => [
  columns.map(([name]) => name),
  ...chronological(journal.entries).map((e) =>
    columns.map(([, value]) => value(e)),
  ),
];
// Formula-like cells remain literal when opened in spreadsheet programs.
export const spreadsheetText = (s: string) =>
  /^[\s\uFEFF]*[=+@\-]/u.test(s) || /^[\t\r\n]/.test(s) || s.startsWith("'")
    ? `'${s}`
    : s;
const unescapeSpreadsheet = (s: string) =>
  s.startsWith("'") && spreadsheetText(s.slice(1)) === s ? s.slice(1) : s;
export function delimited(table: string[][], separator = ";") {
  return (
    "\uFEFF" +
    table
      .map((row) =>
        row
          .map((value) => `"${spreadsheetText(value).replaceAll('"', '""')}"`)
          .join(separator),
      )
      .join("\r\n")
  );
}
export function parseDelimited(text: string, separator?: string): string[][] {
  text = text.replace(/^\uFEFF/, "");
  if (text.length > MAX_IMPORT_BYTES)
    throw new Error(t("Fichier trop volumineux (32 Mo maximum)."));
  if (!separator) {
    const first = text.split(/\r?\n/, 1)[0];
    separator = [";", ",", "\t"].sort(
      (a, b) => first.split(b).length - first.split(a).length,
    )[0];
  }
  const table: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    afterQuote = false;
  const pushField = () => {
    row.push(unescapeSpreadsheet(field));
    field = "";
    afterQuote = false;
    if (row.length > 100) throw new Error(t("Trop de colonnes."));
  };
  const pushRow = () => {
    pushField();
    if (row.some(Boolean)) table.push(row);
    row = [];
    if (table.length > 10001)
      throw new Error(t("10 000 entrées maximum par import."));
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else field += c;
    } else if (c === separator) pushField();
    else if (c === "\r" || c === "\n") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      pushRow();
    } else if (c === '"' && !field && !afterQuote) quoted = true;
    else {
      if (afterQuote || c === '"')
        throw new Error(t("Guillemets CSV invalides."));
      field += c;
    }
    if (field.length > 20000)
      throw new Error(t("Une cellule dépasse 20 000 caractères."));
  }
  if (quoted)
    throw new Error(t("Le fichier CSV contient un champ non terminé."));
  if (field || row.length || afterQuote) pushRow();
  return table;
}
export function importCsv(text: string, title: string): Archive {
  const table = parseDelimited(text);
  const header = table.shift()?.map(headerKey);
  if (
    !header ||
    !header.includes("Message") ||
    !header.includes("Événement (ISO)")
  )
    throw new Error(
      t(
        "Colonnes « Message » et « Événement (ISO) » requises. Utilisez le modèle CSV orion aic.",
      ),
    );
  if (new Set(header).size !== header.length)
    throw new Error(t("Le CSV comporte des colonnes dupliquées."));
  const journal = newJournal(title);
  const mappings: [Key, keyof Fields][] = [
    ["Événement (ISO)", "happenedAt"],
    ["Réception (ISO)", "receivedAt"],
    ["Type", "type"],
    ["Message", "message"],
    ["Émetteur", "source"],
    ["Destinataire", "recipient"],
    ["Canal", "channel"],
    ["Priorité", "priority"],
    ["Confirmation", "reliability"],
    ["Lieu", "location"],
    ["Coordonnées", "coordinates"],
    ["Mesure / décision", "action"],
    ["Responsable", "assignee"],
    ["Échéance (ISO)", "dueAt"],
    ["Statut", "status"],
    ["Moyens / besoins", "resources"],
    ["Référence", "reference"],
    ["Notes", "notes"],
  ];
  for (const [i, row] of table.entries()) {
    if (row.length !== header.length)
      throw new Error(
        t("Ligne {n} : nombre de colonnes incorrect.", { n: i + 2 }),
      );
    const data = Object.fromEntries(
      header.map((key, index) => [key, row[index]]),
    );
    const fields: Record<string, unknown> = { ...emptyFields() };
    for (const [label, key] of mappings)
      if (label in data) fields[key] = data[label];
    fields.tags =
      data["Mots-clés"]
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    try {
      journal.entries.push(
        makeEntry(
          i + 1,
          journal.title,
          fields as Fields,
          data["Saisi par"] || t("Import CSV"),
        ),
      );
    } catch {
      throw new Error(
        t(
          "Ligne {n} : vérifiez les dates ISO, le message et les valeurs de statut/priorité.",
          { n: i + 2 },
        ),
      );
    }
  }
  return archive(journalSchema.parse(journal));
}
const legacySchema = z.object({
  format: z.literal("orion-export-v1"),
  operation: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    location: z.string().optional(),
  }),
  records: z
    .array(
      z.object({
        kind: z.string(),
        data: z.record(z.string(), z.unknown()),
        created_at: z.string(),
        created_by: z.string().optional(),
      }),
    )
    .max(10000),
});
export function importJson(value: unknown): {
  archive: Archive;
  notice: string;
} {
  if (
    typeof value === "object" &&
    value !== null &&
    "format" in value &&
    value.format === "orion-export-v1"
  ) {
    const old = legacySchema.parse(value);
    const journal = newJournal(
      old.operation.name ||
        old.operation.title ||
        t("Journal importé · ORION 0.3"),
    );
    for (const entry of old.records.filter((r) => r.kind === "journal")) {
      const d = entry.data;
      const str = (key: string) =>
        typeof d[key] === "string" ? (d[key] as string) : "";
      journal.entries.push(
        makeEntry(
          journal.entries.length + 1,
          journal.title,
          {
            ...emptyFields(),
            happenedAt: str("observedAt") || entry.created_at,
            receivedAt: entry.created_at,
            message: str("title") || str("notes") || t("Entrée importée"),
            source: str("source"),
            location: str("location"),
            action: str("decision"),
            assignee: str("assignee"),
            notes: str("notes"),
            priority: ["Urgent", "Important"].includes(str("priority"))
              ? (str("priority") as Fields["priority"])
              : "Normal",
            status: ["Traité", "Clos"].includes(str("status"))
              ? "Terminé"
              : "À traiter",
          },
          entry.created_by || t("Import ORION 0.3"),
        ),
      );
    }
    return {
      archive: archive(journalSchema.parse(journal)),
      notice: t(
        "Ancien format : seules les entrées du journal sont reprises. Les autres modules et leur historique ne sont pas importés.",
      ),
    };
  }
  return {
    archive: parseArchive(value),
    notice: t(
      "Les auteurs, dates et révisions sont conservés. Un fichier importé ne certifie pas l’identité de son auteur.",
    ),
  };
}
export const xml = (s: string) =>
  s
    .replace(
      /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu,
      "",
    )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
/** Filled columns of an entry, names and values as shown to a reader. */
const shownColumns = (e: Entry) =>
  COLUMNS.filter(({ value }) => value(e)).map(({ key, value, fixed }) => ({
    label: t(key),
    value: fixed ? enumLabel(value(e)) : value(e),
  }));
export function asText(journal: Journal, markdown = false): string {
  const prefix = markdown ? "# " : "";
  const exported = dateTime(new Date().toISOString());
  return (
    `${prefix}${journal.title}\n${journal.organization} · ${journal.location}\n${enumLabel(journal.mode)} · ${enumLabel(journal.classification)} · ${t("Réf. {reference}", { reference: journal.reference || "—" })}\n${t("Export du {date} · Heures Europe/Zurich", { date: exported })}\n${t("État actuel des entrées ; historique complet dans l’archive orion aic.")}\n\n` +
    chronological(journal.entries)
      .map(
        (e) =>
          `${markdown ? "## " : ""}#${e.number} · ${dateTime(current(e).happenedAt)} · ${enumLabel(current(e).type)}\n${shownColumns(
            e,
          )
            .map(({ label, value }) => t("{label} : {value}", { label, value }))
            .join("\n")}`,
      )
      .join("\n\n")
  );
}
export function asHtml(journal: Journal): string {
  const details = chronological(journal.entries)
    .map(
      (e) =>
        `<article><h2>#${e.number} · ${xml(dateTime(current(e).happenedAt))} · ${xml(enumLabel(current(e).type))}</h2><dl>${shownColumns(
          e,
        )
          .map(
            ({ label, value }) =>
              `<dt>${xml(label)}</dt><dd>${xml(value)}</dd>`,
          )
          .join("")}</dl></article>`,
    )
    .join("");
  const exported = dateTime(new Date().toISOString());
  return `<!doctype html><html lang="${locale()}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${xml(journal.title)}</title><style>body{font:14px system-ui;max-width:1000px;margin:40px auto;padding:20px;color:#17202d}h1{font-size:28px}article{border-top:1px solid #aab3bf;margin-top:30px;padding-top:10px}dl{display:grid;grid-template-columns:170px 1fr;gap:8px}dt{font-weight:600}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}h2{font-size:18px}@media print{body{margin:0}h2{break-after:avoid}dt,dd{break-inside:avoid}}</style><h1>${xml(journal.title)}</h1><p>${xml(journal.organization)} · ${xml(journal.location)} · ${xml(enumLabel(journal.mode))} · ${xml(enumLabel(journal.classification))}</p><p>${xml(t("Référence : {reference} · Export du {date} · Europe/Zurich", { reference: journal.reference, date: exported }))}</p><p>${xml(t("État actuel des entrées. Historique complet dans l’archive orion aic."))}</p>${details}</html>`;
}
