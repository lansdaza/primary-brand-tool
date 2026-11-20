const {chromium}=require('playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const html='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"><style>body{margin:0}</style></head><body>'+fs.readFileSync(S+'/build/aurelius-live-brand.html','utf8')+'</body></html>';fs.writeFileSync(S+'/build/test.html',html);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const scheme=process.argv[2]||'light';
 const ctx=await b.newContext({viewport:{width:1440,height:900},colorScheme:scheme});
 await ctx.addInitScript(()=>{window.__saved=[];window.claude={use:async(n)=>n==='user'?{can:async()=>true}:n==='downloads'?{save:async(o)=>{window.__saved.push([o.filename,o.data.size||o.data.length])}}:null}});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
 await pg.goto('file://'+S+'/build/test.html#aurelius-guideline');await pg.mouse.move(700,450);await pg.waitForTimeout(1200);
 ok(await pg.locator('.pb-navlist .pb-navitem',{hasText:'Tools'}).count()===1,'Aurelius has a Tools tab');
 await pg.locator('.pb-navlist .pb-navitem',{hasText:'Tools'}).click();await pg.waitForTimeout(3500);
 ok(location=>true,'');
 ok((await pg.evaluate(()=>location.hash))==='#aurelius-tools','tab routes to tools');
 ok(await pg.locator('.pb-tool-scene canvas').count()===1,'globe canvas mounted');
 ok(await pg.locator('.node-label').count()>3,'node labels drawn: '+await pg.locator('.node-label').count());
 await pg.screenshot({path:`${S}/ux/tool-globe-${scheme}.png`});
 // new connection by typing
 await pg.getByRole('button',{name:'New connection'}).click();await pg.waitForTimeout(400);
 await pg.locator('#pb-place-from').fill('Nairo');await pg.waitForTimeout(200);
 ok(await pg.locator('.pb-place-list [role=option]').count()>0,'place search suggests');
 await pg.keyboard.press('Enter');await pg.waitForTimeout(300);
 await pg.locator('#pb-place-to').fill('Mumbai');await pg.keyboard.press('Enter');await pg.waitForTimeout(300);
 await pg.screenshot({path:`${S}/ux/tool-picking-${scheme}.png`});
 await pg.getByRole('button',{name:'Create',exact:true}).click();await pg.waitForTimeout(800);
 const railsText=await pg.locator('.pb-rail').innerText();
 ok(/Nairobi/.test(railsText),'new rail listed');
 ok(await pg.locator('.pb-copy-head',{hasText:'Rail'}).count()===1,'rail editor shown for new rail');
 await pg.screenshot({path:`${S}/ux/tool-rail-${scheme}.png`});
 // rename and change flow
 const nameField=pg.locator('.pb-insp input').first();await nameField.fill('East Africa–India Rail');await pg.waitForTimeout(300);
 ok(/East Africa–India Rail/.test(await pg.locator('.pb-rail').innerText()),'rename reflects in list');
 // city
 await pg.locator('.pb-rail').getByText('London',{exact:true}).click();await pg.waitForTimeout(2500);
 ok(await pg.getByRole('button',{name:'View landmark'}).count()===1,'city focus offers landmark');
 await pg.getByRole('button',{name:'View landmark'}).click();await pg.waitForTimeout(6000);
 await pg.screenshot({path:`${S}/ux/tool-city-${scheme}.png`});
 ok(/Big Ben/.test(await pg.locator('.pb-tool-top').innerText()),'landmark close-up open');
 await pg.getByRole('button',{name:'Export PNG'}).click();await pg.waitForTimeout(2500);
 await pg.keyboard.press('Escape');await pg.waitForTimeout(1500);
 await pg.getByRole('button',{name:'SVG'}).click();await pg.waitForTimeout(3000);
 console.log('saved',JSON.stringify(await pg.evaluate(()=>window.__saved)));
 // Make picks the rails up
 const pkg=await pg.evaluate(()=>0);
 await pg.locator('.pb-navlist .pb-navitem',{hasText:'Make'}).click();await pg.waitForTimeout(2500);
 await pg.locator('.pb-rail').getByText('World graph post').click();await pg.waitForTimeout(3000);
 await pg.locator('.pb-stage').screenshot({path:`${S}/ux/tool-make-${scheme}.png`});
 await pg.locator('.pb-navlist .pb-navitem',{hasText:'Machine'}).click();await pg.waitForTimeout(1500);await pg.locator('.pb-rail').getByText('aurelius.json').click();await pg.waitForTimeout(300);
 ok(/Nairobi/.test(await pg.locator('#pb-main').innerText()),'agent package lists the new rail');
 // particles
 await pg.goto('file://'+S+'/build/test.html#aurelius-tools-particles');await pg.mouse.move(700,450);await pg.waitForTimeout(5000);
 ok(/specks/i.test(await pg.locator('.pb-tool-hud').innerText()),'particle studio builds: '+await pg.locator('.pb-tool-hud').innerText());
 await pg.screenshot({path:`${S}/ux/tool-particles-${scheme}.png`});
 await pg.locator('.pb-rail').getByText('Wordmark').click();await pg.waitForTimeout(4000);
 ok(await pg.locator('.pb-copy-head',{hasText:'Word'}).count()===1,'word field for text shape');
 await pg.screenshot({path:`${S}/ux/tool-word-${scheme}.png`});
 // smalldoor has no tools
 await pg.goto('file://'+S+'/build/test.html#smalldoor-guideline');await pg.mouse.move(700,450);await pg.waitForTimeout(1200);
 ok(await pg.locator('.pb-navlist .pb-navitem',{hasText:'Tools'}).count()===1,'Small Door has a Tools tab');
 await pg.goto('file://'+S+'/build/test.html#smalldoor-tools');await pg.mouse.move(700,450);await pg.waitForTimeout(800);
 ok((await pg.locator('.pb-navitem[aria-current=page]').innerText())==='Tools'&&(await pg.locator('.pb-rail .pb-railitem').first().innerText()).includes('Painterly studio'),'Small Door’s Tools opens on its Painterly studio');
 console.log('errors',JSON.stringify(errs.slice(0,8)));await b.close()})();
