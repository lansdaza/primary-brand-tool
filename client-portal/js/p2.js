const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html='<!doctype html><html><head><meta charset=utf8></head><body>'+fs.readFileSync('../portal/index.html','utf8')+'</body></html>';
const sample=fs.readFileSync('../portal/aurelius-client-sample.json','utf8');
const real=fs.readFileSync('aurelius-client-v1-real.json','utf8');
// shared backend
const store=new Map(), blobs=new Map(), subs=[];let nid=0;
const notify=()=>subs.forEach(s=>s());
const snapDoc=(p)=>({id:p.split('/').pop(),exists:store.has(p),data:()=>store.has(p)?JSON.parse(JSON.stringify(store.get(p))):undefined});
const mkdb=()=>({doc:(p)=>({id:p.split('/').pop(),async get(){return snapDoc(p)},async set(v){store.set(p,JSON.parse(JSON.stringify(v)));setTimeout(notify)},async update(v){if(!store.has(p))throw{code:'not_found'};store.set(p,{...store.get(p),...JSON.parse(JSON.stringify(v))});setTimeout(notify)},onSnapshot(n){const f=()=>n(snapDoc(p));subs.push(f);setTimeout(f);return()=>{}}}),
 collection:(c)=>{const q={doc(){const id='r'+(++nid);return mkdb().doc(c+'/'+id)},orderBy(){return q},onSnapshot(n){const f=()=>n({docs:[...store.keys()].filter(k=>k.startsWith(c+'/')&&k.split('/').length===2).sort().reverse().map(snapDoc)});subs.push(f);setTimeout(f);return()=>{}}};return q}});
