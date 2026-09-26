import {
  Fragment,
  cloneElement,
  isValidElement,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  LANGS,
  LANG_NAMES,
  getLang,
  isLang,
  langOf,
  locale,
  onLang,
  setLang,
  type Lang,
} from "../../shared/i18n/core.ts";

export * from "../../shared/i18n/core.ts";

// Language of this post: stored with the other preferences of the post
// (src/app/prefs.ts, key "orion-aic-prefs"), by default the language of the
// browser. Read here, before the first render, so the first screen already
// shows the right language.
const PREFS = "orion-aic-prefs";
export function initialLang(): Lang {
  try {
    const raw = localStorage.getItem(PREFS);
    const stored = raw ? (JSON.parse(raw) as { lang?: unknown }).lang : null;
    if (isLang(stored)) return stored;
  } catch {}
  return langOf(typeof navigator === "undefined" ? "" : navigator.language);
}

if (typeof document !== "undefined") {
  setLang(initialLang());
  const apply = () => {
    document.documentElement.lang = locale();
  };
  apply();
  onLang(apply);
}

/** Language of the post; the component re-renders when it changes. */
export function useLang(): Lang {
  return useSyncExternalStore(onLang, getLang, getLang);
}

/**
 * Text with markup: numbered tags in the translation wrap the given
 * elements. rich(t("Cliquez sur <0>Enregistrer</0>."), [<strong />])
 * → Cliquez sur <strong>Enregistrer</strong>. Tags may not nest.
 */
export function rich(text: string, elements: ReactElement[]): ReactNode {
  const out: ReactNode[] = [];
  const re = /<(\d+)>([\s\S]*?)<\/\1>|<(\d+)\/>/g;
  let last = 0;
  let k = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const index = Number(m[1] ?? m[3]);
    const element = elements[index];
    if (isValidElement(element))
      out.push(
        m[3] !== undefined
          ? cloneElement(element, { key: k++ })
          : cloneElement(element, { key: k++ }, m[2]),
      );
    else out.push(m[2] ?? "");
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

/** Compact FR · DE · IT switch (landing page, wall screen). */
export function LangSwitch({
  value,
  onChange,
  className = "",
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}) {
  return (
    <div
      className={`lang-switch ${className}`}
      role="group"
      aria-label="Langue · Sprache · Lingua"
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          className={l === value ? "on" : ""}
          aria-pressed={l === value}
          title={LANG_NAMES[l]}
          onClick={() => onChange(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
