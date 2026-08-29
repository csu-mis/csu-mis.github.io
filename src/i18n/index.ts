import zhTW from './zh-TW.json';

export const defaultLang = 'zh-TW' as const;

/**
 * 目前只啟用 zh-TW。要新增語言時：
 * 1. 複製 zh-TW.json 為 en.json 並翻譯
 * 2. 在下方 languages 加上 en: enJson
 * 3. astro.config.mjs 的 i18n.locales 加上 'en'
 */
export const languages = {
  'zh-TW': zhTW,
} as const;

export type Lang = keyof typeof languages;
export type Dict = typeof zhTW;

/** 從網址推斷語言，找不到就用預設語言 */
export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang && maybeLang in languages) return maybeLang as Lang;
  return defaultLang;
}

/** 取得該語言的字串字典 */
export function useTranslations(lang: Lang = defaultLang): Dict {
  return languages[lang] ?? languages[defaultLang];
}
