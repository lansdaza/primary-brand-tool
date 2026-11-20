// The Brand Sprint questionnaire: Primary's intake form, as data. The questions are the ones clients answer in
// Notion today, in the same order; `notion` is the property name each one has in the Notion responses database,
// which is how a CSV or Markdown export maps back onto it without guessing.
export type QuestionId =
  | 'company' | 'contact' | 'describe' | 'mission' | 'sauce' | 'adjectives' | 'website' | 'socials'
  | 'like' | 'dislike' | 'look' | 'feel' | 'avoid' | 'customer' | 'demographics'
  | 'competitors' | 'competitorBrand' | 'spaceBrands' | 'inspoLike' | 'inspiredBy'
  | 'logo' | 'colour' | 'type' | 'board' | 'action' | 'messages' | 'product';
export type Question = { id: QuestionId; q: string; section: string; notion: string[]; short?: boolean };
export type Answers = Partial<Record<QuestionId, string>>;

export const SECTIONS = ['About you', 'The company', 'Your brand today', 'Where it’s going', 'Who it’s for', 'The landscape', 'Identity', 'Website and product'];

export const QUESTIONS: Question[] = [
  { id: 'company', section: 'About you', q: 'What’s your company name?', notion: ['Company', 'Company name'], short: true },
  { id: 'contact', section: 'About you', q: 'What’s your name & title?', notion: ['Submitted By', 'Name & title', 'Name'], short: true },
  { id: 'website', section: 'About you', q: 'What is your company website?', notion: ['Company Website', 'Website'], short: true },
  { id: 'socials', section: 'About you', q: 'Link(s) to your social accounts (if applicable)', notion: ['Links to Social Accounts (if applicable)', 'Links to Social Accounts', 'Social'] },
  { id: 'describe', section: 'The company', q: 'Describe your company in 2–3 sentences', notion: ['Describe company', 'Describe Company', 'Description'] },
  { id: 'mission', section: 'The company', q: 'What’s your company mission?', notion: ['Mission'] },
  { id: 'sauce', section: 'The company', q: 'What is your special sauce? What makes you different?', notion: ['Special Sauce'] },
  { id: 'adjectives', section: 'The company', q: 'What are 5 adjectives that describe your company?', notion: ['5 Adjectives', 'Adjectives'], short: true },
  { id: 'like', section: 'Your brand today', q: 'What do you like about your current brand?', notion: ['Like Branding'] },
  { id: 'dislike', section: 'Your brand today', q: 'What do you dislike about your current brand?', notion: ['Dislike Branding'] },
  { id: 'look', section: 'Where it’s going', q: 'What are five words or phrases that best capture the visual style you want your brand to express?', notion: ['Look & Feel - 5 adjective', 'Look & Feel - 5 adjectives', 'Look & Feel'] },
  { id: 'feel', section: 'Where it’s going', q: 'What attributes and/or emotions do you want associated with your brand?', notion: ['YES att. / emotions', 'YES att./emotions'] },
  { id: 'avoid', section: 'Where it’s going', q: 'What attributes and/or emotions do you NOT want associated with your brand?', notion: ['NOT att. / emotions', 'NOT att./emotions'] },
  { id: 'customer', section: 'Who it’s for', q: 'Who is your primary customer?', notion: ['Primary Customer'] },
  { id: 'demographics', section: 'Who it’s for', q: 'Describe your ideal target customer’s demographics (age, gender, job, location, income, education, etc.)', notion: ['Ideal Customer Demo', 'Ideal Customer Demographics'] },
  { id: 'competitors', section: 'The landscape', q: 'Who are your primary competitors?', notion: ['Competitors'] },
  { id: 'competitorBrand', section: 'The landscape', q: 'Which competitor has the best branding?', notion: ['Competitor Brand'] },
  { id: 'spaceBrands', section: 'The landscape', q: 'Who else in your space has good branding/websites in your opinion?', notion: ['Space - Brands', 'Space Brands'] },
  { id: 'inspoLike', section: 'The landscape', q: 'What do you like about these brands/websites?', notion: ['Inspo Like'] },
  { id: 'inspiredBy', section: 'The landscape', q: 'What other websites or brands do you like that we should be inspired by? Why?', notion: ['Inspired By'] },
  { id: 'logo', section: 'Identity', q: 'Do you have any ideas for your logo?', notion: ['Logo ideas', 'Logo Ideas'] },
  { id: 'colour', section: 'Identity', q: 'What colors might best represent your company? Do you have any color preferences?', notion: ['Color ideas', 'Colour ideas', 'Color Ideas'] },
  { id: 'type', section: 'Identity', q: 'Are there any typeface preferences you have? Do you prefer a serif or sans serif?', notion: ['Typeface ideas', 'Typeface Ideas'] },
  { id: 'board', section: 'Identity', q: 'Is there a Pinterest board or other design inspiration we should look at?', notion: ['Pinterest'] },
  { id: 'action', section: 'Website and product', q: 'What is the one action you want people to take on your company’s website?', notion: ['One Action'], short: true },
  { id: 'messages', section: 'Website and product', q: 'What are the three main messages you want to convey on your company’s website?', notion: ['3 Messages', 'Three Messages'] },
  { id: 'product', section: 'Website and product', q: 'Please provide 6–8 screenshots of your product UI or Figma file link', notion: ['Product UI Screenshots or Figma Links', 'Product UI Screenshots'] },
];
export const Q_BY = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<QuestionId, Question>;
export const MAX_ANSWER = 6000;

