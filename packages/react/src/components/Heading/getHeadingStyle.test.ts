import { describe, expect, it } from 'vitest';
import { getHeadingStyle } from './getHeadingStyle';

describe('getHeadingStyle', () => {
  it('level=1 のとき h1 / 2xl / normal / dense / kerning になる', () => {
    expect(getHeadingStyle(1)).toEqual({
      as: 'h1',
      fontSize: '2xl',
      fontWeight: 'normal',
      lineHeight: 'dense',
      kerning: true,
    });
  });

  it('level=2 のとき h2 / l / bold / dense / kerning になる', () => {
    expect(getHeadingStyle(2)).toEqual({
      as: 'h2',
      fontSize: 'l',
      fontWeight: 'bold',
      lineHeight: 'dense',
      kerning: true,
    });
  });

  it('level=3 のとき h3 / m / bold / dense / kerning になる', () => {
    expect(getHeadingStyle(3)).toEqual({
      as: 'h3',
      fontSize: 'm',
      fontWeight: 'bold',
      lineHeight: 'dense',
      kerning: true,
    });
  });

  it('無効な level のとき Error を投げる', () => {
    expect(() => getHeadingStyle(0 as unknown as 1)).toThrow('getHeadingStyle: invalid level: 0');
  });
});
