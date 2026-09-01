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
let schedule = JSON.parse(localStorage.getItem('knowledge-schedule') || '[]');
let mailTemplates = JSON.parse(localStorage.getItem('knowledge-mail-templates') || '[]');   // 메일 문구
let mailLog = JSON.parse(localStorage.getItem('knowledge-mail-log') || '[]');               // 보낸 기록
let mailConfig = readMailConfig();                                                          // 발송 설정
let shortcuts = JSON.parse(localStorage.getItem('knowledge-shortcuts') || '[]');
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
ensureStamps(knowledge); ensureStamps(todos); ensureStamps(memories); ensureStamps(accountMeta); ensureStamps(shortcuts); ensureStamps(schedule);
ensureStamps(mailTemplates); ensureStamps(mailLog);

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

// ── 아이콘 (Lucide 계열 얇은 라인) ─────────────────────────────
const ICONS = {
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  book: 'M5 4h11a2 2 0 012 2v14H7a2 2 0 01-2-2zM5 17h13',
  check: 'M4 12l5 5L20 6',
  bookmark: 'M7 4h10a1 1 0 011 1v15l-6-4-6 4V5a1 1 0 011-1z',
  patent: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  building: 'M4 21V6a1 1 0 011-1h6a1 1 0 011 1v15M12 21V10h7a1 1 0 011 1v10M7 9h2M7 13h2M7 17h2M16 14h1M16 18h1',
  lock: 'M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z',
  phone: 'M7 3h3l2 5-2.5 1.5a12 12 0 005 5L16 12l5 2v3a2 2 0 01-2 2A16 16 0 015 5a2 2 0 012-2z',
  settings: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.6 1.6 0 008 19.4a1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H2a2 2 0 110-4h.1A1.6 1.6 0 004.6 8a1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V2a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H22a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z',
  download: 'M12 3v12M7 11l5 5 5-5M4 20h16',
  refresh: 'M20 11a8 8 0 10-2.3 6M20 5v6h-6',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  plus: 'M12 5v14M5 12h14',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  star: 'M12 4l2.3 5 5.7.6-4.3 3.9 1.2 5.5-4.9-2.8-4.9 2.8 1.2-5.5L4 9.6 9.7 9z',
  link: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-2 2M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l2-2',
  clock: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2',
  pencil: 'M16.5 4.5l3 3L8 19H5v-3zM14.5 6.5l3 3'
};
function icon(name, size = 16) {
  const path = ICONS[name] || ICONS.grid;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
}
function paintIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(node => {
    if (node.dataset.painted === '1') return;
    node.innerHTML = icon(node.dataset.icon, Number(node.dataset.size || 16));
    node.dataset.painted = '1';
  });
}

// ── 화면 구성 ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { name: '대시보드', icon: 'grid' },
  { name: '내 지식', icon: 'book', category: '전체' },
  { name: '할 일', icon: 'check' },
  { name: '기억', icon: 'bookmark' },
  { name: '특허', icon: 'patent' },
  { name: '협력업체', icon: 'building' },
  { name: '계정', icon: 'lock' },
  { name: '연락처', icon: 'phone' },
  { name: '업무지식', icon: 'book' }
];
const VIEW_LEAD = {
  '대시보드': ['모아 보기', '오늘 챙길 것과 최근 지식을 한눈에.'],
  '전체': ['내 지식', '기록한 업무 지식을 한눈에 확인하세요.'],
  '할 일': ['할 일', '오늘 챙겨야 할 일들입니다.'],
  '기억': ['기억 저장소', '메모처럼 남겨 둔 기록입니다.'],
  '특허': ['특허', '특허·상표·디자인 목록입니다.'],
  '협력업체': ['협력업체', '업체 연락처와 관련 기록입니다.'],
  '계정': ['계정', '암호화해서 보관 중인 계정입니다.'],
  '연락처': ['연락처', '자주 찾는 담당자 연락처입니다.'],
  '업무지식': ['업무지식', '업무에 필요한 지식 모음입니다.'],
  '기타': ['기타', '분류하지 않은 지식입니다.']
};
const categoryRules = ['전체', '기억', '특허', '협력업체', '계정', '연락처', '업무지식', '기타'];
const virtualCategories = ['계정', '협력업체', '할 일', '기억', '특허', '대시보드'];
let pageCategory = '대시보드';
// 검색 미리보기 목록 — 한 번 만들고 자료가 바뀔 때만 다시 만든다.
// saveLocalState() 가 파일 위쪽에서도 불리므로 var 로 두어 초기화 순서를 타지 않게 한다.
var searchIndex = null;
var searchIndexDirty = true;
let detailItemId = null;   // 상세 창에 띄운 지식(수정·삭제 대상)
let pageSearchCommitted = '';
let showAllTodos = false;
let viewBeforeSearch = '';   // 검색을 지우면 보던 화면으로 되돌린다

function categoryItems(name) {
  if (name === '전체' || name === '대시보드') return alive(knowledge);
  if (virtualCategories.includes(name)) return [];
  return alive(knowledge).filter(item => item.category === name);
}

// 검색창에 화면 이름을 치고 Enter 하면 검색 대신 그 화면으로 바로 넘어간다.
const SEARCH_VIEW_WORDS = {
  '대시보드': '대시보드', '홈': '대시보드',
  '내지식': '전체', '지식': '전체', '전체': '전체',
  '할일': '할 일', 'todo': '할 일',
  '기억': '기억', '기록': '기억',
  '특허': '특허',
  '협력업체': '협력업체', '업체': '협력업체',
  '계정': '계정',
  '연락처': '연락처',
  '업무지식': '업무지식'
};
function viewForSearch(text) {
  const key = String(text || '').replace(/\s+/g, '').toLowerCase();
  return SEARCH_VIEW_WORDS[key] || '';
}

function goToView(name) {
  closeSearchPreview();
  pageCategory = name;
  viewBeforeSearch = '';
  showAllTodos = name === '할 일';
  $('#pageSearch').value = '';
  pageSearchCommitted = '';
  renderAll();
  $('.main-scroll').scrollTop = 0;
}

function renderSideNav() {
  // 상단 가로 메뉴 — 마지막에 기억 저장소(모달)를 함께 둔다.
  $('#sideNav').innerHTML = NAV_ITEMS.map(item => {
    const target = item.category || item.name;
    return `<button type="button" class="top-item ${target === pageCategory ? 'active' : ''}" data-nav="${target}">${escapeHtml(item.name)}</button>`;
  }).join('') + `<button type="button" class="top-item" id="mailToggle">메일함</button>`
    + `<button type="button" class="top-item" id="memoryToggle">기억 저장소</button>`;
  $('#sideNav').querySelectorAll('[data-nav]').forEach(button => {
    button.onclick = () => goToView(button.dataset.nav);
  });
  $('#mailToggle').onclick = openMailbox;
  $('#memoryToggle').onclick = openMemoryLibrary;
  // 좁은 화면에서 선택한 메뉴가 가려져 있으면 보이는 위치까지 메뉴 줄만 움직인다(페이지는 그대로).
  const nav = $('#sideNav');
  const active = nav.querySelector('.top-item.active');
  if (active && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = Math.max(0, active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2);
  }
}

// 통합검색용 — 유사 표현·붙여쓰기·조사 차이를 함께 본다(search-rules.js).
// 점수가 높은 자료가 위로 오고, 검색어가 없으면 원래 순서를 그대로 둔다.
function searchFilter(list, term, fields) {
  if (!term) return list;
  const parsed = buildSearchQuery(term);
  return list
    .map(item => ({ item, found: matchSearchDoc(buildSearchDoc(fields(item)), parsed) }))
    .filter(row => row.found)
    .sort((a, b) => b.found.points - a.found.points)
    .map(row => row.item);
}

function renderLibrary() {
  const query = pageSearchCommitted.trim();
  const items = searchFilter(categoryItems(pageCategory), query,
    item => ({ title: item.title, body: item.answer, keywords: (item.aliases || []).join(' '), extra: item.category || '' }));
  const accounts = (pageCategory === '전체' || pageCategory === '계정')
    ? searchFilter(alive(accountMeta), query, item => ({ title: item.service, body: item.user, extra: item.url || '' })) : [];
  const partnerItems = (pageCategory === '전체' || pageCategory === '협력업체')
    ? searchFilter(partners, query, item => ({ title: item.name, body: `${item.phone || ''} ${item.email || ''}` })) : [];
  const searchAll = pageCategory === '전체';
  const patentTerm = pageSearchCommitted.trim();
  const patentItems = pageCategory === '특허'
    ? (patentTerm ? findPatents(patentTerm, patents.length) : patents)
    : (query ? findPatents(patentTerm, 5) : []);
  const todoItems = (searchAll ? Boolean(query) : pageCategory === '할 일')
    ? searchFilter(sortBySaved(alive(todos)), query,
        todo => ({ title: todo.text, body: `${todo.date || ''} ${savedLabel(todo)} ${todo.done ? '완료' : '미완료 진행중'}` })) : [];
  const memoryItems = (searchAll ? Boolean(query) : pageCategory === '기억')
    ? searchFilter(sortBySaved(alive(memories)), query,
        memory => ({ title: memory.text, body: `${memory.createdAt || ''} ${savedLabel(memory)}` })) : [];
  $('#pageCount').textContent = `${alive(knowledge).length + alive(todos).length + alive(memories).length + alive(accountMeta).length + partners.length + patents.length}개`;
  $('#pageCategories').innerHTML = categoryRules.filter(name => name !== '기타' || categoryItems('기타').length).map(name => `<button class="${name === pageCategory ? 'active' : ''}" data-category="${name}">${name}</button>`).join('');
  const term = pageSearchCommitted.trim();
  const mark = (text) => highlight(text, term);
  const shell = (kind, iconName, cls, attrs, body, foot) => `
    <article class="page-card ${cls}" ${attrs}>
      <header class="card-kind">${icon(iconName, 14)}<span>${escapeHtml(kind)}</span></header>
      ${body}
      <footer>${foot}</footer>
    </article>`;

  $('#pageGrid').innerHTML = patentItems.map(item => shell('특허', 'patent', 'patent-card',
      `data-patent-key="${escapeHtml(item.num || item.name)}"`,
      `<h3>${item.num ? mark(item.num) : escapeHtml(item.status || '번호 확인')}</h3>
       ${item.name ? `<p>${mark(item.name)}</p>` : ''}
       ${(item.gongjong || []).length ? `<div class="tag-row">${item.gongjong.map(tag => `<span>${mark(tag)}</span>`).join('')}</div>` : ''}
       <dl class="patent-meta">
         ${item.gongbeop ? `<div><dt>공법</dt><dd>${mark(item.gongbeop)}</dd></div>` : ''}
         ${item.owner ? `<div><dt>특허권자</dt><dd>${mark(item.owner)}</dd></div>` : ''}
         ${patentStatusNote(item) ? `<div><dt>상태</dt><dd>${escapeHtml(patentStatusNote(item))}</dd></div>` : ''}
       </dl>`,
      '<button data-patent-copy>특허번호 복사</button><button data-patent-chat>지식창에서 보기</button>')).join('')
    + partnerItems.map(item => shell('협력업체', 'building', 'partner-card',
      `data-partner-index="${partners.indexOf(item)}"`,
      `<h3>${mark(item.name)}</h3>
       <p>${mark(item.phone || '전화번호 확인')}\n${mark(item.email || '이메일 확인')}</p>
       ${partnerRecordsHtml(item.name, term)}`,
      '<button data-copy-phone>번호 복사</button><button data-copy-email>메일 복사</button><button data-partner-chat>지식창에서 보기</button>')).join('')
    + accounts.map(item => shell('계정', 'lock', 'account-card',
      `data-account-id="${item.id}"`,
      `<h3>${mark(item.service)}</h3><p>${mark(item.user)}\n<span class="secret-line">••••••••</span></p>`,
      '<button data-copy-id>아이디 복사</button><button data-copy-pw>비번 복사</button><button data-account-delete>삭제</button>')).join('')
    + todoItems.map(todo => shell('할 일', 'check', `todo-result-card ${todo.done ? 'done' : ''}`,
      `data-todo-result="${todo.id}"`,
      `<p class="card-body">${mark(todo.text)}</p><time class="card-time">${escapeHtml(todo.date || '날짜 확인')}</time>`,
      `<span class="todo-state ${todo.done ? 'done' : ''}">${todo.done ? '완료' : '진행중'}</span><button data-todo-toggle>${todo.done ? '완료 취소' : '완료 표시'}</button>`)).join('')
    + memoryItems.map(memory => shell('기억', 'bookmark', 'memory-result-card',
      `data-memory-result="${memory.id}"`,
      `<p class="card-body">${mark(memory.text)}</p><time class="card-time">${escapeHtml(savedLabel(memory))}</time>`,
      '<button data-memory-open>기억 저장소에서 보기</button>')).join('')
    + items.map(item => shell(findCategory(item), findCategory(item) === '연락처' ? 'phone' : 'book', '',
      `data-id="${item.id}"`,
      `<h3>${mark(item.title)}</h3><p>${mark(item.answer)}</p>${savedDateOf(item) ? `<time class="card-time">${escapeHtml(savedLabel(item))}</time>` : ''}`,
      '<button data-copy>복사</button><button class="card-act" data-edit>수정</button><button data-chat>지식창에서 보기</button><button class="card-act card-del" data-delete>삭제</button>')).join('');

  // 화면별 제목과 영역 표시
  const [heading, lead] = VIEW_LEAD[pageCategory] || VIEW_LEAD['전체'];
  $('#pageHeading').textContent = term ? '검색 결과' : heading;
  $('#pageLead').textContent = term ? `“${term}” 으로 찾은 내용입니다.` : lead;
  const onDashboard = pageCategory === '대시보드' && !term;
  $('#shortcutSection').classList.toggle('hidden', Boolean(term) || pageCategory !== '대시보드');
  $('#dashCols').classList.toggle('hidden', !onDashboard && pageCategory !== '할 일');
  $('#schedulePanel').classList.toggle('hidden', !onDashboard);
  $('#knowledgeBlock').classList.toggle('hidden', onDashboard);
  // 대시보드일 때만 두 카드가 남은 화면 높이를 채우도록 한다(레이아웃 높이 전용).
  $('.main-scroll').classList.toggle('dash-fill', onDashboard);
  $('#pageCategories').classList.toggle('hidden', Boolean(term));
  paintIcons($('#pageGrid'));
  // 카드 본문을 누르면 상세로 연다(버튼 클릭은 제외).
  $('#pageGrid').querySelectorAll('.page-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('button') || event.target.closest('a')) return;
      openDetailFromCard(card);
    });
  });
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
      setTodoDone(todo, !todo.done); saveTodos(); renderTodos(); renderLibrary();
    };
  });
  $('#pageGrid').querySelectorAll('[data-memory-result]').forEach(card => {
    card.querySelector('[data-memory-open]').onclick = () => {
      $('#memorySearch').value = pageSearchCommitted;
      $('#memoryModal').classList.remove('hidden');
      markMemoryOpen(true);
      renderMemories();
    };
  });
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
const isTodoEntry = (item) => Boolean(item) && (!item.type || item.type === 'todo');
const TODO_PREVIEW = 6;
let todoTab = 'active';            // 'active' = 할 일, 'done' = 완료
let todoUndo = null;               // 실행 취소용 직전 상태

