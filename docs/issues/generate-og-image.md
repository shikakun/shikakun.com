# 記事のタイトルから og:image を自動生成する

## 概要

記事ごとの og:image を、以下の優先順位で解決する。

1. 非公開リポジトリの `assets/<slug>/og.png` または `og.jpg` が存在すれば、それを使う
2. それ以外は、記事タイトルから自動生成した OG 画像を使う

自動生成は Cloudflare Workers の独立アプリ `apps/og` として monorepo で開発し、`og.shikakun.com` で公開する。本サイトのビルドは「タイトル＋テンプレート版数」を入力に署名付き GET URL を組み立てて `<meta property="og:image">` に出力するだけで、ビルドから API への HTTP 呼び出しは行わない。Worker は R2 をコンテンツアドレス（タイトル＋テンプレート版数のハッシュ）でのキャッシュとして使い、SNS クローラからの初回 GET 時に画像を生成して以後はキャッシュから返す。

書き込み系（強制再生成・キャッシュ削除）は POST エンドポイントで提供し、`apps/web/.env` で管理する API トークンで保護する。

## 前提

- 個人サイトで、開発者は本人のみ
- 公開リポジトリは `shikakun.com`、コンテンツは非公開リポジトリ `shikakun.com-content`（[[content-separation]]）
- 本サイトは Astro 6 / Cloudflare（`@astrojs/cloudflare`）でビルド・デプロイされ、`output: 'static'` で静的生成される
- 記事個別の OG 画像は `apps/web/src/components/ArticlePage.astro` が `import.meta.glob('/src/assets/pages/*/og.png', { eager: true })` で収集している
- 既定の OG 画像は `apps/web/src/assets/og.png`（`Layout.astro` の `defaultOgImage`）
- フォントファイル（Inter / Noto Sans JP）とアバター画像は別途 monorepo に commit する。アバターは正円にクロップ済みの透過 PNG として用意する
- カラーは `@shikakun/design-tokens` の `color.green.300` / `color.green.800` を参照する
- Cloudflare Workers は Paid plan（$5/月）を有効化する

## 背景・目的

記事数が増えるなかで、すべての記事に手書きで OG 画像を用意するのは現実的でない。タイトルからの自動生成を導入し、SNS でシェアされたときの体験を引き上げる。

合わせて、

- 生成処理を本サイトと分離し、Astro ビルド・デプロイの遅延要因にしない
- 記事数に比例してビルド時間が伸びないよう、ビルドからは API を一切叩かない
- 意匠を変えたいときはテンプレート版数を上げるだけで、明示のキャッシュ削除手順を踏まなくてよい
- og:image の URL は実体を指す GET URL であり、SNS クローラからもブラウザからも素直に取得できる

を満たす。

## ゴール / 非ゴール

### ゴール

- 各記事の og:image が「手動画像 → 自動生成 → 既定画像」の順で解決される
- 自動生成画像のレイアウトが仕様（後述）どおりに描画される
- 本サイトのビルド時間が、自動生成対象の記事数に対してほぼ一定（ビルドが API を叩かない）
- 同一の `(タイトル, テンプレート版数)` での再生成が発生しない
- テンプレート版数を上げると、当該版数の URL は一斉に新規キャッシュへ移行する
- 強制再生成・キャッシュ削除は API トークンで保護される
- API サーバーのソースコード・テスト・デプロイ設定が本 monorepo で完結する

### 非ゴール

- 既存記事の意匠の見直し（OG 画像以外のレイアウト変更）
- 画像生成 SaaS（Vercel OG・Bannerbear など）の利用検討
- Open Graph 以外（Twitter Card 専用画像・各種アイコン）の生成
- 既存の手動 `og.png` / `og.jpg` 群の削除・差し替え

## 用語

