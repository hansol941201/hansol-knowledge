const $ = (s) => document.querySelector(s);
const orb = $('#orb');
const app = $('#app');
const input = $('#input');
const messages = $('#messages');
const chatEmpty = $('#chatEmpty');
const toast = $('#toast');
const overlayMode = new URLSearchParams(location.search).get('overlay') === '1';
if (overlayMode) document.body.classList.add('overlay-mode');

const seed = [
  { id: `seed-시방서문의`, title: '시방서 문의', answer: '심혜진 연구원\n010-9954-7653', aliases: ['시방서', '기술 문의', '공법 자재', '심혜진 번호'] },
  { id: `seed-공사일정`, title: '공사 일정', answer: '한준엽 과장\n010-3355-3458', aliases: ['일정 문의', '공사일정', '한준엽'] },
  { id: `seed-하자보수`, title: '하자 보수', answer: '정정훈 과장\n010-8003-6900', aliases: ['하자 문의', '하자보수', '정정훈'] },
  { id: `seed-스토어`, title: '스토어', answer: '이란 매니저\n1800-8203', aliases: ['자재 구매', '소비자 구매', '스토어 문의'] },
  { id: `seed-폐기물신청`, title: '폐기물 신청', answer: '용인공장\n010-2737-3394', aliases: ['폐기물', '폐기물 처리', '폐기물 과정'] },
  { id: `seed-폐기물비용`, title: '폐기물 비용', answer: '미연님\n번호 확인', aliases: ['폐기물비용', '폐기물 금액', '미연'] },
  { id: `seed-하자접수`, title: '하자 접수', answer: '경미님\n번호 확인', aliases: ['하자접수', '경미'] },
  { id: `seed-미팅일정`, title: '미팅 일정', answer: '재연님\n010-9291-3892', aliases: ['시공사 문의', '미팅일정', '시공사', '재연'] },
  { id: `seed-아파트문의`, title: '아파트 문의', answer: '010-8678-9398', aliases: ['아파트 담당', '아파트 연락처'] },
  { id: `seed-자재문의`, title: '자재 문의', answer: '김미연님', aliases: ['자재 담당', '자재 누구', '자재관련담당'] },
  { id: `seed-컨설팅문의`, title: '컨설팅 문의', answer: '김미연님', aliases: ['컨설팅 담당', '컨설팅 누구', '컨설팅관련담당'] },
  { id: `seed-컨설팅내역서`, title: '컨설팅 내역서', answer: '채명님', aliases: ['컨설팅 내역', '컨설팅 내역서 담당', '내역서 문의', '채명'] },
  { id: `seed-특허료문의`, title: '특허료 문의', answer: '김미연님', aliases: ['특허료 담당', '특허 비용', '특허료 누구'] },
  { id: `seed-노무비문의`, title: '노무비 문의', answer: '김미연님', aliases: ['노무비 담당', '노무 비용', '노무비 누구'] },
  { id: `seed-유지보수수수료문의`, title: '유지보수 수수료 문의', answer: '김미연님', aliases: ['유지보수 담당', '유지보수 수수료', '유지보수 비용'] },
  { id: `seed-대금관련문의`, title: '대금 관련 문의', answer: '김미연님', aliases: ['대금 담당', '대금 문의', '결제 대금', '대금관련담당'] },
  { id: `seed-MSDS공법명발행`, title: 'MSDS 공법명 발행', answer: '공법명만 발행 X\n사용 자재 확인', aliases: ['MSDS', '엠에스디에스', '공법 발행'] },
  { id: `seed-MSDS발행`, title: 'MSDS 발행', answer: '공법 사용 자재 확인\n자재별 MSDS 발행', aliases: ['자재 MSDS', 'MSDS 요청', '엠에스디에스 발행'] },
  { id: `seed-듀얼강화방수`, title: '듀얼강화방수', answer: '슬라브', aliases: ['듀얼 강화 방수', '슬라브 공법'] },
  { id: `seed-평옥상공법`, title: '평옥상 공법', answer: '폴리우레아 / 우레탄 / PVC\n슬라브듀얼', aliases: ['평옥상', '폴리우레아', '우레탄', 'PVC', '피브이씨'] },
  { id: `seed-5도이하시공`, title: '5도 이하 시공', answer: '작업 권장 X\n갈라짐 주의', aliases: ['겨울 시공', '저온 시공', '5도', '수용성 페인트'] },
  { id: `seed-아크릴배면차수`, title: '아크릴 배면차수', answer: '개인시공 X', aliases: ['배면차수', '개인 시공'] },
  { id: `seed-지하주차장에폭시`, title: '지하주차장 에폭시', answer: '컨플럭스\n크리스탈 논파우더', aliases: ['주차장 에폭시', '지하주차장', '에폭시 자재'] },
  { id: `seed-여신거래`, title: '여신 거래', answer: '물품공급계약서', aliases: ['여신거래', '계약서', '물품 공급 계약'] },
  { id: `seed-보증보험`, title: '보증보험', answer: '필수 X\n보증보험 / 증납형태 선택', aliases: ['보증 보험', '증납', '계약 보증'] },
  { id: `seed-남은자재`, title: '남은 자재', answer: '환불 가능 여부 확인', aliases: ['자재 환불', '남은자재', '잔여 자재', '평균 소모량'] },
  { id: `seed-공법비교표`, title: '공법 비교표', answer: '방수 / 재도장 확인\n공정별 비교표 발송', aliases: ['비교표 요청', '공법표', '공사 방법', '시공 방법', '공법 문의'] },
  { id: `seed-발주기본절차`, title: '발주 기본 절차', answer: '소요량 확인\n발주 요청서 작성\n입고일 확인 / 현장 공유', aliases: ['발주', '자재 발주', '발주 방법', '입고 예정일'] },
  { id: `seed-자재공급승인원요청`, title: '자재공급승인원 요청', answer: '공장장님 자재공급승인원 자료 부탁드립니다.\n아파트명(현장):\n주소:\n특허번호:\n확인 부탁드립니다.\n감사합니다.', aliases: ['자재 공급 승인원', '승인원 요청', '공장장 요청 문구'] },
  { id: `seed-승인원문서번호`, title: '승인원 문서번호', answer: '문서번호 / 업체명\n각각 다르게 작성', aliases: ['적기문서번호', '승인원 주의', '업체명 다르게'] },
  { id: `seed-소비자자재구매`, title: '소비자 자재 구매', answer: '스토어 연결\n1800-8203\n공고문 같이 발송', aliases: ['일반 소비자', '자재 문의', '전화 문의', '소비자 안내'] },
  { id: `seed-소규모셀프시공`, title: '소규모 셀프시공', answer: '소장님 연결 가능', aliases: ['셀프 시공', '소규모 시공', '소장 연결'] },
  { id: `seed-특허번호차이`, title: '특허번호 차이', answer: '내용 확인', aliases: ['특허 번호', '특허번호'] }
];

