import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import earthLum from "@/assets/earth-lum.jpg.asset.json";
import type { DesignSettings, Mask } from "@/lib/designShapes";
import { C, PALETTES, type Theme } from "./Globe";
import { ExportBridge } from "./ExportBridge";
import { makeDesignWorker } from "@/lib/designWorker";

function toMask(img: CanvasImageSource, w: number, h: number, invert: boolean, alphaAware: boolean): Mask {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    let l = (px[i * 4]! * 0.299 + px[i * 4 + 1]! * 0.587 + px[i * 4 + 2]! * 0.114) / 255;
    if (invert) l = 1 - l;
    if (alphaAware) l *= px[i * 4 + 3]! / 255;
    data[i] = l;
  }
  return { w, h, data };
}
const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
  const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = src;
});

async function buildMask(s: DesignSettings): Promise<Mask | null> {
  if (s.shape === "globe") {
    const m = toMask(await loadImg(earthLum.url), 1024, 512, false, false);
    for (let i = 0; i < m.data.length; i++) m.data[i] = Math.pow(m.data[i]!, 1.6);
    return m;
  }
  if (s.shape === "image") {
    if (!s.image) return null;
    const img = await loadImg(s.image);
    const sc = 400 / Math.max(img.width, img.height);
    return toMask(img, Math.max(1, Math.round(img.width * sc)), Math.max(1, Math.round(img.height * sc)), s.invert, true);
  }
  if (s.shape === "text") {
    const t = s.text.trim() || " ";
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    const font = "600 160px 'Figtree', sans-serif";
    try { await document.fonts.load(font, t); } catch { /* fallback font */ }
    ctx.font = font;
    c.width = Math.ceil(ctx.measureText(t).width) + 40; c.height = 220;
    ctx.font = font; ctx.fillStyle = "#fff"; ctx.textBaseline = "middle";
    ctx.fillText(t, 20, 115);
    return toMask(c, c.width, c.height, false, true);
  }
  return null;
}

function Particles({ settings, onCount }: { settings: DesignSettings; onCount: (n: number | null) => void }) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const worker = useRef<Worker | null>(null);
  const job = useRef(0);
  const ref = useRef<THREE.Points>(null);
  const { shape, density, separation, jitter, fill, text, image, invert } = settings;

  useEffect(() => {
    worker.current = makeDesignWorker();
    worker.current.onmessage = (e: MessageEvent<{ job: number; arr: Float32Array }>) => {
      if (e.data.job !== job.current) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(e.data.arr, 3));
      setGeo((old) => { old?.dispose(); return g; });
      onCount(e.data.arr.length / 3);
    };
    return () => worker.current?.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = ++job.current;
    onCount(null);
    const t = setTimeout(async () => {
      const mask = await buildMask(settings).catch(() => null);
      if (id !== job.current) return;
      worker.current?.postMessage({ job: id, settings, mask });
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, density, separation, jitter, fill, text, image, invert]);

  useFrame((_, dt) => { if (settings.spin && ref.current) ref.current.rotation.y += Math.min(dt, 0.05) * 0.12; });
  if (!geo) return null;
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={C.speck} size={settings.size} sizeAttenuation transparent opacity={settings.opacity} depthWrite={false} />
    </points>
  );
}

export default function DesignScene({ settings, theme, background, onCount, palette }: { settings: DesignSettings; theme: Theme; background: string; onCount: (n: number | null) => void; palette?: Partial<typeof C> | undefined }) {
  Object.assign(C, PALETTES[theme], palette ?? {});
  C.bg = background;
  return (
    <Canvas key={`${theme}:${palette ? JSON.stringify(palette) : ""}`} camera={{ position: [0, 0.6, 3.6], fov: 45 }} gl={{ preserveDrawingBuffer: true, antialias: true }} data-design-canvas="">
      <color attach="background" args={[C.bg]} />
      <Particles settings={settings} onCount={onCount} />
      <OrbitControls makeDefault enablePan={false} minDistance={1.5} maxDistance={9} />
      <ExportBridge />
    </Canvas>
  );
}
