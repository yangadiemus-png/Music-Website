  // ===================== Tiny ZIP writer / reader (for the Studio) =====================
  const Zip = (() => {
    const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    function crc32(u8) { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
    const enc = new TextEncoder();
    // files: [{ name, data: Uint8Array | Blob }] -> Blob (stored, no compression; audio/images are already compressed)
    async function build(files, onProgress) {
      const parts = [], central = []; let offset = 0;
      const now = new Date();
      const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
      const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const data = f.data instanceof Uint8Array ? f.data : new Uint8Array(await f.data.arrayBuffer());
        const name = enc.encode(f.name); const crc = crc32(data);
        const lh = new DataView(new ArrayBuffer(30));
        lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
        lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
        lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
        parts.push(new Uint8Array(lh.buffer), name, data);
        const ch = new DataView(new ArrayBuffer(46));
        ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
        ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
        ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
        central.push(new Uint8Array(ch.buffer), name);
        offset += 30 + name.length + data.length;
        onProgress && onProgress((i + 1) / files.length);
      }
      const cdSize = central.reduce((s, p) => s + p.length, 0);
      const end = new DataView(new ArrayBuffer(22));
      end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
      end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
      return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: "application/zip" });
    }
    // Blob -> Map(name -> Blob). Supports stored and deflated entries.
    async function read(blob) {
      const buf = new Uint8Array(await blob.arrayBuffer()); const dv = new DataView(buf.buffer);
      let eocd = -1;
      for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      if (eocd < 0) throw new Error("Not a zip file");
      const count = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
      const out = new Map(); const dec = new TextDecoder();
      for (let i = 0; i < count; i++) {
        if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("Broken zip");
        const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
        const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
        const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen)).replace(/\\/g, "/");
        p += 46 + nlen + xlen + clen;
        if (name.endsWith("/")) continue;
        const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
        const raw = buf.subarray(start, start + csize);
        let data;
        if (method === 0) data = new Blob([raw]);
        else if (method === 8 && typeof DecompressionStream === "function") data = await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).blob();
        else continue;
        out.set(name, data);
      }
      return out;
    }
    return { build, read };
  })();
