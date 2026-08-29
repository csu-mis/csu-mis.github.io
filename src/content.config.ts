import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

/**
 * 公告：直接在 src/content/announcements/ 放 .md 檔即可，
 * 檔名會成為網址（例如 2026-09-01-welcome.md -> /announcements/2026-09-01-welcome）。
 * frontmatter 欄位不符會在 build 階段直接報錯，不會默默上線。
 */
const announcements = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/announcements' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.enum(['活動', '課務', '招募', '公告', '資源']),
    summary: z.string().max(160),
    author: z.string().default('資管系學會'),
    tags: z.array(z.string()).default([]),
    pinned: z.boolean().default(false),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
  }),
});

/** 單一幹部的欄位定義（各屆共用） */
const officerSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  department: z.string(),
  /** 班級，例如「資管三甲」；留空就不顯示 */
  grade: z.string().default(''),
  bio: z.string().default(''),
  /** Instagram：填帳號（@csumis_sa）或完整網址都可以 */
  instagram: z.string().default(''),
  /**
   * Gravatar 用的信箱（不會顯示在頁面上）。
   * 也可以改填該信箱的 SHA-256 雜湊，避免明碼信箱進入公開 repo。
   */
  email: z
    .union([z.email(), z.string().regex(/^[a-f0-9]{64}$/), z.literal('')])
    .default(''),
  /** 頭貼路徑，例如 /images/officers/25/president.jpg */
  photo: z.string().default(''),
  /** 該屆的實習／觀察幹部，卡片上會標示 */
  intern: z.boolean().default(false),
  order: z.number().default(99),
});

/**
 * 幹部名單：一屆一個檔案，放在 src/data/officers/<屆數>.json（檔名即網址片段）。
 * 新增一屆只要複製一個檔案改內容，不必動程式；現任屆數由 site.json 的 term 決定。
 */
const officerTerms = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/officers' }),
  schema: z.object({
    term: z.number().int().positive(),
    /** 任期年份，例如 2026–2027；顯示在屆數切換器與頁首 */
    years: z.string().default(''),
    /** 該屆的一句話介紹，顯示在名單上方 */
    summary: z.string().default(''),
    /**
     * 只有當該屆部門與 departments.json 不同時才需要填：
     * 陣列順序即顯示順序，未列出的部門會被歸到「其他」。
     */
    departments: z.array(z.string()).optional(),
    members: z.array(officerSchema).default([]),
  }),
});

/** 部門分組與排序：編輯 src/data/departments.json */
const departments = defineCollection({
  loader: file('./src/data/departments.json', {
    parser: (text) =>
      Object.fromEntries(
        (JSON.parse(text) as { name: string }[]).map((d) => [d.name, d])
      ),
  }),
  schema: z.object({
    name: z.string(),
    description: z.string().default(''),
    order: z.number().default(99),
  }),
});

export const collections = { announcements, officerTerms, departments };
