import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import { beforeAll, describe, expect, it } from 'vitest';
import { remarkBracketSyntax } from './index';

// 本番（astro.config.ts）と同じ構成のパイプラインで検証する
let render: (markdown: string) => Promise<string>;

beforeAll(async () => {
  const processor = await createMarkdownProcessor({
    gfm: true,
    smartypants: false,
    syntaxHighlight: false,
    remarkPlugins: [remarkBracketSyntax, remarkBreaks],
  });
  render = async (markdown) => (await processor.render(markdown)).code;
});

describe('テキストスタイル', () => {
  it('strongを変換する', async () => {
    expect(await render('これは[重要(strong)]です')).toContain('これは<strong>重要</strong>です');
  });

  it('strokeを変換する', async () => {
    expect(await render('[誤り(stroke)]')).toContain('<s>誤り</s>');
  });

  it('strokeの太さ指定を変換する', async () => {
    expect(await render('[誤り(stroke,4)]')).toContain(
      '<s style="text-decoration-thickness: 4px">誤り</s>',
    );
  });

  it('doublestrokeを変換する', async () => {
    expect(await render('[誤り(doublestroke,2)]')).toContain(
      '<s style="text-decoration-style: double; text-decoration-thickness: 2px">誤り</s>',
    );
  });

  it('weightを変換する', async () => {
    expect(await render('[細い(weight,200)]')).toContain(
      '<span style="font-weight: 200">細い</span>',
    );
  });

  it('obliqueを変換する', async () => {
    expect(await render('[斜め(oblique)]')).toContain(
      '<span style="font-style: oblique">斜め</span>',
    );
  });

  it('obliqueの角度指定を変換する', async () => {
    expect(await render('[斜め(oblique,30)]')).toContain(
      '<span style="font-style: oblique 30deg">斜め</span>',
    );
  });

  it('scaleを変換する', async () => {
    expect(await render('[大きい(scale, 1.5)]')).toContain(
      '<span style="font-size: 1.5em">大きい</span>',
    );
  });

  it('monoを変換する', async () => {
    expect(await render('[code(mono)]')).toContain('<span class="bracket-mono">code</span>');
  });

  it('monoのウェイト指定を変換する', async () => {
    expect(await render('[code(mono,800)]')).toContain(
      '<span class="bracket-mono" style="font-weight: 800">code</span>',
    );
  });

  it('emphasizeを変換する', async () => {
    expect(await render('[けんてん(emphasize,3)]')).toContain(
      '<span style="text-emphasis: filled sesame">けんてん</span>',
    );
  });

  it('不正な引数は変換しない', async () => {
    expect(await render('[太さ(weight,abc)]')).toContain('[太さ(weight,abc)]');
  });
});

describe('ruby', () => {
  it('グループルビを変換する', async () => {
    expect(await render('[超電磁砲(ruby,レールガン)]')).toContain(
      '<ruby>超電磁砲<rt>レールガン</rt></ruby>',
    );
  });

  it('スペース区切りの読みをモノルビに変換する', async () => {
    expect(await render('[標準機能(ruby,ひょう じゅん き のう)]')).toContain(
      '<ruby>標<rt>ひょう</rt>準<rt>じゅん</rt>機<rt>き</rt>能<rt>のう</rt></ruby>',
    );
  });

  it('読みの数と文字数が一致しない場合はグループルビにする', async () => {
    expect(await render('[標準(ruby,ひょう じゅん き)]')).toContain(
      '<ruby>標準<rt>ひょうじゅんき</rt></ruby>',
    );
  });
});

describe('key', () => {
  it('テキスト適用形を変換する', async () => {
    expect(await render('[Command(key)]')).toContain('<kbd>Command</kbd>');
  });

  it('プリセットを記号とaria-labelに変換する', async () => {
    expect(await render('[(key.command)]')).toContain('<kbd aria-label="Command">⌘</kbd>');
  });

  it('title引数でaria-labelを上書きする', async () => {
    expect(await render('[(key.delete,title="Backspace")]')).toContain(
      '<kbd aria-label="Backspace">⌫</kbd>',
    );
  });

  it('カーリークォートのtitle引数も解釈する', async () => {
    expect(await render('[(key.delete,title=“Backspace”)]')).toContain(
      '<kbd aria-label="Backspace">⌫</kbd>',
    );
  });

  it('未知のプリセットは変換しない', async () => {
    expect(await render('[(key.unknown)]')).toContain('[(key.unknown)]');
  });
});

