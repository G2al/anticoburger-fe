// Genera wordmark trasparenti e icone PWA a partire dai loghi ufficiali in public/images.
// Uso: npm run icons
//
// Il logo non viene ridisegnato: si ritaglia solo il margine vuoto e si usa la luminanza
// del logo nero su bianco come canale alfa, così forma e proporzioni restano identiche.
// Le icone riproducono il logo ufficiale "bianco su bordeaux" (#311713, colore del file originale).

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "public/images/logo-with-bgwhite-and-title-black.png");
const brandDir = path.join(root, "public/brand");
const iconsDir = path.join(root, "public/icons");
const appDir = path.join(root, "src/app");

const BORDEAUX = { r: 49, g: 23, b: 19, alpha: 1 };

/** Restituisce il wordmark ritagliato come maschera alfa (255 = inchiostro). */
async function loadWordmarkMask() {
  const { data, info } = await sharp(source)
    .trim({ threshold: 10 })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const alpha = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = 255 - data[i];
  return { alpha, width: info.width, height: info.height };
}

/** Wordmark monocromatico su fondo trasparente. */
function coloredWordmark(mask, rgb) {
  const pixels = Buffer.alloc(mask.width * mask.height * 4);
  for (let i = 0; i < mask.alpha.length; i++) {
    pixels[i * 4] = rgb[0];
    pixels[i * 4 + 1] = rgb[1];
    pixels[i * 4 + 2] = rgb[2];
    pixels[i * 4 + 3] = mask.alpha[i];
  }
  return sharp(pixels, { raw: { width: mask.width, height: mask.height, channels: 4 } });
}

/** Icona quadrata: wordmark bianco centrato su bordeaux, largo `ratio` del lato. */
async function squareIcon(mask, size, ratio, output) {
  const width = Math.round(size * ratio);
  const wordmark = await coloredWordmark(mask, [255, 255, 255]).resize({ width }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BORDEAUX } })
    .composite([{ input: wordmark, gravity: "center" }])
    .flatten({ background: BORDEAUX })
    .png({ compressionLevel: 9 })
    .toFile(output);
  console.log("✓", path.relative(root, output));
}

async function main() {
  await mkdir(brandDir, { recursive: true });
  await mkdir(iconsDir, { recursive: true });

  const mask = await loadWordmarkMask();

  for (const [name, rgb] of [
    ["wordmark-dark.png", [0, 0, 0]],
    ["wordmark-light.png", [255, 255, 255]],
    // Bordeaux del brand: usato nell'intestazione del menu.
    ["wordmark-bordeaux.png", [49, 23, 19]],
  ]) {
    const output = path.join(brandDir, name);
    await coloredWordmark(mask, rgb).png({ compressionLevel: 9 }).toFile(output);
    console.log("✓", path.relative(root, output), `${mask.width}×${mask.height}`);
  }

  // "any": il wordmark occupa gran parte dell'icona.
  await squareIcon(mask, 192, 0.8, path.join(iconsDir, "icon-192.png"));
  await squareIcon(mask, 512, 0.8, path.join(iconsDir, "icon-512.png"));
  // "maskable": tutto il wordmark resta nel cerchio di sicurezza (raggio 40% del lato).
  await squareIcon(mask, 192, 0.66, path.join(iconsDir, "maskable-192.png"));
  await squareIcon(mask, 512, 0.66, path.join(iconsDir, "maskable-512.png"));
  // Convenzioni file di Next: favicon e apple-touch-icon.
  await squareIcon(mask, 180, 0.8, path.join(appDir, "apple-icon.png"));
  await squareIcon(mask, 96, 0.86, path.join(appDir, "icon.png"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
