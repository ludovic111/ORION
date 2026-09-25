// Colour themes of the interface. Each palette belongs to a mode: the light
// mode keeps the light palette chosen by the post, the dark mode its dark
// palette, and the sun/moon button switches between the two. The tokens
// themselves live in src/palettes.css (`:root[data-palette="…"]`).

export type PaletteId =
  | "papier"
  | "ardoise"
  | "signal"
  | "contraste"
  | "graphite"
  | "minuit"
  | "nuit";

export type Palette = {
  id: PaletteId;
  mode: "light" | "dark";
  label: string;
  /** What it is for, in one line. */
  hint: string;
  /** Page background, card, ink, accent and emphasis (for the swatches). */
  swatch: [string, string, string, string, string];
};

export const PALETTES: Palette[] = [
  {
    id: "papier",
    mode: "light",
    label: "Papier",
    hint: "Crème chaude, encre graphite. Le thème par défaut.",
    swatch: ["#e4dfd9", "#ffffff", "#171717", "#171717", "#ff6a1f"],
  },
  {
    id: "ardoise",
    mode: "light",
    label: "Ardoise",
    hint: "Gris bleuté et encre marine : plus froid, reposant sous néon.",
    swatch: ["#dde2e6", "#ffffff", "#101b26", "#1f3b57", "#d9531e"],
  },
  {
    id: "signal",
    mode: "light",
    label: "Signal PC",
    hint: "Bleu et orange du signe international de la protection civile.",
    swatch: ["#eeece6", "#ffffff", "#0d1b2e", "#0b4a8f", "#f08a00"],
  },
  {
    id: "contraste",
    mode: "light",
    label: "Contraste élevé",
    hint: "Blanc pur, noir pur, traits épais. Plein soleil, vue fatiguée.",
    swatch: ["#ffffff", "#ffffff", "#000000", "#000000", "#c4000c"],
  },
  {
    id: "graphite",
    mode: "dark",
    label: "Graphite",
    hint: "Le papier après la tombée de la nuit.",
    swatch: ["#121110", "#1c1b1a", "#efebe6", "#e4dfd9", "#ff6a1f"],
  },
  {
    id: "minuit",
    mode: "dark",
    label: "Minuit",
    hint: "Bleu nuit profond, encre claire. Salle de conduite sombre.",
    swatch: ["#0d1318", "#151d24", "#e3eaf0", "#cddcea", "#ff8a3d"],
  },
  {
    id: "nuit",
    mode: "dark",
    label: "Nuit tactique",
    hint: "Tout en rouge sur noir : préserve la vision de nuit sur le terrain.",
    swatch: ["#0a0504", "#150a08", "#f0624a", "#d24a33", "#ff3b24"],
  },
];

export const LIGHT_PALETTES = PALETTES.filter((p) => p.mode === "light");
export const DARK_PALETTES = PALETTES.filter((p) => p.mode === "dark");

export const paletteOf = (id: string | undefined): Palette | undefined =>
  PALETTES.find((p) => p.id === id);

export const isLightPalette = (v: unknown): v is PaletteId =>
  typeof v === "string" && paletteOf(v)?.mode === "light";
export const isDarkPalette = (v: unknown): v is PaletteId =>
  typeof v === "string" && paletteOf(v)?.mode === "dark";
