const {chromium}=require('playwright');const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch();
 for(const W of [1440,390]){const ctx=await b.newContext({viewport:{width:W,height:900}});
 await ctx.addInitScript(()=>{window.claude={use:async x=>x==='sample'?Object.assign(async()=>({}),{json:async(p)=>({prompt:'Soft daylight, two colleagues talking on a hill, middle distance.',note:'Kept to two people in an open landscape.'})}):null}});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+S+'/build/test.html#telli-tools-imagery');await pg.waitForTimeout(1500);await pg.mouse.move(W-10,450);
 const ta=pg.getByRole('textbox',{name:'Prompt'});
 ok((await ta.inputValue()).startsWith('Sunset'),'recipe prompt is built from the defaults '+W);
 if(W>1000){await pg.locator('.pb-rail').getByText('A person walking across a grassy field at sunset',{exact:false}).click();
  ok((await ta.inputValue()).startsWith('A person walking'),'guideline prompt loads');
  await pg.getByRole('button',{name:'Back to the recipe'}).click();ok((await ta.inputValue()).startsWith('Sunset'),'back to the recipe');
  await pg.getByRole('textbox',{name:'Describe the image you need'}).fill('launch post, calm');await pg.getByRole('button',{name:'Write prompt'}).click();await pg.waitForTimeout(300);
  ok((await ta.inputValue()).startsWith('Soft daylight'),'Claude prompt replaces the recipe');}
 await pg.locator('input[type=file]').setInputFiles(S+'/telli/img/desk.jpg');await pg.waitForTimeout(300);
 const boxes=pg.locator('.pb-imgcheck fieldset').first().locator('input');const n=await boxes.count();for(let i=0;i<n;i++)await boxes.nth(i).check();
 ok(await pg.getByText('On brand').isVisible(),'all ticks make it on brand '+W);
 await pg.locator('.pb-imgcheck fieldset').nth(1).locator('input').first().check();ok(await pg.getByText('Not yet').isVisible(),'a never-tick makes it off brand');
 const sw=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(sw<=0,'no sideways scroll '+W);
 ok(!errs.length,'no page errors '+errs.join('|'));await ctx.close();}
 await b.close();})();
