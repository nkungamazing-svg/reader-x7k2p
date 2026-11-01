#!/usr/bin/env python3
"""ไอคอนแอปแยกตามธีม — ตัว N + ลายเฉพาะของแต่ละเทศกาล/ธีม

รันเมื่อเปลี่ยนสีธีมหรืออยากปรับลาย:  python3 tools/build-theme-icons.py
ผลลัพธ์: icons/theme/<theme>.png (ใช้ทั้งหน้าเปิดแอปและโลโก้หัวเว็บ)
"""
import json
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons" / "theme"
SIZE = 384
LETTER_RATIO = 0.5
INK = (255, 255, 255)

MOTIFS = {"halloween", "christmas", "songkran", "newyear", "isekai", "cyberpunk", "paper", "reading", "rezero"}
ART = ROOT / "icons" / "icon-512.png"          # โลโก้เดิมของแอป
HERO = ROOT / "characters" / "emilia.jpg"       # รูปที่ใช้เป็นเหรียญประทับมุมไอคอนธีมรี:ซีโร่


def parse_vars(block):
    return dict(re.findall(r"(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})", block))


def rgb(value, fallback):
    value = (value or fallback).lstrip("#")
    if len(value) == 3:
        value = "".join(ch * 2 for ch in value)
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def tint(colour, alpha):
    return colour + (alpha,)


def glow(size, colour, alpha, radius_ratio, centre):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    radius = int(size * radius_ratio)
    gradient = Image.radial_gradient("L").resize((radius * 2, radius * 2), Image.BICUBIC)
    mask = gradient.point(lambda value: int(alpha * (1 - value / 255) ** 1.7))
    layer.paste(Image.new("RGBA", (radius * 2, radius * 2), tint(colour, 255)),
                (int(centre[0] - radius), int(centre[1] - radius)), mask)
    return layer


def art_layer(size, surface, accent):
    """โลโก้เดิมในการ์ดมุมมน พร้อมเงาและเส้นขอบบาง ๆ ให้ดูมีมิติ"""
    art_size = int(size * 0.6)
    pad = int(size * 0.05)
    box = art_size + pad * 2
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    card = Image.new("RGBA", (box, box), tint(surface, 225))
    card_mask = Image.new("L", (box, box), 0)
    ImageDraw.Draw(card_mask).rounded_rectangle((0, 0, box - 1, box - 1), radius=int(box * 0.26), fill=255)
    layer.paste(card, ((size - box) // 2, (size - box) // 2), card_mask)

    art = Image.open(ART).convert("RGBA").resize((art_size, art_size), Image.LANCZOS)
    art_mask = Image.new("L", (art_size, art_size), 0)
    ImageDraw.Draw(art_mask).rounded_rectangle((0, 0, art_size - 1, art_size - 1),
                                               radius=int(art_size * 0.24), fill=255)
    art_card = Image.new("RGBA", (art_size, art_size), (0, 0, 0, 0))
    art_card.paste(art, (0, 0), art_mask)

    left = int(size * 0.5 - art_size / 2)
    shadow = Image.new("RGBA", (art_size, art_size), (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 150), (0, 0), art_mask)
    layer.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(size * 0.02)), (left, left + int(size * 0.015)))
    layer.alpha_composite(art_card, (left, left))

    hairline = Image.new("RGBA", (box, box), (0, 0, 0, 0))
    ImageDraw.Draw(hairline).rounded_rectangle((0, 0, box - 1, box - 1), radius=int(box * 0.26),
                                               outline=tint(accent, 150), width=2)
    layer.alpha_composite(hairline, ((size - box) // 2, (size - box) // 2))
    return layer


def cameo_layer(size, accent):
    """เหรียญรูปตัวละครมุมล่างขวา (เฉพาะธีมรี:ซีโร่)"""
    if not HERO.exists():
        return None
    diameter = int(size * 0.31)
    art = Image.open(HERO).convert("RGBA")
    grow = max(diameter / art.width, diameter / art.height)
    art = art.resize((round(art.width * grow), round(art.height * grow)), Image.LANCZOS)
    left = (art.width - diameter) // 2
    art = art.crop((left, 0, left + diameter, diameter))
    mask = Image.new("L", (diameter, diameter), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, diameter - 1, diameter - 1), fill=255)
    coin = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    coin.paste(art, (0, 0), mask)
    ring = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((3, 3, diameter - 4, diameter - 4), outline=tint(accent, 245), width=6)

    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 170), (0, 0), mask)
    x = y = size - diameter - int(size * 0.055)
    layer.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(size * 0.016)), (x, y + int(size * 0.012)))
    layer.alpha_composite(coin, (x, y))
    layer.alpha_composite(ring, (x, y))
    return layer


