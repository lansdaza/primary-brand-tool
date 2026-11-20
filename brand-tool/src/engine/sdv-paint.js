// Small Door Vet's painterly system as a drawing engine (guideline 4.1 Editorial mask, 4.2 Painterly illustration).
// Two parts share one hand: dry-brush strokes (enlarged pet objects as abstract backgrounds) and painted shapes
// that extend, frame or partly cover a photograph (the bandana, the ears, the arch). Everything is seeded, so the
// same settings always paint the same picture, and a new seed paints another take in the same hand.

/* ---------- Noise ---------- */
function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = (t) => t * t * (3 - 2 * t);
function noise1(x, k = 0) { const i = Math.floor(x), f = x - i; return hash(i + k * 57.31) * (1 - smooth(f)) + hash(i + 1 + k * 57.31) * smooth(f); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function mixHex(a, b, t) { const A = hex(a), B = hex(b); return `#${A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('')}`; }
const rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };

/* ---------- Paths ---------- */
// Catmull-Rom through control points, sampled evenly by length.
function spline(ctrl, closed = false, step = 2) {
  const P = closed ? [ctrl[ctrl.length - 1], ...ctrl, ctrl[0], ctrl[1]] : [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  const raw = [];
  for (let i = 1; i < P.length - 2; i++) for (let s = 0; s < 24; s++) {
    const t = s / 24, [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]], t2 = t * t, t3 = t2 * t;
    raw.push({ x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3), y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) });
  }
  raw.push(closed ? raw[0] : P[P.length - 2]);
  const out = [raw[0]]; let acc = 0;
  for (let i = 1; i < raw.length; i++) { const d = Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y); acc += d; if (acc >= step) { out.push(raw[i]); acc = 0; } }
  return out;
}
function normals(pts) { return pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1; return { x: -dy / l, y: dx / l }; }); }

