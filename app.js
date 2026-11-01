"use strict";

const DB_NAME = "noat-mobile-reader";
const DB_VERSION = 1;
const CHAPTERS = "chapters";
const SETTINGS = "settings";
const BACKUP_FORMAT = "NOAT_STORAGE_EXPORT";
const APP_VERSION = "1.12.3";
// บันทึกเฉพาะเรื่องที่คนอ่านรู้สึกได้ ไม่ลงทุกอัปเดต และแสดงแค่ไม่กี่รายการล่าสุด
const CHANGELOG_LIMIT = 6;
const CHANGELOG = [
  { version: "1.12.3", note: "ธีมรี:ซีโร่ปรับสีพื้น สีเน้น สีโลโก้ และเอฟเฟกต์เองได้ โดยยังมีรูปตอนเข้าแอปและโลโก้กับชื่อที่หัวเว็บ" },
  { version: "1.12.2", note: "เพิ่มธีมกำหนดเอง ตั้งสีพื้น ตัวอักษร การ์ด สีเน้น สีโลโก้ และเอฟเฟกต์หัวเว็บได้อิสระ" },
  { version: "1.12.1", note: "ธีมรี:ซีโร่เข้มขึ้นสำหรับอ่านก่อนนอน มีดาวตกตอนเข้าแอป และผงดาวจางในหน้าอ่าน" },
  { version: "1.12.0", note: "หน้าตั้งค่าธีมจัดใหม่เป็นตาราง 4 ช่อง แยกพื้นฐานกับธีมพิเศษให้เลือกง่ายขึ้น" },
  { version: "1.11.9", note: "ธีมรี:ซีโร่สว่างขึ้น หน้าอ่านกลืนกับหัวเว็บ และมีประกายดาวโปรยในหัวเว็บ" },
  { version: "1.11.8", note: "ไอคอนแอป การ์ดต้อนรับ และหน้าเปิด iOS ใช้โลโก้ชุดใหม่แล้ว" },
  { version: "1.11.7", note: "เอาเครื่องหมายอิโมจิออกจากโลโก้ และใช้รูปโลโก้ประจำธีมในหน้าตั้งค่า" },
  { version: "1.11.6", note: "ธีมรี:ซีโร่ได้ชุดแต่งพิเศษทั้งหัวเว็บ เมนู รายการบท และหน้าตั้งค่า" },
  { version: "1.11.5", note: "ไอคอนกลับมาใช้โลโก้เดิม พร้อมเอฟเฟกต์ประกายและลายธีม" },
  { version: "1.11.4", note: "คอลลาจรี:ซีโร่เต็มจอจริง และภาพไม่ซ้อนทับกันแล้ว" },
  { version: "1.11.3", note: "ไอคอนแต่ละธีมมีลายประจำเทศกาล และรี:ซีโร่มีรูปตัวละครในโลโก้" },
  { version: "1.11.2", note: "หน้าเปิดรี:ซีโร่เห็นตัวละครเต็มใบ และไม่มีการ์ดปกบังภาพแล้ว" },
  { version: "1.11.1", note: "โลโก้เหลือตัว N จากชุดสุบารุ ทาสีตามธีมทุกธีม" },
  { version: "1.11.0", note: "ภาพตัวละครบนหน้าเปิดรี:ซีโร่เห็นใบหน้าชัดขึ้น และโลโก้หัวเว็บไม่ยืดรูป" },
  { version: "1.10.9", note: "ไอคอนแอปแยกตามธีม ใช้ทั้งหน้าเปิดและโลโก้หัวเว็บ" },
  { version: "1.10.8", note: "แคชรูปตัวละครไว้ตั้งแต่เปิดครั้งแรก ภาพขึ้นทันทีไม่ต้องรอเน็ต" },
  { version: "1.10.7", note: "ฝังรูปตัวละคร 24 คนไว้ในแอป หน้าเปิดและหัวเว็บขึ้นรูปทันที" },
  { version: "1.10.6", note: "หน้าเปิดธีมรี:ซีโร่ใช้เฉพาะคนที่มีรูป และรอภาพขึ้นก่อนเปิดแอป" },
  { version: "1.10.5", note: "ธีมรี:ซีโร่ ภาพตัวละครเต็มหน้าเปิด และรูป-ชื่อหมุนบนหัวเว็บ" },
  { version: "1.10.4", note: "โหมดซูมแบบ X แสดงป้ายเวอร์ชันที่จุดแตะแทนข้อความเดิม" },
  { version: "1.10.3", note: "เลือกซูมแบบ X แล้วหน้าเปิดจะเหลือแค่โลโก้ ไม่มีปกนิยาย" },
  { version: "1.10.2", note: "โลโก้หัวเว็บกลับมาเป็นรูปเดิม พร้อมสติกเกอร์อิโมจิและแสงเรืองตามธีม" },
  { version: "1.10.1", note: "เลือกหน้าเปิดแอปได้: ปกนิยายพลิกเปิด หรือโลโก้ซูมแบบ X" },
  { version: "1.10.0", note: "หัวเว็บและแถบล่างเปลี่ยนสีตามธีม โลโก้ NA เข้าชุดทุกธีม" },
  { version: "1.9.9", note: "เปิดแอปด้วยปกนิยายเปิดแบบ 3D และเพิ่มธีมกระดาษนิยาย" },
  { version: "1.9.8", note: "ธีมเทศกาลเลือกเองตามวัน พร้อมละอองเบา ๆ และเปิดแอปแบบซูมเข้า" },
  { version: "1.9.7", note: "ภาพเปิดแอปของ iOS ให้การซูมจากไอคอนจบที่หน้าเดียวกันกับในแอป" },
  { version: "1.9.6", note: "เปลี่ยนชื่อแอปเป็น Re:NovelTH และหน้าเปิดแอปเหลือแค่การจางปรากฏ" },
  { version: "1.9.5", note: "เพิ่มธีมฮาโลวีน คริสต์มาส ปีใหม่ไทย และโคมไฟอ่านหนังสือ" },
  { version: "1.9.4", note: "หน้าเปิดแอปนุ่มขึ้น โลโก้ค่อย ๆ ปรากฏ ไม่กระตุกเข้าหา" },
  { version: "1.9.3", note: "กดค้างแล้วเลือกหรือก๊อปข้อความในแอปไม่ได้แล้ว ยกเว้นช่องกรอก" },
  { version: "1.9.2", note: "การ์ดรูปตัวละครกะทัดรัดขึ้น ชื่อไทยกับชื่ออังกฤษอยู่บรรทัดเดียวกัน" },
  { version: "1.9.1", note: "ประวัติอัปเดตสั้นลง เหลือเฉพาะเรื่องสำคัญ" },
  { version: "1.9.0", note: "คู่มือปุ่มและท่าทางในหน้าตั้งค่า" },
  { version: "1.8.9", note: "การ์ดตัวละครบอกกลุ่มด้วยสี · เปิดแอปไม่ซ้ำสองรอบ" },
  { version: "1.8.8", note: "แก้ชื่อภาษาอังกฤษของตัวละครได้" },
  { version: "1.8.4", note: "แถบเมนูซ่อนเอง แตะเพื่อเปิด" },
  { version: "1.8.1", note: "ซิงก์บทแปลจากลิงก์ต้นทางเอง" },
  { version: "1.7.5", note: "รายการบทดูเป็นตารางได้" },
];

const SPLASH_MIN_MS = 1500;
// ธีมรี:ซีโร่มีภาพต้องโหลด ให้หน้าเปิดอยู่ต่ออีกหน่อยจะได้ไม่เห็นจอเปล่า
const SPLASH_REZERO_MS = 2400;
const splashStartedAt = performance.now();
const THEMES = ["dark", "light", "sepia", "paper", "black", "eye", "cool", "dusk", "reading", "halloween", "christmas", "songkran", "newyear", "isekai", "cyberpunk", "rezero", "custom"];
// "auto" = ให้ระบบเลือกธีมเทศกาลตามวันที่เอง (โหมดเริ่มต้น)
const THEME_MODES = ["auto", ...THEMES];
const THEME_COLORS = { dark: "#222631", light: "#ffffff", sepia: "#e7dbc4", paper: "#f4ecd8", rezero: "#121524", custom: "#121524", black: "#080808", eye: "#dde8d7", cool: "#f1f5f9", dusk: "#242120", reading: "#1e170f", halloween: "#0b0713", christmas: "#0a1826", songkran: "#06223a", newyear: "#08080a", isekai: "#0a0e17", cyberpunk: "#04060a" };

