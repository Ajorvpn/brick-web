import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * jsdom ships neither matchMedia nor IntersectionObserver, yet components read
 * both while mounting (`prefers-reduced-motion`, `(pointer: coarse)`, and the
 * viewport-entry observer inside Reveal). These are the smallest honest stubs:
 * nothing matches, and nothing is ever observed.
 */
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

if (
  typeof window !== "undefined" &&
  typeof window.IntersectionObserver === "undefined"
) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
});