- **og API**: Cloudflare Worker で動く OG 画像生成サーバー。本 issue で新設する `apps/og`
- **テンプレート版数**: 配色・フォント・レイアウトの組み合わせを一意に識別するバージョン。`apps/og/src/template.ts` の定数で持つ。初期値は `v1`
- **コンテンツアドレス**: タイトル正規化後の文字列とテンプレート版数を入力にしたハッシュ値で R2 のキーを決める方式
- **書き込みトークン**: 強制再生成・キャッシュ削除で必要な API トークン。`apps/web/.env` の `OG_API_WRITE_TOKEN`
- **署名キー**: 公開 GET URL の HMAC 署名に使う共有鍵。`apps/web/.env` の `OG_API_SIGNING_KEY`（Worker secret と同じ値）

## 現状の把握

- 既定 OG 画像は `apps/web/src/assets/og.png`
- 記事個別の OG 画像は `apps/web/src/components/ArticlePage.astro` の `import.meta.glob` で `/src/assets/pages/<slug>/og.png` から収集
- `Layout.astro` は `ImageMetadata` を受け取り、`og:image` / `og:image:type` / `og:image:width` / `og:image:height` / `og:image:alt` を出力
- monorepo は `apps/web`（Astro）・`packages/design-tokens`・`packages/react` を抱える pnpm workspace
- Astro の env field は `astro:env/server` で扱う（既存例: `apps/web/src/pages/api/banana-message.ts`）
- 非公開コンテンツは `shikakun.com-content` の `assets/<slug>/...` に置かれ、ビルド前に `apps/web/scripts/sync-content.mjs` がビルドツリーへコピーする
- 記事本文には `rehype-budoux` が導入済み（`apps/web/package.json`、`astro.config.ts`）。OG 用には JS 版 `budoux` を別途使う

## 要求定義

### 機能要求

- **FR-1**: 各記事の og:image は次の優先順位で決まる
  1. `assets/<slug>/og.png` または `assets/<slug>/og.jpg` が存在すれば、それ
  2. なければ、og API が生成した「タイトル＋テンプレート版数」由来の画像（1280×670 PNG）
  3. それも利用不可（`OG_API_SIGNING_KEY` 未設定など）なら、サイト共通の既定 OG 画像
- **FR-2**: og API は Cloudflare Workers のスタンドアロンアプリ `apps/og/` で管理される
- **FR-3**: og API は次のエンドポイントを公開する
  - `GET /{templateVersion}/{hash}.png?title=<title>&sig=<hmac>`（公開・HMAC 署名）
  - `POST /admin/regenerate`（書き込みトークン・R2 オブジェクトを再生成 + 当該 URL の Cloudflare エッジキャッシュを Purge）
  - `POST /admin/purge`（書き込みトークン・R2 オブジェクトを削除 + 当該 URL の Cloudflare エッジキャッシュを Purge）
  - `GET /healthz`（疎通用）
- **FR-4**: 本サイトのビルドは、自動生成対象の og:image について HTTP リクエストを行わない。`og.shikakun.com` 配下の署名付き GET URL を組み立て、`<meta property="og:image">` に出力するだけにする
- **FR-5**: og API はコンテンツアドレス・キャッシュ（R2）を持つ。同じ `(タイトル, テンプレート版数)` の組への 2 回目以降の GET は、再生成せずキャッシュから返す
- **FR-6**: og API は `Cache-Control: public, max-age=31536000, immutable` を返す
- **FR-7**: 画像の意匠は「設計：画像仕様」に従う
- **FR-8**: アバター画像とフォントは `apps/og/assets/` に commit され、Worker のビルドに同梱される
- **FR-9**: テンプレート版数は `apps/og/src/template.ts` のソースコード定数で一元管理され、値を上げると URL のパスが変わって全自動生成画像が新キャッシュ扱いになる
- **FR-10**: タイトル文字列は HMAC 計算と R2 キー算出の前に **NFC 正規化 + 前後空白の trim** を適用する（サイト側・Worker 側で同じ前処理）

### 非機能要求

