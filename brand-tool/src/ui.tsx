// Shared interface parts for the Primary brand tool. Built on the saved Graphical theme (Zach Tool UI):
// Graphical Button, Input and Menu, sized down for a compact creative-tool chrome with token values only.
import { memo, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { useDialKitController, type DialConfig } from 'dialkit';
import { ArrowDown, ArrowUp, Check, ChevronDown, Moon, Plus, Sun, X } from 'lucide-react';
import { Button, Menu } from './components/zach-ui/graphical';
import * as E from './engine/index.js';

export type Params = Record<string, string | boolean | number | { x: number; y: number } | Record<string, any>[]>;
export type Brand = (typeof E.BRANDS)[number];
export type Tpl = Brand['T'][number];
export type Ask = { json: (prompt: string, opts?: object) => Promise<any> };
export type Save = (name: string, data: Blob) => Promise<void>;
export type ViewId = 'brief' | 'kickoff' | 'guideline' | 'assets' | 'make' | 'decks' | 'tools' | 'review' | 'machine' | 'publish';
// `brand` is the open project's id, which is the brand's id once the project has a brand system.
// `chapter` is a guideline chapter, the open tool in Tools, the slot to show in Assets, or the Brief's part.
export type Route = { brand: string | null; view: ViewId; chapter?: string };

export const VIEWS: { id: ViewId; name: string }[] = [
  { id: 'brief', name: 'Brief' },
  { id: 'kickoff', name: 'Kick-off' },
  { id: 'guideline', name: 'Guideline' },
  { id: 'assets', name: 'Assets' },
  { id: 'make', name: 'Make' },
  { id: 'decks', name: 'Decks' },
  { id: 'tools', name: 'Tools' },
  { id: 'review', name: 'Review' },
  { id: 'machine', name: 'Machine' },
  { id: 'publish', name: 'Publish' },
];

export const SEVERITY: Record<string, string> = { fix: 'Fix in source', need: 'Needed from you', check: 'Check', infer: 'Inferred' };
export const pageRef = (p: string | number) => (typeof p === 'number' ? `p.${p}` : p);
// A brand shows Tools only when tools have been built for it.
// A project without a brand system yet has only its Brief.
export const viewsOf = (b: Brand | null | undefined) => !b ? VIEWS.filter((v) => v.id === 'brief' || v.id === 'kickoff') : VIEWS.filter((v) => (v.id !== 'assets' || (b as any).slots?.length));
export const openCount = (b: Brand, resolved: Set<string>) => b.BRAND.flags.filter((f: any) => !resolved.has(`${b.id}:${f.id}`)).length;
export const ICON = { size: 16, strokeWidth: 1.75, 'aria-hidden': true } as const;

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    return ok;
  }
}

/* ---------- Buttons: Graphical Button at chrome size (28px, size-xs) ---------- */

type BtnProps = Omit<ComponentProps<typeof Button>, 'style'> & { icon?: ReactNode; label?: string; style?: CSSProperties; size?: 's' | 'm' };
const COMPACT: CSSProperties = { padding: 'var(--space-xxs) var(--space-s)', gap: 'calc(var(--space-xxs) * 1.5)', fontSize: 'var(--size-xs)', lineHeight: 'var(--line-s)', letterSpacing: 'var(--letter-spacing-m)' };
const MENU: CSSProperties = { fontSize: 'var(--size-xs)', lineHeight: 'var(--line-s)', letterSpacing: 'var(--letter-spacing-m)', padding: 'var(--space-xxs)', minWidth: '14rem' };
const ITEM: CSSProperties = { fontSize: 'var(--size-xs)', lineHeight: 'var(--line-s)', minHeight: 'calc(var(--space-l) + var(--space-xxs))', padding: '0 var(--space-xs)', gap: 'var(--space-xs)' };
const ICON_ONLY: CSSProperties = { ...COMPACT, padding: 'var(--space-xxs)' };

