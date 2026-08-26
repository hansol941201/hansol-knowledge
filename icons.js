// 즐겨찾기 카드에 쓰는 기본 아이콘.
// 외부 주소를 쓰지 않고 SVG 로 직접 그려서 넣기 때문에 나중에 이미지가 깨지지 않는다.
// 그림체·크기·입체감을 8개 모두 똑같이 맞추고, 색만 서로 다르게 한다.
let iconSeq = 0;
function iconTile(top, bottom, glyph) {
  const key = `i${iconSeq += 1}`;       // 아이디를 겹치지 않게 (한 페이지에 같이 놓여도 색이 섞이지 않는다)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 90">
    <defs>
      <linearGradient id="bg-${key}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
      <filter id="lift-${key}" x="-30%" y="-30%" width="170%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.4" flood-color="#2A2440" flood-opacity="0.13"/></filter>
    </defs>
    <rect width="152" height="90" fill="url(#bg-${key})"/>
    <g transform="translate(38 7)" filter="url(#lift-${key})">${glyph}</g>
  </svg>`;
}

const BUILTIN_ICONS = [
  { id: 'contract', name: '협약서', color: '블루', svg: iconTile('#EEF5FF', '#DAE9FF', `
      <path d="M12 2h30l14 14v46a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" fill="#fff"/>
      <path d="M42 2l14 14H47a5 5 0 0 1-5-5V2z" fill="#9AC4F5"/>
      <g fill="#8FBCF3">
        <rect x="15" y="26" width="22" height="5" rx="2.5"/>
        <rect x="15" y="37" width="30" height="5" rx="2.5"/>
        <rect x="15" y="48" width="20" height="5" rx="2.5"/></g>
      <circle cx="55" cy="57" r="15" fill="#6FA8F0"/>
      <path d="M48 57l5 5 10-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`) },

  { id: 'lab', name: 'T4 · 기술연구소', color: '민트', svg: iconTile('#E9F8F5', '#D2EFE9', `
      <rect x="26" y="2" width="24" height="10" rx="5" fill="#4FBFAE"/>
      <path d="M30 12h16v16l19 33a7 7 0 0 1-6 10.5H17A7 7 0 0 1 11 61l19-33z" fill="#fff"/>
      <path d="M21 45h34l10 16a7 7 0 0 1-6 10.5H17A7 7 0 0 1 11 61z" fill="#4FBFAE"/>
      <circle cx="28" cy="60" r="4.2" fill="#fff" opacity=".85"/>
      <circle cx="42" cy="54" r="2.8" fill="#fff" opacity=".85"/>`) },

  { id: 'customer', name: '고객관리', color: '코랄', svg: iconTile('#FFF1EC', '#FFDFD5', `
      <path d="M4 10a6 6 0 0 1 6-6h11a6 6 0 0 1 4.6 2.2L29 11H4z" fill="#F2856B"/>
      <rect x="4" y="14" width="68" height="52" rx="11" fill="#fff"/>
      <circle cx="26" cy="34" r="9" fill="#F2856B"/>
      <path d="M12 57a14 14 0 0 1 28 0v3H12z" fill="#F2856B"/>
      <rect x="46" y="29" width="20" height="5" rx="2.5" fill="#FBC3B4"/>
      <rect x="46" y="40" width="14" height="5" rx="2.5" fill="#FBC3B4"/>
      <circle cx="59" cy="58" r="10" fill="#F2856B"/>
      <path d="M55 58l3 3 5-6" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`) },

  { id: 'knowledge', name: '한솔지식', color: '옐로우', svg: iconTile('#FFF9E9', '#FBEECB', `
      <path d="M8 20c9-5 19-5 27 1v48c-8-6-18-6-27-1z" fill="#fff"/>
      <path d="M68 20c-9-5-19-5-27 1v48c8-6 18-6 27-1z" fill="#fff"/>
      <rect x="34" y="20" width="8" height="49" rx="2.5" fill="#E9B23C"/>
      <g fill="#F6D793">
        <rect x="13" y="31" width="17" height="4.5" rx="2.25"/>
        <rect x="13" y="41" width="13" height="4.5" rx="2.25"/>
        <rect x="46" y="31" width="17" height="4.5" rx="2.25"/>
        <rect x="46" y="41" width="13" height="4.5" rx="2.25"/></g>
      <path d="M59 2l2.6 5.6L67 10l-5.4 2.4L59 18l-2.6-5.6L51 10l5.4-2.4z" fill="#E9B23C"/>`) },

  { id: 'calendar', name: '팀장님구글일정', color: '퍼플', svg: iconTile('#F2EDFE', '#E2D9FB', `
      <rect x="17" y="2" width="7" height="17" rx="3.5" fill="#7566E4"/>
      <rect x="52" y="2" width="7" height="17" rx="3.5" fill="#7566E4"/>
      <rect x="5" y="10" width="66" height="60" rx="12" fill="#fff"/>
      <path d="M5 22a12 12 0 0 1 12-12h42a12 12 0 0 1 12 12v6H5z" fill="#8B7BEE"/>
      <path d="M24 46l9 9 19-19" fill="none" stroke="#8B7BEE" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`) },

  { id: 'qna', name: 'Q&A', color: '핑크', svg: iconTile('#FEEDF4', '#FBD9E8', `
      <rect x="4" y="2" width="52" height="36" rx="12" fill="#fff"/>
      <path d="M16 33h14l-5 14z" fill="#fff"/>
      <rect x="24" y="30" width="48" height="34" rx="12" fill="#EE7FAE"/>
      <path d="M58 60h13l-4 12z" fill="#EE7FAE"/>
      <g fill="#F7B7D0">
        <rect x="14" y="14" width="24" height="5" rx="2.5"/>
        <rect x="14" y="24" width="16" height="5" rx="2.5"/></g>
      <text x="48" y="56" text-anchor="middle" fill="#fff"
        font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700">?</text>`) },

  { id: 'sales', name: '영업팀 일정', color: '그린', svg: iconTile('#EFF9EE', '#DAF0D8', `
      <rect x="14" y="2" width="6" height="15" rx="3" fill="#4FA45C"/>
      <rect x="42" y="2" width="6" height="15" rx="3" fill="#4FA45C"/>
      <rect x="2" y="9" width="58" height="54" rx="11" fill="#fff"/>
      <path d="M2 20a11 11 0 0 1 11-11h36a11 11 0 0 1 11 11v6H2z" fill="#63BA6A"/>
      <g fill="#BEE5C1">
        <rect x="10" y="33" width="9" height="8" rx="2.5"/>
        <rect x="24" y="33" width="9" height="8" rx="2.5"/>
        <rect x="38" y="33" width="9" height="8" rx="2.5"/>
        <rect x="10" y="46" width="9" height="8" rx="2.5"/>
        <rect x="24" y="46" width="9" height="8" rx="2.5"/></g>
      <circle cx="57" cy="57" r="17" fill="#fff"/>
      <circle cx="57" cy="57" r="13.5" fill="#63BA6A"/>
      <path d="M57 49v9h6" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`) },

  { id: 'tracker', name: 'B2B트래커', color: '인디고', svg: iconTile('#EEF0FC', '#DCE1F7', `
      <path d="M27 16v-5a7 7 0 0 1 7-7h8a7 7 0 0 1 7 7v5" fill="none" stroke="#6472CB" stroke-width="6" stroke-linecap="round"/>
      <rect x="3" y="15" width="70" height="46" rx="11" fill="#6472CB"/>
      <rect x="3" y="30" width="70" height="8" fill="#4E5CB4" opacity=".5"/>
      <rect x="30" y="26" width="16" height="12" rx="4" fill="#fff" opacity=".92"/>
      <rect x="34" y="42" width="38" height="32" rx="9" fill="#fff"/>
      <path d="M40 52l3.5 3.5 6-7" fill="none" stroke="#6472CB" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="54" y="50" width="13" height="4" rx="2" fill="#B9C0EA"/>
      <path d="M40 64l3.5 3.5 6-7" fill="none" stroke="#6472CB" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="54" y="62" width="13" height="4" rx="2" fill="#B9C0EA"/>`) }
];

