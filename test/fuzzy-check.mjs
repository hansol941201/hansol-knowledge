// 유사 표현 · 붙여쓰기 · 조사 · 오타 검색
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('x');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(0,r));
const base=`http://localhost:${server.address().port}`;
const stub=fs.readFileSync(path.join(root,'test','fake-firebase.js'),'utf8');
const ok=(n,p,d='')=>{ if(!p) failures.push(n); console.log(`${p?'PASS':'FAIL'}  ${n}${d?` — ${d}`:''}`); };
const stamp={source:'테스트',createdAt:'2026-08-26T01:00:00.000Z',updatedAt:'2026-08-26T01:00:00.000Z'};
const seed=[
  {id:'k1',type:'knowledge',title:'에폭시(들어가는자재)',answer:'프라이머, 주제, 경화제, 규사',category:'업무지식',aliases:[],...stamp},
  {id:'k2',type:'knowledge',title:'시공사 전화번호',answer:'대표번호 목록입니다',category:'연락처',aliases:[],...stamp},
  {id:'k3',type:'knowledge',title:'공동주택 시공실적',answer:'2025년 실적 정리',category:'업무지식',aliases:[],...stamp},
  {id:'k4',type:'knowledge',title:'MOU 협력업체',answer:'협약을 맺은 업체 목록',category:'업무지식',aliases:[],...stamp},
  {id:'k5',type:'knowledge',title:'바닥 균열 보수',answer:'에폭시를 한 번 사용한다',category:'업무지식',aliases:[],...stamp}];
const b=await chromium.launch({executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:1600,height:1000}});
await ctx.addInitScript(stub);
await ctx.addInitScript(l=>{localStorage.setItem('knowledge-messenger-data',JSON.stringify(l));},seed);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
await page.goto(base+'/index.html');
await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page.waitForTimeout(600);
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

// 미리보기에서 확인 (검색 규칙을 그대로 쓰는 경로)
const preview = async (text) => {
  await page.fill('#pageSearch','');
  await page.click('#pageSearch');
  await page.type('#pageSearch', text, { delay: 5 });
  await page.waitForTimeout(350);
  return page.$$eval('#searchPreview .preview-item', n=>n.map(x=>x.textContent.replace(/\s+/g,' ').trim()));
};
const 에폭시검색 = ['에폭시','에폭시자재','에폭시 자재','에폭시 재료','에폭시자재종류','에폭시 들어가는 자재','에폭시에 들어가는 자재','에폭시 사용하는 재료','에폭시자제'];
for (const q of 에폭시검색) {
  const rows = await preview(q);
  const at = rows.findIndex(t=>t.includes('에폭시(들어가는자재)'));
  ok(`‘${q}’ → 에폭시(들어가는자재)`, at >= 0, at<0 ? JSON.stringify(rows.slice(0,3)) : `${at+1}번째`);
}
// 제목이 맞는 자료가 본문만 스친 자료보다 위
const rank = await preview('에폭시 자재');
ok('제목 일치가 본문 일치보다 위', rank.findIndex(t=>t.includes('에폭시(들어가는자재)')) < (rank.findIndex(t=>t.includes('바닥 균열 보수'))+1 || 99),
   JSON.stringify(rank.slice(0,3)));
ok('일치한 이유 표시', (await preview('에폭시 재료')).some(t=>t.includes('관련 표현')), JSON.stringify((await preview('에폭시 재료')).slice(0,2)));

// 유사어 사전
for (const [q, title] of [['시공사 연락처','시공사 전화번호'],['업체 전화번호','시공사 전화번호'],
                          ['아파트 시공실적','공동주택 시공실적'],['공동주택 공사실적','공동주택 시공실적'],
                          ['협약 업체','MOU 협력업체'],['MOU 협력업체','MOU 협력업체']]) {
  const rows = await preview(q);
  ok(`‘${q}’ → ${title}`, rows.some(t=>t.includes(title)), JSON.stringify(rows.slice(0,3)));
}
// 오타
ok('‘협력업채’ → MOU 협력업체', (await preview('협력업채')).some(t=>t.includes('MOU 협력업체')));
ok('2글자 이하에는 오타 검색을 하지 않음', await page.evaluate(()=>
  buildSearchQuery('에').typoAllowed === false
  && buildSearchQuery('에폭').typoAllowed === false
  && buildSearchQuery('에폭시').typoAllowed === true));
ok('관계없는 검색어는 결과 없음', (await preview('zzzz없는말')).length===0);

// 원본 표시 (정규화 문자열이 화면에 나오지 않는다)
const shown = await preview('에폭시 재료');
ok('화면에는 원본 제목 그대로', shown.some(t=>t.includes('에폭시(들어가는자재)')), JSON.stringify(shown.slice(0,2)));

// Enter 전체 검색에도 같은 규칙이 적용된다
await page.fill('#pageSearch','에폭시 재료');
await page.keyboard.press('Enter'); await page.waitForTimeout(600);
ok('Enter 전체 검색에도 유사어 적용', (await page.textContent('#pageGrid')).includes('에폭시(들어가는자재)'));
await page.fill('#pageSearch','에폭시자재');
await page.keyboard.press('Enter'); await page.waitForTimeout(600);
ok('Enter 전체 검색에 붙여쓰기 적용', (await page.textContent('#pageGrid')).includes('에폭시(들어가는자재)'));
await page.fill('#pageSearch','시공사 연락처');
await page.keyboard.press('Enter'); await page.waitForTimeout(600);
ok('Enter 전체 검색에 유사어 적용(연락처)', (await page.textContent('#pageGrid')).includes('시공사 전화번호'));

// 기존 검색이 그대로인지
await page.fill('#pageSearch','바닥');
await page.keyboard.press('Enter'); await page.waitForTimeout(600);
ok('기존 단어 검색 정상', (await page.textContent('#pageGrid')).includes('바닥 균열 보수'));
ok('검색어 강조 유지', (await page.$$('#pageGrid mark')).length>0);

// 성능 — 입력할 때 클라우드를 다시 부르지 않는다
const before = await page.evaluate(()=>window.__FAKE_WRITES);
for (const q of ['에폭시','에폭시 자재','시공사 연락처']) await preview(q);
ok('검색할 때 클라우드를 다시 부르지 않음', (await page.evaluate(()=>window.__FAKE_WRITES))===before);
ok('검색 인덱스를 다시 만들지 않음', await page.evaluate(()=>searchIndexDirty===false));

ok('끝까지 오류 없음', errors.length===0, errors.join(' | '));
await b.close(); server.close();
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
