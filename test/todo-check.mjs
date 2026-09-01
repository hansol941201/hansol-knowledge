// 오늘의 할 일 — 상태 배지 제거 · 수정 · 완료 이동 · 완료 탭
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
const seed=['천민호부사장 택배 확인','자오건설 협약서 회신','금화기업 견적서 발송'].map((text,i)=>({
  id:`t${i+1}`, type:'todo', text, raw:text, date:'2026-08-26', done:false, source:'테스트',
  createdAt:`2026-08-26T0${i+1}:00:00.000Z`, updatedAt:`2026-08-26T0${i+1}:00:00.000Z` }));
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.addInitScript(l=>{localStorage.setItem('knowledge-todos',JSON.stringify(l));},seed);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const ready = async () => {
  await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
  await page.waitForTimeout(600);
};
await page.goto(base+'/index.html'); await ready();
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const texts = () => page.$$eval('#todayPanel .todo-item .todo-text', n=>n.map(x=>x.textContent));
const panelText = () => page.textContent('#todayPanel');

// 1. 상태 배지 제거 · 날짜 유지
ok('진행중 배지 없음', (await page.$$('#todayPanel .todo-state')).length===0 && !(await panelText()).includes('진행중'));
ok('날짜는 오른쪽에 유지', (await page.$eval('#todayPanel .todo-item time', n=>n.textContent))==='2026-08-26');
const order = await page.$eval('#todayPanel .todo-item', n=>[...n.querySelectorAll('*')].map(c=>c.tagName+'.'+(typeof c.className==='string'?c.className:'')).join('|'));
ok('체크 → 내용 → 날짜 → 수정 → 삭제 순', /todo-check.*todo-text.*TIME.*todo-mini.*todo-remove/.test(order), order);

// 2. 수정
const row = (text) => `#todayPanel .todo-item:has-text("${text}")`;
await page.click(`${row('천민호')} [data-todo-edit]`); await page.waitForTimeout(300);
ok('수정 창 열림', await page.isVisible('#todoForm'));
ok('기존 값이 채워짐', (await page.inputValue('#todoEditText'))==='천민호부사장 택배 확인' && (await page.inputValue('#todoEditDate'))==='2026-08-26');
await page.click('#todoEditCancel'); await page.waitForTimeout(200);
ok('취소하면 그대로', !(await page.isVisible('#todoForm')) && (await texts()).includes('천민호부사장 택배 확인'));
await page.click(`${row('천민호')} [data-todo-edit]`); await page.waitForTimeout(300);
await page.fill('#todoEditText','천민호부사장 택배 확인(수정)');
await page.fill('#todoEditDate','2026-08-28');
await page.click('#todoForm button[type="submit"]'); await page.waitForTimeout(400);
ok('내용·날짜 수정됨', (await panelText()).includes('천민호부사장 택배 확인(수정)') && (await panelText()).includes('2026-08-28'));
ok('로컬에 저장', await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-todos')).some(t=>t.text==='천민호부사장 택배 확인(수정)' && t.date==='2026-08-28')));
ok('클라우드에도 저장', await page.evaluate(async()=>{const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.todos||[]).some(t=>t.text==='천민호부사장 택배 확인(수정)');}));

