// Aurelius particle film engine.
// One cloud of specks that builds into the brand's particle forms and moves between them: dust, the speckled
// Earth, the flat world map, the World Graph landmarks (New York, London, Tokyo, DC, Singapore), the particle
// studio's solids, words set in the brand's type, and the mark. Every particle has a place in each form; a morph
// carries each one from its old place to its new one along a turbulent path, staggered so forms build rather than
// cross-fade. A camera can orbit, push in, and fly through the cloud.
//
// Everything is a function of time: renderAt(t) draws the same frame for the same film and t, so films render
// frame by frame at any size, however slow the machine.
//
//   const film = await createParticleFilm(canvas, spec);   // spec: { count, palette, shots, camera, spin }
//   film.renderAt(3.2);
import * as THREE from 'three';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-110m.json';
import { generate, DEFAULT_SETTINGS } from '@/lib/designShapes';
import { LANDMARKS } from '@/lib/landmarks';
import { CITIES, viewPosition } from '@/lib/cities';
import { buildSpecks, partGeom, withDetail } from '@/components/CityScene';
import { toVec } from '@/lib/geo';
import { styleOf, cubicBezier } from './motionstyle.js';

/* ---------- Seeded randomness, so the same film gives the same particles ---------- */
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function withSeed(seed, fn) { const keep = Math.random; Math.random = mulberry(seed); try { return fn(); } finally { Math.random = keep; } }
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

/* ---------- The forms ---------- */
export const FORMS = {
  field: 'Dust: a wide, deep cloud to fly through, or the state between forms.',
  globe: 'The speckled Earth, radius 1, land picked out by its night-light luminance (the World Graph globe).',
  map: 'The same Earth laid flat (equirectangular), 3.2 wide.',
  sphere: 'Particle studio: a sphere.', ring: 'Particle studio: a torus.', cube: 'Particle studio: a cube.',
  cylinder: 'Particle studio: a cylinder.', pyramid: 'Particle studio: a pyramid.', wave: 'Particle studio: a rippling plane.',
  'city:nyc': 'World Graph landmark: Empire State Building and Midtown.', 'city:london': 'World Graph landmark: Big Ben and Parliament.',
  'city:tokyo': 'World Graph landmark: Tokyo Tower.', 'city:dc': 'World Graph landmark: the U.S. Capitol.', 'city:singapore': 'World Graph landmark: Marina Bay Sands.',
  text: '{"text": "+75%"}: a word or number set in the brand headline face, then made of specks.',
  logo: 'The Aurelius mark, made of specks.',
  image: '{"image": "imagery/file.jpg"}: any picture, its light areas made of specks.',
};

