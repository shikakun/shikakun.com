import type { FontSize, FontWeight } from '../Text/getTextClassNames';
import type { TextProps } from '../Text/Text';

export type HeadingLevel = 1 | 2 | 3;

type HeadingStyle = {
  readonly as: Extract<NonNullable<TextProps['as']>, 'h1' | 'h2' | 'h3'>;
  readonly fontSize: Extract<FontSize, '2xl' | 'l' | 'm'>;
  readonly fontWeight: Extract<FontWeight, 'normal' | 'bold'>;
  readonly lineHeight: 'dense';
  readonly kerning: true;
};

export const getHeadingStyle = (level: HeadingLevel): HeadingStyle => {
  switch (level) {
    case 1:
      return { as: 'h1', fontSize: '2xl', fontWeight: 'normal', lineHeight: 'dense', kerning: true };
    case 2:
      return { as: 'h2', fontSize: 'l', fontWeight: 'bold', lineHeight: 'dense', kerning: true };
    case 3:
      return { as: 'h3', fontSize: 'm', fontWeight: 'bold', lineHeight: 'dense', kerning: true };
  }
};
