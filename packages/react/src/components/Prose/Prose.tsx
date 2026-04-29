import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Prose.module.css';

export interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export const Prose = ({ children, className, ...htmlProps }: ProseProps) => (
  <div className={clsx(styles.prose, className)} {...htmlProps}>
    {children}
  </div>
);
