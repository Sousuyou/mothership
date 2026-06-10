#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""はてなブックマーク IT 人気エントリ収集スクリプト（GitHub Actions 用）"""

import json, re, hashlib, urllib.request, urllib.parse
from datetime import datetime, timezone
from pathlib import Path

OUT        = Path(__file__).parent.parent / "docs" / "data" / "hatena.json"
UA         = "MothershipDashboard/1.0 (+personal app)"
MAX_ENT    = 12
MAX_CM     = 6
HATENA_RSS = "https://b.hatena.ne.jp/hotentry/it.rss"


def fetch_url(url, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")


def strip_html(s):
    s = re.sub(r"<!\[CDATA\[|\]\]>", "", s or "")
    s = re.sub(r"<[^>]+>", " ", s)
    for ent, rep in [("&amp;","&"),("&lt;","<"),("&gt;",">"),("&quot;",'"'),("&#39;","'")]:
        s = s.replace(ent, rep)
    return re.sub(r"\s+", " ", s).strip()


def stable_id(s):
    return "h_" + hashlib.md5(s.encode()).hexdigest()[:8]


def safe_domain(url):
    m = re.search(r"https?://([^/]+)", url)
    return re.sub(r"^www\.", "", m.group(1)) if m else ""


def main():
    xml   = fetch_url(HATENA_RSS)
    blocks = re.findall(r"<item[\s\S]*?</item>", xml, re.IGNORECASE)

    entries = []
    for block in blocks[:MAX_ENT]:
        def g(tag):
            m = re.search(fr"<{tag}[^>]*>([\s\S]*?)</{tag}>", block, re.IGNORECASE)
            return strip_html(m.group(1)) if m else ""

        title = strip_html(g("title"))
        lm    = re.search(r"<link>([\s\S]*?)</link>", block, re.IGNORECASE)
        url   = strip_html(lm.group(1)) if lm else ""
        if not title or not url:
            continue

        bm_raw = g("hatena:bookmarkcount") or "0"
        bm_count = int(re.search(r"(\d+)", bm_raw).group(1)) if re.search(r"\d+", bm_raw) else 0
        summary  = g("description")[:240]
        cm_page  = f"https://b.hatena.ne.jp/entry/s/{re.sub(r'^https?://', '', url)}"

        # コメント取得（API）
        comments = []
        try:
            api = "https://b.hatena.ne.jp/entry/jsonlite/?url=" + urllib.parse.quote(url, safe="")
            data = json.loads(fetch_url(api, timeout=10))
            if data.get("entry_url"):
                cm_page = data["entry_url"]
            for b in (data.get("bookmarks") or []):
                c = b.get("comment", "").strip()
                if c:
                    comments.append({
                        "user":      b.get("user", ""),
                        "comment":   c,
                        "tags":      b.get("tags", []),
                        "timestamp": b.get("timestamp", ""),
                    })
                if len(comments) >= MAX_CM:
                    break
        except Exception:
            pass

        entries.append({
            "id":             stable_id(url),
            "title":          title,
            "url":            url,
            "domain":         safe_domain(url),
            "bookmarkCount":  bm_count,
            "summary":        summary,
            "commentPageUrl": cm_page,
            "comments":       comments,
            "fetchedAt":      datetime.now(timezone.utc).isoformat(),
        })

    entries.sort(key=lambda e: e["bookmarkCount"], reverse=True)
    result = {"entries": entries, "lastCollection": datetime.now(timezone.utc).isoformat()}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), "utf-8")
    print(f"はてブ: {len(entries)} 件保存 → {OUT}")


if __name__ == "__main__":
    main()
