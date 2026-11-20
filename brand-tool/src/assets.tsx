// Assets: the files a brand's guideline names but does not contain, such as font files, vector logos and a
// texture. Each brand declares slots for them (engine: `slots`). A file added here is used everywhere at once:
// guideline pages, layouts, decks, exports and the agent package. The review item a slot answers closes itself.
// Files live in the page's asset store and the slot records in its shared database, so everyone sees the same
// brand. Review decisions made by a person are kept there too, with who made them and when.
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ArrowUpRight, FileText, Trash2, Upload } from 'lucide-react';
import * as E from './engine/index.js';
import { Btn, Chip, ICON, MenuButton, MenuItem, RailHead, RailItem, type Brand } from './ui';
import type { Frame } from './App';
import type { StoreMode } from './decks';

type Slot = { id: string; kind: 'font' | 'svg' | 'image' | 'files'; group: string; label: string; family?: string; use: string; standIn?: string; resolves?: string; required?: boolean; many?: boolean; weights?: number[]; cssVar?: string; ratioVar?: string };
export type FileRec = { id: string; name: string; type: string; size: number; weight?: number; style?: 'normal' | 'italic'; ratio?: number };
type SlotDoc = { brand: string; slot: string; files: FileRec[]; licence?: string; by?: string; at?: number };
type Decision = { brand: string; flag: string; by?: string; at: number };

export type BrandFiles = {
  mode: StoreMode;
  canUpload: boolean;
  why: string;
  version: number;
  names: Record<string, string>;
  slot: (b: Brand, id: string) => SlotDoc | undefined;
  data: (fileId: string) => string | undefined;
  upload: (b: Brand, slot: Slot, files: File[]) => Promise<string>;
  remove: (b: Brand, slot: Slot, fileId: string) => void;
  patch: (b: Brand, slot: Slot, fn: (d: SlotDoc) => SlotDoc) => void;
  decision: (b: Brand, flag: string) => Decision | undefined;
  toggle: (b: Brand, flag: string) => void;
};

const slotKey = (b: string, s: string) => `${b}--${s}`;
const LOCAL_REVIEW = 'primary-brand-review';
const MAX = { font: 10, svg: 2, image: 20, files: 20 } as const; // MiB per file
const FONT_TYPES: Record<string, string> = { woff2: 'font/woff2', woff: 'font/woff', otf: 'font/otf', ttf: 'font/ttf' };
const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
const ext = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
const accepted = (s: Slot): Record<string, string> =>
  s.kind === 'font' ? FONT_TYPES : s.kind === 'svg' ? { svg: 'image/svg+xml' } : s.kind === 'image' ? IMAGE_TYPES : { svg: 'image/svg+xml', ...IMAGE_TYPES, pdf: 'application/pdf' };
const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const WEIGHT_NAME: Record<number, string> = { 100: 'Thin', 200: 'Extra light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black' };

// Read the weight and style a font file's name suggests: "Roobert-SemiBoldItalic.woff2" is 600 italic.
export function guessFace(name: string): { weight: number; style: 'normal' | 'italic' } {
  const n = name.toLowerCase().replace(/[\s_-]/g, '');
  const pairs: [RegExp, number][] = [[/hairline|thin/, 100], [/extralight|ultralight/, 200], [/semibold|demibold/, 600], [/extrabold|ultrabold/, 800], [/light/, 300], [/medium/, 500], [/bold/, 700], [/black|heavy/, 900]];
  return { weight: pairs.find(([r]) => r.test(n))?.[1] ?? 400, style: /italic|oblique/.test(n) ? 'italic' : 'normal' };
}

const readData = (blob: Blob) => new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.onerror = () => no(r.error); r.readAsDataURL(blob); });

