// Recipe tools: tools a brand's people build for themselves, from what the brand system already has.
// A recipe is one existing layout with some settings fixed by the brand, some left open, and a set of sizes made at once.
// Recipes never add a new way of drawing: that needs an engine, which Primary builds with Claude (the Glass tool, the World Graph).
import { defaults, sanitize } from './brand.js';
import { SIZE_BY } from './formats.js';

export const RECIPE_LIMIT = 6; // tools a brand keeps before adding one means replacing one
export const UNUSED_DAYS = 60; // a tool nobody has used for this long is flagged for archiving
export const MAX_SIZES = 4;
const DAY = 86400000;
let BY = {};
export function recipeBrands(by) { BY = by; } // set once by the engine's index, which owns the brand list

// Sizes a recipe makes by default, most useful first, when nothing else is said.
const PREFERRED = ['post-4-5', 'story-9-16', 'linkedin-1-91', 'slide-16-9', 'post-1-1', 'linkedin-4-5', 'a4-portrait', 'a4-landscape', 'letter-portrait'];

/* ---------- Suggestions: written for each brand from its guideline and brief, checked against its layouts ---------- */
const IDEAS = {
  smalldoor: [
    { id: 'clinic-opening', name: 'Clinic opening kit', base: 'sdv-event', inputs: ['title', 'date', 'place'], fixed: { layout: 'title low', tone: 'orange' }, sizes: ['post-4-5', 'story-9-16', 'a4-portrait'],
      about: 'One entry makes the post, the story and the printed poster for a new clinic.', why: 'Small Door is opening clinics across NYC, DC and Boston, and every opening needs the same three pieces.', uses: ['Event poster', 'Brush texture', 'Orange'] },
    { id: 'pet-portrait', name: 'Pet portrait post', base: 'sdv-frame', inputs: ['caption', 'photo', 'tone'], fixed: {}, sizes: ['post-4-5', 'post-1-1', 'story-9-16'],
      about: 'A pet photograph in the brand’s arch frame, with a caption, at every social size.', why: 'The framed photograph is the guideline’s signature device; this keeps the frame and spacing exact every time.', uses: ['Framed photo', 'Arch frame', 'Accent colours'] },
    { id: 'vet-voice', name: 'Vet voice quotes', base: 'quote', inputs: ['quote', 'name', 'role'], fixed: { eyebrow: 'From our vets', photo: 'interior', tone: 'sage' }, sizes: ['post-4-5', 'story-9-16', 'linkedin-4-5'],
      about: 'A vet’s words with their name and role, on a fixed photograph and colour.', why: 'Vets are the brand’s proof of care; a fixed look makes a recognisable series rather than one-off posts.', uses: ['Quote', 'Clinic interior', 'Sage'] },
    { id: 'member-offer', name: 'Member offer', base: 'sdv-offer', inputs: ['headline', 'offer', 'code', 'smallPrint'], fixed: { tone: 'off-white', photo: 'terrier' }, sizes: ['slide-16-9', 'a4-landscape'],
      about: 'A membership offer where only the offer, code and small print change.', why: 'Offers repeat with new codes; locking the photograph and layout keeps them consistent and quick to approve.', uses: ['Offer card', 'Terrier photo'] },
  ],
  telli: [
    { id: 'pattern-campaign', name: 'Pattern campaign set', base: 'telli-pattern', inputs: ['eyebrow', 'headline', 'pattern', 'colourway'], fixed: { footer: 'telli.com' }, sizes: ['post-4-5', 'story-9-16', 'linkedin-1-91', 'slide-16-9'],
      about: 'One headline on a live glass pattern, rebuilt for four sizes at once.', why: 'The glass patterns now redraw for any format, so one campaign line can go everywhere without cropping.', uses: ['Pattern', 'Glass engine', 'Colourways'] },
    { id: 'call-moment', name: 'Call moment', base: 'telli-chat', inputs: ['agent', 'caller', 'image'], fixed: { photo: 'woman' }, sizes: ['post-4-5', 'linkedin-1-91', 'story-9-16'],
      about: 'A short exchange between a telli agent and a caller, over the brand’s imagery.', why: 'It shows the product itself, a call being answered, which the guideline’s Glass overlay was made for.', uses: ['Glass overlay', 'Brand imagery'] },
    { id: 'proof-point', name: 'Proof point', base: 'figure', inputs: ['figure', 'label', 'source'], fixed: { tag: 'In numbers', tone: 'blue' }, sizes: ['post-4-5', 'linkedin-4-5', 'slide-16-9'],
      about: 'One number with its label and source, in a fixed telli colour.', why: 'Figures like calls handled come up in sales and social; one look keeps them comparable.', uses: ['Big number', 'Blue'] },
    { id: 'agent-lineup', name: 'Agent line-up', base: 'telli-agents', inputs: ['title', 'agents'], fixed: {}, sizes: ['linkedin-1-91', 'post-1-1', 'slide-16-9'],
      about: 'telli’s voice agents with their portraits and names, for launches and decks.', why: 'New agents are announced often, and the Agent picker layout already holds their portraits.', uses: ['Agent picker', 'Portraits'] },
  ],
  aurelius: [
    { id: 'data-point', name: 'Data point series', base: 'social-number', inputs: ['title', 'sub', 'value', 'source'], fixed: { tone: 'tide-deep' }, sizes: ['post-4-5', 'linkedin-4-5', 'story-9-16'],
      about: 'A number placed on the world map, with its title and source.', why: 'Aurelius talks in connected data; a series of numbers on the map is its most repeatable post.', uses: ['Number on map', 'World map'] },
    { id: 'product-card', name: 'Product card set', base: 'social-product', inputs: ['title', 'sub', 'tag', 'shape'], fixed: { tone: 'stone' }, sizes: ['post-4-5', 'post-1-1', 'linkedin-4-5'],
      about: 'A product name and line on one of the four brand shapes.', why: 'Each product gets the same treatment, so the range reads as one family.', uses: ['Product card', 'Brand shapes'] },
    { id: 'stat-ring', name: 'Stat ring', base: 'social-stat', inputs: ['value', 'label', 'body'], fixed: { tone: 'bone' }, sizes: ['post-4-5', 'story-9-16'],
      about: 'A percentage drawn as a ring, with a short explanation.', why: 'Shares and proportions are a recurring way Aurelius explains its data.', uses: ['Stat ring'] },
  ],
};

