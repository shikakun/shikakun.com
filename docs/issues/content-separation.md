# コンテンツを非公開リポジトリへ分離し、毎日0時に自動公開する

## 概要

サイトのコンテンツ（ページ・タグ・画像）を**すべて**非公開リポジトリ `shikakun.com-content` へ移し、公開リポジトリはビルド時に sync して合成する。公開リポジトリにはコンテンツを一切置かず、「公開リポジトリ＝ソースコード、非公開リポジトリ＝コンテンツ」に切り分ける。デプロイは「`main` への push」「毎日0時（JST）の定期実行」「手動」の3トリガーで、いずれも非公開 `main` の最新を取り込む。非公開リポジトリの読み取りは読み取り専用 Deploy key で認証する。これにより、ソースコードを公開しつつ、コンテンツはデプロイされるまで非公開で書き進められる。

## 前提

- 個人サイトで、開発者は本人のみ。多人数開発・fork・外部コントリビューターは想定しない
- 非公開リポジトリへアクセスできない環境（Pull request の CI、未設定のローカルなど）では、コンテンツが空でよい。要件は「最悪でもエラーで落ちない」こと（内容の不完全さは許容する）
- 既存コンテンツは既にサイトで公開済み。今回守りたいのは「**今後の下書き**を、デプロイされる前に公開リポジトリへ出さないこと」
- JST は夏時間がないため、UTC 固定の cron で年中ずれない

## 背景・目的

現在、コンテンツは公開リポジトリ内の `apps/web/src/content/`（ページ・タグ）と `apps/web/src/assets/pages/`（画像）で管理している。ソースコードを公開しつつ、コンテンツはビルド・デプロイまで非公開で書き進めたい。

そこで全コンテンツを非公開リポジトリへ移し、公開リポジトリはビルド時にそれを読み込んで合成する。あわせて毎日0時に定期ビルド・デプロイを実行し、非公開リポジトリの `main` に push しておけば翌0時すぎに自動公開される運用にする。

## ゴール / 非ゴール

### ゴール

- コンテンツ（ページ・タグ・画像）をすべて非公開リポジトリで管理し、公開リポジトリのソースには含めない
- 公開リポジトリのビルド時に、非公開リポジトリの最新 `main` を読み込んでサイトを生成する
- 毎日0時（JST）に定期ビルド・デプロイが走る
- 非公開リポジトリの `main` に push しておくと、翌0時すぎに自動で公開される
- コンテンツの追加・削除で公開リポジトリ側の設定変更（`.gitignore` の追記など）が要らない（運用負債を作らない）
- ローカルでコンテンツを編集するとホットリロードされる執筆環境を保つ

### 非ゴール

- 既存コンテンツの本文・URL（slug）・デザインの変更
- `src/assets/` 直下の favicon・brand などページ以外の静的アセットの移動（公開のまま）
- 公開リポジトリの git 履歴からの過去コンテンツの削除（「リスク・考慮事項」参照）

## 用語

- **公開リポジトリ**: 現在の `shikakun.com`（ソースコードを公開）
- **非公開リポジトリ**: 今回新設する非公開のコンテンツ用リポジトリ `shikakun.com-content`
- **非公開コンテンツ**: 非公開リポジトリで管理するページ・タグ・画像（＝全コンテンツ）
- **sync**: 非公開リポジトリのコンテンツを公開リポジトリのビルドツリーへ取り込む処理
- **ビルドツリー**: 公開リポジトリ内の `src/content/pages/`・`src/content/tags/`・`src/assets/pages/`（sync の展開先）

## 現状の把握

### 関連する実装

