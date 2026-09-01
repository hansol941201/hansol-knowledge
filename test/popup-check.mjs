// 즐겨찾기 카드 → 화면 오른쪽 절반 팝업 창으로 열기
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

// 화면 값을 고정해 계산 결과를 정확히 확인한다.
const screenScript = (w,h,l,t) => `
  for (const [key, value] of Object.entries({availWidth:${w}, availHeight:${h}, availLeft:${l}, availTop:${t}}))
    Object.defineProperty(window.screen, key, { configurable: true, get: () => value });
  window.__OPENS = [];
  const realOpen = window.open.bind(window);
  window.open = (url, name, features) => { window.__OPENS.push({ url, name, features }); return realOpen(url, name, features); };
`;

async function makePage(w=1920, h=1040, l=0, t=0, opts={}) {
  const ctx = await b.newContext({ viewport:{width:1500,height:900}, ...opts });
  await ctx.addInitScript(stub);
  await ctx.addInitScript(screenScript(w,h,l,t));
  await ctx.route('**gstatic.com/**', r=>r.abort());
  // 바깥 사이트는 실제로 열지 않고 빈 문서로 대신한다.
  await ctx.route(url => !url.href.startsWith(base), r => r.fulfill({ status:200, contentType:'text/html', body:'<title>site</title>ok' }));
  const page = await ctx.newPage();
  await page.goto(base+'/index.html');
  await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
  await page.waitForTimeout(500);
  return { ctx, page };
}
const firstCard = (page) => page.evaluate(()=>{
  const a = document.querySelector('#shortcutGrid [data-shortcut] a');
  return { id: a.closest('[data-shortcut]').dataset.shortcut, href: a.getAttribute('href') };
});

// ── 1. 크기·위치 계산과 창 열림 ───────────────────────────────
{
  const { ctx, page } = await makePage(1920, 1040, 0, 0);
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const card = await firstCard(page);
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5000 }),
    page.click('#shortcutGrid [data-shortcut] a')
  ]);
  const call = (await page.evaluate(()=>window.__OPENS))[0];
  ok('클릭하면 팝업 창이 열림', Boolean(popup));
  ok('대시보드 창은 그대로 있음', !page.isClosed() && await page.isVisible('#shortcutGrid'));
  ok('연 주소가 즐겨찾기 주소', call.url === card.href, `${call.url}`);
  ok('창 이름이 즐겨찾기별로 구분됨', call.name === `favorite-${card.id}`, call.name);
  ok('너비 = 화면 너비의 50%', /(?:^|,)width=960(?:,|$)/.test(call.features), call.features);
  ok('높이 = 작업표시줄 뺀 화면 높이', /(?:^|,)height=1040(?:,|$)/.test(call.features));
  ok('오른쪽 끝 정렬 (left = availLeft + availWidth - width)', /(?:^|,)left=960(?:,|$)/.test(call.features));
  ok('위쪽은 availTop', /(?:^|,)top=0(?:,|$)/.test(call.features));
  ok('popup·resizable·scrollbars 지정', /popup=yes/.test(call.features) && /resizable=yes/.test(call.features) && /scrollbars=yes/.test(call.features));

  // 같은 카드를 다시 누르면 새 창을 만들지 않는다
  let extra = 0; ctx.on('page', () => { extra += 1; });
  await page.click('#shortcutGrid [data-shortcut] a');
  await page.waitForTimeout(600);
  ok('같은 즐겨찾기를 다시 누르면 창을 새로 만들지 않음', (await page.evaluate(()=>window.__OPENS.length))===1 && extra===0, `open ${await page.evaluate(()=>window.__OPENS.length)}회 · 새 창 ${extra}개`);

  // 다른 즐겨찾기는 별도 창
  const [popup2] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5000 }),
    page.evaluate(()=>document.querySelectorAll('#shortcutGrid [data-shortcut] a')[1].click())
  ]);
  const calls = await page.evaluate(()=>window.__OPENS);
  ok('다른 즐겨찾기는 별도 창으로 열림', Boolean(popup2) && calls.length===2 && calls[0].name!==calls[1].name, calls.map(c=>c.name).join(' / '));
  ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));
  await ctx.close();
}

