// 협력업체 정보 수정 — 원본은 그대로 두고 고친 내용만 덮어씌운다
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:1000},permissions:['clipboard-read','clipboard-write']});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(800);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 원본 첫 업체를 대상으로 삼는다
const origin = await page.evaluate(()=> (window.PARTNERS||[])[0]);
ok('협력업체 원본이 있음', !!origin && !!origin.name, origin && origin.name);
const totalSource = await page.evaluate(()=> (window.PARTNERS||[]).length);

const findCard = async (name)=> page.evaluate(n=>{
  const card=[...document.querySelectorAll('#pageGrid [data-partner-index]')]
    .find(c=> c.querySelector('h3').textContent.trim()===n);
  return card ? card.getAttribute('data-partner-index') : null;
}, name);
const openEdit = async (name)=>{
  await page.evaluate(n=>{
    const card=[...document.querySelectorAll('#pageGrid [data-partner-index]')]
      .find(c=> c.querySelector('h3').textContent.trim()===n);
    card.querySelector('[data-partner-edit]').click();
  }, name);
  await page.waitForTimeout(400);
};

// 협력업체 화면으로
await page.evaluate(()=>{
  const btn=[...document.querySelectorAll('#sideNav .top-item')].find(el=>el.textContent==='협력업체');
  if(btn) btn.click();
});
await page.waitForTimeout(700);
ok('협력업체 카드가 보임', (await page.$$('#pageGrid [data-partner-index]')).length>0);
ok('수정 단추가 있음', (await page.$$('#pageGrid [data-partner-edit]')).length>0);

// 1. 수정 창이 지금 값으로 열린다
await openEdit(origin.name);
ok('수정 창이 열림', !(await page.$eval('#partnerModal', el=>el.classList.contains('hidden'))));
ok('업체명이 채워져 있음', (await page.inputValue('#partnerName'))===origin.name, await page.inputValue('#partnerName'));
ok('전화가 채워져 있음', (await page.inputValue('#partnerPhone'))===(origin.phone||''), await page.inputValue('#partnerPhone'));
ok('이메일이 채워져 있음', (await page.inputValue('#partnerEmail'))===(origin.email||''), await page.inputValue('#partnerEmail'));
ok('처음엔 "원래대로"가 숨어 있음', await page.$eval('#partnerRestore', el=>el.classList.contains('hidden')));

// 2. 셋 다 고쳐서 저장
await page.fill('#partnerName','㈜바뀐이름산업');
await page.fill('#partnerPhone','02-1234-5678');
await page.fill('#partnerEmail','changed@example.com');
await page.click('#partnerForm button[type="submit"]');
await page.waitForTimeout(800);
ok('저장하면 창이 닫힘', await page.$eval('#partnerModal', el=>el.classList.contains('hidden')));
ok('바뀐 업체명이 화면에 보임', (await findCard('㈜바뀐이름산업'))!==null);
ok('원래 이름 카드는 사라짐', (await findCard(origin.name))===null);
const cardText = await page.evaluate(()=>{
  const c=[...document.querySelectorAll('#pageGrid [data-partner-index]')]
    .find(x=> x.querySelector('h3').textContent.trim()==='㈜바뀐이름산업');
  return c.textContent.replace(/\s+/g,' ');
});
ok('바뀐 전화·이메일이 보임', cardText.includes('02-1234-5678') && cardText.includes('changed@example.com'), cardText.slice(0,90));
ok('업체 수는 그대로', (await page.$$('#pageGrid [data-partner-index]')).length===totalSource, String(totalSource));

// 3. 복사 단추도 바뀐 값으로
await page.evaluate(()=>{
  const c=[...document.querySelectorAll('#pageGrid [data-partner-index]')]
    .find(x=> x.querySelector('h3').textContent.trim()==='㈜바뀐이름산업');
  c.querySelector('[data-copy-phone]').click();
});
await page.waitForTimeout(400);
ok('바뀐 번호가 복사됨', (await page.evaluate(()=>navigator.clipboard.readText()))==='02-1234-5678',
   await page.evaluate(()=>navigator.clipboard.readText()));

