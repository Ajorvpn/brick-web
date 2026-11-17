import { describe, expect, it } from "vitest";
import {
  BRICK_SIZE,
  COURSES,
  JOINT,
  MEDALLION_SIZE,
  SOCKET_COURSE,
  STEP_X,
  STEP_Y,
  course_centre_y,
  make_wall_layout,
  zone_of,
} from "./brick_library";

const COLS = 17;
const layout = make_wall_layout(COLS);
const course = (c: number) =>
  layout.filter((u) => u.course === c).sort((a, b) => a.x - b.x);

describe("the wall is complete", () => {
  it("has all 24 courses", () => {
    for (let c = 0; c < COURSES; c++) {
      expect(course(c).length, `course ${c}`).toBeGreaterThan(0);
    }
    expect(Math.max(...layout.map((u) => u.course))).toBe(COURSES - 1);
  });

  it("is deterministic: the same seed builds the same wall", () => {
    expect(make_wall_layout(COLS)).toEqual(layout);
  });

  it("is wider than any framing the camera uses", () => {
    const span = Math.max(...layout.map((u) => u.x)) - Math.min(...layout.map((u) => u.x));
    expect(span).toBeGreaterThan(30);
  });
});

describe("masonry", () => {
  it("runs the plinth in a true running bond", () => {
    const even = course(0).map((u) => u.x);
    const odd = course(1).map((u) => u.x);
    const grid = (x: number) => {
      const r = Math.round(x / (STEP_X / 2));
      return ((r % 2) + 2) % 2;
    };
    const evenSet = even.map(grid);
    const oddSet = odd.map(grid);
    // one course sits on the stretcher grid, the other on the half-brick grid
    expect(new Set(evenSet).size).toBe(1);
    expect(new Set(oddSet).size).toBe(1);
    // exactly one half-brick apart, so no vertical joint lines up
    expect(Math.abs(evenSet[0]! - oddSet[0]!)).toBe(1);
  });

  it("leaves mortar, not gaps, between neighbours", () => {
    const units = course(0);
    for (let i = 1; i < units.length; i++) {
      const gap = units[i]!.x - units[i - 1]!.x - BRICK_SIZE[0];
      expect(gap).toBeCloseTo(JOINT, 6);
    }
  });

  it("stacks courses exactly one brick and one joint apart", () => {
    expect(STEP_Y).toBeCloseTo(BRICK_SIZE[1] + JOINT, 6);
    for (let c = 1; c < COURSES; c++) {
      expect(course_centre_y(c) - course_centre_y(c - 1)).toBeCloseTo(STEP_Y, 6);
    }
  });

  it("alternates stretchers and headers in the bonding band", () => {
    const widths = course(8)
      .map((u) => Math.round(u.sx * BRICK_SIZE[0] * 100) / 100)
      .filter((w) => w > 0.5);
    const unique = [...new Set(widths)];
    expect(unique.length).toBeGreaterThan(1);
    expect(Math.min(...widths)).toBeLessThan(BRICK_SIZE[0] * 0.6);
    expect(Math.max(...widths)).toBeCloseTo(BRICK_SIZE[0], 1);
  });

  it("glazes headers along the band", () => {
    const glazed = course(9).filter((u) => u.variant === "glaze");
    expect(glazed.length).toBeGreaterThan(2);
  });

  it("stands soldiers on end in the frieze", () => {
    const soldiers = layout.filter(
      (u) => zone_of(u.course) === "frieze" && Math.abs(u.rot_z - Math.PI / 2) < 1e-6,
    );
    expect(soldiers.length).toBeGreaterThan(10);
    for (const s of soldiers) {
      // a soldier spans three courses, minus its joint
      expect(s.sx * BRICK_SIZE[0]).toBeCloseTo(3 * STEP_Y - JOINT, 5);
      expect(s.sy * BRICK_SIZE[1]).toBeLessThan(BRICK_SIZE[1]);
    }
  });
});

describe("the socket and the medallion", () => {
  it("leaves the crown course's centre socket empty", () => {
    expect(SOCKET_COURSE).toBe(COURSES - 1);
    const crown = course(SOCKET_COURSE);
    expect(crown.filter((u) => Math.abs(u.x) < BRICK_SIZE[0] * 0.51)).toHaveLength(0);
    // and the bricks either side are there to receive it
    expect(crown.filter((u) => u.x < 0).length).toBeGreaterThan(2);
    expect(crown.filter((u) => u.x > 0).length).toBeGreaterThan(2);
  });

  it("builds the medallion from six glazed units, three by two", () => {
    const medallion = layout.filter((u) => u.medallion);
    expect(medallion).toHaveLength(6);
    expect(new Set(medallion.map((u) => u.course))).toEqual(new Set([12, 13]));
    expect(new Set(medallion.map((u) => u.x))).toEqual(
      new Set([-STEP_X, 0, STEP_X]),
    );
    for (const u of medallion) expect(u.variant).toBe("glaze");
    // the plaque that sits over them is the same shape
    expect(MEDALLION_SIZE[0]).toBeCloseTo(3 * STEP_X - JOINT, 6);
    expect(MEDALLION_SIZE[1]).toBeCloseTo(2 * STEP_Y - JOINT, 6);
  });
});

describe("variety", () => {
  it("keeps the lion-and-sun rare", () => {
    const emblems = layout.filter((u) => u.variant === "stamp-lionsun");
    expect(emblems.length).toBeGreaterThanOrEqual(1);
    expect(emblems.length).toBeLessThanOrEqual(6);
  });

  it("mixes every fired tone", () => {
    for (const tone of [
      "clay-sand",
      "clay-warm",
      "clay-rose",
      "clay-smoked",
      "clay-pale",
      "clay-burnt",
    ]) {
      expect(layout.some((u) => u.variant === tone), tone).toBe(true);
    }
  });

  it("never repeats a variant in the unit next door", () => {
    let clashes = 0;
    for (let c = 0; c < COURSES; c++) {
      const units = course(c);
      for (let i = 1; i < units.length; i++) {
        const gap = Math.abs(units[i]!.x - units[i - 1]!.x);
        if (gap < STEP_X * 0.9 && units[i]!.variant === units[i - 1]!.variant) {
          clashes += 1;
        }
      }
    }
    // the RNG is allowed to lose the argument a few times, not often
    expect(clashes).toBeLessThan(layout.length * 0.04);
  });

  it("tints and jitters every unit independently", () => {
    expect(new Set(layout.map((u) => u.tint.toFixed(4))).size).toBeGreaterThan(
      layout.length * 0.9,
    );
    for (const u of layout) {
      expect(Math.abs(u.jitter[0])).toBeLessThan(0.005);
      expect(Math.abs(u.jitter[1])).toBeLessThan(0.007);
    }
  });
});