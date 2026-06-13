import type { MethodHandler } from '../types';
import { divider } from './divider';
import { kbd } from './kbd';
import { ruby } from './ruby';
import { spacer } from './spacer';
import { emphasize, stroke, strong } from './text-style';
import { youtube } from './youtube';

/** テキスト中で使えるメソッド */
export const inlineMethods: Record<string, MethodHandler> = {
  strong,
  stroke,
  emphasize,
  ruby,
  kbd,
  spacer,
};

/** 単独の段落としてのみ使えるメソッド */
export const blockMethods: Record<string, MethodHandler> = {
  divider,
  youtube,
};