/* ช่วงเทศกาลที่สลับธีมเอง — from/to เป็น [เดือน, วัน] ครอบปีได้ (ปีใหม่ จาก ธ.ค. ไป ม.ค.) */
const SEASONS = [
  { theme: "halloween", from: [10, 25], to: [11, 1], deco: "🎃", label: "ฮาโลวีน" },
  { theme: "christmas", from: [12, 15], to: [12, 28], deco: "🎄", label: "คริสต์มาส" },
  { theme: "newyear", from: [12, 31], to: [1, 2], deco: "🎆", label: "ปีใหม่" },
  { theme: "songkran", from: [4, 12], to: [4, 16], deco: "💦", label: "สงกรานต์" },
];
function renderChangelog() {
  const list = document.getElementById("changelog-list");
  if (!list) return;
  list.replaceChildren();
  for (const entry of CHANGELOG.slice(0, CHANGELOG_LIMIT)) {
    const item = document.createElement("li");
    const version = document.createElement("strong");
    version.textContent = `v${entry.version}`;
    if (entry.version === APP_VERSION) {
      const badge = document.createElement("span");
      badge.className = "changelog-current";
      badge.textContent = "ตอนนี้";
      version.append(badge);
    }
    const note = document.createElement("span");
    note.textContent = entry.note;
    item.append(version, note);
    list.append(item);
  }
}

function paintVersionLabels() {
  const label = `เวอร์ชัน ${APP_VERSION}`;
  const splashLabel = document.getElementById("splash-version");
  if (splashLabel) splashLabel.textContent = label;
  const footerLabel = document.getElementById("app-version");
  if (footerLabel) footerLabel.textContent = label;
  renderChangelog();
}

/* เปิดหนังสือ: ปกหมุนออกแล้วลบ splash ออกทั้งก้อนทันทีที่อนิเมชันจบ
   เรียกซ้ำได้ปลอดภัย — แตะปก (immediate = true) จะข้ามเวลารอขั้นต่ำ */
function hideSplash(immediate = false) {
  const splash = document.getElementById("splash");
  if (!splash || splash.dataset.leaving === "1") return;
  const minMs = state.theme === "rezero" ? SPLASH_REZERO_MS : SPLASH_MIN_MS;
  const wait = immediate ? 0 : Math.max(0, minMs - (performance.now() - splashStartedAt));
  setTimeout(() => {
    if (splash.dataset.leaving === "1") return;
    splash.dataset.leaving = "1";
    splash.style.pointerEvents = "none";
    splash.classList.add("is-launching");
    let finished = false;
    const done = () => { if (finished) return; finished = true; splash.remove(); };
    // รับเฉพาะอนิเมชันของปก ไม่งั้นอนิเมชันเล็ก ๆ ข้างในจะลบ splash ก่อนเวลา
    splash.addEventListener("animationend", event => { if (event.target.classList?.contains("book")) done(); });
    setTimeout(done, 1200); // เผื่อเครื่องที่ปิดอนิเมชันไว้ ไม่มี animationend
  }, wait);
}

/* เลือกท่าเปิดแอป: "book" = ปกนิยายพลิกเปิด, "zoom" = โลโก้พุ่งเข้าจอแบบแอป X */
function applyLaunchStyle(style) {
  state.launchStyle = style === "zoom" ? "zoom" : "book";
  document.documentElement.dataset.launch = state.launchStyle;
  byId("launch-book")?.setAttribute("aria-pressed", String(state.launchStyle === "book"));
  byId("launch-zoom")?.setAttribute("aria-pressed", String(state.launchStyle === "zoom"));
  const zoom = state.launchStyle === "zoom";
  const open = byId("cover-open");
  if (open) open.textContent = zoom ? `เวอร์ชัน ${APP_VERSION}` : "แตะเพื่อเปิดหนังสือ";
  byId("splash-version")?.toggleAttribute("hidden", zoom);
  byId("splash")?.setAttribute("aria-label", zoom ? "โลโก้แอป แตะเพื่อเข้าแอป" : "ปกหนังสือ แตะเพื่อเปิด");
  // เก็บสำเนาไว้อ่านแบบ synchronous ตอนเปิดหน้า ไม่งั้นผู้ใช้โหมดซูมจะเห็นปกแวบหนึ่ง
  try { localStorage.setItem("renovel-launch", state.launchStyle); } catch (error) {}
}

/* แตะที่ปกหรือปุ่มบนปกเพื่อเปิดหนังสือเองได้ ไม่ต้องรอ */
function installCoverOpen() {
  const splash = byId("splash");
  if (!splash) return;
  splash.addEventListener("click", () => hideSplash(true));
  byId("cover-open")?.addEventListener("click", event => { event.stopPropagation(); hideSplash(true); });
  splash.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); hideSplash(true); } });
}
const dbReady = openDatabase();
const byId = id => document.getElementById(id);
const state = { chapters: [], activeId: "", theme: "dark", themeMode: "auto", seasonalAuto: true, launchStyle: "book", fontSize: 19, lineHeight: 1.9, textWidth: 760, rate: 1, voiceURI: "", pronunciation: [], voices: [], speechQueue: [], speechIndex: 0, speaking: false, utterance: null, speechToken: 0, currentBlockIndex: -1, highlightEnabled: true, followEnabled: true, loadRemoteImages: true, keepScreenAwake: false, wakeLock: null, scrollTimer: 0, noticeTimer: 0, imported: null, statusTimer: 0, sidebarLockY: null, pointerStart: null, pointerTapReady: null, pointerTapExpiry: 0, mode: "scroll", indent: true, pageTop: 0, tapSpeech: true, fontFamily: "noto", pageIndex: 0, pageTotal: 1, pageStep: 0, blockPages: new Map(), pageTimer: 0, paginateTimer: 0, pageHintShown: false, suppressTapUntil: 0, updateTimer: 0, chromeTimer: 0, tapHint: true, hintShown: false, hintTimer: 0, flashTimer: 0, chapterRenderTimer: 0, characterImages: null, characterNames: null, characterCardTitle: "", characterCardToken: 0, characterCardTimer: 0, characterSuggestTimer: 0, scrollProgressTimer: 0, chapterView: "list", chapterColumns: 2, syncUrl: "", autoSync: true, syncing: false, syncedAt: 0, coverPool: null, coverTimer: 0, coverSwapTimer: 0, coverTilesReady: 0, customTheme: { page: "#121524", text: "#dfe5f4", surface: "#1a2036", accent: "#8c82ff", hue: 0, sat: 100, bright: 100, sky: "none" }, rezeroTheme: { accent: "#8c82ff", light: 50, hue: 0, sat: 100, bright: 100, sky: "snow", shooting: true, dust: true } };

// เริ่มโหลดดัชนีตัวละครตั้งแต่ต้นแอป จะได้มีเวลาโหลดรูประหว่างหน้าเปิดโชว์อยู่
void loadCoverPool();

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
  const interludeMatch = title.match(/บทคั่น\s*(\d+)|(?:\binterlude\b|幕間)\s*(\d+)/iu);
  const arcValue = item.arcNumber ?? item.arc ?? arcMatch?.[1] ?? arcMatch?.[2];
  const chapterValue = item.chapterNumber ?? item.episodeNumber ?? chapterMatch?.[1] ?? chapterMatch?.[2] ?? chapterMatch?.[3] ?? interludeMatch?.[1] ?? interludeMatch?.[2];
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

const CHAPTER_COLUMNS = [2, 4, 6];

function chapterIsInterlude(item) {
  return /บทคั่น|ตอนคั่น|\binterlude\b|幕間/iu.test(`${item?.title || ""} ${item?.translatedTitle || ""}`);
}

function chapterCompactLabel(item, number) {
  // Interludes have no place in the main numbering, so they must be named.
  if (chapterIsInterlude(item)) return number == null ? "บทคั่น" : `บทคั่น ${number}`;
  return number == null ? "•" : String(number);
}

function applyChapterView() {
  const grid = state.chapterView === "grid";
  document.body.classList.toggle("chapter-grid", grid);
  document.body.dataset.chapterCols = String(state.chapterColumns);
  byId("view-list").setAttribute("aria-pressed", String(!grid));
  byId("view-grid").setAttribute("aria-pressed", String(grid));
  byId("grid-columns").hidden = !grid;
  for (const count of CHAPTER_COLUMNS) byId(`cols-${count}`).setAttribute("aria-pressed", String(count === state.chapterColumns));
}

function setChapterColumns(count) {
  state.chapterColumns = CHAPTER_COLUMNS.includes(Number(count)) ? Number(count) : 2;
  applyChapterView();
  void writeSetting("chapterColumns", state.chapterColumns);
}

