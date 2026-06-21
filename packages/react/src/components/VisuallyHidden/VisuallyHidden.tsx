import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import styles from './VisuallyHidden.module.css';

export type VisuallyHiddenProps<T extends ElementType = 'span'> = {
  readonly as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export const VisuallyHidden = <T extends ElementType = 'span'>({
  as,
  className,
  ...htmlProps
}: VisuallyHiddenProps<T>) => {
  const Component = (as ?? 'span') as ElementType;
  return <Component className={clsx(styles.visuallyHidden, className)} {...htmlProps} />;
};