export const answered = (a?: Answers) => QUESTIONS.filter((q) => (a?.[q.id] ?? '').trim()).length;
export const urlsIn = (s = '') => [...new Set((s.match(/https?:\/\/[^\s,)"'<>]+/g) ?? []).map((u) => u.replace(/[.;:]+$/, '')))];

/* ---------- Reading an export ---------- */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const byNotion = new Map(QUESTIONS.flatMap((q) => [...q.notion, q.q].map((n) => [norm(n), q.id] as const)));
const META: Record<string, 'submittedAt' | 'submittedBy'> = { 'submitted on': 'submittedAt', 'submitted at': 'submittedAt', 'created': 'submittedAt', 'submitted by': 'submittedBy' };

export type Parsed = { answers: Answers; submittedAt?: string; submittedBy?: string; how: 'columns' | 'claude' };

/** RFC 4180 rows, enough for a Notion database export. */
export function csvRows(text: string): string[][] {
  const rows: string[][] = [[]];
  let cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { rows[rows.length - 1].push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; rows[rows.length - 1].push(cell); cell = ''; rows.push([]); }
    else cell += c;
  }
  rows[rows.length - 1].push(cell);
  return rows.filter((r) => r.some((x) => x.trim()));
}

/** A Notion CSV export (one response per row; the newest is used) or a Markdown page export ("Property: value"). */
export function parseByColumns(text: string, kind: 'csv' | 'md'): Parsed | null {
  const out: Parsed = { answers: {}, how: 'columns' };
  const put = (key: string, value: string) => {
    const k = norm(key), v = value.trim();
    if (!v) return;
    if (META[k]) out[META[k]] = v;
    const id = byNotion.get(k);
    if (id) {
      out.answers[id] = v.slice(0, MAX_ANSWER);
      if (id === 'contact') out.submittedBy = out.submittedBy ?? v;
    }
  };
  if (kind === 'csv') {
    const rows = csvRows(text.replace(/^﻿/, ''));
    if (rows.length < 2) return null;
    const [head, ...body] = rows;
    const row = body[body.length - 1];
    head.forEach((h, i) => put(h, row[i] ?? ''));
  } else {
    // Notion page Markdown: a title line, then "Property: value" lines; long values can run on to the next lines.
    let key = '', buf: string[] = [];
    const flush = () => { if (key) put(key, buf.join('\n')); key = ''; buf = []; };
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:\*\*)?([^:*]{2,60}?)(?:\*\*)?:\s?(.*)$/);
      if (m && (byNotion.has(norm(m[1])) || META[norm(m[1])])) { flush(); key = m[1]; buf = [m[2]]; }
      else if (key) buf.push(line);
    }
    flush();
  }
  return Object.keys(out.answers).length >= 5 ? out : null;
}

