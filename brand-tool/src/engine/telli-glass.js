// @ts-nocheck
// telli Soft Glass, drawn live. The glass shapes, their positions, the colour fields and the Glass effect
// values are read from the Figma file "telli Brand Guidelines" (pages 6.1 to 6.3 and frames 101 to 116 on
// Additional Assets). Figma's Glass effect itself is rebuilt as a WebGL shader: a colour field and the
// wavefield texture, then each glass layer in order, each one blurring (frost), bending (refraction, depth),
// splitting (dispersion) and lighting what is beneath it. It is tuned against the file's renders; it is a
// close rebuild, not Figma's renderer.
import P from './telli-glass-data.json';

export const GLASS_COLOURS = [
  { id: 'blue', name: 'Blue', wave: ['#1B61E1', '#ADCEFF'], ell: '#004FE1', hot: '#004FE1' },
  { id: 'pale', name: 'Pale blue', wave: ['#79A7F4', '#D0E3FD'], ell: '#286AE5', hot: '#286AE5' },
  { id: 'orange', name: 'Orange', wave: ['#F7571F', '#FFB38E'], ell: '#FD7E3C', hot: '#FF480B' },
  { id: 'lavender', name: 'Lavender', wave: ['#C893F1', '#F4D0FF'], ell: '#C78CF5', hot: '#C78CF5' },
  { id: 'forest', name: 'Forest', wave: ['#548751', '#C8FBC5'], ell: '#50BE49', hot: '#50BE49' },
];

/* ---------- Shapes ---------- */
// Every shape knows its box in the design it came from and how to draw itself there.
const boxes = {};
function pathBox(k) {
  if (boxes[k]) return boxes[k];
  const t = P[k].match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g); let cmd = '', i = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, cx = 0, cy = 0;
  const pt = (x, y) => { cx = x; cy = y; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  while (i < t.length) {
    if (/^[A-Za-z]$/.test(t[i])) { cmd = t[i++]; continue; }
    if (cmd === 'H') pt(+t[i++], cy); else if (cmd === 'V') pt(cx, +t[i++]); else { pt(+t[i], +t[i + 1]); i += 2; }
  }
  return (boxes[k] = [x0, y0, x1, y1]);
}
// A path exactly where the file puts it.
const at = (p, ox, oy) => { const b = pathBox(p); return { box: [b[0] + ox, b[1] + oy, b[2] + ox, b[3] + oy], draw: (c) => { c.translate(ox, oy); c.fill(pathOf(p)); } }; };
// One half of the logomark, fitted to a box. L and R are the file's halves (371.4 by 808.8); U, D and the
// diagonals are the same halves turned, as the Ring patterns turn them.
const HALF = { w: 371.4, h: 808.8 };
const TURN = { L: ['p5', 0], R: ['p15', 0], U: ['p5', Math.PI / 2], D: ['p5', -Math.PI / 2], UL: ['p5', Math.PI / 4], DL: ['p5', -Math.PI / 4], UR: ['p15', -Math.PI / 4], DR: ['p15', Math.PI / 4] };
function turned(p, w0, h0, cx, cy, sx, sy, rot) {
  const w = sx * w0, h = sy * h0, C = Math.abs(Math.cos(rot)), Sn = Math.abs(Math.sin(rot)), bw = C * w + Sn * h, bh = Sn * w + C * h;
  return { box: [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], draw: (c) => { c.translate(cx, cy); c.rotate(rot); c.scale(sx, sy); c.translate(-w0 / 2, -h0 / 2); c.fill(pathOf(p)); } };
}
function half(kind, x, y, w, h) {
  const [p, rot] = TURN[kind], flat = kind === 'U' || kind === 'D';
  return turned(p, HALF.w, HALF.h, x + w / 2, y + h / 2, (flat ? h : w) / HALF.w, (flat ? w : h) / HALF.h, rot);
}
// A diagonal half sits in a square box; its own size is the small half's.
const diag = (kind, x, y, box, w, h) => turned(TURN[kind][0], HALF.w, HALF.h, x + box / 2, y + box / 2, w / HALF.w, h / HALF.h, TURN[kind][1]);
const cell = (x, y, w, h) => turned('cell', 253.78, 238.46, x + w / 2, y + h / 2, w / 253.78, h / 238.46, 0);
const layer = (shapes, k) => ({ shapes, k });
// Pieces of one motif move as one when the frame changes.
const together = (...parts) => ({ box: [Math.min(...parts.map((q) => q.box[0])), Math.min(...parts.map((q) => q.box[1])), Math.max(...parts.map((q) => q.box[2])), Math.max(...parts.map((q) => q.box[3]))], draw: (c) => { for (const q of parts) { c.save(); q.draw(c); c.restore(); } } });

