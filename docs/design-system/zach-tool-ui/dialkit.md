# DialKit integration

## Contents

- Verified source and scope
- Controls and state
- Root placement and theming
- Saved versions and persistence
- Motion and framework adapters

## Verified source and scope

Checked November 6, 2026 against the official site and the installed npm package `dialkit@2.1.0`. Use the installed package's declarations as the API authority for an existing app. Recheck official sources when upgrading or using an unfamiliar feature.

- Agent guide: https://www.dialkit.dev/agent
- Source: https://github.com/joshpuckett/dialkit
- API: https://github.com/joshpuckett/dialkit/blob/main/docs/reference.md
- Timeline: https://github.com/joshpuckett/dialkit/blob/main/docs/timeline.md
- License: MIT, retained in `assets/licenses/dialkit-LICENSE.txt`.

The source controls support live editing. A library does not connect a parameter to the application's renderer by itself. Bind every returned value to actual application behavior and verify the result.

## Controls and state

React exports `useDialKit`, `useDialKitController`, `DialRoot`, `DialTimeline`, and `useDialTimeline`. Use `satisfies DialConfig` for an extracted configuration so tuples and discriminated control types retain useful inference.

| Capability | Definition | Result/use |
| --- | --- | --- |
| Numeric slider | `[default, min, max, step?]` | Number; choose units and useful bounds |
| Toggle | Boolean | Boolean |
| Text | String or `{ type: 'text', default, placeholder }` | String; multiline Enter inserts a line break |
| Select | `{ type: 'select', options, default }` | Selected string |
| Color | CSS color string or `{ type: 'color', default }` | CSS color string |
| Image | `{ type: 'image', options?, default? }` | URL/data URL; empty string when removed |
| XY pad | `{ type: 'pad', x: [d,min,max,step], y: [...], labels }` | `{ x, y }` |
| Spring | `{ type: 'spring', visualDuration, bounce }` | Transition config |
| Easing | `{ type: 'easing', duration, ease: [x1,y1,x2,y2] }` | Transition config |
| Action | `{ type: 'action', label }` | Calls `onAction(path)` |
| Folder | Nested object, optional `_collapsed: true` | Nested values; metadata is omitted at runtime |

Use the controller when code must reset or update controls:

```tsx
import { useDialKitController, type DialConfig } from 'dialkit';

const config = {
  geometry: {
    radius: [12, 0, 48, 1],
    position: {
      type: 'pad',
      x: [0, -100, 100, 1],
      y: [0, -100, 100, 1],
      labels: { x: 'Horizontal', y: 'Vertical' },
    },
  },
} satisfies DialConfig;

// Call inside a component; connect controller.values to its actual output.
const controller = useDialKitController('Geometry', config, {
  id: 'my-tool:document-id:geometry:v1',
  persist: false,
});
// Supported: controller.setValue(path, value), setValues(partial),
// resetValues(), setOpen(boolean), getOpen(), and getValues().
```

The numeric interaction supports dragging and typed entry. Pads support independent axis limits, Shift axis locking, and double-click reset. Color handling supports CSS formats beyond hex; preserve the actual returned string rather than truncating all values to six-digit hex. Inspect and test the installed control's commit and dismissal behavior before promising an app-specific editing contract.

Known 2.1.0 behavior: Enter in the popup's CSS-color field accepts the value but leaves the picker open; Escape or an outside interaction dismisses it. If the requested app needs Enter to apply and close, implement that at a supported, locally controlled editor boundary and verify it. Do not describe the bundled theming bridge as changing this native behavior, and do not add a document-wide Enter/Escape interception to conceal the difference.

Live color changes have already reached `onChange`; Escape dismisses the popup without rolling those changes back. The parser accepts concrete hex/RGB/HSL/OKLCH/Display P3 values, not arbitrary named colors, CSS variables, calculations, or relative-color expressions. Resolve theme values to literal colors before using them as a color-control default. Pad Y increases upward; translate deliberately into a renderer whose Y axis increases downward.

## Root placement and theming

Mount a single root for ordinary panels. `DialRoot` 2.1.0 accepts `position`, `defaultOpen`, `mode`, `theme`, `productionEnabled`, `versions`, and `onOpenChange`. It does not accept arbitrary `className` or `style` props. Use the bundled `ZachDialRoot` and its CSS bridge; do not invent unsupported props.

Use inline mode inside an app inspector as the default for finished tools. Set production visibility explicitly. Framework roots otherwise hide the editor in production; hiding the UI does not remove the live-value bindings. Prefer `versions='menu'` for a compact inspector; use thumbnail comparisons when the task benefits from them.

For a development-only tuner, conditionally mount a separate component that owns both its hook and its root; keep hooks unconditional within that component. The production flag is UI visibility, not an authorization or data boundary. If the build environment cannot be detected, the library may default to visible, so make the intended behavior explicit.

The bridge reads the active Graphical document, maps the actual resolved tokens into DialKit variables, and applies typography/surface rules to DialKit's roots and popups. Import its stylesheet after DialKit's stylesheet. Preserve its global portal reach within the single shared DialKit theme; a wrapper div alone cannot carry CSS through every portal.

Keep color swatches, image previews, graph encodings, and animation output functional. Apply visual overrides to control chrome, not to every background or SVG stroke indiscriminately. Avoid rebuilding DialKit's behavior solely to imitate its appearance.

## Saved versions and persistence

Persistence defaults to false. A stable panel ID can retain values across component mounts. When persistence is needed, the supported shape includes `{ key, storage: 'localStorage' | 'sessionStorage', presets }`. Namespace keys by app/document and schema version, and handle migrations intentionally.

`persist: false` disables browser-storage persistence, not in-memory snapshot reuse under the same ID. `resetValues()` restores configured defaults and clears the active preset selection; it does not delete saved presets or clear the storage key. Keep large image data URLs out of persisted control snapshots and manage assets separately.

DialKit saved versions are parameter presets. Copying values puts settings and guidance on the clipboard; it does not modify source code or save the application's document. Image uploads stay local in the browser. Keep asset persistence and actual project saving in the host app.

Verify reload and reset if enabling persistence. Avoid broad global shortcuts that conflict with editing or canvas gestures.

## Motion and framework adapters

The saved Graphical interface durations are milliseconds; Motion/DialKit transition durations use seconds. Convert units explicitly. Keep content motion tuning separate from the stable UI motion tokens. Honor reduced motion for interface animation.

Use a timeline only when the product needs timing or sequence editing. Its root is separate from the ordinary control root. Timeline values must be connected to the animation's current output. Removing the editor after tuning requires replacing those live sampled bindings with the intended production animation.

DialKit provides React, Solid, Svelte, Vue, and vanilla adapters. Their reactive value access and style setup differ. Check the official adapter guide before use. The bundled Graphical components and this skill's working bridge are React implementations; port their visual contract deliberately for other frameworks rather than adding an unsolicited React app.
