const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
fs.writeFileSync(S+'/build/test.html','<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body>'+fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8')+'</body></html>');
const seed={};for(const k of ['aurelius','smalldoor','telli']){seed[k]=JSON.parse(fs.readFileSync(`${S}/seed/${k}.json`,'utf8'));seed[k].kickoff=JSON.parse(fs.readFileSync(`${S}/seed/kickoff-${k}.json`,'utf8'));}
const list=(process.argv[3]||'aurelius-guideline,aurelius-make').split(',');const W=+(process.argv[4]||1440),H=+(process.argv[5]||900);
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const scheme of (process.argv[2]||'light').split(',')){
  const ctx=await b.newContext({viewport:{width:W,height:H},colorScheme:scheme});
  await ctx.addInitScript(seed=>{const cols={projects:seed},subs={};const emit=c=>(subs[c]||[]).forEach(cb=>cb({docs:Object.entries(cols[c]||{}).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))}));
   const db={collection:c=>({onSnapshot:(cb)=>{(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>emit(c),0);return()=>{}}}),doc:p=>{const[c,id]=p.split('/');return{set:async v=>{(cols[c]=cols[c]||{})[id]=v;setTimeout(()=>emit(c),0)},delete:async()=>{}}}};
   window.claude={use:async x=>({db,user:{can:async()=>true},sample:Object.assign(async()=>({}),{json:async()=>null}),assets:{upload:async()=>({id:'0'.repeat(32)})}})[x]??null};},seed);
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
  for(const brand of list){await pg.goto('file://'+S+'/build/test.html#'+brand+'-guideline-applications');await pg.waitForTimeout(2500);
   const n=await pg.locator('.pb-scene').count();console.log(brand,scheme,'scenes',n);
   for(let i=0;i<n;i++){const el=pg.locator('.pb-item').nth(i);await el.scrollIntoViewIfNeeded();await pg.waitForTimeout(500);await el.screenshot({path:`${S}/ux/sc-${brand}-${i}-${W}-${scheme}.png`});}
  }
  if(errs.length)console.log('errors',errs.slice(0,8));await ctx.close();}
 await b.close();})();
