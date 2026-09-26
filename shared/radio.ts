import { z } from "zod";
import { enumLabel } from "./i18n/enums.ts";
import { t as tr } from "./i18n/radio.ts";

export const TALKGROUP_USAGES = [
  "Conduite",
  "Engagement",
  "Logistique",
  "Coordination",
  "Appel",
  "Réserve",
] as const;
// Polycom (TETRAPOL): talkgroup on the network, direct mode, or autonomous relay.
export const TALKGROUP_MODES = ["Groupe", "Direct", "Relais"] as const;
export const TERMINAL_KINDS = ["Portatif", "Véhicule", "Fixe"] as const;
export const TERMINAL_MODELS = [
  "TPH900",
  "TPH700",
  "TPM700",
  "G2 Smart",
] as const;
export const ACCESSORIES = [
  "Batterie de rechange",
  "Microtel",
  "Adaptateur FUGA",
  "Chargeur",
  "Antenne",
  "Housse",
] as const;
export const TERMINAL_CONDITIONS = [
  "Opérationnel",
  "À recharger",
  "Défectueux",
  "Manquant",
] as const;
export const BATTERY_LEVELS = ["Pleine", "Partielle", "Faible"] as const;
// OFPP radio procedure: audibility THREE (bon), TWO (faible mais compréhensible), ONE (insuffisant).
export const CHECK_RESULTS = ["3", "2", "1", "0"] as const;
export const CHECK_LABELS: Record<(typeof CHECK_RESULTS)[number], string> = {
  get "3"() {
    return tr("THREE · bon");
  },
  get "2"() {
    return tr("TWO · faible");
  },
  get "1"() {
    return tr("ONE · insuffisant");
  },
  get "0"() {
    return tr("Pas de liaison");
  },
};

const text = (max = 500) => z.string().max(max);
const instant = z.iso.datetime({ offset: true });
const optionalInstant = z.union([instant, z.literal("")]);

export const talkgroupSchema = z
  .object({
    id: z.uuid(),
    name: text(80).min(1),
    number: text(40),
    usage: z.enum(TALKGROUP_USAGES),
    mode: z.enum(TALKGROUP_MODES),
    notes: text(1000),
  })
  .strict();
export const stationSchema = z
  .object({
    id: z.uuid(),
    callsign: text(60).min(1),
    role: text(200),
    unit: text(200),
    primary: z.union([z.uuid(), z.literal("")]),
    fallback: z.union([z.uuid(), z.literal("")]),
    notes: text(1000),
  })
  .strict();
export const assignmentSchema = z
  .object({
    id: z.uuid(),
    holder: text(200).min(1),
    callsign: text(60),
    role: text(200),
    unit: text(200),
    accessories: text(500),
    battery: z.enum(BATTERY_LEVELS),
    issuedAt: instant,
    issuedBy: text(120).min(1),
    returnedAt: optionalInstant,
    returnedBy: text(120),
    returnCondition: z.union([z.enum(TERMINAL_CONDITIONS), z.literal("")]),
    notes: text(1000),
  })
  .strict();
export const terminalSchema = z
  .object({
    id: z.uuid(),
    label: text(40).min(1),
    kind: z.enum(TERMINAL_KINDS),
    model: text(80),
    serial: text(80),
    rfsi: text(40),
    condition: z.enum(TERMINAL_CONDITIONS),
    notes: text(1000),
    assignments: z.array(assignmentSchema).max(500),
  })
  .strict();
export const checkSchema = z
  .object({
    id: z.uuid(),
    at: instant,
    by: text(120).min(1),
    callsign: text(60).min(1),
    talkgroupId: z.union([z.uuid(), z.literal("")]),
    result: z.enum(CHECK_RESULTS),
    notes: text(500),
  })
  .strict();
export const radioSchema = z
  .object({
    talkgroups: z.array(talkgroupSchema).max(100),
    stations: z.array(stationSchema).max(500),
    terminals: z.array(terminalSchema).max(1000),
    checks: z.array(checkSchema).max(5000),
  })
  .strict()
  .superRefine((radio, ctx) => {
    const groups = new Set(radio.talkgroups.map((g) => g.id));
    const unique = (label: string, values: string[]) => {
      if (new Set(values).size !== values.length)
        ctx.addIssue({
          code: "custom",
          message: tr("{label} dupliqués.", { label }),
        });
    };
    unique(
      tr("Groupes"),
      radio.talkgroups.map((g) => g.id),
    );
    unique(
      tr("Noms d’appel"),
      radio.stations.map((s) => s.id),
    );
    unique(
      tr("Noms d’appel"),
      radio.stations.map((s) => callsignKey(s.callsign)),
    );
    unique(
      tr("Terminaux"),
      radio.terminals.map((t) => t.id),
    );
    unique(
      tr("Contrôles"),
      radio.checks.map((c) => c.id),
    );
    unique(
      tr("N° de terminaux"),
      radio.terminals.map((t) => t.label.trim().toLocaleUpperCase("fr")),
    );
    const linked = [
      ...radio.stations.flatMap((s) => [s.primary, s.fallback]),
      ...radio.checks.map((c) => c.talkgroupId),
    ].filter(Boolean);
    if (linked.some((id) => !groups.has(id)))
      ctx.addIssue({
        code: "custom",
        message: tr("Groupe radio introuvable."),
      });
    for (const terminal of radio.terminals) {
      unique(
        tr("Remises"),
        terminal.assignments.map((a) => a.id),
      );
      if (terminal.assignments.slice(0, -1).some((a) => !a.returnedAt))
        ctx.addIssue({
          code: "custom",
          message: tr("Terminal {label} remis deux fois sans retour.", {
            label: terminal.label,
          }),
        });
    }
  });

