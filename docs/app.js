// 母艦 — フロント（GitHub Pages 静的版）
// GitHub Actions が 6時間ごとに収集した JSON を fetch して表示。サーバー不要。

// =========================================================
// 雑談ネタ データ（120件超）
// =========================================================
const ZATSUDANE = [
  // ── お酒・バー ──────────────────────────────────
  { cat: "お酒・バー", text: "バーに来るようになったきっかけは何ですか？" },
  { cat: "お酒・バー", text: "最近飲んで美味しかったお酒は？" },
  { cat: "お酒・バー", text: "カクテルと日本酒、どちらが好きですか？" },
  { cat: "お酒・バー", text: "お気に入りのカクテルを一つ挙げるとしたら？" },
  { cat: "お酒・バー", text: "飲み方のこだわりってありますか？（氷・温度・グラスなど）" },
  { cat: "お酒・バー", text: "お酒を飲み始めたのはいつ頃ですか？" },
  { cat: "お酒・バー", text: "一番印象に残っているバーの思い出は？" },
  { cat: "お酒・バー", text: "一人飲みはしますか？どんな気分のときに？" },
  { cat: "お酒・バー", text: "家で飲むのと外で飲むのはどちらが好き？" },
  { cat: "お酒・バー", text: "ウイスキーはハイボール派？ストレート派？" },
  { cat: "お酒・バー", text: "飲んでみたいけどまだ飲んでいないお酒は？" },
  { cat: "お酒・バー", text: "何杯目が一番おいしいと思いますか？" },
  { cat: "お酒・バー", text: "締めに飲む一杯は何が好きですか？" },
  { cat: "お酒・バー", text: "お酒で失敗したエピソードがあれば（笑）" },
  { cat: "お酒・バー", text: "旅先で飲んで印象に残っているお酒は？" },
  { cat: "お酒・バー", text: "クラフトビールってよく飲みますか？" },
  { cat: "お酒・バー", text: "ウイスキー・ジン・ラム…どのスピリッツが好みですか？" },
  { cat: "お酒・バー", text: "ノンアルコールカクテルを飲んだことありますか？" },
  { cat: "お酒・バー", text: "お気に入りのおつまみは何ですか？" },
  { cat: "お酒・バー", text: "カクテルの名前で気になるものって何かありますか？" },
  { cat: "お酒・バー", text: "お酒の席で生まれた一番いいエピソードは？" },
  { cat: "お酒・バー", text: "お酒が弱くなった・強くなったと感じたことはありますか？" },
  { cat: "お酒・バー", text: "飲み仲間はどんな人たちですか？" },
  { cat: "お酒・バー", text: "バーに来る前に食事はしてきますか？" },
  { cat: "お酒・バー", text: "好きな日本酒の産地やタイプはありますか？" },

  // ── 旅行・食 ──────────────────────────────────
  { cat: "旅行・食", text: "最近行って印象に残った場所はありますか？" },
  { cat: "旅行・食", text: "国内でもう一度行きたい場所はどこですか？" },
  { cat: "旅行・食", text: "一人旅と複数人旅、どちらが好きですか？" },
  { cat: "旅行・食", text: "海外で一番よかった街はどこですか？" },
  { cat: "旅行・食", text: "旅先で一番食べておいしかったものは？" },
  { cat: "旅行・食", text: "行きたい国や街はありますか？" },
  { cat: "旅行・食", text: "旅先でのハプニングエピソードがあれば！" },
  { cat: "旅行・食", text: "旅行に必ず持っていくものは何ですか？" },
  { cat: "旅行・食", text: "宿はホテル派？旅館派？" },
  { cat: "旅行・食", text: "旅はがっちり計画派？現地任せ派？" },
  { cat: "旅行・食", text: "食べ物で苦手なジャンルはありますか？" },
  { cat: "旅行・食", text: "よく行く飲食店はどんなお店ですか？" },
  { cat: "旅行・食", text: "家でよく作る料理はありますか？" },
  { cat: "旅行・食", text: "深夜に食べたくなるものってありますか？" },
  { cat: "旅行・食", text: "地元のおすすめのお店を一軒挙げるとしたら？" },
  { cat: "旅行・食", text: "食に関して譲れないこだわりは？" },
  { cat: "旅行・食", text: "外食と自炊、普段どちらが多いですか？" },
  { cat: "旅行・食", text: "一番好きな料理のジャンルは（和・洋・中など）？" },
  { cat: "旅行・食", text: "旅行と出張、どちらの思い出が多いですか？" },
  { cat: "旅行・食", text: "行ったことのない都道府県で気になる場所は？" },

  // ── エンタメ・趣味 ───────────────────────────
  { cat: "エンタメ・趣味", text: "最近ハマっているものは何ですか？" },
  { cat: "エンタメ・趣味", text: "よく聴く音楽のジャンルは？" },
  { cat: "エンタメ・趣味", text: "最近みて印象に残っている映画やドラマは？" },
  { cat: "エンタメ・趣味", text: "本を読む習慣はありますか？最近読んだ本は？" },
  { cat: "エンタメ・趣味", text: "スポーツはしますか？観るのは好きですか？" },
  { cat: "エンタメ・趣味", text: "ゲームはやりますか？どんなジャンルが好き？" },
  { cat: "エンタメ・趣味", text: "写真を撮るのは好きですか？よく撮るジャンルは？" },
  { cat: "エンタメ・趣味", text: "最近買ってよかったものがあれば教えてください" },
  { cat: "エンタメ・趣味", text: "音楽ライブやコンサートに最近行きましたか？" },
  { cat: "エンタメ・趣味", text: "インドアとアウトドア、どちら派ですか？" },
  { cat: "エンタメ・趣味", text: "趣味を通じて仲良くなった人はいますか？" },
  { cat: "エンタメ・趣味", text: "ハマってたけど最近やめたことってありますか？" },
  { cat: "エンタメ・趣味", text: "YouTubeやNetflixでよく見るコンテンツは？" },
  { cat: "エンタメ・趣味", text: "アートや展覧会には行きますか？" },
  { cat: "エンタメ・趣味", text: "昔好きだったアーティストや作品はありますか？" },
  { cat: "エンタメ・趣味", text: "サウナやお風呂は好きですか？こだわりは？" },
  { cat: "エンタメ・趣味", text: "ペットを飼っていますか？好きな動物は？" },
  { cat: "エンタメ・趣味", text: "最近笑ったことは何ですか？" },
  { cat: "エンタメ・趣味", text: "今一番推しているものは何ですか？" },
  { cat: "エンタメ・趣味", text: "誰かに勧めたいコンテンツ（作品・場所・体験）は？" },

  // ── 価値観・人生 ─────────────────────────────
  { cat: "価値観・人生", text: "学生時代と今、どちらが楽しいですか？" },
  { cat: "価値観・人生", text: "もし仕事を変えるとしたら何をしたいですか？" },
  { cat: "価値観・人生", text: "人生で一番の転機はいつでしたか？" },
  { cat: "価値観・人生", text: "お金と時間、どちらが大事だと思いますか？" },
  { cat: "価値観・人生", text: "10年後どんな生活をしていたいですか？" },
  { cat: "価値観・人生", text: "一番影響を受けた人は誰ですか？" },
  { cat: "価値観・人生", text: "子どもの頃なりたかった職業は何ですか？" },
  { cat: "価値観・人生", text: "自分の性格をひと言で表すとしたら？" },
  { cat: "価値観・人生", text: "「やってよかった」と思う経験は何ですか？" },
  { cat: "価値観・人生", text: "生まれ変わったら何になりたいですか？" },
  { cat: "価値観・人生", text: "人生のモットーや大切にしていることは？" },
  { cat: "価値観・人生", text: "自分を動物に例えると何ですか？" },
  { cat: "価値観・人生", text: "一番長続きしていることは何ですか？" },
  { cat: "価値観・人生", text: "幸せを感じるのはどんな瞬間ですか？" },
  { cat: "価値観・人生", text: "得意なこと・苦手なことを一つずつ挙げると？" },
  { cat: "価値観・人生", text: "もし一億円あったら最初に何をしますか？" },
  { cat: "価値観・人生", text: "最近成長したなと感じることはありますか？" },
  { cat: "価値観・人生", text: "「あの頃に戻れるなら」と思う時期はありますか？" },
  { cat: "価値観・人生", text: "後悔していることと、してよかったことを一つずつ" },
  { cat: "価値観・人生", text: "自分を変えたいと思ったことがありますか？どんなところを？" },

  // ── 最近どう？ ───────────────────────────────
  { cat: "最近どう？", text: "最近嬉しかったことは何ですか？" },
  { cat: "最近どう？", text: "最近チャレンジしたことはありますか？" },
  { cat: "最近どう？", text: "今年に入ってから一番よかったことは？" },
  { cat: "最近どう？", text: "最近気になっているニュースや話題は？" },
  { cat: "最近どう？", text: "今日はどんな一日でしたか？" },
  { cat: "最近どう？", text: "最近よく行く場所はありますか？" },
  { cat: "最近どう？", text: "最近食べたもので一番美味しかったものは？" },
  { cat: "最近どう？", text: "最近びっくりしたことはありますか？" },
  { cat: "最近どう？", text: "今一番欲しいものは何ですか？" },
  { cat: "最近どう？", text: "最近笑ったこと・感動したことは？" },
  { cat: "最近どう？", text: "今の気分をひと言で表すと？" },
  { cat: "最近どう？", text: "最近「いい人だな」と思った人はいますか？" },
  { cat: "最近どう？", text: "今週の一番のできごとは何でしたか？" },
  { cat: "最近どう？", text: "最近自分へのご褒美はしましたか？" },
  { cat: "最近どう？", text: "最近誰かに感謝したことはありますか？" },
  { cat: "最近どう？", text: "今一番楽しみにしていることは何ですか？" },
  { cat: "最近どう？", text: "最近の悩みを一つ挙げるとしたら？" },
  { cat: "最近どう？", text: "最近会った人の中で印象的だった人は？" },
  { cat: "最近どう？", text: "最近口グセになっている言葉はありますか？" },
  { cat: "最近どう？", text: "最近手放したもの・やめたことはありますか？" },

  // ── どっちが好き？ ──────────────────────────
  { cat: "どっちが好き？", text: "朝型と夜型、どちらですか？" },
  { cat: "どっちが好き？", text: "コーヒー派ですか？紅茶派ですか？" },
  { cat: "どっちが好き？", text: "犬派ですか？猫派ですか？" },
  { cat: "どっちが好き？", text: "都市と田舎、住むならどちら？" },
  { cat: "どっちが好き？", text: "夏と冬、どちらが好きですか？" },
  { cat: "どっちが好き？", text: "肉料理と魚料理、どちらが好きですか？" },
  { cat: "どっちが好き？", text: "料理するのと外食するの、どちらが好き？" },
  { cat: "どっちが好き？", text: "計画通りに進めたい派？その場のノリ派？" },
  { cat: "どっちが好き？", text: "友達は多い方がいい？少数でも深い関係がいい？" },
  { cat: "どっちが好き？", text: "話すのが好きですか？聞く方が好きですか？" },
  { cat: "どっちが好き？", text: "予定を詰めたい派？余白が多い派？" },
  { cat: "どっちが好き？", text: "温泉とサウナ、どちらが好きですか？" },
  { cat: "どっちが好き？", text: "映画は映画館派？家で見る派？" },
  { cat: "どっちが好き？", text: "甘いものとしょっぱいもの、どちらが好き？" },
  { cat: "どっちが好き？", text: "電話とメッセージ、やり取りはどちら派？" },
  { cat: "どっちが好き？", text: "早めに終わらせる派？ギリギリまでやる派？" },
  { cat: "どっちが好き？", text: "褒められると嬉しい？認められると嬉しい？" },
  { cat: "どっちが好き？", text: "直感派？慎重派？" },
  { cat: "どっちが好き？", text: "一人の時間が好き？人と一緒にいる時間が好き？" },
  { cat: "どっちが好き？", text: "SNSは発信派？見る専派？" },
];

