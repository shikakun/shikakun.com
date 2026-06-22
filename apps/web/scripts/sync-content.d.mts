// astro.config.ts（型チェック対象）が sync-content.mjs を import するための型宣言。
// 実体は素の JavaScript（.mjs）で、CI（Node 22 系）でも追加処理なしに実行できるようにしている。

import type { AstroIntegration } from 'astro';

/** dev 限定の Astro 統合。CONTENT_SOURCE_DIR を監視してビルドツリーへ反映する。 */
export function contentWatchIntegration(): AstroIntegration;

/** 環境変数に従ってコンテンツを一度だけ sync する。 */
export function runSync(env?: Record<string, string | undefined>): {
  synced: boolean;
  source?: string;
};
