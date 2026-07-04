# デザイントークンをJavaScriptから参照できるようにし、値の二重管理をなくす

- 状態：未着手
- 見積もり：S（半日以内）
- ブランチ：`design-tokens-js-exports`

## ユーザーストーリー

開発者として、デザイントークンの値をJavaScript/TypeScriptから型どおりにimportしたい。それにより、トークンの値が必要な場所（OG画像の配色など）で値を手書きで複製せずに済み、トークンを変更したときにすべての利用箇所が自動で追従するようにしたい。

## 背景（現状の事実）

`@shikakun/design-tokens`はexports `.`でJSと型宣言を公開しているが、両者が一致していない。

- `dist/index.js`（`javascript/esm` format）：ネストしたオブジェクトのdefault export。葉は`$value`のほかメタデータを含むトークンオブジェクト
- `dist/index.d.ts`（カスタムformat `typescript/shikakun-declarations`）：フラットなPascalCaseのnamed export（`export const ColorPaletteWhite: string`など）と`Typography`集約オブジェクトの宣言

型宣言が約束するnamed exportは実体に存在しないため、宣言に従ってimportすると実行時に失敗する。結果として：

- JSからトークンを参照している箇所はリポジトリ内にゼロ（利用はCSS変数`@shikakun/design-tokens/css`のみ）
- 値が必要な場所では手書きの定数で複製している。`apps/og/src/consts.ts`の`COLOR_BACKGROUND`/`COLOR_BORDER`/`COLOR_TEXT`はトークン値（`color.palette.white`/`green.300`/`green.800`）の複製で、対応トークン名をコメントで記録する運用になっている
- 既知の問題として`docs/specs/design-tokens.md`に記載済み

## 価値（なぜやるか）

- **単一の情報源**：トークンの値がJSON定義の一箇所だけになり、複製と手動同期が消える。
- **変更の安全性**：ブランドカラーなどを変えたとき、OG画像を含む全利用箇所が再ビルド・再生成だけで追従する。現状は複製箇所の直し忘れが起こりうる。
- **型宣言の誠実さ**：公開している型が実体と一致しない状態を解消する（マテリアル・オネスティ）。

成功の判定：リポジトリ内からトークン値の手書き複製がなくなり、型と実体の一致が自動テストで保証されること。

## スコープ

### やること

- `packages/design-tokens`のJS出力と型宣言を一致させる
- 型と実体の一致を検証する自動テストを`packages/design-tokens`に追加する
- `apps/og/src/consts.ts`の配色定数をトークンのimportへ置き換える
- 仕様書（`docs/specs/design-tokens.md`・`docs/specs/og-image.md`）の「既知の問題」の記述を更新する

### やらないこと

- CSS変数の出力（`dist/tokens.css`）の変更。既存の利用（web・react）に影響を与えない
- `packages/react`のCSS ModulesをJSトークン参照へ書き換えること（CSS変数のままが適切）
- トークンの追加・改名・値の変更
- `Typography`のような集約オブジェクトの再設計（現在利用箇所がないため、必要になったときに改めて検討する）

## 受け入れ条件

- [ ] `@shikakun/design-tokens`をimportしたとき、型宣言に存在するエクスポートがすべて実体としても存在し、値が宣言どおりの型を持つ。これをパッケージ内の自動テストで検証する
- [ ] `dist/tokens.css`の出力が変更前と一致する（CSS利用側に影響がない）
- [ ] `apps/og/src/consts.ts`から配色の手書き複製が消え、トークンのimportになっている
- [ ] `pnpm og:generate --check`が差分なしで通る（トークン値と現在の定数は同一のため、生成画像のバイト列は変わらないはず。変わった場合は値の変換に問題がある）

## 実装方針の選択肢

| 案 | 内容 | 利点 | 欠点 |
| --- | --- | --- | --- |
| 1（推奨） | Style Dictionary標準のペア（JS：`javascript/es6`、型：`typescript/es6-declarations`）へ揃え、カスタムformatを削除する | 両formatが同じ`token.name`を使うため一致が構造的に保証される。保守する自前コードが最少 | d.tsから`Typography`集約宣言が消える（利用箇所ゼロのため実害なし） |
| 2 | カスタムformatをJS側にも実装し、現在のd.ts（named export＋`Typography`）に実体を合わせる | 現在の型宣言を維持できる | 自前formatが2つに増え、一致の保証を自前コードで担い続けることになる |
| 3 | d.ts側を`dist/index.js`のネスト構造（default export）に合わせて生成し直す | JS出力を変えない | 葉がメタデータつきオブジェクトのままで使い勝手が悪い。対応する標準formatが無く自前実装になる |

案1を推奨する。ツールの標準機能に乗るのがもっとも自然で、一致が構造的に保証される。ただし最終判断は実装時に、標準formatの実際の出力（命名・値の形式）を確認してから行う。

## 作業の分割

1本のブランチで完結する規模だが、それぞれ単独で検証できる次の単位でコミットを分ける。

1. **design-tokens**：出力formatの変更と、型と実体の一致テストの追加。`dist/tokens.css`にdiffが無いことを確認する
2. **apps/og**：配色定数をトークン参照へ置換。`pnpm og:generate --check`で差分なしを確認する
3. **docs**：仕様書2ファイルの更新

## リスクと軽減策

| リスク | 影響 | 軽減策 |
| --- | --- | --- |
| 色トークンの変換結果がhex文字列以外になる | OG画像の描画結果が変わる | 受け入れ条件の`--check`差分なしで検出する |
| format変更がCSS出力へ波及する | サイト・コンポーネントの見た目が壊れる | `dist/tokens.css`のビルド前後diffで検出する |
| 公開パッケージの型APIが変わる（`Typography`宣言の削除など） | 外部利用者への破壊的変更 | 利用者はこのリポジトリのみ。changesetに変更内容を明記する |

## 完了の定義

受け入れ条件に加えて、このプロジェクト共通の完了条件を満たす。

- `pnpm lint`・`pnpm typecheck`・`pnpm test`・`pnpm build`が通る
- `@shikakun/design-tokens`のchangesetを追加している（公開パッケージのため）
- 仕様書（`docs/specs`）が実装後の事実と一致している

## 参考

- [docs/specs/design-tokens.md](../specs/design-tokens.md) — 現状の構成と既知の問題の記載
- [docs/specs/og-image.md](../specs/og-image.md) — 配色定数の複製について触れている箇所
- `packages/design-tokens/style-dictionary.config.ts` — 現在のformat設定
- `apps/og/src/consts.ts` — 置き換え対象の複製定数
