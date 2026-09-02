// 대본 상세 화면 — 기존 글 그대로 불러오기 · 한 줄씩 그 자리 수정 · 추가/삭제/순서 · 저장 유지
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

// 예전 방식으로 저장돼 있던 대본(줄글) + 다른 대본 하나
const OLD = `안녕하세요. POUR 기술지원팀 신한솔입니다. 담당자님 맞으실까요?
아파트 공사 입찰과 기술지원 관련해서 간단히 안내드리려고 연락드렸습니다.
확인하시기 편하도록 관련 자료를 보내드려도 괜찮을까요?

🚨 통화 시 주의
⚠️ 상대방의 말을 끊지 않기
⚠️ 확실하지 않은 내용은 임의로 답변하지 않기

💬 예상 질문·답변
Q. 비용이 발생하나요?
A. 기본적인 자료 제공과 상담은 별도 비용 없이 지원해드리고 있습니다.`;
const OTHER = `네, 하자 접수 도와드리겠습니다.
현장명과 동·호수를 말씀해 주시겠어요?`;
const data = [
  { id:'sc1', type:'knowledge', title:'협력업체 첫 통화 대본', answer:OLD, category:'대본', aliases:[], createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z' },
  { id:'sc2', type:'knowledge', title:'하자 접수 안내 대본', answer:OTHER, category:'대본', aliases:[], createdAt:'2026-09-01T00:00:00.000Z', updatedAt:'2026-09-01T00:00:00.000Z' }
];

const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
await ctx.addInitScript(`localStorage.setItem('knowledge-messenger-data', ${JSON.stringify(JSON.stringify(data))});`);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog', d=>d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(500);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const openScript = async (title) => {
  await page.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent==='대본')?.click());
  await page.waitForTimeout(300);
  await page.evaluate(t=>[...document.querySelectorAll('#pageGrid .page-card[data-id]')].find(c=>c.textContent.includes(t)).querySelector('h3').click(), title);
  await page.waitForTimeout(300);
};
const lines = () => page.$$eval('#scriptBody .script-line p', n=>n.map(x=>x.textContent));
const cautions = () => page.$$eval('#scriptBody .script-caution p', n=>n.map(x=>x.textContent));
const qna = () => page.$$eval('#scriptBody .script-qna', n=>n.map(c=>c.textContent.replace(/\s+/g,' ').trim()));

await openScript('협력업체 첫 통화 대본');
ok('대본 전용 화면이 열림', await page.isVisible('#scriptModal') && !(await page.isVisible('#detailModal')));
ok('제목만 상단에 표시', (await page.textContent('#scriptHeading')).includes('협력업체 첫 통화 대본'));

// 1. 기존 대본이 빠짐없이
ok('기존 멘트 3개가 그대로', (await lines()).length===3 && (await lines())[0].startsWith('안녕하세요. POUR'), (await lines()).join(' | ').slice(0,50));
ok('기존 주의사항 2개가 그대로', (await cautions()).length===2 && (await cautions())[0]==='상대방의 말을 끊지 않기');
ok('기존 질문·답변 1개가 그대로', (await qna()).length===1 && (await qna())[0].includes('비용이 발생하나요'));

// 없애기로 한 것들
const body = await page.textContent('#scriptModal');
ok('단계 번호·단계 제목 없음', !/1\.\s*인사|연락드린 이유|상대방 답변/.test(body));
ok('업체명 입력·통화 시작·복사 버튼 없음',
   (await page.$$('#scriptModal input[placeholder*="업체"]')).length===0 && !/통화 시작|통화 준비 완료|통화 완료 및 저장/.test(body));
ok('오른쪽 확인 패널 없음', !/통화 중 빠른 확인|관심 공종|다음 연락일|통화 메모/.test(body));
ok('창이 화면의 90%', await page.evaluate(()=>{
  const box=document.querySelector('.script-box').getBoundingClientRect();
  return Math.abs(box.width - innerWidth*0.9) < 4 && Math.abs(box.height - innerHeight*0.9) < 4; }));

