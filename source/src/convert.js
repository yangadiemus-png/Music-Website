  // ===================== Audio → WebM/Opus converter =====================
  // The page's file storage accepts WebM but not MP3/WAV, so audio is
  // decoded in the browser and re-encoded as Opus in a WebM container.
  const Convert = (() => {
    let MAX_BYTES = 19.2 * 1024 * 1024;

    function supported() { return typeof window.AudioEncoder === "function" && typeof window.AudioData === "function"; }

    // ---- EBML helpers ----
    function concat(parts) {
      let n = 0; for (const p of parts) n += p.length;
      const out = new Uint8Array(n); let o = 0;
      for (const p of parts) { out.set(p, o); o += p.length; }
      return out;
    }
    function idB(id) { const a = []; while (id > 0) { a.unshift(id % 256); id = Math.floor(id / 256); } return Uint8Array.from(a); }
    function vsize(n) {
      for (let len = 1; len <= 8; len++) {
        if (n < Math.pow(2, 7 * len) - 1) {
          const b = new Uint8Array(len); let v = n;
          for (let i = len - 1; i >= 0; i--) { b[i] = v % 256; v = Math.floor(v / 256); }
          b[0] |= 0x80 >> (len - 1); return b;
        }
      }
      throw new Error("too big");
    }
    function uint(n, fixed) {
      const a = []; let v = Math.max(0, Math.floor(n));
      do { a.unshift(v % 256); v = Math.floor(v / 256); } while (v > 0);
      while (fixed && a.length < fixed) a.unshift(0);
      return Uint8Array.from(a);
    }
    function f64(x) { const b = new Uint8Array(8); new DataView(b.buffer).setFloat64(0, x); return b; }
    const str = (s) => new TextEncoder().encode(s);
    function el(id, ...data) { const d = concat(data.flat()); return concat([idB(id), vsize(d.length), d]); }

    function opusHead(channels, preskip) {
      const b = new Uint8Array(19); const v = new DataView(b.buffer);
      b.set(str("OpusHead"), 0); b[8] = 1; b[9] = channels;
      v.setUint16(10, preskip, true); v.setUint32(12, 48000, true); v.setInt16(16, 0, true); b[18] = 0;
      return b;
    }

    function mux(chunks, channels, head, durationMs) {
      const preskip = new DataView(head.buffer, head.byteOffset).getUint16(10, true);
      const ebml = el(0x1A45DFA3,
        el(0x4286, uint(1)), el(0x42F7, uint(1)), el(0x42F2, uint(4)), el(0x42F3, uint(8)),
        el(0x4282, str("webm")), el(0x4287, uint(4)), el(0x4285, uint(2)));
      const info = el(0x1549A966, el(0x2AD7B1, uint(1000000)), el(0x4D80, str("If? ACG in Jazz")), el(0x5741, str("If? ACG in Jazz")), el(0x4489, f64(durationMs)));
      const tracks = el(0x1654AE6B, el(0xAE,
        el(0xD7, uint(1)), el(0x73C5, uint(1)), el(0x83, uint(2)), el(0x86, str("A_OPUS")),
        el(0x63A2, head), el(0x56AA, uint(Math.round((preskip / 48000) * 1e9))), el(0x56BB, uint(80000000)),
        el(0xE1, el(0xB5, f64(48000)), el(0x9F, uint(channels)))));
      // clusters of <= 5 s
      const clusters = []; const cueTimes = [];
      let cur = null, curStart = 0;
      const flush = () => { if (cur) clusters.push(el(0x1F43B675, el(0xE7, uint(curStart)), ...cur)); cur = null; };
      for (const c of chunks) {
        const ms = Math.round(c.ts / 1000);
        if (!cur || ms - curStart >= 5000) { flush(); cur = []; curStart = ms; cueTimes.push(ms); }
        const rel = ms - curStart;
        const hdr = Uint8Array.from([0x81, (rel >> 8) & 0xff, rel & 0xff, 0x80]);
        cur.push(el(0xA3, hdr, c.data));
      }
      flush();
      const seekEntry = (id, pos) => el(0x4DBB, el(0x53AB, idB(id)), el(0x53AC, uint(pos, 8)));
      const seekHead = (pi, pt, pc) => el(0x114D9B74, seekEntry(0x1549A966, pi), seekEntry(0x1654AE6B, pt), seekEntry(0x1C53BB6B, pc));
      const shLen = seekHead(0, 0, 0).length;
      const posInfo = shLen, posTracks = posInfo + info.length;
      let p = posTracks + tracks.length;
      const clusterPos = clusters.map((c) => { const at = p; p += c.length; return at; });
      const cues = el(0x1C53BB6B, ...cueTimes.map((t, i) => el(0xBB, el(0xB3, uint(t)), el(0xB7, el(0xF7, uint(1)), el(0xF1, uint(clusterPos[i]))))));
      const segBody = concat([seekHead(posInfo, posTracks, p), info, tracks, ...clusters, cues]);
      const seg = concat([idB(0x18538067), vsize(segBody.length), segBody]);
      return new Blob([ebml, seg], { type: "video/webm" });
    }

    async function encode(buffer, bitrate, onProgress) {
      const channels = Math.min(2, buffer.numberOfChannels);
      const chunks = []; let head = null; let err = null;
      const enc = new AudioEncoder({
        output: (chunk, meta) => {
          const d = new Uint8Array(chunk.byteLength); chunk.copyTo(d);
          chunks.push({ ts: chunk.timestamp, dur: chunk.duration || 20000, data: d });
          const desc = meta && meta.decoderConfig && meta.decoderConfig.description;
          if (desc && !head) head = new Uint8Array(desc.buffer ? desc.buffer.slice(desc.byteOffset || 0, (desc.byteOffset || 0) + desc.byteLength) : desc);
        },
        error: (e) => { err = e; },
      });
      const cfg = { codec: "opus", sampleRate: 48000, numberOfChannels: channels, bitrate };
      const sup = await AudioEncoder.isConfigSupported(cfg);
      if (!sup.supported) throw new Error("This browser can't encode Opus audio.");
      enc.configure(cfg);
      const total = buffer.length, step = 48000;
      const chData = []; for (let c = 0; c < channels; c++) chData.push(buffer.getChannelData(c));
      for (let off = 0; off < total; off += step) {
        if (err) throw err;
        const n = Math.min(step, total - off);
        const planar = new Float32Array(n * channels);
        for (let c = 0; c < channels; c++) planar.set(chData[c].subarray(off, off + n), c * n);
        enc.encode(new AudioData({ format: "f32-planar", sampleRate: 48000, numberOfFrames: n, numberOfChannels: channels, timestamp: Math.round((off / 48000) * 1e6), data: planar }));
        if (enc.encodeQueueSize > 8 || off % (step * 10) === 0) {
          onProgress && onProgress(0.15 + 0.8 * (off / total));
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      await enc.flush(); enc.close();
      if (err) throw err;
      if (!head || head.length < 19 || String.fromCharCode(...head.slice(0, 8)) !== "OpusHead") head = opusHead(channels, 312);
      chunks.sort((a, b) => a.ts - b.ts);
      const last = chunks[chunks.length - 1];
      const durMs = last ? (last.ts + last.dur) / 1000 : (total / 48000) * 1000;
      return mux(chunks, channels, head, Math.min(durMs, (total / 48000) * 1000 + 40));
    }

    // file -> { blob, duration }
    async function toWebm(file, onProgress, maxBytes) {
      if (maxBytes) MAX_BYTES = maxBytes;
      if (!supported()) throw new Error("UNSUPPORTED");
      onProgress && onProgress(0.02);
      const raw = await file.arrayBuffer();
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const ctx = new OAC(2, 48000, 48000);
      let buffer;
      try { buffer = await ctx.decodeAudioData(raw); }
      catch { throw new Error("DECODE"); }
      onProgress && onProgress(0.15);
      const seconds = buffer.length / 48000;
      // pick the best bitrate that keeps the file under the 20 MB storage limit
      let bitrate = Math.floor((MAX_BYTES * 8) / Math.max(seconds, 1) / 1000) * 1000;
      bitrate = Math.min(192000, bitrate);
      if (bitrate < 40000) throw new Error("TOO_LONG");
      const blob = await encode(buffer, bitrate, onProgress);
      onProgress && onProgress(1);
      return { blob, duration: Math.round(seconds), bitrate };
    }

    return { supported, toWebm };
  })();