// 완료 처리는 지우는 게 아니라 '완료' 목록으로 옮기는 것이다(원본은 그대로 남는다).
function setTodoDone(todo, done) {
  todo.done = Boolean(done);
  if (todo.done) todo.doneAt = nowIso();
  else delete todo.doneAt;
  touch(todo);
}
function todoDoneLabel(todo) {
  const when = todo.doneAt || todo.updatedAt;
  return when ? savedLabel({ createdAt: when }) : '완료일 확인';
}
function activeTodos() {
  return alive(todos).filter(isTodoEntry).filter(todo => !todo.done)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || updatedTime(b) - updatedTime(a));
}
function doneTodos() {
  return alive(todos).filter(isTodoEntry).filter(todo => todo.done)
    .sort((a, b) => String(b.doneAt || b.updatedAt || '').localeCompare(String(a.doneAt || a.updatedAt || '')));
}

function renderTodos() {
  const panel = $('#todayPanel');
  const onTodoView = pageCategory === '할 일';
  const searching = Boolean(pageSearchCommitted.trim());
  // 검색 중이거나 다른 화면이면 상단 할 일 카드는 접어 둔다.
  panel.classList.toggle('hidden', searching || !(pageCategory === '대시보드' || onTodoView));

  const active = activeTodos();
  const done = doneTodos();
  const expanded = showAllTodos || onTodoView;
  const list = todoTab === 'done' ? done : (expanded ? active : active.slice(0, TODO_PREVIEW));

  panel.innerHTML = `
    <div class="block-head">
      <div>
        <h2>오늘의 할 일</h2>
        <div class="todo-tabs">
          <button type="button" class="todo-tab ${todoTab === 'active' ? 'active' : ''}" data-todo-tab="active">할 일 <span>${active.length}</span></button>
          <button type="button" class="todo-tab ${todoTab === 'done' ? 'active' : ''}" data-todo-tab="done">완료 <span>${done.length}</span></button>
        </div>
      </div>
      ${todoTab === 'done'
        ? (done.length ? `<button type="button" class="ghost-btn" id="todoClearDone">완료 목록 비우기</button>` : '')
        : (active.length > TODO_PREVIEW && !onTodoView ? `<button type="button" class="ghost-btn" id="todoToggle">${expanded ? '접기' : '전체 보기'}</button>` : '')}
    </div>
    <div class="todo-list">${list.length ? list.map(todo => todoTab === 'done' ? `
      <div class="todo-item done" data-todo-id="${todo.id}">
        <span class="todo-check done">${icon('check', 13)}</span>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <time>${escapeHtml(todo.date || '날짜 확인')}</time>
        <time class="todo-doneat">완료 ${escapeHtml(todoDoneLabel(todo))}</time>
        <button type="button" class="todo-mini" data-todo-restore title="복구">복구</button>
        <button type="button" class="todo-mini danger" data-todo-purge title="영구 삭제">삭제</button>
      </div>` : `
      <label class="todo-item" data-todo-id="${todo.id}">
        <input type="checkbox">
        <span class="todo-check">${icon('check', 13)}</span>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <time>${escapeHtml(todo.date || '날짜 확인')}</time>
        <button type="button" class="todo-mini" data-todo-edit title="수정">${icon('pencil', 13)}</button>
        <button type="button" class="todo-remove" data-todo-delete title="삭제">${icon('more', 14)}</button>
      </label>`).join('') : `<div class="todo-empty">${todoTab === 'done' ? '완료한 할 일이 없습니다.' : '지식창에 “할일 내용”을 입력해보세요.'}</div>`}</div>`;

  panel.querySelectorAll('[data-todo-tab]').forEach(button => {
    button.onclick = () => { todoTab = button.dataset.todoTab; renderTodos(); };
  });
  const toggle = $('#todoToggle');
  if (toggle) toggle.onclick = () => { showAllTodos = !showAllTodos; renderTodos(); };
  const clearDone = $('#todoClearDone');
  if (clearDone) clearDone.onclick = () => {
    const rows = doneTodos();
    if (!rows.length || !confirm(`완료한 할 일 ${rows.length}개를 영구 삭제할까요? 되돌릴 수 없습니다.`)) return;
    rows.forEach(todo => { todo.deleted = true; touch(todo); });
    saveTodos(); renderTodos(); renderLibrary();
    showToast('완료 목록을 비웠습니다');
  };

  panel.querySelectorAll('[data-todo-id]').forEach(row => {
    const todo = todos.find(x => x.id === row.dataset.todoId);
    const check = row.querySelector('input');
    if (check) check.onchange = () => completeTodo(todo, row);
    const edit = row.querySelector('[data-todo-edit]');
    if (edit) edit.onclick = event => { event.preventDefault(); openTodoModal(todo); };
    const remove = row.querySelector('[data-todo-delete]');
    if (remove) remove.onclick = event => {
      event.preventDefault();
      todo.deleted = true; touch(todo);
      saveTodos(); renderTodos(); renderLibrary();
    };
    const restore = row.querySelector('[data-todo-restore]');
    if (restore) restore.onclick = () => {
      setTodoDone(todo, false);
      saveTodos(); renderTodos(); renderLibrary();
      showToast('할 일로 되돌렸습니다');
    };
    const purge = row.querySelector('[data-todo-purge]');
    if (purge) purge.onclick = () => {
      if (!confirm(`「${todo.text}」 을(를) 영구 삭제할까요? 되돌릴 수 없습니다.`)) return;
      todo.deleted = true; touch(todo);
      saveTodos(); renderTodos(); renderLibrary();
      showToast('영구 삭제했습니다');
    };
  });
}

// 체크하면 목록에서 바로 빠지고, 잠시 동안 되돌릴 수 있다.
function completeTodo(todo, row) {
  if (!todo) return;
  setTodoDone(todo, true);
  if (row) row.classList.add('just-changed');
  saveTodos();
  setTimeout(() => { renderTodos(); renderLibrary(); }, 200);
  todoUndo = { id: todo.id };
  showUndoToast('완료로 옮겼습니다', () => {
    const target = todos.find(x => x.id === todoUndo.id);
    if (!target) return;
    setTodoDone(target, false);
    saveTodos(); renderTodos(); renderLibrary();
    showToast('되돌렸습니다');
  });
}

// ── 할 일 수정 ────────────────────────────────────────────────
let editingTodoId = null;
function openTodoModal(todo) {
  if (!todo) return;
  editingTodoId = todo.id;
  $('#todoEditText').value = todo.text || '';
  $('#todoEditDate').value = todo.date || '';
  $('#todoModal').classList.remove('hidden');
  setTimeout(() => $('#todoEditText').focus(), 50);
}
function closeTodoModal() { $('#todoModal').classList.add('hidden'); editingTodoId = null; }
$('#todoModalClose').addEventListener('click', closeTodoModal);
$('#todoEditCancel').addEventListener('click', closeTodoModal);
$('#todoModal').addEventListener('click', event => { if (event.target.id === 'todoModal') closeTodoModal(); });
$('#todoForm').addEventListener('submit', event => {
  event.preventDefault();
  const todo = todos.find(x => x.id === editingTodoId);
  const text = $('#todoEditText').value.trim();
  if (!todo || !text) return;
  todo.text = text;
  todo.date = $('#todoEditDate').value || todo.date;
  touch(todo);
  saveTodos(); renderTodos(); renderLibrary(); closeTodoModal();
  showToast('할 일 수정됨');
});

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
function markMemoryOpen(open) {
  const button = $('#memoryToggle');          // 상단 메뉴가 그려진 뒤에만 있다
  if (button) button.classList.toggle('active', open);
}
function openMemoryLibrary() {
  $('#memoryModal').classList.remove('hidden');
  markMemoryOpen(true);
  renderMemories();
  setTimeout(() => $('#memorySearch').focus(), 50);
}
function closeMemoryLibrary() { $('#memoryModal').classList.add('hidden'); markMemoryOpen(false); }
$('#memoryClose').addEventListener('click', closeMemoryLibrary);
$('#memoryModal').addEventListener('click', event => { if (event.target.id === 'memoryModal') closeMemoryLibrary(); });
$('#memorySearch').addEventListener('input', renderMemories);
// ── 검색 미리보기 ─────────────────────────────────────────────
// 입력하는 즉시 검색창 아래에 "기능 바로가기 + 저장된 자료"를 보여 준다.
// Enter 전체 검색과 기존 검색 화면·검색 함수는 그대로 두고 위에 얹는 기능이다.
const PREVIEW_ACTION_MAX = 5;      // 기능 바로가기 최대 개수
const PREVIEW_KIND_MAX = 5;        // 자료 종류별 최대 개수
const PREVIEW_DATA_MAX = 10;       // 자료 결과 전체 최대 개수
let previewRows = [];              // 지금 화면에 보이는 미리보기 줄
let previewIndex = -1;             // 방향키로 고른 줄
let previewTimer = null;
let previewComposing = false;      // 한글 조합 중인지

function markSearchIndexDirty() { searchIndexDirty = true; }

