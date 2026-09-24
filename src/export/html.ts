import { xml } from "../../shared/interchange.ts";
import { base64, qrSvg } from "./bytes.ts";
import { coverFacts, type Dossier } from "./dossier.ts";
import { DOCUMENT_ROWS, mapBytes, type DocumentOptions } from "./docx.ts";

// Standalone HTML dossier: one file, no external resource (strict CSP),
// table of contents, map images as data URLs, watermark, stamp and QR code
// as inline SVG. Readable on screen (light or dark) and printable: the
// watermark and the stamp repeat on every printed page.

const esc = (s: string) => xml(s).replaceAll("\n", "<br>");
/** CSS string literal, safe inside a <style> element. */
const cssString = (s: string) =>
  `"${s.replace(/[\\"<>\n]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}"`;

const CSS = `
:root{--ink:#1b1f3a;--text:#262a45;--muted:#5f6680;--line:#d9dce8;--soft:#f3f4fa;--accent:#5c45ff;--bg:#fff;--head:#1b1f3a;--ok:#0c9b69;--warn:#b86e00;--crit:#d8214a;color-scheme:light}
@media screen and (prefers-color-scheme:dark){:root{--ink:#eceefe;--text:#d6d9f0;--muted:#9aa0c3;--line:#2c3150;--soft:#151833;--accent:#9d8fff;--bg:#0b0d1c;--head:#262b52;--ok:#34e0a1;--warn:#ffb547;--crit:#ff5a7a;color-scheme:dark}}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0 auto;max-width:1080px;padding:32px 28px 80px;font:14px/1.5 "IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--text);background:var(--bg);-webkit-print-color-adjust:exact;print-color-adjust:exact}
a{color:var(--accent)}
.band{height:6px;border-radius:99px;background:linear-gradient(115deg,#0098c7,#5c45ff 50%,#d63b9c);margin-bottom:28px}
.kicker{font:600 11px/1.2 ui-monospace,"SF Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
h1{font-size:40px;line-height:1.1;margin:10px 0 6px;color:var(--ink);letter-spacing:-.02em}
.sub{font-size:17px;color:var(--muted);margin:0 0 18px}
.mention{display:inline-block;font:700 12px/1 ui-monospace,monospace;letter-spacing:.12em;color:var(--crit);border:1.5px solid var(--crit);border-radius:6px;padding:6px 10px;margin-bottom:18px}
.cover{display:grid;grid-template-columns:minmax(0,1fr) 200px;gap:28px;align-items:start}
dl.facts{display:grid;grid-template-columns:170px minmax(0,1fr);margin:0;border-top:1px solid var(--line)}
dl.facts dt,dl.facts dd{margin:0;padding:7px 0;border-bottom:1px solid var(--line)}
dl.facts dt{font-weight:600;color:var(--muted)}
.verify{border:1px solid var(--line);border-radius:14px;padding:14px;text-align:center;background:var(--soft)}
.verify svg{width:100%;height:auto;border-radius:6px}
.verify p{font-size:11.5px;color:var(--muted);margin:8px 0 0}
nav.toc{margin:36px 0;padding:18px 22px;border:1px solid var(--line);border-radius:14px}
nav.toc h2{margin:0 0 10px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
nav.toc ol{margin:0;padding-left:22px;columns:2;column-gap:36px}
nav.toc li{break-inside:avoid;margin:3px 0}
nav.toc li span{color:var(--muted);font-size:12px}
section.chapter{margin-top:56px}
section.chapter>header{border-bottom:2px solid var(--ink);padding-bottom:8px;margin-bottom:14px}
section.chapter h2{font-size:26px;margin:4px 0 0;color:var(--ink);letter-spacing:-.01em}
.kpis{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px}
.kpi{min-width:112px;padding:10px 14px;border-radius:12px;background:var(--soft);border:1px solid var(--line)}
.kpi b{display:block;font-size:22px;line-height:1.1;color:var(--ink)}
.kpi span{font-size:12px;color:var(--muted)}
.kpi.ok b{color:var(--ok)}.kpi.warn b{color:var(--warn)}.kpi.crit b{color:var(--crit)}
h3{font-size:16px;margin:26px 0 6px;color:var(--ink)}
.caption{font-size:12px;color:var(--muted);margin:0 0 8px}
.text{white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 4px}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:10px}
table{border-collapse:collapse;width:100%;font-size:12.5px}
thead th{position:sticky;top:0;background:var(--head);color:#fff;text-align:left;font-weight:600;padding:7px 9px;font-size:11.5px}
td{padding:6px 9px;border-top:1px solid var(--line);vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}
tbody tr:nth-child(even) td{background:var(--soft)}
figure{margin:8px 0 0}
figure img{display:block;width:100%;height:auto;border-radius:10px;border:1px solid var(--line)}
figcaption{font-size:12px;color:var(--muted);margin-top:6px}
.empty{color:var(--muted);font-style:italic}
footer.stamp{margin-top:56px;padding-top:12px;border-top:1px solid var(--line);font:11px/1.4 ui-monospace,monospace;color:var(--muted);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
.wm{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:5;overflow:hidden}
.wm span{transform:rotate(-38deg);font:800 clamp(56px,11vw,150px)/1 system-ui,sans-serif;letter-spacing:.06em;color:var(--ink);opacity:.06;white-space:nowrap}
@media (max-width:720px){body{padding:20px 16px 60px}h1{font-size:30px}.cover{grid-template-columns:1fr}.verify{max-width:220px}nav.toc ol{columns:1}dl.facts{grid-template-columns:120px minmax(0,1fr)}}
@page{size:A4 __ORIENTATION__;margin:16mm 12mm 18mm;@bottom-left{content:__STAMP__;font:8px ui-monospace,monospace;color:#5f6680}@bottom-right{content:counter(page) " / " counter(pages);font:9px system-ui;color:#5f6680}}
@media print{body{max-width:none;padding:0;font-size:11px}.band{margin-bottom:14px}h1{font-size:30px}section.chapter{break-before:page;margin-top:0}nav.toc{break-before:page;border:0;padding:0}thead{display:table-header-group}tr,figure,.kpi{break-inside:avoid}h3{break-after:avoid}.scroll{overflow:visible;border:0}thead th{position:static}table{font-size:9.5px}.wm span{font-size:120px;opacity:.07}}
`;