export type Talkgroup = z.infer<typeof talkgroupSchema>;
export type Station = z.infer<typeof stationSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type Terminal = z.infer<typeof terminalSchema>;
export type RadioCheck = z.infer<typeof checkSchema>;
export type Radio = z.infer<typeof radioSchema>;

export const emptyRadio = (): Radio => ({
  talkgroups: [],
  stations: [],
  terminals: [],
  checks: [],
});

export const callsignKey = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleUpperCase("fr");

export const activeAssignment = (terminal: Terminal) => {
  const last = terminal.assignments.at(-1);
  return last && !last.returnedAt ? last : undefined;
};
export type TerminalState = "En service" | "Disponible" | Terminal["condition"];
export const terminalState = (terminal: Terminal): TerminalState =>
  activeAssignment(terminal)
    ? "En service"
    : terminal.condition === "Opérationnel"
      ? "Disponible"
      : terminal.condition;

export function radioSummary(radio: Radio) {
  const states = radio.terminals.map(terminalState);
  return {
    terminals: radio.terminals.length,
    issued: states.filter((s) => s === "En service").length,
    available: states.filter((s) => s === "Disponible").length,
    unavailable: states.filter((s) => s !== "En service" && s !== "Disponible")
      .length,
    talkgroups: radio.talkgroups.length,
    stations: radio.stations.length,
  };
}

/** Terminal currently held under a call sign, and the latest radio check. */
export function stationStatus(radio: Radio, callsign: string) {
  const key = callsignKey(callsign);
  const terminal = radio.terminals.find((t) => {
    const open = activeAssignment(t);
    return open && callsignKey(open.callsign) === key;
  });
  const check = [...radio.checks]
    .reverse()
    .find((c) => callsignKey(c.callsign) === key);
  return {
    terminal,
    assignment: terminal && activeAssignment(terminal),
    check,
  };
}

export function issueTerminal(
  radio: Radio,
  terminalId: string,
  assignment: Omit<
    Assignment,
    "id" | "returnedAt" | "returnedBy" | "returnCondition"
  >,
): Radio {
  const terminal = radio.terminals.find((t) => t.id === terminalId);
  if (!terminal) throw new Error(tr("Terminal introuvable."));
  if (activeAssignment(terminal))
    throw new Error(
      tr("{label} est déjà remis. Enregistrez son retour.", {
        label: terminal.label,
      }),
    );
  if (terminal.condition === "Défectueux" || terminal.condition === "Manquant")
    throw new Error(
      tr("{label} est signalé {condition}.", {
        label: terminal.label,
        condition: enumLabel(terminal.condition).toLowerCase(),
      }),
    );
  return radioSchema.parse({
    ...radio,
    terminals: radio.terminals.map((t) =>
      t.id === terminalId
        ? {
            ...t,
            assignments: [
              ...t.assignments,
              {
                ...assignment,
                id: crypto.randomUUID(),
                returnedAt: "",
                returnedBy: "",
                returnCondition: "",
              },
            ],
          }
        : t,
    ),
  });
}

export function returnTerminal(
  radio: Radio,
  terminalId: string,
  at: string,
  by: string,
  condition: Terminal["condition"],
  notes = "",
): Radio {
  const terminal = radio.terminals.find((t) => t.id === terminalId);
  const open = terminal && activeAssignment(terminal);
  if (!terminal || !open) throw new Error(tr("Aucune remise en cours."));
  if (Date.parse(at) < Date.parse(open.issuedAt))
    throw new Error(tr("Le retour précède la remise."));
  return radioSchema.parse({
    ...radio,
    terminals: radio.terminals.map((t) =>
      t.id === terminalId
        ? {
            ...t,
            condition,
            assignments: t.assignments.map((a) =>
              a.id === open.id
                ? {
                    ...a,
                    returnedAt: at,
                    returnedBy: by,
                    returnCondition: condition,
                    notes: [a.notes, notes].filter(Boolean).join("\n"),
                  }
                : a,
            ),
          }
        : t,
    ),
  });
}

export function removeTalkgroup(radio: Radio, id: string): Radio {
  if (radio.checks.some((c) => c.talkgroupId === id))
    throw new Error(
      tr("Ce groupe figure dans des contrôles de liaison. Il reste au plan."),
    );
  return radioSchema.parse({
    ...radio,
    talkgroups: radio.talkgroups.filter((g) => g.id !== id),
    stations: radio.stations.map((s) => ({
      ...s,
      primary: s.primary === id ? "" : s.primary,
      fallback: s.fallback === id ? "" : s.fallback,
    })),
  });
}