let knowledge = JSON.parse(localStorage.getItem('knowledge-messenger-data') || 'null') || [];
knowledge = knowledge.filter(item => !(item.title === '통신도장' && item.answer === '통신도장'));
let todos = JSON.parse(localStorage.getItem('knowledge-todos') || '[]');
let memories = JSON.parse(localStorage.getItem('knowledge-memories') || '[]');
let accountMeta = JSON.parse(localStorage.getItem('knowledge-account-meta') || '[]');
const partners = Array.isArray(window.PARTNERS) ? window.PARTNERS : [];
let vaultKey = null;
let vaultSecrets = {};
let pendingSecretCopy = null;
let cloudReady = false;
let cloudApplying = false;
let cloudSaveTimer = null;
let cloudSyncing = false;
let syncLoginPending = false;
let pendingCloudSync = localStorage.getItem('knowledge-sync-pending') === '1';
let cloudStatus = 'offline';

// 삭제는 즉시 지우지 않고 표시만 남긴다(다른 기기와 ID 기준으로 병합할 때 되살아나지 않도록).
const alive = (list) => (Array.isArray(list) ? list : []).filter(item => item && !item.deleted);
const stampTime = () => Date.now();
function touch(item) { item.updatedAt = stampTime(); return item; }
function ensureStamps(list) {
  for (const item of Array.isArray(list) ? list : []) {
    if (item && !item.updatedAt) item.updatedAt = 0;
  }
  return list;
}
ensureStamps(knowledge); ensureStamps(todos); ensureStamps(memories); ensureStamps(accountMeta);

// ID 기준 병합 — 같은 ID면 updatedAt이 최신인 쪽을 남기고, 없는 ID는 양쪽 모두 살린다.
function mergeById(mine, theirs) {
  const merged = new Map();
  for (const item of [...(Array.isArray(theirs) ? theirs : []), ...(Array.isArray(mine) ? mine : [])]) {
    if (!item || !item.id) continue;
    const previous = merged.get(item.id);
    if (!previous) { merged.set(item.id, item); continue; }
    merged.set(item.id, Number(item.updatedAt || 0) >= Number(previous.updatedAt || 0) ? item : previous);
  }
  return [...merged.values()];
}
function sortByRecent(list) {
  return list.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
}
const knownTitles = new Set(knowledge.map(item => item.title));
const knownIds = new Set(knowledge.map(item => item.id));
for (const item of seed) {
  if (!knownTitles.has(item.title) && !knownIds.has(item.id)) knowledge.push(item);
}
// 예전 버전이 만든 임의 ID 시드가 남아 있으면 고정 ID 시드와 겹치지 않게 정리한다.
(() => {
  const seen = new Map();
  for (const item of knowledge) {
    const key = `${item.title}\u0000${item.answer}`;
    const previous = seen.get(key);
    if (!previous) { seen.set(key, item); continue; }
    const keep = String(item.id).startsWith('seed-') ? item : previous;
    const drop = keep === item ? previous : item;
    drop.deleted = true;
    seen.set(key, keep);
  }
})();
const save = () => { localStorage.setItem('knowledge-messenger-data', JSON.stringify(knowledge)); queueCloudSave(); };
const saveTodos = () => { localStorage.setItem('knowledge-todos', JSON.stringify(todos)); queueCloudSave(); };
const saveMemories = () => { localStorage.setItem('knowledge-memories', JSON.stringify(memories)); queueCloudSave(); };
const categoryMap = {
  '시방서 문의': '연락처', '공사 일정': '연락처', '하자 보수': '연락처', '스토어': '연락처',
  '폐기물 신청': '연락처', '폐기물 비용': '연락처', '하자 접수': '연락처', '미팅 일정': '연락처', '아파트 문의': '연락처',
  '자재 문의': '연락처', '컨설팅 문의': '연락처', '특허료 문의': '연락처', '노무비 문의': '연락처',
  '컨설팅 내역서': '연락처',
  '유지보수 수수료 문의': '연락처', '대금 관련 문의': '연락처',
  'MSDS 공법명 발행': '공법·자재', 'MSDS 발행': '공법·자재', '듀얼강화방수': '공법·자재',
  '평옥상 공법': '공법·자재', '아크릴 배면차수': '공법·자재', '지하주차장 에폭시': '공법·자재',
  '5도 이하 시공': '시공·계약', '여신 거래': '시공·계약', '보증보험': '시공·계약',
  '남은 자재': '시공·계약', '공법 비교표': '시공·계약',
  '발주 기본 절차': '문구·절차', '자재공급승인원 요청': '문구·절차', '승인원 문서번호': '문구·절차',
  '소비자 자재 구매': '문구·절차', '소규모 셀프시공': '문구·절차', '특허번호 차이': '문구·절차'
};
for (const item of knowledge) item.category = item.category || categoryMap[item.title] || '기타';
for (const item of knowledge) {
  if (['공법·자재', '시공·계약', '문구·절차'].includes(item.category)) item.category = '업무지식';
}
save();

const categoryRules = ['전체', '할 일', '기억', '협력업체', '계정', '연락처', '업무지식', '기타'];
const virtualCategories = ['계정', '협력업체', '할 일', '기억'];
let pageCategory = '전체';
let pageSearchCommitted = '';

