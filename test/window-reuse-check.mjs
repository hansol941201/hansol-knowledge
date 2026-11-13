// 중복 창 방지 — 「전체 지식 사이트 열기(↗)」를 눌러도 같은 사이트 탭이 늘어나지 않는지,
// 설치형 앱 설정이 기존 창을 재사용하도록 되어 있는지, 저장 자료는 그대로인지 점검한다.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

// 설치형 앱(PWA): 바로가기·작업표시줄로 다시 실행하면 이미 열린 앱 창을 앞으로
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const modes = [].concat(manifest.launch_handler?.client_mode || []);
ok('설치형 앱 재실행 시 기존 창 재사용(launch_handler)', modes[0]==='focus-existing', JSON.stringify(modes));
ok('앱 시작 주소·범위는 그대로', manifest.start_url==='./' && manifest.scope==='./' && manifest.display==='standalone');

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
// 실제 사이트로 나가지 않도록 배포 주소는 빈 화면으로 대신 응답한다.
await ctx.route('https://hansol941201.github.io/**', r=>r.fulfill({status:200, contentType:'text/html', body:'<title>한솔 지식</title>'}));
let newPages = 0;
const page=await ctx.newPage();
ctx.on('page', () => { newPages++; });
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const ready = async (p) => {
  await p.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
  await p.waitForTimeout(600);
};
await page.goto(base+'/index.html');
await ready(page);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 저장 자료 스냅숏 — 내용만 비교한다.
//  · 창 상태(knowledge-window-state)는 접기·펼치기로 바뀌는 값이라 뺀다.
//  · 화면이 새로 열릴 때 앱이 원래 하는 정리(updatedAt 보충, 계정 금고 재암호화)는
//    이번 수정과 무관하므로 updatedAt 과 암호문(knowledge-vault-data)·시험용 서버 사본은 뺀다.
const snapshot = (p) => p.evaluate(() => {
  const skip = new Set(['knowledge-window-state', 'knowledge-vault-data', 'fake-firestore-shared-state']);
  const strip = (v) => Array.isArray(v) ? v.map(strip)
    : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'updatedAt').map(([k, x]) => [k, strip(x)]))
    : v;
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (skip.has(k)) continue;
    const raw = localStorage.getItem(k);
    try { out[k] = JSON.stringify(strip(JSON.parse(raw))); } catch { out[k] = raw; }
  }
  return out;
});
const before = await snapshot(page);

// 1) 이미 전체 사이트 화면 안에서 ↗ → 새 탭 없이 이 화면의 대시보드로
await page.click('#sideNav button:has-text("특허")'); await page.waitForTimeout(300);
const dashBefore = await page.isVisible('#dashCols');
if (!(await page.isVisible('#app'))) { await page.click('#orb'); await page.waitForTimeout(300); }
await page.click('#siteShortcut'); await page.waitForTimeout(500);
await page.click('#orb'); await page.waitForTimeout(300);
await page.click('#siteShortcut'); await page.waitForTimeout(500);
ok('사이트 안에서 ↗ 두 번 눌러도 새 탭 없음', newPages===0, `새 탭 ${newPages}개`);
ok('↗ 누르면 팝업이 접히고 열기 버튼이 보임', !(await page.isVisible('#app')) && await page.isVisible('#orb'));
ok('↗ 누르면 대시보드(홈)로 이동', !dashBefore && await page.isVisible('#dashCols'), `이동 전 대시보드 보임=${dashBefore}`);

// 2) 브라우저에서 팝업 화면(?overlay=1)만 연 경우 → 한 창만 열고, 다시 누르면 그 창 재사용
const overlay = await ctx.newPage();
newPages = 0;
await overlay.goto(base+'/index.html?overlay=1');
await ready(overlay);
if (!(await overlay.isVisible('#app'))) { await overlay.click('#orb'); await overlay.waitForTimeout(300); }
await overlay.click('#siteShortcut'); await overlay.waitForTimeout(800);
const afterFirst = ctx.pages().length;
await overlay.click('#siteShortcut'); await overlay.waitForTimeout(800);
await overlay.click('#siteShortcut'); await overlay.waitForTimeout(800);
ok('팝업 화면 ↗ 첫 클릭은 사이트 창 1개', afterFirst === 3, `열린 페이지 ${afterFirst}개(기존 2 + 새 1)`);
ok('팝업 화면 ↗ 반복 클릭해도 창이 늘지 않음', ctx.pages().length === afterFirst, `열린 페이지 ${ctx.pages().length}개`);
const opened = ctx.pages().find(p => p.url().startsWith('https://hansol941201.github.io/hansol-knowledge/'));
ok('열린 창은 지식센터 주소', !!opened, ctx.pages().map(p=>p.url()).join(', '));
ok('고정 창 이름 사용', opened ? (await opened.evaluate(() => window.name)) === 'hansol-knowledge-main' : false);

// 3) 다른 외부 사이트 링크(즐겨찾기 카드)는 예전처럼 새 탭 동작 유지
const cardTarget = await page.$eval('#shortcutGrid .shortcut a', a => a.getAttribute('target')).catch(() => null);
ok('즐겨찾기 카드 링크 방식 그대로(새 탭)', cardTarget === '_blank', String(cardTarget));

// 4) 저장 자료 그대로
const after = await snapshot(page);
const changed = Object.keys({ ...before, ...after }).filter(k => before[k] !== after[k]);
ok('즐겨찾기·할 일·저장 자료 변화 없음', changed.length === 0, changed.join(', '));
ok('자바스크립트 오류 없음(마지막)', errors.length===0, errors.join(' | '));

await b.close(); server.close();
if (failures.length) { console.log(`\n${failures.length}개 실패`); process.exit(1); }
console.log('\n모두 통과');
