// 非公開リポジトリ（shikakun.com-content）のコンテンツを公開リポジトリのビルドツリーへ取り込む sync スクリプト。
//
// - CLI（`node scripts/sync-content.mjs`）として実行すると環境変数に従って一度だけ sync する。
// - dev 用の Astro 統合（contentWatchIntegration）から、コピー処理を共通化して呼び出す。
//
// 追加依存を持たず、git と Node 標準 API のみを使用する。CI（Node 22 系）でも素の JavaScript として実行できる。
//
// 環境変数:
//   CONTENT_REPO_URL   非公開リポジトリの clone URL（例: git@github.com:shikakun/shikakun.com-content.git）
//   CONTENT_REF        取り込むブランチ／参照（既定: main）
//   CONTENT_SOURCE_DIR 既存のローカルクローンを使う場合のパス（指定時は clone せずここを参照）
//   CONTENT_REQUIRED   'true' のとき、取得失敗をエラーにする（デプロイ用）
//
// CONTENT_SOURCE_DIR も CONTENT_REPO_URL も無いときは、公開リポジトリと並列の作業クローン
// （<リポジトリroot>/../shikakun.com-content）が在ればそれを使う。ローカルでは env を付けずに pnpm dev だけで動く。

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
// apps/web のルート（scripts/ の1つ上）。cwd に依存せずパスを解決する。
const WEB_ROOT = path.resolve(SCRIPT_DIR, '..');
const CACHE_DIR = path.join(WEB_ROOT, '.content-cache');
// 公開リポジトリのルート（apps/web の2つ上）。
const REPO_ROOT = path.resolve(WEB_ROOT, '..', '..');
// CONTENT_SOURCE_DIR / CONTENT_REPO_URL のどちらも無いときに使う、規約上の作業クローン。
// 公開リポジトリと並列に clone した非公開リポジトリ（shikakun.com-content）を指す。
const DEFAULT_SOURCE_DIR = path.resolve(REPO_ROOT, '..', 'shikakun.com-content');

const PREFIX = '[content:sync]';
const log = {
  info: (message) => console.log(`${PREFIX} ${message}`),
  warn: (message) => console.warn(`${PREFIX} ${message}`),
  error: (message) => console.error(`${PREFIX} ${message}`),
};

// 非公開リポジトリ（ソース）→ ビルドツリー（ターゲット）の同期マッピング。
// match は、ソースのサブディレクトリからの相対パスに対して取り込み対象かどうかを判定する。
const MAPPINGS = [
  {
    name: 'pages',
    sourceSubdir: 'pages',
    targetDir: path.join(WEB_ROOT, 'src/content/pages'),
    match: (rel) => /\.(md|mdx)$/i.test(rel),
  },
  {
    name: 'tags',
    sourceSubdir: 'tags',
    targetDir: path.join(WEB_ROOT, 'src/content/tags'),
    match: (rel) => /\.yaml$/i.test(rel),
  },
  {
    name: 'assets',
    sourceSubdir: 'assets',
    targetDir: path.join(WEB_ROOT, 'src/assets/pages'),
    match: () => true,
  },
];

// 同一ディレクトリ内の一時ファイルへ書き出してから rename することで、
// 部分的に書き込まれたファイルが読まれない（Astro が壊れた中間状態を読まない）ようにする。
function atomicCopy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.copyFileSync(src, tmp);
  fs.renameSync(tmp, dest);
}

// ターゲットを .gitkeep を除いて空にする。コレクションの base を保つため .gitkeep は残す。
function cleanTarget(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(targetDir)) {
    if (entry === '.gitkeep') continue;
    fs.rmSync(path.join(targetDir, entry), { recursive: true, force: true });
  }
}

