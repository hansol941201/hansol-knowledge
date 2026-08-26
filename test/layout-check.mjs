import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const out = process.env.SHOT_DIR || root;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1.5});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
await ctx.route('**google.com/s2/favicons**', r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#DFD4FA"/></svg>'}));
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));
ok('사이드바 표시', await page.isVisible('.sidebar'));
ok('사이드바 메뉴 9개', (await page.$$eval('.side-nav .side-item', n=>n.length))===9);
ok('기억 저장소가 메뉴 아래에 있음', await page.isVisible('.side-extra #memoryToggle'));
ok('대시보드가 기본 선택', (await page.textContent('.side-item.active')).includes('대시보드'));
ok('자주 가는 사이트 표시', await page.isVisible('#shortcutSection'));
ok('오늘의 할 일 표시', await page.isVisible('#todayPanel'));
ok('이모지 없음', !/[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}]/u.test(await page.textContent('.workspace')));
ok('통계·최근활동 영역 없음', !(await page.content()).includes('최근 활동') && !(await page.content()).includes('총 지식 수'));

// 사이트 바로가기 추가
await page.click('#shortcutAdd'); await page.waitForTimeout(250);
await page.fill('#shortcutName','K-APT'); await page.fill('#shortcutUrl','k-apt.go.kr');
await page.click('#shortcutForm button[type="submit"]'); await page.waitForTimeout(400);
ok('사이트 추가됨', (await page.textContent('#shortcutGrid')).includes('K-APT'));
ok('localStorage 에 저장', await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-shortcuts')||'[]').some(x=>x.name==='K-APT')));
ok('클라우드에도 저장', await page.evaluate(async()=>{const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};return (d.shortcuts||[]).some(x=>x.name==='K-APT');}));

// 지식 추가 모달 — 기억 / 할 일 분리
await page.click('#pageAdd'); await page.waitForTimeout(250);
await page.click('[data-add="기억"]'); await page.fill('#quickTextInput','춘천인성 협약서 확인');
await page.click('#quickTextForm button[type="submit"]'); await page.waitForTimeout(1500);
let split = await page.evaluate(()=>({m:memories.filter(x=>!x.deleted&&x.text==='춘천인성 협약서 확인').length, t:todos.filter(x=>!x.deleted&&x.text==='춘천인성 협약서 확인').length}));
ok('기억은 기억에만 저장', split.m===1&&split.t===0, JSON.stringify(split));
await page.click('#pageAdd'); await page.waitForTimeout(250);
await page.click('[data-add="할 일"]'); await page.fill('#quickTextInput','금화기업 전화');
await page.click('#quickTextForm button[type="submit"]'); await page.waitForTimeout(1500);
split = await page.evaluate(()=>({t:todos.filter(x=>!x.deleted&&x.text==='금화기업 전화').length, m:memories.filter(x=>!x.deleted&&x.text==='금화기업 전화').length}));
ok('할 일은 할 일에만 저장', split.t===1&&split.m===0, JSON.stringify(split));
ok('할 일 카드에 표시', (await page.textContent('#todayPanel')).includes('금화기업 전화'));



// 검색
await page.fill('#pageSearch','춘천'); await page.press('#pageSearch','Enter'); await page.waitForTimeout(400);
ok('검색 시 할 일 영역 숨김', !(await page.isVisible('#todayPanel')));
ok('검색 시 바로가기 숨김', !(await page.isVisible('#shortcutSection')));
ok('검색어 형광펜', (await page.$$eval('#pageGrid mark', n=>n.map(x=>x.textContent))).includes('춘천'));

await page.fill('#pageSearch',''); await page.waitForTimeout(400);
ok('검색어 지우면 할 일 다시 표시', await page.isVisible('#todayPanel'));

// 사이드바 이동 + 상세 보기
await page.click('[data-nav="특허"]'); await page.waitForTimeout(600);
ok('특허 화면 이동', (await page.textContent('#pageHeading'))==='특허');
ok('특허 카드 렌더', (await page.$$eval('#pageGrid .patent-card', n=>n.length))>100);
await page.click('#pageGrid .patent-card'); await page.waitForTimeout(300);
ok('카드 클릭 시 상세 열림', await page.isVisible('#detailModal'));

await page.click('#detailClose');

await page.click('[data-nav="기억"]'); await page.waitForTimeout(400);
ok('기억 화면에 기억 카드', (await page.textContent('#pageGrid')).includes('춘천인성 협약서 확인'));
await page.click('[data-nav="할 일"]'); await page.waitForTimeout(400);
ok('할 일 화면', (await page.textContent('#pageHeading'))==='할 일' && await page.isVisible('#todayPanel'));

// 반응형
for (const w of [1440, 1366, 1024]) {
  await page.setViewportSize({width:w, height:900});
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(`${w}px 가로 넘침 없음`, !overflow);
}
await page.setViewportSize({width:1920,height:1080});
await b.close(); server.close();
if (errors.length) console.log('JS 오류:\n' + errors.join('\n'));
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
