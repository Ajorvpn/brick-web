import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WebGLBoundary } from "./webgl_boundary";

function Exploding({ message }: { message: string }): never {
  throw new Error(message);
}

describe("WebGLBoundary", () => {
  it("renders the scene while the context is healthy", () => {
    render(
      <WebGLBoundary fallback={<p>static</p>}>
        <p>canvas</p>
      </WebGLBoundary>,
    );
    expect(screen.getByText("canvas")).toBeInTheDocument();
    expect(screen.queryByText("static")).not.toBeInTheDocument();
  });

  it("swaps in the fallback and reports once when context creation throws", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const on_error = vi.fn();

    render(
      <WebGLBoundary fallback={<p>static</p>} on_error={on_error}>
        <Exploding message="THREE.WebGLRenderer: Error creating WebGL context." />
      </WebGLBoundary>,
    );

    expect(screen.getByText("static")).toBeInTheDocument();
    expect(on_error).toHaveBeenCalledTimes(1);
    expect(on_error.mock.calls[0]?.[0]).toBeInstanceOf(Error);

    error.mockRestore();
    warn.mockRestore();
  });
});
