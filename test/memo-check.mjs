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
ok('왼쪽에 통화 & 빠른 메모 칸', await page.isVisible('#memoPanel #memoQuick') && await page.isVisible('#memoNote'));
ok('안내 문구', (await page.textContent('#memoPanel')).includes('엔터(Enter)를 누르면 오른쪽 할 일로 자동 추가됩니다'));
ok('사진/파일 첨부 · 줄바꿈 안내', (await page.textContent('#memoPanel')).includes('사진/파일 첨부')
  && (await page.textContent('#memoPanel')).includes('Shift + Enter'));
ok('오른쪽에 할 일 목록 · 개수 배지', (await page.textContent('#todayPanel')).includes('할 일 목록')
  && (await page.textContent('.todo-count'))==='1개');
const side = await page.evaluate(()=>{
  const memo=document.querySelector('#memoPanel').getBoundingClientRect();
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  const sch=document.querySelector('#schedulePanel').getBoundingClientRect();
  return { 메모왼쪽: memo.right <= todo.left + 2, 일정이할일아래: sch.top >= todo.bottom - 2 };
});
ok('메모가 왼쪽 · 할 일이 오른쪽', side.메모왼쪽, JSON.stringify(side));
ok('일정은 할 일 아래', side.일정이할일아래, JSON.stringify(side));
ok('헤더에 이름표와 프로필', (await page.textContent('.brand-mark')).includes('한솔 지식')
  && (await page.textContent('.brand-avatar'))==='H');

// 2. 엔터로 할 일 등록
await page.fill('#memoQuick','엔터로 넣은 할 일');
await page.press('#memoQuick','Enter');
await page.waitForTimeout(400);
ok('엔터를 누르면 할 일로 들어감', (await page.textContent('#todayPanel')).includes('엔터로 넣은 할 일'));
ok('입력칸이 비워짐', (await page.inputValue('#memoQuick'))==='');
ok('개수 배지도 늘어남', (await page.textContent('.todo-count'))==='2개');
ok('원래 있던 할 일은 그대로', (await page.textContent('#todayPanel')).includes('미리 있던 할 일'));

// 추가 단추도 같은 일을 한다
await page.fill('#memoQuick','단추로 넣은 할 일');
await page.click('#memoQuickAdd');
await page.waitForTimeout(400);
ok('추가 단추로도 들어감', (await page.textContent('#todayPanel')).includes('단추로 넣은 할 일'));

// 3. 상세 메모는 남는다 (엔터로 할 일이 되지 않는다)
const beforeCount = (await page.$$('#todayPanel .todo-line')).length;
await page.fill('#memoNote','통화 내용 첫 줄');
await page.press('#memoNote','Enter');
await page.type('#memoNote','둘째 줄');
await page.waitForTimeout(700);
ok('상세 메모에서 엔터는 줄바꿈(할 일이 되지 않음)', (await page.$$('#todayPanel .todo-line')).length===beforeCount,
   `${(await page.$$('#todayPanel .todo-line')).length} / ${beforeCount}`);
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('새로고침해도 상세 메모가 남음', (await page.inputValue('#memoNote')).includes('통화 내용 첫 줄'));
ok('새로고침해도 할 일이 남음', (await page.textContent('#todayPanel')).includes('엔터로 넣은 할 일'));

// 4. 목록 동작 — 체크박스만 완료, 줄 클릭은 수정, ✕ 는 삭제
const activeBefore = (await page.$$('#todayPanel .todo-line')).length;
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-line')]
  .find(n=>n.textContent.includes('단추로 넣은 할 일')).querySelector('.todo-line-text').click());
await page.waitForTimeout(300);
ok('줄을 누르면 수정 창이 열림', await page.isVisible('#todoModal')
  && (await page.inputValue('#todoEditText'))==='단추로 넣은 할 일');
await page.click('#todoEditCancel'); await page.waitForTimeout(250);
ok('수정 창을 닫아도 개수 그대로', (await page.$$('#todayPanel .todo-line')).length===activeBefore);

await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-line')]
  .find(n=>n.textContent.includes('단추로 넣은 할 일')).querySelector('.todo-line-check').click());
await page.waitForTimeout(600);
ok('체크박스로만 완료 처리', (await page.$$('#todayPanel .todo-line')).length===activeBefore-1);
await page.click('[data-todo-tab="done"]'); await page.waitForTimeout(300);
ok('완료 탭에 들어가 있음', (await page.textContent('#todayPanel')).includes('단추로 넣은 할 일'));
await page.click('[data-todo-tab="active"]'); await page.waitForTimeout(300);

await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-line')]
  .find(n=>n.textContent.includes('엔터로 넣은 할 일')).querySelector('[data-todo-delete]').click());
await page.waitForTimeout(400);
ok('✕ 로 지워짐', !(await page.textContent('#todayPanel')).includes('엔터로 넣은 할 일'));
ok('다른 할 일은 그대로', (await page.textContent('#todayPanel')).includes('미리 있던 할 일'));
ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length? `\n실패: ${failures.join(', ')}` : '\n모두 통과');
process.exit(failures.length?1:0);
