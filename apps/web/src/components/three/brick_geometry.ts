/**
 * Canonical brick assets — ONE geometry + ONE material family shared by
 * the hero brick, the wall instances and the stage tiles.
 * Identical functions, shared caches everywhere; only transforms and
 * instance color vary.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { create_brick_texture_set, create_mortar_texture } from "./brick_textures";

/** True masonry proportions: 2.15 : 1 : 0.65 */
export const BRICK_SIZE: [number, number, number] = [2.15, 1, 0.65];
export const BRICK_BEVEL = 0.045;

let geometry_cache: THREE.BufferGeometry | null = null;

/** create_brick_geometry — the single canonical brick shape. */
export function create_brick_geometry(): THREE.BufferGeometry {
  if (!geometry_cache) {
    geometry_cache = new RoundedBoxGeometry(
      BRICK_SIZE[0],
      BRICK_SIZE[1],
      BRICK_SIZE[2],
      4,
      BRICK_BEVEL,
    );
  }
  return geometry_cache;
}

export interface brick_material_set {
  map: THREE.Texture;
  roughness_map: THREE.Texture;
  bump_map: THREE.Texture;
}

let texture_cache: brick_material_set | null = null;

/**
 * get_brick_material_maps — lazily-built shared texture set.
 * Procedural PBR of a single fired-clay face (albedo + roughness + bump).
 * Albedo is baked full-color; the material `color` stays near-white so
 * instance tints (wall variation) multiply predictably.
 */
export function get_brick_material_maps(): brick_material_set | null {
  if (typeof document === "undefined") return null;
  if (texture_cache) return texture_cache;

  const set = create_brick_texture_set();
  const map = new THREE.CanvasTexture(set.map);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;

  const roughness_map = new THREE.CanvasTexture(set.roughness_map);
  roughness_map.wrapS = roughness_map.wrapT = THREE.RepeatWrapping;
  roughness_map.anisotropy = 4;

  const bump_map = new THREE.CanvasTexture(set.bump_map);
  bump_map.wrapS = bump_map.wrapT = THREE.RepeatWrapping;
  bump_map.anisotropy = 4;

  texture_cache = { map, roughness_map, bump_map };
  return texture_cache;
}

/**
 * create_brick_material — matte fired-clay masonry.
 * High roughness, metalness 0, restrained env response: ceramic, not chrome.
 * The base texture carries the full terracotta color; `color` defaults to
 * near-white so it only tints (used by wall instances for tonal variation).
 */
export function create_brick_material(
  overrides?: Partial<{
    color: string;
    roughness: number;
    envMapIntensity: number;
    emissive: string;
    emissiveIntensity: number;
    bump_scale: number;
  }>,
): THREE.MeshStandardMaterial {
  const maps = get_brick_material_maps();
  return new THREE.MeshStandardMaterial({
    map: maps?.map,
    roughnessMap: maps?.roughness_map,
    bumpMap: maps?.bump_map,
    bumpScale: overrides?.bump_scale ?? 0.5,
    color: new THREE.Color(overrides?.color ?? "#ffffff"),
    roughness: overrides?.roughness ?? 0.96,
    metalness: 0,
    envMapIntensity: overrides?.envMapIntensity ?? 0.22,
    emissive: new THREE.Color(overrides?.emissive ?? "#000000"),
    emissiveIntensity: overrides?.emissiveIntensity ?? 0,
  });
}

let mortar_texture: THREE.Texture | null = null;

/** Shared mortar bed texture — one canvas, reused by every wall. */
export function get_mortar_texture(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  if (mortar_texture) return mortar_texture;
  const map = new THREE.CanvasTexture(create_mortar_texture());
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 2);
  map.anisotropy = 4;
  mortar_texture = map;
  return mortar_texture;
}

/**
 * create_mortar_material — the bed the courses sit on.
 *
 * Rough, unlit-looking cement: it must never compete with the brick faces,
 * only read as the joint between them (and as the dark recess behind the
 * half-brick overhangs at the ends of staggered courses).
 */
export function create_mortar_material(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: get_mortar_texture(),
    color: new THREE.Color("#8d857c"),
    roughness: 0.98,
    metalness: 0,
    envMapIntensity: 0.08,
  });
}

