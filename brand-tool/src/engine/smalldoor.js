// @ts-nocheck
// Small Door Vet as a brand record, read from the Figma file "Small Door Vet Brand Guidelines"
// (key IbdUaznQQaBZPpe7IUhjI9) on 2026-11-09. Colours, type, rules and copy are the file's own
// values. Logo, photographs, the arch frame, brush stroke and texture are raster captures of the
// file's layers at the size they sit in the guideline, because vector exports could not be fetched.
import { formatParam } from './formats.js';
import { esc, contrast, hasFont, TEX, sharedTemplates, finishBrand, asSlide, SLIDE, swatchOf, cssVars, typeCss, fontState, LICENCES } from './brand.js';
import D from './sdv-desc.json';

const IMG = window.__SDV_IMG, L = window.__SDV_META;
const C = { white: '#FDFDFD', off: '#F4F5EF', tan: '#E7E3D7', dtan: '#D4CFBF', black: '#1D1916', orange: '#FFAA4D' };
const ACCENTS = [
  { name: 'Rust', steps: ['#CB6015', '#DD9665', '#EECBB2'] }, { name: 'Butter', steps: ['#FFEA86', '#FFF1AE', '#FFF8D7'] },
  { name: 'Camel', steps: ['#C59B61', '#D9BD97', '#ECDECB'] }, { name: 'Sage', steps: ['#B9C3A8', '#D1D7C6', '#E8EBE2'] },
  { name: 'Periwinkle', steps: ['#C4CDEB', '#D8DEF2', '#ECEEF8'] }, { name: 'Lilac', steps: ['#BDB1EB', '#D3CBF2', '#E9E5F8'] }];
const ORANGE = ['#FFAA4D', '#FFC78A', '#FFE3C4'];
const rustContrast = contrast('#CB6015', C.white).toFixed(1);
const zenith = hasFont('Zenith Text');
// Zenith is tracked at -2%, its Google alternative Spectral at -5% (3.2 and 3.4). Follow whichever face is in use.
if (zenith) { const el = document.getElementById('brandcss-smalldoor'); if (el) el.textContent += '.a[data-brand="smalldoor"]{--ht:-.02em;--st:-.02em}'; }

const BRAND = {
  meta: { brand: 'Small Door Vet', source: 'Small Door Vet Brand Guidelines (Figma)', fileKey: 'IbdUaznQQaBZPpe7IUhjI9', pages: 40, edition: 'Last updated 7.31.2026', extracted: '2026-11-09',
    basis: { stated: 'written in the guideline', measured: 'read from layer geometry or fills in the file', inferred: 'deduced from examples; needs sign-off' } },
  character: ['elevated', 'welcoming', 'timeless', 'refined', 'approachable', 'warm'],
  logo: {
    assets: { horizontal: 'logomark + wordmark', stacked: 'two-line wordmark', logomark: 'the small door', contained: 'wordmark inside the door mark' },
    rules: [
      { t: 'The logos work in brand black and brand white', b: 'stated', p: '1.4' },
      { t: 'Always consider contrast when choosing a logo', b: 'stated', p: '1.4' },
      { t: 'Pure black or pure white only when print needs a black and white layout', b: 'stated', p: '1.4' },
      { t: 'Clear space on every side of at least double the gap between logomark and wordmark', b: 'stated', p: '1.2' },
      { t: 'That gap is 87 units on a 231-unit logo, so clear space is about three quarters of the logo height', b: 'measured', p: '1.2', value: 0.75, unit: 'logo height' },
      { t: 'Contained avatars use #F4F5EF with a brand black logomark', b: 'stated', p: '1.3' }],
    never: ['Stretch, rotate, crop, or distort the logo', 'Reduce the opacity of the logo', 'Outline the logo', 'Use unapproved colors', 'Add dramatic effects to the logo', 'Disassemble the logo'],
  },
  color: {
    neutrals: [{ name: 'White', hex: C.white }, { name: 'Off White', hex: C.off }, { name: 'Tan', hex: C.tan }, { name: 'Dark Tan', hex: C.dtan }, { name: 'Brand Black', hex: C.black }],
    orange: ORANGE.map((hex, i) => ({ name: ['Orange', 'Orange mid', 'Orange light'][i], hex })),
    accents: ACCENTS,
    balance: { neutral: 70, orange: 7, accent: 23 },
    rules: [
      { t: 'The identity is anchored by a generous use of neutral tones', b: 'stated', p: '2.3' },
      { t: 'Accent colors are introduced selectively, for warmth, personality and emphasis', b: 'stated', p: '2.3' },
      { t: 'Orange is the warm accent inside the primary palette', b: 'stated', p: '2.1' },
      { t: 'About 70% neutral (Off White alone is 42%), 7% orange, 23% across six accent hues', b: 'measured', p: '2.3' },
      { t: 'Dark type on every colour except Rust, which takes White', b: 'inferred', p: '2.2' }],
  },
  type: {
    families: { head: { name: 'Zenith Text', alternative: 'Spectral' }, body: { name: 'DM Sans' } },
    styles: [
      { id: 'tag', name: 'Eyebrows and tags', face: 'DM Sans SemiBold', tracking: '5%', leading: '100%', sample: 'Join today' },
      { id: 'headline', name: 'Headlines', face: 'Zenith Text Regular', tracking: '-2% (Spectral -5%)', leading: '110%', sample: 'Veterinary care so good\nyou’ll ask if we take humans.' },
      { id: 'subhead', name: 'Subheads', face: 'Zenith Text Regular+', tracking: '-2% (Spectral -5%)', leading: '120%+', sample: 'Exceptional Veterinary Care in NYC, DC, and Boston.' },
      { id: 'body', name: 'Body', face: 'DM Sans Regular+', tracking: '0%', leading: '140%+', sample: 'Membership benefits include a free annual exam, 24/7 telehealth, and same or next day appointments. Pay As You Go also available.' },
      { id: 'button', name: 'Buttons', face: 'DM Sans SemiBold', tracking: '0%', leading: 'n/a', extra: 'Radius 4', sample: 'Book Now' }],
    sizes: { 'Page title': 40, Paragraph: 18, 'Page tag': 15, Figure: 12 },
  },
  graphics: {
    editorialMask: { p: '4.1', rule: 'Simple vector shapes with a painterly brush texture extend, frame or partially obscure imagery' },
    painterly: { p: '4.2', rule: 'Hand-rendered pet objects, enlarged and cropped into abstract backgrounds', prompt: 'Create a rough illustration of an isolated [...] in the same rough texture, painterly style as the attached image. It should have a fill not outlined.' },
    frames: { p: '4.3', rule: 'Photographs sit in custom shapes inspired by framed artwork; frames stay simple, not ornate' },
    logoFrame: { p: '4.4', rule: 'The logomark becomes a frame for imagery; proportions flex, the small door stays' },
    layout: { p: '4.5', rule: 'Structured, grid-based layouts with generous whitespace and clear hierarchy' },
    texture: { p: '4.1', rule: 'The “SD Texture” layer goes over images and backgrounds at varying opacity for a paper feel' },
  },
  icons: { p: '6.1', set: 'Google Material Icons', rule: 'Used in their solid state with adequate negative space, finished with a textured stroke' },
  flags: [
    { id: 'zenith', sev: 'need', p: '3.1', title: 'The headline face in the file is a trial font', says: 'Text styles use “Zenith Trial”; 3.1 names Zenith and links to a download', uses: 'Spectral, the Google alternative named on 3.3, unless Zenith Text is installed on the viewer’s machine.' },
    { id: 'vectors', sev: 'need', p: '1.1', title: 'Logo is a raster capture, not a vector', says: 'Vector logos live on the Logos page as components', uses: 'An 1840-pixel capture of the back-cover logo, used as a mask so it still takes brand black and white. Export the SVGs to replace it.', why: 'This session can read the file through Figma but cannot download its exported files.' },
    { id: 'photos', sev: 'need', p: '4.1', title: 'Photographs are at guideline size', says: 'Images are placed at 450 to 900 pixels in the guideline frames', uses: 'Those captures. Fine for social sizes; originals are needed for print or large formats.' },
    { id: 'brush', sev: 'need', p: '4.5', title: 'Brush stroke is a small capture', says: 'The painterly stroke sits behind a 294 by 556 poster', uses: 'That capture, enlarged and softened, tinted from each tone. A full-size painterly illustration should replace it.' },
    { id: 'variables', sev: 'check', p: '2.2', title: 'Only five of 26 colours are Figma variables', says: 'White, Off White, Tan, Dark Tan and Brand Black are variables; the orange ramp and 18 accents are plain fills with no names', uses: 'Hex values from the fills, which match their printed labels. Working names (Rust, Butter, Camel, Sage, Periwinkle, Lilac) are assigned.', why: 'Unnamed colours cannot be referred to by people or agents, and plain fills do not update if the palette changes.' },
    { id: 'rust', sev: 'check', p: '2.2', title: 'White on Rust is below body-text contrast', says: 'The Rust swatch is labelled in White', uses: `White ink on Rust, flagged as large type only at ${rustContrast}:1.` },
    { id: 'footer', sev: 'check', p: 'Cover', title: 'Two dates in the file', says: 'Every page footer reads JUNE 26; the back cover reads Last Updated 7.31.2026', uses: 'The back-cover date.' },
    { id: 'case', sev: 'check', p: '4.5', title: 'Capitalisation in the postcard sample', says: '“New yorkers’ Favorite Vet”', uses: '“New Yorkers’ Favorite Vet” in the Offer card default.' },
    { id: 'pairs', sev: 'infer', p: '2.2', title: 'No written rule for type on colour', says: 'Swatch labels are dark on every colour except Rust', uses: 'Those label colours as each tone’s ink.' },
    { id: 'notch', sev: 'infer', p: '4.5', title: 'Notched frames are drawn from measurements', says: 'The postcard photo has 31-unit square notches on a 328-unit frame', uses: 'A notched frame built from that ratio, and a smaller notch for the card in 7.2.' },
    { id: 'decks', sev: 'infer', p: 'Deck Samples', title: 'Slide layouts are read from six sample slides', says: 'The Additional Assets page has six sample slides and no written deck rules', uses: 'Six slide layouts rebuilt from those samples: type sizes, table styling and the card shapes are measured from them.' },
    { id: 'icons', sev: 'infer', p: '6.2', title: 'Icon texture is left to the designer', says: '“The designer may use their own discretion when choosing a brush effect”', uses: 'No icon set in the package; layouts use the logomark only.' }],
};

