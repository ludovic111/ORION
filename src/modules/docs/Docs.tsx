import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronsDown, ChevronsUp, Search, X } from "lucide-react";
import { useApp } from "../../app/context";
import { Segmented } from "../../ui/fields";
import { ModuleHead } from "../../ui/ModuleHead";
import {
  GROUPS,
  TOPICS,
  loadTopics,
  localized,
  resolveTopic,
  topicsFor,
  type Level,
  type Topic,
} from "./content";
import { fold, textOf } from "./kit";
import { useLang } from "../../i18n";
import { t, tn } from "./i18n.ts";
import "./docs.css";

const levels = (): { value: Level; label: string }[] => [
  { value: "short", label: t("En bref") },
  { value: "guide", label: t("Guide") },
  { value: "full", label: t("Tout le détail") },
];
const RANK: Record<Level, number> = { short: 0, guide: 1, full: 2 };

type Indexed = { topic: Topic; raw: string[]; folded: string };

function buildIndex(topics: Topic[]): Indexed[] {
  return topics.map((topic) => {
    const text = [
      topic.title,
      textOf(topic.short),
      textOf(topic.guide),
      textOf(topic.full),
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const raw = Array.from(text);
    return { topic, raw, folded: raw.map((c) => fold(c)).join("") };
  });
}

/** Snippet around the first match, with the matched words marked. */
function snippet(item: Indexed, words: string[]) {
  const first = Math.min(
    ...words.map((w) => item.folded.indexOf(w)).filter((i) => i >= 0),
  );
  const start = Math.max(0, first - 60);
  const end = Math.min(item.raw.length, first + 140);
  const text = item.raw.slice(start, end);
  const folded = item.folded.slice(start, end);
  const marks = new Array(text.length).fill(false);
  for (const w of words) {
    let i = folded.indexOf(w);
    while (i >= 0 && w) {
      for (let j = i; j < i + w.length; j++) marks[j] = true;
      i = folded.indexOf(w, i + w.length);
    }
  }
  const parts: { text: string; mark: boolean }[] = [];
  text.forEach((c, i) => {
    const last = parts[parts.length - 1];
    if (last && last.mark === marks[i]) last.text += c;
    else parts.push({ text: c, mark: marks[i] });
  });
  return (
    <>
      {start > 0 && "… "}
      {parts.map((p, i) =>
        p.mark ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>,
      )}
      {end < item.raw.length && " …"}
    </>
  );
}

const reduced = () => document.documentElement.dataset.motion === "reduced";

export function Docs({ topic }: { topic: string }) {
  const { prefs, setPrefs, go } = useApp();
  const level: Level = prefs.docsLevel ?? "guide";
  const [active, setActive] = useState(() => resolveTopic(topic));
  const [query, setQuery] = useState("");
  // Per-topic level chosen with "Plus de détail" / "Moins de détail".
  const [local, setLocal] = useState<Record<string, Level>>({});
  const article = useRef<HTMLDivElement>(null);
  const spyLock = useRef(0);
  const lang = useLang();
  // The topics (and their text) follow the language of the post.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Help in the language of the post, loaded on first use (French until
  // then); module topics take the module names of that language.
  const [, setLoaded] = useState(0);
  const source = topicsFor(lang);
  useEffect(() => {
    if (topicsFor(lang)) return;
    let alive = true;
    void loadTopics(lang)
      .then(() => alive && setLoaded((n) => n + 1))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [lang]);
  const topics = useMemo(() => localized(source ?? TOPICS), [source, lang]);
  const index = useMemo(() => buildIndex(topics), [topics]);

  const words = useMemo(
    () =>
      fold(query.trim())
        .split(/\s+/)
        .filter((w) => w.length > 0),
    [query],
  );
  const results = useMemo(
    () =>
      words.length && query.trim().length >= 2
        ? index.filter((i) => words.every((w) => i.folded.includes(w)))
        : null,
    [index, words, query],
  );

  const scrollToTopic = useCallback((id: string, smooth = true) => {
    const el = document.getElementById(`docs-${id}`);
    if (!el) return;
    spyLock.current = Date.now() + 1200;
    setActive(id);
    el.scrollIntoView({
      behavior: smooth && !reduced() ? "smooth" : "auto",
      block: "start",
    });
  }, []);

  // Initial topic, and topics requested later by a help button. The shell
  // scrolls to the top when the module changes: wait for it.
  useEffect(() => {
    const id = resolveTopic(topic);
    setQuery("");
    setActive(id);
    if (id === topics[0].id) return;
    const timer = setTimeout(() => scrollToTopic(id, false), 80);
    return () => clearTimeout(timer);
  }, [topic, scrollToTopic]);

  // Scroll spy: the active topic is the last one whose top passed 30 % of the viewport.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < spyLock.current) return;
      const line = window.innerHeight * 0.3;
      let current = topics[0].id;
      for (const tp of topics) {
        const el = document.getElementById(`docs-${tp.id}`);
        if (el && el.getBoundingClientRect().top <= line) current = tp.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Reveal blocks as they enter the screen.
  useEffect(() => {
    const root = article.current;
    if (!root) return;
    const pending = root.querySelectorAll<HTMLElement>(
      ".docs-reveal:not(.is-in)",
    );
    if (!("IntersectionObserver" in window)) {
      pending.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            observer.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    pending.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [level, local, results]);

  const levelOf = (tp: Topic): Level => local[tp.id] ?? level;
  const openResult = (id: string) => {
    setLocal((l) => ({ ...l, [id]: "full" }));
    setQuery("");
    setTimeout(() => scrollToTopic(id), 30);
  };

  return (
    <>
      <ModuleHead
        topic="start"
        description={t(
          "Comment utiliser orion aic, fonction par fonction. Choisissez la quantité de détail : en bref, pas à pas, ou tout.",
        )}
        actions={
          <Segmented
            label={t("Niveau de détail")}
            value={level}
            onChange={(docsLevel) => {
              setLocal({});
              setPrefs({ docsLevel });
            }}
            options={levels()}
          />
        }
      />
      <div className="docs">
        <aside className="docs-side" aria-label={t("Sommaire de l’aide")}>
          <label className="docs-search">
            <Search size={15} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Chercher dans l’aide…")}
              aria-label={t("Chercher dans l’aide")}
            />
            {query && (
              <button
                type="button"
                className="icon-button"
                onClick={() => setQuery("")}
                aria-label={t("Effacer la recherche")}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <select
            className="docs-toc-select"
            aria-label={t("Aller au sujet")}
            value={active}
            onChange={(e) => {
              const id = e.target.value;
              setQuery("");
              setTimeout(() => scrollToTopic(id), 0);
            }}
          >
            {GROUPS.map((g) => (
              <optgroup key={g.id} label={g.label}>
                {topics
                  .filter((tp) => tp.group === g.id)
                  .map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <nav className="docs-toc">
            {GROUPS.map((g) => (
              <div key={g.id} className="docs-toc-group">
                <div className="docs-toc-label">{g.label}</div>
                {topics
                  .filter((tp) => tp.group === g.id)
                  .map((tp) => {
                    const Icon = tp.icon;
                    const dim =
                      results && !results.some((r) => r.topic.id === tp.id);
                    return (
                      <button
                        key={tp.id}
                        type="button"
                        className={`docs-toc-item${active === tp.id ? " active" : ""}${dim ? " dim" : ""}`}
                        aria-current={active === tp.id ? "true" : undefined}
                        style={{ ["--h" as string]: tp.hue }}
                        onClick={() => {
                          setQuery("");
                          setTimeout(() => scrollToTopic(tp.id), 0);
                        }}
                      >
                        <Icon size={15} aria-hidden />
                        <span>{tp.title}</span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </nav>
        </aside>

        <div className="docs-article" ref={article}>
          {results ? (
            <section className="docs-results" aria-live="polite">
              <h2>
                {results.length === 0
                  ? t("Aucun résultat")
                  : tn(
                      results.length,
                      "{n} sujet pour « {q} »",
                      "{n} sujets pour « {q} »",
                      { q: query.trim() },
                    )}
              </h2>
              {results.length === 0 && (
                <p className="muted">
                  {t(
                    "Essayez un autre mot, plus court, ou parcourez le sommaire. Les accents ne comptent pas.",
                  )}
                </p>
              )}
              <div className="docs-result-list">
                {results.map((r) => {
                  const Icon = r.topic.icon;
                  return (
                    <button
                      key={r.topic.id}
                      type="button"
                      className="docs-result"
                      style={{ ["--h" as string]: r.topic.hue }}
                      onClick={() => openResult(r.topic.id)}
                    >
                      <span className="docs-topic-icon" aria-hidden>
                        <Icon size={17} />
                      </span>
                      <span className="docs-result-text">
                        <strong>{r.topic.title}</strong>
                        <small>{snippet(r, words)}</small>
                      </span>
                      <ArrowRight size={15} aria-hidden />
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            GROUPS.map((g) => (
              <div key={g.id} className="docs-group">
                <div className="docs-group-label">{g.label}</div>
                {topics
                  .filter((tp) => tp.group === g.id)
                  .map((tp) => (
                    <TopicView
                      key={tp.id}
                      topic={tp}
                      level={levelOf(tp)}
                      global={level}
                      onLevel={(l) =>
                        setLocal((prev) => ({ ...prev, [tp.id]: l }))
                      }
                      onOpen={tp.module ? () => go(tp.module!) : undefined}
                    />
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function TopicView({
  topic: tp,
  level,
  global,
  onLevel,
  onOpen,
}: {
  topic: Topic;
  level: Level;
  global: Level;
  onLevel: (level: Level) => void;
  onOpen?: () => void;
}) {
  const Icon = tp.icon;
  const rank = RANK[level];
  const guide = tp.guide && (rank >= 1 || tp.always);
  const full = tp.full && rank >= 2;
  const deeper = (rank < 1 && tp.guide && !tp.always) || (rank < 2 && tp.full);
  const next: Level = rank < 1 && tp.guide && !tp.always ? "guide" : "full";
  const group = GROUPS.find((g) => g.id === tp.group)?.label;
  return (
    <section
      id={`docs-${tp.id}`}
      className="docs-topic"
      style={{ ["--h" as string]: tp.hue }}
      aria-labelledby={`docs-h-${tp.id}`}
    >
      <header className="docs-topic-head docs-reveal">
        <span className="docs-topic-icon" aria-hidden>
          <Icon size={20} />
        </span>
        <div className="docs-topic-title">
          <span className="docs-eyebrow">{group}</span>
          <h2 id={`docs-h-${tp.id}`}>{tp.title}</h2>
        </div>
        {onOpen && (
          <button type="button" className="docs-open" onClick={onOpen}>
            {tp.openLabel}
            <ArrowRight size={14} aria-hidden />
          </button>
        )}
      </header>
      <div className="docs-layer docs-layer-short docs-reveal">{tp.short}</div>
      {guide && (
        <div className="docs-layer docs-layer-guide docs-reveal">
          {!tp.always && (
            <span className="docs-layer-tag">{t("Pas à pas")}</span>
          )}
          {tp.guide}
        </div>
      )}
      {full && (
        <div className="docs-layer docs-layer-full docs-reveal">
          <span className="docs-layer-tag">{t("Tout le détail")}</span>
          {tp.full}
        </div>
      )}
      {(deeper || rank > RANK[global]) && (
        <div className="docs-more">
          {deeper && (
            <button
              type="button"
              className="link"
              onClick={() => onLevel(next)}
            >
              <ChevronsDown size={14} aria-hidden />
              {t("Plus de détail")}
            </button>
          )}
          {rank > RANK[global] && (
            <button
              type="button"
              className="link"
              onClick={() => onLevel(global)}
            >
              <ChevronsUp size={14} aria-hidden />
              {t("Moins de détail")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default Docs;
