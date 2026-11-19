"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { BrickWall } from "./brick_wall";
import { Keystone, GhostSocket } from "./brick_keystone";
import { useBrickMaterials } from "./brick_materials";
import { SOCKET } from "./brick_library";
import {
  clamp01,
  impact_age,
  impact_spike,
  story_progress,
} from "./story_progress";
import {
  detectQualityTier,
  getQualityProfile,
  type QualityProfile,
  type QualityTier,
} from "@/lib/quality";

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

/**
 * Five camera states, one continuous move.
 *
 * A pose is (where to look, how much wall to fit across the frame, from what
 * elevation). Fitting "how much wall" rather than picking a raw z means the
 * same five poses frame correctly on a 1440px desktop and a 390px phone —
 * the distance is derived from the fov and the aspect — which is what keeps
 * the portrait crop at four to five bricks without a second choreography.
 *
 * The two deliberate deviations from the brief's z values: the reveal pulls
 * back further and drops its aim, because on this wall the crown course and
 * the frieze medallion are nine courses apart and both have to be in frame
 * when the medallion lights up. The fov stays a long-lens 34°.
 */
const POSES = [
  // wp: the same pose on a portrait frame. A phone cannot hold both a large
  // hero brick and five bricks of wall, so the story zooms: tight on the
  // keystone for the descent, wide enough for four or five bricks after.
  { p: 0.0, ax: 0.35, axp: 1.6, ayp: 25.4, ay: 20.4, w: 11.4, wp: 6.6, elev: 15 },
  { p: 0.1, ax: 0.3, axp: 1.6, ayp: 23.0, ay: 19.9, w: 10.2, wp: 6.4, elev: 13 },
  { p: 0.3, ax: 0, axp: 0, ayp: 15.45, ay: 15.45, w: 8.6, wp: 6.2, elev: 5 },
  { p: 0.46, ax: 0, axp: 0, ayp: 15.72, ay: 15.72, w: 6.8, wp: 5.6, elev: 4 },
  { p: 0.66, ax: 0, axp: 0, ayp: 11.9, ay: 11.9, w: 16.4, wp: 11.4, elev: 6 },
  { p: 1.0, ax: 0, axp: 0, ayp: 11.3, ay: 11.3, w: 19.0, wp: 13.2, elev: 7 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

function sample_pose(p: number) {
  const first = POSES[0]!;
  const last = POSES[POSES.length - 1]!;
  if (p <= first.p) return first;
  for (let i = 0; i < POSES.length - 1; i++) {
    const a = POSES[i]!;
    const b = POSES[i + 1]!;
    if (p <= b.p) {
      const t = smooth(clamp01((p - a.p) / (b.p - a.p)));
      return {
        ax: THREE.MathUtils.lerp(a.ax, b.ax, t),
        axp: THREE.MathUtils.lerp(a.axp, b.axp, t),
        ay: THREE.MathUtils.lerp(a.ay, b.ay, t),
        ayp: THREE.MathUtils.lerp(a.ayp, b.ayp, t),
        w: THREE.MathUtils.lerp(a.w, b.w, t),
        wp: THREE.MathUtils.lerp(a.wp, b.wp, t),
        elev: THREE.MathUtils.lerp(a.elev, b.elev, t),
      };
    }
  }
  return last;
}

const FOV = 34;

function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const aim = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const p = clamp01(story_progress.p);
    const pose = sample_pose(p);
    const aspect = size.width / Math.max(1, size.height);
    const w = aspect < 1 ? pose.wp : pose.w;
    // portrait keeps the hero brick clear of the copy: same story, its own aim
    const ax = aspect < 1 ? pose.axp : pose.ax;
    const ay = aspect < 1 ? pose.ayp : pose.ay;
    const dist = w / 2 / (Math.tan(THREE.MathUtils.degToRad(FOV) / 2) * aspect);
    const elev = THREE.MathUtils.degToRad(pose.elev);

    // the impact nudge: four centimetres of camera, decaying. No shake.
    const spike = impact_spike(p);
    aim.set(ax, ay, 0);
    camera.position.set(
      aim.x + Math.sin(spike * Math.PI) * 0.018,
      ay + Math.sin(elev) * dist + spike * 0.035,
      aim.z + Math.cos(elev) * dist,
    );
    camera.lookAt(aim);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Dust                                                                */
/* ------------------------------------------------------------------ */

const PARTICLE_VERT = /* glsl */ `
  attribute float aAlpha;
  attribute float aSize;
  varying float vAlpha;
  uniform float uScale;
  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.001, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

function make_particles(count: number, seed: number) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  return Array.from({ length: count }, () => ({
    angle: (rand() - 0.5) * 2.3,
    speed: 0.35 + rand() * 1.5,
    lift: rand() * 0.9,
    size: 0.5 + rand() * 1.3,
    delay: rand() * 0.22,
  }));
}

/**
 * ImpactDust — thirty-six motes of mortar dust, thrown from the joint as the
 * keystone is pressed home. Positions are a pure function of progress, so
 * scrolling back up rewinds them into the wall instead of leaving them
 * hanging in the air.
 */
function ImpactDust() {
  const COUNT = 36;
  const seeds = useMemo(() => make_particles(COUNT, 0x1d057), []);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const alphas = useMemo(() => new Float32Array(COUNT), []);
  const sizes = useMemo(() => new Float32Array(COUNT), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color("#e8d9bd") },
          uOpacity: { value: 0.5 },
          uScale: { value: 26 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame(() => {
    const age = impact_age(story_progress.p);
    const p = story_progress.p;
    const visible = p > 0.44 && age < 0.999;
    const originY = SOCKET[1] - 0.27;
    const originZ = 0.02;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i]!;
      const local = clamp01((age - s.delay) / (1 - s.delay));
      const travel = 1 - Math.pow(1 - local, 3);
      const x = Math.sin(s.angle) * s.speed * travel;
      const y = originY + s.lift * travel * 0.55 - local * local * 0.5;
      const z = originZ + 0.1 + Math.cos(s.angle) * s.speed * travel * 0.35;
      positions[i * 3] = visible ? x : 0;
      positions[i * 3 + 1] = visible ? y : -999;
      positions[i * 3 + 2] = z;
      alphas[i] = visible ? Math.sin(local * Math.PI) * 0.85 : 0;
      sizes[i] = s.size;
    }
  });

  return (
    <points frustumCulled={false} renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}

/**
 * AirborneDust — sixty motes drifting through the shaft of light for the
 * whole sequence. Time-based, very slow, and faint: atmosphere, not snow.
 */
function AirborneDust() {
  const COUNT = 60;
  const seeds = useMemo(
    () =>
      make_particles(COUNT, 0x2b93e).map((s) => ({
        ...s,
        // seeded spread, not Math.random: the atmosphere may drift, but the
        // build it drifts through has to be the same build every time
        x: (s.angle / 2.3) * 26,
      })),
    [],
  );
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const alphas = useMemo(() => new Float32Array(COUNT), []);
  const sizes = useMemo(() => new Float32Array(COUNT), []);
  const base = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        x: (seeds[i]!.x ?? 0) * 1.0,
        y: 8 + (seeds[i]!.lift - 0.5) * 9,
        z: 0.5 + seeds[i]!.speed * 2.2,
      })),
    [seeds],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERT,
        fragmentShader: PARTICLE_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color("#ffe9cf") },
          uOpacity: { value: 0.22 },
          uScale: { value: 16 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const b = base[i]!;
      positions[i * 3] = b.x + Math.sin(t * 0.13 + i) * 0.5;
      positions[i * 3 + 1] = b.y + Math.sin(t * 0.09 + i * 1.7) * 0.55;
      positions[i * 3 + 2] = b.z;
      alphas[i] = 0.5 + 0.5 * Math.sin(t * 0.4 + i * 2.1);
      sizes[i] = 0.35 + (i % 5) * 0.09;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function SceneReady({ on_ready }: { on_ready?: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current > 2) {
      done.current = true;
      story_progress.ready = true;
      on_ready?.();
    }
  });
  return null;
}

function SceneContent({
  tier,
  profile,
  on_ready,
}: {
  tier: QualityTier;
  profile: QualityProfile;
  on_ready?: () => void;
}) {
  const materials = useBrickMaterials();
  const shadows = tier !== "low";

  return (
    <>
      <fogExp2 attach="fog" args={["#050507", 0.02]} />

      {/* One light direction for the whole sequence, and for the baked
          textures behind it: warm low sun from the upper left. */}
      <hemisphereLight args={["#273540", "#120d0a", 0.24]} />
      <directionalLight
        position={[-9.5, 6.2, 11]}
        intensity={1.55}
        color="#ffe0bc"
        castShadow={shadows}
        shadow-mapSize-width={tier === "high" ? 2048 : 1024}
        shadow-mapSize-height={tier === "high" ? 2048 : 1024}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={13}
        shadow-camera-bottom={3}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
      {/* cool counter-light from behind right: separates arrises from the
          mortar without ever reading as a second sun */}
      <directionalLight position={[10, 2.4, -7]} intensity={0.4} color="#7fd9d2" />

      <Environment resolution={tier === "high" ? 256 : 128} frames={1}>
        <Lightformer
          intensity={2.2}
          position={[-4, 6, 6]}
          rotation={[Math.PI / 2.2, 0, -Math.PI / 5]}
          scale={[10, 4, 1]}
          color="#fff2e2"
        />
        <Lightformer
          intensity={0.9}
          position={[6, 1, 4]}
          rotation={[0, -Math.PI / 2.6, 0]}
          scale={[6, 6, 1]}
          color="#bcdbe6"
        />
        <Lightformer
          intensity={0.3}
          position={[0, -3, 3]}
          rotation={[-Math.PI / 2.4, 0, 0]}
          scale={[8, 8, 1]}
          color="#8a5a3a"
        />
      </Environment>

      <BrickWall tier={tier} materials={materials} />
      <Keystone materials={materials} />
      <GhostSocket />
      <ImpactDust />
      {profile.interaction && <AirborneDust />}

      <CameraRig />
      <SceneReady on_ready={on_ready} />
    </>
  );
}

/**
 * BrickStoryScene — the pinned, fixed, page-wide canvas.
 *
 * Nothing here is scroll-aware; it reads story_progress.p per frame. The
 * DOM does the scrolling and the CSS recession; WebGL only draws the wall.
 */
export default function BrickStoryScene({ on_ready }: { on_ready?: () => void }) {
  const tier = useMemo(() => detectQualityTier(), []);
  const profile = useMemo(() => getQualityProfile(tier), [tier]);
  const set_dpr = useRef<((dpr: number) => void) | null>(null);

  return (
    <Canvas
      dpr={profile.dpr}
      shadows={tier !== "low" ? "percentage" : false}
      camera={{ fov: FOV, position: [0.35, 19.3, 13.4], near: 0.4, far: 160 }}
      gl={{
        antialias: tier !== "low",
        alpha: true,
        powerPreference: "high-performance",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.92;
        set_dpr.current = (dpr: number) => gl.setPixelRatio(dpr);
      }}
      style={{ background: "transparent" }}
      className="!absolute !inset-0"
    >
      <PerformanceMonitor
        onDecline={() => set_dpr.current?.(1)}
        onIncline={() => set_dpr.current?.(profile.dpr[1])}
      >
        <Suspense fallback={null}>
          <SceneContent tier={tier} profile={profile} on_ready={on_ready} />
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  );
}

/** Re-exported so the story can hold the poster until the wall is drawn. */
export { story_progress };