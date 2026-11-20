// Sets, and the Build a tool page.
// A set (stored as a recipe) is one of the brand's layouts with its look kept and its words left open, made at several
// sizes in one go. Sets live in Make. Drafts are private; a set joins the brand's sets only when someone who looks after
// the brand approves it, and a brand keeps at most a handful, so adding one past the limit means archiving one.
// Tools are different: each turns part of the brand's own visual language into a drawing system (the Painterly studio,
// the Glass tool). Primary builds them with Claude; the Build a tool page shows them, suggests what could come next,
// checks requests against what the brand has, and sends what is worth building to Primary as a brief.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DialConfig } from 'dialkit';
import { Archive, ArrowRight, Check, Copy, Download, Image as ImageIcon, Layers, Send, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { ZachDialRoot } from './components/zach-ui/ZachDialRoot';
import * as E from './engine/index.js';
import { Btn, Chip, CopyButton, CopyPanel, ICON, MenuButton, MenuItem, SlideView, dialSetup, fromDial, pickCopy, useDialKitController, type Ask, type Brand, type Params, type Save } from './ui';
import type { Frame } from './App';
import type { StoreMode } from './decks';

const R = E.R;
export type Recipe = { id: string; brand: string; status: 'draft' | 'proposed' | 'approved' | 'archived' | 'request'; name: string; about: string; base: string; inputs: string[]; fixed: Params; sizes: string[]; idea: string; by: string; createdAt: number; updatedAt: number; approvedAt: number; uses: number; lastUsed: number; request?: string; reason?: string; brief?: string };
export type RecipeStore = { list: Recipe[]; mode: StoreMode; saving: boolean; problem: string; put: (r: Recipe) => void; update: (id: string, fn: (r: Recipe) => Recipe) => void; remove: (id: string) => void };
export type Role = { me: string; steward: boolean };
const LOCAL = 'primary-brand-recipes';

/* ---------- Store: the page's shared store when there is one, this browser otherwise ---------- */
export function useRecipes(): RecipeStore {
  const [items, setItems] = useState<Record<string, Recipe>>({});
  const [mode, setModeState] = useState<StoreMode>('loading');
  const [saving, setSaving] = useState(0);
  const [problem, setProblem] = useState('');
  const latest = useRef(items), modeRef = useRef<StoreMode>('loading'), db = useRef<any>(null), dirty = useRef(new Set<string>()), timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const setMode = (m: StoreMode) => { modeRef.current = m; setModeState(m); };
  const commit = useCallback((fn: (p: Record<string, Recipe>) => Record<string, Recipe>) => {
    const next = fn(latest.current); latest.current = next; setItems(next);
    if (modeRef.current === 'local') { try { localStorage.setItem(LOCAL, JSON.stringify(next)); } catch { /* kept for this visit */ } }
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
        try { const saved = JSON.parse(localStorage.getItem(LOCAL) || '{}'); commit(() => Object.fromEntries(Object.entries<any>(saved).map(([id, v]) => [id, R.readRecipe(id, v)]).filter(([, v]) => v))); } catch { /* nothing saved */ }
        return;
      }
      db.current = store;
      let can: boolean | null = null;
      try { can = await (await claude.use('user'))?.can?.('data.write'); } catch { can = null; }
      if (dead) return;
      setMode(can === false ? 'readonly' : 'shared');
      off = store.collection('recipes').onSnapshot((snap: any) => {
        commit((prev) => {
          const next: Record<string, Recipe> = {};
          for (const d of snap.docs) { if (dirty.current.has(d.id)) continue; const r = R.readRecipe(d.id, d.data()); if (r) next[d.id] = r; }
          for (const id of dirty.current) if (prev[id]) next[id] = prev[id];
          return next;
        });
      }, () => setMode('local'));
    })();
    return () => { dead = true; off?.(); };
  }, [commit]);
  const flush = useCallback(async (id: string) => {
    if (!db.current || modeRef.current !== 'shared') { dirty.current.delete(id); return; }
    setSaving((n) => n + 1);
    try {
      const r = latest.current[id], ref = db.current.doc(`recipes/${id}`);
      if (r) { const { id: _drop, ...data } = r; await ref.set(JSON.parse(JSON.stringify(data))); } else await ref.delete();
      setProblem(''); dirty.current.delete(id);
    } catch (error: any) {
      if (error?.code === 'invalid_argument' || error?.code === 'not_granted') setMode('readonly');
      else setProblem('Could not save the tool just now. It is kept on this page.');
    } finally { setSaving((n) => n - 1); }
  }, []);
  const touch = useCallback((id: string) => { dirty.current.add(id); clearTimeout(timers.current[id]); timers.current[id] = setTimeout(() => flush(id), 500); }, [flush]);
  const put = useCallback((r: Recipe) => { if (modeRef.current === 'readonly') return; commit((p) => ({ ...p, [r.id]: { ...r, updatedAt: Date.now() } })); touch(r.id); }, [commit, touch]);
  const update = useCallback((id: string, fn: (r: Recipe) => Recipe) => { if (modeRef.current === 'readonly' || !latest.current[id]) return; commit((p) => ({ ...p, [id]: { ...fn(p[id]), updatedAt: Date.now() } })); touch(id); }, [commit, touch]);
  const remove = useCallback((id: string) => { if (modeRef.current === 'readonly') return; commit((p) => { const n = { ...p }; delete n[id]; return n; }); touch(id); }, [commit, touch]);
  const list = useMemo(() => Object.values(items).sort((a, b) => a.createdAt - b.createdAt), [items]);
  return { list, mode, saving: saving > 0, problem, put, update, remove };
}

