// サイト全体の設定。お店の情報・SNS・計測・問い合わせの送信先はここで変更する。
// 店舗情報は mb-musubi.net の「特定商取引法に基づく表記」と同じ内容にしている（MEO のため表記を統一すること）。
(function (root) {
  const CONFIG = {
    // 公開するURL（末尾の / なし）。canonical・OGP・サイトマップに使う。公開先が決まったら書き換える。
    siteUrl: 'https://mb-musubi.net',

    shop: {
      name: 'やまなしだもの 結 musubi',
      shortName: '結 musubi',
      company: '合同会社メディアブレインアグリエール',
      postalCode: '400-0046',
      region: '山梨県',
      locality: '甲府市',
      street: '下石田2-14-8',
      tel: '055-268-2960',
      email: 'info-it@media-b.com',
      // 既存のカラーミーショップ（実際の購入はこちら）
      storeUrl: 'https://mb-musubi.net/',
    },

    sns: {
      instagram: 'https://instagram.com/musubi_yamanashi',
      x: 'https://twitter.com/mb_renecs',
      facebook: 'https://facebook.com/355346304531060',
      youtube: 'https://www.youtube.com/channel/UCflxncX5TEt5ttzU-7Cg0mg/videos',
      // LINE公式アカウントを作ったら友だち追加URL（https://lin.ee/...）を入れると、ボタンが表示される
      line: '',
    },

    meo: {
      // Googleビジネスプロフィールの「クチコミを書く」URL（https://g.page/r/.../review）。入れるとボタンが表示される
      reviewUrl: '',
      // Googleマップで表示する場所（住所で検索）
      mapQuery: '山梨県甲府市下石田2-14-8',
    },

    analytics: {
      // Googleアナリティクス4 の測定ID（G-XXXXXXXXXX）。入れると問い合わせ数などを計測できる
      ga4Id: '',
    },

    inquiry: {
      // 問い合わせフォームの送信先（Formspree・Googleフォーム連携・自社サーバーなど、JSON を POST で受け取れるURL）。
      // 空のときは、入力内容をメールアプリで info-it@media-b.com 宛てに送る。
      endpoint: '',
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.SiteConfig = CONFIG;
})(typeof self !== 'undefined' ? self : this);
