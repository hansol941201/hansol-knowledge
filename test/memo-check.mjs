// 통화 & 빠른 메모 — 엔터로 할 일 등록, 상세 메모 보관, 할 일 목록 동작
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const seed=[{id:'a1',type:'todo',text:'미리 있던 할 일',raw:'미리 있던 할 일',date:'',done:false,
  createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z'}];
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.addInitScript(`localStorage.setItem('knowledge-todos', ${JSON.stringify(JSON.stringify(seed))});`);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 1. 화면 구성
ok('입력칸이 하나로 합쳐짐', await page.isVisible('#memoNote')
  && (await page.$$('#memoPanel textarea')).length===1
  && (await page.$$('#memoPanel input[type="text"]')).length===0);
ok('안내 문구', (await page.textContent('#memoPanel')).includes('엔터(Enter)는 왼쪽 할 일 목록으로'));
ok('사진/파일 첨부 · 줄바꿈 안내 · 기억 저장소 단추', (await page.textContent('#memoPanel')).includes('사진/파일 첨부')
  && (await page.textContent('#memoPanel')).includes('Shift+Enter')
  && (await page.textContent('#memoQuickAdd')).includes('기억 저장소'));
ok('오른쪽에 할 일 목록 · 개수 배지', (await page.textContent('#todayPanel')).includes('할 일 목록')
  && (await page.textContent('.todo-count'))==='1개');
const side = await page.evaluate(()=>{
  const memo=document.querySelector('#memoPanel').getBoundingClientRect();
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  const sch=document.querySelector('#schedulePanel').getBoundingClientRect();
  return { 할일왼쪽: todo.right <= memo.left + 2,
           메모오른쪽위: Math.abs(memo.top - todo.top) < 4,
           일정이메모아래: sch.top >= memo.bottom - 2,
           일정도오른쪽: sch.left >= todo.right - 2,
           칸사이간격: Math.round(sch.top - memo.bottom) };
});
ok('할 일이 왼쪽 넓은 칸', side.할일왼쪽, JSON.stringify(side));
ok('통화 & 빠른 메모가 오른쪽 위', side.메모오른쪽위 && side.일정도오른쪽, JSON.stringify(side));
ok('일정은 메모 바로 아래', side.일정이메모아래, JSON.stringify(side));
ok('오른쪽 카드 사이 간격 16~24px', side.칸사이간격>=16 && side.칸사이간격<=24, `${side.칸사이간격}px`);
// 왼쪽이 길어져도 오른쪽 카드를 억지로 늘리지 않는다
ok('일정 카드는 내용 높이만 차지', await page.evaluate(()=>{
  const sch=document.querySelector('#schedulePanel').getBoundingClientRect();
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  return sch.height < todo.height; }));
ok('헤더에 이름표와 프로필', (await page.textContent('.brand-mark')).includes('한솔 지식')
  && (await page.textContent('.brand-avatar'))==='H');

// 오른쪽 칸에 맞춘 메모 칸 모양
const memoShape = await page.evaluate(()=>{
  const head=getComputedStyle(document.querySelector('.memo-head'));
  const tools=document.querySelector('.memo-tools').getBoundingClientRect();
  const btn=document.querySelector('#memoQuickAdd').getBoundingClientRect();
  const note=document.querySelector('#memoNote').getBoundingClientRect();
  const panel=document.querySelector('#memoPanel').getBoundingClientRect();
  return { 머리말세로: head.flexDirection==='column',
           단추오른쪽끝: Math.abs(btn.right - tools.right) < 3,
           칸이너비를씀: note.width > panel.width * 0.8,
           메모높이: Math.round(note.height) };
});
ok('제목 아래에 안내 문구(겹치지 않음)', memoShape.머리말세로, JSON.stringify(memoShape));
ok('합친 칸이 너비를 다 쓰고 추가 단추는 오른쪽 고정',
   memoShape.칸이너비를씀 && memoShape.단추오른쪽끝, JSON.stringify(memoShape));
ok('메모 칸 높이 180~240px', memoShape.메모높이>=180 && memoShape.메모높이<=240, `${memoShape.메모높이}px`);

// 2. 엔터 → 왼쪽 할 일 목록
await page.fill('#memoNote','엔터로 넣은 할 일');
await page.press('#memoNote','Enter');
await page.waitForTimeout(400);
ok('엔터를 누르면 할 일로 들어감', (await page.textContent('#todayPanel')).includes('엔터로 넣은 할 일'));
ok('보낸 뒤 칸이 비워짐', (await page.inputValue('#memoNote'))==='');
ok('개수 배지도 늘어남', (await page.textContent('.todo-count'))==='2개');
ok('원래 있던 할 일은 그대로', (await page.textContent('#todayPanel')).includes('미리 있던 할 일'));

// Shift+Enter 는 줄바꿈 — 할 일이 되지 않는다
const beforeShift = (await page.$$('#todayPanel .todo-line')).length;
await page.fill('#memoNote','통화 내용 첫 줄');
await page.press('#memoNote','Shift+Enter');
await page.type('#memoNote','둘째 줄');
await page.waitForTimeout(700);
ok('Shift+Enter 는 줄바꿈(할 일이 되지 않음)', (await page.$$('#todayPanel .todo-line')).length===beforeShift,
   `${(await page.$$('#todayPanel .todo-line')).length} / ${beforeShift}`);
ok('두 줄이 한 칸에 남음', (await page.inputValue('#memoNote')).includes('\n'));

// 3. 추가 단추 → 기억으로 저장하고 기억 저장소를 연다
const memoText = await page.inputValue('#memoNote');
await page.click('#memoQuickAdd');
await page.waitForTimeout(600);
ok('추가를 누르면 기억 저장소가 열림', await page.isVisible('#memoryModal'));
ok('적은 내용이 기억으로 저장됨', (await page.textContent('#memoryPanel')).includes('통화 내용 첫 줄'));
ok('기억으로 갔지 할 일로 가지 않음',
   (await page.$$('#todayPanel .todo-line')).length===beforeShift
   && !(await page.textContent('#todayPanel')).includes('통화 내용 첫 줄'));
ok('보낸 뒤 칸이 비워짐(추가)', (await page.inputValue('#memoNote'))==='');
ok('자료에도 기억으로 들어감', await page.evaluate(()=>
  JSON.parse(localStorage.getItem('knowledge-memories')||'[]')
    .some(m=>m.type==='memory' && String(m.text).includes('통화 내용 첫 줄'))));
await page.click('#memoryClose'); await page.waitForTimeout(300);

// 빈 칸에서 추가를 눌러도 아무 일이 없다
const memBefore = await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-memories')||'[]').length);
await page.click('#memoQuickAdd'); await page.waitForTimeout(400);
ok('빈 칸이면 저장하지 않음',
   (await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-memories')||'[]').length))===memBefore
   && !(await page.isVisible('#memoryModal')));

// 적다 만 글은 새로고침해도 남는다
await page.fill('#memoNote','적다 만 통화 기록');
await page.waitForTimeout(700);
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('새로고침해도 적다 만 글이 남음', (await page.inputValue('#memoNote')).includes('적다 만 통화 기록'));
ok('새로고침해도 할 일이 남음', (await page.textContent('#todayPanel')).includes('엔터로 넣은 할 일'));
await page.fill('#memoNote',''); await page.waitForTimeout(500);

// 4. 목록 동작 — 체크박스만 완료, 줄 클릭은 수정, ✕ 는 삭제
// 완료용·삭제용으로 서로 다른 항목이 필요하니 하나 더 넣는다
await page.fill('#memoNote','지울 할 일');
await page.press('#memoNote','Enter');
await page.waitForTimeout(400);
const activeBefore = (await page.$$('#todayPanel .todo-line')).length;
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-line')]
  .find(n=>n.textContent.includes('엔터로 넣은 할 일')).querySelector('.todo-line-text').click());
await page.waitForTimeout(300);
ok('줄을 누르면 수정 창이 열림', await page.isVisible('#todoModal')
  && (await page.inputValue('#todoEditText'))==='엔터로 넣은 할 일');
await page.click('#todoEditCancel'); await page.waitForTimeout(250);
ok('수정 창을 닫아도 개수 그대로', (await page.$$('#todayPanel .todo-line')).length===activeBefore);

await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-line')]
  .find(n=>n.textContent.includes('엔터로 넣은 할 일')).querySelector('.todo-line-check').click());
await page.waitForTimeout(600);
ok('체크박스로만 완료 처리', (await page.$$('#todayPanel .todo-line')).length===activeBefore-1);
await page.click('[data-todo-tab="done"]'); await page.waitForTimeout(300);
ok('완료 탭에 들어가 있음', (await page.textContent('#todayPanel')).includes('엔터로 넣은 할 일'));
await page.click('[data-todo-tab="active"]'); await page.waitForTimeout(300);

await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-line')]
  .find(n=>n.textContent.includes('지울 할 일')).querySelector('[data-todo-delete]').click());
