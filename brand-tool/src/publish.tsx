// @ts-nocheck
// Publish to client: what a brand's client sees (the brand book, approved files and downloads), saved as numbered
// client versions. Rule tags, sources, page references, review items and notes stay in this tool. A version is
// shared on this page (the db capability) or kept in this browser, and downloads as the .json the client portal reads.
// Ported from the version built in another chat (published Nov 18), which was written straight into the page.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { Download, Upload } from 'lucide-react';
import * as E from './engine/index.js';
import { Btn, ICON, RailHead, RailItem } from './ui';
import { guideFiles } from './kitbuild';

const words = (k) => String(k).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
const weightOf = (t) => ({ thin: 100, light: 300, regular: 400, book: 400, medium: 500, semibold: 600, bold: 700, black: 900 })[String(t ?? '').toLowerCase().replace(/[\s-]/g, '')];
const readData = (b) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r.readAsDataURL(b); });

var pbPubKey = "primary-client-publish", pbPubDrop = new Set(["b", "p", "src", "source", "sources", "basis", "fileKey", "extracted", "pages", "prompt", "prompts", "madeWith", "method", "note", "standIn", "rails", "generated", "status", "resolves", "cssVar", "ratioVar", "css", "weights"]), pbPubHex = /^#[0-9a-f]{3,8}$/i, pbPubStrip = (t) => String(t).replace(/\s*\((?:p\.\s*)?\d[\d.,–\-\s]*\)/g, "").trim(), pbPubClean = (t) => {
  if (typeof t == "function") return;
  if (Array.isArray(t)) return t.map(pbPubClean).filter((e) => e !== void 0 && e !== "" && !(Array.isArray(e) && !e.length));
  if (t && typeof t == "object") {
    if (typeof t.t == "string" && ("b" in t || "p" in t)) return pbPubStrip(t.t);
    let e = {};
    for (let [n, o] of Object.entries(t)) {
      if (pbPubDrop.has(n)) continue;
      let r = pbPubClean(o);
      r === void 0 || r === "" || Array.isArray(r) && !r.length || r && typeof r == "object" && !Array.isArray(r) && !Object.keys(r).length || (e[n] = r);
    }
    return e;
  }
  return typeof t == "string" ? pbPubStrip(t) : t;
}, pbPubRef = (t) => ({ name: t.name, type: t.type, ...t.weight ? { weight: +t.weight } : {}, ...t.style ? { style: t.style } : {}, ...t.id ? { asset: t.id } : {} }), pbPubTypeOf = (t) => /\.svg$/i.test(t) ? "image/svg+xml" : /\.png$/i.test(t) ? "image/png" : /\.jpe?g$/i.test(t) ? "image/jpeg" : /\.pdf$/i.test(t) ? "application/pdf" : "application/octet-stream", pbPubGuide = (t) => {
  try {
    return guideFiles(t);
  } catch {
    return [];
  }
}, pbPubDay = (t) => new Date(t).toLocaleDateString(void 0, { month: "short", day: "numeric" }), pbPubWhen = (t) => new Date(t).toLocaleString(void 0, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
export function pbPubClient(t) {
  let e = t.PACKAGE || {}, n = { format: "primary.client-brand", formatVersion: 1, brand: { id: t.id, name: t.name, ...e.meta?.edition ? { edition: e.meta.edition } : {} } };
  typeof t.voice == "string" && t.voice && (n.voice = t.voice);
  for (let a of ["character", "logo", "color", "type", "imagery", "photography", "graphics", "icons", "agents", "charlie"]) {
    if (e[a] === void 0) continue;
    let s = pbPubClean(e[a]);
    s !== void 0 && (n[a === "color" ? "colour" : a] = s);
  }
  n.tones = Object.values(e.tones || {}).map((a) => ({ name: a.name, ground: a.ground, ink: a.ink }));
  let o = [];
  for (let a of t.slots || []) {
    let s = t.ASSETS?.[a.id]?.files || [];
    if (a.kind === "font") {
      let l = E.fontState(t, a.id), c = !!l && l !== "trial";
      o.push({ id: a.id, group: a.group || "Type", name: a.family || a.label, kind: "font", use: pbPubStrip(a.use || ""), included: c, ...l ? { licence: E.LICENCES[l] || l } : {}, ...c ? {} : { reason: l ? "Trial files: for design only, not for delivery" : "Not supplied yet" }, files: c ? s.map(pbPubRef) : [] });
      continue;
    }
    s.length && o.push({ id: a.id, group: a.group || "Files", name: a.label, kind: a.kind, use: pbPubStrip(a.use || ""), included: true, files: s.map(pbPubRef) });
  }
  let r = {};
  for (let a of pbPubGuide(t)) {
    let s = String(a.name || "").split("/")[0] || "files";
    (r[s] ?? (r[s] = [])).push({ name: a.name, type: a.type || pbPubTypeOf(a.name), from: "guideline" });
  }
  for (let [a, s] of Object.entries(r)) o.push({ id: `guideline-${a}`, group: words(a), name: a === "files" ? "Other files from the guideline" : `${words(a).replace(/s$/, "")} files from the guideline`, kind: "files", use: "Drawn from the brand guideline itself", included: true, files: s });
  n.downloads = o;
  n.formats = [...t.T || [], ...t.SL || []].map((a) => ({ id: a.id, name: a.name, kind: a.kind, use: pbPubStrip(a.use || "") }));
  return n;
}
async function pbPubEmbed(t, e) {
  let n = JSON.parse(JSON.stringify(e)), o = null, r = Object.values(t.ASSETS || {}).flatMap((i) => i.files || []);
  for (let i of n.downloads || []) for (let a of i.files || []) {
    let s;
    if (a.asset) {
      s = r.find((l) => l.id === a.asset)?.data;
      if (!s) try {
        let l = await fetch(`/_blob/${a.asset}`);
        l.ok && (s = await readData(await l.blob()));
      } catch {
      }
    } else if (a.from === "guideline") {
      o ??= pbPubGuide(t);
      let l = o.find((c) => c.name === a.name);
      s = l?.uri ?? l?.data ?? (typeof l?.text == "string" ? `data:${a.type};base64,${btoa(unescape(encodeURIComponent(l.text)))}` : void 0);
    }
    s ? a.data = s : a.missing = "Not in the tool any more";
  }
  return n;
}
function pbPubStore() {
  let [t, e] = useState([]), [n, o] = useState("loading"), r = useRef(null), i = useRef(""), a = useRef([]);
  a.current = t;
  useEffect(() => {
    let l = null, c = false, u = () => {
      o("local");
      try {
        let f2 = JSON.parse(localStorage.getItem(pbPubKey) || "[]");
        e(Array.isArray(f2) ? f2 : []);
      } catch {
      }
    }, f = setTimeout(() => {
      c || (r.current ? o((d) => d === "loading" ? "shared" : d) : u());
    }, 1e4);
    (async () => {
      let d = window.claude, m = null, h = null;
      try {
        m = await d?.use?.("db");
      } catch {
        m = null;
      }
      try {
        h = await d?.use?.("user");
      } catch {
        h = null;
      }
      if (c) return;
      try {
        i.current = await h?.id?.() ?? "";
      } catch {
        i.current = "";
      }
      if (!m) {
        clearTimeout(f), u();
        return;
      }
      r.current = m;
      let v = null;
      try {
        v = await h?.can?.("data.write");
      } catch {
        v = null;
      }
      if (c) return;
      let b = v === false ? "readonly" : "shared";
      l = m.collection("clientpublish").onSnapshot((y) => {
        clearTimeout(f), e(y.docs.map((x) => x.data()).filter((x) => x && typeof x.brand == "string" && typeof x.version == "number" && x.client && typeof x.client == "object")), o(b);
      }, () => {
        clearTimeout(f), o(b);
      });
    })();
    return () => {
      c = true, clearTimeout(f), l?.();
    };
  }, []);
  let s = useCallback(async (l, c) => {
    let u = Math.max(0, ...a.current.filter((d2) => d2.brand === l.id).map((d2) => d2.version)) + 1, f = null;
    if (n === "shared" && r.current) for (let d2 = 0; d2 < 8; d2++) {
      f = r.current.doc(`clientpublish/${l.id}-v${u}`);
      let m = null;
      try {
        m = await f.get();
      } catch {
        m = null;
      }
      if (!m?.exists) break;
      u++;
    }
    let d = { brand: l.id, version: u, at: Date.now(), ...i.current ? { by: i.current } : {}, client: c };
    if (JSON.stringify(d).length > 24e4) throw Error("too_big");
    if (n === "shared" && f) await f.set(d);
    else if (n === "local") {
      let m = [...a.current, d];
      e(m);
      try {
        localStorage.setItem(pbPubKey, JSON.stringify(m));
      } catch {
      }
    } else throw Error("readonly");
    return u;
  }, [n]);
  return { list: t, mode: n, add: s };
}
var pbPubCss = `.pb-pub-book{display:flex;flex-direction:column;gap:var(--space-l);margin-top:var(--space-l)}.pb-pub-sec{display:flex;flex-direction:column;gap:var(--space-xs)}.pb-pub-sec>h2{margin:0}.pb-pub-sec h3{margin:var(--space-xs) 0 0;color:var(--pb-sub);font:var(--weight-ui-medium) var(--size-xs)/var(--line-s) var(--font-ui)}.pb-pub-sec p{margin:0;color:var(--pb-body);max-width:40rem}.pb-pub-sec ul{margin:0;padding-left:var(--space-m);color:var(--pb-body)}.pb-pub-sec li+li{margin-top:var(--space-xxs)}.pb-pub-chips{display:flex;flex-wrap:wrap;gap:var(--space-xxs)}.pb-pub-chips span{padding:var(--space-xxs) var(--space-s);border-radius:var(--radius-full);box-shadow:inset 0 0 0 var(--border-s) var(--pb-line);font-size:var(--size-xs);line-height:var(--line-s)}.pb-pub-sw{display:inline-block;width:.85em;height:.85em;margin-right:.35em;vertical-align:-.08em;border-radius:var(--radius-full);box-shadow:inset 0 0 0 var(--border-s) var(--pb-line)}.pb-pub-tones{display:grid;grid-template-columns:repeat(auto-fill,minmax(8rem,1fr));gap:var(--space-xs)}.pb-pub-tone{display:flex;flex-direction:column;gap:var(--space-xxs);padding:var(--space-s);border-radius:var(--radius-s);box-shadow:inset 0 0 0 var(--border-s) var(--pb-line);font-size:var(--size-xs);line-height:var(--line-s)}.pb-pub-tone b{font-size:var(--size-l);font-weight:400;line-height:1}.pb-pub-rows{list-style:none;margin:0;padding:0!important}.pb-pub-rows li{display:flex;align-items:baseline;justify-content:space-between;gap:var(--space-s);margin:0!important;padding:var(--space-xs) 0;box-shadow:inset 0 calc(var(--border-s) * -1) 0 var(--pb-line)}.pb-pub-rows li>span:last-child{flex:none;color:var(--pb-sub);font-size:var(--size-xs)}.pb-pub-json summary{cursor:pointer;color:var(--pb-sub);font:var(--weight-ui-medium) var(--size-xs)/var(--line-s) var(--font-ui)}.pb-pub-json .pb-code{margin-top:var(--space-xs)}.pb-pub-none{margin:0;padding:0 var(--space-xs)}.pb-pb-wrap{display:flex;flex-direction:column;gap:var(--space-m);margin-top:var(--space-l)}.pb-pb-paper{display:flex;flex-direction:column;gap:var(--space-xl);padding:var(--space-m) var(--space-m) var(--space-xl);border-radius:var(--radius-m);background:var(--pb-panel);box-shadow:inset 0 0 0 var(--border-s) var(--pb-line)}.pb-pb-cover{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:var(--space-l);min-height:20rem;padding:clamp(1.25rem,4vw,2.25rem);border-radius:var(--radius-s)}.pb-pb-coverlogo{display:block;width:auto;max-width:11rem;height:2rem;object-fit:contain;object-position:left center}i.pb-pb-coverlogo{width:11rem}.pb-pb-cover .a-mono{font-size:.75rem;opacity:.75}.pb-pb-coverfoot{display:flex;flex-direction:column;gap:.75rem}.pb-pb-cover .a-h{font-size:clamp(2.75rem,7vw,4.5rem)}.pb-pb-covertags{display:flex;flex-wrap:wrap;gap:.4rem;font-size:.7rem}.pb-pb-edition{margin-top:.25rem}.pb-pb-sec{display:flex;flex-direction:column;gap:var(--space-m);padding:0 var(--space-xs)}.pb-pb-sechead{display:flex;align-items:baseline;gap:var(--space-s);padding-bottom:var(--space-s);box-shadow:inset 0 calc(var(--border-s) * -1) 0 var(--pb-line)}.pb-pb-sechead h2{margin:0;font:var(--weight-ui-medium) var(--size-l)/1.2 var(--font-ui);letter-spacing:-.01em;color:var(--neutral-10)}.pb-pb-num{font:var(--weight-ui-medium) var(--size-xs)/1 var(--font-ui);color:var(--pb-sub);font-variant-numeric:tabular-nums}.pb-pb-sub{display:flex;flex-direction:column;gap:var(--space-s)}.pb-pb-sub>h3,.pb-pb-cardhead{margin:0;font:var(--weight-ui-medium) var(--size-xs)/var(--line-s) var(--font-ui);color:var(--pb-sub)}.pb-pb-text,.pb-pb-lead{margin:0;max-width:38rem;color:var(--pb-body)}.pb-pb-soft{color:var(--pb-sub)}.pb-pb-note{margin:0;font-size:var(--size-xs)}.pb-pb-auto{display:flex;flex-direction:column;gap:var(--space-m)}.pb-pb-voice{margin:0;max-width:40rem}.pb-pb-voice .a-sub{display:block;font-size:1.2rem}.pb-pb-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}.pb-pb-list li{position:relative;padding:var(--space-xs) 0 var(--space-xs) 1.4rem;color:var(--pb-body);box-shadow:inset 0 calc(var(--border-s) * -1) 0 var(--pb-line)}.pb-pb-list li:last-child{box-shadow:none}.pb-pb-list li:before{content:"";position:absolute;left:.2rem;top:calc(var(--space-xs) + .55em);width:.4rem;height:.4rem;border-radius:var(--radius-full);background:var(--pb-dot)}.pb-pb-list.is-do li:before{content:"\u2713";width:auto;height:auto;top:var(--space-xs);left:.1rem;background:none;color:var(--neutral-10);font-size:.85em}.pb-pb-list.is-dont li:before{content:"\u2715";width:auto;height:auto;top:var(--space-xs);left:.1rem;background:none;color:var(--pb-sub);font-size:.8em}.pb-pb-cardhead.is-do{color:var(--neutral-10)}.pb-pb-chips{display:flex;flex-wrap:wrap;gap:var(--space-xxs)}.pb-pb-chips span{display:inline-flex;align-items:center;padding:var(--space-xxs) var(--space-s);border-radius:var(--radius-full);background:var(--pb-ground);box-shadow:inset 0 0 0 var(--border-s) var(--pb-line);font-size:var(--size-xs);line-height:var(--line-s);color:var(--pb-body)}.pb-pb-dot{display:inline-block;width:.8em;height:.8em;margin-right:.35em;vertical-align:-.06em;border-radius:var(--radius-full);box-shadow:inset 0 0 0 var(--border-s) rgba(0,0,0,.12)}.pb-pb-dodont{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:var(--space-s)}.pb-pb-card{display:flex;flex-direction:column;gap:var(--space-xs);padding:var(--space-m);border-radius:var(--radius-s);background:var(--pb-ground);min-width:0}.pb-pb-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));gap:var(--space-s)}.pb-pb-card .pb-pb-auto{gap:var(--space-s)}.pb-pb-card .pb-pb-sub>h3{font-size:var(--size-xs)}.pb-pb-spec{display:grid;grid-template-columns:minmax(7rem,max-content) 1fr;margin:0;column-gap:var(--space-m)}.pb-pb-spec dt,.pb-pb-spec dd{margin:0;padding:var(--space-xs) 0;box-shadow:inset 0 calc(var(--border-s) * -1) 0 var(--pb-line)}.pb-pb-spec dt{color:var(--pb-sub);font-size:var(--size-xs)}.pb-pb-spec dd{color:var(--pb-body)}.pb-pb-rows{display:flex;flex-direction:column;gap:var(--space-s)}.pb-pb-row{display:flex;flex-direction:column;gap:var(--space-xxs)}.pb-pb-marks{display:grid;grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:var(--space-s)}.pb-pb-pic{margin:0;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:var(--radius-s);background:var(--pb-ground);box-shadow:inset 0 0 0 var(--border-s) var(--pb-line)}.pb-pb-pic.is-mark{aspect-ratio:3/2;padding:var(--space-l)}.pb-pb-pic.is-mark img{max-width:100%;max-height:100%;object-fit:contain}.pb-pb-pic.is-cover{aspect-ratio:4/3}.pb-pb-pic.is-cover img{width:100%;height:100%;object-fit:cover}.pb-pb-maskwrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.pb-pb-maskwrap .a-msk{width:100%;height:100%}.pb-pb-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(10rem,1fr));gap:var(--space-xs)}.pb-pb-gallery .pb-pb-pic:first-child{grid-column:span 2;grid-row:span 2;aspect-ratio:auto}.pb-pb-swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr));gap:var(--space-s)}.pb-pb-swatch{display:flex;flex-direction:column;gap:2px;font-size:var(--size-xs);line-height:var(--line-s);min-width:0}.pb-pb-swatch strong{margin-top:var(--space-xs);font-weight:var(--weight-ui-medium);color:var(--neutral-10)}.pb-pb-chip{display:flex;height:5.5rem;overflow:hidden;border-radius:var(--radius-s);box-shadow:inset 0 0 0 var(--border-s) rgba(0,0,0,.08)}.pb-pb-chip i{flex:1}.pb-pb-chip.is-split{flex-direction:column}.pb-pb-grads{display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:var(--space-s)}.pb-pb-grad{display:flex;flex-direction:column;gap:2px;font-size:var(--size-xs)}.pb-pb-grad i{height:4rem;border-radius:var(--radius-s);margin-bottom:var(--space-xs)}.pb-pb-grad strong{font-weight:var(--weight-ui-medium);color:var(--neutral-10)}.pb-pb-balance{display:flex;height:3rem;overflow:hidden;border-radius:var(--radius-s);box-shadow:inset 0 0 0 var(--border-s) rgba(0,0,0,.08)}.pb-pb-balance div{display:flex;align-items:flex-end;min-width:0;padding:var(--space-xs);font-size:var(--size-xs);white-space:nowrap}.pb-pb-balance span{overflow:hidden;text-overflow:ellipsis}.pb-pb-tones{display:grid;grid-template-columns:repeat(auto-fill,minmax(9rem,1fr));gap:var(--space-s)}.pb-pb-tone{display:flex;flex-direction:column;gap:.35rem;min-height:9rem;padding:var(--space-m);border-radius:var(--radius-s);box-shadow:inset 0 0 0 var(--border-s) rgba(0,0,0,.08)}.pb-pb-tone .a-h{font-size:2.5rem;margin-bottom:auto}.pb-pb-tone .a-mono{font-size:.7rem}.pb-pb-tonehex{font:var(--size-xs)/1.2 var(--font-ui);opacity:.7}.pb-pb-families{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:var(--space-s)}.pb-pb-family{display:flex;flex-direction:column;justify-content:space-between;gap:var(--space-l);min-height:12rem;padding:var(--space-m);border-radius:var(--radius-s);box-shadow:inset 0 0 0 var(--border-s) var(--pb-line)}.pb-pb-family b{font-weight:400;font-size:5rem;line-height:.9;letter-spacing:-.04em}.pb-pb-famname{display:flex;flex-direction:column;gap:2px;font-family:var(--font-ui);font-size:var(--size-xs);color:var(--pb-sub)}.pb-pb-famname strong{font-size:var(--size-s,0.875rem);font-weight:var(--weight-ui-medium);color:var(--neutral-10)}.pb-pb-specimens{display:flex;flex-direction:column}.pb-pb-specimen{display:grid;grid-template-columns:minmax(9rem,13rem) 1fr;gap:var(--space-m);padding:var(--space-m) 0;box-shadow:inset 0 calc(var(--border-s) * -1) 0 var(--pb-line);align-items:baseline}.pb-pb-specimen:last-child{box-shadow:none}.pb-pb-specmeta{display:flex;flex-direction:column;gap:2px;font-size:var(--size-xs);line-height:var(--line-s);color:var(--pb-sub)}.pb-pb-specmeta strong{font-weight:var(--weight-ui-medium);color:var(--neutral-10)}.pb-pb-specsample{min-width:0;overflow-wrap:anywhere}.pb-pb-specsample.is-headline .a-h{font-size:2.25rem}.pb-pb-specsample.is-subhead .a-sub{font-size:1.35rem}.pb-pb-specsample.is-body .a-body{font-size:1rem;display:block;max-width:34rem}.pb-pb-specsample.is-tag .a-tag{font-size:.75rem}.pb-pb-btnsample{display:inline-block;padding:.6em 1.2em;border-radius:99em;background:currentColor}.pb-pb-btnsample{color:var(--neutral-10)}.pb-pb-specsample.is-button{color:var(--neutral-1)}.pb-pb-specsample.is-button .pb-pb-btnsample{background:var(--neutral-10);color:var(--neutral-1)}.pb-pb-agents{display:flex;flex-wrap:wrap;gap:var(--space-m)}.pb-pb-agent{display:flex;flex-direction:column;align-items:center;gap:2px;width:7rem;text-align:center;font-size:var(--size-xs);color:var(--pb-sub)}.pb-pb-agent i{width:3.5rem;height:3.5rem;margin-bottom:var(--space-xs);border-radius:var(--radius-full);box-shadow:inset 0 0 0 var(--border-s) rgba(0,0,0,.08)}.pb-pb-agent strong{font-weight:var(--weight-ui-medium);color:var(--neutral-10)}.pb-pb-dl{display:flex;flex-direction:column;gap:var(--space-xxs)}.pb-pb-dlrow{display:grid;grid-template-columns:2.5rem 1fr auto;align-items:center;gap:var(--space-s);padding:var(--space-s);border-radius:var(--radius-s);background:var(--pb-ground)}.pb-pb-dlrow>div{display:flex;flex-direction:column;gap:2px;min-width:0;font-size:var(--size-xs);color:var(--pb-sub)}.pb-pb-dlrow strong{font-size:var(--size-s,0.875rem);font-weight:var(--weight-ui-medium);color:var(--neutral-10)}.pb-pb-badge{display:flex;align-items:center;justify-content:center;height:2.5rem;border-radius:var(--radius-s);background:var(--pb-panel);box-shadow:inset 0 0 0 var(--border-s) var(--pb-line);font:var(--weight-ui-medium) .65rem/1 var(--font-ui);color:var(--pb-body)}.pb-pb-state{font-size:var(--size-xs);color:var(--neutral-10)}.pb-pb-dlrow.is-out{background:transparent;box-shadow:inset 0 0 0 var(--border-s) var(--pb-line)}.pb-pb-dlrow.is-out .pb-pb-state,.pb-pb-dlrow.is-out strong{color:var(--pb-sub)}.pb-pb-formats{display:grid;grid-template-columns:repeat(auto-fill,minmax(13rem,1fr));gap:var(--space-xxs) var(--space-m)}.pb-pb-formats div{display:flex;flex-direction:column;gap:2px;padding:var(--space-xs) 0;box-shadow:inset 0 calc(var(--border-s) * -1) 0 var(--pb-line);font-size:var(--size-xs);color:var(--pb-sub)}.pb-pb-formats strong{font-weight:var(--weight-ui-medium);color:var(--neutral-10)}@media (max-width:640px){.pb-pb-specimen{grid-template-columns:1fr;gap:var(--space-xs)}.pb-pb-paper{padding:var(--space-s) var(--space-s) var(--space-l)}.pb-pb-gallery .pb-pb-pic:first-child{grid-column:auto;grid-row:auto;aspect-ratio:4/3}}`;
function pbH(t, p, ...c) {
  c = c.filter((x) => x !== null && x !== void 0 && x !== false && x !== "");
  return c.length > 1 ? jsxs(t, { ...p || {}, children: c }) : jsx(t, { ...p || {}, children: c[0] });
}
function pbPubText(t) {
  if (typeof t != "string") return String(t);
  return pbPubHex.test(t) ? pbH(Fragment, null, pbH("i", { className: "pb-pb-dot", style: { background: t } }), t) : t;
}
var pbPubLabel = (t) => {
  let e = words(String(t));
  return e.replace(/\bPx\b/g, "(px)").replace(/^Ui\b/, "UI");
}, pbPubIsHex = (t) => typeof t == "string" && pbPubHex.test(t), pbPubScalar = (t) => t === null || typeof t != "object", pbPubFmt = (t, e) => Array.isArray(t) && t.length === 2 && t.every((n) => typeof n == "number") ? `${t[0]}\u2013${t[1]}${e ? " px" : ""}` : typeof t == "number" && e ? `${t} px` : t;
function pbPubSrc(t, e) {
  if (!e) return null;
  let n = e;
  if (e.from === "guideline" || !e.uri && !e.data && !e.text && !e.css && !e.asset) {
    let o = pbPubGuide(t).find((r) => r.name === e.name);
    o && (n = o);
  }
  if (n.uri) return { url: n.uri };
  if (n.data) return { url: n.data };
  if (typeof n.text == "string" && /\.svg$/i.test(n.name || "")) return { url: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(n.text) };
  if (n.css) return { mask: n.css, color: n.color };
  if (e.asset) {
    let o = Object.values(t.ASSETS || {}).flatMap((r) => r.files || []).find((r) => r.id === e.asset);
    return { url: o?.data || `/_blob/${e.asset}` };
  }
  return null;
}
function pbPubFiles(t, e, n) {
  let o = (e.downloads || []).filter((r) => r.included && r.kind !== "font" && n.test(r.id + " " + r.group + " " + r.name));
  return o.flatMap((r) => r.files).filter((r) => /^image\//.test(r.type || pbPubTypeOf(r.name || "")) || /\.(svg|png|jpe?g|webp|gif)$/i.test(r.name || ""));
}
var pbPubDark = (t) => {
  let e = String(t || "").replace("#", "");
  e.length === 3 && (e = e.replace(/./g, "$&$&"));
  let n = parseInt(e.slice(0, 6), 16);
  if (isNaN(n)) return false;
  let o = n >> 16 & 255, r = n >> 8 & 255, i = n & 255;
  return o * 0.299 + r * 0.587 + i * 0.114 < 140;
};
function pbPubPic({ brand: t, file: e, cover: n, ground: o }) {
  let r = pbPubSrc(t, e);
  if (!r) return null;
  let i = String(e.name || "").split("/").pop(), a = /white|bone|off-white|light|reverse/i.test(i), s = o || (r.mask ? r.color && !pbPubDark(r.color) ? "#1b1b1b" : "#f4f3f0" : a && !n ? "#1b1b1b" : void 0);
  return pbH("figure", { className: "pb-pb-pic" + (n ? " is-cover" : " is-mark"), style: s ? { background: s } : void 0 }, r.mask ? pbH("div", { className: "a pb-pb-maskwrap", "data-brand": t.id, style: { background: "transparent" } }, pbH("i", { className: "a-msk", style: { "--src": `var(${r.mask})`, color: r.color || "currentColor" } })) : pbH("img", { src: r.url, alt: i.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " "), loading: "lazy" }));
}
function pbPubSec({ n: t, title: e, lead: n, children: o }) {
  return pbH("section", { className: "pb-pb-sec" }, pbH("header", { className: "pb-pb-sechead" }, pbH("span", { className: "pb-pb-num" }, String(t).padStart(2, "0")), pbH("h2", null, e)), n ? pbH("p", { className: "pb-pb-lead" }, n) : null, o);
}
function pbPubList({ items: t, tone: e }) {
  return pbH("ul", { className: "pb-pb-list" + (e ? " is-" + e : "") }, t.map((n, o) => pbH("li", { key: o }, pbPubScalar(n) ? pbPubText(n) : pbPubInline(n))));
}
function pbPubChips({ items: t }) {
  return pbH("div", { className: "pb-pb-chips" }, t.map((e, n) => pbH("span", { key: n }, pbPubIsHex(e) ? pbPubText(e) : String(e))));
}
function pbPubInline(t) {
  if (Array.isArray(t)) return t.map((e2) => pbPubScalar(e2) ? String(e2) : pbPubInline(e2)).join(", ");
  let e = t.name ?? t.label ?? t.id, n = Object.entries(t).filter(([o, r]) => !["name", "label", "id"].includes(o) && pbPubScalar(r));
  return pbH(Fragment, null, e !== void 0 ? pbH("strong", null, String(e)) : null, n.length ? pbH("span", { className: "pb-pb-soft" }, (e !== void 0 ? " \xB7 " : "") + n.map(([, o]) => String(o)).join(" \xB7 ")) : null);
}
function pbPubDoDont({ yes: t, no: e, yesLabel: n = "Do", noLabel: o = "Don\u2019t" }) {
  return pbH("div", { className: "pb-pb-dodont" }, t?.length ? pbH("div", { className: "pb-pb-card" }, pbH("h3", { className: "pb-pb-cardhead is-do" }, n), pbH(pbPubList, { items: t, tone: "do" })) : null, e?.length ? pbH("div", { className: "pb-pb-card" }, pbH("h3", { className: "pb-pb-cardhead is-dont" }, o), pbH(pbPubList, { items: e, tone: "dont" })) : null);
}
function pbPubSpec({ obj: t }) {
  let e = Object.entries(t).filter(([, n]) => n !== void 0 && (pbPubScalar(n) || Array.isArray(n) && n.every(pbPubScalar)));
  return e.length ? pbH("dl", { className: "pb-pb-spec" }, e.map(([n, o]) => pbH(Fragment, { key: n }, pbH("dt", null, pbPubLabel(n)), pbH("dd", null, Array.isArray(o) ? o.length === 2 && o.every((r) => typeof r == "number") ? pbPubFmt(o, /px$/i.test(n)) : o.map((r, i) => pbH(Fragment, { key: i }, i ? ", " : "", pbPubText(r))) : pbPubText(/px$/i.test(n) && typeof o == "number" ? `${o} px` : o))))) : null;
}
function pbPubAuto({ v: t, depth: e = 0 }) {
  if (t == null) return null;
  if (pbPubScalar(t)) return pbH("p", { className: "pb-pb-text" }, pbPubText(t));
  if (Array.isArray(t)) {
    if (!t.length) return null;
    if (t.every(pbPubIsHex)) return pbH(pbPubChips, { items: t });
    if (t.every((n2) => typeof n2 == "number")) return pbH("p", { className: "pb-pb-text" }, pbPubFmt(t) || t.join(", "));
    if (t.every((n2) => typeof n2 == "string")) return t.every((n2) => n2.length <= 34) && t.length > 2 ? pbH(pbPubChips, { items: t }) : pbH(pbPubList, { items: t });
    if (t.every((n2) => n2 && typeof n2 == "object" && !Array.isArray(n2) && (n2.label || n2.name))) {
      return pbH("div", { className: "pb-pb-rows" }, t.map((n2, o2) => {
        let r2 = Object.entries(n2).filter(([a2]) => !["name", "label", "id", "default"].includes(a2)), i2 = r2.filter(([, a2]) => pbPubScalar(a2));
        return pbH("div", { className: "pb-pb-row", key: o2 }, pbH("strong", null, String(n2.label ?? n2.name)), i2.length ? pbH("span", { className: "pb-pb-soft" }, i2.map(([, a2]) => String(a2)).join(" \xB7 ")) : null, r2.filter(([, a2]) => Array.isArray(a2) && a2.length).map(([a2, s]) => pbH(pbPubChips, { key: a2, items: s.map((l) => pbPubScalar(l) ? l : l.label ?? l.name ?? "") })));
      }));
    }
    return pbH(pbPubList, { items: t });
  }
  let p = Object.entries(t).filter(([s, l]) => ["rule", "use", "subject", "style", "summary"].includes(s) && typeof l == "string" && l.length > 40), n = Object.entries(t).filter(([s]) => !p.some(([l]) => l === s)), o = n.filter(([, s]) => pbPubScalar(s) || Array.isArray(s) && s.every(pbPubScalar) && (s.every((l) => typeof l == "number") || s.length <= 2 && s.every(pbPubIsHex))), r = n.filter((s) => !o.includes(s)), i = t.always || t.rules, a = t.never || t.avoid;
  return pbH("div", { className: "pb-pb-auto" }, p.map(([s, l]) => pbH("p", { className: "pb-pb-text", key: s }, l)), o.length ? pbH(pbPubSpec, { obj: Object.fromEntries(o) }) : null, r.filter(([s]) => !["always", "rules", "never", "avoid"].includes(s)).map(([s, l]) => pbH("div", { className: "pb-pb-sub", key: s }, pbH("h3", null, pbPubLabel(s)), pbH(pbPubAuto, { v: l, depth: e + 1 }))), i || a ? pbH(pbPubDoDont, { yes: i, no: a }) : null);
}
function pbPubCards({ obj: t }) {
  return pbH("div", { className: "pb-pb-cards" }, Object.entries(t).map(([e, n]) => pbH("article", { className: "pb-pb-card", key: e }, pbH("h3", { className: "pb-pb-cardhead" }, pbPubLabel(e)), pbPubScalar(n) ? pbH("p", { className: "pb-pb-text" }, pbPubText(n)) : Array.isArray(n) ? pbH(pbPubAuto, { v: n }) : pbH(Fragment, null, n.rule || n.use ? pbH("p", { className: "pb-pb-text" }, n.rule || n.use) : null, pbH(pbPubAuto, { v: Object.fromEntries(Object.entries(n).filter(([o]) => o !== "rule" && o !== "use")), depth: 1 })))));
}
function pbPubCover({ brand: t, c: e }) {
  let n = e.tones || [], o = n.find((c) => pbPubDark(c.ground)) || n[0] || { ground: "#111", ink: "#fff" }, r = pbPubFiles(t, e, /logo/i), i = pbPubDark(o.ground), a = r.find((c) => {
    let u = String(c.name);
    return i ? /white|bone|light/i.test(u) : /black|ink|dark/i.test(u);
  }) || r.find((c) => !/mark|icon|symbol/i.test(c.name)) || r[0], s = a && pbPubSrc(t, a), l = e.brand?.edition;
  return pbH("div", { className: "a pb-pb-cover", "data-brand": t.id, style: { background: o.ground, color: o.ink } }, s ? s.mask ? pbH("i", { className: "a-msk pb-pb-coverlogo", style: { "--src": `var(${s.mask})`, color: o.ink } }) : pbH("img", { className: "pb-pb-coverlogo", src: s.url, alt: `${e.brand?.name} logo` }) : pbH("span", { className: "a-mono pb-pb-covername" }, e.brand?.name), pbH("div", { className: "pb-pb-coverfoot" }, pbH("span", { className: "a-mono" }, "Brand book"), pbH("h1", { className: "a-h" }, e.brand?.name), e.character?.length ? pbH("div", { className: "pb-pb-covertags" }, e.character.map((c) => pbH("span", { className: "a-tag", key: c }, c))) : null, l ? pbH("span", { className: "a-mono pb-pb-edition" }, l) : null));
}
function pbPubColour({ c: t }) {
  let e = t.colour || {}, n = [], o = Object.entries(e).filter(([a]) => !["balance", "rules", "never"].includes(a));
  for (let [a, s] of o) {
    if (Array.isArray(s) && s.length && s.every((l) => l && typeof l == "object" && !Array.isArray(l))) {
      n.push(pbH("div", { className: "pb-pb-sub", key: a }, pbH("h3", null, pbPubLabel(a)), pbH("div", { className: "pb-pb-swatches" }, s.map((l, c) => {
        let u = l.hex ? [l.hex] : l.steps ? l.steps : [l.deep, l.light].filter(Boolean);
        return pbH("div", { className: "pb-pb-swatch", key: c }, pbH("div", { className: "pb-pb-chip" + (u.length > 1 ? " is-split" : "") }, u.map((f, d) => pbH("i", { key: d, style: { background: f } }))), pbH("strong", null, l.name), pbH("span", { className: "pb-pb-soft" }, u.join(" \xB7 ")));
      }))));
      continue;
    }
    if (s && typeof s == "object" && !Array.isArray(s) && Object.values(s).every((l) => Array.isArray(l))) {
      n.push(pbH("div", { className: "pb-pb-sub", key: a }, pbH("h3", null, pbPubLabel(a)), pbH("div", { className: "pb-pb-grads" }, Object.entries(s).map(([l, c]) => {
        let u = c.map((f) => Array.isArray(f) ? f[1] : f?.hex ?? f).filter(pbPubIsHex);
        return pbH("div", { className: "pb-pb-grad", key: l }, pbH("i", { style: { background: `linear-gradient(90deg,${u.join(",")})` } }), pbH("strong", null, pbPubLabel(l)), pbH("span", { className: "pb-pb-soft" }, c.map((f) => Array.isArray(f) ? f[0] : f?.name ?? f).join(" \xB7 ")));
      }))));
      continue;
    }
    n.push(pbH("div", { className: "pb-pb-sub", key: a }, pbH("h3", null, pbPubLabel(a)), pbH(pbPubAuto, { v: s })));
  }
  let r = e.balance && typeof e.balance == "object" ? Object.entries(e.balance).filter(([, a]) => typeof a == "number") : [], i = (a) => {
    let s = o.find(([u]) => u.toLowerCase().startsWith(a.toLowerCase().slice(0, 5)))?.[1] || (a.startsWith("neutral") ? null : o.find(([u]) => !/neutral/i.test(u))?.[1]);
    if (!Array.isArray(s) || !s.length) return "#d8d6d1";
    let l = a.startsWith("neutral") ? s[Math.min(s.length - 1, Math.floor(s.length / 2))] : s[0];
    return l?.hex || l?.deep || l?.steps?.[0] || "#d8d6d1";
  };
  return pbH(Fragment, null, r.length ? pbH("div", { className: "pb-pb-sub" }, pbH("h3", null, "Balance"), pbH("div", { className: "pb-pb-balance" }, r.map(([a, s]) => {
    let l = i(a);
    return pbH("div", { key: a, style: { flexGrow: s, background: l, color: pbPubDark(l) ? "#fff" : "#111" } }, pbH("span", null, `${pbPubLabel(a)} ${s}%`));
  }))) : null, n, e.rules || e.never ? pbH(pbPubDoDont, { yes: e.rules, no: e.never }) : null);
}
var pbPubFamVar = (t) => /mono/i.test(t) ? "var(--tf)" : /serif/i.test(t) && !/sans/i.test(t) ? "var(--sf)" : /head|display|title/i.test(t) ? "var(--hf)" : "var(--bf)";
function pbPubType({ brand: t, c: e }) {
  let n = e.type || {}, o = Object.entries(n.families || {}), r = (s) => {
    let l = String(s.family || "");
    if (n.families?.[l]) return pbPubFamVar(l);
    let c = String(s.face || ""), u = o.find(([, f]) => f?.name && c.startsWith(f.name)) || o.find(([, f]) => f?.alternative && c.startsWith(f.alternative));
    return u ? pbPubFamVar(u[0]) : /tag|eyebrow|label/i.test(s.id || "") ? "var(--tf)" : /head/i.test(s.id || "") ? "var(--hf)" : /sub/i.test(s.id || "") ? "var(--sf)" : "var(--bf)";
  }, i = (s) => weightOf(s.weight) || weightOf(String(s.face || "").split(" ").pop()) || 400, a = { tag: "a-tag", eyebrow: "a-tag", headline: "a-h", subhead: "a-sub", body: "a-body" };
  return pbH(Fragment, null, o.length ? pbH("div", { className: "pb-pb-families" }, o.map(([s, l]) => pbH("div", { className: "a pb-pb-family", "data-brand": t.id, key: s, style: { background: "var(--pb-panel)", color: "var(--neutral-10)" } }, pbH("b", { style: { fontFamily: pbPubFamVar(s) } }, "Aa"), pbH("div", { className: "pb-pb-famname" }, pbH("strong", null, l?.name || pbPubLabel(s)), pbH("span", null, [pbPubLabel(s), l?.alternative ? `Alternative: ${l.alternative}` : ""].filter(Boolean).join(" \xB7 ")))))) : null, n.styles?.length ? pbH("div", { className: "pb-pb-sub" }, pbH("h3", null, "Type styles"), pbH("div", { className: "pb-pb-specimens" }, n.styles.map((s) => {
    let l = String(s.id || "").toLowerCase(), c = a[l] || (/button/.test(l) ? "pb-pb-btnsample" : "a-body");
    return pbH("div", { className: "pb-pb-specimen", key: s.id || s.name }, pbH("div", { className: "pb-pb-specmeta" }, pbH("strong", null, s.name), pbH("span", null, [s.face || s.weight, s.tracking && `Tracking ${s.tracking}`, s.leading && s.leading !== "n/a" && `Leading ${s.leading}`].filter(Boolean).join(" \xB7 ")), s.extra ? pbH("span", null, s.extra) : null), pbH("div", { className: "a pb-pb-specsample is-" + (l || "body"), "data-brand": t.id, style: { background: "transparent", color: "var(--neutral-10)" } }, pbH("span", { className: c, style: { fontFamily: r(s), fontWeight: i(s) } }, s.sample || s.name)));
  }))) : null, n.sizes && typeof n.sizes == "object" ? pbH("div", { className: "pb-pb-sub" }, pbH("h3", null, "Sizes"), pbH("dl", { className: "pb-pb-spec" }, Object.entries(n.sizes).map(([s, l]) => pbH(Fragment, { key: s }, pbH("dt", null, s), pbH("dd", null, typeof l == "number" ? `${l} px` : pbPubText(l)))))) : null, pbH(pbPubAuto, { v: Object.fromEntries(Object.entries(n).filter(([s]) => !["families", "styles", "sizes"].includes(s))) }));
}
function pbPubGallery({ brand: t, files: e, max: n = 9 }) {
  e = e.filter((o) => {
    let r = pbPubSrc(t, o);
    return r && !r.mask;
  });
  return e.length ? pbH("div", { className: "pb-pb-gallery" }, e.slice(0, n).map((o, r) => pbH(pbPubPic, { key: o.name + r, brand: t, file: o, cover: true }))) : null;
}
function pbPubTones({ c: t, brand: e }) {
  return pbH("div", { className: "pb-pb-tones" }, t.tones.map((n) => pbH("div", { className: "a pb-pb-tone", "data-brand": e.id, key: n.name, style: { background: n.ground, color: n.ink } }, pbH("b", { className: "a-h" }, "Aa"), pbH("span", { className: "a-mono" }, n.name), pbH("span", { className: "pb-pb-tonehex" }, `${n.ground} / ${n.ink}`))));
}
function pbPubDownloads({ c: t }) {
  let e = t.downloads || [], n = e.filter((o) => o.included);
  return pbH(Fragment, null, e.length ? pbH("div", { className: "pb-pb-dl" }, e.map((o) => {
    let r = [...new Set(o.files.map((a) => String(a.name || "").split(".").pop().toUpperCase()).filter((a) => a && a.length <= 5))], i = o.kind === "font" ? "Font" : r.join(" \xB7 ") || "Files";
    return pbH("div", { className: "pb-pb-dlrow" + (o.included ? "" : " is-out"), key: o.id }, pbH("span", { className: "pb-pb-badge" }, o.kind === "font" ? "Aa" : r[0] || "\u2014"), pbH("div", null, pbH("strong", null, o.name), pbH("span", null, o.included ? `${i} \xB7 ${o.files.length} file${o.files.length === 1 ? "" : "s"}${o.licence ? ` \xB7 ${o.licence} licence` : ""}` : o.reason)), pbH("span", { className: "pb-pb-state" }, o.included ? "Included" : "Left out"));
  })) : pbH("p", { className: "pb-pb-text" }, "No files yet. Files added in Assets show up here."), pbH("p", { className: "pb-pb-soft pb-pb-note" }, `${n.length} of ${e.length} included in the download.`));
}
var pbPubTitles = { voice: "Voice", logo: "Logo", colour: "Colour", type: "Typography", imagery: "Imagery", photography: "Photography", graphics: "Graphic system", icons: "Icons", agents: "Agents", charlie: "Charlie" };
function pbPubBook({ c: t, brand: e }) {
  let n = 0, o = [], r = (l, c, u) => o.push(pbH(pbPubSec, { key: l, n: ++n, title: c }, u));
  t.voice && r("voice", "Voice", pbH("p", { className: "a pb-pb-voice", "data-brand": e.id, style: { background: "transparent", color: "var(--neutral-10)" } }, pbH("span", { className: "a-sub" }, t.voice)));
  if (t.logo) {
    let l = pbPubFiles(e, t, /logo/i), { rules: c, never: u, assets: f, ...d } = t.logo;
    r("logo", "Logo", pbH(Fragment, null, l.length ? pbH("div", { className: "pb-pb-marks" }, l.slice(0, 8).map((m, h) => pbH(pbPubPic, { key: m.name + h, brand: e, file: m }))) : null, f ? pbH("div", { className: "pb-pb-sub" }, pbH("h3", null, "Versions"), pbH(pbPubSpec, { obj: f })) : null, Object.keys(d).length ? pbH(pbPubAuto, { v: d }) : null, pbH(pbPubDoDont, { yes: c, no: u })));
  }
  t.colour && r("colour", "Colour", pbH(pbPubColour, { c: t }));
  t.tones?.length && r("tones", "Colour pairings", pbH(pbPubTones, { c: t, brand: e }));
  t.type && r("type", "Typography", pbH(pbPubType, { brand: e, c: t }));
  let i = pbPubFiles(e, t, /imagery|^guideline-files/i), a = i.filter((l) => !/core-shape|pattern|texture/i.test(l.name));
  if (t.imagery || a.length) {
    let { photography: l, particle: c, ...u } = t.imagery || {};
    r("imagery", "Imagery", pbH(Fragment, null, pbH(pbPubGallery, { brand: e, files: a }), l || c ? pbH(pbPubCards, { obj: Object.fromEntries([["photography", l], ["particle", c]].filter(([, f]) => f)) }) : null, Object.keys(u).length ? pbH(pbPubAuto, { v: u }) : null));
  }
  t.photography && r("photography", "Photography", pbH(pbPubCards, { obj: typeof t.photography == "object" && !Array.isArray(t.photography) && !t.photography.rule ? t.photography : { photography: t.photography } }));
  if (t.graphics) {
    let l = i.filter((c) => /core-shape|pattern|texture/i.test(c.name));
    r("graphics", "Graphic system", pbH(Fragment, null, l.length ? pbH(pbPubGallery, { brand: e, files: l, max: 6 }) : null, pbH(pbPubCards, { obj: t.graphics })));
  }
  if (t.icons) {
    let l = pbPubFiles(e, t, /icon/i);
    r("icons", "Icons", pbH(Fragment, null, l.length ? pbH(pbPubGallery, { brand: e, files: l, max: 3 }) : null, pbH(pbPubAuto, { v: t.icons })));
  }
  t.agents && r("agents", "Agents", pbH(Fragment, null, t.agents.rule ? pbH("p", { className: "pb-pb-text" }, t.agents.rule) : null, t.agents.examples?.length ? pbH("div", { className: "pb-pb-agents" }, t.agents.examples.map((l) => pbH("div", { className: "pb-pb-agent", key: l.name }, pbH("i", { style: { background: l.hex } }), pbH("strong", null, l.name), pbH("span", null, l.role)))) : null, pbH(pbPubAuto, { v: Object.fromEntries(Object.entries(t.agents).filter(([l]) => l !== "rule" && l !== "examples")) })));
  if (t.charlie) {
    let l = pbPubFiles(e, t, /logo/i).filter((c) => /charlie/i.test(c.name));
    r("charlie", "Charlie", pbH(Fragment, null, l.length ? pbH("div", { className: "pb-pb-marks" }, l.map((c, u) => pbH(pbPubPic, { key: u, brand: e, file: c }))) : null, pbH(pbPubAuto, { v: t.charlie })));
  }
  r("downloads", "Downloads", pbH(pbPubDownloads, { c: t }));
  t.formats?.length && r("formats", `Ready formats (${t.formats.length})`, pbH("div", { className: "pb-pb-formats" }, t.formats.map((l) => pbH("div", { key: l.id }, pbH("strong", null, l.name), l.use ? pbH("span", null, l.use) : null))));
  let s = pbH("details", { className: "pb-pub-json" }, pbH("summary", null, "Client version as JSON"), pbH("pre", { className: "pb-code", tabIndex: 0 }, JSON.stringify(t, null, 2)));
  return pbH("div", { className: "pb-pb-wrap" }, pbH("div", { className: "pb-pb-paper" }, pbH(pbPubCover, { brand: e, c: t }), o), s);
}
export function pbPubView({ brand: t, frame: e, save: n, ver: o }) {
  let r = pbPubStore(), i = useMemo(() => pbPubClient(t), [t, t.PACKAGE, o]), a = r.list.filter((D) => D.brand === t.id).sort((D, N) => N.version - D.version), [s, l] = useState("next");
  useEffect(() => l("next"), [t]);
  let c = s === "next" ? null : a.find((D) => D.version === s) ?? null, u = c ? c.client : i, f = a[0], d = (a[0]?.version ?? 0) + 1, m = !!f && JSON.stringify(f.client) === JSON.stringify(i), [h, v] = useState(""), [b, y] = useState(""), x = (t.PACKAGE?.flags || []).filter((D) => D.status === "open").length, S = r.mode === "readonly" || r.mode === "loading", w = async () => {
    v("publish"), y("");
    try {
      let D = await r.add(t, i);
      l(D);
    } catch (D) {
      y(D?.message === "too_big" ? "This version is too large to save. Remove some files in Assets and try again." : D?.message === "readonly" ? "View only: editors of this page can publish." : "The version could not be saved. Try again.");
    } finally {
      v("");
    }
  }, C = async () => {
    if (!c) return;
    v("download"), y("");
    try {
      let D = await pbPubEmbed(t, c.client), { format: N, formatVersion: L, ...P } = D, F = { format: N, formatVersion: L, version: c.version, published: new Date(c.at).toISOString(), ...P };
      await n(`${t.id}-client-v${c.version}.json`, new Blob([JSON.stringify(F, null, 2)], { type: "application/json" }));
    } catch {
      y("The file could not be built in this browser.");
    } finally {
      v("");
    }
  }, R = (i.downloads || []).filter((D) => D.kind === "font"), k = c ? jsx(Btn, { variant: "primary", icon: h === "download" ? jsx("span", { className: "pb-spin", "aria-hidden": "true" }) : jsx(Download, { ...ICON }), disabled: !!h, onClick: C, children: h === "download" ? "Building" : `Download v${c.version}` }) : jsx(Btn, { variant: "primary", icon: h === "publish" ? jsx("span", { className: "pb-spin", "aria-hidden": "true" }) : jsx(Upload, { ...ICON }), disabled: !!h || S, onClick: w, children: h === "publish" ? "Publishing" : `Publish v${d}` }), E = jsxs(Fragment, { children: [jsxs("div", { className: "pb-railblock", children: [jsx(RailHead, { children: "Next version" }), jsx("ul", { className: "pb-raillist", children: jsx(RailItem, { current: s === "next", meta: m ? "No changes" : f ? "Changed" : "New", onClick: () => l("next"), children: `Preview v${d}` }) })] }), jsxs("div", { className: "pb-railblock", children: [jsx(RailHead, { children: "Published" }), a.length ? jsx("ul", { className: "pb-raillist", children: a.map((D) => jsx(RailItem, { current: s === D.version, meta: pbPubDay(D.at), onClick: () => l(D.version), children: `v${D.version}` }, D.version)) }) : jsx("p", { className: "pb-quiet pb-pub-none", children: r.mode === "loading" ? "Loading" : "Nothing published yet." })] })] }), M = jsxs("div", { className: "pb-page", children: [jsx("style", { children: pbPubCss }), jsxs("header", { className: "pb-pagehead", children: [jsx("h1", { children: c ? `Client version ${c.version}` : "Publish to client" }), jsx("p", { children: c ? `Published ${pbPubWhen(c.at)}. This is what that version held. Changes made since then go into the next version.` : `What ${t.name}\u2019s client sees: the brand book, approved files and downloads. Rule tags, sources, page references, review items and notes stay in this tool. Publishing saves a numbered version on this page and sends nothing anywhere.` })] }), jsxs("div", { className: "pb-kit-actions", children: [k, b ? jsx("span", { className: "pb-quiet", role: "alert", children: b }) : r.mode === "readonly" && !c ? jsx("span", { className: "pb-quiet", children: "View only: editors of this page can publish." }) : null] }), c ? null : jsxs("ul", { className: "pb-kit-status", children: [jsx("li", { children: m ? `Nothing has changed since v${f.version}.` : f ? `Changed since v${f.version}, published ${pbPubWhen(f.at)}.` : "This will be the first client version." }), jsx("li", { children: x ? `${x} review item${x === 1 ? " is" : "s are"} still open here. Review items stay internal and are not part of the client version.` : "Every review item is resolved. Review items stay internal either way." }), R.map((D) => jsx("li", { children: D.included ? `${D.name}: included (${D.licence} licence).` : `${D.name}: ${D.licence ? "trial files only" : "not supplied yet"}, so it is left out of downloads.` }, D.id)), r.mode === "local" ? jsx("li", { children: "Versions are kept in this browser only here. On the published page they are saved for everyone." }) : null] }), jsx(pbPubBook, { c: u, brand: t })] });
  return e({ actions: k, rail: E, railLabel: "Client versions", main: M, mainLabel: "Client version", kind: "doc" });
}
