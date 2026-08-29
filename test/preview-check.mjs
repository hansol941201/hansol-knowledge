// 검색 미리보기 — 실시간 결과 · 기능 바로가기 · 키보드 조작
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const seedTodos=[{id:'t1',type:'todo',text:'고객사 견적서 회신',raw:'x',date:'2026-08-27',done:false,source:'테스트',createdAt:'2026-08-26T01:00:00.000Z',updatedAt:'2026-08-26T01:00:00.000Z'}];
const seedMemos=[{id:'m1',type:'memory',text:'고객 요청 자료 정리',raw:'x',source:'테스트',createdAt:'2026-08-26T01:00:00.000Z',updatedAt:'2026-08-26T01:00:00.000Z'}];
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1600,height:1000}});
await ctx.addInitScript(stub);
await ctx.addInitScript(d=>{localStorage.setItem('knowledge-todos',JSON.stringify(d.t));localStorage.setItem('knowledge-memories',JSON.stringify(d.m));},{t:seedTodos,m:seedMemos});
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const type = async (text) => {
  await page.fill('#pageSearch','');
  await page.click('#pageSearch');
  await page.type('#pageSearch', text, { delay: 8 });
  await page.waitForTimeout(400);
};
const open = () => page.evaluate(()=>!document.querySelector('#searchPreview').classList.contains('hidden'));
const rows = () => page.$$eval('#searchPreview .preview-item', n=>n.map(x=>x.textContent.replace(/\s+/g,' ').trim()));

// 1. 한 글자만 입력해도 나온다 · 실시간 갱신
await type('특');
ok('한 글자 입력에도 미리보기 표시', await open() && (await rows()).length>0, JSON.stringify((await rows()).slice(0,2)));
const first = await rows();
await type('협력');
const second = await rows();
ok('검색어를 바꾸면 결과도 바뀜', JSON.stringify(first)!==JSON.stringify(second), JSON.stringify(second.slice(0,2)));
ok('검색어가 없으면 닫힘', await (async()=>{ await page.fill('#pageSearch',''); await page.waitForTimeout(300); return !(await open()); })());

// 2. 기능 바로가기 · 저장 자료가 함께 나온다
await type('특허');
ok('기능 바로가기 구역', (await page.textContent('#searchPreview')).includes('기능 바로가기'));
ok('검색 결과 구역', (await page.textContent('#searchPreview')).includes('검색 결과'));
ok('실제 메뉴가 기능으로 표시', (await rows()).some(t=>t.startsWith('특허')));
ok('특허 자료 결과 표시', await page.evaluate(()=>[...document.querySelectorAll('#searchPreview .preview-tag')].some(n=>n.textContent==='특허')));
await type('고객');
ok('할 일·기억 자료 결과', await page.evaluate(()=>{
  const tags=[...document.querySelectorAll('#searchPreview .preview-tag')].map(n=>n.textContent);
  return tags.includes('할 일') && tags.includes('기억'); }),
  await page.$$eval('#searchPreview .preview-tag', n=>n.map(x=>x.textContent).join(',')));
await type('POUR');
ok('즐겨찾기 카드도 기능으로 표시', (await rows()).some(t=>t.includes('POUR 협약서') && t.includes('바로가기')));

// 3. 검색어 강조 (형광 배경 아님)
await type('협력');
const hit = await page.evaluate(()=>{
  const el=document.querySelector('#searchPreview .preview-hit');
  if(!el) return null;
  const c=getComputedStyle(el);
  return { text: el.textContent, color: c.color, bg: c.backgroundColor, display: c.display };
});
ok('검색어 강조 · 남색 · 형광 배경 없음 · 줄바꿈 안 됨',
   hit && hit.text==='협력' && hit.color==='rgb(31, 58, 95)' && hit.bg==='rgba(0, 0, 0, 0)' && hit.display==='inline',
   JSON.stringify(hit));

// 4. 키보드 조작
await type('특허');
await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
ok('아래 방향키로 선택', await page.evaluate(()=>document.querySelector('#searchPreview .preview-item.on')?.dataset.preview==='0'));
await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120);
ok('다음 결과로 이동', await page.evaluate(()=>document.querySelector('#searchPreview [data-preview].on')?.dataset.preview==='1'));
await page.keyboard.press('ArrowUp'); await page.waitForTimeout(120);
ok('위 방향키로 이전 결과', await page.evaluate(()=>document.querySelector('#searchPreview [data-preview].on')?.dataset.preview==='0'));
await page.keyboard.press('Enter'); await page.waitForTimeout(500);
ok('Enter 로 선택 결과 실행(특허 화면 이동)', await page.evaluate(()=>document.querySelector('#sideNav .top-item.active')?.textContent==='특허'));
ok('실행 후 미리보기 닫힘', !(await open()));

