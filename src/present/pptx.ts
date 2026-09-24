import { strToU8, zipSync, type Zippable } from "fflate";
import { esc, hexColor } from "./text.ts";
import {
  PAGE_W,
  type Anim,
  type BoxShape,
  type DeckImages,
  type ImageShape,
  type Para,
  type Palette,
  type Shape,
  type SlideLayout,
  type TableShape,
} from "./layout.ts";

// PowerPoint (.pptx, ECMA-376 / ISO 29500 transitional) written by hand:
// one master, one blank layout, a notes master, one slide per layout with
// its speaker notes, fade/push transitions and entrance animations that play
// by themselves ("after previous", staggered). PowerPoint is strict: every
// element below follows the schema order (p:sld: cSld, clrMapOvr,
// transition, timing; spPr: xfrm, geometry, fill, ln, effects…).

export type PptxMeta = {
  title: string;
  author: string;
  subject?: string;
  created?: Date;
  palette: Palette;
};

const EMU = 12192000 / PAGE_W; // 6350 per px of the 1920 × 1080 page
const emu = (px: number) => Math.round(px * EMU);
/** Font size in hundredths of a point (1 px = 0.5 pt). */
const hpt = (px: number) => Math.max(100, Math.round(px * 50));
const NS =
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const REL =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const FONT = "Arial";

const color = (hex: string, alpha?: number) =>
  `<a:srgbClr val="${hexColor(hex, "808080")}">${
    alpha !== undefined && alpha < 1
      ? `<a:alpha val="${Math.round(Math.max(0, alpha) * 100000)}"/>`
      : ""
  }</a:srgbClr>`;
const solid = (hex: string, alpha?: number) =>
  `<a:solidFill>${color(hex, alpha)}</a:solidFill>`;

function rels(list: { id: string; type: string; target: string }[]) {
  return `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list
    .map(
      (r) =>
        `<Relationship Id="${r.id}" Type="${REL}/${r.type}" Target="${esc(r.target)}"/>`,
    )
    .join("")}</Relationships>`;
}

// ---------- Text ----------

function runProps(
  p: Para,
  run: { bold?: boolean; color?: string; size?: number },
  tag = "a:rPr",
) {
  const size = run.size ?? p.size;
  const bold = run.bold ?? p.bold;
  const spc = p.spacing ? ` spc="${Math.round(p.spacing * 50)}"` : "";
  return `<${tag} lang="fr-CH" sz="${hpt(size)}"${bold ? ' b="1"' : ""}${spc} dirty="0">${solid(run.color ?? p.color, p.alpha)}<a:latin typeface="${FONT}"/><a:cs typeface="${FONT}"/></${tag}>`;
}

function paragraph(p: Para) {
  const align = { l: "l", c: "ctr", r: "r" }[p.align ?? "l"];
  const pPr = `<a:pPr algn="${align}"><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="${Math.round((p.after ?? 0) * 50)}"/></a:spcAft><a:buNone/></a:pPr>`;
  const runs = p.runs
    .map((run) =>
      run.text
        .split("\n")
        .map((part) => `<a:r>${runProps(p, run)}<a:t>${esc(part)}</a:t></a:r>`)
        .join(`<a:br>${runProps(p, run)}</a:br>`),
    )
    .join("");
  return `<a:p>${pPr}${runs}${runProps(p, {}, "a:endParaRPr")}</a:p>`;
}

function textBody(shape: BoxShape) {
  const pad = emu(shape.pad ?? 0);
  const anchor = { t: "t", m: "ctr", b: "b" }[shape.valign ?? "t"];
  const paras = shape.paras?.length
    ? shape.paras.map(paragraph).join("")
    : '<a:p><a:endParaRPr lang="fr-CH" dirty="0"/></a:p>';
  return `<p:txBody><a:bodyPr wrap="square" lIns="${pad}" tIns="${pad}" rIns="${pad}" bIns="${pad}" anchor="${anchor}" rtlCol="0"><a:noAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody>`;
}

