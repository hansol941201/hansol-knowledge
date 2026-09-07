// 자료 저장·불러오기만 담당한다.
//
// 화면을 그리는 코드(app.js·views.js)와 꾸미는 코드(styles.css)에서 떼어 놓았다.
// 디자인을 고치다가 저장된 자료가 함께 사라지는 일을 막기 위해서다.
// 여기에는 색·크기·배치에 관한 것을 넣지 않는다.
(function (global) {
  'use strict';

  // 자료 종류 → localStorage 열쇠. 여기 적힌 것이 전부다.
  const KEYS = {
    knowledge: 'knowledge-messenger-data',
    todos: 'knowledge-todos',
    memories: 'knowledge-memories',
    accountMeta: 'knowledge-account-meta',
    schedule: 'knowledge-schedule',
    shortcuts: 'knowledge-shortcuts'
  };

  // 저장된 내용이 깨져 있어도 화면이 죽지 않도록 빈 목록으로 돌려준다.
  function readList(name) {
    const key = KEYS[name] || name;
    try {
      const raw = JSON.parse(global.localStorage.getItem(key) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  }
  // 저장 공간이 꽉 차도 화면은 계속 돌아간다. 성공 여부만 알려 준다.
  function writeList(name, list) {
    const key = KEYS[name] || name;
    try { global.localStorage.setItem(key, JSON.stringify(list || [])); return true; }
    catch { return false; }
  }
  // 한 번에 여러 종류를 저장한다. 하나라도 실패하면 false.
  function writeAll(bundle) {
    let done = true;
    for (const name of Object.keys(bundle || {})) {
      if (!writeList(name, bundle[name])) done = false;
    }
    return done;
  }
  // 초기화에서 지워야 할 열쇠 목록(계정 금고·동기화 표시까지 함께).
  function clearKeys(extra) {
    const all = Object.values(KEYS).concat(extra || []);
    for (const key of all) {
      try { global.localStorage.removeItem(key); } catch { /* 못 지워도 계속 간다 */ }
    }
    return all;
  }

  global.HANSOL_STORE = { KEYS, readList, writeList, writeAll, clearKeys };
})(window);
