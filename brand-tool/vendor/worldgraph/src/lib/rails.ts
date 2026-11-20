import type { LatLng } from "./geo";

export const FLOW_TYPES = ["Intelligence", "Economic", "Climate", "Logistics", "Health"] as const;
export type FlowType = (typeof FLOW_TYPES)[number];

export type RailNode = LatLng & { name: string; place: string };
export type Rail = { id: string; name: string; type: FlowType; a: RailNode; b: RailNode };

export const STORAGE_KEY = "aurelius-rails-v2";

const n = (name: string, place: string, lat: number, lng: number): RailNode => ({ name, place, lat, lng });

export function seedRails(): Rail[] {
  const dc = n("NODE A1", "Washington, D.C.", 38.9, -77.04);
  const sf = n("NODE A2", "San Francisco", 37.77, -122.42);
  return [
    { id: "s1", name: "Atlantic Policy Rail", type: "Intelligence", a: dc, b: n("NODE B1", "London", 51.5, -0.12) },
    { id: "s2", name: "Pacific Trade Rail", type: "Economic", a: sf, b: n("NODE C1", "Tokyo", 35.68, 139.69) },
    { id: "s3", name: "Continental Ops", type: "Logistics", a: sf, b: dc },
    { id: "s4", name: "Indo-Pacific Climate", type: "Climate", a: n("NODE D1", "Canberra", -35.28, 149.13), b: n("NODE C2", "Singapore", 1.35, 103.82) },
    { id: "s5", name: "EU–ASEAN Rail", type: "Economic", a: n("NODE B2", "Brussels", 50.85, 4.35), b: n("NODE C2", "Singapore", 1.35, 103.82) },
    { id: "s6", name: "Hemispheric Health", type: "Health", a: dc, b: n("NODE E1", "Brasília", -15.79, -47.88) },
    { id: "s8", name: "Atlantic Finance Rail", type: "Economic", a: n("NODE A4", "New York", 40.75, -73.98), b: n("NODE B1", "London", 51.5, -0.12) },
    { id: "s7", name: "Northern Corridor", type: "Intelligence", a: n("NODE A3", "Ottawa", 45.42, -75.69), b: n("NODE B3", "Oslo", 59.91, 10.75) },
  ];
}

export function nextNodeName(rails: Rail[]): string {
  const names = new Set(rails.flatMap((r) => [r.a.name, r.b.name]));
  let i = 1;
  while (names.has(`NODE X${i}`)) i++;
  return `NODE X${i}`;
}

export function createRail(rails: Rail[], from: LatLng & { place: string }, to: LatLng & { place: string }, id: string): Rail {
  const a: RailNode = { ...from, name: nextNodeName(rails) };
  const b: RailNode = { ...to, name: nextNodeName([...rails, { a, b: a } as Rail]) };
  return { id, name: `${a.place} – ${b.place}`, type: "Intelligence", a, b };
}
