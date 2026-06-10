// 母艦 — フロント（GitHub Pages 静的版）
// GitHub Actions が 6時間ごとに収集した JSON を fetch して表示。サーバー不要。

const PANELS = [
  {
    id: "news", tab: "カクテル&ジン", icon: "🍸",
    title: "カクテル & ジン ニュース",
    lead: "世界のバー・蒸留メディアから自動収集し、日本語に訳して届けます。",
    ready: true
  },
  {
    id: "hatena", tab: "はてブ IT", icon: "🔖",
    title: "はてなブックマーク IT人気",
    lead: "ITの人気エントリを自動巡回。タップするとブックマーク（コメント）ページへ移動します。",
    ready: true
  },
  {
    id: "claude", tab: "Claude Code", icon: "🤖",
    title: "Claude Code 最新情報",
    lead: "Zenn・Qiita の日本語記事を自動巡回します。「Claude Code」に関する記事を新着順で表示。",
    ready: true
  },
  {
    id: "quickref", tab: "早見表", icon: "⚡",
    title: "趣味の早見データ",
    lead: "全趣味の情報に素早くアクセスする、自分専用の早見表です。",
    ready: true
  }
];

const state = {
  active: "news",
  articles:  [],
  hatena:    { entries: [], lastCollection: null },
  claude:    { items: [],   lastCollection: null },
  quickref:  { items: [] },
  loaded: false,
  category: "all",
  languageMode: "translated",
  query: "",
  quickrefCategory: "all",
  quickrefQuery: "",
};

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem("mydash:prefs") || "{}");
    Object.assign(state, {
      active:           saved.active           || state.active,
      category:         saved.category         || state.category,
      languageMode:     saved.languageMode      || state.languageMode,
      quickrefCategory: saved.quickrefCategory  || state.quickrefCategory,
      quickrefQuery:    saved.quickrefQuery     || state.quickrefQuery,
    });
  } catch { /* 無視 */ }
}
function savePrefs() {
  try {
    localStorage.setItem("mydash:prefs", JSON.stringify({
      active: state.active, category: state.category,
      languageMode: state.languageMode,
      quickrefCategory: state.quickrefCategory, quickrefQuery: state.quickrefQuery,
    }));
  } catch { /* 無視 */ }
}

const el = {
  nav:       document.querySelector("#siteNav"),
  hero:      document.querySelector("#hero"),
  eyebrow:   document.querySelector("#panelEyebrow"),
  title:     document.querySelector("#panelTitle"),
  lead:      document.querySelector("#panelLead"),
  heroPanel: document.querySelector("#heroPanel"),
  body:      document.querySelector("#panelBody")
};

async function loadState() {
  const load = (path, fallback) =>
    fetch(path).then(r => r.ok ? r.json() : fallback).catch(() => fallback);

  const [articles, hatena, claude, quickref] = await Promise.all([
    load("data/articles.json", []),
    load("data/hatena.json",   { entries: [], lastCollection: null }),
    load("data/claude.json",   { items: [],   lastCollection: null }),
    load("data/quickref.json", { items: [] }),
  ]);

  state.articles = Array.isArray(articles) ? articles : [];
  state.hatena   = hatena;
  state.claude   = claude;
  state.quickref = quickref;
  state.loaded   = true;
}

// =========================================================
// ルーティング
// =========================================================
function renderNav() {
  el.nav.innerHTML = PANELS.map((p) => {
    let badge = "";
    if (state.loaded) {
      const counts = {
        news:     state.articles.length,
        hatena:   (state.hatena?.entries  || []).length,
        claude:   (state.claude?.items    || []).length,
        quickref: (state.quickref?.items  || []).length,
      };
      if (counts[p.id]) badge = `<span class="tab-badge">${counts[p.id]}</span>`;
    }
    return `<button class="nav-tab ${state.active === p.id ? "active" : ""}" data-panel="${p.id}" type="button">
      ${p.icon} ${escapeHtml(p.tab)} ${badge}</button>`;
  }).join("");
}

function route(panelId) {
  const panel = PANELS.find((p) => p.id === panelId) || PANELS[0];
  state.active = panel.id;
  savePrefs();
  renderNav();
  el.eyebrow.textContent = "PERSONAL DASHBOARD";
  el.title.textContent   = panel.title;
  el.lead.textContent    = panel.lead;
  const renderers = { news: renderNews, hatena: renderHatena, claude: renderClaude, quickref: renderQuickref };
  const heroes    = { news: heroNews,   hatena: heroHatena,   claude: heroClaude,   quickref: heroQuickref };
  (heroes[panel.id]    || (() => setHeroPanel("")))();
  (renderers[panel.id] || (() => { el.body.innerHTML = ""; }))();
}

