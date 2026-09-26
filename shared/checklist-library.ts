import type { ChecklistStep } from "./conduct-schemas.ts";
import type { Lang } from "./i18n/core.ts";
import { LIST_VALUES } from "./i18n/seeds.ts";
import { DEFAULT_LISTS } from "./ops.ts";
import { TEMPLATES_DE } from "./checklist-library-de.ts";
import { TEMPLATES_IT } from "./checklist-library-it.ts";

// Built-in checklists of a cantonal civil protection command post (PCi,
// aide à la conduite). Practical steps, in the order they are usually
// done; every list can be changed, duplicated or hidden in the journal.
// Functions follow the référentiel "roles" (shared/ops.ts). "min" is the
// "contrôle dans X min" timer: ticking the step opens a follow-up due then.

export type BuiltinTemplate = {
  key: string;
  name: string;
  event: string;
  description: string;
  steps: ChecklistStep[];
};

type Row = [text: string, role: string, minutes?: number, log?: boolean];

const steps = (rows: Row[]): ChecklistStep[] =>
  rows.map(([text, role, minutes = 0, log = true], i) => ({
    id: `s${String(i + 1).padStart(2, "0")}`,
    text,
    role,
    minutes,
    log,
  }));

const CHEF = "Chef d’intervention";
const EM = "Chef d’état-major";
const AIC = "Chef AIC";
const SIT = "Suivi de la situation";
const JOURNAL = "Opérateur journal";
const RADIO = "Opérateur radio";
const TEL = "Téléphoniste";
const CARTO = "Cartographe";
const LOG = "Chef logistique";
const TELEM = "Chef télématique";
const LIAISON = "Officier de liaison";
const SECR = "Secrétariat";
const PRESSE = "Communication / presse";

