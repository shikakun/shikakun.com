import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Text({ children }: Props) {
  return <p>{children}</p>;
}