- ページは `src/content/pages/` 配下の `.md` / `.mdx`。`src/content.config.ts` の glob ローダーが `base: './src/content/pages'` を `**/*.{md,mdx}` で読み込み、**ファイルのパス（拡張子を除く）がそのまま slug（URL）**になる（フラットに置けば `benri.mdx` → `/benri`）
- タグ定義は `src/content/tags/` 配下の `.yaml`（`note.yaml` / `poetry.yaml`）。glob ローダーが `base: './src/content/tags'` で読み込む
- タグページは「**ページが参照しているタグ**」からのみ生成される（`src/pages/[slug].astro` の `getStaticPaths`）。タグの YAML は title / description のメタデータ用で、欠けてもフォールバックする（`TagPage.astro`: `tagMeta?.data.title ?? tag`）
- 画像は `src/assets/pages/<slug>/...` に置き、mdx から相対 import（`astro:assets` の `<Image>` / `<Picture>`）で最適化している（例: `markdown.mdx` の `import ... from '../../assets/pages/markdown/example.jpg'`）
- `banana.mdx` / `link.mdx` / `manzai.mdx` などは公開リポジトリ内のコンポーネントを相対 import（`../../components/...`）している
- `markdown.mdx`（角括弧構文の仕様ページ）は `remark-bracket-syntax` のコード内コメントから「公開ページ」として参照されている
- デプロイは `.github/workflows/deploy.yml` が `main` への push 契機で `pnpm --filter @shikakun/web build` → Cloudflare Pages（`wrangler-action`）
- `ci.yml` は web のコンテンツをビルドしない（`build` ジョブは design-tokens / react / storybook のみ）。e2e（`e2e/accessibility.test.ts`）は `astro dev` で `/` と `/hello` を見るのみ。`/hello` は現状サイトに存在しないルートで、コンテンツの有無に依存しない

### 非公開リポジトリへ移すコンテンツ（全件）

- **ページ（17ファイル）**: 現在の `src/content/pages/` 配下の全 `.md` / `.mdx`（`banana.mdx` / `benri.mdx` / `flower-or-light.mdx` / `haagen-dazs.mdx` / `life-2020.mdx` / `life-2022.mdx` / `link.mdx` / `manzai.mdx` / `markdown.mdx` / `optical-fiber.mdx` / `ordinary-sparkle.mdx` / `packing.mdx` / `past-life.mdx` / `site-renewal.mdx` / `vase.mdx` / `virtual-background.mdx` / `yo.md`）
- **タグ（全2ファイル）**: `note.yaml` / `poetry.yaml`
- **画像**: `src/assets/pages/` 配下の全ファイル（`markdown/` を含む）

> `yo.md` のみ拡張子が `.md`。sync・glob は `.md` / `.mdx` 双方を対象とする。

---

## 要求定義

### 機能要求

- **FR-1**: 非公開リポジトリは、ルート直下の `pages/`（`.md` / `.mdx`）・`tags/`（`.yaml`）・`assets/`（画像）の3ディレクトリで全コンテンツを管理できる
- **FR-2**: 非公開ページに付随する画像を非公開リポジトリで管理でき、公開ビルド時に最適化（`astro:assets`）された状態で出力される
- **FR-3**: 公開リポジトリのビルドは、非公開リポジトリの最新 `main` を取り込み、ページ・タグ・画像を合成してサイト全体を生成する
- **FR-4**: 毎日0時（JST）にビルド・デプロイが定期実行される
- **FR-5**: `main` への code push でもビルド・デプロイが実行される
- **FR-6**: 手動でもビルド・デプロイを起動できる（`workflow_dispatch`）
- **FR-7**: ローカル開発でも、CI と同一の仕組みで非公開コンテンツを取り込んでプレビューできる
- **FR-8**: ページの slug（URL）は移行前後で変わらない
- **FR-9**: ローカル開発で非公開コンテンツ（Markdown・画像・タグ）を編集すると、サイトがホットリロードされる

### 非機能要求

- **NFR-1**: 非公開コンテンツ（ページ・タグ・画像）は、公開リポジトリの追跡対象（git 管理ファイル）に一切含めない
- **NFR-2**: 非公開リポジトリへのアクセス権限は、対象リポジトリの読み取り専用に限定する（最小権限）
- **NFR-3**: 非公開リポジトリへアクセスできない環境でも、ビルドがエラーで落ちない。内容の不完全さ（コンテンツが空になる等）は許容する。デプロイ時のみ `CONTENT_REQUIRED=true` で取得失敗をエラーにする
- **NFR-4**: sync は冪等で、非公開リポジトリ側での追加・更新・削除がビルド結果へ正しく反映される。取得できなかった場合は既存のビルドツリーを破壊しない
- **NFR-5**: コンテンツの追加・削除で公開リポジトリ側の設定変更（`.gitignore` の追記など）が発生しない

---

## 受け入れ条件

以下がすべて満たされること。