// 2. 멘트 하나만 개별 수정
await page.evaluate(()=>document.querySelectorAll('#scriptBody .script-line [data-script-edit]')[1].click());
await page.waitForTimeout(250);
ok('그 자리에서 편집 모드로 바뀜', (await page.$$('#scriptBody .script-line.editing')).length===1 && (await page.$$('#scriptBody .script-line')).length===3);
ok('기존 문장이 입력칸에 들어 있음', (await page.inputValue('#scriptBody .editing .script-input')).startsWith('아파트 공사 입찰'));
await page.fill('#scriptBody .editing .script-input','아파트 공사 입찰 건으로 연락드렸습니다.');
await page.click('#scriptBody .editing [data-script-save]');
await page.waitForTimeout(400);
const after = await lines();
ok('고른 문장만 바뀜', after[1]==='아파트 공사 입찰 건으로 연락드렸습니다.' && after[0].startsWith('안녕하세요. POUR') && after[2].startsWith('확인하시기'), after.join(' | ').slice(0,60));

// 취소하면 되돌아감
await page.evaluate(()=>document.querySelectorAll('#scriptBody .script-line [data-script-edit]')[0].click());
await page.waitForTimeout(200);
await page.fill('#scriptBody .editing .script-input','버릴 내용');
await page.click('#scriptBody .editing [data-script-cancel]');
await page.waitForTimeout(300);
ok('취소하면 원래 문장 그대로', (await lines())[0].startsWith('안녕하세요. POUR'));

// 3. 추가 · 순서 · 삭제
await page.click('[data-script-add="line"]');
await page.waitForTimeout(250);
await page.fill('#scriptBody .editing .script-input','자료는 메일로 보내드리겠습니다.');
await page.click('#scriptBody .editing [data-script-save]');
await page.waitForTimeout(400);
ok('멘트 추가 — 맨 아래에 들어감', (await lines()).length===4 && (await lines())[3]==='자료는 메일로 보내드리겠습니다.');
await page.evaluate(()=>document.querySelectorAll('#scriptBody .script-line [data-script-menu]')[3].click());
await page.waitForTimeout(200);
await page.evaluate(()=>[...document.querySelectorAll('.row-menu button')].find(b=>b.textContent==='위로').click());
await page.waitForTimeout(400);
ok('위로 이동', (await lines())[2]==='자료는 메일로 보내드리겠습니다.');
await page.evaluate(()=>document.querySelectorAll('#scriptBody .script-line [data-script-menu]')[2].click());
await page.waitForTimeout(200);
await page.evaluate(()=>[...document.querySelectorAll('.row-menu button')].find(b=>b.textContent==='삭제').click());
await page.waitForTimeout(400);
ok('삭제', (await lines()).length===3 && !(await lines()).includes('자료는 메일로 보내드리겠습니다.'));

// 4. 주의사항
await page.click('[data-script-add="caution"]');
await page.waitForTimeout(250);
await page.fill('#scriptBody .editing .script-input','담당자가 아니면 담당자 연락처 확인하기');
await page.click('#scriptBody .editing [data-script-save]');
await page.waitForTimeout(400);
ok('주의사항 추가', (await cautions()).length===3);
await page.evaluate(()=>document.querySelectorAll('#scriptBody .script-caution [data-script-edit]')[0].click());
await page.waitForTimeout(250);
await page.fill('#scriptBody .editing .script-input','상대방 말을 끝까지 듣기');
await page.click('#scriptBody .editing [data-script-save]');
await page.waitForTimeout(400);
ok('주의사항 수정', (await cautions())[0]==='상대방 말을 끝까지 듣기');
await page.evaluate(()=>document.querySelectorAll('#scriptBody .script-caution [data-script-menu]')[2].click());
await page.waitForTimeout(200);
await page.evaluate(()=>[...document.querySelectorAll('.row-menu button')].find(b=>b.textContent==='삭제').click());
await page.waitForTimeout(400);
ok('주의사항 삭제', (await cautions()).length===2);