function categoryItems(name) {
  if (name === '전체') return alive(knowledge);
  if (virtualCategories.includes(name)) return [];
  return alive(knowledge).filter(item => item.category === name);
}

function renderLibrary() {
  const query = normalize(pageSearchCommitted);
  const items = categoryItems(pageCategory).filter(item => !query || normalize([item.title, item.answer, ...(item.aliases || [])].join(' ')).includes(query));
  const accounts = (pageCategory === '전체' || pageCategory === '계정')
    ? alive(accountMeta).filter(item => !query || normalize(`${item.service} ${item.user} ${item.url || ''}`).includes(query)) : [];
  const partnerItems = (pageCategory === '전체' || pageCategory === '협력업체')
    ? partners.filter(item => !query || normalize(`${item.name} ${item.phone} ${item.email}`).includes(query)) : [];
  const searchAll = pageCategory === '전체';
  const todoItems = (searchAll ? Boolean(query) : pageCategory === '할 일')
    ? sortBySaved(alive(todos).filter(todo => !query || normalize(`${todo.text} ${todo.date || ''} ${savedLabel(todo)} ${todo.done ? '완료' : '미완료진행중'}`).includes(query))) : [];
  const memoryItems = (searchAll ? Boolean(query) : pageCategory === '기억')
    ? sortBySaved(alive(memories).filter(memory => !query || normalize(`${memory.text} ${memory.createdAt || ''} ${savedLabel(memory)}`).includes(query))) : [];
  $('#pageCount').textContent = `${alive(knowledge).length + alive(todos).length + alive(memories).length + alive(accountMeta).length + partners.length}개`;
  $('#pageCategories').innerHTML = categoryRules.filter(name => name !== '기타' || categoryItems('기타').length).map(name => `<button class="${name === pageCategory ? 'active' : ''}" data-category="${name}">${name}</button>`).join('');
  $('#pageGrid').innerHTML = partnerItems.map((item, index) => `
    <article class="page-card partner-card" data-partner-index="${partners.indexOf(item)}">
      <small>협력업체</small><h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.phone || '전화번호 확인')}\n${escapeHtml(item.email || '이메일 확인')}</p>
      <footer><button data-copy-phone>번호 복사</button><button data-copy-email>메일 복사</button><button data-partner-chat>지식창에서 보기</button></footer>
    </article>`).join('') + accounts.map(item => `
    <article class="page-card account-card" data-account-id="${item.id}">
      <small>🔒 계정</small><h3>${escapeHtml(item.service)}</h3>
      <p>${escapeHtml(item.user)}\n<span class="secret-line">••••••••</span></p>
      <footer><button data-copy-id>아이디 복사</button><button data-copy-pw>비번 복사</button><button data-account-delete>삭제</button></footer>
    </article>`).join('') + todoItems.map(todo => `
    <article class="page-card todo-result-card ${todo.done ? 'done' : ''}" data-todo-result="${todo.id}">
      <small>✓ 할 일</small><h3>${escapeHtml(todo.date || '날짜 확인')}</h3>
      <p>${escapeHtml(todo.text)}</p>
      <footer><span class="todo-state ${todo.done ? 'done' : ''}">${todo.done ? '완료' : '진행중'}</span><button data-todo-toggle>${todo.done ? '완료 취소' : '완료 표시'}</button></footer>
    </article>`).join('') + memoryItems.map(memory => `
    <article class="page-card memory-result-card" data-memory-result="${memory.id}">
      <small>📝 기억</small><h3>${escapeHtml(savedLabel(memory))}</h3>
      <p>${escapeHtml(memory.text)}</p>
      <footer><button data-memory-open>기억 저장소에서 보기</button></footer>
    </article>`).join('') + items.map(item => `
    <article class="page-card" data-id="${item.id}">
      <small>${escapeHtml(findCategory(item))}</small>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.answer)}</p>
      <footer><button data-copy>복사</button><button data-edit>수정</button><button data-chat>지식창에서 보기</button><button data-delete>삭제</button></footer>
    </article>`).join('');
  $('#pageEmpty').classList.toggle('hidden', items.length + accounts.length + partnerItems.length + memoryItems.length + todoItems.length !== 0);
  $('#pageCategories').querySelectorAll('[data-category]').forEach(button => button.onclick = () => { pageCategory = button.dataset.category; renderLibrary(); });
  $('#pageGrid').querySelectorAll('.page-card[data-id]').forEach(card => {
    const item = knowledge.find(x => x.id === card.dataset.id);
    card.querySelector('[data-copy]').onclick = () => copyText(item.answer);
    card.querySelector('[data-edit]').onclick = () => openEditor(item);
    card.querySelector('[data-chat]').onclick = () => { openApp(); addBubble(`${item.title}\n${item.answer}`, 'answer', item); };
    card.querySelector('[data-delete]').onclick = () => removeItem(item);
  });
  $('#pageGrid').querySelectorAll('[data-account-id]').forEach(card => {
    const item = accountMeta.find(x => x.id === card.dataset.accountId);
    card.querySelector('[data-copy-id]').onclick = () => copyText(item.user);
    card.querySelector('[data-copy-pw]').onclick = () => requestPasswordCopy(item.id);
    card.querySelector('[data-account-delete]').onclick = () => deleteAccount(item.id);
  });
  $('#pageGrid').querySelectorAll('[data-partner-index]').forEach(card => {
    const item = partners[Number(card.dataset.partnerIndex)];
    card.querySelector('[data-copy-phone]').onclick = () => item.phone ? copyText(item.phone) : showToast('전화번호 확인');
    card.querySelector('[data-copy-email]').onclick = () => item.email ? copyText(item.email) : showToast('이메일 확인');
    card.querySelector('[data-partner-chat]').onclick = () => { openApp(); addPartnerBubble(item); };
  });
  $('#pageGrid').querySelectorAll('[data-todo-result]').forEach(card => {
    const todo = todos.find(x => x.id === card.dataset.todoResult);
    card.querySelector('[data-todo-toggle]').onclick = () => {
      todo.done = !todo.done; touch(todo); saveTodos(); renderTodos(); renderLibrary();
    };
  });
  $('#pageGrid').querySelectorAll('[data-memory-result]').forEach(card => {
    card.querySelector('[data-memory-open]').onclick = () => {
      $('#memorySearch').value = pageSearchCommitted;
      $('#memoryModal').classList.remove('hidden');
      $('#memoryToggle').classList.add('active');
      renderMemories();
    };
  });
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function renderTodos() {
  const list = alive(todos).slice().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return String(b.date || '').localeCompare(String(a.date || '')) || Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
  });
  const remain = list.filter(todo => !todo.done).length;
  $('#todayPanel').innerHTML = `
    <div class="today-head"><div><i></i><b>할 일</b></div><span>${remain}개 남음 · 전체 ${list.length}개</span></div>
    <div class="todo-list">${list.length ? list.map(todo => `
      <label class="todo-item ${todo.done ? 'done' : ''}" data-todo-id="${todo.id}">
        <input type="checkbox" ${todo.done ? 'checked' : ''}>
        <span>${escapeHtml(todo.text)}</span>
        <time>${escapeHtml(todo.date || '날짜 확인')}</time>
        <em class="todo-state ${todo.done ? 'done' : ''}">${todo.done ? '완료' : '진행중'}</em>
        <button type="button" title="삭제">×</button>
      </label>`).join('') : '<div class="todo-empty">지식창에 “할일 내용”을 입력해보세요.</div>'}</div>`;
  $('#todayPanel').querySelectorAll('[data-todo-id]').forEach(row => {
    const todo = todos.find(x => x.id === row.dataset.todoId);
    row.querySelector('input').onchange = e => { todo.done = e.target.checked; touch(todo); saveTodos(); renderTodos(); renderLibrary(); };
    row.querySelector('button').onclick = () => {
      todo.deleted = true; touch(todo); saveTodos(); renderTodos(); renderLibrary();
    };
  });
}

