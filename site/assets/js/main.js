/* ==========================================================
   やまなしだもの 結 -musubi-
   ========================================================== */

/* ----------------------------------------------------------
   商品データ
   - image に画像のパスを入れると、イラストの代わりに写真が表示されます
     （例: image: "assets/img/shine-muscat.jpg"）
   - price は税込価格（数値）。null のときは価格を表示しません
   - url はショップの商品ページの URL
   ---------------------------------------------------------- */
const PRODUCTS = [
  { cat: "grape", art: "grape-green", name: "シャインマスカット", desc: "皮ごと食べられる、香り高い山梨の王道ぶどう。", badge: "予約受付中", price: null, url: "#", image: null },
  { cat: "grape", art: "grape-mix", name: "シャインマスカット＆巨峰 詰め合わせ", desc: "人気の2品種を食べ比べ。ギフトにもおすすめです。", badge: "ギフト", price: null, url: "#", image: null },
  { cat: "grape", art: "grape-black", name: "巨峰", desc: "濃厚な甘みと豊かな果汁。昔ながらの定番品種。", badge: null, price: null, url: "#", image: null },
  { cat: "grape", art: "grape-red", name: "シャトウ・ルージュ", desc: "パリッとした歯触りとジューシーな甘さ。8月下旬頃〜発送予定。", badge: "新品種", price: null, url: "#", image: null },
  { cat: "kiwi", art: "kiwi", name: "キウイフルーツ ヘイワード", desc: "甘みと酸味のバランスがよい、定番のグリーンキウイ。", badge: null, price: null, url: "#", image: null },
  { cat: "kiwi", art: "kiwi", name: "キウイフルーツ 香緑", desc: "濃い緑の果肉と、高い糖度が自慢の品種。", badge: null, price: null, url: "#", image: null },
  { cat: "kiwi", art: "kiwi-gold", name: "キウイフルーツ グレイシー", desc: "まろやかな甘さが魅力の、希少な品種です。", badge: null, price: null, url: "#", image: null },
  { cat: "corn", art: "corn", name: "朝採りとうもろこし", desc: "生でも食べられるほど甘い、朝採れのとうもろこし。", badge: null, price: null, url: "#", image: null, soldout: true },
];

/* 営業日カレンダーの定休日（0=日 1=月 … 6=土）と臨時休業日 */
const CLOSED_WEEKDAYS = [0];
const CLOSED_DATES = []; // 例: ["2026-08-13", "2026-08-14"]

const CAT_LABEL = { grape: "GRAPE", kiwi: "KIWI", corn: "CORN", peach: "PEACH", gift: "GIFT" };

/* ----------------------------------------------------------
   果物のイラスト（写真が無いときの代わり）
   ---------------------------------------------------------- */
const PALETTE = {
  "grape-green": { bg: "#e7edd6", a: "#cfe08a", b: "#9fbf4a" },
  "grape-black": { bg: "#e4dde9", a: "#5b4a7a", b: "#2c2140" },
  "grape-red": { bg: "#f1dfe2", a: "#c2456b", b: "#7a1f3d" },
  "grape-mix": { bg: "#ece6dc", a: "#cfe08a", b: "#4a3a66" },
  kiwi: { bg: "#e3e8d4", a: "#8fb84a", b: "#5d7d2a" },
  "kiwi-gold": { bg: "#efe8cf", a: "#e2c548", b: "#8a7a2a" },
  corn: { bg: "#f2ead2", a: "#f3d36b", b: "#d9a92c" },
  peach: { bg: "#f6e3dc", a: "#f6b8a4", b: "#e07a72" },
  gift: { bg: "#efe4d6", a: "#b8935a", b: "#6b2a45" },
};

