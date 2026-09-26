import { useMemo } from "react";
import {
  AlarmClockPlus,
  Check,
  CheckCheck,
  CheckCircle2,
  ListChecks,
  Megaphone,
  NotebookPen,
  UserCheck,
} from "lucide-react";
import {
  current,
  numberLabel,
  reviseEntry,
  time,
} from "../../../shared/journal";
import { upsert } from "../../../shared/ops";
import { snooze } from "../../../shared/workflow";
import { myTasks, type Task } from "../../../shared/diffusion";
import type { Ref } from "../../../shared/links";
import { useApp } from "../../app/context";
import { moduleInfo } from "../../app/modules";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { ComboField } from "../../ui/fields";
import { Figures } from "../../ui/Figures";
import { acknowledge } from "../../post/actions";
import { openAssign, openDiffusion } from "../../post/bus";
import { roleProfile, useIdentity } from "../../post/roles";
import { usePost } from "../../post/store";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { useLang } from "../../i18n";
import { t } from "./i18n.ts";
import "../../post/conduct.css";

// A function: read in the language of the post at each render.
const kindLabel = (kind: Task["kind"]): string =>
  kind === "entry"
    ? t("Journal")
    : kind === "assignment"
      ? t("Attribué")
      : kind === "mission"
        ? t("Mission d’ordre")
        : t("Diffusion");

function dueText(task: Task, now: number) {
  if (task.due === null) return "—";
  const minutes = Math.round((task.due - now) / 60_000);
  if (task.late) return t("+{n} min", { n: Math.max(1, -minutes) });
  return time(new Date(task.due).toISOString());
}