function renderMemories() {
  const query = normalize($('#memorySearch').value || '');
  const filtered = sortBySaved(alive(memories).filter(memory => !query || normalize(`${memory.text} ${memory.createdAt || ''} ${savedLabel(memory)}`).includes(query)));
  $('#memoryCount').textContent = query ? `${filtered.length}개 검색됨` : `${alive(memories).length}개 기록`;
  $('#memoryPanel').innerHTML = `
    <div class="memory-list">${filtered.length ? filtered.map(memory => `
      <article class="memory-item" data-memory-id="${memory.id}"><div><p>${escapeHtml(memory.text)}</p><time>${escapeHtml(savedLabel(memory))}</time></div><button type="button" title="삭제">×</button></article>
    `).join('') : `<div class="todo-empty">${query ? '검색 결과 없음' : '지식창에 “기록 내용”을 입력하면 여기에 따로 모여요.'}</div>`}</div>`;
  $('#memoryPanel').querySelectorAll('[data-memory-id]').forEach(row => {
    row.querySelector('button').onclick = () => {
      const memory = memories.find(x => x.id === row.dataset.memoryId);
      if (!memory) return;
      memory.deleted = true; touch(memory);
      saveMemories(); renderMemories(); renderLibrary();
    };
  });
}

function findCategory(item) {
  return item.category || '기타';
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
renderLibrary();
renderTodos();
renderMemories();
$('#memoryToggle').addEventListener('click', () => {
  $('#memoryModal').classList.remove('hidden');
  $('#memoryToggle').classList.add('active');
  renderMemories();
  setTimeout(() => $('#memorySearch').focus(), 50);
});
function closeMemoryLibrary() { $('#memoryModal').classList.add('hidden'); $('#memoryToggle').classList.remove('active'); }
$('#memoryClose').addEventListener('click', closeMemoryLibrary);
$('#memoryModal').addEventListener('click', event => { if (event.target.id === 'memoryModal') closeMemoryLibrary(); });
$('#memorySearch').addEventListener('input', renderMemories);
$('#pageSearch').addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  pageSearchCommitted = event.currentTarget.value.trim();
  pageCategory = '전체';
  renderLibrary();
});
$('#pageAdd').addEventListener('click', openNewEditor);

let editingId = null;
function openEditor(item) {
  editingId = item.id;
  $('#editHeading').textContent = '지식 수정';
  $('#editSubmit').textContent = '수정 저장';
  $('#editTitle').value = item.title;
  $('#editAnswer').value = item.answer;
  $('#editCategory').value = item.category || '기타';
  $('#editAliases').value = (item.aliases || []).join(', ');
  $('#editModal').classList.remove('hidden');
  setTimeout(() => $('#editTitle').focus(), 50);
}
function openNewEditor() {
  editingId = null;
  $('#editHeading').textContent = '새 지식 추가';
  $('#editSubmit').textContent = '지식 저장';
  $('#editTitle').value = '';
  $('#editAnswer').value = '';
  $('#editCategory').value = '기타';
  $('#editAliases').value = '';
  $('#editModal').classList.remove('hidden');
  setTimeout(() => $('#editTitle').focus(), 50);
}
function closeEditor() {
  editingId = null;
  $('#editModal').classList.add('hidden');
}
$('#editClose').addEventListener('click', closeEditor);
$('#editCancel').addEventListener('click', closeEditor);
$('#editModal').addEventListener('click', e => { if (e.target.id === 'editModal') closeEditor(); });
$('#editForm').addEventListener('submit', e => {
  e.preventDefault();
  const values = {
    title: $('#editTitle').value.trim(), answer: $('#editAnswer').value.trim(),
    category: $('#editCategory').value,
    aliases: $('#editAliases').value.split(',').map(x => x.trim()).filter(Boolean)
  };
  if (editingId) {
    const item = knowledge.find(x => x.id === editingId);
    if (!item) return closeEditor();
    Object.assign(item, values); touch(item);
    showToast('수정됨');
  } else {
    knowledge.unshift(touch({ id: crypto.randomUUID(), ...values }));
    showToast('저장됨');
  }
  save(); renderLibrary(); closeEditor();
});

