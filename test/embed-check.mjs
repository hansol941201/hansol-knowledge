// 오른쪽 일정 칸에 팀장 일정 사이트를 띄우고, 안 열리면 자체 달력으로 넘어가는지.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.env.SHOT_DIR || '/tmp';
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
  if (req.url.startsWith('/fake-team/')) {
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    return res.end('<!doctype html><title>팀장 일정</title><body style="font:14px sans-serif;padding:16px"><h1>팀장 일정</h1><p>9월 4일 1차 미팅</p></body>');
  }
  if (req.url.startsWith('/missing-team/')) { res.writeHead(404,{'Content-Type':'text/html'}); return res.end('<!doctype html><title>404 Not Found</title><body>Page not found</body>'); }
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});

async function open(teamUrl) {
  const ctx = await b.newContext({viewport:{width:1600,height:1000}});
  await ctx.addInitScript(stub);
  await ctx.addInitScript(u => { window.__TEAM_SCHEDULE_URL = u; }, teamUrl);
  await ctx.route('**gstatic.com/**', r=>r.abort());
  const page = await ctx.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/index.html');
  await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
  await page.waitForTimeout(900);
  return { ctx, page, errors };
}

// A) 정상적으로 열리는 경우 — iframe 유지
let { ctx, page, errors } = await open(base + '/fake-team/');
ok('A. 자바스크립트 오류 없음', errors.length===0, errors.join(' | '));
ok('A. 일정 칸에 iframe 삽입', await page.isVisible('#scheduleEmbed'));
ok('A. 사이트 내용이 보임', (await page.frameLocator('#scheduleEmbed').locator('h1').textContent())==='팀장 일정');
ok('A. 자체 달력 제거', (await page.$$('.cal-grid')).length===0 && (await page.$$('#scheduleAdd')).length===0);
const geo = await page.evaluate(()=>{
  const todo=document.querySelector('#todayPanel').getBoundingClientRect();
  const sched=document.querySelector('#schedulePanel').getBoundingClientRect();
  const frame=document.querySelector('#scheduleEmbed').getBoundingClientRect();
  return { todoW:Math.round(todo.width), schedW:Math.round(sched.width), schedH:Math.round(sched.height),
           gap: Math.round(window.innerHeight - sched.bottom),
           frameH:Math.round(frame.height), fillsWidth: Math.round(frame.width) >= Math.round(sched.width) - 44 };
});
ok('A. 2열 · 폭 동일', Math.abs(geo.todoW-geo.schedW)<2, JSON.stringify(geo));
ok('A. 카드가 남은 화면 높이를 채움', geo.gap>=18 && geo.gap<=32, `아래 여백 ${geo.gap}px · 높이 ${geo.schedH}px`);
ok('A. iframe 이 카드를 채움', geo.fillsWidth && geo.frameH>=380, JSON.stringify(geo));
ok('A. 사이드바·즐겨찾기·할 일 유지', await page.isVisible('.sidebar') && await page.isVisible('#shortcutGrid') && await page.isVisible('#todayPanel'));
ok('A. 페이지가 세로로 길어지지 않음', await page.evaluate(()=>document.querySelector('.main-scroll').scrollHeight < 900));
await page.screenshot({path:out+'/embed.png'});
// 좁은 화면 1열
await page.setViewportSize({width:1000,height:900}); await page.waitForTimeout(300);
ok('A. 좁은 화면에서 1열', await page.evaluate(()=>{
  const a=document.querySelector('#todayPanel').getBoundingClientRect();
  const s=document.querySelector('#schedulePanel').getBoundingClientRect();
  return s.top > a.top + 10; }));
await ctx.close();

// B) 404 인 경우 — 자체 달력으로 전환
({ ctx, page, errors } = await open(base + '/missing-team/'));
await page.waitForTimeout(1200);
ok('B. 404 면 자체 달력으로 전환', await page.isVisible('.cal-grid') && (await page.$$('#scheduleEmbed')).length===0);
ok('B. 달력 기능 살아 있음', await page.isVisible('#scheduleAdd'));
await ctx.close();

// C) 응답이 없는 경우 — 시간 초과 후 달력
({ ctx, page, errors } = await open('https://blocked.invalid/team/'));
await page.waitForTimeout(7000);
ok('C. 열리지 않으면 달력으로 전환', await page.isVisible('.cal-grid'));
await ctx.close();

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
