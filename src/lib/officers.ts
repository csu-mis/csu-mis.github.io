import { createHash } from 'node:crypto';
import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from './site';
import { url } from './url';

export type OfficerTerm = CollectionEntry<'officerTerms'>['data'];
export type Officer = OfficerTerm['members'][number];

/** 現任屆數，單一來源在 site.json；換屆時只要改那裡 */
export const CURRENT_TERM = site.term;

/** 「第 N 屆」的顯示字串 */
export function termLabel(term: number): string {
  return `第 ${term} 屆`;
}

/**
 * 屆數對應的網址。現任屆固定用 /officers，歷屆才有 /officers/<term>，
 * 避免同一份名單出現在兩個網址（重複內容）。
 */
export function termPath(term: number): string {
  return url(term === CURRENT_TERM ? '/officers' : `/officers/${term}`);
}

/** 全部屆數，由新到舊排序 */
export async function getTerms(): Promise<OfficerTerm[]> {
  const entries = await getCollection('officerTerms');
  return entries.map((entry) => entry.data).sort((a, b) => b.term - a.term);
}

/** 取單一屆；找不到回傳 undefined（呼叫端負責 404） */
export async function getTerm(term: number): Promise<OfficerTerm | undefined> {
  return (await getTerms()).find((entry) => entry.term === term);
}

export interface DepartmentGroup {
  name: string;
  description: string;
  members: Officer[];
}

/**
 * 依部門分組並排序。順序優先用該屆自訂的 departments，
 * 沒寫就用 departments.json 的全站順序；兩者都沒列到的部門歸入「其他」。
 */
export async function getDepartmentGroups(data: OfficerTerm): Promise<DepartmentGroup[]> {
  const registry = new Map(
    (await getCollection('departments')).map((entry) => [entry.data.name, entry.data])
  );

  const order =
    data.departments ??
    [...registry.values()].sort((a, b) => a.order - b.order).map((dept) => dept.name);

  const byOrder = (a: Officer, b: Officer) => a.order - b.order;

  const groups: DepartmentGroup[] = order
    .map((name) => ({
      name,
      description: registry.get(name)?.description ?? '',
      members: data.members.filter((member) => member.department === name).sort(byOrder),
    }))
    .filter((group) => group.members.length > 0);

  const known = new Set(order);
  const ungrouped = data.members.filter((member) => !known.has(member.department)).sort(byOrder);
  if (ungrouped.length > 0) {
    groups.push({ name: '其他', description: '', members: ungrouped });
  }

  return groups;
}

/** 相鄰屆數：older 為前一屆（數字較小），newer 為下一屆 */
export function getAdjacentTerms(terms: OfficerTerm[], term: number) {
  const sorted = [...terms].sort((a, b) => b.term - a.term);
  const index = sorted.findIndex((entry) => entry.term === term);
  return {
    older: index >= 0 ? sorted[index + 1] : undefined,
    newer: index > 0 ? sorted[index - 1] : undefined,
  };
}

/**
 * 頭貼網址：本機圖片優先，其次用 email 去要 Gravatar。
 * 沒註冊 Gravatar 的人會拿到灰色人形剪影（d=mp），不會破圖。
 * email 欄位也接受已經算好的 SHA-256 雜湊，這樣就不必把明碼信箱放進公開 repo。
 * 雜湊在 build 時算好寫進 HTML，前端不需要任何 JS。
 */
export function avatarUrl(officer: Officer, size = 128): string {
  if (officer.photo) return url(officer.photo);
  if (!officer.email) return '';

  const value = officer.email.trim().toLowerCase();
  const hash = /^[a-f0-9]{64}$/.test(value)
    ? value
    : createHash('sha256').update(value).digest('hex');

  return `https://gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}