- **NFR-1**: 本サイトのビルド時間は、自動生成対象の記事数の増減に対してほぼ一定
- **NFR-2**: og API の R2 ヒット時のレスポンスは P50 で 100ms 未満
- **NFR-3**: og API のミス（新規生成）時のレスポンスは P50 で 2s 未満
- **NFR-4**: 公開 GET エンドポイントは HMAC 署名検証を通過した URL のみ受け付ける（DoS・課金事故防止）
- **NFR-5**: 書き込みエンドポイントは `Authorization: Bearer <OG_API_WRITE_TOKEN>` で保護する
- **NFR-6**: og API のコードは TypeScript で書き、`pnpm --filter @shikakun/og` で `dev` / `deploy` / `typecheck` / `lint` / `test` できる
- **NFR-7**: og API の単体テスト（少なくとも画像生成関数の決定性・3 行超の省略・タイトル正規化・HMAC 検証）が CI で実行される
- **NFR-8**: 既存の手動 `og.png` の挙動は変えない（後方互換）
- **NFR-9**: タイトル長は正規化後 200 文字以内に制限する。超過は 400 を返す
- **NFR-10**: 本サイト側で `OG_API_SIGNING_KEY` が未設定でも、ビルドは失敗しない（自動生成 URL を組み立てず既定 OG 画像にフォールバックする）

## 受け入れ条件

以下がすべて満たされること。

- [ ] **AC-1**: `apps/og/` が monorepo の workspace として認識され、`pnpm --filter @shikakun/og typecheck` / `lint` / `test` / `dev` / `deploy` が動作する
- [ ] **AC-2**: ローカルで og API を起動し、`GET /v1/<hash>.png?title=...&sig=...` で 1280×670 の PNG が返る
- [ ] **AC-3**: 同じ `(タイトル, 版数)` への 2 回目以降の GET が R2 キャッシュから返る
- [ ] **AC-4**: `POST /admin/regenerate` は、`Authorization` のトークンが一致するときだけ 2xx を返し、不一致では 401 を返す
- [ ] **AC-5**: `POST /admin/regenerate` 実行後、R2 上のオブジェクトが新しいものに差し替わり、Cloudflare のエッジキャッシュからも次回 GET で新しいバイトが返る（Cache Purge API による即時無効化）
- [ ] **AC-6**: 本サイトのビルドが og API に HTTP で接続しない
- [ ] **AC-7**: `og.png` / `og.jpg` を持つ記事は、その画像が og:image に設定される
- [ ] **AC-8**: `og.png` / `og.jpg` を持たない記事は、og:image が `https://og.shikakun.com/v1/<hash>.png?title=...&sig=...` 形式になる
- [ ] **AC-9**: テンプレート版数を `v1` → `v2` に上げて再ビルドすると、自動生成対象記事の og:image URL のパスが変わる
- [ ] **AC-10**: 100 文字級の日本語タイトルを渡したとき、BudouX による自然な改行と 3 行超の `…` 省略が適用される
- [ ] **AC-11**: 「「」 などの先頭全角約物が、左端の余白を空けずに詰まって配置される
- [ ] **AC-12**: 画像生成関数が、同一入力で同一バイト列を返す（決定性）
- [ ] **AC-13**: NFC 同型の文字列（例: 合成済み「が」と分解「か + ゛」）が同じハッシュ値・同じ R2 キーに解決される
- [ ] **AC-14**: HMAC 検証に失敗した GET は 400 を返す。画像生成例外時は 200 で既定 OG 画像のバイトを返す（サイレントフォールバック）
- [ ] **AC-15**: 自動生成 URL を出力する記事ページで、`og:image:type` が `image/png`、`og:image:width` が 1280、`og:image:height` が 670、`og:image:alt` が記事タイトルになる
- [ ] **AC-16**: 本サイト側で `OG_API_SIGNING_KEY` が未設定の場合、自動生成は試みず既定 OG 画像にフォールバックしてビルドが成功する
- [ ] **AC-17**: `og.shikakun.com` の Custom Domain が Cloudflare で設定されている
- [ ] **AC-18**: `apps/og/README.md` に開発・デプロイ・テンプレート版数の上げ方・トークン更新の手順が記載される

## 設計

### 全体構成

