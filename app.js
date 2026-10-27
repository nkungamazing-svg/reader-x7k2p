"use strict";

const DB_NAME = "noat-mobile-reader";
const DB_VERSION = 1;
const CHAPTERS = "chapters";
const SETTINGS = "settings";
const BACKUP_FORMAT = "NOAT_STORAGE_EXPORT";
const dbReady = openDatabase();
const byId = id => document.getElementById(id);
const state = { chapters: [], activeId: "", theme: "dark", fontSize: 19, rate: 1, voiceURI: "", pronunciation: [], voices: [], speechQueue: [], speechIndex: 0, speaking: false, utterance: null, speechToken: 0, currentBlockIndex: -1, highlightEnabled: true, followEnabled: true, loadRemoteImages: true, scrollTimer: 0, noticeTimer: 0, imported: null, statusTimer: 0, sidebarLockY: null, pointerStart: null, pointerTapReady: null, pointerTapExpiry: 0 };

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
    const count = document.createElement("small"); count.textContent = `${items.length} ตอน`;
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
      const arcHeading = document.createElement("div"); arcHeading.className = "arc-title"; arcHeading.textContent = arc;
      section.append(arcHeading);
      for (const item of arcItems) {
        const button = document.createElement("button"); button.type = "button"; button.className = `chapter-link${item.id === state.activeId ? " active" : ""}`;
        button.setAttribute("aria-current", item.id === state.activeId ? "true" : "false");
        const title = document.createElement("strong"); title.textContent = normalizeTitle(item);
        const subtitle = document.createElement("small"); subtitle.textContent = item.lastReadProgress > 0 ? `อ่านแล้ว ${Math.round(Math.min(1, item.lastReadProgress) * 100)}%` : "ยังไม่ได้อ่าน";
        const progress = document.createElement("span"); progress.className = "mini-progress";
        const fill = document.createElement("i"); fill.style.width = `${Math.max(0, Math.min(100, Number(item.lastReadProgress || item.lastScrollRatio || 0) * 100))}%`; progress.append(fill);
        button.append(title, subtitle, progress); button.addEventListener("click", () => openChapter(item.id)); section.append(button);
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
  state.theme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  byId("theme-dark").setAttribute("aria-pressed", String(state.theme === "dark"));
  byId("theme-light").setAttribute("aria-pressed", String(state.theme === "light"));
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
        const cleanStyle = value.replace(/url\((?:[^)]*)\)/gi, "none").replace(/expression\s*\(/gi, "invalid(");
        element.setAttribute("style", cleanStyle);
      }
    }
  }
  const fragment = document.createDocumentFragment();
  while (doc.body.firstChild) fragment.append(doc.body.firstChild);
  return fragment;
}

async function openChapter(id) {
  const item = state.chapters.find(chapter => chapter.id === id);
  if (!item) return;
  stopSpeech(false);
  state.speechQueue = []; state.speechIndex = 0;
  state.activeId = id;
  byId("welcome").hidden = true; byId("reader").hidden = false;
  byId("audio-bar").hidden = false;
  byId("reader-novel").textContent = novelLabel(item);
  byId("reader-title").textContent = normalizeTitle(item);
  renderChapterContent(item);
  const ratio = Math.max(0, Math.min(1, Number(item.lastScrollRatio ?? item.lastReadProgress) || 0));
  setSidebarOpen(false, { restorePosition: false });
  requestAnimationFrame(() => window.scrollTo({ top: ratio * Math.max(0, document.documentElement.scrollHeight - innerHeight), behavior: "instant" }));
  await writeSetting("lastActiveId", id);
  renderChapterList();
  history.replaceState(null, "", `#chapter=${encodeURIComponent(id)}`);
}

function closeReader() {
  stopSpeech(false); state.activeId = ""; byId("reader").hidden = true; byId("welcome").hidden = false; byId("audio-bar").hidden = true; renderChapterList();
}

function renderChapterContent(item) {
  const content = byId("reader-content");
  content.replaceChildren(safeChapterFragment(item.html, item.sourceUrl || ""));
  const blockSelector = "p,li,blockquote,h1,h2,h3,h4,h5,h6";
  const blocks = [...content.querySelectorAll(blockSelector)].filter(element => !element.parentElement?.closest(blockSelector));
  blocks.forEach((block, blockIndex) => { block.dataset.blockIndex = String(blockIndex); });
  state.currentBlockIndex = -1;
}

