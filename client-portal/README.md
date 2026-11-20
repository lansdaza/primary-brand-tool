# Primary Client Portal (Zeus test, Aurelius)

Live page: https://claude.ai/artifact/TZNkDSrXznUgF2Z7gVAqCx (last published Nov 19, version 1795112759-e3a2)

- portal/index.html: the page as published. portal/aurelius-client-sample.json is published beside it (the sample brand book).
- portal/src.html: the first version (Nov 19, own styling), kept for its export helpers.
- portal2/src.html: source of the current page. Build with `python3 portal2/build.py`, which fills in the CSS, theme, icons, brand book code and questionnaire and writes portal/index.html.
- portal2/ui.css, tpl.css, brand-aurelius.css, pub.css, pub.js, theme.json: copied from the Brand Tool so the portal matches it.
- portal/questionnaire.json: Aurelius's 27 questionnaire answers (Oct 16).
- js/p2.js: test run in jsdom with mocked page capabilities (`npm i jsdom`, then `node p2.js` from js/).
- brand-tool/: read-only copy of the Primary Brand Tool as published Nov 18 (version 1795011807-db31). The portal never changed it.

Page capabilities: downloads; db with rule portal read view / write admin; user (profile); assets (upload interact).
Shared data: db doc portal/book (published brand book pointer), brief/answers, collection requests.
