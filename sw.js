const CACHE_VERSION = '8de4a3a8';
const CACHE = 'dtb-' + CACHE_VERSION;
const SHELL_FILES = [
'dashboard.html',
'dashboard.js',
'dashboard-cmd.js',
'i18n.js',
'dashboard-base.css',
'dashboard-components.css',
'dashboard-theme.css'
];
const SHELL = SHELL_FILES.map(f => new URL(f, self.registration.scope).pathname);
self.addEventListener('install', e => {
e.waitUntil(
caches.open(CACHE)
.then(c => Promise.allSettled(SHELL_FILES.map(f => c.add(new URL(f, self.registration.scope).href))))
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
if (SHELL.some(s => path === s) || path === self.registration.scope.replace(/\/$/, '') + '/') {
e.respondWith(
caches.match(e.request).then(cached =>
cached || fetch(e.request).then(res => {
if (!res.ok) return res;
const clone = res.clone();
caches.open(CACHE).then(c => c.put(e.request, clone));
return res;
}).catch(() => caches.match(e.request))
)
);
return;
}
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
});