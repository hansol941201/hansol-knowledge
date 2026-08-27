// 검색창에 화면 이름을 치고 Enter 하면 그 목록으로 바로 이동하는지.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
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
const seed=[{id:'t1',type:'todo',text:'천민호부사장 600. 택배 확인하기',raw:'x',date:'2026-08-26',done:false,source:'테스트',createdAt:'2026-08-26T01:00:00.000Z',updatedAt:'2026-08-26T01:00:00.000Z'}];
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.addInitScript(l=>{localStorage.setItem('knowledge-todos',JSON.stringify(l));},seed);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const jump = async (text) => {
  await page.click('#pageSearch');
  await page.fill('#pageSearch', text);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  return page.evaluate(()=>({
    view: document.querySelector('#sideNav .side-item.active span')?.textContent,
    heading: document.querySelector('#pageHeading')?.textContent,
    box: document.querySelector('#pageSearch').value,
    todos: [...document.querySelectorAll('.todo-item .todo-text')].map(n=>n.textContent) }));
};

let r = await jump('할일');
ok('"할일" + Enter → 할 일 목록', r.view==='할 일' && r.heading==='할 일', JSON.stringify(r));
ok('검색창은 비워짐', r.box==='', `"${r.box}"`);
ok('할 일 내용이 보임', r.todos.some(t=>t.includes('천민호부사장')), JSON.stringify(r.todos));

r = await jump('할 일');
ok('"할 일"(띄어쓰기) 도 이동', r.view==='할 일', JSON.stringify(r));
r = await jump('기억');
ok('"기억" → 기억', r.view==='기억' && r.heading==='기억 저장소', JSON.stringify(r));
r = await jump('특허');
ok('"특허" → 특허', r.view==='특허', JSON.stringify(r));
r = await jump('연락처');
ok('"연락처" → 연락처', r.view==='연락처', JSON.stringify(r));
r = await jump('대시보드');
ok('"대시보드" → 대시보드', r.view==='대시보드', JSON.stringify(r));

// 일반 검색어는 그대로 검색된다
await page.fill('#pageSearch','천민호부사장');
await page.keyboard.press('Enter');
await page.waitForTimeout(350);
const search = await page.evaluate(()=>({
  box: document.querySelector('#pageSearch').value,
  cards: document.querySelectorAll('#pageGrid > *').length,
  text: document.querySelector('#pageGrid')?.textContent || '' }));
ok('일반 검색어는 그대로 검색', search.box==='천민호부사장' && search.text.includes('천민호부사장'), JSON.stringify({box:search.box,cards:search.cards}));

// "할일 한솔" 처럼 내용이 붙으면 저장되고 할 일 목록으로 이동한다
await page.fill('#pageSearch','할일 한솔');
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
const saved = await page.evaluate(()=>({
  view: document.querySelector('#sideNav .side-item.active span')?.textContent,
  box: document.querySelector('#pageSearch').value,
  shown: [...document.querySelectorAll('.todo-item .todo-text')].map(n=>n.textContent),
  todos: todos.filter(t=>!t.deleted).map(t=>({text:t.text, type:t.type, source:t.source})),
  memories: memories.filter(m=>!m.deleted).length,
  stored: JSON.parse(localStorage.getItem('knowledge-todos')||'[]').filter(t=>!t.deleted).map(t=>t.text) }));
ok('"할일 한솔" → 할 일로 저장', saved.todos.some(t=>t.text==='한솔' && t.type==='todo'), JSON.stringify(saved.todos));
ok('할 일 목록으로 이동 · 화면에 보임', saved.view==='할 일' && saved.shown.includes('한솔'), JSON.stringify(saved));
ok('검색창은 비워짐', saved.box==='', `"${saved.box}"`);
ok('로컬에도 저장', saved.stored.includes('한솔'), JSON.stringify(saved.stored));
ok('기억에는 안 들어감', saved.memories===0, `${saved.memories}개`);
const toast = await page.evaluate(()=>document.querySelector('.toast')?.textContent || '');
ok('저장 안내 표시', toast.includes('저장'), toast);

// "기록 …" 은 기억으로
await page.fill('#pageSearch','기록 자오건설 PDF 확인');
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
const mem = await page.evaluate(()=>({
  view: document.querySelector('#sideNav .side-item.active span')?.textContent,
  memories: memories.filter(m=>!m.deleted).map(m=>({text:m.text, type:m.type})),
  todos: todos.filter(t=>!t.deleted).length }));
ok('"기록 …" → 기억으로 저장', mem.memories.some(m=>m.text==='자오건설 PDF 확인' && m.type==='memory'), JSON.stringify(mem.memories));
ok('기억 화면으로 이동 · 할 일은 그대로', mem.view==='기억' && mem.todos===2, JSON.stringify(mem));

// 명령어가 없으면 저장하지 않고 검색만 한다
await page.fill('#pageSearch','저장되면안되는말');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const none = await page.evaluate(()=>({
  box: document.querySelector('#pageSearch').value,
  todos: todos.filter(t=>!t.deleted).length, memories: memories.filter(m=>!m.deleted).length }));
ok('일반 문장은 저장 안 됨', none.todos===2 && none.memories===1 && none.box==='저장되면안되는말', JSON.stringify(none));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
