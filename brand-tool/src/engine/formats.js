// @ts-nocheck
// Every size a layout can be made at, in one list shared by all brands. Print sizes are at 300 dpi.
// A layout does not list sizes; it names the shape families it is drawn for, and gets every size in them.
// The stress test draws each layout at each of its sizes with the longest and shortest copy allowed.

export const FAMILIES = {
  tall: { name: 'Tall', about: 'Stories, reels and phone screens' },
  portrait: { name: 'Portrait', about: 'Posts, posters and pages' },
  square: { name: 'Square', about: 'Square posts and cards' },
  landscape: { name: 'Landscape', about: 'Slides, screens, link cards and landscape print' },
  banner: { name: 'Banner', about: 'Headers, covers and billboards' },
  icon: { name: 'Icon', about: 'App icons and profile photos, drawn square and masked by the platform' },
};

export function familyOf(w, h) {
  const r = w / h;
  return r < 0.62 ? 'tall' : r < 0.92 ? 'portrait' : r <= 1.09 ? 'square' : r <= 2.1 ? 'landscape' : 'banner';
}

const S = (id, name, group, w, h, extra = {}) => ({ id, name, group, w, h, family: familyOf(w, h), ...extra });
export const SIZES = [
  // Social
  S('post-4-5', 'Post 4:5', 'Social', 1080, 1350),
  S('post-1-1', 'Post 1:1', 'Social', 1080, 1080),
  S('story-9-16', 'Story 9:16', 'Social', 1080, 1920),
  S('square-1-1', 'Square 1:1', 'Social', 2160, 2160),
  S('instagram-4-5', 'Instagram 4:5', 'Social', 2160, 2700),
  S('instagram-3-4', 'Instagram 3:4', 'Social', 2160, 2880),
  S('reel-9-16', 'Story / Reel 9:16', 'Social', 2160, 3840),
  S('tiktok', 'TikTok 9:16', 'Social', 1080, 1920),
  S('pinterest', 'Pinterest 2:3', 'Social', 1000, 1500),
  S('youtube-thumb', 'YouTube Thumb', 'Social', 1280, 720),
  S('youtube-banner', 'YouTube Banner', 'Social', 2560, 1440),
  S('x-post', 'X Post 16:9', 'Social', 1600, 900),
  S('x-header', 'X Header', 'Social', 1500, 500),
  S('linkedin-1-91', 'LinkedIn 1.91:1', 'Social', 1200, 627),
  S('linkedin-square', 'LinkedIn Square', 'Social', 2160, 2160),
  S('linkedin-4-5', 'LinkedIn 4:5', 'Social', 1080, 1350),
  S('linkedin-cover', 'LinkedIn Cover', 'Social', 1584, 396),
  S('facebook-cover', 'Facebook Cover', 'Social', 1640, 624),
  // Digital
  S('slide-16-9', 'Slide 16:9', 'Digital', 1920, 1080),
  S('wide-16-9', 'Wide 16:9', 'Digital', 2560, 1440),
  S('slide-4-3', 'Slide 4:3', 'Digital', 2048, 1536),
  S('wide-16-10', 'Wide 16:10', 'Digital', 2560, 1600),
  S('open-graph', 'Open Graph', 'Digital', 1200, 630),
  S('vertical-hd', 'Vertical 1080×1920', 'Digital', 1080, 1920),
  S('iphone-17', 'iPhone 17 / 17 Pro', 'Digital', 1206, 2622),
  S('iphone-17-pro-max', 'iPhone 17 Pro Max', 'Digital', 1320, 2868),
  S('iphone-air', 'iPhone Air', 'Digital', 1260, 2736),
  S('ipad-pro-11', 'iPad Pro 11', 'Digital', 1668, 2420),
  // Print, at 300 dpi
  S('a3-portrait', 'A3 Portrait', 'Print', 3508, 4961, { mm: [297, 420] }),
  S('a3-landscape', 'A3 Landscape', 'Print', 4961, 3508, { mm: [420, 297] }),
  S('a4-portrait', 'A4 Portrait', 'Print', 2480, 3508, { mm: [210, 297] }),
  S('a4-landscape', 'A4 Landscape', 'Print', 3508, 2480, { mm: [297, 210] }),
  S('a5-portrait', 'A5 Portrait', 'Print', 1748, 2480, { mm: [148, 210] }),
  S('a5-landscape', 'A5 Landscape', 'Print', 2480, 1748, { mm: [210, 148] }),
  S('a6-portrait', 'A6 Portrait', 'Print', 1240, 1748, { mm: [105, 148] }),
  S('a6-landscape', 'A6 Landscape', 'Print', 1748, 1240, { mm: [148, 105] }),
  S('letter-portrait', 'Letter Portrait', 'Print', 2550, 3300, { mm: [216, 279] }),
  S('letter-landscape', 'Letter Landscape', 'Print', 3300, 2550, { mm: [279, 216] }),
  S('postcard-6-4', 'Postcard 6×4', 'Print', 1800, 1200, { mm: [152, 102] }),
  S('poster-50-70', 'Poster 50×70', 'Print', 2953, 4134, { mm: [500, 700], dpi: 150 }),
  S('a2-portrait', 'A2 Portrait', 'Print', 4961, 7016, { mm: [420, 594] }),
  S('poster-70-100', 'Poster 70×100', 'Print', 4134, 5906, { mm: [700, 1000], dpi: 150 }),
  S('business-card-eu', 'Business card EU', 'Print', 1004, 650, { mm: [85, 55] }),
  S('business-card-us', 'Business card US', 'Print', 1050, 600, { mm: [89, 51] }),
  S('square-card', 'Square card 55×55', 'Print', 650, 650, { mm: [55, 55] }),
  S('dl', 'DL 210×99', 'Print', 2480, 1169, { mm: [210, 99] }),
  S('envelope-dl', 'Envelope DL', 'Print', 2598, 1299, { mm: [220, 110] }),
  S('envelope-c5', 'Envelope C5', 'Print', 1913, 2705, { mm: [162, 229] }),
  S('billboard', 'Billboard 2.2:1', 'Print', 2200, 1000),
  // Icons: one square master that the icon set, avatars and favicons are made from. Its own family, so other layouts do not take it.
  S('app-icon', 'App icon 1024', 'Digital', 1024, 1024, { family: 'icon' }),
];
export const SIZE_BY = Object.fromEntries(SIZES.map((s) => [s.id, s]));
export const GROUPS = ['Social', 'Digital', 'Print'];

