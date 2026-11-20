// Smallest text in each layout at each size, as a share of the artboard's short side and in points when printed.
const {chromium}=require('playwright');const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:2400,height:2400}});
 await pg.goto('file://'+S+'/ux/stress/page.html');await pg.waitForTimeout(1200);
 const out=await pg.evaluate(async()=>{const E=window.__E;await document.fonts.ready;const res=[];
  for(const B of E.BRANDS)for(const t of B.T){const fmts=Object.keys(t.params.format?.options??{x:0});
   for(const f of fmts){const p=E.sanitize(t,{format:f});const [w,h]=E.sizeOf(t,p);const st=document.getElementById('stage');st.innerHTML=E.tplHTML(t,p);const a=st.firstElementChild;
    let min=1e9,which='';for(const el of a.querySelectorAll('*')){if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;if(el.closest('svg'))continue;const fs=parseFloat(getComputedStyle(el).fontSize);if(fs<min){min=fs;which=el.textContent.trim().slice(0,20)}}
    const s=E.SIZE_BY[f];const short=Math.min(w,h);res.push({floor:E.floorPx(f),b:B.id,t:t.id,f,pct:+(100*min/short).toFixed(2),px:Math.round(min),pt:s?.mm?+(min/((s.dpi??300)/72)).toFixed(1):null,which,fam:s?.family})}}
  return res});
 const bad=out.filter(r=>r.px<r.floor-0.5);
 console.log(bad.map(r=>`${r.b} ${r.t} [${r.f}] ${r.fam}: ${r.px}px ${r.pct}%${r.pt!==null?' '+r.pt+'pt':''} "${r.which}"`).join('\n')||'all legible');
 console.log('checked',out.length);await b.close()})();
