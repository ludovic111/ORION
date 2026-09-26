import { useMemo } from "react";
import type { Journal } from "../../shared/journal";
import type { Module } from "../../shared/links";
import { norm, type Identity } from "../../shared/diffusion";
import { openLiaisons } from "../../shared/liaison";
import { readPost, usePost, type PostSettings } from "./store";

// What a function (the role chosen for a post) opens first and puts
// forward. Functions come from the référentiel "postRoles" and may be
// typed freely: an unknown function opens "Mes tâches".

export type RoleProfile = {
  landing: Module;
  /** Modules this function works in most, shown first in "Mes tâches". */
  focus: Module[];
  /** One line saying what the function follows. */
  hint: string;
};

const PROFILES: Record<string, RoleProfile> = {
  "chef d'intervention": {
    landing: "situation",
    focus: ["situation", "orders", "agenda", "missions"],
    hint: "Décide, donne les ordres, tient le rythme de conduite.",
  },
  "chef situation": {
    landing: "situation",
    focus: ["situation", "map", "messages", "weather"],
    hint: "Suit et présente la situation, prépare les rapports.",
  },
  "aide a la conduite": {
    landing: "journal",
    focus: ["journal", "messages", "missions", "agenda"],
    hint: "Tient le journal, trie les messages, suit les échéances.",
  },
  logistique: {
    landing: "resources",
    focus: ["resources", "missions", "contacts", "team"],
    hint: "Moyens, demandes, ravitaillement, hébergement.",
  },
  telematique: {
    landing: "radio",
    focus: ["radio", "messages", "team", "network"],
    hint: "Réseau radio, terminaux, liaisons et transmissions.",
  },
  "personnel / admin": {
    landing: "team",
    focus: ["team", "contacts", "agenda", "journal"],
    hint: "Présences, relèves, annuaire et administration.",
  },
  liaison: {
    landing: "orders",
    focus: ["orders", "messages", "contacts", "situation"],
    hint: "Échanges avec l’autre PC et les partenaires, accusés de lecture.",
  },
};

export function roleProfile(role: string): RoleProfile | null {
  const key = norm(role);
  if (!key) return null;
  if (PROFILES[key]) return PROFILES[key];
  const found = Object.entries(PROFILES).find(
    ([k]) => key.startsWith(k) || k.startsWith(key),
  );
  return found?.[1] ?? null;
}

/** Module this post opens on: its own choice, else its function's. */
export function landingOf(post: PostSettings): Module | null {
  if (post.landing) return post.landing;
  if (!post.role) return null;
  return roleProfile(post.role)?.landing ?? "tasks";
}

/** Name of this command post for its liaisons ("PC front"), if any. */
export const pcName = (journal: Pick<Journal, "ops">) =>
  openLiaisons(journal.ops)[0]?.self ??
  journal.ops.liaisons.find((l) => !l.closedAt)?.self ??
  "";

export const identityOf = (
  journal: Pick<Journal, "ops">,
  author: string,
  post: Pick<PostSettings, "role" | "cell"> = readPost(),
): Identity => ({
  name: author,
  role: post.role,
  cell: post.cell,
  pc: pcName(journal),
});

/** Who this post is, for diffusions and tasks. */
export function useIdentity(journal: Journal, author: string): Identity {
  const [post] = usePost();
  const pc = pcName(journal);
  return useMemo(
    () => ({ name: author, role: post.role, cell: post.cell, pc }),
    [author, post.role, post.cell, pc],
  );
}
