"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  create_brick_geometry,
  create_brick_material,
  create_mortar_material,
  BRICK_SIZE,
} from "./brick_geometry";
import type { QualityProfile } from "@/lib/quality";

/* ============================================================
   Masonry facts this file encodes
   ------------------------------------------------------------
   1. Running bond: every course is offset half a brick from the one
      below, so no vertical joint lines up. Without it a wall reads as a
      stack of tiles, which is the defect this replaces.
   2. The wall is bottom-anchored and grows upward. WALL_BASE_Y is the
      base course's resting height and never changes; nothing about the
      wall's position depends on build progress.
   3. Units fall. Every brick starts directly above the slot it will
      occupy — never off to one side, never behind the wall — and travels
      straight down onto it. The only lateral motion is a damped settle.
   4. A course is complete before the next one starts. Delays are
      course-major, so the wall can never show a floating brick in mid-air
      above a half-finished row: a unit is either still falling to its
      own slot or seated in it.
   ============================================================ */

/** Mortar joint between units. */
const GAP = 0.055;
/** Units in a full course (staggered courses carry one extra half). */
const COLS = 4;
/** Courses, base → top. */
const ROWS = 6;
/** Depth of the wall plane every unit is seated on. */
export const WALL_Z = -1.6;
/** World y of the base course centre — the wall is anchored here. */
export const WALL_BASE_Y = -2.35;

export const STEP_X = BRICK_SIZE[0] + GAP;
export const STEP_Y = BRICK_SIZE[1] + GAP;

/** Vertical span of the finished masonry, in world units. */
export const WALL_HEIGHT = ROWS * STEP_Y;

/** The hero brick's landing slot: centre of the base course. */
export const HERO_SLOT: [number, number, number] = [
  0,
  WALL_BASE_Y + BRICK_SIZE[1] / 2,
  WALL_Z,
];

/* Build pacing, as fractions of the whole scrubbed timeline.
   Last unit starts at (ROWS-1)*COURSE_SPAN + IN_COURSE_STAGGER = 0.66 and
   lands by 0.83, leaving the tail of the timeline to hold the finished
   wall — so the reverse scrub always has room to un-build cleanly. */
const COURSE_SPAN = 0.122;
const IN_COURSE_STAGGER = 0.05;
export const FALL_DURATION = 0.17;

export interface wall_brick {
  /** resting place in world space */
  home: [number, number, number];
  /** where the fall begins — always straight above `home` */
  from: [number, number, number];
  /** 0 = base course; the build order is course-major */
  course: number;
  /** position within its own course, left → right */
  index_in_course: number;
  /** progress at which this unit starts to fall */
  delay: number;
  /** resting rotation, radians — a few tenths of a degree off true */
  jitter: [number, number, number];
  /** 0..1 tonal seed, per unit */
  tone: number;
  /** half the units are turned 180° so the face texture never repeats */
  flip: boolean;
  /** the slot reserved for the hero brick (left empty by the wall) */
  is_hero_slot: boolean;
}

/**
 * make_wall_layout — a complete running-bond wall, in build order.
 *
 * Pure and deterministic (seeded LCG, no Math.random) so tests can assert
 * the masonry rules directly. Rows are emitted bottom-first, left-to-right,
 * which is also the order they are laid.
 */
export function make_wall_layout(rows = ROWS, cols = COLS): wall_brick[] {
  let seed = 0x77616c6c;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  const out: wall_brick[] = [];
  const hero_course = 0;
  const hero_index = Math.floor(cols / 2);

  for (let r = 0; r < rows; r++) {
    // running bond: odd courses shift half a brick sideways
    const bond_offset = r % 2 === 1 ? STEP_X / 2 : 0;
    const units = cols + 1;
    const y = WALL_BASE_Y + BRICK_SIZE[1] / 2 + r * STEP_Y;

    for (let i = 0; i < units; i++) {
      const x = (i - cols / 2) * STEP_X - bond_offset;
      const is_hero_slot = r === hero_course && i === hero_index;

      out.push({
        home: [x, y, WALL_Z],
        // straight above the slot, one full course clear of the top of the
        // already-built wall — the unit falls down onto it, never up at it
        from: [x, y + STEP_Y + 1.15, WALL_Z],
        course: r,
        index_in_course: i,
        delay:
          r * COURSE_SPAN + (i / units) * IN_COURSE_STAGGER + rand() * 0.012,
        jitter: [
          (rand() - 0.5) * 0.012,
          (rand() - 0.5) * 0.016,
          (rand() - 0.5) * 0.01,
        ],
        tone: rand(),
        flip: rand() > 0.5,
        is_hero_slot,
      });
    }
  }

  return out;
}

