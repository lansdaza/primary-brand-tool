// Projects: one per client, above the brand. A project starts at Intake (their questionnaire and Primary's
// overview of it) and reaches Brand system once a guideline is read into the tool. Aurelius and Small Door
// are projects at that stage already. Projects live in the page's shared store, so everyone sees the same ones.
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { ArrowUpRight, ClipboardPaste, FileText, Sparkles, Upload, X } from 'lucide-react';
import * as E from './engine/index.js';
import { Btn, ICON, RailHead, RailItem, type Ask, type Brand } from './ui';
import type { Frame } from './App';
import type { StoreMode } from './decks';
import type { Kickoff } from './kickoff';
import { MAX_ANSWER, QUESTIONS, Q_BY, SECTIONS, answered, cleanHeard, cleanParsed, heardPrompt, mappingPrompt, parseByColumns, pdfText, urlsIn, type Answers, type Heard, type Parsed, type QuestionId } from './intake';

export type Stage = 'intake' | 'kickoff' | 'moodboard' | 'brand';
export const STAGE_NAME: Record<Stage, string> = { intake: 'Intake', kickoff: 'Kick-off', moodboard: 'Moodboard', brand: 'Brand system' };
export type IntakeMeta = { source: string; how: 'columns' | 'claude' | 'typed'; at: number; by?: string; submittedAt?: string; submittedBy?: string };
export type Project = { id: string; name: string; brand?: string; stage: Stage; intake?: Answers; intakeMeta?: IntakeMeta; heard?: Heard; kickoff?: Kickoff; created: number; updated?: number };
export type ProjectStore = { list: Project[]; get: (id: string) => Project | undefined; mode: StoreMode; ready: boolean; problem: string; save: (id: string, patch: Partial<Project>) => void; create: (name: string) => string | null };

const LOCAL = 'primary-brand-projects';
const RESERVED = new Set(['projects']);
const slugId = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '').slice(0, 24);

// A kick-off record as stored: lists are capped and anything not an object is dropped.
function readKickoff(v: any): Kickoff | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const arr = (x: any, n: number) => (Array.isArray(x) ? x.filter((o) => o && typeof o === 'object' && typeof o.id === 'string').slice(0, n) : undefined);
  const imgs = (x: any, n: number) => (Array.isArray(x) ? x.filter((i) => i && typeof i.id === 'string' && +i.w > 0 && +i.h > 0).slice(0, n) : undefined);
  const refs: Kickoff['refs'] = {};
  if (v.refs && typeof v.refs === 'object') for (const [id, r] of Object.entries<any>(v.refs).slice(0, 120)) if (r && typeof r === 'object') refs[id] = { ...r, images: imgs(r.images, 8) };
  return { questions: arr(v.questions, 5), refs, directions: arr(v.directions, 4)?.map((d: any) => ({ ...d, images: imgs(d.images, 12) })), at: +v.at || undefined };
}

function readProject(id: string, v: any): Project | null {
  if (!v || typeof v !== 'object' || typeof v.name !== 'string') return null;
  const intake: Answers = {};
  if (v.intake && typeof v.intake === 'object') for (const q of QUESTIONS) if (typeof v.intake[q.id] === 'string') intake[q.id] = v.intake[q.id].slice(0, MAX_ANSWER);
  return {
    id, name: v.name.slice(0, 80), brand: typeof v.brand === 'string' && E.BY[v.brand] ? v.brand : undefined,
    stage: (['intake', 'kickoff', 'moodboard', 'brand'] as Stage[]).includes(v.stage) ? v.stage : 'intake',
    intake: Object.keys(intake).length ? intake : undefined, intakeMeta: v.intakeMeta && typeof v.intakeMeta === 'object' ? v.intakeMeta : undefined,
    heard: v.heard ? cleanHeard(v.heard) ?? undefined : undefined, kickoff: readKickoff(v.kickoff), created: +v.created || Date.now(), updated: +v.updated || undefined,
  };
}

