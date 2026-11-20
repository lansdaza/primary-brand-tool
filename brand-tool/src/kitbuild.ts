// The brand kit: everything an AI agent (or a person) needs to make on-brand work outside this tool, as one
// folder that is also a Claude skill. Built from the same brand record as the guideline, layouts and package,
// with the files added in Assets. Licensed fonts are included; trial fonts are not, and the kit says so.
import * as E from './engine/index.js';
import { validate } from './kit';
import type { Brand } from './ui';
import { FILM_MJS, SCORE_MJS, filmMD, scoreMD, exampleFilm, exampleOverlay } from './kitfilm';

export type KitFile = { name: string; text?: string; uri?: string; brand?: string; css?: string; color?: string; note?: string };
type Colour = { name: string; hex: string; group: string };

const slug = (s: string) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
const words = (k: string) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
const HEX = /^#[0-9a-f]{6}$/i;
const page = (p: unknown) => (p === undefined || p === '' ? '' : typeof p === 'number' ? `p.${p}` : String(p));
const BASIS = (r: any) => [r.b, page(r.p)].filter(Boolean).join(', ');

/* ---------- Reading the brand record ---------- */

function palette(B: Brand): Colour[] {
  const out: Colour[] = [], seen = new Set<string>();
  const add = (name: string, hex: string, group: string) => { if (HEX.test(hex) && !seen.has(hex.toUpperCase() + name)) { seen.add(hex.toUpperCase() + name); out.push({ name, hex: hex.toUpperCase(), group }); } };
  for (const [group, v] of Object.entries<any>(B.PACKAGE.color ?? {})) {
    if (!Array.isArray(v)) continue;
    for (const c of v) {
      if (!c || typeof c !== 'object') continue;
      if (c.hex) add(c.name, c.hex, group);
      else if (Array.isArray(c.steps)) c.steps.forEach((h: string, i: number) => add(i === 0 ? c.name : `${c.name} ${['', 'mid', 'light'][i] || i + 1}`, h, group));
      else for (const [k, h] of Object.entries<any>(c)) if (typeof h === 'string' && HEX.test(h)) add(`${c.name} ${k}`, h, group);
    }
  }
  return out;
}

// The brand surfaces' own font stacks, read from the brand's CSS: headline, body and label.
function stacks(B: Brand): Record<string, string> {
  const css = document.getElementById(`brandcss-${B.id}`)?.textContent ?? '';
  const block = css.match(new RegExp(`\\.a\\[data-brand="${B.id}"\\]\\{([^}]*)\\}`))?.[1] ?? '';
  const vars = Object.fromEntries([...block.matchAll(/(--[\w-]+):([^;]*)/g)].map((m) => [m[1], m[2].trim()]));
  const res = (v?: string): string => { const m = v?.match(/^var\((--[\w-]+)\)$/); return m ? res(vars[m[1]]) : v ?? ''; };
  return { headline: res(vars['--hf']), body: res(vars['--bf']), label: res(vars['--tf'] || vars['--bf']) };
}
const firstFamily = (stack: string) => stack.split(',')[0].trim().replace(/^["']|["']$/g, '');
const familyNames = (stack: string) => stack.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

function rulesIn(v: any, out: { t: string; b?: string; p?: unknown }[] = []): typeof out {
  if (Array.isArray(v)) v.forEach((x) => rulesIn(x, out));
  else if (v && typeof v === 'object') {
    if (typeof v.t === 'string' && (v.b || v.p !== undefined)) out.push(v);
    else for (const x of Object.values(v)) rulesIn(x, out);
  }
  return out;
}

export function guideFiles(B: Brand): KitFile[] {
  const out: KitFile[] = [], seen = new Set<string>();
  const folder = (path = '') => { const k = path.split('.')[0]; return k === 'logo' ? 'logo' : k === 'icons' ? 'icons' : k === 'imagery' || k === 'graphics' ? 'imagery' : k === 'color' ? 'colour' : k === 'type' ? 'type' : 'files'; };
  const walk = (v: any) => {
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v.files) && v.files.every((f: any) => f && typeof f === 'object' && f.name)) {
      for (const f of v.files) if (!seen.has(f.name)) { seen.add(f.name); out.push({ ...f, name: `${folder(v.path)}/${f.name}` }); }
    }
    for (const [k, x] of Object.entries(v)) if (k !== 'files' && k !== 'blocks') walk(x);
  };
  walk(B.guide(0));
  return out;
}

