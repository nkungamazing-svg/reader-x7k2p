"use strict";

const DB_NAME = "noat-mobile-reader";
const DB_VERSION = 1;
const CHAPTERS = "chapters";
const SETTINGS = "settings";
const BACKUP_FORMAT = "NOAT_STORAGE_EXPORT";
const APP_VERSION = "1.6.0";
const SPLASH_MIN_MS = 850;
const splashStartedAt = performance.now();
const THEMES = ["dark", "light", "sepia", "black", "eye", "cool", "dusk"];
const THEME_COLORS = { dark: "#222631", light: "#ffffff", sepia: "#e7dbc4", black: "#080808", eye: "#dde8d7", cool: "#f1f5f9", dusk: "#242120" };

function paintVersionLabels() {
  const label = `เวอร์ชัน ${APP_VERSION}`;
  const splashLabel = document.getElementById("splash-version");
  if (splashLabel) splashLabel.textContent = label;
  const footerLabel = document.getElementById("app-version");
  if (footerLabel) footerLabel.textContent = label;
}

function hideSplash() {
  const splash = document.getElementById("splash");
  if (!splash) return;
  const wait = Math.max(0, SPLASH_MIN_MS - (performance.now() - splashStartedAt));
  setTimeout(() => {
    if (splash.classList.contains("hide")) return;
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 500);
  }, wait);
}
const dbReady = openDatabase();
const byId = id => document.getElementById(id);
const state = { chapters: [], activeId: "", theme: "dark", fontSize: 19, lineHeight: 1.9, textWidth: 760, rate: 1, voiceURI: "", pronunciation: [], voices: [], speechQueue: [], speechIndex: 0, speaking: false, utterance: null, speechToken: 0, currentBlockIndex: -1, highlightEnabled: true, followEnabled: true, loadRemoteImages: true, keepScreenAwake: false, wakeLock: null, scrollTimer: 0, noticeTimer: 0, imported: null, statusTimer: 0, sidebarLockY: null, pointerStart: null, pointerTapReady: null, pointerTapExpiry: 0, mode: "scroll", indent: true, pageTop: 0, tapSpeech: true, fontFamily: "noto", pageIndex: 0, pageTotal: 1, pageStep: 0, blockPages: new Map(), pageTimer: 0, paginateTimer: 0, pageHintShown: false, suppressTapUntil: 0, updateTimer: 0, tapHint: true, hintShown: false, hintTimer: 0, flashTimer: 0, chapterRenderTimer: 0, characterImages: null, characterCardTimer: 0, characterNames: null, characterSuggestTimer: 0 };

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CHAPTERS)) db.createObjectStore(CHAPTERS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("เปิดฐานข้อมูลในเครื่องไม่สำเร็จ"));
    request.onblocked = () => reject(new Error("ฐานข้อมูลกำลังถูกใช้งานในแท็บอื่น กรุณาปิดแท็บ PWA ซ้ำแล้วลองใหม่"));
  });
}

function requestValue(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("อ่านฐานข้อมูลไม่สำเร็จ"));
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("บันทึกข้อมูลไม่สำเร็จ"));
    tx.onabort = () => reject(tx.error || new Error("ยกเลิกการบันทึกข้อมูล"));
  });
}

async function readAllChapters() {
  const db = await dbReady;
  return requestValue(db.transaction(CHAPTERS, "readonly").objectStore(CHAPTERS).getAll());
}

async function readSetting(id, fallback = null) {
  const db = await dbReady;
  const value = await requestValue(db.transaction(SETTINGS, "readonly").objectStore(SETTINGS).get(id));
  return value ? value.value : fallback;
}

async function writeSetting(id, value) {
  const db = await dbReady;
  const tx = db.transaction(SETTINGS, "readwrite");
  tx.objectStore(SETTINGS).put({ id, value });
  await transactionDone(tx);
}

async function syncWakeLock() {
  const shouldHold = state.keepScreenAwake && Boolean(state.activeId) && document.visibilityState === "visible";
  if (!shouldHold) {
    if (state.wakeLock) { const lock = state.wakeLock; state.wakeLock = null; try { await lock.release(); } catch (_) {} }
    return;
  }
  if (state.wakeLock || !navigator.wakeLock?.request) {
    if (!navigator.wakeLock?.request) showStatus("เบราว์เซอร์นี้ยังไม่รองรับการกันหน้าจอดับ", 6000);
    return;
  }
  try {
    const lock = await navigator.wakeLock.request("screen");
    state.wakeLock = lock;
    lock.addEventListener("release", () => { if (state.wakeLock === lock) state.wakeLock = null; }, { once: true });
  } catch (_) { showStatus("เปิดการกันหน้าจอดับไม่ได้ ลองเปิดหน้าเว็บแบบ HTTPS แล้วอนุญาตอีกครั้ง", 7000); }
}

async function refreshChapters() {
  state.chapters = await readAllChapters();
  renderChapterList();
  byId("chapter-count").textContent = state.chapters.length.toLocaleString("th-TH");
  byId("empty-state").hidden = state.chapters.length > 0;
  if (state.activeId && !state.chapters.some(item => item.id === state.activeId)) closeReader();
}

function normalizeTitle(item) {
  return String(item.translatedTitle || item.title || "บทแปล").replace(/\s+/gu, " ").trim();
}

function novelLabel(item) {
  const title = String(item.novelTitle || "").trim();
  if (title) return title;
  if (item.novelId) return String(item.novelId);
  try { return new URL(item.sourceUrl).hostname.replace(/^www\./i, ""); } catch { return "เรื่องไม่ระบุชื่อ"; }
}

function chapterParts(item) {
  const title = `${item.title || ""} ${item.translatedTitle || ""}`;
  const arcMatch = title.match(/\bArc\s*(\d+)\b|อาร์ค\s*(\d+)/iu);
  const chapterMatch = title.match(/\bChapter\s*(\d+)\b|บทที่\s*(\d+)|ตอนที่\s*(\d+)/iu);
  const arcValue = item.arcNumber ?? item.arc ?? arcMatch?.[1] ?? arcMatch?.[2];
  const chapterValue = item.chapterNumber ?? item.episodeNumber ?? chapterMatch?.[1] ?? chapterMatch?.[2] ?? chapterMatch?.[3];
  return { arc: Number.isFinite(Number(arcValue)) && arcValue !== "" ? Number(arcValue) : null, chapter: Number.isFinite(Number(chapterValue)) && chapterValue !== "" ? Number(chapterValue) : null };
}

function sortChapters(items) {
  const mode = byId("sort").value;
  return [...items].sort((a, b) => {
    if (mode === "recent") return Number(b.savedAt || 0) - Number(a.savedAt || 0);
    const left = chapterParts(a), right = chapterParts(b), direction = mode === "desc" ? -1 : 1;
    for (const key of ["arc", "chapter"]) {
      if (left[key] == null && right[key] != null) return 1;
      if (left[key] != null && right[key] == null) return -1;
      if (left[key] != null && right[key] != null && left[key] !== right[key]) return (left[key] - right[key]) * direction;
    }
    return normalizeTitle(a).localeCompare(normalizeTitle(b), "th", { numeric: true, sensitivity: "base" }) * direction;
  });
}

function updateChapterNavigation() {
  const current = state.chapters.find(item => item.id === state.activeId);
  const previous = byId("chapter-previous"), next = byId("chapter-next");
  if (!current) { previous.disabled = true; next.disabled = true; return; }
  const ordered = sortChapters(state.chapters.filter(item => novelLabel(item) === novelLabel(current)));
  const index = ordered.findIndex(item => item.id === current.id);
  previous.disabled = index <= 0;
  next.disabled = index < 0 || index >= ordered.length - 1;
  previous.title = index > 0 ? normalizeTitle(ordered[index - 1]) : "ไม่มีตอนก่อนหน้า";
  next.title = index >= 0 && index < ordered.length - 1 ? normalizeTitle(ordered[index + 1]) : "ไม่มีตอนถัดไป";
}

function activeChapter() {
  return state.chapters.find(chapter => chapter.id === state.activeId);
}

function goToAdjacentChapter(direction, { toEnd = false } = {}) {
  const current = activeChapter();
  if (!current) return false;
  const ordered = sortChapters(state.chapters.filter(item => novelLabel(item) === novelLabel(current)));
  const index = ordered.findIndex(item => item.id === current.id);
  const target = ordered[index + direction];
  if (!target) return false;
  void openChapter(target.id, direction > 0 || !toEnd ? { scrollToTop: true } : { toEnd: true }).catch(error => showStatus(`เปิดตอนไม่สำเร็จ: ${error.message}`));
  return true;
}

function scheduleChapterRender() {
  clearTimeout(state.chapterRenderTimer);
  state.chapterRenderTimer = setTimeout(renderChapterList, 140);
}