/* ---------- Reading and checking a recipe: only what the brand has, only within its limits ---------- */
const clip = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const openable = (d) => d && d.type !== 'data' && d.type !== 'pad';
export function sizesOf(t) { return t?.params?.format ? Object.keys(t.params.format.options) : []; }
export function defaultSizes(t, n = 3) {
  const all = sizesOf(t); const pick = PREFERRED.filter((s) => all.includes(s)).slice(0, n);
  return pick.length ? pick : all.slice(0, 1);
}
export function cleanSpec(brandId, v) {
  const B = BY[brandId], t = B?.TBY?.[v?.base]; if (!t) return null;
  const keys = Object.keys(t.params).filter((k) => k !== 'format' && openable(t.params[k]));
  const inputs = [...new Set((Array.isArray(v.inputs) ? v.inputs : []).filter((k) => keys.includes(k)))];
  const base = sanitize(t, { ...defaults(t), ...(v.fixed && typeof v.fixed === 'object' ? v.fixed : {}) });
  // Settings a tool carried in (the Glass tool's values) stay fixed with the set; they are never an input.
  const kept = [...keys, ...Object.keys(t.params).filter((k) => t.params[k].type === 'data')];
  const fixed = {}; for (const k of kept) if (!inputs.includes(k) && v.fixed && k in v.fixed && base[k] != null) fixed[k] = base[k];
  const all = sizesOf(t);
  let sizes = [...new Set((Array.isArray(v.sizes) ? v.sizes : []).filter((s) => all.includes(s)))].slice(0, MAX_SIZES);
  if (!sizes.length) sizes = defaultSizes(t);
  const name = clip(v.name, 40) || t.name;
  return { base: t.id, inputs: inputs.length ? inputs : keys.filter((k) => ['text', 'textarea'].includes(t.params[k].type)).slice(0, 3), fixed, sizes, name, about: clip(v.about, 160) };
}
const STATUS = ['draft', 'proposed', 'approved', 'archived', 'request'];
export function readRecipe(id, v) {
  if (!v || typeof v !== 'object' || !BY[v.brand]) return null;
  const status = STATUS.includes(v.status) ? v.status : 'draft';
  const n = (x) => (Number.isFinite(+x) ? +x : 0);
  if (status === 'request') return { id, brand: v.brand, status, request: clip(v.request, 400), reason: clip(v.reason, 300), brief: clip(v.brief, 1600), by: clip(v.by, 80), createdAt: n(v.createdAt), updatedAt: n(v.updatedAt), name: clip(v.name, 40) || 'Request', base: '', inputs: [], fixed: {}, sizes: [], about: clip(v.about, 240), uses: 0, lastUsed: 0, approvedAt: 0, idea: clip(v.idea, 40) };
  const spec = cleanSpec(v.brand, v); if (!spec) return null;
  return { id, brand: v.brand, status, ...spec, idea: clip(v.idea, 40), by: clip(v.by, 80), createdAt: n(v.createdAt), updatedAt: n(v.updatedAt), approvedAt: n(v.approvedAt), uses: n(v.uses), lastUsed: n(v.lastUsed) };
}
// The layout seen through a recipe: only the inputs it leaves open.
export function recipeView(r) { const t = BY[r.brand].TBY[r.base]; return { ...t, params: Object.fromEntries(r.inputs.map((k) => [k, t.params[k]])) }; }
export function recipeParams(r, open = {}, size) { const t = BY[r.brand].TBY[r.base]; return sanitize(t, { ...defaults(t), ...r.fixed, ...open, ...(size ? { format: size } : {}) }); }
export function unused(r, now = Date.now()) { return r.status === 'approved' && now - (r.lastUsed || r.approvedAt || r.createdAt) > UNUSED_DAYS * DAY; }
export const sizeName = (id) => { const s = SIZE_BY[id]; return s ? s.name : id; };

