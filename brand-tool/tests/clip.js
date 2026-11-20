// Finds clipped content on every screen: ellipsis-truncated text, controls scrolling inside themselves,
// and open dropdowns that leave the viewport. Usage: node clip.js <height>
const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const H=+(process.argv[2]||900);
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const html='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body>'+fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8')+'</body></html>';
 fs.writeFileSync(S+'/build/test.html',html);
 const ctx=await b.newContext({viewport:{width:1440,height:H}});
 await ctx.addInitScript(()=>{window.claude={use:async(n)=>n==='user'?{can:async()=>true}:n==='sample'?{json:async()=>({})}:null}});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+S+'/build/test.html');await pg.mouse.move(700,450);await pg.waitForTimeout(1200);
 const scan=(name)=>pg.evaluate((name)=>{const out=[];
  for(const el of document.querySelectorAll('.pb-app *, .pb-menu *')){if(el.closest('.a')||el.closest('.pb-slide')||el.closest('.pb-holder'))continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||el.getAttribute('aria-hidden')==='true')continue;
   const t=(el.innerText||el.value||'').trim().slice(0,40);
   if(cs.textOverflow==='ellipsis'&&el.scrollWidth>el.clientWidth+1)out.push(`${name} | truncated | ${el.className.toString().slice(0,40)} | ${t}`);
   if((el.tagName==='TEXTAREA'||el.tagName==='INPUT')&&el.scrollHeight>el.clientHeight+2&&!el.closest('.pb-prompt-bar'))out.push(`${name} | field scrolls | ${el.className.toString().slice(0,40)} | ${t}`);
   if(/-webkit-box/.test(cs.display)&&el.scrollHeight>el.clientHeight+2&&!el.closest('.pb-desc'))out.push(`${name} | clamped | ${el.className.toString().slice(0,40)} | ${t}`);}
  for(const d of document.querySelectorAll('.dialkit-select-dropdown, .pb-menu')){const r=d.getBoundingClientRect();if(r.bottom>innerHeight+1||r.top<-1||r.right>innerWidth+1)out.push(`${name} | dropdown off screen | ${Math.round(r.top)}..${Math.round(r.bottom)} of ${innerHeight}`);if(d.scrollHeight>d.clientHeight+2)out.push(`${name} | dropdown scrolls | ${d.scrollHeight} > ${d.clientHeight}`)}
  return out},name);
 const found=[];
 const routes=['projects','aurelius-guideline','aurelius-guideline-imagery','smalldoor-guideline-graphics','aurelius-make','smalldoor-make','aurelius-review','smalldoor-machine'];
 for(const h of routes){await pg.evaluate(x=>{location.hash=x},h);await pg.waitForTimeout(1500);found.push(...await scan(h));}
 // every Make layout, every select opened at its scrolled position
 for(const br of ['aurelius','smalldoor']){
  await pg.evaluate(x=>{location.hash=x},br+'-make');await pg.waitForTimeout(1200);
  const n=await pg.locator('.pb-rail .pb-railitem').count();
  for(let i=0;i<n;i++){await pg.locator('.pb-rail .pb-railitem').nth(i).evaluate(e=>e.click());await pg.waitForTimeout(900);const name=br+'-make:'+(await pg.locator('.pb-insphead').first().evaluate(e=>(e.querySelector('h2')||{}).innerText||(e.querySelector('input')||{}).value));found.push(...await scan(name));
   const triggers=pg.locator('.pb-insp .dialkit-select-trigger');const k=await triggers.count();
   for(let j=0;j<k;j++){await triggers.nth(j).scrollIntoViewIfNeeded();await triggers.nth(j).click();await pg.waitForTimeout(350);found.push(...await scan(name+' select '+j));await pg.keyboard.press('Escape');await pg.waitForTimeout(150);}
  }}
 // decks: every slide, every select
 await pg.evaluate(()=>{location.hash='smalldoor-decks'});await pg.waitForTimeout(1200);await pg.getByRole('button',{name:'Start from sample'}).click();await pg.waitForTimeout(1500);
 const m=await pg.locator('.pb-thumbs > li').count();
 for(let i=0;i<m;i++){await pg.locator('.pb-thumbs > li .pb-thumb').nth(i).evaluate(e=>e.scrollIntoView({block:'center'}));await pg.locator('.pb-thumbs > li .pb-thumb').nth(i).click();await pg.waitForTimeout(900);const name='deck slide '+(i+1);found.push(...await scan(name));
  const triggers=pg.locator('.pb-insp .dialkit-select-trigger');const k=await triggers.count();
  for(let j=0;j<k;j++){await triggers.nth(j).scrollIntoViewIfNeeded();await triggers.nth(j).click();await pg.waitForTimeout(350);found.push(...await scan(name+' select '+j));await pg.keyboard.press('Escape');await pg.waitForTimeout(150);}}
 await pg.getByRole('button',{name:'Choose a deck'}).click();await pg.waitForTimeout(300);found.push(...await scan('deck menu'));await pg.keyboard.press('Escape');
 await pg.getByRole('button',{name:'Switch project'}).click();await pg.waitForTimeout(300);found.push(...await scan('brand menu'));await pg.keyboard.press('Escape');
 await pg.locator('.pb-thumbs > li .pb-thumb').nth(1).evaluate(e=>e.scrollIntoView({block:'center'}));await pg.locator('.pb-thumbs > li .pb-thumb').nth(1).click();await pg.waitForTimeout(800);await pg.screenshot({path:S+'/ux/clip-deck.png'});
 console.log([...new Set(found)].join('\n')||'nothing clipped');console.log('errors',errs.length);await b.close()})().catch(e=>{console.log('FAIL',e.message.slice(0,400));process.exit(1)});
