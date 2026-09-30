import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmbientBackdrop } from "@/components/sections/ambient_backdrop";
import { GlassPointer } from "./glass_pointer";
import {
  GlassLensProvider,
  GLASS_DISTORTION_ID,
  GLASS_LENS_ATTR,
} from "./glass_lens_provider";

afterEach(() => {
  document.documentElement.removeAttribute(GLASS_LENS_ATTR);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Fine pointer, so the cursor-glow path is live. */
function stub_fine_pointer() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("hover: hover"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
}

describe("AmbientBackdrop", () => {
  it("renders the drifting blobs behind everything, decoratively", () => {
    const { container } = render(<AmbientBackdrop />);
    expect(container.querySelector(".aurora")).not.toBeNull();
    expect(container.querySelectorAll(".aurora-blob")).toHaveLength(4);
    expect(container.querySelector(".aurora-veil")).not.toBeNull();
    expect(screen.getByTestId("ambient-backdrop")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

describe("GlassPointer", () => {
  it("writes the cursor position as custom properties, without re-rendering", async () => {
    stub_fine_pointer();
    const { container } = render(
      <>
        <GlassPointer />
        <div className="glass glass-2" data-testid="panel" />
      </>,
    );
    const panel = container.querySelector<HTMLElement>("[data-testid=panel]")!;
    panel.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;

    panel.dispatchEvent(
      new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 100,
        clientY: 50,
      }),
    );

    await vi.waitFor(() => {
      expect(panel.style.getPropertyValue("--mx")).toBe("50%");
      expect(panel.style.getPropertyValue("--my")).toBe("50%");
    });
  });

  it("stays inert on coarse pointers", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    const { container } = render(
      <>
        <GlassPointer />
        <div className="glass glass-2" data-testid="panel" />
      </>,
    );
    const panel = container.querySelector<HTMLElement>("[data-testid=panel]")!;
    panel.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect;

    panel.dispatchEvent(
      new MouseEvent("pointermove", { bubbles: true, clientX: 10, clientY: 10 }),
    );

    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(panel.style.getPropertyValue("--mx")).toBe("");
  });
});

describe("GlassLensProvider", () => {
  it("mounts the displacement filter Chromium refracts through", () => {
    const { container } = render(<GlassLensProvider />);
    const filter = container.querySelector(`#${GLASS_DISTORTION_ID}`);
    expect(filter).not.toBeNull();
    expect(filter!.querySelector("feTurbulence")).not.toBeNull();
    expect(filter!.querySelector("feGaussianBlur")).not.toBeNull();
    const displacement = filter!.querySelector("feDisplacementMap");
    expect(displacement).not.toBeNull();
    expect(displacement!.getAttribute("scale")).toBe("40");
    expect(displacement!.getAttribute("xChannelSelector")).toBe("R");
    expect(displacement!.getAttribute("yChannelSelector")).toBe("G");
  });

  it("only turns refraction on when the engine supports it", () => {
    vi.stubGlobal("CSS", { supports: () => true });
    render(<GlassLensProvider />);
    expect(document.documentElement.getAttribute(GLASS_LENS_ATTR)).toBe("on");
    vi.unstubAllGlobals();

    document.documentElement.removeAttribute(GLASS_LENS_ATTR);
    vi.stubGlobal("CSS", { supports: () => false });
    render(<GlassLensProvider />);
    expect(document.documentElement.getAttribute(GLASS_LENS_ATTR)).toBe("off");
    vi.unstubAllGlobals();
  });

  it("falls back to 'off' when the engine has no CSS.supports at all", () => {
    vi.stubGlobal("CSS", undefined);
    render(<GlassLensProvider />);
    expect(document.documentElement.getAttribute(GLASS_LENS_ATTR)).toBe("off");
    vi.unstubAllGlobals();
  });
});