// 5. 예상 질문·답변
await page.click('[data-script-add="qna"]');
await page.waitForTimeout(250);
await page.fill('#scriptBody .editing .script-question','지금 담당자가 자리에 없습니다.');
await page.fill('#scriptBody .editing .script-answer','네, 담당자님께 전달 부탁드립니다. 편하신 시간에 다시 연락드리겠습니다.');
await page.click('#scriptBody .editing [data-script-save]');
await page.waitForTimeout(400);
ok('질문·답변 추가', (await qna()).length===2 && (await qna())[1].includes('자리에 없습니다'));
await page.evaluate(()=>document.querySelectorAll('#scriptBody .script-qna [data-script-edit]')[0].click());
await page.waitForTimeout(250);
await page.fill('#scriptBody .editing .script-answer','자료 제공과 상담은 무료로 지원해드립니다.');
await page.click('#scriptBody .editing [data-script-save]');
await page.waitForTimeout(400);
ok('질문·답변 수정', (await qna())[0].includes('무료로 지원해드립니다'));
await page.evaluate(()=>document.querySelectorAll('#scriptBody .script-qna [data-script-menu]')[1].click());
await page.waitForTimeout(200);
await page.evaluate(()=>[...document.querySelectorAll('.row-menu button')].find(b=>b.textContent==='삭제').click());
await page.waitForTimeout(400);
ok('질문·답변 삭제', (await qna()).length===1);

// 6. 새로고침 후에도 유지 · 원본 백업
ok('나누기 전 원본이 백업돼 있음', await page.evaluate(()=>
  JSON.parse(localStorage.getItem('knowledge-messenger-data')).some(k=>k.id==='sc1' && typeof k.legacyAnswer==='string' && k.legacyAnswer.includes('POUR'))));
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
await openScript('협력업체 첫 통화 대본');
ok('새로고침 후에도 수정 내용 유지', (await lines())[1]==='아파트 공사 입찰 건으로 연락드렸습니다.' && (await cautions())[0]==='상대방 말을 끝까지 듣기' && (await qna()).length===1);
ok('클라우드에도 저장됨', await page.evaluate(async()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return (d.knowledge||[]).some(k=>k.id==='sc1' && k.answer.includes('아파트 공사 입찰 건으로')); }));

// 7. 다른 대본은 그대로
await page.evaluate(()=>document.querySelector('#scriptClose').click());
await page.waitForTimeout(200);
await openScript('하자 접수 안내 대본');
ok('다른 대본은 건드리지 않음', (await lines()).length===2 && (await lines())[0]==='네, 하자 접수 도와드리겠습니다.' && (await cautions()).length===0);

// 8. 모바일
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 850 });
await m.goto(base+'/index.html');
await m.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await m.waitForTimeout(600);
await m.evaluate(()=>[...document.querySelectorAll('#sideNav .top-item')].find(n=>n.textContent==='대본')?.click());
await m.waitForTimeout(300);
await m.evaluate(()=>[...document.querySelectorAll('#pageGrid .page-card[data-id]')].find(c=>c.textContent.includes('협력업체 첫 통화')).querySelector('h3').click());
await m.waitForTimeout(400);
const mobile = await m.evaluate(()=>{
  const line=document.querySelector('.script-line');
  const p=line.querySelector('p');
  const tools=line.querySelector('.script-tools').getBoundingClientRect();
  return { size:parseFloat(getComputedStyle(p).fontSize), lh:getComputedStyle(p).lineHeight,
           insideCard: tools.right <= line.getBoundingClientRect().right + 1,
           overflowX: document.documentElement.scrollWidth-document.documentElement.clientWidth };
});
ok('모바일에서도 글자가 큼(16px 이상)', mobile.size>=16, `${mobile.size}px`);
ok('모바일 가로 스크롤 없음', mobile.overflowX===0 && mobile.insideCard, JSON.stringify(mobile));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
