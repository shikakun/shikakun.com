# @shikakun/og

記事タイトルから OG 画像（`og:image`）を自動生成するローカル CLI。

執筆時に一度だけ叩くバッチで、コンテンツリポジトリ（`shikakun.com-content`）の作業クローンを読み、各記事のフロントマター `title` から 1280×670 の PNG を描画して `assets/<slug>/og.png` に書き出す。生成画像は手動 OG 画像とまったく同じパイプライン（sync → `astro:assets`）で配信されるため、サイト側のコードは増やさない。

常設のサーバーやストレージは持たない。生成画像の commit / push は手動で行う。

## og:image の解決順

1. `assets/<slug>/og.png` があれば、それ（手動・生成のどちらでも）
2. 無ければ、サイト共通の既定 OG 画像（`apps/web/src/assets/og.png`）

「自動生成」は実行時の分岐ではなく、この CLI が 1 の `og.png` を執筆時に用意することで実現する。

## 必要な素材

`apps/og/assets/` に以下を置き、リポジトリに commit する。

```
apps/og/assets/
├── avatar.png                  # 正円クロップ済み・背景透過 PNG（推奨 216×216、最低 144×144）
└── fonts/
    ├── Inter-Medium.ttf        # weight 500
    ├── Inter-SemiBold.ttf      # weight 600
    ├── NotoSansJP-Medium.ttf   # weight 500
    ├── NotoSansJP-SemiBold.ttf # weight 600
    ├── LICENSE-Inter.txt       # SIL OFL 全文（Inter）
    └── LICENSE-NotoSansJP.txt  # SIL OFL 全文（Noto Sans JP）
```

- フォントは **静的インスタンス**の `ttf` / `otf` / `woff`。satori は **woff2 非対応**。ファイル名は上記 basename に合わせる（拡張子は問わない）。
- 省略記号 `…`（U+2026）を含むグリフカバレッジが必要。
- 各フォントの OFL ライセンス全文を同梱する。

## 使い方

コンテンツ作業クローンは `CONTENT_SOURCE_DIR`、無ければ規約パス `../shikakun.com-content`（公開リポジトリと並列）を使う。解決できない場合はエラーで終了する。

```sh
# 手動画像を持たない全記事を生成・更新し、孤児（対応ページの無い生成画像）を prune する
pnpm og:generate

# 指定記事だけを対象にする（prune は行わない）
pnpm og:generate --slug optical-fiber

# 書き込まず、生成差分・孤児の有無を検査する（差分があれば非ゼロ終了。commit 前の自己チェック用）
pnpm og:generate --check
```

`pnpm --filter @shikakun/og generate`（typecheck / lint / test も同様に `--filter`）でも実行できる。

## 手動画像の扱い

生成画像には PNG の tEXt チャンクに生成 marker（`Software=@shikakun/og`）を埋め込む。CLI はこの marker で手動画像と生成画像を見分ける。

- `og.png` が無い → 新規描画
- marker あり（生成物）→ 再描画して上書き
- marker なし（手動画像）→ **一切触らない**

特定の記事だけ手作りの画像を使いたいときは、その `assets/<slug>/og.png` を自分で差し替える（marker が消えるので、以後 CLI は不可侵として扱う）。自動生成へ戻すときは、その `og.png` を削除して再実行する。

## 意匠を変えるとき

意匠（レイアウト・配色・フォントサイズなど）は `src/consts.ts` と `src/render.ts` を直して再生成する。

生成は決定的（同じタイトル・テンプレート・フォント・ライブラリ版なら同一バイト列）なので、変わった PNG だけが git の diff に現れる。画像のバイトが変われば `astro:assets` の出力ファイル名（コンテンツハッシュ）も変わり、`og:image` の URL が自動で更新される。テンプレート版数を表す定数は持たない。

タイトルを変えた記事は、再生成しないと OG 画像が古いまま残る。`pnpm og:generate --check` を commit 前の確認に使える。

## 運用フロー

1. `shikakun.com-content` の `pages/<slug>.mdx` に記事を書く（手動画像を使う記事は `assets/<slug>/og.png` を自分で置く）。
2. 公開リポジトリで `pnpm og:generate` を実行する。
3. コンテンツ作業クローンの `assets/<slug>/og.png` が生成・更新され、孤児が prune される。
4. コンテンツリポジトリ側で生成画像を確認し、commit / push する（git 操作は手動）。
5. デプロイ（push 契機・毎日 0 時の定期・手動）で sync・ビルドされ、公開される。

## 決定性についての注意

`@resvg/resvg-js` はネイティブ実装のため、OS / アーキテクチャが変わると生成バイトが変わりうる。単一開発者・同一環境での運用を前提とする。`--check` を CI で回す場合は、生成に使う環境と CI 環境を揃える。

satori は OpenType feature（`kern` / `palt` / `chws`）を解さない。タイトル先頭の全角始め約物（「『（など）は、負の `textIndent` で 1 行目だけ左端に詰めている。
