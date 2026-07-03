// 記事タイトルから OG 画像を生成するローカル CLI。
//
// 使い方:
//   pnpm og:generate            手動画像を持たない全記事を生成・更新し、孤児を prune する
//   pnpm og:generate --slug foo  記事 foo のみを対象にする（prune しない）
//   pnpm og:generate --check     書き込まず、生成差分・孤児の有無を検査する（差分があれば非ゼロ終了）
//
// 出力先はコンテンツ作業クローン（CONTENT_SOURCE_DIR → 既定 ../shikakun.com-content）。

import { resolveContentDir } from './content';
import { generate, hasDiff } from './generate';

interface CliArgs {
  slug?: string;
  check: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { check: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') {
      args.check = true;
    } else if (arg === '--slug') {
      const value = argv[++i];
      if (!value) throw new Error('--slug には slug を指定してください');
      args.slug = value;
    } else if (arg.startsWith('--slug=')) {
      args.slug = arg.slice('--slug='.length);
    } else {
      throw new Error(`不明な引数です: ${arg}`);
    }
  }
  return args;
}

function printSummary(result: Awaited<ReturnType<typeof generate>>): void {
  const parts = [
    `生成 ${result.created.length}`,
    `更新 ${result.updated.length}`,
    `変更なし ${result.unchanged.length}`,
    `手動スキップ ${result.skippedManual.length}`,
    `title 無しスキップ ${result.skippedNoTitle.length}`,
    `孤児 ${result.orphans.length}`,
  ];
  console.log(`[og] 完了: ${parts.join(' / ')}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const contentDir = resolveContentDir();
  console.log(`[og] 出力先: ${contentDir}`);

  const result = await generate({ contentDir, slug: args.slug, check: args.check });
  printSummary(result);

  if (args.check && hasDiff(result)) {
    console.error(
      '[og] --check: 生成差分または孤児があります。`pnpm og:generate` を実行してください。',
    );
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[og] エラー: ${message}`);
  process.exitCode = 1;
});
