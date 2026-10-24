const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Node {
  constructor() { this.children=[]; this.textContent=''; }
  append(node) { this.children.push(node); }
  replaceChildren() { this.children=[]; }
  get text() { return this.textContent + this.children.map(node=>node.text).join(''); }
}
let now = Date.parse('2026-10-23T15:00:00Z');
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
const elements = { contractBriefingList:new Node(), contractDdayList:new Node() };
const dateNodes = [new Node(),new Node()];
const timers = new Map(), intervals=[], events={}, calls=[];
let timerId=0, source, failure=false;
let data=[{name:'현설 A',briefingDate:'2026-10-24'},{name:'D-DAY B',deadline:'2026-10-24'}];
class ReadStream {
  constructor(url) { this.url=url; this.handlers={}; source=this; }
  addEventListener(name, callback) { this.handlers[name]=callback; }
  close() { this.closed=true; }
}
const context = {
  Date:Clock, Intl, AbortController, EventSource:ReadStream,
  document:{ createElement:()=>new Node(), getElementById:id=>elements[id], querySelectorAll:()=>dateNodes, addEventListener:(name,fn)=>{events[name]=fn;}, hidden:false },
  setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},
  clearTimeout:id=>timers.delete(id), setInterval:fn=>intervals.push(fn),
  fetch:async(url,options)=>{calls.push({url,options});if(failure)throw Error('network');return {ok:true,json:async()=>data};}
};
context.window={ addEventListener:(name,fn)=>{events[name]=fn;} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve('../contract-today-model.js'),'utf8'), context);
vm.runInContext(fs.readFileSync(require.resolve('../contract-today.js'),'utf8'), context);
const flush = () => new Promise(resolve=>setImmediate(resolve));
const debounce = async () => { const entry=[...timers.values()].find(item=>item.ms===300); assert.ok(entry); entry.fn(); await flush(); };
(async()=>{
  await flush();
  assert.equal(elements.contractBriefingList.text,'현설 A');
  assert.equal(elements.contractDdayList.text,'D-DAY B');
  data=[{name:'즉시 변경 C',deadline:'2026-10-24'}];
  source.handlers.patch(); await debounce();
  assert.equal(elements.contractBriefingList.text,'오늘 해당 아파트 없음');
  assert.equal(elements.contractDdayList.text,'즉시 변경 C');
  failure=true; events.focus(); await flush();
  assert.equal(elements.contractDdayList.text,'정보를 불러오지 못했습니다');
  assert.equal(elements.contractBriefingList.text,'정보를 불러오지 못했습니다');
  failure=false; data=[]; events.online(); await flush();
  assert.equal(elements.contractDdayList.text,'오늘 해당 아파트 없음');
  data=[{name:'다음날 현설',briefingDate:'2026-10-25'}];
  now=Date.parse('2026-10-24T15:00:00Z'); intervals[0](); await flush();
  assert.equal(elements.contractBriefingList.text,'다음날 현설');
  assert.equal(dateNodes[0].textContent,'2026-10-25');
  assert.ok(calls.every(call=>call.options.method==='GET' && call.options.credentials==='omit'));
  assert.ok(calls.every(call=>call.url===source.url && call.url.endsWith('/contract/projects.json')));
  console.log('Read-only connector: live-change refresh, error/empty distinction, recovery, Seoul date rollover, GET-only passed.');
})().catch(error=>{ console.error(error); process.exitCode=1; });