const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => no(new Error(`could not load ${String(src).slice(0, 80)}`)); i.src = src; });
function maskOf(img, w, h, { alpha = true, gamma = 1 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
  const px = x.getImageData(0, 0, w, h).data, data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { let l = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255; if (alpha) l = px[i * 4 + 3] < 8 ? 0 : (px[i * 4 + 3] / 255) * (l > 0.02 ? 1 : 1); data[i] = Math.pow(l, gamma); }
  return { w, h, data };
}

// The Earth's land and night light, shared by globe and map.
let earthCache = null;
async function earthSamples(n, seed) {
  if (!earthCache) {
    const src = globalThis.__AURELIUS_EARTH_LUM;
    const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    let lum = new Uint8ClampedArray(W * H * 4);
    if (src) { ctx.drawImage(await loadImg(src), 0, 0, W, H); lum = ctx.getImageData(0, 0, W, H).data; ctx.clearRect(0, 0, W, H); }
    const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    ctx.beginPath(); geoPath(proj, ctx)(feature(landTopo, landTopo.objects.land)); ctx.fillStyle = '#000'; ctx.fill();
    earthCache = { W, H, lum, land: ctx.getImageData(0, 0, W, H).data };
  }
  const { W, H, lum, land } = earthCache, r = mulberry(seed), out = [];
  for (let tries = 0; out.length < n && tries < n * 60; tries++) {
    const u = r(), v = r(), lng = u * 360 - 180, lat = (Math.acos(2 * v - 1) * 180) / Math.PI - 90;
    const k = (Math.min(H - 1, Math.floor(((90 - lat) / 180) * H)) * W + Math.min(W - 1, Math.floor(u * W))) * 4;
    const l = lum[k] / 255, isLand = land[k + 3] > 128, p = Math.max(isLand ? 0.32 + l * 0.35 : 0, Math.pow(l, 3) * 0.85);
    if (r() < p) out.push([lat, lng, 0.55 + 0.45 * Math.min(1, l * 1.4 + (isLand ? 0.25 : 0)), r()]);
  }
  return out;
}

function fromList(list, n, seed) {
  // Resample a list of [x, y, z, shade] to exactly n particles, shuffled so any subset is even.
  const r = mulberry(seed), pos = new Float32Array(n * 3), shade = new Float32Array(n);
  const order = list.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  for (let i = 0; i < n; i++) {
    const p = list[order[i % Math.max(1, order.length)]] ?? [0, 0, 0, 0];
    const again = i >= order.length ? 0.004 : 0;
    pos[i * 3] = p[0] + (r() - 0.5) * again; pos[i * 3 + 1] = p[1] + (r() - 0.5) * again; pos[i * 3 + 2] = p[2] + (r() - 0.5) * again; shade[i] = p[3] ?? 1;
  }
  return { pos, shade };
}
function normalise(list, size = 1) {
  // Centre on the bounding box and scale so the largest half-extent is `size`.
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of list) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p[a]); hi[a] = Math.max(hi[a], p[a]); }
  const c = lo.map((v, a) => (v + hi[a]) / 2), k = size / Math.max(1e-6, ...hi.map((v, a) => (v - lo[a]) / 2));
  return list.map((p) => [(p[0] - c[0]) * k, (p[1] - c[1]) * k, (p[2] - c[2]) * k, p[3]]);
}
async function fontOf(which) {
  const css = getComputedStyle(document.documentElement);
  const fam = (css.getPropertyValue(which === 'label' ? '--font-label' : '--font-headline') || css.getPropertyValue('--font-display') || '').trim() || "'Roobert', 'Figtree', sans-serif";
  return fam;
}
async function textList(text, { weight = 400, font = 'headline' } = {}, seed) {
  const fam = await fontOf(font), size = 220, spec = `${weight} ${size}px ${fam}`;
  try { await document.fonts.load(spec, text); } catch { /* the stand-in face */ }
  const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = spec;
  const lines = String(text).split('\n'), w = Math.ceil(Math.max(...lines.map((l) => x.measureText(l).width))) + 40, h = Math.ceil(size * 1.05 * lines.length) + 40;
  c.width = w; c.height = h; x.font = spec; x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
  lines.forEach((l, i) => x.fillText(l, 20, 20 + size * 0.86 + i * size * 1.05));
  return maskList(maskOf(c, w, h), 1.6, 0.03, seed);
}
function maskList(m, half, depth, seed, n = 160000) {
  const r = mulberry(seed), out = [], aspect = m.w / m.h, W = aspect >= 1 ? half : half * aspect, H = aspect >= 1 ? half / aspect : half;
  for (let tries = 0; out.length < n && tries < n * 30; tries++) {
    const u = r(), v = r(), l = m.data[Math.min(m.h - 1, Math.floor(v * m.h)) * m.w + Math.min(m.w - 1, Math.floor(u * m.w))];
    if (r() < l) out.push([(u - 0.5) * 2 * W, (0.5 - v) * 2 * H, (r() - 0.5) * depth, 0.75 + 0.25 * r()]);
  }
  return out;
}
function cityList(id, seed) {
  const city = CITIES.find((c) => c.id === id), lm = LANDMARKS[id];
  if (!city || !lm) throw new Error(`no landmark "${id}". Landmarks: ${Object.keys(LANDMARKS).join(', ')}`);
  const v = city.view, t = new THREE.Vector3(v.target[0], v.target[1], -v.target[2]);
  const light = new THREE.Vector3(...viewPosition(v)).sub(t).setY(0).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.7).setY(0.55).normalize();
  const camDir = new THREE.Vector3(...viewPosition(v)).sub(t).normalize();
  const parts = withDetail(lm.parts);
  const { pos, col } = withSeed(seed, () => buildSpecks(parts.map(partGeom), light, new THREE.Vector3(lm.x, 0, -lm.y), parts.map((p) => p.k === 'prism' && !!p.lattice), v.dist * 0.55, camDir));
  // Centre on the landmark (not the ground ring) and scale by its height: the tallest point sits at y = 1.
  let top = 0; for (let i = 1; i < pos.length; i += 3) top = Math.max(top, pos[i]);
  const k = 2 / top, list = [];
  for (let i = 0; i < pos.length / 3; i++) list.push([(pos[i * 3] - lm.x) * k, pos[i * 3 + 1] * k - 1, (pos[i * 3 + 2] + lm.y) * k, col[i * 3]]);
  // Turn so the postcard view faces the default camera (looking down -z).
  const a = Math.atan2(camDir.x, camDir.z);
  return list.map(([x, y, z, s]) => [x * Math.cos(-a) + z * Math.sin(-a), y, -x * Math.sin(-a) + z * Math.cos(-a), s]);
}

