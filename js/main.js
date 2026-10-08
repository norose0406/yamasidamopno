(function () {
  "use strict";

  var D = window.MUSUBI;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var catById = {};
  D.categories.forEach(function (c) { catById[c.id] = c; });

  var STATUS = {
    available: { label: "販売中", cls: "is-available" },
    reserve: { label: "予約受付中", cls: "is-reserve" },
    soldout: { label: "SOLD OUT", cls: "is-soldout" }
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function yen(n) {
    return n == null ? "価格は商品ページで" : "¥" + n.toLocaleString("ja-JP") + "<small>（税込）</small>";
  }

  /* ---------- 外部リンク ---------- */
  $$("[data-link]").forEach(function (a) {
    var url = D.links[a.getAttribute("data-link")];
    if (url) a.href = url;
  });
  $("#topbar-text").textContent = D.topbar;
  $("#year").textContent = new Date().getFullYear();

  /* ---------- 商品カード ---------- */
  function card(p) {
    var c = catById[p.category] || { label: "", emoji: "" };
    var st = STATUS[p.status] || STATUS.available;
    return (
      '<li class="card ' + st.cls + '">' +
        '<a href="' + esc(p.url) + '">' +
          '<div class="card-img theme-' + esc(p.category) + '">' +
            '<span class="card-emoji" aria-hidden="true">' + c.emoji + "</span>" +
            '<span class="badge">' + st.label + "</span>" +
          "</div>" +
          '<div class="card-body">' +
            '<p class="card-cat">' + esc(c.label) + "</p>" +
            '<h3 class="card-name">' + esc(p.name) + "</h3>" +
            (p.spec ? '<p class="card-spec">' + esc(p.spec) + "</p>" : "") +
            '<p class="card-price">' + yen(p.price) + "</p>" +
            '<p class="card-shop"><span class="mini-mark" aria-hidden="true">結</span>やまなしだもの 結</p>' +
          "</div>" +
        "</a>" +
      "</li>"
    );
  }

  function render(el, list) { el.innerHTML = list.map(card).join(""); }

  /* ---------- カテゴリアイコン列 / フッター ---------- */
  $("#cat-list").innerHTML = D.categories.map(function (c) {
    return '<li><a href="#all" data-filter="' + c.id + '"><span class="cat-circle theme-' + c.id + '" aria-hidden="true">' +
      c.emoji + "</span><span>" + esc(c.label) + "</span></a></li>";
  }).join("");
  $("#footer-cats").innerHTML = D.categories.map(function (c) {
    return '<li><a href="#all" data-filter="' + c.id + '">' + esc(c.label) + "</a></li>";
  }).join("");

  /* ---------- 旬のおすすめ ---------- */
  var month = new Date().getMonth() + 1;
  var inSeason = D.products.filter(function (p) {
    var c = catById[p.category];
    return p.status !== "soldout" && c && c.months.indexOf(month) !== -1;
  });
  var buyable = D.products.filter(function (p) { return p.status !== "soldout"; });
  render($("#rail-season"), (inSeason.length ? inSeason : buyable).concat(
    D.products.filter(function (p) { return p.status === "soldout"; })
  ));

  /* ---------- ピックアップ ---------- */
  render($("#rail-popular"), D.products
    .filter(function (p) { return p.pickup; })
    .sort(function (a, b) { return a.pickup - b.pickup; }));

  /* ---------- 特集 ---------- */
  $("#feature-grid").innerHTML = D.features.map(function (f) {
    return '<li><a class="feature theme-' + f.theme + '" href="#all" data-filter="' + f.filter + '">' +
      '<span class="feature-emoji" aria-hidden="true">' + (catById[f.theme] || {}).emoji + "</span>" +
      '<span class="feature-text"><strong>' + esc(f.title) + "</strong><span>" + esc(f.sub) + "</span></span>" +
      "</a></li>";
  }).join("");

  /* ---------- すべての商品 + 絞り込み ---------- */
  var chips = $("#chips");
  chips.innerHTML = [{ id: "all", label: "すべて" }].concat(D.categories).map(function (c, i) {
    return '<button class="chip' + (i === 0 ? " is-active" : "") + '" role="tab" aria-selected="' + (i === 0) +
      '" data-chip="' + c.id + '">' + (c.emoji ? c.emoji + " " : "") + esc(c.label) + "</button>";
  }).join("");

  function applyFilter(id) {
    var list = id === "all" ? D.products : D.products.filter(function (p) { return p.category === id; });
    render($("#all-grid"), list);
    $("#all-empty").hidden = list.length > 0;
    $$(".chip", chips).forEach(function (b) {
      var on = b.getAttribute("data-chip") === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on);
    });
  }
  applyFilter("all");

  chips.addEventListener("click", function (e) {
    var b = e.target.closest("[data-chip]");
    if (b) applyFilter(b.getAttribute("data-chip"));
  });
  // カテゴリアイコン・特集・バナー・フッターからの絞り込み
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-filter]");
    if (a) applyFilter(a.getAttribute("data-filter"));
  });

  /* ---------- 検索 ---------- */
  var input = $("#search-input");
  var results = $("#search-results");
  function search() {
    var q = input.value.trim().toLowerCase();
    if (!q) { results.hidden = true; return; }
    var hit = D.products.filter(function (p) {
      var c = catById[p.category] || {};
      return (p.name + " " + (p.spec || "") + " " + (c.label || "")).toLowerCase().indexOf(q) !== -1;
    });
    $("#search-title").textContent = "「" + input.value.trim() + "」の検索結果（" + hit.length + "件）";
    render($("#search-grid"), hit);
    results.hidden = false;
  }
  $("#search-form").addEventListener("submit", function (e) {
    e.preventDefault();
    search();
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  input.addEventListener("input", search);
  $("#search-clear").addEventListener("click", function () { input.value = ""; search(); input.focus(); });
  $("#bn-search").addEventListener("click", function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); input.focus(); });

  /* ---------- 旬のカレンダー ---------- */
  var months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var cal = '<div class="cal-row cal-head"><span></span>' + months.map(function (m) {
    return '<span class="' + (m === month ? "is-now" : "") + '">' + m + "</span>";
  }).join("") + "</div>";
  D.categories.filter(function (c) { return c.months.length; }).forEach(function (c) {
    cal += '<div class="cal-row"><span class="cal-label">' + c.emoji + " " + esc(c.label) + "</span>" +
      months.map(function (m) {
        return '<span class="cal-cell' + (c.months.indexOf(m) !== -1 ? " on theme-" + c.id : "") + (m === month ? " is-now" : "") + '"></span>';
      }).join("") + "</div>";
  });
  $("#calendar").innerHTML = cal;

  /* ---------- お知らせ ---------- */
  $("#news-list").innerHTML = D.news.map(function (n) {
    return '<li><time>' + esc(n.date) + "</time><p>" + esc(n.title) + "</p></li>";
  }).join("");

  /* ---------- メインバナー（カルーセル） ---------- */
  var track = $("#hero-track");
  var dots = $("#hero-dots");
  track.innerHTML = D.banners.map(function (b, i) {
    return '<a class="slide theme-' + b.theme + '" href="' + esc(b.href) + '"' + (b.filter ? ' data-filter="' + b.filter + '"' : "") +
      ' aria-label="' + (i + 1) + " / " + D.banners.length + '">' +
      '<span class="slide-text"><span class="slide-sub">' + esc(b.sub) + "</span><strong>" + esc(b.title) + "</strong>" +
      '<span class="slide-cta">詳しく見る ›</span></span>' +
      '<span class="slide-emoji" aria-hidden="true">' + (catById[b.theme] || {}).emoji + "</span></a>";
  }).join("");
  dots.innerHTML = D.banners.map(function (_, i) {
    return '<button role="tab" aria-label="バナー' + (i + 1) + '"></button>';
  }).join("");

  var idx = 0;
  var slides = $$(".slide", track);
  var dotBtns = $$("button", dots);
  function go(i) {
    idx = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[idx].offsetLeft - (track.clientWidth - slides[idx].clientWidth) / 2, behavior: "smooth" });
  }
  function syncDots() {
    var center = track.scrollLeft + track.clientWidth / 2;
    var best = 0, bestD = Infinity;
    slides.forEach(function (s, i) {
      var d = Math.abs(s.offsetLeft + s.clientWidth / 2 - center);
      if (d < bestD) { bestD = d; best = i; }
    });
    idx = best;
    dotBtns.forEach(function (d, i) { d.setAttribute("aria-selected", i === best); });
  }
  track.addEventListener("scroll", function () { window.requestAnimationFrame(syncDots); }, { passive: true });
  dotBtns.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
  $(".hero-nav.prev").addEventListener("click", function () { go(idx - 1); });
  $(".hero-nav.next").addEventListener("click", function () { go(idx + 1); });
  syncDots();

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timer;
  function auto() { if (!reduce) timer = setInterval(function () { go(idx + 1); }, 5000); }
  $(".hero").addEventListener("mouseenter", function () { clearInterval(timer); });
  $(".hero").addEventListener("mouseleave", auto);
  track.addEventListener("touchstart", function () { clearInterval(timer); }, { passive: true });
  auto();
})();
