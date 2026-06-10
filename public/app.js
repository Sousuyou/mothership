// =========================================================
// 私のためのアプリ — 私の司令塔（フロント）
//   ・上部タブで複数パネルを切り替える（Bar Soutsu「紙テーマ」準拠＋朱印で個人専用）
//   ・ローカル専用。外部公開しない。有料AIは使わない。
// =========================================================

const PANELS = [
  {
    id: "news", tab: "カクテル&ジン", icon: "🍸",
    title: "カクテル & ジン ニュース",
    lead: "世界のバー・蒸留メディアから記事を自動収集し、日本語に訳して届けます。",
    ready: true
  },
  {
    id: "hatena", tab: "はてブ IT", icon: "🔖",
    title: "はてなブックマーク IT人気",
    lead: "ITの人気エントリを巡回。タップするとブックマーク（コメント）ページへ移動します。",
    ready: true
  },
  {
    id: "claude", tab: "Claude Code", icon: "🤖",
    title: "Claude Code 最新情報",
    lead: "Zenn・Qiita の日本語記事を巡回します。「Claude Code」に関する記事を新着順で表示。",
    ready: true
  },
  {
    id: "knowledge", tab: "ナレッジ", icon: "🧠",
    title: "ナレッジ & 発想",
    lead: "知識・哲学のメモを貯めて振り返り、毎日の「発想のタネ」で思考を深めます。",
    ready: true
  },
  {
    id: "quickref", tab: "早見表", icon: "⚡",
    title: "趣味の早見データ",
    lead: "全趣味の情報に素早くアクセスする、自分専用の早見表です。",
    ready: true
  },
  {
    id: "sns", tab: "SNS投稿", icon: "✍️",
    title: "SNS投稿アシスタント",
    lead: "お酒・カクテルの情報を入れるだけで、Instagram用の投稿文とハッシュタグを業界トーンで複数案つくります。無料・このPCの中だけ。",
    ready: true
  }
];

// 「発想のタネ」（無料・ルールベース。日替わりで1つ表示）
const THINKING_PROMPTS = [
  "今日学んだことを一つ、誰かに教えるとしたらどう説明する？",
  "最近「当たり前」と思っていることを一つ、あえて疑ってみよう。",
  "3年前の自分に伝えたい考えは？ なぜ今はそう思える？",
  "今ハマっている趣味の「面白さの核」を一文で言うと？",
  "やめたら人生が軽くなりそうな習慣を一つ挙げてみよう。",
  "別々の趣味どうしを掛け合わせたら、何か新しく作れない？",
  "最近の小さな違和感をメモしてみよう。改善のタネかも。",
  "尊敬する人なら、今の自分の悩みにどう答えるだろう？",
  "10年後も価値が変わらないと思うものは何？",
  "今日いちばん心が動いた瞬間は？ それはなぜ？"
];

const state = {
  active: "news",
  feeds: [],
  articles: [],
  lastCollection: null,
  collectionLog: [],
  hatena: { entries: [], lastCollection: null },
  claude: { items: [], lastCollection: null },
  knowledge: { notes: [] },
  quickref: { items: [] },
  loaded: false,
  // ニュース表示設定
  category: "all",
  languageMode: "translated", // translated | original
  query: "",
  // 早見表フィルタ
  quickrefCategory: "all",
  quickrefQuery: "",
  // ナレッジ検索
  knowledgeQuery: ""
};

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem("mydash:prefs") || "{}");
    Object.assign(state, {
      active: saved.active || state.active,
      category: saved.category || state.category,
      languageMode: saved.languageMode || state.languageMode,
      quickrefCategory: saved.quickrefCategory || state.quickrefCategory,
      quickrefQuery: saved.quickrefQuery || state.quickrefQuery,
      knowledgeQuery: saved.knowledgeQuery || state.knowledgeQuery
    });
  } catch { /* 無視 */ }
}
function savePrefs() {
  try {
    localStorage.setItem("mydash:prefs", JSON.stringify({
      active: state.active, category: state.category, languageMode: state.languageMode,
      quickrefCategory: state.quickrefCategory, quickrefQuery: state.quickrefQuery,
      knowledgeQuery: state.knowledgeQuery
    }));
  } catch { /* 無視 */ }
}

