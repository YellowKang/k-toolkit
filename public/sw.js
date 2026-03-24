/* DevToolbox Service Worker — Cache First + Stale While Revalidate */
/* Version is injected by build.js; fallback for dev */
const CACHE_VERSION = self.__SW_VERSION__ || 'dev';
const CACHE = 'dtb-' + CACHE_VERSION;

// Use relative paths so SW works in subdirectory deployments (e.g. /k-toolkit/)
const SHELL_FILES = [
  'dashboard.html',
  'dashboard.js',
  'dashboard-cmd.js',
  'i18n.js',
  'dashboard-base.css',
  'dashboard-components.css',
  'dashboard-theme.css'
];

// Resolve shell URLs relative to SW scope
const SHELL = SHELL_FILES.map(f => new URL(f, self.registration.scope).pathname);

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL_FILES.map(f => new URL(f, self.registration.scope).href)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k.startsWith('dtb-')).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()).then(() => {
      self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage('sw-updated'))
      );
    })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  const path = url.pathname;

  // Shell files — Cache First
  if (SHELL.some(s => path === s) || path === self.registration.scope.replace(/\/$/, '') + '/') {
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

  // tools/*.js + agent/**/*.js — Stale While Revalidate
  if ((path.includes('/tools/') || path.includes('/agent/')) && path.endsWith('.js')) {
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
  // Other requests — network only
});
