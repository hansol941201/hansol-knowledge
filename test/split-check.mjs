// 기능(즐겨찾기 자료·창 열기)과 디자인(레이아웃·색)이 서로 다른 파일에 있는지,
// 그리고 디자인 파일만 고쳐도 즐겨찾기가 살아 있는지 확인한다.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };

// ── 파일이 나뉘어 있는지 (브라우저 없이) ──────────────────────
const svc = fs.readFileSync(path.join(root,'shortcuts.js'),'utf8');
const store = fs.readFileSync(path.join(root,'store.js'),'utf8');
const views = fs.readFileSync(path.join(root,'views.js'),'utf8');
const css = fs.readFileSync(path.join(root,'styles.css'),'utf8');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
const noComments = (text) => text.replace(/\/\/.*$/gm,'').replace(/\/\*[\s\S]*?\*\//g,'');

// 자료 보관 — store.js
ok('모든 자료의 저장·불러오기가 store.js 에 있음',
   /knowledge-messenger-data/.test(store) && /knowledge-todos/.test(store) &&
   /knowledge-schedule/.test(store) && /function readList/.test(store) && /function writeList/.test(store));
ok('store.js 에는 디자인도 화면 코드도 없음',
   !/#[0-9A-Fa-f]{6}|px\b|querySelector|innerHTML/.test(noComments(store)));
// 화면 구성 — views.js
ok('할 일·일정·즐겨찾기 화면 구성이 views.js 에 있음',
   /todoActiveRow/.test(views) && /scheduleGroups/.test(views) && /shortcutGrid/.test(views));
ok('views.js 는 자료를 직접 읽거나 쓰지 않음',
   !/localStorage/.test(views));
ok('views.js 는 클릭 처리를 하지 않음',
   !/addEventListener|\.onclick|querySelector/.test(noComments(views)));
ok('app.js 는 자료를 직접 읽고 쓰지 않음(대체 동작 제외)',
   !/localStorage\.(get|set)Item\('knowledge-(messenger-data|todos|memories|account-meta|schedule|shortcuts)'/
      .test(app.replace(/const STORE = window\.HANSOL_STORE[\s\S]*?\n\}\)\(\);\n/,'')
              .replace(/const SHORTCUT_STORE[\s\S]*?\n\};\n/,'')));
