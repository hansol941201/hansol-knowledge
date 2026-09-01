import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const out = process.env.SHOT_DIR || '/tmp';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1.5});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
await ctx.route('**google.com/s2/favicons**', r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#DFD4FA"/></svg>'}));
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));
ok('세로 사이드바 없음', (await page.$$('.sidebar')).length===0);
ok('상단 가로 메뉴 표시', await page.isVisible('.topnav') && await page.isVisible('#sideNav.top-nav'));
ok('메뉴 순서', (await page.$$eval('#sideNav .top-item', n=>n.map(x=>x.textContent))).join('/')
  ==='대시보드/내 지식/할 일/기억/특허/협력업체/계정/연락처/업무지식/메일함/기억 저장소');
ok('메뉴는 한 줄', await page.evaluate(()=>{
  const tops=new Set([...document.querySelectorAll('#sideNav .top-item')].map(n=>Math.round(n.getBoundingClientRect().top)));
  return tops.size===1; }));
ok('기억 저장소가 메뉴 마지막', await page.isVisible('#sideNav #memoryToggle'));
ok('대시보드가 기본 선택', (await page.textContent('.top-item.active')).includes('대시보드'));
ok('선택 메뉴는 남색 글자 + 3px 아래 선(배경 없음)', await page.evaluate(()=>{
  const c=getComputedStyle(document.querySelector('.top-item.active'));
  return c.color==='rgb(31, 58, 95)' && c.borderBottomColor==='rgb(31, 58, 95)'
    && c.borderBottomWidth==='3px' && c.backgroundColor==='rgba(0, 0, 0, 0)' && c.borderRadius==='0px'; }));
ok('로고·별 아이콘 제거', (await page.$$('.top-brand')).length===0 && (await page.$$('.topnav .side-mark')).length===0
  && !(await page.textContent('.topnav')).includes('한솔 지식'));
ok('헤더 높이 64px · 양옆 24px', await page.evaluate(()=>{
  const c=getComputedStyle(document.querySelector('.topnav'));
  return c.height==='64px' && parseFloat(c.paddingLeft)>=24 && parseFloat(c.paddingRight)>=24; }));
ok('메뉴가 화면 가운데', await page.evaluate(()=>{
  const items=[...document.querySelectorAll('#sideNav .top-item')];
  const left=items[0].getBoundingClientRect().left, right=items.at(-1).getBoundingClientRect().right;
  return Math.abs((left + right) / 2 - window.innerWidth / 2) < 6; }));
ok('메뉴 글자 15~16px · 두께 500 이상 · 줄바꿈 없음', await page.evaluate(()=>{
  const items=[...document.querySelectorAll('#sideNav .top-item')];
  return items.every(el=>{
    const c=getComputedStyle(el);
    return parseFloat(c.fontSize)>=15 && parseFloat(c.fontSize)<=16 && Number(c.fontWeight)>=500
      && c.whiteSpace==='nowrap' && parseFloat(c.paddingLeft)>=14 && parseFloat(c.paddingLeft)<=18
      && el.getBoundingClientRect().height <= 64; }); }));
ok('메뉴 사이 간격 4px 이상', await page.evaluate(()=>{
  const items=[...document.querySelectorAll('#sideNav .top-item')];
  for(let i=1;i<items.length;i+=1){
    if(items[i].getBoundingClientRect().left - items[i-1].getBoundingClientRect().right < 3.5) return false; }
  return true; }));
// 좁은 화면 — 햄버거 없이 메뉴 줄만 가로 스크롤, 선택 메뉴는 보이는 위치로
await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(400);
ok('좁은 화면에서 메뉴 줄만 가로 스크롤', await page.evaluate(()=>{
  const nav=document.querySelector('#sideNav');
  const c=getComputedStyle(nav);
  return c.overflowX==='auto' && nav.scrollWidth > nav.clientWidth
    && Math.round(document.documentElement.scrollWidth - window.innerWidth) <= 1; }));
ok('가로 스크롤바 숨김', await page.evaluate(()=>{
  const nav=document.querySelector('#sideNav');
  return nav.offsetHeight - nav.clientHeight <= 1; }));
ok('좁은 화면에서도 세로 사이드바·햄버거 없음', (await page.$$('.sidebar')).length===0);
await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].find(el=>el.textContent==='업무지식').click());
await page.waitForTimeout(400);
ok('선택 메뉴가 보이는 위치로 이동', await page.evaluate(()=>{
  const nav=document.querySelector('#sideNav');
  const a=nav.querySelector('.top-item.active');
  const nb=nav.getBoundingClientRect(), ab=a.getBoundingClientRect();
  return ab.left >= nb.left - 1 && ab.right <= nb.right + 1; }));
ok('긴 메뉴도 줄바꿈 없음', await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')]
  .every(el=>el.getBoundingClientRect().height <= 64)));
