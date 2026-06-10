import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4823);
const COLLECT_INTERVAL_MINUTES = Number(process.env.COLLECT_INTERVAL_MINUTES || 360);
// Railway では DATA_DIR=/data（ボリューム）を環境変数で指定、ローカルは ./data/
const DATA_DIR = process.env.DATA_DIR
  || (process.env.RAILWAY_ENVIRONMENT ? "/data" : path.join(__dirname, "data"));
const STORE_PATH = path.join(DATA_DIR, "store.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const initialFeeds = [
  {
    id: "punch",
    title: "PUNCH",
    url: "https://punchdrink.com/feed/",
    focus: "カクテル文化・技法"
  },
  {
    id: "imbibe",
    title: "Imbibe Magazine",
    url: "https://imbibemagazine.com/feed/",
    focus: "ドリンク全般・レシピ"
  },
  {
    id: "jeffrey-morgenthaler",
    title: "Jeffrey Morgenthaler",
    url: "https://jeffreymorgenthaler.com/feed/",
    focus: "バーテンディング技法"
  },
  {
    id: "chilled",
    title: "Chilled Magazine",
    url: "https://chilledmagazine.com/feed/",
    focus: "業界ニュース"
  },
  {
    id: "spirits-business",
    title: "The Spirits Business",
    url: "https://www.thespiritsbusiness.com/feed/",
    focus: "スピリッツ業界・ジン"
  }
];