export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    key: "ouverture-pc",
    name: "Ouverture du PC",
    event: "Ouverture du PC",
    description:
      "De l’alarme au premier point de situation : local, énergie, liaisons, fonctions, annonces.",
    steps: steps([
      [
        "Accuser réception de l’alarme : heure, origine (centrale, CECAL, commune), mission reçue",
        JOURNAL,
      ],
      [
        "Ouvrir le journal d’intervention et consigner la mise sur pied",
        JOURNAL,
      ],
      [
        "Contrôler le local du PC : accès, électricité, ventilation, chauffage, eau, sanitaires",
        LOG,
        0,
        false,
      ],
      [
        "Mettre en service l’alimentation de secours (groupe, ASI) et tester la bascule",
        TELEM,
        60,
      ],
      [
        "Mettre en service postes de travail, imprimante, réseau et synchronisation entre postes",
        TELEM,
        0,
        false,
      ],
      [
        "Mettre en service les radios Polycom, contrôle de liaison avec la centrale et les engagés",
        RADIO,
        60,
      ],
      ["Tester les lignes fixes et mobiles, diffuser les numéros du PC", TEL],
      [
        "Afficher la carte de situation, les tableaux de situation et le rythme de conduite",
        CARTO,
        0,
        false,
      ],
      [
        "Établir la liste de présence et attribuer les fonctions (conduite, journal, radio, situation)",
        AIC,
      ],
      [
        "Annoncer l’ouverture du PC (heure, numéros, nom d’appel) : police, SIS, sanitaire, commune, canton",
        LIAISON,
      ],
      ["Fixer l’heure du premier rapport de conduite et le rythme", EM],
      [
        "Organiser la subsistance et le plan de relève si l’engagement dépasse 12 h",
        LOG,
        0,
        false,
      ],
      ["Premier point de situation au chef d’intervention", SIT],
    ]),
  },
  {
    key: "crue",
    name: "Crue / inondation",
    event: "Crue / inondation",
    description:
      "Suivre les niveaux, protéger les zones menacées, fermer les berges, préparer l’évacuation.",
    steps: steps([
      [
        "Relever niveaux et débits (hydrologie OFEV, stations cantonales) et leur prévision",
        SIT,
        60,
      ],
      [
        "Reporter les alertes crue et pluie (MétéoSuisse, OFEV) dans Météo, avec leur degré",
        SIT,
      ],
      [
        "Marquer sur la carte les zones menacées et les objets sensibles (EMS, écoles, campings, parkings souterrains)",
        CARTO,
      ],
      [
        "Coordonner avec le SIS et la police : secteurs, accès, déviations",
        LIAISON,
      ],
      [
        "Ordonner la reconnaissance des ponts, digues et passages inférieurs, avec heure de compte rendu",
        EM,
        30,
      ],
      [
        "Demander et acheminer sacs de sable, motopompes, barrières mobiles",
        LOG,
      ],
      [
        "Faire fermer berges, passerelles et routes inondables (barrages, signalisation)",
        CHEF,
        60,
      ],
      [
        "Préparer l’évacuation préventive des personnes et animaux en zone rouge, avec lieu d’accueil",
        EM,
      ],
      [
        "Informer la population : consignes, zones à éviter (commune, Alertswiss, médias)",
        PRESSE,
      ],
      [
        "Protéger avec les exploitants STEP, stations de pompage et transformateurs",
        LIAISON,
        0,
        false,
      ],
      [
        "Contrôler l’évolution du niveau à chaque rapport ; prévoir la décrue et le pompage des caves",
        SIT,
        120,
        false,
      ],
      ["Planifier la relève des équipes engagées", LOG, 0, false],
    ]),
  },
  {
    key: "blackout",
    name: "Panne d’électricité / black-out",
    event: "Panne d’électricité / black-out",
    description:
      "Tenir le PC sous alimentation de secours, protéger les personnes dépendantes, informer sans réseau.",
    steps: steps([
      [
        "Obtenir du gestionnaire de réseau l’étendue et la durée probable de la panne",
        LIAISON,
        30,
      ],
      [
        "Passer le PC sur alimentation de secours et noter l’autonomie en carburant",
        TELEM,
        60,
      ],
      [
        "Basculer les liaisons sur Polycom (et téléphone satellite) si le réseau mobile tombe",
        RADIO,
      ],
      ["Activer les points de rencontre d’urgence de la commune", CHEF],
      [
        "Recenser les personnes dépendantes d’appareils médicaux et les EMS ; alimentation ou évacuation",
        EM,
      ],
      [
        "Assurer le carburant des groupes électrogènes (hôpital, EMS, STEP, eau potable)",
        LOG,
        120,
      ],
      [
        "Vérifier avec le service des eaux la distribution d’eau potable et les pompages",
        LIAISON,
        0,
        false,
      ],
      [
        "Informer la population par haut-parleurs, affiches et radio à piles",
        PRESSE,
      ],
      [
        "Patrouiller aux points sensibles : ascenseurs bloqués, tunnels, carrefours",
        CHEF,
        0,
        false,
      ],
      [
        "Prévoir des locaux chauffés si la panne se prolonge par temps froid",
        LOG,
        0,
        false,
      ],
      [
        "Préparer avec le gestionnaire le retour du courant par étapes",
        LIAISON,
      ],
    ]),
  },
  {
    key: "canicule",
    name: "Canicule",
    event: "Canicule",
    description:
      "Protéger les personnes vulnérables isolées, ouvrir des lieux frais, adapter le travail des engagés.",
    steps: steps([
      [
        "Suivre l’avertissement canicule MétéoSuisse (degré, températures de nuit)",
        SIT,
      ],
      ["Activer le plan canicule cantonal avec le médecin cantonal", CHEF],
      [
        "Recenser les personnes vulnérables isolées (listes communales, aide et soins à domicile)",
        EM,
      ],
      [
        "Organiser les appels ou visites quotidiennes aux personnes isolées",
        EM,
        240,
      ],
      [
        "Ouvrir des locaux rafraîchis et des points d’eau, diffuser les adresses",
        LOG,
      ],
      [
        "Informer la population : boire, rester au frais, pas d’enfant ni d’animal dans une voiture",
        PRESSE,
      ],
      [
        "Adapter le travail des astreints : heures fraîches, pauses, eau, protection solaire",
        LOG,
        0,
        false,
      ],
      [
        "Coordonner avec le sanitaire (144) les interventions liées à la chaleur",
        LIAISON,
        0,
        false,
      ],
      [
        "Surveiller le danger d’incendie de forêt et les interdictions de feu",
        SIT,
        0,
        false,
      ],
      [
        "Consigner le bilan du jour : visites, interventions, incidents",
        JOURNAL,
      ],
    ]),
  },
  {
    key: "abc",
    name: "Accident chimique / ABC",
    event: "Accident chimique / ABC",
    description:
      "Périmètre, vent, confinement de la population, décontamination, fin d’alerte.",
    steps: steps([
      [
        "Consigner le produit (n° ONU, fiche de sécurité), la quantité et le lieu exact",
        JOURNAL,
      ],
      [
        "Relever la direction et la vitesse du vent ; tracer le secteur sous le vent sur la carte",
        CARTO,
        30,
      ],
      [
        "Faire respecter le périmètre fixé par le chef d’intervention SIS / chimique",
        CHEF,
      ],
      [
        "Consigne à la population : rester à l’intérieur, fermer portes et fenêtres, couper la ventilation",
        PRESSE,
      ],
      [
        "Informer Tox Info (145), le chimiste cantonal et la centrale ABC si nécessaire",
        LIAISON,
      ],
      [
        "Préparer avec le sanitaire une place de décontamination et d’accueil des personnes touchées",
        EM,
      ],
      [
        "Définir les accès et itinéraires de fuite hors du nuage, faire fermer les routes",
        CHEF,
      ],
      [
        "Contrôler la protection et la relève des engagés (appareils respiratoires, contamination)",
        CHEF,
        30,
        false,
      ],
      ["Faire mesurer l’évolution du nuage ou de la pollution", SIT, 30],
      ["Préparer la levée des mesures et la fin d’alerte à la population", EM],
    ]),
  },
  {
    key: "tempete",
    name: "Tempête",
    event: "Tempête",
    description:
      "Fermer ce qui est exposé, dégager les axes prioritaires, recenser les dégâts.",
    steps: steps([
      [
        "Suivre l’avertissement vent MétéoSuisse et les rafales prévues (Météo → seuils)",
        SIT,
      ],
      [
        "Faire fermer parcs, forêts, manifestations en plein air et chantiers exposés",
        CHEF,
      ],
      [
        "Préparer les équipes de dégagement : tronçonneuses, élagage, bâches",
        LOG,
      ],
      [
        "Fixer avec le SIS les priorités : axes principaux, accès aux hôpitaux, lignes électriques",
        LIAISON,
      ],
      [
        "Reporter sur la carte routes coupées, arbres tombés, toitures endommagées",
        CARTO,
        60,
      ],
      [
        "Informer la population : éviter forêts et rives, fixer ou rentrer les objets",
        PRESSE,
      ],
      [
        "Contrôler l’ancrage des tentes et installations de l’engagement",
        LOG,
        0,
        false,
      ],
      ["Bilan des dégâts après le passage et priorités de remise en état", EM],
    ]),
  },
  {
    key: "seisme",
    name: "Séisme",
    event: "Séisme",
    description:
      "Sécurité du PC, liaisons, triage des dégâts, sauvetage, hébergement d’urgence.",
    steps: steps([
      [
        "Consigner heure, magnitude et épicentre (Service sismologique suisse)",
        SIT,
      ],
      [
        "Vérifier le PC (fissures, gaz, électricité) et la sécurité de l’équipe ; déplacer le PC si nécessaire",
        LOG,
      ],
      [
        "Établir les liaisons Polycom avec communes et partenaires ; recenser les annonces de dégâts",
        RADIO,
        30,
      ],
      ["Reconnaître hôpitaux, écoles, EMS, ponts et conduites principales", EM],
      [
        "Trier les dégâts sur la carte : effondré, endommagé, intact",
        CARTO,
        60,
      ],
      [
        "Coordonner recherche et sauvetage (SIS, sauvetage, chiens) aux points de dégâts",
        LIAISON,
      ],
      [
        "Ouvrir des lieux d’accueil et d’hébergement d’urgence pour les sans-abri",
        LOG,
      ],
      [
        "Informer la population : répliques, ne pas entrer dans un bâtiment endommagé",
        PRESSE,
      ],
      ["Demander l’évaluation des bâtiments par des ingénieurs", EM],
      ["Préparer le renfort (canton, armée) si les moyens sont dépassés", CHEF],
    ]),
  },
  {
    key: "recherche",
    name: "Recherche de personne",
    event: "Recherche de personne",
    description:
      "Signalement, secteurs, équipes, suivi des zones fouillées, en appui de la police.",
    steps: steps([
      [
        "Consigner le signalement : nom, âge, description, vêtements, santé, dernier lieu et heure",
        JOURNAL,
      ],
      [
        "Confirmer avec la police qui conduit la recherche et le rôle de la PCi",
        LIAISON,
      ],
      [
        "Définir sur la carte les secteurs de recherche, leur priorité et leur responsable",
        CARTO,
      ],
      [
        "Engager les équipes (effectif, radio, nom d’appel) et fixer l’heure du compte rendu",
        CHEF,
        60,
      ],
      ["Tenir le tableau des secteurs fouillés et à fouiller", SIT, 60, false],
      [
        "Organiser le point de rassemblement, l’enregistrement des bénévoles et la subsistance",
        LOG,
        0,
        false,
      ],
      [
        "Coordonner chiens de recherche, drone et hélicoptère (police, Rega)",
        LIAISON,
        0,
        false,
      ],
      [
        "Transmettre tout indice immédiatement à la police, sans le déplacer",
        CHEF,
      ],
      ["Relève des équipes ; fin de recherche sur décision de la police", EM],
    ]),
  },
  {
    key: "accueil",
    name: "Accueil de personnes évacuées",
    event: "Accueil de personnes évacuées",
    description:
      "Hébergement d’urgence : ouvrir le lieu, enregistrer, loger, nourrir, informer.",
    steps: steps([
      [
        "Connaître le nombre de personnes, leurs besoins (mobilité, médicaments, animaux) et l’heure d’arrivée",
        SIT,
      ],
      [
        "Ouvrir le lieu d’accueil (abri, salle) : clés, électricité, chauffage, sanitaires",
        LOG,
        60,
      ],
      [
        "Mettre en place l’enregistrement : liste nominative, provenance, contact",
        SECR,
      ],
      ["Organiser couchage, couvertures, repas et eau", LOG],
      [
        "Prévoir l’assistance sanitaire et psychologique (sanitaire, care team)",
        EM,
      ],
      [
        "Prendre en charge les animaux de compagnie ou les confier",
        LOG,
        0,
        false,
      ],
      [
        "Informer les personnes accueillies : durée probable, règles, contacts",
        PRESSE,
        0,
        false,
      ],
      [
        "Transmettre les listes à la police et à la commune (renseignement des proches)",
        LIAISON,
      ],
      [
        "Tenir à jour le nombre de personnes hébergées (renseignements clés)",
        SIT,
        120,
        false,
      ],
      [
        "Planifier la relève du personnel d’accueil et le retour des personnes",
        LOG,
      ],
    ]),
  },
];

