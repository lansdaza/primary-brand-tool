const {chromium}=require('playwright');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const scheme of ['light','dark']){const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:scheme,deviceScaleFactor:1});
 await ctx.addInitScript(()=>{window.claude={use:async(n)=>n==='user'?{can:async()=>true}:null}});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+S+'/build/test.html#aurelius-make');await pg.mouse.move(700,450);await pg.waitForTimeout(1500);
 await pg.locator('.pb-rail').getByText('Metric row',{exact:false}).first().click();await pg.waitForTimeout(800);
 const add=pg.locator('.pb-insp').getByRole('button',{name:/Add figure/});
 for(let i=0;i<3;i++){ if(await add.isEnabled()) {await add.click();await pg.waitForTimeout(200);} }
 console.log(scheme,'add enabled at max:',await add.isEnabled(),'items:',await pg.locator('.pb-list-item').count());
 await pg.screenshot({path:`${S}/ux/copy-${scheme}.png`});
 console.log('errors',errs.length);await ctx.close()}
 await b.close()})();
