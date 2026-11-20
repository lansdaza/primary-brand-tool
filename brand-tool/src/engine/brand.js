// @ts-nocheck
// Brand engine: the Aurelius package, its templates and the export pipeline. Everything drawn here is brand
// content and is art-directed by the guideline, not by the tool's interface theme.
import * as WorldGraph from '@/embed/WorldGraph';
import { AD } from './aur-desc.js';
import { recordCanvas } from './video.js';
import { formatParam, FORMAT_ALIAS, legible } from './formats.js';
const IMG=window.__AURELIUS_IMG, LOGO=window.__AURELIUS_LOGO;
const $=(s,r=document)=>r.querySelector(s), esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- The brand package (everything below renders from this) ---------- */
const BRAND={
  meta:{brand:"Aurelius",source:"Aurelius_Brand_Guidelines.pdf",pages:45,edition:"November 2026",extracted:"2026-11-09",basis:{stated:"written in the guideline",measured:"read off a drawing or rendered fill",inferred:"deduced from examples; needs sign-off"}},
  character:["precision","quiet authority","restraint","technically sophisticated","enduring"],
  logo:{
    assets:{lockup:"symbol + wordmark",symbol:"concentric globe mark"},
    rules:[
      {t:"Use the logo in brand black or brand white only",b:"stated",p:9},
      {t:"Dark logo on light grounds, light logo on dark grounds and on imagery",b:"stated",p:9},
      {t:"Keep clear space of half the symbol's height on every side",b:"measured",p:8,value:0.5,unit:"symbol height"},
      {t:"Inside a container, padding may vary with scale but must stay readable",b:"stated",p:7}],
    never:["Stretch, rotate, crop or distort","Use unapproved colours","Reduce the opacity","Add dramatic effects","Outline","Rearrange symbol and wordmark"]
  },
  color:{
    neutrals:[{name:"Bone",hex:"#F6F5F2"},{name:"Chalk",hex:"#EDECE9"},{name:"Ash",hex:"#DBD9D4"},{name:"Pumice",hex:"#C9C5BE"},{name:"Stone",hex:"#B7B2A9"},{name:"Slate",hex:"#716C62"},{name:"Char",hex:"#201E1A"},{name:"Ink",hex:"#100F0D"}],
    pairs:[{name:"Tide",light:"#BCD3D7",deep:"#005D6F"},{name:"Dusk",light:"#BDBDD6",deep:"#000067"},{name:"Moss",light:"#C6CEAE",deep:"#2B3C00"},{name:"Clay",light:"#ECB791",deep:"#7B3200"}],
    balance:{neutral:82,secondary:18},
    rules:[
      {t:"Neutrals dominate every application",b:"stated",p:12},
      {t:"Roughly 82% neutral to 18% secondary across a system",b:"measured",p:14},
      {t:"Secondary colour is for data, diagrams and supporting graphics, used sparingly",b:"stated",p:13},
      {t:"A pastel pairs with the deep tone of its own hue",b:"inferred",p:38}]
  },
  type:{
    families:{sans:{name:"Roobert",standIn:"Figtree"},mono:{name:"Roobert SemiMono",standIn:"DM Mono"}},
    styles:[
      {id:"tag",name:"Tags & eyebrows",family:"mono",weight:"Regular",tracking:"0%",leading:"90%",extra:"Uppercase, pill container, padding 5 15 6 15",sample:"About Aurelius"},
      {id:"headline",name:"Headlines",family:"sans",weight:"Regular",tracking:"-5%",leading:"90%+",sample:"A living picture of\na connected world."},
      {id:"subhead",name:"Subheads",family:"sans",weight:"Regular",tracking:"-3%",leading:"110%",sample:"Aurelius connects global information to help organizations and artificial intelligence make better decisions."},
      {id:"body",name:"Body",family:"sans",weight:"Regular",tracking:"0%",leading:"130%+",sample:"Aurelius is a decision-making infrastructure company. We build information rails that let governments make better decisions globally."},
      {id:"button",name:"Buttons",family:"sans",weight:"Medium",tracking:"0%",leading:"n/a",sample:"Learn more"}]
  },
  imagery:{
    photography:{p:23,look:["cinematic landscapes","atmospheric lighting","rich, tactile textures","deep shadows","warm, subdued highlights","restrained earth tones"],madeWith:"Midjourney, with existing brand imagery as reference",prompt:"a hillside filed with rolling hills, and flowers in the foreground. in the distance is a mountain range. deep blues, greens, and warm neutrals throughout the composition. high contrast. --hd --ar 16:9"},
    particle:{p:21,look:["thousands of fine particles","landscapes, infrastructure, recognizable forms","monochromatic","high contrast","dimensional depth"],madeWith:"Midjourney",prompt:"a fighter jet made of tiny solid particles --ar 16:9 --hd"},
    worldGraph:{p:20,note:"Custom tool: particle globe with nodes and sweeping lines; adjustable connections, treatments and colour modes",nodes:null,rails:null}
  },
  graphics:{
    coreShape:{p:26,elements:["circular forms","intersecting arcs","connected nodes","solid and dashed strokes"],strokePx:[0.5,8],rules:[{t:"Stroke weight varies from 0.5px to 8px",b:"stated",p:26},{t:"Shapes support content and never overpower it",b:"stated",p:28}]},
    texture:{p:29,rule:"Subtle grain over photography, graphics, type and backgrounds"},
    softGlass:{p:30,use:"Stacked cards, layered information, data groupings; used sparingly",neutral:{fill:"#F6F5F3",fillOpacity:0.01,stroke:"#B7B2A9",strokePx:0.5,blur:[10,20]},tinted:{fill:"#BDBDD6",fillOpacity:0.02,stroke:"#000067",strokePx:0.5,blur:[10,20]}}
  },
  icons:{p:36,grid:"12×12",rule:"Bold, simplified forms; negative space and intersections echo the symbol"},
  flags:[
    {id:"sec-hex",sev:"fix",p:13,title:"Secondary pastel hex labels do not match their swatches",says:"Labels read #D8B4FC, #360D5F, #A9C6FF, #003F95",uses:"The rendered fills: #BCD3D7, #BDBDD6, #C6CEAE, #ECB791. The second is confirmed by the soft glass spec on p.30.",why:"An agent trusting the labels would produce purples and blues that appear nowhere else in the brand."},
    {id:"niteshift",sev:"fix",p:7,title:"Copy from another project on the icon page",says:"“reinforcing Niteshift’s identity”, an app labelled Niteshift, footer dated JUNE 26",uses:"Left out of the package."},
    {id:"typo",sev:"fix",p:30,title:"Likely typo in the soft glass example",says:"IPENTITY API",uses:"Not carried over."},
    {id:"fonts",sev:"need",p:16,title:"Font files and a web licence are needed",says:"Roobert and Roobert SemiMono, with a download link the PDF does not carry",uses:"Figtree and DM Mono stand in, unless Roobert is installed on the viewer's machine."},
    {id:"texture",sev:"need",p:29,title:"Texture and World Graph tool live outside the PDF",says:"“This texture can be found in the layers of this file”; the tool is a link",uses:"A generated grain stands in. The World Graph tool now lives in this brand (Tools), compiled from its own source; its particle style uses a stand-in brightness map until earth-lum.jpg is supplied."},
    {id:"bone",sev:"check",p:12,title:"Lightest neutral has two values",says:"#F6F5F2 on p.12; #F6F5F3 on p.30 and in the rendered fills",uses:"#F6F5F2, the labelled value."},
    {id:"placeholder",sev:"check",p:43,title:"Complex deck slides carry another company's figures",says:"“AIP continues to drive US commercial momentum”",uses:"The layout became a template; the content was left out."},
    {id:"sizes",sev:"infer",p:17,title:"No type sizes, only tracking and leading",says:"Five styles with weight, tracking and leading",uses:"Template sizes are proportions read off the application pages."},
    {id:"pairs",sev:"infer",p:13,title:"No written rule for text on secondary colours",says:"“Pairings of muted pastels and deeper, saturated tones”",uses:"Pastel ground takes its deep tone as ink and the reverse, as on the social posts (p.38)."},
    {id:"names",sev:"infer",p:12,title:"Colours have no names",says:"Hex, RGB and CMYK only",uses:"Working names (Bone, Stone, Tide, Dusk…) so people and agents can refer to them."},
    {id:"clear",sev:"infer",p:8,title:"Clear space is drawn but not written",says:"A diagram with four corner blocks",uses:"Measured from the drawing: half the symbol height."}]
};
BRAND.imagery.worldGraph.nodes=null;const N=Object.fromEntries(BRAND.color.neutrals.map(c=>[c.name,c.hex])), P=Object.fromEntries(BRAND.color.pairs.map(c=>[c.name,c]));
/* Tones: the only ground/ink combinations a template may use. */
const TONES={
  bone:{name:"Bone",g:N.Bone,i:N.Ink,m:N.Slate,g2:N.Ash,kind:"neutral"},
  stone:{name:"Stone",g:N.Stone,i:N.Ink,m:N.Char,g2:N.Pumice,kind:"neutral"},
  ink:{name:"Char",g:N.Char,i:N.Bone,m:N.Stone,g2:N.Ink,kind:"neutral"},
  "bone-dusk":{name:"Bone, Dusk ink",g:N.Bone,i:P.Dusk.deep,m:P.Dusk.deep,g2:P.Dusk.light,kind:"neutral"}
};
for(const c of BRAND.color.pairs){const k=c.name.toLowerCase();
  TONES[k+"-light"]={name:c.name+" light",g:c.light,i:c.deep,m:c.deep,g2:N.Bone,kind:"secondary"};
  TONES[k+"-deep"]={name:c.name+" deep",g:c.deep,i:N.Bone,m:c.light,g2:c.light,kind:"secondary"};}
const ALLTONES=Object.keys(TONES), NEUTRALS=["bone","stone","ink"];

