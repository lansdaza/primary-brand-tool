const {chromium}=require('playwright');
const S='/tmp/claude-0/-home-claude/b7211c49-152b-58c5-8d7d-ef269956e9c7/scratchpad';
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const [w,h,tag] of [[1440,720,'short'],[1024,768,'tablet'],[390,844,'phone']]){
  const pg=await b.newPage({viewport:{width:w,height:h}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  for(const r of ['globe','particles']){
   await pg.goto('file://'+S+'/build/test.html#aurelius-tools-'+r);await pg.mouse.move(700,450);await pg.waitForTimeout(3000);
   if(r==='globe'&&tag!=='phone'){await pg.getByRole('button',{name:'New connection'}).click();await pg.waitForTimeout(300);await pg.locator('#pb-place-from').fill('Ber');await pg.waitForTimeout(300)}
   const rep=await pg.evaluate(()=>{const out=[];document.querySelectorAll('body *').forEach(el=>{const cs=getComputedStyle(el);if(!el.offsetWidth)return;if(cs.textOverflow==='ellipsis'&&el.scrollWidth>el.clientWidth+1)out.push('truncated: '+el.textContent.slice(0,40));});if(document.documentElement.scrollWidth>innerWidth+1)out.push('sideways scroll '+document.documentElement.scrollWidth);return out});
   console.log(tag,r,rep.length?rep.join(' | '):'ok');
   await pg.screenshot({path:`${S}/ux/toolui-${tag}-${r}.png`,fullPage:tag==='phone'});
  }
  console.log(tag,'errors',errs.length);await pg.close()}
 await b.close()})();
