"""Génère images/ticket-holo.png : le billet vert avec reflet holographique et logo répété.
Usage : python design/tools/make-ticket-holo.py  (nécessite pillow et numpy)
"""
import colorsys
import numpy as np
from PIL import Image, ImageDraw

S = 3                      # résolution x3
W, H = 366 * S, 152 * S
LIME = np.array([170, 255, 34], dtype=float)

# --- forme du billet (mêmes encoches que images/ticket-shape.svg) ---
K = 6
m = Image.new("L", (W * K // S, H * K // S), 255)
d = ImageDraw.Draw(m)
def hole(cx, cy, r):
    d.ellipse([(cx - r) * K, (cy - r) * K, (cx + r) * K, (cy + r) * K], fill=0)
for cx, cy in [(0, 0), (366, 0), (0, 152), (366, 152)]:
    hole(cx, cy, 14)
hole(246, 0, 8)
hole(246, 152, 8)
mask = np.asarray(m.resize((W, H), Image.LANCZOS), dtype=float) / 255

# --- arc-en-ciel en diagonale ---
yy, xx = np.mgrid[0:H, 0:W].astype(float)
t = (xx * 0.8 + yy * 0.6) / (W * 0.8 + H * 0.6)

def rainbow(phase):
    hue = (t * 1.2 + phase) % 1.0
    lut = np.array([colorsys.hsv_to_rgb(h, 0.75, 1.0) for h in np.linspace(0, 1, 256)]) * 255
    return lut[(hue * 255).astype(int)]

img = LIME * np.ones((H, W, 1))
img = img * (1 - 0.12) + rainbow(0.0) * 0.12

# --- logo répété en quinconce, incliné ---
logo = Image.open("images/logo-lettering.png").convert("RGBA")
lw = 84 * S
logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
pat = Image.new("L", (W * 2, H * 2), 0)
gx, gy = lw + 18 * S, logo.height + 10 * S
for row, y in enumerate(range(0, H * 2, gy)):
    for x in range(-lw, W * 2, gx):
        pat.paste(logo.getchannel("A"), (x + (gx // 2 if row % 2 else 0), y), logo.getchannel("A"))
pat = pat.rotate(-18, resample=Image.BICUBIC).crop((W // 2, H // 2, W // 2 + W, H // 2 + H))
pm = np.asarray(pat, dtype=float)[..., None] / 255
# le logo reflète la teinte opposée du fond, comme un tirage holographique
img = img * (1 - 0.16 * pm) + (rainbow(0.5) * 0.7 + 255 * 0.3) * 0.16 * pm

# --- reflet diffus ---
glare = np.exp(-((t - 0.38) / 0.12) ** 2)[..., None]
img = img + (255 - img) * 0.14 * glare

rgb = np.clip(img, 0, 255).astype(np.uint8)
alpha = (mask * 255).astype(np.uint8)
Image.fromarray(np.dstack([rgb, alpha]), "RGBA").save("images/ticket-holo.png")
print("ok")
