// 할 일 별표(중요) — 누르면 맨 위로 올라가고 제목에 형광펜이 그어진다
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

const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const day = n => { const d = new Date(); d.setDate(d.getDate()+n); return key(d); };
// 마감일 순으로는 A → B → C → D 가 된다. 별표를 누르면 그 항목이 맨 위로 와야 한다.
const todos = [
  { id:'t1', type:'todo', text:'가장 급한 일 A', raw:'가장 급한 일 A', date: day(-2), done:false,
    createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:01:00.000Z' },
  { id:'t2', type:'todo', text:'오늘 할 일 B', raw:'오늘 할 일 B', date: day(0), done:false,
    createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:02:00.000Z' },
  { id:'t3', type:'todo', text:'중요한 계약 C', raw:'중요한 계약 C', date: day(3), done:false,
    createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:03:00.000Z' },
  { id:'t4', type:'todo', text:'나중 일 D', raw:'나중 일 D', date: day(9), done:false,
    createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:04:00.000Z' }
];

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
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

const order = () => page.$$eval('#todayPanel .todo-line .todo-line-text', els => els.map(e=>e.textContent.trim()));
const starred = () => page.$$eval('#todayPanel .todo-line', els => els.filter(e=>e.classList.contains('star'))
  .map(e=>e.querySelector('.todo-line-text').textContent.trim()));
const clickStar = async (text) => {
  await page.evaluate(t => {
    const row = [...document.querySelectorAll('#todayPanel .todo-line')]
      .find(r => r.querySelector('.todo-line-text').textContent.trim() === t);
    row.querySelector('[data-todo-star]').click();
  }, text);
  await page.waitForTimeout(500);
};

// 1. 처음에는 마감일 순, 별표 없음
ok('처음에는 마감일 순', JSON.stringify(await order())===JSON.stringify(['가장 급한 일 A','오늘 할 일 B','중요한 계약 C','나중 일 D']),
   JSON.stringify(await order()));
ok('처음에는 별표가 없음', (await starred()).length===0);
ok('모든 줄에 별표 단추가 있음', (await page.$$('#todayPanel .todo-line [data-todo-star]')).length===4);

// 2. 별표를 누르면 맨 위로 올라온다
await clickStar('중요한 계약 C');
ok('별표를 누르면 맨 위로', (await order())[0]==='중요한 계약 C', JSON.stringify(await order()));
ok('나머지는 마감일 순 그대로', JSON.stringify((await order()).slice(1))===JSON.stringify(['가장 급한 일 A','오늘 할 일 B','나중 일 D']),
   JSON.stringify(await order()));
ok('별표 표시가 켜짐', JSON.stringify(await starred())===JSON.stringify(['중요한 계약 C']));

// 3. 형광펜이 그어진다
const paint = await page.$eval('#todayPanel .todo-line.star .todo-mark', el => {
  const s = getComputedStyle(el);
  return { 배경: s.backgroundImage, 굵기: s.fontWeight,
           칠한너비: Math.round(el.getBoundingClientRect().width),
           줄너비: Math.round(el.closest('.todo-line-text').getBoundingClientRect().width) };
});
ok('제목에 형광펜(그라데이션)이 칠해짐', paint.배경.includes('gradient'), paint.배경.slice(0,60));
ok('형광펜은 노란 계열', /255,\s*2[0-9]{2}/.test(paint.배경), paint.배경.slice(0,80));
ok('중요한 줄은 글씨가 굵어짐', Number(paint.굵기)>=600, paint.굵기);
const mark = await page.$eval('#todayPanel .todo-line.star [data-todo-star]', el => el.textContent.trim());
ok('별표가 채워진 ★ 로 바뀜', mark==='★', mark);
ok('형광펜이 글자 길이만큼만 그어짐', paint.칠한너비 < paint.줄너비 * 0.75,
   `글자 ${paint.칠한너비}px / 줄 ${paint.줄너비}px`);
const plain = await page.$eval('#todayPanel .todo-line:not(.star) .todo-mark',
  el => getComputedStyle(el).backgroundImage);
ok('보통 줄에는 형광펜이 없음', !plain.includes('gradient'), plain);

// 4. 두 개를 별표하면 둘 다 위로, 그 안에서는 마감일 순
await clickStar('나중 일 D');
ok('별표 2개가 위로', JSON.stringify((await order()).slice(0,2))===JSON.stringify(['중요한 계약 C','나중 일 D']),
   JSON.stringify(await order()));
ok('별표끼리는 마감일 순', (await starred()).length===2);

// 5. 다시 누르면 꺼지고 제자리로
await clickStar('중요한 계약 C');
ok('다시 누르면 별표가 꺼짐', !(await starred()).includes('중요한 계약 C'), JSON.stringify(await starred()));
ok('제자리로 돌아감', JSON.stringify(await order())===JSON.stringify(['나중 일 D','가장 급한 일 A','오늘 할 일 B','중요한 계약 C']),
   JSON.stringify(await order()));

// 6. 별표를 눌러도 완료되거나 수정 창이 열리지 않는다
ok('완료 처리되지 않음', (await page.$$('#todayPanel .todo-line')).length===4);
ok('수정 창이 열리지 않음', await page.$eval('#todoModal', el => el.classList.contains('hidden')).catch(()=>true));

// 7. 저장되고 새로고침해도 남는다
const stored = await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-todos')||'[]'));
ok('별표가 저장됨', stored.find(t=>t.id==='t4').starred===true, JSON.stringify(stored.map(t=>[t.id,!!t.starred])));
ok('끈 것은 저장 안 됨', !stored.find(t=>t.id==='t3').starred);
ok('할 일 4건 그대로', stored.length===4 && stored.every(t=>!t.deleted && !t.done));
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(700);
ok('새로고침해도 맨 위 그대로', (await order())[0]==='나중 일 D', JSON.stringify(await order()));
ok('새로고침해도 형광펜 그대로', (await starred()).length===1);

// 8. 완료하면 목록에서 빠진다(별표라고 남지 않는다)
await page.evaluate(()=>{
  const row=[...document.querySelectorAll('#todayPanel .todo-line')]
    .find(r=>r.querySelector('.todo-line-text').textContent.trim()==='나중 일 D');
  row.querySelector('input').click();
});
await page.waitForTimeout(700);
ok('별표한 할 일도 완료하면 빠짐', !(await order()).includes('나중 일 D'), JSON.stringify(await order()));
ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
