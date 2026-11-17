/**
 * The stamp library — original artwork, authored here as polygon geometry.
 *
 * LICENSING / REFERENCES (checked before drawing, not after):
 *
 *   • The Lion and Sun (Shir-o-Khorshid) is a historical Iranian emblem. The
 *     Wikimedia Commons files that carry it are variously tagged PD-Iran,
 *     PD-old or CC-BY-SA depending on the drawing, and CC-BY-SA is not a
 *     licence this project ships art under. No Commons file is used here.
 *     This silhouette is an ORIGINAL drawing: a crown-free lion with a raised
 *     sword in front of a rayed sun, composed from circles, ellipses and
 *     tapered limbs in the code below. Crown, imperial ornamental additions
 *     and any heraldic lettering are deliberately absent.
 *
 *   • Visual references studied for proportion and feel (no pixels taken):
 *     Achaemenid glazed-brick friezes from Susa (Louvre / Met Open Access),
 *     the stamped fired bricks of Chogha Zanbil, Seljuk hazarbaf brickwork
 *     and the Gonbad-e Qabus brick bands, and photographs of aged fired
 *     clay (soot, chipped arrises, uneven burn).
 *
 *   • No Persian or cuneiform text is drawn anywhere. The "wedge" stamp is
 *     a radial arrangement of abstract wedges, deliberately symmetric so it
 *     cannot be misread as writing.
 *
 * Every polygon is a simple closed loop in a unit box (y down).
 */

import { circle, ellipse, limb, star, tube, polygon } from "./lib/paths.mjs";

/* ------------------------------------------------------------------ */
/* The emblem: sun disc + rays (level 1), lion with raised sword (level 2) */
/* ------------------------------------------------------------------ */

const sun = () => {
  const paths = [circle(0.5, 0.5, 0.335, 96)];
  // 12 stout rays, rooted inside the disc so the silhouette is one island.
  // Short and wide, not a cartoon sunburst: this is a carved medallion.
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
    const r0 = 0.25;
    const r1 = k % 2 === 0 ? 0.468 : 0.424;
    const w0 = 0.052;
    const w1 = 0.02;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const px = -s;
    const py = c;
    paths.push(
      polygon([
        [0.5 + c * r0 + px * w0, 0.5 + s * r0 + py * w0],
        [0.5 + c * r1 + px * w1, 0.5 + s * r1 + py * w1],
        [0.5 + c * r1 - px * w1, 0.5 + s * r1 - py * w1],
        [0.5 + c * r0 - px * w0, 0.5 + s * r0 - py * w0],
      ]),
    );
  }
  return paths;
};

const lion = () => {
  const paths = [];

  // Long, low torso with a distinct haunch — a lion reads as a horizontal
  // mass, not a ball. The chest is lifted where the sword arm leaves it.
  paths.push(ellipse(0.505, 0.612, 0.155, 0.082, -0.02));
  paths.push(ellipse(0.606, 0.605, 0.082, 0.092, 0.06));
  paths.push(ellipse(0.408, 0.588, 0.072, 0.086, -0.14));

  // neck into mane and head, head held high and forward
  paths.push(limb(0.418, 0.556, 0.35, 0.482, 0.058, 0.048));
  paths.push(star(0.326, 0.462, 0.103, 0.091, 11));
  paths.push(circle(0.284, 0.462, 0.058, 48));
  paths.push(ellipse(0.238, 0.472, 0.029, 0.020, 0.12, 32));
  paths.push(ellipse(0.252, 0.495, 0.021, 0.012, 0.22, 24));
  // ear
  paths.push(polygon([
    [0.306, 0.402],
    [0.314, 0.352],
    [0.344, 0.396],
  ]));

  // standing front leg, and the raised foreleg that carries the sword
  paths.push(limb(0.442, 0.66, 0.432, 0.792, 0.031, 0.023));
  paths.push(ellipse(0.428, 0.797, 0.032, 0.014, 0, 24));
  paths.push(limb(0.412, 0.582, 0.458, 0.452, 0.031, 0.023));
  paths.push(circle(0.464, 0.44, 0.026, 24));

  // hind legs, one stepped back so the walk reads
  paths.push(limb(0.63, 0.664, 0.652, 0.79, 0.036, 0.024));
  paths.push(ellipse(0.658, 0.796, 0.032, 0.014, 0, 24));
  paths.push(limb(0.566, 0.672, 0.545, 0.782, 0.034, 0.022));
  paths.push(ellipse(0.541, 0.788, 0.03, 0.013, 0, 24));

  // tail: a slow arc up the back, tufted at the tip
  paths.push(tube([0.664, 0.6], [0.742, 0.53], [0.706, 0.372], 0.019, 0.013, 26));
  paths.push(ellipse(0.7, 0.352, 0.028, 0.034, 0.3, 32));

  // sword — held out clear of the mane, blade rising past the sun's edge
  paths.push(limb(0.472, 0.412, 0.552, 0.132, 0.021, 0.01, 10));
  paths.push(polygon([
    [0.552, 0.132],
    [0.582, 0.076],
    [0.56, 0.136],
  ]));
  paths.push(limb(0.432, 0.44, 0.502, 0.396, 0.011, 0.011, 8));
  paths.push(circle(0.428, 0.444, 0.014, 20));

  return paths;
};

