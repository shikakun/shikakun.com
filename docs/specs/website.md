# サイト本体（apps/web）

## 概要

`apps/web`は https://shikakun.com を生成するAstroアプリケーション。`output: 'static'`で静的生成し、Cloudflareアダプタ（`@astrojs/cloudflare`）でCloudflareへデプロイする。おたよりフォームのAPIルートだけがサーバーで実行される。

Astro統合として`@astrojs/mdx`・`@astrojs/react`・`@astrojs/sitemap`に加え、自前の`contentWatchIntegration`（[content-sync.md](./content-sync.md)）と`feedIntegration`（[feed.md](./feed.md)）を登録している（`astro.config.ts`）。

## ルーティング

| パス | ソース | 内容 |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | `listed: false`を除く全ページを日付降順で一覧表示 |
| `/[slug]` | `src/pages/[slug].astro` | 記事ページとタグページの両方を生成（後述） |
| `/llms.txt` | `src/pages/llms.txt.ts` | `listed: false`を除く全ページの一覧をMarkdown形式のプレーンテキストで出力 |
| `/feed-data.json` | `src/pages/feed-data.json.ts` | RSS生成用の中間データ。ビルド後に削除され公開サイトには残らない |
| `/feed.xml` | `scripts/feed-integration.mjs` | 全文RSS。Astroのルートではなくビルド後フックが直接書き出す |
| `/api/banana-message` | `src/pages/api/banana-message.ts` | おたよりフォームの送信先。`prerender = false`のサーバールート |
| `/sitemap-index.xml` | `@astrojs/sitemap` | サイトマップ。`public/robots.txt`から参照される |

`/[slug]`の`getStaticPaths`は次の2種類のパスを返す。

1. **記事ページ**：`pages`コレクションの全エントリー。`ArticlePage.astro`で描画する。
2. **タグページ**：全ページの`tags`の和集合から生成。`TagPage.astro`で、そのタグを持つページを日付降順で一覧表示する。

記事のslugとタグ名は同じパス空間（`/[slug]`）を共有する。

### 日付の扱い

一覧の表示・ソートには`displayDate`（文字列）を優先し、無ければ`date`の`YYYY-MM-DD`を使う。ソートはこの文字列の辞書順（降順）。

## コンテンツコレクション

`src/content.config.ts`で2つのコレクションを定義する。エントリーの実体は非公開リポジトリからsyncされる（[content-sync.md](./content-sync.md)）。

### pages（`src/content/pages/**/*.{md,mdx}`）

ファイル名（拡張子を除く）がそのままid＝URLのslugになる。frontmatterのスキーマと各フィールドの効果：

| フィールド | 型 | 効果 |
| --- | --- | --- |
| `title` | string（必須） | ページタイトル。`<title>`・OGP・一覧・OG画像生成に使う |
| `description` | string | meta description・OGP・RSSのdescription。無ければ本文冒頭から自動抽出（後述） |
| `date` | date | 公開日。一覧の表示・ソート、RSSの`pubDate`、`article:published_time`のフォールバック |
| `displayDate` | string | 一覧での表示・ソートで`date`より優先される表示用文字列 |
| `publishedAt` | date | `article:published_time`（無ければ`date`を使う） |
| `updatedAt` | date | `article:modified_time` |
| `tags` | string[] | kebab-caseのslugのみ許可（zodのregexで検証）。記事フッターのタグリンクと`article:tag`になる |
| `listed` | boolean | `false`でトップの一覧・`/llms.txt`・RSSから除外する。ページ自体は生成される |
| `prose` | boolean | `false`で本文を`Prose`コンポーネントで包まない（記事タイポグラフィを適用しない） |
| `header` | boolean | `false`でページ上部の`PageHeader`（`<h1>`）を出力しない |

### tags（`src/content/tags/**/*.yaml`）

タグのメタ情報。`title`（必須）と`description`を持ち、タグページの見出し・説明・記事フッターのタグボタンのラベルに使う。tagsコレクションに無いタグでもタグページは生成され、その場合はslugがそのまま表示される。

## レイアウトとメタ情報

`src/layouts/Layout.astro`が全ページ共通のHTML骨格を出力する。

- **タイトル**：ホームは`shikakun`、それ以外は`{title} — shikakun`。
- **メタ**：description・canonical・OGP一式（`og:image`のwidth/height/type/altを含む）・Twitterカード（`summary_large_image`）・記事では`article:published_time`/`modified_time`/`tag`。
- **favicon**：`favicon.ico`（`public/`）とPNG各サイズ・apple-touch-icon（`src/assets/`）。
- **RSS**：`<link rel="alternate" type="application/rss+xml" href="/feed.xml">`。
- **Google Analytics**：本番ビルド（`import.meta.env.PROD`）かつ`GA_MEASUREMENT_ID`があるときのみgtag.jsを読み込む。
- **ナビゲーション**：`SiteNavigation`をページ上部と下部の2箇所に置く。
- **スタイルの読み込み順**：`@shikakun/design-tokens/css`→`@shikakun/react/css`→`src/styles/global.css`→`src/styles/bracket-syntax.css`。

