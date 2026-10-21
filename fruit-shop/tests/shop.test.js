// 実行: node --test fruit-shop/tests/shop.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const Shop = require('../js/shop.js');
const { PRODUCTS } = require('../js/products.js');

const find = (id) => PRODUCTS.find((p) => p.id === id);

const validForm = {
  name: '山梨 花子',
  kana: 'ヤマナシ ハナコ',
  postal: '400-0031',
  prefecture: '山梨県',
  address: '甲府市丸の内1-1-1',
  phone: '055-000-0000',
  email: 'hanako@example.com',
  deliveryDate: '',
  timeSlot: '指定なし',
  payment: 'bank',
};

const validInquiry = {
  type: '法人・大口のご注文',
  name: '山梨 花子',
  email: 'hanako@example.com',
  phone: '',
  message: 'キウイを10箱、別々の住所へ送りたいです。',
};

test('商品IDとサイズIDは重複しない', () => {
  const ids = PRODUCTS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of PRODUCTS) {
    const vids = p.variants.map((v) => v.id);
    assert.ok(vids.length > 0, p.id + ' にサイズがない');
    assert.equal(new Set(vids).size, vids.length, p.id);
  }
});

test('formatYen は3桁区切りの円表記にする', () => {
  assert.equal(Shop.formatYen(4860), '¥4,860');
  assert.equal(Shop.formatYen(0), '¥0');
});

test('旬の判定（年をまたぐ場合も含む）', () => {
  assert.equal(Shop.isInSeason(find('shine'), 9), true);
  assert.equal(Shop.isInSeason(find('shine'), 11), false);
  assert.equal(Shop.isInSeason(find('hayward'), 12), true);
  assert.equal(Shop.isInSeason(find('hayward'), 1), true);
  assert.equal(Shop.isInSeason(find('hayward'), 6), false);
  assert.equal(Shop.seasonLabel(find('hayward')), '11月〜2月');
  assert.equal(Shop.seasonLabel(find('gold-rush')), '6月');
});

test('在庫と旬から販売状況を決める', () => {
  assert.equal(Shop.availability(find('kyoho'), 9).status, 'available');
  assert.equal(Shop.availability(find('hayward'), 10).status, 'reserve');
  assert.equal(Shop.availability(find('gold-rush'), 6).status, 'soldout');
  const fewLeft = { ...find('kyoho'), variants: [{ id: '2kg', label: '2kg', price: 6480, stock: 3 }] };
  assert.equal(Shop.availability(fewLeft, 9).status, 'low');
});

test('サイズ違いの最安値とカートのキー', () => {
  assert.equal(Shop.minPrice(find('hayward')), 2700);
  assert.equal(Shop.cartKey('hayward', '6p'), 'hayward:6p');
  const item = Shop.findItem(PRODUCTS, 'hayward:6p');
  assert.equal(item.product.id, 'hayward');
  assert.equal(item.variant.price, 4860);
  assert.equal(Shop.findItem(PRODUCTS, 'hayward:9p'), null);
  assert.equal(Shop.findItem(PRODUCTS, 'nothing'), null);
});

test('normalizeCart は不明な商品・売り切れ・不正な数量を除き、上限で丸める', () => {
  const cart = Shop.normalizeCart(
    { 'kyoho:2kg': 3, 'shine:2kg': 99, 'unknown:2kg': 1, 'gold-rush:2kg': 1, 'hayward:3p': 0, 'gracie:6p': 'abc' },
    PRODUCTS
  );
  assert.deepEqual(cart, { 'kyoho:2kg': 3, 'shine:2kg': Shop.MAX_QTY });
  assert.deepEqual(Shop.normalizeCart(null, PRODUCTS), {});
});

