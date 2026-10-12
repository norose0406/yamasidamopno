/* ==========================================================
   やまなしだもの 結 -musubi-
   ========================================================== */

/* ----------------------------------------------------------
   商品データ
   - id     : 商品ごとの固定の名前（下の「おすすめ」「新着」「ランキング」の並びで使います）
   - image  : 写真のパス。null の間は tone の色の球体を表示
   - season : 発送する月（サイドバーの「今月の旬」に使います）
   - price  : 税込価格（数値）。null のときは価格を表示しません
   - url    : ショップの商品ページ URL
   ---------------------------------------------------------- */
const PRODUCTS = [
  { id: "hayward", cat: "kiwi", tone: "kiwi", name: "【予約・11月下旬〜発送】大玉完熟 やまなしの雫 ヘイワード", short: "やまなしの雫 ヘイワード", note: "選ばれ続ける定番キウイ。栽培期農薬未使用／ホルモン剤未使用", flag: "予約受付中", season: [11, 12], price: null, url: "#", image: "assets/img/kiwi-hayward.webp" },
  { id: "koryoku", cat: "kiwi", tone: "kiwi", name: "【15セット限定】大玉完熟 やまなしの雫 香緑", short: "やまなしの雫 香緑", note: "数量限定の特別なキウイ。栽培期農薬未使用／ホルモン剤未使用", flag: "15セット限定", season: [11, 12], price: null, url: "#", image: "assets/img/kiwi-koryoku.webp" },
  { id: "gracie", cat: "kiwi", tone: "gold", name: "キウイフルーツ グレイシー", short: "キウイ グレイシー", note: "まろやかな甘さが魅力の希少品種", flag: null, season: [11, 12], price: null, url: "#", image: null },
  { id: "shine", cat: "grape", tone: "green", name: "【山梨県産】シャインマスカット", short: "シャインマスカット", note: "皮ごと食べられる、香り高い王道ぶどう", flag: "人気 No.1", season: [8, 9, 10], price: null, url: "#", image: "assets/img/shine-muscat.webp" },
  { id: "kyoho", cat: "grape", tone: "black", name: "【山梨県産】巨峰", short: "巨峰", note: "濃厚な甘みと豊かな果汁", flag: null, season: [8, 9], price: null, url: "#", image: "assets/img/kyoho.webp" },
  { id: "assort", cat: "grape", tone: "green", name: "【ギフト】シャインマスカット＆巨峰 詰め合わせ", short: "シャインマスカット＆巨峰", note: "人気の2品種を食べ比べ", flag: "ギフト", season: [8, 9], price: null, url: "#", image: "assets/img/assort.webp" },
  { id: "chateau", cat: "grape", tone: "wine", name: "【山梨県産】シャトウ・ルージュ", short: "シャトウ・ルージュ", note: "パリッとした歯触りとジューシーな甘さ", flag: null, season: [8, 9], price: null, url: "#", image: null },
  { id: "corn", cat: "corn", tone: "corn", name: "朝採れ！新鮮！やまなしの恵 甘々娘", short: "やまなしの恵 甘々娘", note: "朝採れのとうもろこしを産地から直送", flag: null, season: [6, 7], price: null, url: "#", image: "assets/img/corn.webp", soldout: true },
];

/* 各コーナーに並べる商品（id の順番がそのまま表示順） */
const RECOMMEND = ["hayward", "koryoku", "shine", "kyoho", "assort", "chateau", "gracie", "corn"];
const NEW_ARRIVALS = ["hayward", "koryoku", "gracie"];
const RANKING = ["shine", "hayward", "kyoho"];

const CATEGORIES = [
  { key: "all", label: "すべての商品" },
  { key: "grape", label: "ぶどう" },
  { key: "kiwi", label: "キウイフルーツ" },
  { key: "corn", label: "とうもろこし" },
];

/* 営業日カレンダーの定休日（0=日 1=月 … 6=土）と臨時休業日 */
const CLOSED_WEEKDAYS = [0];
const CLOSED_DATES = []; // 例: ["2026-08-13", "2026-08-14"]