// ソースのサブディレクトリを再帰的に走査し、match に一致するファイルをターゲットへコピーする。
// ドットで始まるファイル・ディレクトリ（.git / .DS_Store / .gitkeep など）は取り込まない。
function copyMapping(sourceRoot, mapping) {
  const sourceSubdir = path.join(sourceRoot, mapping.sourceSubdir);
  if (!fs.existsSync(sourceSubdir)) return;

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        const rel = path.relative(sourceSubdir, abs);
        if (mapping.match(rel)) {
          atomicCopy(abs, path.join(mapping.targetDir, rel));
        }
      }
    }
  };
  walk(sourceSubdir);
}

function git(args, cwd) {
  execFileSync('git', args, { cwd, stdio: ['ignore', 'ignore', 'inherit'] });
}

// 非公開リポジトリをキャッシュへ取得し、リモートの CONTENT_REF と完全一致させる（削除も反映）。
function fetchRepo(repoUrl, ref, cacheDir) {
  if (fs.existsSync(path.join(cacheDir, '.git'))) {
    // CONTENT_REPO_URL が前回実行時と変わっている場合に備え、origin を現在の URL に揃えてから取得する。
    git(['remote', 'set-url', 'origin', repoUrl], cacheDir);
    git(['fetch', '--depth', '1', 'origin', ref], cacheDir);
    git(['reset', '--hard', 'FETCH_HEAD'], cacheDir);
    git(['clean', '-fd'], cacheDir);
  } else {
    // 中途半端なキャッシュが残っていれば消してから shallow clone する。
    fs.rmSync(cacheDir, { recursive: true, force: true });
    git(['clone', '--depth', '1', '--branch', ref, '--single-branch', repoUrl, cacheDir]);
  }
  return cacheDir;
}

// ソース（非公開リポジトリの作業ツリー）の絶対パスを返す。得られなければ null。
function resolveSource({ sourceDir, repoUrl, ref, cacheDir }) {
  if (sourceDir) {
    const abs = path.resolve(sourceDir);
    if (fs.existsSync(abs)) return abs;
    log.warn(`CONTENT_SOURCE_DIR が見つかりません: ${abs}`);
    return null;
  }
  if (repoUrl) {
    try {
      return fetchRepo(repoUrl, ref, cacheDir);
    } catch (error) {
      log.warn(`非公開リポジトリの取得に失敗しました: ${error.message}`);
      return null;
    }
  }
  // 明示指定が無ければ、公開リポジトリと並列の作業クローン（規約パス）が在ればそれを使う。
  if (fs.existsSync(DEFAULT_SOURCE_DIR)) {
    log.info(`既定の作業クローンを使用します: ${DEFAULT_SOURCE_DIR}`);
    return DEFAULT_SOURCE_DIR;
  }
  return null;
}

// dev の watcher 用にローカルのソースディレクトリを解決する。
// 明示の CONTENT_SOURCE_DIR を優先し、無ければ規約パスが在ればそれを返す。
function resolveLocalSourceDir(env) {
  if (env.CONTENT_SOURCE_DIR) return path.resolve(env.CONTENT_SOURCE_DIR);
  if (fs.existsSync(DEFAULT_SOURCE_DIR)) return DEFAULT_SOURCE_DIR;
  return null;
}

/**
 * 環境変数に従ってコンテンツを sync する。
 * ソースが得られた場合のみ、各ターゲットを .gitkeep を除いて空にしてからコピーする（冪等・完全一致）。
 * ソースが得られない場合は、CONTENT_REQUIRED=true ならエラー、それ以外はビルドツリーを書き換えずに終了する。
 */
