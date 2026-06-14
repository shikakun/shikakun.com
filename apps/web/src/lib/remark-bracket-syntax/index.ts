import type { PhrasingContent, Root } from 'mdast';
import { toString as mdastToString } from 'mdast-util-to-string';
import { SKIP, visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { blockMethods, inlineMethods } from './methods/index';
import { parseBracketExpression } from './parse';
import type { BracketExpression, BracketSyntaxNode } from './types';

/**
 * このウェブサイト独自の角括弧構文をHTMLへ変換するremarkプラグイン。
 * 仕様はsrc/content/pages/markdown.mdx（公開ページ）を参照。
 * パースできない式や不正な引数は変換せずソースのまま出力し、file.message()で警告する。
 */
export function remarkBracketSyntax() {
  return (tree: Root, file: VFile): void => {
    transformBlockExpressions(tree, file);
    transformInlineExpressions(tree, file);
  };
}

/**
 * 段落全体が1つの自己完結型の式である場合に、段落ごとブロック要素へ置き換える。
 * remark-gfmのオートリンクで式の中のURLがlinkノードへ分割されていても認識できるよう、
 * textノードではなく段落全体の文字列で判定する。
 */
function transformBlockExpressions(tree: Root, file: VFile): void {
  visit(tree, 'paragraph', (node, index, parent) => {
    if (!parent || index === undefined) {
      return;
    }
    // toStringはインラインコードや強調の中身も平坦化してしまうため、
    // text（とオートリンク由来のlink）だけで構成される段落のみを対象にする
    if (!node.children.every((child) => child.type === 'text' || child.type === 'link')) {
      return;
    }
    const source = mdastToString(node).trim();
    if (!source.startsWith('[(')) {
      return;
    }
    const parsed = parseBracketExpression(source, 0);
    if (!parsed || parsed.endIndex !== source.length) {
      return;
    }
    const { expression } = parsed;
    if (expression.isRangeStart) {
      // 範囲オペレーターはフェーズ2で対応する。警告はインラインパスに任せる
      return;
    }
    const handler = blockMethods[expression.method];
    if (!handler) {
      // インラインメソッドや未知のメソッドはインラインパスに任せる
      return;
    }
    const replacement = handler(expression, file);
    if (!replacement) {
      return;
    }
    parent.children[index] = replacement;
    return SKIP;
  });
}

/** textノードの中の角括弧式を変換する */
function transformInlineExpressions(tree: Root, file: VFile): void {
  visit(tree, 'text', (node, index, parent) => {
    if (!parent || index === undefined) {
      return;
    }
    const replacement = transformTextValue(node.value, file);
    if (!replacement) {
      return;
    }
    // textノードの親はフレージングコンテンツを子に持つ
    const siblings = parent.children as PhrasingContent[];
    siblings.splice(index, 1, ...replacement);
    return index + replacement.length;
  });
}

/**
 * テキストを走査し、角括弧式を生成ノードへ、エスケープ（`\[`・`\]`）をリテラルへ置き換える。
 * 変換すべきものがなければnullを返す。
 */
function transformTextValue(value: string, file: VFile): PhrasingContent[] | null {
  const nodes: PhrasingContent[] = [];
  let buffer = '';
  let changed = false;
  let i = 0;
  while (i < value.length) {
    const char = value[i];
    // ソースの`\\[`はMarkdownのエスケープ処理を経て`\[`としてここへ届く
    if (char === '\\' && (value[i + 1] === '[' || value[i + 1] === ']')) {
      buffer += value[i + 1];
      changed = true;
      i += 2;
      continue;
    }
    if (char === '[') {
      const parsed = parseBracketExpression(value, i);
      if (parsed) {
        const node = handleInlineExpression(parsed.expression, file);
        if (node) {
          if (buffer !== '') {
            nodes.push({ type: 'text', value: buffer });
            buffer = '';
          }
          nodes.push(node);
          changed = true;
          i = parsed.endIndex;
          continue;
        }
      }
    }
    buffer += char;
    i++;
  }
  if (!changed) {
    return null;
  }
  if (buffer !== '') {
    nodes.push({ type: 'text', value: buffer });
  }
  return nodes;
}

function handleInlineExpression(
  expression: BracketExpression,
  file: VFile,
): BracketSyntaxNode | null {
  if (expression.isRangeStart) {
    file.message(
      `bracket-syntax: 範囲オペレーターは未対応のため無視しました: ${expression.method}`,
    );
    return null;
  }
  const handler = inlineMethods[expression.method];
  if (handler) {
    return handler(expression, file);
  }
  if (blockMethods[expression.method]) {
    file.message(`bracket-syntax: ${expression.method}は単独の段落でのみ使えるため無視しました`);
  } else {
    file.message(`bracket-syntax: 未知のメソッドのため無視しました: ${expression.method}`);
  }
  return null;
}
