const CACHE_NAME = "noat-mobile-reader-v6";
const APP_FILES = [
  "./", "./index.html", "./app.js", "./style.css", "./manifest.webmanifest", "./service-worker.js",
  "./icons/icon-180.png", "./icons/icon-512.png",
  "./fonts/NotoSansThai-thai.woff2", "./fonts/NotoSansThai-latin-ext.woff2", "./fonts/NotoSansThai-latin.woff2",
  "./fonts/OFL-Noto-Sans-Thai.txt"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("noat-mobile-reader-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && response.type === "basic") caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(() => request.mode === "navigate" ? caches.match("./index.html") : Response.error())));
});
