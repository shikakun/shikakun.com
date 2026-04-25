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
  | 'default';

export type FontWeight = 'normal' | 'bold' | 'default';

export type FontFamily = 'sansSerif' | 'monospace' | 'default';

export type LineHeightDensity = 'dense' | 'normal' | 'comfort';

export type TextStyle = {
  /**
   * フォントサイズ。`default` は `m`（16px）と同じです。
   */
  readonly fontSize?: FontSize;
  /**
   * フォントウェイト。`default` は `normal` と同じです。
   */
  readonly fontWeight?: FontWeight;
  /**
   * フォントファミリー。`default` は `sansSerif` と同じです。
   */
  readonly fontFamily?: FontFamily;
  /**
   * 行の高さの密度。`fontSize` に連動して対応するサイズの行の高さが選ばれます。
   * `default` は `normal` と同じです。`inherit` は親要素の値を引き継ぎます。
   */
  readonly lineHeight?: LineHeightDensity | 'inherit' | 'default';
};

const cls = (key: string) => styles[key as keyof typeof styles] ?? '';

const lineHeightClass = (lineHeight: string) => {
  if (lineHeight === 'inherit') return styles.lineHeightInherit ?? '';
  const [size, density] = lineHeight.split('-');
  return cls(`lineHeight${capitalize(size!)}${capitalize(density!)}`);
};

export const resolveStyle = (style: TextStyle) => {
  const fontSize = style.fontSize ?? 'default';
  const actualSize = fontSize === 'default' ? 'm' : fontSize;
  const lineHeight =
    style.lineHeight === 'inherit'
      ? 'inherit'
      : `${actualSize}-${style.lineHeight === undefined || style.lineHeight === 'default' ? 'normal' : style.lineHeight}`;
  return {
    fontSize,
    fontWeight: style.fontWeight ?? 'default',
    fontFamily: style.fontFamily ?? 'default',
    lineHeight,
  };
};

export const getTextClassNames = (style: TextStyle): string[] => {
  const { fontSize, fontWeight, fontFamily, lineHeight } = resolveStyle(style);
  return [
    styles.text,
    cls(`fontSize${capitalize(fontSize)}`),
    cls(`fontWeight${capitalize(fontWeight)}`),
    cls(`fontFamily${capitalize(fontFamily)}`),
    lineHeightClass(lineHeight),
  ].filter(Boolean) as string[];
};
