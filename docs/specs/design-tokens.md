# デザイントークン（packages/design-tokens）

## 概要

`@shikakun/design-tokens`は、サイトとコンポーネントライブラリで共有するデザイントークンのパッケージ。トークンはDTCG（Design Tokens Community Group）形式のJSON（`$schema: 2025.10`）で`src/`に定義し、Style Dictionaryでビルドする。GitHub Packagesへ公開される（[ci-cd.md](./ci-cd.md)）。

## トークンの構成

| ファイル | トークン | 内容 |
| --- | --- | --- |
| `src/color/palette.json` | `color.palette.*` | 原色パレット。white/black/transparentとgray/green/blue/redの各50〜950。oklch色空間で定義（hex併記） |
| `src/color/semantic.json` | `color.semantic.*` | 意味づけされた色。`primary`→green、`neutral`→gray、`informative`→blue、`negative`→redをパレット参照（`{color.palette.…}`）で定義 |
| `src/elevation/shadow.json` | `elevation.shadow.0〜3` | 影 |
| `src/motion/duration.json`・`easing.json` | `motion.duration.default`・`motion.easing.default` | モーション |
| `src/size/border.json` | `size.border.m/l/xl` | 枠線の太さ |
| `src/size/interactiveComponent.json` | `size.interactiveComponent.s/m` | インタラクティブ要素の高さ |
| `src/size/radius.json` | `size.radius.m/l/xl/full` | 角丸 |
| `src/size/scale.json` | `size.scale.*` | px対応のremスケール（minus1・0〜） |
| `src/size/spacing.json` | `size.spacing.3xs〜` | 余白 |
| `src/typography/*.json` | `typography.*` | fontFamily（sansSerif/monospace/default）・fontSize（2xs〜6xl）・fontWeight（normal/bold/default）・letterSpacing・lineHeight（fontSizeごとにdense/normal/comfort） |

## ビルドと出力

`style-dictionary.config.ts`で3つの出力を生成する（`pnpm --filter @shikakun/design-tokens build`）。

| 出力 | 形式 | エクスポート |
| --- | --- | --- |
| `dist/tokens.css` | `css/variables`（`:root`のCSS変数。例：`--color-semantic-primary-500`、`--size-spacing-m`） | `@shikakun/design-tokens/css` |
| `dist/index.js` | `javascript/esm` | `@shikakun/design-tokens` |
| `dist/index.d.ts` | カスタムformat`typescript/shikakun-declarations`（トークンごとの`export const`宣言と、typography配下をまとめた`Typography`オブジェクトの宣言） | 同上の型 |

## 利用方法と既知の問題

- **CSS変数として使うのが実際の利用方法**。`apps/web`の`Layout.astro`と`packages/react`のStorybookが`@shikakun/design-tokens/css`をimportし、各CSS Modulesが`var(--…)`で参照する。
- **JSエクスポートは実質使えない**：`dist/index.js`（javascript/esm形式）と`dist/index.d.ts`（カスタム宣言）の構造が一致しておらず、JavaScript/TypeScriptからトークン値を参照できない。このため、JSでトークン値が必要な箇所（例：`apps/og/src/consts.ts`の配色）は値をローカル定数として持ち、対応するトークン名をコメントに記す運用になっている。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| `packages/design-tokens/src/**/*.json` | トークン定義（DTCG形式） |
| `packages/design-tokens/style-dictionary.config.ts` | ビルド設定とカスタムformat |
| `packages/design-tokens/package.json` | exports（`.`と`./css`）・publishConfig |