// Open-licence stand-in faces the brand surfaces already carry (@font-face rules with embedded files).
function standInFonts(B: Brand) {
  const css = document.getElementById(`brandcss-${B.id}`)?.textContent ?? '';
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const body = m[1];
    const family = body.match(/font-family:\s*["']?([^;"']+)/)?.[1]?.trim() ?? 'Font';
    const weight = body.match(/font-weight:\s*(\d+)/)?.[1] ?? '400';
    const italic = /font-style:\s*italic/.test(body);
    const uri = body.match(/url\(["']?(data:[^)"']+)/)?.[1];
    return uri ? { family, weight: +weight, italic, uri, file: `${family.replace(/\s+/g, '')}-${weight}${italic ? 'Italic' : ''}.woff2` } : null;
  }).filter(Boolean) as { family: string; weight: number; italic: boolean; uri: string; file: string }[];
}

const typeWeight = (w: unknown) => ({ thin: 100, light: 300, regular: 400, book: 400, medium: 500, semibold: 600, bold: 700, black: 900 } as Record<string, number>)[String(w ?? '').toLowerCase().replace(/[\s-]/g, '')];
const pct = (s: unknown) => { const m = String(s ?? '').match(/(-?\d+(?:\.\d+)?)%/); return m ? +m[1] / 100 : undefined; };

/* ---------- The kit ---------- */

export function kitName(B: Brand) { return `${B.id}-brand`; }

export function buildKit(B: Brand): KitFile[] {
  const root = `${kitName(B)}/`;
  const pkg: any = B.PACKAGE;
  const today = new Date().toISOString().slice(0, 10);
  const colours = palette(B);
  const tones = Object.entries<any>(pkg.tones).map(([id, t]) => ({ id, ...t, contrast: Math.round(E.contrast(t.ground, t.ink) * 10) / 10 }));
  const stack = stacks(B);
  const slots: any[] = (B as any).slots ?? [];
  const files: KitFile[] = [];
  const add = (name: string, f: Omit<KitFile, 'name'> & { name?: string }) => files.push({ ...f, name: root + name });

  // Fonts: licensed brand files, then the open-licence stand-ins.
  const faces: string[] = [], fontNotes: string[] = [], trial: string[] = [];
  for (const s of slots.filter((x) => x.kind === 'font')) {
    const v = (B as any).ASSETS?.[s.id];
    const licence = E.fontState(B, s.id);
    if (!licence) { fontNotes.push(`${s.family}: not supplied. ${s.standIn} stands in.`); continue; }
    if (licence === 'trial') { trial.push(s.family); fontNotes.push(`${s.family}: trial files only, left out of this kit. ${s.standIn} stands in until a licence is set.`); continue; }
    for (const f of v.files) if (f.data) {
      const path = `fonts/${slug(s.family)}/${f.name}`;
      add(path, { uri: f.data });
      faces.push(`@font-face{font-family:"${s.family}";src:url("${path}");font-weight:${f.weight ?? 400};font-style:${f.style ?? 'normal'};font-display:swap}`);
    }
    fontNotes.push(`${s.family}: included (${E.LICENCES[licence]} licence).`);
  }
  const stand = standInFonts(B);
  for (const f of stand) { add(`fonts/stand-in/${f.file}`, { uri: f.uri }); faces.push(`@font-face{font-family:"${f.family}";src:url("fonts/stand-in/${f.file}");font-weight:${f.weight};font-style:${f.italic ? 'italic' : 'normal'};font-display:swap}`); }
  if (stand.length) add('fonts/stand-in/README.md', { text: `# Stand-in fonts\n\n${[...new Set(stand.map((f) => f.family))].join(', ')}: open-licence Google Fonts the guideline's own fonts fall back to. Free to use and embed under the SIL Open Font License.\n` });

  // Images and logos: the guideline's downloads, then files added in Assets.
  for (const f of guideFiles(B)) add(f.name, f);
  for (const s of slots.filter((x) => x.kind !== 'font')) for (const f of (B as any).ASSETS?.[s.id]?.files ?? []) if (f.data) add(`${slug(s.group)}/${f.name}`, { uri: f.data });

  // Layouts: specs, one example job each, the renderer and the checker.
  const scenes: any[] = (B as any).SC ?? [];
  const layouts = [...B.T.map((t: any) => ({ ...E.describe(t), layout: 'layout' })), ...B.SL.map((t: any) => ({ ...E.describe(t), layout: 'slide' })), ...scenes.map((t: any) => ({ ...E.describe(t), layout: 'scene' }))];
  add('layouts.json', { text: JSON.stringify(layouts, null, 2) });
  add('formats.json', { text: JSON.stringify({ about: 'Every size a layout can be made at. Print sizes are at 300 dpi unless dpi says otherwise. A layout offers the sizes in its families where its smallest type stays at or above 6 pt in print and 12 px on screen; layouts.json lists each layout\'s sizes under "size".', families: E.FAMILIES, sizes: E.SIZES }, null, 2) });
  for (const t of [...B.T, ...B.SL, ...scenes]) {
    const d = E.defaults(t);
    if (validate(t, d).length) continue;
    add(`jobs/${t.id}.json`, { text: JSON.stringify({ template: t.id, params: d }, null, 2) + '\n' });
  }
  add('render.html', { text: renderHTML(B) });
  add('render.mjs', { text: RENDER_MJS });
  // Films: the particle engine (where the brand has one), the agent's own overlay, and a score made from the picture.
  if (FILM_MJS && SCORE_MJS) {
    add('film.mjs', { text: FILM_MJS });
    add('score.mjs', { text: SCORE_MJS });
    const names = files.map((f) => f.name.slice(root.length));
    // The example film is the brand's own: its statement line, a photograph, a ground from its tones, the logo for that ground.
    const dark = (B as any).id === 'aurelius', tone = tones.find((t: any) => (dark ? E.lum(t.ground) < 0.2 : E.lum(t.ground) > 0.8)) ?? tones[0];
    const st = (B as any).TBY?.statement ? E.defaults((B as any).TBY.statement) : {};
    const lines = String(st.headline ?? B.name).split('\n').filter(Boolean);
    const light = (n: string) => /(bone|white|off-white)/i.test(n), darkLogo = (n: string) => /(ink|black|off-black)/i.test(n);
    const logos = names.filter((n) => n.startsWith('logo/') && /\.(svg|png)$/i.test(n) && !/icon|logomark|charlie/i.test(n));
    const logo = (E.lum(tone.ground) < 0.5 ? logos.find(light) : logos.find(darkLogo)) ?? logos[0] ?? '';
    const photo = names.find((n) => n.startsWith('imagery/') && /\.(jpe?g|png)$/i.test(n) && !/texture|pattern/i.test(n)) ?? '';
    const ex = { ground: tone.ground, ink: tone.ink, lines, footer: String(st.footer ?? st.eyebrow ?? ''), logo, photo };
    add('FILM.md', { text: filmMD(B, ex) });
    add('SCORE.md', { text: scoreMD(B) });
    add('example/film.json', { text: JSON.stringify(exampleFilm(B, ex), null, 2) + '\n' });
    add('example/overlay.html', { text: exampleOverlay(B, ex) });
  }
  const families = [...new Set([...familyNames(stack.headline), ...familyNames(stack.body), ...familyNames(stack.label)])];
  add('check.mjs', { text: checkMJS(B, colours, tones, families) });

  // Colour, type and tokens.
  add('tokens.json', { text: JSON.stringify(tokens(B, colours, tones, stack), null, 2) });
  add('brand.css', { text: brandCSS(B, colours, tones, stack, faces, today) });
  add('brand.json', { text: JSON.stringify({ ...pkg, voice: (B as any).voice, kit: { made: today, by: 'Primary brand tool', fonts: fontNotes } }, null, 2) });

  // Words: the brief, the skill and a note for people.
  const open = pkg.flags.filter((f: any) => f.status === 'open');
  add('BRAND.md', { text: brandMD(B, colours, tones, stack, fontNotes, layouts, open, today) });
  add('SKILL.md', { text: skillMD(B, layouts.length, trial, open.length) });
  add('README.md', { text: readme(B, today) });
  // Read-me-first order: the words, then data, then the renderer, then folders.
  const ORDER = ['SKILL.md', 'BRAND.md', 'FILM.md', 'SCORE.md', 'README.md', 'brand.json', 'tokens.json', 'brand.css', 'layouts.json', 'formats.json', 'render.html', 'render.mjs', 'film.mjs', 'score.mjs', 'check.mjs'];
  const rank = (f: KitFile) => { const rel = f.name.slice(root.length); const i = ORDER.indexOf(rel); return i >= 0 ? i : ORDER.length + (rel.includes('/') ? 1 : 0); };
  return files.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export async function kitZip(B: Brand) { return E.zipFiles(buildKit(B)); }

/* ---------- Generated files ---------- */

function renderHTML(B: Brand) {
  const text = (sel: string) => document.querySelector(sel)?.textContent ?? '';
  const w = window as any;
  // Other brands' images are blanked: their modules still load, but this kit carries only its own brand.
  const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const blank = (o: any) => (typeof o === 'string' ? '' : Object.fromEntries(Object.keys(o ?? {}).map((k) => [k, PX])));
  const keep = (id: string, o: any) => (B.id === id ? o : blank(o));
  const data = `window.__AURELIUS_IMG=${JSON.stringify(keep('aurelius', w.__AURELIUS_IMG))};window.__AURELIUS_LOGO=${JSON.stringify(w.__AURELIUS_LOGO)};window.__AURELIUS_EARTH_LUM=${JSON.stringify(B.id === 'aurelius' ? w.__AURELIUS_EARTH_LUM : '')};window.__SDV_IMG=${JSON.stringify(keep('smalldoor', w.__SDV_IMG))};window.__SDV_META=${JSON.stringify(w.__SDV_META)};window.__TELLI_IMG=${JSON.stringify(keep('telli', w.__TELLI_IMG))};window.__TELLI_META=${JSON.stringify(w.__TELLI_META)};`;
  const assets: Record<string, any> = {};
  for (const s of (B as any).slots ?? []) {
    const v = (B as any).ASSETS?.[s.id];
    if (!v?.files?.length) continue;
    if (s.kind === 'font' && E.fontState(B, s.id) === 'trial') continue;
    assets[s.id] = { licence: v.licence, files: v.files.filter((f: any) => f.data) };
  }
  const safe = (s: string) => s.replace(/<\/(script|style)/gi, '<\\/$1');
  const rails = B.id === 'aurelius' ? E.worldRails() : undefined;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E.esc(B.name)} layouts</title>
<style id="tplcss">${safe(text('#tplcss'))}</style>
<style id="brandcss-${B.id}">${safe(text(`#brandcss-${B.id}`))}</style>
</head><body><div id="root"></div>
<script>window.__KIT=${safe(JSON.stringify({ brand: B.id, assets, rails }))};</script>
<script>${safe(data)}</script>
<script>${safe(text('#pb-app'))}</script>
</body></html>`;
}

function tokens(B: Brand, colours: Colour[], tones: any[], stack: Record<string, string>) {
  const color: any = {};
  for (const c of colours) (color[slug(c.group)] ??= {})[slug(c.name)] = { $type: 'color', $value: c.hex };
  const tone: any = {};
  for (const t of tones) tone[t.id] = { $description: `${t.name} · ${t.kind} · ink on ground ${t.contrast}:1`, ground: { $type: 'color', $value: t.ground }, ink: { $type: 'color', $value: t.ink }, ...(t.muted ? { muted: { $type: 'color', $value: t.muted } } : {}) };
  const family: any = {};
  for (const [k, v] of Object.entries(stack)) if (v) family[k] = { $type: 'fontFamily', $value: familyNames(v) };
  const typography: any = {};
  const fam: any = B.PACKAGE.type?.families ?? {};
  for (const s of B.PACKAGE.type?.styles ?? []) {
    const face = s.face ?? '';
    const which = s.family === 'mono' ? 'label' : s.id === 'headline' || s.id === 'subhead' ? 'headline' : s.family ? 'body' : Object.entries(stack).find(([, v]) => v && face.startsWith(firstFamily(v)))?.[0] ?? 'body';
    const weight = typeWeight(s.weight ?? face.replace(/^.*\s(\w+)\+?$/, '$1')) ?? 400;
    typography[s.id] = { $type: 'typography', $description: [s.name, s.extra].filter(Boolean).join('. '), $value: { fontFamily: `{font.family.${which}}`, fontWeight: weight, ...(pct(s.tracking) !== undefined ? { letterSpacing: `${pct(s.tracking)}em` } : {}), ...(pct(s.leading) !== undefined ? { lineHeight: pct(s.leading) } : {}) } };
  }
  void fam;
  return { $description: `${B.name} design tokens, in the W3C Design Tokens format. Generated by the Primary brand tool.`, color, tone, font: { family }, typography };
}

function brandCSS(B: Brand, colours: Colour[], tones: any[], stack: Record<string, string>, faces: string[], today: string) {
  return `/* ${B.name}: colours, type and tones as CSS. Generated by the Primary brand tool on ${today}.
   Use a tone class for any surface: it sets a ground and the ink that passes on it. */
${faces.join('\n')}

:root {
${colours.map((c) => `  --color-${slug(c.group)}-${slug(c.name)}: ${c.hex};`).join('\n')}
${Object.entries(stack).filter(([, v]) => v).map(([k, v]) => `  --font-${k}: ${v};`).join('\n')}
}

${tones.map((t) => `/* ${t.name}, ${t.kind}: ${t.contrast}:1 */\n.tone-${t.id} { --ground: ${t.ground}; --ink: ${t.ink};${t.muted ? ` --muted: ${t.muted};` : ''} background: var(--ground); color: var(--ink); }`).join('\n')}
`;
}

function table(head: string[], rows: string[][]) {
  const cell = (s: string) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return `| ${head.join(' | ')} |\n| ${head.map(() => '---').join(' | ')} |\n${rows.map((r) => `| ${r.map(cell).join(' | ')} |`).join('\n')}\n`;
}

function brandMD(B: Brand, colours: Colour[], tones: any[], stack: Record<string, string>, fontNotes: string[], layouts: any[], open: any[], today: string) {
  const pkg: any = B.PACKAGE, meta = pkg.meta ?? {};
  const rules = (v: any) => rulesIn(v).map((r) => `- ${r.t} _(${BASIS(r)})_`).join('\n');
  const sections: string[] = [];
  sections.push(`# ${B.name}\n\nThe ${B.name} brand guideline, as rules an agent can follow. Source: ${meta.source ?? (B as any).source?.label ?? 'the brand guideline'}${meta.edition ? `, ${meta.edition}` : ''}. Generated by the Primary brand tool on ${today}.\n\nEach rule names its basis and source page. **Stated** is written in the guideline, **measured** is read from its drawings or files, **inferred** is deduced from examples and not yet signed off. Follow stated and measured rules exactly; follow inferred rules unless the person you are working for says otherwise.`);
  if (pkg.character?.length) sections.push(`## Character\n\n${pkg.character.join(', ')}.`);
  if ((B as any).voice) sections.push(`## Voice\n\n${(B as any).voice}`);
  if (pkg.logo) sections.push(`## Logo\n\n${rules(pkg.logo.rules ?? [])}${pkg.logo.never?.length ? `\n\n**Never:**\n${pkg.logo.never.map((n: string) => `- ${n}`).join('\n')}` : ''}\n\nFiles are in \`logo/\`. Use them as they are; never redraw the logo.`);
  sections.push(`## Colour\n\nUse only these colours. ${pkg.color?.balance ? `Balance across a set: ${Object.entries(pkg.color.balance).map(([k, v]) => `${v}% ${k}`).join(', ')}.` : ''}\n\n${table(['Name', 'Hex', 'Group'], colours.map((c) => [c.name, c.hex, c.group]))}\n${rules(pkg.color?.rules ?? [])}\n\n### Tones\n\nA tone is a ground and the ink that goes on it. Put text on a ground only with that ground's ink. Contrast is ink on ground (4.5:1 or more passes for body text).\n\n${table(['Tone', 'Ground', 'Ink', 'Kind', 'Contrast'], tones.map((t) => [`${t.name} (\`${t.id}\`)`, t.ground, t.ink, t.kind, `${t.contrast}:1`]))}`);
  const styles = pkg.type?.styles ?? [];
  sections.push(`## Type\n\n${table(['Role', 'Font stack'], Object.entries(stack).filter(([, v]) => v).map(([k, v]) => [k, v]))}\n${fontNotes.map((n) => `- ${n}`).join('\n')}\n\n${styles.length ? table(['Style', 'Face', 'Weight', 'Tracking', 'Leading', 'Notes'], styles.map((s: any) => [s.name, s.face ?? pkg.type?.families?.[s.family]?.name ?? s.family ?? '', s.weight ?? '', s.tracking ?? '', s.leading ?? '', s.extra ?? ''])) : ''}${pkg.type?.sizes ? `\nSizes: ${Object.entries(pkg.type.sizes).map(([k, v]) => `${k} ${v}`).join(', ')}.\n` : ''}\n${rules(pkg.type?.rules ?? [])}`);
  for (const key of ['imagery', 'graphics', 'icons']) {
    const sec = pkg[key];
    if (!sec || typeof sec !== 'object') continue;
    const parts = Object.entries<any>(sec).map(([k, v]) => {
      if (!v || typeof v !== 'object') return typeof v === 'string' ? `- ${words(k)}: ${v}` : '';
      const notes = ['rule', 'note', 'use', 'prompt'].map((f) => (typeof v[f] === 'string' ? `${f === 'prompt' ? 'Image prompt' : words(f)}: ${v[f]}` : '')).filter(Boolean);
      const r = rules(v);
      return notes.length || r ? `### ${words(k)}\n\n${notes.join('\n\n')}${r ? `\n\n${r}` : ''}` : '';
    }).filter(Boolean);
    if (parts.length) sections.push(`## ${words(key)}\n\n${parts.join('\n\n')}`);
  }
  sections.push(`## Layouts\n\nPrefer a layout to building from scratch. Each has fixed parameters with limits: write copy that fits rather than shrinking type. Full specs are in \`layouts.json\`; an example job for each is in \`jobs/\`. Set \`format\` to a size id from the layout's \`size\` list (every size is in \`formats.json\`). A size that is not listed is one where the layout's type would be too small, so pick another layout.\n\n${table(['Id', 'Name', 'Kind', 'Sizes', 'Use'], layouts.map((l) => [`\`${l.id}\``, l.name, l.kind ?? l.layout, Array.isArray(l.size) ? l.size.join('×') : `${(l.families ?? []).join(', ')} · ${Object.keys(l.size ?? {}).length} sizes`, l.use ?? '']))}`);
  const P = (B as any).presence, SC: any[] = (B as any).SC ?? [];
  if (P && SC.length) sections.push(`## Brand in use\n\nThe table-stakes views every guideline is expected to show, drawn from this brand's own layouts: the app icon in use, the social profiles, posts in a phone and the email signature. Each is a scene layout (\`scene-*\` in \`layouts.json\`, a 1600×1000 artboard rendered at 2x) with an example job in \`jobs/\`. The platform chrome is generic, with no platform logos.\n\n${table(['Id', 'Shows', 'Dials'], SC.map((t: any) => [`\`${t.id}\``, t.use, Object.keys(t.params).join(', ')]))}\n\n- **Product kind.** ${B.name} is set as ${P.kind === 'app' ? 'an app' : P.kind === 'web' ? 'a website' : 'a service'}. \`scene-icon\` with \`"product": "app"\` shows a home screen, the dock and a browser tab; \`web\` or \`service\` shows the icon at every size, a browser tab and a search result.\n- **Icon.** \`app-icon\` is the master (1024×1024, full bleed: platforms round the corners). Render it once and resize for an icon set: iOS 1024, 180, 167, 152, 120, 87, 80, 60, 58, 40; Android 512, 192, 144, 96, 72, 48; web 512, 192, 180 (apple-touch-icon), 48, 32, 16; profile photo 400.\n- **Swapping content.** \`banner\` is any layout drawn at both linkedin-cover and x-header; \`post\` any drawn at post-4-5; \`story\` any drawn at story-9-16. They take that layout's default copy; to show your own copy, make the post with its layout first and describe the scene around it.\n- **Stand-ins.** Name, handle, website, bio, follower counts and the signature's person are stand-ins (${P.handle}, ${P.site}) until the brand gives its own. Set \`name\`, \`handle\`, \`site\`, \`bio\`, and \`person\`, \`role\`, \`phone\` for the signature.\n- **Email.** Mail apps show only common fonts, so a pasted signature is set in Helvetica or Arial with the brand's ink and the icon as a small image.`);
  sections.push(`## Open questions\n\n${open.length ? `These are not settled in the guideline. Use what "Package" says, and mention the question when it affects your work.\n\n${open.map((f: any) => { const st = E.flagStatus(B, B.BRAND.flags.find((x: any) => x.id === f.id)); return `- **${f.title}** (${page(f.p)}). Source: ${f.says} Package: ${f.uses}${st.progress ? ` Now: ${st.progress}` : ''}`; }).join('\n')}` : 'None: every review item is resolved.'}`);
  return sections.join('\n\n') + '\n';
}

