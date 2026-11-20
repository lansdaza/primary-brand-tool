// The Painterly studio: Small Door Vet's painterly system (guideline 4.1 and 4.2) as a tool.
// Editorial mask: the guideline's own painted shapes (bandana, ears, painted card), traced from the file, placed on
// any dog photograph. Brush illustration: dry-brush pet objects, enlarged and cropped into backgrounds, as stills or
// painted on stroke by stroke as video (the first tool built from a request on the Build a tool page).
// Shapes are kept in the photograph's own coordinates, so they stay on the dog when the format or crop changes.
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import type { DialConfig } from 'dialkit';
import { Download, Film, FolderPlus, ImagePlus, Paintbrush, Play, Plus, RotateCcw, Shuffle, Sparkles, Square, Trash2, Wand2 } from 'lucide-react';
import { ZachDialRoot } from './components/zach-ui/ZachDialRoot';
import { MASK_SHAPES, PAINT_COMPS, mixHex, paintBrush, paintMask, photoRectOf } from './engine/sdv-paint.js';
import { recordCanvas } from './engine/video.js';
import * as E from './engine/index.js';
import { Btn, ICON, MenuButton, MenuItem, RailHead, RailItem, useDialKitController, type Ask, type Brand, type Save } from './ui';
import type { Frame } from './App';
import type { BrandFiles } from './assets';

type Tool = { id: string; name: string; use: string };
type Shape = { id: string; shape: string; px: number; py: number; psize: number; rot: number; colour: string; flip: boolean; behind: boolean; seed: number };
const FORMATS: Record<string, [number, number]> = { '4:5': [4, 5], '3:4': [3, 4], '1:1': [1, 1], '9:16': [9, 16], '16:9': [16, 9], '3:2': [3, 2] };
const SIZES = [1080, 2160, 3240];
// Video is made at 1080 on the short side, the size social platforms ask for.
const VIDEO: Record<string, [number, number]> = { '4:5': [1080, 1350], '3:4': [1080, 1440], '1:1': [1080, 1080], '9:16': [1080, 1920], '16:9': [1920, 1080], '3:2': [1620, 1080] };
const VIDEO_SET: [string, string][] = [['4:5', 'Post'], ['9:16', 'Story'], ['16:9', 'Widescreen']];
const FPS = 30;
const ACC: [string, string][] = [['Orange', '#FFAA4D'], ['Rust', '#CB6015'], ['Butter', '#FFEA86'], ['Camel', '#C59B61'], ['Sage', '#B9C3A8'], ['Periwinkle', '#C4CDEB'], ['Lilac', '#BDB1EB'], ['White', '#FDFDFD'], ['Brand black', '#1D1916']];
const INKS: [string, string][] = [['Tone on tone', 'tone'], ['Grey', '#4B4B48'], ['Brand black', '#1D1916'], ['Rust', '#CB6015'], ['Orange', '#FFAA4D'], ['White', '#FDFDFD']];
const uid = () => Math.random().toString(36).slice(2, 9);
const SHAPE_BY = Object.fromEntries(MASK_SHAPES.map((s: any) => [s.id, s]));

// Starting points: the guideline's own compositions, placed where the file places them (4.1, and frames 803, 805).
const MASK_PRESETS = [
  { id: 'terrier', name: 'Terrier with bandana', from: '4.1', photo: 'clean-terrier', format: '3:4', ground: 'black', s: { inset: 10, extend: 0, zoom: 100, fx: 50, fy: 50 }, shapes: [{ shape: 'bandana', px: 0.506, py: 0.503, psize: 0.467, colour: '#FFAA4D' }] },
  { id: 'doberman', name: 'Doberman with ears', from: '4.1', photo: 'clean-doberman', format: '3:4', ground: 'off-white', s: { inset: 0, extend: 28, zoom: 100, fx: 50, fy: 0 }, shapes: [{ shape: 'ears', px: 0.432, py: -0.112, psize: 0.35, colour: '#BDB1EB', behind: true }] },
  { id: 'labs', name: 'Two dogs, two bandanas', from: '803', photo: 'clean-labs', format: '3:4', ground: 'off-white', s: { inset: 0, extend: 0, zoom: 100, fx: 50, fy: 50 }, shapes: [{ shape: 'bandana-tied', px: 0.413, py: 0.652, psize: 0.228, colour: '#B9C3A8' }, { shape: 'bandana-tied', px: 0.835, py: 0.606, psize: 0.174, colour: '#BDB1EB' }] },
  { id: 'aussie', name: 'Shepherd with painted arch', from: '805', photo: 'clean-aussie', format: '1:1', ground: 'off-white', s: { inset: 20, extend: 0, zoom: 100, fx: 50, fy: 50 }, shapes: [{ shape: 'card', px: 0.736, py: 0.944, psize: 0.255, colour: '#FFAA4D' }] },
];
const BRUSH_PRESETS = [
  { id: 'leash', name: 'Leash in greys', from: '4.2', v: { composition: 'leash', ground: 'off-white', ink: '#4B4B48', width: 7, dryness: 45, paint: 60, zoom: 260, 'move across': 30, 'move down': 10 } },
  { id: 'rope', name: 'Crossing strokes, rust on orange', from: '4.2', v: { composition: 'rope', ground: 'orange', ink: 'tone', width: 6, dryness: 50, paint: 45, zoom: 130, 'move across': 0, 'move down': 0 } },
  { id: 'sweep', name: 'Sweep on sage', from: '4.5', v: { composition: 'sweep', ground: 'sage', ink: 'tone', width: 9, dryness: 55, paint: 50, zoom: 100, 'move across': 0, 'move down': 0 } },
  { id: 'bowl', name: 'Bowl, black on tan', from: '4.2', v: { composition: 'bowl', ground: 'tan', ink: '#1D1916', width: 6, dryness: 40, paint: 55, zoom: 170, 'move across': -10, 'move down': 10 } },
];