// 카드 이름을 보고 어울리는 아이콘을 고른다(이름을 바꿔도 따라간다).
const SHORTCUT_ICON_RULES = [
  { icon: 'contract', test: /협약|계약|pour/i },
  { icon: 'customer', test: /고객/ },
  { icon: 'knowledge', test: /지식|기억/ },
  { icon: 'qna', test: /q\s*&?\s*a|질문|문의/i },
  { icon: 'sales', test: /영업/ },
  { icon: 'tracker', test: /b2b|트래커|tracker/i },
  { icon: 'lab', test: /^\s*t4\s*$|기술|연구|시험|support/i },
  { icon: 'calendar', test: /팀장|구글|일정|캘린더|schedule/i }
];

const SHORTCUT_ICON_BY_ID = {
  'shortcut-pour-contract': 'contract',
  'shortcut-pour-support': 'lab',
  'shortcut-card': 'customer',
  'shortcut-knowledge': 'knowledge',
  'shortcut-team-schedule': 'calendar',
  'shortcut-qna': 'qna',
  'shortcut-sales': 'sales'
};

function iconForShortcut(item) {
  const name = String((item && item.name) || '');
  for (const rule of SHORTCUT_ICON_RULES) if (rule.test.test(name)) return rule.icon;
  return SHORTCUT_ICON_BY_ID[item && item.id] || '';
}

function builtinIconUrl(id) {
  const found = BUILTIN_ICONS.find(item => item.id === id);
  if (!found) return '';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(found.svg.replace(/\s+/g, ' ').trim())}`;
}
