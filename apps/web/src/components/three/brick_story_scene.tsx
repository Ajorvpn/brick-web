"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Brick } from "./glass_brick";
import { BrickWall } from "./brick_wall";
import {
  detectQualityTier,
  getQualityProfile,
  type QualityProfile,
} from "@/lib/quality";

export interface brick_story_scene_props {
  /** 0..1 hero journey (hero pose → seated in wall) */
  story_ref: { current: number };
  /** 0..1 wall assembly */
  build_ref: { current: number };
}

/**
 * CameraRig — cinematic but controlled:
 *   0.00  wide product composition
 *   0.35  subtle approach
 *   0.65  gentle orbit following the brick toward the wall
 *   1.00  stabilized on the wall face
 */
function CameraRig({ story_ref }: { story_ref: { current: number } }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const is_portrait =
    typeof window !== "undefined" && window.innerHeight > window.innerWidth;
  useFrame(({ camera }, delta) => {
    const s = THREE.MathUtils.clamp(story_ref.current, 0, 1);
    const d = Math.min(delta, 0.1);
    target.set(
      THREE.MathUtils.lerp(0.15, 0.0, s) + Math.sin(s * Math.PI) * 0.55,
      THREE.MathUtils.lerp(0.45, 0.1, s),
      THREE.MathUtils.lerp(6.4, 5.1, s),
    );
    camera.position.x = THREE.MathUtils.damp(camera.position.x, target.x, 2.6, d);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.y, 2.6, d);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, target.z, 2.6, d);
    look.set(
      THREE.MathUtils.lerp(is_portrait ? 0.3 : 0.55, 0, s),
      THREE.MathUtils.lerp(0, -0.35, s),
      0,
    );
    camera.lookAt(look);
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
      {/* product-photography lighting: large soft key, cool fill, warm bounce */}
      <ambientLight intensity={0.24} color="#f5efe8" />
      <directionalLight
        position={[5, 7, 5]}
        intensity={1.05}
        color="#ffeedd"
      />
      <directionalLight position={[-6, 2, 3]} intensity={0.28} color="#8fa3cf" />
      {/* warm environmental bounce — the room lit by the brick */}
      <pointLight
        position={[2.2, -1.8, 2.6]}
        intensity={0.55}
        distance={9}
        color="#a44f28"
      />
      <spotLight
        position={[0, 8, 5]}
        angle={0.55}
        penumbra={1}
        intensity={0.5}
        color="#f2ebe2"
      />

      <Brick profile={profile} story_ref={story_ref} />
      <BrickWall
        profile={profile}
        build_ref={build_ref}
        seat_ref={story_ref}
      />

      <ContactShadows
        position={[0, -2.15, -0.4]}
        opacity={0.5}
        scale={16}
        blur={2.6}
        far={5}
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

      <CameraRig story_ref={story_ref} />
    </>
  );
}

/**
 * BrickStoryScene — the pinned scroll-story canvas.
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
        position: is_portrait ? [0, 0.5, 8.3] : [0.15, 0.45, 6.4],
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