const el = {
  nav: document.querySelector("#siteNav"),
  hero: document.querySelector("#hero"),
  eyebrow: document.querySelector("#panelEyebrow"),
  title: document.querySelector("#panelTitle"),
  lead: document.querySelector("#panelLead"),
  heroPanel: document.querySelector("#heroPanel"),
  body: document.querySelector("#panelBody")
};

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || "通信に失敗しました。");
  return payload;
}
async function loadState() {
  const payload = await fetchJson("/api/state");
  Object.assign(state, payload);
  state.loaded = true;
}

// =========================================================
// ルーティング
// =========================================================
function renderNav() {
  el.nav.innerHTML = PANELS.map((p) => {
    let badge = "";
    if (state.loaded) {
      const counts = {
        news: state.articles.length,
        hatena: (state.hatena?.entries || []).length,
        claude: (state.claude?.items || []).length,
        knowledge: (state.knowledge?.notes || []).length,
        quickref: (state.quickref?.items || []).length
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
  el.title.textContent = panel.title;
  el.lead.textContent = panel.lead;

  const renderers = { news: renderNews, hatena: renderHatena, claude: renderClaude, knowledge: renderKnowledge, quickref: renderQuickref, sns: renderSns };
  const heroes = { news: heroNews, hatena: heroHatena, claude: heroClaude, knowledge: heroKnowledge, quickref: heroQuickref, sns: heroSns };
  (heroes[panel.id] || (() => setHeroPanel("")))();
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
// ① ニュース（シンプル版：既読/スター/再翻訳なし・緑なし・今週の要約あり）
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
  const pool = recent.length ? recent : state.articles;
  return [...pool].sort((a, b) => Number(b.relevance || 0) - Number(a.relevance || 0)).slice(0, n);
}

function renderNews() {
  if (!state.loaded) { el.body.innerHTML = `<div class="empty"><h3>読み込み中…</h3></div>`; return; }
  const filtered = getFilteredArticles();

  el.body.innerHTML = `
    ${renderWeekly()}
    <div class="toolbar">
      <label class="search-field">
        <span class="ico">🔍</span>
        <input id="searchInput" type="search" placeholder="キーワードで検索（日本語・原文どちらも）"
          value="${escapeAttribute(state.query)}" autocomplete="off">
      </label>
      <div class="seg" role="group" aria-label="言語">
        <button data-lang="translated" class="${state.languageMode === "translated" ? "active" : ""}">訳</button>
        <button data-lang="original" class="${state.languageMode === "original" ? "active" : ""}">原文</button>
      </div>
      <button class="btn" id="collectBtn" type="button">最新を収集</button>
    </div>

    ${renderChips()}

    <div class="cards" id="cards"></div>
    <div class="empty" id="emptyState" ${filtered.length ? "hidden" : ""}>
      <h3>${state.articles.length ? "条件に合う記事がありません" : "まだ記事がありません"}</h3>
      <p>${state.articles.length ? "検索やカテゴリを変えてみてください。" : "「最新を収集」を押すと記事を取り込みます。"}</p>
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
  const categories = [...new Set(state.articles.flatMap((a) => a.categories || []))].sort();
  const all = [{ label: "すべて", value: "all" }, ...categories.map((c) => ({ label: c, value: c }))];
  return `<div class="chips" id="chips">${all.map((c) => `
    <button class="chip ${state.category === c.value ? "active" : ""}" data-category="${escapeAttribute(c.value)}" type="button">
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
      const catOk = state.category === "all" || (a.categories || []).includes(state.category);
      const queryOk = !q || [a.title, a.titleJa, a.titleDisplayJa, a.excerpt, a.excerptJa, a.sourceTitle, ...(a.categories || [])]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      return catOk && queryOk;
    })
    .sort((a, b) => new Date(b.publishedAt || b.fetchedAt) - new Date(a.publishedAt || a.fetchedAt));
}

function countCategory(category) {
  if (category === "all") return state.articles.length;
  return state.articles.filter((a) => (a.categories || []).includes(category)).length;
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
  const search = document.querySelector("#searchInput");
  if (search) {
    search.addEventListener("input", (e) => {
      state.query = e.target.value;
      const filtered = getFilteredArticles();
      document.querySelector("#cards").innerHTML = filtered.map(renderCard).join("");
      const empty = document.querySelector("#emptyState");
      if (empty) empty.hidden = filtered.length > 0;
    });
  }
  document.querySelector("#chips")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-category]");
    if (!btn) return;
    state.category = btn.dataset.category; savePrefs(); renderNews();
  });
  el.body.querySelectorAll(".seg [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => { state.languageMode = btn.dataset.lang; savePrefs(); renderNews(); });
  });
  document.querySelector("#collectBtn")?.addEventListener("click", onCollect);
}

async function onCollect() {
  const btn = document.querySelector("#collectBtn");
  btn.disabled = true; btn.textContent = "収集中…";
  try { await fetchJson("/api/collect", { method: "POST" }); await loadState(); route("news"); }
  catch (err) { alert(`収集に失敗しました：${err.message}`); }
  finally { const b = document.querySelector("#collectBtn"); if (b) { b.disabled = false; b.textContent = "最新を収集"; } }
}

// =========================================================
// ② はてなブックマーク（タップでブクマページへ）
// =========================================================
function heroHatena() {
  const entries = state.hatena?.entries || [];
  if (!state.loaded || !entries.length) return setHeroPanel("");
  heroStat("人気エントリ", entries.length, "IT・人気順");
}

function renderHatena() {
  const data = state.hatena || { entries: [], lastCollection: null };
  const last = data.lastCollection ? `最終巡回 ${formatDate(data.lastCollection)}` : "まだ巡回していません";
  el.body.innerHTML = `
    <div class="toolbar">
      <p class="section-label" style="margin:0; flex:1;">${escapeHtml(last)}</p>
      <button class="btn" id="hatenaCollectBtn" type="button">巡回する</button>
    </div>
    ${data.entries.length ? `<div class="hatena-list">${data.entries.map(renderHentry).join("")}</div>` : `
      <div class="empty"><h3>まだ巡回していません</h3>
      <p>「巡回する」を押すと、はてなブックマークIT人気エントリを取り込みます。</p></div>`}`;
  document.querySelector("#hatenaCollectBtn")?.addEventListener("click", onHatenaCollect);
}

function renderHentry(entry) {
  const comments = (entry.comments || []).slice(0, 3);
  const preview = comments.length
    ? `<ul class="cm-preview">${comments.map((c) => `
        <li><span class="cm-user">${escapeHtml(c.user || "匿名")}</span> ${escapeHtml(trimText(c.comment || "", 60))}</li>`).join("")}</ul>`
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

async function onHatenaCollect() {
  const btn = document.querySelector("#hatenaCollectBtn");
  btn.disabled = true; btn.textContent = "巡回中…（少し時間がかかります）";
  try { await fetchJson("/api/hatena/collect", { method: "POST" }); await loadState(); route("hatena"); }
  catch (err) { alert(`巡回に失敗しました：${err.message}`); const b = document.querySelector("#hatenaCollectBtn"); if (b) { b.disabled = false; b.textContent = "巡回する"; } }
}

// =========================================================
// ③ Claude Code（Zenn・Qiita 日本語記事巡回）
// =========================================================
function heroClaude() {
  const items = state.claude?.items || [];
  if (!state.loaded || !items.length) return setHeroPanel("");
  heroStat("記事", items.length, "Zenn・Qiita・新着順");
}

function renderClaude() {
  const data = state.claude || { items: [], lastCollection: null };
  const last = data.lastCollection ? `最終巡回 ${formatDate(data.lastCollection)}` : "まだ巡回していません";
  el.body.innerHTML = `
    <div class="toolbar">
      <p class="section-label" style="margin:0; flex:1;">${escapeHtml(last)}</p>
      <button class="btn" id="claudeCollectBtn" type="button">巡回する</button>
    </div>
    ${data.items.length ? `<div class="cc-list">${data.items.map(renderCCItem).join("")}</div>` : `
      <div class="empty"><h3>まだ巡回していません</h3>
      <p>「巡回する」を押すと、Zenn・Qiita の「Claude Code」日本語記事を新着順で取り込みます。</p></div>`}`;
  document.querySelector("#claudeCollectBtn")?.addEventListener("click", onClaudeCollect);
}

function renderCCItem(it) {
  const sourceBadge = it.source
    ? `<span class="cc-source-badge">${escapeHtml(it.source)}</span>`
    : "";
  const dateStr = it.publishedAt || it.date;
  return `
    <article class="cc-item">
      <div class="cc-head">
        ${sourceBadge}
        <span class="cc-domain">${escapeHtml(it.domain || "")}</span>
      </div>
      <h3 class="cc-title">
        <a href="${escapeAttribute(it.url)}" target="_blank" rel="noreferrer">${escapeHtml(it.title || "")}</a>
      </h3>
      <div class="cc-links">
        ${dateStr ? `<span class="cc-date">${escapeHtml(formatDay(dateStr))}</span>` : ""}
      </div>
    </article>`;
}

async function onClaudeCollect() {
  const btn = document.querySelector("#claudeCollectBtn");
  btn.disabled = true; btn.textContent = "巡回中…";
  try { await fetchJson("/api/claude/collect", { method: "POST" }); await loadState(); route("claude"); }
  catch (err) { alert(`巡回に失敗しました：${err.message}`); const b = document.querySelector("#claudeCollectBtn"); if (b) { b.disabled = false; b.textContent = "巡回する"; } }
}

// =========================================================
// ④ ナレッジ & 発想
// =========================================================
function heroKnowledge() {
  const notes = state.knowledge?.notes || [];
  if (!state.loaded) return setHeroPanel("");
  heroStat("メモ", notes.length, "ローカル保存");
}

function dailyPrompt() {
  const idx = Math.floor(Date.now() / 86400000) % THINKING_PROMPTS.length;
  return THINKING_PROMPTS[idx];
}

function dailyNoteRecall(notes) {
  if (notes.length < 3) return null;
  const dayIdx = Math.floor(Date.now() / 86400000);
  return notes[dayIdx % notes.length];
}

function filterAndRenderNotes() {
  const notes = state.knowledge?.notes || [];
  const query = (state.knowledgeQuery || "").trim().toLowerCase();
  const filtered = notes.filter((n) => !query || n.text.toLowerCase().includes(query));
  const container = document.querySelector("#noteListContainer");
  if (!container) return;
  if (!notes.length) {
    container.innerHTML = `<div class="empty"><h3>まだメモがありません</h3><p>上の欄に書いて、覚えておきたい知識や思いついたアイデアを追加しましょう。</p></div>`;
  } else if (!filtered.length) {
    container.innerHTML = `<div class="empty"><h3>「${escapeHtml(query)}」に一致するメモがありません</h3><p>別のキーワードを試してください。</p></div>`;
  } else {
    container.innerHTML = `<div class="note-list">${filtered.map(renderNote).join("")}</div>`;
  }
  container.querySelectorAll("[data-del-note]").forEach((b) => b.addEventListener("click", () => onDeleteNote(b.dataset.delNote)));
}

function renderKnowledge() {
  const notes = state.knowledge?.notes || [];
  const recall = dailyNoteRecall(notes);

  el.body.innerHTML = `
    <section class="prompt-box">
      <span class="prompt-label">今日の発想のタネ</span>
      <p class="prompt-text">${escapeHtml(dailyPrompt())}</p>
    </section>

    ${recall ? `
    <section class="recall-box">
      <span class="recall-label">過去メモの振り返り</span>
      <p class="recall-text">${escapeHtml(recall.text)}</p>
      <span class="recall-date">${escapeHtml(formatDate(recall.createdAt))}</span>
    </section>` : ""}

    <form class="note-form" id="noteForm">
      <textarea name="text" rows="2" placeholder="知識・気づき・哲学・アイデアをメモ…（自分だけに保存されます）" required></textarea>
      <button class="btn" type="submit">メモを追加</button>
    </form>

    ${notes.length ? `
    <label class="search-field kn-search">
      <span class="ico">🔍</span>
      <input id="knSearchInput" type="search" placeholder="メモを検索…"
        value="${escapeAttribute(state.knowledgeQuery || "")}" autocomplete="off">
    </label>` : ""}

    <div id="noteListContainer"></div>`;

  filterAndRenderNotes();

  document.querySelector("#noteForm")?.addEventListener("submit", onAddNote);
  document.querySelector("#knSearchInput")?.addEventListener("input", (e) => {
    state.knowledgeQuery = e.target.value;
    savePrefs();
    filterAndRenderNotes();
  });
}

function renderNote(note) {
  return `
    <article class="note">
      <p class="note-text">${escapeHtml(note.text)}</p>
      <div class="note-foot">
        <span>${escapeHtml(formatDate(note.createdAt))}</span>
        <button data-del-note="${escapeAttribute(note.id)}" type="button">削除</button>
      </div>
    </article>`;
}

async function onAddNote(e) {
  e.preventDefault();
  const text = e.target.text.value.trim();
  if (!text) return;
  try { await fetchJson("/api/knowledge", { method: "POST", body: JSON.stringify({ text }) }); await loadState(); route("knowledge"); }
  catch (err) { alert(err.message); }
}
async function onDeleteNote(id) {
  if (!confirm("このメモを削除しますか？")) return;
  try { await fetchJson("/api/knowledge/delete", { method: "POST", body: JSON.stringify({ id }) }); await loadState(); route("knowledge"); }
  catch (err) { alert(err.message); }
}

// =========================================================
// ⑤ 早見表（クイックリファレンス）
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
      <div class="qr-timeline">
        ${sorted.map(renderTimelineEntry).join("")}
      </div>
    </section>`;
}

function renderTimelineEntry(it) {
  const { badge, text } = parseTimelineValue(it.value);
  const badgeHtml = badge ? `<span class="tl-badge">${escapeHtml(badge)}</span>` : "";
  const urlPart = it.url ? `<a class="tl-link" href="${escapeAttribute(it.url)}" target="_blank" rel="noreferrer">→</a>` : "";
  return `
    <div class="tl-entry">
      <div class="tl-year">${escapeHtml(it.label)}</div>
      <div class="tl-body">
        ${badgeHtml}<span class="tl-text">${escapeHtml(text)}</span>${urlPart}
        <button class="qr-del" data-del-qr="${escapeAttribute(it.id)}" type="button" title="削除">×</button>
      </div>
    </div>`;
}

function filterAndRenderQrSections(byCat) {
  const activeCat = state.quickrefCategory || "all";
  const query = (state.quickrefQuery || "").trim().toLowerCase();
  const srcCats = (activeCat === "all" ? Object.keys(byCat) : (byCat[activeCat] ? [activeCat] : [])).sort();
  const finalCats = [];
  const filtered = {};
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
            <h3 class="qr-cat"><span>${escapeHtml(c)}</span><span class="qr-cat-count">${filtered[c].length} 項目</span></h3>
            <div class="qr-entries">${filtered[c].map(renderQrRow).join("")}</div>
          </section>`
      ).join("")
    : `<div class="empty"><h3>${query ? `「${escapeHtml(query)}」に一致する項目がありません` : "まだ早見データがありません"}</h3><p>${query ? "別のキーワードを試してください。" : "下のフォームから追加しましょう。"}</p></div>`;
  container.querySelectorAll("[data-del-qr]").forEach((b) => b.addEventListener("click", () => onDeleteQr(b.dataset.delQr)));
}

function renderQuickref() {
  const items = state.quickref?.items || [];
  const byCat = {};
  for (const it of items) { (byCat[it.category] ||= []).push(it); }
  const allCats = Object.keys(byCat).sort();
  const activeCat = state.quickrefCategory || "all";

  el.body.innerHTML = `
    <label class="search-field qr-search">
      <span class="ico">🔍</span>
      <input id="qrSearchInput" type="search" placeholder="キーワードで絞り込み（産地・年・ジャンル名など）"
        value="${escapeAttribute(state.quickrefQuery || "")}" autocomplete="off">
    </label>

    <div class="chips" id="qrChips">
      <button class="chip ${activeCat === "all" ? "active" : ""}" data-qrcat="all" type="button">すべて<small>${items.length}</small></button>
      ${allCats.map((c) => `<button class="chip ${activeCat === c ? "active" : ""}" data-qrcat="${escapeAttribute(c)}" type="button">${escapeHtml(c)}<small>${(byCat[c] || []).length}</small></button>`).join("")}
    </div>

    <div id="qrSections"></div>

    <details class="qr-add-wrap">
      <summary>＋ 自分の項目を追加する</summary>
      <form class="qr-form" id="qrForm">
        <input name="category" placeholder="カテゴリ（例：ウイスキー）" list="qrCats">
        <datalist id="qrCats">${allCats.map((c) => `<option value="${escapeAttribute(c)}">`).join("")}</datalist>
        <input name="label" placeholder="項目名・年（例：加水の目安 / 1999年）" required>
        <input name="value" placeholder="内容・メモ（年表なら [絵文字名] 出来事 の形式）">
        <input name="url" placeholder="リンク（任意）">
        <button class="btn" type="submit">追加</button>
      </form>
    </details>`;

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
  document.querySelector("#qrForm")?.addEventListener("submit", onAddQr);
}

function renderQrRow(it) {
  const value = it.url
    ? `<a href="${escapeAttribute(it.url)}" target="_blank" rel="noreferrer">${escapeHtml(it.value || it.url)}</a>`
    : escapeHtml(it.value || "");
  return `
    <div class="qr-entry">
      <div class="qr-entry-title">${escapeHtml(it.label)}</div>
      <div class="qr-entry-body">${value}</div>
      <button class="qr-del" data-del-qr="${escapeAttribute(it.id)}" type="button" title="削除">×</button>
    </div>`;
}

async function onAddQr(e) {
  e.preventDefault();
  const f = e.target;
  const body = { category: f.category.value.trim(), label: f.label.value.trim(), value: f.value.value.trim(), url: f.url.value.trim() };
  if (!body.label) return;
  try { await fetchJson("/api/quickref", { method: "POST", body: JSON.stringify(body) }); await loadState(); route("quickref"); }
  catch (err) { alert(err.message); }
}
async function onDeleteQr(id) {
  try { await fetchJson("/api/quickref/delete", { method: "POST", body: JSON.stringify({ id }) }); await loadState(); route("quickref"); }
  catch (err) { alert(err.message); }
}

// =========================================================
// ✍️ SNS投稿アシスタント（無料・ルールベース／このPCの中だけ）
//   入力（商品名・種類・特徴・狙い）から Instagram 用の投稿文を3案生成。
//   外部送信なし。お気に入りは localStorage に保存。
// =========================================================
const SNS_TYPES = ["ジン", "ウイスキー", "ラム", "テキーラ", "焼酎", "日本酒", "ワイン", "カクテル", "その他"];
const SNS_PURPOSES = [
  { id: "today", label: "今日の一杯" },
  { id: "new", label: "新メニュー告知" },
  { id: "stock", label: "入荷案内" },
  { id: "event", label: "イベント告知" },
  { id: "open", label: "営業案内" }
];
// 種類ごとの定番ハッシュタグ（日本語＋英語）
const SNS_TYPE_TAGS = {
  "ジン": ["#gin", "#ジン", "#クラフトジン", "#ジントニック", "#ginlover"],
  "ウイスキー": ["#whisky", "#ウイスキー", "#whiskey", "#シングルモルト", "#whiskylover"],
  "ラム": ["#rum", "#ラム", "#ラム酒", "#rumlover"],
  "テキーラ": ["#tequila", "#テキーラ", "#アガベ", "#mezcal"],
  "焼酎": ["#焼酎", "#shochu", "#本格焼酎"],
  "日本酒": ["#日本酒", "#sake", "#日本酒好きと繋がりたい"],
  "ワイン": ["#wine", "#ワイン", "#winelover", "#自然派ワイン"],
  "カクテル": ["#cocktail", "#カクテル", "#cocktails", "#mixology"],
  "その他": []
};
const SNS_BASE_TAGS = ["#bar", "#バー", "#バーテンダー", "#今日の一杯", "#お酒好きと繋がりたい", "#bartender"];
// トーン別の文章パーツ
const SNS_TONES = [
  {
    key: "royal", name: "王道",
    hook: (n) => `本日のおすすめ、${n}。`,
    bodyJoin: (feats) => feats.length ? `${feats.join("、")}が魅力の一杯です。` : `じっくり味わっていただきたい一杯です。`,
    close: "ご来店をお待ちしております。"
  },
  {
    key: "emo", name: "エモい",
    hook: (n) => `今夜、そっと一杯。${n}。`,
    bodyJoin: (feats) => feats.length ? `${feats.join("で、")}。そんな時間を、グラスの中に。` : `言葉より、まず一口を。`,
    close: "あなたの夜に、寄り添えますように。"
  },
  {
    key: "pro", name: "プロ解説",
    hook: (n) => `【${n}】注目したいポイントを。`,
    bodyJoin: (feats) => feats.length ? `特徴は ${feats.join(" / ")}。香り・余韻のバランスにこだわって仕上げています。` : `飲み手の好みに合わせて調整できる懐の深い一杯。`,
    close: "気になる方はカウンターでお気軽にどうぞ。"
  }
];
function snsPurposeLine(purpose, name) {
  switch (purpose) {
    case "new": return `\n🆕 新メニューとして登場しました。`;
    case "stock": return `\n📦 入荷しました。数に限りがあります。`;
    case "event": return `\n🎉 イベント開催中。この機会にぜひ。`;
    case "open": return `\n🚪 本日も営業しております。`;
    default: return "";
  }
}
function buildTags(type, feats) {
  const tags = [...SNS_BASE_TAGS, ...(SNS_TYPE_TAGS[type] || [])];
  // 特徴語のうち日本語のものを2つまでタグ化
  feats.slice(0, 2).forEach((f) => {
    const clean = f.replace(/[#\s]/g, "");
    if (clean && clean.length <= 8) tags.push(`#${clean}`);
  });
  return [...new Set(tags)];
}
function generateCaptions(input) {
  const name = input.name || "本日の一杯";
  const feats = (input.feats || "").split(/[、,]/).map((s) => s.trim()).filter(Boolean);
  const purposeLine = snsPurposeLine(input.purpose, name);
  const tags = buildTags(input.type, feats);
  return SNS_TONES.map((tone) => {
    const text = `${tone.hook(name)}\n${tone.bodyJoin(feats)}${purposeLine}\n\n${tone.close}\n\n${tags.join(" ")}`;
    return { toneKey: tone.key, toneName: tone.name, text };
  });
}

const snsState = { results: [], favs: [] };
function loadSnsFavs() {
  try { snsState.favs = JSON.parse(localStorage.getItem("mydash:sns:favs") || "[]"); } catch { snsState.favs = []; }
}
function saveSnsFavs() {
  try { localStorage.setItem("mydash:sns:favs", JSON.stringify(snsState.favs)); } catch { /* 無視 */ }
}

function heroSns() {
  setHeroPanel(`<span>保存した投稿文</span><strong>${snsState.favs.length}</strong><small>お気に入り件数</small>`);
}

function renderSns() {
  loadSnsFavs();
  let last = {};
  try { last = JSON.parse(localStorage.getItem("mydash:sns:last") || "{}"); } catch { /* 無視 */ }

  const typeChips = SNS_TYPES.map((t) =>
    `<button class="chip ${last.type === t ? "active" : ""}" data-snstype="${escapeAttribute(t)}" type="button">${escapeHtml(t)}</button>`).join("");
  const purposeChips = SNS_PURPOSES.map((p) =>
    `<button class="chip ${last.purpose === p.id ? "active" : ""}" data-snspurpose="${escapeAttribute(p.id)}" type="button">${escapeHtml(p.label)}</button>`).join("");

  el.body.innerHTML = `
    <div class="sns-wrap">
      <form id="snsForm" class="sns-form">
        <label class="sns-field">
          <span>商品名・カクテル名</span>
          <input type="text" name="name" placeholder="例）季の美 ジントニック" value="${escapeAttribute(last.name || "")}">
        </label>
        <div class="sns-field">
          <span>種類</span>
          <div class="chip-row" id="snsTypeChips">${typeChips}</div>
          <input type="hidden" name="type" value="${escapeAttribute(last.type || "ジン")}">
        </div>
        <label class="sns-field">
          <span>特徴・キーワード（読点や , で区切る）</span>
          <input type="text" name="feats" placeholder="例）柑橘の香り、爽やか、限定入荷" value="${escapeAttribute(last.feats || "")}">
        </label>
        <div class="sns-field">
          <span>投稿の狙い</span>
          <div class="chip-row" id="snsPurposeChips">${purposeChips}</div>
          <input type="hidden" name="purpose" value="${escapeAttribute(last.purpose || "today")}">
        </div>
        <button class="btn" type="submit">投稿文を3案つくる</button>
      </form>

      <div id="snsResults" class="sns-results"></div>

      ${snsState.favs.length ? `
      <details class="sns-favs" open>
        <summary>保存した投稿文（${snsState.favs.length}）</summary>
        <div id="snsFavList">${snsState.favs.map(renderSnsFav).join("")}</div>
      </details>` : ""}
    </div>`;

  // 種類チップ
  document.querySelector("#snsTypeChips")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-snstype]"); if (!btn) return;
    document.querySelector('input[name="type"]').value = btn.dataset.snstype;
    document.querySelectorAll("#snsTypeChips .chip").forEach((c) => c.classList.toggle("active", c === btn));
  });
  // 狙いチップ
  document.querySelector("#snsPurposeChips")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-snspurpose]"); if (!btn) return;
    document.querySelector('input[name="purpose"]').value = btn.dataset.snspurpose;
    document.querySelectorAll("#snsPurposeChips .chip").forEach((c) => c.classList.toggle("active", c === btn));
  });
  document.querySelector("#snsForm")?.addEventListener("submit", onSnsGenerate);
  document.querySelector("#snsResults")?.addEventListener("click", onSnsResultClick);
  document.querySelector("#snsFavList")?.addEventListener("click", onSnsFavClick);

  if (snsState.results.length) renderSnsResults();
}

