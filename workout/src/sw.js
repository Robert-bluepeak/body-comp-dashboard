// sw.js -- built file. The cache name and the precache list below are injected
// by build.py; the cache name carries a hash of every built asset, so any real
// change produces a new cache and the old one is dropped on activate.
//
// Scope is ./ relative to this file, i.e. /workout/ -- it deliberately does not
// touch the dashboard's own service worker at the site root.

const CACHE = '/*@CACHE_NAME*/';
const PRECACHE = /*@PRECACHE*/;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll is all-or-nothing; add individually so one bad asset cannot leave
    // the app with no offline copy at all.
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        await cache.add(new Request(url, { cache: 'reload' }));
      } catch (err) {
        console.warn('[sw] precache miss', url, err);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith('workout-') && k !== CACHE).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

// Cache-first for everything we shipped: this app has to open instantly with
// the phone in airplane mode, and the cache name already handles busting.
// Anything else falls back to the network, then to the app shell.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) {
      // Refresh in the background so a deploy lands on the next launch.
      event.waitUntil(revalidate(cache, req));
      return hit;
    }
    try {
      const resp = await fetch(req);
      if (resp.ok && resp.type === 'basic') cache.put(req, resp.clone());
      return resp;
    } catch (err) {
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});

async function revalidate(cache, req) {
  try {
    const resp = await fetch(req, { cache: 'no-cache' });
    if (resp.ok && resp.type === 'basic') await cache.put(req, resp.clone());
  } catch (_) {
    // Offline. The cached copy is the answer.
  }
}
