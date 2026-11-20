// The film and score part of the brand kit: FILM.md, SCORE.md, the scripts, and an example film.
// Motion has two layers. The cadence (how long moves, holds and shots last, the speed curves, how cuts sit on the beat)
// comes from a motion style; "launch", the default, is measured from reference films Primary chose as its bar. The
// look (which materials move, colours, type, logo) comes from the brand. The guideline has no rules for motion or
// sound, so what is written here is Primary's direction and says so.
import type { Brand } from './ui';
import { STYLES } from './engine/motionstyle.js';

declare const __KIT_FILM_SRC__: string;
declare const __KIT_SCORE_SRC__: string;
export const FILM_MJS = typeof __KIT_FILM_SRC__ === 'string' ? __KIT_FILM_SRC__ : '';
export const SCORE_MJS = typeof __KIT_SCORE_SRC__ === 'string' ? __KIT_SCORE_SRC__ : '';

/* What moves for each brand, and how it should sound. The cadence is the motion style's. Not guideline rules. */
type Direction = { look: string[]; sound: string; score: Record<string, unknown>; particles: boolean };
const DIRECTION: Record<string, Direction> = {
  aurelius: {
    particles: true,
    look: [
      'The particle engine is the hero. Forms build out of dust, the camera pushes and flies through the cloud, forms dissolve into the next. Never pan or zoom a still picture of particles.',
      'Numbers can be formed in particles or decoded in type; when a number is data, show its source.',
      'Dark grounds (Char, Ink) for particle shots; a Bone frame is a deliberate beat of rest. Secondary colours only for data, as in the guideline.',
      'End on the real logo file from logo/, at full opacity, with its clear space. A particle mark may lead into it, but the last hold is the file itself.',
    ],
    sound: 'Precise rather than euphoric: a tight four-on-the-floor kick, glassy struck tones, a dark minor or Dorian harmony, and the particles heard as shimmer and whooshes.',
    score: { key: 'D', mode: 'dorian', palette: { bells: 0.45, texture: 0.55, pad: 0.4 } },
  },
  smalldoor: {
    particles: false,
    look: [
      'Photography and the dry-brush illustration carry the film. Frames and masks from the guideline open and close on photos; brush strokes paint on (the Painterly studio makes these as video).',
      'Warm grounds from the palette between photos; type in the brand serif.',
      'End on the real logo file from logo/, untouched.',
    ],
    sound: 'Warm and bright: major key, round bass, clap and hats a touch softer.',
    score: { key: 'F', mode: 'major', palette: { drums: 0.55, bells: 0.5, texture: 0, pad: 0.5 } },
  },
  telli: {
    particles: false,
    look: [
      'The Glass tool’s patterns and the gradient fields can drift and refract; product moments (calls, transcripts) build in sequence, like a UI demo.',
      'Light grounds, glass over imagery, type in the brand face.',
      'End on the real logo file from logo/, untouched.',
    ],
    sound: 'Bright and clean: Lydian or major, airy bells, crisp hats.',
    score: { key: 'E', mode: 'lydian', palette: { bells: 0.5, texture: 0.2 } },
  },
};
const dirOf = (B: Brand): Direction => DIRECTION[B.id] ?? { particles: false, look: ['Use the brand’s own materials from BRAND.md: its imagery, colours and type.', 'End on the real logo file, untouched.'], sound: 'Follow the brand’s character in BRAND.md.', score: { key: 'D', mode: 'minor' } };

/* ---------- The example film: the launch cadence, in each brand's own materials ---------- */
// 124 BPM: a bar is 1.935 s, so every shot is one bar (the references' median shot is 1.8 s) and every cut lands on a downbeat.
const BPM = 124, BAR = (60 / BPM) * 4, bar = (k: number) => +(k * BAR).toFixed(3), beat = (k: number) => +((k * 60) / BPM).toFixed(3);

