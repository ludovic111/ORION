// Backgrounds of the situation map, shared by the live map (Leaflet) and the
// offscreen renderer (images for exports and slides). Labels are getters:
// read in the language of the post when shown.

import { t } from "./i18n-2.ts";

export const WMTS = (layer: string) =>
  `https://wmts.geo.admin.ch/1.0.0/${layer}/default/current/3857/{z}/{x}/{y}.jpeg`;

export const BASES = {
  color: {
    get label() {
      return t("Carte couleur");
    },
    hint: "swisstopo",
    url: WMTS("ch.swisstopo.pixelkarte-farbe"),
    native: 19,
    swiss: true,
    className: "",
  },
  gray: {
    get label() {
      return t("Carte grise");
    },
    hint: "swisstopo",
    url: WMTS("ch.swisstopo.pixelkarte-grau"),
    native: 19,
    swiss: true,
    className: "",
  },
  aerial: {
    get label() {
      return t("Vue aérienne");
    },
    hint: "SWISSIMAGE",
    url: WMTS("ch.swisstopo.swissimage"),
    native: 20,
    swiss: true,
    className: "",
  },
  night: {
    get label() {
      return t("Nuit");
    },
    get hint() {
      return t("carte grise inversée");
    },
    url: WMTS("ch.swisstopo.pixelkarte-grau"),
    native: 19,
    swiss: true,
    className: "map-night",
  },
  osm: {
    label: "OpenStreetMap",
    get hint() {
      return t("hors de Suisse");
    },
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    native: 19,
    swiss: false,
    className: "",
  },
} as const;
export type BaseId = keyof typeof BASES;
export const isBase = (v: unknown): v is BaseId =>
  typeof v === "string" && v in BASES;

/** Area covered by the swisstopo tiles: [[south, west], [north, east]]. */
export const SWISS_BOUNDS: [[number, number], [number, number]] = [
  [45.3, 5.0],
  [48.4, 11.6],
];
export const GENEVA = { lat: 46.2044, lng: 6.1432, zoom: 13 };
