// Voice dictation: pure helpers around the Web Speech API. No DOM access at
// import time, so the node tests can load this file.

import { getLang, type Lang } from "../../shared/i18n/core.ts";

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

/** Swiss variant and widely available fallback of each language. */
const SPEECH: Record<Lang, { swiss: string; fallback: string }> = {
  fr: { swiss: "fr-CH", fallback: "fr-FR" },
  de: { swiss: "de-CH", fallback: "de-DE" },
  it: { swiss: "it-CH", fallback: "it-IT" },
};

/**
 * Recognition language: the language of the post in its Swiss variant,
 * unless the browser reads that language in another variant only (then
 * fr-FR, de-DE or it-IT, understood everywhere).
 */
export function pickLang(
  navigatorLanguages: readonly string[] | undefined | null,
  lang: Lang = getLang(),
): string {
  const { swiss, fallback } = SPEECH[lang];
  const langs = (navigatorLanguages ?? []).map((l) => l.toLowerCase());
  if (langs.includes(swiss.toLowerCase())) return swiss;
  if (langs.some((l) => l === lang || l.startsWith(`${lang}-`)))
    return fallback;
  return swiss;
}

/** Variant tried when the browser lacks the Swiss one (fr-FR, de-DE, it-IT). */
export function fallbackLang(lang: Lang = getLang()): string {
  return SPEECH[lang].fallback;
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

// German: words after which « Punkt » is the noun (« der Punkt »).
const NOUN_BEFORE_DE = new Set([
  "der",
  "den",
  "dem",
  "des",
  "ein",
  "einen",
  "einem",
  "eines",
  "jeder",
  "jeden",
  "jedem",
  "dieser",
  "diesen",
  "diesem",
  "am",
  "zum",
  "beim",
  "vom",
  "im",
  "erster",
  "ersten",
  "letzter",
  "letzten",
  "wichtiger",
  "wichtigen",
]);

// Italian: words after which « punto » is the noun (« il punto della
// situazione »).
const NOUN_BEFORE_IT = new Set([
  "il",
  "lo",
  "un",
  "uno",
  "al",
  "del",
  "dal",
  "nel",
  "sul",
  "col",
  "quel",
  "questo",
  "ogni",
  "primo",
  "secondo",
  "ultimo",
  "stesso",
  "buon",
  "tale",
  "qualche",
  "mio",
  "tuo",
  "suo",
  "nostro",
  "vostro",
  "loro",
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

/** A spoken command at words[i]: the piece it gives and the words it uses. */
type Command = { piece: Piece; used: number } | null;
const mark = (text: string, used = 1): Command => ({
  piece: { kind: "mark", text },
  used,
});
const lineBreak = (text: string, used: number): Command => ({
  piece: { kind: "break", text },
  used,
});

function commandFr(low: (i: number) => string, i: number): Command {
  const w = low(i);
  const next = low(i + 1);
  if (w === "nouveau" && next === "paragraphe") return lineBreak("\n\n", 2);
  if (w === "nouvelle" && next === "ligne") return lineBreak("\n", 2);
  if (w === "à" && next === "la" && low(i + 2) === "ligne")
    return lineBreak("\n", 3);
  if (w === "point" && next === "d'interrogation") return mark("?", 2);
  if (w === "point" && next === "d'exclamation") return mark("!", 2);
  if (w === "point" && next === "virgule") return mark(";", 2);
  if (w === "point-virgule") return mark(";");
  if (w === "point" && next === "final") return mark(".", 2);
  if (w === "point" && !NOUN_BEFORE.has(low(i - 1))) return mark(".");
  if (w === "deux" && next === "points") return mark(":", 2);
  if (w === "deux-points") return mark(":");
  if (w === "virgule") return mark(",");
  return null;
}

function commandDe(low: (i: number) => string, i: number): Command {
  const w = low(i);
  const next = low(i + 1);
  if (w === "neuer" && next === "absatz") return lineBreak("\n\n", 2);
  if ((w === "neue" && next === "zeile") || w === "zeilenumbruch")
    return lineBreak("\n", w === "neue" ? 2 : 1);
  if (w === "fragezeichen") return mark("?");
  if (w === "ausrufezeichen") return mark("!");
  if (w === "semikolon" || w === "strichpunkt") return mark(";");
  if (w === "doppelpunkt") return mark(":");
  if (w === "komma") return mark(",");
  if (w === "punkt" && !NOUN_BEFORE_DE.has(low(i - 1))) return mark(".");
  return null;
}

function commandIt(low: (i: number) => string, i: number): Command {
  const w = low(i);
  const next = low(i + 1);
  if (w === "nuovo" && next === "paragrafo") return lineBreak("\n\n", 2);
  if (w === "nuova" && (next === "riga" || next === "linea"))
    return lineBreak("\n", 2);
  // « a capo », but not « a capo della squadra ».
  if (w === "a" && next === "capo" && !/^d(i|el|ell|ei|egl)/.test(low(i + 2)))
    return lineBreak("\n", 2);
  if (w === "punto" && next === "interrogativo") return mark("?", 2);
  if (w === "punto" && next === "esclamativo") return mark("!", 2);
  if (w === "punto" && next === "e" && low(i + 2) === "virgola")
    return mark(";", 3);
  if (w === "punto" && next === "virgola") return mark(";", 2);
  if (w === "due" && next === "punti") return mark(":", 2);
  if (w === "punto" && !NOUN_BEFORE_IT.has(low(i - 1))) return mark(".");
  if (w === "virgola") return mark(",");
  return null;
}

const COMMANDS: Record<Lang, typeof commandFr> = {
  fr: commandFr,
  de: commandDe,
  it: commandIt,
};

/**
 * Turns spoken commands into punctuation and line breaks, in the language of
 * the post. French: « nouvelle ligne », « à la ligne », « nouveau
 * paragraphe », « point », « virgule », « deux points », « point-virgule »,
 * « point d’interrogation », « point d’exclamation ». German: « neue
 * Zeile », « neuer Absatz », « Punkt », « Komma », « Doppelpunkt »,
 * « Semikolon », « Fragezeichen », « Ausrufezeichen ». Italian: « nuova
 * riga », « a capo », « nuovo paragrafo », « punto », « virgola », « due
 * punti », « punto e virgola », « punto interrogativo », « punto
 * esclamativo ». No space before « . , », a no-break space before « : ; ?
 * ! » in French only, a capital after the end of a sentence.
 */
export function applyVoiceCommands(
  text: string,
  lang: Lang = getLang(),
): string {
  const words = text
    .replace(/[’‘]/g, "'")
    .replace(/\b([dl])'\s+/gi, "$1'")
    .split(/\s+/)
    .filter(Boolean);
  const pieces: Piece[] = [];
  const low = (i: number) => (words[i] ?? "").toLowerCase();
  const command = COMMANDS[lang];
  for (let i = 0; i < words.length; i++) {
    const found = command(low, i);
    if (found) {
      pieces.push(found.piece);
      i += found.used - 1;
    } else pieces.push({ kind: "word", text: words[i] });
  }
  const spaced = lang === "fr" ? SPACED : new Set<string>();
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
    // « 3 virgule 5 » (« 3 Komma 5 », « 3 virgola 5 ») is a decimal: 3,5.
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
    if (spaced.has(piece.text) && out && !out.endsWith("\n")) out += NBSP;
    out += piece.text;
    if (ENDS.has(piece.text)) capital = true;
  });
  return out;
}

/**
 * Inserts dictated text in a field at the caret (replacing the selection),
 * with the spacing of the surrounding text and a capital at the start of a
 * sentence. Returns the new value and the caret after the insertion.
 * « : ; ? ! » take a no-break space before them in French only.
 */
export function insertAt(
  value: string,
  selectionStart: number | null | undefined,
  selectionEnd: number | null | undefined,
  addition: string,
  maxLength = Infinity,
  lang: Lang = getLang(),
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
  const spaced = lang === "fr" && SPACED.has(first);
  if (TIGHT.has(first) || first === "\n" || (SPACED.has(first) && !spaced)) {
    before = before.replace(/[  ]+$/, "");
  } else if (spaced) {
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
