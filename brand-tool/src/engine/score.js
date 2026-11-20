// Score engine: music and sound design for a film, made from the film itself.
// The brand guideline has no rules for sound, so this does not invent any. It works the way a composer and a sound
// designer work to picture: it reads the film's timeline (each particle morph, each camera move, each cue the
// overlay marks) and writes to it. Cuts and landings fall on the beat because the tempo is chosen so they do; sound
// that belongs to an image (a cloud of particles gathering, the camera rushing through it) is shaped by that image's
// own motion; the music's energy follows the film's arc. Everything is synthesised and mixed offline, so the same
// film always gives the same score and nothing is fetched from anywhere.
//
//   const wav = await renderScoreWav(film, { sampleRate: 48000 });   // ArrayBuffer, 16-bit stereo WAV
//   const plan = planScore(film);                                     // tempo, sections, hits: what will be played

import { styleOf } from './motionstyle.js';

/* ---------- Harmony ---------- */
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const MODES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10] };
const ROMAN = { i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6 };
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
function degreeOf(sym) { const m = String(sym).match(/^(b?)([ivIV]+)/); if (!m) return 0; return ROMAN[m[2].toLowerCase()] ?? 0; }
// A chord as scale degrees stacked in thirds, with colour (add9, 7) that keeps it open rather than sweet.
function chordNotes(root, mode, sym, colour = 'open') {
  const sc = MODES[mode] ?? MODES.minor, d = degreeOf(sym), at = (k) => root + sc[(d + k) % 7] + 12 * Math.floor((d + k) / 7);
  const base = [at(0), at(2), at(4)];
  if (colour === 'open') return [at(0), at(4), at(1) + 12, at(2) + 12]; // root, fifth, ninth, third above: wide and modern
  if (colour === 'seventh') return [...base, at(6)];
  return base;
}

