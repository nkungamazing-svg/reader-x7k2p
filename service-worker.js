const CACHE_NAME = "noat-mobile-reader-1.11.8";
const APP_FILES = [
  "characters.json",
  "./characters-local.json",
  "./icons/theme/black.png",
  "./icons/theme/christmas.png",
  "./icons/theme/cool.png",
  "./icons/theme/cyberpunk.png",
  "./icons/theme/dark.png",
  "./icons/theme/dusk.png",
  "./icons/theme/eye.png",
  "./icons/theme/halloween.png",
  "./icons/theme/isekai.png",
  "./icons/theme/light.png",
  "./icons/theme/newyear.png",
  "./icons/theme/paper.png",
  "./icons/theme/reading.png",
  "./icons/theme/rezero.png",
  "./icons/theme/sepia.png",
  "./icons/theme/songkran.png",
  "./characters/al.jpg",
  "./characters/anastasia-hoshin.jpg",
  "./characters/beatrice.jpg",
  "./characters/crusch-karsten.jpg",
  "./characters/elsa-granhiert.jpg",
  "./characters/emilia.jpg",
  "./characters/eridna.jpg",
  "./characters/felt.jpg",
  "./characters/ferris.jpg",
  "./characters/frederica-baumann.jpg",
  "./characters/garfiel-tinzel.jpg",
  "./characters/julius-juukulius.jpg",
  "./characters/meili-portroute.jpg",
  "./characters/natsuki-subaru.jpg",
  "./characters/otto-suwen.jpg",
  "./characters/petra-leyte.jpg",
  "./characters/priscilla-barielle.jpg",
  "./characters/puck.jpg",
  "./characters/ram.jpg",
  "./characters/reinhard-van-astrea.jpg",
  "./characters/rem.jpg",
  "./characters/roswaal-l-mathers.jpg",
  "./characters/satella.jpg",
  "./characters/wilhelm-van-astrea.jpg",
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./icons/icon-180.png",
  "./icons/icon-512.png",
  "./fonts/NotoSansThai-latin-ext.woff2",
  "./fonts/NotoSansThai-latin.woff2",
  "./fonts/NotoSansThai-thai.woff2",
  "./fonts/OFL-Noto-Sans-Thai.txt",
  "./fonts/OFL-noto-serif-thai.txt",
  "./fonts/OFL-sarabun.txt",
  "./fonts/noto-serif-thai-latin-400.woff2",
  "./fonts/noto-serif-thai-latin-600.woff2",
  "./fonts/noto-serif-thai-latin-ext-400.woff2",
  "./fonts/noto-serif-thai-latin-ext-600.woff2",
  "./fonts/noto-serif-thai-thai-400.woff2",
  "./fonts/noto-serif-thai-thai-600.woff2",
  "./fonts/sarabun-latin-400.woff2",
  "./fonts/sarabun-latin-600.woff2",
  "./fonts/sarabun-latin-ext-400.woff2",
  "./fonts/sarabun-latin-ext-600.woff2",
  "./fonts/sarabun-thai-400.woff2",
  "./fonts/sarabun-thai-600.woff2"
];

// App shell files are fetched fresh so a new release shows up on the next load;
// fonts, icons and other assets stay cache-first to save data.
const FRESH_EXTENSIONS = [".html", ".js", ".css", ".webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("noat-mobile-reader-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return request.mode === "navigate" ? (await cache.match("./index.html")) || Response.error() : Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  } catch (_) {
    return Response.error();
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const fresh = request.mode === "navigate" || FRESH_EXTENSIONS.some(extension => url.pathname.endsWith(extension));
  event.respondWith(fresh ? networkFirst(request) : cacheFirst(request));
});