/* ---------- Drawing helpers ---------- */
const sym=(h,extra='')=>`<svg class="a-sym" viewBox="0 0 ${LOGO.symbol.w} ${LOGO.symbol.h}" style="height:${h};width:auto;${extra}"><path d="${LOGO.symbol.d}"/></svg>`;
const lockup=(h,extra='')=>`<svg class="a-sym" viewBox="0 0 ${LOGO.lockup.w} ${LOGO.lockup.h}" style="height:${h};width:auto;${extra}"><path d="${LOGO.lockup.d}"/></svg>`;
function rng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function coreShape(kind,seed=3){
  const r=rng(seed*977+11), c=(x,y,R,w=.6,d='')=>`<circle cx="${x}" cy="${y}" r="${R}" fill="none" stroke="currentColor" stroke-width="${w}"${d?` stroke-dasharray="${d}"`:''}/>`, n=(x,y,R=2.2)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${R}" fill="currentColor"/>`;
  let o='', vb='0 0 200 200';
  if(kind==='orbit'){o+=c(100,100,80,.5,'1.2 3.2');
    for(let k=0;k<3;k++){const ry=18+r()*52, rot=r()*180, a=rot*Math.PI/180;o+=`<ellipse cx="100" cy="100" rx="80" ry="${ry.toFixed(1)}" transform="rotate(${rot.toFixed(1)} 100 100)" fill="none" stroke="currentColor" stroke-width=".5"${k==1?' stroke-dasharray="1.2 3.2"':''}/>`;
      for(const t of [r()*6.28,r()*6.28]){const x=80*Math.cos(t),y=ry*Math.sin(t);o+=n(100+x*Math.cos(a)-y*Math.sin(a),100+x*Math.sin(a)+y*Math.cos(a))}}
    o+=c(100,100,10,.5)}
  else if(kind==='eclipse'){const off=14+r()*26;o+=c(100-off,100,72,.8)+c(100+off,100,72,.8)+c(100+off*.4,100,13+r()*8,1.8)+n(100+off*.4,100,2.4)+`<line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" stroke-width=".5" stroke-dasharray="1.2 3.2"/>`}
  else if(kind==='sphere'){o+=c(100,100,86,2.4)+c(100,100,81,.5);for(let k=0;k<5;k++)o+=`<ellipse cx="100" cy="100" rx="81" ry="${(12+r()*60).toFixed(1)}" transform="rotate(${(r()*180).toFixed(1)} 100 100)" fill="none" stroke="currentColor" stroke-width=".5"/>`}
  else{vb='0 0 400 200';o+=`<rect x="6" y="6" width="388" height="188" rx="94" fill="none" stroke="currentColor" stroke-width=".6"/><rect x="16" y="16" width="368" height="168" rx="84" fill="none" stroke="currentColor" stroke-width="3"/>`+c(108,100,62,.6,'1.2 3.2')+c(292,100,62,.6,'1.2 3.2');
    for(const [x,y] of [[-13,-13],[13,-13],[-13,13],[13,13]])o+=n(108+x,100+y,10);
    for(const [x,y] of [[0,0],[-20,0],[20,0],[0,-20],[0,20],[-40,0],[40,0],[0,-40],[0,40]])o+=n(292+x,100+y,8.5);
    for(let k=-2;k<=2;k++)o+=`<line x1="188" y1="${100+k*11}" x2="212" y2="${100+k*11}" stroke="currentColor" stroke-width="1"/>`}
  return `<svg viewBox="${vb}" style="width:100%;height:100%;overflow:visible">${o}</svg>`;
}
// A standalone .svg file from an inline one: one style attribute (a second one makes the file
// invalid, so it won't open as an image), the namespace, and a real size from the viewBox.
function svgFile(svg,color){
  const vb=(svg.match(/viewBox="([^"]+)"/)||[])[1]||'0 0 200 200',[, ,w,h]=vb.split(/\s+/).map(Number);
  return svg.replace(/<svg\b[^>]*>/,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w*2}" height="${h*2}" style="color:${color};overflow:visible">`);
}
const grain=on=>on?'<div class="a-grain"></div>':'';
/* ---------- World Graph: the brand tool's own renderer (three.js), compiled from its source and mounted into templates. Any frame can be drawn on demand with renderAt(t). ---------- */
const GLOBE_BACK=['world graph','guideline picture'];
const LOOP=8, MOTION_OK=!matchMedia('(prefers-reduced-motion: reduce)').matches, WGLIB=WorldGraph;
const VIEW={Atlantic:-45,Americas:-95,'Europe and Africa':15,'Asia Pacific':125};
const wg=(o,style,slot='make',dpr=1)=>`<div class="a-wg" data-slot="${slot}" data-dpr="${dpr}" data-wg="${esc(JSON.stringify(o))}" style="${style}"></div>`;
const hex2=c=>c[0]==='#'?c:'#'+c.match(/\d+(\.\d+)?/g).slice(0,3).map(v=>Math.round(+v).toString(16).padStart(2,'0')).join('');
const mix=(a,b,k)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-k)+parseInt(b.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
const WGP={};let wgRAF=0;
/* Rails drawn by every World Graph in layouts, slides and video. The brand's World Graph tool sets them; until then the tool's seed rails. */
let WG_RAILS=null;
const railPkg=rs=>rs.map(r=>({name:r.name,type:r.type,from:{node:r.a.name,place:r.a.place,lat:r.a.lat,lng:r.a.lng},to:{node:r.b.name,place:r.b.place,lat:r.b.lat,lng:r.b.lng}}));
export function setWorldRails(rs){WG_RAILS=Array.isArray(rs)&&rs.length?rs:null;BRAND.imagery.worldGraph.rails=railPkg(WG_RAILS||WGLIB?.WORLD_GRAPH_DEFAULTS.rails||[]);mountWG()}
export const worldRails=()=>WG_RAILS||WGLIB?.WORLD_GRAPH_DEFAULTS.rails||[];
const wgT0=performance.now();
function mountWG(){cancelAnimationFrame(wgRAF);if(!WGLIB)return;const live=[];
  document.querySelectorAll('.a-wg[data-slot]').forEach(ph=>{if(!ph.offsetWidth)return;const slot=ph.dataset.slot,o=JSON.parse(ph.dataset.wg),cs=getComputedStyle(ph),ink=hex2(cs.color),g=hex2(cs.getPropertyValue(o.ground==='g2'?'--g2':'--g').trim());
    let h=WGP[slot];
    try{if(!h){const el=document.createElement('div');el.style.cssText='position:absolute;inset:0';ph.append(el);h=WGP[slot]={el,api:WGLIB.mountWorldGraph(el,{dpr:+ph.dataset.dpr||1})}}else if(h.el.parentNode!==ph)ph.append(h.el)}catch(e){return}
    h.o=o;h.api.update({...(WG_RAILS?{rails:WG_RAILS}:{}),style:o.mode,labels:!!o.labels,drawOn:true,facing:{lat:o.lat??23,lng:o.lon},distance:o.dist||4.05,spin:o.spin??2.1,palette:{bg:g,water:mix(g,ink,.13),dot:mix(g,ink,.72),speck:mix(g,ink,.85),arc:ink,dim:mix(g,ink,.6),node:ink}});live.push(h)});
  if(!live.length)return;let n=0;const tick=()=>{const t=((performance.now()-wgT0)/1000)%LOOP;let moving=false;for(const h of live){const on=h.o.motion&&MOTION_OK;moving=moving||on;h.api.renderAt(on?t:4.5)}if(moving||++n<240)wgRAF=requestAnimationFrame(tick)};tick()}

/* ---------- Templates: each declares its dials, like a params contract ---------- */
const SOCIAL=formatParam(['portrait','square','tall'],'4:5');
const TEX={type:'toggle',label:'Grain texture',default:true};
const T=[
 {id:'social-graph',name:'World graph post',kind:'Social · motion',src:20,minText:1.25,use:'A statement over the live world graph; exports as a still or an 8-second clip',u:(w,h)=>w/80,live:p=>true,
  params:{headline:{type:'textarea',label:'Headline',max:60,default:'A living picture of\na connected world.'},tag:{type:'text',label:'Tag',max:28,default:'World graph'},graph:{type:'select',label:'Globe style',options:{particles:1,dots:1},default:'particles'},facing:{type:'pad',label:'Facing',x:[-45,-180,180,1],y:[23,-60,75,1],labels:{x:'Lng',y:'Lat'},default:{x:-45,y:23}},distance:{type:'range',label:'Distance',min:2.4,max:5,step:0.1,default:3.2},spin:{type:'range',label:'Spin',min:0,max:12,step:0.5,default:4},labels:{type:'toggle',label:'Node labels',default:true},motion:{type:'toggle',label:'Motion',default:true},tone:{type:'tone',label:'Tone',options:['ink','bone','stone','tide-deep','moss-deep','dusk-deep'],default:'ink'},format:SOCIAL,texture:TEX},
  draw:p=>`${wg({mode:p.graph,lon:p.facing.x,lat:p.facing.y,labels:p.labels,motion:p.motion,dist:p.distance,spin:p.spin},'left:-14%;width:128%;bottom:-9%;height:80%')}
    <div style="position:absolute;left:calc(var(--u)*6);top:calc(var(--u)*6);right:calc(var(--u)*6)">${p.tag?`<div class="a-tag" style="font-size:calc(var(--u)*1.25);margin-bottom:calc(var(--u)*2.4)">${esc(p.tag)}</div>`:''}<div class="a-h" style="font-size:calc(var(--u)*7.2)">${esc(p.headline)}</div></div>
    <div style="position:absolute;right:calc(var(--u)*6);bottom:calc(var(--u)*6)">${sym('calc(var(--u)*4.2)')}</div>`},
 {id:'social-stat',name:'Stat ring',kind:'Social',src:38,minText:1.8,use:'One number with a short explanation',u:(w,h)=>w/80,
  params:{value:{type:'text',label:'Number',max:6,default:'92%'},label:{type:'text',label:'Label',max:28,default:'Deployed AI'},body:{type:'textarea',label:'Supporting line',max:170,default:'Every enterprise model, agent, and workflow demands information from outside their own walls. Incumbents carry years of debt trying to deliver it.'},tone:{type:'tone',label:'Tone',options:['bone-dusk','dusk-light','moss-light','tide-light','clay-light','bone','ink'],default:'bone-dusk'},format:SOCIAL,texture:TEX},
  draw:p=>`<div class="a-abs" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*5);padding:calc(var(--u)*7)">
    <div style="position:relative;width:calc(var(--u)*46);height:calc(var(--u)*46);flex:none"><svg viewBox="0 0 200 200" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"><circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" stroke-width=".4" stroke-dasharray="1 3"/><circle cx="100" cy="2" r="3.4" fill="currentColor"/></svg>
    <div class="a-h a-abs" style="display:flex;align-items:center;justify-content:center;font-size:calc(var(--u)*${Math.min(19,62/Math.max(3,p.value.length)).toFixed(1)})">${esc(p.value)}</div></div>
    <div style="text-align:center;max-width:calc(var(--u)*48)"><div class="a-sub" style="font-weight:500;font-size:calc(var(--u)*2.7)">${esc(p.label)}</div><div class="a-body" style="font-size:calc(var(--u)*1.8);margin-top:calc(var(--u)*1.4)">${esc(p.body)}</div></div></div>`},
 {id:'social-number',name:'Number on map',kind:'Social',src:38,minText:1.25,use:'A market or growth figure with its source',u:(w,h)=>w/80,
  params:{title:{type:'text',label:'Title',max:40,default:'Enterprise LLM Budget Growth'},sub:{type:'text',label:'Qualifier',max:40,default:'Across All Projects'},value:{type:'text',label:'Number',max:6,default:'+75%'},source:{type:'text',label:'Source',max:28,default:'A16Z (2025)'},tone:{type:'tone',label:'Tone',options:['moss-deep','clay-deep','tide-deep','dusk-deep','ink'],default:'moss-deep'},format:SOCIAL,texture:TEX},
  draw:p=>`<div class="a-mask" style="--src:var(--map);color:var(--m);left:-12%;right:-12%;top:20%;height:56%;opacity:.9"></div>
    <div style="position:absolute;left:calc(var(--u)*6);top:calc(var(--u)*6);max-width:calc(var(--u)*40)"><div class="a-sub" style="font-size:calc(var(--u)*3.6)">${esc(p.title)}</div><div class="a-body" style="font-size:calc(var(--u)*1.7);margin-top:calc(var(--u)*1.2);opacity:.8">${esc(p.sub)}</div></div>
    <div class="a-h" style="position:absolute;left:calc(var(--u)*5);bottom:calc(var(--u)*5);font-size:calc(var(--u)*${Math.min(27,108/Math.max(3,p.value.length)).toFixed(1)})">${esc(p.value)}</div>
    <div class="a-mono" style="position:absolute;right:calc(var(--u)*6);bottom:calc(var(--u)*6.4);font-size:calc(var(--u)*1.25)">${esc(p.source)}</div>`},
 {id:'social-product',name:'Product card',kind:'Social',src:38,minText:1.25,use:'Name a product or capability with one line and a tag',u:(w,h)=>w/80,
  params:{title:{type:'text',label:'Title',max:32,default:'Aurelius Collection'},sub:{type:'text',label:'Line',max:70,default:'Deployed sensors and secured access globally.'},tag:{type:'text',label:'Tag',max:34,default:'More revenue – denser graph'},shape:{type:'select',label:'Core shape',options:{capsule:1,orbit:1,eclipse:1,sphere:1},default:'capsule'},tone:{type:'tone',label:'Tone',options:['stone','bone','ink','tide-light','dusk-light'],default:'stone'},format:SOCIAL,texture:TEX},
  draw:p=>`<div style="position:absolute;left:calc(var(--u)*6);top:calc(var(--u)*6);right:calc(var(--u)*6)"><div class="a-sub" style="font-size:calc(var(--u)*3.6)">${esc(p.title)}</div><div class="a-body" style="font-size:calc(var(--u)*1.9);margin-top:calc(var(--u)*1.2);max-width:calc(var(--u)*44)">${esc(p.sub)}</div>${p.tag?`<div class="a-tag fill" style="font-size:calc(var(--u)*1.25);margin-top:calc(var(--u)*2.4)">${esc(p.tag)}</div>`:''}</div>
    <div style="position:absolute;left:calc(var(--u)*6);right:calc(var(--u)*6);bottom:calc(var(--u)*7);height:calc(var(--u)*34);display:flex;justify-content:center">${coreShape(p.shape,5)}</div>`},
 {id:'deck-split',name:'Split slide',kind:'Deck',src:42,minText:1.5,use:'Opening or statement slide: headline, a short passage, and the globe',u:(w,h)=>h/100,
  params:{format:formatParam(['landscape'],'16:9'),headline:{type:'textarea',label:'Headline',max:70,default:'Give your AI more\nof the world to\nwork with.'},body:{type:'textarea',label:'Passage',max:520,default:'Aurelius is a decision-making infrastructure company. We build information rails that let governments make better decisions globally.\n\nOver the last decade, governments have spent billions on analytical and operational platforms. Now, they are hitting the boundary of what internal data and classified collection can accomplish alone.'},graphic:{type:'select',label:'Globe',options:{'world graph':1,'guideline picture':1},default:'world graph'},motion:{type:'toggle',label:'Motion',default:true},tone:{type:'tone',label:'Tone',options:['bone','ink','stone'],default:'bone'},texture:TEX},live:p=>p.graphic==='world graph'||p.motion,
  draw:p=>`<div class="a-abs" style="display:flex"><div style="width:46%;padding:calc(var(--u)*6);display:flex;flex-direction:column;justify-content:space-between"><div class="a-h" style="font-size:calc(var(--u)*6.6)">${esc(p.headline)}</div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:calc(var(--u)*4)">${sym('calc(var(--u)*5.4)')}<div class="a-body" style="font-size:calc(var(--u)*1.5);width:calc(var(--u)*36);white-space:pre-line">${esc(p.body)}</div></div></div>
    <div style="flex:1;position:relative;background:var(--g2);overflow:hidden">${p.graphic==='guideline picture'&&!p.motion?`<div class="a-mask" style="--src:var(--globe);inset:9% 6%;opacity:.8"></div><div class="a-abs" style="padding:6%">${coreShape('eclipse',2)}</div>`:wg({mode:'particles',lon:-45,labels:true,motion:p.motion,dist:3.5,spin:3,ground:'g2'},'inset:0;width:100%;height:100%')}</div></div>`},
 {id:'deck-metrics',name:'Metric row',kind:'Deck',src:43,minText:1.3,use:'Up to five figures side by side under one claim',u:(w,h)=>h/100,
  params:{format:formatParam(['landscape'],'16:9'),tag:{type:'text',label:'Tag',max:24,default:'Q3 Momentum'},headline:{type:'textarea',label:'Headline',max:80,default:'Bring the outside world\ninto your next decision.'},metrics:{type:'list',label:'Figures',item:'figure',min:1,max:5,fields:[{key:'value',label:'Figure',max:7,hint:'+75%'},{key:'label',label:'Label',max:32,hint:'What the figure measures'}],default:[{value:'+75%',label:'Enterprise LLM budget growth'},{value:'92%',label:'Across all projects'},{value:'1.6x',label:'Sample figure'},{value:'$1.18B',label:'Sample figure'}]},tone:{type:'tone',label:'Tone',options:['bone','ink','stone','dusk-light'],default:'bone'},texture:TEX},
  draw:(p,w,h)=>{const ms=p.metrics.slice(0,5).map(m=>[m.value,m.label]),inner=w/(h/100)-14-5.2-0.6,d=Math.min(30,(inner-(ms.length-1)*3)/Math.max(1,ms.length));
    return `<div class="a-abs" style="padding:calc(var(--u)*7);display:flex;flex-direction:column;justify-content:space-between"><div><div style="display:flex;justify-content:space-between;align-items:flex-start">${p.tag?`<div class="a-tag" style="font-size:calc(var(--u)*1.3)">${esc(p.tag)}</div>`:'<div></div>'}${sym('calc(var(--u)*4.4)')}</div><div class="a-h" style="font-size:calc(var(--u)*7.4);margin-top:calc(var(--u)*4)">${esc(p.headline)}</div></div>
    <div style="display:flex;gap:calc(var(--u)*3);justify-content:flex-start;border:1px dashed var(--m);padding:calc(var(--u)*2.6)">${ms.map(m=>`<div style="width:calc(var(--u)*${d.toFixed(1)});height:calc(var(--u)*${d.toFixed(1)});border:1.5px solid currentColor;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:calc(var(--u)*.9);padding:calc(var(--u)*2.4);flex:none"><div class="a-h" style="font-size:calc(var(--u)*${(d*Math.min(.26,.95/Math.max(3,m[0].length))).toFixed(2)})">${esc(m[0])}</div><div class="a-body" style="font-size:calc(var(--u)*1.5);max-width:84%">${esc(m[1]||'')}</div></div>`).join('')}</div></div>`}},
 {id:'headline',name:'Headline over world',kind:'Out of home',src:44,minText:9.4,use:'A single line for billboards, link cards and covers',u:(w,h)=>Math.sqrt(w*h)/148,
  params:{headline:{type:'textarea',label:'Headline',max:60,default:'A broader view of what’s at stake.'},backdrop:{type:'select',label:'Backdrop',options:{'world graph':1,'guideline picture':1,ridge:1,forest:1,wave:1},default:'world graph'},motion:{type:'toggle',label:'Motion',default:true},tone:{type:'tone',label:'Tone',options:['stone','bone','ink','moss-deep','tide-deep'],default:'stone'},format:formatParam(['banner','landscape','square'],'billboard'),texture:TEX},
  toneOf:p=>GLOBE_BACK.includes(p.backdrop)?p.tone:'ink',photoGround:p=>!GLOBE_BACK.includes(p.backdrop),live:p=>p.backdrop==='world graph'||(p.backdrop==='guideline picture'&&p.motion),
  draw:(p,w,h)=>{const live=p.backdrop==='world graph'||(p.backdrop==='guideline picture'&&p.motion),photo=!GLOBE_BACK.includes(p.backdrop);
    const back=photo?`<img src="${IMG[p.backdrop]}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"><div class="a-abs" style="background:#100F0D;opacity:.28"></div>`
      :`<svg class="a-abs" viewBox="0 0 ${w} ${h}" style="width:100%;height:100%;color:var(--g2)">${[.16,.3,.44,.62,.8].map(k=>`<ellipse cx="${w/2}" cy="${h/2}" rx="${w*k}" ry="${h*.92}" fill="none" stroke="currentColor" stroke-width="${h/420}"/>`).join('')}<line x1="0" x2="${w}" y1="${h/2}" y2="${h/2}" stroke="currentColor" stroke-width="${h/420}"/></svg>${live?wg({mode:'particles',lon:-45,labels:false,motion:p.motion,dist:3.3,spin:3},'inset:0;width:100%;height:100%;opacity:.75'):'<div class="a-mask" style="--src:var(--globe);inset:5% 0;opacity:.5"></div>'}`;
    return back+`<div class="a-abs" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*3.2);padding:calc(var(--u)*8);text-align:center"><div class="a-h" style="font-size:calc(var(--u)*9.4);max-width:100%">${esc(p.headline)}</div>${sym('calc(var(--u)*4)')}</div>`}}
];
const defaults=t=>Object.fromEntries(Object.entries(t.params).map(([k,d])=>[k,d.default]));

const sizeOf=(t,p)=>t.size||t.params.format.options[p.format];
function tplHTML(t,p){const B=t.B, [w,h]=sizeOf(t,p), tone=B.TONES[t.toneOf?t.toneOf(p):p.tone];
  return `<div class="a" data-brand="${B.id}" style="width:${w}px;height:${h}px;--u:${t.u(w,h).toFixed(3)}px;--g:${tone.g};--i:${tone.i};--m:${tone.m};--g2:${tone.g2}">${t.draw(p,w,h)}${grain(p.texture)}</div>`}
/* Keep only declared dials, allowed options and lengths. Used for anything that arrives from outside the panel. */
/* A list param declares its item fields, a character limit for each, and how many items the layout holds.
   Items are objects ({value, label}), or for a table whose columns come from another list, {cells:[…], group?}.
   Older saved values written as "a | b" lines are read the same way. */
function listOf(d,v,p){
  const lines=typeof v==='string'?v.split('\n').filter(l=>l.trim()).map(l=>l.split('|').map(s=>s.trim())):Array.isArray(v)?v:null;
  if(!lines)return null;
  const cols=d.cellsFrom?Math.max(1,(p?.[d.cellsFrom]||[]).length):0;
  const items=lines.map(r=>{
    if(d.cellsFrom){const cells=Array.isArray(r)?r:Array.isArray(r?.cells)?r.cells:[];const group=Array.isArray(r)?r.length===1&&!!d.groups:!!r?.group&&!!d.groups;
      const lim=i=>i===0?(d.firstMax??d.cellMax):d.cellMax;
      return group?{group:true,cells:[String(cells[0]??'').slice(0,lim(0))]}:{cells:Array.from({length:cols},(_,i)=>String(cells[i]??'').slice(0,lim(i)))}}
    return Object.fromEntries(d.fields.map((f,i)=>[f.key,String((Array.isArray(r)?r[i]:r?.[f.key])??'').slice(0,f.max)]))});
  return items.slice(0,d.max)}
function sanitize(t,raw){const p=defaults(t);if(t.migrate&&raw)raw=t.migrate(raw);if(raw&&t.params.format&&raw.format!=null&&!(raw.format in t.params.format.options)&&FORMAT_ALIAS[raw.format])raw={...raw,format:FORMAT_ALIAS[raw.format]};
  // Lists whose cells follow another list are read after it, so they know how many columns there are.
  const order=Object.entries(t.params).sort(([,a],[,b])=>(a.cellsFrom?1:0)-(b.cellsFrom?1:0));
  for(const [k,d] of order){const v=raw?.[k];if(v==null){if(d.cellsFrom)p[k]=listOf(d,p[k],p)||p[k];continue}
  if(d.type==='list'){const items=listOf(d,v,p);if(items&&items.length>=(d.min??0))p[k]=items}
  else if(d.type==='text'||d.type==='textarea')p[k]=String(v).slice(0,d.max);
  else if(d.type==='tone'){if(d.options.includes(v))p[k]=v}
  else if(d.type==='select'){if(v in d.options)p[k]=v}
  else if(d.type==='toggle')p[k]=!!v
  else if(d.type==='data'){const c=v&&typeof v==='object'&&!Array.isArray(v)?(d.clean?d.clean(v):v):null;if(c)p[k]=c}
  else if(d.type==='range'){const n=Number(v);if(Number.isFinite(n))p[k]=Math.min(d.max,Math.max(d.min,n))}
  else if(d.type==='pad'){const x=Number(v?.x),y=Number(v?.y);if(Number.isFinite(x)&&Number.isFinite(y))p[k]={x:Math.min(d.x[2],Math.max(d.x[1],x)),y:Math.min(d.y[2],Math.max(d.y[1],y))}}}
  return p}

const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
let hasRoobert=false;try{const cx=document.createElement('canvas').getContext('2d');cx.font='72px monospace';const a=cx.measureText('Aurelius gy').width;cx.font='72px "Roobert",monospace';hasRoobert=Math.abs(cx.measureText('Aurelius gy').width-a)>.5}catch(e){}
async function raster(el,w,h){const wrap=document.createElement('div'),st=document.createElement('style');const bid=(el.dataset?.brand?el:el.querySelector?.('[data-brand]'))?.dataset.brand;st.textContent=$('#tplcss').textContent+($('#brandcss-'+bid)?.textContent||'')+($('#brandassets-'+bid)?.textContent||'');wrap.append(st,el);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(wrap)}</foreignObject></svg>`;
  const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();await new Promise(r=>setTimeout(r,200));return img}
/* Live images: a layout can draw an image that is made after it is drawn (the telli glass). It shows a stand-in at once,
   is filled in when ready, and anything that renders a file waits for it at full size. */
const LIVE={kinds:{},ids:new Map(),keys:new Map(),cache:new Map(),busy:new Map()};
const BLANK='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
export function registerLive(kind,fn){LIVE.kinds[kind]=fn}
export function liveImg(kind,spec,w,h,standIn,style=''){const key=kind+'|'+Math.round(w)+'x'+Math.round(h)+'|'+JSON.stringify(spec);let id=LIVE.keys.get(key);
  if(!id){id='lv'+LIVE.keys.size.toString(36);LIVE.keys.set(key,id);LIVE.ids.set(id,{kind,spec,w:Math.round(w),h:Math.round(h),key})}
  const hit=LIVE.cache.get(key);return `<img class="a-ph a-live" data-live="${id}"${hit?' data-ready=""':''} src="${hit||standIn||BLANK}" alt="" style="${style}">`}
function liveURL(id){const e=LIVE.ids.get(id);if(!e||!LIVE.kinds[e.kind])return Promise.resolve(null);if(LIVE.cache.has(e.key))return Promise.resolve(LIVE.cache.get(e.key));
  if(!LIVE.busy.has(e.key))LIVE.busy.set(e.key,Promise.resolve().then(()=>LIVE.kinds[e.kind](e.spec,e.w,e.h)).then(u=>{if(u){LIVE.cache.set(e.key,u);while(LIVE.cache.size>36)LIVE.cache.delete(LIVE.cache.keys().next().value)}return u}).catch(()=>null).finally(()=>LIVE.busy.delete(e.key)));
  return LIVE.busy.get(e.key)}
export function mountLive(root=document){root.querySelectorAll('img.a-live:not([data-ready])').forEach(img=>liveURL(img.dataset.live).then(u=>{if(u&&img.dataset.live){img.src=u;img.setAttribute('data-ready','')}}))}
export async function resolveLive(root){await Promise.all([...root.querySelectorAll('img.a-live')].map(async img=>{const u=await liveURL(img.dataset.live);if(!u)throw new Error('live image');img.src=u;img.setAttribute('data-ready','')}))}
async function toPNG(root,scale=1){const el=root.cloneNode(true),w=parseFloat(el.style.width),h=parseFloat(el.style.height);el.style.transform='';await resolveLive(el);
  const src=root.querySelectorAll('.a-wg');el.querySelectorAll('.a-wg').forEach((c,i)=>{const im=document.createElement('img'),h=WGP[src[i].dataset.slot];if(h)im.src=h.api.snapshot().toDataURL();im.className='a-wg';im.setAttribute('style',c.getAttribute('style'));c.replaceWith(im)});
  const img=await raster(el,w,h),c=document.createElement('canvas');c.width=w*scale;c.height=h*scale;c.getContext('2d').drawImage(img,0,0,w*scale,h*scale);
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('empty')),'image/png'))}
/* Video: everything under the globe and everything over it are rasterized once; each frame draws under, globe at time t, over. */
async function toVideo(root){const cv=root.querySelector('.a-wg'),hd=WGP[cv.dataset.slot],w=parseFloat(root.style.width),h=parseFloat(root.style.height);
  const rr=root.getBoundingClientRect(),cr=cv.getBoundingClientRect(),k=rr.width/w,path=[];for(let n=cv;n!==root;n=n.parentNode)path.unshift([...n.parentNode.children].indexOf(n));
  const layer=over=>{const c=root.cloneNode(true);c.style.transform='';if(over)c.style.background='transparent';let n=c;
    for(const i of path){[...n.children].forEach((ch,j)=>{if(over?j<i:j>i)ch.style.visibility='hidden'});n=n.children[i];if(n.classList.contains('a-wg'))n.style.visibility='hidden';else if(over)n.style.background='transparent'}return c};
  const [under,over]=[await raster(layer(false),w,h),await raster(layer(true),w,h)];
  const comp=document.createElement('canvas');comp.width=w;comp.height=h;const x=comp.getContext('2d'),alpha=+getComputedStyle(cv).opacity||1;cancelAnimationFrame(wgRAF);
  const frame=t=>{hd.api.renderAt(t);x.clearRect(0,0,w,h);x.drawImage(under,0,0);x.globalAlpha=alpha;x.drawImage(hd.api.snapshot(),(cr.left-rr.left)/k,(cr.top-rr.top)/k,cr.width/k,cr.height/k);x.globalAlpha=1;x.drawImage(over,0,0)};
  /* The globe draws any moment on request (renderAt), so each frame is drawn and encoded in turn: smooth at 30 fps on any machine, even one without a GPU. */
  try{return await recordCanvas(comp,{frames:LOOP*30,fps:30,draw:i=>frame(i/30)})}finally{mountWG()}}
BRAND.imagery.worldGraph.rails=railPkg(WGLIB?.WORLD_GRAPH_DEFAULTS.rails||[]);BRAND.imagery.worldGraph.note='Custom tool, part of this brand: particle globe with nodes and sweeping rails, landmark city close-ups, and a particle studio. Rails set in the tool are the ones every World Graph layout draws.';delete BRAND.imagery.worldGraph.nodes;/* ---------- Asset slots ----------
   A brand declares the files its guideline names but does not contain (font files, vector logos, a texture).
   An upload fills a slot: fonts become @font-face rules under the family name the brand's type already asks for,
   images replace the CSS variable the layouts draw, so guideline pages, layouts, decks and exports all change
   at once. A review item a slot answers closes itself once the slot is filled (and, for fonts, licensed). */
export const LICENCES={trial:'Trial',desktop:'Desktop',web:'Web'};
const slotOf=(B,id)=>(B.slots||[]).find(s=>s.id===id);
const filled=(B,id)=>(B.ASSETS?.[id]?.files||[]).length>0;
export function fontState(B,id){const v=B.ASSETS?.[id];if(!(v?.files||[]).length)return null;return v.licence||'trial'}
export function slotStatus(B,s){if(!filled(B,s.id))return s.standIn?'stand-in':'missing';return s.kind==='font'?(B.ASSETS[s.id].licence||'trial')==='trial'?'trial':'supplied':'supplied'}
export function flagStatus(B,f){
  const r=B.REVIEW?.[f.id];if(r)return{state:'accepted',by:r.by,at:r.at};
  const slots=(B.slots||[]).filter(s=>s.resolves===f.id);if(!slots.length)return{state:'open'};
  const need=slots.filter(s=>s.required!==false),have=need.filter(s=>filled(B,s.id));
  if(have.length<need.length)return{state:'open',slots:slots.map(s=>s.id),progress:have.length?`${have.length} of ${need.length} files added`:''};
  const trial=need.filter(s=>s.kind==='font'&&(B.ASSETS[s.id].licence||'trial')==='trial');
  if(trial.length)return{state:'open',slots:slots.map(s=>s.id),progress:`Trial files added for ${trial.map(s=>s.label).join(' and ')}. Set a desktop or web licence before delivery.`};
  return{state:'auto',slots:slots.map(s=>s.id),note:`Closed by Assets: ${need.map(s=>s.label).join(', ')}`};
}
const esc1=v=>String(v).replace(/["\\\n<>]/g,'');
export function applyAssets(B,assets){
  B.ASSETS=assets||{};let css='';
  for(const s of B.slots||[]){const v=B.ASSETS[s.id];if(!(v?.files||[]).length)continue;
    if(s.kind==='font')for(const f of v.files){if(f.data)css+=`@font-face{font-family:"${esc1(s.family)}";src:url("${f.data}");font-weight:${+f.weight||400};font-style:${f.style==='italic'?'italic':'normal'};font-display:block}`}
    else if(s.cssVar&&v.files[0].data){const f=v.files[0];css+=`.a.a[data-brand="${B.id}"]{${s.cssVar}:url("${f.data}")${s.ratioVar&&f.ratio?`;${s.ratioVar}:${+f.ratio}`:''}}`}
    if(s.css)css+=s.css}
  let el=document.getElementById('brandassets-'+B.id);
  if(!el){el=document.createElement('style');el.id='brandassets-'+B.id;(document.getElementById('brandcss-'+B.id)?.parentNode||document.head).append(el)}
  el.textContent=css;B.PACKAGE=packageOf(B);
}
export function applyReview(B,map){B.REVIEW=map||{};B.PACKAGE=packageOf(B)}
const assetsPkg=B=>(B.slots||[]).map(s=>({id:s.id,label:s.label,kind:s.kind,...(s.family?{family:s.family}:{}),use:s.use,required:s.required!==false,status:slotStatus(B,s),...(s.standIn?{standIn:s.standIn}:{}),
  ...(s.kind==='font'&&filled(B,s.id)?{licence:B.ASSETS[s.id].licence||'trial',...((B.ASSETS[s.id].licence||'trial')==='trial'?{deliverable:false,note:'Trial files: for design only, not for delivery'}:{})}:{}),
  files:(B.ASSETS?.[s.id]?.files||[]).map(f=>({name:f.name,type:f.type,...(f.weight?{weight:+f.weight}:{}),...(f.style?{style:f.style}:{})}))}));
function packageOf(B){return {...B.BRAND,flags:B.BRAND.flags.map(f=>{const st=flagStatus(B,f);return{...f,status:st.state==='auto'?'resolved by assets':st.state==='accepted'?'accepted':'open'}}),assets:assetsPkg(B),tones:Object.fromEntries(Object.entries(B.TONES).map(([k,t])=>[k,{name:t.name,ground:t.g,ink:t.i,muted:t.m,kind:t.kind}])),templates:B.T.map(describe),slides:B.SL.map(describe)}}
const listSpec=d=>({minItems:d.min??0,maxItems:d.max,item:d.cellsFrom?{cells:`one string per entry of "${d.cellsFrom}": the first ${d.firstMax??d.cellMax} characters at most, the others ${d.cellMax}`,...(d.groups?{group:'true for a group heading row, which has one cell'}:{})}:Object.fromEntries(d.fields.map(f=>[f.key,{label:f.label,maxChars:f.max}]))});
const describe=t=>({id:t.id,name:t.name,kind:t.kind,source:t.src,shared:!!t.shared,use:t.use,...(t.params.format?.families?{families:t.params.format.families}:{}),size:t.size||t.params.format.options,params:Object.fromEntries(Object.entries(t.params).filter(([,d])=>d.type!=='data').map(([k,d])=>[k,d.type==='list'?{type:'list',label:d.label,...listSpec(d),default:d.default}:{type:d.type,...(d.max?{max:d.max}:{}),...(d.min!==undefined?{min:d.min}:{}),...(d.options?{options:Array.isArray(d.options)?d.options:Object.keys(d.options)}:{}),default:d.default}]))});
export function checks(t,p){const B=t.B,tone=B.TONES[t.toneOf?t.toneOf(p):p.tone],cr=contrast(tone.g,tone.i),photo=t.photoGround?.(p);
  return [{ok:true,name:'Colour',text:photo?'Brand photograph with light type':`${tone.name}: an approved ground and ink`},
    photo?{ok:true,name:'Contrast',text:'Photograph darkened under light type'}:{ok:cr>=4.5,name:'Contrast',text:`${cr.toFixed(1)}:1 ink on ground${cr>=4.5?'':' (large type only)'}`},
    B.balanceCheck(tone),B.typeCheck()]}
export const canVideo=(t,p)=>!!(t.live&&t.live(p)&&p.motion&&window.MediaRecorder&&WGLIB);
const spec=t=>({id:t.id,kind:t.kind,use:t.use,params:Object.fromEntries(Object.entries(t.params).filter(([,d])=>d.type!=='data').map(([k,d])=>[k,d.type==='tone'?{oneOf:d.options}:d.type==='select'?{oneOf:Object.keys(d.options)}:d.type==='toggle'?{boolean:true}:d.type==='range'?{number:[d.min,d.max]}:d.type==='pad'?{x:[d.x[1],d.x[2]],y:[d.y[1],d.y[2]]}:d.type==='list'?{list:d.label,...listSpec(d),example:d.default}:{text:d.label,maxChars:d.max,example:d.default}]))});
export function deckPrompt(outline,B){
  return `You draft a slide deck for ${B.name} by choosing slide layouts from a fixed library and filling in their parameters.\n\n${B.voice}\n\nSlide layouts:\n${JSON.stringify(B.SL.map(spec))}\n\nOutline: """${outline}"""\n\nRules: 3 to 10 slides, opening with a title or opening layout; one idea per slide; vary the layouts; use only listed parameters and allowed values; respect maxChars; a list parameter is a JSON array of item objects with exactly the listed fields, between minItems and maxItems long; never invent statistics, prices, dates, names or sources, so where the outline gives none write a bracketed placeholder such as [figure] or [source]. Return only JSON: {"name":"<deck title, 60 characters at most>","slides":[{"layout":"<id>","params":{...}}]}`}
export function briefPrompt(brief,B){
  const lib=B.T.map(spec);
  return `You draft on-brand assets for ${B.name} by choosing one template from a fixed library and filling in its parameters.\n\n${B.voice}\n\nTemplate library:\n${JSON.stringify(lib)}\n\nRequest: """${brief}"""\n\nRules: use only listed parameters and allowed values; respect maxChars; a list parameter is a JSON array of item objects with exactly the listed fields, between minItems and maxItems long; never invent statistics, prices, dates, addresses or sources, so if the request gives none choose a template that needs none or keep the template's sample values. Return only JSON: {"template":"<id>","params":{...},"why":"<one sentence on the choice>"}`}

/* ---------- Shared across brands ---------- */
export function hasFont(name){try{const cx=document.createElement('canvas').getContext('2d');cx.font='72px monospace';const a=cx.measureText('Hamburg gy 0123').width;cx.font=`72px "${name}",monospace`;return Math.abs(cx.measureText('Hamburg gy 0123').width-a)>.5}catch(e){return false}}
const FORMATS={'4:5':[1080,1350],'1:1':[1080,1080],'9:16':[1080,1920],'16:9':[1920,1080]};
/* Layouts any brand can use. They draw only from tokens, the brand's mark, its tones and its photographs. */
function sharedTemplates(c){
  const frameParam=Object.keys(c.frames).length>1?{frame:{type:'select',label:'Frame',options:c.frames,default:c.defaults.frame}}:{};
  return [
  {id:'statement',name:'Statement',kind:'Shared layout',src:c.src.statement,shared:true,minText:1.35,use:'One line with the mark, for a post, story, cover or header',u:(w,h)=>w/h>2.1?h/40:Math.min(w,h)/80,
   params:{headline:{type:'textarea',label:'Headline',max:70,default:c.defaults.headline},eyebrow:{type:'text',label:'Eyebrow',max:32,default:c.defaults.eyebrow},footer:{type:'text',label:'Footer',max:44,default:c.defaults.footer},...frameParam,tone:{type:'tone',label:'Tone',options:c.tones,default:c.defaults.tone},format:formatParam(['portrait','square','tall','landscape','banner'],'4:5'),texture:TEX},
   draw:(p,w,h)=>{if(w/h>2.1){const size=Math.min(7,Math.max(3.4,130/Math.max(12,p.headline.length))),k=w/(h/40);
     return `<div class="a-abs" style="display:flex;align-items:center;gap:calc(var(--u)*5);padding:0 calc(var(--u)*5)"><div style="flex:none;display:flex;flex-direction:column;gap:calc(var(--u)*1.6);align-items:flex-start">${c.mark('calc(var(--u)*5.4)')}${p.eyebrow?`<div class="a-tag" style="font-size:calc(var(--u)*1.35)">${esc(p.eyebrow)}</div>`:''}</div><div class="a-h" style="flex:1;min-width:0;font-size:calc(var(--u)*${size.toFixed(2)})">${esc(p.headline)}</div>${p.footer&&k>110?`<div class="a-body" style="flex:none;max-width:calc(var(--u)*22);font-size:calc(var(--u)*1.5);text-align:right">${esc(p.footer)}</div>`:''}</div>`}
     const size=Math.min(8.4,Math.max(4.6,150/Math.max(12,p.headline.length))),
     inner=`<div style="display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*2.2)">${c.mark('calc(var(--u)*5.2)')}${p.eyebrow?`<div class="a-tag" style="font-size:calc(var(--u)*1.35)">${esc(p.eyebrow)}</div>`:''}</div><div class="a-h" style="font-size:calc(var(--u)*${size.toFixed(2)});max-width:100%">${esc(p.headline)}</div><div class="a-body" style="font-size:calc(var(--u)*1.7);min-height:1em">${esc(p.footer)}</div>`,
     box='display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;padding:calc(var(--u)*7)',wrap=c.frames[p.frame];
     return typeof wrap==='function'?wrap(inner,box,c.TONES[p.tone]):`<div class="a-abs" style="${box}">${inner}</div>`}},
  {id:'quote',name:'Quote',kind:'Shared layout',src:c.src.quote,shared:true,minText:1.2,use:'A quotation or statement with attribution and an optional photograph',u:(w,h)=>w>h?h/100:w/80,
   params:{eyebrow:{type:'text',label:'Eyebrow',max:28,default:c.defaults.quoteEyebrow},quote:{type:'textarea',label:'Quote',max:320,default:c.defaults.quote},name:{type:'text',label:'Name',max:40,default:c.defaults.quoteName},role:{type:'text',label:'Role',max:48,default:c.defaults.quoteRole},photo:{type:'select',label:'Photograph',options:{none:1,...Object.fromEntries(Object.keys(c.photos).map(k=>[k,1]))},default:c.defaults.photo},tone:{type:'tone',label:'Tone',options:c.tones,default:c.defaults.quoteTone},format:formatParam(['landscape','portrait','square','tall'],'16:9'),texture:TEX},
   draw:(p,w,h)=>{const wide=w>h,ph=c.photos[p.photo],size=Math.min(wide?6.2:5.4,Math.max(2.6,(wide?46:36)/Math.sqrt(Math.max(20,p.quote.length))));
     const text=`<div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;justify-content:space-between;padding:calc(var(--u)*${wide?6:5.5})"><div>${p.eyebrow?`<div class="a-tag fill" style="font-size:calc(var(--u)*1.2);margin-bottom:calc(var(--u)*3)">${esc(p.eyebrow)}</div>`:''}<div class="a-h" style="font-size:calc(var(--u)*${size.toFixed(2)})">${esc(p.quote)}</div></div><div style="display:flex;align-items:flex-end;justify-content:space-between;gap:calc(var(--u)*3)"><div><div class="a-sub" style="font-size:calc(var(--u)*1.9)">${esc(p.name)}</div><div class="a-body" style="font-size:calc(var(--u)*1.3);opacity:.75">${esc(p.role)}</div></div>${c.mark('calc(var(--u)*3.6)')}</div></div>`;
     const pic=ph?`<div style="position:relative;${wide?'width:48%':'height:44%'};flex:none;margin:calc(var(--u)*1.4);border-radius:var(--ph-r,0px);overflow:hidden"><img class="a-ph" src="${ph}" alt=""></div>`:'';
     return `<div class="a-abs" style="display:flex;flex-direction:${wide?'row':'column-reverse'}">${text}${pic}</div>`}}
  ,
  /* The app icon: the brand's mark on one of its grounds, full bleed. The platform rounds the corners and crops avatars to a circle, so the mark sits well inside the middle. It is the master the icon set, profile photos and favicons are made from. */
  {id:'app-icon',name:'App icon',kind:'Shared layout',src:'shared',shared:true,use:'The mark on a brand ground: the app icon, profile photo and favicon master',u:(w,h)=>Math.min(w,h)/80,
   params:{tone:{type:'tone',label:'Tone',options:c.iconTones??c.tones,default:c.defaults.iconTone??c.defaults.tone},mark:{type:'select',label:'Mark size',options:{small:1,medium:1,large:1},default:c.defaults.iconMark??'medium'},format:formatParam(['icon'],'app-icon'),texture:{...TEX,default:false}},
   draw:(p,w,h)=>{const k={small:.3,medium:.38,large:.47}[p.mark]??.38,m=(c.iconMark??c.mark)(`${(h*k*(c.iconScale??1)).toFixed(1)}px`,'display:block');
     return `<div class="a-abs" style="display:flex;align-items:center;justify-content:center">${m}</div>`}},
  {id:'figure',name:'Big number',kind:'Shared layout',src:'shared',shared:true,minText:1.4,use:'One figure with what it measures and its source, at any size',u:(w,h)=>w/h>2.1?h/36:Math.min(w,h)/80,
   params:{tag:{type:'text',label:'Tag',max:28,default:c.defaults.figureTag??'In numbers'},figure:{type:'text',label:'Figure',max:8,default:c.defaults.figure??'82%'},label:{type:'textarea',label:'What it measures',max:90,default:c.defaults.figureLabel??'of the system stays neutral, by design.'},source:{type:'text',label:'Source',max:60,default:c.defaults.figureSource??''},tone:{type:'tone',label:'Tone',options:c.tones,default:c.defaults.figureTone??c.defaults.tone},format:formatParam(['portrait','square','tall','landscape','banner'],'4:5'),texture:TEX},
   draw:(p,w,h)=>{const U=Math.min(w,h)/80,ku=w/h>2.1?h/36:U,W=w/ku,H=h/ku,n=Math.max(2,[...p.figure].length),wide=w/h>1.09,banner=w/h>2.1;
     const fig=banner?Math.min(H*0.62,(W*0.34)/(n*0.58)):wide?Math.min(H*0.5,(W*0.5)/(n*0.58)):Math.min(H*0.32,(W-12)/(n*0.58));
     const head=`<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:calc(var(--u)*3)">${p.tag?`<div class="a-tag" style="font-size:calc(var(--u)*1.4)">${esc(p.tag)}</div>`:'<span></span>'}${c.mark('calc(var(--u)*4.4)')}</div>`;
     const src=p.source?`<div class="a-body" style="font-size:calc(var(--u)*1.4);opacity:.7">${esc(p.source)}</div>`:'';
     const num=`<div class="a-h" style="font-size:calc(var(--u)*${fig.toFixed(2)});line-height:.9;letter-spacing:-.04em;white-space:nowrap">${esc(p.figure)}</div>`;
     const lab=s=>`<div class="a-sub" style="font-size:calc(var(--u)*${s})">${esc(p.label)}</div>`;
     if(banner)return `<div class="a-abs" style="display:flex;align-items:center;gap:calc(var(--u)*4);padding:0 calc(var(--u)*4)">${num}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(var(--u)*1.2)">${lab(2.6)}${src}</div>${c.mark('calc(var(--u)*5)')}</div>`;
     if(wide)return `<div class="a-abs" style="display:flex;flex-direction:column;justify-content:space-between;padding:calc(var(--u)*6)">${head}<div style="display:flex;align-items:flex-end;gap:calc(var(--u)*5)">${num}<div style="flex:1;min-width:0;padding-bottom:calc(var(--u)*1)">${lab(3)}</div></div>${src||'<span></span>'}</div>`;
     return `<div class="a-abs" style="display:flex;flex-direction:column;justify-content:space-between;padding:calc(var(--u)*6)">${head}<div style="display:flex;flex-direction:column;gap:calc(var(--u)*3)">${num}${lab(3.4)}</div>${src||'<span></span>'}</div>`}},
  {id:'cover',name:'Headline and photo',kind:'Shared layout',src:'shared',shared:true,minText:1.3,use:'A headline, a short passage and a photograph, laid out for any size',u:(w,h)=>w/h>2.1?h/36:Math.min(w,h)/80,
   params:{tag:{type:'text',label:'Tag',max:28,default:c.defaults.coverTag??c.defaults.eyebrow??''},headline:{type:'textarea',label:'Headline',max:64,default:c.defaults.coverHeadline??c.defaults.headline},body:{type:'textarea',label:'Passage',max:140,default:c.defaults.coverBody??c.defaults.quote},photo:{type:'select',label:'Photograph',options:Object.fromEntries(Object.keys(c.photos).map(k=>[k,1])),default:c.defaults.photo},tone:{type:'tone',label:'Tone',options:c.tones,default:c.defaults.quoteTone??c.defaults.tone},format:formatParam(['portrait','square','tall','landscape','banner'],'4:5'),texture:TEX},
   draw:(p,w,h)=>{const r=w/h,banner=r>2.1,wide=r>1.09,ph=c.photos[p.photo],len=Math.max(14,p.headline.length);
     const hs=banner?Math.min(5.4,Math.max(3.2,150/len)):wide?Math.min(7,Math.max(4.2,230/len)):r<0.62?Math.min(8,Math.max(5,280/len)):Math.min(8,Math.max(4.6,260/len));
     const text=`<div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;justify-content:space-between;gap:calc(var(--u)*3);padding:calc(var(--u)*${banner?3.4:5.6})"><div style="display:flex;flex-direction:column;gap:calc(var(--u)*2.4);align-items:flex-start">${p.tag?`<div class="a-tag" style="font-size:calc(var(--u)*1.3)">${esc(p.tag)}</div>`:''}<div class="a-h" style="font-size:calc(var(--u)*${hs.toFixed(2)})">${esc(p.headline)}</div>${p.body&&!banner?`<div class="a-body" style="font-size:calc(var(--u)*1.7);max-width:calc(var(--u)*46)">${esc(p.body)}</div>`:''}</div>${c.mark(`calc(var(--u)*${banner?3.6:4.2})`)}</div>`;
     const pic=ph?`<div style="position:relative;flex:none;${banner?'width:38%':wide?'width:50%':r<0.62?'height:52%':r>0.92?'height:44%':'height:48%'};overflow:hidden;border-radius:var(--ph-r,0px)"><img class="a-ph" src="${ph}" alt=""></div>`:'';
     return `<div class="a-abs" style="display:flex;flex-direction:${wide?'row':'column-reverse'}">${text}${pic}</div>`}}
  ]}
/* A slide layout is a template fixed at 1920 by 1080. asSlide turns an existing layout into one by pinning some dials (format, motion) and removing options that cannot be shown in a deck. */
const SLIDE=[1920,1080];
function asSlide(t,pin={},drop={},over={}){const params=Object.fromEntries(Object.entries(t.params).filter(([k])=>!(k in pin)&&k!=='format').map(([k,d])=>[k,drop[k]?(()=>{const options=Object.fromEntries(Object.entries(d.options).filter(([o])=>!drop[k].includes(o)));return {...d,options,default:d.default in options?d.default:Object.keys(options)[0]}})():d])),m=p=>({...p,...pin});
  return {...t,...over,id:'sl-'+t.id,size:SLIDE,params,live:undefined,draw:(p,w,h)=>t.draw(m(p),w,h),toneOf:t.toneOf&&(p=>t.toneOf(m(p))),photoGround:t.photoGround&&(p=>t.photoGround(m(p)))}}
function finishBrand(B){B.SL=B.SL||[];for(const t of B.T)legible(t);for(const t of [...B.T,...B.SL]){t.B=B;if(typeof t.src==='number')t.src='p.'+t.src}B.TBY=Object.fromEntries(B.T.map(t=>[t.id,t]));B.SLBY=Object.fromEntries(B.SL.map(t=>[t.id,t]));B.PACKAGE=packageOf(B);return B}

/* ---------- Aurelius as a brand record ---------- */
T.push(...sharedTemplates({src:{statement:'p.44',quote:'p.18'},TONES,tones:['ink','bone','stone','tide-deep','moss-deep','dusk-light'],frames:{plain:1},photos:{ridge:IMG.ridge,forest:IMG.forest,wave:IMG.wave},mark:sym,iconTones:['ink','bone','stone','tide-deep','moss-deep','dusk-deep','clay-deep'],
  defaults:{iconTone:'ink',headline:'A broader view of\nwhat’s at stake.',eyebrow:'About Aurelius',footer:'Decision-making infrastructure',tone:'ink',quoteEyebrow:'About Aurelius',quote:'Aurelius connects global information to help organizations and artificial intelligence make better decisions.',quoteName:'Aurelius',quoteRole:'Decision-making infrastructure',photo:'ridge',quoteTone:'bone',figureTag:'Colour balance',figure:'82%',figureLabel:'of an Aurelius system stays neutral. Secondary colour is kept for data.',figureSource:'Aurelius brand guidelines, p.14',coverTag:'About Aurelius',coverHeadline:'A living picture of a connected world.',coverBody:'Aurelius connects global information to help organizations and artificial intelligence make better decisions.'}}));
const AA=(cls,style,inner)=>`<div class="a ${cls}" data-brand="aurelius" style="${style}">${inner}</div>`;
const atile=(g,i,inner,cap,extra='')=>AA('pb-tile',`--g:${g};--i:${i};${extra}`,inner+(cap?`<span class="cap">${cap}</span>`:''));
const aimg=(k,alt)=>`<div class="pb-tile"><img src="${IMG[k]}" alt="${alt}"></div>`;
/* ---------- Guideline: chapters of sections. Each section has what a person sees (exhibit, the source's own description,
   files, values to copy) and what a machine reads (rules with their basis, data, prompts, open questions). ---------- */
const rgbOf=hex=>{const n=parseInt(hex.slice(1),16);return `${n>>16}, ${(n>>8)&255}, ${n&255}`};
const slugOf=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const swatchOf=(c,cmyk={})=>({name:c.name,hex:c.hex,rgb:rgbOf(c.hex),...(cmyk[c.hex.toUpperCase()]?{cmyk:cmyk[c.hex.toUpperCase()]}:{})});
const cssVars=list=>`:root {\n${list.map(c=>`  --${slugOf(c.name)}: ${c.hex};`).join('\n')}\n}`;
const typeCss=(styles,face)=>styles.map(s=>`.${slugOf(s.name)} {\n  font-family: ${face(s)};\n  letter-spacing: ${/^-?[\d.]+%/.test(s.tracking)?(parseFloat(s.tracking)/100)+'em':'normal'};\n  line-height: ${/^[\d.]+%/.test(s.leading)?parseFloat(s.leading)/100:'normal'};\n}`).join('\n');
// CMYK as printed on p.12 and p.13. The four pastels have no entry: their printed labels belong to other colours (see the review queue).
const CMYK={'#F6F5F2':'0, 0, 2, 4','#EDECE9':'0, 0, 2, 7','#DBD9D4':'0, 1, 3, 14','#C9C5BE':'0, 2, 5, 21','#B7B2A9':'0, 3, 8, 28','#716C62':'0, 4, 13, 56','#201E1A':'0, 6, 19, 87','#100F0D':'0, 6, 19, 94','#005D6F':'100, 16, 0, 56','#000067':'100, 100, 0, 60','#2B3C00':'28, 0, 100, 76','#7B3200':'0, 59, 100, 52'};
const svgDoc=(w,h,d,fill)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="${fill}"><path d="${d}"/></svg>`;
function aureliusGuide(seed){const ty=BRAND.type,ph=BRAND.imagery.photography,pa=BRAND.imagery.particle,g=BRAND.graphics;
  const sample=s=>s.id==='tag'?`<span class="a-tag" style="font-size:12px">${s.sample}</span>`:s.id==='headline'?`<div class="a-h" style="font-size:clamp(34px,5.4vw,72px)">${s.sample}</div>`:s.id==='subhead'?`<div class="a-sub" style="font-size:clamp(19px,2.2vw,26px);max-width:32em">${s.sample}</div>`:s.id==='body'?`<div class="a-body" style="font-size:16px;max-width:38em">${s.sample}</div>`:`<span style="display:inline-flex;gap:6px;font-weight:500;font-size:13px"><span style="background:${N.Char};color:${N.Bone};padding:8px 16px;border-radius:3px">Learn more</span><span style="background:${N.Ash};color:${N.Ink};padding:8px 16px;border-radius:3px">Try it now</span></span>`;
  const tones=[[N.Ink,N.Stone],[N.Char,N.Stone],[P.Moss.deep,N.Pumice],[P.Dusk.light,P.Dusk.deep]], kinds=['orbit','eclipse','sphere','capsule'];
  const neutrals=BRAND.color.neutrals.map(c=>swatchOf(c,CMYK)), secondary=[...BRAND.color.pairs.map(c=>swatchOf({name:c.name+' light',hex:c.light},CMYK)),...BRAND.color.pairs.map(c=>swatchOf({name:c.name+' deep',hex:c.deep},CMYK))];
  const wide='aspect-ratio:16/9', rule=(i)=>BRAND.logo.rules[i], face=s=>s.family==='mono'?'"Roobert SemiMono", "DM Mono", monospace':'"Roobert", "Figtree", sans-serif';
  const big=(css,name,note)=>({html:AA('',`--g:transparent;--i:var(--neutral-10);overflow:visible`,`<div style="font-family:${css};font-size:clamp(34px,6vw,76px);line-height:1.05;letter-spacing:-.03em">${name}</div>`),note});
  const pic=(k,name)=>({name:`aurelius-${name}.jpg`,uri:IMG[k]});
  return {
   hero:AA('pb-hero',`--g:${N.Char};--i:${N.Bone};--hw:11em`,`<div class="a-mask pb-hero-media" data-place="globe" style="--src:var(--globe)"></div><div class="a-grain"></div>${lockup('30px')}<h1 class="a-h">A living picture of a connected world.</h1><div class="meta a-mono"><span>${BRAND.meta.source}</span><span>${BRAND.meta.pages} pages</span><span>${BRAND.meta.edition} edition</span></div>`),
   intro:{text:AD['0.0'],num:'0.0',ref:'p.3'},
   chapters:[
    {id:'logo',title:'Logo',num:'1.0',items:[
      {id:'logo',title:'Logo',num:'1.0',ref:'p.5',desc:[AD['1.0']],path:'logo.assets.lockup',
       blocks:[{k:'tiles',cols:1,html:[atile(N.Bone,N.Ink,lockup('13%'),'',wide)]}],
       files:[{name:'aurelius-logo-ink.svg',text:svgDoc(LOGO.lockup.w,LOGO.lockup.h,LOGO.lockup.d,N.Ink)},{name:'aurelius-logo-bone.svg',text:svgDoc(LOGO.lockup.w,LOGO.lockup.h,LOGO.lockup.d,N.Bone)}],
       copy:{label:'Copy SVG',text:svgDoc(LOGO.lockup.w,LOGO.lockup.h,LOGO.lockup.d,N.Ink)},
       rules:[],data:{asset:BRAND.logo.assets.lockup,viewBox:[LOGO.lockup.w,LOGO.lockup.h],colours:{ink:N.Ink,bone:N.Bone},files:['aurelius-logo-ink.svg','aurelius-logo-bone.svg'],outline:'vector path lifted from the PDF'}},
      {id:'icon',title:'Icon',num:'1.1',ref:'p.6',desc:[AD['1.1']],path:'logo.assets.symbol',
       blocks:[{k:'tiles',cols:1,html:[atile(N.Char,N.Bone,sym('34%'),'',wide)]}],
       files:[{name:'aurelius-icon-ink.svg',text:svgDoc(LOGO.symbol.w,LOGO.symbol.h,LOGO.symbol.d,N.Ink)},{name:'aurelius-icon-bone.svg',text:svgDoc(LOGO.symbol.w,LOGO.symbol.h,LOGO.symbol.d,N.Bone)}],
       copy:{label:'Copy SVG',text:svgDoc(LOGO.symbol.w,LOGO.symbol.h,LOGO.symbol.d,N.Ink)},
       rules:[rule(3)],flags:['niteshift'],data:{asset:BRAND.logo.assets.symbol,viewBox:[LOGO.symbol.w,LOGO.symbol.h],files:['aurelius-icon-ink.svg','aurelius-icon-bone.svg']}},
      {id:'clearspace',title:'Clear space',num:'1.3',ref:'p.8',desc:[AD['1.3']],path:'logo.clearSpace',
       blocks:[{k:'tiles',cols:1,html:[atile(N.Stone,N.Ink,`<div style="position:relative;height:26%;aspect-ratio:${LOGO.symbol.w}/${LOGO.symbol.h}">${sym('100%')}<div style="position:absolute;inset:-50%;border:1px dashed ${N.Char}"></div></div>`,'Half the symbol’s height on every side',wide)]}],
       rules:[rule(2)],flags:['clear'],data:{clearSpace:{value:.5,unit:'symbol height',appliesTo:['symbol','lockup']}}},
      {id:'logocolours',title:'Logo colours',num:'1.4',ref:'p.9',desc:[AD['1.4']],path:'logo.colours',
       blocks:[{k:'tiles',cols:3,html:[atile(N.Bone,N.Ink,lockup('16%'),'Dark logo on light'),atile(N.Char,N.Bone,lockup('16%'),'Light logo on dark'),`<div class="pb-tile" style="color:${N.Bone}"><img src="${IMG.forest}" alt="Forest in warm haze">${sym('34%','position:relative')}<span class="cap">Light logo on image</span></div>`]}],
       rules:[rule(0),rule(1)],data:{onLight:N.Ink,onDark:N.Bone,onImage:N.Bone}},
      {id:'misuse',title:'Logo misuse',num:'1.5',ref:'p.10',desc:[AD['1.5']],path:'logo.never',
       blocks:[{k:'donts',items:BRAND.logo.never}],rules:BRAND.logo.never.map(t=>({t:'Never: '+t.toLowerCase(),b:'stated',p:10})),data:{never:BRAND.logo.never}}]},
    {id:'colour',title:'Colour',num:'2.0',items:[
      {id:'neutral',title:'Neutral colours',num:'2.0',ref:'p.12',desc:[AD['2.0']],path:'color.neutrals',
       blocks:[{k:'swatches',cols:4,items:neutrals}],files:[{name:'aurelius-neutrals.json',text:JSON.stringify(neutrals,null,2)}],copy:{label:'Copy CSS',text:cssVars(neutrals)},
       rules:[BRAND.color.rules[0]],flags:['names','bone'],data:{neutrals}},
      {id:'secondary',title:'Secondary colours',num:'2.1',ref:'p.13',desc:[AD['2.1']],path:'color.pairs',
       blocks:[{k:'swatches',cols:4,items:secondary}],files:[{name:'aurelius-secondary.json',text:JSON.stringify(secondary,null,2)}],copy:{label:'Copy CSS',text:cssVars(secondary)},
       rules:[BRAND.color.rules[2],BRAND.color.rules[3]],flags:['sec-hex','pairs'],data:{pairs:BRAND.color.pairs}},
      {id:'balance',title:'Colour balance',num:'2.2',ref:'p.14',desc:[AD['2.2']],path:'color.balance',
       blocks:[{k:'balance',legend:[{label:'Neutral',pct:BRAND.color.balance.neutral},{label:'Secondary',pct:BRAND.color.balance.secondary}],parts:[...[...BRAND.color.neutrals].reverse().map(c=>({hex:c.hex,w:BRAND.color.balance.neutral/8})),...BRAND.color.pairs.flatMap(c=>[c.light,c.deep]).map(hex=>({hex,w:BRAND.color.balance.secondary/8}))]}],
       rules:[BRAND.color.rules[1]],data:{balance:BRAND.color.balance}}]},
    {id:'type',title:'Typography',num:'3.0',items:[
      {id:'fonts',title:'Brand fonts',num:'3.0',ref:'p.16',desc:[AD['3.0']],path:'type.families',
       get blocks(){const n=(id,f)=>{const l=fontState(AURELIUS,id);return l?(l==='trial'?'Trial files added in Assets':`Font files added in Assets · ${LICENCES[l]} licence`):hasRoobert?'Installed on this machine':`Shown in ${f.standIn}`};return[{k:'specimen',rows:[big('var(--bf)',ty.families.sans.name,n('font-sans',ty.families.sans)),big('var(--tf)',ty.families.mono.name,n('font-mono',ty.families.mono))]}]},
       rules:[],flags:['fonts'],data:{families:ty.families}},
      {id:'typesetting',title:'Typesetting',num:'3.1',ref:'p.17',desc:[AD['3.1']],path:'type.styles',
       blocks:[{k:'specs',rows:ty.styles.map(s=>({meta:[s.name,`${ty.families[s.family].name} ${s.weight}`,`Tracking ${s.tracking} · Leading ${s.leading}`,...(s.extra?[s.extra]:[])],html:AA('','--g:transparent;--i:var(--neutral-10);overflow:visible',sample(s))}))}],
       copy:{label:'Copy CSS',text:typeCss(ty.styles,face)},
       rules:ty.styles.map(s=>({t:`${s.name}: ${ty.families[s.family].name} ${s.weight}, tracking ${s.tracking}, leading ${s.leading}`,b:'stated',p:17})),flags:['sizes'],data:{styles:ty.styles.map(({sample:_,...s})=>s)}}]},
    {id:'imagery',title:'Imagery',num:'4.0',items:[
      {id:'worldgraph',title:'World Graph tool',num:'4.0',ref:'p.20',desc:[AD['4.0']],path:'imagery.worldGraph',make:'social-graph',tool:'globe',
       blocks:[{k:'tiles',cols:2,html:[AA('pb-tile',`--g:${N.Char};--i:${N.Bone};aspect-ratio:16/11`,wg({mode:'dots',lon:-45,labels:true,motion:true,dist:3.6},'inset:0;width:100%;height:100%','g1',2)),AA('pb-tile',`--g:${P.Tide.deep};--i:${N.Bone};aspect-ratio:16/11`,wg({mode:'particles',lon:125,labels:false,motion:true,dist:3.6},'inset:0;width:100%;height:100%','g2',2))]}],
       rules:[{t:'Connections, visual treatments and colour modes are adjustable',b:'stated',p:20}],flags:['texture'],data:{worldGraph:{note:BRAND.imagery.worldGraph.note,renderer:'the tool’s own code, running in this page',modes:['dots','particles'],controls:['facing','distance','spin','labels','motion']}}},
      {id:'particle',title:'Particle illustrations',num:'4.1',ref:'p.21',desc:[AD['4.1']],path:'imagery.particle',
       blocks:[{k:'tiles',cols:3,html:[aimg('bridge','Suspension bridge drawn in particles'),aimg('peaks','Mountain range drawn in particles'),aimg('ship','Container ship drawn in particles')]}],
       files:[pic('bridge','particle-bridge'),pic('peaks','particle-peaks'),pic('ship','particle-ship')],rules:pa.look.map(t=>({t:'Look: '+t,b:'stated',p:21})),data:{look:pa.look}},
      {id:'particlegen',title:'Particle illustration generation',num:'4.2',ref:'p.22',desc:[AD['4.2']],path:'imagery.particle.prompt',
       blocks:[{k:'prompt',label:'Example prompt',text:pa.prompt}],prompt:pa.prompt,rules:[{t:'Generated with Midjourney',b:'stated',p:22},{t:'Prompts stress recognizable forms, particle density, depth and high contrast, in monochrome',b:'stated',p:22}],data:{madeWith:pa.madeWith,prompt:pa.prompt}},
      {id:'photography',title:'Photography',num:'4.3',ref:'p.23',desc:[AD['4.3']],path:'imagery.photography',
       blocks:[{k:'tiles',cols:3,html:[aimg('forest','Forest in warm haze'),aimg('ridge','Mountain ridge in cloud'),aimg('wave','Breaking wave at dusk')]}],
       files:[pic('forest','photo-forest'),pic('ridge','photo-ridge'),pic('wave','photo-wave')],rules:ph.look.map(t=>({t:'Look: '+t,b:'stated',p:23})),data:{look:ph.look}},
      {id:'photogen',title:'Photography generation',num:'4.4',ref:'p.24',desc:[AD['4.4']],path:'imagery.photography.prompt',
       blocks:[{k:'prompt',label:'Example prompt',text:ph.prompt}],prompt:ph.prompt,rules:[{t:'Generated with Midjourney, with existing brand imagery as reference',b:'stated',p:24},{t:'The result should feel photographic rather than artificial',b:'stated',p:24}],data:{madeWith:ph.madeWith,prompt:ph.prompt}}]},
    {id:'graphics',title:'Graphic system',num:'5.0',items:[
      {id:'coreshape',title:'Core shape',num:'5.0',ref:'p.26–28',desc:[AD['5.0'],AD['5.1'],AD['5.2']],details:AD['5.0d'],path:'graphics.coreShape',
       blocks:[{k:'tiles',cols:4,shuffle:'Draw new ones',html:kinds.map((k,i)=>AA('pb-shape',`--g:${tones[i][0]};--i:${tones[i][1]}`,coreShape(k,seed+i)))}],
       files:kinds.map((k,i)=>({name:`aurelius-core-shape-${k}.svg`,text:svgFile(coreShape(k,seed+i),N.Ink)})),
       rules:g.coreShape.rules,data:{elements:g.coreShape.elements,strokePx:g.coreShape.strokePx,drawnBy:'code, from these rules; every draw is new'}},
      {id:'texture',title:'Texture',num:'5.3',ref:'p.29',desc:[AD['5.3']],details:AD['5.3d'],path:'graphics.texture',
       blocks:[{k:'tiles',cols:2,html:[`<div class="pb-tile"><img src="${IMG.ridge}" alt="Mountain ridge in cloud, without texture"><span class="cap" style="color:${N.Bone}">Without texture</span></div>`,AA('pb-tile',`--g:${N.Char};--i:${N.Bone}`,`<img src="${IMG.ridge}" alt="Mountain ridge in cloud, with texture"><div class="a-grain" style="opacity:1"></div><span class="cap">With texture</span>`)]}],
       rules:[{t:g.texture.rule,b:'stated',p:29}],flags:['texture'],data:{texture:g.texture}},
      {id:'softglass',title:'Soft glass',num:'5.4',ref:'p.30',desc:[AD['5.4']],details:AD['5.4d'],path:'graphics.softGlass',
       blocks:[{k:'tiles',cols:1,html:[AA('pb-glass',`--g:${N.Chalk};--i:${N.Ink}`,`<div style="position:absolute;inset:0;color:${N.Pumice};padding:4% 30%">${coreShape('orbit',9)}</div>`+[['Deterministic models',N.Stone,'#F6F5F303'],['Persona API',P.Moss.deep,'#C6CEAE22'],['Maritime API',P.Tide.deep,'#BCD3D722'],['Foundation models (soon)',P.Dusk.deep,'#BDBDD622']].map(c=>`<div class="card a-mono" style="border:.5px solid ${c[1]};background:${c[2]};box-shadow:3px 3px 0 -2.5px ${c[1]},6px 6px 0 -5.5px ${c[1]}">${c[0]}</div>`).join(''))]}],
       copy:{label:'Copy settings',text:JSON.stringify({neutral:g.softGlass.neutral,tinted:g.softGlass.tinted},null,2)},
       rules:[{t:'Fill at 1 to 2% opacity, stroke 0.5px or more, background blur 10 to 20',b:'stated',p:30},{t:'Used sparingly: stacked cards, layered information, data groupings',b:'stated',p:30}],flags:['typo','bone'],data:{softGlass:g.softGlass}}]},
    {id:'icons',title:'Iconography',num:'7.0',items:[
      {id:'iconconstruction',title:'Icon construction',num:'7.0',ref:'p.36',desc:[AD['7.0']],path:'icons',
       blocks:[{k:'tiles',cols:1,html:[`<div class="pb-tile" style="aspect-ratio:1160/200;background:${N.Char}"><img src="${IMG.icons}" alt="Six icons built on a 12 by 12 grid"></div>`]}],
       files:[{name:'aurelius-icons.jpg',uri:IMG.icons}],rules:[{t:'Every icon is built on a 12×12 grid',b:'stated',p:36},{t:BRAND.icons.rule,b:'stated',p:36}],data:{icons:{grid:BRAND.icons.grid,rule:BRAND.icons.rule}}}]}
   ]}}
/* Slide layouts: the two deck pages of the guideline, the headline cover, and the shared layouts. The live graph is shown still in a deck. */
const TID=Object.fromEntries(T.map(t=>[t.id,t]));
const SL=[asSlide(TID['deck-split'],{graphic:'guideline picture',motion:false},{},{name:'Split',use:'Opening or statement slide: headline, a short passage and the globe'}),asSlide(TID['deck-metrics'],{},{},{use:'Up to five figures side by side under one claim'}),asSlide(TID.headline,{format:'Slide 1920×1080',motion:false},{backdrop:['world graph']},{name:'Headline',kind:'Deck',use:'A single line over the globe or a photograph, for a section break or a close'}),asSlide(TID.statement,{format:'16:9'},{},{kind:'Deck'}),asSlide(TID.quote,{format:'16:9'},{},{kind:'Deck'})];
const STARTER=[['sl-deck-split',{}],['sl-deck-metrics',{}],['sl-quote',{}],['sl-headline',{}],['sl-statement',{headline:'Bring the outside world\ninto your next decision.',eyebrow:''}]];
const AURELIUS=finishBrand({id:'aurelius',name:'Aurelius',BRAND,TONES,T,SL,
  /* Tools built for this brand. They live with the brand, and what they make feeds its layouts. */
  tools:[{id:'globe',name:'World Graph',use:'Connect places with information rails, then fly into a landmark city. Your rails are the ones every World Graph layout draws.',tones:['ink','bone','stone','tide-deep','moss-deep','dusk-deep','clay-deep'],tone:'ink'},
    {id:'particles',name:'Particle studio',use:'Draw the Earth, shapes, words or a logo in Aurelius specks.',tones:['ink','bone','stone','tide-deep','moss-deep','dusk-deep','clay-deep'],tone:'ink'}],starter:{name:'Aurelius overview',slides:STARTER},
  slots:[
    {id:'font-sans',kind:'font',group:'Type',label:'Roobert',family:'Roobert',use:'Headlines, text and UI (p.16)',standIn:'Figtree',resolves:'fonts',weights:[400,500,600]},
    {id:'font-mono',kind:'font',group:'Type',label:'Roobert SemiMono',family:'Roobert SemiMono',use:'Labels, data and captions (p.16)',standIn:'DM Mono',resolves:'fonts',weights:[400]},
    {id:'texture',kind:'image',group:'Imagery',label:'Texture',cssVar:'--grain',use:'The grain over grounds and photography (p.29)',standIn:'A generated grain',resolves:'texture'},
    {id:'logo-files',kind:'files',group:'Logo',label:'Logo files',required:false,use:'Vector logos for the brand kit. Layouts already draw the logo from the guideline’s own vectors.',many:true}],
  source:{kind:'PDF',label:'Aurelius_Brand_Guidelines.pdf',detail:'45 pages · November 2026 edition'},
  voice:`Aurelius is a decision-making infrastructure company. Brand character: ${BRAND.character.join(', ')}. Copy is calm, declarative and short; no exclamation marks, no hype. Example lines: "A living picture of a connected world." "A broader view of what's at stake." "Bring the outside world into your next decision." Colour: neutral tones (bone, stone, ink) are the default; secondary tones are used sparingly, for data.`,
  balanceCheck:tone=>({ok:tone.kind!=='secondary',name:'Balance',text:tone.kind==='secondary'?'Secondary ground. Keep these to about one in five of a set':'Neutral ground, in line with the 82/18 balance'}),
  typeCheck:()=>{const a=fontState(AURELIUS,'font-sans'),b=fontState(AURELIUS,'font-mono');if(a&&b)return a==='trial'||b==='trial'?{ok:false,name:'Type',text:'Trial Roobert files: fine for design, not for delivery'}:{ok:true,name:'Type',text:'Roobert from the brand’s font files'};return{ok:hasRoobert,name:'Type',text:hasRoobert?'Roobert found on this machine':'Stand-in type (Figtree, DM Mono) until licensed Roobert files are supplied'}},
  card:{html:AA('pb-brandtile',`--g:${N.Char};--i:${N.Bone}`,`<div class="a-mask" style="--src:var(--globe);right:-18%;top:-30%;bottom:-60%;width:80%;opacity:.4"></div>${lockup('26px','position:relative')}`),strip:[...BRAND.color.neutrals.map(c=>c.hex),...BRAND.color.pairs.flatMap(c=>[c.light,c.deep])]},
  /* Where the brand shows up: the table-stakes scenes every guideline is expected to show (icon, profiles, posts, signature). Names and counts are stand-ins until the brand gives its own. */
  presence:{kind:'web',name:'Aurelius',handle:'aurelius',site:'aurelius.com',bio:'Decision-making infrastructure. A living picture of a connected world.',industry:'Information services',place:'Global',followers:'2,481',following:'184',xFollowers:'12.4K',
    banner:'headline',post:'social-number',story:'statement',wall:IMG.ridge,ink:N.Ink,accent:P.Tide.deep,stageTone:'bone',
    caption:'A broader view of what’s at stake. Aurelius connects global information to help organizations make better decisions.',sig:{name:'Alex Morgan',role:'Partnerships',phone:'+1 202 555 0143'}},
  guide:aureliusGuide});
export {AURELIUS,listOf,raster,asSlide,SLIDE,rgbOf,slugOf,swatchOf,cssVars,typeCss,describe,esc,lum,contrast,mix,TEX,FORMATS,sharedTemplates,finishBrand,wg,mountWG,tplHTML,sizeOf,sanitize,defaults,toPNG,toVideo,LOOP,MOTION_OK,WGLIB};