function setHeroPanel(html) {
  if (!html) { el.heroPanel.hidden = true; el.hero.classList.add("no-panel"); return; }
  el.hero.classList.remove("no-panel");
  el.heroPanel.hidden = false;
  el.heroPanel.innerHTML = html;
}
function heroStat(label, value, sub) {
  setHeroPanel(`<span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(sub)}</small>`);
}

// =========================================================
// ① ニュース
// =========================================================
function heroNews() {
  if (!state.loaded) return setHeroPanel("");
  heroStat("収録記事", state.articles.length, `今週 ${weeklyArticles().length} 件`);
}

function weeklyArticles() {
  const weekAgo = Date.now() - 7 * 86400000;
  return state.articles.filter((a) => new Date(a.publishedAt || a.fetchedAt).getTime() >= weekAgo);
}

function weeklyTop(n = 5) {
  const recent = weeklyArticles();
  const pool   = recent.length ? recent : state.articles;
  return [...pool].sort((a, b) => Number(b.relevance || 0) - Number(a.relevance || 0)).slice(0, n);
}

function renderNews() {
  if (!state.loaded) {
    el.body.innerHTML = `<div class="empty"><h3>読み込み中…</h3></div>`;
    return;
  }
  const filtered = getFilteredArticles();
  el.body.innerHTML = `
    ${renderWeekly()}
    <div class="toolbar">
      <label class="search-field">
        <span class="ico">🔍</span>
        <input id="searchInput" type="search"
          placeholder="キーワードで検索（日本語・原文どちらも）"
          value="${escapeAttribute(state.query)}" autocomplete="off">
      </label>
      <div class="seg" role="group" aria-label="言語">
        <button data-lang="translated" class="${state.languageMode === "translated" ? "active" : ""}">訳</button>
        <button data-lang="original"   class="${state.languageMode === "original"   ? "active" : ""}">原文</button>
      </div>
    </div>
    ${renderChips()}
    <div class="cards" id="cards"></div>
    <div class="empty" id="emptyState" ${filtered.length ? "hidden" : ""}>
      <h3>${state.articles.length ? "条件に合う記事がありません" : "まだ記事がありません"}</h3>
      <p>${state.articles.length
        ? "検索やカテゴリを変えてみてください。"
        : "GitHub Actions が 6時間ごとに自動収集します。しばらくお待ちください。"}</p>
    </div>`;
  document.querySelector("#cards").innerHTML = filtered.map(renderCard).join("");
  bindNewsEvents();
}

function renderWeekly() {
  const top = weeklyTop(5);
  if (!top.length) return "";
  const count = weeklyArticles().length;
  const items = top.map((a) => {
    const line = (a.summaryJa && a.summaryJa[0]) ? a.summaryJa[0] : (a.excerptJa || a.excerpt || "");
    return `
      <li class="wk-item">
        <a href="${escapeAttribute(a.url)}" target="_blank" rel="noreferrer">${escapeHtml(displayTitle(a))}</a>
        <span class="wk-meta">${escapeHtml(a.sourceTitle || "")}${a.publishedAt ? " ・ " + escapeHtml(formatDay(a.publishedAt)) : ""}</span>
        ${line ? `<span class="wk-line">${escapeHtml(trimText(line, 70))}</span>` : ""}
      </li>`;
  }).join("");
  return `
    <section class="weekly">
      <div class="weekly-head">
        <h3>今週の重要ニュース</h3>
        <span>${count ? `直近7日 ${count}件から厳選` : "新着から厳選"}</span>
      </div>
      <ul class="weekly-list">${items}</ul>
    </section>`;
}

function renderChips() {
  const cats = [...new Set(state.articles.flatMap((a) => a.categories || []))].sort();
  const all  = [{ label: "すべて", value: "all" }, ...cats.map((c) => ({ label: c, value: c }))];
  return `<div class="chips" id="chips">${all.map((c) => `
    <button class="chip ${state.category === c.value ? "active" : ""}"
      data-category="${escapeAttribute(c.value)}" type="button">
      ${escapeHtml(c.label)}<small>${countCategory(c.value)}</small>
    </button>`).join("")}</div>`;
}

