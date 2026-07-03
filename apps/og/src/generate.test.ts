import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ogImagePath, resolveContentDir } from './content';
import { generate, hasDiff } from './generate';
import { addMarker, hasMarker } from './marker';

// ログを捨てる。
const silent = { log: () => {}, warn: () => {} };

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-test-'));
  fs.mkdirSync(path.join(dir, 'pages'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function writePage(slug: string, frontmatter: string): void {
  fs.writeFileSync(path.join(dir, 'pages', `${slug}.mdx`), `---\n${frontmatter}\n---\n\n本文\n`);
}

function writeOgImage(slug: string, png: Buffer): void {
  const file = ogImagePath(dir, slug);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
}

// フォントに依存しない、生成 marker を持たない手動画像相当の PNG。
function manualPng(): Buffer {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#abc"/></svg>';
  return Buffer.from(new Resvg(svg).render().asPng());
}

describe('generate', () => {
  it('手動画像を持たない記事に 1280×670 の生成 marker 付き PNG を作る', async () => {
    writePage('hello', 'title: こんにちは');
    const result = await generate({ contentDir: dir }, silent);

    expect(result.created).toEqual(['hello']);
    const png = fs.readFileSync(ogImagePath(dir, 'hello'));
    expect(hasMarker(png)).toBe(true);
    expect(png.readUInt32BE(16)).toBe(1280);
    expect(png.readUInt32BE(20)).toBe(670);
  });

  it('手動画像（marker 無し）は一切変更しない', async () => {
    writePage('manual', 'title: 手動');
    const original = manualPng();
    writeOgImage('manual', original);

    const result = await generate({ contentDir: dir }, silent);

    expect(result.skippedManual).toEqual(['manual']);
    expect(fs.readFileSync(ogImagePath(dir, 'manual')).equals(original)).toBe(true);
  });

  it('2 回連続実行すると 2 回目は変更が出ない（決定的）', async () => {
    writePage('a', 'title: あ');
    writePage('b', 'title: い');

    const first = await generate({ contentDir: dir }, silent);
    expect(first.created.sort()).toEqual(['a', 'b']);

    const second = await generate({ contentDir: dir }, silent);
    expect(second.created).toEqual([]);
    expect(second.updated).toEqual([]);
    expect(second.unchanged.sort()).toEqual(['a', 'b']);
    expect(hasDiff(second)).toBe(false);
  });

  it('対応ページの無い生成画像（孤児）を prune する', async () => {
    writePage('live', 'title: 生きている記事');
    const orphan = addMarker(manualPng(), 'むかしの記事');
    writeOgImage('gone', orphan); // gone.mdx は存在しない

    const result = await generate({ contentDir: dir }, silent);

    expect(result.pruned).toEqual(['gone']);
    expect(fs.existsSync(ogImagePath(dir, 'gone'))).toBe(false);
    // og.png だけのディレクトリは空になるので片付ける。
    expect(fs.existsSync(path.join(dir, 'assets', 'gone'))).toBe(false);
  });

  it('marker の無い孤児（手動画像）は prune しない', async () => {
    writePage('live', 'title: 生きている記事');
    writeOgImage('keep', manualPng()); // keep.mdx は無いが手動画像なので不可侵

    const result = await generate({ contentDir: dir }, silent);

    expect(result.pruned).toEqual([]);
    expect(fs.existsSync(ogImagePath(dir, 'keep'))).toBe(true);
  });

  it('title が無いページはスキップし、生成も prune もしない', async () => {
    writePage('notitle', 'description: タイトル無し');
    const result = await generate({ contentDir: dir }, silent);

    expect(result.skippedNoTitle).toEqual(['notitle']);
    expect(fs.existsSync(ogImagePath(dir, 'notitle'))).toBe(false);
  });

  it('--slug 指定時は当該記事のみを対象にし、prune しない', async () => {
    writePage('target', 'title: 対象');
    const orphan = addMarker(manualPng(), '孤児');
    writeOgImage('gone', orphan);

    const result = await generate({ contentDir: dir, slug: 'target' }, silent);

    expect(result.created).toEqual(['target']);
    expect(result.pruned).toEqual([]);
    // prune を行わないので孤児は残る。
    expect(fs.existsSync(ogImagePath(dir, 'gone'))).toBe(true);
  });

  it('--check は書き込まず差分を報告する', async () => {
    writePage('c', 'title: 検査');

    const result = await generate({ contentDir: dir, check: true }, silent);

    expect(result.created).toEqual(['c']);
    expect(hasDiff(result)).toBe(true);
    // check では書き込まない。
    expect(fs.existsSync(ogImagePath(dir, 'c'))).toBe(false);
  });
});

describe('resolveContentDir', () => {
  it('CONTENT_SOURCE_DIR が存在しなければエラーで終了する', () => {
    expect(() =>
      resolveContentDir({ CONTENT_SOURCE_DIR: path.join(dir, 'does-not-exist') }),
    ).toThrow(/CONTENT_SOURCE_DIR/);
  });

  it('CONTENT_SOURCE_DIR が存在すればそのパスを返す', () => {
    expect(resolveContentDir({ CONTENT_SOURCE_DIR: dir })).toBe(path.resolve(dir));
  });
});