- [x] **AC-1**: 公開リポジトリの `src/content/pages/`・`src/content/tags/`・`src/assets/pages/` に、追跡されるコンテンツが存在しない（各ディレクトリの `.gitkeep` のみ）
- [x] **AC-2**: 非公開リポジトリの `pages/` に置いた `.md` / `.mdx` が、移行前と同じ slug で出力される
- [x] **AC-3**: 非公開リポジトリの `assets/` に置いた画像が、公開ビルドで `astro:assets` により最適化されて表示される
- [x] **AC-4**: 非公開リポジトリの `tags/*.yaml` がビルドに反映される
- [x] **AC-5**: 非公開コンテンツは公開リポジトリに commit されない（`git status` / `git check-ignore` で無視されることを確認）
- [ ] **AC-6**: 毎日0時（JST）の定期実行でビルド・デプロイが走る（`schedule` トリガー） ※実装済み・main 反映後に検証
- [ ] **AC-7**: `main` への code push、および手動実行（`workflow_dispatch`）でもビルド・デプロイが走る ※実装済み・main 反映後に検証
- [ ] **AC-8**: 非公開リポジトリの `main` に新規ページを push した翌0時すぎ、そのページが公開される ※実装済み・main 反映後に検証
- [x] **AC-9**: 非公開リポジトリへアクセスできない CI（Pull request など）でも、ビルドがエラーで落ちない
- [x] **AC-10**: CI が非公開リポジトリへアクセスするための認証情報は、対象リポジトリの読み取り専用に限定されている
- [x] **AC-11**: ローカルで `pnpm dev` を実行すると、全ページ・タグページが表示される
- [x] **AC-12**: 非公開コンテンツの取得に失敗しても、ローカルの既存ビルドツリーが消されない（オフライン時に直前の状態が保たれる）
- [x] **AC-13**: コンテンツを増減しても公開リポジトリ側の設定変更が不要である（`.gitignore` などの追記が発生しない）
- [x] **AC-14**: `pnpm dev` 実行中に作業クローンの Markdown を保存すると、サイトがホットリロードされる

---

## 設計

### 全体構成

```
非公開リポジトリ (private)            公開リポジトリ (public)
shikakun.com-content                 shikakun.com
  pages/   *.md(x)                     src/ ...           ← ソースコード（公開）
  tags/    *.yaml                      src/content/pages/  (.gitkeep のみ)
  assets/  <slug>/*                    src/content/tags/   (.gitkeep のみ)
                                       src/assets/pages/   (.gitkeep のみ)

ビルド（GitHub Actions / ローカル共通）:
  checkout (public)
    → content:sync : private の main を読み取り専用 clone し、
                     pages/ tags/ assets/ をビルドツリーへ展開
    → astro build  : 合成されたコンテンツでサイトを生成
    → deploy       : Cloudflare Pages（CI のみ）
```

sync が非公開リポジトリの内容をビルドツリーへ展開し、`astro build` が合成されたコンテンツをビルドする。展開されたファイルは `.gitignore` により公開リポジトリでは追跡されない。公開リポジトリ単体ではコンテンツは空（コードのみ）になる。

### 非公開リポジトリの構成

```
shikakun.com-content/        (private, main ブランチ)
├── pages/                   ← .md / .mdx（src/content/pages/ へ。フラットに置く）
│   ├── banana.mdx
│   ├── benri.mdx
│   └── ...
├── tags/                    ← .yaml（src/content/tags/ へ）
│   ├── note.yaml
│   └── poetry.yaml
└── assets/                  ← 画像（src/assets/pages/ へミラー）
    ├── markdown/
    │   └── example.jpg
    └── <slug>/
        └── *.jpg
```

コンテンツ作成上の規約:

- **`pages/` はフラットに置く**。slug はビルドツリー `src/content/pages/` からの相対パスで決まるため、サブディレクトリを作ると slug に前置される（`pages/notes/foo.mdx` → `/notes/foo`）。現状の slug を保つためフラットを維持する
- 画像・コンポーネントの import は**公開ビルド時のパス**で書く（`../../assets/pages/<slug>/...`、`../../components/...`）。非公開リポジトリ単体ではこれらは解決しない。プレビューは公開リポジトリの dev サーバー（sync 後）で行う

### sync の仕組み

ローカルと CI で同一のスクリプト（仮: `apps/web/scripts/sync-content.mjs`、追加依存なしの Node スクリプト。`git` と Node 標準 API のみ使用）を使う。「非公開リポジトリにあるものを丸ごと取り込む」だけの単純な処理で、公開ファイルの例外処理や衝突ガードは持たない。

