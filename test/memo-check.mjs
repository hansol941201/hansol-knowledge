// 빠른 전화 메모 — 자동 저장 · 복원 · 충돌 방지
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1600,height:1000}});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const ready = async (p=page) => {
  await p.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
  await p.waitForTimeout(600);
};
await page.goto(base+'/index.html'); await ready();
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 1. 3개 카드
const cards = await page.evaluate(()=>{
  const items=[...document.querySelectorAll('#dashCols > section')].filter(el=>!el.classList.contains('hidden'));
  const tops=new Set(items.map(el=>Math.round(el.getBoundingClientRect().top)));
  return { ids: items.map(el=>el.id), oneRow: tops.size===1,
           cols: getComputedStyle(document.querySelector('#dashCols')).gridTemplateColumns.split(' ').length };
});
ok('카드 3개 · 순서', JSON.stringify(cards.ids)===JSON.stringify(['todayPanel','schedulePanel','memoPanel']), JSON.stringify(cards.ids));
ok('데스크톱에서 한 줄 3열', cards.oneRow && cards.cols===3, JSON.stringify(cards));

// 2. 카드 구성
ok('제목', (await page.textContent('#memoPanel h2'))==='빠른 전화 메모');
ok('placeholder', (await page.getAttribute('#quickMemo','placeholder'))==='전화받은 내용을 바로 메모하세요. 입력 내용은 자동 저장됩니다.');
ok('빈 textarea 로 시작', (await page.inputValue('#quickMemo'))==='');
ok('넉넉한 높이', await page.evaluate(()=>document.querySelector('#quickMemo').getBoundingClientRect().height>=200));
ok('버튼 3개', await page.isVisible('#memoToRecord') && await page.isVisible('#memoCopy') && await page.isVisible('#memoClear'));

// 3. 자동 저장
const MEMO = '금화기업 김부장 010-1234-5678\n방수 견적 요청, 내일까지 회신';
await page.click('#quickMemo');
await page.type('#quickMemo', MEMO, { delay: 5 });
await page.waitForTimeout(200);
ok('글자 수 표시', (await page.textContent('#memoCount'))===`${MEMO.length}자`, await page.textContent('#memoCount'));
const local = await page.evaluate(()=>JSON.parse(localStorage.getItem('quick_phone_memo_draft')||'null'));
ok('입력 즉시 localStorage 저장', local && local.text===MEMO && Boolean(local.updatedAt), JSON.stringify(local && {len:local.text.length, at:local.updatedAt}));
ok('전용 키 사용 · 다른 자료와 분리', await page.evaluate(()=>{
  const keys=Object.keys(localStorage);
  return keys.includes('quick_phone_memo_draft') && !JSON.stringify(localStorage.getItem('knowledge-todos')).includes('금화기업'); }));
await page.waitForTimeout(900);
ok('Firebase 로 자동 동기화', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.quickPhoneMemoDraft||{}).text||''; }).then(t=>t===MEMO));
ok('전용 Firebase 경로', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return 'quickPhoneMemoDraft' in d && Boolean(d.quickPhoneMemoDraft.updatedAt); }));
ok('메모 저장이 다른 자료를 지우지 않음', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return Array.isArray(d.knowledge) && d.knowledge.length>0; }));
ok('저장 상태 안내', ['자동 저장됨','기기에 저장됨','저장 중…'].includes((await page.textContent('#memoStatus')).trim()),
   await page.textContent('#memoStatus'));

// 4. 다른 메뉴로 갔다 돌아오기
await page.click('.top-item[data-nav="특허"]'); await page.waitForTimeout(400);
await page.click('.top-item[data-nav="대시보드"]'); await page.waitForTimeout(400);
ok('다른 메뉴 다녀와도 유지', (await page.inputValue('#quickMemo'))===MEMO);

// 5. 새로고침
await page.reload(); await ready();
ok('새로고침 후 복원', (await page.inputValue('#quickMemo'))===MEMO);
ok('새로고침 후 글자 수', (await page.textContent('#memoCount'))===`${MEMO.length}자`);

// 6. 오프라인에서 이어 쓰기
await ctx.setOffline(true);
await page.evaluate(()=>{ window.__FAKE_OFFLINE = true; });
await page.click('#quickMemo');
await page.keyboard.press('End');
await page.type('#quickMemo', '\n(오프라인 추가분)', { delay: 5 });
await page.waitForTimeout(900);
const offlineLocal = await page.evaluate(()=>JSON.parse(localStorage.getItem('quick_phone_memo_draft')).text);
ok('오프라인에도 로컬 저장', offlineLocal.includes('오프라인 추가분'));
ok('오프라인 안내', (await page.textContent('#memoStatus')).includes('저장'), await page.textContent('#memoStatus'));
await page.evaluate(()=>{ window.__FAKE_OFFLINE = false; });
await ctx.setOffline(false);
await page.evaluate(()=>window.dispatchEvent(new Event('online')));
await page.waitForTimeout(1200);
ok('재연결 시 자동 동기화', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return ((d.quickPhoneMemoDraft||{}).text||'').includes('오프라인 추가분'); }));

// 7. 오래된 원격 값이 새 메모를 덮지 않는다
await page.evaluate(()=>document.querySelector('#quickMemo').blur());
await page.waitForTimeout(200);
await page.evaluate(async()=>{
  const doc=window.HANSOL_FIRESTORE.doc('shared/state');
  const cur=(await doc.get()).data()||{};
  await doc.set({ ...cur, quickPhoneMemoDraft:{ text:'', updatedAt:'2020-01-01T00:00:00.000Z' } });
});
await page.waitForTimeout(900);
ok('빈 옛 원격 값이 덮어쓰지 않음', (await page.inputValue('#quickMemo')).includes('오프라인 추가분'));

