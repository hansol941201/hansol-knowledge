// 메일함 제거 — 화면·메뉴·검색에서 사라졌는지, 저장돼 있던 메일 자료는 지워지지 않는지
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
// 클라우드에 이미 저장돼 있던 메일함 자료를 미리 넣어 둔다
await ctx.addInitScript(() => {
  localStorage.setItem('fake-firestore-shared-state', JSON.stringify({
    knowledge: [], todos: [], memories: [], accountMeta: [], shortcuts: [], schedule: [],
    mailTemplates: [{ id:'t1', type:'mailTemplate', name:'자재공급승인원 요청', subject:'{{업체명}} 요청', body:'본문', updatedAt:'2026-09-01T00:00:00.000Z' }],
    mailLog: [{ id:'l1', type:'mailLog', to:'a@b.com', ok:true, subject:'요청', updatedAt:'2026-09-01T00:00:00.000Z' }],
    mailConfig: { provider:'emailjs', serviceId:'service_keep', templateId:'t', publicKey:'k', updatedAt:'2026-09-01T00:00:00.000Z' }
  }));
  localStorage.setItem('knowledge-mail-templates', JSON.stringify([{ id:'t1', name:'기기에 남아 있던 문구' }]));
});
await ctx.addInitScript(stub);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(700);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

ok('상단 메뉴에 메일함 없음', await page.evaluate(()=>![...document.querySelectorAll('#sideNav .top-item')].some(n=>n.textContent==='메일함')));
ok('메일함 창이 없음', (await page.$$('#mailModal')).length===0);
ok('화면에 메일함 문구가 남아 있지 않음', !(await page.textContent('.workspace')).includes('메일함'));
ok('메일함 스타일도 제거됨', !(await page.evaluate(async()=>{
  const res = await fetch('styles.css'); const css = await res.text(); return css.includes('mail-box'); })));

// 검색 미리보기에서도 사라졌는지
await page.click('#pageSearch');
await page.type('#pageSearch','메일',{delay:8});
await page.waitForTimeout(400);
ok('검색 미리보기에 메일함 바로가기 없음', !((await page.textContent('#searchPreview'))||'').includes('메일함'));
await page.fill('#pageSearch',''); await page.keyboard.press('Escape');

// 저장돼 있던 메일 자료가 지워지지 않는지 — 다른 자료를 저장해도 그대로 남아야 한다
await page.evaluate(()=>{ document.querySelector('#pageAdd').click(); });
await page.waitForTimeout(200);
await page.evaluate(()=>[...document.querySelectorAll('[data-add]')].find(b=>b.dataset.add==='할 일')?.click());
await page.waitForTimeout(200);
await page.fill('#quickTextInput','메일 자료 보존 확인용 할 일');
await page.click('#quickTextForm button[type="submit"]');
await page.waitForTimeout(900);
const kept = await page.evaluate(()=>{
  const doc = JSON.parse(localStorage.getItem('fake-firestore-shared-state') || '{}');
  return { templates: (doc.mailTemplates||[]).length, log: (doc.mailLog||[]).length,
           serviceId: doc.mailConfig && doc.mailConfig.serviceId,
           localTemplates: localStorage.getItem('knowledge-mail-templates'),
           todoSaved: (doc.todos||[]).some(t=>t && t.text==='메일 자료 보존 확인용 할 일') };
});
ok('할 일은 정상 저장됨', kept.todoSaved);
ok('클라우드의 메일 문구가 그대로 남음', kept.templates===1, `${kept.templates}개`);
ok('클라우드의 보낸 기록이 그대로 남음', kept.log===1, `${kept.log}개`);
ok('클라우드의 발송 설정이 그대로 남음', kept.serviceId==='service_keep', String(kept.serviceId));
ok('이 기기에 있던 메일 자료도 그대로 남음', (kept.localTemplates||'').includes('기기에 남아 있던 문구'));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
