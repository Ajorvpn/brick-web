/**
 * The wall, as data.
 *
 * One unit = 10 cm. A stretcher is 2.2 x 0.55 x 1.05 units (22 x 5.5 x 10.5
 * cm) — a real fired brick, a little longer than the European 21, because
 * the wall is meant to read as Persian masonry. The joint is 0.12 (1.2 cm),
 * noticeably wider than a European 10 mm bed, and it is mortar, not a gap.
 *
 * This module is deliberately pure: no three.js, no DOM, no randomness that
 * is not seeded. `make_wall_layout()` returns the complete wall in build
 * order, so the scene only has to upload matrices and the tests can assert
 * the masonry rules directly.
 *
 * Zones, bottom to top (24 courses):
 *   1–8    plinth        running bond, smoked and sooty
 *   9–10   bonding band  Flemish alternation, glazed headers
 *   11–16  frieze        hazarbaf basket weave + the glazed medallion
 *   17–23  upper wall    running bond, sun-bleached
 *   24     crown         running bond, one empty socket at centre-top
 */

export const BRICK_SIZE: [number, number, number] = [2.2, 0.55, 1.05];
export const JOINT = 0.12;
export const STEP_X = BRICK_SIZE[0] + JOINT;
export const STEP_Y = BRICK_SIZE[1] + JOINT;

/** Front face of every brick sits on z = 0; mortar bed sits behind it. */
export const WALL_Z = 0;
export const MORTAR_Z = -0.07;
export const COURSES = 24;

/** The keystone's socket: crown course, dead centre. */
export const SOCKET_COURSE = COURSES - 1;

/** Vertical span of the finished wall. */
export const WALL_HEIGHT = COURSES * STEP_Y;

export function course_centre_y(course: number): number {
  return (course + 0.5) * STEP_Y;
}

export const SOCKET: [number, number, number] = [
  0,
  course_centre_y(SOCKET_COURSE),
  -BRICK_SIZE[2] / 2,
];

/* ------------------------------------------------------------------ */
/* Variants                                                            */
/* ------------------------------------------------------------------ */

export type BrickVariant =
  | "clay-sand"
  | "clay-warm"
  | "clay-rose"
  | "clay-smoked"
  | "clay-pale"
  | "clay-burnt"
  | "stamp-shamseh"
  | "stamp-rosette"
  | "stamp-wedge"
  | "stamp-lionsun"
  | "glaze";

export const CLAY_VARIANTS: BrickVariant[] = [
  "clay-sand",
  "clay-warm",
  "clay-rose",
  "clay-smoked",
  "clay-pale",
  "clay-burnt",
];

export type Zone = "plinth" | "band" | "frieze" | "upper" | "crown";

export function zone_of(course: number): Zone {
  if (course < 8) return "plinth";
  if (course < 10) return "band";
  if (course < 16) return "frieze";
  if (course < 23) return "upper";
  return "crown";
}

export interface WallUnit {
  /** centre, world units */
  x: number;
  y: number;
  z: number;
  /** width and height multipliers applied to BRICK_SIZE before rotation */
  sx: number;
  sy: number;
  /** z-rotation: soldiers stand on end (PI/2) */
  rot_z: number;
  /** 180° turn about y — mirrors the face so neighbour textures differ */
  mirror: boolean;
  variant: BrickVariant;
  /** 0..1 firing tone, multiplied into the instance colour */
  tint: number;
  /** sub-degree pose jitter, radians */
  jitter: [number, number, number];
  course: number;
  zone: Zone;
  /** true for the six glazed units that carry the medallion */
  medallion: boolean;
}

/* ------------------------------------------------------------------ */
/* Deterministic randomness                                            */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pick = { variant: BrickVariant; weight: number };

/*
 * Zone mix. Counts are approximate by design — a kiln does not deal in
 * percentages, and a wall that hits its ratios exactly looks printed.
 * Across the whole wall this lands near 70% plain clay, 12% glaze, 8%
 * stamped, 6% lion-and-sun deboss, 3% over-burnt, 3% pale.
 */
