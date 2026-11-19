/**
 * capture-posters.mjs — the two stills the page paints before WebGL exists.
 *
 *   node capture-posters.mjs [baseUrl]
 *
 * poster-hero: progress 0 (the keystone in the dark)
 * poster-wall: progress ~0.62 (the wall, after the lay)
 * Both are flattened onto the page ink so they never show through as holes.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { launch, openPage, urlWith, waitForHook, setProgress } from "./lib/capture.mjs";

const BASE = process.argv[2] ?? "http://localhost:3008/";
const OUT = fileURLToPath(new URL("../../apps/web/public/bricks/", import.meta.url)).replace(/\/$/, "");

const browser = await launch();
const { page } = await openPage(browser, {
  url: urlWith(BASE),
  width: 1440,
  height: 900,
});
await waitForHook(page, { settle: 9000 });

const shots = [
  { p: 0, file: "poster-hero.webp" },
  { p: 0.62, file: "poster-wall.webp" },
];

for (const shot of shots) {
  await setProgress(page, shot.p, 4500);
  const canvas = page.locator("[data-brick-frame] canvas");
  const png = await canvas.screenshot({ timeout: 180_000 });
  const abs = path.join(OUT, shot.file);
  await sharp(png)
    .resize({ width: 1600 })
    .flatten({ background: "#08080a" })
    .webp({ quality: 82, effort: 6 })
    .toFile(abs);
  console.log("wrote", abs);
}

await browser.close();
