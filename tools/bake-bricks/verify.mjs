/**
 * verify.mjs — Section 9 of the brief: one frame per beat, per viewport.
 *
 * Loads the page once per viewport and drives window.__brick.setProgress()
 * directly, so every frame is deterministic and nothing depends on scrolling.
 *
 *   node verify.mjs [baseUrl] [outDir]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { launch, openPage, urlWith, waitForHook, setProgress } from "./lib/capture.mjs";

const BASE = process.argv[2] ?? "http://localhost:3008/";
const OUT = process.argv[3] ?? "/tmp/verify";
const ONLY = process.env.ONLY ? process.env.ONLY.split(",").map(Number) : null;
const VIEWPORTS = [
  { w: 390, h: 844, q: "medium", dpr: 1 },
  { w: 768, h: 1024, q: "medium", dpr: 1 },
  { w: 1440, h: 900, q: "high", dpr: 1 },
];
const PROGRESS = process.env.PROGRESS
  ? process.env.PROGRESS.split(",").map(Number)
  : [0, 0.2, 0.3, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.95];

await mkdir(OUT, { recursive: true });
const browser = await launch();

for (const vp of VIEWPORTS.filter((v) => !ONLY || ONLY.includes(v.w))) {
  const { page, errors } = await openPage(browser, {
    url: urlWith(BASE, `debug=1&quality=${vp.q}`),
    width: vp.w,
    height: vp.h,
    dpr: vp.dpr,
  });
  await waitForHook(page, { settle: 9000 });
  for (const p of PROGRESS) {
    await setProgress(page, p, 3500);
    await page.screenshot({
      path: `${OUT}/${vp.w}x${vp.h}-${p}.png`,
      timeout: 180_000,
    });
  }
  const real = errors.filter((e) => !/404/.test(e));
  await writeFile(`${OUT}/${vp.w}x${vp.h}-console.txt`, real.join("\n"));
  console.log(`${vp.w}x${vp.h} done — ${real.length} console errors`);
  await page.context().close();
}

await browser.close();
console.log("frames in", OUT);
