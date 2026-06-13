import type { MethodHandler } from '../types';
import { element, rejectText, warnInvalidArgument } from './helpers';

const VARIANTS = ['solid', 'double', 'dash'] as const;

/**
 * `[(divider)]` → 実線、`[(divider, double)]` → 二重線、`[(divider, dash)]` → 点線
 * 単独の段落としてのみ使える（ブロックメソッド）。
 */
export const divider: MethodHandler = (expression, file) => {
  if (!rejectText(expression, file)) {
    return null;
  }
  const variant = expression.args[0] ?? 'solid';
  if (!VARIANTS.includes(variant as (typeof VARIANTS)[number])) {
    warnInvalidArgument(expression, file, variant);
    return null;
  }
  return element('hr', { className: ['bracket-divider', `bracket-divider--${variant}`] }, []);
};