// Who is looking: anyone may draft and propose; people who can edit the page look after the brand and approve.
export function useRole(): Role {
  const [role, setRole] = useState<Role>({ me: 'local', steward: true });
  useEffect(() => {
    let dead = false;
    (async () => {
      const claude = (window as any).claude;
      let u: any = null;
      try { u = await claude?.use?.('user'); } catch { u = null; }
      if (!u || dead) return;
      let me = 'me', steward: boolean | null = null;
      try { me = (await u.id?.()) ?? 'me'; } catch { /* stays generic */ }
      try { steward = await u.canEdit?.(); } catch { steward = null; }
      if (steward == null) { try { steward = (await u.can?.('data.write')) !== false; } catch { steward = false; } }
      if (!dead) setRole({ me: String(me), steward: !!steward });
    })();
    return () => { dead = true; };
  }, []);
  return role;
}

const ofBrand = (store: RecipeStore, brand: Brand) => store.list.filter((r) => r.brand === brand.id);
export const visibleRecipes = (store: RecipeStore, brand: Brand, role: Role) => ofBrand(store, brand).filter((r) => r.status === 'approved' || r.status === 'proposed' || (r.status === 'draft' && (r.by === role.me || role.me === 'local')));
const STATUS_WORD: Record<string, string> = { draft: 'Draft, only you', proposed: 'Waiting for approval', approved: 'In the brand’s sets', archived: 'Archived' };
const liveSets = (store: RecipeStore, brand: Brand) => store.list.filter((x) => x.brand === brand.id && x.status === 'approved');

// Keep a set: straight into the brand's sets for someone who looks after the brand (while there is room), a draft otherwise.
export function saveSet(store: RecipeStore, role: Role, brand: Brand, spec: any, idea = ''): string | null {
  if (!spec || store.mode === 'readonly' || store.mode === 'loading') return null;
  const now = Date.now(), id = E.uid(), approve = role.steward && liveSets(store, brand).length < R.RECIPE_LIMIT;
  store.put({ id, brand: brand.id, status: approve ? 'approved' : 'draft', name: spec.name, about: spec.about ?? '', base: spec.base, inputs: spec.inputs, fixed: spec.fixed, sizes: spec.sizes, idea, by: role.me, createdAt: now, updatedAt: now, approvedAt: approve ? now : 0, uses: 0, lastUsed: 0 });
  return id;
}

