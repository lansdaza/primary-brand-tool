// @ts-nocheck
// Brand in use: the table-stakes scenes every guideline is expected to show. The app icon on a home screen, in a dock
// and a browser tab; the LinkedIn and X profiles; posts in a phone; an email signature. Each scene is drawn from what the
// brand already has (its mark, grounds, photography, voice and its own layouts) so it adapts to any brand on its own.
// A scene is a layout like any other (a fixed-size artboard with dials), kept apart from Make's library in B.SC.
// The platform chrome is generic: no platform logos, only the shapes people recognise.
import { tplHTML, sizeOf, defaults, sanitize, esc } from './brand.js';

// Single quotes only: this sits inside style="…" attributes.
const UI = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const STAGE = '#ECECE9', CARD = '#FFFFFF', LINE = '#E3E3E0', SOFT = '#6E6E6A', TEXT = '#141413';
const SIZE = [1600, 1000];

// One of the brand's layouts, drawn at full size and scaled into a box (cover). Motion is off: a scene is a still.
function shot(B, id, over, bw, bh, style = '', flat = false) {
  const t = B.TBY[id];
  if (!t) return `<div style="width:${bw}px;height:${bh}px;background:${LINE};${style}"></div>`;
  let raw = { ...defaults(t), ...over };
  // A banner reads on one line: hand-set line breaks are for the taller sizes.
  if (flat) for (const [k, d] of Object.entries(t.params)) if ((d.type === 'text' || d.type === 'textarea') && typeof raw[k] === 'string') raw[k] = raw[k].replace(/\s*\n\s*/g, ' ');
  const f = t.params.format;
  if (f && !(raw.format in f.options)) {
    const want = bw / bh;
    raw.format = Object.keys(f.options).sort((a, b) => Math.abs(Math.log(f.options[a][0] / f.options[a][1] / want)) - Math.abs(Math.log(f.options[b][0] / f.options[b][1] / want)) || f.options[a][0] - f.options[b][0])[0];
  }
  const p = sanitize(t, raw);
  if ('motion' in p) p.motion = false;
  const [w, h] = sizeOf(t, p), k = Math.max(bw / w, bh / h);
  return `<div class="sc-shot" data-layout="${t.id}" style="position:relative;overflow:hidden;flex:none;width:${bw}px;height:${bh}px;${style}"><div style="position:absolute;left:${((bw - w * k) / 2).toFixed(2)}px;top:${((bh - h * k) / 2).toFixed(2)}px;width:${w}px;height:${h}px;transform:scale(${k.toFixed(5)});transform-origin:0 0">${tplHTML(t, p)}</div></div>`;
}
const icon = (B, p, px, radius = '22.5%', style = '') => shot(B, 'app-icon', { tone: p.iconTone, mark: p.iconMark }, px, px, `border-radius:${radius};${style}`);

