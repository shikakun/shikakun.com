# 記事のタイトルから og:image を自動生成する

## 概要

記事ごとの og:image を、以下の優先順位で解決する。

1. 手動で用意した OG 画像（`assets/<slug>/og.png`）があれば、それを使う
2. それ以外は、記事タイトルから自動生成した OG 画像を使う
3. どちらも無ければ、サイト共通の既定 OG 画像を使う

自動生成は **ローカルで叩く Node CLI**（`apps/og`）が担う。CLI は非公開コンテンツリポジトリ `shikakun.com-content` の作業クローンを読み、各記事のタイトルから OG 画像を描画して、同リポジトリの `assets/<slug>/og.png` に書き出す。生成された画像ファイルはコンテンツリポジトリに commit され、既存の sync・ビルドの仕組みでそのまま公開される。

生成は執筆時に一度だけ走らせるバッチで、常設のサーバーやストレージを持たない。生成済み画像は手動 OG 画像とまったく同じパイプライン（`assets/<slug>/og.png` → sync → `astro:assets` で最適化・コンテンツハッシュ付与）に乗るため、配信のためのサイト側コードを増やさない。

## 前提

- 個人サイトで、開発者は本人のみ
- 公開リポジトリは `shikakun.com`、コンテンツは非公開リポジトリ `shikakun.com-content`（[[content-separation]]）
- 本サイトは Astro 6 / Cloudflare（`@astrojs/cloudflare`）でビルド・デプロイされ、`output: 'static'` で静的生成される
- 記事個別の OG 画像は `apps/web/src/components/ArticlePage.astro` が `import.meta.glob('/src/assets/pages/*/og.png', { eager: true })` で収集している
- 記事の slug は `pages/` 直下のファイル名（拡張子なし）で、OG 画像は `assets/<slug>/og.png`（1 階層）。コンテンツはフラット運用のため、`ArticlePage.astro` の glob `/src/assets/pages/*/og.png`（単一 `*`）と整合する。ネストした slug は対象外（必要なら glob と CLI を合わせて拡張する）
- 既定の OG 画像は `apps/web/src/assets/og.png`（`Layout.astro` の `defaultOgImage`）
- 非公開コンテンツは `shikakun.com-content` の `pages/`・`tags/`・`assets/<slug>/...` に置かれ、ビルド前に `apps/web/scripts/sync-content.mjs` がビルドツリーへコピーする。`assets/` は `match: () => true` で全ファイルが sync される
- コンテンツリポジトリの作業クローンは、規約として公開リポジトリと並列の `../shikakun.com-content` に置く（`sync-content.mjs` の `DEFAULT_SOURCE_DIR` と同じ）。`CONTENT_SOURCE_DIR` で上書きできる
- フォントファイル（Inter / Noto Sans JP）とアバター画像は `apps/og/assets/` に commit する。アバターは正円にクロップ済みの透過 PNG として用意する
- カラーは `@shikakun/design-tokens` の `color.green.300` / `color.green.800` を参照する

## 背景・目的

記事数が増えるなかで、すべての記事に手書きで OG 画像を用意するのは現実的でない。タイトルからの自動生成を導入し、SNS でシェアされたときの体験を引き上げる。

生成は執筆フローの一部であり、リクエストごとに動的生成する必要はない。そこで「**ローカルでコマンドを叩いて画像ファイルを作り、コンテンツリポジトリに commit する**」バッチ方式をとる。これにより、

- 画像生成のための常設サーバーやストレージを持たずに済む
- 生成済み画像を手動画像と同じ仕組みで配信し、サイト側のコードを増やさない
- 画像のバイトが変われば `astro:assets` の出力ファイル名（コンテンツハッシュ）が変わり、og:image の URL も自動で更新される（明示のキャッシュ無効化が不要）
- 生成結果を commit 前に git の diff・実ファイルとして目視・レビューできる

を満たす。

## ゴール / 非ゴール

### ゴール

