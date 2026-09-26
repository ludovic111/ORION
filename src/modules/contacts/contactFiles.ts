import type { Contact } from "../../../shared/ops";
import { t, tIn } from "./i18n.ts";

// Local import and export of the directory: vCard 3/4 and CSV (Excel,
// Outlook, Google). Files never leave the browser.

export type ContactDraft = Omit<
  Contact,
  "id" | "createdAt" | "updatedAt" | "by"
>;

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

const LIMITS: Record<Exclude<keyof ContactDraft, "favorite">, number> = {
  name: 160,
  organization: 200,
  role: 200,
  category: 80,
  phone: 80,
  phone2: 80,
  email: 200,
  radio: 80,
  address: 300,
  notes: 2000,
};

export const blankContact = (): ContactDraft => ({
  name: "",
  organization: "",
  role: "",
  category: "",
  phone: "",
  phone2: "",
  email: "",
  radio: "",
  address: "",
  notes: "",
  favorite: false,
});

export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .trim()
    .replace(/\s+/g, " ");

export const phoneDigits = (s: string) => s.replace(/[^\d+]/g, "");

/** Same person: same name and same main number. */
export const contactKey = (c: Pick<Contact, "name" | "phone">) =>
  `${norm(c.name)}|${phoneDigits(c.phone)}`;

/** Fill in a name when missing, trim and cut every field to its limit. */
function finish(raw: Partial<ContactDraft>): ContactDraft | null {
  const c = { ...blankContact(), ...raw };
  for (const key of Object.keys(LIMITS) as (keyof typeof LIMITS)[])
    c[key] = String(c[key] ?? "")
      .trim()
      .slice(0, LIMITS[key]);
  if (!c.name)
    c.name = (c.organization || c.email || c.phone).slice(0, LIMITS.name);
  return c.name ? c : null;
}

/** Decode a file: UTF-8 when valid, otherwise Windows-1252 (old Excel). */
export async function readText(file: File) {
  const bytes = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

export function parseContacts(name: string, text: string): ContactDraft[] {
  const body = text.replace(/^\uFEFF/, "");
  if (/\.vcf$|\.vcard$/i.test(name) || /^\s*BEGIN:VCARD/i.test(body))
    return parseVCards(body);
  return parseCsvContacts(body);
}

// ---------- vCard ----------

/** Split on a separator that is not escaped with a backslash. */
function splitUnescaped(value: string, separator: string) {
  const out: string[] = [];
  let part = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "\\" && i + 1 < value.length) {
      part += ch + value[i + 1];
      i++;
    } else if (ch === separator) {
      out.push(part);
      part = "";
    } else part += ch;
  }
  out.push(part);
  return out;
}

const unescapeVCard = (value: string) =>
  value.replace(/\\([nN,;:\\])/g, (_, ch: string) =>
    ch === "n" || ch === "N" ? "\n" : ch,
  );

const encoder = new TextEncoder();
function decodeQuotedPrintable(value: string) {
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "=" && /^[0-9A-F]{2}$/i.test(value.slice(i + 1, i + 3))) {
      bytes.push(parseInt(value.slice(i + 1, i + 3), 16));
      i += 2;
    } else bytes.push(...encoder.encode(value[i]));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

type Property = { name: string; params: string; value: string };

function parseLine(line: string): Property | null {
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') quoted = !quoted;
    else if (ch === ":" && !quoted) {
      const head = line.slice(0, i);
      const [nameWithGroup, ...params] = head.split(";");
      const name = nameWithGroup.split(".").pop()!.toUpperCase();
      let value = line.slice(i + 1);
      const paramText = params.join(";").toUpperCase();
      if (paramText.includes("QUOTED-PRINTABLE"))
        value = decodeQuotedPrintable(value);
      return { name, params: paramText, value };
    }
  }
  return null;
}