async function formList(form, n, seed) {
  if (typeof form === 'string' && form.startsWith('city:')) return cityList(form.slice(5), seed);
  if (form === 'globe') return (await earthSamples(n, seed)).map(([lat, lng, s, j]) => [...toVec(lat, lng, 1.001 + j * 0.006), s]);
  if (form === 'map') return (await earthSamples(n, seed)).map(([lat, lng, s, j]) => [(lng / 180) * 1.6, (lat / 90) * 0.8, (j - 0.5) * 0.01, s]);
  if (form === 'field') { const r = mulberry(seed), out = []; for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, rad = 4.5 * Math.cbrt(r()), s = Math.sqrt(1 - u * u); out.push([rad * s * Math.cos(a), rad * u * 0.55, rad * s * Math.sin(a), 0.35 + 0.5 * r()]); } return out; }
  if (form === 'logo') {
    const sym = globalThis.__AURELIUS_LOGO?.symbol;
    if (!sym?.d) throw new Error('the mark is not available in this page');
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sym.w} ${sym.h}"><path fill="#fff" d="${sym.d}"/></svg>`);
    const img = await loadImg(src); return maskList(maskOf(img, 600, Math.round(600 * img.height / img.width)), 1, 0.05, seed);
  }
  if (form && typeof form === 'object' && 'text' in form) return textList(form.text, form, seed);
  if (form && typeof form === 'object' && 'image' in form) { const img = await loadImg(form.image); const sc = 600 / Math.max(img.width, img.height); return maskList(maskOf(img, Math.round(img.width * sc), Math.round(img.height * sc), { alpha: false, gamma: 1.4 }), 1.4, 0.05, seed); }
  const solid = ['sphere', 'ring', 'cube', 'cylinder', 'pyramid', 'wave'];
  if (solid.includes(form)) {
    const arr = withSeed(seed, () => generate({ settings: { ...DEFAULT_SETTINGS, shape: form, density: Math.min(n, 500000), fill: 'surface' } }));
    const r = mulberry(seed + 1), out = []; for (let i = 0; i < arr.length / 3; i++) out.push([arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2], 0.7 + 0.3 * r()]); return out;
  }
  throw new Error(`unknown form ${JSON.stringify(form)}. Forms: ${Object.keys(FORMS).join(', ')}`);
}
const formKey = (f) => (typeof f === 'string' ? f : JSON.stringify(f));
async function buildForm(form, n, scale = 1) {
  const seed = hash(formKey(form));
  let list = await formList(form, n, seed);
  if (!list.length) throw new Error(`the form ${formKey(form)} came out empty`);
  if (typeof form === 'object' || form === 'logo') list = normalise(list, 0.9);
  if (scale !== 1) list = list.map(([x, y, z, s]) => [x * scale, y * scale, z * scale, s]);
  return fromList(list, n, seed + 7);
}

/* ---------- Pairing: which particle goes where ---------- */
// "scatter" pairs at random (the cloud swirls apart and re-forms); "sweep-x"/"sweep-y" keep left-to-right or
// bottom-to-top order, so a form builds across the frame; "radial" builds from the centre out.
function pairOrder(from, to, order, n) {
  if (order === 'scatter') return null;
  const key = (pos, i) => order === 'sweep-x' ? pos[i * 3] : order === 'sweep-y' ? pos[i * 3 + 1] : Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  const a = Array.from({ length: n }, (_, i) => i).sort((p, q) => key(from.pos, p) - key(from.pos, q));
  const b = Array.from({ length: n }, (_, i) => i).sort((p, q) => key(to.pos, p) - key(to.pos, q));
  const map = new Uint32Array(n); for (let k = 0; k < n; k++) map[a[k]] = b[k]; return map;
}

