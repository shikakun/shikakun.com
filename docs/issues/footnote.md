# Markdown で脚注を表現できるようにする

## 概要

サイトのコンテンツ（`.md` / `.mdx`）で脚注を書けるようにする。記法は GitHub Flavored Markdown（GFM）標準の `[^1]`（本文側の参照）と `[^1]: …`（末尾の定義）を採用する。

調査の結果、このサイトの Markdown パイプラインでは GFM が既定で有効なため、**脚注はすでにパースされ HTML へ変換されている**。本 issue の主目的は「脚注を動かす」ことではなく、英語のままになっているラベルの日本語化・スタイルの整備・RSS 全文配信での挙動・ドキュメント整備など、**仕上げに必要な未対応点を埋めること**にある。

## 前提

- 個人サイトで、開発者は本人のみ。多人数開発・外部コントリビューターは想定しない
- 堅牢性は最小限でよい。脚注の記述ミスでビルドが落ちなければよく、表示の不完全さは許容する
- 既存の独自記法（角括弧構文）は変更しない。脚注は GFM 標準記法として独立して提供する
- ラベルの日本語化や属性の扱いは、ライブラリ（`remark-gfm` / `remark-rehype`）が提供する設定の範囲で実現することを優先する

## 背景・目的

記事の本文に注釈・出典・補足を添えたい場面がある。現状でも GFM の脚注記法は HTML 化されるが、次の点が未整備で、そのままでは公開できる品質に達していない。

- 脚注セクションの見出しが英語（`Footnotes`）、後方参照リンクの読み上げラベルも英語（`Back to reference 1`）
- 脚注セクションのスタイルが未調整（見出しが本文の `h2` と同じ大きさで表示されるなど）
- RSS の全文配信で、脚注のジャンプリンクがリーダー上で機能しない（後述）
- 記法ガイド（`/markdown/`）に脚注の記述がない

GFM 標準記法を採用するのは、すでに動作していて実装コストが最小であること、一般的な記法でエディタの補完なども効くこと、参照と定義の2部構成を独自の角括弧構文（インライン中心の設計）で表現するのは複雑になることによる。

## ゴール / 非ゴール

### ゴール

- `.md` / `.mdx` の本文で GFM 標準記法の脚注（`[^1]` と `[^1]: …`）を書けて、アクセシブルな HTML として表示される
- 脚注セクションの見出し・後方参照リンクのラベルが日本語で表示される
- 脚注セクションがサイトの本文スタイルと調和して表示される
- RSS の全文配信でも脚注の本文が配信され、参照と定義のあいだのジャンプリンクが機能する
- 記法ガイド（`/markdown/`）に脚注の記述とサンプルが追加される

### 非ゴール

- 脚注のための独自記法（角括弧構文への脚注メソッド追加）の実装
- 脚注以外の GFM 機能（表・タスクリストなど）の仕様変更
- 同一の脚注を複数箇所から参照したときの体験の作り込み（標準の挙動に委ねる）

## 用語

- **脚注参照**: 本文中に置く `[^ラベル]`。`<sup><a>` として上付きの番号リンクになる
- **脚注定義**: 段落として書く `[^ラベル]: 本文`。文書末尾の脚注セクションへ集約される
- **脚注セクション**: 文書末尾に出力される `<section class="footnotes">`。見出しと脚注の番号付きリストを含む
- **後方参照リンク**: 各脚注定義の末尾に付く、参照元へ戻るリンク（既定では `↩`）

## 現状の把握

### Markdown パイプライン

`apps/web/astro.config.mjs` は `@astrojs/markdown-remark` の `unified()` プロセッサにカスタムプラグインを渡している。`gfm` オプションを明示していないため既定値 `true` が効き、`remark-gfm` がカスタムの remark プラグインより前に実行される。実際の処理順は次のとおり。

1. `remark-parse`
2. `remark-gfm`（`gfm` 既定 `true`。**脚注はここでパースされる**）
3. `remark-smartypants`（`smartypants: false` のため無効）
4. `remarkBracketSyntax` → `remarkBreaks`（カスタム）
5. `remarkCollectImages`
6. `remark-rehype`
7. Shiki（シンタックスハイライト）
8. `rehypeBudoux` → `rehypeExternalLinks`（カスタム）
9. `rehypeImages` → `rehypeHeadingIds` → `rehype-raw` → `rehype-stringify`

### 現状の出力 HTML

GFM 既定の出力を実際に確認したところ、次の HTML が生成される。

```html
<!-- 本文側 -->
<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref aria-describedby="footnote-label">1</a></sup>

<!-- 文書末尾 -->
<section data-footnotes class="footnotes">
  <h2 class="sr-only" id="footnote-label">Footnotes</h2>
  <ol>
    <li id="user-content-fn-1">
      <p>これは脚注の内容です。 <a href="#user-content-fnref-1" data-footnote-backref aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
    </li>
  </ol>
</section>
```

把握できた点は次のとおり。

