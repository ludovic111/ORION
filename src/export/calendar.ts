import type { Journal } from "../../shared/journal.ts";
import type { AgendaItem, Contact } from "../../shared/ops.ts";
import type { DocumentStamp } from "./stamp.ts";
import { t } from "./i18n.ts";

// Calendar (.ics, RFC 5545) of the rhythm of command and address book
// (.vcf, vCard 4.0, RFC 6350) of the contacts. Lines are folded at 75
// octets, texts escaped, times in UTC.

const encoder = new TextEncoder();

/** Fold a content line at 75 octets without cutting a UTF-8 character. */
export function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const bytes = encoder.encode(ch).length;
    const limit = out.length ? 74 : 75;
    if (size + bytes > limit) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += bytes;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** TEXT value: backslash, semicolon, comma and line breaks escaped. */
export const escapeText = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");

const utc = (ms: number) =>
  new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

const lines = (list: (string | false | undefined)[]) =>
  list
    .filter((l): l is string => !!l)
    .map(fold)
    .join("\r\n");

export function agendaIcs(
  journal: Journal,
  items: AgendaItem[],
  stamp: DocumentStamp,
  now = Date.now(),
): string {
  const events = [...items]
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .map((a) => {
      const start = Date.parse(a.at);
      const description = [
        a.kind && t("Type : {kind}", { kind: a.kind }),
        a.participants && t("Participants : {list}", { list: a.participants }),
        a.notes,
        `${journal.title} · orion aic`,
      ]
        .filter(Boolean)
        .join("\n");
      return lines([
        "BEGIN:VEVENT",
        `UID:${a.id}@orionaic`,
        `DTSTAMP:${utc(now)}`,
        `CREATED:${utc(Date.parse(a.createdAt))}`,
        `LAST-MODIFIED:${utc(Date.parse(a.updatedAt))}`,
        `DTSTART:${utc(start)}`,
        a.minutes > 0 && `DTEND:${utc(start + a.minutes * 60_000)}`,
        `SUMMARY:${escapeText(a.title)}`,
        a.location && `LOCATION:${escapeText(a.location)}`,
        `DESCRIPTION:${escapeText(description)}`,
        a.kind && `CATEGORIES:${escapeText(a.kind)}`,
        `STATUS:CONFIRMED`,
        `TRANSP:OPAQUE`,
        "END:VEVENT",
      ]);
    });
  return `${lines([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//orion aic//Rythme de conduite//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(t("{title} · rythme de conduite", { title: journal.title }))}`,
    "X-WR-TIMEZONE:Europe/Zurich",
    `X-WR-CALDESC:${escapeText(stamp.label)}`,
  ])}\r\n${events.map((e) => `${e}\r\n`).join("")}END:VCALENDAR\r\n`;
}

/** Structured value component: ; and , escaped as well. */
const component = (s: string) => escapeText(s.trim());

export function contactsVcf(contacts: Contact[], stamp: DocumentStamp): string {
  return contacts
    .map((c) => {
      const words = c.name.trim().split(/\s+/);
      const family = words.length > 1 ? words[words.length - 1] : "";
      const given =
        words.length > 1 ? words.slice(0, -1).join(" ") : c.name.trim();
      const note = [
        c.notes,
        c.radio && t("Radio : {radio}", { radio: c.radio }),
        t("Exporté par orion aic · {stamp}", { stamp: stamp.label }),
      ]
        .filter(Boolean)
        .join("\n");
      return `${lines([
        "BEGIN:VCARD",
        "VERSION:4.0",
        `UID:urn:uuid:${c.id}`,
        `FN:${escapeText(c.name)}`,
        `N:${component(family)};${component(given)};;;`,
        c.organization && `ORG:${component(c.organization)}`,
        c.role && `TITLE:${escapeText(c.role)}`,
        c.phone &&
          `TEL;VALUE=text;TYPE=work,voice;PREF=1:${escapeText(c.phone)}`,
        c.phone2 && `TEL;VALUE=text;TYPE=voice:${escapeText(c.phone2)}`,
        c.email && `EMAIL;TYPE=work:${escapeText(c.email)}`,
        c.address && `ADR;TYPE=work:;;${component(c.address)};;;;`,
        c.category && `CATEGORIES:${component(c.category)}`,
        `NOTE:${escapeText(note)}`,
        `REV:${utc(Date.parse(c.updatedAt))}`,
        "END:VCARD",
      ])}\r\n`;
    })
    .join("");
}
