# バナナブレッドのラジオ ページ移行設計

## 概要

旧サイト `x-shikakun.com-2025` の「バナナブレッドのラジオ」ページとおたよりフォームを、本リポジトリのウェブサイト（`apps/web`）へ移行する。専用のレイアウトは作らず、**他の記事とまったく同じ描画経路（`ArticlePage.astro`）の本文中に、エピソードへのリンクとフォームを埋め込む**、シンプルな構成とする。

このドキュメントは移行の設計方針・主要な判断・追加変更するファイル・実装手順をまとめたものであり、実装そのものは含まない。

## 方針（このドキュメントの前提）

- ページは `src/pages` ではなくContent Collection（`apps/web/src/content/pages/banana.mdx`）として作成する。
- 他の記事と同じレイアウト（`PageHeader` ＋ `<Prose>` でラップした本文 ＋ 日付/タグfooter）で描画する。**専用テンプレートやレイアウトの分岐は作らない**。スキーマ・`[slug].astro`・`Layout.astro` は変更しない。
- 横幅もこのページのために変更しない（既存の記事カラム `max-width: 48rem` のまま）。
- 各エピソードは、本文中にリンクとして埋め込む（凝った一覧UIは作らない）。
- フォームの入力欄とボタンは `@shikakun/react` の `TextField`・`Button` を使う。
- コンポーネントはサブフォルダを作らず、`apps/web/src/components/BananaEpisodeList.astro` のようにフラットに配置する。
- 依存ライブラリは2026年6月時点でモダンかつ広く使われているものを、なるべく最新バージョンで採用する。
- ポッドキャストのロゴは移行しない。

## 移行対象

| 区分 | 移行元 | 移行後の扱い |
| --- | --- | --- |
| ページ | `x-shikakun.com-2025/src/pages/banana/index.astro` | `apps/web/src/content/pages/banana.mdx`（記事として描画） |
| エピソード一覧 | 上記ページ内のRSS取得・描画処理 | `apps/web/src/components/BananaEpisodeList.astro`（ビルド時にRSS取得し、リンクのリストを描画） |
| フォーム | `x-shikakun.com-2025/src/components/MessageForm.tsx` | `apps/web/src/components/BananaMessageForm.tsx`（`@shikakun/react` ベースに書き換え） |
| ロゴ | `x-shikakun.com-2025/src/assets/banana/logo.svg` | 移行しない |

## 移行先の前提（現リポジトリの仕組み）

- `apps/web` はAstro（`output: 'static'`）。`mdx()` と `react()` のintegrationを利用。MDXから `.astro` コンポーネントのインポートと、Reactコンポーネントへの `client:*` ディレクティブの付与ができる。
- Content Collection `pages` は `apps/web/src/content.config.ts` でスキーマ定義され、`apps/web/src/pages/[slug].astro` が全エントリのルートを生成し、`ArticlePage.astro` で描画する。
- `ArticlePage.astro` は本文を `@shikakun/react` の `<Prose>` でラップし、`PageHeader`（h1の見出し）と日付/タグのfooterを付ける。
- トップページ `index.astro` は `pages` のうち `unlisted` でないものを一覧表示する。
- スタイルは素のCSS Module（`*.module.css`）とデザイントークン（`@shikakun/design-tokens`）で記述する。

## 設計

### ページ本体（banana.mdx）

`apps/web/src/content/pages/banana.mdx` を新規作成し、frontmatterと本文を次のように構成する。

- frontmatter
  - `title`: ページタイトル（`PageHeader` がh1として描画する）
  - `description`: 説明文（メタ情報、および必要に応じて本文冒頭でも使用）
  - `unlisted: true`: トップページの記事一覧には載せない（バナナのページは特集的な扱いのため。一覧に出したい場合は外す）
  - 日付・タグは付けない。`ArticlePage.astro` のfooterは中身が空でも要素自体は描画されるが、余白のみで実害はない
- 本文（MDX、`<Prose>` の中に入る）
  - 導入のテキスト
  - 配信プラットフォーム（Apple Podcast・Spotify・Amazon Music・LISTEN）とRSSへのリンク
  - 「最近のエピソード」の見出し ＋ `<BananaEpisodeList />` ＋ ポッドキャストのトップへの「もっと聴く」リンク
  - 「おたより」の見出し ＋ 説明文 ＋ `<BananaMessageForm client:load />`
- インポート（MDX冒頭）
  - `import BananaEpisodeList from '../../components/BananaEpisodeList.astro';`
  - `import BananaMessageForm from '../../components/BananaMessageForm.tsx';`

本文中のリンク（配信プラットフォーム・RSS・「もっと聴く」）は、シンプルさを優先して**Markdownのリンクで記述**し、`<Prose>` のスタイルで表示する。`Button` はフォームの送信ボタンで使う。

