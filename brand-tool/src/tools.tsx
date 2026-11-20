// Tools: interactive tools built for one brand, living inside that brand. Aurelius has its World Graph
// (rails between places, landmark city close-ups) and the World Graph's particle studio. The tools are the
// original tool's own code; this file is the frame around them, in the brand tool's UI, with the brand's tones.
// Rails made here are brand data: every World Graph layout in Make and Decks, and the agent package, draws them.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DialConfig } from 'dialkit';
import { ArrowLeft, ArrowUpRight, Download, Globe2, Image as ImageIcon, ImagePlus, Layers, MapPin, Paintbrush, Plus, RotateCcw, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import { ZachDialRoot } from './components/zach-ui/ZachDialRoot';
import * as E from './engine/index.js';
import * as W from './engine/tools.js';
import { Btn, CopyPanel, ICON, type Ask, MenuButton, MenuItem, RailHead, RailItem, useDialKitController, type Brand, type Params, type Save, type Tpl } from './ui';
import type { Frame } from './App';
import type { DeckStore, StoreMode } from './decks';
import type { BrandFiles } from './assets';
import { ImageryTool } from './imagery';
import { GlassTool } from './glass';
import { PainterlyTool } from './painterly';
import { BuildTool, type RecipeStore, type Role } from './recipes';

// The brand's built tools, for the rail on every tool screen.

type LatLng = { lat: number; lng: number };
type RailNode = LatLng & { name: string; place: string };
export type Rail = { id: string; name: string; type: string; a: RailNode; b: RailNode };
type City = { id: string; name: string; landmark: string; lat: number; lng: number };
type Place = { name: string; kind: string; parent?: string; lat: number; lng: number };
type Tool = { id: string; name: string; use: string; tones: string[]; tone: string };

/* ---------- Limits: what keeps the World Graph legible, whoever edits it ---------- */

export const RAIL_LIMIT = { rails: 24, name: 48, node: 16 };
const TOOL_ICON: Record<string, ReactNode> = { globe: <Globe2 {...ICON} />, particles: <Sparkles {...ICON} />, imagery: <ImageIcon {...ICON} />, glass: <Layers {...ICON} />, painterly: <Paintbrush {...ICON} /> };
const km = (r: Rail) => Math.round(W.distanceKm(r.a, r.b));
const fmt = (n: number) => n.toLocaleString('en-US');

function readNode(v: any): RailNode | null {
  if (!v || !Number.isFinite(+v.lat) || !Number.isFinite(+v.lng)) return null;
  return { lat: Math.max(-90, Math.min(90, +v.lat)), lng: Math.max(-180, Math.min(180, +v.lng)), name: String(v.name ?? '').slice(0, RAIL_LIMIT.node), place: String(v.place ?? '').slice(0, 60) };
}
function readRails(v: any): Rail[] | null {
  if (!Array.isArray(v)) return null;
  const out: Rail[] = [];
  for (const r of v.slice(0, RAIL_LIMIT.rails)) {
    const a = readNode(r?.a), b = readNode(r?.b);
    if (!a || !b) continue;
    out.push({ id: String(r.id ?? E.uid()), name: String(r.name ?? '').slice(0, RAIL_LIMIT.name), type: W.FLOW_TYPES.includes(r.type) ? r.type : W.FLOW_TYPES[0], a, b });
  }
  return out;
}

/* ---------- Rails store: the page's shared store when there is one, this browser otherwise ---------- */

export type RailStore = { rails: Rail[]; mode: StoreMode; saving: boolean; problem: string; edited: boolean; set: (fn: (r: Rail[]) => Rail[]) => void; reset: () => void };
const RAILS_DOC = 'aurelius-rails', LOCAL_RAILS = 'primary-brand-rails-aurelius';

export function useRails(): RailStore {
  const [rails, setRailsState] = useState<Rail[]>(() => W.seedRails());
  const [edited, setEdited] = useState(false);
  const [mode, setModeState] = useState<StoreMode>('loading');
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState('');
  const db = useRef<any>(null), modeRef = useRef<StoreMode>('loading'), latest = useRef<Rail[] | null>(null), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), pendingWrite = useRef(false);
  const setMode = (m: StoreMode) => { modeRef.current = m; setModeState(m); };
  const show = useCallback((next: Rail[] | null) => {
    latest.current = next;
    setEdited(!!next);
    setRailsState(next ?? W.seedRails());
  }, []);

  useEffect(() => {
    let off: (() => void) | undefined, dead = false;
    (async () => {
      const claude = (window as any).claude;
      let store: any = null;
      try { store = await claude?.use?.('db'); } catch { store = null; }
      if (dead) return;
      if (!store) {
        setMode('local');
        try { show(readRails(JSON.parse(localStorage.getItem(LOCAL_RAILS) || 'null'))); } catch { /* nothing saved */ }
        return;
      }
      db.current = store;
      let can: boolean | null = null;
      try { can = await (await claude.use('user'))?.can?.('data.write'); } catch { can = null; }
      if (dead) return;
      setMode(can === false ? 'readonly' : 'shared');
      off = store.collection('tools').onSnapshot((snap: any) => {
        if (pendingWrite.current) return; // this view's own edit is newer than what the store has
        const doc = snap.docs.find((d: any) => d.id === RAILS_DOC);
        show(doc ? readRails(doc.data()?.rails) : null);
      }, () => setMode('local'));
    })();
    return () => { dead = true; off?.(); };
  }, [show]);

  // Every World Graph in layouts, slides, video and the agent package draws these rails.
  useEffect(() => { E.setWorldRails(rails); }, [rails]);

  const write = useCallback(() => {
    clearTimeout(timer.current);
    pendingWrite.current = true;
    timer.current = setTimeout(async () => {
      const value = latest.current;
      if (modeRef.current === 'local' || !db.current) {
        try { value ? localStorage.setItem(LOCAL_RAILS, JSON.stringify(value)) : localStorage.removeItem(LOCAL_RAILS); } catch { /* kept for this visit only */ }
        pendingWrite.current = false;
        return;
      }
      if (modeRef.current !== 'shared') { pendingWrite.current = false; return; }
      setSaving(true);
      try {
        const ref = db.current.doc(`tools/${RAILS_DOC}`);
        if (value) await ref.set({ rails: value, updatedAt: Date.now() });
        else await ref.delete();
        setProblem('');
      } catch (error: any) {
        if (error?.code === 'invalid_argument' || error?.code === 'not_granted') setMode('readonly');
        else setProblem('Could not save the rails just now. They are kept on this page.');
      } finally { setSaving(false); pendingWrite.current = false; }
    }, 600);
  }, []);
  const set = useCallback((fn: (r: Rail[]) => Rail[]) => {
    if (modeRef.current === 'readonly') return;
    show(readRails(fn(latest.current ?? W.seedRails())) ?? []);
    write();
  }, [show, write]);
  const reset = useCallback(() => { if (modeRef.current === 'readonly') return; show(null); write(); }, [show, write]);
  return { rails, mode, saving, problem, edited, set, reset };
}

