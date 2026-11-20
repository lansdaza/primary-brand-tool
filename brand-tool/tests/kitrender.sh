#!/bin/bash
# The exported kits, used the way an agent uses them: unzip, check and render every example job, and render the globe clip.
S=/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad
rm -rf $S/kitcheck && mkdir $S/kitcheck && (cd $S/ux && timeout 400 node kitdl.js >/dev/null) || { echo "FAIL kit download"; exit 1; }
for b in aurelius smalldoor telli; do
  cd $S/kitcheck && mkdir -p x-$b && (cd x-$b && unzip -oq ../$b-brand.zip) && ln -sfn /opt/npm-tools/node_modules x-$b/node_modules
  cd $S/kitcheck/x-$b/$b-brand; f=0
  for j in jobs/*.json; do id=$(basename $j .json); timeout 120 node render.mjs $j out/$id.png >/dev/null 2>&1 && [ -s out/$id.png ] || { f=$((f+1)); echo "FAIL $b $id"; }; done
  [ $f = 0 ] && echo "PASS $b: every layout renders"
done
cd $S/kitcheck/x-aurelius/aurelius-brand && timeout 300 node render.mjs jobs/social-graph.json out/globe.mp4 >/dev/null 2>&1
r=$(ffprobe -v error -show_entries stream=codec_name,avg_frame_rate,nb_frames -of csv=p=0 out/globe.mp4 2>/dev/null)
[ "$r" = "h264,30/1,240" ] && echo "PASS globe clip is an 8 s H.264 MP4 at 30 fps" || echo "FAIL globe clip: $r"
# Films: every kit checks and draws its example film; Aurelius renders it in full with its score, and the score checks out.
for b in aurelius smalldoor telli; do
  cd $S/kitcheck/x-$b/$b-brand
  node film.mjs --check example/film.json >/dev/null 2>&1 && node film.mjs example/film.json --sheet out/sheet.png >/tmp/claude-0/f.log 2>&1 && [ -s out/sheet.png ] && ! grep -q "Page errors" /tmp/claude-0/f.log && echo "PASS $b: example film checks and draws" || { echo "FAIL $b example film"; cat /tmp/claude-0/f.log | tail -3; }
done
cd $S/kitcheck/x-aurelius/aurelius-brand && timeout 900 node film.mjs example/film.json out/example.mp4 >/dev/null 2>&1 && node score.mjs --check out/example.mp4 example/film.json >/tmp/claude-0/s.log 2>&1 && echo "PASS aurelius example film renders with a score that checks out" || { echo "FAIL aurelius film/score"; cat /tmp/claude-0/s.log; }
r=$(ffprobe -v error -show_entries stream=codec_name -of csv=p=0 $S/kitcheck/x-aurelius/aurelius-brand/out/example.mp4 | tr '\n' ,); [ "$r" = "h264,aac," ] && echo "PASS film is H.264 with AAC audio" || echo "FAIL film streams: $r"
