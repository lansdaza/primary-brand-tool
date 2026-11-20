// @ts-nocheck
// telli as a brand record, read from the Figma file "telli Brand Guidelines" (key ZeJvDTF8otWmjXXBr1poGj)
// on 2026-11-11. Colours, type, rules, copy and example prompts are the file's own. Logo, logomark and
// Charlie are the file's vectors (SVG exports). Photographs and AI images are captures of the file's
// layers at the size they sit in the guideline.
import { formatParam } from './formats.js';
import { esc, contrast, hasFont, sharedTemplates, finishBrand, asSlide, SLIDE, swatchOf, cssVars, typeCss, fontState, LICENCES, liveImg, registerLive } from './brand.js';
import { GLASS_PATTERNS, GLASS_COLOURS, glassLabel, glassOpts, cleanGlass, glassImage } from './telli-glass.js';
import D from './telli-desc.json';

const IMG = window.__TELLI_IMG, L = window.__TELLI_META;
const C = { white: '#FFFFFF', off: '#FCFAF5', tan: '#F1EFE9', black: '#252525', grey: '#4E4E4E', stone: '#ADA59B', blue: '#004FE1', bright: '#2C72F5', pale: '#CFE1FF' };
const BLUES = [{ name: 'telli Blue', hex: C.blue }, { name: 'Bright Blue', hex: C.bright }, { name: 'Pale Blue', hex: C.pale }];
// Two accent steps are on 2.3; the pale tint of each appears only in the soft gradients on 2.5.
const ACCENTS = [{ name: 'Orange', steps: ['#FF480B', '#FF926D', '#FFC1AD'] }, { name: 'Lavender', steps: ['#C78CF5', '#DBADFF', '#EBD2FF'] }, { name: 'Forest', steps: ['#304F2E', '#50BE49', '#ADEDA9'] }];
const GRAD = {
  saturated: [['Orange', '#FF480B'], ['Blue', C.blue], ['Lavender', '#C78CF5'], ['Forest', '#304F2E']],
  soft: [['Peach', '#FFC1AD'], ['Pale blue', C.pale], ['Lilac', '#EBD2FF'], ['Mint', '#ADEDA9']],
};
// Agent containers on 7.2. Sara's orange is not one of the palette's values (flag "agentorange").
const AGENTS = [{ name: 'Emma', role: 'Lead Qualification', hex: '#ADEDA9', ink: C.black }, { name: 'Daniela', role: 'Customer Support', hex: C.blue, ink: C.off }, { name: 'Sara', role: 'Appointment Booking', hex: '#FE7348', ink: C.off }];
const diatype = hasFont('ABC Diatype'), tiempos = hasFont('Tiempos Text') || hasFont('Tiempos');

const PROMPTS = [
  'An early morning sunrise, warm lighting, yellows, Grassland greens, hills clouds, add two people having a conversation face to face, not holding hands, friends, chatting.',
  'A person walking across a grassy field at sunset. a young man with dark curly hair is shown in profile, walking to the right on a hillside covered in golden, sunlit grass, rolling hills extend to the horizon under a gradient sky shifting from blue to warm orange near the horizon.',
  'An early morning sunrise, warm lighting, yellows, Grassland greens, Trees, cell tower, yellows, Trees, one person walking left to right from the canvas, side profile of the person walking.',
  'Two people having a conversation at a desk face to face on a grassy field at sunset, sunlit grass. in the background, rolling hills extend to the horizon under a gradient sky shifting from blue to warm orange near the horizon. a cluster of green pine trees stands on the left side of the hill, and a small group of trees is visible in the distant valley to the right.'];

