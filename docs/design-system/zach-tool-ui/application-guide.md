# Apply Zach Tool UI

## Contents

- Source ownership and default choices
- React integration
- Installation without Python
- Asset fidelity
- Different project environments
- Versioning and boundaries

## Source ownership and default choices

System version: 1.0.0. Source: Zach's uploaded `untitled-theme.zip`, captured November 6, 2026. Preserve that archive's theme and runtime in `assets/untitled-theme`; the manifest records every original file's hash.

Use the saved theme for the tool interface. Use DialKit for sophisticated live parameter controls where appropriate. Preserve the flexibility to compose an application-specific workspace. The theme does not determine the art direction of generated images, fonts, scenes, or client assets.

The snapshot defines:

| Foundation | Saved choice |
| --- | --- |
| UI, brand, editorial, data font | Inter, registered as `Sidebar Inter` |
| Weights | 400, 500, 700 |
| Text sizes | 10, 12, 14, 16, 24, 36, 48 px, with authored line heights |
| Spacing | 0, 4, 8, 12, 16, 24, 32, 48 px |
| Corner tokens | 0, 4, 8, 12, 24, 36, full |
| Button radius | Small, 8 px |
| Palette | Monochrome neutral ramps in light and dark |
| Status | Monochrome; use text/shape cues |
| Elevation | Authored shadow opacities are zero |
| Small motion | 150 ms, cubic Bézier 0.2/0.8/0.2/1 |
| Large motion | 300 ms, cubic Bézier 0.16/1/0.3/1 |
| Icons | Central, outlined; licensed artwork not supplied |

These are observations of the original source. Read its exact effective assignments for each component. The multiple control sizes and states should remain available; do not reduce the whole interface to one radius or one text size.

## React integration

The bootstrap script defaults to `src/components/zach-ui` for runtime files and `design-system/zach-tool-ui` for documentation. It preserves existing files and refuses conflicting writes. Its preview is not a permission gate; apply it autonomously when the user's build request authorizes the integration.

The original source guides use project-root-relative terminology. In a bootstrapped application, resolve their `GUI.md` and `gui/` references from the generated documentation directory and their component source from the manifest's `ui_directory`. Read the generated `APPLY.md` for the actual paths. The archived Graphical workflows remain supporting references under `source-workflows/`.

Typical stylesheet order at the app's global entry:

```tsx
import './components/zach-ui/fonts.css';
import './components/zach-ui/graphical/styles.css';
import 'dialkit/styles.css';
import './components/zach-ui/dialkit-theme.css';
import './components/zach-ui/layout.css';
```

Adjust the paths to the actual entry. Skip DialKit imports when there are no DialKit controls, and skip the layout stylesheet when not using the bundled frame.

Wrap the requested scope with `GraphicalProvider document={theme} colorMode={mode}` using public exports from `graphical/index.ts`. Use that same mode for the DialKit bridge. Standard controls, tokens, resolver, stylesheet, and provider are a coherent unit. Do not install only a CSS palette and keep unrelated component defaults.

For a scoped adoption, inspect existing class names before importing the stylesheet. The source reset is scoped, but component selectors such as `.ui-button` are global class names and can collide with an existing library. A provider alone does not isolate CSS. Contain or namespace confirmed collisions in the receiving project while preserving the original saved snapshot, including corresponding portal classes. The DialKit bridge assumes one shared DialKit visual theme at a time; inspect an existing DialKit installation before introducing a second root or competing theme.

Use the exported `Button`, `Input`, `SelectField`, `ComboboxField`, and compound component namespaces as documented in the source. Pass real callbacks, values, labels, and refs. Mount interactive code in a client component when the framework requires it.

The original source uses React 19's context-provider syntax and ref APIs. A React 18 project needs explicit adaptation, including provider syntax and ref forwarding where required. Preserve the host's installed versions and lockfile; a theme request is not authorization for an unsolicited framework migration. Treat Base UI 1.7 and the tested dependency set as compatibility evidence, not compulsory version replacements.

The starter frame provides optional navigation, toolbar, inspector, and status areas. Keep only the areas needed by the task. Use one coherent scroll model, allow content to shrink with `min-width: 0`, and keep primary interactions accessible at narrower widths. A generator can use a live preview and inspector; a canvas can use contextual editing; a workspace can use lists, navigation, and details. Their shared visual values remain unchanged.

