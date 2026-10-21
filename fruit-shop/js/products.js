// 商品データ（やまなしだもの 結 musubi の取り扱い商品をもとにしたデモ用データ）。
// 価格はすべて税込。season は旬の月（from〜to）。11月〜2月のように年をまたぐ場合は from > to になる。
// pid は mb-musubi.net（カラーミーショップ）の商品番号。photos の1枚目がメイン写真。
// photos には URL のほか、fruit-shop/ からの相対パス（images/...）も書ける。variants はサイズ違い（2kg / 4kg、3パック / 6パック など）。stock が 0 なら売り切れ。
(function (root) {
  const PHOTO_BASE = 'https://img21.shop-pro.jp/PA01487/307/';
  // 商品写真（メイン＋サブ写真 _o1, _o2 ...）
  const photos = (id, extra) => {
    const list = [PHOTO_BASE + 'product/' + id + '.jpg'];
    for (let i = 1; i <= extra; i++) list.push(PHOTO_BASE + 'product/' + id + '_o' + i + '.jpg');
    return list;
  };

  const PRODUCTS = [
    // ---- ぶどう ----
    {
      id: 'shine',
      name: 'シャインマスカット',
      category: 'grape',
      origin: '山梨県産',
      season: { from: 8, to: 10 },
      shipping: '8月下旬頃〜',
      cool: false,
      badge: '人気No.1',
      pid: 169364212,
      // メイン写真はお店から提供された画像（バッジ入りなので全体を表示）
      bannerPhoto: true,
      photos: ['images/products/shine.jpg'].concat(photos(169364212, 2)),
      art: { type: 'grape', colors: ['#d9f0a3', '#8fbf3f'] },
      variants: [{ id: '2kg', label: '2kg程度（2〜4房）', price: 7020, stock: 99 }],
      description:
        '驚くほどの段違いの甘さと、口の中でとろけるような食感が魅力のシャインマスカット。高貴な香りが広がり、種もなく皮ごと食べられる手軽さも人気の秘密です。',
    },
    {
      id: 'kyoho',
      name: '巨峰（種なし）',
      category: 'grape',
      origin: '山梨市牧丘町',
      season: { from: 8, to: 10 },
      shipping: '8月下旬頃〜',
      cool: false,
      pid: 169870014,
      // メイン写真はお店から提供された画像
      photos: ['images/products/kyoho.jpg'].concat(photos(169870014, 2)),
      art: { type: 'grape', colors: ['#7b5ea7', '#3b2462'] },
      variants: [{ id: '2kg', label: '2kg程度（2〜4房）', price: 6480, stock: 99 }],
      description:
        '山梨県牧丘ブランドから生まれた種なしの巨峰。酸味と甘みが絶妙に調和し、一房食べればその濃厚な甘さと豊かな果汁に虜になります。',
    },
    {
      id: 'shinano-smile',
      name: 'シナノスマイル',
      category: 'grape',
      origin: '山梨県産',
      season: { from: 8, to: 10 },
      shipping: '8月下旬頃〜',
      cool: false,
      pid: 188022084,
      // メイン写真はお店から提供された画像
      photos: ['images/products/shinano-smile.jpg'].concat(photos(188022084, 2)),
      art: { type: 'grape', colors: ['#f08a8a', '#b8323f'] },
      variants: [{ id: '2kg', label: '2kg程度（2〜4房）', price: 6480, stock: 99 }],
      description:
        'ぷっくりとした果粒と、宝石のように透き通る赤紫色が魅力。皮が薄く渋みが少ないため、口に入れるとジューシーな果汁があふれ出します。',
    },
    // ---- 詰め合わせ ----
    {
      id: 'set-kaiking',
      name: 'シャインマスカット＋甲斐キング 詰め合わせ',
      category: 'set',
      origin: '山梨県産',
      season: { from: 8, to: 10 },
      shipping: '8月下旬頃〜',
      cool: false,
      badge: '30個限定',
      pid: 188038303,
      // メイン写真はお店から提供された画像（バッジ入りなので全体を表示）
      bannerPhoto: true,
      photos: ['images/products/set-kaiking.jpg'].concat(photos(188038303, 1)),
      art: { type: 'grape', colors: ['#7b5ea7', '#3b2462'] },
      variants: [{ id: 'set', label: '詰め合わせ（緑＋黒系）', price: 7020, stock: 30 }],
      description:
        '美味しさに定評のあるシャインマスカットと、山梨県自慢の甲斐キング（黒系）の贅沢な詰め合わせ。果肉はみずみずしく、甘みと酸味のバランスが絶妙です。',
    },
    {
      id: 'set-chateau',
      name: 'シャインマスカット＋シャトウ・ルージュ 詰め合わせ',
      category: 'set',
      origin: '山梨県産',
      season: { from: 8, to: 10 },
      shipping: '8月下旬頃〜',
      cool: false,
      badge: '30個限定',
      pid: 188038244,
      photos: photos(188038244, 1),
      art: { type: 'grape', colors: ['#f08a8a', '#b8323f'] },
      variants: [{ id: 'set', label: '詰め合わせ（緑＋赤系）', price: 7020, stock: 0 }],
      description:
        '人気No.1のシャインマスカットと、ジューシーな甘さが人気のシャトウ・ルージュ（赤系）を贅沢に詰め合わせた特別セットです。',
    },
    {
      id: 'set-shinano',
      name: 'シャインマスカット＋シナノスマイル 詰め合わせ',
      category: 'set',
      origin: '山梨県産',
      season: { from: 8, to: 10 },
      shipping: '8月下旬頃〜',
      cool: false,
      badge: '30個限定',
      pid: 176325613,
      photos: photos(176325613, 0),
      art: { type: 'grape', colors: ['#d9f0a3', '#8fbf3f'] },
      variants: [{ id: '2kg', label: '2kg程度（2〜5房）', price: 5670, stock: 0 }],
      description: '高品質なシャインマスカット（種なし）と、希少品種シナノスマイル（赤系）の詰め合わせです。',
    },
    // ---- キウイ（やまなしの雫） ----
    {
      id: 'hayward',
      name: '追熟ヘイワードキウイ【やまなしの雫】',
      category: 'kiwi',
      origin: '山梨県産',
      season: { from: 11, to: 2 },
      shipping: '11月下旬頃〜',
      cool: false,
      badge: '定番人気',
      pid: 178016830,
      // メイン写真はお店から提供された画像（images/ に保存）。2枚目以降はカラーミーの商品写真
      // 文字入りの画像なので、正方形に切り抜かず全体を表示する
      bannerPhoto: true,
      photos: ['images/products/hayward.jpg'].concat(photos(178016830, 6)),
      art: { type: 'kiwi', colors: ['#c9e265', '#6f9a1e'] },
      variants: [
        { id: '3p', label: '3パック（1パック4〜6個・500g前後）', price: 2700, stock: 99 },
        { id: '6p', label: '6パック（1パック4〜6個・500g前後）', price: 4860, stock: 99 },
      ],
      description:
        '独自の追熟システムで驚きの甘さを実現したキウイフルーツ。平均糖度13度以上と桃やメロン並みの甘さです。ホルモン剤や栽培期間中の農薬は一切使用していません。',
    },
    {
      id: 'koryoku',
      name: '大玉追熟キウイ 香緑【やまなしの雫】',
      category: 'kiwi',
      origin: '山梨県産',
      season: { from: 11, to: 2 },
      shipping: '11月下旬頃〜',
      cool: false,
      badge: '希少品種',
      pid: 188655122,
      // メイン写真はお店から提供された文字入りの画像（全体を表示）
      bannerPhoto: true,
      photos: ['images/products/koryoku.jpg'].concat(photos(188655122, 2)),
      art: { type: 'kiwi', colors: ['#a8d94a', '#3f7d16'] },
      variants: [
        { id: '3p', label: '3パック（1パック4〜5個・500g前後）', price: 3564, stock: 99 },
        { id: '6p', label: '6パック（1パック4〜5個・500g前後）', price: 6480, stock: 99 },
      ],
      description:
        '鮮やかな緑色の果肉と濃厚な味わいから「キングオブキウイ」とも称される希少品種。流通量が少なく生産農家も限られた、出会えたときが食べどきの特別なキウイです。',
    },
    {
      id: 'gracie',
      name: '細長追熟キウイ グレイシー【やまなしの雫】',
      category: 'kiwi',
      origin: '山梨県産',
      season: { from: 11, to: 2 },
      shipping: '11月下旬頃〜',
      cool: false,
      pid: 189924618,
      // メイン写真はお店から提供された文字入りの画像（全体を表示）
      bannerPhoto: true,
      photos: ['images/products/gracie.jpg'].concat(photos(189924618, 1)),
      art: { type: 'kiwi', colors: ['#d6ea7a', '#86a92b'] },
      variants: [
        { id: '3p', label: '3パック（1パック4〜5個・500g前後）', price: 1890, stock: 99 },
        { id: '6p', label: '6パック（1パック4〜5個・500g前後）', price: 3694, stock: 99 },
      ],
      description:
        'やさしい甘さとほどよい酸味のバランスが魅力の、かわいい細長キウイ。酸味が穏やかで、フルーツが苦手な方やお子さまにも食べやすい味わいです。',
    },
    // ---- とうもろこし ----
    {
      id: 'kanikanmusume',
      name: '幻のとうもろこし 甘々娘（かんかんむすめ）',
      category: 'corn',
      origin: '市川三郷町大塚地区',
      season: { from: 6, to: 6 },
      shipping: '6月上旬〜6月25日頃',
      cool: true,
      badge: '朝採り',
      pid: 174377888,
      photos: photos(174377888, 3),
      art: { type: 'corn', colors: ['#ffe680', '#f2b705'] },
      variants: [
        { id: '2kg', label: '約2kg（5〜8本）', price: 3240, stock: 0 },
        { id: '4kg', label: '約4kg（10〜15本）', price: 6480, stock: 0 },
      ],
      description:
        '「のっぷい」と呼ばれる肥沃な土壌が育んだ、フルーツのように甘い幻のとうもろこし。生でも食べられるほど粒皮が柔らかく、旬の一番美味しい時期にお届けします。',
    },
    {
      id: 'dolce-dream',
      name: 'ドルチェドリーム',
      category: 'corn',
      origin: '山梨県産',
      season: { from: 6, to: 6 },
      shipping: '6月中旬頃〜',
      cool: true,
      badge: '糖度18〜20度',
      pid: 180699340,
      photos: photos(180699340, 2),
      art: { type: 'corn', colors: ['#fff09a', '#e8b10c'] },
      variants: [
        { id: '2kg', label: '約2kg（5〜6本）', price: 2970, stock: 0 },
        { id: '4kg', label: '約4kg（10〜12本）', price: 5940, stock: 0 },
      ],
      description:
        '果汁たっぷり、糖度18〜20度程度の朝採りとうもろこし。大きさにボリューム感があり水分量が多く、噛むと甘みが口いっぱいに広がります。',
    },
    {
      id: 'pure-white',
      name: '純白とうもろこし ピュアホワイト',
      category: 'corn',
      origin: '山梨県産',
      season: { from: 6, to: 6 },
      shipping: '6月中旬頃〜',
      cool: true,
      pid: 191479899,
      photos: photos(191479899, 3),
      art: { type: 'corn', colors: ['#fffbea', '#e8dcae'] },
      variants: [
        { id: '2kg', label: '約2kg（5〜6本）', price: 2916, stock: 0 },
        { id: '4kg', label: '約4kg（10〜12本）', price: 5832, stock: 0 },
      ],
      description:
        '一粒ひと粒にたっぷりと甘みを蓄えた、純白の輝きをまとう特別な品種。かじった瞬間にあふれるジューシーな果汁と、フルーツのように上品で濃厚な甘さが魅力です。',
    },
    {
      id: 'gold-rush',
      name: 'ゴールドラッシュ',
      category: 'corn',
      origin: '山梨県産',
      season: { from: 6, to: 6 },
      shipping: '6月中旬頃〜',
      cool: true,
      pid: 186220385,
      photos: photos(186220385, 3),
      art: { type: 'corn', colors: ['#ffe066', '#e09c00'] },
      variants: [
        { id: '2kg', label: '約2kg（5〜6本）', price: 2333, stock: 0 },
        { id: '4kg', label: '約4kg（10〜12本）', price: 4666, stock: 0 },
      ],
      description:
        '甘さはじける黄金の一粒。粒ぞろいが美しく、ひと口食べれば甘い風味とジューシーな果汁が広がる朝採りとうもろこしです。糖度が高く、皮もやわらかいのが特長です。',
    },
  ];

  const CATEGORIES = [
    { id: 'all', label: 'すべて' },
    { id: 'grape', label: 'ぶどう' },
    { id: 'set', label: '詰め合わせ' },
    { id: 'kiwi', label: 'キウイ' },
    { id: 'corn', label: 'とうもろこし' },
  ];

  // トップのスライド写真（mb-musubi.net のスライドショーと同じ順番）
  const HERO_PHOTOS = ['aceefc', 'adea8e', '807a15', '5a7400', '26650c', '146d31', '34ff26', '17d8dd'].map(
    (id) => PHOTO_BASE + 'slideshow/slideshow_img_' + id + '.jpg'
  );

  const data = { PRODUCTS, CATEGORIES, HERO_PHOTOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.ShopData = data;
})(typeof self !== 'undefined' ? self : this);