// A button with an optional leading icon. An icon-only button needs `label`, which becomes its name and tooltip.
export function Btn({ icon, label, children, variant = 'ghost', style, size = 's', ...props }: BtnProps) {
  const only = !children && !!icon;
  const base = size === 'm' ? { ...COMPACT, padding: 'calc(var(--space-xxs) * 1.5) var(--space-s)' } : only ? ICON_ONLY : COMPACT;
  // With an icon, the text sits in its own span so narrow screens can show the icon alone; the name stays.
  const named = only ? label : icon && typeof children === 'string' ? children : undefined;
  return (
    <Button variant={variant} aria-label={named} title={only ? label : undefined} style={{ ...base, ...style }} {...props}>
      {icon}{icon && children ? <span className="pb-btn-label">{children}</span> : children}
    </Button>
  );
}

export function CopyButton({ text, children, icon, variant = 'ghost', label }: { text: () => string; children?: ReactNode; icon?: ReactNode; variant?: BtnProps['variant']; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Btn
      variant={variant}
      label={label}
      icon={done && icon ? <Check {...ICON} /> : icon}
      onClick={async () => { if (await copyText(text())) { setDone(true); setTimeout(() => setDone(false), 1200); } }}
    >
      {children ? (done ? 'Copied' : children) : null}
    </Btn>
  );
}

export const Html = ({ html, className, cols }: { html: string; className?: string; cols?: number }) => (
  <div className={className} data-cols={cols} dangerouslySetInnerHTML={{ __html: html }} />
);
export const Chip = ({ kind, children }: { kind: string; children: ReactNode }) => <span className="pb-chip" data-kind={kind}>{children}</span>;

/* ---------- Menus: Graphical Menu (Base UI) ---------- */

