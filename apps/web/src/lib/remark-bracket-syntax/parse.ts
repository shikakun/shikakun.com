import type { BracketExpression } from './types';

/**
 * 引用符のペア。smartypantsは無効化しているが、
 * 手書きのカーリークォートにも防御的に対応する。
 */
const QUOTE_PAIRS: Record<string, string> = {
  '"': '"',
  '“': '”',
};

/** METHOD(.PRESET)?(:SUBTYPE)? */
const HEAD_PATTERN = /^([a-z][a-z-]*)(?:\.([a-z][a-z-]*))?(?::([a-z][a-z-]*))?$/;

/** 名前付き引数の名前部分 */
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9-]*$/;

export interface ParseResult {
  expression: BracketExpression;
  /** 式の終端`]`の次のインデックス */
  endIndex: number;
}

/**
 * source[startIndex]が`[`であることを前提に、角括弧式のパースを試みる。
 * 構文に合致しなければnullを返す（呼び出し側はソースをそのまま出力する）。
 * 式は行をまたげない。
 */
export function parseBracketExpression(source: string, startIndex: number): ParseResult | null {
  if (source[startIndex] !== '[') {
    return null;
  }

  // TEXT部：`[`の直後から最初の`(`まで。先に角括弧・閉じパーレン・改行が現れたら式ではない
  let parenIndex = -1;
  for (let i = startIndex + 1; i < source.length; i++) {
    const char = source[i];
    if (char === '(') {
      parenIndex = i;
      break;
    }
    if (char === '[' || char === ']' || char === ')' || char === '\n') {
      return null;
    }
  }
  if (parenIndex === -1) {
    return null;
  }
  const text = source.slice(startIndex + 1, parenIndex);

  const closeParenIndex = findCloseParen(source, parenIndex + 1);
  if (closeParenIndex === -1) {
    return null;
  }
  const inner = source.slice(parenIndex + 1, closeParenIndex);

  // `)`の後：任意の`..`（範囲オペレーター）と必須の`]`
  let isRangeStart = false;
  let endBracketIndex = closeParenIndex + 1;
  if (source.startsWith('..', endBracketIndex)) {
    isRangeStart = true;
    endBracketIndex += 2;
  }
  if (source[endBracketIndex] !== ']') {
    return null;
  }

  const parts = splitArguments(inner);
  const head = parts.shift()?.trim();
  if (!head) {
    return null;
  }
  const headMatch = HEAD_PATTERN.exec(head);
  if (!headMatch) {
    return null;
  }

  const args: string[] = [];
  const namedArgs: Record<string, string> = {};
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === '') {
      return null;
    }
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex > 0 && NAME_PATTERN.test(trimmed.slice(0, equalsIndex))) {
      namedArgs[trimmed.slice(0, equalsIndex)] = unquote(trimmed.slice(equalsIndex + 1).trim());
    } else {
      args.push(unquote(trimmed));
    }
  }

  return {
    expression: {
      text: text === '' ? null : text,
      method: headMatch[1],
      preset: headMatch[2] ?? null,
      subtype: headMatch[3] ?? null,
      args,
      namedArgs,
      isRangeStart,
    },
    endIndex: endBracketIndex + 1,
  };
}

/**
 * 引用符の中を読み飛ばしながら、対応する`)`の位置を返す。
 * 見つからない場合と改行をまたぐ場合は-1。
 */
function findCloseParen(source: string, from: number): number {
  let i = from;
  while (i < source.length) {
    const char = source[i];
    if (char === ')') {
      return i;
    }
    if (char === '\n') {
      return -1;
    }
    const closer = QUOTE_PAIRS[char];
    if (closer) {
      const quoteEnd = source.indexOf(closer, i + 1);
      if (quoteEnd === -1) {
        return -1;
      }
      i = quoteEnd + 1;
      continue;
    }
    i++;
  }
  return -1;
}

/** 引用符の中のカンマでは分割せずに、カンマ区切りの引数リストへ分割する */
function splitArguments(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (char === ',') {
      parts.push(current);
      current = '';
      i++;
      continue;
    }
    const closer = QUOTE_PAIRS[char];
    if (closer) {
      const quoteEnd = input.indexOf(closer, i + 1);
      if (quoteEnd !== -1) {
        current += input.slice(i, quoteEnd + 1);
        i = quoteEnd + 1;
        continue;
      }
    }
    current += char;
    i++;
  }
  parts.push(current);
  return parts;
}

/** 全体が引用符で囲まれていれば取り除く */
function unquote(value: string): string {
  const closer = QUOTE_PAIRS[value[0] ?? ''];
  if (closer && value.length >= 2 && value.endsWith(closer)) {
    return value.slice(1, -1);
  }
  return value;
}