await page.evaluate(()=>document.querySelector('#sideNav .top-item[data-nav="대시보드"]').click());
await page.waitForTimeout(300);
await page.setViewportSize({width:1500,height:950}); await page.waitForTimeout(400);

ok('보라색 미사용', await page.evaluate(()=>{
  const purple=['rgb(109, 74, 224)','rgb(242, 238, 253)','rgb(223, 212, 250)'];
  return [...document.querySelectorAll('.topnav, .topnav *')].every(el=>{
    const c=getComputedStyle(el);
    return !purple.includes(c.color) && !purple.includes(c.backgroundColor) && !purple.includes(c.borderBottomColor); }); }));
ok('자주 가는 사이트 표시', await page.isVisible('#shortcutSection'));
ok('오늘의 할 일 표시', await page.isVisible('#todayPanel'));
ok('이모지 없음', !/[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}]/u.test(await page.textContent('.workspace')));
ok('통계·최근활동 영역 없음', !(await page.content()).includes('최근 활동') && !(await page.content()).includes('총 지식 수'));

// 사이트 바로가기 추가
await page.click('#shortcutAdd'); await page.waitForTimeout(250);
await page.fill('#shortcutName','K-APT'); await page.fill('#shortcutUrl','k-apt.go.kr');
await page.click('#shortcutForm button[type="submit"]'); await page.waitForTimeout(400);
ok('사이트 추가됨', (await page.textContent('#shortcutGrid')).includes('K-APT'));
ok('localStorage 에 저장', await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-shortcuts')||'[]').some(x=>x.name==='K-APT')));
ok('클라우드에도 저장', await page.evaluate(async()=>{const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};return (d.shortcuts||[]).some(x=>x.name==='K-APT');}));

// 지식 추가 모달 — 기억 / 할 일 분리
await page.click('#pageAdd'); await page.waitForTimeout(250);
await page.click('[data-add="기억"]'); await page.fill('#quickTextInput','춘천인성 협약서 확인');
await page.click('#quickTextForm button[type="submit"]'); await page.waitForTimeout(1500);
let split = await page.evaluate(()=>({m:memories.filter(x=>!x.deleted&&x.text==='춘천인성 협약서 확인').length, t:todos.filter(x=>!x.deleted&&x.text==='춘천인성 협약서 확인').length}));
ok('기억은 기억에만 저장', split.m===1&&split.t===0, JSON.stringify(split));
await page.click('#pageAdd'); await page.waitForTimeout(250);
await page.click('[data-add="할 일"]'); await page.fill('#quickTextInput','금화기업 전화');
await page.click('#quickTextForm button[type="submit"]'); await page.waitForTimeout(1500);
split = await page.evaluate(()=>({t:todos.filter(x=>!x.deleted&&x.text==='금화기업 전화').length, m:memories.filter(x=>!x.deleted&&x.text==='금화기업 전화').length}));
ok('할 일은 할 일에만 저장', split.t===1&&split.m===0, JSON.stringify(split));
ok('할 일 카드에 표시', (await page.textContent('#todayPanel')).includes('금화기업 전화'));



// 검색
await page.fill('#pageSearch','춘천'); await page.press('#pageSearch','Enter'); await page.waitForTimeout(400);
ok('검색 시 할 일 영역 숨김', !(await page.isVisible('#todayPanel')));
ok('검색 시 바로가기 숨김', !(await page.isVisible('#shortcutSection')));
ok('검색어 형광펜', (await page.$$eval('#pageGrid mark', n=>n.map(x=>x.textContent))).includes('춘천'));

await page.fill('#pageSearch',''); await page.waitForTimeout(400);
ok('검색어 지우면 할 일 다시 표시', await page.isVisible('#todayPanel'));

// 상단 메뉴 이동 + 상세 보기
await page.click('[data-nav="특허"]'); await page.waitForTimeout(600);
ok('특허 화면 이동', (await page.textContent('#pageHeading'))==='특허');
ok('특허 카드 렌더', (await page.$$eval('#pageGrid .patent-card', n=>n.length))>100);
await page.click('#pageGrid .patent-card'); await page.waitForTimeout(300);
ok('카드 클릭 시 상세 열림', await page.isVisible('#detailModal'));

await page.click('#detailClose');

await page.click('[data-nav="기억"]'); await page.waitForTimeout(400);
ok('기억 화면에 기억 카드', (await page.textContent('#pageGrid')).includes('춘천인성 협약서 확인'));
await page.click('[data-nav="할 일"]'); await page.waitForTimeout(400);
ok('할 일 화면', (await page.textContent('#pageHeading'))==='할 일' && await page.isVisible('#todayPanel'));

// 반응형
for (const w of [1440, 1366, 1024]) {
  await page.setViewportSize({width:w, height:900});
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 1);
  ok(`${w}px 가로 넘침 없음`, !overflow);
}
await page.setViewportSize({width:1920,height:1080});
await b.close(); server.close();
if (errors.length) console.log('JS 오류:\n' + errors.join('\n'));
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
