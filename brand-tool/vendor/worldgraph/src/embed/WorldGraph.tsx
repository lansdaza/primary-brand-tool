// Embeddable World Graph: the same globe, land dots, particle Earth and rails as the studio view,
// without the studio around it. A host (a template, a deck, a video renderer) mounts it into any
// element, passes its state in, and asks for the frame at a given time.
//
//   const graph = mountWorldGraph(el, { style: "particles", palette: { bg: "#201E1A", ... } });
//   graph.renderAt(3.2);              // draw the frame at 3.2 seconds
//   ctx.drawImage(graph.snapshot(), 0, 0);   // globe + labels, transparent outside the globe
//
// Nothing here reads localStorage, the URL or the wall clock, so the same options and the same
// time always give the same picture.
import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { Arc, C, LandDots, PALETTES, ParticleEarth } from "@/components/Globe";
import { GLOBE_RADIUS, toVec, type LatLng } from "@/lib/geo";
import { seedRails, type Rail, type RailNode } from "@/lib/rails";

export type WorldGraphPalette = Partial<typeof C>;
export type WorldGraphOptions = {
  style: "dots" | "particles";
  rails: Rail[];
  /** Scene colours. `bg` should match whatever the globe sits on: the canvas itself is transparent. */
  palette: WorldGraphPalette;
  /** The point on the globe that faces the camera at t = 0. */
  facing: LatLng;
  /** Camera distance from the globe's centre. The studio view opens at about 4.05. */
  distance: number;
  /** Degrees of orbit per second. The studio's auto-rotate is about 2.1. */
  spin: number;
  /** Draw the rails on one after another from t = 0, instead of showing them complete. */
  drawOn: boolean;
  labels: boolean;
  /** Multiplies the label size, which otherwise follows the canvas height. */
  labelScale: number;
  /** Device pixel ratio for the WebGL canvas. Fixed at mount. */
  dpr: number;
};

export const WORLD_GRAPH_DEFAULTS: WorldGraphOptions = {
  style: "dots",
  rails: seedRails(),
  palette: {},
  facing: { lat: 23, lng: -45 },
  distance: 4.05,
  spin: 2.1,
  drawOn: false,
  labels: true,
  labelScale: 1,
  dpr: 1,
};

function uniqueNodes(rails: Rail[]): RailNode[] {
  const m = new Map<string, RailNode>();
  rails.forEach((r) =>
    [r.a, r.b].forEach((n) => m.set(`${n.lat.toFixed(2)},${n.lng.toFixed(2)}`, n)),
  );
  return [...m.values()];
}