// Small line icons for platform chrome, drawn at 24 units.
const SVG = (d, px, color = 'currentColor', w = 1.8, fill = 'none') => `<svg viewBox="0 0 24 24" width="${px}" height="${px}" fill="${fill}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">${d}</svg>`;
const I = {
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  comment: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/>',
  send: '<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
  save: '<path d="M6 3h12v18l-6-5-6 5z"/>',
  dots: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  plus: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
  play: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  back: '<path d="m15 5-7 7 7 7"/>', fwd: '<path d="m9 5 7 7-7 7"/>', reload: '<path d="M19 12a7 7 0 1 1-2-4.9M19 4v4h-4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>', lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
  pin: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>', link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>', attach: '<path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.6 1.6 0 0 1-2.3-2.3L15 7.4"/>',
};
const ic = (k, px, color, w) => SVG(I[k], px, color, w);
const cap = (x, y, text) => `<div style="position:absolute;left:${x}px;top:${y}px;font:500 26px/1 ${UI};color:${SOFT};letter-spacing:.005em">${esc(text)}</div>`;
const abs = (x, y, w, h, inner, style = '') => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;${h != null ? `height:${h}px;` : ''}${style}">${inner}</div>`;
const stage = (inner) => `<div style="position:absolute;inset:0;background:${STAGE};font-family:${UI};color:${TEXT};-webkit-font-smoothing:antialiased;line-height:1.3">${inner}</div>`;
// A neutral stand-in app icon: frosted, with a plain glyph, so the brand's icon is the only one that reads.
const blank = (px, glyph, dark = false) => `<div style="width:${px}px;height:${px}px;border-radius:22.5%;background:${dark ? 'rgba(255,255,255,.22)' : 'linear-gradient(160deg,#FFFFFF,#E7E7E4)'};box-shadow:${dark ? 'inset 0 0 0 1px rgba(255,255,255,.22)' : 'inset 0 0 0 1px rgba(0,0,0,.06)'};display:grid;place-items:center;color:${dark ? 'rgba(255,255,255,.85)' : '#A3A3A0'};backdrop-filter:blur(6px)">${SVG(glyph, px * 0.46, 'currentColor', 1.6)}</div>`;
const GLYPHS = ['<circle cx="12" cy="12" r="7"/>', '<rect x="5" y="5" width="14" height="14" rx="3"/>', '<path d="M5 18 12 5l7 13z"/>', '<path d="M4 8h16M4 12h16M4 16h10"/>', '<circle cx="12" cy="9" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', '<path d="M12 4v16M4 12h16"/>', '<path d="M6 4h12v16H6zM9 8h6M9 12h6"/>', '<path d="M4 14a8 8 0 0 1 16 0M12 14v6"/>'];
const LABELS = ['Calendar', 'Notes', 'Photos', 'Weather', 'Contacts', 'Maps', 'Files', 'Music', 'Mail', 'Clock', 'Wallet', 'Books', 'Camera', 'Health', 'Settings', 'Podcasts', 'Reminders', 'Translate', 'Stocks'];

// A phone: bezel, island and a status bar over whatever the screen holds.
function phone(x, y, w, screen, { dark = false } = {}) {
  const b = Math.round(w * 0.034), sw = w - 2 * b, sh = Math.round(sw * 2.168), r = Math.round(w * 0.15);
  const bar = `<div style="position:absolute;left:0;right:0;top:0;height:${Math.round(sw * 0.13)}px;display:flex;align-items:center;justify-content:space-between;padding:0 ${Math.round(sw * 0.09)}px;font:600 ${Math.round(sw * 0.042)}px/1 ${UI};color:${dark ? '#fff' : TEXT};z-index:3"><span>9:41</span><span style="display:flex;gap:${Math.round(sw * 0.014)}px;align-items:center"><span style="display:inline-flex;gap:2px;align-items:flex-end">${[4, 6, 8, 10].map((hh) => `<i style="display:block;width:3px;height:${hh}px;border-radius:1px;background:currentColor"></i>`).join('')}</span><span style="display:inline-block;width:${Math.round(sw * 0.07)}px;height:${Math.round(sw * 0.034)}px;border-radius:3px;border:1.5px solid currentColor;position:relative;opacity:.95"><i style="position:absolute;inset:1.5px;right:4px;border-radius:1px;background:currentColor"></i></span></span></div>`;
  const island = `<div style="position:absolute;top:${Math.round(sw * 0.03)}px;left:50%;transform:translateX(-50%);width:${Math.round(sw * 0.3)}px;height:${Math.round(sw * 0.088)}px;border-radius:999px;background:#000;z-index:4"></div>`;
  return abs(x, y, w, sh + 2 * b, `<div style="position:absolute;inset:0;border-radius:${r}px;background:#0E0E0E;box-shadow:0 30px 60px -28px rgba(0,0,0,.45),inset 0 0 0 1.5px #3A3A3A"></div><div style="position:absolute;left:${b}px;top:${b}px;width:${sw}px;height:${sh}px;border-radius:${r - b}px;overflow:hidden;background:${dark ? '#000' : '#fff'}">${screen(sw, sh)}${island}${bar}</div>`);
}
const sw0 = (w) => w - 2 * Math.round(w * 0.034);

