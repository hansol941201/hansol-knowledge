// Firebase 가 아예 안 붙는 상황(SDK 로드 실패 / PIN 로그인 안 됨)에서 사이트 팝업이 정상인지.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const TODO='천민호부사장 600. 택배 확인하기';

async function scenario(name, initScript) {
  const ctx = await b.newContext({viewport:{width:1280,height:900}});
  if (initScript) await ctx.addInitScript(initScript);
  await ctx.route('**gstatic.com/**', r => r.abort());   // Firebase SDK 로드 실패 재현
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base+'/index.html');
  await page.waitForTimeout(1200);
  const blocked = await page.evaluate(() => !document.querySelector('#syncModal').classList.contains('hidden'));
  if (blocked) {
    await page.click('#syncLater');
    ok(`[${name}] PIN 창을 닫고 사이트를 쓸 수 있음`, true);
  }
  if (await page.isVisible('#orb')) await page.click('#orb');   // 이미 열려 있으면 그대로 쓴다
  await page.fill('#input', `할일 ${TODO}`);
  await page.press('#input', 'Enter');
  await page.waitForTimeout(1200);

  const bubbles = await page.$$eval('#messages .row.answer .bubble', n => n.map(x => x.textContent));
  ok(`[${name}] 팝업이 저장 안내를 보여 줌`, bubbles.some(t => t.includes('저장')), bubbles.at(-1)?.split('\n').slice(0,2).join(' / '));
  const panel = await page.textContent('#todayPanel');
  ok(`[${name}] 사이트 할 일 목록에 즉시 표시`, panel.includes(TODO));
  ok(`[${name}] 자바스크립트 오류 없음`, errors.length === 0, errors.join(' | '));
  const badge = await page.$eval('#syncState', n => n.textContent);
  ok(`[${name}] 연동 상태 배지 표시`, Boolean(badge), badge);

  // 새로고침해도 남아 있는지
  await page.reload();
  await page.waitForTimeout(1200);
  if (await page.evaluate(() => !document.querySelector('#syncModal').classList.contains('hidden'))) await page.click('#syncLater');
  ok(`[${name}] 새로고침 후에도 유지`, (await page.textContent('#todayPanel')).includes(TODO));
  await ctx.close();
}

// A) Firebase SDK 자체가 안 붙음 (사내망 차단 / CDN 실패)
await scenario('Firebase 미로드', null);

// B) SDK 는 붙었지만 PIN 로그인이 안 된 상태
await scenario('로그인 안 됨', () => {
  const auth = {
    currentUser: null,
    setPersistence: async () => {},
    signInWithEmailAndPassword: async () => { throw new Error('auth/wrong-password'); },
    onAuthStateChanged(next) { queueMicrotask(() => next(null)); return () => {}; }
  };
  const firestore = {
    doc: () => ({ get: async () => { throw new Error('permission-denied'); }, set: async () => { throw new Error('permission-denied'); }, onSnapshot: () => () => {} }),
    enablePersistence: async () => {},
    runTransaction: async () => { throw new Error('permission-denied'); }
  };
  window.firebase = {
    initializeApp: () => ({}),
    auth: Object.assign(() => auth, { Auth: { Persistence: { LOCAL: 'local' } } }),
    firestore: Object.assign(() => firestore, { FieldValue: { serverTimestamp: () => ({}) } })
  };
});

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
