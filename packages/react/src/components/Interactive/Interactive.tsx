import clsx from 'clsx';
import type { ComponentPropsWithRef, ElementType } from 'react';
import { capitalize } from '../../utils/capitalize';
import styles from './Interactive.module.css';

export type InteractiveColor = 'neutral' | 'primary' | 'informative' | 'negative';

export type InteractiveProps<T extends ElementType = 'div'> = {
  readonly as?: T;
  readonly color?: InteractiveColor;
} & Omit<ComponentPropsWithRef<T>, 'as' | 'color'>;

export const Interactive = <T extends ElementType = 'div'>({
  as,
  color,
  className,
  ...props
}: InteractiveProps<T>) => {
  const Component = (as ?? 'div') as ElementType;
  return (
    <Component
      className={clsx(styles.root, color && styles[`color${capitalize(color)}`], className)}
      {...(props as object)}
    />
  );
};

Interactive.displayName = 'Interactive';