function renderChapterList() {
  const root = byId("chapter-list");
  root.replaceChildren();
  const query = byId("search").value.trim().toLocaleLowerCase();
  const filtered = state.chapters.filter(item => !query || `${novelLabel(item)} ${item.title || ""} ${item.translatedTitle || ""} ${item.novelId || ""}`.toLocaleLowerCase().includes(query));
  const novels = new Map();
  for (const item of sortChapters(filtered)) {
    const label = novelLabel(item);
    if (!novels.has(label)) novels.set(label, []);
    novels.get(label).push(item);
  }
  for (const [novel, items] of novels) {
    const group = document.createElement("section"); group.className = "novel-group";
    const heading = document.createElement("div"); heading.className = "novel-title";
    const name = document.createElement("span"); name.textContent = novel;
    const readCount = items.filter(item => Number(item.lastReadProgress || 0) >= 0.98).length;
    const count = document.createElement("small"); count.textContent = readCount ? `${readCount}/${items.length} ตอน` : `${items.length} ตอน`;
    heading.append(name, count); group.append(heading);
    const arcs = new Map();
    for (const item of items) {
      const arc = chapterParts(item).arc;
      const key = arc == null ? "ไม่ระบุ Arc" : `Arc ${arc}`;
      if (!arcs.has(key)) arcs.set(key, []);
      arcs.get(key).push(item);
    }
    const arcEntries = [...arcs.entries()].sort((a, b) => {
      if (a[0] === "ไม่ระบุ Arc") return 1;
      if (b[0] === "ไม่ระบุ Arc") return -1;
      const factor = byId("sort").value === "desc" ? -1 : 1;
      return (Number(a[0].replace(/\D/gu, "")) - Number(b[0].replace(/\D/gu, ""))) * factor;
    });
    for (const [arc, arcItems] of arcEntries) {
      const section = document.createElement("section"); section.className = "arc-group";
      const arcHeading = document.createElement("div"); arcHeading.className = "arc-title";
      const arcName = document.createElement("span"); arcName.textContent = arc;
      const arcCount = document.createElement("small"); arcCount.textContent = `${arcItems.length} ตอน`;
      arcHeading.append(arcName, arcCount); section.append(arcHeading);
      for (const item of arcItems) {
        const ratio = Math.max(0, Math.min(1, Number(item.lastReadProgress || item.lastScrollRatio || 0)));
        const percent = Math.round(ratio * 100);
        const active = item.id === state.activeId;
        const number = chapterParts(item).chapter;
        const button = document.createElement("button"); button.type = "button"; button.className = `chapter-link${active ? " active" : ""}`;
        button.setAttribute("aria-current", active ? "true" : "false");
        button.setAttribute("aria-label", percent > 0 ? `${normalizeTitle(item)} · อ่านแล้ว ${percent}%` : normalizeTitle(item));
        const index = document.createElement("span"); index.className = "chapter-index"; index.textContent = number == null ? "•" : String(number);
        const text = document.createElement("span"); text.className = "chapter-text";
        const title = document.createElement("strong"); title.textContent = normalizeTitle(item); text.append(title);
        button.append(index, text);
        if (ratio >= 0.98) {
          const badge = document.createElement("span"); badge.className = "chapter-badge read"; badge.textContent = "อ่านแล้ว"; button.append(badge);
        } else if (ratio > 0) {
          const badge = document.createElement("span"); badge.className = "chapter-badge"; badge.textContent = `${percent}%`; button.append(badge);
          const bar = document.createElement("span"); bar.className = "mini-progress";
          const fill = document.createElement("i"); fill.style.width = `${percent}%`; bar.append(fill); button.append(bar);
        }
        button.addEventListener("click", () => openChapter(item.id)); section.append(button);
      }
      group.append(section);
    }
    root.append(group);
  }
  byId("chapter-count").textContent = query ? `${filtered.length}/${state.chapters.length}` : state.chapters.length.toLocaleString("th-TH");
  byId("empty-state").hidden = state.chapters.length > 0;
  if (state.chapters.length > 0 && filtered.length === 0) {
    const noMatch = document.createElement("div"); noMatch.className = "empty-state"; noMatch.textContent = "ไม่พบบทที่ตรงกับคำค้น"; root.append(noMatch);
  }
}

function showStatus(message, duration = 5000) {
  const status = byId("status"); status.textContent = message; status.hidden = false;
  clearTimeout(state.statusTimer);
  if (duration > 0) state.statusTimer = setTimeout(() => { status.hidden = true; }, duration);
}

function applyTheme(theme) {
  state.theme = THEMES.includes(theme) ? theme : "dark";
  document.documentElement.dataset.theme = state.theme;
  for (const name of THEMES) byId(`theme-${name}`).setAttribute("aria-pressed", String(state.theme === name));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[state.theme] || "#222631");
}

function makeRemoteImageFallback(image, source) {
  const fallback = document.createElement("div"); fallback.className = "remote-image-error"; fallback.hidden = true;
  const message = document.createElement("span"); message.textContent = "รูปโหลดไม่ได้ (ต้องมีอินเทอร์เน็ต)";
  const retry = document.createElement("button"); retry.type = "button"; retry.textContent = "ลองใหม่";
  retry.addEventListener("click", () => { fallback.hidden = true; image.hidden = false; image.src = source; });
  fallback.append(message, retry);
  image.insertAdjacentElement("afterend", fallback);
  image.addEventListener("error", () => { image.hidden = true; fallback.hidden = false; }, { passive: true });
}

function safeChapterFragment(html, baseUrl = "") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ""), "text/html");
  doc.querySelectorAll("script,iframe,frame,frameset,object,embed,form,link,meta,base,style,svg,video,audio,source,track").forEach(node => node.remove());
  for (const element of doc.body.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith("on") || name === "srcset" || name === "formaction") { element.removeAttribute(attribute.name); continue; }
      if (["src", "href", "xlink:href", "poster"].includes(name)) {
        if (/^(?:javascript|vbscript):/i.test(value)) { element.removeAttribute(attribute.name); continue; }
        if (name === "src" && element.tagName === "IMG") {
          if (!value) { element.removeAttribute("src"); continue; }
          const safeDataImage = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z\d+/]+=*$/i.test(value);
          let remoteUrl = "";
          try {
            const resolved = new URL(value, baseUrl || location.href);
            if (/^https?:$/i.test(resolved.protocol)) remoteUrl = resolved.href;
          } catch (_) {}
          if (safeDataImage) {
            element.loading = "lazy"; element.decoding = "async";
          } else if (remoteUrl && state.loadRemoteImages) {
            element.loading = "lazy"; element.referrerPolicy = "no-referrer"; element.decoding = "async";
            makeRemoteImageFallback(element, remoteUrl);
            element.src = remoteUrl;
          } else {
            element.dataset.blockedRemoteImage = remoteUrl ? "disabled" : "unsafe";
            element.removeAttribute("src");
            element.alt ||= remoteUrl ? "ปิดการโหลดรูปจากเว็บต้นทางอยู่" : "รูปแบบที่อยู่รูปนี้ไม่รองรับ";
          }
        }
        if (name === "href" && /^https?:/i.test(value)) { element.setAttribute("target", "_blank"); element.setAttribute("rel", "noopener noreferrer"); element.setAttribute("referrerpolicy", "no-referrer"); }
      }
      if (name === "style") {
        const cleanStyle = value.replace(/url\((?:[^)]*)\)/gi, "none").replace(/expression\s*\(/gi, "invalid(")
          .replace(/font-size\s*:\s*([^;]+)/gi, (declaration, size) => {
            const text = String(size).trim(), number = parseFloat(text);
            if (!Number.isFinite(number)) return "";
            if (/px$/i.test(text)) return number > 40 ? "" : declaration;
            if (/(?:em|rem)$/i.test(text)) return number > 2.2 ? "" : declaration;
            return declaration;
          });
        element.setAttribute("style", cleanStyle);
      }
    }
  }
  const fragment = document.createDocumentFragment();
  while (doc.body.firstChild) fragment.append(doc.body.firstChild);
  return fragment;
}

async function openChapter(id, { scrollToTop = false, toEnd = false } = {}) {
  const item = state.chapters.find(chapter => chapter.id === id);
  if (!item) return;
  stopSpeech(false);
  if (scrollToTop || toEnd) { item.lastScrollRatio = toEnd ? 1 : 0; item.lastReadProgress = toEnd ? 1 : 0; item.lastProgressMode = "scroll"; }
  state.speechQueue = []; state.speechIndex = 0;
  state.activeId = id;
  byId("welcome").hidden = true; byId("reader").hidden = false;
  byId("audio-bar").hidden = false;
  byId("chapter-navigation").hidden = false;
  byId("reader-novel").textContent = novelLabel(item);
  byId("reader-title").textContent = normalizeTitle(item);
  renderChapterContent(item);
  document.body.classList.add("reading");
  const ratio = toEnd ? 1 : scrollToTop ? 0 : clamp01(Number(item.lastScrollRatio ?? item.lastReadProgress) || 0);
  setSidebarOpen(false, { restorePosition: false });
  if (isPageMode()) {
    paginateContent();
    setPage(Math.round(ratio * Math.max(0, state.pageTotal - 1)), { animate: false });
    toggleChrome(false);
    if (!state.pageHintShown) { state.pageHintShown = true; state.hintShown = true; showTapHint(); }
  } else {
    toggleChrome(true);
    requestAnimationFrame(() => window.scrollTo({ top: ratio * Math.max(0, document.documentElement.scrollHeight - innerHeight), behavior: "instant" }));
  }
  updateChapterNavigation();
  void syncWakeLock();
  await writeSetting("lastActiveId", id);
  if (scrollToTop || toEnd) { const db = await dbReady; const tx = db.transaction(CHAPTERS, "readwrite"); tx.objectStore(CHAPTERS).put(item); await transactionDone(tx); }
  renderChapterList();
  history.replaceState(null, "", `#chapter=${encodeURIComponent(id)}`);
}

