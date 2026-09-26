import { esc, hexColor } from "./text.ts";
import { locale } from "../../shared/i18n/core.ts";
import { t } from "./i18n.ts";
import {
  PAGE_H,
  PAGE_W,
  type BoxShape,
  type DeckImages,
  type ImageShape,
  type Para,
  type Palette,
  type SlideLayout,
  type TableShape,
} from "./layout.ts";

// Standalone HTML slides: one self-contained file (pictures inlined), CSS
// entrance animations, keyboard, click and swipe navigation, full screen.
// Opens in any browser, offline, without orion aic.

export type HtmlMeta = { title: string; author: string; palette: Palette };

function base64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
const rgba = (value: string, alpha = 1) => {
  const hex = hexColor(value, "808080");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `#${hex}`;
};
const px = (n: number) => `${Math.round(n * 10) / 10}px`;

function anim(
  shape: { anim?: { at: number; effect: string; dur: number } },
  extra = "",
) {
  if (!shape.anim)
    return { cls: "", style: extra ? `animation:${extra};` : "" };
  const a = shape.anim;
  const main = `e-${a.effect} ${a.dur}ms cubic-bezier(.22,1,.36,1) ${a.at}ms both`;
  return { cls: " a", style: `--a:${main}${extra ? `,${extra}` : ""};` };
}

function paraHtml(p: Para) {
  const style = [
    `font-size:${px(p.size)}`,
    `color:${rgba(p.color, p.alpha)}`,
    p.bold ? "font-weight:700" : "",
    p.align && p.align !== "l"
      ? `text-align:${p.align === "c" ? "center" : "right"}`
      : "",
    p.spacing ? `letter-spacing:${px(p.spacing)}` : "",
    p.after ? `margin-bottom:${px(p.after)}` : "",
  ]
    .filter(Boolean)
    .join(";");
  const runs = p.runs
    .map((r) => {
      const s = [
        r.size ? `font-size:${px(r.size)}` : "",
        r.color ? `color:${rgba(r.color, p.alpha)}` : "",
        r.bold !== undefined ? `font-weight:${r.bold ? 700 : 400}` : "",
      ]
        .filter(Boolean)
        .join(";");
      const text = esc(r.text).replace(/\n/g, "<br>");
      return s ? `<span style="${s}">${text}</span>` : text;
    })
    .join("");
  return `<p style="${style}">${runs}</p>`;
}

function boxHtml(s: BoxShape) {
  const a = anim(s);
  const radius = s.ellipse ? "50%" : s.radius ? px(s.radius) : "0";
  const style = [
    `left:${px(s.x)};top:${px(s.y)};width:${px(s.w)};height:${px(s.h)}`,
    s.fill ? `background:${rgba(s.fill, s.alpha)}` : "",
    s.line ? `border:${px(s.lineW ?? 2)} solid ${rgba(s.line)}` : "",
    `border-radius:${radius}`,
    s.soft ? `filter:blur(${px(s.soft / 2)})` : "",
    s.rot ? `rotate:${s.rot}deg` : "",
    s.pad ? `padding:${px(s.pad)}` : "",
    `justify-content:${{ t: "flex-start", m: "center", b: "flex-end" }[s.valign ?? "t"]}`,
    a.style,
  ]
    .filter(Boolean)
    .join(";");
  return `<div class="s${a.cls}" style="${style}">${(s.paras ?? []).map(paraHtml).join("")}</div>`;
}

function imageHtml(s: ImageShape, src: string) {
  const a = anim(s);
  const drift = s.drift ? " drift" : "";
  return `<div class="s img${a.cls}" style="left:${px(s.x)};top:${px(s.y)};width:${px(s.w)};height:${px(s.h)};${a.style}"><img class="${drift.trim()}" src="${src}" alt="${esc(s.name)}"></div>`;
}

function tableHtml(s: TableShape, p: Palette) {
  const a = anim(s);
  const head = s.size * 1.25 + 30;
  const rows = s.rows
    .map((row, ri) => {
      const isHead = s.header && ri === 0;
      const bg = isHead ? p.surface2 : ri % 2 ? p.surface : p.bg;
      return `<tr style="height:${px(isHead ? head : s.rowH)};background:${rgba(bg, isHead ? 1 : 0.9)}">${row
        .map(
          (c, ci) =>
            `<td style="width:${px(s.cols[ci])};font-size:${px(isHead ? Math.max(16, s.size - 4) : s.size)};color:${rgba(c.color ?? p.text)};${c.bold || isHead ? "font-weight:700;" : ""}${c.align && c.align !== "l" ? `text-align:${c.align === "c" ? "center" : "right"};` : ""}">${esc(c.text)}</td>`,
        )
        .join("")}</tr>`;
    })
    .join("");
  return `<table class="s${a.cls}" style="left:${px(s.x)};top:${px(s.y)};width:${px(s.w)};border-color:${rgba(p.line)};${a.style}">${rows}</table>`;
}

