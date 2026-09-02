// 기획 탭 — 나중에 해 볼 일·아이디어 적어 두기 (추가·수정·삭제·검색)
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

const PLAN = `왜 하려는지
- 협력업체마다 자재 발주 서류를 따로 만들고 있어 시간이 오래 걸린다.

무엇을 만들지
1. 현장명만 넣으면 승인원 양식이 자동으로 채워지는 화면
2. 특허번호와 자재 목록은 기존 자료에서 가져오기
3. 완성본은 PDF 로 내려받기

언제
- 올해 안에 한 번 검토해 보기`;

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog', d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(500);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const goPlan = async () => {
  await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent==='기획')?.click());
  await page.waitForTimeout(350);
};
const cards = () => page.$$eval('#pageGrid .page-card[data-id]', n=>n.map(c=>c.textContent.replace(/\s+/g,' ')));

ok('상단 메뉴에 기획 탭', await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].some(n=>n.textContent==='기획')));
await goPlan();
ok('기획 화면으로 이동', (await page.textContent('#pageHeading'))==='기획', await page.textContent('#pageHeading'));
ok('안내 문구 표시', (await page.textContent('#pageLead')).includes('나중에'), await page.textContent('#pageLead'));
ok('분류 칩에도 기획', await page.evaluate(()=>[...document.querySelectorAll('#pageCategories button')].some(n=>n.textContent==='기획')));
ok('처음에는 비어 있음', (await cards()).length===0);

// 추가
await page.click('#pageAdd'); await page.waitForTimeout(250);
ok('추가 창에 기획 종류', await page.evaluate(()=>Boolean(document.querySelector('[data-add="기획"]'))));
await page.evaluate(()=>document.querySelector('[data-add="기획"]').click());
await page.waitForTimeout(300);
ok('기획 편집 창이 열림', await page.isVisible('#editModal') && (await page.textContent('#editHeading')).includes('기획'), await page.textContent('#editHeading'));
ok('분류가 기획으로 미리 선택됨', (await page.inputValue('#editCategory'))==='기획');
ok('내용 입력칸이 넉넉함', (await page.$eval('#editAnswer', n=>n.rows))>=12, `${await page.$eval('#editAnswer', n=>n.rows)}줄`);
await page.fill('#editTitle','자재공급승인원 자동 작성 만들기');
await page.fill('#editAnswer', PLAN);
await page.fill('#editAliases','승인원자동화, 나중에할일');
await page.click('#editSubmit');
await page.waitForTimeout(500);
await goPlan();
ok('기획이 목록에 저장됨', (await cards()).length===1 && (await cards())[0].includes('자재공급승인원 자동 작성'), (await cards())[0]?.slice(0,40));
ok('카드에 기획 분류 표시', (await cards())[0].includes('기획'));

// 긴 내용은 접히고, 눌러서 전체 보기
const clamp = await page.$eval('#pageGrid .page-card.plan-card p', n=>getComputedStyle(n).webkitLineClamp);
ok('긴 기획은 카드에서 8줄까지', clamp==='8', clamp);
await page.evaluate(()=>document.querySelector('#pageGrid .page-card[data-id] h3').click());
await page.waitForTimeout(300);
ok('카드를 누르면 전체 내용이 보임', (await page.textContent('#detailBody')).includes('올해 안에 한 번 검토'));
ok('상세 창에 수정·삭제 있음', await page.isVisible('#detailEdit') && await page.isVisible('#detailDelete'));
await page.click('#detailClose'); await page.waitForTimeout(200);

// 수정
await page.evaluate(()=>document.querySelector('#pageGrid .page-card[data-id] [data-edit]').click());
await page.waitForTimeout(300);
ok('수정 창에 기존 내용', (await page.inputValue('#editTitle'))==='자재공급승인원 자동 작성 만들기');
await page.fill('#editAnswer', PLAN + '\n\n(2026-09-02 추가) 먼저 종이 양식부터 정리하기');
await page.click('#editSubmit');
await page.waitForTimeout(500);
ok('수정 내용이 저장됨', await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-messenger-data')).some(k=>k.category==='기획' && k.answer.includes('종이 양식부터'))));

// 검색
await goPlan();
await page.click('#pageSearch');
await page.type('#pageSearch','나중에할일',{delay:10});
await page.waitForTimeout(400);
ok('등록한 검색어로 미리보기에 뜸', ((await page.textContent('#searchPreview'))||'').includes('자재공급승인원 자동 작성'));
await page.fill('#pageSearch',''); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
for (const word of ['기획','아이디어','나중에']) {
  await page.fill('#pageSearch', word); await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  ok(`검색창에 "${word}" 치면 기획 화면으로 이동`, (await page.textContent('#pageHeading'))==='기획', await page.textContent('#pageHeading'));
}

// 새로고침 유지 · 삭제
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
await goPlan();
ok('새로고침해도 남아 있음', (await cards()).length===1);
ok('클라우드에도 저장됨', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.knowledge||[]).filter(k=>k.category==='기획' && !k.deleted).length===1; }));
await page.evaluate(()=>document.querySelector('#pageGrid .page-card[data-id] [data-delete]').click());
await page.waitForTimeout(500);
ok('삭제 동작', (await cards()).length===0);
await page.click('#toast button'); await page.waitForTimeout(500); await goPlan();
ok('실행 취소로 되살아남', (await cards()).length===1);

// 다른 분류와 섞이지 않는지
await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent==='대본')?.click());
await page.waitForTimeout(350);
ok('대본에는 기획이 섞이지 않음', (await cards()).every(t=>!t.includes('자재공급승인원 자동 작성')));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
