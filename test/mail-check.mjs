// 메일함 — 협력업체 선택 · 문구 저장/수정 · 한 곳씩 발송 · 실패 처리 · 보낸 기록
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
const ctx=await b.newContext({viewport:{width:1500,height:950}});
await ctx.addInitScript(stub);
// 실제 발송 대신 가짜 서버 — 보낸 내용을 그대로 기록하고, 지정한 주소만 실패시킨다.
await ctx.addInitScript(() => {
  window.__SENT = [];
  window.__FAIL_TO = '';
  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, init) => {
    const href = String(url && url.url ? url.url : url);
    if (href.includes('api.emailjs.com') || href.includes('script.google.com')) {
      const body = JSON.parse(init.body);
      const to = body.template_params ? body.template_params.to_email : body.to;
      const subject = body.template_params ? body.template_params.subject : body.subject;
      const message = body.template_params ? body.template_params.message : body.body;
      window.__SENT.push({ endpoint: href, to, subject, message, raw: body });
      if (to === window.__FAIL_TO) return new Response('template not found', { status: 400 });
      return new Response('OK', { status: 200 });
    }
    return realFetch(url, init);
  };
});
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
page.on('dialog', d => d.accept());
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(500);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 메뉴에서 열기
await page.evaluate(()=>document.querySelector('#mailToggle').click());
await page.waitForTimeout(300);
ok('상단 메뉴에 메일함이 있고 열린다', await page.isVisible('#mailModal'));
ok('연결 전에는 발송 설정부터 보여 준다', await page.isVisible('#mailSetupPanel'));

// 발송 설정 저장
await page.fill('#mailServiceId','service_test');
await page.fill('#mailTemplateId','template_test');
await page.fill('#mailPublicKey','key_test');
await page.fill('#mailFromName','한솔테크 김한솔');
await page.fill('#mailReplyTo','hansol@example.com');
await page.click('#mailSetupSave');
await page.waitForTimeout(300);
ok('설정을 저장하면 연결됨으로 바뀜', (await page.textContent('#mailSetupState')).includes('연결됨'));

// 시험 발송
await page.fill('#mailTestTo','me@example.com');
await page.click('#mailTestSend');
await page.waitForTimeout(500);
const test1 = await page.evaluate(()=>window.__SENT[0]);
ok('시험 발송이 실제로 나감', test1 && test1.to==='me@example.com', JSON.stringify(test1 && test1.to));
ok('EmailJS 규격대로 보냄', test1.raw.service_id==='service_test' && test1.raw.template_id==='template_test' && test1.raw.user_id==='key_test');

// 메일 쓰기
await page.evaluate(()=>document.querySelector('[data-mail-tab="write"]').click());
await page.waitForTimeout(200);
const listed = await page.$$eval('#mailPartners [data-mail-pick]', n=>n.length);
ok('협력업체 목록이 보임', listed > 100, `${listed}곳`);

await page.fill('#mailSearch','금보');
await page.waitForTimeout(200);
const found = await page.$$eval('#mailPartners .mail-partner b', n=>n.map(x=>x.textContent));
ok('업체 검색 동작', found.length>=1 && found.some(t=>t.includes('금보')), found.join(', '));
await page.click('#mailPickAll');
await page.waitForTimeout(200);
await page.fill('#mailSearch','수안건설');
await page.waitForTimeout(200);
await page.click('#mailPickAll');
await page.waitForTimeout(200);
ok('여러 업체를 골라 둘 수 있음', (await page.textContent('#mailPickedCount')).startsWith('2곳'), await page.textContent('#mailPickedCount'));

// 문구 작성 + 치환어
await page.fill('#mailSubject','{{업체명}} 자재공급승인원 요청');
await page.fill('#mailBody','{{업체명}} 담당자님 안녕하세요.\n연락처 {{전화}} 로 확인 부탁드립니다.\n오늘은 {{오늘}} 입니다.');
await page.click('#mailPreviewBtn');
await page.waitForTimeout(200);
const preview = await page.textContent('#mailPreview');
ok('미리 보기에서 값이 채워짐', !preview.includes('{{업체명}}') && !preview.includes('{{오늘}}') && /년 .*월 .*일/.test(preview), preview.slice(0,60));

// 문구 저장
await page.fill('#mailTemplateName','자재공급승인원 요청');
await page.click('#mailSaveTemplate');
await page.waitForTimeout(400);
await page.evaluate(()=>document.querySelector('[data-mail-tab="template"]').click());
await page.waitForTimeout(300);
ok('문구가 저장됨', (await page.$$('#mailTemplateList [data-mail-template]')).length===1);
ok('문구 이름이 붙음', (await page.textContent('#mailTemplateList h4'))==='자재공급승인원 요청');
ok('문구 목록에 제목·내용이 보임', (await page.textContent('#mailTemplateList')).includes('자재공급승인원'));

// 문구 수정 — 목록의 "수정"을 눌러 불러온 뒤 고쳐서 저장
await page.evaluate(()=>document.querySelector('#mailTemplateList [data-mail-edit]').click());
await page.waitForTimeout(300);
ok('수정을 누르면 메일 쓰기에 불러옴', await page.isVisible('#mailWrite')
   && (await page.inputValue('#mailTemplateName'))==='자재공급승인원 요청'
   && (await page.inputValue('#mailSubject')).includes('자재공급승인원'));
