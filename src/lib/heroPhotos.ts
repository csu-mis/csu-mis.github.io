import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { home } from './site';

/**
 * 首頁 hero 輪播照片。清單與圖說在 src/data/home.json 的 heroPhotos，
 * 圖檔放在 src/assets/hero/，build 時由 astro:assets 轉成 AVIF／WebP 並產生多種寬度。
 */

// 照片框最寬約 514px（container 1140px 扣掉 padding 與欄距後的一半），2x 螢幕約需 1040px
const WIDTHS = [520, 780, 1040, 1280];
export const HERO_PHOTO_SIZES = '(min-width: 1140px) 514px, 45vw';

const files = import.meta.glob<ImageMetadata>('../assets/hero/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

export interface HeroPhoto {
  alt: string;
  caption: string;
  avif: string;
  webp: string;
  fallback: string;
  width: number;
  height: number;
}

export async function getHeroPhotos(): Promise<HeroPhoto[]> {
  return Promise.all(
    home.heroPhotos.map(async ({ file, alt, caption }) => {
      const src = files[`../assets/hero/${file}`];
      if (!src) {
        throw new Error(`home.json 的 heroPhotos 找不到圖檔：src/assets/hero/${file}`);
      }

      const [avif, webp, fallback] = await Promise.all([
        getImage({ src, format: 'avif', widths: WIDTHS }),
        getImage({ src, format: 'webp', widths: WIDTHS }),
        getImage({ src, format: 'jpg', width: 1040 }),
      ]);

      return {
        alt,
        caption,
        avif: avif.srcSet.attribute,
        webp: webp.srcSet.attribute,
        fallback: fallback.src,
        width: src.width,
        height: src.height,
      };
    })
  );
}