/* ---------- Icon: home screen, browser tab, and the dock or a search result ---------- */
function drawIcon(B, p) {
  const P = B.presence, app = p.product === 'app', out = [];
  // Left: the icon at home on a phone (an app), or the icon at each size it is used at (a website or service).
  if (app) {
    const pw = 420, sw = sw0(pw);
    out.push(phone(150, 64, pw, (w, h) => {
      const cell = w / 4, px = Math.round(w * 0.16), top = Math.round(w * 0.2), slots = [];
      let n = 0;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
        const mine = r === 1 && c === 1, x = c * cell + (cell - px) / 2, y = top + r * (px + Math.round(w * 0.105));
        const label = mine ? P.name : LABELS[n % LABELS.length];
        slots.push(abs(x - 10, y, px + 20, null, `<div style="display:flex;flex-direction:column;align-items:center;gap:${Math.round(w * 0.016)}px">${mine ? icon(B, p, px, '22.5%', 'box-shadow:0 6px 14px -6px rgba(0,0,0,.45)') : blank(px, GLYPHS[n % GLYPHS.length], true)}<span style="font:500 ${Math.round(w * 0.03)}px/1.1 ${UI};color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.35);white-space:nowrap;max-width:${px + 26}px;overflow:hidden;text-overflow:ellipsis">${esc(label)}</span></div>`));
        if (!mine) n++;
      }
      const dock = abs(Math.round(w * 0.04), h - Math.round(w * 0.3), w - Math.round(w * 0.08), Math.round(w * 0.23), `<div style="height:100%;border-radius:${Math.round(w * 0.085)}px;background:rgba(255,255,255,.24);backdrop-filter:blur(18px);display:flex;align-items:center;justify-content:space-around">${[0, 1, 2, 3].map((i) => blank(px, GLYPHS[(i + 3) % GLYPHS.length], true)).join('')}</div>`);
      return `<img src="${P.wall}" alt="" style="position:absolute;inset:-30px;width:calc(100% + 60px);height:calc(100% + 60px);object-fit:cover;filter:blur(16px) saturate(1.1)"><div style="position:absolute;inset:0;background:rgba(0,0,0,.18)"></div>${slots.join('')}${dock}`;
    }, { dark: true }));
    out.push(cap(150, 64 + Math.round(sw * 2.168) + 2 * Math.round(pw * 0.034) + 22, 'Home screen'));
  } else {
    const sizes = [[180, 'Touch · 180'], [96, '96'], [48, '48'], [32, '32'], [16, '16']];
    out.push(abs(80, 80, 700, 800, '', `background:${CARD};border-radius:28px`));
    out.push(abs(130, 130, 600, null, `<div style="font:600 34px/1.2 ${UI}">${esc(P.name)} at every size</div><div style="margin-top:12px;font:400 23px/1.45 ${UI};color:${SOFT}">One square master. Each platform rounds it or crops it to a circle.</div>`));
    const row = sizes.map(([s, l]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:16px"><div style="height:180px;display:flex;align-items:flex-end">${icon(B, p, s, s >= 48 ? '22.5%' : '18%')}</div><span style="font:500 19px/1 ${UI};color:${SOFT};white-space:nowrap">${esc(l)}</span></div>`).join('');
    out.push(abs(130, 330, 600, null, `<div style="display:flex;align-items:flex-end;justify-content:space-between">${row}</div>`));
    out.push(abs(130, 620, 600, null, `<div style="display:flex;gap:28px;align-items:flex-end">${[['50%', 'Profile photo'], ['14%', 'Company page']].map(([r, l]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:16px">${icon(B, p, 150, r)}<span style="font:500 19px/1 ${UI};color:${SOFT};white-space:nowrap">${l}</span></div>`).join('')}</div>`));
    out.push(cap(80, 912, 'Icon sizes'));
  }
  // Right top: a browser tab with the favicon.
  const bx = 820, by = 80, bw = 700;
  const tab = (title, fav, on) => `<div style="position:relative;display:flex;align-items:center;gap:14px;height:62px;padding:0 18px 0 20px;width:${on ? 330 : 220}px;border-radius:16px 16px 0 0;background:${on ? CARD : 'transparent'};font:500 22px/1 ${UI};color:${on ? TEXT : SOFT}">${fav}<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(title)}</span>${ic('close', 20, on ? SOFT : '#A3A3A0', 2)}</div>`;
  out.push(abs(bx, by, bw, 360, `<div style="position:absolute;inset:0;border-radius:22px;background:#E2E2DF;overflow:hidden;box-shadow:0 1px 0 rgba(0,0,0,.04)"><div style="display:flex;align-items:center;gap:9px;height:62px;padding:0 22px">${['#FF5F57', '#FEBC2E', '#28C840'].map((c) => `<i style="display:block;width:14px;height:14px;border-radius:50%;background:${c}"></i>`).join('')}</div><div style="position:absolute;left:100px;top:0;display:flex;align-items:flex-end;height:62px">${tab(`${P.name}`, icon(B, p, 28, '6px'), true)}${tab('New tab', `<span style="width:28px;height:28px;border-radius:6px;background:#CFCFCB;display:block;flex:none"></span>`, false)}</div><div style="position:absolute;left:0;right:0;top:62px;bottom:0;background:${CARD}"><div style="display:flex;align-items:center;gap:18px;height:86px;padding:0 24px;color:${SOFT}">${ic('back', 26, SOFT, 2)}${ic('fwd', 26, '#BDBDB9', 2)}${ic('reload', 26, SOFT, 2)}<div style="flex:1;display:flex;align-items:center;gap:12px;height:54px;border-radius:27px;background:#F1F1EF;padding:0 22px;font:400 22px/1 ${UI};color:${TEXT}">${ic('lock', 20, SOFT, 2)}${esc(P.site)}</div></div><div style="padding:26px 34px;display:flex;flex-direction:column;gap:14px">${[86, 64, 72].map((w) => `<i style="display:block;height:14px;width:${w}%;border-radius:7px;background:#F0F0EE"></i>`).join('')}</div></div></div>`));
  out.push(cap(bx, by + 360 + 22, 'Browser tab'));
  // Right bottom: the dock (an app) or a search result (a website or service).
  const dy = 540;
  if (app) {
    const px = 92;
    out.push(abs(bx, dy, bw, 340, `<div style="position:absolute;inset:0;border-radius:22px;background:linear-gradient(180deg,#DCDCD8,#CFCFCA);overflow:hidden"><div style="position:absolute;left:50%;bottom:44px;transform:translateX(-50%);display:flex;gap:22px;align-items:flex-end;padding:18px 26px 22px;border-radius:30px;background:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,.7),0 20px 40px -24px rgba(0,0,0,.35);backdrop-filter:blur(20px)">${[0, 1].map((i) => blank(px, GLYPHS[i + 4])).join('')}<div style="position:relative">${icon(B, p, px + 18, '22.5%', 'box-shadow:0 10px 18px -10px rgba(0,0,0,.45)')}<i style="position:absolute;left:50%;bottom:-13px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:#4A4A47"></i></div>${[0, 1].map((i) => blank(px, GLYPHS[i + 6])).join('')}</div></div>`));
    out.push(cap(bx, dy + 340 + 22, 'Dock'));
  } else {
    out.push(abs(bx, dy, bw, 340, `<div style="position:absolute;inset:0;border-radius:22px;background:${CARD};padding:40px 44px"><div style="display:flex;align-items:center;gap:16px">${icon(B, p, 54, '50%', 'box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)')}<div><div style="font:500 22px/1.25 ${UI}">${esc(P.name)}</div><div style="font:400 19px/1.25 ${UI};color:${SOFT}">https://${esc(P.site)}</div></div></div><div style="margin-top:20px;font:500 31px/1.25 ${UI};color:#1A0DAB;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(P.name)}: ${esc(P.bio.split('.')[0])}</div><div style="margin-top:10px;font:400 22px/1.5 ${UI};color:#4D5156;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(P.caption)}</div></div>`));
    out.push(cap(bx, dy + 340 + 22, 'Search result'));
  }
  return stage(out.join(''));
}