/* ---------- Generators: patterns that repeat, rebuilt for any frame ---------- */
// Each takes the frame (Tw by Th, in the design's units) and fills it, plus room to move the pattern.
const reach = (T) => [-0.3 * T - 700, 1.3 * T + 700];
const logoColumns = (Tw, Th) => {
  // Columns of logomark halves, facing outward from the centre: 287 from the centre, then every 394.
  const c = Tw / 2, oy = Th / 2 - 540, A = [], B = [];
  for (let k = 0; 287 + 394 * k - 250 < 0.8 * Tw + 700; k++) { const o = 287 + 394 * k; (k % 2 ? A : B).push(at('p0', c + o - 250, oy), at('p2', c - o - 250, oy)); }
  return [layer(A), layer(B)];
};
const tiles = (x0, y0, w, h, px, py) => (Tw, Th) => {
  const fx = ((x0 + w / 2 - 960) / px) % 1, fy = ((y0 + h / 2 - 540) / py) % 1, out = [], [ax, bx] = reach(Tw), [ay, by] = reach(Th);
  for (let i = Math.floor((ax - Tw / 2) / px) - 1; i <= Math.ceil((bx - Tw / 2) / px) + 1; i++)
    for (let j = Math.floor((ay - Th / 2) / py) - 1; j <= Math.ceil((by - Th / 2) / py) + 1; j++) out.push(cell(Tw / 2 + (i + fx) * px - w / 2, Th / 2 + (j + fy) * py - h / 2, w, h));
  return [layer(out)];
};
const lattice = (Tw, Th) => {
  // Pairs of halves, a pair either side of the centre, every 655.4 across and 658.8 down.
  const out = [], [ax, bx] = reach(Tw), [ay, by] = reach(Th);
  for (let k = -8; k < 8; k++) { const pc = Tw / 2 + 327.7 * (2 * k + 1); if (pc < ax || pc > bx) continue;
    for (let r = -4; r < 4; r++) { const rc = Th / 2 + 329.4 * (2 * r + 1); if (rc < ay || rc > by) continue;
      out.push(half('L', pc - 307.6, rc - 309.35, 286.2, 618.7), half('R', pc + 21.4, rc - 309.35, 286.2, 618.7)); } }
  return [layer(out)];
};
const ring = (Tw, Th) => {
  // A row of halves facing out from the centre, every 377.6, with a turned half above and below the centre.
  const out = [], [ax, bx] = reach(Tw), y = Th / 2 - 356;
  for (let k = 0; k < 12; k++) { const l = Tw / 2 - 355.1 - 377.6 * k, r = Tw / 2 + 24.2 + 377.6 * k; if (l + 330 > ax) out.push(half('L', l, y, 329.9, 713)); if (r < bx) out.push(half('R', r, y, 329.9, 713)); }
  out.push(half('U', Tw / 2 - 357, Th / 2 - 730.2, 713, 329.9), half('D', Tw / 2 - 357, Th / 2 + 401.3, 713, 329.9));
  return [layer(out)];
};

const G = (frost, depth, disp, fill, lighten = false) => ({ frost, depth, disp, fill, lighten });
const ELL = [[959.5, 540.5, 470.5, 600]], VIG = [960, 540, 1049], VIG_WIDE = [960, 540, 1266];
const TESS_ELL = [[959.5, 539.5, 562.5, 600], [959.5, 539.5, 334.5, 300], [960.5, 540.5, 153.5, 20]];

