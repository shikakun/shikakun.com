# Reactコンポーネントライブラリ（packages/react）

## 概要

`@shikakun/react`は、サイトで使うUIコンポーネントのライブラリ。React 19をpeer dependencyとし、スタイルはCSS Modules＋デザイントークンのCSS変数で実装する。GitHub Packagesへ公開される（[ci-cd.md](./ci-cd.md)）。

## ビルドと利用方法

- Viteのライブラリモード（ES形式、react/react-dom/jsx-runtimeはexternal）でJSを、`tsc --emitDeclarationOnly`で型宣言を`dist/`へ出力する。
- exportsは`.`（`dist/index.js`＋型）と`./css`（`dist/index.css`。全コンポーネントのスタイルを結合したもの）。
- 利用側はコンポーネントのimportに加えて`import '@shikakun/react/css'`が必要（`apps/web`では`Layout.astro`で読み込む）。

## コンポーネント

`src/index.ts`からエクスポートされるコンポーネント。

| コンポーネント | 内容 |
| --- | --- |
| `Button` | ボタン／リンク。`href`の有無で`<a>`と`<button>`を切り替える。`appearance`（text/outlined/tinted/filled、既定text）・`color`（primary/neutral/informative/negative、既定neutral）・`size`（s/m）・`shape`（square/circle/none）・`width`（auto/full/half/third）・`layout`（center/start/space-between）・`leadingIcon`/`trailingIcon`。`icon`のみの場合は`aria-label`か文字列の`children`が型で必須になる。`target="_blank"`時は`rel="noopener noreferrer"`を自動付与 |
| `Interactive` | ホバー・フォーカスなどインタラクション時の表現を与えるポリモーフィックな基盤コンポーネント（`as`で要素を指定）。`Button`や`PageList`の下地 |
| `Text` | タイポグラフィ。デザイントークンで定義した組み合わせから`fontSize`（2xs〜6xl/inherit、既定m）・`fontWeight`・`fontFamily`（sansSerif/monospace）・`lineHeight`（dense/normal/comfort。fontSizeとの組でクラスが決まる）・`kerning`・`lineClamp`を指定する。`as`で出力要素を選ぶ（既定span） |
| `Heading` | 見出し。`level`（1〜3）ごとに要素とタイポグラフィが決まる（1: h1/2xl/normal、2: h2/l/bold、3: h3/m/bold。行間はいずれもdense）。文字列のchildrenはBudouXで分節して`<wbr>`を挿入する |
| `Prose` | 記事本文用のタイポグラフィスタイルを与えるラッパー（`<div class="prose">`）。Markdownが生成する見出し・リスト・コードブロックなどのスタイルを内包する |
| `FormattedDate` | `YYYY`・`YYYY-MM`・`YYYY-MM-DD`・`YYYY-MM-DD HH:MM`形式の文字列を英語表記（例：`Jun 25, 2026`）の`<time>`で出力する。不正な値のときは何も描画しない |
| `PageList` | ページ一覧。タイトルと日付をリーダー（点線）でつなぐリスト。`titleLineClamp`で行数制限 |
| `NavigationMenu` | 水平ナビゲーション。ResizeObserverと非表示のghost要素で各項目の幅を計測し、コンテナに入りきらない項目を「…」ボタンのメニュー（`Menu`）へ折りたたむ。`items`は`{ href, label, target?, isCurrent? }` |
| `Menu` | ドロップダウンメニュー。`@floating-ui/react`ベースの複合コンポーネントで、`Menu`（ルート。`placement`指定可）・`Menu.Trigger`（Buttonを継承）・`Menu.Popup`・`Menu.Item`（button/link）・`Menu.Divider`で構成。キーボードナビゲーション・フォーカス管理・開閉トランジションを内包する |
| `TextField` | テキスト入力。`label`・`description`・`error`/`errorMessage`を持ち、id・`aria-describedby`の接続を自動で行う。`rows`が2以上で`<textarea>`、それ以外は`<input>`（`type`はtext/email/password/number/tel/url/search）。`autoComplete`はHTML仕様の値のユニオン型 |
| `VisuallyHidden` | 視覚的に隠しつつ支援技術には読ませるラッパー |

## ユーティリティ

| 関数 | 内容 |
| --- | --- |
| `formatDate` | `FormattedDate`の実体。日付文字列の検証と英語表記への整形。不正な値は空文字を返す |
| `capitalize` | 先頭1文字を大文字化（CSS Modulesのクラス名合成に使う） |

## Storybookとテスト

- Storybook 10（`@storybook/react-vite`＋addon-docs）。storyは`src/**/*.stories.tsx`。`.storybook/preview.ts`で`@shikakun/design-tokens/css`を読み込む。`pnpm storybook`でポート6006。
- ユニットテストはVitest（jsdom環境）。`getHeadingStyle`・`getTextClassNames`・`getTextFieldClassNames`・`formatDate`などロジック部分に`*.test.ts`がある。
- `test-storybook`（Storybook test-runner）はCIでビルド済みStorybookに対して実行される（[ci-cd.md](./ci-cd.md)）。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `packages/react/src/index.ts` | 公開APIのエクスポート一覧 |
| `packages/react/src/components/` | 各コンポーネント（実装・CSS Modules・story） |
| `packages/react/vite.config.ts` | ライブラリビルドとVitestの設定 |
| `packages/react/package.json` | exports・peerDependencies・publishConfig |
