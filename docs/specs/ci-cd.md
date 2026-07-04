# CI・デプロイ・パッケージ公開

GitHub Actionsのワークフローは`.github/workflows/`に3つある。

## CI（ci.yml）

`main`へのpushとPull requestで実行する。Node.jsはLTS、pnpmのキャッシュを使う。

| ジョブ | 内容 |
| --- | --- |
| `build` | `@shikakun/design-tokens`と`@shikakun/react`のビルド、Storybookのビルド。成果物（`dist`と`storybook-static`）をartifactとして後続ジョブへ渡す |
| `typecheck` | buildのartifactを展開して`pnpm typecheck`（webは`astro check`のため、依存パッケージのdistが必要） |
| `lint` | `pnpm lint`（Biome＋markuplint） |
| `test` | `pnpm test`＝ユニットテスト（Vitest）→e2eテスト（Playwright）。Playwrightのブラウザ（chromium）はキャッシュし、レポートをartifactに保存する |
| `storybook-vrt` | ビルド済みStorybookをhttp-serverで配信し、`test-storybook`（Storybook test-runner）を実行 |

Pull requestのCIでは非公開コンテンツリポジトリへアクセスしないため、コンテンツは空のままビルド・テストされる。

### e2eテスト

`playwright.config.ts`と`e2e/`。Desktop Chromeのみ。`webServer`として`pnpm --filter @shikakun/web dev`（ポート4321）を起動する。CIではworkers 1・retries 2。現状のテストは`e2e/accessibility.test.ts`で、トップページと記事ページ1件に対してaxe（`@axe-core/playwright`）を実行し、アクセシビリティ違反がゼロであることを検査する。

## デプロイ（deploy.yml）

トリガーは3つ。いずれも非公開コンテンツリポジトリの`main`の最新を取り込んでデプロイする。

1. `main`へのpush
2. 毎日15:00 UTC（＝0:00 JST）の定期実行
3. 手動（`workflow_dispatch`）

`concurrency: group: deploy`（`cancel-in-progress: false`）で同時実行を直列化する。手順：

1. `@shikakun/design-tokens`・`@shikakun/react`をビルド
2. Deploy key（secret `CONTENT_REPO_DEPLOY_KEY`）をssh-agentへ登録
3. `pnpm --filter @shikakun/web content:sync`を`CONTENT_REPO_URL=git@github.com:shikakun/shikakun.com-content.git`・`CONTENT_REF=main`・`CONTENT_REQUIRED='true'`で実行（取得失敗はエラー）
4. `pnpm --filter @shikakun/web build`（`astro build`。この中でsitemap・feed.xmlも生成される）
5. `cloudflare/wrangler-action`で`deploy --config apps/web/dist/server/wrangler.json --name web`を実行しCloudflareへデプロイ（wrangler設定ファイルはCloudflareアダプタがビルド時に生成する）

必要なsecrets：`CONTENT_REPO_DEPLOY_KEY`・`CLOUDFLARE_API_TOKEN`・`CLOUDFLARE_ACCOUNT_ID`。

おたよりフォームAPIが使う`MESSAGE_FORM_API_URL`・`MESSAGE_FORM_API_TOKEN`（[website.md](./website.md)）はワークフローでは渡しておらず、リポジトリ内に設定箇所はない（実行環境側で設定される）。

## パッケージ公開（publish.yml）

`main`へのpushで`changesets/action`を実行する。

- 未リリースのchangesetがあれば、バージョン更新のPull request（タイトル「Update package versions」）を作成・更新する。
- バージョン更新がmergeされると、`pnpm release`（全ビルド→`changeset publish`）でGitHub Packages（`npm.pkg.github.com`）へ公開し、GitHub Releasesを作成する。

公開対象は`publishConfig`を持つ`@shikakun/design-tokens`と`@shikakun/react`（`apps/*`はprivate）。changesetsの設定は`.changeset/config.json`（`access: public`・`baseBranch: main`）。変更を入れる際は`pnpm changeset`でchangesetを追加する。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `.github/workflows/ci.yml` | ビルド・型チェック・lint・テスト・VRT |
| `.github/workflows/deploy.yml` | Cloudflareへのデプロイ（push・定期・手動） |
| `.github/workflows/publish.yml` | changesetsによるバージョニングとGitHub Packagesへの公開 |
| `playwright.config.ts`・`e2e/` | e2eテスト |
| `.changeset/config.json` | changesetsの設定 |
