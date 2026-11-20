# Verification evidence

Checked November 6, 2026 for foundation version 1.0.0. Use these results as a baseline and verify the receiving application after integration.

| Area | Evidence | Limit |
| --- | --- | --- |
| Original theme integrity | All 94 saved source file contents match the recorded SHA-256 hashes, applying the manifest's three workflow filename mappings. | This preserves the upload's contents; it does not validate every original component. |
| Type compatibility | The original Graphical source and combined React example pass strict TypeScript checks with the packages recorded in `compatibility.json`. | Other package versions, React 18, and other frameworks need their own checks. |
| Production bundle | The example bundles successfully with production mode enabled, local Inter, Graphical, and DialKit 2.1.0. | Compilation does not establish rendered appearance or interactive correctness. |
| Foundation installer | Executed preview, apply, repeat apply, existing-instruction preservation, conflicting-file rejection, blocked-parent rejection, and symlink-escape rejection. | Unexpected filesystem I/O failures during a write are not a transactional rollback mechanism. |
| DialKit integration source | Inspected the installed package's public props, controller types, native selectors, portal behavior, color editor behavior, and upward pad Y direction. | Native behavior remains version dependent. |
| Fresh usage trial | An independent planning pass for a React 18 texture-generator page identified framework adaptation, scoped styling and portal collisions, production-visible controls, asset gaps, and actual rendered verification. | This tested instruction use in a plan, not implementation of that application. |
| Visual and interaction review | Not completed. The available browser could not access the local preview in this session. | Do not claim rendered parity, responsive verification, popup focus testing, or complete accessibility from the build checks. |

The example binds shape, size, rotation, fill, outline, and position to an SVG preview, with reset and light/dark controls. Its root explicitly keeps controls enabled in production. Confirm those behaviors in a browser when integrating it into an application.

Prioritize rendered desktop and narrow layouts, both color modes, open select and color popups, font loading, slider drag and typed entry, invalid input, color confirmation and dismissal, toggle, pad direction, reset, focus return, overflow, and reduced motion. Test persistence or export only when the receiving app enables those features.