function grapeSVG(a, b, mixed) {
  const rows = [5, 4, 4, 3, 2, 1];
  let dots = "";
  let id = 0;
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i++) {
      const x = 100 + (i - (n - 1) / 2) * 26;
      const y = 62 + r * 24;
      const left = mixed && x < 100;
      const fill = mixed ? (left ? a : b) : (id++ % 3 === 0 ? b : a);
      dots += `<circle cx="${x}" cy="${y}" r="15" fill="${fill}"/><circle cx="${x - 5}" cy="${y - 5}" r="4" fill="#fff" opacity=".45"/>`;
    }
  });
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="stroke:none">
    <path d="M100 48 C100 30 104 20 112 12" stroke="#6b5233" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M108 26 C130 8 160 14 168 32 C146 40 124 38 108 26z" fill="#7d9a4a"/>
    ${dots}</svg>`;
}

function kiwiSVG(a, b) {
  let seeds = "";
  for (let i = 0; i < 18; i++) {
    const t = (i / 18) * Math.PI * 2;
    seeds += `<ellipse cx="${100 + Math.cos(t) * 34}" cy="${110 + Math.sin(t) * 34}" rx="2.4" ry="5" fill="#2b2418" transform="rotate(${(t * 180) / Math.PI + 90} ${100 + Math.cos(t) * 34} ${110 + Math.sin(t) * 34})"/>`;
  }
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="stroke:none">
    <circle cx="100" cy="110" r="78" fill="#8a6a44"/>
    <circle cx="100" cy="110" r="70" fill="${b}"/>
    <circle cx="100" cy="110" r="62" fill="${a}"/>
    <circle cx="100" cy="110" r="22" fill="#f4f1d8"/>
    ${seeds}</svg>`;
}

function cornSVG(a, b) {
  let kernels = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 4; c++) {
      kernels += `<rect x="${78 + c * 11}" y="${48 + r * 15}" width="10" height="13" rx="4" fill="${(r + c) % 2 ? a : b}"/>`;
    }
  }
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="stroke:none">
    <path d="M100 40 C64 40 70 140 76 190 L88 196 C80 140 80 70 100 40z" fill="#8fb04a"/>
    <path d="M100 40 C136 40 130 140 124 190 L112 196 C120 140 120 70 100 40z" fill="#6f8f34"/>
    <rect x="76" y="42" width="48" height="142" rx="24" fill="${b}"/>
    ${kernels}
    <path d="M70 120 C66 170 80 200 100 206 C88 180 86 150 90 118z" fill="#7d9e3c"/>
    <path d="M130 120 C134 170 120 200 100 206 C112 180 114 150 110 118z" fill="#5f7f2c"/></svg>`;
}

function peachSVG(a, b) {
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="stroke:none">
    <defs><radialGradient id="pg" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#fff2e6"/><stop offset=".45" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>
    <path d="M100 60 C150 50 182 96 170 140 C160 182 124 196 100 196 C76 196 40 182 30 140 C18 96 50 50 100 60z" fill="url(#pg)"/>
    <path d="M100 64 C92 100 94 150 100 192" stroke="${b}" stroke-width="3" fill="none" opacity=".5"/>
    <path d="M100 62 C112 34 140 26 160 34 C150 58 124 66 100 62z" fill="#7d9a4a"/></svg>`;
}

