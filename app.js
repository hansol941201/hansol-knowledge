const $ = (s) => document.querySelector(s);
const orb = $('#orb');
const app = $('#app');
const input = $('#input');
const messages = $('#messages');
const chatEmpty = $('#chatEmpty');
const toast = $('#toast');

const seed = [
  { id: crypto.randomUUID(), title: '시방서 문의', answer: '심혜진 연구원\n010-9954-7653', aliases: ['시방서', '기술 문의', '공법 자재', '심혜진 번호'] },
  { id: crypto.randomUUID(), title: '공사 일정', answer: '한준엽 과장\n010-3355-3458', aliases: ['일정 문의', '공사일정', '한준엽'] },
  { id: crypto.randomUUID(), title: '하자 보수', answer: '정정훈 과장\n010-8003-6900', aliases: ['하자 문의', '하자보수', '정정훈'] },
  { id: crypto.randomUUID(), title: '스토어', answer: '이란 매니저\n1800-8203', aliases: ['자재 구매', '소비자 구매', '스토어 문의'] },
  { id: crypto.randomUUID(), title: '폐기물 신청', answer: '용인공장\n010-2737-3394', aliases: ['폐기물', '폐기물 처리', '폐기물 과정'] },
  { id: crypto.randomUUID(), title: '폐기물 비용', answer: '미연님\n번호 확인', aliases: ['폐기물비용', '폐기물 금액', '미연'] },
  { id: crypto.randomUUID(), title: '하자 접수', answer: '경미님\n번호 확인', aliases: ['하자접수', '경미'] },
  { id: crypto.randomUUID(), title: '미팅 일정', answer: '재연님\n010-9291-3892', aliases: ['시공사 문의', '미팅일정', '시공사', '재연'] },
  { id: crypto.randomUUID(), title: '아파트 문의', answer: '010-8678-9398', aliases: ['아파트 담당', '아파트 연락처'] },
  { id: crypto.randomUUID(), title: '자재 문의', answer: '김미연님', aliases: ['자재 담당', '자재 누구', '자재관련담당'] },
  { id: crypto.randomUUID(), title: '컨설팅 문의', answer: '김미연님', aliases: ['컨설팅 담당', '컨설팅 누구', '컨설팅관련담당'] },
  { id: crypto.randomUUID(), title: '컨설팅 내역서', answer: '채명님', aliases: ['컨설팅 내역', '컨설팅 내역서 담당', '내역서 문의', '채명'] },
  { id: crypto.randomUUID(), title: '특허료 문의', answer: '김미연님', aliases: ['특허료 담당', '특허 비용', '특허료 누구'] },
  { id: crypto.randomUUID(), title: '노무비 문의', answer: '김미연님', aliases: ['노무비 담당', '노무 비용', '노무비 누구'] },
  { id: crypto.randomUUID(), title: '유지보수 수수료 문의', answer: '김미연님', aliases: ['유지보수 담당', '유지보수 수수료', '유지보수 비용'] },
  { id: crypto.randomUUID(), title: '대금 관련 문의', answer: '김미연님', aliases: ['대금 담당', '대금 문의', '결제 대금', '대금관련담당'] },
  { id: crypto.randomUUID(), title: 'MSDS 공법명 발행', answer: '공법명만 발행 X\n사용 자재 확인', aliases: ['MSDS', '엠에스디에스', '공법 발행'] },
  { id: crypto.randomUUID(), title: 'MSDS 발행', answer: '공법 사용 자재 확인\n자재별 MSDS 발행', aliases: ['자재 MSDS', 'MSDS 요청', '엠에스디에스 발행'] },
  { id: crypto.randomUUID(), title: '듀얼강화방수', answer: '슬라브', aliases: ['듀얼 강화 방수', '슬라브 공법'] },
  { id: crypto.randomUUID(), title: '평옥상 공법', answer: '폴리우레아 / 우레탄 / PVC\n슬라브듀얼', aliases: ['평옥상', '폴리우레아', '우레탄', 'PVC', '피브이씨'] },
  { id: crypto.randomUUID(), title: '5도 이하 시공', answer: '작업 권장 X\n갈라짐 주의', aliases: ['겨울 시공', '저온 시공', '5도', '수용성 페인트'] },
  { id: crypto.randomUUID(), title: '아크릴 배면차수', answer: '개인시공 X', aliases: ['배면차수', '개인 시공'] },
  { id: crypto.randomUUID(), title: '지하주차장 에폭시', answer: '컨플럭스\n크리스탈 논파우더', aliases: ['주차장 에폭시', '지하주차장', '에폭시 자재'] },
  { id: crypto.randomUUID(), title: '여신 거래', answer: '물품공급계약서', aliases: ['여신거래', '계약서', '물품 공급 계약'] },
  { id: crypto.randomUUID(), title: '보증보험', answer: '필수 X\n보증보험 / 증납형태 선택', aliases: ['보증 보험', '증납', '계약 보증'] },
  { id: crypto.randomUUID(), title: '남은 자재', answer: '환불 가능 여부 확인', aliases: ['자재 환불', '남은자재', '잔여 자재', '평균 소모량'] },
  { id: crypto.randomUUID(), title: '공법 비교표', answer: '방수 / 재도장 확인\n공정별 비교표 발송', aliases: ['비교표 요청', '공법표', '공사 방법', '시공 방법', '공법 문의'] },
  { id: crypto.randomUUID(), title: '발주 기본 절차', answer: '소요량 확인\n발주 요청서 작성\n입고일 확인 / 현장 공유', aliases: ['발주', '자재 발주', '발주 방법', '입고 예정일'] },
  { id: crypto.randomUUID(), title: '자재공급승인원 요청', answer: '공장장님 자재공급승인원 자료 부탁드립니다.\n아파트명(현장):\n주소:\n특허번호:\n확인 부탁드립니다.\n감사합니다.', aliases: ['자재 공급 승인원', '승인원 요청', '공장장 요청 문구'] },
  { id: crypto.randomUUID(), title: '승인원 문서번호', answer: '문서번호 / 업체명\n각각 다르게 작성', aliases: ['적기문서번호', '승인원 주의', '업체명 다르게'] },
  { id: crypto.randomUUID(), title: '소비자 자재 구매', answer: '스토어 연결\n1800-8203\n공고문 같이 발송', aliases: ['일반 소비자', '자재 문의', '전화 문의', '소비자 안내'] },
  { id: crypto.randomUUID(), title: '소규모 셀프시공', answer: '소장님 연결 가능', aliases: ['셀프 시공', '소규모 시공', '소장 연결'] },
  { id: crypto.randomUUID(), title: '특허번호 차이', answer: '내용 확인', aliases: ['특허 번호', '특허번호'] }
];

