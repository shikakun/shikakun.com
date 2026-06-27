import { describe, expect, it } from 'vitest';
import * as C from './consts';
import { loadFonts } from './fonts';
import { hasMarker } from './marker';
import { readTextChunk } from './png-text';
import { countLines, fitTitle, leadingIndentStyle, renderOgImage } from './render';

// PNG の IHDR から幅・高さを読む。
function pngSize(png: Buffer): { width: number; height: number } {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

const fonts = loadFonts();

const LONG_TITLE =
  'とても長い日本語のタイトルをわざと用意して三行に収まりきらないようにする想定のテキストをここに延々と書き連ねていく必要があるので続けます';

describe('renderOgImage', () => {
  it('1280×670 の PNG を生成する', async () => {
    const png = await renderOgImage('テストタイトル');
    expect(pngSize(png)).toEqual({ width: C.IMAGE_WIDTH, height: C.IMAGE_HEIGHT });
  });

  it('生成 marker を埋め込む', async () => {
    const png = await renderOgImage('テストタイトル');
    expect(hasMarker(png)).toBe(true);
    expect(readTextChunk(png, C.MARKER_KEYWORD)).toBe(C.MARKER_VALUE);
  });

  it('同一入力で同一バイト列を返す（決定的）', async () => {
    const a = await renderOgImage('決定性のテスト');
    const b = await renderOgImage('決定性のテスト');
    expect(a.equals(b)).toBe(true);
  });

  it('NFC 同型（合成済み「が」と分解「か + 結合用濁点」）が同じ画像になる', async () => {
    const composedInput = String.fromCodePoint(0x304c); // が（合成済み）
    const decomposedInput = String.fromCodePoint(0x304b, 0x3099); // か + 結合用濁点
    // 正規化前は別の文字列であることを確かめてから、生成結果の一致を見る。
    expect(composedInput).not.toBe(decomposedInput);
    const composed = await renderOgImage(composedInput);
    const decomposed = await renderOgImage(decomposedInput);
    expect(composed.equals(decomposed)).toBe(true);
  });

  it('前後の空白を trim してから描画する', async () => {
    const trimmed = await renderOgImage('タイトル');
    const padded = await renderOgImage('  タイトル  ');
    expect(trimmed.equals(padded)).toBe(true);
  });
});

describe('fitTitle', () => {
  it('短いタイトルは省略記号を付けない', async () => {
    const result = await fitTitle('短いタイトル', fonts);
    expect(result.endsWith(C.ELLIPSIS)).toBe(false);
  });

  it('長いタイトルは 3 行以内に収め、末尾を … で省略する', async () => {
    const result = await fitTitle(LONG_TITLE, fonts);
    expect(result.endsWith(C.ELLIPSIS)).toBe(true);
    expect(await countLines(result, LONG_TITLE, fonts)).toBeLessThanOrEqual(C.TITLE_MAX_LINES);
  });
});

describe('leadingIndentStyle（先頭約物の詰め）', () => {
  it('全角の始め約物で始まると負の textIndent を返す', () => {
    const style = leadingIndentStyle('「カギ括弧');
    expect(Number(style.textIndent)).toBeLessThan(0);
  });

  it('通常の文字で始まると詰めない', () => {
    expect(leadingIndentStyle('通常のタイトル')).toEqual({});
  });
});