/** What Claude is asked when an export can't be read by its columns (a PDF, a pasted email). */
export function mappingPrompt(text: string) {
  return `You are filing a client's answers to a brand questionnaire into fields. The text below is an export of one submission (from a Notion page, PDF or email). The PDF layout may interleave short field labels (like "Like Branding", "5 Adjectives", "Inspo Like") with the answers; use the labels to decide where each answer belongs, and keep page headers and footers out.

Copy each answer word for word. Do not summarise, correct or add anything. Leave a field out if the text has no answer for it.

Fields (id: question, then the label it usually carries):
${QUESTIONS.map((q) => `${q.id}: ${q.q} [label: ${q.notion[0]}]`).join('\n')}

Return JSON only: {"answers": {"<id>": "<answer>", ...}, "submittedBy": "<who submitted, if stated>", "submittedAt": "<date, if stated>"}

Text:
"""
${text.slice(0, 60000)}
"""`;
}

export function cleanParsed(v: any): Parsed | null {
  if (!v || typeof v !== 'object' || !v.answers || typeof v.answers !== 'object') return null;
  const answers: Answers = {};
  for (const q of QUESTIONS) { const a = v.answers[q.id]; if (typeof a === 'string' && a.trim()) answers[q.id] = a.trim().slice(0, MAX_ANSWER); }
  return { answers, submittedBy: typeof v.submittedBy === 'string' ? v.submittedBy.slice(0, 200) : undefined, submittedAt: typeof v.submittedAt === 'string' ? v.submittedAt.slice(0, 80) : undefined, how: 'claude' };
}

/* ---------- PDF text ---------- */

// pdf.js loads only when someone imports a PDF. Without a worker it runs in the page, which is fine for a questionnaire.
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let pdfjs: Promise<any> | null = null;
function loadPdfjs() {
  pdfjs ??= new Promise((ok, no) => {
    const w = window as any;
    if (w.pdfjsLib) { ok(w.pdfjsLib); return; }
    const s = document.createElement('script');
    s.src = PDFJS + 'pdf.min.js';
    s.onload = () => { w.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(w.pdfjsLib); };
    s.onerror = () => { pdfjs = null; no(new Error('pdf.js could not load')); };
    document.head.append(s);
  });
  return pdfjs;
}
export async function pdfText(file: Blob): Promise<string> {
  const lib = await loadPdfjs();
  const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= Math.min(doc.numPages, 30); n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    // Rebuild lines from positions: same baseline is one line, read left to right.
    // Words that touch are joined, a word gap is a space, and a wide gap (a label beside its answer) is three.
    const lines = new Map<number, { x: number; w: number; size: number; s: string }[]>();
    for (const it of content.items as any[]) {
      if (!it.str?.trim()) continue;
      const y = Math.round(it.transform[5] / 2) * 2;
      (lines.get(y) ?? lines.set(y, []).get(y)!).push({ x: it.transform[4], w: it.width ?? 0, size: Math.hypot(it.transform[0], it.transform[1]) || 10, s: it.str });
    }
    const join = (xs: { x: number; w: number; size: number; s: string }[]) => xs.sort((a, b) => a.x - b.x).reduce((out, it, i, all) => {
      if (!i) return it.s;
      const gap = it.x - (all[i - 1].x + all[i - 1].w);
      return out + (gap > it.size * 1.5 ? '   ' : gap > it.size * 0.12 ? ' ' : '') + it.s;
    }, '');
    pages.push([...lines.entries()].sort((a, b) => b[0] - a[0]).map(([, xs]) => join(xs).replace(/[ \t]+$/, '')).join('\n'));
  }
  return pages.join('\n\n');
}

/* ---------- What we heard ---------- */

