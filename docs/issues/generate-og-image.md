# 記事のタイトルからog:imageを自動生成する

- 状態：完了（mainへマージ済み。現状の仕様は[docs/specs/og-image.md](../specs/og-image.md)と`apps/og/README.md`を参照）

## ユーザーストーリー

開発者として、記事ごとのOG画像を手作業なしで用意したい。SNSでシェアされたとき、どの記事もタイトル入りの画像つきで表示されるようにするため。

## 背景（着手時の事実）

- 記事個別のOG画像は`ArticlePage.astro`が`import.meta.glob`で`src/assets/pages/<slug>/og.png`から収集し、無ければサイト共通の既定画像を使う仕組みがすでにあった
- 記事数が増えるなかで、すべての記事に手動でOG画像を用意するのは現実的でない
- コンテンツは非公開リポジトリ`shikakun.com-content`にあり、`assets/`配下はsyncで全ファイルがビルドツリーへ取り込まれる（[content-separation](./content-separation.md)）。つまり生成画像を`assets/<slug>/og.png`へ置けば、サイト側のコード変更なしに既存の配信経路に乗る

## 価値（なぜやるか）

- 全記事にタイトル入りのOG画像が付き、シェア時の体験が上がる。
- 執筆時に一度だけ実行するバッチ方式のため、常設のサーバー・ストレージ・サイト側の追加コードを持たない。
- 生成が決定的なため、意匠やタイトルの変更が生成画像のgit diffとして現れ、commit前に目視レビューできる。画像のバイトが変われば`astro:assets`のコンテンツハッシュが変わり、`og:image`のURLも自動で更新される。

成功の判定：手動画像を持たない全記事にタイトル入りのOG画像が付き、手動画像・既定画像の既存の挙動が変わらないこと。

## スコープ

### やること

- ローカルで実行するNode CLI（`apps/og`／`@shikakun/og`）の新設
- 手動画像と生成画像の判別と、手動画像の保護
- 記事削除などで対応ページを失った生成画像の削除（prune）
- commit前の自己チェック手段（`--check`）

### やらないこと

- リクエストごとに画像を動的生成するランタイム
- 画像生成SaaS（Vercel OGなど）の利用
- 記事以外のページ（ホーム・タグ）のOG画像自動生成（既定画像のまま）
- 生成画像の自動commit・自動push（git操作は手動）

## 受け入れ条件（すべて達成済み）

- [x] `pnpm og:generate`で、手動画像を持たない全記事の1280×670 PNGがコンテンツ作業クローンの`assets/<slug>/og.png`へ生成・更新される
- [x] 生成画像には生成marker（PNGのtEXt `Software=@shikakun/og`）が埋め込まれ、markerを持たない手動画像はCLI実行後も一切変更されない
- [x] 2回連続で実行しても差分が出ない（決定性）。NFC同型のタイトルは同じ画像に解決される
- [x] 対応ページの無い生成画像がpruneされる（`--slug`指定時はpruneしない）
- [x] `--check`が生成差分と孤児を検出し、あれば非ゼロ終了する
- [x] 長いタイトルでBudouXによる自然な改行が効き、3行を超える場合は末尾が`…`で省略される。先頭の全角始め約物は左端に詰めて配置される
- [x] frontmatterに`title`が無いページはスキップして警告する。作業クローンを解決できない場合は明確なエラーで終了する
- [x] 生成画像は既存のsync・`astro:assets`の経路でそのまま配信され、`og:image:width`/`height`/`type`が正しく出力される。サイトのビルドは外部APIを叩かない
- [x] 単体テスト（決定性・省略・正規化・marker・手動画像の不可侵・prune）が整備され、`apps/og/README.md`に運用手順がある

## 採用した方針

- **方式**：ローカルCLIによるバッチ生成。生成画像をコンテンツリポジトリへcommitし、既存のsync・ビルドで配信する。`apps/`に置くのは、`packages/*`がchangesetsでGitHub Packagesへ公開されるライブラリ群のため（公開しない実行ツールは`apps/`）
- **スタック**：satori（レイアウトをSVG化）＋`@resvg/resvg-js`（PNG化）＋budoux（分節）＋gray-matter（frontmatter解析）。PNGのtEXt/iTXtチャンクは自前の最小ユーティリティで読み書きする（重い依存を避け、決定的な書き出しを制御する）
- **手動画像との判別**：生成markerを「生成CLIの所有印」と定義し、markerの無い`og.png`は不可侵とする。サイドカーファイルやマニフェストは持たず、画像自身がprovenanceを表明する
- **決定性**：依存とフォントのバージョンを固定し、生成日時など非決定的な値を埋め込まない。テンプレート版数の定数は持たず、`astro:assets`のコンテンツハッシュにキャッシュ無効化を委ねる
- **作業クローンの解決**：syncと同じ規約（`CONTENT_SOURCE_DIR`→`../shikakun.com-content`）。ただし書き込みが目的のため、解決できない場合はno-opにせずエラー終了する
- **意匠**：寸法・配色・フォントサイズの定数を`src/consts.ts`に集約する

当初計画からの変更点：

- OpenType feature（`kern`/`palt`/`chws`）の有効化を計画していたが、**satoriがOpenType featureを解さない**ことが分かり、タイトル先頭の全角始め約物は負の`textIndent`で1行目だけ詰める方式に変更した
- 配色は`@shikakun/design-tokens`のトークン参照を予定していたが、design-tokensの**JSエクスポートが型不整合で使えない**ため、トークンと同じ値をローカル定数として持ち、対応トークン名をコメントに記した（解消は[design-tokens-js-exports](./design-tokens-js-exports.md)で計画）

## 作業の分割（実績）

1. `apps/og`のworkspace追加と、タイトル→PNGの最小実装（satori＋resvg）
2. レイアウト・フォント・アバター・BudouX分節・3行省略・約物詰め・NFC正規化
3. PNGチャンクユーティリティと生成markerの付与・判定、手動画像のスキップ
4. `pages/`走査・生成・prune・`--slug`/`--check`オプション
5. 単体テストとREADMEの整備、全記事の生成と本番確認

## リスクと軽減策（当時の判断）

| リスク | 対応 |
| --- | --- |
| `@resvg/resvg-js`はネイティブ実装のため、OS・アーキテクチャが変わると生成バイトが変わりうる | 単一開発者・同一環境での運用を前提とした。`--check`をCIで回す場合は環境を揃える |
| タイトルを変えた記事の再生成漏れ | 「タイトルを変えたら再生成」を運用手順としてREADMEに明記し、`--check`をcommit前の確認に使う |
| 手動画像が偶然同じtEXtを持つと生成物と誤認される | markerを所有印と定義し、手動画像には付けない運用とした |
| 生成してもcommitしなければ公開されない | 生成→確認→commitを運用手順として固定した |

## 完了の定義

プロジェクト共通の完了条件（lint・typecheck・testの通過、仕様書との同期）を満たして完了した。

## 参考

- 現状の仕様：[docs/specs/og-image.md](../specs/og-image.md)
- 運用手順・素材要件：`apps/og/README.md`
- 派生した課題：[design-tokens-js-exports](./design-tokens-js-exports.md)（配色定数の複製の解消）