/* ---------- Shared pieces ---------- */

// A brand tone as the scene's palette: ground for the background, the tone's ink for land, specks and rails.
function paletteOf(brand: Brand, toneId: string) {
  const tone = brand.TONES[toneId] ?? brand.TONES[Object.keys(brand.TONES)[0]];
  const g: string = tone.g, i: string = tone.i;
  return {
    theme: (E.lum(g) < 0.4 ? 'dark' : 'light') as 'dark' | 'light',
    background: g,
    ink: i,
    palette: { bg: g, water: E.mix(g, i, 0.13), dot: E.mix(g, i, 0.72), speck: E.mix(g, i, 0.85), arc: i, dim: E.mix(g, i, 0.6), node: i },
  };
}
const toneOptions = (brand: Brand, tool: Tool) => tool.tones.filter((k) => brand.TONES[k]).map((k) => ({ value: k, label: brand.TONES[k].name }));

function ToolRail({ brand, tool, goTool, children }: { brand: Brand; tool: { id: string }; goTool: (id: string) => void; children?: ReactNode }) {
  const tools: Tool[] = (brand as any).tools ?? [];
  return (
    <>
      <div className="pb-railblock">
        <RailHead>Tools <span className="pb-count">{tools.length}</span></RailHead>
        <ul className="pb-raillist">
          {tools.map((x) => <RailItem key={x.id} current={x.id === tool.id} lead={TOOL_ICON[x.id]} onClick={() => goTool(x.id)}>{x.name}</RailItem>)}
          <RailItem current={tool.id === 'build'} lead={<Plus {...ICON} />} onClick={() => goTool('build')}>Build a tool</RailItem>
        </ul>
      </div>
      {children}
    </>
  );
}

// A set saved before sets moved into Make: an old link to it opens it there.
function OpenInMake({ go }: { go: () => void }) { useEffect(() => { go(); }, []); return null; } // eslint-disable-line react-hooks/exhaustive-deps