const BRAND = {
  meta: { brand: 'telli', source: 'telli Brand Guidelines (Figma)', fileKey: 'ZeJvDTF8otWmjXXBr1poGj', pages: 34, edition: 'Last updated 08.14.26', extracted: '2026-11-11',
    basis: { stated: 'written in the guideline', measured: 'read from layer geometry or fills in the file', inferred: 'deduced from examples; needs sign-off' } },
  character: ['precise', 'modular', 'bold', 'intelligent', 'systematic', 'editorial', 'human', 'slightly unexpected'],
  skill: D.skill,
  logo: {
    assets: { logo: 'logomark + custom serif wordmark', logomark: 'two stylised phones facing one another', charlie: 'the logomark reshaped into a C' },
    rules: [
      { t: 'The logos work in off black or off white', b: 'stated', p: '1.4' },
      { t: 'Always consider contrast when choosing a logo', b: 'stated', p: '1.4' },
      { t: 'Pure black or pure white only when print needs a black and white layout', b: 'stated', p: '1.4' },
      { t: 'Clear space on every side of at least double the gap between logomark and wordmark', b: 'stated', p: '1.2' },
      { t: 'That gap is 31 units on a 124-unit logo, so clear space is about half the logo height', b: 'measured', p: '1.2', value: 0.5, unit: 'logo height' },
      { t: 'Contained avatars always use #004FE1 with an off white logomark', b: 'stated', p: '1.3' }],
    never: ['Stretch, rotate, crop, or distort the logo', 'Reduce the opacity of the logo', 'Outline the logo', 'Use unapproved colors', 'Add dramatic effects to the logo', 'Disassemble the logo'],
  },
  color: {
    neutrals: [{ name: 'White', hex: C.white }, { name: 'Off White', hex: C.off }, { name: 'Tan', hex: C.tan }, { name: 'Stone', hex: C.stone }, { name: 'Grey', hex: C.grey }, { name: 'Brand Black', hex: C.black }],
    primary: BLUES, accents: ACCENTS, gradients: GRAD,
    balance: { neutral: 57, primary: 20, accent: 23 },
    rules: [
      { t: 'Neutrals lead across most applications', b: 'stated', p: '2.1' },
      { t: 'The primary blues are used intentionally, for key information, hierarchy and energy', b: 'stated', p: '2.2' },
      { t: 'Accent colors are used selectively rather than as dominant visual fields', b: 'stated', p: '2.3' },
      { t: 'About 57% neutral, 20% primary blue, 23% across three accent hues; a guide, not a formula', b: 'measured', p: '2.4' },
      { t: 'Gradients are soft radial blurs into Off White, built from the approved palette', b: 'measured', p: '2.5' },
      { t: 'Avoid rainbow, metallic, glossy or cyberpunk gradients', b: 'stated', p: 'Brand skill' }],
  },
  type: {
    families: { primary: { name: 'ABC Diatype', standIn: 'Inter Tight' }, serif: { name: 'Tiempos', standIn: 'Source Serif 4' } },
    styles: [
      { id: 'tag', name: 'Eyebrows and tags', face: 'ABC Diatype Bold', tracking: '0%', leading: '100%', sample: 'Welcome to telli' },
      { id: 'headline', name: 'Headlines', face: 'ABC Diatype Medium', tracking: '-4%', leading: '100%', sample: 'Every customer call,\nhandled by AI.' },
      { id: 'subhead', name: 'Subheads', face: 'Tiempos Regular', tracking: '-4%', leading: '120%', sample: 'The #1 AI voice platform for agents that sell, support and operate - across millions of calls.' },
      { id: 'body', name: 'Body', face: 'ABC Diatype Regular', tracking: '-1%', leading: '130%', sample: 'Intelligent routing based on caller intent, conversation summaries delivered before transfer, and automatic call logs with structured outcomes.' },
      { id: 'button', name: 'Buttons', face: 'ABC Diatype Medium', tracking: '0%', leading: '100%', extra: 'Pill', sample: 'Book a demo' }],
  },
  graphics: {
    softGlass: { p: '6.1', rule: 'Repeat and scale the logomark’s geometry into interconnected fields, with transparency, blur and depth. Keep it soft and secondary.' },
    patterns: { p: '6.2', rule: 'Scale, crop, repeat and layer the logomark geometry; it stays the foundation of every composition' },
    logoOnPattern: { p: '6.3', rule: 'Soft Glass sits behind the logo and content; keep key brand elements on areas of quiet and contrast' },
    glassOverlays: { p: '6.4', rule: 'Soft, transparent containers hold messages and callouts while the image beneath stays visible; avoid stacking and heavy effects' },
    reveal: { p: '6.5', rule: 'Images fade gradually into the neutral field, with no hard edge, from one or several sides' },
  },
  photography: { p: '4.1', rule: 'People in natural, confident moments; soft natural light, warm balanced tones, a mix of direct and off-camera perspectives' },
  imagery: {
    generated: true, p: '5.1–5.2, Generated AI Imagery page',
    subject: 'Two people in a soft, expansive landscape: a quiet metaphor for conversation between people and AI',
    always: ['Two people as the focal point, close or at a distance', 'Expansive, minimally detailed landscapes', 'Natural light and open skies, gently coloured', 'Golden grass, rolling hills, pines, a sky from blue to warm orange', 'A relationship that feels natural and understated'],
    never: ['Robots, interfaces or overt technology cues', 'Conventional “AI” imagery', 'Staged or overly literal moments', 'Futuristic settings'],
    method: { tool: 'Midjourney', steps: ['Download the reference images and add them to Midjourney', 'Use them as a style reference (sref) to hold the imagery style', 'A character reference (cref) keeps one person consistent across prompts', 'They can also be used as an image prompt'], recommend: 'Use the style reference to maintain the imagery style' },
    prompts: PROMPTS, references: ['desk', 'sunrise', 'walk', 'bench', 'walkers', 'sitting', 'tower'],
    // The imagery tool builds prompts from these parts. Wording is lifted from the example prompts and 5.2.
    recipe: {
      order: ['light', 'scene', 'people', 'distance'],
      fields: [
        { id: 'light', label: 'Light', default: 'sunset', options: [
          { id: 'sunrise', label: 'Early sunrise', text: 'An early morning sunrise, warm lighting, yellows' },
          { id: 'sunset', label: 'Sunset', text: 'Sunset, a gradient sky shifting from blue to warm orange near the horizon' },
          { id: 'day', label: 'Soft daylight', text: 'Soft natural daylight, an open blue sky with soft pink-edged clouds' }] },
        { id: 'scene', label: 'Landscape', default: 'hills', options: [
          { id: 'hills', label: 'Rolling hills', text: 'rolling hills covered in golden, sunlit grass extending to the horizon' },
          { id: 'pines', label: 'Hill with pines', text: 'a grassy hill with a cluster of green pine trees on the left and a small group of trees in the distant valley' },
          { id: 'meadow', label: 'Meadow', text: 'an open meadow of grassland greens and wildflowers, soft mountains in the distance' },
          { id: 'coast', label: 'Hilltop by the sea', text: 'a grassy hilltop above a calm sea, a long low horizon' }] },
        { id: 'people', label: 'People', default: 'talk', options: [
          { id: 'talk', label: 'Two people talking', text: 'two people having a conversation face to face, friends, chatting, not holding hands' },
          { id: 'desk', label: 'Two people at a desk', text: 'two people having a conversation at a desk face to face in the field' },
          { id: 'bench', label: 'Two people on a bench', text: 'two people sitting together on a bench, looking out at the view' },
          { id: 'walk', label: 'One person walking', text: 'one person walking left to right across the canvas, side profile' }] },
        { id: 'distance', label: 'Distance', default: 'middle', options: [
          { id: 'close', label: 'Close', text: 'seen fairly close, the landscape still open behind them' },
          { id: 'middle', label: 'Middle distance', text: 'in the middle distance' },
          { id: 'far', label: 'Far away', text: 'small in a wide landscape, lots of open sky' }] }],
      style: 'Soft, atmospheric and painterly, expansive and minimally detailed, gentle colour and natural light, beautiful, open and quietly optimistic',
      avoid: ['robots', 'screens', 'interfaces', 'technology', 'futuristic'],
      aspects: ['16:9', '4:5', '1:1', '9:16', '3:2'],
      tool: 'Midjourney',
    },
  },
  agents: { p: '7.2', rule: 'Every agent uses the logomark as its container; colour is the only thing that changes', examples: AGENTS.map(({ ink: _, ...a }) => a) },
  charlie: { p: '7.1', rule: 'The logomark reshaped into a C; helpful and intelligent, not overly playful. Keep the approved form, proportions and soft dimensional treatment.' },
  flags: [
    { id: 'diatype', sev: 'need', p: '3.1', title: 'ABC Diatype is a licensed font', says: 'Every style except subheads is set in ABC Diatype; 3.1 links to a download', uses: 'Inter Tight, the closest open grotesk, unless ABC Diatype is installed or its files are added in Assets.' },
    { id: 'tiempos', sev: 'need', p: '3.1', title: 'Tiempos is a licensed font', says: 'Subheads are set in Tiempos Regular', uses: 'Source Serif 4 in its place, unless Tiempos is installed or its files are added in Assets.' },
    { id: 'ivory', sev: 'check', p: '3.1', title: 'The font page names two different serifs', says: '“telli’s typography system pairs ABC Diatype and Ivory”, then describes Tiempos; the specimen and 3.2 both show Tiempos', uses: 'Tiempos. The copy on 3.1 should be corrected.' },
    { id: 'labels', sev: 'check', p: '2.3', title: 'Accent swatch labels do not match their fills', says: 'Labels read #D8B4FC, #360D5F, #A9C6FF, #003F95, #FFB4CF and #AA0642', uses: 'The fills: #FF480B, #FF926D, #C78CF5, #DBADFF, #304F2E, #50BE49. These also match the gradients on 2.5 and the brand skill (orange-red, lavender, forest green).', why: 'The labels look like they were left over from an earlier palette.' },
    { id: 'names', sev: 'check', p: '2.1–2.3', title: 'Colours have no names in the file', says: 'Swatches are plain fills with hex labels', uses: 'Working names (telli Blue, Bright Blue, Pale Blue, Orange, Lavender, Forest, Stone, Grey).', why: 'Unnamed colours cannot be referred to by people or agents.' },
    { id: 'agentorange', sev: 'check', p: '7.2', title: 'An agent colour is outside the palette', says: 'Sara’s container is #FE7348; Emma uses the Mint tint, Daniela telli Blue', uses: '#FE7348 as drawn. The palette’s nearest values are Orange #FF480B and #FF926D.' },
    { id: 'photos', sev: 'need', p: '4.1', title: 'Photographs are at guideline size, and their licences are unknown', says: 'Four portraits sit at 340 to 690 pixels on 4.1', uses: 'Those captures. They look like licensed stock: confirm the licence and supply originals before using them in client work.' },
    { id: 'aisize', sev: 'need', p: '5.1', title: 'AI images are captures, not the generated originals', says: 'Midjourney originals are 1456 by 816 (one is 4096 wide)', uses: 'Renders of the file’s frames at 1456 to 1600 pixels. Add the originals in Assets for print or large formats.' },
    { id: 'glass', sev: 'need', p: '6.1–6.3', title: 'Guideline patterns are renders; the Glass tool is a rebuild', says: 'They are built with Figma’s Glass effect (refraction, depth, dispersion, frost) over a blurred, noisy colour field and the wavefield texture', uses: 'The file’s own frames rendered at 1600 pixels: 17 patterns and the 6.3 field, with its two lines of type removed. The Glass tool, and the Pattern layout and slide in Make and Decks, draw every pattern live from the file’s shapes and Glass values, in any colourway, rebuilt for each format.', why: 'The tool rebuilds Figma’s Glass effect rather than running it, so its output is close to the guideline, not identical. Compare the two in the tool before client use.' },
    { id: 'patnames', sev: 'check', p: 'Additional Assets', title: 'Patterns have numbers, not names', says: 'Frames 101 to 116 on the Additional Assets page', uses: 'Working family names: Logo field, Soft Glass, Window, Mirror, Lattice, Ring and Tessellation.' },
    { id: 'glasscontrast', sev: 'check', p: '6.3', title: 'White type on the Soft Glass field is low contrast', says: 'The message sits in white on mid blue', uses: 'White, as drawn, at about 2.6:1. Fine for large type; keep messages short and large.' },
    { id: 'balance', sev: 'infer', p: '2.4', title: 'Colour balance is measured from the bars', says: 'Proportion bars without percentages, “a general guide rather than a rigid formula”', uses: 'Widths of the bars: 57% neutral, 20% blue, 23% accent.' },
    { id: 'decks', sev: 'infer', p: '9.0', title: 'There are no deck samples', says: 'The file has web, exhibit and social frames but no slides', uses: 'Slide layouts adapted from the exhibits (gradient reveal, logo on pattern, glass overlay) and the shared layouts.' }],
};

const tone = (name, g, i, g2, kind, card = C.white, m = i) => ({ name, g, i, m, g2, kind, card });
const TONES = {
  'off-white': tone('Off White', C.off, C.black, C.tan, 'neutral', C.white, C.grey), white: tone('White', C.white, C.black, C.off, 'neutral', C.off, C.grey),
  tan: tone('Tan', C.tan, C.black, C.off, 'neutral', C.off, C.grey), black: tone('Brand Black', C.black, C.off, C.grey, 'neutral', C.grey, C.stone),
  blue: tone('telli Blue', C.blue, C.off, C.bright, 'primary', C.bright), pale: tone('Pale Blue', C.pale, C.black, C.white, 'primary'),
  orange: tone('Orange', '#FF480B', C.black, '#FF926D', 'accent'), lavender: tone('Lavender', '#C78CF5', C.black, '#DBADFF', 'accent'),
  forest: tone('Forest', '#304F2E', C.off, '#50BE49', 'accent', '#50BE49'),
  peach: tone('Peach', '#FFC1AD', C.black, '#FF926D', 'accent'), lilac: tone('Lilac', '#EBD2FF', C.black, '#DBADFF', 'accent'), mint: tone('Mint', '#ADEDA9', C.black, '#50BE49', 'accent'),
};
const ALL = Object.keys(TONES);

