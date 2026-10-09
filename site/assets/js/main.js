/* ==========================================================
   やまなしだもの 結 -musubi-
   ========================================================== */

/* ----------------------------------------------------------
   商品データ
   - image  : 写真のパス（例: "assets/img/shine-muscat.jpg"）。null の間は色の球体を表示
   - tone   : 写真が無いときの球体の色（wine / green / black / kiwi / gold / corn / mix）
   - season : 発送する月（「旬の暦」に使います）
   - price  : 税込価格（数値）。null のときは価格を表示しません
   - url    : ショップの商品ページ URL
   ---------------------------------------------------------- */
const PRODUCTS = [
  { cat: "grape", tone: "green", name: "シャインマスカット", en: "Shine Muscat", flag: "予約受付中", season: [8, 9, 10], price: null, url: "#", image: null },
  { cat: "grape", tone: "mix", name: "シャインマスカット＆巨峰", en: "Assortment", flag: "Gift", season: [8, 9], price: null, url: "#", image: null },
  { cat: "grape", tone: "black", name: "巨峰", en: "Kyoho", flag: null, season: [8, 9], price: null, url: "#", image: null },
  { cat: "grape", tone: "wine", name: "シャトウ・ルージュ", en: "Chateau Rouge", flag: "New", season: [8, 9], price: null, url: "#", image: null },
  { cat: "kiwi", tone: "kiwi", name: "キウイ ヘイワード", en: "Hayward", flag: null, season: [11, 12, 1], price: null, url: "#", image: null },
  { cat: "kiwi", tone: "kiwi", name: "キウイ 香緑", en: "Koryoku", flag: null, season: [11, 12], price: null, url: "#", image: null },
  { cat: "kiwi", tone: "gold", name: "キウイ グレイシー", en: "Gracie", flag: null, season: [11, 12], price: null, url: "#", image: null },
  { cat: "corn", tone: "corn", name: "朝採りとうもろこし", en: "Sweet Corn", flag: null, season: [6, 7], price: null, url: "#", image: null, soldout: true },
];

/* 営業日カレンダーの定休日（0=日 1=月 … 6=土）と臨時休業日 */
const CLOSED_WEEKDAYS = [0];
const CLOSED_DATES = []; // 例: ["2026-08-13", "2026-08-14"]

const CAT_EN = { grape: "Grape", kiwi: "Kiwi", corn: "Corn" };
const today = new Date();
const pad = (n) => String(n).padStart(2, "0");

/* ----------------------------------------------------------
   商品一覧
   ---------------------------------------------------------- */
const grid = document.getElementById("product-grid");

grid.innerHTML = PRODUCTS.map((p, i) => {
  const media = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : `<span class="sphere s-${p.tone}" aria-hidden="true"></span>`;
  const flag = p.soldout ? "Sold out" : p.flag || "";
  const price = p.price != null ? `¥${p.price.toLocaleString("ja-JP")}` : CAT_EN[p.cat];
  return `<li class="product reveal${p.soldout ? " is-soldout" : ""}" data-cat="${p.cat}">
    <a href="${p.url}">
      <div class="p-top"><span class="p-no">No.${pad(i + 1)}</span><span class="p-flag">${flag}</span></div>
      <div class="p-media">${media}</div>
      <h3 class="p-name">${p.name}</h3>
      <p class="p-en">${p.en}</p>
      <div class="p-foot"><span class="p-price">${price}</span><span class="p-go">→</span></div>
    </a>
  </li>`;
}).join("");

const filters = document.querySelectorAll(".filter");
filters.forEach((f) => {
  const cat = f.dataset.filter;
  f.querySelector("sup").textContent = PRODUCTS.filter((p) => cat === "all" || p.cat === cat).length;
  f.addEventListener("click", () => {
    filters.forEach((x) => x.classList.toggle("is-active", x === f));
    grid.querySelectorAll(".product").forEach((el) => {
      el.hidden = !(cat === "all" || el.dataset.cat === cat);
      el.classList.add("is-in");
    });
  });
});

/* ----------------------------------------------------------
   旬の暦（商品データの season から自動で作ります）
   ---------------------------------------------------------- */
const harvest = document.getElementById("harvest");
const nowMonth = today.getMonth() + 1;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let rows = `<div class="h-row h-head"><span></span>${MONTHS.map((m, i) =>
  `<span class="${i + 1 === nowMonth ? "now" : ""}">${m}</span>`).join("")}</div>`;

const seen = new Set();
PRODUCTS.forEach((p) => {
  if (seen.has(p.en) || p.tone === "mix") return;
  seen.add(p.en);
  const cells = MONTHS.map((_, i) => {
    const m = i + 1;
    const on = p.season.includes(m);
    const prev = p.season.includes(m === 1 ? 12 : m - 1);
    const next = p.season.includes(m === 12 ? 1 : m + 1);
    const cls = ["h-cell", on && "on", on && !prev && "start", on && !next && "end", m === nowMonth && "now-col"]
      .filter(Boolean).join(" ");
    return `<span class="${cls}"></span>`;
  }).join("");
  rows += `<div class="h-row"><span class="h-name">${p.name}<small>${p.en}</small></span>${cells}</div>`;
});
harvest.innerHTML = rows;
// 横スクロールになる画面幅では、今月が見える位置まで送っておく
const nowHead = harvest.querySelector(".h-head .now");
if (harvest.scrollWidth > harvest.clientWidth && nowHead) {
  harvest.scrollLeft = nowHead.offsetLeft - harvest.clientWidth / 2;
}

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
  let cells = ["S", "M", "T", "W", "T", "F", "S"].map((d) => `<span class="dow">${d}</span>`).join("");
  cells += "<span></span>".repeat(first);
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
    const off = CLOSED_WEEKDAYS.includes((first + d - 1) % 7) || CLOSED_DATES.includes(iso);
    const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
    cells += `<span class="${off ? "off" : ""}${isToday ? " today" : ""}">${d}</span>`;
  }
  calEl.innerHTML = `<div class="cal-head">
      <button type="button" data-step="-1" aria-label="前の月">←</button>
      <strong>${MONTHS[m]}.<small>${y}</small></strong>
      <button type="button" data-step="1" aria-label="次の月">→</button>
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
   ヘッダー（暗い面の上では白文字、明るい面では黒文字）
   ---------------------------------------------------------- */
const header = document.querySelector(".site-header");
const darkAreas = [...document.querySelectorAll(".hero, .about, .site-footer")];
function updateHeader() {
  const y = header.offsetHeight / 2;
  const onDark = darkAreas.some((el) => {
    const r = el.getBoundingClientRect();
    return r.top <= y && r.bottom >= y;
  });
  header.classList.toggle("is-light", !onDark);
}
window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("resize", updateHeader);
updateHeader();

const toggle = document.querySelector(".menu-toggle");
const setMenu = (open) => {
  document.body.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", open);
};
toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
document.querySelectorAll(".global-nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ----------------------------------------------------------
   スクロールで要素をふわっと表示
   ---------------------------------------------------------- */
document.querySelectorAll(".block-head, .season-photo, .season-body, .h-row, .about-statement, .about-cols, .news-list li, .guide-grid article, .contact-link")
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
