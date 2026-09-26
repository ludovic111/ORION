import { strToU8, zipSync, type Zippable } from "fflate";
import { esc, hexColor } from "./text.ts";
import { locale } from "../../shared/i18n/core.ts";
import {
  PAGE_H,
  PAGE_W,
  type Anim,
  type BoxShape,
  type DeckImages,
  type Para,
  type Palette,
  type Shape,
  type SlideLayout,
  type TableShape,
} from "./layout.ts";

// OpenDocument presentation (.odp, ODF 1.3): the same shapes as the
// PowerPoint file, with SMIL slide transitions, entrance effects that start
// by themselves (after previous / with previous) and speaker notes. Tables
// are drawn as groups of cells, which every ODF reader shows the same way.

export type OdpMeta = {
  title: string;
  author: string;
  created?: Date;
  palette: Palette;
};

const PAGE_CM = 33.867;
/** Language of the texts (the language of the post: "fr" / "CH"). */
const language = () => {
  const [lang, country] = locale().split("-");
  return ` fo:language="${lang}" fo:country="${country}"`;
};
const cm = (px: number) => `${((px * PAGE_CM) / PAGE_W).toFixed(3)}cm`;
const pt = (px: number) => `${(px / 2).toFixed(1)}pt`;
const secs = (ms: number) =>
  `${(ms / 1000).toFixed(3).replace(/\.?0+$/, "") || "0"}s`;
const hex = (c: string) => `#${hexColor(c, "808080").toLowerCase()}`;
const NS = [
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"',
  'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"',
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"',
  'xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"',
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"',
  'xmlns:xlink="http://www.w3.org/1999/xlink"',
  'xmlns:dc="http://purl.org/dc/elements/1.1/"',
  'xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"',
  'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"',
  'xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"',
  'xmlns:smil="urn:oasis:names:tc:opendocument:xmlns:smil-compatible:1.0"',
  'xmlns:anim="urn:oasis:names:tc:opendocument:xmlns:animation:1.0"',
  'xmlns:loext="urn:org:documentfoundation:names:experimental:office:xmlns:loext:1.0"',
].join(" ");
const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';