/**
 * Text of a built-in list in another language (checklist-library-de.ts,
 * checklist-library-it.ts): step n is the text of step n of the French list.
 */
export type LocalizedTemplate = {
  name: string;
  description: string;
  steps: string[];
};

const LOCALIZED: Record<
  Exclude<Lang, "fr">,
  Record<string, LocalizedTemplate>
> = { de: TEMPLATES_DE, it: TEMPLATES_IT };

/** Value of a référentiel in a language: same index as the French one. */
function listValue(
  list: "roles" | "eventKinds",
  value: string,
  lang: Exclude<Lang, "fr">,
): string {
  const i = DEFAULT_LISTS[list].values.indexOf(value);
  return (i >= 0 && LIST_VALUES[lang][list]?.[i]) || value;
}

const built = new Map<Lang, BuiltinTemplate[]>();

/**
 * Built-in lists in a language (the language of the journal, see
 * journalLang in shared/ops.ts). Same keys, step ids, timers and journal
 * flags in every language; the event type and the functions are the
 * référentiel values of that language (shared/i18n/seeds.ts). A text
 * missing in a language stays French.
 */
export function builtinTemplates(lang: Lang = "fr"): BuiltinTemplate[] {
  if (lang === "fr" || !LOCALIZED[lang]) return BUILTIN_TEMPLATES;
  const known = built.get(lang);
  if (known) return known;
  const texts = LOCALIZED[lang];
  const out = BUILTIN_TEMPLATES.map((b): BuiltinTemplate => {
    const l = texts[b.key];
    return {
      key: b.key,
      name: l?.name || b.name,
      event: listValue("eventKinds", b.event, lang),
      description: l?.description || b.description,
      steps: b.steps.map((s, i) => ({
        ...s,
        text: l?.steps[i] || s.text,
        role: listValue("roles", s.role, lang),
      })),
    };
  });
  built.set(lang, out);
  return out;
}
