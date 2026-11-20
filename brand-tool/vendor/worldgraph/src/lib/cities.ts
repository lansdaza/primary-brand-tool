import { distanceKm, type LatLng } from "./geo";

/**
 * Postcard camera framing around the landmark, in local metres.
 * target: [east, up, north]; from: compass bearing (deg) the camera looks from; dist/elev in metres.
 */
export type CityView = { target: [number, number, number]; from: number; dist: number; elev: number };

export type City = { id: string; name: string; landmark: string; lat: number; lng: number; view: CityView };

export const CITIES: City[] = [
  { id: "nyc", name: "New York", landmark: "Empire State Building", lat: 40.7484, lng: -73.9857,
    view: { target: [-67, 170, 10], from: 200, dist: 620, elev: 60 } },
  { id: "london", name: "London", landmark: "Big Ben & Parliament", lat: 51.5005, lng: -0.1246,
    view: { target: [-10, 40, 0], from: 90, dist: 270, elev: 35 } },
  { id: "tokyo", name: "Tokyo", landmark: "Tokyo Tower", lat: 35.6586, lng: 139.7454,
    view: { target: [4, 130, 1], from: 150, dist: 500, elev: 40 } },
  { id: "dc", name: "Washington, D.C.", landmark: "U.S. Capitol", lat: 38.8899, lng: -77.0091,
    view: { target: [23, 30, 100], from: 270, dist: 400, elev: 45 } },
  { id: "singapore", name: "Singapore", landmark: "Marina Bay Sands", lat: 1.2834, lng: 103.8607,
    view: { target: [-15, 80, 0], from: 320, dist: 600, elev: 25 } },
];

/** A node opens a city view when it sits within this many km of the city centre. */
export const CITY_MATCH_KM = 30;

export function cityNear(p: LatLng): City | undefined {
  return CITIES.find((c) => distanceKm(p, c) <= CITY_MATCH_KM);
}

/** Camera position (three.js coords: x east, y up, z south) for a city's postcard view. */
export function viewPosition(v: CityView): [number, number, number] {
  const a = (v.from * Math.PI) / 180;
  return [v.target[0] + Math.sin(a) * v.dist, v.elev, -(v.target[2] + Math.cos(a) * v.dist)];
}