function open(hash,{editor,uid,dark}){
 const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(String(e.message||e).slice(0,300)));vc.on('error',e=>errs.push('console '+e));
 const saves=[];
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.test/'+hash,virtualConsole:vc,beforeParse(w){
  w.matchMedia=q=>({matches:!!dark&&/dark/.test(q),addEventListener(){}});
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.scrollTo=function(){};
  w.Blob.prototype.text=function(){return new Promise(r=>{const fr=new w.FileReader();fr.onload=()=>r(fr.result);fr.readAsText(this)})};
  w.fetch=async(u)=>{u=String(u);if(u.includes('aurelius-client-sample.json'))return{ok:true,json:async()=>JSON.parse(sample)};const m=u.match(/_blob\/(\w+)/);if(m&&blobs.has(m[1])){const b=blobs.get(m[1]);return{ok:true,json:async()=>JSON.parse(b.text),blob:async()=>new w.Blob([b.text])}}return{ok:false}};
  const caps={db:mkdb(),downloads:{save:async(o)=>{saves.push(o.filename);return{status:'saved'}}},
   user:{canEdit:async()=>editor,isOwner:async()=>editor,id:async()=>uid,profiles:async(ids)=>Object.fromEntries(ids.map(i=>[i,{name:i==='u1'?'Zach':'Griffin'}]))},
   assets:{upload:async(b,o)=>{const id='a'+(++nid);const text=await b.text();blobs.set(id,{text,type:o?.type||b.type});return{id,url:'/_blob/'+id,sizeBytes:text.length,contentType:o?.type||b.type}}}};
  w.JSZip=class{constructor(){this.n=0}file(){this.n++;return this}folder(){return this}async generateAsync(){return new w.Blob(['zip'])}};w.claude={use:async(n)=>caps[n]||null};
 }});
 return {dom,w:dom.window,d:dom.window.document,errs,saves};
}
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
const txt=(d,s)=>d.querySelector(s)?.textContent.replace(/\s+/g,' ').trim();
const click=(d,label)=>{const b=[...d.querySelectorAll('button')].find(b=>b.textContent.replace(/\s+/g,' ').trim()===label||b.getAttribute('aria-label')===label);if(!b)throw new Error('no button '+label);b.click();return b};
(async()=>{
 const S=open('#book',{editor:true,uid:'u1'});await wait(800);
 console.log('S book:',txt(S.d,'.pb-pagehead'),'| sections',S.d.querySelectorAll('.pb-pb-sec').length,'| rail',S.d.querySelectorAll('.pb-rail .pb-railitem').length);
 console.log('S nav:',[...S.d.querySelectorAll('.pb-navitem')].map(b=>b.textContent.trim()).join(' / '));
 console.log('S top:',[...S.d.querySelectorAll('.pb-top button')].map(b=>b.getAttribute('aria-label')).join(' / '));
 // load real file
 const inp=S.d.getElementById('pp-bookfile');Object.defineProperty(inp,'files',{value:[new S.w.File([real],'aurelius-client-v1.json',{type:'application/json'})],configurable:true});inp.dispatchEvent(new S.w.Event('change'));
 await wait(2500);
 console.log('S after load:',txt(S.d,'.pp-status'),'| head',txt(S.d,'.pb-pagehead p'),'| db book',JSON.stringify(store.get('portal/book')));
 console.log('fonts css len',S.d.getElementById('pp-fonts').textContent.length);
 // client opens
 const C=open('#book',{editor:false,uid:'u2'});await wait(2500);
 console.log('C book:',txt(C.d,'.pb-pagehead p'),'| nav',[...C.d.querySelectorAll('.pb-navitem')].map(b=>b.textContent.trim()).join(' / '));
 console.log('C top:',[...C.d.querySelectorAll('.pb-top button')].map(b=>b.getAttribute('aria-label')).join(' / '));
 // client files
 C.w.location.hash='files';await wait(300);
 console.log('C files sections',C.d.querySelectorAll('.pp-files section').length,'download btns',[...C.d.querySelectorAll('.pb-main button')].filter(b=>b.textContent.includes('Download')).length);
 [...C.d.querySelectorAll('.pb-main button')].find(b=>b.textContent.includes('Download')).click();await wait(500);
 click(C.d,'Download all');await wait(3000);console.log('C saves',C.saves);
 // request
 C.w.location.hash='new';await wait(300);
 const ta=C.d.getElementById('pp-what');ta.value='LinkedIn post about the new office';ta.dispatchEvent(new C.w.Event('input'));
 click(C.d,'LinkedIn');click(C.d,'Instagram');
 const send=click(C.d,'Send request');await wait(800);
 console.log('C after send hash',C.w.location.hash,'|',txt(C.d,'.pb-pagehead'),'|',txt(C.d,'.pp-status'));
 await wait(300);
 // studio sees it
 S.w.location.hash='requests';await wait(400);
 console.log('S requests:',txt(S.d,'.pb-flags'),'| badge',txt(S.d,'.pb-badge'));
 S.d.querySelector('.pp-flagbtn').click();await wait(300);
 click(S.d,'Add options');const of=S.d.getElementById('pp-optfile');Object.defineProperty(of,'files',{value:[new S.w.File(['PNG1'],'post-a.png',{type:'image/png'}),new S.w.File(['PNG2'],'post-b.png',{type:'image/png'})],configurable:true});of.dispatchEvent(new S.w.Event('change'));
 await wait(800);
 console.log('S options',S.d.querySelectorAll('.pp-studio .pp-opt').length,'status',txt(S.d,'.pb-seg [aria-pressed=true]'));
 const cap=S.d.querySelector('.pp-studio .pp-opt textarea');cap.value='New office, same globe.';cap.dispatchEvent(new S.w.Event('change'));await wait(300);
 const m=S.d.getElementById('pp-studio-msg');m.value='Two takes; I recommend the first.';m.dispatchEvent(new S.w.Event('change'));await wait(300);
 click(S.d,'Send to client');await wait(600);
 console.log('S sent:',txt(S.d,'.pp-status'),'| req',JSON.stringify(store.get([...store.keys()].find(k=>k.startsWith('requests/'))).status));
 // client sees ready
 await wait(300);console.log('C badge',txt(C.d,'.pb-badge'),'| page',txt(C.d,'.pb-pagehead'));
 console.log('C options',C.d.querySelectorAll('.pp-opt').length,'| msg',txt(C.d,'.pp-msg'),'| caption',txt(C.d,'.pp-caption'));
 click(C.d,'Approve the recommendation');await wait(600);console.log('C approved:',txt(C.d,'.pp-status'),'|',txt(C.d,'.pb-pagehead .pb-eyebrow'));
 // brief
 C.w.location.hash='brief';await wait(300);
 console.log('C brief',txt(C.d,'.pb-pagehead'),'| qs',C.d.querySelectorAll('.pb-q').length,'| note',txt(C.d,'#pp-briefnote'));
 const q1=C.d.querySelector('.pb-q-input');q1.value=q1.value+' edited';q1.dispatchEvent(new C.w.Event('input'));await wait(1500);
 console.log('C brief saved',txt(C.d,'#pp-briefnote'),'| db',!!store.get('brief/answers'));
 S.w.location.hash='brief';await wait(400);console.log('S brief first answer ends',S.d.querySelector('.pb-q-input').value.slice(-10));
 click(S.d,'Export for Brand Tool');await wait(300);console.log('S saves',S.saves);
 // preview as client
 click(S.d,'Preview as client');await wait(200);console.log('S preview: export btn?',!![...S.d.querySelectorAll('button')].find(b=>b.textContent.includes('Export')));
 // dark
 const D=open('#requests',{editor:false,uid:'u2',dark:true});await wait(1500);console.log('D mode',D.d.querySelector('.graphical-theme').dataset.colorMode,'| flags',D.d.querySelectorAll('.pb-flag').length);
 console.log('errs',S.errs.slice(0,4),C.errs.slice(0,4),D.errs.slice(0,4));process.exit(0);
})().catch(e=>{console.log('FAIL',e);process.exit(1)});
