// 즐겨찾기(앱 런처) — 기본 7개 · 이미지 등록 · 순서 변경 · 기존 데이터 보호.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.env.SHOT_DIR || '/tmp';
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
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const NAMES = ['POUR 협약서','기술지원','고객관리','한솔지식','팀일정','Q&A','영업운영'];
let names = await page.$$eval('.shortcut[data-shortcut] a b', n=>n.map(x=>x.textContent));
ok('기본 7개 · 순서대로', JSON.stringify(names)===JSON.stringify(NAMES), JSON.stringify(names));
ok('옛 기본값(K-APT/Gmail/네이버) 없음', !names.some(n=>['K-APT','Gmail','네이버'].includes(n)));
ok('+ 사이트 추가 유지', await page.isVisible('#shortcutAdd'));
ok('도메인 텍스트 없음', !(await page.textContent('#shortcutGrid')).includes('github.io'));
ok('이미지 없으면 placeholder', (await page.$$eval('.shortcut-badge', n=>n.map(x=>x.textContent))).includes('POUR'));
const url = await page.getAttribute('.shortcut[data-shortcut="shortcut-pour-contract"] a','href');
const target = await page.getAttribute('.shortcut[data-shortcut="shortcut-pour-contract"] a','target');
ok('URL · 새 탭', url==='https://poursolution.github.io/pour-contract/' && target==='_blank', `${url} / ${target}`);
const box = await page.evaluate(()=>{const r=document.querySelector('.shortcut').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)};});
ok('카드 크기 145~160 × 105~120', box.w>=145&&box.w<=160&&box.h>=105&&box.h<=120, JSON.stringify(box));
ok('7개 + 추가가 한 줄', await page.evaluate(()=>{
  const rows=new Set([...document.querySelectorAll('#shortcutGrid > *')].map(n=>Math.round(n.getBoundingClientRect().top)));
  return rows.size===1; }));

// 이미지 업로드 → 미리보기 → 저장
await page.click('.shortcut[data-shortcut="shortcut-card"] [data-shortcut-edit]');
await page.waitForTimeout(200);
await page.click('.row-menu button:has-text("수정")');
await page.waitForTimeout(250);
ok('수정 창에 기존 값', (await page.inputValue('#shortcutName'))==='고객관리');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAPUlEQVR42u3OMQEAAAgDoC252H0MMwZQkk73RgQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBP4LFsFcAAHl9K3RAAAAAElFTkSuQmCC','base64');
await page.setInputFiles('#shortcutFile', { name:'logo.png', mimeType:'image/png', buffer: png });
await page.waitForTimeout(500);
ok('미리보기 표시', await page.isVisible('#shortcutPreview img'));
await page.click('[data-fit="contain"]'); await page.waitForTimeout(150);
ok('맞추기 = contain', (await page.$eval('#shortcutPreview img', n=>getComputedStyle(n).objectFit))==='contain');
await page.click('[data-fit="cover"]'); await page.waitForTimeout(150);
ok('채우기 = cover', (await page.$eval('#shortcutPreview img', n=>getComputedStyle(n).objectFit))==='cover');
await page.click('#shortcutForm button[type="submit"]'); await page.waitForTimeout(400);
ok('카드에 이미지 반영', await page.isVisible('.shortcut[data-shortcut="shortcut-card"] .shortcut-thumb img'));
const stored = await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('knowledge-shortcuts')||'[]').find(x=>x.id==='shortcut-card');return {isData:String(s.image).startsWith('data:'), fit:s.imageFit, kb:Math.round(s.image.length/1024)};});
ok('이미지를 Data URL 로 저장', stored.isData && stored.fit==='cover', JSON.stringify(stored));
ok('이미지 용량이 작게 유지됨(<150KB)', stored.kb < 150, `${stored.kb}KB`);

// 순서 변경 (드래그)
await page.evaluate(()=>{ moveShortcut('shortcut-card','shortcut-pour-contract'); });
await page.waitForTimeout(300);
names = await page.$$eval('.shortcut[data-shortcut] a b', n=>n.map(x=>x.textContent));
ok('순서 변경됨', names[0]==='고객관리', JSON.stringify(names.slice(0,3)));

// 새로고침 후 유지
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
names = await page.$$eval('.shortcut[data-shortcut] a b', n=>n.map(x=>x.textContent));
ok('새로고침 후 순서 유지', names[0]==='고객관리', JSON.stringify(names.slice(0,3)));
ok('새로고침 후 이미지 유지', await page.isVisible('.shortcut[data-shortcut="shortcut-card"] .shortcut-thumb img'));
ok('새로고침해도 기본값이 다시 안 생김', names.length===7, `${names.length}개`);
await page.screenshot({path:out+'/launcher.png'});

// 삭제한 기본값은 되살아나지 않는다
page.on('dialog', d=>d.accept());
await page.click('.shortcut[data-shortcut="shortcut-qna"] [data-shortcut-edit]'); await page.waitForTimeout(200);
await page.click('.row-menu button:has-text("삭제")'); await page.waitForTimeout(400);
await page.reload();
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
names = await page.$$eval('.shortcut[data-shortcut] a b', n=>n.map(x=>x.textContent));
ok('지운 기본값은 되살아나지 않음', !names.includes('Q&A') && names.length===6, JSON.stringify(names));

// 다른 데이터 보호
const other = await page.evaluate(()=>({
  todos: todos.length, memories: memories.length, knowledge: knowledge.length,
  schedule: schedule.length, accounts: accountMeta.length }));
ok('다른 자료 그대로', other.knowledge>0, JSON.stringify(other));

// 사이트 추가
await page.click('#shortcutAdd'); await page.waitForTimeout(250);
await page.fill('#shortcutName','새 사이트'); await page.fill('#shortcutUrl','example.com');
await page.click('#shortcutForm button[type="submit"]'); await page.waitForTimeout(400);
names = await page.$$eval('.shortcut[data-shortcut] a b', n=>n.map(x=>x.textContent));
ok('사이트 추가는 맨 뒤에', names.at(-1)==='새 사이트', JSON.stringify(names));

await b.close(); server.close();
if (errors.length) console.log('JS 오류:\n'+errors.join('\n'));
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