const tone = (name, g, i, g2, kind, card = C.off) => ({ name, g, i, m: i, g2, kind, card });
const TONES = {
  'off-white': tone('Off White', C.off, C.black, C.tan, 'neutral', C.white), white: tone('White', C.white, C.black, C.off, 'neutral'),
  tan: tone('Tan', C.tan, C.black, C.dtan, 'neutral'), black: { ...tone('Brand Black', C.black, C.off, C.dtan, 'neutral'), m: C.dtan },
  orange: tone('Orange', C.orange, C.black, ORANGE[1], 'orange'),
};
for (const a of ACCENTS) TONES[a.name.toLowerCase()] = tone(a.name, a.steps[0], a.name === 'Rust' ? C.white : C.black, a.steps[1], 'accent');
const ALL = Object.keys(TONES);

const lockup = (h, extra = '') => `<i class="a-msk" style="--src:var(--logo);height:${h};aspect-ratio:var(--logo-ar,${L.w}/${L.h});${extra}"></i>`;
const mark = (h, extra = '') => `<i class="a-msk" style="--src:var(--mark);height:${h};aspect-ratio:var(--mark-ar,${L.markW}/${L.markH});${extra}"></i>`;
const byWidth = (src, w, ratio, extra = '') => `<i class="a-msk" style="--src:var(--${src});width:${w};aspect-ratio:${ratio};${extra}"></i>`;
const notch = (n) => `polygon(${n} 0,calc(100% - ${n}) 0,calc(100% - ${n}) ${n},100% ${n},100% calc(100% - ${n}),calc(100% - ${n}) calc(100% - ${n}),calc(100% - ${n}) 100%,${n} 100%,${n} calc(100% - ${n}),0 calc(100% - ${n}),0 ${n},${n} ${n})`;
const PHOTOS = { terrier: IMG.terrier, interior: IMG.interior, doberman: IMG.doberman, dachshund: IMG.dachshund };
const u = (n) => `calc(var(--u)*${n})`;
const check = '<svg viewBox="0 0 20 20" style="width:1.1em;height:1.1em;flex:none"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