function closeReader() {
  document.body.classList.remove("reading");
  toggleChrome(true);
  stopSpeech(false); state.activeId = ""; byId("reader").hidden = true; byId("chapter-navigation").hidden = true; byId("welcome").hidden = false; byId("audio-bar").hidden = true; void syncWakeLock(); renderChapterList();
}

function markSmallImages(root) {
  for (const image of root.querySelectorAll("img")) {
    const apply = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      image.classList.toggle("emoji-img", image.naturalWidth <= 200 && image.naturalHeight <= 200);
    };
    if (image.complete) apply();
    else image.addEventListener("load", apply, { once: true });
  }
}

function renderChapterContent(item) {
  const content = byId("reader-content");
  content.replaceChildren();
  if (isPageMode()) {
    const heading = document.createElement("header");
    heading.className = "page-chapter-head";
    const novel = document.createElement("p");
    novel.textContent = novelLabel(item);
    const title = document.createElement("h1");
    title.textContent = normalizeTitle(item);
    heading.append(novel, title);
    content.append(heading);
  }
  content.append(safeChapterFragment(item.html, item.sourceUrl || ""));
  const blockSelector = "p,li,blockquote,h1,h2,h3,h4,h5,h6";
  const blocks = [...content.querySelectorAll(blockSelector)].filter(element => !element.parentElement?.closest(blockSelector));
  blocks.forEach((block, blockIndex) => { block.dataset.blockIndex = String(blockIndex); });
  state.currentBlockIndex = -1;
  markSmallImages(content);
  decorateSpeakerLabels(content);
  for (const image of content.querySelectorAll("img")) {
    if (!image.complete) image.addEventListener("load", () => schedulePaginate(), { once: true });
  }
}

function revealActiveChapter() {
  const list = byId("chapter-list");
  const active = list.querySelector(".chapter-link.active");
  if (!active || !list.clientHeight) return;
  const listRect = list.getBoundingClientRect(), rowRect = active.getBoundingClientRect();
  list.scrollTop += rowRect.top - listRect.top - list.clientHeight / 2 + rowRect.height / 2;
}

function setSidebarOpen(open, { restorePosition = true } = {}) {
  if (open && isPageMode()) toggleChrome(true);
  const isMobile = matchMedia("(max-width: 760px)").matches;
  if (!isMobile) { document.body.classList.toggle("sidebar-open", Boolean(open)); return; }
  if (open) {
    if (document.body.classList.contains("sidebar-open")) return;
    state.sidebarLockY = window.scrollY;
    document.body.classList.add("sidebar-open", "sidebar-locked");
    document.body.style.top = `-${state.sidebarLockY}px`;
    document.body.style.left = "0"; document.body.style.right = "0"; document.body.style.width = "100%";
    byId("menu-toggle").setAttribute("aria-expanded", "true");
    requestAnimationFrame(revealActiveChapter);
    return;
  }
  document.body.classList.remove("sidebar-open", "sidebar-locked");
  document.body.style.removeProperty("top"); document.body.style.removeProperty("left"); document.body.style.removeProperty("right"); document.body.style.removeProperty("width");
  const savedY = state.sidebarLockY; state.sidebarLockY = null;
  byId("menu-toggle").setAttribute("aria-expanded", "false");
  if (restorePosition && savedY !== null) window.scrollTo({ top: savedY, behavior: "instant" });
}

async function persistReadingPosition() {
  const item = activeChapter();
  if (!item) return;
  const ratio = readingRatio();
  item.lastScrollRatio = ratio;
  if (!state.speaking) { item.lastReadProgress = ratio; item.lastProgressMode = isPageMode() ? "page" : "scroll"; }
  const db = await dbReady; const tx = db.transaction(CHAPTERS, "readwrite"); tx.objectStore(CHAPTERS).put(item); await transactionDone(tx); renderChapterList();
}

function saveReadingPosition() {
  clearTimeout(state.scrollTimer);
  state.scrollTimer = setTimeout(() => persistReadingPosition().catch(error => showStatus(`บันทึกตำแหน่งอ่านไม่สำเร็จ: ${error.message}`)), 500);
}

function buildSpeechQueue() {
  const content = byId("reader-content");
  const blockSelector = "p,li,blockquote,h1,h2,h3,h4,h5,h6";
  const blocks = [...content.querySelectorAll(blockSelector)].filter(element => !element.parentElement?.closest(blockSelector));
  return blocks.flatMap((block, blockIndex) => splitSpeechText(block.textContent.replace(/\s+/gu, " ").trim())
    .map(text => ({ text, blockIndex })));
}

function splitSpeechText(text, maxLength = 180) {
  const sentences = text.match(/[^.!?。！？…]+[.!?。！？…]*|[.!?。！？…]+/gu) || [text];
  const chunks = [];
  for (let sentence of sentences.map(part => part.trim()).filter(Boolean)) {
    while (sentence.length > maxLength) {
      let cut = sentence.lastIndexOf(" ", maxLength);
      if (cut < Math.floor(maxLength * .45)) cut = maxLength;
      chunks.push(sentence.slice(0, cut).trim()); sentence = sentence.slice(cut).trim();
    }
    if (sentence) chunks.push(sentence);
  }
  return chunks;
}

