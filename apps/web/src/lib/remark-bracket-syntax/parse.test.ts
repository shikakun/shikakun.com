import { describe, expect, it } from 'vitest';
import { parseBracketExpression } from './parse';

describe('parseBracketExpression', () => {
  it('テキスト適用形をパースする', () => {
    const result = parseBracketExpression('[テキスト(strong)]', 0);
    expect(result).not.toBeNull();
    expect(result?.expression).toMatchObject({
      text: 'テキスト',
      method: 'strong',
      preset: null,
      subtype: null,
      args: [],
      namedArgs: {},
      isRangeStart: false,
    });
    expect(result?.endIndex).toBe('[テキスト(strong)]'.length);
  });

  it('自己完結型（テキストなし）をパースする', () => {
    const result = parseBracketExpression('[(divider)]', 0);
    expect(result?.expression).toMatchObject({
      text: null,
      method: 'divider',
    });
  });

  it('文字列の途中から始まる式をパースする', () => {
    const source = 'あいう[太字(strong)]えお';
    const result = parseBracketExpression(source, 3);
    expect(result?.expression.text).toBe('太字');
    expect(source.slice(result?.endIndex)).toBe('えお');
  });

  it('サブタイプと名前付き引数をパースする', () => {
    const result = parseBracketExpression('[(divider:dash,length=5px,gap=3px)]', 0);
    expect(result?.expression).toMatchObject({
      method: 'divider',
      subtype: 'dash',
      namedArgs: { length: '5px', gap: '3px' },
    });
  });

  it('ドット記法のプリセットをパースする', () => {
    const result = parseBracketExpression('[(key.command)]', 0);
    expect(result?.expression).toMatchObject({
      method: 'key',
      preset: 'command',
    });
  });

  it('引用符付きの名前付き引数から引用符を取り除く', () => {
    const result = parseBracketExpression('[(key.delete,title="Backspace")]', 0);
    expect(result?.expression.namedArgs).toEqual({ title: 'Backspace' });
  });

  it('カーリークォートも引用符として受理する', () => {
    const result = parseBracketExpression('[(key.delete,title=“Backspace”)]', 0);
    expect(result?.expression.namedArgs).toEqual({ title: 'Backspace' });
  });

  it('引用符の中のカンマでは引数を分割しない', () => {
    const result = parseBracketExpression('[(youtube,title="a, b",reversed)]', 0);
    expect(result?.expression.namedArgs).toEqual({ title: 'a, b' });
    expect(result?.expression.args).toEqual(['reversed']);
  });

  it('スペースを含む位置引数を保持する（モノルビの読み）', () => {
    const result = parseBracketExpression('[標準機能(ruby,ひょう じゅん き のう)]', 0);
    expect(result?.expression).toMatchObject({
      text: '標準機能',
      method: 'ruby',
      args: ['ひょう じゅん き のう'],
    });
  });

  it('引数の前後の空白をトリムする', () => {
    const result = parseBracketExpression('[テキスト(scale, 1.5)]', 0);
    expect(result?.expression.args).toEqual(['1.5']);
  });

  it('範囲オペレーターを認識する', () => {
    const result = parseBracketExpression('[(alignment:left)..]', 0);
    expect(result?.expression).toMatchObject({
      method: 'alignment',
      subtype: 'left',
      isRangeStart: true,
    });
  });

  it('フラグ引数を位置引数として保持する', () => {
    const result = parseBracketExpression('[(divider:slash,height=1em,gap=10px,reversed)]', 0);
    expect(result?.expression.args).toEqual(['reversed']);
    expect(result?.expression.namedArgs).toEqual({ height: '1em', gap: '10px' });
  });

  describe('構文に合致しない入力はnullを返す', () => {
    it.each([
      ['メソッド括弧がないただの角括弧', '[こんにちは]'],
      ['範囲終了マーカー単体', '[..]'],
      ['メソッド名が数字始まり', '[a(1bad)]'],
      ['メソッド名に大文字', '[a(Strong)]'],
      ['閉じパーレンの欠落', '[a(strong]'],
      ['閉じ角括弧の欠落', '[a(strong)'],
      ['ネスト（外側）', '[[ネスト(strong)] (weight, 200)]'],
      ['TEXT内の改行', '[あ\nい(strong)]'],
      ['パーレン内の改行', '[あ(ruby,\nよみ)]'],
      ['空の引数', '[あ(ruby,)]'],
      ['空のパーレン', '[あ()]'],
      ['Markdownのリンク記法の直前部分', '[テキスト](https://example.com)'],
    ])('%s', (_name, source) => {
      expect(parseBracketExpression(source, 0)).toBeNull();
    });
  });

  it('開始位置が[でなければnullを返す', () => {
    expect(parseBracketExpression('あ[太字(strong)]', 0)).toBeNull();
  });
});
