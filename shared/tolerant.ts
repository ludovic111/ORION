import type { z } from "zod";

// Data received from another post may come from a newer version of orion
// aic, with fields this version does not know. The schemas are strict (an
// unknown field in a file is refused); for live synchronisation, unknown
// fields are dropped instead, and every known field is still validated.

type Def = {
  type: string;
  shape?: Record<string, z.ZodType>;
  element?: z.ZodType;
  valueType?: z.ZodType;
  innerType?: z.ZodType;
  in?: z.ZodType;
  options?: z.ZodType[];
  items?: z.ZodType[];
  getter?: () => z.ZodType;
};
const defOf = (schema: z.ZodType) =>
  (schema as unknown as { _zod: { def: Def } })._zod.def;

/** `value` without the object fields `schema` does not know, at any depth. */
export function stripUnknown(schema: z.ZodType, value: unknown): unknown {
  const def = defOf(schema);
  switch (def.type) {
    case "object": {
      if (!value || typeof value !== "object" || Array.isArray(value))
        return value;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>))
        if (def.shape && k in def.shape) out[k] = stripUnknown(def.shape[k], v);
      return out;
    }
    case "array":
      return Array.isArray(value)
        ? value.map((v) => stripUnknown(def.element!, v))
        : value;
    case "tuple":
      return Array.isArray(value) && def.items
        ? value.map((v, i) =>
            def.items![i] ? stripUnknown(def.items![i], v) : v,
          )
        : value;
    case "record":
      if (!value || typeof value !== "object" || Array.isArray(value))
        return value;
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          stripUnknown(def.valueType!, v),
        ]),
      );
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "readonly":
    case "catch":
    case "nonoptional":
      return value === undefined || value === null
        ? value
        : stripUnknown(def.innerType!, value);
    case "pipe":
      return stripUnknown(def.in!, value);
    case "lazy":
      return def.getter ? stripUnknown(def.getter(), value) : value;
    case "union": {
      // The first option the stripped value satisfies.
      for (const option of def.options ?? []) {
        const stripped = stripUnknown(option, value);
        if ((option as z.ZodType).safeParse(stripped).success) return stripped;
      }
      return value;
    }
    default:
      return value;
  }
}

/** Parse leniently: unknown fields dropped, known ones validated. */
export function parseTolerant<T extends z.ZodType>(schema: T, value: unknown) {
  return schema.safeParse(stripUnknown(schema, value)) as ReturnType<
    T["safeParse"]
  >;
}
