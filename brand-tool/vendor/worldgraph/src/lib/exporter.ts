// Browser-safe registry: the 3D scene registers its exporter here; the route calls exportView.
// No three.js import, so the route can import this statically.
export type ExportFormat = "png" | "svg";
type Impl = (fmt: ExportFormat) => Promise<Blob>;
let impl: Impl | null = null;
let override: Impl | null = null;

/** A scene with its own rendering (the city glyph art) takes precedence over the default exporter. */
export function registerOverrideExporter(fn: Impl | null) {
  override = fn;
}

export function registerExporter(fn: Impl | null) {
  impl = fn;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function exportView(fmt: ExportFormat, name: string) {
  const fn = override ?? impl;
  if (!fn) return;
  let blob: Blob;
  try {
    blob = await fn(fmt);
  } catch (e) {
    console.error("export failed", e);
    return;
  }
  downloadBlob(blob, `aurelius-${slug(name)}.${fmt}`);
}

/** The current view as a file, for a host that delivers files its own way (a save dialog, a preview). */
export async function renderView(fmt: ExportFormat): Promise<Blob> {
  const fn = override ?? impl;
  if (!fn) throw new Error("Nothing on screen to export yet.");
  return fn(fmt);
}
