// 홈 화면에서 앱처럼(주소창 없이) 열리게 하려면 서비스 워커가 하나 있어야 한다.
// 이 워커는 아무것도 저장하지 않는다. 그 대신 같은 사이트 파일 요청을 가로채
// 언제나 네트워크에서 새로 받아 온다 — 브라우저에 남은 예전 파일(캐시) 때문에
// 사이트를 고쳐도 화면이 그대로인 일을 막기 위해서다.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 혹시 예전에 저장해 둔 것이 있으면 정리하고, 바로 이 워커가 맡는다.
    try {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
    } catch { /* 캐시를 못 지워도 동작에는 영향이 없다 */ }
    await self.clients.claim();
    // 여기서 창을 대신 새로고침하지는 않는다.
    // 활성화가 끝나기 전에는 아래 fetch 가로채기가 대기 상태라, 그 새로고침을
    // 기다리면 서로 물려 화면이 멈춘다. 다음 번에 열 때부터 최신 파일을 받는다.
  })());
});

// 같은 사이트(내 도메인)의 GET 요청은 브라우저 저장본을 건너뛰고 새로 받는다.
// 네트워크가 끊겨 실패하면 평소대로 한 번 더 시도해 저장본이라도 보여 준다.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  let url;
  try { url = new URL(request.url); } catch { return; }
  if (url.origin !== self.location.origin) return;   // 외부 주소(파이어베이스 등)는 손대지 않는다
  event.respondWith(
    fetch(url.href, { cache: 'reload', credentials: 'same-origin' })
      .catch(() => fetch(request))
  );
});
