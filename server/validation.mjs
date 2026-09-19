import { z } from "zod";
const text = (max = 200) => z.string().trim().min(1).max(max);
const optional = (max = 2000) => z.string().trim().max(max).default("");
export const roles = ["admin", "command", "chief", "operator", "viewer"];
export const operationSchema = z
  .object({
    name: text(),
    mode: z.enum(["exercise", "real"]),
    nature: text(),
    level: z.number().int().min(1).max(4),
    location: text(),
    commander: text(),
    phase: text(),
  })
  .strict();
const point = {
  lat: z.number().min(45.8).max(46.6),
  lng: z.number().min(5.7).max(6.7),
};
export const schemas = {
  journal: z
    .object({
      title: text(1000),
      type: z.enum(["Rapport", "Ordre", "Info", "Demande", "Alerte"]),
      priority: z.enum(["P1", "P2", "P3", "P4"]),
      source: text(),
      status: z.enum(["Ouvert", "En cours", "Traité", "Clos"]),
      assignee: optional(200),
      location: optional(300),
      decision: optional(5000),
      reliability: z.enum(["Non confirmé", "Probable", "Confirmé"]),
      validated: z.boolean().default(false),
    })
    .strict(),
  resource: z
    .object({
      name: text(),
      organization: text(60),
      specialty: text(),
      personnel: z.number().int().min(0).max(100000),
      status: z.enum([
        "Disponible",
        "En route",
        "Engagé",
        "Repos / Indisponible",
      ]),
      location: optional(300),
      contact: optional(200),
      eta: optional(60),
    })
    .strict(),
  map: z
    .object({
      name: text(),
      symbol: text(120),
      ...point,
      organization: text(60),
      category: z.enum(["Effets", "Moyens", "Mesures", "Dangers"]),
      notes: optional(),
      geometry: z
        .array(
          z.tuple([
            z.number().min(45.8).max(46.6),
            z.number().min(5.7).max(6.7),
          ]),
        )
        .min(3)
        .max(100)
        .optional(),
    })
    .strict(),
  link: z
    .object({ source: text(80), target: text(80), label: text(100) })
    .strict(),
  transmission: z
    .object({
      title: text(1000),
      channel: text(100),
      sender: text(),
      recipient: text(),
      status: z.enum(["À transmettre", "Transmis", "Accusé reçu"]),
      priority: z.enum(["P1", "P2", "P3", "P4"]),
    })
    .strict(),
  report: z
    .object({
      title: text(),
      situation: text(10000),
      actions: optional(10000),
      needs: optional(10000),
      outlook: optional(10000),
      validated: z.boolean().default(false),
    })
    .strict(),
  stock: z
    .object({
      name: text(),
      total: z.number().int().min(0).max(10000000),
      available: z.number().int().min(0).max(10000000),
      location: text(),
    })
    .strict()
    .refine(
      (v) => v.available <= v.total,
      "Le disponible ne peut pas dépasser le total.",
    ),
};
export const userSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    name: text(),
    role: z.enum(roles),
    password: z.string().min(14).max(128),
    operationIds: z.array(text(80)).max(100),
  })
  .strict();
export const loginSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password: z.string().min(1).max(128),
    code: z.string().max(6).default(""),
  })
  .strict();
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireRole(user, allowed) {
  if (!allowed.includes(user.role))
    throw new HttpError(403, "Votre rôle ne permet pas cette action.");
}
