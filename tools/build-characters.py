#!/usr/bin/env python3
"""Build characters.json from the Re:Zero wiki "Characters" page.

The wiki lists almost every character on one page as a grid of cards. Each card
links to the character's wiki page, carries a background colour that marks the
camp/faction, and sits under region and camp headings. Portraits are lazy
loaded: the parsed HTML often holds a 1x1 data: placeholder instead of the real
file, so the image name from data-image-name is resolved through the imageinfo
API in batches.

Usage: python3 tools/build-characters.py [--output characters.json]
"""

import argparse
import datetime
import html as html_module
import json
import re
import urllib.parse
import urllib.request

API = "https://rezero.fandom.com/api.php"
SOURCE = "https://rezero.fandom.com/wiki/Characters"
UA = "Mozilla/5.0 (reader-x7k2p character index builder)"

CARD_START = re.compile(r'<div style="background-color:\s*(#[0-9A-Fa-f]{3,6})[^"]*;', re.I)
HEADING = re.compile(r"<h([23])[^>]*>(.*?)</h\1>", re.S | re.I)
LINK = re.compile(r'<a href="/wiki/([^"#]+)"[^>]*title="([^"]*)"', re.I)
IMG = re.compile(r'<img[^>]*\ssrc="([^"]+)"', re.I)
IMAGE_NAME = re.compile(r'data-image-name="([^"]+)"', re.I)
LABEL = re.compile(r"<b>([^<]+)</b>")


def api_get(params):
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(API + "?" + query, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def strip_tags(value):
    text = re.sub(r"<[^>]+>", "", value)
    return html_module.unescape(re.sub(r"\s+", " ", text)).strip()


def sized(url, width=400):
    if not url or url.startswith("data:"):
        return ""
    return re.sub(r"scale-to-width-down/\d+", f"scale-to-width-down/{width}", url)


def resolve_files(filenames):
    """Map file names to real image URLs through the imageinfo API."""
    resolved = {}
    names = sorted({name for name in filenames if name})
    for start in range(0, len(names), 40):
        batch = names[start:start + 40]
        payload = api_get({
            "action": "query", "format": "json", "origin": "*", "prop": "imageinfo",
            "iiprop": "url", "iiurlwidth": "400",
            "titles": "|".join("File:" + name for name in batch),
        })
        for page in (payload.get("query", {}).get("pages") or {}).values():
            info = (page.get("imageinfo") or [{}])[0]
            url = info.get("thumburl") or info.get("url") or ""
            if not url:
                continue
            title = page.get("title", "")
            resolved[title] = url
            resolved[title[len("File:"):]] = url
    return resolved


def parse_cards(markup):
    headings = [
        (match.start(), "region" if match.group(1) == "2" else "section", strip_tags(match.group(2)))
        for match in HEADING.finditer(markup)
    ]
    starts = [match.start() for match in CARD_START.finditer(markup)]
    records, pending_files = [], []
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else len(markup)
        chunk = markup[start:end]
        colour = CARD_START.match(chunk).group(1).upper()
        link, image, image_name = LINK.search(chunk), IMG.search(chunk), IMAGE_NAME.search(chunk)
        if not link or not image:
            continue
        slug, title = link.group(1), strip_tags(link.group(2))
        label_match = LABEL.search(chunk)
        region = section = ""
        for offset, kind, text in headings:
            if offset > start:
                break
            if kind == "region":
                region, section = text, ""
            else:
                section = text
        file_name = html_module.unescape(image_name.group(1)) if image_name else ""
        records.append({
            "title": title,
            "slug": urllib.parse.unquote(slug).replace("_", " "),
            "name": strip_tags(label_match.group(1)) if label_match else title,
            "section": section,
            "region": region,
            "color": colour,
            "file": file_name,
            "image": sized(html_module.unescape(image.group(1))),
        })
        if not records[-1]["image"] and file_name:
            pending_files.append(file_name)
    resolved = resolve_files(pending_files) if pending_files else {}
    for record in records:
        if record["image"] or not record["file"]:
            continue
        record["image"] = resolved.get("File:" + record["file"]) or resolved.get(record["file"]) or ""
    return [record for record in records if record["image"]]


def dedupe(characters):
    seen, unique = set(), []
    for record in characters:
        key = record["title"].lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(record)
    return unique


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="characters.json")
    args = parser.parse_args()
    markup = api_get({"action": "parse", "page": "Characters", "prop": "text", "format": "json", "origin": "*"})["parse"]["text"]["*"]
    characters = dedupe(parse_cards(markup))
    document = {
        "source": SOURCE,
        "generated": datetime.date.today().isoformat(),
        "count": len(characters),
        "characters": characters,
    }
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(document, handle, ensure_ascii=False, indent=1)
        handle.write("\n")
    placeholders = sum(1 for c in characters if c["image"].startswith("data:"))
    print(f"{len(characters)} characters with real images, {len({c['color'] for c in characters})} colours, placeholders left: {placeholders} -> {args.output}")


if __name__ == "__main__":
    main()
