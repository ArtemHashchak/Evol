#!/usr/bin/env python3
"""Собирает src/shell.html + src/game.js в index.html."""
from pathlib import Path
root = Path(__file__).parent
html = (root/'src/shell.html').read_text(encoding='utf-8').replace('/*GAME*/', (root/'src/game.js').read_text(encoding='utf-8'))
(root/'index.html').write_text(html, encoding='utf-8')
print('index.html собран')