function onSnsGenerate(e) {
  e.preventDefault();
  const f = e.target;
  const input = {
    name: f.name.value.trim(),
    type: f.type.value,
    feats: f.feats.value.trim(),
    purpose: f.purpose.value
  };
  try { localStorage.setItem("mydash:sns:last", JSON.stringify(input)); } catch { /* 無視 */ }
  snsState.results = generateCaptions(input);
  renderSnsResults();
}

function renderSnsResults() {
  const box = document.querySelector("#snsResults");
  if (!box) return;
  box.innerHTML = snsState.results.map((r, i) => `
    <article class="sns-card">
      <div class="sns-card-head">
        <span class="sns-tone">${escapeHtml(r.toneName)}</span>
        <div class="sns-card-actions">
          <button class="btn-mini" data-sns-copy="${i}" type="button">コピー</button>
          <button class="btn-mini" data-sns-save="${i}" type="button">★ 保存</button>
        </div>
      </div>
      <pre class="sns-text">${escapeHtml(r.text)}</pre>
    </article>`).join("");
}

async function onSnsResultClick(e) {
  const copyBtn = e.target.closest("[data-sns-copy]");
  const saveBtn = e.target.closest("[data-sns-save]");
  if (copyBtn) {
    const r = snsState.results[Number(copyBtn.dataset.snsCopy)];
    if (r) { await snsCopy(r.text, copyBtn); }
  } else if (saveBtn) {
    const r = snsState.results[Number(saveBtn.dataset.snsSave)];
    if (r) {
      snsState.favs.unshift({ id: `${r.toneKey}-${snsState.favs.length}-${r.text.length}`, text: r.text });
      saveSnsFavs();
      route("sns");
    }
  }
}