- 各記事の og:image が「手動画像 → 自動生成 → 既定画像」の順で解決される
- 自動生成は `apps/og` の CLI をローカルで実行することで行われ、生成画像が `shikakun.com-content` の `assets/<slug>/og.png` に書き出される
- 自動生成画像のレイアウトが仕様（後述）どおりに描画される
- 同じタイトル・同じテンプレートに対して、生成結果がバイト単位で決定的（再実行しても git の diff が出ない）
- 手動で用意した OG 画像を、CLI が誤って上書きしない
- 本サイトのビルドは外部 API を一切叩かない（従来どおり静的生成のまま）
- CLI のソースコード・テストが本 monorepo で完結する

### 非ゴール

- リクエストごとに画像を動的生成するランタイム（本方式は執筆時のバッチ生成）
- 既存記事の意匠の見直し（OG 画像以外のレイアウト変更）
- 画像生成 SaaS（Vercel OG・Bannerbear など）の利用検討
- Open Graph 以外（Twitter Card 専用画像・各種アイコン）の生成
- ホーム・タグ・一覧など記事以外のページの OG 自動生成（既定 OG 画像のまま）
- 生成画像の自動 commit・自動 push（git 操作は手動で行う）

## 用語

- **生成 CLI**: 本 issue で新設する `apps/og`。タイトルから OG 画像を描画してコンテンツリポジトリへ書き出す Node CLI（`@shikakun/og`）
- **手動 OG 画像**: 著者が自分で用意した `assets/<slug>/og.png`。生成 marker を持たない PNG
- **生成 OG 画像**: 生成 CLI が描画した `assets/<slug>/og.png`。PNG メタデータに生成 marker を持つ
- **生成 marker**: 生成 CLI が PNG に埋め込む provenance 情報（tEXt チャンク `Software=@shikakun/og`）。手動画像と生成画像を見分け、生成画像だけを上書き対象にするための印
- **コンテンツ作業クローン**: ローカルにある `shikakun.com-content` の作業ツリー。既定は `../shikakun.com-content`、`CONTENT_SOURCE_DIR` で上書き可

## 現状の把握

- 既定 OG 画像は `apps/web/src/assets/og.png`
- 記事個別の OG 画像は `apps/web/src/components/ArticlePage.astro` の `import.meta.glob` で `/src/assets/pages/<slug>/og.png` から収集し、`ImageMetadata` として `Layout.astro` に渡している
- `Layout.astro` は `ImageMetadata` から `new URL(ogImage.src, Astro.site)` で絶対 URL を作り、`og:image` / `og:image:type` / `og:image:width` / `og:image:height` / `og:image:alt` を出力する。画像が手動か生成かは関知しない
- したがって、生成画像を `assets/<slug>/og.png` に置けば、**サイト側のコード変更なしに**既存の収集・出力経路へ乗る
- monorepo は `apps/web`（Astro）・`packages/design-tokens`・`packages/react` を抱える pnpm workspace（`pnpm-workspace.yaml` は `apps/*` / `packages/*`）
- `sync-content.mjs` の `assets` マッピングは `match: () => true` のため、`assets/<slug>/og.png` は追加実装なしで sync される
- 記事本文には `rehype-budoux` が導入済み（`apps/web/package.json`、`astro.config.ts`）。OG 用には JS 版 `budoux` を別途使う

## 要求定義

### 機能要求

- **FR-1**: 各記事の og:image は次の優先順位で決まる
  1. `assets/<slug>/og.png` が存在すれば、それ（手動・生成のどちらでも）
  2. 無ければ、サイト共通の既定 OG 画像
  - 「自動生成」は実行時の分岐ではなく、執筆時に生成 CLI が 1 の `og.png` を用意することで実現する
