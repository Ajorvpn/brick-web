/**
 * check-reduced.mjs — reduced-motion path: poster, no camera, no canvas loop.
 *   node check-reduced.mjs [baseUrl]
 */
import { mkdir } from "node:fs/promises";
import { launch, openPage, urlWith } from "./lib/capture.mjs";

const BASE = process.argv[2] ?? "http://localhost:3008/";
const OUT = "/tmp/reduced";
await mkdir(OUT, { recursive: true });

const browser = await launch();
const { page } = await openPage(browser, {
  url: urlWith(BASE, "debug=1&quality=high"),
  width: 1440,
  height: 900,
  reducedMotion: "reduce",
});
await page.waitForTimeout(9000);

const state = await page.evaluate(() => {
  const frame = document.querySelector("[data-brick-frame]");
  const img = frame?.querySelector("img");
  return {
    mode: document.documentElement.dataset.brickStory ?? null,
    canvas: !!frame?.querySelector("canvas"),
    posterOpacity: img?.style.opacity ?? null,
    posterSrc: img?.getAttribute("src") ?? null,
    frameFilter: frame?.style.filter ?? "",
    frameTransform: frame?.style.transform ?? "",
    hook: typeof window.__brick,
    storyHeight: document.querySelector("[data-brick-story]")?.getBoundingClientRect().height ?? 0,
  };
});
console.log(JSON.stringify(state, null, 2));

await page.screenshot({ path: `${OUT}/top.png` });
await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/scrolled.png` });
await browser.close();
