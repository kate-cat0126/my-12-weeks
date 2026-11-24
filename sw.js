// My 12 Weeks Service Worker — 版本：0.5.0
// 打包時會把上一行的版本號換成實際版本，內容改變後瀏覽器才會安裝新的 Service Worker。
//
// 策略：
// - 頁面與程式：網路優先，並略過瀏覽器 HTTP 快取（GitHub Pages 預設快取 10 分鐘），
//   有網路就一定拿到最新版；離線時才用上次的快取打開 App。
// - version.json：永遠直接問伺服器，給新版提示使用。
// - 使用者資料存在 IndexedDB，Service Worker 完全不碰。
const VERSION = '0.5.0';
const CACHE = `my-12-weeks-${VERSION}`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('my-12-weeks') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) return; // 交給瀏覽器直接請求

  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req, { ignoreSearch: req.mode === 'navigate' })
          .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
          .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : undefined))
          .then((hit) => hit || Response.error()),
      ),
  );
});
