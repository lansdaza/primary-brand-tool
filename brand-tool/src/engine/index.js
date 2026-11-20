// @ts-nocheck
// Brand registry. Each brand is a record: package data, tones, layouts, slide layouts, guideline surfaces.
import { AURELIUS } from './brand.js';
import { SMALLDOOR } from './smalldoor.js';
import { TELLI } from './telli.js';
export { mountWG, mountLive, resolveLive, tplHTML, sizeOf, sanitize, defaults, toPNG, toVideo, checks, canVideo, briefPrompt, deckPrompt, lum, describe, mix, setWorldRails, worldRails, applyAssets, applyReview, flagStatus, slotStatus, fontState, LICENCES, esc, contrast } from './brand.js';
export { fileBlob, fileBytes, zipFiles } from './files.js';
export { SIZES, SIZE_BY, FAMILIES, GROUPS, familyOf, sizeLabel, FORMAT_ALIAS, floorPx } from './formats.js';
export { buildSlides, slideJpeg, pdfOf, uid } from './deck.js';
import { scenesOf } from './scenes.js';
export { signatureHTML, SCENE_SIZE } from './scenes.js';
export const BRANDS = [AURELIUS, SMALLDOOR, TELLI];
// Brand in use: each brand's scenes (icon, profiles, posts, signature), drawn from its own layouts.
for (const b of BRANDS) { b.SC = scenesOf(b); b.SCBY = Object.fromEntries(b.SC.map((t) => [t.id, t])); }
export const BY = Object.fromEntries(BRANDS.map((b) => [b.id, b]));
import { recipeBrands } from './recipes.js';
recipeBrands(BY);
export * as R from './recipes.js';
