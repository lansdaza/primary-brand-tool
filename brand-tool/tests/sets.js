// Sets in Make: suggested sets, saving one, saving any layout as a set, sizes and inputs, drafts and approval, limits, unused, old links.
const {chromium}=require('playwright');const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();const errs=[];
 const ctxOf=async(opts={})=>{const ctx=await b.newContext({viewport:opts.viewport||{width:1440,height:900}});
  await ctx.addInitScript((seed)=>{const docs=seed.docs||{},subs=[];const snap=(c)=>({docs:Object.entries(docs).filter(([k])=>k.startsWith(c+'/')).map(([id,v])=>({id:id.split('/')[1],data:()=>JSON.parse(JSON.stringify(v))}))});const fire=()=>{setTimeout(()=>subs.forEach(([c,f])=>f(snap(c))),20)};
   window.__docs=docs;window.__saved=[];
   const db={collection:(c)=>({onSnapshot:(n)=>{subs.push([c,n]);fire();return()=>{}}}),doc:(p)=>({set:async(v)=>{docs[p]=JSON.parse(JSON.stringify(v));fire()},delete:async()=>{delete docs[p];fire()}})};
   const client=!!seed.client;
   window.claude={use:async(n)=>n==='db'?db:n==='user'?{can:async()=>true,canEdit:async()=>!client,id:async()=>client?'client-1':'zach'}:n==='downloads'?{save:async(o)=>{window.__saved.push([o.filename,o.data.size||o.data.length]);return{status:'saved'}}}:null};
  },{docs:opts.docs,client:opts.client});
  const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message.slice(0,300)));return pg};
 const go=async(pg,h)=>{await pg.goto('file://'+S+'/build/test.html#'+h);await pg.mouse.move(700,450);await pg.waitForTimeout(1600)};
 const docs=(pg)=>pg.evaluate(()=>Object.fromEntries(Object.entries(window.__docs).filter(([k])=>k.startsWith('recipes/'))));
 const rail=(pg,t)=>pg.locator('.pb-rail .pb-railitem',{hasText:t});

 // 1. Make's rail starts with the brand's sets: suggested ones until some are saved.
 let pg=await ctxOf();await go(pg,'smalldoor-make');
 const heads=await pg.locator('.pb-rail .pb-railhead').allInnerTexts();
 ok(/^Sets/i.test(heads[0])&&/Layouts/i.test(heads[1]),'Sets come first in Make, then layouts: '+heads.join(' | '));
 ok(await pg.locator('.pb-rail .pb-railitem',{hasText:'Suggested'}).count()===4,'four suggested Small Door sets');

 // 2. Open a suggestion, shape it, save it.
 await rail(pg,'Clinic opening kit').click();await pg.waitForTimeout(1200);
 ok(await pg.locator('.pb-rc-run .pb-slide').count()===3,'a suggested set shows its three sizes');
 ok(await pg.getByRole('button',{name:'Save this set'}).isVisible(),'a suggestion is not saved until asked');
 await pg.locator('.pb-insp .pb-rc-toggle',{hasText:'LinkedIn 4:5'}).click();await pg.waitForTimeout(500);
 ok(await pg.locator('.pb-rc-run .pb-slide').count()===4,'adding a size adds it');
 ok(await pg.locator('.pb-insp .pb-rc-toggle',{hasText:'Letter Portrait'}).isDisabled(),'no more than four sizes');
 await pg.locator('.pb-insp .pb-rc-toggle',{hasText:'LinkedIn 4:5'}).click();await pg.waitForTimeout(300);
 await pg.getByLabel('Set name').fill('Opening kit');
 await pg.getByRole('button',{name:'Save this set'}).click();await pg.waitForTimeout(1500);
 let d=await docs(pg);let r=Object.values(d)[0];
 ok(Object.keys(d).length===1&&r.status==='approved'&&r.name==='Opening kit'&&r.base==='sdv-event'&&r.sizes.length===3&&r.idea==='clinic-opening','saved as an approved set '+JSON.stringify({s:r&&r.status,n:r&&r.name,sz:r&&r.sizes}));
 ok(await rail(pg,'Opening kit').count()===1&&await rail(pg,'Clinic opening kit').count()===0,'the set replaces its suggestion in the rail');
 ok(await pg.getByRole('button',{name:'Save this set'}).count()===0&&await pg.getByText('In the brand’s sets').isVisible(),'the saved set opens with its status');

 // 3. Use it: words change every size; export makes one file per size.
 const fields=pg.locator('.pb-insp .pb-copy').locator('textarea, input');console.log('  copy fields',await fields.count());
 await fields.first().fill('Now open in Boston');await pg.waitForTimeout(900);
 const texts=await pg.locator('.pb-rc-run .pb-slide').allInnerTexts();ok(texts.length===3&&texts.every(t=>/Boston/.test(t)),'the words reach every size');
 await pg.getByRole('button',{name:'Export 3 sizes'}).click();await pg.waitForFunction(()=>window.__saved.length,null,{timeout:60000}).catch(()=>{});
 const saved=await pg.evaluate(()=>window.__saved);ok(saved.length===1&&/\.zip$/.test(saved[0][0]),'exports one zip '+JSON.stringify(saved));
 await pg.waitForTimeout(900);d=await docs(pg);ok(Object.values(d)[0].uses===1,'use is counted');

 // 4. Any layout can be saved as a set, keeping its look and leaving its words open.
 await rail(pg,'Framed photo').click();await pg.waitForTimeout(1000);
 await pg.getByRole('button',{name:'Save as a set'}).click();await pg.waitForTimeout(1500);
 d=await docs(pg);r=Object.values(d).find(x=>x.base==='sdv-frame');
 ok(r&&r.inputs.includes('caption')&&'photo' in r.fixed&&'tone' in r.fixed&&r.sizes[0]==='post-4-5'&&r.status==='approved','a layout saved as a set '+JSON.stringify(r&&{i:r.inputs,f:Object.keys(r.fixed),s:r.sizes}));
 ok(await rail(pg,'Framed photo set').count()===1&&await pg.locator('.pb-rc-run .pb-slide').count()===r.sizes.length,'and opens as that set');
 // Opening the layout carries the set's values.
 await pg.getByRole('button',{name:'Open the layout'}).click();await pg.waitForTimeout(1000);
 ok(await pg.getByRole('button',{name:'Save as a set'}).isVisible(),'back on the layout');
 // Delete it.
 await rail(pg,'Framed photo set').click();await pg.waitForTimeout(800);
 await pg.getByRole('button',{name:'Delete this set'}).click();await pg.waitForTimeout(1200);
 d=await docs(pg);ok(!Object.values(d).some(x=>x.base==='sdv-frame'),'a set can be deleted');
 ok(await rail(pg,'Framed photo set').count()===0,'and leaves the rail');

 // 5. Tools no longer list sets; an old link to a set opens it in Make.
 const id=Object.keys(d)[0].split('/')[1];
 await go(pg,'smalldoor-tools-painterly');
 ok(await rail(pg,'Opening kit').count()===0,'sets are not in the Tools rail');
 await go(pg,'smalldoor-tools-'+id);await pg.waitForTimeout(800);
 ok(/make/.test(await pg.evaluate(()=>location.hash))&&await pg.locator('.pb-rc-run .pb-slide').count()===3,'an old tool link opens the set in Make');

 // 6. Someone who does not look after the brand: drafts, proposes; a steward approves.
 const shared={};
 pg=await ctxOf({client:true,docs:shared});await go(pg,'smalldoor-make');
 await rail(pg,'Pet portrait post').click();await pg.waitForTimeout(900);
 await pg.getByRole('button',{name:'Save this set'}).click();await pg.waitForTimeout(1300);
 d=await docs(pg);r=Object.values(d)[0];ok(r&&r.status==='draft'&&r.by==='client-1','a client’s set is a draft');
 await pg.getByRole('button',{name:/Propose for/}).click();await pg.waitForTimeout(1200);
 ok(await pg.getByText('Waiting for approval').first().isVisible()&&await pg.getByRole('button',{name:'Approve'}).count()===0,'proposed, and no approve for a client');
 d=await docs(pg);
 pg=await ctxOf({docs:d});await go(pg,'smalldoor-make');
 await rail(pg,'Pet portrait post').click();await pg.waitForTimeout(900);
 ok((await rail(pg,'Pet portrait post').innerText()).includes('Waiting'),'a steward sees it waiting');
 await pg.getByRole('button',{name:'Approve'}).click();await pg.waitForTimeout(900);
 d=await docs(pg);ok(Object.values(d)[0].status==='approved','approved by a steward');

 // 7. A full set of sets: saving makes a draft; approving means archiving one. Unused sets are flagged.
 const old=Date.now()-90*86400000;const seed={};for(let i=0;i<6;i++)seed['recipes/r'+i]={brand:'telli',status:'approved',name:'Set '+i,base:'figure',inputs:['figure'],fixed:{},sizes:['post-4-5'],by:'zach',createdAt:old+i,updatedAt:old,approvedAt:old,uses:i,lastUsed:i?Date.now():0};
 pg=await ctxOf({docs:seed});await go(pg,'telli-make');
 ok((await rail(pg,'Set 0').innerText()).includes('Unused'),'a set unused for 60 days is flagged');
 await rail(pg,'Proof point').click();await pg.waitForTimeout(900);
 ok(/already has 6 sets/.test(await pg.locator('.pb-rc-status').innerText()),'a full brand says so before saving');
 await pg.getByRole('button',{name:'Save this set'}).click();await pg.waitForTimeout(1300);
 d=await docs(pg);r=Object.values(d).find(x=>x.idea==='proof-point');ok(r&&r.status==='draft','saved as a draft when full');
 await pg.getByRole('button',{name:'Archive a set to make room'}).click();await pg.waitForTimeout(300);
 await pg.locator('[role=menuitem]',{hasText:'Set 0'}).click();await pg.waitForTimeout(1200);
 d=await docs(pg);ok(d['recipes/r0'].status==='archived'&&Object.values(d).find(x=>x.idea==='proof-point').status==='approved','approving archives the chosen set');

 // 8. Phone width: the set screen holds.
 pg=await ctxOf({docs:d,viewport:{width:390,height:844}});await go(pg,'telli-make');
 const over=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(over<=1,'no sideways scroll at phone width ('+over+')');
 ok(errs.length===0,'no page errors '+errs.join(' | '));
 await b.close();
})();
