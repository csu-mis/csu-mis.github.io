// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 站台網址集中在 src/data/site.json，這裡為避免循環依賴直接寫死。
// 若之後換網域，兩處都要改。
// 部署在 csu-mis.github.io 這個組織站台，站台位於根路徑，因此不設 base。
// 若日後改成子路徑部署（專案站台或子目錄），在這裡加上 base 即可，
// 站內連結都經由 src/lib/url.ts 的 url() 產生，會自動跟著加前綴。
export default defineConfig({
  site: 'https://csu-mis.github.io',
  trailingSlash: 'ignore',
  i18n: {
    // 目前只啟用 zh-TW；未來要加英文版時，把 'en' 加進 locales 即可。
    defaultLocale: 'zh-TW',
    locales: ['zh-TW'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
