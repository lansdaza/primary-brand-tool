#!/usr/bin/env node
// Renders a film: the brand's particle engine plus your own HTML/CSS overlay, frame by frame, to an MP4.
//   node film.mjs film.json out.mp4                 the whole film (with its score, if film.json has one)
//   node film.mjs film.json --stills 0,4.5,9 out/    stills at those times, to review before a full render
//   node film.mjs film.json --sheet out/sheet.png    one contact sheet, a frame every second
//   node film.mjs film.json out.mp4 --draft          half size, 15 fps: a quick look at pacing
//   node film.mjs --check film.json                  check the film without rendering
//   node film.mjs --forms                            list the particle forms
// See FILM.md for the film format. Needs Node 18+, Playwright and ffmpeg (or: pip install imageio-ffmpeg).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const BOOL = ['--check', '--forms', '--draft', '--no-score'];
const motionFile = (() => { const i = args.indexOf('--motion'); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; })();
const flag = (f) => { const i = args.indexOf(f); if (i < 0) return null; if (BOOL.includes(f)) { args.splice(i, 1); return true; } const v = args[i + 1]; args.splice(i, v && !v.startsWith('--') ? 2 : 1); return v && !v.startsWith('--') ? v : true; };
const check = !!flag('--check'), listForms = !!flag('--forms'), draft = !!flag('--draft');
const stills = flag('--stills'), sheet = flag('--sheet'), from = +(flag('--from') || 0), to = flag('--to'), noScore = !!flag('--no-score');

// --motion film.mp4 [film.json]: measures a rendered film's cadence against its motion style (see FILM.md).
// Motion is read from frame-to-frame change at 160×90 (calibrated against the reference films the launch style is
// measured from), so it needs only ffmpeg.
const RANGES = {
  launch: { movingShare: [0.25, 0.62], moveMedian: [0.08, 0.6], holdMean: [0.4, 1.2], shotMedian: [1.2, 2.8], cutSyncMs: 100 }, // the five reference films measure 0.29–0.60, 0.10–0.53 s, 0.47–0.85 s and 1.5–2.3 s
  calm: { movingShare: [0.25, 0.65], moveMedian: [0.7, 2.5], holdMean: [1.0, 4.0], shotMedian: [2.5, 6], cutSyncMs: 100 },
};
async function motionReport(media, film) {
  const ff = (() => { for (const c of [process.env.FFMPEG, 'ffmpeg']) { if (!c) continue; try { execFileSync(c, ['-version'], { stdio: 'ignore' }); return c; } catch { /* next */ } } try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch { return null; } })();
  if (!ff) throw new Error('needs ffmpeg');
  const txt = execFileSync(ff, ['-v', 'error', '-i', media, '-an', '-vf', 'scale=160:90,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { maxBuffer: 1 << 28 }).toString();
  const v = [...txt.matchAll(/YAVG=([\d.]+)/g)].map((m) => +m[1]);
  const fps = film?.fps ?? 30, n = v.length, med = (a) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };
  const cutsSeen = []; v.forEach((x, i) => { if (x > 25 && (!cutsSeen.length || i - cutsSeen[cutsSeen.length - 1] > 3)) cutsSeen.push(i); });
  const declared = (film?.cuts ?? []).map((c) => (typeof c === 'number' ? c : c.at));
  const cuts = [...new Set([...cutsSeen.map((i) => +(i / fps).toFixed(2)), ...declared])].sort((a, b) => a - b).filter((c, i, a) => i === 0 || c - a[i - 1] > 0.15);
  const isCut = new Set(cutsSeen.flatMap((i) => [i - 1, i, i + 1]));
  const moving = v.map((x, i) => !isCut.has(i) && x > 1);
  const runs = (want) => { const out = []; let r = 0; for (const m of [...moving, !want]) { if (m === want) r++; else { if (r) out.push(r / fps); r = 0; } } return out; };
  const moves = runs(true).filter((d) => d >= 0.1), holds = runs(false).filter((d) => d >= 0.25);
  const bounds = [0, ...cuts, n / fps], shots = bounds.slice(1).map((b, i) => b - bounds[i]).filter((d) => d > 0.05);
  let sync = null;
  if (film?.score) {
    try { const { planOf } = await import(pathToFileURL(path.join(here, 'score.mjs')).href); const p = await planOf(film); const half = p.beat / 2; sync = cuts.map((c) => Math.round((c / half - Math.round(c / half)) * half * 1000)); } catch { sync = null; }
  }
  return { movingShare: moving.filter(Boolean).length / n, moveMedian: med(moves), holdMean: holds.reduce((a, b) => a + b, 0) / (holds.length || 1), shotMedian: med(shots), cuts, sync, moves: moves.length, holds: holds.length };
}
if (motionFile) {
  const filmFile = args[0];
  const film = filmFile ? JSON.parse(await readFile(filmFile, 'utf8')) : null;
  const style = film?.style ?? 'launch', R = RANGES[style] ?? RANGES.launch, r = await motionReport(motionFile, film);
  const line = (label, val, [lo, hi], unit, fix) => console.log(`${label}: ${val.toFixed(2)}${unit} (style ${lo}–${hi}${unit}) ${val >= lo && val <= hi ? 'ok' : fix}`);
  console.log(`Motion against the ${style} style:`);
  line('Share of the film moving', r.movingShare, R.movingShare, '', r.movingShare > R.movingShare[1] ? 'TOO BUSY: hold still between moves' : 'TOO STILL: move more often');
  line('Typical move', r.moveMedian, R.moveMedian, ' s', r.moveMedian > R.moveMedian[1] ? 'TOO SLOW: shorten moves' : 'TOO FAST');
  line('Typical hold', r.holdMean, R.holdMean, ' s', r.holdMean > R.holdMean[1] ? 'HOLDS TOO LONG' : 'HOLDS TOO SHORT: let things land');
  line('Typical shot', r.shotMedian, R.shotMedian, ' s', r.shotMedian > R.shotMedian[1] ? 'SHOTS TOO LONG: cut more' : 'SHOTS TOO SHORT');
  if (r.sync) { const off = r.sync.filter((ms) => Math.abs(ms) > R.cutSyncMs); console.log(`Cuts on the beat: ${r.sync.length - off.length} of ${r.sync.length} within ${R.cutSyncMs} ms ${off.length ? 'MOVE THESE CUTS ONTO THE BEAT: ' + r.cuts.filter((c, i) => Math.abs(r.sync[i]) > R.cutSyncMs).map((c) => c + 's').join(', ') : 'ok'}`); }
  console.log(`${r.cuts.length} cuts, ${r.moves} moves, ${r.holds} holds.`);
  process.exit(0);
}

let chromium;
try { ({ chromium } = await import('playwright')); } catch { console.error('film.mjs needs Playwright: npm i playwright (see SKILL.md if the browser download is blocked)'); process.exit(2); }

function ffmpegPath() {
  for (const c of [process.env.FFMPEG, 'ffmpeg']) { if (!c) continue; try { execFileSync(c, ['-version'], { stdio: 'ignore' }); return c; } catch { /* next */ } }
  try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch { return null; }
}

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
async function stage(film, scale = 1) {
  const W = Math.round(film.width * scale), H = Math.round(film.height * scale);
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => { window.__KIT_FILM = true; });
  await page.goto(pathToFileURL(path.join(here, 'render.html')).href);
  await page.waitForFunction(() => window.kitFilm, null, { timeout: 60000 });
  return { page, W, H, errors };
}