function skillMD(B: Brand, nLayouts: number, trial: string[], nOpen: number) {
  const name = kitName(B);
  return `---
name: ${name}
description: ${B.name} brand system with colours, type, logo rules, voice and ${nLayouts} ready layouts with a renderer and a checker. Use whenever you make, write or check anything for ${B.name}, such as social posts, slides, documents, web pages, images or copy.
---

# ${B.name} brand

Read \`BRAND.md\` first. It is the ${B.name} guideline written as rules, each with its basis and source page.

## Making an asset from a layout

1. Pick the layout that fits from \`layouts.json\` (or the table in BRAND.md). Prefer a layout to building from scratch.
2. Copy its example job from \`jobs/<layout>.json\` and change only \`params\`. For another size, set \`format\` to an id from the layout's \`size\` list. Text has a character limit and lists have a minimum and maximum; stay inside them by writing shorter copy, never by asking for smaller type.
3. Render it:
   \`\`\`
   node render.mjs job.json out.png
   \`\`\`
   This needs Node 18 or later and Playwright (\`npm i playwright\` then \`npx playwright install chromium\`). If the browser download is blocked, look for a Chromium already installed (for example under \`/opt/pw-browsers\` or \`$PLAYWRIGHT_BROWSERS_PATH\`) and install the Playwright version that matches it. \`node render.mjs --check job.json\` only checks the job. A job that breaks a rule is refused with the reason; fix the job, do not work around it. A list of jobs renders to a folder: \`node render.mjs jobs.json out/\`. Layouts with a live globe also render as a clip: name the output \`out.mp4\`. It is drawn frame by frame, an 8-second H.264 MP4 at 30 fps, and takes about a minute; motion in the job must be on.
4. Look at the image before you hand it over.

## Showing the brand in use

For "show our app icon", "our Instagram", "social profiles", "email signature" or a guideline page of the brand in use, render a scene: \`node render.mjs jobs/scene-posts.json out.png\` (also \`scene-icon\`, \`scene-social\`, \`scene-signature\`). Change only \`params\`; the dials and what they take are under "Brand in use" in BRAND.md.

## Making a film

A brand video, promo or animated piece is directed, not assembled from layouts. Read \`FILM.md\` and \`SCORE.md\`: \`film.mjs\` renders your film frame by frame to MP4${(B as any).id === 'aurelius' ? ' with the brand’s particle engine (globe, landmarks, forms that build and dissolve) under your own HTML/CSS layer' : ' from your own HTML/CSS layer'}, and \`score.mjs\` scores it from its own timeline, offline. Propose concepts and a storyboard before rendering the whole film.

## Making something no layout covers

- Use \`brand.css\` (variables, tone classes and @font-face rules) or \`tokens.json\` (W3C design tokens).
- Use only palette colours. Put text on a ground only with that tone's ink (the Tones table).
- Use the logo files in \`logo/\` as they are.
- Then run \`node check.mjs your-file.html\`. It reports colours outside the palette, fonts outside the brand, and text and ground pairs below 4.5:1.

## Before you hand work over

${trial.length ? `- ${trial.join(' and ')} ${trial.length === 1 ? 'is' : 'are'} only licensed as a trial, so this kit uses the stand-in. Say so if the work is for delivery.\n` : ''}- ${nOpen ? `${nOpen} guideline question${nOpen === 1 ? ' is' : 's are'} still open (BRAND.md, "Open questions"). Mention any that affect your work.` : 'Every guideline question is resolved.'}
- If you cannot run Node, still follow BRAND.md and the layout limits, and say which layout and parameters you would use.
`;
}

