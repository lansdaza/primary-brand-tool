// Brand in use: the scenes at the top of Applications (icon, social profiles, posts in a phone, email signature).
// Each is a scene layout from the engine, drawn from the brand's own layouts, with what a person does with it underneath:
// open the layouts it holds in Make, download it, the icon set, or the signature to paste into a mail app.
import { useEffect, useState } from 'react';
import { AppWindow, ArrowUpRight, Copy, Download, Globe, Store } from 'lucide-react';
import * as E from './engine/index.js';
import { Btn, ICON, SlideView, TextField, type Brand, type Params, type Save, type Tpl } from './ui';

export type Pres = { product: string; person: string; role: string; phone: string };
export const KEY = (id: string) => `primary-presence-${id}`;

// Per brand, per browser: what kind of product it is, and whose signature to show. Brands start from their own record.
export function usePresence(brand: Brand): [Pres, (patch: Partial<Pres>) => void] {
  const P = (brand as any).presence;
  const base = (): Pres => ({ product: P?.kind ?? 'web', person: P?.sig.name ?? '', role: P?.sig.role ?? '', phone: P?.sig.phone ?? '' });
  const read = (): Pres => { try { return { ...base(), ...JSON.parse(localStorage.getItem(KEY(brand.id)) || '{}') }; } catch { return base(); } };
  const [pres, setPresState] = useState<Pres>(read);
  useEffect(() => { setPresState(read()); }, [brand.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch: Partial<Pres>) => setPresState((prev) => { const next = { ...prev, ...patch }; try { localStorage.setItem(KEY(brand.id), JSON.stringify(next)); } catch { /* kept for this visit */ } return next; });
  return [pres, set];
}

const sceneOf = (brand: Brand, id: string): Tpl | undefined => (brand as any).SCBY?.[id];
const paramsOf = (brand: Brand, id: string, pres: Pres): Params => {
  const t = sceneOf(brand, id);
  if (!t) return {};
  const raw: Params = { ...E.defaults(t) };
  if ('product' in t.params) raw.product = pres.product;
  if ('person' in t.params) Object.assign(raw, { person: pres.person, role: pres.role, phone: pres.phone });
  return E.sanitize(t, raw);
};

// Render a layout off screen and hand back its PNG.
export async function renderPNG(t: Tpl, p: Params, scale = 1): Promise<Blob> {
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none';
  document.body.appendChild(holder);
  try {
    holder.innerHTML = E.tplHTML(t, p);
    E.mountWG();
    await (document.fonts?.ready ?? Promise.resolve());
    await new Promise((r) => setTimeout(r, 150));
    return await (E.toPNG as any)(holder.firstElementChild as HTMLElement, scale);
  } finally { holder.remove(); }
}
const dataURI = (b: Blob) => new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(b); });
// Down-scaling in halves keeps a small icon sharp.
async function resize(src: Blob, px: number): Promise<string> {
  const img = await createImageBitmap(src);
  let c: HTMLCanvasElement | ImageBitmap = img, w = img.width;
  while (w / 2 >= px) { const n = document.createElement('canvas'); n.width = n.height = Math.round(w / 2); const x = n.getContext('2d')!; x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, n.width, n.height); c = n; w = n.width; }
  const out = document.createElement('canvas'); out.width = out.height = px;
  const x = out.getContext('2d')!; x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, px, px);
  return out.toDataURL('image/png');
}
const ICON_SET: [string, number][] = [
  ['ios/AppIcon-1024.png', 1024], ['ios/AppIcon-180.png', 180], ['ios/AppIcon-167.png', 167], ['ios/AppIcon-152.png', 152], ['ios/AppIcon-120.png', 120], ['ios/AppIcon-87.png', 87], ['ios/AppIcon-80.png', 80], ['ios/AppIcon-60.png', 60], ['ios/AppIcon-58.png', 58], ['ios/AppIcon-40.png', 40],
  ['android/play-store-512.png', 512], ['android/xxxhdpi-192.png', 192], ['android/xxhdpi-144.png', 144], ['android/xhdpi-96.png', 96], ['android/hdpi-72.png', 72], ['android/mdpi-48.png', 48],
  ['web/icon-512.png', 512], ['web/icon-192.png', 192], ['web/apple-touch-icon.png', 180], ['web/favicon-48.png', 48], ['web/favicon-32.png', 32], ['web/favicon-16.png', 16],
  ['social/profile-photo-400.png', 400],
];
const iconReadme = (brand: Brand) => `${brand.name} icon set\n\nOne square master (ios/AppIcon-1024.png), drawn full bleed. iOS, Android and browsers round the corners or crop to a circle themselves, so the files stay square.\n\nios/      App Store and home screen sizes. Add them to the asset catalogue's AppIcon set.\nandroid/  Play Store (512) and launcher sizes. For adaptive icons, use the 512 file as the foreground on the same ground colour.\nweb/      favicons and the touch icon. In the page head:\n            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">\n            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">\n            <link rel="apple-touch-icon" href="/apple-touch-icon.png">\nsocial/   the profile photo for LinkedIn, X and Instagram (cropped to a circle or a rounded square by each).\n`;

