import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

export function rehypeExternalLinks() {
  return (tree: Root): void => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'))) {
        node.properties.target = '_blank';
        const existingRel = Array.isArray(node.properties.rel)
          ? node.properties.rel
          : typeof node.properties.rel === 'string'
            ? [node.properties.rel]
            : [];
        const relSet = new Set([...existingRel, 'noopener', 'noreferrer']);
        node.properties.rel = Array.from(relSet);
      }
    });
  };
}
