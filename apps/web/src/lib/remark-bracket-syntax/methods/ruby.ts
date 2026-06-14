import type { ElementContent } from 'hast';
import type { MethodHandler } from '../types';
import { element, requireText } from './helpers';

function rt(reading: string): ElementContent {
  return {
    type: 'element',
    tagName: 'rt',
    properties: {},
    children: [{ type: 'text', value: reading }],
  };
}

/**
 * `[標準機能(ruby,ひょう じゅん き のう)]` → モノルビ（読みをスペース区切りで1文字ずつ割り当て）
 * `[超電磁砲(ruby,レールガン)]` → グループルビ
 * 読みの数と基底文字数が一致しない場合は警告してグループルビにフォールバックする。
 */
export const ruby: MethodHandler = (expression, file) => {
  const text = requireText(expression, file);
  if (text === null) {
    return null;
  }
  const reading = expression.args[0];
  if (reading === undefined || reading === '') {
    file.message('bracket-syntax: rubyには読みの引数が必要なため無視しました');
    return null;
  }

  if (/\s/.test(reading)) {
    const readings = reading.split(/\s+/);
    // サロゲートペアを壊さないようコードポイント単位で分割する
    const baseCharacters = [...text];
    if (readings.length === baseCharacters.length) {
      const children: ElementContent[] = [];
      baseCharacters.forEach((char, index) => {
        children.push({ type: 'text', value: char }, rt(readings[index]));
      });
      return element('ruby', {}, children);
    }
    file.message(
      `bracket-syntax: rubyの読みの数（${readings.length}）と文字数（${baseCharacters.length}）が一致しないためグループルビにしました: ${text}`,
    );
    return element('ruby', {}, [{ type: 'text', value: text }, rt(readings.join(''))]);
  }

  return element('ruby', {}, [{ type: 'text', value: text }, rt(reading)]);
};