/** The standalone HTML file of the laid-out slides. */
export function writeHtml(
  slides: SlideLayout[],
  images: DeckImages,
  meta: HtmlMeta,
): string {
  const p = meta.palette;
  const sources = new Map<string, string>();
  const src = (key: string) => {
    let s = sources.get(key);
    if (!s) {
      s = `data:image/png;base64,${base64(images[key].bytes)}`;
      sources.set(key, s);
    }
    return s;
  };
  const sections = slides
    .map((slide, i) => {
      const shapes = slide.shapes
        .map((s) => {
          if (s.type === "image")
            return images[s.key] ? imageHtml(s, src(s.key)) : "";
          if (s.type === "table") return tableHtml(s, p);
          return boxHtml(s);
        })
        .join("");
      return `<section class="slide t-${slide.transition}" data-i="${i}" style="background:${rgba(slide.background)}" aria-label="${esc(slide.title)}">${shapes}<aside class="notes">${esc(slide.notes)}</aside></section>`;
    })
    .join("");
  return `<!doctype html>
<html lang="${locale()}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="generator" content="orion aic">
<meta name="author" content="${esc(meta.author)}">
<title>${esc(meta.title)}</title>
<style>
*{box-sizing:border-box;margin:0}
html,body{height:100%;background:#000;overflow:hidden;font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
#deck{position:fixed;inset:0;display:grid;place-items:center}
.stage{position:relative;width:${PAGE_W}px;height:${PAGE_H}px;transform-origin:center;flex:none}
.slide{position:absolute;inset:0;overflow:hidden;opacity:0;visibility:hidden;transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1),visibility 0s .6s}
.slide.t-push{transform:translateY(40px)}
.slide.on{opacity:1;visibility:visible;transform:none;transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}
.s{position:absolute;display:flex;flex-direction:column;overflow:hidden;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
.s p{margin:0}
.img img{width:100%;height:100%;object-fit:cover;display:block}
table.s{display:table;border-collapse:collapse;table-layout:fixed}
table.s td{padding:4px 16px;border-bottom:1px solid;border-color:inherit;vertical-align:middle;line-height:1.2;overflow:hidden}
.slide:not(.on) .a{opacity:0}
.slide.on .a{animation:var(--a)}
.slide.on img.drift{animation:drift 40s linear .3s both}
@keyframes e-fade{from{opacity:0}}
@keyframes e-rise{from{opacity:0;translate:0 40px}}
@keyframes e-zoom{from{opacity:0;scale:.6}}
@keyframes e-wipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes drift{to{scale:1.08}}
.notes{display:none}
body.notes-on .slide.on .notes{display:block;position:absolute;left:0;right:0;bottom:0;max-height:40%;overflow:auto;padding:24px 96px;background:rgba(0,0,0,.85);color:#fff;font-size:26px;white-space:pre-wrap;z-index:5}
#bar{position:fixed;left:0;bottom:0;height:4px;background:linear-gradient(90deg,#3fdcff,#8b7bff,#ff72c8);transition:width .4s cubic-bezier(.22,1,.36,1);z-index:9}
#help{position:fixed;right:16px;bottom:14px;color:rgba(255,255,255,.55);font-size:13px;z-index:9;transition:opacity .4s}
body.idle #help{opacity:0}
@media (prefers-reduced-motion:reduce){*,.slide{animation:none!important;transition:none!important}.slide:not(.on) .a{opacity:0}}
</style>
</head>
<body>
<div id="deck"><div class="stage">${sections}</div></div>
<div id="bar"></div>
<div id="help">${esc(t("← → naviguer · F plein écran · N notes"))}</div>
<script>
(function(){
var slides=[].slice.call(document.querySelectorAll(".slide"));
var stage=document.querySelector(".stage"),bar=document.getElementById("bar"),i=0;
function fit(){var s=Math.min(innerWidth/${PAGE_W},innerHeight/${PAGE_H});stage.style.transform="scale("+s+")";}
function show(n){i=Math.max(0,Math.min(slides.length-1,n));slides.forEach(function(s,k){s.classList.toggle("on",k===i);});bar.style.width=((i+1)/slides.length*100)+"%";history.replaceState(null,"","#"+(i+1));}
addEventListener("resize",fit);fit();
addEventListener("keydown",function(e){var k=e.key;
if(k==="ArrowRight"||k===" "||k==="PageDown"||k==="Enter")show(i+1);
else if(k==="ArrowLeft"||k==="PageUp"||k==="Backspace")show(i-1);
else if(k==="Home")show(0);else if(k==="End")show(slides.length-1);
else if(k==="f"||k==="F"){if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();}
else if(k==="n"||k==="N")document.body.classList.toggle("notes-on");else return;e.preventDefault();});
addEventListener("click",function(e){show(e.clientX<innerWidth/3?i-1:i+1);});
var x0=null;addEventListener("touchstart",function(e){x0=e.touches[0].clientX;},{passive:true});
addEventListener("touchend",function(e){if(x0===null)return;var d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>50)show(d<0?i+1:i-1);x0=null;});
var t;addEventListener("mousemove",function(){document.body.classList.remove("idle");clearTimeout(t);t=setTimeout(function(){document.body.classList.add("idle");},2500);});
show((parseInt(location.hash.slice(1),10)||1)-1);
})();
</script>
</body>
</html>`;
}
