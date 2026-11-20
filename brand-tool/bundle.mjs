import {build} from 'esbuild';import path from 'path';import fs from 'fs';
const WG=process.argv[2];
// The Design page's particle worker, bundled on its own and inlined as a string the page starts from a blob.
const worker=await build({entryPoints:[path.join(WG,'lib/designParticles.worker.ts')],bundle:true,format:'iife',minify:true,write:false,target:'es2020'});
const workerSrc=worker.outputFiles[0].text;
await build({entryPoints:['src/main.tsx'],bundle:true,format:'iife',minify:true,outdir:'out',entryNames:'app',jsx:'automatic',target:'es2020',nodePaths:[path.resolve('node_modules')],
 loader:{'.woff2':'dataurl'},external:['https://fonts.googleapis.com/*'],
 define:{'process.env.NODE_ENV':'"production"','import.meta.env.DEV':'false','__DESIGN_WORKER_SRC__':JSON.stringify(workerSrc),'__KIT_FILM_SRC__':JSON.stringify(fs.readFileSync('kit-film.mjs','utf8')),'__KIT_SCORE_SRC__':JSON.stringify(fs.readFileSync('kit-score.mjs','utf8'))},
 plugins:[
  // DialKit caps every dropdown at 320px; long lists (16 tones) then scroll with options cut off. Allow 480px;
  // DialKit still limits it to the space on screen and opens it upward when there is more room there.
  {name:'dialkit-dropdown-height',setup(b){b.onLoad({filter:/dialkit[\\/]dist[\\/]index\.js$/},a=>{const src=fs.readFileSync(a.path,'utf8');const out=src.replace('options.maxHeight ?? 320','options.maxHeight ?? 480');if(out===src)throw new Error('DialKit dropdown cap not found');return{contents:out,loader:'js'}})}},
  {name:'worldgraph-alias',setup(b){b.onResolve({filter:/^@\//},a=>{if(a.path==='@/assets/earth-lum.jpg.asset.json')return{path:path.resolve('lum.mjs')};const base=path.join(WG,a.path.slice(2));return b.resolve('./'+path.basename(base),{resolveDir:path.dirname(base),kind:a.kind})})}}]});
// DialKit's stylesheet pulls its default mono face from Google Fonts; the saved theme replaces that face, so drop the request.
let css=fs.readFileSync('out/app.css','utf8');const n=css.length;css=css.replace(/@import\s*(url\()?["']?https:\/\/fonts\.googleapis\.com[^;]*;/g,'');fs.writeFileSync('out/app.css',css);
console.log('js',fs.statSync('out/app.js').size,'css',css.length,'removed',n-css.length,'remote left',(css.match(/https?:\/\/(?!www\.w3\.org)[^\s"')]+/g)||[]).slice(0,3));
