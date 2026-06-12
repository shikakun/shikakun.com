import type { MethodHandler } from '../types';
import { divider } from './divider';
import { key } from './key';
import { ruby } from './ruby';
import { spacer } from './spacer';
import {
  doublestroke,
  emphasize,
  mono,
  oblique,
  scale,
  stroke,
  strong,
  weight,
} from './text-style';
import { youtube } from './youtube';

/** テキスト中で使えるメソッド */
export const inlineMethods: Record<string, MethodHandler> = {
  strong,
  stroke,
  doublestroke,
  weight,
  oblique,
  scale,
  mono,
  emphasize,
  ruby,
  key,
  spacer,
};

/** 単独の段落としてのみ使えるメソッド */
export const blockMethods: Record<string, MethodHandler> = {
  divider,
  youtube,
};