function setSidebarOpen(open, { restorePosition = true } = {}) {
  const isMobile = matchMedia("(max-width: 760px)").matches;
  if (!isMobile) { document.body.classList.toggle("sidebar-open", Boolean(open)); return; }
  if (open) {
    if (document.body.classList.contains("sidebar-open")) return;
    state.sidebarLockY = window.scrollY;
    document.body.classList.add("sidebar-open", "sidebar-locked");
    document.body.style.top = `-${state.sidebarLockY}px`;
    document.body.style.left = "0"; document.body.style.right = "0"; document.body.style.width = "100%";
    byId("menu-toggle").setAttribute("aria-expanded", "true");
    return;
  }
  document.body.classList.remove("sidebar-open", "sidebar-locked");
  document.body.style.removeProperty("top"); document.body.style.removeProperty("left"); document.body.style.removeProperty("right"); document.body.style.removeProperty("width");
  const savedY = state.sidebarLockY; state.sidebarLockY = null;
  byId("menu-toggle").setAttribute("aria-expanded", "false");
  if (restorePosition && savedY !== null) window.scrollTo({ top: savedY, behavior: "instant" });
}

function saveReadingPosition() {
  clearTimeout(state.scrollTimer);
  state.scrollTimer = setTimeout(async () => {
    const item = state.chapters.find(chapter => chapter.id === state.activeId);
    if (!item) return;
    const ratio = Math.max(0, Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
    item.lastScrollRatio = ratio;
    if (!state.speaking) { item.lastReadProgress = ratio; item.lastProgressMode = "scroll"; }
    try { const db = await dbReady; const tx = db.transaction(CHAPTERS, "readwrite"); tx.objectStore(CHAPTERS).put(item); await transactionDone(tx); renderChapterList(); }
    catch (error) { showStatus(`บันทึกตำแหน่งอ่านไม่สำเร็จ: ${error.message}`); }
  }, 500);
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
  if (state.followEnabled && changed) block.scrollIntoView({ behavior: "smooth", block: "center" });
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

function installParagraphTapTargets() {
  const content = byId("reader-content");
  content.addEventListener("pointerdown", event => {
    const target = event.target;
    const block = target.closest?.("p,li,blockquote,h1,h2,h3,h4,h5,h6");
    const interactive = target.closest?.("a,button,input,select,textarea,[contenteditable=true]");
    state.pointerStart = event.isPrimary && event.button === 0 && block && !interactive
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
  byId("search").addEventListener("input", renderChapterList);
  byId("sort").addEventListener("change", renderChapterList);
  byId("menu-toggle").addEventListener("click", () => setSidebarOpen(!document.body.classList.contains("sidebar-open")));
  byId("reader-menu").addEventListener("click", () => setSidebarOpen(true));
  document.addEventListener("click", event => { if (event.target === document.body && document.body.classList.contains("sidebar-open")) setSidebarOpen(false); });
  byId("theme-dark").addEventListener("click", () => { applyTheme("dark"); void writeSetting("theme", "dark"); });
  byId("theme-light").addEventListener("click", () => { applyTheme("light"); void writeSetting("theme", "light"); });
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
  installParagraphTapTargets();
  window.addEventListener("scroll", saveReadingPosition, { passive: true });
  window.addEventListener("pagehide", () => { if (state.speaking && document.hidden) { state.speechIndex = Math.max(0, state.speechIndex); saveSpeechCursor(); } });
  document.addEventListener("visibilitychange", () => {
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

function setFontSize(value) {
  state.fontSize = Math.max(15, Math.min(32, value));
  document.documentElement.style.setProperty("--reader-size", `${state.fontSize}px`);
  byId("font-size-label").textContent = String(state.fontSize);
  void writeSetting("fontSize", state.fontSize);
}

async function initialize() {
  try {
    await dbReady;
    state.theme = await readSetting("theme", "dark"); applyTheme(state.theme);
    setFontSize(Number(await readSetting("fontSize", 19)) || 19);
    state.rate = Number(await readSetting("rate", 1)) || 1; byId("rate").value = String(state.rate); byId("rate-output").value = `${state.rate.toFixed(1).replace(/\.0$/, "")}×`;
    state.voiceURI = await readSetting("voiceURI", "");
    state.pronunciation = await readSetting("pronunciation", []);
    state.highlightEnabled = await readSetting("highlightEnabled", true) !== false;
    state.followEnabled = await readSetting("followEnabled", true) !== false;
    state.loadRemoteImages = await readSetting("loadRemoteImages", true) !== false;
    byId("highlight-toggle").checked = state.highlightEnabled;
    byId("follow-toggle").checked = state.followEnabled;
    byId("remote-images-toggle").checked = state.loadRemoteImages;
    await refreshChapters(); bindEvents();
    const fragmentId = decodeURIComponent(location.hash.replace(/^#chapter=/, ""));
    const activeId = fragmentId || await readSetting("lastActiveId", "");
    if (activeId && state.chapters.some(item => item.id === activeId)) await openChapter(activeId);
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      navigator.serviceWorker.register("./service-worker.js")
        .then(() => navigator.serviceWorker.ready)
        .then(() => showStatus("เตรียมไฟล์แอปสำหรับใช้ออฟไลน์แล้ว", 4500))
        .catch(() => {});
    }
  } catch (error) { showStatus(`เปิดคลังไม่สำเร็จ: ${error.message}`, 0); }
}

initialize();