function applyPronunciation(text) {
  let result = text;
  const entries = [...state.pronunciation].filter(entry => entry?.word?.trim() && entry?.reading?.trim()).sort((a, b) => b.word.length - a.word.length);
  for (const { word, reading } of entries) result = result.replace(new RegExp(word.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu"), reading.trim());
  return result;
}

function refreshVoices() {
  if (!("speechSynthesis" in window)) { byId("voice-select").innerHTML = "<option value=''>ไม่รองรับเสียงอ่าน</option>"; return; }
  const uniqueVoices = new Map();
  for (const voice of speechSynthesis.getVoices().filter(item => /^th(?:-|$)/i.test(item.lang))) {
    const key = voice.voiceURI || `${voice.name}\u0000${voice.lang}`;
    if (!uniqueVoices.has(key)) uniqueVoices.set(key, voice);
  }
  state.voices = [...uniqueVoices.values()];
  const select = byId("voice-select"); select.replaceChildren();
  if (!state.voices.length) { const option = new Option("ไม่พบเสียงภาษาไทยใน iPhone", ""); select.add(option); state.voiceURI = ""; return; }
  const labelCounts = new Map();
  for (const voice of state.voices) {
    const label = `${voice.name} · ${voice.lang}`;
    labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
  }
  const labelIndexes = new Map();
  for (const voice of state.voices) {
    const baseLabel = `${voice.name} · ${voice.lang}`;
    const voiceId = String(voice.voiceURI || "").toLowerCase();
    let quality = "";
    if (/premium|enhanced|high.?quality|quality.?high/u.test(voiceId)) quality = "คุณภาพสูง";
    else if (/compact|standard|default/u.test(voiceId)) quality = "มาตรฐาน";
    let label = baseLabel;
    if (labelCounts.get(baseLabel) > 1) {
      const index = (labelIndexes.get(baseLabel) || 0) + 1;
      labelIndexes.set(baseLabel, index);
      label = `${voice.name} (${quality || `ตัวเลือก ${index}`}) · ${voice.lang}`;
    }
    select.add(new Option(label, voice.voiceURI));
  }
  const preferred = state.voices.find(voice => voice.voiceURI === state.voiceURI) || state.voices.find(voice => voice.default) || state.voices[0];
  state.voiceURI = preferred.voiceURI; select.value = preferred.voiceURI;
}

function updateSpeechControls() {
  const active = state.speaking;
  const playing = active && speechSynthesis?.speaking && !speechSynthesis.paused;
  byId("speak-button").textContent = playing ? "Ⅱ" : active ? "▶" : "▶";
  byId("speak-button").setAttribute("aria-label", playing ? "พักเสียง" : active ? "อ่านต่อ" : "อ่านออกเสียง");
  byId("speak-button").title = playing ? "พักเสียง" : active ? "อ่านต่อ" : "อ่านออกเสียง";
  byId("stop-speech").disabled = !active;
  byId("previous-paragraph").disabled = !state.activeId;
  byId("next-paragraph").disabled = !state.activeId;
}

function saveSpeechCursor() {
  const item = state.chapters.find(chapter => chapter.id === state.activeId);
  if (!item) return;
  item.lastSpeechIndex = state.speechIndex; item.lastSpeechBlockIndex = state.speechQueue[state.speechIndex]?.blockIndex ?? state.currentBlockIndex; item.lastProgressMode = "speech";
  item.lastReadProgress = state.speechQueue.length ? Math.min(1, state.speechIndex / state.speechQueue.length) : 0;
  const dbPromise = dbReady.then(db => { const tx = db.transaction(CHAPTERS, "readwrite"); tx.objectStore(CHAPTERS).put(item); return transactionDone(tx); });
  dbPromise.then(renderChapterList).catch(error => showStatus(`บันทึกตำแหน่งเสียงไม่สำเร็จ: ${error.message}`));
}

function speakFrom(index = state.speechIndex) {
  if (!state.speechQueue.length) { showStatus("บทนี้ไม่มีข้อความสำหรับอ่านออกเสียง"); return; }
  const boundedIndex = Math.max(0, Math.min(index, state.speechQueue.length - 1));
  const voice = state.voices.find(item => item.voiceURI === state.voiceURI);
  if (!voice) { showStatus("ไม่พบเสียงภาษาไทยในเครื่อง เปิดการตั้งค่า iPhone แล้วดาวน์โหลดเสียงภาษาไทย จากนั้นกลับมาเปิดหน้านี้ใหม่"); return; }
  const token = ++state.speechToken;
  speechSynthesis.cancel(); state.speechIndex = boundedIndex; state.speaking = true;
  const next = () => {
    if (token !== state.speechToken || !state.speaking) return;
    if (state.speechIndex >= state.speechQueue.length) { state.speaking = false; state.utterance = null; setActiveBlock(-1); updateSpeechControls(); showStatus("อ่านจบบทแล้ว"); return; }
    const source = state.speechQueue[state.speechIndex];
    setActiveBlock(source.blockIndex);
    saveSpeechCursor();
    const utterance = new SpeechSynthesisUtterance(applyPronunciation(source.text));
    state.utterance = utterance; utterance.voice = voice; utterance.lang = voice.lang || "th-TH"; utterance.rate = Number(byId("rate").value) || 1;
    utterance.onstart = () => { if (token === state.speechToken) { byId("speech-notice").hidden = true; setActiveBlock(source.blockIndex); updateSpeechControls(); } };
    utterance.onend = () => { if (token !== state.speechToken) return; state.speechIndex++; saveSpeechCursor(); setTimeout(next, 40); };
    utterance.onerror = event => {
      if (token !== state.speechToken) return;
      if (event.error === "canceled" || event.error === "interrupted") return;
      state.speaking = false; state.utterance = null; updateSpeechControls();
      byId("speech-notice").textContent = "เสียงอ่านหยุดกลางคัน หากใช้ iPhone ให้แตะ “อ่านต่อ” เพื่อเริ่มคิวเสียงใหม่จากตำแหน่งล่าสุด";
      byId("speech-notice").hidden = false;
    };
    speechSynthesis.speak(utterance); updateSpeechControls();
  };
  next();
}

function toggleSpeech() {
  if (!state.speaking) {
    const item = state.chapters.find(chapter => chapter.id === state.activeId);
    if (!item) return;
    if (!state.speechQueue.length) state.speechQueue = buildSpeechQueue();
    const restore = item.lastProgressMode === "speech" ? Number(item.lastSpeechIndex) || 0 : 0;
    speakFrom(Math.min(restore, Math.max(0, state.speechQueue.length - 1)));
    return;
  }
  if (speechSynthesis.speaking && !speechSynthesis.paused) { speechSynthesis.pause(); saveSpeechCursor(); updateSpeechControls(); }
  else if (speechSynthesis.paused) { speechSynthesis.resume(); updateSpeechControls(); }
  else { state.speaking = false; updateSpeechControls(); byId("speech-notice").textContent = "เสียงอ่านหยุดไปแล้วโดย iOS แตะ “อ่านต่อ” เพื่อเริ่มเสียงจากประโยคที่บันทึกไว้"; byId("speech-notice").hidden = false; }
}

function stopSpeech(reset = true) {
  state.speechToken++; state.speaking = false; state.utterance = null;
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (reset) { state.speechIndex = 0; const item = state.chapters.find(chapter => chapter.id === state.activeId); if (item) { item.lastSpeechIndex = 0; item.lastProgressMode = "scroll"; void dbReady.then(async db => { const tx = db.transaction(CHAPTERS, "readwrite"); tx.objectStore(CHAPTERS).put(item); await transactionDone(tx); }); } }
  setActiveBlock(-1);
  updateSpeechControls();
}

function setActiveBlock(blockIndex) {
  const changed = state.currentBlockIndex !== blockIndex;
  state.currentBlockIndex = blockIndex;
  const content = byId("reader-content");
  content.querySelectorAll(".read-active").forEach(element => element.classList.remove("read-active"));
  if (blockIndex < 0 || !state.highlightEnabled) return;
  const block = content.querySelector(`[data-block-index="${blockIndex}"]`);
  if (!block) return;
  block.classList.add("read-active");
  if (!state.followEnabled || !changed) return;
  if (isPageMode()) {
    const page = state.blockPages.get(blockIndex);
    if (Number.isFinite(page) && page !== state.pageIndex) setPage(page);
    return;
  }
  block.scrollIntoView({ behavior: "smooth", block: "center" });
}

function startSpeechFromBlock(blockIndex) {
  if (!state.speechQueue.length) state.speechQueue = buildSpeechQueue();
  const index = state.speechQueue.findIndex(item => item.blockIndex === blockIndex);
  if (index < 0) return;
  state.speechIndex = index;
  setActiveBlock(blockIndex);
  const item = state.chapters.find(chapter => chapter.id === state.activeId);
  if (item) { item.lastSpeechIndex = index; item.lastSpeechBlockIndex = blockIndex; item.lastProgressMode = "speech"; }
  speakFrom(index);
}

function moveSpeechParagraph(direction) {
  if (!state.speechQueue.length) state.speechQueue = buildSpeechQueue();
  if (!state.speechQueue.length) return;
  const uniqueBlocks = [...new Set(state.speechQueue.map(item => item.blockIndex))];
  const current = state.speechQueue[state.speechIndex]?.blockIndex ?? state.currentBlockIndex;
  let targetPosition = uniqueBlocks.indexOf(current);
  if (targetPosition < 0) targetPosition = direction > 0 ? -1 : uniqueBlocks.length;
  targetPosition = Math.max(0, Math.min(uniqueBlocks.length - 1, targetPosition + direction));
  startSpeechFromBlock(uniqueBlocks[targetPosition]);
}

function decorateSpeakerLabels(root) {
  for (const label of root.querySelectorAll(".noat-speaker-label")) {
    label.setAttribute("role", "button");
    if (!label.hasAttribute("tabindex")) label.setAttribute("tabindex", "0");
    const name = (label.dataset.character || label.dataset.name || label.textContent || "").trim();
    if (name) label.setAttribute("aria-label", `ดูรูปตัวละคร ${name}`);
  }
}

function characterThaiName(label) {
  return String(label.dataset.character || label.dataset.name || label.textContent || "").replace(/\s+/gu, " ").trim();
}

function characterQuery(label) {
  return String(label.dataset.characterEn || label.dataset.english || label.dataset.wiki || label.title || "").trim();
}

async function characterNameTable() {
  if (!state.characterNames) {
    const stored = await readSetting("characterNames", {});
    state.characterNames = stored && typeof stored === "object" ? stored : {};
  }
  return state.characterNames;
}

async function characterTitleFor(label) {
  const direct = characterQuery(label);
  if (direct) return direct;
  const table = await characterNameTable();
  return table[normalizeCharacterKey(characterThaiName(label))] || "";
}

async function rememberCharacterName(thai, title) {
  const table = await characterNameTable();
  table[normalizeCharacterKey(thai)] = title;
  await writeSetting("characterNames", table);
}

function normalizeCharacterKey(name) {
  return String(name || "").replace(/[\u200b-\u200d]/gu, "").replace(/\s+/gu, " ").trim().replace(/[:：,]+$/u, "").trim();
}

async function updateCharacterTableCount() {
  const table = await characterNameTable();
  const count = Object.keys(table).length;
  const label = byId("character-table-count");
  if (label) label.textContent = count ? "จับคู่ไว้ " + count.toLocaleString("th-TH") + " ชื่อ" : "ใช้จับคู่ชื่อไทยกับชื่อในวิกิ (ไฟล์ JSON จากคลังคำศัพท์)";
}

async function importCharacterTable(file) {
  const raw = JSON.parse(await file.text());
  const entries = Array.isArray(raw) ? raw : Array.isArray(raw?.glossary) ? raw.glossary : Array.isArray(raw?.data) ? raw.data : null;
  if (!Array.isArray(entries)) throw new Error("ไฟล์ต้องเป็นรายการ [{ src, dest }]");
  const table = await characterNameTable();
  let added = 0;
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const source = String(entry.src || entry.source || entry.en || "").trim();
    const target = normalizeCharacterKey(entry.dest || entry.target || entry.th || "");
    if (!source || !target || source === target) continue;
    if (!table[target]) { table[target] = source; added += 1; }
    const bare = normalizeCharacterKey(target.replace(/\([^)]*\)/gu, ""));
    if (bare && bare !== target && !table[bare]) { table[bare] = source; added += 1; }
  }
  await writeSetting("characterNames", table);
  await updateCharacterTableCount();
  return added;
}

async function clearCharacterTable() {
  state.characterNames = {};
  await writeSetting("characterNames", {});
  await updateCharacterTableCount();
}