// A set saved from Make: the words stay open, everything else is kept as it is now, at the size in use plus the most useful others.
export function specFromMake(brandId, t, p) {
  const words = Object.keys(t.params).filter((k) => ['text', 'textarea', 'list'].includes(t.params[k].type));
  const fixed = Object.fromEntries(Object.keys(t.params).filter((k) => k !== 'format' && !words.includes(k)).map((k) => [k, p[k]]));
  const sizes = [...new Set([p.format, ...defaultSizes(t, 4)].filter(Boolean))].slice(0, 3);
  return cleanSpec(brandId, { base: t.id, inputs: words, fixed, sizes, name: `${t.name} set` });
}

// What each of the brand's own tools makes, shown as one of the layouts it feeds.
const TOOL_PREVIEW = {
  painterly: { layout: 'sdv-event', params: { tone: 'orange' } }, glass: { layout: 'telli-pattern', params: {} }, imagery: { layout: 'telli-chat', params: {} },
  globe: { layout: 'social-graph', params: {} }, particles: { layout: 'headline', params: {} },
};
export function toolPreview(brandId, toolId) { const v = TOOL_PREVIEW[toolId]; return v && BY[brandId]?.TBY[v.layout] ? v : null; }

/* ---------- Suggestions for a brand, minus what it already has ---------- */
export function ideasFor(brandId, recipes = []) {
  const B = BY[brandId]; if (!B) return [];
  const taken = new Set(recipes.filter((r) => r.status !== 'archived' && r.status !== 'request').flatMap((r) => [r.idea, `${r.base}:${r.inputs.slice().sort().join(',')}`]));
  return (IDEAS[brandId] ?? []).map((i) => ({ ...i, spec: cleanSpec(brandId, i) })).filter((i) => i.spec && !taken.has(i.id) && !taken.has(`${i.spec.base}:${i.spec.inputs.slice().sort().join(',')}`));
}

