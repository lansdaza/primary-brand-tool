// Primary brand tool, built on Zach Tool UI 1.0.0 (the saved Graphical theme, its Button/Input/Menu
// components and one inline ZachDialRoot). Layout: the main nav down the left (open on reading screens,
// folded to icons on working screens), a top bar with the project switcher and the screen's actions, then
// up to three panels: the screen's own contents, the canvas or page, and properties. Every brand is a record in the
// engine's registry; the views draw whichever record is open. Brand surfaces (class "a") keep each
// client's own colours and type.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { BookOpen, Braces, CircleCheck, Compass, FileText, FolderOpen, ImageIcon, PanelLeft, Pin, PinOff, Presentation, Shapes, Upload, X, type LucideIcon } from 'lucide-react';
import { GraphicalProvider, theme, type ColorMode } from './components/zach-ui/graphical';
import * as E from './engine/index.js';
import { pbPubView as PublishView } from './publish';
import { Btn, ICON, MenuButton, MenuItem, MenuSeparator, ThemeToggle, VIEWS, viewsOf, initTheme, openCount, useDropdownEscape, useFitCopyFields, type Ask, type Brand, type Params, type Route, type ViewId } from './ui';
import { DeckScreen, useDecks } from './decks';
import { GuidelineView } from './guide';
import { ToolsView, useRails } from './tools';
import { SetScreen, useRecipes, useRole } from './recipes';
import { AssetsView, useBrandFiles } from './assets';
import { MachineView, MakeRail, MakeScreen, ProjectsView, ReviewView } from './views';
import { KickoffView } from './kickoff';
import { BriefView, STAGE_NAME, useProjects, type Project, type ProjectStore } from './projects';

type Saver = { save: (o: { filename: string; data: Blob | string }) => Promise<unknown> };
type Preview = { url: string; kind: 'image' | 'video' | 'file'; name: string } | null;
export type FrameProps = { actions?: ReactNode; rail?: ReactNode; railLabel?: string; inspector?: ReactNode; inspectorLabel?: string; main: ReactNode; mainLabel: string; kind: 'canvas' | 'doc' };
export type Frame = (p: FrameProps) => ReactNode;

initTheme();

/* ---------- Host state ---------- */

function useColorMode(): ColorMode {
  const read = (): ColorMode => {
    const set = document.documentElement.dataset.theme;
    if (set === 'dark' || set === 'light') return set;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  const [mode, setMode] = useState<ColorMode>(read);
  useEffect(() => {
    const update = () => setMode(read());
    const query = matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      query.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);
  return mode;
}

// Routes are plain hashes: "projects", "<project>-<view>", or "<project>-<view>-<chapter>".
// A project with a brand system has the brand's id; one still at intake has only its Brief.
const WITH_CHAPTER: ViewId[] = ['guideline', 'tools', 'assets', 'brief', 'kickoff'];
function readRoute(): Route {
  const [id, view, ...rest] = location.hash.slice(1).split('-');
  const chapter = rest.join('-') || undefined;
  if (!id || id === 'projects' || !/^[a-z0-9]{1,30}$/.test(id)) return { brand: null, view: 'guideline' };
  const b = E.BY[id];
  const known: ViewId = viewsOf(b).find((v) => v.id === view)?.id ?? (b ? 'guideline' : 'brief');
  return { brand: id, view: known, chapter: WITH_CHAPTER.includes(known) ? chapter : undefined };
}
function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => {
    const update = () => setRoute(readRoute());
    addEventListener('hashchange', update);
    return () => removeEventListener('hashchange', update);
  }, []);
  return [route, (r) => {
    location.hash = r.brand ? `${r.brand}-${r.view}${WITH_CHAPTER.includes(r.view) && r.chapter ? `-${r.chapter}` : ''}` : 'projects';
    setRoute(r);
    document.getElementById('pb-main')?.scrollTo(0, 0);
    scrollTo(0, 0);
  }];
}

/* ---------- Top bar ---------- */

const Dots = ({ b }: { b: Brand }) => (
  <span className="pb-dots" aria-hidden="true">{b.card.strip.filter((_: string, i: number, a: string[]) => i % Math.ceil(a.length / 4) === 0).slice(0, 4).map((hex: string) => <i key={hex} style={{ background: hex }} />)}</span>
);

