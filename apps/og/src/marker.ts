// 生成 marker（provenance）の付与・判定。
// 生成画像だけに tEXt `Software=@shikakun/og` を埋め込み、手動画像と見分ける。

import { MARKER_KEYWORD, MARKER_VALUE, TITLE_KEYWORD } from './consts';
import { insertTextChunks, readTextChunk } from './png-text';

/** 生成 marker（と、デバッグ用の正規化済みタイトル）を埋め込んだ PNG を返す。 */
export function addMarker(png: Buffer, normalizedTitle: string): Buffer {
  return insertTextChunks(png, [
    { keyword: MARKER_KEYWORD, text: MARKER_VALUE },
    { keyword: TITLE_KEYWORD, text: normalizedTitle, intl: true },
  ]);
}

/** PNG が生成 marker を持つ（= 生成画像）かどうか。 */
export function hasMarker(png: Buffer): boolean {
  return readTextChunk(png, MARKER_KEYWORD) === MARKER_VALUE;
}
