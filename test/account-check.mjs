// 계정 — 목록·아이디/비번 복사, 그리고 동기화 전에는 왜 비었는지 알려 주는지 확인
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
const goAccounts = (page) => page.evaluate(()=>
  [...document.querySelectorAll('#sideNav .top-item')].find(el=>el.textContent==='계정').click());

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});

// ── 1. 클라우드에만 있던 계정·비밀번호가 이 기기로 복원되는가 ──────────
const cloud={ knowledge:[], todos:[], memories:[], shortcuts:[], schedule:[],
  accountMeta:[{id:'a1',service:'나라장터',user:'hansol01',
    createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z'}],
  vaultSecrets:{ a1:'비밀번호1234' } };
const ctx=await b.newContext({viewport:{width:1400,height:900},permissions:['clipboard-read','clipboard-write']});
// 클라우드 문서를 먼저 채우고 stub 을 올린다(stub 이 부팅 때 읽는다)
await ctx.addInitScript(`localStorage.setItem('fake-firestore-shared-state', ${JSON.stringify(JSON.stringify(cloud))});`);
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(1200);
await goAccounts(page); await page.waitForTimeout(600);
ok('클라우드 계정이 이 기기에 복원됨', (await page.$$('#pageGrid [data-account-id]')).length===1);
ok('서비스명과 아이디가 보임', (await page.textContent('#pageGrid [data-account-id]')).includes('나라장터')
  && (await page.textContent('#pageGrid [data-account-id]')).includes('hansol01'));
ok('비밀번호는 가려져 있음', (await page.textContent('#pageGrid .secret-line')).includes('•'));
ok('로컬에도 저장됨', await page.evaluate(()=>
  JSON.parse(localStorage.getItem('knowledge-account-meta')||'[]').length===1
  && Boolean(localStorage.getItem('knowledge-vault-data'))));

await page.click('#pageGrid [data-account-id] [data-copy-id]');
await page.waitForTimeout(400);
ok('아이디 복사', (await page.evaluate(()=>navigator.clipboard.readText()))==='hansol01');
await page.click('#pageGrid [data-account-id] [data-copy-pw]');
await page.waitForTimeout(900);
ok('비밀번호 복사', (await page.evaluate(()=>navigator.clipboard.readText()))==='비밀번호1234');
ok('복사 안내 표시', (await page.textContent('#toast')).includes('비밀번호 복사됨'));
ok('클라우드 자료가 지워지지 않음', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.accountMeta||[]).length===1 && Boolean((d.vaultSecrets||{}).a1); }));
ok('오류 없음', errors.length===0, errors.join(' | '));
await ctx.close();

// ── 2. 동기화 전이면 왜 비었는지 알려 주는가 ────────────────────────
const ctx2=await b.newContext({viewport:{width:1400,height:900}});
await ctx2.addInitScript(stub);
// 로그인하지 않은 상태로 만든다
await ctx2.addInitScript(`window.__PATCH_AUTH = true;`);
await ctx2.addInitScript(`(() => { const t=setInterval(()=>{ if(window.HANSOL_AUTH){ window.HANSOL_AUTH.currentUser=null; clearInterval(t); } },1); })();`);
await ctx2.route('**gstatic.com/**',r=>r.abort());
const page2=await ctx2.newPage();
const errors2=[]; page2.on('pageerror',e=>errors2.push(e.message));
await page2.goto(base+'/index.html');
await page2.waitForTimeout(1500);
await goAccounts(page2); await page2.waitForTimeout(600);
const empty = await page2.evaluate(()=>{
  const box=document.querySelector('#pageEmpty');
  return { 보임: !box.classList.contains('hidden'), 글: box.textContent,
           연결단추: Boolean(box.querySelector('#emptyConnect')) };
});
ok('계정이 비면 안내가 뜸', empty.보임, JSON.stringify(empty).slice(0,120));
ok('지워진 게 아니라 미연결이라고 알려 줌',
   empty.글.includes('동기화에 연결돼 있지 않습니다') && empty.글.includes('지워진 것이 아닙니다'), empty.글.slice(0,90));
ok('계정 화면에서는 비밀번호까지 짚어 줌', empty.글.includes('계정과 비밀번호'), empty.글.slice(0,90));
ok('동기화 연결 단추 있음', empty.연결단추);
await page2.click('#emptyConnect'); await page2.waitForTimeout(400);
ok('누르면 동기화 창이 열림', await page2.isVisible('#syncModal'));
ok('오류 없음(2)', errors2.length===0, errors2.join(' | '));
await ctx2.close();

await b.close(); server.close();
console.log(failures.length? `\n실패: ${failures.join(', ')}` : '\n모두 통과');
process.exit(failures.length?1:0);