入力（環境変数）:

| 変数 | 用途 | 既定 |
| --- | --- | --- |
| `CONTENT_REPO_URL` | 非公開リポジトリの clone URL（CI は SSH: `git@github.com:shikakun/shikakun.com-content.git`） | なし |
| `CONTENT_REF` | 取り込むブランチ／参照 | `main` |
| `CONTENT_SOURCE_DIR` | 既存のローカルクローンを使う場合のパス（指定時は clone せずここを参照） | なし |
| `CONTENT_REQUIRED` | `true` のとき、取得失敗をエラーにする（デプロイ用） | `false` |

同期マッピング:

| ソース（非公開リポジトリ） | ターゲット（ビルドツリー） |
| --- | --- |
| `pages/**/*.{md,mdx}` | `apps/web/src/content/pages/` |
| `tags/**/*.yaml` | `apps/web/src/content/tags/` |
| `assets/**` | `apps/web/src/assets/pages/` |

処理（取得できた時だけ書き換える。失敗時に既存を壊さない点が重要）:

1. **ソース解決**: `CONTENT_SOURCE_DIR` があればそれを使用。なければ `CONTENT_REPO_URL` を gitignore 下のキャッシュ（仮: `apps/web/.content-cache/`）へ取得する。キャッシュが無ければ shallow clone、あれば `fetch` のうえ `CONTENT_REF` へ `reset --hard` + `clean -fd` し、**リモートと完全一致**させる（削除も反映）
2. **ソースが得られない場合**:
   - `CONTENT_REQUIRED=true`（デプロイ）→ エラー終了する（ビルドを止める。直前のデプロイは保持される）
   - それ以外 → 警告して**ビルドツリーを書き換えずに終了**する（既存の sync 済みコンテンツを保持。未取得ならディレクトリは `.gitkeep` のみで空のまま）
3. **クリーンアップ**: ソースが得られた場合のみ、各ターゲットを `.gitkeep` を除いて空にする
4. **コピー**: マッピングに従ってソースをターゲットへ丸ごとコピーする

冪等で、何度実行しても同じ結果になる。非公開リポジトリでの追加・更新・削除が手順3・4でそのまま反映される。

### `.gitignore`

各コンテンツディレクトリを丸ごと無視し、ディレクトリ保持用の `.gitkeep` だけを追跡する。**コンテンツを増減しても追記は不要**（許可リストを持たない）。

```gitignore
# Private content synced at build time
/apps/web/.content-cache/

# All content lives in the private repo; keep only the directories
/apps/web/src/content/pages/*
!/apps/web/src/content/pages/.gitkeep
/apps/web/src/content/tags/*
!/apps/web/src/content/tags/.gitkeep
/apps/web/src/assets/pages/*
!/apps/web/src/assets/pages/.gitkeep
```

> `.gitkeep` はコレクションの `base`（`src/content/pages` / `src/content/tags`）が常に存在し、sync 前でもビルドがエラーにならないようにするためのもの。glob は `.gitkeep` を読み込まない（`**/*.{md,mdx}` / `**/*.yaml` に一致しない）。設定後は `git check-ignore -v <path>` で意図どおり無視されることを確認する。

### package.json（`apps/web`）スクリプト

```jsonc
{
  "scripts": {
    "content:sync": "node scripts/sync-content.mjs",
    "predev": "pnpm content:sync"
  }
}
```

ローカルでは `predev` により `astro dev` の前に初回 sync が自動実行される。執筆中の差分反映（ホットリロード）は、`astro dev` に組み込む開発専用の content watcher が担う（後述「執筆環境（HMR）」）。`pnpm dev` 一発で「初回 sync → 監視 → dev サーバー」が起動する。デプロイ（CI）はライフサイクルに依存せず、ワークフローで `content:sync` を**明示的な step** として実行する（後述）。

### GitHub Actions（deploy ワークフロー）

既存の `.github/workflows/deploy.yml` を次のように変更する。

- トリガーに `schedule`（毎日0時 JST）と `workflow_dispatch` を追加（既存の push: `main` は維持）
- 重複実行を避ける `concurrency` を追加
- web ビルドの前に Deploy key を読み込み、`content:sync` を明示 step として実行する

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 15 * * *'   # 15:00 UTC = 00:00 JST（JSTは夏時間なし）
  workflow_dispatch:

