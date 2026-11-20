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
  await ctx.addInitScript(()=>{window.__saved=[];const dl={save:async o=>{const r=new FileReader();await new Promise(ok=>{r.onload=ok;r.readAsDataURL(o.data)});window.__saved.push([o.filename,r.result])}};const u=window.claude.use;window.claude.use=async x=>x==='downloads'?dl:u(x);});
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('console: '+m.text())});
  const dl=async(name,fn)=>{const n0=await pg.evaluate(()=>window.__saved.length);await fn();await pg.waitForFunction(n=>window.__saved.length>n,n0,{timeout:60000});const [f,uri]=await pg.evaluate(()=>window.__saved[window.__saved.length-1]);const p=S+'/ux/dl-'+f;fs.writeFileSync(p,Buffer.from(uri.slice(uri.indexOf(',')+1),'base64'));console.log('download',name,f,fs.statSync(p).size);return p};
  await pg.goto('file://'+S+'/build/test.html#aurelius-publish');await pg.waitForTimeout(3500);
  await pg.getByRole('button',{name:'Publish v1'}).first().click();await pg.waitForTimeout(1500);
  console.log('after publish:',await pg.locator('.pb-pagehead h1').textContent());
  const p=await dl('client json',()=>pg.getByRole('button',{name:'Download v1'}).first().click());
  const j=JSON.parse(fs.readFileSync(p,'utf8'));console.log('format',j.format,j.formatVersion,'version',j.version,'downloads',j.downloads.length,'with data',j.downloads.flatMap(d=>d.files).filter(f=>f.data).length);
  if(errs.length)console.log('errors',errs.slice(0,8));await ctx.close();}
 await b.close();})();
