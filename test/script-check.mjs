// 대본 탭 — 추가 · 목록 · 수정 · 삭제 · 검색 · 복사
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

const SCRIPT = `안녕하세요, 한솔테크 김한솔입니다.
오늘 1차 미팅 참석해 주셔서 감사합니다.

1. 회사 소개 (5분)
2. 공법 설명 — 방수 / 재도장 (10분)
3. 특허 및 시공 실적 (5분)
4. 질의응답 (10분)

궁금하신 점은 편하게 말씀해 주세요.`;

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}, permissions:['clipboard-read','clipboard-write']});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog', d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(500);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const goScript = async () => {
  await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent==='대본')?.click());
  await page.waitForTimeout(350);
};
const cards = () => page.$$eval('#pageGrid .page-card[data-id]', n=>n.map(c=>c.textContent.replace(/\s+/g,' ')));

// 1. 탭이 있는지
ok('상단 메뉴에 대본 탭', await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].some(n=>n.textContent==='대본')));
await goScript();
ok('대본 화면으로 이동', (await page.textContent('#pageHeading'))==='대본', await page.textContent('#pageHeading'));
ok('분류 칩에도 대본', await page.evaluate(()=>[...document.querySelectorAll('#pageCategories button')].some(n=>n.textContent==='대본')));
ok('처음에는 비어 있음', (await cards()).length===0);

// 2. 추가
await page.click('#pageAdd'); await page.waitForTimeout(250);
ok('추가 창에 대본 종류', await page.evaluate(()=>Boolean(document.querySelector('[data-add="대본"]'))));
await page.evaluate(()=>document.querySelector('[data-add="대본"]').click());
await page.waitForTimeout(300);
ok('대본 편집 창이 열림', await page.isVisible('#editModal') && (await page.textContent('#editHeading')).includes('대본'), await page.textContent('#editHeading'));
ok('분류가 대본으로 미리 선택됨', (await page.inputValue('#editCategory'))==='대본');
const rows = await page.$eval('#editAnswer', n=>n.rows);
ok('내용 입력칸이 넉넉함', rows>=12, `${rows}줄`);
await page.fill('#editTitle','1차 미팅 안내 대본');
await page.fill('#editAnswer', SCRIPT);
await page.fill('#editAliases','첫미팅, 미팅안내');
await page.click('#editSubmit');
await page.waitForTimeout(500);
await goScript();
ok('대본이 목록에 저장됨', (await cards()).length===1 && (await cards())[0].includes('1차 미팅 안내 대본'), (await cards())[0]?.slice(0,40));
ok('카드에 대본 분류 표시', (await cards())[0].includes('대본'));

// 3. 긴 내용은 카드에서 접히고, 눌러서 전체 보기
const clamp = await page.$eval('#pageGrid .page-card.script-card p', n=>getComputedStyle(n).webkitLineClamp);
ok('긴 대본은 카드에서 8줄까지', clamp==='8', clamp);
await page.evaluate(()=>document.querySelector('#pageGrid .page-card[data-id] h3').click());
await page.waitForTimeout(300);
const detail = await page.textContent('#detailBody');
ok('카드를 누르면 전체 대본이 보임', detail.includes('질의응답') && detail.includes('한솔테크 김한솔'), detail.slice(0,30));
ok('상세 창에 수정·삭제 있음', await page.isVisible('#detailEdit') && await page.isVisible('#detailDelete'));
await page.click('#detailClose'); await page.waitForTimeout(200);

// 4. 수정
await page.evaluate(()=>document.querySelector('#pageGrid .page-card[data-id] [data-edit]').click());
await page.waitForTimeout(300);
ok('수정 창에 기존 내용', (await page.inputValue('#editTitle'))==='1차 미팅 안내 대본' && (await page.inputValue('#editAnswer')).includes('회사 소개'));
ok('수정 때도 입력칸이 넉넉함', (await page.$eval('#editAnswer', n=>n.rows))>=12);
await page.fill('#editAnswer', SCRIPT + '\n\n(끝인사) 오늘 시간 내주셔서 감사합니다.');
await page.click('#editSubmit');
await page.waitForTimeout(500);
await goScript();
ok('수정 내용이 반영됨', (await cards())[0].includes('끝인사') || await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-messenger-data')).some(k=>k.category==='대본' && k.answer.includes('끝인사'))));

// 5. 검색
await page.click('#pageSearch');
await page.type('#pageSearch','첫미팅',{delay:10});
await page.waitForTimeout(400);
const preview = (await page.textContent('#searchPreview'))||'';
ok('등록한 검색어로 미리보기에 뜸', preview.includes('1차 미팅 안내 대본'), preview.slice(0,60));
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
ok('검색 결과에도 나옴', (await cards()).some(t=>t.includes('1차 미팅 안내 대본')));
await page.fill('#pageSearch',''); await page.keyboard.press('Enter'); await page.waitForTimeout(300);

// 검색창에 '대본' 치고 Enter -> 대본 화면으로 이동
await page.fill('#pageSearch','대본'); await page.waitForTimeout(300);
await page.keyboard.press('Enter'); await page.waitForTimeout(400);
ok('검색창에 대본 치면 대본 화면으로 이동', (await page.textContent('#pageHeading'))==='대본', await page.textContent('#pageHeading'));

// 6. 두 번째 대본 추가 후 새로고침 유지
await page.click('#pageAdd'); await page.waitForTimeout(250);
await page.evaluate(()=>document.querySelector('[data-add="대본"]').click());
await page.waitForTimeout(300);
await page.fill('#editTitle','하자 접수 안내 대본');
await page.fill('#editAnswer','네, 하자 접수 도와드리겠습니다. 현장명과 동·호수를 말씀해 주시겠어요?');
await page.click('#editSubmit');
await page.waitForTimeout(500);
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
await goScript();
ok('새로고침해도 대본 2개가 남음', (await cards()).length===2, `${(await cards()).length}개`);
ok('클라우드에도 저장됨', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.knowledge||[]).filter(k=>k.category==='대본' && !k.deleted).length===2; }));

// 7. 삭제
await page.evaluate(()=>{
  const card=[...document.querySelectorAll('#pageGrid .page-card[data-id]')].find(c=>c.textContent.includes('하자 접수'));
  card.querySelector('[data-delete]').click(); });
await page.waitForTimeout(500);
ok('대본 삭제 동작', (await cards()).length===1);
ok('실행 취소로 되살아남', await (async()=>{ await page.click('#toast button'); await page.waitForTimeout(500); await goScript(); return (await cards()).length===2; })());

// 8. 다른 분류를 건드리지 않았는지
await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent==='업무지식')?.click());
await page.waitForTimeout(350);
ok('업무지식에는 대본이 섞이지 않음', (await cards()).every(t=>!t.includes('1차 미팅 안내 대본')) && (await cards()).length>0, `${(await cards()).length}개`);

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
