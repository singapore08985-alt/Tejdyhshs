// Node script using built-in zlib to create crisp PNG icons for PWA and Android
import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer: each scanline has 1 filter byte (0) + width * 4 bytes
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    rawData[rowStart] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelStart = rowStart + 1 + x * 4;
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: deflate
  ihdrData[11] = 0; // Filter: standard
  ihdrData[12] = 0; // Interlace: none

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c ^ buf[n]);
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Icon drawer: Modern emerald-indigo gradient with shopping bag & digital spark
function drawAppIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;
  
  // Background gradient: dark sleek slate #0f172a to #090d16 with emerald-cyan glow
  const distCenter = Math.hypot(nx - 0.5, ny - 0.5);
  
  let bgR = 15, bgG = 23, bgB = 42;
  // Radial glow
  if (distCenter < 0.6) {
    const glow = (1 - distCenter / 0.6);
    bgR = Math.min(255, Math.floor(bgR + 10 * glow));
    bgG = Math.min(255, Math.floor(bgG + 80 * glow));
    bgB = Math.min(255, Math.floor(bgB + 70 * glow));
  }

  // Rounded rectangle for standard icon, full bleed for maskable
  let cornerRadius = isMaskable ? 0 : 0.22;
  if (!isMaskable) {
    // Check squircle bounds
    const cx = Math.abs(nx - 0.5);
    const cy = Math.abs(ny - 0.5);
    const r = 0.5 - cornerRadius;
    if (cx > r && cy > r) {
      const d = Math.hypot(cx - r, cy - r);
      if (d > cornerRadius) {
        return [0, 0, 0, 0]; // Transparent outside squircle
      }
    }
  }

  // Scale factor for content
  const scale = isMaskable ? 0.75 : 0.85;
  const sx = (nx - 0.5) / scale + 0.5;
  const sy = (ny - 0.5) / scale + 0.5;

  // Shopping bag silhouette in center
  // Bag body: x in [0.28, 0.72], y in [0.38, 0.80]
  if (sx >= 0.28 && sx <= 0.72 && sy >= 0.38 && sy <= 0.80) {
    const bagCornerR = 0.04;
    const bx = Math.abs(sx - 0.5);
    const by = sy;
    
    // Gradient inside bag: emerald to electric cyan (#10b981 to #06b6d4)
    const t = (sy - 0.38) / 0.42;
    let r = Math.floor(16 + (6 - 16) * t);
    let g = Math.floor(185 + (182 - 185) * t);
    let b = Math.floor(129 + (212 - 129) * t);

    // Digital lightning/code symbol in bag center
    // Center spark: vertical & diagonal slash
    if (Math.abs(sx - 0.5) < 0.05 && sy >= 0.50 && sy <= 0.68) {
      return [255, 255, 255, 255];
    }
    // Tag star / spark
    const sparkDist = Math.hypot(sx - 0.5, sy - 0.58);
    if (sparkDist < 0.07) {
      return [255, 255, 255, 255];
    }

    return [r, g, b, 255];
  }

  // Bag handle (arc): center at (0.5, 0.38), radius ~0.14, thickness ~0.04
  const hdx = sx - 0.5;
  const hdy = sy - 0.38;
  const hdist = Math.hypot(hdx, hdy);
  if (sy < 0.38 && hdist >= 0.10 && hdist <= 0.15) {
    return [245, 158, 11, 255]; // Golden handle (#f59e0b)
  }

  // Little Android / Digital dots
  if (Math.hypot(sx - 0.76, sy - 0.28) < 0.035) {
    return [52, 211, 153, 255]; // Neon emerald accent
  }
  if (Math.hypot(sx - 0.24, sy - 0.28) < 0.025) {
    return [56, 189, 248, 255]; // Sky blue accent
  }

  return [bgR, bgG, bgB, 255];
}

fs.mkdirSync('./public', { recursive: true });

fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, true)));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));
fs.writeFileSync('./public/favicon.ico', createPNG(64, 64, (x, y, w, h) => drawAppIcon(x, y, w, h, false)));

console.log('PNG icons created successfully in ./public');