concurrency:
  group: deploy
  cancel-in-progress: false
```

web ビルド周辺の step（既存の design-tokens / react ビルドの後に追加）:

```yaml
      - uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.CONTENT_REPO_DEPLOY_KEY }}
      - run: pnpm --filter @shikakun/web content:sync
        env:
          CONTENT_REPO_URL: git@github.com:shikakun/shikakun.com-content.git
          CONTENT_REF: main
          CONTENT_REQUIRED: 'true'
      - run: pnpm --filter @shikakun/web build
      # 以降は既存どおり wrangler-action で deploy
```

補足:

- `schedule` はワークフローのデフォルトブランチ（`main`）のファイルからのみ起動し、secrets も利用できる
- GitHub の `schedule` は負荷状況により数分〜十数分遅延しうる。「0時すぎに公開」はこの仕様と整合する
- sync で取得した非公開コンテンツの**生ファイルを成果物（artifact）として公開しない**こと。`deploy.yml` は artifact をアップロードしないため現状問題ないが、追加時は注意する

### 認証（Deploy key）

非公開リポジトリの読み取りには、対象リポジトリ限定・読み取り専用の Deploy key を用いる（最小権限・無期限・個人アカウントから独立）。

- 鍵ペアを生成する（`ssh-keygen -t ed25519`）
- 公開鍵を**非公開リポジトリ**の Settings → Deploy keys に登録する（**書き込み許可なし**）
- 秘密鍵を**公開リポジトリ**の Actions secret `CONTENT_REPO_DEPLOY_KEY` に登録する
- ワークフローで `ssh-agent` に読み込み、sync スクリプトが SSH URL（`git@github.com:...`）で clone する。`actions/checkout`（公開リポジトリ）は HTTPS + token のため干渉しない

> known_hosts は `webfactory/ssh-agent` が `github.com` を自動で追加するため、明示の設定は不要（このアクションを使わない構成にする場合のみ `ssh-keyscan github.com >> ~/.ssh/known_hosts` を追加する）。

### ローカル開発フロー

公開リポジトリ所有者は両リポジトリへ SSH アクセスできる前提。執筆かプレビューかで使い分ける。

- **執筆（推奨）**: 非公開リポジトリを作業クローンとして手元に clone し、`CONTENT_SOURCE_DIR` にそのパスを指定する。編集・コミットはこのクローンで行い、後述の watcher が変更をビルドツリーへ反映する
- **最新のプレビューのみ**: 作業クローンを持たない場合は `CONTENT_REPO_URL` を設定すると、`predev` の sync がキャッシュへ clone / fetch して取り込む（このキャッシュは使い捨てで、執筆には使わない）

オフライン等で取得に失敗しても、既存の sync 済みコンテンツは保持される。

### 執筆環境（HMR / ホットリロード）

「Markdown を保存したら即ホットリロード」を、この構成でも実現する。

```
作業クローンで Markdown を保存
  → watcher が変更を検知し src/content/pages/ へ原子的にコピー（write + rename）
  → Astro の content collections がコピー先の変更を検知
  → サイトがホットリロード
