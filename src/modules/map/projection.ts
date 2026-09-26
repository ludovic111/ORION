// Web Mercator maths shared by the offscreen renderer, the print to scale
// and the offline sectors. Pure: no DOM, runs in node for the tests. Loops
// only, never Math.min(...list): a path of 100 000 vertices would overflow
// the call stack (Safari) with a spread.

export type LatLng = [number, number];
export const TILE = 256;
/** Metres per pixel at zoom 0 on the equator (256 px tiles). */
export const EQUATOR_RESOLUTION = 156543.03392804097;

/** Position at zoom 0, in pixels of a 256 px world. */
export function project([lat, lng]: LatLng): [number, number] {
  const s = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180);
  return [
    ((lng + 180) / 360) * TILE,
    (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE,
  ];
}
export function unproject([x, y]: [number, number]): LatLng {
  const lng = (x / TILE) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / TILE;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return [lat, lng];
}

export type Box = { minX: number; minY: number; maxX: number; maxY: number };

/** Bounds of any number of points projected at zoom 0 (loops only). */
export function projectedBounds(
  lists: Iterable<readonly LatLng[]>,
): Box | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const list of lists)
    for (let i = 0; i < list.length; i++) {
      const [x, y] = project(list[i] as LatLng);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  return minX === Infinity ? null : { minX, minY, maxX, maxY };
}

/** Latitude / longitude bounds of lists of points (loops only). */
export function latLngBounds(
  lists: Iterable<readonly LatLng[]>,
): [LatLng, LatLng] | null {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  for (const list of lists)
    for (let i = 0; i < list.length; i++) {
      const [lat, lng] = list[i];
      if (lat < south) south = lat;
      if (lat > north) north = lat;
      if (lng < west) west = lng;
      if (lng > east) east = lng;
    }
  return south === Infinity
    ? null
    : [
        [south, west],
        [north, east],
      ];
}

/** Metres per CSS pixel at a latitude and a (fractional) zoom. */
export const resolutionAt = (lat: number, zoom: number) =>
  (EQUATOR_RESOLUTION * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

/** Zoom giving `metresPerPixel` at a latitude. */
export const zoomFor = (lat: number, metresPerPixel: number) =>
  Math.log2(
    (EQUATOR_RESOLUTION * Math.cos((lat * Math.PI) / 180)) / metresPerPixel,
  );
