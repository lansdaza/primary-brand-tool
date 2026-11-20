const {chromium}=require('playwright');const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
(async()=>{const b=await chromium.launch();
for(const br of ['aurelius']){const ctx=await b.newContext({viewport:{width:1440,height:900}});
 await ctx.addInitScript(()=>{window.__blobs=[];window.claude={use:async x=>x==='downloads'?{save:async o=>{window.__blobs.push([o.filename,o.data])}}:null}});
 const pg=await ctx.newPage();await pg.goto('file://'+S+'/build/aurelius-live-brand.html#'+br+'-machine');await pg.waitForTimeout(2500);
 await pg.getByRole('button',{name:/^Download .*\.zip$/}).click();await pg.waitForFunction(()=>window.__blobs.length,null,{timeout:120000});
 const [name,bytes]=await pg.evaluate(async()=>[window.__blobs[0][0],Array.from(new Uint8Array(await window.__blobs[0][1].arrayBuffer()))]);
 require('fs').writeFileSync(S+'/kitq/'+name,Buffer.from(bytes));console.log(name,bytes.length);await ctx.close()}
await b.close()})();