/* ---------------------------------------------------------- */
const today = new Date();
const pad = (n) => String(n).padStart(2, "0");
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const media = (p) => p.image
  ? `<img src="${p.image}" alt="${p.short}" loading="lazy">`
  : `<span class="sphere s-${p.tone}" aria-hidden="true"></span>`;

/* ----------------------------------------------------------
   商品カード
   ---------------------------------------------------------- */
function card(p, rank) {
  const flag = p.soldout
    ? `<span class="p-flag off">シーズンオフ</span>`
    : p.flag ? `<span class="p-flag">${p.flag}</span>` : "";
  const price = p.soldout
    ? `<span class="soldout">SOLD OUT</span>`
    : p.price != null ? `¥${p.price.toLocaleString("ja-JP")}<small>（税込）</small>` : "";
  const rankBadge = rank ? `<span class="p-rank r${rank}">${rank}</span>` : "";
  return `<li class="product${p.soldout ? " is-soldout" : ""}" data-cat="${p.cat}">
    <a href="${p.url}" data-id="${p.id}">
      <div class="p-media">${rankBadge}${flag}${media(p)}</div>
      <div class="p-body">
        <h3 class="p-name">${p.name}</h3>
        <p class="p-note">${p.note}</p>
        <p class="p-price">${price}</p>
      </div>
    </a>
  </li>`;
}

const render = (el, ids, ranked) => {
  document.getElementById(el).innerHTML = ids.map((id, i) => card(byId[id], ranked ? i + 1 : 0)).join("");
};
render("grid-recommend", RECOMMEND);
render("grid-new", NEW_ARRIVALS);
render("grid-ranking", RANKING, true);

/* ----------------------------------------------------------
   カテゴリーで絞り込み（サイドバー・メニュー・スライドのボタン）
   ---------------------------------------------------------- */
const catList = document.getElementById("cat-list");
catList.innerHTML = CATEGORIES.map((c) => {
  const n = PRODUCTS.filter((p) => c.key === "all" || p.cat === c.key).length;
  return `<li><a href="#" data-filter="${c.key}">${c.label}<small>${n}</small></a></li>`;
}).join("");

const recTitle = document.getElementById("recommend-title");
const clearBtn = document.getElementById("clear-filter");
function applyFilter(cat) {
  const label = CATEGORIES.find((c) => c.key === cat)?.label;
  document.querySelectorAll("#grid-recommend .product").forEach((el) => {
    el.hidden = cat !== "all" && el.dataset.cat !== cat;
  });
  recTitle.textContent = cat === "all" ? "おすすめ商品" : label;
  clearBtn.hidden = cat === "all";
  catList.querySelectorAll("a").forEach((a) => a.classList.toggle("is-active", a.dataset.filter === cat && cat !== "all"));
}
document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-filter]");
  if (!trigger) return;
  e.preventDefault();
  applyFilter(trigger.dataset.filter);
  setMenu(false);
  document.getElementById("recommend").scrollIntoView();
});
clearBtn.addEventListener("click", () => applyFilter("all"));

/* ----------------------------------------------------------
   今月の旬（発送中 → まもなく の順）
   ---------------------------------------------------------- */
const month = today.getMonth() + 1;
const nextMonth = month === 12 ? 1 : month + 1;
const seasonItems = [
  ...PRODUCTS.filter((p) => p.season.includes(month)).map((p) => [p, "ただいま発送中"]),
  ...PRODUCTS.filter((p) => !p.season.includes(month) && p.season.includes(nextMonth)).map((p) => [p, "まもなく発送・予約受付中"]),
];
document.getElementById("season-list").innerHTML = seasonItems.length
  ? seasonItems.map(([p, label]) => `<li>${media(p)}<p>${p.short}<small>${label}</small></p></li>`).join("")
  : `<li class="empty">今月の発送はお休みです。</li>`;

