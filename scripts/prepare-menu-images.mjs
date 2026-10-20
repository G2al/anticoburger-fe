// Prepara gli sfondi delle schede del menu a partire dagli originali in assets/menu (fuori da public).
// Ritaglia gli angoli arrotondati già presenti nell'immagine (li disegna il CSS) e produce WebP leggeri.
// Le foto dei prodotti arrivano dal backend (Filament): qui non servono.
// Uso: npm run menu-images

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "assets/menu");
const outputDir = path.join(root, "public/menu");
const backgrounds = [
  { source: "Pannello bordeaux con pennellate grunge.png", output: "bg-dark.webp" },
  { source: "Banner Pergamena Beige con Pennellata.png", output: "bg-light.webp" },
];

/**
 * Raggio dell'angolo arrotondato, misurato sulla diagonale dell'angolo in alto a sinistra:
 * il primo pixel opaco sta a r·(1 − 1/√2) dal vertice, quindi r ≈ d · 3.414.
 * (Il bordo superiore è semitrasparente: una misura sulla prima riga non è affidabile.)
 */
function cornerRadius(data, info) {
  let d = 0;
  while (d < info.height / 2 && data[(d * info.width + d) * info.channels + 3] < 250) d++;
  return Math.round(d * 3.414);
}

await mkdir(outputDir, { recursive: true });

for (const { source, output } of backgrounds) {
  const trimmed = await sharp(path.join(sourceDir, source)).trim().png().toBuffer();
  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Togliendo il raggio a sinistra e a destra non resta alcun angolo arrotondato.
  const inset = cornerRadius(data, info) + 4;
  const result = await sharp(trimmed)
    .extract({ left: inset, top: 8, width: info.width - inset * 2, height: info.height - 16 })
    .resize({ width: 1600, withoutEnlargement: true })
    .flatten()
    .webp({ quality: 82 })
    .toFile(path.join(outputDir, output));
  console.log(`✓ public/menu/${output} ${result.width}×${result.height} (angolo ${inset}px) ${Math.round(result.size / 1024)} KB`);
}
