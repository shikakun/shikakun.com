import { Button } from '@shikakun/react';
import { LuChevronRight, LuExternalLink } from 'react-icons/lu';

type Props = {
  readonly href: string;
  readonly children: string;
};

export const ArticleButton = ({ href, children }: Props) => {
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  return (
    <Button
      href={href}
      target={isExternal ? '_blank' : undefined}
      appearance="outlined"
      trailingIcon={isExternal ? <LuExternalLink size={18} /> : <LuChevronRight size={18} />}
    >
      {children}
    </Button>
  );
};
