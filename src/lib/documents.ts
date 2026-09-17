import { getCollection } from 'astro:content';
import manifest from '../data/documents.json';

export const documentGroups = ['章程', '辦法', '作業規範'] as const;
export async function getDocuments() {
  const entries = await getCollection('documents');
  if (!entries.some((entry) => entry.id === 'rules')) throw new Error('缺少 GitHub 文件快取，請執行 pnpm sync:documents。');
  return entries.filter((entry) => manifest.some(({ id }) => id === entry.id))
    .sort((a, b) => a.data.order - b.data.order);
}

export function documentSource(path: string, commit: string, history = false) {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `https://github.com/csu-mis/Association-documents/${history ? 'commits' : 'blob'}/${commit}/${encoded}`;
}
