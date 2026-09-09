// 계정 수정 — 사이트명·아이디·비밀번호 고치기, 비우면 쓰던 비밀번호 유지
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

// 클라우드에 계정 2개. 하나만 고치고 다른 하나는 그대로 있어야 한다.
const cloud={ knowledge:[], todos:[], memories:[], shortcuts:[], schedule:[],
  accountMeta:[
    {id:'a1',service:'나라장터',user:'hansol01',createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z'},
    {id:'a2',service:'국세청',user:'tax77',createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z'}],
  vaultSecrets:{ a1:'비밀번호1234', a2:'세금5678' } };
const ctx=await b.newContext({viewport:{width:1400,height:900},permissions:['clipboard-read','clipboard-write']});
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
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));
ok('계정 2개', (await page.$$('#pageGrid [data-account-id]')).length===2);

const openEdit = async (id) => {
  await page.evaluate(x => document.querySelector(`[data-account-id="${x}"] [data-account-edit]`).click(), id);
  await page.waitForTimeout(500);
};
const field = (sel) => page.inputValue(sel);

// ── 1. 수정 창이 지금 값으로 채워져서 열린다 ────────────────────────
await openEdit('a1');
ok('수정 단추가 창을 연다', !(await page.$eval('#vaultModal', el => el.classList.contains('hidden'))));
ok('제목이 "계정 수정"', (await page.textContent('#vaultTitle')).trim()==='계정 수정');
ok('저장 단추가 "수정 저장"', (await page.textContent('#vaultSubmit')).trim()==='수정 저장');
ok('사이트명이 채워져 있음', (await field('#accountService'))==='나라장터', await field('#accountService'));
ok('아이디가 채워져 있음', (await field('#accountId'))==='hansol01', await field('#accountId'));
ok('쓰던 비밀번호가 채워져 있음', (await field('#accountPassword'))==='비밀번호1234', await field('#accountPassword'));
ok('비밀번호는 가려져 있음', (await page.getAttribute('#accountPassword','type'))==='password');
await page.check('#accountShow'); await page.waitForTimeout(150);
ok('"비밀번호 보기"를 켜면 보인다', (await page.getAttribute('#accountPassword','type'))==='text');

// ── 2. 셋 다 고쳐서 저장 ──────────────────────────────────────────
await page.fill('#accountService','나라장터(신규)');
await page.fill('#accountId','hansol02');
await page.fill('#accountPassword','새비번9999');
await page.click('#vaultSubmit');
await page.waitForTimeout(900);
ok('저장하면 창이 닫힘', await page.$eval('#vaultModal', el => el.classList.contains('hidden')));
const card1 = await page.textContent('[data-account-id="a1"]');
ok('바뀐 사이트명이 화면에 보임', card1.includes('나라장터(신규)'), card1.replace(/\s+/g,' ').trim());
ok('바뀐 아이디가 화면에 보임', card1.includes('hansol02'));
await page.evaluate(()=>document.querySelector('[data-account-id="a1"] [data-copy-pw]').click());
await page.waitForTimeout(500);
ok('바뀐 비밀번호가 복사됨', (await page.evaluate(()=>navigator.clipboard.readText()))==='새비번9999',
   await page.evaluate(()=>navigator.clipboard.readText()));

// ── 3. 비밀번호를 비우고 저장하면 쓰던 비밀번호가 그대로 남는다 ──────
await openEdit('a2');
ok('다른 계정 값이 채워짐', (await field('#accountService'))==='국세청' && (await field('#accountPassword'))==='세금5678');
await page.fill('#accountService','국세청 홈택스');
await page.fill('#accountPassword','');
await page.click('#vaultSubmit');
await page.waitForTimeout(900);
ok('비밀번호를 비워도 저장됨', (await page.textContent('[data-account-id="a2"]')).includes('국세청 홈택스'));
await page.evaluate(()=>document.querySelector('[data-account-id="a2"] [data-copy-pw]').click());
await page.waitForTimeout(500);
ok('쓰던 비밀번호가 지워지지 않음', (await page.evaluate(()=>navigator.clipboard.readText()))==='세금5678',
   await page.evaluate(()=>navigator.clipboard.readText()));

// ── 4. 새 계정 추가는 그대로 된다(같은 창을 쓴다) ────────────────────
await page.evaluate(()=>openVault());
await page.waitForTimeout(500);
ok('추가는 빈 창으로 열림', (await field('#accountService'))==='' && (await field('#accountPassword'))==='');
ok('제목이 "새 계정 추가"', (await page.textContent('#vaultTitle')).trim()==='새 계정 추가');
await page.fill('#accountService','전자세금계산서');
await page.fill('#accountId','bill01');
await page.fill('#accountPassword','청구2026');
await page.click('#vaultSubmit');
await page.waitForTimeout(900);
ok('새 계정이 늘어남', (await page.$$('#pageGrid [data-account-id]')).length===3);

// ── 5. 저장된 자료 확인 ─────────────────────────────────────────
const stored = await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-account-meta')||'[]'));
const a1 = stored.find(x=>x.id==='a1'); const a2 = stored.find(x=>x.id==='a2');
ok('로컬에 수정 내용이 저장됨', a1.service==='나라장터(신규)' && a1.user==='hansol02', JSON.stringify(a1));
ok('수정하면 updatedAt 이 갱신됨', a1.updatedAt > '2026-09-01T00:00:00.000Z', a1.updatedAt);
ok('고치지 않은 아이디는 그대로', a2.user==='tax77', a2.user);
ok('삭제 표시가 붙지 않음', !a1.deleted && !a2.deleted);

await page.waitForTimeout(1500);
const doc = await page.evaluate(()=>JSON.parse(localStorage.getItem('fake-firestore-shared-state')||'{}'));
const cloudA1 = (doc.accountMeta||[]).find(x=>x.id==='a1');
ok('클라우드에도 수정이 올라감', cloudA1 && cloudA1.service==='나라장터(신규)', JSON.stringify(cloudA1));
ok('클라우드 계정 3개', (doc.accountMeta||[]).filter(x=>!x.deleted).length===3,
   String((doc.accountMeta||[]).length));
ok('클라우드 비밀번호도 갱신됨', doc.vaultSecrets && doc.vaultSecrets.a1==='새비번9999' && doc.vaultSecrets.a2==='세금5678',
   JSON.stringify(doc.vaultSecrets));
ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
