import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export const GET: APIRoute = async (context) => {
  const site = context.site ?? new URL('https://shikakun.com');

  const pages = (await getCollection('pages'))
    .filter((page) => page.data.listed !== false)
    .sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0));

  const body = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    '## ページ',
    ...pages.map((page) => {
      const url = new URL(`/${page.id}/`, site).href;
      const description = page.data.description ? `: ${page.data.description}` : '';
      return `- [${page.data.title}](${url})${description}`;
    }),
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