```text
[shikakun.com]                              [og.shikakun.com]
Astro static build                           Cloudflare Worker (apps/og)
                                              ├─ GET  /<v>/<hash>.png  (HMAC)
                                              ├─ POST /admin/regenerate (Bearer)
                                              ├─ POST /admin/purge      (Bearer)
                                              └─ GET  /healthz

  ArticlePage.astro
   ├─ og.png/og.jpg ある? → そのまま <meta og:image>
   └─ ない?            → buildOgImageUrl(title, version)
                          を <meta og:image> に出す（HTTPなし）
                          │
        ┌─────────────────┘
        ▼
  <meta property="og:image" content="https://og.shikakun.com/v1/<hash>.png?title=...&sig=...">

       ▼  SNS クローラがアクセス
       GET → Worker
         ├─ HMAC 署名検証（不正なら 400）
         ├─ タイトルを NFC 正規化 + trim
         ├─ R2 に <v>/<hash>.png ある? → 返す（cache hit）
         └─ ない? → satori で SVG 生成 → @resvg/resvg-wasm で PNG 化 →
                     R2 に保存 → 返す（cache miss）
                     例外時は 200 で既定 OG 画像バイトを返す
```

### 画像仕様

**サイズ**: 1280×670 PNG。`og:image:width` / `og:image:height` も同じ値を出力する。

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

### API サーバー（`apps/og`）

**スタック**:

- Wrangler でローカル開発・デプロイ
- Hono でルーティング
- 画像合成: satori + @resvg/resvg-wasm
- 改行候補挿入: budoux（JS 版）

**エンドポイント**:

| メソッド | パス | 認証 | 役割 |
| --- | --- | --- | --- |
| `GET` | `/{templateVersion}/{hash}.png?title=<title>&sig=<hmac>` | HMAC 署名 | R2 ヒットなら返す、ミスなら生成して R2 に保存し返す |
| `POST` | `/admin/regenerate` | `Authorization: Bearer <OG_API_WRITE_TOKEN>` | 指定タイトル＋版数の R2 オブジェクトを再生成・保存し、対応する URL の Cloudflare エッジキャッシュを Purge |
| `POST` | `/admin/purge` | `Authorization: Bearer <OG_API_WRITE_TOKEN>` | 指定タイトル＋版数の R2 オブジェクトを削除し、対応する URL の Cloudflare エッジキャッシュを Purge |
| `GET` | `/healthz` | なし | 200 を返すヘルスチェック |

`POST` の body は JSON `{ "title": string, "templateVersion": string }`。

**タイトル正規化**:

- サイト側・Worker 側ともに `title.normalize('NFC').trim()` を施した文字列を「正規化済みタイトル」とする
- 200 文字を超える正規化済みタイトルは Worker 側で 400 を返す
- HMAC・R2 キー算出はすべて正規化済みタイトルで行う

**HMAC 署名（GET のクエリ）**:

- 署名対象文字列: `${templateVersion}|${normalizedTitle}`
- `sig = base64url(HMAC-SHA256(OG_API_SIGNING_KEY, message)).slice(0, 24)`
- 署名キーは Worker secret と本サイトのビルド環境変数の双方に同じ値を持つ
- 役割: 任意タイトルでの URL 生成（DoS・課金事故）を防ぐ
- URL パスの `<hash>` は読みやすさのための飾り（`sha256(message)` の先頭 16 文字）であり、Worker 側の検証は `sig` のみで行う

**レスポンス**:

- `GET` 成功時: `200 OK`、`Content-Type: image/png`、`Cache-Control: public, max-age=31536000, immutable`、本文は PNG バイト
- `GET` 署名不正時: `400 Bad Request`、本文なし
- `GET` の生成例外時: `200 OK` で**既定 OG 画像のバイト**を返す（SNS カードを壊さないため）、`Cache-Control: public, max-age=60`（短期キャッシュで自然回復させる）、Worker のログにエラーを残す
- `POST /admin/*` 成功時: `200 OK`
- `POST /admin/*` 認証不正時: `401 Unauthorized`

**R2**:

- バインディング名: `OG_BUCKET`
- バケット名: `shikakun-og`
- オブジェクトキー: `<templateVersion>/<hash>.png`
- ヒット時のレスポンスヘッダ: 上記「`GET` 成功時」と同じ

