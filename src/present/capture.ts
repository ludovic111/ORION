import type { InkStroke } from "./layout";
import { drawStrokes } from "./Ink";

// Picture of a slide as shown on screen, with its annotations: the slide
// is copied with its computed styles into an SVG foreignObject, drawn on a
// canvas, then the strokes on top. Used for "Enregistrer les annotations".

const W = 1920;
const H = 1080;

async function dataUrl(src: string) {
  if (src.startsWith("data:")) return src;
  try {
    const blob = await (await fetch(src)).blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(src);
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

/** Copy of a node with every computed style written inline. */
async function inlined(node: HTMLElement) {
  const copy = node.cloneNode(true) as HTMLElement;
  const from = [node, ...node.querySelectorAll<HTMLElement>("*")];
  const to = [copy, ...copy.querySelectorAll<HTMLElement>("*")];
  from.forEach((el, i) => {
    const target = to[i];
    const style = getComputedStyle(el);
    let css = "";
    for (let k = 0; k < style.length; k++) {
      const name = style[k];
      css += `${name}:${style.getPropertyValue(name)};`;
    }
    target.setAttribute("style", `${css}animation:none;transition:none;`);
  });
  await Promise.all(
    to
      .filter((el): el is HTMLImageElement => el instanceof HTMLImageElement)
      .map(async (img) => img.setAttribute("src", await dataUrl(img.src))),
  );
  return copy;
}

/** The slide node (1920 × 1080) and its strokes, as a canvas. */
export async function captureSlide(
  node: HTMLElement,
  strokes: InkStroke[],
  background: string,
) {
  const blank = () => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);
    return { canvas, ctx };
  };
  let page = blank();
  try {
    const copy = await inlined(node);
    copy.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    const xml = new XMLSerializer().serializeToString(copy);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">${xml}</foreignObject></svg>`;
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    page.ctx.drawImage(img, 0, 0, W, H);
    // Some browsers taint the canvas with a foreignObject: start again.
    page.ctx.getImageData(0, 0, 1, 1);
  } catch {
    // The strokes alone are still worth keeping.
    page = blank();
  }
  drawStrokes(page.ctx, strokes);
  return page.canvas;
}

/** PDF of annotated slides, one landscape page each. */
export async function annotationsPdf(
  pages: HTMLCanvasElement[],
  title: string,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [960, 540],
  });
  doc.setProperties({ title, creator: "orion aic" });
  pages.forEach((canvas, i) => {
    if (i) doc.addPage([960, 540], "landscape");
    doc.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 960, 540);
  });
  return doc.output("blob");
}
