/**
 * Languages of the interface: French (source), German and Italian.
 *
 * A dictionary maps a French text (the key, as written in the code) to its
 * German and Italian versions:
 *
 *   const dict = {
 *     "Enregistrer": { de: "Speichern", it: "Salva" },
 *     "{n} entrées": { de: "{n} Einträge", it: "{n} voci" },
 *   } satisfies Dict;
 *   export const { t, tn } = translator(dict);
 *
 *   t("Enregistrer")                  → "Speichern" on a German post
 *   t("{n} entrées", { n: 3 })        → "3 Einträge"
 *   tn(n, "{n} entrée", "{n} entrées") → singular or plural form
 *
 * TypeScript refuses a key that is not in the dictionary and an entry that
 * lacks `de` or `it`; tests/i18n.test.mjs checks that no translation is
 * empty and that placeholders ({n}, <0>…</0>) match. When the same French
 * text needs two translations (context), the key can be anything and `fr`
 * gives the French text: "Poste (fonction)": { fr: "Poste", de: …, it: … }.
 *
 * The language is chosen per post (Réglages → Ce poste). Nothing here
 * touches stored data: journal entries, référentiel values and free texts
 * are shown as they were written, whatever the language of the post.
 *
 * Pure module (no DOM, no React): usable by shared/ and by the node tests,
 * where the language stays French.
 */

export type Lang = "fr" | "de" | "it";
export const LANGS: readonly Lang[] = ["fr", "de", "it"];
/** Name of each language, in that language (language pickers). */
export const LANG_NAMES: Record<Lang, string> = {
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};
/** BCP 47 tag used for Intl, <html lang> and the exported documents. */
export const LOCALES: Record<Lang, string> = {
  fr: "fr-CH",
  de: "de-CH",
  it: "it-CH",
};

export const isLang = (value: unknown): value is Lang =>
  value === "fr" || value === "de" || value === "it";

/** Language of a browser tag: de* → de, it* → it, anything else → fr. */
export function langOf(tag: string | undefined | null): Lang {
  const t = (tag ?? "").toLowerCase();
  if (t.startsWith("de") || t === "gsw" || t.startsWith("gsw-")) return "de";
  if (t.startsWith("it")) return "it";
  return "fr";
}

let current: Lang = "fr";
const listeners = new Set<() => void>();

/** Language of this post. */
export const getLang = (): Lang => current;
/** BCP 47 tag of the language of this post ("de-CH"). */
export const locale = (): string => LOCALES[current];

/** Changes the language; subscribers (React, <html lang>) are told. */
export function setLang(lang: Lang) {
  if (!isLang(lang) || lang === current) return;
  current = lang;
  for (const fn of [...listeners]) fn();
}

/**
 * Runs fn with texts in another language, without changing the language of
 * the post (search in French on a German post, a document for another post).
 */
export function inLang<T>(lang: Lang, fn: () => T): T {
  const previous = current;
  current = lang;
  try {
    return fn();
  } finally {
    current = previous;
  }
}

/** Called after each change of language; returns the unsubscribe. */
export function onLang(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------- Dictionaries ----------

export type Entry = {
  de: string;
  it: string;
  /** French text when the key is not the French text itself. */
  fr?: string;
};
export type Dict = Record<string, Entry>;
export type Params = Record<string, string | number | null | undefined>;

/** Replaces {name} by params.name; unknown placeholders stay visible. */
export function format(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    return value === undefined || value === null ? whole : String(value);
  });
}

/** Text of an entry in a language (French when a translation is empty). */
export function pick(dict: Dict, key: string, lang: Lang = current): string {
  const entry = dict[key];
  if (!entry) return key;
  if (lang === "fr") return entry.fr ?? key;
  return entry[lang] || entry.fr || key;
}

const pluralRules = new Map<Lang, Intl.PluralRules>();
/** True when n takes the singular form (French: 0 and 1; German, Italian: 1). */
export function isOne(n: number, lang: Lang = current): boolean {
  let rules = pluralRules.get(lang);
  if (!rules) {
    rules = new Intl.PluralRules(LOCALES[lang]);
    pluralRules.set(lang, rules);
  }
  return rules.select(n) === "one";
}