/** What a brand's example film is made from: its own words, a photograph, its ground and the logo file for that ground. */
export type Example = { ground: string; ink: string; lines: string[]; footer: string; logo: string; photo: string };
export function exampleFilm(B: Brand, ex: Example) {
  const d = dirOf(B);
  if (d.particles) {
    const cuts = [1, 2, 3, 4, 5, 6, 7].map(bar);
    return {
      width: 1080, height: 1350, fps: 30, duration: 16.5, style: 'launch', background: ex.ground, overlay: 'overlay.html', motionBlur: 3,
      cuts,
      score: { ...d.score, tempo: BPM, cues: [{ at: 1.2, type: 'pop' }, { at: 4.25, type: 'pop' }, { at: 8.45, type: 'pop' }, { at: bar(5) + 0.15, type: 'tick' }, { at: bar(6), type: 'riser', length: 1.4 }, { at: bar(6) + beat(2), type: 'hit', strength: 0.6 }, { at: bar(7) - beat(1), type: 'drop', length: beat(1) }, { at: bar(7), type: 'hit', strength: 0.9 }, { at: bar(7) + 0.3, type: 'click' }] },
      particles: {
        count: 140000, palette: { bg: ex.ground, speck: ex.ink },
        shots: [
          { at: 0, form: 'field' },
          { at: beat(1), form: 'globe', morph: { duration: beat(2), order: 'radial', flow: 0.45, spread: 0.55, ease: 'snap' } },
          { at: bar(2), form: 'map', morph: { duration: beat(1.5), order: 'sweep-x', flow: 0.3, spread: 0.6 } },
          { at: bar(3), form: 'city:london', morph: { duration: beat(2), order: 'sweep-y', flow: 0.3, spread: 0.7 }, size: 0.008 },
          { at: bar(4), form: { text: '92%' }, scale: 0.78, morph: { duration: beat(1.5), order: 'scatter', flow: 0.5, spread: 0.45, ease: 'snap' } },
          { at: bar(6), form: 'logo', scale: 0.72, morph: { duration: beat(2), order: 'radial', flow: 0.4, spread: 0.5, ease: 'snap' } },
          { at: bar(7), form: 'field', morph: { duration: beat(2), order: 'scatter', flow: 0.5, spread: 0.4 }, opacity: 0.25 },
        ],
        // Fast moves, then near-still holds; jumps on the cuts.
        camera: [
          { at: 0, az: -20, el: 6, dist: 0.5 },
          { at: beat(1), az: -16, el: 6, dist: 0.7 },
          { at: beat(1) + beat(1), az: 0, el: 10, dist: 3.3 },
          { at: bar(1) - 0.01, az: 6, el: 11, dist: 3.15 },
          { at: bar(1), az: 38, el: 20, dist: 1.75, look: [0, 0.25, 0], cut: true },
          { at: bar(2) - 0.01, az: 44, el: 20, dist: 1.65, look: [0, 0.25, 0] },
          { at: bar(2), az: 0, el: 0, dist: 3.1, cut: true },
          { at: bar(3) - 0.01, az: 0, el: 0, dist: 2.95 },
          { at: bar(3), az: 26, el: 8, dist: 3.4, look: [0, 0.1, 0], cut: true },
          { at: bar(3) + 1.2, az: 32, el: 7, dist: 2.6, look: [0, 0.1, 0] },
          { at: bar(4) - 0.45, az: 34, el: 6, dist: 2.45, look: [0, 0.2, 0] },
          { at: bar(4) - 0.01, az: 36, el: 4, dist: 0.5, look: [0, 0.4, 0], ease: 'snap' },
          { at: bar(4), az: 0, el: 0, dist: 3.0, cut: true },
          { at: bar(6) - 0.01, az: 0, el: 0, dist: 2.8 },
          { at: bar(6), az: 0, el: 0, dist: 3.4, cut: true },
          { at: bar(7) - 0.01, az: 0, el: 0, dist: 3.1 },
          { at: bar(7), az: 0, el: 0, dist: 3.4, cut: true },
          { at: 16.5, az: 4, el: 2, dist: 3.2 },
        ],
        spin: 0,
      },
    };
  }
  return {
    width: 1080, height: 1350, fps: 30, duration: 8.5, style: 'launch', background: ex.ground, overlay: 'overlay.html', motionBlur: 3,
    cuts: [1, 2, 3].map(bar),
    score: { ...d.score, tempo: BPM, cues: [{ at: 0.05, type: 'whoosh', length: 0.5 }, { at: bar(1) + 0.1, type: 'pop' }, { at: bar(2) + 0.35, type: 'tick' }, { at: bar(3), type: 'hit', strength: 0.8 }, { at: bar(3) + 0.3, type: 'click' }] },
  };
}

