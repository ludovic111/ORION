import { useEffect, useState } from "react";
import {
  FileSearch,
  KeyRound,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
} from "lucide-react";
import { dateTime } from "../../shared/journal";
import type { ExportLog } from "../../shared/ops";
import {
  keyFingerprint,
  parseSignedCode,
  verifyCode,
  verifyFile,
  verifyObject,
  verifyPdf,
  type Verdict,
} from "../../shared/signature";
import { useApp } from "../app/context";
import { rich, useLang } from "../i18n";
import { t, tn } from "./i18n.ts";
import {
  documentOf,
  matchVerify,
  parseVerify,
  sha256Hex,
  shortId,
} from "./stamp";
import "./export.css";

// Check a document against the register of the exports: its SHA-256 must be
// one of the files produced by this operation. A verification code (QR) is
// matched by document id, then by fingerprint of the content.
//
// Signatures (shared/signature.ts): a PDF carries its signature after its
// end, an archive in its envelope, a printed code in its text; every line
// of the register carries the signature of its file. Each is checked here
// and the key is named when this operation knows it.

type Result =
  | {
      kind: "file";
      name: string;
      sha: string;
      found: ExportLog[];
      /** Signature carried by the file itself. */
      own: Verdict;
      /** Signature of the register lines matching the file. */
      register: Verdict;
    }
  | {
      kind: "code";
      code: { id: string; fingerprint: string };
      byDocument: ExportLog[];
      sameContent: ExportLog[];
      own: Verdict;
    };

const size = (n: number) =>
  n < 1024
    ? t("{n} o", { n })
    : n < 1024 * 1024
      ? t("{n} ko", { n: (n / 1024).toFixed(0) })
      : t("{n} Mo", { n: (n / 1024 / 1024).toFixed(1) });

/** Format of a register line; prints are written in French (reminders). */
const formatLabel = (format: string) =>
  format === "Impression (HTML)" ? t("Impression (HTML)") : format;

function LogLine({ log }: { log: ExportLog }) {
  return (
    <li className="xv-log">
      <strong>{log.name}</strong>
      <span>
        {t("{format} · exporté par {name} le {date} · {size}", {
          format: formatLabel(log.format),
          name: log.by || "—",
          date: dateTime(log.at),
          size: size(log.bytes),
        })}
      </span>
      <span>
        {t("{label} : {value}", {
          label: t("Contenu"),
          value: log.scope.replace(/ · document [0-9a-f-]{36}$/, ""),
        })}
      </span>
      <code>
        {t("document {id} · empreinte {fingerprint}", {
          id: shortId(documentOf(log)),
          fingerprint: log.fingerprint,
        })}
      </code>
    </li>
  );
}

/** Signature carried by a file: PDF (after its end) or JSON (envelope). */
async function fileSignature(bytes: Uint8Array): Promise<Verdict> {
  const head = String.fromCharCode(...bytes.subarray(0, 5));
  if (head === "%PDF-") return verifyPdf(bytes);
  if (bytes[0] !== 0x7b) return { state: "none" };
  try {
    return await verifyObject(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return { state: "none" };
  }
}

/** Signature of the register lines of a file (the first one that has one). */
async function registerSignature(
  logs: ExportLog[],
  sha: string,
): Promise<Verdict> {
  for (const log of logs) {
    if (!log.signature) continue;
    const ok = await verifyFile(log.signature, sha);
    return {
      state: ok ? "valid" : "invalid",
      alg: log.signature.alg,
      fingerprint: await keyFingerprint(log.signature.key),
      at: log.signature.at,
      sha,
    };
  }
  return { state: "none" };
}

/** Fingerprints of the keys seen in the register, with who exported. */
function useKnownKeys(logs: ExportLog[], own?: string) {
  const [known, setKnown] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    let alive = true;
    (async () => {
      const map = new Map<string, Set<string>>();
      const keys = new Map<string, string>();
      for (const l of logs) {
        if (!l.signature) continue;
        let fp = keys.get(l.signature.key);
        if (!fp) {
          fp = await keyFingerprint(l.signature.key);
          keys.set(l.signature.key, fp);
        }
        if (!map.has(fp)) map.set(fp, new Set());
        if (l.by) map.get(fp)!.add(l.by);
      }
      const out = new Map(
        [...map].map(([fp, names]) => [fp, [...names].join(", ")]),
      );
      if (own) {
        const mine = await keyFingerprint(own);
        out.set(mine, t("ce poste"));
      }
      if (alive) setKnown(out);
    })();
    return () => {
      alive = false;
    };
  }, [logs, own]);
  return known;
}

