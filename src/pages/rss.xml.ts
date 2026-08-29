import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedAnnouncements } from '../lib/announcements';
import { site } from '../lib/site';
import { url } from '../lib/url';

export async function GET(context: APIContext) {
  const entries = await getPublishedAnnouncements();

  return rss({
    title: `${site.shortName}公告`,
    description: site.description,
    site: context.site ?? site.url,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      pubDate: entry.data.date,
      link: url(`/announcements/${entry.id}`),
      categories: [entry.data.category, ...entry.data.tags],
      author: entry.data.author,
    })),
    customData: '<language>zh-TW</language>',
  });
}
