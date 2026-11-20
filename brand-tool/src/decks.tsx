// Decks: a sequence of a brand's slide layouts, saved per brand, presented in the tool and exported as PDF.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { DialConfig } from 'dialkit';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CopyPlus, Download, LayoutGrid, Play, Plus, RectangleHorizontal, RotateCcw, Trash2, X } from 'lucide-react';
import { Input } from './components/zach-ui/graphical';
import { ZachDialRoot } from './components/zach-ui/ZachDialRoot';
import * as E from './engine/index.js';
import { Btn, CopyPanel, DataPanel, pickData, ICON, MenuButton, MenuItem, MenuSeparator, PromptBar, pickCopy, RailHead, SlideView, dialSetup, fromDial, slideTitle, toDial, useDialKitController, type Ask, type Brand, type Params, type Save, type Tpl } from './ui';
import type { Frame } from './App';

export type Slide = { id: string; layout: string; params: Params };
export type Deck = { id: string; name: string; brand: string; slides: Slide[]; createdAt: number; updatedAt: number };
export type StoreMode = 'loading' | 'shared' | 'readonly' | 'local';
export type DeckStore = { decks: Record<string, Deck>; mode: StoreMode; saving: boolean; problem: string; put: (d: Deck) => void; update: (id: string, fn: (d: Deck) => Deck) => void; remove: (id: string) => void };
const LOCAL_DECKS = 'primary-brand-decks';

function readDeck(id: string, v: any): Deck | null {
  if (!v || typeof v !== 'object' || !E.BY[v.brand]) return null;
  const slides = (Array.isArray(v.slides) ? v.slides : []).filter((s: any) => s && typeof s.layout === 'string').slice(0, 60)
    .map((s: any) => ({ id: String(s.id ?? E.uid()), layout: s.layout, params: s.params && typeof s.params === 'object' ? s.params : {} }));
  return { id, name: String(v.name || 'Untitled deck').slice(0, 60), brand: v.brand, slides, createdAt: Number(v.createdAt) || 0, updatedAt: Number(v.updatedAt) || 0 };
}