export function runSync(env = process.env) {
  const required = env.CONTENT_REQUIRED === 'true';
  const source = resolveSource({
    sourceDir: env.CONTENT_SOURCE_DIR,
    repoUrl: env.CONTENT_REPO_URL,
    ref: env.CONTENT_REF || 'main',
    cacheDir: CACHE_DIR,
  });

  if (!source) {
    if (required) {
      throw new Error('コンテンツのソースを取得できませんでした（CONTENT_REQUIRED=true）');
    }
    log.warn('コンテンツのソースが無いため、既存のビルドツリーを保持して終了します（no-op）');
    return { synced: false };
  }

  // ソースに当該サブディレクトリが在るマッピングだけを clean+copy する。
  // ソースを取得できても目的のサブディレクトリが無い場合に target を空にして、
  // 空のビルドツリーを「同期済み」と誤認することを防ぐ（破壊的操作の前に存在を確認する）。
  let copiedAny = false;
  for (const mapping of MAPPINGS) {
    if (!fs.existsSync(path.join(source, mapping.sourceSubdir))) {
      log.warn(`ソースに ${mapping.sourceSubdir}/ が無いため ${mapping.name} はスキップします`);
      continue;
    }
    cleanTarget(mapping.targetDir);
    copyMapping(source, mapping);
    copiedAny = true;
  }

  if (!copiedAny) {
    if (required) {
      throw new Error(
        'ソースに pages/ tags/ assets/ のいずれも無く、コンテンツを sync できませんでした（CONTENT_REQUIRED=true）',
      );
    }
    log.warn('ソースに取り込み対象が無いため、既存のビルドツリーを保持して終了します（no-op）');
    return { synced: false };
  }

  log.info(`コンテンツを sync しました: ${source}`);
  return { synced: true, source };
}

/**
 * dev 限定の Astro 統合。CONTENT_SOURCE_DIR（作業クローン）を監視し、
 * 変更があったファイルを runSync と同じコピー処理でビルドツリーへ反映する。
 * 本番ビルド（astro build）では astro:server:setup が発火しないため動かない。
 */
export function contentWatchIntegration() {
  return {
    name: 'content-watch',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        const out = logger ?? console;
        const sourceRoot = resolveLocalSourceDir(process.env);
        if (!sourceRoot) {
          out.info(
            'CONTENT_SOURCE_DIR が未設定で既定の作業クローンも無いため、コンテンツのホットリロードは無効です',
          );
          return;
        }

        // Vite（chokidar）の watcher を再利用し、作業クローンの各サブディレクトリを監視する。
        const watchDirs = MAPPINGS.map((m) => path.join(sourceRoot, m.sourceSubdir)).filter((dir) =>
          fs.existsSync(dir),
        );
        if (watchDirs.length === 0) {
          out.warn(`監視対象が見つかりません: ${sourceRoot}`);
          return;
        }
        server.watcher.add(watchDirs);

        const applyEvent = (changedPath, kind) => {
          const abs = path.resolve(changedPath);
          for (const mapping of MAPPINGS) {
            const subdirAbs = path.join(sourceRoot, mapping.sourceSubdir);
            const rel = path.relative(subdirAbs, abs);
            // このマッピングの監視範囲外（rel が親方向 / 絶対パス）は対象外。
            if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
            // ドットで始まる要素を含むパス（.git など）は無視する。
            if (rel.split(path.sep).some((seg) => seg.startsWith('.'))) return;
            if (!mapping.match(rel)) return;

            const dest = path.join(mapping.targetDir, rel);
            if (kind === 'unlink') {
              fs.rmSync(dest, { force: true });
              out.info(`削除: ${path.relative(WEB_ROOT, dest)}`);
            } else {
              atomicCopy(abs, dest);
              out.info(`更新: ${path.relative(WEB_ROOT, dest)}`);
            }
            return;
          }
        };

        server.watcher.on('add', (p) => applyEvent(p, 'add'));
        server.watcher.on('change', (p) => applyEvent(p, 'change'));
        server.watcher.on('unlink', (p) => applyEvent(p, 'unlink'));
        out.info(`コンテンツの作業クローンを監視します: ${sourceRoot}`);
      },
    },
  };
}

// CLI として直接実行されたときのみ sync する（他モジュールからの import 時は実行しない）。
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    runSync(process.env);
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
}