const PRESET_QUICKREF = [
  // ========== ☕ コーヒー ==========
  { id: "pq_cf_01", category: "☕ コーヒー", label: "エチオピア（イルガチェフェ）", value: "ジャスミン・ベルガモット・ブルーベリー系の明るい酸。コーヒー発祥の地。ウォッシュドが主流で透明感抜群", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_02", category: "☕ コーヒー", label: "エチオピア（シダモ）", value: "ベリー・ピーチ系の甘い香り。ナチュラル精製は発酵感が強め。ウォッシュドはクリーンで华やか", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_03", category: "☕ コーヒー", label: "ケニア（SL28/SL34）", value: "鮮烈な酸・ブラックカラント・トマト。立体的で複雑。アフリカ系で最も個性が強い産地の一つ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_04", category: "☕ コーヒー", label: "コロンビア（ウイラ）", value: "キャラメル・ヘーゼルナッツ・穏やかな酸。バランス良好で初心者向き。年2回の収穫期あり", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_05", category: "☕ コーヒー", label: "ブラジル（セラード）", value: "チョコレート・ナッツ・低酸・ボリューム感。世界最大の生産国。ナチュラル処理が多い", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_06", category: "☕ コーヒー", label: "グアテマラ（アンティグア）", value: "ビターチョコ・スパイス・程よい酸。火山性土壌が複雑な風味を生む。中米の定番産地", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_07", category: "☕ コーヒー", label: "パナマ（ゲイシャ）", value: "ジャスミン・桃・紅茶のような繊細なアロマ。世界最高値をつける幻の品種。COE上位常連", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_08", category: "☕ コーヒー", label: "インドネシア（スマトラ マンデリン）", value: "土・スパイス・低酸・重厚なボディ。ウェットハル（スマトラ式）精製法による独特の風味", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_09", category: "☕ コーヒー", label: "イエメン（モカ マタリ）", value: "ワイン・ドライフルーツ・野性味。世界最古の栽培地。標高が高く希少。入手困難な幻の豆", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_10", category: "☕ コーヒー", label: "浅煎り（ライト〜シナモン）", value: "酸味最大・フルーティー・花の香り。産地の個性が際立つ。お湯は90℃前後が目安", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_11", category: "☕ コーヒー", label: "中煎り（シティ〜フルシティ）", value: "酸味と苦味のバランス◎。スペシャルティの定番焙煎。甘みが出始めるポイント", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_12", category: "☕ コーヒー", label: "深煎り（フレンチ〜イタリアン）", value: "苦味・コク・カラメル感が最大化。産地差は薄れる。エスプレッソ・アイスコーヒー向き", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_13", category: "☕ コーヒー", label: "ハンドドリップ", value: "お湯92〜96℃・蒸らし30秒。クリーンで産地の香りを最大限に引き出す。湯量と速度で味が変わる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_14", category: "☕ コーヒー", label: "フレンチプレス", value: "コーヒーオイルごと抽出。コクとボディが最大限。微粒子が残るので4分待ってゆっくり注ぐ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_15", category: "☕ コーヒー", label: "エスプレッソ", value: "9気圧・25〜30秒で30ml抽出。クレマが品質の指標。すべてのコーヒーカルチャーの基礎", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_16", category: "☕ コーヒー", label: "AeroPress", value: "低温・短時間・多様な抽出が可能。失敗が少なく旅行にも最適。競技会（ワールドAeroPress選手権）もある", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_17", category: "☕ コーヒー", label: "コールドブリュー（水出し）", value: "15〜20℃の水で12〜24時間。低酸・甘め・まろやか。夏向きで冷蔵庫で作れる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_cf_18", category: "☕ コーヒー", label: "精製方法：ウォッシュド vs ナチュラル", value: "ウォッシュド＝果肉を水で除去→クリーン・明るい酸。ナチュラル＝果肉ごと乾燥→甘さ・発酵感・複雑さ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },

  // ========== 🧖 サウナ ==========
  { id: "pq_sa_01", category: "🧖 サウナ", label: "薪ストーブ（kiuas）", value: "伝統的フィンランド式。蓄熱性が高く遠赤外線効果が強い。温度はやや不安定だが体感は最高", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_02", category: "🧖 サウナ", label: "電気ストーブ", value: "温度管理が安定。商業施設の主流。ロウリュ対応型は石の量と質が重要。メンテが容易", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_03", category: "🧖 サウナ", label: "スモークサウナ（savusauna）", value: "煙を充満させて暖める古式。フィンランド最古の形態。独特の煙の香りと深い蓄熱が特徴", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_04", category: "🧖 サウナ", label: "テントサウナ", value: "アウトドア用の持ち運び可能なサウナ。川・湖での天然水風呂との組み合わせが最高形態", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_05", category: "🧖 サウナ", label: "インフラサウナ（遠赤外線）", value: "50〜60℃・低温。体の芯から温まる。心臓への負担が少なく初心者・体弱者向き", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_06", category: "🧖 サウナ", label: "ロウリュ（löyly）", value: "熱した石に水をかけて蒸気を発生させる行為。フィンランド語で「蒸気・サウナの魂」の意味", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_07", category: "🧖 サウナ", label: "アウフグース（Aufguss）", value: "ドイツ式。香り付きの水でロウリュ後、タオルで対流を起こして体感温度を上げる儀式的行為", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_08", category: "🧖 サウナ", label: "フィンランド式の基本設定", value: "温度80〜100℃・湿度10〜20%。「本場」の標準。日本の銭湯サウナは90℃前後が多い", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_09", category: "🧖 サウナ", label: "トルコ式ハマム", value: "40〜50℃・湿度ほぼ100%。低温高湿スタイル。大理石の台に横になりながら汗をかく", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_10", category: "🧖 サウナ", label: "水風呂の温度と感覚", value: "14〜17℃が王道。12℃以下は「シングル」と呼ばれ上級者向け。最初の10秒が鍵", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_11", category: "🧖 サウナ", label: "「ととのい」のメカニズム", value: "サウナ（交感神経亢進）→水風呂（急激な交感神経最大）→外気浴（副交感神経優位）の転換で多幸感", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_12", category: "🧖 サウナ", label: "セット数の目安", value: "3〜5セットが一般的。1セット＝サウナ6〜12分＋水風呂1〜3分＋外気浴5〜10分", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_sa_13", category: "🧖 サウナ", label: "水分補給の目安", value: "1セットで300〜500ml程度喪失。入浴前・各セット後に補給。スポーツドリンクより白湯が◎", url: "", createdAt: "2026-06-08T00:00:00+00:00" },

  // ========== 🎬 映画 ==========
  { id: "pq_mv_01", category: "🎬 映画", label: "クリストファー・ノーラン（1970〜）", value: "時間操作・非線形構成・記憶と現実の境界。代表：メメント／インセプション／ダンケルク／オッペンハイマー", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_02", category: "🎬 映画", label: "スタンリー・キューブリック（1928〜99）", value: "完璧主義・長期撮影・哲学的テーマ・機械的な画角。代表：2001年宇宙の旅／シャイニング／時計じかけのオレンジ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_03", category: "🎬 映画", label: "黒澤明（1910〜98）", value: "ダイナミックな群像劇・武士道・フレーム構成の巧みさ・雨の使い方。代表：七人の侍／羅生門／乱", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_04", category: "🎬 映画", label: "アンドレイ・タルコフスキー（1932〜86）", value: "詩的映像・長回し・精神性・時間の重さ。代表：惑星ソラリス／ストーカー／鏡", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_05", category: "🎬 映画", label: "フェデリコ・フェリーニ（1920〜93）", value: "夢幻的・自伝的・サーカスの比喩・現実と幻想の混交。代表：81/2／甘い生活／アマルコルド", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_06", category: "🎬 映画", label: "ウォン・カーウァイ（1958〜）", value: "香港・時間と喪失・手持ちカメラ・飽和した色彩・音楽の使い方。代表：恋する惑星／花様年華／2046", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_07", category: "🎬 映画", label: "マーティン・スコセッシ（1942〜）", value: "NY・マフィア・音楽の天才的使い方・男性性。代表：タクシードライバー／グッドフェローズ／カジノ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_08", category: "🎬 映画", label: "ジャン=リュック・ゴダール（1930〜2022）", value: "ヌーヴェルヴァーグの父。ジャンプカット・映画的自意識・政治性。代表：勝手にしやがれ／気狂いピエロ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_09", category: "🎬 映画", label: "デヴィッド・リンチ（1946〜2025）", value: "夢と悪夢・シュルレアリスム・不条理・工業音。代表：マルホランド・ドライブ／ブルーベルベット／イレイザーヘッド", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_10", category: "🎬 映画", label: "アキ・カウリスマキ（1957〜）", value: "フィンランド・無表情・静寂・労働者の哀愁・ユーモア。代表：マッチ工場の少女／過去のない男", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_11", category: "🎬 映画", label: "コーエン兄弟", value: "ブラックユーモア・運命の不条理・文学的対話。代表：ファーゴ／ノーカントリー／ビッグ・リボウスキ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_12", category: "🎬 映画", label: "フィルム・ノワール（1940〜50年代）", value: "暗い照明・都市の夜・犯罪・ファム・ファタール・ハードボイルド文学の映像化。二重保険などが代表", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_13", category: "🎬 映画", label: "イタリアン・ネオリアリスモ（1945〜55年頃）", value: "非職業俳優・ロケ撮影・貧困の現実直視。デ・シーカ「自転車泥棒」・ロッセリーニ「無防備都市」", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_14", category: "🎬 映画", label: "ヌーヴェルヴァーグ（1958〜60年代）", value: "フランス。即興・手持ちカメラ・映画的自由と自意識。ゴダール・トリュフォー・シャブロル", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mv_15", category: "🎬 映画", label: "ジャパニーズ・ニューウェーブ（1970〜80年代）", value: "大島渚・吉田喜重・篠田正浩。政治・性・革命。日本映画の前衛的挑戦期", url: "", createdAt: "2026-06-08T00:00:00+00:00" },

  // ========== 🎵 音楽 ==========
  { id: "pq_mu_01", category: "🎵 音楽", label: "ブルース", value: "19世紀末アメリカ南部・黒人霊歌起源。コール&レスポンス・12小節進行。悲しみと喜びの共存。ジャズ・ロックの親", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_02", category: "🎵 音楽", label: "ジャズ（初期〜スウィング）", value: "1900年代ニューオリンズ。即興・集団演奏・ブルース+ラグタイム融合。ルイ・アームストロング", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_03", category: "🎵 音楽", label: "ビバップ（1940年代）", value: "ジャズ革命。超高速・複雑和声・少人数・知的な即興。チャーリー・パーカー／マイルス・デイヴィス／セロニアス・モンク", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_04", category: "🎵 音楽", label: "モード・ジャズ（1950〜60年代）", value: "スケールを基軸に即興。「カインド・オブ・ブルー」（マイルス, 1959）が金字塔。開放的な広がりと空間", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_05", category: "🎵 音楽", label: "フリー・ジャズ（1960年代〜）", value: "調性・拍子・形式を解体。オーネット・コールマン「フリー・ジャズ」。表現の限界への挑戦", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_06", category: "🎵 音楽", label: "ロック（1950〜60年代）", value: "エレキギター・反抗・ブルース+カントリー融合。ビートルズ／ローリング・ストーンズ。大衆文化を変えた", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_07", category: "🎵 音楽", label: "プログレッシブ・ロック（1970年代）", value: "長尺・複雑構成・クラシック的な形式美。ピンク・フロイド／イエス／キング・クリムゾン", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_08", category: "🎵 音楽", label: "テクノ（1980年代デトロイト）", value: "機械的反復リズム・シンセ中心。衰退する工業都市デトロイトから生まれた未来と抵抗の音楽", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_09", category: "🎵 音楽", label: "ハウス（1980年代シカゴ）", value: "4つ打ちビート・ディスコの進化。踊ることへの純粋な欲求。シカゴのゲイコミュニティから発生", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_10", category: "🎵 音楽", label: "アンビエント（1970年代〜）", value: "ブライアン・イーノが確立。環境音楽。「聴くか聴かないかの境界上に存在する」音楽の提唱", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_11", category: "🎵 音楽", label: "ミニマル・ミュージック", value: "少ない素材の反復と微細な変化に集中。フィリップ・グラス／スティーヴ・ライヒ。知覚を鍛える音楽", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_12", category: "🎵 音楽", label: "クラシック・バロック（1600〜1750）", value: "対位法・通奏低音・装飾音が特徴。バッハ／ヘンデル／ヴィヴァルディ。数学的美しさ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_13", category: "🎵 音楽", label: "クラシック・古典派（1750〜1820）", value: "形式美・均整・明快さ。ハイドン／モーツァルト／初期ベートーヴェン。ソナタ形式の確立", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_mu_14", category: "🎵 音楽", label: "クラシック・ロマン派（1820〜1900）", value: "感情表現の極大化・個性・民族性・標題音楽。ショパン／シューベルト／ブラームス／マーラー", url: "", createdAt: "2026-06-08T00:00:00+00:00" },

  // ========== 🤔 哲学 ==========
  { id: "pq_ph_01", category: "🤔 哲学", label: "ソクラテス（BC470〜399）", value: "「無知の知」。問答法（エレンコス）で相手の無知を暴く。著書なし→プラトンの対話篇を通じて伝わる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_02", category: "🤔 哲学", label: "プラトン（BC427〜347）", value: "イデア論。現実は「洞窟の影」にすぎない。「善のイデア」が最高原理。対話篇の形式で記述", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_03", category: "🤔 哲学", label: "アリストテレス（BC384〜322）", value: "形而上学・論理学・倫理学・生物学を網羅。「中庸」の徳。「人間は政治的動物」。プラトンの弟子", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_04", category: "🤔 哲学", label: "老子（BC6〜4世紀頃）", value: "道家の創始。「無為自然」「柔弱は剛強に勝つ」。水のように在ること。争わないことの哲学", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_05", category: "🤔 哲学", label: "エピクテトス（55〜135頃）", value: "ストア派。「コントロールできること」と「できないこと」を峻別せよ。自由と内なる平和の哲学", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_06", category: "🤔 哲学", label: "マルクス・アウレリウス（121〜180）", value: "ローマ皇帝×ストア哲学。「自省録」は日々の省察の記録。実践的な哲学の最良の手本", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_07", category: "🤔 哲学", label: "デカルト（1596〜1650）", value: "「我思う、ゆえに我あり（Cogito ergo sum）」。方法的懐疑で出発。心身二元論を確立した近代哲学の父", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_08", category: "🤔 哲学", label: "スピノザ（1632〜1677）", value: "汎神論（神＝自然＝すべて）。感情を幾何学的に分析。完全に自由な精神＝感情の奴隷からの解放", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_09", category: "🤔 哲学", label: "カント（1724〜1804）", value: "認識論の革命。「物自体は認識不可能」。道徳の基礎＝定言命法「〜せよ、なぜなら義務だから」", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_10", category: "🤔 哲学", label: "ヘーゲル（1770〜1831）", value: "弁証法（正→反→合）。歴史は精神の自己実現プロセス。マルクスに多大な影響を与えた", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_11", category: "🤔 哲学", label: "ニーチェ（1844〜1900）", value: "「神は死んだ」「力への意志」「永劫回帰」「超人」。既存の価値を徹底的に破壊し再評価を求めた", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_12", category: "🤔 哲学", label: "フッサール（1859〜1938）", value: "現象学の創始。「意識に現れるものをありのままに記述せよ」。エポケー（判断停止）という方法", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_13", category: "🤔 哲学", label: "サルトル（1905〜1980）", value: "「実存は本質に先立つ」。自由と責任の哲学。人は常に選択し、その結果すべての責任を負う", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_ph_14", category: "🤔 哲学", label: "カミュ（1913〜1960）", value: "不条理の哲学。「なぜ自殺しないか」が根本問題。シーシュポスの神話＝反抗し続けることへの肯定", url: "", createdAt: "2026-06-08T00:00:00+00:00" },

  // ========== 🍸 ジン＆カクテル年表 ==========
  { id: "pq_gc_01", category: "🍸 ジン＆カクテル年表", label: "1689年", value: "オランダ人医師シルヴィウスがジュニパーを使った薬用利尿酒「ジュニーヴァー」を開発。ジンの起源", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_02", category: "🍸 ジン＆カクテル年表", label: "1720年代", value: "英国「ジン熱狂（Gin Craze）」。ロンドン市民の過度な飲酒が深刻な社会問題へ。貧困層に蔓延", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_03", category: "🍸 ジン＆カクテル年表", label: "1736年", value: "英国「ジン法（Gin Act）」施行。高額課税と販売規制。品質と管理の向上につながる転換点", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_04", category: "🍸 ジン＆カクテル年表", label: "1797年", value: "ゴードンズ・ジン創業。現代まで続く老舗ジン蒸留所の誕生。ロンドン・ドライジンの原型", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_05", category: "🍸 ジン＆カクテル年表", label: "1862年", value: "ジェリー・トーマス「バーテンダーズガイド」刊行。世界初のカクテルレシピ集。近代バー文化の礎", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_06", category: "🍸 ジン＆カクテル年表", label: "1880年代", value: "ジン・トニック誕生。英国軍がマラリア予防のキニーネ（トニックウォーター）にジンを混ぜたのが起源", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_07", category: "🍸 ジン＆カクテル年表", label: "1898年", value: "ネグローニの前身「アメリカーノ」がミラノ・カフェ・カンパリーノで誕生。カンパリ+ベルモット+ソーダ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_08", category: "🍸 ジン＆カクテル年表", label: "1919年", value: "米国禁酒法（〜1933年）発効。カクテル文化が地下に潜り、複雑な技法・隠れた芸術として洗練が進む", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_09", category: "🍸 ジン＆カクテル年表", label: "1920年", value: "「ネグローニ」誕生。カミロ・ネグローニ伯爵がアメリカーノのソーダをジンに変えるよう依頼した逸話", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_10", category: "🍸 ジン＆カクテル年表", label: "1930年代", value: "ロンドン・ドライジンの規格確立。現代的なジンのスタイルが世界標準になる。GinとTonicの黄金期", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_11", category: "🍸 ジン＆カクテル年表", label: "1953年", value: "イアン・フレミング「カジノ・ロワイヤル」刊行。ボンドのヴェスパー・マティーニでジンが文化的象徴に", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_12", category: "🍸 ジン＆カクテル年表", label: "1987年", value: "スロー・ジン（スローベリー漬けジン）の欧州産地保護規格に向けた議論が始まる。伝統的スタイルの保護", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_13", category: "🍸 ジン＆カクテル年表", label: "1999年", value: "ヘンドリックスジン（スコットランド）発売。ローズ＆キューカンバーという革新的ボタニカルでクラフトジン革命の先駆けに", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_14", category: "🍸 ジン＆カクテル年表", label: "2000年代前半", value: "クラフトジンブーム勃発。世界中で小規模蒸留所が急増。ボタニカルの多様化・産地ストーリーが加速", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_15", category: "🍸 ジン＆カクテル年表", label: "2008年頃", value: "「クラフトカクテル」ムーブメントが世界的に確立。旬の素材・自家製コーディアル・技法の再評価", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_16", category: "🍸 ジン＆カクテル年表", label: "2012年頃", value: "世界初の「ジン専門バー」が続々オープン。ジンを主役にしたバー文化が英国・スペインから世界へ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_17", category: "🍸 ジン＆カクテル年表", label: "2016年", value: "京都蒸留所「季の美」発売。柚子・山椒・玉露をボタニカルに使用。ジャパニーズジンの国際的認知の始まり", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_18", category: "🍸 ジン＆カクテル年表", label: "2018年", value: "スペインでジン＆トニックの消費が世界一に。バレンシアなどで独自の大きなグラス文化（ジネブラ）が注目", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_gc_19", category: "🍸 ジン＆カクテル年表", label: "2020年以降", value: "コロナ禍の家飲みブームでクラフトカクテル需要が激増。ノンアルコール・低アルコールスピリッツも台頭", url: "", createdAt: "2026-06-08T00:00:00+00:00" },

  // ========== 📅 全趣味年表 ==========
  { id: "pq_yt_01", category: "📅 全趣味年表", label: "BC 470年", value: "[🤔哲学] ソクラテス誕生（アテネ）。問答によって「知らないことを知る」という哲学的態度が始まる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_02", category: "📅 全趣味年表", label: "BC 427年", value: "[🤔哲学] プラトン誕生。師ソクラテスの教えを対話篇に記録し、イデア論として体系化する", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_03", category: "📅 全趣味年表", label: "BC 384年", value: "[🤔哲学] アリストテレス誕生。論理学・倫理学・生物学・政治学を体系化した「万学の祖」", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_04", category: "📅 全趣味年表", label: "BC 400年頃", value: "[🤔哲学] 老子が「道徳経」を著す（諸説あり）。「無為自然」「柔弱は剛強に勝つ」の東洋哲学", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_05", category: "📅 全趣味年表", label: "1000年頃", value: "[☕コーヒー] エチオピア高地でコーヒーの木の実が「覚醒効果あり」と発見される（カルディの伝説）", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_06", category: "📅 全趣味年表", label: "1450年頃", value: "[☕コーヒー] イエメンのスーフィー修行者たちがコーヒーを夜の礼拝の覚醒飲料として使用。コーヒーの普及始まる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_07", category: "📅 全趣味年表", label: "1600年頃", value: "[🎵音楽] バロック音楽の時代始まる。モンテヴェルディが近代オペラを確立。対位法・通奏低音", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_08", category: "📅 全趣味年表", label: "1650年頃", value: "[🧖サウナ] フィンランドでサウナが日常的な習慣として深く根づく。冬場の体を温める知恵として2000年の歴史", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_09", category: "📅 全趣味年表", label: "1689年", value: "[🍸ジン] オランダ人医師シルヴィウスがジュニーヴァーを開発。英国に渡りジンとして定着", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_10", category: "📅 全趣味年表", label: "1720年代", value: "[🍸ジン] 英国「ジン熱狂（Gin Craze）」。ロンドン市民の社会問題に。その後の規制が品質向上を促す", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_11", category: "📅 全趣味年表", label: "1750年頃", value: "[🎵音楽] 古典派の時代。モーツァルト・ハイドンが活躍。ソナタ形式が確立し形式美が頂点に", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_12", category: "📅 全趣味年表", label: "1820年頃", value: "[🎵音楽] ロマン派の時代。ショパン・シューベルト・後期ベートーヴェン。感情表現の極大化", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_13", category: "📅 全趣味年表", label: "1862年", value: "[🍸カクテル] ジェリー・トーマス「バーテンダーズガイド」刊行。世界初のカクテルレシピ集で近代バー文化が始まる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_14", category: "📅 全趣味年表", label: "1880年代", value: "[🍸カクテル] ジン・トニック誕生。英国軍のマラリア対策がカクテルの名作を生み出した", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_15", category: "📅 全趣味年表", label: "1895年", value: "[🎬映画] リュミエール兄弟がパリで映画を初公開。10本の短編で映画の歴史が始まる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_16", category: "📅 全趣味年表", label: "1900年頃", value: "[🎵音楽] ジャズ誕生。ニューオリンズで黒人音楽・ブルース・ラグタイムが融合し新しい音楽が生まれる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_17", category: "📅 全趣味年表", label: "1919年", value: "[🍸カクテル] 米国禁酒法発効。地下クラブ文化の中でカクテルの技法が洗練され芸術的域に達する", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_18", category: "📅 全趣味年表", label: "1920年", value: "[🍸カクテル] 「ネグローニ」誕生（フィレンツェ）。世界中で今も愛され続ける不朽のカクテル", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_19", category: "📅 全趣味年表", label: "1940年代", value: "[🎵音楽] ビバップ誕生。チャーリー・パーカーらがジャズを芸術音楽へと進化させる革命", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_20", category: "📅 全趣味年表", label: "1945年", value: "[🎬映画] 戦後イタリアでネオリアリスモが誕生。貧困の現実を直視した映画が世界を揺るがす", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_21", category: "📅 全趣味年表", label: "1958年", value: "[🎬映画] フランス・ヌーヴェルヴァーグ勃発。ゴダール・トリュフォーが映画の概念を根本から変える", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_22", category: "📅 全趣味年表", label: "1959年", value: "[🎵音楽] マイルス・デイヴィス「カインド・オブ・ブルー」発表。モード・ジャズの金字塔。史上最多売上のジャズアルバム", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_23", category: "📅 全趣味年表", label: "1960年代", value: "[🧖サウナ] フィンランド式サウナが1940年ヘルシンキ五輪を機に世界へ広まり始める。認知が加速", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_24", category: "📅 全趣味年表", label: "1970年代", value: "[🎬映画] アメリカン・ニューシネマ黄金期。コッポラ・スコセッシ・キューブリック・タルコフスキーが並立", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_25", category: "📅 全趣味年表", label: "1970年代後半", value: "[🎵音楽] ブライアン・イーノがアンビエント音楽を提唱。音楽の概念そのものを拡張する", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_26", category: "📅 全趣味年表", label: "1980年代", value: "[🎵音楽] テクノ（デトロイト）・ハウス（シカゴ）誕生。クラブ文化の幕開けと電子音楽の確立", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_27", category: "📅 全趣味年表", label: "1990年代", value: "[☕コーヒー] スペシャルティコーヒー運動が本格化。産地・品種・精製法へのこだわりが「第三の波」へ", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_28", category: "📅 全趣味年表", label: "1999年", value: "[🍸ジン] ヘンドリックスジン発売。革新的ボタニカルでクラフトジン革命の幕を開ける", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_29", category: "📅 全趣味年表", label: "2000年代", value: "[🧖サウナ] 日本でサウナブームが加速。「ととのう」という概念が若者文化として広まる", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_30", category: "📅 全趣味年表", label: "2005年頃", value: "[☕コーヒー] サードウェーブコーヒー確立（ブルーボトル等）。シングルオリジン・産地ストーリーが主役に", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_31", category: "📅 全趣味年表", label: "2016年", value: "[🍸ジン] 京都蒸留所「季の美」発売。ジャパニーズジンが世界舞台に登場", url: "", createdAt: "2026-06-08T00:00:00+00:00" },
  { id: "pq_yt_32", category: "📅 全趣味年表", label: "2020年以降", value: "[🍸カクテル] 家飲みブームでクラフトカクテル・ノンアルコールスピリッツが一大ムーブメントに", url: "", createdAt: "2026-06-08T00:00:00+00:00" }
];

const keywordGroups = [
  {
    category: "ジン",
    keywords: ["gin", "genever", "juniper", "botanical", "distillery", "distiller", "ジン", "ジュニパー", "ボタニカル", "蒸留"]
  },
  {
    category: "カクテル技法",
    keywords: ["technique", "clarified", "milk punch", "fat wash", "infusion", "acid adjust", "carbonation", "washed", "ferment", "cordial", "syrup", "shaking", "stirring", "技法", "清澄", "インフュージョン", "ファットウォッシュ", "発酵", "コーディアル"]
  },
  {
    category: "レシピ",
    keywords: ["recipe", "cocktail", "drink", "negroni", "martini", "highball", "spritz", "sour", "レシピ", "カクテル", "マティーニ", "ネグローニ", "ハイボール"]
  },
  {
    category: "バー業界",
    keywords: ["bar", "bartender", "hospitality", "menu", "opening", "competition", "award", "バー", "バーテンダー", "メニュー", "開業", "コンペ", "受賞"]
  },
  {
    category: "トレンド",
    keywords: ["trend", "new", "launch", "innovation", "limited", "sustainable", "low abv", "no abv", "zero proof", "トレンド", "新商品", "限定", "サステナブル", "低アルコール"]
  }
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) {
    await writeFile(
      STORE_PATH,
      JSON.stringify(
        {
          feeds: initialFeeds,
          articles: [],
          translations: {},
          lastCollection: null,
          collectionLog: [],
          hatena: { entries: [], lastCollection: null },
          claude: { items: [], lastCollection: null },
          knowledge: { notes: [] },
          quickref: { items: [] }
        },
        null,
        2
      )
    );
  }
}