const T = [
  { id: 'sdv-event', name: 'Event poster', kind: 'Small Door Vet', src: '4.5', minText: 1.9, use: 'An event or announcement over a painterly brush stroke', u: (w) => w / 80,
    params: { title: { type: 'text', label: 'Title', max: 28, default: 'Pet Food Drive' }, date: { type: 'text', label: 'Date', max: 30, default: 'Saturday, October 3rd' }, place: { type: 'textarea', label: 'Place', max: 70, default: 'Dekalb Avenue &, S Portland\nAve, Brooklyn, NY 11205' },
      layout: { type: 'select', label: 'Layout', options: { 'title low': 1, 'title centre': 1 }, default: 'title low' }, tone: { type: 'tone', label: 'Tone', options: ['orange', 'butter', 'sage', 'periwinkle', 'lilac', 'rust'], default: 'orange' },
      format: formatParam(['tall', 'portrait'], '9:16'), texture: TEX },
    draw: (p) => { const low = p.layout === 'title low', size = Math.min(8.6, 150 / Math.max(10, p.title.length)).toFixed(2), date = `<div class="a-mono" style="font-size:${u(1.9)}">${esc(p.date)}</div>`, title = `<div class="a-h" style="font-size:${u(size)}">${esc(p.title)}</div>`;
      return `<div class="a-mask" style="--src:var(--brush);inset:0;-webkit-mask-size:cover;mask-size:cover;color:color-mix(in srgb,var(--g) 72%,${C.black});opacity:.78"></div>
      <div style="position:absolute;left:${u(5)};right:${u(5)};top:${u(4.4)};height:2px;background:currentColor;opacity:.45"></div>
      <div style="position:absolute;left:${u(5)};top:${u(7)};width:${u(7)};height:${u(7)};border-radius:50%;background:${C.black};color:${C.off};display:flex;align-items:center;justify-content:center">${mark(u(3.6))}</div>
      <div class="a-abs" style="display:flex;flex-direction:column;align-items:center;text-align:center;justify-content:${low ? 'flex-end' : 'space-between'};gap:${u(5)};padding:${u(low ? 9 : 17)} ${u(7)} ${u(9)}">
        ${low ? `<div style="display:flex;flex-direction:column;gap:${u(5)}">${date}${title}</div>` : date + title}
        <div class="a-mono" style="font-size:${u(1.9)};line-height:1.25;white-space:pre-line">${esc(p.place)}</div></div>`; } },
  { id: 'sdv-offer', name: 'Offer card', kind: 'Small Door Vet', src: '4.5', minText: 1.15, use: 'A membership or promotional offer beside a framed photograph', u: (w, h) => h / 100,
    params: { headline: { type: 'textarea', label: 'Headline', max: 40, default: 'New Yorkers’\nFavorite Vet' },
      body: { type: 'textarea', label: 'Passage', max: 220, default: 'Being a Small Door member means expert, personalized care from a trusted team that feels like family. Enjoy easy access to vet services that fit your schedule and your pet’s unique needs.' },
      listTitle: { type: 'text', label: 'List title', max: 32, default: 'Membership perks include:' }, list: { type: 'list', label: 'Perks', item: 'perk', min: 0, max: 4, fields: [{ key: 'text', label: 'Perk', max: 32, hint: 'Annual exam included' }], default: [{ text: 'Annual exam included' }, { text: '20% off additional exams' }, { text: '24/7 telehealth' }] },
      offer: { type: 'text', label: 'Offer', max: 24, default: '$75 off membership' }, code: { type: 'text', label: 'Offer line', max: 64, default: 'Use code NYC2026 when you sign up at smalldoorvet.com' },
      smallPrint: { type: 'textarea', label: 'Small print', max: 200, default: 'Offer valid on new memberships only, cannot be combined with other discounts, and is subject to change. Not valid for Pay as You Go clients or existing clients.' },
      photo: { type: 'select', label: 'Photograph', options: { terrier: 1, interior: 1, doberman: 1 }, default: 'terrier' }, tone: { type: 'tone', label: 'Tone', options: ['off-white', 'white', 'tan', 'butter', 'sage'], default: 'off-white' },
      format: formatParam(['landscape'], '16:9'), texture: TEX },
    draw: (p) => `<div class="a-abs" style="display:flex">
      <div style="width:44%;padding:${u(6)} ${u(5)};display:flex;flex-direction:column;gap:${u(3)}">${lockup(u(3))}
        <div class="a-h" style="font-size:${u(7.4)}">${esc(p.headline)}</div><div class="a-body" style="font-size:${u(1.75)}">${esc(p.body)}</div>
        <div style="margin-top:auto"><div class="a-mono" style="font-size:${u(1.35)};margin-bottom:${u(1.4)}">${esc(p.listTitle)}</div>${p.list.slice(0, 4).filter((s) => s.text.trim()).map((s) => `<div class="a-body" style="font-size:${u(1.7)};display:flex;gap:.6em;align-items:center;margin-top:.45em">${check}${esc(s.text.trim())}</div>`).join('')}</div>
        <div class="a-body" style="font-size:${u(1.15)};opacity:.7">${esc(p.smallPrint)}</div></div>
      <div style="flex:1;position:relative;margin:${u(3)} ${u(3)} ${u(3)} 0"><div style="position:absolute;inset:0;clip-path:${notch(u(4.4))}"><img class="a-ph" src="${PHOTOS[p.photo]}" alt=""><div style="position:absolute;inset:55% 0 0 0;background:linear-gradient(transparent,${C.black}b3)"></div></div>
        <div style="position:absolute;right:${u(4)};bottom:${u(5.4)};display:flex;flex-direction:column;align-items:center;gap:${u(1)};text-align:center;color:${C.white}">${p.offer ? `<div class="a-sub" style="background:${C.black};padding:.3em .7em;border-radius:4px;font-size:${u(2.7)}">${esc(p.offer)}</div>` : ''}<div class="a-body" style="font-size:${u(1.3)};max-width:${u(26)}">${esc(p.code)}</div></div></div></div>` },
  { id: 'sdv-frame', name: 'Framed photo', kind: 'Small Door Vet', src: '4.3', minText: 1.7, use: 'A photograph in the arch frame on a colour ground', u: (w) => w / 80,
    params: { caption: { type: 'text', label: 'Caption', max: 40, default: '' }, photo: { type: 'select', label: 'Photograph', options: { dachshund: 1, terrier: 1, interior: 1 }, default: 'dachshund' },
      tone: { type: 'tone', label: 'Tone', options: ['rust', 'orange', 'off-white', 'tan', 'sage', 'lilac', 'black'], default: 'rust' }, format: formatParam(['portrait', 'square', 'tall'], '4:5'), texture: TEX },
    draw: (p, w, h) => `<div style="position:absolute;left:50%;top:${p.caption ? 47 : 50}%;transform:translate(-50%,-50%);${w / h > 0.7 ? 'height:70%' : 'width:72%'};aspect-ratio:${L.archW}/${L.archH};-webkit-mask:var(--arch) center/contain no-repeat;mask:var(--arch) center/contain no-repeat"><img class="a-ph" src="${PHOTOS[p.photo]}" alt=""></div>${p.caption ? `<div class="a-mono" style="position:absolute;left:0;right:0;bottom:${u(6)};text-align:center;font-size:${u(1.7)}">${esc(p.caption)}</div>` : ''}` },
];
T.push(...sharedTemplates({ src: { statement: '7.2', quote: '7.3' }, TONES, tones: ALL, photos: { interior: IMG.interior, terrier: IMG.terrier, doberman: IMG.doberman }, mark, iconScale: 1.05,
  frames: { 'notched card': (inner, box, tn) => `<div style="position:absolute;inset:${u(4.6)};background:${tn.card};color:${C.black};clip-path:${notch(u(3.2))};${box}">${inner}</div>`, plain: 1 },
  defaults: { iconTone: 'orange', headline: 'Designed\nwith your pet\nin mind.', eyebrow: '', footer: 'smalldoorvet.com', frame: 'notched card', tone: 'periwinkle', quoteEyebrow: 'Join today', quote: 'Veterinary care so good you’ll ask if we take humans.', quoteName: 'Exceptional Veterinary Care', quoteRole: 'NYC, DC, and Boston', photo: 'interior', quoteTone: 'off-white', figureTag: 'Membership', figure: '24/7', figureLabel: 'telehealth for members, with same or next day appointments.', figureSource: '', figureTone: 'butter', coverTag: 'Join today', coverHeadline: 'Veterinary care so good you’ll ask if we take humans.', coverBody: 'Exceptional veterinary care in NYC, DC and Boston, with a free annual exam for members.' } }));

