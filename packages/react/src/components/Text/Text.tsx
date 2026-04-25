import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import type { TextStyle } from './getTextClassNames';
import { getTextClassNames } from './getTextClassNames';

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'style'>, TextStyle {
  readonly children: ReactNode;
  readonly as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const Text = ({
  children,
  as: Component = 'span',
  fontSize,
  fontWeight,
  fontFamily,
  lineHeight,
  className,
  ...htmlProps
}: TextProps) => (
  <Component
    className={clsx(getTextClassNames({ fontSize, fontWeight, fontFamily, lineHeight }), className)}
    {...htmlProps}
  >
    {children}
  </Component>
);
