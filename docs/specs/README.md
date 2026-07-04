# 仕様書の索引

このディレクトリには、リポジトリのソースコードから確認できる仕様を機能・アーキテクチャ単位でまとめている。今後の開発で人間が読み、またはLLMが最初に読み込むことで、正確に手戻りなく作業に取りかかれることを目的とする。

## 読む順序

はじめてこのリポジトリに触れる場合は、`overview.md`から読み始め、作業対象に応じて各ファイルへ進むとよい。

| ファイル | 内容 |
| --- | --- |
| [overview.md](./overview.md) | リポジトリ全体像。monorepo構成・技術スタック・開発コマンド・ツールチェーン |
| [website.md](./website.md) | サイト本体（`apps/web`）の仕様。ルーティング・コンテンツコレクション・レイアウト・コンポーネント |
| [content-sync.md](./content-sync.md) | コンテンツの非公開リポジトリ分離とsyncの仕組み |
| [markdown-pipeline.md](./markdown-pipeline.md) | Markdown/MDXの処理パイプラインと独自の角括弧構文 |
| [feed.md](./feed.md) | RSSフィード（`/feed.xml`）の全文配信 |
| [og-image.md](./og-image.md) | OG画像の解決順と自動生成CLI（`apps/og`） |
| [design-tokens.md](./design-tokens.md) | デザイントークン（`packages/design-tokens`）の定義とビルド |
| [react-components.md](./react-components.md) | Reactコンポーネントライブラリ（`packages/react`）のAPI |
| [ci-cd.md](./ci-cd.md) | CI・デプロイ・パッケージ公開のワークフロー |

## このディレクトリの書き方

- 実装から確認できる事実のみを記述する。憶測や将来の計画は書かない（計画は`docs/issues`に置く）。
- 記事などのコンテンツの実ファイル名は列挙しない。コンテンツは非公開リポジトリで管理され日々変わるため、仕様書には仕組みだけを書く。
- 各ファイルには関連するソースファイルのパスを載せ、詳細はソースコードを読めばたどれるようにする。

## 関連ディレクトリ

- `docs/issues`：機能追加・変更の計画書。作業当時の計画であり、実装後に更新されていない可能性がある。仕様の一次情報としては使わず、経緯を知りたいときに参照する。
