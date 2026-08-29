// 요청하신 실제 시나리오 그대로: 팝업 입력 → 배열 · localStorage · Firebase 문서까지 확인.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1280,height:900}});
await ctx.addInitScript(stub); await ctx.route('**gstatic.com/**',r=>r.abort());
const live=p=>p.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});

const site=await ctx.newPage();
site.on('pageerror',e=>console.log('  SITE ERROR:',e.message));
await site.goto(base+'/index.html'); await live(site);
if (await site.isVisible('#orb')) await site.click('#orb');   // 이미 열려 있으면 그대로 쓴다

const send = async (page, text) => { await page.fill('#input', text); await page.press('#input','Enter'); await page.waitForTimeout(1500); };
const lastBubble = page => page.$$eval('#messages .row.answer .bubble', n => n.at(-1)?.textContent || '');
const cloud = page => page.evaluate(async () => (await window.HANSOL_FIRESTORE.doc('shared/state').get()).data() || {});
const search = async (page, q) => { await page.fill('#pageSearch', q); await page.press('#pageSearch','Enter'); await page.waitForTimeout(300); return page.textContent('#pageGrid'); };

// 1) 팝업에 "할일 금화기업 전화"
await send(site, '할일 금화기업 전화');
ok('1. 팝업 답변이 저장 및 연동 완료', (await lastBubble(site)).includes('저장 및 연동 완료'), (await lastBubble(site)).split('\n')[0]);
const t1 = await site.evaluate(() => todos.find(t => t.text === '금화기업 전화'));
ok('1. todos 배열에 실제로 들어감', Boolean(t1));
ok('1. 고유 ID · 원문 · 생성/수정 시각 · 출처 저장', Boolean(t1 && t1.id && t1.raw === '금화기업 전화' && t1.createdAt && t1.updatedAt && t1.source), t1 && JSON.stringify({id:t1.id.slice(0,8), raw:t1.raw, createdAt:t1.createdAt, source:t1.source}));
ok('1. localStorage 에 저장됨', await site.evaluate(() => JSON.parse(localStorage.getItem('knowledge-todos')||'[]').some(t => t.text === '금화기업 전화')));
ok('1. Firebase shared/state 문서에 저장됨', ((await cloud(site)).todos||[]).some(t => t.text === '금화기업 전화'));

// 2) 웹사이트 할 일 탭과 상단 검색
ok('2. 할 일 목록에 표시', (await site.textContent('#todayPanel')).includes('금화기업 전화'));
await site.click('.top-item[data-nav="할 일"]');
await site.waitForTimeout(300);
ok('2. 할 일 탭에 표시', (await site.textContent('#pageGrid')).includes('금화기업 전화'));
await site.click('.top-item[data-nav="대시보드"]');
ok('2. 상단 검색에서 "금화기업" 확인', (await search(site, '금화기업')).includes('금화기업 전화'));
await search(site, '');

// 3) 팝업에 "기록 우단건설 전화요청기록"
await send(site, '기록 우단건설 전화요청기록');
ok('3. 팝업 답변이 저장 및 연동 완료', (await lastBubble(site)).includes('저장 및 연동 완료'));
const m1 = await site.evaluate(() => memories.find(m => m.text === '우단건설 전화요청기록'));
ok('3. memories 배열에 실제로 들어감', Boolean(m1));
ok('3. 고유 ID · 원문 · 생성/수정 시각 · 출처 저장', Boolean(m1 && m1.id && m1.raw && m1.createdAt && m1.updatedAt && m1.source));
ok('3. Firebase shared/state 문서에 저장됨', ((await cloud(site)).memories||[]).some(m => m.text === '우단건설 전화요청기록'));

// 4) 기억 저장소 + 우단건설 고객카드
await site.click('#memoryToggle'); await site.waitForTimeout(400);
ok('4. 기억 저장소에 표시', (await site.textContent('#memoryPanel')).includes('우단건설 전화요청기록'));
await site.click('#memoryClose');
const card = await search(site, '우단건설');
ok('4. 우단건설 고객카드에 같은 기록 표시', card.includes('㈜우단건설') && card.includes('관련 기록') && card.includes('우단건설 전화요청기록'));
await search(site, '');

