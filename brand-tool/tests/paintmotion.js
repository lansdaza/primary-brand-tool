// Brush reveal: playing the paint-on in the preview, timing, and video export at one format or the social set.
const {chromium}=require('playwright');const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 await ctx.addInitScript(()=>{window.__saved=[];window.__blobs=[];
  const db={collection:()=>({onSnapshot:(cb)=>{setTimeout(()=>cb({docs:[]}),0);return()=>{}}}),doc:()=>({set:async()=>{},delete:async()=>{}})};
  window.claude={use:async x=>({db,user:{can:async()=>true,canEdit:async()=>true,id:async()=>'u'},downloads:{save:async o=>{window.__saved.push([o.filename,o.data.size]);window.__blobs.push(o.data)}}})[x]??null};
 });
 const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message.slice(0,300)));
 // How much paint is on the canvas: mean distance of each pixel from the ground colour (top-left pixel is ground in the leash preset? use the median colour).
 const ink=()=>pg.evaluate(()=>{const c=document.querySelector('.pb-pt-art canvas');const t=document.createElement('canvas');t.width=64;t.height=64;const x=t.getContext('2d');x.drawImage(c,0,0,64,64);const d=x.getImageData(0,0,64,64).data;const g=[244,245,239];let s=0;for(let i=0;i<d.length;i+=4)s+=Math.abs(d[i]-g[0])+Math.abs(d[i+1]-g[1])+Math.abs(d[i+2]-g[2]);return s/(d.length/4)});
 await pg.goto('file://'+S+'/build/test.html#smalldoor-tools-painterly');await pg.mouse.move(700,450);await pg.waitForTimeout(1800);
 ok(await pg.locator('.pb-pt-motion').count()===0,'no motion controls for the editorial mask');
 await pg.getByRole('radio',{name:'Brush illustration'}).click();await pg.waitForTimeout(1500);
 ok(await pg.locator('.pb-pt-motion').isVisible()&&await pg.getByRole('button',{name:'Play'}).isVisible(),'brush illustrations can be painted on');
 ok(/6\.5 s/.test(await pg.locator('.pb-pt-time').innerText()),'5 s of painting and 1.5 s held by default');
 ok(await pg.locator('.pb-dials').getByText('Paint time').count()>0&&await pg.locator('.pb-dials').getByText('Hold').count()>0,'timing is on the dials');
 const still=await ink();
 await pg.getByRole('button',{name:'Play'}).click();
 await pg.waitForTimeout(150);const i0=await ink();
 await pg.waitForTimeout(1300);const i1=await ink();
 await pg.waitForTimeout(1800);const i2=await ink();
 ok(i0<still*0.35&&i0<i1&&i1<i2&&i2<=still*1.02,`the paint goes on over time (${[i0,i1,i2,still].map(x=>x.toFixed(1)).join(' → ')})`);
 ok(/Stop/.test(await pg.locator('.pb-pt-motion button').first().innerText()),'Play becomes Stop while playing');
 await pg.waitForTimeout(4200);const end=await ink();
 ok(Math.abs(end-still)<0.6&&/Play/.test(await pg.locator('.pb-pt-motion button').first().innerText()),`it ends on the still (${end.toFixed(2)} vs ${still.toFixed(2)})`);
 // Changing the drawing stops a preview.
 await pg.getByRole('button',{name:'Play'}).click();await pg.waitForTimeout(400);
 await pg.getByRole('button',{name:'Paint another take'}).click();await pg.waitForTimeout(500);
 ok(/Play/.test(await pg.locator('.pb-pt-motion button').first().innerText())&&Math.abs((await ink())-still)>0.01,'a new take stops the preview and paints in full');

 // One video at this format.
 const enc=await pg.evaluate(async()=>{try{return typeof VideoEncoder!=='undefined'&&(await VideoEncoder.isConfigSupported({codec:'avc1.640028',width:1080,height:1440,bitrate:5e6,framerate:30})).supported}catch{return false}});
 console.log('  this browser encodes H.264 frame by frame:',enc);
 await pg.getByRole('button',{name:'Export video'}).click();await pg.getByRole('menuitem',{name:/This format/}).click();
 await pg.waitForTimeout(600);ok(/Recording/.test(await pg.locator('.pb-gt-foot').innerText())&&await pg.getByRole('button',{name:'Stop recording'}).isVisible(),'recording shows progress and can be stopped');
 await pg.waitForFunction(()=>window.__saved.length>0,null,{timeout:120000}).catch(()=>{});
 let saved=await pg.evaluate(()=>window.__saved);
 const ext=enc?'mp4':'(mp4|webm)';
 ok(saved.length===1&&new RegExp(`^smalldoor-brush-leash-1080x1440\\.${ext}$`).test(saved[0][0])&&saved[0][1]>20000,'one video at the chosen format '+JSON.stringify(saved));
 const meta=await pg.evaluate(()=>new Promise(ok=>{const v=document.createElement('video');v.muted=true;v.onloadedmetadata=()=>ok([v.videoWidth,v.videoHeight,v.duration]);v.onerror=()=>ok(['error']);v.src=URL.createObjectURL(window.__blobs[0])}));
 ok(meta[0]===1080&&meta[1]===1440,'the file plays at 1080×1440 '+JSON.stringify(meta));
 if(enc)ok(Math.abs(meta[2]-6.5)<0.15,'and runs 6.5 s');
 require('fs').writeFileSync(S+'/shots31/brush.mp4',Buffer.from(await pg.evaluate(async()=>Array.from(new Uint8Array(await window.__blobs[0].arrayBuffer())))));
 const note=await pg.locator('.pb-gt-foot').innerText();ok(enc?/every frame exact/.test(note):/WebM|real time/.test(note),'says honestly what was made: '+note);

 // The social set: post, story and widescreen, in one zip.
 await pg.getByRole('button',{name:'Export video'}).click();await pg.getByRole('menuitem',{name:/Post, story and widescreen/}).click();
 await pg.waitForTimeout(500);ok(/post \(1 of 3\)/.test(await pg.locator('.pb-gt-foot').innerText()),'the set records one size after another');
 await pg.waitForFunction(()=>window.__saved.length>1,null,{timeout:180000}).catch(()=>{});
 saved=await pg.evaluate(()=>window.__saved);
 const names=await pg.evaluate(async()=>{const u=new Uint8Array(await window.__blobs[1].arrayBuffer());const out=[];for(let i=0;i<u.length-30;i++){if(u[i]===0x50&&u[i+1]===0x4b&&u[i+2]===1&&u[i+3]===2){const n=u[i+28]|(u[i+29]<<8);out.push(new TextDecoder().decode(u.slice(i+46,i+46+n)))}}return out});
 ok(saved[1]&&/videos\.zip$/.test(saved[1][0])&&names.length===3&&/1080x1350/.test(names[0])&&/1080x1920/.test(names[1])&&/1920x1080/.test(names[2]),'a zip of three videos '+JSON.stringify(names));
 // Stopping a recording.
 await pg.getByRole('button',{name:'Export video'}).click();await pg.getByRole('menuitem',{name:/Post, story and widescreen/}).click();await pg.waitForTimeout(700);
 await pg.getByRole('button',{name:'Stop recording'}).click();await pg.waitForTimeout(enc?800:1500);
 ok(/Recording stopped/.test(await pg.locator('.pb-gt-foot').innerText())&&(await pg.evaluate(()=>window.__saved.length))===2,'a stopped recording saves nothing');
 await pg.screenshot({path:S+'/shots31/paintmotion.png'});
 ok(errs.length===0,'no page errors '+errs.join(' | '));
 await b.close();
})();
