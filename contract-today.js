/* Source access is GET-only. Do not load the original app, initialize its
 * migration code, authenticate, or add write methods to this integration.
 * Firebase's REST event stream triggers fresh GETs on put/patch notifications;
 * a 30s GET fallback also handles missed events and failed stream connections.
 */
(function () {
  'use strict';
  const URL = 'https://service2-contract-default-rtdb.asia-southeast1.firebasedatabase.app/contract/projects.json';
  const model = window.CONTRACT_TODAY_MODEL;
  let rows = [], state = 'loading', inFlight = false, again = false;
  let stream, eventTimer, midnightTimer, day = model.seoulDate();
  function fill(id, names) {
    const container = document.getElementById(id);
    container.replaceChildren();
    if (state !== 'ready' || !names.length) {
      const message = document.createElement('p');
      message.className = state === 'error' ? 'contract-list-error' : 'contract-list-message';
      message.textContent = state === 'error' ? '정보를 불러오지 못했습니다' : state === 'loading' ? '불러오는 중…' : '오늘 해당 아파트 없음';
      container.append(message);
      return;
    }
    const list = document.createElement('ul');
    names.forEach(name => { const item = document.createElement('li'); item.textContent = name; list.append(item); });
    container.append(list);
  }
  function render() {
    let result = { today:model.seoulDate(), briefing:[], dday:[] };
    try { if (state === 'ready') result = model.lists(rows); }
    catch { state = 'error'; }
    document.querySelectorAll('[data-contract-today-date]').forEach(node => {
      node.textContent = result.today;
      node.dateTime = result.today;
    });
    [['Briefing',result.briefing],['Dday',result.dday]].forEach(([kind,names]) => {
      const count = document.getElementById('contract' + kind + 'Count');
      count.textContent = state === 'ready' ? String(names.length) : state === 'loading' ? '…' : '—';
      count.title = state === 'error' ? '정보를 불러오지 못했습니다' : '목록 보기';
    });
    fill('contractBriefingList', result.briefing);
    fill('contractDdayList', result.dday);
  }
  async function refresh() {
    if (inFlight) { again = true; return; }
    inFlight = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(URL, { method:'GET', mode:'cors', cache:'no-store', credentials:'omit', referrerPolicy:'no-referrer', signal:controller.signal });
      if (!response.ok) throw new Error('Source read failed');
      const next = model.project(await response.json());
      model.lists(next); // Invalid relevant names are errors, not empty results.
      rows = next;
      state = 'ready';
    } catch { state = 'error'; }
    finally {
      clearTimeout(timeout);
      inFlight = false;
      render();
      if (again) { again = false; queueRefresh(); }
    }
  }
  function queueRefresh() {
    clearTimeout(eventTimer);
    eventTimer = setTimeout(refresh, 300);
  }
  function checkDay() {
    const next = model.seoulDate();
    if (next !== day) { day = next; render(); refresh(); scheduleMidnight(); }
  }
  function scheduleMidnight() {
    clearTimeout(midnightTimer);
    const next = Date.parse(model.seoulDate() + 'T00:00:00+09:00') + 86400000;
    midnightTimer = setTimeout(() => { checkDay(); scheduleMidnight(); }, Math.max(1, next - Date.now() + 40));
  }
  if (typeof EventSource !== 'undefined') {
    try {
      stream = new EventSource(URL); // Native EventSource sends only GET requests.
      stream.addEventListener('put', queueRefresh);
      stream.addEventListener('patch', queueRefresh);
      stream.addEventListener('cancel', () => { state = 'error'; render(); stream.close(); });
      stream.onerror = queueRefresh;
    } catch { /* GET polling still works if the browser blocks streaming. */ }
  }
  window.addEventListener('online', () => { checkDay(); refresh(); });
  window.addEventListener('offline', () => { state = 'error'; render(); });
  window.addEventListener('focus', () => { checkDay(); refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkDay(); refresh(); } });
  setInterval(() => { checkDay(); refresh(); }, 30000);
  document.querySelectorAll('[data-contract-open]').forEach(button => {
    button.addEventListener('click', () => document.getElementById('contract' + button.dataset.contractOpen + 'Dialog').showModal());
  });
  document.querySelectorAll('.contract-list-dialog').forEach(dialog => {
    dialog.querySelector('[data-contract-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    } });
  });
  scheduleMidnight();
  render();
  refresh();
})();