const u = (n) => `calc(var(--u)*${n})`;
const lockup = (h, extra = '') => `<i class="a-msk" style="--src:var(--logo);height:${h};aspect-ratio:var(--logo-ar,${L.logo[0]}/${L.logo[1]});${extra}"></i>`;
const mark = (h, extra = '') => `<i class="a-msk" style="--src:var(--mark);height:${h};aspect-ratio:var(--mark-ar,${L.mark[0]}/${L.mark[1]});${extra}"></i>`;
const AI = { desk: IMG.desk, sunrise: IMG.sunrise, walk: IMG.walk, bench: IMG.bench, walkers: IMG.walkers, tower: IMG.tower, sitting: IMG.sitting };
const PEOPLE = { studio: IMG.studio, sky: IMG.sky, woman: IMG.woman, beanie: IMG.beanie };
const aiParam = (d = 'bench') => ({ type: 'select', label: 'Image', options: { bench: 1, desk: 1, sunrise: 1, walk: 1, walkers: 1, sitting: 1, tower: 1 }, default: d });
// Gradients (2.5) are built the way the file builds them: a circle of colour 84% of the tile on Off White,
// a layer blur of a fifth of the tile, and 15% white monotone noise. The blurred circle's falloff is precomputed
// (alpha by distance, in tile widths) so it draws as one CSS gradient; tuned against the file's tiles.
const FALL = [[0.829, 0], [0.818, 0.06], [0.785, 0.12], [0.732, 0.18], [0.661, 0.24], [0.576, 0.3], [0.482, 0.36], [0.387, 0.42], [0.296, 0.48], [0.215, 0.54], [0.148, 0.6], [0.096, 0.66], [0.059, 0.72], [0.034, 0.78], [0.019, 0.84], [0.01, 0.9], [0.005, 0.96], [0, 1.14]];
function glow(c, { w = 100, h = 100, cx = w / 2, cy = h / 2, s = Math.min(w, h), noise = 1 } = {}) {
  const R = 1.14 * 1.08 * s, at = `${(cx / w * 100).toFixed(2)}% ${(cy / h * 100).toFixed(2)}%`, size = `${(R / w * 100).toFixed(2)}% ${(R / h * 100).toFixed(2)}%`;
  const stops = (f) => FALL.map(([a, d]) => `${f(a)} ${(d / 1.14 * 100).toFixed(1)}%`).join(',');
  const fill = `radial-gradient(ellipse ${size} at ${at},${stops((a) => `color-mix(in srgb,${c} ${(a * 100).toFixed(1)}%,transparent)`)})`;
  const mask = `radial-gradient(ellipse ${size} at ${at},${stops((a) => `rgba(0,0,0,${a})`)})`;
  return `<div class="a-abs" style="background:${fill},#FBFAF5"></div><div class="a-abs" style="background-image:var(--tnoise);background-size:160px 160px;opacity:${noise};-webkit-mask-image:${mask};mask-image:${mask}"></div>`;
}
// Patterns and Soft Glass are the file's own renders (Figma's Glass effect cannot be drawn live; flag "glass").
// Families and colour names are working names: the file numbers the frames 101 to 116 on Additional Assets.
const PATTERNS = [
  ['101', 'Logo field', 'Pale blue', 'pale'], ['102', 'Logo field', 'Blue', 'pale'], ['103', 'Logo field', 'Orange', 'peach'], ['104', 'Logo field', 'Lavender', 'lilac'], ['105', 'Logo field', 'Forest', 'mint'],
  ['glass61', 'Soft Glass', 'Blue', 'pale'], ['110', 'Soft Glass', 'Orange', 'peach'],
  ['109', 'Window', 'Blue', 'pale'], ['106', 'Window', 'Orange', 'peach'], ['108', 'Window', 'Lavender', 'lilac'], ['107', 'Window', 'Forest', 'mint'],
  ['113', 'Mirror', 'Blue', 'pale'], ['114', 'Lattice', 'Orange', 'peach'], ['115', 'Ring', 'Lavender', 'lilac'], ['116', 'Ring', 'Forest', 'mint'],
  ['111', 'Tessellation', 'Orange', 'peach'], ['112', 'Tessellation', 'Forest', 'mint'],
].map(([k, family, colour, tone]) => ({ k, family, colour, tone, label: `${family} · ${colour}`, src: IMG['pat' + k], frame: k === 'glass61' ? '6.1' : k }));
const PAT = Object.fromEntries(PATTERNS.map((p) => [p.label, p]));
const FAMILIES = [...new Set(PATTERNS.map((p) => p.family))];
// Pattern layouts draw the glass live, from the Glass tool's engine, at the layout's own size.
const GP = Object.fromEntries(GLASS_PATTERNS.map((g) => [glassLabel(g), g]));
const OWN = 'Pattern’s own';
const GCOL = { [OWN]: null, ...Object.fromEntries(GLASS_COLOURS.map((c) => [c.name, c.id])) };
const GTONE = { pale: 'pale', blue: 'pale', orange: 'peach', lavender: 'lilac', forest: 'mint' };
const glassOf = (p) => { const g = GP[p.pattern] ?? GP.Window; return { g, colour: GCOL[p.colourway] ?? g.colour }; };
registerLive('telli-glass', (spec, w, h) => { const k = Math.min(1, 2560 / Math.max(w, h)); return glassImage(glassOpts(spec.pattern, spec.colour, spec.s), w * k, h * k, IMG.wave, L.markPaths ?? []); });
const GLASS_FX = { light: { angle: -45, intensity: 0.8 }, refraction: 100, depth: [47, 80], dispersion: 50, frost: [7, 80], splay: [0, 1], fill: 'Off White at 10 to 60%', note: 'Figma Glass effect values read from the pattern and overlay layers' };
// The 6.3 field: the file's render with its two lines of type removed. Positions are the file's, on a 1375 by 880 frame.
const F63 = { w: 1375, h: 880, photo: [538, 327, 298, 226, 16], card: '#2D6DE6', text: [260, 440, 29.33], word: [1109, 407, 65] };
const glassBox = (soft = true) => `background:${soft ? 'rgba(252,250,245,.78)' : 'rgba(255,255,255,.16)'};border:1px solid rgba(255,255,255,${soft ? '.9' : '.5'});box-shadow:0 ${u(1)} ${u(4)} rgba(20,30,60,.14);border-radius:${u(2.4)}`;
const avatar = (size, bg = C.blue, ink = C.off) => `<div style="flex:none;width:${size};aspect-ratio:1;border-radius:22%;background:${bg};color:${ink};display:grid;place-items:center">${mark('56%')}</div>`;
const fit = (n, lo, hi, len) => Math.min(hi, Math.max(lo, n / Math.max(1, len))).toFixed(2);
const longest = (s) => Math.max(...String(s).split('\n').map((l) => l.length), 1);

