#!/usr/bin/env node
// The score for a film, made from the film's own timeline (see SCORE.md).
//   node score.mjs film.json score.wav        render the score alone (film.mjs does this for you when film.json has "score")
//   node score.mjs --plan film.json           what the score will do: tempo, chords, the moments it plays to
//   node score.mjs --check film.mp4 film.json listen to a finished film: loudness, peaks, and whether its hits land on the cuts
// Needs Node 18+, Playwright and ffmpeg (or: pip install imageio-ffmpeg).
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const here = path.dirname(fileURLToPath(import.meta.url));
export const TARGET = { lufs: -14, peak: -1 }; // the calm style; the launch style plays louder, like its references
const lufsOf = (film) => ((film?.style ?? 'launch') === 'calm' ? -14 : -13);
const HEADROOM = 0.6, LIFT = 1.5; // normalise hot, then the limiter holds peaks about 1.5 dB under the target so AAC encoding (which adds 1-2 dB on sharp transients) stays inside it

function ffmpegPath() {
  for (const c of [process.env.FFMPEG, 'ffmpeg']) { if (!c) continue; try { execFileSync(c, ['-version'], { stdio: 'ignore' }); return c; } catch { /* next */ } }
  try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch { return null; }
}

async function withStage(fn) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => { window.__KIT_FILM = true; });
    await page.goto(pathToFileURL(path.join(here, 'render.html')).href);
    await page.waitForFunction(() => window.kitScore, null, { timeout: 60000 });
    return await fn(page);
  } finally { await browser.close(); }
}

export async function planOf(film) { return withStage((page) => page.evaluate((f) => window.kitScore.plan(f), film)); }

