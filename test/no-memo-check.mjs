// 빠른 전화 메모 제거 — 화면에서 사라졌는지, 그리고 이미 저장돼 있던 메모 값은 지워지지 않는지
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

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:900}});
// 클라우드에 이미 저장돼 있던 빠른 전화 메모를 미리 넣어 둔다.
await ctx.addInitScript(() => {
  localStorage.setItem('fake-firestore-shared-state', JSON.stringify({
    knowledge: [], todos: [], memories: [], accountMeta: [], shortcuts: [], schedule: [],
    quickPhoneMemoDraft: { text: '지우면 안 되는 예전 메모', updatedAt: '2026-08-30T00:00:00.000Z' }
  }));
  localStorage.setItem('quick_phone_memo_draft', JSON.stringify({ text: '기기에 남아 있던 메모', updatedAt: '2026-08-30T00:00:00.000Z' }));
});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(700);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 화면에서 사라졌는지
ok('빠른 전화 메모 카드 없음', (await page.$$('#memoPanel')).length===0);
ok('메모 입력칸 없음', (await page.$$('#quickMemo')).length===0);
const body = await page.textContent('.workspace');
ok('화면 어디에도 문구가 남아 있지 않음', !body.includes('빠른 전화 메모') && !body.includes('전화 요청 기록으로 저장'), '');
ok('대시보드 카드는 할 일 · 일정 2개', (await page.$$('#dashCols > section:not(.hidden)')).length===2);
const cols = await page.evaluate(()=>{
  const a=document.querySelector('#todayPanel').getBoundingClientRect();
  const s=document.querySelector('#schedulePanel').getBoundingClientRect();
  return { sideBySide: Math.abs(a.top-s.top)<2 && a.left < s.left,
           gap: Math.round(s.left-a.right), overflowX: document.documentElement.scrollWidth-document.documentElement.clientWidth };
});
ok('할 일 왼쪽 · 일정 오른쪽', cols.sideBySide, JSON.stringify(cols));
ok('가로 스크롤 생기지 않음', cols.overflowX===0, `${cols.overflowX}px`);

// 검색 미리보기에서도 빠졌는지
await page.click('#pageSearch');
await page.type('#pageSearch','메모',{delay:8});
await page.waitForTimeout(400);
const preview = (await page.textContent('#searchPreview')) || '';
ok('검색 미리보기에 빠른 전화 메모 바로가기 없음', !preview.includes('빠른 전화 메모') && !preview.includes('전화 요청 기록으로 저장'), preview.slice(0,80));
await page.fill('#pageSearch','');
await page.keyboard.press('Escape');

// 저장돼 있던 메모 값이 지워지지 않는지 — 다른 자료를 저장해도 그대로 남아야 한다
await page.evaluate(()=>{ document.querySelector('#pageAdd').click(); });
await page.waitForTimeout(200);
await page.evaluate(()=>{ [...document.querySelectorAll('[data-add]')].find(b=>b.dataset.add==='할 일')?.click(); });
await page.waitForTimeout(200);
await page.fill('#quickTextInput','메모 보존 확인용 할 일');
await page.click('#quickTextForm button[type="submit"]');
await page.waitForTimeout(900);
const kept = await page.evaluate(()=>{
  const doc = JSON.parse(localStorage.getItem('fake-firestore-shared-state') || '{}');
  return { cloud: doc.quickPhoneMemoDraft, local: localStorage.getItem('quick_phone_memo_draft'),
           todoSaved: (doc.todos||[]).some(t=>t && t.text==='메모 보존 확인용 할 일') };
});
ok('할 일은 정상 저장됨', kept.todoSaved);
ok('클라우드에 있던 메모가 그대로 남음', kept.cloud && kept.cloud.text==='지우면 안 되는 예전 메모', JSON.stringify(kept.cloud));
ok('이 기기에 있던 메모도 그대로 남음', (kept.local||'').includes('기기에 남아 있던 메모'), kept.local);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
