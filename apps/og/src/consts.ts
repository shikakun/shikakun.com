// OG 画像の意匠・寸法を一箇所に集約する。値を変えると生成 PNG のバイトが変わるため、
// 意匠変更はここ（と render.ts）を直してから再生成する。

// 画像サイズ（px）。`og:image:width` / `height` は astro:assets が PNG メタから自動出力する。
export const IMAGE_WIDTH = 1280;
export const IMAGE_HEIGHT = 670;

// 最外周内側に引く枠線（px）。
export const BORDER_WIDTH = 16;

// 左右パディングと下部の安全余白（X のオーバーレイ UI との重なりを避ける）。
export const PADDING_X = 96;
export const SAFE_BOTTOM = 96;

// コンテンツを上下中央に置く基準領域（上端から）。下部の安全余白を除いた高さ。
export const CONTENT_REGION_HEIGHT = IMAGE_HEIGHT - SAFE_BOTTOM; // 574
// コンテンツの横幅（左右パディングを除く）。
export const CONTENT_WIDTH = IMAGE_WIDTH - PADDING_X * 2; // 1088

// アバター（直径）と、アバターと名前テキストの水平ギャップ。
export const AVATAR_SIZE = 72;
export const AVATAR_GAP = 24;

// 名前テキスト。
export const NAME_TEXT = 'shikakun';
export const NAME_FONT_SIZE = 48;
export const NAME_LINE_HEIGHT = 72;
export const NAME_FONT_WEIGHT = 500; // Medium

// 記事タイトル。
export const TITLE_FONT_SIZE = 64;
export const TITLE_LINE_HEIGHT = 96;
export const TITLE_FONT_WEIGHT = 600; // SemiBold
export const TITLE_MAX_LINES = 3;

// 名前の行とタイトル 1 行目の縦間隔。
export const NAME_TITLE_GAP = 48;

// 省略記号（U+2026 HORIZONTAL ELLIPSIS）。
export const ELLIPSIS = '…';

// フォントファミリ。satori は前方一致でグリフ単位にフォールバックする
// （ラテンは Inter、日本語は Noto Sans JP が当たる）。
export const FONT_FAMILY = 'Inter, "Noto Sans JP"';

// 配色。値は @shikakun/design-tokens の以下のトークンと一致する
// （design-tokens の JS エクスポートが型不整合のため、ここでは定数として持つ）。
//   color.palette.white   → 背景
//   color.palette.green.300 → 枠線
//   color.palette.green.800 → 文字
export const COLOR_BACKGROUND = '#ffffff';
export const COLOR_BORDER = '#b7e1c4';
export const COLOR_TEXT = '#405d4a';

// タイトル先頭に来たとき、左端の余白を詰める全角の始め約物。
// satori は OpenType の palt/chws を解さないため、負の textIndent で 1 行目だけ詰める。
export const LEADING_BRACKETS = new Set([
  '「',
  '『',
  '（',
  '〔',
  '【',
  '〈',
  '《',
  '［',
  '｛',
  '〚',
  '〘',
]);
// 詰め幅（em 比）。全角約物はおおよそ半角ぶん左に寄せると左端に揃う。
export const LEADING_BRACKET_INDENT_EM = 0.5;

// 生成 marker（PNG tEXt チャンク）。手動画像と生成画像を見分ける所有印。
export const MARKER_KEYWORD = 'Software';
export const MARKER_VALUE = '@shikakun/og';
// デバッグ用に併記する iTXt のキーワード（正規化済みタイトルを入れる）。
export const TITLE_KEYWORD = 'Title';
