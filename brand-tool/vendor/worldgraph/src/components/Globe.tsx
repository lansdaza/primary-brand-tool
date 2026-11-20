import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { geoContains, geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import landTopo from "world-atlas/land-110m.json";
import countriesTopo from "world-atlas/countries-110m.json";
import earthLum from "@/assets/earth-lum.jpg.asset.json";
import { GLOBE_RADIUS, toLatLng, toVec, type LatLng } from "@/lib/geo";
import type { Rail, RailNode } from "@/lib/rails";
import type { City } from "@/lib/cities";
import { CityScene } from "./CityScene";
import { ExportBridge } from "./ExportBridge";

// three.js needs literal colors; these mirror the --globe-* tokens in styles.css
export const PALETTES = {
  dark: { bg: "#262626", speck: "#d4d4d4", water: "#424242", dot: "#bdbdbd", arc: "#ffffff", dim: "#8a8a8a", node: "#ffffff" },
  light: { bg: "#faf7f3", speck: "#2e2e2e", water: "#ebe6df", dot: "#4a4a4a", arc: "#262626", dim: "#8f8a84", node: "#262626" },
};
export type Theme = keyof typeof PALETTES;
// Mutable palette read by every scene component; the Canvas remounts when the theme changes.
export const C = { ...PALETTES.dark };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const land = feature(landTopo as any, (landTopo as any).objects.land) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countries = (feature(countriesTopo as any, (countriesTopo as any).objects.countries) as any).features as any[];

export function placeName({ lat, lng }: LatLng): string {
  const c = countries.find((f) => geoContains(f, [lng, lat]));
  return c?.properties?.name ?? "Open ocean";
}

export function LandDots() {
  const geom = useMemo(() => {
    const W = 2048, H = 1024;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d")!;
    const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    ctx.beginPath();
    geoPath(proj, ctx)(land);
    ctx.fillStyle = "#000";
    ctx.fill();
    const mask = ctx.getImageData(0, 0, W, H).data;
    const N = 60000;
    const pts: number[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const t = golden * i;
      const x = Math.cos(t) * rad;
      const z = Math.sin(t) * rad;
      const { lat, lng } = toLatLng(x, y, z);
      const px = Math.min(W - 1, Math.floor(((lng + 180) / 360) * W));
      const py = Math.min(H - 1, Math.floor(((90 - lat) / 180) * H));
      if ((mask[(py * W + px) * 4 + 3] ?? 0) > 128) pts.push(...toVec(lat, lng, GLOBE_RADIUS * 1.002));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <points geometry={geom}>
      <pointsMaterial color={C.dot} size={0.0065} sizeAttenuation transparent opacity={0.75} />
    </points>
  );
}

export function ParticleEarth() {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const W = 1024, H = 512;
      const cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;
      ctx.clearRect(0, 0, W, H);
      const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
      ctx.beginPath();
      geoPath(proj, ctx)(land);
      ctx.fillStyle = "#000";
      ctx.fill();
      const lm = ctx.getImageData(0, 0, W, H).data;
      const pts: number[] = [];
      const TRIES = 500000;
      for (let i = 0; i < TRIES; i++) {
        const u = Math.random(), v = Math.random();
        const lng = u * 360 - 180;
        const lat = (Math.acos(2 * v - 1) * 180) / Math.PI - 90;
        const px = Math.min(W - 1, Math.floor(u * W));
        const py = Math.min(H - 1, Math.floor(((90 - lat) / 180) * H));
        const k = (py * W + px) * 4;
        const lum = (d[k] ?? 0) / 255;
        const isLand = (lm[k + 3] ?? 0) > 128;
        const prob = Math.max(isLand ? 0.32 + lum * 0.35 : 0, Math.pow(lum, 3) * 0.85);
        if (Math.random() < prob) pts.push(...toVec(lat, lng, GLOBE_RADIUS * (1.001 + Math.random() * 0.006)));
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      if (alive) setGeom(g);
    };
    img.src = earthLum.url;
    return () => { alive = false; };
  }, []);
  if (!geom) return null;
  return (
    <points geometry={geom}>
      <pointsMaterial color={C.speck} size={0.0055} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

export function arcCurve(a: LatLng, b: LatLng) {
  const va = new THREE.Vector3(...toVec(a.lat, a.lng));
  const vb = new THREE.Vector3(...toVec(b.lat, b.lng));
  const dist = va.distanceTo(vb);
  const h = 1 + dist * 0.45;
  const mid = va.clone().add(vb).normalize();
  const c1 = va.clone().lerp(mid, 0.5).normalize().multiplyScalar(h);
  const c2 = vb.clone().lerp(mid, 0.5).normalize().multiplyScalar(h);
  return new THREE.CubicBezierCurve3(va, c1, c2, vb);
}

/**
 * `phase` fixes where the pulse starts (random when omitted) and `revealAt` draws the line on from
 * that second of the clock. Both exist so an embedding host can render any frame repeatably.
 */
export function Arc({ rail, active, dim, phase, revealAt }: { rail: Rail; active: boolean; dim: boolean; phase?: number | undefined; revealAt?: number | undefined }) {
  const curve = useMemo(() => arcCurve(rail.a, rail.b), [rail.a, rail.b]);
  const points = useMemo(() => curve.getPoints(80), [curve]);
  const pulse = useRef<THREE.Mesh>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const line = useRef<any>(null);
  const offset = useMemo(() => phase ?? Math.random(), [phase]);
  useFrame(({ clock }) => {
    const shown = revealAt === undefined ? 1 : Math.min(1, Math.max(0, (clock.elapsedTime - revealAt) / 1.8));
    if (line.current?.geometry) line.current.geometry.instanceCount = Math.round((points.length - 1) * (1 - Math.pow(1 - shown, 3)));
    if (!pulse.current) return;
    pulse.current.visible = shown >= 1;
    const t = (clock.elapsedTime * 0.25 + offset) % 1;
    pulse.current.position.copy(curve.getPoint(t));
  });
  return (
    <group userData={{ arc: { points, color: active ? C.arc : C.dim, width: active ? 1.8 : 1, opacity: dim ? 0.25 : active ? 1 : 0.55 } }}>
      <Line ref={line} points={points} color={active ? C.arc : C.dim} lineWidth={active ? 1.8 : 1} transparent opacity={dim ? 0.25 : active ? 1 : 0.55} />
      <mesh ref={pulse}>
        <sphereGeometry args={[active ? 0.009 : 0.006, 8, 8]} />
        <meshBasicMaterial color={C.arc} transparent opacity={dim ? 0.3 : 1} />
      </mesh>
    </group>
  );
}

/**
 * A node's name, drawn as one plain element over the canvas and moved each frame. (drei's Html gives every
 * label its own React root, and unmounting those while the scene itself unmounts throws under React 19.)
 */
function NodeLabel({ text, show }: { text: string; show: boolean }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const anchor = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const el = useMemo(() => {
    const span = document.createElement("span");
    span.className = "node-label";
    span.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;will-change:transform";
    return span;
  }, []);
  useEffect(() => {
    (gl.domElement.parentNode as HTMLElement | null)?.appendChild(el);
    return () => el.remove();
  }, [gl, el]);
  useEffect(() => {
    el.textContent = text;
    el.style.display = show ? "block" : "none";
  }, [el, text, show]);
  useFrame(() => {
    if (!show || !anchor.current) return;
    anchor.current.getWorldPosition(v).project(camera);
    el.style.visibility = v.z > 1 ? "hidden" : "visible";
    el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px,${((1 - v.y) / 2) * size.height}px,0)`;
  });
  return <group ref={anchor} />;
}

function NodeMarker({ lat, lng, name, label, onClick }: LatLng & { name: string; label: boolean; onClick?: (() => void) | undefined }) {
  const pos = useMemo(() => toVec(lat, lng, GLOBE_RADIUS * 1.004), [lat, lng]);
  return (
    <group position={pos} userData={{ node: { label: label ? name : null } }}>
      <mesh
        onClick={(e) => {
          if (!onClick || e.delta > 4) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => onClick && (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color={C.node} />
      </mesh>
      <NodeLabel text={name} show={label} />
    </group>
  );
}

/** Camera distance (from globe centre) the fly-in stops at. */
const FOCUS_DISTANCE = 1.8;
/** Scrolling closer than this while focused on a city opens the city view. */
const CITY_ENTER_DISTANCE = 1.42;

function PinRing({ lat, lng }: LatLng) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => new THREE.Vector3(...toVec(lat, lng, GLOBE_RADIUS * 1.003)), [lat, lng]);
  useEffect(() => {
    ref.current?.lookAt(pos.clone().multiplyScalar(2));
  }, [pos]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.elapsedTime * 0.8) % 1;
    ref.current.scale.setScalar(0.6 + t * 1.6);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 1 - t;
  });
  return (
    <mesh ref={ref} position={pos}>
      <ringGeometry args={[0.018, 0.022, 48]} />
      <meshBasicMaterial color={C.arc} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/** Camera distance of the opening view, which `home` flies back out to. */
const HOME_DISTANCE = 4.05;

function CameraRig({ focus, canEnter, onEnterCity, home = 0 }: { focus: LatLng | null; canEnter: boolean; onEnterCity: () => void; home?: number | undefined }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as THREE.EventDispatcher<{ start: object }> | null;
  const flying = useRef(false);
  const goal = useRef(new THREE.Vector3());
  const entered = useRef(false);
  useEffect(() => {
    camera.near = 0.01;
    camera.far = 100;
    if (focus) camera.position.set(...toVec(focus.lat, focus.lng, 1.6));
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    entered.current = false;
    if (!focus) return;
    goal.current.set(...toVec(focus.lat, focus.lng, FOCUS_DISTANCE));
    flying.current = true;
  }, [focus, camera]);
  // A host raises `home` to pull back out to the whole globe, keeping the direction it faces.
  useEffect(() => {
    if (!home || focus) return;
    goal.current.copy(camera.position).normalize().multiplyScalar(HOME_DISTANCE);
    flying.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home]);
  useEffect(() => {
    if (!controls) return;
    const stop = () => (flying.current = false);
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controls]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (import.meta.env.DEV) (window as unknown as { __cam: object }).__cam = { d: camera.position.length(), flying: flying.current, canEnter };
    if (flying.current) {
      // slerp-ish: lerp direction and length separately so the path hugs the globe
      const len = THREE.MathUtils.lerp(camera.position.length(), goal.current.length(), 1 - Math.exp(-2.5 * dt));
      const dir = camera.position.clone().normalize().lerp(goal.current.clone().normalize(), 1 - Math.exp(-3 * dt)).normalize();
      camera.position.copy(dir.multiplyScalar(len));
      camera.lookAt(0, 0, 0);
      if (camera.position.distanceTo(goal.current) < 0.02) flying.current = false;
    } else if (canEnter && !entered.current && camera.position.length() < CITY_ENTER_DISTANCE) {
      entered.current = true;
      onEnterCity();
    }
  });
  return null;
}

type Props = {
  rails: Rail[];
  selectedId: string | null;
  pending: LatLng | null;
  picking: boolean;
  onPick: (p: LatLng, place: string) => void;
  globeStyle: "dots" | "particles";
  focus: LatLng | null;
  focusCity: City | null;
  cityView: boolean;
  onNodeClick: (n: RailNode) => void;
  onEnterCity: () => void;
  onExitCity: () => void;
  onCityReady: () => void;
  theme: Theme;
  background: string;
  /** Colours over the theme's, e.g. from a brand tone. */
  palette?: Partial<typeof C> | undefined;
  /** Raise to fly back out to the whole globe. */
  home?: number | undefined;
};

function Scene({ rails, selectedId, pending, picking, onPick, globeStyle, focus, focusCity, onNodeClick, onEnterCity, home }: Props) {
  const [interacting, setInteracting] = useState(false);
  const nodes = useMemo(() => {
    const m = new Map<string, Rail["a"]>();
    rails.forEach((r) => [r.a, r.b].forEach((n) => m.set(`${n.lat.toFixed(2)},${n.lng.toFixed(2)}`, n)));
    return [...m.values()];
  }, [rails]);
  const selected = rails.find((r) => r.id === selectedId);
  const labelled = new Set(selected ? [selected.a.name, selected.b.name] : []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!picking || e.delta > 4) return;
    e.stopPropagation();
    const ll = toLatLng(e.point.x, e.point.y, e.point.z);
    onPick(ll, placeName(ll));
  };

  return (
    <>
      <mesh name="water" onClick={handleClick}>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshBasicMaterial color={globeStyle === "dots" ? C.water : C.bg} toneMapped={false} />
      </mesh>
      {globeStyle === "dots" ? <LandDots /> : <ParticleEarth />}
      {rails.map((r) => (
        <Arc key={r.id} rail={r} active={r.id === selectedId} dim={!!selectedId && r.id !== selectedId} />
      ))}
      {nodes.map((n) => (
        <NodeMarker
          key={`${n.lat},${n.lng}`}
          {...n}
          label={focus ? focus.lat === n.lat && focus.lng === n.lng : !selectedId || labelled.has(n.name)}
          onClick={picking ? undefined : () => onNodeClick(n)}
        />
      ))}
      {pending && <NodeMarker {...pending} name="SELECT DESTINATION" label />}
      {focus && <PinRing {...focus} />}
      <CameraRig focus={focus} canEnter={!!focusCity} onEnterCity={onEnterCity} home={home} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={focus ? 1.25 : 1.6}
        maxDistance={5}
        rotateSpeed={focus ? 0.15 : 0.5}
        zoomSpeed={1}
        autoRotate={!interacting && !picking && !focus}
        autoRotateSpeed={0.35}
        onStart={() => setInteracting(true)}
        onEnd={() => setTimeout(() => setInteracting(false), 2500)}
      />
    </>
  );
}

export default function Globe(props: Props) {
  Object.assign(C, PALETTES[props.theme], props.palette ?? {});
  C.bg = props.background;
  return (
    <div className={`h-full w-full ${props.picking ? "cursor-crosshair" : "cursor-grab"}`} data-scene-ready>
      <Canvas key={`${props.theme}:${props.palette ? JSON.stringify(props.palette) : ""}`} camera={{ position: [-1.5, 1.6, 3.4], fov: 45 }} dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
        <color attach="background" args={[C.bg]} />
        <ExportBridge />
        {props.cityView && props.focusCity ? (
          <CityScene city={props.focusCity} onExit={props.onExitCity} onReady={props.onCityReady} />
        ) : (
          <Scene {...props} />
        )}
      </Canvas>
    </div>
  );
}
