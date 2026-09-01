// 즐겨찾기 팝업이 실제로 화면 오른쪽 절반에 열리는지 — 진짜 창을 띄워 크기·위치를 잰다.
// 창을 실제로 열어야 하므로 화면(디스플레이)이 필요하다.
//   npm run test:popup-geometry            (화면이 있는 PC)
//   xvfb-run -a -s "-screen 0 1920x1080x24" npm run test:popup-geometry   (리눅스 서버)
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

const b=await chromium.launch({
  executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: false, args: ['--no-sandbox']
});
const ctx=await b.newContext({ viewport: null });
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**', r=>r.abort());
await ctx.route(url => !url.href.startsWith(base), r => r.fulfill({ status:200, contentType:'text/html', body:'<title>site</title>ok' }));
const page=await ctx.newPage();
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:15000});
await page.waitForTimeout(600);

const want = await page.evaluate(()=>{
  const s = window.screen;
  const aw = s.availWidth, ah = s.availHeight, al = s.availLeft || 0, at = s.availTop || 0;
  const w = Math.floor(aw / 2);
  return { availWidth: aw, availHeight: ah, availLeft: al, availTop: at, width: w, height: ah, left: al + aw - w, top: at };
});
const [popup] = await Promise.all([
  page.waitForEvent('popup', { timeout: 10000 }),
  page.click('#shortcutGrid [data-shortcut] a')
]);
await popup.waitForLoadState('domcontentloaded').catch(()=>{});
await popup.waitForTimeout(800);
const got = await popup.evaluate(()=>({ outerWidth: window.outerWidth, outerHeight: window.outerHeight, screenX: window.screenX, screenY: window.screenY }));
console.log(`화면 ${want.availWidth}×${want.availHeight} · 요청 ${want.width}×${want.height} @ ${want.left},${want.top} · 실제 ${got.outerWidth}×${got.outerHeight} @ ${got.screenX},${got.screenY}`);

const near = (a, bb, slack = 2) => Math.abs(a - bb) <= slack;
ok('너비가 화면의 절반', near(got.outerWidth, want.width));
ok('높이가 작업표시줄 뺀 화면 높이', near(got.outerHeight, want.height));
ok('왼쪽 위치가 오른쪽 절반 시작점', near(got.screenX, want.left));
ok('위쪽 위치가 availTop', near(got.screenY, want.top));
ok('오른쪽 끝이 화면 끝에 붙음', near(got.screenX + got.outerWidth, want.availLeft + want.availWidth));
ok('대시보드 창은 그대로 열려 있음', !page.isClosed() && await page.isVisible('#shortcutGrid'));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
