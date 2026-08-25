// 팝업 ↔ 웹사이트 실시간 연동 점검. 실행: node test/sync-check.mjs
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;

const stub = fs.readFileSync(path.join(root, 'test', 'fake-firebase.js'), 'utf8');
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); };

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(stub);
await context.route('**gstatic.com/**', route => route.abort());

const open = async (query = '') => {
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('  [console]', m.text()); });
  await page.goto(`${base}/index.html${query}`);
  await page.waitForFunction(() => document.querySelector('#syncState')?.dataset.state === 'live', null, { timeout: 10000 });
  return page;
};

const send = async (page, text) => {
  await page.fill('#input', text);
  await page.press('#input', 'Enter');
};
const bubbles = (page) => page.$$eval('#messages .row.answer .bubble', nodes => nodes.map(n => n.textContent));

// 웹사이트 탭을 먼저 열어 두고(새로고침 없이 반영되는지 보기 위해) 팝업 탭을 연다.
const site = await open('');
const popup = await open('?overlay=1');
await popup.click('#orb');

const TODO_TEXT = '천민호부사장 600. 택배 확인하기';
const MEMO_TEXT = '자오건설 PDF 나중에 협약서 확인해보기';

await send(popup, `할일 ${TODO_TEXT}`);
await popup.waitForFunction(() => [...document.querySelectorAll('#messages .bubble')].some(b => b.textContent.includes('✓ 할 일 저장 및 연동 완료')), null, { timeout: 10000 }).catch(() => {});
let seen = await bubbles(popup);
check('팝업: "할일 …" → ✓ 할 일 저장 및 연동 완료', seen.some(t => t.includes('✓ 할 일 저장 및 연동 완료')), seen.at(-1)?.split('\n')[0]);

await send(popup, `기록 ${MEMO_TEXT}`);
await popup.waitForFunction(() => [...document.querySelectorAll('#messages .bubble')].some(b => b.textContent.includes('✓ 기록 저장 및 연동 완료')), null, { timeout: 10000 }).catch(() => {});
seen = await bubbles(popup);
check('팝업: "기록 …" → ✓ 기록 저장 및 연동 완료', seen.some(t => t.includes('✓ 기록 저장 및 연동 완료')), seen.at(-1)?.split('\n')[0]);

// 새로고침 없이 웹사이트 탭에 나타나는지
await site.waitForFunction(t => document.querySelector('#todayPanel')?.textContent.includes(t), TODO_TEXT, { timeout: 10000 }).catch(() => {});
const todoPanel = await site.textContent('#todayPanel');
check('웹사이트(새로고침 없음): 할 일 목록에 표시', todoPanel.includes(TODO_TEXT));
const todayKey = new Date().toISOString().slice(0, 10);
check('웹사이트: 할 일에 날짜 표시', todoPanel.includes(todayKey), todayKey);
check('웹사이트: 할 일에 완료 여부 표시', todoPanel.includes('진행중'));

await site.click('#memoryToggle');
await site.waitForFunction(t => document.querySelector('#memoryPanel')?.textContent.includes(t), MEMO_TEXT, { timeout: 10000 }).catch(() => {});
const memoryPanel = await site.textContent('#memoryPanel');
check('웹사이트(새로고침 없음): 기억 저장소에 표시', memoryPanel.includes(MEMO_TEXT));
check('웹사이트: 기억에 저장 날짜·시간 표시', /(오늘|\d{4}\.\d{2}\.\d{2}) (오전|오후) \d{1,2}:\d{2}/.test(memoryPanel), memoryPanel.trim().slice(0, 60));
await site.click('#memoryClose');

// 상단 통합 검색
const search = async (page, query) => {
  await page.fill('#pageSearch', query);
  await page.press('#pageSearch', 'Enter');
  await page.waitForTimeout(200);
  return page.textContent('#pageGrid');
};
const hitA = await search(site, '천민호');
check('통합 검색: "천민호" → 할 일 결과', hitA.includes(TODO_TEXT) && hitA.includes('할 일'));
const hitB = await search(site, '자오건설');
check('통합 검색: "자오건설" → 기억 결과', hitB.includes(MEMO_TEXT) && hitB.includes('기억'));

