import { useEffect, useRef } from "react";
import { useApp } from "../app/context";
import {
  deliverInject,
  dueInjects,
  isExercise,
  scenarioOf,
} from "../../shared/exercise";
import { useDirector } from "./director";

/** Checks for injects due, every few seconds. */
const TICK = 5000;

/**
 * Delivers the injects of the exercise at their time. Runs on the post of
 * the direction (and on every post of the demonstration, whose scenario is
 * `autoplay`). Never on an intervention journal, a closed journal, a
 * scenario not started or ended, nor while the time machine shows the past
 * (the injects due meanwhile arrive on return). Two directions delivering at
 * once give the same message (its id comes from the inject).
 */
export function ExerciseRunner() {
  const app = useApp();
  const { live, readOnly } = app;
  const director = useDirector(live.id);
  const scenario = scenarioOf(live.ops);
  const autoplay = !!scenario?.autoplay;
  const active =
    isExercise(live) &&
    !live.closedAt &&
    !!scenario?.startAt &&
    !scenario.endedAt &&
    (director.on || autoplay);
  const state = useRef({ app, readOnly, autoplay });
  state.current = { app, readOnly, autoplay };
  const told = useRef(new Set<string>());

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const { app: a, readOnly: past, autoplay: auto } = state.current;
      if (past || !isExercise(a.live)) return;
      const now = Date.now();
      const due = dueInjects(a.live.ops, now);
      // Read out by the direction: shown to it, delivered when read (the
      // demonstration has no direction: everything arrives by itself).
      const send = due.filter((i) => auto || i.delivery === "message");
      const read = due.filter((i) => !send.includes(i));
      if (send.length) {
        const by = auto
          ? "Direction d’exercice · fictive"
          : `${a.author} · direction d’exercice`;
        try {
          a.updateOps((ops) =>
            send.reduce(
              (o, i) =>
                deliverInject(
                  { ops: o, history: a.live.history },
                  i.id,
                  by,
                  now,
                ),
              ops,
            ),
          );
          a.toast(
            auto
              ? `Message reçu : ${send.map((i) => i.title).join(" · ")}`
              : `Inject envoyé : ${send.map((i) => i.title).join(" · ")}`,
          );
        } catch {
          // Refused (journal closed meanwhile): tried again at the next tick.
        }
      }
      const fresh = read.filter((i) => !told.current.has(i.id));
      if (fresh.length) {
        fresh.forEach((i) => told.current.add(i.id));
        a.toast(
          `Inject à lire maintenant : ${fresh.map((i) => i.title).join(" · ")} (Débriefing → Direction d’exercice)`,
        );
      }
    };
    tick();
    const timer = setInterval(tick, TICK);
    return () => clearInterval(timer);
  }, [active]);
  return null;
}