if (listForms) {
  const { page } = await stage({ width: 64, height: 64 });
  const forms = await page.evaluate(() => window.kitFilm.forms);
  for (const [k, v] of Object.entries(forms)) console.log(`${k.padEnd(16)} ${v}`);
  await browser.close(); process.exit(0);
}

const file = args[0];
if (!file) { console.error('usage: node film.mjs film.json out.mp4   (see FILM.md)'); process.exit(2); }
const dir = path.dirname(path.resolve(file));
const film = JSON.parse(await readFile(file, 'utf8'));
const problems = [];
for (const k of ['width', 'height', 'duration']) if (typeof film[k] !== 'number') problems.push(`"${k}" must be a number.`);
if (film.width % 2 || film.height % 2) problems.push('width and height must be even numbers.');
const overlayFile = film.overlay ? path.resolve(dir, film.overlay) : null;
if (overlayFile && !existsSync(overlayFile)) problems.push(`overlay file not found: ${film.overlay}`);
const { page, W, H, errors } = await stage(film, draft ? 0.5 : 1);
if (film.particles) problems.push(...await page.evaluate((p) => window.kitFilm.check(p), film.particles));
if (problems.length) { console.error('This film is not ready:\n- ' + problems.join('\n- ')); await browser.close(); process.exit(1); }
if (check) { console.log(`ok: ${film.width}×${film.height}, ${film.duration}s`); await browser.close(); process.exit(0); }

