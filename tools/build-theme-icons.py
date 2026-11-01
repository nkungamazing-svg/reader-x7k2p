#!/usr/bin/env python3
"""สร้างไอคอนแอปแยกตามธีม จากโลโก้เดิม + สีของธีมใน style.css

ใช้ที่หน้าเปิดแอปและโลโก้หัวเว็บ  รันใหม่เมื่อเปลี่ยนโลโก้หรือสีธีม:
    python3 tools/build-theme-icons.py
"""
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "icons" / "icon-512.png"
OUT = ROOT / "icons" / "theme"
SIZE = 384
ART_RATIO = 0.56


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


def build(page, accent, surface, art):
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    plate = Image.new("RGBA", (SIZE, SIZE), page + (255,))
    plate.alpha_composite(glow(SIZE, accent, 88, 0.62, (SIZE * 0.5, SIZE * 0.32)))
    plate.alpha_composite(glow(SIZE, accent, 46, 0.5, (SIZE * 0.78, SIZE * 0.82)))
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=int(SIZE * 0.225), fill=255)
    canvas.paste(plate, (0, 0), mask)

    art_size = int(SIZE * ART_RATIO)
    pad = int(SIZE * 0.045)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((SIZE // 2 - art_size // 2 - pad, SIZE // 2 - art_size // 2 - pad,
                            SIZE // 2 + art_size // 2 + pad, SIZE // 2 + art_size // 2 + pad),
                           radius=int(SIZE * 0.2), fill=surface + (215,))

    logo = art.resize((art_size, art_size), Image.LANCZOS)
    logo_mask = Image.new("L", (art_size, art_size), 0)
    ImageDraw.Draw(logo_mask).rounded_rectangle((0, 0, art_size - 1, art_size - 1),
                                                radius=int(art_size * 0.24), fill=255)
    canvas.paste(logo, (SIZE // 2 - art_size // 2, SIZE // 2 - art_size // 2), logo_mask)

    ring = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(ring).rounded_rectangle((9, 9, SIZE - 10, SIZE - 10), radius=int(SIZE * 0.2),
                                           outline=accent + (200,), width=4)
    canvas.alpha_composite(ring)
    return canvas


def main():
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    app = (ROOT / "app.js").read_text(encoding="utf-8")
    themes = json.loads(re.search(r"const THEMES = (\[[^\]]+\])", app).group(1).replace("'", '"'))
    base = parse_vars(re.search(r":root \{[^}]+\}", css).group(0))
    art = Image.open(SRC).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for theme in themes:
        block = re.search(r':root\[data-theme="%s"\] \{[^}]+\}' % theme, css)
        values = dict(base)
        if block:
            values.update(parse_vars(block.group(0)))
        image = build(rgb(values.get("--page"), "#17191f"),
                      rgb(values.get("--accent"), "#8b5cf6"),
                      rgb(values.get("--surface"), "#222631"),
                      art)
        path = OUT / f"{theme}.png"
        # quantize ให้ไฟล์เล็กลงเยอะ (ไอคอนมีแค่ไล่เฉดไม่กี่สี) — สำคัญกับแคชมือถือ
        image.convert("RGB").quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(path, "PNG", optimize=True)
        total += path.stat().st_size
        print(f"  {theme:<10} {path.stat().st_size / 1024:5.1f} KB")
    print(f"รวม {len(themes)} ธีม · {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
