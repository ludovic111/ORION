import { useState } from "react";
import {
  FileSearch,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
} from "lucide-react";
import { dateTime } from "../../shared/journal";
import type { ExportLog } from "../../shared/ops";
import { useApp } from "../app/context";
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

type Result =
  | { kind: "file"; name: string; sha: string; found: ExportLog[] }
  | {
      kind: "code";
      code: { id: string; fingerprint: string };
      byDocument: ExportLog[];
      sameContent: ExportLog[];
    };

const size = (n: number) =>
  n < 1024
    ? `${n} o`
    : n < 1024 * 1024
      ? `${(n / 1024).toFixed(0)} ko`
      : `${(n / 1024 / 1024).toFixed(1)} Mo`;

function LogLine({ log }: { log: ExportLog }) {
  return (
    <li className="xv-log">
      <strong>{log.name}</strong>
      <span>
        {log.format} · exporté par {log.by || "—"} le {dateTime(log.at)} ·{" "}
        {size(log.bytes)}
      </span>
      <span>
        Contenu : {log.scope.replace(/ · document [0-9a-f-]{36}$/, "")}
      </span>
      <code>
        document {shortId(documentOf(log))} · empreinte {log.fingerprint}
      </code>
    </li>
  );
}

export function VerifyPanel({ className = "" }: { className?: string }) {
  const { live } = useApp();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const logs = live.ops.exports;

  async function check(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const sha = await sha256Hex(await file.arrayBuffer());
      setResult({
        kind: "file",
        name: file.name,
        sha,
        found: logs.filter((l) => l.sha256 === sha),
      });
    } catch {
      setError("Ce fichier n’a pas pu être lu.");
    } finally {
      setBusy(false);
    }
  }
  function checkCode(value: string) {
    setError("");
    setResult(null);
    const parsed = parseVerify(value);
    if (!parsed) {
      setError(
        "Code non reconnu. Il commence par « orionaic:verify: » (texte du code QR).",
      );
      return;
    }
    setResult({ kind: "code", code: parsed, ...matchVerify(logs, parsed) });
  }

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
        <strong>Déposer un document à vérifier</strong>
        <span className="mono">
          PDF, Word, Excel, archive… · calcul local, rien n’est envoyé
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
          checkCode(code);
        }}
      >
        <label>
          <span>
            <QrCode size={12} /> Ou le texte du code QR
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
              Vérifier
            </button>
          </div>
        </label>
      </form>
      {busy && <p role="status">Calcul de l’empreinte…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {result?.kind === "file" && (
        <div
          className={`xv-result ${result.found.length ? "ok" : "unknown"}`}
          role="status"
        >
          {result.found.length ? (
            <ShieldCheck size={26} />
          ) : (
            <ShieldAlert size={26} />
          )}
          <div>
            <h3>
              {result.found.length
                ? "Document authentique"
                : "Document inconnu"}
            </h3>
            {result.found.length ? (
              <p>
                Ce fichier est exactement celui produit par orion aic et inscrit
                au registre de cette opération.
              </p>
            ) : (
              <p>
                Ce fichier n’a pas été produit par cette session, ou il a été
                modifié depuis (même d’un seul caractère).
              </p>
            )}
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
          className={`xv-result ${result.byDocument.length || result.sameContent.length ? "ok" : "unknown"}`}
          role="status"
        >
          {result.byDocument.length || result.sameContent.length ? (
            <ShieldCheck size={26} />
          ) : (
            <ShieldAlert size={26} />
          )}
          <div>
            <h3>
              {result.byDocument.length
                ? "Export connu"
                : result.sameContent.length
                  ? "Contenu connu"
                  : "Code inconnu"}
            </h3>
            <p>
              {result.byDocument.length
                ? "Ce code correspond à un export inscrit au registre. Pour certifier un fichier précis, déposez-le ci-dessus."
                : result.sameContent.length
                  ? "Ce document n’est pas au registre, mais le même contenu a été exporté."
                  : "Aucun export de cette opération ne porte ce code."}
            </p>
            <ul className="xv-logs">
              {[...result.byDocument, ...result.sameContent].map((l) => (
                <LogLine key={l.id} log={l} />
              ))}
            </ul>
            <code className="xv-sha">
              document {shortId(result.code.id)} · empreinte{" "}
              {result.code.fingerprint}
            </code>
          </div>
        </div>
      )}
      <p className="xv-count muted">
        {logs.length} fichier{logs.length > 1 ? "s" : ""} au registre des
        exports de « {live.title} ».
      </p>
    </div>
  );
}
