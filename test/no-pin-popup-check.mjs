// 동기화 PIN 창이 저절로 뜨지 않는지 — 눌러서 여는 길과 동기화 자체는 그대로
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
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
// 로그인 전 상태로 만든다 — 저장된 PIN 을 지우고 대역을 로그아웃 상태로 바꾼다
await ctx.addInitScript(() => {
  try { localStorage.removeItem('knowledge-sync-pin'); } catch {}
  const auth = window.HANSOL_AUTH;
  auth.currentUser = null;
  auth.onAuthStateChanged = (next) => { queueMicrotask(() => next(auth.currentUser)); return () => {}; };
  auth.signInWithEmailAndPassword = async () => { auth.currentUser = { uid: 'test-user' }; return { user: auth.currentUser }; };
});
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForTimeout(1500);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const state = await page.evaluate(()=>({
  pinOpen: !document.querySelector('#syncModal').classList.contains('hidden'),
  badge: document.querySelector('#syncState').textContent,
  badgeTitle: document.querySelector('#syncState').title,
  signedIn: Boolean(window.HANSOL_AUTH && window.HANSOL_AUTH.currentUser)
}));
ok('열자마자 PIN 창이 뜨지 않음', !state.pinOpen, JSON.stringify(state));
ok('화면을 바로 쓸 수 있음', await page.isVisible('#shortcutGrid') && await page.isVisible('#todayPanel'));
ok('할 일 추가 등 기본 동작 가능', await page.evaluate(()=>{ document.querySelector('#pageAdd').click(); return true; }));
await page.keyboard.press('Escape');
await page.evaluate(()=>document.querySelector('#addClose').click());
await page.waitForTimeout(200);

// 로그인 전에도 자료는 이 기기에 저장된다
await page.evaluate(()=>{
  const el=document.querySelector('#pageAdd'); el.click();
});
await page.waitForTimeout(200);
await page.evaluate(()=>[...document.querySelectorAll('[data-add]')].find(b=>b.dataset.add==='할 일')?.click());
await page.waitForTimeout(200);
await page.fill('#quickTextInput','로그인 전에 적은 할 일');
await page.click('#quickTextForm button[type="submit"]');
await page.waitForTimeout(600);
ok('로그인 전에도 이 기기에 저장됨', await page.evaluate(()=>
  JSON.parse(localStorage.getItem('knowledge-todos')||'[]').some(t=>t.text==='로그인 전에 적은 할 일')));

// 눌러서 열 수 있는 길은 그대로
await page.evaluate(()=>document.querySelector('#syncState').click());
await page.waitForTimeout(300);
ok('연동 표시를 누르면 PIN 창이 열림', await page.isVisible('#syncModal'));
ok('안내 문구에 눌러서 동기화가 보임', /눌러서 동기화/.test(state.badge) || /눌러서 동기화/.test(state.badgeTitle), `${state.badge} / ${state.badgeTitle}`);
await page.evaluate(()=>document.querySelector('#syncLater').click());
await page.waitForTimeout(200);
ok('나중에 하기로 닫힘', !(await page.isVisible('#syncModal')));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