describe('spacer', () => {
  it('長さ指定の余白を変換する', async () => {
    expect(await render('あ[(spacer,2em)]い')).toContain(
      'あ<span class="bracket-spacer" style="inline-size: 2em"></span>い',
    );
  });

  it('引数省略時は1emにする', async () => {
    expect(await render('[(spacer)]')).toContain('style="inline-size: 1em"');
  });
});

describe('divider', () => {
  it('単独の段落をhrに変換する', async () => {
    const code = await render('前の段落\n\n[(divider)]\n\n次の段落');
    expect(code).toContain('<hr class="bracket-divider bracket-divider--solid">');
    expect(code).not.toContain('<p><hr');
  });

  it('サブタイプと引数をクラスとカスタムプロパティに変換する', async () => {
    expect(await render('[(divider:dash,length=5px,gap=3px)]')).toContain(
      '<hr class="bracket-divider bracket-divider--dash" style="--divider-length: 5px; --divider-gap: 3px">',
    );
  });

  it('reversedフラグをクラスに変換する', async () => {
    expect(await render('[(divider:slash,height=1em,gap=10px,reversed)]')).toContain(
      'bracket-divider--slash bracket-divider--reversed',
    );
  });

  it('段落の途中では変換しない', async () => {
    expect(await render('あ[(divider)]い')).toContain('あ[(divider)]い');
  });
});

describe('youtube', () => {
  it('watch形式のURLをiframe埋め込みに変換する', async () => {
    const code = await render('[(youtube, https://www.youtube.com/watch?v=dQw4w9WgXcQ)]');
    expect(code).toContain('<div class="bracket-youtube">');
    expect(code).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"');
    expect(code).toContain('title="YouTube動画"');
    expect(code).toContain('loading="lazy"');
    expect(code).toContain('allowfullscreen');
    expect(code).not.toContain('<p>');
  });

  it('短縮URLとtitle引数を変換する', async () => {
    const code = await render('[(youtube, https://youtu.be/dQw4w9WgXcQ, title="動画のタイトル")]');
    expect(code).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"');
    expect(code).toContain('title="動画のタイトル"');
  });

  it('再生開始位置を引き継ぐ', async () => {
    expect(await render('[(youtube, https://youtu.be/dQw4w9WgXcQ?t=90)]')).toContain(
      'src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90"',
    );
  });

  it('YouTube以外のURLは変換しない', async () => {
    const code = await render('[(youtube, https://example.com/watch?v=dQw4w9WgXcQ)]');
    expect(code).not.toContain('<iframe');
  });

  it('段落の途中では変換しない', async () => {
    const code = await render('動画[(youtube, https://youtu.be/dQw4w9WgXcQ)]です');
    expect(code).not.toContain('<iframe');
  });
});

describe('Markdown標準記法との衝突回避', () => {
  it('リンク記法を変換しない', async () => {
    expect(await render('[テキスト](https://example.com)')).toContain(
      '<a href="https://example.com">テキスト</a>',
    );
  });

  it('メソッド括弧のないただの角括弧を変換しない', async () => {
    expect(await render('[ただの角括弧]')).toContain('[ただの角括弧]');
  });

  it('GFMの脚注と干渉しない', async () => {
    const code = await render('本文[^1]\n\n[^1]: 脚注の内容');
    expect(code).toContain('footnote');
  });

  it('インラインコードの中を変換しない', async () => {
    expect(await render('`[(divider)]`')).toContain('<code>[(divider)]</code>');
  });

  it('コードブロックの中を変換しない', async () => {
    expect(await render('```\n[(divider)]\n```')).toContain('[(divider)]');
  });
});

describe('エスケープと異常系', () => {
  it('バックスラッシュでエスケープした角括弧をリテラル表示する', async () => {
    expect(await render('\\\\[(divider)\\\\]')).toContain('[(divider)]');
  });

  it('未知のメソッドは変換しない', async () => {
    expect(await render('[あ(unknown)]')).toContain('[あ(unknown)]');
  });

  it('範囲オペレーターは変換しない', async () => {
    expect(await render('[(alignment:left)..]')).toContain('[(alignment:left)..]');
  });
});

describe('複合', () => {
  it('1つの段落の複数の式を変換する', async () => {
    const code = await render('[太(strong)]と[斜(oblique)]');
    expect(code).toContain('<strong>太</strong>');
    expect(code).toContain('<span style="font-style: oblique">斜</span>');
  });

  it('remark-breaksの改行と共存する', async () => {
    const code = await render('一行目\n[太字(strong)]二行目');
    expect(code).toContain('<br>');
    expect(code).toContain('<strong>太字</strong>');
  });
});
