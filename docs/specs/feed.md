# RSS フィード（feed.xml）の全文配信

## 概要

サイトの記事を**全文**で配信する RSS フィードを `/feed.xml` に生成する。RSS リーダーだけで、サイトを開かずにすべての記事本文を読めるようにする。

このサイトは独自の記法（角括弧構文。ruby・kbd・YouTube 埋め込みなど）や `astro:assets` の画像を使うため、生の Markdown を配信すると記法が崩れる。そこで、**Astro が実際に生成した記事ページの HTML から本文を取り出して配信する**。

実装の中心は、ビルド後に走る Astro 統合 `apps/web/scripts/feed-integration.mjs`（`astro:build:done` フック）と、記事メタデータを出力する中間エンドポイント `apps/web/src/pages/feed-data.json.ts` の2つ。

## 背景・目的

- RSS リーダーで全記事をそのまま読めるようにしたい（要約だけでなく本文を配信する）。
- 独自記法を使っているため、配信するのは**レンダリング後の HTML**である必要がある。生 Markdown では記法が再現できない。
- 本文は `<content:encoded>`（RSS の content モジュール）で配信し、`<description>` には冒頭の抜粋を入れる（要約と全文の両立）。

## ゴール / 非ゴール

### ゴール

- `listed: false` を除く全ページを、本文 HTML つきで `/feed.xml` に配信する。
- 独自記法・画像・見出し・コードブロックが、サイト本体と同じ見え方で配信される。
- 画像・リンクは絶対 URL で配信される（外部リーダーで解決できる）。
- 本文は記事の「中身」だけにする（タイトル見出し・日付・タグなどのページ装飾は含めない。これらは RSS の item メタデータ側にある）。

### 非ゴール

- コードブロックのシンタックスハイライト（色）の再現。RSS ではサイトの CSS が効かないため、コードはプレーンテキストで配信する。
- インタラクティブな要素の配信（フォーム等）。該当する `banana` ページは `listed: false` で対象外。

## 全体の流れ

```text
astro build
  1. feed-data.json.ts（エンドポイント）
       astro:content から listed な記事のメタデータ（slug・title・description・公開日）を
       JSON で出力 → dist/client/feed-data.json
  2. 各記事ページを通常どおり静的生成
       dist/client/<slug>/index.html（独自記法・画像が展開済みの本文を含む）
  3. feed-integration.mjs（astro:build:done フック, Node 実行）
       - feed-data.json を読む
       - 各記事の index.html から <article> の本文を取り出す
       - 相対 URL を絶対 URL に書き換え、sanitize-html で整形
       - @astrojs/rss で feed.xml を組み立て dist/client/feed.xml に書き出す
       - 中間ファイル feed-data.json を削除
```

## 技術選定の経緯（重要）

### 当初案：Container API — Cloudflare アダプタで動かず不採用

最初は Astro 公式の RSS 全文配信パターンに従い、エンドポイント `feed.xml.ts` の中で **Container API**（`experimental_AstroContainer` ＋ `@astrojs/mdx` / `@astrojs/react` の `getContainerRenderer`）を使って `Content` コンポーネントを HTML 文字列へレンダリングしようとした。

しかしこのサイトは **Cloudflare アダプタ**を使っており、`output: 'static'` でもエンドポイントは workerd 相当の prerender ランタイムで実行される。このランタイムには Node 組み込みモジュールが無く、次の順で失敗した。

1. `@astrojs/react` の renderer が `vite/internal` を解決できずビルド失敗（`Missing "./internal" specifier in "vite"`）。→ listed な記事は React を使わないため renderer を外した。
2. `@astrojs/mdx` の renderer が `satteri`（MDX の内部モジュール）を解決できずビルド失敗。→ renderer を全部外した。
3. renderer を外すとビルドは通るが、prerender 実行時に **`Error: No such module "node:path"`**（`astro/container` が `node:path` に依存）で feed.xml が**空**になった。