test('送料: お届け先が未定なら最低額からの目安、決まれば地域別に確定', () => {
  const unknown = Shop.calcTotals({ 'hayward:3p': 1 }, PRODUCTS);
  assert.equal(unknown.subtotal, 2700);
  assert.equal(unknown.shipping, null);
  assert.equal(unknown.minShipping, 1100);
  assert.equal(unknown.total, 2700);

  assert.equal(Shop.calcTotals({ 'hayward:3p': 1 }, PRODUCTS, { prefecture: '東京都' }).shipping, 1100);
  assert.equal(Shop.calcTotals({ 'hayward:3p': 1 }, PRODUCTS, { prefecture: '宮城県' }).shipping, 1210);
  assert.equal(Shop.calcTotals({ 'hayward:3p': 1 }, PRODUCTS, { prefecture: '北海道' }).shipping, 1540);
  assert.equal(Shop.calcTotals({ 'hayward:3p': 1 }, PRODUCTS, { prefecture: '沖縄県' }).shipping, 1540);
});

test('全都道府県に送料の地域がある', () => {
  for (const pref of Shop.PREFECTURES) assert.ok(Shop.shippingZone(pref), pref);
});

test('2箱まで1個口、3箱以上は個口が増える', () => {
  assert.equal(Shop.parcelCount(1), 1);
  assert.equal(Shop.parcelCount(2), 1);
  assert.equal(Shop.parcelCount(3), 2);
  assert.equal(Shop.parcelCount(5), 3);
  const t = Shop.calcTotals({ 'shine:2kg': 2, 'kyoho:2kg': 1 }, PRODUCTS, { prefecture: '神奈川県' });
  assert.equal(t.count, 3);
  assert.equal(t.parcels, 2);
  assert.equal(t.shipping, 2200);
  assert.equal(t.total, 7020 * 2 + 6480 + 2200);
  assert.equal(t.lines[0].variant.label, '2kg程度（2〜4房）');
});

test('空のカートは0円', () => {
  const t = Shop.calcTotals({}, PRODUCTS, { prefecture: '東京都' });
  assert.equal(t.total, 0);
  assert.equal(t.shipping, 0);
  assert.equal(t.lines.length, 0);
});

test('お届け日の範囲は3日後〜30日後', () => {
  assert.deepEqual(Shop.deliveryRange(new Date(2026, 9, 13)), { min: '2026-10-16', max: '2026-11-12' });
  assert.deepEqual(Shop.deliveryRange(new Date(2026, 11, 30)), { min: '2027-01-02', max: '2027-01-29' });
});

test('正しい入力ならエラーなし（全角数字も受け付ける）', () => {
  const today = new Date(2026, 9, 13);
  assert.deepEqual(Shop.validateOrder(validForm, today), {});
  assert.deepEqual(
    Shop.validateOrder({ ...validForm, postal: '４００００３１', phone: '０９０−１２３４−５６７８', deliveryDate: '2026-10-20' }, today),
    {}
  );
});

test('不正な入力はフィールドごとにエラーを返す', () => {
  const errors = Shop.validateOrder(
    {
      name: ' ',
      kana: 'やまなし',
      postal: '400',
      prefecture: '',
      address: '',
      phone: '12345',
      email: 'hanako@',
      deliveryDate: '2026-10-14',
      timeSlot: '深夜',
      payment: 'cod',
    },
    new Date(2026, 9, 13)
  );
  assert.deepEqual(Object.keys(errors).sort(), [
    'address', 'deliveryDate', 'email', 'kana', 'name', 'payment', 'phone', 'postal', 'prefecture', 'timeSlot',
  ]);
});

test('問い合わせフォームの入力チェック', () => {
  assert.deepEqual(Shop.validateInquiry(validInquiry), {});
  assert.deepEqual(Shop.validateInquiry({ ...validInquiry, phone: '０９０−１２３４−５６７８' }), {});
  const errors = Shop.validateInquiry({ type: '営業', name: '', email: 'x', phone: '123', message: ' ' });
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'message', 'name', 'phone', 'type']);
  assert.ok(Shop.validateInquiry({ ...validInquiry, message: 'あ'.repeat(2001) }).message);
});

test('支払い方法は銀行振込・クレジットカード・Amazon Pay', () => {
  assert.deepEqual(Object.keys(Shop.PAYMENTS), ['bank', 'card', 'amazon']);
});

test('注文番号は日付入りの形式', () => {
  assert.equal(Shop.generateOrderId(new Date(2026, 9, 13), 0.0421), 'MS-20261013-0421');
});
