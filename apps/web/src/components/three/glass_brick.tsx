"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  create_brick_geometry,
  create_brick_material,
} from "./brick_geometry";
import { HERO_SLOT } from "./brick_wall";
import type { QualityProfile } from "@/lib/quality";

/** Portrait composition offset (x, y): fits the hero pose in frame, fades with story. */
const portrait_offset = (): [number, number] =>
  typeof window !== "undefined" && window.innerHeight > window.innerWidth
    ? [-0.45, -0.76]
    : [0, 0];

interface brick_props {
  profile: QualityProfile;
  /** story progress 0..1: 0 = hero pose, 1 = seated in the wall */
  story_ref: { current: number };
}

/**
 * Hero journey keyframes (position + rotation). Scroll scrubs between them:
 *   0.00  hero pose — right field, slight angle, all faces visible
 *   0.25  anticipation: lifts a touch, turns to face the wall
 *   0.50  travels to sit DIRECTLY ABOVE its slot in the base course
 *   0.75  inside the wall plane, still above the mortar bed
 *   1.00  seated — the last two segments are a straight drop onto the course,
 *         so the hero brick falls from above exactly like every other unit
 */
const JOURNEY: { p: [number, number, number]; r: [number, number, number] }[] = [
  { p: [0.9, 0.05, 0], r: [0.03, 0.72, 0.015] },
  { p: [0.6, 0.5, 0.3], r: [0.02, 0.42, 0.01] },
  { p: [0.0, 0.55, -1.05], r: [0, 0.1, 0] },
  { p: [0.0, 0.12, -1.55], r: [0, 0.04, 0] },
  { p: HERO_SLOT, r: [0, 0, 0] }, // seated — base course, centre
];

/** Cubic ease for scrubbed segments (mass feel, no bounce). */
const ease_in_out = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function Brick({ profile, story_ref }: brick_props) {
  const group = useRef<THREE.Group>(null);
  const detail = profile.tier === "low" ? 2 : 4;
  void detail;

  const geometry = useMemo(() => create_brick_geometry(), []);
  const material = useMemo(() => create_brick_material(), []);
  const [portrait_x, portrait_y] = useMemo(() => portrait_offset(), []);
  const last_story = useRef(0);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const s = THREE.MathUtils.clamp(story_ref.current, 0, 1);

    // Journey interpolation across keyframes.
    const seg = Math.min(Math.floor(s * (JOURNEY.length - 1)), JOURNEY.length - 2);
    const local = ease_in_out(
      THREE.MathUtils.clamp(s * (JOURNEY.length - 1) - seg, 0, 1),
    );
    const a = JOURNEY[seg]!;
    const b = JOURNEY[seg + 1]!;
    const px = THREE.MathUtils.lerp(a.p[0], b.p[0], local);
    const py = THREE.MathUtils.lerp(a.p[1], b.p[1], local);
    const pz = THREE.MathUtils.lerp(a.p[2], b.p[2], local);
    const rx = THREE.MathUtils.lerp(a.r[0], b.r[0], local);
    const ry = THREE.MathUtils.lerp(a.r[1], b.r[1], local);
    const rz = THREE.MathUtils.lerp(a.r[2], b.r[2], local);

    if (reduced) {
      g.position.set(...JOURNEY[0]!.p);
      g.rotation.set(...JOURNEY[0]!.r);
      return;
    }

    // Idle float fades out as the brick approaches the wall (mass settling).
    // Portrait offset repositions the hero pose into frame, fading out by s=0.35.
    const bias_k = Math.max(0, 1 - s / 0.35);
    const bias_x = portrait_x * bias_k;
    const bias_y = portrait_y * bias_k;
    const float = Math.sin(t * 0.7) * 0.045 * (1 - s);
    const idle_rot = Math.sin(t * 0.28) * 0.05 * (1 - s);
    const pointer_rot = state.pointer.y * 0.07 * (1 - s * 0.7);

    g.position.set(px + bias_x, py + bias_y + float, pz);
    g.rotation.set(
      rx + pointer_rot,
      ry + idle_rot + state.pointer.x * 0.12 * (1 - s * 0.7),
      rz,
    );

    // Micro-settle at placement: tiny extra sink right at the end.
    if (s > 0.92 && last_story.current <= 0.92) {
      g.position.y -= 0.012;
    }
    last_story.current = s;
  });

  return (
    <group
      ref={group}
      position={[0.9, 0.05, 0]}
      rotation={[0.03, 0.72, 0.015]}
    >
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />
      {/* subtle edge-light rim via a slightly larger dark backface shell */}
      <mesh geometry={geometry} scale={[1.004, 1.004, 1.004]}>
        <meshBasicMaterial color="#1a0f0a" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