// 8. 더 최근 원격 값은 반영 (다른 기기) — 입력을 멈춘 상태
await page.evaluate(()=>document.querySelector('#quickMemo').blur());
await page.waitForTimeout(200);
await page.evaluate(async()=>{
  const doc=window.HANSOL_FIRESTORE.doc('shared/state');
  const cur=(await doc.get()).data()||{};
  await doc.set({ ...cur, quickPhoneMemoDraft:{ text:'다른 기기에서 쓴 메모', updatedAt:new Date(Date.now()+60000).toISOString() } });
});
await page.waitForTimeout(1000);
ok('다른 기기의 최신 메모 동기화', (await page.inputValue('#quickMemo'))==='다른 기기에서 쓴 메모');

// 9. 입력 중에는 원격 값이 화면을 건드리지 않는다
await page.click('#quickMemo');
await page.evaluate(()=>{ const t=document.querySelector('#quickMemo'); t.focus(); });
await page.type('#quickMemo', ' + 입력중', { delay: 5 });
await page.evaluate(async()=>{
  const doc=window.HANSOL_FIRESTORE.doc('shared/state');
  const cur=(await doc.get()).data()||{};
  await doc.set({ ...cur, quickPhoneMemoDraft:{ text:'끼어든 원격 메모', updatedAt:new Date(Date.now()+120000).toISOString() } });
});
await page.waitForTimeout(900);
ok('입력 중에는 덮어쓰지 않음', (await page.inputValue('#quickMemo')).includes('입력중'), await page.inputValue('#quickMemo'));

// 10. 기록으로 저장 → 확인 후에만 비움
// 앞 단계에서 심어 둔 '미래 시각' 원격 값을 지난 시각으로 되돌려 로컬이 최신이 되게 한다.
await page.evaluate(async()=>{
  const doc=window.HANSOL_FIRESTORE.doc('shared/state');
  const cur=(await doc.get()).data()||{};
  await doc.set({ ...cur, quickPhoneMemoDraft:{ text:'', updatedAt:'2020-01-01T00:00:00.000Z' } });
});
await page.waitForTimeout(400);
await page.evaluate(()=>{ const t=document.querySelector('#quickMemo'); t.value='전화 요청: 우단건설 자재 문의'; t.dispatchEvent(new Event('input',{bubbles:true})); t.blur(); });
await page.waitForTimeout(900);
page.once('dialog', d=>{ ok('저장 성공 뒤에 비울지 확인', d.message().includes('비울까요')); d.dismiss(); });
await page.click('#memoToRecord'); await page.waitForTimeout(1500);
ok('기억(전화 요청 기록)으로 저장됨', await page.evaluate(()=>memories.some(m=>!m.deleted && m.text.includes('우단건설 자재 문의') && m.source==='빠른 전화 메모')));
ok('취소하면 메모는 그대로', (await page.inputValue('#quickMemo')).includes('우단건설'));
page.once('dialog', d=>d.accept());
await page.click('#memoToRecord'); await page.waitForTimeout(1500);
ok('동의하면 메모 비움', (await page.inputValue('#quickMemo'))==='');

// 11. 전체 삭제는 확인창을 거친다
await page.evaluate(()=>{ const t=document.querySelector('#quickMemo'); t.value='지울 메모'; t.dispatchEvent(new Event('input',{bubbles:true})); });
await page.waitForTimeout(300);
page.once('dialog', d=>{ ok('전체 삭제 확인창', d.message().includes('지울까요')); d.dismiss(); });
await page.click('#memoClear'); await page.waitForTimeout(300);
ok('취소하면 남아 있음', (await page.inputValue('#quickMemo'))==='지울 메모');
page.once('dialog', d=>d.accept());
await page.click('#memoClear'); await page.waitForTimeout(400);
ok('확인하면 비워짐', (await page.inputValue('#quickMemo'))==='');

// 12. Esc·바깥 클릭으로 지워지지 않는다
await page.evaluate(()=>{ const t=document.querySelector('#quickMemo'); t.value='안 지워져야 하는 메모'; t.dispatchEvent(new Event('input',{bubbles:true})); });
await page.waitForTimeout(300);
await page.keyboard.press('Escape');
await page.mouse.click(800, 300);
await page.waitForTimeout(300);
ok('Esc·바깥 클릭에도 유지', (await page.inputValue('#quickMemo'))==='안 지워져야 하는 메모');

// 13. 브라우저를 껐다 켠 것과 같은 상황(같은 저장소, 새 탭)
const page2 = await ctx.newPage();
await page2.goto(base+'/index.html'); await ready(page2);
ok('새 탭(재실행)에서도 복원', (await page2.inputValue('#quickMemo'))==='안 지워져야 하는 메모');
await page2.close();

// 14. 좁은 화면
await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(400);
const mob = await page.evaluate(()=>({
  cols: getComputedStyle(document.querySelector('#dashCols')).gridTemplateColumns.split(' ').length,
  overflow: Math.round(document.documentElement.scrollWidth - window.innerWidth),
  visible: document.querySelector('#memoPanel').getBoundingClientRect().width > 200 }));
ok('모바일 1열 · 넘침 없음', mob.cols===1 && mob.overflow<=1 && mob.visible, JSON.stringify(mob));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
