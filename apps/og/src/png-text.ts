// PNG の tEXt / iTXt チャンクを読み書きする最小ユーティリティ。
// 重い依存を避け、決定的な書き出し（固定の順序・固定の値）を自分で制御する。
// PNG のチャンク構造: [length(4B BE)][type(4B)][data(length)][crc(4B BE: type+data)]

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// PNG/zlib と同じ CRC-32（多項式 0xEDB88320）。
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

// tEXt: keyword(Latin-1) + 0x00 + text(Latin-1)
function makeTextChunk(keyword: string, text: string): Buffer {
  return makeChunk(
    'tEXt',
    Buffer.concat([Buffer.from(keyword, 'latin1'), Buffer.from([0]), Buffer.from(text, 'latin1')]),
  );
}

// iTXt: keyword + 0x00 + compressionFlag(0) + compressionMethod(0)
//       + languageTag + 0x00 + translatedKeyword + 0x00 + text(UTF-8)
function makeIntlTextChunk(keyword: string, text: string): Buffer {
  return makeChunk(
    'iTXt',
    Buffer.concat([
      Buffer.from(keyword, 'latin1'),
      Buffer.from([0, 0, 0]), // 区切り + 非圧縮(0) + 圧縮方式(0)
      Buffer.from([0]), // languageTag（空）の終端
      Buffer.from([0]), // translatedKeyword（空）の終端
      Buffer.from(text, 'utf8'),
    ]),
  );
}

interface Chunk {
  type: string;
  data: Buffer;
  start: number;
  end: number;
}

function readChunks(png: Buffer): Chunk[] {
  if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('PNG シグネチャが不正です');
  }
  const chunks: Chunk[] = [];
  let offset = 8;
  while (offset + 8 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('latin1', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const data = png.subarray(dataStart, dataStart + length);
    const end = dataStart + length + 4; // + CRC
    chunks.push({ type, data, start: offset, end });
    offset = end;
    if (type === 'IEND') break;
  }
  return chunks;
}

function parseKeyword(data: Buffer): { keyword: string; rest: Buffer } {
  const nul = data.indexOf(0);
  if (nul < 0) return { keyword: data.toString('latin1'), rest: Buffer.alloc(0) };
  return { keyword: data.toString('latin1', 0, nul), rest: data.subarray(nul + 1) };
}

/**
 * tEXt / iTXt チャンクを IHDR 直後（固定位置）に挿入した新しい PNG を返す。
 * entries は順序どおりに書き込む（決定性のため）。
 */
export function insertTextChunks(
  png: Buffer,
  entries: { keyword: string; text: string; intl?: boolean }[],
): Buffer {
  const chunks = readChunks(png);
  const ihdr = chunks.find((c) => c.type === 'IHDR');
  if (!ihdr) throw new Error('IHDR チャンクが見つかりません');
  const newChunks = entries.map((e) =>
    e.intl ? makeIntlTextChunk(e.keyword, e.text) : makeTextChunk(e.keyword, e.text),
  );
  return Buffer.concat([png.subarray(0, ihdr.end), ...newChunks, png.subarray(ihdr.end)]);
}

/** tEXt チャンクから keyword の値を読む（最初に一致したもの）。無ければ null。 */
export function readTextChunk(png: Buffer, keyword: string): string | null {
  for (const chunk of readChunks(png)) {
    if (chunk.type !== 'tEXt') continue;
    const { keyword: k, rest } = parseKeyword(chunk.data);
    if (k === keyword) return rest.toString('latin1');
  }
  return null;
}
