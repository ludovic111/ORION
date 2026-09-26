import { useMemo } from "react";
import { Check, GitMerge, Hash, ShieldAlert } from "lucide-react";
import { dateTime } from "../../shared/journal";
import { diffStates, scopeInfo } from "../../shared/history";
import type { Collision, Concurrent } from "../../shared/sync";
import { fieldLabel, formatValue } from "../timeline/format";
import { useApp } from "../app/context";
import { formatTime, useLang } from "../i18n";
import { t } from "./i18n.ts";
import { conflictId, type useSync } from "./useSync";

// What the merges between posts did, for the operator: numbers given at the
// same time on two posts (kept, told apart by a suffix), changes written at
// the same time from the same version (one is shown, both stay in the
// history) and journals received from another post and refused.

type Sync = ReturnType<typeof useSync>;

const section = { display: "grid", gap: 10 } as const;
const row = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--bg-1)",
} as const;
const meta = { color: "var(--text-2)", fontSize: 12.5 } as const;

function Versions({ item }: { item: Concurrent }) {
  return (
    <details>
      <summary>{t("Voir les deux versions")}</summary>
      <div className="details-fields" style={{ display: "grid", gap: 8 }}>
        {item.overwritten.map((o) => {
          const fields = diffStates(o.state, item.kept.state);
          return (
            <dl key={o.id} className="spec compact">
              {fields.length ? (
                fields.map((f) => (
                  <div key={f.key}>
                    <dt>{fieldLabel(f.key)}</dt>
                    <dd>
                      <span style={{ textDecoration: "line-through" }}>
                        {formatValue(f.key, f.before)}
                      </span>{" "}
                      → {formatValue(f.key, f.after)}
                    </dd>
                  </div>
                ))
              ) : (
                <div>
                  <dt>{t("Contenu")}</dt>
                  <dd>{t("Identique à la version affichée.")}</dd>
                </div>
              )}
              <div>
                <dt>{t("Non retenue")}</dt>
                <dd>
                  {o.by || "—"} · {dateTime(o.at)}
                </dd>
              </div>
            </dl>
          );
        })}
        <p style={meta}>
          {t(
            "Les deux versions restent dans l’historique (fiche de l’élément → Historique) et peuvent être restaurées.",
          )}
        </p>
      </div>
    </details>
  );
}

export function ConflictPanel({ sync }: { sync: Sync }) {
  const { workspace } = useApp();
  useLang();
  const titles = useMemo(
    () => new Map(workspace.journals.map((j) => [j.id, j.title])),
    [workspace.journals],
  );
  const fresh = sync.conflicts.filter((c) => !sync.seen.has(conflictId(c)));
  const collisions = fresh.filter(
    (c): c is Collision => c.kind === "collision",
  );
  const concurrent = fresh.filter(
    (c): c is Concurrent => c.kind === "concurrent",
  );
  const several = workspace.journals.length > 1;
  const where = (id: string) => (several ? ` · ${titles.get(id) ?? ""}` : "");

  if (!fresh.length && !sync.rejected.length)
    return (
      <p className="muted" style={{ display: "flex", gap: 8 }}>
        <Check size={15} />{" "}
        {t(
          "Aucune fusion à signaler : les postes n’ont rien écrit en même temps sur les mêmes éléments.",
        )}
      </p>
    );

  return (
    <div className="stack" style={{ gap: 18 }}>
      {sync.rejected.length > 0 && (
        <section style={section}>
          <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ShieldAlert size={15} />{" "}
            {t("Données refusées ({n})", { n: sync.rejected.length })}
          </strong>
          <p className="hint warn">
            {t(
              "Ces journaux reçus d’un autre poste n’ont pas été fusionnés. Le plus souvent, ce poste utilise une autre version d’orion aic : rechargez la page sur les deux postes.",
            )}
          </p>
          {sync.rejected.map((r) => (
            <div key={`${r.at}-${r.journal}`} style={row}>
              <span>
                {t("{journal} · de {from}", {
                  journal: r.journal,
                  from: r.from,
                })}
              </span>
              <span style={meta}>
                {formatTime(r.at, true)} · {r.reason}
              </span>
            </div>
          ))}
          <div className="action-row">
            <button onClick={sync.clearRejected}>
              {t("Effacer la liste")}
            </button>
          </div>
        </section>
      )}
      {collisions.length > 0 && (
        <section style={section}>
          <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Hash size={15} />{" "}
            {t("Numéros donnés en même temps ({n})", { n: collisions.length })}
          </strong>
          <p style={meta}>
            {t(
              "Deux postes ont donné le même numéro au même moment. Aucun numéro n’a été changé : le premier créé garde le numéro seul, les autres reçoivent une lettre (#007·B). Citez le libellé complet.",
            )}
          </p>
          {collisions.map((c) => (
            <div key={conflictId(c)} style={row}>
              <span>
                {c.scope === "entries" ? t("Entrées") : t("Messages")}{" "}
                {c.items.map((i) => i.label).join(", ")}
                {where(c.journalId)}
              </span>
              <span style={meta}>
                {c.items
                  .map((i) =>
                    t(
                      i.gone
                        ? "{label} : {by}, {at} (supprimée)"
                        : "{label} : {by}, {at}",
                      { label: i.label, by: i.by || "—", at: dateTime(i.at) },
                    ),
                  )
                  .join(" · ")}
              </span>
            </div>
          ))}
        </section>
      )}
      {concurrent.length > 0 && (
        <section style={section}>
          <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <GitMerge size={15} />{" "}
            {t("Modifications simultanées ({n})", { n: concurrent.length })}
          </strong>
          <p style={meta}>
            {t(
              "Deux postes ont modifié le même élément à partir de la même version. La plus récente est affichée partout ; l’autre reste consultable.",
            )}
          </p>
          {concurrent.map((c) => (
            <div key={conflictId(c)} style={row}>
              <span>
                {scopeInfo(c.scope).label} · {c.title}
                {where(c.journalId)}
              </span>
              <span style={meta}>
                {t("Retenue : {kept} · non retenue : {others}", {
                  kept: `${c.kept.by || "—"}, ${dateTime(c.kept.at)}`,
                  others: c.overwritten
                    .map((o) => `${o.by || "—"}, ${dateTime(o.at)}`)
                    .join(" ; "),
                })}
              </span>
              <Versions item={c} />
            </div>
          ))}
        </section>
      )}
      {fresh.length > 0 && (
        <div className="action-row">
          <button onClick={() => sync.markSeen(fresh.map(conflictId))}>
            <Check size={14} /> {t("Marquer comme vu")}
          </button>
        </div>
      )}
    </div>
  );
}