async function searchCharacterPages(query) {
  if (!query || query.length < 2) return [];
  try {
    const response = await fetch("https://rezero.fandom.com/api.php?action=query&format=json&origin=*&list=search&srlimit=5&srsearch=" + encodeURIComponent(query), { referrerPolicy: "no-referrer" });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload?.query?.search || []).map(hit => hit.title).filter(Boolean);
  } catch (_) { return []; }
}

function characterMatchScore(query, title) {
  const q = normalizeCharacterKey(query).toLocaleLowerCase();
  const t = normalizeCharacterKey(title).toLocaleLowerCase();
  if (!q || !t) return 0;
  if (t === q) return 200;
  const slug = t.replace(/\s*\([^)]*\)\s*$/u, "");
  if (slug === q) return 190;
  if (t.startsWith(q)) return 120 + Math.round(40 * q.length / t.length);
  if (t.includes(q)) return 90 + Math.round(40 * q.length / t.length);
  const parts = q.split(" ").filter(Boolean);
  if (!parts.length) return 0;
  const found = parts.filter(part => t.includes(part)).length;
  return Math.round(80 * found / parts.length);
}

async function searchCharacterImages(query) {
  const url = "https://rezero.fandom.com/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=6&gsrsearch="
    + encodeURIComponent(query) + "&prop=pageimages&piprop=thumbnail&pithumbsize=320";
  const response = await fetch(url, { referrerPolicy: "no-referrer" });
  if (!response.ok) return "";
  const payload = await response.json();
  const pages = Object.values(payload?.query?.pages || {});
  let best = "", bestScore = 0;
  for (const page of pages) {
    const image = page?.thumbnail?.source || "";
    if (!image) continue;
    const score = characterMatchScore(query, page.title || "");
    if (score > bestScore) { bestScore = score; best = image; }
  }
  return best;
}

async function lookupCharacterImage(query) {
  if (!query || !state.loadRemoteImages) return "";
  if (!state.characterImages) state.characterImages = await readSetting("characterImages", {});
  const key = query.toLocaleLowerCase();
  const cached = state.characterImages[key];
  if (cached) return cached;
  const pageImage = async title => {
    const url = "https://rezero.fandom.com/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=320&titles=" + encodeURIComponent(title);
    const response = await fetch(url, { referrerPolicy: "no-referrer" });
    if (!response.ok) return "";
    const payload = await response.json();
    const pages = payload?.query?.pages || {};
    return Object.values(pages)[0]?.thumbnail?.source || "";
  };
  let image = "";
  try {
    image = await pageImage(query);
    if (!image) image = await searchCharacterImages(query);
  } catch (_) { image = ""; }
  if (image) {
    state.characterImages[key] = image;
    void writeSetting("characterImages", state.characterImages);
  }
  return image;
}

function showCharacterForm(visible) {
  byId("character-card-form").hidden = !visible;
  const box = byId("character-card-suggestions");
  if (!visible) { box.hidden = true; box.replaceChildren(); }
  else clearTimeout(state.characterCardTimer);
}

function closeCharacterCard() {
  clearTimeout(state.characterCardTimer);
  byId("character-card").hidden = true;
}

function setCharacterFigure(image, thai) {
  const figure = byId("character-card-figure");
  if (!image) { figure.replaceChildren(); return; }
  const img = document.createElement("img");
  img.alt = thai; img.referrerPolicy = "no-referrer"; img.decoding = "async"; img.src = image;
  figure.replaceChildren(img);
}

async function applyCharacterName(title) {
  if (!title) return;
  const thai = byId("character-card-name").textContent || "ตัวละคร";
  await rememberCharacterName(thai, title);
  const image = await lookupCharacterImage(title);
  if (byId("character-card").hidden) return;
  setCharacterFigure(image, thai);
  showCharacterForm(!image);
  byId("character-card-note").textContent = image ? "จาก Re:Zero Wiki · จำชื่อนี้ไว้แล้ว" : "ไม่พบรูปของ “" + title + "” — ลองเลือกชื่ออื่น";
  if (image) state.characterCardTimer = setTimeout(closeCharacterCard, 10000);
}

async function openCharacterCard(label) {
  const card = byId("character-card");
  const thai = characterThaiName(label) || "ตัวละคร";
  byId("character-card-name").textContent = thai;
  const spinner = document.createElement("span");
  spinner.className = "character-card-spinner"; spinner.setAttribute("aria-hidden", "true");
  byId("character-card-figure").replaceChildren(spinner);
  showCharacterForm(false);
  byId("character-card-note").textContent = "กำลังค้นรูป…";
  card.hidden = false;
  const query = await characterTitleFor(label);
  if (card.hidden) return;
  if (!query) {
    setCharacterFigure("", thai);
    showCharacterForm(true);
    const tableSize = state.characterNames ? Object.keys(state.characterNames).length : 0;
    byId("character-card-note").textContent = tableSize
      ? "“" + thai + "” ไม่อยู่ในตารางชื่อที่นำเข้า — พิมพ์ชื่อภาษาอังกฤษแล้วกดบันทึก"
      : "ยังไม่มีชื่อภาษาอังกฤษ — พิมพ์หรือเลือกชื่อจากวิกิแล้วกดบันทึก (จำไว้ครั้งเดียว)";
    byId("character-card-input").value = "";
    return;
  }
  const image = await lookupCharacterImage(query);
  if (card.hidden) return;
  if (!image) {
    showCharacterForm(true);
    byId("character-card-note").textContent = state.loadRemoteImages
      ? "ไม่พบรูปของ “" + query + "” ในวิกิ — แก้ชื่อภาษาอังกฤษ หรือแตะชื่ออีกครั้งเพื่อค้นใหม่"
      : "ปิดสวิตช์ “โหลดรูปจากเว็บต้นทาง” อยู่ จึงดึงรูปไม่ได้";
    byId("character-card-input").value = query;
    return;
  }
  setCharacterFigure(image, thai);
  byId("character-card-note").textContent = "จาก Re:Zero Wiki";
  state.characterCardTimer = setTimeout(closeCharacterCard, 10000);
}

function installCharacterCards() {
  document.addEventListener("click", event => {
    if (isPageMode()) return;
    const label = event.target.closest?.(".noat-speaker-label");
    if (!label) { if (!event.target.closest?.("#character-card")) closeCharacterCard(); return; }
    event.preventDefault(); event.stopPropagation();
    void openCharacterCard(label);
  }, true);
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const label = event.target.closest?.(".noat-speaker-label");
    if (!label) return;
    event.preventDefault(); event.stopPropagation();
    void openCharacterCard(label);
  }, true);
  byId("character-card-close").addEventListener("click", closeCharacterCard);
  byId("character-table-open").addEventListener("click", () => byId("character-table-file").click());
  byId("character-table-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const added = await importCharacterTable(file);
      showStatus("นำเข้าตารางชื่อแล้ว · เพิ่มใหม่ " + added.toLocaleString("th-TH") + " ชื่อ", 7000);
    } catch (error) { showStatus("นำเข้าตารางชื่อไม่สำเร็จ: " + error.message, 0); }
  });
  byId("character-table-clear").addEventListener("click", () => { void clearCharacterTable(); });
  void updateCharacterTableCount();
  document.addEventListener("selectstart", event => {
    if (event.target.closest?.("#reader-content, .reader-topbar")) event.preventDefault();
  });
  byId("character-card-form").addEventListener("submit", event => {
    event.preventDefault();
    void applyCharacterName(byId("character-card-input").value.trim());
  });
  byId("character-card-input").addEventListener("input", event => {
    const value = event.target.value.trim();
    clearTimeout(state.characterSuggestTimer);
    state.characterSuggestTimer = setTimeout(async () => {
      const box = byId("character-card-suggestions");
      const suggestions = await searchCharacterPages(value);
      box.replaceChildren();
      if (!suggestions.length) { box.hidden = true; return; }
      for (const title of suggestions) {
        const chip = document.createElement("button");
        chip.type = "button"; chip.className = "character-chip"; chip.textContent = title;
        chip.addEventListener("click", () => { byId("character-card-input").value = title; void applyCharacterName(title); });
        box.append(chip);
      }
      box.hidden = false;
    }, 320);
  });
}

function installParagraphTapTargets() {
  const content = byId("reader-content");
  content.addEventListener("pointerdown", event => {
    const target = event.target;
    const block = target.closest?.("p,li,blockquote,h1,h2,h3,h4,h5,h6");
    const interactive = target.closest?.("a,button,input,select,textarea,[contenteditable=true]");
    state.pointerStart = !isPageMode() && state.tapSpeech && event.isPrimary && event.button === 0 && block && !interactive
      ? { x: event.clientX, y: event.clientY, block }
      : null;
  }, { passive: true });
  document.addEventListener("pointerup", event => {
    const start = state.pointerStart; state.pointerStart = null;
    if (!start) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    const endTarget = document.elementFromPoint(event.clientX, event.clientY);
    const endBlock = endTarget?.closest?.("p,li,blockquote,h1,h2,h3,h4,h5,h6");
    const interactive = endTarget?.closest?.("a,button,input,select,textarea,[contenteditable=true]");
    if (moved <= 8 && endBlock === start.block && !interactive) {
      state.pointerTapReady = start.block;
      state.pointerTapExpiry = Date.now() + 600;
    } else state.pointerTapReady = null;
  }, { passive: true });
  document.addEventListener("pointercancel", () => { state.pointerStart = null; state.pointerTapReady = null; }, { passive: true });
  content.addEventListener("click", event => {
    if (isPageMode() || !state.tapSpeech || Date.now() < state.suppressTapUntil) return;
    const target = event.target;
    if (target.closest?.("a,button,input,select,textarea,[contenteditable=true]")) return;
    const block = target.closest?.("p,li,blockquote,h1,h2,h3,h4,h5,h6");
    if (!block) return;
    if (event.detail > 0) {
      if (state.pointerTapReady !== block || Date.now() > state.pointerTapExpiry) return;
      state.pointerTapReady = null;
    }
    startSpeechFromBlock(Number(block.dataset.blockIndex));
  });
}

