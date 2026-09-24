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
export const MAX_IMPORT_BYTES = 32 * 1024 * 1024;
export const columns: [string, (entry: Entry) => string][] = [
  ["N°", (e) => String(e.number)],
  ["Événement (ISO)", (e) => current(e).happenedAt],
  ["Réception (ISO)", (e) => current(e).receivedAt],
  ["Type", (e) => current(e).type],
  ["Message", (e) => current(e).message],
  ["Émetteur", (e) => current(e).source],
  ["Destinataire", (e) => current(e).recipient],
  ["Canal", (e) => current(e).channel],
  ["Priorité", (e) => current(e).priority],
  ["Confirmation", (e) => current(e).reliability],
  ["Lieu", (e) => current(e).location],
  ["Coordonnées", (e) => current(e).coordinates],
  ["Mesure / décision", (e) => current(e).action],
  ["Responsable", (e) => current(e).assignee],
  ["Échéance (ISO)", (e) => current(e).dueAt],
  ["Statut", (e) => current(e).status],
  ["Moyens / besoins", (e) => current(e).resources],
  ["Référence", (e) => current(e).reference],
  ["Notes", (e) => current(e).notes],
  ["Mots-clés", (e) => current(e).tags.join(", ")],
  ["Saisi par", (e) => e.createdBy],
  ["Enregistré (ISO)", (e) => e.createdAt],
  ["Origine", (e) => e.origin],
  ["Identifiant", (e) => e.id],
  ["Révisions", (e) => String(e.revisions.length)],
  ["Modifié par", (e) => e.revisions.at(-1)!.author],
  ["Modifié (ISO)", (e) => e.revisions.at(-1)!.at],
  ["Motif", (e) => e.revisions.at(-1)!.reason],
];
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
    throw new Error("Fichier trop volumineux (32 Mo maximum).");
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
    if (row.length > 100) throw new Error("Trop de colonnes.");
  };
  const pushRow = () => {
    pushField();
    if (row.some(Boolean)) table.push(row);
    row = [];
    if (table.length > 10001)
      throw new Error("10 000 entrées maximum par import.");
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
      if (afterQuote || c === '"') throw new Error("Guillemets CSV invalides.");
      field += c;
    }
    if (field.length > 20000)
      throw new Error("Une cellule dépasse 20 000 caractères.");
  }
  if (quoted) throw new Error("Le fichier CSV contient un champ non terminé.");
  if (field || row.length || afterQuote) pushRow();
  return table;
}
export function importCsv(text: string, title: string): Archive {
  const table = parseDelimited(text);
  const header = table.shift();
  if (
    !header ||
    !header.includes("Message") ||
    !header.includes("Événement (ISO)")
  )
    throw new Error(
      "Colonnes « Message » et « Événement (ISO) » requises. Utilisez le modèle CSV orion aic.",
    );
  if (new Set(header).size !== header.length)
    throw new Error("Le CSV comporte des colonnes dupliquées.");
  const journal = newJournal(title);
  const mappings: [string, keyof Fields][] = [
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
      throw new Error(`Ligne ${i + 2} : nombre de colonnes incorrect.`);
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
          data["Saisi par"] || "Import CSV",
        ),
      );
    } catch {
      throw new Error(
        `Ligne ${i + 2} : vérifiez les dates ISO, le message et les valeurs de statut/priorité.`,
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
        "Journal importé · ORION 0.3",
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
            message: str("title") || str("notes") || "Entrée importée",
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
          entry.created_by || "Import ORION 0.3",
        ),
      );
    }
    return {
      archive: archive(journalSchema.parse(journal)),
      notice:
        "Ancien format : seules les entrées du journal sont reprises. Les autres modules et leur historique ne sont pas importés.",
    };
  }
  return {
    archive: parseArchive(value),
    notice:
      "Les auteurs, dates et révisions sont conservés. Un fichier importé ne certifie pas l’identité de son auteur.",
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
export function asText(journal: Journal, markdown = false): string {
  const prefix = markdown ? "# " : "";
  return (
    `${prefix}${journal.title}\n${journal.organization} · ${journal.location}\n${journal.mode} · ${journal.classification} · Réf. ${journal.reference || "—"}\nExport du ${dateTime(new Date().toISOString())} · Heures Europe/Zurich\nÉtat actuel des entrées ; historique complet dans l’archive orion aic.\n\n` +
    chronological(journal.entries)
      .map(
        (e) =>
          `${markdown ? "## " : ""}#${e.number} · ${dateTime(current(e).happenedAt)} · ${current(e).type}\n${columns
            .filter(([, value]) => value(e))
            .map(([label, value]) => `${label} : ${value(e)}`)
            .join("\n")}`,
      )
      .join("\n\n")
  );
}
export function asHtml(journal: Journal): string {
  const details = chronological(journal.entries)
    .map(
      (e) =>
        `<article><h2>#${e.number} · ${xml(dateTime(current(e).happenedAt))} · ${xml(current(e).type)}</h2><dl>${columns
          .filter(([, value]) => value(e))
          .map(
            ([label, value]) =>
              `<dt>${xml(label)}</dt><dd>${xml(value(e))}</dd>`,
          )
          .join("")}</dl></article>`,
    )
    .join("");
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${xml(journal.title)}</title><style>body{font:14px system-ui;max-width:1000px;margin:40px auto;padding:20px;color:#17202d}h1{font-size:28px}article{border-top:1px solid #aab3bf;margin-top:30px;padding-top:10px}dl{display:grid;grid-template-columns:170px 1fr;gap:8px}dt{font-weight:600}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}h2{font-size:18px}@media print{body{margin:0}h2{break-after:avoid}dt,dd{break-inside:avoid}}</style><h1>${xml(journal.title)}</h1><p>${xml(journal.organization)} · ${xml(journal.location)} · ${xml(journal.mode)} · ${xml(journal.classification)}</p><p>Référence : ${xml(journal.reference)} · Export du ${xml(dateTime(new Date().toISOString()))} · Europe/Zurich</p><p>État actuel des entrées. Historique complet dans l’archive orion aic.</p>${details}</html>`;
}
