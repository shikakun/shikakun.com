// フォントとアバターを apps/og/assets/ から読み込む。
// ファイルは決定的なバイト列の生成のため固定（package.json で satori 等とともにバージョン固定）。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Font, FontWeight } from 'satori';

const ASSETS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const FONTS_DIR = path.join(ASSETS_DIR, 'fonts');

// satori が読めるフォント形式（woff2 は非対応）。最終素材は ttf を想定するが、
// 拡張子に依存せず最初に見つかったものを使う。
const FONT_EXTENSIONS = ['.ttf', '.otf', '.woff'];

// 同梱フォント。basename はあるが拡張子は問わない（README の配置と対応）。
const FONT_SPECS: { basename: string; family: string; weight: FontWeight }[] = [
  { basename: 'Inter-Medium', family: 'Inter', weight: 500 },
  { basename: 'Inter-SemiBold', family: 'Inter', weight: 600 },
  { basename: 'NotoSansJP-Medium', family: 'Noto Sans JP', weight: 500 },
  { basename: 'NotoSansJP-SemiBold', family: 'Noto Sans JP', weight: 600 },
];

const AVATAR_BASENAME = 'avatar';

function resolveAsset(dir: string, basename: string, extensions: string[]): string {
  for (const ext of extensions) {
    const candidate = path.join(dir, `${basename}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  const tried = extensions.map((ext) => `${basename}${ext}`).join(' / ');
  throw new Error(`素材が見つかりません: ${path.join(dir, tried)}`);
}

let fontsCache: Font[] | null = null;

/** 同梱フォントを satori 用に読み込む（プロセス内でキャッシュ）。 */
export function loadFonts(): Font[] {
  if (fontsCache) return fontsCache;
  fontsCache = FONT_SPECS.map((spec) => ({
    name: spec.family,
    weight: spec.weight,
    style: 'normal',
    data: fs.readFileSync(resolveAsset(FONTS_DIR, spec.basename, FONT_EXTENSIONS)),
  }));
  return fontsCache;
}

let avatarCache: string | null = null;

/** アバター画像を data URI（base64）として読み込む（プロセス内でキャッシュ）。 */
export function loadAvatarDataUri(): string {
  if (avatarCache) return avatarCache;
  const file = resolveAsset(ASSETS_DIR, AVATAR_BASENAME, ['.png']);
  avatarCache = `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
  return avatarCache;
}
