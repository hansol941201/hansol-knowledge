// 완료한 할 일 — 그냥 볼 때는 숨기고, 검색할 때는 같이 찾아 준다
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
// 같은 낱말('도장')을 진행중 1개, 완료 2개가 함께 가지고 있다.
const todos = [
  { id:'a1', type:'todo', text:'도장 공사 견적 받기', raw:'도장 공사 견적 받기', date: day(1), done:false,
    createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:01:00.000Z' },
  { id:'a2', type:'todo', text:'도장 업체 계약서 보내기', raw:'도장 업체 계약서 보내기', date: day(-4), done:true,
    doneAt:'2026-09-02T01:00:00.000Z', createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-02T01:00:00.000Z' },
  { id:'a3', type:'todo', text:'도장 샘플 확인', raw:'도장 샘플 확인', date: day(-6), done:true,
    doneAt:'2026-09-02T02:00:00.000Z', createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-02T02:00:00.000Z' },
  { id:'b1', type:'todo', text:'전기 도면 검토', raw:'전기 도면 검토', date: day(0), done:false,
    createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:02:00.000Z' }
];

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

const cards = () => page.$$eval('.todo-result-card', rows => rows.map(row => ({
  글: row.querySelector('.card-body')?.textContent.trim() || '',
  완료: row.classList.contains('done')
})));

// 1. 할 일 화면을 그냥 볼 때 — 완료한 항목은 목록에 없다
await page.click('[data-category="할 일"]').catch(()=>{});
await page.evaluate(() => {
  const button = [...document.querySelectorAll('#pageCategories button, #sideNav button, #sideNav a')]
    .find(el => el.textContent.trim() === '할 일');
  if (button) button.click();
});
await page.waitForTimeout(500);
const browsing = await cards();
ok('그냥 볼 때 완료 항목이 없음', browsing.every(c => !c.완료),
   JSON.stringify(browsing.map(c => `${c.글}${c.완료?'(완료)':''}`)));
ok('진행중 할 일은 그대로 보임', browsing.length === 2 && browsing.some(c => c.글.includes('견적')) && browsing.some(c => c.글.includes('도면')),
   JSON.stringify(browsing.map(c => c.글)));

// 2. 완료 탭에서는 완료한 항목을 볼 수 있다(숨겼다고 지운 게 아니다)
await page.evaluate(() => document.querySelector('[data-todo-tab="done"]')?.click());
await page.waitForTimeout(300);
const doneTab = await page.$$eval('#todayPanel [data-todo-id]', rows => rows.map(r => r.textContent.replace(/\s+/g,' ').trim()));
ok('완료 탭에는 완료한 2건이 남아 있음', doneTab.length === 2, JSON.stringify(doneTab));

// 3. 검색하면 완료한 할 일도 같이 나온다
await page.evaluate(() => {
  const button = [...document.querySelectorAll('#pageCategories button')].find(el => el.textContent.trim() === '전체');
  if (button) button.click();
});
await page.waitForTimeout(300);
await page.fill('#pageSearch', '도장');
await page.press('#pageSearch', 'Enter');
await page.waitForTimeout(700);
const found = await cards();
ok('검색하면 완료한 할 일도 나옴', found.filter(c => c.완료).length === 2,
   JSON.stringify(found.map(c => `${c.글}${c.완료?'(완료)':''}`)));
ok('진행중 할 일도 함께 나옴', found.some(c => !c.완료 && c.글.includes('견적')), JSON.stringify(found.map(c=>c.글)));
ok('검색어와 상관없는 할 일은 안 나옴', !found.some(c => c.글.includes('도면')), JSON.stringify(found.map(c=>c.글)));

const badge = await page.$$eval('.todo-result-card.done .todo-state', els => els.map(e => e.textContent.trim()));
ok('완료 표시가 붙어 있음', badge.length === 2 && badge.every(t => t === '완료'), JSON.stringify(badge));

// 4. 검색을 지우면 다시 완료 항목이 숨는다
await page.fill('#pageSearch', '');
await page.press('#pageSearch', 'Enter');
await page.waitForTimeout(600);
const cleared = await cards();
ok('검색을 지우면 다시 숨음', cleared.every(c => !c.완료), JSON.stringify(cleared.map(c=>`${c.글}${c.완료?'(완료)':''}`)));

// 5. 자료가 지워지지 않았다
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('knowledge-todos') || '[]'));
ok('할 일 자료 4건 그대로', stored.length === 4, `${stored.length}건`);
ok('완료 표시도 그대로', stored.filter(t => t.done).length === 2);
ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
