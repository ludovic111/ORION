import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Check,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Printer,
  Radio,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { dateTime, time } from "../../../shared/journal";
import { parseRef, ref, type Ref } from "../../../shared/links";
import {
  MEMBER_STATUSES,
  upsert,
  type Cell,
  type Member,
} from "../../../shared/ops";
import { callsignKey } from "../../../shared/radio";
import { useApp } from "../../app/context";
import { CountUp } from "../../ui/effects";
import { Segmented } from "../../ui/fields";
import { HoverCard, LinkChip } from "../../ui/links";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { Popover } from "../../ui/Popover";
import type { SheetTable } from "../../print/radio-sheet";
import {
  CellSheet,
  MemberSheet,
  PALETTE,
  blankCell,
  blankMember,
  cellColor,
  type CellDraft,
  type MemberDraft,
} from "./TeamSheets";
import "./team.css";

type Status = (typeof MEMBER_STATUSES)[number];
type View = "org" | "list";
type SortKey =
  "name" | "grade" | "role" | "cell" | "callsign" | "phone" | "status";
type Editing =
  | { kind: "member"; value: MemberDraft }
  | { kind: "cell"; value: CellDraft }
  | null;

const VIEW_KEY = "orion-aic-team-view";
const STATUS_TONE: Record<Status, string> = {
  Présent: "ok",
  "En pause": "warn",
  Absent: "crit",
  Relevé: "muted",
};
const NEXT_STATUS: Record<Status, Status> = {
  Présent: "En pause",
  "En pause": "Absent",
  Absent: "Relevé",
  Relevé: "Présent",
};
const FRONT_BACK = [
  { name: "PC front", kind: "PC front" },
  { name: "PC arrière", kind: "PC arrière" },
];
const STANDARD_PC = [
  ...FRONT_BACK,
  { name: "Cellule situation", kind: "Cellule" },
  { name: "Cellule logistique", kind: "Cellule" },
  { name: "Cellule télématique", kind: "Cellule" },
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");

export const initials = (name: string) =>
  name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase("fr"))
    .join("") || "?";

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
const avatarStyle = (name: string) => {
  const h = hash(name) % 360;
  return {
    "--a1": `hsl(${h} 80% 62%)`,
    "--a2": `hsl(${(h + 50) % 360} 85% 55%)`,
  } as CSSProperties;
};

export function shift(m: Member) {
  if (m.from && m.to) return `${time(m.from)}–${time(m.to)}`;
  if (m.from) return `dès ${time(m.from)}`;
  if (m.to) return `jusqu’à ${time(m.to)}`;
  return "";
}

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "org";
  } catch {
    return "org";
  }
}

/** Preview of an item after a short hover. */
function useHover(target: Ref) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    card: at && <HoverCard target={target} x={at.x} y={at.y} />,
    bind: {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        clearTimeout(timer.current);
        timer.current = setTimeout(
          () => setAt({ x: box.left, y: box.bottom + 6 }),
          550,
        );
      },
      onMouseLeave: () => {
        clearTimeout(timer.current);
        setAt(null);
      },
    },
    hide: () => {
      clearTimeout(timer.current);
      setAt(null);
    },
  };
}

