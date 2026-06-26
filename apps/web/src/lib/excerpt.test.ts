import { describe, expect, it } from 'vitest';
import { extractExcerpt } from './excerpt';

describe('extractExcerpt', () => {
  it('本文が無い場合は空文字を返す', () => {
    expect(extractExcerpt(undefined)).toBe('');
    expect(extractExcerpt('')).toBe('');
  });

  it('最初の段落を抽出する', () => {
    const body = '最初の段落です。\n\n二つ目の段落です。';
    expect(extractExcerpt(body)).toBe('最初の段落です。');
  });

  it('MDX の import/export 行を除去して最初の本文段落を抽出する', () => {
    const body =
      "import { Image } from 'astro:assets';\nimport figA from '../a.png';\n\n本文の冒頭です。";
    expect(extractExcerpt(body)).toBe('本文の冒頭です。');
  });

  it('リンクをテキストに変換する', () => {
    expect(extractExcerpt('詳しくは[こちらの記事](https://example.com)を参照。')).toBe(
      '詳しくはこちらの記事を参照。',
    );
  });

  it('コードブロックを除去する', () => {
    const body = '```html\n<ol><li>項目</li></ol>\n```\n\nコードの説明文です。';
    expect(extractExcerpt(body)).toBe('コードの説明文です。');
  });

  it('JSX/HTML タグと画像を除去する', () => {
    const body = '<Image src={figA} alt="図" />\n\n図についての説明。';
    expect(extractExcerpt(body)).toBe('図についての説明。');
  });

  it('見出しの行頭マーカーを除去する', () => {
    expect(extractExcerpt('## 見出し\n\n段落のテキスト。')).toBe('段落のテキスト。');
  });

  it('maxLength を超える場合は句点境界で切り詰める', () => {
    const body = `${'あ'.repeat(60)}。${'い'.repeat(60)}。`;
    const result = extractExcerpt(body);
    expect(result).toBe(`${'あ'.repeat(60)}。`);
    expect(result.endsWith('。')).toBe(true);
  });

  it('前半に句点が無い場合は maxLength で切り … を付ける', () => {
    const body = 'あ'.repeat(200);
    const result = extractExcerpt(body, 110);
    expect(result).toBe(`${'あ'.repeat(110)}…`);
  });
});