// Search a country, state or city. The list is the tool's own: no lookups leave the page.
function PlaceField({ label, value, onSelect, onClear, onSubmit, autoFocus }: { label: string; value?: string; onSelect: (p: Place) => void; onClear?: () => void; onSubmit?: () => void; autoFocus?: boolean }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState(0);
  const typing = editing || !value;
  const results: Place[] = typing ? W.searchPlaces(q, 7) : [];
  const id = `pb-place-${label.toLowerCase()}`;
  const choose = (p?: Place) => { if (!p) return; onSelect(p); setQ(''); setEditing(false); setActive(0); };
  return (
    <div className="pb-place">
      <label htmlFor={id} className="pb-place-label">{label}</label>
      <input
        id={id}
        className="pb-place-input"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        value={typing ? q : value}
        placeholder="Country, state or city"
        onFocus={() => value && setEditing(true)}
        onBlur={() => setEditing(false)}
        onChange={(e) => { setEditing(true); setQ(e.target.value); setActive(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); if (results.length) choose(results[active]); else onSubmit?.(); }
          else if (e.key === 'Escape' && q) { e.stopPropagation(); setQ(''); }
        }}
      />
      {value && onClear ? <Btn icon={<X {...ICON} size={14} />} label={`Clear ${label}`} onClick={onClear} /> : null}
      {results.length ? (
        <ul id={`${id}-list`} role="listbox" className="pb-place-list pb-menu">
          {results.map((p, i) => (
            <li key={`${p.kind}-${p.name}-${p.parent ?? ''}`} role="option" aria-selected={i === active} className="pb-menuitem" data-current={i === active ? 'true' : undefined}
              onMouseDown={(e) => { e.preventDefault(); choose(p); }} onMouseEnter={() => setActive(i)}>
              <span className="pb-menuitem-main">{W.placeLabel(p)}</span><span className="pb-menuitem-hint">{p.kind}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const dropdownOpen = () => !!document.querySelector('.dialkit-select-dropdown, .pb-menu-pos, .pb-place-list');

async function exportScene(save: Save, fmt: 'png' | 'svg', name: string, setNote: (s: string) => void) {
  try { await save(`aurelius-${W.slug(name)}.${fmt}`, await W.renderView(fmt)); }
  catch { setNote('The view could not be exported yet. Wait for it to finish drawing and try again.'); }
}

/* ---------- World Graph ---------- */

type Mode = 'idle' | 'pickA' | 'pickB';

function WorldGraph({ brand, tool, goTool, frame, save, store, goMake }: { brand: Brand; tool: Tool; goTool: (id: string) => void; frame: Frame; save: Save; store: RailStore; goMake: (id: string) => void }) {
  const config = useMemo(() => ({
    globe: {
      style: { type: 'select', options: [{ value: 'dots', label: 'Dots' }, { value: 'particles', label: 'Particles' }], default: 'dots' },
      tone: { type: 'select', options: toneOptions(brand, tool), default: tool.tone },
    },
  }) as unknown as DialConfig, [brand, tool]);
  const controller = useDialKitController('World Graph', config, { id: `primary-brand:${brand.id}:tool:globe`, persist: false });
  const v: any = controller.values;
  const globeStyle: 'dots' | 'particles' = v?.globe?.style === 'particles' ? 'particles' : 'dots';
  const look = paletteOf(brand, v?.globe?.tone ?? tool.tone);

  const { rails } = store;
  const locked = store.mode === 'readonly';
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [pending, setPending] = useState<RailNode | null>(null);
  const [dest, setDest] = useState<RailNode | null>(null);
  const [focus, setFocus] = useState<RailNode | null>(null);
  const [focusCity, setFocusCity] = useState<City | null>(null);
  const [cityView, setCityView] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [home, setHome] = useState(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'' | 'png' | 'svg'>('');
  const selected = rails.find((r) => r.id === selectedId) ?? null;
  const full = rails.length >= RAIL_LIMIT.rails;

  const stopPicking = () => { if (mode !== 'idle' && focus) { setFocus(null); setHome((n) => n + 1); } setMode('idle'); setPending(null); setDest(null); };
  const startPicking = () => { if (full || locked) return; setMode('pickA'); setSelectedId(null); setPending(null); setDest(null); setFocus(null); setFocusCity(null); setCityView(false); };
  const onNodeClick = (n: RailNode) => { setFocus(n); setFocusCity(W.cityNear(n) ?? null); };
  const selectCity = (c: City) => { stopPicking(); setSelectedId(null); setCityView(false); setFocus({ lat: c.lat, lng: c.lng, name: c.name, place: c.name }); setFocusCity(c); };
  const enterCity = () => { setCityLoading(true); setCityView(true); setFadeKey((k) => k + 1); };
  const exitCity = () => { setCityView(false); setCityLoading(false); setFadeKey((k) => k + 1); };
  const backToGlobe = () => { setCityView(false); setFocus(null); setFocusCity(null); setFadeKey((k) => k + 1); setHome((n) => n + 1); };
  const onPick = (p: LatLng, place: string) => {
    const node: RailNode = { ...p, place, name: '' };
    if (!pending) { setPending(node); setMode('pickB'); } else setDest(node);
  };
  const typed = (p: Place, slot: 'from' | 'to') => {
    const node: RailNode = { lat: p.lat, lng: p.lng, place: W.placeLabel(p), name: '' };
    setFocus({ ...node, name: p.name });
    setFocusCity(null);
    if (slot === 'from') { setPending(node); setMode('pickB'); } else setDest(node);
  };
  const create = () => {
    if (!pending || !dest || full) return;
    const rail = W.createRail(rails, pending, dest, E.uid());
    store.set((rs) => [...rs, rail]);
    setSelectedId(rail.id);
    setFocus(null);
    setFocusCity(null);
    stopPicking();
    setHome((n) => n + 1); // pull back so the whole new rail shows
  };
  const update = (id: string, patch: Partial<Rail>) => store.set((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  // A node can sit on several rails; renaming it renames it everywhere it appears.
  const renameNode = (n: RailNode, name: string) => store.set((rs) => rs.map((r) => ({ ...r, ...(['a', 'b'] as const).reduce((o, k) => (r[k].lat === n.lat && r[k].lng === n.lng ? { ...o, [k]: { ...r[k], name } } : o), {}) })));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || dropdownOpen() || e.defaultPrevented) return;
      if (mode !== 'idle') stopPicking();
      else if (cityView) exitCity();
      else if (focus) backToGlobe();
      else if (selectedId) setSelectedId(null);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const nodeCount = new Set(rails.flatMap((r) => [r.a, r.b].map((n) => `${n.lat.toFixed(2)},${n.lng.toFixed(2)}`))).size;
  const totalKm = rails.reduce((s, r) => s + km(r), 0);
  const live = brand.T.filter((t: Tpl) => t.live), liveSlides = brand.SL.filter((t: Tpl) => t.live);
  const sceneName = cityView && focusCity ? focusCity.landmark : `world-graph-${new Date().toISOString().slice(0, 10)}`;
  const doExport = async (f: 'png' | 'svg') => { setBusy(f); setNote(''); await exportScene(save, f, sceneName, setNote); setBusy(''); };

  const rail = (
    <ToolRail brand={brand} tool={tool} goTool={goTool}>
      <div className="pb-railblock">
        <RailHead action={<Btn icon={<Plus {...ICON} />} label={full ? `This graph holds ${RAIL_LIMIT.rails} rails at most` : 'New connection'} disabled={full || locked} onClick={startPicking} />}>
          Rails <span className="pb-count">{rails.length}</span>
        </RailHead>
        <ul className="pb-raillist pb-raillist--rails">
          {rails.map((r) => (
            <RailItem key={r.id} current={r.id === selectedId} meta={`${fmt(km(r))} km`} lead={<span className="pb-raildot" data-type={r.type} aria-hidden="true" />}
              onClick={() => { stopPicking(); setCityView(false); if (focus) { setFocus(null); setFocusCity(null); setHome((n) => n + 1); } setSelectedId(r.id === selectedId ? null : r.id); }}>
              {r.name || `${r.a.place} – ${r.b.place}`}
            </RailItem>
          ))}
        </ul>
      </div>
      <div className="pb-railblock pb-railblock--fill">
        <RailHead>Landmark cities <span className="pb-count">{W.CITIES.length}</span></RailHead>
        <ul className="pb-raillist">
          {W.CITIES.map((c: City) => <RailItem key={c.id} current={focusCity?.id === c.id} lead={<MapPin {...ICON} size={14} />} onClick={() => selectCity(c)}>{c.name}</RailItem>)}
        </ul>
      </div>
      <p className="pb-railnote pb-railfoot" role="status">
        {store.mode === 'loading' ? 'Loading rails…' : store.mode === 'readonly' ? 'View only: you can look, but not change the rails.' : store.problem || (store.saving ? 'Saving…' : store.mode === 'shared' ? 'Rails are shared with everyone on this page.' : 'Rails are kept in this browser.')}
      </p>
    </ToolRail>
  );

  const railCopy = selected ? {
    id: 'rail', name: 'Rail',
    params: { name: { type: 'text', label: 'Name', max: RAIL_LIMIT.name }, from: { type: 'text', label: `From node · ${selected.a.place}`, max: RAIL_LIMIT.node }, to: { type: 'text', label: `To node · ${selected.b.place}`, max: RAIL_LIMIT.node } },
  } as unknown as Tpl : null;

  const inspector = (
    <>
      <div className="pb-insphead">
        <div><h2>{tool.name}</h2><p>{brand.name} tool · from p.20</p></div>
        <Btn icon={<RotateCcw {...ICON} />} label="Reset the look" onClick={() => controller.resetValues()} />
      </div>
      {selected && railCopy ? (
        <>
          <CopyPanel t={railCopy} title="Rail" value={{ name: selected.name, from: selected.a.name, to: selected.b.name } as Params}
            onChange={(k, val) => (locked ? null : k === 'name' ? update(selected.id, { name: val }) : renameNode(k === 'from' ? selected.a : selected.b, val))} />
          <div className="pb-inspblock pb-inspblock--tight">
            <span className="pb-insplabel">Flow</span>
            <MenuButton className="pb-deckpick" label="Flow type" trigger={<span className="pb-layoutpick-name">{selected.type}</span>}>
              {W.FLOW_TYPES.map((f: string) => <MenuItem key={f} current={f === selected.type} onClick={() => update(selected.id, { type: f })}>{f}</MenuItem>)}
            </MenuButton>
            <p className="pb-quiet">{selected.a.place} → {selected.b.place} · {fmt(km(selected))} km</p>
            <div className="pb-rowbtns">
              <Btn icon={<X {...ICON} />} onClick={() => setSelectedId(null)}>Deselect</Btn>
              <Btn icon={<Trash2 {...ICON} />} disabled={locked} onClick={() => { store.set((rs) => rs.filter((x) => x.id !== selected.id)); setSelectedId(null); }}>Delete rail</Btn>
            </div>
          </div>
        </>
      ) : null}
      <div className="pb-dials"><ZachDialRoot /></div>
      <div className="pb-inspblock">
        <h3 className="pb-insplabel">Drawn in</h3>
        <p className="pb-quiet">These rails are brand data. These layouts draw them{liveSlides.length ? `, as do ${liveSlides.length} slide layouts in Decks` : ''}, and the agent package lists them.</p>
        <ul className="pb-uselist">
          {live.map((t: Tpl) => <li key={t.id}><button type="button" className="pb-railitem" onClick={() => goMake(t.id)}><span className="pb-railitem-main">{t.name}</span><ArrowUpRight {...ICON} size={14} /></button></li>)}
        </ul>
        {store.edited ? <Btn icon={<RotateCcw {...ICON} />} disabled={locked} onClick={() => { store.reset(); setSelectedId(null); }}>Back to the sample rails</Btn> : null}
      </div>
    </>
  );

  const actions = (
    <>
      <Btn variant="secondary" icon={busy === 'svg' ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy !== ''} onClick={() => doExport('svg')}>SVG</Btn>
      <Btn variant="primary" icon={busy === 'png' ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy !== ''} onClick={() => doExport('png')}>{busy === 'png' ? 'Rendering' : 'Export PNG'}</Btn>
    </>
  );

  const main = (
    <div className="pb-tool-stage" style={{ background: look.background, ['--tool-ink' as string]: look.ink }}>
      <div className="pb-tool-scene">
        <W.Globe rails={rails} selectedId={selectedId} pending={pending} picking={mode !== 'idle'} onPick={onPick}
          globeStyle={globeStyle} theme={look.theme} background={look.background} palette={look.palette} home={home}
          focus={focus} focusCity={focusCity} cityView={cityView}
          onNodeClick={onNodeClick} onEnterCity={enterCity} onExitCity={exitCity} onCityReady={() => setCityLoading(false)} />
      </div>
      <div key={fadeKey} className="pb-tool-fade" aria-hidden="true" />
      {mode !== 'idle' ? (
        <div className="pb-floatbar pb-tool-top" role="group" aria-label="New connection">
          <PlaceField label="From" autoFocus value={pending?.place} onClear={() => { setPending(null); setMode('pickA'); }} onSelect={(p) => typed(p, 'from')} onSubmit={create} />
          <PlaceField label="To" value={dest?.place} onClear={() => setDest(null)} onSelect={(p) => typed(p, 'to')} onSubmit={create} />
          <span className="pb-floatbar-sep" />
          <Btn variant="primary" disabled={!pending || !dest} onClick={create}>Create</Btn>
          <Btn icon={<X {...ICON} />} label="Cancel" onClick={stopPicking} />
        </div>
      ) : focus ? (
        <div className="pb-floatbar pb-tool-top" role="group" aria-label="Focus">
          <span className="pb-tool-focus">
            <b>{cityView && focusCity ? `${focusCity.landmark}, ${focusCity.name}` : focus.place}</b>
            <span>{cityView ? (cityLoading ? 'Building the city…' : 'Drag to turn · scroll out to leave') : focusCity ? 'Scroll in to enter the city' : 'No city close-up here'}</span>
          </span>
          {!cityView && focusCity ? <Btn variant="secondary" icon={<ArrowUpRight {...ICON} />} onClick={enterCity}>View landmark</Btn> : null}
          <Btn icon={<ArrowLeft {...ICON} />} onClick={cityView ? exitCity : backToGlobe}>{cityView ? 'Globe' : 'Back'}</Btn>
        </div>
      ) : null}
      {mode !== 'idle' ? <p className="pb-tool-hint" role="status">{!pending ? 'Click the globe, or type a place, for the first end.' : !dest ? 'Now the second end.' : 'Press Create, or Enter.'}</p> : null}
      <div className="pb-tool-hud" aria-label="World Graph totals">
        <span>{nodeCount} nodes</span><span>{rails.length} rails</span><span>{fmt(totalKm)} km</span>
        {full ? <span>Full: {RAIL_LIMIT.rails} rails at most</span> : null}
      </div>
      {note ? <p className="pb-tool-note" role="alert">{note}</p> : null}
    </div>
  );

  return frame({ actions, rail, railLabel: 'Tools and rails', inspector, inspectorLabel: 'World Graph properties', main, mainLabel: 'World Graph', kind: 'canvas' });
}

/* ---------- Particle studio ---------- */

const SHAPE_LABEL: Record<string, string> = { globe: 'Earth', sphere: 'Sphere', cube: 'Cube', ring: 'Ring', cylinder: 'Cylinder', pyramid: 'Pyramid', wave: 'Wave', image: 'Image', text: 'Word' };
type Settings = typeof W.DEFAULT_SETTINGS & Record<string, any>;
type Preset = { id: string; name: string; settings: Settings };
const PRESETS_KEY = 'aurelius-design-presets';
const WORD = { id: 'word', name: 'Word', params: { text: { type: 'text', label: 'Word', max: 24 } } } as unknown as Tpl;
const PRESET_NAME = { id: 'preset', name: 'Preset', params: { name: { type: 'text', label: 'Name this design', max: 32 } } } as unknown as Tpl;

function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 512 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = r.result as string;
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ParticleStudio({ brand, tool, goTool, frame, save }: { brand: Brand; tool: Tool; goTool: (id: string) => void; frame: Frame; save: Save }) {
  const D: Settings = W.DEFAULT_SETTINGS;
  const config = useMemo(() => ({
    shape: {
      shape: { type: 'select', options: W.SHAPES.map((s: string) => ({ value: s, label: SHAPE_LABEL[s] ?? s })), default: D.shape },
      fill: { type: 'select', options: [{ value: 'surface', label: 'Surface' }, { value: 'volume', label: 'Volume' }], default: D.fill },
      spin: D.spin,
    },
    specks: {
      size: [D.size, 0.002, 0.04, 0.001],
      separation: [D.separation, 0, 0.08, 0.002],
      density: [D.density / 1000, W.DENSITY_MIN / 1000, W.DENSITY_MAX / 1000, 5],
      opacity: [D.opacity, 0.1, 1, 0.05],
      randomness: [D.jitter, 0, 1, 0.05],
    },
    colour: { tone: { type: 'select', options: toneOptions(brand, tool), default: tool.tone } },
  }) as unknown as DialConfig, [brand, tool]);
  const controller = useDialKitController('Particle studio', config, { id: `primary-brand:${brand.id}:tool:particles`, persist: false });
  const v: any = controller.values ?? {};
  const [text, setText] = useState<string>(D.text);
  const [image, setImage] = useState<string | null>(null);
  const [invert, setInvert] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [presets, setPresets] = useState<Preset[]>(() => { try { const p = JSON.parse(localStorage.getItem(PRESETS_KEY) || 'null'); return Array.isArray(p) ? p : W.STARTER_PRESETS; } catch { return W.STARTER_PRESETS; } });
  const [current, setCurrent] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'' | 'png' | 'svg'>('');
  const file = useRef<HTMLInputElement>(null);

  const s: Settings = {
    ...D,
    shape: v.shape?.shape ?? D.shape, fill: v.shape?.fill ?? D.fill, spin: v.shape?.spin ?? D.spin,
    size: v.specks?.size ?? D.size, separation: v.specks?.separation ?? D.separation, density: Math.round((v.specks?.density ?? D.density / 1000) * 1000),
    opacity: v.specks?.opacity ?? D.opacity, jitter: v.specks?.randomness ?? D.jitter,
    text: text.trim() || D.text, image, invert,
  };
  const look = paletteOf(brand, v.colour?.tone ?? tool.tone);
  // The scene compares settings by value, so pass one stable object per distinct value.
  const key = JSON.stringify(s);
  const settings = useMemo(() => s, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const keep = (next: Preset[]) => {
    setPresets(next);
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(next)); setNote(''); } catch { setNote('This browser’s storage is full. Try a smaller image.'); }
  };
  const load = (p: Preset) => {
    const x: Settings = { ...D, ...p.settings };
    controller.setValues({ shape: { shape: x.shape, fill: x.fill, spin: x.spin }, specks: { size: x.size, separation: x.separation, density: x.density / 1000, opacity: x.opacity, randomness: x.jitter } } as never);
    setText(x.text); setImage(x.image ?? null); setInvert(!!x.invert); setCurrent(p.id);
  };
  const doExport = async (f: 'png' | 'svg') => { setBusy(f); setNote(''); await exportScene(save, f, `design-${s.shape === 'text' ? s.text : SHAPE_LABEL[s.shape]}`, setNote); setBusy(''); };
  const limited = s.separation > 0 && count !== null && count < s.density * 0.95;
  const cur = presets.find((p) => p.id === current);

  const rail = (
    <ToolRail brand={brand} tool={tool} goTool={goTool}>
      <div className="pb-railblock pb-railblock--fill">
        <RailHead>Presets <span className="pb-count">{presets.length}</span></RailHead>
        <ul className="pb-raillist">
          {presets.map((p) => <RailItem key={p.id} current={p.id === current} meta={SHAPE_LABEL[p.settings.shape]} onClick={() => load(p)}>{p.name}</RailItem>)}
        </ul>
      </div>
      <p className="pb-railnote pb-railfoot">Presets are kept in this browser.</p>
    </ToolRail>
  );

  const inspector = (
    <>
      <div className="pb-insphead">
        <div><h2>{tool.name}</h2><p>{brand.name} tool · from p.20</p></div>
        <Btn icon={<RotateCcw {...ICON} />} label="Reset to the default" onClick={() => { controller.resetValues(); setText(D.text); setImage(null); setInvert(false); setCurrent(null); }} />
      </div>
      {s.shape === 'text' ? <CopyPanel t={WORD} title="Word" value={{ text } as Params} onChange={(_, val) => setText(val)} /> : null}
      {s.shape === 'image' ? (
        <div className="pb-inspblock pb-inspblock--tight">
          <span className="pb-insplabel">Image</span>
          {image ? <img className="pb-tool-thumb" src={image} alt="The uploaded image" /> : <p className="pb-quiet">Upload a logo or picture. Bright parts become specks.</p>}
          <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setImage(await shrinkImage(f)); } catch { setNote('That file could not be read as an image.'); } } e.target.value = ''; }} />
          <div className="pb-rowbtns">
            <Btn variant="secondary" icon={<ImagePlus {...ICON} />} onClick={() => file.current?.click()}>{image ? 'Replace' : 'Upload image'}</Btn>
            <Btn aria-pressed={invert} variant={invert ? 'secondary' : 'ghost'} onClick={() => setInvert(!invert)}>Dark parts become specks</Btn>
          </div>
        </div>
      ) : null}
      <div className="pb-dials"><ZachDialRoot /></div>
      <div className="pb-inspblock">
        <CopyPanel t={PRESET_NAME} title="Save as a preset" value={{ name } as Params} onChange={(_, val) => setName(val)} />
        <div className="pb-rowbtns">
          <Btn variant="secondary" icon={<Plus {...ICON} />} disabled={!name.trim()} onClick={() => { const p = { id: E.uid(), name: name.trim(), settings: s }; keep([...presets, p]); setCurrent(p.id); setName(''); }}>Save</Btn>
          {cur ? <Btn icon={<Trash2 {...ICON} />} onClick={() => { keep(presets.filter((x) => x.id !== cur.id)); setCurrent(null); }}>Delete “{cur.name}”</Btn> : null}
        </div>
      </div>
    </>
  );

  const actions = (
    <>
      <Btn variant="secondary" icon={busy === 'svg' ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy !== ''} onClick={() => doExport('svg')}>SVG</Btn>
      <Btn variant="primary" icon={busy === 'png' ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy !== ''} onClick={() => doExport('png')}>{busy === 'png' ? 'Rendering' : 'Export PNG'}</Btn>
    </>
  );

  const main = (
    <div className="pb-tool-stage" style={{ background: look.background, ['--tool-ink' as string]: look.ink }}>
      <div className="pb-tool-scene">
        <W.DesignScene settings={settings} theme={look.theme} background={look.background} palette={look.palette} onCount={setCount} />
      </div>
      {s.shape === 'image' && !image ? <p className="pb-tool-hint" role="status">Upload an image in the properties panel to draw it in specks.</p> : null}
      <div className="pb-tool-hud" aria-live="polite">
        <span>{count === null ? 'Building…' : `${fmt(count)} specks`}</span>
        {limited ? <span>Separation limits this shape to {fmt(count!)}</span> : null}
      </div>
      {note ? <p className="pb-tool-note" role="alert">{note}</p> : null}
    </div>
  );

  return frame({ actions, rail, railLabel: 'Tools and presets', inspector, inspectorLabel: 'Particle studio properties', main, mainLabel: 'Particle studio', kind: 'canvas' });
}

/* ---------- Tools view ---------- */

export function ToolsView(props: { brand: Brand; tool?: string; goTool: (id: string) => void; frame: Frame; save: Save; store: RailStore; goMake: (id: string, params?: Params) => void; ask: Ask | null; files: BrandFiles; decks: DeckStore; goDeck: (deck: string, slide: string | null) => void; recipes: RecipeStore; role: Role }) {
  return <ToolScreen {...props} />;
}

function ToolScreen({ brand, tool, goTool, frame, save, store, goMake, ask, files, decks, goDeck, recipes, role }: Parameters<typeof ToolsView>[0]) {
  const tools: Tool[] = (brand as any).tools ?? [];
  const recipe = recipes.list.find((r) => r.id === tool && r.brand === brand.id && r.status !== 'request');
  const toolRail = (id: string) => (children?: ReactNode) => <ToolRail brand={brand} tool={{ id }} goTool={goTool}>{children}</ToolRail>;
  if (recipe) return <OpenInMake go={() => goMake(`set:${recipe.id}`)} />;
  const t = tools.find((x) => x.id === tool) ?? (tool ? undefined : tools[0]);
  if (!t) return <BuildTool key={brand.id} brand={brand} store={recipes} role={role} ask={ask} rail={toolRail('build')} frame={frame} goTool={goTool} goMake={goMake} />;
  if (t.id === 'glass') return <GlassTool key={t.id} brand={brand} tool={t} frame={frame} save={save} decks={decks} goMake={goMake} goDeck={goDeck} rail={(children) => <ToolRail brand={brand} tool={t} goTool={goTool}>{children}</ToolRail>} />;
  if (t.id === 'painterly') return <PainterlyTool key={t.id} brand={brand} tool={t} frame={frame} save={save} ask={ask} files={files} rail={(children) => <ToolRail brand={brand} tool={t} goTool={goTool}>{children}</ToolRail>} />;
  if (t.id === 'imagery') return <ImageryTool key={t.id} brand={brand} tool={t} frame={frame} save={save} ask={ask} files={files} rail={(children) => <ToolRail brand={brand} tool={t} goTool={goTool}>{children}</ToolRail>} />;
  return t.id === 'particles'
    ? <ParticleStudio key={t.id} brand={brand} tool={t} goTool={goTool} frame={frame} save={save} />
    : <WorldGraph key={t.id} brand={brand} tool={t} goTool={goTool} frame={frame} save={save} store={store} goMake={goMake} />;
}
