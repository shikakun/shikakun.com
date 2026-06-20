import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export const GET: APIRoute = async (context) => {
  const pages = (await getCollection('pages'))
    .filter((page) => page.data.listed !== false)
    .sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0));

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site ?? 'https://shikakun.com',
    items: pages.map((page) => ({
      title: page.data.title,
      description: page.data.description,
      pubDate: page.data.date,
      link: `/${page.id}/`,
    })),
  });
};