- **FR-2**: 生成 CLI は monorepo の workspace パッケージ `apps/og`（`@shikakun/og`）として管理される
- **FR-3**: 生成 CLI は、コンテンツ作業クローンの `pages/*.{md,mdx}` を走査し、各ページのフロントマター `title` から OG 画像（1280×670 PNG）を描画して、同クローンの `assets/<slug>/og.png` に書き出す
- **FR-4**: 生成 CLI は、手動 OG 画像（生成 marker を持たない `og.png`）を**上書きしない**。生成 marker を持つ画像だけを再描画・上書きする
- **FR-5**: 生成 CLI は決定的である。同じタイトル・同じテンプレート・同じフォントに対して、常に同一バイト列の PNG を出力する
- **FR-6**: 生成 CLI は、生成 marker を持つが対応するページが存在しない `og.png`（記事削除・手動画像追加による孤児）を削除（prune）する
- **FR-7**: 画像の意匠は「設計：画像仕様」に従う
- **FR-8**: アバター画像とフォントは `apps/og/assets/` に commit され、CLI のバンドルに同梱される
- **FR-9**: 生成画像はコンテンツリポジトリに commit され、既存の sync・`astro:assets` でそのまま配信される。本サイトのビルド・配信に新しい依存を追加しない
- **FR-10**: タイトル文字列は描画前に **NFC 正規化 + 前後空白の trim** を適用する

### 非機能要求

- **NFR-1**: 本サイトのビルド・配信は外部 API を一切叩かない（従来どおり `output: 'static'`）
- **NFR-2**: 生成 CLI は全記事（現状 17 ページ規模）を数秒〜十数秒で再生成できる
- **NFR-3**: 生成結果が決定的で、意味のある変更が無ければ git の diff が出ない
- **NFR-4**: 生成 CLI のコードは TypeScript で書き、`pnpm --filter @shikakun/og` で `generate` / `typecheck` / `lint` / `test` できる。記事生成はルートの `pnpm og:generate`（内部で `pnpm --filter @shikakun/og generate` を呼ぶ）でも実行できる
- **NFR-5**: 生成 CLI の単体テスト（少なくとも画像生成の決定性・3 行超の省略・タイトル正規化・生成 marker の読み書きと手動画像のスキップ）が CI で実行される
- **NFR-6**: 既存の手動 `og.png` の挙動は変えない（後方互換）。手動画像は CLI 実行後も不変
- **NFR-7**: コンテンツ作業クローンを解決できない場合、生成 CLI は no-op で黙って成功するのではなく、明確なエラーで終了する（書き込み先が無い状態を検知する）

## 受け入れ条件

以下がすべて満たされること。

- [ ] **AC-1**: `apps/og/` が monorepo の workspace として認識され、`pnpm --filter @shikakun/og typecheck` / `lint` / `test` / `generate` が動作する。ルートの `pnpm og:generate` も同じ生成を実行する
- [ ] **AC-2**: `pnpm og:generate` を実行すると、手動画像を持たない各記事について `<コンテンツ作業クローン>/assets/<slug>/og.png` が 1280×670 の PNG として生成される
- [ ] **AC-3**: 生成画像には生成 marker（tEXt `Software=@shikakun/og`）が埋め込まれている
- [ ] **AC-4**: 手動 OG 画像（生成 marker を持たない `og.png`）が存在する記事では、CLI を実行しても当該ファイルが一切変更されない
- [ ] **AC-5**: 生成 CLI を 2 回連続で実行したとき、2 回目の実行後に git の作業ツリーに差分が出ない（決定性）
- [ ] **AC-6**: 記事を削除（または手動画像を追加）した後に CLI を実行すると、孤児になった生成 `og.png` が削除される
- [ ] **AC-7**: 生成画像を commit してサイトをビルドすると、当該記事の og:image が `https://shikakun.com/_astro/...` のコンテンツハッシュ付き URL になり、`og:image:width` が 1280、`og:image:height` が 670、`og:image:type` が `image/png`、`og:image:alt` が記事タイトルになる
- [ ] **AC-8**: 手動 OG 画像を持つ記事は、その画像が og:image に設定される（生成画像で上書きされない）
- [ ] **AC-9**: OG 画像を一切持たない記事は、既定 OG 画像が og:image に設定される
- [ ] **AC-10**: 100 文字級の日本語タイトルを渡したとき、BudouX による自然な改行と 3 行超の `…` 省略が適用される
- [ ] **AC-11**: 「「」 などの先頭全角約物が、左端の余白を空けずに詰まって配置される
- [ ] **AC-12**: 画像生成関数が、同一入力で同一バイト列を返す（決定性）
- [ ] **AC-13**: NFC 同型の文字列（例: 合成済み「が」と分解「か + ゛」）が同じ画像に解決される
- [ ] **AC-14**: コンテンツ作業クローンを解決できない場合、CLI が非ゼロ終了し、原因（作業クローンが見つからない旨）を出力する
- [ ] **AC-15**: 本サイトのビルドが外部 API に接続しない（従来どおり）
- [ ] **AC-16**: `apps/og/README.md` に、生成・意匠変更時の再生成・手動画像の扱い・commit の手順が記載される
- [ ] **AC-17**: フロントマターに `title` を持たないページはスキップされ、警告が出る（生成も prune もしない）
- [ ] **AC-18**: `--slug` 指定時は prune を行わない。`--check` は生成差分に加え、prune 対象（孤児）の有無も検出する

