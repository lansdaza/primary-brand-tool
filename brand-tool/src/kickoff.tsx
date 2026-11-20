// Kick-off: what Primary takes into the client workshop. It follows the workshop file's order (Curai is the
// reference): the questions, their brand today, what inspires them, who they compete with, their product, and
// Primary's pre-moodboards, each set on the "how far to push" scale so the client's reactions give signal.
// Everything is kept on the project record. Screens are images in the page's asset store.
import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, ChevronDown, Copy, ImagePlus, Plus, Sparkles, Trash2, X } from 'lucide-react';
import * as E from './engine/index.js';
import { Btn, CopyButton, ICON, RailHead, RailItem, type Ask } from './ui';
import type { Frame } from './App';
import { Q_BY, QUESTIONS, urlsIn, type Answers, type Heard, type QuestionId } from './intake';
import type { Project, ProjectStore } from './projects';

export const TOOL_URL = 'https://claude.ai/artifact/VgVYVo14zC9VF3bjSAFyTy';

export type Img = { id: string; w: number; h: number; name?: string };
export type KQ = { id: string; q: string; assumption?: string; from?: QuestionId[] };
export type RefGroup = 'current' | 'inspiration' | 'competitor' | 'product';
export type Ref = { id: string; group: RefGroup; name: string; url?: string; note?: string; images?: Img[]; hidden?: boolean; added?: boolean };
export type Push = 'safe' | 'zone' | 'edge';
export type Direction = { id: string; name: string; idea: string; push: Push; tests?: string; keywords?: string; refs?: string; colour?: string; type?: string; images?: Img[] };
export type Kickoff = { questions?: KQ[]; refs?: Record<string, Partial<Ref>>; directions?: Direction[]; at?: number };

export const MAX_Q = 5, MAX_DIR = 4, MAX_REF_IMG = 8, MAX_DIR_IMG = 12, MAX_ADDED = 16;
const PUSH: Record<Push, { name: string; about: string }> = {
  safe: { name: 'Close in', about: 'Near what they have and what the category does' },
  zone: { name: 'The zone', about: 'A clear position that is still credible' },
  edge: { name: 'The edge', about: 'As far as their answers allow' },
};
const GROUPS: { id: RefGroup; name: string; about: string }[] = [
  { id: 'current', name: 'Their brand today', about: 'Screens of the current site, product and materials, for the likes and dislikes review.' },
  { id: 'inspiration', name: 'Inspiration', about: 'The brands they named. Six screens each is what the workshop file holds.' },
  { id: 'competitor', name: 'Competitors', about: 'Who they named, grouped as they grouped them.' },
  { id: 'product', name: 'Product', about: 'Product UI they sent or that we captured.' },
];
const host = (u: string) => { try { return new URL(/^https?:/.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, ''); } catch { return u; } };
const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';

/** The references a project starts with, from its questionnaire and summary, with saved edits laid over them. */
export function refsOf(p: Project): Ref[] {
  const a = p.intake ?? {}, h = p.heard ?? {};
  const base: Ref[] = [];
  const site = urlsIn(a.website)[0] ?? (a.website?.match(/[a-z0-9-]+\.[a-z]{2,}/i)?.[0] ? `https://${a.website.match(/[a-z0-9-]+\.[a-z.]{2,}/i)![0].toLowerCase()}` : undefined);
  base.push({ id: 'current', group: 'current', name: a.company || p.name, url: site, note: a.website && /no website/i.test(a.website) ? 'No website yet' : undefined });
  for (const c of h.competitors ?? []) base.push({ id: `competitor-${slug(c.name)}`, group: 'competitor', name: c.name, url: c.url, note: [c.group, c.note].filter(Boolean).join(' · ') || undefined });
  for (const x of h.inspiration ?? []) base.push({ id: `inspiration-${slug(x.name)}`, group: 'inspiration', name: x.name, url: x.url, note: x.why });
  if (a.product?.trim()) base.push({ id: 'product', group: 'product', name: 'Product UI', url: urlsIn(a.product)[0], note: urlsIn(a.product).length ? undefined : a.product.slice(0, 120) });
  const saved = p.kickoff?.refs ?? {};
  const out = base.map((r) => ({ ...r, ...saved[r.id], id: r.id, group: r.group }));
  for (const [id, r] of Object.entries(saved)) if (r.added && !base.some((b) => b.id === id) && r.name && r.group) out.push({ ...(r as Ref), id });
  return out;
}

/* ---------- Claude ---------- */

const answersText = (a: Answers) => QUESTIONS.filter((q) => a[q.id]).map((q) => `## [${q.id}] ${q.q}\n${a[q.id]}`).join('\n\n');

export function questionsPrompt(name: string, a: Answers) {
  return `You are a brand strategist at Primary, a brand studio, writing the questions for the kick-off workshop with ${name}. Primary asks five questions at kick-off, built from what the client sent in their questionnaire. Each one tests an assumption we'd otherwise build on, closes a gap, or makes them choose between two things they asked for that pull against each other.

Write the way Primary's workshop slides read: one direct, conversational question per slide, in plain words, no jargon, at most 160 characters. For example: "Explain Paper to me in layman's terms. How exactly does it work for me as a new customer?"

For each question also give the assumption it tests, starting "We're assuming" (at most 140 characters), and the ids of the answers it comes from (the ids in square brackets below).

Return JSON only: {"questions": [{"q": "...", "assumption": "We're assuming ...", "from": ["id", ...]}, ...]} with exactly 5 questions, most important first.

Their answers:
${answersText(a)}`;
}

