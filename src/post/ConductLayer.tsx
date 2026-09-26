import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCheck, Megaphone } from "lucide-react";
import { useApp } from "../app/context";
import type { Ops } from "../../shared/ops";
import type { Ref } from "../../shared/links";
import { attentionCount, inbox } from "../../shared/diffusion";
import { toForward } from "../../shared/liaison";
import { time } from "../../shared/journal";
import { useLiaisons } from "../liaison/useLiaisons";
import { acknowledge } from "./actions";
import { ConductDialogs } from "./dialogs";
import { landingOf, useIdentity } from "./roles";
import { usePost } from "./store";
import { useAlerts } from "./useAlerts";
import { unlockAudio } from "./notify";
import "./conduct.css";

// Everything the conduct features do whatever the module shown: alerts,
// liaisons with another command post, receipts to give (banner), the page
// title, the landing module of the post's function, and their dialogs.
// Mounted once by the shell, inside <main>.

export function ConductLayer() {
  const { live, author, viewAt, updateOps, canWrite, open, toast, go, module } =
    useApp();
  // Live time, also while the time machine shows the past.
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const [post] = usePost();
  const me = useIdentity(live, author);

  /** Writes made by the services (not by a click): silent when refused. */
  const write = useCallback(
    (change: (ops: Ops) => Ops) => {
      if (viewAt !== null || live.closedAt) return false;
      try {
        updateOps(change);
        return true;
      } catch {
        return false;
      }
    },
    [viewAt, live.closedAt, updateOps],
  );

  useAlerts({ journal: live, me, post, now, open, toast });
  useLiaisons({ journal: live, author, write });

  // Diffusions to another command post and receipts to send back are
  // queued as soon as they exist (the same ids on every post).
  const { broadcasts, acks, liaisons, orders, exchanges } = live.ops;
  useEffect(() => {
    const pending = toForward(
      { broadcasts, acks, liaisons, orders, exchanges },
      author,
      new Date().toISOString(),
    );
    if (pending.length)
      write((ops) => {
        const known = new Set(ops.exchanges.map((x) => x.id));
        return {
          ...ops,
          exchanges: [
            ...ops.exchanges,
            ...pending.filter((x) => !known.has(x.id)),
          ],
        };
      });
  }, [broadcasts, acks, liaisons, orders, exchanges, author, write]);

  // The function of the post chooses where it lands, once per opening.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current) return;
    landed.current = true;
    const target = landingOf(post);
    if (target && !location.hash && module === "situation" && target !== module)
      go(target);
  }, [post, module, go]);

  // Title of the page: what needs attention now, the tab says it.
  const count = useMemo(() => attentionCount(live, me, now), [live, me, now]);
  useEffect(() => {
    document.title = count ? `(${count}) orion aic` : "orion aic";
  }, [count]);

  // The browser allows sound only after a click: the first one unlocks it.
  useEffect(() => {
    if (!post.sound) return;
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [post.sound]);

  const waiting = useMemo(() => inbox(live, me), [live, me]);
  return (
    <>
      {waiting.length > 0 && (
        <section
          className="conduct-inbox"
          aria-label="Diffusions à quittancer"
          role="region"
        >
          <header>
            <Megaphone size={15} />
            <strong>
              {waiting.length === 1
                ? "Une diffusion attend votre accusé"
                : `${waiting.length} diffusions attendent votre accusé`}
            </strong>
          </header>
          <ul>
            {waiting.slice(0, 3).map(({ broadcast: b, recipients }) => (
              <li
                key={b.id}
                className={b.priority === "Urgent" ? "urgent" : ""}
              >
                <button
                  className="conduct-inbox-main"
                  onClick={() => open(`broadcast:${b.id}` as Ref)}
                >
                  <span className="mono">{time(b.sentAt)}</span>
                  <span className="conduct-inbox-title">
                    {b.priority === "Urgent" && (
                      <span className="pill crit">Urgent</span>
                    )}
                    {b.title}
                  </span>
                  <small>
                    {[
                      b.sender && `de ${b.sender}`,
                      `pour ${recipients.join(", ")}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </button>
                <div className="conduct-inbox-actions">
                  <button
                    className={b.ack === "Lu" ? "primary small" : "small"}
                    onClick={() => {
                      if (!canWrite()) return;
                      updateOps((ops) => acknowledge(ops, b, me, "Lu"));
                      toast(`« Lu » envoyé : ${b.title}.`);
                    }}
                  >
                    <Check size={14} />
                    Lu
                  </button>
                  <button
                    className={b.ack === "Compris" ? "primary small" : "small"}
                    onClick={() => {
                      if (!canWrite()) return;
                      updateOps((ops) => acknowledge(ops, b, me, "Compris"));
                      toast(`« Compris » envoyé : ${b.title}.`);
                    }}
                  >
                    <CheckCheck size={14} />
                    Compris
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {waiting.length > 3 && (
            <button className="link" onClick={() => go("tasks")}>
              Voir les {waiting.length} dans Mes tâches
            </button>
          )}
        </section>
      )}
      <ConductDialogs />
    </>
  );
}
