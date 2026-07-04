# RSSフィードの生成を自動テストで検証する

- 状態：未着手
- 見積もり：M（1日以内）
- ブランチ：`feed-validation`
- 依存：ビルド統合テスト（スライス2）は[e2e-fixtures](./e2e-fixtures.md)のフィクスチャと[deploy-gating](./deploy-gating.md)のCIビルド検証があると効率がよい。スライス1は独立して着手できる

## ユーザーストーリー

開発者として、記事テンプレートやMarkdownパイプラインを変更したとき、RSSフィードが壊れていないことをCIで確認したい。フィードの破損はRSSリーダー越しにしか見えず、発見が遅れやすいため。

## 背景（現状の事実）

- feed.xmlの生成（`apps/web/scripts/feed-integration.mjs`）と中間エンドポイント（`feed-data.json.ts`）には自動テストがない。`apps/web`のユニットテストは`src/lib/`配下のみが対象
- [docs/specs/feed.md](../specs/feed.md)には「検証の観点」（XMLの整形式・`listed: false`の除外・`content:encoded`の非空・絶対URL・中間ファイルの削除など）が列挙されているが、すべて手動確認
- feed.xmlは`astro build`後のフックでのみ生成され、開発サーバーには存在しないため、現行のe2e（開発サーバー対象）では検査できない
- 本文抽出（`extractArticleBody`）・URL絶対化（`toAbsoluteUrls`）・sanitize設定は`feed-integration.mjs`内の非公開関数で、テストから参照できない
- フィード生成は記事ページのHTML構造（`<article>`/`<header>`/`<footer>`）に依存しており、`ArticlePage.astro`の変更で静かに壊れうる（仕様書にも前提として記載している）

## 価値（なぜやるか）

- 仕様書の手動検証リストをテストとして固定化し、テンプレート・パイプライン・sanitize設定の変更に対する回帰検知を自動にする。
- 壊れたフィードの配信（本文の欠落・相対URLの混入など）を、購読者が気づく前にCIで検知できる。

成功の判定：specs/feed.mdの「検証の観点」の各項目が、手動確認ではなくCIの自動テストで担保されること。

## スコープ

### やること

- フィード整形ロジックのテスト可能なモジュールへの切り出しと単体テスト
- ビルド成果物のfeed.xmlに対する検証テスト

### やらないこと

- フィードの機能追加・仕様変更（配信内容・整形規則は現状のまま）
- RSSリーダーごとの表示互換性の検証

## 受け入れ条件

- [ ] 本文抽出・URL絶対化・sanitizeの各規則が単体テストで検証される。少なくとも：`<header>`/`<footer>`の除去、`span`の除去とテキストの保持、`id`属性の保持、`iframe`の許可ドメイン、`srcset`を含む相対URLの絶対化
- [ ] フィクスチャコンテンツでビルドした`dist/client/feed.xml`に対して、specs/feed.mdの検証の観点が自動検査される。少なくとも：XMLとして整形式・`listed: false`の除外・全itemの`content:encoded`が非空・root相対URLの不在・`feed-data.json`の削除
- [ ] これらのテストがCIで実行される

## 実装方針の選択肢

| 案 | 内容 | 利点 | 欠点 |
| --- | --- | --- | --- |
| 1（推奨） | 両方やる。(a)`feed-integration.mjs`の整形ロジックをモジュールへ切り出しVitestで単体テスト、(b)フィクスチャでビルドしたfeed.xml全体を検証する統合テスト | 規則単位の速い回帰検知（a）と、フック・エンドポイント・ページ構造の結合の検証（b）の両方が得られる | 統合テストは`astro build`の時間がかかる |
| 2 | 単体テストのみ | 速い・簡単 | ビルドフックと記事HTML構造の結合が検証されず、`ArticlePage.astro`の変更による破損を検知できない |
| 3 | ビルド統合テストのみ | 実際の成果物を検証できる | 失敗したとき、どの規則が壊れたのか特定しにくい |

案1を推奨する。XMLのパースには`apps/web`の既存依存`fast-xml-parser`が使える。

## 作業の分割

1. **整形ロジックの切り出しと単体テスト**：`feed-integration.mjs`から純粋関数を切り出し、規則ごとにテストする。独立して着手・マージできる
2. **ビルド統合テストの追加**：フィクスチャコンテンツでビルドし、feed.xmlを検証する
3. **CIへの組み込み**：deploy-gatingで追加するCIのwebビルドとビルドを共用できるか確認して組み込む

## リスクと軽減策

| リスク | 影響 | 軽減策 |
| --- | --- | --- |
| 切り出しリファクタリングで整形の挙動が変わる | フィードの内容が意図せず変わる | 切り出しの前後でビルドしたfeed.xmlにdiffが無いことを確認してからマージする |
| 統合テストがCI時間を押し上げる | CIの待ち時間が伸びる | CIのwebビルド（deploy-gating）と成果物を共用する |

## 完了の定義

受け入れ条件に加えて、このプロジェクト共通の完了条件を満たす。

- `pnpm lint`・`pnpm typecheck`・`pnpm test`・`pnpm build`が通る
- 仕様書（`docs/specs/feed.md`・`docs/specs/ci-cd.md`）が実装後の事実と一致している

## 参考

- [docs/specs/feed.md](../specs/feed.md) — フィード生成の仕様と検証の観点
- `apps/web/scripts/feed-integration.mjs`・`apps/web/src/pages/feed-data.json.ts`
