"""The shape of the references' moves: for every clear move, the share of its distance covered over time (position
curve), averaged, then fitted with a CSS cubic-bezier. Usage: python3 -I curves.py out_dir film1.mp4 film2.mp4 ..."""
import sys, os, json
import numpy as np, cv2
from scipy.optimize import minimize
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

out = sys.argv[1]; files = sys.argv[2:]
W, H = 320, 180
profiles, durs = [], []
for src in files:
    cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); prev = None; sp = []; mad = []
    while True:
        ok, f = cap.read()
        if not ok: break
        g = cv2.cvtColor(cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        if prev is not None:
            fl = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            sp.append(float(np.mean(np.sqrt(fl[..., 0] ** 2 + fl[..., 1] ** 2))) * fps / W); mad.append(float(np.mean(cv2.absdiff(prev, g))))
        prev = g
    sp = np.array(sp); mad = np.array(mad)
    sp[mad > 40] = 0  # cuts
    i, n = 0, len(sp)
    while i < n:
        if sp[i] > 0.06:
            a = i
            while a > 0 and sp[a - 1] > 0.012: a -= 1
            b = i
            while b < n and sp[b] > 0.012: b += 1
            seg = sp[a:b]
            if len(seg) >= 5 and seg.max() > 0.12:
                pos = np.cumsum(seg); pos = pos / pos[-1]
                # 5%..95% of the distance: the move proper, without the creep at either end
                t5 = np.searchsorted(pos, 0.01); t95 = len(pos) - 1  # keep the whole settle: it is where the feel is
                core = pos[t5:t95 + 1]
                if len(core) >= 4:
                    core = (core - core[0]) / (core[-1] - core[0])
                    x = np.linspace(0, 1, len(core))
                    profiles.append(np.interp(np.linspace(0, 1, 50), x, core)); durs.append((t95 - t5 + 1) / fps)
            i = b
        else:
            i += 1
P = np.array(profiles); mean = np.median(P, axis=0); mean = (mean - mean[0]) / (mean[-1] - mean[0]); xs = np.linspace(0, 1, 50)

def bez(p, x):
    x1, y1, x2, y2 = p
    t = np.linspace(0, 1, 400)
    bx = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3
    by = 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3
    return np.interp(x, bx, by)
res = minimize(lambda p: np.mean((bez(p, xs) - mean) ** 2), [0.2, 0.8, 0.3, 1.0], bounds=[(0, 1), (0, 1.6), (0, 1), (0, 1.6)])
fit = [round(v, 3) for v in res.x]
half = float(np.interp(0.5, mean, xs)); ninety = float(np.interp(0.9, mean, xs))
d = np.array(durs)
summary = {'moves': len(P), 'bezier': fit, 'rms_error': round(float(np.sqrt(res.fun)), 4), 'half_distance_at': round(half, 3), 'ninety_at': round(ninety, 3),
           'dur': {'p25': round(float(np.percentile(d, 25)), 2), 'median': round(float(np.median(d)), 2), 'p75': round(float(np.percentile(d, 75)), 2), 'p90': round(float(np.percentile(d, 90)), 2)}}
print(json.dumps(summary))
json.dump({**summary, 'mean_curve': [round(v, 4) for v in mean]}, open(os.path.join(out, 'curve.json'), 'w'), indent=1)
plt.figure(figsize=(6, 5))
for p in P: plt.plot(xs, p, color='#999', lw=0.4, alpha=0.4)
plt.plot(xs, mean, color='#000', lw=2, label='references (median)')
plt.plot(xs, bez(res.x, xs), color='#e44', lw=1.5, ls='--', label='cubic-bezier(' + ', '.join(str(v) for v in fit) + ')')
plt.plot(xs, np.where(xs < 0.5, 4 * xs ** 3, 1 - (-2 * xs + 2) ** 3 / 2), color='#48c', lw=1, label='our old ease (cubic in-out)')
plt.legend(); plt.xlabel('time through the move'); plt.ylabel('share of distance'); plt.tight_layout(); plt.savefig(os.path.join(out, 'curve.png'), dpi=90)
# The snappier half of the moves: the 75th-percentile curve (more distance early), fitted the same way.
q = np.percentile(P, 75, axis=0); q = (q - q[0]) / (q[-1] - q[0])
r2 = minimize(lambda p: np.mean((bez(p, xs) - q) ** 2), [0.2, 0.8, 0.3, 1.0], bounds=[(0, 1), (0, 1.6), (0, 1), (0, 1.6)])
print(json.dumps({'snap_bezier': [round(v, 3) for v in r2.x], 'snap_half_at': round(float(np.interp(0.5, q, xs)), 3), 'snap_ninety_at': round(float(np.interp(0.9, q, xs)), 3)}))