/* ------------------------------------------------------------------ */
/* Quieter stamps                                                        */
/* ------------------------------------------------------------------ */

/** Shamseh — eight-pointed star, the classic geometric filler. */
const shamseh = () => [
  star(0.5, 0.5, 0.47, 0.185, 8),
  star(0.5, 0.5, 0.2, 0.09, 8, Math.PI / 8),
];

/** Sun rosette — a many-petalled disc with a raised boss. */
const rosette = () => [
  star(0.5, 0.5, 0.46, 0.3, 16),
  circle(0.5, 0.5, 0.2, 48),
  circle(0.5, 0.5, 0.075, 24),
];

/**
 * Wedge marks — six abstract wedges radiating from a small diamond.
 * Symmetric by construction: ornamental, never readable as script.
 */
const wedge = () => {
  const paths = [polygon([
    [0.5, 0.38],
    [0.57, 0.5],
    [0.5, 0.62],
    [0.43, 0.5],
  ])];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const px = -s;
    const py = c;
    const r0 = 0.18;
    const r1 = 0.45;
    const w0 = 0.035;
    paths.push(
      polygon([
        [0.5 + c * r0 + px * w0, 0.5 + s * r0 + py * w0],
        [0.5 + c * r1, 0.5 + s * r1],
        [0.5 + c * r0 - px * w0, 0.5 + s * r0 - py * w0],
      ]),
    );
  }
  return paths;
};

/** A hairline crack, used sparingly on a few wall bricks. */
const crack = (seed) => {
  const paths = [];
  let x = 0.14 + seed * 0.3;
  let y = 0.1;
  let angle = 1.35;
  for (let i = 0; i < 26; i++) {
    const nx = x + Math.cos(angle) * 0.012;
    const ny = y + Math.sin(angle) * 0.012;
    paths.push(limb(x, y, nx, ny, 0.0075, 0.004, 4));
    x = nx;
    y = ny;
    angle += (Math.sin(i * 1.7 + seed * 9) * 0.55) / 6;
    if (y > 0.92) break;
  }
  return paths;
};

export const STAMPS = {
  sun,
  lion,
  shamseh,
  rosette,
  wedge,
  crack,
};

/** The emblem as two relief levels; level 2 sits proud of level 1. */
export const EMBLEM_LEVELS = [
  { id: "sun", paths: sun(), height: 0.55 },
  { id: "lion", paths: lion(), height: 1.0 },
];

export const STAMP_DEFS = [
  { id: "plain", paths: [], height: 0 },
  { id: "shamseh", paths: shamseh(), height: 1 },
  { id: "rosette", paths: rosette(), height: 1 },
  { id: "wedge", paths: wedge(), height: 1 },
  { id: "lionsun", paths: [...sun(), ...lion()], height: 1 },
  { id: "crack-a", paths: crack(0.2), height: 0.6 },
  { id: "crack-b", paths: crack(0.7), height: 0.6 },
  { id: "chipped", paths: [], height: 0 },
];