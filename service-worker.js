const CACHE_NAME = "noat-mobile-reader-2.5.7";
// รูปในบท (คนละโดเมนกับแอป) ถูกเก็บแยกไว้ เพื่อให้อ่านออฟไลน์แล้วรูปยังอยู่
const IMAGE_CACHE = "noat-reader-images";
const IMAGE_PATTERN = /\.(?:png|jpe?g|gif|webp|avif|svg|bmp)(?:[/?#]|$)/i;
const APP_FILES = [
  "characters.json",
  "./characters-local.json",
  "./icons/theme/black.png",
  "./icons/theme/christmas.png",
  "./icons/theme/cool.png",
  "./icons/theme/cyberpunk.png",
  "./icons/theme/custom.png",
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
  "./fonts/sarabun-thai-600.woff2",
  "./fonts/OFL-ibm-plex.txt",
  "./fonts/OFL-kanit.txt",
  "./fonts/OFL-pridi.txt",
  "./fonts/OFL-prompt.txt",
  "./fonts/ibm-plex-latin-400.woff2",
  "./fonts/ibm-plex-latin-600.woff2",
  "./fonts/ibm-plex-latin-ext-400.woff2",
  "./fonts/ibm-plex-latin-ext-600.woff2",
  "./fonts/ibm-plex-thai-400.woff2",
  "./fonts/ibm-plex-thai-600.woff2",
  "./fonts/kanit-latin-400.woff2",
  "./fonts/kanit-latin-600.woff2",
  "./fonts/kanit-latin-ext-400.woff2",
  "./fonts/kanit-latin-ext-600.woff2",
  "./fonts/kanit-thai-400.woff2",
  "./fonts/kanit-thai-600.woff2",
  "./fonts/pridi-latin-400.woff2",
  "./fonts/pridi-latin-600.woff2",
  "./fonts/pridi-latin-ext-400.woff2",
  "./fonts/pridi-latin-ext-600.woff2",
  "./fonts/pridi-thai-400.woff2",
  "./fonts/pridi-thai-600.woff2",
  "./fonts/prompt-latin-400.woff2",
  "./fonts/prompt-latin-600.woff2",
  "./fonts/prompt-latin-ext-400.woff2",
  "./fonts/prompt-latin-ext-600.woff2",
  "./fonts/prompt-thai-400.woff2",
  "./fonts/prompt-thai-600.woff2",
  "./fonts/OFL-mali.txt",
  "./fonts/mali-thai-400.woff2",
  "./fonts/mali-thai-600.woff2",
  "./fonts/mali-latin-400.woff2",
  "./fonts/mali-latin-600.woff2",
  "./fonts/mali-latin-ext-400.woff2",
  "./fonts/mali-latin-ext-600.woff2",
  // ภาพเปิดแอปของ iOS: อ้างอยู่ใน index.html ถ้าไม่เก็บไว้จะเห็นเป็นพื้นว่างตอนไม่มีเน็ต
  "./splash/splash-750x1334.png",
  "./splash/splash-828x1792.png",
  "./splash/splash-1080x2340.png",
  "./splash/splash-1125x2436.png",
  "./splash/splash-1170x2532.png",
  "./splash/splash-1179x2556.png",
  "./splash/splash-1206x2622.png",
  "./splash/splash-1242x2688.png",
  "./splash/splash-1284x2778.png",
  "./splash/splash-1290x2796.png",
  "./splash/splash-1320x2868.png"
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

/* Cache-first for pictures: a chapter opened once online keeps its images offline.
   Opaque responses (image hosts without CORS) still render inside an <img>. */
async function imageFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch (_) {
    return Response.error();
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (request.destination === "image" || IMAGE_PATTERN.test(url.pathname + url.search)) {
    event.respondWith(imageFirst(request));
    return;
  }
  if (url.origin !== self.location.origin) return;
  const fresh = request.mode === "navigate" || FRESH_EXTENSIONS.some(extension => url.pathname.endsWith(extension));
  event.respondWith(fresh ? networkFirst(request) : cacheFirst(request));
});