/* ---------- Social profiles: a company page and a profile, with the banner and avatar from the brand's layouts ---------- */
function drawSocial(B, p) {
  const P = B.presence, out = [];
  // Company page (LinkedIn's shape): cover, square logo, name, line, followers, buttons, tabs.
  const lx = 70, ly = 120, lw = 1000, ch = Math.round(lw * 396 / 1584);
  const pill = (label, kind) => `<span style="display:inline-flex;align-items:center;height:56px;padding:0 30px;border-radius:999px;font:600 23px/1 ${UI};${kind === 'fill' ? 'background:#0A66C2;color:#fff' : kind === 'line' ? 'box-shadow:inset 0 0 0 2px #0A66C2;color:#0A66C2' : `box-shadow:inset 0 0 0 2px #8C8C8C;color:${SOFT}`}">${label}</span>`;
  out.push(abs(lx, ly, lw, null, `<div style="border-radius:20px;background:${CARD};overflow:hidden">${shot(B, p.banner, { format: 'linkedin-cover' }, lw, ch, '', true)}<div style="position:relative;padding:0 44px">${icon(B, p, 172, '12px', `position:absolute;left:44px;top:-86px;box-shadow:0 0 0 6px ${CARD}`)}<div style="padding-top:106px;font:600 46px/1.15 ${UI}">${esc(P.name)}</div><div style="margin-top:10px;font:400 26px/1.4 ${UI};color:#333">${esc(P.bio)}</div><div style="margin-top:8px;font:400 22px/1.4 ${UI};color:${SOFT}">${esc(P.industry)} · ${esc(P.place)} · ${esc(P.followers)} followers</div><div style="display:flex;gap:14px;margin-top:24px">${pill('+ Follow', 'fill')}${pill('Visit website', 'line')}${pill('More', 'grey')}</div><div style="display:flex;gap:44px;margin-top:26px;border-top:1px solid ${LINE};font:600 22px/1 ${UI};color:${SOFT}">${['Home', 'About', 'Posts', 'Jobs', 'People'].map((t, i) => `<span style="padding:24px 0 22px;${i ? '' : 'color:#01754F;box-shadow:inset 0 -4px 0 #01754F'}">${t}</span>`).join('')}</div></div></div>`));
  // Profile (X's shape): header, round avatar, follow button, name, handle, bio, link, counts.
  const xx = 1010, xy = 350, xw = 530, hh = Math.round(xw / 3);
  out.push(abs(xx, xy, xw, null, `<div style="border-radius:20px;background:${CARD};overflow:hidden;box-shadow:0 30px 60px -34px rgba(0,0,0,.4)">${shot(B, p.banner, { format: 'x-header' }, xw, hh, '', true)}<div style="position:relative;padding:0 30px 32px">${icon(B, p, 128, '50%', `position:absolute;left:28px;top:-64px;box-shadow:0 0 0 5px ${CARD}`)}<div style="display:flex;justify-content:flex-end;padding-top:18px"><span style="display:inline-flex;align-items:center;height:48px;padding:0 26px;border-radius:999px;background:${TEXT};color:#fff;font:700 21px/1 ${UI}">Follow</span></div><div style="margin-top:22px;font:800 30px/1.2 ${UI}">${esc(P.name)}</div><div style="font:400 21px/1.3 ${UI};color:#536471">@${esc(P.handle)}</div><div style="margin-top:16px;font:400 23px/1.4 ${UI};color:${TEXT}">${esc(P.bio)}</div><div style="display:flex;gap:8px;align-items:center;margin-top:14px;font:400 20px/1.3 ${UI};color:#1D9BF0">${ic('link', 20, '#536471', 2)}${esc(P.site)}</div><div style="display:flex;gap:24px;margin-top:12px;font:400 20px/1.3 ${UI};color:#536471"><span><b style="color:${TEXT}">${esc(P.following)}</b> Following</span><span><b style="color:${TEXT}">${esc(P.xFollowers)}</b> Followers</span></div></div></div>`));
  out.push(cap(lx, 940, 'LinkedIn company page'), cap(xx, 940, 'X profile'));
  return stage(out.join(''));
}

