const VERSION = "1.1.3";
const CACHE = `wildlands-${VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./help.html",
  "./style.css",
  "./main.js",
];

// Install: cache all core assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: delete all old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Allow pages to trigger skipWaiting via postMessage
self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
});

// Fetch: network-first for HTML, cache-first for everything else
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Always go network-first for HTML pages so updates land immediately
  if (e.request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for JS/CSS (versioned via ?v= so stale is never a problem)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      });
    })
  );
});