function formatAddress(value: string) {
  const [box, extended, street, locality, region, code, country] =
    splitUnescaped(value, ";").map((p) =>
      unescapeVCard(p).replace(/\n/g, ", ").trim(),
    );
  return [
    street,
    extended,
    box,
    [code, locality].filter(Boolean).join(" "),
    region,
    country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function parseVCards(text: string): ContactDraft[] {
  // Unfold: a line starting with a space or a tab continues the previous one.
  const lines = text
    .replace(/\r\n?/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n");
  const out: ContactDraft[] = [];
  let card: Property[] | null = null;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const colon = line.indexOf(":");
    // vCard 2.1 quoted-printable soft line breaks.
    if (colon > 0 && /QUOTED-PRINTABLE/i.test(line.slice(0, colon)))
      while (line.endsWith("=") && i + 1 < lines.length)
        line = line.slice(0, -1) + lines[++i];
    const bare = line.trim().toUpperCase();
    if (bare === "BEGIN:VCARD") {
      card = [];
      continue;
    }
    if (bare === "END:VCARD") {
      const c = card && fromVCard(card);
      if (c) out.push(c);
      card = null;
      continue;
    }
    if (!card || !bare) continue;
    const prop = parseLine(line);
    if (prop) card.push(prop);
  }
  return out;
}

function fromVCard(props: Property[]): ContactDraft | null {
  const first = (name: string) =>
    props.find((p) => p.name === name)?.value ?? "";
  let name = unescapeVCard(first("FN"));
  if (!name.trim()) {
    const [family = "", given = "", additional = "", prefix = "", suffix = ""] =
      splitUnescaped(first("N"), ";").map(unescapeVCard);
    name = [prefix, given, additional, family, suffix]
      .filter((p) => p.trim())
      .join(" ");
  }
  const phones = props
    .filter((p) => p.name === "TEL")
    .sort(
      (a, b) => Number(/PREF/.test(b.params)) - Number(/PREF/.test(a.params)),
    )
    .map((p) => unescapeVCard(p.value).replace(/^tel:/i, "").trim())
    .filter(Boolean);
  const emails = props
    .filter((p) => p.name === "EMAIL")
    .map((p) =>
      unescapeVCard(p.value)
        .replace(/^mailto:/i, "")
        .trim(),
    )
    .filter(Boolean);
  const notes = props
    .filter((p) => p.name === "NOTE")
    .map((p) => unescapeVCard(p.value).trim());
  if (phones.length > 2)
    notes.push(
      t("Autres numéros : {list}", { list: phones.slice(2).join(", ") }),
    );
  if (emails.length > 1)
    notes.push(
      t("Autres e-mails : {list}", { list: emails.slice(1).join(", ") }),
    );
  return finish({
    name,
    organization: splitUnescaped(first("ORG"), ";")
      .map(unescapeVCard)
      .filter((p) => p.trim())
      .join(", "),
    role: unescapeVCard(first("TITLE") || first("ROLE")),
    category: unescapeVCard(splitUnescaped(first("CATEGORIES"), ",")[0] ?? ""),
    phone: phones[0] ?? "",
    phone2: phones[1] ?? "",
    email: emails[0] ?? "",
    address: formatAddress(first("ADR")),
    notes: notes.filter(Boolean).join("\n"),
  });
}

// ---------- CSV ----------

export function parseCsv(text: string): string[][] {
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const separator = [";", ",", "\t"].reduce((best, ch) =>
    count(ch) > count(best) ? ch : best,
  );
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && !cell) quoted = true;
    else if (ch === separator) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const headerKey = (s: string) => norm(s).replace(/[^a-z0-9]/g, "");

type Column = keyof ContactDraft | "firstName" | "lastName";
const HEADERS: Record<string, Column> = {};
const alias = (column: Column, names: string[]) =>
  names.forEach((n) => (HEADERS[headerKey(n)] = column));
alias("name", [
  "Nom",
  "Name",
  "Nom complet",
  "Full name",
  "Display name",
  "Nom affiché",
  "Contact",
]);
alias("firstName", ["Prénom", "First name", "Given name", "Vorname"]);
alias("lastName", [
  "Nom de famille",
  "Last name",
  "Family name",
  "Surname",
  "Nachname",
  "Cognome",
]);
alias("organization", [
  "Organisation",
  "Organization",
  "Entreprise",
  "Société",
  "Company",
  "Organisation 1 - Name",
  "Organization 1 - Name",
  "Firma",
]);
alias("role", [
  "Fonction",
  "Rôle",
  "Role",
  "Titre",
  "Title",
  "Job title",
  "Poste",
  "Organization 1 - Title",
]);
alias("category", [
  "Catégorie",
  "Category",
  "Categories",
  "Groupe",
  "Group",
  "Group Membership",
]);
alias("phone", [
  "Téléphone",
  "Tél",
  "Tel",
  "Phone",
  "Mobile",
  "Natel",
  "Portable",
  "Téléphone 1",
  "Phone 1",
  "Phone 1 - Value",
  "Mobile Phone",
  "Téléphone mobile",
  "Telefon",
]);
alias("phone2", [
  "Téléphone 2",
  "Tél 2",
  "Tel 2",
  "Phone 2",
  "Phone 2 - Value",
  "Autre téléphone",
  "Business Phone",
  "Téléphone professionnel",
  "Home Phone",
]);
alias("email", [
  "E-mail",
  "Email",
  "Courriel",
  "Mail",
  "Adresse e-mail",
  "E-mail Address",
  "E-mail 1 - Value",
]);
alias("radio", [
  "Radio",
  "Nom d’appel",
  "Nom d'appel",
  "Indicatif",
  "Call sign",
  "Callsign",
]);
alias("address", [
  "Adresse",
  "Address",
  "Adresse postale",
  "Address 1 - Formatted",
  "Business Address",
]);
alias("notes", [
  "Remarques",
  "Remarque",
  "Notes",
  "Note",
  "Commentaire",
  "Commentaires",
  "Comments",
]);
alias("favorite", ["Favori", "Favoris", "Favorite", "Starred"]);

// Titles of the columns we export, in French and in the other languages
// (a file exported by a German or Italian post is read back everywhere).
const EXPORTED: [Column, CsvHead][] = [
  ["name", "Nom"],
  ["organization", "Organisation"],
  ["role", "Fonction"],
  ["category", "Catégorie"],
  ["phone", "Téléphone"],
  ["phone2", "Téléphone 2"],
  ["email", "E-mail"],
  ["radio", "Radio"],
  ["address", "Adresse"],
  ["notes", "Remarques"],
  ["favorite", "Favori"],
];
for (const [column, head] of EXPORTED)
  for (const lang of ["fr", "de", "it"] as const) {
    const key = headerKey(tIn(lang, head));
    if (!HEADERS[key]) HEADERS[key] = column;
  }

/** A cell exported by us starts with ' when it looks like a formula. */
const unguard = (s: string) => (/^'[=+\-@]/.test(s) ? s.slice(1) : s);

export function parseCsvContacts(text: string): ContactDraft[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  let columns: (Column | undefined)[] = rows[0].map(
    (h) => HEADERS[headerKey(h)],
  );
  // "Prénom;Nom" (Outlook in French): "Nom" is then the family name.
  if (columns.includes("firstName") && !columns.includes("lastName"))
    columns = columns.map((c) => (c === "name" ? "lastName" : c));
  // "Nome;Cognome" (Outlook in Italian): "Nome" is then the first name.
  else if (columns.includes("lastName") && !columns.includes("firstName"))
    columns = columns.map((c) => (c === "name" ? "firstName" : c));
  const known = new Set(columns.filter(Boolean));
  if (!known.has("name") && !known.has("firstName") && !known.has("lastName"))
    throw new Error(
      t(
        "Colonne « Nom » introuvable. La première ligne doit contenir les titres des colonnes (Nom, Organisation, Téléphone…).",
      ),
    );
  const out: ContactDraft[] = [];
  for (const cells of rows.slice(1)) {
    const raw: Partial<Record<Column, string>> = {};
    columns.forEach((column, i) => {
      const value = unguard((cells[i] ?? "").trim());
      if (column && value && !raw[column]) raw[column] = value;
    });
    const { firstName, lastName, favorite, ...fields } = raw;
    const c = finish({
      ...fields,
      name: fields.name || [firstName, lastName].filter(Boolean).join(" "),
      favorite: /^(oui|yes|ja|sì|si|x|1|true|vrai|\*)$/i.test(favorite ?? ""),
    });
    if (c) out.push(c);
  }
  return out;
}

type CsvHead = Parameters<typeof t>[0];

/** Titles of the exported columns, in the language of the post. */
export const csvHead = () => EXPORTED.map(([, head]) => t(head));

/** Neutralise spreadsheet formulas and quote when needed. */
export function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\n\r,]|^\s|\s$/.test(safe)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe;
}

export function contactsCsv(list: Contact[]) {
  const rows = list.map((c) => [
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
    c.favorite ? t("oui") : "",
  ]);
  return `\uFEFF${[csvHead(), ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n")}\r\n`;
}
