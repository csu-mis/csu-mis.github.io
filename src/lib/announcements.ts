import { getCollection, type CollectionEntry } from 'astro:content';

export type Announcement = CollectionEntry<'announcements'>;

/** 公告分類的固定顯示順序（新增分類時，也要更新 content.config.ts 的 enum） */
export const CATEGORIES = ['活動', '課務', '招募', '公告', '資源'] as const;
export type Category = (typeof CATEGORIES)[number];

/** 分類對應的網址片段，避免中文出現在路徑中 */
export const CATEGORY_SLUGS: Record<Category, string> = {
  活動: 'events',
  課務: 'academics',
  招募: 'recruiting',
  公告: 'notices',
  資源: 'resources',
};

export function slugToCategory(slug: string): Category | undefined {
  return (Object.keys(CATEGORY_SLUGS) as Category[]).find(
    (c) => CATEGORY_SLUGS[c] === slug
  );
}

/**
 * 取得已發布的公告，置頂優先、再依日期新到舊排序。
 * draft: true 的公告在正式 build 時會被排除，但 dev 模式仍可預覽。
 */
export async function getPublishedAnnouncements(): Promise<Announcement[]> {
  const all = await getCollection('announcements', ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true
  );

  return all.sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    return b.data.date.getTime() - a.data.date.getTime();
  });
}

/** 依日期新到舊排序（不理會置頂），用於上一則／下一則導覽 */
export async function getChronologicalAnnouncements(): Promise<Announcement[]> {
  const all = await getPublishedAnnouncements();
  return [...all].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** <time datetime> 用的 ISO 日期（YYYY-MM-DD） */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