// ── 2. 듀얼 모니터(availLeft 가 0 이 아닌 경우) ────────────────
{
  const { ctx, page } = await makePage(1600, 900, 1920, 30);
  await Promise.all([ page.waitForEvent('popup', { timeout: 5000 }), page.click('#shortcutGrid [data-shortcut] a') ]);
  const call = (await page.evaluate(()=>window.__OPENS))[0];
  ok('두 번째 모니터에서도 오른쪽 끝', /width=800/.test(call.features) && /left=2720/.test(call.features) && /top=30/.test(call.features), call.features);
  await ctx.close();
}

// ── 3. 팝업이 차단됐을 때 안내 ────────────────────────────────
{
  const { ctx, page } = await makePage(1920, 1040, 0, 0);
  await page.evaluate(()=>{ window.open = () => null; });          // 차단된 상황
  await page.click('#shortcutGrid [data-shortcut] a');
  await page.waitForTimeout(300);
  const toast = (await page.textContent('#toast')) || '';
  ok('팝업이 막히면 안내 문구 표시', toast.includes('팝업을 허용'), toast);
  ok('안내가 바로 사라지지 않음', await page.isVisible('#toast.show'));
  await ctx.close();
}

// ── 4. 모바일·좁은 화면은 새 탭 ───────────────────────────────
{
  const { ctx, page } = await makePage(820, 720, 0, 0, { viewport:{width:390,height:820}, hasTouch:true, isMobile:true });
  await page.click('#shortcutGrid [data-shortcut] a');
  await page.waitForTimeout(300);
  const call = (await page.evaluate(()=>window.__OPENS))[0];
  ok('좁은 화면에서는 새 탭으로 열림', call && call.name === '_blank' && !/width=/.test(String(call.features||'')), JSON.stringify(call));
  await ctx.close();
}

// ── 5. 기존 기능·디자인 유지 ─────────────────────────────────
{
  const { ctx, page } = await makePage(1920, 1040, 0, 0);
  const before = await page.$$eval('#shortcutGrid [data-shortcut]', n=>n.length);
  const size = await page.evaluate(()=>{
    const el=document.querySelector('#shortcutGrid [data-shortcut]');
    const box=el.getBoundingClientRect();
    return { w:Math.round(box.width), h:Math.round(box.height), thumb:Boolean(el.querySelector('.shortcut-thumb')), name:Boolean(el.querySelector('b')) };
  });
  ok('카드 디자인 그대로(96×88 · 그림 · 이름)', size.w===96 && size.h===88 && size.thumb && size.name, JSON.stringify(size));
  ok('Ctrl+클릭은 링크 그대로(새 탭)', await page.evaluate(()=>{
    const a=document.querySelector('#shortcutGrid [data-shortcut] a');
    return a.getAttribute('target')==='_blank' && a.getAttribute('href').startsWith('http');
  }));
  // 추가
  await page.click('#shortcutAdd'); await page.waitForTimeout(200);
  await page.fill('#shortcutName','테스트 사이트');
  await page.fill('#shortcutUrl','https://example.com/test');
  await page.click('#shortcutForm button[type="submit"]');
  await page.waitForTimeout(500);
  ok('즐겨찾기 추가 그대로 동작', (await page.$$eval('#shortcutGrid [data-shortcut]', n=>n.length))===before+1);
  const added = await page.evaluate(()=>{
    const el=[...document.querySelectorAll('#shortcutGrid [data-shortcut]')].find(n=>n.textContent.includes('테스트 사이트'));
    return { id: el.dataset.shortcut, href: el.querySelector('a').getAttribute('href') };
  });
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5000 }),
    page.evaluate(()=>[...document.querySelectorAll('#shortcutGrid [data-shortcut]')].find(n=>n.textContent.includes('테스트 사이트')).querySelector('a').click())
  ]);
  const last = (await page.evaluate(()=>window.__OPENS)).at(-1);
  ok('새로 추가한 즐겨찾기도 팝업으로 열림', Boolean(popup) && last.url==='https://example.com/test' && last.name===`favorite-${added.id}`, last.name);
  // 삭제
  await page.evaluate(()=>[...document.querySelectorAll('#shortcutGrid [data-shortcut]')].find(n=>n.textContent.includes('테스트 사이트')).querySelector('[data-shortcut-edit]').click());
  await page.waitForTimeout(200);
  page.on('dialog', d=>d.accept());
  await page.evaluate(()=>[...document.querySelectorAll('.row-menu button')].find(b=>b.textContent.includes('삭제'))?.click());
  await page.waitForTimeout(500);
  ok('즐겨찾기 삭제 그대로 동작', (await page.$$eval('#shortcutGrid [data-shortcut]', n=>n.length))===before);
  await ctx.close();
}

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
