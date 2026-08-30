// 홈 화면 앱(PWA) 설정 — manifest · 아이콘 연결 · 기존 화면 영향 없음
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

// manifest 내용
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
ok('앱 이름 = 한솔 Knowledge', manifest.name==='한솔 Knowledge' && manifest.short_name==='한솔 Knowledge', manifest.name);
ok('standalone 실행(주소창 없음)', manifest.display==='standalone', manifest.display);
ok('start_url·scope 상대경로(GitHub Pages 하위 경로 대응)', manifest.start_url==='./' && manifest.scope==='./');
ok('theme_color·background_color 지정', /^#[0-9A-Fa-f]{6}$/.test(manifest.theme_color) && /^#[0-9A-Fa-f]{6}$/.test(manifest.background_color),
   `${manifest.theme_color} / ${manifest.background_color}`);
const sizes = manifest.icons.map(i=>i.sizes);
ok('192·512 아이콘 등록', sizes.includes('192x192') && sizes.includes('512x512'), sizes.join(', '));
ok('maskable 아이콘 등록', manifest.icons.some(i=>i.purpose==='maskable'));
ok('아이콘 경로도 상대경로', manifest.icons.every(i=>!i.src.startsWith('/')), manifest.icons.map(i=>i.src).join(', '));

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:900}});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// index.html 연결
const head = await page.evaluate(()=>({
  manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
  theme: document.querySelector('meta[name="theme-color"]')?.content,
  apple: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
  favicons: [...document.querySelectorAll('link[rel~="icon"]')].map(n=>n.getAttribute('href')),
  capable: document.querySelector('meta[name="mobile-web-app-capable"]')?.content,
  appleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.content,
  title: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content
}));
ok('manifest 연결', (head.manifest||'').startsWith('manifest.json'), head.manifest);
ok('theme-color 연결', head.theme===manifest.theme_color, head.theme);
ok('favicon 이 같은 아이콘 사용', head.favicons.length>0 && head.favicons.every(h=>h.startsWith('icons/icon-')), head.favicons.join(', '));
ok('apple-touch-icon 연결', (head.apple||'').startsWith('icons/icon-192.png'), head.apple);
ok('앱 실행 설정 meta', head.capable==='yes' && head.appleCapable==='yes' && head.title==='한솔 Knowledge');

// manifest 를 브라우저가 실제로 읽을 수 있는지
const fetched = await page.evaluate(async () => {
  const href = document.querySelector('link[rel="manifest"]').href;
  const res = await fetch(href);
  return { ok: res.ok, data: await res.json() };
});
ok('브라우저가 manifest 를 읽음', fetched.ok && fetched.data.name==='한솔 Knowledge');

// 서비스 워커 파일이 있고, 아무것도 캐시하지 않는지
const sw = fs.readFileSync(path.join(root,'sw.js'),'utf8');
ok('서비스 워커 파일 존재', sw.includes("addEventListener('fetch'"));
ok('캐시를 저장하지 않음(항상 최신 파일)', !/cache\.put|cache\.add|caches\.open/.test(sw));
ok('overlay(데스크톱 팝업)에서는 등록하지 않음', (await page.content()).includes("get('overlay') !== '1'"));

// 기존 화면·기능이 그대로인지
ok('상단 메뉴 유지', (await page.$$eval('#sideNav .top-item', n=>n.map(x=>x.textContent))).length===10);
ok('즐겨찾기 유지', await page.isVisible('#shortcutGrid'));
ok('카드 3개 유지', (await page.$$('#dashCols > section:not(.hidden)')).length===3);
ok('검색 미리보기 동작', await (async()=>{
  await page.click('#pageSearch'); await page.type('#pageSearch','특허',{delay:8});
  await page.waitForTimeout(400);
  return page.evaluate(()=>!document.querySelector('#searchPreview').classList.contains('hidden')); })());

// 아이콘 파일 안내 (아직 없으면 알려만 준다)
const need = ['icon-192.png','icon-512.png','icon-maskable-512.png']
  .filter(name => !fs.existsSync(path.join(root,'icons',name)));
if (need.length) console.log(`\n[안내] icons/ 에 아직 없는 파일: ${need.join(', ')} — PNG 를 넣으면 홈 화면 아이콘이 적용됩니다.`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
