import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { resetWebglProbeCache } from "@/lib/quality";
import { BrickStory } from "./brick_story";

/**
 * The regression this guards: on a browser with no WebGL (hardware
 * acceleration off, sandboxed GPU, exhausted context budget) the story used to
 * mount <Canvas> anyway and three.js answered by throwing.
 *
 * It also guards the two things that replaced the old CSS brick: the baked
 * poster is what paints in that case, and the story reserves no scroll
 * distance, so a static hero never leaves four screens of nothing.
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

  it("shows the finished-wall poster and reserves no scroll distance", () => {
    render(<BrickStory />);

    const story = screen.getByRole("region", { name: "Brick story" });
    expect(story.className).toContain("h-screen");
    expect(story.querySelector("canvas")).toBeNull();
    const poster = document.querySelector<HTMLImageElement>(
      "[data-brick-frame] img",
    );
    expect(poster).not.toBeNull();
    expect(poster).toHaveAttribute("src", "/bricks/poster-wall.webp");
  });

  it("keeps the captions as real text, with no placeholder copy", () => {
    render(<BrickStory />);

    expect(screen.getByText("One brick.")).toBeInTheDocument();
    expect(screen.getByText("It finds its place.")).toBeInTheDocument();
    expect(
      screen.getByText("Every stage, a stamped brick."),
    ).toBeInTheDocument();
    expect(screen.getByText("Built in the open.")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/placeholder/i);
  });

  it("marks the scene layer decorative", () => {
    render(<BrickStory />);
    const frame = document.querySelector("[data-brick-frame]");
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute("aria-hidden", "true");
  });
});