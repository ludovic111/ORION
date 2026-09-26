// Search of the symbols in French, German and Italian: an operator from
// Bern types « Feuer », a partner from Ticino « frana », both find the
// French names of the OFPP catalogue. Pure: tested in node.

/** Lower case, without accents, apostrophes and hyphens as spaces. */
export const normalizeSearch = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[’'\-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// One concept per line: French words (as in the symbol names), then German
// and Italian. Accents are removed when the table is read.
const CONCEPTS: string[][] = [
  [
    "incendie",
    "feu",
    "flamme",
    "brule",
    "feuer",
    "brand",
    "flamme",
    "incendio",
    "fuoco",
    "fiamma",
  ],
  [
    "inondation",
    "inonde",
    "crue",
    "eau",
    "flux",
    "hochwasser",
    "uberschwemmung",
    "ueberschwemmung",
    "wasser",
    "flut",
    "inondazione",
    "alluvione",
    "piena",
    "acqua",
  ],
  [
    "blesse",
    "victime",
    "verletzt",
    "verletzte",
    "verwundet",
    "ferito",
    "feriti",
    "vittima",
  ],
  [
    "mort",
    "deces",
    "cadavre",
    "tot",
    "tote",
    "todesfall",
    "leiche",
    "morto",
    "morti",
    "decesso",
    "salma",
  ],
  ["disparu", "vermisst", "vermisste", "disperso", "dispersi", "scomparso"],
  [
    "sans abri",
    "abri",
    "hebergement",
    "obdachlos",
    "unterkunft",
    "senzatetto",
    "alloggio",
    "rifugio",
  ],
  ["enferme", "bloque", "eingeschlossen", "intrappolato", "bloccato"],
  ["explosion", "sprengung", "detonation", "esplosione"],
  ["gaz", "gas"],
  ["chimique", "chemisch", "chemie", "chimico"],
  [
    "radioactif",
    "radioactive",
    "nucleaire",
    "radioaktiv",
    "strahlung",
    "atom",
    "radioattivo",
    "nucleare",
  ],
  ["biologique", "biologisch", "biologico"],
  [
    "electrique",
    "electricite",
    "courant",
    "elektrisch",
    "strom",
    "elettrico",
    "elettricita",
  ],
  [
    "glissement",
    "eboulement",
    "lave",
    "rutschung",
    "erdrutsch",
    "murgang",
    "bergsturz",
    "felssturz",
    "frana",
    "smottamento",
  ],
  ["avalanche", "lawine", "valanga"],
  ["route", "chemin", "voie", "rue", "strasse", "weg", "strada", "via"],
  [
    "barree",
    "barrage",
    "fermeture",
    "impraticable",
    "sperre",
    "absperrung",
    "gesperrt",
    "sbarramento",
    "chiuso",
    "blocco",
  ],
  ["deviation", "umleitung", "deviazione"],
  [
    "vehicule",
    "voiture",
    "camion",
    "fahrzeug",
    "auto",
    "lastwagen",
    "lkw",
    "veicolo",
    "automezzo",
  ],
  [
    "ambulance",
    "sanitaire",
    "krankenwagen",
    "ambulanz",
    "rettungswagen",
    "sanitat",
    "ambulanza",
    "sanitario",
  ],
  ["pompier", "sapeur", "feuerwehr", "pompieri", "vigili del fuoco"],
  ["police", "gendarmerie", "polizei", "polizia"],
  [
    "helicoptere",
    "heliport",
    "helikopter",
    "hubschrauber",
    "elicottero",
    "eliporto",
  ],
  [
    "commandement",
    "conduite",
    "poste de commandement",
    "kommandoposten",
    "fuhrung",
    "fuehrung",
    "comando",
    "condotta",
    "posto di comando",
  ],
  [
    "rassemblement",
    "rencontre",
    "sammelplatz",
    "treffpunkt",
    "sammelstelle",
    "raduno",
    "punto d incontro",
  ],
  ["tente", "zelt", "tenda"],
  ["hopital", "spital", "krankenhaus", "ospedale"],
  ["medecin", "soins", "arzt", "pflege", "medico", "cure"],
  [
    "ravitaillement",
    "subsistance",
    "repas",
    "verpflegung",
    "vettovagliamento",
    "pasti",
  ],
  [
    "degat",
    "destruction",
    "dommage",
    "schaden",
    "zerstorung",
    "zerstoerung",
    "danno",
    "distruzione",
  ],
  ["decombre", "gravats", "trummer", "truemmer", "schutt", "macerie"],
  ["protection civile", "zivilschutz", "protezione civile"],
  ["evacuation", "evakuierung", "evakuation", "evacuazione"],
  ["sauvetage", "rettung", "bergung", "salvataggio", "soccorso"],
  ["contamin", "kontamination", "verseucht", "contaminazione", "contaminato"],
  ["danger", "gefahr", "pericolo"],
  ["pont", "brucke", "bruecke", "ponte"],
  [
    "batiment",
    "maison",
    "immeuble",
    "gebaude",
    "gebaeude",
    "haus",
    "edificio",
    "casa",
  ],
  [
    "personne",
    "population",
    "person",
    "personen",
    "bevolkerung",
    "persona",
    "persone",
    "popolazione",
  ],
  ["chien", "cynophile", "hund", "cane"],
  [
    "train",
    "rail",
    "gare",
    "zug",
    "bahn",
    "bahnhof",
    "treno",
    "ferrovia",
    "stazione",
  ],
  ["bateau", "boot", "schiff", "barca", "nave"],
  ["pompe", "motopompe", "pumpe", "motorspritze", "pompa", "motopompa"],
  ["carburant", "essence", "treibstoff", "benzin", "carburante", "benzina"],
  ["observation", "beobachtung", "osservazione"],
  ["information", "info", "informazione"],
  [
    "mouvement",
    "deplacement",
    "direction",
    "bewegung",
    "richtung",
    "movimento",
    "direzione",
  ],
  [
    "formation",
    "unite",
    "detachement",
    "section",
    "einheit",
    "zug",
    "formazione",
    "unita",
    "distaccamento",
  ],
  ["neige", "schnee", "neve"],
  ["tempete", "vent", "sturm", "wind", "tempesta", "vento"],
  ["seisme", "tremblement", "erdbeben", "terremoto"],
  ["installation", "anlage", "impianto"],
  ["emplacement", "standort", "ubicazione"],
].map((words) => words.map(normalizeSearch));

/**
 * Words to look for when an operator types `term`: the term itself and,
 * when it names a concept in any of the three languages, its French words.
 */
export function expandTerm(term: string): string[] {
  const t = normalizeSearch(term);
  if (!t) return [];
  const out = new Set([t]);
  for (const words of CONCEPTS) {
    const hit = words.some(
      (w) =>
        w === t ||
        (t.length >= 3 && w.startsWith(t)) ||
        (w.length >= 4 && t.startsWith(w)),
    );
    if (hit) for (const w of words) out.add(w);
  }
  return [...out];
}

/**
 * Does a symbol, described by `text` (name, group, family, keywords),
 * answer the query? Every term must match: the term anywhere in the text,
 * or one of its translations at the start of a word.
 */
export function symbolMatches(text: string, query: string): boolean {
  const hay = ` ${normalizeSearch(text)}`;
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  return terms.every((term) => {
    if (hay.includes(term)) return true;
    return expandTerm(term).some((w) => hay.includes(` ${w}`));
  });
}
