/**
 * shot.mjs — one frame at one progress value, for iterating on the look.
 *   node shot.mjs <url> <w> <h> <p> <out.png>
 */
import { launch, openPage, urlWith, waitForScene, setProgress } from "./lib/capture.mjs";

const [url = "http://localhost:3007/", w = "1440", h = "900", p = "0", out = "/tmp/shot.png"] =
  process.argv.slice(2);

const browser = await launch();
const { page, errors } = await openPage(browser, {
  url: urlWith(url),
  width: Number(w),
  height: Number(h),
});
await waitForScene(page);
await setProgress(page, Number(p));
await page.screenshot({ path: out });
console.log("wrote", out, errors.length ? `errors: ${errors.slice(0, 4).join(" | ")}` : "");
await browser.close();
