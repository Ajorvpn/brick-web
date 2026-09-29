import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { resetWebglProbeCache } from "@/lib/quality";
import { BrickStory } from "./brick_story";

/**
 * The regression this guards: on a browser with no WebGL (hardware
 * acceleration off, sandboxed GPU, exhausted context budget) the story used to
 * mount <Canvas> anyway and three.js answered by throwing —
 * "THREE.WebGLRenderer: A WebGL context could not be created". jsdom has no
 * GL binding, so it reproduces that browser faithfully.
 */
describe("BrickStory without WebGL", () => {
  afterEach(() => {
    resetWebglProbeCache();
    vi.restoreAllMocks();
  });

  it("never asks for a GL context", () => {
    const get_context = vi.spyOn(HTMLCanvasElement.prototype, "getContext");

    render(<BrickStory />);

    for (const call of get_context.mock.calls) {
      expect(String(call[0])).not.toMatch(/webgl/i);
    }
  });

  it("shows the static composition and reserves no scroll distance", () => {
    render(<BrickStory />);

    const story = screen.getByRole("region", { name: "Brick story" });
    expect(story.className).toContain("h-screen");
    expect(story.className).not.toContain("380vh");
    expect(story.querySelector("canvas")).toBeNull();
    expect(story.querySelector("[data-hero-brick]")).not.toBeNull();
  });
});
