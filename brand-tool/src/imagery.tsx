// The imagery tool: for brands whose guideline describes how its imagery is generated. It builds prompts
// from the brand's own recipe (wording lifted from the guideline's example prompts and rules), keeps the
// style references to hand, lets Claude write a prompt from a plain description, and checks a result
// against the guideline before it is kept in the brand's assets.
import { useMemo, useRef, useState } from 'react';
import type { DialConfig } from 'dialkit';
import { Check, Copy, Download, ImagePlus, RotateCcw, Sparkles, Trash2, Upload } from 'lucide-react';
import { ZachDialRoot } from './components/zach-ui/ZachDialRoot';
import * as E from './engine/index.js';
import { Btn, Chip, CopyButton, CopyPanel, ICON, RailHead, RailItem, useDialKitController, type Ask, type Brand, type Params, type Save, type Tpl } from './ui';
import type { Frame } from './App';
import type { BrandFiles } from './assets';

type Option = { id: string; label: string; text: string };
type Field = { id: string; label: string; default: string; options: Option[] };
type Recipe = { order: string[]; fields: Field[]; style: string; avoid: string[]; aspects: string[]; tool: string };
export type Imagery = { generated: boolean; p: string; subject: string; always: string[]; never: string[]; method: { tool: string; steps: string[]; recommend: string }; prompts: string[]; references: string[]; recipe: Recipe };
type Tool = { id: string; name: string; use: string };

const DETAILS = { id: 'details', name: 'Details', params: { details: { type: 'textarea', label: 'Anything else in the scene', max: 90 } } } as unknown as Tpl;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function compose(r: Recipe, pick: Record<string, string>, details: string) {
  const parts = r.order.map((id) => { const f = r.fields.find((x) => x.id === id)!; return (f.options.find((o) => o.id === pick[id]) ?? f.options[0]).text; });
  const lead = parts.join(', ');
  return `${cap(lead)}.${details.trim() ? ' ' + cap(details.trim().replace(/\.$/, '')) + '.' : ''} ${r.style}.`;
}
const forMidjourney = (r: Recipe, prompt: string, ar: string) => `${prompt.trim()} --ar ${ar} --no ${r.avoid.join(', ')}`;

function writePrompt(brand: Brand, im: Imagery, ask: string, ar: string) {
  return `You write text-to-image prompts for the ${brand.name} brand, following its guideline exactly.

What the imagery is: ${im.subject}.
Always: ${im.always.join('; ')}.
Never: ${im.never.join('; ')}.
House style words: ${im.recipe.style}.

The guideline's own example prompts (match their length, plain descriptive wording, and comma-separated rhythm):
${im.prompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Request from the designer: """${ask.slice(0, 600)}"""
Aspect ratio: ${ar}.

Write one prompt for that request. Describe only what is seen: light, landscape, the people and what they are doing, distance. Do not mention brands, logos, text, screens, devices or robots, and do not use negative phrasing (the tool adds exclusions separately). If the request asks for something the guideline rules out, keep to the guideline and say so in "note".
Return JSON only: {"prompt": "...", "note": "one short sentence on how it follows the guideline, or what you changed"}`;
}