type Foot = { brand: Brand; pres: Pres; setPres: (patch: Partial<Pres>) => void; openLayout: (t: Tpl) => void; save: Save };

function SceneActions({ id, opens, brand, pres, openLayout, save, children }: Foot & { id: string; opens: [string, string][]; children?: React.ReactNode }) {
  const [busy, setBusy] = useState('');
  const run = async (what: string, job: () => Promise<void>) => { if (busy) return; setBusy(what); try { await job(); } catch (error) { console.warn(`${what} failed`, error); } finally { setBusy(''); } };
  const t = sceneOf(brand, id);
  const spin = <span className="pb-spin" aria-hidden="true" />;
  return (
    <div className="pb-actions">
      {children}
      {opens.filter(([lid]) => brand.TBY[lid]).map(([lid, label]) => <Btn key={lid + label} variant="secondary" icon={<ArrowUpRight {...ICON} />} onClick={() => openLayout(brand.TBY[lid])}>{label}</Btn>)}
      {t ? <Btn icon={busy === 'png' ? spin : <Download {...ICON} />} disabled={!!busy} onClick={() => run('png', async () => { const [w, h] = E.sizeOf(t, paramsOf(brand, id, pres)); await save(`${brand.id}-${id.replace('scene-', '')}-${w * 2}x${h * 2}.png`, await renderPNG(t, paramsOf(brand, id, pres), 2)); })}>{busy === 'png' ? 'Rendering' : 'Download PNG'}</Btn> : null}
    </div>
  );
}

function IconFoot(f: Foot) {
  const { brand, pres, setPres, save } = f;
  const [busy, setBusy] = useState(false);
  const iconSet = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const t = brand.TBY['app-icon'], master = await renderPNG(t, E.defaults(t));
      const files: { name: string; uri?: string; text?: string }[] = [];
      for (const [name, px] of ICON_SET) files.push({ name, uri: px === 1024 ? await dataURI(master) : await resize(master, px) });
      files.push({ name: 'README.txt', text: iconReadme(brand) });
      await save(`${brand.id}-icon-set.zip`, await E.zipFiles(files));
    } catch (error) { console.warn('Icon set failed', error); }
    finally { setBusy(false); }
  };
  const kinds: [string, string, typeof Store][] = [['app', 'An app', AppWindow], ['web', 'A website', Globe], ['service', 'A service', Store]];
  return (
    <>
      <div className="pb-scene-kind">
        <span className="pb-quiet" id={`kind-${brand.id}`}>{brand.name} is</span>
        <div className="pb-seg" role="group" aria-labelledby={`kind-${brand.id}`}>
          {kinds.map(([k, label, Icon]) => <Btn key={k} icon={<Icon {...ICON} />} aria-pressed={pres.product === k} variant={pres.product === k ? 'secondary' : 'ghost'} onClick={() => setPres({ product: k })}>{label}</Btn>)}
        </div>
      </div>
      <SceneActions {...f} id="scene-icon" opens={[['app-icon', 'Open icon in Make']]}>
        <Btn icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy} onClick={iconSet}>{busy ? 'Preparing' : 'Download icon set'}</Btn>
      </SceneActions>
    </>
  );
}

function SignatureFoot(f: Foot) {
  const { brand, pres, setPres, save } = f;
  const [note, setNote] = useState('');
  const html = async () => {
    const t = brand.TBY['app-icon'], icon = await renderPNG(t, E.defaults(t));
    return E.signatureHTML(brand, { person: pres.person, role: pres.role, phone: pres.phone }, await resize(icon, 112));
  };
  const copy = async () => {
    try {
      const h = await html(), text = [pres.person, `${pres.role}, ${brand.name}`, [(brand as any).presence.site, pres.phone].filter(Boolean).join(' · ')].join('\n');
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
      setNote('Copied. Paste it into your mail app’s signature settings.');
    } catch { setNote('This browser would not copy formatted text. Download the HTML file instead.'); }
    setTimeout(() => setNote(''), 4000);
  };
  return (
    <>
      <div className="pb-scene-fields">
        <TextField id={`sig-${brand.id}-person`} label="Name" value={pres.person} max={32} onChange={(v) => setPres({ person: v })} compact />
        <TextField id={`sig-${brand.id}-role`} label="Role" value={pres.role} max={32} onChange={(v) => setPres({ role: v })} compact />
        <TextField id={`sig-${brand.id}-phone`} label="Phone" value={pres.phone} max={24} onChange={(v) => setPres({ phone: v })} compact />
      </div>
      <SceneActions {...f} id="scene-signature" opens={[]}>
        <Btn variant="primary" icon={<Copy {...ICON} />} onClick={copy}>Copy signature</Btn>
        <Btn icon={<Download {...ICON} />} onClick={async () => { try { await save(`${brand.id}-signature.html`, new Blob([`<!doctype html><meta charset="utf-8"><title>${E.esc(brand.name)} signature</title>${await html()}`], { type: 'text/html' })); } catch (error) { console.warn(error); } }}>Download HTML</Btn>
      </SceneActions>
      {note ? <p className="pb-quiet" role="status">{note}</p> : null}
    </>
  );
}