function SignatureLine({
  verdict,
  label,
  known,
}: {
  verdict: Verdict;
  label: string;
  known: Map<string, string>;
}) {
  if (verdict.state === "none") return null;
  const who = known.get(verdict.fingerprint);
  return (
    <div className={`xv-signature ${verdict.state}`}>
      <KeyRound size={14} />
      <div>
        <strong>
          {verdict.state === "valid"
            ? t("{label} : signature valide", { label })
            : t("{label} : signature invalide", { label })}
        </strong>
        <span>
          {verdict.state === "valid"
            ? t(
                "Rien n’a changé depuis la signature du {date} (heure du poste signataire).",
                { date: dateTime(verdict.at) },
              )
            : t(
                "Le contenu a été modifié après la signature, ou la signature a été altérée.",
              )}
        </span>
        <code>
          {t("Clé {key} · {alg}", {
            key: verdict.fingerprint,
            alg: verdict.alg,
          })}
          {who
            ? ` · ${t("connue : {who}", { who })}`
            : ` · ${t("clé inconnue de cette opération")}`}
        </code>
      </div>
    </div>
  );
}

export function VerifyPanel({ className = "" }: { className?: string }) {
  const { live, workspace } = useApp();
  useLang();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const logs = live.ops.exports;
  const known = useKnownKeys(logs, workspace.signing?.publicKey);
  const [mine, setMine] = useState("");
  useEffect(() => {
    const key = workspace.signing?.publicKey;
    if (key) void keyFingerprint(key).then(setMine);
  }, [workspace.signing?.publicKey]);

  async function check(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const sha = await sha256Hex(bytes);
      const found = logs.filter((l) => l.sha256 === sha);
      setResult({
        kind: "file",
        name: file.name,
        sha,
        found,
        own: await fileSignature(bytes),
        register: await registerSignature(found, sha),
      });
    } catch {
      setError(t("Ce fichier n’a pas pu être lu."));
    } finally {
      setBusy(false);
    }
  }
  async function checkCode(value: string) {
    setError("");
    setResult(null);
    const parsed = parseVerify(value);
    if (!parsed) {
      setError(
        t(
          "Code non reconnu. Il commence par « orionaic:verify: » (texte du code QR).",
        ),
      );
      return;
    }
    const signed = parseSignedCode(value);
    setResult({
      kind: "code",
      code: parsed,
      ...matchVerify(logs, parsed),
      own: signed ? await verifyCode(signed) : { state: "none" },
    });
  }

  const invalid =
    result &&
    (result.own.state === "invalid" ||
      (result.kind === "file" && result.register.state === "invalid"));
  const signedOk =
    result &&
    (result.own.state === "valid" ||
      (result.kind === "file" && result.register.state === "valid"));

  return (
    <div className={`xv ${className}`}>
      <label
        className={`dropzone xv-drop${over ? " over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void check(e.dataTransfer.files[0]);
        }}
      >
        <FileSearch size={22} />
        <strong>{t("Déposer un document à vérifier")}</strong>
        <span className="mono">
          {t("PDF, Word, Excel, archive… · calcul local, rien n’est envoyé")}
        </span>
        <input
          type="file"
          disabled={busy}
          onChange={(e) => {
            void check(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      <form
        className="xv-code"
        onSubmit={(e) => {
          e.preventDefault();
          void checkCode(code);
        }}
      >
        <label>
          <span>
            <QrCode size={12} /> {t("Ou le texte du code QR")}
          </span>
          <div className="inline-field">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="orionaic:verify:…"
              spellCheck={false}
              autoComplete="off"
            />
            <button type="submit" disabled={!code.trim()}>
              {t("Vérifier")}
            </button>
          </div>
        </label>
      </form>
      {busy && <p role="status">{t("Calcul de l’empreinte…")}</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {result?.kind === "file" && (
        <div
          className={`xv-result ${invalid ? "unknown" : result.found.length || signedOk ? "ok" : "unknown"}`}
          role="status"
        >
          {!invalid && (result.found.length || signedOk) ? (
            <ShieldCheck size={26} />
          ) : (
            <ShieldAlert size={26} />
          )}
          <div>
            <h3>
              {invalid
                ? t("Document modifié")
                : result.found.length
                  ? t("Document authentique")
                  : signedOk
                    ? t("Document intact, signé")
                    : t("Document inconnu")}
            </h3>
            {invalid ? (
              <p>
                {t(
                  "La signature ne correspond plus au fichier : il a été modifié après avoir été signé.",
                )}
              </p>
            ) : result.found.length ? (
              <p>
                {t(
                  "Ce fichier est exactement celui produit par orion aic et inscrit au registre de cette opération.",
                )}
              </p>
            ) : signedOk ? (
              <p>
                {t(
                  "Ce fichier n’est pas au registre de cette opération, mais il porte une signature valide : il n’a pas changé depuis qu’il a été signé par la clé ci-dessous.",
                )}
              </p>
            ) : (
              <p>
                {t(
                  "Ce fichier n’a pas été produit par cette session, ou il a été modifié depuis (même d’un seul caractère).",
                )}
              </p>
            )}
            <SignatureLine
              verdict={result.own}
              label={t("Fichier")}
              known={known}
            />
            <SignatureLine
              verdict={result.register}
              label={t("Registre")}
              known={known}
            />
            <ul className="xv-logs">
              {result.found.map((l) => (
                <LogLine key={l.id} log={l} />
              ))}
            </ul>
            <code className="xv-sha">
              <Fingerprint size={12} /> {result.name} · SHA-256 {result.sha}
            </code>
          </div>
        </div>
      )}
      {result?.kind === "code" && (
        <div
          className={`xv-result ${result.own.state === "invalid" ? "unknown" : result.byDocument.length || result.sameContent.length || result.own.state === "valid" ? "ok" : "unknown"}`}
          role="status"
        >
          {result.own.state !== "invalid" &&
          (result.byDocument.length ||
            result.sameContent.length ||
            result.own.state === "valid") ? (
            <ShieldCheck size={26} />
          ) : (
            <ShieldAlert size={26} />
          )}
          <div>
            <h3>
              {result.own.state === "invalid"
                ? t("Signature invalide")
                : result.byDocument.length
                  ? t("Export connu")
                  : result.sameContent.length
                    ? t("Contenu connu")
                    : result.own.state === "valid"
                      ? t("Code signé")
                      : t("Code inconnu")}
            </h3>
            <p>
              {result.own.state === "invalid"
                ? t("Ce code a été modifié après sa signature.")
                : result.byDocument.length
                  ? t(
                      "Ce code correspond à un export inscrit au registre. Pour certifier un fichier précis, déposez-le ci-dessus.",
                    )
                  : result.sameContent.length
                    ? t(
                        "Ce document n’est pas au registre, mais le même contenu a été exporté.",
                      )
                    : result.own.state === "valid"
                      ? t(
                          "Ce code n’est pas au registre de cette opération, mais sa signature est valide : l’empreinte du contenu a bien été signée par la clé ci-dessous. Comparez-la avec celle imprimée sur le document.",
                        )
                      : t("Aucun export de cette opération ne porte ce code.")}
            </p>
            <SignatureLine
              verdict={result.own}
              label={t("Code")}
              known={known}
            />
            <ul className="xv-logs">
              {[...result.byDocument, ...result.sameContent].map((l) => (
                <LogLine key={l.id} log={l} />
              ))}
            </ul>
            <code className="xv-sha">
              {t("document {id} · empreinte {fingerprint}", {
                id: shortId(result.code.id),
                fingerprint:
                  result.own.state !== "none" && result.own.sha
                    ? result.own.sha
                    : result.code.fingerprint,
              })}
            </code>
          </div>
        </div>
      )}
      <p className="xv-count muted">
        {tn(
          logs.length,
          "{n} fichier au registre des exports de « {title} ».",
          "{n} fichiers au registre des exports de « {title} ».",
          { title: live.title },
        )}
        {mine && (
          <>
            {" "}
            {rich(
              t("Clé de signature de ce poste : <0>{key}</0>.", { key: mine }),
              [<span className="mono" />],
            )}
          </>
        )}
      </p>
    </div>
  );
}
