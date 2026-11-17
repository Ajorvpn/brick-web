"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import type { BrickVariant } from "./brick_library";

/**
 * Every map the scene draws with, all baked by tools/bake-bricks.
 *
 * The clay set is atlased: one albedo atlas with six fired tones, and three
 * face atlases (normal / roughness / AO) with eight faces each. One texture
 * per role is uploaded once; each variant's material is a clone of the map
 * with an offset/repeat window onto its own cell, so per-variant faces cost
 * no extra VRAM and no extra draw call beyond the variant's own instanced
 * mesh.
 */
export const BRICK_TEXTURE_URLS = {
  clayAlbedo: "/bricks/clay-albedo.webp",
  clayNormal: "/bricks/clay-normal.webp",
  clayRoughness: "/bricks/clay-roughness.webp",
  clayAO: "/bricks/clay-ao.webp",
  glazeAlbedo: "/bricks/glaze-albedo.webp",
  glazeNormal: "/bricks/glaze-normal.webp",
  glazeRoughness: "/bricks/glaze-roughness.webp",
  keystoneAlbedo: "/bricks/keystone-albedo.webp",
  keystoneNormal: "/bricks/keystone-normal.webp",
  keystoneRoughness: "/bricks/keystone-roughness.webp",
  keystoneAO: "/bricks/keystone-ao.webp",
} as const;

const ALBEDO_ROWS = 6;
const FACE_ROWS = 8;

/** tone cell (albedo atlas) + face cell (normal/rough/AO atlases) */
const VARIANT_CELLS: Record<BrickVariant, [number, number]> = {
  "clay-sand": [0, 0],
  "clay-warm": [1, 1],
  "clay-rose": [2, 2],
  "clay-smoked": [3, 3],
  "clay-pale": [4, 0],
  "clay-burnt": [5, 3],
  "stamp-shamseh": [1, 4],
  "stamp-rosette": [0, 5],
  "stamp-wedge": [2, 6],
  "stamp-lionsun": [1, 7],
  glaze: [0, 0],
};

function configure(t: THREE.Texture, color: boolean, anisotropy = 8) {
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = anisotropy;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** A window onto one atlas row. Shares the source, so it is a free clone. */
function cell(base: THREE.Texture, index: number, rows: number): THREE.Texture {
  const t = base.clone();
  t.repeat.set(1, 1 / rows);
  t.offset.set(0, 1 - (index + 1) / rows);
  t.needsUpdate = true;
  return t;
}

export interface BrickMaterialSet {
  variants: Record<BrickVariant, THREE.Material>;
  glaze: THREE.MeshPhysicalMaterial;
  keystone: THREE.MeshStandardMaterial;
  gold: THREE.MeshPhysicalMaterial;
  medallionGlaze: THREE.MeshPhysicalMaterial;
  /**
   * The medallion bed in three columns, so the reveal can light it left to
   * right instead of switching the whole frieze on at once.
   */
  medallionGroups: THREE.MeshPhysicalMaterial[];
  dispose: () => void;
}

/**
 * useBrickMaterials — the whole material library, built once.
 *
 * Suspends until every texture has decoded; the scene renders behind a
 * poster frame until then, so nothing pops in.
 */
export function useBrickMaterials(): BrickMaterialSet {
  const textures = useTexture(BRICK_TEXTURE_URLS);

  return useMemo(() => {
    const t = textures;
    configure(t.clayAlbedo, true);
    configure(t.clayNormal, false);
    configure(t.clayRoughness, false);
    configure(t.clayAO, false);
    configure(t.glazeAlbedo, true);
    configure(t.glazeNormal, false);
    configure(t.glazeRoughness, false);
    configure(t.keystoneAlbedo, true, 16);
    configure(t.keystoneNormal, false, 16);
    configure(t.keystoneRoughness, false, 16);
    configure(t.keystoneAO, false, 16);

    const variants = {} as Record<BrickVariant, THREE.Material>;
    const created: THREE.Material[] = [];

    (Object.keys(VARIANT_CELLS) as BrickVariant[]).forEach((variant) => {
      if (variant === "glaze") return;
      const [toneCell, faceCell] = VARIANT_CELLS[variant];
      const ao = cell(t.clayAO, faceCell, FACE_ROWS);
      ao.channel = 0; // the geometry has one UV set; use it for AO too
      const mat = new THREE.MeshStandardMaterial({
        map: cell(t.clayAlbedo, toneCell, ALBEDO_ROWS),
        normalMap: cell(t.clayNormal, faceCell, FACE_ROWS),
        roughnessMap: cell(t.clayRoughness, faceCell, FACE_ROWS),
        aoMap: ao,
        aoMapIntensity: 0.85,
        roughness: 1,
        metalness: 0,
        normalScale: new THREE.Vector2(1.15, 1.15),
        envMapIntensity: 0.35,
        color: new THREE.Color("#ffffff"),
      });
      variants[variant] = mat;
      created.push(mat);
    });

    /** Glazed brick: glaze over clay, so clearcoat sits on a rough body. */
    const glazeNormalMap = t.glazeNormal.clone();
    glazeNormalMap.needsUpdate = true;
    const glaze = new THREE.MeshPhysicalMaterial({
      map: t.glazeAlbedo,
      normalMap: glazeNormalMap,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughnessMap: t.glazeRoughness,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.1,
      color: new THREE.Color("#ffffff"),
    });
    created.push(glaze);
    variants.glaze = glaze;

    // The medallion's own glaze: same recipe, separately addressable so the
    // reveal can pulse it without lighting the whole turquoise population.
    const medallionGlaze = glaze.clone();
    medallionGlaze.emissive = new THREE.Color("#0d3f42");
    medallionGlaze.emissiveIntensity = 0;
    created.push(medallionGlaze);

    const medallionGroups = [0, 1, 2].map(() => {
      const m = glaze.clone();
      m.emissive = new THREE.Color("#3DD6C8");
      m.emissiveIntensity = 0;
      created.push(m);
      return m;
    });

    const keystone = new THREE.MeshStandardMaterial({
      map: t.keystoneAlbedo,
      normalMap: t.keystoneNormal,
      normalScale: new THREE.Vector2(1, 1),
      roughnessMap: t.keystoneRoughness,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.5,
    });
    created.push(keystone);

    /** Antique gold: only the keystone emblem and the medallion's inlay. */
    const gold = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#C9A24B"),
      metalness: 1,
      roughness: 0.32,
      clearcoat: 0.25,
      clearcoatRoughness: 0.35,
      envMapIntensity: 1.5,
      emissive: new THREE.Color("#3a2a0c"),
      emissiveIntensity: 0.35,
    });
    created.push(gold);

    return {
      variants,
      glaze,
      keystone,
      gold,
      medallionGlaze,
      medallionGroups,
      dispose: () => created.forEach((m) => m.dispose()),
    };
  }, [textures]);
}