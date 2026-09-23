export function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="mark"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
      />
      <path d="M5 15 15 5" stroke="currentColor" />
      <rect x="3.5" y="13.5" width="3" height="3" fill="currentColor" />
      <rect x="8.5" y="8.5" width="3" height="3" fill="var(--accent)" />
      <rect x="13.5" y="3.5" width="3" height="3" fill="currentColor" />
    </svg>
  );
}
