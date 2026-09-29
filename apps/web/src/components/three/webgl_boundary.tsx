"use client";

import { Component, type ReactNode } from "react";

export interface webgl_boundary_props {
  children: ReactNode;
  /** what to render instead, once, when the scene cannot run */
  fallback: ReactNode;
  /** fired once after the scene has been replaced by the fallback */
  on_error?: (error: Error) => void;
}

interface webgl_boundary_state {
  failed: boolean;
}

/**
 * WebGLBoundary — the last line of defence around a <Canvas/>.
 *
 * isWebglAvailable() covers the common case, but a context can still fail to
 * materialise: the page's small context budget can be spent by the time the
 * scene mounts, the GPU process can die between probe and mount, or a driver
 * reset can take the context with it. three.js answers all of those by
 * throwing from WebGLRenderer — without this boundary that surfaces as an
 * unhandled console error and a hero that renders nothing at all.
 */
export class WebGLBoundary extends Component<
  webgl_boundary_props,
  webgl_boundary_state
> {
  state: webgl_boundary_state = { failed: false };

  static getDerivedStateFromError(): webgl_boundary_state {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    // One line of context for QA; what the visitor sees is the CSS
    // composition, which is a designed state, not a failure screen.
    console.warn(
      "[brick] 3D scene unavailable — using the static composition:",
      error?.message ?? error,
    );
    this.props.on_error?.(error);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