await page.waitForTimeout(400);
ok('✕ 로 지워짐', !(await page.textContent('#todayPanel')).includes('지울 할 일'));
ok('다른 할 일은 그대로', (await page.textContent('#todayPanel')).includes('미리 있던 할 일'));
// 좁은 화면: 한 단으로 쌓이고 차례는 메모 → 할 일 → 일정, 입력칸은 위아래
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(500);
const narrow = await page.evaluate(()=>{
  const box = id => document.querySelector(id).getBoundingClientRect();
  const m=box('#memoPanel'), t=box('#todayPanel'), s=box('#schedulePanel');
  const title=document.querySelector('.todo-line-text');
  const time=document.querySelector('.todo-line time');
  return { 한단: Math.abs(m.left-t.left)<2 && Math.abs(t.left-s.left)<2,
           차례: m.top < t.top && t.top < s.top,
           단추방향: getComputedStyle(document.querySelector('.memo-tools')).flexDirection,
           제목날짜겹침: time ? title.getBoundingClientRect().right > time.getBoundingClientRect().left + 1 : false,
           가로스크롤: Math.round(document.documentElement.scrollWidth - window.innerWidth),
           메모높이: Math.round(document.querySelector('#memoNote').getBoundingClientRect().height) };
});
ok('모바일은 한 단', narrow.한단, JSON.stringify(narrow));
ok('모바일 차례: 메모 → 할 일 → 일정', narrow.차례, JSON.stringify(narrow));
ok('모바일에서는 첨부·추가 단추가 위아래', narrow.단추방향==='column', narrow.단추방향);
ok('모바일에서 제목과 날짜가 겹치지 않음', !narrow.제목날짜겹침);
ok('모바일 가로 스크롤 없음', narrow.가로스크롤<=0, `${narrow.가로스크롤}px`);
ok('모바일 상세 메모도 180~240px', narrow.메모높이>=180 && narrow.메모높이<=240, `${narrow.메모높이}px`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length? `\n실패: ${failures.join(', ')}` : '\n모두 통과');
process.exit(failures.length?1:0);
