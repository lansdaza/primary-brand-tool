// Hand-made landmark shapes (metres, x east, y north, z up), turned into specks by the city worker.
// Kept free of React/three so the worker can import it.

/** Tapered box: bottom rect (cx,cy,w,d) at z0 to top rect (tx,ty,tw,td) at z1. lattice = edges + braces only. */
type Prism = { k: "prism"; cx: number; cy: number; w: number; d: number; tx?: number; ty?: number; tw: number; td: number; z0: number; z1: number; lattice?: boolean };
/** Cone / cylinder: radius r0 at z0 to r1 at z1. */
type Cone = { k: "cone"; cx: number; cy: number; r0: number; r1: number; z0: number; z1: number };
/** Dome: half-ellipsoid of radius r and height h starting at z0. */
type Dome = { k: "dome"; cx: number; cy: number; r: number; h: number; z0: number };
export type Part = Prism | Cone | Dome;

export type Landmark = { x: number; y: number; parts: Part[] };

const box = (cx: number, cy: number, w: number, d: number, z0: number, z1: number, taper = 1): Prism =>
  ({ k: "prism", cx, cy, w, d, tw: w * taper, td: d * taper, z0, z1 });

export const LANDMARKS: Record<string, Landmark> = {
  nyc: { x: -67, y: 10, parts: [
    box(0, 0, 130, 60, 0, 25), box(0, 0, 95, 52, 25, 72),
    box(0, 0, 62, 46, 72, 300, 0.92), box(0, 0, 50, 36, 300, 320),
    box(0, 0, 36, 28, 320, 350), box(0, 0, 26, 22, 350, 373, 0.85),
    { k: "cone", cx: 0, cy: 0, r0: 9, r1: 5, z0: 373, z1: 392 },
    { k: "cone", cx: 0, cy: 0, r0: 4, r1: 0.4, z0: 392, z1: 443 },
    // Midtown neighbours
    box(-150, 50, 45, 45, 0, 250), box(-150, 50, 32, 32, 250, 290, 0.8),
    box(150, -40, 55, 40, 0, 190), box(150, -40, 40, 30, 190, 215),
    box(-70, -90, 70, 40, 0, 80), box(80, 90, 60, 50, 0, 120),
  ] },
  london: { x: 3, y: 24, parts: [
    box(0, 0, 12, 12, 0, 55), box(0, 0, 14.5, 14.5, 55, 70), box(0, 0, 12, 12, 70, 78),
    box(0, 0, 11, 11, 78, 92, 0.15), { k: "cone", cx: 0, cy: 0, r0: 0.8, r1: 0.1, z0: 92, z1: 96 },
    // Palace of Westminster river facade running south
    box(-6, -150, 30, 280, 0, 24), box(-6, -150, 22, 280, 24, 30, 0.6),
    ...[-40, -80, -120, -160, -200, -240].map((cy): Part => ({ k: "cone", cx: 9, cy, r0: 2.5, r1: 0.3, z0: 24, z1: 38 })),
    box(-30, -270, 22, 22, 0, 98), box(-30, -270, 22, 22, 98, 104, 0.5),
  ] },
  tokyo: { x: 4, y: 1, parts: [
    { k: "prism", cx: 0, cy: 0, w: 90, d: 90, tw: 34, td: 34, z0: 0, z1: 125, lattice: true },
    box(0, 0, 40, 40, 125, 145),
    { k: "prism", cx: 0, cy: 0, w: 30, d: 30, tw: 12, td: 12, z0: 145, z1: 223, lattice: true },
    box(0, 0, 15, 15, 223, 250),
    { k: "cone", cx: 0, cy: 0, r0: 4, r1: 0.6, z0: 250, z1: 333 },
    box(0, 0, 80, 80, 0, 18), box(-130, 40, 60, 40, 0, 45), box(120, -60, 40, 40, 0, 70),
  ] },
  dc: { x: 23, y: 100, parts: [
    box(0, 0, 70, 105, 0, 30), box(0, 108, 70, 110, 0, 26), box(0, -108, 70, 110, 0, 26),
    box(-40, 0, 20, 60, 0, 26),
    { k: "cone", cx: 0, cy: 0, r0: 33, r1: 33, z0: 30, z1: 42 },
    { k: "cone", cx: 0, cy: 0, r0: 29, r1: 29, z0: 42, z1: 58 },
    { k: "dome", cx: 0, cy: 0, r: 29, h: 22, z0: 58 },
    { k: "cone", cx: 0, cy: 0, r0: 5, r1: 4, z0: 78, z1: 85 },
    { k: "cone", cx: 0, cy: 0, r0: 1.5, r1: 0.3, z0: 85, z1: 88 },
  ] },
  singapore: { x: -15, y: 0, parts: [
    ...[-90, 0, 90].flatMap((oy): Part[] => [
      { k: "prism", cx: 10, cy: oy, w: 22, d: 32, tw: 22, td: 32, z0: 0, z1: 192 },
      { k: "prism", cx: -22, cy: oy, w: 26, d: 32, tx: -4, tw: 14, td: 32, z0: 0, z1: 192 },
    ]),
    { k: "prism", cx: 0, cy: -10, w: 38, d: 340, tw: 38, td: 340, z0: 192, z1: 200 },
    { k: "prism", cx: 0, cy: -195, w: 20, d: 30, tw: 26, td: 30, z0: 194, z1: 200 },
  ] },
};

/** Highest point of a landmark's composition, in metres. */
export function landmarkHeight(lm: Landmark) {
  return Math.max(...lm.parts.map((p) => (p.k === "dome" ? p.z0 + p.h : p.z1)));
}