## 設計

### 全体構成

```text
[ローカル（執筆時）]
  shikakun.com-content（作業クローン, ../shikakun.com-content）
   ├─ pages/<slug>.mdx        ← title をフロントマターから読む
   └─ assets/<slug>/og.png    ← 生成 CLI が書き出す（手動画像はそのまま）
        ▲
        │ pnpm og:generate
        │
  apps/og（@shikakun/og CLI）
   ├─ pages を走査し title を取得
   ├─ 既存 og.png の生成 marker を確認
   │    ├─ marker あり（生成物） → 再描画して上書き
   │    ├─ marker なし（手動）   → スキップ（不可侵）
   │    └─ ファイルなし          → 新規描画
   ├─ satori で SVG → @resvg/resvg-js で PNG 化 → 生成 marker を付与
   └─ 孤児（対応ページなしの生成 og.png）を prune

        │ 著者が手動で commit / push（git 操作は手動）
        ▼
[デプロイ（既存のフロー）]
  shikakun.com ビルド
   ├─ sync-content.mjs が assets/<slug>/og.png をビルドツリーへコピー
   ├─ ArticlePage.astro が import.meta.glob で og.png を収集（変更不要）
   └─ astro:assets が最適化・コンテンツハッシュ付与 → <meta og:image>
```

### 生成画像の置き場と provenance

- 生成画像は手動画像と同じ `assets/<slug>/og.png` に置く。配信側は両者を区別せず 1 枚の `og.png` として扱うため、サイト側のコード変更が要らない
- 手動画像を誤って上書きしないために、**生成画像には PNG の tEXt チャンクで生成 marker を埋め込む**。サイドカーファイルや別ディレクトリ・マニフェストを増やさず、画像自身が「自分は生成物である」ことを表明する
  - 生成 marker: tEXt `Software=@shikakun/og`（Latin-1 ASCII）
  - 補助情報として、デバッグ用に iTXt `Title=<正規化済みタイトル>`（UTF-8）を併記してもよい（任意・決定的に書く）
- CLI の上書き判定:
  - `assets/<slug>/og.png` が無い → 新規描画して書き出す
  - ある & 生成 marker を持つ → 自分の生成物。再描画して上書きする
  - ある & 生成 marker を持たない → 手動画像。一切触らない
- 手動画像へ切り替えたい記事は、著者が当該 `og.png` を手で差し替える（marker が消えるため、以後 CLI は不可侵として扱う）。逆に自動生成へ戻したいときは、手動 `og.png` を削除して CLI を再実行する

### 画像仕様

**サイズ**: 1280×670 PNG。`og:image:width` / `og:image:height` は `astro:assets` が画像メタから自動出力する（`Layout.astro` の既存処理）。

**背景・枠線**:

- 背景: `#ffffff`
- 枠線: 画像の最外周内側に 16px solid `color.green.300`（`#b7e1c4`）

**配置（座標は画像左上原点・単位 px）**:

- 左右パディング: 画像端から 96px（コンテンツ領域は `x: 96 - 1184`、幅 1088px）
- 下マージン: 画像下端から 96px を確保（X（Twitter）のオーバーレイ UI とタイトル文字の重なりを避けるため）
- 縦方向の中央揃え基準: 画像下端から 96px を除いた**上から 574px の領域**で、コンテンツブロック（アバター + 名前の行 → 行間 → 記事タイトルブロック）全体を上下中央に配置する
- コンテンツブロックは左寄せ

