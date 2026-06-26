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
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'h1',
      'h2',
      'img',
      'picture',
      'source',
      'figure',
      'figcaption',
      'ruby',
      'rt',
      'rp',
      'kbd',
      'wbr',
      'iframe',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
      source: ['src', 'srcset', 'sizes', 'type', 'media', 'width', 'height'],
      a: ['href', 'name', 'target', 'rel'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'title', 'loading'],
    },
    // YouTube 埋め込みの iframe を許可する。
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com'],
  });
}

// ビルド済み記事ページの HTML から <article> の中身を取り出す。
// 記事ページの <article> は1ページにつき1つで、コードブロック内の山括弧はエスケープ済みのため、
// 単純な抽出で安全に取り出せる。
function extractArticle(html) {
  const match = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/);
  return match ? match[1] : '';
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
          const pageHtml = fs.existsSync(pagePath) ? fs.readFileSync(pagePath, 'utf-8') : '';
          const article = extractArticle(pageHtml);
          return {
            title: entry.title,
            description: entry.description || undefined,
            pubDate: entry.pubDate ? new Date(entry.pubDate) : undefined,
            link: `/${entry.slug}/`,
            content: article ? sanitize(toAbsoluteUrls(article, origin)) : undefined,
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