// Reading screens keep the nav open; working screens fold it to icons so the canvas keeps its room.
const WORKING: ViewId[] = ['make', 'decks', 'tools', 'assets', 'machine'];
const NAV_ICON: Record<ViewId, LucideIcon> = { brief: FileText, kickoff: Compass, guideline: BookOpen, assets: FolderOpen, make: ImageIcon, decks: Presentation, tools: Shapes, review: CircleCheck, machine: Braces, publish: Upload };
const PROJECT_VIEWS: ViewId[] = ['brief', 'kickoff'];

function SideNav({ route, go, project, brand, resolved, folded, pinned, setPinned, sheet, closeSheet, rest, setRest }: { route: Route; go: (r: Route) => void; project: Project; brand: Brand | null; resolved: Set<string>; folded: boolean; pinned: boolean; setPinned: (on: boolean) => void; sheet: boolean; closeSheet: () => void; rest: boolean; setRest: (on: boolean) => void }) {
  const views = viewsOf(brand);
  // After choosing a screen from the slid-out nav it folds away, so it never covers what you reached for;
  // it slides out again once the pointer has left it and come back. (Kept by the app, since each screen
  // draws its own frame.)
  const choose = (e: React.MouseEvent<HTMLButtonElement>, r: Route) => { if (e.detail > 0) { setRest(true); e.currentTarget.blur(); } go(r); closeSheet(); };
  const item = (id: ViewId, name: string) => {
    const Icon = NAV_ICON[id];
    const n = id === 'review' && brand ? openCount(brand, resolved) : 0;
    return (
      <li key={id}>
        <button type="button" className="pb-navitem" aria-current={route.view === id ? 'page' : undefined} title={folded ? name : undefined} onClick={(e) => choose(e, { brand: project.id, view: id })}>
          <Icon {...ICON} /><span className="pb-navlabel">{name}</span>{n ? <span className="pb-badge" aria-label={`${n} open`}>{n}</span> : null}
        </button>
      </li>
    );
  };
  const projectViews = views.filter((v) => PROJECT_VIEWS.includes(v.id));
  const brandViews = views.filter((v) => !PROJECT_VIEWS.includes(v.id));
  return (
    <nav className="pb-nav" aria-label="Main" data-folded={folded || undefined} data-rest={rest || undefined} data-sheet={sheet || undefined}>
      <div className="pb-nav-inner">
        <div className="pb-navhead">
          <button type="button" className="pb-navhome" onClick={(e) => choose(e, { brand: null, view: 'guideline' })} title={folded ? 'All projects' : undefined}>
            <span className="pb-mark" aria-hidden="true">P</span><span className="pb-navlabel">Primary</span>
          </button>
        </div>
        <p className="pb-navgroup"><span className="pb-navlabel">Project</span></p>
        <ul className="pb-navlist">{projectViews.map((v) => item(v.id, v.name))}</ul>
        {brandViews.length ? (
          <>
            <p className="pb-navgroup"><span className="pb-navlabel">Brand system</span></p>
            <ul className="pb-navlist">{brandViews.map((v) => item(v.id, v.name))}</ul>
          </>
        ) : null}
        <div className="pb-navfoot">
          <button type="button" className="pb-navitem pb-navpin" aria-pressed={pinned} title={folded ? 'Keep the menu open' : undefined} onClick={() => setPinned(!pinned)}>
            {pinned ? <PinOff {...ICON} /> : <Pin {...ICON} />}<span className="pb-navlabel">{pinned ? 'Fold on work screens' : 'Keep open'}</span>
          </button>
        </div>
      </div>
      {sheet ? <button type="button" className="pb-navscrim" aria-label="Close menu" onClick={closeSheet} /> : null}
    </nav>
  );
}