export function directionsPrompt(name: string, a: Answers, h?: Heard) {
  return `You are a brand designer at Primary, a brand studio, planning the pre-moodboards for the kick-off workshop with ${name}. Primary builds a few moodboards before the workshop and shows them to the client to get signal on what they like and dislike. Each one is a direction placed on the "how far to push" scale:
- safe: close to what they have and what their category does
- zone: a clear, committed position that is still credible
- edge: as far as their answers allow, without crossing anything they said to avoid

Write 3 directions, one at each point, all within what they asked for and none using anything they said to avoid. Name each in 2 or 3 plain words. Use only brands they named as references, or none.

Return JSON only: {"directions": [{"push": "safe" | "zone" | "edge", "name": "...", "idea": "the direction in one sentence, at most 140 characters", "tests": "what their reaction will tell us, at most 120 characters", "keywords": "up to 5 image-search words, comma separated", "refs": "brands of theirs it draws on, comma separated", "colour": "at most 80 characters", "type": "at most 80 characters"}]}

${h?.avoid?.length ? `What they don't want: ${h.avoid.join('; ')}\n\n` : ''}Their answers:
${answersText(a)}`;
}

const s = (v: any, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined);
export function cleanQuestions(v: any): KQ[] | null {
  const list = Array.isArray(v?.questions) ? v.questions : Array.isArray(v) ? v : null;
  if (!list) return null;
  const out = list.map((x: any) => ({ id: E.uid(), q: s(x?.q, 400) ?? '', assumption: s(x?.assumption, 300), from: Array.isArray(x?.from) ? x.from.filter((id: any) => Q_BY[id as QuestionId]).slice(0, 4) : undefined })).filter((x: KQ) => x.q).slice(0, MAX_Q);
  return out.length ? out : null;
}
export function cleanDirections(v: any): Direction[] | null {
  const list = Array.isArray(v?.directions) ? v.directions : null;
  if (!list) return null;
  const out = list.map((x: any) => ({ id: E.uid(), push: (['safe', 'zone', 'edge'] as Push[]).includes(x?.push) ? x.push : 'zone', name: s(x?.name, 60) ?? '', idea: s(x?.idea, 300) ?? '', tests: s(x?.tests, 240), keywords: s(x?.keywords, 160), refs: s(x?.refs, 160), colour: s(x?.colour, 160), type: s(x?.type, 160) })).filter((d: Direction) => d.name && d.idea).slice(0, MAX_DIR);
  return out.length ? out : null;
}

/* ---------- Images ---------- */

type ImgStore = { can: boolean; why: string; src: (id: string) => string | undefined; add: (files: File[]) => Promise<{ imgs: Img[]; error: string }>; drop: (id: string) => void };
const localData: Record<string, string> = {};

async function prepare(file: File): Promise<{ blob: Blob; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const w = img.naturalWidth, h = img.naturalHeight;
    // Screens wider than 2560px or heavier than 4 MB are re-encoded; the workshop shows them at about 1920px.
    if (w <= 2560 && file.size <= 4 * 1048576) return { blob: file, w, h };
    const k = Math.min(1, 2560 / w), c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob>((ok) => c.toBlob((b) => ok(b ?? file), 'image/webp', 0.9));
    return { blob, w: c.width, h: c.height };
  } finally { URL.revokeObjectURL(url); }
}

function useImages(): ImgStore {
  const [state, setState] = useState<{ store: any; mode: 'loading' | 'shared' | 'local' | 'none' }>({ store: null, mode: 'loading' });
  const [, bump] = useState(0);
  useEffect(() => {
    let dead = false;
    (async () => {
      const claude = (window as any).claude;
      let db: any = null, assets: any = null;
      try { db = await claude?.use?.('db'); } catch { db = null; }
      try { assets = await claude?.use?.('assets'); } catch { assets = null; }
      if (dead) return;
      setState({ store: assets, mode: !db ? 'local' : assets ? 'shared' : 'none' });
    })();
    return () => { dead = true; };
  }, []);
  const add = useCallback(async (files: File[]) => {
    const imgs: Img[] = [];
    for (const f of files) {
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) return { imgs, error: `${f.name || 'That file'} isn’t a PNG, JPEG, WebP or GIF.` };
      try {
        const { blob, w, h } = await prepare(f);
        if (state.mode === 'shared') {
          const res = await state.store.upload(blob, { type: blob.type || f.type });
          imgs.push({ id: res.id, w, h, name: f.name?.slice(0, 120) });
        } else if (state.mode === 'local') {
          const id = E.uid();
          localData[id] = await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(blob); });
          imgs.push({ id, w, h, name: f.name?.slice(0, 120) });
          bump((n) => n + 1);
        } else return { imgs, error: 'Only editors of this page can add images.' };
      } catch (error: any) {
        return { imgs, error: error?.code === 'quota_exceeded' ? 'The page’s file storage is full.' : error?.code === 'too_large' ? `${f.name} is too large to store.` : `${f.name || 'An image'} could not be saved. Try again.` };
      }
    }
    return { imgs, error: '' };
  }, [state]);
  return useMemo(() => ({
    can: state.mode === 'shared' || state.mode === 'local',
    why: state.mode === 'none' ? 'Only editors of this page can add images.' : state.mode === 'local' ? 'Images are kept for this visit only. On the published page they are saved for everyone.' : '',
    src: (id: string) => localData[id] ?? (state.mode === 'shared' ? `/_blob/${id}` : undefined),
    add,
    drop: (id: string) => { if (state.mode === 'shared') state.store?.delete?.(id).catch(() => undefined); delete localData[id]; },
  }), [state, add]);
}

/** A strip of images that takes a drop, a paste or a pick, up to `max`. */
function Shots({ images = [], max, store, onChange, label, locked, view }: { images?: Img[]; max: number; store: ImgStore; onChange: (imgs: Img[]) => void; label: string; locked: boolean; view: (img: Img) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [over, setOver] = useState(false);
  const pick = useRef<HTMLInputElement>(null);
  const can = store.can && !locked;
  const add = async (files: File[]) => {
    if (!can || !files.length) return;
    const room = max - images.length;
    if (room <= 0) { setError(`This holds ${max} images at most.`); return; }
    setBusy(true); setError('');
    const { imgs, error } = await store.add(files.slice(0, room));
    if (imgs.length) onChange([...images, ...imgs]);
    setError(error || (files.length > room ? `Added ${room}; this holds ${max} at most.` : ''));
    setBusy(false);
  };
  return (
    <div className="pb-shots" data-over={over || undefined} tabIndex={can ? 0 : undefined} aria-label={`${label}: ${images.length} of ${max} images${can ? '. Paste or drop images here.' : ''}`}
      onPaste={(e: ClipboardEvent) => { const fs = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/')); if (fs.length) { e.preventDefault(); void add(fs); } }}
      onDragOver={(e: DragEvent) => { if (can) { e.preventDefault(); setOver(true); } }} onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); void add([...e.dataTransfer.files]); }}>
      <div className="pb-shots-row">
        {images.map((img) => (
          <figure key={img.id} className="pb-shot" style={{ aspectRatio: `${img.w} / ${img.h}` }}>
            <button type="button" className="pb-shot-open" onClick={() => view(img)} aria-label={`View ${img.name || 'image'}`}><img src={store.src(img.id)} alt="" loading="lazy" /></button>
            {can ? <button type="button" className="pb-shot-x" aria-label={`Remove ${img.name || 'image'}`} onClick={() => { onChange(images.filter((x) => x.id !== img.id)); store.drop(img.id); }}><X {...ICON} size={12} /></button> : null}
          </figure>
        ))}
        {can && images.length < max ? (
          <button type="button" className="pb-shot-add" onClick={() => pick.current?.click()} disabled={busy}>
            {busy ? <span className="pb-spin" aria-hidden="true" /> : <ImagePlus {...ICON} />}<span>{images.length ? 'Add' : 'Add screens'}</span>
          </button>
        ) : null}
        {!images.length && !can ? <p className="pb-quiet">No images yet.</p> : null}
      </div>
      <input ref={pick} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { const fs = [...(e.target.files ?? [])]; e.target.value = ''; void add(fs); }} />
      {error ? <p className="pb-shots-error" role="alert">{error}</p> : null}
    </div>
  );
}

/* ---------- Fields ---------- */

const Field = ({ label, value, onChange, rows = 1, max = 400, placeholder, locked, big }: { label: string; value?: string; onChange: (v: string) => void; rows?: number; max?: number; placeholder?: string; locked: boolean; big?: boolean }) => (
  <label className="pb-ko-field" data-big={big || undefined}>
    <span className="pb-ko-label">{label}</span>
    <textarea rows={rows} maxLength={max} value={value ?? ''} placeholder={locked ? '' : placeholder} readOnly={locked} onChange={(e) => onChange(e.target.value)} />
  </label>
);

/* ---------- The view ---------- */

// The kick-off is a set of modules. The overview shows each at a glance; a module opens on its own.
export type KoPart = 'overview' | 'questions' | RefGroup | 'directions' | 'workshop';
const MODULE: Record<Exclude<KoPart, 'overview'>, { name: string; about: string }> = {
  questions: { name: 'Questions', about: 'Five, from their answers. Each tests an assumption we’d otherwise build on.' },
  current: { name: 'Their brand', about: 'Their site, product and materials today, for the likes and dislikes review.' },
  inspiration: { name: 'Inspiration', about: 'The brands they named. Each fills one workshop board with six screens.' },
  competitor: { name: 'Competitors', about: 'Who they named, grouped as they grouped them. Each fills one workshop board.' },
  product: { name: 'Product', about: 'Their product UI, from what they sent or what we capture.' },
  directions: { name: 'Pre-moodboards', about: 'Our directions for the workshop, set on the “how far to push” scale.' },
  workshop: { name: 'Workshop file', about: 'The Figma file this builds, in the workshop’s order.' },
};
const TARGET = 6;
type Status = 'done' | 'part' | 'none';
const Dot = ({ s }: { s: Status }) => <span className="pb-st" data-s={s} aria-hidden="true" />;

export function KickoffView({ project, store, frame, ask, part: partIn, goPart, goBrief }: { project: Project; store: ProjectStore; frame: Frame; ask: Ask | null; part?: string; goPart: (part?: KoPart) => void; goBrief: (q?: QuestionId, part?: string) => void }) {
  const p = project;
  const k: Kickoff = p.kickoff ?? {};
  const locked = store.mode === 'readonly';
  const imgs = useImages();
  const [busy, setBusy] = useState<'' | 'q' | 'd'>(''), [note, setNote] = useState(''), [confirm, setConfirm] = useState<'' | 'q' | 'd'>('');
  const [viewing, setViewing] = useState<Img | null>(null);
  const [adding, setAdding] = useState<{ name: string; url: string } | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [sel, setSel] = useState('');
  const [openFrom, setOpenFrom] = useState('');
  const [details, setDetails] = useState<Record<string, boolean>>({});
  const [dropOn, setDropOn] = useState('');
  const refs = useMemo(() => refsOf(p), [p]);
  const has = !!p.intake && Object.keys(p.intake).length > 0;
  const groups = (['current', 'inspiration', 'competitor', 'product'] as RefGroup[]).filter((g) => g !== 'product' || refs.some((r) => r.group === 'product'));
  const part: KoPart = partIn && (partIn in MODULE) && (!['current', 'inspiration', 'competitor', 'product'].includes(partIn) || groups.includes(partIn as RefGroup)) ? (partIn as KoPart) : 'overview';
  useEffect(() => { setNote(''); setConfirm(''); setSel(''); setAdding(null); setShowHidden(false); document.getElementById('pb-main')?.scrollTo(0, 0); }, [part]);

  const put = (patch: Partial<Kickoff>) => store.save(p.id, { kickoff: { ...k, ...patch, at: Date.now() }, ...(p.stage === 'intake' ? { stage: 'kickoff' as const } : {}) });
  const setQ = (questions: KQ[]) => put({ questions });
  const setRef = (id: string, patch: Partial<Ref>) => put({ refs: { ...(k.refs ?? {}), [id]: { ...(k.refs?.[id] ?? {}), ...patch } } });
  const qs = k.questions ?? [], dirs = k.directions ?? [];
  const setDir = (directions: Direction[]) => put({ directions });
  const editDir = (id: string, patch: Partial<Direction>) => setDir(dirs.map((y) => (y.id === id ? { ...y, ...patch } : y)));

  const draft = async (what: 'q' | 'd') => {
    if (!ask || !p.intake) return;
    setBusy(what); setNote(''); setConfirm('');
    try {
      const name = p.intake.company || p.name;
      if (what === 'q') { const q = cleanQuestions(await ask.json(questionsPrompt(name, p.intake), { cache: false })); if (q) setQ(q); else setNote('The questions came back empty. Try again.'); }
      else { const d = cleanDirections(await ask.json(directionsPrompt(name, p.intake, p.heard), { cache: false })); if (d) setDir(d); else setNote('The directions came back empty. Try again.'); }
    } catch (error: any) { setNote(error?.code === 'not_granted' ? 'Claude isn’t allowed on this page yet.' : 'Claude couldn’t draft that just now. Try again in a moment.'); }
    finally { setBusy(''); }
  };
  const draftBtn = (what: 'q' | 'd', filled: boolean, name: string) => {
    if (!ask || locked || !has) return null;
    if (filled && confirm === what) return <><span className="pb-quiet">Replace what’s here?</span><Btn variant="secondary" onClick={() => void draft(what)}>Replace</Btn><Btn onClick={() => setConfirm('')}>Keep mine</Btn></>;
    return <Btn variant={filled ? 'ghost' : 'primary'} icon={busy === what ? <span className="pb-spin" aria-hidden="true" /> : <Sparkles {...ICON} />} disabled={!!busy} onClick={() => (filled ? setConfirm(what) : void draft(what))}>{busy === what ? 'Drafting' : filled ? 'Draft again' : name}</Btn>;
  };

  const move = <T,>(list: T[], i: number, d: number) => { const n = [...list]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); return n; };
  const live = (g: RefGroup) => refs.filter((r) => r.group === g && !r.hidden);
  const shot = (g: RefGroup) => live(g).filter((r) => r.images?.length).length;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const status = (m: Exclude<KoPart, 'overview'>): Status => {
    if (m === 'questions') return qs.length >= MAX_Q ? 'done' : qs.length ? 'part' : 'none';
    if (m === 'directions') return dirs.length && dirs.every((d) => d.images?.length) ? 'done' : dirs.length ? 'part' : 'none';
    if (m === 'workshop') return ready === steps.length ? 'done' : 'part';
    const n = shot(m), t = live(m).length;
    return t && n === t ? 'done' : n ? 'part' : 'none';
  };
  const count = (m: Exclude<KoPart, 'overview'>) => m === 'questions' ? `${qs.length}/${MAX_Q}` : m === 'directions' ? `${dirs.length}` : m === 'workshop' ? `${ready}/${steps.length}` : `${shot(m)}/${live(m).length}`;

  // The workshop file, board by board, and whether each board has what it needs.
  const current = refs.find((r) => r.id === 'current');
  const steps: { name: string; detail: string; ok: boolean }[] = [
    { name: 'Title and agenda', detail: `${p.intake?.company || p.name} Brand Sprint Kickoff`, ok: true },
    { name: 'Questions', detail: `${qs.length} of ${MAX_Q} written`, ok: qs.length === MAX_Q },
    { name: 'Their brand', detail: `${plural(current?.images?.length ?? 0, 'screen')}; likes, dislikes and identity boards from the brief`, ok: !!current?.images?.length },
    { name: 'Adjectives', detail: 'Look, feel and what it must not be, from the brief', ok: !!p.heard },
    { name: 'Inspiration', detail: `${plural(live('inspiration').length, 'brand')}, ${shot('inspiration')} with screens`, ok: live('inspiration').length > 0 && shot('inspiration') === live('inspiration').length },
    { name: 'Competitors', detail: `${live('competitor').length} named, ${shot('competitor')} with screens`, ok: live('competitor').length > 0 && shot('competitor') > 0 },
    { name: 'Pre-moodboards', detail: `${plural(dirs.length, 'direction')}, ${dirs.filter((d) => d.images?.length).length} with images`, ok: dirs.length > 0 && dirs.every((d) => d.images?.length) },
    { name: 'Product', detail: live('product').length ? (shot('product') ? 'Screens added' : 'No screens yet') : 'Nothing sent', ok: shot('product') > 0 || !live('product').length },
    { name: 'Next steps', detail: 'Moodboard round, then the identity sprint', ok: true },
  ];
  const ready = steps.filter((s) => s.ok).length;
  const brief = () => `Build the ${p.intake?.company || p.name} Brand Sprint kick-off workshop in Figma from the Primary brand tool (${TOOL_URL}, project "${p.id}"). Lay it out like the Curai kick-off file: title and agenda, the ${qs.length || 5} questions one per slide, their current brand with likes and dislikes, logo, colour and type boards, adjectives (how it should look, how it should feel, what it must not be), inspiration and competitors with their screens, Primary's pre-moodboards, product, and next steps.`;

  const modules: Exclude<KoPart, 'overview'>[] = ['questions', ...groups, 'directions'];
  const rail = (
    <>
      <div className="pb-railblock pb-railblock--fill">
        <h2 className="pb-railtitle">Kick-off</h2>
        <ul className="pb-raillist">
          <RailItem current={part === 'overview'} onClick={() => goPart(undefined)}>Overview</RailItem>
        </ul>
        <ul className="pb-raillist pb-raillist--gap">
          {modules.map((m) => <RailItem key={m} current={part === m} lead={<Dot s={status(m)} />} meta={count(m)} onClick={() => goPart(m)}>{MODULE[m].name}</RailItem>)}
        </ul>
        <ul className="pb-raillist pb-raillist--gap">
          <RailItem current={part === 'workshop'} lead={<Dot s={status('workshop')} />} meta={count('workshop')} onClick={() => goPart('workshop')}>Workshop file</RailItem>
        </ul>
      </div>
      <p className="pb-railnote pb-railfoot" role="status">{store.problem || imgs.why || (locked ? 'View only.' : 'Dots fill as each module is ready for the workshop.')}</p>
    </>
  );
  const actions = <CopyButton variant="secondary" icon={<Copy {...ICON} />} text={brief}>Copy Figma brief</CopyButton>;

  /* ----- Overview: one card per module ----- */
  const thumbs = (list: Ref[], n: number) => list.slice(0, n).map((r) => (
    <span key={r.id} className="pb-kmod-thumb" data-empty={!r.images?.length || undefined}>
      {r.images?.length ? <img src={imgs.src(r.images[0].id)} alt="" loading="lazy" /> : null}<span>{r.name}</span>
    </span>
  ));
  const overview = (
    <div className="pb-kmods">
      <button type="button" className="pb-kmod" data-span="2" onClick={() => goPart('questions')}>
        <span className="pb-kmod-head"><Dot s={status('questions')} />Questions<span className="pb-count">{qs.length} of {MAX_Q}</span></span>
        {qs[0]?.q ? <span className="pb-kmod-q">{qs[0].q}</span> : <span className="pb-kmod-empty">{has ? 'Draft five from their answers.' : 'They come from the questionnaire.'}</span>}
        {qs.length > 1 ? <span className="pb-kmod-foot">+ {qs.length - 1} more{qs[0]?.assumption ? ` · ${qs[0].assumption}` : ''}</span> : null}
      </button>
      {groups.map((g) => {
        const list = live(g);
        const linkless = list.filter((r) => !r.url).length;
        return (
          <button key={g} type="button" className="pb-kmod" onClick={() => goPart(g)}>
            <span className="pb-kmod-head"><Dot s={status(g)} />{MODULE[g].name}<span className="pb-count">{shot(g)} of {list.length}</span></span>
            <span className="pb-kmod-thumbs" data-n={g === 'current' || g === 'product' ? 2 : 4}>{g === 'current' || g === 'product' ? (list[0]?.images?.length ? list[0].images.slice(0, 2).map((im) => <span key={im.id} className="pb-kmod-thumb"><img src={imgs.src(im.id)} alt="" loading="lazy" /></span>) : <><span className="pb-kmod-thumb" data-empty /><span className="pb-kmod-thumb" data-empty /></>) : thumbs(list, 4)}</span>
            <span className="pb-kmod-foot">{g === 'current' || g === 'product' ? [list[0]?.url ? host(list[0].url) : 'No link', list[0]?.note].filter(Boolean).join(' · ') : [list.length > 4 ? `+ ${list.length - 4} more` : '', linkless ? `${linkless} need a link` : 'All linked'].filter(Boolean).join(' · ')}</span>
          </button>
        );
      })}
      <button type="button" className="pb-kmod" data-span="2" onClick={() => goPart('directions')}>
        <span className="pb-kmod-head"><Dot s={status('directions')} />Pre-moodboards<span className="pb-count">{dirs.length}</span></span>
        {dirs.length ? <span className="pb-kmod-dirs">{dirs.map((d) => <span key={d.id}><b>{d.name || 'Untitled'}</b><span className="pb-chip">{PUSH[d.push].name}</span></span>)}</span> : <span className="pb-kmod-empty">Draft three directions, one at each point on the scale.</span>}
      </button>
      <button type="button" className="pb-kmod" onClick={() => goPart('workshop')}>
        <span className="pb-kmod-head"><Dot s={status('workshop')} />Workshop file<span className="pb-count">{ready} of {steps.length}</span></span>
        <span className="pb-kmod-todo">{steps.filter((x) => !x.ok).slice(0, 4).map((x) => <span key={x.name}>{x.name}</span>)}</span>
        <span className="pb-kmod-foot">{ready === steps.length ? 'Ready to build in Figma' : `${steps.length - ready} boards still need something`}</span>
      </button>
    </div>
  );

  /* ----- Questions ----- */
  const questions = (
    <>
      {qs.length ? (
        <ol className="pb-kq-list">
          {qs.map((q, i) => (
            <li key={q.id} className="pb-kq">
              <span className="pb-kq-n" aria-hidden="true">{i + 1}</span>
              <div className="pb-kq-body">
                <textarea className="pb-kq-q" aria-label={`Question ${i + 1}`} rows={1} maxLength={400} value={q.q} readOnly={locked} placeholder={locked ? '' : 'Ask one thing'} onChange={(e) => setQ(qs.map((x) => (x.id === q.id ? { ...x, q: e.target.value } : x)))} />
                <textarea className="pb-kq-a" aria-label={`The assumption question ${i + 1} tests`} rows={1} maxLength={300} value={q.assumption ?? ''} readOnly={locked} placeholder={locked ? '' : 'We’re assuming…'} onChange={(e) => setQ(qs.map((x) => (x.id === q.id ? { ...x, assumption: e.target.value } : x)))} />
                {q.from?.length ? (
                  <div className="pb-kq-from">
                    <button type="button" className="pb-more" aria-expanded={openFrom === q.id} onClick={() => setOpenFrom(openFrom === q.id ? '' : q.id)}>From {plural(q.from.length, 'answer')}</button>
                    {openFrom === q.id ? <ul>{q.from.map((id) => <li key={id}><button type="button" className="pb-inline-link" onClick={() => goBrief(id)}>{Q_BY[id].q}</button></li>)}</ul> : null}
                  </div>
                ) : null}
              </div>
              {!locked ? (
                <div className="pb-kq-tools">
                  <Btn icon={<ArrowUp {...ICON} />} label="Move up" disabled={!i} onClick={() => setQ(move(qs, i, -1))} />
                  <Btn icon={<ArrowDown {...ICON} />} label="Move down" disabled={i === qs.length - 1} onClick={() => setQ(move(qs, i, 1))} />
                  <Btn icon={<Trash2 {...ICON} />} label="Remove question" onClick={() => setQ(qs.filter((x) => x.id !== q.id))} />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : <p className="pb-ko-empty">{has ? (ask ? 'None yet. Draft them from the questionnaire, or write your own.' : 'None yet. Write them here.') : 'They come from the questionnaire.'}</p>}
      {!locked && qs.length < MAX_Q ? <button type="button" className="pb-addrow" onClick={() => setQ([...qs, { id: E.uid(), q: '' }])}><Plus {...ICON} />Add a question</button> : null}
    </>
  );

  /* ----- References: a gallery of tiles; the selected one opens on the right ----- */
  const g = part as RefGroup;
  const isRefs = part === 'current' || part === 'inspiration' || part === 'competitor' || part === 'product';
  const all = isRefs ? refs.filter((r) => r.group === g) : [];
  const shown = all.filter((r) => !r.hidden), hidden = all.filter((r) => r.hidden);
  const selected = shown.find((r) => r.id === sel);
  const dropTo = async (r: Ref, files: File[]) => {
    const room = MAX_REF_IMG - (r.images?.length ?? 0);
    if (locked || !imgs.can || room <= 0) return;
    const { imgs: added, error } = await imgs.add(files.filter((f) => f.type.startsWith('image/')).slice(0, room));
    if (added.length) setRef(r.id, { images: [...(r.images ?? []), ...added] });
    if (error) setNote(error);
  };
  const addForm = adding ? (
    <form className="pb-kr-add" onSubmit={(e) => { e.preventDefault(); const name = adding.name.trim(); if (!name) return; const id = `${g}-${slug(name)}-${E.uid().slice(0, 4)}`; setRef(id, { group: g, name, url: adding.url.trim() || undefined, added: true }); setAdding(null); setSel(id); }}>
      <input autoFocus className="pb-kr-input" aria-label="Brand name" placeholder="Brand name" maxLength={80} value={adding.name} onChange={(e) => setAdding({ ...adding, name: e.target.value })} />
      <input className="pb-kr-input" aria-label="Link" placeholder="Link (optional)" maxLength={300} value={adding.url} onChange={(e) => setAdding({ ...adding, url: e.target.value })} />
      <Btn variant="primary" type="submit" disabled={!adding.name.trim()}>Add</Btn><Btn onClick={() => setAdding(null)}>Cancel</Btn>
    </form>
  ) : null;
  const gallery = (
    <>
      {addForm}
      <div className="pb-kgal" data-wide={g === 'current' || g === 'product' || undefined}>
        {shown.map((r) => {
          const n = r.images?.length ?? 0;
          return (
            <button key={r.id} type="button" className="pb-ktile" aria-pressed={sel === r.id} data-over={dropOn === r.id || undefined} onClick={() => setSel(sel === r.id ? '' : r.id)}
              onDragOver={(e) => { if (!locked && imgs.can) { e.preventDefault(); setDropOn(r.id); } }} onDragLeave={() => setDropOn('')} onDrop={(e) => { e.preventDefault(); setDropOn(''); void dropTo(r, [...e.dataTransfer.files]); }}>
              <span className="pb-ktile-img" data-empty={!n || undefined}>
                {n ? <img src={imgs.src(r.images![0].id)} alt="" loading="lazy" /> : <span>Add screens</span>}
                {n ? <span className="pb-ktile-n">{n}</span> : null}
              </span>
              <b>{r.name}</b>
              <span className="pb-ktile-note">{r.note || (r.url ? host(r.url) : 'No link yet')}</span>
            </button>
          );
        })}
      </div>
      {hidden.length ? (
        <p className="pb-quiet pb-ko-hidden">Left out: {hidden.map((r, i) => <span key={r.id}>{i ? ', ' : ''}{showHidden && !locked ? <button type="button" className="pb-inline-link" onClick={() => setRef(r.id, { hidden: false })}>{r.name}</button> : r.name}</span>)}{!locked && !showHidden ? <> · <button type="button" className="pb-inline-link" onClick={() => setShowHidden(true)}>Bring one back</button></> : null}</p>
      ) : null}
    </>
  );
  const inspector = isRefs && selected ? (
    <div className="pb-kinsp">
      <div className="pb-insphead">
        <div className="pb-kinsp-title">
          {selected.added && !locked ? <input className="pb-kr-input pb-kinsp-name" aria-label="Name" value={selected.name} maxLength={80} onChange={(e) => setRef(selected.id, { name: e.target.value })} /> : <h2>{selected.name}</h2>}
          <Btn icon={<X {...ICON} />} label="Close" onClick={() => setSel('')} />
        </div>
        {selected.note ? <p>{selected.note}</p> : null}
      </div>
      <div className="pb-inspblock">
        <p className="pb-insplabel">Link</p>
        <div className="pb-ko-url pb-ko-url--box">
          <input aria-label={`${selected.name} link`} value={selected.url ?? ''} maxLength={300} placeholder={locked ? '' : 'Add the link to capture'} readOnly={locked} onChange={(e) => setRef(selected.id, { url: e.target.value.trim() })} />
          {selected.url && /^https?:\/\//.test(selected.url) ? <a href={selected.url} target="_blank" rel="noreferrer" aria-label={`Open ${selected.name}`}><ArrowUpRight {...ICON} size={14} /></a> : null}
        </div>
      </div>
      <div className="pb-inspblock">
        <p className="pb-insplabel">Screens <span className="pb-count">{selected.images?.length ?? 0} of {TARGET}</span></p>
        <Shots images={selected.images} max={MAX_REF_IMG} store={imgs} locked={locked} label={selected.name} view={setViewing} onChange={(images) => setRef(selected.id, { images })} />
        <p className="pb-quiet">Drop, paste or pick screens. Six fill a workshop board.</p>
      </div>
      {!locked ? <div className="pb-inspblock"><Btn icon={<Trash2 {...ICON} />} onClick={() => { setRef(selected.id, { hidden: true }); setSel(''); }}>Leave out of the workshop</Btn></div> : null}
    </div>
  ) : null;

  /* ----- Pre-moodboards ----- */
  const directions = (
    <>
      {dirs.length ? (
        <div className="pb-ko-dirs">
          {dirs.map((d, i) => (
            <article key={d.id} className="pb-ko-dir">
              <header className="pb-ko-dirhead">
                <div className="pb-ko-push" role="radiogroup" aria-label={`How far ${d.name || 'this direction'} pushes`}>
                  {(Object.keys(PUSH) as Push[]).map((x) => <button key={x} type="button" role="radio" aria-checked={d.push === x} title={PUSH[x].about} disabled={locked} onClick={() => editDir(d.id, { push: x })}>{PUSH[x].name}</button>)}
                </div>
                {!locked ? <div className="pb-ko-dirtools"><Btn icon={<ArrowUp {...ICON} />} label="Move earlier" disabled={!i} onClick={() => setDir(move(dirs, i, -1))} /><Btn icon={<ArrowDown {...ICON} />} label="Move later" disabled={i === dirs.length - 1} onClick={() => setDir(move(dirs, i, 1))} /><Btn icon={<Trash2 {...ICON} />} label="Remove direction" onClick={() => setDir(dirs.filter((y) => y.id !== d.id))} /></div> : null}
              </header>
              <input className="pb-ko-dirname" aria-label="Direction name" value={d.name} maxLength={60} readOnly={locked} placeholder="Name it" onChange={(e) => editDir(d.id, { name: e.target.value })} />
              <textarea className="pb-ko-diridea" aria-label="The idea" rows={2} maxLength={300} value={d.idea} readOnly={locked} placeholder={locked ? '' : 'The idea, in a sentence'} onChange={(e) => editDir(d.id, { idea: e.target.value })} />
              <Shots images={d.images} max={MAX_DIR_IMG} store={imgs} locked={locked} label={d.name || 'Direction'} view={setViewing} onChange={(images) => editDir(d.id, { images })} />
              <button type="button" className="pb-more" aria-expanded={!!details[d.id]} onClick={() => setDetails({ ...details, [d.id]: !details[d.id] })}>{details[d.id] ? 'Hide details' : 'Details'}</button>
              {details[d.id] ? (
                <div className="pb-ko-dirgrid">
                  <Field label="What their reaction tells us" value={d.tests} max={240} rows={2} locked={locked} onChange={(v) => editDir(d.id, { tests: v })} />
                  <Field label="Draws on" value={d.refs} max={160} locked={locked} onChange={(v) => editDir(d.id, { refs: v })} />
                  <Field label="Colour" value={d.colour} max={160} locked={locked} onChange={(v) => editDir(d.id, { colour: v })} />
                  <Field label="Type" value={d.type} max={160} locked={locked} onChange={(v) => editDir(d.id, { type: v })} />
                  <Field label="Image search words" value={d.keywords} max={160} locked={locked} onChange={(v) => editDir(d.id, { keywords: v })} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : <p className="pb-ko-empty">{has && ask ? 'None yet. Draft three from the brief, one at each point on the scale, or start your own.' : 'None yet. Start a direction to collect images for it.'}</p>}
      {!locked && dirs.length < MAX_DIR ? <button type="button" className="pb-addrow" onClick={() => setDir([...dirs, { id: E.uid(), name: '', idea: '', push: 'zone' }])}><Plus {...ICON} />Add a direction</button> : null}
    </>
  );

  /* ----- Workshop file ----- */
  const workshop = (
    <>
      <ol className="pb-ko-outline">
        {steps.map((s) => <li key={s.name} data-ready={s.ok || undefined}><b>{s.name}</b><span>{s.detail}</span>{!s.ok ? <span className="pb-ko-todo">To do</span> : null}</li>)}
      </ol>
      <p className="pb-bnote">Copy the brief and send it to Claude in chat. It builds the file through the Figma connector, laid out like the Curai kick-off, with the screens added here.</p>
      <div className="pb-rowbtns"><CopyButton variant="primary" icon={<Copy {...ICON} />} text={brief}>Copy Figma brief</CopyButton></div>
    </>
  );

  const meta = part === 'overview' ? { name: 'Kick-off', about: 'Everything we take into the workshop. Open a module to work on it.' } : MODULE[part];
  const headActions = part === 'questions' ? draftBtn('q', qs.length > 0, 'Draft 5 questions')
    : part === 'directions' ? draftBtn('d', dirs.length > 0, 'Draft 3 directions')
    : isRefs && !locked && all.filter((r) => r.added).length < MAX_ADDED && !adding ? <Btn variant="secondary" icon={<Plus {...ICON} />} onClick={() => setAdding({ name: '', url: '' })}>{g === 'competitor' ? 'Add a competitor' : g === 'inspiration' ? 'Add a brand' : 'Add a reference'}</Btn>
    : part === 'overview' ? <div className="pb-kready"><span>Workshop file · {ready} of {steps.length} ready</span><span className="pb-kbar"><i style={{ width: `${(ready / steps.length) * 100}%` }} /></span></div>
    : null;

  const main = (
    <div className="pb-page pb-page--wide pb-ko">
      <header className="pb-ko-top">
        <div>
          <p className="pb-eyebrow">{part === 'overview' ? p.name : `${p.name} · Kick-off`}</p>
          <h1>{meta.name}</h1>
          <p>{meta.about}</p>
        </div>
        {headActions ? <div className="pb-rowbtns">{headActions}</div> : null}
      </header>
      {note ? <p className="pb-import-error" role="alert">{note}</p> : null}
      {!has && part !== 'workshop' ? <p className="pb-import-error">There’s no questionnaire for {p.name} yet. <button type="button" className="pb-inline-link" onClick={() => goBrief()}>Add it in the Brief</button> and the questions and references follow from it.</p> : null}
      {part === 'overview' ? overview : part === 'questions' ? questions : isRefs ? gallery : part === 'directions' ? directions : workshop}
      {viewing ? (
        <div className="pb-overlay" role="dialog" aria-modal="true" aria-label={viewing.name || 'Image'} onKeyDown={(e) => { if (e.key === 'Escape') setViewing(null); }} onClick={(e) => { if (e.target === e.currentTarget) setViewing(null); }}>
          <div className="pb-overlay-card">
            <div className="pb-overlay-head"><span>{viewing.name || 'Image'} · {viewing.w}×{viewing.h}</span><Btn icon={<X {...ICON} />} label="Close" onClick={() => setViewing(null)} autoFocus /></div>
            <img src={imgs.src(viewing.id)} alt={viewing.name || ''} />
          </div>
        </div>
      ) : null}
    </div>
  );
  return frame({ actions, rail, railLabel: 'Kick-off', main, mainLabel: `Kick-off: ${meta.name}`, inspector: inspector ?? undefined, inspectorLabel: selected ? selected.name : undefined, kind: 'doc' });
}