// Decks live in the page's shared store when there is one, so they are the same for everyone who opens the page.
// The page's own state is what is drawn; the store is written a moment after each change, one write per deck at a time.
export function useDecks(): DeckStore {
  const [decks, setDecks] = useState<Record<string, Deck>>({});
  const [mode, setModeState] = useState<StoreMode>('loading');
  const [saving, setSaving] = useState(0);
  const [problem, setProblem] = useState('');
  const latest = useRef(decks), modeRef = useRef<StoreMode>('loading'), db = useRef<any>(null);
  const dirty = useRef(new Set<string>()), busy = useRef(new Set<string>()), again = useRef(new Set<string>()), retried = useRef(new Set<string>());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const setMode = (m: StoreMode) => { modeRef.current = m; setModeState(m); };
  const commit = useCallback((fn: (prev: Record<string, Deck>) => Record<string, Deck>) => {
    const next = fn(latest.current);
    latest.current = next;
    setDecks(next);
    if (modeRef.current === 'local') { try { localStorage.setItem(LOCAL_DECKS, JSON.stringify(next)); } catch { /* kept for this visit only */ } }
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
        try {
          const saved = JSON.parse(localStorage.getItem(LOCAL_DECKS) || '{}');
          commit(() => Object.fromEntries(Object.entries<any>(saved).map(([id, v]) => [id, readDeck(id, v)]).filter(([, v]) => v)) as Record<string, Deck>);
        } catch { /* nothing saved */ }
        return;
      }
      db.current = store;
      let can: boolean | null = null;
      try { can = await (await claude.use('user'))?.can?.('data.write'); } catch { can = null; }
      if (dead) return;
      setMode(can === false ? 'readonly' : 'shared');
      off = store.collection('decks').onSnapshot((snap: any) => {
        commit((prev) => {
          const next: Record<string, Deck> = {};
          for (const doc of snap.docs) { const deck = dirty.current.has(doc.id) ? null : readDeck(doc.id, doc.data()); if (deck) next[doc.id] = deck; }
          for (const id of dirty.current) if (prev[id]) next[id] = prev[id];
          return next;
        });
      }, () => { setMode('local'); });
    })();
    return () => { dead = true; off?.(); };
  }, [commit]);

  const flush = useCallback(async (id: string) => {
    if (!db.current || modeRef.current !== 'shared') return;
    if (busy.current.has(id)) { again.current.add(id); return; }
    busy.current.add(id);
    setSaving((n) => n + 1);
    let failed = false;
    try {
      const deck = latest.current[id], ref = db.current.doc(`decks/${id}`);
      if (deck) await ref.set({ name: deck.name, brand: deck.brand, slides: deck.slides, createdAt: deck.createdAt, updatedAt: deck.updatedAt });
      else await ref.delete();
      retried.current.delete(id);
      setProblem('');
    } catch (error: any) {
      failed = true;
      if (error?.code === 'invalid_argument') setMode('readonly');
      else if (error?.code === 'quota_exceeded') setProblem('The shared store is full. Delete a deck to save new ones.');
      else if (error?.code === 'revoked' || error?.code === 'not_granted') setMode('local');
      else if (!retried.current.has(id)) { retried.current.add(id); again.current.add(id); }
      else setProblem('Could not save just now. Your changes are kept on this page.');
    } finally {
      busy.current.delete(id);
      setSaving((n) => n - 1);
      if (again.current.delete(id)) timers.current[id] = setTimeout(() => flush(id), failed ? 1500 : 0);
      else if (!failed) dirty.current.delete(id);
    }
  }, []);
  const touch = useCallback((id: string) => {
    dirty.current.add(id);
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => flush(id), 700);
  }, [flush]);
  const put = useCallback((deck: Deck) => { commit((prev) => ({ ...prev, [deck.id]: { ...deck, updatedAt: Date.now() } })); touch(deck.id); }, [commit, touch]);
  const update = useCallback((id: string, fn: (d: Deck) => Deck) => {
    if (!latest.current[id]) return;
    commit((prev) => ({ ...prev, [id]: { ...fn(prev[id]), updatedAt: Date.now() } }));
    touch(id);
  }, [commit, touch]);
  const remove = useCallback((id: string) => { commit((prev) => { const next = { ...prev }; delete next[id]; return next; }); touch(id); }, [commit, touch]);
  return { decks, mode, saving: saving > 0, problem, put, update, remove };
}

// The open slide. Its DialKit panel starts from the slide's saved values; every change is written back to the deck.
// Its copy and lists are edited in the inspector's Copy section, which this component fills through a portal.
function SlideEditor({ brand, slide, onParams, reset }: { brand: Brand; slide: Slide; onParams: (p: Params) => void; reset: number }) {
  const t: Tpl = brand.SLBY[slide.layout];
  const { config, paths } = useMemo(() => {
    const setup = dialSetup(t, brand, slide.params);
    return { paths: setup.paths, config: setup.config as DialConfig };
  }, [t, brand]);
  const controller = useDialKitController(t.name, config, { id: `primary-brand:deck:${slide.id}:${t.id}`, persist: false });
  const raw = fromDial(paths, controller.values);
  const [copy, setCopy] = useState<Params>(() => pickCopy(t, slide.params));
  const [data, setData] = useState<Params>(() => pickData(t, slide.params));
  const key = JSON.stringify(raw) + JSON.stringify(copy) + JSON.stringify(data);
  const p: Params = useMemo(() => E.sanitize(t, { ...raw, ...copy, ...data }), [t, key]);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => setSlot(document.getElementById('pb-copy-slot')), []);
  useEffect(() => { if (JSON.stringify(p) !== JSON.stringify(slide.params)) onParams(p); }, [key]);
  useEffect(() => { if (reset) { controller.setValues(toDial(paths, E.defaults(t)) as never); setCopy(pickCopy(t, E.defaults(t))); setData({}); } }, [reset]);
  return (
    <>
      <SlideView t={t} p={p} label={slideTitle(t, p)} />
      {slot ? createPortal(<><CopyPanel t={t} value={p} onChange={(k, v) => setCopy((c) => ({ ...c, [k]: v }))} /><DataPanel t={t} value={p} onClear={(k) => setData((d) => { const n = { ...d }; delete n[k]; return n; })} /></>, slot) : null}
    </>
  );
}