// The proportions a logo is drawn at: the SVG's viewBox, else its width and height; a raster's pixel size.
async function ratioOf(file: File): Promise<number | undefined> {
  try {
    if (file.type === 'image/svg+xml' || ext(file.name) === 'svg') {
      const doc = new DOMParser().parseFromString(await file.text(), 'image/svg+xml').documentElement;
      const vb = doc.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
      if (vb?.length === 4 && vb[2] > 0 && vb[3] > 0) return vb[2] / vb[3];
      const w = parseFloat(doc.getAttribute('width') ?? ''), h = parseFloat(doc.getAttribute('height') ?? '');
      return w > 0 && h > 0 ? w / h : undefined;
    }
    const bmp = await createImageBitmap(file);
    const r = bmp.width / bmp.height;
    bmp.close();
    return r;
  } catch { return undefined; }
}

/* ---------- Store ---------- */

export function useBrandFiles(): BrandFiles {
  const [slots, setSlots] = useState<Record<string, SlotDoc>>({});
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => { try { return JSON.parse(localStorage.getItem(LOCAL_REVIEW) || '{}') ?? {}; } catch { return {}; } });
  const [blobs, setBlobs] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<StoreMode>('loading');
  const [canUpload, setCanUpload] = useState(false);
  const [why, setWhy] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});
  const [version, setVersion] = useState(0);
  const db = useRef<any>(null), store = useRef<any>(null), me = useRef<string>(''), people = useRef<any>(null), modeRef = useRef<StoreMode>('loading'), loading = useRef(new Set<string>());
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useEffect(() => {
    let dead = false;
    const offs: (() => void)[] = [];
    (async () => {
      const claude = (window as any).claude;
      let d: any = null, a: any = null, u: any = null;
      try { d = await claude?.use?.('db'); } catch { d = null; }
      try { a = await claude?.use?.('assets'); } catch { a = null; }
      try { u = await claude?.use?.('user'); } catch { u = null; }
      if (dead) return;
      people.current = u;
      try { me.current = (await u?.id?.()) ?? ''; } catch { me.current = ''; }
      if (!d) {
        modeRef.current = 'local'; setMode('local'); setCanUpload(true);
        setWhy('Files are kept for this visit only. On the published page they are saved for everyone.');
        return;
      }
      db.current = d; store.current = a;
      let can: boolean | null = null;
      try { can = await u?.can?.('data.write'); } catch { can = null; }
      if (dead) return;
      const m: StoreMode = can === false ? 'readonly' : 'shared';
      modeRef.current = m; setMode(m);
      setCanUpload(m === 'shared' && !!a);
      setWhy(m === 'readonly' ? 'View only: you can see the brand’s files but not change them.' : !a ? 'Only editors of this page can add files.' : 'Files are saved for everyone on this page.');
      offs.push(d.collection('brandassets').onSnapshot((snap: any) => {
        const next: Record<string, SlotDoc> = {};
        for (const doc of snap.docs) { const v = doc.data(); if (v && Array.isArray(v.files)) next[doc.id] = { ...v, files: v.files.filter((f: any) => f && typeof f.id === 'string').slice(0, 24) }; }
        setSlots(next);
      }, () => undefined));
      offs.push(d.collection('review').onSnapshot((snap: any) => {
        const next: Record<string, Decision> = {};
        for (const doc of snap.docs) { const v = doc.data(); if (v && typeof v.flag === 'string') next[doc.id] = v; }
        setDecisions(next);
      }, () => undefined));
    })();
    return () => { dead = true; offs.forEach((f) => f()); };
  }, []);

  // Fetch each stored file once, as data the brand surfaces and image exports can embed.
  useEffect(() => {
    if (modeRef.current === 'local') return;
    for (const doc of Object.values(slots)) for (const f of doc.files) {
      if (blobs[f.id] || loading.current.has(f.id)) continue;
      loading.current.add(f.id);
      fetch(`/_blob/${f.id}`).then((r) => (r.ok ? r.blob() : Promise.reject(r.status))).then(readData)
        .then((data) => setBlobs((prev) => ({ ...prev, [f.id]: data })))
        .catch(() => loading.current.delete(f.id));
    }
  }, [slots, blobs]);

  // Names for "accepted by" lines.
  useEffect(() => {
    const ids = [...new Set(Object.values(decisions).map((d) => d.by).filter((x): x is string => !!x && !names[x]))];
    if (!ids.length || !people.current?.profiles) return;
    people.current.profiles(ids).then((ps: any) => setNames((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, ps?.[id]?.name || 'Someone'])) }))).catch(() => undefined);
  }, [decisions, names]);

  // Hand every brand its files and decisions; the engine rewrites the brand's CSS and package.
  useEffect(() => {
    for (const B of E.BRANDS as Brand[]) {
      const assets: Record<string, any> = {};
      for (const s of ((B as any).slots ?? []) as Slot[]) {
        const doc = slots[slotKey(B.id, s.id)];
        if (doc?.files.length) assets[s.id] = { licence: doc.licence, files: doc.files.map((f) => ({ ...f, data: blobs[f.id] })) };
      }
      E.applyAssets(B, assets);
      E.applyReview(B, Object.fromEntries(Object.values(decisions).filter((d) => d.brand === B.id).map((d) => [d.flag, { by: d.by, at: d.at }])));
    }
    setVersion((n) => n + 1);
    // Text on brand surfaces re-measures once newly added faces have loaded.
    document.fonts?.ready.then(() => setVersion((n) => n + 1));
  }, [slots, blobs, decisions]);

  const writeSlot = useCallback(async (doc: SlotDoc) => {
    const key = slotKey(doc.brand, doc.slot);
    setSlots((prev) => { const next = { ...prev }; if (doc.files.length) next[key] = doc; else delete next[key]; return next; });
    if (modeRef.current !== 'shared' || !db.current) return;
    const ref = db.current.doc(`brandassets/${key}`);
    if (doc.files.length) await ref.set(doc); else await ref.delete();
  }, []);

  const upload = useCallback(async (b: Brand, s: Slot, list: File[]): Promise<string> => {
    if (!list.length) return '';
    const types = accepted(s);
    const current = slotsRef.current[slotKey(b.id, s.id)];
    const room = s.kind === 'font' ? 8 : s.many ? 24 : 1;
    const take = s.many || s.kind === 'font' ? list.slice(0, Math.max(0, room - (current?.files.length ?? 0))) : list.slice(0, 1);
    if (!take.length) return `This slot holds ${room} files at most.`;
    const added: FileRec[] = [];
    for (const file of take) {
      const type = types[ext(file.name)];
      if (!type) return `${file.name} isn’t a ${Object.keys(types).map((t) => `.${t}`).join(', ')} file.`;
      if (file.size > MAX[s.kind] * 1048576) return `${file.name} is over ${MAX[s.kind]} MB.`;
      const face = s.kind === 'font' ? guessFace(file.name) : null;
      const ratio = s.kind === 'svg' || s.kind === 'image' ? await ratioOf(file) : undefined;
      let id: string;
      if (modeRef.current === 'local') {
        id = E.uid();
        const data = await readData(file);
        setBlobs((prev) => ({ ...prev, [id]: data }));
      } else {
        if (!store.current) return 'Only editors of this page can add files.';
        try {
          const res = await store.current.upload(file, { type });
          id = res.id;
          const data = await readData(file);
          setBlobs((prev) => ({ ...prev, [id]: data }));
        } catch (error: any) {
          return error?.code === 'too_large' ? `${file.name} is too large to store.` : error?.code === 'unsupported_type' ? `${file.name} isn’t a file type the page can store.` : error?.code === 'quota_exceeded' ? 'The page’s file storage is full.' : `${file.name} could not be saved. Try again.`;
        }
      }
      added.push({ id, name: file.name.slice(0, 120), type, size: file.size, ...(face ?? {}), ...(ratio ? { ratio: Math.round(ratio * 10000) / 10000 } : {}) });
    }
    const replaced = s.many || s.kind === 'font' ? [] : current?.files ?? [];
    const files = s.many || s.kind === 'font' ? [...(current?.files ?? []), ...added] : added;
    await writeSlot({ brand: b.id, slot: s.id, files, licence: current?.licence ?? (s.kind === 'font' ? 'trial' : undefined), by: me.current || undefined, at: Date.now() });
    for (const f of replaced) store.current?.delete?.(f.id).catch(() => undefined);
    return '';
  }, [writeSlot]);

  const patch = useCallback((b: Brand, s: Slot, fn: (d: SlotDoc) => SlotDoc) => {
    const cur = slotsRef.current[slotKey(b.id, s.id)];
    if (!cur) return;
    void writeSlot({ ...fn(cur), by: me.current || undefined, at: Date.now() });
  }, [writeSlot]);

  const remove = useCallback((b: Brand, s: Slot, fileId: string) => {
    patch(b, s, (d) => ({ ...d, files: d.files.filter((f) => f.id !== fileId) }));
    store.current?.delete?.(fileId).catch(() => undefined);
  }, [patch]);

  const decisionsRef = useRef(decisions);
  decisionsRef.current = decisions;
  const toggle = useCallback((b: Brand, flag: string) => {
    const key = slotKey(b.id, flag);
    const next = { ...decisionsRef.current };
    const on = !next[key];
    if (on) next[key] = { brand: b.id, flag, by: me.current || undefined, at: Date.now() }; else delete next[key];
    setDecisions(next);
    if (modeRef.current === 'shared' && db.current) {
      const ref = db.current.doc(`review/${key}`);
      (on ? ref.set(next[key]) : ref.delete()).catch(() => undefined);
    } else if (modeRef.current === 'local') {
      try { localStorage.setItem(LOCAL_REVIEW, JSON.stringify(next)); } catch { /* this visit only */ }
    }
  }, []);

  return useMemo(() => ({
    mode, canUpload, why, version, names,
    slot: (b, id) => slots[slotKey(b.id, id)],
    data: (id) => blobs[id],
    upload, remove, patch,
    decision: (b, flag) => decisions[slotKey(b.id, flag)],
    toggle,
  }), [mode, canUpload, why, version, names, slots, blobs, decisions, upload, remove, patch, toggle]);
}

