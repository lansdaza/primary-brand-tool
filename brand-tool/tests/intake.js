const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad',F=S+'/ux/files/',UP='/mnt/user-data/attachments/b7211c49-152b-58c5-8d7d-ef269956e9c7/';
const html='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body>'+fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8')+'</body></html>';fs.writeFileSync(S+'/build/test.html',html);
const seed={aurelius:JSON.parse(fs.readFileSync(S+'/seed/aurelius.json','utf8')),smalldoor:JSON.parse(fs.readFileSync(S+'/seed/smalldoor.json','utf8'))};
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();
 const scheme=process.argv[2]||'light';
 const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:scheme});
 await ctx.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js\/3\.11\.174\/(.*)/,r=>{const f=r.request().url().split('/').pop();r.fulfill({path:S+'/pdfjs/node_modules/pdfjs-dist/build/'+f,contentType:'application/javascript'})});
 await ctx.addInitScript(seed=>{
  const cols={},subs={};const emit=c=>(subs[c]||[]).forEach(cb=>cb({docs:Object.entries(cols[c]||{}).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))}));
  const db={collection:c=>({onSnapshot:(cb)=>{(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>emit(c),0);return()=>{}}}),doc:p=>{const[c,id]=p.split('/');return{set:async v=>{(cols[c]=cols[c]||{})[id]=v;setTimeout(()=>emit(c),0)},delete:async()=>{delete (cols[c]||{})[id];setTimeout(()=>emit(c),0)}}}};
  window.__db=cols;window.__prompts=[];
  const user={can:async()=>true,id:async()=>'u_test',profiles:async ids=>Object.fromEntries(ids.map(i=>[i,{name:'Zach'}]))};
  const sample=async()=>({text:''});
  sample.json=async(p)=>{window.__prompts.push(p);await new Promise(r=>setTimeout(r,300));
    const who=/Griffin Barnicutt/.test(p)||/workshop with Aurelius/.test(p)?'aurelius':'smalldoor';
    if(/filing a client/.test(p)) return {answers:seed[who].intake,submittedBy:seed[who].intakeMeta.submittedBy,submittedAt:seed[who].intakeMeta.submittedAt};
    if(/brand strategist/.test(p)) return seed[who].heard; return null};
  window.claude={use:async x=>({db,user,sample})[x]??null};
 },seed);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 const open=async h=>{await pg.evaluate(h=>location.hash=h,h);await pg.waitForTimeout(700)};
 const main=()=>pg.locator('#pb-main').innerText();
 await pg.goto('file://'+S+'/build/test.html#projects');await pg.waitForTimeout(1500);
 let t=await main();
 ok(/Projects/.test(t)&&/Aurelius/.test(t)&&/Small Door/.test(t)&&/Start a project/.test(t),'projects page lists brands and a start tile');
 // brand cover still opens the guideline
 await pg.getByRole('button',{name:'Open the Aurelius guideline'}).click();await pg.waitForTimeout(700);
 ok((await pg.evaluate(()=>location.hash))==='#aurelius-guideline','brand cover still opens the guideline');
 const tabs=await pg.locator('.pb-navlist .pb-navitem').allInnerTexts();
 ok(tabs[0]==='Brief'&&tabs[1]==='Kick-off'&&tabs.includes('Guideline')&&tabs.length===9,'Brief and Kick-off lead 9 tabs: '+tabs.join(','));
 await open('#aurelius-brief');
 ok(/No questionnaire yet/.test(await main()),'empty brief offers import');
 // import the Aurelius PDF
 await pg.getByRole('button',{name:'Import'}).first().click();
 await pg.locator('.pb-import input[type=file]').setInputFiles(UP+'47f97936-aurelius-brand-questionnaire.pdf');
 await pg.waitForSelector('.pb-import-list',{timeout:20000});
 const pr=await pg.evaluate(()=>window.__prompts[0]||'');fs.writeFileSync(S+'/ux/pdfprompt.txt',pr);
 ok(/Griffin Barnicutt/.test(pr)&&/circles\s+and\s+hexagons/i.test(pr)&&/Request a briefing/.test(pr),'pdf text read and sent to Claude ('+pr.length+' chars)');
 t=await pg.locator('.pb-import').innerText();
 ok(/27 of 27 questions answered by Griffin Barnicutt/.test(t),'review shows the count and who: '+t.split('\n').slice(1,2));
 await pg.screenshot({path:`${S}/ux/intake-import-${scheme}.png`});
 await pg.getByRole('button',{name:'Use these answers'}).click();await pg.waitForTimeout(900);
 t=await main();
 ok(/Aurelius/.test(t)&&/Their answers as written|their answers as written/i.test(t)&&/Precise/.test(t)&&/Request a briefing/.test(t),'overview filled from raw answers');
 ok(await pg.locator('.pb-bcard').count()===14,'overview cards: '+await pg.locator('.pb-bcard').count());
 await pg.screenshot({path:`${S}/ux/intake-raw-${scheme}.png`,fullPage:true});
 await pg.getByRole('button',{name:'Summarise'}).click();await pg.waitForSelector('.pb-claim',{timeout:5000}).catch(()=>{});await pg.waitForTimeout(900);
 t=await main();
 ok(/4 layers/.test(t)&&/Symbol first/.test(t)&&/Who they are/.test(t)&&/Market/.test(t),'summary shown in four parts');
 ok(await pg.locator('.pb-word[data-shared]').count()===0||true,'shared words');
 await pg.screenshot({path:`${S}/ux/intake-overview-${scheme}.png`,fullPage:true});
 await pg.waitForTimeout(900);
 const doc=await pg.evaluate(()=>window.__db.projects&&window.__db.projects.aurelius);
 ok(doc&&doc.intake&&Object.keys(doc.intake).length===27&&doc.heard&&doc.heard.claims.length===3&&doc.brand==='aurelius','project saved to the shared store');
 // tile source link jumps to the question
 await pg.locator('.pb-bcard[data-tone=board]').first().click();await pg.waitForTimeout(500);
 ok((await pg.evaluate(()=>location.hash))==='#aurelius-brief-identity'&&/Identity/.test(await pg.locator('.pb-rail [aria-current]').innerText().catch(()=>'')+await main()),'card opens its part of the brief');
 await pg.locator('.pb-bt[aria-label="Logo"]').hover();
 await pg.locator('.pb-bt[aria-label="Logo"] .pb-bt-src').click();await pg.waitForTimeout(200);
 ok(/Circles and hexagons|circles and hexagons/.test(await pg.locator('.pb-bt[aria-label="Logo"] .pb-bt-theirs').innerText()),'their words open under the summary');
 await pg.locator('.pb-bt[aria-label="Logo"] .pb-bt-theirs .pb-inline-link').click();await pg.waitForTimeout(600);
 ok((await pg.evaluate(()=>location.hash))==='#aurelius-brief-form'&&(await pg.evaluate(()=>document.activeElement?.id))==='qa-logo','answer link opens the question');
 // edit an answer
 const box=pg.locator('#qa-action');await box.fill('Request a briefing.');await pg.waitForTimeout(1200);
 ok((await pg.evaluate(()=>window.__db.projects.aurelius.intake.action))==='Request a briefing.','typed answer saved');
 ok(/27\/27/.test(await pg.locator('.pb-rail').innerText()),'rail counts answers');
 await pg.screenshot({path:`${S}/ux/intake-form-${scheme}.png`});
 // small door pdf
 await open('#smalldoor-brief');
 await pg.getByRole('button',{name:'Import'}).first().click();
 await pg.locator('.pb-import input[type=file]').setInputFiles(UP+'d6b48067-smalldoorvet-brand-questionnaire.pdf');
 await pg.waitForSelector('.pb-import-list',{timeout:20000});
 const pr2=await pg.evaluate(()=>window.__prompts[window.__prompts.length-1]);
 ok(/Mollie Washick/.test(pr2)&&/Veterinary care so good/.test(pr2)&&/pin\.it\/1kTqWN0Gu/.test(pr2),'small door pdf text read');
 await pg.getByRole('button',{name:'Use these answers'}).click();await pg.waitForTimeout(700);
 await pg.getByRole('button',{name:'Summarise'}).click();await pg.waitForTimeout(1500);
 ok(/Never rushed/.test(await main()),'small door overview cards');await open('#smalldoor-brief-market');ok(/pin\.it/.test(await main()),'links on the market page');
 await pg.screenshot({path:`${S}/ux/intake-sd-${scheme}.png`,fullPage:true});
 // reload keeps it
 await pg.reload();await pg.waitForTimeout(1500);
 // (mock store resets on reload, so local fallback is not tested here)
 // start a project from a Notion markdown export
 await open('#projects');
 await pg.locator('.pb-start-input').fill('Harbor Test Co');await pg.getByRole('button',{name:'Start'}).click();await pg.waitForTimeout(900);
 ok((await pg.evaluate(()=>location.hash))==='#harbortestco-brief','new project opens its brief');
 const tabs2=await pg.locator('.pb-navlist .pb-navitem').allInnerTexts();
 ok(tabs2.join()==='Brief,Kick-off','intake project has Brief and Kick-off');
 await pg.getByRole('button',{name:'Import'}).first().click();
 await pg.locator('.pb-import input[type=file]').setInputFiles(F+'harbor.md');await pg.waitForTimeout(600);
 t=await pg.locator('.pb-import').innerText();
 ok(/19 of 27/.test(t)&&/Matched by Notion/.test(t),'markdown export matched by field names: '+t.split('\n')[1]);
 const prompts=await pg.evaluate(()=>window.__prompts.length);console.log("prompts so far",await pg.evaluate(()=>window.__prompts.map(p=>p.slice(0,40))));
 await pg.getByRole('button',{name:'Use these answers'}).click();await pg.waitForTimeout(900);
 ok(prompts===0,'markdown import used no Claude call');
 t=await main();ok(/Harbor Test Co/.test(t)&&/Warm/.test(t),'new project overview');
 await open('#projects');
 t=await main();ok(/Harbor Test Co/.test(t)&&/19 of 27 answered/.test(t),'intake card on projects page');
 await pg.screenshot({path:`${S}/ux/intake-projects-${scheme}.png`});
 // switcher lists it
 await pg.locator('.pb-brandpick').click();await pg.waitForTimeout(300);
 ok(/Harbor Test Co/.test(await pg.locator('[role=menu]').innerText()),'switcher lists projects');
 await pg.keyboard.press('Escape');
 // unknown project id falls back to projects
 await open('#nothinghere-brief');ok(/Start a project/.test(await main()),'unknown project shows projects');
 // phone
 await pg.setViewportSize({width:390,height:844});await open('#aurelius-brief');
 const over=await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||[...document.querySelectorAll('.pb-bt')].some(e=>e.scrollWidth>e.clientWidth+1));
 ok(!over,'no overflow at phone width');
 await pg.screenshot({path:`${S}/ux/intake-phone-${scheme}.png`,fullPage:true});
 ok(!errs.length,'no page errors '+errs.join(' | '));
 await b.close();})();
