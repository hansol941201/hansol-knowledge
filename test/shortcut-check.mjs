// 즐겨찾기(앱 런처) — 기본 7개 · 이미지 등록 · 순서 변경 · 기존 데이터 보호.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import zlib from 'node:zlib';
// 가장자리가 투명한 정사각형 PNG (로고 파일처럼) — JPEG 로 바뀌면 그 자리가 까맣게 굳는다.
function transparentSquarePng(size = 64) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y += 1) {
    raw[o++] = 0;
    for (let x = 0; x < size; x += 1) {
      const inner = x >= 12 && x < size - 12 && y >= 12 && y < size - 12;
      raw[o++] = inner ? 220 : 0; raw[o++] = inner ? 70 : 0; raw[o++] = inner ? 70 : 0;
      raw[o++] = inner ? 255 : 0;                 // 바깥쪽은 완전히 투명
    }
  }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
    const head = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(head) >>> 0);
    return Buffer.concat([len, head, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
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
ok('카드 크기 145~160 × 120~140', box.w>=145&&box.w<=160&&box.h>=120&&box.h<=140, JSON.stringify(box));
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
ok('미리보기도 contain', (await page.$eval('#shortcutPreview img', n=>getComputedStyle(n).objectFit))==='contain');
ok('채우기/맞추기 선택 없음', (await page.$$('[data-fit]')).length===0);
await page.click('#shortcutForm button[type="submit"]'); await page.waitForTimeout(400);
ok('카드에 이미지 반영', await page.isVisible('.shortcut[data-shortcut="shortcut-card"] .shortcut-thumb img'));
const thumb = await page.evaluate(()=>{
  const box=document.querySelector('.shortcut[data-shortcut="shortcut-card"] .shortcut-thumb');
  const img=box.querySelector('img'); const c=getComputedStyle(box); const ic=getComputedStyle(img);
  const br=box.getBoundingClientRect(), ir=img.getBoundingClientRect();
  return { h:Math.round(br.height), pad:parseFloat(c.paddingTop), bg:c.backgroundColor, overflow:c.overflow,
           fit:ic.objectFit, pos:ic.objectPosition, imgBg:ic.backgroundColor,
           inside: ir.width<=br.width-19 && ir.height<=br.height-19,
           imgW:Math.round(ir.width), imgH:Math.round(ir.height) };
});
ok('이미지 영역 높이 90px', thumb.h===90, `${thumb.h}px`);
ok('안쪽 여백 10px 이상', thumb.pad>=10, `${thumb.pad}px`);
ok('이미지가 잘리지 않음(contain · center)', thumb.fit==='contain' && thumb.pos==='50% 50%', JSON.stringify(thumb));
ok('이미지가 여백 안에 들어감', thumb.inside, JSON.stringify(thumb));
ok('연보라 배경 · 검은색 아님', thumb.bg==='rgb(242, 238, 253)' && thumb.imgBg==='rgba(0, 0, 0, 0)', JSON.stringify(thumb));
ok('넘침 숨김', thumb.overflow==='hidden', thumb.overflow);
const stored = await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('knowledge-shortcuts')||'[]').find(x=>x.id==='shortcut-card');return {isData:String(s.image).startsWith('data:'), fit:s.imageFit, kb:Math.round(s.image.length/1024)};});
ok('이미지를 Data URL 로 저장', stored.isData && stored.fit==='contain', JSON.stringify(stored));
ok('이미지 용량이 작게 유지됨(<150KB)', stored.kb < 150, `${stored.kb}KB`);

// 투명한 PNG 는 JPEG 로 바꾸지 않는다(검은 여백 방지)
await page.click('.shortcut[data-shortcut="shortcut-pour-support"] [data-shortcut-edit]');
await page.waitForTimeout(200);
await page.click('.row-menu button:has-text("수정")');
await page.waitForTimeout(250);
await page.setInputFiles('#shortcutFile', { name:'logo.png', mimeType:'image/png', buffer: transparentSquarePng() });
await page.waitForTimeout(600);
await page.click('#shortcutForm button[type="submit"]'); await page.waitForTimeout(400);
const clear = await page.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem('knowledge-shortcuts')||'[]').find(x=>x.id==='shortcut-pour-support');
  return { head:String(s.image).slice(0,20) };
});
ok('투명 PNG 는 PNG 로 저장(검게 굳지 않음)', clear.head.startsWith('data:image/png'), clear.head);
const corner = await page.evaluate(async ()=>{
  const img=document.querySelector('.shortcut[data-shortcut="shortcut-pour-support"] .shortcut-thumb img');
  await img.decode();
  const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight;
  const x=c.getContext('2d'); x.drawImage(img,0,0);
  const d=x.getImageData(1,1,1,1).data;
  return { r:d[0], g:d[1], b:d[2], a:d[3] };
});
ok('이미지 모서리가 투명(검은색 아님)', corner.a===0, JSON.stringify(corner));

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
