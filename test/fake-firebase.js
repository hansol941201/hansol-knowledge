// 테스트 전용 Firebase 대역 — 실제 Firebase 계정 없이 동기화 동작을 확인하기 위한 stub.
// 같은 브라우저의 여러 탭이 localStorage + BroadcastChannel 로 하나의 문서를 공유한다.
(() => {
  const STORE_KEY = 'fake-firestore-shared-state';
  const channel = new BroadcastChannel('fake-firestore');
  const listeners = new Set();
  window.__FAKE_OFFLINE = false;
  window.__FAKE_WRITES = 0;
  window.__FAKE_SWALLOW = false;

  // localStorage 는 탭 사이 반영이 한 박자 늦을 수 있어, 현재 문서는 메모리에 들고
  // 변경 내용을 BroadcastChannel 메시지에 실어 보낸다(새 탭 부팅용으로만 localStorage 사용).
  let current = (() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
  })();
  const readStore = () => current;
  const snapshotOf = (data) => ({
    exists: data !== null && data !== undefined,
    data: () => data,
    metadata: { hasPendingWrites: false, fromCache: false }
  });
  const notify = () => { const snap = snapshotOf(readStore()); listeners.forEach(fn => fn(snap)); };
  const adopt = (data) => {
    current = data;
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    notify();
  };
  const writeStore = (data) => {
    window.__FAKE_WRITES += 1;
    adopt(data);
    channel.postMessage(data);
  };
  channel.onmessage = (event) => adopt(event.data);

  const resolveStamps = (value) => {
    if (Array.isArray(value)) return value.map(resolveStamps);
    if (value && typeof value === 'object') {
      if (value.__serverTimestamp) return Date.now();
      const out = {};
      for (const [key, item] of Object.entries(value)) out[key] = resolveStamps(item);
      return out;
    }
    return value;
  };
  const offlineError = () => Object.assign(new Error('failed-precondition: offline'), { code: 'unavailable' });

  const docRef = {
    async get() {
      if (window.__FAKE_OFFLINE) return snapshotOf(readStore());
      return snapshotOf(readStore());
    },
    async set(data) {
      if (window.__FAKE_OFFLINE) throw offlineError();
      writeStore(resolveStamps(data));
    },
    onSnapshot(next) { listeners.add(next); queueMicrotask(() => next(snapshotOf(readStore()))); return () => listeners.delete(next); }
  };

  const firestore = {
    doc: () => docRef,
    enablePersistence: async () => {},
    async runTransaction(handler) {
      if (window.__FAKE_OFFLINE) throw offlineError();
      let staged = null;
      const result = await handler({
        get: async () => snapshotOf(readStore()),
        set: (_ref, data) => { staged = resolveStamps(data); }
      });
      if (window.__FAKE_OFFLINE) throw offlineError();
      // __FAKE_SWALLOW: 쓰기는 성공한 척하지만 문서에는 반영하지 않는다(확인 로직 검증용).
      if (staged && !window.__FAKE_SWALLOW) writeStore(staged);
      return result;
    }
  };

  const auth = {
    currentUser: { uid: 'test-user' },
    setPersistence: async () => {},
    signInWithEmailAndPassword: async () => ({ user: auth.currentUser }),
    onAuthStateChanged(next) { queueMicrotask(() => next(auth.currentUser)); return () => {}; }
  };

  window.firebase = {
    initializeApp: () => ({}),
    auth: Object.assign(() => auth, { Auth: { Persistence: { LOCAL: 'local' } } }),
    firestore: Object.assign(() => firestore, { FieldValue: { serverTimestamp: () => ({ __serverTimestamp: true }) } })
  };
  window.HANSOL_AUTH = auth;
  window.HANSOL_FIRESTORE = firestore;
  window.__FAKE_RESET = () => { current = null; localStorage.removeItem(STORE_KEY); };
})();
