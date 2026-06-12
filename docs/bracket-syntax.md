# 角括弧構文（Bracket Syntax）の設計

`apps/web/src/content/pages`のMarkdownコンテンツで使える、このウェブサイト独自のインライン記法「角括弧構文」を実装する。

仕様の出典は[Click and Magic「レイアウトシステムを作る・1」のセクション1-3](https://clickandmagic.com/notes/making_layoutsystem_1#1_3)で提案されている記法。これを基本仕様として再現しつつ、このサイト独自の拡張として**YouTube動画の埋め込みメソッド**を追加する。

前提として、[markdown-line-breaks.md](./markdown-line-breaks.md)（remark-breaks導入と`smartypants: false`）を先に実装しておくこと。

## 設計方針

- **マテリアル・オネスティ**：出力はできる限り意味の合うHTML要素（`<ruby>`、`<kbd>`、`<strong>`、`<s>`、`<hr>`）にマップする。意味を持たない純粋な見た目の指定だけ`<span>`とインラインスタイルを使う
- **graceful degradation**：パースできない式・未知のメソッド・不正な引数は、**変換せずソースの文字列をそのまま出力**する。ビルドは失敗させず、`vfile`の`file.message()`で警告を出す（どのファイルのどの式が無視されたかをビルドログで追えるようにする）
- **アクセシビリティ**：記号だけのキーシンボルには`aria-label`を付ける。iframeには`title`を必ず付ける
- **remarkプラグインとして実装**：`.md`と`.mdx`の両方に同じ仕組みで適用される（`@astrojs/mdx`は`unified()`プロセッサーの`remarkPlugins`を継承する）

## 構文仕様

### 基本形

```
[TEXT(METHOD:SUBTYPE, ARGUMENTS)OPERATOR]
```

| 要素 | 役割 | 省略 |
| --- | --- | --- |
| `TEXT` | 効果を適用する対象テキスト | 自己完結型メソッドでは省略（`[(divider)]`） |
| `METHOD` | メソッド名。小文字英字とハイフン | 必須 |
| `.PRESET` | ドット記法によるプリセット呼び出し（`key.command`） | 任意 |
| `:SUBTYPE` | コロン区切りの動作モード選択（`divider:dash`） | 任意 |
| `ARGUMENTS` | カンマ区切りの引数 | 任意 |
| `OPERATOR` | 範囲開始を示す`..`（閉じ括弧の直後） | 任意（フェーズ2） |

3つの記述パターンがある。

```
[テキスト(method, args)]   ← テキストにインライン適用
[(method, args)]           ← 自己完結型（テキストなし）
[(method)..] 〜 [..]       ← 範囲適用（フェーズ2）
```

### 引数

- **位置引数**：カンマ区切り。`[標準機能(ruby,ひょう じゅん き のう)]`
- **名前付き引数**：`name=value`形式。`[(divider:dash,length=5px,gap=3px)]`
- **引用符**：値にカンマや括弧を含む場合は`"..."`で囲める。`[(key.delete,title="Backspace")]`
  - パーサーはストレートクォート`"..."`に加えて、カーリークォート`“...”`も引用符として受理する（`smartypants: false`にしていても、防御的に両対応とする）
- 引数の前後の空白はトリムする

### エスケープ

micromarkはMarkdownソースの`\[`を処理した時点でバックスラッシュを取り除くため、remarkプラグインに届くtextノードでは区別できない。そこで出典と同じ二段エスケープを採用する。

- 本文中でリテラルの`[(...)]`を表示したいときは`\\[(disable:shorthand)\\]`のようにバックスラッシュ2つで書く（Markdownのエスケープ処理を経て、textノードには`\[`が残る）
- プラグインはtextノード内の`\[`・`\]`を見つけたら、バックスラッシュを取り除いてリテラルの`[`・`]`として出力し、パース対象にしない
- インラインコード・コードブロック内はそもそも変換対象外なので、エスケープ不要

### パース対象外

- `code`（コードブロック）と`inlineCode`（インラインコード）の中身
- Markdown標準のリンク記法`[text](url)`・画像記法（micromarkが先に`link`・`image`ノードへ変換するため、プラグインのtextノード走査には現れない。衝突しない）
- メソッド括弧を持たないただの角括弧`[こんにちは]`（パース失敗→そのまま出力）

### ネスト（フェーズ2）

複数スタイルの同時適用。閉じ角括弧と開きパーレンのあいだに半角スペースを入れることで、`[[]]`を使う他の記法との衝突を避ける。

```
[[テスト1(stroke)] (weight, 200)]
```

フェーズ1ではネストを実装しない。パース失敗としてそのまま出力される（壊れない）。

## メソッド一覧と採用状況

| メソッド | 種別 | フェーズ | 備考 |
| --- | --- | --- | --- |
| `strong` | インライン | 1 | |
| `stroke` / `doublestroke` | インライン | 1 | |
| `weight` | インライン | 1 | |
| `oblique` | インライン | 1 | |
| `scale` | インライン | 1 | |
| `mono` | インライン | 1 | |
| `ruby` | インライン | 1 | |
| `emphasize` | インライン | 1 | 圏点 |
| `key` | インライン | 1 | プリセット含む |
| `spacer` | インライン | 1 | `auto`はフェーズ2 |
| `divider` | ブロック | 1 | |
| `youtube` | ブロック | 1 | **このサイト独自の拡張** |
| `alignment` | ブロック・範囲 | 2 | |
| `columns` | 範囲 | 2 | |
| `pointer` | インライン | 2 | アイコン素材の用意が必要 |
| `disable:shorthand` | 文書 | 2 | |
| ネスト構文 | — | 2 | |
| `codeblock`範囲 | — | 採用しない | Markdown標準のコードフェンスで足りる |
| `imageblock` | — | 採用しない | Markdown標準の画像記法とAstroの画像最適化で足りる |
| `disable:indent` / `kinsoku` / `justify` | — | 採用しない | 出典サイト固有の組版機能に対応するもので、このサイトに該当機能がない |

## 各メソッドの仕様とHTML出力

### テキストスタイル（インライン）

| 記法 | 出力 |
| --- | --- |
| `[TEXT(strong)]` | `<strong>TEXT</strong>` |
| `[TEXT(stroke)]` | `<s>TEXT</s>` |
| `[TEXT(stroke,4)]` | `<s style="text-decoration-thickness: 4px">TEXT</s>` |
| `[TEXT(doublestroke,2)]` | `<s style="text-decoration-style: double; text-decoration-thickness: 2px">TEXT</s>` |
| `[TEXT(weight,200)]` | `<span style="font-weight: 200">TEXT</span>` |
| `[TEXT(oblique)]` | `<span style="font-style: oblique">TEXT</span>` |
| `[TEXT(oblique,30)]` | `<span style="font-style: oblique 30deg">TEXT</span>` |
| `[TEXT(scale, 1.5)]` | `<span style="font-size: 1.5em">TEXT</span>` |
| `[TEXT(mono)]` | `<span class="bracket-mono">TEXT</span>` |
| `[TEXT(mono,800)]` | `<span class="bracket-mono" style="font-weight: 800">TEXT</span>` |

- 打ち消し線に`<s>`を使うのは「もはや正確ではない内容」という意味が文章表現上の用途と合うため。装飾専用にしたい場合は将来`<span>`へ変更してよい
- `oblique`の角度指定は、使用フォントが可変フォントまたはobliqueに対応している場合のみ効く（環境依存。マテリアル・オネスティの範囲内として許容する）
- 数値引数はバリデーションする（`weight`は1〜1000の数値、`scale`は正の数値、`stroke`の太さは正の数値でpx単位として扱う）。不正なら警告して無変換

### ruby（ルビ）

```
[標準機能(ruby,ひょう じゅん き のう)]   ← モノルビ
[超電磁砲(ruby,レールガン)]              ← グループルビ
```

- 読みに半角スペースが含まれる場合は**モノルビ**：読みをスペースで分割し、基底テキストをコードポイント単位（`[...text]`）で分割して、数が一致したら1文字ずつ`<rt>`を割り当てる

  ```html
  <ruby>標<rt>ひょう</rt>準<rt>じゅん</rt>機<rt>き</rt>能<rt>のう</rt></ruby>
  ```

- 読みの数と基底文字数が一致しない場合は、警告を出してグループルビにフォールバックする
- スペースを含まない読みは**グループルビ**：

  ```html
  <ruby>超電磁砲<rt>レールガン</rt></ruby>
  ```

- `<rp>`は付けない（`<ruby>`非対応ブラウザ向けのフォールバックで、現行の主要ブラウザはすべて対応済みのため）

### emphasize（圏点）

```
[けんてん(emphasize,1)]
```

CSSの`text-emphasis`で実装する。`(filled|open) × (dot|circle|double-circle|triangle|sesame)`でちょうど10種あるので、1〜10を次のようにマップする。

| 番号 | text-emphasis-style | 番号 | text-emphasis-style |
| --- | --- | --- | --- |
| 1 | `filled dot` | 6 | `open circle` |
| 2 | `open dot` | 7 | `filled triangle` |
| 3 | `filled sesame` | 8 | `open triangle` |
| 4 | `open sesame` | 9 | `filled double-circle` |
| 5 | `filled circle` | 10 | `open double-circle` |

出力：`<span style="text-emphasis: filled dot">けんてん</span>`

このマッピングは出典の見た目と完全一致する保証がない（未確認）。実装後に出典ページと見比べて、必要なら並び順を調整する。引数省略時は`1`扱い。

### key（キーシンボル）

```
[Command(key)]                      → <kbd>Command</kbd>
[(key.command)]                     → <kbd aria-label="Command">⌘</kbd>
[(key.delete,title="Backspace")]   → <kbd aria-label="Backspace">⌫</kbd>
```

- テキスト適用形`[TEXT(key)]`はテキストをそのまま`<kbd>`で包む
- プリセット形`[(key.PRESET)]`は記号を表示し、記号だけでは読み上げで伝わらないため`aria-label`を必ず付ける。`title=`引数は`aria-label`を上書きする（表示は記号のまま）

| プリセット | 記号 | aria-label | プリセット | 記号 | aria-label |
| --- | --- | --- | --- | --- | --- |
| `control` | ⌃ | Control | `space` | ␣ | Space |
| `option` | ⌥ | Option | `tab` | ⇥ | Tab |
| `shift` | ⇧ | Shift | `escape` | ⎋ | Escape |
| `command` | ⌘ | Command | `arrow-up` | ↑ | Arrow Up |
| `delete` | ⌫ | Delete | `arrow-down` | ↓ | Arrow Down |
| `return` | ⏎ | Return | `arrow-left` | ← | Arrow Left |
| | | | `arrow-right` | → | Arrow Right |

未知のプリセットは警告して無変換。`<kbd>`の見た目（枠線・角丸・等幅フォント）はスタイルシート側で整える。

### spacer（スペーサー）

```
[(spacer)]        → 1em（デフォルト）
[(spacer,2em)]    → 2em
[(spacer,8px)]    → 8px
```

出力：`<span class="bracket-spacer" style="inline-size: 2em"></span>`

CSS側で`display: inline-block`を当てる。引数は`/^\d+(\.\d+)?(em|rem|px)$/`でバリデーションする。`auto`（マルチカラムでの改列）は`columns`と同じフェーズ2。

### divider（区切り線・ブロック）

**単独の段落としてのみ**書ける（`<hr>`は段落の中に置けないため。段落の途中に現れた場合は警告して無変換）。

```
[(divider)]                            → <hr class="bracket-divider bracket-divider--solid">
[(divider:solid)]                      → 同上
[(divider:doublesolid,gap=3px)]        → <hr class="bracket-divider bracket-divider--doublesolid" style="--divider-gap: 3px">
[(divider:dash,length=5px,gap=3px)]    → <hr class="bracket-divider bracket-divider--dash" style="--divider-length: 5px; --divider-gap: 3px">
[(divider:slash,height=1em,gap=10px)]  → <hr class="bracket-divider bracket-divider--slash" style="--divider-height: 1em; --divider-gap: 10px">
[(divider:slash,...,reversed)]         → 上記に bracket-divider--reversed クラスを追加
```

名前付き引数はCSSカスタムプロパティに変換し、見た目はすべてスタイルシート側で実装する。`hr`要素を使うことで、スタイルが当たらなくても意味（主題の区切り）が保たれる。

### youtube（動画埋め込み・ブロック）【このサイト独自の拡張】

```
[(youtube, https://www.youtube.com/watch?v=dQw4w9WgXcQ)]
[(youtube, https://youtu.be/dQw4w9WgXcQ, title="動画のタイトル")]
```

**単独の段落としてのみ**書ける。段落の途中に現れた場合は警告して無変換。

対応するURL形式（video idは`/^[A-Za-z0-9_-]{11}$/`で検証する）：

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/live/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- クエリに`t=秒数`または`start=秒数`（数値のみ）があれば、埋め込みURLの`?start=`に引き継ぐ。`1m30s`のような形式は無視する

出力HTML：

```html
<div class="bracket-youtube">
  <iframe
    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    title="動画のタイトル"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen
  ></iframe>
</div>
```

- ドメインは`www.youtube-nocookie.com`（プライバシー強化モード）を使う。閲覧者が再生するまでCookieが保存されない
- `title`引数を省略した場合は`"YouTube動画"`をiframeの`title`属性に設定する。ただしコンテンツ執筆時は`title`引数を付けることを推奨
- CSSで`aspect-ratio: 16 / 9`と`inline-size: 100%`を当てる

## 実装設計

### 配置とファイル構成

このサイト専用の記法であり再利用予定がないため、新しいワークスペースパッケージにはせず`apps/web`内に置く。テストはファイルに併置する。

```
apps/web/src/lib/remark-bracket-syntax/
├── index.ts            # remarkプラグイン本体（export function remarkBracketSyntax）
├── index.test.ts       # Markdown文字列→HTML文字列の統合テスト
├── parse.ts            # 角括弧式のパーサー（純粋関数）
├── parse.test.ts
└── methods/
    ├── index.ts        # メソッドレジストリ（inlineMethods / blockMethods）
    ├── text-style.ts   # strong / stroke / doublestroke / weight / oblique / scale / mono / emphasize
    ├── ruby.ts
    ├── key.ts
    ├── spacer.ts
    ├── divider.ts
    ├── youtube.ts
    └── youtube.test.ts # URL解析のユニットテスト
```

依存パッケージ（執筆時点の最新。インストール前にnpm registryで確認すること）：

```sh
pnpm --filter @shikakun/web add unist-util-visit@5.1.0 mdast-util-to-string@4.0.0
pnpm --filter @shikakun/web add -D @types/mdast@4.0.4 @types/hast@3.0.4 vitest@4.1.7
```

`vitest`のバージョンは`packages/react`に合わせる。`apps/web/package.json`に`"test": "vitest run"`スクリプトを追加し、ルートの`package.json`の`test:unit`を`pnpm -r test`に変更する（pnpmのrecursive runは該当スクリプトがないパッケージをスキップする）。

### パイプラインへの組み込み

```ts
// apps/web/astro.config.ts
import { remarkBracketSyntax } from './src/lib/remark-bracket-syntax';

export default defineConfig({
  output: 'static',
  markdown: {
    processor: unified({
      remarkPlugins: [remarkBracketSyntax, remarkBreaks],
      // biome-ignore lint: rehype-budouxの型がPlugin<[Options?], Parent>のためRoot型と合わない
      rehypePlugins: [rehypeBudoux as any],
      smartypants: false,
    }),
  },
  integrations: [mdx(), react()],
});
```

- 順序は`remarkBracketSyntax`を先、`remarkBreaks`を後にする（breaksがtextノードを改行で分割する前に角括弧式を処理する。角括弧式は行をまたげない仕様とする）
- `astro.config.ts`はesbuildでバンドルされるため、TypeScriptソースの相対インポートで問題ない
- `smartypants: false`は必須（[markdown-line-breaks.md](./markdown-line-breaks.md)参照）

### 最重要の制約：GFMオートリンクとブロック認識

ユーザー指定のremarkPluginsは`remark-gfm`の**後**に実行される。GFMのextended autolinkにより、`[(youtube, https://...)]`のURL部分はプラグインが見る前に`link`ノードへ変換されてしまい、段落のchildrenは次のように分割されている。

```
paragraph
├── text: "[(youtube, "
├── link: https://www.youtube.com/watch?v=dQw4w9WgXcQ
└── text: ")]"
```

このため、**ブロックメソッド（youtube・divider）はtextノード走査では認識できない**。次の二段構えで処理する。

1. **ブロックパス（先に実行）**：`visit(tree, 'paragraph', ...)`で各段落を`mdast-util-to-string`により文字列化し、トリムした全体が1つの角括弧式（`/^\[\(.+\)\]$/`の形）にマッチするか試す。マッチしてメソッドがブロックメソッドなら、**段落ノード自体を**生成ノードで置き換える
2. **インラインパス（後に実行）**：`visit(tree, 'text', ...)`で各textノード内の角括弧式を探し、インラインメソッドを処理する。textノードを「前のテキスト・生成ノード・後のテキスト」に分割して置き換える。1つのtextノードに複数の式があってもよい

インラインパスでブロックメソッド（youtube・divider）に出会った場合、およびブロックパスでインラインメソッドだけの段落（例：`[(spacer)]`だけの段落）に出会った場合の扱いも定義する：前者は警告して無変換、後者はインラインパスに任せて通常処理する。

### パーサー（parse.ts）

文字列を受け取り構文木に依存しない純粋関数として実装する。これによりユニットテストが容易になる。

```ts
export interface BracketExpression {
  /** TEXT部。自己完結型ではnull */
  text: string | null;
  /** メソッド名（例：'ruby'、'key'） */
  method: string;
  /** ドット記法のプリセット（例：'command'）。なければnull */
  preset: string | null;
  /** コロン区切りのサブタイプ（例：'dash'）。なければnull */
  subtype: string | null;
  /** 位置引数（トリム済み） */
  args: string[];
  /** 名前付き引数（値の引用符は除去済み） */
  namedArgs: Record<string, string>;
  /** 値を持たないフラグ引数（例：reversed） */
  flags: string[];
  /** 末尾の範囲オペレーター「..」の有無 */
  isRangeStart: boolean;
}

/**
 * source[startIndex]が'['であることを前提に、角括弧式のパースを試みる。
 * パースできなければnullを返す（呼び出し側はそのまま出力する）。
 */
export function parseBracketExpression(
  source: string,
  startIndex: number,
): { expression: BracketExpression; endIndex: number } | null;
```

パース規則：

- `[`の後、最初の`(`までが`TEXT`（空なら自己完結型）。`TEXT`に`[`・`]`を含むことはできない（ネストはフェーズ2）
- メソッド名は`/^[a-z][a-z-]*$/`。直後に`.PRESET`、`:SUBTYPE`が任意で続く
- `(`〜`)`内をカンマで分割して引数にする。ただし引用符（`"..."`・`“...”`）の中のカンマでは分割しない
- `=`を含む引数は名前付き引数、含まない引数のうち定義済みフラグ名（`reversed`など）はフラグ、それ以外は位置引数
- `)`の直後に`..`があれば`isRangeStart: true`、その直後が`]`で終了
- 上記に合致しない場合はnullを返す（例外を投げない）

### mdastノードの生成

生成するHTMLはhast形式で組み立て、mdastのカスタムノードに`data.hName`・`data.hProperties`・`data.hChildren`として持たせる。`mdast-util-to-hast`（remark-rehypeの内部実装。MDXパイプラインも同じものを使う）は、未知のノードでも`data`のこれらのフィールドを尊重してHTML要素に変換する。

```ts
import type { ElementContent, Properties } from 'hast';

/** mdast上に置く、hast出力だけを指示するカスタムノード */
export interface BracketSyntaxNode {
  type: 'bracketSyntax';
  data: {
    hName: string;
    hProperties?: Properties;
    hChildren?: ElementContent[];
  };
}
```

TypeScriptの型解決のため、mdastのモジュール拡張を書く（`any`を使わないこと）。

```ts
declare module 'mdast' {
  interface PhrasingContentMap {
    bracketSyntax: BracketSyntaxNode;
  }
  interface BlockContentMap {
    bracketSyntax: BracketSyntaxNode;
  }
}
```

属性名はhastのプロパティ命名（キャメルケース）に従う：`allowfullscreen`は`allowFullScreen: true`、`referrerpolicy`は`referrerPolicy`、`aria-label`は`ariaLabel`。インラインスタイルは`style`プロパティに文字列で渡す。

### メソッドレジストリ（methods/index.ts）

```ts
import type { VFile } from 'vfile';
import type { BracketExpression, BracketSyntaxNode } from '../types';

/** nullを返すと「変換しない」（呼び出し側が警告済みの場合を除き、ハンドラー内でfile.messageする） */
export type MethodHandler = (
  expression: BracketExpression,
  file: VFile,
) => BracketSyntaxNode | null;

export const inlineMethods: Record<string, MethodHandler> = {
  strong, stroke, doublestroke, weight, oblique, scale, mono, emphasize, ruby, key, spacer,
};

export const blockMethods: Record<string, MethodHandler> = {
  divider, youtube,
};
```

### 警告の出し方

remarkプラグインのtransformerは第2引数で`VFile`を受け取れる。無視した式は`file.message('bracket-syntax: 不正な引数のため無視しました: [TEXT(scale,abc)]')`のように報告する。`message`は警告（ビルド継続）、`fail`はエラー（ビルド停止）。すべて`message`を使う。

### スタイルシート

`apps/web/src/styles/bracket-syntax.css`を新規作成し、`apps/web/src/layouts/Layout.astro`で`global.css`の後にインポートする。

```css
/* 概略。実装時にデザイントークン（CSS変数）を参照して整える */
.bracket-mono {
  font-family: var(--typography-font-family-monospace);
}

.bracket-spacer {
  display: inline-block;
}

kbd {
  /* 枠線・角丸・等幅フォント・パディング。design-tokensのborder・radius・fontFamilyトークンを使う */
}

.bracket-divider {
  /* デフォルトのhrスタイルをリセットし、--divider-gap等のカスタムプロパティで各バリエーションを描く */
}

.bracket-youtube iframe {
  inline-size: 100%;
  aspect-ratio: 16 / 9;
  block-size: auto;
  border: 0;
}
```

クラス名はすべて`bracket-`プレフィックスでグローバルに定義する（remarkプラグインが生成するHTMLにはCSS Modulesのハッシュ付きクラスを割り当てられないため）。

## テスト計画

`@astrojs/markdown-remark`の`createMarkdownProcessor`を使い、**本番と同じパイプライン**（GFM有効・smartypants無効）でMarkdown文字列からHTML文字列への変換を検証する。追加の依存なしで本番同等の統合テストになる。

```ts
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';
import { remarkBracketSyntax } from './index';

const processor = await createMarkdownProcessor({
  gfm: true,
  smartypants: false,
  remarkPlugins: [remarkBracketSyntax],
});

it('グループルビを変換する', async () => {
  const { code } = await processor.render('[超電磁砲(ruby,レールガン)]');
  expect(code).toContain('<ruby>超電磁砲<rt>レールガン</rt></ruby>');
});
```

最低限カバーするケース：

| 分類 | ケース |
| --- | --- |
| 各メソッド | フェーズ1の全メソッド・全サブタイプの基本形と引数バリエーション |
| ruby | モノルビ、グループルビ、読みと文字数の不一致（フォールバック＋警告） |
| youtube | 対応URL形式すべて、`title`引数、`t=`引き継ぎ、不正URL（警告＋無変換）、**GFMオートリンクでURLがlinkノード化された状態での認識**、段落途中での使用（警告＋無変換） |
| 衝突回避 | リンク記法`[text](url)`が変換されないこと、`[ただの角括弧]`が変換されないこと、GFM脚注`[^1]`と干渉しないこと |
| 引用符 | ストレートクォートとカーリークォートの両方で`title="..."`が解釈できること |
| エスケープ | `\\[(divider)\\]`がリテラル表示されること、インラインコード`` `[(divider)]` ``とコードブロック内が変換されないこと |
| 異常系 | 未知のメソッド・不正な引数・閉じ括弧の欠落で、ソースがそのまま出力され例外が出ないこと |
| 複合 | 1つの段落に複数の式、テキストと式の混在、remark-breaksとの併用（改行を含む段落内の式） |

`parse.ts`は上記とは別に、文字列入力に対する純粋関数としてのユニットテストを書く（各記述パターン、引数の引用符、トリム、失敗ケースでnullを返すこと）。

## 実装手順

1. [markdown-line-breaks.md](./markdown-line-breaks.md)を先に実装する（独立した小さい変更として確認まで済ませる）
2. `apps/web`に依存とvitestのセットアップを追加し、ルートの`test:unit`を更新する
3. `parse.ts`とそのテストを実装する
4. プラグイン本体（ブロックパス・インラインパス・エスケープ処理・警告）を実装する
5. フェーズ1のメソッドを実装する（text-style → ruby → key → spacer → divider → youtube の順を推奨）
6. `bracket-syntax.css`を作成し、`Layout.astro`にインポートを追加する
7. `astro.config.ts`にプラグインを組み込む
8. デモページ`apps/web/src/content/pages/bracket-syntax-demo.md`（`unlisted: true`）を作成し、全メソッドの実例を載せて`pnpm dev`で目視確認する。`.mdx`ファイルでも動作することを確認する
9. `pnpm lint`・`pnpm typecheck`・`pnpm test`を通す

ステップ1〜2、3〜4、5〜7、8〜9をそれぞれコミットの区切りの目安とする。

## 未決事項・将来の検討

- **emphasizeの番号対応**：出典ページの実際の見た目との突き合わせが未実施。実装後に目視で調整する
- **フェーズ2の範囲オペレーター**：`[(alignment:center)..]`〜`[..]`は、ブロックパスを拡張して開始・終了マーカーの段落を探し、あいだの兄弟ノードを`<div>`のカスタムノードでラップする方針。`columns`も同じ仕組みに載せる
- **alignmentの単独形**（`段落[(alignment:center)]`）：インラインパスで段落末尾のマーカーを検出し、親の段落ノードの`data.hProperties.style`に`text-align`を追加してマーカーを除去する方針
- **youtubeの読み込み最適化**：iframeの`loading="lazy"`で当面は足りるが、表示パフォーマンスが気になる場合は[lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed)のようなファサード方式を検討する
- **pointerプリセット**：アイコン素材（SVG）の用意が必要なためフェーズ2。`packages/react`で使っているreact-iconsとは仕組みが違う（remarkプラグインはReactコンポーネントを使えない）点に注意