// Every pattern is 1920 by 1080 in the file unless it says otherwise. `ref` names the file's render per colour.
// How a pattern meets a new frame:
//   repeat  rebuilt from its rule to fill the frame (Logo field, Lattice, Ring, Tessellation)
//   field   a field larger than any frame, kept centred (Mirror, Window open, Soft Glass wide)
//   frame   a composition: edge pieces stay on the edges, the centre stays centred, and it scales down only as
//           far as it must so nothing runs into anything else (Window, Window tall, Window layered, Ring burst, Soft Glass)
// Portrait frames turn the composition a quarter turn, as the Ring patterns turn halves; Soft Glass, whose centre is
// the whole logomark, stays upright and fits instead. The logomark in Logo field is always upright.
export const GLASS_PATTERNS = [
  { id: 'logo-field', name: 'Logo field', group: 'Fields', variant: 'Logo field', frame: '101–105', colour: 'blue', wave: true, logo: true, edgeFade: true, glass: G(35, 80, 50, 0.1, true),
    adapt: 'repeat', gen: logoColumns, ref: { pale: 'pat101', blue: 'pat102', orange: 'pat103', lavender: 'pat104', forest: 'pat105' } },
  { id: 'mirror', name: 'Mirror', group: 'Fields', variant: 'Mirror', frame: '113', colour: 'blue', wave: true, ells: ELL, vig: VIG, glass: G(4, 75, 69, 0.2), adapt: 'field', base: [layer([at('p30', 0, 0)])], ref: { blue: 'pat113' } },
  { id: 'lattice', name: 'Lattice', group: 'Fields', variant: 'Lattice', frame: '114', colour: 'orange', wave: true, ells: ELL, vig: VIG, glass: G(20, 46, 50, 0.1, true), adapt: 'repeat', gen: lattice, ref: { orange: 'pat114' } },
  { id: 'soft-glass', name: 'Soft Glass', group: 'Soft Glass', variant: 'Standard', frame: '6.1', colour: 'pale', dw: 1375, dh: 880, wave: false, ells: [[687.6, 441, 505, 488.9]], vig: [688.1, 439.5, 1031.5], vigTop: true, glass: G(28.5, 64.4, 50, 0.15),
    adapt: 'frame', portrait: 'fit', base: [layer([at('p31', 0, 110.9)]), layer([at('p32', 1116.4, 110.9)]), layer([together(at('p33', 239.4, 0), at('p34', 239.4, 0))])], ref: { pale: 'patglass61' } },
  { id: 'soft-glass-wide', name: 'Soft Glass, wide', group: 'Soft Glass', variant: 'Wide', frame: '110', colour: 'orange', wave: true, ells: ELL, vig: VIG, glass: G(80, 79, 49, 0.2),
    adapt: 'field', base: [layer(['p20', 'p21', 'p22', 'p23', 'p24', 'p25', 'p26', 'p27', 'p28', 'p29'].map((p) => at(p, 0, 146)))], ref: { orange: 'pat110' } },
  { id: 'window', name: 'Window', group: 'Window', variant: 'Standard', frame: '109', colour: 'blue', wave: true, ells: ELL, vig: VIG_WIDE, glass: G(35, 79, 50, 0.12),
    adapt: 'frame', base: [layer([at('p16', 420, 0), at('p17', 420, 781)]), layer([at('p18', 1522.7, 107.8), at('p19', 0, 107.8)])], ref: { blue: 'pat109' } },
  { id: 'window-tall', name: 'Window, tall', group: 'Window', variant: 'Tall', frame: '108', colour: 'lavender', wave: true, ells: ELL, vig: VIG_WIDE, glass: G(35, 79, 50, 0.12),
    adapt: 'frame', base: [layer([at('p13', 420, 0), at('p14', 420, 808)]), layer([at('p15', 1486, 136), at('p5', 62, 136)])], ref: { lavender: 'pat108' } },
  { id: 'window-deep', name: 'Window, layered', group: 'Window', variant: 'Layered', frame: '107', colour: 'forest', wave: true, ells: [[959.5, 540.5, 481.5, 600]], vig: VIG_WIDE, vigTop: true, glass: G(35, 79, 50, 0.12),
    adapt: 'frame', base: [layer([at('p5', 1558, 137.1), at('p6', 0, 135.1)]), layer([at('p7', 1285, 1), at('p8', 271.4, 0)]), layer([at('p9', 1836, 291.7), at('p10', 0, 289.7)]), layer([at('p11', 419, 944), at('p12', 421, 0)])], ref: { forest: 'pat107' } },
  { id: 'window-open', name: 'Window, open', group: 'Window', variant: 'Open', frame: '106', colour: 'orange', wave: true, ells: ELL, vig: VIG, glass: G(4, 75, 69, 0.2), adapt: 'field', base: [layer([at('p4', 0, 0)])], ref: { orange: 'pat106' } },
  { id: 'ring', name: 'Ring', group: 'Ring', variant: 'Standard', frame: '115', colour: 'lavender', wave: true, ells: ELL, vig: VIG_WIDE, glass: G(23, 53, 50, 0.1, true), adapt: 'repeat', gen: ring, ref: { lavender: 'pat115' } },
  { id: 'ring-burst', name: 'Ring, burst', group: 'Ring', variant: 'Burst', frame: '116', colour: 'forest', wave: true, ells: ELL, vig: VIG_WIDE, glass: G(22, 49, 50, 0.1, true), adapt: 'frame',
    base: [layer([together(half('L', 625.7, 205.9, 309.1, 668.1), half('R', 984.7, 205.9, 309.1, 668.1), half('D', 625.7, 915.4, 668.1, 309.1), half('U', 625.7, -144.7, 668.1, 309.1), half('R', 1335.3, 205.9, 309.1, 668.1), half('L', 275.2, 205.9, 309.1, 668.1))]),
      layer([half('L', -30, 302.4, 219.7, 474.9), half('R', 1729.8, 302.4, 219.7, 474.9), diag('UL', 92, -327.9, 491.2, 219.7, 474.9), diag('UR', 1336.4, -327.9, 491.2, 219.7, 474.9), diag('DL', 92, 916.5, 491.2, 219.7, 474.9), diag('DR', 1336.4, 916.5, 491.2, 219.7, 474.9)], [15 / 22, 35 / 49])], ref: { forest: 'pat116' } },
  { id: 'tessellation', name: 'Tessellation', group: 'Tessellation', variant: 'Small', frame: '111', colour: 'orange', wave: false, topWave: true, hot: true, inner: 1, light: [28, 100], ells: TESS_ELL, vig: VIG, glass: G(4, 100, 47, 0.04),
    adapt: 'repeat', gen: tiles(-19.4, -23.7, 104.1, 97.73, 109.1, 102.73), ref: { orange: 'pat111' } },
  { id: 'tessellation-large', name: 'Tessellation, large', group: 'Tessellation', variant: 'Large', frame: '112', colour: 'forest', wave: false, topWave: true, hot: true, inner: 1, light: [28, 100], ells: TESS_ELL, vig: VIG, glass: G(4, 100, 47, 0.04),
    adapt: 'repeat', gen: tiles(-72.6, -77.7, 253.8, 238.5, 258.8, 243.45), ref: { forest: 'pat112' } },
].map((p) => ({ dw: 1920, dh: 1080, ells: [], light: [-45, 80], portrait: 'turn', ...p }));

