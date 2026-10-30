#!/usr/bin/env python3
"""Build characters.json from the Re:Zero wiki "Characters" page.

The wiki lists almost every character on one page as a grid of cards. Each card
carries the portrait, the wiki page it links to and a background colour that
marks the character's camp/faction, and the cards are grouped under region and
camp headings. Scraping that page once gives the reader a local index, so a tap
finds a portrait without a per-name search.

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
LABEL = re.compile(r"<b>([^<]+)</b>")


def fetch_page_html():
    query = urllib.parse.urlencode(
        {"action": "parse", "page": "Characters", "prop": "text", "format": "json", "origin": "*"}
    )
    request = urllib.request.Request(API + "?" + query, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.load(response)
    return payload["parse"]["text"]["*"]


def strip_tags(value):
    text = re.sub(r"<[^>]+>", "", value)
    return html_module.unescape(re.sub(r"\s+", " ", text)).strip()


def large_image(url):
    return re.sub(r"scale-to-width-down/\d+", "scale-to-width-down/400", url)


def parse_cards(markup):
    headings = [
        (match.start(), "region" if match.group(1) == "2" else "section", strip_tags(match.group(2)))
        for match in HEADING.finditer(markup)
    ]
    starts = [match.start() for match in CARD_START.finditer(markup)]
    characters = []
    seen = {}
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else len(markup)
        chunk = markup[start:end]
        colour = CARD_START.match(chunk).group(1).upper()
        link = LINK.search(chunk)
        image = IMG.search(chunk)
        if not link or not image:
            continue
        slug, title = link.group(1), strip_tags(link.group(2))
        label_match = LABEL.search(chunk)
        label = strip_tags(label_match.group(1)) if label_match else title
        region = section = ""
        for offset, kind, text in headings:
            if offset > start:
                break
            if kind == "region":
                region, section = text, ""
            else:
                section = text
        record = {
            "title": title,
            "slug": urllib.parse.unquote(slug).replace("_", " "),
            "name": label,
            "section": section,
            "region": region,
            "color": colour,
            "image": large_image(html_module.unescape(image.group(1))),
        }
        key = title.toLocaleLowerCase() if hasattr(title, "toLocaleLowerCase") else title.lower()
        if key in seen:
            previous = seen[key]
            # Keep the first card but fill in a faction if the earlier one had none.
            if not previous["section"] and record["section"]:
                previous["section"] = record["section"]
                previous["region"] = record["region"]
                previous["color"] = record["color"]
            continue
        seen[key] = record
        characters.append(record)
    return characters


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="characters.json")
    args = parser.parse_args()
    markup = fetch_page_html()
    characters = parse_cards(markup)
    document = {
        "source": SOURCE,
        "generated": datetime.date.today().isoformat(),
        "count": len(characters),
        "characters": characters,
    }
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(document, handle, ensure_ascii=False, indent=1)
        handle.write("\n")
    sections = sorted({c["section"] or c["region"] for c in characters})
    colours = {c["color"] for c in characters}
    print(f"{len(characters)} characters, {len(colours)} colours, {len(sections)} sections -> {args.output}")
    for name in sections:
        print("  -", name)


if __name__ == "__main__":
    main()
