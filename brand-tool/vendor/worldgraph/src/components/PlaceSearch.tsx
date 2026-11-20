import { useState } from "react";
import { placeLabel, searchPlaces, type Place } from "@/lib/places";

type Props = {
  onSelect: (p: Place) => void;
  label?: string;
  value?: string | undefined;
  onClear?: () => void;
  autoFocus?: boolean;
  onSubmit?: () => void;
};

export function PlaceSearch({ onSelect, label, value, onClear, autoFocus, onSubmit }: Props) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState(0);
  const shown = editing || !value ? q : value;
  const results = editing || !value ? searchPlaces(q) : [];
  const choose = (p: Place | undefined) => {
    if (!p) return;
    onSelect(p);
    setQ("");
    setEditing(false);
    setActive(0);
  };
  return (
    <div className="relative flex items-center gap-2">
      {label && <span className="text-muted-foreground">{label}</span>}
      <input
        autoFocus={autoFocus}
        aria-label={`${label ?? "Search"}: country, state or city`}
        role="combobox"
        aria-expanded={results.length > 0}
        value={shown}
        placeholder="Country, state or city…"
        onFocus={() => value && setEditing(true)}
        onBlur={() => setEditing(false)}
        onChange={(e) => { setEditing(true); setQ(e.target.value); setActive(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); if (results.length) choose(results[active]); else onSubmit?.(); }
          else if (e.key === "Escape" && q) { e.stopPropagation(); setQ(""); }
        }}
        className="w-52 rounded-md border border-border bg-background/60 px-3 py-1 text-sm normal-case tracking-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/40"
      />
      {value && onClear && (
        <button aria-label={`Clear ${label ?? "place"}`} onClick={onClear} className="text-muted-foreground hover:text-foreground">×</button>
      )}
      {results.length > 0 && (
        <ul role="listbox" className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-md border border-border bg-card/95 py-1 backdrop-blur">
          {results.map((p, i) => (
            <li
              key={`${p.kind}-${p.name}-${p.parent ?? ""}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); choose(p); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm normal-case tracking-normal ${i === active ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            >
              <span>{placeLabel(p)}</span>
              <span className="hud text-[10px] text-muted-foreground">{p.kind}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