export function MenuButton({ trigger, label, children, align = 'start', className, disabled }: { trigger: ReactNode; label: string; children: ReactNode; align?: 'start' | 'end'; className?: string; disabled?: boolean }) {
  return (
    <Menu.Root>
      <Menu.Trigger className={`pb-menutrigger ${className ?? ''}`} aria-label={label} style={COMPACT} disabled={disabled}>
        {trigger}<ChevronDown {...ICON} size={14} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align={align} className="pb-menu-pos">
          <Menu.Popup className="pb-menu" style={MENU}>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
export function MenuItem({ children, onClick, current, hint }: { children: ReactNode; onClick: () => void; current?: boolean; hint?: ReactNode }) {
  return (
    <Menu.Item className="pb-menuitem" style={ITEM} data-current={current ? 'true' : undefined} onClick={onClick}>
      <span className="pb-menuitem-main">{children}</span>
      {hint !== undefined ? <span className="pb-menuitem-hint">{hint}</span> : null}
      {current ? <Check {...ICON} size={14} /> : null}
    </Menu.Item>
  );
}
export const MenuSeparator = () => <Menu.Separator className="pb-menusep" />;
export const MenuLabel = ({ children }: { children: ReactNode }) => <div className="pb-menu-label" role="presentation">{children}</div>;

/* ---------- Size: every size the layout is drawn for, from the shared list ---------- */

const FAMILY_WORDS = (fs: string[]) => { const n = fs.map((f) => E.FAMILIES[f]?.name.toLowerCase() ?? f); return n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : n[0]; };
export function SizePicker({ t, value, onChange }: { t: Tpl; value: string; onChange: (id: string) => void }) {
  const f: any = t.params.format;
  if (!f) return null;
  const ids = Object.keys(f.options);
  const cur = E.SIZE_BY[value];
  const [w, h] = f.options[value] ?? [];
  return (
    <div className="pb-inspblock pb-inspblock--tight pb-size">
      <span className="pb-insplabel">Size</span>
      <MenuButton className="pb-deckpick" label="Size" trigger={<span className="pb-layoutpick-name">{cur ? cur.name : value}<span className="pb-size-dims">{w}×{h}</span></span>}>
        {(E.GROUPS as string[]).map((g, gi) => {
          const items = ids.filter((id) => E.SIZE_BY[id]?.group === g);
          return items.length ? (
            <div key={g} role="group" aria-label={g}>
              {gi ? <MenuSeparator /> : null}
              <MenuLabel>{g}</MenuLabel>
              {items.map((id) => { const z = E.SIZE_BY[id]; return <MenuItem key={id} current={id === value} hint={`${z.w}×${z.h}`} onClick={() => onChange(id)}>{z.name}</MenuItem>; })}
            </div>
          ) : null;
        })}
      </MenuButton>
      <p className="pb-quiet">Drawn for {FAMILY_WORDS(f.families ?? [])} sizes{cur?.mm ? ` · prints at ${cur.mm[0]}×${cur.mm[1]} mm, ${cur.dpi ?? 300} dpi` : ''}.{f.dropped?.length ? ` ${f.dropped.length} more ${f.dropped.length === 1 ? 'is' : 'are'} left out because the smallest type would fall under ${f.dropped.some((id: string) => E.SIZE_BY[id]?.mm) ? '6 pt in print or ' : ''}12 px on screen.` : ''}</p>
    </div>
  );
}

/* ---------- Colour mode: follows the system until the viewer picks one ---------- */

const THEME_KEY = 'primary-brand-theme';
export function initTheme() {
  try { const t = localStorage.getItem(THEME_KEY); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch { /* system theme */ }
}
export function ThemeToggle({ mode }: { mode: 'light' | 'dark' }) {
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <Btn
      icon={mode === 'dark' ? <Sun {...ICON} /> : <Moon {...ICON} />}
      label={`Switch to ${next} mode`}
      onClick={() => { document.documentElement.dataset.theme = next; try { localStorage.setItem(THEME_KEY, next); } catch { /* this visit only */ } }}
    />
  );
}

/* ---------- Prompt bar: the one place to ask Claude, docked at the foot of a canvas ---------- */

export function PromptBar({ placeholder, busy, note, onSubmit, multiline = false, label }: { placeholder: string; busy: boolean; note: string; onSubmit: (text: string) => Promise<boolean>; multiline?: boolean; label: string }) {
  const [text, setText] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    if (await onSubmit(text.trim())) setText('');
  };
  const Field = multiline ? 'textarea' : 'input';
  return (
    <form className="pb-prompt-bar" onSubmit={submit} aria-label={label}>
      {note ? <p className="pb-prompt-note" role="status">{note}</p> : null}
      <div className="pb-prompt-field">
        <Field
          className="pb-prompt-input"
          aria-label={label}
          value={text}
          placeholder={placeholder}
          rows={multiline ? 1 : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setText(e.target.value)}
        />
        <Btn type="submit" variant="primary" icon={busy ? <span className="pb-spin" aria-hidden="true" /> : <ArrowUp {...ICON} />} label={busy ? 'Drafting' : 'Draft with Claude'} disabled={busy || !text.trim()} />
      </div>
    </form>
  );
}

/* ---------- Layouts and slides drawn at their real size, scaled to the width they are given ---------- */

export const slideTitle = (t: Tpl, p: Params) => {
  const first = Object.entries<any>(t.params).find(([, d]) => d.type === 'text' || d.type === 'textarea');
  const text = first ? String(p[first[0]] ?? '').replace(/\s+/g, ' ').trim() : '';
  return text ? `${t.name}: ${text.slice(0, 60)}` : t.name;
};

export const SlideView = memo(function SlideView({ t, p, label }: { t: Tpl; p: Params; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(p);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const [w, h] = E.sizeOf(t, p);
    el.style.aspectRatio = `${w} / ${h}`;
    el.innerHTML = E.tplHTML(t, p);
    if (t.live?.(p)) E.mountWG();
    E.mountLive(el);
    const child = el.firstElementChild as HTMLElement;
    const fit = () => { child.style.transform = `scale(${el.clientWidth / w})`; };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [t, key]);
  return <div className="pb-slide" ref={box} role="img" aria-label={label} />;
}, (a, b) => a.t === b.t && a.label === b.label && JSON.stringify(a.p) === JSON.stringify(b.p));

/* ---------- DialKit mapping: a layout's declared dials become one grouped panel ---------- */

const GROUP_OF: Record<string, string> = { format: 'layout', shape: 'layout', backdrop: 'globe', graphic: 'globe', frame: 'layout', layout: 'layout', photo: 'layout', tone: 'colour', accent: 'colour', graph: 'globe', facing: 'globe', distance: 'globe', spin: 'globe', labels: 'globe', motion: 'globe', texture: 'surface' };
const GROUP_ORDER = ['slide', 'copy', 'layout', 'colour', 'globe', 'surface'];
// The globe or backdrop choice sits in the same group as Motion, since Motion changes what it shows.
// DialKit labels a control from its key, so the key is the layout's own label in camelCase.
const dialKey = (label: string) =>
  label.replace(/\s*[(,:].*$/, '').trim().split(/\s+/).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('');

export function dialSetup(t: Tpl, brand: Brand, saved: Params = {}) {
  const groups: Record<string, Record<string, unknown>> = {};
  const paths: Record<string, [string, string]> = {};
  for (const [key, spec] of Object.entries<any>(t.params)) {
    if (isCopy(spec)) continue; // Copy and lists are edited in the Copy section, not in DialKit.
    if (key === 'format') continue; // Sizes have their own picker, grouped by where they are used.
    if (spec.type === 'data') continue; // Carried in from a tool; shown as a note, not a dial.
    // A slide's panel starts from its saved values instead of the layout's samples.
    const d = saved[key] === undefined || spec.type === 'pad' ? spec : { ...spec, default: saved[key] };
    const text = d.type === 'text' || d.type === 'textarea';
    const group = GROUP_OF[key] ?? (text ? 'copy' : 'layout');
    const dk = dialKey(d.label);
    paths[key] = [group, dk];
    (groups[group] ??= {})[dk] = text
      ? { type: 'text', default: d.default }
      : d.type === 'toggle'
        ? d.default
        : d.type === 'range'
          ? [d.default, d.min, d.max, d.step]
          : d.type === 'pad'
            ? { type: 'pad', x: d.x, y: d.y, labels: d.labels }
            : d.type === 'tone'
              ? { type: 'select', options: d.options.map((o: string) => ({ value: o, label: brand.TONES[o].name })), default: d.default }
              : { type: 'select', options: Object.keys(d.options), default: d.default };
  }
  const config = Object.fromEntries(GROUP_ORDER.filter((g) => groups[g]).map((g) => [g, groups[g]])) as DialConfig;
  return { config, paths };
}
export const fromDial = (paths: Record<string, [string, string]>, values: any): Params =>
  Object.fromEntries(Object.entries(paths).map(([key, [g, dk]]) => [key, values?.[g]?.[dk]]).filter(([, v]) => v !== undefined));
export function toDial(paths: Record<string, [string, string]>, params: Params) {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(params)) if (paths[key]) (out[paths[key][0]] ??= {})[paths[key][1]] = value;
  return out;
}
export { useDialKitController };

/* ---------- Layout: top bar plus up to three panels ---------- */

export function Panel({ as: Tag = 'div', className = '', children, label, id }: { as?: 'div' | 'nav' | 'aside' | 'main' | 'section'; className?: string; children: ReactNode; label?: string; id?: string }) {
  return <Tag id={id} className={`pb-panel ${className}`} aria-label={label}>{children}</Tag>;
}
export const RailHead = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="pb-railhead"><h2>{children}</h2>{action}</div>
);
export function RailItem({ children, meta, current, onClick, lead }: { children: ReactNode; meta?: ReactNode; current?: boolean; onClick: () => void; lead?: ReactNode }) {
  return (
    <li>
      <button type="button" className="pb-railitem" aria-current={current ? 'true' : undefined} onClick={onClick}>
        {lead !== undefined ? <span className="pb-railitem-lead">{lead}</span> : null}
        <span className="pb-railitem-main" title={typeof children === 'string' ? children : undefined}>{children}</span>
        {meta !== undefined ? <span className="pb-railitem-meta">{meta}</span> : null}
      </button>
    </li>
  );
}