export function useProjects(): ProjectStore {
  const [docs, setDocs] = useState<Record<string, Project>>(() => {
    try { const v = JSON.parse(localStorage.getItem(LOCAL) || '{}'); return Object.fromEntries(Object.entries<any>(v).map(([id, p]) => [id, readProject(id, p)]).filter(([, p]) => p)); } catch { return {}; }
  });
  const [mode, setModeState] = useState<StoreMode>('loading');
  const [problem, setProblem] = useState('');
  const [ready, setReady] = useState(false);
  const db = useRef<any>(null), modeRef = useRef<StoreMode>('loading'), latest = useRef(docs), pending = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  latest.current = docs;
  const setMode = (m: StoreMode) => { modeRef.current = m; setModeState(m); };

  useEffect(() => {
    let off: (() => void) | undefined, dead = false;
    (async () => {
      const claude = (window as any).claude;
      let store: any = null;
      try { store = await claude?.use?.('db'); } catch { store = null; }
      if (dead) return;
      if (!store) { setMode('local'); setReady(true); return; }
      db.current = store;
      let can: boolean | null = null;
      try { can = await (await claude.use('user'))?.can?.('data.write'); } catch { can = null; }
      if (dead) return;
      setMode(can === false ? 'readonly' : 'shared');
      off = store.collection('projects').onSnapshot((snap: any) => {
        const next: Record<string, Project> = {};
        for (const d of snap.docs) { const p = readProject(d.id, d.data()); if (p) next[d.id] = p; }
        // An edit this view hasn't saved yet stays as typed.
        for (const id of Object.keys(pending.current)) if (latest.current[id]) next[id] = latest.current[id];
        setDocs(next);
        setReady(true);
      }, () => { setMode('local'); setReady(true); });
    })();
    return () => { dead = true; off?.(); };
  }, []);

  const write = useCallback((id: string) => {
    clearTimeout(pending.current[id]);
    pending.current[id] = setTimeout(async () => {
      const p = latest.current[id];
      if (modeRef.current === 'local' || !db.current) {
        try { localStorage.setItem(LOCAL, JSON.stringify(latest.current)); } catch { /* kept for this visit */ }
        delete pending.current[id];
        return;
      }
      if (modeRef.current !== 'shared' || !p) { delete pending.current[id]; return; }
      try { await db.current.doc(`projects/${id}`).set(JSON.parse(JSON.stringify({ ...p, updated: Date.now() }))); setProblem(''); }
      catch (error: any) {
        if (error?.code === 'not_granted') setMode('readonly');
        else setProblem('Could not save just now. Your changes are kept on this page.');
      } finally { delete pending.current[id]; }
    }, 700);
  }, []);

  const save = useCallback((id: string, patch: Partial<Project>) => {
    if (modeRef.current === 'readonly') return;
    const base = latest.current[id] ?? (E.BY[id] ? { id, name: E.BY[id].name, brand: id, stage: 'brand' as Stage, created: Date.now() } : null);
    if (!base) return;
    const next = { ...base, ...patch, id };
    latest.current = { ...latest.current, [id]: next };
    setDocs(latest.current);
    write(id);
  }, [write]);

  const create = useCallback((name: string) => {
    const clean = name.trim().slice(0, 80);
    let id = slugId(clean);
    if (!id || modeRef.current === 'readonly') return null;
    const taken = (x: string) => RESERVED.has(x) || !!E.BY[x] || !!latest.current[x];
    for (let n = 2; taken(id); n++) id = `${slugId(clean).slice(0, 21)}${n}`;
    latest.current = { ...latest.current, [id]: { id, name: clean, stage: 'intake', created: Date.now() } };
    setDocs(latest.current);
    write(id);
    return id;
  }, [write]);

  // Brands already in the tool are projects at the Brand system stage, saved or not.
  const list = useMemo(() => {
    const brands: Project[] = E.BRANDS.map((b: Brand): Project => ({ ...docs[b.id], created: docs[b.id]?.created ?? 0, id: b.id, name: b.name, brand: b.id, stage: 'brand' }));
    const others = Object.values(docs).filter((p) => !E.BY[p.id]).sort((a, b) => b.created - a.created);
    return [...others, ...brands];
  }, [docs]);
  const byId = useMemo(() => Object.fromEntries(list.map((p) => [p.id, p])), [list]);
  return useMemo(() => ({ list, get: (id: string) => byId[id], mode, ready, problem, save, create }), [list, byId, mode, ready, problem, save, create]);
}

/* ---------- Brief: the overview and the questionnaire ---------- */

