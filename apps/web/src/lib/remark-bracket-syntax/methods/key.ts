import type { MethodHandler } from '../types';
import { requireText, textElement } from './helpers';

/**
 * キーシンボルのプリセット。記号だけでは読み上げで伝わらないため、
 * aria-labelを必ず付ける（title引数で上書きできる）。
 */
const KEY_PRESETS: Record<string, { symbol: string; label: string }> = {
  control: { symbol: '⌃', label: 'Control' },
  option: { symbol: '⌥', label: 'Option' },
  shift: { symbol: '⇧', label: 'Shift' },
  command: { symbol: '⌘', label: 'Command' },
  delete: { symbol: '⌫', label: 'Delete' },
  return: { symbol: '⏎', label: 'Return' },
  space: { symbol: '␣', label: 'Space' },
  tab: { symbol: '⇥', label: 'Tab' },
  escape: { symbol: '⎋', label: 'Escape' },
  'arrow-up': { symbol: '↑', label: 'Arrow Up' },
  'arrow-down': { symbol: '↓', label: 'Arrow Down' },
  'arrow-left': { symbol: '←', label: 'Arrow Left' },
  'arrow-right': { symbol: '→', label: 'Arrow Right' },
};

/**
 * `[Command(key)]` → `<kbd>Command</kbd>`
 * `[(key.command)]` → `<kbd aria-label="Command">⌘</kbd>`
 * `[(key.delete,title="Backspace")]` → `<kbd aria-label="Backspace">⌫</kbd>`
 */
export const key: MethodHandler = (expression, file) => {
  if (expression.preset !== null) {
    if (expression.text !== null) {
      file.message(
        `bracket-syntax: keyのプリセットは[(key.${expression.preset})]の形で使うため無視しました`,
      );
      return null;
    }
    const preset = KEY_PRESETS[expression.preset];
    if (!preset) {
      file.message(`bracket-syntax: keyの未知のプリセットのため無視しました: ${expression.preset}`);
      return null;
    }
    return textElement(
      'kbd',
      { ariaLabel: expression.namedArgs.title ?? preset.label },
      preset.symbol,
    );
  }
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  return textElement('kbd', {}, text);
};
