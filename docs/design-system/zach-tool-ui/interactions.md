# Shared interaction rules

## Contents

- Control selection
- Editing and dismissal
- Canvas interaction
- State and persistence
- Motion and responsive behavior
- Focused verification

## Control selection

Use Graphical/Base UI controls for general application navigation, actions, forms, menus, dialogs, and lists. Use DialKit for live continuous values, linked pairs of values, image/color controls, spring/easing editors, grouped parameters, saved tuning versions, and optional animation timelines.

Choose the simplest control that expresses the parameter. Use a slider plus typed value for a bounded continuous number; a select for named choices; a toggle for a true binary state; an XY pad when the two axes have a meaningful relationship. Label ranges and units clearly. Do not add controls whose values never reach the result.

Group parameters by the thing they change, such as Typography, Layout, Surface, or Motion. Place frequent controls first. Make advanced groups collapsible without hiding essential controls. Keep export and application navigation in the app's shared toolbar.

## Editing and dismissal

Define draft, committed, and live-preview behavior for each editor. Numeric and color fields should reject invalid input and preserve the last valid value. Clamp or validate against known ranges and steps.

For a single-line numeric edit, Enter confirms and leaves editing; Escape abandons an uncommitted draft and returns focus appropriately. Multiline text uses Enter for a line break. Do not attach a global Enter handler that closes every field.

For a color editor, live preview can update continuously. Confirming valid typed input should end the relevant edit predictably. Verify whether the native control closes its popup; if the required product behavior differs, adapt a supported component boundary and test it. Do not claim the upstream control already implements a behavior without checking. Escape dismisses the current surface; restoring the color from before opening requires an explicit transaction and should be consistent throughout the app.

Clicking outside a popup closes it when appropriate. Clicking inside controls must not dismiss them. Return focus to the trigger on keyboard dismissal. Open popups must remain within the visible viewport and preserve theme values when portalled.

Prefer direct actions for routine reversible operations. Provide undo for meaningful object changes where the app supports it. Use confirmation dialogs only when the user's task or consequences require a separate decision.

## Canvas interaction

Use explicit interaction states: idle, selected, editing, dragging, and transforming. For editable text objects, single click selects and double click edits where that matches the tool. Typing in a text field must not move or delete canvas objects.

Make selected-object controls available without covering essential drag targets. Prevent control gestures from beginning canvas gestures at the appropriate component boundary. Preserve keyboard access and allow touch/pointer interaction without browser-wide event suppression.

Define transform origins. Scale from the intended center by default for Zach's visual-composition tools, preserving the object's intended center while changing dimensions. Expose a precise numeric control and an obvious reset where useful. Keep aspect-ratio locking explicit.

Treat hover, selection, grouping, and focus as separate visual states. Keep grouping geometry specific to the product; do not force a rectangular selection convention onto an intentionally fluid grouping model.

## State and persistence

Make control values and rendered output share one state path. Avoid independent defaults in the UI and renderer. Derive related readouts from the current value. A reset should update both controls and output.

Use stable, namespaced DialKit IDs. Include the app/document identity and schema version in persisted keys where values could otherwise leak between tools or documents. Persistence is off by default. Do not enable it simply to hide initialization bugs.

When persistence is requested, test reload and reset. Treat local storage as local settings, not cross-device or server-backed saving. Handle uploaded assets separately from numeric presets.

Keep transient editing state out of persisted documents unless intentionally needed. Separate the interface's own theme preferences from the generated artwork's color and type settings.

## Motion and responsive behavior

Preserve the supplied theme's small and large motion roles, supported component exit lifecycles, and reduced-motion behavior. Keep content animation parameters separate from interface chrome.

Choose the correct root mode. Embedded inspectors usually use DialKit's inline mode. Floating tuning panels are useful for deliberate development or canvas workflows. User-facing controls must remain visible in production. A temporary development tuner can be removed once its values are incorporated.

Keep the workspace and inspector scroll behavior coherent. Avoid page-level sideways overflow, unreachable popups, and fixed panels that cover primary actions. Test the intended desktop size and a narrower viewport. Do not remove controls solely to make a screenshot fit.

## Focused verification

Exercise a representative interaction through to the visible result: slider drag, typed numeric entry, color edit, select/toggle, a paired-axis control when present, reset, and any requested saved settings. Verify invalid input and keyboard dismissal. For canvases, test selection, text entry, drag, and scale without competing gestures.

Inspect theme consistency in an open popup, a selected object, a disabled control, and supported color modes. Confirm labels, focus visibility, and state cues. Report known upstream limitations and real asset gaps; avoid treating a passing type check as proof of complete interaction fidelity.
