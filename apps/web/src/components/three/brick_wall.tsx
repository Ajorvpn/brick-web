"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  create_brick_geometry,
  create_brick_material,
  BRICK_SIZE,
} from "./brick_geometry";
import type { QualityProfile } from "@/lib/quality";

interface wall_props {
  profile: QualityProfile;
  /** 0..1 wall build progress written by GSAP */
  build_ref: { current: number };
  /** 0..1 hero-brick seating progress (skips the slot the hero fills) */
  seat_ref: { current: number };
}

const GAP = 0.055; // mortar joint
const COLS = 4;
const ROWS = 3;

/**
 * The slot the hero brick seats into: bottom course, true center.
 * Exported so the hero brick's journey can end exactly here.
 */
export const HERO_SLOT: [number, number, number] = [
  0,
  -((ROWS - 1) / 2) * (BRICK_SIZE[1] + GAP),
  -1.62,
];

export interface wall_brick {
  home: [number, number, number];
  from: [number, number, number];
  tumble: number;
  delay: number;
  hue: number;
  /** index of the slot reserved for the hero brick (skipped) */
  is_hero_slot: boolean;
}

/**
 * Pure masonry layout: stretcher bond (running bond) with half-brick
 * offset rows. Deterministic. The center slot of the bottom row is
 * reserved for the hero brick.
 */
export function make_wall_layout(count: number): wall_brick[] {
  let seed = 0x77616c6c;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const out: wall_brick[] = [];
  const [bw, bh] = [BRICK_SIZE[0], BRICK_SIZE[1]];
  const step_x = bw + GAP;
  const step_y = bh + GAP;
  const hero_col = Math.floor(COLS / 2);
  const hero_row = 0; // bottom-center — the foundation course

  for (let r = 0; r < ROWS; r++) {
    const row_offset = r % 2 === 0 ? 0 : step_x / 2;
    for (let c = 0; c <= COLS; c++) {
      const is_hero_slot = r === hero_row && c === hero_col;
      const home: [number, number, number] = [
        (c - COLS / 2) * step_x + row_offset,
        (r - (ROWS - 1) / 2) * step_y,
        -1.62,
      ];
      if (is_hero_slot) {
        out.push({
          home,
          from: home,
          tumble: 0,
          delay: 0,
          hue: 0.5,
          is_hero_slot: true,
        });
        continue;
      }
      const side = rand() > 0.5 ? 1 : -1;
      out.push({
        home,
        from: [
          home[0] + side * (10 + rand() * 8),
          home[1] + 8 + rand() * 5,
          -10 - rand() * 8,
        ],
        tumble: (rand() - 0.5) * 1.1,
        // seating window: last delay ≈ 0.40 so every brick settles fully
        // before build reaches 1.0 (0.40 + 0.42 ≤ 1.0)
        delay: (out.length / count) * 0.30 + rand() * 0.10,
        hue: rand(),
        is_hero_slot: false,
      });
    }
  }
  return out;
}

/**
 * BrickWall — one physical masonry wall.
 * InstancedMesh (canonical geometry + shared material); only transforms
 * and per-instance color vary. A dark backing plane + joint spacing read
 * as mortar.
 */
export function BrickWall({ build_ref }: wall_props) {
  const layout = useMemo(
    () => make_wall_layout(COLS * ROWS + 2),
    [],
  );
  const count = layout.length;
  const mesh_ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => create_brick_material(), []);
  const geometry = useMemo(() => create_brick_geometry(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  void useThree;

  // InstancedMesh cannot skip an index, so the hero slot instance stays
  // at zero scale until the hero seats — then it hides forever.
  useEffect(() => {
    const mesh = mesh_ref.current;
    if (!mesh) return;
    mesh.frustumCulled = false;
    // initialize all matrices offscreen
    dummy.position.set(0, -999, 0);
    dummy.scale.setScalar(0.001);
    dummy.updateMatrix();
    for (let i = 0; i < count; i++) mesh.setMatrixAt(i, dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, dummy]);

  useFrame(() => {
    const mesh = mesh_ref.current;
    if (!mesh) return;
    const build = build_ref.current;
    

    layout.forEach((b, i) => {
      if (b.is_hero_slot) {
        // the hero brick occupies this slot; keep the instance hidden
        dummy.scale.setScalar(0.001);
        dummy.position.set(0, -999, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        return;
      }
      const local = THREE.MathUtils.clamp((build - b.delay) / 0.42, 0, 1);
      const e = 1 - Math.pow(1 - local, 3); // cubic settle
      const scale = local <= 0 ? 0.001 : 0.62 + 0.38 * e;

      dummy.position.set(
        THREE.MathUtils.lerp(b.from[0], b.home[0], e),
        THREE.MathUtils.lerp(b.from[1], b.home[1], e),
        THREE.MathUtils.lerp(b.from[2], b.home[2], e),
      );
      dummy.rotation.set(
        b.tumble * (1 - e),
        b.tumble * 0.55 * (1 - e),
        b.tumble * 0.35 * (1 - e),
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // tonal variation only — the albedo is baked full-color, so instance
      // color stays a near-neutral multiplier (value 0.78–1.02, slight warmth)
      const v = 0.78 + b.hue * 0.24;
      color.setRGB(v, v * 0.985, v * 0.965);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* mortar backing: dark neutral plane behind the joints */}
      <mesh position={[0, 0, -1.62 - BRICK_SIZE[2] / 2 - 0.004]} receiveShadow>
        <planeGeometry args={[COLS * (BRICK_SIZE[0] + GAP) + 1, ROWS * (BRICK_SIZE[1] + GAP) + 0.6]} />
        <meshStandardMaterial color="#241f1c" roughness={1} metalness={0} />
      </mesh>
      <instancedMesh
        ref={mesh_ref}
        args={[geometry, material, count]}
        castShadow
        receiveShadow
      />
    </group>
  );
}
