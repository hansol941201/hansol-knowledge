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
const patents = Array.isArray(window.PATENTS) ? window.PATENTS : [];
let vaultKey = null;
let vaultSecrets = {};
let pendingSecretCopy = null;
let cloudReady = false;
let cloudApplying = false;
let cloudSaveTimer = null;
let cloudSyncing = false;
let syncLoginPending = false;
let syncPromptDismissed = false;
let pendingCloudSync = localStorage.getItem('knowledge-sync-pending') === '1';
let cloudStatus = 'offline';

// 삭제는 즉시 지우지 않고 표시만 남긴다(다른 기기와 ID 기준으로 병합할 때 되살아나지 않도록).
const alive = (list) => (Array.isArray(list) ? list : []).filter(item => item && !item.deleted);
const nowIso = () => new Date().toISOString();
// updatedAt 은 버전에 따라 숫자(ms) · ISO · "2026.08.25 06:30" 이 섞여 있어 전부 읽는다.
function timeOf(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value);
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return parsed;
  const legacy = text.match(/^(\d{4})\.(\d{2})\.(\d{2})[ T](\d{2}):(\d{2})/);
  if (legacy) return new Date(Number(legacy[1]), Number(legacy[2]) - 1, Number(legacy[3]), Number(legacy[4]), Number(legacy[5])).getTime();
  return 0;
}
function updatedTime(item) {
  if (!item) return 0;
  return timeOf(item.updatedAt) || timeOf(item.savedAt) || timeOf(item.createdAt);
}
function touch(item) { item.updatedAt = nowIso(); return item; }
function ensureStamps(list) {
  for (const item of Array.isArray(list) ? list : []) {
    if (item && !item.updatedAt) item.updatedAt = item.savedAt || item.createdAt || 0;
  }
  return list;
}
ensureStamps(knowledge); ensureStamps(todos); ensureStamps(memories); ensureStamps(accountMeta);

// 배열마다 자기 종류만 남긴다. 예전 버전이 기억을 todos 에 넣어 둔 경우처럼
// 잘못 들어간 항목은 화면에서 숨기는 게 아니라 제 배열로 옮겨서 실제로 분리한다.
function sortIntoCollections() {
  const buckets = { todo: [], memory: [], knowledge: [] };
  const keep = { todos: [], memories: [], knowledge: [] };
  const claim = (list, own, target) => {
    for (const item of Array.isArray(list) ? list : []) {
      if (!item) continue;
      if (item.type && item.type !== own && buckets[item.type]) buckets[item.type].push(item);
      else target.push(item);
    }
  };
  claim(todos, 'todo', keep.todos);
  claim(memories, 'memory', keep.memories);
  claim(knowledge, 'knowledge', keep.knowledge);
  todos = mergeById(keep.todos, buckets.todo);
  memories = mergeById(keep.memories, buckets.memory);
  knowledge = mergeById(keep.knowledge, buckets.knowledge);
}