async function readStore() {
  await ensureStore();
  const store = JSON.parse(await readFile(STORE_PATH, "utf8"));
  store.feeds ||= initialFeeds;
  store.articles ||= [];
  store.translations ||= {};
  store.collectionLog ||= [];
  store.hatena ||= { entries: [], lastCollection: null };
  store.claude ||= { items: [], lastCollection: null };
  store.knowledge ||= { notes: [] };
  store.quickref ||= { items: [] };
  if (!store.quickref.items.length) {
    store.quickref.items = PRESET_QUICKREF.map((it) => ({ ...it }));
    await writeFile(STORE_PATH, JSON.stringify(store, null, 2));
  }
  store.articles = (store.articles || []).map((article) => addArticleInsights(enrichArticle(article)));
  return store;
}

async function saveStore(store) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

function decodeEntities(value = "") {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .trim();
}

function stripHtml(value = "") {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function getTag(block, tagNames) {
  for (const tag of tagNames) {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (match) return decodeEntities(match[1]);
  }
  return "";
}

function getLink(block) {
  const rssLink = getTag(block, ["link"]);
  if (rssLink) return rssLink;
  const atomLink = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return atomLink ? decodeEntities(atomLink[1]) : "";
}

function splitItems(xml) {
  const rssItems = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  if (rssItems.length > 0) return rssItems;
  return [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
}

function parseFeed(xml, feed) {
  return splitItems(xml).map((block) => {
    const title = stripHtml(getTag(block, ["title"]));
    const link = getLink(block);
    const rawSummary = getTag(block, ["description", "summary", "content:encoded", "content"]);
    const publishedRaw = getTag(block, ["pubDate", "published", "updated", "dc:date"]);
    const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null;
    const idSource = getTag(block, ["guid", "id"]) || link || title;
    const excerpt = stripHtml(rawSummary).slice(0, 420);

    return enrichArticle({
      id: stableId(`${feed.id}:${idSource}`),
      feedId: feed.id,
      sourceTitle: feed.title,
      sourceFocus: feed.focus,
      title,
      url: link,
      excerpt,
      publishedAt,
      fetchedAt: new Date().toISOString(),
      read: false,
      starred: false
    });
  }).filter((article) => article.title && article.url);
}

function stableId(input) {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return `a_${(hash >>> 0).toString(36)}`;
}

function enrichArticle(article) {
  const haystack = `${article.title} ${article.excerpt}`.toLowerCase();
  const matches = keywordGroups.map((group) => {
    const score = group.keywords.reduce((count, keyword) => {
      return count + (keywordMatches(haystack, keyword) ? 1 : 0);
    }, 0);
    return { category: group.category, score };
  }).filter((match) => match.score > 0);

  const categories = matches.length > 0 ? matches.map((match) => match.category) : ["未分類"];
  const relevance = Math.min(100, matches.reduce((sum, match) => sum + match.score, 0) * 14 + (article.title.length > 0 ? 8 : 0));

  return {
    ...article,
    categories,
    relevance
  };
}

function keywordMatches(haystack, keyword) {
  const normalized = keyword.toLowerCase();
  if (/^[a-z0-9\s-]+$/i.test(normalized)) {
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(haystack);
  }
  return haystack.includes(normalized);
}

async function collectFeeds() {
  const store = await readStore();
  const seenIds = new Set(store.articles.map((article) => article.id));
  const collected = [];
  const log = [];

  for (const feed of store.feeds) {
    try {
      const response = await fetch(feed.url, {
        headers: {
          "User-Agent": "CocktailGinRadar/0.1 (+local research app)"
        },
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      const articles = parseFeed(xml, feed);
      const newArticles = articles.filter((article) => !seenIds.has(article.id));
      newArticles.forEach((article) => seenIds.add(article.id));
      await translateArticles(newArticles, store);
      newArticles.forEach(addArticleInsights);
      collected.push(...newArticles);
      log.push({ feedId: feed.id, title: feed.title, status: "ok", count: newArticles.length });
    } catch (error) {
      log.push({ feedId: feed.id, title: feed.title, status: "error", message: error.message });
    }
  }

  store.articles = [...collected, ...store.articles]
    .sort((a, b) => new Date(b.publishedAt || b.fetchedAt) - new Date(a.publishedAt || a.fetchedAt))
    .slice(0, 500);
  store.lastCollection = new Date().toISOString();
  store.collectionLog = log;
  await saveStore(store);
  return { added: collected.length, log, lastCollection: store.lastCollection };
}

// =========================================================
// はてなブックマーク（IT人気エントリ＋コメント）の巡回
//   ・人気エントリ：はてブ公式RSS（無料・キー不要）
//   ・コメント：公開JSON API（jsonlite、無料・キー不要）
//   ※ いずれもサーバー側で取得するため中継サービス不要
// =========================================================
const HATENA_HOTENTRY_URL = "https://b.hatena.ne.jp/hotentry/it.rss";
const HATENA_UA = "MyPersonalDashboard/0.1 (+local private app)";

function safeDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

async function fetchHatenaEntryData(targetUrl) {
  const api = `https://b.hatena.ne.jp/entry/jsonlite/?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(api, {
    headers: { "User-Agent": HATENA_UA },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`jsonlite HTTP ${response.status}`);
  return response.json();
}

async function collectHatena({ maxEntries = 12, maxComments = 6 } = {}) {
  const store = await readStore();
  const response = await fetch(HATENA_HOTENTRY_URL, {
    headers: { "User-Agent": HATENA_UA },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`はてなRSS HTTP ${response.status}`);
  const xml = await response.text();
  const blocks = splitItems(xml).slice(0, maxEntries);

  const entries = [];
  for (const block of blocks) {
    const title = stripHtml(getTag(block, ["title"]));
    const url = getLink(block);
    if (!title || !url) continue;

    const bookmarkCount = Number(getTag(block, ["hatena:bookmarkcount"]) || 0);
    const summary = stripHtml(getTag(block, ["description"])).slice(0, 220);

    let comments = [];
    let commentPageUrl = `https://b.hatena.ne.jp/entry/s/${url.replace(/^https?:\/\//, "")}`;
    try {
      const data = await fetchHatenaEntryData(url);
      if (data.entry_url) commentPageUrl = data.entry_url;
      comments = (data.bookmarks || [])
        .filter((b) => b.comment && b.comment.trim())
        .slice(0, maxComments)
        .map((b) => ({
          user: b.user || "",
          comment: b.comment || "",
          tags: Array.isArray(b.tags) ? b.tags : [],
          timestamp: b.timestamp || ""
        }));
    } catch {
      // コメント取得に失敗してもエントリ自体は載せる
    }

    entries.push({
      id: stableId(`hatena:${url}`),
      title,
      url,
      domain: safeDomain(url),
      bookmarkCount,
      summary,
      commentPageUrl,
      comments,
      fetchedAt: new Date().toISOString()
    });
  }

  entries.sort((a, b) => b.bookmarkCount - a.bookmarkCount);
  store.hatena = { entries, lastCollection: new Date().toISOString() };
  await saveStore(store);
  return { count: entries.length, lastCollection: store.hatena.lastCollection };
}

// =========================================================
// Claude Code 最新情報の巡回
//   ・Zenn（claudecode・claudeトピック）と Qiita（claude-code タグ）のRSSを取得（無料・キー不要）
//   ・日本語記事のみ。タイトルに "claude" を含む記事を新着順で表示
// =========================================================
const CLAUDE_JP_FEEDS = [
  { name: "Zenn", url: "https://zenn.dev/topics/claudecode/feed" },
  { name: "Zenn", url: "https://zenn.dev/topics/claude/feed" },
  { name: "Qiita", url: "https://qiita.com/tags/claude-code/feed" },
  { name: "Qiita", url: "https://qiita.com/tags/claude_code/feed" }
];

async function collectClaude({ max = 30 } = {}) {
  const store = await readStore();
  const seen = new Set();
  const items = [];

  for (const feed of CLAUDE_JP_FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { "User-Agent": HATENA_UA },
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) continue;
      const xml = await response.text();

      for (const block of splitItems(xml)) {
        const title = stripHtml(getTag(block, ["title"]));
        const url = getLink(block);
        if (!title || !url) continue;
        if (!/claude/i.test(title)) continue;
        if (seen.has(url)) continue;
        seen.add(url);

        const publishedRaw = getTag(block, ["pubDate", "published", "updated", "dc:date"]);
        const publishedAt = publishedRaw ? new Date(publishedRaw).toISOString() : null;

        items.push({
          id: stableId(`cc:${url}`),
          title,
          url,
          domain: safeDomain(url),
          source: feed.name,
          publishedAt,
          fetchedAt: new Date().toISOString()
        });
      }
    } catch {
      // フィードが取れなくても他のフィードで続行
    }
  }

  items.sort((a, b) => new Date(b.publishedAt || b.fetchedAt) - new Date(a.publishedAt || a.fetchedAt));
  store.claude = { items: items.slice(0, max), lastCollection: new Date().toISOString() };
  await saveStore(store);
  return { count: store.claude.items.length, lastCollection: store.claude.lastCollection };
}

// =========================================================
// ナレッジ（自分用メモ）と 早見表（クイックリファレンス）
//   ※ いずれもローカル保存のみ。外部送信なし。
// =========================================================
async function addKnowledgeNote(text) {
  const store = await readStore();
  const clean = String(text || "").trim();
  if (!clean) throw new Error("メモが空です。");
  const note = {
    id: stableId(`note:${clean}:${store.knowledge.notes.length}:${Date.now()}`),
    text: clean,
    createdAt: new Date().toISOString()
  };
  store.knowledge.notes.unshift(note);
  await saveStore(store);
  return note;
}

async function deleteKnowledgeNote(id) {
  const store = await readStore();
  store.knowledge.notes = store.knowledge.notes.filter((n) => n.id !== id);
  await saveStore(store);
  return { ok: true };
}

async function addQuickref(entry) {
  const store = await readStore();
  const label = String(entry.label || "").trim();
  if (!label) throw new Error("項目名が空です。");
  const item = {
    id: stableId(`qr:${label}:${store.quickref.items.length}:${Date.now()}`),
    category: String(entry.category || "その他").trim() || "その他",
    label,
    value: String(entry.value || "").trim(),
    url: String(entry.url || "").trim(),
    createdAt: new Date().toISOString()
  };
  store.quickref.items.push(item);
  await saveStore(store);
  return item;
}

async function deleteQuickref(id) {
  const store = await readStore();
  store.quickref.items = store.quickref.items.filter((i) => i.id !== id);
  await saveStore(store);
  return { ok: true };
}

async function translateMissingArticles(limit = 30) {
  const store = await readStore();
  const targets = store.articles.filter((article) => !article.titleJa || !article.excerptJa).slice(0, limit);
  await translateArticles(targets, store);
  targets.forEach(addArticleInsights);
  await saveStore(store);
  return {
    translated: targets.filter((article) => article.translationStatus === "translated").length,
    attempted: targets.length
  };
}

async function retranslateArticle(articleId) {
  const store = await readStore();
  const article = store.articles.find((item) => item.id === articleId);
  if (!article) throw new Error("記事が見つかりません。");

  delete store.translations[stableId(`translate:${article.title}`)];
  delete store.translations[stableId(`translate:${article.excerpt}`)];
  delete article.titleJa;
  delete article.excerptJa;
  delete article.translationError;
  await translateArticles([article], store);
  addArticleInsights(article);
  await saveStore(store);
  return article;
}

async function translateArticles(articles, store) {
  for (const article of articles) {
    if (!needsTranslation(article.title) && !needsTranslation(article.excerpt)) {
      article.titleJa = article.title;
      article.excerptJa = article.excerpt;
      article.translationStatus = "original-ja";
      addArticleInsights(article);
      continue;
    }

    try {
      article.titleJa = await translateText(article.title, store);
      article.excerptJa = await translateText(article.excerpt, store);
      article.titleDisplayJa = polishTitle(article.titleJa);
      article.translationStatus = "translated";
      addArticleInsights(article);
    } catch (error) {
      article.titleJa ||= "";
      article.excerptJa ||= "";
      article.translationStatus = "failed";
      article.translationError = error.message;
    }
  }
}

async function translateText(text, store) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  if (!needsTranslation(trimmed)) return trimmed;

  const cacheKey = stableId(`translate:${trimmed}`);
  if (store.translations[cacheKey]) return store.translations[cacheKey];

  const translated = await translateWithFallback(trimmed);
  store.translations[cacheKey] = translated;
  return translated;
}

