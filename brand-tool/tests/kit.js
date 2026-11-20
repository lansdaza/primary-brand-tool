const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad',F=S+'/ux/files/';
const html='<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8')+'</body></html>';fs.writeFileSync(S+'/build/test.html',html);
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 await ctx.addInitScript(()=>{window.__saved=[];const dl={save:async o=>{const r=new FileReader();await new Promise(ok=>{r.onload=ok;r.readAsDataURL(o.data)});window.__saved.push([o.filename,r.result])}};
  window.claude={use:async x=>({downloads:dl,user:{can:async()=>true}})[x]??null}});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const brand=process.argv[2]||'aurelius';
 await pg.goto('file://'+S+'/build/test.html#'+brand+'-assets');await pg.mouse.move(700,450);await pg.waitForTimeout(1500);
 if(brand==='aurelius'){
  await pg.locator('#slot-font-sans input[type=file]').setInputFiles([F+'Roobert-Regular.woff2']);await pg.waitForTimeout(500);
  await pg.locator('#slot-font-sans').getByRole('radio',{name:'Web'}).click();
  await pg.locator('#slot-font-mono input[type=file]').setInputFiles([F+'Roobert SemiMono Regular.woff2']);await pg.waitForTimeout(500);
 } else {
  await pg.locator('#slot-logo-horizontal input[type=file]').setInputFiles([F+'sd-logo.svg']);await pg.waitForTimeout(500);
 }
 await pg.evaluate(b=>location.hash=b+'-machine',brand);await pg.waitForTimeout(2000);
 await pg.screenshot({path:`${S}/ux/kit-${brand}.png`});
 await pg.locator('.pb-kit-actions button').click();await pg.waitForTimeout(6000);
 const saved=await pg.evaluate(()=>window.__saved);
 console.log('saved',saved.map(s=>[s[0],Math.round(s[1].length*.75/1024)+'KB']));
 fs.writeFileSync(`${S}/ux/kit-${brand}.zip`,Buffer.from(saved[0][1].split(',')[1],'base64'));
 console.log('errors',errs);await b.close()})();
