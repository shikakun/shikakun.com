import type { MethodHandler } from '../types';
import { requireText, textElement } from './helpers';

/** `[TEXT(strong)]` → `<strong>` */
export const strong: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  return textElement('strong', {}, text);
};

/** `[TEXT(stroke)]` → `<s>` */
export const stroke: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  return textElement('s', {}, text);
};

/** `[TEXT(emphasize)]` → 圏点（黒三角・filled triangle） */
export const emphasize: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  return textElement('strong', { style: 'text-emphasis: filled triangle' }, text);
};