/* ---------- Drawing ---------- */
const VERT = `
attribute vec3 a; attribute vec3 b; attribute float sa; attribute float sb; attribute float rnd; attribute float ord;
uniform float uP, uSpread, uFlow, uTime, uSize, uScale, uNear, uDrift, uMode;
uniform vec4 uB;
varying float vShade; varying float vAlpha;
vec3 swirl(vec3 p, float t) {
  return vec3(sin(p.y * 2.3 + t * 0.9) + sin(p.z * 3.7 - t * 0.6), sin(p.z * 2.1 - t * 0.7) + sin(p.x * 3.1 + t * 0.5), sin(p.x * 2.7 + t * 0.8) + sin(p.y * 3.3 - t * 0.4)) * 0.5;
}
// The motion style's curve (a CSS cubic-bezier), solved per particle.
float bez(float x) {
  float t = x;
  for (int i = 0; i < 6; i++) {
    float bx = 3.0 * (1.0 - t) * (1.0 - t) * t * uB.x + 3.0 * (1.0 - t) * t * t * uB.z + t * t * t;
    float dx = 3.0 * (1.0 - t) * (1.0 - t) * uB.x + 6.0 * (1.0 - t) * t * (uB.z - uB.x) + 3.0 * t * t * (1.0 - uB.z);
    t = clamp(t - (bx - x) / max(dx, 0.0001), 0.0, 1.0);
  }
  return 3.0 * (1.0 - t) * (1.0 - t) * t * uB.y + 3.0 * (1.0 - t) * t * t * uB.w + t * t * t;
}
void main() {
  // Each particle sets off at its own moment: in pairing order (so a form builds across or out from the centre), else at random.
  float local = clamp((uP - ord * uSpread) / max(0.0001, 1.0 - uSpread), 0.0, 1.0);
  float e = uMode < 0.5 ? (local < 0.5 ? 4.0 * local * local * local : 1.0 - pow(-2.0 * local + 2.0, 3.0) / 2.0) : bez(local);
  vec3 p = mix(a, b, e);
  float mid = sin(3.14159 * e);
  p += swirl(p * 1.3 + rnd * 4.0, uTime) * uFlow * mid;
  p += swirl(p * 0.8 + rnd * 9.0, uTime * 0.35) * uDrift;
  vShade = mix(sa, sb, e);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float z = -mv.z;
  float px = uSize * uScale / max(z, 0.001);
  // Specks right at the lens grow soft and fade, so flying through the cloud reads as depth, not blobs.
  vAlpha = smoothstep(uNear * 0.35, uNear, z) * (px < 1.0 ? px : 1.0) * (1.0 - smoothstep(14.0, 22.0, z));
  gl_PointSize = clamp(px, 1.0, 28.0);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
precision highp float;
uniform vec3 uColor; uniform float uOpacity;
varying float vShade; varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5; float r = length(c);
  if (r > 0.5) discard;
  float soft = 1.0 - smoothstep(0.32, 0.5, r);
  gl_FragColor = vec4(uColor * (0.55 + 0.45 * vShade), soft * vAlpha * uOpacity);
}`;

const ease = { linear: (x) => x, in: (x) => x * x * x, out: (x) => 1 - (1 - x) ** 3, inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2), gentle: (x) => 0.5 - 0.5 * Math.cos(Math.PI * x) };
const lerp = (a, b, k) => a + (b - a) * k;

// Camera keys: {at, az, el, dist, look: [x, y, z], fov, ease}. az/el in degrees around the look point; dist in units
// of the form's radius (1 frames it closely, 3 shows it whole, under 1 is inside it).
function cameraAt(keys, t, style = 'launch') {
  const st = styleOf(style), named = { move: cubicBezier(...st.curves.move), snap: cubicBezier(...st.curves.snap) };
  const k = keys.length ? keys : [{ at: 0, az: 0, el: 10, dist: 3 }];
  let i = 0; while (i < k.length - 1 && k[i + 1].at <= t) i++;
  const A = k[i], B = k[Math.min(i + 1, k.length - 1)], span = B.at - A.at;
  const name = B.ease ?? (style === 'calm' ? 'inOut' : 'move'), fn = named[name] ?? ease[name] ?? ease.inOut;
  // A key marked "cut" is a jump: the camera holds the previous key until it, then is simply there.
  const u = B.cut ? 0 : span > 0 ? fn(Math.min(1, Math.max(0, (t - A.at) / span))) : 0;
  const pick = (f, d) => lerp(A[f] ?? d, B[f] ?? A[f] ?? d, u);
  const la = A.look ?? [0, 0, 0], lb = B.look ?? la;
  return { az: pick('az', 0), el: pick('el', 10), dist: pick('dist', 3), fov: pick('fov', 40), roll: pick('roll', 0), look: [0, 1, 2].map((j) => lerp(la[j], lb[j], u)) };
}