export function exampleOverlay(B: Brand, ex: Example) {
  const d = dirOf(B), esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  const head = `<!-- The film's own layer: any HTML and CSS, using brand.css (already loaded) and the brand's fonts.
     Define window.seek(t): film.mjs calls it for every frame with the time in seconds. window.kit has the motion
     style's eases and helpers (span, move, assemble, scramble, defocus); see FILM.md. -->`;
  const B1 = BAR;
  if (d.particles) {
    return `${head}
<style>
  .o { position: absolute; inset: 0; color: ${ex.ink}; font-family: var(--font-headline); }
  .t { position: absolute; left: 7.5%; right: 7.5%; letter-spacing: -0.025em; line-height: 1.02; }
  .row { display: block; }
  .big { font-size: 92px; }
  .num { font-size: 210px; letter-spacing: -0.04em; bottom: 15%; }
  .label { font-size: 40px; bottom: 9%; letter-spacing: 0; }
  .src { font-family: var(--font-mono, monospace); font-size: 22px; letter-spacing: 0.06em; text-transform: uppercase; bottom: 5.5%; opacity: 0.7; }
  .rest { position: absolute; inset: 0; background: ${ex.ink}; color: ${ex.ground}; display: none; }
  .rest .t { top: 38%; }
  .end { position: absolute; inset: 0; display: grid; place-items: center; }
  .end img { width: 52%; }
  .foot { font-size: 36px; bottom: 8%; text-align: center; letter-spacing: 0; }
</style>
<div class="o">
  <div class="t big" id="l1" style="top:7%"><span class="row">A living picture</span><span class="row">of a connected world.</span></div>
  <div class="t num" id="num"></div>
  <div class="t label" id="lab">Enterprise LLM budget growth</div>
  <div class="t src" id="src">Source: A16Z (2025)</div>
  <div class="t label" id="ai" style="bottom:12%;text-align:center">Deployed AI</div>
  <div class="rest" id="rest"><div class="t big" id="l2">${(ex.lines.length ? ex.lines : [B.name]).map((l) => `<span class="row">${esc(l)}</span>`).join('')}</div></div>
  <div class="end" id="end"><img src="${ex.logo}" alt=""></div>
  <div class="t foot" id="foot"></div>
</div>
<script>
  const { span, split, assemble, scramble, defocus, move } = window.kit;
  const BAR = ${B1};
  const show = (id, on) => { document.getElementById(id).style.visibility = on ? 'visible' : 'hidden'; };
  const w1 = [...document.querySelectorAll('#l1 .row')].flatMap((r) => split(r));
  const w2 = [...document.querySelectorAll('#l2 .row')].flatMap((r) => split(r));
  const lab = split(document.getElementById('lab')), ai = split(document.getElementById('ai'));
  const stage = document.getElementById('stage');
  window.seek = (t) => {
    // A defocus carries the cut into the map, as the references do.
    stage.style.filter = 'blur(' + defocus(t, BAR * 2, 0.45, 26).toFixed(2) + 'px)';
    // Shots 1–2: the line assembles over the globe and holds across the cut.
    show('l1', t < BAR * 2);
    assemble(w1, t, { at: 1.15, seed: 3 });
    // Shot 3: the number decodes, its label assembles, the source follows.
    const s3 = t >= BAR * 2 && t < BAR * 3;
    show('num', s3); show('lab', s3); show('src', s3);
    scramble(document.getElementById('num'), t, { at: 4.25, dur: 0.45, from: '', to: '+75%' });
    assemble(lab, t, { at: 4.45, spread: 120, seed: 5 });
    document.getElementById('src').style.opacity = 0.7 * span(t, 4.9, 5.2, 'snap');
    // Shot 5: the number is made of particles; its label snaps in under it.
    show('ai', t >= BAR * 4 && t < BAR * 5);
    assemble(ai, t, { at: 8.45, spread: 140, seed: 7 });
    // Shot 6: a Bone frame, a beat of rest, the line assembling.
    document.getElementById('rest').style.display = t >= BAR * 5 && t < BAR * 6 ? 'block' : 'none';
    assemble(w2, t, { at: BAR * 5 + 0.15, seed: 9 });
    // Shot 8: the logo file arrives with a snap; the footer decodes under it.
    show('end', t >= BAR * 7);
    move(document.querySelector('#end img'), t, { at: BAR * 7, dur: 0.45, from: { scale: 0.92, opacity: 0 }, to: { scale: 1, opacity: 1 }, ease: 'snap' });
    show('foot', t >= BAR * 7);
    scramble(document.getElementById('foot'), t, { at: BAR * 7 + 0.3, dur: 0.6, from: '', to: ${JSON.stringify(ex.footer || 'Decision-making infrastructure')} });
  };
</script>
`;
  }
  const photo = ex.photo ? `<img id="ph" src="${ex.photo}" alt="">` : '<div id="ph"></div>';
  return `${head}
<style>
  .o { position: absolute; inset: 0; font-family: var(--font-headline); overflow: hidden; }
  #ph { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .field { position: absolute; inset: 0; background: ${ex.ground}; color: ${ex.ink}; }
  .t { position: absolute; left: 7.5%; right: 7.5%; letter-spacing: -0.02em; line-height: 1.04; }
  .row { display: block; }
  .big { font-size: 96px; top: 34%; }
  .foot { font-size: 40px; bottom: 8%; letter-spacing: 0; color: #fff; }
  .end { position: absolute; inset: 0; display: grid; place-items: center; background: ${ex.ground}; }
  .end img { width: 52%; }
</style>
<div class="o">
  ${photo}
  <div class="field" id="field"><div class="t big" id="l1">${(ex.lines.length ? ex.lines : [B.name]).map((l) => `<span class="row">${esc(l)}</span>`).join('')}</div></div>
  <div class="t foot" id="foot"></div>
  <div class="end" id="end"><img src="${ex.logo}" alt=""></div>
</div>
<script>
  const { span, split, assemble, scramble, defocus, move } = window.kit;
  const BAR = ${B1};
  const ph = document.getElementById('ph'), stage = document.getElementById('stage');
  const w1 = [...document.querySelectorAll('#l1 .row')].flatMap((r) => split(r));
  window.seek = (t) => {
    stage.style.filter = 'blur(' + Math.max(defocus(t, 0, 0.6, 30), defocus(t, BAR * 2, 0.4, 22)).toFixed(2) + 'px)';
    // Shot 1: the photo arrives with a fast push and settles.
    const p1 = span(t, 0, 0.55, 'snap'), p3 = span(t, BAR * 2, BAR * 2 + 0.45, 'snap');
    if (t < BAR * 2) { ph.style.transformOrigin = '50% 45%'; ph.style.transform = 'scale(' + (1.35 - 0.3 * p1 + 0.02 * span(t, 0.55, BAR, 'linear')) + ')'; }
    else { ph.style.transformOrigin = '62% 38%'; ph.style.transform = 'scale(' + (2.1 - 0.5 * p3) + ') translateX(' + (1 - p3) * 140 + 'px)'; }
    // Shot 2: the ground, the line assembling.
    document.getElementById('field').style.display = t >= BAR && t < BAR * 2 ? 'block' : 'none';
    assemble(w1, t, { at: BAR + 0.1, seed: 3 });
    // Shot 3: back to the photo, closer; the footer decodes.
    document.getElementById('foot').style.visibility = t >= BAR * 2 && t < BAR * 3 ? 'visible' : 'hidden';
    scramble(document.getElementById('foot'), t, { at: BAR * 2 + 0.35, dur: 0.5, from: '', to: ${JSON.stringify(ex.footer || B.name)} });
    // Shot 4: the logo file with a snap.
    document.getElementById('end').style.display = t >= BAR * 3 ? 'grid' : 'none';
    move(document.querySelector('#end img'), t, { at: BAR * 3, dur: 0.45, from: { scale: 0.92, opacity: 0 }, to: { scale: 1, opacity: 1 }, ease: 'snap' });
  };
</script>
`;
}

