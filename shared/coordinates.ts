// swisstopo, December 2016, approximate navigation formulas (not cadastral surveying).
// https://www.swisstopo.admin.ch/dam/fr/sd-web/KLRCX9XIdXDu/ch1903wgs84-FR.pdf
export function toMN95(lat: number, lng: number) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < 45 ||
    lat > 48 ||
    lng < 5 ||
    lng > 11
  )
    throw new RangeError("Coordonnées hors du périmètre suisse.");
  const p = (lat * 3600 - 169028.66) / 10000;
  const l = (lng * 3600 - 26782.5) / 10000;
  return {
    east:
      2600072.37 +
      211455.93 * l -
      10938.51 * l * p -
      0.36 * l * p * p -
      44.54 * l * l * l,
    north:
      1200147.07 +
      308807.95 * p +
      3745.25 * l * l +
      76.63 * p * p -
      194.56 * l * l * p +
      119.79 * p * p * p,
  };
}
export function fromMN95(east: number, north: number) {
  if (
    !Number.isFinite(east) ||
    !Number.isFinite(north) ||
    east < 2400000 ||
    east > 2900000 ||
    north < 1000000 ||
    north > 1400000
  )
    throw new RangeError("Coordonnées MN95 hors du périmètre suisse.");
  const y = (east - 2600000) / 1000000,
    x = (north - 1200000) / 1000000;
  return {
    lng:
      ((2.6779094 +
        4.728982 * y +
        0.791484 * y * x +
        0.1306 * y * x * x -
        0.0436 * y * y * y) *
        100) /
      36,
    lat:
      ((16.9023892 +
        3.238272 * x -
        0.270978 * y * y -
        0.002528 * x * x -
        0.0447 * y * y * x -
        0.014 * x * x * x) *
        100) /
      36,
  };
}
export function formatMN95(lat: number, lng: number) {
  const { east, north } = toMN95(lat, lng);
  const f = (n: number) => Math.round(n).toLocaleString("fr-CH");
  return `E ${f(east)} · N ${f(north)}`;
}
