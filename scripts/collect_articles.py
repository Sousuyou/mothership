#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""カクテル・ジンニュース収集スクリプト（GitHub Actions 用）"""

import json, re, time, hashlib, urllib.request, urllib.parse
from datetime import datetime, timezone
from pathlib import Path

OUT   = Path(__file__).parent.parent / "docs" / "data" / "articles.json"
CACHE = Path(__file__).parent / ".translation_cache.json"
MAX   = 200
UA    = "MothershipDashboard/1.0 (+personal app)"

FEEDS = [
    ("punch",    "PUNCH",               "https://punchdrink.com/feed/",              "カクテル文化・技法"),
    ("imbibe",   "Imbibe Magazine",     "https://imbibemagazine.com/feed/",           "ドリンク全般・レシピ"),
    ("jeffrey",  "Jeffrey Morgenthaler","https://jeffreymorgenthaler.com/feed/",     "バーテンディング技法"),
    ("chilled",  "Chilled Magazine",    "https://chilledmagazine.com/feed/",          "業界ニュース"),
    ("spirits",  "The Spirits Business","https://www.thespiritsbusiness.com/feed/",  "スピリッツ業界・ジン"),
]

KEYWORDS = [
    ("ジン",        ["gin", "genever", "juniper", "botanical", "distill", "ジン", "蒸留"]),
    ("カクテル技法", ["technique", "clarified", "fat wash", "infusion", "cordial", "syrup"]),
    ("レシピ",       ["recipe", "cocktail", "drink", "negroni", "martini", "highball"]),
    ("バー業界",     ["bar", "bartender", "hospitality", "award", "opening"]),
    ("トレンド",     ["trend", "launch", "innovation", "limited", "low abv"]),
]


def stable_id(s):
    return "a_" + hashlib.md5(s.encode()).hexdigest()[:8]


def strip_html(s):
    s = re.sub(r"<!\[CDATA\[|\]\]>", "", s or "")
    s = re.sub(r"<[^>]+>", " ", s)
    for ent, rep in [("&amp;","&"),("&lt;","<"),("&gt;",">"),("&quot;",'"'),("&apos;","'"),("&#39;","'")]:
        s = s.replace(ent, rep)
    return re.sub(r"\s+", " ", s).strip()