/* ---------- Assets view ---------- */

const STATUS: Record<string, string> = { missing: 'Missing', 'stand-in': 'Stand-in in use', trial: 'Trial files', supplied: 'Added' };
const SHORT: Record<string, string> = { missing: 'Missing', 'stand-in': 'Stand-in', trial: 'Trial', supplied: 'Added' };
const lightTone = (b: Brand) => Object.values(b.TONES).reduce((best: any, t: any) => (E.lum(t.g) > E.lum(best.g) ? t : best));

function Preview({ brand, slot, files, store }: { brand: Brand; slot: Slot; files: FileRec[]; store: BrandFiles }) {
  const tone: any = lightTone(brand);
  const surface = { background: tone.g, color: tone.i };
  if (slot.kind === 'font') {
    const faces = files.length ? [...new Set(files.map((f) => `${f.weight ?? 400}:${f.style ?? 'normal'}`))] : ['400:normal'];
    return (
      <div className="pb-slot-preview a" data-brand={brand.id} style={surface}>
        {faces.slice(0, 4).map((k) => { const [w, st] = k.split(':'); return <span key={k} className="pb-slot-specimen" style={{ fontFamily: `"${slot.family}", "${slot.standIn}", sans-serif`, fontWeight: +w, fontStyle: st }}>Aa Gg Rr 0123</span>; })}
        <span className="pb-slot-caption">{files.length ? `${slot.family}` : `Shown in ${slot.standIn} until files are added`}</span>
      </div>
    );
  }
  if (slot.kind === 'files') {
    return files.length ? (
      <div className="pb-slot-grid">
        {files.slice(0, 12).map((f) => { const d = store.data(f.id); return <figure key={f.id}>{d && f.type.startsWith('image') ? <img src={d} alt="" /> : <FileText {...ICON} size={20} />}<figcaption>{f.name}</figcaption></figure>; })}
      </div>
    ) : null;
  }
  // A logo is drawn the way layouts draw it, as a mask in the brand's ink; a texture or stroke as an image.
  return (
    <div className="pb-slot-preview pb-slot-preview--art a" data-brand={brand.id} style={surface}>
      {slot.kind === 'svg'
        ? <i className="a-msk pb-slot-logo" style={{ ['--src' as string]: `var(${slot.cssVar})`, aspectRatio: `var(${slot.ratioVar}, 3)` }} />
        : <div className="pb-slot-image" style={{ backgroundImage: `var(${slot.cssVar})` }} />}
      <span className="pb-slot-caption">{files.length ? files[0].name : slot.standIn}</span>
    </div>
  );
}