export type Heard = {
  oneLiner?: string;
  claims?: { figure?: string; text: string }[];
  personality?: string[];
  look?: string[];
  feel?: string[];
  avoid?: string[];
  keep?: string[];
  change?: string[];
  logo?: string[];
  colour?: string[];
  type?: string[];
  audience?: { name: string; detail: string }[];
  competitors?: { name: string; group?: string; note?: string; url?: string }[];
  bestBranded?: string;
  inspiration?: { name: string; why?: string; url?: string }[];
  action?: string;
  messages?: string[];
  pending?: string[];
  at?: number;
};

export function heardPrompt(name: string, a: Answers) {
  return `You are a brand strategist at Primary, a brand studio, preparing for a kick-off workshop with ${name}. Turn their questionnaire into the short summaries Primary puts on its workshop boards. Write the way Primary's boards read: short, plain statements in the client's own terms, one idea each, no marketing language, no hedging. Example of a colour board: "A palette they actually own", "No telehealth blue and no tech-purple gradients", "Avoid the category's current look: beige, orange, and grainy textures".

Use only what the answers say. If an answer is missing, leave its field empty rather than inventing.

Return JSON only, with these fields:
- oneLiner: what the company is, in one sentence of at most 140 characters
- claims: up to 3 proof points from what makes them different, each {"figure": a short number or phrase if there is one, like "4×" or "Petabyte", "text": at most 90 characters}
- personality: their adjectives, as given
- look: the visual style words they want, as given
- feel: up to 6 short phrases for how they want to be felt (at most 5 words each)
- avoid: up to 8 short phrases for what they don't want (at most 6 words each)
- keep: up to 5 bullets on what they like about their brand today
- change: up to 5 bullets on what they dislike or want to change
- logo, colour, type: up to 5 bullets each, like the example above
- audience: 1 to 3 audiences, each {"name": at most 4 words, "detail": at most 160 characters}
- competitors: each competitor they name, {"name", "group": a short category if they group them, "note": at most 80 characters if they say something about it, "url" if given}
- bestBranded: the competitor they think is best branded and why, at most 160 characters
- inspiration: each brand they cite for inspiration, {"name", "why": at most 90 characters, "url" if given}
- action: the one website action, at most 60 characters
- messages: their three website messages, each at most 110 characters
- pending: things they say they will send later, or questions left unanswered, at most 80 characters each

Answers:
${QUESTIONS.filter((q) => a[q.id]).map((q) => `## ${q.q}\n${a[q.id]}`).join('\n\n')}`;
}

const strs = (v: any, n: number, len = 200) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x: string) => x.trim().slice(0, len)).slice(0, n) : undefined);
const str = (v: any, len: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, len) : undefined);
export function cleanHeard(v: any): Heard | null {
  if (!v || typeof v !== 'object') return null;
  const objs = (x: any, n: number, keys: string[]) => (Array.isArray(x) ? x.filter((o) => o && typeof o === 'object' && (typeof o.name === 'string' || typeof o.text === 'string')).slice(0, n).map((o) => Object.fromEntries(keys.map((k) => [k, str(o[k], 240)]).filter(([, s]) => s))) : undefined);
  return {
    oneLiner: str(v.oneLiner, 200), claims: objs(v.claims, 3, ['figure', 'text']) as any, personality: strs(v.personality, 8, 40), look: strs(v.look, 8, 60),
    feel: strs(v.feel, 8, 80), avoid: strs(v.avoid, 10, 80), keep: strs(v.keep, 6), change: strs(v.change, 6), logo: strs(v.logo, 6), colour: strs(v.colour, 6), type: strs(v.type, 6),
    audience: objs(v.audience, 3, ['name', 'detail']) as any, competitors: objs(v.competitors, 24, ['name', 'group', 'note', 'url']) as any, bestBranded: str(v.bestBranded, 240),
    inspiration: objs(v.inspiration, 24, ['name', 'why', 'url']) as any, action: str(v.action, 100), messages: strs(v.messages, 3, 200), pending: strs(v.pending, 8, 120), at: +v.at > 0 ? +v.at : Date.now(),
  };
}