function renderCard(article) {
  const published = article.publishedAt ? formatDate(article.publishedAt) : "日付不明";
  const tags = (article.categories || []).map((c) => `<span class="tag">${escapeHtml(c)}</span>`).join("");
  const body = state.languageMode === "translated"
    ? `<ul class="summary">${displaySummary(article).map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`
    : `<p class="excerpt">${escapeHtml(article.excerpt || "概要はありません。")}</p>`;
  return `
    <article class="card">
      <div class="card-meta">
        <span class="src">${escapeHtml(article.sourceTitle || "")}</span>
        <span class="dot">/</span>
        <span>${escapeHtml(published)}</span>
      </div>
      <h3 class="card-title">
        <a href="${escapeAttribute(article.url)}" target="_blank" rel="noreferrer">${escapeHtml(displayTitle(article))}</a>
      </h3>
      <div class="card-tags">${tags}</div>
      ${body}
    </article>`;
}

function getFilteredArticles() {
  const q = state.query.trim().toLowerCase();
  return state.articles
    .filter((a) => {
      const catOk   = state.category === "all" || (a.categories || []).includes(state.category);
      const queryOk = !q || [a.title, a.titleJa, a.titleDisplayJa, a.excerpt, a.excerptJa, a.sourceTitle,
        ...(a.categories || [])].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      return catOk && queryOk;
    })
    .sort((a, b) => new Date(b.publishedAt || b.fetchedAt) - new Date(a.publishedAt || a.fetchedAt));
}

function countCategory(cat) {
  if (cat === "all") return state.articles.length;
  return state.articles.filter((a) => (a.categories || []).includes(cat)).length;
}
function displayTitle(a) {
  if (state.languageMode === "original") return a.title;
  return a.titleDisplayJa || a.titleJa || a.title;
}
function displaySummary(a) {
  if (a.summaryJa?.length) return a.summaryJa;
  const excerpt = a.excerptJa || a.excerpt || "概要はありません。";
  return [excerpt, "詳細は原文リンクで確認できます。"];
}

function bindNewsEvents() {
  document.querySelector("#searchInput")?.addEventListener("input", (e) => {
    state.query = e.target.value;
    const filtered = getFilteredArticles();
    document.querySelector("#cards").innerHTML = filtered.map(renderCard).join("");
    const empty = document.querySelector("#emptyState");
    if (empty) empty.hidden = filtered.length > 0;
  });
  document.querySelector("#chips")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-category]");
    if (!btn) return;
    state.category = btn.dataset.category;
    savePrefs();
    renderNews();
  });
  el.body.querySelectorAll(".seg [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.languageMode = btn.dataset.lang;
      savePrefs();
      renderNews();
    });
  });
}

// =========================================================
// ② はてなブックマーク
// =========================================================
function heroHatena() {
  const entries = state.hatena?.entries || [];
  if (!state.loaded || !entries.length) return setHeroPanel("");
  heroStat("人気エントリ", entries.length, "IT・人気順");
}

function renderHatena() {
  const data = state.hatena || { entries: [], lastCollection: null };
  const last = data.lastCollection ? `最終更新 ${formatDate(data.lastCollection)}` : "自動更新待ち";
  el.body.innerHTML = `
    <p class="auto-update-note">🔄 6時間ごとに自動更新 &nbsp;・&nbsp; ${escapeHtml(last)}</p>
    ${data.entries.length
      ? `<div class="hatena-list">${data.entries.map(renderHentry).join("")}</div>`
      : `<div class="empty"><h3>データを取得中です</h3>
          <p>GitHub Actions が 6時間ごとに自動取得します。初回取得まで少しお待ちください。</p></div>`}`;
}