export function ImageryTool({ brand, tool, rail, frame, save, ask, files }: { brand: Brand; tool: Tool; rail: (children: React.ReactNode) => React.ReactNode; frame: Frame; save: Save; ask: Ask | null; files: BrandFiles }) {
  const im: Imagery = (brand as any).imagery;
  const r = im.recipe;
  const IMG: Record<string, string> = (window as any)[`__${brand.id.toUpperCase()}_IMG`] ?? {};
  const config = useMemo(() => ({
    recipe: Object.fromEntries(r.fields.map((f) => [f.id, { type: 'select', options: f.options.map((o) => ({ value: o.id, label: o.label })), default: f.default }])),
    output: { aspect: { type: 'select', options: r.aspects.map((a) => ({ value: a, label: a })), default: r.aspects[0] } },
  }) as unknown as DialConfig, [r]);
  const controller = useDialKitController('Imagery', config, { id: `primary-brand:${brand.id}:tool:imagery`, persist: false });
  const v: any = controller.values ?? {};
  const pick: Record<string, string> = Object.fromEntries(r.fields.map((f) => [f.id, v.recipe?.[f.id] ?? f.default]));
  const ar: string = v.output?.aspect ?? r.aspects[0];
  const [details, setDetails] = useState('');
  const recipe = compose(r, pick, details);
  const [own, setOwn] = useState<{ text: string; from: string } | null>(null);
  const prompt = own?.text ?? recipe;
  const [busy, setBusy] = useState(false);
  const [want, setWant] = useState('');
  const [note, setNote] = useState('');
  const [refs, setRefs] = useState<string[]>(im.references);
  const [result, setResult] = useState<{ url: string; file: File } | null>(null);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [keepNote, setKeepNote] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const kept = files.slot(brand, 'generated')?.files ?? [];
  const originals = files.slot(brand, 'ai-originals')?.files ?? [];
  const always = im.always, never = im.never;
  const passes = always.every((t) => ticks['a:' + t]) && !never.some((t) => ticks['n:' + t]);
  const checked = Object.keys(ticks).length > 0;

  const write = async (text: string) => {
    if (!ask) { setNote('Claude is not available on this page.'); return false; }
    setBusy(true); setNote('');
    try {
      const a = await ask.json(writePrompt(brand, im, text, ar), { cache: false });
      const p = typeof a?.prompt === 'string' ? a.prompt.trim().slice(0, 900) : '';
      if (!p) { setNote('Claude came back without a prompt. Try describing it another way.'); return false; }
      setOwn({ text: p, from: 'Claude' }); setNote(typeof a?.note === 'string' ? a.note.slice(0, 240) : '');
      return true;
    } catch { setNote('Claude could not write a prompt just now. The recipe prompt still works.'); return false; } finally { setBusy(false); }
  };
  const download = async () => {
    const list = [...refs.map((k) => ({ name: `${brand.id}-reference-${k}.jpg`, uri: IMG[k] })).filter((f) => f.uri), ...originals.map((f) => ({ name: f.name, uri: files.data(f.id) })).filter((f) => f.uri)];
    if (list.length) await save(`${brand.id}-style-references.zip`, await E.zipFiles(list));
  };
  const take = (f?: File | null) => {
    if (!f || !/^image\//.test(f.type)) { setKeepNote('That file is not an image.'); return; }
    if (result) URL.revokeObjectURL(result.url);
    setResult({ url: URL.createObjectURL(f), file: f }); setTicks({}); setKeepNote('');
  };
  const keep = async () => {
    const slot = (brand as any).slots?.find((s: any) => s.id === 'generated');
    if (!result || !slot) return;
    const err = await files.upload(brand, slot, [result.file]);
    setKeepNote(err || 'Kept in Assets, under New generations.');
  };

  const railEl = rail(
    <>
      <div className="pb-railblock pb-railblock--fill">
        <RailHead>Guideline prompts <span className="pb-count">{im.prompts.length}</span></RailHead>
        <ul className="pb-raillist">
          {im.prompts.map((p, i) => <RailItem key={i} current={own?.from === `Example ${i + 1}`} meta={`${i + 1}`} onClick={() => { setOwn({ text: p, from: `Example ${i + 1}` }); setNote(''); }}>{p.split(/[,.]/)[0]}</RailItem>)}
        </ul>
      </div>
      <p className="pb-railnote pb-railfoot">Recipe from {im.p}. Generate in {im.method.tool} with the references as a style reference.</p>
    </>,
  );

  const inspector = (
    <>
      <div className="pb-insphead">
        <div><h2>{tool.name}</h2><p>{brand.name} tool · from {im.p.split(',')[0]}</p></div>
        <Btn icon={<RotateCcw {...ICON} />} label="Reset to the default" onClick={() => { controller.resetValues(); setDetails(''); setOwn(null); setNote(''); }} />
      </div>
      <div className="pb-dials"><ZachDialRoot /></div>
      <CopyPanel t={DETAILS} title="Details" value={{ details } as Params} onChange={(_, val) => { setDetails(val); setOwn(null); }} />
      <div className="pb-inspblock">
        <span className="pb-insplabel">Write with Claude</span>
        {ask ? (
          <form className="pb-imgask" onSubmit={async (e) => { e.preventDefault(); if (want.trim() && !busy && await write(want)) setWant(''); }}>
            <textarea aria-label="Describe the image you need" rows={3} maxLength={600} value={want} placeholder="e.g. For a customer-support launch: two colleagues, late afternoon, calm" onChange={(e) => setWant(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} />
            <Btn type="submit" variant="secondary" icon={<Sparkles {...ICON} />} disabled={busy || !want.trim()}>{busy ? 'Writing…' : 'Write prompt'}</Btn>
          </form>)
          : <p className="pb-quiet">Claude is not available on this page. Build the prompt from the recipe above.</p>}
      </div>
    </>
  );

  const actions = (
    <>
      <CopyButton variant="secondary" icon={<Copy {...ICON} />} text={() => forMidjourney(r, prompt, ar)}>Copy for {r.tool}</CopyButton>
      <Btn icon={<Download {...ICON} />} onClick={download} disabled={!refs.length && !originals.length}>References</Btn>
    </>
  );

  const main = (
    <div className="pb-page pb-imgtool">
      <section className="pb-imgsec" aria-labelledby="img-prompt">
        <header className="pb-imghead"><h2 id="img-prompt">Prompt</h2><Chip kind={own ? 'check' : 'measured'}>{own ? (own.from === 'edit' ? 'Edited' : own.from) : 'From the recipe'}</Chip></header>
        <textarea className="pb-imgprompt" aria-label="Prompt" rows={5} maxLength={900} value={prompt} onChange={(e) => setOwn({ text: e.target.value, from: 'edit' })} />
        <p className="pb-imgparams"><code>--ar {ar} --no {r.avoid.join(', ')}</code> is added when you copy for {r.tool}.</p>
        {note ? <p className="pb-imgnote" role="status"><Sparkles {...ICON} /> {note}</p> : null}
        <div className="pb-rowbtns">
          <CopyButton variant="primary" icon={<Copy {...ICON} />} text={() => forMidjourney(r, prompt, ar)}>Copy for {r.tool}</CopyButton>
          <CopyButton icon={<Copy {...ICON} />} text={() => prompt.trim()}>Copy prompt only</CopyButton>
          {own ? <Btn icon={<RotateCcw {...ICON} />} onClick={() => { setOwn(null); setNote(''); }}>Back to the recipe</Btn> : null}
        </div>
      </section>

      <section className="pb-imgsec" aria-labelledby="img-refs">
        <header className="pb-imghead"><h2 id="img-refs">Style references</h2><span className="pb-quiet">{im.method.recommend}.</span></header>
        <div className="pb-imgrefs">
          {im.references.filter((k) => IMG[k]).map((k) => { const on = refs.includes(k); return (
            <button key={k} type="button" className="pb-imgref" aria-pressed={on} onClick={() => setRefs(on ? refs.filter((x) => x !== k) : [...refs, k])}>
              <img src={IMG[k]} alt="" /><span className="pb-imgtick" aria-hidden="true">{on ? <Check {...ICON} /> : null}</span><span className="pb-visually-hidden">{on ? 'Included' : 'Not included'}: reference {k}</span>
            </button>); })}
          {originals.map((f) => files.data(f.id) ? <div key={f.id} className="pb-imgref" data-static="true"><img src={files.data(f.id)} alt={f.name} /></div> : null)}
        </div>
        <div className="pb-rowbtns">
          <Btn variant="secondary" icon={<Download {...ICON} />} onClick={download} disabled={!refs.length && !originals.length}>Download {refs.length + originals.length} references</Btn>
          <span className="pb-quiet">{originals.length ? 'Includes the originals added in Assets.' : 'Captures from the guideline. Add the originals in Assets for sharper references.'}</span>
        </div>
      </section>

      <section className="pb-imgsec" aria-labelledby="img-check">
        <header className="pb-imghead"><h2 id="img-check">Check a result</h2>{result && checked ? <Chip kind={passes ? 'measured' : 'need'}>{passes ? 'On brand' : 'Not yet'}</Chip> : null}</header>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
        {!result ? (
          <button type="button" className="pb-imgdrop" onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files?.[0]); }}>
            <Upload {...ICON} /><span>Drop a generated image here, or choose one</span>
          </button>
        ) : (
          <div className="pb-imgcheck">
            <img src={result.url} alt="The image being checked" />
            <div>
              <fieldset><legend>It has</legend>{always.map((t) => <label key={t} className="pb-imgrule"><input type="checkbox" checked={!!ticks['a:' + t]} onChange={(e) => setTicks({ ...ticks, ['a:' + t]: e.target.checked })} /><span>{t}</span></label>)}</fieldset>
              <fieldset><legend>It has none of</legend>{never.map((t) => <label key={t} className="pb-imgrule" data-never="true"><input type="checkbox" checked={!!ticks['n:' + t]} onChange={(e) => setTicks({ ...ticks, ['n:' + t]: e.target.checked })} /><span>{t}</span></label>)}</fieldset>
              <p className="pb-quiet">Tick what is true. Anything under “none of” that is ticked means the image is off brand.</p>
              <div className="pb-rowbtns">
                <Btn variant="primary" icon={<ImagePlus {...ICON} />} disabled={!passes || !files.canUpload} onClick={keep}>Keep in Assets</Btn>
                <Btn icon={<Trash2 {...ICON} />} onClick={() => { URL.revokeObjectURL(result.url); setResult(null); setTicks({}); setKeepNote(''); }}>Clear</Btn>
              </div>
              {keepNote ? <p className="pb-quiet" role="status">{keepNote}</p> : !files.canUpload ? <p className="pb-quiet">{files.why}</p> : null}
            </div>
          </div>
        )}
      </section>

      {kept.length ? (
        <section className="pb-imgsec" aria-labelledby="img-kept">
          <header className="pb-imghead"><h2 id="img-kept">Kept generations</h2><span className="pb-count">{kept.length}</span></header>
          <div className="pb-imgrefs">{kept.map((f) => files.data(f.id) ? <div key={f.id} className="pb-imgref" data-static="true"><img src={files.data(f.id)} alt={f.name} /></div> : null)}</div>
        </section>
      ) : null}
    </div>
  );

  return frame({ actions, rail: railEl, railLabel: 'Tools and guideline prompts', inspector, inspectorLabel: 'Imagery recipe', main, mainLabel: 'Imagery', kind: 'doc' });
}