async function translateWithFallback(text) {
  const providers = [translateWithGoogleEndpoint, translateWithMyMemory];
  let lastError = null;

  for (const provider of providers) {
    try {
      return await provider(text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("翻訳に失敗しました");
}

async function translateWithMyMemory(text) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text.slice(0, 480));
  url.searchParams.set("langpair", "en|ja");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "CocktailGinRadar/0.1 (+local research app)"
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`翻訳HTTP ${response.status}`);

  const payload = await response.json();
  const translated = payload.responseData?.translatedText?.trim();
  if (!translated) throw new Error("翻訳結果が空でした");

  return translated;
}

async function translateWithGoogleEndpoint(text) {
  const chunks = splitTranslationText(text, 420);
  const translatedChunks = [];

  for (const chunk of chunks) {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "en");
    url.searchParams.set("tl", "ja");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", chunk);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CocktailGinRadar/0.1 (+local research app)"
      },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`翻訳HTTP ${response.status}`);

    const payload = await response.json();
    const translated = payload?.[0]?.map((part) => part?.[0] || "").join("").trim();
    if (!translated) throw new Error("翻訳結果が空でした");
    translatedChunks.push(translated);
  }

  return translatedChunks.join(" ");
}

function splitTranslationText(text, maxLength) {
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]*/g) || [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength && current) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function needsTranslation(text = "") {
  const value = String(text);
  return /[A-Za-z]{3,}/.test(value) && !/[ぁ-んァ-ン一-龯]/.test(value.slice(0, 80));
}

