import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { registerExporter } from "@/lib/exporter";
import { C } from "./Globe";

const SVG_CAP = 60000;
const f = (n: number) => n.toFixed(1);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function wordmark(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  ctx.fillStyle = C.dim;
  ctx.font = `${12 * scale}px 'DM Mono', monospace`;
  ctx.fillText("A U R E L I U S", 24 * scale, h - 24 * scale);
  void w;
}

export function ExportBridge() {
  const { gl, scene, camera, size } = useThree();
  useEffect(() => {
    registerExporter(async (fmt) => {
      const cam = camera as THREE.PerspectiveCamera;
      if (fmt === "png") {
        const prev = gl.getPixelRatio();
        gl.setPixelRatio(2);
        gl.setSize(size.width, size.height, false);
        gl.render(scene, cam);
        const src = gl.domElement;
        const out = document.createElement("canvas");
        out.width = src.width;
        out.height = src.height;
        const ctx = out.getContext("2d")!;
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(src, 0, 0);
        wordmark(ctx, out.width, out.height, 2);
        gl.setPixelRatio(prev);
        gl.setSize(size.width, size.height, false);
        return new Promise<Blob>((r) => out.toBlob((b) => r(b!), "image/png"));
      }
      // SVG
      const W = size.width, H = size.height;
      scene.updateMatrixWorld();
      const camPos = cam.position.clone();
      const v = new THREE.Vector3();
      const scale = H / 2 / Math.tan((cam.fov * Math.PI) / 360);
      const project = (p: THREE.Vector3) => {
        const depth = p.distanceTo(camPos);
        p.project(cam);
        if (p.z > 1 || p.x < -1.02 || p.x > 1.02 || p.y < -1.02 || p.y > 1.02) return null;
        return { x: ((p.x + 1) / 2) * W, y: ((1 - p.y) / 2) * H, depth };
      };
      const globeVisible = (p: THREE.Vector3) => {
        const len = p.length();
        if (len > 1.2) return true;
        return p.dot(camPos.clone().sub(p)) > 0;
      };
      const parts: string[] = [];
      const isCity = cam.near >= 1;
      const water = scene.getObjectByName("water") as THREE.Mesh | undefined;
      if (!isCity && water) {
        const c = project(new THREE.Vector3());
        const d = camPos.length();
        if (c) parts.push(`<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(scale * Math.tan(Math.asin(1 / d)))}" fill="#${(water.material as THREE.MeshBasicMaterial).color.getHexString()}"/>`);
      }
      const pointSets: { obj: THREE.Points; idx: number[] }[] = [];
      let total = 0;
      scene.traverseVisible((o) => {
        if (!(o instanceof THREE.Points)) return;
        const pos = o.geometry.getAttribute("position");
        const idx: number[] = [];
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
          if (!isCity && !globeVisible(v)) continue;
          const q = v.clone().project(cam);
          if (q.z > 1 || Math.abs(q.x) > 1 || Math.abs(q.y) > 1) continue;
          idx.push(i);
        }
        total += idx.length;
        pointSets.push({ obj: o, idx });
      });
      const stride = Math.max(1, total / SVG_CAP);
      for (const { obj, idx } of pointSets) {
        const m = obj.material as THREE.PointsMaterial;
        const pos = obj.geometry.getAttribute("position");
        const g: string[] = [];
        for (let k = 0; k < idx.length; k += stride) {
          v.fromBufferAttribute(pos, idx[Math.floor(k)]!).applyMatrix4(obj.matrixWorld);
          const p = project(v.clone());
          if (!p) continue;
          const r = Math.max(0.3, (m.size * scale) / p.depth / 2) * (stride > 1 ? Math.min(1.6, Math.sqrt(stride)) : 1);
          g.push(`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${r.toFixed(2)}"/>`);
        }
        parts.push(`<g fill="#${m.color.getHexString()}" fill-opacity="${m.opacity}">${g.join("")}</g>`);
      }
      // arcs and labels tagged via userData
      scene.traverseVisible((o) => {
        const arc = o.userData["arc"] as { points: THREE.Vector3[]; color: string; opacity: number; width: number } | undefined;
        if (arc) {
          let d = "";
          let pen = false;
          for (const pt of arc.points) {
            const w = pt.clone();
            const vis = isCity || globeVisible(w);
            const p = vis ? project(w) : null;
            if (!p) { pen = false; continue; }
            d += `${pen ? "L" : "M"}${f(p.x)} ${f(p.y)}`;
            pen = true;
          }
          if (d) parts.push(`<path d="${d}" fill="none" stroke="${arc.color}" stroke-opacity="${arc.opacity}" stroke-width="${arc.width}"/>`);
        }
        const node = o.userData["node"] as { label: string | null } | undefined;
        if (node) {
          const w = o.getWorldPosition(new THREE.Vector3());
          if (!globeVisible(w.clone())) return;
          const p = project(w);
          if (!p) return;
          parts.push(`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="3" fill="${C.node}"/>`);
          if (node.label) parts.push(`<text x="${f(p.x + 8)}" y="${f(p.y - 8)}" font-family="monospace" font-size="10" letter-spacing="1.5" fill="${C.dim}">${esc(node.label)}</text>`);
        }
      });
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${C.bg}"/>${parts.join("")}<text x="24" y="${H - 24}" font-family="monospace" font-size="12" fill="${C.dim}">A U R E L I U S</text></svg>`;
      return new Blob([svg], { type: "image/svg+xml" });
    });
    return () => registerExporter(null);
  }, [gl, scene, camera, size]);
  return null;
}