// 통합 검색이 지식·연락처·협력업체·계정까지 덮는지
await site.click('#accountAdd');
await site.fill('#accountService', '나라장터');
await site.fill('#accountId', 'hansol-test');
await site.fill('#accountPassword', 'pw-test-1234');
await site.click('#vaultForm button[type="submit"]');
await site.waitForTimeout(400);
const partnerName = await site.evaluate(() => (window.PARTNERS || [])[0]?.name || '');
for (const [label, query, expect] of [
  ['지식', '시방서', '시방서 문의'],
  ['연락처', '심혜진', '심혜진'],
  ['협력업체', partnerName, partnerName],
  ['계정', '나라장터', 'hansol-test']
]) {
  const found = query ? await search(site, query) : '';
  check(`통합 검색: ${label} 검색`, Boolean(query) && found.includes(expect), query);
}
await search(site, '');

// 완료 여부 토글이 검색 결과에서도 반영되는지
await site.click('#pageGrid [data-todo-toggle]').catch(() => {});
const hitC = await search(site, '천민호');
check('통합 검색 결과에서 완료 표시 전환', hitC.includes('완료'));
await site.click('#pageGrid [data-todo-toggle]').catch(() => {});
await search(site, '');

// 오프라인 → 로컬 우선 저장 → 재연결 시 자동 업로드
await popup.evaluate(() => { window.__FAKE_OFFLINE = true; });
await site.evaluate(() => { window.__FAKE_OFFLINE = true; });
await send(popup, '할일 오프라인 확인 항목');
await popup.waitForFunction(() => [...document.querySelectorAll('#messages .bubble')].some(b => b.textContent.includes('오프라인 보관')), null, { timeout: 10000 }).catch(() => {});
seen = await bubbles(popup);
check('오프라인: 로컬 저장 후 대기 안내', seen.some(t => t.includes('오프라인 보관')));
const storedOffline = await popup.evaluate(() => JSON.parse(localStorage.getItem('knowledge-todos') || '[]').some(t => t.text === '오프라인 확인 항목'));
check('오프라인: 로컬(localStorage)에 먼저 저장', storedOffline);
const notUploaded = await site.evaluate(() => !JSON.parse(localStorage.getItem('fake-firestore-shared-state') || '{}').todos?.some(t => t.text === '오프라인 확인 항목'));
check('오프라인: 서버에는 아직 올라가지 않음', notUploaded);

await popup.evaluate(() => { window.__FAKE_OFFLINE = false; window.dispatchEvent(new Event('online')); });
await site.evaluate(() => { window.__FAKE_OFFLINE = false; });
await popup.waitForFunction(() => document.querySelector('#syncState')?.dataset.state === 'live', null, { timeout: 20000 }).catch(() => {});
const uploaded = await popup.evaluate(() => JSON.parse(localStorage.getItem('fake-firestore-shared-state') || '{}').todos?.some(t => t.text === '오프라인 확인 항목'));
check('재연결: 밀린 항목 자동 업로드', Boolean(uploaded));

// ID 기준 병합 — 양쪽에서 각각 저장해도 서로 지우지 않는다
await site.click('#orb');
await send(site, '기록 사이트에서 저장한 기억');
await send(popup, '기록 팝업에서 저장한 기억');
await popup.waitForTimeout(1500);
const both = await popup.evaluate(() => {
  const cloud = JSON.parse(localStorage.getItem('fake-firestore-shared-state') || '{}');
  return {
    site: cloud.memories?.some(m => m.text === '사이트에서 저장한 기억'),
    popup: cloud.memories?.some(m => m.text === '팝업에서 저장한 기억'),
    original: cloud.memories?.some(m => m.text === '자오건설 PDF 나중에 협약서 확인해보기')
  };
});
check('병합: 동시에 저장해도 서로 덮어쓰지 않음', both.site && both.popup && both.original, JSON.stringify(both));

// 명령어 변형: “할 일”(띄어쓰기), “기억”, 그리고 명령어 없는 일반 문장
await send(popup, '할 일 띄어쓰기 명령 확인');
await popup.waitForTimeout(900);
check('"할 일 …"(띄어쓰기)도 할 일로 저장', await popup.evaluate(() => todos.some(t => t.text === '띄어쓰기 명령 확인' && !t.deleted)));
await send(popup, '기억 기억 명령 확인');
await popup.waitForTimeout(900);
check('"기억 …"도 기억 저장소로 저장', await popup.evaluate(() => memories.some(m => m.text === '기억 명령 확인' && !m.deleted)));
await send(popup, '명령어 없는 그냥 문장 하나');
await popup.waitForTimeout(900);
check('명령어 없는 일반 문장 → 기억 저장소 자동 저장', await popup.evaluate(() => memories.some(m => m.text === '명령어 없는 그냥 문장 하나' && !m.deleted)));

