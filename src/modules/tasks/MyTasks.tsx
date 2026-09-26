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
import "../../post/conduct.css";

const KIND_LABEL: Record<Task["kind"], string> = {
  entry: "Journal",
  assignment: "Attribué",
  mission: "Mission d’ordre",
  broadcast: "Diffusion",
};

function dueText(task: Task, now: number) {
  if (task.due === null) return "—";
  const minutes = Math.round((task.due - now) / 60_000);
  if (task.late) return `+${Math.max(1, -minutes)} min`;
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
  const tasks = useMemo(() => myTasks(journal, me, now), [journal, me, now]);
  const profile = roleProfile(post.role);
  const late = tasks.filter((t) => t.late).length;
  const toAck = tasks.filter((t) => t.kind === "broadcast").length;
  const next = tasks.find((t) => !t.late && t.due !== null);

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
              "Terminé (Mes tâches)",
            ),
          )
        )
          toast(`${numberLabel(entry)} : terminé.`);
      } else if (task.kind === "assignment") {
        updateOps((ops) => {
          const a = ops.assignments.find((x) => x.id === task.id);
          return a
            ? upsert(ops, "assignments", { ...a, done: true }, author)
            : ops;
        });
        toast("Tâche terminée.");
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
        toast("Mission terminée.");
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
              "Échéance reportée de 15 min",
            ),
          )
        )
          toast(`${numberLabel(entry)} : échéance reportée de 15 min.`);
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
        toast("Échéance reportée de 15 min.");
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
        toast("Échéance reportée de 15 min.");
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
        reference: `Suite de ${numberLabel(entry)}`,
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
      toast(`« ${kind} » envoyé.`);
    } catch (err) {
      toast((err as Error).message);
    }
  }

  const cells = journal.ops.cells.map((c) => c.name);
  return (
    <>
      <ModuleHead
        description="Tout ce qui est attribué à votre fonction ou à votre nom : entrées à suivre, missions des ordres, éléments attribués, diffusions à quittancer."
        actions={
          !readOnly && (
            <>
              <button onClick={() => openAssign()}>
                <UserCheck size={15} />
                Attribuer
              </button>
              <button className="primary" onClick={() => openDiffusion()}>
                <Megaphone size={15} />
                Diffuser
              </button>
            </>
          )
        }
      />
      <div className="conduct-me">
        <ComboField
          label="Ma fonction (ce poste)"
          value={post.role}
          onChange={(role) => setPost({ role })}
          options={lists("postRoles")}
          quick={7}
          hint={
            profile
              ? profile.hint
              : "Choisissez la fonction de ce poste : elle décide de ce qui vous est attribué, des alertes et du module d’arrivée."
          }
        />
        <ComboField
          label="Ma cellule (facultatif)"
          value={post.cell}
          onChange={(cell) => setPost({ cell })}
          options={cells}
          hint={`Opérateur : ${author}. Une tâche attribuée à ce nom, à cette fonction ou à cette cellule apparaît ici.`}
        />
      </div>

      <Figures
        label="Mes tâches en chiffres"
        items={[
          { label: "À faire", value: tasks.length },
          {
            label: "En retard",
            value: late,
            tone: late ? "crit" : "",
          },
          {
            label: "À quittancer",
            value: toAck,
            tone: toAck ? "warn" : "",
          },
          next
            ? {
                id: "next",
                label: `Prochaine échéance · ${next.title.slice(0, 40)}`,
                value: time(new Date(next.due!).toISOString()),
                onClick: () => open(next.ref as Ref),
              }
            : { id: "next", label: "Aucune échéance à venir", value: "—" },
        ]}
      />

      {!tasks.length ? (
        <EmptyState
          icon={<ListChecks size={28} />}
          title={
            me.role || me.cell
              ? "Rien d’attribué à ce poste pour l’instant"
              : "Choisissez d’abord votre fonction"
          }
        >
          Une entrée dont le responsable est « {me.role || "votre fonction"} »
          ou « {author} », une mission d’ordre pour votre fonction, un élément
          attribué ou une diffusion qui vous est destinée apparaît ici, la plus
          en retard d’abord.
        </EmptyState>
      ) : (
        <ul className="conduct-list" aria-label="Mes tâches">
          {tasks.map((t) => (
            <li key={t.key} className={`conduct-row${t.late ? " late" : ""}`}>
              <span className="when" title={t.late ? "En retard" : "Échéance"}>
                {dueText(t, now)}
              </span>
              <div className="what">
                <button onClick={() => open(t.ref as Ref)}>
                  <span className="conduct-kind">{KIND_LABEL[t.kind]}</span>
                  {t.urgent && <span className="pill crit">Urgent</span>}{" "}
                  {t.title}
                </button>
                <small>{t.detail}</small>
              </div>
              {!readOnly && (
                <div className="row-actions">
                  {t.kind === "broadcast" ? (
                    <>
                      <button className="small" onClick={() => ack(t, "Lu")}>
                        <Check size={14} />
                        Lu
                      </button>
                      <button
                        className="small"
                        onClick={() => ack(t, "Compris")}
                      >
                        <CheckCheck size={14} />
                        Compris
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="small" onClick={() => done(t)}>
                        <CheckCircle2 size={14} />
                        Terminé
                      </button>
                      <button className="small" onClick={() => later(t)}>
                        <AlarmClockPlus size={14} />
                        +15 min
                      </button>
                      <button className="small" onClick={() => note(t)}>
                        <NotebookPen size={14} />
                        Noter au journal
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
          <h2>Pour votre fonction</h2>
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
