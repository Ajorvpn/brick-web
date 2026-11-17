"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { BRICK_SIZE, SOCKET } from "./brick_library";
import type { BrickMaterialSet } from "./brick_materials";
import { useEmblemGeometry } from "./brick_wall";
import {
  BEATS,
  clamp01,
  impact_age,
  impact_spike,
  story_progress,
  window4,
} from "./story_progress";

type Vec3 = [number, number, number];
type Ease = "inOut" | "out" | "in" | "linear";

interface Keyframe {
  p: number;
  pos: Vec3;
  rot: Vec3;
  ease: Ease;
}

const ease = (t: number, kind: Ease) => {
  switch (kind) {
    case "out":
      return 1 - Math.pow(1 - t, 3);
    case "in":
      return t * t * t;
    case "inOut":
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    default:
      return t;
  }
};

/**
 * The keystone's journey, in world units.
 *
 *   0.00  hero pose: high above the wall, off to the right, three-quarter
 *         turn, emblem catching a moving highlight
 *   0.08  the handoff — it stops idling and starts to travel
 *   0.30  turns face-on, directly above the socket
 *   0.40  six centimetres above the course
 *   0.452 pressed home, flush, mortar visible all round
 *
 * Rotations are deliberately small: 35° -> 0° of yaw and 10° -> 0° of
 * pitch. More than that reads as a game object, not a masonry unit.
 */
const JOURNEY: Keyframe[] = [
  { p: BEATS.handoff, pos: [2.5, 21.4, 1.5], rot: [-0.175, 0.61, 0.05], ease: "inOut" },
  { p: 0.2, pos: [0.75, 17.9, 0.34], rot: [-0.07, 0.24, 0.02], ease: "inOut" },
  { p: 0.3, pos: [0, SOCKET[1] + 1.0, -0.12], rot: [-0.02, 0.02, 0], ease: "inOut" },
  { p: 0.4, pos: [0, SOCKET[1] + 0.6, SOCKET[2] + 0.06], rot: [0, 0, 0], ease: "in" },
  { p: BEATS.impact + 0.002, pos: [SOCKET[0], SOCKET[1], SOCKET[2]], rot: [0, 0, 0], ease: "out" },
  { p: 1.0, pos: [SOCKET[0], SOCKET[1], SOCKET[2]], rot: [0, 0, 0], ease: "linear" },
];

const JOURNEY_START = JOURNEY[0]!;
const JOURNEY_END = JOURNEY[JOURNEY.length - 1]!;
const HERO_POSE = { pos: JOURNEY_START.pos, rot: JOURNEY_START.rot };

function sample(p: number): { pos: Vec3; rot: Vec3 } {
  if (p <= JOURNEY_START.p) return { pos: JOURNEY_START.pos, rot: JOURNEY_START.rot };
  for (let i = 0; i < JOURNEY.length - 1; i++) {
    const a = JOURNEY[i]!;
    const b = JOURNEY[i + 1]!;
    if (p <= b.p) {
      const t = ease((p - a.p) / (b.p - a.p), b.ease);
      return {
        pos: [
          THREE.MathUtils.lerp(a.pos[0], b.pos[0], t),
          THREE.MathUtils.lerp(a.pos[1], b.pos[1], t),
          THREE.MathUtils.lerp(a.pos[2], b.pos[2], t),
        ],
        rot: [
          THREE.MathUtils.lerp(a.rot[0], b.rot[0], t),
          THREE.MathUtils.lerp(a.rot[1], b.rot[1], t),
          THREE.MathUtils.lerp(a.rot[2], b.rot[2], t),
        ],
      };
    }
  }
  return { pos: JOURNEY_END.pos, rot: [0, 0, 0] };
}

/* ------------------------------------------------------------------ */

