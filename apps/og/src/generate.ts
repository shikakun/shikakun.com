// pages の走査 → 各記事の OG 画像の生成・更新・prune を束ねる。
// CLI から切り離してテストできるよう、副作用の入口をこのモジュールに閉じる。

import fs from 'node:fs';
import path from 'node:path';
import { listOgImageSlugs, listPages, ogImagePath, type PageEntry } from './content';
import { hasMarker } from './marker';
import { renderOgImage } from './render';

export interface GenerateOptions {
  contentDir: string;
  /** 指定すると当該 slug のみを対象にし、prune は行わない。 */
  slug?: string;
  /** 書き込まず、生成差分と孤児の有無だけを検査する。 */
  check?: boolean;
}

export interface GenerateResult {
  /** 新規生成（check では「新規生成される」）。 */
  created: string[];
  /** 再描画して更新（check では「更新される」）。created とともに差分を表す。 */
  updated: string[];
  /** 既存と同一バイトで変更なし。 */
  unchanged: string[];
  skippedManual: string[];
  skippedNoTitle: string[];
  /** prune 対象（孤児）。check では削除せず列挙のみ。 */
  orphans: string[];
  /** 実際に削除した孤児（非 check 時）。 */
  pruned: string[];
}

/** 差分（生成／更新／孤児）があるか。check の終了コード判定に使う。 */
export function hasDiff(result: GenerateResult): boolean {
  return result.created.length > 0 || result.updated.length > 0 || result.orphans.length > 0;
}

type Logger = Pick<typeof console, 'log' | 'warn'>;

function readIfExists(file: string): Buffer | null {
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

// 同一ディレクトリの一時ファイルへ書いてから rename する（書き込み途中の破損を避ける）。
function atomicWrite(dest: string, data: Buffer): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, dest);
}

// og.png を消し、ディレクトリが空になれば（他の素材が無ければ）ディレクトリごと片付ける。
function removeOgImage(file: string): void {
  fs.rmSync(file, { force: true });
  const dir = path.dirname(file);
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}

export async function generate(
  options: GenerateOptions,
  logger: Logger = console,
): Promise<GenerateResult> {
  const { contentDir, slug, check } = options;
  const result: GenerateResult = {
    created: [],
    updated: [],
    unchanged: [],
    skippedManual: [],
    skippedNoTitle: [],
    orphans: [],
    pruned: [],
  };

  const allPages = listPages(contentDir);
  const targets = slug ? allPages.filter((page) => page.slug === slug) : allPages;
  if (slug && targets.length === 0) {
    throw new Error(`指定された slug のページが見つかりません: ${slug}`);
  }

  for (const page of targets) {
    await processPage(page, contentDir, check ?? false, result, logger);
  }

  // prune は全記事を対象にした実行（--slug 指定なし）のときだけ行う。
  if (!slug) {
    pruneOrphans(allPages, contentDir, check ?? false, result, logger);
  }

  return result;
}

async function processPage(
  page: PageEntry,
  contentDir: string,
  check: boolean,
  result: GenerateResult,
  logger: Logger,
): Promise<void> {
  if (!page.title) {
    result.skippedNoTitle.push(page.slug);
    logger.warn(`[og] title が無いためスキップ: ${page.slug}`);
    return;
  }

  const dest = ogImagePath(contentDir, page.slug);
  const existing = readIfExists(dest);

  // 手動画像（生成 marker 無し）は不可侵。描画もせずスキップする。
  if (existing && !hasMarker(existing)) {
    result.skippedManual.push(page.slug);
    logger.log(`[og] 手動画像のためスキップ: ${page.slug}`);
    return;
  }

  const png = await renderOgImage(page.title);
  const changed = !existing?.equals(png);

  if (!changed) {
    result.unchanged.push(page.slug);
    return;
  }

  if (!check) {
    atomicWrite(dest, png);
  }
  if (existing) {
    result.updated.push(page.slug);
    logger.log(`[og] ${check ? '更新される' : '更新'}: ${page.slug}`);
  } else {
    result.created.push(page.slug);
    logger.log(`[og] ${check ? '生成される' : '生成'}: ${page.slug}`);
  }
}

function pruneOrphans(
  allPages: PageEntry[],
  contentDir: string,
  check: boolean,
  result: GenerateResult,
  logger: Logger,
): void {
  const pageSlugs = new Set(allPages.map((page) => page.slug));
  for (const slug of listOgImageSlugs(contentDir)) {
    if (pageSlugs.has(slug)) continue;
    const file = ogImagePath(contentDir, slug);
    const buf = readIfExists(file);
    // 生成 marker を持つ（= 生成画像）孤児だけを対象にする。手動画像は消さない。
    if (!buf || !hasMarker(buf)) continue;

    result.orphans.push(slug);
    if (check) {
      logger.log(`[og] 孤児（削除対象）: ${slug}`);
      continue;
    }
    removeOgImage(file);
    result.pruned.push(slug);
    logger.log(`[og] 孤児を削除: ${slug}`);
  }
}
