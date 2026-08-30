// 홈 화면에서 앱처럼(주소창 없이) 열리게 하려면 서비스 워커가 하나 있어야 한다.
// 이 워커는 아무것도 저장하지 않고 요청을 그대로 흘려보낸다 —
// 사이트를 고치면 예전 화면이 남지 않고 언제나 최신 파일을 받는다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  // 혹시 예전에 저장해 둔 것이 있으면 정리하고, 바로 이 워커가 맡는다.
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    } catch { /* 캐시를 못 지워도 동작에는 영향이 없다 */ }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', () => { /* 가로채지 않는다 — 항상 네트워크에서 그대로 받는다 */ });