const ZN_SHOW = 20;

function znShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PANELS = [
  {
    id: "home", tab: "ホーム",
    title: "母艦 — 今日のまとめ",
    lead: "全パネルのハイライトを一覧表示します。",
    ready: true
  },
  {
    id: "news", tab: "カクテル&ジン",
    title: "カクテル & ジン ニュース",
    lead: "世界のバー・蒸留メディアから自動収集し、日本語に訳して届けます。",
    ready: true
  },
  {
    id: "hatena", tab: "はてブ IT",
    title: "はてなブックマーク IT人気",
    lead: "ITの人気エントリを自動巡回。タップするとブックマーク（コメント）ページへ移動します。",
    ready: true
  },
  {
    id: "claude", tab: "Claude Code",
    title: "Claude Code 最新情報",
    lead: "Zenn・Qiita の日本語記事を自動巡回します。「Claude Code」に関する記事を新着順で表示。",
    ready: true
  },
  {
    id: "quickref", tab: "早見表",
    title: "趣味の早見データ",
    lead: "全趣味の情報に素早くアクセスする、自分専用の早見表です。",
    ready: true
  },
  {
    id: "zatsudane", tab: "雑談ネタ",
    title: "雑談ネタ ジェネレーター",
    lead: `バー・友人・日常で使える話題を ${ZATSUDANE.length} 件収録。シャッフルで毎回新鮮な ${ZN_SHOW} 件を表示します。`,
    ready: true
  }
];

