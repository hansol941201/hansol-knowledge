// Separate Firebase session: CRM is read-only and never replaces Hansol's own auth.
(function () {
  'use strict';
  const SOURCE_URL = 'https://bridgeone-m.github.io/card/';
  const CACHE_KEY = 'knowledge-crm-meetings-v1';
  const CONFIG = {
    apiKey: 'AIzaSyDyQBXCc0WN4wFVsGBLZ6GXsyV0sGvyG34', authDomain: 'pour-dashboard.firebaseapp.com',
    projectId: 'pour-dashboard', appId: '1:886473497979:web:e8b47d9e85f1571ee5b1de'
  };
  let auth, db, stop, starting, retryTimer, hasSnapshot = false;
  let items = [];
  try { const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); if (Array.isArray(cached)) items = cached.filter(x => x && x.source === 'crm-meeting'); } catch {}
  const api = window.CRM_MEETINGS = { items, status: items.length ? '저장된 미팅 · 연결 확인 중' : '고객관리 미팅 연결', open, sourceUrl: SOURCE_URL };
  function update(status) {
    api.status = status;
    window.dispatchEvent(new Event('crm-meetings-update'));
  }
  function replace(rows) {
    api.items = rows;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows)); } catch {}
    update('고객관리 미팅 연동 중');
  }
  function subscribe(user) {
    if (stop) stop(); stop = null;
    clearTimeout(retryTimer);
    if (!user) { update(api.items.length ? '저장된 미팅 · 다시 연결' : '고객관리 미팅 연결'); return; }
    update('고객관리 미팅 불러오는 중');
    stop = db.doc(`users/${user.uid}/shin2/shin2-companies-staging`).onSnapshot({ includeMetadataChanges: true }, snapshot => {
      // Do not erase the last known schedules from a cold/offline empty cache.
      if (snapshot.metadata.fromCache && !snapshot.exists && !hasSnapshot) return;
      const value = snapshot.exists ? snapshot.data().value : [];
      if (!Array.isArray(value)) { update('미팅 자료 형식 확인 필요'); return; }
      hasSnapshot = true;
      replace(window.CRM_MEETING_MODEL.project(value));
      if (snapshot.metadata.fromCache) update('저장된 미팅 · 재연결 대기');
    }, error => {
      console.warn('고객관리 미팅 읽기 실패:', error.code);
      update(error.code === 'permission-denied' ? '고객관리 미팅 권한 확인 필요' : '저장된 미팅 · 다시 연결');
      if (error.code !== 'permission-denied') retryTimer = setTimeout(() => subscribe(auth.currentUser), 15000);
    });
  }
  async function start() {
    if (auth) return;
    if (starting) return starting;
    starting = (async () => {
      if (!window.firebase || !window.CRM_MEETING_MODEL) throw Error('SDK_UNAVAILABLE');
      const app = firebase.apps.find(x => x.name === 'crm-meetings') || firebase.initializeApp(CONFIG, 'crm-meetings');
      auth = app.auth(); db = app.firestore();
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      auth.onAuthStateChanged(subscribe);
    })().catch(error => { auth = null; update('고객관리 미팅 연결 필요'); throw error; }).finally(() => { starting = null; });
    return starting;
  }
  function open() {
    if (auth && auth.currentUser) { subscribe(auth.currentUser); return; }
    let modal = document.getElementById('crmMeetingModal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'crmMeetingModal'; modal.className = 'modal hidden';
      modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', '고객관리 미팅 연결');
      modal.innerHTML = '<form class="edit-box"><header><strong>고객관리 미팅 연결</strong><button type="button" data-close aria-label="닫기">×</button></header><p class="sync-help">고객관리카드 로그인 비밀번호로 한 번 연결하면 1차·2차 미팅 일정이 자동 반영됩니다.</p><label>고객관리 비밀번호<input type="password" name="crmPassword" autocomplete="current-password" required /></label><p class="sync-error" role="status"></p><footer><button type="button" data-close>취소</button><button type="submit">연결</button></footer></form>';
      document.body.appendChild(modal);
      const close = () => { modal.classList.add('hidden'); modal.querySelector('input').value = ''; };
      modal.querySelectorAll('[data-close]').forEach(button => button.onclick = close);
      modal.onclick = event => { if (event.target === modal) close(); };
      modal.querySelector('form').onsubmit = async event => {
        event.preventDefault(); const input = modal.querySelector('input'), button = modal.querySelector('[type="submit"]'), errorNode = modal.querySelector('.sync-error');
        button.disabled = true; errorNode.textContent = '';
        try {
          await start();
          await auth.signInWithEmailAndPassword('hansol2-owner@pour-dashboard.firebaseapp.com', input.value);
          close();
        } catch (error) {
          errorNode.textContent = error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' ? '고객관리 비밀번호를 확인해 주세요.' : error.code === 'auth/too-many-requests' ? '잠시 후 다시 연결해 주세요.' : '연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.';
        } finally { input.value = ''; button.disabled = false; }
      };
    }
    modal.querySelector('.sync-error').textContent = '';
    modal.classList.remove('hidden'); modal.querySelector('input').focus();
    if (auth && auth.currentUser) subscribe(auth.currentUser);
  }
  window.addEventListener('online', () => { if (auth && auth.currentUser) subscribe(auth.currentUser); else start().catch(() => {}); });
  window.addEventListener('keydown', event => { if (event.key === 'Escape') { const modal = document.getElementById('crmMeetingModal'); if (modal) { modal.classList.add('hidden'); modal.querySelector('input').value = ''; } } });
  start().catch(() => {});
})();
