#!/usr/bin/env python3
"""ดาวน์โหลดรูปตัวละครชุดหลักมาเก็บในโปรเจกต์ เพื่อให้หน้าเปิด/หัวเว็บขึ้นภาพได้ทันที

รันใหม่ได้ทุกเมื่อ:  python3 tools/fetch-character-art.py
ได้ผลลัพธ์: characters/<slug>.jpg (กว้าง 240px) + characters-local.json
"""
import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "characters"
WANTED = [
    "Emilia", "Subaru", "Puck", "Rem", "Ram", "Roswaal", "Beatrice",
    "Felt", "Reinhard", "Crusch", "Ferris", "Wilhelm",
    "Priscilla", "Al", "Anastasia", "Julius",
    "Echidna", "Garfiel", "Otto", "Frederica", "Petra", "Meili", "Elsa", "Satella",
]
WIDTH = 240
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"


def slugify(text):
    keep = "".join(ch.lower() if ch.isalnum() else "-" for ch in text)
    return "-".join(part for part in keep.split("-") if part)


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://rezero.fandom.com/"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def main():
    data = json.loads((ROOT / "characters.json").read_text(encoding="utf-8"))
    by_name = {}
    for item in data.get("characters", []):
        if item.get("name") and item["name"] not in by_name:
            by_name[item["name"]] = item
    OUT_DIR.mkdir(exist_ok=True)
    picked, failed = [], []
    for name in WANTED:
        item = by_name.get(name)
        if not item or not item.get("image"):
            failed.append(f"{name} (ไม่มีในดัชนี)")
            continue
        file_name = f"{slugify(item.get('slug') or name)}.jpg"
        target = OUT_DIR / file_name
        try:
            raw = fetch(item["image"].replace("scale-to-width-down/400", "scale-to-width-down/400"))
            image = Image.open(io.BytesIO(raw)).convert("RGB")
            height = round(image.height * WIDTH / image.width)
            image.resize((WIDTH, height), Image.LANCZOS).save(target, "JPEG", quality=72, optimize=True, progressive=True)
        except Exception as error:  # noqa: BLE001 - รายงานแล้วข้ามคนนี้
            failed.append(f"{name}: {error}")
            continue
        picked.append({
            "slug": item.get("slug") or name,
            "title": item.get("title") or name,
            "name": name,
            "image": f"characters/{file_name}",
        })
        print(f"  ✓ {name:<12} {target.stat().st_size / 1024:5.1f} KB")
    (ROOT / "characters-local.json").write_text(
        json.dumps({"source": "bundled", "count": len(picked), "characters": picked}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8")
    total = sum((OUT_DIR / entry["image"].split("/")[-1]).stat().st_size for entry in picked)
    print(f"รวม {len(picked)} คน · {total / 1024:.0f} KB")
    if failed:
        print("พลาด: " + "; ".join(failed), file=sys.stderr)
    if not picked:
        sys.exit("ดาวน์โหลดรูปไม่ได้เลย")


if __name__ == "__main__":
    main()