const MIX: Record<Zone, Pick[]> = {
  plinth: [
    { variant: "clay-sand", weight: 12 },
    { variant: "clay-warm", weight: 16 },
    { variant: "clay-rose", weight: 14 },
    { variant: "clay-smoked", weight: 34 },
    { variant: "clay-burnt", weight: 10 },
    { variant: "clay-pale", weight: 3 },
    { variant: "stamp-wedge", weight: 4 },
    { variant: "stamp-shamseh", weight: 2 },
  ],
  band: [
    { variant: "clay-warm", weight: 26 },
    { variant: "clay-sand", weight: 20 },
    { variant: "clay-rose", weight: 14 },
    { variant: "stamp-shamseh", weight: 8 },
    { variant: "stamp-rosette", weight: 6 },
    { variant: "glaze", weight: 8 },
  ],
  frieze: [
    { variant: "clay-sand", weight: 26 },
    { variant: "clay-warm", weight: 20 },
    { variant: "clay-rose", weight: 14 },
    { variant: "clay-smoked", weight: 6 },
    { variant: "stamp-shamseh", weight: 9 },
    { variant: "stamp-rosette", weight: 9 },
    { variant: "stamp-wedge", weight: 6 },
    { variant: "stamp-lionsun", weight: 4 },
    { variant: "glaze", weight: 5 },
  ],
  upper: [
    { variant: "clay-sand", weight: 38 },
    { variant: "clay-warm", weight: 24 },
    { variant: "clay-rose", weight: 10 },
    { variant: "clay-pale", weight: 12 },
    { variant: "clay-burnt", weight: 2 },
    { variant: "stamp-shamseh", weight: 5 },
    { variant: "stamp-rosette", weight: 5 },
    { variant: "stamp-wedge", weight: 3 },
    { variant: "stamp-lionsun", weight: 3 },
  ],
  crown: [
    { variant: "clay-sand", weight: 48 },
    { variant: "clay-warm", weight: 30 },
    { variant: "clay-pale", weight: 12 },
    { variant: "clay-rose", weight: 10 },
  ],
};

