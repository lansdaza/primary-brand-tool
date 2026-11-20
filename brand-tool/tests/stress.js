// Draws every layout and slide with worst-case content and reports anything that spills or is cut off.
const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
(async()=>{
 const page=fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8').replace(/<script id="pb-app">[^]*?<\/script>\s*$/,'');
 const data=fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8').match(/<script id="pb-data">window\.__AURELIUS_IMG[^]*?<\/script>/)[0];
 const html='<!doctype html><html><head><meta charset=utf8><style>body{margin:0}</style></head><body>'+page.replace(data,'')+data+'<script>'+fs.readFileSync(S+'/app/out/stress.js','utf8').replace(/<\/script/g,'<\\/script')+'</script><div id="stage" style="position:absolute;left:0;top:0"></div></body></html>';
 fs.writeFileSync(S+'/ux/stress/page.html',html);
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:2400,height:2400}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+S+'/ux/stress/page.html');await pg.waitForTimeout(1500);
 const out=await pg.evaluate(async()=>{const E=window.__E;await document.fonts.ready;const res=[];
  const words='Wednesday consulting Brooklyn membership dimension strategic momentum evaluation location appointment'.split(' ');
  const fill=(n)=>{let s='',i=0;while(s.length<n){s+=(s?' ':'')+words[i++%words.length]}return s.slice(0,n).trim()};
  const worst=(t,mode)=>{const p={};for(const [k,d] of Object.entries(t.params)){
    if(d.type==='text'||d.type==='textarea')p[k]=mode==='min'?'A':fill(d.max);
    else if(d.type==='list'){const n=mode==='min'?(d.min??0):d.max;
      p[k]=Array.from({length:n},(_,i)=>d.cellsFrom?(d.groups&&i%4===0?{group:true,cells:[fill(d.firstMax??d.cellMax)]}:{cells:Array.from({length:12},(_,j)=>fill(j===0?(d.firstMax??d.cellMax):d.cellMax))}):Object.fromEntries(d.fields.map(f=>[f.key,f.max<=8?('+$1,2X%'+'9999999').slice(0,f.max):fill(f.max)])))}}
   return p};
  const deco=el=>el.closest('.a-mask,.a-grain,.a-wg,svg,img,.a-ph')||/^(I)$/.test(el.tagName);
  for(const B of E.BRANDS)for(const t of [...B.T,...B.SL])for(const mode of ['max','min']){
   // every format of the layout
   const fmts=t.params.format?Object.keys(t.params.format.options):[null];
   for(const f of fmts){const raw=worst(t,mode);if(f)raw.format=f;
    if(t.params.graphic)raw.graphic='guideline picture';if(t.params.motion!==undefined)raw.motion=false;
    const p=E.sanitize(t,raw);const st=document.getElementById('stage');st.innerHTML=E.tplHTML(t,p);const a=st.firstElementChild;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const A=a.getBoundingClientRect(),issues=new Set();
    for(const el of a.querySelectorAll('*')){if(deco(el))continue;const r=el.getBoundingClientRect();if(!r.width&&!r.height)continue;const cs=getComputedStyle(el);
     const par=el.parentElement,P=par.getBoundingClientRect();
     const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
     if(r.right>A.right+2||r.bottom>A.bottom+2||r.left<A.left-2||r.top<A.top-2)issues.add(`outside the frame: ${(el.textContent||el.className).trim().slice(0,30)}`);
     else if(par!==a&&getComputedStyle(par).position!=='static'===false&&(r.right>P.right+3||r.bottom>P.bottom+3||r.left<P.left-3||r.top<P.top-3)&&!deco(par))issues.add(`spills its box: ${(el.textContent||el.className).trim().slice(0,30)}`);
     if((cs.overflow==='hidden'||cs.overflow==='clip')&&hasText&&(el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2))issues.add(`text cut off: ${el.textContent.trim().slice(0,30)}`);
     if(hasText){const rg=document.createRange();rg.selectNodeContents(el);for(const rr of rg.getClientRects()){let q=el;while(q&&q!==a){const qs=getComputedStyle(q);if(qs.overflow!=='visible'){const Q=q.getBoundingClientRect();if(rr.bottom>Q.bottom+2||rr.right>Q.right+2){issues.add(`text clipped by its box: ${el.textContent.trim().slice(0,30)}`);break}}q=q.parentElement}}}
    }
    if(issues.size)res.push(`${B.id} ${t.id}${f?' ['+f+']':''} ${mode}: ${[...issues].slice(0,4).join(' | ')}`);
   }}
  return res});
 console.log(out.join('\n')||'no layout breaks');console.log('errors',errs.slice(0,3));await b.close()})().catch(e=>{console.log('FAIL',e.message.slice(0,500));process.exit(1)});
