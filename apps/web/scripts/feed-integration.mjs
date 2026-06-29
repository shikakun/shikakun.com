// ビルド後に feed.xml（全文RSS）を生成する Astro 統合。
//
// Cloudflare アダプタの prerender ランタイム（workerd 相当）では Container API が node:path を
// 解決できず、エンドポイント内で MDX を HTML へ描画できない。そこで、通常どおり静的生成された
// 記事ページの HTML から本文（<article> の中身）を取り出し、Node で動く astro:build:done フックの
// 中で全文 RSS を組み立てる。
//
// 記事のメタデータ（タイトル・説明・公開日）は、astro:content を使う中間エンドポイント
// （feed-data.json）が出力したものを読む。RSS 生成後、その中間ファイルは削除する。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';

const DATA_FILENAME = 'feed-data.json';

// root 相対の URL（/_astro/... や /slug）を絶対 URL へ書き換える。
// RSS は外部のリーダーで読まれるため、画像やリンクは絶対 URL である必要がある。
function toAbsoluteUrls(html, origin) {
  return html
    .replace(/(\b(?:href|src)=")\/(?!\/)/g, `$1${origin}/`)
    .replace(
      /(\bsrcset=")([^"]+)(")/g,
      (_match, prefix, value, suffix) =>
        `${prefix}${value.replace(/(^|,\s*)\/(?!\/)/g, `$1${origin}/`)}${suffix}`,
    );
}

// RSS の content:encoded 用に、記事本文として意味のあるタグだけを許可する。
// script やレイアウト由来のクラス属性など、配信に不要なものは落とす。
function sanitize(html) {
  return sanitizeHtml(html, {
    // 見出しや ruby・kbd・wbr などはデフォルトで許可されている。画像と埋め込みのタグだけ補う。
    // span は非セマンティックで、RSS ではサイトの CSS が効かず装飾の意味を持たない。
    // 特にコードブロックのシンタックスハイライトが大量の入れ子 span を生むため、除外して
    // 中身のテキストだけ残す（コードはプレーンテキストになる）。
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags.filter((tag) => tag !== 'span'),
      'img',
      'picture',
      'source',
      'iframe',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      // 脚注（GFM）の参照と定義のあいだのジャンプリンクを成立させるため、id を全要素で残す。
      // 既定では id が落ち、#user-content-fn-1 などの飛び先が失われてリーダー上でジャンプできない。
      '*': ['id'],
      img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
      source: ['src', 'srcset', 'sizes', 'type', 'media', 'width', 'height'],
      // 脚注リンクの読み上げ用ラベル・説明（aria-*）も残す。
      a: ['href', 'name', 'target', 'rel', 'aria-label', 'aria-describedby'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'title', 'loading'],
    },
    // YouTube 埋め込みの iframe を許可する。
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com'],
  });
}

// ビルド済み記事ページの HTML から本文だけを取り出す。
// 記事ページの <article> は1ページにつき1つで、コードブロック内の山括弧はエスケープ済みのため、
// 単純な抽出で安全に取り出せる。<header>（タイトル見出し）と <footer>（日付・タグ）は、
// それぞれ RSS の <title> や item のメタデータと重複するため、本文からは取り除く。
function extractArticleBody(html) {
  const match = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/);
  if (!match) return '';
  return match[1]
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, '');
}

export function feedIntegration({ title, description }) {
  let clientDir;
  let site;
  let format = 'directory';

  return {
    name: 'feed',
    hooks: {
      'astro:config:done': ({ config }) => {
        clientDir = fileURLToPath(config.build.client);
        site = config.site;
        format = config.build.format;
      },
      'astro:build:done': async ({ logger }) => {
        if (!site) {
          logger.warn('site が未設定のため feed.xml の生成をスキップします');
          return;
        }

        const dataPath = path.join(clientDir, DATA_FILENAME);
        if (!fs.existsSync(dataPath)) {
          logger.warn(`${DATA_FILENAME} が見つからないため feed.xml を生成できません`);
          return;
        }

        const origin = new URL(site).origin;
        const entries = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        const items = entries.map((entry) => {
          const pagePath =
            format === 'file'
              ? path.join(clientDir, `${entry.slug}.html`)
              : path.join(clientDir, entry.slug, 'index.html');

          // 本文の取得に失敗してもその item の配信は続けるが、パスやテンプレートの不具合に
          // 気づけるよう、失敗の種類（HTML が無い / <article> を抽出できない）を warn で残す。
          let content;
          if (!fs.existsSync(pagePath)) {
            logger.warn(
              `記事HTMLが見つからないため本文を配信できません: ${entry.slug}（${pagePath}）`,
            );
          } else {
            const article = extractArticleBody(fs.readFileSync(pagePath, 'utf-8'));
            if (article) {
              content = sanitize(toAbsoluteUrls(article, origin));
            } else {
              logger.warn(`本文（<article>）を抽出できませんでした: ${entry.slug}`);
            }
          }

          return {
            title: entry.title,
            description: entry.description || undefined,
            pubDate: entry.pubDate ? new Date(entry.pubDate) : undefined,
            link: `/${entry.slug}/`,
            content,
          };
        });

        const response = await rss({ title, description, site, items });
        const xml = await response.text();
        fs.writeFileSync(path.join(clientDir, 'feed.xml'), xml, 'utf-8');

        // 中間データは公開サイトに不要なため削除する。
        fs.rmSync(dataPath, { force: true });

        logger.info(`feed.xml を生成しました（${items.length} 件）`);
      },
    },
  };
}