function setChapterView(view) {
  state.chapterView = view === "grid" ? "grid" : "list";
  applyChapterView();
  renderChapterList();
  void writeSetting("chapterView", state.chapterView);
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
        const index = document.createElement("span"); index.className = "chapter-index";
        index.textContent = state.chapterView === "grid" ? chapterCompactLabel(item, number) : number == null ? "•" : String(number);
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

/* ---------- ธีมเทศกาล ---------- */
function activeSeason(date = new Date()) {
  const today = (date.getMonth() + 1) * 100 + date.getDate();
  for (const season of SEASONS) {
    const from = season.from[0] * 100 + season.from[1];
    const to = season.to[0] * 100 + season.to[1];
    const inside = from <= to ? today >= from && today <= to : today >= from || today <= to;
    if (inside) return season;
  }
  return null;
}

/* ธีมที่มีผลจริง: โหมดอัตโนมัติ = ธีมเทศกาลตามวัน (ถ้าถึงช่วงและเปิดสวิตช์ไว้) */
function effectiveTheme() {
  if (state.themeMode !== "auto") return state.themeMode;
  const season = state.seasonalAuto ? activeSeason() : null;
  return season ? season.theme : "dark";
}

/* ---------- ธีมกำหนดเอง: สี เอฟเฟกต์ และสีโลโก้ตั้งได้อิสระ ---------- */
const CUSTOM_DEFAULT = { page: "#121524", text: "#dfe5f4", surface: "#1a2036", accent: "#8c82ff", hue: 0, sat: 100, bright: 100, sky: "none" };

function clampByte(value) { return Math.max(0, Math.min(255, Math.round(value))); }
function hexToRgb(hex) {
  const clean = /^#[0-9a-f]{6}$/iu.test(String(hex)) ? String(hex) : "#000000";
  return [1, 3, 5].map(start => parseInt(clean.slice(start, start + 2), 16));
}
function rgbToHex(list) { return `#${list.map(value => clampByte(value).toString(16).padStart(2, "0")).join("")}`; }
function mixHex(from, to, ratio) {
  const one = hexToRgb(from), two = hexToRgb(to);
  return rgbToHex(one.map((value, index) => value + (two[index] - value) * ratio));
}
function isDarkHex(hex) {
  const [red, green, blue] = hexToRgb(hex);
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255 < 0.5;
}
function hslHex(hue, saturation, light) {
  const sat = saturation / 100, lum = light / 100;
  const chroma = (1 - Math.abs(2 * lum - 1)) * sat;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = lum - chroma / 2;
  const table = [[chroma, second, 0], [second, chroma, 0], [0, chroma, second], [0, second, chroma], [second, 0, chroma], [chroma, 0, second]];
  return rgbToHex(table[Math.floor(hue / 60) % 6].map(value => (value + offset) * 255));
}

/* เขียนตัวแปรสีของธีมกำหนดเองลง :root แล้วคืนค่าเมื่อเปลี่ยนไปธีมอื่น */
function applyCustomTheme() {
  const root = document.documentElement;
  const editor = byId("custom-theme-editor");
  if (editor) editor.hidden = state.themeMode !== "custom";
  const managed = ["--page", "--surface", "--surface-2", "--text", "--muted", "--line", "--accent", "--accent-strong", "--reader", "--reader-text", "--logo-hue", "--logo-sat", "--logo-bright"];
  if (state.theme === "custom") {
    const pick = state.customTheme;
    const dark = isDarkHex(pick.page);
    root.style.setProperty("--page", pick.page);
    root.style.setProperty("--surface", pick.surface);
    root.style.setProperty("--surface-2", mixHex(pick.surface, pick.text, 0.07));
    root.style.setProperty("--text", pick.text);
    root.style.setProperty("--muted", mixHex(pick.text, pick.page, 0.45));
    root.style.setProperty("--line", mixHex(pick.text, pick.page, 0.82));
    root.style.setProperty("--accent", pick.accent);
    root.style.setProperty("--accent-strong", mixHex(pick.accent, dark ? "#ffffff" : "#000000", dark ? 0.34 : 0.2));
    root.style.setProperty("--reader", pick.page);
    root.style.setProperty("--reader-text", pick.text);
    root.style.setProperty("--logo-hue", `${Number(pick.hue) || 0}deg`);
    root.style.setProperty("--logo-sat", String((Number(pick.sat) || 100) / 100));
    root.style.setProperty("--logo-bright", String((Number(pick.bright) || 100) / 100));
    root.style.setProperty("color-scheme", dark ? "dark" : "light");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", pick.page);
  } else {
    for (const name of managed) root.style.removeProperty(name);
    root.style.removeProperty("color-scheme");
  }
  const sky = state.theme === "custom" ? state.customTheme.sky : state.theme === "rezero" ? state.rezeroTheme.sky : "";
  if (sky && sky !== "none") root.dataset.sky = sky;
  else delete root.dataset.sky;
}

/* ---------- ธีมรี:ซีโร่: สี เอฟเฟกต์ และสีโลโก้ปรับได้เอง ---------- */
const REZERO_BASE = { page: "#121524", surface: "#1a2036", surface2: "#222a44", line: "#2e3752" };
const REZERO_DEFAULT = { accent: "#8c82ff", light: 50, hue: 0, sat: 100, bright: 100, sky: "snow", shooting: true, dust: true };

/* สไลเดอร์ความสว่าง: 50 = โทนเดิมของรี:ซีโร่ ต่ำกว่านั้นมืดลง สูงกว่านั้นจางขึ้น */
function rezeroTone(pick) {
  const light = Number.isFinite(Number(pick.light)) ? Number(pick.light) : 50;
  const delta = Math.max(-1, Math.min(1, (light - 50) / 50));
  const target = delta < 0 ? "#06070e" : "#3d486e";
  const ratio = Math.abs(delta) * (delta < 0 ? 0.8 : 0.5);
  return {
    page: mixHex(REZERO_BASE.page, target, ratio),
    surface: mixHex(REZERO_BASE.surface, target, ratio * 0.85),
    surface2: mixHex(REZERO_BASE.surface2, target, ratio * 0.7),
    line: mixHex(REZERO_BASE.line, target, ratio * 0.45)
  };
}

function applyRezeroTheme() {
  const root = document.documentElement;
  const editor = byId("rezero-theme-editor");
  if (editor) editor.hidden = state.themeMode !== "rezero";
  if (state.theme !== "rezero") {
    delete root.dataset.splash;
    delete root.dataset.dust;
    return;
  }
  const pick = state.rezeroTheme;
  const tone = rezeroTone(pick);
  const accent = /^#[0-9a-f]{6}$/iu.test(String(pick.accent)) ? pick.accent : REZERO_DEFAULT.accent;
  root.style.setProperty("--page", tone.page);
  root.style.setProperty("--surface", tone.surface);
  root.style.setProperty("--surface-2", tone.surface2);
  root.style.setProperty("--line", tone.line);
  root.style.setProperty("--reader", tone.page);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-strong", mixHex(accent, "#ffffff", 0.34));
  root.style.setProperty("--logo-hue", `${Number(pick.hue) || 0}deg`);
  root.style.setProperty("--logo-sat", String((Number(pick.sat) || 100) / 100));
  root.style.setProperty("--logo-bright", String((Number(pick.bright) || 100) / 100));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tone.page);
  root.dataset.splash = pick.shooting === false ? "off" : "on";
  root.dataset.dust = pick.dust === false ? "off" : "on";
  paintRezeroInputs();
}

function paintRezeroInputs() {
  const pick = state.rezeroTheme;
  if (byId("rezero-accent")) byId("rezero-accent").value = pick.accent;
  for (const key of ["light", "hue", "sat", "bright"]) {
    const input = byId(`rezero-${key}`);
    if (input) input.value = String(pick[key]);
  }
  if (byId("rezero-light-output")) byId("rezero-light-output").value = `${pick.light}%`;
  if (byId("rezero-hue-output")) byId("rezero-hue-output").value = `${pick.hue}°`;
  if (byId("rezero-sat-output")) byId("rezero-sat-output").value = `${pick.sat}%`;
  if (byId("rezero-bright-output")) byId("rezero-bright-output").value = `${pick.bright}%`;
  if (byId("rezero-sky")) byId("rezero-sky").value = pick.sky;
  if (byId("rezero-shooting")) byId("rezero-shooting").checked = pick.shooting !== false;
  if (byId("rezero-dust")) byId("rezero-dust").checked = pick.dust !== false;
}

function saveRezeroTheme() {
  applyRezeroTheme();
  void writeSetting("rezeroTheme", state.rezeroTheme);
}

function bindRezeroTheme() {
  paintRezeroInputs();
  byId("rezero-accent")?.addEventListener("input", event => { state.rezeroTheme.accent = event.target.value; saveRezeroTheme(); });
  for (const key of ["light", "hue", "sat", "bright"]) {
    byId(`rezero-${key}`)?.addEventListener("input", event => { state.rezeroTheme[key] = Number(event.target.value); saveRezeroTheme(); });
  }
  byId("rezero-sky")?.addEventListener("change", event => { state.rezeroTheme.sky = event.target.value; applyCustomTheme(); paintRezeroInputs(); void writeSetting("rezeroTheme", state.rezeroTheme); });
  byId("rezero-shooting")?.addEventListener("change", event => { state.rezeroTheme.shooting = event.target.checked; saveRezeroTheme(); });
  byId("rezero-dust")?.addEventListener("change", event => { state.rezeroTheme.dust = event.target.checked; saveRezeroTheme(); });
  byId("rezero-reset")?.addEventListener("click", () => { state.rezeroTheme = { ...REZERO_DEFAULT }; saveRezeroTheme(); showStatus("คืนค่าเดิมของธีมรี:ซีโร่แล้ว"); });
}