function addArticleInsights(article) {
  article.titleDisplayJa = polishTitle(article.titleJa || article.title);
  article.summaryJa = buildThreeLineSummary(article);
  article.importanceJa = buildImportance(article);
  return article;
}

function polishTitle(title = "") {
  return String(title)
    .replace(/\s*[|｜-]\s*(Imbibe Magazine|PUNCH|The Spirits Business|Chilled Magazine).*$/i, "")
    .replace(/^投稿\s*/i, "")
    .replace(/^The post\s*/i, "")
    .replace(/ appeared first on .*$/i, "")
    .replace(/\s+/g, " ")
    .replace(/：\s+/g, "：")
    .trim();
}

function buildThreeLineSummary(article) {
  const baseText = normalizeJapaneseText(article.excerptJa || article.excerpt || "");
  const sentences = splitJapaneseSentences(baseText)
    .filter((sentence) => !/appeared first|The post|最初に掲載|掲載されました|記事は|post/i.test(sentence))
    .slice(0, 3);

  const lines = [];
  if (sentences[0]) lines.push(trimLine(sentences[0]));
  if (sentences[1]) lines.push(trimLine(sentences[1]));
  if (sentences[2]) lines.push(trimLine(sentences[2]));

  while (lines.length < 3) {
    if (lines.length === 0) {
      lines.push(`${article.sourceTitle}の記事です。`);
    } else if (lines.length === 1) {
      lines.push(`${article.categories.join("・")}に関連します。`);
    } else {
      lines.push("詳細は原文リンクで確認できます。");
    }
  }

  return lines;
}

