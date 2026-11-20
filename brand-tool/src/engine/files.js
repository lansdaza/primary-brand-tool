// @ts-nocheck
// Files a guideline section can hand over: text (SVG, JSON), an embedded image, or a logo mask tinted to a brand colour.
// Several files are packed into one zip, stored without compression.
const MIME = { svg: 'image/svg+xml', json: 'application/json', txt: 'text/plain', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', zip: 'application/zip' };
const extOf = (name) => name.slice(name.lastIndexOf('.') + 1).toLowerCase();
const decode = (uri) => { const raw = atob(uri.slice(uri.indexOf(',') + 1)), out = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i); return out; };
const load = (uri) => new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error('image')); img.src = uri; });
async function png(uri, color) {
  const img = await load(uri), c = document.createElement('canvas'), x = c.getContext('2d');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  if (color) { x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'destination-in'; }
  x.drawImage(img, 0, 0);
  const blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('empty'))), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}
/* A file is { name, text } | { name, uri } | { name, brand, css, color? }. A colour tints a mask; WebP captures are handed over as PNG. */
// Some brand images exist only as CSS variables on the brand's surfaces (logo masks, textures); read one back as a data URI.
function cssImage(brand, name) {
  const el = document.createElement('div');
  el.className = 'a'; el.dataset.brand = brand; el.hidden = true;
  document.body.append(el);
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  el.remove();
  const found = value.match(/url\((["']?)(.*)\1\)/);
  if (!found) throw new Error(`No image in ${name}`);
  return found[2];
}
export async function fileBytes(f) {
  if (f.text !== undefined) return new TextEncoder().encode(f.text);
  const uri = f.css ? cssImage(f.brand, f.css) : f.uri;
  if (f.color || uri.startsWith('data:image/webp')) return png(uri, f.color);
  return decode(uri);
}
export async function fileBlob(f) { return new Blob([await fileBytes(f)], { type: MIME[extOf(f.name)] || 'application/octet-stream' }); }

const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABLE[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
// Entries are deflated where the browser can (CompressionStream), except formats that are compressed already.
const STORED = /\.(png|jpe?g|webp|gif|woff2?|mp4|webm|zip|pdf)$/i;
async function deflate(data) {
  if (typeof CompressionStream !== 'function' || data.length < 512) return null;
  try { return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); } catch { return null; }
}
export async function zipFiles(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let offset = 0;
  const now = new Date(), time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1), date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const f of files) {
    const data = await fileBytes(f), name = enc.encode(f.name), crc = crc32(data);
    const z = STORED.test(f.name) ? null : await deflate(data), body = z && z.length < data.length ? z : data, method = body === data ? 0 : 8;
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true); head.setUint16(4, 20, true); head.setUint16(6, 0x0800, true); head.setUint16(8, method, true); head.setUint16(10, time, true); head.setUint16(12, date, true);
    head.setUint32(14, crc, true); head.setUint32(18, body.length, true); head.setUint32(22, data.length, true); head.setUint16(26, name.length, true); head.setUint16(28, 0, true);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true); cd.setUint16(10, method, true); cd.setUint16(12, time, true); cd.setUint16(14, date, true);
    cd.setUint32(16, crc, true); cd.setUint32(20, body.length, true); cd.setUint32(24, data.length, true); cd.setUint16(28, name.length, true); cd.setUint32(42, offset, true);
    parts.push(new Uint8Array(head.buffer), name, body);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + body.length;
  }
  const size = central.reduce((n, b) => n + b.length, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: MIME.zip });
}
