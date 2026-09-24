// The Orion constellation: Betelgeuse (orange), Rigel (blue), the belt.
export const ORION_STARS = [
  { x: 9, y: 7, r: 2.1, color: "#ffb35c" }, // Betelgeuse
  { x: 22.5, y: 8, r: 1.5, color: "#dfe6ff" }, // Bellatrix
  { x: 15.8, y: 3.6, r: 1, color: "#dfe6ff" }, // Meissa
  { x: 12.6, y: 17.2, r: 1.35, color: "#dfe6ff" }, // Alnitak
  { x: 16, y: 16.1, r: 1.45, color: "#dfe6ff" }, // Alnilam
  { x: 19.4, y: 15, r: 1.3, color: "#dfe6ff" }, // Mintaka
  { x: 10.8, y: 27.4, r: 1.4, color: "#dfe6ff" }, // Saiph
  { x: 23.4, y: 26.4, r: 2, color: "#9dc1ff" }, // Rigel
] as const;
export const ORION_LINES = [
  [0, 2],
  [2, 1],
  [0, 3],
  [1, 5],
  [3, 4],
  [4, 5],
  [3, 6],
  [5, 7],
] as const;

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg
      className="mark logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="orion-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3fdcff" />
          <stop offset="0.5" stopColor="#8b7bff" />
          <stop offset="1" stopColor="#ff72c8" />
        </linearGradient>
      </defs>
      <circle
        cx="16"
        cy="16"
        r="15"
        fill="none"
        stroke="url(#orion-ring)"
        strokeWidth="1.2"
        opacity="0.9"
      />
      <g stroke="currentColor" strokeWidth="0.55" opacity="0.45">
        {ORION_LINES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={ORION_STARS[a].x}
            y1={ORION_STARS[a].y}
            x2={ORION_STARS[b].x}
            y2={ORION_STARS[b].y}
          />
        ))}
      </g>
      {ORION_STARS.map((s, i) => (
        <circle
          key={i}
          className="star"
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={i === 0 || i === 7 ? s.color : "currentColor"}
        />
      ))}
    </svg>
  );
}

export function Brand({ size = 24 }: { size?: number }) {
  return (
    <span className="brand">
      <Mark size={size} />
      <span>
        orion <b>aic</b>
      </span>
    </span>
  );
}