/** Render the film's score to a WAV at the loudness target. */
export async function renderScore(film, { out = 'score.wav', quiet = false } = {}) {
  const { wav, plan } = await withStage((page) => page.evaluate((f) => window.kitScore.render(f), film));
  await mkdir(path.dirname(path.resolve(out)), { recursive: true });
  const raw = path.join(os.tmpdir(), `score-${process.pid}.wav`);
  await writeFile(raw, Buffer.from(wav, 'base64'));
  const ff = ffmpegPath();
  if (ff) {
    // Two-pass loudness normalisation to the target, peaks kept under -1 dBTP.
    const first = spawnSync(ff, ['-hide_banner', '-i', raw, '-af', `loudnorm=I=${lufsOf(film) + LIFT}:TP=${TARGET.peak - HEADROOM}:LRA=11:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
    let m = null; try { m = JSON.parse(/\{[\s\S]*\}/.exec(first)?.[0] ?? 'null'); } catch { m = null; }
    const meas = m ? `:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true` : '';
    // A true-peak limiter after normalising: dense, transient-heavy mixes would otherwise clip once encoded to AAC.
    execFileSync(ff, ['-y', '-loglevel', 'error', '-i', raw, '-af', `loudnorm=I=${lufsOf(film) + LIFT}:TP=${TARGET.peak - HEADROOM}:LRA=11${meas},aresample=192000,alimiter=limit=0.66:attack=1:release=60:level=false,aresample=48000`, '-ar', '48000', out]);
    await rm(raw);
  } else { await writeFile(out, Buffer.from(wav, 'base64')); await rm(raw); }
  if (!quiet) console.log(`${out}: ${plan.tempo} BPM, ${plan.key} ${plan.mode}, ${plan.chords.length} chord changes, ${plan.moments.length} moments scored`);
  return plan;
}

/** Listen to a finished file: loudness, true peak, and how close each picture moment is to a sound onset. */
export async function checkScore(media, film) {
  const ff = ffmpegPath(); if (!ff) throw new Error('needs ffmpeg');
  const log = spawnSync(ff, ['-hide_banner', '-nostats', '-i', media, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr.split('Summary:').pop();
  const I = +(/I:\s+(-?[\d.]+) LUFS/.exec(log)?.[1] ?? NaN), peak = +(/Peak:\s+(-?[\d.]+) dBFS/.exec(log.split('True peak:')[1] ?? '')?.[1] ?? NaN);
  // Onsets: sudden rises in energy, in the full band and in the top band (where clicks and struck attacks live), each
  // judged against its own neighbourhood so a quiet accent over a busy bed still counts.
  const pcm = execFileSync(ff, ['-loglevel', 'error', '-i', media, '-ac', '1', '-ar', '22050', '-f', 's16le', '-'], { maxBuffer: 1 << 30 });
  const x = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2), hop = 256, win = 512, full = [], top = [];
  for (let i = 0; i + win < x.length; i += hop) { let s = 0, h = 0, prev = 0; for (let j = 0; j < win; j++) { const v = x[i + j] / 32768; s += v * v; const d = v - prev; h += d * d; prev = v; } full.push(Math.log10(1e-9 + s / win)); top.push(Math.log10(1e-9 + h / win)); }
  const fluxOf = (env) => env.map((v, i) => Math.max(0, v - Math.max(env[i - 1] ?? v, env[i - 2] ?? v, env[i - 3] ?? v)));
  const FF = fluxOf(full), FT = fluxOf(top), fr = (t) => Math.round((t * 22050 - win / 2) / hop);
  // How clearly a moment is heard: its attack against the strongest attack in the second around it (1 = the clearest).
  const clarity = (t) => { const a = fr(t - 0.07), b = fr(t + 0.07), lo = fr(t - 1), hi = fr(t + 1); let own = 0, near = 1e-9; for (const F of [FF, FT]) { for (let i = Math.max(0, a); i <= Math.min(F.length - 1, b); i++) own = Math.max(own, F[i] / Math.max(1e-9, Math.max(...F.slice(Math.max(0, lo), Math.min(F.length, hi))))); } void near; return own; };
  // Attack: how much the top band jumps at the moment itself (dB, its loudest 30 ms against the 130 ms before).
  // A sharp sound placed on the frame shows here even when a busy beat hides it from the onset detector.
  const attack = (t) => { const a = fr(t - 0.15), b = fr(t - 0.02), c = fr(t + 0.03), j = fr(t - 0.012); let pre = 0, k = 0, peak = -99; for (let i = Math.max(0, a); i <= b && i < top.length; i++) { pre += top[i]; k++; } for (let i = Math.max(0, j); i <= c && i < top.length; i++) peak = Math.max(peak, top[i]); return k ? 10 * (peak - pre / k) : 0; };
  const peaksOf = (env) => {
    const flux = fluxOf(env);
    const out = [], W = 40;
    for (let i = 2; i < flux.length - 2; i++) {
      const nb = flux.slice(Math.max(0, i - W), i + W).sort((a, b) => a - b), med = nb[Math.floor(nb.length / 2)], hi = nb[Math.floor(nb.length * 0.9)];
      if (flux[i] > Math.max(0.12, med + 1.5 * (hi - med)) && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1]) out.push((i * hop + win / 2) / 22050);
    }
    return out;
  };
  const onsets = [...peaksOf(full), ...peaksOf(top)].sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > 0.05);
  const moments = [];
  if (film) {
    const shots = [...(film.particles?.shots ?? [])].sort((a, b) => a.at - b.at);
    const md = (film.style ?? 'launch') === 'calm' ? 3 : 1.1;
    shots.forEach((s) => { if (s.morph) moments.push({ at: s.at + (s.morph.duration ?? md), what: `lands on ${typeof s.form === 'string' ? s.form : JSON.stringify(s.form)}` }); });
    for (const c of film.score?.cues ?? []) if (!['whoosh', 'riser', 'drop'].includes(c.type)) moments.push({ at: c.at, what: c.type ?? 'cue' });
    for (const c of film.cuts ?? []) moments.push({ at: typeof c === 'number' ? c : c.at, what: 'cut' });
  }
  const fps = film?.fps ?? 30;
  const report = moments.sort((a, b) => a.at - b.at).map((m) => { const near = onsets.reduce((b, o) => (Math.abs(o - m.at) < Math.abs(b - m.at) ? o : b), Infinity); const off = near - m.at; return { ...m, offset: off, frames: Math.round(off * fps), clarity: clarity(m.at), attack: attack(m.at) }; });
  const bands = [['bass', 60, 250], ['low mids', 250, 500], ['mids', 500, 2000], ['presence', 2000, 6000], ['air', 6000, 16000]];
  const rms = (lo, hi) => +(/RMS level dB:\s+(-?[\d.]+)/.exec(spawnSync(ff, ['-hide_banner', '-nostats', '-i', media, '-af', `highpass=f=${lo},lowpass=f=${hi},astats=metadata=0:measure_perchannel=none`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr.split('Overall').pop() ?? '')?.[1] ?? NaN);
  const lv = bands.map(([band, lo, hi]) => ({ band, db: rms(lo, hi) })), ref = lv[0].db;
  const balance = lv.slice(1).map((b) => ({ band: b.band, rel: b.db - ref }));
  return { lufs: I, peak, onsets: onsets.length, moments: report, balance };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  if (args[0] === '--plan') {
    const film = JSON.parse(await readFile(args[1], 'utf8')), p = await planOf(film);
    console.log(`Tempo ${p.tempo} BPM (beat ${p.beat.toFixed(3)}s); picture moments sit on average ${(p.fit.error * 1000).toFixed(0)} ms from the eighth-note grid at ${p.fit.bpm} BPM.`);
    console.log('Chords: ' + p.chords.map((c) => `${c.at.toFixed(2)}s ${c.sym}`).join(' · '));
    console.log('Moments: ' + p.moments.map((m) => `${m.at.toFixed(2)}s ${m.kind}`).join(' · '));
  } else if (args[0] === '--check') {
    const film = args[2] ? JSON.parse(await readFile(args[2], 'utf8')) : null, r = await checkScore(args[1], film);
    const target = lufsOf(film), okL = Math.abs(r.lufs - target) <= 1.5, okP = r.peak <= TARGET.peak + 0.05;
    console.log(`Loudness ${r.lufs} LUFS (target ${target}) ${okL ? 'ok' : 'off target'}; true peak ${r.peak} dBTP ${okP ? 'ok' : 'too hot'}; ${r.onsets} onsets.`);
    // Over a driving beat (the launch style) an accent is right when a sound starts on its frame; how much it stands
    // out varies as much in the reference films (about 50% at their cuts, a quarter under 30%), so clarity is shown,
    // not required. Particle landings ride the beat there and are reported, not judged. A calm score leaves room, so
    // there every accent must also be clear.
    const driven = (film?.style ?? 'launch') !== 'calm';
    const accent = (m) => !/^lands on/.test(m.what);
    const good = (m) => driven ? (!accent(m) || Math.abs(m.frames) <= 2 || m.attack >= 5) : ((Math.abs(m.frames) <= 2 && m.clarity >= 0.6) || m.attack >= 6);
    for (const m of r.moments) console.log(`${m.at.toFixed(2)}s ${m.what}: nearest onset ${Number.isFinite(m.offset) ? `${m.offset >= 0 ? '+' : ''}${(m.offset * 1000).toFixed(0)} ms (${m.frames} frames)` : 'none'}, clarity ${(m.clarity * 100).toFixed(0)}%, attack ${m.attack.toFixed(1)} dB ${good(m) ? (driven && !accent(m) ? 'noted' : 'ok') : Math.abs(m.frames) > 2 ? 'OFF THE FRAME: put a sound right on it (a cue), or move it onto the beat' : 'BURIED: make this accent stronger or thin the sound around it'}`);
    if (r.balance) console.log('Tonal balance (dB against the bass band; a typical modern mix sits near mids -3 to -8, presence -9 to -15, air -15 to -24): ' + r.balance.map((b) => `${b.band} ${b.rel >= 0 ? '+' : ''}${b.rel.toFixed(1)}`).join(' · '));
    if (!okL || !okP || r.moments.some((m) => !good(m))) process.exitCode = 1;
  } else if (args[0]) {
    const film = JSON.parse(await readFile(args[0], 'utf8'));
    await renderScore(film, { out: args[1] ?? 'score.wav' });
  } else console.log('usage: node score.mjs film.json score.wav | --plan film.json | --check film.mp4 film.json');
}
