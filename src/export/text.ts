import { delimited } from "../../shared/interchange.ts";
import { zip } from "./bytes.ts";
import { coverFacts, tablesOf, type Dossier } from "./dossier.ts";
import type { DocumentOptions } from "./docx.ts";
import type { DocumentStamp } from "./stamp.ts";
import { t } from "./i18n.ts";

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
    .slice(0, 50) || t("tableau");

// ---------- Markdown ----------

const mdCell = (s: string) =>
  s.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", "<br>") ||
  " ";

export function dossierMarkdown(dossier: Dossier, o: DocumentOptions): string {
  const c = dossier.cover;
  const out: string[] = [
    `# ${c.title}`,
    "",
    `*orion aic · ${t("dossier de l’opération")}${o.watermark ? ` · **${o.watermark}**` : ""}*`,
    "",
    ...coverFacts(c).map(([k, v]) =>
      t("{label} : {value}", { label: `- **${k}**`, value: v }),
    ),
    t("{label} : {value}", {
      label: `- **${t("Document n°")}**`,
      value: `\`${o.stamp.id}\``,
    }),
    t("{label} : {value}", {
      label: `- **${t("Empreinte")}**`,
      value: `\`${o.stamp.fingerprint}\``,
    }),
    "",
    `## ${t("Sommaire")}`,
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
          `### ${t("Carte · {title}", { title: b.title })}`,
          "",
          t(
            "{caption}. Image et données géographiques : exports PNG, GeoJSON, KML ou GPX.",
            { caption: b.caption },
          ),
        );
      } else {
        const view = b.table.compact ?? b.table;
        out.push("", `### ${b.table.title}`, "", `*${b.table.caption}*`, "");
        if (!view.rows.length) {
          out.push(t("Aucun élément."));
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
    t("Vérification : {code}", { code: `\`${o.stamp.qr}\`` }),
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
    `orion aic · ${t("dossier de l’opération")}`,
    ...(o.watermark ? [`*** ${o.watermark} ***`] : []),
    "",
    ...coverFacts(c).map(([k, v]) =>
      t("{label} : {value}", { label: k, value: v }),
    ),
    t("{label} : {value}", { label: t("Document n°"), value: o.stamp.id }),
    t("{label} : {value}", {
      label: t("Empreinte"),
      value: o.stamp.fingerprint,
    }),
    "",
    t("Sommaire").toUpperCase(),
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
        out.push(
          "",
          rule(t("Carte · {title}", { title: b.title }), "-"),
          b.caption,
        );
      } else {
        const table = b.table;
        out.push("", rule(`${table.title} (${table.caption})`, "-"));
        if (!table.rows.length) out.push(t("Aucun élément."));
        // One record per block: readable whatever the number of columns.
        for (const r of table.rows)
          out.push(
            "",
            ...table.columns
              .map((col, i) => [col.label, r[i] ?? ""])
              .filter(([, v]) => v)
              .map(([k, v]) =>
                t("{label} : {value}", {
                  label: k,
                  value: v.replaceAll("\n", "\n    "),
                }),
              ),
          );
      }
    }
  }
  out.push(
    "",
    "",
    o.stamp.label,
    t("Vérification : {code}", { code: o.stamp.qr }),
    "",
  );
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
    separator === ";"
      ? t("Un fichier par tableau, UTF-8, séparateur point-virgule.")
      : t("Un fichier par tableau, UTF-8, séparateur tabulation."),
    "",
    ...files.map((f) => f.name),
    "",
    stamp.label,
    t("Vérification : {code}", { code: stamp.qr }),
    "",
  ].join("\r\n");
  return {
    files,
    zip: zip({
      [t("LISEZMOI.txt")]: readme,
      ...Object.fromEntries(files.map((f) => [f.name, f.data])),
    }),
  };
}