function renderHentry(entry) {
  const comments = (entry.comments || []).slice(0, 3);
  const preview  = comments.length
    ? `<ul class="cm-preview">${comments.map((c) => `
        <li><span class="cm-user">${escapeHtml(c.user || "匿名")}</span> ${escapeHtml(trimText(c.comment || "", 60))}</li>
      `).join("")}</ul>`
    : "";
  return `
    <article class="hentry">
      <div class="hentry-head">
        <span class="bm-count">${entry.bookmarkCount || 0}<small>users</small></span>
        <span class="hentry-domain">${escapeHtml(entry.domain || "")}</span>
      </div>
      <h3 class="hentry-title">
        <a href="${escapeAttribute(entry.commentPageUrl)}" target="_blank" rel="noreferrer">${escapeHtml(entry.title || "")}</a>
      </h3>
      ${entry.summary ? `<p class="hentry-summary">${escapeHtml(entry.summary)}</p>` : ""}
      ${preview}
      <div class="hentry-links">
        <a href="${escapeAttribute(entry.commentPageUrl)}" target="_blank" rel="noreferrer">💬 ブクマ・コメントを見る</a>
        <a href="${escapeAttribute(entry.url)}" target="_blank" rel="noreferrer">元記事 →</a>
      </div>
    </article>`;
}

// =========================================================
// ③ Claude Code（Zenn・Qiita）
// =========================================================
function heroClaude() {
  const items = state.claude?.items || [];
  if (!state.loaded || !items.length) return setHeroPanel("");
  heroStat("記事", items.length, "Zenn・Qiita・新着順");
}

function renderClaude() {
  const data = state.claude || { items: [], lastCollection: null };
  const last = data.lastCollection ? `最終更新 ${formatDate(data.lastCollection)}` : "自動更新待ち";
  el.body.innerHTML = `
    <p class="auto-update-note">🔄 6時間ごとに自動更新 &nbsp;・&nbsp; ${escapeHtml(last)}</p>
    ${data.items.length
      ? `<div class="cc-list">${data.items.map(renderCCItem).join("")}</div>`
      : `<div class="empty"><h3>データを取得中です</h3>
          <p>GitHub Actions が Zenn・Qiita の「Claude Code」記事を 6時間ごとに自動取得します。</p></div>`}`;
}

function renderCCItem(it) {
  const sourceBadge = it.source
    ? `<span class="cc-source-badge">${escapeHtml(it.source)}</span>`
    : "";
  const dateStr = it.publishedAt || it.date;
  const excerptHtml = it.excerpt
    ? `<p class="cc-excerpt">${escapeHtml(trimText(it.excerpt, 130))}</p>`
    : "";
  return `
    <article class="cc-item">
      <div class="cc-head">
        ${sourceBadge}
        <span class="cc-domain">${escapeHtml(it.domain || "")}</span>
        ${dateStr ? `<span class="cc-date">${escapeHtml(formatDay(dateStr))}</span>` : ""}
      </div>
      <h3 class="cc-title">
        <a href="${escapeAttribute(it.url)}" target="_blank" rel="noreferrer">${escapeHtml(it.title || "")}</a>
      </h3>
      ${excerptHtml}
    </article>`;
}

// =========================================================
// ④ 早見表（読み取り専用）
// =========================================================
function heroQuickref() {
  const items = state.quickref?.items || [];
  if (!state.loaded) return setHeroPanel("");
  const cats = new Set(items.map((i) => i.category));
  heroStat("項目", items.length, `${cats.size} カテゴリ`);
}

function isTimelineCat(cat) {
  return cat.includes("年表");
}

function sortKeyForYear(label) {
  const bc = label.match(/BC\s*(\d+)/i);
  if (bc) return -Number(bc[1]);
  const ad = label.match(/^(\d+)/);
  if (ad) return Number(ad[1]);
  return 9999;
}

function parseTimelineValue(val) {
  const m = String(val).match(/^\[([^\]]+)\]\s*([\s\S]*)/);
  if (m) return { badge: m[1], text: m[2] };
  return { badge: null, text: val };
}

function renderTimelineSection(cat, items) {
  const sorted = [...items].sort((a, b) => sortKeyForYear(a.label) - sortKeyForYear(b.label));
  return `
    <section class="qr-section">
      <h3 class="qr-cat">${escapeHtml(cat)}</h3>
      <div class="qr-timeline">${sorted.map(renderTimelineEntry).join("")}</div>
    </section>`;
}

function renderTimelineEntry(it) {
  const { badge, text } = parseTimelineValue(it.value);
  const badgeHtml = badge ? `<span class="tl-badge">${escapeHtml(badge)}</span>` : "";
  const urlPart   = it.url ? `<a class="tl-link" href="${escapeAttribute(it.url)}" target="_blank" rel="noreferrer">→</a>` : "";
  return `
    <div class="tl-entry">
      <div class="tl-year">${escapeHtml(it.label)}</div>
      <div class="tl-body">${badgeHtml}<span class="tl-text">${escapeHtml(text)}</span>${urlPart}</div>
    </div>`;
}