export type Translate<D extends Dict> = (
  key: keyof D & string,
  params?: Params,
) => string;
export type TranslatePlural<D extends Dict> = (
  n: number,
  one: keyof D & string,
  other: keyof D & string,
  params?: Params,
) => string;

export function translator<D extends Dict>(dict: D) {
  /** Text in the language of the post. */
  const t: Translate<D> = (key, params) => format(pick(dict, key), params);
  /** Singular or plural form; {n} is filled with n. */
  const tn: TranslatePlural<D> = (n, one, other, params) =>
    format(pick(dict, isOne(n) ? one : other), { n, ...params });
  /** Text in a given language (a document produced for another post). */
  const tIn = (lang: Lang, key: keyof D & string, params?: Params) =>
    format(pick(dict, key, lang), params);
  return { t, tn, tIn, dict };
}

// ---------- Dates, hours and numbers ----------
// Always the wall-clock time of Zurich (shared/time.ts), whatever the zone
// of the browser; only the words and separators follow the language.
// Dates are written dd.mm.yyyy and hours 24 h in the three languages.

const ZONE = "Europe/Zurich";
const formats = new Map<string, Intl.DateTimeFormat>();
function dtf(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = current + JSON.stringify(options);
  let f = formats.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale(), { timeZone: ZONE, ...options });
    formats.set(key, f);
  }
  return f;
}
type When = number | string | Date;
const ms = (value: When) =>
  value instanceof Date
    ? value.getTime()
    : typeof value === "number"
      ? value
      : Date.parse(value);

const pad = (n: number) => String(n).padStart(2, "0");
function wall(value: When) {
  const out: Record<string, string> = {};
  for (const p of dtf({
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(ms(value)))
    out[p.type] = p.value;
  return {
    day: pad(Number(out.day)),
    month: pad(Number(out.month)),
    year: out.year,
    hour: pad(Number(out.hour) % 24),
    minute: pad(Number(out.minute)),
    second: pad(Number(out.second)),
  };
}

/** "08:04" (or "08:04:09"), Zurich time. "" for an invalid date. */
export function formatTime(value: When, seconds = false): string {
  if (!Number.isFinite(ms(value))) return "";
  const w = wall(value);
  return `${w.hour}:${w.minute}${seconds ? `:${w.second}` : ""}`;
}

/** "05.03.2026", Zurich day. "" for an invalid date. */
export function formatDate(value: When): string {
  if (!Number.isFinite(ms(value))) return "";
  const w = wall(value);
  return `${w.day}.${w.month}.${w.year}`;
}

/** "05.03.2026 08:04", Zurich time. "" for an invalid date. */
export function formatDateTime(value: When, seconds = false): string {
  if (!Number.isFinite(ms(value))) return "";
  return `${formatDate(value)} ${formatTime(value, seconds)}`;
}

/** "05.03" (day and month). */
export function formatDayMonth(value: When): string {
  if (!Number.isFinite(ms(value))) return "";
  const w = wall(value);
  return `${w.day}.${w.month}`;
}

/**
 * Words of a date in the language of the post: "jeudi 5 mars 2026",
 * "Donnerstag, 5. März 2026". Options as Intl (weekday, month…).
 */
export function formatLongDate(
  value: When,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  if (!Number.isFinite(ms(value))) return "";
  return dtf(options).format(ms(value));
}

/** Any Intl date format in the language of the post, Zurich time. */
export function formatWith(
  value: When,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!Number.isFinite(ms(value))) return "";
  return dtf(options).format(ms(value));
}

/** Number with the separators of the language ("1 234,5", "1’234.5"). */
export function formatNumber(
  n: number,
  options?: Intl.NumberFormatOptions,
): string {
  return n.toLocaleString(locale(), options);
}

/** Sorting and comparison of texts in the language of the post. */
export const compareText = (a: string, b: string) =>
  a.localeCompare(b, locale(), { sensitivity: "base" });
