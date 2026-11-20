// Projects, Make, Review and Machine views. Each returns its content through the shared frame.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, Braces, Check, Circle, Copy, Download, Film, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { ZachDialRoot } from './components/zach-ui/ZachDialRoot';
import * as E from './engine/index.js';
import { Btn, Chip, CopyButton, CopyPanel, DataPanel, pickData, SizePicker, Html, ICON, PromptBar, pickCopy, RailHead, RailItem, SEVERITY, dialSetup, fromDial, openCount, pageRef, toDial, useDialKitController, type Ask, type Brand, type Params, type Route, type Save, type Tpl } from './ui';
import type { Frame } from './App';
import { saveSet, visibleRecipes, type RecipeStore, type Role } from './recipes';
import type { BrandFiles } from './assets';
import { buildKit, kitName, type KitFile } from './kitbuild';
import { STAGE_NAME, type Project, type ProjectStore } from './projects';
import { QUESTIONS, answered } from './intake';

/* ---------- Projects ---------- */

function StartProject({ projects, go }: { projects: ProjectStore; go: (r: Route) => void }) {
  const [name, setName] = useState('');
  const locked = projects.mode === 'readonly' || projects.mode === 'loading';
  const start = () => { const id = projects.create(name); if (id) { setName(''); go({ brand: id, view: 'brief' }); } };
  return (
    <article className="pb-project pb-project--add">
      <span className="pb-add-icon" aria-hidden="true"><Plus {...ICON} size={20} /></span>
      <h2>Start a project</h2>
      <p>A project begins with the client’s Brand Sprint questionnaire. Import their answers from Notion, or fill it in from a call.</p>
      <form className="pb-start" onSubmit={(e) => { e.preventDefault(); start(); }}>
        <input className="pb-start-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Client name" aria-label="Client name" disabled={locked} />
        <Btn variant="primary" type="submit" disabled={locked || !name.trim()}>Start</Btn>
      </form>
      <p className="pb-quiet">To add a brand system, send its Figma link or guideline PDF in the chat with Claude.</p>
    </article>
  );
}

function IntakeCard({ p, go }: { p: Project; go: (r: Route) => void }) {
  const n = answered(p.intake);
  const line = p.heard?.oneLiner || p.intake?.describe;
  const words = p.heard?.personality?.slice(0, 5) ?? [];
  return (
    <article className="pb-project">
      <button type="button" className="pb-project-cover pb-intakecover" aria-label={`Open the ${p.name} brief`} onClick={() => go({ brand: p.id, view: 'brief' })}>
        <span className="pb-intakecover-name">{p.intake?.company || p.name}</span>
        {line ? <span className="pb-intakecover-line">{line.length > 150 ? `${line.slice(0, 150).trim()}…` : line}</span> : <span className="pb-intakecover-line">No questionnaire yet.</span>}
        {words.length ? <span className="pb-intakecover-words">{words.join(' · ')}</span> : null}
      </button>
      <div className="pb-project-meta">
        <div className="pb-project-title">
          <h2>{p.name}</h2>
          <p>{p.intakeMeta?.submittedBy ? `From ${p.intakeMeta.submittedBy}` : 'Questionnaire'} · {n} of {QUESTIONS.length} answered</p>
        </div>
        <span className="pb-pill" data-quiet="true">{STAGE_NAME[p.stage]}</span>
      </div>
      <div className="pb-project-links">
        <Btn onClick={() => go({ brand: p.id, view: 'brief' })}>Overview</Btn>
        <Btn onClick={() => go({ brand: p.id, view: 'brief', chapter: 'form' })}>Questionnaire</Btn>
      </div>
    </article>
  );
}

