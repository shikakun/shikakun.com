import type { MethodHandler } from '../types';
import { CSS_LENGTH_PATTERN, element, rejectText, warnInvalidArgument } from './helpers';

/** `[(spacer)]`（1em）・`[(spacer,2em)]`・`[(spacer,8px)]` → インラインの余白 */
export const spacer: MethodHandler = (expression, file) => {
  if (!rejectText(expression, file)) {
    return null;
  }
  const size = expression.args[0] ?? '1em';
  if (size === 'auto') {
    // autoはマルチカラム（columns）での改列指定。columnsと同じフェーズ2で対応する
    file.message('bracket-syntax: spacerのautoは未対応のため無視しました');
    return null;
  }
  if (!CSS_LENGTH_PATTERN.test(size)) {
    warnInvalidArgument(expression, file, size);
    return null;
  }
  return element('span', { className: ['bracket-spacer'], style: `inline-size: ${size}` }, []);
};