export function checkFilmSpec(spec) {
  const errors = [], shots = spec?.shots;
  if (!Array.isArray(shots) || !shots.length) errors.push('"shots" must be a list of {at, form, morph}.');
  else shots.forEach((s, i) => {
    const f = s.form ?? s.shape;
    if (typeof s.at !== 'number') errors.push(`shot ${i + 1}: "at" must be a time in seconds.`);
    const known = typeof f === 'string' ? f in FORMS : f && typeof f === 'object' && ('text' in f || 'image' in f);
    if (!known) errors.push(`shot ${i + 1}: unknown form ${JSON.stringify(f)}. Forms: ${Object.keys(FORMS).join(', ')}.`);
    if (s.morph?.order && !['scatter', 'sweep-x', 'sweep-y', 'radial'].includes(s.morph.order)) errors.push(`shot ${i + 1}: morph.order must be scatter, sweep-x, sweep-y or radial.`);
  });
  if (spec?.count && (spec.count < 5000 || spec.count > 400000)) errors.push('"count" must be between 5,000 and 400,000.');
  return errors;
}

export async function createParticleFilm(canvas, spec) {
  const errors = checkFilmSpec(spec); if (errors.length) throw new Error(errors.join('\n'));
  const n = spec.count ?? 140000, W = canvas.width, H = canvas.height;
  const shots = [...spec.shots].map((s) => ({ ...s, form: s.form ?? s.shape })).sort((p, q) => p.at - q.at);
  const forms = new Map();
  for (const s of shots) { const k = formKey(s.form) + '@' + (s.scale ?? 1); if (!forms.has(k)) forms.set(k, await buildForm(s.form, n, s.scale ?? 1)); s.key = k; }
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  const pal = spec.palette ?? {};
  renderer.setClearColor(new THREE.Color(pal.bg ?? '#1E1D1A'), pal.transparent ? 0 : 1);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 200);
  const g = new THREE.BufferGeometry(), A = new THREE.BufferAttribute(new Float32Array(n * 3), 3), B = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
  const SA = new THREE.BufferAttribute(new Float32Array(n), 1), SB = new THREE.BufferAttribute(new Float32Array(n), 1), R = new THREE.BufferAttribute(new Float32Array(n), 1), O = new THREE.BufferAttribute(new Float32Array(n), 1);
  const rr = mulberry(97); for (let i = 0; i < n; i++) R.array[i] = rr();
  g.setAttribute('position', A); g.setAttribute('a', A); g.setAttribute('b', B); g.setAttribute('sa', SA); g.setAttribute('sb', SB); g.setAttribute('rnd', R); g.setAttribute('ord', O);
  const uniforms = { uP: { value: 1 }, uSpread: { value: 0.5 }, uFlow: { value: 0.3 }, uTime: { value: 0 }, uSize: { value: 0.006 }, uScale: { value: 1 }, uNear: { value: 0.6 }, uDrift: { value: 0.004 }, uMode: { value: 1 }, uB: { value: new THREE.Vector4(...styleOf(spec.style).curves.move) }, uColor: { value: new THREE.Color(pal.speck ?? '#E9E5DB') }, uOpacity: { value: 0.85 } };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false });
  const points = new THREE.Points(g, mat); points.frustumCulled = false; scene.add(points);
  let pair = '';
  const setPair = (from, to, order) => {
    const id = `${from}>${to}:${order}`; if (id === pair) return; pair = id;
    const F = forms.get(from), T = forms.get(to), map = from === to ? null : pairOrder(F, T, order, n);
    // Setting-off order: by the target's place along the sweep, with a little randomness so the front is soft.
    if (map) { const key = (j) => order === 'sweep-x' ? T.pos[j * 3] : order === 'sweep-y' ? T.pos[j * 3 + 1] : Math.hypot(T.pos[j * 3], T.pos[j * 3 + 1], T.pos[j * 3 + 2]); let lo = Infinity, hi = -Infinity; for (let i = 0; i < n; i++) { const v = key(map[i]); lo = Math.min(lo, v); hi = Math.max(hi, v); } for (let i = 0; i < n; i++) O.array[i] = Math.min(1, Math.max(0, 0.85 * (key(map[i]) - lo) / (hi - lo || 1) + 0.15 * R.array[i])); }
    else for (let i = 0; i < n; i++) O.array[i] = R.array[i];
    O.needsUpdate = true;
    for (let i = 0; i < n; i++) {
      const j = map ? map[i] : i;
      A.array[i * 3] = F.pos[i * 3]; A.array[i * 3 + 1] = F.pos[i * 3 + 1]; A.array[i * 3 + 2] = F.pos[i * 3 + 2];
      B.array[i * 3] = T.pos[j * 3]; B.array[i * 3 + 1] = T.pos[j * 3 + 1]; B.array[i * 3 + 2] = T.pos[j * 3 + 2];
      SA.array[i] = F.shade[i]; SB.array[i] = T.shade[j];
    }
    A.needsUpdate = B.needsUpdate = SA.needsUpdate = SB.needsUpdate = true;
  };
  const spin = spec.spin ?? 0, st = styleOf(spec.style);
  return {
    forms: [...forms.keys()],
    /** Where the film is at t: which shot, and how far through its morph (for scoring and overlays). */
    stateAt(t) {
      let i = 0; while (i < shots.length - 1 && shots[i + 1].at <= t) i++;
      const s = shots[i], m = s.morph ?? {}, dur = i === 0 && !s.morph ? 0 : (m.duration ?? st.timing.morph.median);
      return { shot: i, form: s.form, morph: dur ? Math.min(1, Math.max(0, (t - s.at) / dur)) : 1, from: i ? shots[i - 1].form : s.form };
    },
    renderAt(t) {
      let i = 0; while (i < shots.length - 1 && shots[i + 1].at <= t) i++;
      const s = shots[i], prev = i ? shots[i - 1] : s, m = s.morph ?? {};
      const dur = i === 0 && !s.morph ? 0 : (m.duration ?? st.timing.morph.median);
      const curve = m.ease === 'inOut' ? null : st.curves[m.ease ?? 'move'] ?? (Array.isArray(m.ease) ? m.ease : st.curves.move);
      uniforms.uMode.value = curve ? 1 : 0; if (curve) uniforms.uB.value.set(...curve);
      setPair(prev.key, s.key, m.order ?? 'scatter');
      uniforms.uP.value = dur ? Math.min(1, Math.max(0, (t - s.at) / dur)) : 1;
      uniforms.uSpread.value = m.spread ?? 0.55; uniforms.uFlow.value = m.flow ?? 0.35; uniforms.uTime.value = t;
      uniforms.uDrift.value = s.drift ?? spec.drift ?? 0.004;
      const size = (k) => (k.size ?? spec.size ?? 0.006); uniforms.uSize.value = lerp(size(prev), size(s), uniforms.uP.value);
      const op = (k) => (k.opacity ?? spec.opacity ?? 0.85); uniforms.uOpacity.value = lerp(op(prev), op(s), uniforms.uP.value);
      if (s.speck || pal.speck) uniforms.uColor.value.set(s.speck ?? pal.speck);
      const c = cameraAt(spec.camera ?? [], t, spec.style), az = (c.az * Math.PI) / 180, el = (c.el * Math.PI) / 180;
      camera.fov = c.fov; camera.aspect = W / H; camera.updateProjectionMatrix();
      camera.position.set(c.look[0] + c.dist * Math.cos(el) * Math.sin(az), c.look[1] + c.dist * Math.sin(el), c.look[2] + c.dist * Math.cos(el) * Math.cos(az));
      camera.up.set(Math.sin((c.roll * Math.PI) / 180), Math.cos((c.roll * Math.PI) / 180), 0); camera.lookAt(...c.look);
      // Same speck size as the World Graph studio (three.js points: size × half the canvas height ÷ depth), scaled for field of view.
      uniforms.uScale.value = (H / 2) * (Math.tan((40 * Math.PI) / 360) / Math.tan((c.fov * Math.PI) / 360));
      uniforms.uNear.value = spec.near ?? 0.6;
      points.rotation.y = (spin * t * Math.PI) / 180;
      renderer.render(scene, camera);
    },
    dispose() { g.dispose(); mat.dispose(); renderer.dispose(); },
  };
}
