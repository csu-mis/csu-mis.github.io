import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { selectDocuments, makeSnapshot, shouldBuild, resolveCommit } from '../scripts/sync-documents.mjs';
const manifest = [{ id: 'rules', title: '組織章程', category: '章程', summary: '章程', sourcePath: '組織章程.md', aliases: ['rules.md'] }, { id: 'finance', title: '財務管理辦法', category: '辦法', summary: '財務', sourcePath: '辦法/財務管理辦法.md' }];
const sha = 'a'.repeat(40);
test('GitHub 舊章程與未推送文件：只選 GitHub 實際存在的檔案', () => {
  const files = selectDocuments(['Readme.md','rules.md'], manifest);
  assert.deepEqual(files.map(({id, sourcePath}) => ({id,sourcePath})), [{id:'rules',sourcePath:'rules.md'}]);
});
test('GitHub 有的辦法與作業規範都會部署，README 與修訂說明除外', () => {
  const files = selectDocuments(['rules.md','組織章程.md','辦法/財務管理辦法.md','作業規範/社課辦理流程.md','修訂說明/草案.md','Readme.md'], manifest);
  assert.deepEqual(files.map((entry) => entry.sourcePath), ['組織章程.md','辦法/財務管理辦法.md','作業規範/社課辦理流程.md']);
  assert.equal(files.find((entry) => entry.sourcePath === '作業規範/社課辦理流程.md').id, `d-${createHash('sha256').update('作業規範/社課辦理流程.md').digest('hex').slice(0, 12)}`);
});
test('清單只覆寫顯示資料，不擋 GitHub 既有文件', () => {
  const files = selectDocuments(['組織章程.md','作業規範/社課辦理流程.md'], []);
  assert.equal(files.find((entry) => entry.category === '章程').id, 'rules');
  assert.ok(files.some((entry) => entry.sourcePath === '作業規範/社課辦理流程.md'));
});
test('沒有章程時停止，避免部署空的組織章程頁', () => {
  assert.throws(()=>selectDocuments(['Readme.md'],manifest), /章程/);
});
test('原文不含有效標題時拒絕匯入', () => {
  assert.throws(()=>makeSnapshot(manifest[0], '沒有標題', sha, 0), /標題/);
});
test('正文完整保留、來源固定到同一個 Git commit', () => {
  const source = '# 正式標題\n\n## 第一章\n\n**第 1 條**\n正文。\n';
  const snapshot=makeSnapshot(manifest[0], source, sha, 0);
  assert.equal(snapshot.split('---\n', 3)[2], source.slice(source.indexOf('\n')+1));
  assert.match(snapshot, new RegExp(`sourceCommit: "${sha}"`));
});
test('只有文件版本與網站版本都一致時略過部署', () => {
  assert.equal(shouldBuild({ sourceCommit:sha, websiteCommit:'web' },sha,'web'),false);
  assert.equal(shouldBuild({ sourceCommit:'old', websiteCommit:'web' },sha,'web'),true);
  assert.equal(shouldBuild(null,sha,'web'),true);
});
test('GitHub API 失敗必須報錯，不使用本機快照', async () => {
  await assert.rejects(resolveCommit(async ()=>new Response('failure',{status:503})), /503/);
});
