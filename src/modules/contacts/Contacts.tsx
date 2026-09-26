import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Contact as ContactIcon,
  Copy,
  Ellipsis,
  FileDown,
  FileUp,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Printer,
  Radio,
  Search,
  Siren,
  Star,
  X,
} from "lucide-react";
import { swissEmergency, upsert, type Contact } from "../../../shared/ops";
import { locale } from "../../../shared/i18n/core.ts";
import { useLang } from "../../i18n";
import { t, tn } from "./i18n.ts";
import { parseRef, ref } from "../../../shared/links";
import { useApp } from "../../app/context";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import { Segmented, TextField } from "../../ui/fields";
import { HoverCard } from "../../ui/links";
import { Popover } from "../../ui/Popover";
import { Modal } from "../../journal/Modal";
import type { SheetTable } from "../../print/radio-sheet";
import {
  MAX_IMPORT_BYTES,
  blankContact,
  contactKey,
  contactsCsv,
  norm,
  parseContacts,
  phoneDigits,
  readText,
  type ContactDraft,
} from "./contactFiles";
import "./contacts.css";

type Draft = ContactDraft &
  Partial<Pick<Contact, "id" | "createdAt" | "updatedAt" | "by">>;
type Grouping = "category" | "alpha";
type Pending = {
  file: string;
  fresh: ContactDraft[];
  duplicates: number;
  room: number;
};

const MAX_CONTACTS = 5000;
const FAVORITES = "__fav";
const NONE = "__none";
const GROUP_KEY = "orion-aic-contacts-group";