**CDN キャッシュ無効化**:

- `POST /admin/regenerate` と `POST /admin/purge` は、R2 の更新・削除に続けて Cloudflare の Cache Purge API を呼び、当該 URL のエッジキャッシュを即時無効化する
  - API: `POST https://api.cloudflare.com/client/v4/zones/{CLOUDFLARE_ZONE_ID}/purge_cache`
  - 認証: `Authorization: Bearer <CACHE_PURGE_API_TOKEN>`
  - body: `{ "files": ["https://og.shikakun.com/<v>/<hash>.png"] }`
- Cache Purge API 呼び出しが失敗しても、R2 の更新・削除はロールバックしない。Worker のログにエラーを残し、レスポンスは 207（一部失敗）を返す。Purge は再実行で復旧可能
- 意匠そのものを変えるときは `TEMPLATE_VERSION` を上げる方法も使える（URL が変わるため Purge 不要）

**Worker の bindings / vars / secrets**:

```toml
# apps/og/wrangler.toml
name = "og"
main = "src/index.ts"
compatibility_date = "2026-04-01"   # 実装時点の最新安定日に合わせる
compatibility_flags = ["nodejs_compat"]

[limits]
cpu_ms = 10000   # 生成の最大 CPU 時間（Workers Paid plan）

[[r2_buckets]]
binding = "OG_BUCKET"
bucket_name = "shikakun-og"

[vars]
TEMPLATE_VERSION = "v1"
CLOUDFLARE_ZONE_ID = "..."   # og.shikakun.com の zone ID

# secrets (wrangler secret put):
#   OG_API_SIGNING_KEY
#   OG_API_WRITE_TOKEN
#   CACHE_PURGE_API_TOKEN   # Cloudflare API token、権限は Zone:Cache Purge のみに絞る
```

**Custom Domain**: `og.shikakun.com` を Cloudflare の Worker Custom Domain に設定する。

### フォント・アバター素材

- Inter / Noto Sans JP の SemiBold と Medium の 2 ウェイトを subset 化して `apps/og/assets/fonts/` に置く
- 日本語 subset は JIS 第一・第二水準 + 一般的な記号類を含める
- アバターは正円クロップ済みの透過 PNG。`apps/og/assets/avatar.png` に置く。ピクセルサイズは 144×144 以上

### サイト側（`apps/web`）の変更

**新規ユーティリティ**: `apps/web/src/lib/og-image.ts`

`buildOgImageUrl(title: string, version: string): string | undefined` を定義する。
- タイトルを `normalize('NFC').trim()` で正規化する
- 正規化済みタイトルが空、または `OG_API_SIGNING_KEY` が未設定なら `undefined` を返す（呼び出し側が既定 OG 画像へフォールバックする）
- HMAC は `node:crypto` の `createHmac('sha256', ...)` で計算する（静的ビルドは Node で実行されるため利用可）
- `og.shikakun.com` 配下の署名付き GET URL を返す

**`ArticlePage.astro` の更新**:

- 個別 OG 画像の収集を `og.png` に加えて `og.jpg` も拾うように拡張する
- 手動画像があればそれを `<Layout ogImage>` に渡し、なければ `buildOgImageUrl(...)` の結果を `<Layout ogImageUrl>` に渡す。両方未取得なら既定 OG 画像にフォールバック

**`Layout.astro` の更新**:

- Props を `ogImage`（ローカル `ImageMetadata`）または `ogImageUrl`（外部 URL 文字列）のどちらかを受ける形に拡張する。両方与えられた場合は `ogImage` を優先する
- 外部 URL のときは `og:image:type` を `image/png`、`og:image:width` を 1280、`og:image:height` を 670、`og:image:alt` を記事タイトルで出力する

**`astro.config.ts` の env schema 追加**:

```ts
env: {
  schema: {
    OG_API_ORIGIN: envField.string({ context: 'server', access: 'public', default: 'https://og.shikakun.com' }),
    OG_API_SIGNING_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    OG_API_WRITE_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
  },
},
```

