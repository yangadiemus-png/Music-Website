"""Build the single-file site.  python3 build.py <claude|static> <library.json> <out.html>"""
import json, sys, html
d = 'src/'
mode, libp, outp = sys.argv[1], sys.argv[2], sys.argv[3]
css = open(d+'app.css', encoding='utf-8').read()
js = open(d+'app.js', encoding='utf-8').read()
js = js.replace('  /*__CONVERT__*/\n', open(d+'convert.js', encoding='utf-8').read())
js = js.replace('  /*__ZIP__*/\n', open(d+'zip.js', encoding='utf-8').read())
js = js.replace('  /*__EDITOR__*/\n', open(d+'editor.js', encoding='utf-8').read())
svg = open('planet.svg.txt', encoding='utf-8').read().strip()
assert '`' not in svg and '${' not in svg
js = js.replace('/*__INSTR__*/', svg)
assert '</script' not in js.lower()
lib = json.load(open(libp, encoding='utf-8'))
lib.setdefault('site', {}).setdefault('theme', 'gold')
data = json.dumps(lib, indent=1, ensure_ascii=False).replace('<', '\\u003c')
def esc(s): return html.escape(s, quote=True).replace('&#x27;', '&#39;')
out = (f'<!DOCTYPE html>\n<html lang="en" data-mode="{mode}" data-theme="{esc(lib["site"]["theme"])}" data-base="{"light" if lib["site"]["theme"] in ("lightgold","lightsilver") else "dark"}">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
       f'<title>{esc(lib["site"].get("title","If? ACG in Jazz"))}</title>\n<meta name="theme-color" content="#050505">\n'
       f'<style id="app-css">{css}</style>\n</head>\n<body>\n'
       f'<script type="application/json" id="library">{data}</script>\n<script id="app-js">{js}</script>\n</body>\n</html>\n')
open(outp, 'w', encoding='utf-8').write(out)
print(mode, len(out))
