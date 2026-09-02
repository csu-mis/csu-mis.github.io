import siteData from '../data/site.json';
import homeData from '../data/home.json';
import aboutData from '../data/about.json';
import calendarData from '../data/calendar.json';

export const site = siteData;
export const home = homeData;
export const about = aboutData;
export const calendar = calendarData;

export const currentYear = new Date().getFullYear();

/** 產生完整標題：頁名 ｜ 系學會 */
export function pageTitle(title?: string): string {
  return title ? `${title}｜${site.shortName}` : `${site.name}`;
}
