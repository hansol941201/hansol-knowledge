// 긴급·중요 매트릭스 — 직접 고르기, 네 칸 배치, 미분류, 저장
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

const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return key(d);};
const T='2026-09-01T00:00:00.000Z';
const todos=[
  {id:'a1',type:'todo',text:'계약서 오늘까지',raw:'x',date:day(0),done:false,quadrant:1,createdAt:T,updatedAt:T+''},
  {id:'a2',type:'todo',text:'내년 사업계획',raw:'x',date:day(30),done:false,quadrant:2,createdAt:T,updatedAt:T},
  {id:'a3',type:'todo',text:'견적서 취합',raw:'x',date:day(1),done:false,quadrant:3,createdAt:T,updatedAt:T},
  {id:'a4',type:'todo',text:'오래된 메일 정리',raw:'x',date:'',done:false,quadrant:4,createdAt:T,updatedAt:T},
  {id:'a5',type:'todo',text:'아직 안 정한 일',raw:'x',date:day(2),done:false,createdAt:T,updatedAt:T},
  {id:'a6',type:'todo',text:'끝낸 일',raw:'x',date:day(-3),done:true,doneAt:T,quadrant:1,createdAt:T,updatedAt:T},
  // 예전 급함/여유 값이 남아 있는 기록 — 건드리면 안 된다
  {id:'a7',type:'todo',text:'예전 급함값 있는 일',raw:'x',date:day(4),done:false,urgency:'urgent',createdAt:T,updatedAt:T}
];

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:1000}});
await ctx.addInitScript(stub);
await ctx.addInitScript(`localStorage.setItem('knowledge-todos', ${JSON.stringify(JSON.stringify(todos))});`);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(700);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 1. 탭이 생겼다
ok('긴급·중요 탭이 있음', !!(await page.$('[data-todo-tab="matrix"]')));
ok('할 일·완료 탭은 그대로', (await page.$$('[data-todo-tab]')).length===3);

await page.click('[data-todo-tab="matrix"]');
await page.waitForTimeout(400);

// 2. 네 칸 배치
const cellOf = async (n) => page.$$eval(`.quad-cell.quad-${n} .todo-line-text`, els=> els.map(e=>e.textContent.trim()));
ok('① 칸에 긴급+중요', (await cellOf(1)).join()==='계약서 오늘까지', (await cellOf(1)).join());
ok('② 칸에 중요+안긴급', (await cellOf(2)).join()==='내년 사업계획', (await cellOf(2)).join());
ok('③ 칸에 긴급+안중요', (await cellOf(3)).join()==='견적서 취합', (await cellOf(3)).join());
ok('④ 칸에 안긴급+안중요', (await cellOf(4)).join()==='오래된 메일 정리', (await cellOf(4)).join());
const acts = await page.$$eval('.quad-cell > header em', els=> els.map(e=>e.textContent.trim()));
ok('처리 방법이 칸마다 붙음', acts.join('|')==='즉시 실행|일정·마감 설정|위임/자동화|삭제/최소화', acts.join('|'));

// 3. 미분류
const unset = await page.$$eval('.quad-unset .todo-line-text', els=> els.map(e=>e.textContent.trim()));
ok('안 정한 할 일은 "아직 안 정함"에 모임', unset.includes('아직 안 정한 일') && unset.includes('예전 급함값 있는 일'), JSON.stringify(unset));
ok('자동으로 칸을 정해 주지 않음', unset.length===2, String(unset.length));

// 4. 완료한 일은 매트릭스에 없다
const all = await page.$$eval('#todayPanel .todo-line-text', els=> els.map(e=>e.textContent.trim()));
ok('완료한 일은 매트릭스에 없음', !all.includes('끝낸 일'), JSON.stringify(all));