> プラットフォームのリンクをボタン表示にしたい場合は `@shikakun/react` の `Button` へ置き換えられる（`Button` は `<a>` を生成し、後述のとおりProseの影響を受けない）。その場合、旧サイトと同じアイコンを付けるなら `react-icons` の追加が必要になる。シンプルさを優先し、まずはアイコンなしのMarkdownリンクを推奨する。

### エピソード一覧（BananaEpisodeList.astro）

`apps/web/src/components/BananaEpisodeList.astro` を新規作成し、ビルド時にRSSを取得して最新のエピソードへのリンクを描画する。

- RSSのURL・表示件数（既定6件）はコンポーネント内の定数として持つ。
- ビルド時に `fetch` でRSSを取得し、後述の `fast-xml-parser` でパースして、タイトル・リンク・公開日（・任意で再生時間）を取り出す。
- 出力は**セマンティックな `<ul>` のリンクリスト**にする。`<Prose>` 配下の `ul`/`li` は通常の箇条書きとして整形されるため、**このコンポーネント専用のCSSは原則不要**（最もシンプル）。
- 公開日の表示は `@shikakun/react` の `FormattedDate`（`date` に `YYYY-MM-DD` 等の文字列を渡す）を使う。
- 旧実装の再生時間（`HH:MM:SS` を分へ丸める処理）は任意。表示するなら丸め処理のヘルパーも移植する。表示しないなら省略してよい（シンプル優先なら省略）。
- カバー画像は移行しない（リモート画像のため、Astroの `<Image />` で最適化するには画像ドメインの許可設定が必要になり、複雑になる。リンクのみで要件を満たせる）。

### おたよりフォーム（BananaMessageForm.tsx）

`apps/web/src/components/BananaMessageForm.tsx`（＋ `BananaMessageForm.module.css`）を新規作成する。旧 `MessageForm.tsx` のロジックを維持しつつ、UIを `@shikakun/react` ベースへ書き換える。

- インポート元を `@shikakun/oden` から `@shikakun/react` へ変更する。
- `FormControl` は `@shikakun/react` に存在しないため使わない。ラベルは `TextField` の `label` propで指定する。
  - 本文欄: `label="本文"`、`rows={8}`、`required`
  - ラジオネーム欄: `label="ラジオネーム（空欄でもOK👌）"`、`autoComplete="name"`
- 送信ボタン: `Button` を `type="submit"`、`appearance="filled"`、`color="primary"`（旧 `interactive` の対応先）、`width="full"`、`disabled={isSubmitting}` で使う。
- 本文未入力時のバリデーションは、`TextField` の `error` ＋ `errorMessage`（`aria-invalid`・`role="alert"`・`aria-describedby` を内部で付与）を使うとアクセシブル。送信時の成功・失敗メッセージは従来どおりフィードバック領域に表示する。
- スタイルは `MessageForm.module.scss` → `BananaMessageForm.module.css` へ移植する（SCSSのmixinは使わず素のCSSとデザイントークンで記述。レスポンシブは素の `@media` で表現）。
- 成功フィードバックの色: 旧実装が使う `--color-semantic-positive-*` は本リポジトリのトークンに存在しない（`primary`/`neutral`/`informative`/`negative` のみ）。成功表示は `informative` 系のトークンへ差し替える。
- インタラクティブなため、MDXでは `<BananaMessageForm client:load />` として配置する。
- APIトークンの扱い: 旧実装はトークンをソースへ直書きしていた。このトークンはクライアントのバンドルに必ず含まれるため本質的に秘匿はできないが、最低限の管理として `import.meta.env.PUBLIC_*`（Astroの公開環境変数）へ移し、直書きを避ける。

### コンポーネントの差分（`@shikakun/oden` → `@shikakun/react`）

#### Button

| 観点 | 旧（oden） | 新（react） | 対応 |
| --- | --- | --- | --- |
| 色 | `color='interactive'` | `primary` \| `neutral` \| `informative` \| `negative`（`interactive` は無い） | `interactive` → `primary` |
| アイコン | `LeadingIcon={Icon}` / `TrailingIcon={Icon}`（コンポーネントを渡す） | `leadingIcon` / `trailingIcon` にReactNodeを渡す | アイコンを使うなら `leadingIcon={<Icon />}` の形へ。今回は基本アイコンなし |
| 外観 | `appearance`: `text` \| `outlined` \| `filled` | `text` \| `outlined` \| `tinted` \| `filled` | そのまま利用可 |
| リンク | `href` / `target` | `href` / `target`（`target='_blank'` 時に `rel` を自動付与） | そのまま利用可 |
| 幅・サイズ | `width='full'` / `size='m'` | `width`: `auto` \| `full` \| `half` \| `third`、`size`: `s` \| `m` | そのまま利用可 |

#### TextField / FormControl