const state = {
  active: "home",
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
  zatsudaneCategory: "all",
  zatsudanePicks: [],
  znHideUsed: false,
  znUsed: new Set(),
  znCustom: [],
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
  znLoadStorage();
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

function znLoadStorage() {
  try {
    state.znUsed   = new Set(JSON.parse(localStorage.getItem("mydash:znUsed")   || "[]"));
    state.znCustom = JSON.parse(localStorage.getItem("mydash:znCustom") || "[]");
  } catch { state.znUsed = new Set(); state.znCustom = []; }
}
function znSaveUsed()   { try { localStorage.setItem("mydash:znUsed",   JSON.stringify([...state.znUsed]));   } catch {} }
function znSaveCustom() { try { localStorage.setItem("mydash:znCustom", JSON.stringify(state.znCustom));      } catch {} }
function getAllZatsudane() {
  return [...ZATSUDANE, ...state.znCustom.map((z) => ({ ...z, isCustom: true }))];
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
      ${escapeHtml(p.tab)} ${badge}</button>`;
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
  const renderers = { home: renderHome, news: renderNews, hatena: renderHatena, claude: renderClaude, quickref: renderQuickref, zatsudane: renderZatsudane };
  const heroes    = { home: heroHome,   news: heroNews,   hatena: heroHatena,   claude: heroClaude,   quickref: heroQuickref,   zatsudane: heroZatsudane };
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
// ホーム（全パネルサマリー）
// =========================================================
function heroHome() {
  if (!state.loaded) return setHeroPanel("");
  const total = state.articles.length + (state.hatena?.entries || []).length
    + (state.claude?.items || []).length + (state.quickref?.items || []).length;
  heroStat("総データ数", total, "4パネル合計");
}

function renderHome() {
  if (!state.loaded) {
    el.body.innerHTML = `<div class="empty"><h3>読み込み中…</h3></div>`;
    return;
  }

  // ニュース：最新3件
  const newItems = [...state.articles]
    .sort((a, b) => new Date(b.publishedAt || b.fetchedAt) - new Date(a.publishedAt || a.fetchedAt))
    .slice(0, 3);

  // はてブ：ブクマ数上位3件
  const hatItems = [...(state.hatena?.entries || [])]
    .sort((a, b) => (b.bookmarkCount || 0) - (a.bookmarkCount || 0))
    .slice(0, 3);

  // Claude Code：最新3件
  const ccItems = [...(state.claude?.items || [])]
    .sort((a, b) => new Date(b.publishedAt || b.fetchedAt) - new Date(a.publishedAt || a.fetchedAt))
    .slice(0, 3);

  // 早見表：カテゴリ一覧
  const qrItems = state.quickref?.items || [];
  const qrCats  = [...new Set(qrItems.map((i) => i.category))].sort();

  el.body.innerHTML = `
    <div class="home-grid">

      <section class="home-section">
        <div class="home-sec-head">
          <h3>カクテル &amp; ジン ニュース</h3>
          <button class="home-more-btn" data-panel="news" type="button">もっと見る →</button>
        </div>
        ${newItems.length
          ? `<ul class="home-list">${newItems.map((a) => `
              <li><a href="${escapeAttribute(a.url)}" target="_blank" rel="noreferrer">
                ${escapeHtml(a.titleDisplayJa || a.titleJa || a.title || "")}
              </a>
              <span class="home-meta">${a.sourceTitle ? escapeHtml(a.sourceTitle) : ""}${a.publishedAt ? " · " + escapeHtml(formatDay(a.publishedAt)) : ""}</span>
              </li>`).join("")}</ul>`
          : `<p class="home-empty">記事を収集中です</p>`}
      </section>

      <section class="home-section">
        <div class="home-sec-head">
          <h3>はてブ IT</h3>
          <button class="home-more-btn" data-panel="hatena" type="button">もっと見る →</button>
        </div>
        ${hatItems.length
          ? `<ul class="home-list">${hatItems.map((e) => `
              <li><a href="${escapeAttribute(e.commentPageUrl || e.url)}" target="_blank" rel="noreferrer">
                ${escapeHtml(e.title || "")}
              </a>
              <span class="home-meta">${escapeHtml(e.domain || "")} · ${e.bookmarkCount || 0} users</span>
              </li>`).join("")}</ul>`
          : `<p class="home-empty">記事を収集中です</p>`}
      </section>

      <section class="home-section">
        <div class="home-sec-head">
          <h3>Claude Code</h3>
          <button class="home-more-btn" data-panel="claude" type="button">もっと見る →</button>
        </div>
        ${ccItems.length
          ? `<ul class="home-list">${ccItems.map((it) => `
              <li><a href="${escapeAttribute(it.url)}" target="_blank" rel="noreferrer">
                ${escapeHtml(it.title || "")}
              </a>
              <span class="home-meta">${escapeHtml(it.source || "")}${it.publishedAt ? " · " + escapeHtml(formatDay(it.publishedAt)) : ""}</span>
              </li>`).join("")}</ul>`
          : `<p class="home-empty">記事を収集中です</p>`}
      </section>

      <section class="home-section">
        <div class="home-sec-head">
          <h3>早見表</h3>
          <button class="home-more-btn" data-panel="quickref" type="button">もっと見る →</button>
        </div>
        ${qrCats.length
          ? `<ul class="home-list">${qrCats.map((c) => {
              const count = qrItems.filter((i) => i.category === c).length;
              return `<li><button class="home-cat-link" data-panel="quickref" data-qrcat="${escapeAttribute(c)}" type="button">
                ${escapeHtml(c)}
              </button>
              <span class="home-meta">${count} 項目</span></li>`;
            }).join("")}</ul>`
          : `<p class="home-empty">データを読み込み中です</p>`}
      </section>

    </div>`;

  el.body.querySelectorAll("button[data-panel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.qrcat) {
        state.quickrefCategory = btn.dataset.qrcat;
        savePrefs();
      }
      route(btn.dataset.panel);
    });
  });
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

// =========================================================
// ⑤ 雑談ネタ
// =========================================================
function heroZatsudane() {
  const all  = getAllZatsudane();
  const cats = [...new Set(all.map((z) => z.cat))];
  heroStat("話題数", all.length, `${cats.length} カテゴリ`);
}

function znPickNew() {
  let pool = getAllZatsudane();
  if (state.zatsudaneCategory !== "all") pool = pool.filter((z) => z.cat === state.zatsudaneCategory);
  if (state.znHideUsed) pool = pool.filter((z) => !state.znUsed.has(z.text));
  state.zatsudanePicks = znShuffle(pool).slice(0, ZN_SHOW);
}

const ZN_CAT_COLORS = {
  "お酒・バー":    "zn-col-bar",
  "旅行・食":      "zn-col-trip",
  "エンタメ・趣味":"zn-col-ent",
  "価値観・人生":  "zn-col-life",
  "最近どう？":    "zn-col-now",
  "どっちが好き？":"zn-col-which",
};

function renderZatsudane() {
  if (!state.zatsudanePicks.length) znPickNew();

  const all  = getAllZatsudane();
  const cats = ["all", ...new Set(all.map((z) => z.cat))];
  const catChips = cats.map((c) => {
    const label = c === "all" ? "すべて" : c;
    const pool  = c === "all" ? all : all.filter((z) => z.cat === c);
    const avail = state.znHideUsed ? pool.filter((z) => !state.znUsed.has(z.text)).length : pool.length;
    return `<button class="chip ${state.zatsudaneCategory === c ? "active" : ""}" data-zncat="${escapeAttribute(c)}" type="button">
      ${escapeHtml(label)}<small>${avail}</small></button>`;
  }).join("");

  const cards = state.zatsudanePicks.map((z) => {
    const colorCls = z.isCustom ? "zn-col-custom" : (ZN_CAT_COLORS[z.cat] || "");
    const isUsed   = state.znUsed.has(z.text);
    const customBadge = z.isCustom ? `<span class="zn-my-badge">マイ</span>` : "";
    return `<div class="zn-card ${colorCls}${isUsed ? " zn-used" : ""}">
      <div class="zn-card-head">
        <span class="zn-cat-badge">${escapeHtml(z.cat)}</span>${customBadge}
      </div>
      <p class="zn-text">${escapeHtml(z.text)}</p>
      <div class="zn-card-actions">
        <button class="zn-copy-btn" data-text="${escapeAttribute(z.text)}" type="button">コピー</button>
        <button class="zn-used-btn${isUsed ? " on" : ""}" data-text="${escapeAttribute(z.text)}" type="button">
          ${isUsed ? "✓ 使用済" : "使った"}
        </button>
        ${z.isCustom ? `<button class="zn-del-btn" data-text="${escapeAttribute(z.text)}" type="button">削除</button>` : ""}
      </div>
    </div>`;
  }).join("");

  const poolSize = (() => {
    let p = all;
    if (state.zatsudaneCategory !== "all") p = p.filter((z) => z.cat === state.zatsudaneCategory);
    if (state.znHideUsed) p = p.filter((z) => !state.znUsed.has(z.text));
    return p.length;
  })();

  const builtinCats = [...new Set(ZATSUDANE.map((z) => z.cat))];
  const catOptions  = [...builtinCats, "マイカテゴリ"].map((c) =>
    `<option value="${escapeAttribute(c)}">${escapeHtml(c)}</option>`).join("");

  el.body.innerHTML = `
    <div class="zn-toolbar">
      <button class="zn-shuffle-btn" id="znShuffleBtn" type="button">シャッフル</button>
      <label class="zn-hide-toggle">
        <input type="checkbox" id="znHideUsedChk"${state.znHideUsed ? " checked" : ""}>
        使った話題を隠す
      </label>
      <span class="zn-counter">${state.zatsudanePicks.length} 件表示 / ${poolSize} 件${state.znUsed.size ? ` （使用済 ${state.znUsed.size} 件）` : ""}</span>
      ${state.znUsed.size ? `<button class="zn-reset-btn" id="znResetBtn" type="button">使用済をリセット</button>` : ""}
    </div>
    <div class="chips" id="znChips">${catChips}</div>

    <details class="zn-add-details" id="znAddDetails">
      <summary>＋ 話題を追加する</summary>
      <form class="zn-add-form" id="znAddForm" autocomplete="off">
        <select id="znAddCat" class="zn-add-select">${catOptions}</select>
        <input id="znAddText" class="zn-add-input" type="text" placeholder="話題のテキストを入力" maxlength="100">
        <button type="submit" class="zn-add-submit">追加</button>
      </form>
    </details>

    <div class="zn-grid" id="znGrid">${cards}</div>`;

  // イベント
  document.querySelector("#znShuffleBtn")?.addEventListener("click", () => {
    znPickNew();
    renderZatsudane();
  });
  document.querySelector("#znHideUsedChk")?.addEventListener("change", (e) => {
    state.znHideUsed = e.target.checked;
    state.zatsudanePicks = [];
    renderZatsudane();
  });
  document.querySelector("#znResetBtn")?.addEventListener("click", () => {
    state.znUsed.clear();
    znSaveUsed();
    state.zatsudanePicks = [];
    renderZatsudane();
  });
  document.querySelector("#znChips")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-zncat]");
    if (!btn) return;
    state.zatsudaneCategory = btn.dataset.zncat;
    state.zatsudanePicks = [];
    renderZatsudane();
  });
  document.querySelector("#znAddForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const cat  = document.querySelector("#znAddCat").value.trim();
    const text = document.querySelector("#znAddText").value.trim();
    if (!text) return;
    state.znCustom.push({ cat, text });
    znSaveCustom();
    document.querySelector("#znAddText").value = "";
    document.querySelector("#znAddDetails").open = false;
    showToast("話題を追加しました");
    state.zatsudanePicks = [];
    renderZatsudane();
    heroZatsudane();
  });
  document.querySelector("#znGrid")?.addEventListener("click", (e) => {
    const copyBtn = e.target.closest(".zn-copy-btn");
    if (copyBtn) {
      navigator.clipboard?.writeText(copyBtn.dataset.text).then(() => showToast("コピーしました！")).catch(() => showToast("コピーできませんでした"));
      return;
    }
    const usedBtn = e.target.closest(".zn-used-btn");
    if (usedBtn) {
      const t = usedBtn.dataset.text;
      if (state.znUsed.has(t)) { state.znUsed.delete(t); } else { state.znUsed.add(t); }
      znSaveUsed();
      renderZatsudane();
      return;
    }
    const delBtn = e.target.closest(".zn-del-btn");
    if (delBtn) {
      const t = delBtn.dataset.text;
      state.znCustom = state.znCustom.filter((z) => z.text !== t);
      znSaveCustom();
      state.zatsudanePicks = [];
      renderZatsudane();
      heroZatsudane();
    }
  });
}

function showToast(msg) {
  let toast = document.querySelector("#znToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "znToast";
    toast.className = "zn-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 1800);
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
