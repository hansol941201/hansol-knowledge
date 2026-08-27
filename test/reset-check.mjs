// 초기화 버튼과, 뒤늦게 올라간 항목의 말풍선 정리.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1280,height:900}});
await ctx.addInitScript(stub); await ctx.route('**gstatic.com/**',r=>r.abort());
const live=p=>p.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
const page=await ctx.newPage();
page.on('pageerror',e=>console.log('  ERROR:',e.message));
await page.goto(base+'/index.html'); await live(page);
if (await page.isVisible('#orb')) await page.click('#orb');   // 이미 열려 있으면 그대로 쓴다
const send=async t=>{await page.fill('#input',t);await page.press('#input','Enter');await page.waitForTimeout(1400);};
const lastBubble=()=>page.$$eval('#messages .row.answer .bubble', n=>n.at(-1)?.textContent||'');

// A) 쓰기가 한 번 먹히지 않아 "대기 중" 이 뜬 뒤, 재전송으로 올라가면 완료로 바뀌는지
await page.evaluate(()=>{ window.__FAKE_SWALLOW = true; });
await send('기억 1935719');
let text = await lastBubble();
ok('A. 저장이 확인되지 않으면 대기 중 표시', text.includes('로컬 저장 완료·클라우드 연동 대기 중'), text.split('\n')[0]);
await page.evaluate(()=>{ window.__FAKE_SWALLOW = false; });
await page.waitForFunction(()=>[...document.querySelectorAll('#messages .bubble')].every(b=>!b.textContent.includes('클라우드 연동 대기 중')), null, {timeout:30000}).catch(()=>{});
text = await lastBubble();
ok('A. 나중에 올라가면 말풍선이 완료로 바뀜', text.includes('✓ 기록 저장 및 연동 완료'), text.split('\n')[0]);
ok('A. 대기 중 문구가 화면에 남지 않음', !(await page.textContent('#messages')).includes('클라우드 연동 대기 중'));

// B) 초기화 버튼
await page.click('#collapseBtn');
ok('B. 초기화 버튼이 보임', await page.isVisible('#resetOpen'));
await page.click('#resetOpen'); await page.waitForTimeout(300);
ok('B. 초기화 창에 현재 자료 개수 표시', /지식 \d+개 · 할 일 \d+개 · 기억 \d+개/.test(await page.textContent('#resetCount')), await page.textContent('#resetCount'));
ok('B. 전체 삭제는 처음엔 눌리지 않음', await page.isDisabled('#resetAll'));
await page.fill('#resetConfirm','아무거나'); await page.waitForTimeout(120);
ok('B. 확인 문구가 틀리면 계속 잠김', await page.isDisabled('#resetAll'));
await page.fill('#resetConfirm','삭제'); await page.waitForTimeout(120);
ok('B. "삭제" 입력하면 열림', !(await page.isDisabled('#resetAll')));

// 백업 내려받기
const download = page.waitForEvent('download', {timeout:10000});
await page.click('#resetBackup');
const file = await download;
ok('B. 백업 JSON 내려받기', /hansol-knowledge-backup-\d{4}-\d{2}-\d{2}\.json/.test(file.suggestedFilename()), file.suggestedFilename());

// 전체 삭제 실행
page.on('dialog', d => d.accept());
await page.click('#resetAll');
await page.waitForTimeout(2500);
const after = await page.evaluate(()=>({
  todos: todos.filter(t=>!t.deleted).length,
  memories: memories.filter(m=>!m.deleted).length,
  knowledge: knowledge.filter(k=>!k.deleted).length }));
ok('B. 전체 삭제 후 화면에 남는 자료 없음', after.todos===0 && after.memories===0 && after.knowledge===0, JSON.stringify(after));
const cloud = await page.evaluate(async ()=>{
  const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};
  return { alive: [...(d.todos||[]),...(d.memories||[]),...(d.knowledge||[])].filter(x=>!x.deleted).length,
           tombstones: [...(d.todos||[]),...(d.memories||[]),...(d.knowledge||[])].filter(x=>x.deleted).length };
});
ok('B. 클라우드에도 삭제 표시로 반영(다른 기기에서 안 되살아남)', cloud.alive===0 && cloud.tombstones>0, JSON.stringify(cloud));

// 다른 기기가 옛 사본을 갖고 있어도 되살아나지 않는지
const other=await b.newContext({viewport:{width:1000,height:800}});
await other.route('**gstatic.com/**',r=>r.abort());
await other.addInitScript(([k,v])=>localStorage.setItem(k,v), ['fake-firestore-shared-state', await page.evaluate(()=>localStorage.getItem('fake-firestore-shared-state'))]);
await other.addInitScript(stub);
const page2=await other.newPage();
await page2.goto(base+'/index.html'); await live(page2); await page2.waitForTimeout(800);
const revived = await page2.evaluate(()=>todos.filter(t=>!t.deleted).length + memories.filter(m=>!m.deleted).length);
ok('B. 다른 브라우저에서도 지워진 상태 유지', revived===0, String(revived));

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