/* ---------- One set's look: its sizes drawn side by side ---------- */
function SizeRow({ brand, r, open }: { brand: Brand; r: Pick<Recipe, 'brand' | 'base' | 'fixed' | 'sizes'> & { inputs?: string[] }; open?: Params }) {
  const t = brand.TBY[r.base];
  // The row never grows taller than its height token: wide enough for every size at that height, and no wider.
  const sum = r.sizes.reduce((n, s) => n + (E.SIZE_BY[s] ? E.SIZE_BY[s].w / E.SIZE_BY[s].h : 1), 0);
  return (
    <div className="pb-rc-row" data-n={r.sizes.length} style={{ maxWidth: `calc(${sum.toFixed(3)} * var(--rh, 1000rem) + ${r.sizes.length - 1} * var(--space-m))` }}>
      {r.sizes.map((s) => {
        const p = R.recipeParams(r as Recipe, open ?? {}, s), z = E.SIZE_BY[s];
        return (
          <figure key={s} className="pb-rc-fig" style={{ flex: `${(z ? z.w / z.h : 1).toFixed(3)} 1 0` }}>
            <SlideView t={t} p={p} label={`${t.name} at ${z?.name ?? s}`} />
            <figcaption><span>{z?.name ?? s}</span><span>{z ? `${z.w}×${z.h}` : ''}</span></figcaption>
          </figure>
        );
      })}
    </div>
  );
}

// What a set leaves open and which sizes it makes. Shown in the set's own inspector.
function SetShape({ brand, r, onChange, disabled }: { brand: Brand; r: Recipe; onChange: (spec: any) => void; disabled: boolean }) {
  const t = brand.TBY[r.base];
  const keys = Object.keys(t.params).filter((k) => k !== 'format' && (t.params as any)[k].type !== 'data' && (t.params as any)[k].type !== 'pad');
  const all: string[] = R.sizesOf(t);
  const set = (patch: any) => { const c = R.cleanSpec(brand.id, { ...r, ...patch }); if (c) onChange({ ...c, name: r.name, about: r.about }); };
  const toggleInput = (k: string) => { const open = r.inputs.includes(k); const p = R.recipeParams(r, {}, r.sizes[0]); set({ inputs: open ? r.inputs.filter((x) => x !== k) : [...r.inputs, k], fixed: open ? { ...r.fixed, [k]: p[k] } : Object.fromEntries(Object.entries(r.fixed).filter(([x]) => x !== k)) }); };
  const toggleSize = (s: string) => set({ sizes: r.sizes.includes(s) ? (r.sizes.length > 1 ? r.sizes.filter((x) => x !== s) : r.sizes) : [...r.sizes, s].slice(0, R.MAX_SIZES) });
  const common = all.filter((s) => ['post-4-5', 'post-1-1', 'story-9-16', 'linkedin-1-91', 'linkedin-4-5', 'slide-16-9', 'a4-portrait', 'a4-landscape', 'letter-portrait', 'youtube-banner'].includes(s) || r.sizes.includes(s));
  return (
    <>
      <div className="pb-inspblock">
        <h3 className="pb-insplabel">Sizes it makes <span className="pb-count">{r.sizes.length} of {R.MAX_SIZES}</span></h3>
        <div className="pb-rc-toggles">
          {common.map((s) => <button key={s} type="button" className="pb-rc-toggle" aria-pressed={r.sizes.includes(s)} disabled={disabled || (!r.sizes.includes(s) && r.sizes.length >= R.MAX_SIZES)} onClick={() => toggleSize(s)}>{r.sizes.includes(s) ? <Check {...ICON} size={14} /> : null}{R.sizeName(s)}</button>)}
        </div>
        <p className="pb-quiet">Each size is drawn for its own shape, not cropped.</p>
      </div>
      <div className="pb-inspblock">
        <h3 className="pb-insplabel">Open each time</h3>
        <div className="pb-rc-toggles">
          {keys.map((k) => <button key={k} type="button" className="pb-rc-toggle" aria-pressed={r.inputs.includes(k)} disabled={disabled} onClick={() => toggleInput(k)}>{r.inputs.includes(k) ? <Check {...ICON} size={14} /> : null}{(t.params as any)[k].label}</button>)}
        </div>
        <p className="pb-quiet">Everything else stays as the brand set it.</p>
      </div>
    </>
  );
}

