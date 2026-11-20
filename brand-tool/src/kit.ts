// The brand kit's renderer. The kit's render.html is this same app with window.__KIT set: instead of the tool,
// it draws one layout from a job ({template, params}) with the brand's engine, so assets an agent makes outside
// the platform are drawn by the same code, checked against the same limits, and use the brand's own files.
// Without a job it lists the layouts, for a person opening the file in a browser.
import * as E from './engine/index.js';
import { setupFilm } from './film';

type Kit = { brand: string; assets?: Record<string, unknown>; rails?: unknown[] };
type Job = { template: string; params?: Record<string, unknown> };
type Result = { ok: true; template: string; width: number; height: number; params: Record<string, unknown>; warnings: string[] } | { ok: false; errors: string[] };

const optionsOf = (d: any): string[] => (Array.isArray(d.options) ? d.options : Object.keys(d.options ?? {}));
const len = (v: unknown) => [...String(v ?? '')].length;

/** Every way a job breaks the layout's declared rules, in words an agent can act on. */
export function validate(t: any, params: Record<string, any>): string[] {
  const errors: string[] = [];
  const known = Object.keys(t.params);
  for (const k of Object.keys(params)) if (!(k in t.params)) errors.push(`"${k}" is not a parameter of ${t.id}. It takes: ${known.join(', ')}.`);
  for (const [k, d] of Object.entries<any>(t.params)) {
    const v = params[k];
    if (v === undefined) continue;
    const name = `"${k}" (${d.label ?? k})`;
    if (d.type === 'text' || d.type === 'textarea') {
      if (typeof v !== 'string') errors.push(`${name} must be text.`);
      else if (d.max && len(v) > d.max) errors.push(`${name} is ${len(v)} characters; this layout holds ${d.max}. Shorten it rather than shrinking type.`);
    } else if (d.type === 'select' || d.type === 'tone') {
      if (!optionsOf(d).includes(v)) errors.push(`${name} must be one of: ${optionsOf(d).join(', ')}.`);
    } else if (d.type === 'toggle') {
      if (typeof v !== 'boolean') errors.push(`${name} must be true or false.`);
    } else if (d.type === 'range') {
      if (typeof v !== 'number' || v < d.min || v > d.max) errors.push(`${name} must be a number from ${d.min} to ${d.max}.`);
    } else if (d.type === 'pad') {
      const ok = v && typeof v === 'object' && ['x', 'y'].every((a) => typeof v[a] === 'number' && v[a] >= d[a][1] && v[a] <= d[a][2]);
      if (!ok) errors.push(`${name} must be {"x": ${d.x[1]}…${d.x[2]}, "y": ${d.y[1]}…${d.y[2]}}.`);
    } else if (d.type === 'list') {
      if (!Array.isArray(v)) { errors.push(`${name} must be a list.`); continue; }
      const real = v.filter((it: any) => !it?.group);
      if (real.length < (d.min ?? 0) || (d.max && real.length > d.max)) errors.push(`${name} has ${real.length} ${d.item ?? 'item'}s; this layout holds ${d.min ?? 0} to ${d.max}.`);
      v.forEach((it: any, i: number) => {
        const where = `${name} item ${i + 1}`;
        if (!it || typeof it !== 'object') { errors.push(`${where} must be an object.`); return; }
        if (d.cellsFrom) {
          const cols = Array.isArray(params[d.cellsFrom]) ? params[d.cellsFrom].length : (t.params[d.cellsFrom]?.default ?? []).length;
          const cells = it.cells;
          if (!Array.isArray(cells)) { errors.push(`${where} needs "cells", one string per entry of "${d.cellsFrom}".`); return; }
          if (!it.group && cells.length !== cols) errors.push(`${where} has ${cells.length} cells; "${d.cellsFrom}" has ${cols}.`);
          cells.forEach((c: unknown, j: number) => { const max = j === 0 ? d.firstMax ?? d.cellMax : d.cellMax; if (len(c) > max) errors.push(`${where} cell ${j + 1} is ${len(c)} characters; it holds ${max}.`); });
        } else for (const f of d.fields ?? []) {
          if (typeof it[f.key] !== 'string') errors.push(`${where} needs "${f.key}" (${f.label}) as text.`);
          else if (f.max && len(it[f.key]) > f.max) errors.push(`${where} "${f.key}" is ${len(it[f.key])} characters; it holds ${f.max}.`);
        }
      });
    }
  }
  return errors;
}