- 見出しは英語（`Footnotes`）、後方参照リンクの `aria-label` も英語（`Back to reference 1`）
- 見出しには `class="sr-only"` が付くが、サイトに `.sr-only` の定義がない（`global.css` に存在しない）。そのため現状は見出しが本文の `h2` と同じ大きさで**そのまま見えてしまう**
- 各 ID には `user-content-` の接頭辞が付く（`remark-rehype` の `clobberPrefix` 既定値）
- マークアップ自体はアクセシブル（`aria-describedby` / `data-footnote-ref` など）で、ラベルの言語以外に大きな問題はない

### 角括弧構文との関係

- 角括弧構文のパーサーは `[` の直後を式として解釈するが、メソッドをともなう丸括弧がなければ変換しない。`[^1]` は丸括弧を持たないため変換対象にならず、両者は衝突しない
- 記法ガイド（`apps/web/src/content/pages/markdown.mdx`）の「エスケープ」節には、脚注 `[^1]` が角括弧構文として解釈されない旨がすでに明記されている

### 本文スタイルの所在

- 記事本文は `@shikakun/react` の `Prose` コンポーネント（`<Prose>`）でラップして表示している
- 本文要素のスタイルは `packages/react/src/components/Prose/Prose.module.css` に集約されている（`.prose p` に `text-align: justify` など）
- 脚注セクションは本文の末尾、`<Prose>` の内側に出力される。したがって脚注のスタイルは `Prose.module.css` に追加する（公開パッケージのため Changeset の対象になる）

### RSS 全文配信との関係

- `apps/web/scripts/feed-integration.mjs` が、ビルド済みページの `<article>` の中身を取り出し、`<header>` / `<footer>` を除いて `content:encoded` として配信している
- 脚注セクションは `<section>` であり `<footer>` ではないため、本文として配信対象に残る
- ただし sanitize 設定（`sanitize-html`）の `allowedAttributes` が `id` / `aria-*` / `data-*` を許可していない。そのため脚注の参照・定義に付く `id` が落ち、ジャンプリンク（`#user-content-fn-1`）の飛び先が失われる。**現状のままでは RSS リーダー上で脚注のジャンプが機能しない**（本文テキスト自体は残る）
- 本文の相対 URL を絶対 URL へ書き換える処理（`toAbsoluteUrls`）は `/` 始まりだけを対象とする。脚注リンクは `#` 始まりのフラグメントなので書き換えられず、ID さえ残ればリーダー内のアイテムでジャンプできる

---

## 要求定義

### 機能要求

- **FR-1**: `.md` / `.mdx` の本文で、GFM 標準の脚注記法（参照 `[^ラベル]`、定義 `[^ラベル]: 本文`）を書ける
- **FR-2**: 脚注参照が上付きの番号リンク（`<sup><a>`）として表示され、対応する脚注定義へジャンプできる
- **FR-3**: 文書末尾の脚注セクションに、脚注が番号付きで一覧表示され、各脚注から参照元へ戻れる
- **FR-4**: 脚注セクションの見出しが日本語で表示される
- **FR-5**: 後方参照リンクの読み上げラベル（`aria-label`）が日本語になる
- **FR-6**: 脚注の本文中でも、強調・リンクなど通常の Markdown インライン記法が使える
- **FR-7**: RSS の全文配信で脚注の本文が配信され、参照と定義のあいだのジャンプリンクが機能する
- **FR-8**: 記法ガイド（`/markdown/`）に脚注の説明とサンプルが追加される

### 非機能要求

- **NFR-1**: 脚注のスタイルはサイトの本文スタイルと調和し、本文と脚注の境界が視覚的に分かる
- **NFR-2**: 脚注のマークアップはアクセシブルである（参照・定義の関連付け、見出しによる領域の明示、キーボードで往復できること）
- **NFR-3**: 脚注の記述ミス（定義のない参照、参照のない定義など）でビルドが失敗しない
- **NFR-4**: ラベルの日本語化やスタイルは、ライブラリが提供する設定・標準的な CSS の範囲で実現し、出力 HTML を後段で文字列置換するようなハックを避ける

---

## 受け入れ条件

- **AC-1**: 本文に `[^1]` と `[^1]: 内容` を書くと、参照が上付き番号リンクになり、末尾の脚注セクションに内容が表示される（`.md` / `.mdx` の両方で確認する）
- **AC-2**: 脚注参照をたどると脚注定義へ、後方参照リンクをたどると参照元へ移動できる
- **AC-3**: 脚注セクションの見出しが日本語で表示される
- **AC-4**: 後方参照リンクの `aria-label` が日本語になっている
- **AC-5**: 脚注の本文中の強調・リンクが正しく表示され、外部リンクには `target="_blank"` / `rel="noopener noreferrer"` が付く
- **AC-6**: `feed.xml` の該当アイテムの `content:encoded` に脚注セクションが含まれ、参照・定義の `id` が保持されていてジャンプリンクが機能する
- **AC-7**: `/markdown/` に脚注の節が追加され、サンプルが実際に脚注として表示される
- **AC-8**: 脚注を含むページで `pnpm --filter @shikakun/web build` がエラーや想定外の警告なく通る

