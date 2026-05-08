const VERSION = "1.1.4";
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

// Fetch: only handle same-origin http/https requests
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Ignore non http(s) schemes (chrome-extension, data, blob, etc.)
  if (!url.protocol.startsWith("http")) return;

  // Ignore third-party requests (Cloudflare analytics, CDNs, etc.)
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML — always get fresh page on navigation
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

  // Cache-first for same-origin JS/CSS/assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Only cache valid same-origin responses
        if (!res || res.status !== 200 || res.type !== "basic") return res;
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      });
    })
  );
});