```

- **実装**: 開発時のみ動く Astro 統合（`astro:server:setup` フック）で、`CONTENT_SOURCE_DIR`（作業クローン）の `pages/` `tags/` `assets/` を監視し、変更があったファイルを `content:sync` と同じコピー処理でビルドツリーへ反映する。コピー処理は sync スクリプトと共通化する
- **監視は Vite の watcher を再利用する**: `astro:server:setup` で渡される Vite dev サーバーの `server.watcher`（実体は chokidar）に監視パスを追加すれば、**追加依存なし**で実現できる。これが難しければ `chokidar` を `apps/web` の devDependency として導入する（`fs.watch` は OS 差で不安定なため不可）
- **`pnpm dev` 一発**: `predev` が初回 sync、`astro dev` の統合が監視を担うため、追加のコマンドやターミナルは不要。本番ビルド（`astro build`）では `astro:server:setup` は発火しないため watcher は動かない
- **物理ファイルはビルドツリーに置く**: loader の `base` を作業クローンへ向けたり symlink を張る方式は、mdx の相対 import（`../../components/...`・`../../assets/pages/...`）が**実体側のパスで解決されて壊れる**ため採らない。コピー方式なら mdx がビルドツリーに実在するので import はそのまま解決できる
- **対象**: Markdown / 画像 / タグの編集・追加・削除、新規ページ追加（ルートごと反映）。ソース未取得時は no-op
- **執筆ワークフロー**: エディタで作業クローン（コンテンツの源）を開いて執筆し、別途 `pnpm dev` を起動しておく。watcher が両者を橋渡しするので体感は通常の Astro 開発と同じ。コミットはクローン側で行う

### 通常 CI（`ci.yml`）の扱い

`ci.yml` には変更を加えず、非公開コンテンツを sync しない。理由は次のとおりで、コンテンツが無くてもエラーにならない（NFR-3）。

- `build` ジョブは web をビルドしない（design-tokens / react / storybook のみ）
- `typecheck`（`astro check`）はコンテンツコレクションが空でもエラーにならない（要検証）
- e2e は `astro dev` で `/` と `/hello` を見るのみで、コンテンツの有無に依存しない（`/` は空一覧で描画、`/hello` は現状存在しないルート）

---

## 移行手順

中間状態で空サイトを本番へ出さないため、**公開リポジトリの変更は1つのブランチにまとめ、private リポジトリと secret を先に用意してから、まとめて `main` にマージする**（「リスク・考慮事項」のカットオーバー参照）。

### 1. 準備（`main` に影響しない）

1. 非公開リポジトリ `shikakun.com-content`（private）を作成し、ルートに `pages/`（全ページをフラットに）・`tags/`（`note.yaml` / `poetry.yaml`）・`assets/`（`src/assets/pages/` の全画像）を配置して `main` へ push する
2. Deploy key を生成し、非公開リポジトリ（公開鍵・読み取り専用）と公開リポジトリ（秘密鍵・Actions secret `CONTENT_REPO_DEPLOY_KEY`）に登録する

### 2. 公開リポジトリの変更（1ブランチで実施）

3. sync スクリプト・執筆 watcher（Astro 統合）・`.gitignore`・`package.json` スクリプトを追加する
4. `deploy.yml` を更新する（`schedule` / `workflow_dispatch` / `concurrency` / `ssh-agent` / 明示の `content:sync` step）
5. 公開リポジトリから全コンテンツを削除する（`git rm`）。`src/content/pages/`・`src/content/tags/`・`src/assets/pages/` に `.gitkeep` を追加する
6. `remark-bracket-syntax` のコード内コメントにある `markdown.mdx` への参照を、公開URL（`https://shikakun.com/markdown/`）へ更新する
7. ローカルで `CONTENT_SOURCE_DIR` を指定して `pnpm dev` を実行し、全ページ・タグページの表示、編集時の HMR、オフライン時の非破壊を確認する

### 3. カットオーバーと確認

8. 準備（private リポジトリ・secret）が完了していることを確認し、上記ブランチを **1回のマージで** `main` に入れる
9. マージ後の deploy（または `workflow_dispatch`）で、本番に全ページが公開されることを確認する
10. 翌0時の定期実行で再ビルド・デプロイされることを確認する

---

## リスク・考慮事項

- **移行カットオーバー（最重要）**: 「コンテンツ削除済みだが `deploy.yml` 未更新」または「secret・private リポジトリ未準備」の中間状態で `main` にデプロイが走ると、**空サイトが本番公開**されうる。公開リポジトリの変更は1ブランチにまとめ、private リポジトリと secret を先に用意してからまとめてマージする（移行手順参照）
- **code push でも非公開コンテンツが公開される**: デプロイは毎回最新の非公開 `main` を取り込むため、`main` への code push でその時点の未公開コンテンツも公開される（合意済みの方針）。0時まで確実に伏せたいコンテンツは、その時間まで非公開リポジトリの `main` へ載せない運用とする
- **公開リポジトリ単体ではコンテンツが空**: 非公開リポジトリへアクセスできない環境（Pull request の CI など）ではコンテンツが空になる。個人サイトのため許容する。本番デプロイは sync 済みのため常に正しい
- **壊れた frontmatter で夜間デプロイが失敗しうる**: スキーマ不正なコンテンツを非公開 `main` に push すると、夜間の `astro build` が失敗する。デプロイが失敗しても Cloudflare 側は直前のデプロイを保持するため**公開中のサイトは壊れない**が、更新は反映されない。GitHub は `schedule` 失敗時にメール通知するため、それで検知する（将来的に非公開リポジトリ側で frontmatter を検証する案は「補足」参照）
- **git 履歴に過去コンテンツが残る**: 公開リポジトリの履歴には移行前のコンテンツが残る。これらは既に公開済みのため許容する。新規の下書きは非公開リポジトリのみに存在する
- **`markdown.mdx` の参照コメント**: 仕様ページが非公開になるため、`remark-bracket-syntax` のコメント参照先を公開URLへ更新する（移行手順6）
- **`schedule` の遅延**: 前述のとおり数分〜十数分の遅延がある