const enc = new TextEncoder();
const dec = new TextDecoder();
const toB64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));

function keyDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hansol-knowledge-vault', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('keys');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
async function getDeviceKey() {
  const db = await keyDatabase();
  const stored = await new Promise((resolve, reject) => {
    const request = db.transaction('keys').objectStore('keys').get('account-key');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (stored) return stored;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await new Promise((resolve, reject) => {
    const request = db.transaction('keys', 'readwrite').objectStore('keys').put(key, 'account-key');
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
  return key;
}
async function encryptVault(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
  return { iv: toB64(iv), data: toB64(encrypted) };
}
async function decryptVault(payload, key) {
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(payload.iv) }, key, fromB64(payload.data));
  return JSON.parse(dec.decode(decrypted));
}
async function persistVault() {
  localStorage.setItem('knowledge-vault-data', JSON.stringify(await encryptVault(vaultSecrets, vaultKey)));
}
async function unlockDeviceVault() {
  vaultKey = vaultKey || await getDeviceKey();
  const payload = JSON.parse(localStorage.getItem('knowledge-vault-data') || 'null');
  try { vaultSecrets = payload ? await decryptVault(payload, vaultKey) : {}; }
  catch {
    if (accountMeta.length) throw new Error('기존 보관함 잠김');
    vaultSecrets = {};
    await persistVault();
  }
}
async function openVault() {
  await unlockDeviceVault();
  $('#accountService').value = '';
  $('#accountId').value = '';
  $('#accountPassword').value = '';
  $('#vaultModal').classList.remove('hidden');
  setTimeout(() => $('#accountService').focus(), 50);
}
function closeVault() { $('#vaultModal').classList.add('hidden'); pendingSecretCopy = null; }

$('#accountAdd').addEventListener('click', openVault);
$('#vaultClose').addEventListener('click', closeVault);
$('#vaultCancel').addEventListener('click', closeVault);
$('#vaultModal').addEventListener('click', e => { if (e.target.id === 'vaultModal') closeVault(); });
$('#vaultForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await unlockDeviceVault();
    const id = crypto.randomUUID();
    accountMeta.unshift(touch({ id, service: $('#accountService').value.trim(), user: $('#accountId').value.trim() }));
    vaultSecrets[id] = $('#accountPassword').value;
    localStorage.setItem('knowledge-account-meta', JSON.stringify(accountMeta));
    await persistVault(); queueCloudSave(); renderLibrary(); closeVault(); showToast('계정 암호화 저장됨');
  } catch { showToast('계정 저장 확인'); }
});

async function requestPasswordCopy(id) {
  try { await unlockDeviceVault(); copySecret(vaultSecrets[id]); }
  catch { showToast('비밀번호 확인 X'); }
}
async function copySecret(secret) {
  if (typeof secret !== 'string') return showToast('비밀번호 없음');
  await navigator.clipboard.writeText(secret); showToast('비밀번호 복사됨 · 30초');
  setTimeout(async () => {
    try { if (await navigator.clipboard.readText() === secret) await navigator.clipboard.writeText(''); } catch {}
  }, 30000);
}
async function deleteAccount(id) {
  if (!confirm('계정 삭제?')) return;
  const account = accountMeta.find(x => x.id === id);
  if (account) { account.deleted = true; touch(account); }
  localStorage.setItem('knowledge-account-meta', JSON.stringify(accountMeta));
  if (vaultKey) { delete vaultSecrets[id]; await persistVault(); }
  queueCloudSave();
  renderLibrary(); showToast('계정 삭제됨');
}

function openApp() {
  window.knowledgeAPI?.setExpanded(true);
  orb.classList.add('hidden');
  app.classList.remove('hidden');
  if (syncLoginPending) $('#syncModal').classList.remove('hidden');
  setTimeout(() => input.focus(), 120);
}
function collapseApp() {
  if (overlayMode && syncLoginPending) $('#syncModal').classList.add('hidden');
  app.classList.add('hidden');
  orb.classList.remove('hidden');
  window.knowledgeAPI?.setExpanded(false);
}
orb.addEventListener('click', openApp);
$('#collapseBtn').addEventListener('click', collapseApp);
$('#siteShortcut').addEventListener('click', () => {
  const siteUrl = 'https://hansol941201.github.io/hansol-knowledge/';
  if (window.knowledgeAPI?.openSite) window.knowledgeAPI.openSite();
  else window.open(siteUrl, '_blank', 'noopener,noreferrer');
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#memoryModal').classList.contains('hidden')) closeMemoryLibrary();
  else collapseApp();
});

