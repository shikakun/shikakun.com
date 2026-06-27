// コンテンツ作業クローン（shikakun.com-content）の解決と pages の走査。
// 解決は sync-content.mjs と同じ規約に揃える: CONTENT_SOURCE_DIR → 既定 ../shikakun.com-content。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
// 公開リポジトリと並列に置く規約上の作業クローン（sync-content.mjs の DEFAULT_SOURCE_DIR と同じ）。
const DEFAULT_CONTENT_DIR = path.resolve(REPO_ROOT, '..', 'shikakun.com-content');

const PAGE_EXTENSIONS = ['.md', '.mdx'];

export interface PageEntry {
  slug: string;
  /** フロントマターの title（無ければ null）。NFC 正規化前の生値。 */
  title: string | null;
  filePath: string;
}

/**
 * コンテンツ作業クローンの絶対パスを返す。
 * 解決できない場合は no-op で成功させず、明確なエラーで終了する（書き込み先が無い状態を検知する）。
 */
export function resolveContentDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.CONTENT_SOURCE_DIR) {
    const abs = path.resolve(env.CONTENT_SOURCE_DIR);
    if (!fs.existsSync(abs)) {
      throw new Error(`CONTENT_SOURCE_DIR が見つかりません: ${abs}`);
    }
    return abs;
  }
  if (fs.existsSync(DEFAULT_CONTENT_DIR)) {
    return DEFAULT_CONTENT_DIR;
  }
  throw new Error(
    `コンテンツ作業クローンが見つかりません: ${DEFAULT_CONTENT_DIR}\n` +
      'CONTENT_SOURCE_DIR で作業クローンのパスを指定してください。',
  );
}

export function pagesDir(contentDir: string): string {
  return path.join(contentDir, 'pages');
}

export function assetsDir(contentDir: string): string {
  return path.join(contentDir, 'assets');
}

export function ogImagePath(contentDir: string, slug: string): string {
  return path.join(assetsDir(contentDir), slug, 'og.png');
}

function isPageFile(name: string): boolean {
  return !name.startsWith('.') && PAGE_EXTENSIONS.includes(path.extname(name).toLowerCase());
}

/** pages/ 直下の記事ページを走査し、slug と title を返す（フラット運用・1 階層）。 */
export function listPages(contentDir: string): PageEntry[] {
  const dir = pagesDir(contentDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isPageFile(entry.name))
    .map((entry) => {
      const filePath = path.join(dir, entry.name);
      const slug = entry.name.slice(0, -path.extname(entry.name).length);
      const { data } = matter(fs.readFileSync(filePath, 'utf8'));
      const title = typeof data.title === 'string' ? data.title : null;
      return { slug, title, filePath };
    })
    .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

/** assets/ 直下にある og.png を持つ slug を列挙する（prune の走査対象）。 */
export function listOgImageSlugs(contentDir: string): string[] {
  const dir = assetsDir(contentDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .filter((slug) => fs.existsSync(ogImagePath(contentDir, slug)))
    .sort();
}
