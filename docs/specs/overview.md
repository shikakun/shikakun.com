# リポジトリ全体像

## 目的と構成方針

shikakun.com（個人サイト）のソースコードを管理するmonorepo。公開リポジトリであるこのリポジトリにはソースコードのみを置き、記事などのコンテンツは非公開リポジトリ`shikakun.com-content`で管理してビルド時に取り込む（詳細は[content-sync.md](./content-sync.md)）。

## パッケージ構成

pnpm workspaceによるmonorepoで、`apps/*`と`packages/*`をワークスペースとする（`pnpm-workspace.yaml`）。

| パッケージ | パス | 役割 |
| --- | --- | --- |
| `@shikakun/web` | `apps/web` | サイト本体（Astro）。private |
| `@shikakun/og` | `apps/og` | 記事タイトルからOG画像を生成するローカルCLI。private |
| `@shikakun/design-tokens` | `packages/design-tokens` | デザイントークン。GitHub Packagesへ公開 |
| `@shikakun/react` | `packages/react` | Reactコンポーネントライブラリ。GitHub Packagesへ公開 |

パッケージ間の依存は次のとおり。

- `@shikakun/web` → `@shikakun/react`・`@shikakun/design-tokens`（`workspace:*`）
- `@shikakun/react` → `@shikakun/design-tokens`（`workspace:*`）
- `@shikakun/og`はワークスペース内の依存を持たない（非公開コンテンツリポジトリの作業クローンを直接読む）

## 技術スタック

- **サイト**：Astro 6（`output: 'static'`＋Cloudflareアダプタ）、React 19（アイランド）、MDX
- **言語**：TypeScript（`tsconfig.base.json`で`strict`、`moduleResolution: bundler`、`verbatimModuleSyntax`、`jsx: react-jsx`を共有）
- **スタイル**：CSS Modules＋デザイントークン（CSS変数）
- **lint/format**：Biome（インデント2スペース・行幅100・シングルクォート・セミコロンあり。`.astro`では未使用変数系ルールを無効化）、markuplint（`.astro`/`.mdx`対象。`markuplint:recommended`に`landmark-roles`・`required-h1`などを追加。`script[async]`は`required-attr`を除外）
- **テスト**：Vitest（ユニット）、Playwright（e2e。axeによるアクセシビリティ検査）、Storybook test-runner（VRT）
- **デプロイ**：GitHub ActionsからCloudflareへ（詳細は[ci-cd.md](./ci-cd.md)）

## ルートのコマンド

ルート`package.json`のscripts。`pnpm -r`は全ワークスペース、`--filter`は特定パッケージで実行する。

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | `apps/web`の開発サーバー（`predev`でコンテンツsyncが先に走る） |
| `pnpm og:generate` | OG画像の生成CLI |
| `pnpm build` | 全パッケージのビルド |
| `pnpm typecheck` | 全パッケージの型チェック（webは`astro check`） |
| `pnpm lint` / `pnpm lint:fix` | Biome＋markuplint |
| `pnpm test` | `test:unit`（Vitest）→`test:e2e`（Playwright）の順に実行 |
| `pnpm storybook` | `packages/react`のStorybook（ポート6006） |
| `pnpm changeset` / `version-packages` / `release` | changesetsによるバージョニングと公開 |

## 依存パッケージの管理

- パッケージマネージャーはpnpm（`packageManager: pnpm@11.8.0`）。
- `.npmrc`で`minimum-release-age=7 days`を設定しており、リリースから7日未満のバージョンはインストールしない。例外は`pnpm-workspace.yaml`の`minimumReleaseAgeExclude`に列挙する。
- ビルドスクリプトの実行を許可するパッケージは`pnpm-workspace.yaml`の`allowBuilds`で明示する（`@swc/core`・`esbuild`・`sharp`・`unrs-resolver`・`workerd`）。

## 開発環境

- `.devcontainer/devcontainer.json`：`typescript-node:26-bookworm`イメージ。ポート4321（Astro dev）と6006（Storybook）をフォワード。`postCreateCommand`でcorepack有効化・`pnpm install`・Playwright（chromium）のインストールを行う。VS Code拡張（Biome・Astro・Playwright・markuplint）と保存時フォーマットを設定。
- `.coderabbit.yaml`：コードレビューの言語を`ja-JP`に設定。

## ドキュメント

- `docs/specs`：仕様書（このディレクトリ）。実装から確認できる事実を記述する。
- `docs/issues`：機能追加・変更の計画書。ブランチごとにMarkdownで書く。実装後に更新されていない可能性がある。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `package.json` | ルートのscriptsと開発ツールの依存 |
| `pnpm-workspace.yaml` | ワークスペース定義・allowBuilds・minimumReleaseAgeExclude |
| `.npmrc` | minimum-release-age |
| `tsconfig.base.json` | 全パッケージ共通のTypeScript設定 |
| `biome.json` | lint/formatの設定 |
| `.markuplintrc.yaml` | HTMLのlint設定 |
| `playwright.config.ts` | e2eテストの設定 |
| `.changeset/config.json` | changesetsの設定 |
