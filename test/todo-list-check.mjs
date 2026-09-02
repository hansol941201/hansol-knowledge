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
ok('날짜 없는 항목이 가장 아래', dates.at(-1)==='날짜 없음', dates.at(-1));

// 3. 상태 배지
const first = await page.$eval('#todayPanel .todo-item', n=>({ cls:n.className, text:n.textContent.replace(/\s+/g,' ').trim() }));
ok('지연 항목에 지연 배지', first.cls.includes('late') && first.text.includes('지연'), first.text.slice(0,30));
const rgb = s => (s.match(/\d+/g)||[0,0,0]).map(Number);
const lateBg = await page.$eval('#todayPanel .todo-item.late', n=>getComputedStyle(n).backgroundColor);
const plainBg = await page.$eval('#todayPanel .todo-item.future', n=>getComputedStyle(n).backgroundColor);
ok('지연 항목 배경은 빨갛지 않음(흰 배경)', rgb(lateBg)[0]===rgb(lateBg)[1] && rgb(lateBg)[1]===rgb(lateBg)[2], lateBg);
const bars = await page.evaluate(()=>({
  late: getComputedStyle(document.querySelector('#todayPanel .todo-item.late')).borderLeftColor,
  today: getComputedStyle(document.querySelector('#todayPanel .todo-item.today')).borderLeftColor,
  future: getComputedStyle(document.querySelector('#todayPanel .todo-item.future')).borderLeftColor,
  width: getComputedStyle(document.querySelector('#todayPanel .todo-item.late')).borderLeftWidth }));
ok('지연은 왼쪽 빨간 선', rgb(bars.late)[0] > rgb(bars.late)[1] + 40, bars.late);
ok('오늘은 왼쪽 초록 선', rgb(bars.today)[1] > rgb(bars.today)[0] + 40, bars.today);
ok('예정은 왼쪽 보라·회색 선', bars.future !== bars.late && bars.future !== bars.today, bars.future);
ok('왼쪽 선은 얇게', parseFloat(bars.width) <= 4, bars.width);
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
ok('조밀하지만 답답하지 않은 여백', row.padTop>=6 && row.padTop<=10, `${row.padTop}/${row.padBottom}`);
const rowH = await page.$eval('#todayPanel .todo-item', n=>Math.round(n.getBoundingClientRect().height));
ok('한 항목 높이 38~44px', rowH>=38 && rowH<=44, `${rowH}px`);
const heights = await page.$$eval('#todayPanel .todo-item', n=>[...new Set(n.map(x=>Math.round(x.getBoundingClientRect().height)))]);
ok('긴 제목이 있어도 높이가 들쭉날쭉하지 않음', heights.length===1, heights.join(' / '));
const gap = await page.$eval('.todo-group-list', n=>parseFloat(getComputedStyle(n).rowGap));
ok('항목 사이 간격', gap>=5, `${gap}px`);
await page.hover('#todayPanel .todo-item.future');
await page.waitForTimeout(250);
const hoverBg = await page.$eval('#todayPanel .todo-item.future', n=>getComputedStyle(n).backgroundColor);
ok('마우스를 올리면 배경이 진해짐', hoverBg!==plainBg, `${plainBg} → ${hoverBg}`);

// 5. 제목 한 줄 · 날짜 오른쪽
const textStyle = await page.$eval('#todayPanel .todo-text', n=>{
  const s=getComputedStyle(n);
  return { wrap:s.whiteSpace, ellipsis:s.textOverflow, tooltip:n.getAttribute('title'), text:n.textContent };
});
ok('제목은 한 줄 말줄임', textStyle.wrap==='nowrap' && textStyle.ellipsis==='ellipsis', JSON.stringify(textStyle));
ok('마우스를 올리면 전체 제목이 뜸', textStyle.tooltip===textStyle.text, textStyle.tooltip);

const sides = await page.evaluate(()=>{
  const item=document.querySelector('#todayPanel .todo-item');
  const text=item.querySelector('.todo-text').getBoundingClientRect();
  const meta=item.querySelector('.todo-meta').getBoundingClientRect();
  return { textLeft:Math.round(text.left), metaLeft:Math.round(meta.left), sameRow:Math.abs(text.top-meta.top)<10 };
});
ok('제목은 왼쪽 · 날짜는 오른쪽', sides.metaLeft > sides.textLeft && sides.sameRow, JSON.stringify(sides));

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
ok('일정이 위, 할 일이 아래로 배치됨', box.stacked, `일정 아래끝보다 할 일 위쪽이 아래에 있음`);
ok('두 카드 높이를 억지로 맞추지 않음', box.schedH !== box.panelH, `할 일 ${box.panelH} · 일정 ${box.schedH}`);
ok('높이 강제 클래스 제거됨', await page.evaluate(()=>!document.querySelector('.main-scroll').classList.contains('dash-fill')));

// 지연 · 오늘 · 예정 구역과 개수
const groups = await page.$$eval('.todo-group-head', n=>n.map(h=>h.textContent));
ok('지연·오늘·예정 구역으로 나뉨', groups.length===3 && groups[0].startsWith('지연') && groups[1].startsWith('오늘') && groups[2].startsWith('예정'), groups.join(' / '));
const counts = groups.map(g=>Number(g.replace(/[^0-9]/g,'')));
ok('구역 개수 합계 = 미완료 개수', counts.reduce((a,c)=>a+c,0)===activeCount, `${counts.join('+')} = ${activeCount}`);

// 데스크톱 2열
const cols = await page.evaluate(()=>new Set([...document.querySelectorAll('.todo-group.future .todo-item')].map(r=>Math.round(r.getBoundingClientRect().left))).size);
ok('넓은 화면에서 3열', cols===3, `${cols}열`);

// 중간 화면(태블릿)에서는 2열
await page.setViewportSize({ width: 1100, height: 950 });
await page.waitForTimeout(300);
const midCols = await page.evaluate(()=>new Set([...document.querySelectorAll('.todo-group.future .todo-item')].map(r=>Math.round(r.getBoundingClientRect().left))).size);
ok('중간 화면에서 2열', midCols===2, `${midCols}열`);
await page.setViewportSize({ width: 1500, height: 950 });
await page.waitForTimeout(300);

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
  return { oneLine: Math.abs(meta.top-text.top) < 12, metaRight: meta.left > text.right - 2,
           overflowX: document.documentElement.scrollWidth-document.documentElement.clientWidth,
           rows: document.querySelectorAll('#todayPanel .todo-item').length,
           height: Math.round(item.getBoundingClientRect().height) };
});
ok('모바일에서도 한 줄 · 배지와 날짜는 오른쪽', mobile.oneLine && mobile.metaRight, JSON.stringify(mobile));
ok('모바일 가로 스크롤 없음', mobile.overflowX===0, `${mobile.overflowX}px`);
ok('모바일에서도 전부 표시', mobile.rows===activeCount-1, `${mobile.rows}개`);
const mobileCols = await m.evaluate(()=>new Set([...document.querySelectorAll('#todayPanel .todo-item')].map(r=>Math.round(r.getBoundingClientRect().left))).size);
ok('모바일은 반드시 1열', mobileCols===1, `${mobileCols}열`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
