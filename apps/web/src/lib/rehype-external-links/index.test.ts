import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { beforeAll, describe, expect, it } from 'vitest';
import { rehypeExternalLinks } from './index';

let render: (markdown: string) => Promise<string>;

beforeAll(async () => {
  const processor = await createMarkdownProcessor({
    gfm: true,
    smartypants: false,
    syntaxHighlight: false,
    rehypePlugins: [rehypeExternalLinks],
  });
  render = async (markdown) => (await processor.render(markdown)).code;
});

describe('外部リンク', () => {
  it('httpsで始まるURLにtarget="_blank"を付与する', async () => {
    expect(await render('[テキスト](https://example.com)')).toContain('target="_blank"');
  });

  it('httpsで始まるURLにrel="noopener noreferrer"を付与する', async () => {
    expect(await render('[テキスト](https://example.com)')).toContain('rel="noopener noreferrer"');
  });

  it('httpで始まるURLにも付与する', async () => {
    expect(await render('[テキスト](http://example.com)')).toContain('target="_blank"');
  });

  it('内部リンク（パス）には付与しない', async () => {
    const code = await render('[テキスト](/about)');
    expect(code).not.toContain('target="_blank"');
  });
});
