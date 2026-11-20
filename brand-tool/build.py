import json,base64,io,random
from PIL import Image
import os
# Assembles the single-page tool: brand data and fonts from data/, the bundle from out/ (run bundle.mjs first).
D=os.path.dirname(os.path.abspath(__file__))
img=json.load(open(D+'/data/img.json')); logo=json.load(open(D+'/data/logo.json'))
F=D+'/data/fonts/'
def face(fam,path,w):
    b=base64.b64encode(open(F+path,'rb').read()).decode()
    return '@font-face{font-family:"%s";font-weight:%d;font-style:normal;font-display:swap;src:url(data:font/woff2;base64,%s) format("woff2")}'%(fam,w,b)
fonts=face('Figtree','figtree/figtree-latin-400-normal.woff2',400)+face('Figtree','figtree/figtree-latin-500-normal.woff2',500)+face('DM Mono','dm-mono/dm-mono-latin-400-normal.woff2',400)
random.seed(7); n=160
g=Image.new('RGBA',(n,n)); g.putdata([(20,18,14,random.randint(0,46)) for _ in range(n*n)])
b=io.BytesIO(); g.save(b,'PNG',optimize=True); grain='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
globe=img.pop('globe'); mp=img.pop('map')
tpl=open(D+'/src/engine/tpl.css.tmpl').read()
aur=fonts+'.a[data-brand="aurelius"]{--bf:"Roobert","Figtree",system-ui,sans-serif;--hf:var(--bf);--sf:var(--bf);--tf:"Roobert SemiMono","DM Mono",ui-monospace,monospace;--globe:url(%s);--map:url(%s);--grain:url(%s)}'%(globe,mp,grain)
sdv=json.load(open(D+'/data/sdv.json'))
sfonts=face('Spectral','spectral/spectral-latin-400-normal.woff2',400)+face('DM Sans','dm-sans/dm-sans-latin-400-normal.woff2',400)+face('DM Sans','dm-sans/dm-sans-latin-600-normal.woff2',600)
sd=sfonts+'.a[data-brand="smalldoor"]{--bf:"DM Sans",system-ui,sans-serif;--hf:"Zenith Text","Spectral",Georgia,serif;--sf:var(--hf);--ht:-.05em;--hl:1.1;--st:-.05em;--sl:1.2;--bl:1.4;--tf:var(--bf);--tw:600;--tt:.05em;--tl:1;--tag-p:0;--tag-b:0px;--tag-r:0;--tagf-p:.45em .7em;--tagf-r:.25em;--tagf-g:#FFAA4D;--tagf-i:#1D1916;--ph-r:4px;--grain:url(%s);--grain-size:cover;--grain-op:.22;--grain-blend:overlay;--logo:url(%s);--mark:url(%s);--stacked:url(%s);--arch:url(%s);--brush:url(%s)}'%(sdv['texture'],sdv['logo'],sdv['mark'],sdv['stacked'],sdv['arch'],sdv['brush'])
sdv_img={k:sdv[k] for k in ('dachshund','terrier','doberman','interior','clean-terrier','clean-doberman','clean-labs','clean-aussie','texture')}
sdv_meta={**sdv['_logo'],'stackedW':sdv['_stacked']['w'],'stackedH':sdv['_stacked']['h'],'archW':sdv['_arch']['w'],'archH':sdv['_arch']['h']}
tl=json.load(open(D+'/data/telli.json'))
tfonts=face('Inter Tight','inter-tight/inter-tight-latin-400-normal.woff2',400)+face('Inter Tight','inter-tight/inter-tight-latin-500-normal.woff2',500)+face('Inter Tight','inter-tight/inter-tight-latin-700-normal.woff2',700)+face('Source Serif 4','source-serif-4/source-serif-4-latin-400-normal.woff2',400)
random.seed(11); tn=Image.new('RGBA',(160,160)); tn.putdata([(255,255,255,max(0,min(255,int(random.gauss(0.12,0.04)*255)))) for _ in range(160*160)]); bb=io.BytesIO(); tn.save(bb,'PNG',optimize=True); tnoise='data:image/png;base64,'+base64.b64encode(bb.getvalue()).decode()
td=tfonts+'.a[data-brand="telli"]{--bf:"ABC Diatype","Inter Tight",system-ui,sans-serif;--hf:var(--bf);--sf:"Tiempos Text","Tiempos","Source Serif 4",Georgia,serif;--ht:-.04em;--hl:1;--st:-.04em;--sl:1.2;--bl:1.3;--tf:var(--bf);--tw:700;--tt:0;--tl:1;--tag-r:99em;--grain:none;--ph-r:16px;--logo:url(%s);--mark:url(%s);--tnoise:url(%s)}.a[data-brand="telli"] .a-h{font-weight:500}.a[data-brand="telli"] .a-body{letter-spacing:-.01em}'%(tl['img']['logo'],tl['img']['mark'],tnoise)
css=open(D+'/out/app.css').read(); js=open(D+'/out/app.js').read().replace('</script','<\\/script')
assert '</style' not in css
page='''<title>Primary Brand Tool</title>
<style id="tplcss">%s</style>
<style id="brandcss-aurelius">%s</style>
<style id="brandcss-smalldoor">%s</style>
<style id="brandcss-telli">%s</style>
<style>
/* Page ground follows the viewer's theme; values are the saved theme's neutral-1 and neutral-10 in each mode. */
:root{--page:#ffffff;--page-ink:#000000}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--page:#000000;--page-ink:#ffffff;color-scheme:dark}}
:root[data-theme="dark"]{--page:#000000;--page-ink:#ffffff;color-scheme:dark}
body{background:var(--page);color:var(--page-ink)}
%s
</style>
<div id="root"></div>
<script id="pb-data">window.__AURELIUS_IMG=%s;window.__AURELIUS_LOGO=%s;window.__AURELIUS_EARTH_LUM="%s";window.__SDV_IMG=%s;window.__SDV_META=%s;window.__TELLI_IMG=%s;window.__TELLI_META=%s;</script>
<script id="pb-app">%s</script>
'''%(tpl,aur,sd,td,css,json.dumps(img),json.dumps(logo),open(D+'/data/lum.b64').read().strip(),json.dumps(sdv_img),json.dumps(sdv_meta),json.dumps(tl['img']),json.dumps(tl['meta']),js)
os.makedirs(D+'/dist',exist_ok=True); open(D+'/dist/primary-brand-tool.html','w').write(page); print(len(page)//1024,'KB')
