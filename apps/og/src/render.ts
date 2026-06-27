// タイトル文字列 → 1280×670 PNG の描画。
// satori でレイアウトを SVG 化し、@resvg/resvg-js で PNG にラスタライズする。
// 同一入力・同一フォント・同一ライブラリ版で同一バイト列を返す（決定的）。

import { Resvg } from '@resvg/resvg-js';
import { loadDefaultJapaneseParser } from 'budoux';
import type { ReactNode } from 'react';
import type { Font } from 'satori';
import satori from 'satori';
import * as C from './consts';
import { loadAvatarDataUri, loadFonts } from './fonts';
import { addMarker } from './marker';

const parser = loadDefaultJapaneseParser();

// satori は React 要素（ReactNode）を受け取るが、プレーンオブジェクトでも
// type / props を読んでレイアウトする。React 依存を持たないため自前の最小ノードで組み立てる。
type StyleValue = string | number;
type Style = Record<string, StyleValue>;
type VChild = VNode | string;
interface VNode {
  type: string;
  props: { style?: Style; children?: VChild | VChild[]; [key: string]: unknown };
}

function h(type: string, props: VNode['props']): VNode {
  return { type, props };
}

// satori の引数型（ReactNode）へは構造が一致するので unknown 経由で渡す。
function toSatori(node: VNode): ReactNode {
  return node as unknown as ReactNode;
}

// BudouX の分節境界に ZWSP を挿入する。wordBreak: keep-all と組み合わせ、
// satori が ZWSP の位置でだけ折り返すようにする。
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
function segmentTitle(text: string): string {
  return parser.parse(text).join(ZERO_WIDTH_SPACE);
}

// 先頭が全角の始め約物なら、1 行目だけ左へ詰めるための負の textIndent を返す。
export function leadingIndentStyle(text: string): Style {
  const first = text[0];
  if (first && C.LEADING_BRACKETS.has(first)) {
    return { textIndent: -Math.round(C.TITLE_FONT_SIZE * C.LEADING_BRACKET_INDENT_EM) };
  }
  return {};
}

// 計測用・本描画用で同一スタイルのタイトルノードを作る（行数計測と本番がずれないように）。
function titleNode(displayText: string, rawText: string, extraStyle: Style = {}): VNode {
  return h('div', {
    style: {
      width: C.CONTENT_WIDTH,
      fontFamily: C.FONT_FAMILY,
      fontWeight: C.TITLE_FONT_WEIGHT,
      fontSize: C.TITLE_FONT_SIZE,
      lineHeight: `${C.TITLE_LINE_HEIGHT}px`,
      color: C.COLOR_TEXT,
      textAlign: 'left',
      wordBreak: 'keep-all',
      ...leadingIndentStyle(rawText),
      ...extraStyle,
    },
    children: displayText,
  });
}

// タイトルノードを単体で satori に通し、行数を計測する。
// height を渡さないと satori はコンテンツ高さを算出して SVG の height 属性に出す。
export async function countLines(
  displayText: string,
  rawText: string,
  fonts: Font[],
): Promise<number> {
  // 行数は SVG の height 属性だけで判定するため、計測ではフォントを埋め込まない（軽量）。
  const svg = await satori(toSatori(titleNode(displayText, rawText)), {
    width: C.CONTENT_WIDTH,
    fonts,
    embedFont: false,
  });
  const match = svg.match(/<svg[^>]*\bheight="([\d.]+)"/);
  const height = match ? Number.parseFloat(match[1]) : 0;
  return Math.max(1, Math.round(height / C.TITLE_LINE_HEIGHT));
}

// タイトルを最大行数に収める表示文字列を返す。
// 超過時は二分探索で末尾を削り、末尾に … を付ける（決定的）。
export async function fitTitle(normalized: string, fonts: Font[]): Promise<string> {
  const full = segmentTitle(normalized);
  if ((await countLines(full, normalized, fonts)) <= C.TITLE_MAX_LINES) {
    return full;
  }

  const chars = Array.from(normalized);
  const candidate = (length: number): string =>
    `${segmentTitle(chars.slice(0, length).join('').replace(/\s+$/, ''))}${C.ELLIPSIS}`;

  // 「先頭 length 文字 + …」が最大行数に収まる最大の length を二分探索する。
  let low = 1;
  let high = chars.length - 1;
  let best = 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if ((await countLines(candidate(mid), normalized, fonts)) <= C.TITLE_MAX_LINES) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return candidate(best);
}

// 画像全体のレイアウト（枠線・コンテンツの上下中央寄せ・アバター + 名前 + タイトル）。
function frame(titleDisplay: string, rawText: string, avatar: string): VNode {
  const nameRow = h('div', {
    style: { display: 'flex', alignItems: 'center' },
    children: [
      h('img', {
        src: avatar,
        width: C.AVATAR_SIZE,
        height: C.AVATAR_SIZE,
        style: { width: C.AVATAR_SIZE, height: C.AVATAR_SIZE, borderRadius: C.AVATAR_SIZE / 2 },
      }),
      h('div', {
        style: {
          marginLeft: C.AVATAR_GAP,
          fontFamily: C.FONT_FAMILY,
          fontWeight: C.NAME_FONT_WEIGHT,
          fontSize: C.NAME_FONT_SIZE,
          lineHeight: `${C.NAME_LINE_HEIGHT}px`,
          color: C.COLOR_TEXT,
        },
        children: C.NAME_TEXT,
      }),
    ],
  });

  const content = h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      position: 'absolute',
      top: 0,
      left: C.PADDING_X,
      width: C.CONTENT_WIDTH,
      height: C.CONTENT_REGION_HEIGHT,
    },
    children: [nameRow, titleNode(titleDisplay, rawText, { marginTop: C.NAME_TITLE_GAP })],
  });

  // 枠線は最前面のオーバーレイとして引く（コンテンツの座標計算に影響させない）。
  const border = h('div', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: C.IMAGE_WIDTH,
      height: C.IMAGE_HEIGHT,
      border: `${C.BORDER_WIDTH}px solid ${C.COLOR_BORDER}`,
    },
  });

  return h('div', {
    style: {
      display: 'flex',
      position: 'relative',
      width: C.IMAGE_WIDTH,
      height: C.IMAGE_HEIGHT,
      backgroundColor: C.COLOR_BACKGROUND,
    },
    children: [content, border],
  });
}

function rasterize(svg: string): Buffer {
  // satori は embedFont: true で文字をパス化するため、resvg 側はフォント不要。
  const resvg = new Resvg(svg, {
    font: { loadSystemFonts: false },
    fitTo: { mode: 'original' },
  });
  return Buffer.from(resvg.render().asPng());
}

/**
 * タイトルから OG 画像（生成 marker 付き PNG）を生成する。
 * title は呼び出し側で渡された生フロントマター値。ここで NFC 正規化 + trim する。
 */
export async function renderOgImage(title: string): Promise<Buffer> {
  const normalized = title.normalize('NFC').trim();
  const fonts = loadFonts();
  const avatar = loadAvatarDataUri();
  const display = await fitTitle(normalized, fonts);
  const svg = await satori(toSatori(frame(display, normalized, avatar)), {
    width: C.IMAGE_WIDTH,
    height: C.IMAGE_HEIGHT,
    fonts,
    embedFont: true,
  });
  return addMarker(rasterize(svg), normalized);
}
