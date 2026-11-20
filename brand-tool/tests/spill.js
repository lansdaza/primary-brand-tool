// Flags any inspector control whose parts spill outside their row, for every Make layout and deck slide.
const {chromium}=require('playwright');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const scheme of ['light','dark']){const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:scheme});
 await ctx.addInitScript(()=>{window.claude={use:async(n)=>n==='user'?{can:async()=>true}:null}});
 const pg=await ctx.newPage();await pg.goto('file://'+S+'/build/test.html');await pg.mouse.move(700,450);await pg.waitForTimeout(1200);
 const scan=(name)=>pg.evaluate((name)=>{const out=[];const rows=document.querySelectorAll('.pb-insp .dialkit-labeled-control, .pb-insp .dialkit-select-row, .pb-insp .dialkit-slider, .pb-insp .dialkit-text-control, .pb-insp .dialkit-pad-field, .pb-insp .dialkit-pad-caption');
  for(const r of rows){const R=r.getBoundingClientRect();for(const c of r.querySelectorAll('*')){if(c.getAttribute('aria-hidden')==='true')continue;const C=c.getBoundingClientRect();if(!C.width||!C.height)continue;if(C.top<R.top-0.5||C.bottom>R.bottom+0.5||C.left<R.left-0.5||C.right>R.right+0.5)out.push(`${name} | ${r.className.split(' ')[0]} | ${c.className.toString().split(' ')[0]} ${Math.round(C.top-R.top)},${Math.round(R.bottom-C.bottom)},${Math.round(C.left-R.left)},${Math.round(R.right-C.right)}`)}}
  return out},name);
 const found=[];
 for(const br of ['aurelius','smalldoor']){await pg.evaluate(x=>{location.hash=x},br+'-make');await pg.waitForTimeout(1200);
  const n=await pg.locator('.pb-rail .pb-railitem').count();
  for(let i=0;i<n;i++){await pg.locator('.pb-rail .pb-railitem').nth(i).evaluate(e=>e.click());await pg.waitForTimeout(800);found.push(...await scan(br+':'+(await pg.locator('.pb-insphead').first().evaluate(e=>(e.querySelector('h2')||{}).innerText||(e.querySelector('input')||{}).value))))}}
 await pg.evaluate(()=>{location.hash='smalldoor-decks'});await pg.waitForTimeout(1000);await pg.getByRole('button',{name:'Start from sample'}).click();await pg.waitForTimeout(1200);
 const m=await pg.locator('.pb-thumbs > li').count();
 for(let i=0;i<m;i++){const th=pg.locator('.pb-thumbs > li .pb-thumb').nth(i);await th.evaluate(e=>e.scrollIntoView({block:'center'}));await th.click();await pg.waitForTimeout(700);found.push(...await scan('slide '+(i+1)))}
 console.log(scheme,[...new Set(found)].slice(0,20).join('\n')||'nothing spills');await ctx.close()}
 await b.close()})();