const T = [
  { id: 'telli-reveal', name: 'Gradient reveal', kind: 'telli', src: '6.5', minText: 1.6, use: 'An AI image that dissolves into Off White, with the logo and one line in Tiempos', u: (w, h) => Math.min(w, h) / 80,
    params: { line: { type: 'textarea', label: 'Line', max: 110, default: 'The #1 AI voice platform for\nagents that sell, support and\noperate - across millions of calls.' }, image: aiParam('bench'),
      side: { type: 'select', label: 'Image from', options: { right: 1, left: 1 }, default: 'right' }, tone: { type: 'tone', label: 'Tone', options: ['off-white', 'white', 'tan'], default: 'off-white' }, format: formatParam(['landscape', 'portrait', 'square', 'tall', 'banner'], '16:9') },
    draw: (p, w, h) => { const wide = w / h > 1.15, right = p.side === 'right', U = Math.min(w, h) / 80, avail = (wide ? w * 0.44 : w - 10 * U) / U, size = Math.min(wide ? 5.4 : 4.8, Math.max(2.4, avail / (longest(p.line) * 0.5))).toFixed(2);
      const img = wide ? `<div style="position:absolute;top:0;bottom:0;${right ? 'right:0' : 'left:0'};width:${w / h > 2.1 ? 46 : 58}%;-webkit-mask-image:linear-gradient(to ${right ? 'right' : 'left'},transparent 0%,#000 46%);mask-image:linear-gradient(to ${right ? 'right' : 'left'},transparent 0%,#000 46%)"><img class="a-ph" src="${AI[p.image]}" alt=""></div>`
        : `<div style="position:absolute;left:0;right:0;bottom:0;height:62%;-webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 40%);mask-image:linear-gradient(to bottom,transparent 0%,#000 40%)"><img class="a-ph" src="${AI[p.image]}" alt=""></div>`;
      const text = `<div class="a-abs" style="padding:${u(5)};display:flex;flex-direction:column;justify-content:${wide ? 'space-between' : 'flex-start'};gap:${u(4)};${wide && !right ? 'align-items:flex-end;text-align:right' : ''}">${lockup(u(3.4), `align-self:${wide && !right ? 'flex-end' : 'flex-start'}`)}<div class="a-sub" style="font-size:${u(size)};max-width:${wide ? '48%' : '100%'}">${esc(p.line)}</div></div>`;
      return img + text; } },
  { id: 'telli-glass', name: 'Logo on Soft Glass', kind: 'telli', src: '6.3', minText: 2.6, use: 'An agent or announcement on the 6.3 Soft Glass field, with a portrait in the logomark’s window', u: (w, h) => Math.min(w, h) / 80, toneOf: () => 'blue',
    params: { message: { type: 'textarea', label: 'Message', max: 60, default: 'John, your Customer Support\ndemo agent is ready' }, photo: { type: 'select', label: 'Portrait', options: { studio: 1, sky: 1, woman: 1, beanie: 1, none: 1 }, default: 'studio' },
      wordmark: { type: 'select', label: 'Wordmark', options: { show: 1, hide: 1 }, default: 'show' }, format: formatParam(['landscape', 'square', 'portrait', 'tall'], '16:9') },
    draw: (p, w, h) => { const R = F63.w / F63.h, wide = w / h >= 1.5, W = w / h > R ? w : h * R, H = W / R, k = W / F63.w, ox = (w - W) / 2, oy = (h - H) / 2, ph = PEOPLE[p.photo], X = (v) => (ox + v * k).toFixed(1), Y = (v) => (oy + v * k).toFixed(1);
      const [px, py, pw, phh, pr] = F63.photo, [tx, ty, ts] = F63.text, [wx, wy, wh] = F63.word, U = Math.min(w, h) / 80, m = 2 * U;
      const word = (style) => `<div style="${style};aspect-ratio:${(313.3 / L.logo[1]).toFixed(3)};overflow:hidden;color:${C.off}">${lockup('100%', 'position:absolute;right:0;top:0')}</div>`;
      const msg = (style, size) => `<div class="a-body" style="${style};font-size:${size};line-height:1.1;letter-spacing:-.04em;color:#fff;text-align:center;white-space:pre-line;overflow-wrap:anywhere">${esc(p.message)}</div>`;
      const left = Math.max(m, ox + (tx - 240) * k), right = Math.min(w - m, ox + (tx + 240) * k);
      return `<img src="${IMG.f63}" alt="" style="position:absolute;left:${X(0)}px;top:${Y(0)}px;width:${W.toFixed(1)}px;height:${H.toFixed(1)}px;max-width:none">
        <div style="position:absolute;left:${X(px)}px;top:${Y(py)}px;width:${(pw * k).toFixed(1)}px;height:${(phh * k).toFixed(1)}px;border-radius:${(pr * k).toFixed(1)}px;overflow:hidden;background:${F63.card}">${ph ? `<img class="a-ph" src="${ph}" alt="">` : `<div class="a-abs" style="display:grid;place-items:center;color:${C.off}">${mark(`${(phh * k * 0.42).toFixed(1)}px`)}</div>`}</div>
        <img src="${IMG.f63badge}" alt="" style="position:absolute;left:${X(744)}px;top:${Y(293)}px;width:${(126 * k).toFixed(1)}px;height:${(126 * k).toFixed(1)}px">
        ${wide ? msg(`position:absolute;left:${left.toFixed(1)}px;width:${(right - left).toFixed(1)}px;top:${Y(ty)}px;transform:translateY(-50%)`, `${(ts * k).toFixed(1)}px`) : ''}
        ${wide && p.wordmark === 'show' ? word(`position:absolute;left:${X(wx)}px;top:${Y(wy)}px;height:${(wh * k).toFixed(1)}px`) : ''}
        ${wide ? '' : `${p.wordmark === 'show' ? word(`position:absolute;left:50%;top:${u(7)};transform:translateX(-50%);height:${u(5.2)}`) : ''}${msg(`position:absolute;left:8%;right:8%;bottom:${u(8)}`, u(2.8))}`}`; } },
  { id: 'telli-chat', name: 'Glass overlay', kind: 'telli', src: '6.4', minText: 1.9, use: 'A conversation moment in glass containers over an AI image, built to 6.4', u: (w, h) => Math.min(w, h) / 80,
    params: { agent: { type: 'textarea', label: 'Agent says', max: 110, default: 'Hi Sarah, I saw you were looking at our Solar + battery package back in March, want to pick that up?' },
      caller: { type: 'textarea', label: 'Caller says', max: 150, default: 'Yes! Thanks for reminding me, I’d love to schedule a time for pick-up. Can you provide me with available windows so I can add to my calendar?' },
      image: aiParam('walkers'), photo: { type: 'select', label: 'Caller', options: { woman: 1, studio: 1, sky: 1, beanie: 1 }, default: 'woman' }, tone: { type: 'tone', label: 'Glass', options: ['off-white'], default: 'off-white' }, format: formatParam(['landscape', 'portrait', 'square', 'tall'], '16:9') },
    // 6.4 on a 668 by 421 frame: glass is Off White at 60% with Figma's Glass effect and a 5px shadow at 15%; panels 260 wide, tiles 63 with 50 insets; type 10.5 on 14.7.
    draw: (p, w, h) => { const wide = w / h > 1.15, g = Math.min(w * (wide ? 0.62 : 0.86) / 376, h * (wide ? 0.66 : 0.5) / 271), q = (n) => `${(n * g).toFixed(2)}px`;
      const glass = (r) => `background:rgba(252,250,245,.6);-webkit-backdrop-filter:blur(${q(6)});backdrop-filter:blur(${q(6)});border-radius:${q(r)};box-shadow:0 0 ${q(5)} rgba(0,0,0,.15),inset ${q(1)} ${q(1)} 0 rgba(255,255,255,.75),inset -${q(0.6)} -${q(0.6)} 0 rgba(255,255,255,.35)`;
      const tile = (pos, inner) => `<div style="position:absolute;${pos};width:${q(63)};height:${q(63)};${glass(14)};display:grid;place-items:center"><div style="width:${q(50)};height:${q(50)};border-radius:${q(11)};background:${C.off};box-shadow:0 0 ${q(5)} rgba(0,0,0,.15);overflow:hidden;position:relative;display:grid;place-items:center">${inner}</div></div>`;
      const panel = (text, extra, t) => `<div style="position:relative;width:${q(260)};${extra};${glass(9)};padding:${q(13)} ${q(10)} ${q(14)} ${q(17)}"><div class="a-body" style="font-size:${q(10.5)};line-height:1.4;letter-spacing:-.04em;color:${C.black}">${esc(text)}</div>${t}</div>`;
      return `<img class="a-ph" src="${AI[p.image]}" alt="">
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${q(376)};padding:${q(56)} 0 ${q(57)} ${q(58)};display:flex;flex-direction:column;gap:${q(18)}">
          ${panel(p.agent, '', tile(`left:-${q(58)};top:-${q(56)}`, `<img src="${IMG.charlie}" alt="" style="width:${q(30)};height:${q(30)};object-fit:contain">`))}
          ${panel(p.caller, '', tile(`right:-${q(58)};bottom:-${q(57)}`, `<img class="a-ph" src="${PEOPLE[p.photo]}" alt="">`))}</div>`; } },
  { id: 'telli-hero', name: 'Website hero', kind: 'telli', src: '8.1', minText: 1.5, use: 'A headline and a sign-up field over an AI image, framed on the textured field', u: (w, h) => Math.min(w, h) / 80,
    params: { headline: { type: 'textarea', label: 'Headline', max: 48, default: 'Every customer call,\nhandled by AI.' }, field: { type: 'text', label: 'Field', max: 28, default: 'What’s your work email?' }, button: { type: 'text', label: 'Button', max: 18, default: 'Book a demo' },
      image: aiParam('tower'), tone: { type: 'tone', label: 'Tone', options: ['off-white', 'tan'], default: 'off-white' }, format: formatParam(['landscape', 'square', 'portrait'], '16:9') },
    draw: (p, w, h) => { const wide = w / h > 1.15, size = fit(wide ? 120 : 100, 4, wide ? 6.4 : 6, longest(p.headline));
      return `<img class="a-ph" src="${IMG.texture}" alt="" style="opacity:.9">
        <div style="position:absolute;inset:${wide ? '17% 17%' : '12% 9%'};border-radius:${u(3)};overflow:hidden;box-shadow:0 ${u(1)} ${u(5)} rgba(30,40,60,.12)"><img class="a-ph" src="${AI[p.image]}" alt="">
          <div class="a-abs" style="display:flex;flex-direction:column;align-items:center;justify-content:${wide ? 'center' : 'flex-start'};padding:${u(wide ? 3 : 8)} ${u(4)};gap:${u(3)};text-align:center;color:${C.white}">
            <div class="a-h" style="font-size:${u(size)};text-shadow:0 0 ${u(3)} rgba(0,30,90,.18)">${esc(p.headline)}</div>
            <div style="display:flex;gap:${u(0.8)};align-items:center"><div class="a-body" style="background:${C.white};color:${C.grey};border-radius:99em;padding:${u(0.9)} ${u(1.8)};font-size:${u(1.5)};min-width:${u(18)};text-align:left">${esc(p.field)}</div><div style="background:${C.black};color:${C.off};border-radius:99em;padding:${u(0.9)} ${u(1.8)};font-size:${u(1.5)};font-weight:500">${esc(p.button)}</div></div></div></div>`; } },
  { id: 'telli-gradient', name: 'Gradient poster', kind: 'telli', src: '2.5', minText: 1.6, use: 'A headline over a soft radial gradient from the palette', u: (w, h) => Math.min(w, h) / 80,
    params: { eyebrow: { type: 'text', label: 'Eyebrow', max: 28, default: 'Welcome to telli' }, headline: { type: 'textarea', label: 'Headline', max: 60, default: 'Every customer call,\nhandled by AI.' }, footer: { type: 'text', label: 'Footer', max: 40, default: 'telli.com' },
      gradient: { type: 'select', label: 'Gradient', options: Object.fromEntries([...GRAD.saturated, ...GRAD.soft].map(([n, c]) => [n, c])), default: 'Blue' },
      tone: { type: 'tone', label: 'Ground', options: ['off-white', 'white'], default: 'off-white' }, format: formatParam(['portrait', 'square', 'tall', 'landscape', 'banner'], '4:5') },
    draw: (p, w, h) => { const c = Object.fromEntries([...GRAD.saturated, ...GRAD.soft])[p.gradient] ?? C.blue, wide = w / h > 1.15, size = fit(wide ? 150 : 120, 4.4, 8.4, longest(p.headline));
      return `${glow(c, { w, h, cx: wide ? w * 0.7 : w * 0.62, cy: wide ? h * 0.5 : h * 0.6, s: Math.min(w, h) * (wide ? 1.15 : 1.05) })}
        <div class="a-abs" style="padding:${u(5)};display:flex;flex-direction:column;justify-content:space-between">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-top:1px solid ${C.black}40;padding-top:${u(1.6)}">${p.eyebrow ? `<div class="a-mono" style="font-size:${u(1.6)}">${esc(p.eyebrow)}</div>` : '<span></span>'}${mark(u(3.6))}</div>
          <div style="display:flex;flex-direction:column;gap:${u(2)};${wide ? 'max-width:56%' : ''}"><div class="a-h" style="font-size:${u(size)}">${esc(p.headline)}</div>${p.footer ? `<div class="a-body" style="font-size:${u(1.7)}">${esc(p.footer)}</div>` : ''}</div></div>`; } },
  { id: 'telli-pattern', name: 'Pattern', kind: 'telli', src: '6.2', minText: 1.6, use: 'A headline on any of the guideline’s patterns, drawn live in any colourway and rebuilt for every format', u: (w, h) => Math.min(w, h) / 80, toneOf: (p) => GTONE[glassOf(p).colour] ?? 'pale',
    params: { pattern: { type: 'select', label: 'Pattern', options: Object.fromEntries(Object.keys(GP).map((k) => [k, 1])), default: 'Window' },
      colourway: { type: 'select', label: 'Colourway', options: Object.fromEntries(Object.keys(GCOL).map((k) => [k, 1])), default: OWN },
      glass: { type: 'data', label: 'Glass', default: null, clean: cleanGlass, clearLabel: 'Use the guideline’s glass',
        about: (v, p) => (v?.for === glassOf(p).g.id ? 'Light, refraction, depth, dispersion, frost and framing were set in the Glass tool for this pattern.' : null) },
      eyebrow: { type: 'text', label: 'Eyebrow', max: 28, default: 'Welcome to telli' }, headline: { type: 'textarea', label: 'Headline', max: 60, default: 'Every customer call,\nhandled by AI.' }, footer: { type: 'text', label: 'Footer', max: 40, default: 'telli.com' },
      format: formatParam(['landscape', 'portrait', 'square', 'tall', 'banner'], '16:9') },
    // Saved before patterns were live: "Window · Blue" named a family and a colour; each maps to the frame it was.
    migrate: (raw) => { const old = PAT[raw.pattern]; if (!old || GP[raw.pattern]) return raw;
      const g = old.family === 'Logo field' ? GLASS_PATTERNS.find((x) => x.id === 'logo-field') : GLASS_PATTERNS.find((x) => x.frame === old.frame) ?? GP.Window;
      const c = GLASS_COLOURS.find((x) => x.name === old.colour)?.id ?? g.colour;
      return { ...raw, pattern: glassLabel(g), colourway: c === g.colour ? OWN : GLASS_COLOURS.find((x) => x.id === c).name }; },
    draw: (p, w, h) => { const { g, colour } = glassOf(p), logo = g.id !== 'logo-field', wide = w / h > 1.15, size = fit(wide ? 150 : 120, 4.4, wide ? 7.4 : 8.4, longest(p.headline));
      const ref = g.ref?.[colour] && w / h > 1.5 && w / h < 2 ? IMG[g.ref[colour]] : '', col = GLASS_COLOURS.find((c) => c.id === colour);
      return `${glow(col.ell, { w, h, cx: w / 2, cy: h / 2, s: Math.min(w, h) * 1.1 })}${liveImg('telli-glass', { pattern: g.id, colour, s: p.glass?.for === g.id ? p.glass : null }, w, h, ref)}
        <div class="a-abs" style="padding:${u(5)};display:flex;flex-direction:column;justify-content:space-between;color:${C.black}">
          <div style="display:flex;justify-content:space-between;align-items:center;min-height:${u(3.2)};border-top:1px solid ${C.black}4d;padding-top:${u(1.6)}">${p.eyebrow ? `<div class="a-mono" style="font-size:${u(1.6)}">${esc(p.eyebrow)}</div>` : '<span></span>'}${logo ? lockup(u(3.2)) : ''}</div>
          <div style="display:flex;flex-direction:column;gap:${u(1.6)};${wide ? 'max-width:52%' : ''}">${p.headline ? `<div class="a-h" style="font-size:${u(size)}">${esc(p.headline)}</div>` : ''}${p.footer ? `<div class="a-body" style="font-size:${u(1.7)}">${esc(p.footer)}</div>` : ''}</div></div>`; } },
  { id: 'telli-agents', name: 'Agent picker', kind: 'telli', src: '7.2', minText: 1.6, use: 'Up to three agents, each in the logomark container in its own colour', u: (w, h) => Math.min(w, h) / 80,
    params: { title: { type: 'text', label: 'Title', max: 28, default: 'Choose an Agent' },
      agents: { type: 'list', label: 'Agents', item: 'agent', min: 1, max: 3, fields: [{ key: 'name', label: 'Name', max: 16, hint: 'Emma' }, { key: 'role', label: 'Role', max: 28, hint: 'Lead Qualification' }], default: AGENTS.map(({ name, role }) => ({ name, role })) },
      tone: { type: 'tone', label: 'Tone', options: ['off-white', 'white', 'tan', 'pale'], default: 'off-white' }, format: formatParam(['square', 'portrait', 'landscape'], '1:1') },
    draw: (p, w, h) => { const list = p.agents.slice(0, 3), wide = w / h > 1.15;
      const row = (a, i) => { const k = AGENTS[i % 3]; return `<div style="display:flex;align-items:center;gap:${u(2.4)};padding:${u(2)} ${u(2.4)};background:${C.white};border-radius:${u(1.6)};border:1px solid ${i ? C.tan : C.blue}">
        <div style="flex:none;height:${u(7)};aspect-ratio:205/207;color:${k.hex};position:relative">${mark('100%')}<div style="position:absolute;inset:0;display:grid;place-items:center;color:${k.ink};font-weight:500;font-size:${u(2.4)}">${esc((a.name || '?').trim()[0] || '')}</div></div>
        <div style="flex:1;min-width:0"><div style="font-size:${u(2.6)};font-weight:500;letter-spacing:-.02em;line-height:1.15">${esc(a.name)}</div><div class="a-body" style="font-size:${u(1.7)};color:${C.grey};margin-top:.3em">${esc(a.role)}</div></div>
        <div style="flex:none;width:${u(2.4)};height:${u(2.4)};border-radius:50%;border:1px solid ${i ? C.stone : C.blue};${i ? '' : `box-shadow:inset 0 0 0 ${u(0.5)} ${C.white};background:${C.blue}`}"></div></div>`; };
      return `<div class="a-abs" style="padding:${u(wide ? 5 : 6)};display:flex;${wide ? 'gap:' + u(5) + ';align-items:center' : 'flex-direction:column;gap:' + u(3) + ';justify-content:center'}">
        <div style="${wide ? 'flex:.8' : ''};display:flex;flex-direction:column;gap:${u(2)}">${mark(u(4), 'align-self:flex-start;color:' + C.blue)}<div class="a-sub" style="font-size:${u(5)}">${esc(p.title)}</div></div>
        <div style="${wide ? 'flex:1' : ''};display:flex;flex-direction:column;gap:${u(1.4)}">${list.map(row).join('')}</div></div>`; } },
];
T.push(...sharedTemplates({ src: { statement: '9.0', quote: '9.0' }, TONES, tones: ALL, photos: { bench: IMG.bench, desk: IMG.desk, studio: IMG.studio, sky: IMG.sky }, mark,
  iconTones: ['blue', 'black', 'off-white', 'pale', 'orange', 'forest'],
  frames: { plain: 1 },
  defaults: { iconTone: 'blue', headline: 'Every customer call,\nhandled by AI.', eyebrow: 'Welcome to telli', footer: 'telli.com', tone: 'off-white', quoteEyebrow: 'Customers', quote: 'The #1 AI voice platform for agents that sell, support and operate - across millions of calls.', quoteName: 'telli', quoteRole: 'AI voice agents', photo: 'bench', quoteTone: 'off-white',
    figureTag: 'In numbers', figure: '1M+', figureLabel: 'calls handled by telli agents.', figureSource: '', figureTone: 'pale', coverTag: 'Welcome to telli', coverHeadline: 'Your cells, supercharged.', coverBody: 'AI voice agents that sell, support and operate, so every customer call is answered.' } }));

