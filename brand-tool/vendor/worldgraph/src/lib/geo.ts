export type LatLng = { lat: number; lng: number };

export const GLOBE_RADIUS = 1;

/** lat/lng (degrees) -> xyz on sphere of radius r */
export function toVec(lat: number, lng: number, r = GLOBE_RADIUS): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

/** xyz -> lat/lng (degrees) */
export function toLatLng(x: number, y: number, z: number): LatLng {
  const r = Math.sqrt(x * x + y * y + z * z);
  const lat = 90 - (Math.acos(y / r) * 180) / Math.PI;
  let lng = (Math.atan2(z, -x) * 180) / Math.PI - 180;
  if (lng < -180) lng += 360;
  return { lat, lng };
}

/** Great-circle distance in km */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR;
  const dLng = (b.lng - a.lng) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
