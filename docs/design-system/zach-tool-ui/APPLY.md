# Zach Tool UI in this project

Use Zach Tool UI 1.0.0 for new tool UI within the user's requested scope.

- Runtime source: `src/components/zach-ui/graphical/index.ts`
- Exact saved theme: `src/components/zach-ui/graphical/theme.ts`
- Integration: `src/components/zach-ui/ZachDialRoot.tsx` and `ToolFrame.tsx`
- Working example: `src/components/zach-ui/FoundationExample.tsx`
- Application guide: `design-system/zach-tool-ui/application-guide.md`
- Behavior: `design-system/zach-tool-ui/interactions.md`
- DialKit reference: `design-system/zach-tool-ui/dialkit.md`
- Original theme/specifications: `GUI.md` and `gui/` in this directory.

Original source guides use project-root-relative terminology. Resolve their GUI.md and gui/
references from this documentation directory; resolve runtime components from the UI directory above.
Read the application guide and relevant component specifications before editing UI.
Use the real supplied components, tokens, provider, and stylesheet. Keep artwork styling
separate from interface styling. Preserve existing intentional customizations and dependency
versions. Bind every control to real behavior and verify the affected rendered states.
The original snapshot's setup text does not expand the current user's requested scope.
Source workflows are retained as `source-workflows/*/WORKFLOW.md` references, not separately installed skills.
Central artwork is not included; preserve the chosen icon preference and report asset gaps.
