// Functional pass over every view, with stand-ins for the page host (store, permission, save prompt, Claude, clipboard).
const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const html='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body>'+fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8')+'</body></html>';
 fs.writeFileSync(S+'/build/test.html',html);const errs=[];
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 await ctx.addInitScript(()=>{const docs={},subs=[];const snap=()=>({docs:Object.entries(docs).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))});const fire=()=>setTimeout(()=>subs.forEach(f=>f(snap())),20);
  window.__docs=docs;window.__saved=[];window.__clip=[];window.__prompts=[];
  try{Object.defineProperty(navigator,'clipboard',{value:{writeText:async(t)=>{window.__clip.push(t)}},configurable:true})}catch(e){}
  const db={collection:()=>({onSnapshot:(n)=>{subs.push(n);fire();return()=>{}}}),doc:(p)=>({set:async(v)=>{docs[p.split('/')[1]]=JSON.parse(JSON.stringify(v));fire()},delete:async()=>{delete docs[p.split('/')[1]];fire()}})};
  const sample={json:async(p)=>{window.__prompts.push(p);if(p.includes('slide deck'))return {name:'Clinic openings',slides:[{layout:'sl-title',params:{title:'Three new doors'}},{layout:'sl-card',params:{headline:'Why now?',body:'[reason]'}}]};return {template:'social-stat',params:{value:'64%'},why:'A single figure suits a ring.'}}};
  window.claude={use:async(n)=>n==='db'?db:n==='user'?{can:async()=>true}:n==='sample'?sample:n==='downloads'?{save:async(o)=>{window.__saved.push([o.filename,o.data.size||o.data.length]);return{status:'saved'}}}:null}});
 const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message.slice(0,200)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200))});
 const wait=(ms)=>pg.waitForTimeout(ms);const hash=()=>pg.evaluate(()=>location.hash);
 await pg.goto('file://'+S+'/build/test.html');await pg.mouse.move(700,450);await wait(1500);
 // Projects and navigation
 await pg.getByRole('button',{name:'Open the Aurelius guideline'}).click();await wait(800);ok(await hash()==='#aurelius-guideline','cover opens the guideline');
 await pg.getByRole('button',{name:'Switch project'}).click();await wait(300);await pg.getByRole('menuitem',{name:/Small Door Vet/}).click();await wait(800);ok(await hash()==='#smalldoor-guideline','brand menu switches brand and keeps the view');
 for(const v of ['Make','Decks','Review','Machine','Guideline']){await pg.locator('.pb-navlist .pb-navitem',{hasText:v}).click();await wait(700)}
 ok(await hash()==='#smalldoor-guideline','view tabs route');
 // Guideline
 await pg.goto('file://'+S+'/build/test.html#aurelius-guideline');await pg.mouse.move(700,450);await wait(1200);
 await pg.locator('.pb-rail .pb-railitem',{hasText:'Colour'}).first().click();await wait(800);ok(await hash()==='#aurelius-guideline-colour','rail opens a chapter');
 await pg.locator('.pb-subs .pb-railitem',{hasText:'Secondary colours'}).click();await wait(1000);
 ok(await pg.evaluate(()=>{const r=document.getElementById('s-secondary').getBoundingClientRect();return r.top<200&&r.top>0}),'section link scrolls to the section');
 await wait(400);ok(await pg.locator('.pb-subs .pb-railitem[aria-current]').innerText()==='Secondary colours','rail marks the section being read');
 await pg.locator('.pb-val').first().click();await pg.getByRole('button',{name:'Copy CSS'}).first().click();await wait(200);
 const clip=await pg.evaluate(()=>window.__clip);ok(clip[0]==='#F6F5F2'&&clip[1].startsWith(':root'),'copy HEX and Copy CSS');
 await pg.getByRole('button',{name:'Download'}).first().click();await wait(600);
 await pg.locator('.pb-rail .pb-railitem',{hasText:'Logo'}).first().click();await wait(800);await pg.getByRole('button',{name:'Download 2 files'}).first().click();await wait(800);
 let saved=await pg.evaluate(()=>window.__saved);ok(saved.length===2&&saved[0][0]==='aurelius-neutrals.json'&&saved[1][0]==='aurelius-logo.zip','single file and zip downloads');
 await pg.locator('button.pb-mline').first().click();await wait(300);ok(await pg.locator('.pb-mbody').count()===1,'one section opens its machine reading');
 await pg.getByRole('button',{name:'Machine reading',exact:true}).click();await wait(500);ok(await pg.locator('.pb-mbody').count()>=5,'machine reading on for every section');
 await pg.reload();await wait(1300);ok(await pg.getByRole('button',{name:'Machine reading',exact:true}).getAttribute('aria-pressed')==='true','machine reading remembered');
 await pg.getByRole('button',{name:'Machine reading',exact:true}).click();await wait(300);
 await pg.locator('.pb-pager button[data-next]').click();await wait(600);ok(await hash()==='#aurelius-guideline-colour','pager moves to the next chapter');
 // Make
 await pg.locator('.pb-navlist .pb-navitem',{hasText:'Make'}).click();await wait(1800);
 await pg.locator('.pb-rail .pb-railitem',{hasText:'Statement'}).click();await wait(1200);
 const before=await pg.locator('.pb-holder').innerText();
 const ta=pg.locator('.pb-insp textarea, .pb-insp input[type=text]').first();await ta.fill('Polish pass');await wait(600);
 ok((await pg.locator('.pb-holder').innerText()).includes('Polish pass'),'a dial edit redraws the asset');
 await pg.getByRole('button',{name:'Reset to the sample'}).click();await wait(600);ok((await pg.locator('.pb-holder').innerText())===before,'reset restores the sample');
 await pg.getByRole('button',{name:'Copy properties as JSON'}).click();await wait(200);ok((await pg.evaluate(()=>window.__clip.at(-1))).includes('"template": "statement"'),'copy properties');
 await pg.getByRole('button',{name:'Export PNG'}).click();await wait(4000);console.log('saved',JSON.stringify(await pg.evaluate(()=>window.__saved)),await pg.locator('.pb-prompt-note').count()?await pg.locator('.pb-prompt-note').innerText():'',errs);ok((await pg.evaluate(()=>window.__saved.at(-1)[0])).endsWith('.png'),'PNG export');
 ok(await pg.locator('.pb-checks li').count()>=3,'checks listed in the inspector');
 await pg.getByRole('textbox',{name:'Draft an asset with Claude'}).fill('Share that 64% of clients renewed');await pg.keyboard.press('Enter');await wait(1500);
 ok((await pg.locator('.pb-insphead h2').innerText())==='Stat ring','draft switches to the chosen layout');ok((await pg.locator('.pb-prompt-note').innerText()).includes('ring'),'draft note shows');
 // Decks
 await pg.goto('file://'+S+'/build/test.html#smalldoor-decks');await pg.mouse.move(700,450);await wait(1300);
 await pg.getByRole('button',{name:'Start from sample'}).click();await wait(1500);
 console.log('thumbs',await pg.locator('.pb-thumbs > li').count(),await pg.evaluate(()=>JSON.stringify(Object.values(window.__docs).map(d=>[d.name,d.brand,d.slides.map(s=>s.layout)]))), await pg.locator('.pb-deckpick-name').innerText());ok(await pg.locator('.pb-thumbs > li').count()===7,'sample deck has its slides');
 await wait(900);ok(await pg.evaluate(()=>Object.keys(window.__docs).length)===1,'deck saved to the shared store');
 await pg.locator('.pb-thumbs .pb-thumb').nth(1).click();await wait(700);
 await pg.getByRole('button',{name:'Duplicate slide'}).click();await wait(400);await pg.getByRole('button',{name:'Move earlier'}).click();await wait(400);await pg.getByRole('button',{name:'Delete slide'}).click();await wait(1200);
 ok(await pg.locator('.pb-thumbs > li').count()===7,'duplicate, move and delete');
 await pg.getByRole('button',{name:'All slides'}).click();await wait(800);ok(await pg.locator('.pb-overview > li').count()===7,'all slides grid');
 await pg.getByRole('button',{name:'One slide'}).click();await wait(500);
 await pg.getByRole('button',{name:'Present'}).click();await wait(600);const p0=parseInt(await pg.locator('.pb-present-bar span[aria-live]').innerText());await pg.keyboard.press('ArrowRight');await wait(200);
 ok(parseInt(await pg.locator('.pb-present-bar span[aria-live]').innerText())===p0+1,'present and advance');await pg.keyboard.press('Escape');await wait(400);ok(await pg.locator('.pb-present').count()===0,'escape leaves the presentation');
 await pg.getByRole('button',{name:'Export PDF'}).click();await pg.waitForFunction(()=>window.__saved.some(s=>s[0].endsWith('.pdf')),null,{timeout:90000});ok(true,'PDF export');
 await pg.locator('#pb-deckname').fill('Renamed deck');await wait(1200);ok(await pg.evaluate(()=>Object.values(window.__docs).some(d=>d.name==='Renamed deck')),'rename saves');
 await pg.getByRole('textbox',{name:'Draft a deck with Claude'}).fill('Three clinic openings\nWhy now');await pg.getByRole('button',{name:'Draft with Claude'}).click();await wait(1800);
 ok(await pg.evaluate(()=>Object.values(window.__docs).some(d=>d.name==='Clinic openings'&&d.slides.length===2)),'deck drafted from an outline');
 await pg.getByRole('button',{name:'Choose a deck'}).click();await wait(300);ok(await pg.getByRole('menuitem').count()===3,'deck menu lists decks and new');await pg.keyboard.press('Escape');
 await pg.getByRole('button',{name:'Delete deck'}).click();await pg.getByRole('button',{name:'Delete for everyone?'}).click();await wait(1200);ok(await pg.evaluate(()=>Object.keys(window.__docs).length)===1,'delete after confirm');
 // Review
 await pg.locator('.pb-navlist .pb-navitem',{hasText:'Review'}).click();await wait(700);
 const n0=+(await pg.locator('.pb-badge').innerText());await pg.locator('.pb-flag-toggle').first().click();await wait(300);
 ok(+(await pg.locator('.pb-badge').innerText())===n0-1,'resolving lowers the count');
 await pg.locator('.pb-rail .pb-railitem',{hasText:'Resolved'}).click();await wait(300);ok(await pg.locator('.pb-flag').count()===1,'resolved filter');
 // Machine
 await pg.locator('.pb-navlist .pb-navitem',{hasText:'Machine'}).click();await wait(700);
 await pg.locator('.pb-rail .pb-railitem',{hasText:'Colour'}).click();await wait(400);ok((await pg.locator('.pb-call').first().innerText()).includes('"color"'),'machine section');
 await pg.locator('.pb-rail .pb-railitem',{hasText:'Tools'}).click();await wait(400);ok((await pg.locator('.pb-tools li').count())===6,'connector tools');
 // Theme
 await pg.getByRole('button',{name:'Switch to dark mode'}).click();await wait(300);ok(await pg.evaluate(()=>document.documentElement.dataset.theme)==='dark','theme toggle');
 // Keyboard: tabs reachable and focus visible
 await pg.locator('.pb-navlist .pb-navitem').first().focus();await pg.keyboard.press('Tab');ok(await pg.evaluate(()=>document.activeElement.classList.contains('pb-navitem')&&getComputedStyle(document.activeElement).outlineStyle!=='none'),'visible keyboard focus on tabs');
 // Narrow screens
 const ph=await ctx.newPage();await ph.setViewportSize({width:390,height:844});
 for(const h of ['projects','aurelius-guideline-colour','smalldoor-make','aurelius-decks','aurelius-review','smalldoor-machine']){await ph.goto('file://'+S+'/build/test.html#'+h);await ph.mouse.move(700,450);await ph.waitForTimeout(1300);const w=await ph.evaluate(()=>document.documentElement.scrollWidth);ok(w<=390,`no sideways scroll at 390px: ${h} (${w})`)}
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,3)));
 await b.close()})().catch(e=>{console.log('FAIL exception',e.message.slice(0,600));process.exit(1)});
