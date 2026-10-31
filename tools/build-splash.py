#!/usr/bin/env python3
"""สร้างภาพ launch screen (apple-touch-startup-image) ของ iOS

iOS ซูมไอคอนบนหน้าจอโฮมขยายเป็นแอปเสมอ ซึ่งเว็บปิดไม่ได้ สิ่งที่ทำได้คือทำให้
ปลายทางการซูมเหมือนหน้า splash ในแอปเป๊ะ ๆ (พื้นเข้ม + โลโก้กลางจอ) จะได้ไม่มี
จังหวะสะดุดหรือจอขาวแทรก

รันซ้ำได้ทุกครั้งที่เปลี่ยนโลโก้:  python3 tools/build-splash.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ICON = ROOT / "icons" / "icon-512.png"
OUT = ROOT / "splash"

BASE = (23, 25, 31)          # --page ของธีมมืด (#17191f)
GLOW = (139, 92, 246)        # --accent (#8b5cf6)
GLOW_ALPHA = 56              # ประมาณ mixing 22% กับพื้นหลัง
LOGO_PT = 96                 # เท่ากับ .splash img { width:96px }
RADIUS_PT = 24               # เท่ากับ border-radius:24px

# (ความกว้าง CSS, ความสูง CSS, devicePixelRatio) ของ iPhone ที่ยังใช้งานจริง
DEVICES = [
    (375, 667, 2),   # SE 2/3
    (375, 812, 3),   # X / 11 Pro / 12 mini
    (360, 780, 3),   # 13 mini
    (390, 844, 3),   # 12 / 13 / 14
    (393, 852, 3),   # 14 Pro / 15 / 16
    (402, 874, 3),   # 16 Pro
    (414, 896, 2),   # XR / 11
    (414, 896, 3),   # XS Max / 11 Pro Max
    (428, 926, 3),   # 12 / 13 Pro Max
    (430, 932, 3),   # 14 Pro Max / 15 Plus
    (440, 956, 3),   # 16 Pro Max
]


def glow_layer(width, height):
    """วงเรืองแสงจาง ๆ กลางบน เหมือน radial-gradient ของหน้า splash"""
    radius = int(max(width, height) * 0.8)
    gradient = Image.radial_gradient("L").resize((radius * 2, radius * 2), Image.BICUBIC)
    mask = gradient.point(lambda value: int(GLOW_ALPHA * (1 - value / 255) ** 1.8))
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    tint = Image.new("RGBA", (radius * 2, radius * 2), GLOW + (255,))
    layer.paste(tint, (int(width / 2 - radius), int(height * 0.34 - radius)), mask)
    return layer


def build(width_pt, height_pt, scale):
    width, height = width_pt * scale, height_pt * scale
    canvas = Image.new("RGBA", (width, height), BASE + (255,))
    canvas.alpha_composite(glow_layer(width, height))

    size = LOGO_PT * scale
    logo = Image.open(ICON).convert("RGBA").resize((size, size), Image.LANCZOS)
    rounded = Image.new("L", (size, size), 0)
    ImageDraw.Draw(rounded).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=RADIUS_PT * scale, fill=255
    )
    logo.putalpha(rounded)
    # โลโก้อยู่นิ่งกลางจอค่อนไปทางบน เพราะในแอปมีชื่อกับแถบโหลดต่อท้าย
    left = int(width / 2 - size / 2)
    top = int(height / 2 - 38 * scale - size / 2)
    canvas.alpha_composite(logo, (left, top))
    return canvas.convert("RGB")


def main():
    OUT.mkdir(exist_ok=True)
    total = 0
    for width_pt, height_pt, scale in DEVICES:
        name = f"splash-{width_pt * scale}x{height_pt * scale}.png"
        path = OUT / name
        build(width_pt, height_pt, scale).save(path, optimize=True)
        total += path.stat().st_size
        print(f"{name:>18}  {path.stat().st_size / 1024:6.1f} KB")
    print(f"รวม {len(DEVICES)} ไฟล์ · {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
