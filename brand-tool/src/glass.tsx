// The Glass tool: telli's Soft Glass and patterns, drawn live from the guideline's own shapes and values.
// Any pattern in any colourway, with Figma's Glass controls, at any format, beside the guideline's render.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DialConfig } from 'dialkit';
import { Columns2, Download, Image as ImageIcon, Plus, Presentation, RotateCcw } from 'lucide-react';
import { ZachDialRoot } from './components/zach-ui/ZachDialRoot';
import { GLASS_COLOURS, GLASS_GROUPS, GLASS_PATTERNS, createGlass, glassControls, glassDefaults, glassLabel, loadWave, renderGlass } from './engine/telli-glass.js';
import * as E from './engine/index.js';
import { Btn, ICON, MenuButton, MenuItem, MenuSeparator, RailHead, RailItem, useDialKitController, type Brand, type Params, type Save } from './ui';
import type { Deck, DeckStore } from './decks';
import type { Frame } from './App';

type Tool = { id: string; name: string; use: string };
const FORMATS: Record<string, [number, number]> = { '16:9': [16, 9], '3:2': [3, 2], '1:1': [1, 1], '4:5': [4, 5], '9:16': [9, 16] };
const SIZES = [1920, 2560, 3840];

export function GlassTool({ brand, tool, rail, frame, save, decks, goMake, goDeck }: { brand: Brand; tool: Tool; rail: (children: React.ReactNode) => React.ReactNode; frame: Frame; save: Save; decks: DeckStore; goMake: (id: string, params?: Params) => void; goDeck: (deck: string, slide: string | null) => void }) {
  const IMG: Record<string, string> = (window as any).__TELLI_IMG ?? {}, META = (window as any).__TELLI_META ?? {};
  const [patId, setPatId] = useState<string>(GLASS_PATTERNS[0].id);
  const pat: any = GLASS_PATTERNS.find((p: any) => p.id === patId) ?? GLASS_PATTERNS[0];
  // Only the controls that do something for this pattern are shown; values carry over between patterns.
  const has = glassControls(pat), shape = `${has.texture}${has.logo}${has.fade}`;
  const config = useMemo(() => {
    const d = glassDefaults(GLASS_PATTERNS[0]);
    const field: Record<string, unknown> = {};
    if (has.texture) field.texture = [100, 0, 100, 1];
    field.grain = [100, 0, 100, 1]; field.zoom = [100, 100, 300, 5]; field['move across'] = [0, -100, 100, 1]; field['move down'] = [0, -100, 100, 1];
    if (has.logo) field.logomark = true;
    if (has.fade) field['edge fade'] = true;
    return {
      colour: { colourway: { type: 'select', options: GLASS_COLOURS.map((c: any) => ({ value: c.id, label: c.name })), default: GLASS_PATTERNS[0].colour } },
      // Refraction and depth reach past Figma's range so the glass can go further than the file.
      glass: { 'light angle': [d.angle, -180, 180, 1], light: [d.light, 0, 100, 1], refraction: [d.refraction, 0, 200, 1], depth: [d.depth, 1, 200, 1], dispersion: [d.dispersion, 0, 100, 1], frost: [d.frost, 0, 100, 1] },
      field,
      output: { format: { type: 'select', options: Object.keys(FORMATS).map((f) => ({ value: f, label: f })), default: '16:9' }, 'long edge': { type: 'select', options: SIZES.map((n) => ({ value: String(n), label: `${n} px` })), default: '2560' } },
    } as unknown as DialConfig;
  }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps
  const controller = useDialKitController('Glass', config, { id: `primary-brand:${brand.id}:tool:glass`, persist: false });
  const v: any = controller.values ?? {};
  const colour: any = GLASS_COLOURS.find((c: any) => c.id === v.colour?.colourway) ?? GLASS_COLOURS[0];
  const d0 = glassDefaults(pat);
  const glass = { angle: v.glass?.['light angle'] ?? d0.angle, light: v.glass?.light ?? d0.light, refraction: v.glass?.refraction ?? d0.refraction, depth: v.glass?.depth ?? d0.depth, dispersion: v.glass?.dispersion ?? d0.dispersion, frost: v.glass?.frost ?? d0.frost };
  const format: string = v.output?.format ?? '16:9', [fw, fh] = FORMATS[format] ?? FORMATS['16:9'];
  const opts = { pattern: pat, colour, glass, texture: has.texture ? (v.field?.texture ?? 100) / 100 : 1, grain: (v.field?.grain ?? 100) / 100, zoom: (v.field?.zoom ?? 100) / 100, panX: (v.field?.['move across'] ?? 0) / 100, panY: (v.field?.['move down'] ?? 0) / 100, logo: has.logo ? v.field?.logomark ?? true : true, fade: has.fade ? v.field?.['edge fade'] ?? true : true };
  const key = JSON.stringify({ ...opts, pattern: pat.id, colour: colour.id });

  // A new pattern brings its own glass values. The colourway stays if you picked one; otherwise it follows the pattern.
  const setColour = useRef<string>(GLASS_PATTERNS[0].colour), picked = useRef(false);
  useEffect(() => { const c = v.colour?.colourway; if (c && c !== setColour.current) { picked.current = true; setColour.current = c; } }, [v.colour?.colourway]);
  const choose = (p: any, keepColour = picked.current) => {
    if (!keepColour) picked.current = false;
    setPatId(p.id); const d = glassDefaults(p), c = keepColour ? v.colour?.colourway ?? p.colour : p.colour; setColour.current = c;
    controller.setValues({ colour: { colourway: c }, glass: { 'light angle': d.angle, light: d.light, refraction: d.refraction, depth: d.depth, dispersion: d.dispersion, frost: d.frost }, field: { zoom: 100, 'move across': 0, 'move down': 0 } } as never);
  };
  const asFile = Math.abs(glass.frost - d0.frost) < 0.5 && Math.abs(glass.depth - d0.depth) < 0.5 && glass.refraction === d0.refraction && Math.abs(glass.dispersion - d0.dispersion) < 0.5 && glass.angle === d0.angle && glass.light === d0.light;

  /* ---------- The live canvas ---------- */
  const stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), gl = useRef<any>(null);
  const [box, setBox] = useState<[number, number]>([0, 0]);
  const [state, setState] = useState<'loading' | 'ready' | 'none'>('loading');
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const refKey: string | undefined = pat.ref?.[colour.id], refSrc = refKey ? IMG[refKey] : undefined;
  const showRef = compare && !!refSrc;

  useEffect(() => {
    const el = stage.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox([el.clientWidth, el.clientHeight])); ro.observe(el); setBox([el.clientWidth, el.clientHeight]);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    let dead = false;
    loadWave(IMG.wave).then((wave: HTMLImageElement) => {
      if (dead || !canvas.current) return;
      try { gl.current = createGlass(canvas.current, wave, META.markPaths ?? []); } catch { gl.current = null; }
      setState(gl.current ? 'ready' : 'none');
    }).catch(() => setState('none'));
    return () => { dead = true; gl.current?.dispose(); gl.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit the format into the stage; side by side with the guideline's render when comparing.
  const pad = 32, gap = 16, cap = 28, ra = (pat.dw ?? 1920) / (pat.dh ?? 1080), la = fw / fh, stacked = showRef && box[0] < box[1] * 1.2;
  const W0 = Math.max(80, box[0] - pad * 2), H0 = Math.max(80, box[1] - pad * 2 - 56);
  let cw: number, ch: number, rw = 0, rh = 0;
  if (!showRef) { const sc = Math.min(W0 / fw, (H0 - cap) / fh); cw = fw * sc; ch = fh * sc; }
  else if (!stacked) { const h = Math.min(H0 - cap, (W0 - gap) / (ra + la)); ch = rh = h; cw = h * la; rw = h * ra; }
  else { const w = Math.min(W0, (H0 - gap - cap * 2) / (1 / ra + 1 / la)); cw = rw = w; ch = w / la; rh = w / ra; }
  cw = Math.max(40, Math.floor(cw)); ch = Math.max(40, Math.floor(ch)); rw = Math.floor(rw); rh = Math.floor(rh);
  useEffect(() => {
    const c = canvas.current; if (!c || state !== 'ready' || !gl.current) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), k = Math.min(dpr, 1600 / Math.max(cw, ch));
    const W = Math.max(2, Math.round(cw * k)), H = Math.max(2, Math.round(ch * k));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const id = requestAnimationFrame(() => { try { gl.current?.render(opts); } catch { setState('none'); } });
    return () => cancelAnimationFrame(id);
  }, [key, cw, ch, state]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Into Make and Decks: the Pattern layout and slide draw the same glass, with these settings ---------- */
  const carried = (): Params => ({
    pattern: glassLabel(pat), colourway: colour.id === pat.colour ? 'Pattern’s own' : colour.name,
    glass: { for: pat.id, glass, texture: opts.texture, grain: opts.grain, zoom: opts.zoom, panX: opts.panX, panY: opts.panY, logo: opts.logo, fade: opts.fade } as never,
  });
  const toMake = () => {
    const fmtId = ({ ...E.FORMAT_ALIAS, '3:2': 'postcard-6-4' } as Record<string, string>)[format], t = brand.TBY['telli-pattern'];
    goMake('telli-pattern', { ...carried(), ...(fmtId && t?.params.format.options[fmtId] ? { format: fmtId } : {}) });
  };
  const brandDecks = Object.values(decks.decks).filter((d) => d.brand === brand.id).sort((a, b) => a.createdAt - b.createdAt);
  const toDeck = (target: Deck | null) => {
    const sl = brand.SLBY['sl-telli-pattern']; if (!sl) return;
    const slide = { id: E.uid(), layout: sl.id, params: E.sanitize(sl, carried()) }, now = Date.now();
    if (target) decks.update(target.id, (d) => ({ ...d, slides: [...d.slides, slide], updatedAt: now }));
    else { const taken = new Set(brandDecks.map((d) => d.name)); let name = 'Glass patterns', k = 2; while (taken.has(name)) name = `Glass patterns ${k++}`; target = { id: E.uid(), name, brand: brand.id, slides: [slide], createdAt: now, updatedAt: now }; decks.put(target); }
    goDeck(target.id, slide.id);
  };
  const decksReady = decks.mode === 'shared' || decks.mode === 'local';

  const doExport = async () => {
    setBusy(true); setNote('');
    try {
      const long = +(v.output?.['long edge'] ?? 2560), w = fw >= fh ? long : Math.round((long * fw) / fh), h = fw >= fh ? Math.round((long * fh) / fw) : long;
      const blob = await renderGlass(opts, w, h, IMG.wave, META.markPaths ?? []);
      if (!blob) throw new Error('empty');
      await save(`${brand.id}-glass-${pat.id}-${colour.id}-${w}x${h}.png`, blob);
    } catch { setNote('The image could not be exported. Try a smaller size.'); }
    setBusy(false);
  };

  const thumb = (p: any) => { const k = p.ref?.[p.colour]; return k && IMG[k] ? <img className="pb-gt-thumb" src={IMG[k]} alt="" /> : <span className="pb-gt-thumb" />; };
  const railEl = rail(
    <div className="pb-railblock pb-railblock--fill">
      <RailHead>Patterns <span className="pb-count">{GLASS_PATTERNS.length}</span></RailHead>
      {(GLASS_GROUPS as string[]).map((g) => (
        <div key={g} className="pb-gtfam">
          <h3 className="pb-gtgroup" id={`pb-gtg-${g.replace(/\W+/g, '-')}`}>{g}</h3>
          <ul className="pb-raillist" aria-labelledby={`pb-gtg-${g.replace(/\W+/g, '-')}`}>
            {GLASS_PATTERNS.filter((p: any) => p.group === g).map((p: any) => (
              <RailItem key={p.id} current={p.id === pat.id} lead={thumb(p)} meta={p.frame} onClick={() => choose(p)}>
                <span className="pb-gt-v">{p.variant}</span><span className="pb-gt-n">{p.name}</span>
              </RailItem>
            ))}
          </ul>
        </div>
      ))}
    </div>,
  );
  const inspector = (
    <>
      <div className="pb-insphead">
        <div><h2>{tool.name}</h2><p>{pat.group} · {pat.variant} · frame {pat.frame}</p></div>
        <Btn icon={<RotateCcw {...ICON} />} label="Back to the guideline’s values" onClick={() => { choose(pat, false); controller.setValues({ field: { ...(has.texture ? { texture: 100 } : {}), grain: 100, ...(has.logo ? { logomark: true } : {}), ...(has.fade ? { 'edge fade': true } : {}) } } as never); }} />
      </div>
      <div className="pb-dials"><ZachDialRoot /></div>
      <div className="pb-inspblock pb-inspfoot">
        <p className="pb-quiet">{asFile ? `Glass values as in frame ${pat.frame}.` : `Glass values changed from frame ${pat.frame}.`} At {pat.dw && pat.dw !== 1920 ? `${pat.dw}×${pat.dh}` : '16:9'} the shapes sit as in the file; other formats rebuild the composition from the same shapes. The glass is a rebuild of Figma’s Glass effect, so compare before client use.</p>
      </div>
    </>
  );
  const actions = (
    <>
      <Btn icon={<ImageIcon {...ICON} />} onClick={toMake} title="Open the Pattern layout in Make with this pattern, colourway and glass">Use in Make</Btn>
      <MenuButton className="pb-actmenu" label="Add to deck" align="end" disabled={!decksReady} trigger={<><Presentation {...ICON} /><span className="pb-btn-label">Add to deck</span></>}>
        {brandDecks.map((d) => <MenuItem key={d.id} hint={`${d.slides.length}`} onClick={() => toDeck(d)}>{d.name}</MenuItem>)}
        {brandDecks.length ? <MenuSeparator /> : null}
        <MenuItem onClick={() => toDeck(null)}><Plus {...ICON} size={14} /> New deck</MenuItem>
      </MenuButton>
      <Btn icon={<Columns2 {...ICON} />} aria-pressed={compare} variant={compare ? 'secondary' : 'ghost'} title={refSrc ? undefined : 'The guideline has no render of this pattern in this colour'} onClick={() => setCompare(!compare)}>Compare</Btn>
      <Btn variant="primary" icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy || state !== 'ready'} onClick={doExport}>{busy ? 'Rendering' : 'Export PNG'}</Btn>
    </>
  );
  const main = (
    <div className="pb-canvas pb-gt" ref={stage}>
      <div className="pb-gt-row" data-stacked={stacked || undefined}>
        {showRef ? (
          <figure className="pb-gt-fig" style={{ width: rw }}>
            <div className="pb-gt-art" style={{ width: rw, height: rh }}><img src={refSrc} alt={`The guideline’s render of ${pat.name} in ${colour.name}`} /></div>
            <figcaption><span>Guideline render</span><span>Frame {pat.frame} · {pat.dw && pat.dw !== 1920 ? `${pat.dw}×${pat.dh}` : '16:9'}</span></figcaption>
          </figure>
        ) : null}
        <figure className="pb-gt-fig" style={{ width: cw }}>
          <div className="pb-gt-art" style={{ width: cw, height: ch }}>
            <canvas ref={canvas} role="img" aria-label={`${pat.name} in ${colour.name}, drawn live`} style={{ width: cw, height: ch }} />
            {state === 'loading' ? <p className="pb-gt-msg" role="status">Building the glass…</p> : null}
            {state === 'none' ? <p className="pb-gt-msg" role="alert">This browser can’t draw the glass (it needs WebGL 2). The guideline’s renders are in the guideline, under Graphic system.</p> : null}
          </div>
          <figcaption><span>{pat.group} · {pat.variant === pat.group ? 'Standard' : pat.variant} · {colour.name}</span><span>{format} · live</span></figcaption>
        </figure>
      </div>
      {compare && !refSrc ? <p className="pb-gt-foot" role="status">The guideline has no render of {pat.name} in {colour.name}, so there is nothing to compare with.</p> : null}
      {note ? <p className="pb-tool-note" role="alert">{note}</p> : null}
    </div>
  );
  return frame({ actions, rail: railEl, railLabel: 'Tools and patterns', inspector, inspectorLabel: 'Glass properties', main, mainLabel: 'Glass', kind: 'canvas' });
}