---

## 設計（実装方針）

### 1. ラベルの日本語化（`apps/web/astro.config.mjs`）

`unified()` に渡す `remarkRehype` オプションで、脚注ラベル関連を日本語に設定する。`remark-rehype` が用意する次のオプションを使う。

- `footnoteLabel`: 見出しテキスト（例: `脚注`）
- `footnoteBackLabel`: 後方参照リンクの `aria-label`（関数で参照番号を受け取れる）
- `footnoteLabelTagName`: 見出しのタグ名（既定 `h2` のままでよい）
- `footnoteLabelProperties`: 見出しの属性。既定は `{ className: ['sr-only'] }`。見出しを表示するため空オブジェクト等で `sr-only` を外す（具体値は実装時に確定）

### 2. 脚注セクションのスタイル（`packages/react/src/components/Prose/Prose.module.css`）

`.prose` 配下のセレクタで次を整える。

- `.footnotes`（セクション）: 本文との境界（区切り線・上方向の余白など）、見出しのサイズを本文の `h2` より控えめにする
- 脚注参照 `sup a[data-footnote-ref]`: 上付き番号リンクの見た目
- 後方参照リンク `a[data-footnote-backref]`: 戻り矢印の見た目
- 既存の `.prose p { text-align: justify }` が脚注定義の段落にも効く点を確認し、必要なら調整する

公開パッケージ `@shikakun/react` を変更するため、Changeset を追加する。

### 3. RSS 全文配信での脚注リンク（`apps/web/scripts/feed-integration.mjs`）

`sanitize` の `allowedAttributes` に、脚注のジャンプに必要な属性を追加する。

- `li`・`a` などに `id` を許可（ジャンプの飛び先を保持するため必須）
- アクセシビリティを保つため `aria-describedby` / `aria-label` も許可（任意）
- `data-footnotes` / `data-footnote-ref` / `data-footnote-backref` は装飾・スクリプト用途で、RSS では不要なので許可しなくてよい

`toAbsoluteUrls` は変更不要（フラグメントリンクは対象外で、ID が残れば機能する）。

### 4. ドキュメント（`apps/web/src/content/pages/markdown.mdx`）

- 「脚注」の節を追加し、参照と定義のサンプル、コードブロックでの記法例を載せる
- 末尾の記法一覧（独自記法の表）とは別に、GFM 標準記法として説明する（独自記法ではない旨を明記）

---

## タスク

- **T-1**: `astro.config.mjs` の `remarkRehype` で脚注ラベルを日本語化する
- **T-2**: `Prose.module.css` に脚注セクションのスタイルを追加する
- **T-3**: `@shikakun/react` の Changeset を追加する
- **T-4**: `feed-integration.mjs` の sanitize 設定に脚注の `id` 等を許可する
- **T-5**: `markdown.mdx` に脚注の節とサンプルを追加する
- **T-6**: `.md` / `.mdx` 双方での表示と RSS 出力を確認する（「動作確認」参照）

---

## リスク・考慮事項

- **MDX での脚注**: MDX（`@astrojs/mdx`）は `extendMarkdownConfig` でカスタムの remark プラグインを継承しており、角括弧構文が `.mdx` でも動く実績がある。脚注（`remark-gfm`）も同様に効くと見込まれるが、`.md` と `.mdx` の双方で実際に表示を確認する
- **ID の衝突**: 脚注の ID には `user-content-` 接頭辞が付くが、ページをまたぐと同じ ID（`user-content-fn-1` など）が生成される。RSS リーダーが複数アイテムを1ページにまとめて表示する場合、ジャンプ先が衝突しうる。これは GFM と RSS 全文配信の一般的な制約で、個人サイトでは許容する
- **均等割付の影響**: `.prose p` の `text-align: justify` が脚注定義の短い段落に効くと不自然に見える可能性がある。必要なら脚注内の段落だけ調整する
- **Budoux の影響**: `rehypeBudoux` が脚注本文にも `<wbr>` を挿入するが、これは本文と同じ望ましい挙動。番号や戻り矢印には影響しない
- **エスケープ**: 文中に `[^1]` という文字列そのものを表示したい場合は、インラインコードやエスケープで回避できる（記法ガイドのエスケープ節に準じる）

## 動作確認

- 脚注を含むサンプルを `.md` と `.mdx` の双方で用意し、`pnpm --filter @shikakun/web dev` で表示・ジャンプ・戻りを確認する
- 見出しと後方参照ラベルが日本語であることを確認する
- `pnpm --filter @shikakun/web build` 後、`dist/feed.xml` の該当アイテムに脚注セクションが含まれ、`id` が保持されていることを確認する
- `pnpm --filter @shikakun/web lint` / `pnpm --filter @shikakun/web typecheck` が通ることを確認する
