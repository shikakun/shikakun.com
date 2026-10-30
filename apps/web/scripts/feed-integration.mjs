// ビルド後にfeed.xml（全文RSS）を生成するAstro integration
//
// サイトと同じ表示の本文を配信するため、静的生成した記事ページのHTMLから本文を取り出している。
// 記事のタイトルや公開日などは、中間エンドポイント（feed-data.json）が書き出したものを読む。
// この中間ファイルは、RSSを生成したあとで削除する。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';

const DATA_FILENAME = 'feed-data.json';

// RSSはRSSリーダーで読まれるので、ルート相対のURLを絶対URLに書き換える。
function toAbsoluteUrls(html, origin) {
  return html
    .replace(/(\b(?:href|src)=")\/(?!\/)/g, `$1${origin}/`)
    .replace(
      /(\bsrcset=")([^"]+)(")/g,
      (_match, prefix, value, suffix) =>
        `${prefix}${value.replace(/(^|,\s*)\/(?!\/)/g, `$1${origin}/`)}${suffix}`,
    );
}

// 見出しやruby、kbd、wbrなどはデフォルトで許可されているので、画像と埋め込みのタグだけを足す。
// spanはRSSでは見た目の役割を果たさず、シンタックスハイライトで大量に入れ子になるため、
// 外して中のテキストだけを残す。
const ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags.filter((tag) => tag !== 'span'),
  'img',
  'picture',
  'source',
  'iframe',
];

// RSSではCSSが効かないので、視覚的に隠したテキストもそのまま表示されてしまう。
// そこで、aria-hidden="true"の装飾（記号やアイコン）を中身ごと取り除き、読み上げ用のテキストのほうを残す。
// exclusiveFilterは許可したタグにしか効かないため、spanも許可した前処理として、本処理の前に行う。
function removeAriaHidden(html) {
  return sanitizeHtml(html, {
    allowedTags: [...ALLOWED_TAGS, 'span'],
    allowedAttributes: false,
    exclusiveFilter: (frame) => frame.attribs['aria-hidden'] === 'true',
  });
}

// RSSのcontent:encodedに入れるため、記事の本文として意味のあるタグと属性だけを残す。
export function sanitize(html) {
  return sanitizeHtml(removeAriaHidden(html), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      // 脚注（GFM）のリンク先が失われないよう、idはすべての要素で残す。
      '*': ['id'],
      img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
      source: ['src', 'srcset', 'sizes', 'type', 'media', 'width', 'height'],
      // 脚注リンクの読み上げ用のラベルと説明（aria-*）も残す。
      a: ['href', 'name', 'target', 'rel', 'aria-label', 'aria-describedby'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'title', 'loading'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com'],
  });
}

// <article>は1ページに1つだけで、コードブロック内の山括弧もエスケープ済みなので、正規表現で安全に取り出せる。
// <header>（タイトル）と<footer>（日付とタグ）は、RSSのtitleやitemの情報と重複するので取り除く。
function extractArticleBody(html) {
  const match = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/);
  if (!match) return '';
  return match[1]
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/g, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/g, '');
}

export function feedIntegration({ title, description }) {
  let site;
  let format = 'directory';

  return {
    name: 'feed',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
        format = config.build.format;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        if (!site) {
          logger.warn('site が未設定のため feed.xml の生成をスキップします');
          return;
        }

        const dataPath = path.join(outDir, DATA_FILENAME);
        if (!fs.existsSync(dataPath)) {
          logger.warn(`${DATA_FILENAME} が見つからないため feed.xml を生成できません`);
          return;
        }

        const origin = new URL(site).origin;
        const entries = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        const items = entries.map((entry) => {
          const pagePath =
            format === 'file'
              ? path.join(outDir, `${entry.slug}.html`)
              : path.join(outDir, entry.slug, 'index.html');

          // 本文が取れなくても、そのitemは配信する。ただし、パスやテンプレートの不具合に気づけるよう、
          // 原因（HTMLがない、<article>を取り出せない）を警告として残す。
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
        fs.writeFileSync(path.join(outDir, 'feed.xml'), xml, 'utf-8');

        fs.rmSync(dataPath, { force: true });

        logger.info(`feed.xml を生成しました（${items.length} 件）`);
      },
    },
  };
}