// 5. 수정 창에서 직접 고르기
await page.evaluate(()=>{
  const row=[...document.querySelectorAll('.quad-unset .todo-line')]
    .find(r=> r.querySelector('.todo-line-text').textContent.trim()==='아직 안 정한 일');
  row.click();
});
await page.waitForTimeout(400);
ok('수정 창이 열림', !(await page.$eval('#todoModal', el=> el.classList.contains('hidden'))));
ok('고르기 칸이 있음', (await page.$$('#todoEditQuadrant [data-quadrant]')).length===5);
ok('아직 안 정함이 기본 선택', await page.$eval('[data-quadrant="0"]', el=> el.classList.contains('is-on')));
await page.click('[data-quadrant="2"]');
await page.waitForTimeout(150);
ok('고르면 표시됨', await page.$eval('[data-quadrant="2"]', el=> el.classList.contains('is-on')));
ok('이전 선택은 꺼짐', !(await page.$eval('[data-quadrant="0"]', el=> el.classList.contains('is-on'))));
await page.click('#todoForm button[type="submit"]');
await page.waitForTimeout(700);
ok('② 칸으로 옮겨짐', (await cellOf(2)).includes('아직 안 정한 일'), (await cellOf(2)).join());
ok('미분류에서 빠짐', !(await page.$$eval('.quad-unset .todo-line-text', els=> els.map(e=>e.textContent.trim()))).includes('아직 안 정한 일'));

// 6. 되돌리기(아직 안 정함)
await page.evaluate(()=>{
  const row=[...document.querySelectorAll('.quad-cell.quad-2 .todo-line')]
    .find(r=> r.querySelector('.todo-line-text').textContent.trim()==='아직 안 정한 일');
  row.click();
});
await page.waitForTimeout(400);
ok('다시 열면 ②가 선택돼 있음', await page.$eval('[data-quadrant="2"]', el=> el.classList.contains('is-on')));
await page.click('[data-quadrant="0"]');
await page.click('#todoForm button[type="submit"]');
await page.waitForTimeout(700);
ok('"아직 안 정함"으로 되돌아감', (await page.$$eval('.quad-unset .todo-line-text', els=> els.map(e=>e.textContent.trim()))).includes('아직 안 정한 일'));

// 7. 저장 확인 + 기존 자료 보존
const stored = await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-todos')||'[]'));
ok('할 일 7건 그대로', stored.length===7, String(stored.length));
ok('quadrant 가 저장됨', stored.find(t=>t.id==='a1').quadrant===1 && stored.find(t=>t.id==='a4').quadrant===4);
ok('되돌린 할 일은 quadrant 없음', !stored.find(t=>t.id==='a5').quadrant);
ok('예전 urgency 값은 그대로 둠', stored.find(t=>t.id==='a7').urgency==='urgent', String(stored.find(t=>t.id==='a7').urgency));
ok('완료 표시도 그대로', stored.find(t=>t.id==='a6').done===true);
ok('지워진 할 일 없음', stored.every(t=> !t.deleted));

// 8. 매트릭스 안에서도 체크·별표가 동작한다
await page.evaluate(()=>{
  const row=[...document.querySelectorAll('.quad-cell.quad-1 .todo-line')][0];
  row.querySelector('[data-todo-star]').click();
});
await page.waitForTimeout(500);
const starred = await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-todos')||'[]').find(t=>t.id==='a1').starred);
ok('매트릭스에서도 별표가 눌림', starred===true, String(starred));
await page.evaluate(()=>{
  const row=[...document.querySelectorAll('.quad-cell.quad-3 .todo-line')][0];
  row.querySelector('input').click();
});
await page.waitForTimeout(800);
ok('매트릭스에서도 완료 처리됨', (await cellOf(3)).length===0, (await cellOf(3)).join());

// 9. 할 일 탭은 그대로
await page.click('[data-todo-tab="active"]');
await page.waitForTimeout(400);
ok('할 일 탭은 한 목록 그대로', (await page.$$('#todayPanel .quad-grid')).length===0);
ok('할 일 목록이 보임', (await page.$$('#todayPanel .todo-line')).length > 0);
ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
