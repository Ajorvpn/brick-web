"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  BRICK_SIZE,
  COURSES,
  MEDALLION,
  MEDALLION_SIZE,
  MORTAR_Z,
  SOCKET,
  STEP_X,
  STEP_Y,
  WALL_HEIGHT,
  make_wall_layout,
  wall_columns,
  type BrickVariant,
  type WallUnit,
} from "./brick_library";
import type { BrickMaterialSet } from "./brick_materials";
import { EMBLEM_LEVELS } from "./emblem_contours.generated";
import { BEATS, clamp01, impact_age, smoothstep, story_progress } from "./story_progress";
import type { QualityTier } from "@/lib/quality";

/** Emblem footprint on the keystone face (world units). */
export const EMBLEM_SIZE = 0.46;

/* ------------------------------------------------------------------ */
/* The emblem, as real geometry                                        */
/* ------------------------------------------------------------------ */

/**
 * useEmblemGeometry — the gold silhouette, extruded from the same
 * polygons the normal map was baked from (tools/bake-bricks). Two levels:
 * the sun disc underneath, the lion and its sword proud of it. Bevels are
 * small but real, so the relief catches the key light as the brick turns.
 */
export function useEmblemGeometry(scale = 1) {
  return useMemo(() => {
    const size = EMBLEM_SIZE * scale;
    return EMBLEM_LEVELS.map((level) => {
      const shapes = level.contours.map((contour) => {
        const shape = new THREE.Shape();
        contour.forEach(([x, y], i) => {
          // unit box, y down → centred, y up
          const px = (x - 0.5) * size;
          const py = (0.5 - y) * size;
          if (i === 0) shape.moveTo(px, py);
          else shape.lineTo(px, py);
        });
        shape.closePath();
        return shape;
      });
      const depth = 0.019 + 0.015 * level.height;
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.0035,
        bevelSize: 0.0045,
        bevelSegments: 2,
        curveSegments: 1,
        steps: 1,
      });
      geometry.computeVertexNormals();
      return { id: level.id, geometry, depth };
    });
  }, [scale]);
}

/* ------------------------------------------------------------------ */
/* One instanced mesh per variant                                      */
/* ------------------------------------------------------------------ */

function variant_mesh({
  units,
  material,
  geometry,
  cast_shadow,
}: {
  units: WallUnit[];
  material: THREE.Material;
  geometry: THREE.BufferGeometry;
  cast_shadow: boolean;
}) {
  return <VariantInstances key={material.uuid} units={units} material={material} geometry={geometry} cast_shadow={cast_shadow} />;
}