// 화면 안 기능 — 실제로 있는 메뉴·버튼·바로가기만 넣는다(없는 경로를 만들지 않는다).
function actionEntries() {
  const rows = NAV_ITEMS.map(item => {
    const target = item.category || item.name;
    const lead = VIEW_LEAD[target] || [];
    return { key: `nav:${target}`, icon: item.icon, name: item.name,
      desc: lead[1] || '', where: '메뉴', run: () => goToView(target) };
  });
  rows.push({ key: 'nav:mail', icon: 'link', name: '메일함',
    desc: '협력업체에 한 곳씩 따로 메일을 보냅니다.', where: '메뉴', run: openMailbox });
  rows.push({ key: 'nav:memory', icon: 'bookmark', name: '기억 저장소',
    desc: '메모처럼 남겨 둔 기록을 모아 봅니다.', where: '메뉴', run: openMemoryLibrary });
  rows.push({ key: 'act:add', icon: 'plus', name: '지식 추가',
    desc: '기억·할 일·업무지식·연락처·계정을 새로 저장합니다.', where: '기능', run: openAddModal });
  rows.push({ key: 'act:schedule', icon: 'clock', name: '일정 추가',
    desc: '날짜·시간·메모를 적어 일정을 등록합니다.', where: '기능',
    run: () => { goToView('대시보드'); openScheduleModal(null, todayKey()); } });
  rows.push({ key: 'act:sync', icon: 'settings', name: '동기화 설정',
    desc: '클라우드 연동 상태를 확인하고 PIN 으로 로그인합니다.', where: '설정',
    run: () => $('#syncOpen').click() });
  rows.push({ key: 'act:backup', icon: 'download', name: '데이터 백업',
    desc: '지금까지 저장한 자료를 파일로 내려받습니다.', where: '설정',
    run: () => $('#resetBackup').click() });
  rows.push({ key: 'act:reset', icon: 'refresh', name: '초기화',
    desc: '이 컴퓨터 사본 또는 전체 자료를 정리합니다.', where: '설정', run: openResetModal });
  // 즐겨찾기는 카드와 똑같이 화면 오른쪽 절반 창으로 연다.
  for (const item of sortedShortcuts()) {
    const href = shortcutHref(item.url);
    if (!href) continue;
    rows.push({ key: `shortcut:${item.id}`, icon: 'link', name: item.name,
      desc: href.replace(/^https?:\/\//, '').replace(/\/$/, ''), where: '바로가기',
      run: () => openShortcutSite(item) });
  }
  return rows;
}

// 저장된 자료 — 기존 검색이 쓰던 배열을 그대로 재사용한다.
function dataEntries() {
  const rows = [];
  const push = (kind, key, title, sub, extra, run) =>
    rows.push({ kind, key, title: String(title || ''), sub: String(sub || ''), extra: String(extra || ''), run });

  for (const item of alive(knowledge)) {
    const kind = findCategory(item) === '업무지식' ? '업무지식' : '지식';
    push(kind, `k:${item.id}`, item.title, item.answer, (item.aliases || []).join(' '),
      () => showDetail(findCategory(item), item.title, item.answer,
        [['저장', savedLabel(item)], ['검색어', (item.aliases || []).join(', ')], ['출처', item.source]]));
  }
  for (const item of alive(todos).filter(isTodoEntry)) {
    push('할 일', `t:${item.id}`, item.text, `${item.date || '날짜 확인'} · ${item.done ? '완료' : '진행중'}`, '',
      () => showDetail('할 일', '', item.text, [['날짜', item.date], ['상태', item.done ? '완료' : '진행중'], ['출처', item.source]]));
  }
  for (const item of alive(memories)) {
    push('기억', `m:${item.id}`, item.text, savedLabel(item), '',
      () => showDetail('기억', '', item.text, [['저장', savedLabel(item)], ['출처', item.source]]));
  }
  for (const item of alive(schedule)) {
    push('일정', `s:${item.id}`, item.title, `${scheduleDayTitle(item.date)}${item.time ? ` · ${item.time}` : ''}`, item.memo,
      () => showDetail('일정', item.title, item.memo || '', [['날짜', item.date], ['시간', item.time]]));
  }
  for (const item of alive(accountMeta)) {
    push('계정', `a:${item.id}`, item.service, item.user, item.url,
      () => { goToView('계정'); showToast('계정 화면에서 확인하세요'); });
  }
  for (const item of partners) {
    push('업체', `p:${item.name}`, item.name, [item.phone, item.email].filter(Boolean).join(' · '), '',
      () => showDetail('협력업체', item.name, '', [['전화', item.phone], ['이메일', item.email]]));
  }
  for (const item of patents) {
    push('특허', `pt:${item.num || item.name}`, item.num || item.status || '번호 확인', item.name,
      patentText(item), () => showDetail(item.kind, item.num || item.status, item.name,
        [['공종', (item.gongjong || []).join(' · ')], ['공법', item.gongbeop], ['특허권자', item.owner], ['상태', patentStatusNote(item)]]));
  }
  return rows;
}

// 한 번 만들어 두고 자료가 바뀔 때만 다시 만든다(입력할 때마다 다시 읽지 않는다).
function getSearchIndex() {
  if (searchIndex && !searchIndexDirty) return searchIndex;
  const actions = actionEntries().map(row => ({ ...row, type: 'action', nameNorm: normalize(row.name), bodyNorm: normalize(`${row.desc} ${row.where}`) }));
  const data = dataEntries().map(row => ({ ...row, type: 'data',
    doc: buildSearchDoc({ title: row.title, body: row.sub, extra: row.extra, keywords: row.keywords || '' }),
    digits: row.kind === '특허' ? patentDigits(`${row.title} ${row.extra}`) : '' }));
  searchIndex = { actions, data };
  searchIndexDirty = false;
  return searchIndex;
}

// 우선순위: 기능명 완전일치 > 기능명으로 시작 > 기능명 포함 > 제목 완전일치 > 제목 포함 > 본문 포함
function previewSearch(query) {
  const raw = String(query || '').trim();
  const q = normalize(raw);
  if (!q) return { actions: [], data: [], total: 0 };
  const index = getSearchIndex();
  const digits = patentDigits(raw);

  const parsed = buildSearchQuery(raw);
  const actions = [];
  for (const row of index.actions) {
    let points = 0;
    if (row.nameNorm === q) points = 100;
    else if (row.nameNorm.startsWith(q)) points = 90;
    else if (row.nameNorm.includes(q)) points = 70;
    else if (row.bodyNorm.includes(q)) points = 40;
    if (points) actions.push({ ...row, points });
  }
  actions.sort((a, b) => b.points - a.points || a.name.length - b.name.length);

  // 저장된 자료는 유사 표현·붙여쓰기·조사 차이까지 함께 본다(search-rules.js).
  const data = [];
  for (const row of index.data) {
    if (digits.length >= 4 && row.digits && row.digits.includes(digits)) {
      data.push({ ...row, points: 850, reason: '번호가 일치' });
      continue;
    }
    const found = matchSearchDoc(row.doc, parsed);
    if (found) data.push({ ...row, points: found.points, reason: found.reason });
  }
  data.sort((a, b) => b.points - a.points || a.title.length - b.title.length);

  // 같은 자료가 여러 번 나오지 않게 한 번만 담고, 종류별로도 개수를 제한한다.
  const seen = new Set();
  const perKind = new Map();
  const picked = [];
  for (const row of data) {
    if (seen.has(row.key)) continue;
    const used = perKind.get(row.kind) || 0;
    if (used >= PREVIEW_KIND_MAX) continue;
    seen.add(row.key);
    perKind.set(row.kind, used + 1);
    picked.push(row);
    if (picked.length >= PREVIEW_DATA_MAX) break;
  }
  const topActions = actions.slice(0, PREVIEW_ACTION_MAX);
  return { actions: topActions, data: picked, total: topActions.length + picked.length };
}

// 검색어와 겹치는 부분만 진한 남색으로 (형광 배경은 쓰지 않는다)
function markHit(text, query) {
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
    out += escapeHtml(raw.slice(from, at)) + `<b class="preview-hit">${escapeHtml(raw.slice(at, at + needle.length))}</b>`;
    from = at + needle.length;
  }
  return out + escapeHtml(raw.slice(from));
}

function closeSearchPreview() {
  clearTimeout(previewTimer);
  previewRows = [];
  previewIndex = -1;
  const box = $('#searchPreview');
  if (box) { box.classList.add('hidden'); box.innerHTML = ''; }
  $('#pageSearch').setAttribute('aria-expanded', 'false');
}

function renderSearchPreview(query) {
  const box = $('#searchPreview');
  const raw = String(query || '').trim();
  if (!raw) return closeSearchPreview();

  const { actions, data } = previewSearch(raw);
  previewRows = [];
  let html = '';

  if (actions.length) {
    html += `<div class="preview-group"><div class="preview-head">기능 바로가기</div>`;
    for (const row of actions) {
      html += `<button type="button" class="preview-item" data-preview="${previewRows.length}">
        <span class="preview-icon">${icon(row.icon, 15)}</span>
        <span class="preview-body"><b>${markHit(row.name, raw)}</b>${row.desc ? `<small>${markHit(row.desc, raw)}</small>` : ''}</span>
        <span class="preview-where">${escapeHtml(row.where)}</span>
      </button>`;
      previewRows.push(row);
    }
    html += `</div>`;
  }
  if (data.length) {
    html += `<div class="preview-group"><div class="preview-head">검색 결과</div>`;
    for (const row of data) {
      html += `<button type="button" class="preview-item" data-preview="${previewRows.length}">
        <span class="preview-tag">${escapeHtml(row.kind)}</span>
        <span class="preview-body"><b>${markHit(row.title, raw)}</b>${row.sub ? `<small>${markHit(row.sub, raw)}</small>` : ''}</span>
        ${row.reason ? `<span class="preview-where">${escapeHtml(row.reason)}</span>` : ''}
      </button>`;
      previewRows.push(row);
    }
    html += `</div>`;
  }
  if (!previewRows.length) {
    html += `<div class="preview-empty">‘${escapeHtml(raw)}’와 일치하는 기능이나 자료가 없습니다.</div>`;
    html += `<button type="button" class="preview-foot" data-preview="${previewRows.length}">＋ 새 지식 추가</button>`;
    previewRows.push({ type: 'action', name: '지식 추가', run: openAddModal });
  }
  html += `<button type="button" class="preview-foot" data-preview="${previewRows.length}">
    ‘${escapeHtml(raw)}’ 전체 결과 보기<kbd>Enter</kbd></button>`;
  previewRows.push({ type: 'search', name: '전체 결과 보기', run: () => runFullSearch(raw) });

  box.innerHTML = html;
  box.classList.remove('hidden');
  $('#pageSearch').setAttribute('aria-expanded', 'true');
  previewIndex = -1;
  box.querySelectorAll('[data-preview]').forEach(node => {
    node.onmousedown = event => event.preventDefault();   // 눌러도 검색창 포커스를 잃지 않는다
    node.onclick = () => runPreviewRow(Number(node.dataset.preview));
  });
}

function paintPreviewCursor() {
  const box = $('#searchPreview');
  if (!box) return;
  box.querySelectorAll('[data-preview]').forEach(node => {
    const on = Number(node.dataset.preview) === previewIndex;
    node.classList.toggle('on', on);
    if (on) node.scrollIntoView({ block: 'nearest' });
  });
}

function movePreview(step) {
  const total = previewRows.length;
  if (!total) return;
  if (previewIndex === -1) previewIndex = step > 0 ? 0 : total - 1;
  else {
    previewIndex += step;
    if (previewIndex >= total) previewIndex = -1;   // 끝에서 한 번 더 누르면 선택 해제(입력창으로)
    else if (previewIndex < -1) previewIndex = total - 1;
  }
  paintPreviewCursor();
}

function runPreviewRow(at) {
  const row = previewRows[at];
  if (!row) return;
  closeSearchPreview();
  if (row.type !== 'search') { $('#pageSearch').value = ''; pageSearchCommitted = ''; }
  row.run();
}

// 기존 전체 검색(엔터) — 이 동작은 그대로 둔다.
function runFullSearch(text) {
  const typed = String(text === undefined ? $('#pageSearch').value : text);
  $('#pageSearch').value = typed;
  const view = viewForSearch(typed);
  if (view) return goToView(view);
  const entry = entryFromCommand(typed, '사이트 검색창');
  if (entry) {
    goToView(entry.view);
    commitEntry(entry.item, entry.kind);
    return;
  }
  pageSearchCommitted = typed.trim();
  if (pageSearchCommitted && pageCategory === '대시보드') { viewBeforeSearch = pageCategory; pageCategory = '전체'; }
  if (!pageSearchCommitted && viewBeforeSearch) { pageCategory = viewBeforeSearch; viewBeforeSearch = ''; }
  renderAll();
}

$('#pageSearch').addEventListener('compositionstart', () => { previewComposing = true; });
$('#pageSearch').addEventListener('compositionend', () => {
  previewComposing = false;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => renderSearchPreview($('#pageSearch').value), 180);
});
$('#pageSearch').addEventListener('focus', () => {
  if ($('#pageSearch').value.trim()) renderSearchPreview($('#pageSearch').value);
});
// 바깥을 누르면 닫는다(드롭다운 안쪽은 mousedown 을 막아 두어 먼저 닫히지 않는다).
document.addEventListener('click', event => {
  const node = event.target;
  if (!node || typeof node.closest !== 'function' || !node.closest('.search-wrap')) closeSearchPreview();
});

$('#pageSearch').addEventListener('input', event => {
  const typed = event.currentTarget.value;
  clearTimeout(previewTimer);
  if (!typed.trim()) closeSearchPreview();
  else if (!previewComposing) previewTimer = setTimeout(() => renderSearchPreview(typed), 180);
  if (typed.trim() || !pageSearchCommitted) return;
  pageSearchCommitted = '';   // 검색어를 지우면 바로 원래 화면으로 돌아간다
  if (viewBeforeSearch) { pageCategory = viewBeforeSearch; viewBeforeSearch = ''; }
  renderAll();
});
$('#pageSearch').addEventListener('keydown', event => {
  const open = !$('#searchPreview').classList.contains('hidden');
  if (event.key === 'Escape') { if (open) { event.preventDefault(); closeSearchPreview(); } return; }
  if (event.key === 'ArrowDown' && open) { event.preventDefault(); return movePreview(1); }
  if (event.key === 'ArrowUp' && open) { event.preventDefault(); return movePreview(-1); }
  if (event.key !== 'Enter') return;
  // 한글 조합 중 Enter 는 글자를 확정하는 것이라 검색을 실행하지 않는다.
  if (event.isComposing || previewComposing || event.keyCode === 229) return;
  event.preventDefault();
  if (open && previewIndex >= 0) return runPreviewRow(previewIndex);   // 고른 항목 실행
  closeSearchPreview();
  const typed = event.currentTarget.value;
  const view = viewForSearch(typed);
  if (view) return goToView(view);      // "할일" 처럼 화면 이름이면 그 목록으로 바로 이동

  // "할일 한솔" 처럼 내용이 붙어 있으면 저장하고 그 목록으로 이동한다
  const entry = entryFromCommand(typed, '사이트 검색창');
  if (entry) {
    goToView(entry.view);
    commitEntry(entry.item, entry.kind);
    return;
  }
  pageSearchCommitted = event.currentTarget.value.trim();
  if (pageSearchCommitted && pageCategory === '대시보드') { viewBeforeSearch = pageCategory; pageCategory = '전체'; }
  if (!pageSearchCommitted && viewBeforeSearch) { pageCategory = viewBeforeSearch; viewBeforeSearch = ''; }
  renderAll();
});

