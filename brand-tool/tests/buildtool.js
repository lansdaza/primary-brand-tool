// Build a tool: the brand's own tools, what could come next, the worth-it check, briefs to Primary, requests, full-bleed cards.
const {chromium}=require('playwright');const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();const errs=[];
 const ctxOf=async(opts={})=>{const ctx=await b.newContext({viewport:opts.viewport||{width:1440,height:900},permissions:['clipboard-read','clipboard-write']});
  await ctx.addInitScript((seed)=>{const docs=seed.docs||{},subs=[];const snap=(c)=>({docs:Object.entries(docs).filter(([k])=>k.startsWith(c+'/')).map(([id,v])=>({id:id.split('/')[1],data:()=>JSON.parse(JSON.stringify(v))}))});const fire=()=>{setTimeout(()=>subs.forEach(([c,f])=>f(snap(c))),20)};
   window.__docs=docs;window.__prompts=[];
   const db={collection:(c)=>({onSnapshot:(n)=>{subs.push([c,n]);fire();return()=>{}}}),doc:(p)=>({set:async(v)=>{docs[p]=JSON.parse(JSON.stringify(v));fire()},delete:async()=>{delete docs[p];fire()}})};
   const sample={json:async(p)=>{window.__prompts.push(p);const q=(p.match(/asked for a new tool:\n"([^"]*)"/)||[])[1]||'';
     if(/sticker/i.test(q))return{verdict:'engine',reason:'Stickers need a new drawing system.',brief:{name:'Pet stickers',from:'4.2 Painterly illustration',what:'Die-cut pet stickers in the brush hand.',why:'Clinics hand them out.'}};
     if(/poster/i.test(q))return{verdict:'set',reason:'The Event poster does this.',target:'sdv-event'};
     if(/mask|photo/i.test(q))return{verdict:'tool',reason:'The Painterly studio does this.',target:'painterly'};
     if(/neon/i.test(q))return{verdict:'off-brand',reason:'Neon is outside the palette (2.0).'};
     if(/broken/i.test(q))return{verdict:'tool',reason:'x',target:'no-such-tool'};
     return{verdict:'what'}}};
   const client=!!seed.client;
   window.claude={use:async(n)=>n==='db'?db:n==='user'?{can:async()=>true,canEdit:async()=>!client,id:async()=>client?'client-1':'zach'}:n==='sample'&&!seed.noClaude?sample:null};
  },{docs:opts.docs,noClaude:opts.noClaude,client:opts.client});
  const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message.slice(0,300)));return pg};
 const go=async(pg,h)=>{await pg.goto('file://'+S+'/build/test.html#'+h);await pg.mouse.move(700,450);await pg.waitForTimeout(1800)};
 const docs=(pg)=>pg.evaluate(()=>Object.fromEntries(Object.entries(window.__docs).filter(([k])=>k.startsWith('recipes/'))));
 const askIt=async(pg,q)=>{await pg.locator('#pb-rc-ask').fill(q);await pg.getByRole('button',{name:'Check it'}).click();await pg.waitForTimeout(1300);return pg.locator('.pb-rc-verdict').innerText()};

 // 1. The page: the brand's own tools, then what could come next, each with a picture.
 let pg=await ctxOf();await go(pg,'smalldoor-tools-build');
 ok(await pg.getByRole('heading',{name:'Tools for Small Door Vet'}).isVisible(),'the page is about the brand’s tools');
 const have=pg.locator('section[aria-labelledby=pb-rc-have] .pb-rc-idea');ok(await have.count()===1&&/Painterly studio/.test(await have.innerText())&&await have.locator('.pb-slide').count()===1,'Small Door’s own tool, with a preview');
 const next=pg.locator('section[aria-labelledby=pb-rc-next] .pb-rc-idea');const names=await next.locator('h3').allInnerTexts();
 ok(names.join(',')==='Frames studio,Logo frame,Painted objects','three tools that could come next: '+names.join(', '));
 ok(/From 4\.3 Frames/.test(await next.first().innerText()),'each names the guideline section it builds on');
 ok(await pg.locator('.pb-rc-idea .pb-slide').count()===4,'every card has its picture');

 // 2. Cards are one container: the picture runs edge to edge across the top.
 const geo=await pg.evaluate(()=>[...document.querySelectorAll('.pb-rc-idea')].map(c=>{const a=c.querySelector('.pb-rc-idea-art').getBoundingClientRect(),r=c.getBoundingClientRect(),cs=getComputedStyle(c.querySelector('.pb-rc-idea-art'));return{dl:a.left-r.left,dr:r.right-a.right,dt:a.top-r.top,pad:getComputedStyle(c).paddingLeft,ring:cs.boxShadow,rad:cs.borderTopLeftRadius}}));
 ok(geo.every(g=>Math.abs(g.dl)<1&&Math.abs(g.dr)<1&&Math.abs(g.dt)<1&&g.pad==='0px'&&g.ring==='none'&&g.rad==='0px'),'previews are full width, flush to the top, with no box of their own '+JSON.stringify(geo[0]));
 ok(await pg.evaluate(()=>getComputedStyle(document.querySelector('.pb-rc-idea')).overflow)==='hidden','the card’s corners clip the picture');

 // 3. Open a tool from its card.
 await have.getByRole('button',{name:'Open'}).click();await pg.waitForTimeout(1200);
 ok(/tools-painterly/.test(await pg.evaluate(()=>location.hash)),'Open goes to the tool');
 await go(pg,'smalldoor-tools-build');

 // 4. Ask Primary for a suggested tool: a request with a brief.
 await next.first().getByRole('button',{name:'Ask Primary to build it'}).click();await pg.waitForTimeout(1300);
 let d=await docs(pg);let r=Object.values(d)[0];
 ok(r&&r.status==='request'&&r.idea==='frames'&&/From the guideline: 4\.3 Frames/.test(r.brief)&&/Build a tool for Small Door Vet: Frames studio/.test(r.brief),'a request with a scoped brief '+JSON.stringify(r&&r.brief).slice(0,120));
 ok(await next.first().getByText('Asked for').isVisible()&&await next.first().getByRole('button',{name:'Ask Primary to build it'}).count()===0,'the card shows it was asked for');

 // 5. The worth-it check, each way.
 let v=await askIt(pg,'animated pet stickers');
 ok(/Worth building/.test(v)&&await pg.locator('#pb-rc-bname').inputValue()==='Pet stickers'&&/4\.2 Painterly/.test(v),'a new drawing system becomes a brief');
 ok(await pg.locator('.pb-rc-verdict').getByRole('button',{name:'Copy brief'}).isVisible(),'the brief can be copied');
 await pg.locator('#pb-rc-bname').fill('Sticker sheet');
 await pg.getByRole('button',{name:'Save for Primary'}).click();await pg.waitForTimeout(1300);
 d=await docs(pg);r=Object.values(d).find(x=>x.name==='Sticker sheet');
 ok(r&&r.request==='animated pet stickers'&&/Asked for as: “animated pet stickers”/.test(r.brief),'sent with the person’s words');
 ok(/Saved for Primary/.test(await pg.locator('.pb-rc-verdict').innerText())&&/Nobody is notified/.test(await pg.locator('.pb-rc-verdict').innerText()),'and says where it was saved');
 v=await askIt(pg,'a poster for one event');ok(/Make can do this/.test(v)&&/Save as a set/.test(v),'a layout job goes to Make, and points to sets');
 await pg.getByRole('button',{name:/Open Event poster in Make/}).click();await pg.waitForTimeout(1200);
 ok(/make/.test(await pg.evaluate(()=>location.hash))&&await pg.locator('.pb-artlabel',{hasText:'Event poster'}).count()===1,'opens the layout in Make');
 await go(pg,'smalldoor-tools-build');
 v=await askIt(pg,'put a mask on my dog photo');ok(/You already have this/.test(v)&&await pg.getByRole('button',{name:'Open Painterly studio'}).isVisible(),'an existing tool is pointed to');
 v=await askIt(pg,'neon glow backgrounds');ok(/Outside the guideline/.test(v)&&/Neon/.test(v),'off-brand requests say why');
 v=await askIt(pg,'broken target');ok(!/no-such-tool/.test(v)&&/Claude is not available/.test(v),'a bad answer falls back to matching by words');
 ok((await pg.evaluate(()=>window.__prompts[0])).includes('tool "painterly"'),'the check is told the brand’s tools');

 // 6. Requests: the steward sees all, with briefs to copy.
 const reqs=pg.locator('.pb-rc-system .pb-rc-list li');ok(await reqs.count()===2,'requests listed for Primary');
 ok(await reqs.first().getByRole('button',{name:/Copy the brief/}).isVisible(),'each with its brief to copy');
 d=await docs(pg);
 // A client sees only their own, and can withdraw.
 const seed=Object.assign({},d,{'recipes/c1':{brand:'smalldoor',status:'request',name:'Client idea',about:'x',request:'x',by:'client-1',createdAt:Date.now(),updatedAt:Date.now()}});
 pg=await ctxOf({client:true,docs:seed});await go(pg,'smalldoor-tools-build');
 ok(/Your requests/.test(await pg.locator('.pb-rc-system').innerText())&&await pg.locator('.pb-rc-system .pb-rc-list li').count()===1,'a client sees only their own request');
 await pg.getByRole('button',{name:'Withdraw'}).click();await pg.waitForTimeout(1200);
 d=await docs(pg);ok(!d['recipes/c1'],'and can withdraw it');

 // 7. Without Claude: matched by words, and says so.
 pg=await ctxOf({noClaude:true});await go(pg,'smalldoor-tools-build');
 v=await askIt(pg,'event poster for a clinic');ok(/Make can do this/.test(v)&&/not available/.test(v),'without Claude, a layout is matched by its words');
 v=await askIt(pg,'zzzz qqqq');ok(/Worth building/.test(v)&&await pg.locator('#pb-rc-bname').count()===1,'and anything unmatched becomes a brief');

 // 8. Every brand's page draws.
 for(const [h,n] of [['telli-tools-build',2],['aurelius-tools-build',2]]){
  pg=await ctxOf();await go(pg,h);
  const c=await pg.locator('section[aria-labelledby=pb-rc-next] .pb-rc-idea').count(),s=await pg.locator('.pb-rc-idea .pb-slide').count(),cards=await pg.locator('.pb-rc-idea').count();
  ok(c===n&&s===cards,h+': '+c+' ideas, '+s+'/'+cards+' pictures');
 }
 pg=await ctxOf({viewport:{width:390,height:844}});await go(pg,'smalldoor-tools-build');
 const over=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(over<=1,'no sideways scroll at phone width ('+over+')');
 ok(errs.length===0,'no page errors '+errs.join(' | '));
 await b.close();
})();
