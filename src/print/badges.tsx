import { useMemo } from "react";
import type { Journal } from "../../shared/journal";
import { qrMatrix, qrPath } from "./qr";

/** A person's badge: name, function, and a QR code read at the roll-call. */
export type Badge = {
  id: string;
  name: string;
  line: string;
  sub: string;
  code: string;
};

/** Link of a badge: opens the roll-call of this person in orion aic. */
export const presenceUrl = (origin: string, memberId: string) =>
  `${origin}/#team/presence=${memberId}`;

/** Person id read from a badge (link or bare id). */
export function memberFromCode(value: string): string {
  const m = /presence=([0-9a-f-]{36})/i.exec(value);
  if (m) return m[1].toLowerCase();
  return /^[0-9a-f-]{36}$/i.test(value.trim())
    ? value.trim().toLowerCase()
    : "";
}

function BadgeCard({ badge }: { badge: Badge }) {
  const matrix = useMemo(() => qrMatrix(badge.code), [badge.code]);
  return (
    <div className="qr-label badge-label">
      <svg
        viewBox={`0 0 ${matrix.length} ${matrix.length}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <path d={qrPath(matrix)} fill="#101318" />
      </svg>
      <div>
        <span className="cell-label">orion aic · présence</span>
        <strong>{badge.name}</strong>
        {badge.line && <small>{badge.line}</small>}
        {badge.sub && <small>{badge.sub}</small>}
      </div>
    </div>
  );
}

export function BadgesView({
  journal,
  badges,
  stamp,
}: {
  journal: Journal;
  badges: Badge[];
  stamp: string;
}) {
  const pages: Badge[][] = [];
  badges.forEach((b, i) => {
    if (i % 21 === 0) pages.push([]);
    pages[pages.length - 1].push(b);
  });
  return (
    <>
      {pages.map((page, i) => (
        <article className="sheet portrait labels" key={i}>
          <div className="qr-grid">
            {page.map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
          <footer className="sheet-foot">
            <span>{journal.title} · badges de présence</span>
            <span>Édité le {stamp}</span>
          </footer>
        </article>
      ))}
    </>
  );
}
