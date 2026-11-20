import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { exportView } from "@/lib/exporter";
import { BackgroundControl } from "@/components/BackgroundControl";
import { useBackgroundColor } from "@/hooks/use-background-color";
import {
  DEFAULT_SETTINGS, DENSITY_MAX, DENSITY_MIN, PRESET_KEY, SHAPES, STARTER_PRESETS,
  type DesignSettings, type Preset, type Shape,
} from "@/lib/designShapes";

const DesignScene = lazy(() => import("@/components/DesignScene"));

export const Route = createFileRoute("/design")({
  head: () => ({
    meta: [
      { title: "Design — Aurelius Particle Studio" },
      { name: "description", content: "Create your own Aurelius particle designs: shapes, logos and words drawn in fine specks." },
      { property: "og:title", content: "Design — Aurelius Particle Studio" },
      { property: "og:description", content: "Tune speck size, spacing and density, reshape the globe, and save your designs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Design,
});

const SHAPE_LABEL: Record<Shape, string> = {
  globe: "Earth", sphere: "Sphere", cube: "Cube", ring: "Ring", cylinder: "Cylinder",
  pyramid: "Pyramid", wave: "Wave", image: "Image", text: "Text",
};

function shrinkImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 512 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/png"));
      };
      img.onerror = rej;
      img.src = r.result as string;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="block">
      <div className="hud flex justify-between"><span>{label}</span><span className="text-foreground">{fmt ? fmt(value) : value}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-primary" />
    </label>
  );
}

function Design() {
  const [s, setS] = useState<DesignSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { background, chooseBackground, resetBackground } = useBackgroundColor(theme);
  const [presets, setPresets] = useState<Preset[]>(STARTER_PRESETS);
  const [count, setCount] = useState<number | null>(null);
  const [name, setName] = useState("");
  const set = (p: Partial<DesignSettings>) => setS((o) => ({ ...o, ...p }));

  useEffect(() => {
    const t = localStorage.getItem("aurelius-theme");
    if (t === "light" || t === "dark") setTheme(t);
    try { const raw = localStorage.getItem(PRESET_KEY); if (raw) setPresets(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("light", theme === "light"); }, [theme]);
  const savePresets = (p: Preset[]) => {
    setPresets(p);
    try { localStorage.setItem(PRESET_KEY, JSON.stringify(p)); } catch { alert("Browser storage is full — try a smaller image."); }
  };

  // density slider on a log scale
  const logMin = Math.log(DENSITY_MIN), logMax = Math.log(DENSITY_MAX);
  const dPos = (Math.log(s.density) - logMin) / (logMax - logMin);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <DesignScene settings={s} theme={theme} background={background} onCount={setCount} />
          </Suspense>
        </ClientOnly>
      </div>

      <header className="pointer-events-none absolute left-8 top-8">
        <h1 className="font-display text-xl tracking-[0.35em]">AURELIUS</h1>
        <p className="hud mt-3">Design studio</p>
      </header>

      <div className="hud absolute bottom-8 left-8 flex items-center gap-8">
        <Link to="/" className="rounded-full border border-border px-3 py-1.5 hover:text-foreground">← Globe</Link>
        <div className="flex overflow-hidden rounded-full border border-border">
          {(["png", "svg"] as const).map((f) => (
            <button key={f} onClick={() => exportView(f, `design-${s.shape}`)} className="px-3 py-1.5 transition-colors hover:text-foreground">↓ {f}</button>
          ))}
        </div>
        <span>{count === null ? "building…" : `${count.toLocaleString()} specks`}</span>
      </div>

      <aside className="absolute bottom-8 right-8 top-8 flex w-80 flex-col overflow-y-auto rounded-lg border border-border bg-card/70 backdrop-blur">
        <div className="space-y-5 p-4">
          <BackgroundControl value={background} onChange={chooseBackground} onReset={resetBackground} />
          <div>
            <span className="hud">Shape</span>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {SHAPES.map((sh) => (
                <button key={sh} onClick={() => set({ shape: sh })}
                  className={`rounded-md border border-border px-2 py-1.5 text-xs transition-colors ${s.shape === sh ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                  {SHAPE_LABEL[sh]}
                </button>
              ))}
            </div>
          </div>

          {s.shape === "text" && (
            <input value={s.text} onChange={(e) => set({ text: e.target.value })} maxLength={24}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" placeholder="Type a word" />
          )}
          {s.shape === "image" && (
            <div className="space-y-2">
              <input type="file" accept="image/*" className="w-full text-xs"
                onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ image: await shrinkImage(f) }); }} />
              <label className="hud flex items-center gap-2">
                <input type="checkbox" checked={s.invert} onChange={(e) => set({ invert: e.target.checked })} />
                Dark parts become specks
              </label>
              {!s.image && <p className="hud">Upload a logo or picture — bright parts become specks.</p>}
            </div>
          )}

          <Slider label="Particle size" value={s.size} min={0.002} max={0.04} step={0.001} onChange={(v) => set({ size: v })} fmt={(v) => v.toFixed(3)} />
          <Slider label="Separation" value={s.separation} min={0} max={0.08} step={0.002} onChange={(v) => set({ separation: v })} fmt={(v) => (v === 0 ? "off" : v.toFixed(3))} />
          <Slider label="Density" value={dPos} min={0} max={1} step={0.005}
            onChange={(p) => set({ density: Math.round(Math.exp(logMin + p * (logMax - logMin))) })}
            fmt={() => s.density.toLocaleString()} />
          <Slider label="Opacity" value={s.opacity} min={0.1} max={1} step={0.05} onChange={(v) => set({ opacity: v })} />
          <Slider label="Randomness" value={s.jitter} min={0} max={1} step={0.05} onChange={(v) => set({ jitter: v })} />

          <div className="flex items-center justify-between">
            <div className="flex overflow-hidden rounded-full border border-border text-xs">
              {(["surface", "volume"] as const).map((f) => (
                <button key={f} onClick={() => set({ fill: f })} className={`px-3 py-1 ${s.fill === f ? "bg-primary text-primary-foreground" : ""}`}>{f}</button>
              ))}
            </div>
            <label className="hud flex items-center gap-2">
              <input type="checkbox" checked={s.spin} onChange={(e) => set({ spin: e.target.checked })} /> Spin
            </label>
          </div>
          {s.separation > 0 && count !== null && count < s.density * 0.95 && (
            <p className="hud">Separation limits this shape to {count.toLocaleString()} specks.</p>
          )}
        </div>

        <div className="border-t border-border p-4">
          <span className="hud">Presets</span>
          <div className="mt-2 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this design"
              className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-xs" />
            <button disabled={!name.trim()}
              onClick={() => { savePresets([...presets, { id: crypto.randomUUID(), name: name.trim(), settings: s }]); setName(""); }}
              className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-40">Save</button>
          </div>
          <ul className="mt-2 space-y-1">
            {presets.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50">
                <input value={p.name} onChange={(e) => savePresets(presets.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                <button onClick={() => setS({ ...DEFAULT_SETTINGS, ...p.settings })} className="hud hover:text-foreground">Load</button>
                <button onClick={() => savePresets(presets.filter((x) => x.id !== p.id))} className="hud text-destructive">✕</button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