// ---------- Shapes ----------

const xfrm = (s: Shape, rot = 0) =>
  `<a:xfrm${rot ? ` rot="${Math.round((((rot % 360) + 360) % 360) * 60000)}"` : ""}><a:off x="${emu(s.x)}" y="${emu(s.y)}"/><a:ext cx="${Math.max(1, emu(s.w))}" cy="${Math.max(1, emu(s.h))}"/></a:xfrm>`;

function geometry(shape: BoxShape) {
  if (shape.ellipse)
    return '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>';
  if (shape.radius) {
    const adj = Math.min(
      50000,
      Math.round((shape.radius / Math.min(shape.w, shape.h)) * 100000),
    );
    return `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${adj}"/></a:avLst></a:prstGeom>`;
  }
  return '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
}

function box(shape: BoxShape, id: number) {
  const fill = shape.fill ? solid(shape.fill, shape.alpha) : "<a:noFill/>";
  const line = shape.line
    ? `<a:ln w="${emu(shape.lineW ?? 2)}">${solid(shape.line)}</a:ln>`
    : "<a:ln><a:noFill/></a:ln>";
  const effects = shape.soft
    ? `<a:effectLst><a:softEdge rad="${emu(shape.soft)}"/></a:effectLst>`
    : "";
  const text = shape.paras?.length ? textBody(shape) : "";
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${esc(shape.name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(shape, shape.rot)}${geometry(shape)}${fill}${line}${effects}</p:spPr>${text}</p:sp>`;
}

function picture(
  shape: ImageShape,
  id: number,
  rel: string,
  size: { width: number; height: number },
) {
  // Cover the box: crop the picture evenly when the proportions differ.
  const boxRatio = shape.w / shape.h;
  const ratio = size.width / size.height;
  let crop = "";
  if (Math.abs(ratio - boxRatio) > 0.01) {
    if (ratio > boxRatio) {
      const cut = Math.round(((1 - boxRatio / ratio) / 2) * 100000);
      crop = `<a:srcRect l="${cut}" r="${cut}"/>`;
    } else {
      const cut = Math.round(((1 - ratio / boxRatio) / 2) * 100000);
      crop = `<a:srcRect t="${cut}" b="${cut}"/>`;
    }
  }
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${esc(shape.name)}" descr="${esc(shape.name)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rel}"/>${crop}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrm(shape)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

function table(shape: TableShape, id: number, p: Palette) {
  const pad = emu(16);
  const rowH = emu(shape.rowH);
  const headH = emu(shape.size * 1.25 + 30);
  const widths = shape.cols.map(emu);
  const total = widths.reduce((a, b) => a + b, 0);
  const edge = (tag: string, hex?: string) =>
    hex
      ? `<a:${tag} w="12700" cap="flat" cmpd="sng" algn="ctr">${solid(hex)}<a:prstDash val="solid"/></a:${tag}>`
      : `<a:${tag} w="12700"><a:noFill/></a:${tag}>`;
  const rows = shape.rows
    .map((row, ri) => {
      const head = shape.header && ri === 0;
      const fill = head ? p.surface2 : ri % 2 ? p.surface : p.bg;
      const cells = row
        .map((c) => {
          const para: Para = {
            runs: [{ text: c.text, bold: c.bold || head, color: c.color }],
            size: head ? Math.max(16, shape.size - 4) : shape.size,
            color: c.color ?? p.text,
            align: c.align,
          };
          return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${paragraph(para)}</a:txBody><a:tcPr marL="${pad}" marR="${pad}" marT="${emu(8)}" marB="${emu(8)}" anchor="ctr">${edge("lnL")}${edge("lnR")}${edge("lnT")}${edge("lnB", p.line)}${solid(fill, head ? 1 : 0.9)}</a:tcPr></a:tc>`;
        })
        .join("");
      return `<a:tr h="${head ? headH : rowH}">${cells}</a:tr>`;
    })
    .join("");
  const height = headH + rowH * Math.max(0, shape.rows.length - 1);
  return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="${esc(shape.name)}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${emu(shape.x)}" y="${emu(shape.y)}"/><a:ext cx="${total}" cy="${height}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>${widths
    .map((w) => `<a:gridCol w="${w}"/>`)
    .join(
      "",
    )}</a:tblGrid>${rows}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
}