export const GLASS_GROUPS = [...new Set(GLASS_PATTERNS.map((p) => p.group))];
export const glassDefaults = (p) => ({ frost: p.glass.frost, depth: p.glass.depth, refraction: 100, dispersion: p.glass.disp, angle: p.light[0], light: p.light[1] });
// Which controls mean something for a pattern.
export const glassControls = (p) => ({ texture: !!(p.wave || p.topWave), logo: !!p.logo, fade: !!p.edgeFade });

/* ---------- Layout: a pattern in a frame ---------- */
// The frame in the design's own units: its short side is the design's height. Portrait frames are laid out
// as their landscape twin and turned, unless the pattern fits upright.
export function frameOf(p, W, H) {
  const S = p.dh;
  if (H <= W * 1.001) return { Tw: (S * W) / H, Th: S, turn: false };
  return p.portrait === 'fit' ? { Tw: S, Th: (S * H) / W, turn: false } : { Tw: (S * H) / W, Th: S, turn: true };
}
const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
function frameLayout(p, Tw, Th) {
  const W0 = p.dw, H0 = p.dh, items = p.base.flatMap((l, li) => l.shapes.map((s) => ({ s, li })));
  const side = (c, B) => (c < B / 3 ? 0 : c > (2 * B) / 3 ? 2 : 1);
  const place = (s, f, TW, TH) => {
    const [x0, y0, x1, y1] = s.box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ax = side(cx, W0), ay = side(cy, H0);
    const nx = ax === 0 ? cx * f : ax === 2 ? TW - (W0 - cx) * f : TW / 2 + (cx - W0 / 2) * f;
    const ny = ay === 0 ? cy * f : ay === 2 ? TH - (H0 - cy) * f : TH / 2 + (cy - H0 / 2) * f;
    const hw = ((x1 - x0) / 2) * f, hh = ((y1 - y0) / 2) * f;
    return { cx, cy, nx, ny, f, g: ax * 3 + ay, box: [nx - hw, ny - hh, nx + hw, ny + hh] };
  };
  // The largest scale at which no two pieces overlap more than they do in the file.
  const orig = items.map((e) => place(e.s, 1, W0, H0));
  let f = 1;
  if (Tw < W0 - 0.5 || Th < H0 - 0.5) {
    for (f = 1; f > 0.5; f -= 0.01) {
      const P2 = items.map((e) => place(e.s, f, Tw, Th)); let ok = true;
      for (let i = 0; ok && i < P2.length; i++) for (let j = i + 1; ok && j < P2.length; j++) if (P2[i].g !== P2[j].g && overlap(P2[i].box, P2[j].box) > overlap(orig[i].box, orig[j].box) * f * f + 4) ok = false;
      if (ok) break;
    }
  }
  const layers = p.base.map((l) => ({ k: l.k, items: [] }));
  items.forEach((e) => { const q = place(e.s, f, Tw, Th); layers[e.li].items.push({ s: e.s, ...q }); });
  return { layers, f, shift: [Tw / 2 - (W0 / 2) * 1, Th / 2 - (H0 / 2) * 1] };
}
export function layoutOf(p, Tw, Th) {
  const shift = [(Tw - p.dw) / 2, (Th - p.dh) / 2];
  if (p.adapt === 'frame') { const r = frameLayout(p, Tw, Th); return { layers: r.layers, f: r.f, shift }; }
  const src = p.adapt === 'repeat' ? p.gen(Tw, Th) : p.base, d = p.adapt === 'repeat' ? [0, 0] : shift;
  return { f: 1, shift, layers: src.map((l) => ({ k: l.k, items: l.shapes.map((s) => { const cx = (s.box[0] + s.box[2]) / 2, cy = (s.box[1] + s.box[3]) / 2; return { s, cx, cy, nx: cx + d[0], ny: cy + d[1], f: 1 }; }) })) };
}