`OG_API_WRITE_TOKEN` はサイト側のレンダリングでは使わないが、運用上の集約のため `apps/web/.env` 側で管理する。

**`apps/web/.env.example` への追加**:

```dotenv
OG_API_ORIGIN=https://og.shikakun.com
OG_API_SIGNING_KEY=
OG_API_WRITE_TOKEN=
```

### キャッシュ戦略

- **R2**: `<templateVersion>/<hash>.png` で永続化する
- **CDN（Cloudflare エッジ）**: `Cache-Control: public, max-age=31536000, immutable` を返す。URL がコンテンツアドレスのため `immutable` で安全。CDN ヒットなら R2 も Worker 内のレンダリングも触らない
- **テンプレート版数の更新**: `TEMPLATE_VERSION` を `v1` → `v2` に上げると URL のパスが変わり、サイトの全自動生成画像が一斉に新キャッシュへ移る。古い `v1/*.png` は参照されなくなるため、必要に応じて `POST /admin/purge` で削除する

### 運用コスト

| 項目 | 試算 | 月額 |
| --- | --- | --- |
| R2 ストレージ（80KB × 100 記事 × 3 版数 = 24MB） | 無料枠 10GB | $0 |
| R2 オペレーション（Class A / B） | 無料枠 1M / 10M | $0 |
| R2 egress | 常に無料 | $0 |
| Workers リクエスト（無料枠 100K/日） | クローラ + ヒット数 | $0 |
| Workers Paid plan（10M req・30M CPU-ms 含む） | 画像生成の CPU が Free 枠 10ms/req を超えるため必須 | $5 |
| Custom Domain（`og.shikakun.com`） | Cloudflare で無料 | $0 |
| **合計** | | **$5/月** |

濫用対策として、公開 GET は HMAC 署名必須（任意タイトルでの URL 生成不可）、エッジキャッシュで Worker 起動を最小化する。

### デプロイ

- og API のデプロイは独立した GitHub Actions ワークフロー `og-deploy.yml` で行う（本サイトの `deploy.yml` とは分離）
- トリガー: `main` への push（`apps/og/**` に変更があるとき）と `workflow_dispatch`
- 手順: `pnpm install` → `pnpm --filter @shikakun/og deploy`
- Secrets: `OG_API_SIGNING_KEY`、`OG_API_WRITE_TOKEN`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
- 初回デプロイ前に Cloudflare 上で R2 バケット `shikakun-og` を作成する
- 初回デプロイ前に `og.shikakun.com` の Custom Domain を Worker に紐づける

### ローカル開発

- `pnpm --filter @shikakun/og dev` で `wrangler dev` が起動する（既定 `http://localhost:8787`）
- `apps/og/.dev.vars`（gitignore）に `OG_API_SIGNING_KEY` と `OG_API_WRITE_TOKEN` のローカル値を書く
- 本サイト側は `apps/web/.env` に同じ `OG_API_SIGNING_KEY` を書き、`OG_API_ORIGIN=http://localhost:8787` で接続する

### テスト戦略

- **決定性**: 同一の `(タイトル, 版数)` への画像生成関数呼び出しが、同じバイト列を返す
- **3 行超の省略**: 100 文字級の日本語入力で 3 行以内に収まり、末尾が `…` で終わる
- **HMAC 検証**: 既知のキー・タイトル・版数に対する署名値が一致する
- **タイトル正規化**: NFC 同型の文字列が同じハッシュ値になる
- **長さ上限**: 正規化後 201 文字以上の入力で 400 が返る
- **視覚回帰**: 参照 PNG 1 枚をリポジトリに置き、生成結果をハッシュ比較する（細部調整中はスキップ可）

## 移行手順

