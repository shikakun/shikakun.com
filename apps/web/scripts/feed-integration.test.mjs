import { describe, expect, it } from 'vitest';
import { sanitize } from './feed-integration.mjs';

describe('sanitize', () => {
  it('aria-hidden="true"の要素を中身ごと取り除き、読み上げ用のテキストを残す', () => {
    expect(
      sanitize(
        '<p><kbd><span aria-hidden="true">⌘</span><span class="bracket-kbd-label">Command</span></kbd></p>',
      ),
    ).toBe('<p><kbd>Command</kbd></p>');
  });

  it('aria-hidden="true"でない要素は残す', () => {
    expect(sanitize('<p><span aria-hidden="false">テキスト</span></p>')).toBe('<p>テキスト</p>');
  });

  it('spanを取り除いて中身のテキストを残す', () => {
    expect(sanitize('<pre><code><span class="token">const</span> a</code></pre>')).toBe(
      '<pre><code>const a</code></pre>',
    );
  });

  it('scriptを取り除く', () => {
    expect(sanitize('<p>本文</p><script>alert(1)</script>')).toBe('<p>本文</p>');
  });
});