/* ---------- Slide layouts: the guideline has no deck samples, so slides are adapted from its exhibits (flag "decks") ---------- */
const TID = Object.fromEntries(T.map((t) => [t.id, t]));
const SL = [
  { id: 'sl-telli-title', name: 'Title', kind: 'Deck', src: '9.6', use: 'Opening slide: a large Diatype title, the logo and a date over a soft field', u: (w, h) => h / 100, size: SLIDE,
    params: { title: { type: 'textarea', label: 'Title', max: 48, default: 'Quarterly\nupdate' }, date: { type: 'text', label: 'Date', max: 32, default: 'August 14, 2026' },
      gradient: { type: 'select', label: 'Gradient', options: Object.fromEntries([...GRAD.soft, ...GRAD.saturated].map(([n, c]) => [n, c])), default: 'Pale blue' }, tone: { type: 'tone', label: 'Ground', options: ['off-white', 'white'], default: 'off-white' } },
    draw: (p) => { const c = Object.fromEntries([...GRAD.saturated, ...GRAD.soft])[p.gradient] ?? C.pale;
      return `${glow(c, { w: 1920, h: 1080, cx: 1500, cy: 430, s: 1250 })}<div class="a-abs" style="padding:${u(5)} ${u(5.5)};display:flex;flex-direction:column;justify-content:space-between">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${C.black}40;padding-bottom:${u(2)}">${lockup(u(4))}<div class="a-mono" style="font-size:${u(1.8)}">${esc(p.date)}</div></div>
        <div class="a-h" style="font-size:${u(Math.min(16, Math.max(9, 150 / longest(p.title))).toFixed(2))}">${esc(p.title)}</div></div>`; } },
  { id: 'sl-telli-points', name: 'Three points', kind: 'Deck', src: '9.4', use: 'A headline over three short points divided by hairlines', u: (w, h) => h / 100, size: SLIDE,
    params: { headline: { type: 'textarea', label: 'Headline', max: 70, default: 'Every call ends with\na structured outcome' },
      points: { type: 'list', label: 'Points', item: 'point', min: 1, max: 3, fields: [{ key: 'text', label: 'Point', max: 64 }], default: [{ text: 'Intelligent routing based on caller intent' }, { text: 'Conversation summaries delivered before transfer' }, { text: 'Automatic call logs and structured outcomes' }] },
      tone: { type: 'tone', label: 'Tone', options: ['off-white', 'white', 'pale', 'black'], default: 'off-white' } },
    draw: (p) => { const pts = p.points.slice(0, 3);
      return `<div class="a-abs" style="padding:${u(6)} ${u(5.5)};display:flex;flex-direction:column;justify-content:space-between">
        <div class="a-h" style="font-size:${u(7.6)};max-width:70%">${esc(p.headline)}</div>
        <div style="display:grid;grid-template-columns:repeat(${pts.length},1fr)">${pts.map((x, i) => `<div style="border-left:1px solid currentColor;${i ? '' : ''}padding:${u(1)} ${u(3)} 0;display:flex;flex-direction:column;gap:${u(5)};min-height:${u(26)};justify-content:space-between"><div class="a-mono" style="font-size:${u(1.8)};opacity:.7">0${i + 1}</div><div class="a-sub" style="font-size:${u(3.4)}">${esc(x.text)}</div></div>`).join('')}</div></div>`; } },
  asSlide(TID['telli-reveal'], {}, {}, { kind: 'Deck', use: 'A statement beside an AI image that dissolves into the page' }),
  asSlide(TID['telli-glass'], {}, {}, { kind: 'Deck', use: 'An agent or announcement in the Soft Glass field' }),
  asSlide(TID['telli-chat'], {}, {}, { kind: 'Deck', use: 'A conversation moment in glass over an AI image' }),
  asSlide(TID['telli-gradient'], {}, {}, { kind: 'Deck', use: 'A section break on a soft gradient' }),
  asSlide(TID['telli-pattern'], {}, {}, { kind: 'Deck', use: 'A section break or close on one of the file’s patterns' }),
  asSlide(TID.quote, { format: '16:9' }, {}, { kind: 'Deck' }), asSlide(TID.figure, { format: '16:9' }, {}, { kind: 'Deck' }),
];
// The wordmark is always lowercase, also inside uppercase eyebrows (3.2 sets “WELCOME TO telli”).
const lower = (html) => html.replace(/>([^<]+)</g, (m, txt) => '>' + txt.replace(/\btelli\b/gi, '<span style="text-transform:none">telli</span>') + '<');
for (const t of [...T, ...SL.filter((x) => !TID[x.id.slice(3)])]) { const d = t.draw; t.draw = (p, w, h) => lower(d(p, w, h)); }
const STARTER = [['sl-telli-title', {}], ['sl-telli-reveal', {}], ['sl-telli-points', {}], ['sl-telli-chat', {}], ['sl-figure', {}], ['sl-telli-glass', {}], ['sl-telli-pattern', { pattern: 'Logo field', headline: 'Thank you.', eyebrow: '', footer: 'telli.com' }]];