/* ---------- The dry brush ---------- */
// A stroke is many bristles following one path. Pressure tapers the ends; dryness breaks bristles into streaks,
// more toward the end of the stroke and at its edges, where the brush runs out of paint first.
export function brushStroke(c, pts, o) {
  // upto (0 to 1) paints the stroke only as far as the brush has travelled, for painting it on over time. The paint
  // laid so far is exactly the finished stroke's, so the last frame is the still.
  const { width, ink, ground, dry = 0.4, seed = 1, body = 0.5, wobble = 0.5, upto = 1 } = o;
  if (pts.length < 2 || upto <= 0) return;
  const N = normals(pts), r = rng(seed), n = Math.round(clamp(width / 1.3, 28, 260)), len = pts.length;
  const pressure = (t, k) => smooth(clamp(t / 0.06, 0, 1)) * (1 - 0.55 * smooth(clamp((t - 0.82) / 0.18, 0, 1))) * (0.88 + 0.24 * noise1(t * 6, k));
  // Distance along the stroke, so breaks have the same rhythm whatever the sampling.
  const dist = [0]; for (let i = 1; i < len; i++) dist.push(dist[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = dist[len - 1] || 1, done = upto >= 1, head = upto * total;
  // While it is moving, the brush's front is rounded: the middle bristles lead and the outer ones trail, each a little
  // ragged, as a loaded brush's tip is.
  const R = width * 0.42;
  const cap = (d) => (done || d <= head - R ? 1 : d >= head ? 0 : Math.sqrt(Math.max(0, 1 - ((d - (head - R)) / R) ** 2)));
  const reach = (b, off) => (done ? Infinity : head - R * (1 - Math.sqrt(Math.max(0, 1 - off * off))) + width * 0.07 * (noise1(b * 0.37, seed) - 0.5));
  // Body: the paint laid down under the bristles, a little transparent so overlaps read.
  c.save();
  c.fillStyle = rgba(ink, body);
  c.beginPath();
  let last = len - 1; if (!done) { last = 0; while (last < len - 1 && dist[last + 1] <= head) last++; }
  if (last >= 1) {
    for (let i = 0; i <= last; i++) { const t = dist[i] / total, w = width / 2 * pressure(t, seed) * 0.92 * cap(dist[i]); c.lineTo(pts[i].x + N[i].x * w, pts[i].y + N[i].y * w); }
    for (let i = last; i >= 0; i--) { const t = dist[i] / total, w = width / 2 * pressure(t, seed) * 0.92 * cap(dist[i]); c.lineTo(pts[i].x - N[i].x * w, pts[i].y - N[i].y * w); }
    c.fill();
  }
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let b = 0; b < n; b++) {
    const off = (b / (n - 1)) * 2 - 1 + (r() - 0.5) * (2 / n), edge = Math.abs(off), k = seed * 13 + b * 7.17;
    const bw = (width / n) * (2.6 + r() * 2.2), a = (0.28 + r() * 0.4) * (1 - 0.3 * edge * edge);
    const light = r() < 0.16; // a few bristles drag the ground colour back through the paint
    const alpha = light ? 0.18 + r() * 0.22 : a;
    c.strokeStyle = light ? rgba(ground, alpha) : rgba(ink, a);
    c.lineWidth = light ? bw * 0.35 : bw;
    const scale = width * (0.5 + r() * 1.6), wob = (r() - 0.5) * width * 0.06 * wobble, edgeDry = 0.25 + 1.4 * Math.pow(edge, 1.6);
    const end = reach(b, off);
    let down = false;
    c.beginPath();
    for (let i = 0; i < len; i++) {
      if (dist[i] > end) break;
      const t = dist[i] / total, p = pressure(t, seed);
      const ink_ = 0.65 * noise1(dist[i] / scale, k) + 0.35 * noise1(dist[i] / (scale * 0.25), k + 5);
      const gap = ink_ < dry * (0.3 + 0.7 * t) * edgeDry || p < 0.04;
      const d = off * width / 2 * p + wob * noise1(t * 3, k + 2), x = pts[i].x + N[i].x * d, y = pts[i].y + N[i].y * d;
      if (gap) { down = false; continue; }
      if (!down) { c.moveTo(x, y); down = true; } else c.lineTo(x, y);
    }
    c.stroke();
  }
  // Light dabs: places where the brush skipped and the ground shows, as in the guideline's grey leash.
  const dabs = Math.round(total / width * 0.45 * dry);
  for (let d = 0; d < dabs; d++) {
    const at = r() * total; let i = 0; while (i < len - 1 && dist[i] < at) i++;
    const t = at / total, p = pressure(t, seed), off = (r() - 0.5) * 1.2 * p, ang = Math.atan2(N[i].x, -N[i].y);
    const alpha = 0.08 + r() * 0.16, rx = width * (0.08 + r() * 0.18), ry = width * (0.025 + r() * 0.05), turn = (r() - 0.5) * 0.3;
    if (!done && at > head - width * 0.3) continue;
    c.fillStyle = rgba(ground, alpha);
    c.beginPath(); c.ellipse(pts[i].x + N[i].x * off * width / 2, pts[i].y + N[i].y * off * width / 2, rx, ry, ang + turn, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

/* ---------- Compositions: pet objects, enlarged and cropped (4.2) ---------- */
// Control points in a 1000-unit square. Each seed nudges them, so a composition is a family, not one picture.
const COMPS = {
  leash: { name: 'Leash', about: 'A leash looped on itself, as in the guideline’s illustration', strokes: (j) => [
    { closed: false, w: 1, pts: [[430, 300], [520, 210], [650, 165], [780, 190], [850, 290], [840, 420], [760, 520], [640, 560], [520, 520], [450, 430], [440, 330], [500, 250], [610, 205], [720, 215], [800, 280], [820, 380], [780, 470], [690, 560], [590, 660], [480, 760], [380, 850]].map(([x, y]) => [x + j() * 0.6, y + j() * 0.6]) },
    { closed: false, w: 0.85, pts: [[470, 270], [380, 330], [270, 440], [190, 560], [160, 660], [210, 700], [290, 640], [370, 520], [430, 410], [470, 320]].map(([x, y]) => [x + j() * 0.6, y + j() * 0.6]) }] },
  rope: { name: 'Crossing strokes', about: 'Long strokes crossing and curving off the edge, as in the orange panel', strokes: (j) => [
    { closed: false, w: 1.5, pts: [[-60, 640], [180, 520], [420, 360], [640, 230], [900, 120], [1100, 60]].map(([x, y]) => [x + j(), y + j()]) },
    { closed: false, w: 1.3, pts: [[520, -60], [470, 200], [430, 470], [400, 760], [380, 1080]].map(([x, y]) => [x + j(), y + j()]) },
    { closed: false, w: 1.6, pts: [[560, 140], [760, 120], [960, 230], [1060, 430], [980, 640], [760, 700], [560, 600]].map(([x, y]) => [x + j(), y + j()]) }] },
  sweep: { name: 'Sweep', about: 'One wide, oval sweep, like the stroke behind the event posters', strokes: (j) => [
    { closed: false, w: 1.6, pts: [[60, 760], [180, 560], [420, 430], [720, 420], [920, 520], [900, 690], [640, 790], [330, 780], [160, 700]].map(([x, y]) => [x + j(), y + j()]) }] },
  bowl: { name: 'Bowl', about: 'The rim of a food bowl, cropped close', strokes: (j) => [
    { closed: true, w: 1, pts: [[500, 260], [800, 330], [900, 480], [800, 630], [500, 700], [200, 630], [100, 480], [200, 330]].map(([x, y]) => [x + j(), y + j()]) },
    { closed: false, w: 0.8, pts: [[160, 560], [260, 760], [500, 830], [740, 760], [840, 560]].map(([x, y]) => [x + j(), y + j()]) }] },
};
export const PAINT_COMPS = Object.entries(COMPS).map(([id, c]) => ({ id, name: c.name, about: c.about }));

// Paint a composition into a W×H frame. zoom enlarges and crops it; panX/panY move the crop.
// progress (0 to 1) paints it on over time: strokes go down one after another, each at a brush's pace (picking up
// speed, then easing off), with a short lift between them. Each stroke's share of the time follows its length.
export const PAINT_LIFT = 0.07; // the pause between strokes, as a share of the whole
const pace = (u) => 0.55 * smooth(u) + 0.45 * u;
export function paintBrush(c, W, H, s) {
  const { comp = 'leash', ground, ink, width = 9, dry = 40, seed = 1, zoom = 1, panX = 0, panY = 0, body = 45, texture, progress = 1 } = s;
  c.save();
  if (!s.clear) { c.fillStyle = ground; c.fillRect(0, 0, W, H); }
  const def = COMPS[comp] ?? COMPS.leash, r = rng(seed * 7 + 3), j = () => (r() - 0.5) * 70;
  const scale = Math.max(W, H) / 1000 * zoom, ox = W / 2 - 500 * scale + panX * W * 0.5, oy = H / 2 - 500 * scale + panY * H * 0.5;
  const strokes = def.strokes(j).map((st, i) => {
    let pts = spline(st.pts.map(([x, y]) => ({ x: ox + x * scale, y: oy + y * scale })), st.closed, Math.max(1.2, width * Math.min(W, H) / 100 / 10));
    if (st.closed) pts = pts.concat(pts.slice(1, Math.round(pts.length * 0.14))); // a loop overlaps itself, as a brush would, so its tapered ends do not leave a gap
    // Time goes only to the parts of a stroke inside the frame: off-screen stretches pass in no time, so a cropped
    // composition never paints where nobody can see it.
    const w = width / 100 * Math.min(W, H) * st.w * zoom, dist = [0], vis = [0];
    const inside = (p) => p.x > -w / 2 && p.x < W + w / 2 && p.y > -w / 2 && p.y < H + w / 2;
    for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y); dist.push(dist[k - 1] + d); vis.push(vis[k - 1] + (inside(pts[k]) || inside(pts[k - 1]) ? d : 0)); }
    const total = dist[dist.length - 1] || 1, L = vis[vis.length - 1];
    // Where the brush is once it has painted v of the visible length.
    const at = (v) => { let k = 1; while (k < vis.length - 1 && vis[k] < v) k++; const seg = vis[k] - vis[k - 1]; return seg > 0 ? dist[k - 1] + (dist[k] - dist[k - 1]) * clamp((v - vis[k - 1]) / seg, 0, 1) : dist[k]; };
    return { st, i, pts, w, total, L, at };
  });
  const shown = strokes.filter((x) => x.L > 0), lifts = PAINT_LIFT * Math.max(0, shown.length - 1), sum = shown.reduce((n, x) => n + x.L, 0) || 1;
  let t0 = 0;
  for (const x of strokes) {
    let upto = 1;
    if (progress < 1) {
      if (!x.L) continue;
      const span = (1 - lifts) * x.L / sum, u = clamp((progress - t0) / span, 0, 1);
      t0 += span + PAINT_LIFT;
      if (u <= 0) break;
      upto = u >= 1 ? 1 : x.at(pace(u) * x.L) / x.total;
    }
    brushStroke(c, x.pts, { width: x.w, ink, ground, dry: dry / 100, seed: seed * 31 + x.i * 101, body: body / 100, upto });
  }
  if (texture && !s.clear) grain(c, W, H, texture);
  c.restore();
}

/* ---------- Painted shapes over photographs (4.1), traced from the guideline file ---------- */
// Each is the file's own vector: flat colour, a same-colour stroke that rounds and swells the edge, and Figma's
// Texture effect roughening that edge slightly. Sizes are the file's (at 1920 wide), so stroke and roughness scale.
const SHAPES = {
  bandana: { name: 'Bandana', about: 'Tied at the neck, as on the terrier (4.1)', w: 210.3, h: 207.4, sw: 8, rough: 0.6, colour: '#FFAA4D', mirror: true,
    d: 'M 32.34 19.65 L 0 26.02 L 8.92 35.38 L 28.63 26.02 L 15.08 11.70 L 15.08 0 L 26.47 11.70 L 32.34 19.65 Z M 32.34 19.65 L 48.95 39.10 L 54.49 52.48 L 61.99 68.39 L 75.09 81.66 L 97.91 89.60 L 126.74 94.22 L 156.11 89.60 L 173.22 78.11 L 182.65 65.31 L 184.44 35.38 L 201.07 62.81 L 210.26 85.50 L 210.26 112.19 L 193.37 133.02 L 180.90 148.66 L 165.57 159.86 L 149.17 184.84 L 126.74 207.40 L 101.13 187.80 L 81.56 164.37 L 61.99 148.66 L 45.41 125.66 L 39.75 109.22 L 32.34 96.77 L 26.47 75.44 L 19.39 52.48 L 24.93 35.38 L 32.34 19.65 Z' },
  'bandana-tied': { name: 'Small bandana', about: 'A smaller bandana with its ties, as in the two-dog photograph', w: 118.9, h: 109.3, sw: 8, rough: 0.6, colour: '#B9C3A8',
    d: 'M 9.58 60.62 L 0 17.52 L 15.15 24.22 L 29.19 24.22 L 38.85 28.98 L 56.28 22.04 L 68.84 19.60 L 80.30 12.17 L 87.40 9.35 L 94.83 10.71 L 107.20 3.77 L 118.89 0 L 102.29 13.85 L 115.62 12.17 L 118.89 19.60 L 104.04 17.52 L 94.83 20.52 L 89.10 28.98 L 85.20 40.99 L 81.31 54.36 L 72.85 75.00 L 51.54 91.41 L 38.85 109.34 L 29.19 98.01 L 17.19 77.20 L 9.58 60.62 Z' },
  ears: { name: 'Ears', about: 'Ears that run above the photograph, as on the Doberman (4.1)', w: 250.6, h: 204.6, sw: 18, rough: 1.2, colour: '#BDB1EB', mirror: true,
    d: 'M 241.63 204.59 L 250.64 177.31 L 235.89 95.49 L 230.98 54.58 L 230.98 20.49 L 230.98 0 L 220.51 0 L 194.63 47.12 L 179.53 95.49 L 164.44 125.67 L 155.27 139.13 L 84.10 139.13 L 68.47 112.76 L 59.84 84.71 L 43.67 54.58 L 31.27 34.78 L 26.95 7.85 L 22.41 11.45 L 21.02 34.78 L 31.27 66.20 L 43.67 95.49 L 43.67 136.33 L 43.67 157.09 L 24.26 173.36 L 12.40 188.50 L 0 204.59 L 241.63 204.59 Z' },
  card: { name: 'Painted arch', about: 'The brand’s arch in colour with white paint across it, overlapping a photo’s edge', w: 205.7, h: 239.5, sw: 13, rough: 1.4, colour: '#FFAA4D', card: true, paint: '#FFFFFF', paintAt: [-95.4, -191.7],
    d: 'M 480.40 344.56 L 480.40 250.95 L 452.38 232.80 L 428.50 211.78 L 393.15 182.48 L 375.07 172.36 L 368.05 167.38 L 363.52 160.13 L 372.81 149.26 L 375.07 141.55 L 360.12 131.36 L 346.08 133.40 L 341.32 137.25 L 322.30 119.36 L 310.97 98.75 L 301.69 81.53 L 287.42 56.62 L 281.53 48.69 L 286.06 38.50 L 270.66 21.74 L 263.41 12.00 L 251.40 2.03 L 239.18 0 L 226.72 0 L 208.60 0 L 184.81 3.62 L 167.15 9.05 L 160.13 21.74 L 155.37 29.67 L 155.37 37.14 L 126.61 47.11 L 119.36 51.86 C 118.75 53.30 117.59 56.53 117.77 57.98 C 117.95 59.43 118.91 64.32 119.36 66.58 C 120.11 68.40 122.12 72.34 124.12 73.61 C 126.11 74.87 130.68 76.55 132.72 77.23 L 140.42 77.23 L 132.72 81.53 C 132.19 82.89 131.45 85.84 132.72 86.74 C 134.31 87.87 134.31 90.59 138.39 93.08 C 142.46 95.58 147.22 98.75 150.39 98.75 C 153.56 98.75 166.02 98.75 169.42 98.75 C 172.13 98.75 177.49 100.11 179.83 100.79 L 177.34 104.18 L 162.17 112.11 L 160.13 119.36 C 161.49 123.36 164.34 131.36 164.89 131.36 C 165.57 131.36 167.15 134.30 171.23 137.25 C 175.30 140.20 177.57 141.55 181.19 143.82 C 184.09 145.63 181.49 147.44 179.83 148.12 L 169.42 143.82 L 148.13 145.40 L 124.12 146.76 L 99.65 146.76 L 96.71 149.26 L 102.14 160.13 L 109.16 168.73 L 117.77 173.49 L 130.00 176.21 L 138.39 176.21 L 148.13 175.30 L 156.96 172.36 L 160.13 173.49 C 160.13 175.94 160.13 181.16 160.13 182.48 C 160.13 183.81 171.68 178.56 169.42 186.82 L 177.34 193.20 L 179.83 207.08 L 187.26 217.21 L 199.64 226.59 L 243.75 250.50 L 226.72 254.35 L 208.60 247.33 L 184.81 241.97 L 162.17 244.38 L 144.50 247.33 L 117.77 254.35 L 93.31 257.52 L 78.59 259.33 L 49.60 254.35 L 34.20 250.50 L 22.65 247.33 L 0 244.38 L 2.94 262.73 L 12.45 276.77 C 15.93 277.83 23.55 280.31 26.27 281.76 C 29.67 283.57 39.41 290.14 41.22 291.49 C 43.03 292.85 43.71 293.76 52.77 296.70 C 60.02 299.06 87.05 301.16 99.65 301.91 L 126.61 301.91 C 134.99 301.61 148.13 299.07 146.31 301.91 C 145.53 303.14 172.74 299.87 179.83 301.91 L 211.14 305.80 L 231.46 318.18 L 258.10 337.38 L 297.57 344.56 L 480.40 344.56 Z' },
};
export const MASK_SHAPES = Object.entries(SHAPES).map(([id, s]) => ({ id, name: s.name, about: s.about, colour: s.colour, aspect: s.w / s.h, behind: id === 'ears' }));

// SVG path (M, L, C, Z, absolute) to polygons, with curves sampled.
function pathPolys(d) {
  const t = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [], polys = []; let cur = [], i = 0, cmd = '';
  const num = () => +t[i++];
  while (i < t.length) {
    if (/^[MLCZ]$/i.test(t[i])) cmd = t[i++].toUpperCase();
    if (cmd === 'M') { if (cur.length) polys.push(cur); cur = [[num(), num()]]; cmd = 'L'; }
    else if (cmd === 'L') cur.push([num(), num()]);
    else if (cmd === 'C') { const [x0, y0] = cur[cur.length - 1], c1 = [num(), num()], c2 = [num(), num()], e = [num(), num()]; for (let k = 1; k <= 8; k++) { const u = k / 8, v = 1 - u; cur.push([v * v * v * x0 + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * e[0], v * v * v * y0 + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * e[1]]); } }
    else if (cmd === 'Z') { if (cur.length) polys.push(cur); cur = []; cmd = ''; }
    else i++;
  }
  if (cur.length) polys.push(cur);
  return polys;
}
const POLYS = Object.fromEntries(Object.entries(SHAPES).map(([id, s]) => [id, pathPolys(s.d)]));
// Densify so the roughening has points to move, then nudge each along a smooth noise: Figma's Texture effect.
function roughPoly(c, poly, k, rough, seed) {
  const pts = [];
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * k / 3)); for (let j = 0; j < n; j++) pts.push([lerp(a[0], b[0], j / n) * k, lerp(a[1], b[1], j / n) * k]); }
  c.moveTo(pts[0][0], pts[0][1]);
  pts.forEach(([x, y], i) => { const a = rough * Math.max(1, k * 1.5); c.lineTo(x + (noise1(i * 0.21, seed) - 0.5) * a + (noise1(i * 1.3, seed + 9) - 0.5) * a * 0.35, y + (noise1(i * 0.21, seed + 4) - 0.5) * a + (noise1(i * 1.3, seed + 13) - 0.5) * a * 0.35); });
  c.closePath();
}

