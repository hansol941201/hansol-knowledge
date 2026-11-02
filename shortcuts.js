// 즐겨찾기 — 자료 보관과 창 열기만 담당한다.
//
// 화면을 그리는 코드(app.js)와 꾸미는 코드(styles.css)에서 떼어 놓았다.
// 대시보드 디자인을 고치다가 즐겨찾기가 함께 사라지는 일을 막기 위해서다.
// 여기에는 색·크기·배치에 관한 것을 넣지 않는다.
(function (global) {
  'use strict';

  const STORE_KEY = 'knowledge-shortcuts';

  // ── 자료 보관 ────────────────────────────────────────────
  // 저장된 내용이 깨져 있어도 화면이 죽지 않도록 빈 목록으로 돌려준다.
  function read() {
    try {
      const raw = JSON.parse(global.localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }
  function write(list) {
    try { global.localStorage.setItem(STORE_KEY, JSON.stringify(list || [])); return true; }
    catch { return false; }     // 저장 공간이 꽉 차도 화면은 계속 돌아간다
  }

  // ── 주소 다듬기 ──────────────────────────────────────────
  function href(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }
  function host(url) {
    try { return new URL(href(url)).hostname.replace(/^www\./, ''); }
    catch { return String(url || '').replace(/^https?:\/\//i, '').split('/')[0]; }
  }

  // 자동 생성된 기본값은 사용자가 저장한 내용보다 우선할 수 없다.
  // 구버전은 기본값/아이콘에도 현재 시간을 찍었으므로 시간만 비교하면 안 된다.
  function stamp(item) {
    const value = item && (item.updatedAt || item.savedAt || item.createdAt);
    return typeof value === 'number' ? value : (Date.parse(value) || 0);
  }
  function generated(item, defaults) {
    if (!item || item.deleted || item.userEdited) return false;
    if (item.autoDefault === true) return true;
    return item.source === '기본' && defaults.some(base => base.id === item.id
      && base.name === item.name && base.url === item.url);
  }
  function merge(mine, theirs, defaults = []) {
    const byId = new Map();
    for (const raw of [...(Array.isArray(theirs) ? theirs : []), ...(Array.isArray(mine) ? mine : [])]) {
      if (!raw || !raw.id) continue;
      const preset = defaults.find(base => base.id === raw.id);
      const item = preset && generated(raw, defaults) ? { ...raw, url: preset.url } : raw;
      const previous = byId.get(item.id);
      if (!previous) { byId.set(item.id, item); continue; }
      // 삭제한 ID는 복원하지 않는다. 재등록은 새로운 ID를 사용한다.
      if (Boolean(item.deleted) !== Boolean(previous.deleted)) {
        if (item.deleted) byId.set(item.id, item);
        continue;
      }
      const auto = generated(item, defaults), previousAuto = generated(previous, defaults);
      if (auto !== previousAuto) {
        if (!auto) byId.set(item.id, item);
        continue;
      }
      if (stamp(item) >= stamp(previous)) byId.set(item.id, item);
    }
    return [...byId.values()];
  }
  function same(left, right) {
    const normalize = list => (list || []).map(item => Object.fromEntries(
      Object.keys(item).sort().map(key => [key, item[key]])
    )).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
  }
  function touch(item, list, now = Date.now()) {
    // 서버에서 받은 시각보다 PC 시계가 느려도 방금 수정한 내용이 최신이 된다.
    const latest = Math.max(0, ...(list || []).map(stamp), stamp(item));
    item.updatedAt = new Date(Math.max(now, latest + 1)).toISOString();
    item.userEdited = true;
    item.autoDefault = false;
    return item;
  }

  // ── 창 열기 ──────────────────────────────────────────────
  // 카드를 누르면 화면 오른쪽 절반 크기의 창으로 연다(대시보드 창은 그대로 둔다).
  // 즐겨찾기마다 창 이름을 다르게 줘서 각각 따로 열리고,
  // 같은 카드를 다시 누르면 이미 열린 창을 앞으로 가져온다.
  const popupUrls = new Map();
  const popups = new Map();          // 즐겨찾기 id → 열어 둔 창
  const windowName = (id) => `favorite-${String(id).replace(/[^A-Za-z0-9_-]/g, '')}`;

  // 모바일·좁은 화면·데스크톱 오버레이에서는 팝업 대신 새 탭으로 연다.
  function canOpenSidePopup(overlayMode) {
    if (overlayMode || !global.screen) return false;
    const coarse = global.matchMedia && global.matchMedia('(pointer: coarse)').matches;
    const width = global.screen.availWidth || global.innerWidth || 0;
    return !coarse && width >= 900;
  }

  // options: { overlayMode, onBlocked } — 화면에 안내를 띄우는 일은 부르는 쪽이 한다.
  function open(item, options) {
    const opts = options || {};
    const url = href(item && item.url);
    if (!url) return null;
    if (!canOpenSidePopup(opts.overlayMode)) {
      return global.open(url, '_blank', 'noopener,noreferrer');
    }

    // 이미 열어 둔 창이 있으면 새로 띄우지 않고 앞으로 가져온다.
    const opened = popups.get(item.id);
    if (opened && !opened.closed) {
      try {
        if (popupUrls.get(item.id) !== url) { opened.location = url; popupUrls.set(item.id, url); }
        opened.focus(); return opened;
      } catch { /* 창을 잃었으면 아래에서 다시 연다 */ }
    }

    const view = global.screen;
    const availWidth = view.availWidth || global.innerWidth;
    const availHeight = view.availHeight || global.innerHeight;   // 작업표시줄을 뺀 높이
    const availLeft = Number.isFinite(view.availLeft) ? view.availLeft : 0;
    const availTop = Number.isFinite(view.availTop) ? view.availTop : 0;
    const width = Math.floor(availWidth / 2);
    const height = availHeight;
    const left = availLeft + availWidth - width;                  // 오른쪽 끝에 붙인다
    const top = availTop;

    const popup = global.open(url, windowName(item.id),
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);

    if (!popup || popup.closed) {
      if (typeof opts.onBlocked === 'function') opts.onBlocked();
      return null;
    }
    popups.set(item.id, popup);
    popupUrls.set(item.id, url);
    try { popup.focus(); } catch { /* 포커스는 실패해도 창은 열려 있다 */ }
    return popup;
  }

  global.HANSOL_SHORTCUTS = {
    STORE_KEY, read, write, href, host, merge, touch, same,
    canOpenSidePopup, windowName, open, popups
  };
})(window);

