const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('shortcuts.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const storage = new Map();
const win = { localStorage: {getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}, screen:{availWidth:1600,availHeight:900}, matchMedia:()=>({matches:false}) };
vm.runInNewContext(source, {window:win});
const model=win.HANSOL_SHORTCUTS;
const oldUrl='https://hansol941201.github.io/card/';
const newUrl='https://bridgeone-m.github.io/card/';
const defaults=[{id:'shortcut-card',name:'고객관리',url:newUrl},{id:'shortcut-card',name:'고객관리',url:oldUrl}];
const auto={id:'shortcut-card',name:'고객관리',url:oldUrl,source:'기본',updatedAt:'2099-01-01T00:00:00Z'};
const user={...auto,url:newUrl,updatedAt:'2026-11-02T00:00:00Z'};
let count=0;
function check(name,fn){fn();count++;console.log('PASS '+name);}
check('future-dated legacy default cannot overwrite edited URL in either direction',()=>{
 for(const pair of [[[auto],[user]],[[user],[auto]]]) assert.equal(model.merge(...pair,defaults)[0].url,newUrl);
});
check('untouched obsolete built-in URL is migrated',()=>assert.equal(model.merge([auto],[],defaults)[0].url,newUrl));
check('manual edit wins even when user chooses an original URL',()=>{
 const manual={...auto,userEdited:true,updatedAt:1};
 assert.equal(model.merge([auto],[manual],defaults)[0].updatedAt,1);
});
check('tombstone wins over stale live record even with a future clock',()=>{
 const deleted={...user,deleted:true,updatedAt:1};
 for(const pair of [[[auto],[deleted]],[[deleted],[auto]]]) assert.equal(model.merge(...pair,defaults)[0].deleted,true);
});
check('new registrations survive a snapshot that does not contain their IDs',()=>{
 const added={id:'new',name:'new',url:newUrl,userEdited:true,updatedAt:2};
 assert.equal(model.merge([added],[user],defaults).length,2);
});
check('latest explicit edit survives old cloud snapshot',()=>{
 const a={...user,userEdited:true,updatedAt:10}, b={...user,userEdited:true,url:'https://example.com/latest',updatedAt:20};
 assert.equal(model.merge([b],[a],defaults)[0].url,b.url);
});
check('slow PC clock cannot make a new user edit older than known server data',()=>{
 const a={...user};model.touch(a,[auto],1);
 assert.ok(Date.parse(a.updatedAt)>Date.parse(auto.updatedAt));assert.equal(a.userEdited,true);assert.equal(a.autoDefault,false);
});
check('same-ID deletion and new-ID re-registration remain distinct',()=>{
 const list=model.merge([{...user,deleted:true}],[{...user,id:'new-id'}],defaults);
 assert.equal(list.filter(x=>!x.deleted).length,1);
});
check('verification ignores Firestore map key order but checks content',()=>{
 assert.equal(model.same([{id:'a',url:'new',deleted:true}],[{deleted:true,url:'new',id:'a'}]),true);
 assert.equal(model.same([{id:'a',url:'new'}],[{id:'a',url:'old'}]),false);
 assert.equal(model.same([{id:'a',deleted:true}],[{id:'a',deleted:false}]),false);
});
const seedCode=app.slice(app.indexOf('function seedShortcuts()'),app.indexOf('const shortcutHref'));
function seedTest(initialized,list){
 const c={shortcutsInitialized:initialized,shortcuts:list,DEFAULT_SHORTCUTS:defaults.slice(0,1),SHORTCUT_FIT:'contain',builtinIconUrl:()=>'',iconForShortcut:()=>'',saveLocalState:()=>{},rememberShortcutInitialization(){c.shortcutsInitialized=true;}};
 vm.createContext(c);vm.runInContext(seedCode+';seedShortcuts();',c);return c;
}
check('intentional empty saved list stays empty',()=>assert.equal(seedTest(true,[]).shortcuts.length,0));
check('existing custom list receives no re-created default',()=>assert.equal(seedTest(false,[{id:'custom'}]).shortcuts.length,1));
check('first-ever seed has zero revision and only runs once',()=>{
 const c=seedTest(false,[]);assert.equal(c.shortcuts[0].updatedAt,0);vm.runInContext('seedShortcuts()',c);assert.equal(c.shortcuts.length,1);
});
check('no startup seeding before the initial server read',()=>{
 assert.ok(!app.slice(app.lastIndexOf('let dashboardDay')).includes('seedShortcuts();'));
 const start=app.slice(app.indexOf('async function startCloudSync()'),app.indexOf('// 인터넷이 끊겼다'));
 assert.ok(start.indexOf("source: 'server'") < start.indexOf('seedShortcuts();'));
 assert.match(start,/cloudReady = false; markPending\(\); return;/);
});
check('automatic icon migration never updates content revision',()=>{
 const icons=app.slice(app.indexOf('function fillDefaultShortcutIcons()'),app.indexOf('function seedShortcuts()'));
 assert.ok(!/touch\(/.test(icons));
});
check('reused popup navigates to a newly edited address',()=>{
 const popup={closed:false,focus(){}};win.open=()=>popup;
 model.open({id:'a',url:'https://example.com/old'});
 model.open({id:'a',url:'https://example.com/new'});
 assert.equal(popup.location,'https://example.com/new');
});
// Exercise the actual save function with transactions and server read failures.
const saveCode=app.slice(app.indexOf('async function saveCloudState('),app.indexOf('async function applyCloudState('));
async function saveTest(mode){
 let document={}; const state={get:async()=>{if(mode==='offline')throw Error('offline');return{data:()=>mode==='stale'?{...document,shortcuts:[auto]}:document};}};
 const c={cloudReady:true,cloudSyncing:false,cloudSaveTimer:null,shortcutChangeVersion:1,shortcutsInitialized:true,shortcuts:[user],knowledge:[],todos:[],memories:[],accountMeta:[],schedule:[],partnerEdits:[],vaultSecrets:{},SHORTCUT_STORE:model,
 window:{HANSOL_FIRESTORE:{doc:()=>state,runTransaction:async fn=>fn({get:async()=>({exists:true,data:()=>({})}),set:(_,value)=>{document=value;if(mode==='edited-during-save')c.shortcutChangeVersion++;}})}},
 firebase:{firestore:{FieldValue:{serverTimestamp:()=>0}}},clearTimeout, setTimeout,console:{error:()=>{}},unlockDeviceVault:async()=>{},mergeById:(a,b)=>a,mergeShortcuts:(a,b)=>model.merge(a,b,defaults),preserveDeletedShortcuts:x=>x,keepMailFields:()=>({}),keepQuickMemoField:()=>({}),resolveWaitingBubbles:()=>{},applyCloudState:async()=>{},setCloudStatus:()=>{},markPending:()=>{c.pending=true;},clearPending:()=>{c.live=true;},queueCloudSave:()=>{c.retry=true;}};
 vm.createContext(c);vm.runInContext(saveCode,c);const result=await c.saveCloudState();return{c,result};
}
(async()=>{
 for(const [mode,expected] of [['ok',true],['offline',false],['stale',false],['edited-during-save',false]]){
  const {c,result}=await saveTest(mode);check('save verification: '+mode,()=>{assert.equal(result.verified,expected);assert.equal(Boolean(c.live),expected);});
 }
 console.log(`${count} checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