function buildImportance(article) {
  const categories = new Set(article.categories || []);
  const title = `${article.title} ${article.titleJa || ""}`.toLowerCase();

  if (categories.has("カクテル技法")) return "メニュー開発や仕込みのヒントになりそうです。";
  if (categories.has("ジン")) return "ジンの商品動向やボタニカル理解に役立ちます。";
  if (categories.has("バー業界")) return "バー運営や業界トレンド把握に使えます。";
  if (categories.has("レシピ")) return "ドリンク提案やレシピ発想の材料になります。";
  if (categories.has("トレンド") || /launch|new|release|新|発売/.test(title)) return "新しい動きとして早めに把握しておきたい内容です。";
  return "関連情報としてストックしておく価値があります。";
}

function normalizeJapaneseText(text = "") {
  return String(text)
    .replace(/The post .*$/i, "")
    .replace(/この記事は.*最初に掲載され.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitJapaneseSentences(text = "") {
  return text
    .split(/(?<=[。！？.!?])\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function trimLine(text, maxLength = 74) {
  const value = text.trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

// =========================================================
// 認証（APP_PASSWORD 環境変数が設定されている時のみ有効）
//   ローカルでは APP_PASSWORD が未設定 → 認証スキップ
//   Railway 公開時は Railway の環境変数で APP_PASSWORD を設定する
// =========================================================
const APP_PASSWORD = process.env.APP_PASSWORD || "";

function makeSessionToken() {
  return createHash("sha256").update(APP_PASSWORD + ":mothership-v1").digest("hex");
}

function isAuthenticated(request) {
  if (!APP_PASSWORD) return true;
  const cookie = request.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)ms_session=([^;]+)/);
  return match ? match[1] === makeSessionToken() : false;
}

function serveLoginPage(response, showError = false) {
  const errHtml = showError
    ? `<p style="color:#c0392b;font-size:0.85rem;margin:0 0 1rem">パスワードが違います。</p>`
    : "";
  const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>母艦 — ログイン</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,sans-serif;background:#f5f5f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .box{background:#fff;border:1px solid #d0cfc8;padding:2rem 2.5rem;width:320px}
  h1{font-size:1.5rem;font-weight:700;margin:0 0 1.5rem;letter-spacing:.04em}
  input{width:100%;border:1px solid #d0cfc8;padding:9px 11px;font-size:1rem;margin:0 0 1rem;outline:none}
  input:focus{border-color:#1a1a1a}
  button{width:100%;background:#1a1a1a;color:#fff;border:none;padding:10px;font-size:1rem;cursor:pointer}
  button:hover{background:#333}
  small{display:block;margin-top:1.5rem;font-size:0.7rem;color:#aaa;text-align:center}
</style></head><body>
<div class="box">
  <h1>母艦</h1>
  ${errHtml}
  <form method="post" action="/login">
    <input type="password" name="password" placeholder="パスワード" autofocus autocomplete="current-password">
    <button type="submit">ログイン</button>
  </form>
  <small>PERSONAL COMMAND CENTER</small>
</div></body></html>`;
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

async function handleLogin(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const params = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  const submitted = params.get("password") || "";
  if (submitted === APP_PASSWORD) {
    const token = makeSessionToken();
    response.writeHead(302, {
      "Set-Cookie": `ms_session=${token}; Path=/; HttpOnly; SameSite=Strict`,
      "Location": "/"
    });
    response.end();
  } else {
    serveLoginPage(response, true);
  }
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function handleApi(request, response, url) {
  if (url.pathname === "/api/state" && request.method === "GET") {
    const store = await readStore();
    sendJson(response, store);
    return;
  }

  if (url.pathname === "/api/collect" && request.method === "POST") {
    sendJson(response, await collectFeeds());
    return;
  }

  if (url.pathname === "/api/hatena/collect" && request.method === "POST") {
    sendJson(response, await collectHatena());
    return;
  }

  if (url.pathname === "/api/claude/collect" && request.method === "POST") {
    sendJson(response, await collectClaude());
    return;
  }

  if (url.pathname === "/api/knowledge" && request.method === "POST") {
    const body = await readBody(request);
    sendJson(response, await addKnowledgeNote(body.text), 201);
    return;
  }

  if (url.pathname === "/api/knowledge/delete" && request.method === "POST") {
    const body = await readBody(request);
    sendJson(response, await deleteKnowledgeNote(body.id));
    return;
  }

  if (url.pathname === "/api/quickref" && request.method === "POST") {
    const body = await readBody(request);
    sendJson(response, await addQuickref(body), 201);
    return;
  }

  if (url.pathname === "/api/quickref/delete" && request.method === "POST") {
    const body = await readBody(request);
    sendJson(response, await deleteQuickref(body.id));
    return;
  }

  if (url.pathname === "/api/translate" && request.method === "POST") {
    const body = await readBody(request);
    sendJson(response, await translateMissingArticles(Number(body.limit || 30)));
    return;
  }

  if (url.pathname.startsWith("/api/articles/") && url.pathname.endsWith("/retranslate") && request.method === "POST") {
    const articleId = decodeURIComponent(url.pathname.split("/").at(-2));
    sendJson(response, await retranslateArticle(articleId));
    return;
  }

  if (url.pathname === "/api/feeds" && request.method === "POST") {
    const body = await readBody(request);
    if (!body.title || !body.url) {
      sendJson(response, { error: "title と url は必須です。" }, 400);
      return;
    }
    const store = await readStore();
    const feed = {
      id: stableId(`${body.title}:${body.url}`),
      title: String(body.title).trim(),
      url: String(body.url).trim(),
      focus: String(body.focus || "追加フィード").trim()
    };
    store.feeds.push(feed);
    await saveStore(store);
    sendJson(response, feed, 201);
    return;
  }

  if (url.pathname.startsWith("/api/articles/") && request.method === "PATCH") {
    const articleId = decodeURIComponent(url.pathname.split("/").pop());
    const body = await readBody(request);
    const store = await readStore();
    const article = store.articles.find((item) => item.id === articleId);
    if (!article) {
      sendJson(response, { error: "記事が見つかりません。" }, 404);
      return;
    }
    if (typeof body.read === "boolean") article.read = body.read;
    if (typeof body.starred === "boolean") article.starred = body.starred;
    await saveStore(store);
    sendJson(response, article);
    return;
  }

  sendJson(response, { error: "APIが見つかりません。" }, 404);
}

async function serveStatic(response, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  try {
    const content = await readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

if (process.argv.includes("--collect-once")) {
  collectFeeds().then((result) => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  await ensureStore();
  createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    try {
      // ログインページ・ログイン処理
      if (url.pathname === "/login") {
        if (request.method === "POST") return await handleLogin(request, response);
        return serveLoginPage(response);
      }
      // 認証チェック（APP_PASSWORD 未設定のローカルでは常にスキップ）
      if (!isAuthenticated(request)) {
        response.writeHead(302, { "Location": "/login" });
        return response.end();
      }
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url);
      } else {
        await serveStatic(response, url);
      }
    } catch (error) {
      sendJson(response, { error: error.message }, 500);
    }
  }).listen(PORT, () => {
    console.log(`母艦: http://localhost:${PORT}`);
    scheduleCollection();
  });
}

async function scheduleCollection() {
  const intervalMs = COLLECT_INTERVAL_MINUTES * 60 * 1000;
  const store = await readStore();
  const lastCollection = store.lastCollection ? new Date(store.lastCollection).getTime() : 0;
  const shouldCollectSoon = Date.now() - lastCollection > intervalMs;

  const runAll = () => {
    collectFeeds()
      .then((result) => console.log(`自動収集(ニュース): ${result.added} 件追加`))
      .catch((error) => console.error(`自動収集エラー(ニュース): ${error.message}`));
    collectHatena()
      .then((result) => console.log(`自動巡回(はてブ): ${result.count} 件`))
      .catch((error) => console.error(`自動巡回エラー(はてブ): ${error.message}`));
    collectClaude()
      .then((result) => console.log(`自動巡回(Claude): ${result.count} 件`))
      .catch((error) => console.error(`自動巡回エラー(Claude): ${error.message}`));
  };

  if (shouldCollectSoon) runAll();
  setInterval(runAll, intervalMs);
}
