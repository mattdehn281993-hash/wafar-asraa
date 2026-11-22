// Wafar Asraa service worker: makes the installed app open fast and work offline.
// Pages: network first, falling back to the saved copy of the app.
// Built files (hashed names under /assets/) and icons: saved copy first, since their content never changes.
// API calls are never cached.
const CACHE = "wafar-v1";
const SHELL = "index.html";

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new URL(SHELL, self.registration.scope))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(new URL(SHELL, self.registration.scope), copy)); }
      return response;
    }).catch(() => caches.match(new URL(SHELL, self.registration.scope))));
    return;
  }

  if (url.pathname.includes("/assets/") || url.pathname.includes("/icons/")) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
      return response;
    })));
  }
});
