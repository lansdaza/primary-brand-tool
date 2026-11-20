// The kit's film stage. film.mjs opens render.html with window.__KIT_FILM set, hands over the film (particle
// timeline, the agent's own HTML/CSS overlay, brand.css), then asks for each frame in turn: kitFilm.seek(t) draws
// the particles at t and calls the overlay's own seek(t), and film.mjs photographs the stage. Nothing here reads the
// clock, so a film renders the same at any speed.
import { createParticleFilm, FORMS, checkFilmSpec } from './engine/particles.js';
import { renderScore, wavOf, planScore, fitTempo } from './engine/score.js';
import { STYLES, styleOf, cubicBezier } from './engine/motionstyle.js';

type FilmSpec = { width: number; height: number; fps?: number; duration: number; background?: string; particles?: any; overlay?: string; css?: string; style?: string };

// Motion helpers the overlay can use (window.kit). All are pure functions of time, so every frame is exact.
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const EASE: Record<string, (x: number) => number> = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  out: (x) => 1 - (1 - x) ** 3,
  outExpo: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  in: (x) => x * x * x,
  gentle: (x) => 0.5 - 0.5 * Math.cos(Math.PI * x),
};
EASE.move = cubicBezier(...(STYLES.launch.curves.move as [number, number, number, number]));
EASE.snap = cubicBezier(...(STYLES.launch.curves.snap as [number, number, number, number]));
const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
let fps = 30;
// Motion blur for one element: an SVG blur stretched along the direction it is moving, as a camera shutter would.
const blurs = new WeakMap<Element, SVGFEGaussianBlurElement>();
let svgHost: SVGSVGElement | null = null, blurN = 0;
function setBlur(el: HTMLElement, px: number, py: number) {
  if (px < 0.3 && py < 0.3) { if (el.style.filter.includes('url(#kitmb')) el.style.filter = ''; return; }
  let fe = blurs.get(el);
  if (!fe) {
    if (!svgHost) { svgHost = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svgHost.setAttribute('width', '0'); svgHost.setAttribute('height', '0'); svgHost.style.position = 'absolute'; document.body.append(svgHost); }
    const f = document.createElementNS('http://www.w3.org/2000/svg', 'filter'), id = `kitmb${blurN++}`;
    f.id = id; f.setAttribute('x', '-50%'); f.setAttribute('y', '-50%'); f.setAttribute('width', '200%'); f.setAttribute('height', '200%');
    fe = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur'); f.append(fe); svgHost.append(f); blurs.set(el, fe); (el as any).__mb = id;
  }
  fe.setAttribute('stdDeviation', `${px.toFixed(2)} ${py.toFixed(2)}`);
  el.style.filter = `url(#${(el as any).__mb})`;
}
type Pose = { x?: number; y?: number; scale?: number; opacity?: number; rotate?: number };
export const motion = {
  clamp,
  ease: EASE,
  style: styleOf('launch'),
  /** 0 before a, 1 after b, eased between. Default ease is the style's measured move curve. */
  span: (t: number, a: number, b: number, e: string = 'move') => (EASE[e] ?? EASE.move)(clamp((t - a) / (b - a || 1e-6))),
  lerp: (a: number, b: number, k: number) => a + (b - a) * k,
  /** Wraps each word (or letter) of an element in spans and returns them, for staggered reveals. */
  split(el: Element, by: 'word' | 'char' = 'word') {
    if ((el as any).__split) return (el as any).__split as HTMLElement[];
    const text = el.textContent ?? '';
    const parts = by === 'char' ? [...text] : text.split(/(\s+)/);
    el.textContent = '';
    const spans: HTMLElement[] = [];
    for (const p of parts) {
      if (/^\s+$/.test(p)) { el.append(p); continue; }
      const outer = document.createElement('span'); outer.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;padding:0.08em 0.02em;margin:-0.08em -0.02em';
      const inner = document.createElement('span'); inner.style.cssText = 'display:inline-block;will-change:transform'; inner.textContent = p;
      outer.append(inner); el.append(outer); spans.push(inner);
    }
    (el as any).__split = spans;
    return spans;
  },
  /** Moves an element from one pose to another between at and at + dur, with motion blur along its path.
   *  Poses: {x, y} in px, scale, opacity, rotate in degrees. */
  move(el: HTMLElement, t: number, o: { at: number; dur?: number; from?: Pose; to?: Pose; ease?: string; blur?: number }) {
    const dur = o.dur ?? motion.style.timing.move.median, e = EASE[o.ease ?? 'move'] ?? EASE.move;
    const pose = (tt: number) => { const k = e(clamp((tt - o.at) / dur)), f = o.from ?? {}, g = o.to ?? {}, L = (a?: number, b?: number, d = 0) => (a ?? d) + ((b ?? a ?? d) - (a ?? d)) * k; return { x: L(f.x, g.x), y: L(f.y, g.y), s: L(f.scale, g.scale, 1), o: L(f.opacity, g.opacity, 1), r: L(f.rotate, g.rotate) }; };
    const p = pose(t), q = pose(t - 0.5 / fps);
    el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.s}) rotate(${p.r}deg)`;
    el.style.opacity = String(p.o);
    const k = o.blur ?? 0.35; setBlur(el, Math.abs(p.x - q.x) * k, Math.abs(p.y - q.y) * k);
    return p;
  },
  /** Decodes text: random glyphs settle into the target, left to right, between at and at + dur. */
  scramble(el: HTMLElement, t: number, o: { at: number; dur?: number; from?: string; to: string; glyphs?: string }) {
    const dur = o.dur ?? 0.7, k = clamp((t - o.at) / dur), from = o.from ?? '', to = o.to, n = Math.max(from.length, to.length);
    const glyphs = o.glyphs ?? '!@#$%&*+=?/<>[]{}0123456789', r = rng(Math.floor(t * fps) * 7919 + n);
    if (k <= 0) { el.textContent = from; return; } if (k >= 1) { el.textContent = to; return; }
    let out = '';
    for (let i = 0; i < n; i++) { const settle = (i + 1) / n; out += k >= settle ? (to[i] ?? '') : k > settle - 0.45 ? glyphs[Math.floor(r() * glyphs.length)] : (from[i] ?? ''); }
    el.textContent = out;
  },
  /** Words fly in from scattered places and resolve into the line, like type assembling itself. */
  assemble(words: HTMLElement[], t: number, o: { at: number; dur?: number; spread?: number; seed?: number }) {
    const r = rng(o.seed ?? 11), dur = o.dur ?? motion.style.timing.typeIn, spread = o.spread ?? 260;
    words.forEach((w, i) => {
      const dx = (r() - 0.5) * 2 * spread, dy = (r() - 0.5) * spread, s = 0.6 + r() * 0.9, st = o.at + i * motion.style.timing.stagger;
      motion.move(w, t, { at: st, dur, from: { x: dx, y: dy, scale: s, opacity: 0 }, to: { x: 0, y: 0, scale: 1, opacity: 1 }, ease: 'snap' });
    });
  },
  /** How blurred the whole stage should be for a defocus transition centred at `at` (px; 0 outside it). */
  defocus: (t: number, at: number, len = 0.5, px = 24) => { const d = Math.abs(t - at) / (len / 2); return d >= 1 ? 0 : px * (1 - d * d); },
};

export function setupFilm() {
  const w = window as any;
  w.kit = motion;
  let film: Awaited<ReturnType<typeof createParticleFilm>> | null = null;
  w.kitFilm = {
    forms: FORMS,
    styles: STYLES,
    check: (p: any) => checkFilmSpec(p),
    async prepare(spec: FilmSpec) {
      const { width: W, height: H } = spec;
      // The film's motion style sets the overlay's eases and timings (window.kit.style).
      const st = styleOf(spec.style ?? 'launch'); motion.style = st; fps = spec.fps ?? 30;
      EASE.move = cubicBezier(...(st.curves.move as [number, number, number, number])); EASE.snap = cubicBezier(...(st.curves.snap as [number, number, number, number]));
      document.body.innerHTML = '';
      document.body.style.cssText = `margin:0;background:${spec.background ?? '#000'};overflow:hidden`;
      if (spec.css) { const s = document.createElement('style'); s.textContent = spec.css; document.head.append(s); }
      const stage = document.createElement('div');
      stage.id = 'stage';
      stage.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;background:${spec.background ?? 'transparent'}`;
      document.body.append(stage);
      if (spec.particles) {
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
        stage.append(canvas);
        film = await createParticleFilm(canvas, { style: spec.style ?? 'launch', ...spec.particles });
      }
      const over = document.createElement('div');
      over.id = 'overlay';
      over.style.cssText = 'position:absolute;inset:0';
      over.innerHTML = spec.overlay ?? '';
      stage.append(over);
      // Scripts set by innerHTML do not run; run them in order, as written.
      for (const old of [...over.querySelectorAll('script')]) {
        const s = document.createElement('script');
        s.textContent = old.textContent;
        old.replaceWith(s);
      }
      await (document.fonts?.ready ?? Promise.resolve());
      return { forms: film?.forms ?? [], overlaySeek: typeof w.seek === 'function' };
    },
    /** Draw the frame at t seconds. */
    seek(t: number) {
      film?.renderAt(t);
      if (typeof w.seek === 'function') w.seek(t);
      return true;
    },
    /** Which shot and morph the particles are in at t, for scoring and overlays. */
    state: (t: number) => film?.stateAt(t) ?? null,
  };
  // The score: rendered offline from the film's own timeline; returned as base64 WAV plus the plan it followed.
  w.kitScore = {
    plan(f: any) { const p = planScore(f); return { tempo: p.tempo, beat: p.beat, chords: p.chords, moments: p.moments, fit: fitTempo(f) }; },
    async render(f: any) {
      const { buffer, plan } = await renderScore(f);
      const bytes = new Uint8Array(wavOf(buffer));
      let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { wav: btoa(bin), plan };
    },
  };
  w.kitResult = { ok: true, template: null, width: 0, height: 0, params: {}, warnings: [], film: true };
}