/* ---------- Shaders ---------- */
const VS = `#version 300 es
in vec2 a; out vec2 v; void main(){ v=a*.5+.5; gl_Position=vec4(a,0.,1.); }`;
const HEAD = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
float hash(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
uniform vec2 uRes,uD; uniform vec3 uView; uniform float uTurn;
vec2 px(){ return vec2(v.x,1.-v.y)*uRes; }
vec2 design(){ vec2 q=(px()-uRes*.5)/uView.z; if(uTurn>.5) q=vec2(-q.y,q.x); return q+uView.xy; }
uniform sampler2D uWave; uniform vec3 uDark,uLight; uniform float uTex;
float waveT(vec2 d){ return texture(uWave,vec2((d.x-uD.x*.5)/1920.+.5,.5-(d.y-uD.y*.5)/1080.)).r; }
vec3 wave(vec2 d){ return mix(uDark,uLight,mix(.5,waveT(d),uTex)); }
`;
const FS_BG = HEAD + `
uniform float uWaveOn,uGrain,uVigFirst; uniform vec3 uBg,uEllCol; uniform vec4 uEll[3]; uniform int uEllN; uniform vec4 uVig;
float i0e(float x){ if(x<3.75){ float t=x/3.75; t*=t; return (1.+t*(3.5156229+t*(3.0899424+t*(1.2067492+t*(.2659732+t*(.0360768+t*.0045813))))))*exp(-x); }
  float t=3.75/x; return (.39894228+t*(.01328592+t*(.00225319+t*(-.00157565+t*(.00916281+t*(-.02057706+t*(.02635537+t*(-.01647633+t*.00392377))))))))/sqrt(x); }
// A disc of radius r blurred by a gaussian of deviation 1: its alpha at distance x from the centre.
float disc(float x,float r){ float s=0.; const int N=28; float h=r/float(N); for(int i=0;i<N;i++){ float u=(float(i)+.5)*h; s+=u*exp(-.5*(x-u)*(x-u))*i0e(x*u); } return clamp(s*h,0.,1.); }
void main(){ vec2 d=design(); vec3 c=uBg; if(uWaveOn>.5) c=wave(d);
  float n=hash(floor(d*1.6)); float vg=clamp(length(d-uVig.xy)/uVig.z,0.,1.);
  if(uVig.w>.5&&uVigFirst>.5) c=mix(c,vec3(1.),vg);
  for(int i=0;i<3;i++){ if(i>=uEllN) break; vec4 e=uEll[i]; float a=disc(length(d-e.xy)/e.w,e.z/e.w); c=mix(c,mix(uEllCol,vec3(1.),.15*uGrain*n),a); }
  if(uVig.w>.5&&uVigFirst<.5) c=mix(c,vec3(1.),vg);
  o=vec4(c,1.); }`;
const FS_BLUR = `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D uSrc; uniform vec2 uDir;
void main(){ vec4 s=vec4(0.); float w=0.; for(int i=-16;i<=16;i++){ float k=exp(-.5*pow(float(i)*.1875,2.)); s+=texture(uSrc,v+uDir*float(i))*k; w+=k; } o=s/w; }`;
const FS_GLASS = `#version 300 es
precision highp float; in vec2 v; out vec4 o;
uniform sampler2D uBase,uFrost,uH,uMask; uniform vec2 uPx,uL; uniform float uDepth,uRefr,uDisp,uDisp0,uLightI,uLighten,uInner,uS; uniform vec4 uFill;
void main(){ vec4 base=texture(uBase,v); float m=texture(uMask,v).r; if(m<.003){ o=base; return; }
  float st=max(1.,uDepth*.08); vec2 e=uPx*st;
  float h=texture(uH,v).r;
  vec2 g=vec2(texture(uH,v+vec2(e.x,0.)).r-texture(uH,v-vec2(e.x,0.)).r, texture(uH,v+vec2(0.,e.y)).r-texture(uH,v-vec2(0.,e.y)).r);
  float gl=length(g); vec2 n=gl>1e-5?g/gl:vec2(0.);            // points into the glass
  float t=clamp((h-.5)*2.,0.,1.), bend=(1.-t)*(1.-t);
  vec2 off=-n*bend*uRefr*uDepth*.4;                          // the bevel shows what lies outside it
   float sp=uDisp*uDisp*1.6; vec2 split=off*sp-n*bend*uDepth*8.*pow(max(0.,uDisp-uDisp0)/max(.05,1.-uDisp0),1.3);   // past the file's values the colours part clearly
  vec3 c=vec3(texture(uFrost,v+(off+split)*uPx).r, texture(uFrost,v+off*uPx).g, texture(uFrost,v+(off-split)*uPx).b);
  vec3 f=uFill.rgb; c=mix(c,mix(f,max(c,f),uLighten),uFill.a);
  float face=dot(n,vec2(uL.x,-uL.y));
  float rim=m*(1.-texture(uMask,v-n*uPx*1.2*uS).r);           // a hairline on the edge
  float lit=smoothstep(-.7,.9,-face);                           // edges that face the light
  float spec=uLightI*(.12+1.05*lit);
  c=mix(c,vec3(1.),clamp(rim*spec*.8,0.,1.));
  c=mix(c,vec3(1.),uLightI*.22*bend*bend*lit);                 // a soft sheen on the lit bevel                           // a soft sheen on the lit side
  if(uInner>0.){ float mb=textureLod(uMask,v,log2(6.*uS)).r; c=mix(c,vec3(1.),uInner*.5*clamp((1.-mb)*1.8,0.,1.)); }
  o=vec4(mix(base.rgb,c,m),1.); }`;
const FS_POST = HEAD + `
uniform sampler2D uSrc,uLogo; uniform vec4 uVig; uniform float uLogoMode,uEdge,uTop,uGrain;
float erf(float x){ float s=sign(x); x=abs(x); float t=1./(1.+.3275911*x); return s*(1.-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*exp(-x*x)); }
float box(float x,float a,float b,float sd){ return .5*(erf((x-a)/(1.41421*sd))-erf((x-b)/(1.41421*sd))); }
float sl(float b,float s){ float D=b<=.25?((16.*b-12.)*b+4.)*b:sqrt(b); return s<=.5?b-(1.-2.*s)*b*(1.-b):b+(2.*s-1.)*(D-b); }
vec3 soft(vec3 b,vec3 s){ return vec3(sl(b.r,s.r),sl(b.g,s.g),sl(b.b,s.b)); }
void main(){ vec3 c=texture(uSrc,v).rgb; vec2 d=design();
  if(uVig.w>.5) c=mix(c,vec3(1.),clamp(length(d-uVig.xy)/uVig.z,0.,1.));
  vec3 off=vec3(.984,.980,.961);
  if(uLogoMode>.5){ float m=texture(uLogo,v).r; c=mix(c,uLogoMode>1.5?soft(c,off):off,m); }
  if(uEdge>.5){ float a=box(d.x,-89.,uD.x+88.,80.)*box(d.y,-85.,uD.y+85.,80.)-box(d.x,81.,uD.x-82.,80.)*box(d.y,85.,uD.y-85.,80.); c=mix(c,vec3(.988,.980,.961),clamp(a,0.,1.)); }
  if(uTop>.5) c=soft(c,vec3(mix(.5,mix(.46,.82,waveT(d)),uTex)));
  float g=hash(floor(d*1.4)+7.)-.5; c+=g*.045*uGrain*(1.-.6*dot(c,vec3(.333)));   // film grain, finer on light ground
  c+=(hash(px())-.5)/255.;
  o=vec4(c,1.); }`;

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const paths = {};
const pathOf = (k) => (paths[k] ??= new Path2D(P[k]));

export function createGlass(canvas, waveImage, markPaths) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) return null;
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
  const vs = compile(gl.VERTEX_SHADER, VS);
  const program = (fs) => { const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link'); const u = {}; return { p, u: (n) => (u[n] ??= gl.getUniformLocation(p, n)) }; };
  const PR = { bg: program(FS_BG), blur: program(FS_BLUR), glass: program(FS_GLASS), post: program(FS_POST) };
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const tex = (mip, wrap = gl.CLAMP_TO_EDGE) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap); return t; };
  const wave = tex(true, gl.MIRRORED_REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, waveImage); gl.generateMipmap(gl.TEXTURE_2D);
  const targets = {};
  const target = (name, w, h, mip = false) => { const key = `${name}:${w}x${h}`; if (targets[key]) return targets[key]; const t = tex(mip); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); if (mip) gl.generateMipmap(gl.TEXTURE_2D); return (targets[key] = { tex: t, fbo, w, h }); };
  const use = (pr, to) => { gl.bindFramebuffer(gl.FRAMEBUFFER, to ? to.fbo : null); gl.viewport(0, 0, to ? to.w : canvas.width, to ? to.h : canvas.height); gl.useProgram(pr.p); };
  const bind = (pr, name, unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.u(name), unit); };
  const draw = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
  // A gaussian blur in two passes, run at a reduced size when the blur is wide. The source needs mipmaps.
  const blur = (src, W, H, sd, name) => {
    if (sd < 0.35) return src;
    const step = (3 * sd) / 16, ds = Math.max(1, Math.min(8, Math.round(step))), w = Math.ceil(W / ds), h = Math.ceil(H / ds), a = target(name + 'a', w, h), b = target(name + 'b', w, h), pr = PR.blur;
    use(pr, a); bind(pr, 'uSrc', 0, src); gl.uniform2f(pr.u('uDir'), step / W, 0); draw();
    use(pr, b); bind(pr, 'uSrc', 0, a.tex); gl.uniform2f(pr.u('uDir'), 0, step / H); draw();
    return b.tex;
  };

  let maskKey = '', masks = [], logoMask = null;
  const scratch = document.createElement('canvas');
  const toScreen = (c, view, W, H) => view.turn ? c.setTransform(0, -view.s, view.s, 0, W / 2 - view.s * view.cy, H / 2 + view.s * view.cx) : c.setTransform(view.s, 0, 0, view.s, W / 2 - view.cx * view.s, H / 2 - view.cy * view.s);
  const upload = (into) => { const t = into ?? tex(true); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, scratch); gl.generateMipmap(gl.TEXTURE_2D); return t; };
  const clear = (W, H) => { scratch.width = W; scratch.height = H; const c = scratch.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; return c; };
  const raster = (W, H, view, items, into) => {
    const c = clear(W, H);
    for (const it of items) { toScreen(c, view, W, H); c.translate(it.nx, it.ny); c.scale(it.f, it.f); c.translate(-it.cx, -it.cy); it.s.draw(c); }
    return upload(into);
  };
  // The logomark stays upright whichever way the pattern turns.
  const rasterMark = (W, H, view, d, into) => {
    const c = clear(W, H), k = (247 / 207) * view.s;
    const X = view.turn ? W / 2 + view.s * (d[1] - view.cy) : W / 2 + view.s * (d[0] - view.cx), Y = view.turn ? H / 2 - view.s * (d[0] - view.cx) : H / 2 + view.s * (d[1] - view.cy);
    c.setTransform(k, 0, 0, k, X - 102.5 * k, Y - 103.5 * k); for (const m of markPaths) c.fill(new Path2D(m));
    return upload(into);
  };

  function render(o) {
    const W = canvas.width, H = canvas.height, pat = o.pattern, col = o.colour, g = o.glass;
    const fr = frameOf(pat, W, H), { Tw, Th, turn } = fr;
    const s = ((turn ? H : W) / Tw) * o.zoom;
    // Move across and down shift the pattern by up to a quarter of the frame, at any zoom.
    const view = { s, turn, cx: Tw / 2 + (turn ? o.panY : -o.panX) * 0.25 * Tw, cy: Th / 2 - (turn ? o.panX : o.panY) * 0.25 * Th };
    const key = [pat.id, W, H, s.toFixed(4), view.cx.toFixed(1), view.cy.toFixed(1), turn].join('|');
    const lay = layoutOf(pat, Tw, Th);
    if (key !== maskKey) {
      lay.layers.forEach((l, i) => { masks[i] = raster(W, H, view, l.items, masks[i]); });
      if (pat.logo) logoMask = rasterMark(W, H, view, [Tw / 2, Th / 2], logoMask);
      maskKey = key;
    }
    const common = (pr) => { gl.uniform2f(pr.u('uRes'), W, H); gl.uniform2f(pr.u('uD'), Tw, Th); gl.uniform1f(pr.u('uTurn'), turn ? 1 : 0); gl.uniform3f(pr.u('uView'), view.cx, view.cy, s); bind(pr, 'uWave', 7, wave); gl.uniform3fv(pr.u('uDark'), rgb(col.wave[0])); gl.uniform3fv(pr.u('uLight'), rgb(col.wave[1])); gl.uniform1f(pr.u('uTex'), o.texture); };
    let A = target('A', W, H, true), B = target('B', W, H, true);
    // 1. The colour field: wavefield, blurred colour, fade to white. It follows the composition's scale.
    let pr = PR.bg; use(pr, A); common(pr);
    gl.uniform1f(pr.u('uWaveOn'), pat.wave ? 1 : 0); gl.uniform1f(pr.u('uGrain'), o.grain); gl.uniform3fv(pr.u('uBg'), rgb('#FBFAF5')); gl.uniform3fv(pr.u('uEllCol'), rgb(pat.hot ? col.hot : col.ell));
    const ells = new Float32Array(12), F = lay.f;
    pat.ells.forEach((e, i) => ells.set([Tw / 2 + (e[0] - pat.dw / 2) * F, Th / 2 + (e[1] - pat.dh / 2) * F, e[2] * F, e[3] * 0.4 * F], i * 4));
    gl.uniform4fv(pr.u('uEll'), ells); gl.uniform1i(pr.u('uEllN'), pat.ells.length);
    const v0 = pat.vig ?? [0, 0, 1], vr = v0[2] * Math.hypot(Tw, Th) / Math.hypot(pat.dw, pat.dh), vig = [Tw / 2 + v0[0] - pat.dw / 2, Th / 2 + v0[1] - pat.dh / 2, vr];
    gl.uniform4f(pr.u('uVig'), vig[0], vig[1], vig[2], pat.vig && !pat.vigTop ? 1 : 0); gl.uniform1f(pr.u('uVigFirst'), pat.topWave ? 1 : 0); draw();
    // 2. Each glass layer, in the file's order, over everything beneath it.
    const rad = (g.angle * Math.PI) / 180, L = [-Math.cos(rad + Math.PI / 2), -Math.sin(rad + Math.PI / 2)];
    lay.layers.forEach((l, i) => {
      const k = l.k ?? [1, 1], sf = s * F, frost = g.frost * k[0] * sf, depth = Math.max(1, g.depth * k[1] * sf);
      gl.bindTexture(gl.TEXTURE_2D, A.tex); gl.generateMipmap(gl.TEXTURE_2D);
      const hgt = blur(masks[i], W, H, depth / 2, 'h'), fro = blur(A.tex, W, H, frost * 0.45, 'f');
      pr = PR.glass; use(pr, B);
      bind(pr, 'uBase', 0, A.tex); bind(pr, 'uFrost', 1, fro); bind(pr, 'uH', 2, hgt); bind(pr, 'uMask', 3, masks[i]);
      gl.uniform2f(pr.u('uPx'), 1 / W, 1 / H); gl.uniform2f(pr.u('uL'), L[0], L[1]);
      gl.uniform1f(pr.u('uDepth'), depth); gl.uniform1f(pr.u('uRefr'), g.refraction <= 100 ? g.refraction / 100 : 1 + 9 * ((g.refraction - 100) / 100) ** 1.5); gl.uniform1f(pr.u('uDisp'), g.dispersion / 100); gl.uniform1f(pr.u('uDisp0'), pat.glass.disp / 100); gl.uniform1f(pr.u('uLightI'), g.light / 100);
      gl.uniform1f(pr.u('uLighten'), pat.glass.lighten ? 1 : 0); gl.uniform1f(pr.u('uInner'), pat.inner ?? 0); gl.uniform1f(pr.u('uS'), Math.max(1, sf));
      const ff = pat.glass.frost, fill0 = pat.glass.fill * (pat.glass.lighten ? 1 : 0.4), milk = g.frost <= ff ? fill0 * (ff > 0 ? g.frost / ff : 1) : fill0 + (0.5 - fill0) * ((g.frost - ff) / Math.max(1, 100 - ff)) ** 1.2;
      gl.uniform4f(pr.u('uFill'), 0.984, 0.98, 0.961, Math.min(0.8, milk)); draw();
      [A, B] = [B, A];
    });
    // 3. What sits on top: the fade, the logomark, the texture, the grain, and to the screen.
    pr = PR.post; use(pr, null); common(pr); bind(pr, 'uSrc', 0, A.tex); bind(pr, 'uLogo', 1, logoMask ?? masks[0]);
    gl.uniform4f(pr.u('uVig'), vig[0], vig[1], vig[2], pat.vig && pat.vigTop ? 1 : 0); gl.uniform1f(pr.u('uGrain'), o.grain);
    gl.uniform1f(pr.u('uLogoMode'), pat.logo && o.logo ? (col.id === 'pale' ? 1 : 2) : 0); gl.uniform1f(pr.u('uEdge'), pat.edgeFade && o.fade ? 1 : 0); gl.uniform1f(pr.u('uTop'), pat.topWave ? 1 : 0); draw();
  }
  return { render, dispose: () => { gl.getExtension('WEBGL_lose_context')?.loseContext(); } };
}

let waveCache = null;
export const loadWave = (src) => (waveCache ??= new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => bad(new Error('wave')); im.src = src; }));

// Render once at any size, for export.
export async function renderGlass(opts, w, h, waveSrc, markPaths) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const r = createGlass(c, await loadWave(waveSrc), markPaths); if (!r) throw new Error('WebGL is not available');
  r.render(opts);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
  r.dispose(); return blob;
}

/* ---------- Shared with layouts and slides ---------- */
// A pattern's name as one line: "Window · Tall", "Logo field", "Soft Glass".
export const glassLabel = (p) => (p.variant === 'Standard' ? p.group : p.group === 'Fields' ? p.variant : `${p.group} · ${p.variant}`);
const clamp = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
// Render options from a pattern, a colourway and the Glass tool's settings (any of them may be missing).
export function glassOpts(patId, colourId, s = {}) {
  const pattern = GLASS_PATTERNS.find((p) => p.id === patId) ?? GLASS_PATTERNS[0];
  const colour = GLASS_COLOURS.find((c) => c.id === colourId) ?? GLASS_COLOURS.find((c) => c.id === pattern.colour);
  const d = glassDefaults(pattern), g = (s && s.for === pattern.id && s.glass) || {}, own = s && s.for === pattern.id ? s : {};
  return {
    pattern, colour,
    glass: { angle: clamp(g.angle, d.angle, -180, 180), light: clamp(g.light, d.light, 0, 100), refraction: clamp(g.refraction, d.refraction, 0, 200), depth: clamp(g.depth, d.depth, 1, 200), dispersion: clamp(g.dispersion, d.dispersion, 0, 100), frost: clamp(g.frost, d.frost, 0, 100) },
    texture: clamp(own.texture, 1, 0, 1), grain: clamp(own.grain, 1, 0, 1), zoom: clamp(own.zoom, 1, 1, 3), panX: clamp(own.panX, 0, -1, 1), panY: clamp(own.panY, 0, -1, 1), logo: own.logo !== false, fade: own.fade !== false,
  };
}
// The Glass tool's settings, as carried into a layout or slide. Only what the tool holds, checked.
export function cleanGlass(v) {
  const pattern = GLASS_PATTERNS.find((p) => p.id === v?.for); if (!pattern) return null;
  const o = glassOpts(pattern.id, null, v);
  return { for: pattern.id, glass: o.glass, texture: o.texture, grain: o.grain, zoom: o.zoom, panX: o.panX, panY: o.panY, logo: o.logo, fade: o.fade };
}
// One WebGL canvas makes every image a layout asks for, one at a time.
let shared = null, queue = Promise.resolve();
export function glassImage(opts, w, h, waveSrc, markPaths) {
  const run = async () => {
    const wave = await loadWave(waveSrc);
    if (!shared) { const c = document.createElement('canvas'); shared = { c, r: createGlass(c, wave, markPaths) }; }
    if (!shared.r) throw new Error('WebGL is not available');
    shared.c.width = Math.max(2, Math.round(w)); shared.c.height = Math.max(2, Math.round(h));
    shared.r.render(opts);
    return shared.c.toDataURL('image/jpeg', 0.93);
  };
  const job = queue.then(run, run); queue = job.catch(() => {}); return job;
}