## Installation without Python

If the host exposes imported skill files through its own tools instead of a local directory, resolve this bundle there. ChatGPT's filesystem paths are not paths in another application. When Python is unavailable, reproduce the installer's file plan through supported file operations using the original contents:

| Bundled source | Project destination |
| --- | --- |
| `assets/untitled-theme/components/graphical/` | `<ui-dir>/graphical/` |
| Files inside `assets/integration/` | `<ui-dir>/` |
| `assets/fonts/` | `<ui-dir>/fonts/` |
| `assets/untitled-theme/GUI.md` and `gui/` | `<docs-dir>/GUI.md` and `<docs-dir>/gui/` |
| `assets/untitled-theme/skills/` | `<docs-dir>/source-workflows/` |
| Relevant `references/` guides and `assets/licenses/` | `<docs-dir>/` and `<docs-dir>/licenses/` |

The defaults are `src/components/zach-ui` and `design-system/zach-tool-ui`. Integration files belong directly in the UI directory: their `./graphical` imports and the `./fonts/InterVariable.woff2` font URL depend on this layout. Preserve binary files without text conversion. Confirm every destination stays inside the project. Keep identical existing files; inspect and merge differing files within the requested scope instead of overwriting customizations. Preserve source licenses.

Read `scripts/install_foundation.py` from the skill for its exact manifest and `APPLY.md` fields. Record the foundation version, original source hash from `references/theme-provenance.json`, actual paths, and any host compatibility adaptations. Merge the project pointer into existing instructions. If source files cannot be read or copied, report the specific missing access before changing dependent UI.

## Asset fidelity

Inter Variable is included under the SIL Open Font License, downloaded from the official rsms/inter source. The local stylesheet uses the user's exact alias. Source and license URLs:

- https://github.com/rsms/inter
- https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/InterVariable.woff2
- https://raw.githubusercontent.com/rsms/inter/master/LICENSE.txt

Central's licensed artwork was not in the upload. The Graphical source includes an `IconRendererProvider` adapter and can mark unresolved icons with `data-icon-fallback`. Preserve that distinction. Obtain supplied licensed artwork when needed; use a replacement only when already authorized or explicitly chosen. Do not confuse DialKit's built-in functional glyphs with the selected application icon family.

The original Graphical build, conversion, and audit guidance is preserved with the source. Their entry files are stored as `WORKFLOW.md` with unchanged contents so they remain supporting references inside this single personal skill. The provenance manifest records the mapping from the original filenames. Read these workflows and their supporting references for a deeper conversion or drift audit when needed.

## Different project environments

- **ChatGPT/Sites:** follow the host's project and hosting workflow. Apply these assets after the host creates or checks out the project. Keep the actual starter files accessible to the build.
- **Cursor/Codex:** use the runtime files and the generated project instruction pointer. A global preference alone does not import source into a new project.
- **Lovable:** import the complete skill package through Workspace settings > Skills > Add > Upload ZIP. Read [the Lovable handoff](lovable-handoff.md) for source verification, delegation, and existing-project safeguards. This ChatGPT installation does not install the skill in Lovable automatically. A separate native Lovable Design System is optional; a full skill import already carries the bundled source. Preserve the user's chosen workspace and project scope.
- **Figma:** use the saved tokens and component specifications as the design source, then use the relevant Figma skills and tooling. Do not claim code synchronization from a Figma reference alone.
- **Other web frameworks:** DialKit has framework adapters, but the bundled Graphical code remains React. Port tokens and component behavior deliberately using the host's primitives; preserve existing architecture and report fidelity differences.

## Versioning and boundaries

Keep one authoritative system. Record the foundation version in the generated manifest. Promote repeated improvements into the shared component or guidance when the user asks to update the skill. Do not silently replace the saved original snapshot with an application's temporary experiments.

Saved parameter presets store control values; they are not a substitute for document persistence, asset storage, undo history, or server saves. Keep the app's actual state and persistence architecture intact.

The theme's high fidelity should be checked in rendered states. Use the original `gui/verification.md` and the relevant component specifications when a particular control drifts. Read only the specifications needed for the actual task.