// ---------- Animations ----------

/** Entrance behaviours of one shape (after the visibility switch). */
function behaviours(anim: Anim, spid: number, next: () => number) {
  const target = `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>`;
  const fade = (dur: number) =>
    `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${next()}" dur="${dur}"/>${target}</p:cBhvr></p:animEffect>`;
  const move = (
    attr: string,
    from: string,
    to: string,
    dur: number,
    fromNumber = false,
  ) =>
    `<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${next()}" dur="${dur}" fill="hold"/>${target}<p:attrNameLst><p:attrName>${attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val>${fromNumber ? `<p:fltVal val="${from}"/>` : `<p:strVal val="${from}"/>`}</p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${to}"/></p:val></p:tav></p:tavLst></p:anim>`;
  switch (anim.effect) {
    case "rise":
      return {
        preset: 'presetID="42" presetClass="entr" presetSubtype="0"',
        xml:
          fade(anim.dur) +
          move("ppt_x", "#ppt_x", "#ppt_x", anim.dur) +
          move("ppt_y", "#ppt_y+.04", "#ppt_y", anim.dur),
      };
    case "zoom":
      return {
        preset: 'presetID="53" presetClass="entr" presetSubtype="16"',
        xml:
          move("ppt_w", "0", "#ppt_w", anim.dur, true) +
          move("ppt_h", "0", "#ppt_h", anim.dur, true) +
          fade(anim.dur),
      };
    case "wipe":
      return {
        preset: 'presetID="22" presetClass="entr" presetSubtype="8"',
        xml: `<p:animEffect transition="in" filter="wipe(left)"><p:cBhvr><p:cTn id="${next()}" dur="${anim.dur}"/>${target}</p:cBhvr></p:animEffect>`,
      };
    default:
      return {
        preset: 'presetID="10" presetClass="entr" presetSubtype="0"',
        xml: fade(anim.dur),
      };
  }
}

type Animated = { spid: number; anim: Anim; drift: boolean; text: boolean };

/**
 * Main sequence starting with the slide: the first effect "after previous",
 * the others "with previous" with their own delay, so the slide builds by
 * itself without any click.
 */