結論：**Container API は Cloudflare アダプタの prerender ランタイムでは使えない**。MDX を HTML へ描画するには Node とビルドツール一式が必要で、それを workerd 環境に持ち込めない。

### 採用案：ビルド後にレンダリング済み HTML から本文を取り出す

Container API を使わず、**通常どおり静的生成された記事ページの HTML を再利用する**。記事ページは `astro build` が普通に生成するため Cloudflare の制約を受けず、独自記法も画像もサイト本体と完全に同じ結果になっている。これを Node で動く `astro:build:done` フック（ビルドプロセス内なので Node 組み込みが使える）の中で読み取り、RSS を組み立てる。

メタデータ（title・公開日・description）は astro:content を使う中間エンドポイントから取得する。エンドポイントは workerd でも動く（`getCollection` は純粋な JS で Node 依存が無い）。一方で、フックからは astro:content を直接使えないため、この「エンドポイントで出して、フックで読む」橋渡しが必要になっている。

### なぜ中間エンドポイント経由なのか

- **メタデータ（容易・workerd 可）**：astro:content が必要。エンドポイントなら使える。
- **本文 HTML（要 Node・ビルド context）**：レンダリング済み HTML が必要。エンドポイント内では描画できない（Container API が動かない）。`astro:build:done` フックなら、ビルド済みの HTML ファイルを読める。

この2つの制約が逆方向のため、エンドポイント（メタデータ）→ build:done フック（本文 HTML と結合）という構成になっている。

### フロントマターを直接読まない理由

build:done フックでフロントマターを読めば中間エンドポイントを省けるが、`yaml` パッケージは apps/web から直接解決できず（astro の推移的依存のみ）、追加依存が必要になる。また `extractExcerpt`（TypeScript）を `.mjs` から再利用できない。中間エンドポイント方式なら astro:content がパース済みのデータをそのまま使え、`extractExcerpt` も TypeScript 側で共有できる。

## 本文の整形

`<article>` の中身をそのまま配信すると不要な要素が混ざるため、次の整形を行う（`feed-integration.mjs`）。

### 1. `<article>` から本文だけを取り出す

ビルド済みページの `<article>...</article>` を取り出し、さらに次を除去する。

- `<header>`（記事タイトルの `<h1>`）：RSS の `<title>` と重複するため。
- `<footer>`（公開日・タグ）：RSS の `<pubDate>` や item メタデータ側にあるため。

> `<article>` は1ページに1つだけで、コードブロック内の山括弧はエスケープ済み（`&lt;article&gt;`）のため、単純な正規表現抽出で安全に取り出せる。

### 2. 相対 URL を絶対 URL に書き換える

RSS は外部リーダーで読まれるため、`href` / `src` / `srcset` の root 相対 URL（`/...`）を `https://shikakun.com/...` に書き換える。

> 画像は `<Image>` の出力がそのまま入る。Cloudflare の画像処理が有効なため、画像 URL は `/_image?href=...` 形式（オンデマンド最適化エンドポイント）になり、それを絶対化する。これはサイト本体の `<img>` と同じ仕組みのため、フィードでもサイトと同じ経路で画像が解決される。

### 3. sanitize-html で整形する

`<content:encoded>` 用に、本文として意味のあるタグだけ残す。

- **追加で許可**：`img` / `picture` / `source` / `iframe`（見出し・ruby・kbd・wbr などはデフォルトで許可されている）。
- **`iframe` は YouTube のみ許可**（`allowedIframeHostnames`）。
- **`span` を除外**：span は非セマンティックで、RSS ではサイトの CSS が効かず装飾の意味を持たない。特に**コードブロックのシンタックスハイライト**が大量の入れ子 span（空 span を含む）を生むため、span を許可タグから外して**中身のテキストだけ残す**。結果、コードは `<pre><code>` のプレーンテキストになる。
- `@astrojs/rss` 自身はサニタイズしないため、ここで行う（コンテンツは自前のため XSS 目的ではなく、フィードの妥当性と不要要素の除去が目的）。

