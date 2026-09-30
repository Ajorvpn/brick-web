import { describe, expect, it } from "vitest";
import {
  make_wall_layout,
  HERO_SLOT,
  WALL_BASE_Y,
  STEP_X,
  STEP_Y,
  FALL_DURATION,
} from "./brick_wall";
import { BRICK_SIZE } from "./brick_geometry";

const ROWS = 6;
const COLS = 4;
const layout = make_wall_layout();

const course = (r: number) => layout.filter((b) => b.course === r);

describe("running-bond masonry", () => {
  it("is complete: full courses, all rows, no missing units", () => {
    expect(layout).toHaveLength(ROWS * (COLS + 1));
    for (let r = 0; r < ROWS; r++) {
      expect(course(r), `course ${r}`).toHaveLength(COLS + 1);
    }
  });

  it("offsets every other course by exactly half a brick", () => {
    const even = course(0)
      .map((b) => b.home[0])
      .sort((a, b) => a - b);
    const odd = course(1)
      .map((b) => b.home[0])
      .sort((a, b) => a - b);
    expect(odd).toHaveLength(even.length);
    odd.forEach((x, i) => {
      // same span, shifted half a unit sideways: no joint lines up
      expect(x).toBeCloseTo(even[i]! - STEP_X / 2, 6);
    });
  });

  it("leaves no gaps inside a course", () => {
    for (let r = 0; r < ROWS; r++) {
      const xs = course(r)
        .map((b) => b.home[0])
        .sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) {
        expect(xs[i]! - xs[i - 1]!).toBeCloseTo(STEP_X, 6);
      }
    }
  });

  it("never places two units in the same slot", () => {
    const slots = new Set(
      layout.map((b) => `${b.home[0].toFixed(4)}|${b.home[1].toFixed(4)}`),
    );
    expect(slots.size).toBe(layout.length);
  });
});

describe("bottom-anchored, built upward", () => {
  it("anchors the base course at WALL_BASE_Y and stacks upward", () => {
    const base = course(0)[0]!;
    expect(base.home[1] - BRICK_SIZE[1] / 2).toBeCloseTo(WALL_BASE_Y, 6);
    for (let r = 1; r < ROWS; r++) {
      expect(course(r)[0]!.home[1] - course(r - 1)[0]!.home[1]).toBeCloseTo(
        STEP_Y,
        6,
      );
    }
  });

  it("lays each course only after the one below is complete", () => {
    for (let r = 1; r < ROWS; r++) {
      const below = Math.max(...course(r - 1).map((b) => b.delay));
      const above = Math.min(...course(r).map((b) => b.delay));
      // no unit can be in the air above an unfinished row
      expect(above).toBeGreaterThan(below);
    }
  });

  it("finishes the whole build with room to spare", () => {
    const last = Math.max(...layout.map((b) => b.delay));
    expect(last + FALL_DURATION).toBeLessThan(1);
  });
});

describe("every unit falls onto the wall", () => {
  it("starts directly above its own slot", () => {
    for (const b of layout) {
      expect(b.from[0]).toBeCloseTo(b.home[0], 6);
      expect(b.from[2]).toBeCloseTo(b.home[2], 6);
    }
  });

  it("moves strictly downward, never up", () => {
    for (const b of layout) {
      expect(b.from[1]).toBeGreaterThan(b.home[1]);
      // and clears the top of the structure below it, so the drop onto the
      // newest course always reads as a drop
      expect(b.from[1] - b.home[1]).toBeGreaterThanOrEqual(STEP_Y);
    }
  });

  it("seats the hero brick in the centre of the base course", () => {
    const hero = layout.filter((b) => b.is_hero_slot);
    expect(hero).toHaveLength(1);
    expect(hero[0]!.course).toBe(0);
    expect(hero[0]!.home[0]).toBeCloseTo(0, 6);
    expect(hero[0]!.home[1]).toBeCloseTo(HERO_SLOT[1], 6);
    expect(hero[0]!.home[2]).toBeCloseTo(HERO_SLOT[2], 6);
  });

  it("keeps the resting pose off a perfect grid", () => {
    const jittered = layout.filter(
      (b) =>
        Math.abs(b.jitter[0]) > 0 || Math.abs(b.jitter[1]) > 0 || Math.abs(b.jitter[2]) > 0,
    );
    expect(jittered).toHaveLength(layout.length);
    for (const b of layout) {
      expect(Math.abs(b.jitter[0])).toBeLessThan(0.02);
      expect(Math.abs(b.jitter[1])).toBeLessThan(0.02);
    }
  });

  it("varies tone per unit and mirrors about half the face texture", () => {
    const tones = new Set(layout.map((b) => b.tone.toFixed(4)));
    expect(tones.size).toBeGreaterThan(layout.length * 0.9);
    const flipped = layout.filter((b) => b.flip).length;
    expect(flipped).toBeGreaterThan(layout.length * 0.25);
    expect(flipped).toBeLessThan(layout.length * 0.75);
  });
});