/* ---------- Slide layouts, read from the six "Deck Sample" frames on the Additional Assets page ---------- */
const su = (w, h) => h / 100;
const longest = (s) => Math.max(...s.split('\n').map((l) => l.length), 1);
const clamp = (lo, hi, v) => Math.min(hi, Math.max(lo, v));
const ACC = { orange: C.orange, periwinkle: '#C4CDEB', sage: '#B9C3A8', camel: '#C59B61', lilac: '#BDB1EB', butter: '#FFEA86' };
const accent = { type: 'select', label: 'Accent', options: ACC, default: 'orange' };
const GROUND = { type: 'tone', label: 'Tone', options: ['off-white', 'white'], default: 'off-white' };
const arrow = `<svg viewBox="0 0 34 20" style="width:${u(3.2)};height:auto"><path d="M1 10h31M24 2l8 8-8 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
// A table in the deck style: Dark Tan header with eyebrow labels, alternating Tan rows, and an orange row for a group name (a row with one cell).
function table(cols, rows, o) {
  const grid = `display:grid;grid-template-columns:${o.widths || cols.map((c, i) => (i ? '1fr' : o.first || '1fr')).join(' ')};align-items:center`;
  const cells = (r, cls, size) => cols.map((c, i) => `<div class="${cls}" style="font-size:${u(size)};padding:0 ${u(o.px)};${o.nowrap ? 'white-space:nowrap;' : ''}${i && o.rule ? `border-left:1px solid ${C.off}80;align-self:stretch;display:flex;align-items:center` : ''}">${esc(r[i] || '')}</div>`).join('');
  let n = 0;
  return `<div style="${grid};flex:none;height:${u(o.hh)};background:${C.dtan};color:${C.black}">${cells(cols, 'a-mono', o.hs)}</div>` + rows.map((r) => {
    if (r.length === 1) { n = 0; return `<div style="flex:none;height:${u(o.gh || o.hh)};display:flex;align-items:center;padding:0 ${u(o.px)};background:${C.orange};color:${C.black};font-weight:600;font-size:${u(o.fs)}">${esc(r[0])}</div>`; }
    return `<div style="${grid};${o.fill ? 'flex:1;min-height:0' : `flex:none;height:${u(o.rh)}`};background:${n++ % 2 ? C.tan : 'transparent'}">${cells(r, 'a-body', o.fs)}</div>`;
  }).join('');
}
const SL = [
  { id: 'sl-title', name: 'Title', kind: 'Deck', src: 'Deck Sample 1', use: 'Opening slide: an oversized title, the logo and a date', u: su, size: SLIDE,
    params: { title: { type: 'textarea', label: 'Title', max: 48, default: 'Oversized Deck Title' }, date: { type: 'text', label: 'Date', max: 32, default: 'July 31, 2026' },
      tone: { type: 'tone', label: 'Tone', options: ['orange', 'off-white', 'tan', 'black', 'butter', 'sage', 'periwinkle', 'lilac', 'rust'], default: 'orange' }, texture: TEX },
    draw: (p) => `<div class="a-abs" style="padding:${u(2.6)} ${u(4)} ${u(4.4)};display:flex;flex-direction:column;justify-content:space-between">
      <div class="a-h" style="font-size:${u(clamp(9, 21, 362 / longest(p.title)).toFixed(2))};line-height:1;margin-left:-.03em">${esc(p.title)}</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">${lockup(u(5.4))}<div class="a-mono" style="font-size:${u(1.9)}">${esc(p.date)}</div></div></div>` },
  { id: 'sl-photo', name: 'Headline and photo', kind: 'Deck', src: 'Deck Sample 2', use: 'A question or claim, a photograph, and a short passage', u: su, size: SLIDE,
    params: { headline: { type: 'textarea', label: 'Headline', max: 64, default: 'Okay, what’s the\nweekly update?' },
      body: { type: 'textarea', label: 'Passage', max: 420, default: 'The Weekly Update is the company newsletter. Its mission is to share high level updates, announcements, and reminders to the entire team.\n\nA new Weekly Update is posted weekly.' },
      photo: { type: 'select', label: 'Photograph', options: { doberman: 1, terrier: 1, interior: 1, dachshund: 1 }, default: 'doberman' }, tone: { type: 'tone', label: 'Tone', options: ['off-white', 'white', 'tan'], default: 'off-white' }, texture: TEX },
    draw: (p) => `<div class="a-h" style="position:absolute;left:${u(4)};top:${u(3.4)};max-width:74%;font-size:${u(clamp(6.4, 10.8, 10.8 * Math.sqrt(34 / p.headline.length)).toFixed(2))}">${esc(p.headline)}</div>
      <div style="position:absolute;left:${u(4)};width:52%;top:57.5%;bottom:0;overflow:hidden"><img class="a-ph" src="${PHOTOS[p.photo]}" alt="" style="object-position:50% 22%"></div>
      <div class="a-body" style="position:absolute;left:57%;right:${u(6)};top:57.5%;font-size:${u(clamp(1.9, 2.6, 2.6 * Math.sqrt(230 / p.body.length)).toFixed(2))};white-space:pre-line">${esc(p.body)}</div>` },
  { id: 'sl-card', name: 'Statement card', kind: 'Deck', src: 'Deck Sample 5', use: 'A headline and a passage on a notched card over an accent colour', u: su, size: SLIDE,
    params: { headline: { type: 'textarea', label: 'Headline', max: 64, default: 'Okay, what’s the\nweekly update?' },
      body: { type: 'textarea', label: 'Passage', max: 420, default: 'The Weekly Update is the company newsletter. Its mission is to share high level updates, announcements, and reminders to the entire team.\n\nA new Weekly Update is posted weekly.' },
      tone: { type: 'tone', label: 'Tone', options: ['lilac', 'periwinkle', 'sage', 'butter', 'orange', 'camel', 'rust'], default: 'lilac' }, texture: TEX },
    draw: (p) => `<div style="position:absolute;inset:${u(1.9)};background:${C.off};color:${C.black};clip-path:${notch(u(1.9))};display:flex;align-items:center;gap:${u(8)};padding:${u(6)} ${u(7)}">
      <div class="a-h" style="flex:1.1;min-width:0;font-size:${u(clamp(6.4, 10.8, 10.8 * Math.sqrt(34 / p.headline.length)).toFixed(2))}">${esc(p.headline)}</div>
      <div class="a-body" style="flex:1;min-width:0;font-size:${u(clamp(1.9, 2.5, 2.5 * Math.sqrt(230 / p.body.length)).toFixed(2))};white-space:pre-line">${esc(p.body)}</div></div>` },
  { id: 'sl-rows', name: 'Colour rows', kind: 'Deck', src: 'Deck Sample 3', use: 'Three to five named items, each with a line of explanation and a short note', u: su, size: SLIDE,
    params: { headline: { type: 'textarea', label: 'Headline', max: 80, default: 'Evaluated four dimensions to\ninform a strategic decision' }, labelA: { type: 'text', label: 'Middle column heading', max: 20, default: 'Key question' }, labelB: { type: 'text', label: 'Last column heading', max: 16, default: 'Sources' },
      rows: { type: 'list', label: 'Rows', item: 'row', min: 1, max: 5, fields: [{ key: 'name', label: 'Name', max: 18, hint: 'Dimension One' }, { key: 'line', label: 'Middle column', labelFrom: 'labelA', max: 64 }, { key: 'note', label: 'Last column', labelFrom: 'labelB', max: 30, hint: 'A comma starts a new line' }],
        default: ['One', 'Two', 'Three', 'Four'].map((n, i) => ({ name: `Dimension ${n}`, line: 'Lorem ipsum dolor and consectetur adipiscing elit', note: ['Source A, Source B', 'Source B', 'Source C', 'Source D'][i] })) },
      tone: GROUND, texture: TEX },
    draw: (p) => { const rows = p.rows.slice(0, 5).map((r) => [r.name, r.line, r.note]), lab = [p.labelA, p.labelB], grid = `display:grid;grid-template-columns:31% 15% 1fr 16%;align-items:center;column-gap:${u(1)};padding:0 ${u(5.2)}`;
      return `<div class="a-abs" style="padding:${u(3.4)} ${u(4)} ${u(4)};display:flex;flex-direction:column">
        <div class="a-h" style="font-size:${u(5.6)};max-width:62%;min-height:${u(13)}">${esc(p.headline)}</div>
        <div class="a-mono" style="${grid};font-size:${u(1.5)};margin:${u(3.6)} 0 ${u(1.6)}"><span></span><span></span><span>${esc(lab[0] || '')}</span><span>${esc(lab[1] || '')}</span></div>
        <div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:${u(0.9)}">${rows.map((r, i) => `<div style="${grid};flex:1;min-height:0;border-radius:4px;background:${Object.values(ACC)[i % 5]};color:${C.black}"><div class="a-sub" style="font-size:${u(4.2)}">${esc(r[0])}</div>${arrow}<div class="a-body" style="font-size:${u(2.5)};max-width:16em">${esc(r[1] || '')}</div><div class="a-body" style="font-size:${u(2.5)}">${esc(r[2] || '').replace(/,\s*/g, '<br>')}</div></div>`).join('')}</div></div>`; } },
  { id: 'sl-table', name: 'Table and takeaways', kind: 'Deck', src: 'Deck Sample 4', use: 'A comparison table of up to five rows beside a card of up to three takeaways', u: su, size: SLIDE,
    params: { headline: { type: 'textarea', label: 'Headline', max: 96, default: 'A wins on the dimensions that matter\nlong-term and drives strategic momentum' }, colA: { type: 'text', label: 'First column heading', max: 14, default: 'Pillar' }, colB: { type: 'text', label: 'Middle column heading', max: 20, default: 'Summary' }, colC: { type: 'text', label: 'Last column heading', max: 12, default: 'Winner' },
      rows: { type: 'list', label: 'Rows', item: 'row', min: 1, max: 5, fields: [{ key: 'a', label: 'First column', labelFrom: 'colA', max: 18 }, { key: 'b', label: 'Middle column', labelFrom: 'colB', max: 64 }, { key: 'c', label: 'Last column', labelFrom: 'colC', max: 12 }],
        default: [['One', 'B'], ['Two', 'A'], ['Three', 'A'], ['Four', 'B']].map(([n, w]) => ({ a: `Pillar ${n}`, b: 'Lorem ipsum dolor and consectetur adipiscing elit', c: w })) },
      cardTitle: { type: 'text', label: 'Card title', max: 28, default: 'Key Takeaways' },
      takeaways: { type: 'list', label: 'Takeaways', item: 'takeaway', min: 0, max: 3, fields: [{ key: 'title', label: 'Title', max: 32, hint: 'Headline insight' }, { key: 'line', label: 'Line', max: 96 }],
        default: ['one', 'two', 'three'].map((n) => ({ title: `Headline insight ${n}`, line: 'Lorem ipsum dolor and consectetur adipiscing elit, sed do eiusmod tempor incididunt.' })) },
      accent, tone: GROUND, texture: TEX },
    draw: (p) => { const cols = [p.colA, p.colB, p.colC], take = p.takeaways.slice(0, 3).map((t) => [t.title, t.line]), dot = (pos) => `<i style="position:absolute;${pos};width:${u(6)};height:${u(6)};border-radius:50%;background:var(--g)"></i>`, k = u(-3);
      return `<div class="a-abs" style="padding:${u(3.4)} ${u(4)} ${u(4.6)};display:flex;flex-direction:column;gap:${u(4.6)}">
        <div class="a-h" style="font-size:${u(5.6)};max-width:66%;min-height:${u(12.4)}">${esc(p.headline)}</div>
        <div style="flex:1;min-height:0;display:flex;gap:${u(5.4)}">
          <div style="flex:1.62;min-width:0;display:flex;flex-direction:column">${table(cols, p.rows.slice(0, 5).map((r) => [r.a, r.b, r.c]), { first: '.8fr', widths: '34% 1fr 24%', px: 3, hh: 7.6, hs: 2.5, fs: 2.4, fill: true, rule: true })}</div>
          ${take.length ? `<div style="flex:1;min-width:0;position:relative;background:${ACC[p.accent]};color:${C.black};padding:${u(4.4)} ${u(5.6)} ${u(5)};display:flex;flex-direction:column">${dot(`left:${k};top:${k}`)}${dot(`right:${k};top:${k}`)}${dot(`left:${k};bottom:${k}`)}${dot(`right:${k};bottom:${k}`)}
            <div class="a-sub" style="font-size:${u(4.3)};padding-bottom:${u(2.6)};border-bottom:1px solid ${C.black}73">${esc(p.cardTitle)}</div>
            <div style="margin-top:auto">${take.map((t) => `<div style="border-top:1px solid ${C.black}73;padding:${u(2)} 0 ${u(2.6)}"><div class="a-body" style="font-size:${u(2.7)};font-weight:600;line-height:1.25">${esc(t[0])}</div><div class="a-body" style="font-size:${u(2.1)};margin-top:.3em">${esc(t[1] || '')}</div></div>`).join('')}</div></div>` : ''}</div></div>`; } },
  { id: 'sl-data', name: 'Data table', kind: 'Deck', src: 'Deck Sample 6', use: 'A wide table of figures with group rows, commentary and a footnote', u: su, size: SLIDE,
    params: { headline: { type: 'text', label: 'Headline', max: 64, default: 'Summary of changes by category' }, intro: { type: 'textarea', label: 'Introduction', max: 220, default: 'Goal is to lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
      columns: { type: 'list', label: 'Columns', item: 'column', min: 2, max: 7, fields: [{ key: 'name', label: 'Heading', max: 12 }], default: ['Category', 'Units', 'Before', 'After', '$', '%'].map((name) => ({ name })) },
      rows: { type: 'list', label: 'Rows', item: 'row', min: 1, max: 10, cellsFrom: 'columns', cellMax: 12, firstMax: 24, groups: true,
        default: [{ group: true, cells: ['Group One Categories'] }, ...['One', 'Two', 'Three'].map((n) => ({ cells: [`Category ${n}`, 'XXXX', 'XXXX', 'XXXX', 'XXXX', 'XXXX'] })), { cells: ['Category Four', 'No Change', 'No Change', 'No Change', 'No Change', 'No Change'] }] },
      noteTitle: { type: 'text', label: 'Commentary title', max: 24, default: 'Commentary' }, notes: { type: 'list', label: 'Commentary', item: 'point', min: 0, max: 5, fields: [{ key: 'text', label: 'Point', max: 90 }], default: [{ text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt' }, { text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi' }] },
      footnote: { type: 'text', label: 'Footnote', max: 160, default: 'Lorem ipsum dolor sit amet: XX from Brand B (XX%) and X from Brand A (XX%).' }, tone: GROUND, texture: TEX },
    draw: (p) => { const cols = p.columns.slice(0, 7).map((c) => c.name), rows = p.rows.slice(0, 10).map((r) => (r.group ? [r.cells[0] ?? ''] : r.cells)), notes = p.notes.slice(0, 5).map((n) => n.text.trim()).filter(Boolean), rh = clamp(3.4, 6.4, 56 / Math.max(1, rows.length)),
      // Type is sized so the longest allowed cell fits its column: 24 characters in the first, 12 in the rest.
      tw = 177.78 - 8 - (notes.length ? 177.78 * 0.195 : 0), fr = tw / (cols.length - 1 + 1.6), fit = Math.min((fr * 1.6 - 3) / (24 * 0.6), (fr - 3) / (12 * 0.6)),
      fs = clamp(1.4, 2.3, Math.min(rh * 0.42, fit));
      return `<div class="a-abs" style="padding:${u(3.4)} ${u(4)} ${u(4)};display:flex;flex-direction:column">
        <div class="a-h" style="font-size:${u(5.6)}">${esc(p.headline)}</div><div class="a-body" style="font-size:${u(2.3)};max-width:64%;margin-top:${u(1.6)}">${esc(p.intro)}</div>
        <div style="display:flex;margin-top:${u(4.4)};box-shadow:0 0 0 1px ${C.dtan}">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column">${table(cols, rows, { first: '1.6fr', px: 1.5, hh: 4.2, gh: rh, hs: 1.5, fs, rh, rule: true, nowrap: true })}</div>
          ${notes.length ? `<div style="width:19.5%;flex:none;display:flex;flex-direction:column;border-left:1px solid ${C.off}"><div class="a-mono" style="height:${u(4.2)};flex:none;display:flex;align-items:center;padding:0 ${u(1.5)};background:${C.dtan};font-size:${u(1.5)}">${esc(p.noteTitle)}</div><ul class="a-body" style="list-style:none;padding:${u(1.8)} ${u(1.6)};font-size:${u(1.6)};display:flex;flex-direction:column;gap:.5em">${notes.map((n) => `<li style="display:flex;gap:.6em"><span>•</span><span>${esc(n)}</span></li>`).join('')}</ul></div>` : ''}</div>
        <div class="a-body" style="margin-top:auto;font-size:${u(1.7)};opacity:.6">${esc(p.footnote)}</div></div>`; } },
];
const TID = Object.fromEntries(T.map((t) => [t.id, t]));
SL.push(asSlide(TID.statement, { format: '16:9' }, {}, { kind: 'Deck', use: 'One line with the mark, for a section break or a close' }), asSlide(TID.quote, { format: '16:9' }, {}, { kind: 'Deck' }));
const STARTER = [['sl-title', { title: 'Weekly Update' }], ['sl-photo', {}], ['sl-rows', {}], ['sl-table', {}], ['sl-data', {}], ['sl-card', {}], ['sl-statement', {}]];

