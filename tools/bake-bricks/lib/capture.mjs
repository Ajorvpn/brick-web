/**
 * Headless capture for the bake (poster frames, UI sprites) and for the
 * mandatory visual review. Chromium runs on SwiftShader here, so the tier is
 * forced to the one a real machine would get (`?quality=high`) and every
 * frame waits for the scene to have actually drawn.
 */
import { chromium } from "playwright";

export const CHROMIUM_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
  "--disable-lcd-text",
  "--force-color-profile=srgb",
];

export async function launch() {
  return chromium.launch({ args: CHROMIUM_ARGS });
}

export async function openPage(browser, { url, width, height, dpr = 1, reducedMotion = "no-preference" }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    reducedMotion,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180_000 });
  return { context, page, errors };
}

/** Wait only for the debug hook: enough to drive progress by hand. */
export async function waitForHook(page, { timeout = 180_000, settle = 8000 } = {}) {
  await page.waitForFunction(
    () => typeof window.__brick?.setProgress === "function",
    undefined,
    { timeout },
  );
  await page.waitForTimeout(settle);
}

/** Wait until the debug hook exists and the poster has handed over to WebGL. */
export async function waitForScene(page, { timeout = 180_000 } = {}) {
  await page.waitForFunction(
    () => typeof window.__brick?.setProgress === "function",
    undefined,
    { timeout },
  );
  await page.waitForFunction(
    () => {
      const img = document.querySelector("[data-brick-frame] img");
      return img && img.style.opacity === "0";
    },
    undefined,
    { timeout },
  );
  // Software rendering runs at ~1 fps here: give the first frames real time.
  await page.waitForTimeout(2500);
}

export async function setProgress(page, p, settle = 900) {
  await page.evaluate((value) => window.__brick?.setProgress(value), p);
  await page.waitForTimeout(settle);
}

export function urlWith(origin, flags = "debug=1&quality=high") {
  return `${origin}${origin.includes("?") ? "&" : "?"}${flags}`;
}