// 4. 저장된 자료 — 원본은 안 건드린다
const stored = await page.evaluate(()=>({
  edits: JSON.parse(localStorage.getItem('knowledge-partner-edits')||'[]'),
  sourceFirst: (window.PARTNERS||[])[0],
  sourceLen: (window.PARTNERS||[]).length
}));
ok('고친 기록 1건만 저장됨', stored.edits.filter(e=>!e.deleted).length===1, String(stored.edits.length));
ok('고친 기록의 열쇠가 원래 이름', stored.edits[0].id===origin.name, stored.edits[0].id);
ok('partners.js 원본은 그대로', stored.sourceFirst.name===origin.name && stored.sourceLen===totalSource,
   `${stored.sourceFirst.name} / ${stored.sourceLen}`);

// 5. 새로고침해도 남는다
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(900);
await page.evaluate(()=>{
  const btn=[...document.querySelectorAll('#sideNav .top-item')].find(el=>el.textContent==='협력업체');
  if(btn) btn.click();
});
await page.waitForTimeout(700);
ok('새로고침해도 바뀐 정보가 남음', (await findCard('㈜바뀐이름산업'))!==null);

// 6. 검색에도 바뀐 이름으로 걸린다
await page.fill('#pageSearch','바뀐이름산업');
await page.press('#pageSearch','Enter');
await page.waitForTimeout(800);
ok('바뀐 이름으로 검색됨', (await page.$$('#pageGrid [data-partner-index]')).length>=1);
await page.fill('#pageSearch','');
await page.press('#pageSearch','Enter');
await page.waitForTimeout(700);

// 7. 원래대로 되돌리기
await openEdit('㈜바뀐이름산업');
ok('고친 뒤엔 "원래대로"가 보임', !(await page.$eval('#partnerRestore', el=>el.classList.contains('hidden'))));
// 창 아래 단추 3개가 한 줄에 제대로 놓이는지(예전에 float 때문에 찌그러진 적 있음)
const foot = await page.evaluate(()=>{
  const f=document.querySelector('#partnerForm footer');
  const r=e=>{const b=e.getBoundingClientRect();return {w:Math.round(b.width),h:Math.round(b.height)};};
  return { 푸터:r(f), 단추:[...f.querySelectorAll('button')].map(b=>({t:b.textContent.trim(), ...r(b)})) };
});
ok('창 아래 단추 줄이 찌그러지지 않음', foot.푸터.w > 200 && foot.푸터.h <= 45, JSON.stringify(foot.푸터));
ok('단추 3개가 한 줄에 놓임', foot.단추.length===3 && foot.단추.every(b=> b.h<=45 && b.w>=40),
   JSON.stringify(foot.단추));
const originNote = await page.textContent('#partnerOrigin');
ok('원래 정보를 함께 보여 줌', originNote.includes(origin.name), originNote.trim().slice(0,70));
await page.click('#partnerRestore');
await page.waitForTimeout(800);
ok('원래 업체명으로 돌아옴', (await findCard(origin.name))!==null);
ok('바뀐 이름 카드는 사라짐', (await findCard('㈜바뀐이름산업'))===null);
const after = await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-partner-edits')||'[]'));
ok('고친 기록은 삭제 표시만 남음', after.length===1 && after[0].deleted===true, JSON.stringify(after.map(e=>[e.id,!!e.deleted])));
ok('되돌린 뒤에도 업체 수 그대로', (await page.$$('#pageGrid [data-partner-index]')).length===totalSource);

// 8. 다른 자료는 건드리지 않았다
const others = await page.evaluate(()=>({
  todos: JSON.parse(localStorage.getItem('knowledge-todos')||'[]').length,
  knowledge: JSON.parse(localStorage.getItem('knowledge-messenger-data')||'[]').length
}));
ok('할 일·지식 자료 그대로', others.knowledge>0, `지식 ${others.knowledge} · 할일 ${others.todos}`);
ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length ? 1 : 0);