**アバター + 名前の行**:

- アバター: 直径 72px の正円。素材は事前に正円クロップ済み透過 PNG として `apps/og/assets/avatar.png` にコミットする（推奨ピクセルサイズ 144×144 以上）
- アバターの右に水平 24px のギャップを置き、`shikakun` の文字を配置する
- `shikakun` の縦位置: アバターの中心線とテキストの光学中心がほぼ揃うように、line-box の中心で揃える

**`shikakun` の文字**:

- 文字列: `shikakun`
- フォント: Inter Medium + Noto Sans JP Medium
- font-size: 48px / line-height: 72px
- 色: `color.green.800`（`#405d4a`）

**記事タイトル**:

- 「アバター + 名前の行」と「記事タイトルの 1 行目」の縦間隔は 48px
- フォント: Inter SemiBold + Noto Sans JP SemiBold
- font-size: 64px / line-height: 96px
- 色: `color.green.800`（`#405d4a`）
- 左寄せ
- 最大 3 行。4 行目以降は描画せず、3 行目の末尾を `…`（U+2026 HORIZONTAL ELLIPSIS）で省略する

**タイポグラフィ**:

- `font-feature-settings: 'kern' 1, 'palt' 1, 'chws' 1`
- BudouX（JS 版・`Parser.loadDefaultJapaneseParser()`）で記事タイトルを分節し、satori が折り返せる改行候補として配置する
- 3 行超の省略は、計測ベース（行数を満たすまで二分探索で末尾を削り、末尾に `…` を付ける）で実装し、決定的にする

### 生成 CLI（`apps/og`）

**スタック**:

- TypeScript の Node CLI（一度きりのバッチ実行で、常駐サーバーは持たない。ビルド or `tsx` 実行）
- 画像レイアウト: satori（JSX 風のレイアウトを SVG 化。グリフをパス化して埋め込む）
- ラスタライズ: `@resvg/resvg-js`（ネイティブ。SVG → PNG）。ローカル実行のため wasm 版でなくネイティブ版を使う（高速）
- 改行候補挿入: budoux（JS 版）
- フロントマター解析: `gray-matter`（`title` と本文先頭の取得）
- PNG チャンク（tEXt / iTXt）の読み書き: 小さな自前ユーティリティ（PNG のチャンク構造は単純なので追加の重い依存を避け、決定的な書き出しを自分で制御する）

**入出力**:

- 入力: コンテンツ作業クローンの `pages/*.{md,mdx}`（フロントマター `title`、ファイル名から slug）
- 出力: 同クローンの `assets/<slug>/og.png`

**コンテンツ作業クローンの解決**:

- `CONTENT_SOURCE_DIR` があればそれ、無ければ規約の `../shikakun.com-content`（`sync-content.mjs` の `DEFAULT_SOURCE_DIR` と同じ解決）
- 解決できない、または書き込めない場合はエラーで終了する（生成 CLI は書き込みが目的なので、sync のような no-op フォールバックはしない）

**CLI オプション（案）**:

| オプション | 役割 |
| --- | --- |
| （なし） | 手動画像を持たない全記事について生成・更新し、孤児を prune する |
| `--slug <slug>` | 指定記事だけを対象にする（prune は行わない） |
| `--check` | 書き込まず、生成結果が現在のファイルと一致するか、かつ prune 対象の孤児が無いかを検査する。差分があれば非ゼロ終了（commit 前の自己チェック用。ローカルでの実行を主とする） |

**処理の流れ（1 記事ぶん）**:

1. フロントマター `title` を取得し、`title.normalize('NFC').trim()` で正規化する（`title` が無いページはスキップし、警告を出す）
2. 既存 `assets/<slug>/og.png` を読み、生成 marker の有無を確認する
   - marker 無し（手動）→ スキップ
