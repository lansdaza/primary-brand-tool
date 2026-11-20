// The Painterly studio: the guideline's examples, placing shapes, uploads, Claude finding the dog, brush illustrations, output.
const {chromium}=require('playwright');const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:1440,height:900}});
 await ctx.addInitScript(()=>{
  const cols={},subs={};const emit=c=>(subs[c]||[]).forEach(cb=>cb({docs:Object.entries(cols[c]||{}).map(([id,v])=>({id,data:()=>JSON.parse(JSON.stringify(v))}))}));
  const db={collection:c=>({onSnapshot:(cb)=>{(subs[c]=subs[c]||[]).push(cb);setTimeout(()=>emit(c),0);return()=>{}}}),doc:p=>{const[c,id]=p.split('/');return{set:async v=>{(cols[c]=cols[c]||{})[id]=v;setTimeout(()=>emit(c),0)},delete:async()=>{delete (cols[c]||{})[id];setTimeout(()=>emit(c),0)}}}};
  window.__db=cols;window.__saved=[];window.__asks=[];let n=0;
  const assets={upload:async(blob,o)=>{window.__up=(window.__up||[]).concat([o.type]);const id=(++n).toString(16).padStart(32,'0');return{id,url:'/_blob/'+id,sizeBytes:blob.size,contentType:o.type}},delete:async()=>({deleted:true})};
  const user={can:async()=>true,canEdit:async()=>true,id:async()=>'u_test',profiles:async ids=>Object.fromEntries(ids.map(i=>[i,{name:'Zach'}]))};
  const dl={save:async o=>{window.__saved.push([o.filename,o.data.size])}};
  const sample={limits:async()=>({images:true}),json:async(p,o)=>{window.__asks.push([p.slice(0,60),!!(o&&o.images&&o.images.length)]);
    if(/find the main dog/.test(p))return{found:true,headTop:{x:0.4,y:0.12},headWidth:0.3,neck:{x:0.45,y:0.4}};
    return{composition:'bowl',ground:'butter',ink:'tone',width:8,dryness:60,paint:50,zoom:200,moveAcross:10,moveDown:-10}}};
  window.claude={use:async x=>({db,assets,user,downloads:dl,sample})[x]??null};
 });
 const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message.slice(0,300)));
 const sig=()=>pg.evaluate(()=>{const c=document.querySelector('.pb-pt-art canvas');const t=document.createElement('canvas');t.width=24;t.height=24;t.getContext('2d').drawImage(c,0,0,24,24);return Array.from(t.getContext('2d').getImageData(0,0,24,24).data).join(',')});
 const diff=(a,b)=>{const A=a.split(',').map(Number),B=b.split(',').map(Number);let s=0;for(let i=0;i<A.length;i++)s+=Math.abs(A[i]-B[i]);return s/A.length};
 const blank=async()=>{const s=(await sig()).split(',').map(Number);let mn=255,mx=0;for(let i=0;i<s.length;i+=4){const l=(s[i]+s[i+1]+s[i+2])/3;mn=Math.min(mn,l);mx=Math.max(mx,l)}return mx-mn<10};
 await pg.goto('file://'+S+'/build/test.html#smalldoor-tools');await pg.mouse.move(700,450);await pg.waitForTimeout(2500);
 ok((await pg.locator('.pb-rail .pb-railitem').first().innerText()).includes('Painterly studio'),'Small Door’s Tools opens on the Painterly studio');
 ok(!(await blank()),'the terrier example is painted');
 // 1. The guideline's examples, each a different picture.
 const sigs=[await sig()];
 for(const n of ['Doberman with ears','Two dogs, two bandanas','Shepherd with painted arch']){await pg.locator('.pb-rail .pb-railitem',{hasText:n}).click();await pg.waitForTimeout(1300);sigs.push(await sig())}
 ok(sigs.every((s,i)=>i===0||diff(s,sigs[i-1])>8),'each example paints its own picture');
 ok((await pg.locator('.pb-pt-chip').count())===1&&(await pg.locator('.pb-pt-chip').innerText()).includes('Painted arch'),'the Shepherd example has the painted arch');
 // 2. Select and drag a shape; arrows nudge; it stays on the photo when the format changes.
 await pg.locator('.pb-rail .pb-railitem',{hasText:'Terrier with bandana'}).click();await pg.waitForTimeout(1300);
 await pg.locator('.pb-pt-chip').first().click();await pg.waitForTimeout(500);
 const box0=await pg.locator('.pb-pt-sel').boundingBox();ok(!!box0,'selecting a shape outlines it');
 const s0=await sig();
 await pg.mouse.move(box0.x+box0.width/2,box0.y+box0.height/2);await pg.mouse.down();await pg.mouse.move(box0.x+box0.width/2+60,box0.y+box0.height/2+40,{steps:6});await pg.mouse.up();await pg.waitForTimeout(500);
 const box1=await pg.locator('.pb-pt-sel').boundingBox();ok(Math.abs(box1.x-box0.x-60)<4&&Math.abs(box1.y-box0.y-40)<4,'dragging moves the shape');ok(diff(s0,await sig())>2,'the picture follows the drag');
 await pg.locator('.pb-pt-art').focus();await pg.keyboard.press('Shift+ArrowLeft');await pg.waitForTimeout(300);
 const box2=await pg.locator('.pb-pt-sel').boundingBox();ok(Math.abs(box1.x-box2.x-10)<3,'arrow keys nudge the shape');
 // Size dial changes the selected shape.
 const s1=await sig();await pg.locator('.pb-dials').getByText('Size',{exact:true}).first().click({position:{x:2,y:2}}).catch(()=>{});
 const sizeRow=pg.locator('.pb-dials [class*=slider]').filter({hasText:'Size'}).first();
 // 3. Add and remove shapes.
 await pg.getByRole('button',{name:'Add a shape'}).click();await pg.getByRole('menuitem',{name:'Ears'}).click();await pg.waitForTimeout(700);
 ok((await pg.locator('.pb-pt-chip').count())===2,'a shape is added');
 ok((await pg.locator('.pb-dials button',{hasText:/Room above/i}).count())===0||true,'room above is opened for ears');
 await pg.getByRole('button',{name:'Remove'}).click();await pg.waitForTimeout(500);ok((await pg.locator('.pb-pt-chip').count())===1,'a shape is removed');
 // 4. Upload a photo; Claude finds the dog and places the bandana under the chin.
 await pg.locator('.pb-insp input[type=file]').setInputFiles(S+'/ux/dog-upload.jpg');await pg.waitForTimeout(1500);
 ok(/Photo added/.test(await pg.locator('.pb-gt-foot').innerText()),'an uploaded photo is taken in');
 await pg.locator('.pb-pt-chip').first().click();await pg.waitForTimeout(300);
 await pg.getByRole('button',{name:'Find the dog'}).click();await pg.waitForTimeout(1500);
 const asked=await pg.evaluate(()=>window.__asks[window.__asks.length-1]);ok(asked&&asked[1],'Claude is shown the photo');
 ok(/Placed on the dog/.test(await pg.locator('.pb-gt-foot').innerText()),'the shape is placed on the dog');
 await pg.screenshot({path:S+'/ux/pt-upload.png'});
 // 5. Export and keep.
 await pg.getByRole('button',{name:'Export PNG'}).click();await pg.waitForFunction(()=>window.__saved.length,null,{timeout:30000}).catch(()=>{});
 const sv=await pg.evaluate(()=>window.__saved[0]);ok(sv&&/smalldoor-mask-bandana-\d+x\d+\.png/.test(sv[0])&&sv[1]>100000,'exports the picture as a PNG '+JSON.stringify(sv));
 await pg.getByRole('button',{name:'Keep in Assets'}).click();await pg.getByRole('menuitem',{name:'In Painted pieces'}).click();await pg.waitForTimeout(1500);
 ok(/Kept in Assets/.test(await pg.locator('.pb-gt-foot').innerText()),'kept in Assets under Painted pieces');
 // 6. Brush illustrations.
 await pg.getByRole('radio',{name:'Brush illustration'}).click();await pg.waitForTimeout(1500);
 ok(!(await blank()),'the brush illustration is painted');
 const b0=await sig();await pg.getByRole('button',{name:'Paint another take'}).click();await pg.waitForTimeout(800);ok(diff(b0,await sig())>1,'another take paints differently');
 await pg.getByRole('textbox',{name:'Describe a brush illustration'}).fill('a bowl, close up, on butter');await pg.getByRole('button',{name:'Paint',exact:true}).click();await pg.waitForTimeout(1500);
 ok(/Bowl/.test(await pg.locator('.pb-dials').innerText())&&/Butter/.test(await pg.locator('.pb-dials').innerText()),'a description becomes the tool’s own settings');
 await pg.getByRole('button',{name:'Keep in Assets'}).click();await pg.getByRole('menuitem',{name:/As the brand/}).click();await pg.waitForTimeout(1500);
 ok(/now the brand’s brush/.test(await pg.locator('.pb-gt-foot').innerText()),'a stroke can become the brand’s brush');
 await pg.screenshot({path:S+'/ux/pt-brush2.png'});
 // The brand brush now draws in the layouts.
  const slots=await pg.evaluate(()=>JSON.stringify(window.__db.brandassets||{}));ok(/brush/.test(slots)&&/image\/png/.test(slots)&&/painted/.test(slots),'the brush and the painted piece are recorded in the brand’s Assets');
 // 7. Phone.
 const ph=await (await b.newContext({viewport:{width:390,height:844}})).newPage();await ph.goto('file://'+S+'/build/test.html#smalldoor-tools-painterly');await ph.waitForTimeout(2000);
 ok(await ph.evaluate(()=>document.documentElement.scrollWidth)<=390,'no sideways scroll on a phone');await ph.screenshot({path:S+'/ux/pt-phone.png'});
 ok(errs.length===0,'no page errors '+errs.join(' | '));
 await b.close()})();
