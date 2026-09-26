// Voice dictation: pure helpers around the Web Speech API. No DOM access at
// import time, so the node tests can load this file.

/** No-break space written before « : ; ? ! » (French typography). */
export const NBSP = " ";

type SpeechWindow = {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
};

/** The SpeechRecognition constructor of this browser, if any. */
export function recognitionClass(win: unknown): unknown {
  if (!win || typeof win !== "object") return undefined;
  const w = win as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** True where the browser offers speech recognition (Chrome, Edge, Safari). */
export function speechSupported(win: unknown): boolean {
  return typeof recognitionClass(win) === "function";
}

/**
 * Recognition language: Swiss French, unless the post reads French in
 * another variant only (then French of France, understood everywhere).
 */
export function pickLang(
  navigatorLanguages: readonly string[] | undefined | null,
): "fr-CH" | "fr-FR" {
  const langs = (navigatorLanguages ?? []).map((l) => l.toLowerCase());
  if (langs.includes("fr-ch")) return "fr-CH";
  if (langs.some((l) => l === "fr" || l.startsWith("fr-"))) return "fr-FR";
  return "fr-CH";
}

// Words after which « point » is the noun (« le point de situation »), not
// the command.
const NOUN_BEFORE = new Set([
  "le",
  "un",
  "au",
  "du",
  "ce",
  "cet",
  "à",
  "chaque",
  "mon",
  "ton",
  "son",
  "notre",
  "votre",
  "leur",
  "quel",
  "premier",
  "dernier",
  "second",
  "deuxième",
  "bon",
  "même",
  "tel",
  "quelque",
]);

type Piece =
  | { kind: "word"; text: string }
  | { kind: "mark"; text: string }
  | { kind: "break"; text: string };

const TIGHT = new Set([".", ","]);
const SPACED = new Set([":", ";", "?", "!"]);
const ENDS = new Set([".", "?", "!"]);

function capitalise(text: string): string {
  return text.replace(/^\p{Ll}/u, (c) => c.toUpperCase());
}

/**
 * Turns spoken commands into punctuation and line breaks:
 * « nouvelle ligne », « à la ligne », « nouveau paragraphe », « point »,
 * « virgule », « deux points », « point-virgule », « point d’interrogation »,
 * « point d’exclamation ». No space before « . , », a no-break space before
 * « : ; ? ! », a capital after the end of a sentence.
 */
export function applyVoiceCommands(text: string): string {
  const words = text
    .replace(/[’‘]/g, "'")
    .replace(/\b([dl])'\s+/gi, "$1'")
    .split(/\s+/)
    .filter(Boolean);
  const pieces: Piece[] = [];
  const low = (i: number) => (words[i] ?? "").toLowerCase();
  for (let i = 0; i < words.length; i++) {
    const w = low(i);
    const next = low(i + 1);
    const mark = (text: string, skip = 0) => {
      pieces.push({ kind: "mark", text });
      i += skip;
    };
    if (w === "nouveau" && next === "paragraphe") {
      pieces.push({ kind: "break", text: "\n\n" });
      i += 1;
    } else if (w === "nouvelle" && next === "ligne") {
      pieces.push({ kind: "break", text: "\n" });
      i += 1;
    } else if (w === "à" && next === "la" && low(i + 2) === "ligne") {
      pieces.push({ kind: "break", text: "\n" });
      i += 2;
    } else if (w === "point" && next === "d'interrogation") mark("?", 1);
    else if (w === "point" && next === "d'exclamation") mark("!", 1);
    else if (w === "point" && next === "virgule") mark(";", 1);
    else if (w === "point-virgule") mark(";");
    else if (w === "point" && next === "final") mark(".", 1);
    else if (w === "point" && !NOUN_BEFORE.has(low(i - 1))) mark(".");
    else if (w === "deux" && next === "points") mark(":", 1);
    else if (w === "deux-points") mark(":");
    else if (w === "virgule") mark(",");
    else pieces.push({ kind: "word", text: words[i] });
  }
  let out = "";
  let capital = false;
  let glue = false;
  const trimEnd = () => {
    out = out.replace(/[  ]+$/, "");
  };
  pieces.forEach((piece, index) => {
    if (piece.kind === "word") {
      if (out && !glue && !/\s$/.test(out)) out += " ";
      out += capital ? capitalise(piece.text) : piece.text;
      capital = false;
      glue = false;
      return;
    }
    trimEnd();
    if (piece.kind === "break") {
      out += piece.text;
      capital = true;
      return;
    }
    // « 3 virgule 5 » is a decimal number: 3,5.
    const following = pieces[index + 1];
    if (
      piece.text === "," &&
      /\d$/.test(out) &&
      following?.kind === "word" &&
      /^\d/.test(following.text)
    ) {
      out += ",";
      glue = true;
      return;
    }
    if (SPACED.has(piece.text) && out && !out.endsWith("\n")) out += NBSP;
    out += piece.text;
    if (ENDS.has(piece.text)) capital = true;
  });
  return out;
}

/**
 * Inserts dictated text in a field at the caret (replacing the selection),
 * with the spacing of the surrounding text and a capital at the start of a
 * sentence. Returns the new value and the caret after the insertion.
 */
export function insertAt(
  value: string,
  selectionStart: number | null | undefined,
  selectionEnd: number | null | undefined,
  addition: string,
  maxLength = Infinity,
): { value: string; caret: number } {
  const start = Math.min(
    Math.max(0, selectionStart ?? value.length),
    value.length,
  );
  const end = Math.min(Math.max(start, selectionEnd ?? start), value.length);
  let before = value.slice(0, start);
  const after = value.slice(end);
  let add = addition;
  if (!add) return { value, caret: start };
  const first = add[0];
  if (TIGHT.has(first) || first === "\n") {
    before = before.replace(/[  ]+$/, "");
  } else if (SPACED.has(first)) {
    before = before.replace(/[  ]+$/, "");
    if (before && !before.endsWith("\n")) add = NBSP + add;
  } else {
    const previous = before.replace(/[  ]+$/, "");
    if (!previous || /[.?!\n]$/.test(previous)) add = capitalise(add);
    if (before && !/\s$/.test(before)) add = " " + add;
  }
  if (after && /^[\p{L}\p{N}]/u.test(after) && !/\s$/.test(add)) add += " ";
  const room = Math.max(0, maxLength - before.length - after.length);
  if (add.length > room) add = add.slice(0, room);
  return { value: before + add + after, caret: before.length + add.length };
}