/* ---------- The plan: what the score does, decided from the film ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

// Moments that matter to the picture: shot starts, morph landings, the overlay's cues.
export function momentsOf(film) {
  const p = film.particles, out = [], st = styleOf(film.style);
  if (p?.shots) [...p.shots].sort((a, b) => a.at - b.at).forEach((s, i) => {
    if (i > 0 || s.morph) out.push({ at: s.at, kind: 'launch', shot: i, dur: s.morph?.duration ?? st.timing.morph.median });
    if (s.morph) out.push({ at: s.at + (s.morph.duration ?? st.timing.morph.median), kind: 'land', shot: i, form: s.form ?? s.shape });
  });
  // Cuts the film declares: each lands on a sound, as in the references.
  for (const c of film.cuts ?? []) out.push({ at: typeof c === 'number' ? c : c.at, kind: 'cut' });
  for (const c of film.score?.cues ?? []) out.push({ ...c, kind: c.type ?? c.kind ?? 'hit' });
  return out.filter((m) => m.at >= 0 && m.at <= film.duration).sort((a, b) => a.at - b.at);
}

// The tempo at which the film's moments land closest to the grid (eighth notes), within a calm-to-moving range.
export function fitTempo(film, lo = 72, hi = 118) {
  const hard = momentsOf(film).filter((m) => m.kind !== 'launch' && m.kind !== 'whoosh' && m.kind !== 'riser');
  if (!hard.length) return { bpm: film.score?.tempo ?? 92, error: 0 };
  let best = { bpm: 92, error: Infinity };
  for (let bpm = lo; bpm <= hi; bpm += 0.5) {
    const step = 60 / bpm / 2;
    const err = hard.reduce((n, m) => { const r = m.at / step; return n + Math.abs(r - Math.round(r)) * step; }, 0) / hard.length;
    if (err < best.error - 1e-4) best = { bpm, error: err };
  }
  return best;
}

export function planScore(film) {
  const s = film.score ?? {}, D = film.duration;
  const st = styleOf(film.style), driven = (s.beat ?? st.sound.beat) === 'driven';
  const tempo = s.tempo ?? fitTempo(film, s.tempoRange?.[0] ?? st.sound.tempo[0], s.tempoRange?.[1] ?? st.sound.tempo[1]).bpm;
  const beat = 60 / tempo, bar = beat * 4;
  const mode = s.mode ?? 'minor', root = 12 * 4 + (NOTE[s.key ?? 'D'] ?? 2); // octave 3 root, e.g. D3
  const moments = momentsOf(film);
  // Energy over time: given by sections, else rising to the film's last landing before the end, then settling.
  const climaxAt = s.climax ?? (moments.filter((m) => m.kind === 'land').slice(-2, -1)[0]?.at ?? D * 0.7);
  const energy = (t) => {
    if (s.sections?.length) { const sec = [...s.sections].sort((a, b) => a.at - b.at); let i = 0; while (i < sec.length - 1 && sec[i + 1].at <= t) i++; const A = sec[i], B = sec[i + 1]; return B ? A.energy + (B.energy - A.energy) * ease(clamp((t - A.at) / (B.at - A.at))) * (B.ramp === false ? 0 : 1) : A.energy; }
    if (t < climaxAt) return 0.15 + 0.7 * ease(clamp(t / climaxAt)); return 0.85 - 0.55 * ease(clamp((t - climaxAt) / Math.max(1, D - climaxAt)));
  };
  // Harmony changes on the bar, and also where the picture lands, so a new form arrives with a new chord.
  const prog = s.progression ?? (mode === 'major' || mode === 'lydian' ? ['I', 'V', 'vi', 'IV'] : ['i', 'VI', 'III', 'VII']);
  // Picture moments keep their exact time: the tempo is chosen to sit close to them, and a hit is never moved off its image.
  const lands = moments.filter((m) => m.kind === 'land' || m.kind === 'hit' || m.kind === 'cut').map((m) => m.at);
  const changes = [0, ...lands].filter((t, i, a) => t < D - 0.5 && (i === 0 || t - a[i - 1] > bar * 0.75));
  for (let t = bar * 2; t < D; t += bar * 2) if (!changes.some((c) => Math.abs(c - t) < bar)) changes.push(t);
  changes.sort((a, b) => a - b);
  const finalAt = s.resolveAt ?? (moments.filter((m) => m.kind === 'land' || m.kind === 'resolve').slice(-1)[0]?.at ?? D - bar);
  const chords = changes.map((t, i) => ({ at: t, sym: t >= finalAt - 0.01 ? prog[0] : prog[i % prog.length] }));
  if (!chords.some((c) => Math.abs(c.at - finalAt) < beat)) chords.push({ at: finalAt, sym: prog[0] });
  chords.sort((a, b) => a.at - b.at);
  const base = driven ? DRIVEN_PALETTE : DEFAULT_PALETTE;
  return { tempo, beat, bar, root, mode, chords, moments, energy, duration: D, palette: { ...base, ...(s.palette ?? {}) }, camera: film.particles?.camera ?? [], finalAt, driven, style: film.style ?? 'launch', lufs: st.sound.lufs, beatFrom: s.beatFrom ?? 0 };
}

// Starting points for the sound, per layer. A film can turn any of these down (0) or up.
export const DEFAULT_PALETTE = { pad: 0.55, bass: 0.5, bells: 0.45, pulse: 0.35, texture: 0.5, air: 0.35, hits: 0.6, reverb: 0.32, drums: 0, sfx: 0.5 };
// The launch style's sound, after the references: a driving beat from the first bar (kick on every beat, clap on 2
// and 4, offbeat hats), a pumping bass, chords that duck under the kick, and a sound effect on nearly every action.
export const DRIVEN_PALETTE = { pad: 0.45, bass: 0.6, bells: 0.4, pulse: 0, texture: 0.4, air: 0.3, hits: 0.6, reverb: 0.22, drums: 0.7, sfx: 0.75 };

/* ---------- Synthesis (OfflineAudioContext) ---------- */
const rngOf = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function impulse(ctx, seconds = 3.2, decay = 2.6, seed = 5) {
  const r = rngOf(seed), n = Math.round(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < n; i++) { const t = i / n; d[i] = (r() * 2 - 1) * (1 - t) ** decay * (t < 0.002 ? t / 0.002 : 1); } }
  return buf;
}
function noiseBuffer(ctx, seconds, seed) { const r = rngOf(seed), n = Math.round(ctx.sampleRate * seconds), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; return b; }

