/* Each release is installed atomically; activation is explicitly requested by the UI. */
const CACHE_VERSION = self.__SW_VERSION__ || 'dev';
const PRECACHE = self.__PRECACHE__ || [];
const PREFIX = 'dtb-release:' + new URL(self.registration.scope).pathname + ':';
const CACHE = PREFIX + CACHE_VERSION;
const absolute = path => new URL(path, self.registration.scope).href;
const assets = new Set(PRECACHE.map(asset => new URL(asset.path, self.registration.scope).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let next = 0;
    try {
      // Bound concurrent downloads; every file must match the build's digest.
      await Promise.all(Array.from({ length: Math.min(8, PRECACHE.length) }, async () => {
        while (next < PRECACHE.length) {
          const asset = PRECACHE[next++];
          const url = new URL(asset.path, self.registration.scope);
          url.searchParams.set('v', CACHE_VERSION);
          const response = await fetch(url, { cache: 'no-store' });
          if (!response.ok) throw new Error('Release asset unavailable: ' + asset.path);
          const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
          const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
          if (hex !== asset.sha256) throw new Error('Release asset mismatch: ' + asset.path);
          await cache.put(absolute(asset.path), response);
        }
      }));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Retain two previous releases for other tabs still executing their old code.
    const previous = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE);
    await Promise.all(previous.slice(0, -2).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'GET_VERSION') event.ports[0]?.postMessage({ version: CACHE_VERSION });
  if (event.data?.type === 'ACTIVATE') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  if (event.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const home = url.pathname === scope.pathname || url.pathname === new URL('index.html', scope).pathname;
  const navigation = event.request.mode === 'navigate' && (home || url.pathname === new URL('dashboard.html', scope).pathname);
  if (!navigation && !assets.has(url.pathname)) return;
  event.respondWith((async () => {
    const version = navigation ? CACHE_VERSION : url.searchParams.get('v') || CACHE_VERSION;
    const key = navigation ? absolute('dashboard.html') : url.origin + url.pathname;
    const response = await caches.match(key, { cacheName: PREFIX + version });
    // Never mix a retired/incomplete release with files from the current network deployment.
    return response || new Response('This release is unavailable. Check for updates and refresh.', { status: 503 });
  })());
});
