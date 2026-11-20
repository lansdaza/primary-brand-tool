const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
(async()=>{const html='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body>'+fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8')+'</body></html>';fs.writeFileSync(S+'/build/test.html',html);
 const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const ctx=await b.newContext({viewport:{width:1440,height:900}});
 await ctx.addInitScript(()=>{window.claude={use:async(n)=>n==='user'?{can:async()=>true}:null}});
 const pg=await ctx.newPage();await pg.goto('file://'+S+'/build/test.html#smalldoor-decks');await pg.mouse.move(700,450);await pg.waitForTimeout(1500);
 await pg.getByRole('button',{name:'Start from sample'}).click();await pg.waitForTimeout(1500);
 const t=pg.locator('.pb-insp .dialkit-select-trigger');let ok=0,n=0;
 for(const s of [0,4,6,2]){await pg.locator('.pb-thumbs > li .pb-thumb').nth(s).evaluate(e=>e.scrollIntoView({block:'center'}));await pg.locator('.pb-thumbs > li .pb-thumb').nth(s).click();await pg.waitForTimeout(700);
  const k=await t.count();for(let r=0;r<2;r++)for(let j=0;j<k;j++){await t.nth(j).click();await pg.waitForTimeout(250);n++;await pg.keyboard.press('Escape');
   const closed=await pg.waitForFunction(()=>!document.querySelector('.dialkit-select-dropdown'),null,{timeout:1500}).then(()=>true).catch(()=>false);
   const back=await pg.evaluate(()=>document.activeElement?.classList.contains('dialkit-select-trigger'));if(closed)ok++;else console.log('stuck slide',s,'select',j,'round',r,'focus on trigger',back)}}
 console.log(`escape closed ${ok}/${n}`);
 // the long tone list: fully visible?
 await pg.locator('.pb-thumbs > li .pb-thumb').nth(6).click();await pg.waitForTimeout(700);const tone=t.last();await tone.click();await pg.waitForTimeout(400);
 console.log(await pg.evaluate(()=>{const d=document.querySelector('.dialkit-select-dropdown');const r=d.getBoundingClientRect();return `tone list ${Math.round(r.top)}..${Math.round(r.bottom)} scrolls=${d.scrollHeight>d.clientHeight+2} options=${d.querySelectorAll('.dialkit-select-option').length}`}));
 await pg.screenshot({path:S+'/ux/tone-open.png'});
 await b.close()})();
