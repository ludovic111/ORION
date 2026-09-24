import { delimited } from "../../shared/interchange.ts";
import { zip } from "./bytes.ts";
import { coverFacts, tablesOf, type Dossier } from "./dossier.ts";
import type { DocumentOptions } from "./docx.ts";
import type { DocumentStamp } from "./stamp.ts";

// Text formats of a dossier: Markdown, plain text, structured JSON and
// delimited tables (CSV with ";" or TSV, UTF-8 with BOM, one file per table,
// zipped when there are several).

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "tableau";

// ---------- Markdown ----------

const mdCell = (s: string) =>
  s.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", "<br>") ||
  " ";

export function dossierMarkdown(dossier: Dossier, o: DocumentOptions): string {
  const c = dossier.cover;
  const out: string[] = [
    `# ${c.title}`,
    "",
    `*orion aic · dossier de l’opération${o.watermark ? ` · **${o.watermark}**` : ""}*`,
    "",
    ...coverFacts(c).map(([k, v]) => `- **${k}** : ${v}`),
    `- **Document n°** : \`${o.stamp.id}\``,
    `- **Empreinte** : \`${o.stamp.fingerprint}\``,
    "",
    "## Sommaire",
    "",
    ...dossier.chapters.map(
      (ch) => `${ch.number}. **${ch.title}** · ${ch.summary}`,
    ),
  ];
  for (const ch of dossier.chapters) {
    out.push("", `## ${ch.number}. ${ch.title}`, "", `> ${ch.summary}`);
    for (const b of ch.blocks) {
      if (b.kind === "text") {
        out.push("", `### ${b.title}`, "", b.body);
        if (b.meta) out.push("", `*${b.meta}*`);
      } else if (b.kind === "map") {
        out.push(
          "",
          `### Carte · ${b.title}`,
          "",
          `${b.caption}. Image et données géographiques : exports PNG, GeoJSON, KML ou GPX.`,
        );
      } else {
        const view = b.table.compact ?? b.table;
        out.push("", `### ${b.table.title}`, "", `*${b.table.caption}*`, "");
        if (!view.rows.length) {
          out.push("Aucun élément.");
          continue;
        }
        out.push(
          `| ${view.columns.map((col) => mdCell(col.label)).join(" | ")} |`,
          `| ${view.columns.map(() => "---").join(" | ")} |`,
          ...view.rows.map(
            (r) =>
              `| ${view.columns.map((_, i) => mdCell(r[i] ?? "")).join(" | ")} |`,
          ),
        );
      }
    }
  }
  out.push(
    "",
    "---",
    "",
    `${o.stamp.label}  `,
    `Vérification : \`${o.stamp.qr}\``,
    "",
  );
  return out.join("\n");
}

// ---------- Plain text ----------

export function dossierText(dossier: Dossier, o: DocumentOptions): string {
  const c = dossier.cover;
  const rule = (s: string, ch = "=") =>
    `${s}\n${ch.repeat(Math.min(78, s.length))}`;
  const out: string[] = [
    rule(c.title.toUpperCase()),
    "orion aic · dossier de l’opération",
    ...(o.watermark ? [`*** ${o.watermark} ***`] : []),
    "",
    ...coverFacts(c).map(([k, v]) => `${k} : ${v}`),
    `Document n° : ${o.stamp.id}`,
    `Empreinte : ${o.stamp.fingerprint}`,
    "",
    "SOMMAIRE",
    ...dossier.chapters.map(
      (ch) => `  ${ch.number}. ${ch.title} · ${ch.summary}`,
    ),
  ];
  for (const ch of dossier.chapters) {
    out.push("", "", rule(`${ch.number}. ${ch.title}`), ch.summary);
    for (const b of ch.blocks) {
      if (b.kind === "text") {
        out.push("", rule(b.title, "-"), b.body);
        if (b.meta) out.push(`(${b.meta})`);
      } else if (b.kind === "map") {
        out.push("", rule(`Carte · ${b.title}`, "-"), b.caption);
      } else {
        const t = b.table;
        out.push("", rule(`${t.title} (${t.caption})`, "-"));
        if (!t.rows.length) out.push("Aucun élément.");
        // One record per block: readable whatever the number of columns.
        for (const r of t.rows)
          out.push(
            "",
            ...t.columns
              .map((col, i) => [col.label, r[i] ?? ""])
              .filter(([, v]) => v)
              .map(([k, v]) => `${k} : ${v.replaceAll("\n", "\n    ")}`),
          );
      }
    }
  }
  out.push("", "", o.stamp.label, `Vérification : ${o.stamp.qr}`, "");
  return out.join("\n");
}

// ---------- JSON ----------

/** The dossier as structured data: tables as lists of objects. */
export function dossierJson(dossier: Dossier, o: DocumentOptions): string {
  return JSON.stringify(
    {
      format: "orion-dossier",
      version: 1,
      document: {
        id: o.stamp.id,
        fingerprint: o.stamp.fingerprint,
        label: o.stamp.label,
        verify: o.stamp.qr,
        watermark: o.watermark,
      },
      cover: dossier.cover,
      chapters: dossier.chapters.map((ch) => ({
        id: ch.id,
        number: ch.number,
        title: ch.title,
        summary: ch.summary,
        indicators: Object.fromEntries(ch.kpis.map((k) => [k.label, k.value])),
        texts: ch.blocks.flatMap((b) =>
          b.kind === "text"
            ? [{ title: b.title, body: b.body, meta: b.meta ?? "" }]
            : [],
        ),
        maps: ch.blocks.flatMap((b) =>
          b.kind === "map"
            ? [
                {
                  id: b.mapId,
                  title: b.title,
                  caption: b.caption,
                  objects: b.objects,
                },
              ]
            : [],
        ),
        tables: ch.blocks.flatMap((b) =>
          b.kind === "table"
            ? [
                {
                  id: b.table.id,
                  title: b.table.title,
                  caption: b.table.caption,
                  columns: b.table.columns.map((col) => col.label),
                  rows: b.table.rows.map((r) =>
                    Object.fromEntries(
                      b.table.columns.map((col, i) => [col.label, r[i] ?? ""]),
                    ),
                  ),
                },
              ]
            : [],
        ),
      })),
    },
    null,
    2,
  );
}

// ---------- Delimited ----------

export type TextFile = { name: string; data: Uint8Array | string };

/** One CSV / TSV file per table (UTF-8 with BOM); zipped when several. */
export function dossierDelimited(
  dossier: Dossier,
  stamp: DocumentStamp,
  separator: ";" | "\t",
): { files: TextFile[]; zip: Uint8Array | null } {
  const extension = separator === ";" ? "csv" : "tsv";
  const files = tablesOf(dossier).map(({ chapter, table }, i) => ({
    name: `${String(i + 1).padStart(2, "0")}-${slug(chapter.title)}-${slug(table.title)}.${extension}`,
    data: delimited(
      [table.columns.map((col) => col.label), ...table.rows],
      separator,
    ),
  }));
  if (files.length < 2) return { files, zip: null };
  const readme = [
    `${dossier.cover.title} · ${dossier.cover.shown}`,
    `${dossier.cover.scope}`,
    "",
    `Un fichier par tableau, UTF-8, séparateur ${separator === ";" ? "point-virgule" : "tabulation"}.`,
    "",
    ...files.map((f) => f.name),
    "",
    stamp.label,
    `Vérification : ${stamp.qr}`,
    "",
  ].join("\r\n");
  return {
    files,
    zip: zip({
      "LISEZMOI.txt": readme,
      ...Object.fromEntries(files.map((f) => [f.name, f.data])),
    }),
  };
}
