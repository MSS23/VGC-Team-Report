/**
 * Generates a minimal valid 1200x630 PNG at public/og-default.png
 * using only Node.js built-ins (zlib + fs). No external dependencies.
 *
 * Color: #0B0B1A (the VGC Team Report dark background)
 */

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "og-default.png");

const WIDTH = 1200;
const HEIGHT = 630;

// VGC brand background: #0B0B1A
const R = 0x0b;
const G = 0x0b;
const B = 0x1a;

// --- PNG helpers ---

function u32be(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  // CRC-32 table
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = u32be(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBytes = u32be(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBytes]);
}

// IHDR: 1200x630, 8-bit RGB, no interlace
function makeIHDR(w, h) {
  const data = Buffer.allocUnsafe(13);
  data.writeUInt32BE(w, 0);
  data.writeUInt32BE(h, 4);
  data[8] = 8;  // bit depth
  data[9] = 2;  // color type: RGB
  data[10] = 0; // compression
  data[11] = 0; // filter
  data[12] = 0; // interlace
  return chunk("IHDR", data);
}

// Build raw image data: filter byte (0) + RGB pixels per row
function makeIDATRaw(w, h, r, g, b) {
  // Each row: 1 filter byte + W*3 RGB bytes
  const rowSize = 1 + w * 3;
  const raw = Buffer.allocUnsafe(rowSize * h);
  for (let y = 0; y < h; y++) {
    const offset = y * rowSize;
    raw[offset] = 0; // filter type None
    for (let x = 0; x < w; x++) {
      const px = offset + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  return raw;
}

function makePNG(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); // PNG signature
  const ihdr = makeIHDR(w, h);
  const rawPixels = makeIDATRaw(w, h, r, g, b);
  const compressed = deflateSync(rawPixels, { level: 9 });
  const idat = chunk("IDAT", compressed);
  const iend = chunk("IEND", Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const png = makePNG(WIDTH, HEIGHT, R, G, B);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`Generated ${OUT} (${png.length} bytes, ${WIDTH}x${HEIGHT} #0B0B1A)`);