function validateBackup(parsed) {
  if (!parsed || parsed.format !== BACKUP_FORMAT || parsed.formatVersion !== 1 || !parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) throw new Error("รูปแบบไฟล์ไม่ตรงกับไฟล์สำรอง Novel AI Translator (ต้องเป็น NOAT_STORAGE_EXPORT รุ่น 1) ข้อมูลเดิมยังไม่ถูกเปลี่ยน");
  const raw = parsed.data.savedTranslatedChapters;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("ไฟล์นี้ไม่มีรายการบทแปลใน data.savedTranslatedChapters ข้อมูลเดิมยังไม่ถูกเปลี่ยน");
  const chapters = [];
  const ids = new Set();
  for (const [key, source] of Object.entries(raw)) {
    if (!source || typeof source !== "object" || Array.isArray(source) || typeof source.html !== "string") throw new Error(`ข้อมูลบท “${key}” ไม่สมบูรณ์ (ต้องมี HTML เป็นข้อความ) ข้อมูลเดิมยังไม่ถูกเปลี่ยน`);
    const id = String(source.id || key).trim();
    if (!id) throw new Error("มีบทที่ไม่มี ID ข้อมูลเดิมยังไม่ถูกเปลี่ยน");
    if (ids.has(id)) throw new Error(`พบ ID บทซ้ำ “${id}” ในไฟล์ ข้อมูลเดิมยังไม่ถูกเปลี่ยน`);
    ids.add(id);
    chapters.push({ ...source, id });
  }
  const pronunciations = parsed.data.ttsPronunciationDictionary ?? [];
  if (!Array.isArray(pronunciations) || pronunciations.some(entry => !entry || typeof entry !== "object" || typeof entry.word !== "string" || typeof entry.reading !== "string")) throw new Error("ตารางคำอ่านในไฟล์มีรูปแบบไม่ถูกต้อง ข้อมูลเดิมยังไม่ถูกเปลี่ยน");
  return { chapters, pronunciations, createdAt: parsed.createdAt || "" };
}

async function importBackup(mode) {
  const backup = state.imported;
  if (!backup) return;
  const db = await dbReady;
  let pronunciation = backup.pronunciations;
  if (mode === "merge") {
    const previous = await readSetting("pronunciation", []);
    const merged = new Map(previous.map(item => [item.word.toLocaleLowerCase(), item]));
    for (const item of backup.pronunciations) merged.set(item.word.toLocaleLowerCase(), item);
    pronunciation = [...merged.values()];
  }
  const tx = db.transaction([CHAPTERS, SETTINGS], "readwrite");
  const chapterStore = tx.objectStore(CHAPTERS), settingsStore = tx.objectStore(SETTINGS);
  if (mode === "replace") { chapterStore.clear(); settingsStore.clear(); }
  for (const chapter of backup.chapters) chapterStore.put(chapter);
  settingsStore.put({ id: "pronunciation", value: pronunciation });
  settingsStore.put({ id: "lastActiveId", value: "" });
  await transactionDone(tx);
  state.imported = null; byId("import-dialog").close();
  state.speechQueue = []; state.speechIndex = 0;
  await refreshChapters();
  if (state.chapters.length) {
    const first = sortChapters(state.chapters)[0]; await openChapter(first.id);
  }
  showStatus(`นำเข้าสำเร็จ ${backup.chapters.length.toLocaleString("th-TH")} บท · ${pronunciation.length.toLocaleString("th-TH")} คำอ่าน · ${mode === "merge" ? "รวมกับข้อมูลเดิมแล้ว" : "แทนที่ข้อมูลเดิมแล้ว"}`, 8000);
}

function bindEvents() {
  byId("import-open").addEventListener("click", () => byId("backup-file").click());
  byId("welcome-import").addEventListener("click", () => byId("backup-file").click());
  byId("backup-file").addEventListener("change", async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try { state.imported = validateBackup(JSON.parse(await file.text())); byId("import-dialog").showModal(); }
    catch (error) { showStatus(error.message, 0); }
    finally { event.target.value = ""; }
  });
  byId("merge-import").addEventListener("click", () => importBackup("merge").catch(error => showStatus(`นำเข้าไม่สำเร็จ: ${error.message}`, 0)));
  byId("replace-import").addEventListener("click", () => {
    if (!confirm("แทนที่บทและตารางคำอ่านใน PWA นี้ทั้งหมดใช่ไหม? ข้อมูลในส่วนขยายต้นทางจะไม่ถูกลบ")) return;
    importBackup("replace").catch(error => showStatus(`นำเข้าไม่สำเร็จ: ${error.message}`, 0));
  });
  byId("search").addEventListener("input", scheduleChapterRender);
  byId("sort").addEventListener("change", () => { renderChapterList(); updateChapterNavigation(); });
  byId("menu-toggle").addEventListener("click", () => setSidebarOpen(!document.body.classList.contains("sidebar-open")));
  byId("reader-menu").addEventListener("click", () => setSidebarOpen(true));
  document.addEventListener("click", event => { if (event.target === document.body && document.body.classList.contains("sidebar-open")) setSidebarOpen(false); });
  byId("chapter-previous").addEventListener("click", () => goToAdjacentChapter(-1));
  byId("chapter-next").addEventListener("click", () => goToAdjacentChapter(1));
  for (const theme of THEMES) byId(`theme-${theme}`).addEventListener("click", () => { applyTheme(theme); void writeSetting("theme", theme); });
  byId("settings-open").addEventListener("click", () => byId("settings-sheet").showModal());
  byId("settings-close").addEventListener("click", () => byId("settings-sheet").close());
  byId("settings-sheet").addEventListener("click", event => { if (event.target === byId("settings-sheet")) byId("settings-sheet").close(); });
  byId("font-down").addEventListener("click", () => setFontSize(state.fontSize - 1));
  byId("font-up").addEventListener("click", () => setFontSize(state.fontSize + 1));
  byId("speak-button").addEventListener("click", toggleSpeech);
  byId("stop-speech").addEventListener("click", () => stopSpeech(true));
  byId("previous-paragraph").addEventListener("click", () => moveSpeechParagraph(-1));
  byId("next-paragraph").addEventListener("click", () => moveSpeechParagraph(1));
  byId("voice-select").addEventListener("change", event => { state.voiceURI = event.target.value; void writeSetting("voiceURI", state.voiceURI); });
  byId("rate").addEventListener("input", event => { state.rate = Number(event.target.value); byId("rate-output").value = `${state.rate.toFixed(1).replace(/\.0$/, "")}×`; void writeSetting("rate", state.rate); });
  byId("line-height").addEventListener("input", event => setLineHeight(Number(event.target.value)));
  byId("text-width").addEventListener("input", event => setTextWidth(Number(event.target.value)));
  byId("highlight-toggle").addEventListener("change", event => { state.highlightEnabled = event.target.checked; void writeSetting("highlightEnabled", state.highlightEnabled); setActiveBlock(state.currentBlockIndex); });
  byId("follow-toggle").addEventListener("change", event => { state.followEnabled = event.target.checked; void writeSetting("followEnabled", state.followEnabled); if (state.followEnabled) { setActiveBlock(state.currentBlockIndex); byId("reader-content").querySelector(".read-active")?.scrollIntoView({ behavior: "smooth", block: "center" }); } });
  byId("remote-images-toggle").addEventListener("change", event => {
    state.loadRemoteImages = event.target.checked; void writeSetting("loadRemoteImages", state.loadRemoteImages);
    const item = state.chapters.find(chapter => chapter.id === state.activeId);
    if (item) {
      const scrollY = window.scrollY;
      if (state.speaking) { saveSpeechCursor(); stopSpeech(false); }
      renderChapterContent(item);
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "instant" }));
    }
  });
  byId("wake-lock-toggle").addEventListener("change", event => {
    state.keepScreenAwake = event.target.checked;
    void writeSetting("keepScreenAwake", state.keepScreenAwake);
    void syncWakeLock();
  });
  byId("mode-page").addEventListener("click", () => applyReadingMode("page"));
  byId("mode-scroll").addEventListener("click", () => applyReadingMode("scroll"));
  byId("mode-toggle").addEventListener("click", () => applyReadingMode(isPageMode() ? "scroll" : "page"));
  byId("page-top").addEventListener("input", event => setPageTop(Number(event.target.value)));
  byId("indent-toggle").addEventListener("change", event => {
    state.indent = event.target.checked;
    document.body.classList.toggle("indent-on", state.indent);
    void writeSetting("indent", state.indent);
    schedulePaginate(60);
  });
  byId("font-family").addEventListener("change", event => setFontFamily(event.target.value));
  byId("tap-speech-toggle").addEventListener("change", event => setTapSpeech(event.target.checked));
  byId("tap-hint-toggle").addEventListener("change", event => setTapHint(event.target.checked));
  byId("chrome-toggle").addEventListener("click", () => toggleChrome());
  installParagraphTapTargets();
  installCharacterCards();
  installPageGestures();
  installChromeRestore();
  window.addEventListener("resize", () => schedulePaginate(140));
  window.addEventListener("orientationchange", () => schedulePaginate(240));
  window.visualViewport?.addEventListener("resize", () => schedulePaginate(180));
  window.addEventListener("scroll", saveReadingPosition, { passive: true });
  window.addEventListener("pagehide", () => {
    clearTimeout(state.scrollTimer); void persistReadingPosition().catch(() => {});
    if (state.speaking && document.hidden) { state.speechIndex = Math.max(0, state.speechIndex); saveSpeechCursor(); }
    if (state.wakeLock) { const lock = state.wakeLock; state.wakeLock = null; void lock.release().catch(() => {}); }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearTimeout(state.scrollTimer); void persistReadingPosition().catch(() => {}); }
    void syncWakeLock();
    if (!document.hidden && state.speaking && state.utterance && !speechSynthesis.speaking && !speechSynthesis.paused) {
      state.speaking = false; updateSpeechControls();
      byId("speech-notice").textContent = "เสียงอ่านอาจหยุดเมื่อ iPhone พักหน้าจอ แตะ “อ่านต่อ” เพื่อเริ่มคิวใหม่จากประโยคที่บันทึกไว้";
      byId("speech-notice").hidden = false;
    }
  });
  if ("speechSynthesis" in window) {
    speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    refreshVoices();
    // iOS Safari can populate downloaded voices after the initial page load,
    // and some versions do not reliably fire voiceschanged for that update.
    setTimeout(refreshVoices, 500);
    setTimeout(refreshVoices, 1500);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshVoices(); });
  }
}

