import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import type { TextStyle } from './getTextClassNames';
import { getTextClassNames } from './getTextClassNames';

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'style'>, TextStyle {
  readonly children: ReactNode;
  readonly as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * タイポグラフィに関するスタイルを、デザイントークンで定義した最適な組み合わせをもとに自動で指定します。
 */
export const Text = ({
  children,
  as: Component = 'span',
  fontSize = 'm',
  fontWeight = 'normal',
  fontFamily = 'sansSerif',
  lineHeight = 'normal',
  kerning = false,
  className,
  ...htmlProps
}: TextProps) => (
  <Component
    className={clsx(getTextClassNames({ fontSize, fontWeight, fontFamily, lineHeight, kerning }), className)}
    {...htmlProps}
  >
    {children}
  </Component>
);
