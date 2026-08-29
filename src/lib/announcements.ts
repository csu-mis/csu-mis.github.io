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
 * 草稿是否納入。預設一律排除，只有 `pnpm dev` 會帶 SHOW_DRAFTS=1 開啟預覽。
 *
 * 不用 import.meta.env.PROD 判斷：它取決於 NODE_ENV，而 GitHub Actions
 * runner 的 NODE_ENV 並不是 production，會讓 PROD 變成 false，
 * 草稿因此被當成 dev 預覽而發佈到線上（實際發生過）。
 * 這裡改成必須明確 opt-in，漏設環境變數時的預設行為是「不發佈草稿」。
 */
const SHOW_DRAFTS = process.env.SHOW_DRAFTS === '1';

/**
 * 取得已發布的公告，置頂優先、再依日期新到舊排序。
 * draft: true 的公告只有在 SHOW_DRAFTS=1 時才會出現。
 */
export async function getPublishedAnnouncements(): Promise<Announcement[]> {
  const all = await getCollection('announcements', ({ data }) =>
    SHOW_DRAFTS ? true : data.draft !== true
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
