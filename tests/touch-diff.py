#!/usr/bin/env python3
"""DEV-TOOL (Umbau 20.4): vergleicht zwei Ausgaben von tests/touch-check.mjs Schritt für Schritt.
Aufruf: python3 tests/touch-diff.py tests/shots/umbau/touch-A.json tests/shots/umbau/touch-B.json"""
import json,sys
a=json.load(open(sys.argv[1])); b=json.load(open(sys.argv[2]))
def walk(x,y,p,out):
    if isinstance(x,dict) and isinstance(y,dict):
        for k in sorted(set(x)|set(y)): walk(x.get(k,'<fehlt>'),y.get(k,'<fehlt>'),p+'.'+k,out)
    elif isinstance(x,list) and isinstance(y,list) and len(x)==len(y):
        for i,(u,v) in enumerate(zip(x,y)): walk(u,v,p+'[%d]'%i,out)
    elif x!=y: out.append('%s: %s -> %s'%(p,json.dumps(x)[:90],json.dumps(y)[:90]))
for sa,sb in zip(a['steps'],b['steps']):
    out=[]; walk(sa,sb,'',out)
    print('==',sa['name'], 'gleich' if not out else '%d Unterschiede'%len(out))
    for o in out[:12]: print('   ',o)
print('Schritte',len(a['steps']),len(b['steps']),'Fehler',a['errors'],b['errors'])