const L = STYLES.launch;
export function filmMD(B: Brand, ex: Example) {
  const d = dirOf(B), T = L.timing;
  return `# Making films for ${B.name}

\`film.mjs\` renders a film frame by frame to an MP4: ${d.particles ? 'the brand’s particle engine (the World Graph globe, landmarks, the particle studio’s forms), ' : ''}your own HTML/CSS layer over it, motion blur, and a score made from the film’s own timeline (see SCORE.md). Frame by frame means every frame is exact whatever the machine.

This is not a layout job. Layouts are for producing assets; a film is directed. Read BRAND.md, look at the layouts and imagery, then make your own compositions. Stay inside the guideline’s stated rules (colour, type, logo, contrast) and take liberties everywhere else.

## How to work

1. **Concepts.** Propose three different ideas, each a title, one line and why it fits ${B.name}. Ask which to make.
2. **Storyboard.** Write film.json and the overlay, then \`node film.mjs film.json --sheet board.png\` (a frame every second) and show it. Change direction here, where it is cheap.
3. **Draft.** \`node film.mjs film.json draft.mp4 --draft\` (half size, 15 fps, no score or blur), then \`node film.mjs --motion draft.mp4 film.json\`. Fix what the motion check flags before going on.
4. **Score.** \`node score.mjs --plan film.json\`, then adjust \`score\` in film.json (SCORE.md).
5. **Final.** \`node film.mjs film.json final.mp4\`, then \`node film.mjs --motion final.mp4 film.json\` and \`node score.mjs --check final.mp4 film.json\`. Fix anything flagged.
6. Hand over the MP4, the board, and a short note: concept, what each shot does, both checks’ results. Say plainly that the music should be judged by ear.

## Cadence: the launch style

Every film uses a motion style, \`"style"\` in film.json. The default, **launch**, is not taste: it is measured from reference launch films Primary chose as its bar for motion (five films, 33 clear moves, 39 cuts, read with optical flow and beat tracking). Hit these numbers:

- **Move fast, then hold.** A move takes ${T.move.p25} to ${T.move.p75} s (median ${T.move.median} s). Between moves things hold still for about ${T.hold.mean} s. Only ${Math.round(L.timing.movingShare[0] * 100)} to ${Math.round(L.timing.movingShare[1] * 100)}% of the film is moving.
- **The curve.** Moves start at speed, cover half their distance by a third of their time, then settle: \`move\` is cubic-bezier(${L.curves.move.join(', ')}). Things arriving (type, cards, numbers, the logo) use the snappier \`snap\`, cubic-bezier(${L.curves.snap.join(', ')}). No slow ease-ins, no bounce.
- **Shots last about ${T.shot.median} s** (${T.shot.min} to ${T.shot.typicalMax} s). A longer shot is one continuous move through a scene (up to ${T.shot.sequenceMax} s).
- **Cuts land on the beat and on a sound**, within ${L.sound.cutSyncMs} ms, at ${L.sound.tempo[0]} to ${L.sound.tempo[1]} BPM. Pick the tempo first and put cuts on bar lines (at 124 BPM a bar is 1.935 s, one shot). List them in \`"cuts"\` so the score hits them.
- **Hide cuts in motion**: ${L.transitions.join('; ')}.
- **Landings on the beat too**: give morphs and moves durations in whole or half beats, so a form lands on the beat as well as starting on it.
- **Type** assembles or decodes in about ${T.typeIn} s, words ${T.stagger * 1000} ms apart, then holds about ${T.typeHold} s; it can carry across a cut.
- **Motion blur** on everything fast: film.mjs averages several moments per frame (a 180° shutter, \`"motionBlur": 3\`), and \`kit.move\` blurs an element along its path.
${d.particles ? `- **Particles** take a little longer than a UI move to read as building: morphs of ${T.morph.min} to ${T.morph.max} s (median ${T.morph.median} s), with \`snap\` for forms arriving and \`move\` for forms changing.\n` : ''}
\`"style": "calm"\` is slower (moves over a second, shots of 4 s, in-out eases, an ambient score) for work that asks for it.

## What moves for ${B.name} (Primary’s direction, not guideline rules)

${d.look.map((m) => `- ${m}`).join('\n')}

## film.json

\`\`\`json
${JSON.stringify(exampleFilm(B, ex), null, 2)}
\`\`\`

- \`width\`, \`height\` (even numbers), \`fps\` (default 30), \`duration\` in seconds, \`background\`, \`style\` (\`launch\` or \`calm\`).
- \`overlay\`: an HTML file with your type and graphics (see below).
- \`cuts\`: the times of your cuts, for the score and the motion check.
- \`motionBlur\`: moments averaged per frame (default 3; 0 for none). Renders take that many times longer.
- \`score\`: how the music should go (SCORE.md). Leave it out for a silent film.
${d.particles ? `- \`particles\`: the particle film (next section). Leave it out for a film that is only your overlay.

## Particles

One cloud of specks (\`count\`, 5,000 to 400,000; 140,000 is a good default) moves from form to form. A **shot** says which form the cloud is in from time \`at\`; its \`morph\` says how it gets there from the shot before (\`"duration": 0\` switches on a cut).

Forms (\`node film.mjs --forms\` lists them):

| Form | What it is |
| --- | --- |
| \`field\` | Dust: a wide, deep cloud to fly through, or the state between forms |
| \`globe\` | The speckled Earth, radius 1 (the World Graph globe) |
| \`map\` | The Earth laid flat |
| \`city:nyc\`, \`city:london\`, \`city:tokyo\`, \`city:dc\`, \`city:singapore\` | The World Graph landmarks, built from specks |
| \`sphere\`, \`ring\`, \`cube\`, \`cylinder\`, \`pyramid\`, \`wave\` | The particle studio’s forms |
| \`{"text": "+75%"}\` | A word or number in the brand headline face, made of specks |
| \`logo\` | The mark made of specks (a transition only; end on the real file) |
| \`{"image": "imagery/file.jpg"}\` | A picture’s light areas as specks |

\`morph\`: \`duration\`, \`ease\` (\`move\`, \`snap\`, \`inOut\`, or a cubic-bezier as four numbers), \`order\` (\`scatter\`: the cloud swirls apart and re-forms; \`sweep-x\`/\`sweep-y\`: the form builds across or upward; \`radial\`: from the centre out), \`spread\` (0 to 0.9, how staggered the particles set off; higher builds more visibly), \`flow\` (0 to 1, how much they swirl on the way).

A shot can also set \`size\` (speck size, default 0.006), \`opacity\`, \`drift\` (how much the held form breathes, default 0.004), \`speck\` (colour), and \`scale\`.

\`camera\`: keys \`{at, az, el, dist, look, fov, ease, cut}\`. \`az\`/\`el\` are degrees around \`look\` (default the centre), \`dist\` is in form radii (3 frames a form whole, 1 is close, under 1 is inside the cloud: fly through it). \`ease\` defaults to the style’s \`move\`. \`"cut": true\` jumps to the key instead of moving to it. \`spin\` turns the cloud slowly (degrees per second).

Particles always move: build them, push and fly the camera through them, dissolve them into the next form. A still of particles that pans is not a particle shot.
` : ''}
## The overlay

