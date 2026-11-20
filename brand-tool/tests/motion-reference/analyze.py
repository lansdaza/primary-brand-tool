"""Measure a film's motion and sound: cuts, holds, moves and their speed curves, blur transitions, tempo and
cut-to-beat sync, loudness. Usage: python3 -I analyze.py film.mp4 out_dir"""
import sys, json, subprocess, os
import numpy as np, cv2, librosa
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
name = os.path.splitext(os.path.basename(src))[0]
cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
W, H = 320, 180
prev = None; prevh = None
flow_mag, mad, hist_corr, sharp, zoom = [], [], [], [], []
ys, xs = np.mgrid[0:H, 0:W]
cx, cy = xs - W / 2, ys - H / 2
rad = np.sqrt(cx ** 2 + cy ** 2) + 1e-6
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.cvtColor(cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
    h = cv2.calcHist([g], [0], None, [64], [0, 256]); cv2.normalize(h, h)
    sharp.append(cv2.Laplacian(g, cv2.CV_64F).var())
    if prev is not None:
        fl = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        m = np.sqrt(fl[..., 0] ** 2 + fl[..., 1] ** 2)
        flow_mag.append(float(np.mean(m)))
        # radial component: positive = expanding (push in), negative = contracting
        zoom.append(float(np.mean((fl[..., 0] * cx + fl[..., 1] * cy) / rad)))
        mad.append(float(np.mean(cv2.absdiff(prev, g))))
        hist_corr.append(float(cv2.compareHist(prevh, h, cv2.HISTCMP_CORREL)))
    else:
        flow_mag.append(0.0); zoom.append(0.0); mad.append(0.0); hist_corr.append(1.0)
    prev, prevh = g, h
n = len(flow_mag); t = np.arange(n) / fps
flow = np.array(flow_mag); mad = np.array(mad); hc = np.array(hist_corr); sharp = np.array(sharp); zoom = np.array(zoom)

# Cuts: an abrupt change in picture content that motion does not explain.
cut_idx = [i for i in range(1, n) if (hc[i] < 0.75 and mad[i] > 12) or mad[i] > 40]
cuts = []
for i in cut_idx:
    if not cuts or i - cuts[-1] > 3: cuts.append(i)
cut_t = [round(i / fps, 3) for i in cuts]
bounds = [0] + cut_t + [round(n / fps, 3)]
shots = [round(b - a, 3) for a, b in zip(bounds[:-1], bounds[1:]) if b - a > 0.05]

# Motion: speed in screen-widths per second (flow at 320 px wide).
speed = flow * fps / W
sm = np.convolve(speed, np.ones(3) / 3, mode='same')
for i in cuts: sm[max(0, i - 1):i + 2] = np.nan  # cuts are not motion
still = np.nan_to_num(sm, nan=0) < 0.02
# Holds: runs of stillness of at least 0.25 s.
holds, run = [], 0
for s in list(still) + [False]:
    if s: run += 1
    else:
        if run / fps >= 0.25: holds.append(round(run / fps, 3))
        run = 0
moving_share = float(np.mean(~still))
# Moves: runs above threshold; their speed profile shape.
moves, i = [], 0
v = np.nan_to_num(sm, nan=0)
while i < n:
    if v[i] >= 0.04:
        j = i
        while j < n and v[j] >= 0.02: j += 1
        seg = v[i:j]
        if len(seg) >= 4:
            pk = int(np.argmax(seg)); d = len(seg) / fps
            # settle: time from peak until speed falls under 10% of peak, as a share of the move
            after = seg[pk:]; below = np.where(after < 0.1 * seg[pk])[0]
            settle = (below[0] if len(below) else len(after)) / len(seg)
            moves.append({'at': round(i / fps, 3), 'dur': round(d, 3), 'peak_at': round(pk / len(seg), 3), 'peak': round(float(seg[pk]), 3), 'settle': round(float(settle), 3)})
        i = j
    else:
        i += 1
# Blur transitions: sharpness dips to under 35% of its local median.
med = np.array([np.median(sharp[max(0, k - 30):k + 30]) for k in range(n)])
blur = [round(k / fps, 3) for k in range(1, n - 1) if sharp[k] < 0.35 * med[k] and sharp[k] <= sharp[k - 1] and sharp[k] <= sharp[k + 1]]
pushes = float(np.mean(zoom[np.abs(zoom) > 0.3] > 0)) if np.any(np.abs(zoom) > 0.3) else 0.0

# Sound
wav = os.path.join(out, name + '.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '22050', wav], check=True)
y, sr = librosa.load(wav, sr=22050)
oenv = librosa.onset.onset_strength(y=y, sr=sr)
tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, units='time')
tempo = float(np.atleast_1d(tempo)[0])
onsets = librosa.onset.onset_detect(onset_envelope=oenv, sr=sr, units='time', backtrack=False)
def nearest(x, arr): return float(arr[np.argmin(np.abs(np.asarray(arr) - x))]) - x if len(arr) else float('nan')
cut_beat = [round(nearest(c, beats) * 1000) for c in cut_t]
cut_onset = [round(nearest(c, onsets) * 1000) for c in cut_t]
half = 60 / tempo / 2
cut_grid = [round(((c / half) - round(c / half)) * half * 1000) for c in cut_t]
lufs = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr.split('Summary:')[-1]
import re
I = re.search(r'I:\s+(-?[\d.]+) LUFS', lufs); LRA = re.search(r'LRA:\s+([\d.]+) LU', lufs); TP = re.search(r'Peak:\s+(-?[\d.]+) dBFS', lufs.split('True peak:')[-1])
bands = {}
for nm, lo, hi in [('bass', 60, 250), ('lowmid', 250, 500), ('mid', 500, 2000), ('presence', 2000, 6000), ('air', 6000, 16000)]:
    e = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', f'highpass=f={lo},lowpass=f={hi},astats=metadata=0:measure_perchannel=none', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'RMS level dB:\s+(-?[\d.]+)', e); bands[nm] = float(m[-1]) if m else None
rel = {k: round(v - bands['bass'], 1) for k, v in bands.items() if k != 'bass' and v is not None}

res = {
    'name': name, 'fps': round(fps, 3), 'duration': round(n / fps, 2), 'cuts': len(cut_t), 'cut_times': cut_t,
    'shot_len': {'mean': round(float(np.mean(shots)), 2), 'median': round(float(np.median(shots)), 2), 'min': min(shots), 'max': max(shots), 'all': shots},
    'moving_share': round(moving_share, 2), 'holds': {'count': len(holds), 'mean': round(float(np.mean(holds)), 2) if holds else 0, 'all': holds},
    'moves': {'count': len(moves), 'dur_median': round(float(np.median([m['dur'] for m in moves])), 2) if moves else 0,
              'peak_at_median': round(float(np.median([m['peak_at'] for m in moves])), 2) if moves else 0,
              'settle_median': round(float(np.median([m['settle'] for m in moves])), 2) if moves else 0,
              'peak_speed_median': round(float(np.median([m['peak'] for m in moves])), 2) if moves else 0},
    'blur_transitions': blur, 'push_share': round(pushes, 2),
    'tempo': round(tempo, 1), 'onsets_per_s': round(len(onsets) / (n / fps), 2),
    'cut_to_beat_ms': cut_beat, 'cut_to_halfbeat_grid_ms': cut_grid, 'cut_to_onset_ms': cut_onset,
    'lufs': float(I.group(1)) if I else None, 'lra': float(LRA.group(1)) if LRA else None, 'true_peak': float(TP.group(1)) if TP else None, 'balance': rel,
}
json.dump(res, open(os.path.join(out, name + '.json'), 'w'), indent=1)

fig, ax = plt.subplots(3, 1, figsize=(14, 7), sharex=True)
ax[0].plot(t, speed, lw=0.8, color='#222'); ax[0].set_ylabel('speed (widths/s)')
for c in cut_t: [a.axvline(c, color='#e44', lw=0.8) for a in ax]
for b in beats: ax[1].axvline(b, color='#bbb', lw=0.5)
ax[1].plot(librosa.times_like(oenv, sr=sr), oenv / oenv.max(), lw=0.8, color='#225'); ax[1].set_ylabel('onsets')
ax[2].plot(t, sharp / np.max(sharp), lw=0.8, color='#252'); ax[2].plot(t, np.clip(zoom * 2, -1, 1) * 0.5 + 0.5, lw=0.6, color='#a60'); ax[2].set_ylabel('sharp / zoom')
ax[0].set_title(f'{name}: red = cuts, grey = beats ({tempo:.0f} BPM)')
plt.tight_layout(); plt.savefig(os.path.join(out, name + '-curves.png'), dpi=80)
print(json.dumps({k: res[k] for k in ['name', 'duration', 'cuts', 'shot_len', 'moving_share', 'holds', 'moves', 'tempo', 'onsets_per_s', 'cut_to_beat_ms', 'cut_to_halfbeat_grid_ms', 'cut_to_onset_ms', 'lufs', 'lra', 'true_peak', 'balance', 'blur_transitions', 'push_share']}, default=str))