function SlotCard({ brand, slot, store, goReview }: { brand: Brand; slot: Slot; store: BrandFiles; goReview: () => void }) {
  const doc = store.slot(brand, slot.id);
  const files = doc?.files ?? [];
  const status = E.slotStatus(brand, slot);
  const flag = slot.resolves ? brand.BRAND.flags.find((f: any) => f.id === slot.resolves) : null;
  const flagState = flag ? E.flagStatus(brand, flag) : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const types = accepted(slot);
  const add = async (list: File[]) => { setBusy(true); setError(''); setError(await store.upload(brand, slot, list)); setBusy(false); };
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); if (store.canUpload) void add([...e.dataTransfer.files]); };
  const multiple = slot.kind === 'font' || !!slot.many;
  return (
    <article className="pb-slot" id={`slot-${slot.id}`} data-status={status} data-over={over || undefined}
      onDragOver={(e) => { if (store.canUpload) { e.preventDefault(); setOver(true); } }} onDragLeave={() => setOver(false)} onDrop={drop}>
      <header className="pb-slot-head">
        <div>
          <h2>{slot.label}</h2>
          <p>{slot.use}</p>
        </div>
        <span className="pb-chips">
          {slot.required === false ? <Chip kind="page">Optional</Chip> : null}
          <Chip kind={status === 'supplied' ? 'done' : status === 'trial' ? 'check' : 'need'}>{STATUS[status]}</Chip>
        </span>
      </header>
      <Preview brand={brand} slot={slot} files={files} store={store} />
      {files.length ? (
        <ul className="pb-slot-files">
          {files.map((f) => (
            <li key={f.id}>
              <span className="pb-slot-file">{f.name}</span>
              <span className="pb-slot-meta">{fmtSize(f.size)}</span>
              {slot.kind === 'font' ? (
                <MenuButton className="pb-slot-weight" label={`Weight of ${f.name}`} align="end" trigger={<span>{WEIGHT_NAME[f.weight ?? 400]}{f.style === 'italic' ? ' italic' : ''}</span>}>
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
                    <MenuItem key={w} current={(f.weight ?? 400) === w} hint={String(w)} onClick={() => store.patch(brand, slot, (d) => ({ ...d, files: d.files.map((x) => (x.id === f.id ? { ...x, weight: w } : x)) }))}>{WEIGHT_NAME[w]}</MenuItem>
                  ))}
                  <MenuItem current={f.style === 'italic'} onClick={() => store.patch(brand, slot, (d) => ({ ...d, files: d.files.map((x) => (x.id === f.id ? { ...x, style: x.style === 'italic' ? 'normal' : 'italic' } : x)) }))}>Italic</MenuItem>
                </MenuButton>
              ) : null}
              <Btn icon={<Trash2 {...ICON} size={14} />} label={`Remove ${f.name}`} disabled={!store.canUpload} onClick={() => store.remove(brand, slot, f.id)} />
            </li>
          ))}
        </ul>
      ) : null}
      {slot.kind === 'font' && files.length ? (
        <div className="pb-slot-licence" role="radiogroup" aria-label={`${slot.label} licence`}>
          <span className="pb-insplabel">Licence</span>
          {Object.entries(E.LICENCES as Record<string, string>).map(([k, name]) => (
            <button key={k} type="button" role="radio" aria-checked={(doc?.licence ?? 'trial') === k} disabled={!store.canUpload} onClick={() => store.patch(brand, slot, (d) => ({ ...d, licence: k }))}>{name}</button>
          ))}
          <p className="pb-quiet">{(doc?.licence ?? 'trial') === 'trial' ? 'Trial files are for designing. Layouts warn before export, and the brand kit marks them not for delivery.' : 'Licensed. Layouts, exports and the brand kit use these files.'}</p>
        </div>
      ) : null}
      <footer className="pb-slot-foot">
        <input ref={input} type="file" hidden multiple={multiple} accept={Object.keys(types).map((t) => `.${t}`).join(',')} onChange={(e) => { const l = [...(e.target.files ?? [])]; e.target.value = ''; void add(l); }} />
        <Btn variant={files.length ? 'secondary' : 'primary'} icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Upload {...ICON} />} disabled={!store.canUpload || busy} onClick={() => input.current?.click()}>
          {busy ? 'Adding' : files.length && !multiple ? 'Replace' : files.length ? 'Add more' : 'Add files'}
        </Btn>
        <span className="pb-quiet">{Object.keys(types).map((t) => `.${t}`).join(' ')}{multiple ? ' · drop several' : ''}</span>
        {flag ? (
          <button type="button" className="pb-slot-flag" onClick={goReview} data-state={flagState?.state}>
            {flagState?.state === 'open' ? 'Answers' : 'Answered'}: {flag.title}<ArrowUpRight {...ICON} size={14} />
          </button>
        ) : null}
      </footer>
      {error ? <p className="pb-slot-error" role="alert">{error}</p> : null}
    </article>
  );
}