function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }

function isPageMode() { return state.mode === "page"; }

function readingRatio() {
  if (isPageMode()) return state.pageTotal > 1 ? state.pageIndex / (state.pageTotal - 1) : 0;
  return clamp01((state.sidebarLockY ?? window.scrollY) / Math.max(1, document.documentElement.scrollHeight - innerHeight));
}

function applyReadingMode(mode, { persist = true, relayout = true } = {}) {
  const ratio = relayout ? readingRatio() : 0;
  state.mode = mode === "scroll" ? "scroll" : "page";
  const page = isPageMode();
  document.body.classList.toggle("page-mode", page);
  document.body.classList.toggle("scroll-mode", !page);
  byId("mode-page").setAttribute("aria-pressed", String(page));
  byId("mode-scroll").setAttribute("aria-pressed", String(!page));
  const modeToggle = byId("mode-toggle"), modeLabel = page ? "สลับเป็นโหมดเลื่อนต่อเนื่อง" : "สลับเป็นโหมดพลิกหน้า";
  modeToggle.textContent = page ? "📜" : "📄";
  modeToggle.title = modeLabel;
  modeToggle.setAttribute("aria-label", modeLabel);
  if (!state.activeId) toggleChrome(true);
  if (persist) void writeSetting("readingMode", state.mode);
  updateChromeToggle();
  if (!relayout || !state.activeId) return;
  toggleChrome(!page);
  if (page && state.tapHint && !state.hintShown) { state.hintShown = true; showTapHint(); }
  relayoutChapter(ratio);
}

function relayoutChapter(ratio = readingRatio()) {
  const item = activeChapter();
  if (!item) return;
  if (!isPageMode()) resetPaginationStyles();
  renderChapterContent(item);
  if (isPageMode()) {
    paginateContent();
    setPage(Math.round(clamp01(ratio) * Math.max(0, state.pageTotal - 1)), { animate: false });
    return;
  }
  requestAnimationFrame(() => window.scrollTo({ top: clamp01(ratio) * Math.max(0, document.documentElement.scrollHeight - innerHeight), behavior: "instant" }));
}

function resetPaginationStyles() {
  const content = byId("reader-content");
  for (const property of ["width", "height", "columnWidth", "columnGap", "transform", "transition"]) content.style.removeProperty(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));
  state.pageTotal = 1; state.pageIndex = 0; state.pageStep = 0; state.blockPages = new Map();
  updatePageFooter();
}

function paginateContent() {
  const viewport = byId("reading-viewport"), content = byId("reader-content");
  if (!isPageMode()) { resetPaginationStyles(); return; }
  const styles = getComputedStyle(viewport);
  const insetX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const insetY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
  const width = Math.max(160, viewport.clientWidth - insetX);
  const height = Math.max(160, viewport.clientHeight - insetY);
  const gap = Math.max(12, Math.min(insetX, 160));
  content.style.transition = "none";
  content.style.transform = "translate3d(0,0,0)";
  content.style.width = `${width}px`;
  content.style.height = `${height}px`;
  content.style.columnWidth = `${width}px`;
  content.style.columnGap = `${gap}px`;
  const step = width + gap;
  state.pageStep = step;
  const baseLeft = content.getBoundingClientRect().left;
  const blockPages = new Map();
  let total = 1;
  for (const element of content.querySelectorAll("[data-block-index]")) {
    const rect = element.getBoundingClientRect();
    if (!rect.width && !rect.height) continue;
    const page = Math.max(0, Math.round((rect.left - baseLeft) / step));
    blockPages.set(Number(element.dataset.blockIndex), page);
    if (page + 1 > total) total = page + 1;
  }
  if (total === 1) {
    const overflowPages = Math.round((content.scrollWidth + gap) / (width + gap));
    if (overflowPages > 1) total = overflowPages;
  }
  state.blockPages = blockPages;
  state.pageTotal = total;
  state.pageIndex = Math.max(0, Math.min(total - 1, state.pageIndex));
  content.style.transition = "";
  updatePageFooter();
  if (total === 1 && content.scrollHeight > height + 8) {
    applyReadingMode("scroll", { persist: false });
    showStatus("เบราว์เซอร์นี้แบ่งหน้าแบบหลายคอลัมน์ไม่ได้ สลับเป็นโหมดเลื่อนต่อเนื่องให้แล้ว", 7000);
  }
}

function updatePageFooter() {
  const total = Math.max(1, state.pageTotal);
  const current = Math.min(state.pageIndex + 1, total);
  const percent = Math.round((current / total) * 100);
  byId("page-position").textContent = `หน้า ${current} / ${total}`;
  byId("page-percent").textContent = `${percent}%`;
  byId("page-progress").style.width = `${percent}%`;
}

function setPage(index, { animate = true } = {}) {
  if (!isPageMode()) return;
  const total = Math.max(1, state.pageTotal);
  const target = Math.max(0, Math.min(total - 1, Math.round(Number(index) || 0)));
  state.pageIndex = target;
  const content = byId("reader-content");
  const step = state.pageStep || byId("reading-viewport").clientWidth;
  content.style.transition = animate ? "transform .26s cubic-bezier(.22,.61,.36,1)" : "none";
  content.style.transform = `translate3d(${-target * step}px,0,0)`;
  if (!animate) void content.offsetWidth;
  updatePageFooter();
  scheduleSavePage();
}

function scheduleSavePage() {
  clearTimeout(state.pageTimer);
  state.pageTimer = setTimeout(() => persistReadingPosition().catch(error => showStatus(`บันทึกตำแหน่งอ่านไม่สำเร็จ: ${error.message}`)), 400);
}

function schedulePaginate(delay = 120) {
  clearTimeout(state.paginateTimer);
  state.paginateTimer = setTimeout(() => {
    if (!isPageMode() || !state.activeId) return;
    const ratio = readingRatio();
    paginateContent();
    setPage(Math.round(ratio * Math.max(0, state.pageTotal - 1)), { animate: false });
  }, delay);
}

function showTapHint() {
  const hint = byId("tap-hint");
  if (!hint || !isPageMode() || !state.tapHint) return;
  hint.hidden = false;
  hint.classList.remove("hide");
  requestAnimationFrame(() => hint.classList.add("show"));
  clearTimeout(state.hintTimer);
  state.hintTimer = setTimeout(hideTapHint, 4200);
}

function hideTapHint() {
  const hint = byId("tap-hint");
  if (!hint || hint.hidden) return;
  hint.classList.add("hide");
  clearTimeout(state.hintTimer);
  setTimeout(() => { hint.hidden = true; hint.classList.remove("show", "hide"); }, 320);
}

function setTapHint(enabled) {
  state.tapHint = enabled !== false;
  byId("tap-hint-toggle").checked = state.tapHint;
  void writeSetting("tapHint", state.tapHint);
  if (!state.tapHint) hideTapHint();
}

function flashPageEdge(direction) {
  const viewport = byId("reading-viewport");
  if (!viewport) return;
  const name = direction > 0 ? "turn-right" : "turn-left";
  viewport.classList.remove("turn-left", "turn-right");
  void viewport.offsetWidth;
  viewport.classList.add(name);
  clearTimeout(state.flashTimer);
  state.flashTimer = setTimeout(() => viewport.classList.remove(name), 280);
}