// ── 카드 상세 보기 ─────────────────────────────────────────────
let detailText = '';
function showDetail(kind, title, body, meta, item = null) {
  // 지식(업무지식·연락처·기타)일 때만 상세 창에서 바로 수정·삭제할 수 있다.
  detailItemId = item && item.id ? item.id : null;
  $('#detailEdit').classList.toggle('hidden', !detailItemId);
  $('#detailDelete').classList.toggle('hidden', !detailItemId);
  detailText = [title, body].filter(Boolean).join('\n');
  $('#detailKind').textContent = kind;
  $('#detailTitle').textContent = title || '';
  $('#detailTitle').classList.toggle('hidden', !title);
  $('#detailBody').textContent = body || '';
  $('#detailMeta').innerHTML = (meta || []).filter(row => row[1]).map(row => `<div><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`).join('');
  $('#detailModal').classList.remove('hidden');
}
function closeDetail() { $('#detailModal').classList.add('hidden'); }
$('#detailClose').addEventListener('click', closeDetail);
$('#detailModal').addEventListener('click', event => { if (event.target.id === 'detailModal') closeDetail(); });
$('#detailCopy').addEventListener('click', () => copyText(detailText));
$('#detailEdit').addEventListener('click', () => {
  const item = knowledge.find(x => x.id === detailItemId);
  if (!item) return;
  closeDetail();
  openEditor(item);
});
$('#detailDelete').addEventListener('click', () => {
  const item = knowledge.find(x => x.id === detailItemId);
  if (item && removeItem(item)) closeDetail();
});

function openDetailFromCard(card) {
  const data = card.dataset;
  if (data.id) {
    const item = knowledge.find(x => x.id === data.id);
    if (item) showDetail(findCategory(item), item.title, item.answer,
      [['저장', savedLabel(item)], ['검색어', (item.aliases || []).join(', ')], ['출처', item.source]], item);
  } else if (data.memoryResult) {
    const item = memories.find(x => x.id === data.memoryResult);
    if (item) showDetail('기억', '', item.text, [['저장', savedLabel(item)], ['출처', item.source]]);
  } else if (data.todoResult) {
    const item = todos.find(x => x.id === data.todoResult);
    if (item) showDetail('할 일', '', item.text, [['날짜', item.date], ['상태', item.done ? '완료' : '진행중'], ['출처', item.source]]);
  } else if (data.patentKey) {
    const item = patents.find(x => (x.num || x.name) === data.patentKey);
    if (item) showDetail(item.kind, item.num || item.status, item.name,
      [['공종', (item.gongjong || []).join(' · ')], ['공법', item.gongbeop], ['특허권자', item.owner], ['상태', patentStatusNote(item)]]);
  } else if (data.partnerIndex) {
    const item = partners[Number(data.partnerIndex)];
    if (item) showDetail('협력업체', item.name, '', [['전화', item.phone], ['이메일', item.email]]);
  }
}

// ── 지식 추가 ──────────────────────────────────────────────────
let addKind = '';
function openAddModal() {
  addKind = '';
  $('#quickTextForm').classList.add('hidden');
  $('.add-kinds').classList.remove('hidden');
  $('#addModal').classList.remove('hidden');
  paintIcons($('#addModal'));
}
function closeAddModal() { $('#addModal').classList.add('hidden'); }
$('#pageAdd').addEventListener('click', openAddModal);
$('#addClose').addEventListener('click', closeAddModal);
$('#addModal').addEventListener('click', event => { if (event.target.id === 'addModal') closeAddModal(); });
$('#quickTextCancel').addEventListener('click', () => {
  $('#quickTextForm').classList.add('hidden');
  $('.add-kinds').classList.remove('hidden');
});
document.querySelectorAll('[data-add]').forEach(button => {
  button.onclick = () => {
    addKind = button.dataset.add;
    if (addKind === '계정') { closeAddModal(); return openVault(); }
    if (addKind === '기억' || addKind === '할 일') {
      $('.add-kinds').classList.add('hidden');
      $('#quickTextLabel').textContent = addKind === '기억' ? '기억할 내용' : '할 일 내용';
      $('#quickTextInput').value = '';
      $('#quickTextForm').classList.remove('hidden');
      setTimeout(() => $('#quickTextInput').focus(), 50);
      return;
    }
    closeAddModal();
    openNewEditor(addKind);   // 업무지식 · 연락처는 기존 지식 편집기로
  };
});
$('#quickTextForm').addEventListener('submit', async event => {
  event.preventDefault();
  const text = $('#quickTextInput').value.trim();
  if (!text) return;
  const item = addKind === '할 일' ? createTodo(text, '사이트') : createMemory(text, '사이트');
  if (!item) return;
  closeAddModal();
  await commitEntry(item, addKind === '할 일' ? 'todo' : 'memory');
});

// ── ⋯ 메뉴 (수정 · 삭제) ──────────────────────────────────────
let openMenu = null;
function closeRowMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
function openRowMenu(anchor, actions) {
  closeRowMenu();
  const menu = document.createElement('div');
  menu.className = 'row-menu';
  menu.innerHTML = actions
    .map((action, index) => `<button type="button" data-index="${index}" class="${action.danger ? 'danger' : ''}">${escapeHtml(action.label)}</button>`)
    .join('');
  document.body.append(menu);
  const rect = anchor.getBoundingClientRect();
  menu.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - menu.offsetHeight - 10)}px`;
  menu.style.left = `${Math.min(rect.left, window.innerWidth - menu.offsetWidth - 10)}px`;
  menu.querySelectorAll('button').forEach(button => {
    button.onclick = () => { closeRowMenu(); actions[Number(button.dataset.index)].run(); };
  });
  openMenu = menu;
}
document.addEventListener('click', event => {
  if (openMenu && !openMenu.contains(event.target) && !event.target.closest('[data-row-menu]')) closeRowMenu();
}, true);
window.addEventListener('resize', closeRowMenu);
document.addEventListener('scroll', closeRowMenu, true);

function deleteSchedule(item) {
  if (!item || !confirm(`「${item.title}」 일정을 지울까요?`)) return;
  item.deleted = true; touch(item);
  saveLocalState(); queueCloudSave(); renderSchedule();
  showToast('일정 삭제됨');
}

// ── 빠른 전화 메모 (화면에서 제거됨) ────────────────────────
// 카드는 대시보드에서 뺐지만, 이미 저장돼 있던 메모 내용은 지우지 않는다.
// 클라우드 문서는 통째로 덮어쓰므로 저장돼 있던 값을 읽은 그대로 되돌려 둔다.
const QUICK_MEMO_FIELD = 'quickPhoneMemoDraft';       // Firebase 문서 필드
function keepQuickMemoField(remote) {
  const kept = remote && remote[QUICK_MEMO_FIELD];
  return kept === undefined ? {} : { [QUICK_MEMO_FIELD]: kept };
}


// ── 메일함 ───────────────────────────────────────────────────
// 협력업체에 한 곳씩 따로 메일을 보낸다. 문구(제목·내용)는 저장해 두고 골라 쓴다.
// 이 사이트는 서버가 없어서 실제 발송은 사용자가 연결한 발송 서비스를 거친다.
const MAIL_TOKENS = ['{{업체명}}', '{{이메일}}', '{{전화}}', '{{오늘}}'];
const MAIL_GAS_CODE = `function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  if (body.token !== '여기에-암호말') {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: '암호말이 다릅니다' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  try {
    MailApp.sendEmail({
      to: body.to,
      subject: body.subject,
      body: body.body,
      name: body.fromName || undefined,
      replyTo: body.replyTo || undefined
    });
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

let mailTab = 'write';
let mailPicked = new Set();          // 선택한 협력업체 이메일
let mailSending = false;
let mailStopRequested = false;
let mailEditingTemplateId = null;
let mailLogFailedOnly = false;

function readMailConfig() {
  const empty = { provider: 'emailjs', serviceId: '', templateId: '', publicKey: '',
                  gasUrl: '', gasToken: '', fromName: '', replyTo: '', updatedAt: '' };
  try {
    const raw = JSON.parse(localStorage.getItem('knowledge-mail-config') || 'null');
    if (raw && typeof raw === 'object') return { ...empty, ...raw };
  } catch { /* 값이 깨져 있어도 설정을 지우지는 않는다 */ }
  return empty;
}
function writeMailConfig(next) {
  mailConfig = { ...mailConfig, ...next, updatedAt: nowIso() };
  try { localStorage.setItem('knowledge-mail-config', JSON.stringify(mailConfig)); } catch { /* noop */ }
}
// 설정도 다른 기기와 맞춘다 — updatedAt 이 더 최근인 쪽을 남긴다.
function newerMailConfig(mine, theirs) {
  if (!theirs || typeof theirs !== 'object') return mine;
  if (!mine.updatedAt) return theirs.updatedAt ? { ...mine, ...theirs } : mine;
  if (!theirs.updatedAt) return mine;
  return String(theirs.updatedAt) > String(mine.updatedAt) ? { ...mine, ...theirs } : mine;
}
function mailConfigReady() {
  if (mailConfig.provider === 'gas') return Boolean(mailConfig.gasUrl.trim());
  return Boolean(mailConfig.serviceId.trim() && mailConfig.templateId.trim() && mailConfig.publicKey.trim());
}

// 협력업체 중 메일 주소가 있는 곳만 대상으로 한다.
function mailPartners() {
  return partners.filter(item => String(item.email || '').includes('@'));
}
function mailFill(text, partner) {
  const today = new Date();
  const day = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  return String(text || '')
    .replaceAll('{{업체명}}', String(partner?.name || ''))
    .replaceAll('{{이메일}}', String(partner?.email || ''))
    .replaceAll('{{전화}}', String(partner?.phone || ''))
    .replaceAll('{{오늘}}', day);
}

// ── 실제 발송 ────────────────────────────────────────────────
// 한 통 보내고 성공/실패를 그대로 돌려준다. 실패해도 다음 곳으로 넘어간다.
async function sendOneMail(to, subject, body) {
  const config = mailConfig;
  if (config.provider === 'gas') {
    const response = await fetch(config.gasUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // Apps Script 는 이 형식이어야 통과한다
      body: JSON.stringify({ token: config.gasToken, to, subject, body,
        fromName: config.fromName || '', replyTo: config.replyTo || '' })
    });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* 응답이 JSON 이 아니면 아래에서 그대로 알린다 */ }
    if (!response.ok) throw new Error(`발송 서버 응답 ${response.status}`);
    if (!data) throw new Error('발송 서버 응답을 읽지 못했습니다 (배포 설정을 확인해 주세요)');
    if (!data.ok) throw new Error(data.error || '발송 실패');
    return true;
  }
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: config.serviceId.trim(),
      template_id: config.templateId.trim(),
      user_id: config.publicKey.trim(),
      template_params: {
        to_email: to, subject, message: body,
        from_name: config.fromName || '', reply_to: config.replyTo || ''
      }
    })
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 120);
    throw new Error(detail || `발송 서비스 응답 ${response.status}`);
  }
  return true;
}

function addMailLog(partner, subject, ok, error) {
  mailLog.unshift(newEntry({
    type: 'mailLog', to: partner.email, name: partner.name || '',
    subject, ok: Boolean(ok), error: error ? String(error).slice(0, 200) : ''
  }, '메일함'));
  if (mailLog.length > 400) mailLog.length = 400;    // 기록이 끝없이 늘지 않게
}

