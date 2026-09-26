import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { KIND_INFO, searchItems, type Ref } from "../../shared/links";
import { useApp } from "../app/context";
import { MODULES } from "../app/modules";
import { inLang } from "../../shared/i18n/core.ts";
import { KIND_ICON } from "./links";
import { useLayer } from "./overlay";
import { t } from "./i18n.ts";
import { useLang } from "../i18n";

export type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  run: () => void;
  keywords?: string;
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");

/** ⌘K: search everything and run any action from the keyboard. */
export function Palette({
  commands,
  onClose,
}: {
  commands: Command[];
  onClose: () => void;
}) {
  const { graph, go, open } = useApp();
  const lang = useLang();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  // Topmost overlay: Échap closes the palette only, Tab stays inside.
  useLayer(box, { kind: "palette", onEscape: onClose });
  const results = useMemo(() => {
    const q = norm(query.trim());
    const actions = commands.filter(
      (c) =>
        !q ||
        norm(`${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`).includes(q),
    );
    const modules = MODULES.filter(
      (m) =>
        !q ||
        norm(
          `${m.label} ${m.description} ${inLang("fr", () => `${m.label} ${m.short}`)}`,
        ).includes(q),
    ).map<Command>((m) => {
      const Icon = m.icon;
      return {
        id: `go-${m.id}`,
        label: t("Aller à {module}", { module: m.label }),
        hint: m.description,
        icon: <Icon size={16} />,
        run: () => go(m.id),
      };
    });
    const items = q
      ? searchItems(graph.items, query)
          .slice(0, 30)
          .map<Command>((i) => {
            const Icon = KIND_ICON[i.kind];
            return {
              id: i.ref,
              label: i.title,
              hint: `${KIND_INFO[i.kind].label}${i.subtitle ? ` · ${i.subtitle}` : ""}`,
              icon: (
                <Icon
                  size={16}
                  style={{ color: `hsl(${KIND_INFO[i.kind].hue} 85% 68%)` }}
                />
              ),
              run: () => open(i.ref as Ref),
            };
          })
      : [];
    return [
      { title: t("Actions"), list: actions.slice(0, q ? 8 : 10) },
      { title: t("Éléments"), list: items },
      { title: t("Modules"), list: modules.slice(0, q ? 5 : 13) },
    ].filter((g) => g.list.length);
    // lang: labels of the modules and of the groups.
  }, [commands, graph.items, query, go, open, lang]);
  const flat = results.flatMap((g) => g.list);
  useEffect(() => {
    setActive(0);
  }, [query]);
  useEffect(() => {
    list.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  function run(c: Command | undefined) {
    if (!c) return;
    onClose();
    c.run();
  }
  let index = -1;
  return (
    <div
      className="palette-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={box}
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t("Rechercher et agir")}
      >
        <div className="palette-input">
          <Search size={18} />
          <input
            autoFocus
            value={query}
            placeholder={t("Rechercher partout, ou taper une action…")}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(flat.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(flat[active]);
              }
            }}
          />
          <kbd>{t("Échap")}</kbd>
        </div>
        <div className="palette-list" ref={list}>
          {results.map((group) => (
            <div key={group.title}>
              <div className="menu-label">{group.title}</div>
              {group.list.map((c) => {
                index++;
                const i = index;
                return (
                  <button
                    key={c.id}
                    data-index={i}
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(c)}
                  >
                    {c.icon}
                    <span className="row-main">
                      <strong>{c.label}</strong>
                      {c.hint && <small>{c.hint}</small>}
                    </span>
                    {i === active && <ArrowRight size={14} />}
                  </button>
                );
              })}
            </div>
          ))}
          {!flat.length && (
            <p className="muted" style={{ padding: 16 }}>
              {t("Rien trouvé pour « {query} ».", { query })}
            </p>
          )}
        </div>
        <div className="palette-foot">
          <span>{t("↑↓ naviguer")}</span>
          <span>
            <CornerDownLeft size={11} /> {t("ouvrir")}
          </span>
          <span>{t("Recherche dans tout le journal actif")}</span>
        </div>
      </div>
    </div>
  );
}