1. Cloudflare の Workers Paid plan を有効化する
2. R2 バケット `shikakun-og` を Cloudflare 上で作成する
3. `apps/og/` を新設し、Wrangler の最小構成（`GET /healthz` のみ）でデプロイ・疎通確認する
4. `og.shikakun.com` の Custom Domain を Worker に紐づける
5. satori + @resvg/resvg-wasm で「タイトル → 1280×670 PNG」を最小実装する
6. レイアウト・フォント・アバターを組み込み、`kern` / `palt` / `chws` を有効化する
7. BudouX 連携と 3 行超の `…` 省略を実装する
8. R2 キャッシュ層（GET 時の hit/miss 制御）を実装する
9. HMAC 署名検証とタイトル正規化を実装する
10. 書き込みトークン保護（`POST /admin/regenerate`・`POST /admin/purge`）を実装する
11. `Zone:Cache Purge` 権限のみの Cloudflare API トークンを発行して `CACHE_PURGE_API_TOKEN` として登録し、`CLOUDFLARE_ZONE_ID` を `wrangler.toml` の vars に設定したうえで、両 POST から Cache Purge API を呼ぶ実装を追加する
12. 生成例外時の既定 OG 画像フォールバックを実装する
13. 単体テスト（決定性・省略・正規化・HMAC・長さ上限）を整える
14. `apps/web/src/lib/og-image.ts` を実装する
15. `ArticlePage.astro` と `Layout.astro` を更新する
16. `astro.config.ts` の env schema と `apps/web/.env.example` を更新する
17. `og-deploy.yml` を追加し、GitHub Secrets を登録する
18. `apps/og/README.md` に運用手順（テンプレート版数の上げ方・トークン更新）を書く
19. ローカル・本番での動作確認をしてマージする

## リスク・考慮事項

- **R2 のコールドミス**: 新規タイトルの初回スクレイプはレイテンシが伸びる。各 SNS のクローラは数秒は待つため許容する
- **署名キー漏えい**: GET URL の HMAC キーが漏れると、任意タイトルでの URL を作って R2 を肥大化されうる。キーは Worker secret と GitHub Secrets で厳重に管理し、漏えい時は鍵をローテーションし `POST /admin/purge` で対応する。サイト側はサーバーサイドでしか URL を組み立てないため、クライアントへの露出はない
- **テンプレート版数の上げ忘れ**: 意匠を変えても版数を据え置くと、古い R2 オブジェクトが返り続ける。「意匠を変えたら版数を上げる」運用ルールを `apps/og/README.md` に明記する
- **Cache Purge API トークン漏えい**: `CACHE_PURGE_API_TOKEN` が漏れると当該ゾーンのキャッシュを Purge され続ける可能性がある。権限は `Zone:Cache Purge` のみに絞り、漏えい時はトークンをローテーションする
- **Cache Purge の失敗時の挙動**: Cloudflare API 障害時は Worker レスポンスを 207（一部失敗）にする。R2 のみ更新済みの状態で、URL のキャッシュは自然失効まで古いバイトを返しうる。Purge を再実行すれば復旧する
- **Worker のコールドスタート**: 初回 SNS シェアで 2〜3 秒の遅延が発生しうる
- **Worker のバンドルサイズ上限**: Workers Paid の 10MB 上限に対し、フォント subset と satori を含めても収まる見込みだが、要検証
- **satori の OpenType サポート**: `palt` / `chws` がフォントによっては期待どおりに効かないケースがある。事前に PoC で確認する
- **Workers Free 枠超過の事故**: 想定外の流入で Workers Paid の含有上限を超えても、超過は従量課金（$0.30/Mreq・$0.02/M CPU-ms）で済む。緊急時はサイト側の `OG_API_SIGNING_KEY` を空にすれば自動生成 URL を出力しなくなり、無効化できる
- **`@astrojs/cloudflare` の SSR 化**: 将来 SSR/部分 SSR にする場合、`node:crypto` を Web Crypto（`crypto.subtle.sign`、async）に置き換える必要がある。現状の `output: 'static'` では問題ない

## 要検証

- satori + @resvg/resvg-wasm の Workers Paid 上での実用性能（`cpu_ms = 10000` に収まること）
- budoux JS 版が Worker バンドルサイズと初期化コストに与える影響
- Inter / Noto Sans JP の SemiBold / Medium ファイルを subset したサイズ
- `font-feature-settings: 'palt' 1` / `'chws' 1` が satori で意図どおりに適用されること
- 3 行超の省略がフォントメトリクス上で安定して動くこと
- Astro の `import.meta.glob` で `og.jpg` も同時に拾うときのキーマッチ

