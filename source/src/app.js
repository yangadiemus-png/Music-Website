(() => {
  "use strict";
  // MODE: "claude" = hosted on claude.ai (in-page Edit tab saves the page itself)
  //       "static" = any static host such as EdgeOne Pages (Studio at #studio exports site.zip)
  const MODE = document.documentElement.getAttribute("data-mode") || "claude";

  /*__CONVERT__*/
  /*__ZIP__*/

  const INSTR = `/*__INSTR__*/`;

  // ===================== icons =====================
  const SVG = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
    repeat1: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/><text x="12" y="15" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-family="monospace">1</text></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };
  const G = '<span class="glyph"></span>';
  const editHash = MODE === "claude" ? "edit" : "studio";

  // ===================== shell =====================
  const SHELL = `
  <div class="bg-layer"></div>
  <canvas id="mesh" aria-hidden="true"></canvas>
  <header class="topbar">
    <a class="brand" href="#home"><span class="brand-mark">If?</span><span class="brand-sub" data-site-sub>ACG IN JAZZ</span></a>
    <span class="line"></span>
    <span class="handle" data-i18n="handle">ACG × Jazz Covers</span>
    <div class="themes" role="group" aria-label="Theme">
      <button data-theme-btn="gold" title="Gold 黑金"></button><button data-theme-btn="chrome" title="Silver 黑银"></button><button data-theme-btn="lightgold" title="Light gold 浅金"></button><button data-theme-btn="lightsilver" title="Light silver 浅银"></button><button data-theme-btn="custom" title="Custom 自定义"></button>
    </div>
    <div class="lang-toggle" data-lang-toggle><button data-lang="en">EN</button><button data-lang="zh">中</button></div>
    <button class="icon-btn" id="open-settings" aria-label="Settings" title="Settings 设置"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>
  </header>
  <nav class="rail left" aria-label="Main">
    <div class="mark">If?</div>
    <a class="vlink" data-nav="discover" href="#home" data-i18n="discover">Discover</a>
    <a class="vlink" data-nav="albums" href="#albums" data-i18n="albums">Albums</a>
    <a class="vlink" data-nav="liked" href="#liked" data-i18n="liked">Liked</a>
    <a class="vlink" data-nav="about" href="#about" data-i18n="about">About</a>
    <a class="vlink" data-nav="edit" href="#${editHash}" data-i18n="${MODE === "claude" ? "edit" : "studio"}">Edit</a>
  </nav>
  <aside class="rail right" aria-hidden="true">
    <span class="vtext">EST. 2026</span>
    <div class="scrollbar"><i id="scroll-ind"></i></div>
    <span class="vtext" data-i18n="railText">ACG × JAZZ — DEEP SPACE</span>
  </aside>
  <main class="main" id="view"></main>
  <nav class="mobile-nav">
    <a data-nav="discover" href="#home" data-i18n="discover">Discover</a>
    <a data-nav="albums" href="#albums" data-i18n="albums">Albums</a>
    <a data-nav="liked" href="#liked" data-i18n="liked">Liked</a>
    <a data-nav="about" href="#about" data-i18n="about">About</a>
    <a data-nav="edit" href="#${editHash}" data-i18n="${MODE === "claude" ? "edit" : "studio"}">Edit</a>
  </nav>
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="drawer" aria-hidden="true"></aside>
  <aside class="drawer settings-panel" id="settings" aria-hidden="true" aria-label="Settings"></aside>
  <section class="np" id="np" aria-hidden="true">
    <div class="np-bg" id="np-bg"></div>
    <button class="icon-btn np-close" id="np-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 9 6 6 6-6"/></svg></button>
    <div class="np-left">
      <div class="orbit-wrap" id="orbit-wrap"><div class="orbit o2"></div><div class="orbit o1"></div>
        <div class="vinyl" id="vinyl"><div class="label-art" id="vinyl-art"></div><div class="hole"></div></div></div>
      <div class="np-title" id="np-title"></div>
    </div>
    <div class="np-right">
      <div class="tabs"><button class="tab on" data-tab="lyrics" data-i18n="lyrics">Lyrics</button><button class="tab" data-tab="about" data-i18n="aboutTrack">About</button></div>
      <div class="np-pane" id="np-pane"></div>
    </div>
  </section>
  <div class="queue" id="queue"></div>
  <footer class="player" id="player">
    <div class="p-now" id="p-now">
      <div class="mini" id="p-cover"><div class="cover-ph">If?</div></div>
      <div class="meta"><div class="n" id="p-title">—</div><div class="o" id="p-sub"></div></div>
    </div>
    <div class="p-center">
      <div class="p-controls">
        <button class="icon-btn" id="p-shuffle" aria-label="Shuffle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 4h4v4M4 20 20 4M20 16v4h-4M15 15l5 5M4 4l5 5"/></svg></button>
        <button class="icon-btn" id="p-prev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg></button>
        <button class="icon-btn big" id="p-play" aria-label="Play">${SVG.play}</button>
        <button class="icon-btn" id="p-next" aria-label="Next"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg></button>
        <button class="icon-btn" id="p-repeat" aria-label="Repeat">${SVG.repeat}</button>
      </div>
      <div class="p-seek"><span id="p-cur">0:00</span><input type="range" id="p-bar" min="0" max="1000" value="0" aria-label="Seek"><span id="p-dur">0:00</span></div>
    </div>
    <div class="p-right">
      <canvas id="viz" width="220" height="60" aria-hidden="true"></canvas>
      <button class="icon-btn" id="p-like" aria-label="Like">${SVG.heart}</button>
      <button class="icon-btn" id="p-queue" aria-label="Queue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h12M4 12h12M4 18h8M18 14v6l4-3z"/></svg></button>
      <svg class="vol-ico" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" style="color:var(--muted)"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>
      <input type="range" class="vol" id="p-vol" min="0" max="100" value="85" aria-label="Volume">
    </div>
  </footer>
  <audio id="audio" preload="metadata"></audio>
  <div class="toast" id="toast"></div>
  <div id="dialog-root"></div>`;
  document.body.insertAdjacentHTML("afterbegin", SHELL);

  // Fonts load without blocking (if Google Fonts is unreachable, e.g. in mainland China, system fonts are used)
  try {
    const fl = document.createElement("link"); fl.rel = "stylesheet";
    fl.href = "https://fonts.googleapis.com/css2?family=Michroma&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";
    document.head.appendChild(fl);
  } catch {}

  // ===================== i18n =====================
  const I18N = {
    en: {
      discover: "Discover", albums: "Albums", liked: "Liked", about: "About", edit: "Edit", studio: "Studio", handle: "ACG × Jazz Covers", railText: "ACG × JAZZ — INTO THE VOID",
      lyrics: "Lyrics", aboutTrack: "About", idle: "Select a track to begin", settings: "Settings", sTheme: "Color theme", sCustom: "Your custom color", sCustomHint: "Pick any color for the Custom theme. Saved on this device.", sBase: "Background", dark: "Dark", light: "Light", sLang: "Language", sMotion: "Background motion", sMotionHint: "Moving wireframe, orbiting moons and spinning record", on: "On", off: "Off", sText: "Text size", standard: "Standard", large: "Large", sPlay: "Playback", sAutoNext: "Continue to the next track", sReset: "Reset to site defaults", sSaved: "Settings are saved on this device only.", tGold: "Black & gold", tChrome: "Black & silver", tLightgold: "Light gold", tLightsilver: "Light silver", tCustom: "Custom", siteColor: "Use the site\u2019s color", more: "More", tagged: "Tagged", noTagged: "No tracks with this tag yet.", allTags: "All tags", tags: "Tags",
      playAll: "Play all", play: "Play", pause: "Pause", latest: "Latest releases", allTracks: "All tracks", tracksCap: "Tracks",
      statement: "Anime, comic & game themes, re-voiced in jazz", inArchive: "albums in the archive", tracksLabel: "tracks reimagined", runtime: "Total runtime",
      tracks: "tracks", album: "Album", original: "Original", originalArtist: "Original artist", duration: "Duration", year: "Year", credits: "Credits",
      like: "Like", unlike: "Unlike", liked_toast: "Added to Liked", unliked_toast: "Removed from Liked",
      noAudio: "Audio for this track hasn't been uploaded yet", loadingAudio: "Loading song…", tapPlay: "Song ready — tap play", noLyrics: "No lyrics for this track.", noAbout: "No notes for this track yet.",
      back: "All albums", emptyAlbums: "No albums in the archive yet.", emptyLiked: "Nothing here yet — tap ♥ on any track to save it on this device.",
      queue: "Play queue", queueEmpty: "Queue is empty.", nowPlaying: "Now playing", explore: "Browse albums", likedSub: "Saved on this device",
      repeatAll: "Repeat: all", repeatOne: "Repeat: one", repeatOff: "Repeat: off", shuffleOn: "Shuffle on", shuffleOff: "Shuffle off",
      notFound: "Not found", ownerOnly: "Only the owner can edit this site.", archive: "Archive", selected: "Selected works",
    },
    zh: {
      discover: "发现", albums: "专辑", liked: "喜欢", about: "关于", edit: "编辑", studio: "工作室", handle: "ACG × 爵士翻奏", railText: "ACG × 爵士 — 向虚空漂流",
      lyrics: "歌词", aboutTrack: "关于", idle: "选择一首曲目开始播放", settings: "设置", sTheme: "配色", sCustom: "我的自定义颜色", sCustomHint: "任选一种颜色作为「自定义」配色，只保存在本设备上。", sBase: "背景", dark: "深色", light: "浅色", sLang: "语言", sMotion: "背景动效", sMotionHint: "流动的线框、环绕的卫星和旋转的唱片", on: "开", off: "关", sText: "文字大小", standard: "标准", large: "大", sPlay: "播放", sAutoNext: "自动播放下一首", sReset: "恢复网站默认设置", sSaved: "设置只保存在本设备上。", tGold: "黑金", tChrome: "黑银", tLightgold: "浅金", tLightsilver: "浅银", tCustom: "自定义", siteColor: "使用网站默认颜色", more: "更多", tagged: "标签", noTagged: "还没有带这个标签的曲目。", allTags: "全部标签", tags: "标签",
      playAll: "播放全部", play: "播放", pause: "暂停", latest: "最新发布", allTracks: "全部曲目", tracksCap: "曲目",
      statement: "把动画、漫画与游戏的旋律，重写成爵士", inArchive: "张专辑收录", tracksLabel: "首曲目重新编排", runtime: "总时长",
      tracks: "首", album: "专辑", original: "原曲", originalArtist: "原唱 / 原作者", duration: "时长", year: "年份", credits: "制作人员",
      like: "喜欢", unlike: "取消喜欢", liked_toast: "已加入喜欢", unliked_toast: "已从喜欢中移除",
      noAudio: "这首曲目的音频还没有上传", loadingAudio: "正在加载歌曲…", tapPlay: "歌曲已就绪，请点击播放", noLyrics: "这首曲目暂无歌词。", noAbout: "这首曲目暂无介绍。",
      back: "全部专辑", emptyAlbums: "档案库里还没有专辑。", emptyLiked: "这里还是空的——点击任意曲目的 ♥ 即可保存在本设备上。",
      queue: "播放队列", queueEmpty: "队列为空。", nowPlaying: "正在播放", explore: "浏览专辑", likedSub: "保存在本设备上",
      repeatAll: "循环：全部", repeatOne: "循环：单曲", repeatOff: "循环：关闭", shuffleOn: "随机播放：开", shuffleOff: "随机播放：关",
      notFound: "未找到", ownerOnly: "只有站长可以编辑本站。", archive: "档案", selected: "精选作品",
    },
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem("ifjazz." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("ifjazz." + k, JSON.stringify(v)); } catch {} },
  };
  let lang = store.get("lang", (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en");
  const T = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
  const L = (v) => { if (v == null) return ""; if (typeof v === "string") return v; const o = lang === "en" ? "zh" : "en"; return (v[lang] || "").trim() ? v[lang] : (v[o] || ""); };
  const LA = (v) => (v && ((v.en || "").trim() || (v.zh || "").trim())) || "";

  // ===================== helpers =====================
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const prose = (s) => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (sec) => { if (!isFinite(sec) || sec <= 0) return "--:--"; sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`; };
  const initials = (s) => (s || "If?").replace(/[^\p{L}\p{N}?]/gu, "").slice(0, 3) || "If?";
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);
  const setHash = (h) => { try { history.replaceState(null, "", h ? "#" + h : location.pathname + location.search); } catch {} };
  // file reference -> playable URL
  const localFiles = new Map(); // static/studio: path -> { blob, url }
  const blobUrl = (ref) => {
    if (!ref) return "";
    if (window.__IFJ_BLOB) return window.__IFJ_BLOB(ref);
    if (MODE === "claude") return "/_blob/" + encodeURIComponent(ref);
    const lf = localFiles.get(ref); return lf ? lf.url : ref;
  };
  let toastTimer;
  function toast(msg, ms = 2400) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), ms); }
  function dialog(msg, { ok = "OK", cancel = "Cancel", danger = false } = {}) {
    return new Promise((resolve) => {
      const root = $("#dialog-root");
      root.innerHTML = `<div class="modal-back"><div class="modal"><div class="label">// ${lang === "zh" ? "确认" : "Confirm"}</div><p class="dlg-msg">${esc(msg)}</p>
        <div class="actions">${cancel ? `<button class="btn" data-x>${esc(cancel)}</button>` : ""}<button class="btn ${danger ? "danger" : "primary"}" data-ok>${esc(ok)}</button></div></div></div>`;
      const done = (v) => { root.innerHTML = ""; resolve(v); };
      $("[data-ok]", root).onclick = () => done(true);
      const x = $("[data-x]", root); if (x) x.onclick = () => done(false);
    });
  }

  // ===================== data =====================
  // ---- tags: three quick-jump categories + any custom tags ----
  const CATS = [{ key: "band", label: "Band" }, { key: "anime", label: "Anime" }, { key: "games", label: "Games" }];
  const catOf = (t) => CATS.find((c) => c.key === String(t).toLowerCase());
  function cleanTags(v) {
    const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,，、]/) : [];
    const out = [];
    arr.map((x) => String(x).trim()).filter(Boolean).forEach((x) => { const c = catOf(x); const k = c ? c.key : x; if (!out.some((y) => y.toLowerCase() === k.toLowerCase())) out.push(k); });
    return out;
  }
  const tagLabel = (t) => { const c = catOf(t); return c ? c.label : t; };
  const tagHash = (t) => "tag-" + encodeURIComponent(String(t).toLowerCase());
  const hasTag = (track, tag) => (track.tags || []).some((x) => x.toLowerCase() === String(tag).toLowerCase());
  const tagChips = (track) => (track.tags || []).length ? `<span class="tagchips">${track.tags.map((g) => `<a class="tagchip" href="#${tagHash(g)}">${esc(tagLabel(g))}</a>`).join("")}</span>` : "";
  const THEMES = ["gold", "chrome", "lightgold", "lightsilver", "custom"];
  function normalize(d) {
    d = d || {};
    const s = (d.site = d.site || {});
    s.title = s.title || "If? ACG in Jazz";
    if (s.theme === "purple") { s.theme = "custom"; s.custom = s.custom || { accent: "#a855f7", base: "dark" }; }
    s.theme = THEMES.includes(s.theme) ? s.theme : "gold";
    s.custom = { accent: /^#[0-9a-f]{6}$/i.test((s.custom || {}).accent || "") ? s.custom.accent : "#a855f7", base: (s.custom || {}).base === "light" ? "light" : "dark" };
    ["tagline", "about", "disclaimer", "statement"].forEach((k) => { if (!s[k] || typeof s[k] !== "object") s[k] = { en: s[k] || "", zh: "" }; });
    s.links = Array.isArray(s.links) ? s.links : [];
    const bi = (v) => (v && typeof v === "object" ? { en: v.en || "", zh: v.zh || "" } : { en: v || "", zh: "" });
    d.albums = (d.albums || []).map((a) => ({
      id: a.id || uid(), title: bi(a.title), artist: a.artist || "", year: a.year || "", cover: a.cover || "", description: bi(a.description),
      tracks: (a.tracks || []).map((t) => ({
        id: t.id || uid(), title: bi(t.title), original: bi(t.original), originalArtist: t.originalArtist || "",
        duration: t.duration || 0, audio: t.audio || "", audioName: t.audioName || "", about: bi(t.about), credits: bi(t.credits), lyrics: t.lyrics || "",
        tags: cleanTags(t.tags),
      })),
    }));
    return d;
  }
  let LIB;
  try { LIB = normalize(JSON.parse($("#library").textContent)); } catch { LIB = normalize({}); }
  let DATA = LIB;
  const findAlbum = (id) => DATA.albums.find((a) => a.id === id);
  const findTrack = (aid, tid) => { const a = findAlbum(aid); return a && a.tracks.find((t) => t.id === tid); };
  const albumOfTrack = (tid) => DATA.albums.find((a) => a.tracks.some((t) => t.id === tid));
  const keyOf = (aid, tid) => `${aid}/${tid}`;
  const allRefs = () => DATA.albums.flatMap((a) => a.tracks.map((t) => ({ aid: a.id, tid: t.id })));
  function coverHTML(album, extra = "") {
    if (album && album.cover) return `<img class="cover ${extra}" src="${esc(blobUrl(album.cover))}" alt="" loading="lazy">`;
    return `<div class="cover-ph ${extra}">${esc(initials(L(album && album.title)))}</div>`;
  }

  // ===================== theme =====================
  let theme = store.get("theme", null) || LIB.site.theme;
  if (theme === "purple") theme = "custom";
  const CUSTOM_PROPS = ["--accent", "--accent-2", "--accent-3", "--on-accent", "--m1", "--m2", "--m3", "--line", "--line-strong", "--glow"];
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
  function customVars(c) {
    const A = hexRgb(c.accent), W = [255, 255, 255], K = [0, 0, 0], light = c.base === "light";
    const lum = (0.2126 * A[0] + 0.7152 * A[1] + 0.0722 * A[2]) / 255;
    const acc = light && lum > 0.62 ? mix(A, K, 0.35) : c.accent;          // keep contrast on a light page
    const AA = hexRgb(acc), rgb = AA.join(",");
    return { "--accent": acc, "--accent-2": light ? mix(AA, K, 0.35) : mix(AA, W, 0.4), "--accent-3": light ? mix(AA, W, 0.45) : mix(AA, K, 0.45),
      "--on-accent": ((0.2126 * AA[0] + 0.7152 * AA[1] + 0.0722 * AA[2]) / 255) > 0.55 ? "#111111" : "#ffffff",
      "--m1": mix(A, W, 0.86), "--m2": c.accent, "--m3": mix(A, K, 0.8),
      "--line": `rgba(${rgb},${light ? 0.22 : 0.16})`, "--line-strong": `rgba(${rgb},${light ? 0.5 : 0.42})`, "--glow": `rgba(${rgb},0.35)` };
  }
  function applyTheme(t) {
    theme = THEMES.includes(t) ? t : "gold";
    const root = document.documentElement, c = store.get("custom", null) || (DATA.site && DATA.site.custom) || LIB.site.custom;
    root.setAttribute("data-theme", theme);
    const light = theme === "lightgold" || theme === "lightsilver" || (theme === "custom" && c.base === "light");
    root.setAttribute("data-base", light ? "light" : "dark");
    CUSTOM_PROPS.forEach((p) => root.style.removeProperty(p));
    if (theme === "custom") Object.entries(customVars(c)).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.setProperty("--custom-dot", c.base === "light" ? `radial-gradient(circle, ${c.accent} 0 38%, #f4f3f0 40%)` : c.accent);
    $$("[data-theme-btn]").forEach((b) => b.classList.toggle("on", b.dataset.themeBtn === theme));
    const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute("content", light ? "#f4f2ee" : "#050505");
    if (typeof Mesh !== "undefined" && Mesh && Mesh.recolor) Mesh.recolor();
  }
  $$("[data-theme-btn]").forEach((b) => b.addEventListener("click", () => { store.set("theme", b.dataset.themeBtn); applyTheme(b.dataset.themeBtn); }));

  // ===================== liked =====================
  let liked = new Set(store.get("liked", []));
  function toggleLike(aid, tid) {
    const k = keyOf(aid, tid);
    if (liked.has(k)) { liked.delete(k); toast(T("unliked_toast")); } else { liked.add(k); toast(T("liked_toast")); }
    store.set("liked", [...liked]); syncLikeButtons(); if (route.name === "liked") render();
  }
  function syncLikeButtons() {
    $$("[data-like]").forEach((b) => { const on = liked.has(b.dataset.like); b.classList.toggle("active", on); b.innerHTML = on ? SVG.heartFill : SVG.heart; b.setAttribute("aria-label", on ? T("unlike") : T("like")); });
    const cur = Player.current(); const pl = $("#p-like"); const on = cur && liked.has(keyOf(cur.aid, cur.tid));
    pl.classList.toggle("active", !!on); pl.innerHTML = on ? SVG.heartFill : SVG.heart;
  }

  // ===================== track table =====================
  function trackRow(aid, t, i, opts = {}) {
    const a = findAlbum(aid); const k = keyOf(aid, t.id);
    const sub = [L(t.original), t.originalArtist].filter(Boolean).join(" · ");
    return `<div class="track-row" data-ref="${esc(k)}" tabindex="0">
        <div class="no">${pad(i + 1)}</div>
        <div class="ti"><div class="n">${esc(L(t.title))}</div>${sub || (t.tags || []).length ? `<div class="o">${esc(sub)}${tagChips(t)}</div>` : ""}</div>
        ${opts.showAlbum ? `<div class="alb">${esc(L(a.title))}</div>` : "<div></div>"}
        <div class="dur">${fmt(t.duration)}</div>
        <div style="display:flex;align-items:center;padding-right:6px">
          <button class="icon-btn" data-like="${esc(k)}" aria-label="${T("like")}">${SVG.heart}</button>
          <button class="icon-btn" data-play="${esc(k)}" aria-label="${T("play")}">${SVG.play}</button>
        </div></div>`;
  }
  const trackList = (refs, opts) => `<div class="tracks">${refs.map((r, i) => trackRow(r.aid, findTrack(r.aid, r.tid), i, opts)).join("")}</div>`;
  function bindTrackList(root, refs) {
    $$(".track-row[data-ref]", root).forEach((row) => {
      const [aid, tid] = row.dataset.ref.split("/");
      row.addEventListener("click", (e) => {
        if (e.target.closest("[data-play]")) {
          const cur = Player.current();
          if (cur && cur.aid === aid && cur.tid === tid) Player.toggle();
          else Player.playList(refs, refs.findIndex((r) => r.aid === aid && r.tid === tid));
          return;
        }
        if (e.target.closest("[data-like]")) { toggleLike(aid, tid); return; }
        if (e.target.closest(".tagchip")) return;
        openDrawer(aid, tid, refs);
      });
      row.addEventListener("keydown", (e) => { if (e.key === "Enter") openDrawer(aid, tid, refs); });
    });
    markPlaying(); syncLikeButtons();
  }
  function markPlaying() {
    const cur = Player.current(); const k = cur ? keyOf(cur.aid, cur.tid) : "";
    $$(".track-row[data-ref]").forEach((r) => {
      const on = r.dataset.ref === k;
      r.classList.toggle("playing", on); r.classList.toggle("paused", on && !Player.isPlaying());
      const no = $(".no", r); if (!no.dataset.n) no.dataset.n = no.textContent;
      no.innerHTML = on ? '<span class="eq"><i></i><i></i><i></i></span>' : no.dataset.n;
      const pb = $("[data-play]", r); if (pb) pb.innerHTML = on && Player.isPlaying() ? SVG.pause : SVG.play;
    });
  }

  // ===================== routing & views =====================
  const view = $("#view");
  let route = { name: "discover" };
  function parseRoute() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!h || h === "home") return { name: "discover" };
    if (["albums", "liked", "about"].includes(h)) return { name: h };
    if (h === "edit" || h === "studio") return { name: "edit" };
    if (h.startsWith("album-")) return { name: "album", aid: h.slice(6) };
    if (h.startsWith("tag-")) return { name: "tag", tag: h.slice(4) };
    if (h.startsWith("song-")) { const tid = h.slice(5); const a = albumOfTrack(tid); return a ? { name: "album", aid: a.id, tid } : { name: "discover" }; }
    return { name: "discover" };
  }
  const microrow = () => {
    const curTag = route.name === "tag" ? String(route.tag).toLowerCase() : "";
    return `<div class="microrow">${CATS.map((c) => `<a class="micro" href="#${tagHash(c.key)}" ${curTag === c.key ? 'style="color:var(--accent)"' : ""}>${c.label}</a>`).join("")}
      <a class="micro" href="#about">${T("more")}</a></div>`;
  };

  function albumCard(a, i) {
    return `<a class="album-card" href="#album-${encodeURIComponent(a.id)}">
        <div class="cover-wrap">${coverHTML(a)}<button class="icon-btn big play-fab" data-play-album="${esc(a.id)}" aria-label="${T("playAll")}">${SVG.play}</button></div>
        <div class="meta"><span class="micro">No. ${pad(i + 1)}</span><span class="micro dim">${esc(a.year || "----")} · ${a.tracks.length} ${lang === "zh" ? "首" : "TRK"}</span></div>
        <div class="t">${esc(L(a.title))}</div>${a.artist ? `<div class="s">${esc(a.artist)}</div>` : ""}</a>`;
  }
  function bindAlbumCards(root) {
    $$("[data-play-album]", root).forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const a = findAlbum(b.dataset.playAlbum); Player.playList(a.tracks.map((t) => ({ aid: a.id, tid: t.id })), 0);
    }));
  }

  function renderDiscover() {
    const s = DATA.site; const refs = allRefs();
    const total = DATA.albums.reduce((acc, a) => acc + a.tracks.reduce((x, t) => x + (t.duration || 0), 0), 0);
    const titleHTML = esc(s.title).replace(/^If\?/, '<span class="q">If?</span>');
    const statement = L(s.statement) || T("statement");
    view.innerHTML = `
      <section class="block hero">
        ${microrow()}
        <div class="art">${INSTR}</div>
        <div class="rule">${G}${G}</div>
        <h1>${titleHTML}</h1>
        <p class="tag">${esc(L(s.tagline))}</p>
        <div class="acts">
          <button class="btn primary" id="hero-play" ${refs.length ? "" : "disabled"}>${SVG.play} ${T("playAll")}</button>
          <a class="btn" href="#albums">${T("explore")} ${SVG.arrow}</a>
        </div>
      </section>
      <section class="block split">
        <div class="statement">
          ${microrow()}
          <span class="circle"></span>
          <h2>${esc(statement)}</h2>
          <div class="foot"><div class="rule">${G}</div><p>${esc((L(s.about) || "").slice(0, 220))}${(L(s.about) || "").length > 220 ? "…" : ""}</p></div>
        </div>
        <div class="cols">
          <div class="col g1">
            <div class="stat"><div class="big">${pad(DATA.albums.length)}</div><div class="rule">${G}</div><p>${T("inArchive")}</p></div>
            <div class="frame"><span class="label">${T("runtime")}</span><div class="big accent" style="font-size:clamp(26px,3vw,40px)">${fmt(total)}</div></div>
          </div>
          <div class="col g2">
            <div class="rule">${G}</div>
            <div class="stat"><div class="big">${pad(refs.length)}</div><div class="rule">${G}</div><p>${T("tracksLabel")}</p></div>
          </div>
        </div>
      </section>
      ${DATA.albums.length ? `<div class="sect"><h2><span class="idx">01</span>${T("latest")}</h2><a class="btn ghost" href="#albums">${T("albums")} ${SVG.arrow}</a></div>
      <div class="album-grid">${DATA.albums.slice(0, 4).map(albumCard).join("")}</div>` : ""}
      <section class="block ttable" style="margin-top:26px">
        <div class="lead"><span class="micro">03 <span class="dim">· ${T("tracksCap")}</span></span><h2>${T("allTracks")}</h2>
          ${refs.length ? `<div><button class="btn primary" id="all-play">${SVG.play} ${T("playAll")}</button></div>` : ""}</div>
        <div class="rows">${refs.length ? trackList(refs, { showAlbum: true }) : `<div class="empty">${T("emptyAlbums")}</div>`}</div>
      </section>`;
    const hp = $("#hero-play"); if (hp) hp.onclick = () => Player.playList(refs, 0);
    const ap = $("#all-play"); if (ap) ap.onclick = () => Player.playList(refs, 0);
    bindAlbumCards(view); bindTrackList(view, refs);
  }
  function renderAlbums() {
    view.innerHTML = `<section class="block block-pad">${microrow()}
        <div class="sect" style="margin:40px 0 0"><h2><span class="idx">//</span>${T("archive")}</h2><span class="micro dim">${DATA.albums.length} ${lang === "zh" ? "张" : "albums"}</span></div></section>
      ${DATA.albums.length ? `<div class="album-grid">${DATA.albums.map(albumCard).join("")}</div>` : `<div class="block empty">${T("emptyAlbums")}</div>`}`;
    bindAlbumCards(view);
  }
  function renderAlbum(aid) {
    const a = findAlbum(aid);
    if (!a) { view.innerHTML = `<div class="block empty">${T("notFound")}</div>`; return; }
    const i = DATA.albums.indexOf(a);
    const refs = a.tracks.map((t) => ({ aid: a.id, tid: t.id }));
    const total = a.tracks.reduce((x, t) => x + (t.duration || 0), 0);
    view.innerHTML = `
      <a class="back-link" href="#albums">${SVG.back} ${T("back")}</a>
      <section class="block block-pad">${microrow()}
        <div class="album-head" style="margin-top:26px">${coverHTML(a)}
          <div>
            <div class="micro">No. ${pad(i + 1)} <span class="dim">· ${esc(a.year || "----")} · ${a.tracks.length} ${T("tracks")} · ${fmt(total)}</span></div>
            <h1>${esc(L(a.title))}</h1>
            ${a.artist ? `<div class="muted" style="font-weight:600;letter-spacing:.04em">${esc(a.artist)}</div>` : ""}
            ${L(a.description) ? `<p class="desc">${prose(L(a.description))}</p>` : ""}
            <div class="rule" style="margin:18px 0">${G}${G}</div>
            <button class="btn primary" id="alb-play" ${refs.length ? "" : "disabled"}>${SVG.play} ${T("playAll")}</button>
          </div>
        </div>
      </section>
      <section class="block block-pad">${refs.length ? trackList(refs) : `<div class="empty">—</div>`}</section>`;
    $("#alb-play").onclick = () => Player.playList(refs, 0);
    bindTrackList(view, refs);
  }
  function renderLiked() {
    const refs = [...liked].map((k) => { const [aid, tid] = k.split("/"); return { aid, tid }; }).filter((r) => findTrack(r.aid, r.tid));
    view.innerHTML = `<section class="block ttable">
        <div class="lead"><span class="micro">♥ <span class="dim">· ${T("liked")}</span></span><h2>♥ ${T("liked")}</h2><span class="micro dim">${T("likedSub")}</span>
          ${refs.length ? `<div><button class="btn primary" id="liked-play">${SVG.play} ${T("playAll")}</button></div>` : ""}</div>
        <div class="rows">${refs.length ? trackList(refs, { showAlbum: true }) : `<div class="empty">${T("emptyLiked")}</div>`}</div></section>`;
    const lp = $("#liked-play"); if (lp) lp.onclick = () => Player.playList(refs, 0);
    bindTrackList(view, refs);
  }
  function renderTag(tag) {
    const refs = DATA.albums.flatMap((a) => a.tracks.filter((t) => hasTag(t, tag)).map((t) => ({ aid: a.id, tid: t.id })));
    const all = new Map();
    DATA.albums.forEach((a) => a.tracks.forEach((t) => (t.tags || []).forEach((g) => { const k = g.toLowerCase(); all.set(k, { g, n: ((all.get(k) || {}).n || 0) + 1 }); })));
    CATS.forEach((c) => { if (!all.has(c.key)) all.set(c.key, { g: c.key, n: 0 }); });
    const cloud = [...all.values()].sort((x, y) => (catOf(y.g) ? 1 : 0) - (catOf(x.g) ? 1 : 0) || y.n - x.n)
      .map(({ g, n }) => `<a class="tagchip big ${g.toLowerCase() === String(tag).toLowerCase() ? "on" : ""}" href="#${tagHash(g)}">${esc(tagLabel(g))} <span class="dim">${n}</span></a>`).join("");
    view.innerHTML = `<section class="block ttable">
        <div class="lead">${microrow()}<span class="micro">${T("tagged")} <span class="dim">· ${refs.length} ${T("tracks")}</span></span>
          <h2>${esc(tagLabel(tag))}</h2>
          ${refs.length ? `<div><button class="btn primary" id="tag-play">${SVG.play} ${T("playAll")}</button></div>` : ""}
          <div><div class="micro dim" style="margin-bottom:10px">${T("allTags")}</div><div class="tagcloud">${cloud}</div></div></div>
        <div class="rows">${refs.length ? trackList(refs, { showAlbum: true }) : `<div class="empty">${T("noTagged")}</div>`}</div></section>`;
    const tp = $("#tag-play"); if (tp) tp.onclick = () => Player.playList(refs, 0);
    bindTrackList(view, refs);
  }
  function renderAbout() {
    const s = DATA.site; const links = s.links.filter((l) => l && /^https?:\/\//.test(l.url || ""));
    view.innerHTML = `<section class="block block-pad about-page">${microrow()}
        <h1>${esc(s.title)}</h1><div class="rule" style="margin-bottom:22px">${G}${G}</div>
        <div class="prose">${prose(L(s.about))}</div>
        ${links.length ? `<div class="links">${links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || l.url)} ${SVG.arrow}</a>`).join("")}</div>` : ""}
        ${L(s.disclaimer) ? `<div class="disclaimer">${prose(L(s.disclaimer))}</div>` : ""}</section>`;
  }

  function render() {
    route = parseRoute();
    if (route.name !== "edit") DATA = LIB;
    $$("[data-nav]").forEach((n) => n.classList.toggle("active", n.dataset.nav === route.name || (route.name === "album" && n.dataset.nav === "albums")));
    if (route.name === "edit") { Editor.render(); return; }
    if (route.name === "discover") renderDiscover();
    else if (route.name === "albums") renderAlbums();
    else if (route.name === "album") renderAlbum(route.aid);
    else if (route.name === "liked") renderLiked();
    else if (route.name === "about") renderAbout();
    else if (route.name === "tag") renderTag(route.tag);
    if (route.name === "album" && route.tid && findTrack(route.aid, route.tid)) openDrawer(route.aid, route.tid, null, true);
    else closeDrawer(true);
    applySiteTitle();
    Settings.applyPrefs();
    window.scrollTo(0, 0);
  }
  function applySiteTitle() {
    const t = LIB.site.title || "If? ACG in Jazz";
    const sub = t.replace(/^If\?\s*/, "").toUpperCase() || "ACG IN JAZZ";
    $$("[data-site-sub]").forEach((e) => (e.textContent = sub));
    if (!Player.current()) document.title = t;
  }
  addEventListener("scroll", () => {
    const i = $("#scroll-ind"); if (!i) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    i.style.top = (max > 0 ? (scrollY / max) * 82 : 0) + "%";
  }, { passive: true });

  // ===================== drawer =====================
  let drawerRef = null;
  function openDrawer(aid, tid, refs, fromRoute) {
    drawerRef = { aid, tid, refs };
    const a = findAlbum(aid), t = findTrack(aid, tid), idx = a.tracks.indexOf(t), k = keyOf(aid, tid);
    const cur = Player.current(); const isCur = cur && cur.aid === aid && cur.tid === tid && Player.isPlaying();
    const d = $("#drawer");
    d.innerHTML = `
      <button class="icon-btn close" data-close aria-label="Close">${SVG.close}</button>
      <div class="micro">${T("tracksCap")} ${pad(idx + 1)} <span class="dim">· ${esc(L(a.title))}</span></div>
      <h2>${esc(L(t.title))}</h2>
      ${L(t.original) ? `<div class="muted">${T("original")}: ${esc(L(t.original))}</div>` : ""}
      ${coverHTML(a)}
      <div class="drawer-actions">
        <button class="btn primary" data-dplay>${isCur ? SVG.pause + " " + T("pause") : SVG.play + " " + T("play")}</button>
        <button class="icon-btn" data-like="${esc(k)}">${SVG.heart}</button>
      </div>
      <dl class="kv">
        ${L(t.original) ? `<dt>${T("original")}</dt><dd>${esc(L(t.original))}</dd>` : ""}
        ${t.originalArtist ? `<dt>${T("originalArtist")}</dt><dd>${esc(t.originalArtist)}</dd>` : ""}
        <dt>${T("album")}</dt><dd><a href="#album-${encodeURIComponent(a.id)}">${esc(L(a.title))}</a></dd>
        <dt>${T("duration")}</dt><dd class="mono">${fmt(t.duration)}</dd>
        ${a.year ? `<dt>${T("year")}</dt><dd class="mono">${esc(a.year)}</dd>` : ""}
        ${(t.tags || []).length ? `<dt>${T("tags")}</dt><dd>${tagChips(t)}</dd>` : ""}
      </dl>
      <div class="blockline"><div class="label">// ${T("aboutTrack")}</div>
        <div class="prose">${L(t.about) ? prose(L(t.about)) : `<span class="dim">${T("noAbout")}</span>`}</div></div>
      ${L(t.credits) ? `<div class="blockline"><div class="label">// ${T("credits")}</div><div class="prose">${prose(L(t.credits))}</div></div>` : ""}`;
    d.classList.add("open"); d.setAttribute("aria-hidden", "false"); $("#scrim").classList.add("open");
    $("[data-close]", d).onclick = () => closeDrawer();
    $("[data-dplay]", d).onclick = () => {
      const c = Player.current();
      if (c && c.aid === aid && c.tid === tid) return Player.toggle();
      const list = refs || a.tracks.map((x) => ({ aid, tid: x.id }));
      Player.playList(list, Math.max(0, list.findIndex((r) => r.aid === aid && r.tid === tid)));
    };
    $("[data-like]", d).onclick = () => toggleLike(aid, tid);
    $$(".tagchip", d).forEach((c) => c.addEventListener("click", () => closeDrawer(true)));
    syncLikeButtons();
    if (!fromRoute && route.name === "album") setHash("song-" + tid);
  }
  function closeDrawer(silent) {
    drawerRef = null;
    const d = $("#drawer"); d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); $("#scrim").classList.remove("open");
    if (!silent && route.name === "album") setHash("album-" + route.aid);
  }
  $("#scrim").addEventListener("click", () => { closeDrawer(); Settings.close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDrawer(); Settings.close(); NP.close(); $("#queue").classList.remove("open"); }
    if (e.key === " " && !/INPUT|TEXTAREA|BUTTON|A|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); Player.toggle(); }
  });

  // ===================== lyrics / now playing =====================
  function parseLyrics(src) {
    if (!src || !src.trim()) return null;
    const lines = []; const re = /\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g; let timed = false;
    src.split(/\r?\n/).forEach((raw) => {
      const stamps = [...raw.matchAll(re)]; const text = raw.replace(re, "").trim();
      if (stamps.length) { timed = true; stamps.forEach((m) => lines.push({ t: parseInt(m[1], 10) * 60 + parseFloat(m[2].replace(":", ".")), text })); }
    });
    if (timed) return { timed: true, lines: lines.filter((l) => l.text).sort((a, b) => a.t - b.t) };
    return { timed: false, text: src };
  }
  const NP = {
    tab: "lyrics", lyr: null, lastIdx: -1,
    open() { if (!Player.current()) return; document.documentElement.classList.add("np-open"); $("#np").classList.add("open"); $("#np").setAttribute("aria-hidden", "false"); this.render(); },
    close() { document.documentElement.classList.remove("np-open"); const n = $("#np"); if (!n) return; n.classList.remove("open"); n.setAttribute("aria-hidden", "true"); },
    isOpen() { const n = $("#np"); return !!n && n.classList.contains("open"); },
    render() {
      const cur = Player.current(); if (!cur) return;
      const a = Player.album(cur), t = Player.track(cur); if (!a || !t) return;
      $("#np-bg").style.backgroundImage = a.cover ? `url("${blobUrl(a.cover)}")` : "none";
      $("#vinyl-art").innerHTML = a.cover ? `<img src="${esc(blobUrl(a.cover))}" alt="">` : `<div class="cover-ph">${esc(initials(L(a.title)))}</div>`;
      $("#np-title").innerHTML = `<div class="micro">${T("nowPlaying")} <span class="dim">· ${esc(L(a.title))}</span></div>
        <h2>${esc(L(t.title))}</h2><div class="o">${esc([L(t.original), t.originalArtist].filter(Boolean).join(" · "))}</div>`;
      $$(".tab", $("#np")).forEach((b) => b.classList.toggle("on", b.dataset.tab === this.tab));
      const pane = $("#np-pane"); this.lastIdx = -1;
      if (this.tab === "lyrics") {
        this.lyr = parseLyrics(t.lyrics);
        if (!this.lyr) pane.innerHTML = `<div class="lyrics plain"><p class="dim">${T("noLyrics")}</p></div>`;
        else if (this.lyr.timed) {
          pane.innerHTML = `<div class="lyrics">${this.lyr.lines.map((l, i) => `<p data-i="${i}">${esc(l.text)}</p>`).join("")}</div>`;
          $$(".lyrics p", pane).forEach((p) => p.addEventListener("click", () => Player.seek(this.lyr.lines[+p.dataset.i].t)));
          this.sync(true);
        } else pane.innerHTML = `<div class="lyrics plain"><p>${esc(this.lyr.text)}</p></div>`;
      } else {
        this.lyr = null;
        pane.innerHTML = `<div class="prose">${L(t.about) ? prose(L(t.about)) : `<span class="dim">${T("noAbout")}</span>`}</div>
          <dl class="kv">${L(t.original) ? `<dt>${T("original")}</dt><dd>${esc(L(t.original))}</dd>` : ""}${t.originalArtist ? `<dt>${T("originalArtist")}</dt><dd>${esc(t.originalArtist)}</dd>` : ""}</dl>
          ${L(t.credits) ? `<div class="blockline"><div class="label">// ${T("credits")}</div><div class="prose">${prose(L(t.credits))}</div></div>` : ""}`;
      }
      $("#vinyl").classList.toggle("spinning", Player.isPlaying());
    },
    sync(force) {
      if (!this.isOpen() || !this.lyr || !this.lyr.timed) return;
      const time = Player.audio.currentTime + 0.15; let idx = -1;
      for (let i = 0; i < this.lyr.lines.length; i++) { if (this.lyr.lines[i].t <= time) idx = i; else break; }
      if (idx === this.lastIdx && !force) return;
      this.lastIdx = idx;
      const ps = $$("#np-pane .lyrics p"); ps.forEach((p, i) => p.classList.toggle("on", i === idx));
      const el = ps[Math.max(idx, 0)];
      if (el) { const pane = $("#np-pane"); pane.scrollTo({ top: el.offsetTop - pane.clientHeight / 2 + el.clientHeight / 2, behavior: force ? "auto" : "smooth" }); }
    },
  };
  $("#np-close").onclick = () => NP.close();
  $("#p-now").onclick = () => (NP.isOpen() ? NP.close() : NP.open());
  $$("#np .tab").forEach((b) => b.addEventListener("click", () => { NP.tab = b.dataset.tab; NP.render(); }));

  // ===================== player =====================
  // Fallback for iPhone/iPad Safari: when the browser can't stream a hosted file directly,
  // download it with fetch() and play it from a local blob: URL instead.
  const MediaFB = {
    cache: new Map(), busy: null,
    remember(ref, url) { this.cache.set(ref, url); while (this.cache.size > 4) { const k = this.cache.keys().next().value; try { URL.revokeObjectURL(this.cache.get(k)); } catch {} this.cache.delete(k); } },
    async recover(A) {
      const ref = A.dataset.ref; if (!ref || A.dataset.fb || this.busy === ref) return false;
      this.busy = ref; A.dataset.fb = "1";
      toast(T("loadingAudio"), 8000);
      try {
        const r = await fetch(blobUrl(ref), { credentials: "include" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        let b = await r.blob();
        if (!b.type || b.type === "application/octet-stream") b = new Blob([b], { type: "audio/mp4" });
        const url = URL.createObjectURL(b); this.remember(ref, url);
        if (A.dataset.ref !== ref) return true; // user moved on
        A.src = url;
        try { await A.play(); toast(""); $("#toast").classList.remove("show"); } catch { toast(T("tapPlay"), 4000); }
        return true;
      } catch (e) { toast(T("noAudio")); return false; }
      finally { if (this.busy === ref) this.busy = null; }
    },
  };
  const Player = {
    audio: $("#audio"), list: [], order: [], pos: -1, source: null,
    shuffle: store.get("shuffle", false), repeat: store.get("repeat", "all"),
    current() { return this.pos >= 0 ? this.list[this.order[this.pos]] : null; },
    album(r) { return (this.source || DATA).albums.find((a) => a.id === r.aid); },
    track(r) { const a = this.album(r); return a && a.tracks.find((t) => t.id === r.tid); },
    isPlaying() { return !this.audio.paused && !this.audio.ended; },
    buildOrder(startIdx) {
      this.order = this.list.map((_, i) => i);
      if (this.shuffle) {
        for (let i = this.order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.order[i], this.order[j]] = [this.order[j], this.order[i]]; }
        const at = this.order.indexOf(startIdx); if (at > 0) { this.order.splice(at, 1); this.order.unshift(startIdx); }
        return 0;
      }
      return startIdx;
    },
    playList(refs, idx) { if (!refs.length) return; this.source = DATA; this.list = refs.slice(); this.pos = this.buildOrder(Math.max(0, idx)); this.load(true); },
    load(autoplay, dir = 1, tries = 0) {
      const cur = this.current(); if (!cur) return;
      const t = this.track(cur);
      if (!t || !t.audio) { toast(T("noAudio")); if (tries < this.list.length - 1) this.step(dir, autoplay, tries + 1); this.updateUI(); return; }
      this.audio.dataset.ref = t.audio; this.audio.dataset.fb = "";
      const cached = MediaFB.cache.get(t.audio);
      this.audio.src = cached || blobUrl(t.audio);
      if (cached) this.audio.dataset.fb = "1";
      if (autoplay) this.audio.play().catch(() => {});
      this.updateUI(); this.mediaSession(t);
    },
    step(dir, autoplay = true, tries = 0) {
      if (!this.list.length) return;
      let p = this.pos + dir;
      if (p >= this.order.length) { if (this.repeat === "off" && tries === 0) { this.audio.pause(); return; } p = 0; }
      if (p < 0) p = this.order.length - 1;
      this.pos = p; this.load(autoplay, dir, tries);
    },
    next() { this.step(1); },
    prev() { if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; } this.step(-1); },
    toggle() {
      if (!this.current()) { const r = allRefs(); if (r.length) this.playList(r, 0); return; }
      if (!this.audio.src) { this.load(true); return; }
      if (this.audio.paused) this.audio.play().catch(() => {}); else this.audio.pause();
    },
    seek(sec) { if (isFinite(sec)) { this.audio.currentTime = sec; if (this.audio.paused) this.audio.play().catch(() => {}); } },
    updateUI() {
      const cur = this.current(); const playing = this.isPlaying();
      $("#p-play").innerHTML = playing ? SVG.pause : SVG.play;
      $("#p-play").setAttribute("aria-label", playing ? T("pause") : T("play"));
      const a = cur && this.album(cur), t = cur && this.track(cur);
      if (a && t) { $("#p-cover").innerHTML = coverHTML(a); $("#p-title").textContent = L(t.title); $("#p-sub").textContent = L(t.original) || L(a.title); document.title = `${L(t.title)} — ${LIB.site.title}`; }
      else $("#p-sub").textContent = T("idle");
      $("#p-shuffle").classList.toggle("active", this.shuffle);
      $("#p-repeat").classList.toggle("active", this.repeat !== "off");
      $("#p-repeat").innerHTML = this.repeat === "one" ? SVG.repeat1 : SVG.repeat;
      $("#vinyl").classList.toggle("spinning", playing);
      $("#orbit-wrap").classList.toggle("live", playing);
      markPlaying(); syncLikeButtons(); renderQueue();
      if (drawerRef) {
        const btn = $("#drawer [data-dplay]"); const isCur = cur && cur.aid === drawerRef.aid && cur.tid === drawerRef.tid && playing;
        if (btn) btn.innerHTML = isCur ? SVG.pause + " " + T("pause") : SVG.play + " " + T("play");
      }
      if (NP.isOpen() && t) { const shown = $("#np-title h2"); if (shown && shown.textContent !== L(t.title)) NP.render(); }
    },
    mediaSession(t) {
      if (!("mediaSession" in navigator)) return;
      const a = this.album(this.current());
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: L(t.title), artist: a.artist || LIB.site.title, album: L(a.title),
          artwork: a.cover ? [{ src: new URL(blobUrl(a.cover), location.href).href, sizes: "1000x1000" }] : [] });
        navigator.mediaSession.setActionHandler("play", () => this.audio.play());
        navigator.mediaSession.setActionHandler("pause", () => this.audio.pause());
        navigator.mediaSession.setActionHandler("previoustrack", () => this.prev());
        navigator.mediaSession.setActionHandler("nexttrack", () => this.next());
      } catch {}
    },
  };
  const A = Player.audio;
  A.volume = store.get("vol", 85) / 100;
  const vol = $("#p-vol"); vol.value = Math.round(A.volume * 100); vol.style.setProperty("--pct", vol.value + "%");
  vol.addEventListener("input", () => { A.volume = vol.value / 100; store.set("vol", +vol.value); vol.style.setProperty("--pct", vol.value + "%"); });
  $("#p-play").onclick = () => Player.toggle();
  $("#p-next").onclick = () => Player.next();
  $("#p-prev").onclick = () => Player.prev();
  $("#p-shuffle").onclick = () => { Player.shuffle = !Player.shuffle; store.set("shuffle", Player.shuffle); if (Player.list.length) { const ci = Player.order[Player.pos]; Player.pos = Player.buildOrder(ci); } toast(T(Player.shuffle ? "shuffleOn" : "shuffleOff")); Player.updateUI(); };
  $("#p-repeat").onclick = () => { Player.repeat = { off: "all", all: "one", one: "off" }[Player.repeat]; store.set("repeat", Player.repeat); toast(T({ off: "repeatOff", all: "repeatAll", one: "repeatOne" }[Player.repeat])); Player.updateUI(); };
  $("#p-like").onclick = () => { const c = Player.current(); if (c) toggleLike(c.aid, c.tid); };
  $("#p-queue").onclick = (e) => { e.stopPropagation(); $("#queue").classList.toggle("open"); renderQueue(); };
  document.addEventListener("click", (e) => { if (!e.target.closest("#queue") && !e.target.closest("#p-queue")) $("#queue").classList.remove("open"); });
  const bar = $("#p-bar"); let seeking = false;
  bar.addEventListener("input", () => { seeking = true; bar.style.setProperty("--pct", bar.value / 10 + "%"); $("#p-cur").textContent = fmt((bar.value / 1000) * (A.duration || 0)); });
  bar.addEventListener("change", () => { seeking = false; if (A.duration) A.currentTime = (bar.value / 1000) * A.duration; });
  A.addEventListener("timeupdate", () => { if (!seeking && A.duration) { const v = (A.currentTime / A.duration) * 1000; bar.value = v; bar.style.setProperty("--pct", v / 10 + "%"); $("#p-cur").textContent = A.currentTime < 1 ? "0:00" : fmt(A.currentTime); } });
  A.addEventListener("loadedmetadata", () => { $("#p-dur").textContent = fmt(A.duration); });
  A.addEventListener("play", () => Player.updateUI());
  A.addEventListener("pause", () => Player.updateUI());
  A.addEventListener("ended", () => { if (Player.repeat === "one") { A.currentTime = 0; A.play().catch(() => {}); } else if (store.get("autoNext", true)) Player.next(); else Player.updateUI(); });
  A.addEventListener("error", () => {
    if (!A.getAttribute("src")) return;
    if (!A.dataset.fb && A.dataset.ref) { MediaFB.recover(A); return; }
    toast(T("noAudio"));
  });
  function renderQueue() {
    const q = $("#queue"); if (!q.classList.contains("open")) return;
    if (!Player.list.length) { q.innerHTML = `<div class="label">// ${T("queue")}</div><div class="empty">${T("queueEmpty")}</div>`; return; }
    q.innerHTML = `<div class="label" style="margin-bottom:10px">// ${T("queue")} <span class="dim">${Player.order.length}</span></div><div class="tracks">` +
      Player.order.map((li, p) => { const r = Player.list[li]; const t = Player.track(r); const a = Player.album(r); if (!t) return "";
        return `<div class="track-row ${p === Player.pos ? "playing" : ""}" data-qpos="${p}"><div class="no">${pad(p + 1)}</div><div class="ti"><div class="n">${esc(L(t.title))}</div><div class="o">${esc(L(a.title))}</div></div><div class="dur" style="padding-right:8px">${fmt(t.duration)}</div></div>`; }).join("") + "</div>";
    $$("[data-qpos]", q).forEach((row) => row.addEventListener("click", () => { Player.pos = +row.dataset.qpos; Player.load(true); }));
  }

  // ===================== mini visualizer (decorative) =====================
  const Viz = {
    canvas: $("#viz"), level: new Array(22).fill(0.06),
    loop() {
      const c = this.canvas, g = c.getContext("2d"), W = c.width, H = c.height, N = 22, bw = W / N;
      g.clearRect(0, 0, W, H);
      const playing = Player.isPlaying(), now = performance.now() / 1000;
      const col = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c9a86a";
      g.fillStyle = col;
      for (let i = 0; i < N; i++) {
        const target = playing ? 0.18 + 0.62 * Math.abs(Math.sin(now * (1.3 + (i % 5) * 0.37) + i * 0.9)) * (0.55 + 0.45 * Math.sin(now * 0.7 + i)) * (1 - i / (N * 1.6)) : 0.05;
        this.level[i] += (target - this.level[i]) * 0.18;
        const h = Math.max(2, this.level[i] * H); g.fillRect(i * bw + 1, H - h, bw - 4, h);
      }
      NP.sync();
      requestAnimationFrame(() => this.loop());
    },
  };

  // ===================== wireframe mesh background =====================
  const Mesh = (() => {
    const c = $("#mesh"); const g = c.getContext("2d");
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, t = 0, rgb = "201,168,106", speed = 0.004, lastDraw = 0;
    function recolor() {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--mesh").trim() || getComputedStyle(document.documentElement).getPropertyValue("--m1").trim();
      const m = /^#?([0-9a-f]{6})$/i.exec(v); if (m) { const n = parseInt(m[1], 16); rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; }
      if (reduce) draw();
    }
    function resize() { const dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; g.setTransform(dpr, 0, 0, dpr, 0, 0); if (reduce) draw(); }
    function surface(ox, oy, sw, sh, rot, phase, rows, cols, alpha) {
      const pts = [];
      for (let i = 0; i <= rows; i++) {
        const row = []; const v = i / rows;
        for (let j = 0; j <= cols; j++) {
          const u = j / cols;
          const wave = Math.sin(u * 5.2 + t + phase) * 0.5 + Math.sin(v * 3.1 + u * 2.3 - t * 0.7 + phase) * 0.35;
          const x = u * sw, y = v * sh * (0.45 + 0.55 * Math.sin(u * Math.PI)) + wave * sh * 0.18;
          row.push([ox + x * Math.cos(rot) - y * Math.sin(rot), oy + x * Math.sin(rot) + y * Math.cos(rot)]);
        }
        pts.push(row);
      }
      g.lineWidth = 0.7;
      for (let i = 0; i <= rows; i++) {
        g.strokeStyle = `rgba(${rgb},${alpha * (0.35 + 0.65 * Math.sin((i / rows) * Math.PI))})`;
        g.beginPath(); pts[i].forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      }
      g.strokeStyle = `rgba(${rgb},${alpha * 0.45})`;
      for (let j = 0; j <= cols; j += 2) { g.beginPath(); for (let i = 0; i <= rows; i++) { const [x, y] = pts[i][j]; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      surface(-W * 0.08, H * 0.62, W * 0.62, H * 0.42, -0.32, 0, 22, 44, 0.16);
      surface(W * 0.62, -H * 0.05, W * 0.48, H * 0.3, 0.38, 2.1, 16, 34, 0.1);
    }
    function loop(now) {
      const target = NP.isOpen() && Player.isPlaying() ? 0.03 : Player.isPlaying() ? 0.012 : 0.004;
      speed += (target - speed) * 0.05;
      if (document.documentElement.classList.contains("calm")) { if (!lastDraw) { draw(); lastDraw = now; } requestAnimationFrame(loop); return; }
      if (now - lastDraw > 33 && !document.hidden) { t += speed * ((now - lastDraw) / 16.7); lastDraw = now; draw(); }
      requestAnimationFrame(loop);
    }
    addEventListener("resize", resize);
    resize(); recolor();
    if (!reduce) requestAnimationFrame(loop); else draw();
    return { recolor };
  })();

  /*__EDITOR__*/

  // ===================== visitor settings panel =====================
  const Settings = (() => {
    const el = $("#settings");
    const isOpen = () => el.classList.contains("open");
    function applyPrefs() {
      const root = document.documentElement;
      root.classList.toggle("calm", store.get("motion", "on") === "off");
      root.classList.toggle("big-text", store.get("textSize", "m") === "l");
      $$(".planet-art").forEach((svg) => { try { root.classList.contains("calm") ? svg.pauseAnimations() : svg.unpauseAnimations(); } catch {} });
    }
    const seg = (name, opts, cur) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(cur) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
    function render() {
      const vc = store.get("custom", null); const c = vc || LIB.site.custom;
      const themes = [["gold", T("tGold")], ["chrome", T("tChrome")], ["lightgold", T("tLightgold")], ["lightsilver", T("tLightsilver")], ["custom", T("tCustom")]];
      el.innerHTML = `
        <button class="icon-btn close" data-sclose aria-label="Close">${SVG.close}</button>
        <div class="micro">// ${T("settings")}</div><h2>${T("settings")}</h2>
        <div class="sgroup"><div class="label">${T("sTheme")}</div>
          <div class="theme-grid">${themes.map(([k, l]) => `<button type="button" class="theme-card ${theme === k ? "on" : ""}" data-pick-theme="${k}"><span class="sw" data-sw="${k}"></span><span>${l}</span></button>`).join("")}</div></div>
        <div class="sgroup"><div class="label">${T("sCustom")}</div>
          <div class="hint">${T("sCustomHint")}</div>
          <div style="display:flex;gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap">
            <input type="color" id="s-cc" value="${esc(c.accent)}"><input type="text" id="s-hex" value="${esc(c.accent)}" maxlength="7" style="max-width:120px">
            ${seg("base", [["dark", T("dark")], ["light", T("light")]], c.base)}
          </div>
          <div class="tagpick" style="margin-top:10px">${["#a855f7", "#e11d48", "#0ea5e9", "#10b981", "#f97316", "#d4af37", "#94a3b8"].map((x) => `<button type="button" class="swatch" data-swatch="${x}" style="background:${x}" title="${x}"></button>`).join("")}
            ${vc ? `<button type="button" class="btn ghost" id="s-sitecolor" style="padding:4px 8px">${T("siteColor")}</button>` : ""}</div></div>
        <div class="sgroup"><div class="label">${T("sLang")}</div>${seg("lang", [["en", "English"], ["zh", "中文"]], lang)}</div>
        <div class="sgroup"><div class="label">${T("sMotion")}</div><div class="hint">${T("sMotionHint")}</div>${seg("motion", [["on", T("on")], ["off", T("off")]], store.get("motion", "on"))}</div>
        <div class="sgroup"><div class="label">${T("sText")}</div>${seg("textSize", [["m", T("standard")], ["l", T("large")]], store.get("textSize", "m"))}</div>
        <div class="sgroup"><div class="label">${T("sPlay")}</div>
          <div class="srow"><span>${T("sAutoNext")}</span>${seg("autoNext", [["true", T("on")], ["false", T("off")]], store.get("autoNext", true))}</div></div>
        <div class="sgroup"><button class="btn" id="s-reset">${T("sReset")}</button><p class="hint" style="margin-top:10px">${T("sSaved")}</p></div>`;
      $("[data-sclose]", el).onclick = close;
      $$("[data-pick-theme]", el).forEach((b) => b.onclick = () => { store.set("theme", b.dataset.pickTheme); applyTheme(b.dataset.pickTheme); render(); });
      const setCustom = (hex, base) => {
        const cur = store.get("custom", null) || { ...LIB.site.custom };
        if (hex) { if (!/^#[0-9a-f]{6}$/i.test(hex)) return; cur.accent = hex.toLowerCase(); }
        if (base) cur.base = base;
        store.set("custom", cur); store.set("theme", "custom"); applyTheme("custom"); render();
      };
      $("#s-cc").addEventListener("change", (e) => setCustom(e.target.value));
      $("#s-cc").addEventListener("input", (e) => { const cur = store.get("custom", null) || { ...LIB.site.custom }; cur.accent = e.target.value; store.set("custom", cur); store.set("theme", "custom"); applyTheme("custom"); $("#s-hex").value = e.target.value; $$(".theme-card", el).forEach((x) => x.classList.toggle("on", x.dataset.pickTheme === "custom")); });
      $("#s-hex").addEventListener("change", (e) => { const v = e.target.value.trim(); setCustom(v.startsWith("#") ? v : "#" + v); });
      $$("[data-swatch]", el).forEach((b) => b.onclick = () => setCustom(b.dataset.swatch));
      const sc = $("#s-sitecolor"); if (sc) sc.onclick = () => { store.set("custom", null); applyTheme(theme); render(); };
      $$("[data-seg]", el).forEach((g) => $$("button", g).forEach((b) => b.onclick = () => {
        const k = g.dataset.seg, v = b.dataset.v;
        if (k === "base") return setCustom(null, v);
        if (k === "lang") { $(`.topbar [data-lang="${v}"]`).click(); return render(); }
        store.set(k, k === "autoNext" ? v === "true" : v); applyPrefs(); render();
      }));
      $("#s-reset").onclick = () => { ["theme", "custom", "motion", "textSize", "autoNext"].forEach((k) => { try { localStorage.removeItem("ifjazz." + k); } catch {} }); applyTheme(LIB.site.theme); applyPrefs(); render(); };
    }
    function open() { closeDrawer(true); render(); el.classList.add("open"); el.setAttribute("aria-hidden", "false"); $("#scrim").classList.add("open"); }
    function close() { if (!isOpen()) return; el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); if (!$("#drawer").classList.contains("open")) $("#scrim").classList.remove("open"); }
    $("#open-settings").onclick = () => (isOpen() ? close() : open());
    return { open, close, isOpen, applyPrefs, render };
  })();

  // ===================== page builder (Claude save & Studio export) =====================
  function buildHtml(lib) {
    const css = $("#app-css").textContent, js = $("#app-js").textContent;
    const json = JSON.stringify(lib, null, 1).replace(/</g, "\\u003c");
    return "<!DOCTYPE html>\n<html lang=\"en\" data-mode=\"" + MODE + "\" data-theme=\"" + esc(lib.site.theme || "gold") + "\" data-base=\"" + ((lib.site.theme === "lightgold" || lib.site.theme === "lightsilver" || (lib.site.theme === "custom" && lib.site.custom && lib.site.custom.base === "light")) ? "light" : "dark") + "\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
      "<title>" + esc(lib.site.title || "If? ACG in Jazz") + "</title>\n<meta name=\"theme-color\" content=\"#050505\">\n" +
      "<style id=\"app-css\">" + css + "</style>\n</head>\n<body>\n" +
      "<script type=\"application/json\" id=\"library\">" + json + "<\/script>\n<script id=\"app-js\">" + js + "<\/script>\n</body>\n</html>\n";
  }
  window.__IFJ_build = () => buildHtml(LIB);

  // ===================== language & boot =====================
  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh" : "en";
    $$("[data-i18n]").forEach((el) => { el.textContent = T(el.dataset.i18n); });
    $$("[data-lang-toggle] button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
  }
  $$("[data-lang-toggle] button").forEach((b) => b.addEventListener("click", () => {
    lang = b.dataset.lang; store.set("lang", lang); applyLang(); if (Settings.isOpen()) Settings.render();
    if (route.name === "edit") { Player.updateUI(); return; }
    render(); if (drawerRef) openDrawer(drawerRef.aid, drawerRef.tid, drawerRef.refs, true);
    Player.updateUI(); if (NP.isOpen()) NP.render();
  }));
  window.addEventListener("hashchange", render);
  applyTheme(theme);
  Settings.applyPrefs();
  applyLang();
  render();
  Player.updateUI();
  Viz.loop();
  Editor.boot();
})();
