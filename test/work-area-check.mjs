// 대시보드 업무 영역 — 오른쪽 할 일 목록과 일정, 기존 기능 유지
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
const todos = [
  ['지난 마감 업무', -2], ['오늘 마감 업무', 0], ['모레 마감 업무', 2], ['다음 주 업무', 6]
].map(([text,n],i)=>({ id:`t${i}`, type:'todo', text, raw:text, date:day(n), done:false,
  createdAt:'2026-09-01T00:00:00.000Z', updatedAt:`2026-09-01T00:0${i}:00.000Z` }));
todos.push({ id:'t9', type:'todo', text:'날짜 없는 업무', raw:'날짜 없는 업무', date:'', done:false,
  createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:09:00.000Z' });
const schedule = [
  { id:'s0', type:'schedule', date:day(-6), time:'10:00', title:'지난 회의', memo:'', createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z' },
  { id:'s1', type:'schedule', date:day(3), time:'09:00', title:'2차 미팅 수지씨앤에스', memo:'', createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z' },
  { id:'s2', type:'schedule', date:day(8), time:'14:00', title:'예보이앤씨 1차 미팅', memo:'', createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z' }
];

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.addInitScript(`localStorage.setItem('knowledge-todos', ${JSON.stringify(JSON.stringify(todos))});
  localStorage.setItem('knowledge-schedule', ${JSON.stringify(JSON.stringify(schedule))});`);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog', d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 시안대로 구역 없이 한 줄 목록 하나로 보여 준다.
const rowOf = (text) => page.evaluate(t=>{
  const row=[...document.querySelectorAll('#todayPanel .todo-line')].find(c=>c.textContent.includes(t));
  return Boolean(row);
}, text);
ok('급함·여유 구역 없이 한 목록', (await page.$$('#todayPanel .todo-group')).length===0
  && (await page.$$('#todayPanel .todo-list')).length===1);
ok('마감일이 지난 업무도 목록에', await rowOf('지난 마감 업무'));
ok('마감일이 오늘인 업무도 목록에', await rowOf('오늘 마감 업무'));
ok('마감일이 미래인 업무도 목록에', await rowOf('모레 마감 업무'));
ok('마감일이 없는 업무도 목록에', await rowOf('날짜 없는 업무'));
ok('죽은 업무 구분 선택란 없음', (await page.$$('.urgency-pick')).length===0);

// 수정 창은 내용과 날짜만
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-line')]
  .find(c=>c.textContent.includes('모레 마감 업무')).querySelector('.todo-line-text').click());
await page.waitForTimeout(300);
ok('수정 창이 열림', await page.isVisible('#todoModal') && (await page.inputValue('#todoEditText'))==='모레 마감 업무');
await page.fill('#todoEditText','이름 고친 업무');
await page.click('#todoForm button[type="submit"]');
await page.waitForTimeout(500);
ok('수정 내용이 저장됨', await rowOf('이름 고친 업무'));

// 새로 등록
await page.click('#pageAdd'); await page.waitForTimeout(250);
await page.evaluate(()=>[...document.querySelectorAll('[data-add]')].find(b=>b.dataset.add==='할 일').click());
await page.waitForTimeout(250);
await page.fill('#quickTextInput','새로 만든 업무');
await page.click('#quickTextForm button[type="submit"]');
await page.waitForTimeout(700);
ok('새 업무가 목록에 들어감', await rowOf('새로 만든 업무'));

// 완료 체크 · 탭
const beforeActive = (await page.$$('#todayPanel .todo-line')).length;
await page.evaluate(()=>[...document.querySelectorAll('#todayPanel .todo-line')]
  .find(c=>c.textContent.includes('날짜 없는 업무')).querySelector('input[type="checkbox"]').click());
await page.waitForTimeout(600);
ok('체크하면 할 일 목록에서 빠짐', (await page.$$('#todayPanel .todo-line')).length===beforeActive-1);
await page.evaluate(()=>document.querySelector('[data-todo-tab="done"]').click());
await page.waitForTimeout(400);
ok('완료 탭에 들어옴', (await page.textContent('#todayPanel')).includes('날짜 없는 업무'));
ok('완료 탭에는 일정이 없음', (await page.$$('#todayPanel [data-schedule]')).length===0);
await page.evaluate(()=>document.querySelector('[data-todo-tab="active"]').click());
await page.waitForTimeout(400);
ok('할 일 탭으로 되돌아옴', await page.isVisible('#todayPanel .todo-list'));

// 일정 — 오른쪽 영역에서만
ok('일정이 오른쪽 영역에만 있음', (await page.$$('#schedulePanel [data-schedule]')).length===2 && (await page.$$('#todayPanel [data-schedule]')).length===0);
const scheduleOrder = await page.$$eval('#schedulePanel .schedule-group-head b', n=>n.map(x=>x.textContent));
ok('가까운 일정부터 날짜순', scheduleOrder.length===2, scheduleOrder.join(' / '));
const timeBadge = await page.$eval('#schedulePanel .schedule-date', n=>({ text:n.textContent, color:getComputedStyle(n).color }));
ok('시간이 보라색 배지', /\d{2}:\d{2}/.test(timeBadge.text) && (timeBadge.color.match(/\d+/g)||[]).map(Number)[2] > (timeBadge.color.match(/\d+/g)||[]).map(Number)[1], JSON.stringify(timeBadge));
const listStyle = await page.$eval('#schedulePanel .schedule-list', n=>({ display:getComputedStyle(n).display, overflow:getComputedStyle(n).overflowY }));
// 카드 안에서 따로 스크롤하지 않는다 — 길어지면 페이지 전체가 스크롤된다.
ok('일정은 세로 목록 · 카드 안 스크롤 없음', listStyle.display==='grid' && listStyle.overflow==='visible', JSON.stringify(listStyle));

// 지난 일정 · 일정 추가 · 수정
ok('지난 일정 버튼 있음', await page.isVisible('#schedulePast'));
await page.click('#schedulePast'); await page.waitForTimeout(400);
ok('지난 일정이 보임', (await page.textContent('#schedulePanel')).includes('지난 회의'));
await page.click('#schedulePast'); await page.waitForTimeout(400);
ok('다가오는 일정으로 되돌아옴', !(await page.textContent('#schedulePanel')).includes('지난 회의'));
await page.click('#scheduleAdd'); await page.waitForTimeout(300);
ok('＋ 일정 창이 열림', await page.isVisible('#scheduleModal'));
await page.fill('#scheduleTitle','새 일정 시험');
await page.fill('#scheduleDate', day(4));
await page.fill('#scheduleTime','11:00');
await page.click('#scheduleForm button[type="submit"]');
await page.waitForTimeout(600);
ok('일정 추가 동작', (await page.textContent('#schedulePanel')).includes('새 일정 시험'));
await page.evaluate(()=>{
  const row=[...document.querySelectorAll('#schedulePanel [data-schedule]')].find(r=>r.textContent.includes('새 일정 시험'));
  row.click();
});
await page.waitForTimeout(300);
ok('일정을 누르면 수정 창이 열림', await page.isVisible('#scheduleModal') && (await page.inputValue('#scheduleTitle'))==='새 일정 시험');
await page.fill('#scheduleTitle','고친 일정');
await page.click('#scheduleForm button[type="submit"]');
await page.waitForTimeout(600);
ok('일정 수정 동작', (await page.textContent('#schedulePanel')).includes('고친 일정'));

// 기존 데이터 유지
ok('할 일 자료가 그대로 남음', await page.evaluate(()=>
  JSON.parse(localStorage.getItem('knowledge-todos')).filter(t=>!t.deleted).length===6));
ok('일정 자료가 그대로 남음', await page.evaluate(()=>
  JSON.parse(localStorage.getItem('knowledge-schedule')).filter(t=>!t.deleted).length===4));
ok('클라우드에도 저장됨', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.todos||[]).length>=6 && (d.schedule||[]).length>=4; }));

// 모바일 — 위아래로 바뀌는지
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 850 });
await m.goto(base+'/index.html');
await m.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await m.waitForTimeout(600);
const mobile = await m.evaluate(()=>{
  const memo=document.querySelector('#memoPanel').getBoundingClientRect();
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  const sched=document.querySelector('#schedulePanel').getBoundingClientRect();
  const cards=[...document.querySelectorAll('#todayPanel .todo-line')].map(c=>c.getBoundingClientRect());
  return { 차례: memo.bottom <= todo.top + 2 && todo.bottom <= sched.top + 2,
           sameWidth: Math.abs(todo.width-sched.width)<2 && Math.abs(memo.width-todo.width)<2,
           perRow: cards.filter(c=>Math.abs(c.top-cards[0].top)<2).length,
           overflowX: document.documentElement.scrollWidth-document.documentElement.clientWidth };
});
ok('모바일 차례: 메모 → 할 일 → 일정', mobile.차례 && mobile.sameWidth, JSON.stringify(mobile));
ok('모바일 카드 한 줄에 한 장', mobile.perRow===1, `${mobile.perRow}장`);
ok('모바일 가로 스크롤 없음', mobile.overflowX===0, `${mobile.overflowX}px`);

