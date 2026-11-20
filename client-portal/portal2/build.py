import json,sys,os
D=os.path.dirname(os.path.abspath(__file__))
r=lambda n:open(os.path.join(D,n),encoding='utf8').read()
src=r('src.html')
q=json.load(open(os.path.join(D,'..','portal','questionnaire.json')))
icons=json.load(open(os.path.join(D,'..','js','icons.json')))
theme=json.load(open(os.path.join(D,'theme.json')))
def js(o): return json.dumps(o,ensure_ascii=False).replace('<','\\u003c')
rep={'/*__UICSS__*/':r('ui.css'),'/*__TPLCSS__*/':r('tpl.css'),'/*__BRANDCSS__*/':r('brand-aurelius.css'),'/*__PUBCSS__*/':r('pub.css'),
 '/*__PUBJS__*/':r('pub.js'),'__THEME__':js(theme),'__ICONS__':js(icons),'__QDATA__':js(q)}
for k,v in rep.items():
    assert src.count(k)==1,k
    if 'CSS' in k: assert '</style' not in v.lower(),k
    if k=='/*__PUBJS__*/': assert '</script' not in v.lower()
    src=src.replace(k,lambda_v) if False else src.replace(k,v)
out=os.path.join(D,'..','portal','index.html')
open(out,'w',encoding='utf8').write(src)
print(out,len(src.encode()))
