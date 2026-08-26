// 바로가기 카드에 바로 쓸 수 있는 기본 아이콘.
// SVG 라 용량이 작고(1KB 안팎) 어떤 크기로 줄여도 흐려지지 않는다.
const BUILTIN_ICONS = [
  {
    id: 'contract', name: '협약서 발행',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 90">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#EDF4FF"/><stop offset="1" stop-color="#D5E7FF"/></linearGradient></defs>
      <rect width="152" height="90" fill="url(#bg)"/>
      <g transform="translate(39 6) scale(0.8)">
      <path d="M30 22h26l12 12v38a5 5 0 0 1-5 5H30a5 5 0 0 1-5-5V27a5 5 0 0 1 5-5z" fill="#FFFFFF"/>
      <path d="M56 22l12 12H60a4 4 0 0 1-4-4V22z" fill="#7FB2F5"/>
      <g fill="#7FB2F5">
        <rect x="34" y="44" width="21" height="5" rx="2.5"/>
        <rect x="34" y="55" width="28" height="5" rx="2.5"/>
        <rect x="34" y="66" width="23" height="5" rx="2.5"/>
      </g></g></svg>`
  },
  {
    id: 'b2b', name: 'B2B 업무',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 90">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#EAF9F1"/><stop offset="1" stop-color="#D6F1E2"/></linearGradient></defs>
      <rect width="152" height="90" fill="url(#bg)"/>
      <g transform="translate(39 6) scale(0.8)">
      <text x="48" y="62" text-anchor="middle" fill="#2E9E6B"
        font-family="Arial, Helvetica, sans-serif" font-size="33" font-weight="700" letter-spacing="-1">B2B</text></g></svg>`
  },
  {
    id: 'calendar', name: '일정 등록',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 90">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F0ECFE"/><stop offset="1" stop-color="#E1D9FB"/></linearGradient></defs>
      <rect width="152" height="90" fill="url(#bg)"/>
      <g transform="translate(39 6) scale(0.8)">
      <rect x="33" y="19" width="7" height="18" rx="3.5" fill="#7E6DE8"/>
      <rect x="56" y="19" width="7" height="18" rx="3.5" fill="#7E6DE8"/>
      <rect x="22" y="29" width="52" height="46" rx="9" fill="#FFFFFF"/>
      <path d="M22 38a9 9 0 0 1 9-9h34a9 9 0 0 1 9 9v6H22z" fill="#8B7BEE"/>
      <g fill="#DCD5FA">
        <rect x="32" y="52" width="9" height="8" rx="2.5"/>
        <rect x="43.5" y="52" width="9" height="8" rx="2.5"/>
        <rect x="55" y="52" width="9" height="8" rx="2.5"/>
        <rect x="32" y="63" width="9" height="8" rx="2.5"/>
        <rect x="43.5" y="63" width="9" height="8" rx="2.5"/>
      </g>
      <rect x="55" y="63" width="9" height="8" rx="2.5" fill="#6D4AE0"/></g></svg>`
  },
  {
    id: 'lounge', name: '넷폼 라운지',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 90">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FDEBF3"/><stop offset="1" stop-color="#FBD8E6"/></linearGradient></defs>
      <rect width="152" height="90" fill="url(#bg)"/>
      <g transform="translate(39 6) scale(0.8)">
      <rect x="20" y="38" width="38" height="17" rx="8" fill="#F2789F"/>
      <rect x="12" y="46" width="10" height="24" rx="5" fill="#F9A8C4"/>
      <rect x="52" y="46" width="10" height="24" rx="5" fill="#F9A8C4"/>
      <rect x="14" y="54" width="46" height="16" rx="7" fill="#F9A8C4"/>
      <rect x="18" y="69" width="5" height="7" rx="2.5" fill="#F2789F"/>
      <rect x="51" y="69" width="5" height="7" rx="2.5" fill="#F2789F"/>
      <path d="M66 41h22l-5.5-17h-11z" fill="#F2789F"/>
      <rect x="75" y="41" width="4" height="29" rx="2" fill="#F2789F"/>
      <rect x="68" y="70" width="18" height="6" rx="3" fill="#F2789F"/></g></svg>`
  },
  {
    id: 'lab', name: '기술연구소 시험성적서',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 90">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#E7F6F9"/><stop offset="1" stop-color="#D2EDF2"/></linearGradient></defs>
      <rect width="152" height="90" fill="url(#bg)"/>
      <g transform="translate(39 6) scale(0.8)">
      <rect x="38" y="17" width="20" height="8" rx="4" fill="#58BCC9"/>
      <path d="M43 25h10v13l16 30a6 6 0 0 1-5.3 9H32.3a6 6 0 0 1-5.3-9l16-30z" fill="#FFFFFF"/>
      <path d="M35.6 53h24.8l8.6 15a6 6 0 0 1-5.3 9H32.3a6 6 0 0 1-5.3-9z" fill="#58BCC9"/>
      <circle cx="41" cy="66" r="3" fill="#FFFFFF" opacity=".85"/>
      <circle cx="52" cy="61" r="2.2" fill="#FFFFFF" opacity=".85"/></g></svg>`
  }
];

function builtinIconUrl(id) {
  const found = BUILTIN_ICONS.find(item => item.id === id);
  if (!found) return '';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(found.svg.replace(/\s+/g, ' ').trim())}`;
}
