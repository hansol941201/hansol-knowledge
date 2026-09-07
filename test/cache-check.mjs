// 서비스 워커가 브라우저에 남은 예전 파일(캐시)을 건너뛰는지 확인한다.
// 사이트를 고쳤는데 화면이 그대로인 문제를 막는 장치라, 깨지면 바로 알아야 한다.
// 파이어베이스 CDN 은 외부 주소라 이 검사에서는 뺀 사본으로 띄운다.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };

// 실제 파일을 그대로 쓰되 index.html 만 CDN 줄을 뺀 사본으로 바꾼다
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-check-'));
for (const name of fs.readdirSync(root)) {
  if (['node_modules','.git','test','docs','dist'].includes(name)) continue;
  fs.cpSync(path.join(root,name), path.join(work,name), { recursive: true });
}
fs.writeFileSync(path.join(work,'index.html'),
  fs.readFileSync(path.join(root,'index.html'),'utf8').split('\n').filter(l=>!l.includes('gstatic.com')).join('\n'));

const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/manifest+json'};
const hits=[];
const server=http.createServer((req,res)=>{
  const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html';
  const f=path.join(work,rel);
  if(!f.startsWith(work)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  hits.push({ rel, cc: req.headers['cache-control'] || '' });
  // 실제 GitHub Pages 처럼 "10분간 저장해도 된다"고 알려 준다 — 그래도 새로 받아야 한다
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'max-age=600'});
  res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1400,height:900}});
await ctx.addInitScript(stub);
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
let navs=0; page.on('framenavigated',f=>{ if(f===page.mainFrame()) navs++; });

await page.goto(base+'/index.html', { waitUntil:'load' });
ok('워커를 켜기 전에도 화면이 정상', (await page.$$('#sideNav button')).length>0);

const reg=await page.evaluate(async()=>{ try{ await navigator.serviceWorker.register('sw.js'); const r=await navigator.serviceWorker.ready; return r.active?'active':'no-active'; }catch(e){ return 'error: '+e.message; } });
ok('워커 등록·활성화', reg==='active', reg);
await page.waitForTimeout(2500);
const navsAfter=navs;
await page.waitForTimeout(2500);
ok('새로고침이 저절로 반복되지 않음', navs===navsAfter, `주소 이동 ${navs}회`);
// 활성화 중에 창을 새로 부르면 fetch 가로채기와 서로 물려 화면이 멈춘다 — 그 상태가 아닌지 본다
ok('활성화 뒤에도 화면이 멈추지 않음', Boolean(await page.evaluate(()=>Boolean(navigator.serviceWorker.controller))));

hits.length=0;
await page.goto(base+'/index.html', { waitUntil:'load' });
await page.waitForTimeout(1200);
ok('워커가 맡은 뒤에도 메뉴가 그려짐', (await page.$$('#sideNav button')).length>0, `${(await page.$$('#sideNav button')).length}개`);
ok('스타일이 적용됨', (await page.$eval('body', n=>getComputedStyle(n).backgroundColor))!=='rgba(0, 0, 0, 0)');
const fresh=hits.filter(h=>/no-cache/.test(h.cc));
ok('같은 사이트 파일을 전부 새로 받음', hits.length>0 && fresh.length===hits.length, `${fresh.length}/${hits.length}건`);
ok('index.html 도 새로 받음', hits.some(h=>h.rel==='index.html' && /no-cache/.test(h.cc)));
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 앱(Electron)은 워커를 쓰지 않으므로 main.js 에서 직접 저장본을 막는지 본다
const mainSource=fs.readFileSync(path.join(root,'main.js'),'utf8');
ok('데스크톱 앱도 저장본을 쓰지 않게 요청', /extraHeaders:[^\n]*no-cache/.test(mainSource));

await b.close(); server.close();
fs.rmSync(work,{recursive:true,force:true});
console.log(failures.length? `\n실패: ${failures.join(', ')}` : '\n모두 통과');
process.exit(failures.length?1:0);
