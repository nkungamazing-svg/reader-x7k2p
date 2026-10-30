#!/usr/bin/env python3
"""Bump the reader version and keep the service-worker cache name in sync.

Usage: python3 tools/bump-version.py [patch|minor|major]   (default: patch)

Versioning rule: the patch number runs 0-9, then the next bump rolls over
into the minor number (1.4.9 -> 1.5.0).
"""
import io
import re
import sys

PART = (sys.argv[1] if len(sys.argv) > 1 else "patch").lower()
if PART not in ("patch", "minor", "major"):
    sys.exit("usage: python3 tools/bump-version.py [patch|minor|major]")

app_path, sw_path = "app.js", "service-worker.js"
app = io.open(app_path, encoding="utf-8").read()
sw = io.open(sw_path, encoding="utf-8").read()

found = re.search(r'APP_VERSION = "(\d+)\.(\d+)\.(\d+)"', app)
if not found:
    sys.exit("APP_VERSION not found in app.js")
major, minor, patch = (int(part) for part in found.groups())

if PART == "patch":
    patch += 1
    if patch > 9:
        patch = 0
        minor += 1
elif PART == "minor":
    minor += 1
    patch = 0
else:
    major += 1
    minor = patch = 0

version = "%d.%d.%d" % (major, minor, patch)
app, count_app = re.subn(r'APP_VERSION = "\d+\.\d+\.\d+"', 'APP_VERSION = "%s"' % version, app)
sw, count_sw = re.subn(r'const CACHE_NAME = "[^"]+"', 'const CACHE_NAME = "noat-mobile-reader-%s"' % version, sw)
if count_app != 1 or count_sw != 1:
    sys.exit("expected exactly one version marker in each file (app=%d, sw=%d)" % (count_app, count_sw))

io.open(app_path, "w", encoding="utf-8").write(app)
io.open(sw_path, "w", encoding="utf-8").write(sw)
print("version -> %s (app.js + service-worker.js)" % version)
