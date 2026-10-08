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
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function yen(n) {
    return n == null ? '<span class="price-ask">価格は商品ページへ</span>' : "¥" + n.toLocaleString("ja-JP") + "<small>税込</small>";
  }

  function pidOf(url) {
    var m = /[?&]pid=(\d+)/.exec(url || "");
    return m ? m[1] : "";
  }

  // 写真URL：image 指定 > imageBase + 商品ID.jpg
  function imageFor(obj) {
    if (obj.image) return obj.image;
    var pid = obj.pid || pidOf(obj.url);
    return D.imageBase && pid ? D.imageBase + pid + ".jpg" : "";
  }

  // 写真（読み込めない場合は下のプレースホルダーが見える）
  function media(src, catId, alt) {
    var c = catById[catId] || {};
    return '<span class="ph theme-' + esc(catId) + '" aria-hidden="true"><span class="ph-en">' + esc(c.en || "musubi") +
      '</span><span class="ph-ja">' + esc(c.label || "") + "</span></span>" +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" onerror="this.remove()">' : "");
  }

  /* ---------- 外部リンク・テキスト ---------- */
  $$("[data-link]").forEach(function (a) {
    var url = D.links[a.getAttribute("data-link")];
    if (url) a.href = url;
  });
  $("#topbar-text").textContent = D.topbar;
  $("#year").textContent = new Date().getFullYear();

  /* ---------- 商品カード ---------- */
  function card(p) {
    var c = catById[p.category] || {};
    var st = STATUS[p.status] || STATUS.available;
    return (
      '<li class="card ' + st.cls + '"><a href="' + esc(p.url) + '">' +
        '<div class="card-img">' + media(imageFor(p), p.category, p.name) +
          '<span class="badge">' + st.label + "</span></div>" +
        '<div class="card-body">' +
          '<p class="card-cat">' + esc(c.label) + "</p>" +
          '<h3 class="card-name">' + esc(p.name) + "</h3>" +
          (p.spec ? '<p class="card-spec">' + esc(p.spec) + "</p>" : "") +
          '<p class="card-price">' + yen(p.price) + "</p>" +
          '<p class="card-shop">山梨県 ・ やまなしだもの 結</p>' +
        "</div>" +
      "</a></li>"
    );
  }
  function render(el, list) { el.innerHTML = list.map(card).join(""); }

  /* ---------- カテゴリ（写真サークル） / フッター ---------- */
  $("#cat-list").innerHTML = D.categories.map(function (c) {
    return '<li><a href="#all" data-filter="' + c.id + '"><span class="cat-circle">' + media(imageFor(c), c.id, "") +
      '</span><span class="cat-label">' + esc(c.label) + "</span></a></li>";
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
  var seasonList = inSeason.length ? inSeason.concat(buyable.filter(function (p) { return inSeason.indexOf(p) === -1; })) : buyable;
  render($("#rail-season"), seasonList.concat(D.products.filter(function (p) { return p.status === "soldout"; })));

  /* ---------- ピックアップ ---------- */
  $("#rail-popular").innerHTML = D.products
    .filter(function (p) { return p.pickup; })
    .sort(function (a, b) { return a.pickup - b.pickup; })
    .map(function (p) {
      var st = STATUS[p.status] || STATUS.available;
      return '<li class="pick ' + st.cls + '"><a href="' + esc(p.url) + '">' +
        '<div class="pick-img">' + media(imageFor(p), p.category, p.name) + "</div>" +
        '<div class="pick-body"><span class="badge">' + st.label + "</span>" +
        "<h3>" + esc(p.name) + "</h3>" +
        (p.spec ? '<p class="card-spec">' + esc(p.spec) + "</p>" : "") +
        '<p class="card-price">' + yen(p.price) + "</p></div></a></li>";
    }).join("");

  /* ---------- 特集 ---------- */
  $("#feature-grid").innerHTML = D.features.map(function (f) {
    return '<li><a class="feature" href="#all" data-filter="' + f.filter + '">' + media(imageFor(f), f.theme, "") +
      '<span class="feature-text"><span class="en">Feature</span><strong>' + esc(f.title) + "</strong><span>" + esc(f.sub) + "</span></span></a></li>";
  }).join("");

  /* ---------- つくり手 ---------- */
  $("#story-photo").innerHTML = media(D.storyImage || imageFor(D.banners[0] || {}), (D.banners[0] || {}).theme, "山梨の果樹園");

  /* ---------- すべての商品 + 絞り込み ---------- */
  var chips = $("#chips");
  chips.innerHTML = [{ id: "all", label: "すべて" }].concat(D.categories).map(function (c, i) {
    return '<button class="chip' + (i === 0 ? " is-active" : "") + '" role="tab" aria-selected="' + (i === 0) +
      '" data-chip="' + c.id + '">' + esc(c.label) + "</button>";
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
    return '<span class="' + (m === month ? "is-now" : "") + '">' + m + "月</span>";
  }).join("") + "</div>";
  D.categories.filter(function (c) { return c.months.length; }).forEach(function (c) {
    cal += '<div class="cal-row"><span class="cal-label">' + esc(c.label) + "</span>" +
      months.map(function (m) {
        var on = c.months.indexOf(m) !== -1;
        return '<span class="cal-cell' + (on ? " on" : "") + (m === month ? " is-now" : "") + '">' +
          (on ? '<i class="theme-' + c.id + '"></i>' : "") + "</span>";
      }).join("") + "</div>";
  });
  $("#calendar").innerHTML = cal;

  /* ---------- お知らせ ---------- */
  $("#news-list").innerHTML = D.news.map(function (n) {
    return "<li><time>" + esc(n.date) + "</time><p>" + esc(n.title) + "</p></li>";
  }).join("");

  /* ---------- メインバナー（カルーセル） ---------- */
  var track = $("#hero-track");
  var dots = $("#hero-dots");
  track.innerHTML = D.banners.map(function (b, i) {
    return '<a class="slide" href="' + esc(b.href) + '"' + (b.filter ? ' data-filter="' + b.filter + '"' : "") +
      ' aria-label="' + esc(b.title) + "（" + (i + 1) + " / " + D.banners.length + '）">' +
      media(imageFor(b), b.theme, "") +
      '<span class="slide-text"><span class="slide-sub">' + esc(b.sub) + "</span><strong>" + esc(b.title) + "</strong>" +
      '<span class="slide-cta">詳しく見る</span></span></a>';
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
  function auto() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(idx + 1); }, 5500); }
  $(".hero").addEventListener("mouseenter", function () { clearInterval(timer); });
  $(".hero").addEventListener("mouseleave", auto);
  track.addEventListener("touchstart", function () { clearInterval(timer); }, { passive: true });
  auto();
})();