function renderSnsFav(fav, i) {
  return `
    <article class="sns-card">
      <div class="sns-card-head">
        <span class="sns-tone">保存 #${i + 1}</span>
        <div class="sns-card-actions">
          <button class="btn-mini" data-fav-copy="${i}" type="button">コピー</button>
          <button class="btn-mini" data-fav-del="${i}" type="button">削除</button>
        </div>
      </div>
      <pre class="sns-text">${escapeHtml(fav.text)}</pre>
    </article>`;
}

async function onSnsFavClick(e) {
  const copyBtn = e.target.closest("[data-fav-copy]");
  const delBtn = e.target.closest("[data-fav-del]");
  if (copyBtn) {
    const fav = snsState.favs[Number(copyBtn.dataset.favCopy)];
    if (fav) await snsCopy(fav.text, copyBtn);
  } else if (delBtn) {
    snsState.favs.splice(Number(delBtn.dataset.favDel), 1);
    saveSnsFavs();
    route("sns");
  }
}

async function snsCopy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = "コピー済";
    setTimeout(() => { btn.textContent = old; }, 1200);
  } catch {
    // クリップボードが使えない環境向けのフォールバック
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch { /* 無視 */ }
    document.body.removeChild(ta);
  }
}

// =========================================================
// 共通ヘルパ
// =========================================================
function formatDate(value) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function formatDay(value) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
function trimText(text, max) {
  const v = String(text).trim();
  return v.length <= max ? v : `${v.slice(0, max - 1)}…`;
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function escapeAttribute(value = "") { return escapeHtml(value).replaceAll("`", "&#96;"); }

// タブのクリック
el.nav.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-panel]");
  if (btn) route(btn.dataset.panel);
});

// 起動
loadPrefs();
renderNav();
route(state.active);
loadState()
  .then(() => { route(state.active); })
  .catch((err) => {
    el.body.innerHTML = `<div class="empty"><h3>サーバーに接続できません</h3>
      <p>「司令塔を起動.app」からアプリを立ち上げているか確認してください。（${escapeHtml(err.message)}）</p></div>`;
  });
