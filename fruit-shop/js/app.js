// 画面の描画とイベント処理。
(function () {
  const { PRODUCTS, CATEGORIES, HERO_PHOTOS } = window.ShopData;
  const Shop = window.Shop;
  const CART_KEY = 'musubi-cart';
  const ORDERS_KEY = 'musubi-orders';
  const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
  const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

  const today = new Date();
  const month = today.getMonth() + 1;

  const state = {
    category: 'all',
    query: '',
    inSeasonOnly: false,
    sort: 'recommended',
    cart: Shop.normalizeCart(load(CART_KEY, {}), PRODUCTS),
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
      // 保存できなくても画面上のカートはそのまま使える
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  // 商品写真。読み込めなかったときはイラストに差し替える（下の error リスナー）。
  function visual(product, scope) {
    if (!product.photo) return window.illustration(product, scope);
    return (
      '<img class="photo" src="' + product.photo + '" alt="' + escapeHtml(product.name) + '" loading="lazy" decoding="async"' +
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

  // 今月から旬の始まりまで何か月あるか（旬の最中なら0）
  function monthsUntilSeason(product) {
    if (Shop.isInSeason(product, month)) return 0;
    return (product.season.from - month + 12) % 12;
  }

  // ---- 商品一覧 ----
  function renderFilters() {
    $('#category-filter').innerHTML = CATEGORIES.map(
      (c) =>
        '<button type="button" class="chip" data-category="' + c.id + '" aria-pressed="' + (state.category === c.id) + '">' +
        c.label +
        '</button>'
    ).join('');
  }

  function filteredProducts() {
    const q = state.query.trim().toLowerCase();
    const list = PRODUCTS.filter((p) => {
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (state.inSeasonOnly && !['available', 'low'].includes(Shop.availability(p, month).status)) return false;
      if (!q) return true;
      return [p.name, p.origin, CATEGORY_LABEL[p.category], p.description].some((t) => t.toLowerCase().includes(q));
    });
    const sorters = {
      recommended: () => 0,
      'price-asc': (a, b) => Shop.minPrice(a) - Shop.minPrice(b),
      'price-desc': (a, b) => Shop.minPrice(b) - Shop.minPrice(a),
      season: (a, b) => monthsUntilSeason(a) - monthsUntilSeason(b),
    };
    // 売り切れは常に後ろへ
    const soldOut = (p) => (Shop.availability(p, month).status === 'soldout' ? 1 : 0);
    return list.slice().sort((a, b) => soldOut(a) - soldOut(b) || sorters[state.sort](a, b));
  }

  function renderProducts() {
    const list = filteredProducts();
    $('#result-count').textContent = list.length + '件の商品';
    if (list.length === 0) {
      $('#product-grid').innerHTML = '<li class="empty">条件に合う商品が見つかりませんでした。</li>';
      return;
    }
    $('#product-grid').innerHTML = list
      .map((p) => {
        const status = Shop.availability(p, month).status;
        const single = p.variants.length === 1;
        let action;
        if (status === 'soldout') {
          action = '<button type="button" class="btn btn-small btn-ghost" disabled>売り切れ</button>';
        } else if (single) {
          action = '<button type="button" class="btn btn-primary btn-small" data-add="' + Shop.cartKey(p.id, p.variants[0].id) + '">カートに入れる</button>';
        } else {
          action = '<button type="button" class="btn btn-primary btn-small" data-detail="' + p.id + '">サイズを選ぶ</button>';
        }
        const size = single ? p.variants[0].label : p.variants.map((v) => v.label.split('（')[0]).join(' / ');
        return (
          '<li class="product-card' + (status === 'soldout' ? ' is-soldout' : '') + '">' +
          '<button type="button" class="product-link" data-detail="' + p.id + '" aria-label="' + escapeHtml(p.name) + 'の詳細を見る">' +
          '<span class="product-art">' + visual(p, 'card') +
          (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') +
          '</span>' +
          '</button>' +
          '<div class="product-info">' +
          '<div class="product-meta">' + statusBadge(p) + '<span>' + p.origin + '</span></div>' +
          '<h3>' + p.name + '</h3>' +
          '<p class="product-size">' + size + '<br>発送 ' + p.shipping + '</p>' +
          '<div class="product-bottom">' +
          '<p class="price">' + priceLabel(p) + '<small>税込</small></p>' +
          action +
          '</div>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');
  }

  // ---- 旬カレンダー ----
  function renderCalendar() {
    let head = '<thead><tr><th scope="col">品目</th>';
    for (let m = 1; m <= 12; m++) {
      head += '<th scope="col"' + (m === month ? ' class="current"' : '') + '>' + m + '月</th>';
    }
    head += '</tr></thead>';
    const rows = PRODUCTS.filter((p) => p.category !== 'set')
      .map((p) => {
        let cells = '';
        for (let m = 1; m <= 12; m++) {
          const on = Shop.isInSeason(p, m);
          cells +=
            '<td class="' + (on ? 'on cal-' + p.category : '') + (m === month ? ' current' : '') + '">' +
            (on ? '<span class="visually-hidden">旬</span>' : '') +
            '</td>';
        }
        return '<tr><th scope="row">' + p.name.replace(/【.*?】/g, '') + '</th>' + cells + '</tr>';
      })
      .join('');
    $('#season-calendar').innerHTML = '<caption class="visually-hidden">品目ごとの旬の時期</caption>' + head + '<tbody>' + rows + '</tbody>';
  }

  // ---- 商品詳細 ----
  function qtyOptions(variant) {
    let html = '';
    for (let i = 1; i <= Shop.maxQty(variant); i++) html += '<option value="' + i + '">' + i + '</option>';
    return html;
  }

  function openDetail(id) {
    const p = byId.get(id);
    if (!p) return;
    const a = Shop.availability(p, month);
    const firstAvailable = p.variants.find((v) => v.stock > 0);
    let note = '';
    if (a.status === 'reserve') note = '<p class="notice">ただいま予約受付中です。' + p.shipping + 'に順次発送します。</p>';
    if (a.status === 'soldout') note = '<p class="notice">今季の販売は終了しました。次のシーズンをお楽しみに。</p>';

    const variantPicker =
      p.variants.length > 1
        ? '<fieldset class="variant-picker"><legend>サイズ</legend>' +
          p.variants
            .map(
              (v) =>
                '<label class="variant' + (v.stock <= 0 ? ' is-disabled' : '') + '">' +
                '<input type="radio" name="variant" value="' + v.id + '"' +
                (v === firstAvailable ? ' checked' : '') + (v.stock <= 0 ? ' disabled' : '') + '>' +
                '<span class="variant-label">' + v.label + '</span>' +
                '<span class="variant-price">' + (v.stock <= 0 ? '売り切れ' : Shop.formatYen(v.price)) + '</span>' +
                '</label>'
            )
            .join('') +
          '</fieldset>'
        : '';

    $('#product-dialog-body').innerHTML =
      '<div class="modal-head"><span></span><button class="icon-button" type="button" data-close aria-label="閉じる">×</button></div>' +
      '<div class="detail">' +
      '<div class="detail-art">' + visual(p, 'detail') + '</div>' +
      '<div class="detail-info">' +
      '<div class="product-meta">' + statusBadge(p) + '<span>' + CATEGORY_LABEL[p.category] + '</span></div>' +
      '<h2 id="product-dialog-title">' + p.name + '</h2>' +
      '<p class="price price-large" id="detail-price">' +
      Shop.formatYen((firstAvailable || p.variants[0]).price) + '<small>税込</small></p>' +
      '<p>' + p.description + '</p>' +
      '<dl class="spec">' +
      (p.variants.length === 1 ? '<dt>内容量</dt><dd>' + p.variants[0].label + '</dd>' : '') +
      '<dt>産地</dt><dd>' + p.origin + '</dd>' +
      '<dt>発送目安</dt><dd>' + p.shipping + '<br><small>天候等の事情により前後する場合があります</small></dd>' +
      '<dt>配送</dt><dd>' + (p.cool ? 'クール便（冷蔵）' : '常温便') + '</dd>' +
      '</dl>' +
      note +
      (firstAvailable
        ? variantPicker +
          '<div class="detail-actions">' +
          '<label class="select"><span>数量</span><select id="detail-qty">' + qtyOptions(firstAvailable) + '</select></label>' +
          '<button type="button" class="btn btn-primary" data-add-detail="' + p.id + '">カートに入れる</button>' +
          '</div>'
        : '') +
      '</div>' +
      '</div>';
    $('#product-dialog').showModal();
  }

  function selectedVariant(product) {
    const checked = document.querySelector('#product-dialog input[name="variant"]:checked');
    return checked ? product.variants.find((v) => v.id === checked.value) : product.variants.find((v) => v.stock > 0);
  }

  // ---- カート ----
  function setCart(cart) {
    state.cart = Shop.normalizeCart(cart, PRODUCTS);
    save(CART_KEY, state.cart);
    renderCart();
  }

  function addToCart(key, qty) {
    const item = Shop.findItem(PRODUCTS, key);
    if (!item) return;
    const limit = Shop.maxQty(item.variant);
    const current = state.cart[key] || 0;
    if (current >= limit) {
      showToast(item.product.name + 'はこれ以上追加できません（最大' + limit + '点）');
      return;
    }
    setCart(Object.assign({}, state.cart, { [key]: Math.min(limit, current + qty) }));
    showToast(item.product.name + 'をカートに追加しました');
  }

  function summaryRows(totals) {
    let html = '<dl class="totals">';
    html += '<dt>小計（' + totals.count + '点）</dt><dd>' + Shop.formatYen(totals.subtotal) + '</dd>';
    html += '<dt>送料</dt><dd>' + (totals.shipping === 0 ? '無料' : Shop.formatYen(totals.shipping)) + '</dd>';
    if (totals.cool) html += '<dt>クール便</dt><dd>' + Shop.formatYen(totals.cool) + '</dd>';
    if (totals.gift) html += '<dt>ギフト包装</dt><dd>' + Shop.formatYen(totals.gift) + '</dd>';
    if (totals.cod) html += '<dt>代引き手数料</dt><dd>' + Shop.formatYen(totals.cod) + '</dd>';
    html += '<dt class="total">合計（税込）</dt><dd class="total">' + Shop.formatYen(totals.total) + '</dd>';
    return html + '</dl>';
  }

  function renderCart() {
    const totals = Shop.calcTotals(state.cart, PRODUCTS);
    $('#cart-count').textContent = totals.count;
    $('#open-cart').setAttribute('aria-label', 'カートを開く（' + totals.count + '点）');

    if (totals.lines.length === 0) {
      $('#cart-content').innerHTML =
        '<div class="cart-empty"><p>カートは空です。</p><button type="button" class="btn btn-ghost" data-close>買い物を続ける</button></div>';
      return;
    }

    const items = totals.lines
      .map(({ key, product: p, variant: v, qty, lineTotal }) => {
        const reserve = Shop.availability(p, month).status === 'reserve';
        return (
          '<li class="cart-item">' +
          '<div class="cart-art">' + visual(p, 'cart') + '</div>' +
          '<div class="cart-info">' +
          '<p class="cart-name">' + p.name + '</p>' +
          '<p class="cart-sub">' + v.label + (reserve ? '｜<span class="status status-reserve">予約</span>' : '') + '</p>' +
          '<div class="qty" role="group" aria-label="' + escapeHtml(p.name) + 'の数量">' +
          '<button type="button" data-dec="' + key + '" aria-label="1つ減らす">−</button>' +
          '<span>' + qty + '</span>' +
          '<button type="button" data-inc="' + key + '" aria-label="1つ増やす"' + (qty >= Shop.maxQty(v) ? ' disabled' : '') + '>＋</button>' +
          '</div>' +
          '</div>' +
          '<div class="cart-right">' +
          '<p class="price">' + Shop.formatYen(lineTotal) + '</p>' +
          '<button type="button" class="link-button" data-remove="' + key + '">削除</button>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');

    const freeNote =
      totals.toFreeShipping > 0
        ? '<p class="free-note">あと<strong>' + Shop.formatYen(totals.toFreeShipping) + '</strong>で送料無料</p>'
        : '<p class="free-note free-ok">送料無料でお届けします</p>';

    $('#cart-content').innerHTML =
      '<ul class="cart-list">' + items + '</ul>' +
      '<div class="cart-footer">' +
      freeNote +
      summaryRows(totals) +
      '<button type="button" class="btn btn-primary btn-block" id="go-checkout">ご注文手続きへ</button>' +
      '</div>';
  }

  // ---- ご注文手続き ----
  function setupCheckoutForm() {
    $('#f-prefecture').innerHTML =
      '<option value="">選択してください</option>' + Shop.PREFECTURES.map((p) => '<option>' + p + '</option>').join('');
    $('#f-time').innerHTML = Shop.TIME_SLOTS.map((t) => '<option>' + t + '</option>').join('');
    $('#payment-options').innerHTML = Object.entries(Shop.PAYMENTS)
      .map(
        ([value, label]) =>
          '<label class="radio"><input type="radio" name="payment" value="' + value + '"><span>' + label +
          (value === 'cod' ? '（手数料 ' + Shop.formatYen(Shop.COD_FEE) + '）' : '') +
          '</span></label>'
      )
      .join('');
    const range = Shop.deliveryRange(today);
    $('#f-date').min = range.min;
    $('#f-date').max = range.max;
    $('#gift-fee').textContent = Shop.formatYen(Shop.GIFT_WRAP_FEE);
  }

  function formValues() {
    const form = $('#checkout-form');
    const data = Object.fromEntries(new FormData(form).entries());
    data.giftWrap = form.elements.giftWrap.checked;
    return data;
  }

  function renderCheckoutSummary() {
    const values = formValues();
    const totals = Shop.calcTotals(state.cart, PRODUCTS, { giftWrap: values.giftWrap, payment: values.payment });
    const items = totals.lines
      .map(
        ({ product, variant, qty, lineTotal }) =>
          '<li><span>' + product.name + '<small>' + variant.label + ' × ' + qty + '</small></span><span>' + Shop.formatYen(lineTotal) + '</span></li>'
      )
      .join('');
    $('#checkout-summary').innerHTML = '<ul class="summary-list">' + items + '</ul>' + summaryRows(totals);

    const hasReserve = totals.lines.some((l) => Shop.availability(l.product, month).status === 'reserve');
    const hasNow = totals.lines.some((l) => Shop.availability(l.product, month).status !== 'reserve');
    let hint = '指定がなければ最短でお届けします。';
    if (hasReserve && !hasNow) hint = '予約商品のみのため、お届け日は発送時期が近づいたらメールでご案内します。';
    else if (hasReserve) hint = '予約商品は指定日に関わらず、発送時期に別便でお届けします。';
    $('#date-hint').textContent = hint;
  }

  function showErrors(errors) {
    document.querySelectorAll('[data-error-for]').forEach((el) => {
      const key = el.dataset.errorFor;
      el.textContent = errors[key] || '';
      const input = $('#checkout-form').elements[key];
      if (input && input.setAttribute) input.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
    });
  }

  function openCheckout() {
    if (Object.keys(state.cart).length === 0) return;
    $('#cart-dialog').close();
    showErrors({});
    renderCheckoutSummary();
    $('#checkout-dialog').showModal();
  }

  function submitOrder(event) {
    event.preventDefault();
    const values = formValues();
    const errors = Shop.validateOrder(values, today);
    showErrors(errors);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const el = $('#checkout-form').elements[firstError];
      const target = el && el.focus ? el : el && el[0];
      if (target) target.focus();
      return;
    }

    const totals = Shop.calcTotals(state.cart, PRODUCTS, { giftWrap: values.giftWrap, payment: values.payment });
    const order = {
      id: Shop.generateOrderId(today),
      createdAt: new Date().toISOString(),
      items: totals.lines.map((l) => ({ key: l.key, name: l.product.name, size: l.variant.label, qty: l.qty, price: l.variant.price })),
      total: totals.total,
      payment: values.payment,
      deliveryDate: values.deliveryDate || null,
      timeSlot: values.timeSlot,
      email: values.email,
    };
    save(ORDERS_KEY, load(ORDERS_KEY, []).concat(order));

    $('#checkout-dialog').close();
    $('#checkout-form').reset();
    setCart({});

    $('#complete-body').innerHTML =
      '<div class="complete-icon" aria-hidden="true">🍇</div>' +
      '<h2 id="complete-title">ご注文ありがとうございました</h2>' +
      '<p>ご注文番号 <strong>' + escapeHtml(order.id) + '</strong></p>' +
      '<p>確認メールを <strong>' + escapeHtml(order.email) + '</strong> にお送りしました（デモのため実際には送信されません）。</p>' +
      '<dl class="spec">' +
      '<dt>お支払い</dt><dd>' + escapeHtml(Shop.PAYMENTS[order.payment]) + '</dd>' +
      '<dt>お届け日</dt><dd>' + escapeHtml(order.deliveryDate || '最短') + '（' + escapeHtml(order.timeSlot) + '）</dd>' +
      '<dt>合計金額</dt><dd>' + Shop.formatYen(order.total) + '</dd>' +
      '</dl>' +
      '<button type="button" class="btn btn-primary" data-close>トップに戻る</button>';
    $('#complete-dialog').showModal();
  }

  // ---- トップのスライド写真 ----
  function renderHero() {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = $('#hero-art');
    el.innerHTML = HERO_PHOTOS.map(
      (src, i) => '<img class="hero-photo' + (i === 0 ? ' active' : '') + '" src="' + src + '" alt="" data-hero' + (i > 0 ? ' loading="lazy"' : '') + '>'
    ).join('');
    if (reduceMotion) return;
    let index = 0;
    setInterval(() => {
      const photos = el.querySelectorAll('.hero-photo');
      if (photos.length < 2) return;
      photos[index % photos.length].classList.remove('active');
      index = (index + 1) % photos.length;
      photos[index].classList.add('active');
    }, 5000);
  }

  function heroFallback() {
    const el = $('#hero-art');
    el.classList.add('hero-art-illustration');
    const picks = ['shine', 'hayward', 'kanikanmusume'].map((id) => byId.get(id));
    el.innerHTML = picks.map((p) => '<div class="hero-fruit">' + window.illustration(p, 'hero') + '</div>').join('');
  }

  // 画像の読み込みに失敗したらイラストに差し替える（error はバブリングしないので capture で拾う）
  function handleImageError(e) {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.fallback) {
      const product = byId.get(img.dataset.fallback);
      if (product) img.outerHTML = window.illustration(product, img.dataset.scope);
    } else if (img.hasAttribute('data-hero')) {
      const wasActive = img.classList.contains('active');
      const parent = img.parentElement;
      img.remove();
      const rest = parent.querySelectorAll('.hero-photo');
      if (rest.length === 0) heroFallback();
      else if (wasActive) rest[0].classList.add('active');
    }
  }

  // ---- 共通 ----
  let toastTimer;
  function showToast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function renderStatic() {
    const inSeason = PRODUCTS.filter((p) => p.category !== 'set' && Shop.isInSeason(p, month));
    const reserve = PRODUCTS.filter((p) => Shop.availability(p, month).status === 'reserve');
    let note = inSeason.length ? month + '月の旬：' + inSeason.map((p) => p.name).join('、') : '';
    if (reserve.length) note += (note ? '　' : '') + '予約受付中：' + reserve.map((p) => p.name.replace(/【.*?】/g, '')).join('、');
    $('#season-note').textContent = note;
    $('#guide-shipping').textContent = Shop.formatYen(Shop.SHIPPING_FEE);
    $('#guide-free').textContent = Shop.formatYen(Shop.FREE_SHIPPING_THRESHOLD);
    $('#guide-cool').textContent = Shop.formatYen(Shop.COOL_FEE);
    $('#guide-cod').textContent = Shop.formatYen(Shop.COD_FEE);
    $('#guide-gift').textContent = Shop.formatYen(Shop.GIFT_WRAP_FEE);
  }

  function bindEvents() {
    document.addEventListener('error', handleImageError, true);

    $('#category-filter').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-category]');
      if (!btn) return;
      state.category = btn.dataset.category;
      renderFilters();
      renderProducts();
    });
    $('#search').addEventListener('input', (e) => {
      state.query = e.target.value;
      renderProducts();
    });
    $('#in-season-only').addEventListener('change', (e) => {
      state.inSeasonOnly = e.target.checked;
      renderProducts();
    });
    $('#sort').addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderProducts();
    });

    // 詳細画面でサイズを変えたら価格と数量の上限を更新する
    $('#product-dialog').addEventListener('change', (e) => {
      if (e.target.name !== 'variant') return;
      const btn = $('#product-dialog [data-add-detail]');
      const product = byId.get(btn.dataset.addDetail);
      const variant = selectedVariant(product);
      $('#detail-price').innerHTML = Shop.formatYen(variant.price) + '<small>税込</small>';
      $('#detail-qty').innerHTML = qtyOptions(variant);
    });

    document.addEventListener('click', (e) => {
      const t = e.target;
      const add = t.closest('[data-add]');
      if (add) return addToCart(add.dataset.add, 1);
      const detail = t.closest('[data-detail]');
      if (detail) return openDetail(detail.dataset.detail);
      const addDetail = t.closest('[data-add-detail]');
      if (addDetail) {
        const product = byId.get(addDetail.dataset.addDetail);
        const variant = selectedVariant(product);
        addToCart(Shop.cartKey(product.id, variant.id), Number($('#detail-qty').value));
        $('#product-dialog').close();
        return;
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
      const close = t.closest('[data-close]');
      if (close) return close.closest('dialog').close();
    });

    // ダイアログの外側（背景）をクリックしたら閉じる
    document.querySelectorAll('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    });

    $('#open-cart').addEventListener('click', () => {
      renderCart();
      $('#cart-dialog').showModal();
    });

    const form = $('#checkout-form');
    form.addEventListener('submit', submitOrder);
    form.addEventListener('change', renderCheckoutSummary);
    // エラーが出ている項目は、入力し直したらその場で再チェックする
    form.addEventListener('input', () => {
      const shown = {};
      document.querySelectorAll('[data-error-for]').forEach((el) => {
        if (el.textContent) shown[el.dataset.errorFor] = true;
      });
      if (Object.keys(shown).length === 0) return;
      const errors = Shop.validateOrder(formValues(), today);
      const remaining = {};
      Object.keys(shown).forEach((key) => {
        if (errors[key]) remaining[key] = errors[key];
      });
      showErrors(remaining);
    });

    // 他のタブでカートが変わったら反映する
    window.addEventListener('storage', (e) => {
      if (e.key === CART_KEY) {
        state.cart = Shop.normalizeCart(load(CART_KEY, {}), PRODUCTS);
        renderCart();
      }
    });
  }

  bindEvents();
  renderStatic();
  renderHero();
  renderFilters();
  renderProducts();
  renderCalendar();
  renderCart();
  setupCheckoutForm();
})();
