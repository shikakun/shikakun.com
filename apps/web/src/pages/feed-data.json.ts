import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { extractExcerpt } from '../lib/excerpt';

// feed.xml をビルド後に生成するための中間データ。
// Cloudflare アダプタの prerender ランタイムでは Container API が使えず、エンドポイント内で
// MDX をHTMLへ描画できない。そこで、記事のメタデータだけをここで出力し、実際のRSSは
// feed-integration.mjs（astro:build:done）が、このデータとビルド済み記事HTMLを突き合わせて生成する。
// このファイルはビルド後に削除されるため、公開サイトには残らない。
export const GET: APIRoute = async () => {
  const items = (await getCollection('pages'))
    .filter((page) => page.data.listed !== false)
    .sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0))
    .map((page) => ({
      slug: page.id,
      title: page.data.title,
      description: page.data.description ?? extractExcerpt(page.body),
      pubDate: page.data.date?.toISOString() ?? null,
    }));

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
};
