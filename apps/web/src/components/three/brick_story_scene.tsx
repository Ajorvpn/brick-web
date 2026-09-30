"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Brick } from "./glass_brick";
import {
  BrickWall,
  WALL_BASE_Y,
  WALL_HEIGHT,
  STEP_Y,
  WALL_Z,
} from "./brick_wall";
import { BRICK_SIZE } from "./brick_geometry";
import {
  detectQualityTier,
  getQualityProfile,
  type QualityProfile,
} from "@/lib/quality";

export interface brick_story_scene_props {
  /** 0..1 hero journey (hero pose → seated in the base course) */
  story_ref: { current: number };
  /** 0..1 wall assembly, course by course, bottom-up */
  build_ref: { current: number };
}

/**
 * How far the camera climbs over a full build.
 *
 * The wall is anchored at WALL_BASE_Y and grows upward, so a fixed camera
 * would lose the top of the wall off the top of the frame. Climbing by a
 * little LESS than the wall grows gives the intended read: the newest course
 * stays framed while the older courses slide out of the bottom of the frame —
 * the structure grows past the viewer rather than the viewer flying over it.
 */
const BUILD_RISE = (WALL_HEIGHT - STEP_Y) * 0.72;
/** Slight pull-back, so a taller wall stays fully inside the frustum. */
const BUILD_PULL = -1.05;
/** Wall face the camera aims at. */
const LOOK_X = 0;

/**
 * CameraRig — two movements, both driven by scroll position only.
 *
 *   story phase (0 → 1)  the hero brick falls into the base course; the
 *                        camera holds low so the base course sits near the
 *                        bottom of the frame and the drop is the only motion
 *   build phase (0 → 1)  the camera climbs with the newest course, keeping
 *                        the active top of the wall in frame
 */
function CameraRig({
  story_ref,
  build_ref,
}: {
  story_ref: { current: number };
  build_ref: { current: number };
}) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const look_at = useMemo(() => new THREE.Vector3(), []);
  const is_portrait =
    typeof window !== "undefined" && window.innerHeight > window.innerWidth;

  useFrame(({ camera }, delta) => {
    const story = THREE.MathUtils.clamp(story_ref.current, 0, 1);
    const build = THREE.MathUtils.clamp(build_ref.current, 0, 1);
    const d = Math.min(delta, 0.1);

    // Base pose: low enough that the base course sits at the bottom edge.
    const base_y = is_portrait ? 0.32 : 0.45;
    const base_z = is_portrait ? 7.4 : 6.4;
    const base_x = is_portrait ? 0 : 0.15;

    // Story: a slow approach while the hero brick falls.
    const approach = Math.sin(story * Math.PI) * (is_portrait ? 0.25 : 0.42);

    target.set(
      base_x + approach * 0.35,
      base_y + BUILD_RISE * build,
      base_z - approach + BUILD_PULL * build,
    );

    camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, 2.6, d);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, 2.6, d);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, 2.6, d);

    // The aim rises with the camera but a touch slower, so the newest course
    // sits in the upper half of the frame and the base slides away below it.
    // At build 0 the aim sits ~1.15 units ABOVE the base course, which places
    // the base course in the lower third of the viewport — the wall is
    // anchored to the bottom of the screen, and everything grows up from it.
    look.set(
      LOOK_X + (is_portrait ? 0.3 : 0.55) * (1 - story) * (1 - build),
      WALL_BASE_Y + BRICK_SIZE[1] / 2 + 1.15 + BUILD_RISE * build * 0.94,
      WALL_Z + 1.6,
    );
    look_at.lerp(look, 0.16);
    camera.lookAt(look_at);
  });

  return null;
}

function SceneContent({
  profile,
  story_ref,
  build_ref,
}: brick_story_scene_props & { profile: QualityProfile }) {
  return (
    <>
      {/* product-photography lighting: soft key from the upper right, cool
          rim from behind so brick edges and the mortar recesses separate,
          warm bounce from the wall itself */}
      <ambientLight intensity={0.2} color="#f5efe8" />
      <directionalLight
        position={[6.2, 6.4, 4.2]}
        intensity={1.15}
        color="#ffe9d8"
      />
      {/* rim / kicker: rakes across the faces so bevels read */}
      <directionalLight position={[-6.5, 1.4, -3.2]} intensity={0.42} color="#8fa3cf" />
      <directionalLight position={[-2.4, -3.6, 2.2]} intensity={0.16} color="#f2c6a8" />
      {/* warm environmental bounce at the foot of the wall */}
      <pointLight
        position={[1.8, WALL_BASE_Y + 0.4, WALL_Z + 2.4]}
        intensity={0.5}
        distance={11}
        color="#a44f28"
      />
      <spotLight
        position={[0, 8, 5]}
        angle={0.55}
        penumbra={1}
        intensity={0.42}
        color="#f2ebe2"
      />

      {/* the hero brick — falls into the base course during the story phase */}
      <Brick profile={profile} story_ref={story_ref} />

      {/* the wall — bottom-anchored, laid course by course above it */}
      <BrickWall profile={profile} build_ref={build_ref} />

      {/* Ambient occlusion at the foot of the wall: without it the masonry
          reads as floating, because nothing ties it to a surface. */}
      <ContactShadows
        position={[0, WALL_BASE_Y - BRICK_SIZE[1] / 2 - 0.015, WALL_Z + 0.55]}
        opacity={0.62}
        scale={16}
        blur={2.7}
        far={4.5}
        color="#000000"
      />

      {/* local studio environment — deterministic, no CDN */}
      <Environment resolution={profile.tier === "high" ? 256 : 128} frames={1}>
        <Lightformer
          intensity={2.2}
          position={[0, 5.5, 3]}
          rotation={[Math.PI / 2.1, 0, 0]}
          scale={[11, 5, 1]}
          color="#fff4ea"
        />
        <Lightformer
          intensity={1}
          position={[-5.5, 2, 2.5]}
          rotation={[0, Math.PI / 3, 0]}
          scale={[5, 8, 1]}
          color="#d5e4f2"
        />
        <Lightformer
          intensity={0.8}
          position={[5.5, -0.5, 2.5]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[4, 8, 1]}
          color="#f2c6a8"
        />
      </Environment>

      <CameraRig story_ref={story_ref} build_ref={build_ref} />
    </>
  );
}

/**
 * BrickStoryScene — the pinned scroll-story canvas.
 *
 * Starts low, framing the base course near the bottom of the viewport, and
 * climbs with the newest course as the wall is laid upward. All motion is a
 * function of scroll position, so scrubbing backwards un-builds the wall
 * exactly in reverse.
 */
export default function BrickStoryScene({
  story_ref,
  build_ref,
}: brick_story_scene_props) {
  const profile = useMemo(() => getQualityProfile(detectQualityTier()), []);
  const is_portrait =
    typeof window !== "undefined" && window.innerHeight > window.innerWidth;

  return (
    <Canvas
      dpr={profile.dpr}
      shadows={profile.tier !== "low"}
      camera={{
        position: is_portrait ? [0, 0.32, 7.4] : [0.15, 0.45, 6.4],
        fov: is_portrait ? 44 : 40,
      }}
      gl={{
        antialias: profile.tier !== "low",
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ background: "transparent" }}
      className="!absolute !inset-0"
    >
      <Suspense fallback={null}>
        <SceneContent
          profile={profile}
          story_ref={story_ref}
          build_ref={build_ref}
        />
      </Suspense>
    </Canvas>
  );
}

