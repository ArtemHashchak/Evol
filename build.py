#!/usr/bin/env python3
"""Собирает src/sim.js + src/ui.js + src/template.html в один файл index.html."""
from pathlib import Path
root = Path(__file__).parent
t = (root / 'src/template.html').read_text(encoding='utf-8')
s = (root / 'src/sim.js').read_text(encoding='utf-8').replace("if(typeof module!=='undefined')module.exports=EVO;", "")
u = (root / 'src/ui.js').read_text(encoding='utf-8')
(root / 'index.html').write_text(t.replace('/*SIM*/', s).replace('/*UI*/', u), encoding='utf-8')
print('index.html собран')
