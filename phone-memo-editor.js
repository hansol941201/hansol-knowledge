/* Phone notes: standalone editor; no changes to existing memo/CRM data */
(function(){
 'use strict';
 const DRAFT='hansol-phone-memo-draft-v1', RECORDS='hansol-phone-memo-records-v1';
 const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
 const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=d=>new Date(d).toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
 function mount(){
  const panel=document.getElementById('callNotesPanel');
  if(!panel || panel.querySelector('#phoneMemoText'))return;
  panel.innerHTML=`<header class="phone-editor-header"><span class="phone-editor-icon" aria-hidden="true">☎</span><h2>전화메모</h2><button type="button" id="phoneMemoShowHistory" class="phone-editor-history">기록 보기</button></header>
  <p class="phone-editor-help">통화 내용과 중요한 사항을 기록하세요.</p>
  <label class="phone-editor-label" for="phoneMemoContact">업체명 · 연락처 (선택)</label>
  <input id="phoneMemoContact" class="phone-editor-contact" autocomplete="off" placeholder="예: ○○건설 / 담당자 / 전화번호" />
  <label class="phone-editor-label" for="phoneMemoText">통화 내용</label>
  <textarea id="phoneMemoText" class="phone-editor-textarea" rows="10" placeholder="통화 내용을 자유롭게 입력하세요.&#10;Enter를 누르면 다음 줄에 이어서 작성됩니다."></textarea>
  <footer class="phone-editor-footer"><span id="phoneMemoStatus" role="status">작성 중 자동 임시저장</span><button type="button" id="phoneMemoSave" class="phone-editor-save">전화메모 저장</button></footer>
  <div id="phoneMemoHistory" class="phone-editor-records hidden" aria-label="저장된 전화메모"></div>`;
  const contact=panel.querySelector('#phoneMemoContact'),area=panel.querySelector('#phoneMemoText'),status=panel.querySelector('#phoneMemoStatus'),history=panel.querySelector('#phoneMemoHistory');
  const draft=read(DRAFT,{}); contact.value=draft.contact||'';area.value=draft.text||'';
  const stash=()=>{write(DRAFT,{contact:contact.value,text:area.value});status.textContent='임시저장됨'};
  contact.addEventListener('input',stash);area.addEventListener('input',stash);
  // Enter remains a native newline; Ctrl/Command + Enter saves explicitly.
  area.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();save();}});
  function paint(){
   const records=read(RECORDS,[]);
   history.innerHTML=records.length?records.map(x=>`<article class="phone-editor-record"><header><strong>${clean(x.contact||'전화메모')}</strong><time>${clean(date(x.created))}</time><button type="button" data-phone-delete="${clean(x.id)}" aria-label="기록 삭제">삭제</button></header><p>${clean(x.text)}</p></article>`).join(''):'<p class="phone-editor-empty">아직 저장한 전화메모가 없습니다.</p>';
   history.querySelectorAll('[data-phone-delete]').forEach(b=>b.onclick=()=>{const list=read(RECORDS,[]).filter(x=>x.id!==b.dataset.phoneDelete);if(write(RECORDS,list))paint();});
  }
  function save(){
   if(!area.value.trim()){status.textContent='통화 내용을 입력하세요';area.focus();return;}
   const records=read(RECORDS,[]);
   records.unshift({id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),contact:contact.value.trim(),text:area.value,created:Date.now()});
   if(!write(RECORDS,records)){status.textContent='저장 실패: 브라우저 저장공간을 확인하세요';return;}
   area.value='';contact.value='';write(DRAFT,{contact:'',text:''});status.textContent='저장 완료 · 이 브라우저에 보관됨';paint();
  }
  panel.querySelector('#phoneMemoSave').addEventListener('click',save);
  panel.querySelector('#phoneMemoShowHistory').addEventListener('click',()=>{history.classList.toggle('hidden');paint();});
  paint();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
