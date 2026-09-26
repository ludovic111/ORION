import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { useApp } from "../app/context";
import { moduleInfo } from "../app/modules";
import { DecryptText } from "./effects";
import { t } from "./i18n.ts";

/** Title of a module with its help button and actions. */
export function ModuleHead({
  title,
  description,
  eyebrow,
  actions,
  topic,
}: {
  title?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  /** Documentation topic opened by the help button. */
  topic?: string;
}) {
  const { module, help, journal } = useApp();
  const info = moduleInfo(module);
  return (
    <header className="module-head">
      <div>
        <div className="eyebrow">
          <i />
          {eyebrow ?? journal.title}
        </div>
        <h1>
          <DecryptText text={title ?? info.label} />
        </h1>
        {(description ?? info.description) && (
          <p>{description ?? info.description}</p>
        )}
      </div>
      <div className="module-actions">
        {actions}
        <button
          className="help-button"
          onClick={() => help(topic ?? info.id)}
          title={t("Aide sur cette page")}
          aria-label={t("Aide sur cette page")}
        >
          <CircleHelp size={16} />
        </button>
      </div>
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="empty-state reveal">
      <div className="orbit">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
