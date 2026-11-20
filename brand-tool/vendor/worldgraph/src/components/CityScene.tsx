import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { viewPosition, type City } from "@/lib/cities";
import { LANDMARKS, type Part } from "@/lib/landmarks";
import { C } from "./Globe";

/** Leaving the close-up when the camera is pulled back past this many times the postcard distance. */
export const CITY_EXIT_FACTOR = 2.2;
const AZIMUTH_SWING = 0.45;

// ---------- geometry (landmark coords: x east, y north, z up → three: x, z, -y) ----------
function prismGeom(p: Extract<Part, { k: "prism" }>) {
  const tx = p.tx ?? p.cx, ty = p.ty ?? p.cy;
  const c = (f: number, i: number) => {
    const sx = i === 0 || i === 3 ? -0.5 : 0.5, sy = i < 2 ? -0.5 : 0.5;
    const w = p.w + (p.tw - p.w) * f, d = p.d + (p.td - p.d) * f;
    const x = p.cx + (tx - p.cx) * f + sx * w, y = p.cy + (ty - p.cy) * f + sy * d;
    return [x, p.z0 + f * (p.z1 - p.z0), -y];
  };
  const pos: number[] = [], uv: number[] = [];
  const quad = (a: number[], b: number[], cc: number[], d: number[], u0: number, u1: number) => {
    pos.push(...a, ...b, ...cc, ...a, ...cc, ...d);
    uv.push(u0, 0, u1, 0, u1, 1, u0, 0, u1, 1, u0, 1);
  };
  for (let i = 0; i < 4; i++) quad(c(0, i), c(0, (i + 1) % 4), c(1, (i + 1) % 4), c(1, i), 0, 1);
  if (!p.lattice) quad(c(1, 0), c(1, 1), c(1, 2), c(1, 3), 0, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
export function partGeom(p: Part) {
  if (p.k === "prism") return prismGeom(p);
  if (p.k === "cone") {
    const g = new THREE.CylinderGeometry(p.r1, p.r0, p.z1 - p.z0, 32);
    return g.translate(p.cx, (p.z0 + p.z1) / 2, -p.cy);
  }
  const g = new THREE.SphereGeometry(p.r, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  return g.scale(1, p.h / p.r, 1).translate(p.cx, p.z0, -p.cy);
}

const BUDGET = 380_000;

/** Specks over every building surface, thinned by light, window grid and floor bands, plus a fading reflection and ground.
 *  Returns positions plus a per-speck brightness (vertex color) so window rows read brighter than the wall stripes. */
export function buildSpecks(geoms: THREE.BufferGeometry[], light: THREE.Vector3, offset: THREE.Vector3, lattice: boolean[], groundR: number, camDir: THREE.Vector3) {
  const meshes = geoms.map((g) => new THREE.Mesh(g));
  const areas = geoms.map((g) => { const p = g.toNonIndexed().getAttribute("position"); let a = 0; const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(); for (let i = 0; i < p.count; i += 3) { A.fromBufferAttribute(p, i); B.fromBufferAttribute(p, i + 1); Cc.fromBufferAttribute(p, i + 2); a += B.sub(A).cross(Cc.sub(A)).length() / 2; } return a; });
  const total = areas.reduce((x, y) => x + y, 0) || 1;
  const out: number[] = [], col: number[] = [];
  const pt = new THREE.Vector3(), n = new THREE.Vector3(), t = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  meshes.forEach((m, i) => {
    const s = new MeshSurfaceSampler(m.geometry.index ? new THREE.Mesh(m.geometry.toNonIndexed()) : m).build();
    const count = Math.round((areas[i]! / total) * BUDGET * 1.6);
    const uv = new THREE.Vector2();
    for (let k = 0; k < count; k++) {
      s.sample(pt, n, undefined, uv);
      if (lattice[i]) { const u = uv.x, v = (uv.y * 9) % 1; if (!(u < 0.05 || u > 0.95 || v < 0.05 || Math.abs(v - u) < 0.035 || Math.abs(v - (1 - u)) < 0.035)) continue; }
      if (n.dot(camDir) < -0.1) continue; // hide surfaces facing away from the camera
      const face = 0.35 + 0.65 * Math.max(n.dot(light), 0);
      let keep = face, sh = 0.5 + 0.5 * face;
      if (Math.abs(n.y) < 0.5) {
        t.crossVectors(up, n).normalize();
        const w = ((pt.x + offset.x) * t.x + (pt.z + offset.z) * t.z) / 6;
        const fu = w - Math.floor(w), fv = (pt.y / 6) % 1;
        const pier = (((w / 2) % 1) + 1) % 1 < 0.16; // vertical piers every few bays (wraps negative coords)
        const sill = fv < 0.12; // bright sill line under each window row
        const wall = fv >= 0.12 && fv < 0.5; // dark stripe between window rows
        const glass = fu > 0.3 && fv >= 0.5;
        if (glass) {
          const bright = Math.random() < 0.25;
          keep = bright ? 1 : 0.45 + 0.45 * face; // window rows stay dense on every face
          sh = bright ? 1 : 0.75 + 0.25 * face;
        } else if (sill) { keep = 0.5 + 0.5 * face; sh = 1; }
        else if (pier) { keep = 0.5 + 0.5 * face; sh = 0.9; }
        else if (wall) { keep = 0.1 * face; sh = 0.3; }
        else { keep = 0.5 * face; sh = 0.5; }
        if ((pt.y / 22) % 1 > 0.94) { keep = 0.85; sh = 1; } // cornice band every ~6 floors
        if (pt.y < 7 && glass) { keep = 1; sh = 1; } // lit shopfronts at street level
        if (uv.x < 0.02 || uv.x > 0.98) { keep = 1; sh = 1; } // crisp building corners
      }
      if (Math.random() > keep) continue;
      const shade = sh; // window rows bright, wall stripes dim
      const x = pt.x + offset.x, z = pt.z + offset.z;
      out.push(x, pt.y, z);
      col.push(shade, shade, shade);
      if (Math.random() < 0.28 * Math.exp(-pt.y / 80)) {
        out.push(x + (Math.random() - 0.5) * 2, -pt.y * 0.9, z);
        col.push(shade * 0.5, shade * 0.5, shade * 0.5);
      }
    }
  });
  for (let k = 0; k < BUDGET * 0.12; k++) {
    const r = groundR * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.random() < 1 - r / groundR) { out.push(x + offset.x, 0, z + offset.z); col.push(0.5, 0.5, 0.5); }
  }
  return { pos: new Float32Array(out), col: new Float32Array(col) };
}

/** Adds ledges at each tier top, a plinth, and rooftop plant boxes so blocks read as buildings. */
export function withDetail(parts: Part[]): Part[] {
  const out: Part[] = [...parts];
  for (const p of parts) {
    if (p.k !== "prism" || p.lattice || p.tx !== undefined) continue;
    const h = p.z1 - p.z0;
    if (h < 6) continue;
    const ledge = (z: number, s: number): Part => ({ k: "prism", cx: p.cx, cy: p.cy, w: p.tw * s + 1.2, d: p.td * s + 1.2, tw: p.tw * s + 1.2, td: p.td * s + 1.2, z0: z, z1: z + 1.2 });
    out.push(ledge(p.z1 - 1.2, 1));
    if (p.z0 === 0) out.push({ k: "prism", cx: p.cx, cy: p.cy, w: p.w + 1.5, d: p.d + 1.5, tw: p.w + 1.5, td: p.d + 1.5, z0: 0, z1: Math.min(6, h * 0.1) });
    if (h > 60) for (let z = p.z0 + 45; z < p.z1 - 10; z += 45) out.push(ledge(z, 1));
    if (p.tw > 18 && p.td > 18) {
      out.push({ k: "prism", cx: p.cx - p.tw * 0.2, cy: p.cy + p.td * 0.15, w: p.tw * 0.3, d: p.td * 0.25, tw: p.tw * 0.3, td: p.td * 0.25, z0: p.z1, z1: p.z1 + 5 });
      out.push({ k: "cone", cx: p.cx + p.tw * 0.25, cy: p.cy - p.td * 0.2, r0: 0.4, r1: 0.15, z0: p.z1, z1: p.z1 + 12 });
    }
  }
  return out;
}

export function CityScene({ city, onExit, onReady }: { city: City; onExit: () => void; onReady: () => void }) {
  const camera = useThree((st) => st.camera) as THREE.PerspectiveCamera;
  const v = city.view;
  const lm = LANDMARKS[city.id];
  const az = Math.atan2(Math.sin((v.from * Math.PI) / 180), -Math.cos((v.from * Math.PI) / 180));
  const exitDist = v.dist * CITY_EXIT_FACTOR;

  const geom = useMemo(() => {
    const light = new THREE.Vector3(...viewPosition(v)).sub(new THREE.Vector3(v.target[0], v.target[1], -v.target[2])).setY(0).normalize()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.7).setY(0.55).normalize();
    // direction the postcard camera looks from; back-facing walls are culled so their
    // (vertically shifted) window rows don't fill in the front facade's dark stripes
    const camDir = new THREE.Vector3(...viewPosition(v)).sub(new THREE.Vector3(v.target[0], v.target[1], -v.target[2])).normalize();
    const parts = withDetail(lm?.parts ?? []);
    const { pos, col } = buildSpecks(parts.map(partGeom), light, new THREE.Vector3(lm?.x ?? 0, 0, -(lm?.y ?? 0)),
      parts.map((p) => p.k === "prism" && !!p.lattice), v.dist * 1.2, camDir);
    // ground ring is centred on the origin; move it under the landmark
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [lm, v]);

  useEffect(() => {
    camera.near = 1;
    camera.far = 20000;
    camera.position.set(...viewPosition(v));
    camera.updateProjectionMatrix();
    onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id]);

  return (
    <>
      <fog attach="fog" args={[C.bg, v.dist * 0.9, v.dist * 2.6]} />
      <points geometry={geom}>
        <pointsMaterial color={C.speck} size={0.7} sizeAttenuation transparent opacity={0.75} vertexColors depthWrite={false} />
      </points>
      <OrbitControls
        target={[v.target[0], v.target[1], -v.target[2]]}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.15}
        minDistance={v.dist * 0.5}
        maxDistance={exitDist + 100}
        minAzimuthAngle={az - AZIMUTH_SWING}
        maxAzimuthAngle={az + AZIMUTH_SWING}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2 + 0.04}
        rotateSpeed={0.4}
        onChange={(e) => {
          const c = e?.target as unknown as { getDistance?: () => number } | undefined;
          if (c?.getDistance && c.getDistance() > exitDist) onExit();
        }}
      />
    </>
  );
}