def shine_layer(size):
    """แถบแสงเฉียงจาง ๆ ให้ไอคอนมีประกาย ไม่ดูแบน"""
    shine = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shine).polygon([(0, 0), (size * 0.62, 0), (0, size * 0.62)], fill=(255, 255, 255, 20))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.225), fill=255)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer.paste(shine, (0, 0), mask)
    return layer


def snowflake(draw, cx, cy, radius, colour, alpha=225, width=3):
    for step in range(6):
        angle = math.radians(step * 60)
        x, y = cx + math.cos(angle) * radius, cy + math.sin(angle) * radius
        draw.line((cx, cy, x, y), fill=tint(colour, alpha), width=width)
        for tick in (0.55, 0.8):
            bx, by = cx + math.cos(angle) * radius * tick, cy + math.sin(angle) * radius * tick
            for side in (-1, 1):
                twig = angle + side * 0.7
                draw.line((bx, by, bx + math.cos(twig) * radius * 0.28, by + math.sin(twig) * radius * 0.28),
                          fill=tint(colour, alpha), width=max(2, width - 1))


def bat(draw, cx, cy, span, colour, alpha=200):
    half, lift = span / 2, span * 0.55
    for side in (-1, 1):
        draw.polygon([(cx, cy), (cx + side * half * 0.35, cy - lift * 0.75), (cx + side * half, cy - lift * 0.15),
                      (cx + side * half * 0.62, cy + lift * 0.12), (cx, cy + lift * 0.32)],
                     fill=tint(colour, alpha))
    body = span * 0.12
    draw.ellipse((cx - body, cy - body * 1.5, cx + body, cy + body * 1.5), fill=tint(colour, alpha))


def droplet(draw, cx, cy, size, colour, alpha=210):
    draw.ellipse((cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2), fill=tint(colour, alpha))
    draw.polygon([(cx, cy - size * 1.15), (cx - size * 0.36, cy - size * 0.15),
                  (cx + size * 0.36, cy - size * 0.15)], fill=tint(colour, alpha))


def sparkle(draw, cx, cy, size, colour, alpha=225):
    draw.polygon([(cx, cy - size), (cx + size * 0.24, cy), (cx, cy + size), (cx - size * 0.24, cy)],
                 fill=tint(colour, alpha))
    draw.polygon([(cx - size, cy), (cx, cy - size * 0.24), (cx + size, cy), (cx, cy + size * 0.24)],
                 fill=tint(colour, alpha))


def rune_ring(draw, cx, cy, radius, colour):
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=tint(colour, 170), width=3)
    for step in range(4):
        angle = math.radians(step * 90 + 45)
        dx, dy = cx + math.cos(angle) * radius, cy + math.sin(angle) * radius
        s = radius * 0.16
        draw.polygon([(dx, dy - s), (dx + s, dy), (dx, dy + s), (dx - s, dy)], fill=tint(colour, 230))


