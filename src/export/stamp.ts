import { dateTime, type Journal } from "../../shared/journal.ts";
import { stableStringify } from "../../shared/history.ts";
import type { ExportLog } from "../../shared/ops.ts";
import {
  keyFingerprint,
  shortFingerprint,
  signCode,
  type SigningKey,
} from "../../shared/signature.ts";

// Integrity of the files produced. Before writing, every export gets a
// document id and the fingerprint of its content (SHA-256 of the canonical
// JSON of the journal exported, 16 hex). Both are printed on the document
// (footer label and QR code). After writing, the SHA-256 of the file itself
// goes to the register (ops.exports) so that anyone can later check a file.
//
// Register ids: record() gives each register line its own id, so the
// document id travels in the scope text of the line ("… · document <id>").
// A QR code is matched by that id or, failing that, by the fingerprint.

/** Same shape as DocumentStamp of src/present/export.ts. */
export type DocumentStamp = {
  /** Document id, printed in the QR code and kept in the register. */
  id: string;
  /** Fingerprint of the content exported (16 hex). */
  fingerprint: string;
  /** Line printed in the footer of every page. */
  label: string;
  /** Text of the verification QR code. */
  qr: string;
  /** Signed stamp: SHA-256 of the content and fingerprint of the key. */
  content?: string;
  key?: string;
  alg?: string;
};

export const VERIFY_PREFIX = "orionaic:verify:";

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/** SHA-256 of bytes or of a text (UTF-8), in hex. */
export async function sha256Hex(
  data: Uint8Array | ArrayBuffer | string,
): Promise<string> {
  const bytes =
    typeof data === "string" ? new TextEncoder().encode(data) : data;
  return hex(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

/** Fingerprint of a journal: SHA-256 of its canonical JSON, 16 hex. */
export async function fingerprintOf(journal: Journal): Promise<string> {
  return (await sha256Hex(stableStringify(journal))).slice(0, 16);
}

export const shortId = (id: string) =>
  id.replaceAll("-", "").slice(0, 8).toUpperCase();

export function makeStamp(
  id: string,
  fingerprint: string,
  author: string,
  at: string,
): DocumentStamp {
  return {
    id,
    fingerprint,
    label: [
      "orion aic",
      `export ${shortId(id)}`,
      `empreinte ${fingerprint}`,
      dateTime(at).replace(",", ""),
      author.trim(),
    ]
      .filter(Boolean)
      .join(" · "),
    qr: `${VERIFY_PREFIX}${id}:${fingerprint}`,
  };
}

/** SHA-256 of the canonical JSON of a journal (64 hex). */
export const contentHashOf = (journal: Journal) =>
  sha256Hex(stableStringify(journal));

/**
 * The stamp signed by this post: the QR code carries the SHA-256 of the
 * content, the time, the public key and the signature (shared/signature.ts);
 * the footer shows the short fingerprint of the key.
 */
export async function signStamp(
  stamp: DocumentStamp,
  key: SigningKey,
  content: string,
  at: string,
): Promise<DocumentStamp> {
  const fingerprint = await keyFingerprint(key.publicKey);
  return {
    ...stamp,
    content,
    key: fingerprint,
    alg: key.alg,
    label: `${stamp.label} · clé ${shortFingerprint(fingerprint)}`,
    qr: await signCode(key, stamp.qr, stamp.id, content, at),
  };
}

/** Watermark proposed for a journal: exercise and / or confidential. */
export function autoWatermark(
  journal: Pick<Journal, "mode" | "classification">,
) {
  return [
    journal.mode === "Exercice" ? "EXERCICE" : "",
    journal.classification === "Confidentiel" ? "CONFIDENTIEL" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Id and fingerprint read from a QR code text (or a label). */
export function parseVerify(
  text: string,
): { id: string; fingerprint: string } | null {
  const t = text.trim().toLowerCase();
  const full = t.match(
    /orionaic:verify:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([0-9a-f]{16})/,
  );
  if (full) return { id: full[1], fingerprint: full[2] };
  const label = t.match(/export ([0-9a-f]{8}).*?empreinte ([0-9a-f]{16})/);
  if (label) return { id: label[1], fingerprint: label[2] };
  return null;
}

/** Text kept in the scope field of the register. */
export const registerScope = (scopeLabel: string, id: string) =>
  `${scopeLabel} · document ${id}`.slice(0, 2000);

/** Document id kept in a register line, if any. */
export const documentOf = (log: Pick<ExportLog, "scope" | "id">) =>
  log.scope.match(/document ([0-9a-f-]{36})\s*$/)?.[1] ?? log.id;

/** Register lines matching a verification code: same document, then same content. */
export function matchVerify(
  logs: ExportLog[],
  code: { id: string; fingerprint: string },
) {
  const byDocument = logs.filter((l) => {
    const doc = documentOf(l);
    return code.id.length === 8
      ? shortId(doc).toLowerCase() === code.id
      : doc === code.id;
  });
  const sameContent = logs.filter(
    (l) => !byDocument.includes(l) && l.fingerprint === code.fingerprint,
  );
  return { byDocument, sameContent };
}