function Presenter({ brand, slides, start, onClose }: { brand: Brand; slides: Slide[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [idle, setIdle] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const n = slides.length;
  const go = (d: number) => setI((v) => Math.min(n - 1, Math.max(0, v + d)));
  useEffect(() => {
    const el = root.current!, before = document.activeElement as HTMLElement | null;
    let full = false;
    el.focus();
    el.requestFullscreen?.().then(() => { full = true; }).catch(() => { /* presents inside the page instead */ });
    const left = () => { if (full && !document.fullscreenElement) onClose(); };
    document.addEventListener('fullscreenchange', left);
    return () => {
      document.removeEventListener('fullscreenchange', left);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      before?.focus?.();
    };
  }, []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => { setIdle(false); clearTimeout(timer); timer = setTimeout(() => setIdle(true), 2500); };
    wake();
    addEventListener('pointermove', wake);
    return () => { removeEventListener('pointermove', wake); clearTimeout(timer); };
  }, []);
  const onKey = (e: React.KeyboardEvent) => {
    const onButton = !!(e.target as HTMLElement).closest('button');
    if (e.key === 'Escape') onClose();
    else if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key) || (!onButton && [' ', 'Enter'].includes(e.key))) go(1);
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key) || (!onButton && e.key === 'Backspace')) go(-1);
    else if (e.key === 'Home') setI(0);
    else if (e.key === 'End') setI(n - 1);
    else return;
    e.preventDefault();
  };
  const s = slides[Math.min(i, n - 1)], t: Tpl = brand.SLBY[s.layout];
  return (
    <div className="pb-present" ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Presentation" data-idle={idle} onKeyDown={onKey}>
      <div className="pb-present-slide" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); go(e.clientX - r.left < r.width / 3 ? -1 : 1); }}>
        <SlideView t={t} p={s.params} label={`Slide ${i + 1} of ${n}. ${slideTitle(t, s.params)}`} />
      </div>
      <div className="pb-present-bar" onFocus={() => setIdle(false)}>
        <Btn icon={<ArrowLeft {...ICON} />} label="Previous slide" disabled={i === 0} onClick={() => go(-1)} />
        <span aria-live="polite">{i + 1} / {n}</span>
        <Btn icon={<ArrowRight {...ICON} />} label="Next slide" disabled={i === n - 1} onClick={() => go(1)} />
        <span className="pb-present-sep" aria-hidden="true" />
        <Btn icon={<X {...ICON} />} label="Exit presentation" onClick={onClose} />
      </div>
    </div>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'deck';
const STORE_TEXT: Record<StoreMode, string> = {
  loading: 'Loading saved decks…',
  shared: 'Saved for everyone with the link',
  readonly: 'View only: changes here are not saved',
  local: 'Saved in this browser only',
};

