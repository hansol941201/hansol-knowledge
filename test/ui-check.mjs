// 요청하신 6가지 확인 항목.
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
const page=await ctx.newPage();
page.on('pageerror',e=>console.log('  ERROR:',e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.click('#orb');
const send=async t=>{await page.fill('#input',t);await page.press('#input','Enter');await page.waitForTimeout(1200);};
const search=async q=>{await page.fill('#pageSearch',q);await page.press('#pageSearch','Enter');await page.waitForTimeout(350);};

// 1) 할 일 입력 → 할 일에만
await send('할일 금화기업 전화');
let where = await page.evaluate(()=>({
  todo: todos.filter(t=>!t.deleted&&t.text==='금화기업 전화').length,
  memory: memories.filter(m=>!m.deleted&&m.text==='금화기업 전화').length }));
ok('1. 할 일 입력 → todos 에만 존재', where.todo===1 && where.memory===0, JSON.stringify(where));

// 2) 기억 입력 → 기억에만, 상단 할 일 목록에 안 나옴
await send('기억 춘천인성 협약서 들어오면 성민님한테 말하기');
where = await page.evaluate(()=>({
  memory: memories.filter(m=>!m.deleted&&m.text==='춘천인성 협약서 들어오면 성민님한테 말하기').length,
  todo: todos.filter(t=>!t.deleted&&t.text==='춘천인성 협약서 들어오면 성민님한테 말하기').length }));
ok('2. 기억 입력 → memories 에만 존재', where.memory===1 && where.todo===0, JSON.stringify(where));
ok('2. 상단 할 일 목록에 기억이 안 보임', !(await page.textContent('#todayPanel')).includes('춘천인성'));

// 예전 자료가 섞여 있어도 제자리로 옮기는지
await page.evaluate(async () => {
  const ref = window.HANSOL_FIRESTORE.doc('shared/state');
  const d = (await ref.get()).data() || {};
  d.todos = [...(d.todos||[]), { id:'legacy-mixed', type:'memory', text:'예전에 잘못 들어간 기억', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() }];
  await ref.set(d);
});
await page.waitForTimeout(1500);
const fixed = await page.evaluate(()=>({
  inTodos: todos.some(t=>t.id==='legacy-mixed'),
  inMemories: memories.some(m=>m.id==='legacy-mixed') }));
ok('2. 잘못 들어간 기억을 memories 로 옮김', !fixed.inTodos && fixed.inMemories, JSON.stringify(fixed));
ok('2. 옮긴 뒤 할 일 목록에 안 보임', !(await page.textContent('#todayPanel')).includes('예전에 잘못 들어간'));

// 3) 검색어 형광펜
await search('춘천');
const marks = await page.$$eval('#pageGrid mark', n=>n.map(x=>x.textContent));
ok('3. 검색어만 형광펜 표시', marks.length>0 && marks.every(t=>t==='춘천'), JSON.stringify(marks));
const markStyle = await page.$eval('#pageGrid mark', n=>{const s=getComputedStyle(n);return {bg:s.backgroundColor,color:s.color};});
ok('3. 연노랑 배경 · 검정 글자', markStyle.bg==='rgb(255, 243, 160)' && markStyle.color==='rgb(0, 0, 0)', JSON.stringify(markStyle));
const around = await page.$eval('#pageGrid .memory-result-card p', n=>n.textContent);
ok('3. 나머지 글자는 그대로', around.includes('협약서 들어오면 성민님한테 말하기'));

// 대소문자 무시 + 여러 곳
await send('기억 ABC 자재와 abc 도면 확인');
await search('abc');
const caseMarks = await page.$$eval('#pageGrid mark', n=>n.map(x=>x.textContent));
ok('3. 대소문자 무시하고 모두 표시', caseMarks.includes('ABC') && caseMarks.includes('abc'), JSON.stringify(caseMarks));

// 4) 검색 중 상단 할 일 목록 숨김
await search('춘천');
ok('4. 검색 중 상단 할 일 목록 숨김', !(await page.isVisible('#todayPanel')));
ok('4. 검색 결과 카드는 보임', await page.isVisible('#pageGrid .memory-result-card'));

// 5) 검색어 삭제 → 다시 표시
await search('');
ok('5. 검색어 삭제 후 할 일 목록 다시 표시', await page.isVisible('#todayPanel'));
ok('5. 하이라이트도 사라짐', (await page.$$('#pageGrid mark')).length===0);

// 6) 분류 글자가 시간보다 크게
await search('춘천');
const sizes = await page.evaluate(()=>{
  const card=document.querySelector('#pageGrid .memory-result-card');
  const kind=getComputedStyle(card.querySelector('.card-kind'));
  const time=getComputedStyle(card.querySelector('.card-time'));
  const body=getComputedStyle(card.querySelector('p'));
  return { kind:parseFloat(kind.fontSize), kindWeight:Number(kind.fontWeight),
           time:parseFloat(time.fontSize), body:parseFloat(body.fontSize) };
});
ok('6. 분류(할 일/기억)가 시간보다 큼', sizes.kind > sizes.time, JSON.stringify(sizes));
ok('6. 분류 13~14px · semibold', sizes.kind>=13 && sizes.kind<=14 && sizes.kindWeight>=500, `${sizes.kind}px / ${sizes.kindWeight}`);
ok('6. 시간 10~11px', sizes.time>=10 && sizes.time<=11, `${sizes.time}px`);
ok('6. 저장 내용이 가장 잘 읽힘', sizes.body>=13 && sizes.body>=sizes.kind-1, `${sizes.body}px`);

await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