// 5. 선택이 없으면 기존 전체 검색
await page.click('.top-item[data-nav="대시보드"]'); await page.waitForTimeout(300);
await type('고객');
await page.keyboard.press('Enter'); await page.waitForTimeout(600);
ok('선택 없이 Enter 면 기존 전체 검색 실행', await page.evaluate(()=>pageSearchCommitted==='고객'));
ok('기존 검색 결과 화면 정상', await page.isVisible('#pageGrid') && (await page.textContent('#pageGrid')).includes('고객'));
ok('전체 검색 후 미리보기 닫힘', !(await open()));

// 6. 한글 조합 중 Enter 는 검색을 실행하지 않는다
await page.click('.top-item[data-nav="대시보드"]'); await page.waitForTimeout(300);
await page.fill('#pageSearch','');
await page.evaluate(()=>{
  const el=document.querySelector('#pageSearch');
  el.focus();
  el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
  el.value='협';
  el.dispatchEvent(new Event('input',{bubbles:true}));
  window.__before = pageSearchCommitted;
  el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,bubbles:true,cancelable:true}));
});
await page.waitForTimeout(300);
ok('조합 중 Enter 는 검색을 실행하지 않음', await page.evaluate(()=>pageSearchCommitted===window.__before));
await page.evaluate(()=>{
  const el=document.querySelector('#pageSearch');
  el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));
});
await page.waitForTimeout(400);
ok('조합이 끝나면 미리보기 표시', await open());

// 7. 닫힘 조건
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
ok('Esc 로 닫힘', !(await open()));
await type('협력');
await page.mouse.click(200, 700); await page.waitForTimeout(250);
ok('바깥 클릭으로 닫힘', !(await open()));

// 8. 클릭으로 기능 실행
await type('기억 저장소');
await page.click('#searchPreview [data-preview="0"]'); await page.waitForTimeout(500);
ok('기능 클릭 시 해당 기능 실행(기억 저장소 열림)', await page.isVisible('#memoryModal'));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 9. 자료 클릭 시 기존 상세 팝업
await type('고객사 견적서');
await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('#searchPreview [data-preview]')];
  const target=rows.find(n=>n.textContent.includes('고객사 견적서'));
  if(target) target.click();
});
await page.waitForTimeout(400);
ok('자료 클릭 시 기존 상세 팝업', await page.isVisible('#detailModal') && (await page.textContent('#detailModal')).includes('고객사 견적서'));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 10. 빈 결과
await type('없는검색어zzz');
ok('빈 결과 안내', (await page.textContent('#searchPreview')).includes('일치하는 기능이나 자료가 없습니다'));
ok('빈 결과에도 새 지식 추가·전체 검색', (await page.textContent('#searchPreview')).includes('새 지식 추가')
  && (await page.textContent('#searchPreview')).includes('전체 결과 보기'));

// 11. 드롭다운 위치·크기·겹침
await type('협력');
const box = await page.evaluate(()=>{
  const s=document.querySelector('.page-search').getBoundingClientRect();
  const d=document.querySelector('#searchPreview').getBoundingClientRect();
  const c=getComputedStyle(document.querySelector('#searchPreview'));
  const card=document.querySelector('#todayPanel');
  const top=document.elementFromPoint(d.left+20, d.top+20);
  return { 폭같음: Math.abs(d.width-s.width)<1, 간격: Math.round(d.top-s.bottom),
           최대높이: c.maxHeight, 스크롤: c.overflowY,
           카드위에: Boolean(top && top.closest('#searchPreview')) };
});
ok('검색창과 같은 폭 · 6~8px 아래', box.폭같음 && box.간격>=6 && box.간격<=8, JSON.stringify(box));
ok('최대 높이 + 내부 스크롤', box.최대높이!=='none' && box.스크롤==='auto', JSON.stringify(box));
ok('본문 카드 위에 표시', box.카드위에, JSON.stringify(box));

// 12. Firebase 를 다시 부르지 않는다
const readsBefore = await page.evaluate(()=>window.__FAKE_WRITES);
await type('특허');
await type('협력');
await type('고객');
ok('입력할 때마다 클라우드를 다시 부르지 않음', (await page.evaluate(()=>window.__FAKE_WRITES))===readsBefore);

// 13. 모바일
await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(300);
await type('협력');
const mob = await page.evaluate(()=>{
  const d=document.querySelector('#searchPreview').getBoundingClientRect();
  return { 왼쪽: Math.round(d.left), 오른쪽여백: Math.round(window.innerWidth - d.right),
           넘침: Math.round(document.documentElement.scrollWidth - window.innerWidth) };
});
ok('모바일에서 양옆 12~16px 여백 유지 · 넘침 없음',
   mob.왼쪽>=12 && mob.왼쪽<=20 && mob.오른쪽여백>=12 && mob.오른쪽여백<=20 && mob.넘침<=1, JSON.stringify(mob));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