/* Copy fields grow with their text. Browsers without CSS field-sizing get the same result here. */
export function useFitCopyFields() {
  useLayoutEffect(() => {
    if (CSS.supports('field-sizing', 'content')) return;
    const fit = (el: HTMLTextAreaElement) => {
      el.style.setProperty('height', 'auto', 'important');
      el.style.setProperty('height', `${el.scrollHeight}px`, 'important');
    };
    const all = () => document.querySelectorAll<HTMLTextAreaElement>('.pb-insp .dialkit-text-input:not([aria-hidden])').forEach(fit);
    const onInput = (e: Event) => { const t = e.target as HTMLElement; if (t.matches?.('.pb-insp .dialkit-text-input')) fit(t as HTMLTextAreaElement); };
    const observer = new MutationObserver(() => requestAnimationFrame(all));
    observer.observe(document.body, { childList: true, subtree: true });
    addEventListener('input', onInput, true);
    addEventListener('resize', all);
    all();
    return () => { observer.disconnect(); removeEventListener('input', onInput, true); removeEventListener('resize', all); };
  }, []);
}

/* Escape always closes an open DialKit dropdown: DialKit closes on an outside press, so send it one. */
export function useDropdownEscape() {
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelector('.dialkit-select-dropdown');
      if (!open) return;
      const trigger = document.querySelector<HTMLElement>('.dialkit-select-trigger[data-open="true"]');
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      trigger?.focus({ preventScroll: true });
    };
    addEventListener('keydown', onKey, true);
    return () => removeEventListener('keydown', onKey, true);
  }, []);
}