// 시드 지식은 새 브라우저에서 열어도 ID가 같아 중복되지 않아야 한다
const fresh = await browser.newContext();
await fresh.route('**gstatic.com/**', route => route.abort());
// 대역 stub 이 문서를 읽기 전에 공유 문서를 먼저 심어 둔다(초기화 순서 주의).
await fresh.addInitScript(([key, data]) => localStorage.setItem(key, data), ['fake-firestore-shared-state', await popup.evaluate(() => localStorage.getItem('fake-firestore-shared-state'))]);
await fresh.addInitScript(stub);
const clean = await fresh.newPage();
await clean.goto(`${base}/index.html`);
await clean.waitForFunction(() => document.querySelector('#syncState')?.dataset.state === 'live', null, { timeout: 10000 }).catch(() => {});
await clean.waitForTimeout(800);
const dupes = await clean.evaluate(() => {
  const seen = {};
  for (const item of knowledge.filter(x => !x.deleted)) seen[item.title] = (seen[item.title] || 0) + 1;
  return Object.entries(seen).filter(([, n]) => n > 1);
});
check('새 브라우저에서 열어도 기본 지식이 중복되지 않음', dupes.length === 0, JSON.stringify(dupes));
check('새 브라우저에도 저장한 할 일/기억이 내려옴', await clean.evaluate(([todoText, memoText]) => todos.some(t => t.text === todoText) && memories.some(m => m.text === memoText), [TODO_TEXT, MEMO_TEXT]));
await fresh.close();

// 기억 저장소 창 크기 · 스크롤 · 날짜 표기
await site.click('#memoryToggle');
await site.waitForTimeout(400);
const box = await site.evaluate(() => {
  const modal = document.querySelector('.memory-library-box');
  const panel = document.querySelector('#memoryPanel');
  const rect = modal.getBoundingClientRect();
  const style = getComputedStyle(panel);
  return {
    widthRatio: rect.width / window.innerWidth,
    heightRatio: rect.height / window.innerHeight,
    width: rect.width,
    viewport: window.innerWidth,
    panelScrolls: style.overflowY,
    modalScrolls: getComputedStyle(modal).overflowY,
    fitsViewport: rect.bottom <= window.innerHeight + 1
  };
});
check('기억 저장소: 가로 약 70% 사용', box.widthRatio >= 0.68 && box.widthRatio <= 0.96, `${Math.round(box.widthRatio * 100)}%`);
check('기억 저장소: 세로 약 80% 사용', box.heightRatio >= 0.78 && box.heightRatio <= 0.9, `${Math.round(box.heightRatio * 100)}%`);
check('기억 저장소: 최대 너비 1000px 이상 확보', box.width >= Math.min(1000, box.viewport * 0.95) - 1, `${Math.round(box.width)}px`);
check('기억 저장소: 목록 영역만 스크롤', box.panelScrolls === 'auto' && box.modalScrolls !== 'auto' && box.fitsViewport);

const stampText = await site.$eval('.memory-item time', node => node.textContent);
check('기록 카드: 오늘 저장분은 "오늘 오후 h:mm"', /^오늘 (오전|오후) \d{1,2}:\d{2}$/.test(stampText), stampText);
const stampStyle = await site.$eval('.memory-item time', node => {
  const s = getComputedStyle(node);
  const p = getComputedStyle(node.previousElementSibling);
  return { weight: Number(s.fontWeight), size: parseFloat(s.fontSize), gap: parseFloat(s.marginTop) + parseFloat(s.paddingTop), clipped: p.textOverflow === 'ellipsis' || p.webkitLineClamp !== 'none' };
});
check('기록 카드: 날짜가 진하고 선명함', stampStyle.weight >= 700 && stampStyle.size >= 11, JSON.stringify(stampStyle));
check('기록 카드: 내용과 날짜 사이 간격 확보', stampStyle.gap >= 16, `${stampStyle.gap}px`);
check('기록 카드: 내용이 잘리지 않음', stampStyle.clipped === false);

