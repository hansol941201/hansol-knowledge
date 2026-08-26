// 대시보드는 바로가기 · 오늘의 할 일 · 일정 세 가지만 보여 준다.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.env.SHOT_DIR || root;
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
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1.5});
await ctx.addInitScript(stub); await ctx.route('**gstatic.com/**',r=>r.abort());
await ctx.route('**google.com/s2/favicons**', r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#DFD4FA"/></svg>'}));
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 대시보드 구성
ok('바로가기 표시', await page.isVisible('#shortcutGrid'));
ok('바로가기 제목·설명 없음', !(await page.textContent('.main-scroll')).includes('자주 사용하는 업무 사이트'));
ok('오늘의 할 일 표시', await page.isVisible('#todayPanel'));
ok('일정 표시', await page.isVisible('#schedulePanel'));
ok('모아 보기 숨김', !(await page.isVisible('#knowledgeBlock')));
ok('카테고리 버튼 숨김', !(await page.isVisible('#pageCategories')));
ok('AI 인사이트 제거', (await page.$$('.ai-insight')).length===0 && !(await page.content()).includes('AI 인사이트'));
const cols = await page.evaluate(()=>{
  const a=document.querySelector('#todayPanel').getBoundingClientRect();
  const s=document.querySelector('#schedulePanel').getBoundingClientRect();
  return { todoW:Math.round(a.width), schedW:Math.round(s.width), gap:Math.round(s.left-a.right), sameRow:Math.abs(a.top-s.top)<2 };
});
ok('2열 · 폭 동일', cols.sameRow && Math.abs(cols.todoW-cols.schedW)<2, JSON.stringify(cols));
ok('카드 간격 16~20px', cols.gap>=16 && cols.gap<=20, `${cols.gap}px`);

// 일정 추가 → 정렬 → 배지
const iso = (offset) => { const d=new Date(); d.setDate(d.getDate()+offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const add = async (date, title, time='') => {
  await page.click('#scheduleAdd'); await page.waitForTimeout(200);
  await page.fill('#scheduleDate', date); await page.fill('#scheduleTitle', title);
  if (time) await page.fill('#scheduleTime', time);
  await page.click('#scheduleForm button[type="submit"]'); await page.waitForTimeout(350);
};
await add(iso(10), '공법설명회');
await add(iso(0), '1차 미팅', '14:00');
await add(iso(1), '시공사 방문');
await add(iso(-5), '지난 현장 방문');
const rows = await page.$$eval('.schedule-row .schedule-body b', n=>n.map(x=>x.textContent));
ok('가까운 일정이 위로 정렬', JSON.stringify(rows)===JSON.stringify(['1차 미팅','시공사 방문','공법설명회']), JSON.stringify(rows));
ok('지난 일정은 기본 숨김', !rows.includes('지난 현장 방문'));
const badges = await page.$$eval('.schedule-badge', n=>n.map(x=>x.textContent));
ok('오늘·내일 배지', badges.includes('오늘') && badges.includes('내일'), JSON.stringify(badges));
ok('그 외에는 배지 없음', badges.length===2);
ok('시간·메모 표시', (await page.textContent('#schedulePanel')).includes('14:00'));
await page.click('#schedulePast'); await page.waitForTimeout(250);
ok('지난 일정 보기', (await page.textContent('#schedulePanel')).includes('지난 현장 방문'));
await page.click('#schedulePast'); await page.waitForTimeout(200);

// 저장 확인
ok('localStorage 에 저장', await page.evaluate(()=>JSON.parse(localStorage.getItem('knowledge-schedule')||'[]').some(x=>x.title==='1차 미팅')));
ok('클라우드에도 저장', await page.evaluate(async()=>{const d=(await window.HANSOL_FIRESTORE.doc('shared/state').get()).data()||{};return (d.schedule||[]).some(x=>x.title==='1차 미팅');}));

// 수정 · 삭제
await page.hover('.schedule-row'); await page.click('.schedule-row .schedule-more'); await page.waitForTimeout(200);
await page.fill('#scheduleTitle','1차 미팅(변경)');
await page.click('#scheduleForm button[type="submit"]'); await page.waitForTimeout(300);
ok('일정 수정', (await page.textContent('#schedulePanel')).includes('1차 미팅(변경)'));
page.on('dialog', d=>d.accept());
await page.hover('.schedule-row'); await page.click('.schedule-row .schedule-more'); await page.waitForTimeout(200);
await page.click('#scheduleDelete'); await page.waitForTimeout(300);
ok('일정 삭제', !(await page.textContent('#schedulePanel')).includes('1차 미팅(변경)'));

await page.screenshot({path:out+'/dash.png'});

// 새로고침 후 유지
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(500);
ok('새로고침 후 일정 유지', (await page.textContent('#schedulePanel')).includes('시공사 방문'));

// 다른 화면은 그대로
await page.click('.side-item[data-nav="특허"]'); await page.waitForTimeout(500);
ok('특허 화면은 목록 표시', await page.isVisible('#knowledgeBlock') && (await page.$$eval('#pageGrid .patent-card', n=>n.length))>100);
ok('특허 화면에서는 대시보드 카드 숨김', !(await page.isVisible('#schedulePanel')));
await page.click('.side-item[data-nav="할 일"]'); await page.waitForTimeout(400);
ok('할 일 화면은 할 일 카드 표시', await page.isVisible('#todayPanel') && !(await page.isVisible('#schedulePanel')));
await page.click('.side-item[data-nav="대시보드"]'); await page.waitForTimeout(400);
ok('대시보드 복귀', await page.isVisible('#schedulePanel') && !(await page.isVisible('#knowledgeBlock')));

for (const w of [1440, 1366]) {
  await page.setViewportSize({width:w, height:900}); await page.waitForTimeout(250);
  ok(`${w}px 가로 넘침 없음`, !(await page.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth+1)));
}
await b.close(); server.close();
if (errors.length) console.log('JS 오류:\n'+errors.join('\n'));
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