export function DeckScreen({ brand, store, frame, save, ask, focus }: { brand: Brand; store: DeckStore; frame: Frame; save: Save; ask: Ask | null; focus?: React.MutableRefObject<{ deck: string; slide: string | null } | null> }) {
  const [opening] = useState(() => { const f = focus?.current ?? null; if (focus) focus.current = null; return f; });
  const list = useMemo(() => Object.values(store.decks).filter((d) => d.brand === brand.id).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)), [store.decks, brand]);
  const [deckId, setDeckId] = useState<string | null>(opening?.deck ?? null);
  const deck = list.find((d) => d.id === deckId) ?? list[list.length - 1] ?? null;
  const slides: Slide[] = useMemo(() => (deck ? deck.slides.filter((s) => brand.SLBY[s.layout]).map((s) => ({ ...s, params: E.sanitize(brand.SLBY[s.layout], s.params) })) : []), [deck, brand]);
  const [slideId, setSlideId] = useState<string | null>(opening?.slide ?? null);
  const index = Math.max(0, slides.findIndex((s) => s.id === slideId));
  const slide = slides[index] ?? null;
  const [view, setView] = useState<'edit' | 'overview'>('edit');
  const [present, setPresent] = useState<number | null>(null);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reset, setReset] = useState(0);
  const strip = useRef<HTMLOListElement>(null);

  const openDeck = (id: string, first: string | null = null) => { setDeckId(id); setSlideId(first); setConfirming(false); setReset(0); };
  const newDeck = (name: string, source: unknown) => {
    const now = Date.now(), taken = new Set(list.map((d) => d.name));
    let unique = name, k = 2;
    while (taken.has(unique)) unique = `${name} ${k++}`;
    const made: Deck = { id: E.uid(), name: unique, brand: brand.id, slides: E.buildSlides(brand, source), createdAt: now, updatedAt: now };
    store.put(made);
    openDeck(made.id, made.slides[0]?.id ?? null);
    setView('edit');
    return made;
  };
  const edit = (fn: (s: Slide[]) => Slide[]) => deck && store.update(deck.id, (d) => ({ ...d, slides: fn(d.slides) }));
  const select = (id: string | null) => { setSlideId(id); setReset(0); };
  const addSlide = () => {
    const layout = slide?.layout ?? brand.SL[0].id, made: Slide = { id: E.uid(), layout, params: E.defaults(brand.SLBY[layout]) };
    edit((all) => { const at = slide ? all.findIndex((s) => s.id === slide.id) + 1 : all.length; return [...all.slice(0, at), made, ...all.slice(at)]; });
    select(made.id);
    setView('edit');
  };
  const duplicate = () => {
    if (!slide) return;
    const made: Slide = { ...slide, id: E.uid() };
    edit((all) => { const at = all.findIndex((s) => s.id === slide.id) + 1; return [...all.slice(0, at), made, ...all.slice(at)]; });
    select(made.id);
  };
  const removeSlide = () => {
    if (!slide) return;
    const next = slides[index + 1] ?? slides[index - 1] ?? null;
    edit((all) => all.filter((s) => s.id !== slide.id));
    select(next?.id ?? null);
  };
  const move = (by: number) => slide && edit((all) => {
    const from = all.findIndex((s) => s.id === slide.id), to = from + by;
    if (from < 0 || to < 0 || to >= all.length) return all;
    const next = [...all];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  });
  const setParams = (id: string, p: Params) => edit((all) => all.map((s) => (s.id === id ? { ...s, params: p } : s)));
  const setLayout = (id: string, layout: string) => edit((all) => all.map((s) => (s.id === id ? { ...s, layout, params: E.sanitize(brand.SLBY[layout], s.params) } : s)));
  // Keep the open slide in view in the filmstrip.
  useEffect(() => { strip.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' }); }, [slide?.id]);

  const exportPdf = async () => {
    if (!deck || !slides.length || busy) return;
    try {
      const pages: Awaited<ReturnType<typeof E.slideJpeg>>[] = [];
      for (let i = 0; i < slides.length; i++) {
        setBusy(`${i + 1} of ${slides.length}`);
        pages.push(await E.slideJpeg(brand.SLBY[slides[i].layout], slides[i].params));
      }
      await save(`${brand.id}-${slug(deck.name)}.pdf`, E.pdfOf(pages, deck.name));
    } catch { setNote('This browser could not render the PDF.'); }
    finally { setBusy(''); }
  };
  const draft = async (outline: string) => {
    if (!ask || drafting) return false;
    setDrafting(true);
    setNote('Drafting a deck. This can take a minute.');
    try {
      const answer = await ask.json(E.deckPrompt(outline.slice(0, 4000), brand), { cache: false });
      const built = E.buildSlides(brand, answer?.slides, 12);
      if (!built.length) throw { code: 'bad' };
      newDeck(String(answer.name || 'Drafted deck').slice(0, 60), built);
      setNote(`Drafted ${built.length} slides. Check every figure, name and date before presenting.`);
      return true;
    } catch (error: any) {
      setNote(error?.code === 'rate_limited' ? 'Claude is busy. Try again in a moment.' : error?.code === 'not_granted' ? 'Drafting needs permission to ask Claude.' : 'That did not produce a usable deck. Try rewording the outline.');
      return false;
    } finally { setDrafting(false); }
  };

  const t: Tpl | null = slide ? brand.SLBY[slide.layout] : null;
  const status = store.problem || (store.mode === 'shared' && store.saving ? 'Saving…' : STORE_TEXT[store.mode]);
  const prompt = ask ? <PromptBar label="Draft a deck with Claude" multiline placeholder="Describe a deck: what it is for, then one point per line" busy={drafting} note={note} onSubmit={draft} /> : note ? <p className="pb-prompt-note pb-prompt-note--solo" role="status">{note}</p> : null;

  const rail: ReactNode = (
    <>
      <div className="pb-railblock">
        <RailHead>Deck</RailHead>
        {deck ? (
          <MenuButton className="pb-deckpick" label="Choose a deck" trigger={<span className="pb-deckpick-name">{deck.name}</span>}>
            {list.map((d) => <MenuItem key={d.id} current={d.id === deck.id} hint={d.slides.length} onClick={() => openDeck(d.id)}>{d.name}</MenuItem>)}
            <MenuSeparator />
            <MenuItem onClick={() => newDeck(brand.starter.name, brand.starter.slides)}>New deck from sample</MenuItem>
          </MenuButton>
        ) : <p className="pb-railnote">No decks yet</p>}
      </div>
      {deck ? (
        <div className="pb-railblock pb-railblock--fill">
          <RailHead action={<Btn icon={<Plus {...ICON} />} label="Add slide after this one" onClick={addSlide} />}>Slides <span className="pb-count">{slides.length}</span></RailHead>
          <ol className="pb-thumbs" ref={strip}>
            {slides.map((s, i) => (
              <li key={s.id}>
                <button type="button" className="pb-thumb" aria-current={view === 'edit' && i === index ? 'true' : undefined} onClick={() => { select(s.id); setView('edit'); }}>
                  <span className="pb-thumb-n">{i + 1}</span>
                  <SlideView t={brand.SLBY[s.layout]} p={s.params} label={slideTitle(brand.SLBY[s.layout], s.params)} />
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <p className="pb-railfoot" role="status">{status}</p>
    </>
  );

  const inspector: ReactNode = deck ? (
    <>
      <div className="pb-inspblock">
        <label className="pb-insplabel" htmlFor="pb-deckname">Deck name</label>
        <Input id="pb-deckname" className="pb-input" value={deck.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => store.update(deck.id, (d) => ({ ...d, name: e.target.value.slice(0, 60) }))} />
      </div>
      {slide && t && view === 'edit' ? (
        <>
          <div className="pb-insphead pb-insphead--rule"><div><h2>Slide {index + 1}</h2><p>From {t.src}</p></div></div>
          <div className="pb-inspblock pb-layoutpick">
            <span className="pb-insplabel">Layout</span>
            <MenuButton className="pb-deckpick" label="Slide layout" trigger={<span className="pb-layoutpick-name">{t.name}</span>}>
              {brand.SL.map((x: Tpl) => <MenuItem key={x.id} current={x.id === t.id} onClick={() => setLayout(slide.id, x.id)}>{x.name}</MenuItem>)}
            </MenuButton>
          </div>
          <div id="pb-copy-slot" />
          <div className="pb-dials"><ZachDialRoot /></div>
        </>
      ) : <p className="pb-railnote pb-inspblock">Select a slide to edit it.</p>}
      <div className="pb-inspblock pb-inspfoot">
        <Btn icon={<Trash2 {...ICON} />} onClick={() => { if (!confirming) { setConfirming(true); return; } store.remove(deck.id); setDeckId(null); setSlideId(null); setConfirming(false); }} onBlur={() => setConfirming(false)}>
          {confirming ? 'Delete for everyone?' : 'Delete deck'}
        </Btn>
      </div>
    </>
  ) : null;

  const actions: ReactNode = deck && slides.length ? (
    <>
      <div className="pb-seg" role="group" aria-label="Canvas view">
        <Btn icon={<RectangleHorizontal {...ICON} />} label="One slide" aria-pressed={view === 'edit'} variant={view === 'edit' ? 'secondary' : 'ghost'} onClick={() => setView('edit')} />
        <Btn icon={<LayoutGrid {...ICON} />} label="All slides" aria-pressed={view === 'overview'} variant={view === 'overview' ? 'secondary' : 'ghost'} onClick={() => setView('overview')} />
      </div>
      <Btn icon={<Play {...ICON} />} variant="secondary" onClick={() => setPresent(view === 'edit' ? index : 0)}>Present</Btn>
      <Btn icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} variant="primary" disabled={busy !== ''} onClick={exportPdf}>{busy ? `Rendering ${busy}` : 'Export PDF'}</Btn>
    </>
  ) : null;

  const main: ReactNode = !deck ? (
    <div className="pb-canvas">
      <div className="pb-empty">
        <h2>Start a {brand.name} deck</h2>
        <p>A deck is a sequence of this brand’s {brand.SL.length} slide layouts. Start from the sample deck, or describe one below and Claude will draft it.</p>
        <Btn variant="primary" size="m" disabled={store.mode === 'loading'} onClick={() => newDeck(brand.starter.name, brand.starter.slides)}>{store.mode === 'loading' ? 'Loading…' : 'Start from sample'}</Btn>
      </div>
      {prompt}
    </div>
  ) : !slide || !t ? (
    <div className="pb-canvas">
      <div className="pb-empty"><h2>This deck is empty</h2><p>Add a slide to begin.</p><Btn variant="primary" size="m" icon={<Plus {...ICON} />} onClick={addSlide}>Add slide</Btn></div>
      {prompt}
    </div>
  ) : view === 'overview' ? (
    <div className="pb-canvas pb-canvas--scroll">
      <ol className="pb-overview">
        {slides.map((s, i) => (
          <li key={s.id}>
            <button type="button" className="pb-thumb pb-thumb--grid" aria-current={i === index ? 'true' : undefined} onClick={() => { select(s.id); setView('edit'); }}>
              <SlideView t={brand.SLBY[s.layout]} p={s.params} label={slideTitle(brand.SLBY[s.layout], s.params)} />
              <span className="pb-thumb-cap"><span className="pb-thumb-n">{i + 1}</span>{brand.SLBY[s.layout].name}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  ) : (
    <div className="pb-canvas">
      <div className="pb-deckedit">
        <div className="pb-artlabel"><span>{index + 1} / {slides.length} · {t.name}</span><span>1920 × 1080</span></div>
        <div className="pb-deckstage"><SlideEditor key={`${slide.id}:${slide.layout}`} brand={brand} slide={slide} reset={reset} onParams={(p) => setParams(slide.id, p)} /></div>
        <div className="pb-floatbar" role="toolbar" aria-label="Slide actions">
          <Btn icon={<ArrowUp {...ICON} />} label="Move earlier" disabled={index === 0} onClick={() => move(-1)} />
          <Btn icon={<ArrowDown {...ICON} />} label="Move later" disabled={index === slides.length - 1} onClick={() => move(1)} />
          <span className="pb-floatbar-sep" aria-hidden="true" />
          <Btn icon={<CopyPlus {...ICON} />} label="Duplicate slide" onClick={duplicate} />
          <Btn icon={<RotateCcw {...ICON} />} label="Reset to the sample copy" onClick={() => setReset((n) => n + 1)} />
          <Btn icon={<Trash2 {...ICON} />} label="Delete slide" onClick={removeSlide} />
        </div>
      </div>
      {prompt}
    </div>
  );

  return (
    <>
      {frame({ actions, rail, railLabel: 'Decks and slides', inspector, inspectorLabel: 'Deck and slide properties', main, mainLabel: view === 'overview' ? 'All slides' : 'Slide', kind: 'canvas' })}
      {present !== null && slides.length ? <Presenter brand={brand} slides={slides} start={present} onClose={() => setPresent(null)} /> : null}
    </>
  );
}