function filterAndRenderQrSections(byCat) {
  const activeCat = state.quickrefCategory || "all";
  const query     = (state.quickrefQuery   || "").trim().toLowerCase();
  const srcCats   = (activeCat === "all"
    ? Object.keys(byCat)
    : (byCat[activeCat] ? [activeCat] : [])).sort();

  const finalCats = [];
  const filtered  = {};
  for (const c of srcCats) {
    const rows = (byCat[c] || []).filter((it) =>
      !query || [it.label, it.value].some((v) => String(v || "").toLowerCase().includes(query))
    );
    if (rows.length) { finalCats.push(c); filtered[c] = rows; }
  }

  const container = document.querySelector("#qrSections");
  if (!container) return;
  container.innerHTML = finalCats.length
    ? finalCats.map((c) => isTimelineCat(c)
        ? renderTimelineSection(c, filtered[c])
        : `<section class="qr-section">
            <h3 class="qr-cat">
              <span>${escapeHtml(c)}</span>
              <span class="qr-cat-count">${filtered[c].length} 項目</span>
            </h3>
            <div class="qr-entries">${filtered[c].map(renderQrRow).join("")}</div>
          </section>`
      ).join("")
    : `<div class="empty">
        <h3>${query ? `「${escapeHtml(query)}」に一致する項目がありません` : "データを読み込んでいます"}</h3>
        <p>${query ? "別のキーワードを試してください。" : ""}</p>
      </div>`;
}

function renderQuickref() {
  const items  = state.quickref?.items || [];
  const byCat  = {};
  for (const it of items) { (byCat[it.category] ||= []).push(it); }
  const allCats   = Object.keys(byCat).sort();
  const activeCat = state.quickrefCategory || "all";

  el.body.innerHTML = `
    <label class="search-field qr-search">
      <span class="ico">🔍</span>
      <input id="qrSearchInput" type="search"
        placeholder="キーワードで絞り込み（産地・年・ジャンル名など）"
        value="${escapeAttribute(state.quickrefQuery || "")}" autocomplete="off">
    </label>
    <div class="chips" id="qrChips">
      <button class="chip ${activeCat === "all" ? "active" : ""}" data-qrcat="all" type="button">
        すべて<small>${items.length}</small>
      </button>
      ${allCats.map((c) => `
        <button class="chip ${activeCat === c ? "active" : ""}" data-qrcat="${escapeAttribute(c)}" type="button">
          ${escapeHtml(c)}<small>${(byCat[c] || []).length}</small>
        </button>`).join("")}
    </div>
    <div id="qrSections"></div>`;

  filterAndRenderQrSections(byCat);

  document.querySelector("#qrSearchInput")?.addEventListener("input", (e) => {
    state.quickrefQuery = e.target.value;
    savePrefs();
    filterAndRenderQrSections(byCat);
  });
  document.querySelector("#qrChips")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-qrcat]");
    if (!btn) return;
    state.quickrefCategory = btn.dataset.qrcat;
    savePrefs();
    renderQuickref();
  });
}

function renderQrRow(it) {
  const value = it.url
    ? `<a href="${escapeAttribute(it.url)}" target="_blank" rel="noreferrer">${escapeHtml(it.value || it.url)}</a>`
    : escapeHtml(it.value || "");
  return `
    <div class="qr-entry">
      <div class="qr-entry-title">${escapeHtml(it.label)}</div>
      <div class="qr-entry-body">${value}</div>
    </div>`;
}

// =========================================================
// 共通ヘルパ
// =========================================================
function formatDate(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(value));
}
function formatDay(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date(value));
}
function trimText(text, max) {
  const v = String(text).trim();
  return v.length <= max ? v : `${v.slice(0, max - 1)}…`;
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function escapeAttribute(value = "") { return escapeHtml(value).replaceAll("`", "&#96;"); }

// =========================================================
// 初期化
// =========================================================
el.nav.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-panel]");
  if (btn) route(btn.dataset.panel);
});

loadPrefs();
renderNav();
route(state.active);

loadState()
  .then(() => route(state.active))
  .catch(() => {
    el.body.innerHTML = `
      <div class="empty">
        <h3>データを読み込めませんでした</h3>
        <p>ページを再読み込みするか、しばらく待ってからアクセスしてください。</p>
      </div>`;
  });