3. BudouX で分節 → satori でレイアウト（3 行超は二分探索で `…` 省略）→ SVG
4. `@resvg/resvg-js` で 1280×670 PNG にラスタライズ
5. tEXt `Software=@shikakun/og`（必要なら iTXt `Title`）を付与する
6. `--check` でなければ一時ファイル経由の atomic write で書き出し（`sync-content.mjs` と同じく書き込み途中の破損を避ける）、`--check` なら現在のファイルとバイト比較する
7. 全記事を対象にした実行（`--slug` 指定なし）の最後に、生成 marker を持つが対応ページが無い `og.png` を prune する

**決定性**:

- フォントとライブラリのバージョンを固定し、同じ `(タイトル, テンプレート)` には同一バイト列の PNG を出力する。satori / `@resvg/resvg-js` / budoux と同梱フォントは、`package.json` で `^` を付けず厳密なバージョンに固定する（決定性のため）
- tEXt / iTXt に書く値も固定（生成日時など非決定的な値は埋め込まない）
- これにより、意味のある変更が無ければ再実行しても git の diff が出ない。意匠を変えたいときはテンプレートのコードを直して再実行すると、影響する PNG だけがバイト変化して diff に現れる

### 再生成とキャッシュの扱い

- 意匠の変更は「テンプレートのコードを直して再生成 → 変わった PNG を commit」で完結する。生成は決定的なので、コード変更が即バイト変化に対応する
- 配信側では `astro:assets` が画像のバイトからコンテンツハッシュ付きのファイル名（`/_astro/og.<hash>.png`）を生成するため、画像が変われば og:image の URL も自動で変わり、SNS 側の再取得が促される
- そのため、テンプレート版数を表す明示の定数（`TEMPLATE_VERSION` など）は持たない。決定的生成とコンテンツハッシュで足りる

### フォント・アバター素材

- Inter / Noto Sans JP の SemiBold と Medium の 2 ウェイトを `apps/og/assets/fonts/` に置く。subset 化は必須ではないが、リポジトリを軽く保つために subset 化してもよい
- 日本語を含むタイトルを満たすグリフカバレッジを確保する（subset する場合は JIS 第一・第二水準 + 一般的な記号類に加え、省略記号 `…`（U+2026）を含める）
- バンドルするフォントのライセンス（Inter / Noto Sans JP ともに SIL OFL）に従い、`apps/og/assets/fonts/` にライセンス全文を同梱する
- アバターは正円クロップ済みの透過 PNG。`apps/og/assets/avatar.png` に置く。ピクセルサイズは 144×144 以上

### サイト側（`apps/web`）の変更

- **コード変更は不要**。生成画像は `assets/<slug>/og.png` に収まり、既存の `sync-content.mjs`・`ArticlePage.astro`・`Layout.astro` がそのまま扱う
- 唯一の運用上の前提として、**手動 OG 画像は `og.png` で用意する**（`ArticlePage.astro` の収集対象が `og.png` のため）。これは現状の挙動どおりで、追加の制約ではない
- OG 画像のために、サイト側へ新しい環境変数・URL 生成ユーティリティ・ビルド設定を追加する必要はない

### 運用フロー

1. 記事を `shikakun.com-content` の `pages/<slug>.mdx` に書く（手動 OG 画像を使う記事は `assets/<slug>/og.png` を自分で置く）
2. 公開リポジトリ側で `pnpm og:generate` を実行する
3. CLI がコンテンツ作業クローンの `assets/<slug>/og.png` を生成・更新し、孤児を prune する
4. コンテンツリポジトリ側で生成画像を確認し、commit / push する（git 操作は手動）
5. デプロイ（push 契機・毎日 0 時の定期・手動）で sync・ビルドされ、生成画像が公開される

意匠を変えたいときは、`apps/og` のテンプレートを直して `generate` を再実行し、バイトが変わった PNG を commit する。

### テスト戦略