function VariantInstances({
  units,
  material,
  geometry,
  cast_shadow,
}: {
  units: WallUnit[];
  material: THREE.Material;
  geometry: THREE.BufferGeometry;
  cast_shadow: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    units.forEach((u, i) => {
      dummy.position.set(u.x, u.y, u.z);
      // half a degree of settle here and there: no two bricks sit true
      dummy.rotation.set(
        u.jitter[0],
        (u.mirror ? Math.PI : 0) + u.jitter[1],
        u.rot_z + u.jitter[2],
      );
      dummy.scale.set(u.sx, u.sy, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // per-unit firing: value drift plus a hair of hue, never a rainbow
      const v = 0.92 + u.tint * 0.14;
      const warm = (u.tint - 0.5) * 0.06;
      color.setRGB(v * (1 + warm), v, v * (1 - warm * 0.9));
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [units]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, Math.max(1, units.length)]}
      castShadow={cast_shadow}
      receiveShadow
      frustumCulled={false}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Mortar bed                                                          */
/* ------------------------------------------------------------------ */

const MORTAR_VERT = /* glsl */ `
  #include <common>
  #include <shadowmap_pars_vertex>

  varying vec3 vPos;
  varying float vViewZ;

  void main() {
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewZ = -mv.z;

    // The bricks are proud of this bed, so the bed has to receive their
    // shadows: without them the joints read as painted-on lines and the wall
    // looks like a texture instead of masonry.
    vec3 objectNormal = vec3(0.0, 0.0, 1.0);
    vec3 transformedNormal = normalMatrix * objectNormal;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    #include <shadowmap_vertex>

    gl_Position = projectionMatrix * mv;
  }
`;

const MORTAR_FRAG = /* glsl */ `
  precision highp float;

  #include <common>
  #include <packing>
  #include <shadowmap_pars_fragment>

  uniform vec3 uBase;
  uniform vec3 uRippleColor;
  uniform vec2 uRippleCentre;
  uniform float uRipple;
  uniform float uSoot;
  uniform vec3 uFogColor;
  uniform float uFogDensity;

  varying vec3 vPos;
  varying float vViewZ;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * vnoise(p);
      p = p * 2.03 + 11.0;
      a *= 0.5;
    }
    return s;
  }

  void main() {
    // gypsum grain, plus trowel smears that are long across and tight up
    float grain = fbm(vPos.xy * 3.6);
    float smear = fbm(vec2(vPos.x * 0.5, vPos.y * 6.5));
    vec3 col = uBase * (0.78 + grain * 0.44) * (0.9 + smear * 0.2);

    // the bed is dirtier and darker toward the foot of the wall
    float soot = smoothstep(7.0, 0.0, vPos.y + 8.5) * uSoot;
    col = mix(col, col * 0.38, soot);

    // Contact shadow from the courses above: this is what gives the bed its
    // depth. Sampled directly rather than through getShadowMask(), which
    // relies on a receiveShadow uniform only the built-in materials get.
    float lit = 1.0;
    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
      DirectionalLightShadow dl = directionalLightShadows[ 0 ];
      lit = getShadow(
        directionalShadowMap[ 0 ],
        dl.shadowMapSize,
        dl.shadowIntensity,
        dl.shadowBias,
        dl.shadowRadius,
        vDirectionalShadowCoord[ 0 ]
      );
    #endif
    col *= mix(0.34, 1.0, lit);

    // the ripple: one slow ring travelling out through the joints
    float d = length(vPos.xy - uRippleCentre);
    float radius = uRipple * 30.0;
    float ring = smoothstep(2.4, 0.0, abs(d - radius));
    float fade = (1.0 - uRipple) * (1.0 - uRipple);
    col += uRippleColor * ring * fade * 0.55;

    float fogFactor = 1.0 - exp(-pow(uFogDensity * vViewZ, 2.0));
    col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

function MortarBed({ width }: { width: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        lights: true,
        vertexShader: MORTAR_VERT,
        fragmentShader: MORTAR_FRAG,
        // lights: true needs the light/shadow uniform block merged in, or the
        // renderer has nowhere to write the shadow matrices at draw time.
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.lights,
          {
            receiveShadow: { value: true },
            uBase: { value: new THREE.Color("#94897a") },
            uRippleColor: { value: new THREE.Color("#3DD6C8") },
            uRippleCentre: {
              value: new THREE.Vector2(0, SOCKET[1] - WALL_HEIGHT / 2),
            },
            uRipple: { value: 0 },
            uSoot: { value: 0.32 },
            uFogColor: { value: new THREE.Color("#050507") },
            uFogDensity: { value: 0.052 },
          },
        ]),
      }),
    [],
  );

  useFrame(() => {
    material.uniforms.uRipple!.value = impact_age(story_progress.p);
  });

  return (
    <mesh position={[0, WALL_HEIGHT / 2, MORTAR_Z]} material={material}>
      <planeGeometry args={[width + STEP_X * 3, WALL_HEIGHT + STEP_Y]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* The frieze medallion                                                */
/* ------------------------------------------------------------------ */

function Medallion({ materials, tier }: { materials: BrickMaterialSet; tier: QualityTier }) {
  const emblem = useEmblemGeometry(1.12);
  const plaque = materials.medallionGlaze;
  const gold = materials.gold;

  useFrame(() => {
    const p = story_progress.p;
    // The frieze answers the keystone: a restrained emissive breath that
    // travels left to right as the camera pulls back.
    const breath = smoothstep(BEATS.revealStart, BEATS.revealStart + 0.1, p);
    const settle = 1 - smoothstep(0.78, 0.9, p);
    plaque.emissiveIntensity = breath * settle * 0.55;
    gold.emissiveIntensity = 0.35 + breath * settle * 0.85;
  });

  return (
    <group position={MEDALLION}>
      {/* glazed plaque over the six turquoise units — inset just far enough
          that the bed of glazed brick reads around it */}
      <mesh position={[0, 0, 0.0]} castShadow={tier !== "low"} receiveShadow>
        <boxGeometry args={[MEDALLION_SIZE[0] - 1.2, MEDALLION_SIZE[1] - 0.14, 0.08, 1, 1, 1]} />
        <primitive object={plaque} attach="material" />
      </mesh>
      {/* gold inlay ring, then the emblem itself */}
      <mesh position={[0, 0, 0.06]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.38, 0.014, 10, 64]} />
        <primitive object={gold} attach="material" />
      </mesh>
      {emblem.map((level) => (
        <mesh
          key={level.id}
          geometry={level.geometry}
          position={[0, 0, 0.05]}
          castShadow={false}
        >
          <primitive object={gold} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* The wall                                                            */
/* ------------------------------------------------------------------ */

export function BrickWall({
  tier,
  materials,
}: {
  tier: QualityTier;
  materials: BrickMaterialSet;
}) {
  const { width, height } = useThree((s) => s.size);
  const portrait = height > width;
  const cols = wall_columns(tier, portrait);
  const layout = useMemo(() => make_wall_layout(cols), [cols]);

  const geometry = useMemo(() => {
    const g = new RoundedBoxGeometry(
      BRICK_SIZE[0],
      BRICK_SIZE[1],
      BRICK_SIZE[2],
      3,
      0.05,
    );
    // aoMap reads the second UV set; without it the baked occlusion is sampled
    // at one texel and every face lights identically, which is exactly what
    // made the wall read as tiles rather than set masonry.
    g.setAttribute("uv1", g.attributes.uv!);
    return g;
  }, []);

  const groups = useMemo(() => {
    const map = new Map<BrickVariant, WallUnit[]>();
    for (const unit of layout) {
      if (unit.medallion) continue; // the medallion gets its own mesh
      const list = map.get(unit.variant) ?? [];
      list.push(unit);
      map.set(unit.variant, list);
    }
    return [...map.entries()];
  }, [layout]);

  const medallion_units = useMemo(
    () => layout.filter((u) => u.medallion),
    [layout],
  );

  /** left / centre / right columns of the glazed bed */
  const medallion_columns = useMemo(() => {
    const buckets: WallUnit[][] = [[], [], []];
    for (const unit of medallion_units) {
      const index = unit.x < -0.5 ? 0 : unit.x > 0.5 ? 2 : 1;
      buckets[index]!.push(unit);
    }
    return buckets;
  }, [medallion_units]);

  useFrame(() => {
    const p = story_progress.p;
    // left to right, a beat apart — the frieze answering the keystone
    materials.medallionGroups.forEach((material, i) => {
      const start = BEATS.revealStart + 0.02 + i * 0.045;
      const pulse =
        smoothstep(start, start + 0.06, p) * (1 - smoothstep(0.8, 0.92, p));
      material.emissiveIntensity = pulse * 0.45;
    });
  });

  return (
    <group name="wall">
      <MortarBed width={cols * STEP_X} />

      {groups.map(([variant, units]) =>
        variant_mesh({
          units,
          material: materials.variants[variant],
          geometry,
          cast_shadow: tier !== "low",
        }),
      )}

      {/* the six glazed units the medallion is mounted on */}
      {medallion_columns.map((units, i) =>
        units.length > 0
          ? variant_mesh({
              units,
              material: materials.medallionGroups[i]!,
              geometry,
              cast_shadow: tier !== "low",
            })
          : null,
      )}

      <Medallion materials={materials} tier={tier} />
    </group>
  );
}

/** Exported for the tests: the wall is 24 courses tall, whatever the width. */
export const WALL_COURSES = COURSES;
export { clamp01 };