function readJob(): Job | null {
  const w = window as any;
  if (w.__KIT_JOB) return w.__KIT_JOB;
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) return null;
  if (h.startsWith('{')) { try { return JSON.parse(h); } catch { return null; } }
  return { template: h };
}

const css = `
body{margin:0;background:#f3f3f1;color:#111;font:14px/1.45 system-ui,sans-serif}
.k-bar{position:fixed;top:12px;right:12px;display:flex;gap:6px;z-index:5}
.k-bar a,.k-bar button{font:inherit;padding:6px 12px;border-radius:8px;border:0;background:#111;color:#fff;cursor:pointer;text-decoration:none}
.k-stage{padding:56px 24px 24px}
.k-page{max-width:860px;margin:0 auto;padding:40px 24px}
.k-page h1{font-size:22px;margin:0 0 6px}.k-page p{margin:0 0 16px;color:#555}
.k-page li{margin:0 0 10px}.k-page code{font:12px ui-monospace,monospace;background:#e7e7e3;padding:1px 5px;border-radius:4px}
.k-err{max-width:720px;margin:48px auto;padding:20px 24px;background:#fff;border-radius:12px}
.k-err li{margin:6px 0}`;

export function runKit(kit: Kit) {
  const B = E.BY[kit.brand];
  const root = document.getElementById('root')!;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  E.applyAssets(B, kit.assets ?? {});
  if (kit.rails) E.setWorldRails(kit.rails); // the rails the brand's World Graph tool holds
  const w = window as any;
  if (w.__KIT_FILM) { setupFilm(); return; } // film.mjs: the film stage instead of a layout
  const all = [...B.T, ...B.SL, ...((B as any).SC ?? [])];
  const job = readJob();
  if (!job) {
    root.innerHTML = `<div class="k-page"><h1>${E.esc(B.name)} layouts</h1><p>Open one to see it at full size. An agent renders them with <code>node render.mjs job.json out.png</code>.</p><ul>${all.map((t: any) => `<li><a href="#${t.id}">${E.esc(t.name)}</a> · <code>${t.id}</code> · ${E.esc(t.use ?? '')}</li>`).join('')}</ul></div>`;
    w.kitResult = { ok: true, template: null, width: 0, height: 0, params: {}, warnings: [] };
    addEventListener('hashchange', () => location.reload());
    return;
  }
  const t = all.find((x: any) => x.id === job.template);
  const fail = (errors: string[]) => {
    w.kitResult = { ok: false, errors } satisfies Result;
    root.innerHTML = `<div class="k-err"><h1>This job breaks the layout’s rules</h1><ul>${errors.map((e) => `<li>${E.esc(e)}</li>`).join('')}</ul><p><a href="#">All layouts</a></p></div>`;
  };
  if (!t) { fail([`No layout called "${job.template}". Layouts: ${all.map((x: any) => x.id).join(', ')}.`]); return; }
  const given = job.params ?? {};
  const errors = validate(t, given);
  if (errors.length) { fail(errors); return; }
  const p = E.sanitize(t, { ...E.defaults(t), ...given });
  const [width, height] = E.sizeOf(t, p);
  const warnings = (E.checks(t, p) as { ok: boolean; name: string; text: string }[]).filter((c) => !c.ok).map((c) => `${c.name}: ${c.text}`);
  root.innerHTML = `<div class="k-bar"><a href="#">All layouts</a><button type="button" id="k-png">Download PNG</button></div><div class="k-stage" id="k-stage">${E.tplHTML(t, p)}</div>`;
  E.mountWG();
  const art = () => document.querySelector('#k-stage > .a') as HTMLElement;
  w.kitExport = async (fmt: 'png' | 'video' = 'png') => {
    // Scenes (brand in use) are drawn at 2x so their small platform type stays sharp; any job can set "scale".
    const scale = Math.max(1, Math.min(4, Number(job.scale) || ((t as any).scene ? 2 : 1)));
    const blob = fmt === 'video' ? (await E.toVideo(art())).blob : await (E.toPNG as any)(art(), scale);
    return await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.readAsDataURL(blob); });
  };
  document.getElementById('k-png')!.onclick = async () => {
    const a = document.createElement('a');
    a.href = await w.kitExport('png');
    a.download = `${B.id}-${t.id}-${width}x${height}.png`;
    a.click();
  };
  addEventListener('hashchange', () => location.reload());
  // Ready once type has loaded and live globes have drawn a frame or two.
  (document.fonts?.ready ?? Promise.resolve()).then(() => new Promise((r) => setTimeout(r, 600))).then(() => {
    w.kitResult = { ok: true, template: t.id, width, height, params: p, warnings } satisfies Result;
  });
}