// Names used before the shared list, so saved work, decks and agent jobs written with them still open.
export const FORMAT_ALIAS = {
  '4:5': 'post-4-5', '1:1': 'post-1-1', '9:16': 'story-9-16', '16:9': 'slide-16-9',
  'Postcard 3:2': 'postcard-6-4', 'Billboard 2200×1000': 'billboard', 'Link card 1200×630': 'open-graph', 'Slide 1920×1080': 'slide-16-9', 'Square 1080×1080': 'post-1-1',
};

/** The Format parameter for a layout drawn for these families: every size in them, social first. */
export function formatParam(families, def) {
  const options = Object.fromEntries(SIZES.filter((s) => families.includes(s.family)).map((s) => [s.id, [s.w, s.h]]));
  const d = FORMAT_ALIAS[def] ?? def;
  return { type: 'select', label: 'Format', families, options, default: d in options ? d : Object.keys(options)[0] };
}
export const sizeLabel = (id) => { const s = SIZE_BY[id]; return s ? `${s.name} · ${s.w}×${s.h}` : id; };

/**
 * The smallest type a size can carry and still be read: 6 pt in print at the size's resolution, 12 px on screen.
 * A layout declares its smallest type in layout units (minText); sizes where that falls below the floor are not offered.
 */
export const floorPx = (id) => { const s = SIZE_BY[id]; return s?.mm ? (6 * (s.dpi ?? 300)) / 72 : 12; };
export function legible(t) {
  const f = t.params.format;
  if (!f || !t.minText) return;
  const keep = {}, dropped = [];
  for (const [id, [w, h]] of Object.entries(f.options)) (t.minText * t.u(w, h) >= floorPx(id) - 0.01 ? (keep[id] = [w, h]) : dropped.push(id));
  if (!Object.keys(keep).length) return;
  // A layout whose usual size is left out starts at the kept size closest to it in shape.
  const [dw, dh] = f.options[f.default] ?? [1, 1];
  const near = Object.keys(keep).sort((a, b) => Math.abs(Math.log(keep[a][0] / keep[a][1] / (dw / dh))) - Math.abs(Math.log(keep[b][0] / keep[b][1] / (dw / dh))) || Math.abs(keep[a][0] - dw) - Math.abs(keep[b][0] - dw))[0];
  t.params.format = { ...f, options: keep, dropped, default: f.default in keep ? f.default : near };
}
