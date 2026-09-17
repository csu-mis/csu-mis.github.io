import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDocuments, makeSnapshot, shouldBuild, resolveCommit } from '../scripts/sync-documents.mjs';
const manifest = [{ id: 'rules', title: '組織章程', category: '章程', summary: '章程', sourcePath: '組織章程.md', aliases: ['rules.md'] }, { id: 'finance', title: '財務管理辦法', category: '辦法', summary: '財務', sourcePath: '辦法/財務管理辦法.md' }];
const sha = 'a'.repeat(40);
test('GitHub 舊章程與未推送文件：只選 GitHub 實際存在的檔案', () => {
  const files = selectDocuments(['Readme.md','rules.md'], manifest);
  assert.deepEqual(files.map(({id, sourcePath}) => ({id,sourcePath})), [{id:'rules',sourcePath:'rules.md'}]);
});
test('新檔案推送後加入，章程優先使用新檔名', () => {
  const files = selectDocuments(['rules.md','組織章程.md','辦法/財務管理辦法.md','修訂說明/草案.md'], manifest);
  assert.deepEqual(files.map(x=>x.sourcePath), ['組織章程.md','辦法/財務管理辦法.md']);
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