// 3. 체크 → 완료로 이동 + 실행 취소
const before = (await texts()).length;
await page.click(`${row('자오건설')} .todo-check`); await page.waitForTimeout(600);
ok('체크하면 목록에서 사라짐', !(await texts()).some(t=>t.includes('자오건설')) && (await texts()).length===before-1);
ok('데이터는 남아 있음', await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-todos')).some(t=>t.text.includes('자오건설') && t.done && !t.deleted)));
ok('실행 취소 안내 표시', await page.isVisible('.toast.with-action') && (await page.textContent('.toast')).includes('실행 취소'));
await page.click('.toast.with-action button'); await page.waitForTimeout(400);
ok('실행 취소로 복구', (await texts()).some(t=>t.includes('자오건설')));

// 4. 완료 탭
await page.click(`${row('금화기업')} .todo-check`); await page.waitForTimeout(700);
await page.click('[data-todo-tab="done"]'); await page.waitForTimeout(300);
ok('완료 탭에 모임', (await panelText()).includes('금화기업'));
ok('완료 탭에 기존 날짜와 완료일', (await panelText()).includes('2026-08-26') && (await panelText()).includes('완료 '));
ok('탭 개수 표시', (await page.$eval('[data-todo-tab="done"] span', n=>n.textContent))==='1');
await page.click('#todayPanel [data-todo-restore]'); await page.waitForTimeout(400);
ok('복구', (await page.$eval('[data-todo-tab="done"] span', n=>n.textContent))==='0');
await page.click('[data-todo-tab="active"]'); await page.waitForTimeout(300);
ok('복구 후 할 일 목록에 다시 표시', (await texts()).some(t=>t.includes('금화기업')));

// 영구 삭제 (확인창)
await page.click(`${row('금화기업')} .todo-check`); await page.waitForTimeout(700);
await page.click('[data-todo-tab="done"]'); await page.waitForTimeout(300);
page.once('dialog', d=>{ ok('영구 삭제 전 확인창', d.message().includes('영구 삭제')); d.dismiss(); });
await page.click('#todayPanel [data-todo-purge]'); await page.waitForTimeout(400);
ok('취소하면 남아 있음', (await panelText()).includes('금화기업'));
page.once('dialog', d=>d.accept());
await page.click('#todayPanel [data-todo-purge]'); await page.waitForTimeout(500);
ok('확인하면 영구 삭제', !(await panelText()).includes('금화기업'));

// 완료 목록 비우기
await page.click('[data-todo-tab="active"]'); await page.waitForTimeout(250);
await page.click(`${row('자오건설')} .todo-check`); await page.waitForTimeout(700);
await page.click('[data-todo-tab="done"]'); await page.waitForTimeout(300);
page.once('dialog', d=>{ ok('완료 목록 비우기 확인창', d.message().includes('영구 삭제')); d.accept(); });
await page.click('#todoClearDone'); await page.waitForTimeout(500);
ok('완료 목록 비워짐', (await page.$eval('[data-todo-tab="done"] span', n=>n.textContent))==='0');

// 5. 전체 보기(사이드바 할 일) 화면에도 동일
await page.click('[data-todo-tab="active"]'); await page.waitForTimeout(250);
await page.click('#sideNav button:has-text("할 일")'); await page.waitForTimeout(400);
ok('전체 보기에도 탭 표시', await page.isVisible('[data-todo-tab="done"]'));
ok('전체 보기에도 배지 없음', !(await panelText()).includes('진행중'));
await page.click(`${row('천민호')} .todo-check`); await page.waitForTimeout(700);
await page.click('[data-todo-tab="done"]'); await page.waitForTimeout(300);
ok('전체 보기에서 완료 처리', (await panelText()).includes('천민호'));
await page.click('#sideNav button:has-text("대시보드")'); await page.waitForTimeout(400);
ok('대시보드에도 즉시 반영(완료 탭 상태 유지)', (await panelText()).includes('천민호'));
await page.click('[data-todo-tab="active"]'); await page.waitForTimeout(300);
ok('대시보드 할 일 목록에서는 사라짐', !(await texts()).some(t=>t.includes('천민호')));
await page.click('[data-todo-tab="done"]'); await page.waitForTimeout(250);
await page.click('#todayPanel [data-todo-restore]'); await page.waitForTimeout(400);
await page.click('[data-todo-tab="active"]'); await page.waitForTimeout(300);
ok('완료 탭에서 복구하면 대시보드에도 반영', (await texts()).some(t=>t.includes('천민호')));

// 6. 새로고침 후에도 유지
await page.reload(); await ready();
ok('새로고침 후 수정 내용 유지', (await panelText()).includes('천민호부사장 택배 확인(수정)') && (await panelText()).includes('2026-08-28'));

// 이전 데이터 구조 호환 (type·doneAt 없는 옛 완료 항목)
await page.evaluate(()=>{
  todos.push({ id:'legacy-1', text:'구버전 완료 항목', date:'2026-08-20', done:true,
    createdAt:'2026-08-20T01:00:00.000Z', updatedAt:'2026-08-20T02:00:00.000Z' });
  saveTodos(); renderTodos();
});
await page.waitForTimeout(1200);      // 클라우드 저장이 끝난 뒤에 새로고침
await page.reload(); await ready();
await page.click('[data-todo-tab="done"]'); await page.waitForTimeout(300);
ok('type·doneAt 없는 옛 데이터도 완료 탭에 표시', (await panelText()).includes('구버전 완료 항목'));
ok('완료일이 없으면 수정 시각으로 대체', (await panelText()).includes('완료 '));

// 모바일에서 겹치지 않는지
await page.click('[data-todo-tab="active"]'); await page.waitForTimeout(300);
await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(400);
const mobile = await page.evaluate(()=>{
  const row=document.querySelector('#todayPanel .todo-item');
  if(!row) return {none:true};
  const kids=[...row.children]
    .filter(el=>{ const c=getComputedStyle(el); return c.opacity!=='0' && c.visibility!=='hidden' && c.position!=='absolute'; })
    .filter(el=>el.getBoundingClientRect().width>0).map(el=>el.getBoundingClientRect());
  let overlap=false;
  for(let i=0;i<kids.length;i+=1) for(let j=i+1;j<kids.length;j+=1){
    const a=kids[i], bx=kids[j];
    if(a.left < bx.right-1 && bx.left < a.right-1 && a.top < bx.bottom-1 && bx.top < a.bottom-1) overlap=true;
  }
  const box=row.getBoundingClientRect();
  return { overlap, inside: kids.every(k=>k.right <= box.right+1),
           editVisible: getComputedStyle(row.querySelector('[data-todo-edit]')).opacity==='1' };
});
ok('모바일에서 버튼·체크박스 겹침 없음', !mobile.overlap && mobile.inside, JSON.stringify(mobile));
ok('모바일에서 수정 버튼이 항상 보임', mobile.editVisible, JSON.stringify(mobile));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
