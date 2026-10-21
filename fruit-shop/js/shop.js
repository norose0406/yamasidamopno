// 画面に依存しないロジック（価格計算・旬の判定・入力チェック）。
// ブラウザでは window.Shop、Node では require で読み込める。
// 送料・支払い方法は mb-musubi.net の「特定商取引法に基づく表記」に合わせている。
(function (root) {
  const MAX_QTY = 10;
  const LOW_STOCK = 5;
  const DELIVERY_MIN_DAYS = 3;
  const DELIVERY_MAX_DAYS = 30;
  // 同じ住所へは2箱まで重ねて1個口で送れる。3箱以上は個口が増える。
  const BOXES_PER_PARCEL = 2;

  // 佐川急便・1個口あたりの送料（税込）
  const SHIPPING_ZONES = [
    { label: '北海道', fee: 1540, prefectures: ['北海道'] },
    { label: '東北', fee: 1210, prefectures: ['青森県', '岩手県', '秋田県', '宮城県', '山形県', '福島県'] },
    { label: '関東', fee: 1100, prefectures: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
    { label: '中部', fee: 1100, prefectures: ['新潟県', '福井県', '石川県', '富山県', '静岡県', '山梨県', '長野県', '愛知県', '岐阜県'] },
    { label: '近畿', fee: 1100, prefectures: ['三重県', '和歌山県', '滋賀県', '奈良県', '京都府', '大阪府', '兵庫県'] },
    { label: '中国', fee: 1210, prefectures: ['岡山県', '広島県', '鳥取県', '島根県', '山口県'] },
    { label: '四国', fee: 1210, prefectures: ['香川県', '徳島県', '愛媛県', '高知県'] },
    { label: '九州', fee: 1540, prefectures: ['福岡県', '佐賀県', '長崎県', '大分県', '熊本県', '宮崎県', '鹿児島県'] },
    { label: '沖縄・離島', fee: 1540, prefectures: ['沖縄県'] },
  ];
  const MIN_SHIPPING_FEE = Math.min(...SHIPPING_ZONES.map((z) => z.fee));

  const PAYMENTS = {
    bank: '銀行振込（前払い）',
    card: 'クレジットカード',
    amazon: 'Amazon Pay',
  };

  const TIME_SLOTS = ['指定なし', '午前中', '14〜16時', '16〜18時', '18〜20時', '19〜21時'];

  const INQUIRY_TYPES = ['商品・発送について', 'ギフト・のし', '法人・大口のご注文', '予約について', 'その他'];

  const PREFECTURES = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
  ];

  function formatYen(n) {
    return '¥' + Math.round(n).toLocaleString('ja-JP');
  }

  function isInSeason(product, month) {
    const { from, to } = product.season;
    return from <= to ? month >= from && month <= to : month >= from || month <= to;
  }

  function seasonLabel(product) {
    const { from, to } = product.season;
    if (from === 1 && to === 12) return '通年';
    if (from === to) return from + '月';
    return from + '月〜' + to + '月';
  }

  // カートのキーは「商品ID:サイズID」
  function cartKey(productId, variantId) {
    return productId + ':' + variantId;
  }

  function findItem(products, key) {
    const [productId, variantId] = String(key).split(':');
    const product = products.find((p) => p.id === productId);
    const variant = product && product.variants.find((v) => v.id === variantId);
    return variant ? { product, variant } : null;
  }

  function minPrice(product) {
    return Math.min(...product.variants.map((v) => v.price));
  }

  function totalStock(product) {
    return product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  }

  // 売り切れ → 旬以外は「予約受付中」 → 在庫が少なければ「残りわずか」 → 「販売中」
  function availability(product, month) {
    if (totalStock(product) <= 0) return { status: 'soldout', label: '売り切れ' };
    if (!isInSeason(product, month)) return { status: 'reserve', label: '予約受付中' };
    if (product.variants.some((v) => v.stock > 0 && v.stock <= LOW_STOCK)) return { status: 'low', label: '残りわずか' };
    return { status: 'available', label: '販売中' };
  }

  function maxQty(variant) {
    return Math.max(0, Math.min(MAX_QTY, variant.stock));
  }

  // 保存されていたカートを現在の商品データに合わせて整える。
  function normalizeCart(cart, products) {
    const result = {};
    if (!cart || typeof cart !== 'object') return result;
    for (const [key, raw] of Object.entries(cart)) {
      const item = findItem(products, key);
      const qty = Math.floor(Number(raw));
      if (!item || !Number.isFinite(qty) || qty <= 0) continue;
      const limit = maxQty(item.variant);
      if (limit > 0) result[key] = Math.min(qty, limit);
    }
    return result;
  }

  function shippingZone(prefecture) {
    return SHIPPING_ZONES.find((z) => z.prefectures.includes(prefecture)) || null;
  }

  function parcelCount(boxes) {
    return Math.ceil(boxes / BOXES_PER_PARCEL);
  }

  // 1点＝1箱として計算する。お届け先（都道府県）が未定のときは shipping を null にする。
  function calcTotals(cart, products, options) {
    const opts = Object.assign({ prefecture: null }, options);
    const lines = [];
    let subtotal = 0;
    let count = 0;
    for (const [key, qty] of Object.entries(cart)) {
      const item = findItem(products, key);
      if (!item || qty <= 0) continue;
      const lineTotal = item.variant.price * qty;
      lines.push({ key, product: item.product, variant: item.variant, qty, lineTotal });
      subtotal += lineTotal;
      count += qty;
    }
    const parcels = parcelCount(count);
    const zone = shippingZone(opts.prefecture);
    let shipping = 0;
    if (count > 0) shipping = zone ? zone.fee * parcels : null;
    return {
      lines,
      count,
      subtotal,
      parcels,
      zone,
      shipping,
      minShipping: count > 0 ? MIN_SHIPPING_FEE * parcels : 0,
      total: subtotal + (shipping || 0),
    };
  }

  // 全角の数字・ハイフンを半角にそろえ、前後の空白を取り除く。
  function toHalfWidth(value) {
    return String(value == null ? '' : value)
      .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/[－ー−‐―]/g, '-')
      .trim();
  }

  function toDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function deliveryRange(today) {
    const min = new Date(today.getFullYear(), today.getMonth(), today.getDate() + DELIVERY_MIN_DAYS);
    const max = new Date(today.getFullYear(), today.getMonth(), today.getDate() + DELIVERY_MAX_DAYS);
    return { min: toDateString(min), max: toDateString(max) };
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isValidPhone(value) {
    const phone = toHalfWidth(value);
    return /^[\d-]+$/.test(phone) && /^0\d{9,10}$/.test(phone.replace(/-/g, ''));
  }

  function validateOrder(form, today) {
    const errors = {};
    const name = String(form.name || '').trim();
    const kana = String(form.kana || '').trim();
    const postal = toHalfWidth(form.postal);
    const email = String(form.email || '').trim();
    const address = String(form.address || '').trim();

    if (!name) errors.name = 'お名前を入力してください';
    if (!kana) errors.kana = 'フリガナを入力してください';
    else if (!/^[ァ-ヶー\s　]+$/.test(kana)) errors.kana = 'フリガナは全角カタカナで入力してください';
    if (!/^\d{3}-?\d{4}$/.test(postal)) errors.postal = '郵便番号は7桁（例: 400-0046）で入力してください';
    if (!PREFECTURES.includes(form.prefecture)) errors.prefecture = '都道府県を選択してください';
    if (!address) errors.address = '住所を入力してください';
    if (!isValidPhone(form.phone)) errors.phone = '電話番号は0から始まる10〜11桁で入力してください';
    if (!EMAIL_RE.test(email)) errors.email = 'メールアドレスの形式が正しくありません';
    if (form.deliveryDate) {
      const { min, max } = deliveryRange(today);
      if (form.deliveryDate < min || form.deliveryDate > max) {
        errors.deliveryDate = 'お届け日は' + min + '〜' + max + 'の間で選択してください';
      }
    }
    if (form.timeSlot && !TIME_SLOTS.includes(form.timeSlot)) errors.timeSlot = '時間帯を選択してください';
    if (!Object.prototype.hasOwnProperty.call(PAYMENTS, form.payment)) errors.payment = 'お支払い方法を選択してください';
    return errors;
  }

  function validateInquiry(form) {
    const errors = {};
    if (!INQUIRY_TYPES.includes(form.type)) errors.type = 'お問い合わせの種類を選択してください';
    if (!String(form.name || '').trim()) errors.name = 'お名前を入力してください';
    if (!EMAIL_RE.test(String(form.email || '').trim())) errors.email = 'メールアドレスの形式が正しくありません';
    if (String(form.phone || '').trim() && !isValidPhone(form.phone)) errors.phone = '電話番号は0から始まる10〜11桁で入力してください';
    const message = String(form.message || '').trim();
    if (!message) errors.message = 'お問い合わせ内容を入力してください';
    else if (message.length > 2000) errors.message = 'お問い合わせ内容は2000文字以内で入力してください';
    return errors;
  }

  function generateOrderId(date, random) {
    const rand = typeof random === 'number' ? random : Math.random();
    const suffix = String(Math.floor(rand * 10000)).padStart(4, '0');
    return 'MS-' + toDateString(date).replace(/-/g, '') + '-' + suffix;
  }

  const api = {
    MAX_QTY,
    BOXES_PER_PARCEL,
    SHIPPING_ZONES,
    MIN_SHIPPING_FEE,
    PAYMENTS,
    TIME_SLOTS,
    INQUIRY_TYPES,
    PREFECTURES,
    formatYen,
    isInSeason,
    seasonLabel,
    cartKey,
    findItem,
    minPrice,
    availability,
    maxQty,
    normalizeCart,
    shippingZone,
    parcelCount,
    calcTotals,
    toHalfWidth,
    deliveryRange,
    validateOrder,
    validateInquiry,
    generateOrderId,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Shop = api;
})(typeof self !== 'undefined' ? self : this);
