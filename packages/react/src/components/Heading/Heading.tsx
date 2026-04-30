import type { HTMLAttributes, ReactNode } from 'react';
import type { TextProps } from '../Text/Text';
import { Text } from '../Text/Text';
import type { HeadingLevel } from './getHeadingStyle';
import { getHeadingStyle } from './getHeadingStyle';

export interface HeadingProps extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
  readonly children: ReactNode;
  readonly id?: string;
  readonly as?: TextProps['as'];
  readonly level: HeadingLevel;
}

/**
 * 見出しのレベルにあわせて、タイポグラフィに関するスタイルを指定します。
 */
export const Heading = ({ children, as, level, ...htmlProps }: HeadingProps) => {
  const { as: defaultAs, ...style } = getHeadingStyle(level);
  return (
    <Text as={as ?? defaultAs} {...style} {...htmlProps}>
      {children}
    </Text>
  );
};
