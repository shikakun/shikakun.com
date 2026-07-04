# OG画像

## 解決順

記事ページの`og:image`は次の順で決まる（`apps/web/src/components/ArticlePage.astro`）。

1. ページ個別の`src/assets/pages/<slug>/og.png`（非公開リポジトリの`assets/<slug>/og.png`がsyncで入る。手動で用意した画像でも自動生成した画像でもよい）
2. 無ければ、サイト共通の既定OG画像`apps/web/src/assets/og.png`

個別画像は`import.meta.glob('/src/assets/pages/*/og.png')`で収集され、`astro:assets`の`ImageMetadata`として`Layout.astro`へ渡る。「自動生成」は実行時の分岐ではなく、後述のCLIが1の`og.png`を執筆時に用意することで実現する。

## 自動生成CLI（apps/og）

`@shikakun/og`は、記事タイトルから1280×670のOG画像PNGを描画するローカルCLI。常設のサーバーやストレージは持たず、執筆時に一度だけ実行するバッチとして動く。詳細な運用手順・素材の要件は`apps/og/README.md`を参照。

### コマンド

| コマンド | 動作 |
| --- | --- |
| `pnpm og:generate` | 手動画像を持たない全記事の画像を生成・更新し、孤児（対応ページの無い生成画像）をpruneする |
| `pnpm og:generate --slug <slug>` | 指定記事だけを対象にする（pruneしない） |
| `pnpm og:generate --check` | 書き込まず、生成差分・孤児の有無を検査する。差分があれば非ゼロ終了（commit前の自己チェック用） |

出力先はコンテンツ作業クローン（`CONTENT_SOURCE_DIR`→規約パス`../shikakun.com-content`。解決できなければエラー終了）。生成画像のcommit/pushは非公開リポジトリ側で手動で行う。

### 生成markerによる手動画像との区別

生成画像にはPNGのtEXtチャンクに`Software=@shikakun/og`を埋め込む（`src/marker.ts`・`src/png-text.ts`）。CLIはこのmarkerで判定する。

- `og.png`が無い→新規描画
- markerあり（生成物）→再描画して上書き
- markerなし（手動画像）→**一切触らない**（pruneの対象にもしない）

手動画像へ切り替えるには`assets/<slug>/og.png`を自分で差し替える（markerが消え、以後CLIは不可侵として扱う）。自動生成へ戻すにはその`og.png`を削除して再実行する。

### 描画の仕組み

- satoriでレイアウトをSVG化し、`@resvg/resvg-js`でPNGへラスタライズする（`src/render.ts`）。
- タイトルはBudouXで分節し、分節境界にゼロ幅スペースを挿入して`wordBreak: keep-all`と組み合わせることで、自然な位置でだけ折り返す。
- タイトルは最大3行。超える場合は省略記号`…`で切り詰める。
- タイトル先頭が全角の始め約物（「『（など）の場合、負の`textIndent`で1行目だけ左端に詰める（satoriはOpenTypeの`palt`/`chws`を解さないため）。
- フォント（Inter・Noto Sans JPのMedium/SemiBold）とアバター画像は`apps/og/assets/`に同梱する。
- 意匠（寸法・配色・フォントサイズ）は`src/consts.ts`に集約されている。配色は`@shikakun/design-tokens`のトークン値と一致する定数として持つ（design-tokensのJSエクスポートが型不整合のため。[design-tokens.md](./design-tokens.md)）。

### 決定性

同じタイトル・テンプレート・フォント・ライブラリ版なら同一バイト列を生成するため、変わったPNGだけがgitの差分に現れる。画像のバイトが変われば`astro:assets`の出力ファイル名（コンテンツハッシュ）も変わり、`og:image`のURLが自動で更新される。ただし`@resvg/resvg-js`はネイティブ実装のため、OS/アーキテクチャが変わると生成バイトが変わりうる（単一開発者・同一環境での運用が前提）。

タイトルを変えた記事は、再生成しないとOG画像が古いまま残る。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `apps/og/README.md` | 運用手順・素材要件・注意点の一次ドキュメント |
| `apps/og/src/cli.ts` | CLIの入口（引数解析・サマリー出力） |
| `apps/og/src/generate.ts` | 生成・更新・pruneのオーケストレーション |
| `apps/og/src/content.ts` | 作業クローンの解決と`pages/`の走査 |
| `apps/og/src/render.ts` | satori＋resvgによる描画 |
| `apps/og/src/consts.ts` | 意匠・寸法・配色の定数 |
| `apps/og/src/marker.ts`・`src/png-text.ts` | 生成markerの付与・判定（PNGチャンクの読み書き） |
| `apps/web/src/components/ArticlePage.astro` | サイト側の解決（glob→Layoutへ） |