export function ProjectsView({ go, resolved, frame, deckCounts, projects }: { go: (r: Route) => void; resolved: Set<string>; frame: Frame; deckCounts: Record<string, number>; projects: ProjectStore }) {
  const main = (
    <div className="pb-page pb-page--wide">
      <header className="pb-pagehead">
        <h1>Projects</h1>
        <p>Each project starts from the client’s questionnaire and becomes a brand system once its guideline is read in. A brand’s guideline, layouts, decks and agent package are all drawn from that one record.</p>
      </header>
      <div className="pb-projects">
        {/* Always first, so starting a project never falls below the fold as the list grows. */}
        <StartProject projects={projects} go={go} />
        {projects.list.map((p) => {
          const b: Brand | undefined = p.brand ? E.BY[p.brand] : undefined;
          if (!b) return <IntakeCard key={p.id} p={p} go={go} />;
          const open = openCount(b, resolved);
          return (
            <article className="pb-project" key={b.id}>
              <button type="button" className="pb-project-cover" aria-label={`Open the ${b.name} guideline`} onClick={() => go({ brand: b.id, view: 'guideline' })}>
                <Html html={b.card.html} />
              </button>
              <div className="pb-strip" aria-hidden="true">{b.card.strip.map((hex: string) => <span key={hex} style={{ background: hex }} />)}</div>
              <div className="pb-project-meta">
                <div className="pb-project-title">
                  <h2>{b.name}</h2>
                  <p>{b.source.kind} · {b.source.detail}</p>
                </div>
                {open ? <button type="button" className="pb-pill" onClick={() => go({ brand: b.id, view: 'review' })}>{open} to review</button> : <span className="pb-pill" data-quiet="true">Reviewed</span>}
              </div>
              <div className="pb-project-links">
                <Btn onClick={() => go({ brand: b.id, view: 'brief' })}>Brief{p.intake ? null : <span className="pb-count">—</span>}</Btn>
                <Btn onClick={() => go({ brand: b.id, view: 'guideline' })}>Guideline</Btn>
                <Btn onClick={() => go({ brand: b.id, view: 'make' })}>Make <span className="pb-count">{b.T.length}</span></Btn>
                <Btn onClick={() => go({ brand: b.id, view: 'decks' })}>Decks <span className="pb-count">{deckCounts[b.id] ?? 0}</span></Btn>
                <Btn onClick={() => go({ brand: b.id, view: 'machine' })}>Machine</Btn>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
  return frame({ main, mainLabel: 'Projects', kind: 'doc' });
}

/* ---------- Make ---------- */

// A small frame drawn at the layout's proportions, used as the layout's icon.
const FrameGlyph = ({ w, h }: { w: number; h: number }) => {
  const k = 14 / Math.max(w, h);
  return <span className="pb-frameglyph" style={{ width: Math.max(6, Math.round(w * k)), height: Math.max(6, Math.round(h * k)) }} />;
};
// A set's icon: its sizes as small frames side by side.
const SetGlyph = ({ sizes }: { sizes: string[] }) => (
  <span className="pb-setglyph" aria-hidden="true">
    {sizes.slice(0, 3).map((s) => { const z = E.SIZE_BY[s] ?? { w: 1, h: 1 }; const k = 10 / Math.max(z.w, z.h); return <span key={s} className="pb-frameglyph" style={{ width: Math.max(4, Math.round(z.w * k)), height: Math.max(4, Math.round(z.h * k)) }} />; })}
  </span>
);

// Make's rail: the brand's sets (a layout kept the brand's way, made at several sizes at once), then its layouts.
export function MakeRail({ brand, current, setTpl, recipes, role }: { brand: Brand; current: string; setTpl: (id: string) => void; recipes: RecipeStore; role: Role }) {
  const sets = visibleRecipes(recipes, brand, role).filter((r) => r.status !== 'archived');
  const ideas = E.R.ideasFor(brand.id, recipes.list.filter((r) => r.brand === brand.id));
  const own = brand.T.filter((x: Tpl) => !x.shared), shared = brand.T.filter((x: Tpl) => x.shared);
  const meta = (r: any) => r.status === 'proposed' ? 'Waiting' : r.status === 'draft' ? 'Draft' : E.R.unused(r) ? 'Unused' : `${r.sizes.length} sizes`;
  const item = (x: Tpl) => {
    const [fw, fh] = E.sizeOf(x, E.defaults(x));
    return <RailItem key={x.id} current={x.id === current} onClick={() => setTpl(x.id)} lead={<FrameGlyph w={fw} h={fh} />} meta={`${fw}×${fh}`}>{x.name}</RailItem>;
  };
  return (
    <>
      <div className="pb-railblock">
        <RailHead>Sets <span className="pb-count">{sets.length}</span></RailHead>
        <ul className="pb-raillist">
          {sets.map((r) => <RailItem key={r.id} current={current === `set:${r.id}`} onClick={() => setTpl(`set:${r.id}`)} lead={<SetGlyph sizes={r.sizes} />} meta={meta(r)}>{r.name}</RailItem>)}
          {ideas.map((i: any) => <RailItem key={i.id} current={current === `idea:${i.id}`} onClick={() => setTpl(`idea:${i.id}`)} lead={<Sparkles {...ICON} size={14} />} meta="Suggested">{i.name}</RailItem>)}
        </ul>
        {!sets.length && !ideas.length ? <p className="pb-quiet pb-rail-note">Save any layout as a set to make all its sizes in one go.</p> : null}
      </div>
      <div className="pb-railblock"><RailHead>Layouts <span className="pb-count">{own.length}</span></RailHead><ul className="pb-raillist">{own.map(item)}</ul></div>
      {shared.length ? <div className="pb-railblock"><RailHead>Shared <span className="pb-count">{shared.length}</span></RailHead><ul className="pb-raillist">{shared.map(item)}</ul></div> : null}
    </>
  );
}

export function MakeScreen({ brand, tpl, setTpl, frame, pending, onCall, onDraft, save, ask, message, setMessage, recipes, role }: {
  brand: Brand; tpl: string; setTpl: (id: string) => void; frame: Frame; pending: React.MutableRefObject<{ tpl: string; params: Params } | null>;
  onCall: (call: object) => void; onDraft: (tpl: string, params: Params) => void; save: Save; ask: Ask | null;
  message: string; setMessage: (m: string) => void; recipes: RecipeStore; role: Role;
}) {
  const t: Tpl = brand.TBY[tpl];
  const { config, paths } = useMemo(() => dialSetup(t, brand), [t, brand]);
  const controller = useDialKitController(t.name, config, { id: `primary-brand:${brand.id}:${t.id}:v2`, persist: false });
  const raw = fromDial(paths, controller.values);
  // Copy and lists live here; DialKit holds the rest. Both feed the same sanitized params.
  const [copy, setCopy] = useState<Params>(() => pickCopy(t, E.defaults(t)));
  // The size is picked from the shared list, outside DialKit.
  const [fmt, setFmt] = useState<string | undefined>(() => E.defaults(t).format as string | undefined);
  // Settings carried in from a tool, such as the Glass tool's values; they have no dial.
  const [data, setData] = useState<Params>({});
  const key = JSON.stringify(raw) + JSON.stringify(copy) + JSON.stringify(data) + fmt;
  const p: Params = useMemo(() => E.sanitize(t, { ...raw, ...copy, ...data, ...(fmt ? { format: fmt } : {}) }), [t, key]);
  const [w, h] = E.sizeOf(t, p);
  const stage = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'' | 'png' | 'video'>('');
  const [drafting, setDrafting] = useState(false);
  const [scale, setScale] = useState(1);

  // The artboard fits the space the canvas has, never above its real size.
  const fit = useCallback(() => {
    const el = holder.current?.firstElementChild as HTMLElement | null, box = stage.current;
    if (!el || !box || !holder.current) return;
    const cs = getComputedStyle(box);
    const aw = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const k = Math.max(0.05, Math.min(aw / w, (ah > 120 ? ah : innerHeight * 0.6) / h, 1));
    el.style.transform = `scale(${k})`;
    holder.current.style.width = `${w * k}px`;
    holder.current.style.height = `${h * k}px`;
    setScale(k);
  }, [w, h]);

  // One state path: the controller's values draw the asset, and nothing else does.
  useLayoutEffect(() => {
    if (!holder.current) return;
    holder.current.innerHTML = E.tplHTML(t, p);
    fit();
    E.mountWG();
    E.mountLive(holder.current);
  }, [t, p, fit]);
  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(fit);
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, [fit]);
  useEffect(() => { onCall({ brand: brand.id, template: t.id, params: p, output: 'png' }); }, [brand, t, p, onCall]);
  useEffect(() => {
    const next = pending.current;
    if (!next || next.tpl !== t.id) return;
    controller.setValues(toDial(paths, next.params) as never);
    setCopy(pickCopy(t, next.params));
    setData(pickData(t, next.params));
    if (next.params.format) setFmt(String(next.params.format));
    pending.current = null;
  }, [t]);

  const root = () => holder.current?.firstElementChild as HTMLElement;
  const file = (ext: string) => `${brand.id}-${t.id}-${w}x${h}.${ext}`;
  const exportPng = async () => {
    setBusy('png');
    try { await save(file('png'), await E.toPNG(root())); }
    catch { setMessage('This browser could not render the image.'); }
    finally { setBusy(''); }
  };
  const exportVideo = async () => {
    setBusy('video');
    try { const { blob, ext } = await E.toVideo(root()); await save(file(ext), blob); }
    catch { setMessage('This browser could not record the video.'); }
    finally { setBusy(''); }
  };
  const draft = async (brief: string) => {
    if (!ask || drafting) return false;
    setDrafting(true);
    setMessage('Drafting…');
    try {
      const answer = await ask.json(E.briefPrompt(brief, brand), { cache: false });
      const target: Tpl | undefined = brand.TBY[answer?.template];
      if (!target) throw { code: 'bad' };
      const params: Params = E.sanitize(target, answer.params);
      setMessage(answer.why ? String(answer.why).slice(0, 240) : 'Drafted.');
      if (target.id === t.id) { controller.setValues(toDial(paths, params) as never); setCopy(pickCopy(t, params)); if (params.format) setFmt(String(params.format)); }
      else onDraft(target.id, params);
      return true;
    } catch (error: any) {
      setMessage(error?.code === 'rate_limited' ? 'Claude is busy. Try again in a moment.' : error?.code === 'not_granted' ? 'Drafting needs permission to ask Claude.' : 'That did not produce a usable draft. Try rewording the request.');
      return false;
    } finally { setDrafting(false); }
  };

  const checks = E.checks(t, p);
  const rail = <MakeRail brand={brand} current={t.id} setTpl={setTpl} recipes={recipes} role={role} />;
  const canSet = E.R.sizesOf(t).length > 0 && recipes.mode !== 'readonly' && recipes.mode !== 'loading';
  const keepAsSet = () => { const id = saveSet(recipes, role, brand, E.R.specFromMake(brand.id, t, p)); if (id) setTpl(`set:${id}`); };
  const inspector = (
    <>
      <div className="pb-insphead">
        <div><h2>{t.name}</h2><p>{t.src === 'shared' ? 'Shared layout, drawn from this brand’s colours, type, logo and photographs' : `From ${t.src}${t.shared ? ' · shared layout' : ''}`}</p></div>
        <Btn icon={<RotateCcw {...ICON} />} label="Reset to the sample" onClick={() => { controller.resetValues(); setCopy(pickCopy(t, E.defaults(t))); setData({}); setFmt(E.defaults(t).format as string | undefined); }} />
      </div>
      <SizePicker t={t} value={String(p.format)} onChange={setFmt} />
      <CopyPanel t={t} value={p} onChange={(k, v) => setCopy((c) => ({ ...c, [k]: v }))} />
      <div className="pb-dials"><ZachDialRoot /></div>
      <DataPanel t={t} value={p} onClear={(k) => setData((d) => { const n = { ...d }; delete n[k]; return n; })} />
      {canSet ? (
        <div className="pb-inspblock pb-setblock">
          <h3 className="pb-insplabel">Make it a set</h3>
          <p className="pb-quiet">Keep this look, leave the words open, and make every size in one go. You can choose the sizes next.</p>
          <Btn icon={<Plus {...ICON} />} onClick={keepAsSet}>Save as a set</Btn>
        </div>
      ) : null}
      <div className="pb-inspblock">
        <h3 className="pb-insplabel">Checks</h3>
        <ul className="pb-checks">
          {checks.map((c: any) => (
            <li key={c.name + c.text} data-ok={c.ok}>
              {c.ok ? <Check {...ICON} size={14} /> : <Circle {...ICON} size={14} />}
              <span><b>{c.name}</b> {c.ok ? '' : 'Note: '}{c.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
  const actions = (
    <>
      <CopyButton icon={<Braces {...ICON} />} label="Copy properties as JSON" text={() => JSON.stringify({ brand: brand.id, template: t.id, params: p }, null, 2)} />
      {E.canVideo(t, p) ? <Btn variant="secondary" icon={busy === 'video' ? <span className="pb-spin" aria-hidden="true" /> : <Film {...ICON} />} disabled={busy !== ''} onClick={exportVideo}>{busy === 'video' ? 'Recording 8s' : 'Video'}</Btn> : null}
      <Btn variant="primary" icon={busy === 'png' ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy !== ''} onClick={exportPng}>{busy === 'png' ? 'Rendering' : 'Export PNG'}</Btn>
    </>
  );
  const main = (
    <div className="pb-canvas">
      <div className="pb-stage" ref={stage}>
        <div className="pb-artboard">
          <div className="pb-artlabel"><span>{t.name}</span><span>{w} × {h} · {Math.round(scale * 100)}%</span></div>
          <div className="pb-holder" ref={holder} />
        </div>
      </div>
      {ask ? <PromptBar label="Draft an asset with Claude" placeholder="Describe an asset, such as a post announcing a new location" busy={drafting} note={message} onSubmit={draft} /> : message ? <p className="pb-prompt-note pb-prompt-note--solo" role="status">{message}</p> : null}
    </div>
  );
  return frame({ actions, rail, railLabel: 'Layouts', inspector, inspectorLabel: 'Asset properties', main, mainLabel: 'Asset preview', kind: 'canvas' });
}

/* ---------- Review ---------- */

const FILTERS = ['all', 'fix', 'need', 'check', 'infer', 'done'] as const;
const FILTER_NAME: Record<string, string> = { all: 'All open', ...SEVERITY, done: 'Resolved' };

export function ReviewView({ brand, resolved, toggle, frame, files, goAssets }: { brand: Brand; resolved: Set<string>; toggle: (id: string) => void; frame: Frame; files: BrandFiles; goAssets: (slot: string) => void }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const flags: any[] = brand.BRAND.flags;
  const isDone = (f: any) => resolved.has(`${brand.id}:${f.id}`);
  const count = (k: string) => flags.filter((f) => (k === 'done' ? isDone(f) : !isDone(f) && (k === 'all' || f.sev === k))).length;
  const shown = flags.filter((f) => (filter === 'done' ? isDone(f) : filter === 'all' ? !isDone(f) : f.sev === filter && !isDone(f)));
  const rail = (
    <div className="pb-railblock">
      <RailHead>Queue</RailHead>
      <ul className="pb-raillist">
        {FILTERS.filter((k) => k === 'all' || k === 'done' || flags.some((f) => f.sev === k)).map((k) => <RailItem key={k} current={filter === k} meta={count(k)} onClick={() => setFilter(k)}>{FILTER_NAME[k]}</RailItem>)}
      </ul>
    </div>
  );
  const main = (
    <div className="pb-page">
      <header className="pb-pagehead">
        <h1>Review</h1>
        <p>Where the source was silent, inconsistent or pointed outside itself. Each item shows what the source says and what the package uses. Items that ask for files close themselves when the files are added in Assets; the rest close when someone accepts them, and the package records which.</p>
      </header>
      {shown.length ? (
        <ul className="pb-flags">
          {shown.map((f) => {
            const done = isDone(f);
            const st = E.flagStatus(brand, f);
            const auto = st.state === 'auto';
            const by = st.by ? files.names[st.by] : '';
            return (
              <li className="pb-flag" key={f.id} data-done={done}>
                <button type="button" className="pb-flag-toggle" aria-pressed={done} disabled={auto || files.mode === 'readonly'} aria-label={auto ? `Closed by Assets: ${f.title}` : done ? `Reopen: ${f.title}` : `Accept: ${f.title}`} title={auto ? 'Closed by the files in Assets' : done ? 'Reopen' : 'Accept'} onClick={() => toggle(`${brand.id}:${f.id}`)}>
                  {done ? <Check {...ICON} size={14} /> : null}
                </button>
                <div className="pb-flag-body">
                  <div className="pb-flag-head"><h2>{f.title}</h2><span className="pb-chips"><Chip kind={f.sev}>{SEVERITY[f.sev]}</Chip><Chip kind="page">{pageRef(f.p)}</Chip></span></div>
                  <dl>
                    <dt>Source</dt><dd>{f.says}</dd>
                    <dt>Package</dt><dd>{f.uses}</dd>
                    {f.why ? <><dt>Why</dt><dd>{f.why}</dd></> : null}
                  </dl>
                  {auto || st.slots || st.state === 'accepted' ? (
                    <div className="pb-flag-status">
                      <span>{auto ? st.note : st.state === 'accepted' ? `Accepted${by ? ` by ${by}` : ''} · ${new Date(st.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : st.progress || 'Closes itself when its files are added in Assets.'}</span>
                      {st.slots ? <Btn icon={<ArrowUpRight {...ICON} size={14} />} onClick={() => goAssets(st.slots[0])}>{auto ? 'See the files' : 'Add files in Assets'}</Btn> : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : <div className="pb-empty pb-empty--inline"><h2>{filter === 'done' ? 'Nothing resolved yet' : 'Nothing left here'}</h2><p>{filter === 'done' ? 'Accepted items, and items closed by files in Assets, appear here.' : 'Every item in this group is resolved.'}</p></div>}
    </div>
  );
  return frame({ rail, railLabel: 'Review filters', main, mainLabel: 'Review queue', kind: 'doc' });
}

/* ---------- Machine ---------- */

const TOOLS = [
  ['list_brands()', 'Every brand record, with its source and how many items are waiting for review.'],
  ['get_brand(brand, section?)', 'Returns a package, or one section: logo, color, type, imagery, graphics, icons. Every rule carries its basis and source page.'],
  ['list_templates(brand, kind?)', 'Layouts with their declared parameters, allowed tones and character limits. Shared layouts are marked.'],
  ['render_asset(brand, template, params, output)', 'Draws a template to PNG, video or HTML at a given time t. Unknown parameters and off-palette colours are rejected.'],
  ['render_deck(brand, slides, output)', 'Draws a sequence of slide layouts to PDF or images. Each slide is a layout id and its parameters, checked the same way as an asset.'],
  ['check_asset(brand, image | html)', 'Scores any asset against the rules: palette, contrast, clear space, type, colour balance.'],
];
const SECTION_NAME: Record<string, string> = { meta: 'Source', character: 'Character', voice: 'Voice', logo: 'Logo', color: 'Colour', type: 'Typography', imagery: 'Imagery', graphics: 'Graphic system', icons: 'Icons', flags: 'Review items', assets: 'Assets', tones: 'Tones', templates: 'Layouts', slides: 'Slide layouts' };

export function MachineView({ brand, call, frame, save }: { brand: Brand; call: object; frame: Frame; save: Save }) {
  const keys = useMemo(() => Object.keys(brand.PACKAGE), [brand.PACKAGE]);
  const [section, setSection] = useState<string>('kit');
  useEffect(() => setSection('kit'), [brand]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  // The kit is rebuilt whenever the package changes (files added in Assets, review decisions).
  const kit = useMemo(() => buildKit(brand), [brand, brand.PACKAGE]); // eslint-disable-line react-hooks/exhaustive-deps
  const [peek, setPeek] = useState('BRAND.md');
  const download = async () => {
    setBusy(true); setNote('');
    try { await save(`${kitName(brand)}.zip`, await E.zipFiles(kit)); }
    catch { setNote('The kit could not be built in this browser.'); }
    finally { setBusy(false); }
  };
  const data = section === 'all' ? brand.PACKAGE : section === 'tools' || section === 'kit' ? null : (brand.PACKAGE as any)[section];
  const json = useMemo(() => (data ? JSON.stringify(data, null, 2) : ''), [data]);
  const callText = `render_asset(${JSON.stringify(call, null, 2)})`;
  const signature = section === 'all' ? `get_brand("${brand.id}")` : `get_brand("${brand.id}", "${section}")`;
  const size = (v: unknown) => { const n = JSON.stringify(v ?? null).length; return n > 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`; };
  const rail = (
    <>
      <div className="pb-railblock">
        <RailHead>Package</RailHead>
        <ul className="pb-raillist">
          <RailItem current={section === 'all'} meta={size(brand.PACKAGE)} onClick={() => setSection('all')}>{brand.id}.json</RailItem>
          {keys.map((k) => <RailItem key={k} current={section === k} meta={Array.isArray((brand.PACKAGE as any)[k]) ? (brand.PACKAGE as any)[k].length : undefined} onClick={() => setSection(k)}>{SECTION_NAME[k] ?? k}</RailItem>)}
        </ul>
      </div>
      <div className="pb-railblock"><RailHead>Export</RailHead><ul className="pb-raillist"><RailItem current={section === 'kit'} meta={kit.length} onClick={() => setSection('kit')}>Brand kit</RailItem></ul></div>
      <div className="pb-railblock"><RailHead>Connector</RailHead><ul className="pb-raillist"><RailItem current={section === 'tools'} meta={TOOLS.length} onClick={() => setSection('tools')}>Tools</RailItem></ul></div>
    </>
  );
  const sizeOfFile = (f: KitFile) => (f.text !== undefined ? f.text.length : f.uri ? Math.round(f.uri.length * 0.75) : 0);
  const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n > 0 ? `${Math.max(1, Math.round(n / 1024))} KB` : '');
  const folders = kit.reduce<Record<string, KitFile[]>>((acc, f) => { const rel = f.name.split('/').slice(1); const dir = rel.length > 1 ? rel[0] + '/' : ''; (acc[dir] ??= []).push(f); return acc; }, {});
  const peekFile = kit.find((f) => f.name.endsWith('/' + peek));
  const pkg: any = brand.PACKAGE;
  const open = pkg.flags.filter((f: any) => f.status === 'open').length;
  const fontsNote: string[] = JSON.parse(kit.find((f) => f.name.endsWith('/brand.json'))?.text ?? '{}').kit?.fonts ?? [];
  const kitPage = (
    <div className="pb-page">
      <header className="pb-pagehead">
        <h1>Brand kit</h1>
        <p>Everything an AI agent needs to make on-brand work outside this tool, in one folder that is also a Claude skill: the guideline as rules, design tokens, CSS, the brand's files, every layout with its limits, a renderer that draws them with this engine, a film renderer and scorer for directed motion work, and a checker. It is built from what is here now, including files added in Assets.</p>
      </header>
      <div className="pb-kit-actions">
        <Btn variant="primary" icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy} onClick={download}>{busy ? 'Building' : `Download ${kitName(brand)}.zip`}</Btn>
        {note ? <span className="pb-quiet" role="alert">{note}</span> : null}
      </div>
      <ul className="pb-kit-status">
        {fontsNote.map((n) => <li key={n}>{n}</li>)}
        <li>{open ? `${open} review item${open === 1 ? ' is' : 's are'} still open. The kit lists ${open === 1 ? 'it' : 'them'} as open questions, so an agent knows what is not settled.` : 'Every review item is resolved.'}</li>
      </ul>
      <h2 className="pb-insplabel">In the kit</h2>
      <ul className="pb-kit-tree">
        {Object.entries(folders).map(([dir, fs]) => (
          dir === '' ? fs.map((f) => { const n = f.name.split('/').pop()!; return (
            <li key={f.name}><button type="button" className="pb-kit-file" aria-pressed={peek === n} disabled={f.text === undefined || n === 'render.html'} onClick={() => setPeek(n)}><span>{n}</span><span className="pb-count">{kb(sizeOfFile(f))}</span></button></li>
          ); }) : <li key={dir} className="pb-kit-dir"><span>{dir}</span><span className="pb-count">{fs.length} file{fs.length === 1 ? '' : 's'} · {kb(fs.reduce((n, f) => n + sizeOfFile(f), 0))}</span></li>
        ))}
      </ul>
      {peekFile?.text !== undefined ? (
        <>
          <div className="pb-codehead"><h2>{peek}</h2><CopyButton icon={<Copy {...ICON} />} text={() => peekFile.text ?? ''}>Copy</CopyButton></div>
          <pre className="pb-code pb-kit-peek" tabIndex={0} aria-label={peek}>{peekFile.text}</pre>
        </>
      ) : null}
    </div>
  );
  const main = section === 'kit' ? kitPage : section === 'tools' ? (
    <div className="pb-page">
      <header className="pb-pagehead"><h1>Connector tools</h1><p>An agent connected to this tool would read the same package through these calls.</p></header>
      <ul className="pb-tools">{TOOLS.map(([sig, about]) => <li key={sig}><code>{sig}</code><p>{about}</p></li>)}</ul>
      <div className="pb-codehead"><h2>The open asset as a call</h2><CopyButton icon={<Copy {...ICON} />} text={() => callText}>Copy</CopyButton></div>
      <pre className="pb-code" tabIndex={0}>{callText}</pre>
    </div>
  ) : (
    <div className="pb-page pb-page--code">
      <div className="pb-codehead pb-codehead--sticky">
        <code className="pb-call">{signature}</code>
        <span className="pb-count">{size(data)}</span>
        <CopyButton icon={<Copy {...ICON} />} text={() => json}>Copy JSON</CopyButton>
      </div>
      <pre className="pb-code pb-code--full" tabIndex={0} aria-label={`${SECTION_NAME[section] ?? section} as JSON`}>{json}</pre>
    </div>
  );
  const actions = <Btn variant="primary" icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy} onClick={download}>{busy ? 'Building' : 'Brand kit'}</Btn>;
  return frame({ actions, rail, railLabel: 'Package sections', main, mainLabel: 'What an agent reads', kind: 'doc' });
}

