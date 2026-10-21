# やまなしだもの 結 musubi（山梨フルーツECサイト）

[やまなしだもの 結 musubi](https://mb-musubi.net/) の商品（ぶどう・詰め合わせ・追熟キウイ「やまなしの雫」・朝採りとうもろこし）を販売するサイトです。
**月30件の問い合わせ・受注**を目的に、MEO・SEO・SNS と連動させています。集客の進め方は [MARKETING.md](MARKETING.md) を見てください。

HTML / CSS / JavaScript だけで作っていて、サーバー側のプログラムは要りません。

## 見る方法

### ローカルサーバー（おすすめ）

Node.js（18以上）があれば、追加のインストールは要りません。

```
git clone https://github.com/norose0406/yamasidamopno.git
cd yamasidamopno
git checkout claude/adoring-brahmagupta-yjazml
npm start
```

ブラウザで http://localhost:8080 を開きます。止めるときは `Ctrl + C` です。

- ポートを変える: `PORT=3000 npm start`
- 同じWi-Fiのスマホから見る: `HOST=0.0.0.0 npm start` で起動し、スマホで `http://<PCのIPアドレス>:8080` を開く

### ファイルを直接開く

`fruit-shop/index.html` をブラウザで開くだけでも動きます。

## できること

**買い物**
- 白地・黒文字・正方形の写真グリッドのシンプルなデザイン（カテゴリのナビ、スライド、スマホ下部のタブバー）
- 商品写真は mb-musubi.net の画像サーバーから読み込む。読み込めないときはイラストに切り替わる
- 今月のおすすめ、カテゴリから探す、検索、並び替え、在庫ありのみ表示、お気に入り（♡）
- 商品詳細：写真ギャラリー、サイズ選択（2kg / 4kg、3パック / 6パックなど）、シェアボタン
- 送料は実際のルールで計算（佐川急便・地域別 1,100〜1,540円、2箱まで1個口）

**受注・問い合わせ**
- **公式オンラインショップで今すぐ購入**：各商品から mb-musubi.net（カラーミーショップ）の商品ページへ。クレジットカード・Amazon Pay はこちら
- **注文の申し込み**：カートの内容とお届け先をお店に送り、お店からお支払い方法をメールで案内する方式（決済の仕組みなしで受注できる）
- **お問い合わせフォーム**：種類（商品・ギフト・法人/大口・予約など）、関連商品、商品詳細からの「この商品について問い合わせる」
- 電話・メール・Instagram DM（LINE は設定すると表示）への導線を、ヘッダー・スマホのタブバー・各セクションに配置

**MEO・SEO・SNS**
- 店舗情報（名前・住所・電話）を特定商取引法の表記と統一、Googleマップ、クチコミボタン（設定時）
- 商品ごとの静的ページ、タイトル・説明文、OGP、構造化データ（Store・Product・FAQPage・BreadcrumbList・ItemList）、サイトマップ
- Instagram欄、SNSのフォローボタン、商品のシェアボタン、商品ごとの直接リンク
- GA4 のイベント計測（問い合わせ数 `generate_lead` など。測定IDを設定したとき）

## 設定

お店の情報・SNS・送信先・計測は `js/config.js` にまとめています。

| 項目 | 内容 |
| --- | --- |
| `siteUrl` | 公開するURL（canonical・OGP・サイトマップ用）。今は仮に `https://mb-musubi.net` |
| `inquiry.endpoint` | 問い合わせ・注文申し込みの送信先（JSON を POST で受け取れるURL）。**空のときはメールアプリが開き、info-it@media-b.com 宛ての下書きができる** |
| `analytics.ga4Id` | GA4 の測定ID |
| `meo.reviewUrl` | Googleの「クチコミを書く」URL |
| `sns.line` | LINE公式アカウントの友だち追加URL |

商品データは `js/products.js`、よくある質問は `js/content.js` です。
**商品・設定・よくある質問を変えたら `npm run build`** を実行し、生成されたファイル（`products/`・`sitemap.xml`・`robots.txt`・`index.html` の構造化データ）もコミットしてください。

※ 商品名・価格・説明・発送目安・在庫・送料・支払い方法は mb-musubi.net の掲載内容（2026年10月時点）をもとにしています。

## 構成

```
fruit-shop/
├── index.html            # トップページ
├── products/*.html       # 商品ごとのページ（npm run build で生成）
├── sitemap.xml, robots.txt（npm run build で生成）
├── css/style.css
├── js/
│   ├── config.js         # お店の情報・SNS・送信先・計測の設定
│   ├── products.js       # 商品データ（価格・サイズ・旬・在庫・写真）
│   ├── content.js        # よくある質問
│   ├── shop.js           # 送料・価格の計算、入力チェック（画面に依存しない）
│   ├── illustrations.js  # 写真が読み込めないときのイラスト
│   └── app.js            # 画面の表示と操作
├── scripts/build.js      # SEO用ファイルの生成
├── server.js             # ローカル確認用サーバー（npm start）
├── tests/shop.test.js
└── MARKETING.md          # 月30件に向けた集客プラン
```

## コマンド

```
npm start      # ローカルで表示
npm run build  # 商品ページ・サイトマップ・構造化データを生成
npm test       # テスト
```
