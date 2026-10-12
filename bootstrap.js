// Restore large offline records before app.js reads the store.
(async function () {
  await window.HANSOL_STORE.ready;
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = src;
    script.onload = resolve; script.onerror = reject; document.body.appendChild(script);
  });
  try { await load('app.js?v=110'); await load('crm-meetings.js?v=2'); }
  catch { document.getElementById('storageStatus').textContent = '화면을 불러오지 못했습니다. 새로고침해 주세요.'; }
})();