// 지난 날짜 기록은 "2026.08.25 오후 3:25" 형식, 그리고 최신순 정렬
await site.evaluate(() => {
  const past = new Date(); past.setDate(past.getDate() - 3); past.setHours(15, 25, 0, 0);
  memories.push({ id: 'past-test', text: '지난 기록 표기 확인', savedAt: past.getTime(), updatedAt: past.getTime() });
  saveMemories(); renderMemories();
});
await site.waitForTimeout(200);
const stamps = await site.$$eval('.memory-item time', nodes => nodes.map(n => n.textContent));
check('기록 카드: 지난 기록은 "YYYY.MM.DD 오후 h:mm"', stamps.some(t => /^\d{4}\.\d{2}\.\d{2} 오후 3:25$/.test(t)), stamps.join(' | '));
const order = await site.evaluate(() => [...document.querySelectorAll('.memory-item')].map(node => {
  const id = node.dataset.memoryId;
  const memory = memories.find(m => m.id === id);
  return memory ? (memory.savedAt || memory.updatedAt || 0) : 0;
}));
check('기록 목록: 최신순 정렬', order.every((value, index) => index === 0 || order[index - 1] >= value), order.join(' > '));
await site.evaluate(() => { memories = memories.filter(m => m.id !== 'past-test'); saveMemories(); renderMemories(); });

// 모바일 폭에서는 95% 사용
await site.setViewportSize({ width: 420, height: 780 });
await site.waitForTimeout(300);
const mobile = await site.evaluate(() => {
  const rect = document.querySelector('.memory-library-box').getBoundingClientRect();
  return rect.width / window.innerWidth;
});
check('기억 저장소: 모바일에서 가로 95%', mobile >= 0.92 && mobile <= 0.98, `${Math.round(mobile * 100)}%`);
await site.setViewportSize({ width: 1280, height: 900 });
await site.click('#memoryClose');

// 구버전 클라이언트(옛 Windows 앱 / 캐시된 옛 탭)와 섞여 있을 때
const oldClientWrite = (page, todoList) => page.evaluate(async (list) => {
  await window.HANSOL_FIRESTORE.doc('shared/state').set({
    knowledge: [], todos: list, memories: [], accountMeta: [], vaultSecrets: {},
    updatedAt: { __serverTimestamp: true }
  });
}, todoList);

// 구버전 앱은 항목별 updatedAt 없이, 문서를 통째로 덮어쓴다.
await oldClientWrite(site, [{ id: 'old-client-todo', text: '구버전앱 할일', date: '2026-08-25', done: false }]);
await site.waitForTimeout(2000);
check('구버전 앱이 올린 할 일이 새 사이트에 표시', (await site.textContent('#todayPanel')).includes('구버전앱 할일'));

const survived = await site.evaluate(async () => {
  const cloud = (await window.HANSOL_FIRESTORE.doc('shared/state').get()).data() || {};
  return {
    cloudTodos: (cloud.todos || []).map(t => t.text),
    cloudMemories: (cloud.memories || []).map(m => m.text)
  };
});
check('구버전 앱 덮어쓰기로 지워진 할 일을 서버에 자동 복구', survived.cloudTodos.includes(TODO_TEXT), survived.cloudTodos.join(', '));
check('구버전 앱 덮어쓰기로 지워진 기억을 서버에 자동 복구', survived.cloudMemories.includes(MEMO_TEXT), survived.cloudMemories.join(', '));

// 복구 로직이 무한 쓰기 루프를 만들지 않는지
const before = await site.evaluate(() => window.__FAKE_WRITES);
await site.waitForTimeout(3000);
const after = await site.evaluate(() => window.__FAKE_WRITES);
check('복구가 무한 쓰기 루프로 번지지 않음', after - before <= 1, `3초 동안 쓰기 ${after - before}회`);

// 브라우저를 닫았다 열어도 유지되는지
await popup.close();
const reopened = await open('');
const persisted = await reopened.textContent('#todayPanel');
check('재접속: 저장한 할 일 유지', persisted.includes(TODO_TEXT));
await reopened.click('#memoryToggle');
await reopened.waitForTimeout(300);
check('재접속: 저장한 기억 유지', (await reopened.textContent('#memoryPanel')).includes(MEMO_TEXT));

await browser.close();
server.close();
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
process.exit(failed.length ? 1 : 0);