/* ---------- Tools on a brand's own visual language: what Primary could build next ---------- */
// Each names the guideline system it would turn into a tool, what people could then make, and a layout that shows
// the kind of picture today (the preview). Building one is Primary's work with Claude; asking for one sends a brief.
const ENGINE_IDEAS = {
  smalldoor: [
    { id: 'frames', name: 'Frames studio', from: '4.3 Frames', preview: { layout: 'sdv-frame', params: { tone: 'sage', photo: 'terrier' } },
      what: 'Any photograph set in the brand’s custom frame shapes, with the frame’s proportions and spacing kept exact.', why: 'The frames are the guideline’s signature for photography, and today only one frame shape is drawn.' },
    { id: 'logo-frame', name: 'Logo frame', from: '4.4 Logo frame', preview: { layout: 'sdv-frame', params: { tone: 'orange', photo: 'interior' } },
      what: 'Photos and illustration placed inside the small-door mark, with its proportions flexing and the door kept.', why: 'The guideline makes the logo a framing device, but nothing in the system draws it yet.' },
    { id: 'objects', name: 'Painted objects', from: '4.2 Painterly illustration', preview: { layout: 'sdv-event', params: { tone: 'butter' } },
      what: 'New pet objects (a collar, a ball, a stethoscope) painted in the same rough brush hand, for the illustration library.', why: 'The guideline asks for the library to grow with the same style; the Painterly studio paints strokes, not new objects.' },
  ],
  telli: [
    { id: 'gradient-fields', name: 'Gradient fields', from: '2.5 Gradients', preview: { layout: 'telli-gradient', params: { gradient: 'Lavender' } },
      what: 'Soft multi-colour glow fields in telli’s colourways, composed for any size, as backgrounds and section openers.', why: 'Gradients carry most of telli’s surfaces, and today each layout draws one fixed glow.' },
    { id: 'call-moments', name: 'Call moments', from: '6.4 Glass overlays', preview: { layout: 'telli-chat', params: {} },
      what: 'Product moments: glass call cards and transcripts over imagery, built from a real call script.', why: 'Showing a call being answered is telli’s clearest proof, and it is assembled by hand today.' },
  ],
  aurelius: [
    { id: 'diagrams', name: 'Technical diagrams', from: '5.0 Core shape', preview: { layout: 'social-product', params: { shape: 'capsule' } },
      what: 'New diagrams in Aurelius’s line language: capsules, orbits, dotted rings and dot glyphs, composed from a description.', why: 'The product shapes are drawn in code already; a grammar would let people build new diagrams from them.' },
    { id: 'map-callouts', name: 'Map callouts', from: '4.0 World Graph', preview: { layout: 'social-number', params: {} },
      what: 'Several numbers pinned to places on the world map, with leader lines and sources.', why: 'One number on the map is a layout today; stories with several places are drawn by hand.' },
  ],
};
export function engineIdeasFor(brandId, requests = []) {
  const B = BY[brandId]; if (!B) return [];
  const asked = new Set(requests.map((r) => r.idea));
  return (ENGINE_IDEAS[brandId] ?? []).filter((i) => B.TBY[i.preview.layout]).map((i) => ({ ...i, asked: asked.has(i.id) }));
}
// A brief Primary can bring to a session with Claude: what to build, from which part of the guideline, for what.
export function briefText(B, b) {
  return [`Build a tool for ${B.name}: ${b.name}`, b.from ? `From the guideline: ${b.from}` : '', `What people make with it: ${b.what}`, b.why ? `Why: ${b.why}` : '', b.request ? `Asked for as: “${b.request}”` : '', 'Build it on the brand’s own parts (shapes, colours, type, textures from the guideline file), so new work stays on-brand; match the guideline’s own examples 1:1 before adding anything.'].filter(Boolean).join('\n');
}

