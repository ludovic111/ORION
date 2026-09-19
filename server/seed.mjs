import { randomUUID, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hashPassword, audit } from "./security.mjs";
export async function seedDemo(
  db,
  { symbolCatalog, invitationOnly = false } = {},
) {
  if ((await db.query("SELECT id FROM users LIMIT 1")).rows.length) return;
  const catalog =
    symbolCatalog ??
    JSON.parse(
      await readFile(
        new URL("../public/symbols/catalog.json", import.meta.url),
        "utf8",
      ),
    );
  const symbol = (name) =>
    catalog.find((s) => s.name.toLowerCase().includes(name))?.id ??
    catalog[0].id;
  const userId = randomUUID(),
    opId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.query(
      "INSERT INTO users(id,email,name,role,password_hash) VALUES($1,$2,$3,$4,$5)",
      [
        userId,
        "demo@orion.local",
        "Cap C. Meyer",
        "admin",
        invitationOnly
          ? "invitation-only"
          : await hashPassword(randomBytes(32).toString("hex")),
      ],
    );
    await tx.query(
      "INSERT INTO operations(id,name,mode,nature,level,location,commander,phase) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        opId,
        "EX ORION-26 · Crue de l’Arve",
        "exercise",
        "Inondation / crue",
        3,
        "Carouge · Genève",
        "Cdt ORPC · exercice",
        "Montée en puissance",
      ],
    );
    await tx.query(
      "INSERT INTO memberships(operation_id,user_id) VALUES($1,$2)",
      [opId, userId],
    );
    async function add(kind, data, minutes = 0) {
      const id = randomUUID();
      await tx.query(
        "INSERT INTO records(id,operation_id,kind,data,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6)",
        [
          id,
          opId,
          kind,
          JSON.stringify(data),
          userId,
          new Date(Date.now() - minutes * 60000),
        ],
      );
      return id;
    }
    const journals = [];
    for (const [title, type, priority, source, status, assignee, minutes] of [
      [
        "Débordement Arve — quai du Cheval-Blanc, niveau +1,2 m, 3 immeubles concernés",
        "Rapport",
        "P1",
        "Sect. Carouge",
        "Ouvert",
        "C. Meyer",
        1,
      ],
      [
        "Engager DIP 2 (12 pers.) en renfort sacs de sable, rue de la Fontenette",
        "Ordre",
        "P2",
        "Cdt ORPC",
        "En cours",
        "Lt A. Rossi",
        5,
      ],
      [
        "Fermeture pont de Carouge côté Plainpalais jusqu’à nouvel avis",
        "Info",
        "P3",
        "SIS Genève",
        "Traité",
        "",
        10,
      ],
      [
        "Besoin de 40 lits et couvertures, salle communale Lancy-Sud",
        "Demande",
        "P2",
        "Commune de Lancy",
        "En cours",
        "Sgt L. Nguyen",
        17,
      ],
      [
        "POLYCOM : test radio réalisé avec le PC Lancy (simulation)",
        "Rapport",
        "P3",
        "Télématique",
        "Traité",
        "Télématique",
        24,
      ],
      [
        "Alerte crue Arve, niveau 3 — station Bout-du-Monde, tendance montante (simulation)",
        "Alerte",
        "P1",
        "Cellule exercice",
        "Traité",
        "Cdt ORPC",
        37,
      ],
      [
        "Livraison de 2 000 sacs de sable au dépôt Vernier",
        "Info",
        "P4",
        "Logistique",
        "Clos",
        "",
        51,
      ],
    ])
      journals.push(
        await add(
          "journal",
          {
            title,
            type,
            priority,
            source,
            status,
            assignee,
            location: "Carouge",
            decision: "",
            reliability: "Non confirmé",
            validated: false,
          },
          minutes,
        ),
      );
    const resources = [];
    for (const [name, specialty, personnel, status, location, organization] of [
      ["DIP 1", "Pionniers", 12, "Engagé", "Quai Cheval-Blanc", "PCi"],
      ["DIP 2", "Pionniers", 12, "En route", "Fontenette", "PCi"],
      ["Ass. 1", "Assistance", 18, "Engagé", "Lancy-Sud", "PCi"],
      ["Log 1", "Logistique", 8, "Engagé", "Dépôt Vernier", "PCi"],
      ["Télém. 1", "Aide à la conduite", 6, "Engagé", "PC-Carouge", "PCi"],
      ["DIP 3", "Pionniers", 12, "Disponible", "Dépôt Vernier", "PCi"],
      ["Ass. 2", "Assistance", 16, "Disponible", "Caserne Lancy", "PCi"],
      ["PBC 1", "Biens culturels", 6, "Disponible", "Vernier", "PCi"],
      ["Log 2", "Logistique", 6, "En route", "Lancy-Sud", "PCi"],
      ["DIP 4", "Pionniers", 12, "Repos / Indisponible", "Vernier", "PCi"],
      ["Ass. 3", "Assistance", 14, "Repos / Indisponible", "Lancy", "PCi"],
      [
        "SIS · Pompage",
        "2 engins de pompage",
        8,
        "Engagé",
        "Quai des Vernets",
        "SIS",
      ],
      [
        "POL · Bouclage",
        "Sécurisation du périmètre",
        6,
        "Engagé",
        "Carouge",
        "POL",
      ],
      [
        "SAN · Accueil",
        "Prise en charge sanitaire",
        4,
        "Disponible",
        "HUG",
        "SAN",
      ],
      ["SAM · Rassemblement", "Accueil", 8, "Engagé", "Lancy", "SAM"],
      ["COM · Voirie", "Signalisation", 4, "En route", "Carouge", "COM"],
    ])
      resources.push(
        await add("resource", {
          name,
          specialty,
          personnel,
          status,
          location,
          organization,
          contact: "Contact fictif · exercice",
          eta: "",
        }),
      );
    const maps = [];
    for (const [name, lat, lng, sym, category, organization] of [
      ["Débordement Arve", 46.1846, 6.1401, "inondation", "Effets", "PCi"],
      ["PC-Carouge", 46.1813, 6.1381, "03.pc engagement", "Moyens", "PCi"],
      [
        "DIP 2 · sacs de sable",
        46.181,
        6.1452,
        "protection civile",
        "Moyens",
        "PCi",
      ],
      [
        "Pont de Carouge fermé",
        46.1889,
        6.14,
        "fermeture de la route",
        "Mesures",
        "POL",
      ],
      ["2 engins de pompage", 46.19, 6.1352, "fourgon tonne", "Moyens", "SIS"],
      [
        "Lancy-Sud · accueil",
        46.177,
        6.121,
        "poste d assistance",
        "Moyens",
        "PCi",
      ],
      [
        "Bouclage quai des Vernets",
        46.1932,
        6.1318,
        "fermeture de la route",
        "Mesures",
        "POL",
      ],
      ["HUG · accueil", 46.1936, 6.148, "sanitaire", "Moyens", "SAN"],
    ])
      maps.push(
        await add("map", {
          name,
          lat,
          lng,
          symbol: symbol(sym),
          category,
          organization,
          notes: "Position indicative du scénario fictif.",
        }),
      );
    await add("map", {
      name: "Zone A3 · périmètre d’exercice",
      lat: 46.185,
      lng: 6.142,
      symbol: symbol("zone inondée"),
      category: "Effets",
      organization: "PCi",
      notes:
        "Zone dessinée pour la démonstration, sans valeur de carte de danger.",
      geometry: [
        [46.188, 6.134],
        [46.189, 6.143],
        [46.182, 6.15],
        [46.18, 6.145],
        [46.184, 6.136],
      ],
    });
    for (const [source, target, label] of [
      [journals[0], maps[0], "localise"],
      [journals[5], journals[0], "précède"],
      [journals[1], resources[1], "engage"],
      [resources[1], maps[2], "positionne"],
      [journals[0], journals[1], "motive"],
      [journals[3], resources[2], "mobilise"],
    ])
      await add("link", { source, target, label });
    for (const [name, total, available, location] of [
      ["Sacs de sable", 2000, 1240, "Vernier"],
      ["Pompes 1 200 l/min", 6, 2, "Vernier / Carouge"],
      ["Lits de camp", 120, 80, "Lancy"],
      ["Groupes électrogènes", 4, 3, "Vernier"],
      ["Radios", 48, 11, "PC-Carouge"],
    ])
      await add("stock", { name, total, available, location });
    await add("transmission", {
      title: "Demande de renfort à la Fontenette",
      channel: "Réseau exercice",
      sender: "PC-Carouge",
      recipient: "DIP 2",
      status: "Transmis",
      priority: "P2",
    });
    await add("transmission", {
      title: "Confirmer la disponibilité des lits de camp",
      channel: "Téléphone · exercice",
      sender: "PC-Carouge",
      recipient: "Logistique Lancy",
      status: "À transmettre",
      priority: "P2",
    });
    await audit(tx, userId, "demo.initialized", opId, opId, {
      synthetic: true,
    });
  });
}