/** The camera orbits as a function of the clock alone, replacing the studio's interactive controls. */
function Orbit({ o }: { o: WorldGraphOptions }) {
  useFrame(({ clock, camera }) => {
    camera.position.set(
      ...toVec(o.facing.lat, o.facing.lng + o.spin * clock.elapsedTime, o.distance),
    );
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Bridge({ onReady }: { onReady: (get: () => RootState) => void }) {
  const get = useThree((s) => s.get);
  useEffect(() => onReady(get), [get, onReady]);
  return null;
}

function Scene({ o }: { o: WorldGraphOptions }) {
  const nodes = useMemo(() => uniqueNodes(o.rails), [o.rails]);
  return (
    <>
      <mesh name="water">
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshBasicMaterial color={o.style === "dots" ? C.water : C.bg} toneMapped={false} />
      </mesh>
      {o.style === "dots" ? <LandDots /> : <ParticleEarth />}
      {o.rails.map((r, i) => (
        <Arc
          key={r.id}
          rail={r}
          active={false}
          dim={false}
          phase={(i * 0.37) % 1}
          revealAt={o.drawOn ? 0.3 + i * 0.28 : undefined}
        />
      ))}
      {nodes.map((n) => (
        <mesh
          key={`${n.lat},${n.lng}`}
          name="node"
          position={toVec(n.lat, n.lng, GLOBE_RADIUS * 1.004)}
        >
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshBasicMaterial color={C.node} />
        </mesh>
      ))}
      <Orbit o={o} />
    </>
  );
}

/**
 * Globe.tsx keeps one palette for the whole page (the mutable `C`), which is right for the studio
 * but means two graphs with different colours would overwrite each other. Each embedded graph
 * therefore repaints its own materials from its own palette before every frame.
 */
function paint(scene: THREE.Scene, o: WorldGraphOptions) {
  const p = { ...PALETTES.dark, ...o.palette };
  scene.traverse((obj) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const any = obj as any;
    const color = any.material?.color as THREE.Color | undefined;
    if (!color) return;
    if (obj.name === "water") color.set(o.style === "dots" ? p.water : p.bg);
    else if (obj.name === "node") color.set(p.node);
    else if (any.isPoints) color.set(o.style === "dots" ? p.dot : p.speck);
    else if (any.isLine2) color.set(p.dim);
    else color.set(p.arc);
  });
}

export type WorldGraphHandle = {
  /** Change any option. Takes effect on the next renderAt. */
  update: (patch: Partial<WorldGraphOptions>) => void;
  /** Draw the frame at `seconds`. Synchronous once the scene has mounted. */
  renderAt: (seconds: number) => void;
  /** Globe and labels composited on one canvas at the WebGL canvas's pixel size. */
  snapshot: () => HTMLCanvasElement;
  /** Node label positions for the last frame, in CSS pixels of the host element. */
  labels: () => { text: string; place: string; x: number; y: number }[];
  dispose: () => void;
};

export function mountWorldGraph(
  el: HTMLElement,
  init: Partial<WorldGraphOptions> = {},
): WorldGraphHandle {
  let o: WorldGraphOptions = { ...WORLD_GRAPH_DEFAULTS, ...init };
  let get: (() => RootState) | null = null;
  const onReady = (g: () => RootState) => {
    get = g;
  };

  if (!el.style.position) el.style.position = "relative";
  const glHost = document.createElement("div");
  glHost.style.cssText = "position:absolute;inset:0;pointer-events:none";
  const labelCanvas = document.createElement("canvas");
  labelCanvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  el.append(glHost, labelCanvas);
  const snap = document.createElement("canvas");
  const root = createRoot(glHost);

  const render = () => {
    Object.assign(C, o.palette);
    root.render(
      <Canvas
        frameloop="never"
        resize={{ offsetSize: true, scroll: false }}
        camera={{ position: [-1.5, 1.6, 3.4], fov: 45, near: 0.01, far: 100 }}
        dpr={o.dpr}
        gl={{ preserveDrawingBuffer: true, alpha: true }}
      >
        <Bridge onReady={onReady} />
        <Scene o={o} />
      </Canvas>,
    );
  };
  render();

  const labels = () => {
    if (!get || !o.labels) return [];
    const { camera, size } = get();
    const camPos = camera.position.clone();
    const out: { text: string; place: string; x: number; y: number }[] = [];
    for (const n of uniqueNodes(o.rails)) {
      const p = new THREE.Vector3(...toVec(n.lat, n.lng, GLOBE_RADIUS * 1.004));
      if (p.dot(camPos.clone().sub(p)) <= 0) continue;
      p.project(camera);
      if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue;
      out.push({
        text: n.name,
        place: n.place,
        x: ((p.x + 1) / 2) * size.width,
        y: ((1 - p.y) / 2) * size.height,
      });
    }
    return out;
  };

  const drawLabels = () => {
    const w = el.offsetWidth,
      h = el.offsetHeight;
    if (
      labelCanvas.width !== Math.round(w * o.dpr) ||
      labelCanvas.height !== Math.round(h * o.dpr)
    ) {
      labelCanvas.width = Math.round(w * o.dpr);
      labelCanvas.height = Math.round(h * o.dpr);
    }
    const ctx = labelCanvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const s = (h / 800) * o.labelScale;
    ctx.font = `${10 * s}px "Roobert SemiMono", "DM Mono", monospace`;
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.12em";
    ctx.textBaseline = "middle";
    ctx.fillStyle = o.palette.node ?? PALETTES.dark.node;
    ctx.globalAlpha = 0.85;
    for (const l of labels()) ctx.fillText(l.text, l.x + 10 * s, l.y + 8 * s);
    ctx.globalAlpha = 1;
  };

  return {
    update(patch) {
      o = { ...o, ...patch };
      render();
    },
    renderAt(seconds) {
      if (!get) return;
      paint(get().scene, o);
      get().advance(seconds);
      drawLabels();
    },
    snapshot() {
      const gl = glHost.querySelector("canvas");
      snap.width = gl?.width ?? 1;
      snap.height = gl?.height ?? 1;
      const ctx = snap.getContext("2d");
      if (ctx && gl) {
        ctx.clearRect(0, 0, snap.width, snap.height);
        ctx.drawImage(gl, 0, 0);
        if (labelCanvas.width) ctx.drawImage(labelCanvas, 0, 0, snap.width, snap.height);
      }
      return snap;
    },
    labels,
    dispose() {
      // Deferred so a host that disposes during its own React commit doesn't unmount mid-render.
      setTimeout(() => root.unmount(), 0);
      glHost.remove();
      labelCanvas.remove();
    },
  };
}
