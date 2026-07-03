import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * 脚注参照のマークアップを <sup><a>1</a></sup> から <span data-footnote-ref-wrapper>（<a>*1</a>）</span> へ差し替えるrehypeプラグイン
 */
export function rehypeFootnoteReference() {
  return (tree: Root): void => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index === undefined || node.tagName !== 'sup') return;
      const anchor = node.children.find(
        (child) =>
          child.type === 'element' &&
          child.tagName === 'a' &&
          child.properties != null &&
          'dataFootnoteRef' in child.properties,
      );
      if (!anchor || anchor.type !== 'element') return;
      const first = anchor.children[0];
      const number = first?.type === 'text' ? first.value : '';
      anchor.children = [{ type: 'text', value: `*${number}` }];
      // 全角括弧つきの参照を span でまとめる（<span data-footnote-ref-wrapper>（<a>＊1</a>）</span>）。
      const wrapper: Element = {
        type: 'element',
        tagName: 'span',
        // 値なしの data-footnote-ref-wrapper として出力するため空文字にする（true だと ="true" になる）
        properties: { dataFootnoteRefWrapper: '' },
        children: [{ type: 'text', value: '（' }, anchor, { type: 'text', value: '）' }],
      };
      parent.children[index] = wrapper;
    });
  };
}