function paintCustomInputs() {
  const pick = state.customTheme;
  for (const key of ["page", "text", "surface", "accent"]) {
    const input = byId(`custom-${key}`);
    if (input) input.value = pick[key];
  }
  for (const key of ["hue", "sat", "bright"]) {
    const input = byId(`custom-${key}`);
    if (input) input.value = String(pick[key]);
  }
  if (byId("custom-sat-output")) byId("custom-sat-output").value = `${pick.sat}%`;
  if (byId("custom-bright-output")) byId("custom-bright-output").value = `${pick.bright}%`;
  if (byId("custom-sky")) byId("custom-sky").value = pick.sky;
}

function saveCustomTheme() {
  applyCustomTheme();
  paintCustomInputs();
  void writeSetting("customTheme", state.customTheme);
}

function randomCustomTheme() {
  const hue = Math.floor(Math.random() * 360);
  const dark = Math.random() < 0.72;
  const skies = ["none", "snow", "stars", "sparks"];
  return {
    page: hslHex(hue, dark ? 34 : 30, dark ? 7 + Math.random() * 5 : 94),
    text: dark ? hslHex(hue, 14, 91) : hslHex(hue, 22, 11),
    surface: hslHex(hue, dark ? 28 : 34, dark ? 12 + Math.random() * 4 : 98),
    accent: hslHex((hue + 150 + Math.floor(Math.random() * 120)) % 360, 62, dark ? 62 : 40),
    hue: Math.floor(Math.random() * 360),
    sat: 60 + Math.floor(Math.random() * 130),
    bright: 90 + Math.floor(Math.random() * 40),
    sky: skies[Math.floor(Math.random() * skies.length)]
  };
}

function bindCustomTheme() {
  paintCustomInputs();
  for (const key of ["page", "text", "surface", "accent"]) {
    byId(`custom-${key}`)?.addEventListener("input", event => { state.customTheme[key] = event.target.value; saveCustomTheme(); });
  }
  for (const key of ["hue", "sat", "bright"]) {
    byId(`custom-${key}`)?.addEventListener("input", event => { state.customTheme[key] = Number(event.target.value); saveCustomTheme(); });
  }
  byId("custom-sky")?.addEventListener("change", event => { state.customTheme.sky = event.target.value; saveCustomTheme(); });
  byId("custom-random")?.addEventListener("click", () => { state.customTheme = randomCustomTheme(); saveCustomTheme(); showStatus("สุ่มชุดสีใหม่แล้ว"); });
  byId("custom-reset")?.addEventListener("click", () => { state.customTheme = { ...CUSTOM_DEFAULT }; saveCustomTheme(); showStatus("คืนค่าเริ่มต้นของธีมกำหนดเองแล้ว"); });
}

function applyTheme(selection = "auto") {
  state.themeMode = THEME_MODES.includes(selection) ? selection : "dark";
  state.theme = effectiveTheme();
  document.documentElement.dataset.theme = state.theme;
  for (const mode of THEME_MODES) byId(`theme-${mode}`)?.setAttribute("aria-pressed", String(state.themeMode === mode));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[state.theme] || "#222631");
  applyCustomTheme();
  applyRezeroTheme();
  paintThemeLogo();
  paintThemeHint();
  startAmbient(state.theme);
  void syncRezeroCover();
}

/* ไอคอนแอปแยกตามธีม (สร้างจาก tools/build-theme-icons.py) ใช้ทั้งหน้าเปิดและหัวเว็บ */
function themeLogoPath(theme = state.theme) {
  return `icons/theme/${theme}.png`;
}

function paintThemeLogo() {
  const path = themeLogoPath();
  const splashLogo = byId("splash-logo-img");
  if (splashLogo) splashLogo.src = path;
  const avatar = byId("brand-avatar");
  // ธีมรี:ซีโร่มีรูปตัวละครหมุนอยู่แล้ว ปล่อยให้ตัวหมุนเป็นคนคุมรูป
  if (avatar && state.theme !== "rezero") avatar.src = path;
}

/* หัวเว็บธีมรี:ซีโร่มีประกายดาวโปรยลงมา (สร้างครั้งเดียว แล้วให้ CSS อนิเมต) */
function buildHeaderSky() {
  const sky = byId("header-sky");
  if (!sky || sky.childElementCount) return;
  const count = 16;
  for (let index = 0; index < count; index += 1) {
    const flake = document.createElement("i");
    const size = (2 + Math.random() * 2.2).toFixed(1);
    flake.style.left = `${((index + Math.random() * 0.6) / count) * 100}%`;
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    flake.style.setProperty("--dur", `${(6.5 + Math.random() * 5.5).toFixed(1)}s`);
    flake.style.setProperty("--delay", `${(-Math.random() * 11).toFixed(1)}s`);
    flake.style.setProperty("--drift", `${(Math.random() * 14 - 7).toFixed(1)}px`);
    sky.append(flake);
  }
}

function paintThemeHint() {
  const hint = byId("seasonal-hint");
  if (!hint) return;
  if (state.themeMode !== "auto") hint.textContent = "เลือกธีมเองอยู่ · ระบบจะไม่สลับตามเทศกาลให้";
  else if (!state.seasonalAuto) hint.textContent = "ปิดธีมเทศกาลไว้ · ใช้ธีมมืดปกติและไม่มีละออง";
  else {
    const season = activeSeason();
    hint.textContent = season
      ? `ช่วงนี้เลือกธีม ${season.deco} ${season.label} ให้เองอัตโนมัติ`
      : "ยังไม่ถึงช่วงเทศกาล · ใช้ธีมมืดปกติ";
  }
}

/* ---------- ธีมรี:ซีโร่: ภาพตัวละครเต็มหน้าเปิด + รูป/ชื่อหมุนบนหัวเว็บ ---------- */
const COVER_TILES = 8;
const COVER_SWAP_MS = 5200;

function shuffleList(list) {
  const items = list.slice();
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    const swap = items[index]; items[index] = items[other]; items[other] = swap;
  }
  return items;
}