/* ----------------------------------------------------------
   最近チェックした商品（このブラウザにだけ保存）
   ---------------------------------------------------------- */
const RECENT_KEY = "musubi-recent";
const readRecent = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
};
function renderRecent() {
  const ids = readRecent().filter((id) => byId[id]);
  document.getElementById("recent").hidden = ids.length === 0;
  document.getElementById("recent-list").innerHTML = ids
    .map((id) => `<li><a href="${byId[id].url}" title="${byId[id].short}">${media(byId[id])}</a></li>`).join("");
}
document.addEventListener("click", (e) => {
  const a = e.target.closest(".product a");
  if (!a) return;
  const ids = [a.dataset.id, ...readRecent().filter((id) => id !== a.dataset.id)].slice(0, 8);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids)); } catch { /* 保存できない環境では何もしない */ }
  if (a.getAttribute("href") === "#") e.preventDefault();
  renderRecent();
});
renderRecent();

/* ----------------------------------------------------------
   スライダー
   ---------------------------------------------------------- */
const slides = [...document.querySelectorAll(".slide")];
const dots = document.getElementById("dots");
dots.innerHTML = slides.map((_, i) => `<button type="button" aria-label="スライド${i + 1}"></button>`).join("");
let current = 0;
let timer;
function show(i) {
  current = (i + slides.length) % slides.length;
  slides.forEach((s, j) => s.classList.toggle("is-active", j === current));
  [...dots.children].forEach((d, j) => d.classList.toggle("is-active", j === current));
}
const play = () => { clearInterval(timer); timer = setInterval(() => show(current + 1), 6000); };
dots.addEventListener("click", (e) => {
  const i = [...dots.children].indexOf(e.target);
  if (i >= 0) { show(i); play(); }
});
document.querySelectorAll(".slider-arrow").forEach((b) =>
  b.addEventListener("click", () => { show(current + Number(b.dataset.dir)); play(); }));
const hero = document.querySelector(".hero");
hero.addEventListener("mouseenter", () => clearInterval(timer));
hero.addEventListener("mouseleave", play);
show(0);
play();

/* ----------------------------------------------------------
   営業日カレンダー
   ---------------------------------------------------------- */
const calEl = document.getElementById("calendar");
let view = new Date(today.getFullYear(), today.getMonth(), 1);
function renderCalendar() {
  const y = view.getFullYear();
  const m = view.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  let cells = ["日", "月", "火", "水", "木", "金", "土"].map((d) => `<span class="dow">${d}</span>`).join("");
  cells += "<span></span>".repeat(first);
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
    const off = CLOSED_WEEKDAYS.includes((first + d - 1) % 7) || CLOSED_DATES.includes(iso);
    const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
    cells += `<span class="${off ? "off" : ""}${isToday ? " today" : ""}">${d}</span>`;
  }
  calEl.innerHTML = `<div class="cal-head">
      <button type="button" data-step="-1" aria-label="前の月">‹</button>
      <strong>${y}年${m + 1}月</strong>
      <button type="button" data-step="1" aria-label="次の月">›</button>
    </div><div class="cal-grid">${cells}</div>`;
}
calEl.addEventListener("click", (e) => {
  const step = e.target.closest("button")?.dataset.step;
  if (!step) return;
  view = new Date(view.getFullYear(), view.getMonth() + Number(step), 1);
  renderCalendar();
});
renderCalendar();

/* ----------------------------------------------------------
   ヘッダー・メニュー・ページトップ
   ---------------------------------------------------------- */
const toTop = document.querySelector(".to-top");
const onScroll = () => {
  document.body.classList.toggle("is-compact", window.scrollY > 120);
  toTop.classList.toggle("is-visible", window.scrollY > 600);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const toggle = document.querySelector(".menu-toggle");
function setMenu(open) {
  document.body.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", open);
}
toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
document.querySelectorAll(".global-nav a:not([data-filter])").forEach((a) => a.addEventListener("click", () => setMenu(false)));

document.getElementById("year").textContent = today.getFullYear();