// Where the beat starts: the first bar line at or after 0 (the film can start its beat later with score.beatFrom).
const s0 = (plan) => plan.beatFrom ?? 0;
function camSpeed(keys, t, style) {
  // How fast the camera is moving at t, from its keys (same interpolation as the particle engine), 0 to about 1.
  if (!keys?.length) return 0;
  const pos = (x) => { let i = 0; while (i < keys.length - 1 && keys[i + 1].at <= x) i++; const A = keys[i], B = keys[Math.min(i + 1, keys.length - 1)], sp = B.at - A.at, u = B.cut ? 0 : sp > 0 ? ease(clamp((x - A.at) / sp)) : 0, L = (f, d) => (A[f] ?? d) + ((B[f] ?? A[f] ?? d) - (A[f] ?? d)) * u; const az = L('az', 0) * Math.PI / 180, el = L('el', 10) * Math.PI / 180, r = L('dist', 3); return [r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az)]; };
  // A camera cut is a jump, not a move: it gets its own sound on the cut, not a whoosh.
  if (keys.some((k) => k.cut && k.at > t - 0.05 && k.at <= t + 0.05)) return 0;
  const a = pos(t - 0.05), b = pos(t + 0.05); return clamp(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.1 / 2.5);
}

export async function renderScore(film, { sampleRate = 48000 } = {}) {
  const plan = planScore(film), D = plan.duration + 2.5; // a tail for the last chord to ring out
  const ctx = new OfflineAudioContext(2, Math.round(D * sampleRate), sampleRate), P = plan.palette, rnd = rngOf(17);
  // Buses: dry and a reverb send, both into a gentle glue compressor.
  const master = ctx.createGain(); master.gain.value = 0.9;
  const glue = ctx.createDynamicsCompressor(); glue.threshold.value = -18; glue.ratio.value = 2.5; glue.attack.value = 0.02; glue.release.value = 0.25; glue.knee.value = 8;
  // Tone of the whole mix: rumble out below 32 Hz, low mids eased, a little air on top, so it stays clear on phone speakers.
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32; hp.Q.value = 0.7;
  const mud = ctx.createBiquadFilter(); mud.type = 'peaking'; mud.frequency.value = 220; mud.Q.value = 0.9; mud.gain.value = -3;
  const air = ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 6500; air.gain.value = 4;
  glue.connect(hp); hp.connect(mud); mud.connect(air); air.connect(master); master.connect(ctx.destination);
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx); const wet = ctx.createGain(); wet.gain.value = P.reverb; verb.connect(wet); wet.connect(glue);
  // Beds (pad, texture, air) dip briefly under every accent, so a tick or a landing is heard clearly over them.
  // The beds' level over time, drawn as one curve: dips under each accent, and (driven) a pump under each kick.
  const duck = ctx.createGain(); duck.connect(glue);
  const RATE = 200, curve = new Float32Array(Math.ceil(D * RATE)).fill(1);
  const dip = (t, depth, attack, release) => { for (let i = Math.max(0, Math.floor((t - attack) * RATE)); i < Math.min(curve.length, Math.ceil((t + release) * RATE)); i++) { const x = i / RATE, g = x < t ? 1 - (1 - depth) * (1 - (t - x) / attack) : 1 - (1 - depth) * (1 - (x - t) / release); curve[i] = Math.min(curve[i], g); } };
  const pump = (t) => { if (plan.driven) dip(t, 0.5, 0.004, plan.beat * 0.7); };
  // With a beat, the kick already pumps the beds; accents only need a light dip, or the beds swelling back reads as a second hit.
  for (const m of plan.moments) if (m.kind !== 'launch' && m.kind !== 'whoosh' && m.kind !== 'riser') dip(m.at, plan.driven ? 0.7 : 0.35, 0.03, plan.driven ? 0.15 : 0.4);
  const bed = (send = 0.5) => { const g = ctx.createGain(); g.connect(duck); const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(verb); return g; };
  const bus = (send = 0.5) => { const g = ctx.createGain(); g.connect(glue); const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(verb); return g; };
  const pan = (node, x) => { const p = ctx.createStereoPanner(); p.pan.value = x; node.connect(p); return p; };
  const chordAt = (t) => { let c = plan.chords[0]; for (const k of plan.chords) if (k.at <= t + 1e-6) c = k; return c; };
  const notesAt = (t) => chordNotes(plan.root, plan.mode, chordAt(t).sym);
  const E = plan.energy;

  // Pad: warm, slow, wide. Each chord is voiced open; filter opens with energy.
  if (P.pad > 0) {
    const out = bed(0.6), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4; lp.connect(out);
    for (let t = 0; t <= plan.duration; t += 0.25) lp.frequency.setValueAtTime(900 + 4200 * E(t) ** 1.2, t), lp.frequency.linearRampToValueAtTime(900 + 4200 * E(t + 0.25) ** 1.2, t + 0.25);
    plan.chords.forEach((c, i) => {
      // The root belongs to the bass; the pad sits above it, from the fifth up.
      const end = plan.chords[i + 1]?.at ?? plan.duration + 1.5, notes = chordNotes(plan.root, plan.mode, c.sym).map((m, k) => (k === 0 ? m + 12 : m));
      notes.forEach((m, k) => [-7, 6].forEach((det, j) => {
        const o = ctx.createOscillator(); o.type = k === 0 ? 'triangle' : 'sawtooth'; o.frequency.value = midiHz(m); o.detune.value = det + (rnd() - 0.5) * 3;
        const g = ctx.createGain(), peak = P.pad * 0.03;
        g.gain.setValueAtTime(0, c.at); g.gain.linearRampToValueAtTime(peak, c.at + 1.2); g.gain.setValueAtTime(peak, Math.max(c.at + 1.2, end - 0.2)); g.gain.linearRampToValueAtTime(0, end + 1.6);
        o.connect(g); pan(g, (k / 3 - 0.5) * 0.9 * (j ? 1 : -1)).connect(lp); o.start(c.at); o.stop(end + 1.7);
      }));
    });
  }
  // Bass: a sine an octave under the chord's root, there once the film has some weight.
  if (P.bass > 0) {
    const out = bus(0.1);
    plan.chords.forEach((c, i) => {
      const end = plan.chords[i + 1]?.at ?? plan.duration + 1, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.value = midiHz(chordNotes(plan.root, plan.mode, c.sym)[0] - 12);
      const lvl = (t) => P.bass * 0.11 * clamp((E(t) - 0.25) / 0.35);
      g.gain.setValueAtTime(0, c.at); g.gain.linearRampToValueAtTime(lvl(c.at + 0.5), c.at + 0.4);
      for (let t = c.at + 0.5; t < end; t += 0.5) g.gain.linearRampToValueAtTime(lvl(t), t);
      g.gain.linearRampToValueAtTime(0, end + 0.3); o.connect(g); g.connect(out); o.start(c.at); o.stop(end + 0.4);
    });
  }
  // Bells: struck FM tones on the grid, chord tones in a rising-and-falling figure; busier as energy rises.
  if (P.bells > 0) {
    const out = bus(0.75);
    const bell = (t, m, v, x) => {
      const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(), f = midiHz(m);
      car.frequency.value = f; mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2.2 * v, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.9);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(P.bells * 0.11 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0005, t + 2.4);
      mod.connect(mg); mg.connect(car.frequency); car.connect(g); pan(g, x).connect(out); car.start(t); mod.start(t); car.stop(t + 2.5); mod.stop(t + 2.5);
    };
    const figure = [0, 2, 1, 3, 2, 1];
    for (let k = 0, t = 0; t < plan.duration - 0.2; k++, t = k * plan.beat / 2) {
      const e = E(t), keep = e < 0.2 ? (k % 8 === 0) : e < 0.45 ? (k % 4 === 0) : e < 0.7 ? (k % 2 === 0) : true;
      if (!keep || rnd() > 0.35 + e) continue;
      const n = notesAt(t), m = n[figure[k % figure.length] % n.length] + 12 + (e > 0.6 && k % 8 === 7 ? 12 : 0);
      bell(t, m, 0.55 + 0.45 * rnd() * e + (k % 8 === 0 ? 0.2 : 0), Math.sin(k * 1.7) * 0.6);
      if (e > 0.5 && k % 4 === 0) bell(t + 0.012, m + 12, 0.35 * e, -Math.sin(k * 1.7) * 0.6); // a quiet octave above, for sparkle
    }
    // The last landing is marked by the tonic, high and clear.
    bell(plan.finalAt, plan.root + 24, 1, 0); bell(plan.finalAt + plan.beat / 2, plan.root + 31, 0.6, 0.3);
  }
  // Pulse: a soft low thump and a closed tick on the grid, only while the film is moving fast.
  if (P.pulse > 0) {
    const out = bus(0.15), nb = noiseBuffer(ctx, 0.2, 9);
    for (let k = 0, t = 0; t < plan.finalAt - 0.1; k++, t = k * plan.beat / 2) {
      const e = E(t);
      if (e > 0.55 && k % 4 === 0) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18); g.gain.setValueAtTime(P.pulse * 0.7 * clamp((e - 0.5) * 3), t); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.32); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.35); }
      if (e > 0.62 && k % 2 === 1) { const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nb; hp.type = 'highpass'; hp.frequency.value = 7000; g.gain.setValueAtTime(P.pulse * 0.08 * clamp((e - 0.6) * 3), t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.05); s.connect(hp); hp.connect(g); pan(g, k % 4 === 1 ? 0.25 : -0.25).connect(out); s.start(t); s.stop(t + 0.06); }
    }
  }
  // Drums (driven): kick on every beat, clap on 2 and 4, hats on the offbeats (sixteenths when energy is high).
  // Everything in the beds ducks under each kick, which is what makes it pump.
  if (plan.driven && P.drums > 0) {
    const out = bus(0.08), nb = noiseBuffer(ctx, 1, 55), start = s0(plan), stop = plan.finalAt;
    const dropAt = (t) => plan.moments.some((m) => m.kind === 'drop' && t >= m.at - 0.01 && t < m.at + (m.length ?? plan.beat));
    // A big hit gets a breath before it: the hats and bass leave the half beat before, so the hit lands clean.
    const hits = plan.moments.filter((m) => m.kind === 'hit').map((m) => m.at), gapAt = (t) => hits.some((h) => t > h - plan.beat / 2 - 0.01 && t < h - 0.005);
    for (let k = 0, t = start; t < stop - 0.05; k++, t = start + k * plan.beat / 4) {
      const pos = k % 16, e = E(t); if (dropAt(t)) continue;
      if (pos % 4 === 0) { // kick
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.11);
        g.gain.setValueAtTime(P.drums * 0.95, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.34);
        const c = ctx.createBufferSource(), cf = ctx.createBiquadFilter(), cg = ctx.createGain(); c.buffer = nb; cf.type = 'highpass'; cf.frequency.value = 2500; cg.gain.setValueAtTime(P.drums * 0.12, t); cg.gain.exponentialRampToValueAtTime(0.0005, t + 0.012); c.connect(cf); cf.connect(cg); cg.connect(out); c.start(t, (k * 0.013) % 0.9); c.stop(t + 0.015);
        pump(t);
      }
      if (pos === 4 || pos === 12) { // clap
        for (const d of [0, 0.011, 0.022]) { const c = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); c.buffer = nb; bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.9; g.gain.setValueAtTime(P.drums * 0.33 * clamp(0.4 + e), t + d); g.gain.exponentialRampToValueAtTime(0.0005, t + d + (d === 0.022 ? 0.16 : 0.01)); c.connect(bp); bp.connect(g); pan(g, 0.05).connect(out); c.start(t + d, (k * 0.031) % 0.8); c.stop(t + d + 0.18); }
      }
      if ((pos % 4 === 2 || (e > 0.6 && pos % 2 === 1)) && !gapAt(t)) { // hats
        const open = pos % 4 === 2, c = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); c.buffer = nb; hp.type = 'highpass'; hp.frequency.value = 8000;
        g.gain.setValueAtTime(P.drums * (open ? 0.12 : 0.06), t); g.gain.exponentialRampToValueAtTime(0.0005, t + (open ? 0.12 : 0.035)); c.connect(hp); hp.connect(g); pan(g, open ? 0.2 : -0.2).connect(out); c.start(t, (k * 0.017) % 0.8); c.stop(t + 0.14);
      }
    }
    // Bass on the eighths between kicks, following the chord's root.
    if (P.bass > 0) for (let k = 0, t = start + plan.beat / 2; t < stop - 0.05; k++, t = start + plan.beat / 2 + k * plan.beat) {
      if (dropAt(t) || gapAt(t)) continue;
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = midiHz(notesAt(t)[0] - 12); f.type = 'lowpass'; f.frequency.value = 380 + 500 * E(t); f.Q.value = 2;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(P.bass * 0.16, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + plan.beat * 0.45); o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + plan.beat * 0.5);
    }
  }
  // Sound effects: what a sound designer puts on each action. A whoosh peaks where a camera move or a morph is
  // fastest; a cut gets an impact; cues add pops, clicks and risers where the overlay does something.
  if (P.sfx > 0) {
    const out = bus(0.3), nb = noiseBuffer(ctx, 3, 63);
    const whoosh = (peak, len, v, dir = 1, from = 0) => {
      const t0 = Math.max(0, from, peak - len * 0.6), s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nb; bp.type = 'bandpass'; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(dir > 0 ? 500 : 3500, t0); bp.frequency.exponentialRampToValueAtTime(dir > 0 ? 3800 : 600, peak); bp.frequency.exponentialRampToValueAtTime(dir > 0 ? 1200 : 300, peak + len * 0.4);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(P.sfx * 0.22 * v, peak); g.gain.exponentialRampToValueAtTime(0.0001, peak + len * 0.4);
      const p2 = ctx.createStereoPanner(); p2.pan.setValueAtTime(-0.5 * dir, t0); p2.pan.linearRampToValueAtTime(0.5 * dir, peak + len * 0.4);
      s.connect(bp); bp.connect(g); g.connect(p2); p2.connect(out); s.start(t0, (peak * 0.37) % 2); s.stop(peak + len * 0.45);
    };
    const pop = (t, v) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(1250, t + 0.04); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(P.sfx * 0.45 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.12); o.connect(g); pan(g, 0.1).connect(out); o.start(t); o.stop(t + 0.14); };
    const click = (t, v) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = 2400; g.gain.setValueAtTime(P.sfx * 0.08 * v, t); g.gain.exponentialRampToValueAtTime(0.0003, t + 0.018); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.02); };
    const riser = (end, len, v) => { const t0 = Math.max(0, end - len), s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), o = ctx.createOscillator(), og = ctx.createGain(); s.buffer = nb; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 2; bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(6000, end); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(P.sfx * 0.14 * v, end - 0.07); g.gain.linearRampToValueAtTime(0, end - 0.03); o.type = 'sawtooth'; o.frequency.setValueAtTime(midiHz(plan.root), t0); o.frequency.exponentialRampToValueAtTime(midiHz(plan.root + 24), end); og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(P.sfx * 0.03 * v, end - 0.07); og.gain.linearRampToValueAtTime(0, end - 0.03); s.connect(bp); bp.connect(g); g.connect(out); o.connect(og); og.connect(out); s.start(t0); s.stop(end + 0.05); o.start(t0); o.stop(end + 0.05); };
    // Camera moves: one whoosh at each fast peak in the camera's speed.
    if (plan.camera.length) { let last = -9; for (let t = 0.05; t < plan.duration; t += 1 / 30) { const v = camSpeed(plan.camera, t, plan.style); if (v > 0.35 && v >= camSpeed(plan.camera, t - 1 / 30, plan.style) && v >= camSpeed(plan.camera, t + 1 / 30, plan.style) && t - last > 0.4) { whoosh(t, 0.55, Math.min(1, v), 1); last = t; } } }
    for (const m of plan.moments) {
      const v = m.strength ?? 1;
      // A morph's whoosh starts with the morph, never before it, so it cannot smear the cut it starts on.
      if (m.kind === 'launch' && m.dur) whoosh(m.at + m.dur * 0.3, Math.min(0.9, m.dur * 0.8), 0.7 * v, -1, m.at + 0.03);
      else if (m.kind === 'cut') { whoosh(m.at - 0.08, 0.3, 0.7 * v, 1); } // into the cut, leaving the cut itself to its impact
      else if (m.kind === 'whoosh') whoosh(m.at, m.length ?? 0.5, v, m.dir ?? 1);
      else if (m.kind === 'pop') pop(m.at, v);
      else if (m.kind === 'click') click(m.at, v);
      else if (m.kind === 'riser') riser(m.at, m.length ?? 1.5, v);
    }
  }
  // Texture from the particles: while a cloud is in flight, a shimmer of tiny tones whose density follows how many
  // particles are moving (peaking mid-morph) and whose pitch climbs as the form gathers; then it lands.
  if (P.texture > 0) {
    const out = bed(0.9), nb = noiseBuffer(ctx, 4, 21);
    const shots = [...(film.particles?.shots ?? [])].sort((a, b) => a.at - b.at);
    shots.forEach((s, i) => {
      if (!s.morph) return;
      const t0 = s.at, d = s.morph.duration ?? 2.5, flow = s.morph.flow ?? 0.35;
      const grains = Math.round(d * 70 * (0.5 + flow));
      for (let g = 0; g < grains; g++) {
        const u = rnd() ** 0.8, t = t0 + u * d, dens = Math.sin(Math.PI * ease(u)); if (rnd() > dens || t > t0 + d - 0.08) continue;
        const n = notesAt(t), m = n[Math.floor(rnd() * n.length)] + 24 + (u > 0.6 ? 12 : 0), o = ctx.createOscillator(), gg = ctx.createGain(), len = 0.03 + rnd() * 0.08;
        o.type = 'sine'; o.frequency.value = midiHz(m) * (1 + (rnd() - 0.5) * 0.004);
        gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(P.texture * 0.022 * (0.4 + dens), t + len * 0.3); gg.gain.exponentialRampToValueAtTime(0.0003, t + len + 0.25);
        o.connect(gg); pan(gg, rnd() * 1.6 - 0.8).connect(out); o.start(t); o.stop(t + len + 0.3);
      }
      // A breath of noise that rises with the gathering cloud.
      const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain(); src.buffer = nb; src.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(400, t0); bp.frequency.exponentialRampToValueAtTime(4200, t0 + d);
      ng.gain.setValueAtTime(0, t0); ng.gain.linearRampToValueAtTime(P.texture * 0.05 * (0.5 + flow), t0 + d * 0.7); ng.gain.linearRampToValueAtTime(0, t0 + d - 0.05); // gone just before the landing, so the landing is heard
      src.connect(bp); bp.connect(ng); ng.connect(out); src.start(t0); src.stop(t0 + d + 0.1);
    });
  }
  // Air: the camera's speed, heard as wind past the lens.
  if (P.air > 0 && plan.camera.length) {
    const out = bed(0.4), src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noiseBuffer(ctx, plan.duration + 1, 33); lp.type = 'lowpass'; lp.Q.value = 0.7;
    for (let t = 0; t <= plan.duration; t += 0.1) { const v = camSpeed(plan.camera, t); g.gain.linearRampToValueAtTime(P.air * 0.06 * v ** 1.5, t); lp.frequency.linearRampToValueAtTime(300 + 3500 * v, t); }
    src.connect(lp); lp.connect(g); g.connect(out); src.start(0); src.stop(plan.duration + 1);
  }
  // Hits: landings and the overlay's cues. A landing gets a low swell into a soft impact; "hit" a fuller impact;
  // "tick" a small struck sound for type; "resolve" the final chord; "drop" pulls everything out for a beat.
  if (P.hits > 0) {
    const out = bus(0.5), nb = noiseBuffer(ctx, 2, 41);
    const boom = (t, v) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.6); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(P.hits * 0.32 * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.1); o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.7); };
    // A reversed swell into the hit: quieter than the hit and gone just before it, so the hit itself is the attack.
    const swish = (t, v, len = plan.driven ? 0.35 : 0.6) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nb; f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(800, t - len); f.frequency.exponentialRampToValueAtTime(5000, t); g.gain.setValueAtTime(0, t - len); g.gain.linearRampToValueAtTime(P.hits * 0.05 * v, t - 0.06); g.gain.linearRampToValueAtTime(0, t - 0.025); s.connect(f); f.connect(g); g.connect(out); s.start(t - len); s.stop(t + 0.05); };
    const hitNear = (t) => plan.moments.some((m) => m.kind === 'hit' && Math.abs(m.at - t) < 0.12);
    // A crack: the sharp front of an impact, so the ear (and the eye) knows exactly when it lands.
    const crack = (t, v) => { const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nb; hp.type = 'highpass'; hp.frequency.value = 1800; g.gain.setValueAtTime(P.hits * 0.35 * v * (plan.driven ? 1.4 : 1), t); g.gain.exponentialRampToValueAtTime(0.0004, t + 0.05); s.connect(hp); hp.connect(g); g.connect(out); s.start(t, 0.7); s.stop(t + 0.06); };
    // A tick: a short struck tone in the chord with a click of noise on the front, so it reads as type landing.
    const tick = (t, v) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = midiHz(notesAt(t)[1] + 24);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(P.hits * 0.16 * v * (plan.driven ? 1.6 : 1), t + 0.003); g.gain.exponentialRampToValueAtTime(0.0004, t + 0.35); o.connect(g); pan(g, 0.15).connect(out); o.start(t); o.stop(t + 0.4);
      const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), ng = ctx.createGain(); s.buffer = nb; hp.type = 'highpass'; hp.frequency.value = 3500; ng.gain.setValueAtTime(P.hits * 0.12 * v, t); ng.gain.exponentialRampToValueAtTime(0.0004, t + 0.03); s.connect(hp); hp.connect(ng); ng.connect(out); s.start(t, 0.3); s.stop(t + 0.04);
    };
    for (const m of plan.moments) {
      const t = m.at, v = m.strength ?? 1;
      if (m.kind === 'land') { if (hitNear(t)) { tick(t, 0.5 * v); continue; } boom(t, 0.62 * v); swish(t, 0.75 * v); tick(t, 0.5 * v); crack(t, 0.6 * v); } // a hit on the landing carries it
      else if (m.kind === 'hit') { boom(t, v); swish(t, v); crack(t, v); }
      else if (m.kind === 'cut') { boom(t, 0.5 * v); tick(t, 0.7 * v); crack(t, 0.8 * v); }
      else if (m.kind === 'tick') tick(t, v);
      else if (m.kind === 'drop') { master.gain.setValueAtTime(0.9, t - 0.02); master.gain.linearRampToValueAtTime(0.25, t); master.gain.setValueAtTime(0.25, t + (m.length ?? plan.beat)); master.gain.linearRampToValueAtTime(0.9, t + (m.length ?? plan.beat) + 0.05); }
    }
  }
  // Ends: everything fades into the reverb after the last chord.
  master.gain.setValueAtTime(0.9, plan.duration - 0.2); master.gain.linearRampToValueAtTime(0, plan.duration + 2.2);
  duck.gain.setValueCurveAtTime(curve, 0, curve.length / RATE);
  const buf = await ctx.startRendering();
  return { buffer: buf, plan: { lufs: plan.lufs, driven: plan.driven, tempo: plan.tempo, beat: plan.beat, key: film.score?.key ?? 'D', mode: plan.mode, chords: plan.chords, moments: plan.moments.map((m) => ({ at: m.at, kind: m.kind })), climax: plan.finalAt } };
}

export function wavOf(buffer, seconds) {
  const ch = buffer.numberOfChannels, sr = buffer.sampleRate, n = Math.min(buffer.length, Math.round((seconds ?? buffer.length / sr) * sr));
  const ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab), w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, c) => buffer.getChannelData(c));
  for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < ch; c++, o += 2) v.setInt16(o, Math.max(-1, Math.min(1, data[c][i])) * 32767, true);
  return ab;
}
