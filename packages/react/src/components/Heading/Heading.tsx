import { loadDefaultJapaneseParser } from 'budoux';
import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import type { TextProps } from '../Text/Text';
import { Text } from '../Text/Text';
import type { HeadingLevel } from './getHeadingStyle';
import { getHeadingStyle } from './getHeadingStyle';
import styles from './Heading.module.css';

const parser = loadDefaultJapaneseParser();

export interface HeadingProps extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
  readonly children: ReactNode;
  readonly id?: string;
  readonly as?: TextProps['as'];
  readonly level: HeadingLevel;
}

/**
 * 見出しのレベルにあわせて、タイポグラフィに関するスタイルを指定します。
 */
export const Heading = ({ children, as, level, className, ...htmlProps }: HeadingProps) => {
  const { as: defaultAs, ...style } = getHeadingStyle(level);

  const content =
    typeof children === 'string'
      ? parser
          .parse(children)
          .flatMap((seg, i) => (i === 0 ? [seg] : [<wbr key={`wbr-${seg}`} />, seg]))
      : children;

  return (
    <Text
      as={as ?? defaultAs}
      {...style}
      className={clsx(styles.heading, className)}
      {...htmlProps}
    >
      {content}
    </Text>
  );
};