Any HTML and CSS. brand.css and the brand fonts are loaded, so use its variables and tone classes; paths are relative to the film’s folder, or the kit (\`logo/…\`, \`imagery/…\`). Define \`window.seek(t)\`: film.mjs calls it for every frame with the time in seconds. Set every style from \`t\` alone (never timers or CSS animations), so each frame is exact. The whole frame is \`#stage\` (blur it for a defocus).

\`window.kit\`, all pure functions of \`t\`:

- \`kit.span(t, start, end, ease)\`: 0 → 1 between two times (ease defaults to the style’s \`move\`).
- \`kit.move(el, t, {at, dur, from, to, ease})\`: moves an element between poses (\`x\`, \`y\`, \`scale\`, \`opacity\`, \`rotate\`), with motion blur along its path.
- \`kit.split(el)\` wraps words in spans; \`kit.assemble(words, t, {at, spread})\` flies them in from scattered places and resolves the line.
- \`kit.scramble(el, t, {at, dur, from, to})\` decodes text from random glyphs into the target.
- \`kit.defocus(t, at, len, px)\`: how much to blur the stage around a defocus transition.
- \`kit.ease\` (\`move\`, \`snap\`, \`inOut\`, \`out\`, \`outExpo\`, \`linear\`), \`kit.style\` (the style’s numbers), \`kit.lerp\`, \`kit.clamp\`.

An example film is in \`example/\`: \`node film.mjs example/film.json example.mp4\`.

## Checks

- \`node film.mjs --check film.json\` checks the film before rendering.
- \`node film.mjs --motion film.mp4 film.json\` measures cadence against the style: share of the film moving, typical move, hold and shot, and whether cuts sit on the beat.
- Run \`node check.mjs\` on your overlay HTML for palette, fonts and contrast.
- Look at the board and the draft yourself before handing anything over.
`;
}