### description（抜粋）

`<description>` は、frontmatter の `description` を優先し、無ければ本文冒頭を `extractExcerpt`（`apps/web/src/lib/excerpt.ts`）で抽出する。この抽出ロジックは OGP / meta description と共有しており、フィードとページのメタ情報が揃う。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `apps/web/src/pages/feed-data.json.ts` | listed な記事のメタデータを JSON 出力する中間エンドポイント。ビルド後に削除される |
| `apps/web/scripts/feed-integration.mjs` | `astro:build:done` フック。本文 HTML を取り出し整形して `feed.xml` を生成し、中間ファイルを削除する |
| `apps/web/astro.config.ts` | `feedIntegration({ title, description })` を登録（チャンネルの title / description は `src/consts.ts` から渡す） |
| `apps/web/src/lib/excerpt.ts` | description フォールバック用の冒頭抽出。OGP / meta description と共有 |
| `apps/web/src/layouts/Layout.astro` | `<link rel="alternate" type="application/rss+xml" href="/feed.xml">` を出力 |

## 制約・考慮事項

- **`/feed.xml` は Astro のルートではない**。`astro:build:done` がファイルを直接 `dist/client/feed.xml` に書き出す。静的ホスティングでそのまま配信される。`<link rel="alternate">` のリンク先も解決できる。
- **出力先パスは config から取得する**。クライアント出力ディレクトリは `astro:config:done` の `config.build.client` から取得し、ハードコードしない（Cloudflare アダプタでは `dist/client/`）。記事 HTML の場所は `config.build.format`（既定 `directory` → `<slug>/index.html`）で解決する。
- **中間ファイルは削除する**。`feed-data.json` はビルド後に削除するため公開サイトには残らない。`.json` / `.ts` エンドポイントは sitemap に含まれない（`@astrojs/sitemap` は HTML ページのみ対象）ので、sitemap 側の除外設定は不要。
- **本文抽出は記事ページの構造（`<article>` / `<header>` / `<footer>`）に依存する**。`ArticlePage.astro` のこの構造が前提。テンプレートを変える場合は本ファイルの整形処理も見直す。
- **コードブロックに `<wbr>` が混ざる**。budoux（`rehype-budoux`）がコード内テキストにも分割可能点 `<wbr>` を入れるが、ゼロ幅で不可視のため実害はない（サイト本体の HTML も同様）。

## 依存

- `sanitize-html`（＋ `@types/sanitize-html`）：本文の整形に使用。`.npmrc` の `minimum-release-age=7 days` を満たすバージョンを採用する。
- `@astrojs/rss`：RSS の XML 組み立て。`rss()` は `Response` を返し、`.text()` で本文を取り出して書き出す。

## 検証の観点

ビルド後の `dist/client/feed.xml` で次を確認する。

- XML が整形式である（パースできる）。
- `listed: false` の記事（`banana`）が含まれない。
- 全 item に空でない `<content:encoded>` がある。
- 本文に `<h1>` / `<header>` / `<footer>` / `<span>` / 日付 / タグリンクが含まれない。
- 見出し（h2 / h3）・`<pre><code>`・画像・ruby・kbd が保持される。
- 画像・リンクが絶対 URL になっている（root 相対が残っていない）。
- `<script>` / `astro-island` / レイアウト由来のクラスが混入していない。
- 中間ファイル `feed-data.json` が削除されている。

## 将来の改善（任意・スコープ外）

- コードブロックの色を RSS でも再現したい場合は、Shiki のインライン `style` を許可する案があるが、フィードが大きく肥大化し、多くのリーダーはインラインスタイルを落とすため、現状はプレーンテキストを採用している。
- Astro / アダプタの更新で prerender ランタイムでも Container API が使えるようになれば、中間エンドポイントを介さずエンドポイント内で完結できる可能性がある。