export function Team() {
  const {
    journal,
    author,
    readOnly,
    focus,
    setFocus,
    updateOps,
    toast,
    print,
    lists,
  } = useApp();
  const { cells: rawCells, members } = journal.ops;
  const [view, setViewState] = useState<View>(readView);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [over, setOver] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "cell",
    dir: 1,
  });

  const cells = useMemo(
    () =>
      [...rawCells].sort(
        (a, b) => a.order - b.order || a.name.localeCompare(b.name, "fr"),
      ),
    [rawCells],
  );
  const grades = lists("grades");
  const gradeRank = (g: string) => {
    const i = grades.findIndex((x) => norm(x) === norm(g));
    return !g || norm(g) === "civil" ? -1 : i;
  };
  const stationByCallsign = useMemo(
    () =>
      new Map(
        journal.radio.stations.map((s) => [callsignKey(s.callsign), s.id]),
      ),
    [journal.radio.stations],
  );

  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* per-post convenience only */
    }
  };

  useEffect(() => {
    if (!focus) return;
    const { kind, id } = parseRef(focus);
    if (kind === "member") {
      const m = members.find((x) => x.id === id);
      if (id === "new") setEditing({ kind: "member", value: blankMember() });
      else if (m) setEditing({ kind: "member", value: m });
    } else if (kind === "cell") {
      const c = rawCells.find((x) => x.id === id);
      if (id === "new")
        setEditing({ kind: "cell", value: blankCell(nextOrder()) });
      else if (c) setEditing({ kind: "cell", value: c });
    } else return;
    setFocus(null);
  }, [focus, members, rawCells, setFocus]);

  function nextOrder() {
    return rawCells.reduce((max, c) => Math.max(max, c.order), -1) + 1;
  }
  function change(run: Parameters<typeof updateOps>[0], message?: string) {
    try {
      updateOps(run);
      if (message) toast(message);
      return true;
    } catch (err) {
      toast((err as Error).message);
      return false;
    }
  }
  function patchMember(m: Member, patch: Partial<Member>, message?: string) {
    change((ops) => {
      const current = ops.members.find((x) => x.id === m.id);
      return current
        ? upsert(ops, "members", { ...current, ...patch }, author)
        : ops;
    }, message);
  }
  function moveMember(id: string, cellId: string) {
    const m = members.find((x) => x.id === id);
    if (!m || m.cellId === cellId) return;
    const target = cells.find((c) => c.id === cellId);
    patchMember(m, { cellId }, `${m.name} → ${target?.name ?? "Sans poste"}`);
  }
  function cycleStatus(m: Member) {
    const status = NEXT_STATUS[m.status];
    patchMember(m, { status }, `${m.name} : ${status.toLowerCase()}.`);
  }
  function moveCell(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= cells.length) return;
    const order = cells.map((c) => c.id);
    [order[index], order[target]] = [order[target], order[index]];
    change((ops) => {
      let next = ops;
      order.forEach((id, i) => {
        const c = next.cells.find((x) => x.id === id);
        if (c && c.order !== i)
          next = upsert(next, "cells", { ...c, order: i }, author);
      });
      return next;
    });
  }
  function createCells(preset: { name: string; kind: string }[]) {
    const known = new Set(rawCells.map((c) => norm(c.name)));
    const add = preset.filter((p) => !known.has(norm(p.name)));
    if (!add.length) {
      toast("Ces postes existent déjà.");
      return;
    }
    const start = nextOrder();
    change(
      (ops) =>
        add.reduce(
          (next, p, i) =>
            upsert(
              next,
              "cells",
              {
                ...blankCell(
                  start + i,
                  PALETTE[(rawCells.length + i) % PALETTE.length],
                ),
                name: p.name,
                kind: p.kind,
              },
              author,
            ),
          ops,
        ),
      `${add.length} poste${add.length > 1 ? "s" : ""} créé${add.length > 1 ? "s" : ""}.`,
    );
  }

  const matches = (m: Member) => {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const hay = norm(
      [m.name, m.grade, m.role, m.callsign, m.phone, m.email, m.status].join(
        " ",
      ),
    );
    return terms.every((t) => hay.includes(t));
  };
  const sortInCell = (a: Member, b: Member) =>
    gradeRank(b.grade) - gradeRank(a.grade) ||
    a.name.localeCompare(b.name, "fr");
  const byCell = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of members) {
      const key = cells.some((c) => c.id === m.cellId) ? m.cellId : "";
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    for (const list of map.values()) list.sort(sortInCell);
    return map;
  }, [members, cells, grades]);
  const cellName = (id: string) => cells.find((c) => c.id === id)?.name ?? "";

  const presence = useMemo(() => {
    const c = Object.fromEntries(MEMBER_STATUSES.map((s) => [s, 0])) as Record<
      Status,
      number
    >;
    for (const m of members) c[m.status]++;
    return c;
  }, [members]);

  function printTeam() {
    const row = (m: Member) => [
      m.grade,
      m.name,
      m.role,
      m.callsign,
      m.phone,
      m.status,
      shift(m),
    ];
    const head = [
      "Grade",
      "Nom",
      "Fonction",
      "Nom d’appel",
      "Téléphone",
      "Statut",
      "Service",
    ];
    const widths = [16, 38, 38, 24, 28, 17, 21];
    const tables: SheetTable[] = cells.map((c) => {
      const list = byCell.get(c.id) ?? [];
      return {
        id: c.id,
        title: c.name,
        caption: [
          c.kind,
          c.location,
          c.phone && `Tél. ${c.phone}`,
          c.radio && `Radio ${c.radio}`,
          `${list.filter((m) => m.status === "Présent").length} présent(s) sur ${list.length}`,
        ]
          .filter(Boolean)
          .join(" · "),
        head,
        body: list.map(row),
        widths,
      };
    });
    const loose = byCell.get("") ?? [];
    if (loose.length)
      tables.push({
        id: "none",
        title: "Sans poste",
        caption: `${loose.length} personne(s)`,
        head,
        body: loose.map(row),
        widths,
      });
    print({
      kind: "tables",
      journal,
      title: "Équipe et postes",
      extra: `Établi par ${author}`,
      tables,
      landscape: false,
      name: "equipe",
    });
  }

  const sorted = useMemo(() => {
    const value = (m: Member): string | number => {
      switch (sort.key) {
        case "grade":
          return gradeRank(m.grade);
        case "cell":
          return cells.findIndex((c) => c.id === m.cellId) >>> 0;
        case "status":
          return MEMBER_STATUSES.indexOf(m.status);
        default:
          return norm(m[sort.key]);
      }
    };
    return members.filter(matches).sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const d =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), "fr");
      return d * sort.dir || a.name.localeCompare(b.name, "fr");
    });
  }, [members, sort, query, cells, grades]);

  const empty = !cells.length && !members.length;
  const loose = (byCell.get("") ?? []).filter(matches);
  const handlers: MemberHandlers = {
    onOpen: (m) => setEditing({ kind: "member", value: m }),
    onCycle: cycleStatus,
    onMove: moveMember,
    cells,
    stationByCallsign,
  };

  return (
    <>
      <ModuleHead
        actions={
          <>
            <button onClick={printTeam} disabled={empty}>
              <Printer size={14} />
              Imprimer
            </button>
            {!readOnly && (
              <>
                <button
                  onClick={() =>
                    setEditing({ kind: "cell", value: blankCell(nextOrder()) })
                  }
                >
                  <Building2 size={14} />
                  Nouveau poste
                </button>
                <button
                  className="primary"
                  onClick={() =>
                    setEditing({ kind: "member", value: blankMember() })
                  }
                >
                  <UserPlus size={15} />
                  Nouvelle personne
                </button>
              </>
            )}
          </>
        }
      />
      {empty ? (
        <div className="card team-empty">
          <EmptyState
            icon={<Users size={28} />}
            title="Qui fait quoi ?"
            actions={
              !readOnly && (
                <>
                  <button
                    className="primary"
                    onClick={() => createCells(FRONT_BACK)}
                  >
                    <Building2 size={14} />
                    Créer PC front et PC arrière
                  </button>
                  <button onClick={() => createCells(STANDARD_PC)}>
                    <LayoutGrid size={14} />
                    Structure type d’un PC
                  </button>
                  <button
                    onClick={() =>
                      setEditing({ kind: "member", value: blankMember() })
                    }
                  >
                    <UserPlus size={14} />
                    Ajouter une personne
                  </button>
                </>
              )
            }
          >
            Organisez l’équipe par poste (PC front, PC arrière) et par cellule :
            nom, grade, fonction, nom d’appel, téléphone et présence. Tout reste
            modifiable.
          </EmptyState>
        </div>
      ) : (
        <>
          <div
            className="team-presence stagger"
            role="list"
            aria-label="Présences"
          >
            <div className="team-stat" role="listitem">
              <strong>
                <CountUp value={members.length} />
              </strong>
              <span>Personnes</span>
            </div>
            {MEMBER_STATUSES.map((s) => (
              <div
                className={`team-stat tone-${STATUS_TONE[s]}`}
                role="listitem"
                key={s}
              >
                <strong>
                  <CountUp value={presence[s]} />
                </strong>
                <span>{s}</span>
              </div>
            ))}
            <div className="team-stat" role="listitem">
              <strong>
                <CountUp value={cells.length} />
              </strong>
              <span>Postes et cellules</span>
            </div>
          </div>
          <div className="card team-toolbar">
            <div className="search">
              <Search size={14} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un nom, une fonction, un nom d’appel…"
                aria-label="Rechercher une personne"
              />
              {query && (
                <button
                  className="icon-button small"
                  aria-label="Effacer la recherche"
                  onClick={() => setQuery("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {!readOnly && cells.length > 0 && (
              <button
                className="small"
                onClick={() => createCells(STANDARD_PC)}
              >
                <LayoutGrid size={13} />
                Compléter la structure type
              </button>
            )}
            <div className="team-view">
              <Segmented
                label="Affichage"
                value={view}
                onChange={setView}
                options={[
                  {
                    value: "org",
                    label: (
                      <>
                        <LayoutGrid size={13} /> Organigramme
                      </>
                    ),
                  },
                  {
                    value: "list",
                    label: (
                      <>
                        <List size={13} /> Liste
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </div>
          {view === "org" ? (
            <div className="team-org">
              {cells.map((c, i) => {
                const list = (byCell.get(c.id) ?? []).filter(matches);
                const all = byCell.get(c.id) ?? [];
                return (
                  <CellColumn
                    key={c.id}
                    cell={c}
                    color={cellColor(c, i)}
                    members={list}
                    total={all}
                    drop={over === c.id}
                    first={i === 0}
                    last={i === cells.length - 1}
                    onOver={setOver}
                    onDrop={(id) => moveMember(id, c.id)}
                    onEdit={() => setEditing({ kind: "cell", value: c })}
                    onUp={() => moveCell(i, -1)}
                    onDown={() => moveCell(i, 1)}
                    onAdd={() =>
                      setEditing({ kind: "member", value: blankMember(c.id) })
                    }
                    handlers={handlers}
                  />
                );
              })}
              {(loose.length > 0 || !cells.length) && (
                <CellColumn
                  cell={null}
                  color="var(--text-3)"
                  members={loose}
                  total={byCell.get("") ?? []}
                  drop={over === ""}
                  first
                  last
                  onOver={setOver}
                  onDrop={(id) => moveMember(id, "")}
                  onAdd={() =>
                    setEditing({ kind: "member", value: blankMember() })
                  }
                  handlers={handlers}
                />
              )}
            </div>
          ) : (
            <MemberTable
              members={sorted}
              sort={sort}
              onSort={(key) =>
                setSort((s) => ({
                  key,
                  dir: s.key === key ? (-s.dir as 1 | -1) : 1,
                }))
              }
              cellName={cellName}
              handlers={handlers}
            />
          )}
          {query && !members.some(matches) && (
            <p className="muted team-none">
              Personne ne correspond à « {query} ».
            </p>
          )}
        </>
      )}
      {editing?.kind === "member" && (
        <MemberSheet
          key={editing.value.id ?? "new"}
          initial={editing.value}
          cells={cells}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === "cell" && (
        <CellSheet
          key={editing.value.id ?? "new"}
          initial={editing.value}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
export default Team;

type MemberHandlers = {
  onOpen: (m: Member) => void;
  onCycle: (m: Member) => void;
  onMove: (id: string, cellId: string) => void;
  cells: Cell[];
  stationByCallsign: Map<string, string>;
};

function CellColumn({
  cell,
  color,
  members,
  total,
  drop,
  first,
  last,
  onOver,
  onDrop,
  onEdit,
  onUp,
  onDown,
  onAdd,
  handlers,
}: {
  cell: Cell | null;
  color: string;
  members: Member[];
  total: Member[];
  drop: boolean;
  first: boolean;
  last: boolean;
  onOver: (id: string | null) => void;
  onDrop: (memberId: string) => void;
  onEdit?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onAdd: () => void;
  handlers: MemberHandlers;
}) {
  const { readOnly } = useApp();
  const hover = useHover(ref("cell", cell?.id ?? ""));
  const key = cell?.id ?? "";
  const present = total.filter((m) => m.status === "Présent").length;
  return (
    <section
      className={`team-cell${drop ? " drop" : ""}${cell ? "" : " loose"}`}
      style={{ "--cell": color } as CSSProperties}
      aria-label={cell?.name ?? "Sans poste"}
      onDragOver={(e) => {
        if (readOnly || !e.dataTransfer.types.includes("text/orion-member"))
          return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!drop) onOver(key);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onOver(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onOver(null);
        const id = e.dataTransfer.getData("text/orion-member");
        if (id) onDrop(id);
      }}
    >
      <header className="team-cell-head">
        <div className="team-cell-title">
          {cell ? (
            <button className="team-cell-name" onClick={onEdit} {...hover.bind}>
              {cell.name}
            </button>
          ) : (
            <span className="team-cell-name">Sans poste</span>
          )}
          {cell?.kind && (
            <span className="pill plain team-kind">{cell.kind}</span>
          )}
          {cell && !readOnly && (
            <span className="team-cell-tools">
              <button
                className="icon-button small"
                aria-label={`Placer ${cell.name} plus tôt`}
                title="Déplacer avant"
                disabled={first}
                onClick={onUp}
              >
                <ArrowLeft size={13} />
              </button>
              <button
                className="icon-button small"
                aria-label={`Placer ${cell.name} plus loin`}
                title="Déplacer après"
                disabled={last}
                onClick={onDown}
              >
                <ArrowRight size={13} />
              </button>
              <button
                className="icon-button small"
                aria-label={`Modifier ${cell.name}`}
                title="Modifier"
                onClick={onEdit}
              >
                <Pencil size={13} />
              </button>
            </span>
          )}
        </div>
        {cell && (cell.location || cell.phone || cell.radio) && (
          <div className="team-cell-meta">
            {cell.location && (
              <span>
                <MapPin size={12} />
                {cell.location}
              </span>
            )}
            {cell.phone && (
              <a href={`tel:${cell.phone.replace(/[^\d+]/g, "")}`}>
                <Phone size={12} />
                {cell.phone}
              </a>
            )}
            {cell.radio && (
              <span className="mono">
                <Radio size={12} />
                {cell.radio}
              </span>
            )}
          </div>
        )}
        <div className="team-cell-count">
          <PresenceBar members={total} />
          <small>
            {total.length
              ? `${present} présent${present > 1 ? "s" : ""} sur ${total.length}`
              : "Personne"}
          </small>
        </div>
      </header>
      <div className="team-members">
        {members.map((m) => (
          <MemberCard key={m.id} m={m} {...handlers} />
        ))}
        {!members.length && (
          <p className="team-drop-hint">
            {readOnly
              ? "Personne"
              : total.length
                ? "Aucun résultat"
                : "Glisser une personne ici"}
          </p>
        )}
      </div>
      {!readOnly && (
        <button className="small team-add" onClick={onAdd}>
          <Plus size={13} />
          Ajouter une personne
        </button>
      )}
      {hover.card}
    </section>
  );
}

function PresenceBar({ members }: { members: Member[] }) {
  if (!members.length) return <span className="team-bar empty" />;
  return (
    <span className="team-bar" aria-hidden="true">
      {MEMBER_STATUSES.map((s) => {
        const n = members.filter((m) => m.status === s).length;
        return n ? (
          <i
            key={s}
            className={`tone-${STATUS_TONE[s]}`}
            style={{ flexGrow: n }}
            title={`${s} : ${n}`}
          />
        ) : null;
      })}
    </span>
  );
}

function StatusPill({
  m,
  onCycle,
}: {
  m: Member;
  onCycle: (m: Member) => void;
}) {
  const { readOnly } = useApp();
  if (readOnly)
    return <span className={`pill ${STATUS_TONE[m.status]}`}>{m.status}</span>;
  return (
    <button
      className={`pill ${STATUS_TONE[m.status]} team-status`}
      onClick={() => onCycle(m)}
      title={`Statut : ${m.status}. Cliquer pour passer à « ${NEXT_STATUS[m.status]} ».`}
      aria-label={`Statut ${m.status}, passer à ${NEXT_STATUS[m.status]}`}
    >
      {m.status}
    </button>
  );
}

function Callsign({
  m,
  stations,
}: {
  m: Member;
  stations: Map<string, string>;
}) {
  if (!m.callsign) return null;
  const station = stations.get(callsignKey(m.callsign));
  return station ? (
    <LinkChip target={ref("station", station)} />
  ) : (
    <span className="team-callsign mono">
      <Radio size={11} />
      {m.callsign}
    </span>
  );
}

function MoveMenu({
  m,
  cells,
  onMove,
}: {
  m: Member;
  cells: Cell[];
  onMove: MemberHandlers["onMove"];
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <button
        className="icon-button small"
        aria-label={`Déplacer ${m.name} vers…`}
        title="Déplacer vers…"
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
      >
        <ArrowRightLeft size={13} />
      </button>
      {anchor && (
        <Popover anchor={anchor} onClose={() => setAnchor(null)} align="end">
          <div className="menu-label">Déplacer vers…</div>
          {[
            ...cells.map((c) => ({ id: c.id, name: c.name })),
            { id: "", name: "Sans poste" },
          ].map((c) => (
            <button
              key={c.id || "none"}
              data-close
              aria-current={m.cellId === c.id}
              onClick={() => onMove(m.id, c.id)}
            >
              {m.cellId === c.id ? (
                <Check size={14} />
              ) : (
                <span className="team-menu-gap" />
              )}
              {c.name}
            </button>
          ))}
        </Popover>
      )}
    </>
  );
}

function MemberCard({
  m,
  onOpen,
  onCycle,
  onMove,
  cells,
  stationByCallsign,
}: { m: Member } & MemberHandlers) {
  const { readOnly } = useApp();
  const hover = useHover(ref("member", m.id));
  const hours = shift(m);
  return (
    <article
      className={`team-member status-${STATUS_TONE[m.status]}`}
      draggable={!readOnly}
      onDragStart={(e) => {
        hover.hide();
        e.dataTransfer.setData("text/orion-member", m.id);
        e.dataTransfer.effectAllowed = "move";
        e.currentTarget.classList.add("dragging");
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove("dragging")}
    >
      <span
        className="team-avatar"
        style={avatarStyle(m.name)}
        aria-hidden="true"
      >
        {initials(m.name)}
      </span>
      <div className="team-member-main">
        <button
          className="team-member-name"
          onClick={() => onOpen(m)}
          {...hover.bind}
        >
          {m.grade && <span className="team-grade">{m.grade}</span>}
          {m.name}
        </button>
        {m.role && <span className="team-role">{m.role}</span>}
        <div className="team-member-meta">
          <StatusPill m={m} onCycle={onCycle} />
          <Callsign m={m} stations={stationByCallsign} />
          {m.phone && (
            <a
              className="team-phone"
              href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}
            >
              <Phone size={11} />
              {m.phone}
            </a>
          )}
          {hours && (
            <span
              className="team-shift mono"
              title={`Service : ${m.from ? dateTime(m.from) : "…"} → ${m.to ? dateTime(m.to) : "…"}`}
            >
              {hours}
            </span>
          )}
        </div>
      </div>
      {!readOnly && <MoveMenu m={m} cells={cells} onMove={onMove} />}
      {hover.card}
    </article>
  );
}

function MemberTable({
  members,
  sort,
  onSort,
  cellName,
  handlers,
}: {
  members: Member[];
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (key: SortKey) => void;
  cellName: (id: string) => string;
  handlers: MemberHandlers;
}) {
  const { readOnly } = useApp();
  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Nom" },
    { key: "grade", label: "Grade" },
    { key: "role", label: "Fonction" },
    { key: "cell", label: "Poste" },
    { key: "callsign", label: "Nom d’appel" },
    { key: "phone", label: "Téléphone" },
    { key: "status", label: "Statut" },
  ];
  return (
    <div className="card team-list">
      <div className="table-scroll">
        <table className="grid dense">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  aria-sort={
                    sort.key === c.key
                      ? sort.dir === 1
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <button className="team-sort" onClick={() => onSort(c.key)}>
                    {c.label}
                    {sort.key === c.key ? (
                      sort.dir === 1 ? (
                        <ArrowUp size={11} />
                      ) : (
                        <ArrowDown size={11} />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="team-sort-idle" />
                    )}
                  </button>
                </th>
              ))}
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className={m.status === "Relevé" ? "dim-row" : ""}>
                <td>
                  <span className="team-list-name">
                    <span
                      className="team-avatar small"
                      style={avatarStyle(m.name)}
                      aria-hidden="true"
                    >
                      {initials(m.name)}
                    </span>
                    <button className="link" onClick={() => handlers.onOpen(m)}>
                      {m.name}
                    </button>
                  </span>
                </td>
                <td>{m.grade}</td>
                <td>{m.role}</td>
                <td>
                  {m.cellId && cellName(m.cellId) ? (
                    <LinkChip target={ref("cell", m.cellId)} />
                  ) : (
                    <span className="muted">Sans poste</span>
                  )}
                </td>
                <td>
                  <Callsign m={m} stations={handlers.stationByCallsign} />
                </td>
                <td>
                  {m.phone && (
                    <a
                      className="team-phone"
                      href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}
                    >
                      {m.phone}
                    </a>
                  )}
                </td>
                <td>
                  <StatusPill m={m} onCycle={handlers.onCycle} />
                </td>
                <td className="row-actions">
                  {!readOnly && (
                    <MoveMenu
                      m={m}
                      cells={handlers.cells}
                      onMove={handlers.onMove}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!members.length && <p className="muted team-none">Aucune personne.</p>}
    </div>
  );
}