// 태블릿 — 65:35, 두 장
await m.setViewportSize({ width: 1100, height: 900 });
await m.waitForTimeout(400);
const tablet = await m.evaluate(()=>{
  const memo=document.querySelector('#memoPanel').getBoundingClientRect();
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  const sched=document.querySelector('#schedulePanel').getBoundingClientRect();
  const rows=[...document.querySelectorAll('#todayPanel .todo-line')].map(c=>c.getBoundingClientRect());
  return { ratio: Math.round(todo.width/(todo.width+memo.width)*100),
           sideBySide: Math.abs(memo.top-todo.top)<2 && todo.left < memo.left,
           일정도오른쪽: sched.left >= todo.right - 2 && sched.top >= memo.bottom - 2,
           perRow: rows.filter(c=>Math.abs(c.top-rows[0].top)<2).length };
});
ok('태블릿에서도 두 단 유지', tablet.sideBySide, JSON.stringify(tablet));
ok('태블릿 할 일 쪽이 더 넓다(52~58%)', tablet.ratio>=52 && tablet.ratio<=58, `${tablet.ratio}%`);
ok('태블릿에서도 일정은 메모 아래 오른쪽', tablet.일정도오른쪽, JSON.stringify(tablet));
ok('할 일은 한 줄에 하나', tablet.perRow===1, `${tablet.perRow}장`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
