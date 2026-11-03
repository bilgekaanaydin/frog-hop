# Converts PP NeueBit Bold (a pixel-grid font: 1 pixel = 1/28 em) into a bitmap font stored in src/assets.js.
# Run: python3 tools/make_font.py   (then python3 build.py)
import json, os
from PIL import Image, ImageDraw, ImageFont
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, '..', 'assets', 'ppneuebit-bold.otf')
ASSETS = os.path.join(HERE, '..', 'src', 'assets.js')
K = 24                      # render at 28*K px so one font pixel = K image pixels
f = ImageFont.truetype(FONT, 28 * K)
CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!+-:.,?&'/%"
ORG = (4 * K, 4 * K)
def render(ch):
    img = Image.new('L', (40 * K, 40 * K), 0)
    ImageDraw.Draw(img).text(ORG, ch, font=f, fill=255)
    return np.array(img) > 127
# grid phase and cap line from 'H' (all outlines sit on the pixel grid)
h = render('H'); ys, xs = np.where(h)
px, py = xs.min() % K, ys.min() % K
cap_top = ys.min()
glyphs = {}
for ch in CHARS:
    a = render(ch)
    if not a.any(): continue
    ys, xs = np.where(a)
    gx0 = (xs.min() - px) // K; gx1 = (xs.max() - px) // K
    gy0 = (ys.min() - py) // K; gy1 = (ys.max() - py) // K
    rows = []
    for gy in range(gy0, gy1 + 1):
        r = ''
        for gx in range(gx0, gx1 + 1):
            cy, cx = py + gy * K + K // 2, px + gx * K + K // 2
            r += '#' if a[cy, cx] else '.'
        rows.append(r)
    origin_gx = (ORG[0] - px) / K
    glyphs[ch] = {
        'rows': rows,
        'x': int(round(gx0 - origin_gx)),                      # left bearing in font pixels
        'y': int(gy0 - (cap_top - py) // K),                    # rows below the cap line (negative = above)
        'adv': int(round(f.getlength(ch) / K)),                 # advance width in font pixels
    }
glyphs[' '] = {'rows': [], 'x': 0, 'y': 0, 'adv': int(round(f.getlength(' ') / K))}
cap = len(glyphs['H']['rows'])
src = open(ASSETS).read()
A = json.loads(src.split('const ASSETS = ', 1)[1].rsplit(';', 1)[0])
A['font'] = {'cap': cap, 'glyphs': glyphs}
head = src.split('const ASSETS = ', 1)[0]
open(ASSETS, 'w').write(head + 'const ASSETS = ' + json.dumps(A, separators=(',', ':')) + ';\n')
print('cap height', cap, 'glyphs', len(glyphs), 'adv H', glyphs['H']['adv'], 'space', glyphs[' ']['adv'])
for ch in 'B3!':
    print(ch, glyphs[ch]['x'], glyphs[ch]['y'], glyphs[ch]['adv']); print('\n'.join(glyphs[ch]['rows']))