export function removeTerminal(radio: Radio, id: string): Radio {
  const terminal = radio.terminals.find((t) => t.id === id);
  if (terminal?.assignments.length)
    throw new Error(
      tr(
        "Ce terminal a un historique de remise. Marquez-le hors service plutôt que de le supprimer.",
      ),
    );
  return radioSchema.parse({
    ...radio,
    terminals: radio.terminals.filter((t) => t.id !== id),
  });
}

/** Terminal numbers such as R-01…R-12. Existing labels are skipped. */
export function terminalSeries(
  radio: Radio,
  prefix: string,
  from: number,
  count: number,
  template: Pick<Terminal, "kind" | "model">,
): Radio {
  if (count < 1 || count > 200) throw new Error(tr("De 1 à 200 terminaux."));
  const taken = new Set(
    radio.terminals.map((t) => t.label.toLocaleUpperCase("fr")),
  );
  const width = Math.max(2, String(from + count - 1).length);
  const added: Terminal[] = [];
  for (let n = from; n < from + count; n++) {
    const label = `${prefix}${String(n).padStart(width, "0")}`;
    if (taken.has(label.toLocaleUpperCase("fr"))) continue;
    added.push({
      id: crypto.randomUUID(),
      label,
      kind: template.kind,
      model: template.model,
      serial: "",
      rfsi: "",
      condition: "Opérationnel",
      notes: "",
      assignments: [],
    });
  }
  return radioSchema.parse({
    ...radio,
    terminals: [...radio.terminals, ...added],
  });
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

function mergeAssignment(a: Assignment, b: Assignment): Assignment | null {
  if (same(a, b)) return a;
  const open = (x: Assignment) => ({
    ...x,
    returnedAt: "",
    returnedBy: "",
    returnCondition: "",
    notes: "",
  });
  // A return recorded on another post completes the same remise.
  if (same(open(a), open(b)) && (!a.returnedAt || !b.returnedAt))
    return a.returnedAt ? a : b;
  return null;
}

export function planRadioMerge(target: Radio, incoming: Radio) {
  let added = 0,
    updated = 0,
    conflicts = 0;
  const merge = <T extends { id: string }>(
    mine: T[],
    theirs: T[],
    combine: (a: T, b: T) => T | null = (a, b) => (same(a, b) ? a : null),
  ) => {
    const result = [...mine];
    for (const item of theirs) {
      const index = result.findIndex((x) => x.id === item.id);
      if (index < 0) {
        result.push(item);
        added++;
        continue;
      }
      const combined = combine(result[index], item);
      if (!combined) conflicts++;
      else if (!same(combined, result[index])) {
        result[index] = combined;
        updated++;
      }
    }
    return result;
  };
  const radio: Radio = {
    talkgroups: merge(target.talkgroups, incoming.talkgroups),
    stations: merge(target.stations, incoming.stations),
    terminals: merge(target.terminals, incoming.terminals, (a, b) => {
      const base = (t: Terminal) => ({ ...t, condition: "", assignments: [] });
      if (!same(base(a), base(b))) return null;
      let failed = false;
      const assignments = [...a.assignments];
      for (const item of b.assignments) {
        const index = assignments.findIndex((x) => x.id === item.id);
        if (index < 0) assignments.push(item);
        else {
          const combined = mergeAssignment(assignments[index], item);
          if (combined) assignments[index] = combined;
          else failed = true;
        }
      }
      if (failed) return null;
      assignments.sort(
        (x, y) => Date.parse(x.issuedAt) - Date.parse(y.issuedAt),
      );
      const newer =
        b.assignments.length > a.assignments.length ||
        (b.assignments.at(-1)?.returnedAt && !a.assignments.at(-1)?.returnedAt);
      return {
        ...a,
        condition: newer ? b.condition : a.condition,
        assignments,
      };
    }),
    checks: merge(target.checks, incoming.checks),
  };
  radio.checks.sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
  const valid = radioSchema.safeParse(radio);
  return {
    radio: valid.success ? valid.data : target,
    added,
    updated,
    conflicts: valid.success ? conflicts : conflicts + 1,
  };
}

/** Battery check due after this many hours in service. */
export const BATTERY_HOURS = 8;
export const batteryDue = (terminal: Terminal, at = Date.now()) => {
  const open = activeAssignment(terminal);
  return !!open && at - Date.parse(open.issuedAt) >= BATTERY_HOURS * 3_600_000;
};

/** Terminal label from a scanned QR value or typed text. */
export function scannedLabel(value: string) {
  const hash = value.match(/#scan=([^&\s]+)/);
  return (hash ? decodeURIComponent(hash[1]) : value).trim();
}
export const findTerminal = (radio: Radio, value: string) =>
  radio.terminals.find(
    (t) => callsignKey(t.label) === callsignKey(scannedLabel(value)),
  );
/** URL printed in a terminal's QR label; the phone camera opens it. */
export const terminalUrl = (origin: string, terminal: Terminal) =>
  `${origin}/#scan=${encodeURIComponent(terminal.label)}`;