/* ---------- Guideline surfaces ---------- */
const S = (cls, style, inner) => `<div class="a ${cls}" data-brand="smalldoor" style="${style}">${inner}</div>`;
const tile = (g, i, inner, cap, extra = '') => S('pb-tile', `--g:${g};--i:${i};${extra}`, `${inner}<div class="a-grain"></div>${cap ? `<span class="cap">${cap}</span>` : ''}`);
const photo = (k, alt, extra = '') => `<div class="pb-tile" style="${extra}"><img src="${PHOTOS[k]}" alt="${alt}"></div>`;
function guide() {
  const ty = BRAND.type, g = BRAND.graphics, d = (k) => [D[k].text], more = (k, i = 0) => D[k].more[i];
  const sample = (s) => s.id === 'tag' ? `<span class="a-tag" style="font-size:13px">${s.sample}</span>` : s.id === 'headline' ? `<div class="a-h" style="font-size:clamp(32px,4.8vw,64px)">${s.sample}</div>` : s.id === 'subhead' ? `<div class="a-sub" style="font-size:clamp(20px,2.4vw,30px);max-width:26em">${s.sample}</div>` : s.id === 'body' ? `<div class="a-body" style="font-size:17px;max-width:36em">${s.sample}</div>`
    : `<span style="display:inline-flex;gap:8px;font-weight:600;font-size:14px">${[[C.black, C.white, 'Book Now'], [C.orange, C.black, 'Join Now'], [C.tan, C.black, 'Join Waitlist']].map((b) => `<span style="background:${b[0]};color:${b[1]};padding:9px 16px;border-radius:4px">${b[2]} →</span>`).join('')}</span>`;
  const wide = 'aspect-ratio:16/9', rule = (i) => BRAND.logo.rules[i], crule = (i) => BRAND.color.rules[i];
  const big = (css, name, note) => ({ html: S('', '--g:transparent;--i:var(--neutral-10);overflow:visible', `<div style="font-family:${css};font-size:clamp(34px,6vw,76px);line-height:1.05;letter-spacing:-.03em">${name}</div>`), note });
  const neutrals = BRAND.color.neutrals.map((c) => swatchOf(c)), orange = BRAND.color.orange.map((c) => swatchOf(c)), primary = [...neutrals, ...orange];
  const accents = [0, 1, 2].flatMap((r) => ACCENTS.map((a) => swatchOf({ name: r ? `${a.name} ${r + 1}` : a.name, hex: a.steps[r] })));
  const logoFiles = [['logo', 'horizontal'], ['stacked', 'stacked'], ['mark', 'logomark']].flatMap(([k, n]) => [{ name: `small-door-vet-${n}-black.png`, brand: 'smalldoor', css: `--${k}`, color: C.black }, { name: `small-door-vet-${n}-white.png`, brand: 'smalldoor', css: `--${k}`, color: C.white }]);
  const face = (s) => (s.face.startsWith('Zenith') ? '"Zenith Text", "Spectral", serif' : '"DM Sans", sans-serif'), pic = (k) => ({ name: `small-door-vet-${k}.${IMG[k].startsWith('data:image/jpeg') ? 'jpg' : 'png'}`, uri: IMG[k] });
  return {
    hero: S('pb-hero', `--g:${C.off};--i:${C.black};--ar:${(L.archW / L.archH).toFixed(4)};--hw:9.5em`, `<div class="pb-hero-media" data-place="arch"><img class="a-ph" src="${IMG.dachshund}" alt="Dachshund resting on a rug, in the arch frame"></div><div class="a-grain"></div>${lockup('30px')}<h1 class="a-h">Veterinary care so good you’ll ask if we take humans.</h1><div class="meta a-mono"><span>Figma file</span><span>${BRAND.meta.pages} frames</span><span>${BRAND.meta.edition}</span></div>`),
    intro: { text: D.Intro.text, num: '0.0', ref: '' },
    chapters: [
      { id: 'logo', title: 'Logo', num: '1.0', items: [
        { id: 'logo', title: 'Logo', num: '1.1', desc: d('1.1'), path: 'logo.assets',
          blocks: [{ k: 'tiles', cols: 3, html: [tile(C.off, C.black, byWidth('logo', '74%', `var(--logo-ar,${L.w}/${L.h})`), 'Horizontal logo'), tile(C.off, C.black, byWidth('stacked', '52%', `var(--stacked-ar,${L.stackedW}/${L.stackedH})`), 'Stacked logo'), tile(C.black, C.off, byWidth('mark', '24%', `var(--mark-ar,${L.markW}/${L.markH})`), 'Logomark')] }],
          files: logoFiles, rules: [], flags: ['vectors'], data: { assets: BRAND.logo.assets, files: logoFiles.map((f) => f.name), format: 'PNG from an 1840-pixel capture; vectors pending' } },
        { id: 'clearspace', title: 'Clearspace', num: '1.2', desc: d('1.2'), path: 'logo.clearSpace',
          blocks: [{ k: 'tiles', cols: 1, html: [tile(C.tan, C.black, `<div style="position:relative;width:42%;aspect-ratio:var(--logo-ar,${L.w}/${L.h})">${byWidth('logo', '100%', `var(--logo-ar,${L.w}/${L.h})`)}<div style="position:absolute;inset:-75% -9.4%;border:1px dashed ${C.black}"></div></div>`, 'About three quarters of the logo height on every side', wide)] }],
          rules: [rule(3), rule(4)], data: { clearSpace: { value: 0.75, unit: 'logo height', rule: 'double the gap between logomark and wordmark' } } },
        { id: 'avatars', title: 'Favicon and avatars', num: '1.3', desc: d('1.3'), details: more('1.3'), path: 'logo.avatar',
          blocks: [{ k: 'tiles', cols: 2, html: [tile(C.tan, C.black, `<div style="height:46%;aspect-ratio:1;border-radius:50%;background:${C.off};display:grid;place-items:center">${mark('46%')}</div>`, 'Contained avatar'), tile(C.off, C.black, mark('30%'), 'Logomark')] }],
          rules: [rule(5)], data: { avatar: { background: C.off, logomark: C.black } } },
        { id: 'logocolours', title: 'Logo colors', num: '1.4', desc: d('1.4'), details: more('1.4'), path: 'logo.colours',
          blocks: [{ k: 'tiles', cols: 3, html: [tile(C.off, C.black, byWidth('logo', '70%', `var(--logo-ar,${L.w}/${L.h})`), 'Brand black'), tile(C.black, C.white, byWidth('logo', '70%', `var(--logo-ar,${L.w}/${L.h})`), 'Brand white'), tile(C.orange, C.black, byWidth('logo', '70%', `var(--logo-ar,${L.w}/${L.h})`), 'Brand black on colour')] }],
          rules: [rule(0), rule(1), rule(2)], data: { brandBlack: C.black, brandWhite: C.white } },
        { id: 'misuse', title: 'Logo misuse', num: '1.5', desc: d('1.5'), path: 'logo.never',
          blocks: [{ k: 'donts', items: BRAND.logo.never }], rules: BRAND.logo.never.map((t) => ({ t: 'Never: ' + t[0].toLowerCase() + t.slice(1), b: 'stated', p: '1.5' })), data: { never: BRAND.logo.never } }] },
      { id: 'colour', title: 'Colour', num: '2.0', items: [
        { id: 'primary', title: 'Primary colors', num: '2.1', desc: d('2.1'), path: 'color.neutrals',
          blocks: [{ k: 'swatches', cols: 5, items: neutrals }, { k: 'swatches', cols: 3, short: true, items: orange }],
          files: [{ name: 'small-door-vet-primary-colours.json', text: JSON.stringify(primary, null, 2) }], copy: { label: 'Copy CSS', text: cssVars(primary) },
          rules: [crule(2)], flags: ['variables'], data: { neutrals, orange } },
        { id: 'accent', title: 'Accent colors', num: '2.2', desc: d('2.2'), path: 'color.accents',
          blocks: [{ k: 'swatches', cols: 6, short: true, items: accents }],
          files: [{ name: 'small-door-vet-accent-colours.json', text: JSON.stringify(accents, null, 2) }], copy: { label: 'Copy CSS', text: cssVars(accents) },
          rules: [crule(4)], flags: ['rust', 'pairs'], data: { accents: ACCENTS } },
        { id: 'balance', title: 'Color balance', num: '2.3', desc: d('2.3'), path: 'color.balance',
          blocks: [{ k: 'balance', legend: [{ label: 'Neutral', pct: BRAND.color.balance.neutral }, { label: 'Orange', pct: BRAND.color.balance.orange }, { label: 'Accent', pct: BRAND.color.balance.accent }], parts: [{ hex: C.white, w: 7 }, { hex: C.off, w: 42.2 }, { hex: C.tan, w: 7 }, { hex: C.dtan, w: 7 }, { hex: C.black, w: 7 }, { hex: C.orange, w: 6.7 }, ...ACCENTS.map((a) => ({ hex: a.steps[0], w: 3.83 }))] }],
          rules: [crule(0), crule(1), crule(3)], data: { balance: BRAND.color.balance } }] },
      { id: 'type', title: 'Typography', num: '3.0', items: [
        { id: 'fonts', title: 'Brand fonts', num: '3.1', desc: d('3.1'), path: 'type.families',
          get blocks() { const l = fontState(SMALLDOOR, 'font-head'); return [{ k: 'specimen', rows: [big('var(--hf)', 'Zenith', l ? (l === 'trial' ? 'Trial files added in Assets' : `Font files added in Assets · ${LICENCES[l]} licence`) : zenith ? 'Installed on this machine' : 'Shown in Spectral, the alternative named on 3.3'), big('var(--bf)', 'DM Sans', 'Google Fonts')] }]; },
          rules: [], flags: ['zenith'], data: { families: ty.families } },
        { id: 'typesetting', title: 'Typesetting', num: '3.2', desc: d('3.2'), path: 'type.styles',
          blocks: [{ k: 'specs', rows: ty.styles.map((s) => ({ meta: [s.name, s.face, `Tracking ${s.tracking} · Leading ${s.leading}`, ...(s.extra ? [s.extra] : [])], html: S('', '--g:transparent;--i:var(--neutral-10);overflow:visible', sample(s)) })) }],
          copy: { label: 'Copy CSS', text: typeCss(ty.styles, face) },
          rules: ty.styles.map((s) => ({ t: `${s.name}: ${s.face}, tracking ${s.tracking}, leading ${s.leading}`, b: 'stated', p: '3.2' })), data: { styles: ty.styles.map(({ sample: _, ...s }) => s), sizes: ty.sizes } },
        { id: 'googlefonts', title: 'Google Fonts', num: '3.3', desc: [D['3.3'].text, D['3.4'].text], path: 'type.families.head.alternative',
          blocks: [{ k: 'specimen', rows: [big('"Spectral",Georgia,serif', 'Spectral', 'In place of Zenith'), big('var(--bf)', 'DM Sans', 'Unchanged')] }],
          rules: [{ t: 'Spectral and DM Sans are the Google Font alternatives', b: 'stated', p: '3.3' }, { t: 'Headlines and subheads in Spectral take -5% tracking', b: 'stated', p: '3.4' }], data: { alternative: ty.families.head.alternative, body: ty.families.body.name } }] },
      { id: 'graphics', title: 'Graphic system', num: '4.0', items: [
        { id: 'mask', title: 'Editorial mask', num: '4.1', desc: d('4.1'), details: more('4.1'), path: 'graphics.editorialMask',
          blocks: [{ k: 'tiles', cols: 2, html: [photo('terrier', 'Terrier with a painted orange bandana', 'aspect-ratio:3/4'), photo('doberman', 'Doberman with painted lilac ears', 'aspect-ratio:3/4')] }],
          files: [pic('terrier'), pic('doberman'), { name: 'sd-texture.jpg', brand: 'smalldoor', css: '--grain' }], rules: [{ t: g.editorialMask.rule, b: 'stated', p: '4.1' }, { t: g.texture.rule, b: 'stated', p: '4.1' }], flags: ['photos'], data: { editorialMask: g.editorialMask, texture: g.texture } },
        { id: 'painterly', title: 'Painterly illustration', num: '4.2', desc: d('4.2'), path: 'graphics.painterly',
          blocks: [{ k: 'tiles', cols: 3, html: ['orange', 'butter', 'sage'].map((k) => tile(TONES[k].g, TONES[k].i, `<div class="a-mask" style="--src:var(--brush);inset:0;-webkit-mask-size:cover;mask-size:cover;color:color-mix(in srgb,var(--g) 72%,${C.black});opacity:.78"></div>`, TONES[k].name, 'aspect-ratio:4/3')) }, { k: 'prompt', label: 'Prompt example', text: g.painterly.prompt }],
          prompt: g.painterly.prompt, rules: [{ t: g.painterly.rule, b: 'stated', p: '4.2' }], flags: ['brush'], data: { painterly: g.painterly } },
        { id: 'frames', title: 'Frames', num: '4.3', desc: d('4.3'), path: 'graphics.frames',
          blocks: [{ k: 'tiles', cols: 1, html: [tile(C.off, C.black, `<div style="height:78%;aspect-ratio:1;position:relative;clip-path:${notch('9.45%')}"><img class="a-ph" src="${IMG.interior}" alt="Clinic interior in the notched frame"></div>`, '', wide)] }],
          files: [pic('interior')], rules: [{ t: g.frames.rule, b: 'stated', p: '4.3' }], flags: ['notch'], data: { frames: g.frames } },
        { id: 'logoframe', title: 'Logo frame', num: '4.4', desc: d('4.4'), path: 'graphics.logoFrame', make: 'sdv-frame',
          blocks: [{ k: 'tiles', cols: 1, html: [tile('#CB6015', C.white, `<div style="height:82%;aspect-ratio:${L.archW}/${L.archH};position:relative"><img class="a-ph" src="${IMG.dachshund}" alt="Dachshund in the arch frame"></div>`, '', wide)] }],
          files: [pic('dachshund')], rules: [{ t: g.logoFrame.rule, b: 'stated', p: '4.4' }], data: { logoFrame: g.logoFrame } },
        { id: 'layout', title: 'Editorial layout', num: '4.5', desc: d('4.5'), path: 'graphics.layout',
          blocks: [{ k: 'layouts', ids: ['sdv-event', 'sdv-offer'] }], rules: [{ t: g.layout.rule, b: 'stated', p: '4.5' }], flags: ['case'], data: { layout: g.layout, templates: ['sdv-event', 'sdv-offer'] } }] },
      { id: 'photography', title: 'Photography', num: '', items: [
        { id: 'photography', title: 'Photography', num: '4.1–4.5', desc: [], note: 'The guideline has no photography page. These photographs come from its graphic-system frames.', path: 'imagery',
          blocks: [{ k: 'tiles', cols: 3, html: [photo('interior', 'Clinic interior with artwork and a bench', 'aspect-ratio:4/5'), photo('terrier', 'Terrier with a painted orange bandana', 'aspect-ratio:4/5'), photo('doberman', 'Doberman with painted lilac ears', 'aspect-ratio:4/5')] }],
          files: ['interior', 'terrier', 'doberman', 'dachshund'].map(pic), rules: [], flags: ['photos'], data: { photographs: ['interior', 'terrier', 'doberman', 'dachshund'], rule: null } }] },
      { id: 'icons', title: 'Iconography', num: '6.0', items: [
        { id: 'materials', title: 'Google Materials', num: '6.1', desc: d('6.1'), path: 'icons', blocks: [],
          rules: [{ t: 'Google Material Icons, in their solid state', b: 'stated', p: '6.1' }], data: { icons: BRAND.icons } },
        { id: 'icontexture', title: 'Icon texture', num: '6.2', desc: d('6.2'), path: 'icons.texture', blocks: [],
          rules: [{ t: 'Stroke weight varies with scale; the brush effect is the designer’s choice', b: 'stated', p: '6.2' }], flags: ['icons'], data: { stroke: 'textured, weight by scale' } }] },
    ],
  };
}

