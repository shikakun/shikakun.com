import { capitalize } from '../../utils/capitalize';
import styles from './Text.module.css';

export type FontSize =
  | '2xs'
  | 'xs'
  | 's'
  | 'm'
  | 'l'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | 'inherit';

export type FontWeight = 'normal' | 'bold' | 'inherit';

export type FontFamily = 'sansSerif' | 'monospace' | 'inherit';

export type LineHeightDensity = 'dense' | 'normal' | 'comfort';

export type TextStyle = {
  /**
   * フォントのサイズ
   */
  readonly fontSize?: FontSize;
  /**
   * フォントのウェイト
   */
  readonly fontWeight?: FontWeight;
  /**
   * フォントの種類
   */
  readonly fontFamily?: FontFamily;
  /**
   * 行間のサイズ
   */
  readonly lineHeight?: LineHeightDensity | 'inherit';
  /**
   * プロポーショナルメトリクスとカーニングを有効にする
   */
  readonly kerning?: boolean;
};

const cls = (key: string) => styles[key as keyof typeof styles] ?? '';

const lineHeightClass = (lineHeight: string) => {
  if (lineHeight === 'inherit') return styles.lineHeightInherit ?? '';
  const [size = '', density = ''] = lineHeight.split('-');
  return cls(`lineHeight${capitalize(size)}${capitalize(density)}`);
};

export const resolveStyle = (style: TextStyle) => {
  const fontSize = style.fontSize ?? 'm';
  const lineHeight =
    fontSize === 'inherit' || style.lineHeight === 'inherit'
      ? 'inherit'
      : `${fontSize}-${style.lineHeight ?? 'normal'}`;
  return {
    fontSize,
    fontWeight: style.fontWeight ?? 'normal',
    fontFamily: style.fontFamily ?? 'sansSerif',
    lineHeight,
    kerning: style.kerning ?? false,
  };
};

export const getTextClassNames = (style: TextStyle): string[] => {
  const { fontSize, fontWeight, fontFamily, lineHeight, kerning } = resolveStyle(style);
  return [
    styles.text,
    cls(`fontSize${capitalize(fontSize)}`),
    cls(`fontWeight${capitalize(fontWeight)}`),
    cls(`fontFamily${capitalize(fontFamily)}`),
    lineHeightClass(lineHeight),
    kerning ? styles.kerning : '',
  ].filter(Boolean) as string[];
};