export function dossierHtml(dossier: Dossier, o: DocumentOptions): string {
  const c = dossier.cover;
  const parts: string[] = [];
  const toc = dossier.chapters
    .map(
      (ch) =>
        `<li><a href="#part-${ch.number}">${esc(ch.title)}</a><br><span>${esc(ch.summary)}</span></li>`,
    )
    .join("");
  for (const ch of dossier.chapters) {
    const blocks = ch.blocks
      .map((b, i) => {
        if (b.kind === "text")
          return `<h3>${esc(b.title)}</h3><p class="text">${esc(b.body)}</p>${b.meta ? `<p class="caption">${esc(b.meta)}</p>` : ""}`;
        if (b.kind === "map") {
          const image = o.maps[b.mapId];
          return `<h3 id="part-${ch.number}-${i + 1}">Carte · ${esc(b.title)}</h3><figure>${
            image
              ? `<img src="data:${mapBytes(image).mime};base64,${base64(mapBytes(image).data)}" alt="Carte ${xml(b.title)}" width="${image.width}" height="${image.height}">`
              : ""
          }<figcaption>${esc([b.caption, image?.attribution].filter(Boolean).join(" · "))}</figcaption></figure>`;
        }
        const t = b.table;
        const view = t.compact ?? t;
        const rows = view.rows.slice(0, DOCUMENT_ROWS);
        return `<h3 id="part-${ch.number}-${i + 1}">${esc(t.title)}</h3><p class="caption">${esc(t.caption)}</p>${
          rows.length
            ? `<div class="scroll"><table><thead><tr>${view.columns.map((col) => `<th>${esc(col.label)}</th>`).join("")}</tr></thead><tbody>${rows
                .map(
                  (r) =>
                    `<tr>${view.columns.map((_, k) => `<td>${esc(r[k] ?? "")}</td>`).join("")}</tr>`,
                )
                .join("")}</tbody></table></div>`
            : `<p class="empty">Aucun élément.</p>`
        }${view.rows.length > rows.length ? `<p class="caption">… ${view.rows.length - rows.length} lignes de plus dans les exports tableur.</p>` : ""}`;
      })
      .join("");
    parts.push(
      `<section class="chapter" id="part-${ch.number}"><header><div class="kicker">Partie ${ch.number}</div><h2>${esc(ch.title)}</h2></header><div class="kpis">${ch.kpis
        .map(
          (k) =>
            `<div class="kpi ${k.value !== "0" ? (k.tone ?? "") : ""}"><b>${esc(k.value)}</b><span>${esc(k.label)}</span></div>`,
        )
        .join("")}</div>${blocks}</section>`,
    );
  }
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><meta name="generator" content="orion aic"><meta name="description" content="${xml(o.stamp.label)}"><title>${xml(c.title)} · dossier orion aic</title><style>${CSS.replace("__ORIENTATION__", o.orientation).replace("__STAMP__", cssString(o.stamp.label))}</style></head>
<body>${o.watermark ? `<div class="wm" aria-hidden="true"><span>${xml(o.watermark)}</span></div>` : ""}
<div class="band"></div>
<header class="cover"><div><div class="kicker">orion aic · dossier de l’opération</div><h1>${esc(c.title)}</h1><p class="sub">${esc([c.organization, c.location].filter(Boolean).join(" · ") || c.shown)}</p>${o.watermark ? `<div class="mention">${xml(o.watermark)}</div>` : ""}<dl class="facts">${[
    ...coverFacts(c),
    ["Document n°", o.stamp.id],
    ["Empreinte", o.stamp.fingerprint],
  ]
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join(
      "",
    )}</dl></div><aside class="verify">${qrSvg(o.stamp.qr, 200)}<p>Vérifier ce document : orion aic → Traçabilité → Vérifier un document.</p></aside></header>
<nav class="toc" aria-label="Sommaire"><h2>Sommaire</h2><ol>${toc}</ol></nav>
${parts.join("\n")}
<footer class="stamp"><span>${xml(o.stamp.label)}</span><span>${xml(o.stamp.qr)}</span></footer>
</body></html>`;
}
