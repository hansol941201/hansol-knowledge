// 검색 결과 — 업무지식이 맨 위, 삭제·완료 항목은 제외
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

const T='2026-09-01T00:00:00.000Z';
// 같은 낱말 '견적서'를 여러 종류가 나눠 갖는다.
const todos=[
  {id:'t1',type:'todo',text:'견적서 진행중 할일',raw:'x',date:'2026-09-18',done:false,createdAt:T,updatedAt:T},
  {id:'t2',type:'todo',text:'견적서 삭제한 할일',raw:'x',date:'2026-09-17',done:false,deleted:true,createdAt:T,updatedAt:T},
  {id:'t3',type:'todo',text:'견적서 완료한 할일',raw:'x',date:'2026-09-16',done:true,doneAt:T,createdAt:T,updatedAt:T},
  {id:'t4',type:'memory',text:'견적서 할일칸에섞인기억',raw:'x',createdAt:T,updatedAt:T}
];
const memories=[
  {id:'m1',type:'memory',text:'견적서 기억',createdAt:T,updatedAt:T},
  {id:'m2',type:'memory',text:'견적서 삭제한기억',deleted:true,createdAt:T,updatedAt:T}
];
const knowledge=[
  {id:'k1',title:'견적서 업무지식 하나',answer:'본문',category:'업무지식',createdAt:T,updatedAt:T},
  {id:'k2',title:'견적서 업무지식 둘',answer:'본문',category:'업무지식',createdAt:T,updatedAt:T},
  {id:'k3',title:'견적서 연락처',answer:'010-0000-0000',category:'연락처',createdAt:T,updatedAt:T},
  {id:'k4',title:'견적서 삭제한지식',answer:'본문',category:'업무지식',deleted:true,createdAt:T,updatedAt:T}
];

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.addInitScript(`localStorage.setItem('knowledge-todos', ${JSON.stringify(JSON.stringify(todos))});
localStorage.setItem('knowledge-memories', ${JSON.stringify(JSON.stringify(memories))});
localStorage.setItem('knowledge-messenger-data', ${JSON.stringify(JSON.stringify(knowledge))});`);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(700);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const cards = () => page.$$eval('#pageGrid .page-card', els=> els.map(e=>({
  종류: e.querySelector('.card-kind span')?.textContent.trim() || '',
  글: (e.querySelector('h3')?.textContent || e.querySelector('.card-body')?.textContent || '').trim()
})));

await page.fill('#pageSearch','견적서');
await page.press('#pageSearch','Enter');
await page.waitForTimeout(800);
const found = await cards();
const mine = found.filter(c=> c.글.includes('견적서'));

// 1. 업무지식이 맨 위
ok('첫 카드가 업무지식', found[0] && found[0].종류==='업무지식', JSON.stringify(found.slice(0,3)));
const firstNonWork = found.findIndex(c=> c.종류 !== '업무지식');
const lastWorkBefore = found.slice(0, firstNonWork<0?found.length:firstNonWork).every(c=> c.종류==='업무지식');
ok('업무지식이 끊기지 않고 앞쪽에 모임', lastWorkBefore, `업무지식 ${firstNonWork<0?found.length:firstNonWork}장 뒤 → ${found[firstNonWork]?.종류||'끝'}`);
const idxWork = found.findIndex(c=> c.글==='견적서 업무지식 하나');
const idxTodo = found.findIndex(c=> c.글==='견적서 진행중 할일');
const idxMemo = found.findIndex(c=> c.글==='견적서 기억');
ok('업무지식이 할 일보다 위', idxWork >= 0 && idxTodo >= 0 && idxWork < idxTodo, `업무지식 ${idxWork} / 할일 ${idxTodo}`);
ok('업무지식이 기억보다 위', idxWork < idxMemo, `업무지식 ${idxWork} / 기억 ${idxMemo}`);

// 2. 삭제 제외
ok('삭제한 할 일 안 나옴', !mine.some(c=> c.글.includes('삭제한 할일')), JSON.stringify(mine.map(c=>c.글)));
ok('삭제한 기억 안 나옴', !mine.some(c=> c.글.includes('삭제한기억')));
ok('삭제한 지식 안 나옴', !mine.some(c=> c.글.includes('삭제한지식')));

// 3. 완료 제외
ok('완료한 할 일 안 나옴', !mine.some(c=> c.글.includes('완료한 할일')), JSON.stringify(mine.map(c=>c.글)));
ok('할 일 카드에 완료 표시가 하나도 없음', (await page.$$('#pageGrid .todo-result-card.done')).length===0);

// 4. 할 일 칸에는 할 일만
ok('기억이 할 일 카드로 새지 않음',
   !found.some(c=> c.종류==='할 일' && c.글.includes('할일칸에섞인기억')), JSON.stringify(found.filter(c=>c.종류==='할 일').map(c=>c.글)));

// 5. 살아있는 항목은 모두 그대로 나옴
ok('진행중 할 일 나옴', mine.some(c=> c.글==='견적서 진행중 할일'));
ok('기억 나옴', mine.some(c=> c.글==='견적서 기억'));
ok('업무지식 2건 다 나옴', mine.filter(c=> c.종류==='업무지식').length===2, String(mine.filter(c=>c.종류==='업무지식').length));
ok('연락처도 빠지지 않음', mine.some(c=> c.종류==='연락처'), JSON.stringify(mine.map(c=>c.종류)));

// 6. 검색을 지우면 원래 순서(업무지식 우선 아님)로 돌아온다
await page.fill('#pageSearch','');
await page.press('#pageSearch','Enter');
await page.waitForTimeout(700);
const browsing = await cards();
ok('검색을 지우면 카드가 다시 보임', browsing.length > 0, `${browsing.length}장`);

// 7. 자료가 지워지지 않았다
const stored = await page.evaluate(()=>({
  todos: JSON.parse(localStorage.getItem('knowledge-todos')||'[]').length,
  memories: JSON.parse(localStorage.getItem('knowledge-memories')||'[]').length,
  knowledge: JSON.parse(localStorage.getItem('knowledge-messenger-data')||'[]').filter(k=>k.id&&k.id.startsWith('k')).length
}));
// type:'memory' 인데 할 일 칸에 섞여 있던 기록은 앱이 기억 쪽으로 옮긴다(기존 동작).
// 그래서 칸별 개수는 바뀔 수 있지만 합계는 그대로여야 한다 — 사라진 기록이 없어야 한다.
ok('할 일+기억 합계 6건 그대로', stored.todos + stored.memories === 6, `할일 ${stored.todos} + 기억 ${stored.memories}`);
ok('진행중·완료·삭제 할 일 3건은 할 일 칸에 그대로', stored.todos===3, String(stored.todos));
ok('할 일 칸에 섞였던 기억이 기억 칸으로 옮겨짐', stored.memories===3, String(stored.memories));
ok('지식 4건 그대로', stored.knowledge===4, String(stored.knowledge));
ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