/** Colour seen through a transparency, for text (ODF has no text alpha). */
function blend(fg: string, bg: string, alpha: number) {
  const f = hexColor(fg, "808080");
  const k = hexColor(bg, "000000");
  const a = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  const b = [0, 2, 4].map((i) => parseInt(k.slice(i, i + 2), 16));
  return a
    .map((v, i) =>
      Math.round(v * alpha + b[i] * (1 - alpha))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}

/** Automatic styles, created on demand and shared. */
class Styles {
  private map = new Map<string, string>();
  xml: string[] = [];
  get(prefix: string, family: string, body: string) {
    const key = `${family}|${body}`;
    let name = this.map.get(key);
    if (!name) {
      name = `${prefix}${this.map.size + 1}`;
      this.map.set(key, name);
      this.xml.push(
        `<style:style style:name="${name}" style:family="${family}">${body}</style:style>`,
      );
    }
    return name;
  }
}

const TRANSITIONS = {
  fade: 'smil:type="fade" smil:subtype="crossfade"',
  push: 'smil:type="pushWipe" smil:subtype="fromBottom"',
};

function presetOf(anim: Anim, id: string) {
  const d = secs(anim.dur);
  const target = `smil:targetElement="${id}"`;
  const fade = `<anim:transitionFilter smil:dur="${d}" ${target} smil:type="fade" smil:subtype="crossfade"/>`;
  const animate = (attr: string, values: string) =>
    `<anim:animate smil:dur="${d}" smil:fill="hold" ${target} smil:attributeName="${attr}" smil:values="${values}" smil:keyTimes="0;1" presentation:additive="base"/>`;
  switch (anim.effect) {
    case "rise":
      return {
        id: "ooo-entrance-ascend",
        xml: animate("x", "x;x") + animate("y", "y+.04;y") + fade,
      };
    case "zoom":
      return {
        id: "ooo-entrance-zoom",
        xml: animate("width", "0;width") + animate("height", "0;height") + fade,
      };
    case "wipe":
      return {
        id: "ooo-entrance-wipe",
        xml: `<anim:transitionFilter smil:dur="${d}" ${target} smil:type="barWipe" smil:subtype="leftToRight"/>`,
      };
    default:
      return { id: "ooo-entrance-fade-in", xml: fade };
  }
}

function animations(list: { id: string; anim: Anim }[]) {
  if (!list.length) return "";
  const sorted = [...list].sort((a, b) => a.anim.at - b.anim.at);
  const effects = sorted
    .map(({ id, anim }, i) => {
      const preset = presetOf(anim, id);
      return `<anim:par smil:begin="${secs(anim.at)}" smil:fill="hold" presentation:node-type="${i === 0 ? "after-previous" : "with-previous"}" presentation:preset-id="${preset.id}" presentation:preset-class="entrance"><anim:set smil:begin="0s" smil:dur="0.001s" smil:fill="hold" smil:targetElement="${id}" smil:attributeName="visibility" smil:to="visible"/>${preset.xml}</anim:par>`;
    })
    .join("");
  return `<anim:par presentation:node-type="timing-root"><anim:seq presentation:node-type="main-sequence"><anim:par smil:begin="0s"><anim:par smil:begin="0s">${effects}</anim:par></anim:par></anim:seq></anim:par>`;
}

/** The .odp file of the laid-out slides. */
export function writeOdp(
  slides: SlideLayout[],
  images: DeckImages,
  meta: OdpMeta,
  animate = true,
): Uint8Array {
  const p = meta.palette;
  const styles = new Styles();
  const files: Zippable = {};
  const pictures = new Map<string, string>();
  let counter = 0;

  const paraXml = (para: Para, bg: string) => {
    const pStyle = styles.get(
      "P",
      "paragraph",
      `<style:paragraph-properties fo:text-align="${{ l: "start", c: "center", r: "end" }[para.align ?? "l"]}" fo:margin-top="0cm" fo:margin-bottom="${cm(para.after ?? 0)}" fo:line-height="100%"/>`,
    );
    const spans = para.runs
      .map((run) => {
        const colour =
          para.alpha !== undefined && para.alpha < 1
            ? blend(run.color ?? para.color, bg, para.alpha)
            : (run.color ?? para.color);
        const tStyle = styles.get(
          "T",
          "text",
          `<style:text-properties fo:font-family="Arial" style:font-family-generic="swiss" fo:font-size="${pt(run.size ?? para.size)}" fo:font-weight="${(run.bold ?? para.bold) ? "bold" : "normal"}" fo:color="${hex(colour)}"${para.spacing ? ` fo:letter-spacing="${cm(para.spacing)}"` : ""} ${language()}/>`,
        );
        return run.text
          .split("\n")
          .map(
            (part) =>
              `<text:span text:style-name="${tStyle}">${esc(part).replace(/ {2,}/g, (s) => ` <text:s text:c="${s.length - 1}"/>`)}</text:span>`,
          )
          .join("<text:line-break/>");
      })
      .join("");
    return `<text:p text:style-name="${pStyle}">${spans}</text:p>`;
  };

  const graphic = (shape: BoxShape) =>
    styles.get(
      "gr",
      "graphic",
      `<style:graphic-properties draw:stroke="${shape.line ? "solid" : "none"}"${shape.line ? ` svg:stroke-color="${hex(shape.line)}" svg:stroke-width="${cm(shape.lineW ?? 2)}"` : ""} draw:fill="${shape.fill ? "solid" : "none"}"${shape.fill ? ` draw:fill-color="${hex(shape.fill)}"` : ""}${shape.fill && shape.alpha !== undefined && shape.alpha < 1 ? ` draw:opacity="${Math.round(shape.alpha * 100)}%"` : ""} draw:textarea-vertical-align="${{ t: "top", m: "middle", b: "bottom" }[shape.valign ?? "t"]}" draw:textarea-horizontal-align="justify" draw:auto-grow-height="false" draw:auto-grow-width="false" fo:min-height="0cm" fo:padding-top="${cm(shape.pad ?? 0)}" fo:padding-bottom="${cm(shape.pad ?? 0)}" fo:padding-left="${cm(shape.pad ?? 0)}" fo:padding-right="${cm(shape.pad ?? 0)}" draw:shadow="hidden"${shape.soft ? ` loext:softedge-radius="${cm(shape.soft)}"` : ""}/>`,
    );

  const boxXml = (shape: BoxShape, id: string, bg: string) => {
    const style = graphic(shape);
    const text = (shape.paras ?? []).map((para) => paraXml(para, bg)).join("");
    const tag = shape.ellipse ? "draw:ellipse" : "draw:rect";
    const radius =
      !shape.ellipse && shape.radius
        ? ` draw:corner-radius="${cm(shape.radius)}"`
        : "";
    let place = `svg:x="${cm(shape.x)}" svg:y="${cm(shape.y)}"`;
    if (shape.rot) {
      // ODF turns counter-clockwise around the top left corner: move the
      // shape so that its centre stays in place.
      const a = (-shape.rot * Math.PI) / 180;
      const cx = shape.x + shape.w / 2;
      const cy = shape.y + shape.h / 2;
      const rx = (shape.w / 2) * Math.cos(a) + (shape.h / 2) * Math.sin(a);
      const ry = -(shape.w / 2) * Math.sin(a) + (shape.h / 2) * Math.cos(a);
      place = `draw:transform="rotate (${a.toFixed(5)}) translate (${cm(cx - rx)} ${cm(cy - ry)})"`;
    }
    return `<${tag} draw:style-name="${style}" draw:layer="layout" draw:name="${esc(shape.name)}" xml:id="${id}" draw:id="${id}" ${place} svg:width="${cm(shape.w)}" svg:height="${cm(shape.h)}"${radius}>${text}</${tag}>`;
  };

  const tableXml = (shape: TableShape, id: string) => {
    const parts: string[] = [];
    const headH = shape.size * 1.25 + 30;
    let y = shape.y;
    shape.rows.forEach((row, ri) => {
      const head = shape.header && ri === 0;
      const h = head ? headH : shape.rowH;
      let x = shape.x;
      row.forEach((c, ci) => {
        const w = shape.cols[ci];
        const cell: BoxShape = {
          type: "box",
          name: "Cellule",
          x,
          y,
          w,
          h,
          fill: head ? p.surface2 : ri % 2 ? p.surface : p.bg,
          alpha: head ? 1 : 0.9,
          valign: "m",
          pad: 14,
          paras: [
            {
              runs: [{ text: c.text, bold: c.bold || head, color: c.color }],
              size: head ? Math.max(16, shape.size - 4) : shape.size,
              color: c.color ?? p.text,
              align: c.align,
            },
          ],
        };
        parts.push(boxXml(cell, `${id}c${ri}_${ci}`, p.bg));
        x += w;
      });
      parts.push(
        boxXml(
          {
            type: "box",
            name: "Filet",
            x: shape.x,
            y: y + h - 1,
            w: x - shape.x,
            h: 2,
            fill: p.line,
          },
          `${id}l${ri}`,
          p.bg,
        ),
      );
      y += h;
    });
    return `<draw:g draw:name="${esc(shape.name)}" xml:id="${id}" draw:id="${id}">${parts.join("")}</draw:g>`;
  };

  const pages = slides.map((slide, index) => {
    const animated: { id: string; anim: Anim }[] = [];
    // ODF has no text transparency and soft edges are an extension that
    // PowerPoint ignores: the glows are left out and the watermark goes
    // behind everything, in a colour blended with the background.
    const turned = (s: Shape) => s.type === "box" && !!s.rot;
    const kept = slide.shapes.filter((s) => !(s.type === "box" && s.soft));
    const shapes = [...kept.filter(turned), ...kept.filter((s) => !turned(s))]
      .map((shape: Shape) => {
        const id = `s${++counter}`;
        if (animate && shape.anim) animated.push({ id, anim: shape.anim });
        if (shape.type === "image") {
          const image = images[shape.key];
          if (!image) {
            animated.pop();
            return "";
          }
          let file = pictures.get(shape.key);
          if (!file) {
            file = `Pictures/image${pictures.size + 1}.png`;
            pictures.set(shape.key, file);
            files[file] = [image.bytes, { level: 0 }];
          }
          const style = styles.get(
            "gr",
            "graphic",
            '<style:graphic-properties draw:stroke="none" draw:fill="none" draw:shadow="hidden"/>',
          );
          return `<draw:frame draw:style-name="${style}" draw:layer="layout" draw:name="${esc(shape.name)}" xml:id="${id}" draw:id="${id}" svg:x="${cm(shape.x)}" svg:y="${cm(shape.y)}" svg:width="${cm(shape.w)}" svg:height="${cm(shape.h)}"><draw:image xlink:href="${file}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"><text:p/></draw:image><svg:desc>${esc(shape.name)}</svg:desc></draw:frame>`;
        }
        if (shape.type === "table") return tableXml(shape, id);
        return boxXml(shape, id, slide.background);
      })
      .join("");
    const pageStyle = styles.get(
      "dp",
      "drawing-page",
      `<style:drawing-page-properties presentation:background-visible="true" presentation:background-objects-visible="true" presentation:display-footer="false" presentation:display-page-number="false" presentation:display-date-time="false" draw:fill="solid" draw:fill-color="${hex(slide.background)}"${animate ? ` presentation:transition-speed="medium" ${TRANSITIONS[slide.transition]}` : ""}/>`,
    );
    const notes = (slide.notes.trim() ? slide.notes.trim().split("\n") : [""])
      .map((line) => `<text:p>${esc(line)}</text:p>`)
      .join("");
    return `<draw:page draw:name="${esc(`page${index + 1}`)}" draw:style-name="${pageStyle}" draw:master-page-name="Default" presentation:presentation-page-layout-name="AL0T0">${shapes}${animate ? animations(animated) : ""}<presentation:notes><draw:page-thumbnail draw:layer="layout" svg:width="17cm" svg:height="9.563cm" svg:x="2cm" svg:y="2cm" draw:page-number="${index + 1}" presentation:class="page"/><draw:frame draw:layer="layout" svg:width="17cm" svg:height="14cm" svg:x="2cm" svg:y="13cm" presentation:class="notes"><draw:text-box>${notes}</draw:text-box></draw:frame></presentation:notes></draw:page>`;
  });

  const content = `${HEAD}<office:document-content ${NS} office:version="1.3"><office:automatic-styles>${styles.xml.join("")}</office:automatic-styles><office:body><office:presentation>${pages.join("")}<presentation:settings presentation:mouse-visible="true"/></office:presentation></office:body></office:document-content>`;

  const stylesXml = `${HEAD}<office:document-styles ${NS} office:version="1.3"><office:styles><style:default-style style:family="graphic"><style:graphic-properties draw:shadow="hidden"/><style:paragraph-properties fo:line-height="100%"/><style:text-properties fo:font-family="Arial" style:font-family-generic="swiss" fo:font-size="18pt"${language()}/></style:default-style><style:presentation-page-layout style:name="AL0T0"/></office:styles><office:automatic-styles><style:page-layout style:name="PM1"><style:page-layout-properties fo:margin-top="0cm" fo:margin-bottom="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:page-width="${PAGE_CM}cm" fo:page-height="${cm(PAGE_H)}" style:print-orientation="landscape"/></style:page-layout><style:page-layout style:name="PM2"><style:page-layout-properties fo:margin-top="0cm" fo:margin-bottom="0cm" fo:margin-left="0cm" fo:margin-right="0cm" fo:page-width="21cm" fo:page-height="29.7cm" style:print-orientation="portrait"/></style:page-layout><style:style style:name="Mdp1" style:family="drawing-page"><style:drawing-page-properties draw:fill="solid" draw:fill-color="${hex(p.bg)}" draw:background-size="full"/></style:style></office:automatic-styles><office:master-styles><style:master-page style:name="Default" style:page-layout-name="PM1" draw:style-name="Mdp1"><presentation:notes style:page-layout-name="PM2"><draw:page-thumbnail svg:width="17cm" svg:height="9.563cm" svg:x="2cm" svg:y="2cm" presentation:class="page"/><draw:frame svg:width="17cm" svg:height="14cm" svg:x="2cm" svg:y="13cm" presentation:class="notes" presentation:placeholder="true"><draw:text-box/></draw:frame></presentation:notes></style:master-page></office:master-styles></office:document-styles>`;

  const created = (meta.created ?? new Date())
    .toISOString()
    .replace(/\.\d{3}Z$/, "");
  const metaXml = `${HEAD}<office:document-meta ${NS} office:version="1.3"><office:meta><meta:generator>orion aic</meta:generator><dc:title>${esc(meta.title)}</dc:title><meta:initial-creator>${esc(meta.author)}</meta:initial-creator><dc:creator>${esc(meta.author)}</dc:creator><meta:creation-date>${created}</meta:creation-date><dc:date>${created}</dc:date><dc:language>${locale()}</dc:language></office:meta></office:document-meta>`;

  const manifest = `${HEAD}<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="application/vnd.oasis.opendocument.presentation"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>${[
    ...pictures.values(),
  ]
    .map(
      (f) =>
        `<manifest:file-entry manifest:full-path="${f}" manifest:media-type="image/png"/>`,
    )
    .join("")}</manifest:manifest>`;

  // The mimetype comes first and uncompressed (ODF packaging).
  const zip: Zippable = {
    mimetype: [
      strToU8("application/vnd.oasis.opendocument.presentation"),
      { level: 0 },
    ],
    "content.xml": strToU8(content),
    "styles.xml": strToU8(stylesXml),
    "meta.xml": strToU8(metaXml),
    ...files,
    "META-INF/manifest.xml": strToU8(manifest),
  };
  return zipSync(zip, { level: 6 });
}