function turnPage(direction) {
  if (!isPageMode()) return;
  flashPageEdge(direction);
  const target = state.pageIndex + direction;
  if (target < 0) { if (!goToAdjacentChapter(-1, { toEnd: true })) showStatus("ถึงตอนแรกของเรื่องแล้ว", 2200); return; }
  if (target > state.pageTotal - 1) { if (!goToAdjacentChapter(1, { toStart: true })) showStatus("จบเนื้อหาที่บันทึกไว้แล้ว", 2500); return; }
  setPage(target);
}

function toggleChrome(show) {
  const shouldShow = show == null ? document.body.classList.contains("chrome-hidden") : Boolean(show);
  document.body.classList.toggle("chrome-hidden", !shouldShow);
  updateChromeToggle();
}

function updateChromeToggle() {
  const button = byId("chrome-toggle");
  if (!button) return;
  const label = document.body.classList.contains("chrome-hidden") ? "แสดงแถบเครื่องมือ" : "ซ่อนแถบเครื่องมือ";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.textContent = document.body.classList.contains("chrome-hidden") ? "⤡" : "⤢";
}

function installChromeRestore() {
  let origin = null;
  document.addEventListener("pointerdown", event => {
    origin = !isPageMode() && document.body.classList.contains("chrome-hidden") ? { x: event.clientX, y: event.clientY } : null;
  }, { capture: true, passive: true });
  document.addEventListener("pointerup", event => {
    const start = origin; origin = null;
    if (!start || isPageMode() || !document.body.classList.contains("chrome-hidden")) return;
    if (typeof event.button === "number" && event.button !== 0) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return;
    state.suppressTapUntil = Date.now() + 500;
    toggleChrome(true);
  }, { capture: true, passive: true });
}

function installPageGestures() {
  const viewport = byId("reading-viewport");
  let start = null;
  viewport.addEventListener("pointerdown", event => {
    if (!isPageMode() || (event.pointerType === "mouse" && event.button !== 0)) { start = null; return; }
    if (event.target.closest?.("a,button,input,select,textarea,[contenteditable=true]")) { start = null; return; }
    start = { x: event.clientX, y: event.clientY, time: Date.now() };
  }, { passive: true });
  viewport.addEventListener("pointerup", event => {
    const origin = start; start = null;
    if (!origin || !isPageMode()) return;
    hideTapHint();
    if (document.body.classList.contains("sidebar-open")) { setSidebarOpen(false); return; }
    const dx = event.clientX - origin.x, dy = event.clientY - origin.y;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.25) { turnPage(dx < 0 ? 1 : -1); return; }
    if (Math.abs(dx) > 9 || Math.abs(dy) > 9 || Date.now() - origin.time > 700) return;
    const label = event.target.closest?.(".noat-speaker-label");
    if (label) { void openCharacterCard(label); return; }
    const rect = viewport.getBoundingClientRect();
    const position = (event.clientX - rect.left) / Math.max(1, rect.width);
    if (position < .32) turnPage(-1);
    else if (position > .68) turnPage(1);
    else toggleChrome();
  });
  viewport.addEventListener("pointercancel", () => { start = null; }, { passive: true });
  document.addEventListener("keydown", event => {
    if (!isPageMode() || !state.activeId) return;
    if (event.target.closest?.("input,select,textarea")) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); turnPage(1); }
    else if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); turnPage(-1); }
    else if (event.key === "Escape") toggleChrome(true);
  });
}

const FONT_STACKS = { noto: '"Noto Sans Thai", sans-serif', system: '-apple-system, "SF Pro Text", "Thonburi", "Noto Sans Thai", sans-serif', sarabun: '"Sarabun", "Noto Sans Thai", sans-serif', "noto-serif": '"Noto Serif Thai", "Noto Sans Thai", serif' };

function setFontFamily(value) {
  state.fontFamily = FONT_STACKS[value] ? value : "noto";
  document.documentElement.style.setProperty("--reader-font", FONT_STACKS[state.fontFamily]);
  byId("font-family").value = state.fontFamily;
  void writeSetting("fontFamily", state.fontFamily);
  schedulePaginate(80);
}

function setTapSpeech(enabled) {
  state.tapSpeech = enabled !== false;
  byId("tap-speech-toggle").checked = state.tapSpeech;
  void writeSetting("tapSpeech", state.tapSpeech);
}

function setFontSize(value) {
  state.fontSize = Math.max(15, Math.min(32, value));
  document.documentElement.style.setProperty("--reader-size", `${state.fontSize}px`);
  byId("font-size-label").textContent = String(state.fontSize);
  void writeSetting("fontSize", state.fontSize);
  schedulePaginate(80);
}

function setLineHeight(value) {
  state.lineHeight = Math.max(1.4, Math.min(2.6, Number(value) || 1.9));
  document.documentElement.style.setProperty("--reader-line-height", String(state.lineHeight));
  byId("line-height").value = String(state.lineHeight); byId("line-height-output").value = state.lineHeight.toFixed(1);
  void writeSetting("lineHeight", state.lineHeight);
  schedulePaginate(80);
}

function setPageTop(value) {
  state.pageTop = Math.max(0, Math.min(90, Math.round(Number(value) || 0)));
  document.documentElement.style.setProperty("--page-top-extra", `${state.pageTop}px`);
  byId("page-top").value = String(state.pageTop);
  byId("page-top-output").value = `${state.pageTop}px`;
  void writeSetting("pageTop", state.pageTop);
  schedulePaginate(60);
}

function setTextWidth(value) {
  state.textWidth = Math.max(320, Math.min(900, Number(value) || 760));
  document.documentElement.style.setProperty("--reader-width", `${state.textWidth}px`);
  byId("text-width").value = String(state.textWidth); byId("text-width-output").value = `${state.textWidth}px`;
  void writeSetting("textWidth", state.textWidth);
}

function startServiceWorker() {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    if (sessionStorage.getItem("noat-sw-reloaded") === APP_VERSION) return;
    sessionStorage.setItem("noat-sw-reloaded", APP_VERSION);
    location.reload();
  });
  navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" })
    .then(registration => {
      void registration.update();
      const check = () => { if (document.visibilityState === "visible") void registration.update(); };
      document.addEventListener("visibilitychange", check);
      window.addEventListener("focus", check);
      if (state.updateTimer) clearInterval(state.updateTimer);
      state.updateTimer = setInterval(check, 5 * 60 * 1000);
      return navigator.serviceWorker.ready;
    })
    .then(() => showStatus("เตรียมไฟล์แอปสำหรับใช้ออฟไลน์แล้ว", 4500))
    .catch(() => {});
}

async function initialize() {
  try {
    await dbReady;
    state.theme = await readSetting("theme", "dark"); applyTheme(state.theme);
    setFontSize(Number(await readSetting("fontSize", 19)) || 19);
    setLineHeight(Number(await readSetting("lineHeight", 1.9)) || 1.9);
    setTextWidth(Number(await readSetting("textWidth", 760)) || 760);
    state.rate = Number(await readSetting("rate", 1)) || 1; byId("rate").value = String(state.rate); byId("rate-output").value = `${state.rate.toFixed(1).replace(/\.0$/, "")}×`;
    state.voiceURI = await readSetting("voiceURI", "");
    state.pronunciation = await readSetting("pronunciation", []);
    state.highlightEnabled = await readSetting("highlightEnabled", true) !== false;
    state.followEnabled = await readSetting("followEnabled", true) !== false;
    state.loadRemoteImages = await readSetting("loadRemoteImages", true) !== false;
    state.keepScreenAwake = await readSetting("keepScreenAwake", false) === true;
    state.mode = (await readSetting("readingMode", "scroll")) === "page" ? "page" : "scroll";
    setPageTop(Number(await readSetting("pageTop", 0)) || 0);
    setFontFamily(await readSetting("fontFamily", "noto"));
    setTapSpeech(await readSetting("tapSpeech", true) !== false);
    setTapHint(await readSetting("tapHint", true) !== false);
    state.indent = await readSetting("indent", true) !== false;
    document.body.classList.toggle("indent-on", state.indent);
    byId("indent-toggle").checked = state.indent;
    applyReadingMode(state.mode, { persist: false, relayout: false });
    byId("highlight-toggle").checked = state.highlightEnabled;
    byId("follow-toggle").checked = state.followEnabled;
    byId("remote-images-toggle").checked = state.loadRemoteImages;
    byId("wake-lock-toggle").checked = state.keepScreenAwake;
    await refreshChapters(); bindEvents();
    const fragmentId = decodeURIComponent(location.hash.replace(/^#chapter=/, ""));
    const activeId = fragmentId || await readSetting("lastActiveId", "");
    if (activeId && state.chapters.some(item => item.id === activeId)) await openChapter(activeId);
    document.fonts?.ready.then(() => { if (isPageMode() && state.activeId) schedulePaginate(0); }).catch(() => {});
    hideSplash();
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) startServiceWorker();
  } catch (error) { showStatus(`เปิดคลังไม่สำเร็จ: ${error.message}`, 0); hideSplash(); }
}

paintVersionLabels();
initialize();
setTimeout(hideSplash, 4000);
