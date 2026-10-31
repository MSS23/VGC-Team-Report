/**
 * Generates maskable PWA icons from the base app icons.
 *
 * Maskable icons must keep their content inside the central ~80% safe zone
 * (Android adaptive icons crop to circles/squircles). We scale the existing
 * artwork to 80% of the canvas and center it on a solid full-bleed
 * background matching the manifest's background_color.
 *
 * Usage: node scripts/generate-maskable-icon.mjs
 */
import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "public");
const BACKGROUND = "#0a0f1a"; // manifest background_color

async function generate(srcName, outName, size) {
  const safe = Math.round(size * 0.8);
  const art = await sharp(join(PUBLIC, srcName))
    .resize(safe, safe, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toFile(join(PUBLIC, outName));

  console.log(`OK: ${outName} (${size}x${size}, art ${safe}px on ${BACKGROUND})`);
}

await generate("icon-512.png", "icon-512-maskable.png", 512);
await generate("icon-192.png", "icon-192-maskable.png", 192);