export function scoreMD(B: Brand) {
  const d = dirOf(B);
  return `# Scoring films for ${B.name}

The guideline has no rules for sound. The score is made the way a composer and sound designer work to picture: from the film’s own timeline, by \`score.mjs\` (film.mjs runs it for you when film.json has a \`score\`). It runs offline: nothing is fetched and no service is needed.

## What it does (launch style)

The reference films behind the launch style play a driving beat at ${L.sound.tempo[0]} to ${L.sound.tempo[1]} BPM with a sound on nearly every action (${L.sound.onsetsPerSecond[0]} to ${L.sound.onsetsPerSecond[1]} sound onsets a second), cuts landing on the beat and on a sound, mixed loud and dense (about −12 LUFS). The score engine does the same:

- **Beat** from the first bar: kick on every beat, clap on 2 and 4, hats on the offbeats (sixteenths when energy is high), a bass on the eighths between kicks; chords and textures pump under the kick.
- **Tempo**: set \`tempo\` and put cuts on bar lines, or give \`tempoRange\` and it picks the tempo where your cuts and landings sit closest to the beat.
- **Harmony** changes on the bar and on cuts and landings, so a new image arrives with a new chord; the last landing resolves home.
- **Sound effects from the picture**: a whoosh at each fast camera move and each particle morph, peaking where the motion is fastest; an impact and a click on each cut; shimmer while particles are in flight; plus the cues you add.
- **Mix**: rumble cut, low mids eased, air on top, glue compression, normalised to −13 LUFS (−14 for the calm style) with peaks under −1 dBTP.

## Steering it (in film.json)

\`\`\`json
"cuts": [1.935, 3.871, 5.806],
"score": {
  "key": "D",
  "mode": "dorian",
  "tempo": 124,
  "progression": ["i", "VI", "III", "VII"],
  "sections": [{ "at": 0, "energy": 0.5 }, { "at": 9, "energy": 0.9 }, { "at": 14, "energy": 0.4 }],
  "palette": { "drums": 0.7, "bass": 0.6, "pad": 0.45, "bells": 0.4, "texture": 0.4, "sfx": 0.75, "hits": 0.6, "reverb": 0.22 },
  "cues": [{ "at": 1.2, "type": "pop" }, { "at": 4.4, "type": "tick" }, { "at": 9.68, "type": "riser", "length": 1.4 }, { "at": 11.6, "type": "hit" }]
}
\`\`\`

- \`key\`, \`mode\` (major, minor, dorian, lydian, mixolydian), \`progression\` (Roman numerals in the mode).
- \`tempo\` or \`tempoRange\`; \`beat\`: \`driven\` (the launch default) or \`ambient\` (no drums); \`beatFrom\` starts the beat later.
- \`sections\` shape the energy (0 to 1) over time.
- \`palette\` sets each layer’s level (0 leaves it out): \`drums\`, \`bass\`, \`pad\`, \`bells\`, \`pulse\`, \`texture\`, \`air\`, \`sfx\`, \`hits\`, \`reverb\`.

Cue types: \`pop\` (something appears: type, a card, a number), \`click\` (a UI tap), \`tick\` (a line of type lands), \`whoosh\` (\`length\`, \`dir\`; extra air on a move), \`riser\` (\`length\`; builds into the time given), \`hit\` (a full impact for the biggest moment), \`drop\` (\`length\`; the beat stops for a moment before a reveal).

## ${B.name}’s flavour (Primary’s direction, not guideline rules)

${d.sound}

\`\`\`json
${JSON.stringify(d.score, null, 2)}
\`\`\`

## Checking

\`node score.mjs --check final.mp4 film.json\` reports loudness, true peak, the tonal balance and, for every cut, landing and cue, how far the nearest sound onset is from its frame and whether it can be heard over what is around it. Fix anything flagged; then say plainly that a person should judge the music by ear, because no check can.
`;
}