interface wall_props {
  profile: QualityProfile;
  /** 0..1 wall build progress, written by GSAP */
  build_ref: { current: number };
  /** 0..1 hero-brick seating progress (the hero owns its own brick) */
  seat_ref?: { current: number };
}

/**
 * BrickWall — one physical masonry wall.
 *
 * Bottom-anchored and built strictly upward, course by course: the base
 * course is laid first and never moves again, each unit falls from directly
 * above onto the top of what has already been built, and the camera (see
 * brick_story_scene) rises to keep the newest course in frame.
 *
 * One InstancedMesh carries every unit, so the whole wall costs a single
 * draw call; only transforms and per-unit tint vary per frame.
 */
export function BrickWall({ profile, build_ref }: wall_props) {
  const layout = useMemo(() => make_wall_layout(), []);
  const count = layout.length;
  const mesh_ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => create_brick_geometry(), []);
  const material = useMemo(() => create_brick_material({ bump_scale: 0.62 }), []);
  const mortar = useMemo(() => create_mortar_material(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  // Park every instance out of frame until its course is laid.
  useEffect(() => {
    const mesh = mesh_ref.current;
    if (!mesh) return;
    mesh.frustumCulled = false;
    dummy.position.set(0, -999, 0);
    dummy.scale.setScalar(0.0001);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, dummy]);

  useFrame(() => {
    const mesh = mesh_ref.current;
    if (!mesh) return;
    const build = build_ref.current;

    for (let i = 0; i < count; i++) {
      const b = layout[i]!;

      // The hero brick owns its slot; the wall always leaves it empty.
      if (b.is_hero_slot) {
        dummy.position.set(0, -999, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const local = THREE.MathUtils.clamp(
        (build - b.delay) / FALL_DURATION,
        0,
        1,
      );

      // Not yet falling: staged above its slot, still invisible.
      if (local <= 0) {
        dummy.position.set(b.from[0], b.from[1], b.from[2]);
        dummy.rotation.set(0, b.flip ? Math.PI : 0, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // The drop: accelerate, then settle. Strictly downward — the lateral
      // term is a damped wobble that is exactly zero at the slot, so the
      // unit always arrives flat on the course beneath it.
      const fall = local * local * (3 - 2 * local);
      const settle = Math.sin(local * Math.PI * 2) * (1 - local) * 0.05;

      dummy.position.set(
        THREE.MathUtils.lerp(b.from[0], b.home[0], fall) + settle,
        THREE.MathUtils.lerp(b.from[1], b.home[1], fall),
        THREE.MathUtils.lerp(b.from[2], b.home[2], fall),
      );
      // rotation eases to the unit's own tiny jitter — never a perfect grid
      dummy.rotation.set(
        b.jitter[0] * fall,
        (b.flip ? Math.PI : 0) + b.jitter[1] * fall,
        b.jitter[2] * fall,
      );
      dummy.scale.setScalar(0.94 + 0.06 * fall);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Per-unit firing variation: no two bricks in the wall are the same
      // tone, and about half are turned 180° so the face texture never
      // repeats visibly across neighbours.
      const v = 0.74 + b.tone * 0.32;
      const warm = b.tone - 0.5;
      color.setRGB(v * (1 + warm * 0.05), v, v * (1 - warm * 0.04));
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const bed_height = (ROWS - 1) * STEP_Y + BRICK_SIZE[1] + 0.5;
  const bed_centre_y = WALL_BASE_Y + ((ROWS - 1) * STEP_Y) / 2;

  return (
    <group>
      {/* Mortar bed behind the joints: every gap between units shows joint,
          never raw background, and it also backs the half-brick overhangs
          at the ends of staggered courses. */}
      <mesh
        position={[0, bed_centre_y, WALL_Z - BRICK_SIZE[2] / 2 - 0.012]}
        material={mortar}
        receiveShadow
      >
        <planeGeometry args={[(COLS + 1) * STEP_X + 0.6, bed_height]} />
      </mesh>

      <instancedMesh
        ref={mesh_ref}
        args={[geometry, material, count]}
        castShadow={profile.tier !== "low"}
        receiveShadow
      />
    </group>
  );
}

