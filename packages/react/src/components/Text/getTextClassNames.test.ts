import { describe, expect, it } from 'vitest';
import { resolveStyle } from './getTextClassNames';

describe('resolveStyle', () => {
  describe('fontSizeとlineHeightの組み合わせ', () => {
    it('fontSizeとlineHeightを指定しない場合は `m-normal` になる', () => {
      expect(resolveStyle({}).lineHeight).toBe('m-normal');
    });

    it('fontSizeを指定せずlineHeightに `normal` を指定した場合は `m-normal` になる', () => {
      expect(resolveStyle({ lineHeight: 'normal' }).lineHeight).toBe('m-normal');
    });

    it('fontSizeに `xl` を指定してlineHeightを指定しない場合は `xl-normal` になる', () => {
      expect(resolveStyle({ fontSize: 'xl' }).lineHeight).toBe('xl-normal');
    });

    it('fontSizeに `xl` を指定してlineHeightに `normal` を指定した場合は `xl-normal` になる', () => {
      expect(resolveStyle({ fontSize: 'xl', lineHeight: 'normal' }).lineHeight).toBe('xl-normal');
    });

    it('fontSizeを指定せずlineHeightに `inherit` を指定した場合は `inherit` になる', () => {
      expect(resolveStyle({ lineHeight: 'inherit' }).lineHeight).toBe('inherit');
    });

    it('fontSizeに `xl` を指定してlineHeightに `inherit` を指定した場合は `inherit` になる', () => {
      expect(resolveStyle({ fontSize: 'xl', lineHeight: 'inherit' }).lineHeight).toBe('inherit');
    });
  });

  describe('resolvedStyleの生成', () => {
    it('すべてのスタイルプロパティにデフォルト値が設定される', () => {
      expect(resolveStyle({})).toEqual({
        fontSize: 'default',
        fontWeight: 'default',
        fontFamily: 'default',
        lineHeight: 'm-normal',
      });
    });

    it('指定されたスタイルプロパティが正しく反映される', () => {
      expect(
        resolveStyle({
          fontSize: 'xl',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          lineHeight: 'dense',
        }),
      ).toEqual({
        fontSize: 'xl',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        lineHeight: 'xl-dense',
      });
    });
  });
});
