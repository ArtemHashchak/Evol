#!/usr/bin/env python3
"""Собирает src/shell.html + src/*.js в index.html."""
from pathlib import Path
root = Path(__file__).parent
js = '\n'.join(p.read_text(encoding='utf-8') for p in sorted((root/'src').glob('*.js')))
html = (root/'src/shell.html').read_text(encoding='utf-8').replace('/*GAME*/', '(()=>{"use strict";\n' + js + '\n})();')
(root/'index.html').write_text(html, encoding='utf-8')
print('index.html собран', len(html)//1024, 'КБ')