/* ---------- Copy: text and lists, edited as content with the layout's own limits ---------- */

export const isCopy = (d: any) => d.type === 'text' || d.type === 'textarea' || d.type === 'list';
export const copyKeys = (t: Tpl) => Object.keys(t.params).filter((k) => isCopy((t.params as any)[k]));
// Settings carried in from a tool (the Glass tool's values) ride along with a layout's params but have no dial.
export const pickData = (t: Tpl, params: Params): Params => Object.fromEntries(Object.entries<any>(t.params).filter(([k, d]) => d.type === 'data' && params?.[k] != null).map(([k]) => [k, params[k]]));
export function DataPanel({ t, value, onClear }: { t: Tpl; value: Params; onClear: (k: string) => void }) {
  const live = Object.entries<any>(t.params).filter(([k, d]) => d.type === 'data' && value[k] != null).map(([k, d]) => [k, d, d.about ? d.about(value[k], value) : 'Set in a tool.'] as const).filter(([, , about]) => about);
  if (!live.length) return null;
  return (
    <>{live.map(([k, d, about]) => (
      <div key={k} className="pb-inspblock pb-datanote">
        <h3 className="pb-insplabel">{d.label}</h3>
        <p className="pb-quiet">{about}</p>
        <Btn variant="secondary" onClick={() => onClear(k)}>{d.clearLabel ?? 'Use the guideline’s values'}</Btn>
      </div>
    ))}</>
  );
}
export const pickCopy = (t: Tpl, params: Params): Params => Object.fromEntries(copyKeys(t).map((k) => [k, params[k]]).filter(([, v]) => v !== undefined));
const short = (label: string) => label.replace(/\s*[(,:].*$/, '');

function Count({ n, max }: { n: number; max: number }) {
  return <span className="pb-count" data-near={n >= max * 0.9 ? 'true' : undefined} aria-label={`${n} of ${max} characters`}>{n}/{max}</span>;
}
// One piece of copy. The limit is the layout's own: typing stops there rather than breaking the layout.
export function TextField({ id, label, value, max, multiline, hint, onChange, compact }: { id: string; label: string; value: string; max: number; multiline?: boolean; hint?: string; onChange: (v: string) => void; compact?: boolean }) {
  const Field = multiline ? 'textarea' : 'input';
  return (
    <div className="pb-field" data-compact={compact ? 'true' : undefined}>
      <label className="pb-field-head" htmlFor={id}><span>{label}</span><Count n={value.length} max={max} /></label>
      <Field id={id} className="pb-field-input" value={value} maxLength={max} placeholder={hint} rows={multiline ? 1 : undefined}
        onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => onChange(e.target.value.slice(0, max))} />
    </div>
  );
}

