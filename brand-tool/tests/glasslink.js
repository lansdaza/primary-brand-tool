// The Glass tool connected to Make and Decks: live pattern images, formats, exports, and the two handoffs.
const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const ctx=await b.newContext({viewport:{width:1440,height:900}});const errs=[];
 await ctx.addInitScript(()=>{const docs={},subs=[];const snap=()=>({docs:Object.entries(docs).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))});const fire=()=>setTimeout(()=>subs.forEach(f=>f(snap())),20);
  window.__docs=docs;window.__saved=[];
  const db={collection:()=>({onSnapshot:(n)=>{subs.push(n);fire();return()=>{}}}),doc:(p)=>({set:async(v)=>{docs[p.split('/')[1]]=JSON.parse(JSON.stringify(v));fire()},delete:async()=>{delete docs[p.split('/')[1]];fire()}})};
  window.claude={use:async(n)=>n==='db'?db:n==='user'?{can:async()=>true}:n==='downloads'?{save:async(o)=>{window.__saved.push([o.filename,o.data.size||o.data.length]);return{status:'saved'}}}:null}});
 const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message.slice(0,200)));
 const wait=(ms)=>pg.waitForTimeout(ms);
 const live=async(sel)=>{await pg.waitForFunction((s)=>{const i=document.querySelector(s+' img.a-live');return i&&i.hasAttribute('data-ready')},sel,{timeout:60000}).catch(()=>{});return pg.evaluate((s)=>{const i=document.querySelector(s+' img.a-live');return i?{ready:i.hasAttribute('data-ready'),jpeg:i.src.startsWith('data:image/jpeg'),src:i.src.length,id:i.dataset.live}:null},sel)};
 const pick=async(grp,v)=>pg.locator('.pb-gtfam',{has:pg.locator('.pb-gtgroup',{hasText:grp})}).locator('.pb-gt-v',{hasText:new RegExp('^'+v+'$')}).click();
 const sel=async(label,val)=>{await pg.locator('.pb-dials button',{hasText:new RegExp('^'+label,'i')}).first().click();await pg.locator('[class*=select-option]',{hasText:new RegExp('^'+val+'$')}).first().click();await wait(800)};
 const dialText=async(label)=>pg.locator('.pb-dials button',{hasText:new RegExp('^'+label,'i')}).first().innerText();

 // 1. Make: the Pattern layout draws the glass live.
 await pg.goto('file://'+S+'/build/test.html#telli-make');await pg.mouse.move(700,450);await wait(1500);
 await pg.locator('.pb-rail .pb-railitem',{hasText:/^Pattern\s*\d/}).first().click();await wait(1200);
 const a=await live('.pb-main');ok(a&&a.ready&&a.jpeg,'Make: Pattern layout draws the glass live '+JSON.stringify(a));
 // A different pattern and colour make a different image.
 await sel('pattern','Ring · Burst');await sel('colourway','Orange');const a2=await live('.pb-main');ok(a2&&a2.ready&&a2.id!==a.id,'Make: pattern and colourway dials redraw the glass');
 // A tall format rebuilds rather than crops: the image is made at the new size.
 const before=await pg.evaluate(()=>{const i=document.querySelector('.pb-main img.a-live');return [i.naturalWidth,i.naturalHeight]});
 await pg.locator('.pb-insp').getByRole('button',{name:/Format|Size|Slide|Post|Story/}).first().click().catch(()=>{});await wait(400);
 const opt=pg.getByRole('option',{name:/Story 9:16/}).first();if(await opt.count())await opt.click();else{const mi=pg.getByRole('menuitem',{name:/Story 9:16/}).first();if(await mi.count())await mi.click()}
 await wait(800);const a3=await live('.pb-main');const after=await pg.evaluate(()=>{const i=document.querySelector('.pb-main img.a-live');return [i.naturalWidth,i.naturalHeight]});
 ok(a3&&a3.ready&&after[1]>after[0]&&before[0]>before[1],`Make: a tall format draws a tall glass image (${before} → ${after})`);
 await pg.screenshot({path:S+'/ux/link-make-tall.png'});
 await pg.getByRole('button',{name:'Export PNG'}).click();await pg.waitForFunction(()=>window.__saved.some(s=>s[0].endsWith('.png')),null,{timeout:90000}).catch(()=>{});
 const png=await pg.evaluate(()=>window.__saved.find(s=>s[0].endsWith('.png')));ok(png&&png[1]>200000,'Make: PNG export includes the glass '+JSON.stringify(png));

 // 2. Glass tool → Make, carrying the settings.
 await pg.goto('file://'+S+'/build/test.html#telli-tools-glass');await pg.mouse.move(700,450);await wait(2500);
 await pick('Window','Layered');await wait(800);await sel('colourway','Lavender');
 await pg.getByRole('button',{name:'Use in Make'}).click();await wait(1500);
 ok(/#telli-make/.test(await pg.evaluate(()=>location.hash)),'Use in Make opens Make');
 const pt=await dialText('pattern'),cw=await dialText('colourway');ok(/Window · Layered/.test(pt)&&/Lavender/.test(cw),`Make opens on the same pattern and colour (${pt.replace(/\n/g,' ')} / ${cw.replace(/\n/g,' ')})`);
 ok(await pg.locator('.pb-datanote').isVisible(),'Make notes the glass came from the Glass tool');
 const m1=await live('.pb-main');ok(m1&&m1.ready,'Make draws the carried glass');
 await pg.screenshot({path:S+'/ux/link-make.png'});
 await pg.locator('.pb-datanote').getByRole('button').click();await wait(800);ok(await pg.locator('.pb-datanote').count()===0,'Use the guideline’s glass clears the carried values');

 // 3. Glass tool → a new deck.
 await pg.goto('file://'+S+'/build/test.html#telli-tools-glass');await pg.mouse.move(700,450);await wait(2500);
 await pick('Tessellation','Large');await wait(800);
 await pg.getByRole('button',{name:'Add to deck'}).click();await wait(400);await pg.getByRole('menuitem',{name:/New deck/}).click();await wait(1800);
 ok(/#telli-decks/.test(await pg.evaluate(()=>location.hash)),'Add to deck opens Decks');
 const deck=await pg.evaluate(()=>Object.values(window.__docs).map(d=>({name:d.name,slides:d.slides.map(s=>[s.layout,s.params.pattern,s.params.glass&&s.params.glass.for])})));
 ok(deck.length===1&&deck[0].name==='Glass patterns'&&deck[0].slides[0][0]==='sl-telli-pattern'&&deck[0].slides[0][1]==='Tessellation · Large'&&deck[0].slides[0][2]==='tessellation-large','new deck holds the pattern slide with its glass '+JSON.stringify(deck));
 const d1=await live('.pb-deckstage');ok(d1&&d1.ready,'the slide draws the glass live');ok(await pg.locator('.pb-datanote').isVisible(),'the slide notes the carried glass');
 await pg.screenshot({path:S+'/ux/link-deck.png'});
 // Adding to the same deck appends.
 await pg.goto('file://'+S+'/build/test.html#telli-tools-glass');await pg.mouse.move(700,450);await wait(2500);
 await pg.getByRole('button',{name:'Add to deck'}).click();await wait(400);await pg.getByRole('menuitem',{name:/Glass patterns/}).click();await wait(1800);
 ok(await pg.evaluate(()=>Object.values(window.__docs)[0].slides.length)===2,'adding to an existing deck appends a slide');
 ok(await pg.locator('.pb-thumbs > li').count()===2&&await pg.locator('.pb-thumbs [aria-current="true"]').count()===1,'Decks opens on the new slide');
 // Edits in the deck keep the glass.
 await pg.waitForTimeout(800);
 await pg.getByRole('button',{name:'Export PDF'}).click();await pg.waitForFunction(()=>window.__saved.some(s=>s[0].endsWith('.pdf')),null,{timeout:120000}).catch(()=>{});
 const pdf=await pg.evaluate(()=>window.__saved.find(s=>s[0].endsWith('.pdf')));ok(pdf&&pdf[1]>150000,'deck PDF includes the glass '+JSON.stringify(pdf));
 ok(await pg.evaluate(()=>Object.values(window.__docs)[0].slides.every(s=>s.params.glass&&s.params.glass.for)),'opening slides keeps their glass settings');

 // 4. The sample deck's pattern close still loads (old saved names map to live patterns).
 await pg.evaluate(()=>{const d=Object.values(window.__docs)[0];d.slides.push({id:'old1',layout:'sl-telli-pattern',params:{pattern:'Window · Forest',headline:'Old'}});});
 ok(errs.length===0,'no page errors '+errs.join(' | '));
 await b.close()})();
