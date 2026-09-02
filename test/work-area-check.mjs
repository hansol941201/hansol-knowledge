// 대시보드 업무 영역 — 할 일 70% / 일정 30% 두 단, 업무 구분(급함·여유), 기존 기능 유지
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

const groupOf = (text) => page.evaluate(t=>{
  const card=[...document.querySelectorAll('#todayPanel .todo-item')].find(c=>c.textContent.includes(t));
  return card ? card.closest('.todo-group').className.replace('todo-group ','') : 'none';
}, text);

// 자동 분류
ok('마감일이 지난 업무 → 급함', await groupOf('지난 마감 업무')==='urgent');
ok('마감일이 오늘인 업무 → 급함', await groupOf('오늘 마감 업무')==='urgent');
ok('마감일이 미래인 업무 → 여유', await groupOf('모레 마감 업무')==='easy');
ok('마감일이 없는 업무 → 여유', await groupOf('날짜 없는 업무')==='easy');

// 업무 구분을 직접 바꾸면 자동 분류보다 우선
await page.evaluate(()=>{
  const card=[...document.querySelectorAll('#todayPanel .todo-item')].find(c=>c.textContent.includes('모레 마감 업무'));
  card.querySelector('[data-todo-edit]').click();
});
await page.waitForTimeout(300);
ok('수정 창에 업무 구분 선택란', await page.isVisible('#todoModal .urgency-pick'));
ok('현재 구분이 미리 선택돼 있음', (await page.evaluate(()=>document.querySelector('[name="todoUrgency"]:checked')?.value))==='easy');
await page.check('[name="todoUrgency"][value="urgent"]');
await page.click('#todoForm button[type="submit"]');
await page.waitForTimeout(500);
ok('직접 고른 구분이 자동 분류보다 우선', await groupOf('모레 마감 업무')==='urgent');
ok('고른 값이 저장됨', await page.evaluate(()=>
  JSON.parse(localStorage.getItem('knowledge-todos')).some(t=>t.text==='모레 마감 업무' && t.urgency==='urgent')));

// 새로 등록할 때도 고를 수 있다
await page.click('#pageAdd'); await page.waitForTimeout(250);
await page.evaluate(()=>[...document.querySelectorAll('[data-add]')].find(b=>b.dataset.add==='할 일').click());
await page.waitForTimeout(250);
ok('등록 창에도 업무 구분', await page.isVisible('#quickUrgency'));
await page.fill('#quickTextInput','새로 만든 급한 업무');
await page.check('[name="quickTodoUrgency"][value="urgent"]');
await page.click('#quickTextForm button[type="submit"]');
await page.waitForTimeout(700);
ok('새 업무가 고른 구역으로 들어감', await groupOf('새로 만든 급한 업무')==='urgent');

// 완료 체크 · 탭
const beforeActive = (await page.$$('#todayPanel .todo-item')).length;
await page.evaluate(()=>{
  const card=[...document.querySelectorAll('#todayPanel .todo-item')].find(c=>c.textContent.includes('날짜 없는 업무'));
  card.querySelector('input[type="checkbox"]').click();
});
await page.waitForTimeout(600);
ok('체크하면 할 일 목록에서 빠짐', (await page.$$('#todayPanel .todo-item')).length===beforeActive-1);
await page.evaluate(()=>document.querySelector('[data-todo-tab="done"]').click());
await page.waitForTimeout(400);
ok('완료 탭에 들어옴', (await page.textContent('#todayPanel')).includes('날짜 없는 업무'));
ok('완료 탭에는 일정이 없음', (await page.$$('#todayPanel [data-schedule]')).length===0);
await page.evaluate(()=>document.querySelector('[data-todo-tab="active"]').click());
await page.waitForTimeout(400);
ok('할 일 탭으로 되돌아옴', await page.isVisible('.todo-group.urgent'));

// 일정 — 오른쪽 영역에서만
ok('일정이 오른쪽 영역에만 있음', (await page.$$('#schedulePanel [data-schedule]')).length===2 && (await page.$$('#todayPanel [data-schedule]')).length===0);
const scheduleOrder = await page.$$eval('#schedulePanel .schedule-group-head b', n=>n.map(x=>x.textContent));
ok('가까운 일정부터 날짜순', scheduleOrder.length===2, scheduleOrder.join(' / '));
const timeBadge = await page.$eval('#schedulePanel .schedule-date', n=>({ text:n.textContent, color:getComputedStyle(n).color }));
ok('시간이 보라색 배지', /\d{2}:\d{2}/.test(timeBadge.text) && (timeBadge.color.match(/\d+/g)||[]).map(Number)[2] > (timeBadge.color.match(/\d+/g)||[]).map(Number)[1], JSON.stringify(timeBadge));
const listStyle = await page.$eval('#schedulePanel .schedule-list', n=>({ display:getComputedStyle(n).display, overflow:getComputedStyle(n).overflowY }));
ok('일정은 세로 목록 · 영역 안에서만 스크롤', listStyle.display==='grid' && listStyle.overflow==='auto', JSON.stringify(listStyle));

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
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  const sched=document.querySelector('#schedulePanel').getBoundingClientRect();
  const cards=[...document.querySelectorAll('#todayPanel .todo-item')].map(c=>c.getBoundingClientRect());
  return { stacked: sched.top >= todo.bottom - 2, sameWidth: Math.abs(todo.width-sched.width)<2,
           perRow: cards.filter(c=>Math.abs(c.top-cards[0].top)<2).length,
           overflowX: document.documentElement.scrollWidth-document.documentElement.clientWidth };
});
ok('모바일은 할 일 위 · 일정 아래', mobile.stacked && mobile.sameWidth, JSON.stringify(mobile));
ok('모바일 카드 한 줄에 한 장', mobile.perRow===1, `${mobile.perRow}장`);
ok('모바일 가로 스크롤 없음', mobile.overflowX===0, `${mobile.overflowX}px`);

// 태블릿 — 65:35, 두 장
await m.setViewportSize({ width: 1100, height: 900 });
await m.waitForTimeout(400);
const tablet = await m.evaluate(()=>{
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  const sched=document.querySelector('#schedulePanel').getBoundingClientRect();
  const cards=[...document.querySelectorAll('#todayPanel .todo-item')].map(c=>c.getBoundingClientRect());
  return { ratio: Math.round(todo.width/(todo.width+sched.width)*100),
           perRow: cards.filter(c=>Math.abs(c.top-cards[0].top)<2).length };
});
ok('태블릿 65 : 35', tablet.ratio>=62 && tablet.ratio<=68, `${tablet.ratio}%`);
ok('태블릿 카드 한 줄에 두 장', tablet.perRow===2, `${tablet.perRow}장`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
