// Motion styles for films made with the kit.
// "launch" is measured from reference launch and explainer films Primary chose as its bar for motion (five films,
// 85 seconds, 33 clear moves, 39 cuts, measured with optical flow and beat tracking). Its numbers are not taste
// guesses: they are what those films do. "calm" is the slower style the kit used before, kept for work that asks for it.
//
// What the references do, in short: things move fast and then hold. Moves last about half a second and cover half
// their distance in the first quarter to third of that time, then settle; most of the film is holding, not moving.
// Shots last about two seconds. Cuts land on the beat (about 120 to 130 BPM) and on a sound, and hide inside a fast
// move, a push or a defocus. Anything fast carries motion blur. Type assembles or decodes in under half a second
// and holds for about a second. The sound is a driving beat with a sound effect on almost every action.

// CSS-style cubic-bezier, solved for x by Newton's method with a bisection fallback.
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-6) return Y(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 30; i++) { const v = X(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return Y(t);
  };
}

export const STYLES = {
  launch: {
    label: 'Launch: measured from reference launch films',
    curves: {
      // The median of the references' moves: no slow start, half the distance by 35% of the time, then a long settle.
      move: [0.353, 0.576, 0.657, 0.914],
      // The snappier half of their moves: half the distance by 23% of the time. For things arriving: type, cards, pops.
      snap: [0.207, 0.624, 0.544, 0.939],
    },
    timing: {
      move: { p25: 0.27, median: 0.47, p75: 0.7, p90: 1.29 },   // seconds a single move takes
      hold: { mean: 1.0, min: 0.3, max: 1.8 },                    // seconds things sit still between moves
      shot: { median: 1.8, min: 0.5, typicalMax: 2.5, sequenceMax: 8.5 }, // a long shot is one continuous move through a scene
      movingShare: [0.26, 0.45],                                  // share of the film where something is moving
      typeIn: 0.4, typeHold: 1.0, stagger: 0.06,                  // a line assembles in ~0.4 s, holds ~1 s; words 60 ms apart
      morph: { min: 0.7, median: 1.1, max: 1.8 },                // particles need a little longer than a UI move to read as building
    },
    sound: { tempo: [118, 130], cutSyncMs: 100, lufs: -13, onsetsPerSecond: [4.5, 6.3], beat: 'driven' },
    transitions: ['cut inside a fast move (whip or push), on the beat', 'defocus out and in (0.2–0.3 s)', 'push into an element until it fills the frame, then cut', 'full-bleed colour field for a beat', 'type decode/scramble into the next word', 'scatter in from many places and resolve'],
  },
  calm: {
    label: 'Calm: unhurried and exact',
    curves: { move: [0.65, 0, 0.35, 1], snap: [0.33, 1, 0.68, 1] },
    timing: { move: { p25: 0.8, median: 1.2, p75: 1.8, p90: 2.5 }, hold: { mean: 2.0, min: 1.0, max: 4 }, shot: { median: 4, min: 2, typicalMax: 6, sequenceMax: 10 }, movingShare: [0.3, 0.6], typeIn: 0.8, typeHold: 2.0, stagger: 0.12, morph: { min: 2, median: 3, max: 4 } },
    sound: { tempo: [80, 104], cutSyncMs: 100, lufs: -14, onsetsPerSecond: [1, 3], beat: 'ambient' },
    transitions: ['slow dissolve', 'particles dissolving into the next form', 'cut from stillness on a downbeat'],
  },
};
export const styleOf = (name) => STYLES[name] ?? STYLES.launch;
export function easeOf(name, style = 'launch') {
  const s = styleOf(style);
  if (s.curves[name]) return cubicBezier(...s.curves[name]);
  return null;
}
