// ============================================================================
// TRIFOLD: IRONMARCH — icon painter
// Generates all PNG icons (web + Android launcher) in pure Node, no deps:
// crossed gold swords on the dark chip gradient, same recipe as the map icon.
// Run: node scripts/make-icons.js
// ============================================================================
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ---------------- PNG encoder (RGBA, 8-bit) ----------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------- painting helpers ----------------
const segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};
const smooth = (d, edge, aa) => Math.max(0, Math.min(1, (edge - d) / aa + 0.5));
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

// ---------------- the icon ----------------
// opts: { maskable } — maskable gets full-bleed bg + smaller art (safe zone).
function paint(size, opts = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const bgTop = hex('#20242f'), bgBot = hex('#12141a');
  const line = hex('#3a3f4d'), gold = hex('#d8b45a');
  const cx = 0.5, cy = 0.5;
  const r = opts.maskable ? 0.185 : 0.26;
  const corner = opts.maskable ? 0 : 0.16;   // rounded-corner radius (fraction)
  const lw = 0.115 * r;                      // blade half-width
  const aa = 1.25 / size;
  const blades = [
    [cx - 0.8 * r, cy - 0.8 * r, cx + 0.7 * r, cy + 0.7 * r],
    [cx + 0.8 * r, cy - 0.8 * r, cx - 0.7 * r, cy + 0.7 * r],
    [cx - 0.95 * r, cy + 0.45 * r, cx - 0.45 * r, cy + 0.95 * r],
    [cx + 0.95 * r, cy + 0.45 * r, cx + 0.45 * r, cy + 0.95 * r],
  ];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + 0.5) / size, v = (y + 0.5) / size;
    // rounded-square coverage
    const qx = Math.abs(u - 0.5), qy = Math.abs(v - 0.5);
    const dCorner = Math.hypot(Math.max(0, qx - (0.5 - corner)), Math.max(0, qy - (0.5 - corner))) - corner;
    const cover = opts.maskable ? 1 : smooth(dCorner, 0, aa);
    let col = mix(bgTop, bgBot, v);
    // faint gold glow behind the blades
    const glow = Math.max(0, 1 - Math.hypot(u - cx, v - cy) / (r * 1.9));
    col = mix(col, gold, glow * glow * 0.14);
    // hairline border
    if (!opts.maskable) col = mix(col, line, smooth(Math.abs(dCorner) - 0.006, 0, aa));
    // blades + guards
    let ink = 0;
    for (const [ax, ay, bx, by] of blades) ink = Math.max(ink, smooth(segDist(u, v, ax, ay, bx, by) - lw, 0, aa));
    col = mix(col, gold, ink);
    const i = (y * size + x) * 4;
    rgba[i] = Math.round(col[0]); rgba[i + 1] = Math.round(col[1]); rgba[i + 2] = Math.round(col[2]);
    rgba[i + 3] = Math.round(cover * 255);
  }
  return encodePNG(size, rgba);
}

// ---------------- outputs ----------------
const ROOT = path.join(__dirname, '..');
const OUT = [
  ['icons/icon-192.png', 192, {}],
  ['icons/icon-512.png', 512, {}],
  ['icons/icon-maskable-512.png', 512, { maskable: true }],
  ['android/app/src/main/res/mipmap-mdpi/ic_launcher.png', 48, {}],
  ['android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 72, {}],
  ['android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 96, {}],
  ['android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 144, {}],
  ['android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 192, {}],
];
for (const [rel, size, opts] of OUT) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, paint(size, opts));
  console.log(`${rel}  ${size}×${size}`);
}
