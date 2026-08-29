// 대시보드 두 카드가 화면 아래 빈 공간 없이 남은 높이를 채우는지 (레이아웃 높이 전용).
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.env.SHOT_DIR || '/tmp';
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

// 할 일 24개를 미리 넣어 두고(카드보다 많음) 카드 안에서만 스크롤되는지 본다.
const seed = Array.from({length:24},(_,i)=>({
  id:`seed-todo-${i}`, type:'todo', text:`레이아웃 확인용 할 일 ${i+1}`, raw:`할일 ${i+1}`,
  date:'2026-08-26', done:false, source:'테스트',
  createdAt:'2026-08-26T01:00:00.000Z', updatedAt:'2026-08-26T01:00:00.000Z' }));

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1920,height:1080}});
await ctx.addInitScript(stub);
await ctx.addInitScript(list => { localStorage.setItem('knowledge-todos', JSON.stringify(list)); }, seed);
await ctx.route('**gstatic.com/**',r=>r.abort());
await ctx.route('**google.com/s2/favicons**', r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#DFD4FA"/></svg>'}));
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForSelector('.schedule-list',{timeout:9000});
await page.waitForTimeout(400);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));
await page.click('#todoToggle');            // 24개 전부 펼쳐 카드보다 길게 만든다
await page.waitForTimeout(250);

const measure = () => page.evaluate(()=>{
  const r = sel => document.querySelector(sel).getBoundingClientRect();
  const todo=r('#todayPanel'), sched=r('#schedulePanel'), scroll=document.querySelector('.main-scroll');
  const list=document.querySelector('#todayPanel .todo-list');
  const rows=[...document.querySelectorAll('.todo-item')].map(el=>el.getBoundingClientRect());
  const schedList=document.querySelector('#schedulePanel .schedule-list');
  return {
    vh: window.innerHeight,
    todoBottom: Math.round(todo.bottom), schedBottom: Math.round(sched.bottom),
    todoH: Math.round(todo.height), schedH: Math.round(sched.height),
    bottomGap: Math.round(window.innerHeight - Math.max(todo.bottom, sched.bottom)),
    pageOverflow: Math.round(document.documentElement.scrollHeight - window.innerHeight),
    scrollOverflow: Math.round(scroll.scrollHeight - scroll.clientHeight),
    listScrolls: list.scrollHeight > list.clientHeight + 1,
    listTopGap: Math.round(rows[0].top - list.getBoundingClientRect().top),
    rowGap: rows.length>1 ? Math.round(rows[1].top - rows[0].bottom) : 0,
    rowH: Math.round(rows[0].height),
    listH: Math.round(schedList.getBoundingClientRect().height),
    schedScrolls: schedList.scrollHeight > schedList.clientHeight ? true : 'not-needed'
  };
});

for (const size of [{width:1920,height:1080},{width:1600,height:900},{width:1440,height:900}]) {
  await page.setViewportSize(size); await page.waitForTimeout(350);
  const m = await measure();
  const tag = `${size.width}×${size.height}`;
  ok(`${tag} 아래 여백 20~30px`, m.bottomGap>=18 && m.bottomGap<=32, `${m.bottomGap}px`);
  ok(`${tag} 두 카드 아래 끝이 정확히 같음`, m.todoBottom===m.schedBottom, `${m.todoBottom} / ${m.schedBottom}`);
  ok(`${tag} 페이지가 세로로 넘치지 않음`, m.pageOverflow<=1 && m.scrollOverflow<=1, JSON.stringify(m));
  ok(`${tag} 카드가 화면 높이만큼 커짐`, m.todoH > size.height*0.5, `${m.todoH}px / 화면 ${size.height}px`);
  ok(`${tag} 할 일은 위에 붙어 있음`, m.listTopGap<=2 && m.rowGap<=6, `첫 항목 ${m.listTopGap}px · 간격 ${m.rowGap}px`);
  ok(`${tag} 항목 높이 그대로(간격 벌리기 없음)`, m.rowH>=36 && m.rowH<=44, `${m.rowH}px`);
  ok(`${tag} 넘치는 목록은 카드 안에서만 스크롤`, m.listScrolls, JSON.stringify({listScrolls:m.listScrolls}));
  ok(`${tag} 일정 목록도 카드 안에 들어감`, m.listH>0 && m.listH<=m.schedH, `${m.listH}px / ${m.schedH}px`);
}
await page.setViewportSize({width:1920,height:1080}); await page.waitForTimeout(300);
await page.screenshot({path:out+'/height.png'});

// 좁은 화면(1열)은 화면 높이에 맞추지 않고 내용만큼만
await page.setViewportSize({width:1000,height:900}); await page.waitForTimeout(400);
const narrow = await page.evaluate(()=>{
  const a=document.querySelector('#todayPanel').getBoundingClientRect();
  const s=document.querySelector('#schedulePanel').getBoundingClientRect();
  const list=document.querySelector('#todayPanel .todo-list');
  return { stacked: s.top > a.top+10, listClipped: list.scrollHeight > list.clientHeight+1, todoH: Math.round(a.height) };
});
ok('좁은 화면 1열 유지', narrow.stacked, JSON.stringify(narrow));
ok('좁은 화면은 자연스러운 auto 높이', !narrow.listClipped, JSON.stringify(narrow));

// 다른 화면(할 일 목록 보기)에서는 채우기 모드가 꺼진다
await page.setViewportSize({width:1920,height:1080}); await page.waitForTimeout(250);
await page.click('#sideNav button:has-text("할 일")').catch(()=>{});
await page.waitForTimeout(350);
ok('할 일 화면에서는 채우기 해제', await page.evaluate(()=>!document.querySelector('.main-scroll').classList.contains('dash-fill')));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
