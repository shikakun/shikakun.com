import type { MethodHandler } from '../types';
import { CSS_LENGTH_PATTERN, element, rejectText, warnInvalidArgument } from './helpers';

const SUBTYPES = ['solid', 'doublesolid', 'dash', 'slash'];

/** 名前付き引数とCSSカスタムプロパティの対応。見た目はbracket-syntax.cssで実装する */
const LENGTH_ARGUMENTS = ['gap', 'length', 'height'];

/**
 * `[(divider)]`・`[(divider:dash,length=5px,gap=3px)]`など → `<hr>`
 * 単独の段落としてのみ使える（ブロックメソッド）。
 */
export const divider: MethodHandler = (expression, file) => {
  if (!rejectText(expression, file)) {
    return null;
  }
  const subtype = expression.subtype ?? 'solid';
  if (!SUBTYPES.includes(subtype)) {
    file.message(`bracket-syntax: dividerの未知のサブタイプのため無視しました: ${subtype}`);
    return null;
  }
  const classNames = ['bracket-divider', `bracket-divider--${subtype}`];
  if (expression.args.includes('reversed')) {
    classNames.push('bracket-divider--reversed');
  }
  const styles: string[] = [];
  for (const [name, value] of Object.entries(expression.namedArgs)) {
    if (!LENGTH_ARGUMENTS.includes(name)) {
      warnInvalidArgument(expression, file, `${name}=${value}`);
      return null;
    }
    if (!CSS_LENGTH_PATTERN.test(value)) {
      warnInvalidArgument(expression, file, `${name}=${value}`);
      return null;
    }
    styles.push(`--divider-${name}: ${value}`);
  }
  return element(
    'hr',
    {
      className: classNames,
      ...(styles.length > 0 ? { style: styles.join('; ') } : {}),
    },
    [],
  );
};
