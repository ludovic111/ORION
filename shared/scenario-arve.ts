import { SCENARIO_FORMAT, type ScenarioFile } from "./exercise.ts";
import type { Lang } from "./i18n/core.ts";
import { t as inPost, tIn } from "./i18n/scenario.ts";

// Example scenario "Crue de l’Arve" (fictitious), shipped with the
// application: the injects of the demonstration exercise. The first five
// happened during the first two hours and a half of the demonstration; the
// others arrive while the visitor watches (src/exercise/demo.ts shifts them
// to "now"). Every name, number and place detail is fictitious.
// Its texts are written in the language of the post when it is generated
// (or in `lang`); the fixed values (via, priority, status) stay French.

/** Injects before this offset are the past of the demonstration. */
export const ARVE_PAST = 150;

/** The scenario in `lang`, by default in the language of the post. */
export function arveScenario(lang?: Lang): ScenarioFile {
  const t = (key: Parameters<typeof inPost>[0]) =>
    lang ? tIn(lang, key) : inPost(key);
  return {
    format: SCENARIO_FORMAT,
    version: 1,
    title: t("Crue de l’Arve"),
    description: t(
      "Exercice de conduite fictif : crue de l’Arve à Carouge (GE). Montée des eaux, fermeture des berges, sacs de sable, évacuation d’un quartier, hébergement et information de la population. Durée prévue : 4 heures.",
    ),
    injects: [
      {
        title: t("Niveau de l’Arve en hausse"),
        timing: "offset",
        offset: 8,
        clock: "",
        day: 0,
        from: t("Patrouille Alpha"),
        to: t("PC arrière"),
        via: "Radio",
        priority: "Important",
        category: t("Renseignement"),
        body: t(
          "Niveau en hausse rapide au pont des Acacias, environ 20 cm en 30 minutes.",
        ),
        delivery: "message",
        expected: t(
          "Consigner au journal, demander une reconnaissance, informer le chef d’intervention.",
        ),
        deadline: 10,
        effects: [],
      },
      {
        title: t("Appel d’un riverain inquiet"),
        timing: "offset",
        offset: 30,
        clock: "",
        day: 0,
        from: t("Riverain (joué par la direction)"),
        to: t("Téléphoniste"),
        via: "Téléphone",
        priority: "Normal",
        category: t("Information"),
        body: t(
          "« L’eau monte dans mon jardin au chemin de la Fontenette, est-ce qu’on doit partir ? » Répondre calmement, noter l’adresse.",
        ),
        delivery: "read",
        expected: t(
          "Noter l’adresse, consigner au journal, transmettre à la cellule situation.",
        ),
        deadline: 15,
        effects: [],
      },
      {
        title: t("Eau sur la chaussée"),
        timing: "offset",
        offset: 62,
        clock: "",
        day: 0,
        from: t("Équipe Bravo"),
        to: t("PC front"),
        via: "Radio",
        priority: "Urgent",
        category: t("Alerte"),
        body: t(
          "Eau sur la chaussée route de Veyrier à la hauteur de la Fontenette. Circulation dangereuse.",
        ),
        delivery: "message",
        expected: t(
          "Demander la fermeture de la route à la police, placer l’obstacle sur la carte.",
        ),
        deadline: 15,
        effects: [],
      },
      {
        title: t("Sacs de sable en route"),
        timing: "offset",
        offset: 70,
        clock: "",
        day: 0,
        from: t("Logistique"),
        to: t("PC arrière"),
        via: "Téléphone",
        priority: "Normal",
        category: t("Compte rendu"),
        body: t(
          "Deux camions partis de l’arsenal avec 200 sacs. Arrivée estimée dans 45 minutes.",
        ),
        delivery: "message",
        expected: t("Mettre à jour l’état des moyens."),
        deadline: 0,
        effects: [],
      },
      {
        title: t("Fermeture du pont"),
        timing: "offset",
        offset: 74,
        clock: "",
        day: 0,
        from: t("Police"),
        to: t("Chef d’intervention"),
        via: "Téléphone",
        priority: "Normal",
        category: t("Information"),
        body: t(
          "La police ferme le pont de Carouge à la circulation dès 09:30.",
        ),
        delivery: "message",
        expected: t("Informer les sections engagées de la déviation."),
        deadline: 0,
        effects: [],
      },
      {
        title: t("Seuil d’alerte 2 atteint"),
        timing: "offset",
        offset: 156,
        clock: "",
        day: 0,
        from: t("Centrale d’engagement"),
        to: t("Cellule situation"),
        via: "Message",
        priority: "Important",
        category: t("Renseignement"),
        body: t(
          "La station hydrométrique (fictive) des Acacias indique + 60 cm depuis le début de l’événement, montée de 12 cm par heure. Seuil d’alerte 2 atteint.",
        ),
        delivery: "message",
        expected: t(
          "Mettre à jour le renseignement clé, consigner, informer le chef d’intervention.",
        ),
        deadline: 10,
        effects: [
          {
            kind: "fact",
            label: t("Niveau de l’Arve (Acacias)"),
            value: "+ 60",
            unit: "cm",
          },
        ],
      },
      {
        title: t("Camions arrivés au point de rassemblement"),
        timing: "offset",
        offset: 159,
        clock: "",
        day: 0,
        from: t("Logistique"),
        to: t("PC arrière"),
        via: "Radio",
        priority: "Normal",
        category: t("Compte rendu"),
        body: t(
          "Les deux camions sont au point de rassemblement Acacias. Déchargement des sacs en cours.",
        ),
        delivery: "message",
        expected: t("Mettre à jour l’état des moyens, quittancer."),
        deadline: 0,
        effects: [
          {
            kind: "resource",
            name: t("Camions de transport PCi"),
            status: "Engagé",
            location: t("Point de rassemblement Acacias"),
          },
          {
            kind: "resource",
            name: t("Sacs de sable"),
            status: "Engagé",
            location: t("Point de rassemblement Acacias"),
          },
        ],
      },
      {
        title: t("Fortes pluies annoncées"),
        timing: "offset",
        offset: 163,
        clock: "",
        day: 0,
        from: t("Centrale d’engagement"),
        to: t("Cellule situation"),
        via: "Message",
        priority: "Important",
        category: t("Alerte"),
        body: t(
          "Pluie forte sur le bassin de l’Arve pour les trois prochaines heures, 10 à 15 mm par heure, rafales à 50 km/h.",
        ),
        delivery: "message",
        expected: t(
          "Consigner, mettre à jour la météo, apprécier l’évolution.",
        ),
        deadline: 15,
        effects: [
          {
            kind: "observation",
            place: "Carouge (GE)",
            conditions: t("Pluie forte, rafales"),
            temperature: "11 °C",
            wind: t("SO 35 km/h, rafales 50 km/h"),
            precipitation: "12 mm/h",
          },
        ],
      },
      {
        title: t("Personne bloquée dans un véhicule"),
        timing: "offset",
        offset: 167,
        clock: "",
        day: 0,
        from: t("Police"),
        to: t("Chef d’intervention"),
        via: "Téléphone",
        priority: "Urgent",
        category: t("Alerte"),
        body: t(
          "Une conductrice est bloquée dans sa voiture, eau à mi-portière, route de Veyrier 120. Les pompiers sont demandés.",
        ),
        delivery: "message",
        expected: t(
          "Transmettre immédiatement au SIS, engager la réserve pour sécuriser, consigner la mission.",
        ),
        deadline: 5,
        effects: [],
      },
      {
        title: t("Réserve en route"),
        timing: "offset",
        offset: 171,
        clock: "",
        day: 0,
        from: t("Section appui"),
        to: t("PC front"),
        via: "Radio",
        priority: "Normal",
        category: t("Compte rendu"),
        body: t(
          "La section appui (réserve) quitte le PC Carouge, 12 personnes, arrivée dans 15 minutes.",
        ),
        delivery: "message",
        expected: t("Mettre à jour l’état des moyens."),
        deadline: 0,
        effects: [
          {
            kind: "resource",
            name: t("Section appui (réserve)"),
            status: "En route",
            location: t("PC Carouge → Route de Veyrier"),
          },
        ],
      },
      {
        title: t("Demande d’hébergement"),
        timing: "offset",
        offset: 176,
        clock: "",
        day: 0,
        from: t("Commune"),
        to: t("Chef AIC"),
        via: "Téléphone",
        priority: "Important",
        category: t("Demande"),
        body: t(
          "La commune demande 30 places d’hébergement pour la nuit pour les habitants évacués du quartier de la Fontenette.",
        ),
        delivery: "message",
        expected: t(
          "Consigner la demande, créer la mission hébergement, désigner un responsable et une échéance.",
        ),
        deadline: 20,
        effects: [],
      },
      {
        title: t("Caves inondées"),
        timing: "offset",
        offset: 181,
        clock: "",
        day: 0,
        from: t("Riverain"),
        to: t("Téléphoniste"),
        via: "Téléphone",
        priority: "Normal",
        category: t("Renseignement"),
        body: t(
          "Trois caves inondées rue Jacques-Dalphin, pas de blessé, demande de motopompe.",
        ),
        delivery: "message",
        expected: t("Consigner, décider de l’engagement d’une motopompe."),
        deadline: 30,
        effects: [],
      },
      {
        title: t("Personnes évacuées"),
        timing: "offset",
        offset: 187,
        clock: "",
        day: 0,
        from: t("PC front"),
        to: t("Cellule situation"),
        via: "Radio",
        priority: "Normal",
        category: t("Compte rendu"),
        body: t(
          "Six autres personnes évacuées du quartier de la Fontenette (18 en tout), regroupées à l’école des Pervenches.",
        ),
        delivery: "message",
        expected: t(
          "Mettre à jour le renseignement clé « Personnes évacuées ».",
        ),
        deadline: 10,
        effects: [
          {
            kind: "fact",
            label: t("Personnes évacuées"),
            value: "18",
            unit: t("pers."),
          },
        ],
      },
      {
        title: t("Point presse demandé"),
        timing: "offset",
        offset: 193,
        clock: "",
        day: 0,
        from: t("Journaliste (joué par la direction)"),
        to: t("Chef d’intervention"),
        via: "Téléphone",
        priority: "Normal",
        category: t("Demande"),
        body: t(
          "Un journaliste de la presse locale (fictive) demande une déclaration sur l’évacuation. Répondre selon la ligne de communication.",
        ),
        delivery: "read",
        expected: t(
          "Renvoyer vers la cellule communication, consigner la demande, fixer un point presse à l’agenda.",
        ),
        deadline: 30,
        effects: [],
      },
      {
        title: t("Niveau stabilisé"),
        timing: "offset",
        offset: 200,
        clock: "",
        day: 0,
        from: t("Patrouille Alpha"),
        to: t("PC arrière"),
        via: "Radio",
        priority: "Normal",
        category: t("Renseignement"),
        body: t(
          "Niveau stable depuis 20 minutes au pont des Acacias, + 65 cm.",
        ),
        delivery: "message",
        expected: t("Consigner, mettre à jour le renseignement clé."),
        deadline: 15,
        effects: [
          {
            kind: "fact",
            label: t("Niveau de l’Arve (Acacias)"),
            value: "+ 65",
            unit: "cm",
          },
        ],
      },
      {
        title: t("Pluie faiblissante"),
        timing: "offset",
        offset: 208,
        clock: "",
        day: 0,
        from: t("Centrale d’engagement"),
        to: t("Cellule situation"),
        via: "Message",
        priority: "Normal",
        category: t("Information"),
        body: t(
          "Les précipitations faiblissent, 2 mm par heure. Fin de l’alerte de fortes pluies attendue à 16 h.",
        ),
        delivery: "message",
        expected: t("Mettre à jour la météo."),
        deadline: 0,
        effects: [
          {
            kind: "observation",
            place: "Carouge (GE)",
            conditions: t("Pluie faible"),
            temperature: "12 °C",
            wind: t("SO 15 km/h"),
            precipitation: "2 mm/h",
          },
        ],
      },
      {
        title: t("Équipe Bravo de retour"),
        timing: "offset",
        offset: 216,
        clock: "",
        day: 0,
        from: t("Équipe Bravo"),
        to: t("PC front"),
        via: "Radio",
        priority: "Normal",
        category: t("Compte rendu"),
        body: t(
          "Accès aux berges sécurisés, relevés par la section appui. Équipe Bravo de retour au PC pour la relève.",
        ),
        delivery: "message",
        expected: t("Mettre à jour l’état des moyens, organiser la relève."),
        deadline: 0,
        effects: [
          {
            kind: "resource",
            name: t("Équipe Bravo"),
            status: "De retour",
            location: t("PC Carouge"),
          },
        ],
      },
    ],
  };
}

/**
 * The scenario in the language of the post at the moment it is read (the
 * texts are getters: never frozen in the language of the start-up).
 */
export const ARVE_SCENARIO: ScenarioFile = {
  format: SCENARIO_FORMAT,
  version: 1,
  get title() {
    return arveScenario().title;
  },
  get description() {
    return arveScenario().description;
  },
  get injects() {
    return arveScenario().injects;
  },
};
