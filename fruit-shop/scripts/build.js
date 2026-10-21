// SEO用のファイルを生成する: 商品ごとのページ・サイトマップ・robots.txt・トップページの構造化データ。
// 実行: npm run build（商品データや設定を変えたら実行して、生成されたファイルもコミットする）
const fs = require('node:fs');
const path = require('node:path');
const CONFIG = require('../js/config.js');
const { PRODUCTS, CATEGORIES } = require('../js/products.js');
const { FAQ } = require('../js/content.js');
const Shop = require('../js/shop.js');

const ROOT = path.join(__dirname, '..');
const SITE = CONFIG.siteUrl.replace(/\/$/, '');
const shop = CONFIG.shop;
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
const month = new Date().getMonth() + 1;
const today = new Date().toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plainName = (p) => p.name.replace(/【.*?】/g, '').trim();
const productUrl = (p) => SITE + '/products/' + p.id + '.html';
const isUrl = (src) => /^https?:\/\//.test(src);
// 写真の場所：URL はそのまま、images/... のような相対パスは置き場所に合わせて解決する
const absImage = (src) => (isUrl(src) ? src : SITE + '/' + src);
const relImage = (src, prefix) => (isUrl(src) ? src : prefix + src);
const jsonLd = (data) => '<script type="application/ld+json">\n' + JSON.stringify(data, null, 2).replace(/</g, '\\u003c') + '\n</script>';

const sameAs = Object.values(CONFIG.sns).filter(Boolean);

const storeLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  '@id': SITE + '/#store',
  name: shop.name,
  url: SITE + '/',
  image: absImage(PRODUCTS[0].photos[0]),
  telephone: shop.tel,
  email: shop.email,
  address: {
    '@type': 'PostalAddress',
    postalCode: shop.postalCode,
    addressRegion: shop.region,
    addressLocality: shop.locality,
    streetAddress: shop.street,
    addressCountry: 'JP',
  },
  parentOrganization: { '@type': 'Organization', name: shop.company },
  sameAs,
};

function availabilityUrl(p) {
  const status = Shop.availability(p, month).status;
  if (status === 'soldout') return 'https://schema.org/SoldOut';
  if (status === 'reserve') return 'https://schema.org/PreOrder';
  return 'https://schema.org/InStock';
}

function productLd(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: plainName(p),
    description: p.description,
    image: p.photos.map(absImage),
    sku: String(p.pid),
    category: CATEGORY_LABEL[p.category],
    brand: { '@type': 'Brand', name: shop.name },
    offers: p.variants.map((v) => ({
      '@type': 'Offer',
      name: v.label,
      price: v.price,
      priceCurrency: 'JPY',
      availability: v.stock > 0 ? availabilityUrl(p) : 'https://schema.org/SoldOut',
      url: productUrl(p),
      seller: { '@id': SITE + '/#store' },
    })),
  };
}

function staticCard(p, prefix) {
  return (
    '<li class="card"><a class="card-static" href="' + prefix + 'products/' + p.id + '.html">' +
    '<span class="card-media"><img class="photo' + (p.bannerPhoto ? ' photo-whole' : '') + '" src="' + relImage(p.photos[0], prefix) + '" alt="' + esc(plainName(p)) + '" loading="lazy"></span>' +
    '<span class="card-body"><span class="card-name">' + esc(p.name) + '</span>' +
    '<span class="card-price">' + Shop.formatYen(Shop.minPrice(p)) + (p.variants.length > 1 ? '〜' : '') + '<small>税込</small></span></span>' +
    '</a></li>'
  );
}

function replaceBlock(html, name, content) {
  const re = new RegExp('(<!-- build:' + name + ' -->)[\\s\\S]*?(\\s*<!-- /build:' + name + ' -->)');
  if (!re.test(html)) throw new Error('index.html に build:' + name + ' の目印がありません');
  return html.replace(re, '$1\n' + content + '$2');
}

// ---- トップページ ----
function buildIndex() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const ld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: shop.name, url: SITE + '/' },
    storeLd,
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: productUrl(p), name: plainName(p) })),
    },
  ];
  html = replaceBlock(html, 'jsonld', ld.map(jsonLd).join('\n'));
  // JavaScript が動かない環境（検索エンジンの一部など）向けの商品一覧。表示時は app.js が描き直す。
  html = replaceBlock(html, 'products', '          <ul class="product-grid">\n' + PRODUCTS.map((p) => '            ' + staticCard(p, '')).join('\n') + '\n          </ul>');
  fs.writeFileSync(file, html);
}

// ---- 商品ページ ----
function productPage(p) {
  const name = plainName(p);
  const title = name + '｜山梨から産地直送の通販｜' + shop.name;
  const desc = name + '（' + p.variants.map((v) => v.label).join('・') + '）' + Shop.formatYen(Shop.minPrice(p)) + (p.variants.length > 1 ? '〜' : '') + '。' + p.description;
  const status = Shop.availability(p, month);
  const related = PRODUCTS.filter((o) => o.category === p.category && o.id !== p.id).slice(0, 4);
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: shop.name, item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: CATEGORY_LABEL[p.category], item: SITE + '/#items' },
      { '@type': 'ListItem', position: 3, name, item: productUrl(p) },
    ],
  };
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc.slice(0, 160))}">
  <link rel="canonical" href="${productUrl(p)}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="${esc(shop.name)}">
  <meta property="og:title" content="${esc(name + '｜' + shop.name)}">
  <meta property="og:description" content="${esc(p.description)}">
  <meta property="og:url" content="${productUrl(p)}">
  <meta property="og:image" content="${absImage(p.photos[0])}">
  <meta property="og:locale" content="ja_JP">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="../css/style.css">