def decorate(canvas, theme, accent, surface, ink):
    draw = ImageDraw.Draw(canvas)
    if theme == "halloween":
        draw.ellipse((SIZE * 0.68, SIZE * 0.12, SIZE * 0.9, SIZE * 0.34), fill=tint(accent, 110))
        for cx, cy, span in ((0.19, 0.22, 0.2), (0.83, 0.6, 0.17), (0.25, 0.79, 0.14)):
            bat(draw, SIZE * cx, SIZE * cy, SIZE * span, (0, 0, 0), 190)
    elif theme == "christmas":
        for cx, cy, r in ((0.2, 0.2, 0.075), (0.82, 0.3, 0.055), (0.24, 0.78, 0.05), (0.76, 0.76, 0.07)):
            snowflake(draw, SIZE * cx, SIZE * cy, SIZE * r, INK)
    elif theme == "songkran":
        for cx, cy, s in ((0.2, 0.26, 0.06), (0.8, 0.22, 0.05), (0.24, 0.76, 0.055), (0.78, 0.72, 0.045)):
            droplet(draw, SIZE * cx, SIZE * cy, SIZE * s, (226, 246, 255))
    elif theme == "newyear":
        for cx, cy, s in ((0.2, 0.2, 0.055), (0.8, 0.28, 0.04), (0.26, 0.8, 0.045), (0.78, 0.74, 0.06)):
            sparkle(draw, SIZE * cx, SIZE * cy, SIZE * s, accent)
    elif theme == "isekai":
        rune_ring(draw, SIZE / 2, SIZE / 2, SIZE * 0.36, accent)
    elif theme == "cyberpunk":
        for y, colour in ((0.24, accent), (0.78, ink)):
            draw.line((SIZE * 0.08, SIZE * y, SIZE * 0.92, SIZE * y), fill=tint(colour, 150), width=3)
        for x, y in ((0.16, 0.38), (0.84, 0.5), (0.2, 0.62)):
            draw.rectangle((SIZE * x, SIZE * y, SIZE * x + SIZE * 0.06, SIZE * y + SIZE * 0.012),
                           fill=tint(ink, 120))
    elif theme == "paper":
        for step in range(-SIZE, SIZE * 2, 14):
            draw.line((step, 0, step + SIZE, SIZE), fill=tint(surface, 26), width=2)
        draw.rectangle((SIZE * 0.78, SIZE * 0.06, SIZE * 0.88, SIZE * 0.28), fill=tint(accent, 190))
    elif theme == "reading":
        canvas.alpha_composite(glow(SIZE, accent, 120, 0.22, (SIZE * 0.76, SIZE * 0.2)))


def build(page, accent, surface, theme, ink):
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    plate = Image.new("RGBA", (SIZE, SIZE), tint(page, 255))
    plate.alpha_composite(glow(SIZE, accent, 96, 0.64, (SIZE * 0.5, SIZE * 0.3)))
    plate.alpha_composite(glow(SIZE, accent, 52, 0.52, (SIZE * 0.8, SIZE * 0.84)))
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=int(SIZE * 0.225), fill=255)
    canvas.paste(plate, (0, 0), mask)

    canvas.alpha_composite(shine_layer(SIZE))
    if theme in MOTIFS:
        decorate(canvas, theme, accent, surface, ink)

    canvas.alpha_composite(art_layer(SIZE, surface, accent))
    if theme == "rezero":
        cameo = cameo_layer(SIZE, accent)
        if cameo:
            canvas.alpha_composite(cameo)

    ring = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(ring).rounded_rectangle((9, 9, SIZE - 10, SIZE - 10), radius=int(SIZE * 0.2),
                                           outline=tint(accent, 205), width=4)
    canvas.alpha_composite(ring)
    return canvas


def main():
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    app = (ROOT / "app.js").read_text(encoding="utf-8")
    themes = json.loads(re.search(r"const THEMES = (\[[^\]]+\])", app).group(1).replace("'", '"'))
    base = parse_vars(re.search(r":root \{[^}]+\}", css).group(0))
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for theme in themes:
        block = re.search(r':root\[data-theme="%s"\] \{[^}]+\}' % theme, css)
        values = dict(base)
        if block:
            values.update(parse_vars(block.group(0)))
        accent = rgb(values.get("--accent"), "#8b5cf6")
        image = build(rgb(values.get("--page"), "#17191f"),
                      accent,
                      rgb(values.get("--surface"), "#222631"),
                      theme,
                      rgb(values.get("--accent-strong"), "#a78bfa"))
        path = OUT / f"{theme}.png"
        image.convert("RGB").quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(path, "PNG", optimize=True)
        total += path.stat().st_size
        print(f"  {theme:<10} {path.stat().st_size / 1024:5.1f} KB")
    print(f"รวม {len(themes)} ธีม · {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