function readme(B: Brand, today: string) {
  return `# ${B.name} brand kit

Made with the Primary brand tool on ${today}. Everything an AI agent or a person needs to make on-brand work outside the tool.

**Use it as a Claude skill:** add the \`${kitName(B)}\` folder (or this zip) as a skill in Claude, or put the folder in \`.claude/skills/\` in a Claude Code project. Claude then reads it whenever the work is for ${B.name}.

| File | What it is |
| --- | --- |
| SKILL.md | How an agent should use this kit |
| BRAND.md | The guideline as rules, with basis and source page |
| brand.json | The full machine-readable package |
| tokens.json | Colours, tones and type as W3C design tokens |
| brand.css | CSS variables, tone classes and @font-face rules |
| layouts.json, jobs/ | Layout specs with their limits and sizes, and an example job for each |
| formats.json | Every size, grouped into shape families |
| render.html, render.mjs | Draws a job with the brand's own engine. Open render.html in a browser to see every layout |
| film.mjs, FILM.md, example/ | Renders a directed film frame by frame to MP4${(B as any).id === 'aurelius' ? ': the brand’s particle engine plus your own HTML/CSS layer' : ' from your own HTML/CSS layer'} |
| score.mjs, SCORE.md | Scores a film from its own timeline and checks loudness and sync |
| check.mjs | Checks any HTML, SVG or CSS against the palette, fonts and contrast |
| fonts/, logo/, imagery/ | The brand's files |
`;
}

