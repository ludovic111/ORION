import { useMemo } from "react";
import { ArrowRight, ListChecks, Megaphone, UserCheck } from "lucide-react";
import { time } from "../../../shared/journal";
import { ref, type Ref } from "../../../shared/links";
import { openChecklists, progress } from "../../../shared/checklists";
import {
  lateMinutes,
  openRequests,
  requestLabel,
} from "../../../shared/requests";
import {
  currentShifts,
  dutyBoard,
  formatDuration,
} from "../../../shared/presence";
import { useApp } from "../../app/context";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";
import "../../ui/conduct.css";

// Cards of the Situation page for the conduct follow-up: checklists in
// progress, requests for resources waited for, people on duty.

function Go({
  to,
  label,
  focus,
}: {
  to: "checklists" | "resources" | "team";
  label: string;
  focus?: Ref;
}) {
  const { go, open } = useApp();
  return (
    <button
      className="small situation-go"
      onClick={() => (focus ? open(focus) : go(to))}
    >
      {label}
      <ArrowRight size={13} />
    </button>
  );
}

function ChecklistsCard({ w }: { w: string }) {
  const { journal, now, open, readOnly } = useApp();
  const lists = useMemo(
    () =>
      openChecklists(journal.ops).map((c) => ({
        c,
        p: progress(journal, c, now),
      })),
    [journal, now],
  );
  return (
    <section
      className={`card ${w} situation-list`}
      aria-label={t("Listes de contrôle")}
    >
      <div className="card-head">
        <ListChecks size={15} />
        <h2>{t("Listes de contrôle")}</h2>
        <Go to="checklists" label={t("Listes")} />
      </div>
      {lists.length ? (
        <div className="rows">
          {lists.slice(0, 4).map(({ c, p }) => (
            <button
              key={c.id}
              className={`row-item ${p.late ? "situation-late" : ""}`}
              onClick={() => open(ref("checklist", c.id))}
            >
              <span className="row-main">
                <strong>{c.title}</strong>
                <small>
                  {p.next
                    ? t("Prochaine : {text}", { text: p.next.text })
                    : t("Toutes les étapes sont faites")}
                </small>
              </span>
              {p.late > 0 && (
                <span className="pill crit">
                  {t("{n} en retard", { n: p.late })}
                </span>
              )}
              <span className="mono">
                {p.done}/{p.total}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="situation-empty">
          <p>
            {t(
              "Aucune liste en cours. Une liste par type d’événement (crue, black-out…) rappelle les étapes à ne pas oublier.",
            )}
          </p>
          {!readOnly && (
            <div className="situation-empty-actions">
              <button onClick={() => open("checklist:new" as Ref)}>
                <ListChecks size={14} />
                {t("Démarrer une liste")}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function RequestsCard({ w }: { w: string }) {
  const { journal, now, open } = useApp();
  const list = openRequests(journal.ops);
  const late = list.filter((r) => lateMinutes(r, now) > 0).length;
  return (
    <section
      className={`card ${w} situation-list`}
      aria-label={t("Demandes de moyens")}
    >
      <div className="card-head">
        <Megaphone size={15} />
        <h2>{t("Demandes de moyens")}</h2>
        {late > 0 && (
          <span className="pill crit">{t("{n} en retard", { n: late })}</span>
        )}
        <Go
          to="resources"
          label={t("Demandes")}
          focus={"request:none" as Ref}
        />
      </div>
      {list.length ? (
        <div className="rows">
          {list.slice(0, 5).map((r) => {
            const minutes = lateMinutes(r, now);
            return (
              <button
                key={r.id}
                className={`row-item ${minutes ? "situation-late" : ""}`}
                onClick={() => open(ref("request", r.id))}
              >
                <span className="row-main">
                  <strong>{requestLabel(r)}</strong>
                  <small>
                    {[
                      enumLabel(r.status),
                      r.provider,
                      r.eta && t("arrivée {time}", { time: time(r.eta) }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                {minutes > 0 && (
                  <span className="pill crit">
                    {t("retard {duration}", {
                      duration: formatDuration(minutes * 60_000),
                    })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="muted">{t("Aucune demande en attente.")}</p>
      )}
    </section>
  );
}

function PresenceCard({ w }: { w: string }) {
  const { journal, now } = useApp();
  const board = useMemo(() => dutyBoard(journal.ops, now), [journal.ops, now]);
  const present = board.filter((d) => d.present);
  const warned = board.filter((d) => d.warnings.length);
  const shifts = currentShifts(journal.ops.shifts, now);
  return (
    <section className={`card ${w} situation-list`} aria-label={t("Présences")}>
      <div className="card-head">
        <UserCheck size={15} />
        <h2>{t("Présences")}</h2>
        <span className="pill plain">
          {t("{n} au PC", { n: present.length })}
        </span>
        <Go to="team" label={t("Appel")} focus={"shift:none" as Ref} />
      </div>
      {warned.length > 0 && (
        <ul className="cd-warnings">
          {warned.slice(0, 4).map((d) => (
            <li key={d.memberId || d.name}>
              {t("{name} : {text}", { name: d.name, text: d.warnings[0] })}
            </li>
          ))}
        </ul>
      )}
      <p className="muted">
        {shifts.now.length
          ? t("Relève en cours : {list}.", {
              list: shifts.now
                .map((s) =>
                  t("{title} jusqu’à {time}", {
                    title: s.title,
                    time: time(s.end),
                  }),
                )
                .join(", "),
            })
          : t("Aucune relève en cours.")}
        {shifts.next &&
          t(" Prochaine : {title} à {time}.", {
            title: shifts.next.title,
            time: time(shifts.next.start),
          })}
      </p>
      {!warned.length && present.length > 0 && (
        <p className="muted">
          {t("Le plus long service : {duration}.", {
            duration: formatDuration(Math.max(...present.map((d) => d.span))),
          })}
        </p>
      )}
    </section>
  );
}

/** The three cards, sized to fill one row of the dashboard. */
export function FollowCards() {
  const { journal } = useApp();
  const requests = journal.ops.requests.length > 0;
  const presence =
    journal.ops.presences.length > 0 || journal.ops.shifts.length > 0;
  const count = 1 + Number(requests) + Number(presence);
  const w = count === 3 ? "w-4" : count === 2 ? "w-6" : "w-12";
  return (
    <>
      <ChecklistsCard w={w} />
      {requests && <RequestsCard w={w} />}
      {presence && <PresenceCard w={w} />}
    </>
  );
}