await page.fill('#mailBody','{{업체명}} 담당자님, 내용을 고쳤습니다.');
await page.click('#mailSaveTemplate');
await page.waitForTimeout(400);
await page.evaluate(()=>document.querySelector('[data-mail-tab="template"]').click());
await page.waitForTimeout(300);
ok('같은 문구를 고쳐 저장(새로 늘지 않음)', (await page.$$('#mailTemplateList [data-mail-template]')).length===1);
ok('고친 내용이 반영됨', (await page.textContent('#mailTemplateList')).includes('내용을 고쳤습니다'));

// 한 곳씩 발송 — 한 곳은 실패시킨다
await page.evaluate(()=>{ window.__SENT = []; window.__FAIL_TO = 'ljy74178@naver.com'; });
await page.evaluate(()=>document.querySelector('[data-mail-tab="write"]').click());
await page.waitForTimeout(200);
await page.click('#mailSend');
await page.waitForFunction(()=>/보냄 \d+곳/.test(document.querySelector('#mailStatus').textContent), null, { timeout: 15000 });
const sent = await page.evaluate(()=>window.__SENT);
ok('고른 곳마다 따로 한 통씩 나감', sent.length===2, `${sent.length}통`);
ok('받는 사람이 각자 자기 주소뿐', sent.every(m=>String(m.to).split(',').length===1), sent.map(m=>m.to).join(' / '));
ok('업체마다 제목이 다르게 채워짐', new Set(sent.map(m=>m.subject)).size===2, sent.map(m=>m.subject).join(' / '));
ok('본문에도 업체명이 들어감', sent.every(m=>!m.message.includes('{{')), '');
ok('실패해도 나머지는 계속 보냄', (await page.textContent('#mailStatus')).includes('보냄 1곳') && (await page.textContent('#mailStatus')).includes('실패 1곳'), await page.textContent('#mailStatus'));

// 보낸 기록
await page.evaluate(()=>document.querySelector('[data-mail-tab="log"]').click());
await page.waitForTimeout(300);
ok('보낸 기록에 성공·실패가 남음', (await page.$$('#mailLogList .mail-log-row')).length===2, `${(await page.$$('#mailLogList .mail-log-row')).length}줄`);
await page.check('#mailLogFailedOnly');
await page.waitForTimeout(200);
const failedRows = await page.$$eval('#mailLogList .mail-log-row', n=>n.map(x=>x.className));
ok('실패만 보기 동작', failedRows.length===1 && failedRows[0].includes('bad'), failedRows.join(' | '));
await page.click('#mailLogRetry');
await page.waitForTimeout(400);
ok('실패한 곳 다시 고르기 동작', (await page.textContent('#mailPickedCount')).startsWith('1곳'), await page.textContent('#mailPickedCount'));

// 새로고침 후에도 남아 있는지
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
await page.evaluate(()=>document.querySelector('#mailToggle').click());
await page.waitForTimeout(300);
ok('새로고침해도 설정이 남음', await page.isVisible('#mailWrite'));
await page.evaluate(()=>document.querySelector('[data-mail-tab="template"]').click());
await page.waitForTimeout(300);
ok('새로고침해도 문구가 남음', (await page.$$('#mailTemplateList [data-mail-template]')).length===1);
await page.evaluate(()=>document.querySelector('[data-mail-tab="log"]').click());
await page.waitForTimeout(300);
ok('새로고침해도 보낸 기록이 남음', (await page.$$('#mailLogList .mail-log-row')).length===2);

// 문구 삭제
await page.evaluate(()=>document.querySelector('[data-mail-tab="template"]').click());
await page.waitForTimeout(200);
await page.evaluate(()=>document.querySelector('#mailTemplateList [data-mail-del]').click());
await page.waitForTimeout(400);
ok('문구 삭제 동작', (await page.$$('#mailTemplateList [data-mail-template]')).length===0);
ok('실행 취소 버튼이 뜸', await page.isVisible('#toast button'));
await page.click('#toast button');
await page.waitForTimeout(400);
ok('실행 취소하면 문구가 돌아옴', (await page.$$('#mailTemplateList [data-mail-template]')).length===1);

// 새 문구로 저장
await page.evaluate(()=>document.querySelector('[data-mail-tab="write"]').click());
await page.waitForTimeout(200);
await page.fill('#mailTemplateName','견적 요청');
await page.fill('#mailSubject','{{업체명}} 견적 요청');
await page.click('#mailSaveTemplateNew');
await page.waitForTimeout(400);
await page.evaluate(()=>document.querySelector('[data-mail-tab="template"]').click());
await page.waitForTimeout(300);
ok('새 문구로 저장하면 하나 더 늘어남', (await page.$$('#mailTemplateList [data-mail-template]')).length===2);

// 다른 자료를 건드리지 않는지
const other = await page.evaluate(()=>({
  todos: JSON.parse(localStorage.getItem('knowledge-todos')||'[]').length,
  knowledge: JSON.parse(localStorage.getItem('knowledge-messenger-data')||'[]').length,
  templates: JSON.parse(localStorage.getItem('knowledge-mail-templates')||'[]').length,
  log: JSON.parse(localStorage.getItem('knowledge-mail-log')||'[]').length
}));
ok('메일 자료는 자기 칸에만 저장됨', other.templates===2 && other.log===2 && other.knowledge>0, JSON.stringify(other));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
