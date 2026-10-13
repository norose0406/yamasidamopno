// 画面の描画とイベント処理。
(function () {
  const { PRODUCTS, CATEGORIES } = window.ShopData;
  const Shop = window.Shop;
  const CART_KEY = 'kai-fruit-cart';
  const ORDERS_KEY = 'kai-fruit-orders';
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

  function statusBadge(product) {
    const a = Shop.availability(product, month);
    return '<span class="status status-' + a.status + '">' + a.label + '</span>';
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
      if (state.inSeasonOnly && Shop.availability(p, month).status === 'reserve') return false;
      if (!q) return true;
      return [p.name, p.origin, CATEGORY_LABEL[p.category], p.description].some((t) => t.toLowerCase().includes(q));
    });
    const sorters = {
      recommended: () => 0,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      season: (a, b) => monthsUntilSeason(a) - monthsUntilSeason(b),
    };
    return list.slice().sort(sorters[state.sort]);
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
        const soldOut = Shop.maxQty(p) === 0;
        return (
          '<li class="product-card">' +
          '<button type="button" class="product-link" data-detail="' + p.id + '" aria-label="' + p.name + 'の詳細を見る">' +
          '<span class="product-art">' + window.illustration(p, 'card') +
          (p.badge ? '<span class="badge">' + p.badge + '</span>' : '') +
          '</span>' +
          '</button>' +
          '<div class="product-info">' +
          '<div class="product-meta">' + statusBadge(p) + '<span>' + p.origin + '産</span></div>' +
          '<h3>' + p.name + '</h3>' +
          '<p class="product-size">' + p.size + '｜旬 ' + Shop.seasonLabel(p) + '</p>' +
          '<div class="product-bottom">' +
          '<p class="price">' + Shop.formatYen(p.price) + '<small>税込</small></p>' +
          '<button type="button" class="btn btn-primary btn-small" data-add="' + p.id + '"' + (soldOut ? ' disabled' : '') + '>' +
          (soldOut ? '売り切れ' : 'カートに入れる') +
          '</button>' +
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
    const rows = PRODUCTS.filter((p) => p.category !== 'processed')
      .map((p) => {
        let cells = '';
        for (let m = 1; m <= 12; m++) {
          const on = Shop.isInSeason(p, m);
          cells +=
            '<td class="' + (on ? 'on cal-' + p.category : '') + (m === month ? ' current' : '') + '">' +
            (on ? '<span class="visually-hidden">旬</span>' : '') +
            '</td>';
        }
        return '<tr><th scope="row">' + p.name + '</th>' + cells + '</tr>';
      })
      .join('');
    $('#season-calendar').innerHTML = '<caption class="visually-hidden">品目ごとの旬の時期</caption>' + head + '<tbody>' + rows + '</tbody>';
  }

  // ---- 商品詳細 ----
  function openDetail(id) {
    const p = byId.get(id);
    if (!p) return;
    const a = Shop.availability(p, month);
    const limit = Shop.maxQty(p);
    const note =
      a.status === 'reserve'
        ? '<p class="notice">ただいま予約受付中です。' + Shop.seasonLabel(p) + 'の収穫にあわせて順次発送します。</p>'
        : '';
    let options = '';
    for (let i = 1; i <= limit; i++) options += '<option value="' + i + '">' + i + '</option>';
    $('#product-dialog-body').innerHTML =
      '<div class="modal-head"><span></span><button class="icon-button" type="button" data-close aria-label="閉じる">×</button></div>' +
      '<div class="detail">' +
      '<div class="detail-art">' + window.illustration(p, 'detail') + '</div>' +
      '<div class="detail-info">' +
      '<div class="product-meta">' + statusBadge(p) + '<span>' + CATEGORY_LABEL[p.category] + '</span></div>' +
      '<h2 id="product-dialog-title">' + p.name + '</h2>' +
      '<p class="price price-large">' + Shop.formatYen(p.price) + '<small>税込</small></p>' +
      '<p>' + p.description + '</p>' +
      '<dl class="spec">' +
      '<dt>内容量</dt><dd>' + p.size + '</dd>' +
      '<dt>産地</dt><dd>山梨県' + p.origin + '</dd>' +
      '<dt>旬の時期</dt><dd>' + Shop.seasonLabel(p) + '</dd>' +
      '<dt>配送</dt><dd>' + (p.cool ? 'クール便（冷蔵）' : '常温便') + '</dd>' +
      '</dl>' +
      note +
      (limit > 0
        ? '<div class="detail-actions">' +
          '<label class="select"><span>数量</span><select id="detail-qty">' + options + '</select></label>' +
          '<button type="button" class="btn btn-primary" data-add-detail="' + p.id + '">カートに入れる</button>' +
          '</div>'
        : '<p class="notice">申し訳ありません、売り切れです。</p>') +
      '</div>' +
      '</div>';
    $('#product-dialog').showModal();
  }

  // ---- カート ----
  function setCart(cart) {
    state.cart = Shop.normalizeCart(cart, PRODUCTS);
    save(CART_KEY, state.cart);
    renderCart();
  }

  function addToCart(id, qty) {
    const p = byId.get(id);
    const limit = Shop.maxQty(p);
    const current = state.cart[id] || 0;
    if (current >= limit) {
      showToast(p.name + 'はこれ以上追加できません（最大' + limit + '点）');
      return;
    }
    const next = Math.min(limit, current + qty);
    setCart(Object.assign({}, state.cart, { [id]: next }));
    showToast(p.name + 'をカートに追加しました');
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
      .map(({ product: p, qty, lineTotal }) => {
        const reserve = Shop.availability(p, month).status === 'reserve';
        return (
          '<li class="cart-item">' +
          '<div class="cart-art">' + window.illustration(p, 'cart') + '</div>' +
          '<div class="cart-info">' +
          '<p class="cart-name">' + p.name + '</p>' +
          '<p class="cart-sub">' + p.size + (reserve ? '｜<span class="status status-reserve">予約</span>' : '') + '</p>' +
          '<div class="qty" role="group" aria-label="' + p.name + 'の数量">' +
          '<button type="button" data-dec="' + p.id + '" aria-label="1つ減らす">−</button>' +
          '<span>' + qty + '</span>' +
          '<button type="button" data-inc="' + p.id + '" aria-label="1つ増やす"' + (qty >= Shop.maxQty(p) ? ' disabled' : '') + '>＋</button>' +
          '</div>' +
          '</div>' +
          '<div class="cart-right">' +
          '<p class="price">' + Shop.formatYen(lineTotal) + '</p>' +
          '<button type="button" class="link-button" data-remove="' + p.id + '">削除</button>' +
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
      .map(({ product, qty, lineTotal }) => '<li><span>' + product.name + ' × ' + qty + '</span><span>' + Shop.formatYen(lineTotal) + '</span></li>')
      .join('');
    $('#checkout-summary').innerHTML = '<ul class="summary-list">' + items + '</ul>' + summaryRows(totals);

    const hasReserve = totals.lines.some((l) => Shop.availability(l.product, month).status === 'reserve');
    const hasNow = totals.lines.some((l) => Shop.availability(l.product, month).status !== 'reserve');
    let hint = '指定がなければ最短でお届けします。';
    if (hasReserve && !hasNow) hint = '予約商品のみのため、お届け日は旬の時期に入ってからメールでご案内します。';
    else if (hasReserve) hint = '予約商品は指定日に関わらず、旬の時期に別便で発送します。';
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
      items: totals.lines.map((l) => ({ id: l.product.id, name: l.product.name, qty: l.qty, price: l.product.price })),
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
    const inSeason = PRODUCTS.filter((p) => p.category !== 'processed' && Shop.isInSeason(p, month));
    $('#season-note').textContent = inSeason.length
      ? month + '月の旬：' + inSeason.map((p) => p.name).join('、')
      : month + '月は旬の果物の端境期です。予約商品をお選びください。';
    // 旬の商品を優先し、足りなければ他の商品で3つにする
    const heroItems = inSeason.concat(PRODUCTS.filter((p) => !inSeason.includes(p))).slice(0, 3);
    $('#hero-art').innerHTML = heroItems.map((p) => '<div class="hero-fruit">' + window.illustration(p, 'hero') + '</div>').join('');
    $('#guide-shipping').textContent = Shop.formatYen(Shop.SHIPPING_FEE);
    $('#guide-free').textContent = Shop.formatYen(Shop.FREE_SHIPPING_THRESHOLD);
    $('#guide-cool').textContent = Shop.formatYen(Shop.COOL_FEE);
    $('#guide-cod').textContent = Shop.formatYen(Shop.COD_FEE);
    $('#guide-gift').textContent = Shop.formatYen(Shop.GIFT_WRAP_FEE);
  }

  function bindEvents() {
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

    document.addEventListener('click', (e) => {
      const t = e.target;
      const add = t.closest('[data-add]');
      if (add) return addToCart(add.dataset.add, 1);
      const detail = t.closest('[data-detail]');
      if (detail) return openDetail(detail.dataset.detail);
      const addDetail = t.closest('[data-add-detail]');
      if (addDetail) {
        addToCart(addDetail.dataset.addDetail, Number($('#detail-qty').value));
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

  renderStatic();
  renderFilters();
  renderProducts();
  renderCalendar();
  renderCart();
  setupCheckoutForm();
  bindEvents();
})();