- 旧実装は `FormControl` ＋ `FormControl.Label` ＋ `TextField` の組み合わせ。新 `@shikakun/react` に `FormControl` は無く、`TextField` 自体が `label`・`description`・`error`・`errorMessage`・`required` を内蔵する。
- ラベルは `TextField` の `label` propで指定する。
- `required` を指定すると `TextField` がラベル横に「（必須）」を自動表示する（旧実装には無かった挙動。許容する）。
- 複数行は `rows` で表現する（本文欄 `rows={8}`）。

### `<Prose>` の中に置くことの影響

本文は `ArticlePage.astro` で `<Prose>` にラップされる。Proseは要素セレクタ（`p`・見出し・`ul`/`li`・`table` など）にスタイルを当てるため、埋め込むコンポーネントへの影響を確認した。

- `<a>` にはProseのスタイルが無い → **リンク・`Button`（`<a>` を生成）は影響を受けない**。
- `<ul>`/`<li>` はProseが箇条書きとして整形する → エピソード一覧はこれを活かし、**追加CSSなしで自然な見た目**にできる。
- フォームの `<button>`・`<input>`・`<textarea>`・`<label>`・`<div>` はProseの対象外 → 影響を受けない。
- 例外: コンポーネント内の `<p>`（例: `TextField` のエラーメッセージや説明は内部で `<p>` を生成する）はProseの `p`（均等割付・上下マージン）の影響を受ける。視覚的な軽微な差異にとどまるため許容する。気になる場合は当該テキストの要素や余白を調整する。

### 依存ライブラリ

`apps/web` に追加する依存は次のとおり（最新版は実装時にnpm registryで再確認する）。

- `fast-xml-parser`（2026年6月時点の最新: 5.9.3）: RSSのパースに使う。旧実装の `xml2js`（0.6.2、更新が停滞気味）に対し、メンテナンスが活発で型定義を同梱しており、モダンな選択。ビルド時のみ使用。
- アイコンは使わない方針のため `react-icons` は追加しない（プラットフォームリンクをアイコン付きボタンにする場合のみ、`react-icons` 5.6.0 を追加する）。

## 追加・変更するファイル一覧

新規追加

- `apps/web/src/content/pages/banana.mdx` … ページ本体（frontmatter ＋ 本文。エピソード一覧・フォームのコンポーネントを埋め込む）
- `apps/web/src/components/BananaEpisodeList.astro` … RSSのビルド時取得とリンクリストの描画
- `apps/web/src/components/BananaMessageForm.tsx` … `@shikakun/react` ベースのおたよりフォーム
- `apps/web/src/components/BananaMessageForm.module.css` … フォームのスタイル

変更

- `apps/web/package.json` … `fast-xml-parser` を追加
- （任意）`.env` 系 … `PUBLIC_*` でAPIトークンを管理する場合

変更しないもの（方針どおり）: `apps/web/src/content.config.ts`、`apps/web/src/pages/[slug].astro`、`apps/web/src/layouts/Layout.astro`、`apps/web/src/components/ArticlePage.astro`。

## 残る確認事項（少数）

1. ボタンの色: 旧 `color='interactive'` を `primary` に対応づけてよいか。
2. 成功フィードバックの色: `positive` トークン不在のため `informative` 系へ差し替えてよいか。
3. 一覧掲載: banana を `unlisted: true`（トップページに出さない）でよいか。
4. 再生時間の表示: エピソードに再生時間を表示するか（省略でシンプルに）。
5. APIトークン: 直書きをやめ `import.meta.env.PUBLIC_*` へ移してよいか。
6. URL: 移行後は `/banana`（旧サイトの `/banana/` から末尾スラッシュの有無が変わりうる）。リダイレクト等の考慮が必要か。

## 実装手順（案）

1. `banana.mdx` の骨格（frontmatter ＋ 導入テキスト ＋ 各見出し）を作り、記事として描画されることを確認する。
2. プラットフォーム・RSS・「もっと聴く」のリンクを本文に追加する。
3. `fast-xml-parser` を追加し、`BananaEpisodeList.astro` を実装してRSS取得・リンクリスト描画を疎通させる。
4. `BananaMessageForm.tsx` ＋ `BananaMessageForm.module.css` を `@shikakun/react` ベースで実装し、MDXに `client:load` で配置して送信・バリデーション・フィードバックの動作を確認する。
5. APIトークンを `PUBLIC_*` の環境変数へ移す。
6. `pnpm lint` / `pnpm typecheck`（および関連テスト）を通し、CIが通る状態に整える。

## リスク・確認項目

- MDXでの `.astro`/Reactコンポーネントのインポートと `client:*` の併用が、本リポジトリのremark独自記法（角括弧構文）やrehypeプラグインと干渉しないこと。
- リモートRSSへのビルド時 `fetch` 失敗時の挙動（ビルドを止めるか、空表示でフォールバックするか）を決める。
- コンポーネント内の `<p>`（`TextField` のメッセージ等）がProseの段落スタイルを受ける見た目を許容できること。
- デザイントークンの差し替え（`positive` → `informative`）による色味の変化が許容範囲であること。
```
