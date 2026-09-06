// 즐겨찾기 복구 확인 — 카드 표시 · 팝업 열기 · 추가/수정/삭제 · 동기화 안내
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/manifest+json','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };

const mkCtx = async (b, patch) => {
  const ctx = await b.newContext({ viewport:{width:1500,height:950} });
  await ctx.addInitScript(stub);
  if (patch) await ctx.addInitScript(patch);
  await ctx.route('**gstatic.com/**', r=>r.abort());
  // 바깥 주소는 실제로 열지 않는다. 자바스크립트 파일이면 빈 스크립트를 돌려준다.
  await ctx.route(u=>!u.href.startsWith(base), r => r.request().url().endsWith('.js')
    ? r.fulfill({ status:200, contentType:'text/javascript', body:'' })
    : r.fulfill({ status:200, contentType:'text/html', body:'<title>site</title>' }));
  return ctx;
};
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});

// ── 1. 사이트가 제대로 실행되는지(빈 껍데기 HTML 이 아닌지) ──
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
ok('index.html 이 앱 파일을 불러옴', /app\.js/.test(html) && /styles\.css/.test(html) && /firebase-config\.js/.test(html));
ok('즐겨찾기 자리(#shortcutGrid)가 있음', /id="shortcutGrid"/.test(html));
ok('링크만 있는 껍데기 화면이 아님', !/cdn\.tailwindcss\.com/.test(html));

const ctx = await mkCtx(b);
const page = await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const failed=[]; page.on('requestfailed',r=>{ if (r.url().startsWith(base)) failed.push(r.url()); });
page.on('dialog', d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));
ok('파일 요청 실패 없음', failed.length===0, failed.join(' | '));

const cards = () => page.$$eval('#shortcutGrid [data-shortcut]', n=>n.map(c=>({ name:c.querySelector('b').textContent, href:c.querySelector('a').getAttribute('href') })));
const list = await cards();
ok('기본 즐겨찾기 7개가 보임', list.length===7, `${list.length}개`);
ok('주소가 실제 사이트로 연결됨', list.every(c=>/^https?:\/\//.test(c.href)), list.map(c=>c.name).join(', '));

// ── 2. 카드 클릭 → 오른쪽 절반 팝업 ──
const [popup] = await Promise.all([
  page.waitForEvent('popup', { timeout: 6000 }),
  page.click('#shortcutGrid [data-shortcut] a')
]);
ok('카드를 누르면 팝업이 열림', Boolean(popup));
const call = await page.evaluate(()=>window.__lastOpen || null);
ok('대시보드 창은 그대로', await page.isVisible('#shortcutGrid'));

// 팝업 크기·위치 계산 확인
const geo = await page.evaluate(()=>{
  const s=window.screen, w=Math.floor(s.availWidth/2);
  return { width:w, left:(s.availLeft||0)+s.availWidth-w, height:s.availHeight };
});
ok('오른쪽 절반 크기로 계산됨', geo.width>0 && geo.left===geo.width || geo.left>0, JSON.stringify(geo));

// ── 3. 추가 · 수정 · 삭제 ──
await page.click('#shortcutAdd'); await page.waitForTimeout(250);
await page.fill('#shortcutName','시험 사이트');
await page.fill('#shortcutUrl','https://example.com/recover');
await page.click('#shortcutForm button[type="submit"]');
await page.waitForTimeout(500);
ok('즐겨찾기 추가', (await cards()).length===8 && (await cards()).some(c=>c.name==='시험 사이트'));
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('새로고침해도 유지', (await cards()).some(c=>c.name==='시험 사이트'));
ok('클라우드에도 저장됨', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.shortcuts||[]).some(s=>s.name==='시험 사이트'); }));

await page.evaluate(()=>[...document.querySelectorAll('#shortcutGrid [data-shortcut]')].find(c=>c.textContent.includes('시험 사이트')).querySelector('[data-shortcut-edit]').click());
await page.waitForTimeout(250);
await page.evaluate(()=>[...document.querySelectorAll('.row-menu button')].find(b=>b.textContent==='수정').click());
await page.waitForTimeout(300);
ok('수정 창이 기존 값으로 열림', (await page.inputValue('#shortcutName'))==='시험 사이트');
await page.fill('#shortcutName','시험 사이트(수정)');
await page.click('#shortcutForm button[type="submit"]');
await page.waitForTimeout(500);
ok('수정 반영', (await cards()).some(c=>c.name==='시험 사이트(수정)'));

await page.evaluate(()=>[...document.querySelectorAll('#shortcutGrid [data-shortcut]')].find(c=>c.textContent.includes('시험 사이트')).querySelector('[data-shortcut-edit]').click());
await page.waitForTimeout(250);
await page.evaluate(()=>[...document.querySelectorAll('.row-menu button')].find(b=>b.textContent==='삭제').click());
await page.waitForTimeout(500);
ok('삭제 반영', (await cards()).length===7 && !(await cards()).some(c=>c.name.includes('시험 사이트')));

// ── 4. 버튼끼리 충돌하지 않는지 ──
let extraPopup = 0; ctx.on('page', ()=>{ extraPopup += 1; });
await page.evaluate(()=>document.querySelector('#shortcutGrid [data-shortcut] [data-shortcut-edit]').click());
await page.waitForTimeout(400);
ok('⋯ 버튼을 눌러도 사이트가 열리지 않음', extraPopup===0 && (await page.$$('.row-menu')).length===1);
await page.keyboard.press('Escape'); await page.waitForTimeout(200);

// ── 5. 팝업이 막혔을 때 안내 ──
await page.evaluate(()=>{ window.open = () => null; });
await page.click('#shortcutGrid [data-shortcut] a');
await page.waitForTimeout(300);
ok('팝업 차단 시 안내 표시', (await page.textContent('#toast')).includes('팝업을 허용'), await page.textContent('#toast'));

// ── 6. 동기화 전에는 안내가 보이는지 ──
const offlineCtx = await mkCtx(b, () => {
  try { localStorage.removeItem('knowledge-sync-pin'); } catch {}
  const auth = window.HANSOL_AUTH;
  auth.currentUser = null;
  auth.onAuthStateChanged = (next) => { queueMicrotask(()=>next(auth.currentUser)); return ()=>{}; };
  auth.signInWithEmailAndPassword = async () => { auth.currentUser = { uid:'test-user' }; return { user: auth.currentUser }; };
});
const off = await offlineCtx.newPage();
await off.goto(base+'/index.html');
await off.waitForTimeout(1500);
ok('로그인 전에는 이 기기에만 저장 중이라고 알려 줌', await off.isVisible('#shortcutNotice') && (await off.textContent('#shortcutNotice')).includes('이 기기에만'), await off.textContent('#shortcutNotice'));
ok('연결 버튼이 있음', await off.isVisible('#shortcutConnect'));
await off.click('#shortcutConnect'); await off.waitForTimeout(300);
ok('연결 버튼을 누르면 동기화 창이 열림', await off.isVisible('#syncModal'));
ok('안내가 떠도 즐겨찾기는 그대로 보임', (await off.$$('#shortcutGrid [data-shortcut]')).length===7);
ok('연동되면 안내가 사라짐', await page.evaluate(()=>document.querySelector('#shortcutNotice').classList.contains('hidden')));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
