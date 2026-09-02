// 오늘의 할 일 목록 — 전부 표시 · 마감일 순 · 상태 배지 · 목록 안 스크롤 · 카드 높이
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
const day = n => { const d = new Date(); d.setDate(d.getDate()+n); return key(d); };
const todos = [];
// 일부러 뒤섞어 넣는다 — 화면에서는 마감일 순으로 정렬돼야 한다
[ ['늦은 일 A', day(-3)], ['오늘 일 A', day(0)], ['날짜 없는 일', ''], ['앞으로 일 A', day(2)],
  ['늦은 일 B', day(-1)], ['앞으로 일 B', day(5)], ['오늘 일 B', day(0)] ]
  .forEach(([text, date], i) => todos.push({ id:`x${i}`, type:'todo', text, raw:text, date, done:false,
    createdAt:'2026-09-01T00:00:00.000Z', updatedAt:`2026-09-01T00:0${i}:00.000Z` }));
// 목록이 길어졌을 때를 보려고 20개 더
for (let i = 0; i < 20; i++) todos.push({ id:`y${i}`, type:'todo', text:`밀린 업무 ${i+1}`, raw:`밀린 업무 ${i+1}`,
  date: day(7+i), done:false, createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z' });
// 완료 항목 8개
for (let i = 0; i < 8; i++) todos.push({ id:`z${i}`, type:'todo', text:`끝낸 일 ${i+1}`, raw:`끝낸 일 ${i+1}`,
  date: day(-5), done:true, doneAt:`2026-09-01T0${i}:00:00.000Z`, createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z' });

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

// 1. 전부 표시
const activeCount = todos.filter(t=>!t.done).length;
ok('미완료 할 일이 처음부터 전부 보임', (await page.$$('#todayPanel .todo-item')).length===activeCount,
   `${(await page.$$('#todayPanel .todo-item')).length} / ${activeCount}`);
ok('전체 보기 버튼 없음', (await page.$$('#todoToggle')).length===0 && !(await page.textContent('#todayPanel')).includes('전체 보기'));
ok('탭 개수도 전체 개수', (await page.$eval('[data-todo-tab="active"] span', n=>n.textContent))===String(activeCount));

// 2. 정렬 — 마감일 빠른 순, 날짜 없는 항목은 맨 아래
const dates = await page.$$eval('#todayPanel .todo-item .todo-meta time', n=>n.map(x=>x.textContent));
const dated = dates.filter(d=>/^\d{4}-/.test(d));
ok('마감일이 빠른 순', dated.join('|')===[...dated].sort().join('|'), dated.slice(0,4).join(' → '));
ok('날짜 없는 항목은 여유 구역에', await page.evaluate(()=>
  [...document.querySelectorAll('.todo-group.easy .todo-item')].some(c=>c.textContent.includes('날짜 없음'))));

// 3. 상태 배지
const first = await page.$eval('#todayPanel .todo-item', n=>({ cls:n.className, text:n.textContent.replace(/\s+/g,' ').trim() }));
ok('급한 일 카드에 급함 배지', first.cls.includes('urgent') && first.text.includes('급함'), first.text.slice(0,30));
const rgb = s => (s.match(/\d+/g)||[0,0,0]).map(Number);
const lateBg = await page.$eval('#todayPanel .todo-item.urgent', n=>getComputedStyle(n).backgroundColor);
const plainBg = await page.$eval('#todayPanel .todo-item.easy', n=>getComputedStyle(n).backgroundColor);
ok('급한 카드 배경은 빨갛지 않음(흰 배경)', rgb(lateBg)[0]===rgb(lateBg)[1] && rgb(lateBg)[1]===rgb(lateBg)[2], lateBg);
const bars = await page.evaluate(()=>({
  urgent: getComputedStyle(document.querySelector('#todayPanel .todo-item.urgent')).borderLeftColor,
  easy: getComputedStyle(document.querySelector('#todayPanel .todo-item.easy')).borderLeftColor,
  width: getComputedStyle(document.querySelector('#todayPanel .todo-item.urgent')).borderLeftWidth }));
ok('급함은 왼쪽 빨간 선', rgb(bars.urgent)[0] > rgb(bars.urgent)[1] + 40, bars.urgent);
ok('여유는 왼쪽 남색 선', rgb(bars.easy)[2] > rgb(bars.easy)[0] + 20, bars.easy);
ok('왼쪽 선은 얇게', parseFloat(bars.width) <= 4, bars.width);
const easyColor = await page.$eval('#todayPanel .todo-badge.easy', n=>getComputedStyle(n).color);
ok('여유 배지는 남색 계열', rgb(easyColor)[2] > rgb(easyColor)[0], easyColor);
const futureColor = await page.$eval('#todayPanel .todo-item time.future', n=>getComputedStyle(n).color);
const fc = rgb(futureColor);
ok('앞으로 예정된 날짜는 회색(채도 낮음)', Math.max(...fc)-Math.min(...fc) <= 25, futureColor);

// 4. 목록 구분·여백·hover
const row = await page.$eval('#todayPanel .todo-item', n=>{
  const s=getComputedStyle(n);
  return { border:parseFloat(s.borderTopWidth), radius:parseFloat(s.borderTopLeftRadius),
           padTop:parseFloat(s.paddingTop), padBottom:parseFloat(s.paddingBottom), bg:s.backgroundColor };
});
ok('행마다 테두리·둥근 모서리', row.border>0 && row.radius>=5, JSON.stringify(row));
ok('카드 안쪽 여백 9~12px', row.padTop>=9 && row.padTop<=12, `${row.padTop}/${row.padBottom}`);
const card = await page.$eval('#todayPanel .todo-item', n=>{
  const s=getComputedStyle(n);
  return { h:parseFloat(s.height), minH:parseFloat(s.minHeight), maxH:parseFloat(s.maxHeight),
           radius:parseFloat(s.borderTopLeftRadius), pad:parseFloat(s.paddingTop),
           bg:s.backgroundColor, shadow:s.boxShadow };
});
ok('카드 높이 88px 고정', card.h===88 && card.minH===88 && card.maxH===88, JSON.stringify(card));
const sizes = await page.$$eval('#todayPanel .todo-item', n=>({
  h:[...new Set(n.map(x=>Math.round(x.getBoundingClientRect().height)))],
  w:[...new Set(n.map(x=>Math.round(x.getBoundingClientRect().width)))] }));
ok('제목 길이와 상관없이 모든 카드 크기가 같음', sizes.h.length===1 && sizes.w.length===1, JSON.stringify(sizes));
ok('모서리는 덜 둥글게(6px 안팎)', card.radius>=5 && card.radius<=8, `${card.radius}px`);
ok('카드 배경은 흰색', card.bg==='rgb(255, 255, 255)', card.bg);
ok('그림자는 아주 약하게', card.shadow!=='none' && !/rgba\(0, 0, 0, 0\.[3-9]/.test(card.shadow), card.shadow);
const gap = await page.$eval('.todo-group-list', n=>parseFloat(getComputedStyle(n).rowGap));
ok('항목 사이 간격', gap>=5, `${gap}px`);
await page.hover('#todayPanel .todo-item.easy');
await page.waitForTimeout(250);
const hoverBg = await page.$eval('#todayPanel .todo-item.easy', n=>getComputedStyle(n).backgroundColor);
ok('마우스를 올리면 배경이 진해짐', hoverBg!==plainBg, `${plainBg} → ${hoverBg}`);

// 5. 제목 한 줄 · 날짜 오른쪽
const textStyle = await page.$eval('#todayPanel .todo-text', n=>{
  const s=getComputedStyle(n);
  return { clamp:s.webkitLineClamp, overflow:s.overflow, size:parseFloat(s.fontSize), tooltip:n.getAttribute('title'), text:n.textContent };
});
ok('제목은 두 줄까지 · 넘치면 말줄임', textStyle.clamp==='2' && textStyle.overflow==='hidden', JSON.stringify(textStyle));
ok('제목 글씨 13~14px', textStyle.size>=13 && textStyle.size<=14, `${textStyle.size}px`);
ok('마우스를 올리면 전체 제목이 뜸', textStyle.tooltip===textStyle.text, textStyle.tooltip);

const sides = await page.evaluate(()=>{
  const item=document.querySelector('#todayPanel .todo-item');
  const check=item.querySelector('.todo-check').getBoundingClientRect();
  const text=item.querySelector('.todo-text').getBoundingClientRect();
  const meta=item.querySelector('.todo-badge').getBoundingClientRect();
  return { checkLeft:Math.round(check.left), textLeft:Math.round(text.left),
           checkFirst: check.right <= text.left + 1, metaBelow: meta.top >= text.bottom - 2,
           checkW: Math.round(check.width) };
});
ok('왼쪽 위 체크박스 · 그 오른쪽에 제목', sides.checkFirst && sides.textLeft > sides.checkLeft, JSON.stringify(sides));
const foot = await page.evaluate(()=>{
  const item=document.querySelector('#todayPanel .todo-item');
  const badge=item.querySelector('.todo-badge').getBoundingClientRect();
  const time=item.querySelector('time').getBoundingClientRect();
  return { badgeFirst: badge.right <= time.left, sameLine: Math.abs(badge.top-time.top)<10 };
});
ok('왼쪽 하단 급함/여유 · 오른쪽 하단 마감일', foot.badgeFirst && foot.sameLine, JSON.stringify(foot));
ok('상태와 날짜는 카드 아래쪽', sides.metaBelow, JSON.stringify(sides));
ok('체크박스는 작게', sides.checkW<=18, `${sides.checkW}px`);

// 6. 카드 안에서는 스크롤하지 않는다 — 전부 펼쳐 두고 페이지가 스크롤된다
const box = await page.evaluate(()=>{
  const groups=document.querySelector('.todo-groups');
  const grids=[...document.querySelectorAll('.todo-group-list')];
  const panel=document.querySelector('#todayPanel').getBoundingClientRect();
  const sched=document.querySelector('#schedulePanel').getBoundingClientRect();
  const styles=[groups, ...grids].map(el=>getComputedStyle(el));
  return { innerScroll: groups.scrollHeight>groups.clientHeight+1 || grids.some(g=>g.scrollHeight>g.clientHeight+1),
           fixedHeight: styles.some(s=>s.maxHeight!=='none' || s.overflowY==='auto' || s.overflowY==='scroll'),
           panelH:Math.round(panel.height), schedH:Math.round(sched.height),
           stacked: panel.top > sched.bottom - 2 };
});
ok('카드 안에서 스크롤하지 않음', !box.innerScroll, JSON.stringify(box));
ok('최대 높이·overflow 설정이 없음', !box.fixedHeight);
ok('두 영역 바깥 높이가 같음', Math.abs(box.schedH - box.panelH) < 2, `할 일 ${box.panelH} · 일정 ${box.schedH}`);
ok('높이 강제 클래스 제거됨', await page.evaluate(()=>!document.querySelector('.main-scroll').classList.contains('dash-fill')));

// 지연 · 오늘 · 예정 구역과 개수
const groups = await page.$$eval('.todo-group-head', n=>n.map(h=>h.textContent));
ok('급한 일 · 여유 있는 일 두 구역', groups.length===2 && groups[0].startsWith('오늘 당장 급한 일') && groups[1].startsWith('여유 있게 해야 할 일'), groups.join(' / '));
const counts = groups.map(g=>Number(g.replace(/[^0-9]/g,'')));
ok('구역 개수 합계 = 미완료 개수', counts.reduce((a,c)=>a+c,0)===activeCount, `${counts.join('+')} = ${activeCount}`);

// 왼쪽부터 채워지고, 남는 자리를 늘려 채우지 않는다
const flow = await page.evaluate(()=>{
  const list=document.querySelector('.todo-group.easy .todo-group-list');
  const style=getComputedStyle(list);
  const cards=[...list.querySelectorAll('.todo-item')].map(c=>c.getBoundingClientRect());
  const listBox=list.getBoundingClientRect();
  const firstRow=cards.filter(c=>Math.abs(c.top-cards[0].top)<2);
  const secondRow=cards.filter(c=>c.top>cards[0].top+2);
  return { display:style.display, cols:style.gridTemplateColumns.split(' ').length, gap:Math.round(parseFloat(style.gap)),
           leftAligned: Math.round(cards[0].left)===Math.round(listBox.left),
           perRow:firstRow.length, wrapped: secondRow.length>0,
           widths:[...new Set(cards.map(c=>Math.round(c.width)))] };
});
ok('한 줄에 세 장', flow.display==='grid' && flow.cols===3 && flow.perRow===3, JSON.stringify(flow));
ok('카드 사이 간격 10px', flow.gap===10, `${flow.gap}px`);
ok('맨 왼쪽부터 정렬', flow.leftAligned);
ok('모든 카드 너비가 같고 늘어나지 않음', flow.widths.length===1, flow.widths.join(', '));
ok('자리가 모자라면 다음 줄로 내려감', flow.wrapped, `첫 줄 ${flow.perRow}장`);

// 왼쪽 70% 할 일 · 오른쪽 30% 일정
const split = await page.evaluate(()=>{
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  const sched=document.querySelector('#schedulePanel').getBoundingClientRect();
  return { ratio: Math.round(todo.width/(todo.width+sched.width)*100), gap: Math.round(sched.left-todo.right),
           sameTop: Math.abs(todo.top-sched.top)<2, todoFirst: todo.left < sched.left,
           scheduleInTodo: document.querySelectorAll('#todayPanel [data-schedule]').length,
           todoInSchedule: document.querySelectorAll('#schedulePanel [data-todo-id]').length };
});
ok('왼쪽 70% : 오른쪽 30%', split.ratio>=68 && split.ratio<=72, `${split.ratio}%`);
ok('두 영역 사이 간격 16px', split.gap===16, `${split.gap}px`);
ok('시작 위치가 같음', split.sameTop, JSON.stringify(split));
ok('할 일이 왼쪽 · 일정이 오른쪽', split.todoFirst);
ok('왼쪽에 일정이 없음', split.scheduleInTodo===0, `${split.scheduleInTodo}건`);
ok('오른쪽에 할 일이 없음', split.todoInSchedule===0, `${split.todoInSchedule}건`);
ok('화면 위쪽에 따로 남은 일정 영역 없음', (await page.$$('#dashCols > section')).length===2);

// 7. 완료 탭도 전부 표시
await page.evaluate(()=>document.querySelector('[data-todo-tab="done"]').click());
await page.waitForTimeout(300);
ok('완료 탭도 전부 표시', (await page.$$('#todayPanel .todo-item.done')).length===8,
   `${(await page.$$('#todayPanel .todo-item.done')).length}개`);
const doneStyle = await page.$eval('#todayPanel .todo-item.done .todo-text', n=>getComputedStyle(n).textDecorationLine);
ok('완료 항목은 취소선', doneStyle.includes('line-through'), doneStyle);
const doneCard = await page.evaluate(()=>{
  const el=document.querySelector('#todayPanel .todo-item.done');
  const s=getComputedStyle(el);
  const rgb=v=>(v.match(/\d+/g)||[]).map(Number);
  const c=rgb(s.borderLeftColor);
  return { bg:s.backgroundColor, bar:s.borderLeftColor, gray: Math.max(...c)-Math.min(...c)<=25 };
});
ok('완료 카드는 아주 연한 회색 배경', doneCard.bg!=='rgb(255, 255, 255)', doneCard.bg);
ok('완료는 회색 포인트', doneCard.gray, doneCard.bar);

// 8. 체크 기능 그대로
await page.evaluate(()=>document.querySelector('[data-todo-tab="active"]').click());
await page.waitForTimeout(300);
const beforeCheck = (await page.$$('#todayPanel .todo-item')).length;
await page.evaluate(()=>document.querySelector('#todayPanel .todo-item input').click());
await page.waitForTimeout(500);
ok('체크하면 완료로 넘어감', (await page.$$('#todayPanel .todo-item')).length===beforeCheck-1);
ok('자료는 그대로 남음', await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-todos')).filter(t=>!t.deleted).length===35));

// 9. 모바일 — 날짜가 제목 아래로
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 820 });
await m.goto(base+'/index.html');
await m.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await m.waitForTimeout(600);
const mobile = await m.evaluate(()=>{
  const item=document.querySelector('#todayPanel .todo-item');
  const box=item.getBoundingClientRect();
  const list=item.parentElement.getBoundingClientRect();
  const text=item.querySelector('.todo-text').getBoundingClientRect();
  return { insideCard: box.right <= list.right + 1 && text.right <= box.right,
           overflowX: document.documentElement.scrollWidth-document.documentElement.clientWidth,
           rows: document.querySelectorAll('#todayPanel .todo-item').length,
           width: Math.round(box.width), listW: Math.round(list.width) };
});
ok('모바일에서 글자가 카드 밖으로 나가지 않음', mobile.insideCard, JSON.stringify(mobile));
ok('모바일 가로 스크롤 없음', mobile.overflowX===0, `${mobile.overflowX}px`);
ok('모바일에서도 전부 표시', mobile.rows===activeCount-1, `${mobile.rows}개`);
const mobileCols = await m.evaluate(()=>new Set([...document.querySelectorAll('#todayPanel .todo-item')].map(r=>Math.round(r.getBoundingClientRect().left))).size);
ok('아주 좁은 화면(390px)은 한 줄에 한 장', mobileCols===1, `${mobileCols}열`);
await m.setViewportSize({ width: 640, height: 900 });
await m.waitForTimeout(350);
const midMobile = await m.evaluate(()=>{
  const cards=[...document.querySelectorAll('.todo-group.easy .todo-item')].map(c=>c.getBoundingClientRect());
  return cards.filter(c=>Math.abs(c.top-cards[0].top)<2).length;
});
ok('좁은 화면(640px)은 한 줄에 두 장', midMobile===2, `${midMobile}장`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