/* ---------- Guideline surfaces ---------- */
const S = (cls, style, inner) => `<div class="a ${cls}" data-brand="telli" style="${style}">${inner}</div>`;
const tile = (g, i, inner, cap, extra = '') => S('pb-tile', `--g:${g};--i:${i};${extra}`, `${inner}${cap ? `<span class="cap">${cap}</span>` : ''}`);
const photo = (src, alt, extra = '') => `<div class="pb-tile" style="${extra}"><img src="${src}" alt="${alt}"></div>`;
const byWidth = (src, w, ratio, extra = '') => `<i class="a-msk" style="--src:var(--${src});width:${w};aspect-ratio:${ratio};${extra}"></i>`;
const LR = `var(--logo-ar,${L.logo[0]}/${L.logo[1]})`, MR = `var(--mark-ar,${L.mark[0]}/${L.mark[1]})`;
const pic = (k) => ({ name: `telli-${k}.jpg`, uri: IMG[k] });
function guide() {
  const ty = BRAND.type, g = BRAND.graphics, im = BRAND.imagery, d = (k) => [D[k].text], more = (k) => D[k].more[0];
  const rule = (i) => BRAND.logo.rules[i], crule = (i) => BRAND.color.rules[i];
  const wide = 'aspect-ratio:16/9';
  const sample = (s) => s.id === 'tag' ? `<span class="a-mono" style="font-size:13px">${s.sample}</span>` : s.id === 'headline' ? `<div class="a-h" style="font-size:clamp(34px,5vw,68px)">${s.sample}</div>` : s.id === 'subhead' ? `<div class="a-sub" style="font-size:clamp(20px,2.4vw,30px);max-width:24em">${s.sample}</div>` : s.id === 'body' ? `<div class="a-body" style="font-size:17px;max-width:36em">${s.sample}</div>`
    : `<span style="display:inline-flex;gap:8px;font-weight:500;font-size:14px;flex-wrap:wrap">${[[C.black, C.off], [C.tan, C.black], [C.blue, C.off]].map((b) => `<span style="background:${b[0]};color:${b[1]};padding:10px 18px;border-radius:99em">Book a demo</span>`).join('')}</span>`;
  const big = (css, name, note) => ({ html: S('', '--g:transparent;--i:var(--neutral-10);overflow:visible', `<div style="font-family:${css};font-size:clamp(34px,6vw,76px);line-height:1.05;letter-spacing:-.04em;font-weight:${css.includes('--sf') ? 400 : 500}">${name}</div>`), note });
  const neutrals = BRAND.color.neutrals.map((c) => swatchOf(c)), blues = BLUES.map((c) => swatchOf(c)), primary = [...neutrals, ...blues];
  const accents = [0, 1, 2].flatMap((r) => ACCENTS.map((a) => swatchOf({ name: r === 2 ? `${a.name} tint` : r ? `${a.name} light` : a.name, hex: a.steps[r] })));
  const logoFiles = [['logo', 'logo'], ['mark', 'logomark']].flatMap(([k, n]) => [{ name: `telli-${n}-off-black.png`, brand: 'telli', css: `--${k}`, color: C.black }, { name: `telli-${n}-off-white.png`, brand: 'telli', css: `--${k}`, color: C.off }]);
  const svgFiles = [['logo', 'telli-logo.svg'], ['mark', 'telli-logomark.svg'], ['charlie', 'telli-charlie.svg']].map(([k, n]) => ({ name: n, uri: IMG[k] }));
  const face = (s) => (s.face.startsWith('Tiempos') ? '"Tiempos Text","Tiempos","Source Serif 4",serif' : '"ABC Diatype","Inter Tight",sans-serif');
  const gradTile = (n, c) => tile(C.off, C.black, glow(c), `${n} · ${c}`, 'aspect-ratio:1');
  const patTile = (pt, ratio = '16/9') => `<div class="pb-tile" style="aspect-ratio:${ratio}"><img src="${pt.src}" alt="${pt.label} pattern"><span class="cap">${pt.colour} · ${pt.frame}</span></div>`;
  const patFiles = PATTERNS.map((pt) => ({ name: `telli-pattern-${pt.family.toLowerCase().replace(/\s+/g, '-')}-${pt.colour.toLowerCase().replace(/\s+/g, '-')}.jpg`, uri: pt.src }));
  const fonts = () => { const a = fontState(TELLI, 'font-sans'), b = fontState(TELLI, 'font-serif'), note = (l, have, alt) => l ? (l === 'trial' ? 'Trial files added in Assets' : `Font files added in Assets · ${LICENCES[l]} licence`) : have ? 'Installed on this machine' : `Shown in ${alt}, a stand-in`; return [big('var(--bf)', 'ABC Diatype', note(a, diatype, 'Inter Tight')), big('var(--sf)', 'Tiempos', note(b, tiempos, 'Source Serif 4'))]; };
  return {
    hero: S('pb-hero', `--g:${C.off};--i:${C.black};--hw:11em`, `<div class="pb-hero-media" data-place="fade"><img class="a-ph" src="${IMG.bench}" alt="Two people on a bench above a golden field, under a wide blue sky"></div>${lockup('30px')}<h1 class="a-sub">The #1 AI voice platform for agents that sell, support and operate.</h1><div class="meta a-mono"><span>Figma file</span><span>${BRAND.meta.pages} frames</span><span>${BRAND.meta.edition}</span></div>`),
    intro: { text: D['0.0'].text, num: '0.0', ref: '' },
    chapters: [
      { id: 'logo', title: 'Logo', num: '1.0', items: [
        { id: 'logo', title: 'Logo system', num: '1.1', desc: d('1.1'), path: 'logo.assets',
          blocks: [{ k: 'tiles', cols: 3, html: [tile(C.off, C.black, byWidth('logo', '62%', LR), 'Logo'), tile(C.black, C.off, byWidth('mark', '24%', MR), 'Logomark'), tile(C.off, C.black, `<img src="${IMG.charlie}" alt="" style="position:relative;width:28%;height:auto">`, 'Charlie')] }],
          files: [...svgFiles, ...logoFiles], rules: [], data: { assets: BRAND.logo.assets, files: [...svgFiles, ...logoFiles].map((f) => f.name), format: 'SVG, exported from the file' } },
        { id: 'clearspace', title: 'Clearspace', num: '1.2', desc: d('1.2'), path: 'logo.clearSpace',
          blocks: [{ k: 'tiles', cols: 1, html: [tile(C.tan, C.black, `<div style="position:relative;width:44%;aspect-ratio:${LR}">${byWidth('logo', '100%', LR)}<div style="position:absolute;inset:-50% -13.2%;border:1px dashed ${C.black}"></div></div>`, 'About half the logo height on every side', wide)] }],
          rules: [rule(3), rule(4)], data: { clearSpace: { value: 0.5, unit: 'logo height', rule: 'double the gap between logomark and wordmark' } } },
        { id: 'avatars', title: 'Favicon and avatars', num: '1.3', desc: d('1.3'), details: more('1.3'), path: 'logo.avatar',
          blocks: [{ k: 'tiles', cols: 2, html: [tile(C.tan, C.black, `<div style="height:46%;aspect-ratio:1;border-radius:22%;background:${C.blue};color:${C.off};display:grid;place-items:center">${mark('54%')}</div>`, 'Contained avatar'), tile(C.off, C.black, mark('30%'), 'Logomark')] }],
          rules: [rule(5)], data: { avatar: { background: C.blue, logomark: C.off } } },
        { id: 'logocolours', title: 'Logo colors', num: '1.4', desc: d('1.4'), details: more('1.4'), path: 'logo.colours',
          blocks: [{ k: 'tiles', cols: 2, html: [tile(C.off, C.black, byWidth('logo', '62%', LR), 'Off black on light'), tile(C.black, C.off, byWidth('logo', '62%', LR), 'Off white on dark')] }],
          rules: [rule(0), rule(1), rule(2)], data: { offBlack: C.black, offWhite: C.off } },
        { id: 'misuse', title: 'Logo misuse', num: '1.5', desc: d('1.5'), path: 'logo.never',
          blocks: [{ k: 'donts', items: BRAND.logo.never }], rules: BRAND.logo.never.map((t) => ({ t: 'Never: ' + t[0].toLowerCase() + t.slice(1), b: 'stated', p: '1.5' })), data: { never: BRAND.logo.never } }] },
      { id: 'colour', title: 'Color', num: '2.0', items: [
        { id: 'neutral', title: 'Neutral colors', num: '2.1', desc: d('2.1'), path: 'color.neutrals',
          blocks: [{ k: 'swatches', cols: 6, items: neutrals }], files: [{ name: 'telli-colours.json', text: JSON.stringify([...primary, ...accents], null, 2) }], copy: { label: 'Copy CSS', text: cssVars([...primary, ...accents]) },
          rules: [crule(0)], flags: ['names'], data: { neutrals } },
        { id: 'primary', title: 'Primary colors', num: '2.2', desc: d('2.2'), path: 'color.primary',
          blocks: [{ k: 'swatches', cols: 3, items: blues }], rules: [crule(1)], flags: ['names'], data: { primary: blues } },
        { id: 'accent', title: 'Accent colors', num: '2.3', desc: d('2.3'), path: 'color.accents',
          blocks: [{ k: 'swatches', cols: 3, short: true, items: accents }], rules: [crule(2)], flags: ['labels'], data: { accents: ACCENTS } },
        { id: 'balance', title: 'Color balance', num: '2.4', desc: d('2.4'), path: 'color.balance',
          blocks: [{ k: 'balance', legend: [{ label: 'Neutral', pct: 57 }, { label: 'Primary blue', pct: 20 }, { label: 'Accent', pct: 23 }], parts: [{ hex: C.off, w: 28.4 }, { hex: C.black, w: 28.4 }, { hex: C.blue, w: 20 }, { hex: '#FF480B', w: 7.7 }, { hex: '#C78CF5', w: 7.8 }, { hex: '#304F2E', w: 7.7 }] }],
          rules: [crule(3)], flags: ['balance'], data: { balance: BRAND.color.balance } },
        { id: 'gradients', title: 'Gradients', num: '2.5', desc: d('2.5'), path: 'color.gradients', make: 'telli-gradient',
          blocks: [{ k: 'tiles', label: 'Saturated', cols: 4, html: GRAD.saturated.map(([n, c]) => gradTile(n, c)) }, { k: 'tiles', label: 'Soft', cols: 4, html: GRAD.soft.map(([n, c]) => gradTile(n, c)) }],
          rules: [crule(4), crule(5)], data: { gradients: GRAD, construction: 'radial blur of one colour into Off White' } }] },
      { id: 'type', title: 'Typography', num: '3.0', items: [
        { id: 'fonts', title: 'Brand fonts', num: '3.1', desc: d('3.1'), path: 'type.families',
          get blocks() { return [{ k: 'specimen', rows: fonts() }]; }, rules: [], flags: ['diatype', 'tiempos', 'ivory'], data: { families: ty.families } },
        { id: 'typesetting', title: 'Typesetting', num: '3.2', desc: d('3.2'), path: 'type.styles',
          blocks: [{ k: 'specs', rows: ty.styles.map((s) => ({ meta: [s.name, s.face, `Tracking ${s.tracking} · Leading ${s.leading}`, ...(s.extra ? [s.extra] : [])], html: S('', '--g:transparent;--i:var(--neutral-10);overflow:visible', sample(s)) })) }],
          copy: { label: 'Copy CSS', text: typeCss(ty.styles, face) },
          rules: ty.styles.map((s) => ({ t: `${s.name}: ${s.face}, tracking ${s.tracking}, leading ${s.leading}`, b: 'stated', p: '3.2' })), data: { styles: ty.styles.map(({ sample: _, ...s }) => s) } }] },
      { id: 'photography', title: 'Photography', num: '4.0', items: [
        { id: 'photography', title: 'Photography', num: '4.1', desc: d('4.1'), path: 'photography',
          blocks: [{ k: 'tiles', cols: 4, html: [photo(IMG.sky, 'Man in a beige coat against a cloudy sky', 'aspect-ratio:3/4'), photo(IMG.studio, 'Bearded man in warm studio light', 'aspect-ratio:3/4'), photo(IMG.woman, 'Woman with a bob against a pale sky', 'aspect-ratio:3/4'), photo(IMG.beanie, 'Man in glasses and a beanie, working', 'aspect-ratio:3/4')] }],
          files: ['sky', 'studio', 'woman', 'beanie', 'cap'].map(pic), rules: [{ t: BRAND.photography.rule, b: 'stated', p: '4.1' }, { t: 'Avoid generic corporate stock photography', b: 'stated', p: 'Brand skill' }], flags: ['photos'], data: { photography: BRAND.photography } }] },
      { id: 'imagery', title: 'AI generated imagery', num: '5.0', items: [
        { id: 'ai', title: 'AI generations', num: '5.1', desc: [D['5.1'].text, D['5.2'].text], path: 'imagery', tool: 'imagery',
          blocks: [{ k: 'tiles', cols: 3, html: [['desk', 'Two people at a desk on a hill at sunset'], ['sunrise', 'Two people at a table in a meadow at sunrise'], ['walkers', 'Two people walking across a golden hillside'], ['sitting', 'Two people sitting in a wide field under a large cloud'], ['walk', 'A young man walking across a golden hillside'], ['bench', 'Two people on a bench under a wide sky']].map(([k, alt]) => photo(IMG[k], alt, 'aspect-ratio:16/9')) }],
          files: im.references.map(pic), rules: [...im.always.map((t) => ({ t, b: 'stated', p: '5.2' })), ...im.never.map((t) => ({ t: 'Avoid: ' + t[0].toLowerCase() + t.slice(1), b: 'stated', p: '5.2' }))], flags: ['aisize'], data: { imagery: { subject: im.subject, always: im.always, never: im.never } } },
        { id: 'method', title: 'How to generate', num: '11.1–11.4', desc: [im.method.steps.join('. ') + '.'], note: im.method.recommend + '. The imagery tool builds prompts in this style and keeps the references to hand.', path: 'imagery.method', tool: 'imagery',
          blocks: PROMPTS.map((text, i) => ({ k: 'prompt', label: `Example prompt ${i + 1}`, text })), rules: [{ t: 'Generate in Midjourney with the reference images as a style reference (sref)', b: 'stated', p: '11.1' }, { t: im.method.recommend, b: 'stated', p: '11.2' }], data: { method: im.method, prompts: PROMPTS } }] },
      { id: 'graphics', title: 'Graphic system', num: '6.0', items: [
        { id: 'softglass', title: 'Soft Glass', num: '6.1', desc: d('6.1'), details: more('6.1'), path: 'graphics.softGlass', make: 'telli-pattern', tool: 'glass',
          blocks: [{ k: 'tiles', cols: 2, html: PATTERNS.filter((pt) => pt.family === 'Soft Glass').map((pt) => patTile(pt)) }, { k: 'tiles', label: 'How it is built', cols: 1, html: [`<div class="pb-tile" style="aspect-ratio:1375/880"><img src="${IMG.f63}" alt="The 6.3 Soft Glass field"><span class="cap">Colour field, wavefield texture, then glass cells with Figma’s Glass effect</span></div>`] }],
          files: patFiles.filter((f, i) => PATTERNS[i].family === 'Soft Glass'), rules: [{ t: g.softGlass.rule, b: 'stated', p: '6.1' }, { t: 'Built in Figma: a blurred colour field with 15% noise, the wavefield texture, then logomark cells in Off White at 10 to 20% with the Glass effect (light −45°, 80%; refraction 100; depth about 65 to 80; dispersion 50; frost 30 to 80)', b: 'measured', p: '6.1' }], flags: ['glass'], data: { softGlass: g.softGlass, glassEffect: GLASS_FX } },
        { id: 'patterns', title: 'telli Patterns', num: '6.2', desc: d('6.2'), details: more('6.2'), path: 'graphics.patterns', make: 'telli-pattern', tool: 'glass',
          blocks: FAMILIES.filter((f) => f !== 'Soft Glass').map((f) => { const list = PATTERNS.filter((pt) => pt.family === f); return { k: 'tiles', label: `${f} · ${list.length} colourway${list.length > 1 ? 's' : ''}`, cols: 2, html: list.map((pt) => patTile(pt)) }; }),
          files: patFiles, rules: [{ t: g.patterns.rule, b: 'stated', p: '6.2' }, { t: 'Each family comes in the palette’s colours: blue, orange, lavender and forest', b: 'measured', p: 'Additional Assets' }], flags: ['glass', 'patnames'], data: { patterns: g.patterns, library: PATTERNS.map(({ src: _, ...pt }) => pt) } },
        { id: 'logopattern', title: 'Logo on pattern', num: '6.3', desc: d('6.3'), details: more('6.3'), path: 'graphics.logoOnPattern', make: 'telli-glass',
          blocks: [{ k: 'tiles', label: 'Logo field', cols: 2, html: PATTERNS.filter((pt) => pt.family === 'Logo field').map((pt) => patTile(pt)) }, { k: 'layouts', ids: ['telli-glass', 'telli-pattern'] }], rules: [{ t: g.logoOnPattern.rule, b: 'stated', p: '6.3' }], flags: ['glass', 'glasscontrast'], data: { logoOnPattern: g.logoOnPattern, templates: ['telli-glass', 'telli-pattern'] } },
        { id: 'overlays', title: 'Glass overlays', num: '6.4', desc: d('6.4'), details: more('6.4'), path: 'graphics.glassOverlays', make: 'telli-chat',
          blocks: [{ k: 'layouts', ids: ['telli-chat'] }], rules: [{ t: g.glassOverlays.rule, b: 'stated', p: '6.4' }], data: { glassOverlays: g.glassOverlays, templates: ['telli-chat'] } },
        { id: 'reveal', title: 'Soft gradient reveal', num: '6.5', desc: d('6.5'), details: more('6.5'), path: 'graphics.reveal', make: 'telli-reveal',
          blocks: [{ k: 'layouts', ids: ['telli-reveal', 'telli-hero'] }], rules: [{ t: g.reveal.rule, b: 'stated', p: '6.5' }], data: { reveal: g.reveal, templates: ['telli-reveal', 'telli-hero'] } }] },
      { id: 'agents', title: 'Agents and Charlie', num: '7.0', items: [
        { id: 'charlie', title: 'Charlie', num: '7.1', desc: d('7.1'), details: more('7.1'), path: 'charlie',
          blocks: [{ k: 'tiles', cols: 2, html: [tile(C.off, C.black, `<img src="${IMG.charlie}" alt="Charlie" style="position:relative;width:34%;height:auto">`, 'Charlie on Off White'), tile(C.blue, C.off, `<img src="${IMG.charlie}" alt="Charlie on blue" style="position:relative;width:34%;height:auto">`, 'Charlie on telli Blue')] }],
          files: [svgFiles[2]], rules: [{ t: BRAND.charlie.rule, b: 'stated', p: '7.1' }], data: { charlie: BRAND.charlie } },
        { id: 'agentids', title: 'Agents', num: '7.2', desc: d('7.2'), details: more('7.2'), path: 'agents', make: 'telli-agents',
          blocks: [{ k: 'tiles', cols: 3, html: AGENTS.map((a) => tile(C.off, C.black, `<div style="height:44%;aspect-ratio:205/207;color:${a.hex}">${mark('100%')}</div>`, `${a.name} · ${a.role}`)) }],
          rules: [{ t: BRAND.agents.rule, b: 'stated', p: '7.2' }], flags: ['agentorange'], data: { agents: BRAND.agents } }] },
      { id: 'skill', title: 'Brand skill', num: '10.0', items: [
        { id: 'brandskill', title: 'telli Brand Skill', num: '10.0', desc: ['The file carries its own brand skill: a written brief for building telli visuals. It is kept verbatim here and in the machine package, so agents and the imagery tool work from the same words.'], path: 'skill',
          blocks: [{ k: 'prompt', label: 'Brand skill, as written', text: D.skill }], rules: [{ t: 'A telli design should feel ' + BRAND.character.join(', '), b: 'stated', p: '10.0' }, { t: 'If it could belong to any generic AI startup, increase the cell geometry, grid logic, scale contrast and typographic character', b: 'stated', p: '10.0' }], data: { skill: D.skill } }] },
    ],
  };
}

