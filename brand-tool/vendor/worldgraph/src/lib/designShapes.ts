// Pure particle generators for the Design page (no three.js, runs in a worker or tests).
export const SHAPES = ["globe", "sphere", "cube", "ring", "cylinder", "pyramid", "wave", "image", "text"] as const;
export type Shape = (typeof SHAPES)[number];

export type DesignSettings = {
  shape: Shape;
  size: number; // speck size
  separation: number; // min distance between specks (0 = none)
  density: number; // target speck count
  opacity: number;
  jitter: number; // 0..1
  fill: "surface" | "volume";
  spin: boolean;
  text: string;
  image: string | null; // data URL
  invert: boolean;
};

export const DEFAULT_SETTINGS: DesignSettings = {
  shape: "sphere", size: 0.008, separation: 0, density: 60000, opacity: 0.8, jitter: 0,
  fill: "surface", spin: true, text: "AURELIUS", image: null, invert: false,
};

export const DENSITY_MIN = 5000;
export const DENSITY_MAX = 500000;
export const clampDensity = (n: number) => Math.round(Math.min(DENSITY_MAX, Math.max(DENSITY_MIN, n)));

/** Grayscale mask: values 0..1, row-major, w×h. */
export type Mask = { w: number; h: number; data: Float32Array };

export type GenInput = { settings: DesignSettings; mask?: Mask | null };

const rand = Math.random;
function unit(): [number, number, number] {
  const z = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), z, r * Math.sin(a)];
}
const sample = (m: Mask, u: number, v: number) =>
  m.data[Math.min(m.h - 1, Math.floor(v * m.h)) * m.w + Math.min(m.w - 1, Math.floor(u * m.w))] ?? 0;

function candidate(s: DesignSettings, mask: Mask | null | undefined): [number, number, number] | null {
  const vol = s.fill === "volume";
  switch (s.shape) {
    case "sphere": {
      const p = unit(), k = vol ? Math.cbrt(rand()) : 1;
      return [p[0] * k, p[1] * k, p[2] * k];
    }
    case "globe": {
      if (!mask) return null;
      const p = unit();
      const lat = Math.asin(p[1]), lng = Math.atan2(p[2], -p[0]);
      const l = sample(mask, (lng / (Math.PI * 2) + 0.5 + 1) % 1, 0.5 - lat / Math.PI);
      return rand() < 0.03 + l * 0.97 ? p : null;
    }
    case "cube": {
      const a = 0.75, p: [number, number, number] = [(rand() * 2 - 1) * a, (rand() * 2 - 1) * a, (rand() * 2 - 1) * a];
      if (!vol) { const ax = Math.floor(rand() * 3); p[ax] = rand() < 0.5 ? -a : a; }
      return p;
    }
    case "ring": {
      const R = 0.8, r = 0.3 * (vol ? Math.sqrt(rand()) : 1);
      const u = rand() * Math.PI * 2, v = rand() * Math.PI * 2;
      // area weighting on the surface
      if (!vol && rand() > (R + 0.3 * Math.cos(v)) / (R + 0.3)) return null;
      return [(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)];
    }
    case "cylinder": {
      const R = 0.65, H = 0.85, a = rand() * Math.PI * 2;
      if (vol) { const r = R * Math.sqrt(rand()); return [r * Math.cos(a), (rand() * 2 - 1) * H, r * Math.sin(a)]; }
      const side = 2 * Math.PI * R * 2 * H, cap = Math.PI * R * R;
      if (rand() < side / (side + 2 * cap)) return [R * Math.cos(a), (rand() * 2 - 1) * H, R * Math.sin(a)];
      const r = R * Math.sqrt(rand());
      return [r * Math.cos(a), rand() < 0.5 ? -H : H, r * Math.sin(a)];
    }
    case "pyramid": {
      const B = 0.9, Hh = 1.4;
      const t = 1 - Math.sqrt(rand()); // more specks near the wide base
      const k = B * (1 - t), y = -0.6 + t * Hh;
      let x = (rand() * 2 - 1) * k, z = (rand() * 2 - 1) * k;
      if (!vol) { if (rand() < 0.5) x = rand() < 0.5 ? -k : k; else z = rand() < 0.5 ? -k : k; }
      return [x, y, z];
    }
    case "wave": {
      const x = (rand() * 2 - 1) * 1.5, z = (rand() * 2 - 1) * 1.5;
      const y = 0.18 * Math.sin(x * 3) * Math.cos(z * 2.2) + (vol ? (rand() - 0.5) * 0.2 : 0);
      return [x, y, z];
    }
    case "image":
    case "text": {
      if (!mask) return null;
      const u = rand(), v = rand();
      if (rand() > sample(mask, u, v)) return null;
      const aspect = mask.w / mask.h, W = aspect >= 1 ? 1.6 : 1.6 * aspect, Hh = aspect >= 1 ? 1.6 / aspect : 1.6;
      return [(u - 0.5) * 2 * W, (0.5 - v) * 2 * Hh, (rand() - 0.5) * (vol ? 0.3 : 0.06)];
    }
  }
}

function gauss() {
  return (rand() + rand() + rand() - 1.5) / 1.5;
}

/** Returns xyz Float32Array with up to settings.density points. */
export function generate({ settings: s, mask }: GenInput): Float32Array {
  const target = clampDensity(s.density);
  const out = new Float32Array(target * 3);
  const sep = s.separation, sep2 = sep * sep;
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number, z: number) => `${Math.floor(x / sep)},${Math.floor(y / sep)},${Math.floor(z / sep)}`;
  let n = 0;
  const maxTries = target * 40;
  for (let tries = 0; n < target && tries < maxTries; tries++) {
    const p = candidate(s, mask);
    if (!p) continue;
    if (s.jitter > 0) { const j = s.jitter * 0.06; p[0] += gauss() * j; p[1] += gauss() * j; p[2] += gauss() * j; }
    if (sep > 0) {
      const cx = Math.floor(p[0] / sep), cy = Math.floor(p[1] / sep), cz = Math.floor(p[2] / sep);
      let ok = true;
      outer: for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
        const cell = grid.get(`${cx + i},${cy + j},${cz + k}`);
        if (!cell) continue;
        for (const idx of cell) {
          const dx = out[idx]! - p[0], dy = out[idx + 1]! - p[1], dz = out[idx + 2]! - p[2];
          if (dx * dx + dy * dy + dz * dz < sep2) { ok = false; break outer; }
        }
      }
      if (!ok) continue;
      const kk = key(p[0], p[1], p[2]);
      const cell = grid.get(kk);
      if (cell) cell.push(n * 3); else grid.set(kk, [n * 3]);
    }
    out[n * 3] = p[0]; out[n * 3 + 1] = p[1]; out[n * 3 + 2] = p[2];
    n++;
  }
  return out.slice(0, n * 3);
}

export const PRESET_KEY = "aurelius-design-presets";
export type Preset = { id: string; name: string; settings: DesignSettings };
export const STARTER_PRESETS: Preset[] = [
  { id: "starter-earth", name: "Speckled Earth", settings: { ...DEFAULT_SETTINGS, shape: "globe", density: 200000, size: 0.005 } },
  { id: "starter-ring", name: "Halo ring", settings: { ...DEFAULT_SETTINGS, shape: "ring", density: 80000, jitter: 0.4 } },
  { id: "starter-cube", name: "Even cube", settings: { ...DEFAULT_SETTINGS, shape: "cube", density: 20000, separation: 0.03, size: 0.012 } },
  { id: "starter-word", name: "Wordmark", settings: { ...DEFAULT_SETTINGS, shape: "text", density: 60000, spin: false } },
];
