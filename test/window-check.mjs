// 지식창은 사용자가 직접 접기 전에는 닫히지 않는다.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const failures = [];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/missing-team/')){res.writeHead(404,{'Content-Type':'text/html'});return res.end('<title>404</title>');}
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
await ctx.addInitScript(u=>{window.__TEAM_SCHEDULE_URL=u;},`${base}/missing-team/`);
await ctx.route('**gstatic.com/**',r=>r.abort());
const page=await ctx.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const ready = async () => {
  await page.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
  await page.waitForTimeout(600);
};
await page.goto(base+'/index.html');
await ready();
ok('자바스크립트 오류 없음', errors.length===0, errors.join(' | '));

const open = () => page.isVisible('#app');
const orbShown = () => page.isVisible('#orb');

// 닫기 버튼이 없다
const buttons = await page.$$eval('#app .header-actions button', n=>n.map(x=>x.id));
ok('닫기 버튼 없음(접기만)', buttons.includes('collapseBtn') && !buttons.some(id=>/close|닫/i.test(id)), JSON.stringify(buttons));

await page.click('#orb'); await page.waitForTimeout(300);
ok('열기', await open());

// 바깥 클릭 · Esc · 다른 기능 실행에도 유지
await page.mouse.click(700, 500); await page.waitForTimeout(250);
ok('바깥 영역 클릭해도 유지', await open());
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
ok('Esc 눌러도 유지', await open());
await page.click('#sideNav button:has-text("특허")'); await page.waitForTimeout(300);
ok('다른 메뉴로 옮겨도 유지', await open());
await page.fill('#pageSearch','할일 창유지테스트'); await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
ok('다른 기능 실행해도 유지', await open());
await page.click('#memoryToggle'); await page.waitForTimeout(400);
ok('모달을 열어도 유지', await open());
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
ok('모달만 닫히고 창은 유지', await open() && !(await page.isVisible('#memoryModal')));

// 대화 내용 + 입력 중이던 글
await page.fill('#input','쓰다 만 문장');
await page.waitForTimeout(400);

// 새로고침 후 복원
await page.reload(); await ready();
ok('새로고침해도 열린 채로', await open());
ok('대화 내용 복원', (await page.textContent('#messages')).includes('창유지테스트'), (await page.textContent('#messages')).slice(0,60));
ok('쓰던 글 복원', (await page.inputValue('#input'))==='쓰다 만 문장');

// 브라우저를 다시 연 것과 같은 상황(같은 저장소, 새 탭)
const page2 = await ctx.newPage();
await page2.goto(base+'/index.html');
await page2.waitForFunction(()=>document.querySelector('#syncState')?.dataset.state==='live',null,{timeout:10000});
await page2.waitForTimeout(700);
ok('새 탭에서도 이전 상태 복원', await page2.isVisible('#app'));
ok('새 탭에서도 내용 복원', (await page2.textContent('#messages')).includes('창유지테스트'));
await page2.close();

// 오류가 나도 닫히지 않는다
await page.evaluate(()=>{ setTimeout(()=>{ throw new Error('일부러 낸 오류'); }, 0); });
await page.waitForTimeout(500);
ok('오류가 나도 유지', await open());

// 창이 강제로 지워져도 자동 복구
await page.evaluate(()=>document.querySelector('#app').remove());
await page.waitForTimeout(1500);
ok('창이 지워져도 자동 복구', await open());
await page.evaluate(()=>document.querySelector('#app').classList.add('hidden'));
await page.waitForTimeout(1500);
ok('강제로 숨겨도 자동 복구', await open());

// 연결이 끊겨도 유지
await ctx.setOffline(true); await page.waitForTimeout(1200);
ok('연결 끊겨도 유지', await open());
await ctx.setOffline(false); await page.waitForTimeout(800);
ok('다시 연결돼도 유지', await open());

// 최소화 — 접어도 열기 버튼은 항상 보인다
await page.click('#collapseBtn'); await page.waitForTimeout(400);
ok('접으면 창은 숨고', !(await open()));
ok('접어도 열기 버튼은 화면에 보임', await orbShown());
await page.evaluate(()=>document.querySelector('#orb').remove());
await page.waitForTimeout(1500);
ok('열기 버튼이 지워져도 자동 복구', await orbShown());
await page.reload(); await ready();
ok('접은 상태도 그대로 복원', !(await open()) && await orbShown());

await b.close(); server.close();
if (errors.length) console.log('JS 오류:\n'+errors.join('\n'));
console.log(failures.length ? `\n실패 ${failures.length}건` : '\n모두 통과');
process.exit(failures.length?1:0);
