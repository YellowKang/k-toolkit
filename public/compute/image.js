/* Local image capabilities shared by pages and Agent actions. No network or file persistence. */
(function () {
  const errors = {
    invalid: ['请选择图片文件', 'Choose an image file'],
    limit: ['图片大小超过 100 MB', 'Image exceeds 100 MB'],
    decode: ['无法解码图片，请检查文件格式', 'Unable to decode the image. Check the format.'],
    encode: ['无法生成所选图片格式', 'Unable to generate the selected image format'],
    large: ['图片超过 4000 万像素，请先缩小', 'Image exceeds 40 megapixels. Resize it first.'],
    exif: ['EXIF 数据损坏或超出读取范围', 'EXIF data is malformed or exceeds the read limit'],
    qr: ['未检测到二维码，请确认图片清晰、二维码完整', 'No QR code found. Check image clarity and completeness.'],
    decoder: ['二维码识别库加载失败，请重试', 'The QR decoder could not load. Please retry.'],
    options: ['图片转换参数无效', 'Invalid image conversion options'],
  };
  const failure = code => Object.assign(new Error(errors[code][window.getCurrentLang?.() === 'en' ? 1 : 0]), { code });
  const check = signal => { if (signal?.aborted) throw signal.reason || new DOMException('Cancelled', 'AbortError'); };
  function validate(file) {
    if (!(file instanceof Blob) || !file.type.startsWith('image/')) throw failure('invalid');
    if (file.size > 100 * 1024 * 1024) throw failure('limit');
  }
  async function withImage(file, signal, use) {
    check(signal); validate(file);
    const url = URL.createObjectURL(file), image = new Image();
    let cancel, timer;
    try {
      await new Promise((resolve, reject) => {
        cancel = () => reject(signal.reason || new DOMException('Cancelled', 'AbortError'));
        signal?.addEventListener('abort', cancel, { once: true });
        timer = setTimeout(() => reject(failure('decode')), 10000);
        image.onload = resolve; image.onerror = () => reject(failure('decode')); image.src = url;
      });
      clearTimeout(timer); signal?.removeEventListener('abort', cancel); check(signal);
      if (!image.naturalWidth || !image.naturalHeight) throw failure('decode');
      if (image.naturalWidth * image.naturalHeight > 40000000) throw failure('large');
      return await use(image);
    } finally {
      clearTimeout(timer); signal?.removeEventListener('abort', cancel);
      image.onload = image.onerror = null; image.src = ''; URL.revokeObjectURL(url);
    }
  }
  async function convert(file, { format = 'image/jpeg', quality = 80, maxWidth } = {}, { signal } = {}) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(format) || !Number.isFinite(quality) || quality < 10 || quality > 100
      || (maxWidth !== undefined && (!Number.isInteger(maxWidth) || maxWidth < 1 || maxWidth > 12000))) throw failure('options');
    return withImage(file, signal, async image => {
      const ratio = maxWidth ? Math.min(1, maxWidth / image.naturalWidth) : 1;
      const width = Math.max(1, Math.round(image.naturalWidth * ratio)), height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      try {
        const context = canvas.getContext('2d'); if (!context) throw failure('encode');
        if (format === 'image/jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, width, height); }
        context.drawImage(image, 0, 0, width, height);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, format, quality / 100));
        check(signal);
        if (!blob || blob.type !== format) throw failure('encode');
        const ext = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];
        return { blob, width, height, name: (file.name?.replace(/\.[^.]+$/, '') || 'image') + '-compressed.' + ext };
      } finally { canvas.width = canvas.height = 0; }
    });
  }

  // Read only the documented camera tags. GPS and arbitrary binary tags are not exposed.
  const TAGS = new Set([0x010F, 0x0110, 0x0112, 0x0131, 0x0132, 0x9003, 0x920A, 0xA002, 0xA003, 0x8827, 0x829A, 0x829D, 0xA403]);
  function parseExif(data) {
    const tags = Object.create(null);
    if (data.byteLength < 2 || data.getUint16(0) !== 0xFFD8) return tags;
    let offset = 2;
    while (offset + 1 < data.byteLength) {
      if (data.getUint8(offset++) !== 0xFF) throw failure('exif');
      while (offset < data.byteLength && data.getUint8(offset) === 0xFF) offset++;
      if (offset >= data.byteLength) throw failure('exif');
      const marker = data.getUint8(offset++);
      if (marker === 0xDA || marker === 0xD9) break;
      if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) continue;
      if (offset + 2 > data.byteLength) throw failure('exif');
      const length = data.getUint16(offset), start = offset + 2, end = offset + length;
      if (length < 2 || end > data.byteLength) throw failure('exif');
      if (marker === 0xE1 && length >= 8 && data.getUint32(start) === 0x45786966 && data.getUint16(start + 4) === 0) {
        const base = start + 6;
        const range = (pos, count) => { if (pos < 0 || base + pos + count > end) throw failure('exif'); };
        range(0, 8);
        const byteOrder = data.getUint16(base);
        if (byteOrder !== 0x4949 && byteOrder !== 0x4D4D) throw failure('exif');
        const little = byteOrder === 0x4949;
        const u16 = pos => { range(pos, 2); return data.getUint16(base + pos, little); };
        const u32 = pos => { range(pos, 4); return data.getUint32(base + pos, little); };
        if (u16(2) !== 42) throw failure('exif');
        const visited = new Set();
        function readIFD(pos, depth) {
          if (depth > 2 || visited.has(pos)) throw failure('exif');
          visited.add(pos);
          const count = u16(pos); if (count > 256) throw failure('exif');
          range(pos + 2, count * 12 + 4);
          for (let i = 0; i < count; i++) {
            const entry = pos + 2 + i * 12, tag = u16(entry), type = u16(entry + 2), count = u32(entry + 4);
            if (tag === 0x8769 && type === 4 && count === 1) { readIFD(u32(entry + 8), depth + 1); continue; }
            if (!TAGS.has(tag)) continue;
            const size = ({ 2: 1, 3: 2, 4: 4, 5: 8 })[type];
            if (!size) continue;
            if (!count || count > 256) throw failure('exif');
            const valuePos = size * count <= 4 ? entry + 8 : u32(entry + 8);
            range(valuePos, size * count);
            let value;
            if (type === 2) {
              value = '';
              for (let j = 0; j < count; j++) { const byte = data.getUint8(base + valuePos + j); if (!byte) break; value += String.fromCharCode(byte); }
            } else if (type === 3) value = u16(valuePos);
            else if (type === 4) value = u32(valuePos);
            else { const denominator = u32(valuePos + 4); if (!denominator) throw failure('exif'); value = Number((u32(valuePos) / denominator).toFixed(6)); }
            tags[tag] = value;
          }
        }
        readIFD(u32(4), 0); return tags;
      }
      offset = end;
    }
    return tags;
  }
  async function metadata(file, { signal } = {}) {
    return withImage(file, signal, async image => {
      const buffer = await file.slice(0, 2 * 1024 * 1024).arrayBuffer(); check(signal);
      return { name: file.name, size: file.size, type: file.type, width: image.naturalWidth, height: image.naturalHeight, tags: parseExif(new DataView(buffer)) };
    });
  }
  async function qr(file, { signal } = {}) {
    check(signal); validate(file);
    let decode;
    try { decode = await window.ToolCompute.loadVendor('jsqr'); } catch { throw failure('decoder'); }
    check(signal);
    return withImage(file, signal, image => {
      const ratio = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      try {
        const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) throw failure('decode');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = decode(pixels.data, canvas.width, canvas.height); check(signal);
        if (!code) throw failure('qr');
        return { result: code.data };
      } finally { canvas.width = canvas.height = 0; }
    });
  }
  window.KCompute = window.KCompute || {};
  window.KCompute.image = Object.freeze({ convert, metadata, qr, parseExif });
})();
