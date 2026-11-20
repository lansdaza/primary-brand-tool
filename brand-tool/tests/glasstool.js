const {chromium}=require('playwright');const fs=require('fs');const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const lit=async pg=>pg.evaluate(()=>{const c=document.querySelector('.pb-gt canvas');const t=document.createElement('canvas');t.width=64;t.height=36;const x=t.getContext('2d');x.drawImage(c,0,0,64,36);const d=x.getImageData(0,0,64,36).data;let mn=255,mx=0,sum=[0,0,0];for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;mn=Math.min(mn,l);mx=Math.max(mx,l);sum[0]+=d[i];sum[1]+=d[i+1];sum[2]+=d[i+2]}return {range:mx-mn,avg:sum.map(v=>Math.round(v/(d.length/4))),w:c.width,h:c.height}});
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 for(const [W,H,scheme] of [[1440,900,'light'],[1440,900,'dark'],[390,844,'light']]){const ctx=await b.newContext({viewport:{width:W,height:H},colorScheme:scheme,acceptDownloads:true});
 await ctx.addInitScript(()=>{window.__saved=[];window.claude={use:async x=>x==='downloads'?{save:async o=>{window.__saved.push([o.filename,o.data&&o.data.size])}}:null}});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+S+'/build/test.html#telli-tools-glass');await pg.waitForTimeout(2500);await pg.mouse.move(W-10,H/2);
 const a=await lit(pg);ok(a.range>40,`glass draws ${W} ${scheme} (range ${a.range}, ${a.w}x${a.h})`);
 if(W>1000){
  const pick=async (grp,v)=>pg.locator('.pb-gtfam',{has:pg.locator('.pb-gtgroup',{hasText:grp})}).locator('.pb-gt-v',{hasText:new RegExp('^'+v+'$')}).click();
  // Hierarchy: one heading, quiet group labels, items named by variant.
  const ty=await pg.evaluate(()=>{const g=document.querySelector('.pb-gtgroup'),i=document.querySelector('.pb-gtfam .pb-railitem'),cs=(e)=>getComputedStyle(e);return {gs:parseFloat(cs(g).fontSize),is:parseFloat(cs(i).fontSize),gc:cs(g).color,ic:cs(i).color,labels:[...document.querySelectorAll('.pb-gtgroup')].map(e=>e.textContent),items:[...document.querySelectorAll('.pb-gtfam .pb-gt-v')].map(e=>e.textContent)}});
  ok(ty.gs<ty.is&&ty.gc!==ty.ic,`group labels smaller and quieter than items (${ty.gs}px vs ${ty.is}px)`);
  ok(new Set(ty.items.filter(x=>x!=='Standard')).size===ty.items.filter(x=>x!=='Standard').length&&!ty.items.some(x=>/,/.test(x)),'items read as variants: '+ty.items.join(' / '));
  ok(await pg.locator('.pb-gt-thumb').count()===13,'each pattern has a thumbnail');
  // Controls only where they mean something.
  const has=async (n)=>pg.evaluate((n)=>[...document.querySelectorAll('.pb-dials *')].some(e=>e.childElementCount===0&&e.textContent.trim().toLowerCase()===n),n);
  ok(await has('logomark')&&await has('edge fade'),'Logo field shows logomark and edge fade');
  await pick('Ring','Burst');await pg.waitForTimeout(1500);const g=await lit(pg);ok(g.avg[1]>g.avg[0]&&g.avg[1]>g.avg[2],'pattern switch sets its colourway (forest) '+g.avg);
  await pg.getByRole('button',{name:'Compare'}).click();await pg.waitForTimeout(600);ok(await pg.getByText('Guideline render').isVisible(),'compare shows the guideline render');
  ok(!(await has('logomark'))&&!(await has('edge fade')),'Ring burst hides logomark and edge fade');
  await pg.screenshot({path:S+`/ux/glass-compare-${scheme}.png`});
  await pg.getByRole('button',{name:'Compare'}).click();
  await pick('Fields','Logo field');await pg.waitForTimeout(1500);
  // Format: the composition is rebuilt, not cropped. A centre crop of 16:9 to 1:1 would keep the middle unchanged.
  const mid=async()=>pg.evaluate(()=>{const c=document.querySelector('.pb-gt canvas');const s=Math.min(c.width,c.height);const t=document.createElement('canvas');t.width=48;t.height=48;const x=t.getContext('2d');x.drawImage(c,(c.width-s)/2,(c.height-s)/2,s,s,0,0,48,48);return [...x.getImageData(0,0,48,48).data]});
  const sel=async(label,val)=>{await pg.locator('.pb-dials button',{hasText:new RegExp('^'+label,'i')}).first().click();await pg.locator('[class*=select-option]',{hasText:new RegExp('^'+val+'$')}).first().click();await pg.waitForTimeout(1500);};
  const m16=await mid();await sel('format','1:1');const m11=await mid();const asp=await pg.evaluate(()=>{const c=document.querySelector('.pb-gt canvas');return c.width/c.height});
  let dd=0;for(let i=0;i<m16.length;i+=4)dd+=Math.abs(m16[i]-m11[i])+Math.abs(m16[i+2]-m11[i+2]);dd/=m16.length/2;
  ok(Math.abs(asp-1)<0.02,'format 1:1 gives a square canvas');ok(dd>3,'1:1 rebuilds the composition rather than cropping (centre differs by '+dd.toFixed(1)+')');
  await sel('format','16:9');
  // Your colourway stays when you change pattern.
  await sel('colourway','Lavender');await pick('Window','Tall');await pick('Window','Standard');
  const cw=await pg.evaluate(()=>document.querySelector('.pb-gt-fig figcaption span').textContent);ok(/Lavender/.test(cw),'picked colourway stays across patterns: '+cw);
  await pick('Fields','Logo field');await sel('colourway','Blue');
  await pg.screenshot({path:S+`/ux/glass-${scheme}.png`});
  if(scheme==='light'){await pg.getByRole('button',{name:'Export PNG'}).click();await pg.waitForFunction(()=>window.__saved.length>0,null,{timeout:60000}).catch(()=>{});const sv=await pg.evaluate(()=>window.__saved);ok(sv.length===1&&/telli-glass-logo-field-blue-2560x1440\.png/.test(sv[0][0])&&sv[0][1]>100000,'export saves a PNG '+JSON.stringify(sv));}
 } else { await pg.screenshot({path:S+'/ux/glass-phone.png',fullPage:false}); const sw=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);ok(sw<=0,'no sideways scroll on phone'); }
 ok(!errs.length,'no page errors '+errs.join('|').slice(0,300));await ctx.close();}
 await b.close();})();
