import type { ElementContent, Properties } from 'hast';
import type { VFile } from 'vfile';
import type { BracketExpression, BracketSyntaxNode } from '../types';

/** CSSの長さとして受け付ける書式 */
export const CSS_LENGTH_PATTERN = /^\d+(\.\d+)?(em|rem|px)$/;

/** 正の数値（小数可） */
export const POSITIVE_NUMBER_PATTERN = /^(?!0+(\.0+)?$)\d+(\.\d+)?$/;

export function element(
  hName: string,
  hProperties: Properties,
  hChildren: ElementContent[],
): BracketSyntaxNode {
  return { type: 'bracketSyntax', data: { hName, hProperties, hChildren } };
}

export function textElement(
  hName: string,
  hProperties: Properties,
  text: string,
): BracketSyntaxNode {
  return element(hName, hProperties, [{ type: 'text', value: text }]);
}

/** TEXT部が必須のメソッドの共通ガード。TEXT部がなければ警告してnullを返す */
export function requireText(expression: BracketExpression, file: VFile): string | null {
  if (expression.text === null) {
    file.message(
      `bracket-syntax: ${expression.method}は[テキスト(${expression.method})]の形で使うため無視しました`,
    );
    return null;
  }
  return expression.text;
}

/** 自己完結型メソッドの共通ガード。TEXT部があれば警告してfalseを返す */
export function rejectText(expression: BracketExpression, file: VFile): boolean {
  if (expression.text !== null) {
    file.message(
      `bracket-syntax: ${expression.method}は[(${expression.method})]の形で使うため無視しました`,
    );
    return false;
  }
  return true;
}

export function warnInvalidArgument(
  expression: BracketExpression,
  file: VFile,
  value: string,
): void {
  file.message(`bracket-syntax: ${expression.method}の引数が不正なため無視しました: ${value}`);
}