## タスク分解（進捗管理）

- [ ] Workers Paid plan を有効化する
- [ ] R2 バケット `shikakun-og` を作成する
- [ ] `apps/og/` を新規作成し、pnpm workspace に追加する
- [ ] Wrangler 設定（`wrangler.toml`）と `GET /healthz` を実装してデプロイ・疎通確認する
- [ ] `og.shikakun.com` の Custom Domain を設定する
- [ ] satori + @resvg/resvg-wasm で 1280×670 PNG を生成する最小実装
- [ ] レイアウト・配色・フォント・アバター配置を実装する
- [ ] OpenType の `kern` / `palt` / `chws` を有効化する
- [ ] BudouX 連携と 3 行超の `…` 省略を実装する
- [ ] R2 キャッシュ層（GET 時の hit/miss 制御）を実装する
- [ ] タイトル正規化と HMAC 署名検証を実装する
- [ ] `POST /admin/regenerate`・`POST /admin/purge` を実装する
- [ ] `POST /admin/regenerate`・`POST /admin/purge` から Cloudflare Cache Purge API を呼ぶ実装を追加する
- [ ] Worker secrets / vars に `CACHE_PURGE_API_TOKEN`（Zone:Cache Purge 権限のみ）と `CLOUDFLARE_ZONE_ID` を追加する
- [ ] 生成例外時の既定 OG 画像フォールバックを実装する
- [ ] 単体テスト（決定性・省略・正規化・HMAC・長さ上限）を整える
- [ ] `apps/web/src/lib/og-image.ts` を実装する
- [ ] `ArticlePage.astro` を更新する（`og.jpg` 対応、外部 URL 対応）
- [ ] `Layout.astro` を更新する（外部 URL 受け取り対応・`og:image:*` 出力）
- [ ] `astro.config.ts` の env schema を更新する
- [ ] `apps/web/.env.example` に `OG_API_ORIGIN` / `OG_API_SIGNING_KEY` / `OG_API_WRITE_TOKEN` を追加する
- [ ] `og-deploy.yml` を追加する
- [ ] `apps/og/README.md` に運用手順を書く
- [ ] ローカル・本番での動作確認

## 補足

### 決定事項

- **画像サイズ**: 1280×670
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
- **API 契約**: og:image は HMAC 署名付き GET URL。ビルドは API を叩かない。POST は強制再生成・キャッシュ削除専用で書き込みトークンで保護
- **CDN キャッシュ無効化**: `POST /admin/regenerate`・`POST /admin/purge` の延長で Cloudflare Cache Purge API を自動で呼び、当該 URL のエッジキャッシュを即時無効化する（要 `CACHE_PURGE_API_TOKEN` secret と `CLOUDFLARE_ZONE_ID` vars）
- **URL パス**: `/{templateVersion}/{hash}.png`（API バージョン前置なし）
- **公開ドメイン**: `og.shikakun.com`（Worker Custom Domain）
- **画像ストレージ**: R2 バケット `shikakun-og`、キー `<templateVersion>/<hash>.png`
- **テンプレート版数の初期値**: `v1`
- **タイトル正規化**: NFC + trim、最大 200 文字
- **HMAC アルゴリズム**: HMAC-SHA256、`base64url` の先頭 24 文字を `sig` に使う
- **生成例外時の挙動**: 200 で既定 OG 画像のバイトを返す（サイレントフォールバック）
- **HMAC 不一致時の挙動**: 400 Bad Request
- **Workers プラン**: Paid plan を有効化（$5/月）
- **`compatibility_flags`**: `["nodejs_compat"]`
- **Worker の CPU 上限**: `cpu_ms = 10000`
- **サイト側の `OG_API_SIGNING_KEY`**: optional（未設定時は既定 OG 画像にフォールバック）
- **Worker のスタック**: Hono + satori + @resvg/resvg-wasm + budoux