サイト定数は`src/consts.ts`（`SITE_TITLE`・`SITE_DESCRIPTION`・`SITE_LANG: 'ja'`・`SITE_REGION: 'JP'`・`SITE_X_ID`・`GA_MEASUREMENT_ID`）。

### descriptionの解決順

1. frontmatterの`description`
2. 本文冒頭からの自動抽出：`src/lib/excerpt.ts`の`extractExcerpt`。コードブロック・MDXのimport/export行・タグ・画像・Markdown記法を除去した最初の非空段落を、句点（。！？）境界で110文字以内に整形する
3. サイト既定の`SITE_DESCRIPTION`

この解決はページのmeta・OGP・RSSで共通。

### OG画像の解決

ページ個別の`src/assets/pages/<slug>/og.png`を`import.meta.glob`で収集し、あればそれを、無ければサイト共通の`src/assets/og.png`を使う。個別画像の生成は[og-image.md](./og-image.md)を参照。

## コンポーネント

`src/components/`のコンポーネント。UI部品の多くは`@shikakun/react`（[react-components.md](./react-components.md)）を使う。

| コンポーネント | 役割 |
| --- | --- |
| `ArticlePage.astro` | 記事ページ本体。`<article>`内に`PageHeader`（`header: false`で省略）・本文（`prose: false`でなければ`Prose`で包む）・`<footer>`（日付とタグボタン）を出力 |
| `TagPage.astro` | タグページ。タグのメタ情報を見出しにし、該当ページを`PageList`で一覧表示 |
| `PageHeader.astro` | `<h1>`（`Heading`）と説明文のヘッダー |
| `PageListContainer.astro` | 一覧の余白を整えるラッパー |
| `SiteNavigation.astro` | サイトナビゲーション。項目（Home・Poetry・Note・Podcast・Link・Manzai）はこのファイルにハードコードされ、現在のパスから`isCurrent`を判定して`NavigationMenu`（`client:load`）へ渡す |
| `LinkList.astro` | 外部プロフィール（SNS・音楽サービスなど）へのリンクボタン一覧。リンク先はこのファイルにハードコード |
| `ArticleButton.tsx` | MDX本文内で使うリンクボタン。`http(s)`始まりなら外部リンク扱いで`target="_blank"`とアイコンを切り替える |
| `BananaEpisodeList.astro` | PodcastのRSS（anchor.fm）をビルド時にfetchし、最新6件のエピソードをタイトル・日付・分数（秒は20秒未満で切り捨て、以上で切り上げ）で一覧表示。取得失敗時は代替メッセージを出す |
| `BananaMessageForm.tsx` | おたよりフォーム（Reactアイランド）。`/api/banana-message`へJSONをPOSTし、成否のフィードバックを表示する |

## おたよりフォームAPI

`/api/banana-message`（POST）は、受け取った`message`（必須）と`name`を、環境変数`MESSAGE_FORM_API_URL`のエンドポイントへ`MESSAGE_FORM_API_TOKEN`を添えて転送するプロキシ。バリデーションエラーは400、転送失敗は502を返す。環境変数は`astro.config.ts`の`env.schema`で`context: 'server'`・`access: 'secret'`として定義されており、リポジトリには値を持たない。

## グローバルスタイル

`src/styles/global.css`は「マテリアル・オネスティ（素材に対して正直）」の方針のもと、ユーザーエージェントの挙動を尊重しつつ日本語組版向けの調整を行う。`text-spacing-trim`・`text-autospace`・`line-break: strict`・`hanging-punctuation`・和文の`font-kerning: none`・和文`em`の太字化などを`:root`や言語セレクタで指定する。

`src/styles/bracket-syntax.css`は角括弧構文が生成する要素のスタイル（[markdown-pipeline.md](./markdown-pipeline.md)）。

## その他の実装メモ

- パスエイリアス`~/*`は`src/*`を指す（`tsconfig.json`）。
- `astro.config.ts`の`vite.optimizeDeps.include`と`resolve.dedupe`は、開発サーバー初回アクセス時にReactが「Invalid hook call」で壊れる不具合への対処。Viteの依存最適化のやり直しでReactの実体が二重になることを防ぐ（詳細はソースコメント）。
- ユニットテストはVitest（`pnpm --filter @shikakun/web test`）。`src/lib/`配下の`*.test.ts`が対象。
