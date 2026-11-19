  // ===================== Editor: Claude "Edit" tab / EdgeOne "Studio" =====================
  const Caps = { artifact: null, assets: null, ready: MODE !== "claude" };
  const Editor = (() => {
    let draft = null, sel = { type: "site" }, selTrack = null, uploading = 0, saving = false, lastExport = null, savedHow = "";
    let dirHandle = null; const canFolder = typeof window.showDirectoryPicker === "function";
    const busy = new Map();
    const isStudio = MODE !== "claude";
    const snapshot = () => JSON.stringify(draft);
    const dirty = () => draft && (isStudio ? snapshot() !== (lastExport ?? JSON.stringify(LIB)) : snapshot() !== JSON.stringify(LIB));
    const ensureDraft = () => { if (!draft) draft = clone(LIB); };
    const canEdit = () => isStudio || (Caps.assets && Caps.artifact);

    // ---- storage backends ----
    const Store = {
      async put(blob, type, kind, ext) {
        if (!isStudio) { const r = await Caps.assets.upload(blob, { type }); return r.id; }
        const path = `media/${kind === "cover" ? "covers" : "audio"}/${uid()}.${ext}`;
        localFiles.set(path, { blob, url: URL.createObjectURL(blob) });
        return path;
      },
    };

    function refreshFlags() {
      document.documentElement.classList.toggle("has-draft", !!dirty());
      const s = $("#ed-save"); if (s) s.disabled = (!isStudio && !dirty()) || uploading > 0 || saving;
      const st = $("#ed-status");
      if (st) st.innerHTML = saving ? `<span class="dot pulse"></span> ${isStudio ? "EXPORTING 导出中…" : "SAVING 保存中…"}`
        : uploading ? `<span class="dot pulse"></span> ${isStudio ? "PROCESSING 处理中" : "UPLOADING 上传中"} (${uploading})`
        : dirty() ? `<span class="dot pulse" style="background:var(--danger)"></span> ${isStudio ? "NOT EXPORTED YET 尚未导出" : "UNSAVED CHANGES 未保存"}`
        : `<span class="dim">${isStudio ? (lastExport ? (savedHow === "folder" ? "SAVED TO FOLDER — READY TO UPLOAD 已保存到文件夹" : "EXPORTED — READY TO UPLOAD 已导出") : "NO CHANGES 无更改") : "ALL SAVED 已保存"}</span>`;
      const fb = $("#ed-folder"); if (fb) fb.textContent = dirHandle ? `📁 ${dirHandle.name}` : "Open site folder 打开网站文件夹";
      const dc = $("#ed-discard"); if (dc) dc.disabled = !dirty() || saving;
    }

    // ---- form helpers ----
    const getP = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
    const setP = (o, p, v) => { const ks = p.split("."); const last = ks.pop(); const tg = ks.reduce((x, k) => (x[k] = x[k] || {}), o); tg[last] = v; };
    const input = (label, path, obj, o = {}) => `<div class="field"><label>${label}</label>
      <input type="${o.type || "text"}" data-f="${path}" value="${esc(getP(obj, path) ?? "")}" placeholder="${esc(o.ph || "")}">${o.hint ? `<div class="hint">${o.hint}</div>` : ""}</div>`;
    const pair = (label, path, obj, o = {}) => {
      const f = (lg, nm) => o.area
        ? `<div><span class="tag-lang">${nm}</span><textarea data-f="${path}.${lg}" rows="${o.rows || 4}" placeholder="${esc((o.ph && o.ph[lg]) || "")}">${esc(getP(obj, `${path}.${lg}`) || "")}</textarea></div>`
        : `<div><span class="tag-lang">${nm}</span><input type="text" data-f="${path}.${lg}" value="${esc(getP(obj, `${path}.${lg}`) || "")}" placeholder="${esc((o.ph && o.ph[lg]) || "")}"></div>`;
      return `<div class="field"><span class="flabel">${label}</span><div class="pair">${f("en", "ENGLISH")}${f("zh", "中文")}</div>${o.hint ? `<div class="hint">${o.hint}</div>` : ""}</div>`;
    };
    const bind = (root, obj, cb) => $$("[data-f]", root).forEach((el) => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
      setP(obj, el.dataset.f, el.type === "number" ? Number(el.value) || 0 : el.value); refreshFlags(); cb && cb(el.dataset.f);
    }));
    const thumb = (a) => a.cover ? `<img class="cover" src="${esc(blobUrl(a.cover))}" alt="">` : `<div class="cover-ph">${esc(initials(LA(a.title)))}</div>`;

    function errText(e) {
      const c = e && e.code;
      if (c === "too_large") return "File is over the 20 MB storage limit. 文件超过 20 MB。";
      if (c === "unsupported_type") return "This file type isn't accepted. 不支持该文件类型。";
      if (c === "quota_or_state") return "Storage is full — remove unused files (Storage panel). 存储空间已满。";
      if (c === "rate_limited") return "Too many uploads at once — wait a moment and try again. 请稍后再试。";
      if (c === "not_granted" || c === "capability_disabled") return "Uploading isn't available in this view. Open the page itself on claude.ai while signed in.";
      if (e && e.message === "UNSUPPORTED") return "This browser can't convert audio. Please use Chrome, Edge or Firefox on a computer. 请使用电脑上的 Chrome / Edge / Firefox。";
      if (e && e.message === "DECODE") return "Couldn't read this audio file. Try MP3 or WAV. 无法读取该音频，请尝试 MP3 或 WAV。";
      if (e && e.message === "TOO_LONG") return "Track is too long to fit the size limit. 曲目过长。";
      return (e && (e.message || e.code)) || "Upload failed";
    }

    // ---- upload slots ----
    function slot(key, { label, hasFile, fileLabel, accept, preview, extra }) {
      const st = busy.get(key);
      return `<div class="field"><span class="flabel">${label}</span>
        <div class="file-box" data-slot="${key}">${preview || ""}
          <div class="info">${hasFile ? esc(fileLabel || "Uploaded ✓") : `<span class="dim">No file 未上传</span>`}${extra || ""}
            ${st ? `<div class="busy-line">${esc(st.text)}</div><div class="progress"><i style="width:${Math.round((st.p || 0) * 100)}%"></i></div>` : ""}</div>
          <div class="actions" style="margin:0">
            <label class="btn">${hasFile ? "Replace 替换" : "Upload 上传"}<input type="file" accept="${accept}" hidden data-pick="${key}" ${st ? "disabled" : ""}></label>
            ${hasFile && !st ? `<button class="btn danger" type="button" data-clear="${key}">Remove 移除</button>` : ""}
          </div></div></div>`;
    }
    function setBusy(key, text, p) {
      if (text == null) busy.delete(key); else busy.set(key, { text, p });
      const box = $(`[data-slot="${key}"]`); if (!box) return;
      const line = $(".busy-line", box), barEl = $(".progress i", box);
      if (text != null && line && barEl) { line.textContent = text; barEl.style.width = Math.round((p || 0) * 100) + "%"; } else renderPane();
    }
    async function resizeCover(file) {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error("Couldn't read this image.")); i.src = url; });
        const side = Math.min(img.naturalWidth, img.naturalHeight), s = Math.min(1200, side);
        const c = document.createElement("canvas"); c.width = c.height = s;
        c.getContext("2d").drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, s, s);
        return await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.88));
      } finally { URL.revokeObjectURL(url); }
    }
    async function uploadCover(a, file) {
      const key = "cover-" + a.id; uploading++; refreshFlags();
      try {
        setBusy(key, "Preparing image 处理图片…", 0.2);
        const blob = await resizeCover(file);
        setBusy(key, isStudio ? "Saving 保存…" : "Uploading 上传中…", 0.6);
        a.cover = await Store.put(blob, "image/jpeg", "cover", "jpg");
        toast("Cover ready 封面已就绪");
      } catch (e) { dialog(errText(e), { cancel: "" }); }
      finally { uploading--; setBusy(key, null); renderSide(); refreshFlags(); }
    }
    async function uploadAudio(a, t, file) {
      const key = "audio-" + t.id; uploading++; refreshFlags();
      try {
        let blob, duration, type = "video/webm", ext = "webm";
        const isWebm = /\.webm$/i.test(file.name) || /webm/.test(file.type);
        const isMp3 = /\.mp3$/i.test(file.name) || file.type === "audio/mpeg";
        const LIMIT = isStudio ? 24 * 1024 * 1024 : 20 * 1024 * 1024;
        const readDur = (f) => new Promise((ok) => { const el = new Audio(); el.preload = "metadata"; el.onloadedmetadata = () => ok(isFinite(el.duration) ? Math.round(el.duration) : 0); el.onerror = () => ok(0); el.src = URL.createObjectURL(f); });
        if (isStudio && isMp3 && file.size <= LIMIT) {
          blob = file; type = "audio/mpeg"; ext = "mp3"; duration = await readDur(file);           // MP3: kept as-is (plays everywhere)
        } else if (isWebm && file.size <= LIMIT) {
          blob = file; duration = await readDur(file);
        } else {
          setBusy(key, "Converting 转换中…", 0.02);
          const r = await Convert.toWebm(file, (p) => setBusy(key, `Converting 转换中… ${Math.round(p * 100)}%`, p * 0.85), LIMIT * 0.97);
          blob = r.blob; duration = r.duration;
        }
        setBusy(key, `${isStudio ? "Saving 保存" : "Uploading 上传中"}… (${(blob.size / 1048576).toFixed(1)} MB)`, 0.9);
        t.audio = await Store.put(blob, type, "audio", ext);
        t.duration = duration || t.duration; t.audioName = file.name;
        if (!LA(t.title)) t.title.en = file.name.replace(/\.[^.]+$/, "");
        toast("Audio ready 音频已就绪");
      } catch (e) { dialog(errText(e), { cancel: "" }); }
      finally { uploading--; setBusy(key, null); renderTrackList(a); refreshFlags(); }
    }

    // ---- layout ----
    function render() {
      if (!Caps.ready) { view.innerHTML = `<div class="loading">CHECKING ACCESS…</div>`; return; }
      if (!canEdit()) { view.innerHTML = `<div class="block empty">${T("ownerOnly")}</div>`; return; }
      ensureDraft(); DATA = draft; closeDrawer(true);
      view.innerHTML = `
        <div class="edit-bar">
          <h1>${isStudio ? "STUDIO 工作室" : "EDIT 编辑"}</h1><span class="micro" id="ed-status"></span><span class="spacer"></span>
          ${isStudio && canFolder ? `<button class="btn" id="ed-folder">Open site folder 打开网站文件夹</button>` : ""}
          ${isStudio ? `<label class="btn">Import site.zip 导入<input type="file" accept=".zip,application/zip" hidden id="ed-import"></label>` : ""}
          <button class="btn" id="ed-discard">Discard 放弃更改</button>
          ${isStudio ? `<button class="btn" id="ed-export">Export site.zip 导出</button>` : ""}
          <button class="btn primary" id="ed-save">${isStudio ? (canFolder ? "Save to folder 保存到文件夹" : "Export site.zip 导出") : "Save &amp; publish 保存"}</button>
        </div>
        <p class="muted" style="margin:0 0 16px;font-size:14px">${isStudio
          ? (canFolder ? "Click <b>Open site folder</b> and choose the folder this index.html is in. Then <b>Save to folder</b> writes your songs, covers and the updated page straight into it — upload that folder to your server. 先选择网站文件夹，保存后把整个文件夹上传到服务器。"
            : "This browser can't write to folders, so use <b>Export site.zip</b>, unzip it over your site folder, then upload. 此浏览器不支持直接写入文件夹，请导出 site.zip，解压覆盖网站文件夹后上传。")
          : "Visitors see the last saved version. Upload covers and audio here, then press <b>Save</b>. 访客看到的是最后保存的版本。"}</p>
        <div class="admin-grid"><aside class="admin-side" id="ed-side"></aside><section id="ed-pane"></section></div>
        <section class="panel" id="ed-storage"></section>`;
      $("#ed-save").onclick = save;
      $("#ed-discard").onclick = async () => {
        if (!(await dialog("Discard all unsaved changes?\n放弃所有未保存的更改？", { ok: "Discard 放弃", danger: true }))) return;
        draft = clone(LIB); lastExport = null; render();
      };
      const ef = $("#ed-export"); if (ef) ef.onclick = () => { if (!uploading && !saving && validate()) exportZip(); };
      const fo = $("#ed-folder"); if (fo) fo.onclick = pickFolder;
      const imp = $("#ed-import"); if (imp) imp.addEventListener("change", () => { const f = imp.files[0]; imp.value = ""; if (f) importZip(f); });
      renderSide(); renderPane(); renderStorage(); refreshFlags();
    }
    function renderSide() {
      const side = $("#ed-side"); if (!side) return;
      side.innerHTML = `
        <div class="label" style="padding:4px 6px 8px">// SITE 网站</div>
        <div class="side-item ${sel.type === "site" ? "on" : ""}" data-sel="site">⚙ <span class="grow">Site settings 网站设置</span></div>
        <div class="label" style="padding:14px 6px 8px">// ALBUMS 专辑 <span class="dim">${draft.albums.length}</span></div>
        ${draft.albums.map((a, i) => `<div class="side-item ${sel.type === "album" && sel.id === a.id ? "on" : ""}" data-sel="${esc(a.id)}">
          <div class="thumb">${thumb(a)}</div>
          <span class="grow">${esc(LA(a.title) || "Untitled album")}<br><span class="dim mono" style="font-size:11px">${a.tracks.length} TRK</span></span>
          <span class="mv"><button data-up="${i}" title="Move up">▲</button><button data-down="${i}" title="Move down">▼</button></span></div>`).join("")}
        <div class="actions" style="padding:10px 4px 4px"><button class="btn" id="ed-add-album" style="width:100%;justify-content:center">+ New album 新专辑</button></div>`;
      $$("[data-sel]", side).forEach((el) => el.addEventListener("click", (e) => {
        if (e.target.closest(".mv")) return;
        sel = el.dataset.sel === "site" ? { type: "site" } : { type: "album", id: el.dataset.sel }; selTrack = null; renderSide(); renderPane();
      }));
      const mv = (i, d) => { const j = i + d; if (j < 0 || j >= draft.albums.length) return; [draft.albums[i], draft.albums[j]] = [draft.albums[j], draft.albums[i]]; renderSide(); refreshFlags(); };
      $$("[data-up]", side).forEach((b) => b.addEventListener("click", () => mv(+b.dataset.up, -1)));
      $$("[data-down]", side).forEach((b) => b.addEventListener("click", () => mv(+b.dataset.down, 1)));
      $("#ed-add-album").onclick = () => {
        const a = { id: uid(), title: { en: "New album", zh: "新专辑" }, artist: "If?", year: String(new Date().getFullYear()), cover: "", description: { en: "", zh: "" }, tracks: [] };
        draft.albums.unshift(a); sel = { type: "album", id: a.id }; selTrack = null; renderSide(); renderPane(); refreshFlags();
      };
    }
    function renderPane() {
      const pane = $("#ed-pane"); if (!pane) return;
      if (sel.type === "album") { const a = draft.albums.find((x) => x.id === sel.id); if (a) return renderAlbum(a); sel = { type: "site" }; }
      const s = draft.site;
      pane.innerHTML = `<div class="panel" id="ed-site"><div class="label">// SITE SETTINGS</div><h2>Site settings 网站设置</h2>
        ${input("Site title 网站名称", "title", s)}
        <div class="field"><label>Default color theme 默认配色 (visitors can still switch)</label>
          <select data-f="theme">${[["gold", "Black & gold 黑金"], ["chrome", "Black & silver 黑银"], ["lightgold", "Light gold 浅金"], ["lightsilver", "Light silver 浅银"], ["custom", "Custom 自定义"]].map(([v, l]) => `<option value="${v}" ${s.theme === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="field"><span class="flabel">Custom color scheme 自定义配色 (the 5th dot in the top bar)</span>
          <div class="row" style="align-items:end">
            <div><span class="tag-lang">ACCENT COLOR 主色</span><div style="display:flex;gap:10px;align-items:center"><input type="color" id="ed-cc" value="${esc(s.custom.accent)}" style="width:52px;height:40px;padding:2px;background:var(--field);border:1px solid var(--hair-2)"><input type="text" id="ed-cc-hex" value="${esc(s.custom.accent)}" style="max-width:130px" maxlength="7"></div></div>
            <div><span class="tag-lang">BACKGROUND 背景</span><select id="ed-cb"><option value="dark" ${s.custom.base === "dark" ? "selected" : ""}>Dark 深色</option><option value="light" ${s.custom.base === "light" ? "selected" : ""}>Light 浅色</option></select></div>
            <div><button class="btn" type="button" id="ed-cprev">Preview 预览</button></div>
          </div>
          <div class="tagpick" style="margin-top:10px">${["#a855f7", "#e11d48", "#0ea5e9", "#10b981", "#f97316", "#d4af37", "#94a3b8"].map((c) => `<button type="button" class="tagchip big" data-swatch="${c}" style="border-color:${c};color:${c}">${c}</button>`).join("")}</div></div>
        ${pair("Tagline 标语 (under the big title)", "tagline", s)}
        ${pair("Statement 主张 (big text in the second block)", "statement", s, { ph: { en: "Anime, comic & game themes, re-voiced in jazz", zh: "把动画、漫画与游戏的旋律，重写成爵士" } })}
        ${pair("About page 关于页面", "about", s, { area: true, rows: 7 })}
        ${pair("Disclaimer / copyright note 版权声明", "disclaimer", s, { area: true, rows: 3 })}
        <div class="field"><label>Links 链接 — one per line: Label | https://…</label>
          <textarea id="ed-links" rows="4" class="code" placeholder="Bilibili | https://space.bilibili.com/...">${esc(s.links.map((l) => `${l.label || ""} | ${l.url || ""}`).join("\n"))}</textarea></div></div>`;
      bind($("#ed-site"), s, (f) => { if (f === "theme") { applyTheme(s.theme); store.set("theme", null); } });
      const setCustom = (hex, base) => {
        if (hex && /^#[0-9a-f]{6}$/i.test(hex)) { s.custom.accent = hex.toLowerCase(); $("#ed-cc").value = s.custom.accent; $("#ed-cc-hex").value = s.custom.accent; }
        if (base) s.custom.base = base;
        applyTheme("custom"); store.set("theme", "custom"); refreshFlags();
      };
      $("#ed-cc").addEventListener("input", (ev) => setCustom(ev.target.value));
      $("#ed-cc-hex").addEventListener("input", (ev) => { const v = ev.target.value.trim(); setCustom(v.startsWith("#") ? v : "#" + v); });
      $("#ed-cb").addEventListener("change", (ev) => setCustom(null, ev.target.value));
      $("#ed-cprev").onclick = () => setCustom(s.custom.accent);
      $$("[data-swatch]", pane).forEach((b) => b.addEventListener("click", () => setCustom(b.dataset.swatch)));
      $("#ed-links").addEventListener("input", (e) => {
        s.links = e.target.value.split("\n").map((ln) => { const [label, ...rest] = ln.split("|"); return { label: (label || "").trim(), url: rest.join("|").trim() }; }).filter((l) => l.label || l.url);
        refreshFlags();
      });
    }
    function renderAlbum(a) {
      const idx = draft.albums.indexOf(a);
      $("#ed-pane").innerHTML = `
        <div class="panel" id="ed-album"><div class="label">// No. ${pad(idx + 1)}</div><h2>${esc(LA(a.title) || "Untitled album")}</h2>
          ${pair("Album title 专辑名", "title", a)}
          <div class="row">${input("Artist 艺人", "artist", a, { ph: "If?" })}${input("Year 年份", "year", a, { ph: "2026" })}</div>
          ${pair("Description 简介", "description", a, { area: true, rows: 4 })}
          ${slot("cover-" + a.id, { label: "Cover art 封面 (cropped to a square automatically)", hasFile: !!a.cover, fileLabel: "Cover ready ✓", accept: "image/png,image/jpeg,image/webp,image/gif", preview: `<div class="preview">${thumb(a)}</div>` })}
          <div class="actions"><button class="btn danger" id="ed-del-album">Delete album 删除专辑</button></div></div>
        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <h2 style="margin:0">Tracks 曲目 <span class="micro dim">${a.tracks.length}</span></h2>
            <button class="btn primary" id="ed-add-track">+ Add track 添加曲目</button></div>
          <p class="muted" style="font-size:14px">Click a track to edit it. Its "About" text is what listeners see when they click the song. 点击曲目进行编辑。</p>
          <div class="track-edit-list" id="ed-tlist"></div><div id="ed-track"></div></div>`;
      bind($("#ed-album"), a, (f) => { if (f.startsWith("title")) { renderSide(); $("#ed-album h2").textContent = LA(a.title) || "Untitled album"; } });
      wireSlots($("#ed-album"), { ["cover-" + a.id]: { pick: (f) => uploadCover(a, f), clear: () => { a.cover = ""; renderPane(); renderSide(); refreshFlags(); } } });
      $("#ed-del-album").onclick = async () => {
        if (!(await dialog(`Delete "${LA(a.title)}" and its ${a.tracks.length} track(s)?\n删除这张专辑及其曲目？`, { ok: "Delete 删除", danger: true }))) return;
        draft.albums.splice(draft.albums.indexOf(a), 1); sel = { type: "site" }; selTrack = null; renderSide(); renderPane(); refreshFlags();
      };
      $("#ed-add-track").onclick = () => {
        const t = { id: uid(), title: { en: "", zh: "" }, original: { en: "", zh: "" }, originalArtist: "", duration: 0, audio: "", audioName: "", about: { en: "", zh: "" }, credits: { en: "", zh: "" }, lyrics: "", tags: [] };
        a.tracks.push(t); selTrack = t.id; renderTrackList(a); renderTrack(a); refreshFlags(); renderSide();
        $("#ed-track").scrollIntoView({ behavior: "smooth", block: "start" });
      };
      renderTrackList(a); renderTrack(a);
    }
    function wireSlots(root, map) {
      $$("[data-pick]", root).forEach((inp) => inp.addEventListener("change", () => { const f = inp.files[0]; inp.value = ""; if (f && map[inp.dataset.pick]) map[inp.dataset.pick].pick(f); }));
      $$("[data-clear]", root).forEach((b) => b.addEventListener("click", () => map[b.dataset.clear] && map[b.dataset.clear].clear()));
    }
    function renderTrackList(a) {
      const list = $("#ed-tlist"); if (!list) return;
      if (!a.tracks.length) { list.innerHTML = `<div class="empty">No tracks yet 还没有曲目</div>`; return; }
      list.innerHTML = a.tracks.map((t, i) => `<div class="te ${selTrack === t.id ? "on" : ""}" data-t="${esc(t.id)}">
          <div class="no">${pad(i + 1)}</div>
          <div style="min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(LA(t.title) || "Untitled track")}</div>
            <div class="muted" style="font-size:13px">${esc(LA(t.original) || "—")} · <span class="mono">${fmt(t.duration)}</span>
              ${busy.has("audio-" + t.id) ? `<span class="badge">WORKING</span>` : t.audio ? `<span class="badge ok">AUDIO</span>` : `<span class="badge warn">NO AUDIO</span>`}
              ${LA(t.about) ? `<span class="badge ok">ABOUT</span>` : ""}${t.lyrics ? `<span class="badge ok">LYRICS</span>` : ""}${(t.tags || []).map((g) => `<span class="badge">${esc(tagLabel(g).toUpperCase())}</span>`).join("")}</div></div>
          <div class="acts"><button class="icon-btn" data-tup="${i}" title="Move up">▲</button><button class="icon-btn" data-tdown="${i}" title="Move down">▼</button></div></div>`).join("");
      $$(".te", list).forEach((el) => el.addEventListener("click", (e) => { if (e.target.closest(".acts")) return; selTrack = selTrack === el.dataset.t ? null : el.dataset.t; renderTrackList(a); renderTrack(a); }));
      const mv = (i, d) => { const j = i + d; if (j < 0 || j >= a.tracks.length) return; [a.tracks[i], a.tracks[j]] = [a.tracks[j], a.tracks[i]]; renderTrackList(a); refreshFlags(); };
      $$("[data-tup]", list).forEach((b) => b.addEventListener("click", () => mv(+b.dataset.tup, -1)));
      $$("[data-tdown]", list).forEach((b) => b.addEventListener("click", () => mv(+b.dataset.tdown, 1)));
    }
    function renderTrack(a) {
      const box = $("#ed-track"); if (!box) return;
      const t = a.tracks.find((x) => x.id === selTrack); if (!t) { box.innerHTML = ""; return; }
      const i = a.tracks.indexOf(t);
      const hint = isStudio ? "MP3 is kept as-is (best for iPhone). WAV / FLAC / others are converted to WebM/Opus to stay under 25 MB. MP3 原样保留；WAV 等格式会自动转换。"
        : "Converted to high-quality WebM/Opus in your browser before upload (max ~20 MB). 上传前会在浏览器中转换格式。";
      box.innerHTML = `<div class="track-editor" id="ed-tform"><div class="label">// EDITING ${pad(i + 1)} 编辑曲目</div>
        <h3>${esc(LA(t.title) || "Untitled track")}</h3>
        ${slot("audio-" + t.id, { label: "Audio 音频 — MP3, WAV, FLAC, M4A or OGG", hasFile: !!t.audio, fileLabel: `${t.audioName || "Audio ready"} ✓ · ${fmt(t.duration)}`, accept: "audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.webm",
          extra: t.audio ? `<audio controls preload="none" src="${esc(blobUrl(t.audio))}"></audio>` : `<div class="hint">${hint}</div>` })}
        ${pair("Song title 歌名 (your version)", "title", t, { ph: { en: "Hikaru Nara (Jazz ver.)", zh: "光るなら（爵士版）" } })}
        ${pair("Original work 原作 / 出处", "original", t, { ph: { en: "Your Lie in April — OP1", zh: "《四月是你的谎言》OP1" } })}
        ${input("Original artist 原唱", "originalArtist", t, { ph: "Goose house" })}
        <div class="field"><span class="flabel">Tags 标签 — Band / Anime / Games are the quick-jump links on the site</span>
          <div class="tagpick">${CATS.map((c) => `<button type="button" class="tagchip big ${hasTag(t, c.key) ? "on" : ""}" data-cat="${c.key}">${c.label}</button>`).join("")}</div>
          <input type="text" id="ed-tags" value="${esc((t.tags || []).filter((g) => !catOf(g)).join(", "))}" placeholder="Other tags, comma separated 其他标签，用逗号分隔 — e.g. Ballad, 抒情, Live" style="margin-top:8px"></div>
        ${pair("About this song 歌曲介绍 — shown when a listener clicks the song", "about", t, { area: true, rows: 6, ph: { en: "Arrangement ideas, the story behind this cover…", zh: "编曲思路、这首翻奏背后的故事……" } })}
        ${pair("Credits 制作人员", "credits", t, { area: true, rows: 4, ph: { en: "Arrangement: …\nPiano: …", zh: "编曲：…\n钢琴：…" } })}
        <div class="field"><label>Lyrics 歌词 (optional)</label>
          <textarea data-f="lyrics" class="code" rows="8" placeholder="[00:12.50] First line&#10;[00:17.20] Second line">${esc(t.lyrics)}</textarea>
          <div class="hint">Timed LRC lines scroll in sync; plain text also works. <label class="btn ghost" style="padding:3px 8px;font-size:10px">Import .lrc<input type="file" accept=".lrc,.txt,text/plain" hidden id="ed-lrc"></label></div></div>
        <div class="actions"><button class="btn" id="ed-tdone">Done 完成</button><button class="btn danger" id="ed-tdel">Delete track 删除曲目</button></div></div>`;
      bind($("#ed-tform"), t, (f) => {
        if (f.startsWith("title")) { const h = $("#ed-tform h3"); if (h) h.textContent = LA(t.title) || "Untitled track"; }
        clearTimeout(renderTrack._t); renderTrack._t = setTimeout(() => renderTrackList(a), 300);
      });
      const setTags = () => {
        const cats = $$("[data-cat].on", box).map((b) => b.dataset.cat);
        t.tags = cleanTags([...cats, ...$("#ed-tags").value.split(/[,，、]/)]);
        refreshFlags(); clearTimeout(renderTrack._t); renderTrack._t = setTimeout(() => renderTrackList(a), 300);
      };
      $$("[data-cat]", box).forEach((b) => b.addEventListener("click", () => { b.classList.toggle("on"); setTags(); }));
      $("#ed-tags").addEventListener("input", setTags);
      wireSlots($("#ed-tform"), { ["audio-" + t.id]: { pick: (f) => uploadAudio(a, t, f), clear: () => { t.audio = ""; t.audioName = ""; renderTrack(a); renderTrackList(a); refreshFlags(); } } });
      $("#ed-lrc").addEventListener("change", async (e) => { const f = e.target.files[0]; if (!f) return; t.lyrics = await f.text(); renderTrack(a); renderTrackList(a); refreshFlags(); });
      $("#ed-tdone").onclick = () => { selTrack = null; renderTrackList(a); renderTrack(a); };
      $("#ed-tdel").onclick = async () => {
        if (!(await dialog(`Delete "${LA(t.title) || "this track"}"?\n删除这首曲目？`, { ok: "Delete 删除", danger: true }))) return;
        a.tracks.splice(a.tracks.indexOf(t), 1); selTrack = null; renderTrackList(a); renderTrack(a); renderSide(); refreshFlags();
      };
    }

    const refsOf = (d) => { const s = new Set(); d.albums.forEach((a) => { if (a.cover) s.add(a.cover); a.tracks.forEach((t) => t.audio && s.add(t.audio)); }); return s; };

    async function renderStorage() {
      const box = $("#ed-storage"); if (!box) return;
      if (isStudio) {
        const unusedHtml = dirHandle ? `<div id="ed-unused"></div>` : "";
        box.innerHTML = `<h2>Publish 发布</h2>
          <ol class="steps">
            ${canFolder ? `<li><b>Open site folder</b> → choose the folder that contains this <b>index.html</b> (allow editing when asked). 选择包含 index.html 的网站文件夹（允许编辑）。</li>
            <li>Add or edit albums and songs, then <b>Save to folder</b>. Songs go into <b>media/audio</b>, covers into <b>media/covers</b>. 保存后歌曲在 media/audio，封面在 media/covers。</li>`
            : `<li>Edit, then <b>Export site.zip</b>, and unzip it over your site folder (replace files). 导出 site.zip 并解压覆盖网站文件夹。</li>`}
            <li>Upload the whole folder (index.html + media/) to your web server (i6, EdgeOne, …), replacing the old files. 把整个文件夹上传到服务器并覆盖旧文件。</li>
            <li>Keep this folder on your computer as the master copy — next time, open its index.html#studio again. 电脑上的这个文件夹就是母版，下次继续在这里编辑。</li>
          </ol>
          <p class="hint">Media in this site: ${refsOf(draft).size} file(s). MP3 is kept as-is; other formats are converted to WebM/Opus under 25 MB.</p>${unusedHtml}`;
        if (dirHandle) listUnused();
        return;
      }
      box.innerHTML = `<h2>Storage 存储空间</h2><p class="muted">Checking…</p>`;
      try {
        const { assets, usage } = await Caps.assets.list();
        const used = new Set([...refsOf(LIB), ...refsOf(draft)]);
        const unused = assets.filter((x) => !used.has(x.id));
        const pct = usage.maxBytes ? Math.min(100, (usage.bytes / usage.maxBytes) * 100) : 0;
        box.innerHTML = `<h2>Storage 存储空间</h2>
          <p class="micro">USED <span class="dim">${(usage.bytes / 1048576).toFixed(1)} MB${usage.maxBytes ? ` / ${(usage.maxBytes / 1048576).toFixed(0)} MB` : ""} · ${usage.files} FILES</span><span class="meter"><i style="width:${pct}%"></i></span></p>
          ${unused.length ? `<p class="muted" style="font-size:14px">${unused.length} uploaded file(s) aren't used by any song or album (${(unused.reduce((s, x) => s + x.sizeBytes, 0) / 1048576).toFixed(1)} MB).</p>
          <button class="btn danger" id="ed-clean">Delete unused files 删除未使用的文件</button>` : `<p class="muted" style="font-size:14px">No unused files. 没有未使用的文件。</p>`}`;
        const cl = $("#ed-clean");
        if (cl) cl.onclick = async () => {
          if (!(await dialog(`Permanently delete ${unused.length} unused file(s)?\n永久删除未使用的文件？`, { ok: "Delete 删除", danger: true }))) return;
          for (const x of unused) { try { await Caps.assets.delete(x.id); } catch {} }
          toast("Cleaned up 已清理"); renderStorage();
        };
      } catch (e) { box.innerHTML = `<h2>Storage 存储空间</h2><p class="muted">Couldn't read storage (${esc(e.code || e.message || "")}).</p>`; }
    }

    function validate() {
      for (const a of draft.albums) {
        if (!LA(a.title)) { sel = { type: "album", id: a.id }; render(); dialog("Every album needs a title. 每张专辑都需要标题。", { cancel: "" }); return false; }
        for (const t of a.tracks) if (!LA(t.title)) { sel = { type: "album", id: a.id }; selTrack = t.id; render(); dialog(`A track in "${LA(a.title)}" has no title. 有曲目缺少标题。`, { cancel: "" }); return false; }
      }
      return true;
    }

    async function save() {
      if (uploading || saving || !validate()) return;
      if (isStudio) return canFolder ? saveToFolder() : exportZip();
      if (!dirty()) return;
      saving = true; refreshFlags();
      try {
        await Caps.artifact.publish(buildHtml(draft));
        LIB = normalize(clone(draft)); toast("Saved — the page will reload 已保存");
      } catch (e) {
        const c = e && e.code;
        dialog(c === "conflict" ? "The page was changed somewhere else at the same time, so this save was dropped. Re-open the editor and redo the change. 页面在别处被修改，本次保存未生效。"
          : c === "not_granted" || c === "not_writer" ? "Only the owner can save this site. 只有站长可以保存。"
          : "Save failed: " + ((e && (e.message || e.code)) || "unknown error"), { cancel: "" });
      } finally { saving = false; refreshFlags(); }
    }

    // ---- Studio: save straight into a local folder (Chrome / Edge) ----
    async function pickFolder() {
      try {
        const h = await window.showDirectoryPicker({ id: "ifjazz-site", mode: "readwrite" });
        let hasIndex = true; try { await h.getFileHandle("index.html"); } catch { hasIndex = false; }
        if (!hasIndex && !(await dialog(`"${h.name}" has no index.html. Use it as the site folder anyway?
该文件夹里没有 index.html，仍然使用它吗？`, { ok: "Use it 使用" }))) return;
        dirHandle = h; toast(`Folder: ${h.name} 已选择文件夹`); refreshFlags(); renderStorage();
      } catch (e) { if (e && e.name !== "AbortError") dialog("Couldn't open that folder: " + (e.message || e), { cancel: "" }); }
    }
    async function subdir(root, path) { let d = root; for (const part of path) d = await d.getDirectoryHandle(part, { create: true }); return d; }
    async function writeFile(root, path, data) {
      const parts = path.split("/"); const name = parts.pop();
      const dir = await subdir(root, parts);
      const fh = await dir.getFileHandle(name, { create: true });
      const w = await fh.createWritable(); await w.write(data); await w.close();
    }
    async function saveToFolder() {
      if (!dirHandle) { await pickFolder(); if (!dirHandle) return; }
      try {
        if (dirHandle.requestPermission && (await dirHandle.requestPermission({ mode: "readwrite" })) !== "granted") throw new Error("Permission to edit the folder was not given 未获得文件夹写入权限");
      } catch (e) { dialog(e.message || String(e), { cancel: "" }); return; }
      saving = true; refreshFlags();
      try {
        const refs = [...refsOf(draft)]; let n = 0;
        for (const ref of refs) {
          const lf = localFiles.get(ref);
          if (!lf || lf.saved || !/^media\//.test(ref)) continue;
          n++; const st = $("#ed-status"); if (st) st.textContent = `WRITING 写入 ${ref}`;
          await writeFile(dirHandle, ref, lf.blob); lf.saved = true;
        }
        await writeFile(dirHandle, "index.html", new Blob([buildHtml(draft)], { type: "text/html" }));
        lastExport = snapshot(); savedHow = "folder";
        toast(`Saved to "${dirHandle.name}" — ${n} new file(s) + index.html 已保存`, 4500);
        renderStorage();
      } catch (e) { dialog("Save failed: " + (e.message || e), { cancel: "" }); }
      finally { saving = false; refreshFlags(); }
    }
    async function listUnused() {
      const box = $("#ed-unused"); if (!box || !dirHandle) return;
      const used = refsOf(draft); const unused = [];
      for (const sub of ["audio", "covers"]) {
        try {
          const d = await (await dirHandle.getDirectoryHandle("media")).getDirectoryHandle(sub);
          for await (const [name, h] of d.entries()) if (h.kind === "file" && !name.startsWith(".") && !used.has(`media/${sub}/${name}`)) unused.push({ dir: d, name, path: `media/${sub}/${name}` });
        } catch {}
      }
      if (!unused.length) { box.innerHTML = `<p class="hint">No unused files in the folder. 文件夹里没有多余文件。</p>`; return; }
      box.innerHTML = `<p class="muted" style="font-size:14px">${unused.length} file(s) in the folder aren't used by any song or album (old or replaced uploads). ${lastExport === snapshot() ? "" : "Save first, then clean up. 请先保存再清理。"}</p>
        <button class="btn danger" id="ed-clean-folder" ${lastExport === snapshot() ? "" : "disabled"}>Delete unused files 删除多余文件</button>`;
      const b = $("#ed-clean-folder");
      if (b) b.onclick = async () => {
        if (!(await dialog(`Delete ${unused.length} unused file(s) from "${dirHandle.name}"?
${unused.slice(0, 6).map((u) => u.path).join("\n")}${unused.length > 6 ? "\n…" : ""}`, { ok: "Delete 删除", danger: true }))) return;
        for (const u of unused) { try { await u.dir.removeEntry(u.name); } catch {} }
        toast("Cleaned up 已清理"); listUnused();
      };
    }

    // ---- Studio: export / import ----
    async function exportZip() {
      saving = true; refreshFlags();
      const status = (txt) => { const st = $("#ed-status"); if (st) st.textContent = txt; };
      try {
        const files = [{ name: "index.html", data: new TextEncoder().encode(buildHtml(draft)) }];
        const missing = []; const refs = [...refsOf(draft)]; let n = 0;
        for (const ref of refs) {
          n++; status(`COLLECTING FILES 收集文件 ${n}/${refs.length}`);
          if (!/^media\//.test(ref)) continue;
          const lf = localFiles.get(ref);
          if (lf) { files.push({ name: ref, data: lf.blob }); continue; }
          if (dirHandle) { try { const parts = ref.split("/"); const name = parts.pop(); let d = dirHandle; for (const x of parts) d = await d.getDirectoryHandle(x); files.push({ name: ref, data: await (await d.getFileHandle(name)).getFile() }); continue; } catch {} }
          try { const r = await fetch(ref); if (!r.ok) throw 0; files.push({ name: ref, data: await r.blob() }); }
          catch { missing.push(ref); }
        }
        if (missing.length && !(await dialog(`${missing.length} existing file(s) couldn't be loaded, so they'd be missing from this export:\n${missing.slice(0, 6).join("\n")}${missing.length > 6 ? "\n…" : ""}\n\nOpen the Studio from your site folder (Open site folder), from your live site, or Import your last site.zip first.\n有 ${missing.length} 个旧文件无法读取。请在线打开工作室，或先导入上次的 site.zip。`, { ok: "Export anyway 仍然导出", danger: true }))) return;
        const big = files.find((f) => (f.data.size || f.data.length) > 25 * 1024 * 1024);
        if (big) { dialog(`"${big.name}" is over EdgeOne's 25 MB per-file limit. Replace it with a smaller file. 文件超过 25 MB。`, { cancel: "" }); return; }
        status("ZIPPING 打包中…");
        const zip = await Zip.build(files);
        const a = document.createElement("a"); a.href = URL.createObjectURL(zip); a.download = "site.zip";
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
        lastExport = snapshot(); savedHow = "zip";
        toast(`site.zip ready (${(zip.size / 1048576).toFixed(1)} MB) 已导出`, 5000);
      } catch (e) { dialog("Export failed: " + (e.message || e), { cancel: "" }); }
      finally { saving = false; refreshFlags(); }
    }
    async function importZip(file) {
      try {
        const entries = await Zip.read(file);
        const key = [...entries.keys()].find((k) => /(^|\/)index\.html$/.test(k));
        if (!key) throw new Error("No index.html in this zip 压缩包里没有 index.html");
        const prefix = key.replace(/index\.html$/, "");
        const html = await entries.get(key).text();
        const m = html.match(/<script type="application\/json" id="library">([\s\S]*?)<\/script>/);
        if (!m) throw new Error("This index.html doesn't contain a library 未找到曲库数据");
        let count = 0;
        for (const [name, blob] of entries) {
          if (!name.startsWith(prefix + "media/")) continue;
          const path = name.slice(prefix.length);
          const type = /\.mp3$/i.test(path) ? "audio/mpeg" : /\.webm$/i.test(path) ? "video/webm" : /\.jpe?g$/i.test(path) ? "image/jpeg" : /\.png$/i.test(path) ? "image/png" : blob.type;
          const b = new Blob([blob], { type });
          localFiles.set(path, { blob: b, url: URL.createObjectURL(b) }); count++;
        }
        draft = normalize(JSON.parse(m[1])); lastExport = snapshot(); sel = { type: "site" }; selTrack = null;
        render(); toast(`Imported ${draft.albums.length} album(s), ${count} file(s) 已导入`, 4000);
      } catch (e) { dialog("Import failed: " + (e.message || e), { cancel: "" }); }
    }

    async function boot() {
      if (isStudio) { document.documentElement.classList.toggle("can-edit", route.name === "edit"); addEventListener("hashchange", () => document.documentElement.classList.toggle("can-edit", parseRoute().name === "edit" || !!draft)); return; }
      try {
        if (window.claude && typeof window.claude.use === "function") {
          const [art, assets] = await Promise.all([window.claude.use("artifact").catch(() => null), window.claude.use("assets").catch(() => null)]);
          Caps.artifact = art; Caps.assets = assets;
        }
      } catch {}
      Caps.ready = true;
      document.documentElement.classList.toggle("can-edit", !!(Caps.artifact && Caps.assets));
      if (route.name === "edit") render();
    }
    addEventListener("beforeunload", (e) => { if (isStudio && dirty()) { e.preventDefault(); e.returnValue = ""; } });
    return { render, boot };
  })();