ok('즐겨찾기 자료·창 열기가 shortcuts.js 에 있음',
   /STORE_KEY\s*=\s*'knowledge-shortcuts'/.test(svc) && /function open\(item/.test(svc) && /availWidth \/ 2/.test(svc));
ok('shortcuts.js 에는 디자인(색·픽셀)이 없음',
   !/#[0-9A-Fa-f]{6}|px\b|grid-template|border-radius/.test(svc.replace(/\/\/.*$/gm,'')));
ok('app.js 는 즐겨찾기를 직접 읽고 쓰지 않음',
   !/localStorage\.(get|set)Item\('knowledge-shortcuts'/.test(app.replace(/const SHORTCUT_STORE[\s\S]*?\n};\n/,'')));
ok('레이아웃·색은 styles.css 에 있음', /\.todo-group-list\s*{/.test(css) && /\.todo-item\.late/.test(css));
ok('index.html 이 네 파일을 app.js 보다 먼저 읽음', (()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const at = html.indexOf('app.js?v=');
  return ['store.js','shortcuts.js','views.js'].every(f => html.indexOf(f) > 0 && html.indexOf(f) < at);
})());

// ── 실제로 돌려 본다 ─────────────────────────────────────────
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');

const saved=[{ id:'s1', type:'shortcut', name:'저장된 즐겨찾기', url:'example.com', order:1,
  createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z' }];
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.addInitScript(`localStorage.setItem('knowledge-shortcuts', ${JSON.stringify(JSON.stringify(saved))});`);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);

ok('네 파일이 실제로 실린다', await page.evaluate(()=>
  Boolean(window.HANSOL_SHORTCUTS) && Boolean(window.HANSOL_STORE) && Boolean(window.HANSOL_VIEWS)));
ok('화면 구성이 views.js 것으로 그려진다', await page.evaluate(()=>{
  const made = window.HANSOL_VIEWS.todoActiveRow({ id:'t1', text:'검사', date:'' });
  return made.includes('todo-item') && made.includes('todo-badge') && made.includes('검사');
}));
ok('app.js 가 대체 동작이 아니라 shortcuts.js 를 쓴다',
   await page.evaluate(()=>window.HANSOL_SHORTCUTS.STORE_KEY==='knowledge-shortcuts' && typeof window.HANSOL_SHORTCUTS.open==='function'));
ok('저장돼 있던 즐겨찾기가 그대로 보임',
   (await page.textContent('#shortcutGrid')).includes('저장된 즐겨찾기'));

// 추가 → 새로고침 후에도 남아 있는지
await page.click('#shortcutAdd');
await page.fill('#shortcutName','검사용 사이트');
await page.fill('#shortcutUrl','test.example.com');
await page.click('#shortcutForm button[type="submit"]');
await page.waitForTimeout(400);
ok('즐겨찾기 추가', (await page.textContent('#shortcutGrid')).includes('검사용 사이트'));
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('새로고침 후에도 남아 있음', (await page.textContent('#shortcutGrid')).includes('검사용 사이트'));

// 수정 — ⋯ 버튼을 눌러 뜨는 작은 메뉴에서 고른다
const rowMenu = async (name, label) => {
  await page.evaluate(t=>[...document.querySelectorAll('[data-shortcut]')]
    .find(n=>n.textContent.includes(t)).querySelector('[data-shortcut-edit]').click(), name);
  await page.waitForSelector('.row-menu button', { timeout: 5000 });
  await page.evaluate(l=>[...document.querySelectorAll('.row-menu button')]
    .find(b=>b.textContent.trim()===l).click(), label);
  await page.waitForTimeout(400);
};
await rowMenu('검사용 사이트', '수정');
await page.fill('#shortcutName','이름 바꾼 사이트');
await page.click('#shortcutForm button[type="submit"]');
await page.waitForTimeout(400);
ok('즐겨찾기 수정', (await page.textContent('#shortcutGrid')).includes('이름 바꾼 사이트'));

// 클릭 → 오른쪽 절반 팝업 규칙
const geom = await page.evaluate(()=>{
  const calls=[]; const real=window.open;
  window.open=(url,name,features)=>{ calls.push({url,name,features}); return { closed:false, focus(){} }; };
  // 클릭 처리는 카드 안쪽 <a> 에 붙어 있다
  [...document.querySelectorAll('[data-shortcut]')].find(n=>n.textContent.includes('이름 바꾼 사이트')).querySelector('a').click();
  window.open=real;
  const view=window.screen;
  return { calls, half: Math.floor((view.availWidth||innerWidth)/2),
           right: (Number.isFinite(view.availLeft)?view.availLeft:0) + (view.availWidth||innerWidth) - Math.floor((view.availWidth||innerWidth)/2) };
});
const call = geom.calls[0] || {};
ok('클릭하면 창을 연다', Boolean(call.url), JSON.stringify(call).slice(0,120));
ok('창 이름이 즐겨찾기마다 다름', /^favorite-/.test(call.name||''), call.name);
ok('가로는 화면의 절반', new RegExp(`width=${geom.half}\\b`).test(call.features||''), call.features);
ok('오른쪽에 붙는다', new RegExp(`left=${geom.right}\\b`).test(call.features||''), call.features);

// 삭제 — 같은 메뉴의 '삭제'
await rowMenu('이름 바꾼 사이트', '삭제');
ok('즐겨찾기 삭제', !(await page.textContent('#shortcutGrid')).includes('이름 바꾼 사이트'));
ok('원래 있던 즐겨찾기는 그대로', (await page.textContent('#shortcutGrid')).includes('저장된 즐겨찾기'));
ok('콘솔 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length? `\n실패: ${failures.join(', ')}` : '\n모두 통과');
process.exit(failures.length?1:0);