// One painted shape. (x, y) is its centre and size its width, in canvas units; rotation in degrees.
export function paintShape(c, s) {
  const { shape = 'bandana', x, y, size, rot = 0, flip = false, seed = 1 } = s, def = SHAPES[shape] ?? SHAPES.bandana;
  const colour = s.colour ?? def.colour, k = size / def.w, mirror = !!def.mirror !== !!flip;
  c.save(); c.translate(x, y); c.rotate(rot * Math.PI / 180); if (mirror) c.scale(-1, 1); c.translate(-def.w * k / 2, -def.h * k / 2);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (def.card) {
    // The card is the brand's arch: a semicircular top and 4-unit corners at the foot, as in the file.
    const w = def.w * k, h = def.h * k, r = w / 2, rb = 4 * k, arch = () => { c.beginPath(); c.moveTo(0, r); c.arc(r, r, r, Math.PI, 0); c.lineTo(w, h - rb); c.arcTo(w, h, w - rb, h, rb); c.lineTo(rb, h); c.arcTo(0, h, 0, h - rb, rb); c.closePath(); };
    arch(); c.fillStyle = colour; c.fill();
    c.save(); arch(); c.clip();
    c.translate(def.paintAt[0] * k, def.paintAt[1] * k);
    c.beginPath(); for (const p of POLYS[shape]) roughPoly(c, p, k, def.rough, seed);
    c.fillStyle = s.paint ?? def.paint; c.fill(); c.strokeStyle = c.fillStyle; c.lineWidth = def.sw * k; c.stroke();
    c.restore();
  } else {
    c.beginPath(); for (const p of POLYS[shape]) roughPoly(c, p, k, def.rough, seed);
    c.fillStyle = colour; c.fill(); c.strokeStyle = colour; c.lineWidth = def.sw * k; c.stroke();
  }
  c.restore();
}