function addBubble(text, type = 'answer', item = null) {
  chatEmpty.classList.add('off');
  const row = document.createElement('div');
  row.className = `row ${type}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  if (item && type === 'answer') {
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.innerHTML = '<button data-copy>복사</button><button data-alias>검색어 추가</button><button data-delete>삭제</button>';
    actions.querySelector('[data-copy]').onclick = () => copyText(item.answer);
    actions.querySelector('[data-alias]').onclick = () => addAlias(item);
    actions.querySelector('[data-delete]').onclick = () => removeItem(item, row);
    bubble.append(actions);
  }
  row.append(bubble);
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function normalize(text) { return text.toLowerCase().replace(/[?!.\s]/g, ''); }
function score(item, query) {
  const q = normalize(query);
  const terms = [item.title, item.answer, ...(item.aliases || [])].map(normalize);
  return terms.reduce((best, term) => term.includes(q) || q.includes(term) ? Math.max(best, Math.min(q.length, term.length)) : best, 0);
}
function findKnowledge(query) {
  return alive(knowledge).map(item => ({ item, points: score(item, query) })).filter(x => x.points > 0).sort((a, b) => b.points - a.points).slice(0, 3).map(x => x.item);
}

function findAccounts(query) {
  const q = normalize(query).replace(/(아이디|비번|비밀번호|계정|로그인)/g, '');
  if (!q) return [];
  return alive(accountMeta).filter(item => normalize(`${item.service} ${item.user}`).includes(q) || q.includes(normalize(item.service))).slice(0, 3);
}

function findPartners(query) {
  const q = normalize(query).replace(/(업체|전화|전화번호|번호|메일|이메일|연락처|담당)/g, '');
  if (q.length < 2) return [];
  return partners.filter(item => normalize(item.name).includes(q) || q.includes(normalize(item.name))).slice(0, 5);
}

function addPartnerBubble(item) {
  chatEmpty.classList.add('off');
  const row = document.createElement('div'); row.className = 'row answer';
  const bubble = document.createElement('div'); bubble.className = 'bubble';
  bubble.textContent = `${item.name}\n${item.phone || '전화번호 확인'}\n${item.email || '이메일 확인'}`;
  const actions = document.createElement('div'); actions.className = 'actions';
  actions.innerHTML = '<button data-phone>번호 복사</button><button data-email>메일 복사</button>';
  actions.querySelector('[data-phone]').onclick = () => item.phone ? copyText(item.phone) : showToast('전화번호 확인');
  actions.querySelector('[data-email]').onclick = () => item.email ? copyText(item.email) : showToast('이메일 확인');
  bubble.append(actions); row.append(bubble); messages.append(row); messages.scrollTop = messages.scrollHeight;
}

function addAccountBubble(item) {
  chatEmpty.classList.add('off');
  const row = document.createElement('div');
  row.className = 'row answer';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = `${item.service}\nID  ${item.user}\nPW  ••••••••`;
  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.innerHTML = '<button data-account-id-copy>아이디 복사</button><button data-account-pw-copy>비번 복사</button>';
  actions.querySelector('[data-account-id-copy]').onclick = () => copyText(item.user);
  actions.querySelector('[data-account-pw-copy]').onclick = () => requestPasswordCopy(item.id);
  bubble.append(actions); row.append(bubble); messages.append(row);
  messages.scrollTop = messages.scrollHeight;
}

function stampLabel(date = new Date()) {
  return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}
// 예전 기록은 "2026.08.25 06:30" 문자열만 갖고 있어 이를 그대로 되살려 쓴다.
function savedDateOf(item) {
  if (!item) return null;
  if (Number.isFinite(item.savedAt)) return new Date(item.savedAt);
  const legacy = String(item.createdAt || '').match(/^(\d{4})\.(\d{2})\.(\d{2})[ T](\d{2}):(\d{2})/);
  if (legacy) return new Date(Number(legacy[1]), Number(legacy[2]) - 1, Number(legacy[3]), Number(legacy[4]), Number(legacy[5]));
  const dayOnly = String(item.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayOnly) return new Date(Number(dayOnly[1]), Number(dayOnly[2]) - 1, Number(dayOnly[3]));
  if (Number.isFinite(item.updatedAt) && item.updatedAt > 0) return new Date(item.updatedAt);
  return null;
}
function savedMillis(item) { const date = savedDateOf(item); return date ? date.getTime() : 0; }
function clockLabel(date) {
  const hour = date.getHours();
  return `${hour < 12 ? '오전' : '오후'} ${hour % 12 === 0 ? 12 : hour % 12}:${String(date.getMinutes()).padStart(2, '0')}`;
}
function dayLabel(date) {
  return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
}
// 오늘 저장한 기록은 "오늘 오후 3:25", 그 외에는 "2026.08.25 오후 3:25".
function savedLabel(item) {
  const date = savedDateOf(item);
  if (!date) return '저장 날짜 확인';
  const day = dayLabel(date);
  return `${day === dayLabel(new Date()) ? '오늘' : day} ${clockLabel(date)}`;
}
function sortBySaved(list) { return list.sort((a, b) => savedMillis(b) - savedMillis(a)); }

function createMemory(text) {
  const now = new Date();
  const memory = touch({ id: crypto.randomUUID(), text: text.trim(), createdAt: stampLabel(now), savedAt: now.getTime() });
  memories.unshift(memory);
  saveMemories(); renderMemories(); renderLibrary();
  return memory;
}
function createTodo(text) {
  const now = new Date();
  const todo = touch({ id: crypto.randomUUID(), text: text.trim(), date: todayKey(), done: false, createdAt: stampLabel(now), savedAt: now.getTime() });
  todos.unshift(todo);
  saveTodos(); renderTodos(); renderLibrary();
  return todo;
}

// 저장은 로컬에 먼저 끝내고, Firebase 업로드 결과를 같은 말풍선에 이어서 알린다.
async function announceSave(kind, body) {
  const label = kind === 'todo' ? '할 일' : '기록';
  const bubble = addBubble(`${label} 저장 중…\n${body}`, 'answer');
  const uploaded = await flushCloudSave();
  bubble.textContent = uploaded
    ? `✓ ${label} 저장 및 연동 완료\n${body}`
    : `✓ ${label} 저장 완료 · 오프라인 보관\n인터넷이 연결되면 자동 업로드\n${body}`;
  showToast(uploaded ? `✓ ${label} 저장 및 연동 완료` : `${label} 저장됨 · 업로드 대기`);
  messages.scrollTop = messages.scrollHeight;
}

// 팝업 명령어 — “할일/할 일 …”은 할 일 목록, “기록/기억 …”은 기억 저장소로 보낸다.
const TODO_COMMAND = /^(?:할\s*일|todo)[\s.,:·\-]*(.+)$/i;
const MEMORY_COMMAND = /^(?:기록|기억|메모)[\s.,:·\-]*(.+)$/i;
const MEMORY_LIST_COMMAND = /^(?:기록|기억|메모)[\s.,:·\-]*$/;
const TODO_LIST_COMMAND = /^(?:할\s*일|todo)[\s.,:·\-]*$/i;

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addBubble(text, 'mine');
  input.value = '';
  handleComposerText(text);
});

function handleComposerText(text) {
  if (MEMORY_LIST_COMMAND.test(text)) {
    const list = sortBySaved(alive(memories));
    if (!list.length) addBubble('기억 저장소 비어 있음\n“기록 내용”으로 저장하세요', 'answer');
    else list.slice(0, 8).forEach(memory => addBubble(`기억\n${memory.text}\n${savedLabel(memory)}`, 'answer'));
    return;
  }
  if (TODO_LIST_COMMAND.test(text)) {
    const list = alive(todos);
    if (!list.length) addBubble('할 일 없음\n“할일 내용”으로 저장하세요', 'answer');
    else list.slice(0, 8).forEach(todo => addBubble(`✓ 할 일\n${todo.text}\n${todo.date || '날짜 확인'} · ${todo.done ? '완료' : '진행중'}`, 'answer'));
    return;
  }
  const todoMatch = text.match(TODO_COMMAND);
  if (todoMatch?.[1]?.trim()) {
    const todo = createTodo(todoMatch[1]);
    announceSave('todo', `${todo.text}\n${todo.date} · 진행중`);
    return;
  }
  const memoryMatch = text.match(MEMORY_COMMAND);
  if (memoryMatch?.[1]?.trim()) {
    const memory = createMemory(memoryMatch[1]);
    announceSave('memory', `${memory.text}\n${savedLabel(memory)}`);
    return;
  }
  const partnerMatches = findPartners(text);
  if (partnerMatches.length) {
    partnerMatches.forEach(addPartnerBubble);
    return;
  }
  const accountMatches = findAccounts(text);
  if (accountMatches.length) {
    accountMatches.forEach(addAccountBubble);
    return;
  }
  const matches = findKnowledge(text);
  const normalizedQuery = normalize(text);
  const todoMatches = alive(todos).filter(todo => normalize(`${todo.text} ${todo.date || ''}`).includes(normalizedQuery));
  const memoryMatches = alive(memories).filter(memory => normalize(`${memory.text} ${memory.createdAt || ''}`).includes(normalizedQuery));
  matches.forEach(item => addBubble(`${item.title}\n${item.answer}`, 'answer', item));
  todoMatches.forEach(todo => addBubble(`✓ 할 일\n${todo.text}\n${todo.date || '날짜 확인'} · ${todo.done ? '완료' : '진행중'}`, 'answer'));
  memoryMatches.forEach(memory => addBubble(`기억\n${memory.text}\n${savedLabel(memory)}`, 'answer'));
  // 명령어도 아니고 찾은 것도 없는 일반 문장은 기억 저장소로 자동 저장한다.
  if (!matches.length && !todoMatches.length && !memoryMatches.length) {
    const memory = createMemory(text);
    announceSave('memory', `${memory.text}\n${savedLabel(memory)}`);
  }
}

function parseKnowledge(text) {
  const parts = text.split(/\s*=\s*/);
  if (parts.length > 1) return { id: crypto.randomUUID(), title: parts[0], answer: parts.slice(1).join(' = ').replace(/\s*\/\s*/g, '\n'), aliases: [], category: '기타' };
  const phone = text.match(/(?:0\d{1,2}-\d{3,4}-\d{4}|\d{4}-\d{4})/);
  if (phone) {
    const before = text.replace(phone[0], '').replace(/(?:은|는|이|가)\s*$/, '').trim();
    return { id: crypto.randomUUID(), title: before, answer: phone[0], aliases: [], category: '연락처' };
  }
  return { id: crypto.randomUUID(), title: text, answer: text, aliases: [], category: '기타' };
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  showToast('복사됨');
}
function addAlias(item) {
  const alias = prompt('추가할 검색어');
  if (!alias?.trim()) return;
  item.aliases = [...(item.aliases || []), alias.trim()]; touch(item);
  save();
  showToast('검색어 추가됨');
}
function removeItem(item, row = null) {
  if (!confirm(`「${item.title}」 삭제?`)) return;
  item.deleted = true; touch(item);
  save(); if (row) row.remove(); renderLibrary(); showToast('삭제됨');
}
function showToast(text) {
  toast.textContent = text; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 900);
}

$('#importBtn').addEventListener('click', () => {
  $('#quickAdd').classList.toggle('hidden');
  if (!$('#quickAdd').classList.contains('hidden')) setTimeout(() => $('#quickTitle').focus(), 30);
});
$('#quickClose').addEventListener('click', () => $('#quickAdd').classList.add('hidden'));
$('#quickAdd').addEventListener('submit', e => {
  e.preventDefault();
  const item = {
    id: crypto.randomUUID(), title: $('#quickTitle').value.trim(), answer: $('#quickAnswer').value.trim(),
    category: $('#quickCategory').value, aliases: []
  };
  knowledge.unshift(touch(item)); save(); renderLibrary();
  $('#quickTitle').value = ''; $('#quickAnswer').value = '';
  $('#quickAdd').classList.add('hidden');
  addBubble(`✓ 저장\n${item.title}\n${item.answer}`, 'answer', item);
});
$('#fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const incoming = JSON.parse(await file.text());
    if (!Array.isArray(incoming)) throw new Error();
    const existing = new Set(alive(knowledge).map(x => normalize(x.title)));
    const fresh = incoming.filter(x => x.title && x.answer && !existing.has(normalize(x.title))).map(x => touch({ id: crypto.randomUUID(), aliases: [], ...x }));
    knowledge = [...fresh, ...knowledge]; save(); renderLibrary();
    addBubble(`가져오기 완료\n${fresh.length}개 추가`, 'answer');
  } catch { addBubble('가져오기 X\nJSON 형식 확인', 'answer'); }
  e.target.value = '';
});

if (window.knowledgeAPI) {
  window.knowledgeAPI.onToggle(() => app.classList.contains('hidden') ? openApp() : collapseApp());
}

function setCloudStatus(status) {
  cloudStatus = status;
  const badge = $('#syncState');
  if (!badge) return;
  const labels = {
    live: '실시간 연동 중',
    syncing: '연동 중…',
    pending: '오프라인 보관 · 재연결 시 자동 업로드',
    offline: '오프라인 저장 모드'
  };
  badge.textContent = labels[status] || labels.offline;
  badge.dataset.state = status;
}

function markPending() {
  pendingCloudSync = true;
  localStorage.setItem('knowledge-sync-pending', '1');
  setCloudStatus('pending');
}
function clearPending() {
  pendingCloudSync = false;
  localStorage.removeItem('knowledge-sync-pending');
  setCloudStatus('live');
}

function saveLocalSnapshot() {
  localStorage.setItem('knowledge-messenger-data', JSON.stringify(knowledge));
  localStorage.setItem('knowledge-todos', JSON.stringify(todos));
  localStorage.setItem('knowledge-memories', JSON.stringify(memories));
  localStorage.setItem('knowledge-account-meta', JSON.stringify(accountMeta));
}

function queueCloudSave() {
  if (cloudApplying) return;
  if (!cloudReady || !window.HANSOL_FIRESTORE) { markPending(); return; }
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => { flushCloudSave(); }, 350);
}

// 업로드는 항상 트랜잭션 안에서 원격 문서를 다시 읽어 ID 기준으로 병합한다(덮어쓰기 금지).
async function flushCloudSave() {
  clearTimeout(cloudSaveTimer);
  if (!cloudReady || !window.HANSOL_FIRESTORE) { markPending(); return false; }
  while (cloudSyncing) await new Promise(resolve => setTimeout(resolve, 60));
  cloudSyncing = true;
  setCloudStatus('syncing');
  try {
    await unlockDeviceVault();
    const stateDoc = window.HANSOL_FIRESTORE.doc('shared/state');
    const merged = await window.HANSOL_FIRESTORE.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(stateDoc);
      const remote = snapshot.exists ? (snapshot.data() || {}) : {};
      const next = {
        knowledge: mergeById(knowledge, remote.knowledge),
        todos: mergeById(todos, remote.todos),
        memories: mergeById(memories, remote.memories),
        accountMeta: mergeById(accountMeta, remote.accountMeta),
        vaultSecrets: { ...(remote.vaultSecrets || {}), ...vaultSecrets }
      };
      transaction.set(stateDoc, { ...next, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      return next;
    });
    cloudSyncing = false;
    await applyCloudState(merged);
    clearPending();
    return true;
  } catch (error) {
    console.error('Firebase 저장 실패', error);
    markPending();
    return false;
  } finally {
    cloudSyncing = false;
  }
}

async function applyCloudState(state) {
  if (!state) return;
  cloudApplying = true;
  knowledge = mergeById(knowledge, state.knowledge);
  todos = mergeById(todos, state.todos);
  memories = mergeById(memories, state.memories);
  accountMeta = mergeById(accountMeta, state.accountMeta);
  const remoteSecrets = state.vaultSecrets && typeof state.vaultSecrets === 'object' ? state.vaultSecrets : {};
  vaultSecrets = { ...remoteSecrets, ...vaultSecrets };
  for (const account of accountMeta) if (account.deleted) delete vaultSecrets[account.id];
  saveLocalSnapshot();
  try {
    vaultKey = vaultKey || await getDeviceKey();
    await persistVault();
  } catch (error) { console.error('로컬 계정 보관 실패', error); }
  renderLibrary();
  renderTodos();
  renderMemories();
  cloudApplying = false;
}

async function startCloudSync() {
  if (!window.HANSOL_FIRESTORE) { setCloudStatus('offline'); return showToast('오프라인 저장 모드'); }
  const stateDoc = window.HANSOL_FIRESTORE.doc('shared/state');
  cloudReady = true;
  try {
    const first = await stateDoc.get();
    if (first.exists) await applyCloudState(first.data());
  } catch (error) { console.error('Firebase 최초 읽기 실패', error); }
  await flushCloudSave();
  stateDoc.onSnapshot(snapshot => {
    if (!snapshot.exists || snapshot.metadata.hasPendingWrites) return;
    applyCloudState(snapshot.data());
  }, error => { console.error('Firebase 실시간 동기화 실패', error); markPending(); });
}

// 인터넷이 끊겼다 다시 붙으면 로컬에 쌓인 변경을 자동으로 올린다.
function retryPendingSync() {
  if (!pendingCloudSync) return;
  if (navigator.onLine === false) return;
  if (!cloudReady) {
    if (window.HANSOL_AUTH && window.HANSOL_AUTH.currentUser) startCloudSync();
    return;
  }
  flushCloudSave();
}
window.addEventListener('online', retryPendingSync);
setInterval(retryPendingSync, 15000);

async function signInForSync(pin) {
  const normalizedPin = String(pin || '').trim();
  if (normalizedPin.length < 6) throw new Error('PIN 형식 확인');
  await window.HANSOL_AUTH.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  await window.HANSOL_AUTH.signInWithEmailAndPassword('hansol.sync@local.invalid', normalizedPin);
  localStorage.setItem('knowledge-sync-pin', normalizedPin);
  syncLoginPending = false;
  $('#syncModal').classList.add('hidden');
  await startCloudSync();
}

async function initCloudAuth() {
  setCloudStatus(pendingCloudSync ? 'pending' : 'offline');
  if (!window.HANSOL_AUTH || !window.HANSOL_FIRESTORE) { setCloudStatus('offline'); return showToast('오프라인 저장 모드'); }
  await new Promise(resolve => {
    const stop = window.HANSOL_AUTH.onAuthStateChanged(user => { stop(); resolve(user); });
  });
  if (window.HANSOL_AUTH.currentUser) return startCloudSync();
  const savedPin = localStorage.getItem('knowledge-sync-pin');
  if (savedPin) {
    try { return await signInForSync(savedPin); }
    catch { localStorage.removeItem('knowledge-sync-pin'); }
  }
  syncLoginPending = true;
  if (!overlayMode || !app.classList.contains('hidden')) $('#syncModal').classList.remove('hidden');
}

$('#syncForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  $('#syncError').textContent = '';
  try { await signInForSync($('#syncPin').value); }
  catch { $('#syncError').textContent = 'PIN 확인 X'; }
  finally { button.disabled = false; }
});

initCloudAuth();