const FLARE_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 d = (vUv - 0.5) * 2.0;
    float core = smoothstep(1.0, 0.0, length(vec2(d.x * 0.9, d.y * 2.6)));
    float streak = smoothstep(0.85, 0.0, abs(d.y) * 4.0) * smoothstep(1.0, 0.2, abs(d.x));
    float a = (core * 0.75 + streak * 0.55) * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`;

const FLARE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function GoldFlare() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLARE_VERT,
        fragmentShader: FLARE_FRAG,
        uniforms: {
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#ffe6b0") },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const mesh_ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = story_progress.p;
    // One specular sweep across the gold as the brick lands — 0.5s of light,
    // never a flashbulb. Derived from progress, so it rewinds cleanly.
    const age = clamp01((p - BEATS.impact) / 0.034);
    const live = p >= BEATS.impact && age < 1 ? Math.sin(age * Math.PI) : 0;
    const mesh = mesh_ref.current;
    if (mesh) {
      mesh.position.x = THREE.MathUtils.lerp(-0.55, 0.55, age);
      mesh.visible = live > 0.001;
    }
    material.uniforms.uOpacity!.value = live * 0.9;
  });

  return (
    <mesh ref={mesh_ref} position={[0, 0, BRICK_SIZE[2] / 2 + 0.06]} renderOrder={2} visible={false}>
      <planeGeometry args={[1.5, 0.42]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */

export function Keystone({ materials }: { materials: BrickMaterialSet }) {
  const group = useRef<THREE.Group>(null);
  const emblem = useEmblemGeometry(1);
  const body = useMemo(() => {
    const geometry = new RoundedBoxGeometry(BRICK_SIZE[0], BRICK_SIZE[1], BRICK_SIZE[2], 5, 0.03);
    const position = geometry.attributes.position!;
    const normal = geometry.attributes.normal!;
    const uv = geometry.attributes.uv!;
    for (let i = 0; i < position.count; i++) {
      if (normal.getZ(i) > 0.55) continue; // the face keeps the baked sheet
      // a quiet corner of the same sheet: clay, no emblem, no groove
      uv.setXY(i, 0.03 + (position.getX(i) / BRICK_SIZE[0] + 0.5) * 0.14, -0.02 + (position.getY(i) / BRICK_SIZE[1] + 0.5) * 0.12);
    }
    uv.needsUpdate = true;
    // the baked face occlusion needs the second UV set too
    geometry.setAttribute("uv1", uv);
    return geometry;
  }, []);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;

    const p = clamp01(story_progress.p);
    const { pos, rot } = sample(p);

    // Idle: a slow float and a 9° drift, gone the moment it starts to travel.
    const idle = 1 - clamp01((p - 0.02) / 0.1);
    const float = Math.sin(t * 0.55) * 0.045 * idle;
    const drift = Math.sin(t * 0.22) * 0.08 * idle;

    // The press: a small settle after contact, then nothing.
    const age = impact_age(p);
    const settle = age > 0 && age < 0.12 ? Math.sin((age / 0.12) * Math.PI) * 0.01 : 0;

    g.position.set(pos[0], pos[1] + float - settle, pos[2]);
    g.rotation.set(rot[0], rot[1] + drift, rot[2]);

    const spike = impact_spike(p);
    const s = 1 - spike * 0.012;
    g.scale.set(s, s, s);
  });

  return (
    <group ref={group} position={HERO_POSE.pos} rotation={HERO_POSE.rot} name="keystone">
      <mesh geometry={body} material={materials.keystone} castShadow receiveShadow />
      {/* the emblem sits proud of the face, in antique gold */}
      {emblem.map((level) => (
        <mesh
          key={level.id}
          geometry={level.geometry}
          material={materials.gold}
          position={[0, 0, BRICK_SIZE[2] / 2 - 0.002]}
          castShadow={false}
          receiveShadow={false}
        />
      ))}
      <GoldFlare />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Ghost socket                                                        */
/* ------------------------------------------------------------------ */

const SOCKET_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  uniform float uPulse;
  uniform vec3 uColor;
  uniform vec2 uSize;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    vec2 half_size = uSize * 0.5;
    vec2 q = abs(p) - (half_size - vec2(0.14));
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.14;
    float edge = smoothstep(0.035, 0.0, abs(d));
    float fill = smoothstep(0.0, -0.5, d) * 0.1;
    float a = (edge * 0.55 + fill) * uOpacity * (0.7 + uPulse * 0.3);
    gl_FragColor = vec4(uColor, a);
  }
`;

export function GhostSocket() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLARE_VERT,
        fragmentShader: SOCKET_FRAG,
        uniforms: {
          uOpacity: { value: 0 },
          uPulse: { value: 0 },
          uColor: { value: new THREE.Color("#7fe9e0") },
          uSize: {
            value: new THREE.Vector2(BRICK_SIZE[0] + 0.02, BRICK_SIZE[1] + 0.02),
          },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state) => {
    const p = story_progress.p;
    // the socket announces itself as the brick lines up, then goes out
    const visible = window4(p, 0.3, 0.35, 0.448, 0.47);
    material.uniforms.uOpacity!.value = visible * 0.85;
    material.uniforms.uPulse!.value = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.2);
  });

  return (
    <mesh position={[SOCKET[0], SOCKET[1], SOCKET[2] + BRICK_SIZE[2] / 2 + 0.004]} renderOrder={1}>
      <planeGeometry args={[BRICK_SIZE[0], BRICK_SIZE[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export { HERO_POSE };