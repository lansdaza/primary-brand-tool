#!/bin/bash
# Rebuild, export a fresh Aurelius kit, and install the film scripts in it (development loop).
S=/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad
cd $S/app && node bundle.mjs ../gitp/src 2>&1 | tail -1 && python3 -I build2.py >/dev/null 2>&1 && cd $S/ux && timeout 200 node kitq.js >/dev/null && cd $S/kitq && rm -rf x && mkdir x && cd x && unzip -oq ../aurelius-brand.zip && ln -sfn /opt/npm-tools/node_modules node_modules
K=$S/kitq/x/aurelius-brand; [ -f $K/film.mjs ] || cp $S/app/kit-film.mjs $K/film.mjs; [ -f $S/app/kit-score.mjs ] && { [ -f $K/score.mjs ] || cp $S/app/kit-score.mjs $K/score.mjs; }; echo kit ready