${jsonLd(productLd(p))}
${jsonLd(breadcrumb)}
</head>
<body class="product-page">
  <header class="site-header">
    <div class="header-main container header-simple">
      <a class="logo" href="../index.html"><span class="logo-name">やまなしだもの</span><span class="logo-sub">結 musubi</span></a>
      <a class="btn btn-outline" href="../index.html#contact">お問い合わせ</a>
    </div>
  </header>
  <main class="container section">
    <nav class="breadcrumb" aria-label="パンくずリスト"><a href="../index.html">トップ</a> ＞ <a href="../index.html#items">${esc(CATEGORY_LABEL[p.category])}</a> ＞ ${esc(name)}</nav>
    <article class="detail">
      <div class="detail-gallery">
        <div class="detail-main"><img class="photo${p.bannerPhoto ? ' photo-whole' : ''}" src="${relImage(p.photos[0], '../')}" alt="${esc(name)}"></div>
        ${p.photos.length > 1 ? '<div class="thumbs">' + p.photos.slice(1).map((src, i) => '<span class="thumb-static"><img class="photo" src="' + relImage(src, '../') + '" alt="' + esc(name) + ' 写真' + (i + 2) + '" loading="lazy"></span>').join('') + '</div>' : ''}
      </div>
      <div class="detail-info">
        <span class="status status-${status.status}">${status.label}</span>
        <h1>${esc(p.name)}</h1>
        <p class="detail-price">${Shop.formatYen(Shop.minPrice(p))}${p.variants.length > 1 ? '〜' : ''}<small>税込</small></p>
        <p class="detail-shipping">送料 ${Shop.formatYen(Shop.MIN_SHIPPING_FEE)}〜（お届け先により異なります・2箱まで1個口）</p>
        <ul class="variant-static">
          ${p.variants.map((v) => '<li><span>' + esc(v.label) + '</span><strong>' + (v.stock > 0 ? Shop.formatYen(v.price) : '売り切れ') + '</strong></li>').join('\n          ')}
        </ul>
        <a class="btn btn-primary btn-block" href="../index.html#item-${p.id}">${status.status === 'soldout' ? '商品の詳細を見る' : 'サイズ・数量を選んでカートへ'}</a>
        ${status.status === 'soldout' ? '' : `<a class="store-link" href="${shop.storeUrl}?pid=${p.pid}" rel="noopener">クレジットカード・Amazon Payで今すぐ購入（公式オンラインショップ）</a>`}
        <a class="btn btn-outline btn-block" href="../index.html#contact">この商品について問い合わせる（ギフト・大口も歓迎）</a>
        <p class="detail-desc">${esc(p.description)}</p>
        <dl class="spec">
          <dt>産地</dt><dd>${esc(p.origin)}</dd>
          <dt>旬</dt><dd>${Shop.seasonLabel(p)}</dd>
          <dt>発送目安</dt><dd>${esc(p.shipping)}（天候等により前後します）</dd>
          <dt>配送</dt><dd>佐川急便${p.cool ? '（クール便）' : ''}</dd>
          <dt>お問い合わせ</dt><dd><a href="tel:${shop.tel.replace(/-/g, '')}">${shop.tel}</a></dd>
        </dl>
      </div>
    </article>
    ${related.length ? `<section class="section related"><div class="section-head"><h2><span class="en">RELATED</span>同じカテゴリの商品</h2></div><ul class="product-grid">${related.map((o) => staticCard(o, '../')).join('')}</ul></section>` : ''}
  </main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <p class="footer-logo">やまなしだもの <span>結 musubi</span></p>
        <p class="footer-address">${esc(shop.company)}<br>〒${shop.postalCode} ${esc(shop.region + shop.locality + shop.street)}<br>TEL ${shop.tel}</p>
      </div>
      <ul class="footer-links">
        <li><a href="../index.html">トップページ</a></li>
        <li><a href="../index.html#contact">お問い合わせ</a></li>
        <li><a href="https://mb-musubi.net/?mode=sk" rel="noopener">特定商取引法に基づく表記</a></li>
      </ul>
    </div>
    <p class="copyright">© musubi All Rights Reserved.</p>
  </footer>
</body>
</html>
`;
}

function buildProducts() {
  const dir = path.join(ROOT, 'products');
  fs.mkdirSync(dir, { recursive: true });
  const keep = new Set(PRODUCTS.map((p) => p.id + '.html'));
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.html') && !keep.has(f)) fs.unlinkSync(path.join(dir, f));
  for (const p of PRODUCTS) fs.writeFileSync(path.join(dir, p.id + '.html'), productPage(p));
}

function buildSitemap() {
  const urls = [SITE + '/'].concat(PRODUCTS.map(productUrl));
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + u + '</loc><lastmod>' + today + '</lastmod></url>').join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /tests/\nDisallow: /scripts/\n\nSitemap: ' + SITE + '/sitemap.xml\n');
}

buildIndex();
buildProducts();
buildSitemap();
console.log('生成しました: 商品ページ ' + PRODUCTS.length + '件、sitemap.xml、robots.txt、トップページの構造化データ');