- **決定性**: 同一の `(タイトル, テンプレート)` への画像生成が、同じバイト列を返す。`--check` を 2 回実行しても差分が出ない
- **手動画像の不可侵**: 生成 marker を持たない `og.png` を置いた状態で `generate` しても、当該ファイルが変わらない
- **生成 marker の読み書き**: 書き出した PNG から tEXt `Software=@shikakun/og` を読み戻せる
- **3 行超の省略**: 100 文字級の日本語入力で 3 行以内に収まり、末尾が `…` で終わる
- **タイトル正規化**: NFC 同型の文字列が同じ画像（同じバイト列）になる
- **prune**: 対応ページの無い生成 `og.png` が削除される
- **視覚回帰**: 参照 PNG 1 枚をリポジトリに置き、生成結果をハッシュ比較する（細部調整中はスキップ可）

## 実装手順

1. `apps/og/` を新設して pnpm workspace に追加し、ルートに `pnpm og:generate`（→ `pnpm --filter @shikakun/og generate`）を生やす（`@shikakun/og`）
2. satori + `@resvg/resvg-js` で「タイトル → 1280×670 PNG」を最小実装する
3. レイアウト・フォント・アバターを組み込み、`kern` / `palt` / `chws` を有効化する
4. BudouX 連携と 3 行超の `…` 省略を実装する
5. タイトル正規化（NFC + trim）を実装する
6. PNG の tEXt / iTXt 読み書きユーティリティと、生成 marker の付与・判定を実装する
7. 手動画像のスキップ（marker 無しは不可侵）を実装する
8. コンテンツ作業クローンの解決（`CONTENT_SOURCE_DIR` / 既定パス）と、解決失敗時のエラー終了を実装する
9. `pages/` 走査 → 各記事の生成・更新・書き出しを実装する
10. 孤児の prune を実装する
11. `--slug` / `--check` オプションを実装する
12. 単体テスト（決定性・省略・正規化・marker 読み書き・手動画像の不可侵・prune）を整える
13. `apps/og/README.md` に運用手順（生成・意匠変更時の再生成・手動画像の扱い・commit）を書く
14. ローカルで全記事を生成し、コンテンツリポジトリへ commit して本番ビルドで動作確認する

## リスク・考慮事項

- **環境差による非決定性**: `@resvg/resvg-js` はネイティブのため、OS / アーキテクチャが変わると生成バイトが微妙に変わりうる。単一開発者・同一環境（必要なら `.devcontainer` でピン留め）での運用を前提にする。CI で `--check` を回す場合は、生成に使う環境と CI 環境を揃える
- **生成 marker の取り違え**: 手動画像が偶然 tEXt `Software=@shikakun/og` を持つと生成物と誤認される。marker は「生成 CLI の所有印」と定義し、手動画像には付けない運用とする
- **タイトル変更時の追従漏れ**: 記事タイトルを変えても `generate` を再実行しないと OG 画像が古いまま残る。執筆フローに「タイトルを変えたら再生成」を含め、`apps/og/README.md` に明記する。`--check` を commit 前の確認に使える
- **satori の OpenType サポート**: `palt` / `chws` がフォントによっては期待どおりに効かないケースがある。事前に PoC で確認する
- **生成漏れ（commit 忘れ）**: 生成しても commit / push しなければ公開されない。手動 commit のため、生成 → 確認 → commit を運用手順として固定する
- **3 行省略の安定性**: フォントメトリクス上で二分探索の境界が環境依存にならないよう、計測に使うフォント・サイズを固定する

## 要検証

- satori + `@resvg/resvg-js` のローカル生成での描画品質と速度（全記事を数秒〜十数秒で再生成できること）
- `@resvg/resvg-js` の出力が同一環境で完全に決定的であること（`--check` で差分が出ないこと）
- `font-feature-settings: 'palt' 1` / `'chws' 1` が satori で意図どおりに適用されること
- 3 行超の省略がフォントメトリクス上で安定して動くこと
- PNG への tEXt / iTXt 付与が決定的で、`astro:assets` の最適化を通しても問題なく配信されること（メタが落ちても provenance 判定は生成前の元ファイルに対して行うため配信には影響しない）
- `gray-matter` で `pages/*.{md,mdx}` のフロントマター `title` を確実に取得できること
- `astro:assets` が生成 PNG を 1280×670 / `image/png` のまま出力し、想定外の再エンコードや形式変換で `og:image:width` / `height` / `type` がずれないこと