const loadImg = (src?: string) => new Promise<HTMLImageElement | null>((ok) => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const toBlob = (c: HTMLCanvasElement, type = 'image/png') => new Promise<Blob | null>((ok) => c.toBlob(ok, type, 0.92));

export function PainterlyTool({ brand, tool, rail, frame, save, ask, files }: { brand: Brand; tool: Tool; rail: (c: React.ReactNode) => React.ReactNode; frame: Frame; save: Save; ask: Ask | null; files: BrandFiles }) {
  const IMG: Record<string, string> = (window as any).__SDV_IMG ?? {};
  const grounds = useMemo(() => Object.entries<any>(brand.TONES).map(([id, t]) => ({ value: id, label: t.name, g: t.g as string })), [brand]);
  const groundOf = (id: string) => grounds.find((g) => g.value === id)?.g ?? '#F4F5EF';
  const [mode, setMode] = useState<'mask' | 'brush'>('mask');
  const [photoSrc, setPhotoSrc] = useState<string>(IMG['clean-terrier'] ?? '');
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [texture, setTexture] = useState<HTMLImageElement | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>('terrier');
  const [seed, setSeed] = useState(3);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [prompt, setPrompt] = useState('');
  const [canSee, setCanSee] = useState(false);
  const fileIn = useRef<HTMLInputElement>(null);
  useEffect(() => { loadImg(IMG.texture).then(setTexture); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { let dead = false; loadImg(photoSrc).then((i) => { if (!dead) setPhoto(i); }); return () => { dead = true; }; }, [photoSrc]);
  useEffect(() => { (async () => { try { const l = await (ask as any)?.limits?.(); setCanSee(!!l?.images); } catch { setCanSee(false); } })(); }, [ask]);
  const cur = shapes.find((s) => s.id === sel) ?? null;

  /* ---------- Dials ---------- */
  const config = useMemo(() => {
    const out = { output: { format: { type: 'select', options: Object.keys(FORMATS).map((f) => ({ value: f, label: f })), default: '3:4' }, 'long edge': { type: 'select', options: SIZES.map((n) => ({ value: String(n), label: `${n} px` })), default: '2160' } } };
    if (mode === 'brush') return {
      drawing: { composition: { type: 'select', options: PAINT_COMPS.map((c: any) => ({ value: c.id, label: c.name })), default: 'leash' }, ground: { type: 'select', options: grounds.map(({ value, label }) => ({ value, label })), default: 'off-white' }, ink: { type: 'select', options: INKS.map(([label, value]) => ({ value, label })), default: '#4B4B48' }, width: [7, 2, 30, 0.5], dryness: [45, 0, 100, 1], paint: [60, 0, 100, 1] },
      framing: { zoom: [260, 100, 400, 5], 'move across': [30, -100, 100, 1], 'move down': [10, -100, 100, 1] },
      motion: { 'paint time': [5, 2, 12, 0.5], hold: [1.5, 0, 4, 0.5] },
      ...out,
    } as unknown as DialConfig;
    return {
      photo: { zoom: [100, 100, 300, 1], 'focus across': [50, 0, 100, 1], 'focus down': [50, 0, 100, 1], margin: [10, 0, 30, 0.5], 'room above': [0, 0, 45, 0.5] },
      ground: { colour: { type: 'select', options: grounds.map(({ value, label }) => ({ value, label })), default: 'black' } },
      ...(cur ? { shape: { colour: { type: 'select', options: ACC.map(([label, value]) => ({ value, label })), default: cur.colour }, size: [Math.round(cur.psize * 100), 5, 120, 0.5], rotation: [cur.rot, -180, 180, 1], flip: cur.flip, 'behind photo': cur.behind } } : {}),
      ...out,
    } as unknown as DialConfig;
  }, [mode, !!cur, grounds]); // eslint-disable-line react-hooks/exhaustive-deps
  const controller = useDialKitController('Painterly', config, { id: `primary-brand:${brand.id}:tool:painterly:${mode}`, persist: false });
  const v: any = controller.values ?? {};
  const format: string = v.output?.format ?? '3:4', [fw, fh] = FORMATS[format] ?? FORMATS['3:4'];

  // The shape dials follow the selected shape; moving them edits it. `dialFor` says which shape the dials show.
  const dialFor = useRef<string | null>(null);
  const select = (id: string | null) => {
    setSel(id); dialFor.current = null;
    const s = shapes.find((x) => x.id === id);
    if (s) requestAnimationFrame(() => { controller.setValues({ shape: { colour: s.colour, size: Math.round(s.psize * 1000) / 10, rotation: s.rot, flip: s.flip, 'behind photo': s.behind } } as never); requestAnimationFrame(() => { dialFor.current = id; }); });
  };
  const sv = v.shape ? JSON.stringify(v.shape) : '';
  useEffect(() => {
    if (!sel || dialFor.current !== sel || !v.shape) return;
    setShapes((list) => list.map((s) => s.id === sel ? { ...s, colour: v.shape.colour ?? s.colour, psize: (v.shape.size ?? s.psize * 100) / 100, rot: v.shape.rotation ?? s.rot, flip: !!v.shape.flip, behind: !!v.shape['behind photo'] } : s));
  }, [sv]); // eslint-disable-line react-hooks/exhaustive-deps

  const maskSettings = { ground: groundOf(v.ground?.colour ?? 'black'), inset: v.photo?.margin ?? 10, extend: v.photo?.['room above'] ?? 0, zoom: (v.photo?.zoom ?? 100) / 100, fx: (v.photo?.['focus across'] ?? 50) / 100, fy: (v.photo?.['focus down'] ?? 50) / 100 };
  const inkOf = (ink: string, ground: string) => ink === 'tone' ? (ground === '#1D1916' ? mixHex(ground, '#FFFFFF', 0.3) : mixHex(ground, '#1D1916', 0.42)) : ink;
  const brushSettings = () => { const g = groundOf(v.drawing?.ground ?? 'off-white'); return { comp: v.drawing?.composition ?? 'leash', ground: g, ink: inkOf(v.drawing?.ink ?? '#4B4B48', g), width: v.drawing?.width ?? 7, dry: v.drawing?.dryness ?? 45, body: v.drawing?.paint ?? 60, zoom: (v.framing?.zoom ?? 100) / 100, panX: (v.framing?.['move across'] ?? 0) / 100, panY: (v.framing?.['move down'] ?? 0) / 100, seed }; };
  const toFrame = (W: number, H: number) => (s: Shape) => { if (!photo) return null; const [dx, dy, dw] = photoRectOf(W, H, maskSettings, photo), dh = dw * photo.height / photo.width; return { ...s, x: (dx + s.px * dw) / W, y: (dy + s.py * dh) / H, size: s.psize * dw / W }; };
  const draw = (c: HTMLCanvasElement, W: number, H: number, progress = 1) => {
    const x = c.getContext('2d'); if (!x) return;
    x.clearRect(0, 0, W, H);
    if (mode === 'brush') paintBrush(x, W, H, { ...brushSettings(), texture, progress });
    else paintMask(x, W, H, { ...maskSettings, shapes: shapes.map(toFrame(W, H)).filter(Boolean) }, photo, texture);
  };

  /* ---------- Presets ---------- */
  const useMaskPreset = (p: typeof MASK_PRESETS[number]) => {
    setPreset(p.id); setPhotoSrc(IMG[p.photo] ?? ''); setNote('');
    const list = p.shapes.map((s: any, i) => ({ id: uid(), shape: s.shape, px: s.px, py: s.py, psize: s.psize, rot: 0, colour: s.colour, flip: false, behind: !!s.behind, seed: i + 2 }));
    setShapes(list); setSel(null); dialFor.current = null;
    controller.setValues({ photo: { zoom: p.s.zoom, 'focus across': p.s.fx, 'focus down': p.s.fy, margin: p.s.inset, 'room above': p.s.extend }, ground: { colour: p.ground }, output: { format: p.format } } as never);
  };
  const useBrushPreset = (p: typeof BRUSH_PRESETS[number]) => { setPreset(p.id); setNote(''); controller.setValues({ drawing: { composition: p.v.composition, ground: p.v.ground, ink: p.v.ink, width: p.v.width, dryness: p.v.dryness, paint: p.v.paint }, framing: { zoom: p.v.zoom, 'move across': p.v['move across'], 'move down': p.v['move down'] } } as never); };
  const first = useRef(true);
  useEffect(() => { if (!first.current) return; first.current = false; useMaskPreset(MASK_PRESETS[0]); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const switchMode = (m: 'mask' | 'brush') => { if (m === mode) return; setMode(m); setSel(null); dialFor.current = null; setTimeout(() => (m === 'brush' ? useBrushPreset(BRUSH_PRESETS[0]) : useMaskPreset(MASK_PRESETS[0])), 0); };

  /* ---------- Shapes ---------- */
  const addShape = (id: string) => {
    const def = SHAPE_BY[id], s: Shape = { id: uid(), shape: id, px: 0.5, py: id === 'ears' ? 0 : id === 'card' ? 0.92 : 0.55, psize: id === 'card' ? 0.25 : id === 'bandana-tied' ? 0.22 : 0.4, rot: 0, colour: def?.colour ?? '#FFAA4D', flip: false, behind: !!def?.behind, seed: Math.floor(Math.random() * 999) };
    setShapes((l) => [...l, s]); select(s.id); setPreset('');
    if (id === 'ears' && (v.photo?.['room above'] ?? 0) < 15) controller.setValues({ photo: { 'room above': 25 } } as never);
  };
  const removeShape = (id: string) => { setShapes((l) => l.filter((s) => s.id !== id)); if (sel === id) select(null); };

  /* ---------- Upload ---------- */
  const upload = (f?: File) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) { setNote('That file is not an image.'); return; }
    const r = new FileReader();
    r.onload = async () => {
      // Kept at most 2400 px on the long side, so large phone photos stay quick to paint.
      const img = await loadImg(String(r.result)); if (!img) { setNote('That image could not be read.'); return; }
      const k = Math.min(1, 2400 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      setPhotoSrc(c.toDataURL('image/jpeg', 0.9)); setPreset(''); setNote(canSee ? 'Photo added. Add a shape, then let Claude find the dog, or drag it into place.' : 'Photo added. Add a shape and drag it into place on the dog.');
      if (!shapes.length) { const s: Shape = { id: uid(), shape: 'bandana', px: 0.5, py: 0.55, psize: 0.4, rot: 0, colour: '#FFAA4D', flip: false, behind: false, seed: 4 }; setShapes([s]); select(s.id); }
    };
    r.readAsDataURL(f);
  };

  /* ---------- Claude: find the dog, so the shape lands where the guideline would put it ---------- */
  const findDog = async () => {
    if (!ask || !photo) return;
    const target = cur ?? shapes[0]; if (!target) { setNote('Add a shape first.'); return; }
    setBusy('find'); setNote('');
    try {
      const c = document.createElement('canvas'), k = Math.min(1, 768 / Math.max(photo.width, photo.height)); c.width = Math.round(photo.width * k); c.height = Math.round(photo.height * k); c.getContext('2d')!.drawImage(photo, 0, 0, c.width, c.height);
      const blob = await toBlob(c, 'image/jpeg');
      const r = await ask.json(`Look at this photograph and find the main dog (the largest, clearest one). Reply as JSON only, with every value a fraction of the image's width (x) or height (y), 0 to 1:
{"found": true, "headTop": {"x": 0, "y": 0}, "headWidth": 0, "neck": {"x": 0, "y": 0}}
headTop is the top centre of the dog's skull, between the ears. headWidth is the width of the head without the ears, as a fraction of the image width. neck is the centre of the throat, just under the chin, where a bandana would be tied. If there is no dog, reply {"found": false}.`, { images: [blob], modelTier: 'default' } as any);
      const n = (x: any) => (Number.isFinite(+x) ? Math.max(-0.5, Math.min(1.5, +x)) : null);
      if (!r?.found || n(r.headWidth) == null) { setNote('Claude could not find a dog in this photo. Drag the shape into place instead.'); return; }
      const hw = n(r.headWidth)!, hx = n(r.headTop?.x) ?? 0.5, hy = n(r.headTop?.y) ?? 0.2, nx = n(r.neck?.x) ?? hx, ny = n(r.neck?.y) ?? hy + 0.25;
      const place: Partial<Shape> = target.shape === 'ears' ? { px: hx, py: hy - 0.04, psize: hw * 1.25, behind: true }
        : target.shape === 'card' ? {} : { px: nx, py: ny + (target.shape === 'bandana' ? 0.04 : 0.03), psize: hw * (target.shape === 'bandana' ? 1.15 : 0.95) };
      setShapes((l) => l.map((s) => s.id === target.id ? { ...s, ...place } : s)); select(target.id);
      if (target.shape === 'ears') controller.setValues({ photo: { 'room above': Math.max(20, v.photo?.['room above'] ?? 0), 'focus down': Math.max(0, Math.min(100, Math.round(hy * 100) - 5)) } } as never);
      setNote(`Placed on the dog. Drag it to adjust.`);
    } catch { setNote('Claude could not look at the photo just now. Drag the shape into place instead.'); }
    finally { setBusy(''); }
  };
  // Claude turns a description into the brush tool's own settings, and nothing else.
  const describe = async () => {
    if (!ask || !prompt.trim()) return;
    setBusy('describe'); setNote('');
    try {
      const r = await ask.json(`Small Door Vet's painterly illustrations are dry-brush pet objects, enlarged and cropped into abstract backgrounds. Turn this request into settings for the brush tool: "${prompt.trim()}".
Reply as JSON only: {"composition": one of ${JSON.stringify(PAINT_COMPS.map((c: any) => c.id))}, "ground": one of ${JSON.stringify(grounds.map((g) => g.value))}, "ink": one of ${JSON.stringify(INKS.map(([, v]) => v))} ("tone" means a darker shade of the ground), "width": 2-30, "dryness": 0-100, "paint": 0-100, "zoom": 100-400 (larger crops in closer), "moveAcross": -100 to 100, "moveDown": -100 to 100}.`, { modelTier: 'quick' } as any);
      const pick = (x: any, list: string[], d: string) => (list.includes(x) ? x : d), num = (x: any, a: number, b: number, d: number) => (Number.isFinite(+x) ? Math.max(a, Math.min(b, +x)) : d);
      controller.setValues({ drawing: { composition: pick(r?.composition, PAINT_COMPS.map((c: any) => c.id), 'leash'), ground: pick(r?.ground, grounds.map((g) => g.value), 'off-white'), ink: pick(r?.ink, INKS.map(([, x]) => x), 'tone'), width: num(r?.width, 2, 30, 7), dryness: num(r?.dryness, 0, 100, 45), paint: num(r?.paint, 0, 100, 55) }, framing: { zoom: num(r?.zoom, 100, 400, 150), 'move across': num(r?.moveAcross, -100, 100, 0), 'move down': num(r?.moveDown, -100, 100, 0) } } as never);
      setSeed(Math.floor(Math.random() * 999)); setPreset('');
    } catch { setNote('Claude could not answer just now.'); }
    finally { setBusy(''); }
  };

  /* ---------- The canvas ---------- */
  const stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState<[number, number]>([0, 0]);
  useEffect(() => { const el = stage.current; if (!el) return; const ro = new ResizeObserver(() => setBox([el.clientWidth, el.clientHeight])); ro.observe(el); setBox([el.clientWidth, el.clientHeight]); return () => ro.disconnect(); }, []);
  const pad = 32, scale = Math.min(Math.max(40, box[0] - pad * 2) / fw, Math.max(40, box[1] - pad * 2 - 40) / fh), cw = Math.max(40, Math.floor(fw * scale)), ch = Math.max(40, Math.floor(fh * scale));
  const key = JSON.stringify({ mode, v, shapes, photo: photo ? `${photo.width}x${photo.height}:${photo.src.length}:${photo.src.slice(-24)}` : '', tex: !!texture, seed });
  // Playing paints the illustration on in the preview, at the video's own pace; any change stops it.
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const paintTime = +(v.motion?.['paint time'] ?? 5), hold = +(v.motion?.hold ?? 1.5);
  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(cw * dpr), H = Math.round(ch * dpr);
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    if (playing && mode === 'brush') {
      let id = 0; const t0 = performance.now();
      const step = () => { const t = (performance.now() - t0) / 1000; draw(c, W, H, Math.min(1, t / paintTime)); setPlayed(Math.min(1, t / (paintTime + hold))); if (t < paintTime + hold) id = requestAnimationFrame(step); else setPlaying(false); };
      id = requestAnimationFrame(step);
      return () => cancelAnimationFrame(id);
    }
    const id = requestAnimationFrame(() => draw(c, W, H));
    return () => cancelAnimationFrame(id);
  }, [key, cw, ch, playing]); // eslint-disable-line react-hooks/exhaustive-deps
  const lastKey = useRef(key);
  useEffect(() => { if (lastKey.current !== key) { lastKey.current = key; setPlaying(false); } }, [key]);

  // Drag a shape to move it; the move is kept in the photo's coordinates.
  const drag = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const framed = (s: Shape) => toFrame(cw, ch)(s);
  const hit = (fx: number, fy: number) => { for (let i = shapes.length - 1; i >= 0; i--) { const f = framed(shapes[i]); if (!f) continue; const def = SHAPE_BY[f.shape], hw = f.size * cw / 2, hh = hw / (def?.aspect ?? 1); if (Math.abs(fx * cw - f.x * cw) < hw && Math.abs(fy * ch - f.y * ch) < hh) return shapes[i]; } return null; };
  const onDown = (e: RPE<HTMLDivElement>) => {
    if (mode !== 'mask' || !photo) return;
    const r = e.currentTarget.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height, s = hit(fx, fy);
    if (!s) { select(null); return; }
    e.currentTarget.setPointerCapture(e.pointerId);
    const [dx, dy, dw] = photoRectOf(cw, ch, maskSettings, photo), dh = dw * photo.height / photo.width;
    drag.current = { id: s.id, ox: (fx * cw - dx) / dw - s.px, oy: (fy * ch - dy) / dh - s.py };
    if (sel !== s.id) select(s.id);
  };
  const onMove = (e: RPE<HTMLDivElement>) => {
    const d = drag.current; if (!d || !photo) return;
    const r = e.currentTarget.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    const [dx, dy, dw] = photoRectOf(cw, ch, maskSettings, photo), dh = dw * photo.height / photo.width;
    setShapes((l) => l.map((s) => s.id === d.id ? { ...s, px: (fx * cw - dx) / dw - d.ox, py: (fy * ch - dy) / dh - d.oy } : s)); setPreset('');
  };
  const nudge = (dx: number, dy: number) => { if (!cur || !photo) return; const [, , dw] = photoRectOf(cw, ch, maskSettings, photo), dh = dw * photo.height / photo.width; setShapes((l) => l.map((s) => s.id === cur.id ? { ...s, px: s.px + dx / dw, py: s.py + dy / dh } : s)); };
  const curF = cur && mode === 'mask' ? framed(cur) : null;

  /* ---------- Output ---------- */
  const render = async (clear = false) => {
    const long = +(v.output?.['long edge'] ?? 2160), W = fw >= fh ? long : Math.round(long * fw / fh), H = fw >= fh ? Math.round(long * fh / fw) : long;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d')!;
    if (mode === 'brush') paintBrush(x, W, H, { ...brushSettings(), ink: clear ? '#000000' : brushSettings().ink, texture, clear });
    else paintMask(x, W, H, { ...maskSettings, shapes: shapes.map(toFrame(W, H)).filter(Boolean) }, photo, texture);
    return { blob: await toBlob(c), W, H };
  };
  const name = () => `${brand.id}-${mode === 'brush' ? `brush-${v.drawing?.composition ?? 'leash'}` : `mask-${shapes.map((s) => s.shape).join('-') || 'photo'}`}`;
  const doExport = async () => { setBusy('png'); setNote(''); try { const { blob, W, H } = await render(); if (!blob) throw 0; await save(`${name()}-${W}x${H}.png`, blob); } catch { setNote('The image could not be exported. Try a smaller size.'); } setBusy(''); };
  // Video: the illustration painted on stroke by stroke, then held, at each chosen format.
  const stopper = useRef<AbortController | null>(null);
  const recordOne = async (fmt: string, label: (share: number) => void, signal: AbortSignal) => {
    const [W, H] = VIDEO[fmt] ?? VIDEO['4:5'], c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d')!;
    const paintFrames = Math.round(paintTime * FPS), frames = paintFrames + Math.round(hold * FPS) + 1, settings = { ...brushSettings(), texture };
    let done = -1;
    const out = await recordCanvas(c, { frames, fps: FPS, signal, progress: label, draw: (i: number) => { const p = Math.min(1, i / paintFrames); if (p >= 1 && done === 1) return; done = p >= 1 ? 1 : 0; x.clearRect(0, 0, W, H); paintBrush(x, W, H, { ...settings, progress: p }); } });
    return { ...out, name: `${brand.id}-brush-${v.drawing?.composition ?? 'leash'}-${W}x${H}.${out.ext}` };
  };
  const exportVideo = async (set: boolean) => {
    const list = set ? VIDEO_SET : [[format, format] as [string, string]];
    const ctrl = new AbortController(); stopper.current = ctrl;
    setPlaying(false); setBusy('video'); setNote('');
    try {
      const made: { name: string; blob: Blob; exact: boolean }[] = [];
      for (let k = 0; k < list.length; k++) {
        const [fmt, nameOf] = list[k];
        made.push(await recordOne(fmt, (share) => setNote(`Recording ${nameOf.toLowerCase()} ${list.length > 1 ? `(${k + 1} of ${list.length}) ` : ''}· ${Math.round(share * 100)}%`), ctrl.signal));
      }
      if (made.length === 1) await save(made[0].name, made[0].blob);
      else {
        const files = await Promise.all(made.map(async (m) => ({ name: m.name, uri: await new Promise<string>((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.readAsDataURL(m.blob); }) })));
        await save(`${brand.id}-brush-${v.drawing?.composition ?? 'leash'}-videos.zip`, await E.zipFiles(files));
      }
      const webm = made.some((m) => m.name.endsWith('.webm'));
      setNote(webm ? 'This browser records WebM, not MP4. For MP4 files, export from Chrome, Edge or Safari.' : made.every((m) => m.exact) ? `${made.length === 1 ? 'MP4' : `${made.length} MP4s`} at ${FPS} fps, every frame exact.` : `Recorded in real time at ${FPS} fps.`);
    } catch (e: any) {
      setNote(e?.code === 'stopped' ? 'Recording stopped.' : e?.code === 'unsupported' ? 'This browser cannot record video. Try Chrome, Edge or Safari.' : 'The video could not be made just now.');
    } finally { stopper.current = null; setBusy(''); }
  };
  const slot = (id: string) => (brand as any).slots?.find((s: any) => s.id === id);
  const keep = async (slotId: 'painted' | 'brush') => {
    setBusy(slotId); setNote('');
    try {
      const { blob, W, H } = await render(slotId === 'brush'); if (!blob) throw 0;
      const err = await files.upload(brand, slot(slotId), [new File([blob], slotId === 'brush' ? `${brand.id}-brush-stroke.png` : `${name()}-${W}x${H}.png`, { type: 'image/png' })]);
      setNote(err || (slotId === 'brush' ? 'This stroke is now the brand’s brush: the Event poster, the brand card and every layout that uses the brush draw it.' : 'Kept in Assets, under Painted pieces.'));
    } catch { setNote('It could not be saved just now.'); }
    setBusy('');
  };

  /* ---------- Frame ---------- */
  const railEl = rail(
    <div className="pb-railblock pb-railblock--fill">
      <RailHead>Start from <span className="pb-count">{mode === 'mask' ? MASK_PRESETS.length : BRUSH_PRESETS.length}</span></RailHead>
      <ul className="pb-raillist">
        {mode === 'mask'
          ? MASK_PRESETS.map((p) => <RailItem key={p.id} current={preset === p.id} lead={<img className="pb-gt-thumb" src={IMG[p.photo]} alt="" />} meta={p.from} onClick={() => useMaskPreset(p)}>{p.name}</RailItem>)
          : BRUSH_PRESETS.map((p) => <RailItem key={p.id} current={preset === p.id} lead={<span className="pb-gt-thumb" style={{ background: groundOf(p.v.ground) }} />} meta={p.from} onClick={() => useBrushPreset(p)}>{p.name}</RailItem>)}
      </ul>
    </div>,
  );
  const inspector = (
    <>
      <div className="pb-insphead">
        <div><h2>{tool.name}</h2><p>{mode === 'mask' ? 'Editorial mask · 4.1' : 'Painterly illustration · 4.2'}</p></div>
        <Btn icon={<RotateCcw {...ICON} />} label="Back to the first example" onClick={() => (mode === 'mask' ? useMaskPreset(MASK_PRESETS[0]) : useBrushPreset(BRUSH_PRESETS[0]))} />
      </div>
      <div className="pb-inspblock pb-pt-modes" role="radiogroup" aria-label="What to paint">
        <button type="button" role="radio" aria-checked={mode === 'mask'} className="pb-rc-toggle" onClick={() => switchMode('mask')}>Editorial mask</button>
        <button type="button" role="radio" aria-checked={mode === 'brush'} className="pb-rc-toggle" onClick={() => switchMode('brush')}>Brush illustration</button>
      </div>
      {mode === 'mask' ? (
        <>
          <div className="pb-inspblock pb-inspblock--tight">
            <span className="pb-insplabel">Photograph</span>
            <input ref={fileIn} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
            <div className="pb-rowbtns">
              <Btn variant="secondary" icon={<ImagePlus {...ICON} />} onClick={() => fileIn.current?.click()}>Upload a dog photo</Btn>
              {canSee ? <Btn icon={busy === 'find' ? <span className="pb-spin" aria-hidden="true" /> : <Sparkles {...ICON} />} disabled={!photo || !shapes.length || busy !== ''} onClick={findDog}>Find the dog</Btn> : null}
            </div>
          </div>
          <div className="pb-inspblock pb-inspblock--tight">
            <span className="pb-insplabel">Painted shapes</span>
            <div className="pb-rc-toggles">
              {shapes.map((s) => <button key={s.id} type="button" className="pb-rc-toggle pb-pt-chip" aria-pressed={s.id === sel} onClick={() => select(s.id === sel ? null : s.id)}><i style={{ background: s.colour }} aria-hidden="true" />{SHAPE_BY[s.shape]?.name}</button>)}
              <MenuButton className="pb-actmenu" label="Add a shape" trigger={<><Plus {...ICON} /><span>Add</span></>}>
                {MASK_SHAPES.map((s: any) => <MenuItem key={s.id} onClick={() => addShape(s.id)}>{s.name}</MenuItem>)}
              </MenuButton>
            </div>
            {cur ? <div className="pb-rowbtns"><Btn icon={<Shuffle {...ICON} />} onClick={() => setShapes((l) => l.map((s) => s.id === cur.id ? { ...s, seed: s.seed + 1 } : s))}>Repaint the edge</Btn><Btn icon={<Trash2 {...ICON} />} onClick={() => removeShape(cur.id)}>Remove</Btn></div> : <p className="pb-quiet">{shapes.length ? 'Select a shape, or click it on the picture, to change it.' : 'Add a shape from the guideline.'}</p>}
          </div>
        </>
      ) : (
        <div className="pb-inspblock pb-inspblock--tight">
          <span className="pb-insplabel">Describe it</span>
          {ask ? (
            <form className="pb-start" onSubmit={(e) => { e.preventDefault(); describe(); }}>
              <input className="pb-start-input" value={prompt} maxLength={160} placeholder="e.g. a leash, close up, rust on butter" aria-label="Describe a brush illustration" onChange={(e) => setPrompt(e.target.value)} />
              <Btn variant="secondary" type="submit" icon={busy === 'describe' ? <span className="pb-spin" aria-hidden="true" /> : <Wand2 {...ICON} />} disabled={!prompt.trim() || busy !== ''}>Paint</Btn>
            </form>
          ) : <p className="pb-quiet">Claude is not available on this page; use the dials.</p>}
          <div className="pb-rowbtns"><Btn icon={<Shuffle {...ICON} />} onClick={() => { setSeed(Math.floor(Math.random() * 999)); setPreset(''); }}>Paint another take</Btn></div>
        </div>
      )}
      {mode === 'brush' ? (
        <div className="pb-inspblock pb-inspblock--tight pb-pt-motion">
          <span className="pb-insplabel">Paint it on</span>
          <p className="pb-quiet">Each stroke goes down at a brush’s pace, one after another, then the finished piece holds. Set the timing under Motion.</p>
          <div className="pb-rowbtns">
            <Btn variant="secondary" icon={playing ? <Square {...ICON} /> : <Play {...ICON} />} disabled={busy !== ''} onClick={() => setPlaying((p) => !p)}>{playing ? 'Stop' : 'Play'}</Btn>
            <span className="pb-quiet pb-pt-time">{(paintTime + hold).toFixed(1)} s{playing ? ` · ${Math.round(played * 100)}%` : ''}</span>
          </div>
        </div>
      ) : null}
      <div className="pb-dials"><ZachDialRoot /></div>
      <div className="pb-inspblock pb-inspfoot">
        <p className="pb-quiet">{mode === 'mask' ? 'The shapes are the guideline file’s own vectors, with its rounded stroke, edge texture and the SD Texture at 40% in soft light.' : 'Strokes are painted fresh each time from the same settings and take; the paper is the guideline’s SD Texture.'}</p>
      </div>
    </>
  );
  const actions = (
    <>
      <MenuButton className="pb-actmenu" label="Keep in Assets" align="end" disabled={!files.canUpload || busy !== ''} trigger={<><FolderPlus {...ICON} /><span className="pb-btn-label">Keep</span></>}>
        <MenuItem onClick={() => keep('painted')}>In Painted pieces</MenuItem>
        {mode === 'brush' ? <MenuItem onClick={() => keep('brush')}><Paintbrush {...ICON} size={14} /> As the brand’s brush</MenuItem> : null}
      </MenuButton>
      {mode === 'brush' ? (
        busy === 'video'
          ? <Btn variant="secondary" icon={<Square {...ICON} />} onClick={() => stopper.current?.abort()}>Stop recording</Btn>
          : (
            <MenuButton className="pb-actmenu" label="Export video" align="end" disabled={busy !== ''} trigger={<><Film {...ICON} /><span className="pb-btn-label">Video</span></>}>
              <MenuItem hint={`${VIDEO[format]?.join('×')}`} onClick={() => exportVideo(false)}>This format, {format}</MenuItem>
              <MenuItem hint="3 files" onClick={() => exportVideo(true)}>Post, story and widescreen</MenuItem>
            </MenuButton>
          )
      ) : null}
      <Btn variant="primary" icon={busy === 'png' ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy !== '' || (mode === 'mask' && !photo)} onClick={doExport}>{busy === 'png' ? 'Painting' : 'Export PNG'}</Btn>
    </>
  );
  const main = (
    <div className="pb-canvas pb-gt" ref={stage}>
      <figure className="pb-gt-fig" style={{ width: cw }}>
        <div className="pb-gt-art pb-pt-art" style={{ width: cw, height: ch }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
          tabIndex={curF ? 0 : -1} onKeyDown={(e) => { const k = e.shiftKey ? 10 : 2; if (e.key === 'ArrowLeft') nudge(-k, 0); else if (e.key === 'ArrowRight') nudge(k, 0); else if (e.key === 'ArrowUp') nudge(0, -k); else if (e.key === 'ArrowDown') nudge(0, k); else if (e.key === 'Escape') select(null); else return; e.preventDefault(); }}
          aria-label={mode === 'mask' ? 'The picture. Drag a painted shape to move it; with a shape selected, arrow keys nudge it.' : 'The brush illustration'}>
          <canvas ref={canvas} role="img" aria-label={mode === 'mask' ? `A photograph with ${shapes.map((s) => SHAPE_BY[s.shape]?.name.toLowerCase()).join(' and ') || 'no shapes'}` : `A brush illustration: ${PAINT_COMPS.find((c: any) => c.id === v.drawing?.composition)?.name ?? 'leash'}`} style={{ width: cw, height: ch }} />
          {curF ? <div className="pb-pt-sel" aria-hidden="true" style={{ left: curF.x * cw, top: curF.y * ch, width: curF.size * cw, height: curF.size * cw / (SHAPE_BY[curF.shape]?.aspect ?? 1), transform: `translate(-50%,-50%) rotate(${curF.rot}deg)` }} /> : null}
        </div>
        <figcaption><span>{mode === 'mask' ? (shapes.length ? shapes.map((s) => SHAPE_BY[s.shape]?.name).join(' · ') : 'Photograph') : PAINT_COMPS.find((c: any) => c.id === v.drawing?.composition)?.name}</span><span>{format}</span></figcaption>
      </figure>
      {note ? <p className="pb-gt-foot" role="status">{note}</p> : null}
    </div>
  );
  return frame({ actions, rail: railEl, railLabel: 'Tools and starting points', inspector, inspectorLabel: 'Painterly properties', main, mainLabel: 'Painterly studio', kind: 'canvas' });
}