// The overlay: HTML from the film's folder, with brand.css (and its fonts) available as in the kit.
let overlay = overlayFile ? await readFile(overlayFile, 'utf8') : '';
const base = pathToFileURL(dir + '/').href, kitBase = pathToFileURL(here + '/').href;
overlay = overlay.replace(/(src|href)="(?!https?:|data:|\/|#)([^"]+)"/g, (m, a, p) => `${a}="${existsSync(path.resolve(dir, p)) ? base : kitBase}${p}"`);
let css = await readFile(path.join(here, 'brand.css'), 'utf8');
css = css.replace(/url\("(?!data:)([^"]+)"\)/g, (m, p) => `url("${kitBase}${p}")`);
if (draft) css += `\n#overlay{transform:scale(0.5);transform-origin:0 0;width:${film.width}px;height:${film.height}px}`;
const particles = film.particles ? { ...film.particles } : null;
const prep = await page.evaluate((spec) => window.kitFilm.prepare(spec).then((r) => r, (e) => ({ error: String(e.message ?? e) })), { width: W, height: H, background: film.background, particles, overlay, css, style: film.style ?? 'launch', fps: draft ? 15 : (film.fps ?? 30) });
if (prep.error) { console.error(`The film could not be set up: ${prep.error}`); await browser.close(); process.exit(1); }
if (overlay && !prep.overlaySeek) console.warn('Note: the overlay defines no window.seek(t), so it will not move.');

const fps = draft ? 15 : (film.fps ?? 30);
const shoot = async (t) => { await page.evaluate((x) => window.kitFilm.seek(x), t); return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } }); };

if (stills || sheet) {
  const times = stills ? String(stills).split(',').map(Number) : Array.from({ length: Math.floor(film.duration) + 1 }, (_, i) => Math.min(i, film.duration - 0.01));
  const out = sheet ? (typeof sheet === 'string' ? sheet : 'sheet.png') : (args[1] ?? 'stills');
  if (stills) { await mkdir(out, { recursive: true }); for (const t of times) { const f = path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`); await writeFile(f, await shoot(t)); console.log(f); } }
  else {
    // A contact sheet: frames in a grid, each labelled with its time.
    const frames = []; for (const t of times) frames.push((await shoot(t)).toString('base64'));
    const cols = Math.min(6, frames.length), cw = 300, ch = Math.round(cw * H / W);
    const html = `<body style="margin:0;background:#EDECE9;font:12px monospace;color:#201E1A"><div style="display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:12px;padding:16px">${frames.map((b, i) => `<figure style="margin:0"><img src="data:image/png;base64,${b}" style="width:${cw}px;height:${ch}px;display:block"><figcaption style="padding-top:4px">${times[i].toFixed(1)}s</figcaption></figure>`).join('')}</div></body>`;
    const sp = await browser.newPage({ viewport: { width: cols * (cw + 12) + 20, height: 400 } }); await sp.setContent(html);
    await mkdir(path.dirname(path.resolve(out)), { recursive: true }); await sp.screenshot({ path: out, fullPage: true }); console.log(out);
  }
  if (errors.length) console.warn('Page errors:\n' + errors.join('\n'));
  await browser.close(); process.exit(0);
}

const ff = ffmpegPath();
if (!ff) { console.error('film.mjs needs ffmpeg to write video: install it, or pip install imageio-ffmpeg'); await browser.close(); process.exit(2); }
const out = args[1] ?? 'film.mp4';
await mkdir(path.dirname(path.resolve(out)), { recursive: true });
const end = to ? Math.min(+to, film.duration) : film.duration, total = Math.round((end - from) * fps);

// The score, rendered by the kit's own score engine from the film's timeline (see SCORE.md).
let wav = null;
if (film.score && !noScore && !draft) {
  const { renderScore } = await import(pathToFileURL(path.join(here, 'score.mjs')).href);
  wav = out.replace(/\.\w+$/, '') + '.score.wav';
  await renderScore(film, { file, out: wav, quiet: true });
}
// Motion blur: each frame is the average of several moments across half a frame's time (a 180° shutter), so
// anything fast smears along its path as it would on camera. "motionBlur": 0 turns it off; drafts skip it.
const sub = draft ? 1 : Math.max(1, Math.min(8, Math.round(film.motionBlur ?? 3)));
const blurVf = sub > 1 ? ['-vf', `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB)`, '-r', String(fps)] : [];
const enc = spawn(ff, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps * sub), '-i', '-',
  ...(wav ? ['-ss', String(from), '-i', wav] : []),
  ...blurVf,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  ...(wav ? ['-c:a', 'aac', '-b:a', '256k', '-shortest'] : []), out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  for (let j = sub - 1; j >= 0; j--) {
    const png = await shoot(Math.max(0, from + i / fps - (j * 0.5) / (fps * sub)));
    if (!enc.stdin.write(png)) await new Promise((r) => enc.stdin.once('drain', r));
  }
  if (i % fps === 0) process.stdout.write(`\r${Math.round((i / total) * 100)}%  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
enc.stdin.end();
await new Promise((r) => enc.on('close', r));
console.log(`\r${out}: ${W}×${H}, ${(total / fps).toFixed(2)}s at ${fps} fps${sub > 1 ? `, motion blur ${sub}×` : ''}${wav ? ', with score' : ''}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
if (errors.length) console.warn('Page errors:\n' + errors.join('\n'));
await browser.close();