// ID 기준 병합 — 같은 ID면 updatedAt이 최신인 쪽을 남기고, 없는 ID는 양쪽 모두 살린다.
function mergeById(mine, theirs) {
  const merged = new Map();
  for (const item of [...(Array.isArray(theirs) ? theirs : []), ...(Array.isArray(mine) ? mine : [])]) {
    if (!item || !item.id) continue;
    const previous = merged.get(item.id);
    if (!previous) { merged.set(item.id, item); continue; }
    merged.set(item.id, updatedTime(item) >= updatedTime(previous) ? item : previous);
  }
  return [...merged.values()];
}
function sortByRecent(list) {
  return list.sort((a, b) => updatedTime(b) - updatedTime(a));
}
// 구버전 클라이언트는 문서를 통째로 덮어써서 서버에 있던 다른 기기 자료를 지운다.
// 내가 갖고 있는데 서버에는 없는 항목이 있으면 그 자리에서 다시 올려 복구한다.
function hasLocalOnlyItems(mine, theirs) {
  const remoteIds = new Set((Array.isArray(theirs) ? theirs : []).map(item => item && item.id));
  return (Array.isArray(mine) ? mine : []).some(item => item && item.id && !remoteIds.has(item.id));
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
const save = () => { saveLocalState(); queueCloudSave(); };
const saveTodos = save;
const saveMemories = save;
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

const categoryRules = ['전체', '할 일', '기억', '특허', '협력업체', '계정', '연락처', '업무지식', '기타'];
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
  const patentTerm = pageSearchCommitted.trim();
  const patentItems = pageCategory === '특허'
    ? (patentTerm ? findPatents(patentTerm, patents.length) : patents)
    : (query ? findPatents(patentTerm, 5) : []);
  const todoItems = (searchAll ? Boolean(query) : pageCategory === '할 일')
    ? sortBySaved(alive(todos).filter(todo => !query || normalize(`${todo.text} ${todo.date || ''} ${savedLabel(todo)} ${todo.done ? '완료' : '미완료진행중'}`).includes(query))) : [];
  const memoryItems = (searchAll ? Boolean(query) : pageCategory === '기억')
    ? sortBySaved(alive(memories).filter(memory => !query || normalize(`${memory.text} ${memory.createdAt || ''} ${savedLabel(memory)}`).includes(query))) : [];
  $('#pageCount').textContent = `${alive(knowledge).length + alive(todos).length + alive(memories).length + alive(accountMeta).length + partners.length + patents.length}개`;
  $('#pageCategories').innerHTML = categoryRules.filter(name => name !== '기타' || categoryItems('기타').length).map(name => `<button class="${name === pageCategory ? 'active' : ''}" data-category="${name}">${name}</button>`).join('');
  const term = pageSearchCommitted.trim();
  const mark = (text) => highlight(text, term);
  $('#pageGrid').innerHTML = patentItems.map(item => `
    <article class="page-card patent-card" data-patent-key="${escapeHtml(item.num || item.name)}">
      <small class="card-kind">📐 ${escapeHtml(item.kind)}</small>
      <h3>${mark(item.num || '번호 부여 전')}</h3>
      ${(item.gongjong || []).length
        ? `<div class="patent-tags">${item.gongjong.map(tag => `<span>${mark(tag)}</span>`).join('')}</div>`
        : ''}
      <p>${mark(item.name)}</p>
      <dl class="patent-meta">
        ${item.gongbeop ? `<div><dt>공법</dt><dd>${mark(item.gongbeop)}</dd></div>` : ''}
        ${item.owner ? `<div><dt>특허권자</dt><dd>${mark(item.owner)}</dd></div>` : ''}
        ${patentStatusNote(item) ? `<div><dt>상태</dt><dd>${escapeHtml(patentStatusNote(item))}</dd></div>` : ''}
      </dl>
      <footer><button data-patent-copy>특허번호 복사</button><button data-patent-chat>지식창에서 보기</button></footer>
    </article>`).join('') + partnerItems.map((item, index) => `
    <article class="page-card partner-card" data-partner-index="${partners.indexOf(item)}">
      <small>협력업체</small><h3>${mark(item.name)}</h3>
      <p>${mark(item.phone || '전화번호 확인')}\n${mark(item.email || '이메일 확인')}</p>
      ${partnerRecordsHtml(item.name, term)}
      <footer><button data-copy-phone>번호 복사</button><button data-copy-email>메일 복사</button><button data-partner-chat>지식창에서 보기</button></footer>
    </article>`).join('') + accounts.map(item => `
    <article class="page-card account-card" data-account-id="${item.id}">
      <small>🔒 계정</small><h3>${mark(item.service)}</h3>
      <p>${mark(item.user)}\n<span class="secret-line">••••••••</span></p>
      <footer><button data-copy-id>아이디 복사</button><button data-copy-pw>비번 복사</button><button data-account-delete>삭제</button></footer>
    </article>`).join('') + todoItems.map(todo => `
    <article class="page-card todo-result-card ${todo.done ? 'done' : ''}" data-todo-result="${todo.id}">
      <small class="card-kind">✓ 할 일</small>
      <p>${mark(todo.text)}</p>
      <time class="card-time">${escapeHtml(todo.date || '날짜 확인')}</time>
      <footer><span class="todo-state ${todo.done ? 'done' : ''}">${todo.done ? '완료' : '진행중'}</span><button data-todo-toggle>${todo.done ? '완료 취소' : '완료 표시'}</button></footer>
    </article>`).join('') + memoryItems.map(memory => `
    <article class="page-card memory-result-card" data-memory-result="${memory.id}">
      <small class="card-kind">📝 기억</small>
      <p>${mark(memory.text)}</p>
      <time class="card-time">${escapeHtml(savedLabel(memory))}</time>
      <footer><button data-memory-open>기억 저장소에서 보기</button></footer>
    </article>`).join('') + items.map(item => `
    <article class="page-card" data-id="${item.id}">
      <small>${escapeHtml(findCategory(item))}</small>
      <h3>${mark(item.title)}</h3>
      <p>${mark(item.answer)}</p>
      <footer><button data-copy>복사</button><button data-edit>수정</button><button data-chat>지식창에서 보기</button><button data-delete>삭제</button></footer>
    </article>`).join('');
  // ── 3) 검색 중에는 상단 할 일 목록을 숨긴다
  $('#todayPanel').classList.toggle('hidden', Boolean(term));
  $('#pageEmpty').classList.toggle('hidden', items.length + accounts.length + partnerItems.length + memoryItems.length + todoItems.length + patentItems.length !== 0);
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
  $('#pageGrid').querySelectorAll('[data-patent-key]').forEach(card => {
    const item = patentItems.find(x => (x.num || x.name) === card.dataset.patentKey);
    if (!item) return;
    card.querySelector('[data-patent-copy]').onclick = () =>
      item.num ? copyText(item.num) : showToast('아직 번호가 부여되지 않았습니다');
    card.querySelector('[data-patent-chat]').onclick = () => { openApp(); addPatentBubble(item); };
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
const isTodoEntry = (item) => Boolean(item) && (!item.type || item.type === 'todo');
function renderTodos() {
  const list = alive(todos).filter(isTodoEntry).slice().sort((a, b) => {
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
      <article class="memory-item" data-memory-id="${memory.id}"><div><p>${highlight(memory.text, ($('#memorySearch').value || '').trim())}</p><time>${escapeHtml(savedLabel(memory))}</time></div><button type="button" title="삭제">×</button></article>
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

// 협력업체 고객카드에 붙는 관련 할 일·기억. 업체명(㈜ 등 접두어 제외)이 들어간 기록을 모은다.
function partnerKey(name) {
  return normalize(String(name || '').replace(/㈜|\(주\)|주식회사/g, ''));
}
function partnerRecords(name) {
  const key = partnerKey(name);
  if (key.length < 2) return { todos: [], memories: [] };
  return {
    todos: sortBySaved(alive(todos).filter(todo => normalize(todo.text).includes(key))),
    memories: sortBySaved(alive(memories).filter(memory => normalize(memory.text).includes(key)))
  };
}
function partnerRecordsHtml(name, term = '') {
  const { todos: todoHits, memories: memoryHits } = partnerRecords(name);
  const total = todoHits.length + memoryHits.length;
  if (!total) return '';
  return `<div class="partner-records"><b>관련 기록 ${total}건</b>`
    + todoHits.map(todo => `<div class="partner-record"><span>✓ 할 일</span><p>${highlight(todo.text, term)}</p><time>${escapeHtml(todo.date || '')} · ${todo.done ? '완료' : '진행중'}</time></div>`).join('')
    + memoryHits.map(memory => `<div class="partner-record"><span>📝 기억</span><p>${highlight(memory.text, term)}</p><time>${escapeHtml(savedLabel(memory))}</time></div>`).join('')
    + '</div>';
}

function findCategory(item) {
  return item.category || '기타';
}

// 검색어와 글자 그대로 일치하는 부분을 전부 <mark> 로 감싼다(대소문자 무시).
function highlight(text, query) {
  const raw = String(text === undefined || text === null ? '' : text);
  const needle = String(query || '').trim();
  if (!needle) return escapeHtml(raw);
  const haystack = raw.toLowerCase();
  const target = needle.toLowerCase();
  let out = '';
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(target, from);
    if (at === -1) break;
    out += escapeHtml(raw.slice(from, at)) + `<mark>${escapeHtml(raw.slice(at, at + needle.length))}</mark>`;
    from = at + needle.length;
  }
  return out + escapeHtml(raw.slice(from));
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

// ── 자료 초기화 ────────────────────────────────────────────────
function resetCounts() {
  return { knowledge: alive(knowledge).length, todos: alive(todos).length, memories: alive(memories).length, accounts: alive(accountMeta).length };
}
function openResetModal() {
  const count = resetCounts();
  $('#resetCount').textContent = `지식 ${count.knowledge}개 · 할 일 ${count.todos}개 · 기억 ${count.memories}개 · 계정 ${count.accounts}개`;
  $('#resetConfirm').value = '';
  $('#resetAll').disabled = true;
  $('#resetModal').classList.remove('hidden');
}
function closeResetModal() { $('#resetModal').classList.add('hidden'); }
$('#resetOpen').addEventListener('click', openResetModal);
$('#resetClose').addEventListener('click', closeResetModal);
$('#resetModal').addEventListener('click', event => { if (event.target.id === 'resetModal') closeResetModal(); });
$('#resetConfirm').addEventListener('input', event => { $('#resetAll').disabled = event.currentTarget.value.trim() !== '삭제'; });

$('#resetBackup').addEventListener('click', () => {
  const backup = JSON.stringify({ savedAt: nowIso(), knowledge, todos, memories, accountMeta }, null, 2);
  const url = URL.createObjectURL(new Blob([backup], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `hansol-knowledge-backup-${todayKey()}.json`;
  document.body.append(link);
  link.click();
  // 링크를 바로 지우면 파일 이름이 붙지 않는 브라우저가 있어 한 박자 뒤에 정리한다.
  setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 2000);
  showToast('백업 내려받음');
});

// 이 컴퓨터 사본만 지운다. 클라우드 자료는 그대로라 새로고침하면 다시 내려온다.
$('#resetLocal').addEventListener('click', () => {
  if (!confirm('이 컴퓨터에 저장된 사본을 지웁니다.\n클라우드 자료는 그대로 남고, 다시 내려받습니다.\n진행할까요?')) return;
  ['knowledge-messenger-data', 'knowledge-todos', 'knowledge-memories', 'knowledge-account-meta',
   'knowledge-vault-data', 'knowledge-sync-pending'].forEach(key => localStorage.removeItem(key));
  location.reload();
});

// 전체 삭제는 문서를 비우는 게 아니라 삭제 표시를 남긴다.
// 그냥 비우면 다른 기기가 갖고 있던 사본을 다시 올려서 되살아난다.
$('#resetAll').addEventListener('click', async () => {
  if ($('#resetConfirm').value.trim() !== '삭제') return;
  if (!confirm('지식·할 일·기억·계정을 모두 삭제합니다.\n다른 컴퓨터에서도 사라집니다.\n정말 진행할까요?')) return;
  $('#resetAll').disabled = true;
  $('#resetAll').textContent = '삭제 중…';
  for (const list of [knowledge, todos, memories, accountMeta]) {
    for (const item of list) { item.deleted = true; touch(item); }
  }
  vaultSecrets = {};
  saveLocalState();
  renderAll();
  const result = await saveCloudState();
  $('#resetAll').textContent = '전체 삭제';
  closeResetModal();
  showToast(result.verified || result.ok ? '전체 삭제 완료' : '이 컴퓨터에서 삭제됨 · 클라우드 연동 대기 중');
});

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
    createKnowledge(values.title, values.answer, { category: values.category, aliases: values.aliases });
    showToast('저장됨');
  }
  save(); renderAll(); closeEditor();
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
    accountMeta.unshift(newEntry({ id, service: $('#accountService').value.trim(), user: $('#accountId').value.trim() }));
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
  if (syncLoginPending && !syncPromptDismissed) $('#syncModal').classList.remove('hidden');
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
  if (!$('#resetModal').classList.contains('hidden')) closeResetModal();
  else if (!$('#syncModal').classList.contains('hidden')) closeSyncModal();
  else if (!$('#memoryModal').classList.contains('hidden')) closeMemoryLibrary();
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

// 특허번호는 "제 10-2119347호" · "10-2119347" · "2119347" 이 모두 같은 번호다.
function patentDigits(text) { return String(text || '').replace(/[^0-9]/g, ''); }

function patentText(item) {
  return [item.num, item.name, item.gongbeop, item.owner, item.inventor, item.appNum,
    ...(item.gongjong || [])].join(' ');
}

function findPatents(query, limit = 5) {
  const raw = String(query || '').trim();
  if (!raw) return [];
  const digits = patentDigits(raw);
  // 번호로 찾을 때는 네 자리 이상이어야 한다(“10” 이 전부를 물고 오지 않도록).
  if (digits.length >= 4) {
    const byNumber = patents.filter(item =>
      patentDigits(item.num).includes(digits) || patentDigits(item.appNum).includes(digits));
    if (byNumber.length) return byNumber.slice(0, limit);
  }
  const q = normalize(raw);
  if (q.length < 2) return [];
  return patents.filter(item => normalize(patentText(item)).includes(q)).slice(0, limit);
}

// 발명자 · 출원 · 등록일은 표시하지 않는다.
// 다만 '등록' 이 아닌 상태(출원·심사중, 소멸)는 알아야 하므로 그때만 남긴다.
const patentStatusNote = (item) => (item && item.status && item.status !== '등록' ? item.status : '');
function patentLines(item) {
  const lines = [`${item.kind}  ${item.num || '번호 부여 전'}`, item.name];
  if ((item.gongjong || []).length) lines.push(`공종  ${item.gongjong.join(' · ')}`);
  if (item.gongbeop) lines.push(`공법  ${item.gongbeop}`);
  if (item.owner) lines.push(`특허권자  ${item.owner}`);
  const note = patentStatusNote(item);
  if (note) lines.push(`상태  ${note}`);
  return lines;
}

function addPatentBubble(item) {
  chatEmpty.classList.add('off');
  const row = document.createElement('div'); row.className = 'row answer';
  const bubble = document.createElement('div'); bubble.className = 'bubble patent-bubble';
  bubble.textContent = patentLines(item).join('\n');
  const actions = document.createElement('div'); actions.className = 'actions';
  actions.innerHTML = '<button data-patent-num>특허번호 복사</button><button data-patent-all>전체 복사</button>';
  actions.querySelector('[data-patent-num]').onclick = () =>
    item.num ? copyText(item.num) : showToast('아직 번호가 부여되지 않았습니다');
  actions.querySelector('[data-patent-all]').onclick = () => copyText(patentLines(item).join('\n'));
  bubble.append(actions); row.append(bubble); messages.append(row);
  messages.scrollTop = messages.scrollHeight;
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
  const linked = partnerRecords(item.name);
  const linkedText = [...linked.todos.map(todo => `✓ 할 일  ${todo.text}`), ...linked.memories.map(memory => `📝 ${memory.text}  (${savedLabel(memory)})`)];
  bubble.textContent = [`${item.name}`, item.phone || '전화번호 확인', item.email || '이메일 확인',
    ...(linkedText.length ? ['', `관련 기록 ${linkedText.length}건`, ...linkedText] : [])].join('\n');
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
function savedDateOf(item) {
  const value = item && (item.createdAt || item.savedAt || item.updatedAt);
  const millis = timeOf(value);
  return millis ? new Date(millis) : null;
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

// ── 공통 저장 함수 ──────────────────────────────────────────────
// 팝업이든 사이트 화면이든 저장은 반드시 아래 함수들만 거친다.
// 같은 배열(knowledge/todos/memories)과 같은 localStorage 키, 같은 Firebase 문서를 쓴다.

const ENTRY_SOURCE = overlayMode ? '팝업' : '사이트';

function newEntry(fields, source) {
  const now = nowIso();
  return {
    id: crypto.randomUUID(),
    createdAt: now,        // 생성 날짜·시간
    updatedAt: now,        // 수정 날짜·시간
    source: source || ENTRY_SOURCE,   // 입력 출처
    ...fields
  };
}

function createTodo(text, source) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const todo = newEntry({ type: 'todo', text: raw, raw, date: todayKey(), done: false }, source);
  todos.unshift(todo);          // 할 일은 todos 에만 들어간다
  return todo;
}

function createMemory(text, source) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const memory = newEntry({ type: 'memory', text: raw, raw }, source);
  memories.unshift(memory);     // 기억은 memories 에만 들어간다
  return memory;
}

function createKnowledge(title, answer, options = {}) {
  const name = String(title || '').trim();
  const body = String(answer === undefined || answer === null ? '' : answer).trim();
  if (!name) return null;
  const item = newEntry({
    type: 'knowledge',
    title: name,
    answer: body || name,
    text: body ? `${name} | ${body}` : name,
    raw: options.raw || (body ? `${name} | ${body}` : name),
    category: options.category || '기타',
    aliases: Array.isArray(options.aliases) ? options.aliases : []
  }, options.source);
  knowledge.unshift(item);
  return item;
}

function saveLocalState() {
  sortIntoCollections();
  localStorage.setItem('knowledge-messenger-data', JSON.stringify(knowledge));
  localStorage.setItem('knowledge-todos', JSON.stringify(todos));
  localStorage.setItem('knowledge-memories', JSON.stringify(memories));
  localStorage.setItem('knowledge-account-meta', JSON.stringify(accountMeta));
}

function renderAll() {
  renderLibrary();
  renderTodos();
  renderMemories();
}

// 나중에 자동 재전송으로 올라간 항목의 말풍선을 완료로 바꾸기 위해 들고 있는다.
const waitingBubbles = new Map();
function resolveWaitingBubbles(savedIds) {
  if (!waitingBubbles.size) return;
  for (const [id, entry] of [...waitingBubbles]) {
    if (savedIds && !savedIds.has(id)) continue;
    entry.bubble.textContent = `✓ ${entry.label} 저장 및 연동 완료\n${entry.detail}`;
    waitingBubbles.delete(id);
  }
}

// 저장 순서: 배열 → 로컬 저장 → 화면 갱신 → Firebase → 저장된 문서 확인.
async function commitEntry(item, kind) {
  const labels = { todo: '할 일', memory: '기록', knowledge: '지식' };
  const label = labels[kind] || '기록';
  const detail = kind === 'todo'
    ? `${item.text}\n${item.date} · 진행중`
    : kind === 'knowledge'
      ? `${item.title}\n${item.answer}`
      : `${item.text}\n${savedLabel(item)}`;

  saveLocalState();          // 2. 로컬 저장 완료
  renderAll();               // 3. 내 지식 · 할 일 · 기억 저장소 즉시 다시 표시

  const bubble = addBubble(`${label} 저장 중…\n${detail}`, 'answer');
  let result = await saveCloudState({ verifyIds: [item.id] });     // 4~5. Firebase 저장 + 확인
  // 일시적인 실패면 한 번 더 시도한다(연결은 살아 있는데 쓰기만 밀린 경우).
  if (!result.verified && cloudReady) {
    await new Promise(resolve => setTimeout(resolve, 700));
    result = await saveCloudState({ verifyIds: [item.id] });
  }

  const needsLogin = !result.verified && !cloudReady && Boolean(window.HANSOL_AUTH) && !window.HANSOL_AUTH.currentUser;
  if (result.verified) {
    bubble.textContent = `✓ ${label} 저장 및 연동 완료\n${detail}`;
    showToast(`✓ ${label} 저장 및 연동 완료`);
  } else {
    bubble.textContent = `로컬 저장 완료·클라우드 연동 대기 중\n${needsLogin ? '동기화 PIN 로그인이 필요합니다\n' : ''}${detail}`;
    showToast('로컬 저장 완료·클라우드 연동 대기 중');
    // 자동 재전송으로 올라가면 이 말풍선을 완료로 바꾼다.
    waitingBubbles.set(item.id, { bubble, label, detail });
  }
  if (needsLogin && $('#syncModal').classList.contains('hidden')) { syncPromptDismissed = false; openSyncModal(); }
  messages.scrollTop = messages.scrollHeight;
  return result.verified;
}

// 팝업 명령어 — 어떤 입력이든 반드시 실제 배열과 Firebase 문서에 저장된다.
const TODO_COMMAND = /^(?:할\s*일|todo)[\s.,:·\-]*(.+)$/i;
const MEMORY_COMMAND = /^(?:기록|기억|메모)[\s.,:·\-]*(.+)$/i;
const KNOWLEDGE_COMMAND = /^(?:지식|knowledge)[\s.,:·\-]*(.+)$/i;
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

// 찾은 결과를 말풍선으로 보여 주고 그 개수를 돌려준다. 저장은 하지 않는다.
function showSearchHits(text) {
  const query = normalize(text);
  if (!query) return 0;
  let found = 0;
  const patents = findPatents(text); patents.forEach(addPatentBubble); found += patents.length;
  const partnerHits = findPartners(text); partnerHits.forEach(addPartnerBubble); found += partnerHits.length;
  const accountHits = findAccounts(text); accountHits.forEach(addAccountBubble); found += accountHits.length;
  const knowledgeHits = findKnowledge(text);
  knowledgeHits.forEach(item => addBubble(`${item.title}\n${item.answer}`, 'answer', item));
  found += knowledgeHits.length;
  const todoHits = alive(todos).filter(todo => normalize(`${todo.text} ${todo.date || ''}`).includes(query));
  todoHits.forEach(todo => addBubble(`✓ 할 일\n${todo.text}\n${todo.date || '날짜 확인'} · ${todo.done ? '완료' : '진행중'}`, 'answer'));
  found += todoHits.length;
  const memoryHits = alive(memories).filter(memory => normalize(memory.text).includes(query));
  memoryHits.forEach(memory => addBubble(`기억\n${memory.text}\n${savedLabel(memory)}`, 'answer'));
  found += memoryHits.length;
  return found;
}

function handleComposerText(text) {
  // 목록 보기 명령만 저장하지 않는다.
  if (MEMORY_LIST_COMMAND.test(text)) {
    const list = sortBySaved(alive(memories));
    if (!list.length) addBubble('기억 저장소 비어 있음\n“기록 내용”으로 저장하세요', 'answer');
    else list.slice(0, 8).forEach(memory => addBubble(`기억\n${memory.text}\n${savedLabel(memory)}`, 'answer'));
    return Promise.resolve(false);
  }
  if (TODO_LIST_COMMAND.test(text)) {
    const list = alive(todos);
    if (!list.length) addBubble('할 일 없음\n“할일 내용”으로 저장하세요', 'answer');
    else list.slice(0, 8).forEach(todo => addBubble(`✓ 할 일\n${todo.text}\n${todo.date || '날짜 확인'} · ${todo.done ? '완료' : '진행중'}`, 'answer'));
    return Promise.resolve(false);
  }

  // 지식 제목 | 내용 → knowledge
  const knowledgeMatch = text.match(KNOWLEDGE_COMMAND);
  if (knowledgeMatch?.[1]?.trim()) {
    const [title, ...rest] = knowledgeMatch[1].split('|');
    const item = createKnowledge(title, rest.join('|'), { raw: text });
    if (item) return commitEntry(item, 'knowledge');
  }

  // 할일 내용 / 할 일 내용 → todos
  const todoMatch = text.match(TODO_COMMAND);
  if (todoMatch?.[1]?.trim()) {
    const todo = createTodo(todoMatch[1]);
    if (todo) return commitEntry(todo, 'todo');
  }

  // 기록 내용 / 기억 내용 → memories
  const memoryMatch = text.match(MEMORY_COMMAND);
  if (memoryMatch?.[1]?.trim()) {
    const memory = createMemory(memoryMatch[1]);
    if (memory) return commitEntry(memory, 'memory');
  }

  // 명령어가 없으면 검색이다. 저장하지 않는다.
  // 기억 저장소에는 "기억 …" / "기록 …" 으로 입력했을 때만 들어간다.
  const patentHits = findPatents(text);
  if (patentHits.length && patentDigits(text).length >= 4) {
    patentHits.forEach(addPatentBubble);
    return Promise.resolve(false);
  }
  const found = showSearchHits(text);
  if (!found) addBubble(`찾은 결과 없음\n저장하려면 “기록 ${text}” 처럼 앞에 기록을 붙이세요`, 'answer');
  return Promise.resolve(false);
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
  const item = createKnowledge($('#quickTitle').value, $('#quickAnswer').value, { category: $('#quickCategory').value });
  if (!item) return;
  saveLocalState(); queueCloudSave(); renderAll();
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
    const fresh = incoming.filter(x => x.title && x.answer && !existing.has(normalize(x.title)));
    fresh.forEach(x => createKnowledge(x.title, x.answer, { category: x.category, aliases: x.aliases, source: '가져오기' }));
    save(); renderAll();
    addBubble(`가져오기 완료\n${fresh.length}개 추가`, 'answer');
  } catch { addBubble('가져오기 X\nJSON 형식 확인', 'answer'); }
  e.target.value = '';
});

if (window.knowledgeAPI) {
  window.knowledgeAPI.onToggle(() => app.classList.contains('hidden') ? openApp() : collapseApp());
  window.knowledgeAPI.onOpen?.(() => openApp());
  window.knowledgeAPI.onCollapse?.(() => collapseApp());
}

// 라벨은 함수 안에 둔다. setCloudStatus 는 모듈 초기화 중에도 불리므로
// 바깥 const 를 참조하면 초기화 전 접근(TDZ)으로 터진다.
function setCloudStatus(status) {
  const labels = {
    live: '실시간 연동 중',
    syncing: '연동 중…',
    pending: '오프라인 보관 · 재연결 시 자동 업로드',
    offline: '오프라인 저장 모드'
  };
  cloudStatus = status;
  const label = labels[status] || labels.offline;
  const badge = $('#syncState');
  if (badge) { badge.textContent = label; badge.dataset.state = status; }
  // 팝업(오버레이)에서는 사이트 헤더가 안 보이므로 작은 점으로 같은 상태를 보여 준다.
  const dot = $('#syncDot');
  if (dot) {
    dot.dataset.state = status;
    dot.title = status === 'live' ? label : `${label} · 눌러서 동기화 로그인`;
  }
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

function queueCloudSave() {
  if (cloudApplying) return;
  if (!cloudReady || !window.HANSOL_FIRESTORE) { markPending(); return; }
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => { saveCloudState(); }, 350);
}

// Firebase 저장. 트랜잭션 안에서 원격 문서를 다시 읽어 ID 기준으로 병합하고(덮어쓰기 금지),
// 쓰기가 끝나면 서버에서 문서를 한 번 더 읽어 실제로 들어갔는지 확인한다.
// "실시간 연동 중" 상태만으로 성공 처리하지 않는다.
async function saveCloudState({ verifyIds = [] } = {}) {
  clearTimeout(cloudSaveTimer);
  if (!cloudReady || !window.HANSOL_FIRESTORE) {
    markPending();
    return { ok: false, verified: false, reason: 'offline' };
  }
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

    // 저장된 문서를 서버에서 직접 다시 읽어 확인한다(캐시가 아니라 서버).
    let saved = null;
    try { saved = (await stateDoc.get({ source: 'server' })).data(); }
    catch { saved = (await stateDoc.get()).data(); }
    const storedIds = new Set([
      ...((saved && saved.knowledge) || []),
      ...((saved && saved.todos) || []),
      ...((saved && saved.memories) || []),
      ...((saved && saved.accountMeta) || [])
    ].map(entry => entry && entry.id));
    const missing = verifyIds.filter(id => !storedIds.has(id));
    resolveWaitingBubbles(storedIds);   // 뒤늦게 올라간 항목의 말풍선을 완료로 바꾼다

    cloudSyncing = false;
    await applyCloudState(merged);
    if (missing.length) {
      console.error('Firebase 저장 확인 실패', missing);
      markPending();
      return { ok: true, verified: false, reason: 'not-found', missing };
    }
    clearPending();
    return { ok: true, verified: true };
  } catch (error) {
    console.error('Firebase 저장 실패', error);
    markPending();
    return { ok: false, verified: false, reason: 'error' };
  } finally {
    cloudSyncing = false;
  }
}

async function applyCloudState(state) {
  if (!state) return;
  cloudApplying = true;
  const missingOnServer = hasLocalOnlyItems(knowledge, state.knowledge)
    || hasLocalOnlyItems(todos, state.todos)
    || hasLocalOnlyItems(memories, state.memories)
    || hasLocalOnlyItems(accountMeta, state.accountMeta);
  knowledge = mergeById(knowledge, state.knowledge);
  todos = mergeById(todos, state.todos);
  memories = mergeById(memories, state.memories);
  accountMeta = mergeById(accountMeta, state.accountMeta);
  sortIntoCollections();   // 병합 뒤에도 종류별로 갈라 둔다
  const remoteSecrets = state.vaultSecrets && typeof state.vaultSecrets === 'object' ? state.vaultSecrets : {};
  vaultSecrets = { ...remoteSecrets, ...vaultSecrets };
  for (const account of accountMeta) if (account.deleted) delete vaultSecrets[account.id];
  saveLocalState();
  try {
    vaultKey = vaultKey || await getDeviceKey();
    await persistVault();
  } catch (error) { console.error('로컬 계정 보관 실패', error); }
  renderAll();
  cloudApplying = false;
  if (missingOnServer) queueCloudSave();
}

async function startCloudSync() {
  if (!window.HANSOL_FIRESTORE) { setCloudStatus('offline'); return showToast('오프라인 저장 모드'); }
  const stateDoc = window.HANSOL_FIRESTORE.doc('shared/state');
  cloudReady = true;
  try {
    const first = await stateDoc.get();
    if (first.exists) await applyCloudState(first.data());
  } catch (error) { console.error('Firebase 최초 읽기 실패', error); }
  await saveCloudState();
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
  saveCloudState();
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
  syncPromptDismissed = false;
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
  if (!syncPromptDismissed && (!overlayMode || !app.classList.contains('hidden'))) $('#syncModal').classList.remove('hidden');
}

// PIN 창이 화면을 막아 아무것도 못 누르는 일이 없도록 언제든 닫을 수 있게 한다.
// 닫아도 저장은 로컬에 계속되고, 나중에 로그인하면 밀린 항목이 함께 올라간다.
function openSyncModal() {
  $('#syncError').textContent = '';
  $('#syncModal').classList.remove('hidden');
  setTimeout(() => $('#syncPin').focus(), 50);
}
function closeSyncModal() {
  syncPromptDismissed = true;
  $('#syncModal').classList.add('hidden');
}
$('#syncClose').addEventListener('click', closeSyncModal);
$('#syncLater').addEventListener('click', closeSyncModal);
$('#syncModal').addEventListener('click', event => { if (event.target.id === 'syncModal') closeSyncModal(); });
$('#syncDot').addEventListener('click', () => {
  if (cloudReady) return showToast('실시간 연동 중');
  if (!window.HANSOL_AUTH) return showToast('오프라인 저장 모드');
  openSyncModal();
});
$('#syncState').addEventListener('click', () => {
  if (cloudReady || !window.HANSOL_AUTH) return showToast(cloudReady ? '이미 연동 중' : '오프라인 저장 모드');
  openSyncModal();
});

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
