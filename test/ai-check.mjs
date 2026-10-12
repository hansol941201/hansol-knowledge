// Contract/UI tests use explicit doubles. Real model tests: functions/test/live-eval.js.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { root } from './test-path.mjs';
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, resolve));
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const context = await browser.newContext();
  await context.addInitScript(fs.readFileSync(path.join(root, 'test/fake-firebase.js'), 'utf8'));
  await context.addInitScript(() => {
    const docs = new Map(), listeners = new Set();
    const snapshot = key => ({ exists: docs.has(key), data: () => structuredClone(docs.get(key)), metadata: { hasPendingWrites: false } });
    const db = {
      enablePersistence: async () => {},
      doc: key => ({ key, get: async () => snapshot(key), onSnapshot: fn => { listeners.add(fn); queueMicrotask(() => fn(snapshot(key))); return () => listeners.delete(fn); } }),
      runTransaction: async fn => {
        const sets = [], deletes = [];
        const result = await fn({ get: async ref => snapshot(ref.key), set: (ref, value) => sets.push([ref.key, structuredClone(value)]), delete: ref => deletes.push(ref.key) });
        if (window.__FAIL_CLOUD) throw new Error('simulated network failure');
        sets.forEach(([key, value]) => docs.set(key, value)); deletes.forEach(key => docs.delete(key));
        listeners.forEach(fn => fn(snapshot('shared/state'))); return result;
      }
    };
    window.__TEST_DOCS = docs;
    window.firebase.firestore = Object.assign(() => db, { FieldValue: { serverTimestamp: () => Date.now() } });
    window.HANSOL_AUTH.currentUser.getIdToken = async () => 'TEST_TOKEN_NOT_A_REAL_CREDENTIAL';
  });
  await context.route('**gstatic.com/**', route => route.abort());
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://localhost:${server.address().port}`);
  await page.waitForFunction(() => document.querySelector('#syncState')?.dataset.state === 'live');
  const storage = await page.evaluate(async () => {
    const text = '앞쪽 원문😀\n' + '서로 다른 업무의 긴 메모입니다.\n'.repeat(15000) + '마지막 고유 기록';
    const item = createKnowledge('긴 원문 보존', text);
    await saveLocalState();
    const first = await saveCloudState({ verifyIds: [item.id] });
    const root = window.__TEST_DOCS.get('shared/state');
    const read = await HANSOL_CLOUD_STORAGE.read(root);
    const exact = read.knowledge.find(x => x.id === item.id).answer === text;
    item.answer = '수정된 최신 원문'; touch(item); await saveLocalState();
    const edit = await saveCloudState();
    const updated = await HANSOL_CLOUD_STORAGE.read(window.__TEST_DOCS.get('shared/state'));
    item.deleted = true; touch(item); await saveLocalState(); const removed = await saveCloudState();
    const deleted = (await HANSOL_CLOUD_STORAGE.read(window.__TEST_DOCS.get('shared/state'))).knowledge.find(x => x.id === item.id).deleted;
    return { first, version: root.storageVersion, exact, edit, updated: updated.knowledge.find(x => x.id === item.id).answer, removed, deleted };
  });
  assert.ok(storage.first.verified && storage.edit.verified && storage.removed.verified);
  assert.equal(storage.version, 2); assert.ok(storage.exact && storage.deleted); assert.equal(storage.updated, '수정된 최신 원문');
  console.log('PASS large sharded save/read/edit/delete, full text round trip');
  await page.route('**/answerKnowledge', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'answered', format: 'steps', lines: ['**검수 요청**을 선택해 주세요.', '상태를 확인해 주세요.'], citations: [{ title: '테스트 전용 문서', quote: '검수 요청을 선택하고 상태를 확인합니다.' }] }) }));
  await page.fill('#pageSearch', '검수 처리 방법'); await page.click('#askKnowledge');
  await page.waitForSelector('#aiAnswer [data-evidence]');
  assert.equal(await page.locator('#aiAnswer ol li').count(), 2);
  assert.equal(await page.locator('#aiAnswer strong').first().textContent(), '검수 요청');
  assert.ok(await page.evaluate(() => document.querySelector('#aiAnswer').compareDocumentPosition(document.querySelector('#pageGrid')) & Node.DOCUMENT_POSITION_FOLLOWING));
  await page.click('[data-evidence]'); assert.ok(await page.locator('.ai-evidence').isVisible());
  assert.ok((await page.locator('.ai-evidence').textContent()).includes('테스트 전용 문서'));
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'test-results/ai-answer.png'), fullPage: true });
  await page.evaluate(() => { createMemory('새로운 기록'); saveLocalState(); });
  assert.ok((await page.locator('#aiAnswer').textContent()).includes('기록이 변경'));
  assert.equal(await page.locator('#aiAnswer [data-evidence]').count(), 0);
  console.log('PASS answer first, bold text, steps, evidence, and stale answer invalidation');
  await page.unroute('**/answerKnowledge'); await page.route('**/answerKnowledge', route => route.fulfill({ status: 404, contentType: 'text/html', body: 'Not deployed' }));
  await page.press('#pageSearch', 'Enter'); await page.waitForFunction(() => document.querySelector('#aiAnswer').textContent.includes('아직 연결되지'));
  console.log('PASS missing server is explicitly shown, never replaced with a fake answer');
  // Force localStorage quota failure while IndexedDB remains available.
  await page.evaluate(async () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { if (key === 'knowledge-memories') throw new DOMException('quota', 'QuotaExceededError'); return original.call(this, key, value); };
    HANSOL_STORE.writeList('memories', [{ id: 'durable', text: 'IndexedDB 보존 테스트' }]);
    await HANSOL_STORE.flush();
  });
  // Reload without Firebase startup merging test fixtures.
  await page.route('**/bootstrap.js*', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.reload(); await page.evaluate(() => HANSOL_STORE.ready);
  assert.equal(await page.evaluate(() => HANSOL_STORE.readList('memories')[0].id), 'durable');
  console.log('PASS localStorage quota overflow survives reload through IndexedDB');
  assert.deepEqual(errors, []);
  console.log('PASS no browser JavaScript errors');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