/* อ่านดัชนีตัวละครครั้งเดียวแล้วใช้ซ้ำ (ไฟล์ถูก precache ไว้แล้วโดย service worker) */
async function loadCoverPool() {
  if (state.coverPool) return state.coverPool;
  // รูปที่ฝังมากับแอปมาก่อน — ขึ้นทันทีและใช้ได้ตอนออฟไลน์
  try {
    const bundled = await fetch("characters-local.json", { cache: "force-cache" });
    if (bundled.ok) {
      const local = await bundled.json();
      const list = Array.isArray(local?.characters) ? local.characters : [];
      state.coverPool = shuffleList(list.filter(item => item && item.title && item.image));
      if (state.coverPool.length) return state.coverPool;
    }
  } catch (error) {}
  try {
    const response = await fetch("characters.json", { cache: "force-cache" });
    const data = await response.json();
    const list = Array.isArray(data?.characters) ? data.characters : [];
    // เอาเฉพาะคนที่มีรูปจริงและเป็นลิงก์เว็บ (บางคนในดัชนีมีแต่ชื่อ)
    state.coverPool = shuffleList(list.filter(item => item && item.title && typeof item.image === "string" && /^https?:\/\//.test(item.image)));
  } catch (error) { state.coverPool = []; }
  return state.coverPool;
}

/* ขอภาพขนาดเล็กลง (240px) พอสำหรับช่องละ 1/3 จอ จะได้ขึ้นเร็วขึ้นมาก */
function coverImageUrl(url) {
  return String(url).replace(/scale-to-width-down\/\d+/, "scale-to-width-down/240");
}

function fillCoverCollage(pool) {
  const collage = byId("cover-collage");
  if (!collage || collage.childElementCount || !pool.length) return;
  state.coverTilesReady = 0;
  for (const item of shuffleList(pool).slice(0, COVER_TILES)) {
    // แต่ละภาพมีช่องของตัวเอง กันการขยับซูมไปทับช่องข้าง ๆ
    const cell = document.createElement("span");
    cell.className = "collage-cell";
    const tile = document.createElement("img");
    tile.alt = "";
    tile.decoding = "async";
    tile.fetchPriority = "high";
    // ค่อย ๆ ขึ้นเมื่อภาพมาถึง ไม่ใช่โชว์ช่องเปล่า
    tile.addEventListener("load", () => { tile.classList.add("ready"); state.coverTilesReady += 1; }, { once: true });
    // รูปบางรูปต้องใช้อินเทอร์เน็ต — ถ้าโหลดไม่ได้ให้เอาช่องนั้นออก ไม่ทิ้งกล่องดำค้าง
    tile.addEventListener("error", () => cell.remove(), { once: true });
    tile.src = coverImageUrl(item.image);
    cell.append(tile);
    collage.append(cell);
  }
}

/* รอให้มีภาพขึ้นอย่างน้อย 3 ช่อง (หรือหมดเวลา) ก่อนปิดหน้าเปิด */
function waitForCoverTiles(limit = 1300) {
  return new Promise(resolve => {
    const startedAt = performance.now();
    const tick = () => {
      if (state.coverTilesReady >= 3 || performance.now() - startedAt > limit) { resolve(); return; }
      setTimeout(tick, 60);
    };
    tick();
  });
}

function resetCoverHeader() {
  const avatar = byId("brand-avatar");
  const name = byId("brand-name");
  if (avatar) avatar.src = themeLogoPath();
  if (name) name.textContent = "Re:NovelTH";
  document.querySelector(".brand-logo")?.classList.remove("swapping");
  document.querySelector(".brand")?.classList.remove("swapping");
}

function stopCoverRotation() {
  clearInterval(state.coverTimer);
  clearTimeout(state.coverSwapTimer);
  state.coverTimer = 0;
  state.coverSwapTimer = 0;
  resetCoverHeader();
}

/* หัวเว็บ: รูปตัวละครสุ่มค่อย ๆ จางสลับไปเรื่อย ๆ พร้อมเปลี่ยนชื่อตามคนที่โผล่ */
function startCoverRotation(pool) {
  stopCoverRotation();
  if (!pool.length) return;
  const avatar = byId("brand-avatar");
  const name = byId("brand-name");
  const logo = document.querySelector(".brand-logo");
  const brand = document.querySelector(".brand");
  if (!avatar || !name || !logo) return;
  if (!avatar.dataset.fallback) {
    avatar.dataset.fallback = "1";
    avatar.addEventListener("error", () => { avatar.src = themeLogoPath(); });
  }
  let index = Math.floor(Math.random() * pool.length);
  const paint = () => {
    const item = pool[index % pool.length];
    avatar.src = coverImageUrl(item.image);
    name.textContent = item.title || item.name || "Re:NovelTH";
  };
  paint();
  state.coverTimer = setInterval(() => {
    if (document.hidden) return;
    index += 1 + Math.floor(Math.random() * 3);
    clearTimeout(state.coverSwapTimer);
    logo.classList.add("swapping");
    brand?.classList.add("swapping");
    state.coverSwapTimer = setTimeout(() => {
      paint();
      logo.classList.remove("swapping");
      brand?.classList.remove("swapping");
    }, 420);
  }, COVER_SWAP_MS);
}

async function syncRezeroCover() {
  if (state.theme !== "rezero") {
    stopCoverRotation();
    byId("cover-collage")?.replaceChildren();
    return;
  }
  const pool = await loadCoverPool();
  if (state.theme !== "rezero") return;
  fillCoverCollage(pool);
  startCoverRotation(pool);
}

/* ---------- ละอองเทศกาล: canvas เบา ๆ หยุดเองเมื่อเลื่อนอ่าน ---------- */
const AMBIENT_BY_THEME = { halloween: "bats", christmas: "snow", songkran: "drops", newyear: "sparkle", isekai: "mana" };
const ambient = { kind: "", canvas: null, ctx: null, dots: [], raf: 0, width: 0, height: 0, paused: true, resumeTimer: 0, last: 0, reduced: false };

function ambientConfig(kind) {
  switch (kind) {
    case "snow": return { count: 44, color: "#ffffff", vx: [.04, .22], vy: [.18, .62], size: [1, 2.4], alpha: [.25, .6], mode: "fall" };
    case "drops": return { count: 26, color: "#9fe4ff", vx: [-.08, .08], vy: [.45, 1.3], size: [1.2, 2.4], alpha: [.18, .45], mode: "fall" };
    case "bats": return { count: 12, color: "#ff9a4d", vx: [-.14, .14], vy: [-.16, -.4], size: [5, 9], alpha: [.18, .42], mode: "bat" };
    case "sparkle": return { count: 30, color: "#d4af37", vx: [-.06, .06], vy: [-.06, -.3], size: [1, 2.4], alpha: [.15, .55], mode: "twinkle" };
    case "mana": return { count: 26, color: "#e8c766", vx: [-.04, .04], vy: [-.04, -.2], size: [.9, 2], alpha: [.12, .42], mode: "twinkle" };
    default: return null;
  }
}

function randomBetween(min, max) { return min + Math.random() * (max - min); }

function seedAmbientDots(kind, width, height) {
  const config = ambientConfig(kind);
  if (!config) return [];
  const count = Math.round(config.count * (width < 480 ? .75 : 1));
  const dots = [];
  for (let index = 0; index < count; index += 1) {
    dots.push({
      x: Math.random() * width, y: Math.random() * height,
      vx: randomBetween(config.vx[0], config.vx[1]), vy: randomBetween(config.vy[0], config.vy[1]),
      r: randomBetween(config.size[0], config.size[1]), a: randomBetween(config.alpha[0], config.alpha[1]),
      phase: Math.random() * Math.PI * 2, spin: randomBetween(1.2, 2.8) * (Math.random() < .5 ? -1 : 1),
    });
  }
  return dots;
}

function resizeAmbient() {
  const canvas = ambient.canvas;
  if (!canvas || !ambient.ctx) return;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  ambient.width = window.innerWidth;
  ambient.height = window.innerHeight;
  canvas.width = Math.round(ambient.width * ratio);
  canvas.height = Math.round(ambient.height * ratio);
  ambient.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ambient.dots = seedAmbientDots(ambient.kind, ambient.width, ambient.height);
}

function drawBat(ctx, dot) {
  const flap = Math.sin(dot.phase * 2.4) * dot.r * .55;
  ctx.beginPath();
  ctx.moveTo(dot.x, dot.y);
  ctx.quadraticCurveTo(dot.x - dot.r, dot.y - flap, dot.x - dot.r * 1.9, dot.y + dot.r * .35);
  ctx.quadraticCurveTo(dot.x - dot.r * .9, dot.y + dot.r * .15, dot.x, dot.y + dot.r * .5);
  ctx.quadraticCurveTo(dot.x + dot.r * .9, dot.y + dot.r * .15, dot.x + dot.r * 1.9, dot.y + dot.r * .35);
  ctx.quadraticCurveTo(dot.x + dot.r, dot.y - flap, dot.x, dot.y);
  ctx.fill();
}

function drawAmbient(now) {
  const { ctx, kind } = ambient;
  const config = ambientConfig(kind);
  if (!ctx || !config) return;
  const step = Math.min(48, now - (ambient.last || now));
  ambient.last = now;
  ctx.clearRect(0, 0, ambient.width, ambient.height);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = config.color;
  for (const dot of ambient.dots) {
    dot.x += dot.vx * step * .06;
    dot.y += dot.vy * step * .06;
    dot.phase += dot.spin * step * .001;
    if (dot.y < -24 || dot.y > ambient.height + 24 || dot.x < -24 || dot.x > ambient.width + 24) {
      const falling = config.mode === "fall";
      dot.y = falling ? -14 : ambient.height + 14;
      dot.x = Math.random() * ambient.width;
    }
    const twinkle = config.mode === "twinkle" ? .4 + .6 * Math.abs(Math.sin(dot.phase)) : 1;
    ctx.globalAlpha = dot.a * twinkle;
    if (config.mode === "bat") drawBat(ctx, dot);
    else { ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r * (config.mode === "twinkle" ? twinkle * 1.3 : 1), 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ambient.raf = ambient.paused ? 0 : requestAnimationFrame(drawAmbient);
}

function resumeAmbient() {
  if (!ambient.ctx || !ambient.kind || !ambient.paused) return;
  ambient.paused = false;
  ambient.last = 0;
  ambient.raf = requestAnimationFrame(drawAmbient);
}

function pauseAmbient() {
  ambient.paused = true;
  if (ambient.raf) cancelAnimationFrame(ambient.raf);
  ambient.raf = 0;
}

function stopAmbient() {
  pauseAmbient();
  if (ambient.ctx && ambient.canvas) {
    ambient.ctx.setTransform(1, 0, 0, 1, 0, 0);
    ambient.ctx.clearRect(0, 0, ambient.canvas.width, ambient.canvas.height);
  }
  ambient.kind = "";
  ambient.ctx = null;
  ambient.dots = [];
  if (ambient.canvas) ambient.canvas.hidden = true;
}

function startAmbient(theme) {
  const canvas = byId("ambient");
  if (!canvas) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) ambient.reduced = true;
  const kind = ambient.reduced ? "" : (AMBIENT_BY_THEME[theme] || "");
  if (!kind) { stopAmbient(); return; }
  if (kind === ambient.kind && ambient.ctx) { resumeAmbient(); return; }
  stopAmbient();
  ambient.kind = kind;
  ambient.canvas = canvas;
  ambient.ctx = canvas.getContext("2d");
  if (!ambient.ctx) { ambient.kind = ""; return; }
  canvas.hidden = false;
  resizeAmbient();
  resumeAmbient();
}

/* ลากอ่านแล้วละอองหยุดและหรี่ลง กันกวนสายตาและประหยัดแบต */
function installAmbientGuards() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { ambient.reduced = true; stopAmbient(); }
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY, delta = y - lastY;
    lastY = y;
    if (!ambient.kind || Math.abs(delta) < 6) return;
    if (delta > 0) {
      ambient.canvas?.classList.add("dim");
      pauseAmbient();
    }
    clearTimeout(ambient.resumeTimer);
    ambient.resumeTimer = setTimeout(() => { ambient.canvas?.classList.remove("dim"); resumeAmbient(); }, 900);
  }, { passive: true });
  window.addEventListener("resize", () => { if (ambient.kind) resizeAmbient(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pauseAmbient(); else resumeAmbient(); });
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
            // Eager: paged mode measures block heights, and a deferred load event
            // means the page is split before the image has a real size.
            element.loading = "eager"; element.decoding = "async";
          } else if (remoteUrl && state.loadRemoteImages) {
            element.loading = "eager"; element.referrerPolicy = "no-referrer"; element.decoding = "async";
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
  // The chapter heading lives in the page footer instead of the text flow: as a
  // block it could not share its page with the opening illustration.
  byId("page-chapter-title").textContent = `${novelLabel(item)} · ${normalizeTitle(item)}`;
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
  updateScrollProgress();
}

function closeReader() {
  document.body.classList.remove("reading");
  toggleChrome(true);
  stopSpeech(false); state.activeId = ""; updateScrollProgress(); byId("reader").hidden = true; byId("chapter-navigation").hidden = true; byId("welcome").hidden = false; byId("audio-bar").hidden = true; void syncWakeLock(); renderChapterList();
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
  content.append(safeChapterFragment(item.html, item.sourceUrl || ""));
  const blockSelector = "p,li,blockquote,h1,h2,h3,h4,h5,h6";
  const blocks = [...content.querySelectorAll(blockSelector)].filter(element => !element.parentElement?.closest(blockSelector));
  blocks.forEach((block, blockIndex) => { block.dataset.blockIndex = String(blockIndex); });
  state.currentBlockIndex = -1;
  markSmallImages(content);
  decorateSpeakerLabels(content);
  for (const image of content.querySelectorAll("img")) {
    // Paged mode needs the real height before splitting pages; scroll mode keeps
    // images lazy so a long chapter does not download everything at once.
    if (!isPageMode()) image.loading = "lazy";
    if (!image.complete) image.addEventListener("load", () => { if (isPageMode()) schedulePaginate(); }, { once: true });
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
  if (!document.body.classList.contains("chrome-hidden")) armChromeAutoHide(1400);
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
  updateScrollProgress();
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
  byId("speak-button").dataset.state = playing ? "pause" : "play";
  const speakLabel = byId("speak-button").querySelector(".audio-label");
  if (speakLabel) speakLabel.textContent = playing ? "พัก" : "ฟัง";
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
  if (label) label.textContent = count
    ? "จับคู่ไว้ " + count.toLocaleString("th-TH") + " ชื่อ · ใช้ดึงรูปและกลุ่มของตัวละคร"
    : "จับคู่ชื่อไทยในบทกับชื่ออังกฤษในวิกิ เพื่อดึงรูปและกลุ่มของตัวละคร";
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

async function characterIndex() {
  if (state.characterIndex) return state.characterIndex;
  const byTitle = new Map(), byName = new Map();
  try {
    const response = await fetch("characters.json", { cache: "force-cache" });
    if (response.ok) {
      const payload = await response.json();
      for (const entry of payload?.characters || []) {
        if (!entry || !entry.image || String(entry.image).startsWith("data:")) continue;
        for (const key of [entry.title, entry.slug]) {
          const normalized = normalizeCharacterKey(key).toLocaleLowerCase();
          if (normalized && !byTitle.has(normalized)) byTitle.set(normalized, entry);
        }
        const label = normalizeCharacterKey(entry.name).toLocaleLowerCase();
        if (label && !byName.has(label)) byName.set(label, entry);
      }
    }
  } catch (_) { /* index is optional; live search still works */ }
  state.characterIndex = { byTitle, byName };
  return state.characterIndex;
}

async function characterIndexEntry(query) {
  if (!query) return null;
  const index = await characterIndex();
  const key = normalizeCharacterKey(query).toLocaleLowerCase();
  return index.byTitle.get(key) || index.byName.get(key) || null;
}

async function lookupCharacterPortrait(query) {
  if (!query || !state.loadRemoteImages) return { image: "", entry: null };
  const entry = await characterIndexEntry(query);
  if (entry) return { image: entry.image, entry };
  return { image: await lookupCharacterImage(query), entry: null };
}

function applyCharacterFaction(entry) {
  const card = byId("character-card");
  const badge = byId("character-card-faction");
  if (entry?.color) card.style.setProperty("--character-color", entry.color);
  else card.style.removeProperty("--character-color");
  // บอกด้วยว่ารูปนี้อยู่กลุ่ม/แคมป์ไหน แล้วใช้สีกลุ่มนั้นกับการ์ดทั้งหลัง
  const group = entry?.section || entry?.region || "";
  badge.hidden = !group;
  badge.textContent = group;
  card.classList.toggle("has-faction", Boolean(group));
}

function characterFactionLabel(entry) {
  if (!entry) return "";
  const parts = [entry.region].filter(Boolean);
  return parts.length ? parts.join(" · ") + " · Re:Zero Wiki" : "จาก Re:Zero Wiki";
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

function setCharacterTitle(title) {
  state.characterCardTitle = String(title || "");
  byId("character-card-title").textContent = state.characterCardTitle;
  byId("character-card-edit").hidden = !state.characterCardTitle || !byId("character-card-form").hidden;
}

function showCharacterForm(visible) {
  byId("character-card-form").hidden = !visible;
  const box = byId("character-card-suggestions");
  if (!visible) { box.hidden = true; box.replaceChildren(); }
  // While the rename form is open there is no portrait to look at, so the
  // auto-close countdown must not run in the background.
  else clearTimeout(state.characterCardTimer);
  byId("character-card-edit").hidden = visible || !state.characterCardTitle;
}

function armCharacterCardTimer() {
  // Always restart the countdown for the image that just appeared; keeping the
  // previous timeout would close the new card early.
  clearTimeout(state.characterCardTimer);
  state.characterCardTimer = setTimeout(closeCharacterCard, 10000);
}

function closeCharacterCard() {
  clearTimeout(state.characterCardTimer);
  state.characterCardToken++;
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
  const token = state.characterCardToken;
  const thai = byId("character-card-name").textContent || "ตัวละคร";
  await rememberCharacterName(thai, title);
  const image = await lookupCharacterImage(title);
  if (byId("character-card").hidden || token !== state.characterCardToken) return;
  setCharacterTitle(title);
  setCharacterFigure(image, thai);
  showCharacterForm(!image);
  byId("character-card-note").textContent = image ? "จาก Re:Zero Wiki · จำชื่อนี้ไว้แล้ว" : "ไม่พบรูปของ “" + title + "” — ลองเลือกชื่ออื่น";
  if (image) armCharacterCardTimer();
}

async function openCharacterCard(label) {
  const card = byId("character-card");
  const token = ++state.characterCardToken;
  clearTimeout(state.characterCardTimer);
  setCharacterTitle("");
  const thai = characterThaiName(label) || "ตัวละคร";
  byId("character-card-name").textContent = thai;
  const spinner = document.createElement("span");
  spinner.className = "character-card-spinner"; spinner.setAttribute("aria-hidden", "true");
  byId("character-card-figure").replaceChildren(spinner);
  showCharacterForm(false);
  byId("character-card-note").textContent = "กำลังค้นรูป…";
  card.hidden = false;
  const query = await characterTitleFor(label);
  if (card.hidden || token !== state.characterCardToken) return;
  setCharacterTitle(query);
  if (!query) {
    setCharacterFigure("", thai);
    showCharacterForm(true);
    applyCharacterFaction(null);
    const tableSize = state.characterNames ? Object.keys(state.characterNames).length : 0;
    byId("character-card-note").textContent = tableSize
      ? "“" + thai + "” ไม่อยู่ในตารางชื่อที่นำเข้า — พิมพ์ชื่อภาษาอังกฤษแล้วกดบันทึก"
      : "ยังไม่มีชื่อภาษาอังกฤษ — พิมพ์หรือเลือกชื่อจากวิกิแล้วกดบันทึก (จำไว้ครั้งเดียว)";
    byId("character-card-input").value = "";
    return;
  }
  const portrait = await lookupCharacterPortrait(query);
  const image = portrait.image;
  if (card.hidden || token !== state.characterCardToken) return;
  applyCharacterFaction(portrait.entry);
  if (!image) {
    showCharacterForm(true);
    byId("character-card-note").textContent = state.loadRemoteImages
      ? "ไม่พบรูปของ “" + query + "” ในวิกิ — แก้ชื่อภาษาอังกฤษ หรือแตะชื่ออีกครั้งเพื่อค้นใหม่"
      : "ปิดสวิตช์ “โหลดรูปจากเว็บต้นทาง” อยู่ จึงดึงรูปไม่ได้";
    byId("character-card-input").value = query;
    return;
  }
  setCharacterFigure(image, thai);
  byId("character-card-note").textContent = characterFactionLabel(portrait.entry);
  armCharacterCardTimer();
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
  // ชื่อที่เคยจับคู่ไว้อาจพิมพ์ผิด แก้ทับได้โดยไม่ต้องล้างตารางชื่อทั้งไฟล์
  byId("character-card-edit").addEventListener("click", () => {
    const input = byId("character-card-input");
    input.value = state.characterCardTitle || "";
    showCharacterForm(true);
    byId("character-card-note").textContent = "แก้ชื่อภาษาอังกฤษแล้วกดบันทึก — ชื่อเดิมของ “"
      + (byId("character-card-name").textContent || "ตัวละคร") + "” จะถูกทับ";
    input.focus();
    input.select();
  });
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
  // ไม่ให้เลือก/ก๊อปข้อความทั้งแอป เว้นแต่ช่องกรอกที่ต้องพิมพ์หรือวางลิงก์
  document.addEventListener("selectstart", event => {
    if (event.target.closest?.("input, textarea, select, [contenteditable=true]")) return;
    event.preventDefault();
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

// Automatic sync: pull the same JSON backup from a URL the reader controls and
// merge only the chapters whose text changed, so no file picking is needed.
const SYNC_TIMEOUT_MS = 20000;
const SYNC_PROGRESS_KEYS = ["lastScrollRatio", "lastReadProgress", "lastProgressMode", "lastSpeechIndex"];

function syncTimeLabel(timestamp) {
  if (!timestamp) return "ยังไม่เคยซิงก์";
  try { return new Date(timestamp).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }); } catch { return ""; }
}

function paintSyncHint(message = "") {
  const hint = byId("sync-hint");
  if (!hint) return;
  if (message) { hint.textContent = message; return; }
  if (!state.syncUrl) { hint.textContent = "ยังไม่ได้ตั้งลิงก์ · วางลิงก์ไฟล์สำรองแล้วกด “บันทึกลิงก์”"; return; }
  hint.textContent = `ซิงก์ล่าสุด: ${syncTimeLabel(state.syncedAt)}`;
}

function normalizeSyncUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  let url;
  try { url = new URL(text); } catch { throw new Error("ลิงก์ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://"); }
  if (!/^https?:$/i.test(url.protocol)) throw new Error("ลิงก์ต้องเป็น http หรือ https เท่านั้น");
  return url.href;
}

async function setSyncUrl(value, { persist = true } = {}) {
  state.syncUrl = normalizeSyncUrl(value);
  const input = byId("sync-url");
  if (input && input.value.trim() !== state.syncUrl) input.value = state.syncUrl;
  if (persist) await writeSetting("syncUrl", state.syncUrl);
  paintSyncHint();
  return state.syncUrl;
}

async function fetchBackupFromUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const response = await fetch(url, { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", signal: controller.signal });
    if (!response.ok) throw new Error(`ลิงก์ตอบกลับ ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`);
    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { throw new Error("ลิงก์นี้ไม่ใช่ไฟล์ JSON"); }
    return validateBackup(parsed);
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("รอข้อมูลนานเกินไป ลองอีกครั้งเมื่อเน็ตดีขึ้น");
    if (error instanceof TypeError) throw new Error("ดึงไฟล์ไม่ได้ (ลิงก์ผิด เน็ตหลุด หรือปลายทางไม่ได้เปิด CORS)");
    throw error;
  } finally { clearTimeout(timer); }
}

async function syncChapters({ manual = false } = {}) {
  if (state.syncing) return;
  const url = state.syncUrl;
  if (!url) { if (manual) showStatus("ยังไม่ได้ตั้งลิงก์ไฟล์สำรอง", 6000); return; }
  state.syncing = true;
  byId("sync-now")?.setAttribute("disabled", "");
  if (manual) showStatus("กำลังซิงก์กับต้นทาง…", 20000);
  try {
    const backup = await fetchBackupFromUrl(url);
    await persistReadingPosition().catch(() => {});
    const db = await dbReady;
    const existing = new Map((await readAllChapters()).map(item => [item.id, item]));
    const touched = new Set();
    let added = 0, updated = 0;
    for (const chapter of backup.chapters) {
      const previous = existing.get(chapter.id);
      if (!previous) { added += 1; touched.add(chapter.id); continue; }
      const changed = previous.html !== chapter.html
        || String(previous.savedAt ?? "") !== String(chapter.savedAt ?? "")
        || normalizeTitle(previous) !== normalizeTitle(chapter);
      if (!changed) continue;
      // Keep the reader's place in a chapter whose text was revised upstream.
      for (const key of SYNC_PROGRESS_KEYS) if (previous[key] !== undefined) chapter[key] = previous[key];
      updated += 1; touched.add(chapter.id);
    }
    const table = new Map((await readSetting("pronunciation", [])).map(item => [item.word.toLocaleLowerCase(), item]));
    let tableChanged = false;
    for (const item of backup.pronunciations) {
      const previous = table.get(item.word.toLocaleLowerCase());
      if (!previous || previous.reading !== item.reading) { table.set(item.word.toLocaleLowerCase(), item); tableChanged = true; }
    }
    if (touched.size || tableChanged) {
      const tx = db.transaction([CHAPTERS, SETTINGS], "readwrite");
      for (const chapter of backup.chapters) if (touched.has(chapter.id)) tx.objectStore(CHAPTERS).put(chapter);
      if (tableChanged) {
        state.pronunciation = [...table.values()];
        tx.objectStore(SETTINGS).put({ id: "pronunciation", value: state.pronunciation });
      }
      await transactionDone(tx);
      await refreshChapters();
      if (state.activeId && touched.has(state.activeId)) await openChapter(state.activeId);
    }
    state.syncedAt = Date.now();
    await writeSetting("syncedAt", state.syncedAt);
    paintSyncHint();
    const summary = [];
    if (added) summary.push(`ใหม่ ${added.toLocaleString("th-TH")} บท`);
    if (updated) summary.push(`แก้ไข ${updated.toLocaleString("th-TH")} บท`);
    if (summary.length) showStatus(`${manual ? "ซิงก์แล้ว" : "ซิงก์อัตโนมัติ"} · ${summary.join(" · ")}`, 8000);
    else if (manual) showStatus("ทุกบทตรงกับต้นทางแล้ว", 6000);
  } catch (error) {
    paintSyncHint(`ซิงก์ไม่สำเร็จ: ${error.message}`);
    if (manual) showStatus(`ซิงก์ไม่สำเร็จ: ${error.message}`, 0);
  } finally {
    state.syncing = false;
    byId("sync-now")?.removeAttribute("disabled");
  }
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
  byId("sync-url").addEventListener("change", () => { setSyncUrl(byId("sync-url").value).catch(error => showStatus(error.message, 0)); });
  byId("sync-save").addEventListener("click", () => {
    setSyncUrl(byId("sync-url").value)
      .then(url => {
        showStatus(url ? "บันทึกลิงก์ซิงก์แล้ว" : "ลบลิงก์ซิงก์แล้ว แอปจะไม่ดึงข้อมูลเอง", 5000);
        if (url) return syncChapters({ manual: true });
      })
      .catch(error => showStatus(error.message, 0));
  });
  byId("sync-now").addEventListener("click", () => {
    setSyncUrl(byId("sync-url").value).then(() => syncChapters({ manual: true })).catch(error => showStatus(error.message, 0));
  });
  byId("sync-toggle").addEventListener("change", event => {
    state.autoSync = event.target.checked;
    void writeSetting("autoSync", state.autoSync);
  });
  byId("search").addEventListener("input", scheduleChapterRender);
  byId("sort").addEventListener("change", () => { renderChapterList(); updateChapterNavigation(); });
  byId("view-list").addEventListener("click", () => setChapterView("list"));
  byId("view-grid").addEventListener("click", () => setChapterView("grid"));
  for (const count of CHAPTER_COLUMNS) byId(`cols-${count}`).addEventListener("click", () => setChapterColumns(count));
  byId("menu-toggle").addEventListener("click", () => setSidebarOpen(!document.body.classList.contains("sidebar-open")));
  byId("reader-menu").addEventListener("click", () => setSidebarOpen(true));
  document.addEventListener("click", event => { if (event.target === document.body && document.body.classList.contains("sidebar-open")) setSidebarOpen(false); });
  byId("chapter-previous").addEventListener("click", () => goToAdjacentChapter(-1));
  byId("chapter-next").addEventListener("click", () => goToAdjacentChapter(1));
  bindCustomTheme();
  bindRezeroTheme();
  for (const mode of THEME_MODES) byId(`theme-${mode}`).addEventListener("click", () => { applyTheme(mode); void writeSetting("theme", mode); });
  byId("launch-book").addEventListener("click", () => { applyLaunchStyle("book"); void writeSetting("launchStyle", state.launchStyle); });
  byId("launch-zoom").addEventListener("click", () => { applyLaunchStyle("zoom"); void writeSetting("launchStyle", state.launchStyle); });
  byId("seasonal-toggle").addEventListener("change", event => {
    state.seasonalAuto = event.target.checked;
    void writeSetting("seasonalAuto", state.seasonalAuto);
    applyTheme(state.themeMode);
  });
  // โหมดอัตโนมัติ: เปิดแอปข้ามวัน/ข้ามเทศกาล ให้คำนวณใหม่
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && state.themeMode === "auto") applyTheme("auto"); });
  installAmbientGuards();
  // ปุ่มบนหน้าเริ่มต้น: เปิดหน้าตั้งค่าแล้วเลื่อนไปกลุ่มซิงก์เลย ไม่ต้อง import ไฟล์ก่อน
  const openSyncSettings = () => {
    const sheet = byId("settings-sheet");
    if (typeof sheet.showModal === "function") { if (!sheet.open) sheet.showModal(); } else sheet.setAttribute("open", "");
    const group = byId("sync-url").closest("section");
    if (group) group.scrollIntoView({ block: "center" });
    byId("sync-url").focus({ preventScroll: true });
  };
  byId("welcome-sync").addEventListener("click", openSyncSettings);
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
  installChromeAutoHide();
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

function updateScrollProgress() {
  const bar = byId("scroll-progress");
  if (!bar) return;
  const visible = Boolean(state.activeId) && !isPageMode();
  bar.hidden = !visible;
  if (!visible) return;
  const ratio = readingRatio();
  byId("scroll-progress-fill").style.width = `${(ratio * 100).toFixed(2)}%`;
  byId("scroll-percent").textContent = `${Math.round(ratio * 100)}%`;
  bar.classList.add("show");
  clearTimeout(state.scrollProgressTimer);
  state.scrollProgressTimer = setTimeout(() => bar.classList.remove("show"), 1100);
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
  modeToggle.title = modeLabel;
  modeToggle.setAttribute("aria-label", modeLabel);
  if (!state.activeId) toggleChrome(true);
  if (persist) void writeSetting("readingMode", state.mode);
  updateChromeToggle();
  updateScrollProgress();
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
  byId("page-footer").setAttribute("aria-hidden", state.chromeHidden ? "true" : "false");
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

/* ปล่อยไว้สักพักแล้วแถบเครื่องมือเก็บเอง ไม่ต้องกดปุ่มซ่อนทุกครั้ง */
const CHROME_HIDE_MS = 4200;

function toggleChrome(show, { auto = true } = {}) {
  const shouldShow = show == null ? document.body.classList.contains("chrome-hidden") : Boolean(show);
  document.body.classList.toggle("chrome-hidden", !shouldShow);
  clearTimeout(state.chromeTimer); state.chromeTimer = 0;
  if (shouldShow && auto) armChromeAutoHide();
  updateChromeToggle();
}

function armChromeAutoHide(delay = CHROME_HIDE_MS) {
  clearTimeout(state.chromeTimer);
  state.chromeTimer = setTimeout(() => {
    state.chromeTimer = 0;
    if (!canAutoHideChrome()) return;
    toggleChrome(false, { auto: false });
  }, delay);
}

function canAutoHideChrome() {
  if (!state.activeId) return false;
  if (document.body.classList.contains("sidebar-open")) return false;
  if (byId("settings-sheet")?.open) return false;
  if (byId("import-dialog")?.open) return false;
  if (byId("character-card") && !byId("character-card").hidden) return false;
  if (state.speaking) return false;
  if (document.activeElement?.closest?.("dialog, #character-card")) return false;
  return true;
}

/* ระหว่างอ่าน: เลื่อนลงแล้วเก็บแถบเครื่องมือเอง
   เลื่อนขึ้นไม่ต้องโผล่มาเอง แตะเนื้อหาเมื่อต้องการเปิด (โหมดพลิกหน้ามีการซ่อนตอนเปิดบทอยู่แล้ว) */
function installChromeAutoHide() {
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    if (!state.activeId || isPageMode()) return;
    if (document.body.classList.contains("sidebar-open")) return;
    const y = window.scrollY, delta = y - lastY;
    if (Math.abs(delta) < 8) return;
    lastY = y;
    if (delta > 0 && !document.body.classList.contains("chrome-hidden")) toggleChrome(false, { auto: false });
  }, { passive: true });
  // กำลังแตะ/กดปุ่มอยู่ในแถบเครื่องมือ อย่าเพิ่งซ่อน
  document.addEventListener("pointerdown", event => {
    if (!state.chromeTimer) return;
    if (!event.target.closest?.(".app-header, .audio-bar, .page-footer")) return;
    armChromeAutoHide();
  }, { capture: true, passive: true });
}

function updateChromeToggle() {
  const button = byId("chrome-toggle");
  if (!button) return;
  const label = document.body.classList.contains("chrome-hidden") ? "แสดงแถบเครื่องมือ" : "ซ่อนแถบเครื่องมือ";
  button.setAttribute("aria-label", label);
  button.title = label;
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

/* อ่านอย่างเดียว: ไม่ให้ pinch zoom หรือดับเบิลแตะแล้วหน้าซูม
   (Safari ไม่สนใจ user-scalable=no จึงต้องกัน gesture เอง) */
(function installZoomGuards() {
  const block = (event) => { if (event.cancelable) event.preventDefault(); };
  for (const name of ["gesturestart", "gesturechange", "gestureend"]) {
    document.addEventListener(name, block, { passive: false });
  }
  document.addEventListener("touchmove", (event) => {
    if (event.touches.length > 1) block(event);
  }, { passive: false });
  document.addEventListener("dblclick", block, { passive: false });
})();

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
  const openedAt = performance.now();
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    if (sessionStorage.getItem("noat-sw-reloaded") === APP_VERSION) return;
    sessionStorage.setItem("noat-sw-reloaded", APP_VERSION);
    // An update that lands while the splash is still up would reload the page a
    // second time, so the app looked like it started twice. The new cache is
    // already stored; the next launch picks it up without a second splash.
    if (performance.now() - openedAt < 4000) return;
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
    .then(async () => {
      // แจ้งครั้งเดียวต่อเวอร์ชัน; ขึ้นทุกครั้งที่เปิดแอปจะกลายเป็นเสียงรบกวน
      const announced = await readSetting("offlineReadyVersion", "");
      if (announced === APP_VERSION) return;
      await writeSetting("offlineReadyVersion", APP_VERSION);
      showStatus("เตรียมไฟล์แอปสำหรับใช้ออฟไลน์แล้ว", 4500);
    })
    .catch(() => {});
}

async function initialize() {
  try {
    await dbReady;
    state.seasonalAuto = await readSetting("seasonalAuto", true) !== false;
    byId("seasonal-toggle").checked = state.seasonalAuto;
    applyLaunchStyle(await readSetting("launchStyle", "book"));
    const savedCustom = await readSetting("customTheme", null);
    if (savedCustom && typeof savedCustom === "object") state.customTheme = { ...CUSTOM_DEFAULT, ...savedCustom };
    const savedRezero = await readSetting("rezeroTheme", null);
    if (savedRezero && typeof savedRezero === "object") state.rezeroTheme = { ...REZERO_DEFAULT, ...savedRezero };
    applyTheme(await readSetting("theme", "auto"));
    buildHeaderSky();
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
    state.chapterView = (await readSetting("chapterView", "list")) === "grid" ? "grid" : "list";
    const storedColumns = Number(await readSetting("chapterColumns", 2));
    state.chapterColumns = CHAPTER_COLUMNS.includes(storedColumns) ? storedColumns : 2;
    applyChapterView();
    setPageTop(Number(await readSetting("pageTop", 0)) || 0);
    setFontFamily(await readSetting("fontFamily", "noto"));
    setTapSpeech(await readSetting("tapSpeech", true) !== false);
    setTapHint(await readSetting("tapHint", true) !== false);
    state.syncUrl = await readSetting("syncUrl", "");
    state.autoSync = await readSetting("autoSync", true) !== false;
    state.syncedAt = Number(await readSetting("syncedAt", 0)) || 0;
    byId("sync-url").value = state.syncUrl;
    byId("sync-toggle").checked = state.autoSync;
    paintSyncHint();
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
    if (state.theme === "rezero") await waitForCoverTiles();
    hideSplash();
    if (state.syncUrl && state.autoSync) void syncChapters();
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) startServiceWorker();
  } catch (error) { showStatus(`เปิดคลังไม่สำเร็จ: ${error.message}`, 0); hideSplash(); }
}

paintVersionLabels();
installCoverOpen();
initialize();
setTimeout(hideSplash, 4000);