let knowledge = JSON.parse(localStorage.getItem('knowledge-messenger-data') || 'null') || [];
knowledge = knowledge.filter(item => !(item.title === '통신도장' && item.answer === '통신도장'));
let todos = JSON.parse(localStorage.getItem('knowledge-todos') || '[]');
let accountMeta = JSON.parse(localStorage.getItem('knowledge-account-meta') || '[]');
const partners = Array.isArray(window.PARTNERS) ? window.PARTNERS : [];
let vaultKey = null;
let vaultSecrets = {};
let pendingSecretCopy = null;
const knownTitles = new Set(knowledge.map(item => item.title));
for (const item of seed) {
  if (!knownTitles.has(item.title)) knowledge.push(item);
}
const save = () => localStorage.setItem('knowledge-messenger-data', JSON.stringify(knowledge));
const saveTodos = () => localStorage.setItem('knowledge-todos', JSON.stringify(todos));
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
save();

const categoryRules = ['전체', '협력업체', '계정', '연락처', '공법·자재', '시공·계약', '문구·절차', '기타'];
let pageCategory = '전체';

function categoryItems(name) {
  if (name === '전체') return knowledge;
  if (name === '계정' || name === '협력업체') return [];
  return knowledge.filter(item => item.category === name);
}

function renderLibrary() {
  const query = normalize($('#pageSearch').value || '');
  const items = categoryItems(pageCategory).filter(item => !query || normalize([item.title, item.answer, ...(item.aliases || [])].join(' ')).includes(query));
  const accounts = (pageCategory === '전체' || pageCategory === '계정')
    ? accountMeta.filter(item => !query || normalize(`${item.service} ${item.user} ${item.url || ''}`).includes(query)) : [];
  const partnerItems = (pageCategory === '전체' || pageCategory === '협력업체')
    ? partners.filter(item => !query || normalize(`${item.name} ${item.phone} ${item.email}`).includes(query)) : [];
  $('#pageCount').textContent = `${knowledge.length + accountMeta.length + partners.length}개`;
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
    </article>`).join('') + items.map(item => `
    <article class="page-card" data-id="${item.id}">
      <small>${escapeHtml(findCategory(item))}</small>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.answer)}</p>
      <footer><button data-copy>복사</button><button data-edit>수정</button><button data-chat>지식창에서 보기</button><button data-delete>삭제</button></footer>
    </article>`).join('');
  $('#pageEmpty').classList.toggle('hidden', items.length + accounts.length + partnerItems.length !== 0);
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
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function renderTodos() {
  const today = todos.filter(todo => todo.date === todayKey());
  const remain = today.filter(todo => !todo.done).length;
  $('#todayPanel').innerHTML = `
    <div class="today-head"><div><i></i><b>오늘 할 일</b></div><span>${remain}개 남음</span></div>
    <div class="todo-list">${today.length ? today.map(todo => `
      <label class="todo-item ${todo.done ? 'done' : ''}" data-todo-id="${todo.id}">
        <input type="checkbox" ${todo.done ? 'checked' : ''}><span>${escapeHtml(todo.text)}</span><button type="button">×</button>
      </label>`).join('') : '<div class="todo-empty">지식창에 “오늘 할 일”을 입력해보세요.</div>'}</div>`;
  $('#todayPanel').querySelectorAll('[data-todo-id]').forEach(row => {
    const todo = todos.find(x => x.id === row.dataset.todoId);
    row.querySelector('input').onchange = e => { todo.done = e.target.checked; saveTodos(); renderTodos(); };
    row.querySelector('button').onclick = () => { todos = todos.filter(x => x.id !== todo.id); saveTodos(); renderTodos(); };
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
$('#pageSearch').addEventListener('input', renderLibrary);
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
    Object.assign(item, values);
    showToast('수정됨');
  } else {
    knowledge.unshift({ id: crypto.randomUUID(), ...values });
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
    accountMeta.unshift({ id, service: $('#accountService').value.trim(), user: $('#accountId').value.trim() });
    vaultSecrets[id] = $('#accountPassword').value;
    localStorage.setItem('knowledge-account-meta', JSON.stringify(accountMeta));
    await persistVault(); renderLibrary(); closeVault(); showToast('계정 암호화 저장됨');
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
  accountMeta = accountMeta.filter(x => x.id !== id);
  localStorage.setItem('knowledge-account-meta', JSON.stringify(accountMeta));
  if (vaultKey) { delete vaultSecrets[id]; await persistVault(); }
  renderLibrary(); showToast('계정 삭제됨');
}

function openApp() {
  orb.classList.add('hidden');
  app.classList.remove('hidden');
  setTimeout(() => input.focus(), 120);
}
function collapseApp() {
  app.classList.add('hidden');
  orb.classList.remove('hidden');
}
orb.addEventListener('click', openApp);
$('#collapseBtn').addEventListener('click', collapseApp);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') collapseApp(); });

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
}

function normalize(text) { return text.toLowerCase().replace(/[?!.\s]/g, ''); }
function score(item, query) {
  const q = normalize(query);
  const terms = [item.title, item.answer, ...(item.aliases || [])].map(normalize);
  return terms.reduce((best, term) => term.includes(q) || q.includes(term) ? Math.max(best, Math.min(q.length, term.length)) : best, 0);
}
function findKnowledge(query) {
  return knowledge.map(item => ({ item, points: score(item, query) })).filter(x => x.points > 0).sort((a, b) => b.points - a.points).slice(0, 3).map(x => x.item);
}

function findAccounts(query) {
  const q = normalize(query).replace(/(아이디|비번|비밀번호|계정|로그인)/g, '');
  if (!q) return [];
  return accountMeta.filter(item => normalize(`${item.service} ${item.user}`).includes(q) || q.includes(normalize(item.service))).slice(0, 3);
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

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addBubble(text, 'mine');
  input.value = '';
  const todayMatch = text.match(/^오늘[\s.,:·-]*(.+)$/);
  if (todayMatch?.[1]?.trim()) {
    const todo = { id: crypto.randomUUID(), text: todayMatch[1].trim(), date: todayKey(), done: false };
    todos.unshift(todo); saveTodos(); renderTodos();
    addBubble(`✓ 오늘 할 일\n${todo.text}`, 'answer');
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
  if (matches.length) {
    matches.forEach(item => addBubble(`${item.title}\n${item.answer}`, 'answer', item));
  } else {
    addBubble('검색 결과 없음\n지식 추가는 전체 사이트에서', 'answer');
  }
});

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
  item.aliases = [...(item.aliases || []), alias.trim()];
  save();
  showToast('검색어 추가됨');
}
function removeItem(item, row = null) {
  if (!confirm(`「${item.title}」 삭제?`)) return;
  knowledge = knowledge.filter(x => x.id !== item.id);
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
  knowledge.unshift(item); save(); renderLibrary();
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
    const existing = new Set(knowledge.map(x => normalize(x.title)));
    const fresh = incoming.filter(x => x.title && x.answer && !existing.has(normalize(x.title))).map(x => ({ id: crypto.randomUUID(), aliases: [], ...x }));
    knowledge = [...fresh, ...knowledge]; save(); renderLibrary();
    addBubble(`가져오기 완료\n${fresh.length}개 추가`, 'answer');
  } catch { addBubble('가져오기 X\nJSON 형식 확인', 'answer'); }
  e.target.value = '';
});

if (window.knowledgeAPI) {
  window.knowledgeAPI.onToggle(() => app.classList.contains('hidden') ? openApp() : collapseApp());
}
