/**
 * frame.mjs — one deterministic frame of the story, for iterating on the look.
 *   node frame.mjs <url> <w> <h> <p> <out.png> [--wait=ms]
 */
import { launch, openPage, urlWith, waitForHook, setProgress } from "./lib/capture.mjs";

const args = process.argv.slice(2);
const waitArg = args.find((a) => a.startsWith("--wait="));
const [url = "http://localhost:3007/", w = "1440", h = "900", p = "0", out = "/tmp/frame.png"] =
  args.filter((a) => !a.startsWith("--"));
const wait = waitArg ? Number(waitArg.split("=")[1]) : 1200;

const browser = await launch();
const { page, errors } = await openPage(browser, {
  url: urlWith(url),
  width: Number(w),
  height: Number(h),
});
await waitForHook(page, { settle: 9000 });
await setProgress(page, Number(p), wait);
await page.screenshot({ path: out, timeout: 120_000 });
console.log("wrote", out, errors.length ? `\nconsole: ${errors.slice(0, 4).join("\n")}` : "no console errors");
await browser.close();