// The guideline's "SD Texture": the paper image at 40% in soft light over the whole frame.
function grain(c, W, H, tex, a = 0.4) {
  if (!tex?.width) return;
  c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = a;
  const sc = Math.max(W / tex.width, H / tex.height); c.drawImage(tex, (W - tex.width * sc) / 2, (H - tex.height * sc) / 2, tex.width * sc, tex.height * sc);
  c.restore();
}

/* ---------- A mask composition: ground, photograph, painted shapes (4.1) ---------- */
// The photograph fills its box (cover), cropped by zoom and focus; `extend` leaves a band of ground above it for
// ears to run into; `inset` sets the photograph inside a margin of ground, as on the guideline's black panel.
function photoBox(W, H, s) { const { inset = 0, extend = 0 } = s, m = Math.min(W, H) * inset / 100, bh0 = H - 2 * m; return [m, m + bh0 * extend / 100, W - 2 * m, bh0 * (1 - extend / 100)]; }
function photoRect(W, H, s, photo) { const [bx, by, bw, bh] = photoBox(W, H, s), { zoom = 1, fx = 0.5, fy = 0.5 } = s, sc = Math.max(bw / photo.width, bh / photo.height) * zoom, dw = photo.width * sc, dh = photo.height * sc; return [bx + (bw - dw) * fx, by + (bh - dh) * fy, dw, dh]; }
export function paintMask(c, W, H, s, photo, texture) {
  const { ground, shapes = [] } = s, [bx, by, bw, bh] = photoBox(W, H, s);
  c.save();
  c.fillStyle = ground; c.fillRect(0, 0, W, H);
  // A shape can sit behind the photograph, so the photo's edge cuts it cleanly (the Doberman's ears).
  for (const sh of shapes) if (sh.behind) paintShape(c, { ...sh, x: sh.x * W, y: sh.y * H, size: sh.size * W });
  if (photo?.width && bw > 2 && bh > 2) { const [dx, dy, dw, dh] = photoRect(W, H, s, photo); c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.drawImage(photo, dx, dy, dw, dh); c.restore(); }
  for (const sh of shapes) if (!sh.behind) paintShape(c, { ...sh, x: sh.x * W, y: sh.y * H, size: sh.size * W });
  if (texture) grain(c, W, H, texture);
  c.restore();
  return { box: [bx, by, bw, bh] };
}
// Where a point of the photograph (fractions of its width and height) lands in the frame, as fractions of the frame.
export function photoRectOf(W, H, s, photo) { return photoRect(W, H, s, photo); }
export function photoToFrame(W, H, s, photo, px, py) { const [dx, dy, dw, dh] = photoRect(W, H, s, photo); return { x: (dx + px * dw) / W, y: (dy + py * dh) / H, scale: dw / W }; }