/* ---------- The worth-it check ---------- */
// The guideline's own sections ("4.2 Painterly illustration"), so a brief points at a real one.
export function sectionsOf(B) {
  try { return B.guide(0).chapters.flatMap((c) => (c.items ?? []).filter((i) => i.num && i.title).map((i) => `${i.num} ${i.title}`)); } catch { return []; }
}
function realSection(B, from) {
  const all = sectionsOf(B), f = clip(from, 60); if (!f) return '';
  if (all.includes(f)) return f;
  const num = (f.match(/\d+(\.\d+)?/) || [])[0];
  return (num && all.find((x) => x.split(' ')[0] === num)) || '';
}
// What the brand already has, in a form Claude can weigh a request against.
export function brandContext(B, recipes) {
  const tools = (B.tools ?? []).map((t) => `- tool "${t.id}": ${t.name}. ${t.use}`);
  const sets = recipes.filter((r) => r.status === 'approved').map((r) => `- set "${r.id}": ${r.name}, from the ${B.TBY[r.base]?.name} layout. ${r.about}`);
  const layouts = B.T.map((t) => `- layout "${t.id}": ${t.name}. ${t.use ?? ''}`);
  return { tools: tools.join('\n') || '- none yet', sets: sets.join('\n') || '- none yet', layouts: layouts.join('\n') };
}
export function worthPrompt(B, recipes, request) {
  const c = brandContext(B, recipes);
  return `You look after ${B.name}'s brand system in Primary's brand tool. Someone asked for a new tool:
"${request}"

In this system, a tool turns one part of the brand's own visual language into a drawing system (for example: painting the guideline's masks onto any photo, or redrawing its glass patterns at any size). Primary builds tools; people use them. Repeating one layout at several sizes is not a tool: that is a set in Make. Prefer what already exists, and keep the brand's tools few and worth having.

The brand's tools:
${c.tools}

Sets in Make:
${c.sets}

Layouts in Make:
${c.layouts}

The guideline's sections:
${sectionsOf(B).map((x) => `- ${x}`).join('\n') || '- not listed'}

Choose one verdict:
- "tool": a tool above already does this. target = its id.
- "set": a layout in Make, or a set of it, does this. target = the layout id.
- "engine": it needs a new drawing system from the brand's guideline. Write the brief.
- "off-brand": it goes against the brand's guideline. Say which part.

Reply as JSON only: {"verdict": "...", "reason": "one or two plain sentences to the person who asked", "target": "id or empty", "brief": {"name": "at most 32 characters", "from": "the guideline section it builds on, copied exactly from the list above, or empty", "what": "one sentence: what people could make with it", "why": "one sentence: why it is worth building"}}. Include brief only for "engine". Use only ids listed above.`;
}
const VERDICTS = ['tool', 'set', 'engine', 'off-brand'];
export function readVerdict(B, recipes, v, request = '') {
  if (!v || !VERDICTS.includes(v.verdict)) return null;
  const reason = clip(v.reason, 400);
  if (v.verdict === 'tool') return (B.tools ?? []).some((t) => t.id === v.target) ? { verdict: 'tool', reason, target: v.target } : null;
  if (v.verdict === 'set') return B.TBY[v.target] ? { verdict: 'set', reason, target: v.target } : null;
  if (v.verdict === 'off-brand') return { verdict: 'off-brand', reason };
  const b = v.brief ?? {}; const brief = { name: clip(b.name, 40) || clip(request, 40), from: realSection(B, b.from), what: clip(b.what, 240) || clip(request, 240), why: clip(b.why, 240), request: clip(request, 400) };
  return { verdict: 'engine', reason, brief };
}
// Without Claude on the page: match the request to a layout by its words, and say so.
export function guessVerdict(B, recipes, request) {
  const words = request.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const score = (s) => words.reduce((n, w) => n + (s.toLowerCase().includes(w) ? 1 : 0), 0);
  const tool = (B.tools ?? []).map((t) => [t, score(`${t.name} ${t.use}`)]).sort((a, b) => b[1] - a[1])[0];
  if (tool && tool[1] >= 2) return { verdict: 'tool', reason: `${tool[0].name} looks like the closest match by its words; Claude is not available on this page to weigh it further.`, target: tool[0].id };
  const best = B.T.map((t) => [t, score(`${t.name} ${t.use ?? ''}`)]).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] > 0) return { verdict: 'set', reason: `The ${best[0].name} layout matches by its words; open it in Make, and save it as a set if you will repeat it. Claude is not available on this page to weigh it further.`, target: best[0].id };
  return { verdict: 'engine', reason: `Nothing ${B.name} has matches that yet. Send it to Primary as a brief; Claude is not available here to sharpen it.`, brief: { name: clip(request, 40), from: '', what: clip(request, 240), why: '', request: clip(request, 400) } };
}