export const TELLI = finishBrand({ id: 'telli', name: 'telli', BRAND, TONES, T, SL,
  slots: [
    { id: 'font-sans', kind: 'font', group: 'Type', label: 'ABC Diatype', family: 'ABC Diatype', use: 'Headlines, body, eyebrows and buttons (3.1, 3.2)', standIn: 'Inter Tight', resolves: 'diatype', weights: [400, 500, 700] },
    { id: 'font-serif', kind: 'font', group: 'Type', label: 'Tiempos', family: 'Tiempos Text', use: 'Subheads (3.2)', standIn: 'Source Serif 4', resolves: 'tiempos', weights: [400] },
    { id: 'ai-originals', kind: 'files', group: 'Imagery', label: 'AI image originals', many: true, use: 'Full-size Midjourney originals, also the style references for new generations (5.1, 11.1)', standIn: 'Captures from the guideline', resolves: 'aisize' },
    { id: 'photos', kind: 'files', group: 'Imagery', label: 'Photography originals', many: true, use: 'Licensed originals of the portraits on 4.1', standIn: 'Captures from the guideline', resolves: 'photos' },
    { id: 'generated', kind: 'files', group: 'Imagery', label: 'New generations', required: false, many: true, use: 'Images made with the imagery tool and approved for use. Kept for the brand kit.' }],
  tools: [{ id: 'glass', name: 'Glass', use: 'Make Soft Glass and pattern artwork live: any of the guideline’s patterns in any colourway, with Figma’s Glass controls, at any format and size.', tones: [], tone: '' },
    { id: 'imagery', name: 'Imagery', use: 'Write prompts for new AI imagery in telli’s style, with the references and rules to hand, then check results against the guideline.', tones: [], tone: '' }],
  starter: { name: 'Quarterly update', slides: STARTER },
  source: { kind: 'Figma', label: 'telli Brand Guidelines', detail: '34 frames · last updated 08.14.26' },
  voice: `telli is an AI voice platform: agents that sell, support and operate across millions of calls. Brand character: ${BRAND.character.join(', ')}. Copy is short, confident and plain, in sentence case; the wordmark is always lowercase "telli". Example lines: "Every customer call, handled by AI." "The #1 AI voice platform for agents that sell, support and operate - across millions of calls." "Your cells, supercharged." Colour: neutrals lead; telli Blue for emphasis; orange-red, lavender and forest used sparingly. Imagery: two people in soft, expansive landscapes, never robots or interfaces.`,
  balanceCheck: (t) => t.kind === 'neutral' ? { ok: true, name: 'Balance', text: 'Neutral ground, as the guideline asks for most compositions' } : t.kind === 'primary' ? { ok: true, name: 'Balance', text: 'Primary blue, used for emphasis, about a fifth of the system' } : { ok: false, name: 'Balance', text: 'Accent ground. Accents are used sparingly, not as dominant fields' },
  typeCheck: () => { const a = fontState(TELLI, 'font-sans'), b = fontState(TELLI, 'font-serif'); if (a === 'trial' || b === 'trial') return { ok: false, name: 'Type', text: 'Trial font files: fine for design, not for delivery' }; if ((a || diatype) && (b || tiempos)) return { ok: true, name: 'Type', text: 'ABC Diatype and Tiempos' }; return { ok: false, name: 'Type', text: 'Stand-ins: Inter Tight for ABC Diatype, Source Serif 4 for Tiempos. Add the licensed files before delivery.' }; },
  presence: { kind: 'web', name: 'telli', handle: 'telli', site: 'telli.com', bio: 'AI voice agents that sell, support and operate, across millions of calls.', industry: 'Software development', place: 'Berlin', followers: '5,307', following: '96', xFollowers: '9,850',
    banner: 'statement', post: 'telli-reveal', story: 'telli-gradient', wall: IMG.sky, ink: C.black, accent: C.blue, stageTone: 'off-white',
    caption: 'Every customer call, handled by AI. Agents that sell, support and operate, around the clock.', sig: { name: 'Sam Weber', role: 'Customer success', phone: '+49 30 5550 1420' } },
  card: { html: S('pb-brandtile', `--g:${C.off};--i:${C.black}`, `${glow(C.blue, { w: 400, h: 240, cx: 300, cy: 150, s: 300 })}${lockup('24px', 'position:relative')}`), strip: [C.off, C.tan, C.black, C.blue, C.bright, C.pale, ...ACCENTS.map((a) => a.steps[0])] },
  imagery: BRAND.imagery,
  guide });
