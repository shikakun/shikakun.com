# Markdownパイプラインと角括弧構文

## 概要

コンテンツ（`.md`／`.mdx`）は、Astroの`markdown.processor`（`astro.config.ts`）で設定したremark/rehypeプラグインで処理される。GFM（テーブル・脚注など）はAstroの既定で有効。書き手向けの記法ガイドはサイト上の https://shikakun.com/markdown/ として公開されている（ソースは非公開リポジトリのコンテンツ）。

## プラグインの適用順

### remark（mdastの変換）

1. `remarkBracketSyntax`（自前。`src/lib/remark-bracket-syntax/`）：角括弧構文をHTML要素へ変換
2. `remark-breaks`：段落内の単一改行を`<br>`にする

角括弧構文はremark-breaksがtextノードを改行で分割する前に処理する必要があるため、この順になっている。

### rehype（hastの変換）

1. `rehype-budoux`：日本語テキストをBudouXで分節し`<wbr>`を挿入（自然な位置での折り返し）
2. `rehypeExternalLinks`（自前。`src/lib/rehype-external-links/`）：`http(s)`で始まるリンクに`target="_blank"`と`rel="noopener noreferrer"`を付与
3. `rehypeFootnoteReference`（自前。`src/lib/rehype-footnote-reference/`）：脚注参照のマークアップを差し替え（後述）

### その他の設定

- `smartypants: false`：日本語中心のサイトでは英文タイポグラフィ変換の恩恵がなく、角括弧構文の引数の引用符を壊すため無効化。
- `remarkRehype`オプションでGFM脚注のラベルを日本語化：セクション見出しは「脚注」、戻りリンクのラベルは「参照Nに戻る」、戻りリンクの表示は`↩`＋異体字セレクタU+FE0E（絵文字表示を防ぐ）。

## 脚注（GFM）

記法はGFM標準の`[^1]`（参照）と`[^1]: …`（定義）。パース・HTML化はGFMの既定機能で行われ、このリポジトリでは表示を2箇所で調整している。

- `rehypeFootnoteReference`が、参照側の`<sup><a>1</a></sup>`を`<span data-footnote-ref-wrapper>（<a>*1</a>）</span>`へ差し替える（全角括弧つきの「（*1）」表記）。
- RSS配信では脚注のジャンプリンクが機能するよう`id`属性を保持する（[feed.md](./feed.md)）。

## 角括弧構文

このサイト独自のインライン記法。実装は`src/lib/remark-bracket-syntax/`。

### 文法

```text
[TEXT(METHOD.PRESET:SUBTYPE, ARG1, name=value, ...)]
```

- `TEXT`部を持つ形式（例：`[標準機能(ruby,ひょう じゅん き のう)]`）と、自己完結型（例：`[(divider)]`）がある。
- `METHOD`は必須。`.PRESET`（ドット記法）と`:SUBTYPE`（コロン区切り）は任意。いずれも小文字英字とハイフン。
- 引数はカンマ区切り。`name=value`形式は名前付き引数になる。引用符（`"…"`または`“…”`）で囲むとカンマや空白を含められ、引用符は除去される。
- 式は行をまたげない。
- `\[`・`\]`（ソース上は`\\[`）でリテラルの角括弧を書ける。
- 末尾の範囲オペレーター`..`は文法上パースされるが未対応で、警告して無視する。

### メソッド一覧

**インラインメソッド**（テキスト中で使える）：

| メソッド | 出力 | 備考 |
| --- | --- | --- |
| `strong` | `<strong>` | |
| `stroke` | `<s>` | |
| `emphasize` | `<em style="text-emphasis: filled triangle">` | 圏点（黒三角） |
| `ruby` | `<ruby>` | 読みがスペース区切りで基底文字数と一致すればモノルビ、それ以外はグループルビ。不一致時は警告してグループルビにフォールバック |
| `kbd` | `<kbd>` | `[Command(kbd)]`でテキスト、`[(kbd.command)]`でプリセット（⌘などの記号＋`aria-label`。プリセットはcontrol/option/shift/command/delete/return/space/tab/escape/arrow-*。`title=`でラベルを上書き可能） |
| `spacer` | `<span class="bracket-spacer">` | インラインの余白。既定1em。`em`/`rem`/`px`の長さを受け付ける。`auto`は未対応 |

**ブロックメソッド**（単独の段落としてのみ使える）：

| メソッド | 出力 | 備考 |
| --- | --- | --- |
| `divider` | `<hr class="bracket-divider bracket-divider--{variant}">` | variantは`solid`（既定）・`double`・`dash` |
| `youtube` | `<div class="bracket-youtube"><iframe …>` | プライバシー強化モード（youtube-nocookie.com）の埋め込み。URLはwatch・youtu.be・shorts・live・embed形式に対応。`t=`/`start=`の秒数指定（数値のみ）を引き継ぐ。`title=`でiframeのtitleを指定（既定「YouTube動画」）。`loading="lazy"` |

### エラー処理

パースできない式・未知のメソッド・不正な引数は**変換せずソースのまま出力**し、`file.message()`で警告する。ブロックメソッドをインラインで使った場合なども同様に警告して無視する。記述ミスでビルドは落ちない。

### 実装の仕組み

- パーサー（`parse.ts`）が式を`BracketExpression`（text・method・preset・subtype・args・namedArgs）へ分解する。
- 各メソッドのハンドラー（`methods/`）が、mdast上のカスタムノード`bracketSyntax`を返す。このノードは`data.hName`／`hProperties`／`hChildren`でhast出力だけを指示し、mdast-util-to-hast（remark-rehypeとMDXパイプラインの両方が使う）が未知のノードでもHTML要素へ変換する仕組みに乗る。
- ブロックメソッドは「段落全体が1つの式」の場合だけ段落ごと置き換える。オートリンクで式中のURLがlinkノードに分割されていても認識できるよう、段落全体の文字列で判定する。
- 生成する要素にはCSS Modulesのクラスを割り当てられないため、スタイルは`bracket-`接頭辞のグローバルクラスとして`apps/web/src/styles/bracket-syntax.css`に定義する。

### テスト

`parse.test.ts`・`index.test.ts`・`methods/youtube.test.ts`にVitestのユニットテストがある。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `apps/web/astro.config.ts` | プラグインの登録順・smartypants・脚注ラベルの設定 |
| `apps/web/src/lib/remark-bracket-syntax/` | 角括弧構文（パーサー・メソッド・型） |
| `apps/web/src/lib/rehype-external-links/` | 外部リンクの`target`/`rel`付与 |
| `apps/web/src/lib/rehype-footnote-reference/` | 脚注参照の表記差し替え |
| `apps/web/src/styles/bracket-syntax.css` | 角括弧構文が生成する要素のスタイル |