---

## 要検証（実装時に確認する前提）

- `pnpm`（11.8.0）の pre/post スクリプト（`enable-pre-post-scripts`）の既定値。`predev` がローカルで自動実行されるか。デプロイは明示 step のため、無効でも影響しない
- `astro check`（typecheck）がコンテンツコレクション空でエラーにならないこと
- `webfactory/ssh-agent`（v0.9.0）が `github.com` を known_hosts に自動追加すること
- `.gitignore` の `.gitkeep` 許可が `git check-ignore -v` で意図どおりになること
- Vite の `server.watcher` で、Vite root 外（作業クローン）の変更を検知できること。難しければ `chokidar` にフォールバックする
- ビルドツリーのファイルを上書き・追加・削除したときに、Astro の content collections が dev で確実に HMR すること（原子的書き込みで部分読み取りを避ける）
- e2e の `/hello` が現状存在しないルートを検査している点（テストの意図が不明瞭。本件の対象外だが、別途見直すか確認したい）

---

## タスク分解（進捗管理）

このファイルを計画の中心とし、必要に応じて作業を分割する。

- [x] 非公開リポジトリ `shikakun.com-content` を作成し、`pages/`（フラット）`tags/` `assets/` に全コンテンツを配置・push
- [x] Deploy key を発行・登録（非公開リポジトリ公開鍵 / 公開リポジトリ secret）
- [x] sync スクリプト（`apps/web/scripts/sync-content.mjs`）を実装（取得時のみ clean+copy・失敗時は非破壊・リモートと完全一致・3ディレクトリのミラー）
- [x] 執筆用 watcher を実装（dev 限定の Astro 統合。Vite の `server.watcher` を再利用。コピー処理は sync と共通化）し `pnpm dev` に統合
- [x] `.gitignore` を更新（各コンテンツディレクトリを無視 + `.gitkeep`・キャッシュ無視）
- [x] `apps/web/package.json` に `content:sync` / `predev` を追加
- [x] `deploy.yml` を更新（`schedule` / `workflow_dispatch` / `concurrency` / `ssh-agent` / 明示の `content:sync` step）
- [x] 公開リポジトリから全コンテンツを削除し、各コンテンツディレクトリに `.gitkeep` を追加
- [x] `remark-bracket-syntax` のコメントの `markdown.mdx` 参照を公開URLへ更新
- [x] ローカルで `pnpm dev` の動作確認（ページ・タグページ・HMR・オフライン時の非破壊）
- [ ] カットオーバー（1ブランチをまとめてマージ）→ 手動デプロイ・定期デプロイの動作確認

---

## 補足（決定事項・将来の改善）

### 決定事項

- **非公開リポジトリ名**: `shikakun.com-content`（単数）。サイトの「コンテンツ」は不可算名詞のため、英文法・慣例（CMS = Content Management System、Astro の Content Collections など）に沿って単数 `content` を採用する
- **キャッシュ / クローン先のパス**: `apps/web/.content-cache/`
- **known_hosts**: `webfactory/ssh-agent` の自動設定に任せる（明示の `ssh-keyscan` は不要）
- **執筆 watcher の依存**: まず Vite の `server.watcher` 再利用（追加依存なし）を試し、難しければ `chokidar` を導入する

### 将来の改善（任意・本件のスコープ外）

- import パスの相対結合（`../../assets/...`・`../../components/...`）を緩めるパスエイリアス（例: `@components` / `@assets`）の導入。コンテンツの記述をビルドツリー上の階層から独立させられる
- 非公開リポジトリ側で frontmatter を検証する軽い CI を持たせ、夜間デプロイ前にスキーマ崩れを検知する