/** "Mes tâches": what is assigned to this post's function or operator. */
export function MyTasks() {
  const {
    journal,
    live,
    author,
    now,
    readOnly,
    canWrite,
    updateJournal,
    updateOps,
    compose,
    open,
    go,
    toast,
    lists,
  } = useApp();
  const [post, setPost] = usePost();
  const me = useIdentity(journal, author);
  const lang = useLang();
  // Titles and details of the tasks hold words: recomputed on a change of
  // language.
  const tasks = useMemo(
    () => myTasks(journal, me, now),
    [journal, me, now, lang],
  );
  const profile = roleProfile(post.role);
  const late = tasks.filter((x) => x.late).length;
  const toAck = tasks.filter((x) => x.kind === "broadcast").length;
  const next = tasks.find((x) => !x.late && x.due !== null);

  function done(task: Task) {
    if (!canWrite()) return;
    try {
      if (task.kind === "entry") {
        const entry = live.entries.find((e) => e.id === task.id);
        if (!entry) return;
        if (
          updateJournal(
            reviseEntry(
              live,
              entry.id,
              { ...current(entry), status: "Terminé" },
              author,
              t("Terminé (Mes tâches)"),
            ),
          )
        )
          toast(t("{entry} : terminé.", { entry: numberLabel(entry) }));
      } else if (task.kind === "assignment") {
        updateOps((ops) => {
          const a = ops.assignments.find((x) => x.id === task.id);
          return a
            ? upsert(ops, "assignments", { ...a, done: true }, author)
            : ops;
        });
        toast(t("Tâche terminée."));
      } else if (task.kind === "mission") {
        updateOps((ops) => {
          const o = ops.orders.find((x) => x.id === task.orderId);
          if (!o) return ops;
          return upsert(
            ops,
            "orders",
            {
              ...o,
              missions: o.missions.map((m) =>
                m.id === task.id ? { ...m, done: true } : m,
              ),
            },
            author,
          );
        });
        toast(t("Mission terminée."));
      }
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function later(task: Task) {
    if (!canWrite()) return;
    try {
      if (task.kind === "entry") {
        const entry = live.entries.find((e) => e.id === task.id);
        if (!entry) return;
        const f = current(entry);
        if (
          updateJournal(
            reviseEntry(
              live,
              entry.id,
              { ...f, dueAt: snooze(f.dueAt, 15) },
              author,
              t("Échéance reportée de {n} min", { n: 15 }),
            ),
          )
        )
          toast(
            t("{entry} : échéance reportée de {n} min.", {
              entry: numberLabel(entry),
              n: 15,
            }),
          );
      } else if (task.kind === "assignment") {
        updateOps((ops) => {
          const a = ops.assignments.find((x) => x.id === task.id);
          return a
            ? upsert(
                ops,
                "assignments",
                { ...a, dueAt: snooze(a.dueAt, 15) },
                author,
              )
            : ops;
        });
        toast(t("Échéance reportée de {n} min.", { n: 15 }));
      } else if (task.kind === "mission") {
        updateOps((ops) => {
          const o = ops.orders.find((x) => x.id === task.orderId);
          if (!o) return ops;
          return upsert(
            ops,
            "orders",
            {
              ...o,
              missions: o.missions.map((m) =>
                m.id === task.id ? { ...m, dueAt: snooze(m.dueAt, 15) } : m,
              ),
            },
            author,
          );
        });
        toast(t("Échéance reportée de {n} min.", { n: 15 }));
      }
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function note(task: Task) {
    if (task.kind === "entry") {
      const entry = live.entries.find((e) => e.id === task.id);
      if (!entry) return;
      compose({
        type: "Quittance",
        reference: t("Suite de {entry}", { entry: numberLabel(entry) }),
        recipient: current(entry).source,
        source: me.role || author,
      });
      return;
    }
    compose({
      type: task.kind === "mission" ? "Quittance" : "Observation",
      message: `${task.title} — `,
      source: me.role || author,
      reference: task.detail,
    });
  }

  function ack(task: Task, kind: "Lu" | "Compris") {
    const b = live.ops.broadcasts.find((x) => x.id === task.id);
    if (!b || !canWrite()) return;
    try {
      updateOps((ops) => acknowledge(ops, b, me, kind));
      toast(t("« {ack} » envoyé.", { ack: enumLabel(kind) }));
    } catch (err) {
      toast((err as Error).message);
    }
  }

  const cells = journal.ops.cells.map((c) => c.name);
  return (
    <>
      <ModuleHead
        description={t(
          "Tout ce qui est attribué à votre fonction ou à votre nom : entrées à suivre, missions des ordres, éléments attribués, diffusions à quittancer.",
        )}
        actions={
          !readOnly && (
            <>
              <button onClick={() => openAssign()}>
                <UserCheck size={15} />
                {t("Attribuer")}
              </button>
              <button className="primary" onClick={() => openDiffusion()}>
                <Megaphone size={15} />
                {t("Diffuser")}
              </button>
            </>
          )
        }
      />
      <div className="conduct-me">
        <ComboField
          label={t("Ma fonction (ce poste)")}
          value={post.role}
          onChange={(role) => setPost({ role })}
          options={lists("postRoles")}
          quick={7}
          hint={
            profile
              ? profile.hint
              : t(
                  "Choisissez la fonction de ce poste : elle décide de ce qui vous est attribué, des alertes et du module d’arrivée.",
                )
          }
        />
        <ComboField
          label={t("Ma cellule (facultatif)")}
          value={post.cell}
          onChange={(cell) => setPost({ cell })}
          options={cells}
          hint={t(
            "Opérateur : {author}. Une tâche attribuée à ce nom, à cette fonction ou à cette cellule apparaît ici.",
            { author },
          )}
        />
      </div>

      <Figures
        label={t("Mes tâches en chiffres")}
        items={[
          { label: t("À faire"), value: tasks.length },
          {
            label: t("En retard"),
            value: late,
            tone: late ? "crit" : "",
          },
          {
            label: t("À quittancer"),
            value: toAck,
            tone: toAck ? "warn" : "",
          },
          next
            ? {
                id: "next",
                label: t("Prochaine échéance · {title}", {
                  title: next.title.slice(0, 40),
                }),
                value: time(new Date(next.due!).toISOString()),
                onClick: () => open(next.ref as Ref),
              }
            : { id: "next", label: t("Aucune échéance à venir"), value: "—" },
        ]}
      />

      {!tasks.length ? (
        <EmptyState
          icon={<ListChecks size={28} />}
          title={
            me.role || me.cell
              ? t("Rien d’attribué à ce poste pour l’instant")
              : t("Choisissez d’abord votre fonction")
          }
        >
          {t(
            "Une entrée dont le responsable est « {role} » ou « {author} », une mission d’ordre pour votre fonction, un élément attribué ou une diffusion qui vous est destinée apparaît ici, la plus en retard d’abord.",
            { role: me.role || t("votre fonction"), author },
          )}
        </EmptyState>
      ) : (
        <ul className="conduct-list" aria-label={t("Mes tâches")}>
          {tasks.map((task) => (
            <li
              key={task.key}
              className={`conduct-row${task.late ? " late" : ""}`}
            >
              <span
                className="when"
                title={task.late ? t("En retard") : t("Échéance")}
              >
                {dueText(task, now)}
              </span>
              <div className="what">
                <button onClick={() => open(task.ref as Ref)}>
                  <span className="conduct-kind">{kindLabel(task.kind)}</span>
                  {task.urgent && (
                    <span className="pill crit">{enumLabel("Urgent")}</span>
                  )}{" "}
                  {task.title}
                </button>
                <small>{task.detail}</small>
              </div>
              {!readOnly && (
                <div className="row-actions">
                  {task.kind === "broadcast" ? (
                    <>
                      <button className="small" onClick={() => ack(task, "Lu")}>
                        <Check size={14} />
                        {enumLabel("Lu")}
                      </button>
                      <button
                        className="small"
                        onClick={() => ack(task, "Compris")}
                      >
                        <CheckCheck size={14} />
                        {enumLabel("Compris")}
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="small" onClick={() => done(task)}>
                        <CheckCircle2 size={14} />
                        {enumLabel("Terminé")}
                      </button>
                      <button className="small" onClick={() => later(task)}>
                        <AlarmClockPlus size={14} />
                        {t("+{n} min", { n: 15 })}
                      </button>
                      <button className="small" onClick={() => note(task)}>
                        <NotebookPen size={14} />
                        {t("Noter au journal")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {profile && (
        <section className="conduct-section">
          <h2>{t("Pour votre fonction")}</h2>
          <p className="muted">{profile.hint}</p>
          <div className="conduct-focus">
            {profile.focus.map((m) => {
              const info = moduleInfo(m);
              const Icon = info.icon;
              return (
                <button key={m} onClick={() => go(m)}>
                  <Icon size={15} />
                  {info.short}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
