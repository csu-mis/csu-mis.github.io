import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../src/data/documents.json' with { type: 'json' };
import {
  fetchDocumentHistory,
  historyPathsFor,
  historyRequestUrl,
  mergeCommits,
  parseCommitMessage,
  parseGitHubCommit,
} from '../src/lib/document-history.ts';

const sha = (n) => n.toString().padStart(40, 'a');

test('中文路徑會編成 GitHub commits API 查詢', () => {
  assert.equal(
    historyRequestUrl('組織章程.md'),
    'https://api.github.com/repos/csu-mis/Association-documents/commits?path=%E7%B5%84%E7%B9%94%E7%AB%A0%E7%A8%8B.md&per_page=100',
  );
});

test('章程會一併查舊檔名，讓更名前後的修訂連在一起', () => {
  assert.deepEqual(historyPathsFor(manifest.find((entry) => entry.id === 'rules')), ['組織章程.md', 'rules.md']);
  assert.deepEqual(historyPathsFor(manifest.find((entry) => entry.id === 'finance')), ['辦法/財務管理辦法.md']);
});

test('commit 訊息去掉 Co-Authored-By，第一行當標題', () => {
  assert.deepEqual(
    parseCommitMessage('feat : 重構組織章程\n\n- 新增辦法\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>'),
    { title: 'feat : 重構組織章程', body: '- 新增辦法' },
  );
});

test('無效的 GitHub commit 不會進入列表', () => {
  assert.equal(parseGitHubCommit({ sha: 'short', commit: { message: 'x', author: { date: '2026-09-17T00:00:00Z' } } }), null);
  assert.equal(parseGitHubCommit({ sha: sha(1), html_url: 'https://example.com/1', commit: { message: '修訂', author: { name: 'Elvis', date: '2026-09-17T00:00:00Z' } } }).title, '修訂');
});

test('相同 SHA 只留一筆，並依時間新到舊排序', () => {
  const older = { sha: sha(1), url: 'https://example.com/1', date: '2026-01-01T00:00:00Z', author: 'A', title: '舊', body: '' };
  const newer = { sha: sha(2), url: 'https://example.com/2', date: '2026-09-17T00:00:00Z', author: 'B', title: '新', body: '' };
  const dup = { ...older, title: '重複' };
  assert.deepEqual(mergeCommits([[older, newer], [dup]]).map(({ sha, title }) => ({ sha, title })), [
    { sha: sha(2), title: '新' },
    { sha: sha(1), title: '舊' },
  ]);
});

test('讀取失敗必須報錯，不把空陣列當成沒有修訂', async () => {
  await assert.rejects(
    fetchDocumentHistory(['組織章程.md'], async () => new Response('failure', { status: 403 })),
    /403/,
  );
});

test('多個路徑的結果會合併，且略過格式不完整的項目', async () => {
  const commits = await fetchDocumentHistory(['組織章程.md', 'rules.md'], async (url) => {
    const path = new URL(url).searchParams.get('path');
    const item = (shaValue, date, extra = {}) => ({
      sha: shaValue,
      html_url: `https://github.com/csu-mis/Association-documents/commit/${shaValue}`,
      commit: { message: extra.message ?? '修訂', author: { name: 'Elvis', date } },
      ...extra.rest,
    });
    if (path === '組織章程.md') {
      return Response.json([item(sha(2), '2026-09-17T00:00:00Z'), { sha: 'bad' }]);
    }
    return Response.json([item(sha(2), '2026-09-17T00:00:00Z'), item(sha(1), '2025-10-19T00:00:00Z')]);
  });
  assert.deepEqual(commits.map(({ sha }) => sha), [sha(2), sha(1)]);
});