function TopBar({ route, go, project, brand, projects, mode, actions, openSheet }: { route: Route; go: (r: Route) => void; project?: Project; brand: Brand | null; projects: ProjectStore; mode: ColorMode; actions?: ReactNode; openSheet: () => void }) {
  const open = (p: Project) => {
    const b = p.brand ? E.BY[p.brand] : null;
    go({ brand: p.id, view: route.brand && viewsOf(b).some((v) => v.id === route.view) ? route.view : b ? 'guideline' : 'brief' });
  };
  return (
    <header className="pb-top">
      <div className="pb-top-start">
        {project ? <Btn className="pb-navopen" icon={<PanelLeft {...ICON} />} label="Menu" onClick={openSheet} /> : (
          <>
            <button type="button" className="pb-home" onClick={() => go({ brand: null, view: 'guideline' })} aria-current="page">
              <span className="pb-mark" aria-hidden="true">P</span>
              <span className="pb-home-name">Primary</span>
            </button>
            <span className="pb-slash" aria-hidden="true">/</span>
          </>
        )}
        <MenuButton className="pb-brandpick" label="Switch project" trigger={project ? <>{brand ? <Dots b={brand} /> : <span className="pb-dots pb-dots--none" aria-hidden="true" />}<span>{project.name}</span></> : <span>All projects</span>}>
          {projects.list.map((p) => {
            const b = p.brand ? E.BY[p.brand] : null;
            return (
              <MenuItem key={p.id} current={project?.id === p.id} hint={b ? b.source.kind : STAGE_NAME[p.stage]} onClick={() => open(p)}>
                {b ? <Dots b={b} /> : <span className="pb-dots pb-dots--none" aria-hidden="true" />}{p.name}
              </MenuItem>
            );
          })}
          <MenuSeparator />
          <MenuItem current={!project} onClick={() => go({ brand: null, view: 'guideline' })}>All projects</MenuItem>
        </MenuButton>
      </div>
      <div className="pb-top-end">
        {actions ? <div className="pb-top-actions" role="group" aria-label="Actions">{actions}</div> : null}
        <ThemeToggle mode={mode} />
      </div>
    </header>
  );
}

/* ---------- App ---------- */

