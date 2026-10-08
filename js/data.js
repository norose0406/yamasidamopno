/*
 * サイトのデータ定義。商品・お知らせ・リンクはここを編集すれば反映されます。
 *
 * - 購入は既存のカラーミーショップのカートをそのまま使います（url に ?pid=... の商品ページ）。
 * - price は税込の数値。未確認のものは null にしておくと「価格は商品ページで」と表示されます。
 * - status: "available" | "reserve"（予約受付中）| "soldout"
 * - pickup: 数値を入れると「おすすめピックアップ」にその順番で表示します
 */
window.MUSUBI = {
  links: {
    // TODO: 現行ショップの実際のURLに合わせて確認してください
    cart: "https://mb-musubi.net/cart/",
    mypage: "https://mb-musubi.net/?mode=myaccount",
    delivery: "https://mb-musubi.net/?mode=sk#delivery",
    payment: "https://mb-musubi.net/?mode=sk#payment",
    law: "https://mb-musubi.net/?mode=sk",
    privacy: "https://mb-musubi.net/?mode=privacy",
    inquiry: "https://mb-musubi.net/?mode=inq"
  },

  topbar: "山梨の果樹園から産地直送｜キウイ【やまなしの雫】予約受付中",

  // カテゴリ。months はお届け目安（月）。旬カレンダー・アイコン列に使います。
  categories: [
    { id: "peach",   label: "桃",           emoji: "🍑", months: [6, 7, 8] },
    { id: "grape",   label: "ぶどう",       emoji: "🍇", months: [8, 9, 10] },
    { id: "compote", label: "コンポート",   emoji: "🫙", months: [] },
    { id: "corn",    label: "とうもろこし", emoji: "🌽", months: [6, 7] },
    { id: "kiwi",    label: "キウイ",       emoji: "🥝", months: [11, 12, 1] }
  ],

  // メインバナー（カルーセル）。href はページ内リンクか商品URL。
  banners: [
    { title: "やまなしの雫", sub: "特秀 追熟ヘイワードキウイ 予約受付中", theme: "kiwi", href: "#all", filter: "kiwi" },
    { title: "シャインマスカットの季節", sub: "数量限定の詰め合わせをご用意", theme: "grape", href: "#all", filter: "grape" },
    { title: "果実をそのまま、瓶の中に", sub: "シャインマスカット・ソルダムのコンポート", theme: "compote", href: "#all", filter: "compote" }
  ],

  // 特集バナー
  features: [
    { title: "贈りものに選ばれる詰め合わせ", sub: "ギフト向けの詰め合わせ商品", theme: "grape", filter: "grape" },
    { title: "一年中たのしめるコンポート", sub: "旬の果実をシロップ漬けに", theme: "compote", filter: "compote" }
  ],

  products: [
    {
      category: "grape",
      name: "3種詰め合わせ シャインマスカット・巨峰・シナノスマイル（赤系）",
      spec: "2kg（3〜4房）／30個限定",
      price: 5940,
      status: "soldout",
      pickup: 3,
      url: "https://mb-musubi.net/?pid=169870083"
    },
    {
      category: "grape",
      name: "シャインマスカット（種なし）・シナノスマイル（赤系）詰め合わせ",
      spec: "2kg程度（2〜5房）／30個限定",
      price: null,
      status: "soldout",
      url: "https://mb-musubi.net/?pid=176325613"
    },
    {
      category: "compote",
      name: "シャインマスカット・ソルダム（すもも）コンポート 3個詰め合わせ",
      spec: "人気No.1の詰め合わせ",
      price: null,
      status: "available",
      pickup: 1,
      url: "https://mb-musubi.net/?pid=169870446"
    },
    {
      category: "compote",
      name: "シャインマスカットコンポート",
      spec: "3個入り",
      price: null,
      status: "available",
      url: "https://mb-musubi.net/?pid=169870348"
    },
    {
      category: "compote",
      name: "ソルダム（すもも）コンポート",
      spec: "3個入り",
      price: null,
      status: "available",
      url: "https://mb-musubi.net/?pid=169870383"
    },
    {
      category: "compote",
      name: "ソルダム（すもも）コンポート",
      spec: "2個入り",
      price: null,
      status: "available",
      url: "https://mb-musubi.net/?pid=169870369"
    },
    {
      category: "kiwi",
      name: "特秀 追熟ヘイワードキウイ【やまなしの雫】",
      spec: "6パック入り（1パック5個入り）／平均糖度13度以上",
      price: 4860,
      status: "reserve",
      pickup: 2,
      url: "https://mb-musubi.net/?pid=178016830"
    },
    {
      category: "kiwi",
      name: "特秀 大玉追熟ヘイワードキウイ【やまなしの雫】",
      spec: "3パック入り（1パック5個入り）",
      price: null,
      status: "reserve",
      url: "https://mb-musubi.net/?pid=178016954"
    }
  ],

  // 上から順に表示します。date は表示用の文字列（例: "2025.06.01"）。
  // TODO: 現行サイトのお知らせの正確な日付に差し替えてください
  news: [
    { date: "2025", title: "2025年 山梨のとうもろこし 予約受付を開始しました" },
    { date: "2025", title: "今シーズンのキウイは完売いたしました。ありがとうございました" }
  ]
};