export function AssetsView({ brand, store, frame, goReview, focus }: { brand: Brand; store: BrandFiles; frame: Frame; goReview: () => void; focus?: string }) {
  const slots: Slot[] = (brand as any).slots ?? [];
  const groups = [...new Set(slots.map((s) => s.group))];
  const status = (s: Slot) => E.slotStatus(brand, s);
  const missing = slots.filter((s) => s.required !== false && status(s) !== 'supplied').length;
  useEffect(() => { if (focus) document.getElementById(`slot-${focus}`)?.scrollIntoView({ block: 'start' }); }, [focus]);
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const rail = (
    <>
      {groups.map((g) => (
        <div className="pb-railblock" key={g}>
          <RailHead>{g}</RailHead>
          <ul className="pb-raillist">
            {slots.filter((s) => s.group === g).map((s) => <RailItem key={s.id} meta={SHORT[status(s)]} lead={<span className="pb-slotdot" data-status={status(s)} aria-hidden="true" />} onClick={() => go(`slot-${s.id}`)}>{s.label}</RailItem>)}
          </ul>
        </div>
      ))}
      <p className="pb-railnote pb-railfoot" role="status">{store.mode === 'loading' ? 'Loading files…' : store.why}</p>
    </>
  );
  const main = (
    <div className="pb-page">
      <header className="pb-pagehead">
        <h1>Assets</h1>
        <p>Files the guideline names but doesn’t contain. Add one and the guideline, every layout, deck and export, and the agent package use it straight away. The review item it answers closes itself.</p>
        <p className="pb-quiet">{missing ? `${missing} required ${missing === 1 ? 'file is' : 'files are'} still missing or a stand-in.` : 'Every required file is here.'}</p>
      </header>
      {slots.length ? groups.map((g) => (
        <section key={g} className="pb-slotgroup" aria-labelledby={`slotgroup-${g}`}>
          <h2 id={`slotgroup-${g}`} className="pb-insplabel">{g}</h2>
          {slots.filter((s) => s.group === g).map((s) => <SlotCard key={s.id} brand={brand} slot={s} store={store} goReview={goReview} />)}
        </section>
      )) : <div className="pb-empty pb-empty--inline"><h2>No files are needed</h2><p>This brand’s guideline carries everything the package uses.</p></div>}
    </div>
  );
  return frame({ rail, railLabel: 'Asset slots', main, mainLabel: 'Assets', kind: 'doc' });
}