async function runMailSend() {
  if (mailSending) return;
  if (!mailConfigReady()) {
    showToast('먼저 발송 설정에서 메일 보내는 방법을 연결해 주세요', 3000);
    return switchMailTab('setup');
  }
  const subject = $('#mailSubject').value.trim();
  const body = $('#mailBody').value;
  if (!subject) return showToast('제목을 적어 주세요');
  if (!body.trim()) return showToast('내용을 적어 주세요');
  const targets = mailPartners().filter(item => mailPicked.has(item.email));
  if (!targets.length) return showToast('보낼 곳을 한 곳 이상 선택해 주세요');
  if (!confirm(`${targets.length}곳에 한 곳씩 따로 보냅니다.\n보내고 나면 되돌릴 수 없습니다.\n진행할까요?`)) return;

  mailSending = true;
  mailStopRequested = false;
  $('#mailSend').disabled = true;
  $('#mailStop').classList.remove('hidden');
  $('#mailProgress').classList.remove('hidden');
  $('#mailProgress').innerHTML = '';

  let done = 0, failed = 0;
  for (const partner of targets) {
    if (mailStopRequested) break;
    const row = document.createElement('div');
    row.className = 'mail-progress-row';
    row.innerHTML = `<span class="mail-dot sending"></span><b></b><small>보내는 중…</small>`;
    row.querySelector('b').textContent = partner.name || partner.email;
    $('#mailProgress').prepend(row);
    try {
      await sendOneMail(partner.email, mailFill(subject, partner), mailFill(body, partner));
      done += 1;
      row.querySelector('.mail-dot').className = 'mail-dot ok';
      row.querySelector('small').textContent = '보냄';
      addMailLog(partner, mailFill(subject, partner), true, '');
    } catch (error) {
      failed += 1;
      row.querySelector('.mail-dot').className = 'mail-dot bad';
      row.querySelector('small').textContent = String(error.message || error);
      addMailLog(partner, mailFill(subject, partner), false, error.message || error);
    }
    $('#mailStatus').textContent = `${done + failed} / ${targets.length}곳 · 보냄 ${done} · 실패 ${failed}`;
    saveLocalState();
    if (done + failed < targets.length) await new Promise(resolve => setTimeout(resolve, 400));
  }

  mailSending = false;
  $('#mailSend').disabled = false;
  $('#mailStop').classList.add('hidden');
  queueCloudSave();
  renderMailLog();
  const stopped = mailStopRequested ? ' (중단됨)' : '';
  $('#mailStatus').textContent = `보냄 ${done}곳 · 실패 ${failed}곳${stopped}`;
  showToast(failed ? `보냄 ${done}곳 · 실패 ${failed}곳 — 보낸 기록에서 다시 보낼 수 있습니다` : `${done}곳에 보냈습니다`, 3000);
}

// ── 화면 그리기 ──────────────────────────────────────────────
function renderMailPartners() {
  const query = normalize($('#mailSearch').value || '');
  const list = mailPartners().filter(item => !query || normalize(`${item.name} ${item.email}`).includes(query));
  $('#mailPickedCount').textContent = `${mailPicked.size}곳 선택`;
  $('#mailPartners').innerHTML = list.length ? list.map(item => `
    <label class="mail-partner">
      <input type="checkbox" data-mail-pick="${escapeHtml(item.email)}" ${mailPicked.has(item.email) ? 'checked' : ''} />
      <span><b>${escapeHtml(item.name || '이름 없음')}</b><small>${escapeHtml(item.email)}</small></span>
    </label>`).join('') : '<p class="mail-empty">찾는 업체가 없습니다.</p>';
  $('#mailPartners').querySelectorAll('[data-mail-pick]').forEach(box => {
    box.onchange = () => {
      if (box.checked) mailPicked.add(box.dataset.mailPick); else mailPicked.delete(box.dataset.mailPick);
      $('#mailPickedCount').textContent = `${mailPicked.size}곳 선택`;
    };
  });
}

function renderMailTemplatePick() {
  const list = alive(mailTemplates);
  $('#mailTemplatePick').innerHTML = `<option value="">직접 쓰기</option>`
    + list.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('');
}

function renderMailTemplates() {
  const list = alive(mailTemplates);
  $('#mailTemplateList').innerHTML = list.length ? list.map(item => `
    <article class="mail-template" data-mail-template="${item.id}">
      <h4>${escapeHtml(item.name)}</h4>
      <p class="mail-template-subject">${escapeHtml(item.subject || '(제목 없음)')}</p>
      <pre>${escapeHtml(item.body || '')}</pre>
      <footer>
        <button type="button" class="ghost-btn" data-mail-use>메일 쓰기에 넣기</button>
        <button type="button" class="ghost-btn" data-mail-edit>수정</button>
        <button type="button" class="ghost-btn memo-danger" data-mail-del>삭제</button>
      </footer>
    </article>`).join('') : '<p class="mail-empty">저장해 둔 문구가 없습니다. 메일 쓰기에서 “이 문구 저장”을 누르면 여기에 쌓입니다.</p>';

  $('#mailTemplateList').querySelectorAll('[data-mail-template]').forEach(card => {
    const item = mailTemplates.find(x => x.id === card.dataset.mailTemplate);
    card.querySelector('[data-mail-use]').onclick = () => { applyMailTemplate(item); switchMailTab('write'); };
    card.querySelector('[data-mail-edit]').onclick = () => editMailTemplate(item);
    card.querySelector('[data-mail-del]').onclick = () => {
      if (!confirm(`「${item.name}」 문구를 삭제할까요?`)) return;
      item.deleted = true; touch(item);
      saveLocalState(); queueCloudSave(); renderMailTemplates(); renderMailTemplatePick();
      showUndoToast('문구 삭제됨', () => {
        item.deleted = false; touch(item);
        saveLocalState(); queueCloudSave(); renderMailTemplates(); renderMailTemplatePick();
      });
    };
  });
}

function applyMailTemplate(item) {
  if (!item) return;
  $('#mailTemplateName').value = item.name || '';
  $('#mailSubject').value = item.subject || '';
  $('#mailBody').value = item.body || '';
  $('#mailTemplatePick').value = item.id;
}
// 문구 관리에서 "수정"을 누르면 메일 쓰기 화면에 그대로 불러와 고친다.
function editMailTemplate(item) {
  applyMailTemplate(item);
  switchMailTab('write');
  setTimeout(() => $('#mailTemplateName').focus(), 50);
}
// asNew 가 true 면 고르고 있던 문구는 그대로 두고 새 문구로 하나 더 만든다.
function saveCurrentMailTemplate(asNew) {
  const subject = $('#mailSubject').value.trim();
  const body = $('#mailBody').value;
  if (!subject && !body.trim()) return showToast('저장할 내용이 없습니다');
  const name = $('#mailTemplateName').value.trim() || subject.slice(0, 30);
  if (!name) return showToast('문구 이름을 적어 주세요');

  const chosen = $('#mailTemplatePick').value;
  const existing = asNew ? null : (chosen ? mailTemplates.find(x => x.id === chosen && !x.deleted) : null);
  if (existing) {
    Object.assign(existing, { name, subject, body }); touch(existing);
    saveLocalState(); queueCloudSave(); renderMailTemplates(); renderMailTemplatePick();
    $('#mailTemplatePick').value = existing.id;
    return showToast('문구를 고쳤습니다');
  }
  const item = newEntry({ type: 'mailTemplate', name, subject, body }, '메일함');
  mailTemplates.unshift(item);
  saveLocalState(); queueCloudSave(); renderMailTemplates(); renderMailTemplatePick();
  $('#mailTemplatePick').value = item.id;
  $('#mailTemplateName').value = name;
  showToast('문구를 저장했습니다');
}

function renderMailLog() {
  const list = alive(mailLog).filter(item => !mailLogFailedOnly || !item.ok);
  $('#mailLogList').innerHTML = list.length ? list.map(item => `
    <div class="mail-log-row ${item.ok ? '' : 'bad'}">
      <span class="mail-dot ${item.ok ? 'ok' : 'bad'}"></span>
      <div>
        <b>${escapeHtml(item.name || item.to)}</b>
        <small>${escapeHtml(item.to)} · ${escapeHtml(savedLabel(item))}</small>
        <p>${escapeHtml(item.subject || '')}</p>
        ${item.ok ? '' : `<em>${escapeHtml(item.error || '실패')}</em>`}
      </div>
    </div>`).join('') : '<p class="mail-empty">보낸 기록이 없습니다.</p>';
}