const fmtDate = (s?: string | number) => {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(+d) ? String(s) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const words = (s?: string) => (s ?? '').split(/[,;\n]|\s+-\s+/).map((x) => x.trim().replace(/\.$/, '')).filter((x) => x && x.length < 48);
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

// The overview reads in the workshop's order. Each part is a heading and a few blocks; no block has a frame
// except the identity boards, which are dark as they are in the workshop file.
export const OVERVIEW_PARTS = [
  { id: 'who', name: 'Who they are' },
  { id: 'going', name: 'Where it’s going' },
  { id: 'identity', name: 'Identity' },
  { id: 'market', name: 'Market' },
] as const;

/** Text cut to a few lines, with the rest one click away. */
function Clamp({ text, lines = 4, className = 'pb-bt-raw' }: { text?: string; lines?: number; className?: string }) {
  const [all, setAll] = useState(false);
  if (!text) return <p className="pb-quiet">No answer.</p>;
  const long = text.length > lines * 90;
  return (
    <div className="pb-clamp">
      <p className={className} style={!all && long ? { WebkitLineClamp: lines } : undefined} data-clamped={!all && long || undefined}>{text}</p>
      {long ? <button type="button" className="pb-more" onClick={() => setAll(!all)}>{all ? 'Show less' : 'Show all'}</button> : null}
    </div>
  );
}

/** The first few points, with the rest one click away. */
function Points({ items, show = 4, numbered }: { items?: string[]; show?: number; numbered?: boolean }) {
  const [all, setAll] = useState(false);
  if (!items?.length) return null;
  const list = all ? items : items.slice(0, show);
  const L = numbered ? 'ol' : 'ul';
  return (
    <>
      <L className={`pb-bt-list${numbered ? ' pb-bt-list--num' : ''}`}>{list.map((x) => <li key={x}>{x}</li>)}</L>
      {items.length > show ? <button type="button" className="pb-more" onClick={() => setAll(!all)}>{all ? 'Show less' : `Show all ${items.length}`}</button> : null}
    </>
  );
}

/** A block of the overview. With a summary in place, the client's own words sit behind a toggle. */
function Block({ label, span = 4, tone, from, a, goQ, summarised, children }: { label: string; span?: number; tone?: 'board' | 'quiet'; from?: QuestionId[]; a: Answers; goQ: (id: QuestionId) => void; summarised: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const raw = (from ?? []).filter((id) => a[id]?.trim());
  return (
    <section className="pb-bt" data-span={span} data-tone={tone} aria-label={label}>
      <header className="pb-bt-head">
        <h3>{label}</h3>
        {summarised && raw.length ? <button type="button" className="pb-bt-src" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide their words' : 'Their words'}</button> : null}
      </header>
      {children}
      {open ? (
        <div className="pb-bt-theirs">
          {raw.map((id) => (
            <div key={id}>
              <p className="pb-bt-q">{Q_BY[id].q} <button type="button" className="pb-inline-link" onClick={() => goQ(id)}>Edit</button></p>
              <p className="pb-bt-raw">{a[id]}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Names as chips; a note shows on hover or focus. */
function Names({ items }: { items: { name: string; note?: string }[] }) {
  return (
    <ul className="pb-namechips">
      {items.map((x) => (
        <li key={x.name} tabIndex={x.note ? 0 : undefined} data-tip={x.note || undefined} aria-label={x.note ? `${x.name}: ${x.note}` : undefined}>
          {x.name}{x.note ? <span className="pb-tip" role="tooltip">{x.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

type SectionId = (typeof OVERVIEW_PARTS)[number]['id'];
const isSection = (x?: string): x is SectionId => OVERVIEW_PARTS.some((s) => s.id === x);

/** One part of the brief in full: every block, with the client's own words a toggle away. */
function BriefSection({ p, id, goQ }: { p: Project; id: SectionId; goQ: (id: QuestionId) => void }) {
  const a = p.intake ?? {}, h = p.heard ?? {}, sum = !!p.heard;
  const look = h.look?.length ? h.look : words(a.look);
  const links = urlsIn([a.board, a.product, a.socials, a.website, a.inspiredBy, a.spaceBrands, a.competitors].join(' '));
  const groups = (h.competitors ?? []).reduce<Record<string, { name: string; note?: string }[]>>((acc, c) => { (acc[c.group || ''] ??= []).push({ name: c.name, note: c.note }); return acc; }, {});
  const B = { a, goQ, summarised: sum };
  return (
    <div className="pb-boverview"><div className="pb-bento">
      {id === 'who' ? <>
        <Block {...B} label="Mission" span={12} from={['mission']}><Clamp text={a.mission} lines={4} className="pb-bt-quote pb-bt-quote--l" /></Block>
        <Block {...B} label="What makes them different" span={12} from={['sauce']}>
          {h.claims?.length ? <div className="pb-claims">{h.claims.map((c) => <div key={c.text} className="pb-claim">{c.figure ? <b>{c.figure}</b> : null}<span>{c.text}</span></div>)}</div> : <Clamp text={a.sauce} />}
        </Block>
        <Block {...B} label="Who it’s for" span={12} from={['customer', 'demographics']}>
          {h.audience?.length ? <div className="pb-personas">{h.audience.map((x) => <div key={x.name}><b>{x.name}</b><p>{x.detail}</p></div>)}</div> : <Clamp text={a.customer} />}
        </Block>
      </> : id === 'going' ? <>
        <Block {...B} label="How it should look" span={4} from={['look']}>{look.length ? <ul className="pb-bhead-words pb-bhead-words--s">{look.map((w) => <li key={w}>{w}</li>)}</ul> : <Clamp text={a.look} />}</Block>
        <Block {...B} label="How it should feel" span={4} from={['feel']}>{h.feel?.length ? <Points items={h.feel} show={8} /> : <Clamp text={a.feel} />}</Block>
        <Block {...B} label="What it must not be" span={4} from={['avoid']}>{h.avoid?.length ? <Points items={h.avoid} show={10} /> : <Clamp text={a.avoid} />}</Block>
      </> : id === 'identity' ? <>
        <Block {...B} label="Keep from today" span={6} from={['like']}>{h.keep?.length ? <Points items={h.keep} show={8} /> : <Clamp text={a.like} />}</Block>
        <Block {...B} label="Change" span={6} from={['dislike']}>{h.change?.length ? <Points items={h.change} show={8} /> : <Clamp text={a.dislike} />}</Block>
        <Block {...B} label="Logo" span={4} tone="board" from={['logo']}>{h.logo?.length ? <Points items={h.logo} show={8} /> : <Clamp text={a.logo} />}</Block>
        <Block {...B} label="Colour" span={4} tone="board" from={['colour']}>{h.colour?.length ? <Points items={h.colour} show={8} /> : <Clamp text={a.colour} />}</Block>
        <Block {...B} label="Type" span={4} tone="board" from={['type']}>{h.type?.length ? <Points items={h.type} show={8} /> : <Clamp text={a.type} />}</Block>
      </> : <>
        <Block {...B} label="Competitors" span={7} from={['competitors']}>
          {h.competitors?.length ? Object.entries(groups).map(([g, cs]) => <div key={g} className="pb-group">{g ? <p className="pb-bt-sub">{g}</p> : null}<Names items={cs} /></div>) : <Clamp text={a.competitors} />}
        </Block>
        <Block {...B} label="Best branded, in their view" span={5} from={['competitorBrand']}>{h.bestBranded ? <p className="pb-bt-quote">{h.bestBranded}</p> : <Clamp text={a.competitorBrand} />}</Block>
        <Block {...B} label="Inspiration" span={12} from={['inspiredBy', 'spaceBrands', 'inspoLike']}>
          {h.inspiration?.length ? <Names items={h.inspiration.map((x) => ({ name: x.name, note: x.why }))} /> : <Clamp text={[a.spaceBrands, a.inspiredBy].filter(Boolean).join('\n\n')} />}
        </Block>
        <Block {...B} label="Website" span={6} from={['action', 'messages']}>
          <p className="pb-action">{h.action || a.action || '—'}</p>
          {h.messages?.length ? <Points items={h.messages} numbered /> : <Clamp text={a.messages} lines={3} />}
        </Block>
        <Block {...B} label="Links and what’s to come" span={6} from={['board', 'product']}>
          {links.length ? <ul className="pb-links">{links.map((u) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{host(u)}<ArrowUpRight {...ICON} size={12} /></a></li>)}</ul> : null}
          {h.pending?.length ? <Points items={h.pending} /> : !links.length ? <p className="pb-quiet">{QUESTIONS.length - answered(a) ? `${QUESTIONS.length - answered(a)} questions unanswered.` : 'Nothing outstanding.'}</p> : null}
        </Block>
      </>}
    </div></div>
  );
}

/** The overview: one card per idea, three lines at most, each opening its part of the brief. */
function OverviewCards({ p, goSection }: { p: Project; goSection: (id: SectionId) => void }) {
  const a = p.intake ?? {}, h = p.heard ?? {};
  const look = h.look?.length ? h.look : words(a.look);
  type C = { label: string; part: SectionId; span?: 2 | 3; tone?: 'board'; lines?: string[]; chips?: string[]; big?: string; raw?: string; total?: number };
  const pts = (list?: string[], raw?: string) => (list?.length ? { lines: list.slice(0, 3), total: list.length } : { raw });
  const names = (list?: { name: string }[]) => (list?.length ? { big: list.slice(0, 5).map((x) => x.name).join(' · '), total: list.length } : {});
  const cards: { group: string; part: SectionId; items: C[] }[] = [
    { group: 'Who they are', part: 'who', items: [
      { label: 'Mission', part: 'who', big: a.mission ? (a.mission.length > 120 ? `${a.mission.slice(0, a.mission.indexOf('.') > 20 ? a.mission.indexOf('.') + 1 : 120)}` : a.mission) : undefined, raw: a.mission ? undefined : '' },
      { label: 'What makes them different', part: 'who', ...(h.claims?.length ? { lines: h.claims.map((c) => c.figure || c.text).slice(0, 3), total: h.claims.length } : { raw: a.sauce }) },
      { label: 'Who it’s for', part: 'who', ...(h.audience?.length ? { lines: h.audience.map((x) => x.name), total: h.audience.length } : { raw: a.customer }) },
    ] },
    { group: 'Where it’s going', part: 'going', items: [
      { label: 'How it should look', part: 'going', ...(look.length ? { chips: look.slice(0, 5), total: look.length } : { raw: a.look }) },
      { label: 'How it should feel', part: 'going', ...pts(h.feel, a.feel) },
      { label: 'What it must not be', part: 'going', ...pts(h.avoid, a.avoid) },
    ] },
    { group: 'Identity', part: 'identity', items: [
      { label: 'Keep from today', part: 'identity', span: 3, ...pts(h.keep, a.like) },
      { label: 'Change', part: 'identity', span: 3, ...pts(h.change, a.dislike) },
      { label: 'Logo', part: 'identity', tone: 'board', ...pts(h.logo, a.logo) },
      { label: 'Colour', part: 'identity', tone: 'board', ...pts(h.colour, a.colour) },
      { label: 'Type', part: 'identity', tone: 'board', ...pts(h.type, a.type) },
    ] },
    { group: 'Market', part: 'market', items: [
      { label: 'Competitors', part: 'market', ...(h.competitors?.length ? names(h.competitors) : { raw: a.competitors }) },
      { label: 'Inspiration', part: 'market', ...(h.inspiration?.length ? names(h.inspiration) : { raw: [a.spaceBrands, a.inspiredBy].filter(Boolean).join(' ') }) },
      { label: 'Website', part: 'market', big: h.action || a.action, ...(h.messages?.length ? { total: h.messages.length } : {}) },
    ] },
  ];
  const more = (c: C) => {
    if (c.label === 'Website') return c.total ? `${c.total} messages` : 'Their words';
    if (c.raw !== undefined && !c.lines && !c.chips && !c.big) return 'Their words';
    if (!c.total) return '';
    if (c.big) return `${c.total} named`;
    return c.total > 1 ? `${c.total} points` : '';
  };
  return (
    <div className="pb-bcards">
      {cards.map((g) => (
        <section key={g.group} className="pb-bcardgroup" aria-label={g.group}>
          <button type="button" className="pb-bcardgroup-head" onClick={() => goSection(g.part)}>{g.group}<ArrowUpRight {...ICON} size={12} /></button>
          <div className="pb-bcardgrid">
            {g.items.map((c) => (
              <button key={c.label} type="button" className="pb-bcard" data-tone={c.tone} data-span={c.span ?? 2} onClick={() => goSection(c.part)}>
                <span className="pb-bcard-label">{c.label}</span>
                {c.chips ? <span className="pb-bcard-chips">{c.chips.map((w) => <span key={w}>{w}</span>)}</span>
                  : c.lines ? <span className="pb-bcard-lines">{c.lines.map((l) => <span key={l}>{l}</span>)}</span>
                  : c.big ? <span className="pb-bcard-big">{c.big}</span>
                  : <span className="pb-bcard-raw">{c.raw || 'No answer.'}</span>}
                {more(c) ? <span className="pb-bcard-more">{more(c)}</span> : null}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Questionnaire({ p, onChange, locked }: { p: Project; onChange: (id: QuestionId, v: string) => void; locked: boolean }) {
  const a = p.intake ?? {};
  let n = 0;
  return (
    <div className="pb-form">
      {SECTIONS.map((sec) => (
        <section key={sec} className="pb-form-section" id={`sec-${SECTIONS.indexOf(sec)}`} aria-labelledby={`sech-${SECTIONS.indexOf(sec)}`}>
          <h2 id={`sech-${SECTIONS.indexOf(sec)}`}>{sec}</h2>
          {QUESTIONS.filter((q) => q.section === sec).map((q) => {
            n++;
            const v = a[q.id] ?? '';
            return (
              <div key={q.id} className="pb-q" id={`q-${q.id}`}>
                <label htmlFor={`qa-${q.id}`}><span className="pb-q-n">{n}</span>{q.q}</label>
                <textarea id={`qa-${q.id}`} className="pb-q-input" data-short={q.short || undefined} rows={q.short ? 1 : 3} maxLength={MAX_ANSWER} value={v} readOnly={locked}
                  placeholder={locked ? '' : 'Type an answer'} onChange={(e) => onChange(q.id, e.target.value)} />
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

/* ---------- Import ---------- */

type ImportState = { stage: 'pick' } | { stage: 'reading'; note: string } | { stage: 'review'; parsed: Parsed; source: string } | { stage: 'error'; note: string };

function ImportDialog({ p, ask, onApply, onClose }: { p: Project; ask: Ask | null; onApply: (parsed: Parsed, source: string) => void; onClose: () => void }) {
  const [st, setSt] = useState<ImportState>({ stage: 'pick' });
  const [paste, setPaste] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const viaClaude = async (text: string, source: string) => {
    if (!ask) { setSt({ stage: 'error', note: 'Reading this needs Claude, which isn’t available on this page. A CSV or Markdown export from Notion works without it.' }); return; }
    setSt({ stage: 'reading', note: 'Claude is filing the answers into the questionnaire…' });
    try {
      const parsed = cleanParsed(await ask.json(mappingPrompt(text), { cache: false }));
      if (!parsed || !Object.keys(parsed.answers).length) { setSt({ stage: 'error', note: 'No answers were found in that file.' }); return; }
      setSt({ stage: 'review', parsed, source });
    } catch (error: any) {
      setSt({ stage: 'error', note: error?.code === 'not_granted' ? 'Claude isn’t allowed on this page yet. Allow it from the page’s permissions and try again.' : 'Claude couldn’t read that just now. Try again in a moment.' });
    }
  };
  const read = async (file: File) => {
    const name = file.name, ext = name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'pdf') {
        setSt({ stage: 'reading', note: 'Reading the PDF…' });
        const text = await pdfText(file);
        if (text.replace(/\s/g, '').length < 200) { setSt({ stage: 'error', note: 'That PDF has no readable text (it may be scanned). Export the response from Notion as Markdown or CSV instead.' }); return; }
        await viaClaude(text, name);
        return;
      }
      if (ext === 'csv' || ext === 'md' || ext === 'markdown' || ext === 'txt') {
        const text = await file.text();
        const cols = ext === 'csv' ? parseByColumns(text, 'csv') : parseByColumns(text, 'md');
        if (cols) { setSt({ stage: 'review', parsed: cols, source: name }); return; }
        await viaClaude(text, name);
        return;
      }
      setSt({ stage: 'error', note: `${name} isn’t a PDF, CSV, Markdown or text file.` });
    } catch {
      setSt({ stage: 'error', note: ext === 'pdf' ? 'The PDF reader couldn’t load here. Export the response from Notion as Markdown or CSV, or paste the text.' : `${name} couldn’t be read.` });
    }
  };
  const cur = p.intake ?? {};
  return (
    <div className="pb-overlay" role="dialog" aria-modal="true" aria-label="Import questionnaire answers" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pb-overlay-card pb-import">
        <div className="pb-overlay-head"><span>Import answers for {p.name}</span><Btn icon={<X {...ICON} />} label="Close" onClick={onClose} /></div>
        {st.stage === 'pick' || st.stage === 'error' ? (
          <div className="pb-import-body">
            <div className="pb-drop" data-over={over || undefined} onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) void read(f); }}>
              <FileText {...ICON} size={20} />
              <p><b>Drop the response from Notion</b><br />A PDF, or a Markdown or CSV export of the response.</p>
              <input ref={input} type="file" hidden accept=".pdf,.csv,.md,.markdown,.txt" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void read(f); }} />
              <Btn variant="primary" icon={<Upload {...ICON} />} onClick={() => input.current?.click()} autoFocus>Choose a file</Btn>
            </div>
            <label className="pb-import-paste">
              <span className="pb-insplabel">Or paste the answers</span>
              <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} placeholder="Paste a response, an email or notes from a call" />
            </label>
            <div className="pb-rowbtns">
              <Btn variant="secondary" icon={<ClipboardPaste {...ICON} />} disabled={paste.trim().length < 80} onClick={() => { const cols = parseByColumns(paste, 'md'); if (cols) setSt({ stage: 'review', parsed: cols, source: 'Pasted text' }); else void viaClaude(paste, 'Pasted text'); }}>Read pasted text</Btn>
            </div>
            {st.stage === 'error' ? <p className="pb-import-error" role="alert">{st.note}</p> : null}
          </div>
        ) : st.stage === 'reading' ? (
          <div className="pb-import-body pb-import-wait" role="status"><span className="pb-spin" aria-hidden="true" />{st.note}</div>
        ) : (
          <div className="pb-import-body">
            <p>{Object.keys(st.parsed.answers).length} of {QUESTIONS.length} questions answered{st.parsed.submittedBy ? ` by ${st.parsed.submittedBy}` : ''}{st.parsed.submittedAt ? `, sent ${fmtDate(st.parsed.submittedAt)}` : ''}. {st.parsed.how === 'claude' ? 'Claude filed them; check them before you use them.' : 'Matched by Notion’s field names.'}</p>
            <ul className="pb-import-list">
              {QUESTIONS.map((q) => {
                const v = st.parsed.answers[q.id];
                const had = (cur[q.id] ?? '').trim();
                return (
                  <li key={q.id} data-state={!v ? 'none' : had && had !== v ? 'replace' : had ? 'same' : 'new'}>
                    <span className="pb-import-q">{q.q}</span>
                    <span className="pb-import-a">{v ? v.slice(0, 160) + (v.length > 160 ? '…' : '') : 'No answer found'}</span>
                    {v && had && had !== v ? <span className="pb-count">Replaces</span> : null}
                  </li>
                );
              })}
            </ul>
            <div className="pb-rowbtns">
              <Btn variant="primary" onClick={() => onApply(st.parsed, st.source)}>Use these answers</Btn>
              <Btn onClick={() => setSt({ stage: 'pick' })}>Choose another</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- The Brief view ---------- */

export function BriefView({ project, brand, store, frame, ask, part, goPart }: { project: Project; brand: Brand | null; store: ProjectStore; frame: Frame; ask: Ask | null; part?: string; goPart: (part?: string, focus?: string) => void }) {
  const p = project;
  const form = !!part && part.startsWith('form');
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const locked = store.mode === 'readonly';
  const n = answered(p.intake);
  const setAnswer = (id: QuestionId, v: string) => store.save(p.id, { intake: { ...(p.intake ?? {}), [id]: v }, intakeMeta: p.intakeMeta ?? { source: 'Typed in', how: 'typed', at: Date.now() } });
  const apply = (parsed: Parsed, source: string) => {
    store.save(p.id, { intake: { ...(p.intake ?? {}), ...parsed.answers }, intakeMeta: { source, how: parsed.how, at: Date.now(), submittedAt: parsed.submittedAt, submittedBy: parsed.submittedBy }, heard: undefined, ...(p.brand ? {} : { name: parsed.answers.company?.slice(0, 80) || p.name }) });
    setImporting(false);
    goPart(undefined);
  };
  const summarise = async () => {
    if (!ask || !p.intake) return;
    setBusy(true); setNote('');
    try {
      const heard = cleanHeard(await ask.json(heardPrompt(p.intake.company || p.name, p.intake), { cache: false }));
      if (heard) store.save(p.id, { heard }); else setNote('The summary came back empty. Try again.');
    } catch (error: any) { setNote(error?.code === 'not_granted' ? 'Claude isn’t allowed on this page yet.' : 'Claude couldn’t summarise just now. Try again in a moment.'); }
    finally { setBusy(false); }
  };
  // "form-<question>" opens the questionnaire at that question.
  useEffect(() => {
    const q = part?.startsWith('form-') ? part.slice(5) : '';
    if (!q) return;
    const t = setTimeout(() => { const el = document.getElementById(`q-${q}`); el?.scrollIntoView({ block: 'center' }); (el?.querySelector('textarea') as HTMLElement | null)?.focus({ preventScroll: true }); }, 80);
    return () => clearTimeout(t);
  }, [part]);
  // A part of the brief ("who", "going"…); the old "at-<part>" links still land on it.
  const sec: SectionId | undefined = isSection(part) ? part : isSection(part?.slice(3)) ? (part!.slice(3) as SectionId) : undefined;
  const goQ = (id: QuestionId) => { goPart('form'); setTimeout(() => { const el = document.getElementById(`q-${id}`); el?.scrollIntoView({ block: 'center' }); (el?.querySelector('textarea') as HTMLElement | null)?.focus({ preventScroll: true }); }, 60); };

  const rail = (
    <>
      <div className="pb-railblock">
        <h2 className="pb-railtitle">Brief</h2>
        <ul className="pb-raillist">
          <RailItem current={!form && !sec} onClick={() => goPart(undefined)}>Overview</RailItem>
          {p.intake ? OVERVIEW_PARTS.map((x) => <RailItem key={x.id} current={sec === x.id} onClick={() => goPart(x.id)}>{x.name}</RailItem>) : null}
        </ul>
      </div>
      <div className="pb-railblock">
        <ul className="pb-raillist">
          <RailItem current={form} meta={`${n}/${QUESTIONS.length}`} onClick={() => goPart('form')}>Questionnaire</RailItem>
        </ul>
      </div>
      {form ? (
        <div className="pb-railblock pb-railblock--fill">
          <RailHead>Sections</RailHead>
          <ul className="pb-raillist">
            {SECTIONS.map((s, i) => <RailItem key={s} meta={`${QUESTIONS.filter((q) => q.section === s && p.intake?.[q.id]?.trim()).length}/${QUESTIONS.filter((q) => q.section === s).length}`} onClick={() => document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{s}</RailItem>)}
          </ul>
        </div>
      ) : <div className="pb-railblock pb-railblock--fill" />}
      <p className="pb-railnote pb-railfoot" role="status">
        {p.intakeMeta ? `From ${p.intakeMeta.source}${p.intakeMeta.how === 'claude' ? ', filed by Claude' : ''}, ${fmtDate(p.intakeMeta.at)}.` : 'No answers yet.'} {store.problem || (store.mode === 'readonly' ? 'View only.' : store.mode === 'local' ? 'Kept in this browser.' : '')}
      </p>
    </>
  );

  const actions = (
    <>
      <Btn variant="secondary" icon={<Upload {...ICON} />} disabled={locked} onClick={() => setImporting(true)}>Import</Btn>
      {!form && p.intake ? <Btn variant={p.heard ? 'secondary' : 'primary'} icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Sparkles {...ICON} />} disabled={busy || !ask || locked} onClick={summarise}>{busy ? 'Summarising' : p.heard ? 'Summarise again' : 'Summarise'}</Btn> : null}
    </>
  );

  const secName = sec ? OVERVIEW_PARTS.find((x) => x.id === sec)!.name : '';
  const from = p.intakeMeta?.submittedBy || p.intake?.contact;
  const personality = p.heard?.personality?.length ? p.heard.personality : words(p.intake?.adjectives);
  const head = form || !p.intake ? (
    <header className="pb-pagehead pb-briefhead">
      <p className="pb-eyebrow">{p.name} · Brief</p>
      <h1>{form ? 'Questionnaire' : `${p.name} brief`}</h1>
      <p>{form ? 'Answers save as you type. An import fills in the rest.' : ''}</p>
      {note ? <p className="pb-import-error" role="alert">{note}</p> : null}
    </header>
  ) : sec ? (
    <header className="pb-pagehead pb-briefhead">
      <p className="pb-eyebrow">{p.intake.company || p.name} · Brief</p>
      <h1>{secName}</h1>
      {note ? <p className="pb-import-error" role="alert">{note}</p> : null}
    </header>
  ) : (
    <header className="pb-bhead">
      <p className="pb-eyebrow">Brief{from ? ` · from ${from}` : ''}{p.intakeMeta?.submittedAt ? `, ${fmtDate(p.intakeMeta.submittedAt)}` : ''}</p>
      <h1>{p.intake.company || p.name}</h1>
      {p.heard?.oneLiner ? <p className="pb-bhead-line">{p.heard.oneLiner}</p> : <Clamp text={p.intake.describe} lines={3} className="pb-bhead-line" />}
      {personality.length ? <ul className="pb-bhead-words" aria-label="In their words">{personality.map((w) => <li key={w}>{w}</li>)}</ul> : null}
      {note ? <p className="pb-import-error" role="alert">{note}</p> : null}
      {!p.heard ? <p className="pb-bnote">These are their answers as written. Summarise them for the short statements the workshop boards use.</p> : null}
    </header>
  );

  const main = (
    <div className="pb-page pb-page--wide">
      {head}
      {form ? <Questionnaire p={p} onChange={setAnswer} locked={locked} />
        : p.intake ? (sec ? <BriefSection p={p} id={sec} goQ={goQ} /> : <OverviewCards p={p} goSection={(id) => goPart(id)} />)
        : (
          <div className="pb-empty pb-empty--inline">
            <h2>No questionnaire yet</h2>
            <p>Import {p.name}’s Brand Sprint questionnaire from Notion, or fill it in from a call.</p>
            <div className="pb-rowbtns"><Btn variant="primary" icon={<Upload {...ICON} />} disabled={locked} onClick={() => setImporting(true)}>Import answers</Btn><Btn onClick={() => goPart('form')}>Fill it in</Btn></div>
          </div>
        )}
      {importing ? <ImportDialog p={p} ask={ask} onApply={apply} onClose={() => setImporting(false)} /> : null}
    </div>
  );
  return frame({ actions, rail, railLabel: 'Brief', main, mainLabel: form ? 'Questionnaire' : sec ? `Brief: ${secName}` : 'Brief overview', kind: 'doc' });
}
