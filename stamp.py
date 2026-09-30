#!/usr/bin/env python3
# © 2026 Mihajlo Stojanovski. All rights reserved.
# Adds a content fingerprint to every asset link in index.html (assets/app.js?v=1a2b3c4d),
# so browsers load a changed file at once instead of a cached copy (Pages caches 10 min).
# Run before every commit of the site: publish_public.sh does it automatically.
import hashlib, os, re
root = os.path.dirname(os.path.abspath(__file__))
page = os.path.join(root, "index.html")
html = open(page, encoding="utf-8").read()
def stamp(m):
    path = m.group(2)
    with open(os.path.join(root, path), "rb") as f:
        v = hashlib.sha256(f.read()).hexdigest()[:10]
    return f'{m.group(1)}{path}?v={v}"'
new = re.sub(r'((?:src|href)=")(assets/[\w.\-]+\.(?:js|css|svg|png))(?:\?v=[0-9a-f]+)?"', stamp, html)
if new != html:
    open(page, "w", encoding="utf-8").write(new)
print("stamped:", ", ".join(sorted(set(re.findall(r'assets/[\w.\-]+\?v=[0-9a-f]+', new)))))
