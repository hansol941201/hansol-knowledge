// 업무지식 수정·삭제 — 카드 버튼 · 상세 창 버튼 · 실행 취소 · 새로고침 후에도 유지
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
const ctx=await b.newContext({viewport:{width:1440,height:900}});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());

const openWork = async () => {
  await page.goto(base+'/index.html');
  await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
  await page.evaluate(()=>{ [...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent.includes('업무지식'))?.click(); });
  await page.waitForTimeout(400);
};
const titles = () => page.evaluate(()=>[...document.querySelectorAll('#pageGrid .page-card[data-id] h3')].map(h=>h.textContent));
const clickIn = (title, sel) => page.evaluate(([title,sel])=>{
  const card=[...document.querySelectorAll('#pageGrid .page-card[data-id]')].find(c=>c.querySelector('h3')?.textContent.includes(title));
  (sel ? card.querySelector(sel) : card.querySelector('h3')).click();
},[title,sel]);

await openWork();
ok('업무지식 목록이 보임', (await titles()).length > 0);

// 카드에 수정·삭제 버튼이 눈에 띄게 있는지
const buttons = await page.evaluate(()=>{
  const card=document.querySelector('#pageGrid .page-card[data-id]');
  const edit=card.querySelector('[data-edit]'), del=card.querySelector('[data-delete]');
  const box=el=>el.getBoundingClientRect();
  const style=el=>getComputedStyle(el);
  return { hasEdit:Boolean(edit), hasDelete:Boolean(del),
    editHeight:Math.round(box(edit).height), deleteHeight:Math.round(box(del).height),
    editBorder:style(edit).borderTopWidth, deleteBorder:style(del).borderTopWidth,
    deleteColor:style(del).color };
});
ok('카드에 수정·삭제 버튼', buttons.hasEdit && buttons.hasDelete);
ok('버튼이 테두리 있는 모양(글자만 있지 않음)', parseFloat(buttons.editBorder)>0 && parseFloat(buttons.deleteBorder)>0,
   `${buttons.editBorder} / ${buttons.deleteBorder}`);
ok('누르기 쉬운 크기(28px 이상)', buttons.editHeight>=28 && buttons.deleteHeight>=28,
   `${buttons.editHeight}px / ${buttons.deleteHeight}px`);
const [dr,dg,db] = (buttons.deleteColor.match(/\d+/g)||[0,0,0]).map(Number);
ok('삭제는 붉은 계열(빨강이 가장 진함)', dr > dg + 30 && dr > db + 30, buttons.deleteColor);

// 카드를 눌러 연 상세 창에서 수정·삭제
await clickIn('MSDS 발행', null);
await page.waitForTimeout(250);
ok('상세 창에 수정 버튼', await page.isVisible('#detailEdit'));
ok('상세 창에 삭제 버튼', await page.isVisible('#detailDelete'));

await page.click('#detailEdit'); await page.waitForTimeout(250);
ok('수정을 누르면 편집 창이 열림', await page.isVisible('#editModal'));
ok('기존 내용이 채워져 있음', (await page.inputValue('#editTitle'))==='MSDS 발행', await page.inputValue('#editTitle'));
await page.fill('#editAnswer','자재별 MSDS 발행 (검사성적서 포함)');
await page.click('#editSubmit'); await page.waitForTimeout(400);
await openWork();
const editedBody = await page.evaluate(()=>{
  const card=[...document.querySelectorAll('#pageGrid .page-card[data-id]')].find(c=>c.querySelector('h3')?.textContent.includes('MSDS 발행'));
  return card?.querySelector('p')?.textContent; });
ok('수정한 내용이 새로고침 뒤에도 남음', (editedBody||'').includes('검사성적서'), editedBody);

// 상세 창에서 삭제 -> 실행 취소
await clickIn('아크릴 배면차수', null);
await page.waitForTimeout(250);
await page.click('#detailDelete'); await page.waitForTimeout(400);
ok('삭제하면 상세 창이 닫힘', !(await page.isVisible('#detailModal')));
ok('목록에서 바로 빠짐', (await titles()).every(t=>!t.includes('아크릴 배면차수')));
ok('실행 취소 버튼이 뜸', await page.isVisible('#toast button'));
await page.click('#toast button'); await page.waitForTimeout(400);
await page.evaluate(()=>{ [...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent.includes('업무지식'))?.click(); });
await page.waitForTimeout(300);
ok('실행 취소하면 되살아남', (await titles()).some(t=>t.includes('아크릴 배면차수')));

// 카드의 삭제 버튼 -> 새로고침 뒤에도 지워져 있는지
await clickIn('5도 이하 시공','[data-delete]');
await page.waitForTimeout(400);
await openWork();
ok('삭제한 항목은 새로고침 뒤에도 없음', (await titles()).every(t=>!t.includes('5도 이하 시공')));

// 다른 종류에는 수정·삭제가 붙지 않는지 (특허는 읽기 전용)
await page.evaluate(()=>{ [...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent.includes('특허'))?.click(); });
await page.waitForTimeout(400);
await page.evaluate(()=>document.querySelector('#pageGrid .page-card[data-patent-key] h3')?.click());
await page.waitForTimeout(250);
ok('특허 상세에는 수정 버튼이 없음', !(await page.isVisible('#detailEdit')));
ok('특허 상세에는 삭제 버튼이 없음', !(await page.isVisible('#detailDelete')));

ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
