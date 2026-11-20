const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad',F=S+'/ux/files/';
const html='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body>'+fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8')+'</body></html>';fs.writeFileSync(S+'/build/test.html',html);
const seed={aurelius:JSON.parse(fs.readFileSync(S+'/seed/aurelius.json','utf8')),smalldoor:JSON.parse(fs.readFileSync(S+'/seed/smalldoor.json','utf8'))};
const ko={aurelius:JSON.parse(fs.readFileSync(S+'/seed/kickoff-aurelius.json','utf8')),smalldoor:JSON.parse(fs.readFileSync(S+'/seed/kickoff-smalldoor.json','utf8'))};
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();const scheme=process.argv[2]||'light';
 // screens to upload: grab a few pages of the tool itself
 if(!fs.existsSync(F+'screen-1.png')){const c0=await b.newContext({viewport:{width:1920,height:1080}});const p0=await c0.newPage();
  for(const [i,h] of [[1,'aurelius-guideline'],[2,'smalldoor-guideline'],[3,'aurelius-guideline-colour'],[4,'smalldoor-make']]){await p0.goto('file://'+S+'/build/test.html#'+h);await p0.waitForTimeout(1500);await p0.screenshot({path:F+`screen-${i}.png`});}
  await c0.close();}
 const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:scheme,permissions:['clipboard-read','clipboard-write']});
 await ctx.addInitScript(([seed,ko])=>{
  const cols={projects:JSON.parse(JSON.stringify(seed))},subs={};const emit=c=>(subs[c]||[]).forEach(cb=>cb({docs:Object.entries(cols[c]||{}).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))}));
  const db={collection:c=>({onSnapshot:(cb)=>{(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>emit(c),0);return()=>{}}}),doc:p=>{const[c,id]=p.split('/');return{set:async v=>{(cols[c]=cols[c]||{})[id]=v;setTimeout(()=>emit(c),0)},delete:async()=>{delete (cols[c]||{})[id];setTimeout(()=>emit(c),0)}}}};
  window.__db=cols;window.__prompts=[];window.__blobs={};let n=0;
  const assets={upload:async(blob,o)=>{const id=(++n).toString(16).padStart(32,'0');window.__blobs[id]=URL.createObjectURL(blob);return{id,url:'/_blob/'+id,sizeBytes:blob.size,contentType:o.type}},delete:async(id)=>{window.__deleted=(window.__deleted||[]).concat([id]);return{deleted:true}}};
  const user={can:async()=>true,id:async()=>'u_test'};
  const sample=async()=>({text:''});
  sample.json=async(p)=>{window.__prompts.push(p);await new Promise(r=>setTimeout(r,250));const who=/Aurelius/.test(p)?'aurelius':'smalldoor';
    if(/writing the questions/.test(p))return{questions:ko[who].questions.map(({id,...q})=>q)};
    if(/pre-moodboards/.test(p))return{directions:ko[who].directions.map(({id,...d})=>d)};return null};
  window.claude={use:async x=>({db,user,sample,assets})[x]??null};
  // serve /_blob/ ids from the mock store
  const orig=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
  Object.defineProperty(HTMLImageElement.prototype,'src',{set(v){const m=String(v).match(/\/_blob\/([0-9a-f]{32})/);orig.set.call(this,m&&window.__blobs[m[1]]?window.__blobs[m[1]]:v)},get(){return orig.get.call(this)}});
 },[seed,ko]);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const open=async h=>{await pg.evaluate(h=>location.hash=h,h);await pg.waitForTimeout(700)};
 const main=()=>pg.locator('#pb-main').innerText();
 const doc=()=>pg.evaluate(()=>window.__db.projects.aurelius.kickoff||{});
 await pg.goto('file://'+S+'/build/test.html#aurelius-guideline');await pg.waitForTimeout(1500);
 const tabs=await pg.locator('.pb-navlist .pb-navitem').allInnerTexts();
 ok(tabs[0]==='Brief'&&tabs[1]==='Kick-off'&&tabs.length===9,'main nav: '+tabs.map(t=>t.split('\n')[0]).join(','));
 ok(await pg.locator('.pb-tabs').count()===0&&await pg.locator('.pb-ko-steps').count()===0,'no top tabs and no step strip');
 await pg.locator('.pb-navlist .pb-navitem',{hasText:'Kick-off'}).click();await pg.waitForTimeout(700);
 ok((await pg.evaluate(()=>location.hash))==='#aurelius-kickoff','kick-off route');
 let rail=await pg.locator('.pb-rail').innerText();
 ok(/Overview/.test(rail)&&/Questions/.test(rail)&&/Their brand/.test(rail)&&/Inspiration/.test(rail)&&/Competitors/.test(rail)&&/Pre-moodboards/.test(rail)&&/Workshop file/.test(rail),'modules in the secondary panel');
 ok(await pg.locator('.pb-kmod').count()===7,'overview shows a card per module: '+await pg.locator('.pb-kmod').count());
 ok(/4 of 9 ready|of 9 ready/.test(await main()),'workshop readiness on the overview');
 // questions
 await pg.locator('.pb-kmod').first().click();await pg.waitForTimeout(500);
 ok((await pg.evaluate(()=>location.hash))==='#aurelius-kickoff-questions','card opens its module');
 await pg.getByRole('button',{name:'Draft 5 questions'}).click();await pg.waitForSelector('.pb-kq',{timeout:5000});await pg.waitForTimeout(900);
 ok(await pg.locator('.pb-kq').count()===5,'five questions drafted');
 ok(/Request a briefing/.test(await pg.evaluate(()=>window.__prompts[0]))&&/\[competitorBrand\]/.test(await pg.evaluate(()=>window.__prompts[0])),'prompt carries the answers with ids');
 ok(!(await pg.getByRole('button',{name:'Add a question'}).count()),'no add at five');
 const first=await pg.locator('.pb-kq-q').first().inputValue();
 await pg.locator('.pb-kq').nth(0).hover();await pg.locator('.pb-kq').nth(0).getByRole('button',{name:'Move down'}).click();await pg.waitForTimeout(300);
 ok((await pg.locator('.pb-kq').nth(1).locator('.pb-kq-q').inputValue())===first,'reorder');
 await pg.locator('.pb-kq').nth(4).hover();await pg.locator('.pb-kq').nth(4).getByRole('button',{name:'Remove question'}).click();await pg.waitForTimeout(300);
 ok(await pg.locator('.pb-kq').count()===4&&await pg.getByRole('button',{name:'Add a question'}).count()===1,'remove frees a place');
 await pg.getByRole('button',{name:'Add a question'}).click();await pg.locator('.pb-kq').nth(4).locator('.pb-kq-q').fill('What should a first-time visitor remember?');await pg.waitForTimeout(1000);
 ok(((await doc()).questions||[]).length===5&&(await doc()).questions[4].q==='What should a first-time visitor remember?','typed question saved');
 await pg.getByRole('button',{name:'Draft again'}).first().click();
 ok(await pg.getByRole('button',{name:'Replace'}).count()===1,'draft again asks first');
 await pg.getByRole('button',{name:'Keep mine'}).click();
 await pg.locator('.pb-kq-from .pb-more').first().click();
 await pg.locator('.pb-kq-from .pb-inline-link').first().click();await pg.waitForTimeout(700);
 ok(/#aurelius-brief-form-/.test(await pg.evaluate(()=>location.hash))&&/^qa-/.test(await pg.evaluate(()=>document.activeElement?.id||'')),'source link opens the answer');
 // inspiration gallery
 await open('#aurelius-kickoff-inspiration');
 ok(await pg.locator('.pb-ktile').count()===8,'inspiration gallery has 8 tiles');
 ok(await pg.locator('.pb-insp').count()===0,'no details panel until a tile is chosen');
 await pg.locator('.pb-ktile',{hasText:'Palantir'}).click();await pg.waitForTimeout(300);
 ok(await pg.locator('.pb-insp').count()===1&&/Palantir/.test(await pg.locator('.pb-insp').innerText()),'tile opens its details on the right');
 await pg.locator('.pb-insp input[type=file]').setInputFiles([F+'screen-1.png',F+'screen-2.png',F+'screen-3.png']);await pg.waitForTimeout(1500);
 ok(await pg.locator('.pb-insp .pb-shot').count()===3,'three screens added');
 ok(await pg.locator('.pb-ktile',{hasText:'Palantir'}).locator('.pb-ktile-n').innerText()==='3','tile shows the first screen and a count');
 ok(await pg.locator('.pb-ktile img').evaluateAll(xs=>xs.every(x=>x.naturalWidth>0)),'tile image loads');
 let k=await doc();const palId=Object.keys(k.refs||{}).find(id=>id.startsWith('inspiration-palantir'));
 ok(palId&&k.refs[palId].images.length===3&&k.refs[palId].images[0].w===1920,'images recorded with sizes');
 await pg.locator('.pb-insp .pb-shot').first().hover();await pg.locator('.pb-insp .pb-shot-x').first().click();await pg.waitForTimeout(500);
 ok(await pg.locator('.pb-insp .pb-shot').count()===2&&(await pg.evaluate(()=>window.__deleted||[])).length===1,'remove deletes the asset');
 await pg.locator('.pb-insp .pb-shot-open').first().click();await pg.waitForTimeout(300);
 ok(await pg.locator('.pb-overlay img').count()===1,'screen opens large');await pg.keyboard.press('Escape');await pg.waitForTimeout(200);
 ok(await pg.locator('.pb-overlay').count()===0,'escape closes');
 await pg.locator('.pb-insp input[aria-label="Palantir link"]').fill('https://www.palantir.com');await pg.waitForTimeout(900);
 ok(/palantir/.test(JSON.stringify((await doc()).refs)),'link saved');
 // their brand
 await open('#aurelius-kickoff-current');
 await pg.locator('.pb-ktile').first().click();await pg.waitForTimeout(300);
 ok((await pg.locator('.pb-insp .pb-ko-url input').inputValue())==='https://aurelius.com','current site link from the answer');
 await pg.locator('.pb-insp input[type=file]').setInputFiles([F+'screen-4.png']);await pg.waitForTimeout(900);
 // competitors: leave out, bring back, add
 await open('#aurelius-kickoff-competitor');
 const n0=await pg.locator('.pb-ktile').count();
 await pg.locator('.pb-ktile',{hasText:'Palantir'}).click();await pg.waitForTimeout(200);
 await pg.getByRole('button',{name:'Leave out of the workshop'}).click();await pg.waitForTimeout(400);
 ok(await pg.locator('.pb-ktile').count()===n0-1&&/Left out: Palantir/.test(await main()),'leave a competitor out');
 await pg.getByRole('button',{name:'Bring one back'}).click();await pg.locator('.pb-ko-hidden').getByRole('button',{name:'Palantir'}).click();await pg.waitForTimeout(400);
 ok(await pg.locator('.pb-ktile').count()===n0,'bring it back');
 await pg.getByRole('button',{name:'Add a competitor'}).click();
 await pg.locator('.pb-kr-add input').first().fill('Recorded Future');await pg.locator('.pb-kr-add input').nth(1).fill('https://www.recordedfuture.com');
 await pg.getByRole('button',{name:'Add',exact:true}).click();await pg.waitForTimeout(500);
 ok(await pg.locator('.pb-ktile',{hasText:'Recorded Future'}).count()===1&&/Recorded Future/.test(await pg.locator('.pb-insp').innerText().catch(()=>'')+await pg.locator('.pb-insp input').first().inputValue().catch(()=>'')),'competitor added and opened');
 // directions
 await open('#aurelius-kickoff-directions');
 await pg.getByRole('button',{name:'Draft 3 directions'}).click();await pg.waitForSelector('.pb-ko-dir',{timeout:5000});await pg.waitForTimeout(900);
 ok(await pg.locator('.pb-ko-dir').count()===3,'three directions');
 ok(await pg.locator('.pb-ko-dir .pb-ko-field').count()===0,'details start hidden');
 await pg.locator('.pb-ko-dir').first().getByRole('button',{name:'Details'}).click();
 ok(await pg.locator('.pb-ko-dir').first().locator('.pb-ko-field').count()===5,'details open');
 ok(/What they don't want/.test(await pg.evaluate(()=>window.__prompts[1])),'directions prompt carries the avoid list');
 await pg.locator('.pb-ko-dir').nth(0).getByRole('radio',{name:'The edge'}).click();await pg.waitForTimeout(800);
 ok((await doc()).directions[0].push==='edge','push scale saved');
 await pg.locator('.pb-ko-dir').nth(1).locator('input[type=file]').setInputFiles([F+'screen-2.png',F+'screen-3.png']);await pg.waitForTimeout(1000);
 // workshop + overview
 await open('#aurelius-kickoff-workshop');
 let t=await pg.locator('.pb-ko-outline').innerText();
 ok(/5 of 5 written/.test(t)&&/8 brands, 1 with screens/.test(t)&&/3 directions, 1 with images/.test(t)&&/1 screen;/.test(t),'outline counts');
 await open('#aurelius-kickoff');
 ok(await pg.locator('.pb-kmod').filter({has:pg.locator('.pb-kmod-head',{hasText:'Inspiration'})}).locator('img').count()===1,'overview card shows the screen');
 rail=await pg.locator('.pb-rail').innerText();ok(/Inspiration\s*1\/8/.test(rail),'rail counts screens: '+rail.replace(/\n/g,' '));
 await pg.getByRole('button',{name:'Copy Figma brief'}).first().click();await pg.waitForTimeout(300);
 const clip=await pg.evaluate(()=>navigator.clipboard.readText());
 ok(/project "aurelius"/.test(clip)&&/claude\.ai\/artifact\//.test(clip),'brief copied');
 // nav folds on work screens and opens on hover
 await pg.locator('.pb-navlist .pb-navitem',{hasText:'Make'}).click();await pg.waitForTimeout(800);await pg.mouse.move(900,500);await pg.waitForTimeout(400);
 const w0=await pg.locator('.pb-nav').evaluate(e=>e.getBoundingClientRect().width);
 await pg.locator('.pb-nav-inner').hover();await pg.waitForTimeout(600);
 const w1=await pg.locator('.pb-nav-inner').evaluate(e=>e.getBoundingClientRect().width);
 const wc=await pg.locator('.pb-nav').evaluate(e=>e.getBoundingClientRect().width);
 ok(w0<70&&w1>180&&wc===w0,`nav folds on Make (${w0}) and slides out over the canvas (${w1})`);
 await pg.getByRole('button',{name:/Keep open/}).click();await pg.mouse.move(900,500);await pg.waitForTimeout(500);
 ok((await pg.locator('.pb-nav').evaluate(e=>e.getBoundingClientRect().width))>180,'keep open pins it');
 await pg.getByRole('button',{name:/Fold on work screens/}).click();await pg.mouse.move(900,500);await pg.waitForTimeout(500);
 // intake project
 await open('#projects');await pg.locator('.pb-start-input').fill('Harbor Test Co');await pg.getByRole('button',{name:'Start'}).click();await pg.waitForTimeout(800);
 const tabs2=await pg.locator('.pb-navlist .pb-navitem').allInnerTexts();ok(tabs2.join()==='Brief,Kick-off','intake project tabs: '+tabs2.join());
 await open('#harbortestco-kickoff');t=await main();
 t=await main();ok(/no questionnaire for Harbor Test Co/.test(t)&&!(await pg.getByRole('button',{name:'Draft 5 questions'}).count()),'kick-off without a questionnaire points to the brief');
 await open('#harbortestco-kickoff-questions');await pg.getByRole('button',{name:'Add a question'}).click();await pg.locator('.pb-kq-q').first().fill('Who is this for?');await pg.waitForTimeout(1000);
 ok((await pg.evaluate(()=>window.__db.projects.harbortestco.stage))==='kickoff','stage moves to kick-off');
 // phone
 await pg.setViewportSize({width:390,height:844});await open('#aurelius-kickoff');
 const over=await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||[...document.querySelectorAll('.pb-kmod,.pb-ko-dir,.pb-kq,.pb-ktile')].some(e=>e.scrollWidth>e.clientWidth+1));
 const culprits=await pg.evaluate(()=>[...document.querySelectorAll('.pb-kmod,.pb-ko-dir,.pb-kq,.pb-ktile')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className+' '+e.scrollWidth+'/'+e.clientWidth).concat(document.documentElement.scrollWidth>innerWidth+1?['doc '+document.documentElement.scrollWidth]:[]));
 ok(!over,'no overflow at phone width '+culprits.join(', '));
 ok(!(await pg.locator('.pb-nav').isVisible()),'nav hidden on a phone');
 await pg.getByRole('button',{name:'Menu'}).click();await pg.waitForTimeout(400);
 ok(await pg.locator('.pb-nav-inner').isVisible(),'menu opens the nav as a sheet');
 await pg.locator('.pb-nav .pb-navitem',{hasText:'Brief'}).click();await pg.waitForTimeout(600);
 ok((await pg.evaluate(()=>location.hash))==='#aurelius-brief'&&!(await pg.locator('.pb-nav-inner').isVisible()),'choosing a screen closes the sheet');
 ok(!errs.length,'no page errors '+errs.join(' | '));
 await b.close();})();
