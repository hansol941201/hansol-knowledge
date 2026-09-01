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
ok('날짜 없는 항목이 가장 아래', dates.at(-1)==='날짜 확인', dates.at(-1));

// 3. 상태 배지
const first = await page.$eval('#todayPanel .todo-item', n=>({ cls:n.className, text:n.textContent.replace(/\s+/g,' ').trim() }));
ok('지연 항목에 지연 배지와 연한 빨강 배경', first.cls.includes('late') && first.text.includes('지연'), first.text.slice(0,30));
const lateBg = await page.$eval('#todayPanel .todo-item.late', n=>getComputedStyle(n).backgroundColor);
const plainBg = await page.$eval('#todayPanel .todo-item:not(.late)', n=>getComputedStyle(n).backgroundColor);
const rgb = s => (s.match(/\d+/g)||[0,0,0]).map(Number);
ok('지연 배경이 붉은 계열', rgb(lateBg)[0] > rgb(lateBg)[2], `${lateBg} vs ${plainBg}`);
ok('오늘 항목에 초록 오늘 배지', (await page.$$('#todayPanel .todo-badge.today')).length===2,
   `${(await page.$$('#todayPanel .todo-badge.today')).length}개`);
const todayColor = await page.$eval('#todayPanel .todo-badge.today', n=>getComputedStyle(n).color);
ok('오늘 배지는 초록', rgb(todayColor)[1] > rgb(todayColor)[0] && rgb(todayColor)[1] > rgb(todayColor)[2], todayColor);
const futureColor = await page.$eval('#todayPanel .todo-item time.future', n=>getComputedStyle(n).color);
const fc = rgb(futureColor);
ok('앞으로 예정된 날짜는 회색(채도 낮음)', Math.max(...fc)-Math.min(...fc) <= 25, futureColor);

// 4. 목록 구분·여백·hover
const row = await page.$eval('#todayPanel .todo-item', n=>{
  const s=getComputedStyle(n);
  return { border:parseFloat(s.borderTopWidth), radius:parseFloat(s.borderTopLeftRadius),
           padTop:parseFloat(s.paddingTop), padBottom:parseFloat(s.paddingBottom), bg:s.backgroundColor };
});
ok('행마다 테두리·둥근 모서리', row.border>0 && row.radius>=8, JSON.stringify(row));
ok('위아래 여백 확보(9px 이상)', row.padTop>=9 && row.padBottom>=9, `${row.padTop}/${row.padBottom}`);
const gap = await page.$eval('.todo-list', n=>parseFloat(getComputedStyle(n).rowGap));
ok('항목 사이 간격', gap>=5, `${gap}px`);
await page.hover('#todayPanel .todo-item:not(.late)');
await page.waitForTimeout(250);
const hoverBg = await page.$eval('#todayPanel .todo-item:not(.late)', n=>getComputedStyle(n).backgroundColor);
ok('마우스를 올리면 배경이 진해짐', hoverBg!==plainBg, `${plainBg} → ${hoverBg}`);

// 5. 제목 2줄 · 날짜 오른쪽
const clamp = await page.$eval('#todayPanel .todo-text', n=>getComputedStyle(n).webkitLineClamp);
ok('제목은 최대 2줄', clamp==='2', clamp);
const sides = await page.evaluate(()=>{
  const item=document.querySelector('#todayPanel .todo-item');
  const text=item.querySelector('.todo-text').getBoundingClientRect();
  const meta=item.querySelector('.todo-meta').getBoundingClientRect();
  return { textLeft:Math.round(text.left), metaLeft:Math.round(meta.left), sameRow:Math.abs(text.top-meta.top)<10 };
});
ok('제목은 왼쪽 · 날짜는 오른쪽', sides.metaLeft > sides.textLeft && sides.sameRow, JSON.stringify(sides));

// 6. 목록 안 스크롤 · 카드 높이
const box = await page.evaluate(()=>{
  const list=document.querySelector('.todo-list');
  const panel=document.querySelector('#todayPanel').getBoundingClientRect();
  const sched=document.querySelector('#schedulePanel').getBoundingClientRect();
  return { scrollable:list.scrollHeight>list.clientHeight+1, listH:Math.round(list.clientHeight),
           panelH:Math.round(panel.height), schedH:Math.round(sched.height),
           pageOverflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight };
});
ok('목록이 길면 목록 안에서 스크롤', box.scrollable, JSON.stringify(box));
ok('카드가 화면 밖으로 계속 길어지지 않음', box.panelH < 900, `${box.panelH}px`);
ok('일정 카드와 높이를 억지로 맞추지 않음', box.schedH < box.panelH, `할 일 ${box.panelH} · 일정 ${box.schedH}`);
ok('높이 강제 클래스 제거됨', await page.evaluate(()=>!document.querySelector('.main-scroll').classList.contains('dash-fill')));

// 7. 완료 탭도 전부 표시
await page.evaluate(()=>document.querySelector('[data-todo-tab="done"]').click());
await page.waitForTimeout(300);
ok('완료 탭도 전부 표시', (await page.$$('#todayPanel .todo-item.done')).length===8,
   `${(await page.$$('#todayPanel .todo-item.done')).length}개`);
const doneStyle = await page.$eval('#todayPanel .todo-item.done .todo-text', n=>getComputedStyle(n).textDecorationLine);
ok('완료 항목은 취소선', doneStyle.includes('line-through'), doneStyle);

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
  const text=item.querySelector('.todo-text').getBoundingClientRect();
  const meta=item.querySelector('.todo-meta').getBoundingClientRect();
  return { below: meta.top >= text.bottom - 2, aligned: Math.abs(meta.left-text.left)<2,
           overflowX: document.documentElement.scrollWidth-document.documentElement.clientWidth,
           rows: document.querySelectorAll('#todayPanel .todo-item').length };
});
ok('모바일에서 날짜가 제목 아래', mobile.below && mobile.aligned, JSON.stringify(mobile));
ok('모바일 가로 스크롤 없음', mobile.overflowX===0, `${mobile.overflowX}px`);
ok('모바일에서도 전부 표시', mobile.rows===activeCount-1, `${mobile.rows}개`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