function pick_variant(
  zone: Zone,
  rand: () => number,
  avoid: Set<BrickVariant>,
  lionsun_used: { n: number },
): BrickVariant {
  const mix = MIX[zone];
  const total = mix.reduce((n, m) => n + m.weight, 0);
  for (let attempt = 0; attempt < 8; attempt++) {
    let roll = rand() * total;
    let choice = mix[mix.length - 1]!.variant;
    for (const m of mix) {
      roll -= m.weight;
      if (roll <= 0) {
        choice = m.variant;
        break;
      }
    }
    // The emblem stays rare: five to seven wall bricks carry it, plus the
    // keystone and the frieze medallion. Any more reads as wallpaper.
    if (choice === "stamp-lionsun" && lionsun_used.n >= 6) continue;
    if (avoid.has(choice)) continue;
    if (choice === "stamp-lionsun") lionsun_used.n += 1;
    return choice;
  }
  return "clay-warm";
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** Number of stretchers across, by device class. Wall is always wider. */
export function wall_columns(tier: "low" | "medium" | "high", portrait: boolean): number {
  const base = tier === "low" ? 11 : tier === "medium" ? 15 : 17;
  return portrait ? Math.min(base, 11) : base;
}

/**
 * make_wall_layout — the whole wall, deterministic from a seed.
 *
 * Three bonds, one wall. Nothing here animates: the wall is already built
 * when the story starts, so every matrix is uploaded once.
 */
export function make_wall_layout(cols = 17): WallUnit[] {
  const rand = rng(0xb21c4a7);
  const units: WallUnit[] = [];
  const lionsun_used = { n: 0 };
  const half = (cols * STEP_X) / 2;
  const from = -half - STEP_X;
  const to = half + STEP_X;

  // For the no-two-neighbours-alike rule: remember what was placed where.
  const placed: { x: number; y: number; variant: BrickVariant }[] = [];
  const avoid_for = (x: number, y: number) => {
    const avoid = new Set<BrickVariant>();
    for (const p of placed) {
      const dx = Math.abs(p.x - x);
      const dy = Math.abs(p.y - y);
      // neighbours: touching along the course, or directly above/below
      if ((dy < 0.01 && dx < STEP_X * 1.1) || (dx < BRICK_SIZE[0] * 0.6 && dy < STEP_Y * 1.05)) {
        avoid.add(p.variant);
      }
    }
    return avoid;
  };

  const push = (
    course: number,
    x: number,
    y: number,
    width: number,
    height: number,
    opts: { soldiers?: boolean; force?: BrickVariant; medallion?: boolean } = {},
  ) => {
    const zone = zone_of(course);
    const variant = opts.force ?? pick_variant(zone, rand, avoid_for(x, y), lionsun_used);
    const unit: WallUnit = {
      x,
      y,
      z: -BRICK_SIZE[2] / 2,
      // scale is expressed in the brick's own frame; soldiers are turned
      // 90° in the wall plane so their face texture rotates with them
      sx: opts.soldiers ? height / BRICK_SIZE[0] : width / BRICK_SIZE[0],
      sy: opts.soldiers ? width / BRICK_SIZE[1] : height / BRICK_SIZE[1],
      rot_z: opts.soldiers ? Math.PI / 2 : 0,
      mirror: !opts.soldiers && rand() > 0.58,
      variant,
      tint: rand(),
      jitter: [
        (rand() - 0.5) * 0.007,
        (rand() - 0.5) * 0.012,
        (rand() - 0.5) * 0.007,
      ],
      course,
      zone,
      medallion: opts.medallion ?? false,
    };
    units.push(unit);
    placed.push({ x, y, variant });
    return unit;
  };

  /* --- running bond: plinth, upper wall, crown --------------------- */
  const running_courses = [0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23];
  for (const course of running_courses) {
    const y = course_centre_y(course);
    // The crown is laid on the stretcher grid even though its parity says
    // otherwise: the socket has to be dead centre, and a running bond only
    // puts a unit there on the even grid.
    const offset =
      course === SOCKET_COURSE ? 0 : course % 2 === 1 ? STEP_X / 2 : 0;
    const start = Math.ceil((from - offset) / STEP_X) * STEP_X + offset;
    for (let x = start; x <= to; x += STEP_X) {
      if (course === SOCKET_COURSE && Math.abs(x) < 0.01) continue; // the socket
      push(course, x, y, BRICK_SIZE[0], BRICK_SIZE[1]);
    }
  }

  /* --- bonding band: Flemish alternation, glazed headers ----------- */
  for (const course of [8, 9]) {
    const y = course_centre_y(course);
    let x = from - STEP_X;
    let header = course % 2 === 1;
    let i = 0;
    while (x <= to) {
      const w = header ? 1.05 : BRICK_SIZE[0];
      const glaze = i % 4 === 3;
      push(course, x + w / 2, y, w, BRICK_SIZE[1]);
      if (glaze) units[units.length - 1]!.variant = "glaze";
      x += w + JOINT;
      header = !header;
      i += 1;
    }
  }

  /* --- frieze: hazarbaf basket weave -------------------------------
     Panels are one stretcher wide and three courses tall. An H panel is
     three stacked stretchers; a V panel is four soldiers side by side.
     Both are near-square, and the two bands of the frieze are offset by
     half a panel, which is what produces the weave. */
  const panel_w = STEP_X;
  const frieze_top = 10;
  const bands = [0, 1];
  for (const band of bands) {
    const band_course = frieze_top + band * 3;
    const band_y = course_centre_y(band_course + 1);
    const shift = band === 0 ? 0 : panel_w / 2;
    const first = Math.floor((from - shift) / panel_w) - 1;
    const last = Math.ceil((to - shift) / panel_w) + 1;
    for (let p = first; p <= last; p++) {
      const px = p * panel_w + shift + panel_w / 2;
      // the medallion needs a calm bed of stretchers at the centre
      const is_medallion = Math.abs(px) < panel_w * 1.6;
      const vertical = !is_medallion && (p + band) % 2 === 0;

      if (vertical) {
        const soldier_w = (panel_w - 3 * JOINT) / 4;
        const soldier_h = 3 * STEP_Y - JOINT;
        for (let s = 0; s < 4; s++) {
          const sx = px - panel_w / 2 + JOINT / 2 + soldier_w / 2 + s * (soldier_w + JOINT);
          push(band_course, sx, band_y, soldier_w, soldier_h, { soldiers: true });
        }
      } else {
        for (let row = 0; row < 3; row++) {
          const course = band_course + row;
          const y = course_centre_y(course);
          push(course, px, y, BRICK_SIZE[0], BRICK_SIZE[1]);
        }
      }
    }
  }

  /* --- the medallion's glazed bed ----------------------------------
     Three stretchers by two courses, placed explicitly rather than left to
     the panel grid: the medallion is the one part of the wall that must be
     exactly where the brief says it is, and the surrounding frieze panels
     are re-cut around it the way a real mason would cut closers. */
  const medallion_courses = [12, 13];
  const medallion_xs = [-STEP_X, 0, STEP_X];
  const in_medallion = (u: WallUnit) =>
    medallion_courses.includes(u.course) &&
    Math.abs(u.x) <= STEP_X * 1.5 - JOINT / 2;
  const kept = units.filter((u) => !in_medallion(u));
  for (const course of medallion_courses) {
    for (const x of medallion_xs) {
      kept.push({
        x,
        y: course_centre_y(course),
        z: -BRICK_SIZE[2] / 2,
        sx: 1,
        sy: 1,
        rot_z: 0,
        mirror: false,
        variant: "glaze",
        tint: rand(),
        jitter: [0, 0, 0],
        course,
        zone: "frieze",
        medallion: true,
      });
    }
  }

  return kept;
}

/** Centre of the frieze medallion (the plaque mounted over the glazed bed). */
export const MEDALLION: [number, number, number] = [
  0,
  (course_centre_y(12) + course_centre_y(13)) / 2,
  0,
];

/** Unit width of the glazed medallion bed: three stretchers. */
export const MEDALLION_SIZE: [number, number] = [3 * STEP_X - JOINT, 2 * STEP_Y - JOINT];