function readLocal(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function initials(name: string) {
  const words = name
    .replace(/[()·,.\-–]/g, " ")
    .split(/\s+/)
    .filter((w) => /\p{L}|\d/u.test(w));
  if (!words.length) return "?";
  const letters =
    words.length === 1
      ? words[0].slice(0, 2)
      : `${words[0][0]}${words[words.length - 1][0]}`;
  return letters.toLocaleUpperCase("fr");
}

function hueOf(name: string) {
  let h = 0;
  for (const ch of norm(name)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

const telHref = (phone: string) => {
  const digits = phoneDigits(phone);
  return digits.replace(/\+/g, "").length >= 3 ? `tel:${digits}` : "";
};

const byName = (a: Contact, b: Contact) =>
  a.name.localeCompare(b.name, locale());
const favoritesFirst = (a: Contact, b: Contact) =>
  Number(b.favorite) - Number(a.favorite) || byName(a, b);

export function Contacts() {
  const {
    journal,
    author,
    readOnly,
    canWrite,
    graph,
    updateOps,
    lists,
    focus,
    setFocus,
    toast,
    print,
  } = useApp();
  const lang = useLang();
  const contacts = journal.ops.contacts;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [grouping, setGroupingState] = useState<Grouping>(() =>
    readLocal(GROUP_KEY) === "alpha" ? "alpha" : "category",
  );
  const setGrouping = (g: Grouping) => {
    setGroupingState(g);
    writeLocal(GROUP_KEY, g);
  };
  const [editing, setEditing] = useState<Draft | null>(null);
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focus?.startsWith("contact:")) return;
    const { id } = parseRef(focus);
    setFocus(null);
    if (id === "new") {
      if (!readOnly) setEditing(blankContact());
      return;
    }
    const found = contacts.find((c) => c.id === id);
    if (found) setEditing(found);
    else toast(t("Ce contact n’existe plus."));
  }, [focus, contacts, readOnly, setFocus, toast]);

  const categoryOrder = useMemo(() => {
    const standard = lists("contactCategories");
    const extra = [
      ...new Set(contacts.map((c) => c.category.trim()).filter(Boolean)),
    ]
      .filter((c) => !standard.some((s) => norm(s) === norm(c)))
      .sort((a, b) => a.localeCompare(b, locale()));
    return [...standard, ...extra];
  }, [contacts, lists, lang]);
  const categoryOf = useCallback(
    (c: Contact) => {
      const key = norm(c.category);
      return key
        ? (categoryOrder.find((s) => norm(s) === key) ?? c.category.trim())
        : NONE;
    },
    [categoryOrder],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contacts) {
      const key = categoryOf(c);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [contacts, categoryOf]);
  const favoriteCount = contacts.filter((c) => c.favorite).length;

  const visible = useMemo(() => {
    const terms = norm(query).split(" ").filter(Boolean);
    return contacts.filter((c) => {
      if (filter === FAVORITES && !c.favorite) return false;
      if (filter && filter !== FAVORITES && categoryOf(c) !== filter)
        return false;
      if (!terms.length) return true;
      const hay = `${norm(
        [
          c.name,
          c.organization,
          c.role,
          c.category,
          c.phone,
          c.phone2,
          c.email,
          c.radio,
          c.address,
          c.notes,
        ].join(" "),
      )} ${phoneDigits(c.phone)} ${phoneDigits(c.phone2)}`;
      return terms.every(
        (t) => hay.includes(t) || hay.includes(phoneDigits(t) || t),
      );
    });
  }, [contacts, query, filter, categoryOf]);

  const groups = useMemo(() => {
    const out: { key: string; title: string; list: Contact[] }[] = [];
    if (grouping === "category") {
      for (const key of [...categoryOrder, NONE]) {
        const list = visible
          .filter((c) => categoryOf(c) === key)
          .sort(favoritesFirst);
        if (list.length)
          out.push({
            key,
            title: key === NONE ? t("Sans catégorie") : key,
            list,
          });
      }
      return out;
    }
    const favorites = visible.filter((c) => c.favorite).sort(byName);
    if (favorites.length)
      out.push({ key: FAVORITES, title: t("Favoris"), list: favorites });
    const letters = new Map<string, Contact[]>();
    for (const c of visible.filter((x) => !x.favorite).sort(byName)) {
      const first = norm(c.name).charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : "#";
      letters.set(letter, [...(letters.get(letter) ?? []), c]);
    }
    for (const [letter, list] of letters)
      out.push({ key: letter, title: letter, list });
    return out;
  }, [visible, grouping, categoryOrder, categoryOf, lang]);

  function save(list: ContactDraft[], message: string) {
    try {
      updateOps((ops) =>
        list.reduce((next, c) => upsert(next, "contacts", c, author), ops),
      );
      toast(message);
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function addEmergency() {
    const known = new Set(
      contacts
        .flatMap((c) => [phoneDigits(c.phone), phoneDigits(c.phone2)])
        .filter(Boolean),
    );
    // Standard numbers, named in the language of the journal.
    const missing = swissEmergency(journal.ops).filter(
      (e) => !known.has(phoneDigits(e.phone)),
    );
    if (!missing.length) {
      toast(t("Les numéros d’urgence suisses sont déjà dans la liste."));
      return;
    }
    save(
      missing.map((e) => ({ ...blankContact(), ...e })),
      tn(
        missing.length,
        "{n} numéro d’urgence ajouté.",
        "{n} numéros d’urgence ajoutés.",
      ),
    );
    setFilter("");
  }

  function toggleFavorite(c: Contact) {
    if (!canWrite()) return;
    try {
      updateOps((ops) =>
        upsert(ops, "contacts", { ...c, favorite: !c.favorite }, author),
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(t("{label} copié.", { label }));
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let done = false;
      try {
        done = document.execCommand("copy");
      } catch {
        done = false;
      }
      area.remove();
      toast(
        done
          ? t("{label} copié.", { label })
          : t("Copie impossible. {label} : {text}", { label, text }),
      );
    }
  }

  async function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      toast(t("Fichier trop volumineux : 2 Mo au maximum."));
      return;
    }
    try {
      const parsed = parseContacts(file.name, await readText(file));
      if (!parsed.length) {
        toast(t("Aucun contact trouvé dans ce fichier."));
        return;
      }
      const seen = new Set(contacts.map(contactKey));
      const fresh: ContactDraft[] = [];
      for (const c of parsed) {
        const key = contactKey(c);
        if (seen.has(key)) continue;
        seen.add(key);
        fresh.push(c);
      }
      setPending({
        file: file.name,
        fresh,
        duplicates: parsed.length - fresh.length,
        room: Math.max(0, MAX_CONTACTS - contacts.length),
      });
    } catch (err) {
      toast(
        t("Lecture impossible : {error}", { error: (err as Error).message }),
      );
    }
  }

  function exportCsv() {
    const list = [...contacts].sort(byName);
    const blob = new Blob([contactsCsv(list)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t("contacts (fichier)")}-${new Date().toLocaleDateString("sv-SE")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(tn(list.length, "{n} contact exporté.", "{n} contacts exportés."));
  }

  function printDirectory() {
    const tables: SheetTable[] = [...categoryOrder, NONE]
      .map((key) => {
        const list = contacts
          .filter((c) => categoryOf(c) === key)
          .sort(favoritesFirst);
        return {
          id: key,
          title: key === NONE ? t("Sans catégorie") : key,
          caption: tn(list.length, "{n} contact", "{n} contacts"),
          head: [
            t("Nom"),
            t("Fonction · organisation"),
            t("Téléphones"),
            t("E-mail"),
            t("Radio"),
            t("Adresse · remarques"),
          ],
          widths: [34, 34, 28, 34, 16, 36],
          body: list.map((c) => [
            `${c.favorite ? "★ " : ""}${c.name}`,
            [c.role, c.organization].filter(Boolean).join(" · ") || "—",
            [c.phone, c.phone2].filter(Boolean).join("\n") || "—",
            c.email || "—",
            c.radio || "—",
            [c.address, c.notes].filter(Boolean).join("\n") || "—",
          ]),
        };
      })
      .filter((t) => t.body.length);
    if (!tables.length) {
      toast(t("Aucun contact à imprimer."));
      return;
    }
    print({
      kind: "tables",
      journal,
      title: t("Annuaire des contacts"),
      extra: t("Établi par {author}", { author }),
      tables,
      landscape: false,
      name: t("contacts (fichier)"),
    });
  }

  const callsigns = journal.radio.stations.map((s) => s.callsign);
  const spec: FieldSpec[] = [
    { kind: "group", label: t("Identité") },
    {
      key: "name",
      label: t("Nom"),
      kind: "text",
      required: true,
      max: 160,
      wide: true,
      placeholder: t("Personne ou service, ex. Commune · voirie"),
    },
    { key: "role", label: t("Fonction"), kind: "text", max: 200 },
    {
      key: "organization",
      label: t("Organisation"),
      kind: "combo",
      list: "organizations",
    },
    {
      key: "category",
      label: t("Catégorie"),
      kind: "combo",
      list: "contactCategories",
      quick: 7,
      wide: true,
    },
    {
      key: "favorite",
      label: t("Favori"),
      kind: "toggle",
      hint: t("Toujours en tête de liste"),
    },
    { kind: "group", label: t("Joindre") },
    {
      kind: "custom",
      key: "phone",
      render: (v, set) => (
        <TextField
          label={t("Téléphone")}
          type="tel"
          value={String(v.phone ?? "")}
          maxLength={80}
          placeholder="+41 …"
          onChange={(phone) => set({ phone })}
        />
      ),
    },
    {
      kind: "custom",
      key: "phone2",
      render: (v, set) => (
        <TextField
          label={t("Téléphone 2")}
          type="tel"
          value={String(v.phone2 ?? "")}
          maxLength={80}
          onChange={(phone2) => set({ phone2 })}
        />
      ),
    },
    {
      kind: "custom",
      key: "email",
      render: (v, set) => (
        <TextField
          label={t("E-mail")}
          type="email"
          value={String(v.email ?? "")}
          maxLength={200}
          onChange={(email) => set({ email })}
        />
      ),
    },
    {
      key: "radio",
      label: t("Radio / nom d’appel"),
      kind: "combo",
      options: callsigns,
    },
    { kind: "group", label: t("Détails") },
    { key: "address", label: t("Adresse"), kind: "text", max: 300, wide: true },
    { key: "notes", label: t("Remarques"), kind: "area", max: 2000 },
  ];

  const menuItems = (
    <>
      {!readOnly && (
        <button data-close onClick={addEmergency}>
          <Siren size={15} />
          <span>
            {t("Ajouter les numéros d’urgence suisses")}
            <small>112, 117, 118, 144, 1414, 145, 143</small>
          </span>
        </button>
      )}
      {!readOnly && (
        <button data-close onClick={() => fileInput.current?.click()}>
          <FileUp size={15} />
          <span>
            {t("Importer un fichier")}
            <small>
              {t("vCard (.vcf) ou tableau (.csv), lu sur cet appareil")}
            </small>
          </span>
        </button>
      )}
      <button data-close disabled={!contacts.length} onClick={exportCsv}>
        <FileDown size={15} />
        <span>
          {t("Exporter en CSV")}
          <small>{t("Pour Excel ou une autre application")}</small>
        </span>
      </button>
      <button data-close disabled={!contacts.length} onClick={printDirectory}>
        <Printer size={15} />
        <span>
          {t("Imprimer l’annuaire")}
          <small>{t("A4, classé par catégorie")}</small>
        </span>
      </button>
    </>
  );

  const chip = (value: string, label: string, count: number) => (
    <button
      key={value || "all"}
      type="button"
      className="contacts-chip"
      aria-pressed={filter === value}
      onClick={() => setFilter(filter === value && value ? "" : value)}
    >
      {value === FAVORITES && <Star size={12} />}
      {label}
      <b>{count}</b>
    </button>
  );

  return (
    <>
      <ModuleHead
        actions={
          <>
            <button
              onClick={(e) => setMenu(menu ? null : e.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={!!menu}
            >
              <Ellipsis size={15} />
              {t("Plus")}
            </button>
            <button
              className="primary"
              disabled={readOnly}
              onClick={() => setEditing(blankContact())}
            >
              <Plus size={15} />
              {t("Nouveau contact")}
            </button>
          </>
        }
      />
      {menu && (
        <Popover anchor={menu} onClose={() => setMenu(null)} align="end">
          {menuItems}
        </Popover>
      )}
      <input
        ref={fileInput}
        type="file"
        accept=".vcf,.vcard,.csv,text/vcard,text/x-vcard,text/csv"
        hidden
        onChange={pickFile}
      />

      {contacts.length === 0 ? (
        <EmptyState
          icon={<ContactIcon size={28} />}
          title={t("L’annuaire est vide")}
          actions={
            !readOnly && (
              <>
                <button className="primary" onClick={addEmergency}>
                  <Siren size={15} />
                  {t("Ajouter les numéros d’urgence suisses")}
                </button>
                <button onClick={() => setEditing(blankContact())}>
                  <Plus size={15} />
                  {t("Nouveau contact")}
                </button>
                <button onClick={() => fileInput.current?.click()}>
                  <FileUp size={15} />
                  {t("Importer (.vcf, .csv)")}
                </button>
              </>
            )
          }
        >
          {t(
            "Gardez sous la main les numéros des partenaires, autorités et fournisseurs. Un clic sur un numéro l’appelle depuis un téléphone.",
          )}
        </EmptyState>
      ) : (
        <>
          <div className="contacts-toolbar">
            <div className="search contacts-search">
              <Search size={16} />
              <input
                value={query}
                enterKeyHint="search"
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Nom, organisation, numéro…")}
                aria-label={t("Rechercher un contact")}
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label={t("Effacer la recherche")}
                  onClick={() => setQuery("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Segmented
              label={t("Classement")}
              value={grouping}
              onChange={setGrouping}
              options={[
                { value: "category", label: t("Par catégorie") },
                { value: "alpha", label: t("A–Z") },
              ]}
            />
          </div>
          <div
            className="contacts-chips"
            role="group"
            aria-label={t("Filtrer par catégorie")}
          >
            {chip("", t("Tous"), contacts.length)}
            {favoriteCount > 0 && chip(FAVORITES, t("Favoris"), favoriteCount)}
            {[...categoryOrder, NONE]
              .filter((key) => counts.get(key))
              .map((key) =>
                chip(
                  key,
                  key === NONE ? t("Sans catégorie") : key,
                  counts.get(key) ?? 0,
                ),
              )}
          </div>

          {!visible.length && (
            <p className="muted contacts-none">
              {t("Aucun contact ne correspond.")}{" "}
              <button
                className="link"
                onClick={() => {
                  setQuery("");
                  setFilter("");
                }}
              >
                {t("Tout afficher")}
              </button>
            </p>
          )}

          {groups.map((g) => (
            <section
              key={g.key}
              className="contacts-group"
              aria-label={g.title}
            >
              <h2 className="contacts-group-title">
                {g.key === FAVORITES && <Star size={13} />}
                {g.title}
                <span>{g.list.length}</span>
              </h2>
              <div className="contacts-grid stagger">
                {g.list.map((c) => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    showCategory={grouping === "alpha"}
                    links={graph.degree.get(ref("contact", c.id)) ?? 0}
                    readOnly={readOnly}
                    onOpen={() => setEditing(c)}
                    onFavorite={() => toggleFavorite(c)}
                    onCopy={copy}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {editing && (
        <RecordSheet<Draft>
          key={editing.id ?? "new"}
          collection="contacts"
          kind="contact"
          noun={t("un contact")}
          spec={spec}
          initial={editing}
          onClose={() => setEditing(null)}
          validate={(v) => (v.name.trim() ? "" : t("Le nom est nécessaire."))}
        >
          {(saved) =>
            (telHref(saved.phone) || telHref(saved.phone2) || saved.email) && (
              <div className="contacts-sheet-actions">
                {[saved.phone, saved.phone2].map(
                  (p, i) =>
                    telHref(p) && (
                      <a
                        key={i}
                        className="button contacts-call"
                        href={telHref(p)}
                      >
                        <Phone size={15} />
                        {t("Appeler {phone}", { phone: p })}
                      </a>
                    ),
                )}
                {saved.email && (
                  <a className="button" href={`mailto:${saved.email}`}>
                    <Mail size={15} />
                    {t("Écrire")}
                  </a>
                )}
              </div>
            )
          }
        </RecordSheet>
      )}

      {pending && (
        <ImportPreview
          pending={pending}
          onClose={() => setPending(null)}
          onImport={(list) => {
            save(
              list,
              tn(list.length, "{n} contact importé.", "{n} contacts importés."),
            );
            setPending(null);
          }}
        />
      )}
    </>
  );
}

function ContactCard({
  contact: c,
  showCategory,
  links,
  readOnly,
  onOpen,
  onFavorite,
  onCopy,
}: {
  contact: Contact;
  showCategory: boolean;
  links: number;
  readOnly: boolean;
  onOpen: () => void;
  onFavorite: () => void;
  onCopy: (text: string, label: string) => void;
}) {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const enter = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const head = e.currentTarget.getBoundingClientRect();
    const card = (
      e.currentTarget.closest("article") ?? e.currentTarget
    ).getBoundingClientRect();
    clearTimeout(timer.current);
    // Beside the card when there is room, so the call buttons stay visible.
    timer.current = setTimeout(
      () =>
        setHover(
          card.right + 340 < window.innerWidth
            ? { x: card.right + 10, y: card.top }
            : { x: head.left, y: head.bottom + 6 },
        ),
      650,
    );
  };
  const leave = () => {
    clearTimeout(timer.current);
    setHover(null);
  };
  const hue = hueOf(c.name);
  const sub = [c.role, c.organization].filter(Boolean).join(" · ");
  const phones = [
    { value: c.phone, label: t("Numéro") },
    { value: c.phone2, label: t("Numéro") },
  ].filter((p) => p.value.trim());
  return (
    <article
      className={`card spot contacts-card ${c.favorite ? "favorite" : ""}`}
      style={{ "--hue": hue } as CSSProperties}
    >
      <header
        className="contacts-head"
        onPointerEnter={enter}
        onPointerLeave={leave}
      >
        <span className="contacts-avatar" aria-hidden="true">
          {initials(c.name)}
        </span>
        <button type="button" className="contacts-name" onClick={onOpen}>
          <strong>{c.name}</strong>
          {sub && <small>{sub}</small>}
        </button>
        <button
          type="button"
          className="icon-button contacts-star"
          aria-pressed={c.favorite}
          aria-label={
            c.favorite
              ? t("Retirer {name} des favoris", { name: c.name })
              : t("Ajouter {name} aux favoris", { name: c.name })
          }
          title={
            c.favorite ? t("Retirer des favoris") : t("Ajouter aux favoris")
          }
          disabled={readOnly}
          onClick={onFavorite}
        >
          <Star size={18} />
        </button>
        {hover && (
          <HoverCard target={ref("contact", c.id)} x={hover.x} y={hover.y} />
        )}
      </header>

      {phones.length > 0 && (
        <div className="contacts-phones">
          {phones.map((p, i) => {
            const href = telHref(p.value);
            return (
              <div className="contacts-line" key={i}>
                {href ? (
                  <a
                    className="button contacts-call"
                    href={href}
                    aria-label={t("Appeler {name} au {phone}", {
                      name: c.name,
                      phone: p.value,
                    })}
                  >
                    <Phone size={16} />
                    <span>{p.value}</span>
                  </a>
                ) : (
                  <span className="contacts-call plain">
                    <Phone size={16} />
                    <span>{p.value}</span>
                  </span>
                )}
                <button
                  type="button"
                  className="icon-button contacts-copy"
                  aria-label={t("Copier le numéro {phone}", { phone: p.value })}
                  title={t("Copier")}
                  onClick={() => onCopy(p.value, p.label)}
                >
                  <Copy size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(c.email || c.radio || c.address) && (
        <ul className="contacts-details">
          {c.email && (
            <li>
              <Mail size={14} aria-hidden="true" />
              <a href={`mailto:${c.email}`}>{c.email}</a>
              <button
                type="button"
                className="icon-button contacts-copy"
                aria-label={t("Copier l’adresse e-mail {email}", {
                  email: c.email,
                })}
                title={t("Copier")}
                onClick={() => onCopy(c.email, t("E-mail"))}
              >
                <Copy size={14} />
              </button>
            </li>
          )}
          {c.radio && (
            <li>
              <Radio size={14} aria-hidden="true" />
              <span className="mono">{c.radio}</span>
            </li>
          )}
          {c.address && (
            <li>
              <MapPin size={14} aria-hidden="true" />
              <span>{c.address}</span>
              <button
                type="button"
                className="icon-button contacts-copy"
                aria-label={t("Copier l’adresse {address}", {
                  address: c.address,
                })}
                title={t("Copier")}
                onClick={() => onCopy(c.address, t("Adresse"))}
              >
                <Copy size={14} />
              </button>
            </li>
          )}
        </ul>
      )}

      {c.notes && <p className="contacts-notes">{c.notes}</p>}

      <footer className="contacts-foot">
        {showCategory && c.category && (
          <span className="pill plain">{c.category}</span>
        )}
        {links > 0 && (
          <span
            className="contacts-links"
            title={tn(links, "{n} lien", "{n} liens")}
          >
            <Link2 size={12} />
            {links}
          </span>
        )}
        <button type="button" className="small contacts-edit" onClick={onOpen}>
          <Pencil size={12} />
          {readOnly ? t("Voir") : t("Modifier")}
        </button>
      </footer>
    </article>
  );
}

function ImportPreview({
  pending,
  onClose,
  onImport,
}: {
  pending: Pending;
  onClose: () => void;
  onImport: (list: ContactDraft[]) => void;
}) {
  const list = pending.fresh.slice(0, pending.room);
  const cut = pending.fresh.length - list.length;
  return (
    <Modal title={t("Importer des contacts")} onClose={onClose}>
      <div className="stack contacts-import">
        <p>
          <strong>{pending.file}</strong>
        </p>
        <div className="contacts-import-stats">
          <span className="pill ok">
            {t("{n} à importer", { n: list.length })}
          </span>
          {pending.duplicates > 0 && (
            <span className="pill muted">
              {tn(
                pending.duplicates,
                "{n} déjà présent, ignoré",
                "{n} déjà présents, ignorés",
              )}
            </span>
          )}
          {cut > 0 && (
            <span className="pill warn">
              {t("{n} au-delà de la limite de 5000", { n: cut })}
            </span>
          )}
        </div>
        {list.length > 0 ? (
          <div className="table-scroll contacts-import-table">
            <table className="grid dense">
              <thead>
                <tr>
                  <th>{t("Nom")}</th>
                  <th>{t("Organisation")}</th>
                  <th>{t("Téléphone")}</th>
                  <th>{t("Catégorie")}</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 6).map((c, i) => (
                  <tr key={i}>
                    <td>{c.name}</td>
                    <td>
                      {c.organization || <span className="muted">—</span>}
                    </td>
                    <td className="mono">
                      {c.phone || <span className="muted">—</span>}
                    </td>
                    <td>{c.category || <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length > 6 && (
              <p className="muted">
                {tn(list.length - 6, "… et {n} autre.", "… et {n} autres.")}
              </p>
            )}
          </div>
        ) : (
          <p className="muted">
            {t(
              "Rien de nouveau : tous ces contacts sont déjà dans l’annuaire.",
            )}
          </p>
        )}
        <p className="muted contacts-import-note">
          {t(
            "Le fichier est lu sur cet appareil, rien n’est envoyé sur internet.",
          )}
        </p>
        <div className="modal-actions">
          <button onClick={onClose}>
            {list.length ? t("Annuler") : t("Fermer")}
          </button>
          {list.length > 0 && (
            <button className="primary" onClick={() => onImport(list)}>
              <FileUp size={15} />
              {tn(list.length, "Importer {n} contact", "Importer {n} contacts")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default Contacts;