const RENDER_MJS = `#!/usr/bin/env node
// Draws a layout job with the brand's own engine (render.html) and writes a PNG, or a video for layouts with a live globe.
//   node render.mjs job.json out.png        one job
//   node render.mjs jobs.json out/          a list of jobs, one file each
//   node render.mjs --check job.json        check only
// A job is { "template": "<layout id>", "params": { ... } }. See layouts.json and jobs/.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const check = args.includes('--check');
const [jobFile, out] = args.filter((a) => !a.startsWith('--'));
if (!jobFile) { console.error('Usage: node render.mjs job.json out.png | --check job.json'); process.exit(2); }
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('render.mjs needs Playwright: npm i playwright && npx playwright install chromium'); process.exit(2); }

const parsed = JSON.parse(await readFile(jobFile, 'utf8'));
const jobs = Array.isArray(parsed) ? parsed : [parsed];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let failed = 0;
for (const [i, job] of jobs.entries()) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.addInitScript((j) => { window.__KIT_JOB = j; }, job);
  await page.goto(pathToFileURL(path.join(here, 'render.html')).href);
  const res = await (await page.waitForFunction(() => window.kitResult, null, { timeout: 90000 })).jsonValue();
  const label = job.template + (jobs.length > 1 ? \` #\${i + 1}\` : '');
  if (!res.ok) { failed++; console.error(\`\${label}: refused\\n  - \${res.errors.join('\\n  - ')}\`); await page.close(); continue; }
  for (const w of res.warnings) console.warn(\`\${label}: \${w}\`);
  if (check) { console.log(\`\${label}: ok, \${res.width}×\${res.height}\`); await page.close(); continue; }
  let target = out ?? \`\${job.template}.png\`;
  if (jobs.length > 1) { const dir = out ?? 'out'; await mkdir(dir, { recursive: true }); target = path.join(dir, \`\${String(i + 1).padStart(2, '0')}-\${job.template}.png\`); }
  const video = /\\.(webm|mp4)$/i.test(target);
  try {
    const data = await page.evaluate((fmt) => window.kitExport(fmt), video ? 'video' : 'png');
    const ext = data.slice(5, data.indexOf(';')).split('/')[1].replace('x-matroska', 'webm');
    if (video && !target.endsWith('.' + ext)) target = target.replace(/\\.\\w+$/, '.' + ext);
    await mkdir(path.dirname(path.resolve(target)), { recursive: true });
    await writeFile(target, Buffer.from(data.split(',')[1], 'base64'));
    console.log(\`\${label}: \${target} (\${res.width}×\${res.height})\`);
  } catch (e) { failed++; console.error(\`\${label}: could not render (\${e.message})\`); }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
`;

