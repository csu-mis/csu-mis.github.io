import { readFile, writeFile, appendFile, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repository = 'csu-mis/Association-documents';
const api = `https://api.github.com/repos/${repository}`;
const root = new URL('../', import.meta.url);
const manifestURL = new URL('src/data/documents.json', root);

async function githubJSON(path, request = fetch) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await request(`${api}/${path}`, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`GitHub 文件讀取失敗（HTTP ${response.status}）：${path}`);
  return response.json();
}

export async function resolveCommit(request = fetch) {
  const commit = await githubJSON('commits/main', request);
  if (!/^[a-f0-9]{40}$/.test(commit.sha)) throw new Error('GitHub 回傳無效版本');
  return commit.sha;
}

export function selectDocuments(paths, manifest) {
  const files = manifest.flatMap((entry) => {
    const sourcePath = [entry.sourcePath, ...(entry.aliases ?? [])].find((path) => paths.includes(path));
    return sourcePath ? [{ ...entry, sourcePath }] : [];
  });
  if (!files.some(({ id }) => id === 'rules')) throw new Error('GitHub 文件庫缺少組織章程，停止同步');
  return files;
}

export function makeSnapshot(entry, source, sourceCommit, order) {
  const heading = source.match(/^# (.+)\r?\n/);
  if (!heading) throw new Error(`${entry.sourcePath} 缺少文件標題`);
  const { id, aliases, ...metadata } = entry;
  const data = { ...metadata, fullTitle: heading[1], order, sourceCommit, sourceHash: createHash('sha256').update(source).digest('hex') };
  const frontmatter = Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
  return `---\n${frontmatter}\n---\n${source.slice(heading[0].length)}`;
}

export function shouldBuild(deployed, sourceCommit, websiteCommit) {
  return deployed?.sourceCommit !== sourceCommit || deployed?.websiteCommit !== websiteCommit;
}

async function main() {
  if (process.argv.slice(2).some((arg) => arg !== '--check')) throw new Error('只接受 --check；文件唯一來源為 GitHub，不接受本機路徑');
  const sourceCommit = process.env.DOCUMENTS_SHA || await resolveCommit();
  if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('DOCUMENTS_SHA 必須是完整 Git commit SHA');
  const websiteCommit = process.env.GITHUB_SHA || 'local';
  if (process.argv.includes('--check')) {
    let deployed = null;
    try {
      const response = await fetch('https://csu-mis.github.io/document-version.json', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (response.ok) deployed = await response.json();
    } catch { /* 無法確認線上版本時重建，不略過更新。 */ }
    const changed = shouldBuild(deployed, sourceCommit, websiteCommit);
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\nsource_sha=${sourceCommit}\n`);
    console.log(JSON.stringify({ changed, sourceCommit, websiteCommit }));
    return;
  }
  const manifest = JSON.parse(await readFile(manifestURL, 'utf8'));
  const tree = await githubJSON(`git/trees/${sourceCommit}?recursive=1`);
  if (tree.truncated) throw new Error('GitHub 文件樹不完整，停止同步');
  const blobs = tree.tree.filter((item) => item.type === 'blob');
  const selected = selectDocuments(blobs.map((item) => item.path), manifest);
  // 全部以同一個 commit 的 blob 讀取；任何下載失敗都不替換原快取。
  const snapshots = await Promise.all(selected.map(async (entry, order) => {
    if (!/^[a-z0-9-]+$/.test(entry.id)) throw new Error(`無效文件代稱：${entry.id}`);
    const blob = await githubJSON(`git/blobs/${blobs.find((item) => item.path === entry.sourcePath).sha}`);
    if (blob.encoding !== 'base64') throw new Error(`無法解碼文件：${entry.sourcePath}`);
    return { id: entry.id, content: makeSnapshot(entry, Buffer.from(blob.content, 'base64').toString('utf8'), sourceCommit, order) };
  }));
  const contentRoot = new URL('src/content/', root);
  await mkdir(contentRoot, { recursive: true });
  const stage = await mkdtemp(fileURLToPath(new URL('.documents-', contentRoot)));
  const destination = fileURLToPath(new URL('documents/', contentRoot));
  const backup = `${stage}-previous`;
  let backedUp = false;
  try {
    for (const snapshot of snapshots) await writeFile(`${stage}/${snapshot.id}.md`, snapshot.content);
    try { await rename(destination, backup); backedUp = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { await rename(stage, destination); } catch (error) { if (backedUp) await rename(backup, destination); throw error; }
    await writeFile(new URL('public/document-version.json', root), JSON.stringify({ repository, sourceCommit, websiteCommit }, null, 2) + '\n');
  } finally {
    await rm(stage, { recursive: true, force: true });
    await rm(backup, { recursive: true, force: true });
  }
  console.log(`已從 GitHub ${sourceCommit.slice(0, 12)} 同步 ${snapshots.length} 份文件。`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