## タスク分解（進捗管理）

- [ ] `apps/og/` を新規作成し、pnpm workspace に追加する
- [ ] ルートに `pnpm og:generate` スクリプトを追加する
- [ ] satori + `@resvg/resvg-js` で 1280×670 PNG を生成する最小実装
- [ ] レイアウト・配色・フォント・アバター配置を実装する
- [ ] OpenType の `kern` / `palt` / `chws` を有効化する
- [ ] BudouX 連携と 3 行超の `…` 省略を実装する
- [ ] タイトル正規化（NFC + trim）を実装する
- [ ] PNG の tEXt / iTXt 読み書きユーティリティを実装する
- [ ] 生成 marker の付与・判定と、手動画像のスキップを実装する
- [ ] コンテンツ作業クローンの解決と、解決失敗時のエラー終了を実装する
- [ ] `pages/` 走査 → 各記事の生成・更新・書き出しを実装する
- [ ] 孤児の prune を実装する
- [ ] `--slug` / `--check` オプションを実装する
- [ ] 単体テスト（決定性・省略・正規化・marker・手動画像の不可侵・prune）を整える
- [ ] `apps/og/README.md` に運用手順を書く
- [ ] ローカルで全記事を生成し、commit して本番ビルドで動作確認する

## 補足

### 決定事項

- **方式**: ローカルで叩く Node CLI（`apps/og` / `@shikakun/og`）でバッチ生成し、生成画像をコンテンツリポジトリに commit する。常設のサーバーやストレージは持たない
- **配置**: `apps/og`（`private: true`、npm 非公開の実行ツール）。`packages/*` は changesets で GitHub Packages に公開するライブラリ群（`private: false` + `publishConfig`）であり、`.changeset/config.json` の `ignore: []` で非 private が公開対象になるため、公開しない CLI は `apps/` に置く
- **実行コマンド**: ルートの `pnpm og:generate`（内部は `pnpm --filter @shikakun/og generate`）
- **生成対象**: `pages/` の記事ページのみ。ホーム・タグ・一覧ページは既定 OG 画像のまま
- **生成画像の置き場**: 手動・生成とも `assets/<slug>/og.png`（共用）
- **手動と生成の判別**: PNG の tEXt `Software=@shikakun/og`（生成 marker）の有無。marker 無しは手動画像として不可侵
- **再生成の管理**: 決定的生成 + `astro:assets` のコンテンツハッシュに委ねる。テンプレート版数のような明示のバージョン定数は持たない
- **サイト側の変更**: なし（既存の `sync-content.mjs` / `ArticlePage.astro` / `Layout.astro` がそのまま扱う）
- **画像サイズ**: 1280×670 PNG
- **枠線**: 16px solid `color.green.300`（`#b7e1c4`）
- **背景色**: `#ffffff`
- **文字色**: `color.green.800`（`#405d4a`）
- **左右パディング**: 96px
- **下部の安全余白**: 96px
- **縦方向の中央揃え基準**: 上から 574px の領域でコンテンツ全体を上下中央
- **アバター**: 直径 72px、正円クロップ済み透過 PNG（144×144 以上）、枠線なし
- **`shikakun` テキスト**: Inter Medium + Noto Sans JP Medium、48px / 72px
- **記事タイトル**: Inter SemiBold + Noto Sans JP SemiBold、64px / 96px、最大 3 行、超過分は `…`（U+2026）
- **`shikakun` 行とタイトル 1 行目の縦間隔**: 48px
- **アバターと `shikakun` 文字の水平ギャップ**: 24px
- **タイトル正規化**: NFC + trim
- **生成 CLI のスタック**: satori + `@resvg/resvg-js` + budoux + gray-matter（+ 自前の PNG チャンクユーティリティ）
- **コンテンツ作業クローンの解決**: `CONTENT_SOURCE_DIR` → 既定 `../shikakun.com-content`。解決失敗時はエラー終了
- **git 操作**: 生成画像の commit / push は手動で行う（自動 commit はしない）