function checkMJS(B: Brand, colours: Colour[], tones: any[], families: string[]) {
  const allowed = [...new Set([...colours.map((c) => c.hex), ...tones.flatMap((t) => [t.ground, t.ink, t.muted].filter(Boolean)).map((h: string) => h.toUpperCase())])];
  const names = Object.fromEntries([...colours.map((c) => [c.hex, c.name]), ...tones.flatMap((t) => [[t.ground.toUpperCase(), `${t.name} ground`], [t.ink.toUpperCase(), `${t.name} ink`]])]);
  return `#!/usr/bin/env node
// Checks HTML, SVG or CSS files against the ${B.name} palette, type and contrast.
//   node check.mjs file.html [more files]
// Reports colours outside the palette, font families outside the brand, and text on a ground below 4.5:1.
import { readFile } from 'node:fs/promises';

const BRAND = ${JSON.stringify({ name: B.name, colours: allowed, names, families }, null, 1)};
const GENERIC = ['serif', 'sans-serif', 'monospace', 'system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif', 'inherit', 'initial', 'unset', 'cursive', 'emoji'];
const hex = (s) => { s = s.replace('#', ''); if (s.length === 3 || s.length === 4) s = [...s.slice(0, 3)].map((c) => c + c).join(''); return '#' + s.slice(0, 6).toUpperCase(); };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const near = (h) => BRAND.colours.find((c) => rgb(c).every((v, i) => Math.abs(v - rgb(h)[i]) <= 2));
const colourIn = (s) => { const m = s.match(/#[0-9a-f]{3,8}\\b/i); if (m) return hex(m[0]); const r = s.match(/rgba?\\(\\s*(\\d+)[ ,]+(\\d+)[ ,]+(\\d+)/i); return r ? '#' + r.slice(1, 4).map((v) => (+v).toString(16).padStart(2, '0')).join('').toUpperCase() : null; };

let issues = 0;
for (const file of process.argv.slice(2)) {
  const text = (await readFile(file, 'utf8')).replace(/data:[^)"'\\s]+/g, '');
  const found = [];
  const seen = new Set();
  for (const m of text.matchAll(/#[0-9a-f]{3,8}\\b|rgba?\\([^)]*\\)/gi)) {
    const h = colourIn(m[0]);
    if (!h || seen.has(h)) continue;
    seen.add(h);
    if (!near(h)) found.push(\`Colour \${h} is not in the palette.\`);
  }
  for (const m of text.matchAll(/font-family\\s*[:=]\\s*["']?([^;"'}>]+)/gi)) {
    const fams = m[1].split(',').map((f) => f.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    const first = fams[0];
    if (first && !GENERIC.includes(first.toLowerCase()) && !first.startsWith('var(') && !BRAND.families.some((f) => f.toLowerCase() === first.toLowerCase())) found.push(\`Font "\${first}" is not one of the brand's: \${BRAND.families.join(', ')}.\`);
  }
  for (const m of text.matchAll(/\\{([^{}]*)\\}|style\\s*=\\s*"([^"]*)"/g)) {
    const block = m[1] ?? m[2] ?? '';
    const fg = block.match(/(?:^|[;\\s])color\\s*:\\s*([^;]+)/i), bg = block.match(/background(?:-color)?\\s*:\\s*([^;]+)/i);
    if (!fg || !bg) continue;
    const a = colourIn(fg[1]), b = colourIn(bg[1]);
    if (a && b && ratio(a, b) < 4.5) found.push(\`\${a} on \${b} is \${ratio(a, b).toFixed(1)}:1, below 4.5:1. Use the ground's own ink (BRAND.md, Tones).\`);
  }
  if (found.length) { issues += found.length; console.log(\`\${file}\\n\${[...new Set(found)].map((f) => '  - ' + f).join('\\n')}\`); }
  else console.log(\`\${file}: on brand\`);
}
process.exit(issues ? 1 : 0);
`;
}