function ListField({ k, d, items, all, onChange }: { k: string; d: any; items: any[]; all: Params; onChange: (v: any[]) => void }) {
  const cols: string[] = d.cellsFrom ? ((all[d.cellsFrom] as any[]) ?? []).map((c: any, i: number) => c.name || `Column ${i + 1}`) : [];
  const fields = d.cellsFrom ? cols.map((name, i) => ({ key: i, label: name, max: i === 0 ? d.firstMax ?? d.cellMax : d.cellMax })) : d.fields.map((f: any) => ({ ...f, label: (f.labelFrom && String(all[f.labelFrom] ?? '').trim()) || f.label }));
  const noun = d.item ?? 'item', full = items.length >= d.max, least = items.length <= (d.min ?? 0);
  const blank = (group = false) => (d.cellsFrom ? (group ? { group: true, cells: [''] } : { cells: cols.map(() => '') }) : Object.fromEntries(d.fields.map((f: any) => [f.key, ''])));
  const set = (i: number, key: string | number, v: string) => onChange(items.map((it, j) => (j !== i ? it : d.cellsFrom ? { ...it, cells: Object.assign([...(it.cells ?? [])], { [key]: v }) } : { ...it, [key]: v })));
  const move = (i: number, by: number) => { const next = [...items]; [next[i], next[i + by]] = [next[i + by], next[i]]; onChange(next); };
  const add = (group = false) => !full && onChange([...items, blank(group)]);
  return (
    <fieldset className="pb-list">
      <legend className="pb-field-head"><span>{short(d.label)}</span><span className="pb-count" aria-label={`${items.length} of up to ${d.max}`}>{items.length} of {d.max}</span></legend>
      <ol className="pb-list-items">
        {items.map((it, i) => (
          <li key={i} className="pb-list-item" data-group={it.group ? 'true' : undefined}>
            <div className="pb-list-itemhead">
              <span className="pb-list-n">{it.group ? 'Group heading' : `${noun[0].toUpperCase() + noun.slice(1)} ${items.slice(0, i + 1).filter((x) => !x.group).length}`}</span>
              <span className="pb-list-actions">
                <Btn icon={<ArrowUp {...ICON} size={14} />} label={`Move ${noun} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)} />
                <Btn icon={<ArrowDown {...ICON} size={14} />} label={`Move ${noun} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)} />
                <Btn icon={<X {...ICON} size={14} />} label={`Remove ${noun} ${i + 1}`} disabled={least} onClick={() => onChange(items.filter((_, j) => j !== i))} />
              </span>
            </div>
            <div className="pb-list-fields">
              {(it.group ? [{ key: 0, label: 'Heading', max: d.firstMax ?? d.cellMax }] : fields).map((f: any) => {
                const v = String((d.cellsFrom ? it.cells?.[f.key] : it[f.key]) ?? '');
                return <TextField key={f.key} id={`pb-${k}-${i}-${f.key}`} label={f.label} value={v} max={f.max} hint={f.hint} multiline={f.max > 24} compact={f.max <= 12} onChange={(nv) => set(i, f.key, nv)} />;
              })}
            </div>
          </li>
        ))}
      </ol>
      <div className="pb-list-foot">
        <Btn icon={<Plus {...ICON} size={14} />} variant="secondary" disabled={full} onClick={() => add()}>Add {noun}</Btn>
        {d.groups ? <Btn icon={<Plus {...ICON} size={14} />} disabled={full} onClick={() => add(true)}>Add group heading</Btn> : null}
        <span className="pb-list-limit" role={full ? 'status' : undefined}>{full ? `This layout holds ${d.max} ${noun}s at most` : d.min ? `${d.min} to ${d.max} ${noun}s` : `Up to ${d.max}`}</span>
      </div>
    </fieldset>
  );
}

// Every text and list param of a layout, in the layout's order. `value` is the sanitized params, so lists are arrays.
export function CopyPanel({ t, value, onChange, title = 'Copy' }: { t: Tpl; value: Params; onChange: (key: string, v: any) => void; title?: string }) {
  const keys = copyKeys(t);
  if (!keys.length) return null;
  return (
    <section className="pb-copy" aria-label={title}>
      <h3 className="pb-copy-head">{title}</h3>
      {keys.map((k) => {
        const d: any = (t.params as any)[k];
        return d.type === 'list'
          ? <ListField key={k} k={k} d={d} items={(value[k] as any[]) ?? []} all={value} onChange={(v) => onChange(k, v)} />
          : <TextField key={k} id={`pb-${t.id}-${k}`} label={short(d.label)} value={String(value[k] ?? '')} max={d.max} multiline={d.type === 'textarea'} onChange={(v) => onChange(k, v)} />;
      })}
    </section>
  );
}
