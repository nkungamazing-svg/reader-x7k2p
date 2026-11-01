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
HERO = ROOT / "characters" / "emilia.jpg"


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


def letter_n(size, colour, scale=1.0, centre=(0.5, 0.5)):
    box = int(size * LETTER_RATIO * scale)
    left = int(size * centre[0] - box / 2)
    top = int(size * centre[1] - box / 2)
    inset = round(box * 0.05)
    stem = round(box * 0.25)
    y1, y2 = top + inset, top + box - inset
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    radius = round(stem * 0.18)
    draw.rounded_rectangle((left, y1, left + stem, y2), radius=radius, fill=tint(colour, 255))
    right = left + box - stem
    draw.rounded_rectangle((right, y1, left + box, y2), radius=radius, fill=tint(colour, 255))
    draw.polygon([(left, y1), (left + stem, y1), (left + box, y2), (right, y2)], fill=tint(colour, 255))
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


def hero_layer(size, accent):
    """ตัวละครยืนในกรอบภาพมุมมนที่ขอบล่างของไอคอน (เฉพาะธีมรี:ซีโร่)"""
    if not HERO.exists():
        return None
    card_w, card_h = int(size * 0.62), int(size * 0.46)
    art = Image.open(HERO).convert("RGBA")
    scale = max(card_w / art.width, card_h / art.height)
    art = art.resize((round(art.width * scale), round(art.height * scale)), Image.LANCZOS)
    left, top = (art.width - card_w) // 2, (art.height - card_h) // 2
    art = art.crop((left, top, left + card_w, top + card_h))
    radius = int(card_w * 0.16)
    mask = Image.new("L", (card_w, card_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=radius, fill=255)
    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    card.paste(art, (0, 0), mask)
    border = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    ImageDraw.Draw(border).rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=radius,
                                             outline=tint(accent, 240), width=5)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x, y = (size - card_w) // 2, size - card_h - int(size * 0.07)
    layer.alpha_composite(card, (x, y))
    layer.alpha_composite(border, (x, y))
    return layer


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

    hero = hero_layer(SIZE, accent) if theme == "rezero" else None
    if hero:
        canvas.alpha_composite(hero)
    if theme in MOTIFS:
        decorate(canvas, theme, accent, surface, ink)

    scale, centre = (0.6, (0.5, 0.28)) if hero else (1.0, (0.5, 0.5))
    glyph = letter_n(SIZE, ink, scale, centre)
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 150), (0, 0), glyph.getchannel("A"))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(SIZE * 0.014)), (0, int(SIZE * 0.012)))
    canvas.alpha_composite(glyph)

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