// The scene itself. Selecting a layout inside it (a post, a banner, the icon) opens that layout in Make.
export function SceneBlock({ brand, id, pres, openLayout }: { brand: Brand; id: string; pres: Pres; openLayout: (t: Tpl) => void }) {
  const t = sceneOf(brand, id);
  if (!t) return null;
  const p = paramsOf(brand, id, pres);
  return (
    <div className="pb-scene" onClick={(e) => { const lid = (e.target as HTMLElement).closest<HTMLElement>('[data-layout]')?.dataset.layout; if (lid && brand.TBY[lid]) openLayout(brand.TBY[lid]); }}>
      <SlideView t={t} p={p} label={t.name} />
    </div>
  );
}

// The Applications items for the scenes, in the order a guideline shows them.
export function presenceItems(brand: Brand, pres: Pres): any[] {
  const P = (brand as any).presence;
  if (!P || !sceneOf(brand, 'scene-icon')) return [];
  const app = pres.product === 'app';
  const data = (id: string, extra: object = {}) => { const t = sceneOf(brand, id)!, p = paramsOf(brand, id, pres); return { data: { scene: id, size: E.SCENE_SIZE, params: p, layouts: (t as any).layouts(p), job: { template: id, params: p }, ...extra } }; };
  const job = (id: string) => `Render it from the brand kit with node render.mjs jobs/${id}.json out.png, changing only params.`;
  const post = paramsOf(brand, 'scene-posts', pres), social = paramsOf(brand, 'scene-social', pres);
  const name = (lid: string) => brand.TBY[lid]?.name ?? lid;
  return [
    { id: 'icon', title: app ? 'App icon' : 'Icon and favicon', num: '', ref: 'Brand in use', path: 'presence.icon',
      desc: [app ? `The ${brand.name} mark on a brand ground, at home on a phone, in the dock and in a browser tab. One square master makes the whole icon set; each platform rounds the corners itself.` : `The ${brand.name} mark on a brand ground, at every size it is used at: the touch icon, favicons, and the profile photo. One square master makes the whole set.`],
      note: 'Select the icon to open it in Make, where its ground and mark size can change.',
      blocks: [{ k: 'scene', id: 'scene-icon' }], ...data('scene-icon', { sizes: Object.fromEntries(ICON_SET.map(([n, px]) => [n, px])) }), rules: [],
      prompt: `Show ${brand.name}'s icon in use. ${job('scene-icon')} Set "product" to app, web or service.`, foot: (f: Foot) => <IconFoot {...f} /> },
    { id: 'social', title: 'Social profiles', num: '', ref: 'Brand in use', path: 'presence.social',
      desc: [`The LinkedIn company page and the X profile. The banner is the ${name(social.banner as string)} layout at each platform’s header size, and the profile photo is the app icon.`],
      note: 'Select the banner or the profile photo to open it in Make.',
      blocks: [{ k: 'scene', id: 'scene-social' }], ...data('scene-social'), rules: [],
      prompt: `Show ${brand.name}'s social profiles. ${job('scene-social')} "banner" is any layout drawn at both linkedin-cover and x-header.`,
      foot: (f: Foot) => <SceneActions {...f} id="scene-social" opens={[[social.banner as string, 'Open banner in Make'], ['app-icon', 'Open icon in Make']]} /> },
    { id: 'posts', title: 'Posts in a phone', num: '', ref: 'Brand in use', path: 'presence.posts',
      desc: [`An Instagram post (${name(post.post as string)}) and story (${name(post.story as string)}), each one of ${brand.name}’s own layouts, in a phone. Swap in any post or story you make in Make.`],
      note: 'Select the post or the story to open it in Make.',
      blocks: [{ k: 'scene', id: 'scene-posts' }], ...data('scene-posts'), rules: [],
      prompt: `Show ${brand.name}'s posts in a phone. ${job('scene-posts')} "post" is any layout drawn at post-4-5, "story" any drawn at story-9-16.`,
      foot: (f: Foot) => <SceneActions {...f} id="scene-posts" opens={[[post.post as string, 'Open post in Make'], [post.story as string, 'Open story in Make']]} /> },
    { id: 'signature', title: 'Email signature', num: '', ref: 'Brand in use', path: 'presence.signature',
      desc: [`The signature everyone at ${brand.name} uses. Fill in your details, then copy it and paste it into your mail app’s signature settings. Mail apps only show common fonts, so the signature is set in Helvetica or Arial with the brand’s ink and icon.`],
      blocks: [{ k: 'scene', id: 'scene-signature' }], ...data('scene-signature'), rules: [],
      prompt: `Make an email signature for someone at ${brand.name}. ${job('scene-signature')} Set person, role and phone.`, foot: (f: Foot) => <SignatureFoot {...f} /> },
  ];
}
