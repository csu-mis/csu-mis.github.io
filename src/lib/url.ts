/**
 * 站台部署在 GitHub Pages 的子路徑（csu-mis.github.io/website）底下，
 * 所有指向站內的絕對路徑都必須帶上 base，否則部署後會 404。
 * base 只定義在 astro.config.mjs 一處；日後改成根網域部署時，
 * 把該處的 base 拿掉即可，這裡與所有呼叫端會自動跟著變。
 */
const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** 站內路徑 → 帶 base 的路徑，例：url('/officers') → '/website/officers' */
export function url(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${base}${path}` || '/';
}
