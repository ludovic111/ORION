import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Cable,
  Check,
  Copy,
  Megaphone,
  Send,
  Unplug,
} from "lucide-react";
import { useApp } from "../app/context";
import { ComboField, TextField } from "../ui/fields";
import { dateTime, time } from "../../shared/journal";
import { upsert } from "../../shared/ops";
import {
  codeProblem,
  newRoomCode,
  normalizeCode,
  validCode,
} from "../../shared/room";
import { lastExchange, pendingOut } from "../../shared/liaison";
import type { Liaison } from "../../shared/conduct";
import { openDiffusion, openLiaisonMessage } from "../post/bus";
import { usePost } from "../post/store";
import {
  liaisonState,
  useLiaisonStates,
  type LiaisonState,
} from "./useLiaisons";
import "../post/conduct.css";

const STATUS: Record<LiaisonState["status"], string> = {
  off: "Arrêtée",
  connecting: "Connexion…",
  waiting: "Connectée · l’autre PC n’est pas en ligne",
  live: "En liaison",
  retrying: "Reconnexion…",
  outdated: "Version différente : rechargez la page",
};

/**
 * Liaison between two command posts, each with its own session: open one
 * (a liaison code), see its state and what crossed it, send a message.
 */
export function LiaisonPanel() {
  const { live, author, readOnly, canWrite, updateOps, toast, lists } =
    useApp();
  const [post] = usePost();
  const states = useLiaisonStates();
  const [name, setName] = useState("PC arrière");
  const [self, setSelf] = useState(post.cell || "PC front");
  const [typed, setTyped] = useState("");
  const secure = window.isSecureContext;
  const liaisons = [...live.ops.liaisons].sort(
    (a, b) =>
      Number(!!a.closedAt) - Number(!!b.closedAt) ||
      b.openedAt.localeCompare(a.openedAt),
  );
  const pcs = lists("recipients").filter((v) => /^pc\b/i.test(v));

  function create(code: string) {
    if (!name.trim() || !self.trim() || !canWrite()) return;
    try {
      updateOps((ops) =>
        upsert(
          ops,
          "liaisons",
          {
            name: name.trim(),
            self: self.trim(),
            code: normalizeCode(code),
            openedAt: new Date().toISOString(),
            closedAt: "",
            notes: "",
          },
          author,
        ),
      );
      setTyped("");
      toast(`Liaison avec ${name.trim()} ouverte.`);
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function close(l: Liaison) {
    if (!canWrite()) return;
    if (
      !window.confirm(
        `Fermer la liaison avec ${l.name} ? Le code est effacé ; ce qui a été échangé reste au journal.`,
      )
    )
      return;
    updateOps((ops) =>
      upsert(
        ops,
        "liaisons",
        { ...l, code: "", closedAt: new Date().toISOString() },
        author,
      ),
    );
    toast(`Liaison avec ${l.name} fermée.`);
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="muted">
        Un PC front et un PC arrière travaillent chacun dans leur propre
        session. Une liaison les relie sans rien mélanger : seuls les messages,
        les diffusions (avec leur ordre) et les accusés de lecture envoyés
        exprès passent de l’un à l’autre, chiffrés avec le code de liaison, par
        le même relais qui ne garde rien.
      </p>
      {liaisons.map((l) => (
        <LiaisonCard
          key={l.id}
          liaison={l}
          state={liaisonState(states, l.id)}
          onClose={() => close(l)}
          readOnly={readOnly}
        />
      ))}
      {!readOnly && (
        <div className="card stack">
          <strong>
            <Cable size={16} /> Ouvrir une liaison avec un autre PC
          </strong>
          <div className="form-grid">
            <ComboField
              label="L’autre PC"
              value={name}
              onChange={setName}
              options={pcs}
              hint="Nom sous lequel il apparaît ici (destinataire des diffusions)."
            />
            <ComboField
              label="Ce PC"
              value={self}
              onChange={setSelf}
              options={pcs}
              hint="Nom sous lequel l’autre PC vous voit (émetteur)."
            />
          </div>
          <div className="form-grid">
            <div className="stack">
              <p className="muted">
                Premier des deux PC : créez le code et transmettez-le à l’autre
                comme un mot de passe (téléphone, radio chiffrée, papier).
              </p>
              <button
                className="primary"
                disabled={!secure || !name.trim() || !self.trim()}
                onClick={() => create(newRoomCode())}
              >
                Créer un code de liaison
              </button>
            </div>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                if (validCode(typed)) create(typed);
              }}
            >
              <TextField
                label="Code de liaison reçu"
                value={typed}
                onChange={(v) => setTyped(normalizeCode(v))}
                placeholder="ABCD-EFGH-JKMN-PQRS"
              />
              {typed && codeProblem(typed) && (
                <p className="hint warn">
                  {codeProblem(typed).replace(/de session/g, "de liaison")}
                </p>
              )}
              <button disabled={!secure || !validCode(typed) || !name.trim()}>
                Rejoindre la liaison
              </button>
            </form>
          </div>
          {!secure && (
            <p className="hint warn">
              Cette page n’est pas en HTTPS : le chiffrement est indisponible.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LiaisonCard({
  liaison: l,
  state,
  onClose,
  readOnly,
}: {
  liaison: Liaison;
  state: LiaisonState;
  onClose: () => void;
  readOnly: boolean;
}) {
  const { live, toast } = useApp();
  const [copied, setCopied] = useState(false);
  const pending = pendingOut(live.ops, l.id);
  const last = lastExchange(live.ops, l.id);
  const log = live.ops.exchanges
    .filter((x) => x.liaisonId === l.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
  const closed = !!l.closedAt;
  return (
    <div className="card liaison-card">
      <div className="card-head">
        <h3>
          {l.self} ↔ {l.name}
        </h3>
        <span
          className={`pill ${closed ? "muted" : state.status === "live" ? "ok" : "plain"}`}
        >
          {closed ? `Fermée ${dateTime(l.closedAt)}` : STATUS[state.status]}
        </span>
      </div>
      {!closed && (
        <div className="stack" style={{ gap: 4 }}>
          <span className="label">Code de liaison</span>
          <span className="liaison-code">{l.code}</span>
        </div>
      )}
      <dl className="spec compact">
        <div>
          <dt>Dernier échange</dt>
          <dd>{last ? dateTime(last) : "—"}</dd>
        </div>
        <div>
          <dt>En attente de l’autre PC</dt>
          <dd>{pending.length}</dd>
        </div>
        <div>
          <dt>En ligne de l’autre côté</dt>
          <dd>
            {state.peers.length ? state.peers.map((p) => p.pc).join(", ") : "—"}
          </dd>
        </div>
      </dl>
      {state.error && <p className="hint warn">{state.error}</p>}
      {log.length > 0 && (
        <ul className="receipts" aria-label="Derniers échanges">
          {log.map((x) => (
            <li key={x.id}>
              <span>
                {x.direction === "out" ? (
                  <ArrowUpRight size={13} aria-label="Envoyé" />
                ) : (
                  <ArrowDownLeft size={13} aria-label="Reçu" />
                )}{" "}
                {x.kind === "ack"
                  ? "Accusé"
                  : x.kind === "broadcast"
                    ? "Diffusion"
                    : "Message"}{" "}
                · {x.title || "—"}
              </span>
              <span
                className={`state ${x.direction === "out" && !x.deliveredAt ? "late" : "ok"}`}
              >
                {x.direction === "in"
                  ? `reçu ${time(x.createdAt)}`
                  : x.deliveredAt
                    ? `remis ${time(x.deliveredAt)}`
                    : "en attente"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!closed && !readOnly && (
        <div className="action-row">
          <button onClick={() => openLiaisonMessage(l.id)}>
            <Send size={14} />
            Message à {l.name}
          </button>
          <button
            onClick={() =>
              openDiffusion({ recipients: [l.name], ack: "Compris" })
            }
          >
            <Megaphone size={14} />
            Diffuser à {l.name}
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(l.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                toast(l.code);
              }
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            Copier le code
          </button>
          <button className="danger" onClick={onClose}>
            <Unplug size={14} />
            Fermer la liaison
          </button>
        </div>
      )}
    </div>
  );
}
