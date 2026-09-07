// 할 일 목록 — 전부 표시 · 마감일 순 · 완료 탭 · 좁은 화면
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

// 1. 전부 표시 (접거나 자르지 않는다)
const activeCount = todos.filter(t=>!t.done).length;
const lines = async () => (await page.$$('#todayPanel .todo-line')).length;
ok('미완료 할 일이 처음부터 전부 보임', await lines()===activeCount, `${await lines()} / ${activeCount}`);
ok('전체 보기 버튼 없음', (await page.$$('#todoToggle')).length===0 && !(await page.textContent('#todayPanel')).includes('전체 보기'));
ok('탭 개수도 전체 개수', (await page.$eval('[data-todo-tab="active"] span', n=>n.textContent))===String(activeCount));
ok('머리말 개수 배지도 같은 수', (await page.textContent('.todo-count'))===`${activeCount}개`);

// 2. 정렬 — 마감일 빠른 순, 날짜 없는 항목은 맨 아래
const dates = await page.$$eval('#todayPanel .todo-line time', n=>n.map(x=>x.textContent));
const dated = dates.filter(d=>/^\d{4}-/.test(d));
ok('마감일이 빠른 순', dated.join('|')===[...dated].sort().join('|'), dated.slice(0,4).join(' → '));
ok('날짜 없는 항목은 날짜 칸이 비어 있음', await page.evaluate(()=>{
  const row=[...document.querySelectorAll('#todayPanel .todo-line')].find(n=>n.textContent.includes('날짜 없는 일'));
  return Boolean(row) && !row.querySelector('time'); }));

// 3. 지난 날짜는 빨강, 오늘은 초록 (한눈에 구분)
const dateColors = await page.evaluate(()=>{
  const pick = cls => { const el=document.querySelector(`#todayPanel .todo-line time.${cls}`); return el?getComputedStyle(el).color:''; };
  return { late: pick('late'), today: pick('today') };
});
const rgb = s => (s.match(/\d+/g)||[0,0,0]).map(Number);
ok('지난 마감일은 빨간 글씨', rgb(dateColors.late)[0] > rgb(dateColors.late)[1] + 40, dateColors.late);
ok('오늘 마감일은 초록 글씨', rgb(dateColors.today)[1] > rgb(dateColors.today)[0] + 30, dateColors.today);

// 4. 한 줄짜리 목록 — 카드 안에서 따로 스크롤하지 않는다
const shape = await page.evaluate(()=>{
  const list=document.querySelector('#todayPanel .todo-list');
  const row=document.querySelector('#todayPanel .todo-line');
  const s=getComputedStyle(list), r=getComputedStyle(row);
  const text=row.querySelector('.todo-line-text');
  return { overflow:s.overflowY, maxH:s.maxHeight, rowH:Math.round(row.getBoundingClientRect().height),
           oneLine: getComputedStyle(text).whiteSpace==='nowrap',
           divider: parseFloat(getComputedStyle(document.querySelectorAll('#todayPanel .todo-line')[1]).borderTopWidth) };
});
ok('목록 안에서 스크롤하지 않음', shape.overflow!=='auto' && shape.overflow!=='scroll' && shape.maxH==='none', JSON.stringify(shape));
ok('한 줄에 하나 · 제목은 한 줄로 말줄임', shape.oneLine);
ok('줄 높이가 조밀함(52px 이하)', shape.rowH<=52, `${shape.rowH}px`);
ok('줄 사이 얇은 구분선', shape.divider>0 && shape.divider<=1.5, `${shape.divider}px`);

// 5. 지우기(✕) 는 평소 숨어 있다가 마우스를 올리면 보인다
const x = await page.evaluate(()=>{
  const row=document.querySelector('#todayPanel .todo-line');
  return { before: getComputedStyle(row.querySelector('.todo-x')).opacity };
});
ok('지우기 단추는 평소 숨어 있음', Number(x.before)===0, x.before);
await page.hover('#todayPanel .todo-line');
await page.waitForTimeout(250);
ok('마우스를 올리면 지우기 단추가 보임',
   Number(await page.$eval('#todayPanel .todo-line .todo-x', n=>getComputedStyle(n).opacity))===1);

// 6. 완료 탭
await page.click('[data-todo-tab="done"]');
await page.waitForTimeout(300);
const doneCount = todos.filter(t=>t.done).length;
ok('완료 탭도 전부 표시', await lines()===doneCount, `${await lines()}개`);
ok('완료 항목은 취소선', (await page.$eval('#todayPanel .todo-line.done .todo-line-text',
   n=>getComputedStyle(n).textDecorationLine))==='line-through');
await page.click('[data-todo-tab="active"]');
await page.waitForTimeout(300);

// 7. 체크하면 완료로 넘어가고 자료는 그대로 남는다
const before = await lines();
await page.evaluate(()=>document.querySelector('#todayPanel .todo-line .todo-line-check').click());
await page.waitForTimeout(600);
ok('체크하면 완료로 넘어감', await lines()===before-1, `${await lines()} / ${before-1}`);
ok('자료는 그대로 남음', await page.evaluate(()=>{
  const raw=JSON.parse(localStorage.getItem('knowledge-todos')||'[]');
  return raw.filter(t=>!t.deleted).length===27+8; }));

// 8. 좁은 화면
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(500);
const narrow = await page.evaluate(()=>{
  const row=document.querySelector('#todayPanel .todo-line');
  const text=row.querySelector('.todo-line-text').getBoundingClientRect();
  const box=row.getBoundingClientRect();
  return { insideCard: text.right <= box.right + 1,
           overflowX: Math.round(document.documentElement.scrollWidth - window.innerWidth),
           rows: document.querySelectorAll('#todayPanel .todo-line').length,
           stacked: document.querySelector('#memoPanel').getBoundingClientRect().bottom
                    <= document.querySelector('#todayPanel').getBoundingClientRect().top + 2 };
});
ok('모바일에서 글자가 줄 밖으로 나가지 않음', narrow.insideCard, JSON.stringify(narrow));
ok('모바일 가로 스크롤 없음', narrow.overflowX<=0, `${narrow.overflowX}px`);
ok('모바일에서도 전부 표시', narrow.rows===before-1, `${narrow.rows}개`);
ok('모바일은 메모 위 · 할 일 아래 한 단', narrow.stacked, JSON.stringify(narrow));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length? `\n실패: ${failures.join(', ')}` : '\n모두 통과');
process.exit(failures.length?1:0);
