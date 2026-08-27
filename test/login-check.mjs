// 팝업(오버레이)에서 로그인이 안 된 채 저장했을 때, PIN 창이 뜨고 로그인하면 밀린 게 올라가는지.
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
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:380,height:520}});
await ctx.route('**gstatic.com/**',r=>r.abort());
// 로그인 안 된 Firebase: PIN 을 넣으면 그때부터 동작한다.
await ctx.addInitScript(() => {
  let signedIn = false;
  let doc = null;
  const listeners = new Set();
  const snap = () => ({ exists: doc !== null, data: () => doc, metadata: { hasPendingWrites: false } });
  const guard = () => { if (!signedIn) throw Object.assign(new Error('permission-denied'), { code: 'permission-denied' }); };
  const ref = {
    get: async () => { guard(); return snap(); },
    set: async (d) => { guard(); doc = d; listeners.forEach(f => f(snap())); },
    onSnapshot: (next) => { listeners.add(next); queueMicrotask(() => next(snap())); return () => listeners.delete(next); }
  };
  const auth = {
    currentUser: null,
    setPersistence: async () => {},
    signInWithEmailAndPassword: async (_e, pin) => {
      if (String(pin).length < 6) throw new Error('auth/weak-password');
      signedIn = true; auth.currentUser = { uid: 'test' }; return { user: auth.currentUser };
    },
    onAuthStateChanged: (next) => { queueMicrotask(() => next(auth.currentUser)); return () => {}; }
  };
  const firestore = {
    doc: () => ref,
    enablePersistence: async () => {},
    runTransaction: async (fn) => { guard(); let staged=null;
      const r = await fn({ get: async () => snap(), set: (_r,d)=>{staged=d;} });
      if (staged) { doc = staged; listeners.forEach(f => f(snap())); }
      return r; }
  };
  window.firebase = { initializeApp: () => ({}), auth: Object.assign(()=>auth,{Auth:{Persistence:{LOCAL:'local'}}}),
    firestore: Object.assign(()=>firestore,{FieldValue:{serverTimestamp:()=>Date.now()}}) };
});

const page=await ctx.newPage();
page.on('pageerror',e=>console.log('  ERROR:',e.message));
await page.goto(base+'/index.html?overlay=1');       // 데스크톱 앱과 같은 오버레이 모드
await page.waitForTimeout(900);
if (await page.isVisible('#orb')) await page.click('#orb');   // 이미 열려 있으면 그대로 쓴다
await page.waitForTimeout(400);

// PIN 창이 떠 있으면 "나중에 하기"로 닫아, 로그인 안 한 상태를 만든다
if (await page.evaluate(()=>!document.querySelector('#syncModal').classList.contains('hidden'))) await page.click('#syncLater');

ok('팝업에 연동 상태 점이 보임', await page.isVisible('#syncDot'), await page.getAttribute('#syncDot','data-state'));

await page.fill('#input','할일 한솔'); await page.press('#input','Enter');
await page.waitForTimeout(1200);
const bubble = await page.$$eval('#messages .row.answer .bubble', n=>n.at(-1)?.textContent||'');
ok('저장 실패 시 로그인 필요 안내', bubble.includes('로컬 저장 완료·클라우드 연동 대기 중') && bubble.includes('동기화 PIN 로그인이 필요합니다'), bubble.split('\n').slice(0,2).join(' / '));
ok('PIN 창이 자동으로 열림', await page.evaluate(()=>!document.querySelector('#syncModal').classList.contains('hidden')));

// PIN 로그인 → 밀린 항목이 올라가야 한다
await page.fill('#syncPin','123456');
await page.click('#syncForm button[type="submit"]');
await page.waitForTimeout(2000);
ok('로그인 후 연동 상태가 live', (await page.getAttribute('#syncDot','data-state')) === 'live', await page.getAttribute('#syncDot','data-state'));
const uploaded = await page.evaluate(async () => {
  const d = (await window.HANSOL_FIRESTORE.doc('shared/state').get()).data() || {};
  return (d.todos||[]).some(t => t.text === '한솔');
});
ok('로그인 전에 저장한 할 일이 자동 업로드됨', uploaded);

await page.fill('#input','할일 로그인후 저장'); await page.press('#input','Enter');
await page.waitForTimeout(1200);
const bubble2 = await page.$$eval('#messages .row.answer .bubble', n=>n.at(-1)?.textContent||'');
ok('로그인 후 저장은 연동 완료로 표시', bubble2.includes('저장 및 연동 완료'), bubble2.split('\n')[0]);

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