function giftSVG(a, b) {
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="stroke:none">
    <rect x="36" y="86" width="128" height="110" rx="6" fill="${a}"/>
    <rect x="28" y="70" width="144" height="28" rx="6" fill="#cfab70"/>
    <rect x="92" y="70" width="16" height="126" fill="${b}"/>
    <path d="M100 70 C80 40 52 46 60 64 C66 74 88 72 100 70z M100 70 C120 40 148 46 140 64 C134 74 112 72 100 70z" fill="${b}"/></svg>`;
}

function fruitArt(key) {
  const p = PALETTE[key] || PALETTE.gift;
  if (key.startsWith("grape")) return grapeSVG(p.a, p.b, key === "grape-mix");
  if (key.startsWith("kiwi")) return kiwiSVG(p.a, p.b);
  if (key === "corn") return cornSVG(p.a, p.b);
  if (key === "peach") return peachSVG(p.a, p.b);
  return giftSVG(p.a, p.b);
}

document.querySelectorAll("[data-art]").forEach((el) => {
  el.innerHTML = fruitArt(el.dataset.art);
});

/* ----------------------------------------------------------
   商品一覧
   ---------------------------------------------------------- */
const grid = document.getElementById("product-grid");
const yen = (n) => n.toLocaleString("ja-JP");

grid.innerHTML = PRODUCTS.map((p) => {
  const bg = (PALETTE[p.art] || PALETTE.gift).bg;
  const media = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : fruitArt(p.art);
  const badge = p.soldout
    ? `<span class="badge soldout">SOLD OUT</span>`
    : p.badge ? `<span class="badge">${p.badge}</span>` : "";
  const price = p.price != null ? `<span class="product-price">¥${yen(p.price)}<small>税込</small></span>` : `<span></span>`;
  return `<li class="product reveal${p.soldout ? " is-soldout" : ""}" data-cat="${p.cat}">
    <a class="product-media" href="${p.url}" style="background:${bg}">${badge}${media}</a>
    <p class="product-cat">${CAT_LABEL[p.cat]}</p>
    <h3 class="product-name"><a href="${p.url}">${p.name}</a></h3>
    <p class="product-desc">${p.desc}</p>
    <div class="product-foot">${price}<a class="product-link" href="${p.url}">詳しく見る →</a></div>
  </li>`;
}).join("");

const chips = document.querySelectorAll(".chip");
function applyFilter(cat) {
  chips.forEach((c) => c.classList.toggle("is-active", c.dataset.filter === cat));
  grid.querySelectorAll(".product").forEach((el) => {
    const show = cat === "all" || el.dataset.cat === cat;
    el.hidden = !show;
    if (show) el.classList.add("is-in");
  });
}
chips.forEach((c) => c.addEventListener("click", () => applyFilter(c.dataset.filter)));
document.querySelectorAll(".cat-item").forEach((c) =>
  c.addEventListener("click", () => {
    const cat = c.dataset.filter;
    applyFilter(document.querySelector(`.chip[data-filter="${cat}"]`) ? cat : "all");
    document.getElementById("products").scrollIntoView();
  })
);

/* ----------------------------------------------------------
   営業日カレンダー
   ---------------------------------------------------------- */
const calEl = document.getElementById("calendar");
const today = new Date();
let view = new Date(today.getFullYear(), today.getMonth(), 1);
const pad = (n) => String(n).padStart(2, "0");

function renderCalendar() {
  const y = view.getFullYear();
  const m = view.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  let cells = ["日", "月", "火", "水", "木", "金", "土"].map((d) => `<span class="dow">${d}</span>`).join("");
  cells += "<span></span>".repeat(first);
  for (let d = 1; d <= days; d++) {
    const wd = (first + d - 1) % 7;
    const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
    const off = CLOSED_WEEKDAYS.includes(wd) || CLOSED_DATES.includes(iso);
    const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
    cells += `<span class="${off ? "off" : ""}${isToday ? " today" : ""}">${d}</span>`;
  }
  calEl.innerHTML = `<div class="cal-head">
      <button type="button" data-step="-1" aria-label="前の月">‹</button>
      <strong>${y}年 ${m + 1}月</strong>
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
   ヘッダー・メニュー・スクロール演出
   ---------------------------------------------------------- */
const header = document.querySelector(".site-header");
const toTop = document.querySelector(".to-top");
const onScroll = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
  toTop.classList.toggle("is-visible", window.scrollY > 600);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const toggle = document.querySelector(".menu-toggle");
toggle.addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  toggle.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".global-nav a").forEach((a) =>
  a.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

document.querySelectorAll(".section-head, .season-card, .cat-item, .about-body, .guide-card, .contact-inner, .news-list li")
  .forEach((el) => el.classList.add("reveal"));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }
  });
}, { rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

document.getElementById("year").textContent = today.getFullYear();
