export const DOCUMENT_REPO = 'csu-mis/Association-documents';

export type HistoryCommit = {
  sha: string;
  url: string;
  date: string;
  author: string;
  title: string;
  body: string;
};

const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Taipei',
});

export function formatHistoryDate(date: string) {
  return dateFormatter.format(new Date(date));
}

export function historyPathsFor(entry: { sourcePath: string; aliases?: string[] }) {
  return [...new Set([entry.sourcePath, ...(entry.aliases ?? [])])];
}

export function historyRequestUrl(path: string) {
  const url = new URL(`https://api.github.com/repos/${DOCUMENT_REPO}/commits`);
  url.searchParams.set('path', path);
  url.searchParams.set('per_page', '100');
  return url.toString();
}

export function parseCommitMessage(message: string) {
  const cleaned = message.replace(/(?:\r?\n)+Co-Authored-By:.*$/gim, '').trim();
  const [title = '', ...rest] = cleaned.split(/\r?\n/);
  return { title: title.trim(), body: rest.join('\n').replace(/^\n+/, '').trim() };
}

export function parseGitHubCommit(raw: unknown): HistoryCommit | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as {
    sha?: unknown;
    html_url?: unknown;
    commit?: { message?: unknown; author?: { name?: unknown; date?: unknown } };
  };
  const sha = typeof item.sha === 'string' && /^[a-f0-9]{40}$/.test(item.sha) ? item.sha : '';
  const url = typeof item.html_url === 'string' ? item.html_url : '';
  const message = typeof item.commit?.message === 'string' ? item.commit.message : '';
  const date = typeof item.commit?.author?.date === 'string' ? item.commit.author.date : '';
  const author = typeof item.commit?.author?.name === 'string' ? item.commit.author.name.trim() : '';
  if (!sha || !url || !message || !date) return null;
  const { title, body } = parseCommitMessage(message);
  if (!title) return null;
  return { sha, url, date, author, title, body };
}

export function mergeCommits(groups: HistoryCommit[][]) {
  const bySha = new Map<string, HistoryCommit>();
  for (const group of groups) {
    for (const commit of group) {
      if (!bySha.has(commit.sha)) bySha.set(commit.sha, commit);
    }
  }
  return [...bySha.values()].sort((a, b) => b.date.localeCompare(a.date) || a.sha.localeCompare(b.sha));
}

export async function fetchDocumentHistory(paths: string[], request: typeof fetch = fetch) {
  const unique = [...new Set(paths.map((path) => path.trim()).filter(Boolean))];
  if (unique.length === 0) return [];
  const groups = await Promise.all(unique.map(async (path) => {
    const response = await request(historyRequestUrl(path), {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`GitHub 修訂紀錄讀取失敗（HTTP ${response.status}）`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error('GitHub 修訂紀錄格式無效');
    return payload.flatMap((item) => {
      const commit = parseGitHubCommit(item);
      return commit ? [commit] : [];
    });
  }));
  return mergeCommits(groups);
}
