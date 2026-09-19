import { useEffect, useRef, useId, type ReactNode } from "react";
import { X, Plus } from "lucide-react";
export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Status({ value }: { value: string }) {
  const tone = /P1|Ouvert|Réel/.test(value)
    ? "red"
    : /P2|En route|En cours|transmettre|EXERCICE/.test(value)
      ? "amber"
      : /Engagé|Traité|Validé|Confirmé|Accusé/.test(value)
        ? "green"
        : /P3|Transmis|Disponible/.test(value)
          ? "blue"
          : "muted";
  return <Badge tone={tone}>{value}</Badge>;
}
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-head">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function AddButton({
  children,
  onClick,
  primary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button className={primary ? "primary" : ""} onClick={onClick}>
      <Plus size={15} />
      {children}
    </button>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={wide ? "wide" : ""}
    >
      <div className="modal-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-btn" aria-label="Fermer" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? "full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
