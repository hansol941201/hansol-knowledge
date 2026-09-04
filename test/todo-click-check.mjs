// 할 일 카드 클릭 = 수정 / 체크박스 클릭 = 완료 상태만 변경
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };

const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const day = n => { const d=new Date(); d.setDate(d.getDate()+n); return key(d); };
const LONG = '아쿠아 질문서 회신하기 aquablock5757@naver.com 주식회사아쿠아블록 담당자님께 회신 드리고 첨부 파일도 같이 보내야 하며 다음 주 월요일까지 확인 필요';
const todos = [
  { id:'a1', type:'todo', text:'첫 번째 할 일', raw:'첫 번째 할 일', date:day(1), done:false, createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:01:00.000Z' },
  { id:'a2', type:'todo', text:LONG, raw:LONG, date:day(2), done:false, createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:02:00.000Z' },
  { id:'a3', type:'todo', text:'세 번째 할 일', raw:'세 번째 할 일', date:day(3), done:false, createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:03:00.000Z' },
  { id:'d1', type:'todo', text:'끝낸 할 일', raw:'끝낸 할 일', date:day(-2), done:true, doneAt:'2026-09-01T01:00:00.000Z', createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T01:00:00.000Z' }
];

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.addInitScript(`localStorage.setItem('knowledge-todos', ${JSON.stringify(JSON.stringify(todos))});`);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog', d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const activeCount = () => page.$$eval('#todayPanel .todo-item:not(.done)', n=>n.length);
const doneCount = () => page.evaluate(()=>Number(document.querySelector('[data-todo-tab="done"] span').textContent));
const cardOf = (text) => page.evaluateHandle(t=>[...document.querySelectorAll('#todayPanel .todo-item')].find(c=>c.textContent.includes(t)), text);

// 카드 전체를 label 로 감싸지 않는다
ok('카드가 label 이 아님', await page.$eval('#todayPanel .todo-item', n=>n.tagName)==='DIV');
ok('체크박스는 자기 label 안에만 있음', await page.evaluate(()=>
  [...document.querySelectorAll('#todayPanel .todo-item input')].every(i=>i.closest('label')?.classList.contains('todo-check-box'))));

// 1. 제목을 눌러도 완료되지 않고 수정창이 열린다
const before = await activeCount();
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-item')].find(c=>c.textContent.includes('첫 번째 할 일')).querySelector('.todo-text').click());
await page.waitForTimeout(350);
ok('제목 클릭 → 수정창 열림', await page.isVisible('#todoModal'));
ok('제목 클릭으로 완료되지 않음', await activeCount()===before && await doneCount()===1);
ok('올바른 항목이 열림', (await page.inputValue('#todoEditText'))==='첫 번째 할 일');
ok('날짜도 채워져 있음', (await page.inputValue('#todoEditDate'))===day(1));
ok('내용은 여러 줄 입력칸', await page.$eval('#todoEditText', n=>n.tagName)==='TEXTAREA');

// 취소하면 원본 유지
await page.fill('#todoEditText','버릴 내용');
await page.click('#todoEditCancel');
await page.waitForTimeout(300);
ok('취소하면 원본 그대로', (await page.textContent('#todayPanel')).includes('첫 번째 할 일') && !(await page.textContent('#todayPanel')).includes('버릴 내용'));
ok('취소해도 완료 상태 그대로', await activeCount()===before && await doneCount()===1);

// 2. 날짜·배지·빈 공간을 눌러도 완료되지 않는다
for (const [sel, name] of [['time','날짜'], ['.todo-badge','배지'], ['.todo-foot','빈 공간']]) {
  await page.evaluate(([s])=>[...document.querySelectorAll('#todayPanel .todo-item')].find(c=>c.textContent.includes('세 번째 할 일')).querySelector(s).click(), [sel]);
  await page.waitForTimeout(250);
  ok(`${name} 클릭으로 완료되지 않음`, await activeCount()===before && await doneCount()===1);
  ok(`${name} 클릭도 수정창을 염`, await page.isVisible('#todoModal') && (await page.inputValue('#todoEditText'))==='세 번째 할 일');
  await page.click('#todoEditCancel'); await page.waitForTimeout(200);
}

// 3. 긴 내용도 입력칸에서 전체가 보인다
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-item')].find(c=>c.textContent.includes('아쿠아')).querySelector('.todo-text').click());
await page.waitForTimeout(300);
ok('긴 내용이 잘리지 않고 전부 들어옴', (await page.inputValue('#todoEditText')).length > 60 && (await page.inputValue('#todoEditText')).includes('다음 주 월요일까지'));
await page.fill('#todoEditText','아쿠아 질문서 회신 완료 후 자료 발송');
await page.fill('#todoEditDate', day(5));
await page.click('#todoForm button[type="submit"]');
await page.waitForTimeout(500);
ok('저장하면 내용·날짜가 즉시 반영', (await page.textContent('#todayPanel')).includes('아쿠아 질문서 회신 완료 후 자료 발송') && (await page.textContent('#todayPanel')).includes(day(5)));
ok('수정만으로 완료되지 않음', await activeCount()===before && await doneCount()===1);
ok('새 항목이 생기지 않고 같은 ID 로 저장', await page.evaluate(()=>{
  const list=JSON.parse(localStorage.getItem('knowledge-todos')).filter(t=>!t.deleted);
  return list.length===4 && list.some(t=>t.id==='a2' && t.text==='아쿠아 질문서 회신 완료 후 자료 발송'); }));

// 4. 체크박스는 완료 상태만 바꾸고 수정창을 열지 않는다
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-item')].find(c=>c.textContent.includes('첫 번째 할 일')).querySelector('.todo-check-box').click());
await page.waitForTimeout(500);
ok('체크박스 클릭 → 완료로 이동', await activeCount()===before-1 && await doneCount()===2);
ok('체크박스 클릭 시 수정창이 열리지 않음', !(await page.isVisible('#todoModal')));

// 5. 완료 탭에서도 카드 클릭은 수정, 체크박스는 상태 변경
await page.evaluate(()=>document.querySelector('[data-todo-tab="done"]').click());
await page.waitForTimeout(400);
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-item.done')].find(c=>c.textContent.includes('끝낸 할 일')).querySelector('.todo-text').click());
await page.waitForTimeout(350);
ok('완료 탭에서도 카드 클릭 → 수정창', await page.isVisible('#todoModal') && (await page.inputValue('#todoEditText'))==='끝낸 할 일');
await page.fill('#todoEditText','끝낸 할 일(내용 수정)');
await page.click('#todoForm button[type="submit"]');
await page.waitForTimeout(500);
ok('완료 항목 수정해도 완료 상태 유지', await doneCount()===2 && (await page.textContent('#todayPanel')).includes('끝낸 할 일(내용 수정)'));
ok('완료 상태값이 그대로', await page.evaluate(()=>
  JSON.parse(localStorage.getItem('knowledge-todos')).some(t=>t.id==='d1' && t.done===true && t.doneAt)));
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-item.done')].find(c=>c.textContent.includes('끝낸 할 일')).querySelector('.todo-check-box').click());
await page.waitForTimeout(500);
ok('완료 탭 체크박스 → 할 일로 되돌림', await doneCount()===1);
ok('되돌릴 때 수정창이 열리지 않음', !(await page.isVisible('#todoModal')));

// 6. 새로고침 후에도 유지
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('새로고침 후에도 수정 내용 유지', (await page.textContent('#todayPanel')).includes('아쿠아 질문서 회신 완료 후 자료 발송'));
ok('클라우드에도 저장됨', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.todos||[]).some(t=>t.id==='a2' && t.text==='아쿠아 질문서 회신 완료 후 자료 발송'); }));

// 7. 디자인은 그대로
const design = await page.evaluate(()=>{
  const list=document.querySelector('.todo-group-list');
  const card=document.querySelector('#todayPanel .todo-item');
  return { cols:getComputedStyle(list).gridTemplateColumns.split(' ').length,
           h:parseFloat(getComputedStyle(card).height),
           tabs:[...document.querySelectorAll('.todo-tab span')].map(x=>x.textContent) };
});
ok('3열 배치·카드 높이 88px 유지', design.cols===3 && design.h===88, JSON.stringify(design));
ok('할 일·완료 개수 표시 유지', design.tabs.length===2, design.tabs.join(' / '));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
