# Zach Tool UI in Lovable

Use this workflow when ChatGPT delegates work to Lovable or Lovable executes an imported copy of this skill. Keep the distinction between an available skill bundle and an integrated, verified application explicit.

## Make the complete source available

Lovable supports full skill imports through Workspace settings > Skills > Add > Upload ZIP. Import the complete package with its root `SKILL.md`, references, scripts, fonts, source components, and integration assets. The manual Name/Description/Content form installs instruction text only. A connector operation that accepts only Markdown cannot transfer this bundle's assets by itself.

The documented import limits are 50 MB for the ZIP, 10 MB unpacked, 1 MB per file, and 200 files. A single wrapping folder is accepted. Check these limits again if the package grows or import fails. Source: [Lovable skills documentation](https://docs.lovable.dev/features/skills).

Keep the native name `zach-tool-ui`. In Lovable's project chat, choose it from the `/` skill picker to invoke it explicitly; automatic use can also be enabled. Do not assume the ChatGPT `agents/openai.yaml`, a `$zach-tool-ui` mention, or a raw slash string sent through a connector creates Lovable's native skill tag. Explicitly name the workspace skill in the handoff text and verify it is available.

A dedicated Lovable Design System can provide a separate managed foundation if the user chooses that workflow. It is not required for this full-bundle import route. Do not claim that a ChatGPT skill installation created a Lovable skill, design system, or updated application.

## Before ChatGPT delegates

1. Resolve the intended Lovable workspace and project from the request and existing session evidence. Inspect the actual project when updating one. Do not send a migration to a similarly named project or another collaborator's workspace.
2. Inspect the workspace's native `zach-tool-ui` skill and bundled files, or the existing project installation and its manifest. Verify the relevant source is actually accessible. At minimum check the Graphical entry, provider/runtime, `theme.ts`, stylesheet, integration files, font, and relevant guides. Include the DialKit bridge when controls require it. Do not treat the instruction text alone as a complete source transfer.
3. If the connector cannot inspect those assets, send an inspection-only request asking Lovable to locate and report them before edits. If the source is missing, provide the full import step or an already-authorized supported file-transfer route. Do not start a visual reconstruction from memory. Continue work that does not depend on the missing assets.
4. Read existing project instructions and inspect the framework, package manager, dependencies, active UI, routes, integrations, state, renderer, and exports relevant to the requested change. Identify the current behavior to retain and any compatibility issues.
5. Pass the explicit skill name, target project, requested scope, verified source locations/version, preservation requirements, and checks. The receiving agent must read the skill and applicable source, not rely solely on a short design description.

Use the tools and identifiers actually available in the current connector. Never invent a workspace skill ID, design-system project ID, attachment, path, or successful upload. Importing the skill and invoking a project build are separate operations. Do not create a build merely to explain installation.

## Execute within the existing app

- Inspect the current implementation before changing it. Apply the user's requested pages, controls, or full UI scope while retaining auth, data/schema contracts, API behavior, routes, integrations, state, canvas/rendering behavior, downloads, exports, and intentional customizations.
- Use the installer when Python and local source are available. Otherwise follow [the application guide](application-guide.md#installation-without-python), including its exact file mapping. Copy the integration files directly into the UI directory so their relative imports resolve.
- Preserve the existing framework and dependency ranges. The bundled source uses React 19 APIs. Adapt provider syntax and refs deliberately for React 18 instead of silently upgrading the app. Add only missing compatible dependencies.
- Inspect CSS class collisions and popup/portal styling before a scoped adoption. The provider does not isolate every `.ui-*` selector. Keep the application's output artwork and data visualization colors independent from interface tokens.
- Reuse the supplied components and theme. Keep existing control callbacks and value/state contracts wired. Include DialKit only where a parameter editor helps the actual product.
- Preserve a reviewable change and the host's normal revision history. A style request does not authorize a backend migration, deletion of application functionality, or production publication.
- After integration, merge a concise pointer into project instructions or root `AGENTS.md` identifying Zach Tool UI, the actual source paths/version, scope, and behavior to preserve. Read existing instructions first. Do not replace them or change global workspace defaults just to style one project.

Workspace/project instructions provide persistent context; skills are loaded on demand. Source: [Lovable instructions documentation](https://docs.lovable.dev/features/knowledge). Record the project's installed foundation version. Later changes to the ChatGPT skill do not automatically refresh an imported Lovable skill or migrate existing projects.

## Handoff template

Replace brackets with inspected facts and the user's actual request. Omit irrelevant features rather than inventing them.

```text
Use the workspace skill zach-tool-ui and read its full instructions and relevant bundled source.
Target: [workspace/project]. Requested change: [goal and UI scope].
Source: [verified imported bundle or installed project paths and version].

Before UI edits, confirm the required source files are readable, inspect existing project
instructions, framework, dependencies, UI components, and affected behavior. If source is
missing, report the specific gap and pause dependent UI changes without approximating it.

Apply the saved theme and components within the requested scope. Preserve [actual existing
flows, state, data, integrations, rendering, exports, and customizations]. Keep framework
versions and public contracts intact; make only the compatibility adaptations needed here.
Merge a scoped project instruction pointer so future edits reuse the installed foundation.

Run the normal build/type checks and relevant existing tests. Inspect affected rendered
states at desktop and narrow sizes, including popups/modes when applicable. Exercise the
changed controls and critical existing flows. Report source/version, changed scope, actual
checks, and any unresolved compatibility or asset gaps. Do not claim unperformed checks.
```

## Verify the result

Distinguish three outcomes: the skill was imported, its foundation was integrated, and the app was verified. Inspect the actual diff/result and terminal build status before reporting completion. If the connector exposes message polling, use the returned build/message state rather than treating an accepted request as a finished build. When a check is unavailable, report its limit and the remaining verification; do not promise zero regressions from instructions alone.
