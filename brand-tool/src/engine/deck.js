// @ts-nocheck
// Deck helpers shared by every brand: a slide as HTML, a slide as a JPEG, and a PDF made of those JPEGs.
import { raster, tplHTML, sanitize, resolveLive } from './brand.js';

export const slideHTML = (t, p) => tplHTML(t, p);

/* A deck is a list of [layout id, params]; unknown layouts are dropped and every param is checked against the layout's dials. */
export function buildSlides(B, list, limit = 24) {
  return (Array.isArray(list) ? list : []).map((s) => (Array.isArray(s) ? { layout: s[0], params: s[1] } : s)).filter((s) => B.SLBY[s?.layout]).slice(0, limit)
    .map((s) => ({ id: uid(), layout: s.layout, params: sanitize(B.SLBY[s.layout], s.params) }));
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export async function slideJpeg(t, p) {
  const [w, h] = t.size, holder = document.createElement('div');
  holder.innerHTML = tplHTML(t, p);
  await resolveLive(holder);
  const img = await raster(holder.firstElementChild, w, h), c = document.createElement('canvas');
  c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0);
  const blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('empty'))), 'image/jpeg', 0.92));
  return { w, h, data: new Uint8Array(await blob.arrayBuffer()) };
}

/* A minimal PDF: one page per slide, each page one JPEG at 13.33 by 7.5 inches. */
export function pdfOf(pages, title = 'Deck') {
  const enc = new TextEncoder(), parts = [], offsets = [];
  let length = 0;
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); length += b.length; };
  const obj = (n, head, stream) => { offsets[n] = length; push(`${n} 0 obj\n${head}\n`); if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); } push('endobj\n'); };
  const safe = String(title).replace(/[^\x20-\x7E]/g, '').replace(/[\\()]/g, '');
  push('%PDF-1.4\n'); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
  const W = 960, H = 540, n = pages.length, kids = pages.map((_, i) => `${4 + i * 3} 0 R`).join(' ');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Count ${n} /Kids [${kids}] >>`);
  obj(3, `<< /Title (${safe}) /Producer (Primary brand tool) >>`);
  pages.forEach((pg, i) => {
    const a = 4 + i * 3, content = enc.encode(`q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`);
    obj(a, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${a + 2} 0 R >> >> /Contents ${a + 1} 0 R >>`);
    obj(a + 1, `<< /Length ${content.length} >>`, content);
    obj(a + 2, `<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.data.length} >>`, pg.data);
  });
  const total = 3 + n * 3, xref = length;
  push(`xref\n0 ${total + 1}\n0000000000 65535 f \n` + Array.from({ length: total }, (_, i) => `${String(offsets[i + 1]).padStart(10, '0')} 00000 n \n`).join(''));
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: 'application/pdf' });
}
