# RSSフィード（/feed.xml）

## 概要

サイトの記事を全文で配信するRSSフィードを`/feed.xml`に生成する。本文は`<content:encoded>`で、要約は`<description>`で配信し、RSSリーダーだけで記事を読めるようにする。

このサイトは独自の角括弧構文（[markdown-pipeline.md](./markdown-pipeline.md)）や`astro:assets`の画像を使うため、生のMarkdownではなく、**Astroが実際に静的生成した記事ページのHTMLから本文を取り出して配信する**。これによりフィードの本文はサイト本体とまったく同じレンダリング結果になる。

`/feed.xml`はAstroのルートではない。ビルド後フックがファイルを直接`dist/client/feed.xml`へ書き出し、静的ホスティングでそのまま配信される。`Layout.astro`が全ページで`<link rel="alternate" type="application/rss+xml" href="/feed.xml">`を出力する。

## 全体の流れ

実装は「中間エンドポイント」と「ビルド後フック」の2段構成になっている。Cloudflareアダプタのprerenderランタイム（workerd相当）ではContainer APIが`node:path`を解決できず、エンドポイント内でMDXをHTMLへ描画できないため、メタデータの出力と本文の取得を分けている（各ソースの冒頭コメントに記載）。

```text
astro build
  1. src/pages/feed-data.json.ts（中間エンドポイント）
       listedな記事のメタデータ（slug・title・description・公開日）を
       JSONで出力 → dist/client/feed-data.json
  2. 各記事ページを通常どおり静的生成
       dist/client/<slug>/index.html（角括弧構文・画像が展開済みの本文を含む）
  3. scripts/feed-integration.mjs（astro:build:doneフック。Nodeで実行）
       - feed-data.jsonを読む
       - 各記事のHTMLから<article>の本文を取り出す
       - 相対URLを絶対URLへ書き換え、sanitize-htmlで整形
       - @astrojs/rssでfeed.xmlを組み立てdist/client/feed.xmlへ書き出す
       - 中間ファイルfeed-data.jsonを削除
```

## 中間エンドポイント（feed-data.json.ts）

`listed: false`を除く全ページを`date`の降順に並べ、次のフィールドをJSONで出力する。

| フィールド | 内容 |
| --- | --- |
| `slug` | ページのid |
| `title` | frontmatterの`title` |
| `description` | frontmatterの`description`、無ければ`extractExcerpt`による本文冒頭の抽出（[website.md](./website.md)のdescription解決と共通） |
| `pubDate` | `date`のISO文字列（無ければnull） |

このファイルはRSS生成後に削除されるため、公開サイトには残らない。`.json`エンドポイントは`@astrojs/sitemap`の対象外（HTMLページのみ対象）のため、sitemap側の除外設定は不要。

## ビルド後フック（feed-integration.mjs）

`astro.config.ts`で`feedIntegration({ title, description })`として登録され、チャンネルのtitle/descriptionには`src/consts.ts`の`SITE_TITLE`・`SITE_DESCRIPTION`が渡る。

- 出力先パスはハードコードせず、`astro:config:done`で`config.build.client`（クライアント出力ディレクトリ）・`config.site`・`config.build.format`を取得する。記事HTMLの場所は`format`（既定`directory`→`<slug>/index.html`、`file`→`<slug>.html`）で解決する。
- `site`未設定や`feed-data.json`が無い場合は警告して生成をスキップする。記事単位の失敗（HTMLが無い・`<article>`を抽出できない）は警告を残しつつ、そのitemは本文なしで配信を続ける。
- itemの`link`は`/<slug>/`。

### 本文の抽出と整形

1. **`<article>`から本文だけを取り出す**：`<article>…</article>`を正規表現で抽出し、`<header>`（記事タイトルの`<h1>`。RSSの`<title>`と重複）と`<footer>`（公開日・タグ。itemのメタデータと重複）を除去する。`<article>`は1ページに1つで、コードブロック内の山括弧はエスケープ済みのため、単純な抽出で安全に取り出せる。この処理は`ArticlePage.astro`の構造（`<article>`/`<header>`/`<footer>`）に依存しており、テンプレートを変える場合はここも見直す。
2. **相対URLを絶対URLへ書き換える**：RSSは外部リーダーで読まれるため、`href`/`src`/`srcset`のroot相対URL（`/…`）を`site`のオリジンで絶対化する。
3. **sanitize-htmlで整形する**：本文として意味のあるタグだけを残す。
   - sanitize-htmlの既定の許可タグから`span`を除外し、`img`・`picture`・`source`・`iframe`を追加する。`span`はRSSではサイトのCSSが効かず装飾の意味を持たず、特にコードブロックのシンタックスハイライトが大量の入れ子spanを生むため、除外して中身のテキストだけ残す（コードはプレーンテキストになる）。
   - `iframe`はYouTube（`www.youtube.com`・`www.youtube-nocookie.com`）のみ許可する。
   - `id`属性を全要素で残す。GFM脚注の参照と定義のあいだのジャンプリンク（`#user-content-fn-1`など）を成立させるため。`a`の`aria-label`・`aria-describedby`も残す。

## 制約・注意点

- 配信対象は`listed: false`を除くページ。`listed`の効果は[website.md](./website.md)を参照。
- コードブロックの色（シンタックスハイライト）は配信しない。上記のとおりspanを除外するため、コードは`<pre><code>`のプレーンテキストになる。
- 本文にはrehype-budouxの`<wbr>`が含まれる（サイト本体のHTMLと同様。ゼロ幅で不可視）。
- `@astrojs/rss`の`rss()`は`Response`を返すため、`.text()`でXML文字列を取り出して書き出している。

## 検証の観点

ビルド後の`dist/client/feed.xml`で次を確認する。

- XMLが整形式である（パースできる）。
- `listed: false`の記事が含まれない。
- 全itemに空でない`<content:encoded>`がある。
- 本文に`<h1>`・`<header>`・`<footer>`・`<span>`・日付・タグリンクが含まれない。
- 見出し（h2/h3）・`<pre><code>`・画像・ruby・kbdが保持される。
- 画像・リンクが絶対URLになっている。
- `<script>`・`astro-island`・レイアウト由来のクラスが混入していない。
- 中間ファイル`feed-data.json`が削除されている。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `apps/web/src/pages/feed-data.json.ts` | listedな記事のメタデータをJSON出力する中間エンドポイント |
| `apps/web/scripts/feed-integration.mjs` | `astro:build:done`フック。本文の抽出・整形とfeed.xmlの生成 |
| `apps/web/astro.config.ts` | `feedIntegration`の登録 |
| `apps/web/src/lib/excerpt.ts` | descriptionフォールバック用の冒頭抽出（ページのmeta・OGPと共有） |
| `apps/web/src/layouts/Layout.astro` | `<link rel="alternate">`の出力 |