export const SMALLDOOR = finishBrand({ id: 'smalldoor', name: 'Small Door Vet', BRAND, TONES, T, SL,
  slots: [
    { id: 'font-head', kind: 'font', group: 'Type', label: 'Zenith Text', family: 'Zenith Text', use: 'Headlines and subheads (3.1)', standIn: 'Spectral', resolves: 'zenith', weights: [400],
      // Zenith is tracked at -2%, Spectral at -5% (3.2, 3.4).
      css: '.a.a[data-brand="smalldoor"]{--ht:-.02em;--st:-.02em}' },
    { id: 'logo-horizontal', kind: 'svg', group: 'Logo', label: 'Horizontal logo', cssVar: '--logo', ratioVar: '--logo-ar', use: 'Logomark and wordmark, the default lockup (1.1)', standIn: 'An 1840-pixel capture', resolves: 'vectors' },
    { id: 'logo-stacked', kind: 'svg', group: 'Logo', label: 'Stacked logo', cssVar: '--stacked', ratioVar: '--stacked-ar', required: false, use: 'Two-line wordmark (1.1)', standIn: 'A capture', resolves: 'vectors' },
    { id: 'logo-mark', kind: 'svg', group: 'Logo', label: 'Logomark', cssVar: '--mark', ratioVar: '--mark-ar', required: false, use: 'The small door on its own (1.1)', standIn: 'A capture', resolves: 'vectors' },
    { id: 'brush', kind: 'image', group: 'Imagery', label: 'Brush stroke', cssVar: '--brush', use: 'The painterly stroke behind posters and cards (4.5)', standIn: 'A 294 by 556 capture', resolves: 'brush' },
    { id: 'photos', kind: 'files', group: 'Imagery', label: 'Photography originals', required: false, many: true, use: 'Full-size originals for print and large formats (4.1). Kept for the brand kit.' },
    { id: 'painted', kind: 'files', group: 'Imagery', label: 'Painted pieces', required: false, many: true, use: 'Editorial masks and brush illustrations made with the Painterly studio and kept for use (4.1, 4.2).' }],
  tools: [{ id: 'painterly', name: 'Painterly studio', use: 'Paint the brand’s editorial masks onto any dog photo, and dry-brush illustrations for backgrounds, as stills or painted on stroke by stroke as video, in the guideline’s own shapes and colours (4.1, 4.2).', tones: [], tone: '' }],
  starter: { name: 'Weekly update', slides: STARTER },
  source: { kind: 'Figma', label: 'Small Door Vet Brand Guidelines', detail: '40 frames · last updated 7.31.2026' },
  voice: `Small Door Vet is a membership veterinary practice in NYC, DC, and Boston. Brand character: ${BRAND.character.join(', ')}. Copy is warm, plain and a little witty, never cute. Example lines: "Veterinary care so good you’ll ask if we take humans." "Designed with your pet in mind." "Our doors are almost open." Colour: neutral grounds are the default; orange is the warm accent; the six accent hues are used selectively.`,
  balanceCheck: (t) => t.kind === 'neutral' ? { ok: true, name: 'Balance', text: 'Neutral ground, in line with the 70% neutral balance' } : t.kind === 'orange' ? { ok: true, name: 'Balance', text: 'Orange, the brand’s warm accent, about 7% of the system' } : { ok: false, name: 'Balance', text: 'Accent ground. Accents are introduced selectively, about a quarter of a set' },
  typeCheck: () => { const l = fontState(SMALLDOOR, 'font-head'); return l ? (l === 'trial' ? { ok: false, name: 'Type', text: 'Trial Zenith files: fine for design, not for delivery' } : { ok: true, name: 'Type', text: 'Zenith from the brand’s font files' }) : { ok: true, name: 'Type', text: zenith ? 'Zenith Text found on this machine' : 'Spectral and DM Sans, the Google alternatives named on 3.3' }; },
  presence: { kind: 'app', name: 'Small Door Vet', handle: 'smalldoorvet', site: 'smalldoorvet.com', bio: 'Veterinary care so good you’ll ask if we take humans. NYC, DC and Boston.', industry: 'Veterinary services', place: 'New York, NY', followers: '8,920', following: '312', xFollowers: '21.6K',
    banner: 'statement', post: 'sdv-frame', story: 'sdv-event', wall: IMG.interior, ink: C.black, accent: C.orange, stageTone: 'off-white',
    caption: 'Designed with your pet in mind. Members get 24/7 telehealth and same or next day appointments.', sig: { name: 'Jordan Lee', role: 'Member care', phone: '+1 212 555 0186' } },
  card: { html: S('pb-brandtile', `--g:${C.orange};--i:${C.black}`, `<div class="a-mask" style="--src:var(--brush);inset:0;-webkit-mask-size:cover;mask-size:cover;color:color-mix(in srgb,var(--g) 72%,${C.black});opacity:.7"></div>${lockup('26px', 'position:relative')}`), strip: [...BRAND.color.neutrals.map((c) => c.hex), C.orange, ...ACCENTS.map((a) => a.steps[0])] },
  guide });
