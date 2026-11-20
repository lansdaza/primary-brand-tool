// Guideline: chapter pages drawn from the open brand's record. Each section pairs what a person sees
// (exhibit, the source's own description, files, values to copy) with what a machine reads.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Braces, ChevronDown, Copy, Download, Shuffle } from 'lucide-react';
import * as E from './engine/index.js';
import { Btn, Chip, CopyButton, Html, ICON, RailHead, RailItem, SEVERITY, SlideView, copyText, pageRef, type Brand, type Params, type Save, type Tpl } from './ui';
import type { Frame } from './App';
import { SceneBlock, presenceItems, usePresence, type Pres } from './presence';

type Rule = { t: string; b: string; p: string | number };
const BASIS = ['stated', 'measured', 'inferred'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const Rules = ({ items }: { items: Rule[] }) => (
  <ul className="pb-rules">
    {items.map((r) => (
      <li key={r.t}><span>{r.t}</span><span className="pb-chips"><Chip kind={r.b}>{cap(r.b)}</Chip><Chip kind="page">{pageRef(r.p)}</Chip></span></li>
    ))}
  </ul>
);
function FlagNote({ brand, id }: { brand: Brand; id: string }) {
  const f = brand.BRAND.flags.find((x: any) => x.id === id);
  return f ? <div className="pb-note"><Chip kind={f.sev}>{SEVERITY[f.sev]}</Chip><p><b>{f.title}.</b> {f.uses}</p></div> : null;
}
function CopyValue({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="pb-val" title={`Copy ${label} ${value}`} onClick={async () => { if (await copyText(value)) { setDone(true); setTimeout(() => setDone(false), 1200); } }}>
      {done ? 'Copied' : label === 'HEX' ? value : <><span className="pb-val-k">{label}</span> {value}</>}
    </button>
  );
}
// A colour as a person needs it: its name and each value, every value copied on its own.
function Swatch({ c }: { c: { name: string; hex: string; rgb?: string; cmyk?: string } }) {
  return (
    <div className="pb-sw" style={{ background: c.hex, color: E.lum(c.hex) > 0.4 ? '#111111' : '#f7f7f7' }}>
      <b>{c.name}</b>
      <CopyValue label="HEX" value={c.hex} />
      {c.rgb ? <CopyValue label="RGB" value={c.rgb} /> : null}
      {c.cmyk ? <CopyValue label="CMYK" value={c.cmyk} /> : null}
    </div>
  );
}
const Labelled = ({ label, action, children }: { label?: string; action?: ReactNode; children: ReactNode }) =>
  label || action ? <div className="pb-labelled"><div className="pb-labelled-head"><span>{label}</span>{action}</div>{children}</div> : <>{children}</>;

// A layout drawn at its real size and scaled down; selecting it opens the layout in Make or Decks.
function LayoutCard({ t, onOpen }: { t: Tpl; onOpen: () => void }) {
  const p: Params = useMemo(() => { const d = E.defaults(t); return 'motion' in d ? { ...d, motion: false } : d; }, [t]);
  return (
    <button type="button" className="pb-layout" onClick={onOpen}>
      <SlideView t={t} p={p} label={`${t.name} layout`} />
      <span><b>{t.name}</b><small>{t.use}</small></span>
    </button>
  );
}

function Block({ block, brand, shuffle, openLayout, pres }: { block: any; brand: Brand; shuffle: () => void; openLayout: (t: Tpl) => void; pres: Pres }) {
  switch (block.k) {
    case 'tiles': return <Labelled label={block.label} action={block.shuffle ? <Btn variant="secondary" icon={<Shuffle {...ICON} />} onClick={shuffle}>{block.shuffle}</Btn> : undefined}><Html className="pb-grid" cols={block.cols} html={block.html.join('')} /></Labelled>;
    case 'swatches': return <Labelled label={block.label}><div className="pb-swatches" data-short={block.short ? 'true' : undefined} data-cols={block.cols}>{block.items.map((c: any) => <Swatch key={c.name + c.hex} c={c} />)}</div></Labelled>;
    case 'balance': return (
      <div className="pb-balance">
        <div className="pb-bal" role="img" aria-label={`Colour balance: ${block.legend.map((l: any) => `${l.label} ${l.pct}%`).join(', ')}`}>{block.parts.map((s: any, i: number) => <span key={i} style={{ flex: s.w, background: s.hex }} />)}</div>
        <div className="pb-bal-legend">{block.legend.map((l: any) => <span key={l.label} style={{ flex: l.pct }}><b>{l.pct}%</b> {l.label}</span>)}</div>
      </div>
    );
    case 'prompt': return <Labelled label={block.label}><div className="pb-prompt"><p>{block.text}</p><CopyButton icon={<Copy {...ICON} />} text={() => block.text}>Copy prompt</CopyButton></div></Labelled>;
    case 'specs': return <div className="pb-specs">{block.rows.map((r: any) => <div className="pb-spec" key={r.meta[0]}><div className="pb-spec-meta"><b>{r.meta[0]}</b>{r.meta.slice(1).map((m: string, i: number) => <span key={i}>{m}</span>)}</div><Html className="pb-spec-sample" html={r.html} /></div>)}</div>;
    case 'specimen': return <div className="pb-specimen">{block.rows.map((r: any, i: number) => <div key={i}><Html html={r.html} /><span className="pb-quiet">{r.note}</span></div>)}</div>;
    case 'donts': return <ul className="pb-donts">{block.items.map((t: string) => <li key={t}><span className="pb-donts-x" aria-hidden="true" /><span><span className="pb-visually-hidden">Do not </span>{cap(t)}</span></li>)}</ul>;
    case 'scene': return <SceneBlock brand={brand} id={block.id} pres={pres} openLayout={openLayout} />;
    case 'layouts': return <div className="pb-layouts">{block.ids.map((id: string) => brand.TBY[id] ?? brand.SLBY[id]).filter(Boolean).map((t: Tpl) => <LayoutCard key={t.id} t={t} onOpen={() => openLayout(t)} />)}</div>;
    default: return null;
  }
}

// Review items count only while open: files added in Assets, or a person's acceptance, close them.
const summaryOf = (item: any, brand: Brand) => {
  const rules: Rule[] = item.rules ?? [], flags = (item.flags ?? []).filter((id: string) => { const f = brand.BRAND.flags.find((x: any) => x.id === id); return f && E.flagStatus(brand, f).state === 'open'; }).length;
  const parts = [rules.length ? `${rules.length} rule${rules.length === 1 ? '' : 's'}` : 'Data only', ...BASIS.map((b) => [rules.filter((r) => r.b === b).length, b] as const).filter(([n]) => n).map(([n, b]) => `${n} ${b}`)];
  if (flags) parts.push(`${flags} to review`);
  return parts.join(' · ');
};

function GuideItem({ item, brand, open, side, onToggle, shuffle, save, openLayout, openTool, pres, setPres }: { item: any; brand: Brand; open: boolean; side: boolean; onToggle: () => void; shuffle: () => void; save: Save; openLayout: (t: Tpl) => void; openTool: (id: string) => void; pres: Pres; setPres: (patch: Partial<Pres>) => void }) {
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const desc: string[] = item.desc ?? [], files: any[] = item.files ?? [];
  const long = desc.length > 1 || !!item.details || (desc[0]?.length ?? 0) > 330;
  const json = useMemo(() => JSON.stringify(item.data ?? {}, null, 2), [item]);
  const download = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (files.length === 1) await save(files[0].name, await E.fileBlob(files[0]));
      else await save(`${brand.id}-${item.id}.zip`, await E.zipFiles(files));
    } catch (error) { console.warn('Download failed', error); }
    finally { setBusy(false); }
  };
  const ref = [item.num, item.ref].filter(Boolean).join(' · ');
  const tool = item.tool && (brand as any).tools?.find((x: any) => x.id === item.tool);
  const hasActions = tool || (item.make && brand.TBY[item.make]) || item.copy || files.length;
  return (
    <section className="pb-item" id={`s-${item.id}`} aria-labelledby={`h-${item.id}`} data-side={side}>
      <div className="pb-item-human">
        <header className="pb-item-head"><h2 id={`h-${item.id}`}>{item.title}</h2>{ref ? <span className="pb-ref">{ref}</span> : null}</header>
        {item.blocks.map((b: any, i: number) => <Block key={i} block={b} brand={brand} shuffle={shuffle} openLayout={openLayout} pres={pres} />)}
        <div className="pb-item-foot">
          <div className="pb-desc" data-more={more || !long}>
            {(more ? desc : desc.slice(0, 1)).map((p, i) => <p key={i}>{p}</p>)}
            {item.note ? <p>{item.note}</p> : null}
            {more && item.details ? <p><span className="pb-quiet">Details</span><br />{item.details}</p> : null}
            {long ? <button type="button" className="pb-more" aria-expanded={more} onClick={() => setMore(!more)}>{more ? 'Show less' : 'Read more'}</button> : null}
          </div>
          {item.foot ? <div className="pb-scene-foot">{item.foot({ brand, pres, setPres, openLayout, save })}</div> : hasActions ? (
            <div className="pb-actions">
              {tool ? <Btn variant="secondary" icon={<ArrowUpRight {...ICON} />} onClick={() => openTool(tool.id)}>Open the tool</Btn> : null}
              {item.make && brand.TBY[item.make] ? <Btn icon={<ArrowUpRight {...ICON} />} onClick={() => openLayout(brand.TBY[item.make])}>Open in Make</Btn> : null}
              {item.copy ? <CopyButton icon={<Copy {...ICON} />} text={() => item.copy.text}>{item.copy.label}</CopyButton> : null}
              {files.length ? <Btn icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <Download {...ICON} />} disabled={busy} onClick={download}>{busy ? 'Preparing' : files.length > 1 ? `Download ${files.length} files` : 'Download'}</Btn> : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="pb-machine" data-open={open}>
        {side ? <div className="pb-mline"><Braces {...ICON} size={14} /><b>Machine reading</b><span>{summaryOf(item, brand)}</span></div>
          : <button type="button" className="pb-mline" aria-expanded={open} onClick={onToggle}><Braces {...ICON} size={14} /><b>Machine reading</b><span>{summaryOf(item, brand)}</span><ChevronDown {...ICON} size={14} className="pb-mline-chev" /></button>}
        {open ? (
          <div className="pb-mbody">
            <code className="pb-call">get_brand("{brand.id}", "{item.path}")</code>
            {item.rules?.length ? <Rules items={item.rules} /> : null}
            {item.prompt ? <div className="pb-prompt"><p>{item.prompt}</p><CopyButton icon={<Copy {...ICON} />} text={() => item.prompt}>Copy prompt</CopyButton></div> : null}
            {(item.flags ?? []).map((id: string) => <FlagNote key={id} brand={brand} id={id} />)}
            <div className="pb-codehead"><span className="pb-quiet">Data</span><CopyButton icon={<Copy {...ICON} />} text={() => json}>Copy JSON</CopyButton></div>
            <pre className="pb-code" tabIndex={0}>{json}</pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// Chapters of a brand's guideline: an introduction, the chapters read from the source, and the layouts made from it.
export function chaptersOf(brand: Brand, guide: any, pres?: Pres): any[] {
  const kinds = (list: Tpl[]) => ({ rules: [], data: { templates: list.map(E.describe) } });
  return [
    { id: 'intro', title: 'Introduction', num: guide.intro.num, items: [] },
    ...guide.chapters,
    { id: 'applications', title: 'Applications', num: '', items: [
      ...(pres ? presenceItems(brand, pres) : []),
      { id: 'layouts', title: 'Layouts', num: '', ref: `${brand.T.length} layouts`, desc: [], note: `Layouts with declared dials, read from this guideline’s application pages. ${brand.T.filter((t: Tpl) => t.shared).length} are shared with every brand. Select one to open it in Make.`, path: 'templates', blocks: [{ k: 'layouts', ids: brand.T.map((t: Tpl) => t.id) }], ...kinds(brand.T) },
      { id: 'slides', title: 'Slide layouts', num: '', ref: `${brand.SL.length} layouts`, desc: [], note: 'Slide layouts for decks, each at 1920 by 1080. Select one to open Decks.', path: 'slides', blocks: [{ k: 'layouts', ids: brand.SL.map((t: Tpl) => t.id) }], ...kinds(brand.SL) },
    ] },
  ];
}

export function GuidelineView({ brand, chapter, machine, setMachine, goChapter, goMake, goDecks, goTool, save, frame }: { brand: Brand; chapter?: string; machine: boolean; setMachine: (on: boolean) => void; goChapter: (id: string) => void; goMake: (id: string) => void; goDecks: () => void; goTool: (id: string) => void; save: Save; frame: Frame }) {
  const [seed, setSeed] = useState(3);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [active, setActive] = useState('');
  const guide = useMemo(() => brand.guide(seed), [brand, seed]);
  const [pres, setPres] = usePresence(brand);
  const chapters = useMemo(() => chaptersOf(brand, guide, pres), [brand, guide, pres]);
  const at = Math.max(0, chapters.findIndex((c) => c.id === chapter)), current = chapters[at];
  useEffect(() => { E.mountWG(); }, [guide, current.id, machine]);
  // The rail marks the section being read.
  useEffect(() => {
    const scroller = document.getElementById('pb-main');
    const items = [...document.querySelectorAll<HTMLElement>('.pb-item[id^="s-"]')];
    if (!scroller || !items.length) { setActive(''); return; }
    const observer = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (seen) setActive(seen.target.id.slice(2));
    }, { root: scroller, rootMargin: '0px 0px -65% 0px' });
    items.forEach((el) => observer.observe(el));
    setActive(items[0].id.slice(2));
    return () => observer.disconnect();
  }, [current.id, machine]);
  const toggle = (id: string) => setOpened((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const openLayout = (t: Tpl) => (brand.TBY[t.id] ? goMake(t.id) : goDecks());
  const jump = (id: string) => document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  const meta = brand.BRAND.meta;
  const prev = chapters[at - 1], next = chapters[at + 1];

  const rail = (
    <div className="pb-railblock">
      <RailHead>Contents</RailHead>
      <ul className="pb-raillist">
        {chapters.map((c) => (
          <li key={c.id} className="pb-chapteritem">
            <button type="button" className="pb-railitem" aria-current={c.id === current.id ? 'page' : undefined} onClick={() => goChapter(c.id)}>
              <span className="pb-railitem-lead pb-num">{c.num && c.num !== '0.0' ? c.num.replace(/\.0$/, '') : ''}</span>
              <span className="pb-railitem-main">{c.title}</span>
            </button>
            {c.id === current.id && c.items.length > 1 ? (
              <ul className="pb-raillist pb-subs">
                {c.items.map((i: any) => <RailItem key={i.id} current={active === i.id} onClick={() => jump(i.id)}>{i.title}</RailItem>)}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
  const actions = (
    <Btn variant={machine ? 'primary' : 'secondary'} icon={<Braces {...ICON} />} aria-pressed={machine} onClick={() => setMachine(!machine)}>Machine reading</Btn>
  );

  const main = (
    <div className="pb-page pb-guide" data-machine={machine}>
      {current.id === 'intro' ? (
        <>
          <Html className="pb-herowrap" html={guide.hero} />
          <div className="pb-intro">
            <p className="pb-lead">{guide.intro.text}</p>
            <dl className="pb-facts">
              <div><dt>Source</dt><dd>{brand.source.label}</dd></div>
              <div><dt>Edition</dt><dd>{meta.edition}</dd></div>
              <div><dt>Read on</dt><dd>{meta.extracted}</dd></div>
              <div><dt>To review</dt><dd>{brand.BRAND.flags.length} items</dd></div>
            </dl>
          </div>
          <section className="pb-introsec" aria-labelledby="h-contents">
            <h2 id="h-contents" className="pb-sechead">In this guide</h2>
            <ul className="pb-toc">
              {chapters.slice(1).map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => goChapter(c.id)}>
                    <span className="pb-num">{c.num ? c.num.replace(/\.0$/, '') : '—'}</span>
                    <b>{c.title}</b>
                    <span>{c.items.map((i: any) => i.title).join(', ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="pb-introsec" aria-labelledby="h-read">
            <h2 id="h-read" className="pb-sechead">Two readings of one guideline</h2>
            <div className="pb-two">
              <div><h3>For people</h3><p>Each section shows the exhibit, the guideline’s own description, files to download and values to copy.</p></div>
              <div>
                <h3>For machines</h3>
                <p>The same section carries the rules an agent follows, the data it receives, and how each rule is known. Open “Machine reading” under a section, or turn it on for the whole guideline from the top bar.</p>
                <ul className="pb-rules">{BASIS.map((b) => <li key={b}><span>{cap(meta.basis[b])}</span><span className="pb-chips"><Chip kind={b}>{cap(b)}</Chip></span></li>)}</ul>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <header className="pb-chapter">
            {current.num ? <span className="pb-num">{current.num}</span> : null}
            <h1>{current.title}</h1>
          </header>
          {current.items.map((item: any) => (
            <GuideItem key={item.id} item={item} brand={brand} open={machine || opened.has(item.id)} side={machine} onToggle={() => toggle(item.id)} shuffle={() => setSeed((n) => n + 4)} save={save} openLayout={openLayout} openTool={goTool} pres={pres} setPres={setPres} />
          ))}
        </>
      )}
      <nav className="pb-pager" aria-label="Chapters">
        {prev ? <button type="button" onClick={() => goChapter(prev.id)}><span><ArrowLeft {...ICON} size={14} /> Previous</span><b>{prev.title}</b></button> : <span />}
        {next ? <button type="button" data-next="true" onClick={() => goChapter(next.id)}><span>Next <ArrowRight {...ICON} size={14} /></span><b>{next.title}</b></button> : <span />}
      </nav>
    </div>
  );
  return frame({ actions, rail, railLabel: 'Guideline contents', main, mainLabel: current.title, kind: 'doc' });
}