function timing(list: Animated[]) {
  if (!list.length) return "";
  let id = 4;
  const next = () => ++id;
  const sorted = [...list].sort((a, b) => a.anim.at - b.anim.at);
  const effects = sorted
    .map((item, i) => {
      const par = next();
      const { preset, xml } = behaviours(item.anim, item.spid, next);
      const set = `<p:set><p:cBhvr><p:cTn id="${next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${item.spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`;
      // Re-ordered so the visibility switch comes first.
      const entrance = `<p:par><p:cTn id="${par}" ${preset} fill="hold" grpId="0" nodeType="${i === 0 ? "afterEffect" : "withEffect"}"><p:stCondLst><p:cond delay="${Math.round(item.anim.at)}"/></p:stCondLst><p:childTnLst>${set}${xml}</p:childTnLst></p:cTn></p:par>`;
      if (!item.drift) return entrance;
      const drift = `<p:par><p:cTn id="${next()}" presetID="6" presetClass="emph" presetSubtype="0" fill="hold" grpId="0" nodeType="withEffect"><p:stCondLst><p:cond delay="${Math.round(item.anim.at)}"/></p:stCondLst><p:childTnLst><p:animScale><p:cBhvr><p:cTn id="${next()}" dur="40000" fill="hold"/><p:tgtEl><p:spTgt spid="${item.spid}"/></p:tgtEl></p:cBhvr><p:by x="108000" y="108000"/></p:animScale></p:childTnLst></p:cTn></p:par>`;
      return entrance + drift;
    })
    .join("");
  const builds = sorted
    .filter((i) => i.text)
    .map((i) => `<p:bldP spid="${i.spid}" grpId="0" animBg="1"/>`)
    .join("");
  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst><p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst><p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${effects}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>${builds ? `<p:bldLst>${builds}</p:bldLst>` : ""}</p:timing>`;
}

// ---------- Fixed parts ----------

const GROUP =
  '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
const CLR_MAP =
  'bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"';
const level = (size: number) =>
  `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="${size}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`;

function theme(name: string, p: Palette) {
  const c = (tag: string, hex: string) =>
    `<a:${tag}><a:srgbClr val="${hex}"/></a:${tag}>`;
  const fills = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(
    3,
  );
  const lines = [6350, 12700, 19050]
    .map(
      (w) =>
        `<a:ln w="${w}" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>`,
    )
    .join("");
  const font = (tag: string) =>
    `<a:${tag}><a:latin typeface="${FONT}"/><a:ea typeface=""/><a:cs typeface=""/></a:${tag}>`;
  return `${HEAD}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${esc(name)}"><a:themeElements><a:clrScheme name="orion aic">${c("dk1", "0F1127")}${c("lt1", "FFFFFF")}${c("dk2", "070914")}${c("lt2", "ECEEFE")}${c("accent1", p.accent)}${c("accent2", p.cyan)}${c("accent3", p.pink)}${c("accent4", p.amber)}${c("accent5", p.ok)}${c("accent6", p.crit)}${c("hlink", p.cyan)}${c("folHlink", p.accent)}</a:clrScheme><a:fontScheme name="orion aic">${font("majorFont")}${font("minorFont")}</a:fontScheme><a:fmtScheme name="orion aic"><a:fillStyleLst>${fills}</a:fillStyleLst><a:lnStyleLst>${lines}</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst>${fills}</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
}

function master(p: Palette) {
  return `${HEAD}<p:sldMaster ${NS}><p:cSld><p:bg><p:bgPr>${solid(p.bg)}<a:effectLst/></p:bgPr></p:bg><p:spTree>${GROUP}</p:spTree></p:cSld><p:clrMap ${CLR_MAP}/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${level(4400)}</p:titleStyle><p:bodyStyle>${level(2800)}</p:bodyStyle><p:otherStyle>${level(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`;
}

const LAYOUT = `${HEAD}<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Vide"><p:spTree>${GROUP}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

const NOTES_MASTER = `${HEAD}<p:notesMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${GROUP}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Image de la diapositive"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="1143000"/><a:ext cx="5486400" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="4400550"/><a:ext cx="5486400" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="fr-CH"/><a:t>Notes</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:clrMap ${CLR_MAP}/><p:notesStyle>${level(1200)}</p:notesStyle></p:notesMaster>`;

function notesSlide(text: string) {
  const paras = (text.trim() ? text.trim().split("\n") : [""])
    .map((line) =>
      line
        ? `<a:p><a:r><a:rPr lang="fr-CH" dirty="0"/><a:t>${esc(line)}</a:t></a:r></a:p>`
        : '<a:p><a:endParaRPr lang="fr-CH" dirty="0"/></a:p>',
    )
    .join("");
  return `${HEAD}<p:notes ${NS}><p:cSld><p:spTree>${GROUP}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Image de la diapositive"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${paras}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}

const w3c = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

// ---------- Package ----------

/** The .pptx file of the laid-out slides. */
export function writePptx(
  slides: SlideLayout[],
  images: DeckImages,
  meta: PptxMeta,
  animations = true,
): Uint8Array {
  const p = meta.palette;
  const files: Zippable = {};
  const put = (path: string, xml: string) => (files[path] = strToU8(xml));
  const media = new Map<string, string>();
  slides.forEach((slide, i) => {
    const n = i + 1;
    const slideRels = [
      {
        id: "rId1",
        type: "slideLayout",
        target: "../slideLayouts/slideLayout1.xml",
      },
      {
        id: "rId2",
        type: "notesSlide",
        target: `../notesSlides/notesSlide${n}.xml`,
      },
    ];
    const relOf = new Map<string, string>();
    let id = 1;
    const animated: Animated[] = [];
    const shapes = slide.shapes
      .map((shape) => {
        const spid = ++id;
        if (shape.type === "image") {
          const image = images[shape.key];
          if (!image) return "";
          if (!media.has(shape.key)) {
            const file = `image${media.size + 1}.png`;
            media.set(shape.key, file);
            files[`ppt/media/${file}`] = [image.bytes, { level: 0 }];
          }
          let rel = relOf.get(shape.key);
          if (!rel) {
            rel = `rId${slideRels.length + 1}`;
            relOf.set(shape.key, rel);
            slideRels.push({
              id: rel,
              type: "image",
              target: `../media/${media.get(shape.key)}`,
            });
          }
          if (animations && shape.anim)
            animated.push({
              spid,
              anim: shape.anim,
              drift: !!shape.drift,
              text: false,
            });
          return picture(shape, spid, rel, image);
        }
        if (animations && shape.anim)
          animated.push({
            spid,
            anim: shape.anim,
            drift: false,
            text: shape.type === "box",
          });
        return shape.type === "table"
          ? table(shape, spid, p)
          : box(shape, spid);
      })
      .join("");
    const transition = animations
      ? `<p:transition spd="med">${slide.transition === "push" ? '<p:push dir="u"/>' : "<p:fade/>"}</p:transition>`
      : "";
    put(
      `ppt/slides/slide${n}.xml`,
      `${HEAD}<p:sld ${NS}><p:cSld name="${esc(slide.title)}"><p:bg><p:bgPr>${solid(slide.background)}<a:effectLst/></p:bgPr></p:bg><p:spTree>${GROUP}${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${transition}${animations ? timing(animated) : ""}</p:sld>`,
    );
    put(`ppt/slides/_rels/slide${n}.xml.rels`, rels(slideRels));
    put(`ppt/notesSlides/notesSlide${n}.xml`, notesSlide(slide.notes));
    put(
      `ppt/notesSlides/_rels/notesSlide${n}.xml.rels`,
      rels([
        {
          id: "rId1",
          type: "notesMaster",
          target: "../notesMasters/notesMaster1.xml",
        },
        { id: "rId2", type: "slide", target: `../slides/slide${n}.xml` },
      ]),
    );
  });

  const ct = "application/vnd.openxmlformats-officedocument.presentationml";
  const overrides = [
    ["/ppt/presentation.xml", `${ct}.presentation.main+xml`],
    ["/ppt/slideMasters/slideMaster1.xml", `${ct}.slideMaster+xml`],
    ["/ppt/slideLayouts/slideLayout1.xml", `${ct}.slideLayout+xml`],
    ["/ppt/notesMasters/notesMaster1.xml", `${ct}.notesMaster+xml`],
    [
      "/ppt/theme/theme1.xml",
      "application/vnd.openxmlformats-officedocument.theme+xml",
    ],
    [
      "/ppt/theme/theme2.xml",
      "application/vnd.openxmlformats-officedocument.theme+xml",
    ],
    ["/ppt/presProps.xml", `${ct}.presProps+xml`],
    ["/ppt/viewProps.xml", `${ct}.viewProps+xml`],
    ["/ppt/tableStyles.xml", `${ct}.tableStyles+xml`],
    [
      "/docProps/core.xml",
      "application/vnd.openxmlformats-package.core-properties+xml",
    ],
    [
      "/docProps/app.xml",
      "application/vnd.openxmlformats-officedocument.extended-properties+xml",
    ],
    ...slides.flatMap((_, i) => [
      [`/ppt/slides/slide${i + 1}.xml`, `${ct}.slide+xml`],
      [`/ppt/notesSlides/notesSlide${i + 1}.xml`, `${ct}.notesSlide+xml`],
    ]),
  ];
  put(
    "[Content_Types].xml",
    `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>${overrides
      .map(
        ([part, type]) =>
          `<Override PartName="${part}" ContentType="${type}"/>`,
      )
      .join("")}</Types>`,
  );
  files["_rels/.rels"] = strToU8(
    `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${REL}/extended-properties" Target="docProps/app.xml"/></Relationships>`,
  );
  const created = w3c(meta.created ?? new Date());
  put(
    "docProps/core.xml",
    `${HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(meta.title)}</dc:title><dc:subject>${esc(meta.subject ?? "")}</dc:subject><dc:creator>${esc(meta.author)}</dc:creator><cp:lastModifiedBy>${esc(meta.author)}</cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified></cp:coreProperties>`,
  );
  put(
    "docProps/app.xml",
    `${HEAD}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><TotalTime>0</TotalTime><Words>0</Words><Application>orion aic</Application><PresentationFormat>Grand écran</PresentationFormat><Paragraphs>0</Paragraphs><Slides>${slides.length}</Slides><Notes>${slides.length}</Notes><HiddenSlides>0</HiddenSlides><MMClips>0</MMClips><ScaleCrop>false</ScaleCrop><Company>orion aic</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>`,
  );
  put(
    "ppt/_rels/presentation.xml.rels",
    rels([
      {
        id: "rId1",
        type: "slideMaster",
        target: "slideMasters/slideMaster1.xml",
      },
      {
        id: "rId2",
        type: "notesMaster",
        target: "notesMasters/notesMaster1.xml",
      },
      { id: "rId3", type: "presProps", target: "presProps.xml" },
      { id: "rId4", type: "viewProps", target: "viewProps.xml" },
      { id: "rId5", type: "theme", target: "theme/theme1.xml" },
      { id: "rId6", type: "tableStyles", target: "tableStyles.xml" },
      ...slides.map((_, i) => ({
        id: `rId${7 + i}`,
        type: "slide",
        target: `slides/slide${i + 1}.xml`,
      })),
    ]),
  );
  put(
    "ppt/presentation.xml",
    `${HEAD}<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst><p:sldIdLst>${slides
      .map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${7 + i}"/>`)
      .join(
        "",
      )}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${level(1800)}</p:defaultTextStyle></p:presentation>`,
  );
  put("ppt/presProps.xml", `${HEAD}<p:presentationPr ${NS}/>`);
  put(
    "ppt/viewProps.xml",
    `${HEAD}<p:viewPr ${NS}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`,
  );
  put(
    "ppt/tableStyles.xml",
    `${HEAD}<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`,
  );
  put("ppt/theme/theme1.xml", theme("orion aic", p));
  put("ppt/theme/theme2.xml", theme("orion aic notes", p));
  put("ppt/slideMasters/slideMaster1.xml", master(p));
  put(
    "ppt/slideMasters/_rels/slideMaster1.xml.rels",
    rels([
      {
        id: "rId1",
        type: "slideLayout",
        target: "../slideLayouts/slideLayout1.xml",
      },
      { id: "rId2", type: "theme", target: "../theme/theme1.xml" },
    ]),
  );
  put("ppt/slideLayouts/slideLayout1.xml", LAYOUT);
  put(
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
    rels([
      {
        id: "rId1",
        type: "slideMaster",
        target: "../slideMasters/slideMaster1.xml",
      },
    ]),
  );
  put("ppt/notesMasters/notesMaster1.xml", NOTES_MASTER);
  put(
    "ppt/notesMasters/_rels/notesMaster1.xml.rels",
    rels([{ id: "rId1", type: "theme", target: "../theme/theme2.xml" }]),
  );
  // [Content_Types].xml first, as Office writes it.
  const ordered: Zippable = {
    "[Content_Types].xml": files["[Content_Types].xml"],
  };
  for (const [k, v] of Object.entries(files))
    if (k !== "[Content_Types].xml") ordered[k] = v;
  return zipSync(ordered, { level: 6 });
}