/* ---------- A set in Make: saved, or suggested for the brand and not saved yet ---------- */
export function SetScreen({ brand, id, store, role, rail, frame, save, setTpl, openLayout }: { brand: Brand; id: string; store: RecipeStore; role: Role; rail: ReactNode; frame: Frame; save: Save; setTpl: (id: string) => void; openLayout: (id: string, params: Params) => void }) {
  const [kind, key] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
  const saved = kind === 'set' ? store.list.find((r) => r.id === key && r.brand === brand.id && r.status !== 'request') : undefined;
  const idea = kind === 'idea' ? (R.ideasFor(brand.id, []) as any[]).find((i) => i.id === key) : undefined;
  const taken = idea ? store.list.find((r) => r.brand === brand.id && r.idea === idea.id && r.status !== 'archived' && r.status !== 'request') : undefined;
  useEffect(() => { if (taken) setTpl(`set:${taken.id}`); }, [taken?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [trial, setTrial] = useState<Recipe | null>(() => idea ? { id: `idea-${idea.id}`, brand: brand.id, status: 'draft', name: idea.name, about: idea.about, base: idea.spec.base, inputs: idea.spec.inputs, fixed: idea.spec.fixed, sizes: idea.spec.sizes, idea: idea.id, by: role.me, createdAt: 0, updatedAt: 0, approvedAt: 0, uses: 0, lastUsed: 0 } : null);
  const r = saved ?? trial;
  if (!r || !brand.TBY[r.base]) {
    const main = (
      <div className="pb-page pb-empty-page">
        <h1>This set is no longer here</h1>
        <p className="pb-quiet">It may have been deleted, or it is a draft only its maker can see.</p>
        <Btn variant="secondary" onClick={() => setTpl(brand.T[0].id)}>Back to the layouts</Btn>
      </div>
    );
    return frame({ rail, railLabel: 'Sets and layouts', main, mainLabel: 'Set', kind: 'doc' });
  }
  return <SetBody key={r.id} brand={brand} r={r} unsaved={!saved} setTrial={setTrial} store={store} role={role} rail={rail} frame={frame} save={save} setTpl={setTpl} openLayout={openLayout} why={idea?.why} />;
}

function SetBody({ brand, r, unsaved, setTrial, store, role, rail, frame, save, setTpl, openLayout, why }: { brand: Brand; r: Recipe; unsaved: boolean; setTrial: (r: Recipe) => void; store: RecipeStore; role: Role; rail: ReactNode; frame: Frame; save: Save; setTpl: (id: string) => void; openLayout: (id: string, params: Params) => void; why?: string }) {
  const t = brand.TBY[r.base];
  const view = useMemo(() => R.recipeView(r), [r.base, r.inputs.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = useMemo(() => R.recipeParams(r, {}, r.sizes[0]), [r.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const { config, paths } = useMemo(() => dialSetup(view, brand, start), [view]); // eslint-disable-line react-hooks/exhaustive-deps
  const controller = useDialKitController(r.name, config as DialConfig, { id: `primary-brand:${brand.id}:set:${r.id}`, persist: false });
  const [copy, setCopy] = useState<Params>(() => pickCopy(view, start));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const open: Params = { ...fromDial(paths, controller.values), ...copy };
  const live = liveSets(store, brand);
  const full = live.length >= R.RECIPE_LIMIT && r.status !== 'approved';
  const stale = R.unused(r);
  const mine = r.by === role.me || role.me === 'local';
  const locked = store.mode === 'readonly' || store.mode === 'loading';
  const editable = !locked && (unsaved || (r.status === 'draft' && mine) || role.steward);
  const change = (patch: Partial<Recipe>) => { if (unsaved) setTrial({ ...r, ...patch }); else store.update(r.id, (x) => ({ ...x, ...patch })); };

  const exportAll = async () => {
    setBusy(true); setNote('');
    const files: { name: string; uri: string }[] = [];
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none';
    document.body.appendChild(holder);
    try {
      for (const s of r.sizes) {
        const p = R.recipeParams(r, open, s), [w, h] = E.sizeOf(t, p);
        holder.innerHTML = E.tplHTML(t, p);
        const blob: Blob = await E.toPNG(holder.firstElementChild as HTMLElement);
        files.push({ name: `${brand.id}-${R.sizeName(s).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${w}x${h}.png`, uri: await new Promise<string>((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.readAsDataURL(blob); }) });
      }
      const slug = r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'set';
      await save(`${brand.id}-${slug}.zip`, await E.zipFiles(files));
      if (!unsaved) store.update(r.id, (x) => ({ ...x, uses: x.uses + 1, lastUsed: Date.now() }));
    } catch { setNote('This browser could not render the images.'); }
    finally { holder.remove(); setBusy(false); }
  };
  const keep = () => { const id = saveSet(store, role, brand, r, r.idea); if (id) setTpl(`set:${id}`); };

  const status = unsaved ? (
    <div className="pb-inspblock pb-rc-status">
      <h3 className="pb-insplabel">Suggested for {brand.name}</h3>
      {why ? <p className="pb-quiet">{why}</p> : null}
      <p className="pb-quiet">{role.steward && !full ? 'Saving adds it to the brand’s sets.' : role.steward ? `${brand.name} already has ${R.RECIPE_LIMIT} sets. It saves as a draft until one is archived.` : 'It saves as a draft only you can see, until you propose it.'}</p>
      <div className="pb-rowbtns"><Btn variant="primary" icon={<Check {...ICON} />} disabled={locked || !r.name.trim()} onClick={keep}>Save this set</Btn></div>
    </div>
  ) : (
    <div className="pb-inspblock pb-rc-status">
      <h3 className="pb-insplabel">Status</h3>
      <p><Chip kind={r.status === 'approved' ? 'info' : 'check'}>{STATUS_WORD[r.status]}</Chip>{stale ? <> <Chip kind="fix">Not used in {R.UNUSED_DAYS} days</Chip></> : null}</p>
      <p className="pb-quiet">{r.uses ? `Used ${r.uses} ${r.uses === 1 ? 'time' : 'times'}, last on ${new Date(r.lastUsed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.` : 'Not used yet.'} {stale ? 'Archive it if nobody needs it, so the sets stay easy to choose from.' : ''}</p>
      <div className="pb-rowbtns">
        {r.status === 'draft' && mine && !role.steward ? <Btn variant="secondary" icon={<Send {...ICON} />} onClick={() => store.update(r.id, (x) => ({ ...x, status: 'proposed' }))}>Propose for {brand.name}</Btn> : null}
        {(r.status === 'proposed' || r.status === 'draft') && role.steward ? (
          full ? (
            <MenuButton className="pb-actmenu" label="Archive a set to make room" trigger={<><Check {...ICON} /><span>Approve, replacing…</span></>}>
              {live.map((x) => <MenuItem key={x.id} hint={x.uses ? `${x.uses} uses` : 'unused'} onClick={() => { store.update(x.id, (y) => ({ ...y, status: 'archived' })); store.update(r.id, (y) => ({ ...y, status: 'approved', approvedAt: Date.now() })); }}>{x.name}</MenuItem>)}
            </MenuButton>
          ) : <Btn variant="primary" icon={<Check {...ICON} />} onClick={() => store.update(r.id, (x) => ({ ...x, status: 'approved', approvedAt: Date.now() }))}>Approve</Btn>
        ) : null}
        {r.status === 'approved' && role.steward ? <Btn icon={<Archive {...ICON} />} onClick={() => store.update(r.id, (x) => ({ ...x, status: 'archived' }))}>Archive</Btn> : null}
        {r.status === 'archived' && role.steward ? <Btn icon={<Check {...ICON} />} disabled={live.length >= R.RECIPE_LIMIT} onClick={() => store.update(r.id, (x) => ({ ...x, status: 'approved', approvedAt: Date.now() }))}>Restore</Btn> : null}
        {(r.status === 'draft' && mine) || (r.status === 'archived' && role.steward) || (r.status === 'approved' && role.steward) ? <Btn icon={<Trash2 {...ICON} />} label="Delete this set" onClick={() => { store.remove(r.id); setTpl(r.base); }} /> : null}
      </div>
    </div>
  );
  const inspector = (
    <>
      <div className="pb-insphead">
        <div>
          {editable ? <input aria-label="Set name" className="pb-start-input pb-rc-name" value={r.name} maxLength={40} onChange={(e) => change({ name: e.target.value })} /> : <h2>{r.name}</h2>}
          <p>A set of the {t.name} layout</p>
        </div>
      </div>
      <CopyPanel t={view} value={{ ...start, ...copy }} onChange={(k, v) => setCopy((c) => ({ ...c, [k]: v }))} />
      {Object.keys(config).length ? <div className="pb-dials"><ZachDialRoot /></div> : null}
      <SetShape brand={brand} r={r} disabled={!editable} onChange={(spec) => change({ inputs: spec.inputs, fixed: spec.fixed, sizes: spec.sizes })} />
      {status}
    </>
  );
  const actions = (
    <>
      <Btn icon={<ImageIcon {...ICON} />} onClick={() => openLayout(t.id, R.recipeParams(r, open, r.sizes[0]))}>Open the layout</Btn>
      <Btn variant="primary" icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy} onClick={exportAll}>{busy ? 'Rendering' : `Export ${r.sizes.length} ${r.sizes.length === 1 ? 'size' : 'sizes'}`}</Btn>
    </>
  );
  const main = (
    <div className="pb-page pb-page--wide pb-rc-run">
      {r.about ? <p className="pb-rc-runabout">{r.about}</p> : null}
      <SizeRow brand={brand} r={r} open={open} />
      {note ? <p className="pb-tool-note" role="alert">{note}</p> : null}
    </div>
  );
  return frame({ actions, rail, railLabel: 'Sets and layouts', inspector, inspectorLabel: `${r.name} inputs`, main, mainLabel: r.name, kind: 'doc' });
}

/* ---------- The Build a tool page ---------- */
type Brief = { name: string; from: string; what: string; why: string; request?: string };
type Verdict = { verdict: 'tool' | 'set' | 'engine' | 'off-brand' | 'sent'; reason: string; target?: string; brief?: Brief } | null;
const VERDICT_WORD: Record<string, string> = { tool: 'You already have this', set: 'Make can do this', engine: 'Worth building', 'off-brand': 'Outside the guideline', sent: 'Saved for Primary' };

// A card with its picture edge to edge on top, then its words.
function Card({ art, children, asked }: { art: ReactNode; children: ReactNode; asked?: boolean }) {
  return <li className="pb-rc-idea" data-asked={asked || undefined}><div className="pb-rc-idea-art">{art}</div><div className="pb-rc-body">{children}</div></li>;
}
function Preview({ brand, v, label }: { brand: Brand; v: { layout: string; params: Params } | null; label: string }) {
  const t = v ? brand.TBY[v.layout] : null;
  if (!t) return null;
  const sizes = R.sizesOf(t), size = ['post-4-5', 'post-1-1', 'linkedin-4-5'].find((s) => sizes.includes(s));
  return <div className="pb-rc-prev"><SlideView t={t} p={E.sanitize(t, { ...E.defaults(t), ...v!.params, ...(size ? { format: size } : {}) })} label={label} /></div>;
}

export function BuildTool({ brand, store, role, ask, rail, frame, goTool, goMake }: { brand: Brand; store: RecipeStore; role: Role; ask: Ask | null; rail: (c?: ReactNode) => ReactNode; frame: Frame; goTool: (id: string) => void; goMake: (id: string, params?: Params) => void }) {
  const mine = ofBrand(store, brand);
  const requests = mine.filter((r) => r.status === 'request');
  const shownRequests = role.steward ? requests : requests.filter((r) => r.by === role.me);
  const sets = visibleRecipes(store, brand, role).filter((r) => r.status === 'approved');
  const builtIn: any[] = (brand as any).tools ?? [];
  const next = R.engineIdeasFor(brand.id, requests);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const result = useRef<HTMLDivElement>(null);
  const locked = store.mode === 'readonly' || store.mode === 'loading';
  const reveal = () => setTimeout(() => result.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);

  const check = async () => {
    const q = text.trim(); if (!q) return;
    setBusy(true); setVerdict(null);
    let v: Verdict = null;
    if (ask) { try { v = R.readVerdict(brand, mine, await ask.json(R.worthPrompt(brand, mine, q), { modelTier: 'default' }), q); } catch { v = null; } }
    if (!v) v = R.guessVerdict(brand, mine, q);
    setVerdict(v); setBusy(false); reveal();
  };
  const sendBrief = (b: Brief, idea = '') => {
    const now = Date.now();
    store.put({ id: E.uid(), brand: brand.id, status: 'request', name: b.name.slice(0, 40), about: b.what, base: '', inputs: [], fixed: {}, sizes: [], idea, by: role.me, createdAt: now, updatedAt: now, approvedAt: 0, uses: 0, lastUsed: 0, request: b.request ?? '', reason: b.why, brief: R.briefText(brand, b) });
  };
  const askFor = (i: any) => sendBrief({ name: i.name, from: i.from, what: i.what, why: i.why }, i.id);
  const setBrief = (patch: Partial<Brief>) => verdict?.brief && setVerdict({ ...verdict, brief: { ...verdict.brief, ...patch } });
  const toolName = (id?: string) => builtIn.find((t) => t.id === id)?.name ?? id;

  const verdictCard = verdict ? (
    <section className="pb-rc-verdict" data-verdict={verdict.verdict} aria-live="polite">
      <p className="pb-rc-eyebrow">{VERDICT_WORD[verdict.verdict]}</p>
      <p className="pb-rc-reason">{verdict.reason}</p>
      {verdict.verdict === 'engine' && verdict.brief ? (
        <div className="pb-rc-brief">
          <label className="pb-rc-eyebrow" htmlFor="pb-rc-bname">Tool</label>
          <input id="pb-rc-bname" className="pb-start-input" value={verdict.brief.name} maxLength={40} onChange={(e) => setBrief({ name: e.target.value })} />
          <label className="pb-rc-eyebrow" htmlFor="pb-rc-bwhat">What people would make with it</label>
          <textarea id="pb-rc-bwhat" className="pb-rc-input" rows={2} maxLength={240} value={verdict.brief.what} onChange={(e) => setBrief({ what: e.target.value })} />
          {verdict.brief.from ? <p className="pb-quiet">Builds on {verdict.brief.from} in the guideline.</p> : null}
        </div>
      ) : null}
      <div className="pb-rowbtns">
        {verdict.verdict === 'tool' ? <Btn variant="secondary" icon={<ArrowRight {...ICON} />} onClick={() => goTool(verdict.target!)}>Open {toolName(verdict.target)}</Btn> : null}
        {verdict.verdict === 'set' ? <Btn variant="secondary" icon={<ImageIcon {...ICON} />} onClick={() => goMake(verdict.target!)}>Open {brand.TBY[verdict.target!]?.name} in Make</Btn> : null}
        {verdict.verdict === 'engine' && verdict.brief ? (
          <>
            <CopyButton variant="secondary" icon={<Copy {...ICON} />} text={() => R.briefText(brand, verdict.brief!)}>Copy brief</CopyButton>
            <Btn variant="primary" icon={<Send {...ICON} />} disabled={locked || !verdict.brief.name.trim()} onClick={() => { sendBrief(verdict.brief!); setVerdict({ verdict: 'sent', reason: 'The brief is saved under Requests for Primary below. Nobody is notified yet: Primary picks requests up from this page, builds them on the brand’s own parts with Claude, and the finished tool appears here.' }); setText(''); }}>Save for Primary</Btn>
          </>
        ) : null}
      </div>
      {verdict.verdict === 'set' ? <p className="pb-quiet">To make it again and again at several sizes, choose Save as a set there.</p> : null}
    </section>
  ) : null;

  const main = (
    <div className="pb-page pb-page--wide pb-rc-build">
      <header className="pb-pagehead">
        <h1>Tools for {brand.name}</h1>
        <p>A tool turns part of {brand.name}’s own visual language into something people can make with, such as painting the guideline’s masks onto any photo. Primary builds tools on the brand’s own shapes, colours and textures, so new work stays on-brand. To repeat a layout at several sizes, save it as a set in Make.</p>
      </header>

      <section aria-labelledby="pb-rc-have">
        <h2 id="pb-rc-have" className="pb-rc-h2">{brand.name}’s tools <span className="pb-count">{builtIn.length}</span></h2>
        <ul className="pb-rc-ideas">
          {builtIn.map((x) => (
            <Card key={x.id} art={<Preview brand={brand} v={R.toolPreview(brand.id, x.id)} label={`Made with ${x.name}`} />}>
              <h3>{x.name}</h3>
              <p className="pb-rc-about">{x.use}</p>
              <Btn variant="secondary" icon={<ArrowRight {...ICON} />} onClick={() => goTool(x.id)}>Open</Btn>
            </Card>
          ))}
        </ul>
      </section>

      {next.length ? (
        <section aria-labelledby="pb-rc-next">
          <h2 id="pb-rc-next" className="pb-rc-h2">Could come next <span className="pb-count">{next.length}</span></h2>
          <p className="pb-quiet pb-rc-lede">Parts of the guideline that could become tools. The pictures show what the system draws today.</p>
          <ul className="pb-rc-ideas">
            {next.map((i: any) => (
              <Card key={i.id} asked={i.asked} art={<Preview brand={brand} v={i.preview} label={`Today’s ${brand.TBY[i.preview.layout]?.name}`} />}>
                <p className="pb-rc-eyebrow">From {i.from}</p>
                <h3>{i.name}</h3>
                <p className="pb-rc-about">{i.what}</p>
                <p className="pb-rc-why"><Sparkles {...ICON} size={14} aria-hidden="true" /> {i.why}</p>
                {i.asked ? <Chip kind="info">Asked for</Chip> : <Btn variant="secondary" icon={<Send {...ICON} />} disabled={locked} onClick={() => askFor(i)}>Ask Primary to build it</Btn>}
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="pb-rc-ask" aria-label="Describe a tool">
        <label htmlFor="pb-rc-ask" className="pb-rc-eyebrow">Something else in mind?</label>
        <textarea id="pb-rc-ask" className="pb-rc-input" rows={2} maxLength={400} value={text} placeholder="Describe what the tool would make, and which part of the guideline it comes from" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) check(); }} />
        <div className="pb-rc-askfoot">
          <span className="pb-quiet">{ask ? 'Claude checks it against the brand’s tools, sets and layouts, and the guideline.' : 'Claude is not available on this page, so requests are matched by their words.'}</span>
          <Btn variant="primary" icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Wand2 {...ICON} />} disabled={busy || !text.trim()} onClick={check}>{busy ? 'Checking' : 'Check it'}</Btn>
        </div>
      </section>
      <div ref={result} className="pb-rc-result">{verdictCard}</div>

      <section className="pb-rc-system" aria-labelledby="pb-rc-sys">
        <h2 id="pb-rc-sys" className="pb-rc-h2">Sets in Make</h2>
        <p className="pb-quiet">{sets.length ? `${sets.length} of ${R.RECIPE_LIMIT} sets in use: ${sets.map((r) => r.name).join(', ')}.` : `No sets yet. Any layout in Make can be saved as one.`} <button type="button" className="pb-inline-link" onClick={() => goMake(sets[0] ? `set:${sets[0].id}` : brand.T[0].id)}><Layers {...ICON} size={14} aria-hidden="true" /> Open Make</button></p>
        {shownRequests.length ? (
          <>
            <h3 className="pb-rc-h3">{role.steward ? 'Requests for Primary' : 'Your requests'} <span className="pb-count">{shownRequests.length}</span></h3>
            <ul className="pb-rc-list">
              {shownRequests.map((r) => (
                <li key={r.id}>
                  <span><b>{r.name}</b>{r.about ? <span className="pb-quiet"> · {r.about}</span> : null}</span>
                  <span className="pb-rc-listacts">
                    <CopyButton icon={<Copy {...ICON} />} label={`Copy the brief for ${r.name}`} text={() => r.brief || R.briefText(brand, { name: r.name, from: '', what: r.about || r.request || '', why: r.reason || '', request: r.request })} />
                    <button type="button" className="pb-inline-link" onClick={() => store.remove(r.id)}>{role.steward ? 'Dismiss' : 'Withdraw'}</button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </div>
  );
  return frame({ rail: rail(), railLabel: 'Tools', main, mainLabel: 'Build a tool', kind: 'doc' });
}
