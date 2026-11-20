# Primary Brand Tool

Primary's brand-system tool and the client portal that goes with it.

| Folder | What it is | Published as |
| --- | --- | --- |
| `brand-tool/` | The agency workspace: Brief, Kick-off, live Guideline, Assets, Make, Decks, Tools, Review, Machine (brand kit) and Publish to client. Three brands: Aurelius, Small Door Vet, telli. | claude.ai artifact "Primary Brand Tool" |
| `client-portal/` | The client side (Zeus prototype): onboarding questionnaire, brand book, downloads, requests and deliveries. | claude.ai artifact "Primary Client Portal" |
| `docs/` | Reference: the zach-tool-ui design system the tool is styled from. | |

Both are single self-contained HTML pages. Client brand material (logos, photography, guideline extracts) is in `brand-tool/data/` and `client-portal/portal/`; keep this repository private.

## Brand Tool

```
cd brand-tool
npm install
node bundle.mjs vendor/worldgraph/src   # bundles src/ into out/
python3 build.py                        # writes dist/primary-brand-tool.html
```

- `src/` is the app (React + TypeScript). `src/engine/` is the brand engine: brand records, layouts, scenes, particles, score.
- `vendor/worldgraph/` is the Aurelius World Graph source the tool imports (globe, city scenes, design particles).
- `data/` holds the brand images, logos and open fallback fonts that `build.py` embeds.
- `kit-film.mjs` and `kit-score.mjs` ship inside each brand kit as `film.mjs` and `score.mjs`.
- `tests/` are the Playwright suites used during development. They still point at the original workspace paths and need a path variable before they run from here.
- Publish to client (`src/publish.tsx`) was first written by another session straight into the published page; it was ported here unchanged in behaviour (same client-version JSON for all three brands).

## Client portal

```
cd client-portal
python3 portal2/build.py                # writes portal/index.html
```

- `portal2/src.html` is the source. `build.py` fills in the Brand Tool's CSS, theme, icons, brand-book code (`pub.js`) and the questionnaire.
- `portal/aurelius-client-sample.json` is published beside the page as the sample brand book.
- `js/p2.js` is a jsdom test run with mocked page capabilities (`npm i jsdom`, then `node p2.js` from `js/`).
- The portal reads a client version exported from the Brand Tool's Publish tab (`<brand>-client-vN.json`).

## Brief

The portal follows the Zeus product brief (Nov 17, 2026): two separate apps, the client brand book as a basic export, no machinery on show, and the subscription offer only after the brand reveal.
