#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Claude Code 日本語記事収集スクリプト（Zenn・Qiita / GitHub Actions 用）"""

import json, re, hashlib, html as _html, urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).parent.parent / "docs" / "data" / "claude.json"
UA  = "MothershipDashboard/1.0 (+personal app)"
MAX = 30

FEEDS = [
    ("Zenn",  "https://zenn.dev/topics/claudecode/feed"),
    ("Zenn",  "https://zenn.dev/topics/claude/feed"),
    ("Qiita", "https://qiita.com/tags/claude-code/feed"),
    ("Qiita", "https://qiita.com/tags/claude_code/feed"),
]


def fetch_url(url, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")


def strip_html(s):
    s = re.sub(r"<!\[CDATA\[|\]\]>", "", s or "")
    s = re.sub(r"<[^>]+>", " ", s)
    s = _html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def stable_id(s):
    return "cc_" + hashlib.md5(s.encode()).hexdigest()[:8]


def safe_domain(url):
    m = re.search(r"https?://([^/]+)", url)
    return re.sub(r"^www\.", "", m.group(1)) if m else ""


def main():
    seen  = set()
    items = []

    for source, feed_url in FEEDS:
        try:
            xml    = fetch_url(feed_url)
            blocks = re.findall(r"<item[\s\S]*?</item>|<entry[\s\S]*?</entry>", xml, re.IGNORECASE)
            for block in blocks:
                def g(tags):
                    for t in tags:
                        m = re.search(fr"<{t}[^>]*>([\s\S]*?)</{t}>", block, re.IGNORECASE)
                        if m:
                            return strip_html(m.group(1)).strip()
                    return ""

                title = g(["title"])
                lm    = re.search(r"<link>([\s\S]*?)</link>", block, re.IGNORECASE)
                url   = strip_html(lm.group(1)) if lm else ""
                if not url:
                    am = re.search(r'<link[^>]+href=["\']([^"\']+)["\']', block, re.IGNORECASE)
                    if am:
                        url = am.group(1)
                if not title or not url:
                    continue
                # Claude に関係しない記事は除外
                if not re.search(r"claude", title, re.IGNORECASE):
                    continue
                if url in seen:
                    continue
                seen.add(url)

                pub_raw = g(["pubDate", "published", "updated"])
                try:
                    pub = datetime.fromisoformat(pub_raw.replace("Z", "+00:00")).isoformat() if pub_raw else None
                except Exception:
                    pub = None

                # 本文概要（description / summary / content から取得）
                excerpt = strip_html(g(["description", "summary", "content:encoded", "content"]))[:200]

                items.append({
                    "id":          stable_id(url),
                    "title":       title,
                    "url":         url,
                    "domain":      safe_domain(url),
                    "source":      source,
                    "publishedAt": pub,
                    "fetchedAt":   datetime.now(timezone.utc).isoformat(),
                    "excerpt":     excerpt,
                })
        except Exception as e:
            print(f"  {source} ({feed_url}): エラー ({e})")

    items.sort(key=lambda i: i.get("publishedAt") or i.get("fetchedAt") or "", reverse=True)
    result = {"items": items[:MAX], "lastCollection": datetime.now(timezone.utc).isoformat()}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), "utf-8")
    print(f"Claude Code: {len(items[:MAX])} 件保存 → {OUT}")


if __name__ == "__main__":
    main()
