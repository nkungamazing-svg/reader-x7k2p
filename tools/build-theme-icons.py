#!/usr/bin/env python3
"""ไอคอนแอปแยกตามธีม — ตัว "N" แบบชุดของสุบารุ (Re:Zero) ทาสีตามธีม

รันเมื่อเปลี่ยนสีธีมหรืออยากปรับรูปทรง:  python3 tools/build-theme-icons.py
ผลลัพธ์: icons/theme/<theme>.png (ใช้ทั้งหน้าเปิดแอปและโลโก้หัวเว็บ)
"""
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons" / "theme"
SIZE = 384
LETTER_RATIO = 0.52


def parse_vars(block):
    return dict(re.findall(r"(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})", block))


def rgb(value, fallback):
    value = (value or fallback).lstrip("#")
    if len(value) == 3:
        value = "".join(ch * 2 for ch in value)
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def glow(size, colour, alpha, radius_ratio, centre):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    radius = int(size * radius_ratio)
    gradient = Image.radial_gradient("L").resize((radius * 2, radius * 2), Image.BICUBIC)
    mask = gradient.point(lambda value: int(alpha * (1 - value / 255) ** 1.7))
    tint = Image.new("RGBA", (radius * 2, radius * 2), colour + (255,))
    layer.paste(tint, (int(centre[0] - radius), int(centre[1] - radius)), mask)
    return layer


def letter_n(size, colour):
    """ตัว N หนาเหลี่ยม วาดเองไม่ต้องพึ่งฟอนต์"""
    box = int(size * LETTER_RATIO)
    origin = (size - box) // 2
    inset = round(box * 0.05)
    stem = round(box * 0.25)
    top, bottom = origin + inset, origin + box - inset
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    radius = round(stem * 0.18)
    draw.rounded_rectangle((origin, top, origin + stem, bottom), radius=radius, fill=colour + (255,))
    right = origin + box - stem
    draw.rounded_rectangle((right, top, origin + box, bottom), radius=radius, fill=colour + (255,))
    draw.polygon([(origin, top), (origin + stem, top), (origin + box, bottom), (right, bottom)], fill=colour + (255,))
    return layer


def build(page, accent, letter):
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    plate = Image.new("RGBA", (SIZE, SIZE), page + (255,))
    plate.alpha_composite(glow(SIZE, accent, 96, 0.64, (SIZE * 0.5, SIZE * 0.3)))
    plate.alpha_composite(glow(SIZE, accent, 52, 0.52, (SIZE * 0.8, SIZE * 0.84)))
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=int(SIZE * 0.225), fill=255)
    canvas.paste(plate, (0, 0), mask)

    glyph = letter_n(SIZE, letter)
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    shadow.paste((0, 0, 0, 165), (0, 0), glyph.getchannel("A"))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(SIZE * 0.014)), (0, int(SIZE * 0.013)))
    canvas.alpha_composite(glyph)

    ring = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(ring).rounded_rectangle((9, 9, SIZE - 10, SIZE - 10), radius=int(SIZE * 0.2),
                                           outline=accent + (205,), width=4)
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
        image = build(rgb(values.get("--page"), "#17191f"),
                      rgb(values.get("--accent"), "#8b5cf6"),
                      rgb(values.get("--accent-strong"), "#a78bfa"))
        path = OUT / f"{theme}.png"
        image.convert("RGB").quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(path, "PNG", optimize=True)
        total += path.stat().st_size
        print(f"  {theme:<10} {path.stat().st_size / 1024:5.1f} KB")
    print(f"รวม {len(themes)} ธีม · {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
