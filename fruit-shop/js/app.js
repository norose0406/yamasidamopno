// 画面の描画とイベント処理。
(function () {
  const CONFIG = window.SiteConfig;
  const { PRODUCTS, CATEGORIES, HERO_PHOTOS } = window.ShopData;
  const { FAQ } = window.SiteContent;
  const Shop = window.Shop;
  const CART_KEY = 'musubi-cart';
  const FAV_KEY = 'musubi-favorites';
  const ORDERS_KEY = 'musubi-orders';
  const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

  const today = new Date();
  const month = today.getMonth() + 1;

  const state = {
    category: 'all',
    query: '',
    sort: 'recommended',
    cart: Shop.normalizeCart(load(CART_KEY, {}), PRODUCTS),
    favorites: (load(FAV_KEY, []) || []).filter((id) => byId.has(id)),
  };

  const $ = (sel) => document.querySelector(sel);

  // ---- 保存（プライベートモードなどで使えなくても動くようにする）----
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // 保存できなくても画面上の状態はそのまま使える
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function plainName(product) {
    return product.name.replace(/【.*?】/g, '').trim();
  }

  // ---- 計測（GA4 の測定IDが設定されているときだけ送る）----
  function initAnalytics() {
    const id = CONFIG.analytics.ga4Id;
    if (!id) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', id);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
  }

  function track(event, params) {
    if (typeof window.gtag === 'function') window.gtag('event', event, params || {});
  }

  function itemParams(product, variant, qty) {
    return {
      currency: 'JPY',
      value: (variant ? variant.price : Shop.minPrice(product)) * (qty || 1),
      items: [{ item_id: product.id, item_name: plainName(product), item_category: CATEGORY_LABEL[product.category], item_variant: variant ? variant.label : undefined, price: variant ? variant.price : Shop.minPrice(product), quantity: qty || 1 }],
    };
  }

  // ---- 共通パーツ ----
  // 商品写真。読み込めなかったときはイラストに差し替える（下の error リスナー）。
  function visual(product, scope, index) {
    const src = product.photos && product.photos[index || 0];
    if (!src) return window.illustration(product, scope);
    return (
      '<img class="photo' + (product.bannerPhoto && !index ? ' photo-whole' : '') + '" src="' + src + '" alt="' + escapeHtml(plainName(product)) + '" loading="lazy" decoding="async"' +
      ' data-fallback="' + product.id + '" data-scope="' + scope + '">'
    );
  }

  function statusBadge(product) {
    const a = Shop.availability(product, month);
    return '<span class="status status-' + a.status + '">' + a.label + '</span>';
  }

  function priceLabel(product) {
    return Shop.formatYen(Shop.minPrice(product)) + (product.variants.length > 1 ? '〜' : '');
  }

  function isFavorite(id) {
    return state.favorites.includes(id);
  }

  function favButton(product, extraClass) {
    const on = isFavorite(product.id);
    return (
      '<button type="button" class="fav' + (extraClass ? ' ' + extraClass : '') + '" data-fav="' + product.id + '" aria-pressed="' + on + '"' +
      ' aria-label="' + escapeHtml(plainName(product)) + 'をお気に入り' + (on ? 'から外す' : 'に追加') + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>' +
      '</button>'
    );
  }

  function productCard(p) {
    const status = Shop.availability(p, month).status;
    const size = p.variants.length === 1 ? p.variants[0].label : p.variants.map((v) => v.label.split('（')[0]).join(' / ');
    return (
      '<li class="card' + (status === 'soldout' ? ' is-soldout' : '') + '">' +
      '<div class="card-media">' +
      '<button type="button" class="card-link" data-detail="' + p.id + '" aria-label="' + escapeHtml(plainName(p)) + 'の詳細を見る">' +
      visual(p, 'card') +
      '</button>' +
      (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') +
      favButton(p) +
      '</div>' +
      '<div class="card-body">' +
      statusBadge(p) +
      '<h3 class="card-name"><button type="button" data-detail="' + p.id + '">' + p.name + '</button></h3>' +
      '<p class="card-size">' + size + '</p>' +
      '<p class="card-price">' + priceLabel(p) + '<small>税込</small></p>' +
      '</div>' +
      '</li>'
    );
  }

  const ICONS = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4 4 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" fill="currentColor"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="m10 9 5 3-5 3z" fill="#fff"/></svg>',
    line: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9l-.6 2.6c-.1.4.3.7.7.5L15 19c4.1-1 7-4.2 7-8 0-4.4-4.5-8-10-8z" fill="currentColor"/></svg>',
  };
  const SNS_LABEL = { instagram: 'Instagram', x: 'X（Twitter）', facebook: 'Facebook', youtube: 'YouTube', line: 'LINE' };

  function snsLinks(className) {
    return Object.keys(SNS_LABEL)
      .filter((key) => CONFIG.sns[key])
      .map(
        (key) =>
          '<a class="' + className + ' sns-' + key + '" href="' + CONFIG.sns[key] + '" target="_blank" rel="noopener" data-sns="' + key + '">' +
          ICONS[key] + '<span>' + SNS_LABEL[key] + '</span></a>'
      )
      .join('');
  }

  // ---- ヘッダー・カテゴリ ----
  function categoryButtons(className) {
    return CATEGORIES.map(
      (c) => '<button type="button" class="' + className + '" data-category="' + c.id + '" aria-pressed="' + (state.category === c.id) + '">' + c.label + '</button>'
    ).join('');
  }

  function renderCategoryNav() {
    $('#category-nav').innerHTML =
      CATEGORIES.filter((c) => c.id !== 'all')
        .map((c) => '<li><button type="button" data-category="' + c.id + '" aria-pressed="' + (state.category === c.id) + '">' + c.label + '</button></li>')
        .join('') +
      '<li class="nav-sep" aria-hidden="true"></li>' +
      '<li><a href="#gift">ギフト・法人</a></li>' +
      '<li><a href="#how-to-buy">ご購入方法・送料</a></li>' +
      '<li><a href="#contact">お問い合わせ</a></li>';
    $('#catalog-filter').innerHTML = categoryButtons('chip');
  }

  function setCategory(id, scroll) {
    state.category = id;
    renderCategoryNav();
    renderCatalog();
    if (scroll) $('#items').scrollIntoView({ behavior: 'smooth' });
  }

  // ---- トップのスライド ----
  let heroTimer;
  function renderHero() {
    const track = $('#hero-track');
    track.innerHTML = HERO_PHOTOS.map(
      (src, i) =>
        '<div class="hero-slide"><img src="' + src + '" alt="' + (i === 0 ? 'やまなしだもの 結 musubi の果物' : '') + '" data-hero' + (i > 1 ? ' loading="lazy"' : '') + '></div>'
    ).join('');
    renderHeroDots();
    track.addEventListener('scroll', () => {
      window.clearTimeout(track._t);
      track._t = window.setTimeout(updateHeroDots, 80);
    });
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) startHeroTimer();
    track.addEventListener('pointerdown', () => window.clearInterval(heroTimer));
  }

  function heroSlides() {
    return Array.from($('#hero-track').children);
  }

  function heroIndex() {
    const track = $('#hero-track');
    const slides = heroSlides();
    let best = 0;
    let bestDist = Infinity;
    const center = track.scrollLeft + track.clientWidth / 2;
    slides.forEach((s, i) => {
      const dist = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }

  function goToSlide(i) {
    const track = $('#hero-track');
    const slide = heroSlides()[i];
    if (!slide) return;
    track.scrollTo({ left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2, behavior: 'smooth' });
  }

  function startHeroTimer() {
    window.clearInterval(heroTimer);
    heroTimer = window.setInterval(() => {
      const n = heroSlides().length;
      if (n > 1) goToSlide((heroIndex() + 1) % n);
    }, 5000);
  }

  function renderHeroDots() {
    const n = heroSlides().length;
    $('#hero-dots').innerHTML = Array.from(
      { length: n },
      (_, i) => '<button type="button" data-slide="' + i + '" aria-label="' + (i + 1) + '枚目"></button>'
    ).join('');
    updateHeroDots();
  }

  function updateHeroDots() {
    const current = heroIndex();
    document.querySelectorAll('#hero-dots button').forEach((b, i) => b.setAttribute('aria-current', i === current ? 'true' : 'false'));
  }

  // スライド写真が1枚も読めないときは、スライド欄ごと隠す（見出しは下の紹介欄にある）
  function heroFallback() {
    $('#hero').hidden = true;
    window.clearInterval(heroTimer);
  }

  // 画像の読み込みに失敗したらイラストに差し替える（error はバブリングしないので capture で拾う）
  function handleImageError(e) {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.fallback) {
      const product = byId.get(img.dataset.fallback);
      if (product) img.outerHTML = window.illustration(product, img.dataset.scope + Math.random().toString(36).slice(2, 6));
    } else if (img.hasAttribute('data-hero')) {
      img.closest('.hero-slide').remove();
      if (heroSlides().length === 0) heroFallback();
      else renderHeroDots();
    } else if (img.hasAttribute('data-hide-on-error')) {
      const box = img.closest('[data-hide-box]') || img;
      box.remove();
    }
  }

  // ---- 商品（販売中・予約受付中・今季終了に分けて表示）----
  const GROUPS = [
    { id: 'now', title: '販売中', note: 'ご注文後1週間以内に発送します。', match: (s) => s === 'available' || s === 'low' },
    { id: 'reserve', title: '予約受付中', note: '発送時期が来たら、順次お届けします。', match: (s) => s === 'reserve' },
    { id: 'soldout', title: '今季の販売は終了しました', note: '次のシーズンの予約開始はInstagramでお知らせします。', match: (s) => s === 'soldout' },
  ];

  function filteredProducts() {
    const q = state.query.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => {
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (!q) return true;
      return [p.name, p.origin, CATEGORY_LABEL[p.category], p.description].some((t) => t.toLowerCase().includes(q));
    });
    const sorters = {
      recommended: () => 0,
      'price-asc': (a, b) => Shop.minPrice(a) - Shop.minPrice(b),
      'price-desc': (a, b) => Shop.minPrice(b) - Shop.minPrice(a),
    };
    return list.slice().sort(sorters[state.sort]);
  }

  function renderCatalog() {
    const list = filteredProducts();
    const label = state.query ? '「' + state.query + '」の検索結果' : state.category === 'all' ? 'すべての商品' : CATEGORY_LABEL[state.category];
    $('#result-count').textContent = label + '　' + list.length + '件';
    if (list.length === 0) {
      $('#catalog').innerHTML = '<p class="empty">条件に合う商品が見つかりませんでした。<br><a href="#contact">お探しの商品はお問い合わせください</a></p>';
      return;
    }
    $('#catalog').innerHTML = GROUPS.map((g) => {
      const items = list.filter((p) => g.match(Shop.availability(p, month).status));
      if (items.length === 0) return '';
      const head =
        '<div class="group-head"><h3>' + g.title + '<span class="group-count">' + items.length + '</span></h3><p>' + g.note + '</p></div>';
      const grid = '<ul class="product-grid">' + items.map(productCard).join('') + '</ul>';
      // 売り切れは閉じた状態で一番下に置く
      if (g.id === 'soldout') return '<details class="group group-soldout"><summary>' + head + '</summary>' + grid + '</details>';
      return '<section class="group">' + head + grid + '</section>';
    }).join('');
  }

  function renderAbout() {
    $('#about-photos').innerHTML = [['shine', 0], ['hayward', 0], ['kanikanmusume', 1]]
      .map(([id, index]) => '<div class="about-photo">' + visual(byId.get(id), 'about', index) + '</div>')
      .join('');
  }

  // ---- 旬カレンダー（品目ごと）----
  function renderCalendar() {
    let head = '<thead><tr><th scope="col">品目</th>';
    for (let m = 1; m <= 12; m++) head += '<th scope="col"' + (m === month ? ' class="current"' : '') + '>' + m + '月</th>';
    head += '</tr></thead>';
    const rows = CATEGORIES.filter((c) => c.id !== 'all' && c.id !== 'set')
      .map((c) => {
        const items = PRODUCTS.filter((p) => p.category === c.id);
        const sample = items[0];
        const varieties = items.map((p) => plainName(p).replace(/^(幻のとうもろこし|純白とうもろこし|大玉追熟キウイ|細長追熟キウイ|追熟)\s*/, '').replace(/（.*?）/g, '')).join('・');
        let cells = '';
        for (let m = 1; m <= 12; m++) {
          const on = Shop.isInSeason(sample, m);
          cells += '<td class="' + (on ? 'on cal-' + c.id : '') + (m === month ? ' current' : '') + '">' + (on ? '<span class="visually-hidden">旬</span>' : '') + '</td>';
        }
        return '<tr><th scope="row">' + c.label + '<small>' + varieties + '</small><small>発送 ' + sample.shipping + '</small></th>' + cells + '</tr>';
      })
      .join('');
    $('#season-calendar').innerHTML = '<caption class="visually-hidden">品目ごとの旬の時期</caption>' + head + '<tbody>' + rows + '</tbody>';
  }

  // ---- 送料表 ----
  function renderShippingTable() {
    const byFee = new Map();
    Shop.SHIPPING_ZONES.forEach((z) => byFee.set(z.fee, (byFee.get(z.fee) || []).concat(z.label)));
    $('#shipping-table').innerHTML =
      '<thead><tr><th scope="col">地域</th><th scope="col">送料</th></tr></thead><tbody>' +
      Array.from(byFee.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([fee, labels]) => '<tr><td>' + labels.join('・') + '</td><td>' + Shop.formatYen(fee) + '</td></tr>')
        .join('') +
      '</tbody>';
  }

  // ---- SNS ----
  function renderSns() {
    const handle = CONFIG.sns.instagram ? '@' + CONFIG.sns.instagram.replace(/\/$/, '').split('/').pop() : '';
    $('#about-sns').innerHTML =
      '<p class="about-sns-title">収穫や入荷のお知らせを発信しています' + (handle ? '（Instagram ' + handle + '）' : '') + '</p>' +
      '<div class="sns-buttons">' + snsLinks('sns-button') + '</div>';
    $('#footer-sns').innerHTML = snsLinks('sns-icon');
  }

  // ---- よくあるご質問 ----
  function renderFaq() {
    $('#faq').innerHTML = FAQ.map((item) => '<details><summary>' + item.q + '</summary><p>' + item.a + '</p></details>').join('');
  }

  // ---- 店舗情報（MEO：表記を Googleビジネスプロフィールと揃える）----
  function fullAddress() {
    const s = CONFIG.shop;
    return '〒' + s.postalCode + ' ' + s.region + s.locality + s.street;
  }

  function renderShopInfo() {
    const s = CONFIG.shop;
    $('#shop-spec').innerHTML =
      '<dt>店名</dt><dd>' + s.name + '</dd>' +
      '<dt>運営</dt><dd>' + s.company + '</dd>' +
      '<dt>所在地</dt><dd>' + fullAddress() + '</dd>' +
      '<dt>電話</dt><dd><a href="tel:' + s.tel.replace(/-/g, '') + '" data-track="click_tel">' + s.tel + '</a></dd>' +
      '<dt>メール</dt><dd><a href="mailto:' + s.email + '" data-track="click_email">' + s.email + '</a></dd>';
    const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.meo.mapQuery);
    $('#map-wrap').innerHTML =
      '<iframe title="' + s.name + ' の地図" src="https://www.google.com/maps?q=' + encodeURIComponent(CONFIG.meo.mapQuery) + '&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
      '<div class="map-actions">' +
      '<a class="btn btn-outline" href="' + mapUrl + '" target="_blank" rel="noopener" data-track="click_map">Googleマップで見る</a>' +
      (CONFIG.meo.reviewUrl
        ? '<a class="btn btn-outline" href="' + CONFIG.meo.reviewUrl + '" target="_blank" rel="noopener" data-track="click_review">Googleでクチコミを書く</a>'
        : '') +
      '</div>';
    $('#footer-address').innerHTML = s.company + '<br>' + fullAddress() + '<br>TEL ' + s.tel;
  }

  // ---- 問い合わせ ----
  function renderContact() {
    const s = CONFIG.shop;
    let routes =
      '<li><a href="tel:' + s.tel.replace(/-/g, '') + '" data-track="click_tel"><strong>お電話</strong>' + s.tel + '</a></li>' +
      '<li><a href="mailto:' + s.email + '" data-track="click_email"><strong>メール</strong>' + s.email + '</a></li>';
    if (CONFIG.sns.line) routes += '<li><a href="' + CONFIG.sns.line + '" target="_blank" rel="noopener" data-sns="line"><strong>LINE</strong>友だち追加してトークで相談</a></li>';
    if (CONFIG.sns.instagram) routes += '<li><a href="' + CONFIG.sns.instagram + '" target="_blank" rel="noopener" data-sns="instagram"><strong>Instagram</strong>DMでも受け付けています</a></li>';
    $('#contact-routes').innerHTML = routes;

    $('#inquiry-types').innerHTML = Shop.INQUIRY_TYPES.map(
      (t, i) => '<label class="chip-option"><input type="radio" name="type" value="' + t + '"' + (i === 0 ? ' checked' : '') + '><span>' + t + '</span></label>'
    ).join('');
    $('#q-product').innerHTML =
      '<option value="">選択しない</option>' + PRODUCTS.map((p) => '<option value="' + p.id + '">' + plainName(p) + '</option>').join('');
    $('#inquiry-note').textContent = CONFIG.inquiry.endpoint
      ? '送信後、担当者よりご連絡します。'
      : '送信ボタンを押すとメールアプリが開きます。そのまま送信してください。';
  }

  function inquireAbout(productId) {
    const product = byId.get(productId);
    $('#q-product').value = productId;
    const message = $('#q-message');
    if (!message.value && product) message.value = '「' + plainName(product) + '」について、';
    $('#product-dialog').close();
    $('#contact').scrollIntoView({ behavior: 'smooth' });
    window.setTimeout(() => message.focus({ preventScroll: true }), 500);
  }

  function showErrors(form, errors) {
    form.querySelectorAll('[data-error-for]').forEach((el) => {
      const key = el.dataset.errorFor;
      el.textContent = errors[key] || '';
      const input = form.elements[key];
      if (input && input.setAttribute) input.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    });
    const first = Object.keys(errors)[0];
    if (first) {
      const el = form.elements[first];
      const target = el && el.focus ? el : el && el[0];
      if (target) target.focus();
    }
  }

  // 問い合わせ・注文の送信。送信先URLが設定されていなければメールアプリで送る。
  async function sendMessage(subject, body, payload) {
    const endpoint = CONFIG.inquiry.endpoint;
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.assign({ subject, body }, payload)),
      });
      if (!res.ok) throw new Error('送信に失敗しました（' + res.status + '）');
      return 'sent';
    }
    window.location.href = 'mailto:' + CONFIG.shop.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    return 'mailto';
  }

  async function submitInquiry(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const errors = Shop.validateInquiry(values);
    showErrors(form, errors);
    if (Object.keys(errors).length) return;

    const product = byId.get(values.product);
    const body = [
      '【お問い合わせの種類】' + values.type,
      product ? '【関連する商品】' + plainName(product) : '',
      '【お名前】' + values.name,
      values.company ? '【会社名】' + values.company : '',
      '【メール】' + values.email,
      values.phone ? '【電話】' + values.phone : '',
      '',
      values.message,
    ]
      .filter((line, i) => line !== '' || i === 6)
      .join('\n');
    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    try {
      const result = await sendMessage('【お問い合わせ】' + values.type + '（' + values.name + ' 様）', body, Object.assign({ kind: 'inquiry' }, values));
      track('generate_lead', { lead_type: 'inquiry', inquiry_type: values.type, method: result });
      form.reset();
      form.querySelector('input[name=type]').checked = true;
      showToast(result === 'sent' ? 'お問い合わせを送信しました。担当者よりご連絡します。' : 'メールアプリで送信を完了してください。');
    } catch (err) {
      showToast(err.message + '。お手数ですがお電話（' + CONFIG.shop.tel + '）でご連絡ください。');
    } finally {
      button.disabled = false;
    }
  }

  // ---- 商品詳細 ----
  function qtyOptions(variant) {
    let html = '';
    for (let i = 1; i <= Shop.maxQty(variant); i++) html += '<option value="' + i + '">' + i + '</option>';
    return html;
  }

  function shareLinks(product) {
    const url = CONFIG.siteUrl + '/products/' + product.id + '.html';
    const text = plainName(product) + '｜' + CONFIG.shop.name;
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(text);
    return (
      '<div class="share"><span>シェア</span>' +
      '<a href="https://social-plugins.line.me/lineit/share?url=' + u + '" target="_blank" rel="noopener" data-share="line" aria-label="LINEで送る">' + ICONS.line + '</a>' +
      '<a href="https://twitter.com/intent/tweet?url=' + u + '&text=' + t + '" target="_blank" rel="noopener" data-share="x" aria-label="Xでポスト">' + ICONS.x + '</a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener" data-share="facebook" aria-label="Facebookでシェア">' + ICONS.facebook + '</a>' +
      '<button type="button" data-copy="' + url + '" aria-label="リンクをコピー"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
      '</div>'
    );
  }

  function openDetail(id) {
    const p = byId.get(id);
    if (!p) return;
    const a = Shop.availability(p, month);
    const firstAvailable = p.variants.find((v) => v.stock > 0);
    let note = '';
    if (a.status === 'reserve') note = '<p class="notice">ただいま予約受付中です。' + p.shipping + 'に順次発送します。</p>';
    if (a.status === 'soldout') note = '<p class="notice">今季の販売は終了しました。入荷のお知らせはInstagramで発信しています。</p>';

    const variantPicker =
      p.variants.length > 1
        ? '<fieldset class="variant-picker"><legend>サイズ</legend>' +
          p.variants
            .map(
              (v) =>
                '<label class="variant' + (v.stock <= 0 ? ' is-disabled' : '') + '">' +
                '<input type="radio" name="variant" value="' + v.id + '"' + (v === firstAvailable ? ' checked' : '') + (v.stock <= 0 ? ' disabled' : '') + '>' +
                '<span class="variant-label">' + v.label + '</span>' +
                '<span class="variant-price">' + (v.stock <= 0 ? '売り切れ' : Shop.formatYen(v.price)) + '</span>' +
                '</label>'
            )
            .join('') +
          '</fieldset>'
        : '';

    const thumbs =
      p.photos.length > 1
        ? '<div class="thumbs">' +
          p.photos.map((src, i) => '<button type="button" data-thumb="' + i + '" aria-label="写真' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + visual(p, 'thumb' + i, i) + '</button>').join('') +
          '</div>'
        : '';

    $('#product-dialog-body').innerHTML =
      '<div class="modal-head"><p class="breadcrumb">' + CATEGORY_LABEL[p.category] + '</p><button class="icon-button" type="button" data-close aria-label="閉じる">×</button></div>' +
      '<div class="detail" data-product="' + p.id + '">' +
      '<div class="detail-gallery"><div class="detail-main" id="detail-main">' + visual(p, 'detail') + (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') + '</div>' + thumbs + '</div>' +
      '<div class="detail-info">' +
      statusBadge(p) +
      '<h2 id="product-dialog-title">' + p.name + '</h2>' +
      '<p class="detail-price" id="detail-price">' + Shop.formatYen((firstAvailable || p.variants[0]).price) + '<small>税込</small></p>' +
      '<p class="detail-shipping">送料 ' + Shop.formatYen(Shop.MIN_SHIPPING_FEE) + '〜（お届け先により異なります）</p>' +
      note +
      (firstAvailable
        ? variantPicker +
          '<div class="detail-actions">' +
          '<label class="select qty-select"><span>数量</span><select id="detail-qty">' + qtyOptions(firstAvailable) + '</select></label>' +
          '<button type="button" class="btn btn-primary" data-add-detail="' + p.id + '">カートに入れる</button>' +
          favButton(p, 'fav-large') +
          '</div>' +
          '<p class="buy-note">カートからご注文を申し込むと、お支払い方法をメールでご案内します。</p>' +
          '<div class="alt-buy"><p>クレジットカード・Amazon Payですぐに決済したい方</p>' +
          '<a class="btn btn-outline btn-block" href="' + CONFIG.shop.storeUrl + '?pid=' + p.pid + '" target="_blank" rel="noopener" data-store="' + p.id + '">公式オンラインショップで購入</a></div>'
        : '<div class="detail-actions">' + favButton(p, 'fav-large') + '</div>') +
      '<p class="inquire-line">ギフト・大口のご注文や、商品についてのご質問は <button type="button" class="text-link" data-inquire="' + p.id + '">この商品について問い合わせる</button></p>' +
      '<p class="detail-desc">' + p.description + '</p>' +
      '<dl class="spec">' +
      (p.variants.length === 1 ? '<dt>内容量</dt><dd>' + p.variants[0].label + '</dd>' : '') +
      '<dt>産地</dt><dd>' + p.origin + '</dd>' +
      '<dt>旬</dt><dd>' + Shop.seasonLabel(p) + '</dd>' +
      '<dt>発送目安</dt><dd>' + p.shipping + '（天候等により前後します）</dd>' +
      '<dt>配送</dt><dd>佐川急便' + (p.cool ? '（クール便）' : '') + '</dd>' +
      '</dl>' +
      shareLinks(p) +
      '</div>' +
      '</div>';
    const dialog = $('#product-dialog');
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    history.replaceState(null, '', '#item-' + p.id);
    track('view_item', itemParams(p, firstAvailable));
  }

  function selectedVariant(product) {
    const checked = document.querySelector('#product-dialog input[name="variant"]:checked');
    return checked ? product.variants.find((v) => v.id === checked.value) : product.variants.find((v) => v.stock > 0);
  }

  // ---- お気に入り ----
  function toggleFavorite(id) {
    state.favorites = isFavorite(id) ? state.favorites.filter((f) => f !== id) : state.favorites.concat(id);
    save(FAV_KEY, state.favorites);
    const on = isFavorite(id);
    document.querySelectorAll('[data-fav="' + id + '"]').forEach((b) => b.setAttribute('aria-pressed', on));
    if (on) {
      showToast('お気に入りに追加しました');
      track('add_to_wishlist', itemParams(byId.get(id)));
    }
    renderCounts();
    renderFavorites();
  }

  function renderFavorites() {
    const items = state.favorites.map((id) => byId.get(id));
    $('#favorites-content').innerHTML = items.length
      ? '<ul class="mini-list">' +
        items
          .map(
            (p) =>
              '<li class="mini-item"><button type="button" class="mini-media" data-detail="' + p.id + '" aria-label="' + escapeHtml(plainName(p)) + 'の詳細を見る">' + visual(p, 'fav') + '</button>' +
              '<div class="mini-info"><button type="button" class="mini-name" data-detail="' + p.id + '">' + p.name + '</button>' +
              '<p class="mini-sub">' + statusBadge(p) + ' ' + priceLabel(p) + '</p></div>' +
              favButton(p) + '</li>'
          )
          .join('') +
        '</ul>'
      : '<div class="drawer-empty"><p>お気に入りはまだありません。</p><p class="hint">商品の♡を押すと、ここに保存されます。</p></div>';
  }

  // ---- カート ----
  function setCart(cart) {
    state.cart = Shop.normalizeCart(cart, PRODUCTS);
    save(CART_KEY, state.cart);
    renderCart();
    renderCounts();
  }

  function addToCart(key, qty) {
    const item = Shop.findItem(PRODUCTS, key);
    if (!item) return;
    const limit = Shop.maxQty(item.variant);
    const current = state.cart[key] || 0;
    if (current >= limit) {
      showToast('これ以上追加できません（最大' + limit + '点）');
      return;
    }
    const next = Math.min(limit, current + qty);
    setCart(Object.assign({}, state.cart, { [key]: next }));
    showToast('カートに追加しました');
    track('add_to_cart', itemParams(item.product, item.variant, next - current));
  }

  function renderCounts() {
    const count = Shop.calcTotals(state.cart, PRODUCTS).count;
    document.querySelectorAll('[data-count="cart"]').forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
    });
    document.querySelectorAll('[data-count="favorites"]').forEach((el) => {
      el.textContent = state.favorites.length;
      el.hidden = state.favorites.length === 0;
    });
  }

  function summaryRows(totals) {
    let html = '<dl class="totals">';
    html += '<dt>商品合計（' + totals.count + '点）</dt><dd>' + Shop.formatYen(totals.subtotal) + '</dd>';
    if (totals.shipping === null) {
      html += '<dt>送料（' + totals.parcels + '個口）</dt><dd>' + Shop.formatYen(totals.minShipping) + '〜</dd>';
      html += '<dt class="total">合計（税込）</dt><dd class="total">' + Shop.formatYen(totals.subtotal + totals.minShipping) + '〜</dd>';
    } else {
      html += '<dt>送料（' + totals.zone.label + '・' + totals.parcels + '個口）</dt><dd>' + Shop.formatYen(totals.shipping) + '</dd>';
      html += '<dt class="total">合計（税込）</dt><dd class="total">' + Shop.formatYen(totals.total) + '</dd>';
    }
    return html + '</dl>';
  }

  function renderCart() {
    const totals = Shop.calcTotals(state.cart, PRODUCTS);
    if (totals.lines.length === 0) {
      $('#cart-content').innerHTML = '<div class="drawer-empty"><p>カートに商品はありません。</p><button type="button" class="btn btn-outline" data-close>買い物を続ける</button></div>';
      return;
    }
    const items = totals.lines
      .map(({ key, product: p, variant: v, qty, lineTotal }) => {
        const reserve = Shop.availability(p, month).status === 'reserve';
        return (
          '<li class="mini-item">' +
          '<button type="button" class="mini-media" data-detail="' + p.id + '" aria-label="' + escapeHtml(plainName(p)) + 'の詳細を見る">' + visual(p, 'cart') + '</button>' +
          '<div class="mini-info">' +
          '<p class="mini-name">' + p.name + '</p>' +
          '<p class="mini-sub">' + v.label + (reserve ? ' <span class="status status-reserve">予約</span>' : '') + '</p>' +
          '<div class="qty" role="group" aria-label="' + escapeHtml(plainName(p)) + 'の数量">' +
          '<button type="button" data-dec="' + key + '" aria-label="1つ減らす">−</button><span>' + qty + '</span>' +
          '<button type="button" data-inc="' + key + '" aria-label="1つ増やす"' + (qty >= Shop.maxQty(v) ? ' disabled' : '') + '>＋</button>' +
          '</div></div>' +
          '<div class="mini-right"><p class="mini-price">' + Shop.formatYen(lineTotal) + '</p>' +
          '<button type="button" class="link-button" data-remove="' + key + '">削除</button></div>' +
          '</li>'
        );
      })
      .join('');
    $('#cart-content').innerHTML =
      '<ul class="mini-list">' + items + '</ul>' +
      '<div class="drawer-footer">' +
      summaryRows(totals) +
      '<p class="hint">2箱まで1個口でお送りします。送料はお届け先の入力後に確定します。</p>' +
      '<button type="button" class="btn btn-primary btn-block" id="go-checkout">ご注文手続きへ</button>' +
      '</div>';
  }

  // ---- ご注文の申し込み ----
  function setupCheckoutForm() {
    $('#f-prefecture').innerHTML = '<option value="">選択してください</option>' + Shop.PREFECTURES.map((p) => '<option>' + p + '</option>').join('');
    $('#f-time').innerHTML = Shop.TIME_SLOTS.map((t) => '<option>' + t + '</option>').join('');
    $('#payment-options').innerHTML = Object.entries(Shop.PAYMENTS)
      .map(([value, label]) => '<label class="radio"><input type="radio" name="payment" value="' + value + '"><span>' + label + '</span></label>')
      .join('');
    const range = Shop.deliveryRange(today);
    $('#f-date').min = range.min;
    $('#f-date').max = range.max;
  }

  function checkoutValues() {
    return Object.fromEntries(new FormData($('#checkout-form')).entries());
  }

  function renderCheckoutSummary() {
    const values = checkoutValues();
    const totals = Shop.calcTotals(state.cart, PRODUCTS, { prefecture: values.prefecture });
    const items = totals.lines
      .map(({ product, variant, qty, lineTotal }) => '<li><span>' + product.name + '<small>' + variant.label + ' × ' + qty + '</small></span><span>' + Shop.formatYen(lineTotal) + '</span></li>')
      .join('');
    $('#checkout-summary').innerHTML = '<ul class="summary-list">' + items + '</ul>' + summaryRows(totals);
    const hasReserve = totals.lines.some((l) => Shop.availability(l.product, month).status === 'reserve');
    const hasNow = totals.lines.some((l) => Shop.availability(l.product, month).status !== 'reserve');
    let hint = '指定がなければ、ご注文確定後1週間以内に発送します。';
    if (hasReserve && !hasNow) hint = '予約商品のみのため、発送時期が近づいたらお届け日をご相談します。';
    else if (hasReserve) hint = '予約商品は指定日に関わらず、発送時期に別便でお届けします。';
    $('#date-hint').textContent = hint;
  }

  function openCheckout() {
    if (Object.keys(state.cart).length === 0) return;
    $('#cart-dialog').close();
    showErrors($('#checkout-form'), {});
    renderCheckoutSummary();
    $('#checkout-dialog').showModal();
    const totals = Shop.calcTotals(state.cart, PRODUCTS);
    track('begin_checkout', { currency: 'JPY', value: totals.subtotal });
  }

  async function submitOrder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = checkoutValues();
    const errors = Shop.validateOrder(values, today);
    showErrors(form, errors);
    if (Object.keys(errors).length) return;

    const totals = Shop.calcTotals(state.cart, PRODUCTS, { prefecture: values.prefecture });
    const orderId = Shop.generateOrderId(today);
    const body = [
      '【申込番号】' + orderId,
      '',
      '■ ご注文内容',
      ...totals.lines.map((l) => '・' + plainName(l.product) + '／' + l.variant.label + ' × ' + l.qty + '　' + Shop.formatYen(l.lineTotal)),
      '商品合計：' + Shop.formatYen(totals.subtotal),
      '送料（' + totals.zone.label + '・' + totals.parcels + '個口）：' + Shop.formatYen(totals.shipping),
      '合計：' + Shop.formatYen(totals.total),
      '',
      '■ お届け先',
      values.name + '（' + values.kana + '）様',
      '〒' + Shop.toHalfWidth(values.postal) + ' ' + values.prefecture + values.address,
      'TEL ' + values.phone + '　MAIL ' + values.email,
      'お届け日：' + (values.deliveryDate || '指定なし') + '　時間帯：' + values.timeSlot,
      'ご希望のお支払い：' + Shop.PAYMENTS[values.payment],
      values.note ? '\n■ ギフト・ご要望\n' + values.note : '',
    ].join('\n');

    const button = form.querySelector('[type=submit]');
    button.disabled = true;
    let result;
    try {
      result = await sendMessage('【ご注文の申し込み】' + orderId + '（' + values.name + ' 様）', body, { kind: 'order', orderId, email: values.email });
    } catch (err) {
      showToast(err.message + '。お手数ですがお電話（' + CONFIG.shop.tel + '）でご連絡ください。');
      button.disabled = false;
      return;
    }
    button.disabled = false;
    track('generate_lead', { lead_type: 'order', currency: 'JPY', value: totals.total, method: result });
    save(ORDERS_KEY, load(ORDERS_KEY, []).concat({ id: orderId, createdAt: new Date().toISOString(), total: totals.total }));

    $('#checkout-dialog').close();
    form.reset();
    setCart({});
    $('#complete-body').innerHTML =
      '<h2 id="complete-title">' + (result === 'sent' ? 'お申し込みを受け付けました' : 'メールを送信して申し込みを完了してください') + '</h2>' +
      '<p>申込番号 <strong>' + escapeHtml(orderId) + '</strong></p>' +
      (result === 'sent'
        ? '<p>在庫と送料を確認のうえ、<strong>' + escapeHtml(values.email) + '</strong> 宛てにお支払い方法をご案内します。</p>'
        : '<p>メールアプリにご注文内容が入力されています。<strong>そのまま送信</strong>すると申し込みが完了します。担当者より、お支払い方法をメールでご案内します。</p>') +
      '<p class="hint">お急ぎの方はお電話でもどうぞ：<a href="tel:' + CONFIG.shop.tel.replace(/-/g, '') + '">' + CONFIG.shop.tel + '</a></p>' +
      '<button type="button" class="btn btn-primary" data-close>買い物を続ける</button>';
    $('#complete-dialog').showModal();
  }

  // ---- 共通 ----
  let toastTimer;
  function showToast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function openFromHash() {
    const m = location.hash.match(/^#item-([\w-]+)$/);
    if (m && byId.has(m[1])) openDetail(m[1]);
  }

  function bindEvents() {
    document.addEventListener('error', handleImageError, true);

    const search = $('#search');
    search.addEventListener('input', () => {
      state.query = search.value;
      renderCatalog();
    });
    $('#search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      $('#items').scrollIntoView({ behavior: 'smooth' });
      if (state.query) track('search', { search_term: state.query });
    });
    $('#sort').addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderCatalog();
    });

    // 詳細画面：サイズを変えたら価格と数量の上限を更新する
    $('#product-dialog').addEventListener('change', (e) => {
      if (e.target.name !== 'variant') return;
      const product = byId.get($('#product-dialog .detail').dataset.product);
      const variant = selectedVariant(product);
      $('#detail-price').innerHTML = Shop.formatYen(variant.price) + '<small>税込</small>';
      $('#detail-qty').innerHTML = qtyOptions(variant);
    });
    $('#product-dialog').addEventListener('close', () => {
      if (location.hash.startsWith('#item-')) history.replaceState(null, '', location.pathname + location.search);
    });
    window.addEventListener('hashchange', openFromHash);

    document.addEventListener('click', (e) => {
      const t = e.target;
      const fav = t.closest('[data-fav]');
      if (fav) return toggleFavorite(fav.dataset.fav);
      const detail = t.closest('[data-detail]');
      if (detail) {
        const drawer = detail.closest('dialog.drawer');
        if (drawer) drawer.close();
        return openDetail(detail.dataset.detail);
      }
      const cat = t.closest('[data-category]');
      if (cat) return setCategory(cat.dataset.category, !cat.classList.contains('chip'));
      const inquiryType = t.closest('[data-inquiry-type]');
      if (inquiryType) {
        const radio = document.querySelector('#inquiry-types input[value="' + inquiryType.dataset.inquiryType + '"]');
        if (radio) radio.checked = true;
      }
      const slide = t.closest('[data-slide]');
      if (slide) {
        window.clearInterval(heroTimer);
        return goToSlide(Number(slide.dataset.slide));
      }
      const thumb = t.closest('[data-thumb]');
      if (thumb) {
        const product = byId.get($('#product-dialog .detail').dataset.product);
        const i = Number(thumb.dataset.thumb);
        $('#detail-main').innerHTML = visual(product, 'detail' + i, i) + (product.badge ? '<span class="badge">' + product.badge + '</span>' : '');
        document.querySelectorAll('[data-thumb]').forEach((b) => b.setAttribute('aria-current', b === thumb ? 'true' : 'false'));
        return;
      }
      const addDetail = t.closest('[data-add-detail]');
      if (addDetail) {
        const product = byId.get(addDetail.dataset.addDetail);
        const variant = selectedVariant(product);
        addToCart(Shop.cartKey(product.id, variant.id), Number($('#detail-qty').value));
        $('#product-dialog').close();
        return;
      }
      const inquire = t.closest('[data-inquire]');
      if (inquire) return inquireAbout(inquire.dataset.inquire);
      const open = t.closest('[data-open]');
      if (open) {
        if (open.dataset.open === 'cart') renderCart();
        else renderFavorites();
        return $('#' + open.dataset.open + '-dialog').showModal();
      }
      if (t.closest('[data-focus-search]')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return search.focus({ preventScroll: true });
      }
      const inc = t.closest('[data-inc]');
      if (inc) return setCart(Object.assign({}, state.cart, { [inc.dataset.inc]: state.cart[inc.dataset.inc] + 1 }));
      const dec = t.closest('[data-dec]');
      if (dec) return setCart(Object.assign({}, state.cart, { [dec.dataset.dec]: state.cart[dec.dataset.dec] - 1 }));
      const remove = t.closest('[data-remove]');
      if (remove) {
        const next = Object.assign({}, state.cart);
        delete next[remove.dataset.remove];
        return setCart(next);
      }
      if (t.closest('#go-checkout')) return openCheckout();
      const copy = t.closest('[data-copy]');
      if (copy) {
        const done = () => showToast('リンクをコピーしました');
        if (navigator.clipboard) navigator.clipboard.writeText(copy.dataset.copy).then(done, () => showToast(copy.dataset.copy));
        else showToast(copy.dataset.copy);
        track('share', { method: 'copy', item_id: $('#product-dialog .detail').dataset.product });
        return;
      }
      // 計測のみ（リンクの動作はそのまま）
      const share = t.closest('[data-share]');
      if (share) track('share', { method: share.dataset.share, item_id: $('#product-dialog .detail').dataset.product });
      const sns = t.closest('[data-sns]');
      if (sns) track('click_sns', { sns: sns.dataset.sns });
      const store = t.closest('[data-store]');
      if (store) track('click_store', { item_id: store.dataset.store });
      const tracked = t.closest('[data-track]');
      if (tracked) track(tracked.dataset.track);
      const close = t.closest('[data-close]');
      if (close) return close.closest('dialog').close();
    });

    // ダイアログの外側（背景）をクリックしたら閉じる
    document.querySelectorAll('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    });

    $('#inquiry-form').addEventListener('submit', submitInquiry);
    const checkout = $('#checkout-form');
    checkout.addEventListener('submit', submitOrder);
    checkout.addEventListener('change', renderCheckoutSummary);
    // エラーが出ている項目は、入力し直したらその場で再チェックする
    [checkout, $('#inquiry-form')].forEach((form) => {
      form.addEventListener('input', () => {
        const shown = Array.from(form.querySelectorAll('[data-error-for]')).filter((el) => el.textContent);
        if (shown.length === 0) return;
        const values = Object.fromEntries(new FormData(form).entries());
        const errors = form === checkout ? Shop.validateOrder(values, today) : Shop.validateInquiry(values);
        shown.forEach((el) => {
          const key = el.dataset.errorFor;
          if (!errors[key]) {
            el.textContent = '';
            if (form.elements[key] && form.elements[key].setAttribute) form.elements[key].setAttribute('aria-invalid', 'false');
          }
        });
      });
    });

    // 他のタブでカートやお気に入りが変わったら反映する
    window.addEventListener('storage', (e) => {
      if (e.key === CART_KEY) state.cart = Shop.normalizeCart(load(CART_KEY, {}), PRODUCTS);
      if (e.key === FAV_KEY) state.favorites = (load(FAV_KEY, []) || []).filter((id) => byId.has(id));
      renderCounts();
    });
  }

  initAnalytics();
  bindEvents();
  renderCategoryNav();
  renderHero();
  renderCatalog();
  renderAbout();
  renderCalendar();
  renderShippingTable();
  renderSns();
  renderFaq();
  renderContact();
  renderShopInfo();
  renderCounts();
  setupCheckoutForm();
  openFromHash();
})();