def fetch_url(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")


def parse_feed(xml, feed_id, feed_title, feed_focus):
    blocks = re.findall(r"<item[\s\S]*?</item>|<entry[\s\S]*?</entry>", xml, re.IGNORECASE)
    results = []
    for block in blocks:
        def g(tags):
            for t in tags:
                m = re.search(fr"<{t}[^>]*>([\s\S]*?)</{t}>", block, re.IGNORECASE)
                if m:
                    return strip_html(m.group(1)).strip()
            return ""

        title = g(["title"])
        # RSS <link>
        lm = re.search(r"<link>([\s\S]*?)</link>", block, re.IGNORECASE)
        url = strip_html(lm.group(1)).strip() if lm else ""
        if not url:
            am = re.search(r'<link[^>]+href=["\']([^"\']+)["\']', block, re.IGNORECASE)
            if am:
                url = am.group(1)
        if not title or not url:
            continue

        excerpt = g(["content:encoded", "description", "summary", "content"])[:500]
        pub_raw = g(["pubDate", "published", "updated", "dc:date"])
        try:
            pub = datetime.fromisoformat(pub_raw.replace("Z", "+00:00")).isoformat() if pub_raw else None
        except Exception:
            pub = None

        guid = g(["guid", "id"]) or url
        results.append({
            "id":          stable_id(f"{feed_id}:{guid}"),
            "feedId":      feed_id,
            "sourceTitle": feed_title,
            "sourceFocus": feed_focus,
            "title":       title,
            "url":         url,
            "excerpt":     excerpt,
            "publishedAt": pub,
            "fetchedAt":   datetime.now(timezone.utc).isoformat(),
        })
    return results


def categorize(title, excerpt):
    hay = (title + " " + excerpt).lower()
    cats = [c for c, kws in KEYWORDS if any(k.lower() in hay for k in kws)]
    return cats or ["未分類"]


def relevance_score(title, excerpt, categories):
    hay = (title + " " + excerpt).lower()
    score = sum(10 for c, kws in KEYWORDS for k in kws if k.lower() in hay)
    if "ジン" in categories:
        score += 20
    return min(score, 100)


def needs_translation(text):
    return bool(re.search(r"[A-Za-z]{4,}", text)) and not re.search(r"[ぁ-んァ-ン一-龯]", text[:80])


def translate_text(text, cache):
    if not text or not needs_translation(text):
        return text
    key = hashlib.md5(text.encode()).hexdigest()
    if key in cache:
        return cache[key]

    # Google Translate 無料エンドポイント
    try:
        qurl = ("https://translate.googleapis.com/translate_a/single"
                "?client=gtx&sl=en&tl=ja&dt=t&q=" + urllib.parse.quote(text[:500]))
        req = urllib.request.Request(qurl, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
        result = "".join(p[0] for p in data[0] if p[0])
        if result:
            cache[key] = result
            return result
    except Exception:
        pass

    # MyMemory フォールバック
    try:
        qurl = ("https://api.mymemory.translated.net/get"
                "?q=" + urllib.parse.quote(text[:480]) + "&langpair=en|ja")
        req = urllib.request.Request(qurl, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
        result = (data.get("responseData") or {}).get("translatedText", "").strip()
        if result:
            cache[key] = result
            return result
    except Exception:
        pass

    return text


def polish_title(title):
    return re.sub(
        r"\s*[|｜–—-]\s*(Imbibe Magazine|PUNCH|The Spirits Business|Chilled Magazine|Jeffrey Morgenthaler).*$",
        "", title, flags=re.IGNORECASE
    ).strip()


def build_summary(excerpt_ja, categories, source):
    sents = re.split(r"(?<=[。！？.!?])\s*", (excerpt_ja or "").strip())
    sents = [s.strip() for s in sents if s.strip() and "appeared first" not in s.lower()][:3]
    while len(sents) < 3:
        if not sents:
            sents.append(f"{source}の記事です。")
        elif len(sents) == 1:
            sents.append("・".join(categories) + "に関連します。")
        else:
            sents.append("詳細は原文リンクで確認できます。")
    return sents[:3]


def main():
    # 翻訳キャッシュ読み込み
    cache = {}
    if CACHE.exists():
        try:
            cache = json.loads(CACHE.read_text("utf-8"))
        except Exception:
            pass

    # 既存記事（重複スキップ用）
    existing = []
    if OUT.exists():
        try:
            existing = json.loads(OUT.read_text("utf-8"))
            if not isinstance(existing, list):
                existing = []
        except Exception:
            pass
    seen_ids = {a["id"] for a in existing}

    new_articles = []
    for feed_id, feed_title, feed_url, feed_focus in FEEDS:
        try:
            xml   = fetch_url(feed_url)
            items = parse_feed(xml, feed_id, feed_title, feed_focus)
            new_count = 0
            for item in items:
                if item["id"] in seen_ids:
                    continue
                seen_ids.add(item["id"])
                item["titleJa"]        = translate_text(item["title"], cache)
                item["excerptJa"]      = translate_text(item["excerpt"][:400], cache)
                item["titleDisplayJa"] = polish_title(item["titleJa"])
                item["categories"]     = categorize(item["title"], item["excerpt"])
                item["relevance"]      = relevance_score(item["title"], item["excerpt"], item["categories"])
                item["summaryJa"]      = build_summary(item["excerptJa"], item["categories"], feed_title)
                new_articles.append(item)
                new_count += 1
                time.sleep(0.4)  # API レート制限を避ける
            print(f"  {feed_title}: {len(items)} 件取得, {new_count} 件新規")
        except Exception as e:
            print(f"  {feed_title}: エラー ({e})")

    # 最新順で最大 MAX 件
    all_articles = sorted(
        new_articles + existing,
        key=lambda a: a.get("publishedAt") or a.get("fetchedAt") or "",
        reverse=True
    )[:MAX]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(all_articles, ensure_ascii=False, indent=2), "utf-8")
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), "utf-8")
    print(f"保存完了: {len(all_articles)} 件 → {OUT}")


if __name__ == "__main__":
    main()
