import { useEffect, useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { normalizeHex } from "@/lib/backgroundColor";

export function BackgroundControl({ value, onChange, onReset }: { value: string; onChange: (value: string) => void; onReset: () => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const invalid = normalizeHex(draft) === null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" title="Background color"><Palette /> Background</Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64">
        <label htmlFor="background-hex" className="mb-3 block text-sm font-medium">Background color</label>
        <div className="flex items-center gap-2">
          <input aria-label="Choose background color" type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-background p-1" />
          <input id="background-hex" aria-label="Background hex code" aria-invalid={invalid} value={draft} maxLength={7} spellCheck={false}
            onChange={(e) => { setDraft(e.target.value); if (e.target.value.replace(/^#/, "").length === 6 && normalizeHex(e.target.value)) onChange(e.target.value); }}
            onBlur={() => { const hex = normalizeHex(draft); if (hex) { setDraft(hex); onChange(hex); } }}
            className="h-9 min-w-0 flex-1 rounded border border-input bg-background px-2 font-mono text-sm text-foreground" />
        </div>
        {invalid && <p className="mt-2 text-xs text-destructive">Enter a 3- or 6-digit hex color.</p>}
        <Button variant="ghost" size="sm" onClick={onReset} className="mt-3"><RotateCcw /> Reset to theme</Button>
      </PopoverContent>
    </Popover>
  );
}