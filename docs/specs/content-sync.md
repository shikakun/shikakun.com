# コンテンツの分離とsync

## 概要

サイトのコンテンツ（ページ・タグ・画像）は、すべて非公開リポジトリ`shikakun.com-content`で管理する。公開リポジトリ（このリポジトリ）にはコンテンツを一切コミットせず、ビルド・開発時にsyncスクリプトで取り込む。記事や記法ガイドなどコンテンツの編集は非公開リポジトリ側で行う。

`.gitignore`でコンテンツの取り込み先を除外しており、各ディレクトリには`.gitkeep`だけがコミットされている。

## 非公開リポジトリの構成規約

| 非公開リポジトリ（ソース） | 公開リポジトリの取り込み先（ターゲット） | 対象ファイル |
| --- | --- | --- |
| `pages/` | `apps/web/src/content/pages/` | `.md`・`.mdx` |
| `tags/` | `apps/web/src/content/tags/` | `.yaml` |
| `assets/` | `apps/web/src/assets/pages/` | すべて |

- `pages/`はフラットな1階層で、ファイル名（拡張子を除く）がURLのslugになる。
- `assets/<slug>/og.png`はページ個別のOG画像として扱われる（[og-image.md](./og-image.md)）。
- ドットで始まるファイル・ディレクトリ（`.git`・`.DS_Store`など）は取り込まない。

## syncスクリプト（apps/web/scripts/sync-content.mjs）

追加依存を持たず、gitとNode標準APIのみで動く。次の2つの入口がある。

1. **CLI**：`pnpm content:sync`（`node scripts/sync-content.mjs`）。`predev`フックにより`pnpm dev`の前に自動実行される。
2. **Astro統合**：`contentWatchIntegration()`。開発サーバー起動中のホットリロード用（後述）。

### ソースの解決順

1. `CONTENT_SOURCE_DIR`：ローカルの作業クローンのパス。指定時はcloneしない
2. `CONTENT_REPO_URL`：非公開リポジトリのclone URL。`apps/web/.content-cache/`へshallow clone（2回目以降はfetch＋`reset --hard`）し、`CONTENT_REF`（既定`main`）と完全一致させる
3. どちらも無ければ、公開リポジトリと並列の規約パス`<リポジトリroot>/../shikakun.com-content`が在ればそれを使う

ローカル開発では規約パスに作業クローンを置いておけば、環境変数なしで`pnpm dev`だけで動く。

### 環境変数

| 変数 | 内容 |
| --- | --- |
| `CONTENT_SOURCE_DIR` | 既存のローカルクローンのパス（指定時はcloneしない） |
| `CONTENT_REPO_URL` | 非公開リポジトリのclone URL |
| `CONTENT_REF` | 取り込むブランチ／参照（既定`main`） |
| `CONTENT_REQUIRED` | `'true'`のとき、ソースを取得できなければエラーで終了する（デプロイ用） |

### 同期の性質

- **冪等・完全一致**：ターゲットを`.gitkeep`を除いて空にしてからコピーするため、ソースでの削除も反映される。
- **安全側に倒す**：ソースに当該サブディレクトリ（`pages/`など）が無いマッピングはスキップし、ターゲットを空にしない。ソースが得られない場合、`CONTENT_REQUIRED=true`ならエラー、それ以外は既存のビルドツリーを保持して終了する（no-op）。
- **アトミックコピー**：同一ディレクトリの一時ファイルへ書いてからrenameし、Astroが書き込み途中のファイルを読まないようにする。

## 開発時のホットリロード

`contentWatchIntegration`（`astro:server:setup`フック）が、作業クローン（`CONTENT_SOURCE_DIR`または規約パス）の各サブディレクトリをVite（chokidar）のwatcherに追加し、add/change/unlinkイベントをsyncと同じコピー・削除処理でビルドツリーへ反映する。本番ビルド（`astro build`）ではこのフックは発火しない。作業クローンが見つからない場合はホットリロード無効の旨をログに出して続行する。

## デプロイでの利用

`deploy.yml`では、読み取り専用のDeploy key（`CONTENT_REPO_DEPLOY_KEY`）をssh-agentへ登録したうえで、`CONTENT_REPO_URL`・`CONTENT_REF=main`・`CONTENT_REQUIRED='true'`を指定して`content:sync`を実行し、その後に`astro build`する（[ci-cd.md](./ci-cd.md)）。Pull requestのCIなど非公開リポジトリへアクセスできない環境では、コンテンツが空のままビルドされる。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `apps/web/scripts/sync-content.mjs` | sync本体（CLI＋Astro統合） |
| `apps/web/scripts/sync-content.d.mts` | 型定義 |
| `.gitignore` | コンテンツ取り込み先と`.content-cache`の除外 |
| `.github/workflows/deploy.yml` | デプロイ時のsync実行 |
| `apps/og/src/content.ts` | OG画像CLI側の作業クローン解決（同じ規約パスを使う） |
