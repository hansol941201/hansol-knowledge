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
ok('대시보드 카드 2개 유지', (await page.$$('#dashCols > section:not(.hidden)')).length===2);
ok('검색 미리보기 동작', await (async()=>{
  await page.click('#pageSearch'); await page.type('#pageSearch','특허',{delay:8});
  await page.waitForTimeout(400);
  return page.evaluate(()=>!document.querySelector('#searchPreview').classList.contains('hidden')); })());

// 아이콘 파일 — 실제 파일이 있고 규격이 맞는지
const pngSize = file => { const b = fs.readFileSync(file); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
for (const [name, want] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512]]) {
  const file = path.join(root,'icons',name);
  const exists = fs.existsSync(file);
  ok(`icons/${name} 존재`, exists);
  if (!exists) continue;
  const [w,h] = pngSize(file);
  ok(`icons/${name} 크기 ${want}×${want}`, w===want && h===want, `${w}×${h}`);
}

const iconCheck = await page.evaluate(async () => {
  const load = async src => { const img=new Image(); img.src=src; await img.decode();
    const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
    c.getContext('2d').drawImage(img,0,0);
    return {w:img.naturalWidth,h:img.naturalHeight,d:c.getContext('2d').getImageData(0,0,c.width,c.height).data}; };

  const any = await load('icons/icon-512.png');
  const px = (o,x,y)=>{const i=(y*o.w+x)*4;return [o.d[i],o.d[i+1],o.d[i+2],o.d[i+3]];};
  const anyEdge = px(any,0,256);

  const m = await load('icons/icon-maskable-512.png');
  // 바깥 12% 테두리가 전부 불투명한 배경색인지 (갤럭시가 동그랗게 잘라도 잘릴 그림이 없음)
  const pad = Math.round(m.w*0.12);
  const base = px(m,0,0);
  let bleed = 0;
  for (let y=0;y<m.h;y++) for (let x=0;x<m.w;x++) {
    if (x>=pad && x<m.w-pad && y>=pad && y<m.h-pad) continue;
    const p = px(m,x,y);
    if (p[3]<255 || Math.abs(p[0]-base[0])>12 || Math.abs(p[1]-base[1])>12 || Math.abs(p[2]-base[2])>12) bleed++;
  }
  return { anyLoaded: any.w===512, anyEdge, maskBase: base, bleed };
});
ok('아이콘이 브라우저에서 실제로 열림', iconCheck.anyLoaded);
ok('아이콘 테두리에 흰 여백 없음', iconCheck.anyEdge[3]===255 && iconCheck.anyEdge[2] > iconCheck.anyEdge[0], iconCheck.anyEdge.join(','));
ok('maskable 은 배경이 꽉 차 있음(투명·흰 여백 없음)', iconCheck.maskBase[3]===255, iconCheck.maskBase.join(','));
ok('maskable 안전 여백 확보(바깥 12% 안에 그림 없음)', iconCheck.bleed===0, `침범 ${iconCheck.bleed}px`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
