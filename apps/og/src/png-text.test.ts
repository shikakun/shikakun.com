import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import { addMarker, hasMarker } from './marker';
import { insertTextChunks, readTextChunk } from './png-text';

// フォントに依存しない最小の PNG を作る（矩形のみ）。
function makePng(): Buffer {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#fff"/></svg>';
  return Buffer.from(new Resvg(svg).render().asPng());
}

describe('png-text', () => {
  it('tEXt チャンクを書いて読み戻せる', () => {
    const png = makePng();
    const out = insertTextChunks(png, [{ keyword: 'Software', text: '@shikakun/og' }]);
    expect(readTextChunk(out, 'Software')).toBe('@shikakun/og');
  });

  it('存在しない keyword は null を返す', () => {
    expect(readTextChunk(makePng(), 'Software')).toBeNull();
  });

  it('iTXt（UTF-8）は tEXt 読み取りでは拾わない', () => {
    const out = insertTextChunks(makePng(), [
      { keyword: 'Title', text: '日本語タイトル', intl: true },
    ]);
    // iTXt は tEXt ではないため readTextChunk では取得できない（壊れず読み飛ばせる）。
    expect(readTextChunk(out, 'Title')).toBeNull();
  });

  it('挿入してもバイト列は決定的（同じ入力で同じ出力）', () => {
    const png = makePng();
    const a = addMarker(png, 'タイトル');
    const b = addMarker(png, 'タイトル');
    expect(a.equals(b)).toBe(true);
  });
});

describe('marker', () => {
  it('addMarker した PNG は生成 marker を持つ', () => {
    expect(hasMarker(addMarker(makePng(), 'タイトル'))).toBe(true);
  });

  it('marker の無い PNG（手動画像相当）は false', () => {
    expect(hasMarker(makePng())).toBe(false);
  });
});
