// The page behind /embed: the World Graph alone, filling the frame, driven from outside.
//
// Query string (all optional):
//   style=dots|particles  labels=0|1  lat, lng  distance  spin  drawOn=0|1
//   bg, ink  hex colours without the #; ink is used for land, rails and nodes
//   t        render this one frame (seconds) and hold; omit to play
//
// Messages from the parent window:
//   { type: "worldgraph:update", options }   any WorldGraphOptions
//   { type: "worldgraph:frame", t }          hold on the frame at t seconds
//   { type: "worldgraph:play" }              resume playing
// The frame posts { type: "worldgraph:ready" } to its parent once mounted.
import { useEffect, useRef } from "react";
import { mountWorldGraph, type WorldGraphOptions } from "./WorldGraph";

const hex = (v: string | null) => (v && /^[\da-f]{6}$/i.test(v) ? `#${v}` : null);
const num = (v: string | null) =>
  v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null;

function fromQuery(q: URLSearchParams): Partial<WorldGraphOptions> {
  const o: Partial<WorldGraphOptions> = {};
  const style = q.get("style");
  if (style === "dots" || style === "particles") o.style = style;
  if (q.has("labels")) o.labels = q.get("labels") !== "0";
  if (q.has("drawOn")) o.drawOn = q.get("drawOn") !== "0";
  const lat = num(q.get("lat")),
    lng = num(q.get("lng"));
  if (lat !== null && lng !== null) o.facing = { lat, lng };
  const distance = num(q.get("distance")),
    spin = num(q.get("spin"));
  if (distance !== null) o.distance = distance;
  if (spin !== null) o.spin = spin;
  const bg = hex(q.get("bg")),
    ink = hex(q.get("ink"));
  if (bg || ink)
    o.palette = {
      ...(bg ? { bg, water: bg } : {}),
      ...(ink ? { dot: ink, speck: ink, arc: ink, dim: ink, node: ink } : {}),
    };
  return o;
}

export default function EmbedView() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const q = new URLSearchParams(window.location.search);
    // The frame shows only the globe, so whatever the host puts behind the iframe shows through.
    const prevBg = [document.documentElement.style.background, document.body.style.background];
    document.documentElement.style.background = document.body.style.background = "transparent";
    const graph = mountWorldGraph(el, {
      dpr: Math.min(2, window.devicePixelRatio || 1),
      ...fromQuery(q),
    });
    let held = num(q.get("t"));
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      graph.renderAt(held ?? (performance.now() - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onMessage = (e: MessageEvent) => {
      const d = e.data as {
        type?: string;
        options?: Partial<WorldGraphOptions>;
        t?: number;
      } | null;
      if (!d || typeof d.type !== "string") return;
      if (d.type === "worldgraph:update" && d.options) graph.update(d.options);
      else if (d.type === "worldgraph:frame" && typeof d.t === "number") held = d.t;
      else if (d.type === "worldgraph:play") held = null;
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "worldgraph:ready" }, "*");
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("message", onMessage);
      graph.dispose();
      document.documentElement.style.background = prevBg[0] ?? "";
      document.body.style.background = prevBg[1] ?? "";
    };
  }, []);
  return <div ref={host} style={{ position: "fixed", inset: 0, background: "transparent" }} />;
}
