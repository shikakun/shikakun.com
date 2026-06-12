# Markdownの改行をGitHubと同じ挙動にする

`apps/web/src/content/pages`のMarkdownコンテンツで、行末に半角スペース2つを書かなくても、ソース上の単純な改行が`<br>`として描画されるようにする。

## 現状の分析

`apps/web/astro.config.ts`は、Astro 6の`markdown.processor`オプションに`@astrojs/markdown-remark`の`unified()`を渡している。

```ts
// apps/web/astro.config.ts（現状）
export default defineConfig({
  output: 'static',
  markdown: {
    processor: unified({
      // biome-ignore lint: rehype-budouxの型がPlugin<[Options?], Parent>のためRoot型と合わない
      rehypePlugins: [rehypeBudoux as any],
    }),
  },
  integrations: [mdx(), react()],
});
```

このとき、次の事実を押さえておく必要がある（いずれも`apps/web/node_modules/@astrojs/markdown-remark/dist/`のソースで確認済み）。

1. **GitHub Flavored Markdown（GFM）はすでに有効になっている。** `unified()`の`gfm`オプションはデフォルトで`true`であり、テーブル・打ち消し線・自動リンク・タスクリスト・脚注といったGFM拡張は現時点でも動作する。
2. **「単純な改行が`<br>`になる」挙動は、GFMの仕様には含まれていない。** これはGitHubがIssueやコメント欄のレンダリング時にだけ適用している追加の挙動で、remarkエコシステムでは`remark-breaks`プラグインがこれに相当する。つまり、この課題で導入すべきものは`remark-gfm`ではなく`remark-breaks`である。
3. **パイプラインの実行順序**は次の通り。ユーザー指定の`remarkPlugins`は`remark-gfm`と`remark-smartypants`の後に実行される。

   ```
   remark-parse
   → remark-gfm（gfm: trueのとき。デフォルト有効）
   → remark-smartypants（smartypants: trueのとき。デフォルト有効）
   → ユーザー指定のremarkPlugins ←ここにremark-breaksが入る
   → remark-rehype
   → シンタックスハイライト（shiki）
   → ユーザー指定のrehypePlugins（rehype-budoux）
   → rehype-raw → rehype-stringify
   ```

4. **MDXにも自動で波及する。** `@astrojs/mdx`は`extendMarkdownConfig: true`（デフォルト）のとき、`unified()`プロセッサーの`remarkPlugins`・`rehypePlugins`・`gfm`・`smartypants`を継承する（`@astrojs/mdx/dist/index.js`で確認済み）。したがって`astro.config.ts`の1か所を変更すれば、`.md`と`.mdx`の両方に適用される。

## 実装方法

### 1. remark-breaksを追加する

```sh
pnpm --filter @shikakun/web add remark-breaks
```

執筆時点（2026年6月）の最新バージョンは`4.0.0`。インストール前にnpm registryで最新バージョンを確認すること。

### 2. astro.config.tsを変更する

```ts
// apps/web/astro.config.ts（変更後）
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import rehypeBudoux from 'rehype-budoux';
import remarkBreaks from 'remark-breaks';

export default defineConfig({
  output: 'static',
  markdown: {
    processor: unified({
      remarkPlugins: [remarkBreaks],
      // biome-ignore lint: rehype-budouxの型がPlugin<[Options?], Parent>のためRoot型と合わない
      rehypePlugins: [rehypeBudoux as any],
      smartypants: false,
    }),
  },
  integrations: [mdx(), react()],
});
```

`smartypants: false`を併せて指定する。理由は次の2つ。

- smartypantsは英文タイポグラフィ向けの変換（`"` → `“ ”`、`--` → `–`、`...` → `…`）であり、日本語中心のこのサイトでは恩恵がほとんどない。書いた文字がそのまま出力されるほうが、マテリアル・オネスティの観点でも誠実である
- [角括弧構文](./bracket-syntax.md)の名前付き引数（`title="..."`）の引用符がカーリークォートに変換され、パースを壊す（smartypantsはユーザー指定のremarkPluginsより**先に**実行されるため、プラグイン側では回避できない）

なお、角括弧構文（[bracket-syntax.md](./bracket-syntax.md)）を実装する際は、`remarkPlugins`を`[remarkBracketSyntax, remarkBreaks]`の順に並べる。

## 変更後の挙動

| ソース | 出力 |
| --- | --- |
| 行末に半角スペース2つ＋改行 | `<br>`（従来通り） |
| 単純な改行 | `<br>`（**今回の変更で追加**） |
| 空行（1行空ける） | 段落の分割＝別の`<p>`要素（従来通り） |

## 既存コンテンツへの影響

`apps/web/src/content/pages`の既存12ファイルを確認した限り、段落内に改行を含むものはなく、すべて「1行＝1段落」で書かれている。したがって既存ページの出力は変わらない見込みだが、念のため次の手順で確認する。

1. 変更前に`pnpm build`を実行し、`apps/web/dist`を退避する
2. 変更後に再度`pnpm build`を実行し、退避したものとdiffを取る
3. 差分が出た場合は該当ページを目視確認する（smartypantsの無効化により、英文の引用符やダッシュの出力が変わる可能性はある。それは意図した変更）

## 今後のコンテンツ執筆上の注意

この変更後は、**段落の途中でソースを折り返すとそのまま改行として表示される**。エディターの見やすさのために長い段落を途中で折り返す書き方（ハードラップ）はできなくなるので、「改行したい場所でだけ改行する」を執筆規約とする。

## 検証手順

1. `unlisted: true`を付けた検証用ページを`apps/web/src/content/pages`に作成し、次を含める
   - 単純な改行を含む段落（`<br>`になることを確認）
   - 空行で区切った2つの段落（別々の`<p>`になることを確認）
   - GFMのテーブル・打ち消し線・タスクリスト（引き続き動作することを確認）
2. `pnpm dev`で表示を確認する
3. `.mdx`ファイルでも同じ挙動になることを確認する（既存の`.mdx`ページに一時的に改行を入れて確認してもよい）
4. `pnpm lint`と`pnpm typecheck`を通す
5. 確認が済んだら検証用ページを削除するか、角括弧構文のデモページ（[bracket-syntax.md](./bracket-syntax.md)参照）に統合する