// 지식 제목 | 내용
await send(site, '지식 폐기물 신청처 | 용인공장 010-2737-3394');
const k1 = await site.evaluate(() => knowledge.find(k => k.title === '폐기물 신청처'));
ok('5. "지식 제목 | 내용" 이 knowledge 에 저장', Boolean(k1 && k1.answer === '용인공장 010-2737-3394'), k1 && `${k1.title} / ${k1.answer} / ${k1.source}`);
ok('5. Firebase 문서에도 저장', ((await cloud(site)).knowledge||[]).some(k => k.title === '폐기물 신청처'));
ok('5. 내 지식에 표시', (await search(site, '폐기물 신청처')).includes('용인공장'));
await search(site, '');

// 명령어 없는 문장은 검색만 하고 저장하지 않는다
const beforeCount = await site.evaluate(() => memories.filter(m => !m.deleted).length);
await send(site, '1935719');
ok('6. 명령어 없는 문장은 기억에 저장하지 않음', (await site.evaluate(() => memories.filter(m => !m.deleted).length)) === beforeCount, `기억 ${beforeCount}개 유지`);
await send(site, '기억 1935719 특허 확인 필요');
ok('6. "기억 …" 을 붙이면 저장됨', await site.evaluate(() => memories.some(m => !m.deleted && m.text === '1935719 특허 확인 필요')));

// 5) 새로고침 후 유지
await site.reload(); await live(site); await site.waitForTimeout(500);
if (await site.isVisible('#orb')) await site.click('#orb');   // 이미 열려 있으면 그대로 쓴다
const afterReload = await site.evaluate(() => ({
  todo: todos.some(t => t.text === '금화기업 전화'),
  memory: memories.some(m => m.text === '우단건설 전화요청기록'),
  knowledge: knowledge.some(k => k.title === '폐기물 신청처')
}));
ok('7. 새로고침 후에도 세 항목 유지', afterReload.todo && afterReload.memory && afterReload.knowledge, JSON.stringify(afterReload));

// 6) 다른 브라우저(별도 프로필)에서도 동일하게
const other = await b.newContext({viewport:{width:1280,height:900}});
await other.route('**gstatic.com/**', r => r.abort());
await other.addInitScript(([k, v]) => localStorage.setItem(k, v), ['fake-firestore-shared-state', await site.evaluate(() => localStorage.getItem('fake-firestore-shared-state'))]);
await other.addInitScript(stub);
const page2 = await other.newPage();
await page2.goto(base+'/index.html'); await live(page2); await page2.waitForTimeout(600);
ok('8. 다른 브라우저 할 일 목록에 표시', (await page2.textContent('#todayPanel')).includes('금화기업 전화'));
await page2.click('#memoryToggle'); await page2.waitForTimeout(300);
ok('8. 다른 브라우저 기억 저장소에 표시', (await page2.textContent('#memoryPanel')).includes('우단건설 전화요청기록'));
await page2.click('#memoryClose');
ok('8. 다른 브라우저 검색에서 확인', (await search(page2, '금화기업')).includes('금화기업 전화'));

// Firebase 쓰기가 실패하면 성공으로 처리하지 않는지
await site.evaluate(() => { window.__FAKE_OFFLINE = true; });
await send(site, '할일 연결 끊긴 상태 확인');
ok('9. Firebase 실패 시 "로컬 저장 완료·클라우드 연동 대기 중"', (await lastBubble(site)).includes('로컬 저장 완료·클라우드 연동 대기 중'), (await lastBubble(site)).split('\n')[0]);
ok('9. 실패해도 로컬에는 저장', await site.evaluate(() => todos.some(t => t.text === '연결 끊긴 상태 확인')));
await site.evaluate(() => { window.__FAKE_OFFLINE = false; window.dispatchEvent(new Event('online')); });
await site.waitForTimeout(2000);
ok('9. 복구되면 자동 재전송', ((await cloud(site)).todos||[]).some(t => t.text === '연결 끊긴 상태 확인'));

// 쓰기는 성공했지만 문서에 없으면 성공으로 처리하지 않는지
await site.evaluate(() => { window.__FAKE_SWALLOW = true; });
await send(site, '할일 저장 확인 검증');
ok('10. 서버 문서에 없으면 완료로 표시하지 않음', !(await lastBubble(site)).includes('연동 완료'), (await lastBubble(site)).split('\n')[0]);
await site.evaluate(() => { window.__FAKE_SWALLOW = false; });

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : `\n모두 통과`);
process.exit(failures.length ? 1 : 0);
