import clsx from 'clsx';
import type { ElementType, HTMLAttributes } from 'react';
import styles from './VisuallyHidden.module.css';

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  readonly as?: ElementType;
}

export const VisuallyHidden = ({
  as: Component = 'span',
  className,
  ...htmlProps
}: VisuallyHiddenProps) => (
  <Component className={clsx(styles.visuallyHidden, className)} {...htmlProps} />
);