/* ---------- Posts in a phone: a feed post and a story, each one of the brand's own layouts ---------- */
function drawPosts(B, p) {
  const P = B.presence, pw = 430, sw = sw0(pw), out = [], X = [800 - 285 - pw / 2, 800 + 285 - pw / 2], Y = 34;
  const head = (w, dark) => `<div style="display:flex;align-items:center;gap:${Math.round(w * 0.028)}px">${icon(B, p, Math.round(w * 0.085), '50%', `box-shadow:0 0 0 2px ${dark ? 'rgba(255,255,255,.9)' : '#fff'},0 0 0 3.5px #D62976`)}<b style="font:600 ${Math.round(w * 0.038)}px/1 ${UI}">${esc(P.handle)}</b>${dark ? `<span style="font:400 ${Math.round(w * 0.036)}px/1 ${UI};opacity:.8">2h</span>` : ''}</div>`;
  out.push(phone(X[0], Y, pw, (w, h) => {
    const top = Math.round(w * 0.13), hd = Math.round(w * 0.15), img = Math.round(w * 1.25), s = Math.round(w * 0.066), bar = Math.round(w * 0.12);
    return `<div style="position:absolute;left:0;right:0;top:${top}px;height:${bar}px;display:flex;align-items:center;justify-content:center;font:700 ${Math.round(w * 0.05)}px/1 ${UI};letter-spacing:-.01em">${esc(P.handle)}</div>
      <div style="position:absolute;left:0;right:0;top:${top + bar}px;height:${hd}px;display:flex;align-items:center;justify-content:space-between;padding:0 ${Math.round(w * 0.035)}px">${head(w, false)}${ic('dots', s, TEXT)}</div>
      <div style="position:absolute;left:0;top:${top + bar + hd}px">${shot(B, p.post, { format: 'post-4-5' }, w, img)}</div>
      <div style="position:absolute;left:0;right:0;top:${top + bar + hd + img}px;padding:${Math.round(w * 0.03)}px ${Math.round(w * 0.04)}px 0">
        <div style="display:flex;align-items:center;gap:${Math.round(w * 0.045)}px">${ic('heart', s, TEXT)}${ic('comment', s, TEXT)}${ic('send', s, TEXT)}<span style="flex:1"></span>${ic('save', s, TEXT)}</div>
        <div style="margin-top:${Math.round(w * 0.028)}px;font:600 ${Math.round(w * 0.036)}px/1.3 ${UI}">1,248 likes</div>
        <div style="margin-top:${Math.round(w * 0.012)}px;font:400 ${Math.round(w * 0.036)}px/1.35 ${UI};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden"><b style="font-weight:600">${esc(P.handle)}</b> ${esc(P.caption)}</div></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:${Math.round(w * 0.2)}px;background:#fff;border-top:1px solid #EFEFEF;display:flex;align-items:flex-start;justify-content:space-around;padding-top:${Math.round(w * 0.04)}px">${['home', 'search', 'plus', 'play'].map((k) => ic(k, s, TEXT)).join('')}${icon(B, p, s, '50%')}</div>`;
  }));
  out.push(phone(X[1], Y, pw, (w, h) => {
    const top = Math.round(w * 0.13), sh = Math.round(w * 16 / 9);
    return `<div style="position:absolute;left:0;top:${top}px;border-radius:${Math.round(w * 0.03)}px;overflow:hidden">${shot(B, p.story, { format: 'story-9-16' }, w, sh)}<div style="position:absolute;left:0;right:0;top:0;height:${Math.round(w * 0.3)}px;background:linear-gradient(rgba(0,0,0,.38),rgba(0,0,0,0))"></div></div>
      <div style="position:absolute;left:${Math.round(w * 0.025)}px;right:${Math.round(w * 0.025)}px;top:${top + Math.round(w * 0.025)}px;display:flex;gap:4px">${[1, 0.45, 0].map((f) => `<i style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.45);overflow:hidden;display:block"><i style="display:block;height:100%;width:${f * 100}%;background:#fff"></i></i>`).join('')}</div>
      <div style="position:absolute;left:${Math.round(w * 0.035)}px;right:${Math.round(w * 0.035)}px;top:${top + Math.round(w * 0.06)}px;display:flex;align-items:center;justify-content:space-between;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.35)">${head(w, true)}${ic('dots', Math.round(w * 0.066), '#fff')}</div>
      <div style="position:absolute;left:${Math.round(w * 0.035)}px;right:${Math.round(w * 0.035)}px;top:${top + sh + Math.round(w * 0.04)}px;display:flex;align-items:center;gap:${Math.round(w * 0.04)}px;color:#fff"><span style="flex:1;height:${Math.round(w * 0.11)}px;border-radius:999px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.6);display:flex;align-items:center;padding:0 ${Math.round(w * 0.045)}px;font:400 ${Math.round(w * 0.036)}px/1 ${UI}">Send message</span>${ic('heart', Math.round(w * 0.07), '#fff')}${ic('send', Math.round(w * 0.07), '#fff')}</div>`;
  }, { dark: true }));
  const bottom = Y + Math.round(sw * 2.168) + 2 * Math.round(pw * 0.034) + 20;
  out.push(cap(X[0], bottom, 'Instagram post'), cap(X[1], bottom, 'Instagram story'));
  return stage(out.join(''));
}

/* ---------- Email signature, in a message being written ---------- */
function sigBlock(B, p) {
  const P = B.presence;
  return `<div style="display:flex;gap:22px;align-items:center">${icon(B, p, 88, '18px')}<div style="font:400 23px/1.45 ${UI};color:${P.ink}"><div style="font-weight:700;font-size:26px">${esc(p.person)}</div><div style="color:${SOFT}">${esc(p.role)}, ${esc(P.name)}</div><div><span style="color:${P.ink};text-decoration:underline;text-decoration-color:${P.accent};text-underline-offset:4px;text-decoration-thickness:2px">${esc(P.site)}</span>${p.phone ? `<span style="color:${SOFT}"> · ${esc(p.phone)}</span>` : ''}</div></div></div>`;
}
function drawSignature(B, p) {
  const x = 160, y = 50, w = 1280, h = 840;
  const field = (k, v) => `<div style="display:flex;gap:16px;align-items:center;height:70px;border-bottom:1px solid ${LINE};padding:0 40px;font:400 23px/1 ${UI}"><span style="color:${SOFT};width:96px">${k}</span><span>${v}</span></div>`;
  const body = `<div style="padding:34px 40px 0;font:400 24px/1.6 ${UI};color:#222">Hi Sam,<br><br>Thanks for the time today. I’ve put the notes from our call in the attached document,<br>with the next steps we agreed. Let me know if anything is missing.<br><br>Best,<br>${esc(p.person.split(' ')[0] || p.person)}</div><div style="padding:30px 40px 0"><div style="width:56px;height:2px;background:${LINE};margin-bottom:28px"></div>${sigBlock(B, p)}</div>`;
  const win = `<div style="position:absolute;inset:0;border-radius:24px;background:${CARD};overflow:hidden;box-shadow:0 30px 60px -36px rgba(0,0,0,.35)"><div style="display:flex;align-items:center;gap:10px;height:70px;padding:0 28px;background:#F4F4F2;border-bottom:1px solid ${LINE}">${['#FF5F57', '#FEBC2E', '#28C840'].map((c) => `<i style="display:block;width:16px;height:16px;border-radius:50%;background:${c}"></i>`).join('')}<span style="flex:1;text-align:center;font:600 23px/1 ${UI};margin-right:70px">New message</span></div>${field('To', 'Sam Rivera')}${field('Subject', 'Notes from today')}${body}<div style="position:absolute;left:40px;right:40px;bottom:34px;display:flex;align-items:center;gap:22px"><span style="display:inline-flex;align-items:center;gap:10px;height:58px;padding:0 30px;border-radius:999px;background:#0A84FF;color:#fff;font:600 23px/1 ${UI}">${ic('send', 22, '#fff', 2)}Send</span>${ic('attach', 28, SOFT, 2)}</div></div>`;
  return stage(abs(x, y, w, h, win) + cap(x, y + h + 22, 'Email signature'));
}

// The signature as people paste it into a mail app: a table with inline styles, the icon as a small image, and
// type that every mail app has (brand fonts do not travel in email).
export function signatureHTML(B, p, iconSrc) {
  const P = B.presence, font = 'Helvetica,Arial,sans-serif';
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${font};color:${P.ink}"><tr><td style="padding:0 16px 0 0;vertical-align:middle"><img src="${iconSrc}" width="56" height="56" alt="${esc(P.name)}" style="display:block;width:56px;height:56px;border-radius:12px"></td><td style="vertical-align:middle;font-family:${font};font-size:14px;line-height:20px;color:${P.ink}"><div style="font-weight:bold;font-size:15px">${esc(p.person)}</div><div style="color:#6E6E6A">${esc(p.role)}, ${esc(P.name)}</div><div><a href="https://${esc(P.site)}" style="color:${P.ink};text-decoration:underline">${esc(P.site)}</a>${p.phone ? `<span style="color:#6E6E6A"> &middot; ${esc(p.phone)}</span>` : ''}</div></td></tr></table>`;
}

// Layouts a scene may hold, by what they are drawn for.
const can = (B, fmt) => B.T.filter((t) => t.id !== 'app-icon' && t.params.format && fmt.every((f) => f in t.params.format.options)).map((t) => t.id);
const pick = (ids, want) => (ids.includes(want) ? want : ids[0]);
const opts = (ids) => Object.fromEntries(ids.map((id) => [id, 1]));

export function scenesOf(B) {
  const P = B.presence;
  if (!P || !B.TBY['app-icon']) return [];
  const icon = B.TBY['app-icon'].params, tones = icon.tone.options;
  const iconParams = { iconTone: { type: 'tone', label: 'Icon tone', options: tones, default: icon.tone.default }, iconMark: { type: 'select', label: 'Mark size', options: icon.mark.options, default: icon.mark.default } };
  const who = { name: { type: 'text', label: 'Name', max: 30, default: P.name }, handle: { type: 'text', label: 'Handle', max: 24, default: P.handle }, site: { type: 'text', label: 'Website', max: 32, default: P.site }, bio: { type: 'textarea', label: 'Bio', max: 110, default: P.bio } };
  const banners = can(B, ['linkedin-cover', 'x-header']), posts = can(B, ['post-4-5']), stories = can(B, ['story-9-16']);
  // A scene reads the brand's presence with any text dials laid over it.
  const withWho = (draw) => (p) => { const saved = B.presence; B.presence = { ...saved, name: p.name ?? saved.name, handle: p.handle ?? saved.handle, site: p.site ?? saved.site, bio: p.bio ?? saved.bio }; try { return draw(B, p); } finally { B.presence = saved; } };
  const scene = (id, name, use, params, draw, layouts) => ({ id, name, kind: 'Scene', src: 'shared', use, size: SIZE, u: () => 1, toneOf: () => P.stageTone, live: () => true, scene: true, layouts, params, draw: withWho(draw), B });
  return [
    scene('scene-icon', 'App icon in use', 'The app icon on a home screen, in a dock and a browser tab (an app), or at every size it is used at (a website or service)',
      { product: { type: 'select', label: 'Product', options: { app: 1, web: 1, service: 1 }, default: P.kind }, ...iconParams, ...who }, drawIcon, (p) => ['app-icon']),
    scene('scene-social', 'Social profiles', 'The LinkedIn company page and X profile, with the banner and profile photo made from the brand’s layouts',
      { banner: { type: 'select', label: 'Banner layout', options: opts(banners), default: pick(banners, P.banner) }, ...iconParams, ...who }, drawSocial, (p) => [p.banner, 'app-icon']),
    scene('scene-posts', 'Posts in a phone', 'An Instagram post and story, each one of the brand’s own layouts, in a phone',
      { post: { type: 'select', label: 'Post layout', options: opts(posts), default: pick(posts, P.post) }, story: { type: 'select', label: 'Story layout', options: opts(stories), default: pick(stories, P.story) }, ...iconParams, ...who }, drawPosts, (p) => [p.post, p.story]),
    scene('scene-signature', 'Email signature', 'The email signature in a message being written',
      { person: { type: 'text', label: 'Person', max: 32, default: P.sig.name }, role: { type: 'text', label: 'Role', max: 32, default: P.sig.role }, phone: { type: 'text', label: 'Phone', max: 24, default: P.sig.phone }, ...iconParams, ...who }, drawSignature, () => ['app-icon']),
  ];
}
export { SIZE as SCENE_SIZE };
