/* DevToolbox Service Worker — Cache First + Stale While Revalidate */
const CACHE = 'dtb-v1';
const SHELL = [
  '/dashboard.html',
  '/dashboard.js',
  '/dashboard-cmd.js',
  '/dashboard-base.css',
  '/dashboard-components.css',
  '/dashboard-theme.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() => {
      self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage('sw-updated'))
      );
    })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 只处理同源 GET
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  const path = url.pathname;

  // Shell 文件 — Cache First
  if (SHELL.some(s => path.endsWith(s)) || path === '/') {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // tools/*.js — Stale While Revalidate
  if (path.startsWith('/tools/') && path.endsWith('.js')) {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(e.request).then(cached => {
          const network = fetch(e.request).then(res => {
            c.put(e.request, res.clone());
            return res;
          });
          return cached || network;
        })
      )
    );
    return;
  }
  // 其他 — 直接网络
});
