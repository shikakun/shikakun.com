import type { MethodHandler } from '../types';
import { POSITIVE_NUMBER_PATTERN, requireText, textElement, warnInvalidArgument } from './helpers';

/** `[TEXT(strong)]` → `<strong>` */
export const strong: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  return textElement('strong', {}, text);
};

/** `[TEXT(stroke)]`・`[TEXT(stroke,4)]` → `<s>`（引数は線の太さpx） */
export const stroke: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  const thickness = expression.args[0];
  if (thickness === undefined) {
    return textElement('s', {}, text);
  }
  if (!POSITIVE_NUMBER_PATTERN.test(thickness)) {
    warnInvalidArgument(expression, file, thickness);
    return null;
  }
  return textElement('s', { style: `text-decoration-thickness: ${thickness}px` }, text);
};

/** `[TEXT(doublestroke,2)]` → 二重の打ち消し線 */
export const doublestroke: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  const styles = ['text-decoration-style: double'];
  const thickness = expression.args[0];
  if (thickness !== undefined) {
    if (!POSITIVE_NUMBER_PATTERN.test(thickness)) {
      warnInvalidArgument(expression, file, thickness);
      return null;
    }
    styles.push(`text-decoration-thickness: ${thickness}px`);
  }
  return textElement('s', { style: styles.join('; ') }, text);
};

/** `[TEXT(weight,200)]` → `font-weight` */
export const weight: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  const value = expression.args[0] ?? '';
  const parsed = Number(value);
  if (!POSITIVE_NUMBER_PATTERN.test(value) || parsed < 1 || parsed > 1000) {
    warnInvalidArgument(expression, file, value);
    return null;
  }
  return textElement('span', { style: `font-weight: ${value}` }, text);
};

/** `[TEXT(oblique)]`・`[TEXT(oblique,30)]` → `font-style: oblique`（引数は角度deg） */
export const oblique: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  const angle = expression.args[0];
  if (angle === undefined) {
    return textElement('span', { style: 'font-style: oblique' }, text);
  }
  const parsed = Number(angle);
  if (!/^-?\d+(\.\d+)?$/.test(angle) || parsed < -90 || parsed > 90) {
    warnInvalidArgument(expression, file, angle);
    return null;
  }
  return textElement('span', { style: `font-style: oblique ${angle}deg` }, text);
};

/** `[TEXT(scale, 1.5)]` → `font-size`（em単位の倍率） */
export const scale: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  const value = expression.args[0] ?? '';
  if (!POSITIVE_NUMBER_PATTERN.test(value) || Number(value) <= 0) {
    warnInvalidArgument(expression, file, value);
    return null;
  }
  return textElement('span', { style: `font-size: ${value}em` }, text);
};

/** `[TEXT(mono)]`・`[TEXT(mono,800)]` → 等幅フォント（引数はfont-weight） */
export const mono: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  const weightValue = expression.args[0];
  if (weightValue === undefined) {
    return textElement('span', { className: ['bracket-mono'] }, text);
  }
  const parsed = Number(weightValue);
  if (!POSITIVE_NUMBER_PATTERN.test(weightValue) || parsed < 1 || parsed > 1000) {
    warnInvalidArgument(expression, file, weightValue);
    return null;
  }
  return textElement(
    'span',
    { className: ['bracket-mono'], style: `font-weight: ${weightValue}` },
    text,
  );
};

/**
 * 圏点の番号（1〜10）とtext-emphasis-styleの対応。
 * 出典の見た目との突き合わせは未実施のため、対応は変更される可能性がある（docs/bracket-syntax.md）。
 */
const EMPHASIS_STYLES = [
  'filled dot',
  'open dot',
  'filled sesame',
  'open sesame',
  'filled circle',
  'open circle',
  'filled triangle',
  'open triangle',
  'filled double-circle',
  'open double-circle',
];

/** `[TEXT(emphasize,1)]` → 圏点（傍点） */
export const emphasize: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  const value = expression.args[0] ?? '1';
  const index = Number(value);
  if (!/^\d+$/.test(value) || index < 1 || index > EMPHASIS_STYLES.length) {
    warnInvalidArgument(expression, file, value);
    return null;
  }
  return textElement('span', { style: `text-emphasis: ${EMPHASIS_STYLES[index - 1]}` }, text);
};