function switchMailTab(name) {
  mailTab = name;
  $('#mailModal').querySelectorAll('.mail-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mailTab === name));
  $('#mailWrite').classList.toggle('hidden', name !== 'write');
  $('#mailTemplatePanel').classList.toggle('hidden', name !== 'template');
  $('#mailLogPanel').classList.toggle('hidden', name !== 'log');
  $('#mailSetupPanel').classList.toggle('hidden', name !== 'setup');
  if (name === 'template') renderMailTemplates();
  if (name === 'log') renderMailLog();
  if (name === 'setup') paintMailSetup();
}

function paintMailSetup() {
  $('#mailProvider').value = mailConfig.provider || 'emailjs';
  $('#mailServiceId').value = mailConfig.serviceId || '';
  $('#mailTemplateId').value = mailConfig.templateId || '';
  $('#mailPublicKey').value = mailConfig.publicKey || '';
  $('#mailGasUrl').value = mailConfig.gasUrl || '';
  $('#mailGasToken').value = mailConfig.gasToken || '';
  $('#mailFromName').value = mailConfig.fromName || '';
  $('#mailReplyTo').value = mailConfig.replyTo || '';
  $('#mailGasCode').textContent = MAIL_GAS_CODE;
  const gas = ($('#mailProvider').value === 'gas');
  $('#mailSetupGas').classList.toggle('hidden', !gas);
  $('#mailSetupEmailjs').classList.toggle('hidden', gas);
  $('#mailSetupState').textContent = mailConfigReady()
    ? '연결됨 — 이제 메일 쓰기에서 바로 보낼 수 있습니다.'
    : '아직 연결되지 않았습니다. 위 칸을 채우고 저장해 주세요.';
  $('#mailHint').textContent = mailConfigReady()
    ? '협력업체에 한 곳씩 따로 보냅니다'
    : '발송 설정을 먼저 연결해 주세요';
}

function openMailbox() {
  $('#mailModal').classList.remove('hidden');
  renderMailPartners();
  renderMailTemplatePick();
  paintMailSetup();
  switchMailTab(mailConfigReady() ? 'write' : 'setup');
  setTimeout(() => $('#mailSearch').focus(), 50);
}
function closeMailbox() {
  if (mailSending && !confirm('보내는 중입니다. 창을 닫아도 발송은 계속됩니다.\n닫을까요?')) return;
  $('#mailModal').classList.add('hidden');
}

function setupMailbox() {
  $('#mailClose').onclick = closeMailbox;
  $('#mailModal').addEventListener('click', event => { if (event.target.id === 'mailModal') closeMailbox(); });
  $('#mailModal').querySelectorAll('.mail-tab').forEach(tab => { tab.onclick = () => switchMailTab(tab.dataset.mailTab); });

  $('#mailSearch').addEventListener('input', renderMailPartners);
  $('#mailPickAll').onclick = () => {
    $('#mailPartners').querySelectorAll('[data-mail-pick]').forEach(box => mailPicked.add(box.dataset.mailPick));
    renderMailPartners();
  };
  $('#mailPickNone').onclick = () => { mailPicked.clear(); renderMailPartners(); };

  $('#mailTemplatePick').onchange = () => {
    const item = mailTemplates.find(x => x.id === $('#mailTemplatePick').value && !x.deleted);
    if (item) applyMailTemplate(item);
    else { $('#mailTemplateName').value = ''; }
  };
  $('#mailModal').querySelectorAll('[data-token]').forEach(chip => {
    chip.onclick = () => {
      const box = $('#mailBody');
      const at = box.selectionStart ?? box.value.length;
      box.value = box.value.slice(0, at) + chip.dataset.token + box.value.slice(box.selectionEnd ?? at);
      box.focus();
      box.selectionStart = box.selectionEnd = at + chip.dataset.token.length;
    };
  });
  $('#mailSaveTemplate').onclick = () => saveCurrentMailTemplate(false);
  $('#mailSaveTemplateNew').onclick = () => saveCurrentMailTemplate(true);
  $('#mailPreviewBtn').onclick = () => {
    const first = mailPartners().find(item => mailPicked.has(item.email)) || mailPartners()[0];
    const panel = $('#mailPreview');
    if (!first) { panel.textContent = '미리 볼 업체가 없습니다.'; panel.classList.remove('hidden'); return; }
    panel.innerHTML = `<b></b><i></i><pre></pre>`;
    panel.querySelector('b').textContent = `받는 곳: ${first.name} <${first.email}>`;
    panel.querySelector('i').textContent = mailFill($('#mailSubject').value, first);
    panel.querySelector('pre').textContent = mailFill($('#mailBody').value, first);
    panel.classList.remove('hidden');
  };
  $('#mailSend').onclick = runMailSend;
  $('#mailStop').onclick = () => { mailStopRequested = true; $('#mailStatus').textContent = '중단하는 중…'; };

  $('#mailTemplateNew').onclick = () => {
    $('#mailTemplatePick').value = '';
    $('#mailTemplateName').value = '';
    $('#mailSubject').value = '';
    $('#mailBody').value = '';
    switchMailTab('write');
    $('#mailTemplateName').focus();
  };

  $('#mailLogFailedOnly').onchange = () => { mailLogFailedOnly = $('#mailLogFailedOnly').checked; renderMailLog(); };
  $('#mailLogRetry').onclick = () => {
    const failedAddresses = alive(mailLog).filter(item => !item.ok).map(item => item.to);
    if (!failedAddresses.length) return showToast('실패한 곳이 없습니다');
    mailPicked = new Set(failedAddresses.filter(address => mailPartners().some(item => item.email === address)));
    renderMailPartners();
    switchMailTab('write');
    showToast(`실패한 ${mailPicked.size}곳을 골라 뒀습니다`, 2000);
  };
  $('#mailLogClear').onclick = () => {
    if (!alive(mailLog).length) return;
    if (!confirm('보낸 기록을 모두 지울까요?\n이미 보낸 메일은 취소되지 않습니다.')) return;
    for (const item of mailLog) { item.deleted = true; touch(item); }
    saveLocalState(); queueCloudSave(); renderMailLog();
    showToast('기록을 비웠습니다');
  };

  $('#mailProvider').onchange = () => {
    const gas = $('#mailProvider').value === 'gas';
    $('#mailSetupGas').classList.toggle('hidden', !gas);
    $('#mailSetupEmailjs').classList.toggle('hidden', gas);
  };
  $('#mailGasCopy').onclick = () => copyText(MAIL_GAS_CODE);
  $('#mailSetupSave').onclick = () => {
    writeMailConfig({
      provider: $('#mailProvider').value,
      serviceId: $('#mailServiceId').value.trim(),
      templateId: $('#mailTemplateId').value.trim(),
      publicKey: $('#mailPublicKey').value.trim(),
      gasUrl: $('#mailGasUrl').value.trim(),
      gasToken: $('#mailGasToken').value.trim(),
      fromName: $('#mailFromName').value.trim(),
      replyTo: $('#mailReplyTo').value.trim()
    });
    queueCloudSave();
    paintMailSetup();
    showToast(mailConfigReady() ? '발송 설정을 저장했습니다' : '저장했지만 아직 빈 칸이 있습니다', 2000);
  };
  $('#mailTestSend').onclick = async () => {
    const to = $('#mailTestTo').value.trim();
    if (!to.includes('@')) return showToast('시험 삼아 보낼 내 메일 주소를 적어 주세요');
    $('#mailSetupState').textContent = '보내는 중…';
    try {
      await sendOneMail(to, '[한솔 지식] 메일함 시험 발송', '이 메일이 도착했다면 메일함 연결이 끝난 것입니다.');
      $('#mailSetupState').textContent = `${to} 로 보냈습니다. 받은편지함을 확인해 주세요.`;
      showToast('시험 발송 완료');
    } catch (error) {
      $('#mailSetupState').textContent = `실패: ${error.message || error}`;
      showToast('시험 발송 실패 — 아래 문구를 확인해 주세요', 3000);
    }
  };
}

// ── 일정 (목록) ──────────────────────────────────────────────
const dayKeyOf = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
let showPastSchedule = false;

function scheduleBadge(dateKey) {
  const today = new Date();
  if (dateKey === dayKeyOf(today)) return '오늘';
  return dateKey === dayKeyOf(new Date(today.getTime() + 86400000)) ? '내일' : '';
}
function schedulesOn(dateKey) {
  return alive(schedule)
    .filter(item => String(item.date) === dateKey)
    .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
}
// 날짜 → 시간 순으로 정렬해 하나의 목록으로 만든다.
function sortedSchedule(list) {
  return list.slice().sort((a, b) => {
    const day = String(a.date || '').localeCompare(String(b.date || ''));
    return day !== 0 ? day : String(a.time || '99:99').localeCompare(String(b.time || '99:99'));
  });
}

function renderSchedule() {
  const today = todayKey();
  const all = alive(schedule);
  const upcoming = sortedSchedule(all.filter(item => String(item.date) >= today));
  const past = sortedSchedule(all.filter(item => String(item.date) < today)).reverse();   // 최근 지난 일정부터
  const rows = showPastSchedule ? past : upcoming;

  $('#schedulePanel').innerHTML = `
    <div class="block-head">
      <div><h2>일정</h2><p>${showPastSchedule ? `지난 일정 ${past.length}건` : `다가오는 일정 ${upcoming.length}건`}</p></div>
      <div class="cal-tools">
        ${past.length ? `<button type="button" class="cal-nav" id="schedulePast">${showPastSchedule ? '다가오는 일정' : '지난 일정'}</button>` : ''}
        <button type="button" class="ghost-btn" id="scheduleAdd">＋ 일정</button>
      </div>
    </div>
    <div class="schedule-list">
      ${rows.length ? renderScheduleGroups(rows)
        : `<div class="todo-empty">${showPastSchedule ? '지난 일정이 없습니다.' : '예정된 일정이 없습니다. ＋ 일정으로 추가하세요.'}</div>`}
    </div>`;

  const pastButton = $('#schedulePast');
  if (pastButton) pastButton.onclick = () => { showPastSchedule = !showPastSchedule; renderSchedule(); };
  $('#scheduleAdd').onclick = () => openScheduleModal(null, today);
  $('#schedulePanel').querySelectorAll('[data-schedule]').forEach(row => {
    const item = schedule.find(x => x.id === row.dataset.schedule);
    const button = row.querySelector('.schedule-more');
    button.onclick = () => openRowMenu(button, [
      { label: '수정', run: () => openScheduleModal(item) },
      { label: '삭제', danger: true, run: () => deleteSchedule(item) }
    ]);
    // 줄을 눌러도 수정 창이 열린다.
    row.onclick = event => { if (!event.target.closest('button')) openScheduleModal(item); };
  });
}

// 같은 날짜끼리 묶어서 날짜 머리글 아래에 나란히 보여 준다.
function renderScheduleGroups(rows) {
  const groups = [];
  for (const item of rows) {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  }
  return groups.map(group => `
    <div class="schedule-group">
      <div class="schedule-group-head">
        <b>${escapeHtml(scheduleDayTitle(group.date))}</b>
        ${scheduleBadge(group.date) ? `<em class="schedule-badge">${scheduleBadge(group.date)}</em>` : ''}
        <span class="schedule-group-count">${group.items.length}건</span>
      </div>
      ${group.items.map(item => `
        <div class="schedule-row" data-schedule="${item.id}">
          ${item.time ? `<span class="schedule-date">${escapeHtml(item.time)}</span>` : '<span class="schedule-date muted">종일</span>'}
          <div class="schedule-body">
            <b>${escapeHtml(item.title)}</b>
            ${item.memo ? `<small>${escapeHtml(item.memo)}</small>` : ''}
          </div>
          <button type="button" class="schedule-more" data-row-menu title="수정·삭제">${icon('more', 14)}</button>
        </div>`).join('')}
    </div>`).join('');
}

function scheduleDayTitle(dateKey) {
  const parts = String(dateKey || '').split('-').map(Number);
  if (parts.length !== 3) return dateKey || '';
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const year = date.getFullYear() === new Date().getFullYear() ? '' : `${parts[0]}년 `;
  return `${year}${parts[1]}월 ${parts[2]}일 (${WEEKDAYS[date.getDay()]})`;
}

let editingScheduleId = null;
function openScheduleModal(item, presetDate) {
  editingScheduleId = item ? item.id : null;
  $('#scheduleHeading').textContent = item ? '일정 수정' : '일정 추가';
  $('#scheduleDate').value = item ? item.date : (presetDate || todayKey());
  $('#scheduleTitle').value = item ? item.title : '';
  $('#scheduleTime').value = item ? (item.time || '') : '';
  $('#scheduleMemo').value = item ? (item.memo || '') : '';
  $('#scheduleDelete').classList.toggle('hidden', !item);
  $('#scheduleModal').classList.remove('hidden');
  setTimeout(() => $('#scheduleTitle').focus(), 50);
}
function closeScheduleModal() { $('#scheduleModal').classList.add('hidden'); editingScheduleId = null; }
$('#scheduleClose').addEventListener('click', closeScheduleModal);
$('#scheduleCancel').addEventListener('click', closeScheduleModal);
$('#scheduleModal').addEventListener('click', event => { if (event.target.id === 'scheduleModal') closeScheduleModal(); });
$('#scheduleForm').addEventListener('submit', event => {
  event.preventDefault();
  const values = {
    date: $('#scheduleDate').value,
    title: $('#scheduleTitle').value.trim(),
    time: $('#scheduleTime').value,
    memo: $('#scheduleMemo').value.trim()
  };
  if (!values.date || !values.title) return;
  const existing = schedule.find(x => x.id === editingScheduleId);
  if (existing) { Object.assign(existing, values); touch(existing); }
  else schedule.unshift(newEntry({ type: 'schedule', ...values }));
  showPastSchedule = values.date < todayKey();   // 지난 날짜로 저장하면 그 목록이 보이게 한다
  saveLocalState(); queueCloudSave(); renderSchedule(); closeScheduleModal();
  showToast(existing ? '일정 수정됨' : '일정 추가됨');
});
$('#scheduleDelete').addEventListener('click', () => {
  const item = schedule.find(x => x.id === editingScheduleId);
  const id = editingScheduleId;
  deleteSchedule(item);
  if (item && item.deleted) closeScheduleModal();
  else editingScheduleId = id;
});

// ── 자주 가는 사이트 ───────────────────────────────────────────
// 기본 7개. id 가 고정이라 여러 번 열어도 다시 만들어지지 않고,
// 사용자가 지웠으면(삭제 표시가 남아 있으면) 되살리지 않는다.
const DEFAULT_SHORTCUTS = [
  { id: 'shortcut-pour-contract', name: 'POUR 협약서', url: 'https://poursolution.github.io/pour-contract/', badge: 'POUR' },
  { id: 'shortcut-pour-support', name: '기술지원', url: 'https://pour-support.web.app/login', badge: 'SUPPORT' },
  { id: 'shortcut-card', name: '고객관리', url: 'https://hansol941201.github.io/card/', badge: '고객관리' },
  { id: 'shortcut-knowledge', name: '한솔지식', url: 'https://hansol941201.github.io/hansol-knowledge/', badge: 'HS' },
  { id: 'shortcut-team-schedule', name: '팀일정', url: 'https://hansol941201.github.io/shin/team-schedule/', badge: '일정' },
  { id: 'shortcut-qna', name: 'Q&A', url: 'https://hansol941201.github.io/Q-A/', badge: 'Q&A' },
  { id: 'shortcut-sales', name: '영업운영', url: 'https://schedules-cip.pages.dev/', badge: '영업운영' }
];
// 예전 기본값 3개는 손대지 않은 것만 치운다(직접 고쳤으면 그대로 둔다).
const LEGACY_DEFAULTS = {
  'shortcut-kapt': 'https://www.k-apt.go.kr',
  'shortcut-gmail': 'https://mail.google.com',
  'shortcut-naver': 'https://www.naver.com'
};

// 카드 이름에 맞는 대표 아이콘을 한 번만 넣어 준다.
// 이름·주소·순서·클릭은 건드리지 않고 image 만 바꾼다.
const SHORTCUT_ICON_VERSION = 'v2';

function fillDefaultShortcutIcons() {
  if (localStorage.getItem('knowledge-shortcut-icons') === SHORTCUT_ICON_VERSION) return false;
  let changed = false;
  for (const item of shortcuts) {
    if (item.deleted) continue;
    const url = builtinIconUrl(iconForShortcut(item));
    if (!url || item.image === url) continue;          // 어울리는 아이콘이 없으면 그대로 둔다
    item.image = url;
    item.imageFit = SHORTCUT_FIT;
    touch(item);
    changed = true;
  }
  localStorage.setItem('knowledge-shortcut-icons', SHORTCUT_ICON_VERSION);
  return changed;
}

function seedShortcuts() {
  let changed = false;
  for (const [id, url] of Object.entries(LEGACY_DEFAULTS)) {
    const old = shortcuts.find(item => item.id === id && !item.deleted);
    if (old && old.url === url) { old.deleted = true; touch(old); changed = true; }
  }
  let order = Math.min(0, ...shortcuts.map(item => Number(item.order) || 0));
  for (const preset of DEFAULT_SHORTCUTS) {
    if (shortcuts.some(item => item.id === preset.id)) continue;          // 지운 것도 다시 만들지 않는다
    if (shortcuts.some(item => !item.deleted && item.url === preset.url)) continue;
    shortcuts.push(newEntry({
      type: 'shortcut', image: builtinIconUrl(iconForShortcut(preset)), imageFit: SHORTCUT_FIT, order: order++, ...preset
    }, '기본'));
    changed = true;
  }
  if (fillDefaultShortcutIcons()) changed = true;
  if (changed) { saveLocalState(); queueCloudSave(); }
}

function shortcutHref(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}
function shortcutHost(url) {
  try { return new URL(shortcutHref(url)).hostname.replace(/^www\./, ''); }
  catch { return String(url || '').replace(/^https?:\/\//i, '').split('/')[0]; }
}
// 뒤에는 같은 그림을 흐리게 깔아 이미지 영역을 빈틈없이 채우고,
// 앞에는 원본을 잘림 없이(contain) 그대로 보여 준다.
function thumbImage(src) {
  const url = escapeHtml(src);
  return `<img class="thumb-back" alt="" aria-hidden="true" src="${url}" /><img class="thumb-face" alt="" src="${url}" />`;
}

// ── 즐겨찾기 열기 ───────────────────────────────────────────
// 카드를 누르면 화면 오른쪽 절반 크기의 창으로 연다(대시보드 창은 그대로 둔다).
// 즐겨찾기마다 창 이름을 다르게 줘서 각각 따로 열리고, 같은 카드를 다시 누르면
// 이미 열린 창을 앞으로 가져온다.
const shortcutPopups = new Map();          // 즐겨찾기 id → 열어 둔 창
const popupWindowName = (id) => `favorite-${String(id).replace(/[^A-Za-z0-9_-]/g, '')}`;

// 모바일·좁은 화면·데스크톱 오버레이에서는 팝업 대신 새 탭으로 연다.
function canOpenSidePopup() {
  if (overlayMode || !window.screen) return false;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const width = window.screen.availWidth || window.innerWidth || 0;
  return !coarse && width >= 900;
}

function openShortcutSite(item) {
  const url = shortcutHref(item && item.url);
  if (!url) return;
  if (!canOpenSidePopup()) { window.open(url, '_blank', 'noopener,noreferrer'); return; }

  // 이미 열어 둔 창이 있으면 새로 띄우지 않고 앞으로 가져온다.
  const opened = shortcutPopups.get(item.id);
  if (opened && !opened.closed) {
    try { opened.focus(); return; } catch { /* 창을 잃었으면 아래에서 다시 연다 */ }
  }

  const view = window.screen;
  const availWidth = view.availWidth || window.innerWidth;
  const availHeight = view.availHeight || window.innerHeight;   // 작업표시줄을 뺀 높이
  const availLeft = Number.isFinite(view.availLeft) ? view.availLeft : 0;
  const availTop = Number.isFinite(view.availTop) ? view.availTop : 0;
  const width = Math.floor(availWidth / 2);
  const height = availHeight;
  const left = availLeft + availWidth - width;                  // 오른쪽 끝에 붙인다
  const top = availTop;

  const popup = window.open(url, popupWindowName(item.id),
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);

  if (!popup || popup.closed) {
    showToast('브라우저 설정에서 이 사이트의 팝업을 허용해주세요', 4000);
    return;
  }
  shortcutPopups.set(item.id, popup);
  try { popup.focus(); } catch { /* 포커스는 실패해도 창은 열려 있다 */ }
}

function shortcutBadge(item) {
  return (item.badge || String(item.name || '').trim().slice(0, 4) || '?').toUpperCase();
}
function sortedShortcuts() {
  return alive(shortcuts).slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

// 즐겨찾기 줄은 세로 휠·트랙패드로도 좌우로 움직인다.
(() => {
  const band = $('#shortcutGrid');
  if (!band) return;
  band.addEventListener('wheel', event => {
    if (event.deltaX !== 0) return;                       // 트랙패드 가로 스크롤은 그대로 둔다
    if (band.scrollWidth <= band.clientWidth) return;      // 넘칠 때만 가로로 바꾼다
    event.preventDefault();
    band.scrollLeft += event.deltaY;
  }, { passive: false });
})();

function renderShortcuts() {
  const list = sortedShortcuts();
  $('#shortcutGrid').innerHTML = list.map(item => `
    <div class="shortcut" data-shortcut="${item.id}" draggable="true">
      <a href="${escapeHtml(shortcutHref(item.url))}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.name)}">
        <span class="shortcut-thumb">${item.image
          ? thumbImage(item.image)
          : `<span class="shortcut-badge">${escapeHtml(shortcutBadge(item))}</span>`}</span>
        <b>${escapeHtml(item.name)}</b>
      </a>
      <button type="button" class="shortcut-more" data-row-menu data-shortcut-edit title="수정·삭제">${icon('more', 14)}</button>
    </div>`).join('') + `
    <button type="button" class="shortcut add" id="shortcutAdd">${icon('plus', 18)}<b>사이트 추가</b></button>`;

  $('#shortcutGrid').querySelectorAll('[data-shortcut]').forEach(node => {
    // 팝업 차단을 피하려면 클릭 이벤트 안에서 바로 window.open 을 불러야 한다.
    node.querySelector('a').addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;  // Ctrl+클릭 등은 그대로 새 탭
      event.preventDefault();
      openShortcutSite(shortcuts.find(x => x.id === node.dataset.shortcut));
    });
    const menuButton = node.querySelector('[data-shortcut-edit]');
    menuButton.onclick = (event) => {
      event.preventDefault();
      const item = shortcuts.find(x => x.id === node.dataset.shortcut);
      openRowMenu(menuButton, [
        { label: '수정', run: () => openShortcutModal(item) },
        { label: '삭제', danger: true, run: () => deleteShortcut(item) }
      ]);
    };
    // 드래그로 순서 바꾸기
    node.addEventListener('dragstart', event => {
      draggingShortcutId = node.dataset.shortcut;
      node.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', node.dataset.shortcut);
    });
    node.addEventListener('dragend', () => { draggingShortcutId = ''; node.classList.remove('dragging'); });
    node.addEventListener('dragover', event => {
      if (!draggingShortcutId || draggingShortcutId === node.dataset.shortcut) return;
      event.preventDefault();
      node.classList.add('drop-target');
    });
    node.addEventListener('dragleave', () => node.classList.remove('drop-target'));
    node.addEventListener('drop', event => {
      event.preventDefault();
      node.classList.remove('drop-target');
      moveShortcut(draggingShortcutId, node.dataset.shortcut);
    });
  });
  $('#shortcutAdd').onclick = () => openShortcutModal(null);
}

let draggingShortcutId = '';
function moveShortcut(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const list = sortedShortcuts();
  const from = list.findIndex(item => item.id === fromId);
  const to = list.findIndex(item => item.id === toId);
  if (from < 0 || to < 0) return;
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  list.forEach((item, index) => { item.order = index; touch(item); });
  saveLocalState(); queueCloudSave(); renderShortcuts();
}

// 업로드한 이미지는 카드 크기에 맞게 줄여서 저장한다.
// 원본을 그대로 담으면 동기화 문서(1MB 제한)가 금방 넘친다.
const IMAGE_MAX = 420;
function hasTransparency(context, canvas) {
  try {
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
    return false;
  } catch { return true; }   // 확인이 안 되면 안전하게 PNG 로 둔다
}
function readShortcutImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) return reject(new Error('PNG · JPG · WEBP 만 됩니다'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('이미지를 열지 못했습니다'));
      image.onload = () => {
        const scale = Math.min(1, IMAGE_MAX / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL('image/png');
        // 투명한 부분이 있는 이미지를 JPEG 로 바꾸면 그 자리가 까맣게 굳는다.
        // 그런 이미지는 용량이 커도 PNG 로 그대로 둔다.
        if (hasTransparency(context, canvas)) return resolve(png);
        const jpeg = canvas.toDataURL('image/jpeg', 0.82);
        resolve(png.length <= jpeg.length * 1.1 ? png : jpeg);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

let editingShortcutId = null;
let shortcutImage = '';
const SHORTCUT_FIT = 'contain';   // 모든 카드가 같은 규칙 — 이미지는 잘리지도 커지지도 않는다
function paintShortcutPreview() {
  const preview = $('#shortcutPreview');
  preview.innerHTML = shortcutImage
    ? thumbImage(shortcutImage)
    : `<span class="shortcut-badge">${escapeHtml(($('#shortcutName').value || '?').trim().slice(0, 4).toUpperCase())}</span>`;
  $('#shortcutImageClear').classList.toggle('hidden', !shortcutImage);
  document.querySelectorAll('#iconPicker [data-icon]').forEach(button => {
    button.classList.toggle('active', builtinIconUrl(button.dataset.icon) === shortcutImage);
  });
}

function paintIconPicker() {
  $('#iconPicker').innerHTML = BUILTIN_ICONS.map(item => `
    <button type="button" data-icon="${item.id}" title="${escapeHtml(item.name)}">
      <img alt="${escapeHtml(item.name)}" src="${escapeHtml(builtinIconUrl(item.id))}" />
    </button>`).join('');
  $('#iconPicker').querySelectorAll('[data-icon]').forEach(button => {
    button.onclick = () => {
      const url = builtinIconUrl(button.dataset.icon);
      shortcutImage = shortcutImage === url ? '' : url;   // 한 번 더 누르면 해제
      $('#shortcutFile').value = '';
      paintShortcutPreview();
    };
  });
}
function openShortcutModal(item) {
  editingShortcutId = item ? item.id : null;
  shortcutImage = item ? (item.image || '') : '';
  $('#shortcutHeading').textContent = item ? '사이트 수정' : '사이트 추가';
  $('#shortcutName').value = item ? item.name : '';
  $('#shortcutUrl').value = item ? item.url : '';
  $('#shortcutFile').value = '';
  $('#shortcutDelete').classList.toggle('hidden', !item);
  paintIconPicker();
  paintShortcutPreview();
  $('#shortcutModal').classList.remove('hidden');
  setTimeout(() => $('#shortcutName').focus(), 50);
}
function closeShortcutModal() { $('#shortcutModal').classList.add('hidden'); editingShortcutId = null; shortcutImage = ''; }
$('#shortcutClose').addEventListener('click', closeShortcutModal);
$('#shortcutCancel').addEventListener('click', closeShortcutModal);
$('#shortcutModal').addEventListener('click', event => { if (event.target.id === 'shortcutModal') closeShortcutModal(); });
$('#shortcutName').addEventListener('input', paintShortcutPreview);
$('#shortcutImageClear').addEventListener('click', () => { shortcutImage = ''; $('#shortcutFile').value = ''; paintShortcutPreview(); });
$('#shortcutFile').addEventListener('change', async event => {
  const file = event.currentTarget.files[0];
  if (!file) return;
  try { shortcutImage = await readShortcutImage(file); paintShortcutPreview(); }
  catch (error) { showToast(error.message); event.currentTarget.value = ''; }
});
$('#shortcutForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('#shortcutName').value.trim();
  const url = $('#shortcutUrl').value.trim();
  if (!name || !url) return;
  const existing = shortcuts.find(x => x.id === editingShortcutId);
  if (existing) { Object.assign(existing, { name, url, image: shortcutImage, imageFit: SHORTCUT_FIT }); touch(existing); }
  else {
    const last = Math.max(-1, ...sortedShortcuts().map(item => Number(item.order) || 0));
    shortcuts.push(newEntry({ type: 'shortcut', name, url, image: shortcutImage, imageFit: SHORTCUT_FIT, order: last + 1 }));
  }
  saveLocalState(); queueCloudSave(); renderShortcuts(); closeShortcutModal();
  showToast(existing ? '사이트 수정됨' : '사이트 추가됨');
});
function deleteShortcut(item) {
  if (!item || !confirm(`「${item.name}」 바로가기를 지울까요?`)) return false;
  item.deleted = true; touch(item);
  saveLocalState(); queueCloudSave(); renderShortcuts();
  showToast('사이트 삭제됨');
  return true;
}
$('#shortcutDelete').addEventListener('click', () => {
  if (deleteShortcut(shortcuts.find(x => x.id === editingShortcutId))) closeShortcutModal();
});

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
$('#resetBackupSide').addEventListener('click', () => $('#resetBackup').click());
$('#syncOpen').addEventListener('click', () => (cloudReady ? showToast('실시간 연동 중') : openSyncModal()));
$('#resetClose').addEventListener('click', closeResetModal);
$('#resetModal').addEventListener('click', event => { if (event.target.id === 'resetModal') closeResetModal(); });
$('#resetConfirm').addEventListener('input', event => { $('#resetAll').disabled = event.currentTarget.value.trim() !== '삭제'; });

$('#resetBackup').addEventListener('click', () => {
  const backup = JSON.stringify({ savedAt: nowIso(), knowledge, todos, memories, accountMeta, shortcuts, schedule }, null, 2);
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
   'knowledge-vault-data', 'knowledge-sync-pending', 'knowledge-shortcuts', 'knowledge-schedule',
   'knowledge-mail-templates', 'knowledge-mail-log'].forEach(key => localStorage.removeItem(key));
  location.reload();
});

// 전체 삭제는 문서를 비우는 게 아니라 삭제 표시를 남긴다.
// 그냥 비우면 다른 기기가 갖고 있던 사본을 다시 올려서 되살아난다.
$('#resetAll').addEventListener('click', async () => {
  if ($('#resetConfirm').value.trim() !== '삭제') return;
  if (!confirm('지식·할 일·기억·계정을 모두 삭제합니다.\n다른 컴퓨터에서도 사라집니다.\n정말 진행할까요?')) return;
  $('#resetAll').disabled = true;
  $('#resetAll').textContent = '삭제 중…';
  for (const list of [knowledge, todos, memories, accountMeta, shortcuts, schedule, mailTemplates, mailLog]) {
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
function openNewEditor(category = '기타') {
  editingId = null;
  $('#editHeading').textContent = category === '기타' ? '새 지식 추가' : `새 ${category} 추가`;
  $('#editSubmit').textContent = '지식 저장';
  $('#editTitle').value = '';
  $('#editAnswer').value = '';
  $('#editCategory').value = ['업무지식', '연락처', '기타'].includes(category) ? category : '기타';
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

// ── 지식창 유지 ───────────────────────────────────────────────
// 사용자가 직접 접기(−) 전에는 어떤 경우에도 닫히지 않는다.
// 열림/접힘 상태와 대화 내용·입력 중이던 글을 저장해 두고 다시 열 때 그대로 되살린다.
const WINDOW_STATE_KEY = 'knowledge-window-state';
const WINDOW_CHAT_KEY = 'knowledge-window-chat';
const WINDOW_CHAT_MAX = 60;
let windowState = { open: false, draft: '' };
let restoringChat = false;

function loadWindowState() {
  try {
    const raw = JSON.parse(localStorage.getItem(WINDOW_STATE_KEY) || 'null');
    if (raw && typeof raw === 'object') windowState = { open: Boolean(raw.open), draft: String(raw.draft || '') };
  } catch { /* 저장값이 깨져 있어도 창은 그대로 둔다 */ }
  return windowState;
}
function saveWindowState(patch) {
  windowState = { ...windowState, ...patch };
  try { localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(windowState)); } catch { /* 저장 실패해도 창은 유지 */ }
}

function snapshotChat() {
  if (restoringChat) return;
  try {
    const rows = [...messages.querySelectorAll('.row')].slice(-WINDOW_CHAT_MAX).map(row => {
      const bubble = row.querySelector('.bubble');
      if (!bubble) return null;
      const copy = bubble.cloneNode(true);
      copy.querySelectorAll('.actions').forEach(node => node.remove());   // 버튼 글자는 빼고 내용만
      return { type: row.classList.contains('ask') ? 'ask' : 'answer', text: copy.textContent, patent: bubble.classList.contains('patent-bubble') };
    }).filter(Boolean);
    localStorage.setItem(WINDOW_CHAT_KEY, JSON.stringify(rows));
  } catch { /* 저장 실패해도 창은 유지 */ }
}

function restoreChat() {
  let rows = [];
  try { rows = JSON.parse(localStorage.getItem(WINDOW_CHAT_KEY) || '[]'); } catch { rows = []; }
  if (!Array.isArray(rows) || !rows.length) return;
  restoringChat = true;
  for (const entry of rows.slice(-WINDOW_CHAT_MAX)) {
    if (!entry || !entry.text) continue;
    const row = document.createElement('div');
    row.className = `row ${entry.type === 'ask' ? 'ask' : 'answer'}`;
    const bubble = document.createElement('div');
    bubble.className = `bubble${entry.patent ? ' patent-bubble' : ''}`;
    bubble.textContent = entry.text;
    row.append(bubble);
    messages.append(row);
  }
  chatEmpty.classList.add('off');
  messages.scrollTop = messages.scrollHeight;
  restoringChat = false;
}

// 오류·연결 끊김·바깥 클릭 등 어떤 이유로 창이 사라져도 곧바로 되돌린다.
function keepWindowAlive() {
  try {
    if (!document.body.contains(app)) document.body.append(app);
    if (!document.body.contains(orb)) document.body.append(orb);
    if (windowState.open) {
      app.classList.remove('hidden');
      orb.classList.add('hidden');
      if (getComputedStyle(app).display === 'none') app.style.display = '';
    } else {
      orb.classList.remove('hidden');          // 접어 두어도 열기 버튼은 항상 화면에 보인다
      if (getComputedStyle(orb).display === 'none') orb.style.display = '';
    }
  } catch { /* 여기서 또 실패해도 다음 점검 때 다시 시도한다 */ }
}

function openApp() {
  saveWindowState({ open: true });
  window.knowledgeAPI?.setExpanded(true);
  orb.classList.add('hidden');
  app.classList.remove('hidden');
  if (syncLoginPending && !syncPromptDismissed) $('#syncModal').classList.remove('hidden');
  setTimeout(() => input.focus(), 120);
}
function collapseApp() {                       // 최소화(접기). 닫는 것이 아니라 열기 버튼으로 줄어든다
  saveWindowState({ open: false });
  if (overlayMode && syncLoginPending) $('#syncModal').classList.add('hidden');
  app.classList.add('hidden');
  orb.classList.remove('hidden');
  window.knowledgeAPI?.setExpanded(false);
}

function restoreWindow() {
  loadWindowState();
  restoreChat();
  input.value = windowState.draft;
  if (windowState.open) openApp(); else collapseApp();
  try { new MutationObserver(snapshotChat).observe(messages, { childList: true, subtree: true, characterData: true }); } catch { /* 없어도 저장은 계속 시도 */ }
  input.addEventListener('input', () => saveWindowState({ draft: input.value }));
  window.addEventListener('beforeunload', () => { saveWindowState({ draft: input.value }); snapshotChat(); });
  for (const event of ['error', 'unhandledrejection', 'online', 'offline', 'pageshow', 'focus']) {
    window.addEventListener(event, keepWindowAlive);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) keepWindowAlive(); });
  setInterval(keepWindowAlive, 1000);
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
  if (openMenu) closeRowMenu();
  else if (!$('#todoModal').classList.contains('hidden')) closeTodoModal();
  else if (!$('#scheduleModal').classList.contains('hidden')) closeScheduleModal();
  else if (!$('#detailModal').classList.contains('hidden')) closeDetail();
  else if (!$('#shortcutModal').classList.contains('hidden')) closeShortcutModal();
  else if (!$('#addModal').classList.contains('hidden')) closeAddModal();
  else if (!$('#resetModal').classList.contains('hidden')) closeResetModal();
  else if (!$('#syncModal').classList.contains('hidden')) closeSyncModal();
  else if (!$('#memoryModal').classList.contains('hidden')) closeMemoryLibrary();
  else if (overlayMode) collapseApp();   // 브라우저에서는 Esc 로 창이 닫히지 않는다
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
  const parsed = buildSearchQuery(query);
  const rows = alive(knowledge)
    .map(item => ({ item, found: matchSearchDoc(buildSearchDoc({ title: item.title, body: item.answer, keywords: (item.aliases || []).join(' ') }), parsed) }))
    .filter(row => row.found)
    .sort((a, b) => b.found.points - a.found.points);
  if (rows.length) return rows.slice(0, 3).map(row => row.item);
  // 예전 방식(부분 일치)도 남겨 둔다 — 짧은 검색어에서 놓치지 않도록.
  return alive(knowledge).map(item => ({ item, points: score(item, query) })).filter(x => x.points > 0)
    .sort((a, b) => b.points - a.points).slice(0, 3).map(x => x.item);
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
    ...(item.gongjong || []), ...(item.aliases || [])].join(' ');
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
const patentStatusNote = (item) =>
  (item && item.num && item.status && item.status !== '등록' ? item.status : '');
function patentLines(item) {
  // 등록번호가 없는 건은 번호 자리에 상태(출원·심사중)를 보여 준다.
  const lines = [`${item.kind}  ${item.num || item.status || '번호 확인'}`];
  if (item.name) lines.push(item.name);
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
  const direct = partners.filter(item => normalize(item.name).includes(q) || q.includes(normalize(item.name)));
  if (direct.length) return direct.slice(0, 5);
  // 못 찾으면 유사 표현·오타까지 넓혀서 한 번 더 본다.
  const parsed = buildSearchQuery(query);
  return partners
    .map(item => ({ item, found: matchSearchDoc(buildSearchDoc({ title: item.name, body: `${item.phone || ''} ${item.email || ''}` }), parsed) }))
    .filter(row => row.found).sort((a, b) => b.found.points - a.found.points).slice(0, 5).map(row => row.item);
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
  markSearchIndexDirty();   // 자료가 바뀌면 검색 목록도 다시 만든다
  sortIntoCollections();
  localStorage.setItem('knowledge-messenger-data', JSON.stringify(knowledge));
  localStorage.setItem('knowledge-todos', JSON.stringify(todos));
  localStorage.setItem('knowledge-memories', JSON.stringify(memories));
  localStorage.setItem('knowledge-account-meta', JSON.stringify(accountMeta));
  localStorage.setItem('knowledge-shortcuts', JSON.stringify(shortcuts));
  localStorage.setItem('knowledge-schedule', JSON.stringify(schedule));
  localStorage.setItem('knowledge-mail-templates', JSON.stringify(mailTemplates));
  localStorage.setItem('knowledge-mail-log', JSON.stringify(mailLog));
}

function renderAll() {
  renderSideNav();
  renderShortcuts();
  renderSchedule();
  renderLibrary();
  renderTodos();
  renderMemories();
  paintIcons();
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
// "할일 …" / "기록 …" / "지식 제목 | 내용" 을 읽어 저장할 항목을 만든다.
// 팝업 지식창과 사이트 검색창이 같은 규칙을 쓴다.
function entryFromCommand(text, source) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const knowledgeMatch = raw.match(KNOWLEDGE_COMMAND);
  if (knowledgeMatch?.[1]?.trim()) {
    const [title, ...rest] = knowledgeMatch[1].split('|');
    const item = createKnowledge(title, rest.join('|'), { raw, source });
    if (item) return { item, kind: 'knowledge', view: '전체' };
  }

  const todoMatch = raw.match(TODO_COMMAND);          // 할일 내용 → todos 에만
  if (todoMatch?.[1]?.trim()) {
    const item = createTodo(todoMatch[1], source);
    if (item) return { item, kind: 'todo', view: '할 일' };
  }

  const memoryMatch = raw.match(MEMORY_COMMAND);      // 기록·기억 내용 → memories 에만
  if (memoryMatch?.[1]?.trim()) {
    const item = createMemory(memoryMatch[1], source);
    if (item) return { item, kind: 'memory', view: '기억' };
  }
  return null;
}

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
  saveWindowState({ draft: '' });
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

  // 지식 제목 | 내용 → knowledge, 할일 내용 → todos, 기록 내용 → memories
  const entry = entryFromCommand(text);
  if (entry) return commitEntry(entry.item, entry.kind);

  // 명령어가 없으면 검색이다. 저장하지 않는다.
  // 기억 저장소에는 "기억 …" / "기록 …" 으로 입력했을 때만 들어간다.
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
  if (!confirm(`「${item.title}」 을(를) 삭제할까요?`)) return false;
  item.deleted = true; touch(item);
  save(); if (row) row.remove(); renderLibrary();
  // 실수로 지웠을 때 4초 안에 되돌릴 수 있다(내용은 지우지 않고 표시만 해 둔다).
  showUndoToast('삭제됨', () => {
    item.deleted = false; touch(item);
    save(); renderAll(); showToast('되돌렸습니다');
  });
  return true;
}
function showToast(text, ms = 900) {
  clearTimeout(showToast.timer);
  toast.classList.remove('with-action');
  toast.textContent = text; toast.classList.add('show');
  showToast.timer = setTimeout(() => toast.classList.remove('show'), ms);
}
// 실수로 눌렀을 때 되돌릴 수 있게 4초 동안 버튼이 달린 안내를 띄운다.
function showUndoToast(text, onUndo) {
  clearTimeout(showToast.timer);
  toast.innerHTML = `<span></span><button type="button">실행 취소</button>`;
  toast.querySelector('span').textContent = text;
  toast.querySelector('button').onclick = () => {
    clearTimeout(showToast.timer);
    toast.classList.remove('show', 'with-action');
    onUndo();
  };
  toast.classList.add('show', 'with-action');
  showToast.timer = setTimeout(() => toast.classList.remove('show', 'with-action'), 4000);
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
        shortcuts: mergeById(shortcuts, remote.shortcuts),
        schedule: mergeById(schedule, remote.schedule),
        mailTemplates: mergeById(mailTemplates, remote.mailTemplates),
        mailLog: mergeById(mailLog, remote.mailLog),
        mailConfig: newerMailConfig(mailConfig, remote.mailConfig),
        vaultSecrets: { ...(remote.vaultSecrets || {}), ...vaultSecrets },
        ...keepQuickMemoField(remote)   // 화면에서 뺀 빠른 메모 값은 건드리지 않고 그대로 둔다
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
      ...((saved && saved.accountMeta) || []),
      ...((saved && saved.shortcuts) || []),
      ...((saved && saved.schedule) || [])
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
    || hasLocalOnlyItems(accountMeta, state.accountMeta)
    || hasLocalOnlyItems(shortcuts, state.shortcuts)
    || hasLocalOnlyItems(schedule, state.schedule)
    || hasLocalOnlyItems(mailTemplates, state.mailTemplates);
  knowledge = mergeById(knowledge, state.knowledge);
  todos = mergeById(todos, state.todos);
  memories = mergeById(memories, state.memories);
  accountMeta = mergeById(accountMeta, state.accountMeta);
  shortcuts = mergeById(shortcuts, state.shortcuts);
  schedule = mergeById(schedule, state.schedule);
  mailTemplates = mergeById(mailTemplates, state.mailTemplates);
  mailLog = mergeById(mailLog, state.mailLog);
  mailConfig = newerMailConfig(mailConfig, state.mailConfig);
  try { localStorage.setItem('knowledge-mail-config', JSON.stringify(mailConfig)); } catch { /* noop */ }
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

seedShortcuts();   // 기본 바로가기는 없을 때만 만든다
renderAll();       // 모든 정의가 끝난 뒤에 첫 화면을 그린다
setupMailbox();    // 메일함 창의 버튼을 한 번만 연결한다
restoreWindow();   // 지식창은 이전 상태·내용 그대로 되살린다
initCloudAuth();