export function App() {
  const mode = useColorMode();
  useFitCopyFields();
  useDropdownEscape();
  const [route, go] = useRoute();
  const projects = useProjects();
  const project = route.brand ? projects.get(route.brand) : undefined;
  const brand: Brand | null = project?.brand ? E.BY[project.brand] : null;
  const [tpls, setTpls] = useState<Record<string, string>>(() => Object.fromEntries(E.BRANDS.map((b: Brand) => [b.id, b.T[0].id])));
  const [calls, setCalls] = useState<Record<string, object>>({});
  const [saver, setSaver] = useState<Saver | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [preview, setPreview] = useState<Preview>(null);
  const pending = useRef<{ tpl: string; params: Params } | null>(null);
  // A deck and slide to open next time Decks opens (after a tool adds a slide).
  const deckFocus = useRef<{ deck: string; slide: string | null } | null>(null);
  // The draft note outlives a layout switch, since a draft can choose a different layout.
  const [message, setMessage] = useState('');
  const store = useDecks();
  const rails = useRails();
  const recipes = useRecipes(), role = useRole();
  const files = useBrandFiles();
  // A review item is resolved when a person accepted it, or when the files it asks for are in Assets.
  const resolved = useMemo(() => new Set<string>(E.BRANDS.flatMap((b: Brand) => b.BRAND.flags.filter((f: any) => E.flagStatus(b, f).state !== 'open').map((f: any) => `${b.id}:${f.id}`))), [files.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pinned, setPinnedState] = useState(() => { try { return localStorage.getItem('primary-nav-pinned') === '1'; } catch { return false; } });
  const setPinned = (on: boolean) => { setPinnedState(on); try { localStorage.setItem('primary-nav-pinned', on ? '1' : '0'); } catch { /* remembered for this visit only */ } };
  const [sheet, setSheet] = useState(false);
  const [navRest, setNavRest] = useState(false);
  // The folded nav rests after a choice until the pointer has moved off it.
  useEffect(() => {
    if (!navRest) return;
    const off = (e: PointerEvent) => { const nav = document.querySelector('.pb-nav'); if (nav && e.clientX > nav.getBoundingClientRect().right + 4) setNavRest(false); };
    addEventListener('pointermove', off);
    return () => removeEventListener('pointermove', off);
  }, [navRest]);
  const [machine, setMachineState] = useState(() => { try { return localStorage.getItem('primary-brand-machine') === '1'; } catch { return false; } });
  const setMachine = (on: boolean) => { setMachineState(on); try { localStorage.setItem('primary-brand-machine', on ? '1' : '0'); } catch { /* remembered for this visit only */ } };

  useEffect(() => {
    const claude = (window as any).claude;
    claude?.use?.('downloads').then((d: Saver | null) => setSaver(d ?? null));
    claude?.use?.('sample').then((s: Ask | null) => setAsk(() => s ?? null));
  }, []);
  // Rescan live globes whenever the view changes, so a globe that left the screen stops drawing.
  useEffect(() => { E.mountWG(); setMessage(''); setSheet(false); }, [route.brand, route.view]);

  const save = useCallback(async (filename: string, data: Blob) => {
    if (saver) {
      try { await saver.save({ filename, data }); return; }
      catch (error: any) { if (error?.code === 'declined') return; }
    }
    setPreview({ url: URL.createObjectURL(data), kind: data.type.startsWith('video') ? 'video' : data.type.startsWith('image') ? 'image' : 'file', name: filename });
  }, [saver]);
  const closePreview = () => { if (preview) URL.revokeObjectURL(preview.url); setPreview(null); };
  const onCall = useCallback((c: any) => setCalls((prev) => ({ ...prev, [c.brand]: c })), []);
  const setTpl = (id: string) => brand && setTpls((prev) => ({ ...prev, [brand.id]: id }));
  const toggle = (id: string) => { const [b, f] = id.split(':'); const B = E.BY[b]; if (B && E.flagStatus(B, B.BRAND.flags.find((x: any) => x.id === f)).state !== 'auto') files.toggle(B, f); };
  const deckCounts = useMemo(() => Object.values(store.decks).reduce<Record<string, number>>((n, d) => ({ ...n, [d.brand]: (n[d.brand] ?? 0) + 1 }), {}), [store.decks]);

  const tpl = brand ? tpls[brand.id] : '';
  // A set (saved, or one suggested for the brand) opens in Make in place of a layout.
  const isSet = /^(set|idea):/.test(tpl);
  const layoutTpl = brand ? (brand.TBY[tpl] ? tpl : brand.T[0].id) : '';
  const call = brand ? calls[brand.id] ?? { brand: brand.id, template: layoutTpl, params: E.defaults(brand.TBY[layoutTpl]), output: 'png' } : {};

  // Below 1200px wide the nav folds on every screen, so the page keeps its room.
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 75rem)').matches);
  useEffect(() => { const q = matchMedia('(max-width: 75rem)'); const f = () => setNarrow(q.matches); q.addEventListener('change', f); return () => q.removeEventListener('change', f); }, []);
  const folded = !!project && (WORKING.includes(route.view) || narrow) && !pinned;
  const frame: Frame = ({ actions, rail, railLabel, inspector, inspectorLabel, main, mainLabel, kind }) => (
    <div className="pb-app" data-view={project ? route.view : 'projects'} data-nav={project ? (folded ? 'folded' : 'open') : undefined}>
      <a className="pb-skip" href="#pb-main">Skip to content</a>
      {project ? <SideNav route={route} go={go} project={project} brand={brand} resolved={resolved} folded={folded} pinned={pinned} setPinned={setPinned} sheet={sheet} closeSheet={() => setSheet(false)} rest={navRest} setRest={setNavRest} /> : null}
      <div className="pb-shell">
        <TopBar route={route} go={go} project={project} brand={brand} projects={projects} mode={mode} actions={actions} openSheet={() => setSheet(true)} />
        <div className="pb-body" data-rail={!!rail} data-inspector={!!inspector}>
          {rail ? <nav key={`${project?.id}:${route.view}`} className="pb-panel pb-rail" aria-label={railLabel}>{rail}</nav> : null}
          <main id="pb-main" className="pb-panel pb-main" data-kind={kind} aria-label={mainLabel} tabIndex={-1}>{main}</main>
          {inspector ? <aside className="pb-panel pb-insp" aria-label={inspectorLabel}>{inspector}</aside> : null}
        </div>
      </div>
    </div>
  );

  let screen: ReactNode;
  if (route.brand && !project && !projects.ready) screen = frame({ main: <div className="pb-empty" role="status"><span className="pb-spin" aria-hidden="true" /></div>, mainLabel: 'Loading', kind: 'doc' });
  else if (!project) screen = <ProjectsView go={go} resolved={resolved} frame={frame} deckCounts={deckCounts} projects={projects} />;
  else if (route.view === 'kickoff') screen = (
    <KickoffView key={project.id} project={project} store={projects} frame={frame} ask={ask} part={route.chapter}
      goPart={(part) => go({ brand: project.id, view: 'kickoff', chapter: part })}
      goBrief={(q, part) => go({ brand: project.id, view: 'brief', chapter: q ? `form-${q}` : part })} />
  );
  else if (route.view === 'brief' || !brand) screen = (
    <BriefView key={project.id} project={project} brand={brand} store={projects} frame={frame} ask={ask} part={route.chapter}
      goPart={(part) => go({ brand: project.id, view: 'brief', chapter: part })} />
  );
  else if (route.view === 'make' && isSet) screen = (
    <SetScreen key={`${brand.id}:${tpl}`} brand={brand} id={tpl} store={recipes} role={role} frame={frame} save={save} setTpl={setTpl}
      rail={<MakeRail brand={brand} current={tpl} setTpl={setTpl} recipes={recipes} role={role} />}
      openLayout={(id, params) => { pending.current = { tpl: id, params }; setTpl(id); }} />
  );
  else if (route.view === 'make') screen = (
    <MakeScreen key={`${brand.id}:${layoutTpl}`} brand={brand} tpl={layoutTpl} setTpl={setTpl} frame={frame} pending={pending} onCall={onCall} save={save} ask={ask} message={message} setMessage={setMessage} recipes={recipes} role={role}
      onDraft={(id, params) => { pending.current = { tpl: id, params }; setTpl(id); }} />
  );
  else if (route.view === 'decks') screen = <DeckScreen key={brand.id} brand={brand} store={store} frame={frame} save={save} ask={ask} focus={deckFocus} />;
  else if (route.view === 'tools') screen = (
    <ToolsView key={brand.id} brand={brand} tool={route.chapter} frame={frame} save={save} store={rails} ask={ask} files={files} decks={store} recipes={recipes} role={role}
      goTool={(id) => go({ brand: brand.id, view: 'tools', chapter: id })} goMake={(id, params) => { if (params) pending.current = { tpl: id, params }; setTpl(id); go({ brand: brand.id, view: 'make' }); }}
      goDeck={(deck, slide) => { deckFocus.current = { deck, slide }; go({ brand: brand.id, view: 'decks' }); }} />
  );
  else if (route.view === 'review') screen = <ReviewView key={brand.id} brand={brand} resolved={resolved} toggle={toggle} frame={frame} files={files} goAssets={(slot) => go({ brand: brand.id, view: 'assets', chapter: slot })} />;
  else if (route.view === 'assets') screen = <AssetsView key={brand.id} brand={brand} store={files} frame={frame} focus={route.chapter} goReview={() => go({ brand: brand.id, view: 'review' })} />;
  else if (route.view === 'publish') screen = <PublishView key={brand.id} brand={brand} frame={frame} save={save} ver={files.version} />;
  else if (route.view === 'machine') screen = <MachineView key={brand.id} brand={brand} call={call} frame={frame} save={save} />;
  else screen = (
    <GuidelineView key={brand.id} brand={brand} chapter={route.chapter} machine={machine} setMachine={setMachine} save={save} frame={frame}
      goChapter={(id) => go({ brand: brand.id, view: 'guideline', chapter: id })} goDecks={() => go({ brand: brand.id, view: 'decks' })} goTool={(id) => go({ brand: brand.id, view: 'tools', chapter: id })} goMake={(id) => { setTpl(id); go({ brand: brand.id, view: 'make' }); }} />
  );

  return (
    <MotionConfig reducedMotion="user">
      <GraphicalProvider document={theme} colorMode={mode}>
        {screen}
        {preview ? (
          <div className="pb-overlay" role="dialog" aria-modal="true" aria-label="Rendered file" onClick={(e) => { if (e.target === e.currentTarget) closePreview(); }} onKeyDown={(e) => { if (e.key === 'Escape') closePreview(); }}>
            <div className="pb-overlay-card">
              <div className="pb-overlay-head"><span>{preview.name}</span><Btn icon={<X {...ICON} />} label="Close" onClick={closePreview} autoFocus /></div>
              {preview.kind === 'video' ? <video src={preview.url} controls autoPlay loop muted /> : preview.kind === 'image' ? <img src={preview.url} alt="Rendered asset" /> : <a className="pb-overlay-file" href={preview.url} download={preview.name}>{preview.name}</a>}
              <p className="pb-quiet">{preview.kind === 'file' ? 'Select the file name to save it.' : 'Right-click or press and hold to save it.'}</p>
            </div>
          </div>
        ) : null}
      </GraphicalProvider>
    </MotionConfig>
  );
}

